import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, entityType],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { page, limit: 20, entityType: entityType || undefined }
      });
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Filter by Entity Type (e.g., User, Job)..." 
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No audit logs found</TableCell></TableRow>
            ) : (
              data?.data?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.actor ? (
                      <div>
                        <p className="font-medium text-sm">{log.actor.fullName}</p>
                        <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                      </div>
                    ) : (
                      <span className="text-sm italic text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{log.entityType}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{log.entityId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono max-w-xs overflow-x-auto whitespace-pre">
                    {log.metadata ? JSON.stringify(log.metadata, null, 2) : '-'}
                  </TableCell>
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
