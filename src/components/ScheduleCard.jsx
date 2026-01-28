import { useState } from "react";
import { format } from "date-fns";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import ConfirmModal from "./ConfirmModal";
import "../styles/schedules.css";

function formatDateRange(startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startStr = format(start, "yyyy.MM.dd");
        const endStr = format(end, "MM.dd");

        // Calculate nights
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const nights = diff > 0 ? diff : 0;

        return {
            range: `${startStr} - ${endStr}`,
            nights: `${nights}박 ${nights + 1}일`,
        };
    } catch {
        return { range: "날짜 오류", nights: "" };
    }
}

export default function ScheduleCard({ schedule, onEdit, onDelete, onClick }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { range, nights } = formatDateRange(schedule.startDate, schedule.endDate);

    // Check if mood data exists
    const hasMoodData = schedule.moodData;
    const moodEmoji = hasMoodData?.mood?.emoji || "";
    const destinationEmoji = hasMoodData?.destination?.emoji || "";
    const styleEmoji = hasMoodData?.style?.emoji || "";
    const moodLabel = hasMoodData?.mood?.label || "";
    const styleLabel = hasMoodData?.style?.label || "";

    // New Pastel/Soft Color Palette
    const cardColors = [
        '#81D4FA', // Light Green
        '#F48FB1', // Pink
        '#CE93D8', // Purple
        '#9FA8DA', // Indigo
        '#90CAF9', // Blue
        '#80CBC4', // Teal
        '#FFCC80', // Orange
    ];
    const colorIndex = (schedule.title?.charCodeAt(0) || 0) % cardColors.length;
    
    // Use user-selected mood color if available, otherwise random pastel
    const cardColor = hasMoodData ? '#5C94FF' : cardColors[colorIndex];

    const handleCardClick = () => {
        if (onClick) {
            onClick(schedule);
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(schedule);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete(schedule.id);
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <article className="scheduleCard" onClick={handleCardClick}>
                {/* Thumbnail Image */}
                <div className="scheduleCardImage" style={{ background: cardColor }}>
                    <div style={{ fontSize: hasMoodData ? "48px" : "64px", marginTop: hasMoodData ? "8px" : "0" }}>
                        {hasMoodData ? `${moodEmoji}${destinationEmoji}${styleEmoji}` : "✈️"}
                    </div>
                </div>

                <div className="scheduleCardBody">
                    {/* Top Right Actions */}
                    <div className="cardTopActions">
                        <button 
                            className="iconActionBtn edit" 
                            onClick={handleEditClick}
                            title="수정"
                        >
                            <FiEdit3 />
                        </button>
                        <button 
                            className="iconActionBtn delete" 
                            onClick={handleDeleteClick}
                            title="삭제"
                        >
                            <FiTrash2 />
                        </button>
                    </div>

                    <div className="scheduleCardHeader">
                        <h3 className="scheduleCardTitle" style={{ paddingRight: '60px' }}>{schedule.title}</h3>
                    </div>

                    <div className="scheduleCardMeta">
                        <span className="scheduleCardBadgeOnImg" style={{ position: 'static', boxShadow: 'none', background: '#f5f5f5', color: '#666', border: '1px solid #e0e0e0', padding: '2px 8px', fontSize: '11px' }}>
                            {nights}
                        </span>
                        {hasMoodData && moodLabel && (
                             <span className="scheduleCardBadgeOnImg" style={{ position: 'static', boxShadow: 'none', background: '#eef2ff', color: '#5C94FF', border: '1px solid #c7d2fe', padding: '2px 8px', fontSize: '11px' }}>
                                {moodLabel}
                            </span>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                         <div className="scheduleCardDate">
                            {range}
                        </div>
                        <div className="scheduleCardPeople">
                            {schedule.people}명
                        </div>
                    </div>
                </div>
            </article>

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
        </>
    );
}
