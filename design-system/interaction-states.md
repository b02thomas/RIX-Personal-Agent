# RIX Personal Agent - Interaction States Specification

## Overview
Comprehensive interaction states specification for RIX Personal Agent, defining hover, focus, active, disabled, and loading states for all interface elements. This specification ensures consistent user feedback and accessibility compliance across the entire application.

## State Design Philosophy

### Core Principles
1. **Immediate Feedback**: Every interaction provides instant visual response
2. **Predictable Behavior**: States behave consistently across all components
3. **Accessible Design**: All states meet WCAG 2.1 AA accessibility standards
4. **Performance Optimized**: Smooth transitions that maintain 60fps
5. **Progressive Enhancement**: Graceful degradation for reduced motion preferences

### State Hierarchy
```
Default → Hover → Focus → Active → Processing → Success/Error
                ↓
            Disabled (terminal state)
```

## Universal Interaction States

### Global State Variables
```css
/* Universal interaction state variables */
:root {
  /* Timing */
  --state-transition-fast: 150ms;
  --state-transition-normal: 200ms;
  --state-transition-slow: 300ms;
  
  /* Easing */
  --state-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --state-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Opacity States */
  --state-opacity-disabled: 0.5;
  --state-opacity-loading: 0.7;
  --state-opacity-hover: 0.9;
  
  /* Transform States */
  --state-scale-hover: 1.02;
  --state-scale-active: 0.98;
  --state-translate-hover: -2px;
  --state-translate-active: 0px;
  
  /* Color Overlays */
  --state-overlay-hover: rgba(255, 255, 255, 0.05);
  --state-overlay-focus: rgba(96, 165, 250, 0.1);
  --state-overlay-active: rgba(0, 0, 0, 0.05);
  --state-overlay-disabled: rgba(128, 128, 128, 0.3);
}
```

### Base Interaction Classes
```css
/* Universal interactive element base */
.rix-interactive {
  position: relative;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    border-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing),
    opacity var(--state-transition-fast) var(--state-easing);
  will-change: transform, opacity, background-color;
  cursor: pointer;
}

.rix-interactive:disabled,
.rix-interactive[aria-disabled="true"] {
  opacity: var(--state-opacity-disabled);
  cursor: not-allowed;
  pointer-events: none;
}

/* Hover state base */
.rix-interactive:hover:not(:disabled):not([aria-disabled="true"]) {
  transform: translateY(var(--state-translate-hover));
}

/* Focus state base */
.rix-interactive:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Active state base */
.rix-interactive:active:not(:disabled):not([aria-disabled="true"]) {
  transform: translateY(var(--state-translate-active)) scale(var(--state-scale-active));
}

/* Loading state base */
.rix-interactive.rix-loading {
  opacity: var(--state-opacity-loading);
  pointer-events: none;
  position: relative;
}

.rix-interactive.rix-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--rix-surface)/80;
  backdrop-filter: blur(1px);
  border-radius: inherit;
  z-index: 10;
}
```

## Sidebar Navigation States

