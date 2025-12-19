# 동네선물 - 지역 기반 체험 선물 플랫폼

## 프로젝트 개요
- **이름**: 동네선물 (경험선물)
- **목표**: 지역 맛집, 스파, 카페 등의 할인 방문권을 판매하고 공동구매 및 함께 방문할 사람을 찾는 플랫폼
- **주요 기능**:
  - 동네선물: 지역 체험 선물 상품 목록 및 상세 정보
  - 공동구매: 3명이 함께 구매하여 추가 할인 (24시간 제한)
  - 같이가요: 같은 시간에 함께 방문할 사람 찾기
  - 좋아요 및 댓글 시스템
  - 구매 내역 및 신청 내역 관리
  - 마이페이지 (내 좋아요, 구매 내역, 같이가요 관리)

## 현재 완료된 기능 ✅

### 백엔드 (Hono + Cloudflare D1)
- ✅ 전화번호 인증 시스템 (NHN Cloud SMS API 연동)
- ✅ 선물 목록 조회 API (`GET /api/gifts`)
- ✅ 선물 상세 정보 API (`GET /api/gifts/:id`)
- ✅ 공동구매 생성 API (`POST /api/group-buys`)
- ✅ 공동구매 참여 API (3명 시스템) (`POST /api/group-buys/:id/join`)
- ✅ 같이가요 목록 조회 API (`GET /api/together-posts`)
- ✅ 같이가요 상세 조회 API (`GET /api/together-posts/:id`)
- ✅ 같이가요 작성 API (`POST /api/together-posts`)
- ✅ 같이가요 신청 API (`POST /api/together-posts/:id/apply`)
- ✅ 좋아요 토글 API (`POST /api/likes`)
- ✅ 사용자 좋아요 목록 API (`GET /api/users/:userId/likes`)
- ✅ 사용자 닉네임 업데이트 API (`PUT /api/users/:id`)

### 프론트엔드 (원본 디자인 완전 복원)
- ✅ 전화번호 인증 UI (SMS 인증번호 입력)
- ✅ 닉네임 설정 및 변경
- ✅ 사용자 세션 관리 (로그인 상태 유지)
- ✅ 반응형 UI (모바일 최적화)
- ✅ 이미지 슬라이더
- ✅ 동네선물 카드 리스트
- ✅ 상세 페이지 (이미지, 가격, 설명, 후기)
- ✅ 공동구매 신청/참여 모달 (3명 아바타 표시)
- ✅ 같이가요 작성/신청 모달
- ✅ 마이페이지 (구매내역, 같이가요 관리, 좋아요)
- ✅ 하단 네비게이션
- ✅ 실시간 카운트다운 (공동구매 남은 시간)
- ✅ LocalStorage 데이터 관리
- ✅ API 연동 (백엔드에서 데이터 로드)

## 주요 API 엔드포인트

### 선물 (Gifts)
```
GET  /api/gifts          # 모든 선물 목록
GET  /api/gifts/:id      # 특정 선물 상세 (댓글, 공동구매, 같이가요 포함)
```

### 공동구매 (Group Buys)
```
POST /api/group-buys            # 공동구매 생성
POST /api/group-buys/:id/join   # 공동구매 참여
```

### 같이가요 (Together Posts)
```
GET  /api/together-posts              # 모든 같이가요 게시글
GET  /api/together-posts/:id          # 특정 같이가요 상세
POST /api/together-posts              # 같이가요 작성
POST /api/together-posts/:id/apply    # 같이가요 신청
```

### 좋아요 (Likes)
```
POST /api/likes                # 좋아요 토글
GET  /api/users/:userId/likes  # 사용자 좋아요 목록
```

## 데이터베이스 구조

### 주요 테이블
- **users**: 사용자 정보 (전화번호, 닉네임)
- **gifts**: 선물 상품 (가게정보, 가격, 할인율, 이미지)
- **gift_comments**: 선물 상품 댓글/후기
- **group_buys**: 공동구매 (생성자, partner, partner2 - 3명 시스템)
- **together_posts**: 같이가요 게시글 (제목, 내용, 방문일시, 작성자정보)
- **together_applications**: 같이가요 신청 (신청자, 답변, 승인상태)
- **user_likes**: 사용자 좋아요 (선물/게시글)
- **purchases**: 구매 내역

### 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스 (로컬 + 프로덕션)

## 사용 가이드

### 사용자 경험
1. **메인 페이지**: 동네선물 카드 목록 확인
2. **선물 상세**: 클릭하여 이미지, 가격, 설명, 후기, 공동구매, 같이가요 확인
3. **구매하기**: 결제 모달에서 수량 선택 및 후기 공감
4. **공동구매**: 
   - 신청하기: 공동구매 생성 (24시간 제한)
   - 참여하기: 다른 사람이 만든 공동구매에 참여
5. **같이가요**: 
   - 작성하기: 같이 방문할 사람 찾는 글 작성
   - 신청하기: 관심있는 게시글에 신청
   - 작성자 확인: 신청자 정보 확인 및 수락/거절
6. **마이페이지**: 
   - 구매 내역: 구매한 상품 및 후기 작성
   - 내가 쓴 같이가요: 작성한 게시글 및 신청자 관리
   - 신청한 같이가요: 신청한 게시글 목록
   - 내 좋아요: 좋아요한 선물 및 게시글

