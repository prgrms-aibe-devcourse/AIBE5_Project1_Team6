import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepTrafficType() {
  const { setTrafficOption, nextStep, prevStep } = useTripStore();

  const handleSelect = (option) => {
    setTrafficOption(option);
    nextStep();
  };
  
  const options = [
    { id: 'near', label: '🏙️ 근교', desc: '가볍게 떠나는 드라이브 (<100km)' },
    { id: 'far', label: '✈️ 멀리', desc: '일상을 벗어나 새로운 곳으로 (>100km)' },
  ];

  return (
    <FunnelStepShell
      title="어디로 떠나고 싶으신가요?"
      subtitle="선호하는 여행지를 선택해주세요."
      progressText="2/5"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="selectionGrid col-2">
         {options.map((option) => (
          <motion.button
            key={option.id}
            className="selectionCard"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option.id)}
          >
             <h3 className="cardTitle" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{option.label}</h3>
             <p className="cardDesc" style={{ fontSize: '0.9rem', color: '#666' }}>{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
