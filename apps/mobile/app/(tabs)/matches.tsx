import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function MatchesScreen() {
  const { userId } = useUser();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState('');

  // Search users
  const { data: searchResults, isLoading: loadingSearch } = trpc.user.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.trim().length > 0 }
  );

  // 1. Fetch matches (ACCEPTED connections)
  const { data: connections, isLoading: loadingConnections } =
    trpc.connection.getMyConnections.useQuery({ userId: userId || '' }, { enabled: !!userId });

  // 2. Fetch conversations
  const { data: conversationsData, isLoading: loadingConversations } =
    trpc.chat.getConversations.useQuery({ userId: userId || '' }, { enabled: !!userId });

  const conversations = conversationsData?.items || [];
  const inboxChats = conversations.filter((c: any) => !c.isRequest);
  const requestChats = conversations.filter((c: any) => c.isRequest);

  // Mutation to create a new conversation
  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      utils.chat.getConversations.invalidate();
      router.push({
        pathname: '/chat',
        params: { conversationId: data.id },
      });
    },
  });

  const handleMatchClick = (matchedUser: any) => {
    if (!userId) return;

    // Check if we already have an active conversation with this user
    const existingConv = conversations?.find((conv) =>
      conv.participants.some((p) => p.userId === matchedUser.id)
    );

    if (existingConv) {
      router.push({
        pathname: '/chat',
        params: {
          conversationId: existingConv.id,
          otherUserName: `${matchedUser.name} ${matchedUser.surname || ''}`.trim(),
          otherUserImage: matchedUser.image || '',
        },
      });
    } else {
      createConversation.mutate({
        participantIds: [userId, matchedUser.id],
      });
    }
  };

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

  const isLoading = loadingConnections || loadingConversations;

  // Extract other users from matches/connections
  const matches = Array.from(new Map(
    (connections || []).map((conn: any) => {
      const matchUser = conn.requesterId === userId ? conn.addressee : conn.requester;
      return [matchUser.id, matchUser];
    })
  ).values());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kişi ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim().length > 0 ? (
        <View style={{ flex: 1 }}>
          {loadingSearch ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#000000" />
            </View>
          ) : searchResults?.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const nameText = `${item.name} ${item.surname || ''}`.trim();
                const avatarUrl = item.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024`;
                return (
                  <TouchableOpacity
                    style={styles.convItem}
                    onPress={() => {
                      setSearchQuery('');
                      handleMatchClick(item);
                    }}
                  >
                    <Image source={{ uri: avatarUrl }} style={styles.convAvatar} />
                    <View style={styles.convInfo}>
                      <Text style={styles.convName}>{nameText}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* New Matches Row */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yeni Eşleşmeler</Text>
            {matches.length === 0 ? (
              <Text style={styles.emptyText}>Henüz yeni bir eşleşme yok.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesRow}>
                {matches.map((item: any) => {
                  const nameText = item.name || 'User';
                  const avatarUrl = item.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024`;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.matchItem}
                      onPress={() => handleMatchClick(item)}
                    >
                      <Image source={{ uri: avatarUrl }} style={styles.matchAvatar} />
                      <Text style={styles.matchName} numberOfLines={1}>
                        {nameText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Conversations List */}
          <View style={styles.section}>
            <View style={styles.conversationsHeader}>
              <Text style={styles.sectionTitle}>Sohbetler</Text>
              <TouchableOpacity 
                style={styles.requestsButton} 
                onPress={() => router.push('/chat/requests')}
              >
                <Text style={styles.requestsButtonText}>
                  İstekler ({requestChats.length})
                </Text>
                {requestChats.some((c: any) => c.hasUnread) && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </View>
            {inboxChats?.filter((c: any) => c.lastMessage).length === 0 ? (
              <View style={styles.emptyConversations}>
                <MaterialCommunityIcons name="chat-outline" size={48} color="#CCC" />
                <Text style={styles.emptyConversationsText}>Henüz mesajlaşma başlatılmadı.</Text>
              </View>
            ) : (
              inboxChats?.filter((c: any) => c.lastMessage).map((item: any) => {
                const otherUser = item.otherUser;
                const lastMessage = item.lastMessage;
                const avatarUrl = otherUser?.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'User'}`;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.convItem}
                    onPress={() => handleConversationClick(item)}
                  >
                    <Image source={{ uri: avatarUrl }} style={styles.convAvatar} />
                    <View style={styles.convInfo}>
                      <View style={styles.convHeader}>
                        <Text style={styles.convName}>
                          {otherUser ? `${otherUser.name} ${otherUser.surname || ''}`.trim() : 'Sohbet'}
                        </Text>
                        {lastMessage && (
                          <Text style={styles.convTime}>
                            {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.convLastMessage} numberOfLines={1}>
                        {lastMessage ? lastMessage.content : 'Mesaj gönderilmedi.'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    minHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  requestsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 6,
  },
  matchesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 4,
  },
  matchItem: {
    alignItems: 'center',
    width: 70,
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFF',
  },
  matchName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyConversations: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyConversationsText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  convItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  convTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  convLastMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
});
