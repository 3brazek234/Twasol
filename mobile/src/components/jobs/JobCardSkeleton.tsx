import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { tokens } from "../../theme/tokens";

export type JobCardVariant = "feed" | "posted" | "active" | "compact";

export function JobCardSkeleton({ variant = "feed" }: { variant?: JobCardVariant }) {
  const opacity = useSharedValue(0.3);
  const isCompact = variant === "compact";

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Animated.View style={[styles.skeletonBlock, { width: 120, height: 16 }, animatedStyle]} />
        <Animated.View style={[styles.skeletonBlock, { width: 60, height: 20, borderRadius: 4 }, animatedStyle]} />
      </View>

      <Animated.View style={[styles.skeletonBlock, { width: "80%", height: 24, marginBottom: 8 }, animatedStyle]} />
      {!isCompact && <Animated.View style={[styles.skeletonBlock, { width: "50%", height: 24, marginBottom: 12 }, animatedStyle]} />}

      {isCompact && (
        <Animated.View style={[styles.skeletonBlock, { width: 110, height: 16, marginBottom: 4 }, animatedStyle]} />
      )}

      {!isCompact && (variant === "feed" || variant === "active") && (
        <Animated.View style={[styles.skeletonBlock, { width: "40%", height: 16, marginBottom: 16 }, animatedStyle]} />
      )}

      {!isCompact && (
        <View style={styles.metaRow}>
          <Animated.View style={[styles.skeletonBlock, { width: 80, height: 20, borderRadius: 4 }, animatedStyle]} />
          <Animated.View style={[styles.skeletonBlock, { width: 100, height: 20 }, animatedStyle]} />
        </View>
      )}

      {isCompact && (
        <View style={styles.compactFooter}>
          <Animated.View style={[styles.skeletonBlock, styles.compactFeeSkeleton, animatedStyle]} />
          <View style={styles.compactMetaGroup}>
            <Animated.View style={[styles.skeletonBlock, { width: 92, height: 24, borderRadius: tokens.radius.sm }, animatedStyle]} />
            <Animated.View style={[styles.skeletonBlock, { width: 76, height: 16 }, animatedStyle]} />
          </View>
        </View>
      )}

      {!isCompact && variant === "active" && (
        <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 4, marginTop: 12 }, animatedStyle]} />
      )}

      {!isCompact && variant !== "feed" && (
        <View style={styles.actionRow}>
          <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 40, borderRadius: 8 }, animatedStyle]} />
          <Animated.View style={[styles.skeletonBlock, { flex: 1, height: 40, borderRadius: 8 }, animatedStyle]} />
        </View>
      )}
      {!isCompact && variant === "feed" && (
        <View style={styles.actionRow}>
          <Animated.View style={[styles.skeletonBlock, { width: "100%", height: 40, borderRadius: 8 }, animatedStyle]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    marginBottom: 12,
    direction: "rtl",
    ...tokens.shadows.sm,
  },
  cardCompact: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  compactFooter: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    paddingTop: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  compactMetaGroup: {
    flex: 1,
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xs,
    minWidth: 0,
  },
  compactFeeSkeleton: {
    width: 88,
    height: 32,
    borderRadius: tokens.radius.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  skeletonBlock: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 4,
  },
});
