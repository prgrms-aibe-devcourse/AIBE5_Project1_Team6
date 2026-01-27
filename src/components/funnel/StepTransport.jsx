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
    { id: 'Traffic', label: '🚌 Traffic', desc: '편리한 대중교통' },
    { id: 'Airplane', label: '✈️ Airplane', desc: '설레는 장거리 여행' },
  ];

  return (
    <FunnelStepShell
      title="이번 여행의 이동 수단은?"
      subtitle="원하시는 여행 스타일에 맞춰 추천해드릴게요."
      stepIndex={0}
      totalSteps={0}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
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
