import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCity, FaTree, FaHiking, FaUtensils, FaChartPie } from 'react-icons/fa';

const TravelStyleAnalysis = ({ 
    savedPlaces = [], 
    upcomingSchedules = [], 
    pastSchedules = [] 
}) => {
    // 분석 로직
    const analysis = useMemo(() => {
        const keywords = {
            urban: [
                '도시', '쇼핑', '박물관', '미술관', '시장', '빌딩', '야경', '현대', '문화', '서울', '도쿄', '뉴욕', '랜드마크', 'traffic', 
                '시내', '백화점', '몰', '아웃렛', '광장', '메트로', '지하철', '전시', '공연', '콘서트', '클럽', '바', '명소', '관광지'
            ],
            nature: [
                '자연', '힐링', '바다', '산', '공원', '숲', '풍경', '휴식', '제주', '강원', '호수', '해변', '캠핑', '산책', 'walk',
                '수목원', '식물원', '계곡', '해수욕장', '일출', '일몰', '노을', '별', '등대', '섬', '마을', '사찰', '절'
            ],
            activity: [
                '체험', '액티비티', '하이킹', '수영', '다이빙', '걷기', '운동', '등산', '서핑', '스키', '레저', '테마파크', 'activity', 'airplane',
                '놀이동산', '워크', '트레킹', '자전거', '라이딩', '낚시', '골프', '패러글라이딩', '번지점프', '스포츠', '경기', '관람'
            ],
            food: [
                '맛집', '음식', '카페', '식당', '요리', '먹방', '미식', '빵', '커피', '술', '디저트', '레스토랑', '베이커리', 'food',
                '카페거리', '베이커리', '브런치', '저녁', '점심', '아침', '일식', '중식', '한식', '양식', '전통시장', '포장마차', '와인', '맥주',
                '고기', '회', '스시', '라면', '치킨', '피자', '파스타', '빵집', '디저트', '달콤', '음료', '티타임', '찻집', '술집', '이자카야', 
                '다이닝', '오마카세', '로컬음식', '스트리트푸드', '카페투어', '빵지순례', '먹거리', '식사', '냠냠', '맛있는'
            ]
        };

        const analyzeSource = (items) => {
            if (!items || items.length === 0) {
                return { urban: 25, nature: 25, activity: 25, food: 25 };
            }

            const baselineValue = 10;
            const bScores = {
                urban: baselineValue,
                nature: baselineValue,
                activity: baselineValue,
                food: baselineValue
            };
            let bTotal = baselineValue * 4;

            items.forEach(item => {
                const textParts = [
                    item.title,
                    item.description,
                    item.subtitle,
                    item.scheduleText,
                    item.tag,
                    item.category,
                    item.overview,
                    item.addr1,
                    JSON.stringify(item.moodData || {})
                ].filter(Boolean);
                
                const text = textParts.join(' ').toLowerCase();

                Object.keys(keywords).forEach(cat => {
                    keywords[cat].forEach(kw => {
                        if (text.includes(kw.toLowerCase())) {
                            bScores[cat]++;
                            bTotal++;
                        }
                    });
                });

                if (item.moodData) {
                    const { mood, style } = item.moodData;
                    if (mood === 'active' || style === 'dynamic') { bScores.activity += 2; bTotal += 2; }
                    if (mood === 'calm' || style === 'relax') { bScores.nature += 2; bTotal += 2; }
                    if (style === 'modern') { bScores.urban += 2; bTotal += 2; }
                }
                
                if (item.category === 'walk') { bScores.nature += 2; bTotal += 2; }
                if (item.category === 'traffic') { bScores.urban += 2; bTotal += 2; }
                if (item.category === 'airplane' || item.category === 'flight') { bScores.activity += 2; bTotal += 2; }
                
                if (item.tag === '맛집' || item.tag?.includes('미식')) { bScores.food += 5; bTotal += 5; }
                if (item.tag === '액티비티' || item.tag?.includes('체험')) { bScores.activity += 5; bTotal += 5; }
                if (item.tag === '힐링' || item.tag?.includes('자연')) { bScores.nature += 5; bTotal += 5; }
                if (item.tag?.includes('문화') || item.tag?.includes('도시')) { bScores.urban += 5; bTotal += 5; }
            });

            return {
                urban: (bScores.urban / bTotal) * 100,
                nature: (bScores.nature / bTotal) * 100,
                activity: (bScores.activity / bTotal) * 100,
                food: (bScores.food / bTotal) * 100
            };
        };

        const dnaSaved = analyzeSource(savedPlaces);
        const dnaUpcoming = analyzeSource(upcomingSchedules);
        const dnaPast = analyzeSource(pastSchedules);

        // 산술 평균 계산
        const avgPercentages = {
            urban: (dnaSaved.urban + dnaUpcoming.urban + dnaPast.urban) / 3,
            nature: (dnaSaved.nature + dnaUpcoming.nature + dnaPast.nature) / 3,
            activity: (dnaSaved.activity + dnaUpcoming.activity + dnaPast.activity) / 3,
            food: (dnaSaved.food + dnaUpcoming.food + dnaPast.food) / 3
        };

        // 소수점 보정 및 최종 퍼센테이지 (합계 100%)
        const totalRaw = avgPercentages.urban + avgPercentages.nature + avgPercentages.activity + avgPercentages.food;
        const percentages = {
            urban: Math.round((avgPercentages.urban / totalRaw) * 100),
            nature: Math.round((avgPercentages.nature / totalRaw) * 100),
            activity: Math.round((avgPercentages.activity / totalRaw) * 100),
            food: 0
        };
        percentages.food = 100 - (percentages.urban + percentages.nature + percentages.activity);

        // 메인 성향 찾기
        const maxPercent = Math.max(percentages.urban, percentages.nature, percentages.activity, percentages.food);
        const mainType = Object.keys(percentages).find(key => percentages[key] === maxPercent);

        let comment = "";
        switch (mainType) {
            case 'urban': comment = "화려한 도시의 불빛과 문화를 사랑하는 '도심 탐방러'입니다."; break;
            case 'nature': comment = "지친 일상에서 벗어나 자연 속 힐링을 찾는 '자연인'입니다."; break;
            case 'activity': comment = "새로운 도전과 짜릿한 경험을 즐기는 '열정 만수르'입니다."; break;
            case 'food': comment = "여행의 절반은 맛집! 세상을 맛으로 기억하는 '미식가'입니다."; break;
            default: comment = "다양한 매력을 골고루 즐기는 '밸런스 여행자'입니다.";
        }

        const isNone = (savedPlaces.length + upcomingSchedules.length + pastSchedules.length) === 0;

        return { 
            percentages, 
            mainType: isNone ? 'none' : mainType, 
            comment: isNone ? "아직 충분한 여행 데이터가 없습니다. 다양한 여행을 계획해보세요!" : comment 
        };
    }, [savedPlaces, upcomingSchedules, pastSchedules]);

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
