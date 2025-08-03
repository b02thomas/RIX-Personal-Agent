# Responsive Behavior Specification

## Overview
Comprehensive responsive design specifications for RIX Personal Agent, ensuring optimal user experience across all device sizes. The system follows a mobile-first approach with progressive enhancement for larger screens.

## Breakpoint System

### Defined Breakpoints
```css
/* RIX Responsive Breakpoints */
:root {
  --breakpoint-sm: 640px;   /* Large phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small laptops */
  --breakpoint-xl: 1280px;  /* Desktop */
  --breakpoint-2xl: 1536px; /* Large desktop */
}

/* Mobile-first media queries */
@media (min-width: 640px) { /* sm+ */ }
@media (min-width: 768px) { /* md+ */ }
@media (min-width: 1024px) { /* lg+ */ }
@media (min-width: 1280px) { /* xl+ */ }
@media (min-width: 1536px) { /* 2xl+ */ }
```

### Device Categories
- **Mobile**: 320px - 767px (Portrait phones, small landscape phones)
- **Tablet**: 768px - 1023px (iPads, Android tablets, large phones landscape)
- **Desktop**: 1024px+ (Laptops, desktops, large screens)

## Navigation Responsive Behavior

### Mobile (< 768px) - Bottom Navigation + Drawer

#### Bottom Navigation Bar
```css
.rix-mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: var(--rix-bg-secondary);
  border-top: 1px solid var(--rix-border-primary);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: env(safe-area-inset-bottom) 0 0 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

/* Safe area handling for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
  .rix-mobile-nav {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(72px + env(safe-area-inset-bottom));
  }
}

.rix-mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--rix-text-tertiary);
  text-decoration: none;
  transition: all 200ms ease;
  padding: 8px 4px;
  min-height: 44px;
  position: relative;
}

.rix-mobile-nav-item--active {
  color: var(--rix-accent-primary);
}

.rix-mobile-nav-item--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  background: var(--rix-accent-primary);
  border-radius: 0 0 3px 3px;
}

.rix-mobile-nav-item__icon {
  width: 20px;
  height: 20px;
  transition: transform 150ms ease;
}

.rix-mobile-nav-item--active .rix-mobile-nav-item__icon {
  transform: scale(1.1);
}

.rix-mobile-nav-item__label {
  font-size: 0.625rem;
  font-weight: 500;
  text-align: center;
  line-height: 1;
  margin-top: 1px;
}

/* Badge for notifications */
.rix-mobile-nav-item__badge {
  position: absolute;
  top: 6px;
  right: 12px;
  width: 18px;
  height: 18px;
  background: var(--rix-error);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 600;
  border: 2px solid var(--rix-bg-secondary);
}
```

#### Mobile Primary Navigation Items
```
Dashboard  |  Projekte  |  Tasks  |  Kalender  |  Mehr
   📊      |     📁     |   ☑️    |    📅     |  ☰
```

#### Mobile Drawer Menu
```css
.rix-mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--rix-bg-secondary);
  border-right: 1px solid var(--rix-border-primary);
  transform: translateX(-100%);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.rix-mobile-drawer--open {
  transform: translateX(0);
}

.rix-mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 250ms ease;
  z-index: 99;
  backdrop-filter: blur(2px);
}

.rix-mobile-drawer-overlay--visible {
  opacity: 1;
  visibility: visible;
}

/* Drawer header */
.rix-mobile-drawer-header {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--rix-border-primary);
  margin-bottom: 16px;
}

.rix-mobile-drawer-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rix-text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.rix-mobile-drawer-close:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
}

/* Drawer navigation items */
.rix-mobile-drawer-nav {
  padding: 0 8px;
}

.rix-mobile-drawer-nav-item {
  height: 48px;
  padding: 12px 16px;
  margin: 2px 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--rix-text-secondary);
  text-decoration: none;
  transition: all 150ms ease;
  cursor: pointer;
  min-height: 44px;
}

.rix-mobile-drawer-nav-item:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
}

.rix-mobile-drawer-nav-item--active {
  background: var(--rix-accent-primary);
  color: white;
}

.rix-mobile-drawer-nav-item__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.rix-mobile-drawer-nav-item__label {
  font-size: 0.9375rem;
  font-weight: 500;
}
```

#### Mobile Main Content Adjustment
```css
.rix-main-content--mobile {
  margin-left: 0;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
  min-height: 100vh;
}

.rix-main-content--mobile .rix-page-header {
  padding: 16px;
  position: sticky;
  top: 0;
  background: var(--rix-bg-primary);
  border-bottom: 1px solid var(--rix-border-primary);
  z-index: 10;
  backdrop-filter: blur(10px);
}
```

### Tablet (768px - 1023px) - Hover-Expandable Sidebar

