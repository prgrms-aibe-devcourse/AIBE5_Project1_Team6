import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import TravelChecklist from "./TravelChecklist";
import TravelTips from "./TravelTips";
import { useAuthStore } from "../stores/authStore";
import { communityService } from "../services/communityService";
import "../styles/scheduledetail.css";

export default function ScheduleDetailView({ schedule }) {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    if (!schedule) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>일정 정보를 불러올 수 없습니다.</div>;
    }
    const [activeDay, setActiveDay] = useState(1);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeSection, setActiveSection] = useState("timeline"); // timeline, checklist, tips
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showShareConfirm, setShowShareConfirm] = useState(false);
    const [showShareSuccess, setShowShareSuccess] = useState(false);

    // Parse schedule text into day-separated data
    const parseDailySchedule = (text) => {
        if (!text || typeof text !== 'string') {
            // console.warn('Invalid schedule text:', text); // 디버깅용
            return [];
        }

        try {
            const days = [];
            const dayBlocks = text.split(/\[Day \d+\]/g).filter(block => block.trim());

            dayBlocks.forEach((block, dayIndex) => {
                const lines = block.split("\n").filter(line => line.trim());
                const items = [];

                let currentItem = null;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    // Check if line starts with time (e.g., "09:00 - 🌅 섭지코지")
                    const timeMatch = line.match(/^(\d{2}:\d{2})\s*[-–]\s*(.+)/);

                    if (timeMatch) {
                        if (currentItem) {
                            items.push(currentItem);
                        }

                        const [_, time, content] = timeMatch;
                        const emojiMatch = content.match(/^([^\s]+)\s+(.+)/);

                        currentItem = {
                            time,
                            emoji: emojiMatch ? emojiMatch[1] : "📍",
                            title: emojiMatch ? emojiMatch[2] : content,
                            description: "",
                            category: getCategoryFromEmoji(emojiMatch ? emojiMatch[1] : "📍"),
                        };
                    } else if (currentItem && line) {
                        // This is a description line
                        currentItem.description += (currentItem.description ? " " : "") + line;
                    }
                }

                if (currentItem) {
                    items.push(currentItem);
                }

                if (items.length > 0) {
                    days.push({
                        day: dayIndex + 1,
                        items,
                    });
                }
            });

            return days;
        } catch (error) {
            console.error("Schedule parsing error:", error);
            return [];
        }
    };

    const getCategoryFromEmoji = (emoji) => {
        const categories = {
            "🌅": "자연",
            "☕": "카페",
            "🚴": "액티비티",
            "🌲": "자연",
            "🍰": "음식",
            "💆": "휴식",
            "✨": "관광",
            "🌊": "해변",
            "🦞": "맛집",
            "🎨": "문화",
            "🌉": "야경",
            "🏯": "관광",
            "🍵": "카페",
            "🗼": "관광",
            "🐟": "맛집",
            "🥞": "음식",
            "🍻": "식당",
            "🥘": "맛집",
            "🍜": "맛집",
            "🍝": "맛집",
            "🦐": "맛집",
            "⛰️": "액티비티",
            "🕳️": "액티비티",
            "🏄": "액티비티",
            "😴": "휴식",
            "🧘": "휴식",
            "🕉️": "휴식",
            "🎵": "문화",
            "♨️": "휴식",
            "📚": "문화",
            "🎬": "문화",
            "🌺": "자연",
            "🍱": "음식",
            "💧": "자연",
            "🍖": "맛집",
            "🛍️": "쇼핑",
            "🚣": "액티비티",
            "🏖️": "해변",
            "🥗": "음식",
            "🥑": "음식",
            "🥾": "액티비티",
            "🗼": "관광",
            "🏐": "액티비티",
            "🍔": "맛집",
            "🏃": "액티비티",
            "🥐": "음식",
            "🍶": "음식",
            "🥩": "맛집",
            "🍲": "맛집",
            "🍢": "맛집",
            "🍡": "음식",
            "🏛️": "문화",
            "🥁": "문화",
            "🌳": "자연",
            "🏢": "관광",
            "✈️": "관광",
        };
        return categories[emoji] || "기타";
    };
    const toggleExpand = (dayIndex, itemIndex) => {
        const key = `${dayIndex}-${itemIndex}`;
        setExpandedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };


    // PDF 생성 함수 (html2canvas 사용)
    const generatePDF = async () => {
        if (isGeneratingPDF) return;

        setIsGeneratingPDF(true);
        const toastId = toast.loading("PDF 만드는 중이에요...");

        try {
            // PDF용 임시 컨테이너 생성
            const pdfContainer = document.createElement('div');
            pdfContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: 210mm;
                background: white;
                padding: 20px;
                font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
                color: #000;
            `;

            // PDF 내용 생성
            pdfContainer.innerHTML = `
                <div style="padding: 20px;">
                    <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${schedule.title || '여행 일정'}</h1>
                    <p style="font-size: 14px; margin: 5px 0; color: #666;">📅 기간: ${schedule.startDate} ~ ${schedule.endDate}</p>
                    <p style="font-size: 14px; margin: 5px 0 30px; color: #666;">👥 인원: ${schedule.people}명</p>
                    
                    ${dailySchedule.length > 0 ? dailySchedule.map(day => `
                        <div style="margin-bottom: 30px; page-break-inside: avoid;">
                            <h2 style="font-size: 18px; margin: 20px 0 15px; color: #333; border-bottom: 2px solid #66bb6a; padding-bottom: 8px;">Day ${day.day}</h2>
                            ${day.items.map(item => `
                                <div style="margin: 15px 0 15px 10px; padding: 12px; background: #f5f5f5; border-left: 3px solid #66bb6a;">
                                    <div style="font-size: 14px; font-weight: 700; color: #333; margin-bottom: 8px;">
                                        🕒 ${item.time} - ${item.emoji} ${item.title}
                                    </div>
                                    ${item.description ? `
                                        <div style="font-size: 12px; color: #666; line-height: 1.6; margin-left: 20px;">
                                            ${item.description}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `).join('') : `
                        <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 8px;">
                            ${schedule.scheduleText ? schedule.scheduleText.replace(/\n/g, '<br/>') : '일정 내용이 없습니다.'}
                        </div>
                    `}
                </div>
            `;

            document.body.appendChild(pdfContainer);

            // HTML을 캔버스로 변환
            const canvas = await html2canvas(pdfContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            document.body.removeChild(pdfContainer);

            // PDF 생성
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // 첫 페이지
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= 297; // A4 height in mm

            // 추가 페이지 (필요시)
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= 297;
            }

            // PDF를 Blob으로 생성
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const fileName = `${schedule.title || "여행일정"}_일정표.pdf`;

            // PDF 다운로드
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = fileName;
            link.click();

            // 성공 토스트 (파일 열기/공유하기 버튼 포함)
            toast.success(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontWeight: 600 }}>✅ PDF 저장 완료!</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    window.open(pdfUrl, '_blank');
                                    toast.dismiss(t.id);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #66bb6a',
                                    background: '#66bb6a',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                📄 파일 열기
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([], 'test.pdf')] })) {
                                            // Web Share API 지원 (모바일)
                                            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                                            await navigator.share({
                                                files: [file],
                                                title: schedule.title || '여행 일정',
                                                text: '여행 일정표를 공유합니다'
                                            });
                                        } else {
                                            // 데스크톱: 이메일로 공유
                                            const emailSubject = encodeURIComponent(`${schedule.title || '여행 일정'} - 일정표`);
                                            const emailBody = encodeURIComponent(
                                                `${schedule.title || '여행 일정'} 일정표를 첨부합니다.\n\n` +
                                                `기간: ${schedule.startDate} ~ ${schedule.endDate}\n` +
                                                `인원: ${schedule.people}명\n\n` +
                                                `※ 다운로드된 PDF 파일을 이메일에 첨부해주세요.`
                                            );

                                            // 이메일 클라이언트 열기
                                            window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;

                                            toast.success('이메일 앱이 열립니다. 다운로드된 PDF를 첨부해주세요!', {
                                                duration: 5000
                                            });
                                        }
                                    } catch (err) {
                                        if (err.name !== 'AbortError') {
                                            console.error('공유 실패:', err);
                                        }
                                    }
                                    toast.dismiss(t.id);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(102, 187, 106, 0.3)',
                                    background: 'transparent',
                                    color: '#66bb6a',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                🔗 공유하기
                            </button>
                        </div>
                    </div>
                ),
                {
                    id: toastId,
                    duration: 10000, // 10초 동안 표시
                    style: {
                        minWidth: '300px'
                    }
                }
            );

            // 10초 후 blob URL 해제
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 10000);
        } catch (error) {
            console.error("PDF 생성 실패:", error);
            toast.error("PDF 생성에 실패했습니다.", { id: toastId });
        } finally {
            setIsGeneratingPDF(false);
        }
    };



    // 커뮤니티 공유 함수 - 모달 트리거로 변경
    const triggerShareConfirm = () => {
        if (!user) {
            toast.error("로그인이 필요한 기능입니다.");
            return;
        }
        setShowShareConfirm(true);
    };

    const handleShareToCommunity = async () => {
        setShowShareConfirm(false);
        const loadingToast = toast.loading("커뮤니티로 여행기를 보내고 있어요...");
        try {
            const postData = {
                user_id: user.id,
                category: 'free',
                title: `✨ 추천 여행: ${schedule.title}`,
                content: `안녕하세요! 제가 계획한 여행 일정을 공유합니다.\n\n📍 여행지: ${schedule.title}\n📅 기간: ${schedule.startDate} ~ ${schedule.endDate}\n👥 인원: ${schedule.people}명\n\n--- 상세 일정 ---\n${schedule.scheduleText}`,
                theme: 'healing'
            };

            const { data, error } = await communityService.createPost(postData);
            if (error) throw error;

            toast.success("자유게시판에 성공적으로 공유되었습니다!", { id: loadingToast });
            setShowShareSuccess(true);
        } catch (error) {
            console.error("Share error:", error);
            toast.error("공유에 실패했습니다.", { id: loadingToast });
        }
    };

    const dailySchedule = parseDailySchedule(schedule.scheduleText);

    if (dailySchedule.length === 0 && !schedule.scheduleText) {
        return (
            <div className="scheduleDetailEmpty">
                <p className="emptyText">작성된 일정이 없습니다.</p>
            </div>
        );
    }

    const currentDayData = dailySchedule.length > 0 ? (dailySchedule.find(d => d.day === activeDay) || dailySchedule[0]) : null;

    return (
        <>
            <div className="scheduleDetailTimeline">
                <div className="timelineHeader">
                    <div className="timelineHeaderLeft">
                        <h3>여행 일정</h3>
                        <div className="timelineInfo">
                            <span>📅 {schedule.startDate} ~ {schedule.endDate}</span>
                            <span>👥 {schedule.people}명</span>
                        </div>
                    </div>

                    {/* PDF 저장 버튼 */}
                    <button
                        className="pdfSaveBtn"
                        onClick={generatePDF}
                        disabled={isGeneratingPDF}
                    >
                        <div className="pdfIcon">📄</div>
                        <div className="pdfText">
                            <div className="pdfTitle">여행 계획을 PDF로 저장해요</div>
                            <div className="pdfDesc">프린트하거나 공유하기 편해요</div>
                        </div>
                    </button>

                    {/* 커뮤니티 공유 버튼 */}
                    <button
                        className="pdfSaveBtn"
                        onClick={triggerShareConfirm}
                        style={{ 
                            marginLeft: '12px', 
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <div className="pdfIcon">🌍</div>
                        <div className="pdfText">
                            <div className="pdfTitle" style={{ color: 'white' }}>커뮤니티에 공유하기</div>
                            <div className="pdfDesc" style={{ color: 'rgba(255,255,255,0.8)' }}>자유게시판에 일정을 자랑해보세요</div>
                        </div>
                    </button>
                </div>

                {/* Section Navigation */}
                <div className="sectionNav">
                    <button
                        className={activeSection === "timeline" ? "sectionBtn active" : "sectionBtn"}
                        onClick={() => setActiveSection("timeline")}
                    >
                        📅 타임라인
                    </button>
                    <button
                        className={activeSection === "checklist" ? "sectionBtn active" : "sectionBtn"}
                        onClick={() => setActiveSection("checklist")}
                    >
                        ✅ 체크리스트
                    </button>
                    <button
                        className={activeSection === "tips" ? "sectionBtn active" : "sectionBtn"}
                        onClick={() => setActiveSection("tips")}
                    >
                        💡 여행 팁
                    </button>
                </div>

                {/* Timeline Section */}
                {activeSection === "timeline" && (
                    <>
                        {/* Day Tabs - Only show if we have parsed days */}
                        {dailySchedule.length > 0 ? (
                            <>
                                {dailySchedule.length > 1 && (
                                    <div className="dayTabs">
                                        {dailySchedule.map((dayData) => (
                                            <button
                                                key={dayData.day}
                                                className={`dayTab ${activeDay === dayData.day ? 'active' : ''}`}
                                                onClick={() => setActiveDay(dayData.day)}
                                            >
                                                Day {dayData.day}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="timelineItems">
                                    {currentDayData?.items.map((item, index) => (
                                        <div key={index} className="timelineItem">
                                            <div className="timelineDot">
                                                <div className="dot"></div>
                                                {index < currentDayData.items.length - 1 && (
                                                    <div className="connector"></div>
                                                )}
                                            </div>

                                            <div className="timelineContent">
                                                <div className="timelineTime">
                                                    <span className="timeIcon">🕐</span>
                                                    <span className="timeText">{item.time}</span>
                                                </div>

                                                <div className="timelineCard">
                                                    <div className="cardHeader">
                                                        <div className="cardTitle">
                                                            <span className="cardEmoji">{item.emoji}</span>
                                                            <span className="cardTitleText">{item.title}</span>
                                                        </div>
                                                        <span className="cardCategory">{item.category}</span>
                                                    </div>

                                                    {item.description && (
                                                        <div className="cardBody">
                                                            <p className={`cardDescription ${expandedItems[`${activeDay}-${index}`] ? 'expanded' : ''}`}>
                                                                {item.description}
                                                            </p>
                                                            {item.description.length > 50 && (
                                                                <button
                                                                    className="expandBtn"
                                                                    onClick={() => toggleExpand(activeDay, index)}
                                                                >
                                                                    {expandedItems[`${activeDay}-${index}`] ? '간략히 보기' : '자세한 보기'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* Fallback for Freeform Markdown Text */
                            <div className="markdown-schedule-view" style={{ 
                                padding: '24px', 
                                background: '#fff', 
                                borderRadius: '16px', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                fontSize: '1rem',
                                lineHeight: '1.7',
                                color: '#333'
                            }}>
                                <ReactMarkdown 
                                    components={{
                                        h1: ({node, ...props}) => <h1 style={{fontSize: '1.5rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', marginTop: '10px', marginBottom: '20px'}} {...props} />,
                                        h2: ({node, ...props}) => <h2 style={{fontSize: '1.3rem', color: '#2563eb', marginTop: '24px', marginBottom: '16px'}} {...props} />,
                                        li: ({node, ...props}) => <li style={{marginBottom: '8px'}} {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #e5e7eb', paddingLeft: '16px', color: '#6b7280', margin: '16px 0'}} {...props} />
                                    }}
                                >
                                    {schedule.scheduleText}
                                </ReactMarkdown>
                            </div>
                        )}
                    </>
                )}

                {/* Checklist Section */}
                {activeSection === "checklist" && (
                    <div className="sectionContent">
                        <TravelChecklist 
                            key={`checklist-${schedule.id}-${user?.id || 'guest'}`}
                            destination={schedule.title} 
                            scheduleId={schedule.id} 
                        />
                    </div>
                )}

                {/* Tips Section */}
                {activeSection === "tips" && (
                    <div className="sectionContent">
                        <TravelTips />
                    </div>
                )}
            </div>

            {/* --- MZ Style Custom Modals --- */}
            <AnimatePresence>
                {/* 1. 공유 확인 모달 */}
                {showShareConfirm && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ 
                            zIndex: 2000, 
                            background: 'rgba(0,0,0,0.4)', 
                            backdropFilter: 'blur(8px)',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowShareConfirm(false)}
                    >
                        <motion.div 
                            className="mz-modal"
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'white',
                                padding: '30px',
                                borderRadius: '30px',
                                width: '90%',
                                maxWidth: '400px',
                                textAlign: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🌍</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#111' }}>커뮤니티에 자랑할까요?</h3>
                            <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                                방금 만든 멋진 일정을 <br/> 
                                <strong>자유게시판</strong>에 공유하고 칭찬받아보세요!
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setShowShareConfirm(false)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: '#f3f4f6',
                                        color: '#4b5563',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >나중에</button>
                                <button 
                                    onClick={handleShareToCommunity}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: 'white',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                                    }}
                                >지금 바로!</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. 공유 완료 모달 */}
                {showShareSuccess && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ 
                            zIndex: 2000, 
                            background: 'rgba(0,0,0,0.4)', 
                            backdropFilter: 'blur(8px)',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setShowShareSuccess(false)}
                    >
                        <motion.div 
                            className="mz-modal"
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'white',
                                padding: '30px',
                                borderRadius: '30px',
                                width: '90%',
                                maxWidth: '400px',
                                textAlign: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🚀</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#111' }}>공유 완료!</h3>
                            <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                                일정이 지구 반대편(?)까지 전송되었습니다. <br/>
                                지금 바로 커뮤니티에서 확인해보세요!
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button 
                                    onClick={() => {
                                        setShowShareSuccess(false);
                                        navigate('/community');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: 'white',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >게시글 보러가기</button>
                                <button 
                                    onClick={() => setShowShareSuccess(false)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#9ca3af',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >창 닫기</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
