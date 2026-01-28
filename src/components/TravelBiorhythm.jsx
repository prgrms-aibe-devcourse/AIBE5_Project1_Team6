import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function TravelBiorhythm({ plans = [], currentMood }) {
  // 1. Analyze Plans to calculate stats
  const stats = useMemo(() => {
    // If we have a current mood, we treat it as highly weighted recent input (adds 5 "virtual" trips)
    const moodWeight = currentMood ? 5 : 0;
    const total = plans.length + moodWeight;
    
    if (total === 0) return null;

    let moodCounts = { burnout: 0, energy: 0, healing: 0, adventure: 0 };
    // let themeCounts = { food: 0, activity: 0, healing: 0 }; // Not used in display currently
    
    // Add history
    plans.forEach(p => {
        if(p.mood) moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
    });

    // Add current mood weight
    if (currentMood && moodCounts.hasOwnProperty(currentMood)) {
        moodCounts[currentMood] += moodWeight;
    }

    // Calculate Percentages
    const moods = Object.entries(moodCounts).map(([key, val]) => ({
        key,
        label: key === 'burnout' ? '😫 번아웃' : 
               key === 'energy' ? '🌟 활력 충전' :
               key === 'healing' ? '🧘 힐링' : '🎒 모험',
        value: val,
        percent: total > 0 ? Math.round((val / total) * 100) : 0
    })).sort((a,b) => b.value - a.value);

    // Primary Style (Most frequent mood)
    // If no data, default to healing
    const primaryMood = moods[0]?.value > 0 ? moods[0] : { key: 'healing', label: '🧘 힐링', value: 0, percent: 0 };

    return { total, moods, primaryMood };
  }, [plans, currentMood]);

  if (!stats) {
    return (
        <div className="empty-state" style={{ padding: '4rem 1rem' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🧬</span>
            <h3>아직 데이터가 부족해요</h3>
            <p>여행을 몇 번 다녀오시면<br/>나만의 여행 바이오리듬을 분석해드릴게요.</p>
        </div>
    );
  }

  return (
    <div className="biorhythm-container">
        {/* Hero Section */}
        <div className="persona-card" style={{ marginBottom: '2rem' }}>
            <div className="persona-bg-glow"></div>
            <div className="persona-content">
                <span className="persona-icon">
                    {stats.primaryMood.key === 'burnout' ? '💊' : 
                     stats.primaryMood.key === 'energy' ? '⚡' :
                     stats.primaryMood.key === 'healing' ? '🧘' : '🎒'} 
                </span>
                <h2 className="persona-title">
                    {stats.primaryMood.key === 'burnout' ? '도심 속 힐러' : 
                     stats.primaryMood.key === 'energy' ? '에너자이저' :
                     stats.primaryMood.key === 'healing' ? '명상가' : '모험가'}
                </h2>
                <p className="persona-desc">
                   수집된 {stats.total}건의 여행 기록 중 <strong>{docsText(stats.primaryMood)}</strong> 관련 활동이 가장 많네요.
                   <br/>{getPersonaDesc(stats.primaryMood.key)}
                </p>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="stats-grid-visual" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Mood Chart */}
            <div className="feature-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>나의 여행 무드</h3>
                <div className="chart-bars">
                    {stats.moods.map((m, index) => {
                        // Mood-specific colors
                        const moodColors = {
                            burnout: '#ef4444',    // Red
                            energy: '#f59e0b',     // Orange
                            healing: '#10b981',    // Green
                            adventure: '#8b5cf6'   // Purple
                        };
                        const barColor = moodColors[m.key] || '#94a3b8';
                        
                        return (
                            <div key={m.key} className="chart-row" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                                    <span>{m.label}</span>
                                    <span style={{ fontWeight: '600', color: barColor }}>{m.percent}%</span>
                                </div>
                                <div className="bar-bg" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div 
                                        key={`bar-${m.key}-${m.percent}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.percent}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                        className="bar-fill" 
                                        style={{ 
                                            height: '100%', 
                                            background: barColor,
                                            minWidth: m.percent > 0 ? '2px' : '0'
                                        }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Insight Card */}
            <div className="feature-card" style={{ padding: '1.5rem', background: 'rgba(92, 148, 255, 0.12)' }}>
                <h3 className="card-title" style={{ color: '#1e293b' }}>💡 웰니스 인사이트</h3>
                <p style={{ marginTop: '1rem', lineHeight: '1.6', color: '#334155', fontWeight: '500', fontSize: '1.05rem' }}>
                    지난 여행들의 패턴을 보면, 주로 <strong>{stats.primaryMood.label}</strong>을 추구하는 경향이 있습니다.
                    <br/><br/>
                    다음 여행지로는 <strong>{recommendPlace(stats.primaryMood.key)}</strong> 어떠신가요? 
                    조용한 숲속이나 한적한 바닷가가 당신의 바이오리듬과 잘 맞을 것 같아요.
                </p>
            </div>
        </div>
    </div>
  );
}

function docsText(mood) {
    if(mood.key === 'burnout') return '완벽한 휴식';
    if(mood.key === 'energy') return '활동적인 에너지';
    if(mood.key === 'healing') return '마음의 평화';
    return '짜릿한 모험';
}

function recommendPlace(key) {
    if(key === 'burnout') return '강원도 숲속 독채 숙소';
    if(key === 'energy') return '제주 올레길 트레킹';
    if(key === 'healing') return '남해 보리암 명상 코스';
    return '강원도 래프팅 & 번지점프';
}

function getPersonaDesc(key) {
    if(key === 'burnout') return '당신은 쉼을 통해 더 나아가는 여행자입니다.';
    if(key === 'energy') return '당신은 새로운 도전에서 에너지를 얻는 모험가입니다.';
    if(key === 'healing') return '당신은 조용한 사색을 통해 깊이 있는 여행을 즐깁니다.';
    return '당신은 극한의 경험에서 짜릿한 즐거움을 찾는 챌린저입니다.';
}
