# RIX Personal Agent - Brand Guidelines

## Brand Foundation

### Brand Identity
- **Name**: RIX
- **Full Name**: RIX Personal Agent
- **Tagline**: Personal AI Second Brain
- **Description**: Ein fortschrittlicher persönlicher AI Assistent als Second Brain System

### Brand Values
1. **Intelligence**: Sophisticated AI capabilities that understand and adapt
2. **Simplicity**: Clean, minimal interfaces that reduce cognitive load
3. **Reliability**: Consistent performance and trustworthy assistance
4. **Personal**: Tailored experiences that learn and grow with users
5. **Efficiency**: Streamlined workflows that maximize productivity

### Brand Personality
- **Professional yet approachable**: Sophisticated but not intimidating
- **Minimalist**: Clean, uncluttered, focused on essentials
- **Intelligent**: Smart, predictive, contextually aware
- **Responsive**: Fast, smooth, adaptive to user needs
- **Trustworthy**: Reliable, secure, consistent

## Visual Identity System

### Logo Specifications

#### Primary Brand Mark
- **Name**: RIX (all caps, geometric sans-serif)
- **Typeface**: Inter Bold (700 weight)
- **Minimum Size**: 24px height for digital, 12mm for print
- **Clear Space**: 1x the height of the 'R' on all sides

#### Logo Variations
- **Primary**: Full color on light/dark backgrounds
- **Monochrome**: Single color versions for limited color applications
- **Icon Mark**: Geometric AI brain symbol (can be used without text)
- **Horizontal**: For wide format applications

#### Usage Guidelines
**DO:**
- Use official logo files only
- Maintain minimum clear space
- Use on approved background colors
- Scale proportionally

**DON'T:**
- Stretch or distort the logo
- Change colors outside approved palette
- Add effects, shadows, or outlines
- Place on busy backgrounds without proper contrast

### Color System

#### Dark Theme (Primary)
```css
/* Primary Backgrounds */
--rix-bg-primary: #1A1A1A;      /* Main background */
--rix-bg-secondary: #121212;    /* Secondary surfaces */
--rix-surface: #2C2C2C;         /* Card backgrounds */

/* Borders */
--rix-border-primary: #333333;  /* Primary borders */
--rix-border-secondary: #2C2C2C; /* Subtle borders */

/* Text Hierarchy */
--rix-text-primary: #FFFFFF;    /* Primary text */
--rix-text-secondary: #D1D5DB;  /* Secondary text */
--rix-text-tertiary: #9CA3AF;   /* Tertiary text */
--rix-text-quaternary: #6B7280; /* Quaternary text */

/* Accent Colors */
--rix-accent-primary: #60A5FA;  /* Primary accent */
--rix-accent-hover: #3B82F6;    /* Hover states */
--rix-success: #34D399;         /* Success states */
--rix-warning: #FBBF24;         /* Warning states */
--rix-error: #F87171;           /* Error states */
```

#### Light Theme (Secondary)
```css
/* Primary Backgrounds */
--rix-bg-primary: #FFFFFF;      /* Main background */
--rix-bg-secondary: #F8F9FA;    /* Secondary surfaces */
--rix-surface: #FFFFFF;         /* Card backgrounds */

/* Borders */
--rix-border-primary: #E5E7EB;  /* Primary borders */
--rix-border-secondary: #F3F4F6; /* Subtle borders */

/* Text Hierarchy */
--rix-text-primary: #1F2937;    /* Primary text */
--rix-text-secondary: #6B7280;  /* Secondary text */
--rix-text-tertiary: #9CA3AF;   /* Tertiary text */

/* Accent Colors */
--rix-accent-primary: #3B82F6;  /* Primary accent */
--rix-accent-hover: #2563EB;    /* Hover states */
--rix-success: #10B981;         /* Success states */
--rix-warning: #F59E0B;         /* Warning states */
--rix-error: #EF4444;           /* Error states */
```

#### Color Usage Guidelines

