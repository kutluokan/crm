-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix customers table
ALTER TABLE customers
ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
ALTER COLUMN id TYPE UUID USING COALESCE(id::UUID, uuid_generate_v4());

-- Fix tickets table
ALTER TABLE tickets
ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
ALTER COLUMN id TYPE UUID USING COALESCE(id::UUID, uuid_generate_v4()),
ALTER COLUMN customer_id TYPE UUID USING COALESCE(customer_id::UUID, uuid_generate_v4());

-- Ensure foreign key relationship
ALTER TABLE tickets
DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey,
ADD CONSTRAINT tickets_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE; 