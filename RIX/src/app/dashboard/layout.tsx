import { EnhancedDashboardLayoutWithContext } from '@/components/layout/enhanced-dashboard-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EnhancedDashboardLayoutWithContext>{children}</EnhancedDashboardLayoutWithContext>;
} 