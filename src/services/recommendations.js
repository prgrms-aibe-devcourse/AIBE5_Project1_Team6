export const getCountryRecommendations = (countryCode) => {
    const code = countryCode?.toUpperCase();
    const db = {
      // 🇺🇸 미국 (US)
      "US": [
        { id: 1, title: "Grand Canyon Meditation", category: "Nature & Healing", desc: "그랜드 캐년의 웅장한 대자연 속에서 즐기는 명상과 요가." },
        { id: 2, title: "Sedona Vortex Tour", category: "Wellness", desc: "붉은 사암의 도시 세도나에서 기(Vortex)를 느끼며 힐링하기." },
        { id: 3, title: "Central Park Walk", category: "City Walk", desc: "뉴욕의 허파 센트럴 파크에서 즐기는 여유로운 산책과 피크닉." },
        { id: 4, title: "Hawaii Beach Yoga", category: "Wellness", desc: "와이키키 해변의 파도 소리를 들으며 몸과 마음을 정화하는 시간." }
      ],
      // 🇯🇵 일본 (JP)
      "JP": [
        { id: 1, title: "Hakone Onsen", category: "Wellness", desc: "후지산을 바라보며 즐기는 료칸 온천욕과 가이세키 요리." },
        { id: 2, title: "Kyoto Temple Stay", category: "Culture", desc: "고즈넉한 교토 사찰에서 체험하는 다도와 선(Zen) 명상." },
        { id: 3, title: "Okinawa Ocean Spa", category: "Healing", desc: "에메랄드빛 바다를 보며 즐기는 오키나와 해양 심층수 스파." },
        { id: 4, title: "Arashiyama Bamboo Forest", category: "Nature", desc: "치무(대나무 숲)의 바람 소리를 들으며 걷는 힐링 산책로." }
      ],
      // 🇻🇳 베트남 (VN)
      "VN": [
        { id: 1, title: "Ha Long Bay Cruise", category: "Nature", desc: "신비로운 섬들 사이를 유유자적하게 누비는 1박 2일 크루즈." },
        { id: 2, title: "Da Nang Beach Yoga", category: "Wellness", desc: "미케 비치의 일출과 함께하는 아침 요가 클래스." },
        { id: 3, title: "Hoi An Lantern Walk", category: "Romance", desc: "형형색색의 등불이 켜진 호이안 올드타운 밤거리 산책." },
        { id: 4, title: "Sapa Trekking", category: "Activity", desc: "계단식 논과 소수민족 마을을 탐방하는 힐링 트레킹." }
      ],
      // 🇬🇧 영국 (GB)
      "GB": [
        { id: 1, title: "Cotswolds Village", category: "Healing", desc: "동화 속 세상 같은 코츠월드 시골 마을에서 즐기는 티타임." },
        { id: 2, title: "Hyde Park Picnic", category: "City Wellness", desc: "런던 도심 속 하이드 파크에서 즐기는 여유로운 오후." },
        { id: 3, title: "Bath Thermae Spa", category: "Wellness", desc: "로마 시대 유적지 바스(Bath)에서 즐기는 천연 온천욕." },
        { id: 4, title: "Scottish Highlands", category: "Nature", desc: "스코틀랜드의 광활한 자연과 호수를 감상하는 로드트립." }
      ],
      // 🇫🇷 프랑스 (FR)
      "FR": [
        { id: 1, title: "Provence Lavender Fields", category: "Nature", desc: "보랏빛 라벤더 향기가 가득한 프로방스 들판 산책." },
        { id: 2, title: "Seine River Cruise", category: "Romance", desc: "파리의 낭만적인 야경을 감상하며 즐기는 센강 유람선." },
        { id: 3, title: "Vichy Spa Town", category: "wellness", desc: "나폴레옹 3세도 사랑한 온천 도시 비시에서의 스파 테라피." },
        { id: 4, title: "Mont Saint-Michel", category: "History", desc: "바다 위 신비로운 수도원 몽생미셸에서의 영적인 하루." }
      ],
      // 🇬🇭 가나 (GH)
      "GH": [
        { id: 1, title: "Kakum National Park", category: "Nature", desc: "열대우림 위를 걷는 캐놀피 워크와 생태 체험." },
        { id: 2, title: "Cape Coast Castle", category: "History", desc: "역사의 숨결이 살아있는 케이프 코스트 성 투어." },
        { id: 3, title: "Mole National Park", category: "Safari", desc: "코끼리와 야생동물을 만날 수 있는 가나 최대의 사파리." },
        { id: 4, title: "Labadi Beach Relax", category: "Leisure", desc: "아크라의 대표 해변 라바디 비치에서의 휴식과 음악." }
      ],
      // 🇹🇭 태국 (TH)
      "TH": [
        { id: 1, title: "Chiang Mai Yoga Retreat", category: "Wellness", desc: "치앙마이 숲속 리조트에서 즐기는 요가와 명상 리트릿." },
        { id: 2, title: "Thai Massage Experience", category: "Healing", desc: "전통 왓포 스쿨에서 체험하는 정통 타이 마사지." },
        { id: 3, title: "Phi Phi Island Snorkeling", category: "Activity", desc: "에메랄드빛 바다 속을 탐험하는 피피섬 스노클링." },
        { id: 4, title: "Ayutthaya Temple Tour", category: "History", desc: "고대 왕국의 유적 아유타야 자전거 투어." }
      ],
      // 🇪🇸 스페인 (ES)
      "ES": [
        { id: 1, title: "Camino de Santiago", category: "Pilgrimage", desc: "나를 찾아 떠나는 산티아고 순례길 도보 여행." },
        { id: 2, title: "Ibiza Yoga & Beach", category: "Wellness", desc: "이비자섬의 고요한 해변에서 즐기는 선셋 요가." },
        { id: 3, title: "Alhambra Palace Walk", category: "History", desc: "그라나다 알함브라 궁전의 아름다운 정원 산책." },
        { id: 4, title: "Barcelona Gaudi Tour", category: "Art", desc: "가우디의 숨결이 살아있는 사그라다 파밀리아와 구엘 공원." }
      ],
      // 🇮🇹 이탈리아 (IT)
      "IT": [
        { id: 1, title: "Tuscany Winery Tour", category: "Gourmet", desc: "토스카나의 황금빛 들판을 보며 즐기는 와인 테이스팅." },
        { id: 2, title: "Amalfi Coast Drive", category: "Scenery", desc: "지중해의 보석 아말피 해안도로 드라이브." },
        { id: 3, title: "Dolomites Trekking", category: "Nature", desc: "알프스의 웅장함을 느끼는 돌로미티 트레킹." },
        { id: 4, title: "Rome Gelato Tour", category: "Gourmet", desc: "로마 골목골목 숨은 젤라또 맛집 탐방." }
      ],
       // 🇷🇺 러시아 (RU) -> 경보 3단계라 UI에서 안 나오지만 데이터는 둠
       "RU": [
          { id: 1, title: "Baikal Lake Tour", category: "Nature", desc: "세계에서 가장 깊은 호수 바이칼에서의 영롱한 얼음 트레킹." },
          { id: 2, title: "Trans-Siberian Railway", category: "Adventure", desc: "시베리아 횡단열차를 타고 떠나는 대륙 횡단 여행." },
          { id: 3, title: "St. Basil's Cathedral", category: "Culture", desc: "테트리스 성으로 유명한 성 바실리 대성당 관람." },
          { id: 4, title: "Hermitage Museum", category: "Art", desc: "세계 3대 박물관 에르미타주에서의 예술 기행." }
      ],
      // 🇮🇳 인도 (IN)
      "IN": [
          { id: 1, title: "Rishikesh Yoga", category: "Wellness", desc: "요가의 본고장 리시케시 갠지스강변에서의 수련." },
          { id: 2, title: "Taj Mahal Sunrise", category: "History", desc: "사랑의 금자탑 타지마할의 몽환적인 일출 감상." },
          { id: 3, title: "Kerala Houseboat", category: "Healing", desc: "케랄라 백워터에서 즐기는 하우스보트 유람." },
          { id: 4, title: "Jaipur Pink City", category: "Culture", desc: "핑크 시티 자이푸르의 화려한 궁전 탐방." }
      ],
      // 🇮🇷 이란 (IR) -> 경보 3단계
      "IR": [
          { id: 1, title: "Persepolis Ruin", category: "History", desc: "고대 페르시아 제국의 영광, 페르세폴리스 유적." },
          { id: 2, title: "Isfahan Naqsh-e Jahan", category: "Culture", desc: "세상의 절반이라 불리던 이스파한 광장 산책." },
          { id: 3, title: "Shiraz Pink Mosque", category: "Art", desc: "빛의 향연이 펼쳐지는 핑크 모스크 인생샷." },
          { id: 4, title: "Yazd Desert Tour", category: "Adventure", desc: "침묵의 탑과 야즈드 사막 도시 탐험." }
      ],
      // 🇮🇶 이라크 (IQ) -> 경보 4단계 (여행금지)
      "IQ": [],
      // 🇺🇿 우즈베키스탄 (UZ)
      "UZ": [
          { id: 1, title: "Samarkand Registan", category: "History", desc: "실크로드의 심장, 레기스탄 광장의 푸른 타일 감상." },
          { id: 2, title: "Bukhara Old City", category: "Culture", desc: "시간이 멈춘 듯한 부하라 고도시 골목 여행." },
          { id: 3, title: "Chimgan Mountains", category: "Nature", desc: "침간 산맥에서의 하이킹과 승마 체험." },
          { id: 4, title: "Tashkent Metro Tour", category: "Art", desc: "세계에서 가장 아름다운 지하철역 타슈켄트 메트로 투어." }
      ],
      // 🇨🇦 캐나다 (CA)
      "CA": [
          { id: 1, title: "Banff National Park", category: "Nature", desc: "로키산맥의 보석 밴프와 레이크 루이스의 에메랄드 물빛." },
          { id: 2, title: "Yellowknife Aurora", category: "Nature", desc: "나사가 선정한 세계 최고의 오로라 관측지 옐로나이프." },
          { id: 3, title: "Niagara Falls", category: "Scenery", desc: "압도적인 스케일의 나이아가라 폭포 크루즈." },
          { id: 4, title: "Quebec Old Town", category: "Romance", desc: "드라마 도깨비 촬영지 퀘벡 올드타운의 낭만." }
      ],
      // 🇨🇳 중국 (CN)
      "CN": [
          { id: 1, title: "Great Wall Hiking", category: "History", desc: "만리장성 위를 걸으며 느끼는 대륙의 웅장함." },
          { id: 2, title: "Zhangjiajie Avatar Tour", category: "Nature", desc: "영화 아바타의 모티브가 된 장가계의 비경." },
          { id: 3, title: "Shanghai The Bund", category: "City", desc: "상해 와이탄에서 바라보는 화려한 마천루 야경." },
          { id: 4, title: "Chengdu Panda Base", category: "Healing", desc: "귀여운 자이언트 판다들과 함께하는 힐링 타임." }
      ],
      // 🇨🇭 스위스 (CH)
      "CH": [
          { id: 1, title: "Jungfrau Train Trip", category: "Nature", desc: "산악열차를 타고 올라가는 유럽의 지붕 융프라우요흐." },
          { id: 2, title: "Zermatt Matterhorn", category: "Scenery", desc: "마터호른 봉우리를 바라보며 즐기는 청정 하이킹." },
          { id: 3, title: "Interlaken Paragliding", category: "Activity", desc: "하늘에서 내려다보는 인터라켄의 두 호수와 알프스." },
          { id: 4, title: "Swiss Spa Wellness", category: "Wellness", desc: "알프스 산맥을 바라보며 즐기는 로이커바트 야외 온천." }
      ],
      // 🇬🇷 그리스 (GR)
      "GR": [
          { id: 1, title: "Santorini Sunset", category: "Romance", desc: "산토리니 이아 마을에서 보는 세상에서 가장 아름다운 일몰." },
          { id: 2, title: "Acropolis Tour", category: "History", desc: "아테네 아크로폴리스 파르테논 신전의 고대 숨결." },
          { id: 3, title: "Zakynthos Shipwreck", category: "Scenery", desc: "태양의 후예 촬영지 자킨토스 나바지오 해변." },
          { id: 4, title: "Meteora Monasteries", category: "Mystery", desc: "공중에 떠 있는 듯한 메테오라 수도원 순례." }
      ],
      // 🇰🇷 한국 (KR)
      "KR": [
          { id: 1, title: "Jeju Olle Trail", category: "Nature", desc: "제주도의 바람과 바다를 느끼며 걷는 힐링 올레길." },
          { id: 2, title: "Gyeongbokgung Palace", category: "History", desc: "한복 입고 거니는 서울의 고궁 경복궁." },
          { id: 3, title: "Templestay", category: "Wellness", desc: "산사에서 나를 돌아보는 1박 2일 템플스테이." },
          { id: 4, title: "Han River Picnic", category: "Leisure", desc: "한강 공원에서 즐기는 치맥과 야경 피크닉." }
      ],
      // 🇹🇼 대만 (TW)
      "TW": [
          { id: 1, title: "Jiufen Tea House", category: "Culture", desc: "센과 치히로의 모티브가 된 지우펀에서 즐기는 차 한잔." },
          { id: 2, title: "Beitou Hot Spring", category: "Wellness", desc: "타이베이 근교 베이터우 유황 온천 힐링." },
          { id: 3, title: "Taroko Gorge", category: "Nature", desc: "대자연이 빚어낸 걸작 타이루거 협곡 트레킹." },
          { id: 4, title: "Shilin Night Market", category: "Gourmet", desc: "대만 여행의 묘미, 스린 야시장 먹거리 투어." }
      ],
      // 🇲🇽 멕시코 (MX)
      "MX": [
          { id: 1, title: "Cancun Cenote Swim", category: "Nature", desc: "신비로운 천연 우물 세노테에서의 스노클링." },
          { id: 2, title: "Teotihuacan Pyramids", category: "History", desc: "신들의 도시 테오티우아칸 해와 달의 피라미드 등반." },
          { id: 3, title: "Oaxaca Food Tour", category: "Gourmet", desc: "미식의 도시 오악사카에서 즐기는 타코와 메즈칼." },
          { id: 4, title: "Tulum Ruins & Beach", category: "Scenery", desc: "카리브해 절벽 위에 세워진 툴룸 마야 유적." }
      ],
      // 🇦🇷 아르헨티나 (AR)
      "AR": [
          { id: 1, title: "Perito Moreno Glacier", category: "Nature", desc: "살아 움직이는 거대한 얼음, 페리토 모레노 빙하 트레킹." },
          { id: 2, title: "Iguazu Falls", category: "Nature", desc: "악마의 목구멍이라 불리는 압도적인 이과수 폭포." },
          { id: 3, title: "Tango Show", category: "Culture", desc: "탱고의 본고장 부에노스아이레스에서 즐기는 정열의 공연." },
          { id: 4, title: "Mendoza Wine Tour", category: "Gourmet", desc: "안데스 산맥 아래 멘도사 와이너리 투어." }
      ],
      // 🇧🇷 브라질 (BR)
      "BR": [
          { id: 1, title: "Christ the Redeemer", category: "Landmark", desc: "리우데자네이루 코르코바도 언덕의 거대 예수상." },
          { id: 2, title: "Copacabana Beach", category: "Leisure", desc: "세계적인 휴양지 코파카바나 해변의 열정." },
          { id: 3, title: "Amazon Jungle Tour", category: "Adventure", desc: "지구의 허파 아마존 정글 탐험과 생태 체험." },
          { id: 4, title: "Iguazu Boat Ride", category: "Activity", desc: "브라질 쪽에서 바라보는 파노라마 이과수와 보트 투어." }
      ],
      // 🇿🇦 남아프리카공화국 (ZA)
      "ZA": [
          { id: 1, title: "Kruger National Park", category: "Safari", desc: "Big 5를 찾아 떠나는 크루거 국립공원 게임 드라이브." },
          { id: 2, title: "Table Mountain Hike", category: "Nature", desc: "케이프타운의 상징 테이블 마운틴 등반과 전경." },
          { id: 3, title: "Cape of Good Hope", category: "History", desc: "대서양과 인도양이 만나는 희망봉 탐방." },
          { id: 4, title: "Boulders Beach Penguins", category: "Nature", desc: "귀여운 아프리카 펭귄들과 함께하는 해변 산책." }
      ],
      // 🇺🇾 우루과이 (UY)
      "UY": [
          { id: 1, title: "Punta del Este", category: "Leisure", desc: "남미의 모나코라 불리는 푼타 델 에스테의 럭셔리 휴양." },
          { id: 2, title: "Colonia del Sacramento", category: "History", desc: "유네스코 등재 식민지 시대 구시가지 골목 여행." },
          { id: 3, title: "Montevideo Rambla", category: "City Walk", desc: "몬테비데오 해안 산책로 람블라에서 즐기는 마테차 한잔." },
          { id: 4, title: "Cabo Polonio", category: "Nature", desc: "전기 없는 오지 마을 카보 폴로니오에서의 디지털 디톡스." }
      ],
      // 🇭🇹 아이티 (HT) -> 경보 4단계
      "HT": []
    };
  
    return db[code] || [];
  };
