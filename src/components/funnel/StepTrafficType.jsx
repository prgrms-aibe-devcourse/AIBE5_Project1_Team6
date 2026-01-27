import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepTrafficType({ stepIndex, totalSteps }) {
  const { setTrafficOption, nextStep, prevStep } = useTripStore();

  const handleSelect = (option) => {
    setTrafficOption(option);
    nextStep();
  };
  
  const options = [
    { id: 'near', label: '🏙️ 근교', desc: '가볍게 떠나는 드라이브' },
    { id: 'far', label: '🛣️ 멀리', desc: '일상을 벗어나 새로운 곳으로' },
  ];

  return (
    <FunnelStepShell
      title="어디로 떠나고 싶으신가요?"
      subtitle="선호하는 여행지를 선택해주세요."
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        width: '100%',
        marginTop: '20px',
        flex: 1
      }}>
         {options.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option.id)}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '200px',
                padding: '30px',
                backgroundColor: 'white',
                border: '2px solid #eee',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
          >
             <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                 {option.label.split(' ')[0]}
             </div>
             <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: '#333' }}>
                 {option.label.split(' ')[1]}
             </h3>
             <p style={{ fontSize: '1rem', color: '#666', fontWeight: '500' }}>{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
