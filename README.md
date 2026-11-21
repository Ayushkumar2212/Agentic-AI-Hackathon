# ✈️ PrepPilots

**Adaptive Exam Prep Tutor with a Live Learner Model**
CBSE / NCERT **Class 10 Physics** — *Electricity* + *Light: Reflection & Refraction*

PrepPilots is not a quiz app. It is a **flight-simulator for your preparation**: it builds a live model of what a student actually understands, in real time, and constantly re-routes them toward the concepts that will move their board score the most.

Two portals. One learner model. Zero backend.

> **Student Portal → "Prep Cockpit"** &nbsp;·&nbsp; **Admin Portal → "Air Traffic Control"**

---

## 📑 Table of Contents

- [Why PrepPilots](#-why-preppilots)
- [Core Ideas](#-core-ideas)
- [Feature Tour](#-feature-tour)
- [System Architecture](#-system-architecture)
- [Application Flow](#-application-flow)
- [The Learner Model Pipeline](#-the-learner-model-pipeline)
- [Curriculum Coverage](#-curriculum-coverage)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [Design System](#-design-system)

---

## 🎯 Why PrepPilots

Most ed-tech tools measure **answers**. PrepPilots measures **understanding**.

A student can get a numerical right by luck and still hold a broken mental model — PrepPilots catches that. It then diagnoses *why* they got it wrong, re-teaches the exact flaw, and re-schedules the concept using spaced repetition. Progress is persisted locally, so the whole product runs with **no server and no internet**.

---

## 🧠 Core Ideas

| Idea | What it means |
| --- | --- |
| **Live Learner Model** | Every concept node carries a mastery value that is updated after *every* answer — not at the end of a test. |
| **Reasoning, not just answers** | A written explanation is scanned to detect the *flawed mental model* even when the answer is correct. |
| **Concept Dependency Graph (DAG)** | Concepts are linked by prerequisites; mastery propagates through the graph. |
| **Prerequisite Reroute** | Fail an advanced node twice while its prerequisite is weak → the system flies the student back to the root. |
| **Spaced Repetition** | SM-2 scheduler decides *when* each concept must be revised. |
| **Reasoning X-Ray** | Maps a student's words to one of 20 catalogued Class-10 Physics misconceptions. |

---

## ✨ Feature Tour

### 👨‍✈️ Student Portal — *Prep Cockpit*

- **🎬 Splash Intro** — a cinematic 5-second name-only launch sequence.
- **🩺 Pre-Flight Calibration** — a 6-question diagnostic that seeds the entire graph with a BKT prior.
- **🗺️ Syllabus Map** — the interactive Concept Dependency Graph. Nodes glow by mastery band (Weak / Developing / Mastered). Click a node for its formula, key ideas and prerequisite readiness.
- **✍️ Practice & X-Ray** — targeted questions that auto-calibrate difficulty (Easy < 45%, Medium 45–75%, Hard > 75%) with a live reasoning scan of the student's written explanation.
- **📡 Revision Radar** — the spaced-repetition due list; concepts decay over time and surface when they need review.
- **📈 What-If Exam Score Simulator** — drag neon sliders to simulate mastery gains and see the projected board score, marks gained and **ROI per study hour**.
- **📷 Snap Your Rough Work** — a handwriting-OCR auditor with a 1.5-second laser scan, inline bounding boxes (green = valid, crimson = flawed) and one-click remediation that writes straight back to the learner model.
- **🚨 Prerequisite Reroute Alerts** — a prominent, actionable banner when a student is pushing too far ahead of their foundations.

### 🛰️ Admin Portal — *Air Traffic Control*

- **🌡️ Class Mastery Heatmap** — 35-student cohort × 9 concepts.
- **📊 Bottleneck Detection** — concepts where >40% of the class sits below 50%.
- **🔍 Misconception Feed** — the most common reasoning flaws across the class, with a live flag for the active learner.
- **👥 Student Roster** — per-student mastery band, attendance and flagged misconceptions.
- **📝 Remedial Plan Export** — auto-generates a structured, board-style remedial sheet for the weakest concepts + reasoning errors.

---

## 🏗 System Architecture

PrepPilots is a **100% client-side** React application. All state lives in `localStorage` and is namespaced per account.

```mermaid
graph TD
    subgraph UI["Presentation Layer (React + Tailwind)"]
        SPLASH["SplashIntro<br/>5s intro"]
        PORTAL["PortalSelect<br/>Cockpit vs ATC"]
        AUTH["AuthPanel<br/>login / sign-up"]
        COCKPIT["StudentCockpit<br/>(Prep Cockpit)"]
        ATC["TeacherATC<br/>(Air Traffic Control)"]
    end

    subgraph STATE["State Layer"]
        HOOK["usePrepPilots<br/>the brain of the app"]
    end

    subgraph ENGINE["Learning Engine (pure TS)"]
        BKT["mastery.ts<br/>BKT / weighted-Elo"]
        SM2["sm2.ts<br/>spaced repetition"]
        XRAY["xray.ts<br/>reasoning diagnosis"]
        QSVC["questionService.ts<br/>online + offline fallback"]
        CLASS["classModel.ts<br/>cohort simulation"]
    end

    subgraph DATA["Domain Data"]
        CONCEPTS["concepts.ts<br/>9-node DAG"]
        MISC["misconceptions.ts<br/>20 reasoning flaws"]
        QGEN["questions.ts<br/>procedural bank"]
        BLUE["blueprint.ts<br/>CBSE marks map"]
    end

    subgraph STORE["Persistence (localStorage)"]
        LSU["auth.ts<br/>users + session"]
        LST["storage.ts<br/>learner progress"]
    end

    SPLASH --> PORTAL --> AUTH --> HOOK
    HOOK --> COCKPIT
    HOOK --> ATC
    HOOK --> BKT
    HOOK --> SM2
    HOOK --> XRAY
    HOOK --> QSVC
    ATC --> CLASS
    BKT --> CONCEPTS
    XRAY --> MISC
    QSVC --> QGEN
    COCKPIT --> BLUE
    HOOK <--> LST
    AUTH <--> LSU

    classDef ui fill:#0E1626,stroke:#00F0FF,color:#E2E8F0;
    classDef eng fill:#0E1626,stroke:#10B981,color:#E2E8F0;
    classDef dat fill:#0E1626,stroke:#F59E0B,color:#E2E8F0;
    classDef st fill:#0E1626,stroke:#8B5CF6,color:#E2E8F0;
    class SPLASH,PORTAL,AUTH,COCKPIT,ATC ui;
    class BKT,SM2,XRAY,QSVC,CLASS,HOOK eng;
    class CONCEPTS,MISC,QGEN,BLUE dat;
    class LSU,LST st;
```

---

## 🧭 Application Flow

From launch to learning — this is exactly what the user experiences.

```mermaid
flowchart TD
    A([Launch PrepPilots]) --> B["Splash Intro · 5s<br/>platform name only"]
    B --> C["Portal Selection<br/>Student or Admin"]
    C --> D{"Existing account?"}
    D -- "No" --> E["Sign-Up<br/>name, email, password +<br/>role-specific profile fields"]
    D -- "Yes" --> F["Log-In"]
    E --> G["Authenticated"]
    F --> G
    G --> H{"Role?"}
    H -- "student" --> I["Prep Cockpit"]
    H -- "admin" --> J["Air Traffic Control"]

    I --> K{"First flight?<br/>(no diagnostic, 0 answers)"}
    K -- "Yes" --> L["Pre-Flight Calibration<br/>6-question diagnostic"]
    K -- "No" --> M["Resume saved progress"]
    L --> M
    M --> N["Syllabus Map<br/>Concept DAG"]

    J --> O["Class Heatmap +<br/>Misconception Feed"]

    classDef start fill:#10B981,stroke:#10B981,color:#04140D;
    classDef term fill:#0E1626,stroke:#00F0FF,color:#E2E8F0;
    classDef dec fill:#0E1626,stroke:#F59E0B,color:#E2E8F0;
    class A start;
    class B,C,E,F,G,I,J,L,M,N,O term;
    class D,H,K dec;
```

### Student Cockpit — inner loop

```mermaid
flowchart LR
    MAP["🗺️ Syllabus Map"] --> DRAWER["Node Drawer<br/>formula · key ideas · prereqs"]
    DRAWER --> PRACTICE["✍️ Practice & X-Ray"]
    PRACTICE --> XR["Reasoning Scan<br/>(sound / lucky / flawed / thin)"]
    XR --> MODEL["Live Learner Model<br/>mastery updated + propagated"]
    MODEL --> RADAR["📡 Revision Radar<br/>SM-2 due list"]
    RADAR --> PRACTICE
    MODEL --> WHATIF["📈 What-If Simulator<br/>score + ROI"]
    MODEL --> OCR["📷 Rough Work Auditor<br/>1.5s laser scan"]
    OCR --> MODEL
    MODEL --> REROUTE{"2 misses on an advanced<br/>node with weak prereq?"}
    REROUTE -- "Yes" --> ALERT["🚨 Reroute Alert"]
    REROUTE -- "No" --> MAP
    ALERT --> DRAWER

    classDef map fill:#0E1626,stroke:#00F0FF,color:#E2E8F0;
    classDef eng fill:#0E1626,stroke:#10B981,color:#E2E8F0;
    classDef warn fill:#0E1626,stroke:#EF4444,color:#FCA5A5;
    class MAP,DRAWER,PRACTICE,XR,RADAR,WHATIF,OCR map;
    class MODEL eng;
    class ALERT,REROUTE warn;
```

---

## ⚙️ The Learner Model Pipeline

The heart of PrepPilots is a hybrid **Bayesian Knowledge Tracing + weighted-Elo** engine, coupled to an **SM-2** scheduler.

```mermaid
sequenceDiagram
    autonumber
    participant S as Student
    participant UI as Practice Studio
    participant X as Reasoning X-Ray
    participant M as Mastery Engine
    participant G as Concept Graph
    participant R as SM-2 Scheduler

    S->>UI: Selects an option + writes reasoning
    UI->>X: analyzeReasoning(question, choice, text)
    X-->>UI: verdict (sound / lucky / flawed / thin) + misconception
    UI->>M: applyAttempt(node, correct, difficulty, verdict)
    M->>M: delta = K_difficulty × (outcome − expected_mastery)
    Note over M: "lucky" penalties · "thin" weak-evidence damping
    M->>G: propagate(delta) → nudges prerequisites & dependents
    G-->>M: updated mastery map
    M->>R: updateSm2(quality 0–5)
    R-->>M: new interval + due day
    M-->>UI: before → after mastery, decay, flash
    UI->>S: X-Ray card, mastery delta, re-route alert (if any)
```

### Mastery update — the equation

```
delta  =  K(difficulty) × ( outcome − expected_mastery )

where
  K(Easy)=0.22   K(Medium)=0.30   K(Hard)=0.38
  outcome = 1.0  (correct · sound)
          = 0.8  (correct · thin reasoning,  K × 0.7)
          = 0.5  (correct · lucky,          K × 0.85)
          = 0.0  (incorrect)
```

### Retention decay (Revision Radar)

```
decayRate(node)   = 0.09 / (1 + 0.3 × reps)
decayFactor(node) = e^(−decayRate × daysSinceReview)
effectiveMastery  = mastery × decayFactor
```

The more times a node has been successfully revised, the slower it decays — exactly like a real memory.

### Difficulty auto-calibration

| Mastery | Difficulty |
| --- | --- |
| < 45% | Easy |
| 45% – 75% | Medium |
| > 75% | Hard |

### Prerequisite Reroute rule

> If a student **fails an advanced node twice** while a prerequisite sits **below 60%**, PrepPilots raises a *Prerequisite Reroute Alert* and flies them back to the root concept.

---

## 📚 Curriculum Coverage

Nine concept nodes across two authentic CBSE Class 10 Physics lanes, each carrying its **board-exam weightage**.

```mermaid
graph LR
    subgraph ELECTRICITY["⚡ Electricity (NCERT Ch. 12)"]
        CC["Charge & Current<br/>I = Q/t · 4 marks"] --> OL["Ohm's Law<br/>V = IR · 4 marks"]
        OL --> RF["Factors of Resistance<br/>R = ρl/A · 5 marks"]
        RF --> SP["Series & Parallel<br/>Rs=ΣR · 1/Rp=Σ1/R · 6 marks"]
        SP --> EP["Electric Power<br/>P = VI = I²R · 4 marks"]
    end

    subgraph OPTICS["🔦 Optics (NCERT Ch. 10)"]
        RL["Laws of Reflection<br/>∠i = ∠r · 4 marks"] --> SM["Spherical Mirrors<br/>f = R/2 · 5 marks"]
        SM --> MF["Mirror Formula<br/>1/v+1/u=1/f · 5 marks"]
        MF --> RS["Refraction & Snell<br/>n = sin i / sin r · 5 marks"]
    end

    classDef elec fill:#0E1626,stroke:#F59E0B,color:#FCD34D;
    classDef opt fill:#0E1626,stroke:#00F0FF,color:#A5F3FC;
    class CC,OL,RF,SP,EP elec;
    class RL,SM,MF,RS opt;
```

The **20-entry misconception catalog** encodes real Class-10 reasoning flaws, e.g.:
- *Additive Resistance Fallacy in Parallel Circuits*
- *Current is "used up" as it passes through resistors*
- *Resistance depends on voltage*
- *Concave mirror always forms a real image*
- *Frequency of light changes during refraction*

Each misconception ships with its exact flaw, the correct frame, a formula anchor, a 30-second micro-lesson, and text **triggers** used by the X-Ray.

---

## 🧰 Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | **React 18** + **TypeScript 5** |
| Build tool | **Vite 5** |
| Styling | **Tailwind CSS 3** (custom design tokens, glassmorphism) |
| Icons | **lucide-react** |
| State | React hooks + `localStorage` (per-account namespacing) |
| Algorithms | BKT / weighted-Elo, SM-2 spaced repetition, DAG propagation |
| Backend | **None** — offline-first. An *optional* `/api/generate-question` endpoint is used when present, with a built-in offline generator as fallback. |

---

## 🗂 Project Structure

```
default/
├── index.html                 # App shell + Google Fonts + SVG favicon
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx               # React entry
    ├── App.tsx                # Splash → Portal → Auth → Shell
    ├── index.css              # Design tokens, glass utilities, animations
    ├── types.ts               # Shared domain types
    │
    ├── data/                  # Static curriculum
    │   ├── concepts.ts        #   9-node Concept Dependency Graph
    │   ├── misconceptions.ts  #   20-entry reasoning-flaw catalog
    │   ├── questions.ts       #   Procedural question + diagnostic generator
    │   └── blueprint.ts       #   CBSE marks weightage + ROI math
    │
    ├── lib/                   # Pure learning engine
    │   ├── mastery.ts         #   BKT/weighted-Elo + propagation + reroute
    │   ├── sm2.ts             #   SM-2 spaced-repetition scheduler
    │   ├── xray.ts            #   Reasoning diagnosis + quick-fill chips
    │   ├── questionService.ts #   Optional online generation + offline fallback
    │   ├── classModel.ts      #   35-student cohort + remedial plan builder
    │   ├── auth.ts            #   Local auth store (hashed passwords)
    │   ├── storage.ts         #   Per-account learner-state persistence
    │   └── theme.ts           #   Dark / Light theme tokens
    │
    ├── state/
    │   └── usePrepPilots.ts   # The brain — wires engine + persistence to UI
    │
    └── components/
        ├── SplashIntro.tsx    ├── PortalSelect.tsx
        ├── AuthPanel.tsx      ├── TopNav.tsx
        ├── ProfilePanel.tsx   ├── ThemeToggle.tsx
        ├── Primitives.tsx     ├── Logo.tsx
        ├── student/           # Prep Cockpit
        │   ├── StudentCockpit.tsx   ├── ConceptGraph.tsx
        │   ├── NodeDrawer.tsx       ├── PracticeStudio.tsx
        │   ├── XRayCard.tsx         ├── RetentionRadar.tsx
        │   ├── WhatIfSimulator.tsx  ├── RoughWorkAuditor.tsx
        │   └── DiagnosticModal.tsx
        └── teacher/           # Air Traffic Control
            ├── TeacherATC.tsx       ├── MasteryHeatmap.tsx
            ├── StudentRoster.tsx    └── MisconceptionFeed.tsx
```

---

## 🚀 Getting Started

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev          # → http://localhost:5173

# 3. type-check + production build
npm run build

# 4. preview the production build
npm run preview
```

**Requirements:** Node.js 18+ and npm.

> **Optional online question generation** — set `VITE_QUESTION_ENDPOINT` to a POST
> endpoint that returns `{ "question": { stem, options[4], correctIndex, explanation } }`.
> If it is missing, slow, or malformed, PrepPilots silently falls back to its built-in
> offline generator, so a live demo never breaks.

---

## 🔑 Demo Accounts

Seed accounts are created automatically on first launch.

| Portal | Email | Password |
| --- | --- | --- |
| Student | `aarav@preppilots.in` | `prep1234` |
| Admin | `meera@preppilots.in` | `prep1234` |

Or create your own account — student sign-up captures school, class/section; admin sign-up captures designation, subject, experience and employee ID.

---

## 🎨 Design System

A premium **aviation instrument** aesthetic — glassmorphism on a deep Obsidian canvas, with a neon accent palette.

| Token | Value |
| --- | --- |
| Background (Obsidian) | `#090D16` |
| Cyan (primary) | `#00F0FF` |
| Emerald (mastered) | `#10B981` |
| Amber (developing) | `#F59E0B` |
| Crimson (weak / alert) | `#EF4444` |
| Violet (ATC) | `#8B5CF6` |

- **Dark & Light** themes via `ThemeToggle`.
- `prefers-reduced-motion` respected across animations.
- Frosted glass cards, animated grid backdrops, and "sweep" light effects on primary actions.
- All data- and progress-persistence is local — refresh-safe by design.

---

<p align="center">
  <b>PrepPilots</b> · Adaptive Exam Prep Tutor with a Live Learner Model<br/>
  CBSE / NCERT Class 10 Physics · Electricity &amp; Light · BKT + SM-2 engine
</p>
