-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gifts (동네선물) table
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT NOT NULL,
  store_intro TEXT NOT NULL,
  product_name TEXT NOT NULL,
  original_price INTEGER NOT NULL,
  discount_rate INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT NOT NULL, -- JSON array stored as text
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
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group buys (공동구매) table
CREATE TABLE IF NOT EXISTS group_buys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  creator_user_id INTEGER NOT NULL,
  discount_rate INTEGER NOT NULL,
  is_complete INTEGER DEFAULT 0, -- 0: incomplete, 1: complete
  partner_user_id INTEGER, -- NULL if not complete
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Together posts (같이가요) table
CREATE TABLE IF NOT EXISTS together_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_id INTEGER NOT NULL,
  author_user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visit_date TEXT NOT NULL, -- YYYY-MM-DD
  visit_time TEXT NOT NULL, -- HH:MM
  people_count TEXT NOT NULL, -- e.g., "2명", "3명"
  question TEXT NOT NULL, -- Question for applicants
  author_info TEXT NOT NULL, -- JSON with gender, age, job, intro
  likes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Together post applications table
CREATE TABLE IF NOT EXISTS together_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  applicant_user_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  applicant_info TEXT NOT NULL, -- JSON with gender, age, job, intro
  status TEXT DEFAULT 'pending', -- pending, confirmed, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES together_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User likes table (for gifts and together posts)
CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- 'gift' or 'together_post'
  item_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, item_type, item_id)
);

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gift_id INTEGER NOT NULL,
  group_buy_id INTEGER, -- NULL for individual purchase
  purchase_type TEXT NOT NULL, -- 'individual' or 'group'
  price_paid INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  FOREIGN KEY (group_buy_id) REFERENCES group_buys(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_comments_gift_id ON gift_comments(gift_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_gift_id ON group_buys(gift_id);
CREATE INDEX IF NOT EXISTS idx_together_posts_gift_id ON together_posts(gift_id);
CREATE INDEX IF NOT EXISTS idx_together_applications_post_id ON together_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
