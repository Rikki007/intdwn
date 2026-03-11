# INTDWN - Offline Psychological Analytics Platform

INTDWN is a privacy-focused mobile psychological testing platform that works entirely offline. All data remains local on the user's device using IndexedDB.

## Features

- **Offline-First Architecture**: Works completely offline with PWA support
- **Adaptive Testing**: Pseudo-adaptive algorithm for efficient personality assessment
- **AI-Style Interpretations**: Generate personalized psychological insights
- **Progress Tracking**: Monitor personality changes over time
- **Data Privacy**: All data stored locally using IndexedDB
- **Multilingual Support**: English and Russian languages

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with Glassmorphism design
- **Charts**: Chart.js
- **Storage**: IndexedDB
- **PWA**: Service Worker for offline caching
- **Mobile**: Capacitor for Android/iOS deployment

## Project Structure

```
intdwn/
├── index.html              # Main HTML entry point
├── main.js                 # Application entry point
├── styles.css              # Main stylesheet
├── components.css          # Component styles
├── sw.js                   # Service Worker
├── manifest.json           # PWA manifest
├── package.json            # Project configuration
├── capacitor.config.json   # Capacitor configuration
│
├── core/                   # Core modules
│   ├── router.js           # SPA router
│   ├── storage.js          # IndexedDB wrapper
│   ├── i18n.js             # Internationalization
│   ├── utils.js            # Utility functions
│   └── constants.js        # Application constants
│
├── engine/                 # Test engine modules
│   ├── testEngine.js       # Main test execution engine
│   ├── adaptiveSelector.js # Adaptive question selection
│   ├── scoring.js          # Score calculation
│   ├── stoppingRule.js     # Test stopping conditions
│   └── traitEstimator.js   # Trait estimation algorithm
│
├── analytics/              # Analytics modules
│   ├── profileEngine.js    # Profile building
│   ├── ruleEngine.js       # Rule-based insights
│   ├── aiInterpreter.js    # AI-style interpretations
│   ├── reportGenerator.js  # Report generation
│   └── progressTracker.js  # Progress tracking
│
├── tests/                  # Test definitions
│   ├── schema/             # JSON schema
│   ├── bigFive.json        # Big Five personality test
│   ├── anxiety.json        # Anxiety assessment
│   ├── emotional_intelligence.json
│   ├── locus_of_control.json
│   ├── procrastination.json
│   └── stress_resistance.json
│
├── locales/                # Translations
│   ├── en.json
│   └── ru.json
│
├── ui/                     # UI components
│   ├── components/         # Reusable components
│   ├── home/               # Home view
│   ├── tests/              # Test views
│   ├── profile/            # Profile view
│   ├── onboarding/         # Onboarding flow
│   └── about/              # About page
│
├── data/                   # Static data
│   ├── facts.json          # Psychological facts
│   ├── rules.json          # Insight rules
│   └── interpretations.json # Trait interpretations
│
└── assets/                 # Static assets
    ├── icons/
    ├── animations/
    └── fonts/
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd intdwn

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# The app is already production-ready
# Just serve the files
npm run start
```

### Mobile Deployment

```bash
# Initialize Capacitor (first time)
npm run cap:init

# Add platforms
npm run cap:add:android
npm run cap:add:ios

# Sync web assets
npm run cap:sync

# Open in IDE
npm run cap:open:android
npm run cap:open:ios
```

## Available Tests

1. **Big Five Personality** - Comprehensive personality assessment
2. **Anxiety Assessment** - Anxiety and worry levels
3. **Emotional Intelligence** - EQ components
4. **Locus of Control** - Internal vs external control beliefs
5. **Procrastination** - Task avoidance patterns
6. **Stress Resistance** - Stress tolerance and coping

## Adaptive Testing Algorithm

The test engine uses a pseudo-adaptive algorithm:

1. Select initial question randomly
2. After each answer, update trait estimates
3. Calculate confidence level
4. Select next question based on:
   - Current trait estimate
   - Question difficulty matching
   - Low-confidence scales prioritization
5. Stop when:
   - Minimum questions answered (15) AND confidence ≥ 85%
   - OR maximum questions reached (35)

## Data Storage

All data is stored locally using IndexedDB:

- **user**: User profile and settings
- **tests_results**: Test results with scores and timestamps
- **settings**: Application settings

### Export/Import

Users can export their data as JSON and import it on another device.

## Customization

### Adding New Tests

1. Create a new JSON file in `/tests/` directory
2. Follow the test schema in `/tests/schema/testSchema.json`
3. The test will automatically appear in the app

### Adding Translations

1. Create a new file in `/locales/` (e.g., `de.json`)
2. Copy structure from `en.json`
3. Add the language code to `SUPPORTED_LANGUAGES` in `core/constants.js`

## Design System

### Colors

- Primary: Cyan (#00d4ff) to Violet (#8b5cf6) gradient
- Background: Dark (#0a0a1a to #151530)
- Text: White with opacity variations

### Typography

- Primary font: Inter
- Monospace: JetBrains Mono

### Components

- Glassmorphism cards
- Gradient buttons
- Animated progress bars
- Radar and line charts

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License

## Disclaimer

This application provides psychological insights for educational and self-awareness purposes only. It is not a medical diagnostic tool. For professional psychological assessment, please consult a qualified mental health professional.
