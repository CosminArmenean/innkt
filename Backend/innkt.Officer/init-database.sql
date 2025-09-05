-- INNKT Database Initialization Script
-- Run this script as a MySQL user with CREATE DATABASE privileges

-- Create the main officer database
CREATE DATABASE IF NOT EXISTS `innkt_officer` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the configuration database
CREATE DATABASE IF NOT EXISTS `innkt_configuration` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the persisted grant database
CREATE DATABASE IF NOT EXISTS `innkt_persisted_grant` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to admin_officer user
GRANT ALL PRIVILEGES ON `innkt_officer`.* TO 'admin_officer'@'localhost';
GRANT ALL PRIVILEGES ON `innkt_configuration`.* TO 'admin_officer'@'localhost';
GRANT ALL PRIVILEGES ON `innkt_persisted_grant`.* TO 'admin_officer'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show created databases
SHOW DATABASES LIKE 'innkt_%';