**Background Hierarchy:**
1. Primary: Main application background
2. Secondary: Section backgrounds, sidebars
3. Surface: Cards, modals, elevated content

**Text Hierarchy:**
1. Primary: Headlines, important content
2. Secondary: Body text, descriptions
3. Tertiary: Captions, metadata
4. Quaternary: Disabled text, placeholders

**Accessibility Requirements:**
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text (18px+)
- All interactive elements must meet WCAG 2.1 AA standards

### Typography System

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace**: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas

#### Type Scale
```css
/* Display - Marketing/Landing only */
.rix-text-display {
  font-size: 3rem;        /* 48px */
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Headings */
.rix-text-h1 {
  font-size: 2.25rem;     /* 36px */
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.rix-text-h2 {
  font-size: 1.875rem;    /* 30px */
  line-height: 1.33;
  font-weight: 600;
}

.rix-text-h3 {
  font-size: 1.5rem;      /* 24px */
  line-height: 1.33;
  font-weight: 600;
}

.rix-text-h4 {
  font-size: 1.25rem;     /* 20px */
  line-height: 1.4;
  font-weight: 600;
}

/* Body Text */
.rix-text-body {
  font-size: 1rem;        /* 16px */
  line-height: 1.5;
  font-weight: 400;
}

.rix-text-small {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.43;
  font-weight: 400;
}

.rix-text-caption {
  font-size: 0.75rem;     /* 12px */
  line-height: 1.33;
  font-weight: 400;
}
```

#### Typography Usage Guidelines
- **Headlines**: Use for page titles and major sections
- **Body**: Default for most content
- **Small**: UI labels, secondary information
- **Caption**: Metadata, timestamps, fine print
- **Line Length**: 45-75 characters for optimal readability
- **Paragraph Spacing**: 1.5x line height between paragraphs

### Icon System

#### Style Specifications
- **Style**: Flat geometric with minimal detail
- **Stroke Width**: 1.5px consistent
- **Corner Style**: Rounded (round linecap and linejoin)
- **Grid**: 24x24px base grid
- **Padding**: 2px internal padding

#### Navigation Icons
- **Dashboard**: Grid 3x3 pattern
- **Projekte**: Folder with expansion indicator
- **Tasks**: Check square with checkmark
- **Routines**: Circular arrow repeat symbol
- **Kalender**: Calendar with date indicators
- **Intelligence**: Bar chart with trend lines
- **Settings**: Gear/cog wheel

#### Icon Sizes
```css
.rix-icon-xs { width: 12px; height: 12px; }
.rix-icon-sm { width: 16px; height: 16px; }
.rix-icon-md { width: 20px; height: 20px; }
.rix-icon-lg { width: 24px; height: 24px; }
.rix-icon-xl { width: 32px; height: 32px; }
.rix-icon-2xl { width: 48px; height: 48px; }
```

#### Icon Usage Guidelines
**DO:**
- Use consistent stroke width across all icons
- Maintain optical balance and visual weight
- Follow the established geometric style
- Use appropriate sizes for context

**DON'T:**
- Mix different icon styles
- Change stroke width inconsistently
- Use filled and outlined icons together
- Scale icons non-proportionally

### Spacing System

#### Base Unit: 4px
All spacing follows a 4px grid system for consistent rhythm.

```css
/* Spacing Scale */
--space-1: 4px;   /* Tight spacing */
--space-2: 8px;   /* Small spacing */
--space-3: 12px;  /* Medium-small spacing */
--space-4: 16px;  /* Medium spacing (most common) */
--space-5: 20px;  /* Medium-large spacing */
--space-6: 24px;  /* Large spacing */
--space-8: 32px;  /* Section spacing */
--space-10: 40px; /* Large section spacing */
--space-12: 48px; /* Page spacing */
--space-16: 64px; /* Extra large spacing */
--space-20: 80px; /* Maximum spacing */
```

#### Semantic Spacing
- **Component**: 16px - Internal component padding
- **Section**: 32px - Between major sections
- **Page**: 48px - Page margins and container spacing
- **Container**: 24px - Card and container internal spacing

