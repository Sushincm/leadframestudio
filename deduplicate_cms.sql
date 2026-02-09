-- CLEANUP SCRIPT: Remove Duplicate CMS Content

-- 1. Create temporary table to identify duplicates in section_items
-- We want to keep the one with the smallest ID (created first) or largest ID (created last).
-- Let's keep the *latest* one (largest ID) assuming it might have the most recent edits, 
-- OR keep the *earliest* one to match the 'seed' state. 
-- In this case, usually keeping the lowest ID is safer if they are identical.

DELETE FROM section_items
WHERE id NOT IN (
    SELECT MIN(id)
    FROM section_items
    GROUP BY section_id, field_key
);

-- 2. Remove duplicate sections
-- Keep the one with the MIN id for each distinct section_name
DELETE FROM sections
WHERE id NOT IN (
    SELECT MIN(id)
    FROM sections
    GROUP BY section_name
);

-- 3. Remove duplicate form submissions (if any, based on exact content match)
-- Optional, but good practice if testing caused double submits
DELETE FROM form_submissions
WHERE id NOT IN (
    SELECT MIN(id)
    FROM form_submissions
    GROUP BY email, message, created_at
);
