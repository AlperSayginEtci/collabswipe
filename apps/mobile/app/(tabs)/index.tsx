import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function HomeFeedScreen() {
  const { userId, user } = useUser();
  const [content, setContent] = useState('');
  const utils = trpc.useUtils();

  const { data: feedData, isLoading: isFeedLoading, refetch } = trpc.post.getFeed.useQuery({});

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      setContent('');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      Alert.alert('Hata', 'Gönderi paylaşılamadı. Veritabanı bağlantısını kontrol edin.');
      console.error(err);
    },
  });

  const handlePost = () => {
    if (!content.trim() || !userId) return;
    createPost.mutate({ authorId: userId, content: content.trim() });
  };

  const renderComposer = () => (
    <View style={styles.composerCard}>
      <View style={styles.composerHeader}>
        <Image
          source={{ uri: user?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${user?.name || 'user'}` }}
          style={styles.composerAvatar}
        />
        <TextInput
          style={styles.composerInput}
          placeholder="Neler düşünüyorsun? Yeni bir proje paylaş veya soru sor."
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
        />
      </View>
      <View style={styles.composerFooter}>
        <TouchableOpacity
          style={[styles.postButton, (!content.trim() || createPost.isLoading) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!content.trim() || createPost.isLoading}
        >
          {createPost.isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.postButtonText}>Paylaş</Text>
              <MaterialCommunityIcons name="send" size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.author?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${item.author?.name || 'user'}` }}
          style={styles.postAvatar}
        />
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>
            {item.author?.name || 'Mock'} {item.author?.surname || 'User'}
          </Text>
          <Text style={styles.postTime}>
            {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="heart-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Beğen ({item._count?.likes || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="comment-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Yorum ({item._count?.comments || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="repeat" size={20} color="#666" />
          <Text style={styles.actionText}>Repost</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ana Sayfa</Text>
      </View>
      
      <FlatList
        data={feedData?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          <>
            <View style={styles.feedHeaderInfo}>
              <Text style={styles.feedTitle}>Akışınız</Text>
              <Text style={styles.feedSubtitle}>Ağınızdaki en son güncellemeleri görün.</Text>
            </View>
            {renderComposer()}
          </>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={isFeedLoading}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          !isFeedLoading ? (
            <Text style={styles.emptyText}>Henüz gönderi yok. İlk paylaşan sen ol!</Text>
          ) : null
        }
      />
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  feedHeaderInfo: {
    marginBottom: 16,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  feedSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  composerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  composerInput: {
    flex: 1,
    minHeight: 60,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#CCC',
  },
  postButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
});
