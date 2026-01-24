import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import { useNavigate } from 'react-router-dom';

export default function StepDestination() {
  const { transport, setDestination, prevStep } = useTripStore();
  const nav = useNavigate();

  const handleSelect = (type) => {
    setDestination(type);
    if (type === 'anywhere') {
      // "아무데나" 선택 시 추천 로직 (임시로 현재 페이지에서 처리하거나 추천 페이지로 이동)
      // 여기서는 일단 해당 교통수단 페이지로 이동하되, state를 통해 추천 뷰를 띄우도록 설정할 수 있음
      // 우선 사용자 요청대로 트래픽 -> 추천 뷰 로직 등을 고려하여,
      // 각 페이지(walk, traffic, airplane)로 이동시킨 후 거기서 state를 읽어 처리하도록 함.
      nav(`/${transport}`);
    } else {
      // "확정된 지역" 선택 시 -> 지도 뷰로 이동 (기본 동작)
      nav(`/${transport}`);
    }
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
      <h2 className="stepTitle">어디로 떠날까요?</h2>
      <div className="selectionGrid col-2">
        <button className="selectionCard full" onClick={() => handleSelect('specific')}>
          <span className="label">콕 집어 갈래요</span>
        </button>
        <button className="selectionCard full" onClick={() => handleSelect('anywhere')}>
          <span className="label">아무 데나 추천해줘</span>
        </button>
      </div>
    </motion.div>
  );
}
