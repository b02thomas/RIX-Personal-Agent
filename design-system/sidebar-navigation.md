# Sidebar Navigation Design Specification

## Overview
Complete design specification for transforming RIX from current grid-based module layout to hierarchical sidebar navigation system with collapsible sections and responsive mobile behavior.

## Current State Analysis
- **Existing**: Grid-based dashboard with 6 modules displayed as cards
- **Navigation Items**: RIX (Voice/Chat), Smart Calendar, Intelligence Overview, News Intelligence, N8N Workflows, Settings & Integrations
- **Target**: Hierarchical sidebar with Dashboard, Projekte (expandable), Tasks, Routines, Kalender, Intelligence, Settings

## Sidebar Navigation Hierarchy

### Primary Navigation Structure
```
📊 Dashboard
📁 Projekte ▶ (expandable)
   └── 🗂️ Project A
   └── 🗂️ Project B  
   └── ➕ Projekt hinzufügen
☑️ Tasks
🔄 Routines
📅 Kalender
📈 Intelligence
⚙️ Settings
```

## Design Specifications

### Layout Dimensions
```css
/* Sidebar Container */
.rix-sidebar {
  width: var(--sidebar-width-expanded, 280px);
  min-width: var(--sidebar-width-collapsed, 64px);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  background: var(--rix-bg-secondary);
  border-right: 1px solid var(--rix-border-primary);
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Collapsed State */
.rix-sidebar--collapsed {
  width: var(--sidebar-width-collapsed, 64px);
}

/* Main Content Adjustment */
.rix-main-content {
  margin-left: var(--sidebar-width-expanded, 280px);
  transition: margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.rix-main-content--sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed, 64px);
}
```

### Navigation Item Specifications
```css
.rix-nav-item {
  height: 44px; /* Meets accessibility touch target */
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--rix-text-secondary);
  transition: all 150ms ease;
  cursor: pointer;
  position: relative;
}

.rix-nav-item:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
}

.rix-nav-item--active {
  background: var(--rix-accent-primary);
  color: white;
}

.rix-nav-item__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.rix-nav-item__label {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 150ms ease;
}

/* Collapsed State - Hide Labels */
.rix-sidebar--collapsed .rix-nav-item__label {
  opacity: 0;
  width: 0;
}

.rix-nav-item__expand-icon {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 200ms ease;
}

.rix-nav-item--expanded .rix-nav-item__expand-icon {
  transform: rotate(90deg);
}
```

### Sub-Navigation (Projects) Specifications
```css
.rix-nav-submenu {
  margin-left: 32px;
  margin-top: 4px;
  margin-bottom: 8px;
  border-left: 2px solid var(--rix-border-secondary);
  padding-left: 8px;
}

.rix-nav-submenu-item {
  height: 36px;
  padding: 6px 8px;
  margin: 1px 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rix-text-tertiary);
  font-size: 0.8125rem;
  transition: all 150ms ease;
  cursor: pointer;
}

.rix-nav-submenu-item:hover {
  background: var(--rix-surface);
  color: var(--rix-text-secondary);
}

.rix-nav-submenu-item--active {
  background: var(--rix-accent-primary)/10;
  color: var(--rix-accent-primary);
  border-left: 2px solid var(--rix-accent-primary);
}

.rix-nav-submenu-item__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Hide submenu when collapsed */
.rix-sidebar--collapsed .rix-nav-submenu {
  display: none;
}
```

### Sidebar Header & Branding
```css
.rix-sidebar-header {
  height: 64px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--rix-border-primary);
  margin-bottom: 16px;
}

.rix-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rix-sidebar-brand__icon {
  width: 32px;
  height: 32px;
  color: var(--rix-accent-primary);
}

.rix-sidebar-brand__text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rix-text-primary);
  white-space: nowrap;
  transition: opacity 150ms ease;
}

.rix-sidebar--collapsed .rix-sidebar-brand__text {
  opacity: 0;
  width: 0;
}

.rix-sidebar-toggle {
  margin-left: auto;
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

.rix-sidebar-toggle:hover {
  background: var(--rix-surface);
  color: var(--rix-text-primary);
}
```

### Sidebar Footer
```css
.rix-sidebar-footer {
  position: absolute;
  bottom: 16px;
  left: 8px;
  right: 8px;
  padding: 12px 8px;
  border-top: 1px solid var(--rix-border-primary);
}

.rix-sidebar-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  transition: background 150ms ease;
  cursor: pointer;
}

.rix-sidebar-user:hover {
  background: var(--rix-surface);
}

.rix-sidebar-user__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--rix-accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.rix-sidebar-user__info {
  flex: 1;
  min-width: 0;
}

.rix-sidebar-user__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rix-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rix-sidebar-user__email {
  font-size: 0.75rem;
  color: var(--rix-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Hide user info when collapsed */
.rix-sidebar--collapsed .rix-sidebar-user__info {
  display: none;
}
```

