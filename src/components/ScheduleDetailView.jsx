import { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import TravelChecklist from "./TravelChecklist";
import TravelTips from "./TravelTips";
import "../styles/scheduledetail.css";

export default function ScheduleDetailView({ schedule }) {
    const [activeDay, setActiveDay] = useState(1);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeSection, setActiveSection] = useState("timeline"); // timeline, checklist, tips
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Parse schedule text into day-separated data
    const parseDailySchedule = (text) => {
        if (!text) return [];

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
                    
                    ${dailySchedule.map(day => `
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
                    `).join('')}
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



    const dailySchedule = parseDailySchedule(schedule.scheduleText);

    if (dailySchedule.length === 0) {
        return (
            <div className="scheduleDetailEmpty">
                <p className="emptyText">작성된 일정이 없습니다.</p>
            </div>
        );
    }

    const currentDayData = dailySchedule.find(d => d.day === activeDay) || dailySchedule[0];

    return (
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
                    {/* Day Tabs */}
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
                        {currentDayData.items.map((item, index) => (
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
            )}

            {/* Checklist Section */}
            {activeSection === "checklist" && (
                <div className="sectionContent">
                    <TravelChecklist />
                </div>
            )}

            {/* Tips Section */}
            {activeSection === "tips" && (
                <div className="sectionContent">
                    <TravelTips />
                </div>
            )}
        </div>
    );
}
