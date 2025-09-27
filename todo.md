# LiftLab – Development Checklist

Use this `todo.md` as a living checklist. Tick each `[ ]` when done. Indent subtasks one level. Feel free to split further as you work.

---

## MVP (Minimum Viable Product)

### Milestone 1 – Project Bootstrap
- [ ] 1-A **Create pnpm monorepo**
  - [ ] Init new Git repository & first commit with `specs.md` / `prompt_plan.md`
  - [ ] Run `pnpm init` at root
  - [ ] Add `package.json` with `workspaces` field
  - [ ] Add `pnpm-workspace.yaml`
  - [ ] Create `packages/sim` and `packages/web` directories, each with its own `package.json`
- [ ] 1-B **Add ESLint & Prettier**
  - [ ] Install `eslint`, `@typescript-eslint/*`, `eslint-plugin-react`
  - [ ] Install `prettier` + `eslint-config-prettier`
  - [ ] Create `.eslintrc.json` extending recommended configs
  - [ ] Add `.prettierrc` with 2-space indent, single quotes, 100-char print width
  - [ ] Add `lint` & `format` scripts to root `package.json`
- [ ] 1-C **Set up Tailwind CSS in `web`**
  - [ ] Install `tailwindcss`, `postcss`, `autoprefixer`
  - [ ] Run `npx tailwindcss init -p`
  - [ ] Add Tailwind content paths in `tailwind.config.ts`
  - [ ] Import Tailwind base/components/utilities into `web/src/index.css`
- [ ] 1-D **Create Zustand store stub**
  - [ ] Install `zustand`
  - [ ] Create `web/src/store.ts` exporting basic global state (config & sim status)

### Milestone 2 – Core Simulation Kernel
- [ ] 2-A **Define domain models**
  - [ ] Create `sim/src/models.ts`
  - [ ] Add `Passenger`, `Elevator` interfaces
  - [ ] Add `Direction`, `DoorState` enums
- [ ] 2-B **Deterministic RNG helper**
  - [ ] Implement `createSeededRNG(seed: number)` returning `nextFloat() -> number`
- [ ] 2-C **Tick scheduler**
  - [ ] Create `sim/src/tick.ts`
  - [ ] Implement `createTicker(intervalMs)` returning `start/stop/onTick`
- [ ] 2-D **ElevatorCar state machine**
  - [ ] Create `sim/src/elevator.ts`
  - [ ] Methods: `moveUp`, `moveDown`, `openDoors`, `closeDoors`, `step()`
  - [ ] Track current floor, direction, door state, goal queue
- [ ] 2-E **PassengerSpawner**
  - [ ] Create `sim/src/spawner.ts`
  - [ ] Parameters: floorCount, spawnRate, rng
  - [ ] `nextTick(nowMs)` returns new passengers

### Milestone 3 – Algorithm Interface & Greedy Baseline
- [ ] 3-A **`ElevatorAlgorithm` interface**
  - [ ] Signature: `onTick(state): ElevatorCommand[]`
  - [ ] Define `ElevatorCommand` type
- [ ] 3-B **`GreedyAlgorithm` implementation**
  - [ ] Select nearest call to service next
  - [ ] Export as default algorithm

### Milestone 4 – React Scaffold
- [ ] 4-A **Bootstrap Vite + React + Tailwind**
  - [ ] Run `pnpm create vite web --template react-ts`
  - [ ] Move into `packages/web`, install deps, link workspace
  - [ ] Integrate Tailwind (index.css)
- [ ] 4-B **Create minimal `<App/>`**
  - [ ] Replace Vite boilerplate with “LiftLab 🎢” heading
  - [ ] Verify `pnpm dev` launches app

### Milestone 5 – Canvas Renderer
- [ ] 5-A **`BuildingCanvas.tsx` (static)**
  - [ ] Install `react-konva` & `konva`
  - [ ] Render N elevator shafts as rectangles
  - [ ] Render elevator cars at initial floor
- [ ] 5-B **Animate movement**
  - [ ] Accept elevator states via props
  - [ ] Use Konva `Tween` or `Spring` to animate Y-position

### Milestone 6 – Control Panel
- [ ] 6-A **Config form**
  - [ ] Inputs for floors (3-60) and elevators (1-8)
  - [ ] Validation & update to global store
- [ ] 6-B **Playback controls**
  - [ ] Buttons: Start, Pause, Reset
  - [ ] Wire to simulation kernel start/stop/reset
- [ ] 6-C **Speed slider**
  - [ ] Range 0.25×–4×, updates tick interval in kernel

### Milestone 7 – Algorithm Selector
- [ ] 7-A **Dropdown component** listing available algorithms
  - [ ] Populate options from `sim` package export list
- [ ] 7-B **Wire selection**
  - [ ] On change, recreate simulation kernel with chosen algorithm

### Milestone 8 – Metrics Overlay
- [ ] 8-A **Live metrics overlay**
  - [ ] Track passenger request/pickup/dropoff timestamps
  - [ ] Compute rolling averages and display in corner HUD
- [ ] 8-B **Summary modal**
  - [ ] At simulation end, freeze state
  - [ ] Show average wait, average travel, total passengers served

---

## Extended Features (Post-MVP)

### 1 Automated Tests & CI
- [ ] **Vitest unit tests**
  - [ ] Write tests for `ElevatorCar` transitions
  - [ ] Test `GreedyAlgorithm` simple scenario
- [ ] **Playwright e2e**
  - [ ] Script launching app and completing one simulation
- [ ] **GitHub Actions workflow**
  - [ ] Steps: checkout, setup pnpm, install, lint, test, build

### 2 Storybook
- [ ] Install Storybook with Vite builder
- [ ] Story: `BuildingCanvas` static view
- [ ] Story: Control panel interactions

### 3 Production Build & Deploy
- [ ] Optimize Vite build (chunking, minification)
- [ ] Add `vercel.json` routing to `/`
- [ ] Add `deploy:prod` script

### 4 Advanced Algorithms
- [ ] Implement `NearestCarAlgorithm`
- [ ] Implement `LookAheadAlgorithm`
- [ ] UI to choose and compare metrics

### 5 Continuous Simulation Mode
- [ ] Toggle to enable endless passenger spawn
- [ ] Live line chart of waiting passengers

### 6 Custom Passenger Distributions
- [ ] Dropdown presets: Morning Up-Peak, Evening Down-Peak
- [ ] File upload for CSV distribution

### 7 Enhanced Visualization
- [ ] Render passenger dots moving into elevators
- [ ] Color elevators when doors open
- [ ] Heatmap overlay per floor wait times

### 8 User-Created Algorithms
- [ ] Integrate Monaco editor
- [ ] Provide TS template stub implementing interface
- [ ] Sandbox execution with Web Worker

---

> Tip: When a task spans multiple commits, break it down further in-line or reference issue numbers.
