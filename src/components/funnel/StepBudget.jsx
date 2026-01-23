import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';

export default function StepBudget() {
  const { setBudget, nextStep, prevStep } = useTripStore();

  const handleSelect = (budget) => {
    setBudget(budget);
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <FunnelStepShell
      title="예산은 어느 정도로 생각하시나요?"
      progressText="2 / 6"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="heroButtons">
        <button className="heroBtn" onClick={() => handleSelect('good')} type="button">
          💰 가성비
        </button>
        <button className="heroBtn" onClick={() => handleSelect('normal')} type="button">
          💵 적정선
        </button>
        <button className="heroBtn" onClick={() => handleSelect('luxury')} type="button">
          💎 플렉스
        </button>
      </div>
      <p className="funnelHint">가격대는 나중에 더 세밀하게 조정할 수 있어요.</p>
    </FunnelStepShell>
  );
}
