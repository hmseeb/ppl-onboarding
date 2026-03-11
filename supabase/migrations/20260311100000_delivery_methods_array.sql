-- Convert delivery_method (single text) to delivery_methods (text array)
-- Preserves existing data by wrapping the old value in an array

ALTER TABLE brokers ADD COLUMN delivery_methods text[];

-- Migrate existing single values into the array column
UPDATE brokers
SET delivery_methods = ARRAY[delivery_method]
WHERE delivery_method IS NOT NULL;

ALTER TABLE brokers DROP COLUMN delivery_method;
