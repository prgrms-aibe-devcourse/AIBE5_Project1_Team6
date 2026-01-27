import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';

export default function StepTransport() {
  const { setTransport, nextStep } = useTripStore();

  const handleSelect = (transport) => {
    setTransport(transport);
    nextStep();
  };
  
  const options = [
    { id: 'Walk', label: '👟 Walk', desc: '이색적인 골목 여행' },
    { id: 'Traffic', label: '🚗 Drive', desc: '낭만있는 자동차 여행' },
    { id: 'Airplane', label: '✈️ Airplane', desc: '설레는 장거리 여행' },
  ];

  return (
    <FunnelStepShell
      title="이번 여행의 이동 수단은?"
      subtitle="가장 나다운 여행 방식을 골라보세요"
      stepIndex={0}
      totalSteps={0}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '460px', /* Centered constrained width */
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
                alignItems: 'center', /* Row layout */
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
