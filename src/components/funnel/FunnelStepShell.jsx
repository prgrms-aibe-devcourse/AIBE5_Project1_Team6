import { motion } from 'framer-motion';

/**
 * SRP: "스무고개" 한 스텝의 공통 레이아웃만 담당합니다.
 * - 질문(타이틀/서브타이틀)
 * - 뒤로가기 / 진행률
 * - 내부 컨텐츠(선택 버튼/CTA)
 */
export default function FunnelStepShell({
  title,
  subtitle,
  onBack,
  progressText,
  motionVariants,
  children,
}) {
  return (
    <motion.div
      className="funnelStep"
      variants={motionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="funnelTop">
        {onBack ? (
          <button className="funnelBackBtn" onClick={onBack} type="button">
            ← 이전
          </button>
        ) : (
          <span />
        )}

        {progressText ? <span className="funnelProgress">{progressText}</span> : null}
      </div>

      <h2 className="heroTitle funnelTitle">{title}</h2>
      {subtitle ? <p className="funnelSubtitle">{subtitle}</p> : null}

      {children}
    </motion.div>
  );
}
