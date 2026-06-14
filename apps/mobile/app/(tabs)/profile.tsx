import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { getBaseUrl } from '../../lib/trpc';
import { Country, City, State } from 'country-state-city';

// Components
import ExperienceModal, { ExperienceData } from '../../components/profile/ExperienceModal';
import EducationModal, { EducationData } from '../../components/profile/EducationModal';
import CertificateModal, { CertificateData } from '../../components/profile/CertificateModal';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
};

export default function ProfileScreen() {
  const { userId: loggedInUserId, user, login, logout } = useUser();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const utils = trpc.useUtils();
  const router = useRouter();
  
  const routeId = (localParams.id || globalParams.id) as string;
  const paramUserId = (localParams.userId || globalParams.userId) as string;
  
  const targetId = routeId || paramUserId;
  const userId = targetId || loggedInUserId;
  const isOwnProfile = !targetId || targetId === loggedInUserId;

  // Basic Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editCountryCode, setEditCountryCode] = useState('');
  const [editCityName, setEditCityName] = useState('');
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  
  // Skills
  const [skillSearch, setSkillSearch] = useState('');

  // Modals
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceData | null>(null);

  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationData | null>(null);

  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateData | null>(null);

  // Queries
  const { data: profile, isLoading } = trpc.profile.getByUserId.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();

  useEffect(() => {
    if (profile && !isEditing) {
      setEditBio(profile.bio || '');
      setEditLocation(profile.location || '');
      setEditBanner(profile.banner || '');
      setEditIsPrivate(profile.isPrivate || false);
      setEditName(profile.user?.name || (isOwnProfile ? user?.name : '') || '');
      setEditSurname((profile.user as any)?.surname || (isOwnProfile ? user?.surname : '') || '');
      
      setEditImage(profile.user?.image || (isOwnProfile ? user?.image : '') || '');

      const locStr = profile.location || '';
      if (locStr) {
        if (locStr.includes(',')) {
          const parts = locStr.split(',');
          const cName = parts[1].trim();
          const ciName = parts[0].trim();
          const matchedCountry = Country.getAllCountries().find(c => c.name === cName);
          if (matchedCountry) {
            setEditCountryCode(matchedCountry.isoCode);
            setEditCityName(ciName);
          } else {
            setEditLocation(locStr);
          }
        } else {
          const matchedCountry = Country.getAllCountries().find(c => c.name === locStr);
          if (matchedCountry) {
            setEditCountryCode(matchedCountry.isoCode);
            setEditCityName('');
          } else {
            setEditLocation(locStr);
          }
        }
      }
    }
  }, [profile, user, isEditing, isOwnProfile]);

  // Mutations
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
      setIsEditing(false);
      
      // Context'teki kullanıcıyı da lokal olarak güncelle (Uygulamanın diğer yerlerinde de görünmesi için)
      if (user) {
        login({
          ...user,
          name: editName,
          surname: editSurname,
          image: editImage,
        });
      }
    },
    onError: (err) => Alert.alert('Hata', err.message),
  });

  const addSkillMutation = trpc.profile.addSkill.useMutation({
    onSuccess: () => {
      setSkillSearch('');
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    }
  });

  const removeSkillMutation = trpc.profile.removeSkill.useMutation({
    onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' })
  });

  const addExpMut = trpc.profile.addExperience.useMutation({ onSuccess: () => { setShowExpModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const updateExpMut = trpc.profile.updateExperience.useMutation({ onSuccess: () => { setShowExpModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const removeExpMut = trpc.profile.removeExperience.useMutation({ onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' }) });

  const addEduMut = trpc.profile.addEducation.useMutation({ onSuccess: () => { setShowEduModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const updateEduMut = trpc.profile.updateEducation.useMutation({ onSuccess: () => { setShowEduModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const removeEduMut = trpc.profile.removeEducation.useMutation({ onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' }) });

  const addCertMut = trpc.profile.addCertificate.useMutation({ onSuccess: () => { setShowCertModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const updateCertMut = trpc.profile.updateCertificate.useMutation({ onSuccess: () => { setShowCertModal(false); utils.profile.getByUserId.invalidate({ userId: userId || '' }); }});
  const removeCertMut = trpc.profile.removeCertificate.useMutation({ onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' }) });

  const uploadImage = async (uri: string) => {
    try {
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);

      const res = await fetch(`${getBaseUrl()}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Resim yüklenirken sunucu hatası oluştu.');
      return null;
    }
  };

  const pickImage = async (type: 'avatar' | 'banner') => {
    if (!isEditing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const url = await uploadImage(result.assets[0].uri);
      if (url) {
        if (type === 'avatar') setEditImage(url);
        else setEditBanner(url);
      }
    }
  };

  const handleSaveProfile = () => {
    if (!userId) return;

    let finalLoc = editLocation;
    if (editCountryCode) {
      const cName = Country.getCountryByCode(editCountryCode)?.name || '';
      if (editCityName && cName) finalLoc = `${editCityName}, ${cName}`;
      else if (cName) finalLoc = cName;
    }

    updateProfileMutation.mutate({
      userId,
      name: editName,
      surname: editSurname,
      
      bio: editBio,
      location: finalLoc,
      image: editImage,
      banner: editBanner,
      isPrivate: editIsPrivate,
      links: [], // Implement links edit natively if desired, omitting for brevity
    });
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const targetUser = profile?.user || user;
  const fallbackAvatar = targetUser?.role === 'company'
    ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024`
    : `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024`;
  const bannerUri = isEditing ? editBanner : profile?.banner;
  const avatarUri = isEditing ? editImage : (targetUser?.image || fallbackAvatar);

  const filteredSkills = allSkills?.filter(s => s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && !profile?.skills.find((ps: any) => ps.skill.skillName === s.skillName)) || [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header / Banner */}
        <TouchableOpacity activeOpacity={isEditing ? 0.8 : 1} onPress={() => pickImage('banner')}>
          <ImageBackground
            source={bannerUri ? { uri: bannerUri } : undefined}
            style={[styles.banner, !bannerUri && styles.bannerPlaceholder]}
          >
            {!isOwnProfile && (
              <TouchableOpacity 
                style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
            )}
            {isEditing && (
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
              </View>
            )}
          </ImageBackground>
        </TouchableOpacity>

        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={isEditing ? 0.8 : 1} onPress={() => pickImage('avatar')} style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {isEditing && (
              <View style={[styles.imageOverlay, { borderRadius: 50 }]}>
                <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {isOwnProfile && (
            <View style={styles.headerActions}>
              {isEditing ? (
                <>
                  <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.actionBtn, styles.cancelBtn]}>
                    <Text style={styles.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveProfile} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Kaydet</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>Profili Düzenle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          {isEditing ? (
            <View style={styles.editBasicInfo}>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={editName} onChangeText={setEditName} placeholder="Ad" />
                <TextInput style={[styles.input, { flex: 1 }]} value={editSurname} onChangeText={setEditSurname} placeholder="Soyad" />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.label}>Gizli Hesap</Text>
                <Switch value={editIsPrivate} onValueChange={setEditIsPrivate} trackColor={{ true: '#000000', false: '#DDD' }} />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{`${user?.name || ''} ${user?.surname || ''}`.trim()}</Text>
              
              <View style={styles.statsRow}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/network', params: { userId: profile?.userId, tab: 'followers' } })}>
                  <Text style={styles.statText}><Text style={styles.statNumber}>{profile?.user?._count?.followers || 0}</Text> Takipçi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push({ pathname: '/network', params: { userId: profile?.userId, tab: 'following' } })}>
                  <Text style={styles.statText}><Text style={styles.statNumber}>{profile?.user?._count?.following || 0}</Text> Takip Edilen</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isEditing ? (
            <>
              <TextInput style={[styles.input, styles.textArea]} value={editBio} onChangeText={setEditBio} placeholder="Kendinizden bahsedin..." multiline numberOfLines={3} />
              
              <Text style={styles.label}>Konum</Text>
              <View style={[styles.row, { marginTop: 8, marginBottom: 12 }]}>
                <TouchableOpacity style={[styles.input, { flex: 1, marginRight: 8, justifyContent: 'center' }]} onPress={() => setShowCountryModal(true)}>
                  <Text style={{ color: editCountryCode ? '#1A1A1A' : '#999' }}>
                    {editCountryCode ? Country.getCountryByCode(editCountryCode)?.name : 'Ülke Seçin'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.input, { flex: 1, justifyContent: 'center' }, !editCountryCode && { backgroundColor: '#F5F5F5', opacity: 0.5 }]} 
                  onPress={() => editCountryCode && setShowCityModal(true)}
                  disabled={!editCountryCode}
                >
                  <Text style={{ color: editCityName ? '#1A1A1A' : '#999' }}>
                    {editCityName || 'Şehir Seçin'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {profile?.location && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                  <Text style={styles.locationText}>{profile.location}</Text>
                </View>
              )}
              <Text style={styles.bioText}>{profile?.bio || 'Biyografi eklenmemiş.'}</Text>
            </>
          )}
        </View>

        {/* Skills */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Yetenekler</Text>
          <View style={styles.skillsContainer}>
            {profile?.skills?.map((s: any) => (
              <View key={s.skillId} style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>{s.skill.skillName}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeSkillMutation.mutate({ profileId: profile.id, skillId: s.skillId })} style={styles.skillRemoveButton}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#000000" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          {isEditing && (
            <View style={styles.addSkillContainer}>
              <TextInput style={styles.skillInput} value={skillSearch} onChangeText={setSkillSearch} placeholder="Yetenek ara ve ekle..." />
              {skillSearch.length > 0 && (
                <View style={styles.skillSuggestions}>
                  {filteredSkills.slice(0, 5).map(s => (
                    <TouchableOpacity key={s.skillId} style={styles.suggestionItem} onPress={() => {
                      addSkillMutation.mutate({ profileId: profile!.id, skillName: s.skillName });
                    }}>
                      <Text style={styles.suggestionText}>{s.skillName}</Text>
                    </TouchableOpacity>
                  ))}
                  {filteredSkills.length === 0 && (
                    <Text style={styles.suggestionText}>Sonuç bulunamadı</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Experience */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Deneyimler</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => { setEditingExp(null); setShowExpModal(true); }}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
          {profile?.experiences?.map((exp: any) => (
            <View key={exp.expId} style={styles.listItem}>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{exp.title}</Text>
                <Text style={styles.listSubtitle}>{exp.corp} • {exp.type === 'WORK' ? 'İş' : 'Staj'}</Text>
                <Text style={styles.listDate}>{formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Devam ediyor'}</Text>
                {exp.desc && <Text style={styles.listDesc}>{exp.desc}</Text>}
              </View>
              {isEditing && (
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => { setEditingExp(exp); setShowExpModal(true); }}><MaterialCommunityIcons name="pencil" size={20} color="#666" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExpMut.mutate({ expId: exp.expId })}><MaterialCommunityIcons name="delete" size={20} color="#000000" /></TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eğitim</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => { setEditingEdu(null); setShowEduModal(true); }}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
          {profile?.educations?.map((edu: any) => (
            <View key={edu.eduId} style={styles.listItem}>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{edu.instName}</Text>
                <Text style={styles.listSubtitle}>{edu.instDegree} • {edu.instProgram}</Text>
                <Text style={styles.listDate}>{formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Devam ediyor'}</Text>
                {edu.instDesc && <Text style={styles.listDesc}>{edu.instDesc}</Text>}
              </View>
              {isEditing && (
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => { setEditingEdu(edu); setShowEduModal(true); }}><MaterialCommunityIcons name="pencil" size={20} color="#666" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => removeEduMut.mutate({ eduId: edu.eduId })}><MaterialCommunityIcons name="delete" size={20} color="#000000" /></TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Certificates */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sertifikalar</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => { setEditingCert(null); setShowCertModal(true); }}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#000000" />
              </TouchableOpacity>
            )}
          </View>
          {profile?.certificates?.map((cert: any) => (
            <View key={cert.cerId} style={styles.listItem}>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{cert.title}</Text>
                <Text style={styles.listSubtitle}>{cert.org}</Text>
                <Text style={styles.listDate}>{formatDate(cert.startDate)}</Text>
              </View>
              {isEditing && (
                <View style={styles.listActions}>
                  <TouchableOpacity onPress={() => { setEditingCert(cert); setShowCertModal(true); }}><MaterialCommunityIcons name="pencil" size={20} color="#666" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCertMut.mutate({ cerId: cert.cerId })}><MaterialCommunityIcons name="delete" size={20} color="#000000" /></TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Support Button */}
        <TouchableOpacity style={styles.supportButton} onPress={() => router.push('/support')}>
          <MaterialCommunityIcons name="lifebuoy" size={20} color="#000000" />
          <Text style={styles.supportButtonText}>Destek Al</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#000000" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <ExperienceModal 
        visible={showExpModal} 
        onClose={() => setShowExpModal(false)} 
        initialData={editingExp}
        onSave={(data) => {
          if (data.expId) updateExpMut.mutate({ ...data, expId: data.expId } as any);
          else addExpMut.mutate({ profileId: profile!.id, ...data } as any);
        }} 
      />

      <EducationModal 
        visible={showEduModal} 
        onClose={() => setShowEduModal(false)} 
        initialData={editingEdu}
        onSave={(data) => {
          if (data.eduId) updateEduMut.mutate({ ...data, eduId: data.eduId } as any);
          else addEduMut.mutate({ profileId: profile!.id, ...data } as any);
        }} 
      />

      <CertificateModal 
        visible={showCertModal} 
        onClose={() => setShowCertModal(false)} 
        initialData={editingCert}
        onSave={(data) => {
          if (data.cerId) updateCertMut.mutate({ ...data, cerId: data.cerId } as any);
          else addCertMut.mutate({ profileId: profile!.id, ...data } as any);
        }} 
      />

      <SelectionModal 
        visible={showCountryModal}
        title="Ülke Seçin"
        items={Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))}
        onSelect={(val) => { setEditCountryCode(val); setEditCityName(''); setShowCountryModal(false); }}
        onClose={() => setShowCountryModal(false)}
      />

      <SelectionModal 
        visible={showCityModal}
        title="Şehir Seçin"
        items={editCountryCode ? Array.from(new Set(State.getStatesOfCountry(editCountryCode)!.map((s: any) => s.name))).sort().map(name => ({ label: name as string, value: name as string })) : []}
        onSelect={(val) => { setEditCityName(val); setShowCityModal(false); }}
        onClose={() => setShowCityModal(false)}
      />
    </SafeAreaView>
  );
}

function SelectionModal({ visible, title, items, onSelect, onClose }: { visible: boolean, title: string, items: {label:string, value:string}[], onSelect: (v:string)=>void, onClose:()=>void }) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={visible ? [StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', zIndex: 1000 }] : { display: 'none' }}>
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  banner: { height: 160, width: '100%', backgroundColor: '#000000' },
  bannerPlaceholder: { backgroundColor: '#000000' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginTop: -40 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#FAFAFA', backgroundColor: '#EEE', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  headerActions: { marginTop: 50, flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#000000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cancelBtn: { backgroundColor: '#EFEFEF' },
  cancelBtnText: { color: '#333', fontWeight: '700', fontSize: 13 },
  infoContainer: { paddingHorizontal: 20, paddingTop: 12 },
  userName: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  userUsername: { fontSize: 15, fontWeight: '700', color: '#000000', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  statText: { fontSize: 14, color: '#666' },
  statNumber: { fontWeight: '800', color: '#1A1A1A' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  locationText: { fontSize: 14, color: '#666', fontWeight: '500' },
  bioText: { fontSize: 15, color: '#333', marginTop: 12, lineHeight: 22 },
  editBasicInfo: { gap: 12, marginBottom: 12 },
  row: { flexDirection: 'row' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14, color: '#333', marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  label: { fontSize: 14, fontWeight: '600', color: '#555' },
  sectionCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, paddingLeft: 12, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: '#EFEFEF' },
  skillBadgeText: { fontSize: 13, fontWeight: '700', color: '#555' },
  skillRemoveButton: { marginLeft: 6, padding: 2 },
  addSkillContainer: { marginTop: 16 },
  skillInput: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14 },
  skillSuggestions: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, marginTop: 4, maxHeight: 150 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionText: { fontSize: 14, color: '#333' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  listContent: { flex: 1, paddingRight: 16 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  listSubtitle: { fontSize: 14, fontWeight: '600', color: '#000000', marginBottom: 4 },
  listDate: { fontSize: 12, color: '#888', marginBottom: 4 },
  listDesc: { fontSize: 14, color: '#555', lineHeight: 20 },
  listActions: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  supportButton: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 16, height: 52, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32, marginHorizontal: 16 },
  supportButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFE5EC', borderRadius: 16, height: 52, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, marginHorizontal: 16 },
  logoutButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
