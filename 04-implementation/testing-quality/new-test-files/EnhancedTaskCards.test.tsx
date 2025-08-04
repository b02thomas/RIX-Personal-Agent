// /04-implementation/testing-quality/new-test-files/EnhancedTaskCards.test.tsx
// Comprehensive test suite for EnhancedTaskCard component with advanced status indicators and mobile optimization
// Tests task interactions, status changes, priority systems, and accessibility
// RELEVANT FILES: enhanced-task-cards.tsx, task-ui-improvements.md, task-status-indicators.css, color-system.css

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedTaskCard, TaskCardSkeleton, type Task } from '@/components/tasks/EnhancedTaskCard';

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
  CheckCircle: (props: any) => <div data-testid="check-circle-icon" {...props} />,
  Circle: (props: any) => <div data-testid="circle-icon" {...props} />,
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  AlertCircle: (props: any) => <div data-testid="alert-circle-icon" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
  MoreHorizontal: (props: any) => <div data-testid="more-horizontal-icon" {...props} />,
  Play: (props: any) => <div data-testid="play-icon" {...props} />,
  Pause: (props: any) => <div data-testid="pause-icon" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />,
  Tag: (props: any) => <div data-testid="tag-icon" {...props} />
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick, onMouseEnter, onMouseLeave, ...props }: any) => (
    <div 
      className={className} 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="task-card"
      {...props}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card-content" {...props}>
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  )
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Sample task data
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Complete project documentation',
  description: 'Write comprehensive documentation for the new feature',
  status: 'todo',
  priority: 'medium',
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
  project: 'Development',
  tags: ['documentation', 'urgent'],
  assignee: 'John Doe',
  createdAt: new Date(Date.now() - 86400000), // Yesterday
  updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
  ...overrides
});