#### Collapsed Sidebar Default
```css
/* Tablet sidebar defaults to collapsed */
@media (min-width: 768px) and (max-width: 1023px) {
  .rix-sidebar {
    width: var(--sidebar-width-collapsed, 64px);
    transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .rix-main-content {
    margin-left: var(--sidebar-width-collapsed, 64px);
    transition: margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Hide bottom navigation on tablet */
  .rix-mobile-nav {
    display: none;
  }
}

/* Hover expansion for tablet */
.rix-sidebar:hover {
  width: var(--sidebar-width-expanded, 280px);
  z-index: 60;
  box-shadow: var(--shadow-lg);
}

/* Overlay when sidebar expands on tablet */
.rix-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 64px;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 59;
  opacity: 0;
  visibility: hidden;
  transition: all 200ms ease;
}

.rix-sidebar:hover + .rix-sidebar-overlay {
  opacity: 1;
  visibility: visible;
}

/* Tablet touch optimizations */
.rix-nav-item {
  min-height: 48px;
  padding: 12px;
}

.rix-nav-item__icon {
  width: 22px;
  height: 22px;
}
```

#### Tablet-Specific Navigation Behavior
```css
/* Show tooltips for collapsed items on tablet */
.rix-nav-item-tooltip {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--rix-surface);
  color: var(--rix-text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--rix-border-primary);
  opacity: 0;
  visibility: hidden;
  transition: all 150ms ease;
  z-index: 70;
}

.rix-nav-item:hover .rix-nav-item-tooltip {
  opacity: 1;
  visibility: visible;
}

/* Only show tooltips when sidebar is collapsed */
.rix-sidebar--expanded .rix-nav-item-tooltip {
  display: none;
}
```

### Desktop (1024px+) - Full Sidebar Experience

#### Desktop Sidebar Behavior
```css
@media (min-width: 1024px) {
  .rix-sidebar {
    width: var(--sidebar-width-expanded, 280px);
    position: relative;
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .rix-main-content {
    margin-left: var(--sidebar-width-expanded, 280px);
    transition: margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* User can toggle to collapsed state */
  .rix-sidebar--collapsed {
    width: var(--sidebar-width-collapsed, 64px);
  }
  
  .rix-main-content--sidebar-collapsed {
    margin-left: var(--sidebar-width-collapsed, 64px);
  }
  
  /* Hide mobile navigation completely */
  .rix-mobile-nav {
    display: none;
  }
  
  /* Enhanced hover effects for desktop */
  .rix-nav-item:hover {
    transform: translateX(2px);
  }
  
  .rix-nav-submenu-item:hover {
    transform: translateX(1px);
  }
}

/* Desktop-specific sidebar enhancements */
.rix-sidebar-resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 150ms ease;
}

.rix-sidebar-resize-handle:hover {
  background: var(--rix-accent-primary);
}
```

## Component Responsive Specifications

### Dashboard Widgets Grid
```css
/* Mobile: Single column */
.rix-dashboard-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .rix-dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 24px;
  }
}

/* Desktop: 3-4 columns based on widget size */
@media (min-width: 1024px) {
  .rix-dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    padding: 32px;
  }
  
  /* Large widgets span multiple columns */
  .rix-dashboard-widget--large {
    grid-column: span 2;
  }
  
  .rix-dashboard-widget--xlarge {
    grid-column: span 3;
  }
}

/* Extra large desktop: 4+ columns */
@media (min-width: 1536px) {
  .rix-dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    max-width: 1600px;
    margin: 0 auto;
  }
}
```

### Routine Boxes Layout
```css
/* Mobile: Single column, smaller cards */
.rix-routines-grid {
  display: grid;
  gap: 12px;
  padding: 16px;
  grid-template-columns: 1fr;
}

.rix-routine-box {
  min-height: 140px;
  padding: 16px;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .rix-routines-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 24px;
  }
  
  .rix-routine-box {
    min-height: 160px;
    padding: 18px;
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .rix-routines-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 32px;
  }
  
  .rix-routine-box {
    min-height: 180px;
    padding: 20px;
  }
}

/* Large desktop: 4 columns */
@media (min-width: 1400px) {
  .rix-routines-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Project Cards Layout
```css
/* Mobile: Single column */
.rix-projects-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .rix-projects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 24px;
  }
}

/* Desktop: 3 columns with featured projects spanning 2 */
@media (min-width: 1024px) {
  .rix-projects-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 32px;
  }
  
  .rix-project-card--featured {
    grid-column: span 2;
  }
}

/* Large desktop: 4 columns */
@media (min-width: 1536px) {
  .rix-projects-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .rix-project-card--featured {
    grid-column: span 2;
  }
}
```

### Calendar Time Blocks
```css
/* Mobile: Stack time blocks vertically */
.rix-calendar-view {
  padding: 16px;
}

