import React from 'react';
import { ScrollView, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Whether the screen should scroll. Defaults to false. */
  scroll?: boolean;
  /** Custom styles for the wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Custom styles for the ScrollView contentContainer (only applies if scroll=true). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Which edges to protect. Defaults to ['top', 'left', 'right', 'bottom']. */
  edges?: Edge[];
  /** 
   * Set to true if this screen lives behind the custom FloatingTabBar.
   * This disables the bottom safe area edge and adds explicit paddingBottom 
   * (inset.bottom + 65px for the tab bar).
   */
  hasFloatingTabBar?: boolean;
  /** Optional background color override. Defaults to tokens.colors.paper (theme aware). */
  backgroundColor?: string;
  /** Optional padding override. Defaults to tokens.layout.screenPaddingHorizontal. */
  paddingHorizontal?: number;
  /** Explicit numeric bottom inset to append to the safe area (e.g. for floating buttons or overlaid tab bars). Defaults to 0. */
  bottomInset?: number;
}

export const ScreenContainer = ({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  edges = ['top', 'left', 'right', 'bottom'],
  backgroundColor,
  paddingHorizontal = tokens.layout.screenPaddingHorizontal,
  bottomInset = 0,
}: ScreenContainerProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const bg = backgroundColor || colors.paper;

  const baseWrapperStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal,
  };

  const finalBottomPadding = edges.includes('bottom') 
    ? tokens.layout.screenPaddingVertical + bottomInset
    : tokens.layout.screenPaddingVertical + bottomInset + insets.bottom;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={[baseWrapperStyle, style]}
          contentContainerStyle={[
            { paddingBottom: finalBottomPadding },
            contentContainerStyle
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[baseWrapperStyle, { paddingBottom: finalBottomPadding }, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};
