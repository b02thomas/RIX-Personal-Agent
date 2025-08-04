# Visual Consistency Guide for RIX

## Overview
This guide defines the complete visual design system for RIX, ensuring consistent application of colors, spacing, typography, and interaction patterns across all components. Every element follows the exact specifications from tech-stack-config.md.

## Core Design Principles

### 1. Color System Consistency
**Primary Rule**: All components MUST use CSS variables from the color system.

**Color Palette**:
```css
/* Primary Colors */
--primary-blue: #0066FF;
--primary-blue-dark: #0052CC;
--primary-blue-light: #3385FF;

/* Backgrounds */
--background-dark: #0F1115;
--card-background: #1A1D23;
--card-background-hover: #1F242B;

/* Text Colors */
--text-primary: #FFFFFF;
--text-secondary: #A0AEC0;
--text-muted: #718096;

/* Borders */
--border-color: #2D3748;
--border-color-light: #3A4553;
```

**Application Rules**:
- Primary actions: `var(--primary-blue)`
- Card backgrounds: `var(--card-background)`
- Text hierarchy: Primary → Secondary → Muted
- Borders: Default `var(--border-color)`, hover `var(--border-color-light)`

### 2. Border Radius Standards
**Strict Hierarchy**:
- **Cards**: 8px (`var(--card-radius)`)
- **Buttons**: 6px (`var(--button-radius)`)
- **Inputs**: 6px (`var(--input-radius)`)
- **Chat Bubbles**: 12px (`var(--bubble-radius)`)
- **Modals**: 16px (`var(--modal-radius)`)
- **Circular Elements**: 50% (`var(--radius-full)`)

### 3. Spacing System
**Consistent Scale** (4px base unit):
```css
--space-1: 4px;    /* Tight spacing */
--space-2: 8px;    /* Small gaps */
--space-3: 12px;   /* Default small */
--space-4: 16px;   /* Default medium */
--space-6: 24px;   /* Large spacing */
--space-8: 32px;   /* Section spacing */
```

**Application Guidelines**:
- Component padding: `var(--space-4)` default
- Element gaps: `var(--space-3)` between related items
- Section spacing: `var(--space-6)` between major sections
- Container margins: `var(--space-8)` for page-level spacing

### 4. Transition Standards
**Universal Timing**: 200ms ease-out for all interactions
```css
transition: var(--transition-normal); /* 200ms ease-out */
```

**Specific Transitions**:
- Colors: `var(--transition-colors)`
- Transforms: `var(--transition-transform)`
- Fast interactions: `var(--duration-fast)` (100ms)
- Slow animations: `var(--duration-slow)` (300ms)

## Component-Specific Standards

### Navigation Components

#### Sidebar
```css
/* Structure */
width: var(--sidebar-width-expanded); /* 280px */
background: var(--background-dark);
border-right: 1px solid var(--border-color);

/* Navigation Items */
min-height: var(--touch-target-min); /* 44px */
padding: var(--space-2) var(--space-3);
border-radius: var(--card-radius);
transition: var(--transition-normal);

/* States */
:hover {
  background: var(--card-background);
  transform: translateX(2px);
}
:active {
  background: var(--primary-blue);
  color: white;
}
```

#### Mobile Navigation
```css
/* Bottom Navigation */
height: var(--bottom-nav-height); /* 64px */
background: var(--card-background);
border-top: 1px solid var(--border-color);

/* Touch Targets */
min-width: var(--touch-target-min);
min-height: var(--touch-target-min);
```

### Interface Components

#### Cards
```css
/* Base Card */
background: var(--card-background);
border: 1px solid var(--border-color);
border-radius: var(--card-radius);
box-shadow: var(--shadow-sm);

/* Hover State */
:hover {
  background: var(--card-background-hover);
  border-color: var(--border-color-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Interactive Card */
cursor: pointer;
transition: var(--transition-normal);
```

#### Buttons
```css
/* Primary Button */
background: var(--primary-blue);
color: white;
border-radius: var(--button-radius);
min-height: var(--button-height-md); /* 44px */
padding: var(--space-3) var(--space-4);

/* Secondary Button */
background: var(--card-background);
border: 1px solid var(--border-color);
color: var(--text-primary);

/* Hover Effects */
:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### Input Fields
```css
/* Text Input */
height: var(--input-height); /* 44px */
padding: var(--space-3) var(--space-4);
border: 1px solid var(--border-color);
border-radius: var(--input-radius);
background: var(--background-dark);
color: var(--text-primary);

/* Focus State */
:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px var(--primary-blue-alpha-20);
}
```

### Chat Interface

#### Message Bubbles
```css
/* User Messages */
background: var(--primary-blue);
color: white;
border-radius: var(--bubble-radius);
border-bottom-right-radius: var(--radius-md);
max-width: 70%;

/* AI Messages */
background: var(--card-background-hover);
border: 1px solid var(--border-color);
color: var(--text-primary);
border-bottom-left-radius: var(--radius-md);
```

#### Chat Input
```css
/* Input Container */
border-top: 1px solid var(--border-color);
padding: var(--space-4);
background: var(--card-background);

/* Input Field */
border: 1px solid var(--border-color);
border-radius: var(--button-radius);
min-height: var(--input-height);
```

### AI Sphere

#### Floating Sphere
```css
/* Main Sphere */
width: var(--ai-sphere-size); /* 64px */
height: var(--ai-sphere-size);
border-radius: var(--sphere-radius); /* 50% */
background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
box-shadow: var(--shadow-blue);

/* Hover State */
:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-blue-lg);
}

