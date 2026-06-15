import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useUser } from '../context/UserContext';

export default function PostJobScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FREELANCE' | 'CORPORATE'>('CORPORATE');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();

  const filteredSkills = allSkills?.filter(s => 
    s.skillName.toLowerCase().includes(currentSkill.toLowerCase().trim()) && 
    !skills.includes(s.skillName)
  ).slice(0, 5) || [];

  const createJob = trpc.job.create.useMutation({
    onSuccess: () => {
      Alert.alert('Başarılı', 'İş ilanı başarıyla yayınlandı!');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'İlan yayınlanırken bir hata oluştu.');
    }
  });

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    
    createJob.mutate({
      title,
      description,
      type,
      skills
    });
  };

  const addSkill = (skillToAdd: string) => {
    if (!skills.includes(skillToAdd)) {
      setSkills([...skills, skillToAdd]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Restrict access if not a company
  if (user && user.role !== 'company' && user.email !== 'collabswipe@collabswipe.com') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#FF4B4B" />
        <Text style={styles.errorTitle}>Erişim Engellendi</Text>
        <Text style={styles.errorText}>Sadece şirket hesapları iş ilanı yayınlayabilir.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni İş İlanı</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.heroSection}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="briefcase-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.heroDescription}>Ekibinize katılacak en iyi yetenekleri bulun.</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>İlan Başlığı</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Senior Frontend Developer"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Çalışma Tipi</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'CORPORATE' && styles.typeButtonActive]}
                onPress={() => setType('CORPORATE')}
              >
                <MaterialCommunityIcons 
                  name="domain" 
                  size={24} 
                  color={type === 'CORPORATE' ? '#4F46E5' : '#999'} 
                />
                <Text style={[styles.typeText, type === 'CORPORATE' && styles.typeTextActive]}>
                  Kurumsal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'FREELANCE' && styles.typeButtonActive]}
                onPress={() => setType('FREELANCE')}
              >
                <MaterialCommunityIcons 
                  name="laptop" 
                  size={24} 
                  color={type === 'FREELANCE' ? '#4F46E5' : '#999'} 
                />
                <Text style={[styles.typeText, type === 'FREELANCE' && styles.typeTextActive]}>
                  Freelance
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>İlan Açıklaması ve Kriterler</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Aranan nitelikler, iş tanımı, yan haklar vb. detayları yazın..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Aranan Yetenekler (İsteğe Bağlı)</Text>
            <View style={styles.skillsWrapper}>
              {skills.map((skill, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)} style={styles.skillRemove}>
                    <MaterialCommunityIcons name="close" size={14} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.skillInputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={currentSkill}
                onChangeText={setCurrentSkill}
                placeholder="Örn: React, Node.js"
                placeholderTextColor="#999"
                onSubmitEditing={() => {
                  if (currentSkill.trim()) {
                    const exactMatch = filteredSkills.find(s => s.skillName.toLowerCase() === currentSkill.toLowerCase().trim());
                    addSkill(exactMatch ? exactMatch.skillName : currentSkill.trim());
                  }
                }}
              />
              <TouchableOpacity 
                style={styles.addSkillBtn}
                onPress={() => {
                  if (currentSkill.trim()) {
                    addSkill(currentSkill.trim());
                  }
                }}
              >
                <Text style={styles.addSkillBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>

            {currentSkill.length > 0 && filteredSkills.length > 0 && (
              <View style={styles.skillSuggestions}>
                {filteredSkills.map(s => (
                  <TouchableOpacity 
                    key={s.skillId} 
                    style={styles.suggestionItem}
                    onPress={() => addSkill(s.skillName)}
                  >
                    <Text style={styles.suggestionText}>{s.skillName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitButton, createJob.isPending && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={createJob.isPending}
            >
              {createJob.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>İlanı Yayınla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  scrollContent: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  typeTextActive: {
    color: '#4F46E5',
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillPillText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  skillRemove: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
  skillInputWrapper: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginBottom: 8,
  },
  addSkillBtn: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addSkillBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  skillSuggestions: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
