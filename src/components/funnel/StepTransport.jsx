import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';

export default function StepTransport() {
  const { setTransport, nextStep } = useTripStore();

  const handleSelect = (transport) => {
    setTransport(transport);
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <FunnelStepShell
      title="어떤 교통수단으로 여행 갈까요?"
      progressText="1 / 6"
      motionVariants={containerVariants}
    >
      <div className="heroButtons">
        <button className="heroBtn" onClick={() => handleSelect('walk')} type="button">
          🚶 Walk
        </button>
        <button className="heroBtn" onClick={() => handleSelect('traffic')} type="button">
          🚗 Traffic
        </button>
        <button className="heroBtn" onClick={() => handleSelect('airplane')} type="button">
          ✈️ Airplane
        </button>
      </div>
      <p className="funnelHint">지금 선택이, 여행의 분위기를 만들어줘요.</p>
    </FunnelStepShell>
  );
}
