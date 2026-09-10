CREATE TABLE `StudioFolder` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    INDEX `StudioFolder_ownerId_idx` (`ownerId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `StudioFolder_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `StudioWorklist` ADD COLUMN `personalFolderId` VARCHAR(191) NULL;
CREATE INDEX `StudioWorklist_personalFolderId_idx` ON `StudioWorklist` (`personalFolderId`);
ALTER TABLE `StudioWorklist` ADD CONSTRAINT `StudioWorklist_personalFolderId_fkey` FOREIGN KEY (`personalFolderId`) REFERENCES `StudioFolder` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
