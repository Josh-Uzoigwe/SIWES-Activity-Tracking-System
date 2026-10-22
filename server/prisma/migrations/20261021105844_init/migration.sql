-- CreateTable
CREATE TABLE `students` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `matric_no` VARCHAR(20) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `department` VARCHAR(80) NOT NULL,
    `institution` VARCHAR(100) NOT NULL,
    `year_of_study` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `students_matric_no_key`(`matric_no`),
    UNIQUE INDEX `students_email_key`(`email`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supervisors` (
    `supervisor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `department` VARCHAR(80) NULL,
    `company` VARCHAR(100) NULL,
    `institution` VARCHAR(100) NULL,

    UNIQUE INDEX `supervisors_email_key`(`email`),
    PRIMARY KEY (`supervisor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `placements` (
    `placement_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `company_name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `school_supervisor_id` INTEGER NULL,
    `industry_supervisor_id` INTEGER NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`placement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `activity_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `log_date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `skills_acquired` TEXT NULL,
    `evidence_url` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `industry_endorsed` BOOLEAN NOT NULL DEFAULT false,
    `supervisor_id` INTEGER NULL,
    `supervisor_comment` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `original_log_id` INTEGER NULL,

    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipient_type` VARCHAR(20) NOT NULL,
    `recipient_id` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `related_activity_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visits` (
    `visit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `placement_id` INTEGER NOT NULL,
    `scheduled_by` INTEGER NOT NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    `notes` TEXT NULL,

    PRIMARY KEY (`visit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `final_reports` (
    `report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stipend_verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_by` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,

    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_school_supervisor_id_fkey` FOREIGN KEY (`school_supervisor_id`) REFERENCES `supervisors`(`supervisor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `placements` ADD CONSTRAINT `placements_industry_supervisor_id_fkey` FOREIGN KEY (`industry_supervisor_id`) REFERENCES `supervisors`(`supervisor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors`(`supervisor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_original_log_id_fkey` FOREIGN KEY (`original_log_id`) REFERENCES `activity_logs`(`activity_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_related_activity_id_fkey` FOREIGN KEY (`related_activity_id`) REFERENCES `activity_logs`(`activity_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_placement_id_fkey` FOREIGN KEY (`placement_id`) REFERENCES `placements`(`placement_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visits` ADD CONSTRAINT `visits_scheduled_by_fkey` FOREIGN KEY (`scheduled_by`) REFERENCES `supervisors`(`supervisor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `final_reports` ADD CONSTRAINT `final_reports_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `final_reports` ADD CONSTRAINT `final_reports_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `supervisors`(`supervisor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
