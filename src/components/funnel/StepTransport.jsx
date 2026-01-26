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
      progressText="1/4"
      motionVariants={containerVariants}
    >
      <div className="selectionGrid col-3">
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
