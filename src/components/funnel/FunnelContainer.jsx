import { AnimatePresence } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import StepTransport from './StepTransport';
import StepBudget from './StepBudget';
import StepDuration from './StepDuration';
import StepTheme from './StepTheme';
import StepPriority from './StepPriority';
import StepSave from './StepSave';

export default function FunnelContainer() {
  const { step } = useTripStore();

  const renderStep = () => {
    switch (step) {
      case 0: return <StepTransport key="step0" />;
      case 1: return <StepBudget key="step1" />;
      case 2: return <StepDuration key="step2" />;
      case 3: return <StepTheme key="step3" />;
      case 4: return <StepPriority key="stepPriority" />;
      case 5: return <StepSave key="stepSave" />;
      default: return <StepTransport key="step0" />;
    }
  };

  return (
    <div className="funnelContainer">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}
