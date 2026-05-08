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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
  const { userId, user, logout } = useUser();
  const utils = trpc.useUtils();

  // Profile data states
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // 1. Fetch user profile from database
  const { data: profile, isLoading } = trpc.profile.getByUserId.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  // Sync state with fetched database profile
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setLocation(profile.location || '');
    }
  }, [profile]);

  // 2. Update profile mutation
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => {
      Alert.alert('Hata', err.message || 'Profil güncellenirken bir hata oluştu.');
    },
  });

  // 3. Add skill mutation
  const addSkillMutation = trpc.profile.addSkill.useMutation({
    onSuccess: () => {
      setNewSkill('');
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => {
      Alert.alert('Hata', 'Yetenek eklenemedi.');
    },
  });

  // 4. Remove skill mutation
  const removeSkillMutation = trpc.profile.removeSkill.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => {
      Alert.alert('Hata', 'Yetenek silinemedi.');
    },
  });

  const handleSaveProfile = () => {
    if (!userId) return;
    updateProfileMutation.mutate({
      userId,
      bio,
      location,
    });
  };

  const handleAddSkill = () => {
    if (!newSkill.trim() || !profile?.id) return;
    addSkillMutation.mutate({
      profileId: profile.id,
      skillName: newSkill.trim(),
    });
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!profile?.id) return;
    removeSkillMutation.mutate({
      profileId: profile.id,
      skillId,
    });
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const fallbackAvatar = `https://api.dicebear.com/7.x/notionists/png?seed=${user?.name || 'User'}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Image source={{ uri: user?.image || fallbackAvatar }} style={styles.avatar} />
            <Text style={styles.userName}>{`${user?.name || ''} ${user?.surname || ''}`.trim()}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Bio & Details Form */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Profil Bilgileri</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konum</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Örn: İstanbul, Türkiye"
                  placeholderTextColor="#AAA"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hakkımda</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Kendinizden bahsedin..."
                  placeholderTextColor="#AAA"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Profili Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Skills Management Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Yeteneklerim (Skills)</Text>

            {/* Current Skills list */}
            <View style={styles.skillsContainer}>
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((s: any) => (
                  <View key={s.skillId} style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{s.skill.skillName}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveSkill(s.skillId)}
                      style={styles.skillRemoveButton}
                    >
                      <MaterialCommunityIcons name="close-circle" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySkillsText}>Henüz bir yetenek eklemediniz.</Text>
              )}
            </View>

            {/* Add Skill Field */}
            <View style={styles.addSkillWrapper}>
              <TextInput
                style={styles.skillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Yetenek ekleyin (Örn: React, Node)"
                placeholderTextColor="#AAA"
              />
              <TouchableOpacity
                style={styles.addSkillButton}
                onPress={handleAddSkill}
                disabled={addSkillMutation.isLoading}
              >
                {addSkillMutation.isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#FF6B6B" />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    backgroundColor: '#FAFAFA',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  skillBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  skillRemoveButton: {
    marginLeft: 6,
    padding: 2,
  },
  emptySkillsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  addSkillWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  skillInput: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#333',
  },
  addSkillButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE5EC',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 16,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
});
