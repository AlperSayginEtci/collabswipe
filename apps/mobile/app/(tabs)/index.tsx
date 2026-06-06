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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

// Helper to pick a file and convert to base64 for Dropbox upload
const handlePickMedia = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.type === 'success') {
      const fileUri = result.uri;
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setMediaFileBase64(base64);
      setMediaPreviewUrl(fileUri);
    }
  } catch (e) {
    console.error('Media pick error', e);
    Alert.alert('Hata', 'Medya seçilemedi.');
  }
};

export default function HomeFeedScreen() {
  const { userId, user } = useUser();
  const [content, setContent] = useState('');
  // New media handling using base64 upload to Dropbox
  const [mediaFileBase64, setMediaFileBase64] = useState('');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const utils = trpc.useUtils();

  // Queries
  const { data: feedData, isLoading: isFeedLoading, refetch } = trpc.post.getFeed.useQuery({
    currentUserId: userId || undefined
  });

  // Mutations
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      setContent('');
      setMediaFileBase64('');
      setMediaPreviewUrl('');
      setShowMediaInput(false);
      utils.post.getFeed.invalidate();
      Alert.alert('Başarılı', 'Gönderi paylaşıldı.');
    },
    onError: (err) => {
      Alert.alert('Hata', 'Gönderi paylaşılamadı.');
      console.error(err);
    },
  });

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      Alert.alert('Başarılı', 'Gönderi silindi.');
    },
    onError: (err) => {
      Alert.alert('Hata', 'Gönderi silinemedi.');
      console.error(err);
    }
  });

  const likePost = trpc.post.like.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const unlikePost = trpc.post.unlike.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const addComment = trpc.post.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      Alert.alert('Hata', 'Yorum eklenemedi.');
      console.error(err);
    }
  });

  const deleteComment = trpc.post.deleteComment.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      Alert.alert('Hata', 'Yorum silinemedi.');
      console.error(err);
    }
  });

  // Action handlers
  const handlePost = () => {
    if (!content.trim() && !mediaFileBase64 && !userId) return;
    createPost.mutate({ 
      authorId: userId, 
      content: content.trim(),
      mediaFile: mediaFileBase64 || undefined
    });
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    if (!userId) return;
    if (isLiked) {
      unlikePost.mutate({ postId, userId });
    } else {
      likePost.mutate({ postId, userId });
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim() || !userId) return;
    addComment.mutate({
      postId,
      authorId: userId,
      content: commentText.trim()
    });
  };

  const handleRepost = (postId: string) => {
    if (!userId) return;
    Alert.alert(
      'Paylaş',
      'Bu gönderiyi akışınızda repost etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Paylaş', 
          onPress: () => {
            createPost.mutate({
              authorId: userId,
              originalPostId: postId,
              content: 'repost'
            });
          }
        }
      ]
    );
  };

  const handleDeletePostConfirm = (postId: string) => {
    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deletePost.mutate({ postId }) 
        }
      ]
    );
  };

  const renderComposer = () => (
    <View style={styles.composerCard}>
      <View style={styles.composerHeader}>
        <Image
          source={{ uri: (user as any)?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${user?.name || 'user'}` }}
          style={styles.composerAvatar}
        />
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.composerInput}
            placeholder="Neler düşünüyorsun? Proje paylaş veya soru sor..."
            placeholderTextColor="#999"
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={500}
          />
          {mediaPreviewUrl !== '' && (
            <View style={styles.composerMediaPreviewContainer}>
              <Image source={{ uri: mediaPreviewUrl }} style={styles.composerMediaPreview} />
              <TouchableOpacity 
                style={styles.composerMediaRemoveBtn}
                onPress={() => {
                  setMediaFileBase64('');
                  setMediaPreviewUrl('');
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.composerFooter}>
        <TouchableOpacity 
          style={styles.composerMediaToggle}
          onPress={handlePickMedia}
        >
          <MaterialCommunityIcons 
            name="image-plus" 
            size={22} 
            color={mediaPreviewUrl ? '#4ECDC4' : '#666'} 
          />
          <Text style={[styles.composerMediaText, mediaPreviewUrl && { color: '#4ECDC4' }]}>{mediaPreviewUrl ? 'Değiştir' : 'Fotoğraf'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && !mediaFileBase64 && createPost.isLoading) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={(!content.trim() && !mediaFileBase64) || createPost.isLoading}
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

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = item.likes && item.likes.length > 0;
    const isAuthor = item.authorId === userId;
    const hasOriginal = !!item.originalPost;
    const isRepostOnly = item.content === 'repost' && hasOriginal;
    const showComments = activeCommentsPostId === item.id;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.author?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${item.author?.name || 'user'}` }}
            style={styles.postAvatar}
          />
          <View style={styles.postAuthorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.postAuthorName}>
                {item.author?.name || 'Mock'} {item.author?.surname || 'User'}
              </Text>
              {isAuthor && (
                <TouchableOpacity onPress={() => handleDeletePostConfirm(item.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.postAuthorHeadline} numberOfLines={1}>
              {item.author?.profile?.bio || (item.author?.role === 'company' ? `${item.author?.sector || 'Şirket'}` : 'CollabSwipe Üyesi')}
            </Text>
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </View>
        </View>
        
        {/* Post Content */}
        {!isRepostOnly && item.content !== '' && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {/* Post Media */}
        {item.mediaUrl && (
          <Image source={{ uri: item.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
        )}

        {/* Original Post (Repost Nested Content) */}
        {hasOriginal && (
          <View style={styles.repostContainer}>
            <View style={styles.repostHeader}>
              <Image
                source={{ uri: item.originalPost.author?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${item.originalPost.author?.name || 'user'}` }}
                style={styles.repostAvatar}
              />
              <View style={styles.repostAuthorInfo}>
                <Text style={styles.repostAuthorName}>
                  {item.originalPost.author?.name} {item.originalPost.author?.surname}
                </Text>
                <Text style={styles.repostAuthorHeadline} numberOfLines={1}>
                  {item.originalPost.author?.profile?.bio || 'CollabSwipe Üyesi'}
                </Text>
              </View>
            </View>
            <Text style={styles.repostContent}>{item.originalPost.content}</Text>
            {item.originalPost.mediaUrl && (
              <Image source={{ uri: item.originalPost.mediaUrl }} style={styles.repostMedia} resizeMode="cover" />
            )}
          </View>
        )}
        
        {/* Post Stats Summary */}
        <View style={styles.statsSummary}>
          <Text style={styles.statsText}>
            {item.reactionTypes && item.reactionTypes.length > 0
              ? item.reactionTypes.map((type: string) => {
                  const reactionMap: Record<string, string> = {
                    LIKE: '👍',
                    LOVE: '❤️',
                    CELEBRATE: '👏',
                    INSIGHTFUL: '💡',
                    CURIOUS: '🤔'
                  };
                  return reactionMap[type] || '👍';
                }).join(' ')
              : '👍'}{' '}
            {item._count?.likes || 0} Beğeni
          </Text>
          <Text style={styles.statsText}>💬 {item._count?.comments || 0} Yorum</Text>
        </View>

        {/* Post Action Buttons */}
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={() => handleLikeToggle(item.id, isLiked)}
          >
            <MaterialCommunityIcons 
              name={isLiked ? "thumb-up" : "thumb-up-outline"} 
              size={18} 
              color={isLiked ? "#4ECDC4" : "#666"} 
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>Beğen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, showComments && styles.actionButtonActive]}
            onPress={() => setActiveCommentsPostId(showComments ? null : item.id)}
          >
            <MaterialCommunityIcons 
              name={showComments ? "comment" : "comment-outline"} 
              size={18} 
              color={showComments ? "#4ECDC4" : "#666"} 
            />
            <Text style={[styles.actionText, showComments && styles.actionTextActive]}>Yorumla</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleRepost(item.id)}>
            <MaterialCommunityIcons name="repeat" size={18} color="#666" />
            <Text style={styles.actionText}>Repost</Text>
          </TouchableOpacity>
        </View>

        {/* Expandable Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            {/* Comment Composer */}
            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Yorum yaz..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={200}
              />
              <TouchableOpacity 
                style={[styles.commentSendBtn, !commentText.trim() && styles.commentSendBtnDisabled]}
                onPress={() => handleAddComment(item.id)}
                disabled={!commentText.trim()}
              >
                <MaterialCommunityIcons name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Comment List */}
            {item.comments && item.comments.length > 0 ? (
              item.comments.map((comment: any) => {
                const isCommentAuthor = comment.authorId === userId;
                const commentLikesCount = comment.likes?.length || 0;

                return (
                  <View key={comment.id} style={{ marginBottom: 12 }}>
                    <View style={styles.commentBubbleContainer}>
                      <Image
                        source={{ uri: comment.author?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${comment.author?.name || 'user'}` }}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentBubble}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.commentAuthorName}>{comment.author?.name} {comment.author?.surname}</Text>
                          {isCommentAuthor && (
                            <TouchableOpacity onPress={() => deleteComment.mutate({ commentId: comment.id })}>
                              <MaterialCommunityIcons name="delete" size={14} color="#FF6B6B" />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.commentText}>{comment.content}</Text>
                        
                        {commentLikesCount > 0 && (
                          <Text style={{ fontSize: 10, color: '#888', marginTop: 4 }}>👍 {commentLikesCount} beğeni</Text>
                        )}
                      </View>
                    </View>

                    {/* Replies */}
                    {comment.replies && comment.replies.map((reply: any) => (
                      <View key={reply.id} style={[styles.commentBubbleContainer, { marginLeft: 38, marginTop: 4 }]}>
                        <Image
                          source={{ uri: reply.author?.image || `https://api.dicebear.com/7.x/notionists/png?seed=${reply.author?.name || 'user'}` }}
                          style={[styles.commentAvatar, { width: 24, height: 24, borderRadius: 12 }]}
                        />
                        <View style={[styles.commentBubble, { backgroundColor: '#F8F9FA' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.commentAuthorName}>{reply.author?.name} {reply.author?.surname}</Text>
                            {reply.authorId === userId && (
                              <TouchableOpacity onPress={() => deleteComment.mutate({ commentId: reply.id })}>
                                <MaterialCommunityIcons name="delete" size={12} color="#FF6B6B" />
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={styles.commentText}>{reply.content}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })
            ) : (
              <Text style={styles.noCommentsText}>Henüz yorum yok. İlk yorumu sen yaz!</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  feedSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  composerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    minHeight: 50,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  mediaInput: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    marginTop: 8,
    color: '#333',
  },
  composerMediaPreviewContainer: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  composerMediaPreview: {
    width: '100%',
    height: 150,
  },
  composerMediaRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  composerMediaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerMediaText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  postAuthorHeadline: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  postTime: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  repostContainer: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  repostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  repostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  repostAuthorInfo: {
    flex: 1,
  },
  repostAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  repostAuthorHeadline: {
    fontSize: 11,
    color: '#666',
  },
  repostContent: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 8,
  },
  repostMedia: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 11,
    color: '#888',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: '#F0FDFA',
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#4ECDC4',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    marginTop: 8,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    marginRight: 8,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: '#CCC',
  },
  commentBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginTop: 2,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  commentText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    lineHeight: 16,
  },
  noCommentsText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
});
