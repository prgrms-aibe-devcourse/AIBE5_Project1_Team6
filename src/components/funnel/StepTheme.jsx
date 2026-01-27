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
      subtitle="이번 여행에서 놓치고 싶지 않은 한 가지"
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '460px',
        margin: '25px auto 0', /* Adjusted to be closer to others */
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
                whileHover={{ scale: 1.02, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectTheme(item.id)}
                style={{
                    width: '100%',
                    minHeight: '84px',
                    padding: '16px 24px',
                    backgroundColor: themes.includes(item.id) ? '#F0F7FF' : 'white',
                    border: themes.includes(item.id) ? '2px solid #5C94FF' : '1px solid #eee',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center', /* Row layout */
                    justifyContent: 'flex-start',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'none', /* Removed shadow */
                    textAlign: 'left'
                }}
            >
                <div style={{ fontSize: '2.4rem', marginRight: '20px', lineHeight: 1 }}>
                    {item.label.split(' ')[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' }}>
                      {item.label.split(' ')[1]}
                  </h3>
                   <p style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500', margin: 0 }}>{item.desc}</p>
                </div>
            </motion.button>
        ))}
      </div>
    </FunnelStepShell>
  );
}