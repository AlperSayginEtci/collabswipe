import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function MessageRequestsScreen() {
  const { userId } = useUser();
  const router = useRouter();

  // Fetch conversations
  const { data: conversationsData, isLoading } =
    trpc.chat.getConversations.useQuery({ userId: userId || '' }, { enabled: !!userId });

  const conversations = conversationsData?.items || [];
  const requestChats = conversations.filter((c: any) => c.isRequest);

  const handleConversationClick = (conv: any) => {
    const otherUser = conv.otherUser;

    router.push({
      pathname: '/chat',
      params: {
        conversationId: conv.id,
        otherUserName: otherUser ? `${otherUser.name} ${otherUser.surname || ''}`.trim() : 'Sohbet',
        otherUserImage: otherUser?.image || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesaj İstekleri</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Eşleşmediğiniz kullanıcılardan gelen mesajlar burada görünür. Yanıtladığınızda sohbet ana kutunuza taşınır.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : requestChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-alert-outline" size={64} color="#EFEFEF" />
          <Text style={styles.emptyText}>Bekleyen mesaj isteği yok.</Text>
        </View>
      ) : (
        <FlatList
          data={requestChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const otherUser = item.otherUser;
            const lastMessage = item.lastMessage;
            const avatarUrl = otherUser?.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'User'}`;

            return (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => handleConversationClick(item)}
              >
                <Image source={{ uri: avatarUrl }} style={styles.convAvatar} />
                <View style={styles.convInfo}>
                  <View style={styles.convHeader}>
                    <Text style={[styles.convName, item.hasUnread && styles.convNameUnread]}>
                      {otherUser ? `${otherUser.name} ${otherUser.surname || ''}`.trim() : 'Sohbet'}
                    </Text>
                    {lastMessage && (
                      <Text style={[styles.convTime, item.hasUnread && styles.convTimeUnread]}>
                        {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.convLastMessage, item.hasUnread && styles.convLastMessageUnread]} numberOfLines={2}>
                    {lastMessage ? lastMessage.content : 'Mesaj gönderilmedi.'}
                  </Text>
                </View>
                {item.hasUnread && <View style={styles.unreadBadge} />}
              </TouchableOpacity>
            );
          }}
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
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  convItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  convAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
  },
  convInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  convNameUnread: {
    fontWeight: '800',
    color: '#000000',
  },
  convTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  convTimeUnread: {
    color: '#000000',
    fontWeight: '700',
  },
  convLastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  convLastMessageUnread: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },
});
