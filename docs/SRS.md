## **1. INTRODUCTION**

### **1.1. Document Purpose**

This document defines the requirements for **RMap**, a platform that helps information technology learners identify skill gaps and build learning roadmaps aligned with career goals. It describes the problem statement, project scope, shared terminology, and system requirements that guide analysis, design, development, and testing.

This specification is intended to serve as a common reference for all stakeholders throughout the project lifecycle. It helps to:

- clearly define the problem the system must solve and the value it should deliver;
- establish the project scope and reduce ambiguity or scope creep;
- provide a basis for functional requirements, non-functional requirements, data modeling, and architecture decisions;
- align the development team, instructors, reviewers, and testers on the expected outcomes.

The intended audience includes the project team, supervising instructors, reviewers, testers, and anyone who needs to understand the scope and behavior of the RMap system.

### **1.2. Project Scope**

RMap is a learning guidance system for information technology students, programming beginners, career changers, and junior developers who need a clear skill development roadmap. The system addresses the common problems of not knowing what to study next, learning topics in isolation, and lacking reference information aligned with market demand.

Within scope, RMap should support the following capabilities:

- assess the user's current level and career goal through an initial questionnaire or quiz;
- generate a personalized learning roadmap for target roles such as Frontend, Backend, Mobile, DevOps, or Data;
- organize skills as a tree of skill nodes so learners can track progress and understand prerequisites;
- recommend learning resources for each skill node;
- track learning progress, milestones, and skill development status;
- support sharing learning roadmaps within the community;
- surface high-level market insight such as commonly requested skills.

This document focuses on the baseline platform requirements. Out of scope are advanced one-on-one mentoring, broad integration with every learning platform, and commercial features that are not needed in the initial release.

### **1.3. Key Terms**

- **Learning roadmap:** A personalized sequence of skills arranged to help a user move toward a target role.
- **Skill node:** A unit in the roadmap representing one skill or competency.
- **Required skill:** A skill that must be completed to unlock dependent skills.
- **Optional skill:** A skill that is useful but not mandatory for progression.
- **Skill status:** The current state of a skill node, such as Locked, In Progress, or Completed.

## **2. FUNCTIONAL REQUIREMENTS**

### **2.1. Module: User & Onboarding**

| **ID**    | **Function**          | **Detailed Description**                                                                                                                                                                                               |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-01** | User authentication   | The system shall support user registration, login, password recovery, and JWT-based authentication.                                                                                                                    |
| **FR-02** | Goal setup            | The user shall select a target role, daily study time in hours, and a desired time horizon in months. The system shall validate that the goal is realistic.                                                            |
| **FR-03** | Competency assessment | The system shall provide multiple-choice assessments grouped by proficiency level such as Fresher, Junior, and Middle. The assessment shall collect the user's existing skills, available study time, and target role. |
| **FR-04** | Skill profile storage | The system shall store the user's current skill profile in the database using standardized skill levels such as none, basic, and intermediate. This profile shall be used as input for roadmap generation.             |

### **2.2. Module: Roadmap Generation**

| **ID**    | **Function**       | **Detailed Description**                                                                                                                                                        |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-05** | Roadmap generation | The system shall analyze the user's current skill profile and career goal to generate a personalized learning roadmap containing the skill nodes the user should complete next. |
| **FR-06** | Roadmap storage    | The system shall store the generated learning roadmap in the database, including skill nodes, relationships, and prerequisite links.                                            |
| **FR-07** | Prerequisite logic | The system shall enforce prerequisite rules so that dependent skill nodes remain locked until the required preceding skill nodes are completed.                                 |

### **2.3. Module: Roadmap Interaction**

| **ID**    | **Function**         | **Detailed Description**                                                                                                                                  |
| --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-08** | Skill tree display   | The system shall display the learning roadmap as an interactive tree or graph and support zooming, panning, and node selection.                           |
| **FR-09** | Filtering and search | The system shall allow users to filter the roadmap by skill status, skill type, and search skill nodes by name.                                           |
| **FR-10** | Skill details        | When a skill node is selected, the system shall display the skill description, associated learning resources, and required milestones in a details panel. |

### **2.4. Module: Progress Tracking**

| **ID**    | **Function**          | **Detailed Description**                                                                                                                             |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-11** | Status updates        | The system shall allow users to update a skill node's status from Locked to In Progress to Completed and record the completion time when applicable. |
| **FR-12** | Progress storage      | The system shall store learning progress for each user and each skill node.                                                                          |
| **FR-13** | Completion percentage | The system shall calculate overall completion progress based on skill node completion and node importance, and display the result on the dashboard.  |

### **2.5. Module: Learning Resources**

| **ID**    | **Function**         | **Detailed Description**                                                                                                                            |
| --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-14** | Resource suggestions | The system shall provide curated learning resources for each skill node, including online courses, videos, articles, and other reference materials. |

## **3. NON-FUNCTIONAL REQUIREMENTS**

### **3.1. Performance**

- **NFR-01:** Roadmap query APIs shall respond in less than 200 ms under normal operating conditions.
- **NFR-02:** The system shall support at least 500 concurrent active users.
- **NFR-03:** Skill tree visualizations shall be optimized for smooth rendering on desktop and mobile browsers.

### **3.2. Security**

- **NFR-04:** All data transmitted between client and server shall be encrypted using HTTPS.
- **NFR-05:** User passwords shall be hashed before being stored in the database.

### **3.3. Usability**

- **NFR-06:** The interface shall be responsive and usable on both desktop and smartphone devices.
- **NFR-07:** The system shall support Dark Mode.

### **3.4. Reliability and Maintainability**

- **NFR-08:** The system shall provide automatic daily backups to cloud storage.
- **NFR-09:** The system shall record logs to support debugging and operational monitoring.
