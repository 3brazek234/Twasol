import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck, ChevronRight, MapPin } from 'lucide-react-native';
import { StarRating } from './StarRating';

export interface LawyerData {
  id: string;
  name: string;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  courts: string[];
}

interface LawyerCardProps {
  lawyer: LawyerData;
  onPress: () => void;
}

export const LawyerCard = ({ lawyer, onPress }: LawyerCardProps) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-white rounded-2xl p-5 mb-4 border border-line shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-displayBold text-ink mr-2" numberOfLines={1}>
              {lawyer.name}
            </Text>
            {lawyer.isVerified && (
              <ShieldCheck size={18} color="#2A8F85" />
            )}
          </View>
          <View className="flex-row items-center">
            <StarRating rating={lawyer.averageRating} size={14} />
            <Text className="text-xs font-body text-muted ml-2">
              ({lawyer.reviewCount} reviews)
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#718096" className="mt-1" />
      </View>

      <View className="flex-row items-center border-t border-line/50 pt-4">
        <MapPin size={14} color="#718096" className="mr-1.5" />
        <Text className="text-xs font-body text-muted" numberOfLines={1}>
          {lawyer.courts.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

