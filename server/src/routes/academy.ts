import { Router } from 'express';
import { pool, DEFAULT_USER_ID } from '../db';
import type { Row } from '../db';
import { asyncHandler } from '../helpers';
import { mapCourse, mapLesson } from '../mappers';

const router = Router();

// GET /api/courses -> COURSES[]  (progress = progresso do usuário logado)
router.get(
  '/courses',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select c.id, c.title, cat.name as category, c.duration,
              coalesce(ucp.progress, 0) as progress, c.level, c.xp
       from courses c
       left join course_category cat on cat.id = c.category_id
       left join user_course_progress ucp
              on ucp.course_id = c.id and ucp.user_id = $1
       order by c.id`,
      [DEFAULT_USER_ID],
    );
    res.json(rows.map(mapCourse));
  }),
);

// GET /api/lessons -> LESSONS[]
// sections[], keyConcepts[] e quiz[{q,opts[],answer}] montados via json_agg a
// partir de lesson_sections / lesson_key_concepts / lesson_quiz_questions +
// lesson_quiz_options (answer = answer_index da questão).
router.get(
  '/lessons',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query<Row>(
      `select
         le.id,
         le.title,
         cat.name as category,
         le.level,
         le.duration,
         le.xp,
         coalesce((
           select json_agg(json_build_object('heading', s.heading, 'body', s.body)
                           order by s.position)
           from lesson_sections s
           where s.lesson_id = le.id
         ), '[]'::json) as sections,
         coalesce((
           select json_agg(k.concept order by k.position)
           from lesson_key_concepts k
           where k.lesson_id = le.id
         ), '[]'::json) as key_concepts,
         coalesce((
           select json_agg(
             json_build_object(
               'q', q.question,
               'answer', q.answer_index,
               'opts', (
                 select coalesce(json_agg(o.option_text order by o.position), '[]'::json)
                 from lesson_quiz_options o
                 where o.question_id = q.id
               )
             )
             order by q.position
           )
           from lesson_quiz_questions q
           where q.lesson_id = le.id
         ), '[]'::json) as quiz
       from lessons le
       left join course_category cat on cat.id = le.category_id
       order by le.id`,
    );
    res.json(rows.map(mapLesson));
  }),
);

export default router;
