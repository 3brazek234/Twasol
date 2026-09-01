import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', page, search],
    queryFn: async () => {
      const res = await api.get('/admin/jobs', {
        params: { page, limit: 10, search: search || undefined }
      });
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Search jobs by title or description..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Posted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Posted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">No jobs found</TableCell></TableRow>
            ) : (
              data?.data?.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <p className="font-medium">{job.title}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{job.postedBy?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{job.postedBy?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{job.status}</Badge></TableCell>
                  <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
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
