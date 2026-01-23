import { useState, useEffect } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import "../styles/schedules.css";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";

function formatDateRange(startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startStr = format(start, "yyyy.MM.dd");
        const endStr = format(end, "MM.dd");
        return `${startStr} - ${endStr}`;
    } catch {
        return "날짜 오류";
    }
}

export default function ScheduleEditor({ open, schedule, onClose, onSave, onDelete }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [people, setPeople] = useState(2);
    const [scheduleText, setScheduleText] = useState("");
    const [diffResult, setDiffResult] = useState(null);

    useEffect(() => {
        if (schedule) {
            setTitle(schedule.title || "");
            setDescription(schedule.description || "");
            setStartDate(schedule.startDate || "");
            setEndDate(schedule.endDate || "");
            setPeople(schedule.people || 2);
            setScheduleText(schedule.scheduleText || "");
            setDiffResult(null);
        }
    }, [schedule]);

    if (!open || !schedule) return null;

    const handleImprove = () => {
        try {
            const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            const improved = improvePlanText({
                title,
                nights: nights > 0 ? nights : 1,
                people,
                planText: scheduleText,
                stays: [],
                foods: [],
            });

            setDiffResult(simpleDiff(scheduleText, improved));
            setScheduleText(improved);
            toast.success("AI 보완이 완료되었습니다!");
        } catch (error) {
            console.error("AI improvement error:", error);
            toast.error("AI 보완 중 오류가 발생했습니다.");
        }
    };

    const handleSave = () => {
        if (!title.trim()) {
            alert("일정 제목을 입력해주세요.");
            return;
        }

        onSave({
            ...schedule,
            title,
            description,
            startDate,
            endDate,
            people,
            scheduleText,
        });
    };

    const handleDelete = () => {
        if (confirm("정말 이 일정을 삭제하시겠습니까?")) {
            onDelete(schedule.id);
        }
    };

    return (
        <div className="scheduleEditorOverlay" onClick={onClose}>
            <div className="scheduleEditorDrawer" onClick={(e) => e.stopPropagation()}>
                <div className="scheduleEditorHeader">
                    <h2 className="scheduleEditorTitle">일정 편집</h2>
                    <button className="scheduleEditorClose" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="scheduleEditorBody">
                    {/* 기본 정보 */}
                    <div className="editorSection">
                        <h3 className="sectionTitle">기본 정보</h3>

                        <div className="formGroup">
                            <label>일정 제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="예: 부산 여행"
                            />
                        </div>

                        <div className="formGroup">
                            <label>설명</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="여행에 대한 간단한 설명"
                                rows={2}
                            />
                        </div>

                        <div className="formRow">
                            <div className="formGroup">
                                <label>시작일</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="formGroup">
                                <label>종료일</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="formGroup">
                            <label>인원 수</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={people}
                                onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        <div className="formInfo">
                            📅 {formatDateRange(startDate, endDate)} · 👥 {people}명
                        </div>
                    </div>

                    {/* 일정 상세 */}
                    <div className="editorSection">
                        <div className="sectionHeader">
                            <h3 className="sectionTitle">일정 상세</h3>
                            <button className="improveBtn" onClick={handleImprove}>
                                ✨ AI 자동 보완
                            </button>
                        </div>

                        <textarea
                            className="scheduleTextArea"
                            value={scheduleText}
                            onChange={(e) => setScheduleText(e.target.value)}
                            placeholder="여행 일정을 자유롭게 작성하세요. AI 자동 보완 기능으로 체크리스트와 팁을 추가할 수 있습니다."
                            rows={12}
                        />
                    </div>

                    {/* Diff 결과 */}
                    {diffResult && (
                        <div className="editorSection">
                            <h3 className="sectionTitle">변경 내용 미리보기</h3>
                            <pre className="diffPreview">{diffResult}</pre>
                        </div>
                    )}

                    {/* 날씨 정보 (추후 구현) */}
                    <div className="editorSection weatherSection">
                        <h3 className="sectionTitle">🌤️ 날씨 정보</h3>
                        <p className="weatherPlaceholder">
                            여행 기간의 날씨 정보와 복장 추천이 여기에 표시됩니다.
                        </p>
                    </div>
                </div>

                <div className="scheduleEditorFooter">
                    <button className="deleteBtn" onClick={handleDelete}>
                        삭제
                    </button>
                    <div className="footerRight">
                        <button className="cancelBtn" onClick={onClose}>
                            취소
                        </button>
                        <button className="saveBtn" onClick={handleSave}>
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
