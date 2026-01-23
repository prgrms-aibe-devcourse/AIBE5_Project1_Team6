import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';

export default function StepPriority() {
  const { transport, setPriority, nextStep, prevStep } = useTripStore();

  const handleSelect = (priority) => {
    setPriority(priority);
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 }
  };

  // 교통수단별 옵션 데이터
  const options = {
    walk: [
      { id: 'scenery', icon: '🌳', label: '풍경 위주', sub: '조금 돌아가더라도 예쁜 길' },
      { id: 'stamina', icon: '🏃', label: '체력 절약', sub: '평지와 짧은 거리 위주' },
      { id: 'rest', icon: '☕', label: '중간 휴식', sub: '카페나 쉴 곳이 많은 경로' },
    ],
    traffic: [
      { id: 'fast', icon: '⚡', label: '최단 시간', sub: '가장 빨리 도착하는 경로' },
      { id: 'transfer', icon: '🔄', label: '환승 최소', sub: '편안한 이동 중심' },
      { id: 'toll', icon: '📉', label: '비용 절약', sub: '통행료/교통비 절약' },
    ],
    airplane: [
      { id: 'hotel', icon: '🏠', label: '숙소 접근성', sub: '공항 이동이 편리한 곳' },
      { id: 'price', icon: '🎟️', label: '얼리버드/특가', sub: '무조건 저렴한 가격' },
      { id: 'layover', icon: '⏳', label: '레이오버 즐기기', sub: '경유지 관광 포함' },
    ]
  };
  
  // 기본값 fallback (transport가 없을 경우 traffic으로 가정)
  const currentOptions = options[transport] || options.traffic;

  return (
    <FunnelStepShell
      title="무엇을 가장 중요하게 생각하시나요?"
      progressText="5 / 6"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="heroButtons">
        {currentOptions.map((opt) => (
          <button
            key={opt.id}
            className="heroBtn"
            onClick={() => handleSelect(opt.id)}
            type="button"
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
      <p className="funnelHint">한 가지만 고르면, 그 기준에 맞춰 더 매끄럽게 이어줄게요.</p>
    </FunnelStepShell>
  );
}
