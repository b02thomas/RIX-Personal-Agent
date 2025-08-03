# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

### **# IMPORTANT**

* Always prioritize writing clean, simple, and modular code.
* Use simple & easy-to-understand language. Write in short sentences.
* DO NOT BE LAZY! Always read files IN FULL!!

---

### **# COMMENTS**

* Write lots of comments in your code. explain exactly what you are doing in your comments.
* but be strategic, do not explain obvious syntax – instead explain your thought process at the time of writing the code!
* NEVER delete explanatory comments from the code you're editing (unless they are wrong/obsolete)
* DO NOT delete comments currently in our code. If the comment is obsolete, or wrong, then update it – but NEVER mindlessly remove comments without reason.

---

### **# UI DESIGN PRINCIPLES**

* **Dark-first design** (#0F1115 background, #1A1D23 cards, #2D3748 borders)
* **Primary blue accent** (#0066FF primary, #0052CC dark variant)
* **Chat-focused layout** (60% chat, 25% sidebar, mobile-first responsive)
* **Floating AI sphere** with voice input and context-aware quick actions
* **Mobile navigation** (sidebar → drawer + bottom nav on mobile)
* **Touch-optimized** (44px minimum touch targets, haptic feedback)
* **60fps animations** with hardware acceleration (transform/opacity only)
* **Accessibility-first** (WCAG 2.1 AA, screen readers, keyboard navigation)
* **Performance optimized** (dynamic imports, code splitting, <200kB bundles)

---

### **# HEADER COMMENTS**

* EVERY file HAS TO start with 4 lines of comments!

  1. exact file location in codebase
  2. clear description of what this file does
  3. clear description of WHY this file exists
  4. RELEVANT FILES: comma-separated list of 2–4 most relevant files
* NEVER delete these "header comments" from the files you're editing.

---

## Project Overview

RIX is a Progressive Web App (PWA) that serves as a personal AI "Second Brain" system. The project follows a **dual-architecture** approach:

1. **RIX Frontend** (Next.js 15 PWA) - Chat-focused UI with floating AI sphere
2. **Main Agent** (FastAPI) - RIX-compliant manager/router for AI processing

The system integrates with N8N workflows through MCP (Model Context Protocol) endpoints where all LLM processing occurs.

## Development Commands

### RIX Frontend (Next.js)
```bash
# Navigate to main directory
cd RIX/

# Start development server (auto-detects free port if 3000 occupied)
npm run dev

# Build for production (validates all optimizations)
npm run build

# Start production server
npm run start

# Lint code (zero warnings required)
npm run lint

# Type check (strict TypeScript compliance)
npm run type-check

# Testing commands
npm run test                    # Run all tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage report
npm run test:ci                 # Run tests for CI/CD (400+ tests must pass)
npm run test:mobile             # Run mobile performance tests
npm run test:mobile:build       # Build + mobile performance tests

# Performance analysis
npm run analyze                 # Bundle analysis (ANALYZE=true)
npm run lighthouse:mobile       # Mobile Lighthouse audit
npm run pwa:test               # PWA test suite
```

### Main Agent (FastAPI)
```bash
# Navigate to Main Agent directory
cd RIX/main-agent/

# Install dependencies (RIX-compliant, no OpenAI)
pip3 install -r requirements.txt

# Create test environment file
cp .env.example .env

# Test imports and configuration
python3 -c "from app.main import app; print('✅ Main Agent ready')"

# Start development server
python3 main.py

# Health check (28+ routes configured including N8N workflow management)
curl http://localhost:8001/health

# Test Main Agent features
python3 -m pytest tests/ -v                    # Run all tests
python3 -m pytest tests/test_simple_intelligence.py -v  # Test intelligence features
python3 -m pytest tests/test_workflow_manager.py -v     # Test N8N workflow management

# Docker deployment
./scripts/deploy.sh deploy                      # Quick deployment
./scripts/deploy.sh deploy:prod                 # Production deployment
./scripts/deploy.sh verify                      # Verify deployment
```

## Architecture Overview

### RIX PRD Compliance
The system follows the **RIX PRD architecture** where the Main Agent is a pure **Manager/Router + Context Manager** with **NO direct LLM integration**:

```
User Request → RIX Frontend → Main Agent (Router) → N8N MCP Endpoints (LLM Processing)
```

**Key Principles:**
- Main Agent uses **pattern-based intent recognition** (NLTK + regex)
- All LLM processing happens in **N8N MCP subagents**
- Main Agent manages **context and routing only**

### Technology Stack

#### RIX Frontend
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components + custom design system
- **Layout**: Chat-focused dashboard (60% chat, 25% sidebar) with floating AI sphere
- **Navigation**: Enhanced sidebar (desktop) → drawer + bottom nav (mobile)
- **State Management**: Zustand with persistence (6 stores: auth, chat, n8n, preferences, connection, navigation)
- **Testing**: Jest + React Testing Library (400+ tests, 80% coverage threshold)
- **Voice Integration**: Web Speech API with graceful fallback
- **Mobile**: Touch-optimized with haptic feedback and gesture support
- **Performance**: Optimized bundles (<200kB), 60fps animations, PWA features
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: JWT with HTTP-only cookies (15-min access, 7-day refresh)

#### Main Agent
- **Framework**: FastAPI with async/await
- **Authentication**: JWT validation (compatible with frontend)
- **Database**: AsyncPG with PostgreSQL connection pooling
- **Message Routing**: NLP-powered workflow selection (NLTK)
- **Communication**: WebSocket for real-time, HTTP for API
- **Monitoring**: Structured logging with health checks

### New Features (Recent Implementation)

#### Floating AI Sphere
- **Location**: Fixed bottom-right positioning across all pages
- **Voice Input**: Web Speech API integration with real-time transcription
- **Quick Actions**: Context-aware action buttons based on current page
- **Mobile Adaptive**: Adjusts position to avoid bottom navigation
- **Animations**: Hardware-accelerated pulsing and state transitions
- **Integration**: Available in `01-implementation/ai-sphere/`

#### Enhanced Task Management
- **Advanced Filtering**: Multi-dimensional search (status, priority, date, tags)
- **Visual Status System**: Color-coded priority borders and animated status indicators
- **Bulk Operations**: Multi-select with batch actions
- **Mobile Optimization**: Touch-friendly interactions with swipe gestures
- **Components**: `EnhancedTaskCards`, `TaskPageLayout` in `01-implementation/task-improvements/`

#### Performance Optimizations
- **Bundle Size**: Reduced 30-39% through strategic code splitting
- **Loading**: 40-51% faster with progressive component loading
- **Memory**: 39-81% reduction through virtual scrolling and cleanup
- **Mobile**: 43-71% improvement in touch response and rendering
- **Icons**: Unified OptimizedIcon system with tree-shaking
- **Components**: Available in `05-implementation/performance-optimization/`

### Database Schema
Shared PostgreSQL database with pgvector extension:

**Core Tables:**
- `users` - User accounts with UUID primary keys
- `user_sessions` - JWT refresh token management
- `conversations` - Chat conversation threads
- `messages` - Individual messages with vector embeddings (1536 dimensions)
- `user_preferences` - Theme, language, and feature preferences

**Feature Tables:**
- `projects` - Project management with AI health scores (0-100), status, priority, tags
- `routines` - Habit tracking with JSONB habits, frequency, time scheduling
- `daily_routine_completions` - Daily habit completion tracking with percentages
- `calendar_events` - Calendar and scheduling data with time-blocking support
- `knowledge_entries` - Vector embeddings (1536 dim) with semantic search, content categorization
- `user_goals` - Goal tracking with AI insights (JSONB), progress monitoring, deadlines
- `routine_analytics` - Performance tracking, completion rates, trend analysis

Database initialization happens automatically via `src/lib/database.ts:initDatabase()`.
Vector similarity search uses pgvector with ivfflat indexing and cosine similarity.

### MCP Integration Architecture
The Main Agent routes to N8N MCP endpoints (where LLM processing occurs):

**Core MCP Endpoints:**
- `/mcp/task-management` - Task creation/management with LLM
- `/mcp/calendar-intelligence` - Smart scheduling with LLM
- `/mcp/general-conversation` - Open chat with LLM
- `/mcp/briefing-generator` - Daily summaries with LLM
- `/mcp/news-intelligence` - News analysis with LLM
- `/mcp/voice-processing` - Speech processing with LLM
- `/mcp/analytics-learning` - Data insights with LLM
- `/mcp/notification-management` - Smart notifications with LLM
- `/mcp/project-chatbot` - Project chat with LLM

**Intelligence MCP Endpoints:**
- `/mcp/routine-coaching` - AI-guided routine optimization and habit suggestions
- `/mcp/project-intelligence` - AI health score calculation and project insights
- `/mcp/calendar-optimization` - Intelligent scheduling and time-block suggestions

### Message Flow Architecture
```
1. User: "Create a task for tomorrow" (voice or text)
2. RIX Frontend → Main Agent `/api/chat/send`
3. Main Agent: Pattern match → intent="task.create" (NO LLM)
4. Main Agent: Get context from vector memory
5. Main Agent: POST to N8N `/mcp/task-management` 
6. N8N Task Subagent: Process with LLM (GPT/Claude)
7. N8N: Return structured response to Main Agent
8. Main Agent: Store interaction, return to user
9. RIX Frontend: Display response + update floating AI sphere
```

## Environment Configuration

### RIX Frontend (.env.local)
```env
NODE_ENV=development
AUTH_MODE=mock                    # Use mock for development
N8N_MODE=mock                     # Use mock for development  
JWT_SECRET=mock-secret-key-for-development
DB_REQUIRED=false                 # Skip DB in mock mode
MOCK_ADMIN_EMAIL=admin@rix.com
MOCK_ADMIN_PASSWORD=admin123
```

### Main Agent (.env)
```env
# Application
DEBUG=true
HOST=0.0.0.0
PORT=8001

# JWT (must match RIX frontend)
JWT_SECRET=your-super-secret-jwt-key-here

# Database (shared with RIX frontend)
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rix_personal_agent

# N8N Integration
N8N_BASE_URL=https://n8n.smb-ai-solution.com
N8N_API_KEY=your_n8n_api_key
N8N_JWT_TOKEN=your_n8n_jwt_token

# MCP Endpoints (where LLM processing happens)
MCP_TASK_ENDPOINT=/mcp/task-management
MCP_CALENDAR_ENDPOINT=/mcp/calendar-intelligence
MCP_CHAT_ENDPOINT=/mcp/general-conversation
# ... (see .env.example for complete list)
```

## Key Implementation Details

### API Route Structure
**RIX Frontend Core:**
- `/api/auth/*` - Authentication endpoints (signup, signin, refresh, logout)
- `/api/conversations/*` - Chat management and message handling
- `/api/n8n/*` - N8N workflow status and management

**Feature APIs:**
- `/api/projects/*` - Project CRUD, AI health scores, tag management
- `/api/routines/*` - Routine CRUD, habit tracking, completion endpoints
- `/api/calendar/*` - Calendar events, time-blocking, optimization
- `/api/analytics/*` - Performance metrics and summary endpoints
- `/api/intelligence/*` - AI coaching, project intelligence, calendar optimization
- `/api/knowledge/*` - Knowledge CRUD with vector search
- `/api/goals/*` - Goal tracking with AI insights

**Main Agent (FastAPI):**
- `/api/auth/verify` - JWT token verification
- `/api/chat/send` - Process chat messages with MCP routing
- `/intelligence/*` - AI coaching endpoints (routine, project, calendar)
- `/api/n8n/*` - N8N workflow discovery, activation, AI-triggered execution
- `/health`, `/ready`, `/live` - Health monitoring endpoints
- `/ws/chat/{user_id}` - Real-time WebSocket communication

### State Management (Frontend)
Zustand stores handle different application concerns:
- `authStore` - User authentication state
- `chatStore` - Conversation and message state  
- `n8nStore` - N8N workflow status and monitoring
- `preferencesStore` - User settings, theme, and preferences with persistence
- `connectionStore` - Real-time connection status
- `navigationStore` - Sidebar state, project hierarchy, responsive behavior

### Message Router (Main Agent)
Located in `main-agent/app/services/message_router.py`:
- Uses NLTK for text preprocessing and keyword extraction
- Pattern-based workflow selection (no LLM calls)
- Confidence scoring for workflow routing
- Fallback to general conversation for unclear intents

## Development Workflow

### Working with RIX Frontend
1. **Mock Mode**: Use `AUTH_MODE=mock` and `N8N_MODE=mock` for development
2. **Next.js 15 Patterns**: All API routes use async params (`const { id } = await params`)
3. **Chat-Focused Layout**: Central chat interface with floating AI sphere
4. **Navigation System**: Sidebar-based with project hierarchy, collapsible on desktop, drawer + bottom nav on mobile
5. **Theme System**: Dark/Light/System modes with exact color values (#0066FF, #0F1115, etc.)
6. **Component Architecture**: Dynamic icon imports via `OptimizedIcon`, header comments required
7. **Bundle Optimization**: Maintain dynamic imports and code splitting (<200kB target)
8. **PWA Features**: Service worker and offline functionality implemented
9. **Performance**: Hardware-accelerated animations, virtual scrolling for large lists
10. **Voice Integration**: Web Speech API with fallback, context-aware processing
11. **React Hook Dependencies**: Always include all dependencies in useEffect/useCallback arrays

### Working with Main Agent  
1. **RIX Compliance**: Main Agent is pure Manager/Router (NO direct LLM integration)
2. **Dependencies**: Uses NLTK for pattern matching only, no OpenAI/tiktoken
3. **MCP Integration**: All AI processing routed to N8N MCP endpoints
4. **Configuration**: 28+ FastAPI routes including intelligence and N8N workflow management
5. **Database Integration**: Uses AsyncPG with connection pooling for all operations
6. **Environment**: Requires proper `.env` file for successful startup

### Working with New Features

#### Floating AI Sphere Implementation
1. **Integration**: Add `<FloatingAISphere />` to root layout or specific pages
2. **CSS**: Import `sphere-animations.css` for hardware-accelerated animations
3. **Voice API**: Requires HTTPS context for Web Speech API functionality
4. **Context Awareness**: Sphere adapts quick actions based on current page
5. **Mobile**: Automatically adjusts position to avoid bottom navigation conflicts
6. **Testing**: Comprehensive tests in `04-implementation/testing-quality/new-test-files/`

#### Enhanced Task Management
1. **Components**: Use `EnhancedTaskCards` and `TaskPageLayout` components
2. **Filtering**: Multi-dimensional search with real-time updates
3. **Virtual Scrolling**: For large task lists (>100 items)
4. **Mobile**: Touch-optimized with swipe actions and haptic feedback
5. **Visual States**: Color-coded priority borders and animated status indicators

#### Performance Optimizations
1. **Bundle Analysis**: Use `npm run analyze` to monitor bundle sizes
2. **Icon System**: Use `OptimizedIcon` component for all icons
3. **Code Splitting**: Implement progressive loading for heavy components
4. **Memory Management**: Virtual scrolling and proper cleanup in useEffect
5. **Animations**: Use transform/opacity only, avoid layout-triggering properties

### Current Navigation Architecture
The application uses a modern sidebar-based navigation system:

**Desktop Navigation (≥1024px)**:
- Enhanced sidebar: Dashboard, Projects (expandable), Tasks, Routines, Calendar, Intelligence, Settings
- Collapsible: 280px expanded ↔ 64px collapsed with smooth animations
- Project hierarchy with add/remove/reorder functionality
- Theme toggle and user profile integration
- Floating AI sphere in bottom-right corner

**Mobile Navigation (<768px)**:
- Bottom navigation bar (5 primary items) with 44px touch targets
- Hamburger drawer menu for secondary navigation
- Swipe gestures (swipe-to-close) with haptic feedback
- Safe area support for modern devices
- AI sphere repositioned to avoid navigation conflicts

**Responsive Components**:
- `enhanced-sidebar.tsx` - Desktop sidebar with project management
- `mobile-navigation.tsx` - Mobile bottom nav + drawer system
- `navigation-store.ts` - Centralized state management with persistence
- `design-system.css` - Unified styling with CSS custom properties

## Testing and Quality

### Build Validation Process
**CRITICAL**: Always run these commands after making changes:
```bash
# Frontend validation (must be clean)
cd RIX/
npm run build         # Must compile successfully
npm run lint          # Must show "✔ No ESLint warnings or errors"
npm run type-check    # Must pass without errors
npm run test:ci       # Run all tests in CI mode (400+ tests must pass)

# Main Agent validation
cd RIX/main-agent/
python3 -c "from app.main import app; print('✅ Imports successful')"
```

### Testing Architecture
- **Test Framework**: Jest + React Testing Library (Frontend), pytest (Main Agent)
- **Coverage Threshold**: 80% for branches, functions, lines, and statements
- **Test Categories**: 
  - **Frontend**: Component tests (navigation, core features, intelligence UI, AI sphere), State management tests (Zustand stores), Mobile tests (haptic feedback, gestures, PWA), Integration tests (API communication), Voice input tests (Web Speech API)
  - **Main Agent**: Intelligence pattern matching, N8N workflow management, Context management, Database operations
- **Specialized Testing**: 
  - AI sphere functionality (voice input, quick actions, positioning)
  - Task management enhancements (filtering, sorting, mobile interactions)
  - Performance optimization validation (bundle sizes, loading times)
  - Mobile optimization testing (touch interactions, responsive design)
  - Vector search testing with pgvector
  - N8N integration testing (discovery, activation, AI-triggered execution)
  - RIX PRD compliance testing (no direct LLM integration)
- **Test Files**: 
  - Frontend: `src/**/__tests__/` or `src/**/*.{test,spec}.{js,jsx,ts,tsx}`
  - New components: `04-implementation/testing-quality/new-test-files/`
  - Main Agent: `main-agent/tests/*.py`

### Performance Validation
Bundle optimization is critical - verify these remain intact:
- Dashboard pages use `dynamic()` imports for heavy components
- Icons use `OptimizedIcon` component (not individual imports)
- Lazy loading components have proper loading states
- Build output shows optimized bundle sizes (target: <200kB)
- Virtual scrolling implemented for large datasets
- Hardware acceleration used for animations (transform/opacity only)

### Main Agent RIX Compliance Check
Verify the Main Agent remains RIX-compliant:
```bash
# These dependencies must NOT be present:
grep -r "openai\|tiktoken" main-agent/requirements.txt  # Should return nothing
# MCP endpoints must be configured:
grep -r "MCP_.*_ENDPOINT" main-agent/app/core/config.py  # Should show MCP endpoints
```

## Critical Architecture Notes

### RIX Compliance Requirements
- **Main Agent MUST NOT contain direct LLM integration**
- **Pattern-based intent recognition only** (no LLM calls for routing)
- **All AI processing happens in N8N MCP subagents**
- **Main Agent handles context management and routing only**

### Mock Development Mode
Both services support mock modes for development without external dependencies:
- Frontend mock auth bypasses database requirements
- Main Agent mock N8N simulates workflow responses
- Shared JWT compatibility maintained in mock mode

### Performance Standards
- **Bundle Size**: <200kB total (achieved: 165-180kB)
- **First Contentful Paint**: <1.5s (achieved: 1.3s)
- **Time to Interactive**: <3.5s (achieved: 2.9s)
- **Memory Usage**: <150MB (achieved: 135MB)
- **Animation Performance**: 60fps maintained
- **Touch Response**: <100ms latency

## Key Architecture Patterns

### Component Organization
```
src/components/
├── navigation/           # Sidebar and mobile navigation
│   ├── enhanced-sidebar.tsx
│   ├── mobile-navigation.tsx
│   └── __tests__/       # Component tests
├── ui/                  # shadcn/ui + custom components
│   ├── theme-toggle.tsx
│   ├── __tests__/
│   └── ...
├── mobile/              # Mobile-specific optimizations
├── chat/                # Chat interface components
└── layout/              # Layout containers

01-implementation/       # Recent feature implementations
├── ai-sphere/          # Floating AI sphere components
├── task-improvements/  # Enhanced task management
├── color-refinement/   # Unified color system
└── mobile-optimization/ # Mobile enhancements

05-implementation/      # Performance optimizations
└── performance-optimization/
    └── optimized-components/  # Performance-enhanced components
```

### State Management Pattern
All Zustand stores follow consistent patterns:
- Persistent storage with localStorage
- Immutable state updates
- Helper functions and computed values
- TypeScript interfaces for type safety
- Test coverage for state logic

### Testing Strategy
- **Component Tests**: UI behavior and user interactions
- **State Tests**: Store logic and persistence
- **Hook Tests**: Custom hook functionality
- **Integration Tests**: Cross-component behavior
- **Mobile Tests**: Touch interactions and responsive behavior
- **Voice Tests**: Web Speech API integration and fallback
- **Performance Tests**: Bundle size, loading times, memory usage

### Performance Patterns
- Dynamic imports for icons and heavy components
- Code splitting at page and component level
- Hardware-accelerated animations (transform, opacity)
- CSS custom properties for theme switching
- Bundle analysis and optimization monitoring
- Virtual scrolling for large datasets
- Progressive component loading based on user behavior

The system is production-ready with comprehensive testing, mobile optimization, performance optimization (30-39% bundle reduction), and RIX PRD architectural compliance.