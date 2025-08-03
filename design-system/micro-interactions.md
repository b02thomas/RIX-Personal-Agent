# RIX Personal Agent - Micro-Interactions Design Specification

## Overview
Comprehensive micro-interaction design system for RIX Personal Agent, creating delightful user experiences through purposeful animations, smooth transitions, and intelligent feedback systems. Every interaction is designed to enhance usability while maintaining 60fps performance and accessibility compliance.

## Animation Philosophy

### Core Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Performant**: Maintain 60fps with hardware acceleration
3. **Accessible**: Respect user motion preferences
4. **Consistent**: Unified timing and easing across all interactions
5. **Delightful**: Enhance UX without being distracting

### Animation DNA
```css
/* RIX Animation DNA - Consistent timing and easing */
:root {
  --animation-fast: 150ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;
  --animation-extra-slow: 400ms;
  
  --easing-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## Sidebar Navigation Micro-Interactions

### Sidebar Expand/Collapse Animation
```css
/* Sidebar container animation */
.rix-sidebar {
  transition: width var(--animation-normal) var(--easing-ease);
  will-change: width;
}

/* Enhanced label animations with stagger effect */
.rix-nav-item__label {
  transition: 
    opacity var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: opacity, transform;
}

.rix-sidebar--collapsed .rix-nav-item__label {
  opacity: 0;
  transform: translateX(-8px);
  transition-delay: 0ms; /* Hide immediately when collapsing */
}

.rix-sidebar--expanding .rix-nav-item__label {
  transition-delay: 100ms; /* Show after sidebar width animation */
}

/* Staggered animation for multiple labels */
.rix-nav-item:nth-child(1) .rix-nav-item__label { transition-delay: 120ms; }
.rix-nav-item:nth-child(2) .rix-nav-item__label { transition-delay: 140ms; }
.rix-nav-item:nth-child(3) .rix-nav-item__label { transition-delay: 160ms; }
.rix-nav-item:nth-child(4) .rix-nav-item__label { transition-delay: 180ms; }
.rix-nav-item:nth-child(5) .rix-nav-item__label { transition-delay: 200ms; }
.rix-nav-item:nth-child(6) .rix-nav-item__label { transition-delay: 220ms; }
.rix-nav-item:nth-child(7) .rix-nav-item__label { transition-delay: 240ms; }
```

### Navigation Item Hover Interactions
```css
/* Smooth hover state with subtle lift */
.rix-nav-item {
  transition: 
    background-color var(--animation-fast) var(--easing-ease),
    color var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: background-color, color, transform;
}

.rix-nav-item:hover {
  transform: translateX(2px);
}

.rix-nav-item:active {
  transform: translateX(1px) scale(0.98);
  transition-duration: var(--animation-fast);
}

/* Icon animation on hover */
.rix-nav-item__icon {
  transition: transform var(--animation-fast) var(--easing-ease);
  will-change: transform;
}

.rix-nav-item:hover .rix-nav-item__icon {
  transform: scale(1.1);
}
```

### Project Submenu Expansion
```css
/* Smooth submenu expand/collapse with height animation */
.rix-nav-submenu {
  overflow: hidden;
  transition: 
    max-height var(--animation-normal) var(--easing-ease),
    opacity var(--animation-normal) var(--easing-ease),
    margin var(--animation-normal) var(--easing-ease);
  will-change: max-height, opacity, margin;
}

.rix-nav-submenu--collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.rix-nav-submenu--expanded {
  max-height: 300px; /* Enough for reasonable number of projects */
  opacity: 1;
}

/* Staggered submenu item appearance */
.rix-nav-submenu-item {
  opacity: 0;
  transform: translateX(-8px);
  transition: 
    opacity var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: opacity, transform;
}

.rix-nav-submenu--expanded .rix-nav-submenu-item {
  opacity: 1;
  transform: translateX(0);
}

