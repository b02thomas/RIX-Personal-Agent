# Component Design Specifications

## Overview
Detailed component specifications for RIX Personal Agent, building upon the established brand guidelines and sidebar navigation system. Each component is designed for rapid development with clear props, states, and integration points.

## Component Architecture

### Design System Hierarchy
```
RIX Design System
├── Layout Components
│   ├── SidebarNavigation
│   ├── PageHeader
│   ├── MainContent
│   └── MobileBottomNav
├── Data Display Components
│   ├── RoutineBox
│   ├── ProjectCard
│   ├── CalendarTimeBlock
│   ├── DashboardWidget
│   └── IntelligenceChart
├── Interactive Components
│   ├── ThemeToggle
│   ├── ProjectSelector
│   ├── RoutineCoaching
│   └── SmartSuggestions
└── Foundation Components (shadcn/ui)
    ├── Button, Card, Input
    └── Sheet, Tooltip, Badge
```

## Core Component Specifications

### 1. RoutineBox Component

#### Purpose
Display routine cards with coaching integration and progress tracking for habit formation.

#### Visual Design
```css
.rix-routine-box {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 200ms ease;
  min-height: 160px;
}

.rix-routine-box:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.rix-routine-box--completed {
  border-color: var(--rix-success);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(52, 211, 153, 0.05) 100%);
}

.rix-routine-box--overdue {
  border-color: var(--rix-error);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(248, 113, 113, 0.05) 100%);
}
```

#### Component Structure
```typescript
interface RoutineBoxProps {
  routine: {
    id: string;
    title: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    streak: number;
    lastCompleted?: Date;
    nextDue: Date;
    category: 'health' | 'productivity' | 'learning' | 'personal';
    progress: number; // 0-100
  };
  coaching?: {
    message: string;
    motivation: string;
    tips: string[];
  };
  onComplete: (routineId: string) => void;
  onSkip: (routineId: string) => void;
  onViewDetails: (routineId: string) => void;
}

const RoutineBox: React.FC<RoutineBoxProps> = ({ routine, coaching, onComplete, onSkip, onViewDetails }) => {
  // Component implementation
};
```

#### Header Section
```css
.rix-routine-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rix-routine-category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--rix-accent-primary)/10;
  color: var(--rix-accent-primary);
}

.rix-routine-streak {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--rix-warning);
  font-size: 0.875rem;
  font-weight: 600;
}
```

#### Progress Section
```css
.rix-routine-progress {
  margin: 16px 0;
}

.rix-routine-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--rix-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.rix-routine-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--rix-success) 0%, var(--rix-accent-primary) 100%);
  border-radius: 3px;
  transition: width 300ms ease;
}
```

#### Coaching Integration
```css
.rix-routine-coaching {
  background: var(--rix-bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  border-left: 3px solid var(--rix-accent-primary);
}

.rix-routine-coaching-message {
  font-size: 0.875rem;
  color: var(--rix-text-secondary);
  line-height: 1.4;
  margin-bottom: 8px;
}

.rix-routine-coaching-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rix-routine-coaching-tip {
  background: var(--rix-accent-primary)/10;
  color: var(--rix-accent-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
```

#### Action Buttons
```css
.rix-routine-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.rix-routine-btn-complete {
  background: var(--rix-success);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  flex: 1;
}

.rix-routine-btn-complete:hover {
  background: var(--rix-success)/90;
  transform: translateY(-1px);
}

.rix-routine-btn-skip {
  background: transparent;
  color: var(--rix-text-tertiary);
  border: 1px solid var(--rix-border-primary);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 150ms ease;
}
```

### 2. ProjectCard Component

#### Purpose
Display project information with AI status indicators and progress tracking.

#### Visual Design
```css
.rix-project-card {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 200ms ease;
  min-height: 200px;
}

.rix-project-card:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.rix-project-card--featured {
  border: 2px solid var(--rix-accent-primary);
  background: linear-gradient(135deg, var(--rix-surface) 0%, rgba(96, 165, 250, 0.02) 100%);
}
```

#### Component Structure
```typescript
interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'on-hold' | 'completed';
    progress: number; // 0-100
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    teamMembers: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
    tags: string[];
  };
  aiStatus?: {
    isActive: boolean;
    lastUpdate: Date;
    insights: string[];
    recommendations: string[];
  };
  onOpen: (projectId: string) => void;
  onEdit: (projectId: string) => void;
  onArchive: (projectId: string) => void;
}
```

