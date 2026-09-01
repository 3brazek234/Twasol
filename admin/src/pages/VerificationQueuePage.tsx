import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export default function VerificationQueuePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', page],
    queryFn: async () => {
      const res = await api.get('/verification/admin/pending', {
        params: { page, limit: 10 }
      });
      return res.data;
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: 'APPROVED' | 'REJECTED', notes?: string }) => 
      api.patch(`/verification/admin/${id}/review`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setSelectedDoc(null);
      setNotes('');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">No pending verifications</TableCell></TableRow>
            ) : (
              data?.data?.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{doc.user?.fullName}</p>
                      <p className="text-sm text-muted-foreground">{doc.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{doc.documentType}</Badge></TableCell>
                  <TableCell>{new Date(doc.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog open={selectedDoc?.id === doc.id} onOpenChange={(isOpen) => !isOpen && setSelectedDoc(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDoc(doc)}>Review</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Verification Document</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Document Link</p>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                              View Original File
                            </a>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Review Notes</p>
                            <Input 
                              value={notes} 
                              onChange={(e) => setNotes(e.target.value)} 
                              placeholder="Optional notes for the user..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="destructive" onClick={() => reviewMutation.mutate({ id: doc.id, status: 'REJECTED', notes })}>
                              Reject
                            </Button>
                            <Button onClick={() => reviewMutation.mutate({ id: doc.id, status: 'APPROVED', notes })}>
                              Approve
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
