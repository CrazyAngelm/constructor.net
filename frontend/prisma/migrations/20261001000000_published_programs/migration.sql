ALTER TABLE `StudioWorklist` ADD COLUMN `published` BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX `StudioWorklist_published_courseId_idx` ON `StudioWorklist` (`published`, `courseId`);

-- Existing desktop and rollback site versions read the course arrays. They do
-- not understand unlimitedCourses; retain equivalent access for those clients.
UPDATE `License`
SET `courses` = (SELECT CONCAT('[', GROUP_CONCAT(`id` ORDER BY `id` SEPARATOR ','), ']') FROM `Course` WHERE `deleted` = false AND `visible` = true)
WHERE `unlimitedCourses` = true;
