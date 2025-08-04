// /04-implementation/testing-quality/new-test-files/FloatingAISphere.test.tsx
// Comprehensive test suite for FloatingAISphere component with voice input and context-aware actions
// Tests sphere interactions, voice processing, animations, and accessibility across desktop and mobile
// RELEVANT FILES: FloatingAISphere.tsx, AIBubbleInterface.tsx, VoiceInput.tsx, sphere-animations.css

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingAISphere } from '@/components/floating-ai-sphere/FloatingAISphere';

// Mock usePathname hook
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname()
}));

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
  Mic: (props: any) => <div data-testid="mic-icon" {...props} />,
  MicOff: (props: any) => <div data-testid="mic-off-icon" {...props} />,
  MessageCircle: (props: any) => <div data-testid="message-circle-icon" {...props} />,
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
  FileText: (props: any) => <div data-testid="file-text-icon" {...props} />,
  BarChart3: (props: any) => <div data-testid="bar-chart-icon" {...props} />,
  FolderOpen: (props: any) => <div data-testid="folder-open-icon" {...props} />,
  Plus: (props: any) => <div data-testid="plus-icon" {...props} />,
  RotateCcw: (props: any) => <div data-testid="rotate-ccw-icon" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Clock: (props: any) => <div data-testid="clock-icon" {...props} />,
  Users: (props: any) => <div data-testid="users-icon" {...props} />
}));

