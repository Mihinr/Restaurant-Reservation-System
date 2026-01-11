-- CreateTable
CREATE TABLE `reservations` (
    `id` VARCHAR(191) NOT NULL,
    `reservationNumber` VARCHAR(20) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `restaurant_id` VARCHAR(191) NOT NULL,
    `table_id` VARCHAR(191) NULL,
    `party_size` INTEGER NOT NULL,
    `reservation_date` DATE NOT NULL,
    `reservation_time` TIME NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 90,
    `status` ENUM('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
    `status_updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer_name` VARCHAR(255) NULL,
    `customer_phone` VARCHAR(20) NULL,
    `special_requests` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reservations_reservationNumber_key`(`reservationNumber`),
    INDEX `reservations_user_id_idx`(`user_id`),
    INDEX `reservations_restaurant_id_idx`(`restaurant_id`),
    INDEX `reservations_table_id_idx`(`table_id`),
    INDEX `reservations_status_idx`(`status`),
    INDEX `reservations_reservation_date_reservation_time_idx`(`reservation_date`, `reservation_time`),
    INDEX `reservations_restaurant_id_reservation_date_reservation_time_idx`(`restaurant_id`, `reservation_date`, `reservation_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_tables` (
    `id` VARCHAR(191) NOT NULL,
    `reservation_id` VARCHAR(191) NOT NULL,
    `table_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_tables_reservation_id_idx`(`reservation_id`),
    INDEX `reservation_tables_table_id_idx`(`table_id`),
    INDEX `reservation_tables_reservation_id_table_id_idx`(`reservation_id`, `table_id`),
    UNIQUE INDEX `reservation_tables_reservation_id_table_id_key`(`reservation_id`, `table_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `waitlist_entries` (
    `id` VARCHAR(191) NOT NULL,
    `restaurant_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `party_size` INTEGER NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `position` INTEGER NOT NULL,
    `estimated_wait_time` INTEGER NULL,
    `reservation_date` DATE NULL,
    `reservation_time` TIME NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `waitlist_entries_restaurant_id_status_idx`(`restaurant_id`, `status`),
    INDEX `waitlist_entries_restaurant_id_position_idx`(`restaurant_id`, `position`),
    INDEX `waitlist_entries_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservation_tables` ADD CONSTRAINT `reservation_tables_reservation_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
