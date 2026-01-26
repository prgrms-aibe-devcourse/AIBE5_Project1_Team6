import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants, itemVariants } from '../../utils/animationVariants';
import { useNavigate } from 'react-router-dom';

export default function StepAuth() {
  const navigate = useNavigate();
  const { transport } = useTripStore();

  const handleNonMember = () => {
    // Navigate based on selected transport
    if (transport === 'Traffic') navigate('/traffic');
    else if (transport === 'Airplane') navigate('/airplane');
    else navigate('/walk'); // Default to walk
  };

  const handleLogin = () => {
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
            style={{ padding: '1.2rem', fontSize: '1.1rem', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
          >
             로그인 / 회원가입
          </motion.button>

        <motion.button
            className="ctaButton secondary"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNonMember}
            style={{ padding: '1rem', fontSize: '1rem', backgroundColor: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer' }}
          >
             비회원으로 계속하기
          </motion.button>
      </div>
    </FunnelStepShell>
  );
}
