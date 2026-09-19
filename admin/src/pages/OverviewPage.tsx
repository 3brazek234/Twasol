import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, ClipboardList, Briefcase, CreditCard } from 'lucide-react';
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
            <CardTitle className="text-sm font-medium">MRR (Monthly Revenue)</CardTitle>
            <CreditCard className="h-4 w-4 text-brand-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.revenue.mrr / 100).toLocaleString()} EGP</div>
            <p className="text-xs text-brand-muted">
              Active subscriptions only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Users</CardTitle>
            <Users className="h-4 w-4 text-brand-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.funnel.totalRegistered}</div>
            <p className="text-xs text-brand-muted">
              {data.funnel.totalVerified} verified • {data.funnel.totalActiveSubscriptions} subscribed
            </p>
          </CardContent>
        </Card>

        <Link to="/verification" className="block transition-transform hover:scale-105">
          <Card className={data.queues.pendingVerifications > 0 ? 'border-brand-docket' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Queues</CardTitle>
              <ClipboardList className="h-4 w-4 text-brand-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.queues.pendingVerifications} Verifications</div>
              <p className="text-xs text-brand-muted">{data.queues.pendingPayments} Pending Payments</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Fill Rate (30d)</CardTitle>
            <Briefcase className="h-4 w-4 text-brand-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.fillRate.fillRate * 100)}%</div>
            <p className="text-xs text-brand-muted">
              {data.fillRate.completedCount} completed out of {data.fillRate.terminalCount} terminal jobs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
