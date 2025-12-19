# 🚀 동네선물 - 프로덕션 배포 가이드

## 📊 Database ID
```
613c2e9e-c97f-4272-9d72-3a38c145cb61
```

---

## STEP 1: D1 데이터베이스 마이그레이션 (Console에서 실행)

### 1️⃣ 기본 테이블 생성

Cloudflare Dashboard → D1 → dongne-gift-production → Console 탭에서 실행:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT NOT NULL,
  store_intro TEXT,
  product_name TEXT NOT NULL,
  original_price INTEGER NOT NULL,
  discount_rate INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  description TEXT,
  images TEXT,
  likes INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gift comments table
CREATE TABLE IF NOT EXISTS gift_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  empathy INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES gifts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Group buys table
CREATE TABLE IF NOT EXISTS group_buys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  creator_user_id INTEGER NOT NULL,
  partner_user_id INTEGER,
  discount_rate INTEGER NOT NULL,
  participant_count INTEGER DEFAULT 1,
  is_complete INTEGER DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES gifts(id),
  FOREIGN KEY (creator_user_id) REFERENCES users(id),
  FOREIGN KEY (partner_user_id) REFERENCES users(id)
);

-- Together posts table
CREATE TABLE IF NOT EXISTS together_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  author_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  visit_date TEXT,
  visit_time TEXT,
  people_count TEXT,
  question TEXT,
  author_info TEXT,
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES gifts(id),
  FOREIGN KEY (author_user_id) REFERENCES users(id)
);

