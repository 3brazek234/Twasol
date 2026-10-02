import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSocket } from '../api/socket';
import { api } from '../lib/api';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  ClipboardList, 
  Scale, 
  LogOut,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<any[]>([]);

  const { data: badgesData } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      if (!user) return null;
      const res = await api.get('/admin/analytics/badges');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const badges = badgesData || { verification: 0, reports: 0, support: 0 };

  useEffect(() => {
    if (!user) return;

    adminSocket.connect();
    
    const handleNewSignup = (payload: any) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, title: 'New Signup', message: `${payload.fullName} (${payload.email})`, link: '/users' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);

      queryClient.setQueryData(['admin-overview'], (oldData: any) => {
        if (!oldData || !oldData.funnel) return oldData;
        return {
          ...oldData,
          funnel: { ...oldData.funnel, totalRegistered: oldData.funnel.totalRegistered + 1 }
        };
      });
    };

    const handleNewSupportMessage = (payload: any) => {
      const id = Date.now();
      setToasts(prev => [...prev, { 
        id, 
        title: 'New Support Message', 
        message: payload.message?.sender?.fullName ? `From ${payload.message.sender.fullName}` : 'New message in support', 
        link: '/support' 
      }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);

      queryClient.setQueryData(['admin-badges'], (oldData: any) => {
        if (!oldData) return { verification: 0, reports: 0, support: 1 };
        return { ...oldData, support: oldData.support + 1 };
      });
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
    };

    adminSocket.on('admin:new_signup', handleNewSignup);
    adminSocket.on('admin:new_support_message', handleNewSupportMessage);

    const cleanupReconnect = adminSocket.onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    });

    return () => {
      adminSocket.off('admin:new_signup', handleNewSignup);
      adminSocket.off('admin:new_support_message', handleNewSupportMessage);
      cleanupReconnect();
    };
  }, [user, queryClient]);

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Support Inbox', href: '/support', icon: MessageSquare, badge: badges.support },
    { name: 'Verification Queue', href: '/verification', icon: ClipboardList, badge: badges.verification },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard, badge: badges.subscriptions },
    { name: 'Reports', href: '/reports', icon: FileText, badge: badges.reports },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Jobs Oversight', href: '/jobs', icon: Briefcase },
    { name: 'Audit Log', href: '/audit-log', icon: FileText },
    { name: 'Courts & Areas', href: '/courts', icon: Scale },
  ];

  return (
    <div className="flex min-h-screen w-full bg-brand-paper">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold tracking-tight text-brand-ink">Tawasol Admin</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-signal/10 text-brand-signal'
                      : 'text-brand-muted hover:bg-brand-paper hover:text-brand-ink'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.name}
                </div>
                {!!item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-brand-signal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-brand-ink">{user.email}</p>
            <p className="text-xs text-brand-muted">{user.role}</p>
          </div>
          <Button variant="outline" className="w-full justify-start gap-3 text-brand-muted" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="container mx-auto p-6 max-w-6xl">
          <Outlet />
        </div>
        
        {/* Global Toasts */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div key={toast.id} className="bg-brand-ink text-brand-paper p-4 rounded-md shadow-lg flex justify-between items-center w-80 pointer-events-auto">
              <div>
                <p className="font-bold text-sm">{toast.title}</p>
                <p className="text-xs">{toast.message}</p>
              </div>
              <Link to={toast.link} className="text-xs underline ml-4 whitespace-nowrap">View</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
