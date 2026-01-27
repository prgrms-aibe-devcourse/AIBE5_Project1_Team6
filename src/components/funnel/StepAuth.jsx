import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { useAuthStore } from '../../stores/authStore';
import FunnelStepShell from './FunnelStepShell';
import { itemVariants, containerVariants } from '../../utils/animationVariants';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function StepAuth() {
  const navigate = useNavigate();
  const { transport } = useTripStore();
  const { user, setGuest } = useAuthStore();
  const [view, setView] = useState('initial'); // 'initial' | 'login'
  
  // Login Form State
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Auto-skip if already logged in
  useEffect(() => {
    if (user) {
        handleNonMember();
    }
  }, [user]);

  const handleNonMember = () => {
    setGuest(true);
    if (transport === 'Traffic') navigate('/traffic');
    else if (transport === 'Airplane') navigate('/airplane');
    else if (transport === 'Walk' || !transport) navigate('/walk');
    else navigate('/walk');
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setView('login');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            toast.success("가입 확인 메일을 보냈습니다!");
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast.success("로그인되었습니다!");
            // Navigation handled by useEffect
        }
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (error) {
        toast.error(error.message);
    }
  };

  // Content for Initial View (Airplane Icon)
  const InitialContent = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🧳</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>
            로그인이 필요해요
        </h2>
        <p style={{ color: '#666', marginBottom: '32px', lineHeight: '1.5', textAlign: 'center' }}>
            여행 상세 정보를 보려면<br/>
            로그인이 필요합니다
        </p>
        <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoginClick}
            style={{ 
                width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 'bold',
                backgroundColor: '#5C94FF', color: '#fff', border: 'none', borderRadius: '12px', 
                cursor: 'pointer', marginBottom: '12px', boxShadow: '0 4px 12px rgba(92, 148, 255, 0.3)'
            }}
        >
            로그인하기
        </motion.button>
        <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNonMember}
            style={{ 
                width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 'bold',
                backgroundColor: '#F5F7FA', color: '#666', border: 'none', borderRadius: '12px', cursor: 'pointer',
            }}
        >
            나중에 할게요
        </motion.button>
    </div>
  );

  // Content for Login View (Form)
  const LoginContent = (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a' }}>
                {isSignUp ? '회원가입' : '로그인'}
            </h2>
        </div>
        
        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '1rem', outline: 'none' }}
            />
            <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '1rem', outline: 'none' }}
            />
            <button type="submit" disabled={loading} style={{ marginTop: '8px', padding: '16px', borderRadius: '12px', border: 'none', background: loading ? '#ccc' : '#5C94FF', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인하기')}
            </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
             <hr style={{ borderColor: '#eee', margin: 0 }} />
             <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translate(-50%)', background: '#fff', padding: '0 10px', color: '#999', fontSize: '0.85rem' }}>OR</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <button onClick={() => handleOAuth('google')} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #ddd', background: 'white', color: 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                 <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="G" /> Google로 계속하기
             </button>
             <button onClick={() => handleOAuth('kakao')} style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#FEE500', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                 <img src="https://www.svgrepo.com/show/330752/kakao-talk.svg" width="20" alt="K" /> Kakao로 계속하기
             </button>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'} 
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#5C94FF', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px' }}>
                {isSignUp ? '로그인하기' : '회원가입하기'}
            </button>
        </div>
        
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button onClick={() => setView('initial')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.9rem' }}>
                ← 뒤로가기
            </button>
        </div>
    </div>
  );

  return (
    <FunnelStepShell
        title=""
        subtitle=""
        showBack={false}
        stepIndex={0}
        totalSteps={0}
        motionVariants={containerVariants}
    >
        {view === 'initial' ? InitialContent : LoginContent}
    </FunnelStepShell>
  );
}
