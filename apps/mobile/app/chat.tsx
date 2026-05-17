import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useUser } from '../context/UserContext';

export default function ChatScreen() {
  const { conversationId, otherUserName, otherUserImage } = useLocalSearchParams();
  const { userId } = useUser();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const utils = trpc.useUtils();

  // Query messages of the conversation
  const { data: messageData, isLoading } = trpc.conversation.getMessages.useQuery(
    { conversationId: conversationId as string },
    { enabled: !!conversationId, refetchInterval: 3000 } // Poll every 3 seconds for mock real-time
  );

  // Send message mutation
  const sendMessageMutation = trpc.conversation.sendMessage.useMutation({
    onSuccess: () => {
      setInputText('');
      utils.conversation.getMessages.invalidate({ conversationId: conversationId as string });
      utils.conversation.list.invalidate();
    },
  });

  const handleSend = () => {
    if (!inputText.trim() || !userId || !conversationId) return;

    sendMessageMutation.mutate({
      conversationId: conversationId as string,
      senderId: userId,
      content: inputText.trim(),
    });
  };

  const messages = messageData?.items || [];

  // Scroll to bottom when messages list size changes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const fallbackAvatar = `https://api.dicebear.com/7.x/notionists/png?seed=${otherUserName || 'User'}`;

  const renderMessageItem = ({ item }: { item: any }) => {
    const isMine = item.senderId === userId;
    return (
      <View style={[styles.msgContainer, isMine ? styles.msgRight : styles.msgLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.msgTimeRight : styles.msgTimeLeft]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Image
          source={{ uri: (otherUserImage as string) || fallbackAvatar }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName || 'Sohbet'}</Text>
          <Text style={styles.headerSubtitle}>Çevrimiçi</Text>
        </View>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Tray */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputTray}>
          <TextInput
            style={styles.textInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#AAA"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isLoading}
          >
            {sendMessageMutation.isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={22} color="#FFF" />
            )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '700',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  msgContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  msgRight: {
    justifyContent: 'flex-end',
  },
  msgLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleRight: {
    backgroundColor: '#4ECDC4',
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextRight: {
    color: '#FFF',
    fontWeight: '500',
  },
  msgTextLeft: {
    color: '#333',
    fontWeight: '500',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  msgTimeRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  msgTimeLeft: {
    color: '#999',
  },
  inputTray: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
});
