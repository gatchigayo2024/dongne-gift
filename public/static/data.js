// 샘플 데이터

// 🔥 API 호출로 데이터 로드
let sampleGifts = [];
let togetherPosts = [];

// Load gifts from API
async function loadGiftsFromAPI() {
    try {
        const response = await fetch('/api/gifts');
        const data = await response.json();
        if (data.success) {
            // Convert snake_case to camelCase for compatibility
            sampleGifts = data.data.map(gift => ({
                id: gift.id,
                storeName: gift.store_name,
                storeIntro: gift.store_intro,
                productName: gift.product_name,
                originalPrice: gift.original_price,
                discountRate: gift.discount_rate,
                discountedPrice: gift.discounted_price,
                location: gift.location,
                address: gift.address,
                likes: gift.likes,
                purchases: gift.purchases,
                images: gift.images,
                description: gift.description,
                comments: [],
                groupBuys: [],
                togetherPosts: []
            }));
            console.log('✅ Loaded', sampleGifts.length, 'gifts from API');
        }
    } catch (error) {
        console.error('❌ Failed to load gifts:', error);
    }
}

// Load together posts from API
async function loadTogetherPostsFromAPI() {
    try {
        const response = await fetch('/api/together-posts');
        const data = await response.json();
        if (data.success) {
            togetherPosts = data.data.map(post => ({
                id: post.id,
                nickname: post.nickname,
                time: getTimeAgo(post.created_at),
                title: post.title,
                content: post.content,
                date: post.visit_date,
                time: post.visit_time,
                people: post.people_count,
                storeName: post.store_name,
                storeAddress: post.store_address,
                question: post.question,
                authorInfo: post.author_info,
                likes: post.likes
            }));
            console.log('✅ Loaded', togetherPosts.length, 'together posts from API');
        }
    } catch (error) {
        console.error('❌ Failed to load together posts:', error);
    }
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
}

// 사용자 데이터베이스 (전화번호를 키로 사용)
const usersDatabase = {
    // '01012345678': { phoneNumber: '010-1234-5678', nickname: '여행좋아' }
};

// 좋아요 데이터 저장소 (전화번호별로 관리)
const userLikesDatabase = {
    // '01012345678': { gifts: [1, 3], togetherPosts: [101, 103] }
};

// 현재 사용자의 좋아요 데이터 (로그인 시 로드됨)
const userLikes = {
    gifts: [], // 좋아요한 동네선물 ID 배열
    togetherPosts: [] // 좋아요한 같이가요 ID 배열
};

