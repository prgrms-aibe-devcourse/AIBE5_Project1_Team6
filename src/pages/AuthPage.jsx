import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AuthPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                toast.success("가입 확인 메일을 보냈습니다! 메일함을 확인해주세요.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                toast.success("로그인되었습니다!");
                
                const { transport } = useTripStore.getState();
                if (transport === 'Traffic') navigate('/traffic');
                else if (transport === 'Airplane') navigate('/airplane');
                else if (transport === 'Walk' || !transport) navigate('/walk'); // Default to Walk if null
                else navigate('/'); 
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
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (error) throw error;
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (user) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundImage: `url('https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2670&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0
            }}
        >
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '30px',
                    padding: '40px',
                    width: '90%',
                    maxWidth: '550px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    zIndex: 1
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px' }}>
                        {isSignUp ? 'Create Account' : 'Welcome.'}
                    </h2>
                    <p style={{ color: '#666', marginTop: '10px', fontSize: '1.1rem', fontWeight: '500' }}>
                        {isSignUp ? '나만의 여행 플랜을 시작해보세요.' : '여행 계획을 위해 로그인해주세요.'}
                    </p>
                </div>
                
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#333', fontWeight: '600' }}>이메일</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '12px', 
                                border: '1px solid #ddd', 
                                backgroundColor: '#f9f9f9', 
                                color: '#333', 
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#5C94FF'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#333', fontWeight: '600' }}>비밀번호</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '12px', 
                                border: '1px solid #ddd', 
                                backgroundColor: '#f9f9f9', 
                                color: '#333', 
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#5C94FF'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd'}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            marginTop: '16px', padding: '20px', borderRadius: '16px', border: 'none', 
                            background: loading ? '#ccc' : '#3B82F6', 
                            color: 'white', 
                            fontSize: '1.1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인하기')}
                    </button>
                </form>


                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                    {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'} 
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: '#5C94FF', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px', fontSize: '0.9rem' }}
                    >
                        {isSignUp ? '로그인' : '회원가입'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
