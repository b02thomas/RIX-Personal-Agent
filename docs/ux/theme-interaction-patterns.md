# Theme Interaction Patterns
# /docs/ux/theme-interaction-patterns.md
# Analysis of dual theme design system and interaction patterns for RIX Personal Agent Second Brain interface
# This document defines theme-aware UI patterns that support both productivity focus and ambient intelligence
# RELEVANT FILES: src/app/globals.css, src/components/ui/*, tailwind.config.js, src/store/preferences-store.ts

## Executive Summary

RIX Personal Agent employs a **dual-theme system** designed to support different cognitive modes: **Focus Mode** (high contrast, minimal distractions) and **Ambient Mode** (subtle intelligence, contextual awareness). This document analyzes current theme implementation and defines interaction patterns that leverage theme switching for enhanced user experience.

### Key Findings
1. **Current Implementation**: Robust dark/light theme foundation with CSS custom properties
2. **Missing Element**: No cognitive mode differentiation beyond visual appearance  
3. **Opportunity**: Theme switching as a productivity and focus enhancement tool
4. **Technical Foundation**: Existing architecture supports advanced theme patterns

## Current Theme System Analysis

### Existing Color System
From `src/app/globals.css`:

**Light Theme:**
```css
:root {
  --background: 0 0% 100%;          /* Pure white */
  --foreground: 222.2 84% 4.9%;     /* Near black */
  --primary: 221.2 83.2% 53.3%;     /* Blue primary */
  --muted: 210 40% 96%;             /* Light gray */
  --border: 214.3 31.8% 91.4%;     /* Subtle borders */
}
```

**Dark Theme:**
```css
.dark {
  --background: 222.2 84% 4.9%;     /* Near black */
  --foreground: 210 40% 98%;        /* Near white */
  --primary: 217.2 91.2% 59.8%;     /* Brighter blue */
  --muted: 217.2 32.6% 17.5%;       /* Dark gray */
  --border: 217.2 32.6% 17.5%;      /* Subtle dark borders */
}
```

### Technical Strengths
- **CSS Custom Properties**: Flexible theme switching mechanism
- **HSL Color Space**: Consistent saturation and lightness relationships
- **Component Integration**: shadcn/ui components theme-aware by default
- **PWA Optimization**: Touch-friendly interactions with proper contrast ratios

### Current Limitations
1. **Binary Switching**: Only light/dark modes, no contextual variations
2. **Static Behavior**: Themes don't adapt to user context or time of day
3. **No Cognitive States**: Missing focus/ambient mode distinctions
4. **Limited Customization**: Users cannot personalize theme characteristics

## Second Brain Theme Requirements

### Cognitive Mode Framework

Based on research of modern productivity applications and Second Brain systems, users operate in distinct cognitive modes:

**1. Deep Focus Mode**
- **Characteristics**: High concentration, minimal distractions, task-oriented
- **Design Needs**: High contrast, reduced motion, essential UI only
- **Color Psychology**: Cooler tones, reduced saturation, clear hierarchy

**2. Ambient Intelligence Mode** 
- **Characteristics**: Context awareness, peripheral information, multi-tasking
- **Design Needs**: Subtle information density, smooth transitions, contextual hints
- **Color Psychology**: Warmer tones, varied saturation, soft boundaries

**3. Discovery Mode**
- **Characteristics**: Exploration, connection-making, creative thinking
- **Design Needs**: Visual relationships, hover states, interactive elements
- **Color Psychology**: Balanced palette, accent colors, clear affordances

### Proposed Theme Architecture

```typescript
interface ThemeState {
  // Visual appearance
  appearance: 'light' | 'dark' | 'auto';
  
  // Cognitive modes
  cognitiveMode: 'focus' | 'ambient' | 'discovery';
  
  // Context awareness
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  workingHours: boolean;
  
  // User preferences
  reducedMotion: boolean;
  highContrast: boolean;
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // Adaptive features
  autoModeSwitch: boolean;
  contextualAdjustments: boolean;
}
```

## Theme Interaction Patterns

### Pattern 1: Contextual Theme Switching

