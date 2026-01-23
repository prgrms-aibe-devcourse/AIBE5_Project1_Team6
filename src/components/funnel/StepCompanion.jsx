import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';

export default function StepCompanion() {
  const { setCompanion, nextStep, prevStep } = useTripStore();

  const handleSelect = (companion) => {
    setCompanion(companion);
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <motion.div 
      className="funnelStep"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <button className="backBtn" onClick={prevStep}>← 이전</button>
      <h2 className="stepTitle">누구와 함께 하시나요?</h2>
      <div className="selectionGrid">
        <button className="selectionCard" onClick={() => handleSelect('solo')}>
          <span className="label">혼자</span>
        </button>
        <button className="selectionCard" onClick={() => handleSelect('couple')}>
          <span className="label">연인</span>
        </button>
        <button className="selectionCard" onClick={() => handleSelect('family')}>
          <span className="label">가족</span>
        </button>
      </div>
    </motion.div>
  );
}
