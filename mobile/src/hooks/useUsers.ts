import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export const useLawyerProfile = (userId: string) => {
  return useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userId}/profile`);
      return res.data?.data;
    },
    enabled: !!userId,
  });
};