#### Automatic Mode Detection
```
Project Focus Session:
┌─────────────────────────────────────────┐
│ 🎯 Entering Focus Mode                  │
│                                         │
│ RIX detected you're starting a project │
│ work session. Switch to Focus Mode?     │
│                                         │
│ Focus Mode features:                    │
│ • Reduced visual distractions          │
│ • Higher contrast text                 │
│ • Minimal notifications                │
│ • Simplified navigation                │
│                                         │
│ [Enter Focus Mode] [Stay in Ambient]    │
│ [ ] Remember this preference            │
└─────────────────────────────────────────┘
```

#### Manual Theme Control
```
Theme Selector (Enhanced):
┌─────────────────────────────────────────┐
│ 🎨 Appearance & Cognitive Mode          │
│                                         │
│ Visual Theme:                           │
│ ○ Light  ● Dark  ○ Auto                │
│                                         │
│ Cognitive Mode:                         │
│ ○ Focus    ● Ambient   ○ Discovery     │
│                                         │
│ ──────────────────────────────────────  │
│                                         │
│ Focus Mode Preview:                     │
│ [██████████████████████████████████]    │
│ High contrast, minimal distractions     │
│                                         │
│ Auto-switch based on:                   │
│ ☑ Project sessions                     │
│ ☑ Time of day                          │
│ ☐ Calendar events                      │
│                                         │
│ [Apply Changes] [Reset to Default]      │
└─────────────────────────────────────────┘
```

### Pattern 2: Progressive Enhancement Based on Theme

#### Focus Mode Interface Simplification
```
Navigation - Ambient Mode:
┌─────────────────────────────────────────┐
│ 🤖 RIX                          [≡]     │
│                                         │
│ 🎯 Quick Actions                        │
│   • New Project                         │
│   • Quick Capture                       │
│   • Voice Chat                          │
│                                         │
│ 📋 ACTIVE PROJECTS ▼                    │
│   📁 Website Redesign    ░░░░░█ 65%     │
│   📁 Marketing Campaign  ░░█░░░ 25%     │
│   + Add Project                         │
│                                         │
│ 🤖 INTELLIGENCE HUB                     │
│   📊 Overview Dashboard                 │
│   📰 News Intelligence                  │
│   📅 Smart Calendar                     │
└─────────────────────────────────────────┘

Navigation - Focus Mode:
┌─────────────────────────────────────────┐
│ RIX                             [≡]     │
│                                         │
│ ACTIVE PROJECT:                         │
│ Website Redesign                        │
│                                         │
│ [📅 Schedule] [💬 Chat] [📊 Progress]   │
│                                         │
│ Other Projects:                         │
│ • Marketing Campaign                    │
│ • + New Project                         │
│                                         │
│ [Exit Focus Mode]                       │
└─────────────────────────────────────────┘
```

#### Content Density Adaptation
```
Intelligence Dashboard - Ambient Mode:
┌─────────────────────────────────────────┐
│ 🤖 Intelligence Overview - Today        │
│                                         │
│ 📊 Productivity Score: 87/100          │
│ ████████▓▓ Excellent momentum          │
│                                         │
│ 🎯 Active Projects (3)                 │
│ ├─ Website Redesign      ░░░░░█ 65%    │
│ ├─ Marketing Campaign    ░░█░░░ 25%    │
│ └─ Team Onboarding      ░░░░░░ 5%     │
│                                         │
│ 🔄 Routine Health: 85%                 │
│ Morning: ✓ Evening: ✓ Weekly: ⚠       │
│                                         │
│ 💡 AI Insights (2 new)                 │
│ • Focus optimization opportunity        │
│ • Cross-project synergy detected        │
│                                         │
│ Recent Activity:                        │
│ • Task completed: wireframe review     │
│ • Routine missed: evening reflection   │
│ • Insight generated: productivity peak │
└─────────────────────────────────────────┘

Intelligence Dashboard - Focus Mode:
┌─────────────────────────────────────────┐
│ Today's Focus                           │
│                                         │
│ Current Project: Website Redesign       │
│ Progress: 65% ░░░░░█                   │
│                                         │
│ Priority Tasks:                         │
│ 1. Complete wireframe review           │
│ 2. Schedule client feedback             │
│ 3. Update project timeline              │
│                                         │
│ Focus Time Remaining: 2h 15min          │
│                                         │
│ [Start Deep Work] [Quick Break]         │
└─────────────────────────────────────────┘
```

### Pattern 3: Adaptive Color Psychology

