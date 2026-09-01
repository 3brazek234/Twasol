import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { tokens } from '../theme/tokens';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  style?: any;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  interactive = false,
  onRatingChange,
  style,
}) => {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={[styles.container, style]}>
      {stars.map((star) => {
        const isFilled = star <= rating;
        const color = isFilled ? '#EAB308' : tokens.colors.line; // Amber/Gold color for stars

        if (interactive) {
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange && onRatingChange(star)}
              activeOpacity={0.7}
              style={styles.starWrapper}
            >
              <Star
                size={size}
                color={color}
                fill={isFilled ? color : 'transparent'}
              />
            </TouchableOpacity>
          );
        }

        return (
          <View key={star} style={styles.starWrapper}>
            <Star
              size={size}
              color={color}
              fill={isFilled ? color : 'transparent'}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starWrapper: {
    marginEnd: 4,
  },
});
