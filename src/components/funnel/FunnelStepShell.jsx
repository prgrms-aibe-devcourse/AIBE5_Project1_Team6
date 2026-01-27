import { motion } from 'framer-motion';

/**
 * SRP: "Tropical Theme" Shell
 * - Full screen background image
 * - Centered White Card Container
 */
export default function FunnelStepShell({
  title,
  subtitle,
  onBack,
  stepIndex,
  totalSteps,
  motionVariants,
  children,
  showBack = true, // Default true
}) {
  return (
    <div 
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundImage: `url('https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2670&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0
        }}
    >
        {/* Overlay for better text readability if needed, though card handles it */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />

        <motion.div
            className="funnelCard"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                padding: '40px',
                width: '90%',
                maxWidth: '800px',
                minHeight: '500px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
                maxHeight: '90vh',
                overflowY: 'auto'
            }}
        >
            <div className="funnelTop" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                {onBack && showBack ? (
                <button 
                    onClick={onBack} 
                    type="button"
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        color: '#333' // Dark for light theme
                    }}
                >
                    ←
                </button>
                ) : (
                <span />
                )}

                {/* Segmented Progress Bar */}
                {totalSteps > 0 && (
                    <div style={{ 
                        flex: 1, 
                        marginLeft: '20px', 
                        display: 'flex', 
                        gap: '6px' 
                    }}>
                        {[...Array(totalSteps)].map((_, i) => {
                            const isActive = i < stepIndex;
                            return (
                                <div key={i} style={{ 
                                    flex: 1, 
                                    height: '6px', 
                                    backgroundColor: '#F0F0F0', 
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        width: isActive ? '100%' : '0%', 
                                        height: '100%', 
                                        backgroundColor: '#5C94FF', 
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease-in-out'
                                    }} />
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* Balance flex if no progress bar */}
                {!totalSteps && <div style={{ flex: 1 }} />}
            </div>

            <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800', 
                color: '#1a1a1a', 
                marginBottom: '8px',
                textAlign: 'center',
                width: '100%'
            }}>
                {title}
            </h2>
            
            {subtitle ? (
                <p style={{ 
                    fontSize: '1rem', 
                    color: '#666', 
                    marginBottom: '32px',
                    textAlign: 'center',
                    lineHeight: '1.5'
                }}>
                    {subtitle}
                </p>
            ) : null}

            {children}
        </motion.div>
    </div>
  );
}
