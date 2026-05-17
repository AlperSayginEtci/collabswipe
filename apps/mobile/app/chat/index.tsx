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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function ChatScreen() {
  const { conversationId, otherUserName, otherUserImage } = useLocalSearchParams();
  const { userId } = useUser();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const utils = trpc.useUtils();

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
                  return { ...page, items: [msg, ...page.items] };
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

  useEffect(() => {
    if (convId && userId) {
      markAsRead.mutate({ conversationId: convId, userId });
    }
  }, [convId, userId]);

  const handleSend = () => {
    if (!inputText.trim() || !convId || !userId) return;

    sendMessage.mutate({
      conversationId: convId,
      senderId: userId,
      content: inputText.trim(),
    });

    setInputText('');
  };

  const messages = data?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerUserInfo}>
            {otherUserImage ? (
              <Image source={{ uri: otherUserImage as string }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: '#FF6B6B' }]} />
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
              <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                  <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Bir mesaj yazın..."
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
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#FFB5B5',
  },
});
