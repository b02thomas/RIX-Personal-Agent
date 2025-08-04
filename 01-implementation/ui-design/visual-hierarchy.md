# Visual Hierarchy & Typography Specifications

## Typography System

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Typography Scale

#### Display & Headings
```css
/* Dashboard Title */
.text-display {
  font-size: 2rem;        /* 32px */
  font-weight: 700;       /* bold */
  line-height: 1.2;       /* 38.4px */
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

/* Card Titles */
.text-title {
  font-size: 1.25rem;     /* 20px */
  font-weight: 600;       /* semibold */
  line-height: 1.3;       /* 26px */
  color: var(--text-primary);
}

/* Section Headers */
.text-heading {
  font-size: 1.125rem;    /* 18px */
  font-weight: 600;       /* semibold */
  line-height: 1.4;       /* 25.2px */
  color: var(--text-primary);
}
```

#### Body Text
```css
/* Primary Body Text */
.text-body {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;       /* normal */
  line-height: 1.5;       /* 21px */
  color: var(--text-primary);
}

/* Secondary Text */
.text-body-secondary {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;       /* normal */
  line-height: 1.5;       /* 21px */
  color: var(--text-secondary);
}

/* Small Text */
.text-small {
  font-size: 0.75rem;     /* 12px */
  font-weight: 400;       /* normal */
  line-height: 1.4;       /* 16.8px */
  color: var(--text-secondary);
}
```

#### Interface Text
```css
/* Button Text */
.text-button {
  font-size: 0.875rem;    /* 14px */
  font-weight: 500;       /* medium */
  line-height: 1.4;       /* 19.6px */
  letter-spacing: 0.01em;
}

/* Input Labels */
.text-label {
  font-size: 0.75rem;     /* 12px */
  font-weight: 500;       /* medium */
  line-height: 1.4;       /* 16.8px */
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Color Hierarchy

### Primary Colors
```css
:root {
  /* Text Colors */
  --text-primary: #FFFFFF;           /* Primary text on dark backgrounds */
  --text-secondary: #A0AEC0;         /* Secondary text, descriptions */
  --text-muted: #718096;             /* Muted text, timestamps */
  --text-inverse: #1A202C;           /* Text on light backgrounds */
  
  /* Brand Colors */
  --primary-blue: #0066FF;           /* Primary brand color */
  --primary-blue-dark: #0052CC;      /* Hover/active states */
  --primary-blue-light: #3182F6;     /* Disabled/light states */
  
  /* Background Colors */
  --background-dark: #0F1115;        /* Page background */
  --card-background: #1A1D23;        /* Card/container backgrounds */
  --surface-elevated: #2D3748;       /* Elevated surfaces */
  
  /* Border Colors */
  --border-color: #2D3748;           /* Default borders */
  --border-hover: #4A5568;           /* Hover state borders */
  --border-focus: #0066FF;           /* Focus state borders */
  
  /* Status Colors */
  --success: #38A169;                /* Success states */
  --warning: #D69E2E;                /* Warning states */
  --error: #E53E3E;                  /* Error states */
  --info: #3182F6;                   /* Info states */
}
```

### Color Usage Hierarchy

#### Level 1: Primary Attention
- **Chat Interface**: Highest contrast, primary blue accents
- **User Messages**: Primary blue background
- **Primary CTA Buttons**: Primary blue background

#### Level 2: Secondary Information  
- **Sidebar Cards**: Card background with subtle borders
- **AI Messages**: Muted background with primary text
- **Secondary Buttons**: Outline style with primary blue border

#### Level 3: Supporting Elements
- **Timestamps**: Muted text color
- **Descriptions**: Secondary text color
- **Inactive States**: Muted colors with reduced opacity

## Spacing System

### Systematic Spacing Scale
```css
:root {
  --space-1: 4px;     /* Micro spacing */
  --space-2: 8px;     /* Small spacing */
  --space-3: 12px;    /* Medium-small spacing */
  --space-4: 16px;    /* Medium spacing */
  --space-5: 20px;    /* Medium-large spacing */
  --space-6: 24px;    /* Large spacing */
  --space-8: 32px;    /* Extra large spacing */
  --space-10: 40px;   /* XXL spacing */
  --space-12: 48px;   /* Container spacing */
}
```

### Component Spacing Rules

#### Chat Interface
```css
.chat-container {
  padding: 0;                    /* No container padding */
}

.chat-header {
  padding: var(--space-4) var(--space-4); /* 16px all sides */
}

.message-area {
  padding: var(--space-4);       /* 16px all sides */
  gap: var(--space-4);           /* 16px between messages */
}

.input-area {
  padding: var(--space-4);       /* 16px all sides */
  gap: var(--space-3);           /* 12px between elements */
}
```

#### Sidebar Cards
```css
.sidebar-container {
  gap: var(--space-4);           /* 16px between cards */
}

.stats-card {
  padding: var(--space-4);       /* 16px all sides */
  gap: var(--space-3);           /* 12px internal spacing */
}

.quick-actions {
  padding: var(--space-4);       /* 16px all sides */
  gap: var(--space-2);           /* 8px between buttons */
}
```

#### Layout Spacing
```css
.main-grid {
  gap: var(--space-6);           /* 24px between major sections */
  padding: var(--space-6);       /* 24px container padding */
}

.mobile-layout {
  gap: var(--space-4);           /* 16px on mobile */
  padding: var(--space-4);       /* 16px container padding */
}
```

## Visual Weight & Hierarchy

### Primary Focus: Chat Interface
- **Size**: 60% of viewport width
- **Position**: Left side, primary visual area
- **Contrast**: Highest contrast ratios
- **Elevation**: Subtle shadow for depth
- **Border**: 1px solid border for definition

### Secondary Focus: Sidebar Stats
- **Size**: 25% of viewport width  
- **Position**: Right side, supporting area
- **Contrast**: Medium contrast ratios
- **Elevation**: Minimal shadow
- **Border**: Subtle borders for separation

### Tertiary Elements: Navigation & UI
- **Size**: Proportional to importance
- **Position**: Header and edges
- **Contrast**: Lower contrast, muted colors
- **Elevation**: Flat or minimal

## Interactive States

### Button States
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-blue);
  color: white;
  transition: all 200ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 102, 255, 0.2);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  transition: all 200ms ease-out;
}

.btn-outline:hover {
  border-color: var(--primary-blue);
  color: var(--primary-blue);
  background: rgba(0, 102, 255, 0.05);
}
```

### Card States
```css
.card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 200ms ease-out;
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Focus States
```css
.focus-ring {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}
```

## Responsive Typography

### Mobile Adjustments
```css
@media (max-width: 768px) {
  .text-display {
    font-size: 1.75rem;     /* 28px */
  }
  
  .text-title {
    font-size: 1.125rem;    /* 18px */
  }
  
  .text-body {
    font-size: 1rem;        /* 16px - larger for mobile */
  }
}
```

### Touch Target Sizes
- **Minimum Touch Target**: 44px x 44px
- **Preferred Touch Target**: 48px x 48px
- **Button Spacing**: Minimum 8px between touch targets
- **Text Link Padding**: 12px vertical minimum