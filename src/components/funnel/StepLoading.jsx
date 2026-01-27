import { useEffect, useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { motion } from 'framer-motion';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants } from '../../utils/animationVariants';

export default function StepLoading() {
  const { nextStep, transport } = useTripStore();
  const DURATION = 2.5; // seconds
  
  const loadingText = transport === 'Airplane' 
    ? "전 세계 여행지 데이터를 검토 중이에요 🌏" 
    : "국내 여행지를 검토중이에요";

  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // 1. Navigation Timer
    const navTimer = setTimeout(() => {
      nextStep();
    }, DURATION * 1000);

    // 2. Percentage Animation Timer
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, (DURATION * 1000) / 100);

    return () => {
      clearTimeout(navTimer);
      clearInterval(interval);
    };
  }, [nextStep]);

  return (
    <FunnelStepShell
        title=""
        subtitle=""
        showBack={false}
        progressText={null}
        motionVariants={containerVariants}
    >
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%',
            padding: '40px 0' 
        }}>
            
            {/* Blue Circle Icon */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: '#5C94FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    boxShadow: 'none' /* Removed shadow */
                }}
            >
                <div style={{ fontSize: '3rem', color: 'white' }}>✨</div>
            </motion.div>

            {/* Main Text */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111', marginBottom: '32px' }}>
                {loadingText}
            </h2>

            {/* Progress Bar Container */}
            <div style={{ 
                width: '80%', 
                height: '12px', 
                background: '#f0f2f5', 
                borderRadius: '6px', 
                overflow: 'hidden',
                position: 'relative' 
            }}>
                {/* Progress Bar Fill */}
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: DURATION, ease: "linear" }}
                    style={{
                        height: '100%',
                        background: '#5C94FF',
                        borderRadius: '6px'
                    }}
                />
            </div>

            <div style={{ marginTop: '12px', color: '#888', fontSize: '0.9rem', fontWeight: '500' }}>
                {percent}%
            </div>

        </div>
    </FunnelStepShell>
  );
}
