-- Insert default settings
INSERT INTO "Settings" ("id", "key", "value", "description", "updatedAt", "updatedBy")
SELECT 
    '1', 
    'school_name', 
    'School POS', 
    'Name of the school or institution',
    CURRENT_TIMESTAMP,
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Settings" WHERE "key" = 'school_name');

INSERT INTO "Settings" ("id", "key", "value", "description", "updatedAt", "updatedBy")
SELECT 
    '2', 
    'currency', 
    'R', 
    'Currency symbol for prices',
    CURRENT_TIMESTAMP,
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Settings" WHERE "key" = 'currency');

INSERT INTO "Settings" ("id", "key", "value", "description", "updatedAt", "updatedBy")
SELECT 
    '3', 
    'receipt_footer', 
    'Thank you for your purchase!', 
    'Text to display at the bottom of receipts',
    CURRENT_TIMESTAMP,
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Settings" WHERE "key" = 'receipt_footer');

INSERT INTO "Settings" ("id", "key", "value", "description", "updatedAt", "updatedBy")
SELECT 
    '4', 
    'low_stock_threshold', 
    '10', 
    'Minimum stock level before warning',
    CURRENT_TIMESTAMP,
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Settings" WHERE "key" = 'low_stock_threshold');

INSERT INTO "Settings" ("id", "key", "value", "description", "updatedAt", "updatedBy")
SELECT 
    '5', 
    'business_hours', 
    '08:00-16:00', 
    'Operating hours of the tuck shop',
    CURRENT_TIMESTAMP,
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Settings" WHERE "key" = 'business_hours'); 