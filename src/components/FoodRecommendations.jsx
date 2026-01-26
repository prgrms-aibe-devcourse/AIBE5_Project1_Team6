import { useState } from "react";
import "../styles/food.css";

const FOOD_DATA = [
    {
        id: 1,
        name: "제주 흑돼지 맛집",
        category: "한식",
        price: "20,000원~30,000원",
        rating: 4.7,
        menu: ["흑돼지 구이", "된장찌개", "김치찌개"],
        hours: "11:00 - 22:00",
        emoji: "🍖",
        description: "제주 특산 흑돼지를 맛볼 수 있는 최고의 맛집"
    },
    {
        id: 2,
        name: "제주 해산물 뷔페",
        category: "해산물",
        price: "45,000원/인",
        rating: 4.8,
        menu: ["회", "랍스터", "전복죽", "해산물 구이"],
        hours: "12:00 - 21:00",
        emoji: "🦞",
        description: "신선한 제주 해산물을 무한리필로 즐기는 뷔페"
    },
    {
        id: 3,
        name: "애월감성카페",
        category: "카페/디저트",
        price: "5,000원~15,000원",
        rating: 4.9,
        menu: ["아메리카노", "과일주스", "브런치", "케이크"],
        hours: "09:00 - 20:00",
        emoji: "☕",
        description: "오션뷰가 아름다운 감성 카페. 인스타 핫플레이스"
    },
    {
        id: 4,
        name: "서귀포 고등어 구이",
        category: "한식",
        price: "15,000원~20,000원",
        rating: 4.6,
        menu: ["고등어 구이", "갈치조림", "된장찌개"],
        hours: "11:30 - 21:00",
        emoji: "🐟",
        description: "제주 바다에서 잡은 신선한 고등어"
    },
    {
        id: 5,
        name: "제주 국수 맛집",
        category: "한식",
        price: "8,000원~12,000원",
        rating: 4.5,
        menu: ["고기국수", "해물국수", "비빔국수"],
        hours: "10:00 - 20:00",
        emoji: "🍜",
        description: "제주 전통 고기국수를 맛볼 수 있는 현지인 맛집"
    },
    {
        id: 6,
        name: "이탈리안 레스토랑",
        category: "양식",
        price: "25,000원~40,000원",
        rating: 4.7,
        menu: ["파스타", "피자", "스테이크", "리조또"],
        hours: "11:30 - 22:00",
        emoji: "🍝",
        description: "제주 식재료를 활용한 고급 이탈리안 레스토랑"
    },
    {
        id: 7,
        name: "한라봉 아이스크림",
        category: "카페/디저트",
        price: "4,000원~8,000원",
        rating: 4.8,
        menu: ["한라봉 아이스크림", "녹차 아이스크림", "유자 셔벗"],
        hours: "10:00 - 22:00",
        emoji: "🍨",
        description: "제주 특산 한라봉으로 만든 시그니처 디저트"
    },
    {
        id: 8,
        name: "스시 오마카세",
        category: "일식",
        price: "80,000원~150,000원",
        rating: 4.9,
        menu: ["오마카세 코스", "스시", "사시미"],
        hours: "18:00 - 22:30 (예약 필수)",
        emoji: "🍣",
        description: "일본 본토 못지않은 퀄리티의 프리미엄 오마카세"
    }
];

export default function FoodRecommendations({ selectedIds = [], onSelect, onDeselect }) {
    const [filter, setFilter] = useState("전체");
    const categories = ["전체", "한식", "해산물", "일식", "양식", "카페/디저트"];

    const filteredData = filter === "전체"
        ? FOOD_DATA
        : FOOD_DATA.filter(item => item.category === filter);

    const isSelected = (id) => selectedIds.includes(id);

    const handleToggle = (food) => {
        if (isSelected(food.id)) {
            onDeselect(food.id);
        } else {
            onSelect(food);
        }
    };

    return (
        <div className="foodSection">
            <div className="foodHeader">
                <h3 className="foodTitle">🍽️ 맛집 추천</h3>
                <p className="foodSubtitle">현지 맛집에서 특별한 식사를 즐겨보세요</p>
            </div>

            {/* Category Filter */}
            <div className="foodFilters">
                {categories.map(category => (
                    <button
                        key={category}
                        className={filter === category ? "foodFilterBtn active" : "foodFilterBtn"}
                        onClick={() => setFilter(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Food Cards */}
            <div className="foodGrid">
                {filteredData.map(food => (
                    <div
                        key={food.id}
                        className={isSelected(food.id) ? "foodCard selected" : "foodCard"}
                    >
                        <div className="foodImageWrapper">
                            <div className="foodImage">{food.emoji}</div>
                            <span className="foodCategory">{food.category}</span>
                        </div>

                        <div className="foodInfo">
                            <div className="foodCardHeader">
                                <h4 className="foodName">{food.name}</h4>
                                <div className="foodRating">
                                    ⭐ {food.rating}
                                </div>
                            </div>

                            <p className="foodPrice">{food.price}</p>
                            <p className="foodDesc">{food.description}</p>
                            <p className="foodHours">🕐 {food.hours}</p>

                            <div className="foodMenuList">
                                <strong>대표 메뉴:</strong>
                                <div className="menuTags">
                                    {food.menu.slice(0, 3).map((item, idx) => (
                                        <span key={idx} className="menuTag">{item}</span>
                                    ))}
                                </div>
                            </div>

                            <button
                                className={isSelected(food.id) ? "foodSelectBtn selected" : "foodSelectBtn"}
                                onClick={() => handleToggle(food)}
                            >
                                {isSelected(food.id) ? "✓ 선택됨" : "선택하기"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedIds.length > 0 && (
                <div className="foodSelectedSummary">
                    선택한 맛집: {selectedIds.length}곳
                </div>
            )}
        </div>
    );
}
