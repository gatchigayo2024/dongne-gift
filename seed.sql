-- Insert test users
INSERT OR IGNORE INTO users (phone_number, nickname) VALUES 
  ('01012345678', '여행좋아'),
  ('01098765432', '맛집탐험가'),
  ('01011112222', '디저트탐험대'),
  ('01022223333', '카페순례자'),
  ('01033334444', '힐링필요해'),
  ('01044445555', '요리사랑러');

-- Insert sample gifts
INSERT INTO gifts (id, store_name, store_intro, product_name, original_price, discount_rate, discounted_price, location, address, description, images, likes, purchases) VALUES 
  (1, '이탈리맛피아', '흑백요리사 우승자 박성재 쉐프의 이탈리안 레스토랑', '특별 코스 메뉴', 150000, 10, 135000, '서울시 광진구', '서울시 광진구 능동로 120', 
   '작년 화제속에 방영되었던 흑백요리사 최종 우승자 박성재 쉐프의 <이탈리맛피아> 할인 방문권입니다.\n\n방송에서 선보인 특별한 기법으로 제철 식재료로 만든 다양한 육류, 해산물, 생면파스타 요리들을 코스로 맛볼 수 있어요.\n\n미식을 사랑하는 사람들에게 잊지 못할 특별한 선물이 될 것입니다.', 
   '["https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"]', 
   328, 142),
  (2, '헬싱키스파', '스파업계 5년 연속 만족도 1위의 프리미엄 스파', '시그니처 스파 코스', 180000, 20, 144000, '서울시 강남구', '서울시 강남구 테헤란로 427',
   '스파업계 가장 많은 고객들의 찬사를 받은 <헬싱키스파>는 헬싱키 특유의 세련되면서도 릴랙싱되는 다양한 마사지와 스파코스들로 고객들의 오감을 만족시킵니다.\n\n북유럽에서 최고급으로 인정받는 스파 브랜드들의 제품만을 사용하며 체험 후 한층 편안해진 몸 상태를 바로 느낄 수 있어요.\n\n지치고 힘든 하루를 마친 나에게 혹은 소중한 지인에게 잊지 못할 깊은 휴식을 선물하세요.',
   '["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800","https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800","https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800"]',
   512, 287),
  (3, '베르사유', '성동구 핫플 프랑스 정통 디저트샵', '애프터눈티 코스', 65000, 15, 55250, '서울시 성동구', '서울시 성동구 왕십리로 125',
   '서울 성동구의 핫플로 등극하고 있는 프랑스 정통 디저트샵 <베르사유>에서 시그니처 애프터눈티 코스를 할인 판매합니다.\n\n유럽풍의 고급스러운 외부 및 내부 디자인과 유럽에서 직접 공수해온 소품들로 꾸며진 아름다운 공간에서 프랑스 정통 방식으로 구운 다양한 바이트들과 커피 및 홍차를 즐겨보세요.\n\n같이 갈 사람을 찾거나 지인들과 함께 가기 위해 여러 장을 구매할 수 있습니다.',
   '["https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800","https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800"]',
   421, 198);

-- Insert sample comments for gift 1
INSERT INTO gift_comments (gift_id, user_id, comment, empathy) VALUES 
  (1, 1, '여기 제가 가본 맛집 Top 3인데 여전히 맛있더군요', 45),
  (1, 2, '방송에서 본 그 맛 그대로였어요! 특히 생면 파스타가 예술이에요', 38),
  (1, 3, '여자친구와 기념일에 갔는데 분위기도 맛도 완벽했습니다', 52);

-- Insert sample group buys
INSERT INTO group_buys (id, gift_id, creator_user_id, discount_rate, is_complete, expires_at) VALUES 
  (1, 1, 1, 20, 0, datetime('now', '+1 day')),
  (2, 3, 2, 20, 0, datetime('now', '+18 hours'));

-- Insert sample together posts
INSERT INTO together_posts (id, gift_id, author_user_id, title, content, visit_date, visit_time, people_count, question, author_info, likes) VALUES 
  (101, 1, 2, '이번주 토요일 저녁 같이 가실 분!', '흑백요리사 우승자 맛집 꼭 가보고 싶었는데 혼자 가기 아쉬워서 같이 가실 분 찾아요. 편하게 식사하면서 수다 떨어요~', '2024-01-20', '19:00', '2명', '좋아하는 음식 종류가 어떻게 되나요?', 
   '{"gender":"남","age":"30대","job":"마케터","intro":"안녕하세요! 맛집 탐방을 좋아하는 30대 마케터입니다. 새로운 사람들과 맛있는 음식 먹으면서 이야기 나누는 걸 정말 좋아해요. 편하게 만나서 즐거운 시간 보내요!"}', 8),
  (102, 3, 3, '주말 오후에 여유롭게 디저트 즐기실 분~', '베르사유 너무 가고싶은데 혼자 가기엔 양이 많을 것 같아서요. 디저트 좋아하시는 분들과 함께 가고 싶어요!', '2024-01-21', '15:00', '3명', '디저트 중에서 특히 좋아하는 종류가 있나요?',
   '{"gender":"여","age":"20대","job":"대학생","intro":"디저트를 정말 사랑하는 대학생입니다! 특히 프랑스 디저트를 좋아해서 베르사유를 꼭 가보고 싶었어요. 같이 가셔서 맛있는 디저트 먹으면서 즐거운 시간 보내면 좋겠습니다~"}', 12),
  (103, 3, 4, '평일 저녁 애프터눈티 같이해요', '회사 퇴근하고 여유있게 디저트 먹으면서 수다 떨고 싶어요. 편하게 이야기 나눌 수 있는 분 환영!', '2024-01-19', '18:30', '2명', '평일 저녁에 시간 괜찮으신가요?',
   '{"gender":"여","age":"30대","job":"프리랜서 디자이너","intro":"안녕하세요! 커피와 디저트를 좋아하는 프리랜서 디자이너입니다. 퇴근 후 여유롭게 카페에서 수다 떠는 걸 좋아해요. 편하게 만나서 즐거운 시간 보내면 좋겠어요~"}', 7);
