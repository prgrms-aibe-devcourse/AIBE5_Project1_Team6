import { useState } from "react";
import "../styles/moodpalette.css";

const MOODS = [
    { id: "burnout", emoji: "😫", label: "번아웃", desc: "완벽한 쉼이 필요해요" },
    { id: "energy", emoji: "🌟", label: "활력 충전", desc: "새로운 경험을 원해요" },
    { id: "healing", emoji: "🧘", label: "힐링", desc: "마음의 평화가 필요해요" },
    { id: "adventure", emoji: "🎒", label: "모험", desc: "짜릿한 여행을 원해요" },
];

const DESTINATIONS = [
    { id: "jeju", emoji: "🏝️", label: "제주도", type: "domestic" },
    { id: "busan", emoji: "🌊", label: "부산", type: "domestic" },
    { id: "gangneung", emoji: "⛰️", label: "강릉", type: "domestic" },
    { id: "seoul", emoji: "🏙️", label: "서울", type: "domestic" },
    { id: "japan", emoji: "🗾", label: "일본", type: "international" },
    { id: "thailand", emoji: "🌴", label: "태국", type: "international" },
    { id: "bali", emoji: "🏖️", label: "발리", type: "international" },
    { id: "vietnam", emoji: "🍜", label: "베트남", type: "international" },
];

const STYLES = [
    { id: "nature", emoji: "🏞️", label: "자연", desc: "산과 바다 그리고 하늘" },
    { id: "city", emoji: "🏙️", label: "도심", desc: "활기찬 도시의 에너지" },
    { id: "food", emoji: "🍜", label: "맛집탐방", desc: "미식의 즐거움" },
    { id: "culture", emoji: "🎨", label: "문화체험", desc: "예술과 역사 탐방" },
    { id: "relax", emoji: "🛀", label: "휴식", desc: "온전한 쉼과 여유" },
    { id: "activity", emoji: "🏄", label: "액티비티", desc: "신나는 활동과 체험" },
];

