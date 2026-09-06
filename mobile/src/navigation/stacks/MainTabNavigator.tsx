import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Gavel, Scale, Bell, Award, Settings, Search, Plus, Briefcase } from 'lucide-react-native';

import { HiringHomeScreen } from '../../screens/main/HiringHomeScreen';
import { JobsFeedScreen } from '../../screens/main/JobsFeedScreen';
import { JobDetailScreen } from '../../screens/main/JobDetailScreen';
import { JobCompletionScreen } from '../../screens/main/JobCompletionScreen';
import { PostJobScreen } from '../../screens/main/PostJob/PostJobScreen';
import { ConversationsListScreen } from '../../screens/main/ConversationsListScreen';
import { ChatScreen } from '../../screens/main/ChatScreen';
import { NotificationsScreen } from '../../screens/main/NotificationsScreen';
import { MyJobsScreen } from '../../screens/main/MyJobsScreen';
import { PosterReviewScreen } from '../../screens/main/PosterReviewScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';
import { MyCourtsScreen } from '../../screens/main/MyCourtsScreen';
import { FindLawyersScreen } from '../../screens/main/FindLawyersScreen';
import { LawyerProfileScreen } from '../../screens/main/LawyerProfileScreen';
import { FloatingTabBar } from '../../components/FloatingTabBar';

const MainTabs = createBottomTabNavigator();
const JobsStack = createNativeStackNavigator();
const ChatsStack = createNativeStackNavigator();
const ActiveJobsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: tokens.colors.paper },
  headerTintColor: tokens.colors.ink,
  headerTitleStyle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18 },
  headerShadowVisible: false,
};

const JobsNavigator = () => {
  const { selectedMode } = require('../../stores/authStore').useAuthStore();
  
  return (
    <JobsStack.Navigator 
      screenOptions={defaultScreenOptions} 
      initialRouteName="JobsFeed"
    >
      <JobsStack.Screen 
        name="JobsFeed" 
        component={JobsFeedScreen} 
        options={({ navigation }) => {
          const { user } = require('../../stores/authStore').useAuthStore.getState();
          const canHire = user?.accountMode === 'HIRING' || user?.accountMode === 'BOTH';
          
          return {
            title: 'القائمة العامة',
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {canHire && (
                  <>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('PostJob')}
                      style={{ marginEnd: 16 }}
                    >
                      <Plus size={22} color={tokens.colors.signal} />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  onPress={() => navigation.setParams({ isSearchVisible: true })}
                  style={{ marginEnd: 16 }}
                >
                  <Search size={22} color={tokens.colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SettingsStack', { screen: 'Settings' })}
                >
                  <Settings size={22} color={tokens.colors.ink} />
                </TouchableOpacity>
              </View>
            )
          };
        }} 
      />
      <JobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'تفاصيل القضية' }} />
      <JobsStack.Screen name="JobCompletion" component={JobCompletionScreen} options={{ title: 'إتمام المهمة' }} />
      <JobsStack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'إضافة طلب' }} />
      <JobsStack.Screen name="FindLawyers" component={FindLawyersScreen} options={{ title: 'Find Lawyers' }} />
      <JobsStack.Screen name="LawyerProfile" component={LawyerProfileScreen} options={{ title: 'Lawyer Profile' }} />
      <JobsStack.Screen name="PosterReview" component={PosterReviewScreen} options={{ title: 'تقييم المحامي' }} />
    </JobsStack.Navigator>
  );
};
const ChatsNavigator = () => (
  <ChatsStack.Navigator screenOptions={defaultScreenOptions}>
    <ChatsStack.Screen name="ConversationsList" component={ConversationsListScreen} options={{ title: 'المحادثات' }} />
    <ChatsStack.Screen name="Chat" component={ChatScreen} options={{ title: 'المفاوضات' }} />
  </ChatsStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={defaultScreenOptions}>
    <ProfileStack.Screen name="ProfileHome" component={SettingsScreen} options={{ title: 'Counselor' }} />
    <ProfileStack.Screen name="MyCourts" component={MyCourtsScreen} options={{ title: 'Jurisdictions' }} />
  </ProfileStack.Navigator>
);

const MyJobsNavigator = () => (
  <ActiveJobsStack.Navigator screenOptions={defaultScreenOptions}>
    <ActiveJobsStack.Screen name="MyJobs" component={MyJobsScreen} options={{ headerShown: false }} />
    <ActiveJobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'تفاصيل المهمة' }} />
    <ActiveJobsStack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'نشر مهمة جديدة' }} />
    <ActiveJobsStack.Screen name="PosterReview" component={PosterReviewScreen} options={{ title: 'تقييم المحامي' }} />
  </ActiveJobsStack.Navigator>
);

export const MainNavigator = () => (
  <MainTabs.Navigator 
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: tokens.colors.signal,
      tabBarInactiveTintColor: tokens.colors.muted,
      tabBarIcon: ({ color }) => {
        const iconSize = 24;
        if (route.name === 'JobsTab') return <Gavel color={color} size={iconSize} />;
        if (route.name === 'MyJobsTab') return <Briefcase color={color} size={iconSize} />;
        if (route.name === 'ChatsTab') return <Scale color={color} size={iconSize} />;
        if (route.name === 'NotificationsTab') return <Bell color={color} size={iconSize} />;
        if (route.name === 'ProfileTab') return <Award color={color} size={iconSize} />;
      },
    })}
  >
    <MainTabs.Screen name="JobsTab" component={JobsNavigator} options={{ title: 'الرئيسية' }} />
    <MainTabs.Screen name="MyJobsTab" component={MyJobsNavigator} options={{ title: 'مهامي' }} />
    <MainTabs.Screen name="ChatsTab" component={ChatsNavigator} options={{ title: 'المحادثات' }} />
    <MainTabs.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'الإشعارات' }} />
    <MainTabs.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'حسابي' }} />
  </MainTabs.Navigator>
);
