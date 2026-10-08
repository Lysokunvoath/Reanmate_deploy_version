# Software Requirements Specification (SRS)

## ReanMate

| Field | Value |
|-------|--------|
| Document title | Software Requirements Specification — ReanMate |
| Version | 1.0 |
| Language | English |
| Status | Draft for internship mentor review |
| Intended review | Internal IC internship project |
| Author | *(fill in)* |
| Mentor | *(fill in)* |
| Course / project title | *(fill in)* |
| Date | *(fill in)* |

> Copy this document into Google Docs and complete the header fields above before submission.

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for **ReanMate**, a web application that helps Cambodian upper-secondary students learn **Mathematics** and **History** in Khmer, using Ministry-aligned lesson structure, MoEYS teaching videos, an AI study buddy (មិត្ត AI) with voice playback, and quizzes with explanations.

This document is intended for:

- Internship mentor / IC internal review
- The development team (as the baseline before implementation)

### 1.2 Scope

**In scope (this version):**

- Web application accessible from students’ own devices (phone, tablet, desktop), not limited to school premises
- Grades **10, 11, and 12**
- Subjects: **Mathematics** and **History** (content and AI responses in **Khmer**)
- Content volume target: **3 chapters per subject per grade** → **18 chapters total**
- Per chapter: MoEYS video embed with credit, AI-generated summary (admin-approved), ReanMate (មិត្ត AI) chat, MCQ quiz
- Roles: **Student** and **Admin** only
- Hosting: **Vercel** (application) + **Supabase** (auth and database)
- Deployment purpose: **demo** (not large-scale production)

**Out of scope (this version):**

- Full textbook PDF RAG / automatic PDF ingestion pipeline
- Google (or other social) login
- Hosted/cloud Khmer TTS (browser TTS only)
- Parent, teacher, or school portal roles
- Payments, certificates, LMS integration
- Offline mode
- Formal performance/uptime SLAs
- Multi-admin management UI (single admin account for demo)

### 1.3 Definitions and acronyms

| Term | Meaning |
|------|---------|
| MoEYS | Ministry of Education, Youth and Sport (Cambodia) |
| ReanMate | This product; the in-app conversational study buddy (មិត្ត AI), not a teacher |
| MCQ | Multiple-choice question |
| RLS | Row Level Security (Supabase/Postgres) |
| TTS | Text-to-speech |
| Chapter | One lesson unit under a grade + subject |
| Approved content | Chapter/quiz content visible to students after admin approval |
| SRS | Software Requirements Specification |

### 1.4 References

- Cambodia upper-secondary textbook content (Mathematics, History) — PDF sources held by the project owner
- MoEYS free teaching video platform — embed URLs and credit text *(details TBD; see Assumptions)*
- Planned stack documentation: Next.js, Supabase, Vercel

### 1.5 Overview of this document

Section 2 describes the product and users. Section 3 lists functional requirements. Section 4 lists non-functional requirements. Section 5 covers external interfaces. Section 6 covers data requirements. Section 7 states assumptions, dependencies, and open issues. Section 8 defines acceptance criteria for mentor review/demo.

---

## 2. Overall description

### 2.1 Product perspective

ReanMate is a new standalone web system. It complements (does not replace) MoEYS videos and official textbooks:

1. Student watches the **MoEYS lesson video** (embedded in the app, with credit to the original source).
2. Student asks the **ReanMate** for personal explanation in Khmer (optional **Listen** via browser TTS).
3. Student takes an **MCQ quiz**; the system explains why answers are correct.
4. Progress is saved when the student achieves a passing quiz score.

```text
[Student device] → [ReanMate on Vercel]
                        ├─ Supabase (Auth, DB)
                        ├─ AI provider API (study-buddy chat + content generation)
                        └─ MoEYS video embed (third-party content)
```

### 2.2 Problem statement

After watching MoEYS teaching videos, many students still lack **personal, on-demand explanation** tailored to their questions. ReanMate addresses that gap while keeping learning aligned to textbook chapters and official video lessons.

### 2.3 Product functions (summary)

| Area | Functions |
|------|-----------|
| Account | Self sign-up, sign-in, sign-out; admin password reset (manual) |
| Browse | Select grade (10–12) → subject (Math/History) → chapter list |
| Learn | View MoEYS embed + credit, read chapter summary, chat with ReanMate (មិត្ត AI), Listen |
| Practice | Take MCQ quiz (5–10 questions), immediate feedback + explanation, retry |
| Progress | Mark chapter complete when quiz score ≥ 70% (on a successful attempt) |
| Admin | Create chapters, paste source text, set MoEYS URL/credit, AI-generate summary + MCQs, edit, approve/unapprove |
| Safety | Visible AI accuracy disclaimer; students see only approved content |

### 2.4 User classes