#### Time-Based Theme Variations
```typescript
// Morning Theme (7-11 AM) - Energy & Clarity
const morningTheme = {
  primary: 'hsl(221, 83%, 53%)',     // Bright blue
  accent: 'hsl(142, 71%, 45%)',      // Fresh green
  background: 'hsl(0, 0%, 100%)',    // Crisp white
  motivation: 'energizing',
};

// Afternoon Theme (11 AM-5 PM) - Sustained Focus  
const afternoonTheme = {
  primary: 'hsl(221, 65%, 48%)',     // Calmer blue
  accent: 'hsl(24, 70%, 56%)',       // Warm orange
  background: 'hsl(210, 17%, 98%)',  // Soft white
  motivation: 'sustaining',
};

// Evening Theme (5-10 PM) - Reflection & Planning
const eveningTheme = {
  primary: 'hsl(261, 52%, 59%)',     // Purple
  accent: 'hsl(340, 75%, 55%)',      // Warm pink
  background: 'hsl(222, 84%, 5%)',   // Dark
  motivation: 'reflective',
};

// Night Theme (10 PM-7 AM) - Minimal Strain
const nightTheme = {
  primary: 'hsl(47, 100%, 70%)',     // Warm yellow
  accent: 'hsl(14, 100%, 57%)',      // Soft orange
  background: 'hsl(222, 84%, 3%)',   // Very dark
  motivation: 'restful',
};
```

#### Cognitive Load Indicators
```
Visual Complexity Levels:

Focus Mode:
• Reduced shadows and gradients
• Single accent color usage
• Simplified icons (outline only)
• Minimal animation (fade only)
• Higher contrast ratios (7:1)

Ambient Mode:
• Subtle shadows and depth
• Multiple accent colors
• Detailed icons with fills
• Smooth micro-animations
• Standard contrast (4.5:1)

Discovery Mode:
• Rich visual hierarchy
• Full color palette usage
• Interactive hover states
• Animated transitions
• Enhanced visual feedback
```

### Pattern 4: Accessibility-Integrated Theming

#### High Contrast Mode Integration
```
Standard Dark Theme:
background: hsl(222, 84%, 5%)     /* #0a0a0f */
foreground: hsl(210, 40%, 98%)    /* #fafafa */
border: hsl(217, 32%, 18%)        /* #1e293b */

High Contrast Dark Theme:
background: hsl(0, 0%, 0%)        /* #000000 */
foreground: hsl(0, 0%, 100%)      /* #ffffff */
border: hsl(0, 0%, 50%)           /* #808080 */
primary: hsl(60, 100%, 50%)       /* #ffff00 */
```

#### Reduced Motion Patterns
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .theme-transition {
    transition: none;
  }
  
  .ambient-mode .pulse-animation {
    animation: none;
  }
  
  .discovery-mode .hover-lift {
    transform: none;
  }
}

/* Focus mode always reduces motion */
.focus-mode * {
  animation-duration: 0.1s;
  transition-duration: 0.1s;
}
```

## Implementation Strategy

### Phase 1: Enhanced Theme Foundation
**Current Phase Scope:**
1. **Extend CSS Custom Properties**: Add cognitive mode variables
2. **Create Theme Variants**: Focus/Ambient/Discovery mode stylesheets
3. **Update Component Library**: Theme-aware component variations
4. **State Management**: Create preferences store for theme state

### Phase 2: Intelligent Theme Switching
**Next Phase Scope:**
1. **Context Detection**: Time-based and activity-based theme switching
2. **User Preferences**: Comprehensive theme customization interface  
3. **Adaptive Behavior**: Smart mode recommendations
4. **Performance Optimization**: Smooth theme transitions

### Required Code Changes

**New Files to Create:**
```
src/styles/themes/
├── focus-mode.css           # Focus-specific overrides
├── ambient-mode.css         # Ambient-specific overrides
├── discovery-mode.css       # Discovery-specific overrides
└── adaptive-themes.css      # Time-based theme variations

src/components/theme/
├── theme-provider.tsx       # Enhanced theme context
├── theme-selector.tsx       # User theme control interface
├── cognitive-mode-switch.tsx # Quick mode switching
└── adaptive-theme-detector.tsx # Auto-switching logic

src/store/
├── theme-store.ts           # Theme state management
└── preferences-store.ts     # User theme preferences

