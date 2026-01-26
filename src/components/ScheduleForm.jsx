import { useState } from "react";
import "../styles/schedules.css";

export default function ScheduleForm({ onSubmit, onCancel }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [people, setPeople] = useState(2);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("일정 제목을 입력해주세요.");
            return;
        }

        if (!startDate || !endDate) {
            alert("시작일과 종료일을 입력해주세요.");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert("종료일은 시작일 이후여야 합니다.");
            return;
        }

        onSubmit({
            title,
            description,
            startDate,
            endDate,
            people,
            scheduleText: "",
            weatherInfo: null,
        });
    };

    return (
        <div className="scheduleFormOverlay" onClick={onCancel}>
            <div className="scheduleFormModal" onClick={(e) => e.stopPropagation()}>
                <h2 className="scheduleFormTitle">새 일정 만들기</h2>

                <form onSubmit={handleSubmit} className="scheduleForm">
                    <div className="formGroup">
                        <label htmlFor="title">일정 제목 *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 부산 여행"
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="description">설명</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="여행에 대한 간단한 설명을 입력하세요"
                            rows={3}
                        />
                    </div>

                    <div className="formRow">
                        <div className="formGroup">
                            <label htmlFor="startDate">시작일 *</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="formGroup">
                            <label htmlFor="endDate">종료일 *</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="formGroup">
                        <label htmlFor="people">인원 수</label>
                        <input
                            id="people"
                            type="number"
                            min="1"
                            max="20"
                            value={people}
                            onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <div className="formActions">
                        <button type="button" className="cancelBtn" onClick={onCancel}>
                            취소
                        </button>
                        <button type="submit" className="submitBtn">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