### Border Radius System

```css
--radius-none: 0px;
--radius-sm: 4px;    /* Small elements */
--radius-md: 8px;    /* Buttons, inputs */
--radius-lg: 12px;   /* Cards, modals */
--radius-xl: 16px;   /* Large containers */
--radius-2xl: 24px;  /* Hero elements */
--radius-full: 9999px; /* Pills, badges */
```

### Shadow System

#### Light Theme Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

#### Dark Theme Shadows
```css
--shadow-sm-dark: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md-dark: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
--shadow-lg-dark: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
--shadow-xl-dark: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
```

## Component Guidelines

### Sidebar Navigation

#### Specifications
- **Collapsed Width**: 64px
- **Expanded Width**: 280px
- **Item Height**: 44px (meets accessibility touch target)
- **Item Padding**: 12px horizontal, 8px vertical
- **Icon Size**: 20px (md) for navigation icons
- **Border Radius**: 8px for navigation items

#### Navigation Hierarchy
1. **Dashboard** - Overview and quick access
2. **Projekte** - Expandable with sub-items
   - Project A
   - Project B
   - Add Project
3. **Tasks** - Task management
4. **Routines** - Automated workflows and habits
5. **Kalender** - Calendar and scheduling
6. **Intelligence** - Analytics and insights
7. **Settings** - Configuration and preferences

### Buttons

#### Primary Button
```css
.rix-btn-primary {
  background: var(--rix-accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  min-height: 44px;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.rix-btn-primary:hover {
  background: var(--rix-accent-hover);
  transform: translateY(-1px);
}
```

#### Secondary Button
```css
.rix-btn-secondary {
  background: transparent;
  color: var(--rix-text-primary);
  border: 1px solid var(--rix-border-primary);
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  min-height: 44px;
}

.rix-btn-secondary:hover {
  background: var(--rix-bg-secondary);
  border-color: var(--rix-accent-primary);
}
```

### Cards

#### Standard Card
```css
.rix-card {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 200ms ease;
}

.rix-card:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-md);
}
```

### Forms

#### Input Fields
```css
.rix-input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  background: var(--rix-bg-secondary);
  border: 1px solid var(--rix-border-primary);
  border-radius: 8px;
  font-size: 16px; /* Prevents zoom on iOS */
  transition: border-color 150ms ease;
}

.rix-input:focus {
  border-color: var(--rix-accent-primary);
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}
```

## Brand Voice & Tone

### Voice Characteristics
- **Intelligent**: Demonstrates understanding without being condescending
- **Helpful**: Focused on user success and productivity
- **Clear**: Simple, direct communication
- **Professional**: Appropriate for business and personal use
- **Encouraging**: Positive, supportive tone

### Tone Guidelines

#### Writing Principles
1. **Be Concise**: Get to the point quickly
2. **Be Clear**: Use simple, understandable language
3. **Be Consistent**: Maintain tone across all touchpoints
4. **Be Human**: Warm and approachable, not robotic
5. **Be Helpful**: Always focus on user benefit

#### Message Types

**Welcome Messages**
- "Willkommen zurück, [Name]!"
- "Bereit für einen produktiven Tag?"
- "Was möchten Sie heute erreichen?"

**Error Messages**
- "Das hat nicht geklappt. Versuchen Sie es erneut."
- "Verbindung unterbrochen. Prüfen Sie Ihre Internetverbindung."
- "Etwas ist schiefgelaufen. Wir arbeiten daran."

**Success Messages**
- "Erfolgreich gespeichert!"
- "Aufgabe abgeschlossen!"
- "Termin wurde hinzugefügt."

**Call-to-Action Buttons**
- "Loslegen"
- "Projekt erstellen"
- "Einstellungen öffnen"
- "Jetzt starten"

### Language Guidelines

**DO:**
- Use active voice
- Write in present tense
- Use inclusive language
- Be specific and actionable
- Use German for primary interface

**DON'T:**
- Use jargon or technical terms unnecessarily
- Be overly casual or familiar
- Use negative language
- Make assumptions about user knowledge
- Mix languages unnecessarily