### Navigation Item States
```css
/* Default state */
.rix-nav-item {
  background: transparent;
  color: var(--rix-text-secondary);
  border-radius: 8px;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing);
  position: relative;
  overflow: hidden;
}

/* Hover state */
.rix-nav-item:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
  transform: translateX(2px);
}

.rix-nav-item:hover::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--rix-accent-primary);
  transform: scaleY(1);
  transition: transform var(--state-transition-fast) var(--state-easing);
}

/* Focus state */
.rix-nav-item:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
  background: var(--rix-surface);
}

/* Active state */
.rix-nav-item.rix-nav-item--active {
  background: var(--rix-accent-primary);
  color: white;
  transform: translateX(0);
}

.rix-nav-item.rix-nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgba(255, 255, 255, 0.3);
  transform: scaleY(1);
}

/* Icon state changes */
.rix-nav-item__icon {
  transition: 
    transform var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing);
}

.rix-nav-item:hover .rix-nav-item__icon {
  transform: scale(1.1);
}

.rix-nav-item--active .rix-nav-item__icon {
  color: white;
}

/* Expand icon states */
.rix-nav-item__expand-icon {
  transition: transform var(--state-transition-normal) var(--state-easing);
}

.rix-nav-item--expanded .rix-nav-item__expand-icon {
  transform: rotate(90deg);
}

.rix-nav-item:hover .rix-nav-item__expand-icon {
  color: var(--rix-accent-primary);
}

/* Collapsed sidebar states */
.rix-sidebar--collapsed .rix-nav-item {
  justify-content: center;
  padding: 12px;
}

.rix-sidebar--collapsed .rix-nav-item:hover {
  transform: translateX(0) scale(1.05);
}

/* Submenu item states */
.rix-nav-submenu-item {
  background: transparent;
  color: var(--rix-text-tertiary);
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    padding-left var(--state-transition-fast) var(--state-easing);
}

.rix-nav-submenu-item:hover {
  background: var(--rix-surface);
  color: var(--rix-text-secondary);
  padding-left: 12px;
}

.rix-nav-submenu-item--active {
  background: var(--rix-accent-primary)/10;
  color: var(--rix-accent-primary);
  border-left: 2px solid var(--rix-accent-primary);
}
```

### Sidebar Toggle States
```css
.rix-sidebar-toggle {
  background: transparent;
  color: var(--rix-text-secondary);
  border-radius: 6px;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing);
}

.rix-sidebar-toggle:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
  transform: scale(1.05);
}

.rix-sidebar-toggle:active {
  transform: scale(0.95);
  background: var(--rix-accent-primary)/10;
}

.rix-sidebar-toggle:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}
```

## Project Card States

### Card Container States
```css
/* Default state */
.rix-project-card {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  transition: 
    border-color var(--state-transition-normal) var(--state-easing),
    box-shadow var(--state-transition-normal) var(--state-easing),
    transform var(--state-transition-normal) var(--state-easing),
    background-color var(--state-transition-normal) var(--state-easing);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* Hover state */
.rix-project-card:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: 
    var(--shadow-lg),
    0 0 0 1px var(--rix-accent-primary)/20;
  transform: translateY(-4px) scale(1.01);
}

.rix-project-card:hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--state-overlay-hover);
  pointer-events: none;
  z-index: 1;
  transition: opacity var(--state-transition-fast) var(--state-easing);
}

/* Focus state */
.rix-project-card:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
  border-color: var(--rix-accent-primary);
}

/* Active state */
.rix-project-card:active {
  transform: translateY(-2px) scale(1.005);
  box-shadow: var(--shadow-md);
}

/* Featured/Priority state */
.rix-project-card--featured {
  border: 2px solid var(--rix-accent-primary);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(96, 165, 250, 0.02) 100%);
}

.rix-project-card--featured:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: 
    var(--shadow-xl),
    0 0 0 3px var(--rix-accent-primary)/30;
}

/* Loading state */
.rix-project-card.rix-loading {
  pointer-events: none;
  opacity: var(--state-opacity-loading);
}

.rix-project-card.rix-loading .rix-project-header,
.rix-project-card.rix-loading .rix-project-progress,
.rix-project-card.rix-loading .rix-project-team {
  opacity: 0.5;
}

/* Error state */
.rix-project-card--error {
  border-color: var(--rix-error);
  background: var(--rix-error)/5;
}

.rix-project-card--error:hover {
  border-color: var(--rix-error);
  box-shadow: 
    var(--shadow-lg),
    0 0 0 1px var(--rix-error)/20;
}
```

