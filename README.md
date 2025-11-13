# Study OS

A modern, intelligent study application built with React, Vite, and Tailwind CSS.

## Features

- 📚 **Dashboard** - Track your progress, courses, and study streaks
- 📝 **Notes** - Rich markdown editor with table of contents
- 🃏 **Flashcards** - Interactive flashcard decks with flip animations
- 📊 **Quizzes** - Multiple question types (MCQ, short answer, cloze)
- 🗺️ **Concept Maps** - Visual knowledge graphs
- 📅 **Planner** - Task management with Pomodoro timer
- 📈 **Analytics** - Charts and insights on your study progress
- 🎨 **Theming** - Light, dark, and system theme support
- ⌨️ **Command Palette** - Fast navigation with ⌘K (or Ctrl+K)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Card, etc.)
│   └── layout/       # Layout components (Sidebar, Header)
├── contexts/         # React contexts (Theme)
├── lib/              # Utility functions
├── pages/            # Page components (Dashboard, Notes, etc.)
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles and theme variables
```

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Open command palette
- `Escape` - Close command palette

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Charts and graphs
- **Lucide React** - Icons

## Environment Variables

Create a `.env` file in the root directory with your NVIDIA API key:

```env
VITE_NVIDIA_API_KEY=your_nvidia_api_key_here
```

The API key is already configured. Restart the dev server after creating/updating the `.env` file.

## Notes

- AI features use NVIDIA API for chat completions
- The app uses mock data for demonstration purposes
- All UI components are functional and responsive


