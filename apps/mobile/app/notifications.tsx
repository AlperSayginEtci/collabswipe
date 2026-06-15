import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';

export default function NotificationsScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const { data: notifications, isLoading, refetch } = trpc.notification.getMyNotifications.useQuery();
  
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
      utils.notification.getUnreadCount.invalidate();
    }
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      Alert.alert('Başarılı', 'Tümü okundu olarak işaretlendi.');
      utils.notification.getMyNotifications.invalidate();
      utils.notification.getUnreadCount.invalidate();
    }
  });

  const getIconForTitle = (title: string) => {
    if (title.includes('Kapatıldı')) return <MaterialCommunityIcons name="close-circle-outline" size={24} color="#EF4444" />;
    if (title.includes('Strike') || title.includes('Uyarı')) return <MaterialCommunityIcons name="alert-outline" size={24} color="#F97316" />;
    if (title.includes('Karantina') || title.includes('Mute') || title.includes('Shadowban')) return <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#EF4444" />;
    if (title.includes('Beğeni') || title.includes('Tepki')) return <MaterialCommunityIcons name="thumb-up-outline" size={24} color="#3B82F6" />;
    if (title.includes('Yorum')) return <MaterialCommunityIcons name="comment-outline" size={24} color="#10B981" />;
    if (title.includes('Bağlantı')) return <MaterialCommunityIcons name="account-group-outline" size={24} color="#8B5CF6" />;
    if (title.includes('Takip')) return <MaterialCommunityIcons name="account-plus-outline" size={24} color="#06B6D4" />;
    return <MaterialCommunityIcons name="information-outline" size={24} color="#3B82F6" />;
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate({ id: notification.id });
    }
    
    if (notification.link) {
      // Handle navigation based on web links
      // E.g., /post/123 -> /post/123
      router.push(notification.link as any);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {getIconForTitle(item.title)}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.isRead && styles.boldText]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity 
            onPress={() => markAllAsRead.mutate()} 
            disabled={markAllAsRead.isPending}
            style={styles.markAllBtn}
          >
            <MaterialCommunityIcons name="check-all" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Henüz hiç bildiriminiz yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  markAllBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  }
});
