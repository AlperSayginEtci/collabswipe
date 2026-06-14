import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '../../lib/trpc';

export default function TabLayout() {
  const { userId, user, isLoading } = useUser();
  const insets = useSafeAreaInsets();

  const { data: pendingRequests } = trpc.connection.getPendingRequests.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && user?.role !== 'company', refetchInterval: 3000 }
  );

  const { data: companyApps } = trpc.job.getCompanyApplications.useQuery(
    undefined,
    { enabled: !!userId && (user as any)?.role === 'company', refetchInterval: 3000 }
  );

  const likesCount = user?.role === 'company' 
    ? (companyApps?.filter(a => a.status === 'PENDING').length || 0) 
    : (pendingRequests?.length || 0);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#000000" />
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
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cards" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: (user as any)?.role === 'company' ? 'Başvuranlar' : 'Beğeniler',
          tabBarBadge: likesCount > 0 ? likesCount : undefined,
          tabBarBadgeStyle: { fontSize: 9, minWidth: 14, height: 14, lineHeight: 14 },
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons 
              name={(user as any)?.role === 'company' ? 'inbox' : 'heart'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="message-text" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}