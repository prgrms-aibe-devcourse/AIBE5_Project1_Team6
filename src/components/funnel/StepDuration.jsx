import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';

export default function StepDuration() {
  const { setDuration, nextStep, prevStep } = useTripStore();

  const handleSelect = (duration) => {
    setDuration(duration);
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <FunnelStepShell
      title="얼마나 떠나계실 예정인가요?"
      progressText="3 / 6"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="heroButtons">
        <button className="heroBtn" onClick={() => handleSelect('day')} type="button">
          🐣 당일치기 / 1박
        </button>
        <button className="heroBtn" onClick={() => handleSelect('short')} type="button">
          📅 단기 (2~4일)
        </button>
        <button className="heroBtn" onClick={() => handleSelect('long')} type="button">
          🗓️ 장기 (5일 이상)
        </button>
      </div>
      <p className="funnelHint">여행 길이에 맞춰, 추천 루트의 밀도가 달라져요.</p>
    </FunnelStepShell>
  );
}
