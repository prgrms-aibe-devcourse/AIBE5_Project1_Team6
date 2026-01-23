import { format } from "date-fns";
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

export default function ScheduleCard({ schedule, onClick }) {
    const { range, nights } = formatDateRange(schedule.startDate, schedule.endDate);

    return (
        <article className="scheduleCard" onClick={onClick}>
            <div className="scheduleCardHeader">
                <h3 className="scheduleCardTitle">{schedule.title}</h3>
                <div className="scheduleCardBadge">{nights}</div>
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

            {schedule.scheduleText && (
                <div className="scheduleCardPreview">
                    {schedule.scheduleText.substring(0, 100)}
                    {schedule.scheduleText.length > 100 ? "..." : ""}
                </div>
            )}
        </article>
    );
}
