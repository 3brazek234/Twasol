import { apiClient } from './client';
import { Job } from '../schemas/job.schema';

// ─── Mapper ─────────────────────────────────────────────────────────────────
// The backend includes the `court` relation directly on each job object.
// We flatten it here so components just read `job.courtNameAr` etc.
const mapJobBackendToFrontend = (job: any): Job => ({
  id: job.id,
  title: job.title,
  description: job.description,
  status: job.status,
  posterId: job.postedByUserId,
  assignedExecutorId: job.assignedLawyerId ?? null,
  offerAmount: job.offerAmount ? parseFloat(job.offerAmount) : undefined,
  salaryMin: job.salaryMin ? parseFloat(job.salaryMin) : undefined,
  salaryMax: job.salaryMax ? parseFloat(job.salaryMax) : undefined,
  // court relation is included by the backend (include: { court: true })
  courtId: job.courtId,
  courtNameAr: job.court?.nameAr ?? undefined,
  courtNameEn: job.court?.nameEn ?? undefined,
  posterName: job.poster?.fullName ?? undefined,
  expiresAt: job.expiresAt ?? null,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

// ─── API Functions ───────────────────────────────────────────────────────────

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

  // The apiClient interceptor unwraps { success, data, meta } into { data, meta }
  const response = await apiClient.get<any>(endpoint);
  const payload = response.data;

  return {
    data: (payload.data ?? payload).map(mapJobBackendToFrontend),
    meta: payload.meta ?? { total: 0, page, limit, pages: 0 },
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
  // The interceptor has already unwrapped { success, data } → response.data is the inner data object
  return response.data;
};
