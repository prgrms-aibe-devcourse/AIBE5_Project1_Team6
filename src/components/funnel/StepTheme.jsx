import { useTripStore } from "../../stores/tripStore";
import FunnelStepShell from "./FunnelStepShell";

export default function StepTheme({ progressText = "3/4" }) {
  const { themes, setThemes, nextStep, prevStep } = useTripStore();

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 },
  };

  const selectTheme = (theme) => {
    // 단일 선택: 기존 선택을 대체
    setThemes(theme);
    // 선택 즉시 다음 스텝으로
    nextStep();
  };

  return (
    <FunnelStepShell
      title="이번 여행의 목적은 무엇인가요?"
      progressText={progressText}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="heroButtons">
        <button
          className={`heroBtn ${themes.includes("activity") ? "active" : ""}`}
          onClick={() => selectTheme("activity")}
          type="button"
        >
          🪂 액티비티
        </button>

        <button
          className={`heroBtn ${themes.includes("food") ? "active" : ""}`}
          onClick={() => selectTheme("food")}
          type="button"
        >
          🍱 맛집 탐방
        </button>

        <button
          className={`heroBtn ${themes.includes("healing") ? "active" : ""}`}
          onClick={() => selectTheme("healing")}
          type="button"
        >
          🌿 힐링/휴식
        </button>
      </div>

      <p className="funnelHint">여기서 고른 분위기가, 추천 루트의 톤을 결정해요.</p>
    </FunnelStepShell>
  );
}