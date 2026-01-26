import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore'; // Import tripStore
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

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
                
                // Smart Redirect based on Store
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
        <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#222', borderRadius: '16px', border: '1px solid #333', color: 'white' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {isSignUp ? '회원가입' : '로그인'}
            </h2>
            
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>이메일</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#333', color: 'white', fontSize: '1rem' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#ccc' }}>비밀번호</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#333', color: 'white', fontSize: '1rem' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        marginTop: '8px', padding: '14px', borderRadius: '10px', border: 'none', 
                        background: loading ? '#555' : 'white', color: loading ? '#ccc' : 'black', 
                        fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' 
                    }}
                >
                    {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인하기')}
                </button>
            </form>

            <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative' }}>
                <hr style={{ borderColor: '#444', margin: 0 }} />
                <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translate(-50%)', background: '#222', padding: '0 10px', color: '#888', fontSize: '0.85rem' }}>OR</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    onClick={() => handleOAuth('google')}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: 'white', color: 'black', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="G" />
                    Google로 계속하기
                </button>
                <button 
                    onClick={() => handleOAuth('kakao')}
                    style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#FEE500', color: '#000', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    <img src="https://www.svgrepo.com/show/330752/kakao-talk.svg" width="20" alt="K" />
                    Kakao로 계속하기
                </button>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#aaa' }}>
                {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'} 
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    style={{ background: 'none', border: 'none', color: '#4da6ff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '6px', fontSize: '0.9rem' }}
                >
                    {isSignUp ? '로그인하기' : '회원가입하기'}
                </button>
            </div>
        </div>
    );
}
