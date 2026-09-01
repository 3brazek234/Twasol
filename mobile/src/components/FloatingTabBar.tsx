import React from 'react';
import { View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GlassContainer } from './GlassContainer';

const { width } = Dimensions.get('window');

export const FloatingTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  // Hide tab bar if any screen in the current stack has explicitly requested it
  const focusedRoute = state.routes[state.index];

  const currentStackState = focusedRoute.state;
  const currentRouteName = currentStackState
    ? currentStackState.routes[currentStackState.index ?? 0].name
    : focusedRoute.name;

  const hiddenRoutes = ['LawyerProfile', 'Chat', 'JobDetail', 'PostJob'];
  if (hiddenRoutes.includes(currentRouteName)) {
    return null;
  }

  return (
    <View
      className="absolute left-0 right-0 items-center z-[100]"
      style={{ bottom: insets.bottom + 16 }}
    >
      <GlassContainer
        className="flex-row rounded-full items-center justify-around px-4 shadow-lg"
        intensity={90}
        style={{ width: width - 64, height: 64, flexDirection: 'row' }}
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

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              className="items-center justify-center h-full flex-1"
              activeOpacity={0.7}
            >
              <MotiView
                animate={{
                  scale: isFocused ? 1.1 : 1,
                  opacity: isFocused ? 1 : 0.5,
                }}
                transition={{ type: 'timing', duration: 200 }}
              >
                {Icon && Icon({ focused: isFocused, color: isFocused ? "#2A8F85" : "#718096", size: 24 })}
              </MotiView>
              {isFocused && (
                <MotiView
                  layout={Platform.OS === 'ios' ? undefined : undefined}
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1 h-1 rounded-full bg-signal mt-1 absolute bottom-2"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </GlassContainer>
    </View>
  );
};