describe('EnhancedTaskCard Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnStatusChange = jest.fn();
  const mockOnPriorityChange = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders task card with basic information', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('task-card')).toBeInTheDocument();
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.getByText('Write comprehensive documentation for the new feature')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          className="custom-task-card"
        />
      );

      const card = screen.getByTestId('task-card');
      expect(card).toHaveClass('custom-task-card');
    });

    it('renders without description when not provided', () => {
      const task = createMockTask({ description: undefined });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.queryByText('Write comprehensive documentation')).not.toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          compact={true}
        />
      );

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-3');
      
      // Description should not be shown in compact mode
      expect(screen.queryByText('Write comprehensive documentation')).not.toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    const statusTests = [
      {
        status: 'todo' as const,
        expectedIcon: 'circle-icon',
        expectedClasses: 'text-rix-text-secondary border-rix-border-primary',
        label: 'To Do'
      },
      {
        status: 'in_progress' as const,
        expectedIcon: 'play-icon',
        expectedClasses: 'text-rix-accent-primary border-rix-accent-primary',
        label: 'In Progress'
      },
      {
        status: 'completed' as const,
        expectedIcon: 'check-circle-icon',
        expectedClasses: 'text-rix-success border-rix-success',
        label: 'Completed'
      },
      {
        status: 'blocked' as const,
        expectedIcon: 'alert-triangle-icon',
        expectedClasses: 'text-rix-error border-rix-error',
        label: 'Blocked'
      }
    ];

    statusTests.forEach(({ status, expectedIcon, label }) => {
      it(`renders correct icon and styling for ${status} status`, () => {
        const task = createMockTask({ status });
        
        render(
          <EnhancedTaskCard
            task={task}
            onStatusChange={mockOnStatusChange}
            onPriorityChange={mockOnPriorityChange}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
        
        const statusButton = screen.getByLabelText(`Mark as ${label}`);
        expect(statusButton).toBeInTheDocument();
      });
    });

    it('shows pulse animation for in_progress status', () => {
      const task = createMockTask({ status: 'in_progress' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as In Progress');
      expect(statusButton).toHaveClass('animate-pulse');
    });

    it('applies completed styling for completed tasks', () => {
      const task = createMockTask({ status: 'completed' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      expect(card).toHaveClass('opacity-75');
      
      const title = screen.getByText('Complete project documentation');
      expect(title).toHaveClass('line-through');
    });
  });

  describe('Priority System', () => {
    const priorityTests = [
      {
        priority: 'high' as const,
        expectedIcon: 'alert-circle-icon',
        expectedColor: 'text-red-400 bg-red-900/20',
        expectedBorder: 'border-l-red-500 border-l-4',
        label: 'High'
      },
      {
        priority: 'medium' as const,
        expectedIcon: 'clock-icon',
        expectedColor: 'text-yellow-400 bg-yellow-900/20',
        expectedBorder: 'border-l-yellow-500 border-l-2',
        label: 'Medium'
      },
      {
        priority: 'low' as const,
        expectedIcon: 'check-circle-icon',
        expectedColor: 'text-green-400 bg-green-900/20',
        expectedBorder: 'border-l-green-500 border-l-1',
        label: 'Low'
      }
    ];

    priorityTests.forEach(({ priority, expectedIcon, expectedBorder }) => {
      it(`renders correct visual indicators for ${priority} priority`, () => {
        const task = createMockTask({ priority });
        
        render(
          <EnhancedTaskCard
            task={task}
            onStatusChange={mockOnStatusChange}
            onPriorityChange={mockOnPriorityChange}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        const card = screen.getByTestId('task-card');
        expect(card).toHaveClass(expectedBorder);
        
        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
        expect(screen.getByText(priority)).toBeInTheDocument();
      });
    });
  });

  describe('Due Date Urgency', () => {
    it('shows overdue warning for past due dates', () => {
      const task = createMockTask({ 
        dueDate: new Date(Date.now() - 86400000) // Yesterday
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('1 days overdue')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('shows "due today" for tasks due today', () => {
      const task = createMockTask({ 
        dueDate: new Date() // Today
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Due today')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('shows upcoming due dates for tasks due soon', () => {
      const task = createMockTask({ 
        dueDate: new Date(Date.now() + 2 * 86400000) // In 2 days
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('shows formatted date for future tasks', () => {
      const futureDate = new Date(Date.now() + 10 * 86400000); // In 10 days
      const task = createMockTask({ dueDate: futureDate });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const expectedText = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(futureDate);
      
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('handles tasks without due dates', () => {
      const task = createMockTask({ dueDate: undefined });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should not show any due date badge
      expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Toggle Functionality', () => {
    it('toggles from todo to in_progress', async () => {
      const task = createMockTask({ status: 'todo' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      await user.click(statusButton);

      // Should animate first
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', 'in_progress');
    });

    it('toggles from in_progress to completed', async () => {
      const task = createMockTask({ status: 'in_progress' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as In Progress');
      await user.click(statusButton);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', 'completed');
    });

    it('toggles from completed back to todo', async () => {
      const task = createMockTask({ status: 'completed' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as Completed');
      await user.click(statusButton);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnStatusChange).toHaveBeenCalledWith('task-1', 'todo');
    });

    it('shows animation during status change', async () => {
      const task = createMockTask({ status: 'todo' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      await user.click(statusButton);

      const card = screen.getByTestId('task-card');
      expect(card).toHaveClass('scale-[0.98]');
    });

    it('prevents event propagation on status toggle', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      await user.click(statusButton);

      // Card onClick should not be called
      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Selection Functionality', () => {
    it('renders selection checkbox when onSelectionChange is provided', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('shows selected state when isSelected is true', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSelectionChange={mockOnSelectionChange}
          isSelected={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      
      const card = screen.getByTestId('task-card');
      expect(card).toHaveClass('ring-2 ring-rix-accent-primary border-rix-accent-primary');
    });

    it('handles selection change', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith('task-1', true);
    });

    it('prevents event propagation on checkbox click', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Card onClick should not be called
      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Tags Display', () => {
    it('renders task tags', () => {
      const task = createMockTask({ tags: ['urgent', 'documentation', 'review'] });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('documentation')).toBeInTheDocument();
      expect(screen.getByText('review')).toBeInTheDocument();
    });

    it('limits tags display in compact mode', () => {
      const task = createMockTask({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          compact={true}
        />
      );

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument(); // Overflow indicator
    });

    it('limits tags display in normal mode', () => {
      const task = createMockTask({ tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('tag4')).toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument(); // Overflow indicator
    });

    it('shows tag icons', () => {
      const task = createMockTask({ tags: ['urgent'] });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('tag-icon')).toBeInTheDocument();
    });
  });

  describe('Actions Menu', () => {
    it('shows actions menu on hover', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      expect(actionsButton).toHaveClass('opacity-100');
    });

    it('opens actions popup when actions button is clicked', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      await user.click(actionsButton);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByText('Higher Priority')).toBeInTheDocument();
      expect(screen.getByText('Delete Task')).toBeInTheDocument();
    });

    it('handles edit action', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      await user.click(actionsButton);

      const editButton = screen.getByText('Edit Task');
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('task-1');
    });

    it('handles priority change action', async () => {
      const task = createMockTask({ priority: 'low' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      await user.click(actionsButton);

      const priorityButton = screen.getByText('Higher Priority');
      await user.click(priorityButton);

      expect(mockOnPriorityChange).toHaveBeenCalledWith('task-1', 'high');
    });

    it('handles delete action', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      await user.click(actionsButton);

      const deleteButton = screen.getByText('Delete Task');
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('task-1');
    });

    it('prevents event propagation on actions', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      fireEvent.mouseEnter(card);

      const actionsButton = screen.getByLabelText('Task actions');
      await user.click(actionsButton);

      // Card onClick should not be called when clicking actions button
      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe('Relative Time Display', () => {
    it('shows "just now" for very recent updates', () => {
      const task = createMockTask({ 
        updatedAt: new Date(Date.now() - 30000) // 30 seconds ago
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Updated Just now')).toBeInTheDocument();
    });

    it('shows minutes for recent updates', () => {
      const task = createMockTask({ 
        updatedAt: new Date(Date.now() - 5 * 60000) // 5 minutes ago
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Updated 5 minutes ago')).toBeInTheDocument();
    });

    it('shows hours for updates within a day', () => {
      const task = createMockTask({ 
        updatedAt: new Date(Date.now() - 3 * 3600000) // 3 hours ago
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Updated 3 hours ago')).toBeInTheDocument();
    });

    it('shows days for older updates', () => {
      const task = createMockTask({ 
        updatedAt: new Date(Date.now() - 2 * 86400000) // 2 days ago
      });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Updated 2 days ago')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels for status toggle', () => {
      const task = createMockTask({ status: 'todo' });
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      expect(statusButton).toBeInTheDocument();
    });

    it('has proper touch targets for mobile', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      expect(statusButton).toHaveClass('mobile-touch-target');
    });

    it('supports keyboard navigation', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const statusButton = screen.getByLabelText('Mark as To Do');
      
      statusButton.focus();
      fireEvent.keyDown(statusButton, { key: 'Enter' });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  describe('Card Interactions', () => {
    it('calls onEdit when card is clicked', async () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      await user.click(card);

      expect(mockOnEdit).toHaveBeenCalledWith('task-1');
    });

    it('handles hover states', () => {
      const task = createMockTask();
      
      render(
        <EnhancedTaskCard
          task={task}
          onStatusChange={mockOnStatusChange}
          onPriorityChange={mockOnPriorityChange}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = screen.getByTestId('task-card');
      
      fireEvent.mouseEnter(card);
      expect(card).toHaveClass('bg-rix-card-hover border-rix-border-light');
      
      fireEvent.mouseLeave(card);
      expect(card).not.toHaveClass('bg-rix-card-hover border-rix-border-light');
    });
  });
});

describe('TaskCardSkeleton Component', () => {
  it('renders skeleton in normal mode', () => {
    render(<TaskCardSkeleton />);
    
    expect(screen.getByTestId('task-card')).toHaveClass('animate-pulse');
    expect(screen.getByTestId('card-content')).toHaveClass('p-4 md:p-6');
  });

  it('renders skeleton in compact mode', () => {
    render(<TaskCardSkeleton compact={true} />);
    
    expect(screen.getByTestId('card-content')).toHaveClass('p-3');
  });

  it('shows appropriate skeleton elements', () => {
    render(<TaskCardSkeleton />);
    
    // Should have skeleton elements for status, title, description, meta info, and badges
    const skeletonElements = document.querySelectorAll('.bg-rix-border-primary');
    expect(skeletonElements.length).toBeGreaterThan(5);
  });
});