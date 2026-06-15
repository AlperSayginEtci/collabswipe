import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { FormattedText } from '../../components/FormattedText';
import { useUser } from '../../context/UserContext';

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useUser();

  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { postId: id as string, currentUserId: userId || undefined },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Gönderi bulunamadı.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const authorImage = post.author?.image || (post.author?.role === 'company' 
    ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` 
    : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gönderi</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity onPress={() => router.push(`/user/${post.authorId}`)}>
              <Image source={{ uri: authorImage }} style={styles.avatar} />
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <TouchableOpacity onPress={() => router.push(`/user/${post.authorId}`)}>
                <Text style={styles.authorName}>{post.author?.name} {post.author?.surname}</Text>
              </TouchableOpacity>
              <Text style={styles.authorHeadline}>{post.author?.sector || 'Üye'}</Text>
              <Text style={styles.timeText}>
                {new Date(post.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
            </View>
          </View>

          {!!post.content && (
            <FormattedText text={post.content} style={styles.postContent} />
          )}

          {!!post.mediaUrl && (
            <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name={post.isLiked ? "heart" : "heart-outline"} size={20} color={post.isLiked ? "#EF4444" : "#666"} />
              <Text style={styles.statText}>{post._count.likes}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="comment-outline" size={20} color="#666" />
              <Text style={styles.statText}>{post._count.comments}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="repeat" size={20} color="#666" />
              <Text style={styles.statText}>{post._count.reposts}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  scrollContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  authorHeadline: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#EEE',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
  }
});
