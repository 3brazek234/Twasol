import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { CheckCircle, XCircle, Eye, CreditCard } from 'lucide-react';

const METHOD_LABELS: Record<string, string> = {
  MANUAL_BANK_TRANSFER: 'تحويل بنكي',
  MANUAL_VODAFONE_CASH: 'فودافون كاش',
  MANUAL_CASH:          'نقدي',
};

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED:  'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  SUCCESS: 'مفعّل',
  FAILED:  'مرفوض',
};

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', activeTab],
    queryFn: async () => {
      const res = await api.get('/admin/subscription/payments', { params: { status: activeTab, limit: 50 } });
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/subscription/payments/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/admin/subscription/payments/${id}/reject`, { notes }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
    },
  });

  const viewReceiptMutation = useMutation({
    mutationFn: (id: string) => api.get(`/admin/subscription/payments/${id}/receipt`),
    onSuccess: (res) => window.open(res.data.data.url, '_blank'),
  });

  const payments = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7" />
            طلبات الاشتراك
          </h1>
          <p className="text-muted-foreground mt-1">مراجعة إيصالات الدفع اليدوي وتفعيل حسابات المحامين</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="PENDING">قيد المراجعة</TabsTrigger>
          <TabsTrigger value="SUCCESS">مفعّلة</TabsTrigger>
          <TabsTrigger value="FAILED">مرفوضة</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المحامي</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">جار التحميل...</TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
                ) : payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                        {p.user?.barNumber && <p className="text-xs text-muted-foreground">رقم النقابة: {p.user.barNumber}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</TableCell>
                    <TableCell className="font-mono">{(p.amountPiasters / 100).toFixed(0)} ج.م</TableCell>
                    <TableCell>{p.durationMonths} شهر</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        {p.receiptFileKey && (
                          <Button variant="outline" size="sm" onClick={() => viewReceiptMutation.mutate(p.id)}>
                            <Eye className="h-4 w-4 ml-1" /> عرض الإيصال
                          </Button>
                        )}
                        {p.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveMutation.mutate(p.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => { setRejectingId(p.id); setRejectNotes(''); }}
                            >
                              <XCircle className="h-4 w-4 ml-1" /> رفض
                            </Button>
                          </>
                        )}
                        {p.notes && (
                          <span className="text-xs text-muted-foreground max-w-[120px] truncate" title={p.notes}>
                            {p.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" dir="rtl">
            <h2 className="text-lg font-bold mb-4">سبب رفض الإيصال</h2>
            <textarea
              className="w-full border rounded-md p-3 text-sm h-28 resize-none"
              placeholder="اكتب سبب الرفض هنا — سيتم إرساله للمحامي مباشرةً..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
            <div className="flex gap-3 mt-4 justify-end">
              <Button variant="outline" onClick={() => setRejectingId(null)}>إلغاء</Button>
              <Button variant="destructive"
                disabled={rejectNotes.trim().length < 5 || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectingId, notes: rejectNotes })}
              >
                تأكيد الرفض
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
