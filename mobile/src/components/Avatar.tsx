import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";

// ─── Avatar ──────────────────────────────────────────────────────────────────
// Initials-based circular avatar. Used on JobCard to give each job a human
// touchpoint — poster, hired lawyer, or client depending on variant.
// Falls back to "؟" when no name is available (backend gap placeholder).

interface AvatarProps {
  /** Full name to derive initials from. Null/undefined shows "؟". */
  name?: string | null;
  /** Diameter in pixels. Default 28. */
  size?: number;
  /** Background color. Defaults to tokens.colors.navy. */
  bgColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 28,
  bgColor = tokens.colors.navy,
}) => {
  const trimmed = name?.trim() ?? "";
  // Use first character; Arabic names start with a meaningful letter
  const initial = trimmed.length > 0 ? trimmed.charAt(0) : "؟";
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initial, { fontSize, lineHeight: size }]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  initial: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