### AI Status Indicator States
```css
/* Default AI status */
.rix-ai-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
  transition: 
    transform var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing);
}

/* Active AI status */
.rix-ai-status--active {
  background: var(--rix-success);
  animation: rix-ai-status-pulse 2s infinite var(--state-easing);
}

.rix-ai-status--active:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px var(--rix-success)/20;
}

/* Inactive AI status */
.rix-ai-status--inactive {
  background: var(--rix-text-quaternary);
}

.rix-ai-status--inactive:hover {
  background: var(--rix-text-tertiary);
  transform: scale(1.1);
}

/* Processing AI status */
.rix-ai-status--processing {
  background: var(--rix-warning);
  animation: rix-spin 1s linear infinite;
}

/* Error AI status */
.rix-ai-status--error {
  background: var(--rix-error);
  animation: rix-error-pulse 1s infinite;
}

@keyframes rix-error-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Priority Badge States
```css
/* Base priority badge */
.rix-priority-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  transition: 
    transform var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing);
  cursor: default;
}

.rix-priority-badge:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Priority levels */
.rix-priority-badge--low {
  background: var(--rix-text-quaternary)/20;
  color: var(--rix-text-quaternary);
}

.rix-priority-badge--medium {
  background: var(--rix-warning)/20;
  color: var(--rix-warning);
}

.rix-priority-badge--high {
  background: var(--rix-error)/20;
  color: var(--rix-error);
}

.rix-priority-badge--urgent {
  background: var(--rix-error);
  color: white;
  animation: rix-urgent-pulse 1.5s infinite var(--state-easing);
}

.rix-priority-badge--urgent:hover {
  animation-play-state: paused;
  transform: translateY(-1px) scale(1.05);
}
```

## Routine Box States

### Routine Container States
```css
/* Default routine box */
.rix-routine-box {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  transition: 
    border-color var(--state-transition-normal) var(--state-easing),
    box-shadow var(--state-transition-normal) var(--state-easing),
    transform var(--state-transition-normal) var(--state-easing),
    background-color var(--state-transition-normal) var(--state-easing);
  cursor: pointer;
  position: relative;
}

/* Hover state */
.rix-routine-box:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Focus state */
.rix-routine-box:focus-within {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}

/* Completion states */
.rix-routine-box--completed {
  border-color: var(--rix-success);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(52, 211, 153, 0.05) 100%);
}

.rix-routine-box--completed:hover {
  border-color: var(--rix-success);
  box-shadow: 
    var(--shadow-md),
    0 0 0 1px var(--rix-success)/20;
}

/* Overdue state */
.rix-routine-box--overdue {
  border-color: var(--rix-error);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(248, 113, 113, 0.05) 100%);
}

.rix-routine-box--overdue:hover {
  border-color: var(--rix-error);
  box-shadow: 
    var(--shadow-md),
    0 0 0 1px var(--rix-error)/20;
}

/* In progress state */
.rix-routine-box--in-progress {
  border-color: var(--rix-warning);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(251, 191, 36, 0.05) 100%);
}

/* Disabled routine */
.rix-routine-box--disabled {
  opacity: var(--state-opacity-disabled);
  cursor: not-allowed;
  pointer-events: none;
}
```

### Routine Button States
```css
/* Complete button states */
.rix-routine-btn-complete {
  background: var(--rix-success);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing);
  position: relative;
  overflow: hidden;
}

.rix-routine-btn-complete:hover {
  background: var(--rix-success)/90;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.rix-routine-btn-complete:active {
  transform: translateY(0) scale(0.98);
  box-shadow: var(--shadow-sm);
}

.rix-routine-btn-complete:focus-visible {
  outline: 2px solid var(--rix-success);
  outline-offset: 2px;
}

.rix-routine-btn-complete:disabled {
  background: var(--rix-text-quaternary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Success state animation */
.rix-routine-btn-complete--success {
  animation: rix-button-success var(--state-transition-slow) var(--state-easing);
}

/* Loading state for complete button */
.rix-routine-btn-complete.rix-loading {
  background: var(--rix-success)/70;
  pointer-events: none;
}

.rix-routine-btn-complete.rix-loading::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 2px solid transparent;
  border-top-color: white;
  border-radius: 4px;
  animation: rix-spin 0.8s linear infinite;
}

/* Skip button states */
.rix-routine-btn-skip {
  background: transparent;
  color: var(--rix-text-tertiary);
  border: 1px solid var(--rix-border-primary);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: 
    border-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    background-color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing);
}

.rix-routine-btn-skip:hover {
  border-color: var(--rix-accent-primary);
  color: var(--rix-accent-primary);
  background-color: var(--rix-accent-primary)/5;
  transform: translateY(-1px);
}

.rix-routine-btn-skip:active {
  transform: translateY(0) scale(0.98);
}

.rix-routine-btn-skip:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}
```

### Progress Bar States
```css
/* Progress container */
.rix-routine-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--rix-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  transition: height var(--state-transition-fast) var(--state-easing);
}

