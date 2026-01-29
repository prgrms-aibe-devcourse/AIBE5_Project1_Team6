// Mock data for Community posts (Free Board + Travel Reviews)
export const mockCommunityPosts = {
    free: [
        {
            id: 'free-1',
            category: 'free',
            title: '제주도 3박4일 여행 계획 중인데 조언 부탁드려요!',
            content: `다음 달에 제주도로 3박4일 여행을 계획하고 있어요. 렌터카는 이미 예약했고, 숙소는 서귀포 쪽으로 잡았습니다.

꼭 가봐야 할 맛집이나 숨은 명소 추천해주시면 감사하겠습니다! 특히 현지인들이 자주 가는 곳이 궁금해요 😊`,
            author_email: 'traveler1@example.com',
            author_name: '여행러버',
            user_id: 'mock-user-1',
            tags: ['제주도', '여행계획', '맛집추천'],
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: 45,
            like_count: 12,
            comment_count: 8,
            media: [],
            mood: null,
            theme: null,
            destination: null,
            rating: null
        },
        {
            id: 'free-2',
            category: 'free',
            title: '혼자 여행 vs 친구랑 여행, 여러분은 어느 쪽이 더 좋으세요?',
            content: `저는 둘 다 좋아하는데, 요즘은 혼자 여행이 더 끌려요.

혼자 가면 내 마음대로 일정 짤 수 있고, 사진도 마음껏 찍을 수 있어서 좋더라구요.
하지만 친구랑 가면 추억도 공유하고 더 재밌는 것 같기도 하고...

여러분은 어떤 스타일이 더 맞으세요? 각자의 장단점도 궁금합니다!`,
            author_email: 'solo_traveler@example.com',
            author_name: '솔로트래블러',
            user_id: 'mock-user-2',
            tags: ['혼행', '여행스타일', '고민'],
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: 78,
            like_count: 23,
            comment_count: 15,
            media: [],
            mood: null,
            theme: null,
            destination: null,
            rating: null
        },
        {
            id: 'free-3',
            category: 'free',
            title: '여행 가방 추천해주세요! (기내용)',
            content: `다음 주에 일본 오사카 3박4일 여행 가는데, 기내용 캐리어를 새로 사려고 합니다.

예산은 10만원 이하로 생각하고 있고, 가볍고 튼튼한 제품 찾고 있어요.
최근에 구매하신 분들 추천 부탁드립니다!

특히 바퀴 소음이 적고 내구성 좋은 제품이면 더 좋겠어요 🧳`,
            author_email: 'packing_master@example.com',
            author_name: '패킹마스터',
            user_id: 'mock-user-3',
            tags: ['여행가방', '캐리어', '추천'],
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            view_count: 34,
            like_count: 7,
            comment_count: 5,
            media: [],
            mood: null,
            theme: null,
            destination: null,
            rating: null
        }
    ],
    review: [
        {
            id: 'review-1',
            category: 'review',
            title: '강릉 바다 힐링 여행 후기 🌊',
            content: `주말에 강릉 다녀왔어요! 경포대 해변에서 일출 보고, 안목해변 커피거리에서 여유롭게 커피 마시면서 정말 힐링했습니다.

특히 주문진 수산시장에서 먹은 회가 정말 신선하고 맛있었어요. 가격도 합리적이고!

날씨도 좋고 사람도 많지 않아서 완벽한 힐링 여행이었습니다. 스트레스 받으신 분들께 강추합니다! 💙`,
            author_email: 'ocean_lover@example.com',
            author_name: '바다사랑',
            user_id: 'mock-user-4',
            destination: '강릉',
            rating: 5,
            tags: ['강릉', '바다', '힐링', '커피'],
            mood: 'calm',
            theme: 'healing',
            media: [
                { type: 'image', url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800' }
            ],
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: 156,
            like_count: 34,
            comment_count: 12
        },
        {
            id: 'review-2',
            category: 'review',
            title: '부산 감천문화마을 + 해운대 1박2일 완벽 코스!',
            content: `부산 1박2일로 다녀왔는데 정말 알차게 놀다 왔어요!

첫날: 감천문화마을 → 자갈치시장 → 광안리 야경
둘째날: 해운대 해수욕장 → 동백섬 산책 → 센텀시티 쇼핑

감천문화마을은 사진 찍기 너무 좋았고, 광안리 다리 야경은 정말 환상적이었어요!
해운대는 역시 부산의 상징이라는 생각이 들더라구요.

맛집도 많이 가봤는데 특히 밀면이랑 돼지국밥 맛집 리스트 댓글로 남겨드릴게요! 🍜`,
            author_email: 'busan_explorer@example.com',
            author_name: '부산탐험가',
            user_id: 'mock-user-5',
            destination: '부산',
            rating: 5,
            tags: ['부산', '감천문화마을', '해운대', '맛집'],
            mood: 'active',
            theme: 'activity',
            media: [
                { type: 'image', url: 'https://images.unsplash.com/photo-1583474923850-c2ca9e1d9b4f?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1583474924636-8fef8f6b3c8d?w=800' }
            ],
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: 203,
            like_count: 56,
            comment_count: 18
        },
        {
            id: 'review-3',
            category: 'review',
            title: '전주 한옥마을 먹방 여행 🍚 (음식 사진 多)',
            content: `전주는 역시 먹방 여행지 1순위인 것 같아요! 한옥마을 구경도 좋지만 먹는 재미가 정말 최고였습니다.

먹은 것들:
✅ 비빔밥 (한국집) - 역시 전주 비빔밥은 다르더라구요
✅ 콩나물국밥 - 해장으로 최고!
✅ 초코파이 (PNB) - 줄 서서 먹을 가치 있음
✅ 전주 막걸리 - 한옥마을 곳곳에서 시음 가능

2박3일 내내 먹기만 한 것 같은데 전혀 후회 없습니다 😋
다음엔 단풍 시즌에 다시 가보고 싶어요!`,
            author_email: 'foodie_traveler@example.com',
            author_name: '먹방여행러',
            user_id: 'mock-user-6',
            destination: '전주',
            rating: 5,
            tags: ['전주', '한옥마을', '맛집', '먹방'],
            mood: 'refresh',
            theme: 'food',
            media: [
                { type: 'image', url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800' },
                { type: 'image', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800' }
            ],
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: 189,
            like_count: 45,
            comment_count: 21
        }
    ]
};

// Mock comments for posts
export const mockComments = {
    'review-1': [
        {
            id: 'comment-1',
            post_id: 'review-1',
            author_email: 'user1@example.com',
            author_name: '여행매니아',
            content: '강릉 정말 좋죠! 저도 다음 주에 가려고 하는데 도움 많이 됐어요 👍',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'comment-2',
            post_id: 'review-1',
            author_email: 'user2@example.com',
            author_name: '커피러버',
            content: '안목해변 커피거리 분위기 정말 좋더라구요 ☕',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],
    'review-2': [
        {
            id: 'comment-3',
            post_id: 'review-2',
            author_email: 'user3@example.com',
            author_name: '부산토박이',
            content: '감천문화마을 일몰 시간에 가시면 더 예뻐요!',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],
    'review-3': [
        {
            id: 'comment-4',
            post_id: 'review-3',
            author_email: 'user4@example.com',
            author_name: '맛집헌터',
            content: '전주 비빔밥 맛집 정보 감사합니다! 다음 주에 가볼게요',
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
    ]
};
