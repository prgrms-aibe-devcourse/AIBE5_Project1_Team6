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
            key="step-login-trigger"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoginClick}
            style={{ 
                width: '100%', padding: '22px', fontSize: '1.2rem', fontWeight: '900',
                backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '16px', 
                cursor: 'pointer', marginBottom: '12px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}
        >
            로그인
        </motion.button>
        <motion.button
            key="step-guest-trigger"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNonMember}
            style={{ 
                width: '100%', padding: '18px', fontSize: '1rem', fontWeight: 'bold',
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px' }}>
                {isSignUp ? 'Create Account' : 'Welcome.'}
            </h2>
            <p style={{ color: '#666', marginTop: '10px', fontSize: '1.1rem', fontWeight: '500' }}>
                {isSignUp ? '나만의 여행 플랜을 시작해보세요.' : '여행 계획을 위해 로그인해주세요.'}
            </p>
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
            <button 
                key={isSignUp ? "signup-submit" : "login-submit"}
                type="submit" 
                disabled={loading} 
                style={{ 
                    marginTop: '16px', padding: '22px', borderRadius: '16px', border: 'none', 
                    background: loading ? '#ccc' : '#3B82F6', 
                    color: 'white', fontSize: '1.2rem', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                }}
            >
                {loading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
            </button>
        </form>


        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'} 
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: '#5C94FF', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px' }}>
                {isSignUp ? '로그인' : '회원가입'}
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
