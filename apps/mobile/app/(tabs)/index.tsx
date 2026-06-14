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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc, getBaseUrl } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';
import { MentionTextInput } from '../../components/MentionTextInput';
import { FormattedText } from '../../components/FormattedText';

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  CELEBRATE: '🎉',
  SUPPORT: '🤝',
  INSIGHTFUL: '💡',
  FUNNY: '😄'
};

const REACTION_LABELS: Record<string, string> = {
  LIKE: 'Beğenildi',
  CELEBRATE: 'Kutla',
  SUPPORT: 'Destekle',
  INSIGHTFUL: 'Bilgilendirici',
  FUNNY: 'Eğlenceli'
};

function getAuthorSubtitle(author: any) {
  if (!author) return 'CollabSwipe Üyesi';
  if (author.role === 'company') return author.sector || 'Şirket';
  const activeExp = author.profile?.experiences?.[0];
  if (activeExp) return `${activeExp.corp} - ${activeExp.title}`;
  const activeEdu = author.profile?.educations?.[0];
  if (activeEdu) return `${activeEdu.instName}${activeEdu.instProgram ? ` - ${activeEdu.instProgram}` : ''}`;
  return 'CollabSwipe Üyesi';
}

export default function HomeFeedScreen() {
  const { userId, user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState('');
  // Uploaded media URL (from /api/upload)
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeReactionPostId, setActiveReactionPostId] = useState<string | null>(null);

  const [selectedPostOptions, setSelectedPostOptions] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [commentText, setCommentText] = useState('');
  const utils = trpc.useUtils();

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaPreviewUrl(asset.uri);
        setIsUploadingMedia(true);
        try {
          // Upload directly to server /api/upload using multipart/form-data
          const baseUrl = getBaseUrl();
          const formData = new FormData();
          const filename = asset.uri.split('/').pop() || 'photo.jpg';
          const match = /\.([^.]+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: asset.uri, name: filename, type } as any);
          const res = await fetch(`${baseUrl}/api/upload`, { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Upload failed');
          setMediaUrl(data.url);
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          Alert.alert('Hata', 'Medya yüklenemedi.');
          setMediaPreviewUrl('');
          setMediaUrl('');
        } finally {
          setIsUploadingMedia(false);
        }
      }
    } catch (e) {
      console.error('Media pick error', e);
      Alert.alert('Hata', 'Medya seçilemedi.');
    }
  };

  // Queries
  const { data: feedData, isLoading: isFeedLoading, refetch } = trpc.post.getFeed.useQuery({
    currentUserId: userId || undefined
  });

  // Mutations
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      setContent('');
      setMediaUrl('');
      setMediaPreviewUrl('');
      setShowMediaInput(false);
      utils.post.getFeed.invalidate();
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

  const createReport = trpc.user.createReport.useMutation({
    onSuccess: () => {
      Alert.alert('Başarılı', 'Şikayetiniz alındı ve incelenecek.');
    },
    onError: () => {
      Alert.alert('Hata', 'Şikayet edilirken bir hata oluştu.');
    }
  });

  const editPost = trpc.post.editPost.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      setIsEditModalVisible(false);
      setEditingPostId(null);
      setEditingPostText('');
      Alert.alert('Başarılı', 'Gönderi güncellendi.');
    },
    onError: (err) => {
      Alert.alert('Hata', 'Gönderi güncellenemedi.');
      console.error(err);
    }
  });

  const handlePostOptions = (post: any) => {
    setSelectedPostOptions(post);
  };

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
    if (!userId) return;
    if (!content.trim() && !mediaUrl) return;
    if (isUploadingMedia) { Alert.alert('Bekleyin', 'Medya yükleniyor...'); return; }
    createPost.mutate({ 
      authorId: userId, 
      content: content.trim(),
      mediaUrl: mediaUrl || undefined
    });
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    if (!userId) return;
    if (isLiked) {
      unlikePost.mutate({ postId, userId });
    } else {
      likePost.mutate({ postId, userId, type: 'LIKE' });
    }
  };

  const handleReact = (postId: string, reactionType: string) => {
    if (!userId) return;
    likePost.mutate({ postId, userId, type: reactionType });
    setActiveReactionPostId(null);
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
          source={{ uri: (user as any)?.image || ((user as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024') }}
          style={styles.composerAvatar}
        />
        <View style={{ flex: 1, zIndex: 1000 }}>
          <MentionTextInput
            style={styles.composerInput}
            containerStyle={{ zIndex: 1000 }}
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
                  setMediaUrl('');
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
            color={mediaPreviewUrl ? '#000000' : '#666'} 
          />
          <Text style={[styles.composerMediaText, mediaPreviewUrl && { color: '#000000' }]}>{mediaPreviewUrl ? 'Değiştir' : 'Fotoğraf'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postButton, (!content.trim() && !mediaUrl && createPost.isLoading) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={(!content.trim() && !mediaUrl) || createPost.isPending || isUploadingMedia}
        >
          {createPost.isPending ? (
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
    const userLike = item.likes?.find((l: any) => l.userId === userId);
    const isLiked = !!userLike;
    const reactionType = userLike?.type || 'LIKE';
    const isAuthor = item.authorId === userId;
    const hasOriginal = !!item.originalPost;
    const isRepostOnly = item.content === 'repost' && hasOriginal;
    const showComments = activeCommentsPostId === item.id;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => router.push(`/user/${item.authorId}`)}>
            <Image
              source={{ uri: (item.author?.image || ((item.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024')) }}
              style={styles.postAvatar}
            />
          </TouchableOpacity>
          <View style={styles.postAuthorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => router.push(`/user/${item.authorId}`)}>
                <Text style={styles.postAuthorName}>
                  {item.author?.name || 'Mock'} {item.author?.surname || 'User'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePostOptions(item)}>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.postAuthorHeadline} numberOfLines={1}>
              {getAuthorSubtitle(item.author)}
            </Text>
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </View>
        </View>
        
        {/* Post Content */}
        {!isRepostOnly && item.content !== '' && (
          <FormattedText text={item.content} style={styles.postContent} />
        )}

        {/* Post Media */}
        {item.mediaUrl && (
          <Image source={{ uri: item.mediaUrl }} style={styles.postMedia} resizeMode="cover" />
        )}

        {/* Original Post (Repost Nested Content) */}
        {hasOriginal && (
          <View style={styles.repostContainer}>
            <View style={styles.repostHeader}>
              <TouchableOpacity onPress={() => router.push(`/user/${item.originalPost.authorId}`)}>
                <Image
                  source={{ uri: (item.originalPost.author?.image || ((item.originalPost.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024')) }}
                  style={styles.repostAvatar}
                />
              </TouchableOpacity>
              <View style={styles.repostAuthorInfo}>
                <TouchableOpacity onPress={() => router.push(`/user/${item.originalPost.authorId}`)}>
                  <Text style={styles.repostAuthorName}>
                    {item.originalPost.author?.name} {item.originalPost.author?.surname}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.repostAuthorHeadline} numberOfLines={1}>
                  {getAuthorSubtitle(item.originalPost.author)}
                </Text>
              </View>
            </View>
            <FormattedText text={item.originalPost.content} style={styles.postContent} />
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
                  const reactionMap: Record<string, string> = REACTION_EMOJIS;
                  return reactionMap[type] || '👍';
                }).join(' ')
              : '👍'}{' '}
            {item._count?.likes || 0} Beğeni
          </Text>
          <Text style={styles.statsText}>💬 {item._count?.comments || 0} Yorum</Text>
        </View>

        {/* Post Action Buttons */}
        <View style={styles.postActions}>
          {activeReactionPostId === item.id ? (
            <View style={styles.reactionSelector}>
              {[
                { type: 'LIKE', emoji: '👍' },
                { type: 'CELEBRATE', emoji: '🎉' },
                { type: 'SUPPORT', emoji: '🤝' },
                { type: 'INSIGHTFUL', emoji: '💡' },
                { type: 'FUNNY', emoji: '😄' }
              ].map(({ type, emoji }) => (
                <TouchableOpacity key={type} onPress={() => handleReact(item.id, type)} style={styles.reactionEmojiBtn}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={() => handleLikeToggle(item.id, isLiked)}
              onLongPress={() => setActiveReactionPostId(item.id)}
            >
              {isLiked ? (
                <Text style={{ fontSize: 16 }}>{REACTION_EMOJIS[reactionType] || '👍'}</Text>
              ) : (
                <MaterialCommunityIcons name="thumb-up-outline" size={18} color="#666" />
              )}
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {isLiked ? (REACTION_LABELS[reactionType] || 'Beğenildi') : 'Beğen'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, showComments && styles.actionButtonActive]}
            onPress={() => setActiveCommentsPostId(showComments ? null : item.id)}
          >
            <MaterialCommunityIcons 
              name={showComments ? "comment" : "comment-outline"} 
              size={18} 
              color={showComments ? "#000000" : "#666"} 
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
              <MentionTextInput
                style={styles.commentInput}
                containerStyle={{ flex: 1, zIndex: 1000 }}
                placeholder="Yorum ekle..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
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
                      <TouchableOpacity onPress={() => router.push(`/user/${comment.authorId}`)}>
                        <Image
                          source={{ uri: (comment.author?.image || ((comment.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024')) }}
                          style={styles.commentAvatar}
                        />
                      </TouchableOpacity>
                      <View style={styles.commentBubble}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => router.push(`/user/${comment.authorId}`)}>
                            <Text style={styles.commentAuthorName}>{comment.author?.name} {comment.author?.surname}</Text>
                          </TouchableOpacity>
                          {isCommentAuthor && (
                            <TouchableOpacity onPress={() => deleteComment.mutate({ commentId: comment.id })}>
                              <MaterialCommunityIcons name="delete" size={14} color="#000000" />
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
                        <TouchableOpacity onPress={() => router.push(`/user/${reply.authorId}`)}>
                          <Image
                            source={{ uri: (reply.author?.image || ((reply.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024')) }}
                            style={[styles.commentAvatar, { width: 24, height: 24, borderRadius: 12 }]}
                          />
                        </TouchableOpacity>
                        <View style={[styles.commentBubble, { backgroundColor: '#F8F9FA' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => router.push(`/user/${reply.authorId}`)}>
                              <Text style={styles.commentAuthorName}>{reply.author?.name} {reply.author?.surname}</Text>
                            </TouchableOpacity>
                            {reply.authorId === userId && (
                              <TouchableOpacity onPress={() => deleteComment.mutate({ commentId: reply.id })}>
                                <MaterialCommunityIcons name="delete" size={12} color="#000000" />
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
              {createPost.isPending && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 12, marginHorizontal: 12, borderWidth: 1, borderColor: '#EEE' }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111' }}>Gönderi paylaşılıyor...</Text>
                  <ActivityIndicator size="small" color="#0F172A" />
                </View>
              )}
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
      {/* Dropdown / Action Sheet Modal */}
      <Modal
        visible={!!selectedPostOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPostOptions(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedPostOptions(null)}
        >
          <View style={styles.actionSheetContainer}>
            {selectedPostOptions?.authorId === userId ? (
              <>
                <TouchableOpacity 
                  style={styles.actionSheetButton}
                  onPress={() => {
                    setEditingPostId(selectedPostOptions.id);
                    setEditingPostText(selectedPostOptions.content || '');
                    setSelectedPostOptions(null);
                    setIsEditModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={24} color="#1A1A1A" />
                  <Text style={styles.actionSheetText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionSheetButton, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    const postId = selectedPostOptions.id;
                    setSelectedPostOptions(null);
                    handleDeletePostConfirm(postId);
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
                  <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>Sil</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.actionSheetButton, { borderBottomWidth: 0 }]}
                onPress={() => {
                  const postId = selectedPostOptions?.id;
                  setSelectedPostOptions(null);
                  if (postId) {
                    createReport.mutate({
                      targetType: 'POST',
                      targetId: postId,
                      reason: 'Uygunsuz içerik (Mobil)'
                    });
                  }
                }}
              >
                <MaterialCommunityIcons name="flag" size={24} color="#EF4444" />
                <Text style={[styles.actionSheetText, { color: '#EF4444' }]}>Şikayet Et</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Gönderiyi Düzenle</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.editModalInput}
              multiline
              value={editingPostText}
              onChangeText={setEditingPostText}
              placeholder="Gönderini düzenle..."
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.saveButton, editPost.isPending && { opacity: 0.7 }]} 
              onPress={() => {
                if (editingPostId && editingPostText.trim()) {
                  editPost.mutate({ postId: editingPostId, content: editingPostText.trim() });
                }
              }}
              disabled={editPost.isPending || !editingPostText.trim()}
            >
              {editPost.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: '#000000',
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
    minHeight: 40,
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
  reactionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  reactionEmojiBtn: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 22,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#000000',
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
    backgroundColor: '#000000',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  actionSheetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  editModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  editModalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
