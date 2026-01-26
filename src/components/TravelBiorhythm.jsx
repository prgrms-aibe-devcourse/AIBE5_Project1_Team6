import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function TravelBiorhythm({ plans = [] }) {
  // 1. Analyze Plans to calculate stats
  const stats = useMemo(() => {
    const total = plans.length;
    if (total === 0) return null;

    let moodCounts = { burnout: 0, refresh: 0, active: 0, calm: 0 };
    let themeCounts = { food: 0, activity: 0, healing: 0 };
    
    plans.forEach(p => {
        if(p.mood) moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
        if(p.themes && Array.isArray(p.themes)) {
            p.themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1);
        }
    });

    // Calculate Percentages
    const moods = Object.entries(moodCounts).map(([key, val]) => ({
        key,
        label: key === 'burnout' ? '🔥 번아웃 케어' : 
               key === 'refresh' ? '🌈 리프레시' :
               key === 'active' ? '👟 에너지 충전' : '🤫 고요한 휴식',
        value: val,
        percent: Math.round((val / total) * 100)
    })).sort((a,b) => b.value - a.value);

    // Primary Style (Most frequent mood)
    const primaryMood = moods[0];

    return { total, moods, primaryMood };
  }, [plans]);

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
                     stats.primaryMood.key === 'refresh' ? '✨' :
                     stats.primaryMood.key === 'active' ? '⚡' : '🧘'}
                </span>
                <h2 className="persona-title">
                    {stats.primaryMood.key === 'burnout' ? '도심 속 힐러' : 
                     stats.primaryMood.key === 'refresh' ? '영감 수집가' :
                     stats.primaryMood.key === 'active' ? '에너자이저' : '명상가'}
                </h2>
                <p className="persona-desc">
                   최근 {stats.total}번의 여행 중 <strong style={{color: '#fff'}}>{docsText(stats.primaryMood)}</strong>을 가장 많이 찾으셨네요.
                   <br/>당신은 쉼을 통해 더 나아가는 여행자입니다.
                </p>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="stats-grid-visual" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Mood Chart */}
            <div className="feature-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>나의 여행 무드</h3>
                <div className="chart-bars">
                    {stats.moods.map((m) => (
                        <div key={m.key} className="chart-row" style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                                <span>{m.label}</span>
                                <span>{m.percent}%</span>
                            </div>
                            <div className="bar-bg" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${m.percent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="bar-fill" 
                                    style={{ 
                                        height: '100%', 
                                        background: m.key === stats.primaryMood.key ? 'var(--primary-color)' : '#94a3b8' 
                                    }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight Card */}
            <div className="feature-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))' }}>
                <h3 className="card-title">💡 웰니스 인사이트</h3>
                <p style={{ marginTop: '1rem', lineHeight: '1.6', color: '#e2e8f0' }}>
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
    if(mood.key === 'refresh') return '새로운 자극';
    if(mood.key === 'active') return '활동적인 에너지';
    return '마음의 평화';
}

function recommendPlace(key) {
    if(key === 'burnout') return '강원도 숲속 독채 숙소';
    if(key === 'refresh') return '부산 영도 흰여울문화마을';
    if(key === 'active') return '제주 올레길 트레킹';
    return '남해 보리암 명상 코스';
}
