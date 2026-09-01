import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, ClipboardList, Briefcase, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/overview');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading overview...</div>;
  if (error) return <div className="text-destructive">Failed to load overview data.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-brand-muted">Here's what's happening on the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-brand-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.total}</div>
            <p className="text-xs text-brand-muted">
              {data.users.activeLast30d} active in last 30d
            </p>
          </CardContent>
        </Card>

        <Link to="/verification" className="block transition-transform hover:scale-105">
          <Card className={data.verifications.pending > 0 ? 'border-brand-docket' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <ClipboardList className="h-4 w-4 text-brand-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.verifications.pending}</div>
              <p className="text-xs text-brand-muted">Requires review</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs (Last 7d)</CardTitle>
            <Briefcase className="h-4 w-4 text-brand-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.jobs.postedLast7d}</div>
            <p className="text-xs text-brand-muted">
              {data.jobs.completedLast7d} completed
            </p>
          </CardContent>
        </Card>

        <Link to="/reports" className="block transition-transform hover:scale-105">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
              <FileText className="h-4 w-4 text-brand-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.reports.open}</div>
              <p className="text-xs text-brand-muted">Pending resolution</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