.rix-routine-progress-bar:hover {
  height: 8px;
}

/* Progress fill */
.rix-routine-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--rix-success) 0%, var(--rix-accent-primary) 100%);
  border-radius: 3px;
  transition: width var(--state-transition-slow) var(--state-easing);
  position: relative;
  overflow: hidden;
}

/* Progress fill shimmer effect */
.rix-routine-progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: rix-progress-shimmer 2s infinite;
}

@keyframes rix-progress-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Progress states */
.rix-routine-progress-fill--completed {
  background: var(--rix-success);
}

.rix-routine-progress-fill--warning {
  background: var(--rix-warning);
}

.rix-routine-progress-fill--danger {
  background: var(--rix-error);
}
```

## Theme Toggle States

### Toggle Container States
```css
.rix-theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: 14px;
  background: var(--rix-bg-secondary);
  border: 1px solid var(--rix-border-primary);
  cursor: pointer;
  transition: 
    background-color var(--state-transition-normal) var(--state-easing),
    border-color var(--state-transition-normal) var(--state-easing),
    box-shadow var(--state-transition-normal) var(--state-easing);
  display: flex;
  align-items: center;
  padding: 2px;
}

/* Hover state */
.rix-theme-toggle:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: 0 0 0 2px var(--rix-accent-primary)/10;
}

/* Focus state */
.rix-theme-toggle:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}

/* Active state */
.rix-theme-toggle:active {
  transform: scale(0.98);
}

/* Dark theme state */
.rix-theme-toggle--dark {
  background: var(--rix-accent-primary)/20;
  border-color: var(--rix-accent-primary);
}

.rix-theme-toggle--dark:hover {
  background: var(--rix-accent-primary)/30;
  box-shadow: 0 0 0 2px var(--rix-accent-primary)/20;
}

/* Switching state */
.rix-theme-toggle--switching {
  animation: rix-theme-switch-flash var(--state-transition-slow) var(--state-easing);
  pointer-events: none;
}

