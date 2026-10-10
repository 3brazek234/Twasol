import React, { useState } from "react";
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { StarRating } from "../../components/StarRating";
import { UserTrustSummary } from "../../components/UserTrustSummary";
import { useLawyerProfile } from "../../hooks/useUsers";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { tokens } from "../../theme/tokens";

export const LawyerProfileScreen = ({ route, navigation }: any) => {
  const { lawyerId } = route.params || {};
  const { data: profile, isLoading, error } = useLawyerProfile(lawyerId);
  const [loadingMsg, setLoadingMsg] = useState(false);

  // Quick hook for reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", lawyerId],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${lawyerId}/reviews`);
      return res.data?.data || { items: [] };
    },
    enabled: !!lawyerId,
  });

  const handleMessage = async () => {
    if (!profile) return;
    setLoadingMsg(true);
    try {
      setTimeout(() => {
        navigation.navigate("ChatsTab", { 
          screen: "Chat",
          params: { 
            conversationId: "new", 
            conversationType: "DIRECT_INQUIRY", 
            otherPartyName: profile.fullName || "محامي",
            targetUserId: lawyerId
          }
        });
        setLoadingMsg(false);
      }, 500);
    } catch (err: any) {
      setLoadingMsg(false);
      Alert.alert("خطأ", "فشل في بدء المحادثة.");
    }
  };

  if (!lawyerId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: tokens.colors.paper }}>
        <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, color: tokens.colors.crimson }}>لم يتم توفير معرف المحامي.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: tokens.colors.paper }}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: tokens.colors.paper }}>
        <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, color: tokens.colors.crimson }}>حدث خطأ في تحميل الملف الشخصي.</Text>
      </View>
    );
  }

  return (
    <ScreenContainer scroll={false} paddingHorizontal={0}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ backgroundColor: tokens.colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: tokens.colors.line }}>
            <UserTrustSummary
              name={profile.fullName || "محامٍ"}
              verificationStatus={profile.verificationStatus}
              averageRating={profile.averageRating}
              reviewCount={profile.reviewCount}
            />
            <Text style={{ fontFamily: tokens.typography.fonts.mono, fontSize: 14, color: tokens.colors.muted, textAlign: "right", marginTop: 12 }}>
              رقم القيد: {profile.barNumber || "غير متوفر"}
            </Text>
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, textAlign: "right", marginBottom: 12 }}>نبذة</Text>
            <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 15, color: tokens.colors.ink, textAlign: "right", lineHeight: 24 }}>
              {profile.bio}
            </Text>
          </View>
        )}

        {/* Courts */}
        {profile.courts && profile.courts.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, textAlign: "right", marginBottom: 12 }}>المحاكم المعتمدة</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
              {profile.courts.map((courtAssoc: any, index: number) => (
                <View key={index} style={{ backgroundColor: tokens.colors.navy + "1A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                  <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 13, color: tokens.colors.navy }}>{courtAssoc.court?.nameAr || "محكمة"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, textAlign: "right", flex: 1 }}>التقييمات</Text>
          </View>

          {isLoadingReviews ? (
            <ActivityIndicator size="small" color={tokens.colors.signal} />
          ) : reviewsData?.items?.length > 0 ? (
            reviewsData.items.map((review: any) => (
              <View key={review.id} style={{ backgroundColor: tokens.colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: tokens.colors.line, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 12, color: tokens.colors.muted }}>
                    {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                  </Text>
                  <StarRating rating={review.rating} />
                </View>
                <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, fontSize: 14, color: tokens.colors.ink, textAlign: "right", marginBottom: 4 }}>
                  {review.reviewer?.fullName || "مستخدم"}
                </Text>
                {review.comment && (
                  <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.ink, textAlign: "right", marginTop: 8 }}>
                    {review.comment}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 14, color: tokens.colors.muted, textAlign: "right" }}>لا توجد تقييمات بعد.</Text>
          )}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};
