import { useEffect } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { motion } from 'framer-motion';

export default function StepLoading() {
  const { nextStep } = useTripStore();

  useEffect(() => {
    // Artificial delay for "AI generation" effect
    const timer = setTimeout(() => {
      nextStep();
    }, 2000);

    return () => clearTimeout(timer);
  }, [nextStep]);

  return (
    <div className="funnelStep" style={{ textAlign: 'center', marginTop: '30vh' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid rgba(255,255,255,0.1)', 
          borderTop: '4px solid #fff', 
          borderRadius: '50%', 
          margin: '0 auto 20px' 
        }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="heroTitle"
      >
        AI가 맞춤 코스를 생성중입니다...
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ color: '#aaa' }}
      >
        잠시만 기다려주세요, 특별한 경험을 준비하고 있어요.
      </motion.p>
    </div>
  );
}
