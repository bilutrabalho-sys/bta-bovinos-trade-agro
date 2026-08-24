-- ============================================================================
--  009 · Aprendizado / BTA Academy (seção 9): courses, user_course_progress,
--        lessons, lesson_sections, lesson_key_concepts, lesson_quiz_questions,
--        lesson_quiz_options, user_lesson_progress.
--  Depende de: 002 (course_level), 003 (course_category), 004 (users).
-- ============================================================================
begin;

-- courses --------------------------------------------------------------------
create table if not exists courses (
  id          bigint generated always as identity primary key,
  title       text   not null,
  category_id bigint references course_category(id) on update cascade on delete restrict,
  duration    text,                          -- ex.: '8 min' (string livre no mock)
  level       course_level,
  xp          integer not null default 0 check (xp >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table courses is 'Curso da BTA Academy. Course 1:N Lesson. Progresso é por usuário (user_course_progress).';

-- user_course_progress (N:N user<->course) -----------------------------------
create table if not exists user_course_progress (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)   on update cascade on delete cascade,
  course_id    bigint not null references courses(id) on update cascade on delete cascade,
  progress     smallint not null default 0 check (progress between 0 and 100),  -- mock Course.progress
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)
);
comment on table user_course_progress is 'Progresso do usuário em um curso. O Course.progress do mock é o do usuário logado.';

-- lessons --------------------------------------------------------------------
create table if not exists lessons (
  id          bigint generated always as identity primary key,
  course_id   bigint not null references courses(id) on update cascade on delete cascade,
  title       text   not null,
  category_id bigint references course_category(id) on update cascade on delete restrict,
  level       course_level,
  duration    text,
  xp          integer not null default 0 check (xp >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table lessons is 'Aula. Lesson N:1 Course; 1:N sections/key_concepts/quiz_questions.';

create table if not exists lesson_sections (
  id         bigint generated always as identity primary key,
  lesson_id  bigint not null references lessons(id) on update cascade on delete cascade,
  position   integer not null default 0,
  heading    text   not null,
  body       text   not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_sections is 'Seções de conteúdo da aula (sections[{heading, body}]).';

create table if not exists lesson_key_concepts (
  id         bigint generated always as identity primary key,
  lesson_id  bigint not null references lessons(id) on update cascade on delete cascade,
  position   integer not null default 0,
  concept    text   not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_key_concepts is 'Conceitos-chave da aula (keyConcepts[]).';

create table if not exists lesson_quiz_questions (
  id           bigint generated always as identity primary key,
  lesson_id    bigint not null references lessons(id) on update cascade on delete cascade,
  position     integer not null default 0,
  question     text   not null,               -- quiz[].q
  answer_index smallint not null check (answer_index >= 0),  -- quiz[].answer (índice da opção correta)
  created_at   timestamptz not null default now(),
  unique (lesson_id, position)
);
comment on table lesson_quiz_questions is 'Questões do quiz da aula. 1:N lesson_quiz_options. answer_index aponta a opção correta.';

create table if not exists lesson_quiz_options (
  id          bigint generated always as identity primary key,
  question_id bigint not null references lesson_quiz_questions(id) on update cascade on delete cascade,
  position    integer not null default 0,      -- índice referenciado por answer_index
  option_text text   not null,                 -- quiz[].opts[]
  created_at  timestamptz not null default now(),
  unique (question_id, position)
);
comment on table lesson_quiz_options is 'Opções de uma questão de quiz (opts[]). answer_index da questão referencia position.';

-- user_lesson_progress (N:N user<->lesson) -----------------------------------
create table if not exists user_lesson_progress (
  id           bigint generated always as identity primary key,
  user_id      bigint not null references users(id)     on update cascade on delete cascade,
  lesson_id    bigint not null references lessons(id)   on update cascade on delete cascade,
  completed_at timestamptz,
  xp_earned    integer not null default 0 check (xp_earned >= 0),
  created_at   timestamptz not null default now(),
  unique (user_id, lesson_id)
);
comment on table user_lesson_progress is 'Progresso/conclusão do usuário por aula (concede XP).';

commit;