## Implementation Guidelines

### Design Token Integration

#### CSS Custom Properties
All design tokens should be implemented as CSS custom properties for easy theme switching:

```css
:root {
  /* Light theme tokens */
  --rix-bg-primary: #FFFFFF;
  /* ... other light theme tokens */
}

[data-theme="dark"] {
  /* Dark theme tokens */
  --rix-bg-primary: #1A1A1A;
  /* ... other dark theme tokens */
}
```

#### Tailwind Configuration
Extend Tailwind CSS configuration to include RIX design tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'rix-bg': {
          primary: 'var(--rix-bg-primary)',
          secondary: 'var(--rix-bg-secondary)',
        },
        'rix-text': {
          primary: 'var(--rix-text-primary)',
          secondary: 'var(--rix-text-secondary)',
        },
        // ... other tokens
      }
    }
  }
}
```

### Component Library Structure

```
/components
  /ui
    /button
    /card
    /input
    /sidebar
  /icons
    /navigation
    /actions
    /status
  /layout
    /sidebar-navigation
    /page-header
    /container
```

### Responsive Design Principles

#### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

#### Mobile-First Approach
1. Design for mobile first
2. Progressive enhancement for larger screens
3. Touch-friendly interface elements (44px minimum)
4. Optimized for one-handed use

### Accessibility Standards

#### WCAG 2.1 AA Compliance
- Color contrast ratios meet minimum standards
- All interactive elements are keyboard accessible
- Screen reader friendly markup
- Focus indicators are clearly visible
- Touch targets meet minimum size requirements

#### Implementation Checklist
- [ ] Color contrast validated
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility verified
- [ ] Touch target sizes confirmed
- [ ] Focus management implemented
- [ ] Alt text for all images
- [ ] Proper heading hierarchy
- [ ] Semantic HTML structure

## Brand Asset Management

### File Organization
```
/brand-assets
  /logos
    /svg          # Vector formats for web/print
    /png          # Raster formats, multiple sizes
    /favicon      # Web icons
  /colors
    /swatches     # Design tool swatches
    /css          # CSS custom properties
  /typography
    /fonts        # Font files
    /specimens    # Usage examples
  /icons
    /svg          # Individual icon files
    /sprite       # Icon sprite sheets
    /library      # Complete icon library
  /templates
    /figma        # Design templates
    /code         # Code components
```

### Version Control
- All brand assets are version controlled
- Changes require approval from brand guardian
- Migration guides for major updates
- Backward compatibility considerations

### Usage Rights
- Internal use: Full rights for RIX team
- External use: Requires written permission
- Modifications: Must follow brand guidelines
- Attribution: Required for external usage

## Quality Assurance

### Brand Compliance Checklist

#### Visual Elements
- [ ] Correct color usage (hex values match exactly)
- [ ] Proper logo placement and sizing
- [ ] Consistent typography implementation
- [ ] Icon style compliance
- [ ] Spacing system adherence
- [ ] Border radius consistency

#### Interactive Elements
- [ ] Hover states implemented
- [ ] Focus states accessible
- [ ] Animation timing consistent
- [ ] Touch targets meet minimum size
- [ ] Feedback provided for user actions

#### Content
- [ ] Voice and tone guidelines followed
- [ ] Language consistency maintained
- [ ] Error messages are helpful
- [ ] Success states are celebratory
- [ ] Microcopy supports user goals

### Testing Requirements

#### Browser Support
- Chrome/Chromium (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

#### Device Testing
- iPhone (multiple sizes)
- Android (multiple sizes)
- iPad/tablet
- Desktop (multiple resolutions)

#### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Touch target size verification

---

## Appendix

### Brand Evolution History
- **Version 1.0**: Initial brand guidelines established
- **Current**: Dark-first design system with dual theme support

### References
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Contact
For brand guideline questions or approvals, contact the Brand Guardian team.

---

*Last updated: August 2, 2025*
*Version: 1.0*