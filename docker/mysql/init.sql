-- Initialize databases for Restaurant Reservation System
-- This script runs automatically when MySQL container starts for the first time

-- Create databases
CREATE DATABASE IF NOT EXISTS restaurant_user_service;
CREATE DATABASE IF NOT EXISTS restaurant_reservation_service;
CREATE DATABASE IF NOT EXISTS restaurant_table_service;

-- Grant privileges (using root user in Docker)
GRANT ALL PRIVILEGES ON restaurant_user_service.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON restaurant_reservation_service.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON restaurant_table_service.* TO 'root'@'%';

FLUSH PRIVILEGES;

-- Log initialization
SELECT 'Databases initialized successfully' AS status;
