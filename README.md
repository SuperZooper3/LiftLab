# LiftLab 🎢

A **frontend-focused elevator simulator** designed as a learning and visual playground for elevator algorithms. Configure buildings, watch elevators move in real time, and benchmark algorithm performance.

## 🚀 Project Status

**Current Phase**: MVP Development - Milestone 1 ✅ COMPLETED  
**Last Updated**: September 28, 2025

### ✅ Completed - Milestone 1
- [x] Monorepo structure with npm workspaces
- [x] ESLint + Prettier configuration
- [x] TypeScript setup for both packages
- [x] Tailwind CSS setup with custom elevator/passenger themes
- [x] Zustand store with simulation config & state management
- [x] React app scaffold with placeholder UI
- [x] Vite build configuration

### 📋 Next Up - Milestone 2
- [ ] Core simulation kernel (elevators, passengers, tick loop)
- [ ] Domain models (Passenger, Elevator interfaces)
- [ ] Deterministic RNG helper
- [ ] Algorithm interface & greedy baseline

## 🏗️ Architecture

```
lift-lab/
├── packages/
│   ├── sim/          # TypeScript simulation engine
│   └── web/          # React + Vite frontend
├── specs.md          # Full project specification
├── prompt_plan.md    # Development blueprint
├── todo.md           # Detailed task checklist
└── behaviors.md      # Manual testing guide
```

**Tech Stack:**
- **Language**: TypeScript 5.x (strict mode)
- **Frontend**: React 18 + Vite 5 + Tailwind CSS
- **State**: Zustand (lightweight)
- **Visualization**: React-Konva (HTML5 Canvas)
- **Build**: npm workspaces
- **Lint**: ESLint + Prettier

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+ 

### Installation
```bash
# Clone and install dependencies
git clone https://github.com/SuperZooper3/LiftLab.git
cd LiftLab
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start web dev server
npm run build        # Build all packages
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
```

## 📦 Package Structure

### `@lift-lab/sim` - Simulation Engine
Pure TypeScript library implementing:
- Elevator state machines
- Passenger spawning & behavior  
- Algorithm interface
- Deterministic tick system
- Metrics collection

### `@lift-lab/web` - React Frontend
React application providing:
- Building visualization (Canvas)
- Control panel (config, playback)
- Algorithm selector dropdown
- Real-time metrics overlay

## 🎯 Core Features (MVP)

1. **Configurable Simulation**: 3-60 floors, 1-8 elevators
2. **Visual Playground**: Mini Metro style animations
3. **Algorithm Benchmarking**: Average wait/travel time metrics
4. **Pluggable Algorithms**: Easy algorithm swapping via dropdown
5. **Playback Controls**: Start/pause/reset, speed adjustment (0.25×-4×)

## 🔮 Future Extensions

- Advanced algorithms (genetic, AI-powered)
- Continuous simulation mode
- Custom passenger distributions
- Enhanced visualizations
- User-created algorithms with Monaco editor
- Performance analytics & charts

## 📚 Documentation

- [`specs.md`](./specs.md) - Complete technical specification
- [`prompt_plan.md`](./prompt_plan.md) - Step-by-step development plan
- [`todo.md`](./todo.md) - Granular task checklist
- [`behaviors.md`](./behaviors.md) - Manual testing procedures

## 🤝 Contributing

This is currently a solo learning project following an iterative MVP approach. See `todo.md` for the current development roadmap.

## 📄 License

MIT License - see LICENSE file for details.

---

*Built with ❤️ for elevator algorithm enthusiasts*