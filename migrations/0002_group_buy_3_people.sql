-- Migration: Change group buys from 2 people to 3 people

-- Add second partner column
ALTER TABLE group_buys ADD COLUMN partner2_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add participant count column
ALTER TABLE group_buys ADD COLUMN participant_count INTEGER DEFAULT 1;

-- Update existing data to set participant count based on partner_user_id
UPDATE group_buys SET participant_count = 2 WHERE partner_user_id IS NOT NULL;
UPDATE group_buys SET participant_count = 1 WHERE partner_user_id IS NULL;

-- Update is_complete logic: complete only when 3 people joined
UPDATE group_buys SET is_complete = 0;
