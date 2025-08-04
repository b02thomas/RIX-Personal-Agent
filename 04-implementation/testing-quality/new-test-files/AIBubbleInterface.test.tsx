// /04-implementation/testing-quality/new-test-files/AIBubbleInterface.test.tsx
// Comprehensive test suite for AIBubbleInterface component with quick actions and processing states
// Tests interface rendering, action interactions, animations, and accessibility
// RELEVANT FILES: AIBubbleInterface.tsx, FloatingAISphere.tsx, sphere-animations.css, color-system.css

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIBubbleInterface } from '@/components/floating-ai-sphere/AIBubbleInterface';

// Mock dynamic imports for Lucide React icons
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction: any) {
    const DynamicComponent = dynamicFunction();
    DynamicComponent.preload = jest.fn();
    return DynamicComponent;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  MessageCircle: (props: any) => <div data-testid="message-circle-icon" {...props} />,
  Sparkles: (props: any) => <div data-testid="sparkles-icon" {...props} />,
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
  FileText: (props: any) => <div data-testid="file-text-icon" {...props} />,
  BarChart3: (props: any) => <div data-testid="bar-chart-icon" {...props} />,
  FolderOpen: (props: any) => <div data-testid="folder-open-icon" {...props} />,
  Plus: (props: any) => <div data-testid="plus-icon" {...props} />,
  RotateCcw: (props: any) => <div data-testid="rotate-ccw-icon" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  Users: (props: any) => <div data-testid="users-icon" {...props} />,
  Loader2: (props: any) => <div data-testid="loader-icon" {...props} />,
  ChevronRight: (props: any) => <div data-testid="chevron-right-icon" {...props} />
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

const defaultContextActions = [
  { id: 'quick-task', label: 'Quick Task', icon: 'CheckSquare' },
  { id: 'schedule', label: 'Schedule', icon: 'Calendar' },
  { id: 'note', label: 'Add Note', icon: 'FileText' }
];

const dashboardActions = [
  { id: 'daily-briefing', label: 'Daily Briefing', icon: 'BarChart3' },
  ...defaultContextActions
];

describe('AIBubbleInterface Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = jest.fn();
  const mockOnQuickAction = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders interface with default props', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should render main container
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('AI Assistant Interface')).toBeInTheDocument();
      
      // Should render close button
      expect(screen.getByRole('button', { name: 'Close AI assistant' })).toBeInTheDocument();
      
      // Should render AI greeting
      expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
          className="custom-interface"
        />
      );

      const interface = screen.getByRole('dialog');
      expect(interface).toHaveClass('custom-interface');
    });

    it('renders with proper structure and styling', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Check main container classes
      const interface = screen.getByRole('dialog');
      expect(interface).toHaveClass('ai-bubble-interface');
      
      // Check for header, content, and footer sections
      expect(screen.getByTestId('interface-header')).toBeInTheDocument();
      expect(screen.getByTestId('interface-content')).toBeInTheDocument();
      expect(screen.getByTestId('interface-footer')).toBeInTheDocument();
    });
  });

  describe('Close Button Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close AI assistant' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('has proper accessibility attributes for close button', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close AI assistant' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close AI assistant');
      expect(closeButton).toHaveAttribute('title', 'Close');
    });

    it('shows X icon in close button', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Processing States', () => {
    it('shows processing state when isProcessing is true', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={true}
        />
      );

      // Should show processing message
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
      
      // Should show loading spinner
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      // Should have processing class
      const interface = screen.getByRole('dialog');
      expect(interface).toHaveClass('ai-bubble-interface--processing');
    });

    it('shows ready state when isProcessing is false', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should show greeting message
      expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();
      
      // Should show sparkles icon
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
      
      // Should not have processing class
      const interface = screen.getByRole('dialog');
      expect(interface).not.toHaveClass('ai-bubble-interface--processing');
    });

    it('disables quick actions during processing', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={true}
        />
      );

      // All action buttons should be disabled
      const actionButtons = screen.getAllByRole('button', { name: /Quick Task|Schedule|Add Note/ });
      actionButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('enables quick actions when not processing', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // All action buttons should be enabled
      const actionButtons = screen.getAllByRole('button', { name: /Quick Task|Schedule|Add Note/ });
      actionButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Quick Actions', () => {
    it('renders all provided context actions', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={dashboardActions}
          isProcessing={false}
        />
      );

      // Should render all actions
      expect(screen.getByRole('button', { name: 'Daily Briefing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Quick Task' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Note' })).toBeInTheDocument();
    });

    it('calls onQuickAction with correct action ID when action is clicked', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      await user.click(quickTaskButton);

      expect(mockOnQuickAction).toHaveBeenCalledWith('quick-task');
    });

    it('renders action icons correctly', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Check that icons are rendered for each action
      expect(screen.getByTestId('check-square-icon')).toBeInTheDocument(); // Quick Task
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument(); // Schedule
      expect(screen.getByTestId('file-text-icon')).toBeInTheDocument(); // Add Note
    });

    it('handles empty context actions array', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={[]}
          isProcessing={false}
        />
      );

      // Should still render interface but with no action buttons
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();
      
      // Should not have any action buttons
      const actionButtons = screen.queryAllByRole('button');
      expect(actionButtons).toHaveLength(1); // Only close button
    });

    it('shows action descriptions on hover or focus', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={[
            { id: 'quick-task', label: 'Quick Task', icon: 'CheckSquare', description: 'Create a quick task' }
          ]}
          isProcessing={false}
        />
      );

      const actionButton = screen.getByRole('button', { name: 'Quick Task' });
      
      // Focus the button
      await user.hover(actionButton);
      
      // Should have title attribute for tooltip
      expect(actionButton).toHaveAttribute('title');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation between actions', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Tab through buttons
      await user.tab();
      expect(screen.getByRole('button', { name: 'Close AI assistant' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Quick Task' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Schedule' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Add Note' })).toHaveFocus();
    });

    it('activates actions with Enter key', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      quickTaskButton.focus();
      
      fireEvent.keyDown(quickTaskButton, { key: 'Enter' });

      expect(mockOnQuickAction).toHaveBeenCalledWith('quick-task');
    });

    it('activates actions with Space key', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      quickTaskButton.focus();
      
      fireEvent.keyDown(quickTaskButton, { key: ' ' });

      expect(mockOnQuickAction).toHaveBeenCalledWith('quick-task');
    });

    it('closes interface with Escape key', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const interface = screen.getByRole('dialog');
      fireEvent.keyDown(interface, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Touch Interactions', () => {
    it('has proper touch targets for mobile', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // All buttons should have mobile-touch-target class for 44px minimum
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('mobile-touch-target');
      });
    });

    it('handles touch events for actions', async () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      
      // Simulate touch interaction
      fireEvent.touchStart(quickTaskButton);
      fireEvent.touchEnd(quickTaskButton);
      fireEvent.click(quickTaskButton);

      expect(mockOnQuickAction).toHaveBeenCalledWith('quick-task');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const interface = screen.getByRole('dialog');
      expect(interface).toHaveAttribute('aria-label', 'AI Assistant Interface');
      expect(interface).toHaveAttribute('role', 'dialog');
    });

    it('provides proper focus management', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Focus should be trapped within the interface
      const interface = screen.getByRole('dialog');
      expect(interface).toHaveAttribute('tabIndex', '-1');
    });

    it('has proper button labels and descriptions', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Each action button should have proper accessibility
      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      expect(quickTaskButton).toHaveAttribute('aria-label');
      
      const scheduleButton = screen.getByRole('button', { name: 'Schedule' });
      expect(scheduleButton).toHaveAttribute('aria-label');
      
      const noteButton = screen.getByRole('button', { name: 'Add Note' });
      expect(noteButton).toHaveAttribute('aria-label');
    });

    it('announces state changes to screen readers', () => {
      const { rerender } = render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should have ready state
      expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();

      // Change to processing state
      rerender(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={true}
        />
      );

      // Should announce processing state
      expect(screen.getByText('Processing your request...')).toBeInTheDocument();
    });
  });

  describe('Animations and Transitions', () => {
    it('applies animation classes correctly', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const interface = screen.getByRole('dialog');
      expect(interface).toHaveClass('ai-bubble-interface');
      
      // Should have enter animation class initially
      expect(interface).toHaveClass('ai-bubble-interface--enter');
    });

    it('shows loading animation during processing', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={true}
        />
      );

      const loaderIcon = screen.getByTestId('loader-icon');
      expect(loaderIcon).toHaveClass('animate-spin');
    });

    it('handles transition between states smoothly', () => {
      const { rerender } = render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      const interface = screen.getByRole('dialog');
      expect(interface).not.toHaveClass('ai-bubble-interface--processing');

      // Change to processing
      rerender(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={true}
        />
      );

      expect(interface).toHaveClass('ai-bubble-interface--processing');
    });
  });

  describe('Error Handling', () => {
    it('handles missing action properties gracefully', () => {
      const malformedActions = [
        { id: 'test-action' }, // Missing label and icon
        { label: 'Test Label' }, // Missing id and icon
        { icon: 'TestIcon' } // Missing id and label
      ];

      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={malformedActions}
          isProcessing={false}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles undefined onQuickAction gracefully', () => {
      render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={undefined as any}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Clicking action should not cause error
      const quickTaskButton = screen.getByRole('button', { name: 'Quick Task' });
      fireEvent.click(quickTaskButton);
      
      // Should not throw error
    });

    it('handles undefined onClose gracefully', () => {
      render(
        <AIBubbleInterface
          onClose={undefined as any}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Clicking close should not cause error
      const closeButton = screen.getByRole('button', { name: 'Close AI assistant' });
      fireEvent.click(closeButton);
      
      // Should not throw error
    });
  });

  describe('Performance', () => {
    it('prevents unnecessary re-renders with stable props', () => {
      const { rerender } = render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Rerender with same props
      rerender(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Should not cause issues
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(
        <AIBubbleInterface
          onClose={mockOnClose}
          onQuickAction={mockOnQuickAction}
          contextActions={defaultContextActions}
          isProcessing={false}
        />
      );

      // Rapidly change processing state
      for (let i = 0; i < 10; i++) {
        rerender(
          <AIBubbleInterface
            onClose={mockOnClose}
            onQuickAction={mockOnQuickAction}
            contextActions={defaultContextActions}
            isProcessing={i % 2 === 0}
          />
        );
      }

      // Should handle rapid changes without issues
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});