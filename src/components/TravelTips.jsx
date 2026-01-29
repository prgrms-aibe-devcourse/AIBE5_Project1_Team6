import "../styles/checklist.css";

const TIPS_DATA = [
    {
        icon: "☀️",
        title: "날씨 체크",
        description: "출발 전 여행지 날씨를 확인하고 적절한 옷차림을 준비하세요. 일교차가 클 수 있으니 겉옷을 챙기는 것이 좋습니다."
    },
    {
        icon: "💰",
        title: "환전 준비(해외 여행시)",
        description: "현지 화폐를 미리 환전하거나 해외 사용 가능한 카드를 준비하세요. 소액권을 함께 준비하면 편리합니다."
    },
    {
        icon: "🗺️",
        title: "오프라인 지도",
        description: "Google Maps 등 지도 앱에서 여행지 지도를 미리 다운로드해두세요. 인터넷이 없어도 길을 찾을 수 있습니다."
    },
    {
        icon: "📱",
        title: "긴급 연락처",
        description: "대사관, 경찰, 숙소 등 긴급 연락처를 메모에 저장해두세요. 스크린샷으로 저장하면 더 편리합니다."
    },
    {
        icon: "🏥",
        title: "여행자 보험",
        description: "예상치 못한 사고나 질병에 대비해 여행자 보험에 가입하세요. 의료비 지원이 포함된 보험을 추천합니다."
    },
    {
        icon: "📸",
        title: "사진 백업",
        description: "소중한 여행 사진을 잃지 않도록 클라우드나 외장하드에 백업하세요. 자동 백업을 설정하면 더 안심입니다."
    },
    {
        icon: "🔋",
        title: "보조배터리 필수",
        description: "여행 중 스마트폰 배터리 방전에 대비해 보조배터리를 꼭 챙기세요. 용량이 큰 것을 추천합니다."
    },
    {
        icon: "🎒",
        title: "짐 최소화",
        description: "필요한 것만 챙겨 짐을 최소화하세요. 현지에서 구매할 수 있는 것은 굳이 챙기지 않아도 됩니다."
    },
    {
        icon: "🍽️",
        title: "식사 예약",
        description: "인기 맛집은 예약이 필수일 수 있습니다. 미리 예약하거나 대기 시간을 고려하세요."
    },
    {
        icon: "⏰",
        title: "시간 여유",
        description: "일정을 너무 빡빡하게 짜지 마세요. 여유 시간을 두고 현지의 분위기를 즐기는 것도 여행의 묘미입니다."
    }
];

export default function TravelTips() {
    return (
        <div className="tipsContainer">
            <div className="tipsHeader">
                <h3 className="tipsTitle">💡 여행 꿀팁</h3>
                <p className="tipsSubtitle">즐거운 여행을 위한 유용한 정보들</p>
            </div>

            <div className="tipsGrid">
                {TIPS_DATA.map((tip, index) => (
                    <div key={index} className="tipCard">
                        <div className="tipIcon">{tip.icon}</div>
                        <h4 className="tipTitle">{tip.title}</h4>
                        <p className="tipDesc">{tip.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