src/hooks/
├── use-cognitive-mode.ts    # Theme state hooks
├── use-adaptive-theme.ts    # Auto-switching logic
└── use-theme-transition.ts  # Smooth transitions
```

**Files to Modify:**
```
src/app/globals.css          # Add new theme variables
src/components/layout/       # Theme-aware layouts
src/components/ui/           # Component theme variants
tailwind.config.js           # Theme-aware utilities
```

### Technical Implementation Details

#### Theme State Management
```typescript
// src/store/theme-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  appearance: 'light' | 'dark' | 'auto';
  cognitiveMode: 'focus' | 'ambient' | 'discovery';
  autoModeSwitch: boolean;
  timeBasedThemes: boolean;
  accessibilityMode: 'standard' | 'high-contrast' | 'reduced-motion';
  
  setAppearance: (appearance: ThemeState['appearance']) => void;
  setCognitiveMode: (mode: ThemeState['cognitiveMode']) => void;
  toggleAutoModeSwitch: () => void;
  applyContextualTheme: (context: 'work' | 'break' | 'planning') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      appearance: 'auto',
      cognitiveMode: 'ambient',
      autoModeSwitch: true,
      timeBasedThemes: true,
      accessibilityMode: 'standard',
      
      setAppearance: (appearance) => set({ appearance }),
      setCognitiveMode: (cognitiveMode) => set({ cognitiveMode }),
      toggleAutoModeSwitch: () => set((state) => ({ 
        autoModeSwitch: !state.autoModeSwitch 
      })),
      applyContextualTheme: (context) => {
        const mode = context === 'work' ? 'focus' : 
                    context === 'break' ? 'ambient' : 'discovery';
        set({ cognitiveMode: mode });
      },
    }),
    {
      name: 'rix-theme-storage',
    }
  )
);
```

#### Adaptive Theme Detection
```typescript
// src/hooks/use-adaptive-theme.ts
import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme-store';

export function useAdaptiveTheme() {
  const { autoModeSwitch, timeBasedThemes, applyContextualTheme } = useThemeStore();
  
  useEffect(() => {
    if (!autoModeSwitch) return;
    
    // Time-based theme switching
    if (timeBasedThemes) {
      const hour = new Date().getHours();
      
      if (hour >= 7 && hour < 11) {
        applyContextualTheme('work'); // Morning focus
      } else if (hour >= 17 && hour < 22) {
        applyContextualTheme('planning'); // Evening reflection
      } else {
        applyContextualTheme('break'); // Ambient mode
      }
    }
    
    // Activity-based detection could be added here
    // Based on current route, user interaction patterns, etc.
    
  }, [autoModeSwitch, timeBasedThemes, applyContextualTheme]);
}
```

## User Research & Testing Strategy

### Cognitive Mode Validation
**Research Questions:**
1. Do users perceive productivity differences between theme modes?
2. Which cognitive modes align with different task types?
3. How do users prefer to control theme switching (manual vs automatic)?
4. What time-based patterns emerge in theme preferences?

**Testing Methods:**
- **A/B Testing**: Compare task completion rates across theme modes
- **User Interviews**: Understand cognitive associations with visual themes
- **Analytics Tracking**: Monitor theme switching patterns and task outcomes
- **Accessibility Testing**: Ensure themes work for users with diverse needs

### Success Metrics
- **Mode Adoption**: >40% of users try different cognitive modes
- **Productivity Correlation**: Measurable improvement in focus mode usage
- **Accessibility Compliance**: WCAG 2.1 AA compliance across all themes
- **User Satisfaction**: >4.0/5.0 rating for theme system usefulness

## Accessibility Considerations

### Inclusive Design Principles
1. **Color Independence**: Information never conveyed by color alone
2. **Contrast Compliance**: All themes meet WCAG contrast requirements
3. **Motion Sensitivity**: Respect prefers-reduced-motion preferences
4. **Keyboard Navigation**: Theme switching accessible via keyboard
5. **Screen Reader Support**: Theme changes announced to assistive technology

### Testing Requirements
- **Automated Testing**: axe-core integration for continuous accessibility testing
- **Manual Testing**: Regular testing with actual assistive technology users
- **Color Blind Testing**: Validation with color blindness simulation tools
- **Cognitive Load Testing**: Ensure theme switching doesn't create confusion

---

**Document Status**: Phase 1 Complete - Theme architecture defined and ready for implementation
**Last Updated**: 2025-08-02
**Next Review**: Before Phase 2 theme development begins