/* Disabled state */
.rix-theme-toggle:disabled {
  opacity: var(--state-opacity-disabled);
  cursor: not-allowed;
  pointer-events: none;
}
```

### Toggle Slider States
```css
.rix-theme-toggle-slider {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  position: absolute;
  left: 2px;
  transition: 
    transform var(--state-transition-normal) var(--state-easing-bounce),
    background-color var(--state-transition-normal) var(--state-easing),
    box-shadow var(--state-transition-normal) var(--state-easing);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

/* Dark theme slider position */
.rix-theme-toggle--dark .rix-theme-toggle-slider {
  transform: translateX(28px);
  background: var(--rix-accent-primary);
  border-color: var(--rix-accent-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

/* Hover effect on slider */
.rix-theme-toggle:hover .rix-theme-toggle-slider {
  box-shadow: var(--shadow-lg);
}

/* Active effect on slider */
.rix-theme-toggle:active .rix-theme-toggle-slider {
  transform: translateX(14px) scale(0.95);
}

.rix-theme-toggle--dark:active .rix-theme-toggle-slider {
  transform: translateX(28px) scale(0.95);
}
```

## Calendar Time Block States

### Time Block Container States
```css
/* Default time block */
.rix-calendar-time-block {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  transition: 
    border-color var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing),
    background-color var(--state-transition-fast) var(--state-easing);
  cursor: pointer;
}

/* Hover state */
.rix-calendar-time-block:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Focus state */
.rix-calendar-time-block:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}

/* Active state */
.rix-calendar-time-block:active {
  transform: translateY(0) scale(0.99);
}

/* Time block types */
.rix-calendar-time-block--busy {
  background: var(--rix-error)/5;
  border-color: var(--rix-error)/30;
}

.rix-calendar-time-block--busy:hover {
  border-color: var(--rix-error);
  background: var(--rix-error)/10;
}

.rix-calendar-time-block--available {
  background: var(--rix-success)/5;
  border-color: var(--rix-success)/30;
}

.rix-calendar-time-block--available:hover {
  border-color: var(--rix-success);
  background: var(--rix-success)/10;
}

.rix-calendar-time-block--suggested {
  background: linear-gradient(135deg, var(--rix-accent-primary)/5 0%, var(--rix-accent-primary)/10 100%);
  border-color: var(--rix-accent-primary);
  border-style: dashed;
}

.rix-calendar-time-block--suggested:hover {
  background: linear-gradient(135deg, var(--rix-accent-primary)/10 0%, var(--rix-accent-primary)/15 100%);
  border-style: solid;
}

/* Selected state */
.rix-calendar-time-block--selected {
  border-color: var(--rix-accent-primary);
  background: var(--rix-accent-primary)/10;
  box-shadow: 
    var(--shadow-md),
    inset 0 0 0 1px var(--rix-accent-primary);
}

/* Conflicting time block */
.rix-calendar-time-block--conflict {
  background: var(--rix-warning)/5;
  border-color: var(--rix-warning);
  border-style: dotted;
}

.rix-calendar-time-block--conflict:hover {
  background: var(--rix-warning)/10;
  border-style: solid;
}
```

### Suggestion Button States
```css
/* Suggestion accept button */
.rix-suggestion-btn--accept {
  background: var(--rix-success);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    transform var(--state-transition-fast) var(--state-easing),
    box-shadow var(--state-transition-fast) var(--state-easing);
}

.rix-suggestion-btn--accept:hover {
  background: var(--rix-success)/90;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.rix-suggestion-btn--accept:active {
  transform: translateY(0) scale(0.95);
}

.rix-suggestion-btn--accept:focus-visible {
  outline: 2px solid var(--rix-success);
  outline-offset: 2px;
}

/* Suggestion dismiss button */
.rix-suggestion-btn--dismiss {
  background: transparent;
  color: var(--rix-text-tertiary);
  border: 1px solid var(--rix-border-primary);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: 
    background-color var(--state-transition-fast) var(--state-easing),
    color var(--state-transition-fast) var(--state-easing),
    border-color var(--state-transition-fast) var(--state-easing);
}

.rix-suggestion-btn--dismiss:hover {
  background: var(--rix-bg-secondary);
  color: var(--rix-text-secondary);
  border-color: var(--rix-border-secondary);
}

.rix-suggestion-btn--dismiss:active {
  background: var(--rix-bg-tertiary);
}

.rix-suggestion-btn--dismiss:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}
```

## Loading States

### Skeleton Loading States
```css
/* Skeleton base */
.rix-skeleton {
  background: var(--rix-bg-secondary);
  border-radius: 4px;
  animation: rix-skeleton-pulse 1.5s infinite var(--state-easing);
  overflow: hidden;
  position: relative;
}

.rix-skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: rix-skeleton-shimmer 1.5s infinite;
}

/* Skeleton variants */
.rix-skeleton--text {
  height: 1em;
  border-radius: 2px;
}

.rix-skeleton--title {
  height: 1.5em;
  border-radius: 4px;
}

.rix-skeleton--avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.rix-skeleton--button {
  height: 44px;
  border-radius: 8px;
}

.rix-skeleton--card {
  height: 200px;
  border-radius: 12px;
}

/* Component loading overlays */
.rix-component-loading {
  position: relative;
  pointer-events: none;
}

.rix-component-loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--rix-surface)/70;
  backdrop-filter: blur(1px);
  z-index: 10;
  animation: rix-loading-fade-in var(--state-transition-fast) var(--state-easing);
  border-radius: inherit;
}

