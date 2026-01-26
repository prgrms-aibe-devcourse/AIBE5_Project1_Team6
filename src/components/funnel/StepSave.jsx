import { useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { useNavigate } from 'react-router-dom';
import FunnelStepShell from './FunnelStepShell';
import { motion } from 'framer-motion';
import AuthModal from '../AuthModal';
import { useAuthStore } from '../../stores/authStore';
import { getOrCreateGuestId } from '../../utils/guestUtils';
import { saveTrip } from '../../services/tripService';
import toast from 'react-hot-toast';

export default function StepSave() {
  const { transport, themes, budget, duration, priority, prevStep } = useTripStore();
  const { user } = useAuthStore();
  const nav = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95 }
  };

  const themeText = themes.length > 0 ? themes.map(t => {
    if (t === 'activity') return '🪂액티비티';
    if (t === 'food') return '🍱맛집';
    if (t === 'healing') return '🌿힐링';
    return '';
  }).join(' ') : '다채로운';

  const transportText = transport === 'walk' ? '🚶도보' : transport === 'traffic' ? '🚗교통' : '✈️비행기';

  const handleSaveTrip = async (targetUser = null) => {
    setLoading(true);
    try {
      const currentUserId = targetUser?.id || user?.id;
      const guestId = !currentUserId ? getOrCreateGuestId() : null;

      const tripData = {
        transport,
        themes,
        budget,
        duration,
        priority
      };

      await saveTrip(tripData, currentUserId, guestId);
      
      toast.success(currentUserId ? '여행이 저장되었습니다!' : '비회원 게스트로 시작합니다!');
      
      // 결과 페이지로 이동 (교통수단별)
      nav(`/${transport}`);
    } catch (error) {
      console.error(error);
      toast.error('여행 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStart = () => {
    handleSaveTrip(null);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setShowAuthModal(false);
    handleSaveTrip(loggedInUser);
  };

  return (
    <FunnelStepShell
      title="거의 다 됐어요!"
      progressText="6 / 6"
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div className="stepSaveContainer">
        <p className="funnelSummary">
          {transportText}로 즐기는 {themeText} 여행 로드맵을 완성했습니다.
        </p>

               <div className="saveActionButtons">
          <button
            className="heroBtn stepSaveBtn secondary"
            onClick={handleGuestStart}
            disabled={loading}
            style={{
              flex: '1 1 280px',
              minWidth: 0,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.95rem',
              padding: '0.8rem 0.5rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {loading ? '처리 중...' : '비회원으로 결과 보기'}
          </button>

          {user ? (
            <button
              className="heroBtn stepSaveBtn"
              onClick={() => handleSaveTrip()}
              disabled={loading}
              style={{
                flex: '1 1 320px',
                minWidth: 0,
                fontSize: '0.95rem',
                padding: '0.8rem 0.5rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={`${user.email} 계정으로 저장`}
            >
              {loading ? '저장 중...' : `${user.email} 계정으로 저장`}
            </button>
          ) : (
            <button
              className="heroBtn stepSaveBtn"
              onClick={() => setShowAuthModal(true)}
              style={{
                flex: '1 1 320px',
                minWidth: 0,
                fontSize: '0.95rem',
                padding: '0.8rem 0.5rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              로그인 / 회원가입
            </button>
          )}
        </div>
        
        <p className="subText" style={{ marginTop: '1rem', color: '#aaa', fontSize: '0.85rem', textAlign: 'center' }}>
          * 비회원 진행 시 기기 변경 후 데이터 연동이 불가합니다.
        </p>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleLoginSuccess}
        />
      )}
    </FunnelStepShell>
  );
}