export default function MoodPalette({ onComplete, onCancel }) {
    const [step, setStep] = useState(1);
    const [showCustomDestination, setShowCustomDestination] = useState(false);
    const [customDestinationText, setCustomDestinationText] = useState("");
    const [selections, setSelections] = useState({
        mood: null,
        destination: null,
        style: null,
        startDate: "",
        endDate: "",
        people: 2,
    });

    const handleMoodSelect = (mood) => {
        setSelections({ ...selections, mood });
        setTimeout(() => setStep(2), 300);
    };

    const handleDestinationSelect = (destination) => {
        setSelections({ ...selections, destination });
        setShowCustomDestination(false);
        setCustomDestinationText("");
        setTimeout(() => setStep(3), 300);
    };

    const handleCustomDestinationSubmit = () => {
        if (!customDestinationText.trim()) {
            alert("여행지를 입력해주세요.");
            return;
        }
        const customDest = {
            id: "custom",
            emoji: "🌍",
            label: customDestinationText.trim(),
            type: "custom"
        };
        setSelections({ ...selections, destination: customDest });
        setTimeout(() => setStep(3), 300);
    };

    const handleStyleSelect = (style) => {
        setSelections({ ...selections, style });
        setTimeout(() => setStep(4), 300);
    };

    const handleDetailsSubmit = (e) => {
        e.preventDefault();

        if (!selections.startDate || !selections.endDate) {
            alert("여행 날짜를 선택해주세요.");
            return;
        }

        if (new Date(selections.startDate) > new Date(selections.endDate)) {
            alert("종료일은 시작일 이후여야 합니다.");
            return;
        }

        onComplete(selections);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const progressPercent = (step / 4) * 100;

    return (
        <div className="moodPaletteOverlay" onClick={onCancel}>
            <div className="moodPaletteModal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="moodPaletteHeader">
                    <div>
                        <h2 className="moodPaletteTitle">
                            컵라면보다 빠른 여행 계획 ✨
                        </h2>
                        <p className="moodPaletteSubtitle">
                            그냥 느낌(Vibe)만 고르세요. 계획은 AI가 1초 만에!
                        </p>
                    </div>
                    <button className="moodPaletteClose" onClick={onCancel}>
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="moodPaletteProgress">
                    <div className="progressBar">
                        <div
                            className="progressFill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="progressText">
                        Step {step} / 4
                    </div>
                </div>

                {/* Step 1: Mood */}
                {step === 1 && (
                    <div className="moodPaletteStep fadeIn">
                        <h3 className="stepTitle">지금 당신의 상태는?</h3>
                        <div className="optionsGrid">
                            {MOODS.map((mood) => (
                                <button
                                    key={mood.id}
                                    className={`optionCard ${selections.mood?.id === mood.id ? "selected" : ""
                                        }`}
                                    onClick={() => handleMoodSelect(mood)}
                                >
                                    <div className="optionEmoji">{mood.emoji}</div>
                                    <div className="optionLabel">{mood.label}</div>
                                    <div className="optionDesc">{mood.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Destination */}
                {step === 2 && (
                    <div className="moodPaletteStep fadeIn">
                        <h3 className="stepTitle">어디로 떠나고 싶으세요?</h3>

                        {!showCustomDestination ? (
                            <>
                                <div className="optionsGrid">
                                    {DESTINATIONS.map((dest) => (
                                        <button
                                            key={dest.id}
                                            className={`optionCard ${selections.destination?.id === dest.id ? "selected" : ""
                                                }`}
                                            onClick={() => handleDestinationSelect(dest)}
                                        >
                                            <div className="optionEmoji">{dest.emoji}</div>
                                            <div className="optionLabel">{dest.label}</div>
                                            <div className="optionType">
                                                {dest.type === "domestic" ? "국내" : "해외"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="customInputToggle"
                                    onClick={() => setShowCustomDestination(true)}
                                >
                                    ✏️ 직접 입력하기
                                </button>
                            </>
                        ) : (
                            <div className="customDestinationInput">
                                <label htmlFor="customDest">여행지 직접 입력</label>
                                <input
                                    id="customDest"
                                    type="text"
                                    placeholder="예: 싱가포르, 오사카, 파리..."
                                    value={customDestinationText}
                                    onChange={(e) => setCustomDestinationText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCustomDestinationSubmit()}
                                    autoFocus
                                />
                                <div className="customDestActions">
                                    <button
                                        className="customDestCancel"
                                        onClick={() => {
                                            setShowCustomDestination(false);
                                            setCustomDestinationText("");
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        className="customDestSubmit"
                                        onClick={handleCustomDestinationSubmit}
                                    >
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}

                        <button className="backBtn" onClick={handleBack}>
                            ← 이전
                        </button>
                    </div>
                )}

                {/* Step 3: Style */}
                {step === 3 && (
                    <div className="moodPaletteStep fadeIn">
                        <h3 className="stepTitle">어떤 스타일로 즐기실래요?</h3>
                        <div className="optionsGrid">
                            {STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    className={`optionCard ${selections.style?.id === style.id ? "selected" : ""
                                        }`}
                                    onClick={() => handleStyleSelect(style)}
                                >
                                    <div className="optionEmoji">{style.emoji}</div>
                                    <div className="optionLabel">{style.label}</div>
                                    <div className="optionDesc">{style.desc}</div>
                                </button>
                            ))}
                        </div>
                        <button className="backBtn" onClick={handleBack}>
                            ← 이전
                        </button>
                    </div>
                )}

                {/* Step 4: Details */}
                {step === 4 && (
                    <div className="moodPaletteStep fadeIn">
                        <h3 className="stepTitle">마지막! 날짜와 인원만 알려주세요</h3>
                        <form onSubmit={handleDetailsSubmit} className="detailsForm">
                            <div className="formRow">
                                <div className="formGroup">
                                    <label htmlFor="startDate">시작일</label>
                                    <input
                                        id="startDate"
                                        type="date"
                                        value={selections.startDate}
                                        onChange={(e) =>
                                            setSelections({
                                                ...selections,
                                                startDate: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="formGroup">
                                    <label htmlFor="endDate">종료일</label>
                                    <input
                                        id="endDate"
                                        type="date"
                                        value={selections.endDate}
                                        onChange={(e) =>
                                            setSelections({
                                                ...selections,
                                                endDate: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="formGroup">
                                <label htmlFor="people">인원</label>
                                <div className="peopleSelector">
                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            className={`peopleBtn ${selections.people === num ? "selected" : ""
                                                }`}
                                            onClick={() =>
                                                setSelections({ ...selections, people: num })
                                            }
                                        >
                                            {num}명
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="summaryBox">
                                <h4>선택하신 내용</h4>
                                <p>
                                    <strong>{selections.mood?.emoji} {selections.mood?.label}</strong> 상태로,{" "}
                                    <strong>{selections.destination?.emoji} {selections.destination?.label}</strong>에서{" "}
                                    <strong>{selections.style?.emoji} {selections.style?.label}</strong> 여행을 즐기실 예정이군요!
                                </p>
                            </div>

                            <div className="formActions">
                                <button type="button" className="backBtn" onClick={handleBack}>
                                    ← 이전
                                </button>
                                <button type="submit" className="submitBtn">
                                    ✨ 1초 만에 일정 생성하기!
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
