export const getOnboardingQuizPrompt = (topic: string, roleSlugs: string[]): string =>
  [
    'You are a learning roadmap specialist.',
    `INPUT: Topic: "${topic}"`,
    'TASK:',
    `1) Map the topic into exactly one role category from: [${roleSlugs.join(', ')}].`,
    '2) Generate a profiling quiz with 6-10 questions.',
    'Required question structure:',
    '- Q1: Primary goal (career, project, or career switch).',
    '- Q2: Preferred tech/language (example: Node.js vs Python for Backend).',
    '- Q3-4: Self-assessed skill level (Beginner to Advanced).',
    '- Q5: Biggest fear or focus area (example: security, logic, or UI).',
    '- Q6: Open-ended extra requirements (possibleAnswers must be []).',
    'Flexibility: add 1-2 role-specific questions based on the topic.',
    'Return roleCategory as a lowercase slug using hyphens (example: "full-stack").',
    'Output JSON only, no markdown fences, with this shape:',
    '{ "roleCategory": "...", "questions":',
    '[ { "question": "...", "possibleAnswers": ["A", "B", "C", "D"] } ] }',
  ].join('\n');

export const getNodeQuizGenerationPrompt = (skill: {
  description: null | string;
  name: string;
  roleCategory: null | string;
}): string =>
  [
    'You are a developer learning assessment specialist.',
    `Skill name: "${skill.name}"`,
    `Skill description: "${skill.description ?? 'No description provided'}"`,
    `Role category: "${skill.roleCategory ?? 'GENERAL'}"`,
    '',
    'TASK:',
    'Generate exactly 8 beginner/intermediate multiple-choice questions for this skill.',
    'Each question must check practical understanding, not trivia.',
    '',
    'Output JSON only, no markdown fences, with this exact shape:',
    '{',
    '  "questions": [',
    '    {',
    '      "questionText": "...",',
    '      "optionA": "...",',
    '      "optionB": "...",',
    '      "optionC": "...",',
    '      "optionD": "...",',
    '      "correctOption": "A"',
    '    }',
    '  ]',
    '}',
    '',
    'Strict rules:',
    '- Return exactly 8 questions.',
    '- correctOption MUST be one of "A", "B", "C", or "D".',
    '- Each question must have exactly one correct answer.',
    '- Question text values must be unique.',
    '- Option text values within each question must be distinct.',
    '- All fields must be non-empty strings.',
    '- Do not include explanations, markdown fences, comments, or extra keys.',
  ].join('\n');

export const getMilestoneTestSuiteGenerationPrompt = (milestone: {
  name: string;
  projectBrief: string;
  roleCategory: null | string;
}): string =>
  [
    'You are a senior Node.js project evaluator.',
    `Milestone name: "${milestone.name}"`,
    `Project brief: "${milestone.projectBrief}"`,
    `Role category: "${milestone.roleCategory ?? 'GENERAL'}"`,
    '',
    'TASK:',
    'Generate an AI test suite for a learner-submitted Node.js/TypeScript repository.',
    'The suite must verify practical implementation outcomes from the project brief.',
    '',
    'Output JSON only, no markdown fences, with this exact shape:',
    '{',
    '  "title": "string",',
    '  "summary": "string",',
    '  "testCases": [',
    '    { "name": "string", "description": "string" }',
    '  ],',
    '  "testFileContent": "string"',
    '}',
    '',
    'Strict rules:',
    '- Return exactly 6 testCases.',
    '- Each test case name must be unique and must map to one check in testFileContent.',
    '- All title, summary, name, description, and testFileContent fields must be non-empty strings.',
    '- testFileContent must be complete JavaScript for Node.js 22 using ESM syntax.',
    '- testFileContent must not require external npm packages beyond what the submitted repo installs.',
    '- testFileContent must run from the repository root and may inspect source files, package.json, and local HTTP handlers if they can run without network access.',
    '- testFileContent must not make network calls, contact external services, or require secrets.',
    '- testFileContent must execute all 6 checks even when earlier checks fail.',
    '- testFileContent must print one final line beginning with RMAP_MILESTONE_RESULTS: followed by compact JSON.',
    '- The marker JSON must have this shape: {"totalTests":6,"passedTests":number,"tests":[{"name":"string","passed":boolean,"message":"string"}]}.',
    '- The platform passes the suite only when passedTests / totalTests * 100 is at least 80%; do not encode a required passed-test count in testFileContent.',
    '- Do not include markdown fences, comments outside the JSON string, or extra top-level keys.',
  ].join('\n');

