-- Add custom time window fields for brokers who select "custom" contact hours
ALTER TABLE brokers ADD COLUMN custom_hours_start text;
ALTER TABLE brokers ADD COLUMN custom_hours_end text;
