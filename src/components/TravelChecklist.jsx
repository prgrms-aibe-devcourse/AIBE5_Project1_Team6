import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import "../styles/checklist.css";

const DEFAULT_CHECKLIST = [
    {
        category: "필수 서류",
        items: [
            { id: "doc1", text: "여권 (유효기간 6개월 이상)", checked: false },
            { id: "doc2", text: "항공권 (이메일 확인)", checked: false },
            { id: "doc3", text: "숙소 예약 확인서", checked: false },
            { id: "doc4", text: "여행자 보험 가입증", checked: false },
            { id: "doc5", text: "신분증", checked: false },
        ]
    },
    {
        category: "의류",
        items: [
            { id: "cloth1", text: "상의 (날씨에 맞게)", checked: false },
            { id: "cloth2", text: "하의 (바지/치마)", checked: false },
            { id: "cloth3", text: "속옷/양말", checked: false },
            { id: "cloth4", text: "외투/겉옷", checked: false },
            { id: "cloth5", text: "운동화/편한 신발", checked: false },
            { id: "cloth6", text: "샌들/슬리퍼", checked: false },
        ]
    },
    {
        category: "전자기기",
        items: [
            { id: "elec1", text: "스마트폰", checked: false },
            { id: "elec2", text: "충전기/보조배터리", checked: false },
            { id: "elec3", text: "멀티 어댑터", checked: false },
            { id: "elec4", text: "카메라 (선택)", checked: false },
            { id: "elec5", text: "이어폰", checked: false },
        ]
    },
    {
        category: "세면도구",
        items: [
            { id: "bath1", text: "칫솔/치약", checked: false },
            { id: "bath2", text: "샴푸/린스/바디워시", checked: false },
            { id: "bath3", text: "수건", checked: false },
            { id: "bath4", text: "화장품/스킨케어", checked: false },
            { id: "bath5", text: "자외선 차단제", checked: false },
        ]
    },
    {
        category: "기타",
        items: [
            { id: "etc1", text: "상비약 (두통약, 소화제 등)", checked: false },
            { id: "etc2", text: "물통/텀블러", checked: false },
            { id: "etc3", text: "우산/우비", checked: false },
            { id: "etc4", text: "마스크", checked: false },
            { id: "etc5", text: "비닐봉투", checked: false },
        ]
    }
];

