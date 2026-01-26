import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import AccommodationRecommendations from "./AccommodationRecommendations";
import FoodRecommendations from "./FoodRecommendations";
import ScheduleDiff from "./ScheduleDiff";
import "../styles/scheduleeditor.css";

export default function ScheduleEditor({ schedule, onSave, onDelete, onCancel }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [selectedAccommodations, setSelectedAccommodations] = useState(schedule.accommodations || []);
    const [selectedRestaurants, setSelectedRestaurants] = useState(schedule.restaurants || []);
    const [formData, setFormData] = useState({
        title: schedule.title || "",
        description: schedule.description || "",
        startDate: schedule.startDate || "",
        endDate: schedule.endDate || "",
        people: schedule.people || 1,
        scheduleText: schedule.scheduleText || "",
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave({
            ...schedule,
            ...formData,
            accommodations: selectedAccommodations,
            restaurants: selectedRestaurants,
        });
    };

    const handleShowDiff = () => {
        setShowDiff(true);
    };

    const handleAccommodationSelect = (accommodation) => {
        setSelectedAccommodations(prev => [...prev, accommodation]);
    };

    const handleAccommodationDeselect = (id) => {
        setSelectedAccommodations(prev => prev.filter(a => a.id !== id));
    };

    const handleRestaurantSelect = (restaurant) => {
        setSelectedRestaurants(prev => [...prev, restaurant]);
    };

    const handleRestaurantDeselect = (id) => {
        setSelectedRestaurants(prev => prev.filter(r => r.id !== id));
    };

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete(schedule.id);
        setShowDeleteConfirm(false);
    };

    // Parse daily schedule from text
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
                const timeMatch = line.match(/^(\d{2}:\d{2})\s*[-–]\s*(.+)/);

                if (timeMatch) {
                    if (currentItem) items.push(currentItem);
                    const [_, time, content] = timeMatch;
                    const emojiMatch = content.match(/^([^\s]+)\s+(.+)/);

                    currentItem = {
                        time,
                        emoji: emojiMatch ? emojiMatch[1] : "📍",
                        title: emojiMatch ? emojiMatch[2] : content,
                        description: "",
                    };
                } else if (currentItem && line) {
                    currentItem.description += (currentItem.description ? " " : "") + line;
                }
            }

            if (currentItem) items.push(currentItem);
            if (items.length > 0) {
                days.push({ day: dayIndex + 1, items });
            }
        });

        return days;
    };

    const [dailySchedule] = useState(() => parseDailySchedule(formData.scheduleText));
    const [activeDay, setActiveDay] = useState(1);

    const currentDayData = dailySchedule.find(d => d.day === activeDay) || dailySchedule[0];

    return (
        <div className="editorOverlay" onClick={onCancel}>
            <div className="editorModal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="editorHeader">
                    <h2 className="editorTitle">✏️ 일정 수정하기</h2>
                    <button className="editorCloseBtn" onClick={onCancel}>✕</button>
                </div>

                {/* Basic Info Form */}
                <div className="editorBasicInfo">
                    <div className="editorFormGroup">
                        <label className="editorLabel">여행 제목</label>
                        <input
                            type="text"
                            className="editorInput"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="예: 제주도 힐링 여행"
                        />
                    </div>

                    <div className="editorFormGroup">
                        <label className="editorLabel">설명</label>
                        <textarea
                            className="editorTextarea"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="여행에 대한 간단한 설명을 입력하세요"
                            rows="2"
                        />
                    </div>

                    <div className="editorFormRow">
                        <div className="editorFormGroup">
                            <label className="editorLabel">시작일</label>
                            <input
                                type="date"
                                className="editorInput"
                                value={formData.startDate}
                                onChange={(e) => handleChange("startDate", e.target.value)}
                            />
                        </div>
                        <div className="editorFormGroup">
                            <label className="editorLabel">종료일</label>
                            <input
                                type="date"
                                className="editorInput"
                                value={formData.endDate}
                                onChange={(e) => handleChange("endDate", e.target.value)}
                            />
                        </div>
                        <div className="editorFormGroup">
                            <label className="editorLabel">인원</label>
                            <input
                                type="number"
                                className="editorInput"
                                value={formData.people}
                                onChange={(e) => handleChange("people", parseInt(e.target.value))}
                                min="1"
                                max="20"
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="editorTimeline">
                    <h3 className="editorSectionTitle">📅 일정 세부사항</h3>

                    {/* Day Tabs */}
                    {dailySchedule.length > 1 && (
                        <div className="editorDayTabs">
                            {dailySchedule.map((dayData) => (
                                <button
                                    key={dayData.day}
                                    className={`editorDayTab ${activeDay === dayData.day ? 'active' : ''}`}
                                    onClick={() => setActiveDay(dayData.day)}
                                >
                                    Day {dayData.day}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timeline Items */}
                    {currentDayData && (
                        <div className="editorTimelineItems">
                            {currentDayData.items.map((item, index) => (
                                <div key={index} className="editorTimelineItem">
                                    <div className="editorTimelineDot">
                                        <div className="editorDot"></div>
                                        {index < currentDayData.items.length - 1 && (
                                            <div className="editorConnector"></div>
                                        )}
                                    </div>

                                    <div className="editorTimelineCard">
                                        <div className="editorTimelineTime">
                                            <span className="editorTimeIcon">🕐</span>
                                            <span className="editorTimeText">{item.time}</span>
                                        </div>

                                        <div className="editorCardContent">
                                            <div className="editorCardTitle">
                                                <span className="editorCardEmoji">{item.emoji}</span>
                                                <span className="editorCardTitleText">{item.title}</span>
                                            </div>
                                            {item.description && (
                                                <p className="editorCardDescription">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule Text Editor (Advanced) */}
                    <details className="editorAdvanced">
                        <summary className="editorAdvancedSummary">
                            고급 편집 (텍스트 직접 수정)
                        </summary>
                        <div className="editorFormGroup">
                            <textarea
                                className="editorTextarea"
                                value={formData.scheduleText}
                                onChange={(e) => handleChange("scheduleText", e.target.value)}
                                placeholder="일정 텍스트를 직접 편집할 수 있습니다"
                                rows="10"
                            />
                            <p className="editorHint">
                                형식: [Day 1]<br />
                                09:00 - 🌅 장소명<br />
                                &nbsp;&nbsp;활동 설명
                            </p>
                        </div>
                    </details>
                </div>

                {/* Footer Actions */}
                <div className="editorFooter">
                    <button className="editorDeleteBtn" onClick={handleDelete}>
                        🗑️ 삭제
                    </button>
                    <div className="editorFooterRight">
                        <button className="editorCancelBtn" onClick={onCancel}>
                            취소
                        </button>
                        <button className="editorSaveBtn" onClick={handleSave}>
                            ✓ 저장
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    open={showDeleteConfirm}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    title="일정 삭제"
                    message={`"${schedule.title}" 일정을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                    confirmText="삭제"
                    cancelText="취소"
                    variant="danger"
                />
            </div>
        </div>
    );
}
