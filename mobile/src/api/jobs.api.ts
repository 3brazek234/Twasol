import { apiClient } from './client';
import { Job } from '../schemas/job.schema';

// ─── Mapper ─────────────────────────────────────────────────────────────────
// The backend includes the `court` relation directly on each job object.
// We flatten it here so components just read `job.courtNameAr` etc.
const mapJobBackendToFrontend = (job: any): any => ({
  ...job,
  posterId: job.postedByUserId || job.posterId,
  assignedExecutorId: job.assignedLawyerId ?? job.assignedExecutorId ?? null,
  offerAmount: job.offerAmount ? parseFloat(job.offerAmount) : undefined,
  salaryMin: job.salaryMin ? parseFloat(job.salaryMin) : undefined,
  salaryMax: job.salaryMax ? parseFloat(job.salaryMax) : undefined,
  agreedSalary: job.agreedSalary ? parseFloat(job.agreedSalary) : (job.fee ? parseFloat(job.fee) : undefined),
  courtNameAr: job.court?.nameAr ?? job.court_name ?? undefined,
  courtNameEn: job.court?.nameEn ?? undefined,
  posterName: job.postedBy?.fullName ?? job.poster?.fullName ?? job.poster_name ?? undefined,
});

// ─── API Functions ───────────────────────────────────────────────────────────

export const fetchJobs = async (
  courtId?: string,
  status?: string,
  taskType?: string,
  sortBy?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Job[]; meta: { total: number; page: number; limit: number; pages: number } }> => {
  const params = new URLSearchParams();
  if (courtId) params.append('courtId', courtId);
  if (status) params.append('status', status);
  if (taskType) params.append('taskType', taskType);
  if (sortBy) params.append('sortBy', sortBy);
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
  taskType: string;
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
    taskType: jobData.taskType,
    invitedLawyerId: jobData.invitedLawyerId,
    salaryMin: jobData.salaryMin || (jobData.offerAmount ? jobData.offerAmount.toString() : undefined),
    salaryMax: jobData.salaryMax || (jobData.offerAmount ? jobData.offerAmount.toString() : undefined),
    expiresAt: jobData.expiresAt,
  };
  const response = await apiClient.post<any>('/jobs', payload);
  return mapJobBackendToFrontend(response.data);
};

export const applyToJob = async (jobId: string): Promise<{ conversationId: string }> => {
  const res = await apiClient.post<any>(`/jobs/${jobId}/apply`, { conflictsCheckPassed: true });
  return { conversationId: res.data?.conversationId };
};

export const declareJobConflict = async (jobId: string): Promise<void> => {
  await apiClient.post(`/jobs/${jobId}/conflict-declaration`, { hasConflict: true });
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

export const fetchMyActiveJobs = async (): Promise<any[]> => {
  const response = await apiClient.get<any>('/jobs/my-active');
  const jobs = response.data.data ?? response.data;
  return Array.isArray(jobs) ? jobs.map(mapJobBackendToFrontend) : [];
};

export const completeJob = async (jobId: string): Promise<any> => {
  const response = await apiClient.patch<any>(`/jobs/${jobId}/complete`);
  return response.data;
};

export const fetchMyPostedJobs = async (
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Job[]; meta: { total: number; page: number; limit: number; pages: number } }> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const queryString = params.toString();
  const endpoint = `/jobs/mine${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<any>(endpoint);
  const payload = response.data;

  let postedJobs: any[] = [];
  if (Array.isArray(payload)) {
    postedJobs = payload;
  } else if (payload && Array.isArray(payload.posted)) {
    postedJobs = payload.posted;
  } else if (payload && payload.data && Array.isArray(payload.data.posted)) {
    postedJobs = payload.data.posted;
  } else if (payload && Array.isArray(payload.data)) {
    postedJobs = payload.data;
  }

  if (status && status !== 'undefined') {
    postedJobs = postedJobs.filter((job: any) => job.status === status);
  }

  return {
    data: postedJobs.map(mapJobBackendToFrontend),
    meta: { total: postedJobs.length, page: 1, limit: postedJobs.length, pages: 1 },
  };
};
