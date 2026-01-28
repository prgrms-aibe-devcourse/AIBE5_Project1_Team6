import { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import TravelChecklist from "./TravelChecklist";
import TravelTips from "./TravelTips";
import "../styles/scheduledetail.css";

export default function ScheduleDetailView({ schedule }) {
    if (!schedule) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>일정 정보를 불러올 수 없습니다.</div>;
    }
    const [activeDay, setActiveDay] = useState(1);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeSection, setActiveSection] = useState("timeline"); // timeline, checklist, tips
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
            // A4 크기 설정 (px 단위, 96DPI 기준 약 3.78px/mm)
            // A4: 210mm x 297mm => 794px x 1123px
            const A4_WIDTH_PX = 794;
            const A4_HEIGHT_PX = 1123;

            // PDF용 임시 컨테이너 생성
            const pdfContainer = document.createElement('div');
            // pdf-container 클래스는 CSS 간섭을 피하기 위해 사용 (필요시)
            pdfContainer.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: ${A4_WIDTH_PX}px;
                background: white;
                font-family: 'Pretendard', 'Malgun Gothic', '맑은 고딕', sans-serif;
                color: #000;
                box-sizing: border-box;
            `;
            document.body.appendChild(pdfContainer);

            // 콘텐츠 누적 높이 추적 변수
            let currentHeight = 0;

            // 높이 측정 헬퍼 함수
            const measureElement = (elementHtml) => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = elementHtml.trim();
                const element = wrapper.firstElementChild;

                pdfContainer.appendChild(element);
                const height = element.offsetHeight;
                pdfContainer.removeChild(element);
                return height;
            };

            // 요소를 PDF 컨테이너에 추가하고 페이지 넘김을 처리하는 헬퍼 함수
            const appendElement = (elementHtml) => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = elementHtml.trim();
                const element = wrapper.firstElementChild;

                // 1. 일단 추가해서 높이를 측정
                pdfContainer.appendChild(element);
                const elementHeight = element.offsetHeight;

                // 2. 현재 페이지에서의 위치(세로 좌표) 계산
                // currentHeight는 지금까지 쌓인 전체 높이
                // pagePos는 현재 페이지(A4) 내에서의 Y좌표 (0 ~ 1123)
                const pagePos = currentHeight % A4_HEIGHT_PX;
                const remainingSpace = A4_HEIGHT_PX - pagePos;

                // 3. 페이지 넘김 판단
                // - 새 페이지의 시작점(pagePos < 10)이면 그냥 둠
                // - 남은 공간보다 요소가 더 크면 다음 페이지로 넘김
                if (pagePos > 10 && remainingSpace < elementHeight) {
                    // 추가했던 요소 제거
                    pdfContainer.removeChild(element);

                    // 남은 공간을 채울 스페이서(빈 박스) 추가
                    const spacer = document.createElement('div');
                    spacer.style.height = `${remainingSpace}px`;
                    spacer.style.width = '100%';
                    spacer.style.backgroundColor = 'white'; // 투명/흰색
                    pdfContainer.appendChild(spacer);

                    // 높이 정보 업데이트 (다음 페이지 시작으로 이동)
                    currentHeight += remainingSpace;

                    // 다음 페이지 상단 여백 추가
                    const topMargin = document.createElement('div');
                    topMargin.style.height = '30px';
                    topMargin.style.width = '100%';
                    pdfContainer.appendChild(topMargin);
                    currentHeight += 30;

                    // 요소를 다시 추가 (다음 페이지 맨 위에 위치하게 됨)
                    pdfContainer.appendChild(element);
                }

                // 높이 누적
                currentHeight += elementHeight;
            };

            // --- PDF 내용 구성 시작 ---

            // 1. 헤더 영역 (제목, 기간, 인원)
            const headerHtml = `
                <div style="padding: 40px 40px 20px;">
                    <h1 style="font-size: 32px; margin: 0 0 15px; color: #1a1a1a; font-weight: 800; line-height: 1.2;">
                        ${schedule.title || '여행 일정'}
                    </h1>
                    <div style="font-size: 15px; color: #666; margin-bottom: 8px;">
                        <span style="display:inline-block; margin-right: 6px;">📅</span> 
                        ${schedule.startDate} ~ ${schedule.endDate}
                    </div>
                    <div style="font-size: 15px; color: #666;">
                        <span style="display:inline-block; margin-right: 6px;">👥</span> 
                        총 ${schedule.people}명
                    </div>
                    <div style="margin-top: 30px; border-bottom: 2px solid #333;"></div>
                </div>
            `;
            appendElement(headerHtml);

            // 2. 일차별(Daily) 일정 순회
            dailySchedule.forEach(day => {
                // Day 헤더 HTML 생성 (디자인 수정: 검은 글씨 + 하단 녹색 선)
                const dayHeaderHtml = `
                    <div style="padding: 30px 40px 20px;">
                        <h2 style="
                            font-size: 24px;
                            color: #333;
                            margin: 0;
                            font-weight: 700;
                            border-bottom: 2px solid #66bb6a;
                            padding-bottom: 10px;
                        ">
                            Day ${day.day}
                        </h2>
                    </div>
                `;

                // 모든 아이템 HTML 생성 (디자인 수정: 한 줄 정렬 + 카테고리 우측 상단 뱃지)
                const itemsHtmls = day.items.map(item => `
                    <div style="padding: 0 40px 15px;">
                        <div style="
                            background: #f8f9fa; 
                            border-radius: 4px; 
                            padding: 16px 20px; 
                            border-left: 4px solid #66bb6a; 
                            display: flex; 
                            flex-direction: column;
                            position: relative;
                        ">
                            ${item.category ? `
                                <span style="
                                    position: absolute;
                                    right: 20px;
                                    top: 16px;
                                    font-size: 11px; 
                                    background: #e8f5e9; 
                                    color: #2e7d32; 
                                    padding: 4px 8px; 
                                    border-radius: 12px;
                                    font-weight: 600;
                                ">${item.category}</span>
                            ` : ''}

                            <div style="
                                font-weight: 700; 
                                font-size: 15px; 
                                color: #333; 
                                margin-bottom: 6px;
                                display: flex; 
                                align-items: center;
                                padding-right: 60px; /* 뱃지 공간 확보 */
                            ">
                                <span style="color: #666; margin-right: 8px;">🕒</span>
                                <span>${item.time}</span>
                                <span style="margin: 0 8px; color: #999;">-</span>
                                <span style="margin-right: 6px;">${item.emoji}</span>
                                <span>${item.title}</span>
                            </div>
                            
                            ${item.description ? `
                                <div style="
                                    font-size: 13px; 
                                    color: #666; 
                                    line-height: 1.5; 
                                    margin-left: 26px; 
                                    white-space: pre-wrap;
                                ">${item.description}</div>
                            ` : ''}
                        </div>
                    </div>
                `);

                // 통째로 묶은 전체 Day 블록 HTML
                const dayFullHtml = `
                    <div>
                        ${dayHeaderHtml}
                        ${itemsHtmls.join('')}
                    </div>
                `;

                // 1. 전체 블록 높이와 현재 페이지 남은 공간 측정
                const dayHeight = measureElement(dayFullHtml);
                const pagePos = currentHeight % A4_HEIGHT_PX;
                const remainingSpace = A4_HEIGHT_PX - pagePos;

                // 임계값: 공간이 이보다 많이 남았는데 넘어가면 아깝다 (약 1/4 페이지)
                const GAP_THRESHOLD = 300;

                // 로직 결정
                // Case A: 현재 페이지에 다 들어감 -> 통째로 추가
                if (dayHeight <= remainingSpace) {
                    appendElement(dayFullHtml);
                }
                // Case B: 다 안 들어가지만, 넘기기엔 남은 공간이 너무 큼(아까움) OR Day가 너무 길어서 어차피 잘라야 함
                // -> 쪼개서 채움
                else if (remainingSpace > GAP_THRESHOLD || dayHeight > A4_HEIGHT_PX) {
                    // 헤더+첫아이템 고아 방지 로직
                    const headerHeight = measureElement(dayHeaderHtml);
                    const firstItemHeight = itemsHtmls.length > 0 ? measureElement(itemsHtmls[0]) : 0;

                    // 남은 공간이 헤더+첫아이템보다 작다면 (근데 300px보다 큰데 이게 작을 수 있나? 헤더+아이템이 클 수 있음)
                    // 만약 그렇다면 여기서 강제 스페이싱을 줘서 넘겨버림
                    if (remainingSpace < (headerHeight + firstItemHeight)) {
                        const spacer = document.createElement('div');
                        spacer.style.height = `${remainingSpace}px`;
                        spacer.style.width = '100%';
                        spacer.style.backgroundColor = 'white';
                        pdfContainer.appendChild(spacer);
                        currentHeight += remainingSpace;

                        // 다음 페이지 상단 여백
                        const topMargin = document.createElement('div');
                        topMargin.style.height = '30px';
                        topMargin.style.width = '100%';
                        pdfContainer.appendChild(topMargin);
                        currentHeight += 30;
                    }

                    // 분할 추가 시작
                    appendElement(dayHeaderHtml);
                    itemsHtmls.forEach(html => appendElement(html));
                }
                // Case C: 다 안 들어가고, 남은 공간도 적음 (깔끔하게 넘기는게 나음)
                // -> 통째로 추가 시도 (appendElement 내부 로직에 의해 자동으로 다음 페이지로 넘어감)
                else {
                    appendElement(dayFullHtml);
                }
            });

            // 3. 푸터 (브랜드 서명)
            const footerHtml = `
                <div style="
                    margin-top: 50px; 
                    text-align: center; 
                    font-size: 14px; 
                    color: #999; 
                    font-weight: 500;
                    font-style: italic;
                    padding-bottom: 30px;
                    font-family: 'Pretendard', sans-serif;
                ">
                    Walk your path, Fly your dream — Walk2Fly ✈️
                </div>
            `;
            appendElement(footerHtml);

            // --- HTML 구성 완료 ---

            // HTML을 이미지로 변환 (html2canvas)
            const canvas = await html2canvas(pdfContainer, {
                scale: 2, // 해상도 2배 (선명하게)
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            document.body.removeChild(pdfContainer);

            // PDF 생성 (jsPDF)
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 가로 (mm)
            const pageHeight = 297; // A4 세로 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // 비율에 맞춘 전체 이미지 높이

            let heightLeft = imgHeight;
            let position = 0;

            // 첫 페이지 출력
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 내용이 다음 페이지로 넘어가는 경우 루프
            while (heightLeft > 0) {
                position = heightLeft - imgHeight; // 다음 페이지에서의 이미지 시작 Y좌표 (항상 음수)
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
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
