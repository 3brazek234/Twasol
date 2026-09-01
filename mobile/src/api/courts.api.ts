import { apiClient } from './client';
import { Court, Governorate, LawyerCourt, CourtType } from '../schemas/court.schema';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapCourt(c: any): Court {
  return {
    id:            c.id,
    nameAr:        c.nameAr || c.name_ar || '',
    nameEn:        c.nameEn || c.name_en || '',
    type:          c.type,
    governorateId: c.governorateId || c.governorate_id || null,
    parentCourtId: c.parentCourtId || c.parent_court_id || null,
    governorate:   c.governorate ? {
      id:     c.governorate.id,
      nameAr: c.governorate.nameAr || c.governorate.name_ar || '',
      nameEn: c.governorate.nameEn || c.governorate.name_en || '',
    } : null,
  };
}

function mapLawyerCourt(lc: any): LawyerCourt {
  return {
    id:       lc.id || `${lc.userId || lc.user_id}-${lc.courtId || lc.court_id}`,
    courtId:  lc.courtId || lc.court_id,
    lawyerId: lc.userId || lc.user_id,
    isActive: lc.isActive ?? lc.is_active ?? true,
    court:    lc.court ? mapCourt(lc.court) : undefined,
  };
}

// ─── Governorates ─────────────────────────────────────────────────────────────

export const getGovernorates = async (): Promise<Governorate[]> => {
  const res = await apiClient.get<any>('/courts/governorates');
  const raw = Array.isArray(res.data) ? res.data : res.data.data ?? [];
  return raw.map((g: any) => ({
    id:     g.id,
    nameAr: g.nameAr || g.name_ar || '',
    nameEn: g.nameEn || g.name_en || '',
  }));
};

// ─── All Courts (with optional filters) ──────────────────────────────────────

export const getAllCourts = async (filters?: {
  type?: CourtType;
  governorateId?: string;
}): Promise<Court[]> => {
  const params: Record<string, string> = { limit: '100' };
  if (filters?.type)          params.type = filters.type;
  if (filters?.governorateId) params.governorateId = filters.governorateId;

  const res = await apiClient.get<any>('/courts', { params });
  const raw = res.data.data ?? (Array.isArray(res.data) ? res.data : []);
  return raw.map(mapCourt);
};

// ─── My Courts ────────────────────────────────────────────────────────────────

export const getMyCourts = async (): Promise<LawyerCourt[]> => {
  const res = await apiClient.get<any>('/users/me');
  const courts = res.data.courts ?? [];
  return courts.map(mapLawyerCourt);
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchCourts = async (query: string): Promise<Court[]> => {
  const res = await apiClient.get<any>('/courts/search', { params: { q: query } });
  const raw = res.data.data ?? [];
  return raw.map(mapCourt);
};

// ─── Register / Remove ────────────────────────────────────────────────────────

export const registerCourt = async (courtId: string): Promise<LawyerCourt> => {
  const res = await apiClient.post<any>('/courts/register', { courtId });
  return mapLawyerCourt(res.data);
};

export const removeCourt = async (courtId: string): Promise<void> => {
  await apiClient.delete(`/courts/${courtId}/deactivate`);
};

export const toggleCourtStatus = async (courtId: string, isActive: boolean): Promise<LawyerCourt> => {
  if (isActive) {
    const res = await apiClient.post<any>('/courts/register', { courtId });
    return mapLawyerCourt(res.data);
  } else {
    const res = await apiClient.delete<any>(`/courts/${courtId}/deactivate`);
    return mapLawyerCourt(res.data ?? {});
  }
};

export const getActiveLawyers = async (courtId: string): Promise<any[]> => {
  const res = await apiClient.get<any[]>(`/courts/${courtId}/active-lawyers`);
  return res.data;
};