/* Stagger delays for submenu items */
.rix-nav-submenu--expanded .rix-nav-submenu-item:nth-child(1) { transition-delay: 50ms; }
.rix-nav-submenu--expanded .rix-nav-submenu-item:nth-child(2) { transition-delay: 75ms; }
.rix-nav-submenu--expanded .rix-nav-submenu-item:nth-child(3) { transition-delay: 100ms; }
.rix-nav-submenu--expanded .rix-nav-submenu-item:nth-child(4) { transition-delay: 125ms; }

/* Expand icon rotation */
.rix-nav-item__expand-icon {
  transition: transform var(--animation-normal) var(--easing-ease);
  will-change: transform;
}

.rix-nav-item--expanded .rix-nav-item__expand-icon {
  transform: rotate(90deg);
}
```

## Project Card Interactions

### Project Card Hover & Focus States
```css
/* Enhanced card elevation with subtle scale */
.rix-project-card {
  transition: 
    border-color var(--animation-normal) var(--easing-ease),
    box-shadow var(--animation-normal) var(--easing-ease),
    transform var(--animation-normal) var(--easing-ease);
  will-change: border-color, box-shadow, transform;
}

.rix-project-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 
    var(--shadow-lg),
    0 0 0 1px var(--rix-accent-primary)/20;
}

.rix-project-card:focus-within {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}

/* Card content reveal on hover */
.rix-project-card .rix-project-ai-insights {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: 
    max-height var(--animation-slow) var(--easing-ease),
    opacity var(--animation-normal) var(--easing-ease);
  will-change: max-height, opacity;
}

.rix-project-card:hover .rix-project-ai-insights {
  max-height: 200px;
  opacity: 1;
  transition-delay: 100ms;
}
```

### AI Status Indicator Animations
```css
/* AI status pulse animation */
@keyframes ai-status-pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.05); 
  }
}

.rix-ai-status--active {
  animation: ai-status-pulse 2s infinite var(--easing-ease);
}

/* AI status ping effect */
@keyframes ai-status-ping {
  0% { 
    opacity: 0.8; 
    transform: scale(1); 
  }
  75%, 100% { 
    opacity: 0; 
    transform: scale(2); 
  }
}

.rix-ai-status--active::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: inherit;
  animation: ai-status-ping 2s infinite var(--easing-ease);
}

/* AI insight content reveal */
.rix-project-ai-recommendation {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
  transition: 
    opacity var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-spring);
  will-change: opacity, transform;
}

.rix-project-ai-insights:hover .rix-project-ai-recommendation {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Stagger AI recommendations */
.rix-project-ai-recommendation:nth-child(1) { transition-delay: 0ms; }
.rix-project-ai-recommendation:nth-child(2) { transition-delay: 25ms; }
.rix-project-ai-recommendation:nth-child(3) { transition-delay: 50ms; }
.rix-project-ai-recommendation:nth-child(4) { transition-delay: 75ms; }
```

### Priority Badge Animations
```css
/* Urgent priority pulse animation */
@keyframes urgent-pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.05); 
  }
}

.rix-priority-badge--urgent {
  animation: urgent-pulse 1.5s infinite var(--easing-ease);
}

/* Priority badge hover effect */
.rix-priority-badge {
  transition: 
    transform var(--animation-fast) var(--easing-ease),
    box-shadow var(--animation-fast) var(--easing-ease);
  will-change: transform, box-shadow;
}

.rix-priority-badge:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
```

## Routine Box Interactions

### Routine Progress Animations
```css
/* Progress bar fill animation */
.rix-routine-progress-fill {
  transition: width var(--animation-extra-slow) var(--easing-ease);
  will-change: width;
}

