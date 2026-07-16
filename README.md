# Pyfly




A browser-based Python playground built with React and Vite.

Designed as a fast, hands-on environment for writing Python, running code in the browser, and experimenting with interactive input and output.




---




## Overview




Pyfly is an in-browser Python runner that gives you a compact IDE-like experience without leaving the browser.

It combines a code editor, live execution, interactive input support, and a polished interface for exploring Python quickly.




The project is intentionally lightweight and exploratory: the focus is on immediate feedback, simple controls, and a small surface area that is easy to extend.




---




## Key Features




- Browser-based Python execution powered by Pyodide

- Monaco Editor integration for a rich code editing experience

- Interactive `input()` support for terminal-style programs

- Real-time output capture and traceback display

- Theme switching with light, dark, and system modes

- Settings for editor font size and indentation behavior

- Responsive layout that works across desktop and mobile

- Built around a compact, easy-to-extend component structure




---




## Tech Stack




- **React** - application logic and UI

- **Vite** - development and build tooling

- **TypeScript** - type-safe application code

- **Pyodide** - Python runtime in the browser

- **Monaco Editor** - code editing experience

- **Tailwind CSS** - styling

- **shadcn/ui** - reusable UI components




---




## Project Structure




The app is organized around a small runner surface and a few supporting UI layers:




- `src/components/CodeRunner.tsx` - main Python editor, execution, and output flow

- `src/components/Traceback.tsx` - traceback and error presentation

- `src/components/ThemeProvider.tsx` - theme management and persistence

- `src/components/ui/` - reusable shadcn/ui components

- `src/pages/Index.tsx` - primary application page

- `public/pythonRunnerWorker.js` - worker used by the Python runtime flow




---




## Running Locally




### Prerequisites




- Node.js

- npm




### Setup




```bash

git clone <your-repo-url>

cd python-playground-1

npm install

npm run dev

```




---




## Development Notes




Pyfly is built as a compact playground rather than a full IDE.

The code favors direct interaction, clear feedback, and small focused utilities so it stays easy to experiment with new Python behaviors and UI ideas.
