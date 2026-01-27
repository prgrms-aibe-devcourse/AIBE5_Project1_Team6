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
      subtitle="드라이브, 어디까지 생각하고 계신가요?"
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '460px',
        margin: '20px auto 0',
        flex: 1
      }}>
         {options.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
            style={{
                width: '100%',
                minHeight: '84px',
                padding: '16px 24px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'none', /* Removed shadow */
                textAlign: 'left'
            }}
          >
             <div style={{ fontSize: '2.4rem', marginRight: '20px', lineHeight: 1 }}>
                 {option.label.split(' ')[0]}
             </div>
             <div>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' }}>
                     {option.label.split(' ')[1]}
                 </h3>
                 <p style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500', margin: 0 }}>{option.desc}</p>
             </div>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
