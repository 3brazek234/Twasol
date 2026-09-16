import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";

// ─── StatusPill ───────────────────────────────────────────────────────────────
// Compact status badge used on JobCard headers and elsewhere.
// The `isTerminal` prop reduces pill opacity to signal a "closed" state —
// used when the whole card is already at reduced opacity (completed/cancelled/expired).

interface StatusPillProps {
  status: string;
  /**
   * When true, reduces the pill's visual weight to signal a closed/archived state.
   * Pair this with the card's own terminal opacity treatment.
   */
  isTerminal?: boolean;
}

export const getStatusConfig = (status: string) => {
  switch (status) {
    case "OPEN":
      return { label: "متاح", bg: tokens.colors.slateBg, text: tokens.colors.signal };
    case "NEGOTIATING":
      return { label: "قيد التفاوض", bg: tokens.colors.amberBg, text: tokens.colors.amber };
    case "AGREED":
      return { label: "تم الاتفاق", bg: tokens.colors.verdantBg, text: tokens.colors.verdant };
    case "IN_PROGRESS":
      return { label: "جاري التنفيذ", bg: tokens.colors.verdantBg, text: tokens.colors.verdant };
    case "COMPLETED":
      return { label: "مكتمل", bg: tokens.colors.slateBg, text: tokens.colors.navy };
    case "CANCELLED":
      return { label: "ملغي", bg: tokens.colors.surface, text: tokens.colors.muted };
    case "EXPIRED":
      return { label: "منتهي", bg: tokens.colors.crimsonBg, text: tokens.colors.crimson };
    default:
      return { label: "متاح", bg: tokens.colors.slateBg, text: tokens.colors.signal };
  }
};

export const StatusPill = ({ status, isTerminal = false }: StatusPillProps) => {
  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, opacity: isTerminal ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: tokens.typography.fonts.bodySemibold,
    letterSpacing: 0.5,
  },
});
