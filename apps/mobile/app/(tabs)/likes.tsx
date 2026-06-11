import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { trpc } from '../../lib/trpc';

export default function LikesScreen() {
  const { user } = useUser();
  const isCompany = user?.role === 'company';
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconWrapper, { backgroundColor: isCompany ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 107, 107, 0.1)' }]}>
            <MaterialCommunityIcons name={isCompany ? "inbox" : "heart"} size={28} color={isCompany ? "#4ECDC4" : "#000000"} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{isCompany ? 'Başvurular' : 'Beğeniler'}</Text>
            <Text style={styles.headerSubtitle}>
              {isCompany ? 'Gelen başvuruları inceleyin.' : 'Seninle eşleşmek isteyenler.'}
            </Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, tab === 'incoming' && styles.activeTab]}
            onPress={() => setTab('incoming')}
          >
            <Text style={[styles.tabText, tab === 'incoming' && styles.activeTabText]}>Gelenler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, tab === 'outgoing' && styles.activeTab]}
            onPress={() => setTab('outgoing')}
          >
            <Text style={[styles.tabText, tab === 'outgoing' && styles.activeTabText]}>Gönderilenler</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {isCompany ? (
           tab === 'incoming' ? <CompanyApplicants /> : <CompanyOutgoing />
        ) : (
           tab === 'incoming' ? <UserLikes /> : <UserOutgoing />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserLikes() {
  const { userId } = useUser();
  const utils = trpc.useUtils();
  
  const { data: pendingRequests, isLoading } = trpc.connection.getPendingRequests.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const respondMutation = trpc.connection.respond.useMutation({
    onSuccess: () => {
      utils.connection.getPendingRequests.invalidate();
      Alert.alert('Başarılı', 'İsteğe yanıt verildi.');
    }
  });

  if (isLoading) return <ActivityIndicator size="large" color="#000000" style={{ marginTop: 50 }} />;

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="heart-outline" size={60} color="#CCC" />
        <Text style={styles.emptyText}>Henüz Beğeni Yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {pendingRequests.map(req => (
        <View key={req.requester.id} style={styles.card}>
          <Image 
            source={{ uri: req.requester.image || `https://api.dicebear.com/7.x/notionists/png?seed=${req.requester.name}` }} 
            style={styles.avatar} 
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{req.requester.name} {req.requester.surname}</Text>
            <Text style={styles.cardSubtitle}>Seni beğendi!</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}
              onPress={() => respondMutation.mutate({ requesterId: req.requester.id, addresseeId: userId!, status: 'ACCEPTED' })}
            >
              <MaterialCommunityIcons name="check" size={24} color="#4ECDC4" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
              onPress={() => respondMutation.mutate({ requesterId: req.requester.id, addresseeId: userId!, status: 'REJECTED' })}
            >
              <MaterialCommunityIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

function UserOutgoing() {
  const { userId } = useUser();
  const utils = trpc.useUtils();
  
  const { data: sentRequests, isLoading: isLoadingReq } = trpc.connection.getSentRequests.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const { data: myApps, isLoading: isLoadingApps } = trpc.job.getMyApplications.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const undoSwipe = trpc.connection.undoSwipe.useMutation({
    onSuccess: () => {
      utils.connection.getSentRequests.invalidate();
    }
  });

  const undoApply = trpc.job.undoApply.useMutation({
    onSuccess: () => {
      utils.job.getMyApplications.invalidate();
    }
  });

  if (isLoadingReq || isLoadingApps) return <ActivityIndicator size="large" color="#000000" style={{ marginTop: 50 }} />;

  const hasReqs = sentRequests && sentRequests.length > 0;
  const hasApps = myApps && myApps.length > 0;

  if (!hasReqs && !hasApps) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="send-outline" size={60} color="#CCC" />
        <Text style={styles.emptyText}>Henüz Gönderilen Yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {hasReqs && (
        <>
          <Text style={styles.sectionTitle}>Gönderilen Beğeniler</Text>
          {sentRequests.map(req => (
            <View key={req.addressee.id} style={styles.card}>
              <Image 
                source={{ uri: req.addressee.image || `https://api.dicebear.com/7.x/notionists/png?seed=${req.addressee.name}` }} 
                style={styles.avatar} 
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{req.addressee.name} {req.addressee.surname}</Text>
                <Text style={[styles.cardSubtitle, { color: '#F59E0B' }]}>Bekliyor</Text>
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
                onPress={() => undoSwipe.mutate({ requesterId: userId!, addresseeId: req.addressee.id })}
              >
                <MaterialCommunityIcons name="undo" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {hasApps && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Yapılan Başvurular</Text>
          {myApps.map(app => (
            <View key={app.id} style={styles.card}>
              <Image 
                source={{ uri: app.job.publisher?.image || `https://api.dicebear.com/7.x/shapes/png?seed=${app.job.id}` }} 
                style={styles.avatar} 
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{app.job.title}</Text>
                <Text style={styles.cardSubtitle}>{app.job.publisher?.name}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
                onPress={() => undoApply.mutate({ applicantId: userId!, jobId: app.job.id })}
              >
                <MaterialCommunityIcons name="undo" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function CompanyApplicants() {
  const { userId } = useUser();
  const utils = trpc.useUtils();
  
  const { data: apps, isLoading } = trpc.job.getCompanyApplications.useQuery();

  const updateStatus = trpc.job.updateApplicationStatus.useMutation({
    onSuccess: () => {
      utils.job.getCompanyApplications.invalidate();
      Alert.alert('Başarılı', 'Durum güncellendi.');
    }
  });

  if (isLoading) return <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 50 }} />;

  if (!apps || apps.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="inbox-outline" size={60} color="#CCC" />
        <Text style={styles.emptyText}>Henüz Başvuru Yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {apps.map(app => (
        <View key={app.id} style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Image 
              source={{ uri: app.applicant.image || `https://api.dicebear.com/7.x/notionists/png?seed=${app.applicant.name}` }} 
              style={styles.avatar} 
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{app.applicant.name} {app.applicant.surname}</Text>
              <Text style={styles.cardSubtitle}>{app.job.title} ilanına başvurdu</Text>
            </View>
          </View>
          
          {app.status === 'PENDING' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
                onPress={() => updateStatus.mutate({ applicationId: app.id, status: 'REJECTED' })}
              >
                <Text style={{ color: '#000000', fontWeight: 'bold' }}>Reddet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#4ECDC4' }]}
                onPress={() => updateStatus.mutate({ applicationId: app.id, status: 'ACCEPTED' })}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Kabul Et</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ textAlign: 'right', fontWeight: 'bold', color: app.status === 'ACCEPTED' ? '#4ECDC4' : '#000000' }}>
              {app.status === 'ACCEPTED' ? 'Kabul Edildi' : 'Reddedildi'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function CompanyOutgoing() {
  const { userId } = useUser();
  const utils = trpc.useUtils();
  
  const { data: sentRequests, isLoading } = trpc.connection.getSentRequests.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const undoSwipe = trpc.connection.undoSwipe.useMutation({
    onSuccess: () => {
      utils.connection.getSentRequests.invalidate();
    }
  });

  if (isLoading) return <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 50 }} />;

  if (!sentRequests || sentRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="send-outline" size={60} color="#CCC" />
        <Text style={styles.emptyText}>Henüz İstek Yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {sentRequests.map(req => (
        <View key={req.addressee.id} style={styles.card}>
          <Image 
            source={{ uri: req.addressee.image || `https://api.dicebear.com/7.x/notionists/png?seed=${req.addressee.name}` }} 
            style={styles.avatar} 
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{req.addressee.name} {req.addressee.surname}</Text>
            <Text style={[styles.cardSubtitle, { color: '#F59E0B' }]}>Bekliyor</Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}
            onPress={() => undoSwipe.mutate({ requesterId: userId!, addresseeId: req.addressee.id })}
          >
            <MaterialCommunityIcons name="undo" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 20, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconWrapper: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '700', color: '#999' },
  activeTabText: { color: '#1A1A1A' },
  content: { flex: 1, padding: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 15, fontSize: 18, fontWeight: 'bold', color: '#999' },
  list: { gap: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5' },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
});
