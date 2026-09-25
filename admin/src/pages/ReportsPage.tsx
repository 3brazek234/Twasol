import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: async () => {
      const res = await api.get('/admin/reports', {
        params: { page, limit: 10 }
      });
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: string, notes?: string }) => 
      api.patch(`/admin/reports/${id}/status`, { status, resolutionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
      setResolutionNotes('');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Trust & Safety Reports</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No reports found</TableCell></TableRow>
            ) : (
              data?.data?.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <p className="font-medium">{report.reporter?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{report.reporter?.email}</p>
                  </TableCell>
                  <TableCell>
                    {report.reportedUser && (
                      <div>
                        <Badge variant="outline" className="mb-1">User</Badge>
                        <p className="font-medium">{report.reportedUser.fullName}</p>
                      </div>
                    )}
                    {report.reportedJob && (
                      <div>
                        <Badge variant="outline" className="mb-1">Job</Badge>
                        <p className="font-medium">{report.reportedJob.title}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'OPEN' ? 'destructive' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="">
                    <Dialog open={selectedReport?.id === report.id} onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>Resolve</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm font-medium">Report Reason:</p>
                          <p className="text-sm bg-muted p-3 rounded-md">{report.reason}</p>
                          
                          <div>
                            <p className="text-sm font-medium mb-1">Resolution Notes</p>
                            <Input 
                              value={resolutionNotes} 
                              onChange={(e) => setResolutionNotes(e.target.value)} 
                              placeholder="Action taken..."
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'DISMISSED', notes: resolutionNotes })}>
                              Dismiss
                            </Button>
                            <Button variant="default" onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'RESOLVED', notes: resolutionNotes })}>
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data?.meta?.page >= data?.meta?.totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
