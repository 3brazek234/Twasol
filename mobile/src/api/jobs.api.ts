import { apiClient } from './client';
import { Job } from '../schemas/job.schema';

const mapJobBackendToFrontend = (job: any): Job => ({
  id: job.id,
  title: job.title,
  description: job.description,
  status: job.status,
  posterId: job.postedByUserId,
  assignedExecutorId: job.assignedLawyerId,
  offerAmount: job.offerAmount ? parseFloat(job.offerAmount) : undefined,
  courtId: job.courts?.[0]?.courtId || '',
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

export const fetchJobs = async (
  courtId?: string,
  status?: string,
  searchQuery?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Job[]; meta: { total: number; page: number; limit: number; pages: number } }> => {
  const params = new URLSearchParams();
  if (courtId) params.append('courtId', courtId);
  if (status) params.append('status', status);
  if (searchQuery) params.append('q', searchQuery);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const queryString = params.toString();
  const endpoint = `/jobs${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<any>(endpoint);
  return {
    data: response.data.data.map(mapJobBackendToFrontend),
    meta: response.data.meta,
  };
};

export const createJob = async (jobData: { 
  title: string; 
  description: string; 
  courtId: string; 
  invitedLawyerId?: string;
  offerAmount?: number;
  salaryMin?: string;
  salaryMax?: string;
  expiresAt?: string;
}): Promise<Job> => {
  const payload = {
    title: jobData.title,
    description: jobData.description,
    courtId: jobData.courtId,
    invitedLawyerId: jobData.invitedLawyerId,
    salaryMin: jobData.salaryMin || (jobData.offerAmount ? jobData.offerAmount.toString() : undefined),
    salaryMax: jobData.salaryMax || (jobData.offerAmount ? jobData.offerAmount.toString() : undefined),
    expiresAt: jobData.expiresAt,
  };
  const response = await apiClient.post<any>('/jobs', payload);
  return mapJobBackendToFrontend(response.data);
};

export const applyToJob = async (jobId: string): Promise<{ conversationId: string }> => {
  const res = await apiClient.post<any>(`/jobs/${jobId}/apply`);
  return { conversationId: res.data?.conversationId };
};

export const updateJobStatus = async (jobId: string, status: string): Promise<Job> => {
  const response = await apiClient.patch<any>(`/jobs/${jobId}/status`, { status });
  return mapJobBackendToFrontend(response.data);
};

export const fetchJobById = async (jobId: string): Promise<Job> => {
  const response = await apiClient.get<any>(`/jobs/${jobId}`);
  return mapJobBackendToFrontend(response.data);
};

export const translateJob = async (jobId: string, targetLocale: 'EN' | 'AR'): Promise<{ title: string; description: string }> => {
  const response = await apiClient.post<any>(`/jobs/${jobId}/translate`, { targetLocale });
  return response.data.data;
};
