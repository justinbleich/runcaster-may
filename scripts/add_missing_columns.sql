-- Add missing columns to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS reward_type text;

-- Also check for other columns that might be missing but are required by our function
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS entry_fee float DEFAULT 0; 