-- Migration: Add plain_token column to siswa table
-- Date: 2025-11-04
-- Description: Adds plain_token column to store readable token for distribution to students

-- Add plain_token column
ALTER TABLE siswa 
ADD COLUMN IF NOT EXISTS plain_token VARCHAR(255);

-- For existing data, generate new tokens
-- WARNING: This will regenerate tokens for all existing students!
-- Run this ONCE and immediately export the tokens to distribute to students

UPDATE siswa 
SET plain_token = UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))
WHERE plain_token IS NULL;

-- Make the column required after populating
ALTER TABLE siswa 
ALTER COLUMN plain_token SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_siswa_plain_token ON siswa(plain_token);

-- IMPORTANT NOTE:
-- After running this migration, immediately run:
-- 1. Export tokens via admin panel (button "Export Token")
-- 2. Distribute the Excel file to students
-- 3. Students will use plain_token to login (system will verify against hashed token)
