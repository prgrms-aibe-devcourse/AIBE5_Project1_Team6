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

    // Calculate D-Day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date calc
    const start = new Date(schedule.startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dDayLabel = "";
    let dDayColor = "#3b82f6"; // Blue

    if (diffDays > 0) dDayLabel = `D-${diffDays}`;
    else if (diffDays === 0) dDayLabel = "D-Day";
    else {
        dDayLabel = "종료";
        dDayColor = "#9ca3af"; // Gray
    }

    return (
        <>
            <article className="scheduleCard" onClick={handleCardClick} style={{ flexDirection: 'column' }}>
                <div className="scheduleCardBody" style={{ width: '100%', paddingLeft: '20px' }}>
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

                    <div className="scheduleCardHeader" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: dDayColor, width: '72px', display: 'inline-block', textAlign: 'left' }}>
                            {dDayLabel}
                        </span>
                        <h3 className="scheduleCardTitle" style={{ paddingRight: '60px', margin: 0 }}>{schedule.title}</h3>
                    </div>

                    {/* Duration and Mood Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                            fontSize: '0.9rem',
                            color: '#64748b',
                            fontWeight: '500'
                        }}>
                            {nights}
                        </span>
                        {schedule.moodData?.mood && (
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                whiteSpace: 'nowrap'
                            }}>
                                {typeof schedule.moodData.mood === 'string' 
                                    ? schedule.moodData.mood 
                                    : schedule.moodData.mood.label || ''}
                            </span>
                        )}
                    </div>

                    {/* Date and People */}
                    <div style={{ 
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        color: '#94a3b8'
                    }}>
                        <span>{range}</span>
                        <span>{schedule.people || 2}명</span>
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
