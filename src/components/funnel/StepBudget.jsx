import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants } from '../../utils/animationVariants';

export default function StepBudget({ progressText = "3/5" }) {
  const { setBudgetAmount, nextStep, prevStep } = useTripStore();
  const [value, setValue] = useState(300000); // Default 300k

  const handleNext = () => {
    setBudgetAmount(value);
    nextStep();
  };

  const presets = [100000, 300000, 500000, 1000000];

  return (
    <FunnelStepShell
      title="예산은 어느 정도 생각하시나요?"
      subtitle="교통비, 식비 등을 포함한 대략적인 금액을 알려주세요."
      progressText={progressText}
      onBack={prevStep}
      onNext={handleNext}
      motionVariants={containerVariants}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px', margin: '0 auto' }}>
        
        {/* Preset Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {presets.map(amount => (
                <button
                    key={amount}
                    onClick={() => setValue(amount)}
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: value === amount ? '#d59563' : '#333',
                        color: 'white',
                        border: '1px solid #444',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {amount.toLocaleString()}원
                </button>
            ))}
        </div>

        {/* Manual Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#aaa', fontSize: '0.9rem' }}>직접 입력 (원)</label>
            <input 
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #555',
                    background: '#222',
                    color: 'white',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    outline: 'none'
                }}
            />
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px', color: '#888' }}>
            * AI가 이 금액 내에서 최적의 코스를 짜드립니다.
        </div>

        <button 
            onClick={handleNext}
            style={{
                marginTop: '16px',
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: '#d59563',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
            }}
        >
            다음으로
        </button>
      </div>
    </FunnelStepShell>
  );
}
