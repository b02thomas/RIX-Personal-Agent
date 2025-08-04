// /04-implementation/testing-quality/new-test-files/VoiceInput.test.tsx
// Comprehensive test suite for VoiceInput component with Web Speech API integration
// Tests voice recording, transcription, error handling, and browser compatibility
// RELEVANT FILES: VoiceInput.tsx, FloatingAISphere.tsx, AIBubbleInterface.tsx, mobile-optimization

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceInput } from '@/components/floating-ai-sphere/VoiceInput';

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  grammars: null,
  result: null,
  error: null,
  ended: false
};

const mockSpeechRecognitionEvent = {
  results: [
    [
      {
        transcript: 'test transcript',
        confidence: 0.9,
        isFinal: true
      }
    ]
  ],
  resultIndex: 0
};

// Mock globals
(global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
(global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

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
  Square: (props: any) => <div data-testid="square-icon" {...props} />,
  Volume2: (props: any) => <div data-testid="volume-icon" {...props} />,
  VolumeX: (props: any) => <div data-testid="volume-x-icon" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="alert-triangle-icon" {...props} />
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock haptic feedback
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate
});

describe('VoiceInput Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnStart = jest.fn();
  const mockOnEnd = jest.fn();
  const mockOnResult = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset SpeechRecognition mock
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
    mockSpeechRecognition.abort.mockClear();
    mockSpeechRecognition.addEventListener.mockClear();
    mockSpeechRecognition.removeEventListener.mockClear();
    
    // Reset vibrate mock
    mockVibrate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders voice input interface', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      expect(screen.getByTestId('voice-input-container')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start voice/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
          className="custom-voice-input"
        />
      );

      const container = screen.getByTestId('voice-input-container');
      expect(container).toHaveClass('custom-voice-input');
    });

    it('shows different UI based on isActive prop', () => {
      const { rerender } = render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Inactive state
      expect(screen.getByRole('button', { name: /start voice/i })).toBeInTheDocument();
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();

      // Active state
      rerender(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
        />
      );

      expect(screen.getByRole('button', { name: /stop voice/i })).toBeInTheDocument();
      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
    });
  });

  describe('Browser Compatibility', () => {
    it('detects Speech Recognition support', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Should show supported interface
      expect(screen.getByRole('button', { name: /start voice/i })).not.toBeDisabled();
    });

    it('handles missing Speech Recognition API', () => {
      // Temporarily remove SpeechRecognition
      const originalSR = (global as any).SpeechRecognition;
      const originalWebkitSR = (global as any).webkitSpeechRecognition;
      
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;

      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Should show unsupported state
      expect(screen.getByText(/voice input not supported/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start voice/i })).toBeDisabled();

      // Restore globals
      (global as any).SpeechRecognition = originalSR;
      (global as any).webkitSpeechRecognition = originalWebkitSR;
    });

    it('prefers SpeechRecognition over webkitSpeechRecognition', () => {
      // Both are available, should use SpeechRecognition
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      fireEvent.click(startButton);

      expect((global as any).SpeechRecognition).toHaveBeenCalled();
    });

    it('falls back to webkitSpeechRecognition when needed', () => {
      // Remove standard SpeechRecognition
      const originalSR = (global as any).SpeechRecognition;
      delete (global as any).SpeechRecognition;

      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      fireEvent.click(startButton);

      expect((global as any).webkitSpeechRecognition).toHaveBeenCalled();

      // Restore
      (global as any).SpeechRecognition = originalSR;
    });
  });

  describe('Voice Recording Functionality', () => {
    it('starts voice recording when start button is clicked', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(mockOnStart).toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith([10]); // Light haptic feedback
    });

    it('stops voice recording when stop button is clicked', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
        />
      );

      const stopButton = screen.getByRole('button', { name: /stop voice/i });
      await user.click(stopButton);

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(mockOnEnd).toHaveBeenCalled();
      expect(mockVibrate).toHaveBeenCalledWith([20]); // Medium haptic feedback
    });

    it('configures speech recognition properly', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
          language="de-DE"
          continuous={true}
          interimResults={true}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      expect(mockSpeechRecognition.lang).toBe('de-DE');
      expect(mockSpeechRecognition.continuous).toBe(true);
      expect(mockSpeechRecognition.interimResults).toBe(true);
    });

    it('uses default configuration when props not provided', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      expect(mockSpeechRecognition.lang).toBe('en-US');
      expect(mockSpeechRecognition.continuous).toBe(false);
      expect(mockSpeechRecognition.interimResults).toBe(true);
    });
  });

  describe('Speech Recognition Events', () => {
    beforeEach(() => {
      // Mock event listener attachment
      mockSpeechRecognition.addEventListener.mockImplementation((event, callback) => {
        if (event === 'result') {
          // Store callback for later invocation
          (mockSpeechRecognition as any).resultCallback = callback;
        } else if (event === 'error') {
          (mockSpeechRecognition as any).errorCallback = callback;
        } else if (event === 'end') {
          (mockSpeechRecognition as any).endCallback = callback;
        }
      });
    });

    it('handles speech recognition results', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate result event
      const resultCallback = (mockSpeechRecognition as any).resultCallback;
      if (resultCallback) {
        resultCallback(mockSpeechRecognitionEvent);
      }

      expect(mockOnResult).toHaveBeenCalledWith('test transcript', 0.9);
    });

    it('handles interim results', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
          interimResults={true}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate interim result
      const interimEvent = {
        results: [
          [
            {
              transcript: 'interim transcript',
              confidence: 0.7,
              isFinal: false
            }
          ]
        ],
        resultIndex: 0
      };

      const resultCallback = (mockSpeechRecognition as any).resultCallback;
      if (resultCallback) {
        resultCallback(interimEvent);
      }

      expect(mockOnResult).toHaveBeenCalledWith('interim transcript', 0.7);
    });

    it('handles multiple recognition results', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate multiple results
      const multipleResultsEvent = {
        results: [
          [{ transcript: 'first part', confidence: 0.9, isFinal: true }],
          [{ transcript: 'second part', confidence: 0.8, isFinal: true }]
        ],
        resultIndex: 0
      };

      const resultCallback = (mockSpeechRecognition as any).resultCallback;
      if (resultCallback) {
        resultCallback(multipleResultsEvent);
      }

      expect(mockOnResult).toHaveBeenCalledWith('first part', 0.9);
    });

    it('handles speech recognition errors', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          onError={mockOnError}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate error event
      const errorEvent = {
        error: 'network',
        message: 'Network error occurred'
      };

      const errorCallback = (mockSpeechRecognition as any).errorCallback;
      if (errorCallback) {
        errorCallback(errorEvent);
      }

      expect(mockOnError).toHaveBeenCalledWith(errorEvent);
      expect(screen.getByText(/voice input error/i)).toBeInTheDocument();
    });

    it('handles speech recognition end event', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate end event
      const endCallback = (mockSpeechRecognition as any).endCallback;
      if (endCallback) {
        endCallback();
      }

      expect(mockOnEnd).toHaveBeenCalled();
    });
  });

  describe('Error States', () => {
    it('displays error message when error occurs', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          onError={mockOnError}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      // Simulate error
      const errorCallback = (mockSpeechRecognition as any).errorCallback;
      if (errorCallback) {
        errorCallback({ error: 'no-speech', message: 'No speech detected' });
      }

      expect(screen.getByText(/voice input error/i)).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('provides different error messages for different error types', async () => {
      const errorTypes = [
        { error: 'no-speech', expectedMessage: /no speech detected/i },
        { error: 'aborted', expectedMessage: /voice input cancelled/i },
        { error: 'audio-capture', expectedMessage: /microphone access denied/i },
        { error: 'network', expectedMessage: /network error/i },
        { error: 'not-allowed', expectedMessage: /microphone permission denied/i },
        { error: 'service-not-allowed', expectedMessage: /speech service not allowed/i }
      ];

      for (const { error, expectedMessage } of errorTypes) {
        const { unmount } = render(
          <VoiceInput
            onStart={mockOnStart}
            onEnd={mockOnEnd}
            onResult={mockOnResult}
            onError={mockOnError}
            isActive={false}
          />
        );

        const startButton = screen.getByRole('button', { name: /start voice/i });
        await user.click(startButton);

        // Simulate specific error
        const errorCallback = (mockSpeechRecognition as any).errorCallback;
        if (errorCallback) {
          errorCallback({ error });
        }

        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        
        unmount();
        jest.clearAllMocks();
      }
    });

    it('clears error message when starting new recording', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          onError={mockOnError}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      
      // Start and cause error
      await user.click(startButton);
      const errorCallback = (mockSpeechRecognition as any).errorCallback;
      if (errorCallback) {
        errorCallback({ error: 'no-speech' });
      }

      expect(screen.getByText(/no speech detected/i)).toBeInTheDocument();

      // Start again
      await user.click(screen.getByRole('button', { name: /start voice/i }));

      // Error message should be cleared
      expect(screen.queryByText(/no speech detected/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    it('shows recording state visually', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
        />
      );

      const container = screen.getByTestId('voice-input-container');
      expect(container).toHaveClass('voice-input--recording');
      
      // Should show stop icon
      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('mic-icon')).not.toBeInTheDocument();
    });

    it('shows inactive state visually', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const container = screen.getByTestId('voice-input-container');
      expect(container).not.toHaveClass('voice-input--recording');
      
      // Should show mic icon
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
    });

    it('shows volume level indicator during recording', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
          showVolumeLevel={true}
        />
      );

      expect(screen.getByTestId('volume-level-indicator')).toBeInTheDocument();
    });

    it('displays transcript preview when available', async () => {
      const { rerender } = render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
          showTranscript={true}
        />
      );

      // No transcript initially
      expect(screen.queryByTestId('transcript-preview')).not.toBeInTheDocument();

      // Simulate receiving transcript
      rerender(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
          showTranscript={true}
          currentTranscript="Hello world"
        />
      );

      expect(screen.getByTestId('transcript-preview')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const button = screen.getByRole('button', { name: /start voice/i });
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('updates ARIA attributes based on state', () => {
      const { rerender } = render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Inactive state
      const inactiveButton = screen.getByRole('button', { name: /start voice/i });
      expect(inactiveButton).toHaveAttribute('aria-label', expect.stringMatching(/start/i));

      // Active state
      rerender(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
        />
      );

      const activeButton = screen.getByRole('button', { name: /stop voice/i });
      expect(activeButton).toHaveAttribute('aria-label', expect.stringMatching(/stop/i));
    });

    it('provides screen reader announcements for state changes', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Should have live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const button = screen.getByRole('button', { name: /start voice/i });
      
      // Focus and activate with Enter
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(mockOnStart).toHaveBeenCalled();

      // Activate with Space
      fireEvent.keyDown(button, { key: ' ' });
      expect(mockOnStart).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mobile Optimization', () => {
    it('has proper touch targets for mobile', () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const button = screen.getByRole('button', { name: /start voice/i });
      expect(button).toHaveClass('mobile-touch-target');
    });

    it('provides haptic feedback on interactions', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const startButton = screen.getByRole('button', { name: /start voice/i });
      await user.click(startButton);

      expect(mockVibrate).toHaveBeenCalledWith([10]);
    });

    it('handles touch events properly', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const button = screen.getByRole('button', { name: /start voice/i });
      
      // Simulate touch events
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);

      expect(mockOnStart).toHaveBeenCalled();
    });
  });

  describe('Performance and Cleanup', () => {
    it('cleans up speech recognition on unmount', () => {
      const { unmount } = render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={true}
        />
      );

      unmount();

      expect(mockSpeechRecognition.removeEventListener).toHaveBeenCalled();
      expect(mockSpeechRecognition.abort).toHaveBeenCalled();
    });

    it('handles rapid start/stop interactions', async () => {
      render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      const button = screen.getByRole('button');
      
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await user.click(button);
      }

      // Should not cause errors
      expect(mockOnStart).toHaveBeenCalledTimes(5);
    });

    it('prevents memory leaks with proper event cleanup', () => {
      const { rerender, unmount } = render(
        <VoiceInput
          onStart={mockOnStart}
          onEnd={mockOnEnd}
          onResult={mockOnResult}
          isActive={false}
        />
      );

      // Multiple rerenders to test cleanup
      for (let i = 0; i < 10; i++) {
        rerender(
          <VoiceInput
            onStart={mockOnStart}
            onEnd={mockOnEnd}
            onResult={mockOnResult}
            isActive={i % 2 === 0}
          />
        );
      }

      unmount();

      // Should call removeEventListener for cleanup
      expect(mockSpeechRecognition.removeEventListener).toHaveBeenCalled();
    });
  });
});