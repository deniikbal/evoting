-- Migration: Add classroom table and update siswa table
-- Date: 2025-11-04
-- Description: Creates classroom table with name and angkatan fields, adds classroom_id to siswa table

-- Create classroom table
CREATE TABLE IF NOT EXISTS classroom (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  angkatan VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add classroom_id column to siswa table
ALTER TABLE siswa 
ADD COLUMN IF NOT EXISTS classroom_id INTEGER;

-- Add foreign key constraint (optional, recommended for data integrity)
ALTER TABLE siswa 
ADD CONSTRAINT fk_siswa_classroom 
FOREIGN KEY (classroom_id) 
REFERENCES classroom(id) 
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_siswa_classroom_id ON siswa(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_angkatan ON classroom(angkatan);

-- Insert some sample data (optional, you can remove this section if not needed)
-- INSERT INTO classroom (name, angkatan) VALUES 
-- ('XII IPA 1', '2024'),
-- ('XII IPA 2', '2024'),
-- ('XII IPS 1', '2024');
