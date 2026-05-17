import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const getBackgroundColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#FFE5EC', '#E8F0FE', '#E6FFFA', '#FFF4E5', '#F3E5F5', '#EBF7EE'];
  return colors[hash % colors.length];
};

function SwipeCard({ item, isFirst, onSwipeKey }: { item: any; isFirst: boolean; onSwipeKey: (key: string, direction: 'left' | 'right') => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const sign = Math.sign(event.translationX);
        const direction = sign === 1 ? 'right' : 'left';
        
        translateX.value = withSpring(sign * width * 1.5, { velocity: event.velocityX });
        translateY.value = withSpring(event.translationY + event.velocityY * 0.2);
        
        runOnJS(onSwipeKey)(item.id, direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-width / 2, 0, width / 2], [-10, 0, 10], 'clamp');
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const animatedLikeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, width * 0.15], [0, 1], 'clamp');
    return {
      opacity,
      transform: [{ rotate: '-12deg' }],
    };
  });

  const animatedNopeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-width * 0.15, 0], [1, 0], 'clamp');
    return {
      opacity,
      transform: [{ rotate: '12deg' }],
    };
  });

  const bgColor = getBackgroundColor(item.id);
  const nameText = `${item.name} ${item.surname || ''}`.trim();
  const bioText = item.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.';
  const locationText = item.profile?.location || 'Turkey';
  const skills = item.profile?.skills?.map((s: any) => s.skill.skillName) ?? [];
  const imageUrl = item.image || `https://api.dicebear.com/7.x/notionists/png?seed=${item.name}`;

  if (!isFirst) {
    return (
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{nameText}</Text>
          <Text style={styles.location}><MaterialCommunityIcons name="map-marker" size={14} /> {locationText}</Text>
          <Text style={styles.bio} numberOfLines={3}>{bioText}</Text>
          {skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {skills.slice(0, 3).map((skill: string) => (
                <View key={skill} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, { backgroundColor: bgColor }, animatedCardStyle]}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        
        {/* BEĞEN Rozeti */}
        <Animated.View style={[styles.badgeContainer, styles.likeBadge, animatedLikeStyle]}>
          <Text style={styles.badgeTextLike}>BEĞEN</Text>
        </Animated.View>

        {/* GEÇ Rozeti */}
        <Animated.View style={[styles.badgeContainer, styles.nopeBadge, animatedNopeStyle]}>
          <Text style={styles.badgeTextNope}>GEÇ</Text>
        </Animated.View>

        <View style={styles.cardInfo}>
          <Text style={styles.name}>{nameText}</Text>
          <Text style={styles.location}><MaterialCommunityIcons name="map-marker" size={14} /> {locationText}</Text>
          <Text style={styles.bio}>{bioText}</Text>
          {skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {skills.slice(0, 3).map((skill: string) => (
                <View key={skill} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function DiscoverScreen() {
  const { userId } = useUser();
  const [swipedIds, setSwipedIds] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const { data: profiles, isLoading } = trpc.user.getDiscoverable.useQuery({ userId: userId || '' }, { enabled: !!userId });

  const sendRequest = trpc.connection.sendRequest.useMutation({
    onSuccess: () => {
      console.log('Connection request sent');
      utils.user.getDiscoverable.invalidate();
    },
    onError: (err) => Alert.alert('Hata', 'Bağlantı isteği gönderilemedi.')
  });

  const rejectProfile = trpc.connection.rejectProfile.useMutation({
    onSuccess: () => {
      console.log('Profile rejected');
      utils.user.getDiscoverable.invalidate();
    },
    onError: (err) => Alert.alert('Hata', 'Profil geçilemedi.')
  });

  const activeProfiles = (profiles || []).filter((p) => !swipedIds.includes(p.id));

  const handleSwipe = (id: string, direction: 'left' | 'right') => {
    if (!userId) return;
    if (direction === 'right') {
      sendRequest.mutate({ requesterId: userId, addresseeId: id });
    } else {
      rejectProfile.mutate({ requesterId: userId, addresseeId: id });
    }
    setSwipedIds((prev) => [...prev, id]);
  };

  const handleButtonReject = () => {
    if (activeProfiles.length === 0) return;
    handleSwipe(activeProfiles[0].id, 'left');
  };

  const handleButtonAccept = () => {
    if (activeProfiles.length === 0) return;
    handleSwipe(activeProfiles[0].id, 'right');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render cards in reverse order so that activeProfiles[0] is rendered last (on top of the stack)
  const renderedProfiles = [...activeProfiles].reverse();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collabswipe</Text>
      </View>
      
      <View style={styles.cardContainer}>
        {activeProfiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="creation" size={48} color="#4ECDC4" />
            <Text style={styles.noMore}>Harika İş! 🎉</Text>
            <Text style={styles.noMoreSubtitle}>Etrafındaki tüm adayları inceledin.</Text>
          </View>
        ) : (
          renderedProfiles.map((item, index) => {
            const isFirst = index === renderedProfiles.length - 1;
            return (
              <SwipeCard
                key={item.id}
                item={item}
                isFirst={isFirst}
                onSwipeKey={handleSwipe}
              />
            );
          })
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleButtonReject}>
          <MaterialCommunityIcons name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleButtonAccept} disabled={sendRequest.isLoading}>
          <MaterialCommunityIcons name="heart" size={32} color="#4ECDC4" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  badgeContainer: {
    position: 'absolute',
    top: 40,
    zIndex: 100,
    borderWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  likeBadge: {
    left: 40,
    borderColor: '#4ECDC4',
  },
  nopeBadge: {
    right: 40,
    borderColor: '#FF6B6B',
  },
  badgeTextLike: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4ECDC4',
    letterSpacing: 2,
  },
  badgeTextNope: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF6B6B',
    letterSpacing: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  card: {
    width: width * 0.9,
    height: height * 0.62,
    borderRadius: 28,
    position: 'absolute',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    justifyContent: 'flex-end',
    padding: 16,
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  cardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 22,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  location: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: '#444',
    lineHeight: 18,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  skillBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  skillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noMore: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    marginTop: 10,
  },
  noMoreSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noMore: {
    fontSize: 20,
    color: '#999',
  },
});
