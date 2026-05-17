import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../lib/trpc';
import { useUser } from '../context/UserContext';
import { Redirect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { userId, isLoading, login } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (userId) {
    return <Redirect href="/(tabs)" />;
  }

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState('user'); // 'user' | 'employer'

  const loginMutation = trpc.user.login.useMutation({
    onSuccess: (data) => {
      login(data as any);
    },
    onError: (err) => {
      Alert.alert('Giriş Hatası', err.message || 'Bir hata oluştu.');
    },
  });

  const registerMutation = trpc.user.register.useMutation({
    onSuccess: (data) => {
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.', [
        {
          text: 'Tamam',
          onPress: () => {
            setIsLoginTab(true);
            setEmail(data.email);
          },
        },
      ]);
    },
    onError: (err) => {
      Alert.alert('Kayıt Hatası', err.message || 'Bir hata oluştu.');
    },
  });

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Geçersiz Bilgi', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Geçersiz Bilgi', 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (isLoginTab) {
      loginMutation.mutate({
        email: email.trim().toLowerCase(),
        password: password,
      });
    } else {
      if (!name.trim() || !surname.trim()) {
        Alert.alert('Eksik Bilgi', 'Lütfen adınızı ve soyadınızı girin.');
        return;
      }
      registerMutation.mutate({
        email: email.trim().toLowerCase(),
        password: password,
        name: name.trim(),
        surname: surname.trim(),
        role,
      });
    }
  };

  const isSubmitting = loginMutation.isLoading || registerMutation.isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo & Brand */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="cards-heart" size={42} color="#FFF" />
            </View>
            <Text style={styles.brandName}>CollabSwipe</Text>
            <Text style={styles.brandSubtitle}>Yazılımcı & Ortak Bulma Platformu</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, isLoginTab && styles.activeTabButton]}
              onPress={() => setIsLoginTab(true)}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, isLoginTab && styles.activeTabText]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, !isLoginTab && styles.activeTabButton]}
              onPress={() => setIsLoginTab(false)}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, !isLoginTab && styles.activeTabText]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            {!isLoginTab && (
              <>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Adınız"
                    placeholderTextColor="#AAA"
                    value={name}
                    onChangeText={setName}
                    editable={!isSubmitting}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Soyadınız"
                    placeholderTextColor="#AAA"
                    value={surname}
                    onChangeText={setSurname}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Role Selector */}
                <Text style={styles.roleLabel}>Hesap Tipi</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'user' && styles.activeRoleButton]}
                    onPress={() => setRole('user')}
                    disabled={isSubmitting}
                  >
                    <MaterialCommunityIcons name="xml" size={20} color={role === 'user' ? '#FFF' : '#FF6B6B'} />
                    <Text style={[styles.roleButtonText, role === 'user' && styles.activeRoleButtonText]}>Yazılımcı</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, role === 'employer' && styles.activeRoleButton]}
                    onPress={() => setRole('employer')}
                    disabled={isSubmitting}
                  >
                    <MaterialCommunityIcons name="briefcase-outline" size={20} color={role === 'employer' ? '#FFF' : '#FF6B6B'} />
                    <Text style={[styles.roleButtonText, role === 'employer' && styles.activeRoleButtonText]}>İlan Veren</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-posta Adresiniz"
                placeholderTextColor="#AAA"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor="#AAA"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLoginTab ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    marginTop: 16,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    marginLeft: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 16,
    height: 48,
  },
  activeRoleButton: {
    backgroundColor: '#FF6B6B',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  activeRoleButtonText: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
