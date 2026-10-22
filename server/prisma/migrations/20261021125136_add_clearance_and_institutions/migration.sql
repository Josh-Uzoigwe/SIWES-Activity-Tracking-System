-- AlterTable
ALTER TABLE `students` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'pending_clearance';

-- CreateTable
CREATE TABLE `institutions` (
    `institution_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `state` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `institutions_name_key`(`name`),
    UNIQUE INDEX `institutions_code_key`(`code`),
    PRIMARY KEY (`institution_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