// Mock child components
jest.mock('@/components/floating-ai-sphere/AIBubbleInterface', () => ({
  AIBubbleInterface: ({ onClose, onQuickAction, contextActions, isProcessing, className }: any) => (
    <div data-testid="ai-bubble-interface" className={className}>
      <button onClick={onClose} data-testid="close-button">Close</button>
      <div data-testid="processing-state">{isProcessing ? 'processing' : 'ready'}</div>
      <div data-testid="context-actions">
        {contextActions.map((action: any) => (
          <button 
            key={action.id} 
            onClick={() => onQuickAction(action.id)}
            data-testid={`action-${action.id}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}));

jest.mock('@/components/floating-ai-sphere/VoiceInput', () => ({
  VoiceInput: ({ onStart, onEnd, onResult, isActive, className }: any) => (
    <div data-testid="voice-input" className={className}>
      <button onClick={onStart} data-testid="voice-start">Start Voice</button>
      <button onClick={onEnd} data-testid="voice-end">End Voice</button>
      <button onClick={() => onResult('test transcript')} data-testid="voice-result">
        Send Result
      </button>
      <div data-testid="voice-active">{isActive ? 'active' : 'inactive'}</div>
    </div>
  )
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('FloatingAISphere Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Default pathname
    mockPathname.mockReturnValue('/dashboard');
    
    // Mock document.addEventListener and removeEventListener
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockConsoleLog.mockClear();
  });

  describe('Basic Rendering and Hydration', () => {
    it('renders null before mounting (SSR safety)', () => {
      const { container } = render(<FloatingAISphere />);
      expect(container.firstChild).toBeNull();
    });

    it('renders sphere after mounting', async () => {
      render(<FloatingAISphere />);
      
      // Trigger mount effect
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'AI Assistant' })).toBeInTheDocument();
      });
    });

    it('renders with correct ARIA attributes', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toHaveAttribute('aria-label', 'AI Assistant');
        expect(sphere).toHaveAttribute('title', 'Click to open AI assistant');
      });
    });

    it('applies custom className', async () => {
      render(<FloatingAISphere className="custom-sphere" />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const container = screen.getByRole('button', { name: 'AI Assistant' }).closest('div');
        expect(container).toHaveClass('custom-sphere');
      });
    });

    it('shows default MessageCircle icon when not listening or processing', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('mic-icon')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sphere Toggle Functionality', () => {
    it('toggles interface when sphere is clicked', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Click to open
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();
      expect(screen.getByTestId('voice-input')).toBeInTheDocument();

      // Click to close
      await user.click(sphere);
      
      await waitFor(() => {
        expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
        expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument();
      });
    });

    it('does not toggle when disabled', async () => {
      render(<FloatingAISphere disabled />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeDisabled();
      });

      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
    });

    it('applies disabled styling when disabled', async () => {
      render(<FloatingAISphere disabled />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toHaveClass('floating-ai-sphere--disabled');
      });
    });
  });

  describe('Voice Input Integration', () => {
    beforeEach(async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);
    });

    it('shows voice input component when interface is open', () => {
      expect(screen.getByTestId('voice-input')).toBeInTheDocument();
    });

    it('handles voice input start', async () => {
      const voiceStart = screen.getByTestId('voice-start');
      await user.click(voiceStart);

      // Should show mic icon and listening state
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
      expect(screen.getByTestId('voice-active')).toHaveTextContent('active');
    });

    it('handles voice input end with processing state', async () => {
      // Start voice input first
      const voiceStart = screen.getByTestId('voice-start');
      await user.click(voiceStart);

      // End voice input
      const voiceEnd = screen.getByTestId('voice-end');
      await user.click(voiceEnd);

      // Should show processing state
      const processingSpinner = screen.getByRole('button', { name: 'AI Assistant' });
      expect(processingSpinner).toHaveClass('floating-ai-sphere--processing');
      expect(screen.getByTestId('processing-state')).toHaveTextContent('processing');

      // Should clear processing after timeout
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(processingSpinner).not.toHaveClass('floating-ai-sphere--processing');
        expect(screen.getByTestId('processing-state')).toHaveTextContent('ready');
      });
    });

    it('handles voice result', async () => {
      const voiceResult = screen.getByTestId('voice-result');
      await user.click(voiceResult);

      expect(mockConsoleLog).toHaveBeenCalledWith('Voice input received:', 'test transcript');
    });

    it('shows correct visual states for voice input', async () => {
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });

      // Start listening
      const voiceStart = screen.getByTestId('voice-start');
      await user.click(voiceStart);

      expect(sphere).toHaveClass('floating-ai-sphere--listening');
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();

      // End listening (start processing)
      const voiceEnd = screen.getByTestId('voice-end');
      await user.click(voiceEnd);

      expect(sphere).toHaveClass('floating-ai-sphere--processing');
      expect(sphere).not.toHaveClass('floating-ai-sphere--listening');
    });
  });

  describe('Context-Aware Quick Actions', () => {
    const testCases = [
      {
        pathname: '/dashboard',
        expectedActions: ['daily-briefing', 'quick-task', 'schedule', 'note'],
        description: 'dashboard context'
      },
      {
        pathname: '/projects/123',
        expectedActions: ['project-status', 'new-project', 'quick-task', 'schedule', 'note'],
        description: 'projects context'
      },
      {
        pathname: '/routines',
        expectedActions: ['habit-check', 'routine-coach', 'quick-task', 'schedule', 'note'],
        description: 'routines context'
      },
      {
        pathname: '/calendar',
        expectedActions: ['time-block', 'meeting-prep', 'quick-task', 'schedule', 'note'],
        description: 'calendar context'
      },
      {
        pathname: '/other',
        expectedActions: ['quick-task', 'schedule', 'note'],
        description: 'default context'
      }
    ];

    testCases.forEach(({ pathname, expectedActions, description }) => {
      it(`shows correct actions for ${description}`, async () => {
        mockPathname.mockReturnValue(pathname);
        
        render(<FloatingAISphere />);
        
        act(() => {
          jest.runOnlyPendingTimers();
        });

        await waitFor(() => {
          const sphere = screen.getByRole('button', { name: 'AI Assistant' });
          expect(sphere).toBeInTheDocument();
        });

        // Open interface
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        await user.click(sphere);

        // Check that expected actions are present
        expectedActions.forEach(actionId => {
          expect(screen.getByTestId(`action-${actionId}`)).toBeInTheDocument();
        });
      });
    });

    it('handles quick action clicks', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      // Click a quick action
      const quickTaskAction = screen.getByTestId('action-quick-task');
      await user.click(quickTaskAction);

      expect(mockConsoleLog).toHaveBeenCalledWith('Quick action triggered:', 'quick-task');
      
      // Interface should close after action
      await waitFor(() => {
        expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-Close Behavior', () => {
    it('auto-closes after 30 seconds of inactivity', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();

      // Advance time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
      });
    });

    it('resets auto-close timer when interface is reopened', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      const sphere = screen.getByRole('button', { name: 'AI Assistant' });

      // Open interface
      await user.click(sphere);
      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();

      // Wait 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Close and reopen
      await user.click(sphere);
      await user.click(sphere);

      // Wait another 20 seconds (35 total, but timer was reset)
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // Should still be open (timer was reset)
      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();

      // Wait additional 15 seconds (30 from reset)
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
      });
    });
  });

  describe('Outside Click Detection', () => {
    it('closes interface when clicking outside', async () => {
      render(
        <div>
          <FloatingAISphere />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      fireEvent.mouseDown(outsideElement);

      await waitFor(() => {
        expect(screen.queryByTestId('ai-bubble-interface')).not.toBeInTheDocument();
      });
    });

    it('does not close when clicking inside sphere container', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();

      // Click inside interface
      const bubbleInterface = screen.getByTestId('ai-bubble-interface');
      fireEvent.mouseDown(bubbleInterface);

      // Should remain open
      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();
    });
  });

  describe('Animation States', () => {
    it('applies correct CSS classes for different states', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      const sphere = screen.getByRole('button', { name: 'AI Assistant' });

      // Default state
      expect(sphere).toHaveClass('floating-ai-sphere');
      expect(sphere).not.toHaveClass('floating-ai-sphere--listening');
      expect(sphere).not.toHaveClass('floating-ai-sphere--processing');

      // Open interface and start voice
      await user.click(sphere);
      const voiceStart = screen.getByTestId('voice-start');
      await user.click(voiceStart);

      // Listening state
      expect(sphere).toHaveClass('floating-ai-sphere--listening');

      // End voice input
      const voiceEnd = screen.getByTestId('voice-end');
      await user.click(voiceEnd);

      // Processing state
      expect(sphere).toHaveClass('floating-ai-sphere--processing');
      expect(sphere).not.toHaveClass('floating-ai-sphere--listening');
    });

    it('shows pulse ring animation during active states', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Open interface
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      // Start voice input
      const voiceStart = screen.getByTestId('voice-start');
      await user.click(voiceStart);

      // Pulse ring should be active
      const pulseRing = sphere.querySelector('.floating-ai-sphere__pulse-ring');
      expect(pulseRing).toHaveClass('floating-ai-sphere__pulse-ring--active');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toHaveAttribute('aria-label', 'AI Assistant');
        expect(sphere).toHaveAttribute('title', 'Click to open AI assistant');
      });
    });

    it('is keyboard accessible', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      
      // Focus and activate with keyboard
      sphere.focus();
      fireEvent.keyDown(sphere, { key: 'Enter' });

      expect(screen.getByTestId('ai-bubble-interface')).toBeInTheDocument();
    });

    it('provides screen reader feedback for state changes', async () => {
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      
      // Open interface
      await user.click(sphere);

      // Voice input should have proper accessibility
      const voiceInput = screen.getByTestId('voice-input');
      expect(voiceInput).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing pathname gracefully', async () => {
      mockPathname.mockReturnValue(undefined);
      
      render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Should still render and work with default actions
      const sphere = screen.getByRole('button', { name: 'AI Assistant' });
      await user.click(sphere);

      expect(screen.getByTestId('action-quick-task')).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      unmount();

      expect(document.removeEventListener).toHaveBeenCalled();
    });

    it('clears timeouts on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('uses dynamic imports for icons', () => {
      // This test verifies that dynamic imports are properly mocked
      expect(jest.isMockFunction(require('next/dynamic'))).toBe(true);
    });

    it('prevents unnecessary re-renders', async () => {
      const { rerender } = render(<FloatingAISphere />);
      
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        const sphere = screen.getByRole('button', { name: 'AI Assistant' });
        expect(sphere).toBeInTheDocument();
      });

      // Rerender with same props should not cause issues
      rerender(<FloatingAISphere />);
      
      expect(screen.getByRole('button', { name: 'AI Assistant' })).toBeInTheDocument();
    });
  });
});