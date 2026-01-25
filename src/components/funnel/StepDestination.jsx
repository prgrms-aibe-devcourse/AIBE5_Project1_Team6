import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepDestination() {
  const { setDestination, nextStep, prevStep } = useTripStore();

  const handleSelect = (dest) => {
    setDestination(dest);
    nextStep();
  };

  const destinations = [
    { id: 'seoul', label: '🏙️ 서울', desc: '도심 속 힐링' },
    { id: 'busan', label: '🌊 부산', desc: '바다와 함께' },
    { id: 'jeju', label: '🍊 제주', desc: '자연 그 자체' },
    { id: 'current', label: '📍 내 주변', desc: '지금 있는 곳에서' },
  ];

  return (
    <FunnelStepShell
      title="어디로 떠날까요?"
      subtitle="원하는 지역이나 현재 위치를 선택해주세요."
      onBack={prevStep}
      progressText="2/4"
      motionVariants={containerVariants}
    >
      <div className="selectionGrid col-2">
        {destinations.map((option) => (
          <motion.button
            key={option.id}
            className="selectionCard"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
          >
             <h3 className="cardTitle" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{option.label}</h3>
             <p className="cardDesc" style={{ fontSize: '0.9rem', color: '#666' }}>{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
