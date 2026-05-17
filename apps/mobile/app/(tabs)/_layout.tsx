import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { userId, isLoading } = useUser();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!userId) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          backgroundColor: '#FFF',
          height: 60 + Math.max(insets.bottom, 10),
          paddingBottom: 8 + Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cards" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="briefcase-search" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="message-text" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}