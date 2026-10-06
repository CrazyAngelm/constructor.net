-- Keep existing licenses and their prices for active recurring subscriptions.
-- Only the five new licenses are offered to new customers.
ALTER TABLE `Course` MODIFY `visible` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `License`
  ADD COLUMN `published` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `unlimitedCourses` BOOLEAN NOT NULL DEFAULT false;

UPDATE `License` SET `published` = false WHERE `id` IN (1, 2, 3, 4);
UPDATE `License` SET `unlimitedCourses` = true WHERE `id` = 4;

-- The copied preview already uses ids 1-5 (the fifth is a synthetic demo).
-- Explicit ids keep a fresh installation from accidentally using id 1, which
-- the existing trial endpoint reserves for the free trial.
INSERT INTO `License` (`id`, `name`, `description`, `price`, `duration`, `freeCourses`, `courses`, `published`, `unlimitedCourses`) VALUES
  (6, '1 курс', 'Доступ к одному выбранному курсу', 299, 30, 1, NULL, true, false),
  (7, '2 курса', 'Доступ к двум выбранным курсам', 399, 30, 2, NULL, true, false),
  (8, '3–4 курса', 'Доступ к четырём выбранным курсам', 499, 30, 4, NULL, true, false),
  (9, '5 курсов', 'Доступ к пяти выбранным курсам', 599, 30, 5, NULL, true, false),
  (10, 'Без ограничений', 'Все опубликованные курсы, включая новые', 999, 30, 0, NULL, true, true);
