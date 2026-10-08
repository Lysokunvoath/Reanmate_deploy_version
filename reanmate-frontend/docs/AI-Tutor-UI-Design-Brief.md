# ReanMate — UI / UX Design Brief

| Field | Value |
|-------|--------|
| Version | 1.0 |
| Status | Draft (alongside SRS) |
| Product | ReanMate |
| Language (UI) | Khmer only |
| Related doc | [AI-Tutor-SRS.md](./AI-Tutor-SRS.md) |

> Use with the SRS for internship mentor review. Logo asset to be provided by the product owner.

---

## 1. Design goals

1. Feel **familiar to Cambodian school / MoEYS-style learning**, without cloning the MoEYS site.
2. Make the study loop obvious: **Watch video → Ask ReanMate → Take quiz**.
3. Stay **readable in Khmer** (larger type, comfortable line spacing).
4. Work **anywhere** on phone, tablet, and desktop (responsive).
5. Keep trust visible: **MoEYS credit** under video + **AI disclaimer** in the footer of learn pages.

---

## 2. Visual direction

| Aspect | Decision |
|--------|----------|
| Mood | Clean academic + study buddy (peer, not teacher) |
| Inspiration | MoEYS e-learning palette (colors only, not full layout clone) |
| Logo | Provided by owner (text fallback “ReanMate” until then) |
| Density | Comfortable, not cramped |

### 2.1 Color palette (CSS variables)

Derived from the reference MoEYS-style screenshot (approximate; refine when implementing):

| Token | Hex (approx.) | Use |
|-------|----------------|-----|
| `--color-primary` | `#006766` | Header, primary chrome, links hover |
| `--color-primary-dark` | `#004f4e` | Header depth / active states |
| `--color-accent-gold` | `#E6A23C` | Titles, highlights, welcome emphasis |
| `--color-cta` | `#F26B6B` | Primary buttons (Log in, Sign up, Start quiz) |
| `--color-section` | `#FFF0F0` | Soft section bars / block headers |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-bg` | `#F7F8F8` | Page background |
| `--color-text` | `#1F2933` | Body text |
| `--color-text-muted` | `#5C6B73` | Secondary text |
| `--color-success` | `#2F9E44` | Correct answer |
| `--color-error` | `#E03131` | Wrong answer |
| `--color-border` | `#E2E8F0` | Dividers, card borders |

**Rule:** Do not default to generic purple “AI SaaS” gradients. Teal + gold + coral CTA is the brand signal.

### 2.2 Typography

- Khmer UI font: e.g. **Noto Sans Khmer** or **Hanuman** (final pick at implementation).
- Prefer **larger body size** and **more line-height** than typical English SaaS UIs.
- Gold accent may be used for major page titles; body stays dark for readability.

### 2.3 Components (general)

- Section headers can use light peach (`--color-section`) bars for academic familiarity.
- Cards for chapter lists (with subject-colored thumbnail placeholders).
- Coral for primary CTAs; teal for secondary / nav chrome.
- Avoid heavy multi-shadow cards; keep borders light and clear.

---

## 3. Information architecture

```text
Landing (public)
  └─ Sign up / Log in

App (authenticated)
  ├─ Home: Continue learning + grade picker
  ├─ Grade → Subject → Chapter list (cards)
  ├─ Chapter study (video | chat; summary under video)
  │     └─ Quiz (same chapter)
  └─ Admin (same visual language)
        └─ Long-form chapter editor (generate → review → approve)
```

### 3.1 Header (logged in)

- Logo  
- Home  
- Grade context (current grade indicator)  
- Logout  

### 3.2 Footer (learn pages)

- AI disclaimer (persistent on learn-related pages):  
  *“ReanMate can make mistakes. MoEYS videos and the official textbook are the authority. Verify important answers.”*  
  (Khmer translation at implementation.)

---

## 4. Priority screens

### 4.1 Landing (public)

**Goal:** Marketing-style first impression.

- Hero with product name / logo  
- One clear headline + short supporting line (Khmer)  
- Primary CTAs: Sign up / Log in (coral)  
- Visual mock or illustration of the **chapter study page** (video + ReanMate)  
- Keep first viewport focused: brand, headline, support line, CTAs, one dominant visual — avoid cluttered stats rows

### 4.2 Home (after login)

- **Continue learning** card/block (last chapter the student opened or next incomplete)  
- **Grade picker** (10 / 11 / 12) as clear choices  
- Path continues: grade → subject → chapters  

### 4.3 Chapter list

- Card grid/list per subject  
- Each card: **subject-colored thumbnail placeholder** (Math vs History), title, completion state  
- Thumbnails: placeholders until real images exist (no blocked empty UI)

### 4.4 Chapter study (highest UX priority)

**Desktop (two columns):**

| Left | Right |
|------|--------|
| MoEYS video embed | ReanMate chat (always visible column) |
| Credit **directly under video** | Listen control on messages |
| Summary / key points under video | |

- Quiz CTA clearly available (e.g. below summary or sticky in column)  
- AI disclaimer in page footer  

**Mobile:**

1. Video  
2. MoEYS credit under video  
3. Summary  
4. Chat entry → **slide-over drawer** for ReanMate  
5. Quiz button  

Stack order: **Video → Summary → Chat → Quiz**.

### 4.5 Quiz

- **All questions on one scrolling page** (not one-at-a-time)  
- After each answer: **inline feedback under the options**  
- On finish: score; if ≥ 70%: success banner + **suggest next chapter**; allow retry if below  

### 4.6 Admin

- Same teal academic look as student app  
- **Single long form:** metadata → MoEYS URL/credit → source text → Generate → edit summary/MCQs → Approve  
- Draft vs approved clearly labeled  
- Empty/generating: Khmer message + simple illustration placeholder  

---

## 5. Interaction details

| Element | Behavior |
|---------|----------|
| Listen | Icon + label **ស្តាប់** on each AI message; browser TTS (`km-KH`); graceful message if unavailable |
| Chat history | Per chapter, persisted; desktop column / mobile drawer |
| MoEYS credit | Directly under embed; never imply ReanMate owns MoEYS content |
| Chapter complete | ≥ 70% on an attempt; banner + next chapter suggestion |
| Loading | Prefer calm skeleton or labeled loading for AI; empty states use illustration + short Khmer text |

---

## 6. Responsive breakpoints (guidance)

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Two-column chapter study; full header |
| Tablet | Prefer stacked or narrower chat column; test both |
| Phone | Stacked chapter study; chat as drawer; large tap targets |

---

## 7. Screen checklist for demo UI

Must look intentional for mentor demo:

1. Landing (hero + mock)  
2. Login / Sign up  
3. Home (Continue + grades)  
4. Subject → chapter cards  
5. Chapter study (desktop two-column + mobile stack)  
6. Quiz (scroll-all + inline explain)  
7. Admin long-form editor  
8. Empty state example  
9. Footer disclaimer on learn pages  

---

## 8. Open UI items

| Item | Status |
|------|--------|
| Final logo file | Owner will provide |
| Exact hex polish vs screenshot | Refine during implementation |
| Khmer copy for all labels | Write during UI build |
| Real chapter thumbnails | Placeholders first |
| MoEYS embed chrome (iframe sizing) | Confirm with real URLs |

---

## 9. Revision history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-08-12 | Initial UI/UX brief from stakeholder decisions |

---

*End of UI Design Brief*