#### Header with AI Status
```css
.rix-project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.rix-project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--rix-text-primary);
  line-height: 1.3;
  margin-bottom: 4px;
}

.rix-project-status-indicator {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rix-ai-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.rix-ai-status--active {
  background: var(--rix-success);
  animation: pulse 2s infinite;
}

.rix-ai-status--inactive {
  background: var(--rix-text-quaternary);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.rix-ai-status::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.3;
  animation: ping 2s infinite;
}

@keyframes ping {
  0% { opacity: 0.3; transform: scale(1); }
  75%, 100% { opacity: 0; transform: scale(1.5); }
}
```

#### Priority & Status Badges
```css
.rix-project-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.rix-priority-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

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
  animation: urgent-pulse 1.5s infinite;
}

@keyframes urgent-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.rix-status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.rix-status-badge--planning {
  background: var(--rix-text-quaternary)/20;
  color: var(--rix-text-quaternary);
}

.rix-status-badge--active {
  background: var(--rix-success)/20;
  color: var(--rix-success);
}

.rix-status-badge--on-hold {
  background: var(--rix-warning)/20;
  color: var(--rix-warning);
}

.rix-status-badge--completed {
  background: var(--rix-accent-primary)/20;
  color: var(--rix-accent-primary);
}
```

#### Progress & Team Section
```css
.rix-project-progress {
  margin: 16px 0;
}

.rix-project-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.rix-project-progress-label {
  font-size: 0.875rem;
  color: var(--rix-text-secondary);
}

.rix-project-progress-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rix-text-primary);
}

.rix-project-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--rix-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.rix-project-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--rix-accent-primary) 0%, var(--rix-accent-hover) 100%);
  border-radius: 4px;
  transition: width 400ms ease;
}

.rix-project-team {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
}

.rix-project-team-avatars {
  display: flex;
  margin-left: -4px;
}

.rix-project-team-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--rix-surface);
  background: var(--rix-accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: -4px;
  position: relative;
  z-index: 1;
}

.rix-project-team-count {
  font-size: 0.875rem;
  color: var(--rix-text-secondary);
  margin-left: 4px;
}
```

#### AI Insights Section
```css
.rix-project-ai-insights {
  background: var(--rix-bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  border-left: 3px solid var(--rix-accent-primary);
}

.rix-project-ai-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.rix-project-ai-icon {
  width: 16px;
  height: 16px;
  color: var(--rix-accent-primary);
}

.rix-project-ai-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rix-text-primary);
}

.rix-project-ai-content {
  font-size: 0.875rem;
  color: var(--rix-text-secondary);
  line-height: 1.4;
}

.rix-project-ai-recommendations {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.rix-project-ai-recommendation {
  background: var(--rix-accent-primary)/10;
  color: var(--rix-accent-primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
```

### 3. CalendarTimeBlock Component

#### Purpose
Display calendar time slots with intelligent suggestions and availability indicators.

#### Visual Design
```css
.rix-calendar-time-block {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  transition: all 150ms ease;
  min-height: 80px;
  cursor: pointer;
}

.rix-calendar-time-block:hover {
  border-color: var(--rix-accent-primary);
  box-shadow: var(--shadow-sm);
}

.rix-calendar-time-block--busy {
  background: var(--rix-error)/5;
  border-color: var(--rix-error)/30;
}

.rix-calendar-time-block--available {
  background: var(--rix-success)/5;
  border-color: var(--rix-success)/30;
}

.rix-calendar-time-block--suggested {
  background: linear-gradient(135deg, var(--rix-accent-primary)/5 0%, var(--rix-accent-primary)/10 100%);
  border-color: var(--rix-accent-primary);
  border-style: dashed;
}
```

#### Component Structure
```typescript
interface CalendarTimeBlockProps {
  timeSlot: {
    id: string;
    start: Date;
    end: Date;
    duration: number; // in minutes
    type: 'busy' | 'available' | 'suggested' | 'blocked';
  };
  event?: {
    title: string;
    description?: string;
    attendees: Array<{
      name: string;
      email: string;
      status: 'accepted' | 'declined' | 'pending';
    }>;
    location?: string;
    isRecurring?: boolean;
  };
  suggestion?: {
    title: string;
    confidence: number; // 0-100
    reason: string;
    benefits: string[];
  };
  onSelect: (timeSlotId: string) => void;
  onSuggestionAccept?: (suggestion: any) => void;
  onSuggestionDismiss?: (suggestionId: string) => void;
}
```