/* Progress value count-up animation */
@keyframes count-up {
  from { 
    opacity: 0; 
    transform: translateY(8px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.rix-routine-progress-value {
  animation: count-up var(--animation-normal) var(--easing-ease);
}

/* Routine completion celebration */
@keyframes completion-celebration {
  0% { 
    transform: scale(1); 
  }
  25% { 
    transform: scale(1.1) rotate(2deg); 
  }
  50% { 
    transform: scale(1.05) rotate(-1deg); 
  }
  75% { 
    transform: scale(1.02) rotate(1deg); 
  }
  100% { 
    transform: scale(1) rotate(0deg); 
  }
}

.rix-routine-box--completed {
  animation: completion-celebration var(--animation-slow) var(--easing-spring);
}
```

### Coaching Feedback Bubbles
```css
/* Coaching message bubble entrance */
.rix-routine-coaching {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  transition: 
    opacity var(--animation-normal) var(--easing-ease),
    transform var(--animation-normal) var(--easing-spring);
  will-change: opacity, transform;
}

.rix-routine-box:hover .rix-routine-coaching,
.rix-routine-box:focus-within .rix-routine-coaching {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 200ms;
}

/* Coaching tip animations */
.rix-routine-coaching-tip {
  opacity: 0;
  transform: translateX(-4px);
  transition: 
    opacity var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: opacity, transform;
}

.rix-routine-coaching:hover .rix-routine-coaching-tip {
  opacity: 1;
  transform: translateX(0);
}

/* Stagger coaching tips */
.rix-routine-coaching-tip:nth-child(1) { transition-delay: 50ms; }
.rix-routine-coaching-tip:nth-child(2) { transition-delay: 75ms; }
.rix-routine-coaching-tip:nth-child(3) { transition-delay: 100ms; }
.rix-routine-coaching-tip:nth-child(4) { transition-delay: 125ms; }
```

### Button Interactions
```css
/* Routine action button feedback */
.rix-routine-btn-complete {
  transition: 
    background-color var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease),
    box-shadow var(--animation-fast) var(--easing-ease);
  will-change: background-color, transform, box-shadow;
}

.rix-routine-btn-complete:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.rix-routine-btn-complete:active {
  transform: translateY(0) scale(0.98);
  box-shadow: var(--shadow-sm);
}

/* Success state animation */
@keyframes button-success {
  0% { 
    background-color: var(--rix-success); 
  }
  50% { 
    background-color: var(--rix-accent-primary);
    transform: scale(1.05); 
  }
  100% { 
    background-color: var(--rix-success);
    transform: scale(1); 
  }
}

.rix-routine-btn-complete--success {
  animation: button-success var(--animation-slow) var(--easing-ease);
}

/* Skip button subtle interaction */
.rix-routine-btn-skip {
  transition: 
    border-color var(--animation-fast) var(--easing-ease),
    color var(--animation-fast) var(--easing-ease),
    background-color var(--animation-fast) var(--easing-ease);
  will-change: border-color, color, background-color;
}

.rix-routine-btn-skip:hover {
  border-color: var(--rix-accent-primary);
  color: var(--rix-accent-primary);
  background-color: var(--rix-accent-primary)/5;
}
```

## Theme Toggle Interactions

### Toggle Switch Animation
```css
/* Enhanced theme toggle animation */
.rix-theme-toggle {
  transition: 
    background-color var(--animation-normal) var(--easing-ease),
    border-color var(--animation-normal) var(--easing-ease);
  will-change: background-color, border-color;
}

.rix-theme-toggle-slider {
  transition: 
    transform var(--animation-normal) var(--easing-spring),
    background-color var(--animation-normal) var(--easing-ease),
    box-shadow var(--animation-normal) var(--easing-ease);
  will-change: transform, background-color, box-shadow;
}

/* Icon cross-fade animation */
.rix-theme-toggle-icon {
  transition: 
    opacity var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: opacity, transform;
}

.rix-theme-toggle[data-switching="true"] .rix-theme-toggle-icon {
  opacity: 0;
  transform: rotate(180deg) scale(0.8);
}

/* Theme switching micro-interaction */
@keyframes theme-switch-flash {
  0% { 
    box-shadow: 0 0 0 0 var(--rix-accent-primary); 
  }
  50% { 
    box-shadow: 0 0 0 8px var(--rix-accent-primary)/20; 
  }
  100% { 
    box-shadow: 0 0 0 0 var(--rix-accent-primary)/0; 
  }
}

.rix-theme-toggle--switching {
  animation: theme-switch-flash var(--animation-slow) var(--easing-ease);
}
```

### Global Theme Transition
```css
/* Smooth theme transition for entire interface */
* {
  transition: 
    background-color var(--animation-slow) var(--easing-ease),
    border-color var(--animation-slow) var(--easing-ease),
    color var(--animation-slow) var(--easing-ease),
    box-shadow var(--animation-slow) var(--easing-ease) !important;
}

/* Exclude animations that shouldn't be affected */
*:hover,
*:focus,
*:active,
[data-no-theme-transition] * {
  transition-duration: var(--animation-fast) !important;
}
```

## Calendar Time Block Interactions

### Time Block Hover Effects
```css
/* Calendar time block elevation */
.rix-calendar-time-block {
  transition: 
    border-color var(--animation-fast) var(--easing-ease),
    box-shadow var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease);
  will-change: border-color, box-shadow, transform;
}

.rix-calendar-time-block:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Status indicator pulse */
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.rix-time-block-status--suggested {
  animation: status-pulse 2s infinite var(--easing-ease);
}
```

### Intelligent Suggestions
```css
/* Suggestion appearance animation */
.rix-time-block-suggestion {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
  transition: 
    opacity var(--animation-normal) var(--easing-ease),
    transform var(--animation-normal) var(--easing-spring);
  will-change: opacity, transform;
}

.rix-calendar-time-block:hover .rix-time-block-suggestion {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 100ms;
}

/* Suggestion button interactions */
.rix-suggestion-btn {
  transition: 
    background-color var(--animation-fast) var(--easing-ease),
    transform var(--animation-fast) var(--easing-ease),
    box-shadow var(--animation-fast) var(--easing-ease);
  will-change: background-color, transform, box-shadow;
}

.rix-suggestion-btn--accept:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.rix-suggestion-btn--dismiss:hover {
  background-color: var(--rix-bg-secondary);
}

/* Confidence indicator animation */
.rix-suggestion-confidence {
  position: relative;
  overflow: hidden;
}

.rix-suggestion-confidence::after {
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
  animation: confidence-shimmer 2s infinite;
}

@keyframes confidence-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

## Loading States & Feedback

### Loading Animations
```css
/* Skeleton loading animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.rix-skeleton {
  background: var(--rix-bg-secondary);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s infinite var(--easing-ease);
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
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Component loading overlay */
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
  animation: loading-fade-in var(--animation-fast) var(--easing-ease);
}

@keyframes loading-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Success & Error Feedback
```css
/* Success checkmark animation */
@keyframes success-checkmark {
  0% {
    stroke-dashoffset: 100;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.rix-success-icon {
  stroke-dasharray: 100;
  animation: success-checkmark var(--animation-slow) var(--easing-ease);
}

/* Error shake animation */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.rix-error-shake {
  animation: error-shake var(--animation-slow) var(--easing-ease);
}

/* Notification toast entrance */
@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.rix-toast {
  animation: toast-slide-in var(--animation-normal) var(--easing-spring);
}
```

## Accessibility & Performance Optimizations

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
  
  /* Keep essential feedback animations but reduce intensity */
  .rix-routine-box--completed {
    animation: none;
    background: var(--rix-success)/10;
    border-color: var(--rix-success);
  }
  
  .rix-ai-status--active {
    animation: none;
  }
  
  .rix-ai-status--active::after {
    animation: none;
  }
}
```

### Performance Optimizations
```css
/* Hardware acceleration for smooth animations */
.rix-sidebar,
.rix-project-card,
.rix-routine-box,
.rix-calendar-time-block,
.rix-theme-toggle-slider {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Optimize animations for 60fps */
.rix-optimized-animation {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* Remove will-change after animation completes */
.rix-animation-complete {
  will-change: auto;
}
```

### Focus Management
```css
/* Enhanced focus indicators */
.rix-focus-visible:focus-visible {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
  transition: outline var(--animation-fast) var(--easing-ease);
}

/* Focus trap for modals and drawers */
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
}
```

## Implementation Guidelines

### JavaScript Animation Helpers
```typescript
// Animation utility functions
interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

class RixAnimations {
  static fadeIn(element: HTMLElement, config: AnimationConfig = {}) {
    return element.animate([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: config.duration || 200,
      easing: config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: config.delay || 0,
      fill: config.fill || 'forwards'
    });
  }
  
  static slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', config: AnimationConfig = {}) {
    const transforms = {
      left: ['translateX(-100%)', 'translateX(0)'],
      right: ['translateX(100%)', 'translateX(0)'],
      up: ['translateY(-100%)', 'translateY(0)'],
      down: ['translateY(100%)', 'translateY(0)']
    };
    
    return element.animate([
      { transform: transforms[direction][0], opacity: 0 },
      { transform: transforms[direction][1], opacity: 1 }
    ], {
      duration: config.duration || 300,
      easing: config.easing || 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      delay: config.delay || 0,
      fill: config.fill || 'forwards'
    });
  }
  
  static pulse(element: HTMLElement, config: AnimationConfig = {}) {
    return element.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: config.duration || 600,
      easing: config.easing || 'cubic-bezier(0.4, 0, 0.2, 1)',
      iterations: Infinity
    });
  }
  
  static staggerChildren(container: HTMLElement, delay: number = 50) {
    const children = container.children;
    Array.from(children).forEach((child, index) => {
      (child as HTMLElement).style.animationDelay = `${index * delay}ms`;
    });
  }
}

// Usage examples
// RixAnimations.fadeIn(document.querySelector('.rix-routine-coaching'));
// RixAnimations.slideIn(document.querySelector('.rix-nav-submenu'), 'down');
// RixAnimations.staggerChildren(document.querySelector('.rix-nav-submenu'));
```

### React Hook for Animations
```typescript
// Custom hook for managing micro-interactions
import { useEffect, useRef, useState } from 'react';

interface UseAnimationOptions {
  trigger?: 'hover' | 'focus' | 'visible' | 'manual';
  duration?: number;
  delay?: number;
  once?: boolean;
}

export const useRixAnimation = (
  animationType: 'fadeIn' | 'slideIn' | 'pulse' | 'bounce',
  options: UseAnimationOptions = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const triggerAnimation = () => {
    if (options.once && hasAnimated) return;
    if (!elementRef.current) return;

    setIsAnimating(true);
    
    let animation: Animation;
    
    switch (animationType) {
      case 'fadeIn':
        animation = RixAnimations.fadeIn(elementRef.current, options);
        break;
      case 'slideIn':
        animation = RixAnimations.slideIn(elementRef.current, 'up', options);
        break;
      case 'pulse':
        animation = RixAnimations.pulse(elementRef.current, options);
        break;
      default:
        return;
    }
    
    animation.addEventListener('finish', () => {
      setIsAnimating(false);
      setHasAnimated(true);
    });
  };

  useEffect(() => {
    if (options.trigger === 'visible') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            triggerAnimation();
          }
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => observer.disconnect();
    }
  }, []);

  return {
    elementRef,
    triggerAnimation,
    isAnimating,
    hasAnimated
  };
};

// Usage in React components
// const { elementRef, triggerAnimation } = useRixAnimation('fadeIn', { trigger: 'visible' });
// <div ref={elementRef} onMouseEnter={triggerAnimation}>Content</div>
```

### Performance Monitoring
```typescript
// Animation performance monitoring
class AnimationPerformanceMonitor {
  private frameCount = 0;
  private startTime = 0;
  private isMonitoring = false;

  startMonitoring() {
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.measureFrame();
  }

  private measureFrame() {
    if (!this.isMonitoring) return;
    
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    if (elapsed >= 1000) { // Measure for 1 second
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      
      if (fps < 55) {
        console.warn(`RIX Animation Performance Warning: ${fps} FPS detected`);
        // Optionally reduce animation complexity
        document.body.classList.add('rix-reduce-animations');
      }
      
      this.stopMonitoring();
    } else {
      requestAnimationFrame(() => this.measureFrame());
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }
}

// Monitor during critical animations
const monitor = new AnimationPerformanceMonitor();
monitor.startMonitoring();
```

This comprehensive micro-interactions specification provides a complete animation system for RIX Personal Agent, ensuring smooth, purposeful, and accessible interactions throughout the interface while maintaining optimal performance.