## Responsive Behavior Specifications

### Desktop (1024px+)
- **Default State**: Expanded sidebar (280px width)
- **Collapsible**: User can toggle to collapsed state (64px width)
- **Persistent**: State persists across sessions
- **Smooth Transitions**: 200ms ease for all state changes

### Tablet (768px - 1023px)
- **Default State**: Collapsed sidebar (64px width)
- **Expandable**: Hover or click to temporarily expand
- **Auto-Collapse**: Returns to collapsed after interaction
- **Touch Optimization**: Larger touch targets

### Mobile (< 768px)
- **Hidden Sidebar**: Sidebar transforms to mobile bottom navigation
- **Bottom Navigation**: 5 primary items visible
- **Drawer Menu**: Secondary items accessible via hamburger menu
- **Safe Area**: Respects device safe areas

## Mobile Navigation Specifications

### Bottom Navigation Bar
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
}

.rix-mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--rix-text-tertiary);
  text-decoration: none;
  transition: color 150ms ease;
  padding: 8px 4px;
  min-height: 44px;
}

.rix-mobile-nav-item--active {
  color: var(--rix-accent-primary);
}

.rix-mobile-nav-item__icon {
  width: 20px;
  height: 20px;
}

.rix-mobile-nav-item__label {
  font-size: 0.625rem;
  font-weight: 500;
  text-align: center;
  line-height: 1;
}

/* Main content adjustment for mobile nav */
.rix-main-content--mobile {
  margin-left: 0;
  padding-bottom: 72px;
}
```

### Mobile Drawer Menu
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
  transition: transform 200ms ease;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
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
  background: var(--rix-semantic-overlay);
  opacity: 0;
  visibility: hidden;
  transition: all 200ms ease;
  z-index: 99;
}

.rix-mobile-drawer-overlay--visible {
  opacity: 1;
  visibility: visible;
}
```

## Navigation Icon Specifications

### Icon Library Requirements
All icons use 20px size for navigation, 1.5px stroke width, rounded line caps:

```typescript
// Navigation Icons Mapping
const navigationIcons = {
  dashboard: 'LayoutGrid', // 3x3 grid pattern
  projects: 'FolderOpen', // Folder with expansion indicator  
  tasks: 'CheckSquare', // Square with checkmark
  routines: 'RotateCcw', // Circular arrow repeat symbol
  calendar: 'Calendar', // Calendar with date indicators
  intelligence: 'BarChart3', // Bar chart with trend lines
  settings: 'Settings', // Gear/cog wheel
  // Project sub-items
  project: 'Folder', // Individual project folder
  addProject: 'PlusCircle', // Add new project
  // User/Footer
  user: 'User',
  logout: 'LogOut'
};
```

## Interaction States & Feedback

### Hover States
- **Background**: Subtle background color change to surface color
- **Text Color**: Transition from secondary to primary text color
- **Duration**: 150ms ease transition
- **Icon**: No color change (maintains consistency)

### Active States
- **Background**: Primary accent color
- **Text Color**: White for contrast
- **Border**: Optional left border accent for hierarchy
- **Icon**: White color to match text

### Focus States (Accessibility)
```css
.rix-nav-item:focus {
  outline: 2px solid var(--rix-accent-primary);
  outline-offset: 2px;
}

.rix-nav-item:focus:not(:focus-visible) {
  outline: none;
}
```

### Loading States
- **Icon**: Spinning animation for async operations
- **Text**: Subtle opacity reduction
- **Disable**: Pointer events disabled during loading

## Accessibility Specifications

### Keyboard Navigation
- **Tab Order**: Logical top-to-bottom navigation
- **Arrow Keys**: Up/down navigation within sidebar
- **Enter/Space**: Activate navigation items
- **Escape**: Close expanded sections or mobile drawer