| Role | Description | Count (demo) |
|------|-------------|----------------|
| Student | Learns via video, study buddy chat, quiz; accesses from any personal device | Small demo group |
| Admin | Manages content and approval; single operator for demo | 1 |

No teacher, parent, or school-admin roles in this version.

### 2.5 Operating environment

| Item | Requirement |
|------|-------------|
| Client | Modern browsers; **Chrome** primary; usable on phone, tablet, and desktop |
| Network | **Always online** required |
| UI language | **Khmer only** (student and admin UI) |
| SRS language | English (this document) |
| Server | Vercel-hosted Next.js application |
| Data/Auth | Supabase project |

### 2.6 Design and implementation constraints

- Stack: **Next.js** + **Supabase** + **Vercel**
- AI keys only on the server; provider abstracted so Gemini/OpenAI (or similar) can be swapped
- MoEYS content remains owned by the original source; app must show **credit** and use allowed embed
- Demo scale only; no school privacy policy mandated for this internship demo (still minimize collected data)
- Product name: **ReanMate** (study buddy / មិត្ត AI)

### 2.7 Assumptions and dependencies

See **Section 7**.

---

## 3. Functional requirements

Requirements use IDs for traceability (e.g. FR-AUTH-01).

### 3.1 Authentication and accounts

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall allow students to **self-register** with email and password. |
| FR-AUTH-02 | The system shall allow registered users to sign in and sign out. |
| FR-AUTH-03 | Password recovery for the demo may be performed by **manual admin reset** (no mandatory self-service email reset in this version). |
| FR-AUTH-04 | The system shall support exactly two roles: `student` and `admin`. |
| FR-AUTH-05 | Only one admin account is required for the demo; admin-only routes and actions shall be restricted to that role. |

### 3.2 Navigation and content access

| ID | Requirement |
|----|-------------|
| FR-NAV-01 | After login, a student shall select **grade** (10, 11, or 12). |
| FR-NAV-02 | For a selected grade, a student shall select **subject**: Mathematics or History. |
| FR-NAV-03 | For a selected subject, the system shall list **chapters** available to students. |
| FR-NAV-04 | Students shall see only chapters with status **approved**. |
| FR-NAV-05 | The chapter list shall indicate whether the student has **completed** each chapter. |
| FR-NAV-06 | Content target for this version: **3 chapters × 2 subjects × 3 grades = 18 chapters**. |

### 3.3 Chapter learning page

| ID | Requirement |
|----|-------------|
| FR-CH-01 | A chapter page shall display an **embedded MoEYS teaching video** when a valid embed URL is configured. |
| FR-CH-02 | Adjacent to the video, the system shall display **credit / attribution** to MoEYS (or the official source) and that the content is original to them. |
| FR-CH-03 | A chapter page shall display an admin-approved **summary / key points** in Khmer. |
| FR-CH-04 | A chapter page shall provide access to the **ReanMate chat** for that chapter. |
| FR-CH-05 | A chapter page shall provide a clear action to **start the quiz** for that chapter. |
| FR-CH-06 | A visible **AI disclaimer** shall appear in the learning experience (see FR-SAFE-01). |

### 3.4 ReanMate chat

| ID | Requirement |
|----|-------------|
| FR-TUT-01 | ReanMate shall operate as a **study buddy (មិត្ត AI)**, not a teacher: the student asks questions; the AI answers in Khmer as a peer who helps them understand. |
| FR-TUT-02 | Chat shall be **scoped per chapter** (context = that chapter’s source text and summary). |
| FR-TUT-03 | The system shall **persist chat history** per student per chapter. |
| FR-TUT-04 | The AI shall be instructed to ground answers in the chapter source material; if insufficient, it shall say it does not know rather than invent textbook facts. |
| FR-TUT-05 | There shall be **no message quota** for the MVP/demo (unlimited within normal use). |
| FR-TUT-06 | Each AI reply shall offer a **Listen** control using **browser TTS** with Khmer language tag where available (`km-KH`). |
| FR-TUT-07 | If the browser has no usable Khmer voice, the UI shall fail gracefully (e.g. message that Listen is unavailable). |

### 3.5 Quizzes and progress

| ID | Requirement |
|----|-------------|
| FR-QUIZ-01 | Each approved chapter shall have an MCQ quiz of **5–10 questions** (count may vary by lesson). |
| FR-QUIZ-02 | Each question shall have multiple options and exactly one correct answer. |
| FR-QUIZ-03 | After each answer, the system shall show **immediate** correct/incorrect feedback. |
| FR-QUIZ-04 | After each answer, the system shall show an explanation of **why the correct answer is correct** (stored explanation and/or AI-assisted explanation). |
| FR-QUIZ-05 | After finishing, the system shall show the **score** (correct / total and percentage). |
| FR-QUIZ-06 | The student shall be able to **retry** the quiz. |
| FR-QUIZ-07 | A chapter shall be marked **completed** for a student when an attempt scores **≥ 70%**. |
| FR-QUIZ-08 | If a student scores below 70%, then later retries and scores ≥ 70%, the chapter shall become completed (**yes** — completion based on a successful attempt, not the first attempt only). |
| FR-QUIZ-09 | Quiz attempts (at least score and timestamp) shall be stored for the student. |