// 백업용 샘플 데이터 (API 실패시)
const sampleGiftsBackup = [
    {
        id: 1,
        storeName: "이탈리맛피아",
        storeIntro: "흑백요리사 우승자 박성재 쉐프의 이탈리안 레스토랑",
        productName: "특별 코스 메뉴",
        originalPrice: 150000,
        discountRate: 10,
        discountedPrice: 135000,
        location: "서울시 광진구",
        address: "서울시 광진구 능동로 120",
        likes: 328,
        purchases: 142,
        images: [
            "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800",
            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"
        ],
        description: `작년 화제속에 방영되었던 흑백요리사 최종 우승자 박성재 쉐프의 <이탈리맛피아> 할인 방문권입니다.

방송에서 선보인 특별한 기법으로 제철 식재료로 만든 다양한 육류, 해산물, 생면파스타 요리들을 코스로 맛볼 수 있어요.

미식을 사랑하는 사람들에게 잊지 못할 특별한 선물이 될 것입니다.`,
        comments: [
            {
                nickname: "미식가진호",
                date: "2024-01-15",
                purchases: 2,
                comment: "여기 제가 가본 맛집 Top 3인데 여전히 맛있더군요",
                empathy: 45
            },
            {
                nickname: "요리사랑",
                date: "2024-01-12",
                purchases: 1,
                comment: "방송에서 본 그 맛 그대로였어요! 특히 생면 파스타가 예술이에요",
                empathy: 38
            },
            {
                nickname: "데이트왕",
                date: "2024-01-10",
                purchases: 2,
                comment: "여자친구와 기념일에 갔는데 분위기도 맛도 완벽했습니다",
                empathy: 52
            },
            {
                nickname: "서울탐방러",
                date: "2024-01-08",
                purchases: 1,
                comment: "가격 대비 훌륭한 퀄리티! 재방문 의사 100%",
                empathy: 29
            },
            {
                nickname: "광진맛집지킴이",
                date: "2024-01-05",
                purchases: 3,
                comment: "친구들이랑 갔는데 다들 완전 만족했어요. 서비스도 친절하고요",
                empathy: 31
            }
        ],
        groupBuys: [
            {
                id: 1,
                createdAt: "2024-01-17 14:30",
                discountRate: 20,
                users: [
                    { initial: "트", color: "#4A90E2" }
                ],
                isComplete: false,
                endTime: new Date(Date.now() + 23 * 60 * 60 * 1000 + 19 * 60 * 1000 + 20 * 1000) // 23:19:20 남음
            },
            {
                id: 2,
                createdAt: "2024-01-17 10:15",
                discountRate: 20,
                users: [
                    { initial: "김", color: "#5B7FE8" },
                    { initial: "박", color: "#6C8FD9" }
                ],
                isComplete: true,
                endTime: null
            }
        ],
        togetherPosts: [
            {
                id: 101,
                nickname: "맛집탐험가",
                time: "2시간 전",
                title: "이번주 토요일 저녁 같이 가실 분!",
                content: "흑백요리사 우승자 맛집 꼭 가보고 싶었는데 혼자 가기 아쉬워서 같이 가실 분 찾아요. 편하게 식사하면서 수다 떨어요~",
                date: "2024-01-20",
                time: "19:00",
                people: "2명",
                storeName: "이탈리맛피아",
                storeAddress: "서울시 광진구",
                likes: 8
            }
        ]
    },
    {
        id: 2,
        storeName: "헬싱키스파",
        storeIntro: "스파업계 5년 연속 만족도 1위의 프리미엄 스파",
        productName: "시그니처 스파 코스",
        originalPrice: 180000,
        discountRate: 20,
        discountedPrice: 144000,
        location: "서울시 강남구",
        address: "서울시 강남구 테헤란로 427",
        likes: 512,
        purchases: 287,
        images: [
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
            "https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800"
        ],
        description: `스파업계 가장 많은 고객들의 찬사를 받은 <헬싱키스파>는 헬싱키 특유의 세련되면서도 릴랙싱되는 다양한 마사지와 스파코스들로 고객들의 오감을 만족시킵니다.

북유럽에서 최고급으로 인정받는 스파 브랜드들의 제품만을 사용하며 체험 후 한층 편안해진 몸 상태를 바로 느낄 수 있어요.

지치고 힘든 하루를 마친 나에게 혹은 소중한 지인에게 잊지 못할 깊은 휴식을 선물하세요.`,
        comments: [
            {
                nickname: "힐링러버",
                date: "2024-01-14",
                purchases: 1,
                comment: "스트레스가 싹 풀렸어요. 마사지 기술이 정말 전문적이에요",
                empathy: 67
            },
            {
                nickname: "직장인98",
                date: "2024-01-11",
                purchases: 1,
                comment: "업무 스트레스로 몸이 너무 안좋았는데 여기 다녀온 후 완전 달라졌어요",
                empathy: 54
            },
            {
                nickname: "선물고수",
                date: "2024-01-09",
                purchases: 2,
                comment: "어머니께 선물드렸는데 너무 좋아하셨어요. 강추합니다!",
                empathy: 73
            },
            {
                nickname: "스파마니아",
                date: "2024-01-07",
                purchases: 3,
                comment: "여러 스파 가봤지만 여기가 최고예요. 시설도 깨끗하고 직원분들도 친절해요",
                empathy: 61
            }
        ],
        groupBuys: null,
        togetherPosts: []
    },
    {
        id: 3,
        storeName: "베르사유",
        storeIntro: "성동구 핫플 프랑스 정통 디저트샵",
        productName: "애프터눈티 코스",
        originalPrice: 65000,
        discountRate: 15,
        discountedPrice: 55250,
        location: "서울시 성동구",
        address: "서울시 성동구 왕십리로 125",
        likes: 421,
        purchases: 198,
        images: [
            "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
            "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800"
        ],
        description: `서울 성동구의 핫플로 등극하고 있는 프랑스 정통 디저트샵 <베르사유>에서 시그니처 애프터눈티 코스를 할인 판매합니다.

유럽풍의 고급스러운 외부 및 내부 디자인과 유럽에서 직접 공수해온 소품들로 꾸며진 아름다운 공간에서 프랑스 정통 방식으로 구운 다양한 바이트들과 커피 및 홍차를 즐겨보세요.

같이 갈 사람을 찾거나 지인들과 함께 가기 위해 여러 장을 구매할 수 있습니다.`,
        comments: [
            {
                nickname: "디저트러버",
                date: "2024-01-16",
                purchases: 2,
                comment: "인스타 감성 제대로! 디저트도 맛있고 사진도 예쁘게 나와요",
                empathy: 89
            },
            {
                nickname: "카페투어",
                date: "2024-01-13",
                purchases: 1,
                comment: "친구랑 갔는데 분위기 너무 좋아서 3시간 넘게 있었어요",
                empathy: 72
            },
            {
                nickname: "베이킹마니아",
                date: "2024-01-11",
                purchases: 1,
                comment: "프랑스에서 먹던 그 맛 그대로! 정말 정통 방식으로 만드시는 것 같아요",
                empathy: 81
            },
            {
                nickname: "성동맛집지도",
                date: "2024-01-09",
                purchases: 2,
                comment: "애프터눈티 코스가 정말 알차요. 가격 대비 훌륭합니다",
                empathy: 65
            },
            {
                nickname: "데이트코스추천",
                date: "2024-01-06",
                purchases: 1,
                comment: "데이트하기 완벽한 곳! 낮 시간대가 특히 예뻐요",
                empathy: 78
            }
        ],
        groupBuys: [
            {
                id: 3,
                createdAt: "2024-01-17 16:45",
                discountRate: 20,
                users: [
                    { initial: "이", color: "#8E7FE8" }
                ],
                isComplete: false,
                endTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 32 * 60 * 1000 + 45 * 1000)
            }
        ],
        togetherPosts: [
            {
                id: 102,
                nickname: "디저트탐험대",
                time: "5시간 전",
                title: "주말 오후에 여유롭게 디저트 즐기실 분~",
                content: "베르사유 너무 가고싶은데 혼자 가기엔 양이 많을 것 같아서요. 디저트 좋아하시는 분들과 함께 가고 싶어요!",
                date: "2024-01-21",
                time: "15:00",
                people: "3명",
                storeName: "베르사유",
                storeAddress: "서울시 성동구",
                likes: 12
            },
            {
                id: 103,
                nickname: "카페순례자",
                time: "1일 전",
                title: "평일 저녁 애프터눈티 같이해요",
                content: "회사 퇴근하고 여유있게 디저트 먹으면서 수다 떨고 싶어요. 편하게 이야기 나눌 수 있는 분 환영!",
                date: "2024-01-19",
                time: "18:30",
                people: "2명",
                storeName: "베르사유",
                storeAddress: "서울시 성동구",
                likes: 7
            }
        ]
    }
];

