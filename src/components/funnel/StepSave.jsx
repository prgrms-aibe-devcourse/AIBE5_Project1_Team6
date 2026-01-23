import { useTripStore } from '../../stores/tripStore';
import { useNavigate } from 'react-router-dom';
import FunnelStepShell from './FunnelStepShell';

export default function StepSave() {
  const { transport, themes, prevStep } = useTripStore();
  const nav = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95 }
  };

  const themeText = themes.length > 0 ? themes.map(t => {
    if (t === 'activity') return '🪂액티비티';
    if (t === 'food') return '🍱맛집';
    if (t === 'healing') return '🌿힐링';
    return '';
  }).join(' ') : '다채로운';

  const transportText = transport === 'walk' ? '🚶도보' : transport === 'traffic' ? '🚗교통' : '✈️비행기';

  const handleSave = () => {
    // 실제로는 여기서 로그인 모달을 띄우거나 저장을 수행
    // 일단은 해당 교통수단 메인 페이지로 이동
    nav(`/${transport}`);
  };

  return (
    <FunnelStepShell
      title="거의 다 됐어요!"
      progressText="6 / 6"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <p className="funnelSummary">
        {transportText}로 즐기는 {themeText} 여행 로드맵을 완성했습니다.
      </p>

      <div className="funnelCtaRow">
        <button className="heroBtn funnelCta" onClick={handleSave} type="button">
          다음 화면으로 이동
        </button>
      </div>

      <p className="funnelHint">
        지금은 데모 플로우라 바로 이동해요. 나중에 여기서 로그인/저장을 붙이면 완벽해요.
      </p>
    </FunnelStepShell>
  );
}