### 3.6 Admin content management

| ID | Requirement |
|----|-------------|
| FR-ADM-01 | Admin shall create/edit chapter metadata: grade, subject, title, sort order, MoEYS embed URL, credit text, and pasted **source text** (from textbook PDF). |
| FR-ADM-02 | Admin shall trigger **AI generation** from source text to produce: (a) Khmer summary/key points, (b) 5–10 MCQs with options, correct index, and explanation drafts. |
| FR-ADM-03 | Admin shall edit generated summary and questions before publishing. |
| FR-ADM-04 | Chapters shall support statuses at least: **draft** and **approved**. |
| FR-ADM-05 | Only **approved** chapters (and their questions) are visible to students. |
| FR-ADM-06 | Admin workflow is **generate → review/correct → approve** (admin does not need to author all text manually). |

### 3.7 Safety and trust

| ID | Requirement |
|----|-------------|
| FR-SAFE-01 | The UI shall show a visible notice such as: *“ReanMate can make mistakes. MoEYS videos and the official textbook are the authority. Verify important answers.”* |
| FR-SAFE-02 | The application shall not present itself as an official MoEYS product; MoEYS materials remain credited as third-party/original source content. |

### 3.8 Access model

| ID | Requirement |
|----|-------------|
| FR-ACC-01 | Students shall be able to use the application from **any location** on their own devices, not only on school networks. |
| FR-ACC-02 | The UI shall be **responsive** and usable on phone, tablet, and desktop viewports. |

---

## 4. Non-functional requirements

### 4.1 Usability

| ID | Requirement |
|----|-------------|
| NFR-UI-01 | All student-facing and admin-facing UI copy shall be in **Khmer**. |
| NFR-UI-02 | Layout shall prioritize clarity of the study loop: video → study buddy → quiz. |
| NFR-UI-03 | Responsive design is required (not desktop-only). |

### 4.2 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | No formal numeric SLA for this demo version. |
| NFR-PERF-02 | The system should be **as fast as practical** on typical student internet; AI responses may take several seconds and shall show a loading state. |

### 4.3 Reliability and availability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | No formal uptime target for the internship demo. |
| NFR-REL-02 | If the AI provider is unavailable, the system shall show a clear error; existing static chapter content (summary, video embed, quiz questions) should still be readable where possible. |

### 4.4 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Authentication shall use Supabase Auth (email/password). |
| NFR-SEC-02 | Authorization shall enforce role separation (student vs admin) via server checks and database RLS. |
| NFR-SEC-03 | AI provider API keys shall never be exposed to the browser. |
| NFR-SEC-04 | Students may only read/write their own chat history, quiz attempts, and progress. |

### 4.5 Privacy and data minimization

| ID | Requirement |
|----|-------------|
| NFR-PRIV-01 | No school-imposed privacy policy is mandated for this demo. |
| NFR-PRIV-02 | Collected data should be limited to what the app needs: account email, role, chat messages, quiz attempts, and chapter progress (optional display name). |
| NFR-PRIV-03 | No requirement to store school name, national ID, or parent contacts in this version. |

### 4.6 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | System is sized for **demo-only** usage (small number of concurrent users). |

### 4.7 Localization

| ID | Requirement |
|----|-------------|
| NFR-LOC-01 | Learning content, ReanMate answers, quizzes, and UI: Khmer. |
| NFR-LOC-02 | This SRS document: English only. |

---

## 5. External interface requirements

### 5.1 User interfaces

- Web UI (Next.js): auth screens, grade/subject/chapter navigation, chapter study page, quiz page, admin chapter editor
- Khmer fonts suitable for body and headings
- Listen control on AI messages

### 5.2 Software interfaces

| Interface | Purpose |
|-----------|---------|
| Supabase Auth | Registration and session management |
| Supabase Postgres | Persistent application data + RLS |
| AI provider API | ReanMate chat; admin content generation; optional quiz explanation assist |
| MoEYS video platform | Embedded lesson videos (iframe/embed) |

### 5.3 Communications

- HTTPS for all application traffic
- Online connectivity required end-to-end

---

## 6. Data requirements

### 6.1 Logical data entities