export const getRoadmapGenerationPrompt = (input: {
  goal: string;
  roleCategory: string;
  hoursPerDay: number;
  deadlineDate: string;
  quizAnswers: Array<{ question: string; answer: string }>;
  skillMap: Array<{ id: string; name: string; defaultEstimatedHours: number | null }>;
  prerequisites: Array<{
    skillId: string;
    skillName: string;
    prerequisiteSkillId: string;
    prerequisiteSkillName: string;
  }>;
}): string => {
  const skillCatalog = JSON.stringify(
    input.skillMap.map((s) => ({
      id: s.id,
      name: s.name,
      defaultEstimatedHours: s.defaultEstimatedHours,
    })),
    null,
    2,
  );

  const prerequisiteGraph = JSON.stringify(input.prerequisites, null, 2);

  const quizSummary = input.quizAnswers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

  return [
    'You are a personalized IT learning roadmap planner.',
    'Your job is to build a spine-based learning roadmap from leaf skills and structural nodes.',
    'The skill catalog is a CLOSED SET for leaf nodes only: required/optional nodes must come from it, but group/milestone nodes are structural and generated by you.',
    '',
    `Learner goal: "${input.goal}"`,
    `Role: ${input.roleCategory}`,
    `Available time: ${input.hoursPerDay} hours/day until ${input.deadlineDate}`,
    '',
    'Leaf skill catalog JSON array. ONLY required/optional leaf nodes may use these skills:',
    skillCatalog,
    '',
    'Skill prerequisite graph JSON array. This is advisory input for you when deciding which skills to include and how to sequence group nodes in a roadmap:',
    prerequisiteGraph,
    '',
    'Learner profile. Use this to decide which leaf skills to include, how to group/sequence them, and which skills can be optional:',
    quizSummary,
    '',
    'Return JSON only (no markdown fences):',
    '{',
    '  "title": "string",',
    '  "description": "string",',
    '  "nodes": [',
    '    {',
    '      "name": "string",',
    '      "nodeType": "group|milestone|required|optional",',
    '      "description": "string (milestone only; omit or null for group/leaf nodes)",',
    '      "estimatedHours": number (leaf nodes only; use catalog defaultEstimatedHours when available),',
    '      "skillId": "string (required/optional leaf nodes only; omit or null for group/milestone nodes)",',
    '      "children": [ ...nested required/optional leaf nodes... ]',
    '    }',
    '  ]',
    '}',
    '',
    'Strict rules:',
    '- Top-level nodes are the roadmap spine and MUST be "group" or "milestone" only.',
    '- Group nodes are structural section containers: skillId MUST be omitted or null; estimatedHours MUST be omitted or null; description MUST be omitted or null.',
    '- Milestone nodes are structural project checkpoints: skillId MUST be omitted or null; estimatedHours MUST be omitted or null; children MUST be omitted or empty; description MUST contain a concrete project brief.',
    '- Required/optional nodes are leaf skill nodes: they MUST be children of a "group" node, MUST use skillId from the leaf skill catalog, and name MUST exactly equal the selected catalog skill name.',
    '- Required/optional leaf nodes MUST NOT have children.',
    '- Group nodes MUST NOT contain other group nodes. Nested groups are strictly forbidden. Group nodes can only contain required/optional leaf nodes directly (Group -> Leaf node).',
    '- Do NOT use catalog skills as group or milestone nodes. Catalog skills are only for required/optional leaves.',
    '- Use each selected leaf skill at most once in the whole roadmap.',
    '- Use the prerequisite graph as advisory sequencing context: if skill A depends on prerequisite B and both are selected, place B in an earlier group or earlier within the same group than A.',
    '- The prerequisite graph must not be represented as UI arrows and must not imply runtime unlock logic. Runtime unlock is spine-sequential by group/milestone order.',
    '- Generate group nodes with coherent short names such as "Web Basics", "DB Core", "API Sec", or similar structural section labels. The number and sequencing of groups should be determined by the provided skill set and the learner profile.',
    '- Generate at least 2-3 milestone nodes interspersed among groups, not all at the end.',
    '- Group and milestone node names MUST be at most 3 words long.',
    '- Milestone node names must be the topic only; do NOT prefix with "Milestone:".',
    '- This roadmap MUST be exhaustive and production-grade. You MUST use as many skills from the catalog as possible.',
    '- Each group node MUST contain a limited number of leaf skills to ensure clarity and progressive learning.',
    '- A group node MUST contain between 1 to 6 leaf nodes maximum. NEVER exceed 6 skills in a single group.',
    '- Each domain MUST be split into clear stages: fundamentals → intermediate → advanced. Avoid mixing beginner and advanced topics in the same group.',
    '- If a topic contains too many related skills, you MUST split it into multiple smaller, logically progressive group nodes.',
    '- Prefer more groups with focused scope rather than fewer groups with too many skills.',
    '- Each group should represent a clear, narrow learning theme (e.g., "SQL Basics", "DB Ops", instead of one large "Database Systems" group).',
    '- Groups should be balanced in size. Avoid highly uneven groups (e.g., one group with 20 skills and another with 3).',
    '- The roadmap must feel like step-by-step progression, not a bulk collection of skills.',
    '- When organizing skills, prioritize learning flow over grouping by category alone.',
    '- Break down complex domains (e.g., Databases, Security, Architecture) into multiple stages from basic → advanced.',
    '- Avoid dumping all advanced topics into a single group. Spread them across later groups progressively.',
    "- ONLY omit a skill from the catalog if it is completely irrelevant to the learner's goal, or if the learner explicitly stated they have already mastered it.",
    '- Mark nice-to-have or less critical skills as "optional" rather than omitting them entirely.',
  ].join('\n');
};
