import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const useAdminPendingSubscriptions = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["admin", "subscriptions", "pending", page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/admin/subscription/payments", { params: { status: 'PENDING', page, limit } });
      return res.data;
    },
  });
};

export const useAdminSubscriptionReceipt = (paymentId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin", "subscriptions", "receipt", paymentId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/subscription/payments/${paymentId}/receipt`);
      return res.data.data;
    },
    enabled,
    staleTime: 4 * 60 * 1000,
  });
};

export const useApproveSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, notes }: { paymentId: string, notes?: string }) => {
      const res = await apiClient.patch(`/admin/subscription/payments/${paymentId}/approve`, { notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "pending"] });
    },
  });
};

export const useRejectSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, notes }: { paymentId: string, notes: string }) => {
      const res = await apiClient.patch(`/admin/subscription/payments/${paymentId}/reject`, { notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions", "pending"] });
    },
  });
};