| Entity | Key fields (logical) |
|--------|----------------------|
| Profile | user id, role (student/admin), display name optional |
| Subject | code/name (Math, History), Khmer label |
| Chapter | grade (10–12), subject, title, sort order, source_text, summary, moeys_embed_url, moeys_credit, status (draft/approved) |
| Question | chapter id, prompt, options, correct_index, explanation, sort order |
| ChatMessage | chapter id, user id, role (user/assistant), content, timestamps |
| QuizAttempt | chapter id, user id, score, total, percentage, answers payload, timestamp |
| ChapterProgress | user id, chapter id, completed_at |

### 6.2 Content rules

- Admin pastes textbook-derived **source text** before AI generation (alignment method for this version; full RAG later).
- Students never see `source_text` unless product later decides to show excerpts (not required now); they see **summary**, video, chat, quiz.

---

## 7. Assumptions, dependencies, and open issues

### 7.1 Assumptions

| ID | Assumption |
|----|------------|
| AS-01 | MoEYS (or the official platform) **allows embedding** their teaching videos in a third-party web app when proper **credit** and original-source acknowledgment are shown. Exact embed URL format and required credit wording are **TBD** before implementation. |
| AS-02 | Project owner has Grade 10–12 Mathematics and History textbook PDFs to paste chapter source text. |
| AS-03 | Browser TTS Khmer quality varies by device/OS; Listen is best-effort. |
| AS-04 | Demo users have internet access and a modern browser (Chrome preferred). |
| AS-05 | A single admin will review and approve all generated content before student visibility. |

### 7.2 Dependencies

- Vercel hosting account
- Supabase project
- AI provider API key and quota sufficient for demo
- MoEYS embed URLs for each of the 18 chapters

### 7.3 Open issues

| ID | Issue | Impact |
|----|--------|--------|
| OI-01 | Confirm MoEYS embed policy, URL pattern, and mandatory credit text | Blocks final chapter publishing |
| OI-02 | Product name locked as **ReanMate** (មិត្ត AI / study buddy) | UI and docs aligned |
| OI-03 | Choose initial AI provider (Gemini vs OpenAI) while keeping swappable design | Implementation detail |
| OI-04 | Math formula rendering (plain text vs KaTeX) if Grade 10–12 math needs rich notation | UX for Math chapters |

---

## 8. Acceptance criteria (mentor / demo review)

The version is acceptable for internship demo review when all of the following are true:

1. **Accounts:** Student can self sign-up and sign in; admin can access admin area; student cannot.
2. **Catalog:** Navigation works for grades **10, 11, 12** × Math × History; up to **18** approved chapters can be represented (demo may show a subset if not all content is ready, but the structure must support all 18).
3. **Chapter page:** For at least one approved chapter per subject (minimum demo bar), student sees MoEYS embed + credit, summary, ReanMate chat, and quiz entry.
4. **Study buddy:** Student can ask a question in Khmer, receive an answer, see chat history on return, and use Listen (or a clear unavailable state).
5. **Quiz:** Immediate feedback + explanation; retry works; score ≥ 70% marks chapter complete; below 70% then later ≥ 70% also completes.
6. **Admin:** Admin can paste source text, generate summary + MCQs, edit, leave draft hidden, approve to publish.
7. **Disclaimer:** AI mistake notice is visible in the learning UI.
8. **Access:** Layout works on a phone-width and desktop-width viewport in Chrome.
9. **Hosting:** App deployed on Vercel with Supabase backend for the demo.

**Primary success metric (product goal for this version):** Support **grades 10–12**, **Mathematics and History**, with **3 chapters per subject per grade** (18 chapters), delivering personal AI explanation after MoEYS videos plus quiz practice.

---

## 9. Use cases (brief)

### UC-01 Student studies a chapter

1. Student signs in from their device (any location).
2. Selects grade → subject → chapter.
3. Watches MoEYS video (credited).
4. Reads summary; asks ReanMate questions; optionally uses Listen.
5. Starts quiz; receives immediate feedback and explanations.
6. Retries if needed until score ≥ 70%; chapter shows as completed.

### UC-02 Admin publishes a chapter

1. Admin signs in.
2. Creates chapter (grade, subject, title, MoEYS URL, credit, source text).
3. Runs AI generate → reviews/edits summary and MCQs.
4. Approves chapter.
5. Students can now see and study it.

### UC-03 Admin rejects poor AI output

1. Admin generates content.
2. Finds errors vs textbook.
3. Edits or regenerates; keeps status **draft** until correct.
4. Students never see unapproved content.

---

## 10. Future enhancements (not required for this version)

- Full PDF ingestion and RAG over textbook pages
- Google login
- Higher-quality hosted Khmer TTS
- Teacher/school dashboards and analytics
- More subjects and chapters
- Self-service password reset email
- Rich math rendering (KaTeX) if needed

---

## 11. Document revision history

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | *(fill in)* | *(fill in)* | Initial SRS for internship mentor review |

---

*End of SRS*
