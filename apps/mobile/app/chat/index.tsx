import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function ChatScreen() {
  const { conversationId, otherUserName, otherUserImage } = useLocalSearchParams();
  const { userId } = useUser();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const utils = trpc.useUtils();

  if (!userId) {
    return <Redirect href="/auth" />;
  }

  const convId = typeof conversationId === 'string' ? conversationId : conversationId?.[0];

  // Subscription for new messages
  trpc.chat.onMessage.useSubscription(
    { userId: userId || '' },
    {
      enabled: !!userId,
      onData(msg) {
        if (msg.conversationId === convId) {
          // Ignore if it's our own message because optimistic UI already added it
          if (msg.senderId === userId) return;

          // Add message to cache
          utils.chat.getMessages.setInfiniteData({ conversationId: convId }, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page, index) => {
                if (index === 0) {
                  return { ...page, items: [{ ...msg, reactions: [] }, ...page.items] };
                }
                return page;
              }),
            };
          });
          
          if (userId) {
            markAsRead.mutate({ conversationId: convId, userId });
          }
        }
      },
    }
  );

  trpc.chat.onMessageUpdate.useSubscription(
    { userId: userId || '' },
    {
      enabled: !!userId,
      onData(msg) {
        if (msg.conversationId === convId) {
          utils.chat.getMessages.setInfiniteData({ conversationId: convId }, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (item.id === msg.id ? msg : item)),
              })),
            };
          });
        }
      },
    }
  );

  const { data, isLoading, fetchNextPage, hasNextPage } = trpc.chat.getMessages.useInfiniteQuery(
    { conversationId: convId || '' },
    {
      enabled: !!convId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onMutate: async (newMsg) => {
      await utils.chat.getMessages.cancel();
      const previousMessages = utils.chat.getMessages.getInfiniteData({ conversationId: convId || '' });
      
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        conversationId: convId!,
        senderId: userId!,
        content: newMsg.content,
        isDeleted: false,
        isEdited: false,
        reactions: [],
        createdAt: new Date(),
      };

      utils.chat.getMessages.setInfiniteData({ conversationId: convId || '' }, (oldData) => {
        if (!oldData) return { pages: [{ items: [optimisticMsg], nextCursor: undefined }], pageParams: [] };
        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) return { ...page, items: [optimisticMsg, ...page.items] };
            return page;
          }),
        };
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        utils.chat.getMessages.setInfiniteData({ conversationId: convId || '' }, context.previousMessages);
      }
    },
    onSettled: () => {
      utils.chat.getConversations.invalidate();
    },
  });

  const markAsRead = trpc.chat.markAsRead.useMutation();
  const editMessage = trpc.chat.editMessage.useMutation();
  const deleteMessage = trpc.chat.deleteMessage.useMutation();
  const reactMessage = trpc.chat.reactMessage.useMutation();

  useEffect(() => {
    if (convId && userId) {
      markAsRead.mutate({ conversationId: convId, userId });
    }
  }, [convId, userId]);

  const handleSend = () => {
    if (!inputText.trim() || !convId || !userId) return;

    if (editingMessageId) {
      editMessage.mutate({ messageId: editingMessageId, userId, content: inputText.trim() });
      setEditingMessageId(null);
    } else {
      sendMessage.mutate({
        conversationId: convId,
        senderId: userId,
        content: inputText.trim(),
      });
    }

    setInputText('');
  };

  const handleLongPress = (msg: any) => {
    setSelectedMessage(msg);
    setActionMenuVisible(true);
  };

  const messages = data?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/matches')} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerUserInfo}>
            {otherUserImage ? (
              <Image source={{ uri: otherUserImage as string }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: '#000000' }]} />
            )}
            <Text style={styles.headerName}>{otherUserName || 'Sohbet'}</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMe = item.senderId === userId;
            return (
              <TouchableOpacity
                onLongPress={() => handleLongPress(item)}
                delayLongPress={300}
                activeOpacity={0.9}
                style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}
              >
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther, item.isDeleted && styles.messageDeleted]}>
                  <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther, item.isDeleted && styles.messageTextDeleted]}>
                    {item.isDeleted ? "Bu mesaj silindi." : item.content}
                  </Text>
                  <View style={styles.messageFooter}>
                    {item.isEdited && !item.isDeleted && (
                      <Text style={[styles.messageEdited, isMe ? styles.messageEditedMe : styles.messageEditedOther]}>
                        (Düzenlendi)
                      </Text>
                    )}
                    <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                {item.reactions && item.reactions.length > 0 && (
                  <View style={[styles.reactionsContainer, isMe ? styles.reactionsMe : styles.reactionsOther]}>
                    {Array.from(new Set(item.reactions.map((r: any) => r.emoji))).map((emoji: any) => {
                      const count = item.reactions.filter((r: any) => r.emoji === emoji).length;
                      const hasReacted = item.reactions.some((r: any) => r.emoji === emoji && r.userId === userId);
                      return (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => reactMessage.mutate({ messageId: item.id, userId: userId!, emoji })}
                          style={[styles.reactionBadge, hasReacted && styles.reactionBadgeActive]}
                        >
                          <Text style={styles.reactionBadgeText}>{emoji} {count > 1 ? count : ''}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.inputContainerOuter}>
          {editingMessageId && (
            <View style={styles.editingBanner}>
              <Text style={styles.editingText}>Mesajı düzenliyorsunuz...</Text>
              <TouchableOpacity onPress={() => { setEditingMessageId(null); setInputText(''); }}>
                <Text style={styles.editingCancel}>İptal</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={editingMessageId ? "Mesajı düzenle..." : "Bir mesaj yazın..."}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Menu Modal */}
        <Modal
          visible={actionMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActionMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setActionMenuVisible(false)}
          >
            <View style={styles.actionMenu}>
              <View style={styles.reactionRow}>
                {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                  <TouchableOpacity 
                    key={emoji} 
                    style={styles.reactionBtn}
                    onPress={() => {
                      reactMessage.mutate({ messageId: selectedMessage.id, userId: userId!, emoji });
                      setActionMenuVisible(false);
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedMessage?.senderId === userId && !selectedMessage?.isDeleted && (
                <>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditingMessageId(selectedMessage.id);
                      setInputText(selectedMessage.content);
                      setActionMenuVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#333" />
                    <Text style={styles.actionText}>Düzenle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                      deleteMessage.mutate({ messageId: selectedMessage.id, userId: userId! });
                      setActionMenuVisible(false);
                    }}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#000000" />
                    <Text style={[styles.actionText, { color: '#000000' }]}>Sil</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
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
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    marginRight: 12,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  messagesList: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#000000',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#FFF',
  },
  messageTextOther: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeOther: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#FFB5B5',
  },
  inputContainerOuter: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  editingText: {
    fontSize: 12,
    color: '#666',
  },
  editingCancel: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },

  messageEdited: {
    fontSize: 10,
  },
  messageEditedMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageEditedOther: {
    color: '#999',
  },
  messageDeleted: {
    opacity: 0.6,
  },
  messageTextDeleted: {
    fontStyle: 'italic',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -8,
    marginBottom: 8,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  reactionsMe: {
    justifyContent: 'flex-end',
  },
  reactionsOther: {
    justifyContent: 'flex-start',
  },
  reactionBadge: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reactionBadgeActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#000000',
  },
  reactionBadgeText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
    color: '#333',
  },
});
