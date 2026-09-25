import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function CourtsPage() {
  const { data: courts, isLoading: isLoadingCourts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const res = await api.get('/courts');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Courts</h1>
      </div>

      <Tabs defaultValue="courts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courts">Courts</TabsTrigger>
        </TabsList>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Court Name (EN)</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="">Court Name (AR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCourts ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : courts?.data?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">No courts found</TableCell></TableRow>
                ) : (
                  courts?.data?.map((court: any) => (
                    <TableRow key={court.id}>
                      <TableCell className="font-medium">{court.nameEn}</TableCell>
                      <TableCell>{court.governorate?.nameEn}</TableCell>
                      <TableCell className=" font-arabic" dir="rtl">{court.nameAr}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </Tabs>
    </div>
  );
}