## 아직 구현되지 않은 기능 ❌
- ❌ 실제 결제 기능 (토스페이먼츠, 카카오페이 등)
- ❌ 네이버 지도 연동
- ❌ 영수증 사진 업로드 및 환급 신청
- ❌ 실시간 알림 (새 신청, 매칭 완료 등)
- ❌ 프로필 사진 업로드
- ❌ 관리자 페이지
- ❌ 프로덕션 SMS 발송 (NHN Cloud 환경변수 설정 필요)

## 추천 다음 단계
1. **결제 연동**: 토스페이먼츠 또는 카카오페이 연동
2. **네이버 지도**: 네이버 지도 API 연동 (가게 위치 표시)
3. **파일 업로드**: Cloudflare R2 연동 (영수증, 프로필 사진)
4. **실시간 알림**: WebSocket 또는 Server-Sent Events
5. **관리자 페이지**: 상품 등록/수정/삭제, 환급 승인 등
6. **NHN Cloud SMS 환경변수**: 프로덕션 SMS 발송 활성화

## 로컬 개발

### 데이터베이스 초기화
```bash
# 데이터베이스 리셋 (마이그레이션 + 시드 데이터)
npm run db:reset

# 마이그레이션만 실행
npm run db:migrate:local

# 시드 데이터만 실행
npm run db:seed
```

### 개발 서버 시작
```bash
# 빌드
npm run build

# PM2로 개발 서버 시작
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs webapp --nostream

# 서버 재시작
pm2 restart webapp

# 서버 중지
pm2 delete webapp
```

## 프로덕션 배포

자세한 배포 가이드는 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**를 참고하세요.

### 간단 요약
1. **Cloudflare Dashboard**에서 D1 Database 생성 (`dongne-gift-production`)
2. **Console 탭**에서 마이그레이션 SQL 실행
3. **Workers & Pages**에서 GitHub 연결 (`gatchigayo2024/dongne-gift`)
4. **Build 설정**: `npm run build` / `dist`
5. **D1 Binding**: Variable name `DB` → `dongne-gift-production`
6. **재배포** 후 테스트

## URLs
- **로컬 개발**: https://3000-i3bz0om2d3s12ccy7w6q6-02b9cc79.sandbox.novita.ai
- **프로덕션**: https://dongne-gift.pages.dev (배포 진행 중)
- **GitHub**: https://github.com/gatchigayo2024/dongne-gift
- **배포 가이드**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 기술 스택

### 백엔드
- **프레임워크**: Hono (Cloudflare Workers용 경량 웹 프레임워크)
- **데이터베이스**: Cloudflare D1 (SQLite)
- **배포**: Cloudflare Pages

### 프론트엔드
- **UI**: HTML5, CSS3 (모바일 최적화)
- **JavaScript**: Vanilla JS (ES6+)
- **아이콘**: Font Awesome 6.4.0
- **데이터 관리**: LocalStorage + API

### 개발 도구
- **빌드**: Vite 6.x
- **배포**: Wrangler 3.x
- **프로세스 관리**: PM2
- **버전 관리**: Git

## 프로젝트 구조
```
webapp/
├── src/
│   └── index.tsx              # Hono 백엔드 (API 라우트)
├── public/
│   ├── index.html             # 메인 HTML (원본 프론트엔드)
│   └── static/
│       ├── style.css          # 스타일시트 (원본)
│       ├── data.js            # 데이터 관리 + API 호출
│       └── main.js            # 메인 로직 (원본)
├── migrations/
│   └── 0001_initial_schema.sql # DB 스키마
├── seed.sql                   # 샘플 데이터
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc            # Cloudflare 설정
├── package.json              # 의존성 및 스크립트
└── README.md                 # 프로젝트 문서
```

## 주요 파일 설명

### src/index.tsx
- Hono 백엔드 API 라우트
- D1 데이터베이스 쿼리
- 정적 파일 서빙

### public/static/data.js
- API 호출 함수 (`loadGiftsFromAPI`, `loadTogetherPostsFromAPI`)
- 샘플 데이터 (API 실패 시 백업)
- 사용자 데이터 관리

### public/static/main.js
- UI 렌더링 로직
- 이벤트 핸들러
- 모달 관리
- LocalStorage 관리

## 특징

### ✨ 원본 프론트엔드 완전 복원
- GenSpark로 개발된 원본 UI/UX를 100% 그대로 유지
- 모든 스타일, 레이아웃, 애니메이션 동일
- 기존 JavaScript 로직 최대한 보존

### 🚀 실제 백엔드 연동
- Cloudflare D1 데이터베이스와 연동
- RESTful API를 통한 데이터 관리
- 실시간 데이터 업데이트

### 📱 모바일 최적화
- 반응형 디자인
- 터치 최적화
- 하단 네비게이션

### 💾 데이터 영속성
- D1 데이터베이스에 영구 저장
- LocalStorage와 API의 하이브리드 방식
- 오프라인 캐싱 지원

## 마지막 업데이트
2025-12-19

### 최근 변경사항
- ✅ 전화번호 인증 시스템 구현 (NHN Cloud SMS)
- ✅ 공동구매 시스템을 2명 → 3명으로 변경
- ✅ D1 Database ID: `613c2e9e-c97f-4272-9d72-3a38c145cb61`
- ✅ 프로덕션 배포 가이드 추가

## 라이선스
이 프로젝트는 교육 및 데모 목적으로 제작되었습니다.
