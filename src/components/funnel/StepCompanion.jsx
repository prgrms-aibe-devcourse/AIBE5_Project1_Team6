import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepCompanion({ stepIndex, totalSteps }) {
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
      subtitle="함께하는 사람에 따라 코스가 달라지니까요"
      onBack={prevStep}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      motionVariants={containerVariants}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        width: '100%',
        maxWidth: '460px',
        margin: '20px auto 0'
      }}>
         {companions.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(option.id)}
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '16px 24px',
                backgroundColor: 'white',
                border: '1px solid #eee',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'none', /* Removed shadow */
                minHeight: '84px',
                textAlign: 'left'
            }}
          >
             {/* Increase font sizes */}
             <div style={{ fontSize: '2.4rem', marginRight: '20px', lineHeight: 1 }}>
                 {option.label.split(' ')[0]} {/* Emoji only */}
             </div>
             <div>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' }}>
                     {option.label.split(' ')[1]} {/* Text only */}
                 </h3>
                 <p style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500', margin: 0, wordBreak: 'keep-all' }}>{option.desc}</p>
             </div>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
