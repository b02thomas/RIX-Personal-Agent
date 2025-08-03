// /src/app/dashboard/prototype-test/page.tsx
// Prototype test page demonstrating new navigation components and design system integration
// Shows working examples of sidebar, theme toggle, mobile navigation, and responsive behavior
// RELEVANT FILES: enhanced-dashboard-layout.tsx, enhanced-sidebar.tsx, theme-toggle.tsx, navigation-store.ts

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigationStore, useResponsiveNavigation } from '@/store/navigation-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoutineBoxDemo, sampleRoutines, sampleCoaching } from '@/components/demo/routine-box-demo';

const PrototypeTestPage: React.FC = () => {
  const {
    isCollapsed,
    isMobileDrawerOpen,
    expandedSections,
    projects,
    activeProject,
    toggleSidebar,
    toggleMobileDrawer,
    toggleSection,
    setActiveProject,
    addProject,
    resetNavigation
  } = useNavigationStore();

  const { isMobile, isTablet } = useResponsiveNavigation();
  const { preferences } = usePreferencesStore();
  const [testMessage, setTestMessage] = useState('');

  const handleAddTestProject = () => {
    const projectName = `Test Project ${projects.length + 1}`;
    addProject({
      name: projectName,
      description: `Generated test project for prototype demonstration`,
      isActive: true,
      color: '#60A5FA'
    });
    setTestMessage(`Added "${projectName}" to navigation`);
    setTimeout(() => setTestMessage(''), 3000);
  };

  const handleResetNavigation = () => {
    resetNavigation();
    setTestMessage('Navigation reset to default state');
    setTimeout(() => setTestMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Phase 3 Navigation Prototype
        </h1>
        <p className="text-lg text-muted-foreground">
          Interactive demonstration of the enhanced navigation system with responsive behavior
        </p>
      </div>

      {/* Test Message */}
      {testMessage && (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            {testMessage}
          </p>
        </div>
      )}

      {/* Navigation State Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Navigation State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Responsive State</h3>
            <div className="space-y-1">
              <div className={cn(
                'flex items-center gap-2',
                isMobile ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isMobile ? 'bg-green-500' : 'bg-gray-300'
                )} />
                Mobile ({isMobile ? 'Active' : 'Inactive'})
              </div>
              <div className={cn(
                'flex items-center gap-2',
                isTablet ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isTablet ? 'bg-orange-500' : 'bg-gray-300'
                )} />
                Tablet ({isTablet ? 'Active' : 'Inactive'})
              </div>
              <div className={cn(
                'flex items-center gap-2',
                !isMobile && !isTablet ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  !isMobile && !isTablet ? 'bg-blue-500' : 'bg-gray-300'
                )} />
                Desktop ({!isMobile && !isTablet ? 'Active' : 'Inactive'})
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Sidebar State</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Collapsed:</span> {isCollapsed ? 'Yes' : 'No'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Mobile Drawer:</span> {isMobileDrawerOpen ? 'Open' : 'Closed'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Width:</span> {isCollapsed ? '64px' : '280px'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Theme State</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Theme:</span> {preferences.theme}
              </div>
              <div className="text-sm">
                <span className="font-medium">Language:</span> {preferences.language}
              </div>
              <div className="text-sm">
                <span className="font-medium">Active Projects:</span> {projects.filter(p => p.isActive).length}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Interactive Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation Controls */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground">Navigation Controls</h3>
            <div className="space-y-2">
              <Button
                onClick={toggleSidebar}
                variant="outline"
                className="w-full justify-start"
                disabled={isMobile}
              >
                {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                {isMobile && ' (Desktop Only)'}
              </Button>
              
              <Button
                onClick={toggleMobileDrawer}
                variant="outline"
                className="w-full justify-start"
                disabled={!isMobile}
              >
                {isMobileDrawerOpen ? 'Close Mobile Drawer' : 'Open Mobile Drawer'}
                {!isMobile && ' (Mobile Only)'}
              </Button>
              
              <Button
                onClick={() => toggleSection('projects')}
                variant="outline"
                className="w-full justify-start"
              >
                {expandedSections.includes('projects') ? 'Collapse Projects' : 'Expand Projects'}
              </Button>
            </div>
          </div>

          {/* Theme Controls */}
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground">Theme Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme Toggle (Small):</span>
                <ThemeToggle size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme Toggle (Medium):</span>
                <ThemeToggle size="md" showLabel />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme Toggle (Large):</span>
                <ThemeToggle size="lg" showLabel showSystemOption />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Management */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Project Management</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAddTestProject} variant="outline">
              Add Test Project
            </Button>
            <Button onClick={handleResetNavigation} variant="outline">
              Reset Navigation
            </Button>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Current Projects</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all duration-150',
                      activeProject === project.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                    onClick={() => setActiveProject(project.id === activeProject ? null : project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">{project.description}</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {project.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {activeProject === project.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Routine Box Demo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Routine Box Component Demo</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Interactive demonstration of the RoutineBox component with coaching integration and AI personality adaptation.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sampleRoutines.map((routine) => (
              <RoutineBoxDemo
                key={routine.id}
                routine={routine}
                coaching={sampleCoaching[routine.id]}
                onComplete={(id) => {
                  setTestMessage(`Completed routine: ${routine.title}`);
                  setTimeout(() => setTestMessage(''), 3000);
                }}
                onSkip={(id) => {
                  setTestMessage(`Skipped routine: ${routine.title}`);
                  setTimeout(() => setTestMessage(''), 3000);
                }}
                onViewDetails={(id) => {
                  setTestMessage(`Viewing details for: ${routine.title}`);
                  setTimeout(() => setTestMessage(''), 3000);
                }}
              />
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="font-medium mb-2">Coaching Adaptation by Cognitive Mode:</p>
            <ul className="space-y-1">
              <li><strong>Focus:</strong> Quick insights for immediate action</li>
              <li><strong>Ambient:</strong> Motivational messages for ongoing encouragement</li>
              <li><strong>Discovery:</strong> Educational tips and interesting facts</li>
            </ul>
            <p className="mt-2 text-xs">Change your cognitive mode in preferences to see different coaching messages.</p>
          </div>
        </div>
      </Card>

      {/* Design System Demo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Design System Components</h2>
        <div className="space-y-6">
          {/* Interactive Elements */}
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Interactive Elements</h3>
            <div className="flex flex-wrap gap-4">
              <button className="rix-interactive px-4 py-2 bg-blue-500 text-white rounded-lg">
                Primary Button
              </button>
              <button className="rix-interactive px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                Secondary Button
              </button>
              <div className="rix-nav-item rix-nav-item--active">
                <div className="rix-nav-item__icon w-5 h-5 bg-white rounded" />
                <span className="rix-nav-item__label">Active Nav Item</span>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Color Palette</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { name: 'Primary', var: 'var(--rix-accent-primary)' },
                { name: 'Success', var: 'var(--rix-success)' },
                { name: 'Warning', var: 'var(--rix-warning)' },
                { name: 'Error', var: 'var(--rix-error)' },
                { name: 'Surface', var: 'var(--rix-surface)' },
                { name: 'Border', var: 'var(--rix-border-primary)' },
                { name: 'Text Primary', var: 'var(--rix-text-primary)' },
                { name: 'Text Secondary', var: 'var(--rix-text-secondary)' }
              ].map((color) => (
                <div key={color.name} className="text-center">
                  <div
                    className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 mb-1"
                    style={{ backgroundColor: color.var }}
                  />
                  <span className="text-xs text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Desktop Testing:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use the sidebar toggle button to collapse/expand the navigation</li>
              <li>Test theme switching with the theme toggle components</li>
              <li>Add test projects and observe the project hierarchy</li>
              <li>Resize the browser window to test responsive breakpoints</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Mobile Testing (Resize to &lt;768px):</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Bottom navigation should appear with 5 primary items</li>
              <li>Tap the menu button to open the mobile drawer</li>
              <li>Test project navigation within the drawer</li>
              <li>Verify touch targets are at least 44px for accessibility</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Tablet Testing (768px - 1023px):</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Sidebar should auto-collapse to 64px width</li>
              <li>Hover over collapsed navigation items for tooltips</li>
              <li>Navigation should remain functional in collapsed state</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrototypeTestPage;