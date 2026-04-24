# SRS - RMap

---

## **1. INTRODUCTION (OVERVIEW)**

### **1.1. Document Purpose**

This document is created to specify the requirements of the **RMap** system - a platform that helps technology learners identify their current skills and build learning roadmaps aligned with career goals. The document focuses on describing the problem, system scope, core concepts, and reference foundations for analysis, design, development, and testing.

This document serves as a shared reference among stakeholders throughout project execution. Specifically, it helps:

- Clearly define the problem the system must solve and the value it delivers to users;
- Clarify business scope to avoid misunderstanding or uncontrolled requirement expansion;
- Provide a foundation for defining functional requirements, non-functional requirements, data models, and system architecture;
- Help the development team, supervisors, and evaluators align on project goals and expected outputs.

**Target readers** include the project development team, supervisors, reviewers, testers, and stakeholders interested in the scope and operation of the RMap system.

---

### **1.2. Project Scope**

RMap is a learning-orientation system for IT students, beginner programmers, career switchers, and junior developers who need a clear skill development path. The system is designed to solve common problems: learners do not know what to learn next, learn fragmented knowledge that is hard to connect into real job capability, and lack practical market-aligned references.

Within the current project scope, RMap focuses on these core capabilities:

- Fast onboarding: users enter a **specific career goal** in free text (with optional suggested goals such as Backend Intern, Frontend Fresher, etc.), set daily study time, and complete a **skill assessment quiz**;
- Generate personalized learning roadmaps by role (Frontend, Backend, Mobile, DevOps, Data);
- Organize skills in a spine-based tree structure with sequential unlocking between groups, while still showing prerequisite context for each skill;
- Recommend learning resources (prioritize free sources: YouTube, official docs), limited to 1-2 main resources per node;
- Track progress across three layers: roadmap %, streak (consistency), and skill readiness;
- Show **timeline pressure** alerts when users are behind their target deadline;
- Integrate **quick quizzes** as a required step before a leaf node can be marked `Completed`;
- Provide structured **milestone projects** so users can build a portfolio.

**Out of scope** (current version): 1-1 mentoring, full LMS integration, advanced monetization/paywall systems, advanced internal analytics, and automated weekly AI feedback.

---

## **2. SYSTEM FUNCTIONAL REQUIREMENTS**

### **2.1. Module: User & Onboarding**

| **ID**    | **Function**            | **Detailed Description**                                                                                                                                                                                                                                                                                     |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR-01** | User authentication     | Register/sign in with email and support password recovery. Authentication is JWT token-based (cookie-based).                                                                                                                                                                                                 |
| **FR-02** | Career goal selection   | Users enter a free-text career goal. The system can show **suggested goals** (Backend Intern, Frontend Fresher, Data Analyst, Fullstack Junior, etc.) as placeholder text or quick-pick chips, but selecting one is optional. The goal text is a primary input for the AI Engine.                            |
| **FR-03** | Personal timeline setup | Users input daily study time (hours) and **desired deadline** (months). The system validates feasibility (for example, a very difficult goal with too little time) and warns when needed.                                                                                                                    |
| **FR-04** | Skill assessment (Quiz) | A multiple-choice quiz set by selected role to determine user level.                                                                                                                                                                                                                                         |
| **FR-05** | Send quiz result to AI  | After the user completes the quiz, responses are sent directly to the AI Engine in the same request to generate the roadmap. Quiz data **is not persisted** - the generated roadmap represents the user level. If users want to regenerate the roadmap, they can retake the quiz and send new results to AI. |

> **Optimal onboarding flow:** Enter goal (or pick a suggestion) -> Choose daily study time + deadline -> Skill quiz -> Generate roadmap immediately. Total flow should stay within 3 steps to reduce drop-off.

---

### **2.2. Module: Roadmap Generation**

