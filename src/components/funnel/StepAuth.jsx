import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { useAuthStore } from '../../stores/authStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';
import { useNavigate } from 'react-router-dom';

export default function StepAuth() {
  const navigate = useNavigate();
  const { transport } = useTripStore();
  const { user } = useAuthStore();

  // ✅ Auto-skip if already logged in
  useEffect(() => {
    if (user) {
        handleNonMember(); // Reuse navigation logic
    }
  }, [user]);

  const handleNonMember = () => {
    // Navigate based on selected transport
    if (transport === 'Traffic') navigate('/traffic');
    else if (transport === 'Airplane') navigate('/airplane');
    else if (transport === 'Walk' || !transport) navigate('/walk');
    else navigate('/walk');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/login');
  };

  return (
    <FunnelStepShell
      title="맞춤 코스 생성 완료!"
      subtitle="회원가입하고 더 많은 혜택을 받아보세요."
      progressText="Done"
      motionVariants={containerVariants}
      showBack={false}
    >
      <div className="authContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <motion.button
            className="ctaButton primary"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            type="button" 
            style={{ 
                padding: '1.2rem', 
                fontSize: '1.1rem', 
                backgroundColor: '#333', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
            }}
          >
             로그인 / 회원가입
          </motion.button>

        <motion.button
            className="ctaButton secondary"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNonMember(); }}
            type="button"
            style={{ 
                padding: '1rem', 
                fontSize: '1rem', 
                backgroundColor: 'transparent', 
                color: '#666', 
                border: '1px solid #ddd', 
                borderRadius: '12px', 
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
            }}
          >
             비회원으로 계속하기
          </motion.button>
      </div>
    </FunnelStepShell>
  );
}