-- Together applications table
CREATE TABLE IF NOT EXISTS together_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  together_post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (together_post_id) REFERENCES together_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User likes table
CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gift_id INTEGER,
  together_post_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (gift_id) REFERENCES gifts(id),
  FOREIGN KEY (together_post_id) REFERENCES together_posts(id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gift_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_group_buy INTEGER DEFAULT 0,
  group_buy_discount_rate INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (gift_id) REFERENCES gifts(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_comments_gift_id ON gift_comments(gift_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_gift_id ON group_buys(gift_id);
CREATE INDEX IF NOT EXISTS idx_together_posts_gift_id ON together_posts(gift_id);
```

### 2️⃣ 3명 공동구매 시스템 추가

```sql
-- Add partner2_user_id for 3-person group buys
ALTER TABLE group_buys ADD COLUMN partner2_user_id INTEGER REFERENCES users(id);
```

---

## STEP 2: 샘플 데이터 삽입

### 1️⃣ 사용자 데이터

```sql
INSERT INTO users (phone_number, nickname) VALUES
('01012345001', '여행좋아'),
('01012345002', '맛집탐험가'),
('01012345003', '디저트탐험대'),
('01012345004', '카페순례자'),
('01012345005', '힐링필요해'),
('01012345006', '요리사랑러'),
('01012345007', '건강챙기미'),
('01012345008', '문화생활러버');
```

### 2️⃣ 동네선물 데이터

```sql
INSERT INTO gifts (store_name, store_intro, product_name, original_price, discount_rate, discounted_price, location, address, description, images) VALUES
('이탈리맛피아', '정통 이탈리안', '스페셜코스', 39000, 15, 33150, '광진구', '서울시 광진구 자양로 123', '정통 이탈리안 파스타와 피자를 맛볼 수 있는 특별한 코스', '["https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800"]'),
('헬싱키스파', '북유럽 감성', '시그니처코스', 69000, 20, 55200, '광진구', '서울시 광진구 자양로 456', '북유럽 감성의 프리미엄 스파 체험', '["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"]'),
('베르사유', '프렌치 디저트', '애프터눈티', 45000, 10, 40500, '광진구', '서울시 광진구 자양로 789', '우아한 프렌치 디저트와 티타임', '["https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800"]');
```

### 3️⃣ 구매후기 데이터

```sql
INSERT INTO gift_comments (gift_id, user_id, comment, empathy) VALUES
-- 이탈리맛피아 후기
(1, 1, '파스타 정말 맛있었어요! 분위기도 좋고 데이트하기 딱이에요.', 12),
(1, 2, '정통 이탈리안 맛집 인정! 친구랑 다시 가고 싶어요.', 8),
(1, 3, '가격 대비 훌륭한 코스였습니다. 강력 추천!', 15),

-- 헬싱키스파 후기
(2, 4, '힐링 제대로 했어요. 스트레스가 싹 풀렸습니다.', 20),
(2, 5, '북유럽 감성 물씬! 분위기 최고예요.', 18),
(2, 6, '프리미엄 스파 경험, 완전 만족합니다!', 22),

-- 베르사유 후기
(3, 7, '애프터눈티 너무 우아하고 맛있어요. 사진도 예쁘게 나와요!', 25),
(3, 8, '디저트 퀄리티가 정말 좋아요. 특별한 날 추천!', 19),
(3, 1, '프렌치 디저트 맛집! 친구들과 가기 좋아요.', 16);
```

### 4️⃣ 공동구매 데이터 (3명 시스템)

```sql
INSERT INTO group_buys (gift_id, creator_user_id, discount_rate, participant_count, partner_user_id, partner2_user_id, is_complete, expires_at) VALUES
-- 완료된 공동구매 (3명)
(1, 1, 15, 3, 2, 3, 1, datetime('now', '+1 day')),
(1, 4, 15, 3, 5, 6, 1, datetime('now', '+1 day')),

-- 모집 중 - 2명 (1명 더 필요)
(2, 2, 20, 2, 4, NULL, 0, datetime('now', '+1 day')),

-- 모집 중 - 1명 (2명 더 필요)
(3, 3, 18, 1, NULL, NULL, 0, datetime('now', '+1 day')),
(3, 7, 18, 1, NULL, NULL, 0, datetime('now', '+1 day'));
```

### 5️⃣ 같이가요 포스트 데이터

```sql
INSERT INTO together_posts (gift_id, author_user_id, title, content, visit_date, visit_time, people_count, author_info, likes) VALUES
(1, 2, '이탈리안 코스 함께 하실 분!', '주말에 이탈리맛피아 가려고 하는데 같이 가실 분 계신가요? 맛있는 음식 먹으면서 즐거운 시간 보내요~', '2025-12-28', '19:00', '3명', '{"age":"20대","gender":"여성"}', 5),
(2, 5, '스파 힐링 같이 가요', '평일 오후에 헬싱키스파 예약했어요. 힐링하면서 수다 떨 분 구해요!', '2025-12-25', '14:00', '3명', '{"age":"30대","gender":"여성"}', 8),
(3, 8, '애프터눈티 파티 참여자 모집', '베르사유에서 우아한 티타임 가져요. 사진 찍고 디저트 먹으며 즐거운 시간!', '2025-12-30', '15:00', '3명', '{"age":"20대","gender":"여성"}', 12);
```

---

## STEP 3: Cloudflare Pages 배포 설정

### 1. Project Settings
```
Project name: dongne-gift
Production branch: main
Build command: npm run build
Build output directory: dist
```

### 2. D1 Database Binding
```
Variable name: DB
D1 database: dongne-gift-production
Database ID: 613c2e9e-c97f-4272-9d72-3a38c145cb61
```

### 3. Environment Variables (선택사항)
```
NHN_CLOUD_APP_KEY: [your-app-key]
NHN_CLOUD_SECRET_KEY: [your-secret-key]
NHN_CLOUD_SENDER_NUMBER: [your-sender-number]
SESSION_SECRET: [random-long-string]
```

---

## STEP 4: 배포 URL 확인

배포 완료 후:
- **Production URL**: https://dongne-gift.pages.dev
- **GitHub**: https://github.com/gatchigayo2024/dongne-gift

---

## 테스트 체크리스트

- [ ] 메인 페이지 로딩
- [ ] 동네선물 3개 표시 (이탈리맛피아, 헬싱키스파, 베르사유)
- [ ] 선물 카드 클릭 → 상세페이지 이동
- [ ] 구매후기 9개 표시 (각 선물당 3개씩)
- [ ] 공동구매 카드 표시 (3명 아바타 시스템)
- [ ] 같이가요 포스트 3개 표시
- [ ] 전화번호 인증 (개발모드: 콘솔 확인)
- [ ] API `/api/gifts` 정상 응답 200

---

## 문제 해결

### API 404 에러
→ D1 Database 바인딩 확인 후 재배포

### 빈 화면
→ 개발자 도구 Console 확인

### 데이터 없음
→ D1 Console에서 샘플 데이터 재삽입

---

🎉 배포 완료 후 URL을 공유해주세요!
