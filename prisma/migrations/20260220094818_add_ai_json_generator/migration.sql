-- CreateTable
CREATE TABLE `AIJSONGenerator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_key` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
