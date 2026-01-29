import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { FaLock } from 'react-icons/fa';

export default function LoginPromptModal({ isOpen, onClose }) {
  const setShowAuth = useAuthStore(state => state.setShowAuth);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 11000,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '40px 32px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f1f5f9',
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px',
              color: '#3b82f6',
              fontSize: '28px',
            }}
          >
            <FaLock />
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#1e293b',
              marginBottom: '12px',
            }}
          >
            로그인이 필요해요!
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '32px',
              wordBreak: 'keep-all',
            }}
          >
            로그인을 하시면 챗봇, 일정 관리 등<br />
            다양한 경험을 하실 수 있어요.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                onClose();
                setShowAuth(true);
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontSize: '1.1rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              로그인하러가기
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                fontSize: '1rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
