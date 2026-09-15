import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const usePendingVerifications = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["admin", "verifications", "pending", page, limit],
    queryFn: async () => {
      const res = await apiClient.get("/verification/admin/pending", { params: { page, limit } });
      return res.data;
    },
  });
};

export const useReviewVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, status, notes }: { documentId: string; status: "APPROVED" | "REJECTED"; notes?: string }) => {
      const res = await apiClient.patch(`/verification/admin/${documentId}/review`, { status, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
    },
  });
};

export const getDocumentViewUrl = async (documentId: string) => {
  const res = await apiClient.get(`/verification/admin/${documentId}/view-url`);
  return res.data?.data?.viewUrl;
};
