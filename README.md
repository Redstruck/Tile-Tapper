# Tile Tapper

A browser-based Minesweeper-style puzzle game built with React and Vite.
Designed as a fast, polished take on classic tile clearing — clear the field, trust the numbers, and chase your best times.

---

## Overview

Tile Tapper is an in-browser Minesweeper experience with a clean HUD, responsive board, and satisfying feedback for every reveal, flag, and win.
It combines classic rules (flood reveal, flagging, and chording) with sound effects, win celebrations, and light persistence for preferences and best times.

The project is intentionally focused: one game surface, clear controls, and a small component set that is easy to extend.

---

## Key Features

- Classic Minesweeper gameplay with flood reveal, flagging, and chord clears
- Three difficulty levels: Easy (9×9), Medium (16×16), and Hard (16×30)
- Safe first click — mines are placed after your opening move
- Mine counter, timer, and restart face in a compact HUD
- Sound effects for reveals, flags, explosions, and wins
- Confetti celebration on win and screen-shake feedback on loss
- Theme switching with light, dark, and system modes
- Best times tracked per difficulty and stored locally
- Responsive layout that works across desktop and mobile
- Built around a compact, easy-to-extend component structure

---

## Tech Stack

- **React** - application logic and UI
- **Vite** - development and build tooling
- **TypeScript** - type-safe application code
- **Tailwind CSS** - styling
- **shadcn/ui** - reusable UI components
- **canvas-confetti** - win celebration effects

---

## Project Structure

The app is organized around a single game surface and a few supporting layers:

- `src/components/minesweeper/Minesweeper.tsx` - main game state, controls, and effects
- `src/components/minesweeper/Board.tsx` - board layout and cell sizing
- `src/components/minesweeper/Cell.tsx` - tile interactions (reveal, flag, chord)
- `src/components/minesweeper/HUD.tsx` - mine counter, timer, and restart face
- `src/components/minesweeper/SettingsModal.tsx` - sound, theme, and best times
- `src/lib/minesweeper.ts` - board logic, difficulties, and win/loss rules
- `src/lib/sounds.ts` - Web Audio sound effects
- `src/pages/Index.tsx` - primary application page
- `src/components/ui/` - reusable shadcn/ui components

---

## Running Locally

### Prerequisites

- Node.js
- npm

### Setup

```bash
git clone https://github.com/Redstruck/Tile-Tapper.git
cd Tile-Tapper
npm install
npm run dev
```

---

## Development Notes

Tile Tapper is built as a focused puzzle game rather than a large game framework.
The code favors direct interaction, clear feedback, and small focused utilities so it stays easy to experiment with new board behaviors and UI ideas.