| **ID**    | **Function**                | **Detailed Description**                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-06** | AI Roadmap Engine           | Integrate Gemini API. Input: free-text goal, role category, quiz result, daily study time, and target deadline. Output: required skill nodes, priority order, and estimated time per node. AI **must not return a generic roadmap** - it must skip skills the user already has according to the quiz.                                                                                                                                               |
| **FR-07** | Roadmap storage             | Store roadmap structure in the database. Each node represents one skill with metadata: name, description, estimated time (hours), resource list, prerequisite list, and display coordinates **position_x / position_y**. Coordinates are calculated once during roadmap generation (with a layout algorithm such as Dagre) and saved to DB to keep Skill Tree rendering consistent across sessions, without recalculating layout on the client.     |
| **FR-08** | Prerequisite & unlock logic | Skills maintain a simple prerequisite list (for example, JWT Auth requires HTTP basics and Express routing) for learning guidance and sequencing context. Runtime unlocking follows **spine-sequential rules**: leaves in the first group are unlocked by default; leaves in group N unlock when all required leaves in group N-1 are completed; milestone nodes unlock after the required leaves of the immediately preceding group are completed. |
| **FR-09** | Milestone project           | Each roadmap includes 2-3 predefined **major milestone projects** (for example for Backend: CRUD API -> Auth System -> Deploy Project). Milestones are highlighted in the roadmap and linked to related skill nodes.                                                                                                                                                                                                                                |

---

### **2.3. Module: Roadmap Interaction**

| **ID**    | **Function**             | **Detailed Description**                                                                                                                                                              |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-10** | Skill Tree visualization | Use React Flow to display a tree/graph view. Support zoom and pan. Nodes are color-coded by status (Locked / In Progress / Completed). Milestone projects are shown as special nodes. |
| **FR-11** | Filter & search          | Filter by status (Completed / In Progress / Locked) and by type (Required / Optional). Search by skill name in the roadmap.                                                           |
| **FR-12** | Skill detail (Sidebar)   | Clicking a node opens a sidebar with skill description, resource list (1-2 primary links, prioritize free resources), prerequisites, and related milestone.                           |

---

### **2.4. Module: Progress Tracking**

| **ID**    | **Function**            | **Detailed Description**                                                                                                                                                                                                                               |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR-13** | Update node status      | Users move node state: `Locked -> In Progress -> Completed`. For leaf nodes, transitioning to `Completed` requires `quiz_passed = true` (score >= 60%). The system records completion timestamp.                                                       |
| **FR-14** | Three-layer progress    | Dashboard displays 3 metrics at once: **(1)** Roadmap completion %, **(2)** Streak - consecutive learning days, **(3)** Skill Readiness for selected goal (calculated from completed important nodes / total important nodes). Example: `Roadmap: 40%` |
| **FR-15** | Timeline warning        | The system automatically computes actual learning speed and compares it with the selected deadline. Show alert: "You are 20% behind - projected delay is about 5 days" when real speed is >= 15% below plan.                                           |
| **FR-16** | Streak & daily activity | The system records learning days (at least one node/task completed). Show streak on dashboard and send reminders when the streak is at risk.                                                                                                           |

---

### **2.5. Module: Learning Quality (Feedback Loop)**

| **ID**    | **Function**    | **Detailed Description**                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FR-17** | Post-node quiz  | When a user attempts to mark a leaf node (`required` / `optional`) as `Completed`, the system shows exactly 5 multiple-choice questions for that skill. If score < 60%: keep the node in progress and show suggestion "You should review this part before continuing." If score >= 60%: set `quiz_passed = true`, confirm completion, and unlock subsequent nodes according to spine-sequential rules. |
| **FR-18** | Skill Quiz Bank | Quiz questions are pre-populated for every skill in the database. Each skill has exactly 5 multiple-choice questions (4 options, 1 correct answer). Roadmap generation does not create quizzes; post-node quiz retrieval only reads existing questions from DB by skill_id.                                                                                                                            |

> `[FUTURE]` **FR-19 - Weekly AI Feedback:** At the end of each week, AI analyzes learning patterns and sends reports such as "You are weak in X" and "You should review Y." This requires enough historical quiz data and notification integration, so it is planned for a future version.

---

### **2.6. Module: Learning Resources**

