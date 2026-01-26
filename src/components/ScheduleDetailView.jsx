import { useState } from "react";
import TravelChecklist from "./TravelChecklist";
import TravelTips from "./TravelTips";
import "../styles/scheduledetail.css";

export default function ScheduleDetailView({ schedule }) {
    const [activeDay, setActiveDay] = useState(1);
    const [expandedItems, setExpandedItems] = useState({});
    const [activeSection, setActiveSection] = useState("timeline"); // timeline, checklist, tips

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
                <h3>여행 일정</h3>
                <div className="timelineInfo">
                    <span>📅 {schedule.startDate} ~ {schedule.endDate}</span>
                    <span>👥 {schedule.people}명</span>
                </div>
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
