import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCity, FaTree, FaHiking, FaUtensils, FaChartPie } from 'react-icons/fa';

const TravelStyleAnalysis = ({ schedules = [] }) => {
    // 분석 로직
    const analysis = useMemo(() => {
        const scores = {
            urban: 0,
            nature: 0,
            activity: 0,
            food: 0
        };

        const keywords = {
            urban: ['도시', '쇼핑', '박물관', '미술관', '시장', '빌딩', '야경', '현대', '문화', '서울', '도쿄', '뉴욕'],
            nature: ['자연', '힐링', '바다', '산', '공원', '숲', '풍경', '휴식', '제주', '강원', '호수', '해변'],
            activity: ['체험', '액티비티', '하이킹', '수영', '다이빙', '걷기', '운동', '등산', '서핑', '스키', '레저'],
            food: ['맛집', '음식', '카페', '식당', '요리', '먹방', '미식', '빵', '커피', '술', '디저트']
        };

        let totalPoints = 0;

        schedules.forEach(schedule => {
            const text = `${schedule.title} ${schedule.description} ${schedule.scheduleText || ''} ${JSON.stringify(schedule.moodData || {})}`.toLowerCase();

            // 키워드 매칭 (가중치 1)
            Object.keys(keywords).forEach(category => {
                keywords[category].forEach(keyword => {
                    if (text.includes(keyword)) {
                        scores[category]++;
                        totalPoints++;
                    }
                });
            });

            // MoodData 활용 (가중치 2)
            if (schedule.moodData) {
                const { mood, style } = schedule.moodData;
                if (mood === 'active' || style === 'dynamic') { scores.activity += 2; totalPoints += 2; }
                if (mood === 'calm' || style === 'relax') { scores.nature += 2; totalPoints += 2; }
                if (style === 'modern') { scores.urban += 2; totalPoints += 2; }
            }
        });

        // 기본값 처리 (데이터 없을 때)
        if (totalPoints === 0) {
            return {
                scores: { urban: 25, nature: 25, activity: 25, food: 25 }, // 균등 분포
                percentages: { urban: 25, nature: 25, activity: 25, food: 25 },
                mainType: 'none',
                comment: "아직 충분한 여행 데이터가 없습니다. 다양한 여행을 계획해보세요!"
            };
        }

        const percentages = {
            urban: Math.round((scores.urban / totalPoints) * 100),
            nature: Math.round((scores.nature / totalPoints) * 100),
            activity: Math.round((scores.activity / totalPoints) * 100),
            food: Math.round((scores.food / totalPoints) * 100)
        };

        // 메인 성향 찾기
        const maxScore = Math.max(scores.urban, scores.nature, scores.activity, scores.food);
        const mainType = Object.keys(scores).find(key => scores[key] === maxScore);

        let comment = "";
        switch (mainType) {
            case 'urban': comment = "화려한 도시의 불빛과 문화를 사랑하는 '도심 탐방러'입니다."; break;
            case 'nature': comment = "지친 일상에서 벗어나 자연 속 힐링을 찾는 '자연인'입니다."; break;
            case 'activity': comment = "새로운 도전과 짜릿한 경험을 즐기는 '열정 만수르'입니다."; break;
            case 'food': comment = "여행의 절반은 맛집! 세상을 맛으로 기억하는 '미식가'입니다."; break;
            default: comment = "다양한 매력을 골고루 즐기는 '밸런스 여행자'입니다.";
        }

        return { scores, percentages, mainType, comment };
    }, [schedules]);

    const categories = [
        { key: 'urban', label: '도심 탐방형', icon: <FaCity />, color: '#3b82f6', bg: '#eff6ff' },
        { key: 'nature', label: '자연 힐링형', icon: <FaTree />, color: '#10b981', bg: '#ecfdf5' },
        { key: 'activity', label: '액티비티형', icon: <FaHiking />, color: '#f59e0b', bg: '#fffbeb' },
        { key: 'food', label: '미식 탐험형', icon: <FaUtensils />, color: '#ef4444', bg: '#fef2f2' },
    ];

    // Simple Pie Chart using CSS Conic Gradient
    const pieGradient = `conic-gradient(
        ${categories[0].color} 0% ${analysis.percentages.urban}%,
        ${categories[1].color} ${analysis.percentages.urban}% ${analysis.percentages.urban + analysis.percentages.nature}%,
        ${categories[2].color} ${analysis.percentages.urban + analysis.percentages.nature}% ${analysis.percentages.urban + analysis.percentages.nature + analysis.percentages.activity}%,
        ${categories[3].color} ${analysis.percentages.urban + analysis.percentages.nature + analysis.percentages.activity}% 100%
    )`;

    return (
        <div className="style-analysis-container">
            <div className="analysis-header">
                <div className="main-type-badge">
                    {analysis.mainType === 'none' ? '분석 중...' : categories.find(c => c.key === analysis.mainType)?.label}
                </div>
                <h3 className="analysis-title">나의 여행 DNA</h3>
                <p className="analysis-comment">{analysis.comment}</p>
            </div>

            <div className="chart-section">
                <div className="pie-chart-wrapper">
                    <motion.div
                        className="pie-chart"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{ background: pieGradient }}
                    >
                        <div className="pie-hole">
                            <FaChartPie className="center-icon" />
                        </div>
                    </motion.div>
                </div>

                <div className="legend-list">
                    {categories.map((cat, index) => (
                        <div key={cat.key} className="legend-item">
                            <div className="legend-icon" style={{ color: cat.color, background: cat.bg }}>
                                {cat.icon}
                            </div>
                            <div className="legend-info">
                                <span className="legend-label">{cat.label}</span>
                                <div className="progress-bar-bg">
                                    <motion.div
                                        className="progress-bar-fill"
                                        style={{ background: cat.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${analysis.percentages[cat.key]}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    />
                                </div>
                            </div>
                            <span className="legend-percent">{analysis.percentages[cat.key]}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TravelStyleAnalysis;