// 현재 사용자 닉네임 (로그인 시 업데이트됨)
let currentUserNickname = "여행좋아";

// 현재 사용자의 신청 내역 (로그인 시 로드됨)
let myApplications = [];

// 같이가요 참여 신청 데이터 (postId를 키로 하는 객체)
let togetherApplications = {
    101: {
        confirmed: [
            {
                id: 1001,
                nickname: "맛집러버",
                answer: "이탈리안 요리를 정말 좋아합니다! 특히 파스타를 좋아해요.",
                applicantInfo: {
                    gender: "여",
                    age: "20대",
                    job: "대학생",
                    intro: "안녕하세요! 맛있는 음식을 찾아다니는 걸 좋아하는 대학생입니다. 새로운 사람들과 만나서 맛있는 음식 먹으면서 이야기하는 것을 좋아해요. 이탈리안 요리를 정말 좋아해서 꼭 함께 가고 싶습니다!"
                }
            }
        ],
        pending: [
            {
                id: 1002,
                nickname: "파스타마니아",
                answer: "파스타와 피자 모두 좋아합니다. 특히 크림 파스타를 정말 좋아해요!",
                applicantInfo: {
                    gender: "남",
                    age: "30대",
                    job: "회사원",
                    intro: "이탈리안 음식을 사랑하는 직장인입니다. 주말에 맛있는 음식 먹으면서 힐링하고 싶어요. 음식과 와인에 대해 이야기 나누는 것을 좋아합니다. 편하게 만나서 즐거운 시간 보내면 좋겠습니다!"
                }
            },
            {
                id: 1003,
                nickname: "미식탐험가",
                answer: "모든 이탈리안 요리를 좋아하지만, 특히 리조또를 좋아합니다!",
                applicantInfo: {
                    gender: "여",
                    age: "30대",
                    job: "프리랜서",
                    intro: "맛집 탐방을 취미로 하는 프리랜서입니다. SNS에 맛집 리뷰도 올리고 있어요. 흑백요리사를 재미있게 봐서 박성재 쉐프님의 요리를 꼭 먹어보고 싶었습니다. 같이 가서 맛있는 음식 즐겨요!"
                }
            }
        ]
    }
};

