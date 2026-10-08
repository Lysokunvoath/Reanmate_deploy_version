# ReanMate

Web app for Cambodian grade 10–12 students to study **Mathematics** and
**History** in Khmer — aligned with MoEYS textbook chapters. Per chapter:
watch the official MoEYS video, ask **ReanMate** (មិត្ត AI — a study buddy,
not a teacher), then take an MCQ quiz with explanations.

All data comes from the NestJS + MongoDB backend in `../reanmate-backend`
(endpoints in [docs/API-CONTRACT.md](docs/API-CONTRACT.md)).

## Run

Start the backend first (see `../reanmate-backend/README.md`), then:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in. `API_URL` (default
`http://localhost:4000`) points at the backend. The browser never calls it
directly: requests go to `/api/*` on the frontend, which `next.config.ts`
proxies to the backend, so the session cookie stays on the frontend's domain. Admin accounts are created with
`npm run admin:promote` in the backend; chapters can be seeded with
`npm run chapters:seed` (data in `../reanmate-backend/scripts/data/chapters.json`).

```bash
npm run build
npm start
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Khmer font: Kantumruy Pro
- Data via `lib/api` → backend; only the last-visited chapter is in `localStorage`
- Listen button: Gemini TTS via `POST /tts`

## Project layout

```text
app/                    # routes (landing, login, home, learn, admin)
components/             # UI components (chat, quiz, editor, cards…)
lib/api/                # data access — fetch calls to the backend
lib/types.ts            # shared API types (contract with backend)
lib/progress.ts         # quiz progress (backend) + last-visited chapter (localStorage)
docs/                   # SRS, UI design brief, API contract
```

## Key documents

- [docs/AI-Tutor-SRS.md](docs/AI-Tutor-SRS.md) — requirements
- [docs/AI-Tutor-UI-Design-Brief.md](docs/AI-Tutor-UI-Design-Brief.md) — design decisions
- [docs/API-CONTRACT.md](docs/API-CONTRACT.md) — backend endpoints

## Flows

**Student:** sign in → Home → grade → subject → chapter → **សួរមិត្ត AI**
(Gemini, history saved per user) → **ចាប់ផ្តើមតេស្ត** (pass at ≥ 70%).

**Admin:** sign in with an admin account → `/admin` → **កែសម្រួល** or
**បង្កើតមេរៀនថ្មី** → paste source text → **បង្កើតដោយ AI** (Gemini writes the
summary + MCQs from the stored source text) → review → save draft or approve.

Students only see chapters with `status: "approved"`. Drafts stay on the admin
list until published.
Quiz attempts are scored and stored by the backend; a chapter is marked
completed (per student, across devices) after any attempt scoring ≥ 70%.
