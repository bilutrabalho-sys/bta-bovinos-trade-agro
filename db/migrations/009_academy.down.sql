-- ============================================================================
--  009 · DOWN — dropa Academy (ordem inversa).
-- ============================================================================
begin;

drop table if exists user_lesson_progress  cascade;
drop table if exists lesson_quiz_options    cascade;
drop table if exists lesson_quiz_questions  cascade;
drop table if exists lesson_key_concepts    cascade;
drop table if exists lesson_sections        cascade;
drop table if exists lessons                cascade;
drop table if exists user_course_progress   cascade;
drop table if exists courses                cascade;

commit;
