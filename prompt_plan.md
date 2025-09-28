# LiftLab MVP – Development Blueprint

> This document is both a **road-map** and a **prompt-book**.  
> • Sections 1-3 walk through successive refinements of the implementation plan.  
> • Section 4 contains ready-to-paste **LLM prompts** (fenced as `text`)—one per micro-task—designed to be executed sequentially.  
> Each prompt assumes that the codebase produced by the previous prompt is now present.

---

## 0 · Architecture & Tech Stack (MVP-Focused)

| Layer | Decision |
|-------|----------|
| Language | **TypeScript 5.x** (`strict`) |
| Framework | **React 18** (functional components + hooks) |
| Build Tool | **Vite 5** (ESBuild + Rollup, default opts) |
| Package Manager | **pnpm workspaces** (`sim` + `web`) |
| Visualization | **React-Konva** (Canvas) |
| State Management | **Zustand** (lightweight) |
| Styling | **Tailwind CSS** JIT |
| Simulation Engine | Pure TS library (`packages/sim`) |
| Lint/Format | ESLint + Prettier (optional but recommended) |

> We intentionally **omit automated tests, CI, and complex state-machine libs** from the MVP to stay lean. Those are captured in an **Extended Roadmap** later.

---

## 1 · High-Level Milestones – MVP Only

1. Project bootstrap (repo, pnpm, basic lint)  
2. Core simulation kernel (elevators, passengers, tick loop)  
3. Algorithm plug-in interface (central dispatcher & greedy baseline)  
4. React UI scaffold with Tailwind  
5. Canvas renderer (shafts, cars)  
6. Control panel (config, start/pause/reset, speed)  
7. Algorithm selector dropdown  
8. Basic metrics overlay (avg wait/travel)  

*Nice-to-have but Deferred*: production build/deploy, extra features.

---

## 2 · Milestones → Iterative Chunks (MVP)

| Milestone | Chunks |
|-----------|--------|
|1|1-A Create monorepo  <br>1-B Add ESLint & Prettier (skip Husky/commitlint)  <br>1-C Tailwind setup  <br>1-D Zustand stub store|
|2|2-A TS domain models  <br>2-B Deterministic RNG helper  <br>2-C Tick scheduler  <br>2-D Elevator state machine  <br>2-E Passenger spawner|
|3|3-A `ElevatorAlgorithm` interface  <br>3-B `GreedyAlgorithm` baseline|
|4|4-A Vite + React scaffold  <br>4-B `<App/>` placeholder|
|5|5-A `BuildingCanvas` shafts & static cars  <br>5-B Animate movement per tick|
|6|6-A `ControlPanel` config form  <br>6-B Playback controls (start/pause/reset)  <br>6-C Speed slider|
|7|7-A Algorithm dropdown  <br>7-B Wire selection into kernel|
|8|8-A Metrics overlay  <br>8-B Summary modal after run|

---

## 3 · LLM Prompt Suite – MVP

### Prompt 01-MVP – Repo & Workspace
```text
Scaffold a pnpm workspace “lift-lab” with packages `sim` and `web`.
Include basic ESLint + Prettier configs and Tailwind setup in `web`.
Return file tree and contents ready to commit.
```

### Prompt 02-MVP – Domain Models
```text
Add `packages/sim/src/models.ts` defining `Passenger`, `Elevator`, direction enums, etc.
```

### Prompt 03-MVP – Tick & RNG
```text
Create `packages/sim/src/tick.ts` (ticker) and `rng.ts` (seeded RNG helper).
```

### Prompt 04-MVP – Elevator State Machine
```text
Implement `ElevatorCar` class with move/open/close operations and state snapshot.
```

### Prompt 05-MVP – Passenger Spawner
```text
Add `PassengerSpawner` producing uniformly random passengers per tick.
```

### Prompt 06-MVP – Algorithm Interface + Greedy
```text
Define `ElevatorAlgorithm` and implement `GreedyAlgorithm`.
```

### Prompt 07-MVP – React Scaffold
```text
In `packages/web`, set up Vite + React 18 + Tailwind.
Create minimal `<App/>` that renders placeholder text.
```

### Prompt 08-MVP – Canvas Renderer
```text
Add `BuildingCanvas.tsx` using React-Konva.
Render shafts and cars at static positions.
```

### Prompt 09-MVP – Animate & Hook Up Kernel
```text
Wire simulation kernel to `BuildingCanvas` to animate elevator y-positions.
```

### Prompt 10-MVP – Control Panel & Speed
```text
Add `ControlPanel.tsx` with floors/elevators inputs and start/pause/reset buttons.
Speed slider 0.25×-4× updates tick interval.
```

### Prompt 11-MVP – Algorithm Selector
```text
Add dropdown listing available algorithms; re-init kernel on change.
```

### Prompt 12-MVP – Metrics Overlay
```text
Overlay live average wait/travel time; show summary modal at simulation end.
```

---

## 4 · Extended Roadmap (Post-MVP)

Once the MVP is functional, consider sequentially adding:

1. **Automated Tests & CI** – Vitest unit tests, Playwright e2e, GitHub Actions.  
2. **Storybook** – Isolated component development.  
3. **Production Build & Deploy** – Optimize Vite build, Vercel deployment.  
4. **Advanced Algorithms** – Genetic, AI-powered, multi-objective.  
5. **Continuous Simulation Mode** – Passengers spawn indefinitely, metrics over time.  
6. **Custom Passenger Distributions** – CSV/JSON import or UI builder.  
7. **Enhanced Visualization** – Passenger avatars, elevator numbers, heatmaps.  
8. **User-Created Algorithms** – Monaco editor with sandboxing.

Each extension can follow the earlier prompt style—create small, incremental prompts focusing on one feature at a time.

---

> **Next action**: Start with Prompt 01-MVP and iterate through Prompt 12-MVP to build a lean yet complete elevator simulator. Extended features can follow once the core is solid.
