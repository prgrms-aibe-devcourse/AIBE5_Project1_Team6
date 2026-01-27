import { useTripStore } from "../../stores/tripStore";
import FunnelStepShell from "./FunnelStepShell";
import { motion } from "framer-motion";

export default function StepTheme({ stepIndex, totalSteps }) {
  const { themes, setThemes, nextStep, prevStep } = useTripStore();

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50 },
  };

  const selectTheme = (theme) => {
    // 단일 선택: 기존 선택을 대체
    setThemes(theme);
    // 선택 즉시 다음 스텝으로
    nextStep();
  };

  return (
    <FunnelStepShell
      title="이번 여행의 목적은 무엇인가요?"
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        width: '100%',
        marginTop: '20px',
        flex: 1
      }}>
        {/* Buttons Mapping */}
        {[
            { id: 'activity', label: '🪂 액티비티', desc: '역동적인 즐거움' },
            { id: 'food', label: '🍱 맛집 탐방', desc: '미식의 세계로' },
            { id: 'healing', label: '🌿 힐링/휴식', desc: '여유로운 시간' }
        ].map((item) => (
            <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectTheme(item.id)}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '200px',
                    padding: '30px',
                    backgroundColor: themes.includes(item.id) ? '#F0F7FF' : 'white',
                    border: themes.includes(item.id) ? '2px solid #5C94FF' : '2px solid #eee',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                    {item.label.split(' ')[0]}
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: '#333' }}>
                    {item.label.split(' ')[1]}
                </h3>
                 <p style={{ fontSize: '1rem', color: '#666', fontWeight: '500' }}>{item.desc}</p>
            </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}