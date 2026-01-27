import { useState } from "react";
import { format } from "date-fns";
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

    // Solid sky blue colors instead of gradients
    const wellnessColor = '#5C94FF';
    const cardColors = [
        '#3b82f6',  // Sky Blue
        '#60a5fa',  // Light Blue
        '#5C94FF',  // Primary Blue
        '#38bdf8',  // Cyan Blue
        '#0ea5e9',  // Ocean Blue
    ];
    const colorIndex = (schedule.title?.charCodeAt(0) || 0) % cardColors.length;
    const cardGradient = hasMoodData ? wellnessColor : cardColors[colorIndex];

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
                <div className="scheduleCardImage" style={{ background: cardGradient }}>
                    <div style={{ fontSize: hasMoodData ? "48px" : "64px", marginTop: hasMoodData ? "8px" : "0" }}>
                        {hasMoodData ? `${moodEmoji}${destinationEmoji}${styleEmoji}` : "✈️"}
                    </div>
                    <div className="scheduleCardImageOverlay">
                        <span className="scheduleCardBadgeOnImg">{nights}</span>
                    </div>
                </div>

                <div className="scheduleCardBody">
                    <div className="scheduleCardHeader">
                        <h3 className="scheduleCardTitle">{schedule.title}</h3>
                        {hasMoodData && moodLabel && (
                            <div className="wellnessBadge">
                                🌿 {moodLabel}
                            </div>
                        )}
                    </div>

                    {schedule.description && (
                        <p className="scheduleCardDesc">{schedule.description}</p>
                    )}

                    <div className="scheduleCardMeta">
                        <div className="scheduleCardDate">
                            <span className="metaIcon">📅</span>
                            {range}
                        </div>
                        <div className="scheduleCardPeople">
                            <span className="metaIcon">👥</span>
                            {schedule.people}명
                        </div>
                    </div>

                    {hasMoodData && styleLabel && (
                        <div className="wellnessTags">
                            <span className="wellnessTag">
                                {styleEmoji} {styleLabel}
                            </span>
                        </div>
                    )}

                    {/* Card Actions */}
                    <div className="scheduleCardActions">
                        <button className="scheduleCardEditBtn" onClick={handleEditClick}>
                            ✏️ 수정
                        </button>
                        <button className="scheduleCardDeleteBtn" onClick={handleDeleteClick}>
                            🗑️ 삭제
                        </button>
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
