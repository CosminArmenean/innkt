-- Add PreferredLanguage column to AspNetUsers table
-- This allows users to store their preferred language preference

-- Add the PreferredLanguage column with default value 'en'
ALTER TABLE AspNetUsers 
ADD PreferredLanguage NVARCHAR(10) NOT NULL DEFAULT 'en';

-- Create an index on PreferredLanguage for better query performance
CREATE INDEX IX_AspNetUsers_PreferredLanguage ON AspNetUsers(PreferredLanguage);

-- Add a check constraint to ensure only valid language codes are stored
ALTER TABLE AspNetUsers 
ADD CONSTRAINT CK_AspNetUsers_PreferredLanguage 
CHECK (PreferredLanguage IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'cs', 'hu', 'ro', 'he', 'ja', 'ko', 'hi'));

-- Update existing users with a default language based on their region (optional)
-- This is just an example - you can customize based on your user base
UPDATE AspNetUsers 
SET PreferredLanguage = 'es' 
WHERE Email LIKE '%@%.es' OR Email LIKE '%@%.mx' OR Email LIKE '%@%.ar';

UPDATE AspNetUsers 
SET PreferredLanguage = 'fr' 
WHERE Email LIKE '%@%.fr' OR Email LIKE '%@%.ca';

UPDATE AspNetUsers 
SET PreferredLanguage = 'de' 
WHERE Email LIKE '%@%.de' OR Email LIKE '%@%.at' OR Email LIKE '%@%.ch';

UPDATE AspNetUsers 
SET PreferredLanguage = 'it' 
WHERE Email LIKE '%@%.it';

UPDATE AspNetUsers 
SET PreferredLanguage = 'pt' 
WHERE Email LIKE '%@%.pt' OR Email LIKE '%@%.br';

UPDATE AspNetUsers 
SET PreferredLanguage = 'nl' 
WHERE Email LIKE '%@%.nl';

UPDATE AspNetUsers 
SET PreferredLanguage = 'pl' 
WHERE Email LIKE '%@%.pl';

UPDATE AspNetUsers 
SET PreferredLanguage = 'cs' 
WHERE Email LIKE '%@%.cz';

UPDATE AspNetUsers 
SET PreferredLanguage = 'hu' 
WHERE Email LIKE '%@%.hu';

UPDATE AspNetUsers 
SET PreferredLanguage = 'ro' 
WHERE Email LIKE '%@%.ro';

UPDATE AspNetUsers 
SET PreferredLanguage = 'he' 
WHERE Email LIKE '%@%.il';

UPDATE AspNetUsers 
SET PreferredLanguage = 'ja' 
WHERE Email LIKE '%@%.jp';

UPDATE AspNetUsers 
SET PreferredLanguage = 'ko' 
WHERE Email LIKE '%@%.kr';

UPDATE AspNetUsers 
SET PreferredLanguage = 'hi' 
WHERE Email LIKE '%@%.in';

-- Verify the changes
SELECT COUNT(*) as TotalUsers, 
       PreferredLanguage, 
       COUNT(*) as UserCount 
FROM AspNetUsers 
GROUP BY PreferredLanguage 
ORDER BY UserCount DESC;

PRINT 'PreferredLanguage column added successfully to AspNetUsers table!';
PRINT 'Supported languages: en, es, fr, de, it, pt, nl, pl, cs, hu, ro, he, ja, ko, hi';
