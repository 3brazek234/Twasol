import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
import { MotiView } from 'moti';

export const FloatingTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  // Hide tab bar if any screen in the current stack has explicitly requested it
  const focusedRoute = state.routes[state.index];
  const currentRouteName = getFocusedRouteNameFromRoute(focusedRoute) ?? focusedRoute.name;

  const hiddenRoutes = ['LawyerProfile', 'Chat', 'JobDetail', 'PostJob'];
  if (hiddenRoutes.includes(currentRouteName)) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const Icon = options.tabBarIcon;
        const color = isFocused ? tokens.colors.signal : tokens.colors.muted;

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <MotiView
              animate={{ translateY: isFocused ? -2 : 0 }}
              transition={{ type: 'timing', duration: 150 }}
            >
              {Icon && Icon({ focused: isFocused, color, size: 24 })}
            </MotiView>
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color, 
                  fontFamily: isFocused ? tokens.typography.fonts.bodySemibold : tokens.typography.fonts.body 
                }
              ]}
            >
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  }
});
