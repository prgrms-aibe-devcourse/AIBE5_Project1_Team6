import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepMood() {
  const { setMood, nextStep } = useTripStore();

  const handleSelect = (mood) => {
    setMood(mood);
    nextStep();
  };

  const moods = [
    { id: 'burnout', label: '🔥 번아웃', desc: '아무것도 안 하고 쉬고 싶어요' },
    { id: 'refresh', label: '🌈 리프레시', desc: '새로운 영감이 필요해요' },
    { id: 'active', label: '👟 에너지 충전', desc: '가볍게 걷고 뛰고 싶어요' },
    { id: 'calm', label: '🤫 고요함', desc: '조용한 곳에서 멍때리고 싶어요' },
  ];

  return (
    <FunnelStepShell
      title="지금 어떤 기분인가요?"
      subtitle="당신의 현재 무드(Vibe)에 맞춰 여행을 추천해드릴게요."
      progressText="1/4"
      motionVariants={containerVariants}
    >
      <div className="selectionGrid col-2">
        {moods.map((option) => (
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