#### Time Header
```css
.rix-time-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.rix-time-block-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rix-text-primary);
}

.rix-time-block-duration {
  font-size: 0.75rem;
  color: var(--rix-text-tertiary);
  padding: 2px 6px;
  background: var(--rix-bg-secondary);
  border-radius: 4px;
}

.rix-time-block-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 8px;
  right: 8px;
}

.rix-time-block-status--busy {
  background: var(--rix-error);
}

.rix-time-block-status--available {
  background: var(--rix-success);
}

.rix-time-block-status--suggested {
  background: var(--rix-accent-primary);
  animation: pulse 2s infinite;
}
```

#### Event Content
```css
.rix-time-block-event {
  padding: 8px 0;
}

.rix-event-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rix-text-primary);
  line-height: 1.3;
  margin-bottom: 4px;
}

.rix-event-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rix-event-location {
  font-size: 0.75rem;
  color: var(--rix-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.rix-event-attendees {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rix-event-attendee-count {
  font-size: 0.75rem;
  color: var(--rix-text-secondary);
}
```

#### Intelligent Suggestions
```css
.rix-time-block-suggestion {
  background: var(--rix-accent-primary)/10;
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
  position: relative;
}

.rix-suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.rix-suggestion-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rix-accent-primary);
}

.rix-suggestion-confidence {
  font-size: 0.75rem;
  color: var(--rix-text-tertiary);
  padding: 1px 4px;
  background: var(--rix-accent-primary)/20;
  border-radius: 3px;
}

.rix-suggestion-reason {
  font-size: 0.75rem;
  color: var(--rix-text-secondary);
  line-height: 1.3;
  margin-bottom: 6px;
}

.rix-suggestion-actions {
  display: flex;
  gap: 6px;
}

.rix-suggestion-btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.rix-suggestion-btn--accept {
  background: var(--rix-success);
  color: white;
}

.rix-suggestion-btn--dismiss {
  background: transparent;
  color: var(--rix-text-tertiary);
  border: 1px solid var(--rix-border-primary);
}
```

### 4. ThemeToggle Component

#### Purpose
Allow users to switch between light and dark themes with visual feedback.

#### Visual Design
```css
.rix-theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: 14px;
  background: var(--rix-bg-secondary);
  border: 1px solid var(--rix-border-primary);
  cursor: pointer;
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  padding: 2px;
}

.rix-theme-toggle:hover {
  border-color: var(--rix-accent-primary);
}

.rix-theme-toggle--dark {
  background: var(--rix-accent-primary)/20;
  border-color: var(--rix-accent-primary);
}

.rix-theme-toggle-slider {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  position: absolute;
  left: 2px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.rix-theme-toggle--dark .rix-theme-toggle-slider {
  transform: translateX(28px);
  background: var(--rix-accent-primary);
  border-color: var(--rix-accent-primary);
  color: white;
}

.rix-theme-toggle-icon {
  width: 12px;
  height: 12px;
  color: var(--rix-text-secondary);
  transition: all 200ms ease;
}

.rix-theme-toggle--dark .rix-theme-toggle-icon {
  color: white;
}
```

#### Component Structure
```typescript
interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  theme, 
  onThemeChange, 
  size = 'md', 
  showLabel = false,
  className 
}) => {
  // Component implementation
};
```

### 5. DashboardWidget Component

#### Purpose
Modular widget system for dashboard with configurable content and actions.

#### Visual Design
```css
.rix-dashboard-widget {
  background: var(--rix-surface);
  border: 1px solid var(--rix-border-primary);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 200ms ease;
  height: fit-content;
}

.rix-dashboard-widget:hover {
  border-color: var(--rix-accent-primary)/50;
  box-shadow: var(--shadow-md);
}

.rix-dashboard-widget--interactive {
  cursor: pointer;
}

.rix-dashboard-widget--loading {
  opacity: 0.7;
  pointer-events: none;
}

.rix-dashboard-widget--error {
  border-color: var(--rix-error)/50;
  background: var(--rix-error)/5;
}
```

#### Component Structure
```typescript
interface DashboardWidgetProps {
  widget: {
    id: string;
    title: string;
    type: 'metric' | 'chart' | 'list' | 'activity' | 'quick-action';
    size: 'sm' | 'md' | 'lg' | 'xl';
    refreshInterval?: number;
  };
  data?: any;
  loading?: boolean;
  error?: string;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType;
    onClick: () => void;
  }>;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onRemove?: () => void;
}
```