export default function TravelChecklist({ checklistData = DEFAULT_CHECKLIST, onChange, destination, scheduleId }) {
    const { user } = useAuthStore();
    const [checklist, setChecklist] = useState(checklistData);
    const [loading, setLoading] = useState(false);
    const [checklistId, setChecklistId] = useState(null);

    const isJeju = destination && (
        (typeof destination === 'string' && destination.includes("제주")) ||
        (destination.label && destination.label.includes("제주"))
    );

    // 사용자 변경 시 상태 초기화 (로그아웃/로그인)
    useEffect(() => {
        if (!user?.id) {
            // 로그아웃 시 초기화
            setChecklist(checklistData);
            setChecklistId(null);
            setLoading(false);
        }
    }, [user?.id, checklistData]);

    // Supabase에서 체크리스트 불러오기
    useEffect(() => {
        const fetchChecklist = async () => {
            if (!user?.id || !scheduleId) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('travel_checklists')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('schedule_id', scheduleId)
                    .maybeSingle();

                if (error) {
                    console.error('체크리스트 불러오기 실패:', error);
                } else if (data) {
                    setChecklist(data.checklist_data);
                    setChecklistId(data.id);
                } else {
                    // 저장된 데이터가 없으면 기본값 사용
                    setChecklist(checklistData);
                    setChecklistId(null);
                }
            } catch (err) {
                console.error('체크리스트 fetch 오류:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChecklist();
    }, [user?.id, scheduleId, checklistData]);

    // 체크리스트 저장 (debounced)
    const saveChecklist = useCallback(async (newChecklist) => {
        if (!user?.id || !scheduleId) return;

        try {
            if (checklistId) {
                // 기존 데이터 업데이트
                await supabase
                    .from('travel_checklists')
                    .update({ checklist_data: newChecklist, updated_at: new Date().toISOString() })
                    .eq('id', checklistId);
            } else {
                // 새 데이터 삽입
                const { data, error } = await supabase
                    .from('travel_checklists')
                    .insert({
                        user_id: user.id,
                        schedule_id: scheduleId,
                        checklist_data: newChecklist
                    })
                    .select()
                    .single();

                if (!error && data) {
                    setChecklistId(data.id);
                }
            }
        } catch (err) {
            console.error('체크리스트 저장 실패:', err);
        }
    }, [user?.id, scheduleId, checklistId]);

    const totalItems = checklist.reduce((sum, category) => sum + category.items.length, 0);
    const checkedItems = checklist.reduce((sum, category) => 
        sum + category.items.filter(item => item.checked).length, 0);
    
    const progress = {
        total: totalItems,
        checked: checkedItems,
        percentage: totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
    };

    const handleToggle = (categoryIdx, itemId) => {
        const newChecklist = checklist.map((category, catIdx) => {
            if (catIdx === categoryIdx) {
                return {
                    ...category,
                    items: category.items.map(item =>
                        item.id === itemId ? { ...item, checked: !item.checked } : item
                    )
                };
            }
            return category;
        });
        setChecklist(newChecklist);
        if (onChange) onChange(newChecklist);
        saveChecklist(newChecklist);
    };

    // 로딩 중 표시
    if (loading) {
        return (
            <div className="checklistContainer">
                <div className="checklistHeader">
                    <h3 className="checklistTitle">✅ 여행 준비 체크리스트</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="checklistContainer">
            <div className="checklistHeader">
                <h3 className="checklistTitle">✅ 여행 준비 체크리스트</h3>
                <div className="checklistProgress">
                    <div className="progressBar">
                        <div
                            className="progressFill"
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                    <span className="progressText">
                        {progress.checked}/{progress.total} ({progress.percentage}%)
                    </span>
                </div>
                {!user && (
                    <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                        💡 로그인하면 체크리스트가 자동 저장됩니다
                    </p>
                )}
            </div>

            <div className="checklistCategories">
                {checklist.map((category, catIdx) => {
                    const categoryProgress = {
                        total: category.items.length,
                        checked: category.items.filter(item => item.checked).length
                    };
                    
                    const isRequiredDocs = category.category === "필수 서류";

                    return (
                        <div key={catIdx} className="checklistCategory">
                            <div className="categoryHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 className="categoryTitle">
                                    {category.category}
                                </h4>
                                {isRequiredDocs && (
                                    <label className="domesticToggle" style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={checklist[catIdx].items.find(i => i.text.includes("여권"))?.checked && checklist[catIdx].items.find(i => i.text.includes("여행자 보험"))?.checked}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                const newChecklist = [...checklist];
                                                newChecklist[catIdx].items = newChecklist[catIdx].items.map(item => {
                                                    if (item.text.includes("여권") || item.text.includes("여행자 보험")) {
                                                        return { ...item, checked: isChecked };
                                                    }
                                                    return item;
                                                });
                                                setChecklist(newChecklist);
                                                if (onChange) onChange(newChecklist);
                                                saveChecklist(newChecklist);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        국내 여행일 경우
                                    </label>
                                )}
                            </div>
                            <div className="checklistItems">
                                {category.items.map(item => {
                                    const isPassport = item.text.includes("여권");
                                    const shouldStrike = isJeju && isPassport;

                                    return (
                                        <label key={item.id} className="checklistItem">
                                            <input
                                                type="checkbox"
                                                checked={item.checked}
                                                onChange={() => handleToggle(catIdx, item.id)}
                                                className="checklistCheckbox"
                                                disabled={shouldStrike} 
                                            />
                                            <span 
                                                className={item.checked ? "itemText checked" : "itemText"}
                                                style={shouldStrike ? { textDecoration: 'line-through', color: '#ccc', opacity: 0.7 } : {}}
                                            >
                                                {item.text} {shouldStrike && "(국내여행 불필요)"}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="categoryFooter" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <span className="categoryCount" style={{ fontSize: '13px', color: '#5C94FF', fontWeight: 600 }}>
                                    {categoryProgress.checked}/{categoryProgress.total}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
