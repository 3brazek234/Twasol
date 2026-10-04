import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface LawyerProfile {
  id: string;
  fullName: string;
  barNumber?: string | null;
  verificationStatus?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  bio?: string | null;
  courts?: Array<{
    court?: {
      id: string;
      nameAr?: string | null;
      nameEn?: string | null;
    };
  }>;
}

export const useLawyerProfile = (userId: string) => {
  return useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: async () => {
      const res = await apiClient.get<LawyerProfile | null>(`/users/${userId}/profile`);
      if (!res.data) {
        throw new Error("The profile response did not include profile data.");
      }
      return res.data;
    },
    enabled: !!userId,
  });
};
