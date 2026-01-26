import { useState } from "react";
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

export default function TravelChecklist({ checklistData = DEFAULT_CHECKLIST, onChange }) {
    const [checklist, setChecklist] = useState(checklistData);

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
    };

    const getTotalProgress = () => {
        const total = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
        const checked = checklist.reduce((sum, cat) =>
            sum + cat.items.filter(item => item.checked).length, 0
        );
        return { total, checked, percentage: Math.round((checked / total) * 100) };
    };

    const progress = getTotalProgress();

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
            </div>

            <div className="checklistCategories">
                {checklist.map((category, catIdx) => {
                    const categoryProgress = {
                        total: category.items.length,
                        checked: category.items.filter(item => item.checked).length
                    };

                    return (
                        <div key={catIdx} className="checklistCategory">
                            <h4 className="categoryTitle">
                                {category.category}
                                <span className="categoryCount">
                                    {categoryProgress.checked}/{categoryProgress.total}
                                </span>
                            </h4>
                            <div className="checklistItems">
                                {category.items.map(item => (
                                    <label key={item.id} className="checklistItem">
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => handleToggle(catIdx, item.id)}
                                            className="checklistCheckbox"
                                        />
                                        <span className={item.checked ? "itemText checked" : "itemText"}>
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