// 같이가요 전체 목록 (사용자가 작성 시 동적으로 추가됨)
let togetherPosts = [
    {
        id: 101,
        nickname: "맛집탐험가",
        time: "2시간 전",
        title: "이번주 토요일 저녁 같이 가실 분!",
        content: "흑백요리사 우승자 맛집 꼭 가보고 싶었는데 혼자 가기 아쉬워서 같이 가실 분 찾아요. 편하게 식사하면서 수다 떨어요~",
        date: "2024-01-20",
        time: "19:00",
        people: "2명",
        storeName: "이탈리맛피아",
        storeAddress: "서울시 광진구",
        question: "좋아하는 음식 종류가 어떻게 되나요?",
        authorInfo: {
            gender: "남",
            age: "30대",
            job: "마케터",
            intro: "안녕하세요! 맛집 탐방을 좋아하는 30대 마케터입니다. 새로운 사람들과 맛있는 음식 먹으면서 이야기 나누는 걸 정말 좋아해요. 편하게 만나서 즐거운 시간 보내요!"
        },
        likes: 8
    },
    {
        id: 102,
        nickname: "디저트탐험대",
        time: "5시간 전",
        title: "주말 오후에 여유롭게 디저트 즐기실 분~",
        content: "베르사유 너무 가고싶은데 혼자 가기엔 양이 많을 것 같아서요. 디저트 좋아하시는 분들과 함께 가고 싶어요!",
        date: "2024-01-21",
        time: "15:00",
        people: "3명",
        storeName: "베르사유",
        storeAddress: "서울시 성동구",
        question: "디저트 중에서 특히 좋아하는 종류가 있나요?",
        authorInfo: {
            gender: "여",
            age: "20대",
            job: "대학생",
            intro: "디저트를 정말 사랑하는 대학생입니다! 특히 프랑스 디저트를 좋아해서 베르사유를 꼭 가보고 싶었어요. 같이 가셔서 맛있는 디저트 먹으면서 즐거운 시간 보내면 좋겠습니다~"
        },
        likes: 12
    },
    {
        id: 103,
        nickname: "카페순례자",
        time: "1일 전",
        title: "평일 저녁 애프터눈티 같이해요",
        content: "회사 퇴근하고 여유있게 디저트 먹으면서 수다 떨고 싶어요. 편하게 이야기 나눌 수 있는 분 환영!",
        date: "2024-01-19",
        time: "18:30",
        people: "2명",
        storeName: "베르사유",
        storeAddress: "서울시 성동구",
        question: "평일 저녁에 시간 괜찮으신가요?",
        authorInfo: {
            gender: "여",
            age: "30대",
            job: "프리랜서 디자이너",
            intro: "안녕하세요! 커피와 디저트를 좋아하는 프리랜서 디자이너입니다. 퇴근 후 여유롭게 카페에서 수다 떠는 걸 좋아해요. 편하게 만나서 즐거운 시간 보내면 좋겠어요~"
        },
        likes: 7
    },
    {
        id: 104,
        nickname: "힐링필요해",
        time: "1일 전",
        title: "스파 같이 가실 분 계신가요?",
        content: "헬싱키스파 평판이 너무 좋아서 가보려고 하는데, 혼자 가기보다 같이 가면 더 좋을 것 같아서 글 올려요. 편하게 이야기 나눠요!",
        date: "2024-01-20",
        time: "14:00",
        people: "2명",
        storeName: "헬싱키스파",
        storeAddress: "서울시 강남구",
        question: "스파 가보신 적 있으신가요?",
        authorInfo: {
            gender: "여",
            age: "40대",
            job: "회사원",
            intro: "요즘 업무 스트레스가 많아서 힐링이 필요한 직장인입니다. 스파에서 여유롭게 쉬면서 좋은 사람들과 이야기 나누고 싶어요. 편안한 분위기로 만나서 힐링하는 시간 가지면 좋겠습니다!"
        },
        likes: 15
    },
    {
        id: 105,
        nickname: "요리사랑러",
        time: "2일 전",
        title: "다음주 평일 저녁 이탈리안 같이 가요",
        content: "이탈리맛피아 진짜 가보고 싶었는데 마침 할인도 하고 해서 신청했어요. 음식 좋아하시는 분들과 함께 즐기고 싶습니다!",
        date: "2024-01-23",
        time: "19:30",
        people: "3명",
        storeName: "이탈리맛피아",
        storeAddress: "서울시 광진구",
        question: "파스타와 리조또 중 어떤 걸 더 좋아하시나요?",
        authorInfo: {
            gender: "남",
            age: "20대",
            job: "요리학원생",
            intro: "요리를 배우고 있는 학생입니다! 흑백요리사를 보고 박성재 쉐프님의 요리를 꼭 먹어보고 싶었어요. 음식을 사랑하시는 분들과 함께 맛있는 식사하면서 즐거운 시간 보내고 싶습니다!"
        },
        likes: 6
    }
];

// 구매 내역 샘플 (사용자가 구매/공동구매 시 동적으로 추가됨)
// 구매 내역 (로그인 시 로드됨)
let purchaseHistory = [];
