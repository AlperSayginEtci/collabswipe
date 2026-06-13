import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';

const AnimatedGHScrollView = Animated.createAnimatedComponent(ScrollView);
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';
import { Country, State, City } from 'country-state-city';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;


const getBackgroundColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#FFE5EC', '#E8F0FE', '#E6FFFA', '#FFF4E5', '#F3E5F5', '#EBF7EE'];
  return colors[hash % colors.length];
};

function SwipeCard({ item, isFirst, isProfiles, onSwipeKey }: { item: any; isFirst: boolean; isProfiles: boolean; onSwipeKey: (key: string, direction: 'left' | 'right') => void }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
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

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, height], [0, -height * 0.5], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [-height, 0], [2, 1], Extrapolation.CLAMP);
    
    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  const bgColor = getBackgroundColor(item.id);
  
  const nameText = isProfiles ? `${item.name} ${item.surname || ''}`.trim() : item.title;
  const subtitleText = isProfiles 
    ? null
    : `${item.publisher?.name || 'Company'} ${item.publisher?.surname || ''}`;
    
  const bioText = isProfiles 
    ? (item.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.')
    : (item.description || 'Detaylı bir açıklama girilmemiş.');
    
  const locationText = isProfiles 
    ? (item.profile?.location || 'Türkiye')
    : (item.type);
    
  const skills = isProfiles 
    ? (item.profile?.skills?.map((s: any) => s.skill.skillName) ?? [])
    : (item.requirements?.map((req: any) => req.skillName) ?? []);
    
  let imageUrl = isProfiles 
    ? (item.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024`)
    : (item.publisher?.image || `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024`);
    

  const HERO_HEIGHT = height * 0.70;

  const scrollContent = (
    <>
      <Animated.Image 
        source={{ uri: imageUrl }} 
        style={[styles.parallaxImage, animatedImageStyle]} 
        resizeMode="cover"
      />
      <AnimatedGHScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={{ height: HERO_HEIGHT, justifyContent: 'flex-end' }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroSummary}>
            <Text style={[styles.name, { color: '#FFF' }]}>{nameText}</Text>
            {subtitleText && <Text style={[styles.subtitle, { color: '#EEE' }]}>{subtitleText}</Text>}
            <Text style={[styles.location, { color: '#DDD' }]}><MaterialCommunityIcons name={isProfiles ? "map-marker" : "briefcase"} size={14} color="#DDD" /> {locationText}</Text>
            
            {skills.length > 0 && (
              <View style={styles.skillsContainerTop}>
                {skills.slice(0, 3).map((skill: string) => (
                  <View key={skill} style={[styles.skillBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }]}>
                    <Text style={[styles.skillBadgeText, { color: '#FFF' }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={{ alignItems: 'center', marginTop: 15, opacity: 0.7 }}>
              <MaterialCommunityIcons name="chevron-down" size={28} color="#FFF" />
            </View>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text 
              style={styles.bio} 
              numberOfLines={isBioExpanded ? undefined : 4}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length > 4 && !isBioExpanded && !showReadMore) {
                  setShowReadMore(true);
                }
              }}
            >
              {bioText}
            </Text>
            {showReadMore && !isBioExpanded && (
              <TouchableOpacity onPress={() => setIsBioExpanded(true)}>
                <Text style={styles.readMoreText}>...devam et</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailsContainer}>
            {skills.length > 3 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tüm Yetenekler</Text>
                <View style={styles.skillsContainer}>
                  {skills.map((skill: string) => (
                    <View key={`all-${skill}`} style={styles.skillBadge}>
                      <Text style={styles.skillBadgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {isProfiles && item.profile?.experiences && item.profile.experiences.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Deneyimler</Text>
                {item.profile.experiences.map((exp: any) => (
                  <View key={exp.expId} style={styles.detailItem}>
                    <Text style={styles.detailTitle}>{exp.title}</Text>
                    <Text style={styles.detailSubtitle}>{exp.corp}</Text>
                    <Text style={styles.detailDate}>
                      {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Devam Ediyor'}
                    </Text>
                    {exp.desc && <Text style={styles.detailDesc}>{exp.desc}</Text>}
                  </View>
                ))}
              </View>
            )}

            {isProfiles && item.profile?.educations && item.profile.educations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Eğitim</Text>
                {item.profile.educations.map((edu: any) => (
                  <View key={edu.eduId} style={styles.detailItem}>
                    <Text style={styles.detailTitle}>{edu.instName}</Text>
                    <Text style={styles.detailSubtitle}>{edu.instProgram} • {edu.instDegree}</Text>
                    <Text style={styles.detailDate}>
                      {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Devam Ediyor'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {isProfiles && item.profile?.certificates && item.profile.certificates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sertifikalar</Text>
                {item.profile.certificates.map((cert: any) => (
                  <View key={cert.cerId} style={styles.detailItem}>
                    <Text style={styles.detailTitle}>{cert.title}</Text>
                    <Text style={styles.detailSubtitle}>{cert.org}</Text>
                    <Text style={styles.detailDate}>
                      {new Date(cert.startDate).getFullYear()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </AnimatedGHScrollView>
    </>
  );

  const cardContent = (
    <View style={styles.cardInner}>
      {isFirst && (
        <>
          <Animated.View style={[styles.badgeContainer, styles.likeBadge, animatedLikeStyle]} pointerEvents="none">
            <Text style={styles.badgeTextLike}>{isProfiles ? 'BEĞEN' : 'BAŞVUR'}</Text>
          </Animated.View>
          <Animated.View style={[styles.badgeContainer, styles.nopeBadge, animatedNopeStyle]} pointerEvents="none">
            <Text style={styles.badgeTextNope}>GEÇ</Text>
          </Animated.View>
        </>
      )}
      {scrollContent}
    </View>
  );

  if (!isFirst) {
    return <View style={[styles.card, { backgroundColor: '#FFF' }]}>{cardContent}</View>;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, { backgroundColor: '#FFF' }, animatedCardStyle]}>
        {cardContent}
      </Animated.View>
    </GestureDetector>
  );
}

export default function DiscoverScreen() {
  const { user, userId } = useUser();
  const isCompany = user?.role === 'company';
  const utils = trpc.useUtils();
  
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'JOBS'>('PROFILES');
  const isProfiles = activeTab === 'PROFILES' || isCompany;

  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>([]);
  const [swipedJobIds, setSwipedJobIds] = useState<string[]>([]);
  
  type SwipeHistoryItem = { id: string; type: 'PROFILE_CONNECT' | 'PROFILE_REJECT' | 'JOB_APPLY' | 'JOB_SKIP' };
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [locationType, setLocationType] = useState<'any' | 'remote' | 'in-person'>('any');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  let finalLocation = '';
  let includeRemote: boolean | undefined = undefined;

  const { Country, City } = require('country-state-city');
  const countryName = selectedCountry ? Country.getCountryByCode(selectedCountry)?.name || selectedCountry : '';

  if (locationType === 'remote') {
    includeRemote = true;
  } else if (locationType === 'in-person') {
    if (selectedCity && countryName) finalLocation = `${selectedCity}, ${countryName}`;
    else if (countryName) finalLocation = countryName;
    includeRemote = false;
  } else if (locationType === 'any') {
    if (countryName) {
      if (selectedCity && countryName) finalLocation = `${selectedCity}, ${countryName}`;
      else finalLocation = countryName;
      includeRemote = true;
    } else {
      includeRemote = undefined;
    }
  }

  const { data: profiles, isLoading: isProfilesLoading } = trpc.user.getDiscoverable.useQuery(
    { 
      userId: userId || '',
      location: finalLocation || undefined,
      includeRemote,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    }, 
    { enabled: !!userId && activeTab === 'PROFILES' }
  );
  
  const { data: jobsResponse, isLoading: isJobsLoading } = trpc.job.list.useQuery(
    { 
      userId: userId || '',
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    }, 
    { enabled: !!userId && activeTab === 'JOBS' }
  );

  const sendRequest = trpc.connection.sendRequest.useMutation({
    onSuccess: () => utils.user.getDiscoverable.invalidate(),
    onError: () => Alert.alert('Hata', 'Bağlantı isteği gönderilemedi.')
  });

  const rejectProfile = trpc.connection.rejectProfile.useMutation({
    onSuccess: () => utils.user.getDiscoverable.invalidate(),
    onError: () => Alert.alert('Hata', 'Profil geçilemedi.')
  });
  
  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => {
      utils.job.list.invalidate();
    },
    onError: (err) => Alert.alert('Hata', err.message || 'Başvuru yapılamadı.')
  });

  const undoConnection = trpc.connection.undoSwipe.useMutation();
  const undoJob = trpc.job.undoApply.useMutation();

  const activeData = isProfiles 
    ? (profiles || []).filter((p) => !swipedProfileIds.includes(p.id))
    : (jobsResponse?.items || []).filter((j) => !swipedJobIds.includes(j.id));

  const handleSwipe = (id: string, direction: 'left' | 'right') => {
    if (!userId) return;
    
    if (isProfiles) {
      if (direction === 'right') {
        sendRequest.mutate({ requesterId: userId, addresseeId: id });
        setSwipeHistory(prev => [...prev, { id, type: 'PROFILE_CONNECT' }]);
      } else {
        rejectProfile.mutate({ requesterId: userId, addresseeId: id });
        setSwipeHistory(prev => [...prev, { id, type: 'PROFILE_REJECT' }]);
      }
      setSwipedProfileIds((prev) => [...prev, id]);
    } else {
      if (direction === 'right') {
        applyJob.mutate({ jobId: id, applicantId: userId });
        setSwipeHistory(prev => [...prev, { id, type: 'JOB_APPLY' }]);
      } else {
        setSwipeHistory(prev => [...prev, { id, type: 'JOB_SKIP' }]);
      }
      setSwipedJobIds((prev) => [...prev, id]);
    }
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    
    const currentTabHistory = swipeHistory.filter(h => isProfiles ? h.type.startsWith('PROFILE') : h.type.startsWith('JOB'));
    if (currentTabHistory.length === 0) return;

    const lastAction = currentTabHistory[currentTabHistory.length - 1];
    setSwipeHistory(prev => prev.filter(h => h !== lastAction));
    
    if (lastAction.type.startsWith('PROFILE')) {
      setSwipedProfileIds(prev => prev.filter(id => id !== lastAction.id));
      if (lastAction.type === 'PROFILE_CONNECT' || lastAction.type === 'PROFILE_REJECT') {
        undoConnection.mutate({ requesterId: userId!, addresseeId: lastAction.id });
      }
    } else {
      setSwipedJobIds(prev => prev.filter(id => id !== lastAction.id));
      if (lastAction.type === 'JOB_APPLY') {
        undoJob.mutate({ jobId: lastAction.id, applicantId: userId! });
      }
    }
  };

  const handleButtonReject = () => {
    if (activeData.length === 0) return;
    handleSwipe(activeData[0].id, 'left');
  };

  const handleButtonAccept = () => {
    if (activeData.length === 0) return;
    handleSwipe(activeData[0].id, 'right');
  };

  const isLoading = isProfiles ? isProfilesLoading : isJobsLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collabswipe</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
      
      {/* Tab Toggle */}
      {!isCompany && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, isProfiles && styles.tabButtonActive]}
            onPress={() => setActiveTab('PROFILES')}
          >
            <MaterialCommunityIcons name="account-group" size={20} color={isProfiles ? '#FFF' : '#666'} />
            <Text style={[styles.tabText, isProfiles && styles.tabTextActive]}>İş Arkadaşları</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, !isProfiles && styles.tabButtonActive]}
            onPress={() => setActiveTab('JOBS')}
          >
            <MaterialCommunityIcons name="briefcase" size={20} color={!isProfiles ? '#FFF' : '#666'} />
            <Text style={[styles.tabText, !isProfiles && styles.tabTextActive]}>İlanlar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardContainer}>
            {activeData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="creation" size={48} color="#000000" />
                <Text style={styles.noMore}>Harika İş! 🎉</Text>
                <Text style={styles.noMoreSubtitle}>
                  {isProfiles ? 'Etrafındaki tüm adayları inceledin.' : 'Tüm iş ilanlarına göz attın.'}
                </Text>
              </View>
            ) : (
              [...activeData].slice(0, 3).reverse().map((item, index, arr) => {
                const isFirst = index === arr.length - 1;
                return (
                  <SwipeCard
                    key={item.id}
                    item={item}
                    isFirst={isFirst}
                    isProfiles={isProfiles}
                    onSwipeKey={handleSwipe}
                  />
                );
              })
            )}
          </View>

          {activeData.length > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButtonSmall} onPress={handleUndo} disabled={swipeHistory.filter(h => isProfiles ? h.type.startsWith('PROFILE') : h.type.startsWith('JOB')).length === 0}>
                <MaterialCommunityIcons name="undo" size={24} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleButtonReject}>
                <MaterialCommunityIcons name="close" size={32} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleButtonAccept} disabled={sendRequest.isLoading || applyJob.isLoading}>
                <MaterialCommunityIcons name="heart" size={32} color="#000000" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <FiltersModal 
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        locationType={locationType}
        setLocationType={setLocationType}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedSkills={selectedSkills}
        setSelectedSkills={setSelectedSkills}
      />
    </SafeAreaView>
  );
}

function FiltersModal(props: any) {
  const { Country, City } = require('country-state-city');
  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();
  const [skillSearch, setSkillSearch] = useState('');
  
  const filteredSkills = allSkills?.filter(s => 
    s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && 
    !props.selectedSkills.includes(s.skillName)
  ) || [];

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  return (
    <View style={props.visible ? [StyleSheet.absoluteFill, { backgroundColor: '#FFF', zIndex: 1000 }] : { display: 'none' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Filtreler</Text>
          <TouchableOpacity onPress={props.onClose}><MaterialCommunityIcons name="close" size={28} color="#1A1A1A" /></TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Çalışma Şekli</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {['any', 'remote', 'in-person'].map((type) => (
              <TouchableOpacity 
                key={type}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: props.locationType === type ? '#000000' : '#F5F5F5' }}
                onPress={() => props.setLocationType(type)}
              >
                <Text style={{ color: props.locationType === type ? '#FFF' : '#333', fontWeight: '600' }}>
                  {type === 'any' ? 'Farketmez' : type === 'remote' ? 'Uzaktan' : 'Ofis'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {props.locationType !== 'remote' && (
            <>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Konum</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowCountryModal(true)}>
                  <Text style={{ color: props.selectedCountry ? '#1A1A1A' : '#999' }}>
                    {props.selectedCountry ? Country.getCountryByCode(props.selectedCountry)?.name : 'Ülke Seç'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.input, { flex: 1, justifyContent: 'center' }, !props.selectedCountry && { opacity: 0.5 }]} 
                  onPress={() => props.selectedCountry && setShowCityModal(true)}
                  disabled={!props.selectedCountry}
                >
                  <Text style={{ color: props.selectedCity ? '#1A1A1A' : '#999' }}>
                    {props.selectedCity || 'Şehir Seç'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Yetenekler</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {props.selectedSkills.map((s: string) => (
              <View key={s} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#333' }}>{s}</Text>
                <TouchableOpacity style={{ marginLeft: 6 }} onPress={() => props.setSelectedSkills(props.selectedSkills.filter((x: string) => x !== s))}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#000000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TextInput 
            style={styles.input} 
            placeholder="Yetenek ara..." 
            value={skillSearch} 
            onChangeText={setSkillSearch} 
          />
          {skillSearch.length > 0 && (
            <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderRadius: 8, marginTop: 4 }}>
              {filteredSkills.slice(0, 5).map(s => (
                <TouchableOpacity 
                  key={s.skillId} 
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}
                  onPress={() => { props.setSelectedSkills([...props.selectedSkills, s.skillName]); setSkillSearch(''); }}
                >
                  <Text>{s.skillName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        <TouchableOpacity style={{ backgroundColor: '#000000', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' }} onPress={props.onClose}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Sonuçları Göster</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <SelectionModal 
        visible={showCountryModal}
        title="Ülke Seçin"
        items={Country.getAllCountries().map((c: any) => ({ label: c.name, value: c.isoCode }))}
        onSelect={(val) => { props.setSelectedCountry(val); props.setSelectedCity(''); setShowCountryModal(false); }}
        onClose={() => setShowCountryModal(false)}
      />

      <SelectionModal 
        visible={showCityModal}
        title="Şehir Seçin"
        items={props.selectedCountry ? Array.from(new Set(State.getStatesOfCountry(props.selectedCountry)!.map((s: any) => s.name))).sort().map(name => ({ label: name as string, value: name as string })) : []}
        onSelect={(val) => { props.setSelectedCity(val); setShowCityModal(false); }}
        onClose={() => setShowCityModal(false)}
      />
    </View>
  );
}

function SelectionModal({ visible, title, items, onSelect, onClose }: { visible: boolean, title: string, items: {label:string, value:string}[], onSelect: (v:string)=>void, onClose:()=>void }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((i: any) => i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={visible ? [StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', zIndex: 1100 }] : { display: 'none' }}>
      <View style={{ backgroundColor: '#FFF', margin: 20, borderRadius: 16, maxHeight: '80%' }}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
          <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color="#666" /></TouchableOpacity>
        </View>
        <TextInput 
          style={{ backgroundColor: '#F5F5F5', margin: 16, padding: 12, borderRadius: 8 }}
          placeholder="Ara..."
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView style={{ paddingHorizontal: 16 }}>
          {filtered.map(item => (
            <TouchableOpacity key={item.value} style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F5F5F5' }} onPress={() => onSelect(item.value)}>
              <Text style={{ fontSize: 16, color: '#333' }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && <Text style={{ textAlign: 'center', marginVertical: 20, color: '#999' }}>Sonuç bulunamadı</Text>}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    fontStyle: 'italic',
  },
  filterBtn: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#EEE',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
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
    borderColor: '#000000',
  },
  nopeBadge: {
    right: 40,
    borderColor: '#000000',
  },
  badgeTextLike: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  badgeTextNope: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    marginTop: 10,
    marginBottom: 0,
  },
  card: {
    width: width * 0.9,
    height: '100%',
    borderRadius: 28,
    position: 'absolute',
    top: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  parallaxImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: height * 0.75,
    backgroundColor: '#000',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 400,
  },
  heroSummary: {
    padding: 20,
    paddingBottom: 120,
    zIndex: 2,
  },
  cardDetails: {
    backgroundColor: '#FFF',
    padding: 24,
    paddingTop: 30,
    paddingBottom: 120,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 10,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bio: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  readMoreText: {
    color: '#000000',
    fontWeight: '700',
    marginTop: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  skillsContainerTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  skillBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  detailSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  detailDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  detailDesc: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    lineHeight: 20,
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
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 20,
    zIndex: 100,
    elevation: 10,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  actionButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: '#333',
  },
});
