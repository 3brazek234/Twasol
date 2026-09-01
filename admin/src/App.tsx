import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import VerificationQueuePage from './pages/VerificationQueuePage';
import UsersPage from './pages/UsersPage';
import JobsPage from './pages/JobsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import CourtsPage from './pages/CourtsPage';
import TranslationStatusPage from './pages/TranslationStatusPage';
import SupportInboxPage from './pages/SupportInboxPage';
import SubscriptionsPage from './pages/SubscriptionsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/verification" element={<VerificationQueuePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/translation-status" element={<TranslationStatusPage />} />
            <Route path="/support" element={<SupportInboxPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
