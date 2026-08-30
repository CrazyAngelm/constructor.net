ALTER TABLE `Course`
    ADD COLUMN `visible` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `Folder`
    ADD COLUMN `visible` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `StudioWorklist` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `courseId` INTEGER NULL,
    `folderId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `teacherSheet` LONGTEXT NOT NULL,
    `studentSheet` LONGTEXT NOT NULL,
    `position` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `StudioWorklist_ownerId_position_idx`(`ownerId`, `position`),
    INDEX `StudioWorklist_courseId_idx`(`courseId`),
    INDEX `StudioWorklist_folderId_idx`(`folderId`),
    CONSTRAINT `StudioWorklist_ownerId_fkey`
        FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `StudioWorklist_courseId_fkey`
        FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `StudioWorklist_folderId_fkey`
        FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
