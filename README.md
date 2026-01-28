# ✈️ Walk2Fly (W2F) - AI Unplanned Wellness Planner

#### Zero-Load Planning & Zero-Risk Travel > 계획의 부하는 줄이고, 온전한 쉼을 선사하는 AI 무계획 웰니스 플래너

## 📖 Project Overview
Walk2Fly는 번아웃을 겪는 2030 직장인을 위한 초개인화 여행 일정 추천 서비스입니다. 

복잡한 계획 수립 과정 없이, 사용자의 현재 기분과 상태(Vibe)만으로 1분 안에 최적의 웰니스 여행 코스를 제안합니다.
- MVP Focus: 결제/운영/마케팅 기능을 제외하고, **오직** '**사용자 경험(UX) 검증**'에 집중합니다.
- Core Value: 사용자가 여행지를 '많이' 가는 것보다 '편안한' 상태를 유지하는 것에 집중합니다.

## ✨ Key Features (MVP)

### 1. Mood-Palette (Click-based Onboarding)
설문조사 없이 **6번의 탭**(**Tap**)만으로 여행 준비를 완료합니다.
- Flow: 이동수단 → 예산 → 동행 → 선호 활동 → 여행지 선택 → 로그인
- UX: 텍스트 입력을 배제하고 이모지와 키워드 버튼으로 구성하여 30초 내 진입 목표.


### 2. Instant Route (AI Scheduler)
- Zero Latency: 무드 팔레트 완료 즉시 Gemini AI가 3~4개의 맞춤형 스팟을 추천합니다.
- Performance: 컵라면보다 빠른 속도(30초 이내)로 경로 생성.

### 3. Wellness Sensory Review
기존 별점(Star Rating) 시스템을 대체하여 **감각**(**Sense**)을 정량화합니다.
- Metrics: 소음(Noise), 조도(Light), 혼잡도(Crowd)
- Summary: 카테고리를 활용해 리뷰에 "멍 때리기 좋은 곳"과 같은 한 줄 요약으로 제공.

### 4. Travel Biorhythm & Archive
- Dashboard: 나의 여행 취향(자연 vs 도심)과 웰니스 점수 변화를 그래프로 시각화.
- Archive: 생성된 일정을 **PDF**(**처방전 컨셉**)로 소장하거나, 커뮤니티에 공유하여 타인의 여행 동기 부여.

### 5. Multi-Mobility Map
이동 수단에 따라 지도의 렌더링 방식과 추천 경로를 최적화합니다.
- Modes: 🚶 Walk(도보 웰니스), 🚌 Traffic(대중교통), ✈️ Airplane(장거리)

## 🛠 Tech Stack

### Frontend
- Core: React 19.2.0, Vite 7.2.4
- State Management: Zustand, TanStack React Query
- Styling & UI: CSS Modules, Framer Motion (Animation), Swiper, React Hot Toast
- Map: React Leaflet, Kakao Maps API

### Backend & Data
- BaaS: Supabase (Auth, PostgreSQL DB, Real-time, Edge Functions)

### AI & External APIs
- AI: Google Gemini API (Travel Planning & Review Summary)
- Data: Amadeus (Flight), Open-Meteo (Weather), Korea Tourism Organization (Place Data)
