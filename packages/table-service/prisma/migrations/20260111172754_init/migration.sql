-- CreateTable
CREATE TABLE `restaurants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `zip_code` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    `opening_time` TIME NOT NULL,
    `closing_time` TIME NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `restaurants_city_state_idx`(`city`, `state`),
    INDEX `restaurants_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tables` (
    `id` VARCHAR(191) NOT NULL,
    `restaurant_id` VARCHAR(191) NOT NULL,
    `table_number` VARCHAR(20) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `min_party_size` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `status_updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tables_restaurant_id_idx`(`restaurant_id`),
    INDEX `tables_status_idx`(`status`),
    INDEX `tables_capacity_idx`(`capacity`),
    INDEX `tables_restaurant_id_status_idx`(`restaurant_id`, `status`),
    UNIQUE INDEX `tables_restaurant_id_table_number_key`(`restaurant_id`, `table_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
