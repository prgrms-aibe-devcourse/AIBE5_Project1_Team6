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
      subtitle="동행자에 맞춰 코스를 추천해드려요."
      onBack={prevStep}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      motionVariants={containerVariants}
    >
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        width: '100%',
        marginTop: '20px'
      }}>
         {companions.map((option) => (
          <motion.button
            key={option.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option.id)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px 20px', // More padding
                backgroundColor: 'white',
                border: '2px solid #eee',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                height: '100%'
            }}
          >
             {/* Increase font sizes */}
             <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                 {option.label.split(' ')[0]} {/* Emoji only */}
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                 {option.label.split(' ')[1]} {/* Text only */}
             </h3>
             <p style={{ fontSize: '0.9rem', color: '#888', wordBreak: 'keep-all' }}>{option.desc}</p>
          </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}