/* Positioning */
position: fixed;
bottom: var(--space-6);
right: var(--space-6);
z-index: var(--ai-sphere-z-index);
```

#### Bubble Interface
```css
/* Interface Container */
background: var(--card-background);
border: 1px solid var(--border-color);
border-radius: var(--modal-radius);
box-shadow: var(--shadow-xl);
backdrop-filter: blur(10px);

/* Animation */
opacity: 0;
transform: translateY(var(--space-5)) scale(0.95);
transition: all var(--duration-slow) var(--ease-bounce);

/* Expanded State */
opacity: 1;
transform: translateY(0) scale(1);
```

## Interaction Patterns

### Hover Effects
**Standard Pattern**:
```css
:hover {
  background: var(--card-background-hover);
  border-color: var(--border-color-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Focus States
**Accessibility First**:
```css
:focus-visible {
  outline: var(--state-focus-outline); /* 2px solid var(--primary-blue) */
  outline-offset: var(--state-focus-outline-offset); /* 2px */
}
```

### Active States
**Tactile Feedback**:
```css
:active {
  transform: translateY(0) scale(0.98);
  transition: transform var(--duration-fast) var(--ease-out);
}
```

### Loading States
**Standard Spinner**:
```css
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

## Typography Hierarchy

### Headings
```css
h1 { font-size: var(--text-4xl); font-weight: var(--font-bold); }
h2 { font-size: var(--text-3xl); font-weight: var(--font-semibold); }
h3 { font-size: var(--text-2xl); font-weight: var(--font-semibold); }
h4 { font-size: var(--text-xl); font-weight: var(--font-medium); }
```

### Body Text
```css
p { 
  font-size: var(--text-base); 
  color: var(--text-secondary); 
  line-height: var(--leading-relaxed); 
}
```

### Labels and Captions
```css
.label { font-size: var(--text-sm); font-weight: var(--font-medium); }
.caption { font-size: var(--text-xs); color: var(--text-muted); }
```

## Responsive Standards

### Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1023px */
/* Desktop: ≥ 1024px */
```

### Touch Targets
**Minimum Sizes**:
- Mobile: `var(--touch-target-min)` (44px)
- Comfortable: `var(--touch-target-comfortable)` (48px)
- Large: `var(--touch-target-large)` (56px)

### Container Padding
```css
/* Mobile */
padding: var(--container-padding-mobile); /* 16px */

/* Tablet */
padding: var(--container-padding-tablet); /* 24px */

/* Desktop */
padding: var(--container-padding-desktop); /* 32px */
```

## Accessibility Requirements

### Color Contrast
- Text on background: WCAG AA compliant
- Interactive elements: Clear visual hierarchy
- Focus indicators: High contrast, 2px outline

### Motion Sensitivity
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .interactive-element {
    border-width: 2px;
  }
}
```

## Performance Guidelines

### Hardware Acceleration
```css
.animated-element {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}
```

### Transition Optimization
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Enable hardware acceleration for smooth 60fps

### Memory Management
```css
/* Clean up will-change after animations */
.element:not(:hover):not(:focus) {
  will-change: auto;
}
```

## Quality Assurance Checklist

### Color Implementation
- [ ] All colors use CSS variables from color-system.css
- [ ] No hardcoded color values (hex, rgb, etc.)
- [ ] Consistent color hierarchy maintained
- [ ] Proper contrast ratios verified

### Spacing Consistency
- [ ] All spacing uses var(--space-*) values
- [ ] Consistent padding/margins across components
- [ ] Proper spacing hierarchy maintained
- [ ] Touch targets meet minimum requirements

### Border Radius Application
- [ ] Cards use 8px radius
- [ ] Buttons use 6px radius
- [ ] Inputs use 6px radius
- [ ] Chat bubbles use 12px radius
- [ ] Modals use 16px radius

### Transition Uniformity
- [ ] All interactions use 200ms ease-out
- [ ] Hardware acceleration enabled
- [ ] Reduced motion preferences respected
- [ ] Performance optimized

### Accessibility Compliance
- [ ] Focus states clearly visible
- [ ] Touch targets minimum 44px
- [ ] Color contrast meets WCAG AA
- [ ] Motion preferences respected
- [ ] High contrast mode supported

### Responsive Design
- [ ] Mobile-first implementation
- [ ] Proper breakpoint usage
- [ ] Touch-friendly interactions
- [ ] Consistent behavior across devices

## Implementation Validation

### Visual Testing
1. **Color Verification**: Compare against exact hex values
2. **Spacing Audit**: Measure all paddings/margins
3. **Radius Check**: Verify border-radius consistency
4. **Animation Review**: Confirm 200ms timing

### Functional Testing
1. **Hover States**: Verify all interactive elements
2. **Focus Navigation**: Test keyboard accessibility
3. **Touch Interaction**: Validate mobile experience
4. **Loading States**: Confirm spinner consistency

### Cross-browser Testing
1. **Chrome/Safari**: Primary testing
2. **Firefox**: Secondary validation
3. **Mobile Safari**: iOS optimization
4. **Mobile Chrome**: Android optimization

### Performance Validation
1. **60fps Animations**: Monitor frame rates
2. **Memory Usage**: Check will-change cleanup
3. **Bundle Size**: Verify CSS optimization
4. **Load Times**: Test component rendering

## Future Maintenance

### Adding New Components
1. Start with base styles from color-system.css
2. Apply component-specific patterns
3. Follow interaction guidelines
4. Test accessibility compliance
5. Validate responsive behavior

### Updating Existing Components
1. Maintain backward compatibility
2. Update all related components
3. Test visual regression
4. Update documentation
5. Validate performance impact

### System Evolution
1. Document any pattern changes
2. Update all affected components
3. Maintain design token consistency
4. Validate accessibility standards
5. Test cross-platform compatibility

This guide ensures every component in RIX follows the exact same visual and interaction standards, creating a cohesive and professional user experience.