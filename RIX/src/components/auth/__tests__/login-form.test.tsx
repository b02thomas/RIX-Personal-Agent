// /src/components/auth/__tests__/login-form.test.tsx
// Comprehensive tests for the professional login form component
// Tests theme awareness, validation, accessibility, and user interactions
// RELEVANT FILES: login-form.tsx, signin/page.tsx, theme-provider.tsx, auth-store.ts

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/components/providers/theme-provider';

// Mock dependencies
jest.mock('@/store/auth-store');
jest.mock('@/components/providers/theme-provider');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the RixLogo component
jest.mock('@/components/ui/RixLogo', () => ({
  RixLogo: ({ className }: { className?: string }) => (
    <div data-testid="rix-logo" className={className}>
      RIX Logo
    </div>
  ),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('LoginForm', () => {
  const mockSetUser = jest.fn();
  const mockSetAuthError = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      error: null,
      setUser: mockSetUser,
      setError: mockSetAuthError,
      clearError: jest.fn(),
      logout: jest.fn(),
    });

    mockUseTheme.mockReturnValue({
      theme: 'dark',
      effectiveTheme: 'dark',
      setTheme: jest.fn(),
      mounted: true,
    });

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the login form correctly', () => {
      render(<LoginForm />);
      
      expect(screen.getByTestId('rix-logo')).toBeInTheDocument();
      expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
      expect(screen.getByText('Melden Sie sich in Ihrem RIX Konto an')).toBeInTheDocument();
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
    });

    it('shows loading state when not mounted', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        effectiveTheme: 'dark',
        setTheme: jest.fn(),
        mounted: false,
      });

      render(<LoginForm />);
      
      // Should show loading skeleton
      const loadingSkeleton = screen.getByTestId('login-form-loading');
      expect(loadingSkeleton).toBeInTheDocument();
      expect(loadingSkeleton).toHaveClass('animate-pulse');
    });

    it('applies correct theme classes for dark mode', () => {
      render(<LoginForm />);
      
      // Check that dark theme classes are applied
      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      expect(submitButton).toHaveClass('from-blue-600', 'to-cyan-600');
    });

    it('applies correct theme classes for light mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        effectiveTheme: 'light',
        setTheme: jest.fn(),
        mounted: true,
      });

      render(<LoginForm />);
      
      // Check that light theme classes are applied
      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      expect(submitButton).toHaveClass('from-blue-600', 'to-indigo-600');
    });

    it('shows registration link', () => {
      render(<LoginForm />);
      
      const registerLink = screen.getByRole('link', { name: /registrieren/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/auth/signup');
    });
  });

  describe('Form Interactions', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const passwordInput = screen.getByLabelText('Passwort');
      await user.type(passwordInput, 'password123');
      
      expect(passwordInput).toHaveValue('password123');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);
      
      const passwordInput = screen.getByLabelText('Passwort');
      const toggleButton = screen.getByLabelText(/show password|hide password/i);
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle button
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('submits form with correct data', async () => {
      const user = userEvent.setup();
      const mockPush = jest.fn();
      
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'test@example.com' }
        }),
      });

      // Mock router
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }));

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText('Anmeldung...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('displays error message on failed login', async () => {
      const user = userEvent.setup();
      
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid credentials'
        }),
      });

      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      const submitButton = screen.getByRole('button', { name: /anmelden/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      
      expect(mockSetAuthError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      
      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('has proper autocomplete attributes', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('has proper form validation', () => {
      render(<LoginForm />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Passwort');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Theme Integration', () => {
    it('applies correct gradient colors for dark theme', () => {
      render(<LoginForm />);
      
      const title = screen.getByText('Willkommen zurück');
      expect(title).toHaveClass('from-blue-400', 'via-cyan-400', 'to-blue-500');
    });

    it('applies correct gradient colors for light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        effectiveTheme: 'light',
        setTheme: jest.fn(),
        mounted: true,
      });

      render(<LoginForm />);
      
      const title = screen.getByText('Willkommen zurück');
      expect(title).toHaveClass('from-blue-600', 'via-indigo-600', 'to-blue-700');
    });

    it('applies correct button gradients for dark theme', () => {
      render(<LoginForm />);
      
      const button = screen.getByRole('button', { name: /anmelden/i });
      expect(button).toHaveClass('from-blue-600', 'to-cyan-600');
    });

    it('applies correct button gradients for light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        effectiveTheme: 'light',
        setTheme: jest.fn(),
        mounted: true,
      });

      render(<LoginForm />);
      
      const button = screen.getByRole('button', { name: /anmelden/i });
      expect(button).toHaveClass('from-blue-600', 'to-indigo-600');
    });
  });
});