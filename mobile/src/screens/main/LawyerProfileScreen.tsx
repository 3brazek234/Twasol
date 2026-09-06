import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ShieldCheck, MessageSquare, ChevronRight } from 'lucide-react-native';
import { StarRating } from '../../components/StarRating';
import { LawyerData } from '../../components/LawyerCard';

const MOCK_LAWYER: LawyerData & { barNumber: string; bio: string } = {
  id: 'l1',
  name: 'Harvey Specter',
  isVerified: true,
  averageRating: 4.9,
  reviewCount: 42,
  isActive: true,
  courts: ['NY Supreme', 'SDNY'],
  barNumber: '•••1234',
  bio: 'محامي متمرس في القضايا المدنية والتجارية. I have successfully argued in front of the NY Supreme court on numerous occasions, providing swift and decisive results.',
};

export const LawyerProfileScreen = ({ route, navigation }: any) => {
  const [loadingMsg, setLoadingMsg] = useState(false);
  const lawyer = MOCK_LAWYER;

  const handleMessage = async () => {
    setLoadingMsg(true);
    try {
      setTimeout(() => {
        navigation.navigate('Chat', { 
          conversationId: 'stub-conv-1',
          conversationType: 'DIRECT_INQUIRY',
          otherPartyName: lawyer.name
        });
        setLoadingMsg(false);
      }, 500);
    } catch (err: any) {
      setLoadingMsg(false);
      Alert.alert('Error', 'Failed to start conversation.');
    }
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        
        {/* Header */}
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Text className="text-3xl font-displayBold text-ink mr-3">{lawyer.name}</Text>
            {lawyer.isVerified && (
              <ShieldCheck size={24} color="#2A8F85" />
            )}
          </View>
          <Text className="text-base font-mono text-muted">Bar No. {lawyer.barNumber}</Text>
        </View>

        {/* Rating Summary */}
        <TouchableOpacity 
          className="flex-row justify-between items-center bg-white p-6 rounded-2xl border border-line mb-8 shadow-sm"
          activeOpacity={0.7}
        >
          <View>
            <Text className="text-base font-displayBold text-ink mb-2">Client Reviews</Text>
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-displayBold text-ink mr-2">{lawyer.averageRating}</Text>
              <StarRating rating={lawyer.averageRating || 0} size={20} />
            </View>
            <Text className="text-xs text-muted font-body">بناءً على {lawyer.reviewCount} تقييمات</Text>
          </View>
          <ChevronRight size={24} color="#718096" />
        </TouchableOpacity>

        {/* Tags */}
        <View className="mb-8">
          <Text className="text-lg font-displayBold text-ink mb-4">Jurisdictions</Text>
          <View className="flex-row flex-wrap gap-3">
            {lawyer.courts.map((court, idx) => (
              <View key={`court-${idx}`} className="bg-paper px-4 py-2 rounded-lg border border-line">
                <Text className="text-sm text-muted font-bodyMedium">{court}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        {lawyer.bio && (
          <View className="mb-8">
            <Text className="text-lg font-displayBold text-ink mb-4">About</Text>
            <Text className="text-base font-body text-ink leading-6">{lawyer.bio}</Text>
          </View>
        )}

      </ScrollView>

      {/* Action Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t border-line flex-row justify-center pb-10">
        <TouchableOpacity 
          className={`flex-1 flex-row h-14 items-center justify-center bg-signal rounded-xl shadow-md ${loadingMsg ? 'opacity-70' : ''}`}
          activeOpacity={0.8}
          onPress={handleMessage}
          disabled={loadingMsg}
        >
          {loadingMsg ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MessageSquare size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-white text-lg font-bodyBold">Message</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