| **ID**    | **Function**                    | **Detailed Description**                                                                                                                                                                              |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-20** | Node-based resource suggestions | Each node shows up to **2 primary resources** (avoid link dumps). Priority order: YouTube > official docs > free Udemy/Coursera content. Each node also includes one mini-task or practical exercise. |
| **FR-21** | Resource management (Admin)     | Admin can add/edit/delete resources attached to each node. The admin interface can remain simple.                                                                                                     |

---

### **2.7. Future-Oriented Features `[FUTURE]`**

The following features are **not in the current version scope** but are intentionally designed as extensions to avoid major future refactoring. This section answers questions about product direction.

| **ID**    | **Feature**                                | **Reason for later phase**                                                                         |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **FT-01** | Automated Weekly AI Feedback               | Requires enough historical quiz data and a notification system                                     |
| **FT-02** | Monetization / Paywall (Free vs Paid plan) | Free: basic roadmap, limited AI. Paid: unlimited AI, personalized adjustment, advanced feedback    |
| **FT-03** | Internal Analytics Dashboard               | Track node completion rate, drop-off points, and roadmap completion rate to improve AI and content |
| **FT-04** | Community roadmap sharing                  | Users can publish their roadmap for others to fork/reference                                       |
| **FT-05** | AI chat by node                            | Replace/extend quizzes with node-focused AI Q&A chat                                               |
| **FT-06** | Job market insights                        | Show in-demand skills in the Vietnam hiring market                                                 |

---

## **3. NON-FUNCTIONAL REQUIREMENTS**

### **3.1 Performance**

- **NFR-01:** API response time for roadmap query is < 200ms (excluding AI generation).
- **NFR-02:** The system supports at least 500 concurrent users.
- **NFR-03:** Skill Tree (React Flow) must render smoothly on mobile, optimized for graphs with <= 50 nodes.

### **3.2 Security**

- **NFR-04:** All client-server data must be encrypted through HTTPS (SSL/TLS).
- **NFR-05:** Passwords and refresh tokens must be hashed with bcrypt before being stored in the database.
- **NFR-06:** Gemini API key must never be exposed to the client - all AI calls must go through the backend.

### **3.3 Usability**

- **NFR-07:** The interface must be responsive on desktop and mobile.
- **NFR-08:** Support Dark Mode.
- **NFR-09:** Onboarding and dashboard pages should load in < 3 seconds on an average 4G connection.

### **3.4 Reliability & Maintainability**

- **NFR-10:** Data is backed up automatically every day to cloud storage (S3 or equivalent).
- **NFR-11:** System logs are comprehensive enough for debugging (Winston or Morgan in NestJS).
- **NFR-12:** If AI roadmap generation fails due to server-side errors (for example Gemini timeout/error), the system must clearly notify users that a server error occurred, ask them to try again later, and suggest checking available default roadmaps while waiting.

---

## **4. MODULE ARCHITECTURE OVERVIEW**

```
+-------------------------------------------------+
|                    CORE (MVP)                   |
|  Onboarding -> AI Roadmap -> Skill Tree ->     |
|  Progress Tracking -> Quiz Feedback             |
+-------------------------------------------------+
|                   RETENTION                     |
|  Streak - Timeline Warning - Milestone Project  |
+-------------------------------------------------+
|               FUTURE EXTENSIONS                 |
|  Weekly AI Feedback - Monetization -            |
|  Community - Analytics - Job Market             |
+-------------------------------------------------+
```

---

## **5. GLOSSARY**

| Term                  | Definition                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Node**              | A single skill unit in the roadmap (for example, "REST API Design"), stored with coordinates `position_x/y` to keep layout consistent |
| **Milestone Project** | A capstone-style project marking an important roadmap milestone                                                                       |
| **Streak**            | Number of consecutive learning days without interruption                                                                              |
| **Skill Readiness**   | % of important skills completed out of total required for a role                                                                      |
| **Prerequisite**      | A skill dependency used for guidance/context in learning order; runtime unlocking still follows spine-sequential progression          |
| **Timeline Warning**  | Automatic alert when actual learning speed is slower than planned                                                                     |
| **Goal Suggestion**   | A predefined example career target shown as suggestion text or quick-pick chip; users can also provide free-text goals                |
