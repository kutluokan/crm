-- Update tickets table to ensure proper UUID handling
ALTER TABLE tickets
ALTER COLUMN customer_id TYPE UUID USING customer_id::UUID,
ALTER COLUMN customer_id SET NOT NULL;

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_customer_id_fkey'
    ) THEN
        ALTER TABLE tickets
        ADD CONSTRAINT tickets_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE;
    END IF;
END $$; 