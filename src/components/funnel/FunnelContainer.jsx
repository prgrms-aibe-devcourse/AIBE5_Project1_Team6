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
    if (step === 0) return <StepTransport key="stepTransport" />;

    // Traffic Flow
    if (transport === 'Traffic') {
        switch (step) {
            case 1: return <StepTrafficType key="stepTrafficType" />;
            case 2: return <StepBudget key="stepBudget" />;
            case 3: return <StepCompanion key="stepComp" />;
            case 4: return <StepTheme key="stepTheme" />;
            case 5: return <StepLoading key="stepLoading" />;
            case 6: return <StepAuth key="stepAuth" />;
            default: return <StepTransport key="stepTransport" />;
        }
    }

    // Airplane Flow (Global Travel)
    if (transport === 'Airplane') {
        // 0: Transport
        // 1: Budget (x10)
        // 2: Companion
        // 3: Loading
        // 4: Auth
        switch (step) {
            case 1: return <StepBudget key="stepBudget" />;
            case 2: return <StepCompanion key="stepComp" />;
            case 3: return <StepLoading key="stepLoading" />;
            case 4: return <StepAuth key="stepAuth" />;
            default: return <StepTransport key="stepTransport" />;
        }
    }

    // Default Flow (Walk)
    switch (step) {
      case 1: return <StepCompanion key="stepComp" progressText="2/4" />;
      case 2: return <StepBudget key="stepBudget" progressText="3/4" />;
      case 3: return <StepTheme key="stepTheme" progressText="4/4" />;
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