### Screen Reader Support
```html
<!-- Example markup with proper ARIA labels -->
<nav aria-label="Hauptnavigation" role="navigation">
  <ul role="list">
    <li role="listitem">
      <a href="/dashboard" 
         aria-current="page"
         class="rix-nav-item rix-nav-item--active">
        <LayoutGrid aria-hidden="true" class="rix-nav-item__icon" />
        <span class="rix-nav-item__label">Dashboard</span>
      </a>
    </li>
    <li role="listitem">
      <button aria-expanded="false" 
              aria-controls="projects-submenu"
              class="rix-nav-item">
        <FolderOpen aria-hidden="true" class="rix-nav-item__icon" />
        <span class="rix-nav-item__label">Projekte</span>
        <ChevronRight aria-hidden="true" class="rix-nav-item__expand-icon" />
      </button>
      <ul id="projects-submenu" 
          role="list" 
          aria-label="Projekt-Unterpunkte"
          class="rix-nav-submenu">
        <!-- Sub-items -->
      </ul>
    </li>
  </ul>
</nav>
```

### Touch Target Requirements
- **Minimum Size**: 44px height for all interactive elements
- **Touch Spacing**: 8px minimum between touch targets
- **Visual Feedback**: Clear hover/active states for touch devices

## Theme Integration

### Dark Theme (Default)
```css
:root[data-theme="dark"] {
  --sidebar-bg: var(--rix-bg-secondary); /* #121212 */
  --sidebar-surface: var(--rix-surface); /* #2C2C2C */
  --sidebar-border: var(--rix-border-primary); /* #333333 */
  --sidebar-text-primary: var(--rix-text-primary); /* #FFFFFF */
  --sidebar-text-secondary: var(--rix-text-secondary); /* #D1D5DB */
  --sidebar-text-tertiary: var(--rix-text-tertiary); /* #9CA3AF */
  --sidebar-accent: var(--rix-accent-primary); /* #60A5FA */
}
```

### Light Theme
```css
:root[data-theme="light"] {
  --sidebar-bg: var(--rix-bg-secondary); /* #F8F9FA */
  --sidebar-surface: var(--rix-surface); /* #FFFFFF */
  --sidebar-border: var(--rix-border-primary); /* #E5E7EB */
  --sidebar-text-primary: var(--rix-text-primary); /* #1F2937 */
  --sidebar-text-secondary: var(--rix-text-secondary); /* #6B7280 */
  --sidebar-text-tertiary: var(--rix-text-tertiary); /* #9CA3AF */
  --sidebar-accent: var(--rix-accent-primary); /* #3B82F6 */
}
```

## Animation Specifications

### Sidebar Collapse/Expand
```css
@keyframes sidebar-expand {
  from {
    width: var(--sidebar-width-collapsed);
  }
  to {
    width: var(--sidebar-width-expanded);
  }
}

@keyframes sidebar-collapse {
  from {
    width: var(--sidebar-width-expanded);
  }
  to {
    width: var(--sidebar-width-collapsed);
  }
}

.rix-sidebar {
  animation-duration: 200ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: forwards;
}
```

### Project Submenu Expand/Collapse
```css
@keyframes submenu-expand {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: auto;
    opacity: 1;
  }
}

@keyframes submenu-collapse {
  from {
    height: auto;
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}

.rix-nav-submenu {
  overflow: hidden;
  animation-duration: 200ms;
  animation-timing-function: ease-out;
}
```

### Mobile Drawer Slide
```css
@keyframes drawer-slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes drawer-slide-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
```

## Integration with Existing Components

### shadcn/ui Component Usage
- **Button**: Used for toggle controls and actions
- **Separator**: For visual sections in sidebar
- **Tooltip**: For collapsed state labels
- **DropdownMenu**: For user profile menu
- **Sheet**: For mobile drawer implementation

### Preserving Current Architecture
- **Next.js App Router**: All navigation uses Next.js Link components
- **Client Components**: Sidebar state managed with React state
- **Server Components**: Static navigation structure
- **TypeScript**: Full type safety for navigation structure

## Implementation Notes

### State Management
```typescript
interface SidebarState {
  isCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  expandedSections: string[];
  activeNavItem: string;
}

const useSidebarState = () => {
  const [state, setState] = useState<SidebarState>({
    isCollapsed: false,
    isMobileDrawerOpen: false,
    expandedSections: [],
    activeNavItem: 'dashboard'
  });
  
  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setState(prev => ({ ...prev, isCollapsed: JSON.parse(saved) }));
    }
  }, []);
  
  return { state, setState };
};
```

### Responsive Breakpoint Logic
```typescript
const useResponsiveNavigation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkBreakpoint = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  return { isMobile, isTablet };
};
```

This comprehensive sidebar navigation design specification provides a complete foundation for transforming RIX from its current grid-based layout to a professional, hierarchical navigation system that scales from mobile to desktop while maintaining the established brand guidelines and accessibility standards.