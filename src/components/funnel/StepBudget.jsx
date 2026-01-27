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
      subtitle="편안하게 즐길 수 있는 정도면 충분해요"
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={prevStep}
      motionVariants={containerVariants}
    >
      <div style={{ width: '100%', maxWidth: '460px', margin: '20px auto 0', flex: 1 }}>
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            width: '100%' 
        }}>
            {budgetOptions.map((option) => (
                <motion.div
                    key={option.label}
                    onClick={() => handleSelect(option.value)}
                    whileHover={{ scale: 1.02, borderColor: '#5C94FF', backgroundColor: '#F0F7FF' }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center', /* Row layout */
                        justifyContent: 'flex-start',
                        padding: '16px 24px',
                        borderRadius: '16px',
                        backgroundColor: selectedValue === option.value ? '#F0F7FF' : 'white',
                        border: selectedValue === option.value ? '2px solid #5C94FF' : '1px solid #eee',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: 'none', /* Removed shadow */
                        minHeight: '84px',
                        textAlign: 'left'
                    }}
                >
                    <div style={{ fontSize: '2.4rem', marginRight: '20px', lineHeight: 1 }}>{option.icon}</div>
                    <div>
                        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px', color: '#333' }}>{option.label}</span>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>{option.subLabel}</span>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </FunnelStepShell>
  );
}
