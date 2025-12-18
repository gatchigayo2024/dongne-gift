# 동네선물 - 지역 기반 체험 선물 플랫폼

## 프로젝트 개요
- **이름**: 동네선물
- **목표**: 지역 맛집, 스파, 카페 등의 할인 방문권을 판매하고 공동구매 및 함께 방문할 사람을 찾는 플랫폼
- **주요 기능**:
  - 동네선물: 지역 체험 선물 상품 목록 및 상세 정보
  - 공동구매: 2명이 함께 구매하여 추가 할인
  - 같이가요: 같은 시간에 함께 방문할 사람 찾기
  - 좋아요 및 댓글 시스템

## 현재 완료된 기능
- ✅ 선물 목록 조회 및 상세 페이지
- ✅ 공동구매 생성 및 참여 API
- ✅ 같이가요 게시글 작성 및 신청 API
- ✅ 좋아요 토글 기능
- ✅ 댓글 및 후기 표시
- ✅ D1 Database 백엔드 구현
- ✅ 반응형 프론트엔드 UI

## 주요 API 엔드포인트
- `GET /api/gifts` - 모든 선물 목록 조회
- `GET /api/gifts/:id` - 특정 선물 상세 정보 (댓글, 공동구매, 같이가요 포함)
- `POST /api/group-buys` - 공동구매 생성
- `POST /api/group-buys/:id/join` - 공동구매 참여
- `GET /api/together-posts` - 모든 같이가요 게시글 조회
- `GET /api/together-posts/:id` - 특정 같이가요 게시글 상세
- `POST /api/together-posts` - 같이가요 게시글 작성
- `POST /api/together-posts/:id/apply` - 같이가요 신청
- `POST /api/likes` - 좋아요 토글
- `GET /api/users/:userId/likes` - 사용자 좋아요 목록

## 데이터 구조
### 주요 테이블
- **users**: 사용자 정보 (전화번호, 닉네임)
- **gifts**: 선물 상품 (가게정보, 가격, 할인율, 이미지 등)
- **gift_comments**: 선물 상품 댓글/후기
- **group_buys**: 공동구매 (생성자, 파트너, 할인율, 만료시간)
- **together_posts**: 같이가요 게시글 (제목, 내용, 방문일시, 작성자정보)
- **together_applications**: 같이가요 신청 (신청자, 답변, 승인상태)
- **user_likes**: 사용자 좋아요 (선물/게시글)
- **purchases**: 구매 내역

### 스토리지 서비스
- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스

## 사용 가이드
1. **메인 페이지**: 동네선물 목록 확인
2. **선물 상세**: 클릭하여 상세 정보, 댓글, 공동구매, 같이가요 확인
3. **공동구매**: 신청하기 버튼으로 공동구매 생성, 참여하기로 매칭
4. **같이가요**: 함께 방문할 사람 찾기, 신청 및 승인 시스템
5. **네비게이션**: 하단 네비게이션으로 동네선물/같이가요/마이페이지 이동

## 아직 구현되지 않은 기능
- ❌ 사용자 인증/로그인 시스템
- ❌ 실제 결제 기능
- ❌ 마이페이지 구매내역/신청내역
- ❌ 프로필 사진 업로드
- ❌ 실시간 알림
- ❌ 네이버 지도 연동

## 추천 다음 단계
1. 사용자 인증 시스템 구현 (전화번호 인증)
2. 마이페이지 기능 완성 (구매내역, 신청내역, 프로필 편집)
3. 결제 연동 (토스페이먼츠, 카카오페이 등)
4. 네이버 지도 API 연동
5. 실시간 알림 기능 (새 신청, 매칭 완료 등)
6. 관리자 페이지 (상품 등록/수정/삭제)

## 배포
### 로컬 개발
```bash
# 데이터베이스 초기화
npm run db:reset

# 빌드
npm run build

# 개발 서버 시작
pm2 start ecosystem.config.cjs

# 로그 확인
pm2 logs --nostream
```

### 프로덕션 배포
```bash
# D1 데이터베이스 생성
npx wrangler d1 create webapp-production

# wrangler.jsonc에 database_id 업데이트

# 프로덕션 마이그레이션 실행
npm run db:migrate:prod

# Cloudflare Pages 프로젝트 생성
npx wrangler pages project create webapp --production-branch main

# 배포
npm run deploy
```

## URLs
- **로컬 개발**: https://3000-i3bz0om2d3s12ccy7w6q6-02b9cc79.sandbox.novita.ai
- **프로덕션**: (배포 후 업데이트 예정)

## 기술 스택
- **프레임워크**: Hono (Cloudflare Workers)
- **데이터베이스**: Cloudflare D1 (SQLite)
- **프론트엔드**: HTML, Tailwind CSS, Vanilla JavaScript
- **배포**: Cloudflare Pages
- **개발도구**: Vite, Wrangler, PM2

## 마지막 업데이트
2025-12-18
