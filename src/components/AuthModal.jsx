import { useState } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { RiKakaoTalkFill } from 'react-icons/ri';
import { IoClose } from 'react-icons/io5';
import '../styles/auth.css';

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const translateError = (msg) => {
    if (!msg) return "알 수 없는 오류가 발생했습니다.";
    if (msg.includes("Invalid login credentials")) return "아이디/비밀번호가 틀렸습니다.";
    if (msg.includes("User already registered")) return "이미 가입된 이메일입니다.";
    if (msg.includes("Password should be")) return "비밀번호는 최소 6자 이상이어야 합니다.";
    if (msg.includes("Email not confirmed")) return "이메일 인증이 필요합니다. 메일함을 확인해주세요.";
    return msg;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(''); // 초기화

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (onSuccess) onSuccess(data.user);
        onClose();
      } else {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Supabase 설정에 따라 자동 로그인 될 수도, 아닐 수도 있음
        if (data.user && !data.session) {
            toast("가입 인증 메일을 보냈습니다! 메일함을 확인해주세요.", { icon: "📧", duration: 5000 });
        } else {

            if (onSuccess) onSuccess(data.user);
            onClose();
        }
      }
    } catch (err) {
      setErrorMsg(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg("소셜 로그인 실패: " + translateError(err.message));
    }
  };

  return (
    <div className="authModalOverlay">
      <motion.div 
        className="authModal" 
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <button className="closeBtn" onClick={onClose} style={{ color: '#000' }}><IoClose size={24} /></button>
        
        <div className="authHeader">
          <motion.h2 
            className="authTitle"
            key={isLogin ? "title-login" : "title-signup"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLogin ? "Welcome." : "Create Account"}
          </motion.h2>
          <p className="authSubtitle">
            {isLogin ? "여행 계획을 위해 로그인해주세요." : "나만의 여행 플랜을 시작해보세요."}
          </p>
        </div>

        <form onSubmit={handleAuth}>
          <input 
            className="authInput" 
            type="email" 
            placeholder="이메일" 
            value={email} 
            onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
            required 
          />
          <input 
            className="authInput" 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
            required 
          />
          
          {errorMsg && <div className="authError">{errorMsg}</div>}

          <motion.button 
            key={isLogin ? "login-btn" : "signup-btn"}
            type="submit" 
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '24px',
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: '900',
              borderRadius: '16px',
              border: 'none',
              marginTop: '24px',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'block'
            }}
          >
            {loading ? "처리 중..." : (isLogin ? "로그인" : "회원가입")}
          </motion.button>
        </form>


        <div className="authSwitch">
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <span onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? "회원가입" : "로그인"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