/* Loading spinner */
.rix-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--rix-border-primary);
  border-top-color: var(--rix-accent-primary);
  border-radius: 50%;
  animation: rix-spin 0.8s linear infinite;
}

/* Button loading state */
.rix-btn.rix-loading {
  color: transparent;
  pointer-events: none;
  position: relative;
}

.rix-btn.rix-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid var(--rix-accent-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: rix-spin 0.8s linear infinite;
}
```

## Error & Success States

### Error States
```css
/* Error container */
.rix-error {
  border-color: var(--rix-error);
  background: var(--rix-error)/5;
  color: var(--rix-error);
}

.rix-error:hover {
  border-color: var(--rix-error);
  background: var(--rix-error)/10;
}

/* Error shake animation */
.rix-error-shake {
  animation: rix-error-shake var(--state-transition-slow) var(--state-easing);
}

/* Error icon states */
.rix-error-icon {
  color: var(--rix-error);
  transition: transform var(--state-transition-fast) var(--state-easing);
}

.rix-error-icon:hover {
  transform: scale(1.1);
}

/* Form field error state */
.rix-input--error {
  border-color: var(--rix-error);
  background: var(--rix-error)/5;
}

.rix-input--error:focus {
  border-color: var(--rix-error);
  outline-color: var(--rix-error);
}
```

### Success States
```css
/* Success container */
.rix-success {
  border-color: var(--rix-success);
  background: var(--rix-success)/5;
  color: var(--rix-success);
}

.rix-success:hover {
  border-color: var(--rix-success);
  background: var(--rix-success)/10;
}

/* Success icon with checkmark animation */
.rix-success-icon {
  color: var(--rix-success);
  stroke-dasharray: 100;
  animation: rix-success-checkmark var(--state-transition-slow) var(--state-easing);
}

/* Success notification */
.rix-success-notification {
  background: var(--rix-success);
  color: white;
  animation: rix-success-bounce var(--state-transition-slow) var(--state-easing-bounce);
}

@keyframes rix-success-bounce {
  0%, 20%, 40%, 60%, 80%, 100% {
    transform: translateY(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateY(-4px);
  }
}

/* Form field success state */
.rix-input--success {
  border-color: var(--rix-success);
  background: var(--rix-success)/5;
}

.rix-input--success:focus {
  border-color: var(--rix-success);
  outline-color: var(--rix-success);
}
```

## Accessibility Considerations

### High Contrast Support
```css
/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  .rix-interactive:hover {
    border-width: 2px;
  }
  
  .rix-interactive:focus-visible {
    outline-width: 3px;
  }
  
  .rix-nav-item--active {
    border: 2px solid var(--rix-accent-primary);
  }
  
  .rix-project-card:hover {
    border-width: 2px;
  }
}
```

### Reduced Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .rix-interactive,
  .rix-nav-item,
  .rix-project-card,
  .rix-routine-box,
  .rix-theme-toggle,
  .rix-calendar-time-block {
    transition-duration: 0.01ms !important;
  }
  
  .rix-interactive:hover,
  .rix-nav-item:hover,
  .rix-project-card:hover,
  .rix-routine-box:hover {
    transform: none !important;
  }
  
  .rix-ai-status--active,
  .rix-priority-badge--urgent,
  .rix-skeleton {
    animation: none !important;
  }
}
```

### Focus Management
```css
/* Focus trap utilities */
.rix-focus-trap {
  position: relative;
}

.rix-focus-trap::before,
.rix-focus-trap::after {
  content: '';
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap;
}

/* Skip to content link */
.rix-skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--rix-accent-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top var(--state-transition-fast) var(--state-easing);
}

.rix-skip-link:focus {
  top: 6px;
}

/* Screen reader only content */
.rix-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

This comprehensive interaction states specification ensures that every element in the RIX Personal Agent interface provides clear, consistent, and accessible feedback to users across all interaction patterns while maintaining optimal performance and respecting user preferences.