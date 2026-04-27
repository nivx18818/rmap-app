import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const countResult = await pool.query('SELECT COUNT(*) FROM skills');
  const count = parseInt(countResult.rows[0].count);
  console.log(`Found ${count} existing skills`);

  await pool.query('DELETE FROM quiz_questions');
  await pool.query('DELETE FROM resources');
  await pool.query('DELETE FROM skill_prerequisites');
  await pool.query('DELETE FROM skills');
  console.log('Cleared data');

  const backendSkills = [
    { name: 'HTTP Basics', desc: 'HTTP protocol basics', hrs: 4, role: 'BACKEND' },
    { name: 'Git for Backend', desc: 'Git commands', hrs: 6, role: 'BACKEND' },
    { name: 'JavaScript ES6+ Backend', desc: 'Modern JS', hrs: 20, role: 'BACKEND' },
    { name: 'Node.js Basics', desc: 'Node.js runtime', hrs: 12, role: 'BACKEND' },
    { name: 'Express.js', desc: 'Express framework', hrs: 16, role: 'BACKEND' },
    { name: 'REST API Design', desc: 'RESTful APIs', hrs: 8, role: 'BACKEND' },
    { name: 'PostgreSQL', desc: 'PostgreSQL database', hrs: 16, role: 'BACKEND' },
    { name: 'ORM/Prisma', desc: 'Prisma ORM', hrs: 10, role: 'BACKEND' },
    { name: 'Authentication (JWT)', desc: 'JWT auth', hrs: 8, role: 'BACKEND' },
    { name: 'Password Security', desc: 'bcrypt hashing', hrs: 4, role: 'BACKEND' },
    { name: 'RESTful CRUD', desc: 'CRUD operations', hrs: 8, role: 'BACKEND' },
    { name: 'Input Validation', desc: 'Input validation', hrs: 6, role: 'BACKEND' },
    { name: 'Error Handling', desc: 'Error handling', hrs: 6, role: 'BACKEND' },
  ];

  const frontendSkills = [
    { name: 'HTML & CSS Fundamentals', desc: 'HTML/CSS basics', hrs: 8, role: 'FRONTEND' },
    { name: 'Git for Frontend', desc: 'Git commands', hrs: 6, role: 'FRONTEND' },
    { name: 'JavaScript ES6+ Frontend', desc: 'Modern JS', hrs: 20, role: 'FRONTEND' },
    { name: 'DOM Manipulation', desc: 'DOM programming', hrs: 12, role: 'FRONTEND' },
    { name: 'CSS Flexbox', desc: 'Flexbox layout', hrs: 8, role: 'FRONTEND' },
    { name: 'CSS Grid', desc: 'Grid layout', hrs: 8, role: 'FRONTEND' },
    { name: 'React Fundamentals', desc: 'React basics', hrs: 16, role: 'FRONTEND' },
    { name: 'React Hooks', desc: 'React hooks', hrs: 12, role: 'FRONTEND' },
    { name: 'State Management', desc: 'State in React', hrs: 12, role: 'FRONTEND' },
    { name: 'API Integration', desc: 'API fetching', hrs: 8, role: 'FRONTEND' },
    { name: 'TypeScript', desc: 'TypeScript', hrs: 12, role: 'FRONTEND' },
  ];

  const allSkills = [...backendSkills, ...frontendSkills];
  const createdSkills = [];

  for (const s of allSkills) {
    const r = await pool.query(
      'INSERT INTO skills (id, name, description, default_estimated_hours, role_category, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, name',
      [s.name, s.desc, s.hrs, s.role],
    );
    createdSkills.push({ id: r.rows[0].id, name: r.rows[0].name });
  }
  console.log(`Created ${createdSkills.length} skills`);

  const skillMap = new Map(createdSkills.map((s) => [s.name, s.id]));

  const prereqs: [string, string][] = [
    ['JavaScript ES6+ Backend', 'Git for Backend'],
    ['Node.js Basics', 'JavaScript ES6+ Backend'],
    ['Express.js', 'Node.js Basics'],
    ['REST API Design', 'Express.js'],
    ['PostgreSQL', 'REST API Design'],
    ['ORM/Prisma', 'PostgreSQL'],
    ['ORM/Prisma', 'Node.js Basics'],
    ['Authentication (JWT)', 'REST API Design'],
    ['Password Security', 'REST API Design'],
    ['RESTful CRUD', 'REST API Design'],
    ['RESTful CRUD', 'ORM/Prisma'],
    ['Input Validation', 'REST API Design'],
    ['Error Handling', 'Express.js'],
    ['JavaScript ES6+ Frontend', 'Git for Frontend'],
    ['DOM Manipulation', 'JavaScript ES6+ Frontend'],
    ['CSS Flexbox', 'HTML & CSS Fundamentals'],
    ['CSS Grid', 'CSS Flexbox'],
    ['React Fundamentals', 'JavaScript ES6+ Frontend'],
    ['React Hooks', 'React Fundamentals'],
    ['State Management', 'React Hooks'],
    ['API Integration', 'React Hooks'],
    ['TypeScript', 'JavaScript ES6+ Frontend'],
  ];

  for (const [skill, prereq] of prereqs) {
    if (skillMap.has(skill) && skillMap.has(prereq)) {
      await pool.query(
        'INSERT INTO skill_prerequisites (skill_id, prerequisite_skill_id) VALUES ($1, $2)',
        [skillMap.get(skill), skillMap.get(prereq)],
      );
    }
  }
  console.log('Created prerequisites');

  const resources: [string, string, string][] = [
    ['HTTP Basics', 'HTTP Crash Course', 'https://youtube.com/watch?v=Zs6glu58e8A'],
    ['Git for Backend', 'Git Crash Course', 'https://youtube.com/watch?v=RGOj5yH7evk'],
    ['JavaScript ES6+ Backend', 'JavaScript Tutorial', 'https://youtube.com/watch?v=WZQc7nT3jCryc'],
    ['Node.js Basics', 'Node.js Tutorial', 'https://youtube.com/watch?v=fBNz5xF-KQ4'],
    ['Express.js', 'Express Tutorial', 'https://youtube.com/watch?v=L72fhGm1tfA'],
    ['PostgreSQL', 'PostgreSQL Tutorial', 'https://youtube.com/watch?v=qw--10BdLs_Q'],
    ['ORM/Prisma', 'Prisma Getting Started', 'https://prisma.io/docs/getting-started'],
    ['Authentication (JWT)', 'JWT Tutorial', 'https://youtube.com/watch?v=m8P1wXGeR1k'],
    ['React Fundamentals', 'React Crash Course', 'https://youtube.com/watch?v=w7ejDZ8SWv8'],
    ['React Hooks', 'React Hooks Guide', 'https://react.dev/reference/react'],
    ['TypeScript', 'TypeScript Tutorial', 'https://youtube.com/watch?v=B_uw8q0w6gY'],
  ];

  for (const [skill, title, url] of resources) {
    if (skillMap.has(skill)) {
      await pool.query(
        'INSERT INTO resources (skill_id, title, url, resource_type, is_free, is_primary, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [skillMap.get(skill), title, url, 'YOUTUBE', true, true],
      );
    }
  }
  console.log('Created resources');

  const questions = [
    {
      q: 'What is the main purpose?',
      a: 'To learn basics',
      b: 'To build apps',
      c: 'To pass tests',
      d: 'To get a job',
      correct: 'B',
    },
    {
      q: 'Which tool is commonly used?',
      a: 'Editor',
      b: 'Browser',
      c: 'Version control',
      d: 'All of above',
      correct: 'D',
    },
    {
      q: 'Best way to practice?',
      a: 'Read tutorials',
      b: 'Build projects',
      c: 'Watch videos',
      d: 'Take notes',
      correct: 'B',
    },
    {
      q: 'Common mistake?',
      a: 'Not practicing',
      b: 'Skipping basics',
      c: 'Not asking help',
      d: 'All of above',
      correct: 'D',
    },
    {
      q: 'Next step after learning?',
      a: 'Next topic',
      b: 'Build project',
      c: 'Take break',
      d: 'Review again',
      correct: 'B',
    },
  ];

  for (const skill of createdSkills) {
    for (const q of questions) {
      await pool.query(
        'INSERT INTO quiz_questions (id, skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())',
        [skill.id, q.q, q.a, q.b, q.c, q.d, q.correct],
      );
    }
  }
  console.log('Created quiz questions');

  await prisma.$disconnect();
  await pool.end();
  console.log('Seeding complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
