import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const useAdminPendingVerifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["admin", "verifications", "pending", page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/admin/verifications/pending", { params: { page, limit } });
      return res.data;
    },
  });
};

export const useAdminVerificationDocuments = (userId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin", "verifications", "documents", userId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/verifications/${userId}/documents`);
      return res.data.data;
    },
    enabled,
    staleTime: 4 * 60 * 1000, // 4 mins, since it expires in 5 mins
  });
};

export const useApproveVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/admin/verifications/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications", "pending"] });
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, rejectionReason }: { userId: string, rejectionReason: string }) => {
      const res = await apiClient.post(`/admin/verifications/${userId}/reject`, { rejectionReason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications", "pending"] });
    },
  });
};
