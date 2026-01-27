import { useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import FunnelStepShell from './FunnelStepShell';
import { containerVariants } from '../../utils/animationVariants';
import { motion } from 'framer-motion';

export default function StepBudget({ stepIndex, totalSteps }) {
  const { setBudgetAmount, nextStep, prevStep, transport } = useTripStore();
  
  const isAirplane = transport === 'Airplane';
  
  // Base presets
  const budgetOptions = [
    { 
      label: '가성비', 
      subLabel: '합리적으로', 
      value: isAirplane ? 1000000 : 300000, 
      icon: '💰' 
    },
    { 
      label: '적당히', 
      subLabel: '밸런스 있게', 
      value: isAirplane ? 3000000 : 500000, 
      icon: '💎' 
    },
    { 
      label: '럭셔리', 
      subLabel: '여유있게', 
      value: isAirplane ? 10000000 : 1000000, 
      icon: '✨' 
    },
  ];

  const [selectedValue, setSelectedValue] = useState(null);

  const handleSelect = (value) => {
      setSelectedValue(value);
      setBudgetAmount(value);
      // Small delay for visual feedback if needed, but direct next is requested
      setTimeout(() => {
          nextStep();
      }, 150);
  };

  return (
    <FunnelStepShell
      title="예산은 어느 정도 생각하시나요?"
      subtitle="예산 범위를 알려주세요"
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{ width: '100%', marginTop: '20px', flex: 1 }}>
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '20px',
            width: '100%' 
        }}>
            {budgetOptions.map((option) => (
                <motion.div
                    key={option.label}
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ scale: 1.05, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px',
                        borderRadius: '24px',
                        backgroundColor: selectedValue === option.value ? '#F0F7FF' : 'white',
                        border: selectedValue === option.value ? '2px solid #5C94FF' : '2px solid #eee',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        minHeight: '200px'
                    }}
                >
                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{option.icon}</div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: '#333' }}>{option.label}</span>
                        <span style={{ display: 'block', fontSize: '1rem', color: '#666', fontWeight: '500' }}>{option.subLabel}</span>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </FunnelStepShell>
  );
}
