-- Add created_at column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Update existing rows to have a created_at value
UPDATE customers 
SET created_at = TIMEZONE('utc', NOW())
WHERE created_at IS NULL; 