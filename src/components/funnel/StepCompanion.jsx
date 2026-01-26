import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepCompanion({ progressText = "3/4" }) {
  const { setCompanion, nextStep, prevStep } = useTripStore();

  const handleSelect = (companion) => {
    setCompanion(companion);
    nextStep();
  };
  
  const companions = [
    { id: 'solo', label: '🧍 혼자', desc: '자유로운 영혼' },
    { id: 'couple', label: '💑 연인', desc: '로맨틱한 시간' },
    { id: 'family', label: '👨‍👩‍👧‍👦 가족', desc: '함께 만드는 추억' },
    { id: 'friends', label: '👯 친구', desc: '즐거운 우리끼리' },
  ];

  return (
    <FunnelStepShell
      title="누구와 함께 하시나요?"
      subtitle="동행자에 맞춰 코스를 추천해드려요."
      onBack={prevStep}
      progressText={progressText}
      motionVariants={containerVariants}
    >
      <div className="selectionGrid col-2">
         {companions.map((option) => (
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
