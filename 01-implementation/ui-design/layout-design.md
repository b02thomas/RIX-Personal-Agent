# Layout Design Specifications

## Current State Analysis
The current dashboard has:
- 8 module cards in a grid layout (too many distractions)
- 4 stats cards at the top
- Header with user info and logout
- No central chat focus

## New Chat-Focused Layout

### Desktop Layout (≥1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ Header (60px) - RIX Dashboard + User + Logout               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │                         │ │                             │ │
│ │                         │ │   Sidebar Stats (25%)       │ │
│ │   Central Chat (60%)    │ │                             │ │
│ │                         │ │ ┌─────────────────────────┐ │ │
│ │                         │ │ │ Active Projects (3)     │ │ │
│ │                         │ │ ├─────────────────────────┤ │ │
│ │                         │ │ │ Today's Tasks (7)       │ │ │
│ │                         │ │ ├─────────────────────────┤ │ │
│ │                         │ │ │ Productivity (85%)      │ │ │
│ │                         │ │ ├─────────────────────────┤ │ │
│ │                         │ │ │ Quick Actions           │ │ │
│ │                         │ │ │ - Projects              │ │ │
│ │                         │ │ │ - Tasks                 │ │ │
│ │                         │ │ │ - Calendar              │ │ │
│ │                         │ │ └─────────────────────────┘ │ │
│ │                         │ │                             │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ Bottom spacing (24px)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Tablet Layout (768px - 1023px)
```
┌───────────────────────────────────────────────────────┐
│ Header (60px)                                         │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌─────────────────────────┐ │
│ │                       │ │                         │ │
│ │   Central Chat (65%)  │ │  Sidebar Stats (35%)    │ │
│ │                       │ │                         │ │
│ │                       │ │ Key metrics in vertical │ │
│ │                       │ │ stack with touch targets│ │
│ │                       │ │                         │ │
│ └───────────────────────┘ └─────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌───────────────────────────────────────┐
│ Header (simplified, 56px)             │
├───────────────────────────────────────┤
│ Stats Cards (horizontal scroll, 80px) │
├───────────────────────────────────────┤
│                                       │
│                                       │
│         Central Chat (100%)           │
│                                       │
│                                       │
└───────────────────────────────────────┘
```

## Layout Specifications

### Grid System
- **Desktop**: CSS Grid with `grid-template-columns: 3fr 1fr` (60% / 25% + gaps)
- **Tablet**: CSS Grid with `grid-template-columns: 2fr 1fr` (65% / 35%)
- **Mobile**: Single column, full width

### Spacing & Measurements
- Container max-width: 1400px
- Container padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Gap between sections: 24px (desktop), 16px (mobile)
- Chat area min-height: calc(100vh - 200px)
- Sidebar fixed width: 320px (desktop), 280px (tablet)

### Key Layout Rules
1. **Chat Priority**: Chat area always takes primary visual focus
2. **Sidebar Collapse**: Sidebar can collapse to icon-only on smaller screens
3. **Mobile First**: Progressive enhancement from mobile to desktop
4. **Fixed Chat**: Chat area maintains consistent height and position
5. **Responsive Stats**: Stats cards adapt from grid to horizontal scroll

### Performance Considerations
- Use CSS Grid for main layout (better performance than Flexbox for 2D layouts)
- Implement `will-change: transform` for smooth animations
- Use `contain: layout style` for isolated sections