#### Widget Header
```css
.rix-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rix-border-secondary);
}

.rix-widget-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rix-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.rix-widget-icon {
  width: 18px;
  height: 18px;
  color: var(--rix-accent-primary);
}

.rix-widget-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rix-widget-action {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rix-text-tertiary);
  cursor: pointer;
  transition: all 150ms ease;
}

.rix-widget-action:hover {
  background: var(--rix-bg-secondary);
  color: var(--rix-text-primary);
}
```

## Responsive Design Specifications

### Mobile Optimizations (< 768px)
```css
/* Mobile-specific component adjustments */
.rix-routine-box {
  padding: 16px;
  min-height: 140px;
}

.rix-project-card {
  padding: 16px;
  min-height: 180px;
}

.rix-calendar-time-block {
  padding: 10px;
  min-height: 70px;
}

.rix-dashboard-widget {
  padding: 16px;
}

/* Touch-friendly interactions */
.rix-routine-actions {
  gap: 12px;
}

.rix-routine-btn-complete,
.rix-routine-btn-skip {
  min-height: 44px;
  font-size: 0.9375rem;
}

/* Stack elements vertically on mobile */
@media (max-width: 767px) {
  .rix-project-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .rix-project-badges {
    order: -1;
  }
  
  .rix-widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .rix-widget-actions {
    align-self: flex-end;
  }
}
```

### Tablet Optimizations (768px - 1023px)
```css
/* Tablet-specific adjustments */
.rix-routine-box {
  padding: 18px;
  min-height: 150px;
}

.rix-project-card {
  padding: 18px;
  min-height: 190px;
}

/* Adjust grid layouts for tablet */
.rix-dashboard-widgets {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
```

### Desktop Optimizations (1024px+)
```css
/* Desktop-specific enhancements */
.rix-routine-box:hover .rix-routine-coaching {
  opacity: 1;
  transform: translateY(0);
}

.rix-project-card:hover .rix-project-ai-insights {
  opacity: 1;
  max-height: 200px;
}

/* Advanced hover effects for desktop */
.rix-calendar-time-block:hover .rix-time-block-suggestion {
  opacity: 1;
  transform: scale(1.02);
}
```

## Animation & Interaction Specifications

### Micro-interactions
```css
/* Button press feedback */
.rix-routine-btn-complete:active {
  transform: translateY(1px) scale(0.98);
}

/* Card hover elevations */
@keyframes card-hover {
  from {
    transform: translateY(0) scale(1);
    box-shadow: var(--shadow-sm);
  }
  to {
    transform: translateY(-2px) scale(1.01);
    box-shadow: var(--shadow-lg);
  }
}

/* Loading states */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.rix-skeleton {
  background: var(--rix-bg-secondary);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s infinite ease-in-out;
}

/* Success feedback */
@keyframes success-check {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

.rix-success-icon {
  animation: success-check 0.6s ease-out;
}
```

### Loading States
```css
.rix-component-loading {
  position: relative;
  overflow: hidden;
}

.rix-component-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
```

## Integration Notes

### shadcn/ui Component Usage
- **Base Components**: All custom components extend shadcn/ui base components
- **Styling**: Uses Tailwind classes compatible with shadcn/ui theme system
- **TypeScript**: Full type safety with shadcn/ui component props
- **Accessibility**: Inherits accessibility features from shadcn/ui components

### Design Token Integration
```typescript
// Example of how components use design tokens
const useComponentStyles = (theme: 'light' | 'dark') => {
  return {
    routine: {
      background: `var(--rix-surface)`,
      border: `1px solid var(--rix-border-primary)`,
      text: `var(--rix-text-primary)`,
      accent: `var(--rix-accent-primary)`
    },
    project: {
      // Similar token usage
    }
  };
};
```

### State Management Integration
```typescript
// Example state interfaces for components
interface ComponentState {
  routines: RoutineBoxProps['routine'][];
  projects: ProjectCardProps['project'][];
  calendar: CalendarTimeBlockProps['timeSlot'][];
  theme: 'light' | 'dark';
  coaching: Record<string, CoachingData>;
}

// Component state management
const useComponentState = () => {
  const [state, setState] = useState<ComponentState>();
  // State management logic
  return { state, setState };
};
```

This comprehensive component specification provides detailed design guidelines for implementing each component with proper styling, behavior, and integration points. Each component is designed to work seamlessly with the sidebar navigation system and overall RIX brand guidelines.