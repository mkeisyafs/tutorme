SET @add_quiz_lesson_id = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Quiz'
      AND COLUMN_NAME = 'lessonId'
  ),
  'SELECT 1',
  'ALTER TABLE `Quiz` ADD COLUMN `lessonId` VARCHAR(191) NULL'
);
PREPARE add_quiz_lesson_id FROM @add_quiz_lesson_id;
EXECUTE add_quiz_lesson_id;
DEALLOCATE PREPARE add_quiz_lesson_id;

SET @add_exam_submission_review = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ExamSubmission'
      AND COLUMN_NAME = 'review'
  ),
  'SELECT 1',
  'ALTER TABLE `ExamSubmission` ADD COLUMN `review` JSON NULL'
);
PREPARE add_exam_submission_review FROM @add_exam_submission_review;
EXECUTE add_exam_submission_review;
DEALLOCATE PREPARE add_exam_submission_review;

SET @add_quiz_chapter_quiz_lesson_key = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Quiz'
      AND COLUMN_NAME = 'chapterQuizLessonKey'
  ),
  'SELECT 1',
  'ALTER TABLE `Quiz` ADD COLUMN `chapterQuizLessonKey` VARCHAR(191) NULL'
);
PREPARE add_quiz_chapter_quiz_lesson_key FROM @add_quiz_chapter_quiz_lesson_key;
EXECUTE add_quiz_chapter_quiz_lesson_key;
DEALLOCATE PREPARE add_quiz_chapter_quiz_lesson_key;

SET @add_exam_submission_canonical_attempt_key = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ExamSubmission'
      AND COLUMN_NAME = 'canonicalAttemptKey'
  ),
  'SELECT 1',
  'ALTER TABLE `ExamSubmission` ADD COLUMN `canonicalAttemptKey` VARCHAR(191) NULL'
);
PREPARE add_exam_submission_canonical_attempt_key FROM @add_exam_submission_canonical_attempt_key;
EXECUTE add_exam_submission_canonical_attempt_key;
DEALLOCATE PREPARE add_exam_submission_canonical_attempt_key;

UPDATE `Quiz` q
JOIN (
  SELECT
    MIN(matched.`quizId`) AS `quizId`,
    MIN(matched.`lessonId`) AS `lessonId`
  FROM (
    SELECT
      q_inner.`id` AS `quizId`,
      l.`id` AS `lessonId`,
      q_inner.`courseId` AS `courseId`,
      q_inner.`title` AS `title`
    FROM `Quiz` q_inner
    JOIN `Module` m ON m.`courseId` = q_inner.`courseId`
    JOIN `Lesson` l ON l.`moduleId` = m.`id`
    WHERE q_inner.`type` = 'CHAPTER_QUIZ'
      AND q_inner.`lessonId` IS NULL
      AND q_inner.`title` = CONCAT('Quiz for Lesson: ', l.`title`)
  ) matched
  GROUP BY matched.`courseId`, matched.`title`
  HAVING COUNT(DISTINCT matched.`quizId`) = 1
    AND COUNT(DISTINCT matched.`lessonId`) = 1
) exact_match ON exact_match.`quizId` = q.`id`
SET q.`lessonId` = exact_match.`lessonId`,
    q.`chapterQuizLessonKey` = exact_match.`lessonId`;

UPDATE `Quiz` q
JOIN (
  SELECT `lessonId`
  FROM `Quiz`
  WHERE `type` = 'CHAPTER_QUIZ'
    AND `lessonId` IS NOT NULL
  GROUP BY `lessonId`
  HAVING COUNT(*) = 1
) exact_linked ON exact_linked.`lessonId` = q.`lessonId`
SET q.`chapterQuizLessonKey` = q.`lessonId`
WHERE q.`type` = 'CHAPTER_QUIZ'
  AND q.`chapterQuizLessonKey` IS NULL;

DELETE es FROM `ExamSubmission` es
JOIN `Quiz` q
  ON q.`id` = es.`quizId`
  AND q.`type` = 'CHAPTER_QUIZ'
JOIN `ExamSubmission` newer
  ON newer.`userId` = es.`userId`
  AND newer.`quizId` = es.`quizId`
  AND (
    newer.`submittedAt` > es.`submittedAt`
    OR (newer.`submittedAt` = es.`submittedAt` AND newer.`id` > es.`id`)
  );

UPDATE `ExamSubmission` es
JOIN `Quiz` q
  ON q.`id` = es.`quizId`
  AND q.`type` = 'CHAPTER_QUIZ'
SET es.`canonicalAttemptKey` = CONCAT(es.`userId`, ':', es.`quizId`)
WHERE es.`canonicalAttemptKey` IS NULL;

SET @add_quiz_lesson_id_idx = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Quiz'
      AND INDEX_NAME = 'Quiz_lessonId_idx'
  ),
  'SELECT 1',
  'CREATE INDEX `Quiz_lessonId_idx` ON `Quiz`(`lessonId`)'
);
PREPARE add_quiz_lesson_id_idx FROM @add_quiz_lesson_id_idx;
EXECUTE add_quiz_lesson_id_idx;
DEALLOCATE PREPARE add_quiz_lesson_id_idx;

SET @add_quiz_chapter_quiz_lesson_key_key = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Quiz'
      AND INDEX_NAME = 'Quiz_chapterQuizLessonKey_key'
  ),
  'SELECT 1',
  'CREATE UNIQUE INDEX `Quiz_chapterQuizLessonKey_key` ON `Quiz`(`chapterQuizLessonKey`)'
);
PREPARE add_quiz_chapter_quiz_lesson_key_key FROM @add_quiz_chapter_quiz_lesson_key_key;
EXECUTE add_quiz_chapter_quiz_lesson_key_key;
DEALLOCATE PREPARE add_quiz_chapter_quiz_lesson_key_key;

SET @add_quiz_lesson_id_fkey = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = 'Quiz_lessonId_fkey'
  ),
  'SELECT 1',
  'ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE add_quiz_lesson_id_fkey FROM @add_quiz_lesson_id_fkey;
EXECUTE add_quiz_lesson_id_fkey;
DEALLOCATE PREPARE add_quiz_lesson_id_fkey;

SET @drop_exam_submission_user_id_quiz_id_key = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ExamSubmission'
      AND INDEX_NAME = 'ExamSubmission_userId_quizId_key'
  ),
  'ALTER TABLE `ExamSubmission` DROP INDEX `ExamSubmission_userId_quizId_key`',
  'SELECT 1'
);
PREPARE drop_exam_submission_user_id_quiz_id_key FROM @drop_exam_submission_user_id_quiz_id_key;
EXECUTE drop_exam_submission_user_id_quiz_id_key;
DEALLOCATE PREPARE drop_exam_submission_user_id_quiz_id_key;

SET @add_exam_submission_canonical_attempt_key_key = IF(
  EXISTS(
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ExamSubmission'
      AND INDEX_NAME = 'ExamSubmission_canonicalAttemptKey_key'
  ),
  'SELECT 1',
  'CREATE UNIQUE INDEX `ExamSubmission_canonicalAttemptKey_key` ON `ExamSubmission`(`canonicalAttemptKey`)'
);
PREPARE add_exam_submission_canonical_attempt_key_key FROM @add_exam_submission_canonical_attempt_key_key;
EXECUTE add_exam_submission_canonical_attempt_key_key;
DEALLOCATE PREPARE add_exam_submission_canonical_attempt_key_key;
