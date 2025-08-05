// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/dashboard/__tests__/redesigned-dashboard.test.tsx
// Comprehensive tests for the redesigned RIX Dashboard
// Tests logo integration, typography, glassmorphism design, and functionality
// RELEVANT FILES: dashboard/page.tsx, components/ChatInterface.tsx, components/SphereWidget.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../page';

// Mock the components
jest.mock('../../components/ChatInterface', () => {
  return {
    ChatInterface: () => <div data-testid="chat-interface">Mock Chat Interface</div>
  };
});

jest.mock('../../components/SphereWidget', () => {
  return {
    SphereWidget: () => <div data-testid="sphere-widget">Mock Sphere Widget</div>
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Redesigned RIX Dashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        projects: [],
        stats: {
          tasks: { total: 12, completed: 7, overdue: 2 },
          calendar: { today: 3, week: 8 },
          goals: { active: 4, progress: 67 },
          routines: { completed: 3, total: 5 }
        }
      })
    });
  });

  describe('Logo Integration', () => {
    it('should display RIX logo with neural wave pattern', () => {
      render(<Dashboard />);
      
      // Check for logo container
      const logoContainer = screen.getByRole('img', { hidden: true });
      expect(logoContainer).toBeInTheDocument();
      
      // Check for SVG elements (neural wave pattern and lightning bolt)
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
      
      // Verify logo styling
      const logoDiv = document.querySelector('.bg-gradient-to-br.from-blue-600.to-blue-800');
      expect(logoDiv).toBeInTheDocument();
    });

    it('should have proper branding text', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('RIX Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Ihr KI-gestützter Produktivitäts-Assistent')).toBeInTheDocument();
    });
  });

  describe('Glassmorphism Design', () => {
    it('should apply backdrop blur effects', () => {
      render(<Dashboard />);
      
      // Check for backdrop blur classes
      const blurElements = document.querySelectorAll('.backdrop-blur-sm');
      expect(blurElements.length).toBeGreaterThan(0);
      
      // Check for glassmorphism cards
      const glassCards = document.querySelectorAll('.bg-gray-800\\/50');
      expect(glassCards.length).toBeGreaterThan(0);
    });

    it('should have proper gradient backgrounds', () => {
      render(<Dashboard />);
      
      // Check for main gradient background
      const gradientBg = document.querySelector('.bg-gradient-to-br.from-gray-900');
      expect(gradientBg).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should display all stat cards with proper values', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Aufgaben')).toBeInTheDocument();
        expect(screen.getByText('Termine')).toBeInTheDocument();
        expect(screen.getByText('Ziele')).toBeInTheDocument();
        expect(screen.getByText('Routinen')).toBeInTheDocument();
      });
      
      // Check for stats values
      expect(screen.getByText('5')).toBeInTheDocument(); // tasks remaining
      expect(screen.getByText('3')).toBeInTheDocument(); // today's events
      expect(screen.getByText('67%')).toBeInTheDocument(); // goals progress
      expect(screen.getByText('3/5')).toBeInTheDocument(); // routines completed
    });

    it('should show trend indicators', () => {
      render(<Dashboard />);
      
      // Check for trend indicators
      expect(screen.getByText('+12%')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });
  });

  describe('Project Cards', () => {
    it('should display project cards with progress bars', () => {
      render(<Dashboard />);
      
      // Check for project names
      expect(screen.getByText('Personal Productivity')).toBeInTheDocument();
      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
      expect(screen.getByText('Business Development')).toBeInTheDocument();
      expect(screen.getByText('Health & Fitness')).toBeInTheDocument();
      
      // Check for progress indicators
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should show project status indicators', () => {
      render(<Dashboard />);
      
      // Check for status dots (using CSS classes)
      const activeProjects = document.querySelectorAll('.bg-green-500');
      const pausedProjects = document.querySelectorAll('.bg-yellow-500');
      
      expect(activeProjects.length).toBeGreaterThan(0);
      expect(pausedProjects.length).toBeGreaterThan(0);
    });
  });

  describe('View Toggle', () => {
    it('should switch between overview and chat views', () => {
      render(<Dashboard />);
      
      // Initially should show overview
      expect(screen.getByText('Aktuelle Projekte')).toBeInTheDocument();
      
      // Click chat toggle
      const chatButton = screen.getByRole('button', { name: /RIX Chat/i });
      fireEvent.click(chatButton);
      
      // Should show chat interface
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    it('should highlight active view button', () => {
      render(<Dashboard />);
      
      const overviewButton = screen.getByRole('button', { name: /Übersicht/i });
      const chatButton = screen.getByRole('button', { name: /RIX Chat/i });
      
      // Overview should be active initially
      expect(overviewButton).toHaveClass('bg-blue-600');
      expect(chatButton).not.toHaveClass('bg-blue-600');
      
      // Switch to chat
      fireEvent.click(chatButton);
      
      expect(chatButton).toHaveClass('bg-blue-600');
      expect(overviewButton).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Sphere Widget Integration', () => {
    it('should display sphere widget in sidebar', () => {
      render(<Dashboard />);
      
      expect(screen.getByTestId('sphere-widget')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Neuer Termin')).toBeInTheDocument();
      expect(screen.getByText('Neue Aufgabe')).toBeInTheDocument();
      expect(screen.getByText('Wissen speichern')).toBeInTheDocument();
    });
  });

  describe('Today\'s Schedule', () => {
    it('should display scheduled events', () => {
      render(<Dashboard />);
      
      expect(screen.getByText('Heute geplant')).toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Client Call')).toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-friendly layout classes', () => {
      render(<Dashboard />);
      
      // Check for responsive grid classes
      const gridElements = document.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-4');
      expect(gridElements.length).toBeGreaterThan(0);
      
      // Check for mobile spacing
      const mobileSpacing = document.querySelectorAll('.gap-4.mb-6');
      expect(mobileSpacing.length).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('should fetch dashboard data on mount', async () => {
      render(<Dashboard />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/projects');
        expect(fetch).toHaveBeenCalledWith('/api/dashboard/stats');
      });
    });
  });

  describe('Typography', () => {
    it('should apply Inter font and proper tracking', () => {
      render(<Dashboard />);
      
      // Check for tracking classes on headings
      const headings = document.querySelectorAll('.tracking-tight, .tracking-wide');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for font weight variations
      const boldText = document.querySelectorAll('.font-bold, .font-semibold, .font-medium');
      expect(boldText.length).toBeGreaterThan(0);
    });
  });
});