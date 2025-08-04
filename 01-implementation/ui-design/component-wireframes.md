# Component Wireframes & Layout Details

## Main Dashboard Components

### 1. Dashboard Header Component
```
┌─────────────────────────────────────────────────────────────┐
│ [RIX Logo] RIX Dashboard        [User Avatar] user@email.com │
│                                           [Logout Button]   │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 60px
- Background: var(--background-dark)
- Border bottom: 1px solid var(--border-color)
- Logo: 32px height, brand blue color
- User section: Right-aligned flex with 16px gap
- Logout button: Outline variant, 36px height

### 2. Central Chat Container
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─ Chat Header ─────────────────────────────────────────────┐ │
│ │ Chat with RIX                    [+] [Trash] [Settings]  │ │
│ │ Your personal AI assistant                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ Message Area ───────────────────────────────────────────┐ │
│ │                                                         │ │
│ │  [Messages scroll area - flexible height]              │ │
│ │                                                         │ │
│ │  > User message bubble (right aligned)                  │ │
│ │  < AI response bubble (left aligned)                    │ │
│ │                                                         │ │
│ │  [Typing indicator when AI is responding]               │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ Input Area ─────────────────────────────────────────────┐ │
│ │ [🎤] [Text input field.....................] [Send →]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: var(--card-background)
- Border radius: 8px
- Border: 1px solid var(--border-color)
- Padding: 0 (handled by internal components)
- Min-height: 600px
- Max-height: calc(100vh - 140px)

### 3. Sidebar Stats Container
```
┌─────────────────────────────────┐
│ ┌─ Active Projects ───────────┐ │
│ │ 🧠 3 Projects               │ │
│ │ • Project Alpha (85%)       │ │
│ │ • Project Beta (70%)        │ │
│ │ • Project Gamma (95%)       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Today's Tasks ─────────────┐ │
│ │ ✓ 7 Open Tasks              │ │
│ │ • High Priority (2)         │ │
│ │ • Medium Priority (3)       │ │
│ │ • Low Priority (2)          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Productivity ──────────────┐ │
│ │ 📊 85% Today                │ │
│ │ ████████░░ 85%              │ │
│ │ +5% from yesterday          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Quick Actions ─────────────┐ │
│ │ [Projects]  [Tasks]         │ │
│ │ [Calendar]  [Settings]      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Specifications:**
- Background: Transparent
- Gap between cards: 16px
- Each card: var(--card-background), 8px border radius
- Padding per card: 16px
- Quick action buttons: 44px height for touch targets

## Mobile Component Adaptations

### Mobile Stats Bar (Horizontal Scroll)
```
┌─────────────────────────────────────────────────────────────┐
│ [🧠 3 Projects] [✓ 7 Tasks] [📊 85%] [📅 0 Today] → scroll │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 80px
- Horizontal scroll with snap points
- Each stat: 120px width, 64px height
- Gap: 12px
- Touch-friendly swipe gestures

### Mobile Chat (Full Screen)
```
┌─────────────────────────────────────┐
│ ┌─ Chat Header (Simplified) ──────┐ │
│ │ RIX              [⚙️] [📞]     │ │
│ └─────────────────────────────────┘ │
│ ┌─ Messages (Expanded) ───────────┐ │
│ │                                 │ │
│ │        [Messages take]          │ │
│ │        [most of screen]         │ │
│ │        [space here]             │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ┌─ Input (Fixed Bottom) ──────────┐ │
│ │ [🎤] [Type message...] [Send]   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Component Hierarchy

```
DashboardPage
├── DashboardHeader
├── MainContent (CSS Grid)
│   ├── ChatSection (grid-area: chat)
│   │   └── ChatContainer
│   │       ├── ChatHeader
│   │       ├── MessageArea
│   │       │   ├── MessageList
│   │       │   └── TypingIndicator
│   │       └── InputArea
│   │           ├── VoiceRecorder
│   │           ├── TextInput
│   │           └── SendButton
│   └── SidebarSection (grid-area: sidebar)
│       ├── StatsCard (Projects)
│       ├── StatsCard (Tasks)
│       ├── StatsCard (Productivity)
│       └── QuickActions
└── MobileStatsBar (mobile only)
```

## Responsive Breakpoints

### Component Visibility Rules
- **Desktop (≥1024px)**: Show all components in grid layout
- **Tablet (768-1023px)**: Show grid with narrower sidebar
- **Mobile (<768px)**: 
  - Hide sidebar section
  - Show mobile stats bar
  - Chat takes full width
  - Simplified header

### Component State Management
Each component should handle its own loading and error states:
- **Loading**: Skeleton placeholders with pulse animation
- **Error**: Error boundary with retry button
- **Empty**: Helpful empty states with call-to-action