.rix-calendar-day {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
}

.rix-calendar-time-block {
  min-height: 60px;
  padding: 10px;
}

/* Tablet: Show more time slots side by side */
@media (min-width: 768px) {
  .rix-calendar-view {
    padding: 24px;
  }
  
  .rix-calendar-day {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .rix-calendar-time-block {
    min-height: 70px;
    padding: 12px;
  }
  
  /* Long blocks span full width */
  .rix-calendar-time-block--long {
    grid-column: span 2;
  }
}

/* Desktop: Full week view with hourly blocks */
@media (min-width: 1024px) {
  .rix-calendar-view {
    padding: 32px;
  }
  
  .rix-calendar-week {
    display: grid;
    grid-template-columns: 60px repeat(7, 1fr);
    gap: 1px;
    background: var(--rix-border-primary);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .rix-calendar-time-label {
    background: var(--rix-bg-secondary);
    padding: 8px;
    font-size: 0.75rem;
    color: var(--rix-text-tertiary);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .rix-calendar-day-column {
    background: var(--rix-surface);
    min-height: 80px;
  }
  
  .rix-calendar-time-block {
    border: none;
    border-radius: 0;
    margin: 1px;
  }
}
```

## Typography Responsive Scaling

### Font Size Scaling
```css
/* Mobile font sizes */
.rix-text-display { font-size: 2rem; }      /* 32px */
.rix-text-h1 { font-size: 1.75rem; }        /* 28px */
.rix-text-h2 { font-size: 1.5rem; }         /* 24px */
.rix-text-h3 { font-size: 1.25rem; }        /* 20px */
.rix-text-h4 { font-size: 1.125rem; }       /* 18px */
.rix-text-body { font-size: 0.9375rem; }    /* 15px */
.rix-text-small { font-size: 0.8125rem; }   /* 13px */
.rix-text-caption { font-size: 0.75rem; }   /* 12px */

/* Tablet font sizes */
@media (min-width: 768px) {
  .rix-text-display { font-size: 2.5rem; }    /* 40px */
  .rix-text-h1 { font-size: 2rem; }           /* 32px */
  .rix-text-h2 { font-size: 1.75rem; }        /* 28px */
  .rix-text-h3 { font-size: 1.375rem; }       /* 22px */
  .rix-text-h4 { font-size: 1.25rem; }        /* 20px */
  .rix-text-body { font-size: 1rem; }         /* 16px */
  .rix-text-small { font-size: 0.875rem; }    /* 14px */
  .rix-text-caption { font-size: 0.75rem; }   /* 12px */
}

/* Desktop font sizes (as defined in brand guidelines) */
@media (min-width: 1024px) {
  .rix-text-display { font-size: 3rem; }      /* 48px */
  .rix-text-h1 { font-size: 2.25rem; }        /* 36px */
  .rix-text-h2 { font-size: 1.875rem; }       /* 30px */
  .rix-text-h3 { font-size: 1.5rem; }         /* 24px */
  .rix-text-h4 { font-size: 1.25rem; }        /* 20px */
  .rix-text-body { font-size: 1rem; }         /* 16px */
  .rix-text-small { font-size: 0.875rem; }    /* 14px */
  .rix-text-caption { font-size: 0.75rem; }   /* 12px */
}
```

### Line Height Adjustments
```css
/* Mobile: Tighter line heights for space efficiency */
@media (max-width: 767px) {
  .rix-text-display { line-height: 1.1; }
  .rix-text-h1 { line-height: 1.2; }
  .rix-text-h2 { line-height: 1.25; }
  .rix-text-body { line-height: 1.4; }
}

/* Desktop: Standard line heights (as defined in brand guidelines) */
@media (min-width: 1024px) {
  .rix-text-display { line-height: 1.2; }
  .rix-text-h1 { line-height: 1.25; }
  .rix-text-h2 { line-height: 1.33; }
  .rix-text-body { line-height: 1.5; }
}
```

## Spacing Responsive Scaling

### Container Padding
```css
/* Mobile: Compact spacing */
.rix-container {
  padding: 16px;
  max-width: 100%;
}

.rix-section {
  margin-bottom: 24px;
}

.rix-component {
  padding: 12px;
  margin-bottom: 16px;
}

/* Tablet: Medium spacing */
@media (min-width: 768px) {
  .rix-container {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .rix-section {
    margin-bottom: 32px;
  }
  
  .rix-component {
    padding: 16px;
    margin-bottom: 20px;
  }
}

/* Desktop: Full spacing system */
@media (min-width: 1024px) {
  .rix-container {
    padding: 32px;
    max-width: 1400px;
  }
  
  .rix-section {
    margin-bottom: 48px;
  }
  
  .rix-component {
    padding: 20px;
    margin-bottom: 24px;
  }
}

/* Large desktop: Maximum spacing */
@media (min-width: 1536px) {
  .rix-container {
    padding: 48px;
    max-width: 1600px;
  }
  
  .rix-section {
    margin-bottom: 64px;
  }
}
```

### Gap Systems for Grids
```css
/* Mobile: Tight gaps */
.rix-grid {
  gap: 12px;
}

.rix-flex {
  gap: 8px;
}

/* Tablet: Medium gaps */
@media (min-width: 768px) {
  .rix-grid {
    gap: 16px;
  }
  
  .rix-flex {
    gap: 12px;
  }
}

/* Desktop: Full gaps */
@media (min-width: 1024px) {
  .rix-grid {
    gap: 24px;
  }
  
  .rix-flex {
    gap: 16px;
  }
}
```

## Touch & Interaction Responsive Behavior

### Touch Target Sizing
```css
/* Mobile: Large touch targets */
@media (max-width: 767px) {
  .rix-btn,
  .rix-nav-item,
  .rix-touch-target {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
  }
  
  /* Increase spacing between touch targets */
  .rix-btn + .rix-btn {
    margin-left: 12px;
  }
}

/* Tablet: Medium touch targets */
@media (min-width: 768px) and (max-width: 1023px) {
  .rix-btn,
  .rix-nav-item,
  .rix-touch-target {
    min-height: 40px;
    min-width: 40px;
    padding: 10px;
  }
}

/* Desktop: Standard targets */
@media (min-width: 1024px) {
  .rix-btn,
  .rix-nav-item {
    min-height: 36px;
    padding: 8px 12px;
  }
}
```

### Hover States Management
```css
/* Only show hover effects on devices that support hover */
@media (hover: hover) and (pointer: fine) {
  .rix-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  .rix-btn:hover {
    background: var(--rix-accent-hover);
  }
  
  .rix-nav-item:hover {
    background: var(--rix-surface);
  }
}

/* Touch devices: Use active states instead of hover */
@media (hover: none) and (pointer: coarse) {
  .rix-card:active {
    transform: scale(0.98);
  }
  
  .rix-btn:active {
    background: var(--rix-accent-hover);
    transform: scale(0.95);
  }
  
  .rix-nav-item:active {
    background: var(--rix-surface);
  }
}
```

## Animation Performance Optimization

### Reduced Motion Support
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential functionality animations */
  .rix-loading-spinner {
    animation: none;
  }
  
  .rix-loading-spinner::after {
    content: '...';
  }
}

/* GPU acceleration for better performance */
@media (min-width: 1024px) {
  .rix-card,
  .rix-nav-item,
  .rix-btn {
    will-change: transform;
    transform: translateZ(0);
  }
}
```

### Device-Specific Optimizations
```css
/* iOS Safari optimizations */
@supports (-webkit-touch-callout: none) {
  .rix-sidebar {
    -webkit-overflow-scrolling: touch;
  }
  
  .rix-main-content {
    -webkit-overflow-scrolling: touch;
  }
  
  /* Prevent zoom on input focus */
  input, textarea, select {
    font-size: 16px;
  }
}

/* Android Chrome optimizations */
@media screen and (-webkit-min-device-pixel-ratio: 1.5) {
  .rix-icon {
    image-rendering: -webkit-optimize-contrast;
  }
}
```

## Progressive Enhancement Strategy

### Core Experience (All Devices)
- Basic navigation functionality
- Essential content display
- Form interactions
- Core user flows

### Enhanced Experience (Tablet+)
- Hover effects
- Tooltips
- Sidebar expansion
- Advanced animations

### Premium Experience (Desktop+)
- Multi-column layouts
- Advanced interactions
- Keyboard shortcuts
- Drag and drop functionality

## Testing Breakpoints

### Device Testing Matrix
```
Mobile Devices:
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPhone 12 Pro Max (428x926)
- Samsung Galaxy S21 (360x800)
- Samsung Galaxy S21+ (384x854)

Tablet Devices:
- iPad (768x1024)
- iPad Air (820x1180)
- iPad Pro 11" (834x1194)
- iPad Pro 12.9" (1024x1366)
- Surface Pro (912x1368)

Desktop Devices:
- MacBook Air (1280x832)
- MacBook Pro 14" (1512x982)
- MacBook Pro 16" (1728x1117)
- iMac 24" (1920x1080)
- Studio Display (2560x1440)
```

This comprehensive responsive behavior specification ensures RIX Personal Agent provides an optimal user experience across all device categories while maintaining performance and accessibility standards.