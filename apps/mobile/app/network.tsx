import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useUser } from '../context/UserContext';

type TabType = 'followers' | 'following' | 'connections' | 'requests' | 'connectionRequests';

export default function NetworkScreen() {
  const router = useRouter();
  const { tab: initialTab, userId: paramUserId } = useLocalSearchParams();
  const { userId: loggedInUserId } = useUser();
  const targetUserId = (paramUserId as string) || loggedInUserId;
  const isOwner = targetUserId === loggedInUserId;

  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || 'followers');
  const utils = trpc.useUtils();

  if (!loggedInUserId) {
    return <Redirect href="/auth" />;
  }


  const { data: followers, isLoading: loadingFollowers } = trpc.connection.getFollowers.useQuery(
    { userId: targetUserId || '' },
    { enabled: !!targetUserId && activeTab === 'followers' }
  );

  const { data: following, isLoading: loadingFollowing } = trpc.connection.getFollowing.useQuery(
    { userId: targetUserId || '' },
    { enabled: !!targetUserId && activeTab === 'following' }
  );

  const { data: connections, isLoading: loadingConnections } = trpc.connection.getMyConnections.useQuery(
    { userId: targetUserId || '' },
    { enabled: !!targetUserId && activeTab === 'connections' }
  );

  const { data: followRequests, isLoading: loadingRequests } = trpc.connection.getFollowRequests.useQuery(
    { userId: targetUserId || '' },
    { enabled: !!targetUserId && activeTab === 'requests' && isOwner }
  );

  const { data: connectionRequests, isLoading: loadingConnectionRequests } = trpc.connection.getPendingRequests.useQuery(
    { userId: targetUserId || '' },
    { enabled: !!targetUserId && activeTab === 'connectionRequests' && isOwner }
  );

  // Mutations
  const acceptRequest = trpc.connection.acceptFollowRequest.useMutation({
    onSuccess: () => {
      utils.connection.getFollowRequests.invalidate();
      utils.connection.getFollowers.invalidate();
    }
  });

  const rejectRequest = trpc.connection.rejectFollowRequest.useMutation({
    onSuccess: () => {
      utils.connection.getFollowRequests.invalidate();
    }
  });

  const respondConnection = trpc.connection.respond.useMutation({
    onSuccess: () => {
      utils.connection.getPendingRequests.invalidate();
      utils.connection.getMyConnections.invalidate();
    }
  });

  const isLoading = 
    (activeTab === 'followers' && loadingFollowers) ||
    (activeTab === 'following' && loadingFollowing) ||
    (activeTab === 'connections' && loadingConnections) ||
    (activeTab === 'requests' && loadingRequests) ||
    (activeTab === 'connectionRequests' && loadingConnectionRequests);

  const getListData = () => {
    if (activeTab === 'followers') return followers?.map((f: any) => f.follower) || [];
    if (activeTab === 'following') return following?.map((f: any) => f.following) || [];
    if (activeTab === 'connections') {
      const rawUsers = connections?.map((c: any) => c.requesterId === targetUserId ? c.addressee : c.requester) || [];
      return Array.from(new Map(rawUsers.map((u: any) => [u.id, u])).values());
    }
    if (activeTab === 'requests' && isOwner) return followRequests?.map((r: any) => r.follower) || [];
    if (activeTab === 'connectionRequests' && isOwner) return connectionRequests?.map((r: any) => r.requester) || [];
    return [];
  };

  const data = getListData();

  const renderItem = ({ item }: { item: any }) => {
    const avatarUrl = (item?.image || ((item as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));
    const displayName = `${item.name || ''} ${item.surname || ''}`.trim();
    
    return (
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.userInfoBtn} onPress={() => router.push(`/user/${item.id}`)}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userUsername} numberOfLines={1}>@{item.username || displayName.toLowerCase().replace(/\s+/g, '')}</Text>
          </View>
        </TouchableOpacity>
        
        {activeTab === 'requests' && isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => acceptRequest.mutate({ followerId: item.id, followingId: loggedInUserId || '' })}
            >
              <Text style={styles.actionBtnText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => rejectRequest.mutate({ followerId: item.id, followingId: loggedInUserId || '' })}
            >
              <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reddet</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'connectionRequests' && isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => respondConnection.mutate({ requesterId: item.id, addresseeId: loggedInUserId || '', status: "ACCEPTED" })}
            >
              <Text style={styles.actionBtnText}>Kabul Et</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => respondConnection.mutate({ requesterId: item.id, addresseeId: loggedInUserId || '', status: "REJECTED" })}
            >
              <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reddet</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab !== 'requests' && activeTab !== 'connectionRequests' && (
          <TouchableOpacity style={styles.profileBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ağım</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'followers' && styles.activeTab]} onPress={() => setActiveTab('followers')}>
            <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>Takipçiler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'following' && styles.activeTab]} onPress={() => setActiveTab('following')}>
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Takip Edilen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'connections' && styles.activeTab]} onPress={() => setActiveTab('connections')}>
            <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>Bağlantılar</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Takip İstekleri {followRequests && followRequests.length > 0 ? `(${followRequests.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity style={[styles.tab, activeTab === 'connectionRequests' && styles.activeTab]} onPress={() => setActiveTab('connectionRequests')}>
              <Text style={[styles.tabText, activeTab === 'connectionRequests' && styles.activeTabText]}>
                Bağlantı İstekleri {connectionRequests && connectionRequests.length > 0 ? `(${connectionRequests.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="account-search-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Gösterilecek kişi bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  tabsWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  tabsContainer: { paddingHorizontal: 16 },
  tab: { paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#000000' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  activeTabText: { color: '#000000', fontWeight: '800' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: '#888', fontWeight: '500' },
  listContent: { padding: 16, gap: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  userInfoBtn: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  userUsername: { fontSize: 13, color: '#666', marginTop: 2 },
  profileBtn: { padding: 4 },
  actions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  acceptBtn: { backgroundColor: '#000000' },
  rejectBtn: { backgroundColor: '#F5F5F5' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  rejectBtnText: { color: '#555' }
});
