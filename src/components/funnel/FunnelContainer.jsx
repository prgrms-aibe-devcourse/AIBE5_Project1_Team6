import { AnimatePresence } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import StepTransport from './StepTransport';
import StepTrafficType from './StepTrafficType';
import StepBudget from './StepBudget';
import StepCompanion from './StepCompanion';
import StepTheme from './StepTheme';
import StepLoading from './StepLoading';
import StepAuth from './StepAuth';

export default function FunnelContainer() {
  const { step, transport } = useTripStore();

  // Traffic Flow has an extra step: TrafficType & Budget
  // 0: Transport
  // 1: TrafficType
  // 2: Budget
  // 3: Companion
  // 4: Theme
  // 5: Loading
  // 6: Auth
  
  const renderStep = () => {
    // Universal Step 0
    if (step === 0) return <StepTransport key="stepTransport" stepIndex={0} totalSteps={0} />;

    // Traffic Flow (Total 4 steps: Type, Budget, Companion, Theme)
    if (transport === 'Traffic') {
        switch (step) {
            case 1: return <StepTrafficType key="stepTrafficType" stepIndex={1} totalSteps={4} />;
            case 2: return <StepBudget key="stepBudget" stepIndex={2} totalSteps={4} />;
            case 3: return <StepCompanion key="stepComp" stepIndex={3} totalSteps={4} />;
            case 4: return <StepTheme key="stepTheme" stepIndex={4} totalSteps={4} />;
            case 5: return <StepLoading key="stepLoading" />;
            case 6: return <StepAuth key="stepAuth" />;
            default: return <StepTransport key="stepTransport" />;
        }
    }

    // Airplane Flow (Total 2 steps: Budget, Companion)
    if (transport === 'Airplane') {
        switch (step) {
            case 1: return <StepBudget key="stepBudget" stepIndex={1} totalSteps={2} />;
            case 2: return <StepCompanion key="stepComp" stepIndex={2} totalSteps={2} />;
            case 3: return <StepLoading key="stepLoading" />;
            case 4: return <StepAuth key="stepAuth" />;
            default: return <StepTransport key="stepTransport" />;
        }
    }

    // Default Flow (Walk) (Total 3 steps: Budget, Companion, Theme)
    // REORDERED: Budget -> Companion -> Theme
    switch (step) {
      case 1: return <StepBudget key="stepBudget" stepIndex={1} totalSteps={3} />;      // Was Companion
      case 2: return <StepCompanion key="stepComp" stepIndex={2} totalSteps={3} />;      // Was Budget
      case 3: return <StepTheme key="stepTheme" stepIndex={3} totalSteps={3} />;
      case 4: return <StepLoading key="stepLoading" />;
      case 5: return <StepAuth key="stepAuth" />;
      default: return <StepTransport key="stepTransport" />;
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
