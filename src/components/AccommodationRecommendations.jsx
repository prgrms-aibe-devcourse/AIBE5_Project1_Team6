import { useState } from "react";
import "../styles/accommodations.css";

const ACCOMMODATION_DATA = [
    {
        id: 1,
        name: "제주 오션뷰 호텔",
        type: "호텔",
        price: "150,000원/박",
        rating: 4.8,
        location: "제주시 중심가",
        amenities: ["무료 WiFi", "조식 포함", "수영장", "주차 가능"],
        image: "🏨",
        description: "바다 전망이 아름다운 5성급 호텔. 공항에서 15분 거리"
    },
    {
        id: 2,
        name: "서귀포 게스트하우스",
        type: "게스트하우스",
        price: "45,000원/박",
        rating: 4.5,
        location: "서귀포 해변",
        amenities: ["무료 WiFi", "공용 주방", "세탁기"],
        image: "🏠",
        description: "편안하고 아늑한 분위기의 게스트하우스. 혼자 또는 친구들과 함께"
    },
    {
        id: 3,
        name: "한라산 펜션",
        type: "펜션",
        price: "90,000원/박",
        rating: 4.6,
        location: "한라산 인근",
        amenities: ["무료 WiFi", "바비큐 시설", "주차 가능", "애완동물 가능"],
        image: "🏡",
        description: "자연 속에서 힐링할 수 있는 독채 펜션"
    },
    {
        id: 4,
        name: "제주 에어비앤비",
        type: "에어비앤비",
        price: "80,000원/박",
        rating: 4.7,
        location: "애월읍",
        amenities: ["무료 WiFi", "전용 주방", "세탁기", "넷플릭스"],
        image: "🏘️",
        description: "깔끔하고 감성적인 인테리어의 원룸형 숙소"
    },
    {
        id: 5,
        name: "중문 리조트",
        type: "리조트",
        price: "200,000원/박",
        rating: 4.9,
        location: "중문관광단지",
        amenities: ["무료 WiFi", "조식 포함", "스파", "골프장", "키즈룸"],
        image: "🏖️",
        description: "가족 단위 여행객에게 최적의 올인클루시브 리조트"
    }
];

export default function AccommodationRecommendations({ selectedIds = [], onSelect, onDeselect }) {
    const [filter, setFilter] = useState("전체");
    const types = ["전체", "호텔", "게스트하우스", "펜션", "에어비앤비", "리조트"];

    const filteredData = filter === "전체"
        ? ACCOMMODATION_DATA
        : ACCOMMODATION_DATA.filter(item => item.type === filter);

    const isSelected = (id) => selectedIds.includes(id);

    const handleToggle = (accommodation) => {
        if (isSelected(accommodation.id)) {
            onDeselect(accommodation.id);
        } else {
            onSelect(accommodation);
        }
    };

    return (
        <div className="accommodationSection">
            <div className="accommodationHeader">
                <h3 className="accommodationTitle">🏨 숙소 추천</h3>
                <p className="accommodationSubtitle">여행에 맞는 숙소를 선택하세요</p>
            </div>

            {/* Filter */}
            <div className="accommodationFilters">
                {types.map(type => (
                    <button
                        key={type}
                        className={filter === type ? "filterBtn active" : "filterBtn"}
                        onClick={() => setFilter(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Accommodation Cards */}
            <div className="accommodationGrid">
                {filteredData.map(accommodation => (
                    <div
                        key={accommodation.id}
                        className={isSelected(accommodation.id) ? "accommodationCard selected" : "accommodationCard"}
                    >
                        <div className="accommodationImageWrapper">
                            <div className="accommodationImage">{accommodation.image}</div>
                            <span className="accommodationType">{accommodation.type}</span>
                        </div>

                        <div className="accommodationInfo">
                            <div className="accommodationHeader">
                                <h4 className="accommodationName">{accommodation.name}</h4>
                                <div className="accommodationRating">
                                    ⭐ {accommodation.rating}
                                </div>
                            </div>

                            <p className="accommodationLocation">📍 {accommodation.location}</p>
                            <p className="accommodationPrice">{accommodation.price}</p>
                            <p className="accommodationDesc">{accommodation.description}</p>

                            <div className="accommodationAmenities">
                                {accommodation.amenities.map((amenity, idx) => (
                                    <span key={idx} className="amenityTag">{amenity}</span>
                                ))}
                            </div>

                            <button
                                className={isSelected(accommodation.id) ? "selectBtn selected" : "selectBtn"}
                                onClick={() => handleToggle(accommodation)}
                            >
                                {isSelected(accommodation.id) ? "✓ 선택됨" : "선택하기"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedIds.length > 0 && (
                <div className="selectedSummary">
                    선택한 숙소: {selectedIds.length}개
                </div>
            )}
        </div>
    );
}
