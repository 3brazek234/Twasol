import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Gavel, Scale, Bell, Award, Settings, Briefcase } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';

import { JobsFeedScreen } from '../../screens/main/JobsFeedScreen';
import { HiringHomeScreen } from '../../screens/main/HiringHomeScreen';
import { JobDetailScreen } from '../../screens/main/JobDetailScreen';
import { JobCompletionScreen } from '../../screens/main/JobCompletionScreen';
import { PostJobScreen } from '../../screens/main/PostJob/PostJobScreen';
import { ConversationsListScreen } from '../../screens/main/ConversationsListScreen';
import { NegotiationScreen } from '../../screens/main/NegotiationScreen';
import { NotificationsScreen } from '../../screens/main/NotificationsScreen';
import { MyJobsScreen } from '../../screens/main/MyJobsScreen';
import { PosterReviewScreen } from '../../screens/main/PosterReviewScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';
import { MyCourtsScreen } from '../../screens/main/MyCourtsScreen';
import { LawyerProfileScreen } from '../../screens/main/LawyerProfileScreen';
import { FloatingTabBar } from '../../components/FloatingTabBar';
import { ModeSwitcher } from '../../components/ModeSwitcher';

const MainTabs = createBottomTabNavigator();
const JobsStack = createNativeStackNavigator();
const ChatsStack = createNativeStackNavigator();
const ActiveJobsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const headerTitleStyle = {
  fontFamily: tokens.typography.fonts.bodySemibold,
  fontSize: 18,
  color: tokens.colors.ink,
  textAlign: 'right' as const,
};

const defaultScreenOptions = {
  headerStyle: { backgroundColor: tokens.colors.paper },
  headerTintColor: tokens.colors.ink,
  headerTitleStyle,
  headerTitleAlign: 'left' as const,
  headerShadowVisible: false,
};

const getSelectedRole = (
  accountMode: 'GIG' | 'HIRING' | 'BOTH' | undefined,
  selectedMode: 'GIG' | 'HIRING' | null,
) => accountMode === 'BOTH' ? selectedMode ?? 'GIG' : accountMode ?? 'GIG';

const JobsHomeHeaderTitle = () => {
  const { user, selectedMode } = useAuthStore();
  const isHiring = getSelectedRole(user?.accountMode, selectedMode) === 'HIRING';

  return (
    <Text
      style={{
        ...headerTitleStyle,
        textAlign: 'right',
        alignSelf: 'flex-end',
      }}
    >
      {isHiring ? 'إدارة مهامي' : 'فرص عمل محلية'}
    </Text>
  );
};

const JobsHomeHeaderActions = ({ navigation }: { navigation: any }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="الإعدادات"
        onPress={() => navigation.navigate('SettingsStack', { screen: 'Settings' })}
      >
        <Settings size={22} color={tokens.colors.ink} />
      </TouchableOpacity>
    </View>
  );
};

const RoleFocusedHomeScreen = ({ navigation, route }: any) => {
  const { user, selectedMode } = useAuthStore();
  const selectedRole = getSelectedRole(user?.accountMode, selectedMode);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.paper }}>
      <ModeSwitcher />
      <View style={{ flex: 1 }}>
        {selectedRole === 'HIRING'
          ? <HiringHomeScreen navigation={navigation} route={route} />
          : <JobsFeedScreen navigation={navigation} route={route} />}
      </View>
    </View>
  );
};

const JobsNavigator = () => {
  
  return (
    <JobsStack.Navigator 
      screenOptions={defaultScreenOptions} 
    >
      <JobsStack.Screen 
        name="JobsFeed" 
        component={RoleFocusedHomeScreen}
        options={({ navigation }) => {
          return {
            title: '',
            headerLeft: () => <JobsHomeHeaderActions navigation={navigation} />,
            headerRight: () => <JobsHomeHeaderTitle />,
          };
        }} 
      />
      <JobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'تفاصيل القضية' }} />
      <JobsStack.Screen name="JobCompletion" component={JobCompletionScreen} options={{ title: 'إتمام المهمة' }} />
      <JobsStack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'إضافة طلب' }} />
      <JobsStack.Screen name="LawyerProfile" component={LawyerProfileScreen} options={{ title: 'الملف التعريفي' }} />
      <JobsStack.Screen name="PosterReview" component={PosterReviewScreen} options={{ title: 'تقييم المحامي' }} />
    </JobsStack.Navigator>
  );
};
const ChatsNavigator = () => (
  <ChatsStack.Navigator screenOptions={defaultScreenOptions}>
    <ChatsStack.Screen name="ConversationsList" component={ConversationsListScreen} options={{ title: 'المحادثات' }} />
    <ChatsStack.Screen name="Chat" component={NegotiationScreen} options={{ title: 'المفاوضات' }} />
  </ChatsStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={defaultScreenOptions}>
    <ProfileStack.Screen name="ProfileHome" component={SettingsScreen} options={{ title: 'الاعدادات' }} />
    <ProfileStack.Screen name="MyCourts" component={MyCourtsScreen} options={{ title: 'المحاكم المسجلة لدي حسابي' }} />
  </ProfileStack.Navigator>
);

const MyJobsNavigator = () => (
  <ActiveJobsStack.Navigator screenOptions={defaultScreenOptions}>
    <ActiveJobsStack.Screen name="MyJobs" component={MyJobsScreen} options={{ headerShown: false }} />
    <ActiveJobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'تفاصيل المهمة' }} />
    <ActiveJobsStack.Screen name="LawyerProfile" component={LawyerProfileScreen} options={{ title: 'الملف المهني' }} />
    <ActiveJobsStack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'نشر مهمة جديدة' }} />
    <ActiveJobsStack.Screen name="PosterReview" component={PosterReviewScreen} options={{ title: 'تقييم المحامي' }} />
    <ActiveJobsStack.Screen name="Chat" component={NegotiationScreen} options={{ title: 'المفاوضات' }} />
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
