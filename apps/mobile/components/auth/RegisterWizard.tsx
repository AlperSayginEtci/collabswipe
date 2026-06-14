import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { trpc, getBaseUrl } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';

interface RegisterWizardProps {
  onCancel: () => void;
}

export function RegisterWizard({ onCancel }: RegisterWizardProps) {
  const { login } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0: Account Type
  const [isCompany, setIsCompany] = useState(false);

  // Core User Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [sector, setSector] = useState('');

  // Profile Details
  const [image, setImage] = useState(''); // Base64
  const [bio, setBio] = useState('');
  
  // Arrays
  const [skills, setSkills] = useState<string[]>([]);
  const [workingFields, setWorkingFields] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Temp inputs
  const [tempSkill, setTempSkill] = useState('');
  const [tempField, setTempField] = useState('');
  
  // Temporary exp/edu states for mobile form
  const [expTitle, setExpTitle] = useState('');
  const [expCorp, setExpCorp] = useState('');
  const [expStart, setExpStart] = useState<Date>(new Date());
  const [expEnd, setExpEnd] = useState<Date>(new Date());
  const [expIsCurrent, setExpIsCurrent] = useState(true);
  const [showExpStartPicker, setShowExpStartPicker] = useState(false);
  const [showExpEndPicker, setShowExpEndPicker] = useState(false);
  
  const [eduName, setEduName] = useState('');
  const [eduProg, setEduProg] = useState('');
  const [eduStart, setEduStart] = useState<Date>(new Date());
  const [eduEnd, setEduEnd] = useState<Date>(new Date());
  const [eduIsCurrent, setEduIsCurrent] = useState(true);
  const [showEduStartPicker, setShowEduStartPicker] = useState(false);
  const [showEduEndPicker, setShowEduEndPicker] = useState(false);

  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certStart, setCertStart] = useState<Date>(new Date());
  const [certEnd, setCertEnd] = useState<Date>(new Date());
  const [certIsCurrent, setCertIsCurrent] = useState(true);
  const [showCertStartPicker, setShowCertStartPicker] = useState(false);
  const [showCertEndPicker, setShowCertEndPicker] = useState(false);

  const { data: standardSkills } = trpc.profile.getAllSkills.useQuery();
  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();
  const registerMutation = trpc.user.register.useMutation();
  const loginMutation = trpc.user.login.useMutation();

  const handleNext = () => {
    if (step === 1 && (!email || !email.includes('@'))) return Alert.alert('Hata', 'Geçerli bir e-posta girin.');
    if (step === 2 && password.length < 8) return Alert.alert('Hata', 'Şifre en az 8 karakter olmalıdır.');
    if (step === 3 && !isCompany && (!name.trim() || !surname.trim())) return Alert.alert('Hata', 'Ad ve soyad zorunludur.');
    if (step === 3 && isCompany && !name.trim()) return Alert.alert('Hata', 'Şirket adı zorunludur.');
    if (step === 4 && isCompany && !sector.trim()) return Alert.alert('Hata', 'Sektör zorunludur.');

    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 0) onCancel();
    else setStep(s => s - 1);
  };

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      const url = await uploadImage(result.assets[0].uri);
      if (url) {
        setImage(url);
      }
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. TRPC üzerinden Kayıt (Auth)
      const regRes = await registerMutation.mutateAsync({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        surname: isCompany ? '' : surname.trim(),
        role: isCompany ? 'company' : 'user',
        sector: isCompany ? sector.trim() : undefined,
      });

      // 2. Giriş (Oturum açmak için)
      const logRes = await loginMutation.mutateAsync({
        email: email.toLowerCase().trim(),
        password,
      });

      // 3. Profil Detayları (Onboarding)
      await completeOnboarding.mutateAsync({
        userId: regRes.id,
        image: image || undefined,
        bio: bio || undefined,
        skills,
        workingFields,
        experiences,
        educations,
        certificates,
      });

      // Session context update
      if (image && (logRes as any).user) {
        (logRes as any).user.image = image;
      }
      login(logRes as any);
      
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Kayıt olurken bir sorun oluştu.');
      setLoading(false);
    }
  };

  const isIndividual = !isCompany;
  const maxSteps = isIndividual ? 9 : 7;

  const renderStepHeader = (title: string, subtitle: string) => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  const renderButtons = (isOptional = false) => (
    <View style={styles.buttonContainer}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
        {step < maxSteps ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>İleri</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: '#000' }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.nextButtonText}>Tamamla</Text>}
          </TouchableOpacity>
        )}
      </View>
      {isOptional && step < maxSteps && (
        <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Bu adımı atla</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      
      {step === 0 && (
        <>
          {renderStepHeader("Hesap Türü", "Size uygun hesap tipini seçin.")}
          <View style={styles.typeContainer}>
            <TouchableOpacity style={styles.typeCard} onPress={() => { setIsCompany(false); handleNext(); }}>
              <View style={styles.typeIconBg}><MaterialCommunityIcons name="account" size={32} color="#000" /></View>
              <Text style={styles.typeTitle}>Bireysel</Text>
              <Text style={styles.typeDesc}>Öğrenci, Mezun, Profesyonel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.typeCard} onPress={() => { setIsCompany(true); handleNext(); }}>
              <View style={styles.typeIconBg}><MaterialCommunityIcons name="domain" size={32} color="#000" /></View>
              <Text style={styles.typeTitle}>Şirket</Text>
              <Text style={styles.typeDesc}>Kurum, Kuruluş, Topluluk</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.backButton, { marginTop: 24 }]} onPress={onCancel}>
            <Text style={styles.backButtonText}>İptal</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 1 && (
        <>
          {renderStepHeader("E-posta Adresi", "Giriş yaparken bu adresi kullanacaksınız.")}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
          {renderButtons()}
        </>
      )}

      {step === 2 && (
        <>
          {renderStepHeader("Şifre Belirleyin", "Hesabınız için güvenli bir şifre seçin.")}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />
          </View>
          {renderButtons()}
        </>
      )}

      {step === 3 && (
        <>
          {renderStepHeader(isCompany ? "Şirket Adı" : "Ad Soyad", isCompany ? "Kurumunuzun adını girin." : "Profilinizde görünecek adınız.")}
          {isCompany ? (
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="domain" size={20} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Şirket Adı" value={name} onChangeText={setName} autoFocus />
            </View>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Adınız" value={name} onChangeText={setName} autoFocus />
              </View>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Soyadınız" value={surname} onChangeText={setSurname} />
              </View>
            </>
          )}
          {renderButtons()}
        </>
      )}

      {step === 4 && (
        <>
          {isCompany ? (
            <>
              {renderStepHeader("Sektör", "Şirketinizin faaliyet gösterdiği ana sektörü belirtin.")}
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Örn: Yazılım, Finans" value={sector} onChangeText={setSector} autoFocus />
              </View>
              {renderButtons()}
            </>
          ) : (
            <>
              {renderStepHeader("Profil Fotoğrafı", "Profilinizi öne çıkarın.")}
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <MaterialCommunityIcons name="camera-outline" size={40} color="#888" />
                  )}
                </TouchableOpacity>
                <Text style={styles.imageHint}>Fotoğraf seçmek için tıklayın</Text>
              </View>
              {renderButtons(true)}
            </>
          )}
        </>
      )}

      {step === 5 && (
        <>
          {isCompany ? (
            <>
              {renderStepHeader("Şirket Logosu", "Kurumunuzun logosunu ekleyin.")}
              <View style={styles.imagePickerContainer}>
                <TouchableOpacity style={[styles.imagePicker, { borderRadius: 24 }]} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreviewSquare} />
                  ) : (
                    <MaterialCommunityIcons name="domain" size={40} color="#888" />
                  )}
                </TouchableOpacity>
                <Text style={styles.imageHint}>Logo seçmek için tıklayın</Text>
              </View>
              {renderButtons(true)}
            </>
          ) : (
            <>
              {renderStepHeader("Yetenekler", "Hangi alanlarda uzmansınız?")}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput style={[styles.input, { flex: 1, borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 12, height: 48 }]} placeholder="Yeni yetenek..." value={tempSkill} onChangeText={setTempSkill} />
                <TouchableOpacity style={styles.addButton} onPress={() => { if (tempSkill) { setSkills([...skills, tempSkill]); setTempSkill(''); } }}>
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.chipContainer}>
                {skills.map(s => (
                  <TouchableOpacity key={s} style={styles.chip} onPress={() => setSkills(skills.filter(x => x !== s))}>
                    <Text style={styles.chipText}>{s}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#000" />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.subtitleSmall}>Önerilenler</Text>
              <ScrollView style={{ maxHeight: 120 }} horizontal showsHorizontalScrollIndicator={false}>
                {standardSkills?.filter(s => !skills.includes(s.skillName)).map(s => (
                  <TouchableOpacity key={s.skillId} style={styles.suggestedChip} onPress={() => setSkills([...skills, s.skillName])}>
                    <Text style={styles.suggestedChipText}>+ {s.skillName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {renderButtons(true)}
            </>
          )}
        </>
      )}

      {step === 6 && (
        <>
          {isCompany ? (
            <>
              {renderStepHeader("Çalışma Alanları", "Şirketinizin faaliyet alanlarını madde madde ekleyin.")}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput style={[styles.input, { flex: 1, borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 12, height: 48 }]} placeholder="Örn: Yapay Zeka Ar-Ge" value={tempField} onChangeText={setTempField} />
                <TouchableOpacity style={styles.addButton} onPress={() => { if (tempField) { setWorkingFields([...workingFields, tempField]); setTempField(''); } }}>
                  <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 200 }}>
                {workingFields.map((f, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={{ flex: 1 }}>• {f}</Text>
                    <TouchableOpacity onPress={() => setWorkingFields(workingFields.filter((_, idx) => idx !== i))}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              {renderButtons(true)}
            </>
          ) : (
            <>
              {renderStepHeader("Deneyimler", "İş ve staj deneyimlerinizi ekleyin.")}
              <View style={styles.formBox}>
                <TextInput style={styles.boxInput} placeholder="Ünvan (Örn: Yazılım Müh.)" value={expTitle} onChangeText={setExpTitle} />
                <TextInput style={styles.boxInput} placeholder="Şirket Adı" value={expCorp} onChangeText={setExpCorp} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowExpStartPicker(true)}>
                    <Text style={{ color: '#333' }}>Baş: {expStart.toLocaleDateString('tr-TR')}</Text>
                  </TouchableOpacity>
                  {!expIsCurrent && (
                    <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowExpEndPicker(true)}>
                      <Text style={{ color: '#333' }}>Bit: {expEnd.toLocaleDateString('tr-TR')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>Devam Ediyor</Text>
                  <Switch value={expIsCurrent} onValueChange={setExpIsCurrent} trackColor={{ true: '#000', false: '#CCC' }} thumbColor="#FFF" />
                </View>

                {showExpStartPicker && (
                  <DateTimePicker
                    value={expStart}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') setShowExpStartPicker(false);
                      if (date) setExpStart(date);
                    }}
                  />
                )}
                {showExpEndPicker && (
                  <DateTimePicker
                    value={expEnd}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') setShowExpEndPicker(false);
                      if (date) setExpEnd(date);
                    }}
                  />
                )}

                <TouchableOpacity style={styles.boxButton} onPress={() => {
                  if (!expTitle) return;
                  setExperiences([...experiences, { type: "WORK", title: expTitle, corp: expCorp, startDate: expStart, endDate: expIsCurrent ? undefined : expEnd }]);
                  setExpTitle(''); setExpCorp(''); setExpStart(new Date()); setExpEnd(new Date()); setExpIsCurrent(true);
                }}>
                  <Text style={styles.boxButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 150, marginTop: 12 }}>
                {experiences.map((exp, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold' }}>{exp.title}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>{exp.corp} • {new Date(exp.startDate).getFullYear()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setExperiences(experiences.filter((_, idx) => idx !== i))}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              {renderButtons(true)}
            </>
          )}
        </>
      )}

      {step === 7 && (
        <>
          {isCompany ? (
            <>
              {renderStepHeader("Hakkında", "Şirketiniz hakkında kısa bir açıklama girin.")}
              <TextInput style={styles.textArea} placeholder="Misyon ve vizyonumuz..." value={bio} onChangeText={setBio} multiline numberOfLines={5} />
              {renderButtons(true)}
            </>
          ) : (
            <>
              {renderStepHeader("Eğitim", "Öğrenim bilgilerinizi ekleyin.")}
              <View style={styles.formBox}>
                <TextInput style={styles.boxInput} placeholder="Okul Adı" value={eduName} onChangeText={setEduName} />
                <TextInput style={styles.boxInput} placeholder="Bölüm" value={eduProg} onChangeText={setEduProg} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowEduStartPicker(true)}>
                    <Text style={{ color: '#333' }}>Baş: {eduStart.toLocaleDateString('tr-TR')}</Text>
                  </TouchableOpacity>
                  {!eduIsCurrent && (
                    <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowEduEndPicker(true)}>
                      <Text style={{ color: '#333' }}>Bit: {eduEnd.toLocaleDateString('tr-TR')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>Devam Ediyor</Text>
                  <Switch value={eduIsCurrent} onValueChange={setEduIsCurrent} trackColor={{ true: '#000', false: '#CCC' }} thumbColor="#FFF" />
                </View>

                {showEduStartPicker && (
                  <DateTimePicker
                    value={eduStart}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') setShowEduStartPicker(false);
                      if (date) setEduStart(date);
                    }}
                  />
                )}
                {showEduEndPicker && (
                  <DateTimePicker
                    value={eduEnd}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (Platform.OS !== 'ios') setShowEduEndPicker(false);
                      if (date) setEduEnd(date);
                    }}
                  />
                )}

                <TouchableOpacity style={styles.boxButton} onPress={() => {
                  if (!eduName) return;
                  setEducations([...educations, { instName: eduName, instProgram: eduProg, startDate: eduStart, endDate: eduIsCurrent ? undefined : eduEnd }]);
                  setEduName(''); setEduProg(''); setEduStart(new Date()); setEduEnd(new Date()); setEduIsCurrent(true);
                }}>
                  <Text style={styles.boxButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 150, marginTop: 12 }}>
                {educations.map((edu, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold' }}>{edu.instName}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>{edu.instProgram}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEducations(educations.filter((_, idx) => idx !== i))}>
                      <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              {renderButtons(true)}
            </>
          )}
        </>
      )}

      {step === 8 && !isCompany && (
        <>
          {renderStepHeader("Sertifikalar", "Sahip olduğunuz sertifikaları ekleyin.")}
          <View style={styles.formBox}>
            <TextInput style={styles.boxInput} placeholder="Sertifika Adı" value={certTitle} onChangeText={setCertTitle} />
            <TextInput style={styles.boxInput} placeholder="Veren Kurum" value={certOrg} onChangeText={setCertOrg} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowCertStartPicker(true)}>
                <Text style={{ color: '#333' }}>Baş: {certStart.toLocaleDateString('tr-TR')}</Text>
              </TouchableOpacity>
              {!certIsCurrent && (
                <TouchableOpacity style={[styles.boxInput, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowCertEndPicker(true)}>
                  <Text style={{ color: '#333' }}>Bit: {certEnd.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>Geçerliliği Devam Ediyor</Text>
              <Switch value={certIsCurrent} onValueChange={setCertIsCurrent} trackColor={{ true: '#000', false: '#CCC' }} thumbColor="#FFF" />
            </View>

            {showCertStartPicker && (
              <DateTimePicker
                value={certStart}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowCertStartPicker(false);
                  if (date) setCertStart(date);
                }}
              />
            )}
            {showCertEndPicker && (
              <DateTimePicker
                value={certEnd}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowCertEndPicker(false);
                  if (date) setCertEnd(date);
                }}
              />
            )}

            <TouchableOpacity style={styles.boxButton} onPress={() => {
              if (!certTitle) return;
              setCertificates([...certificates, { title: certTitle, org: certOrg, startDate: certStart, endDate: certIsCurrent ? undefined : certEnd }]);
              setCertTitle(''); setCertOrg(''); setCertStart(new Date()); setCertEnd(new Date()); setCertIsCurrent(true);
            }}>
              <Text style={styles.boxButtonText}>Ekle</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 150, marginTop: 12 }}>
            {certificates.map((cert, i) => (
              <View key={i} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{cert.title}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{cert.org}</Text>
                </View>
                <TouchableOpacity onPress={() => setCertificates(certificates.filter((_, idx) => idx !== i))}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {renderButtons(true)}
        </>
      )}

      {step === 9 && !isCompany && (
        <>
          {renderStepHeader("Hakkında", "Kendinizi kısaca tanıtın.")}
          <TextInput style={styles.textArea} placeholder="Ben bir yazılım geliştiricisiyim..." value={bio} onChangeText={setBio} multiline numberOfLines={5} />
          {renderButtons(true)}
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  
  typeContainer: { flexDirection: 'row', gap: 16 },
  typeCard: { flex: 1, padding: 24, borderRadius: 24, borderWidth: 2, borderColor: '#EFEFEF', alignItems: 'center', backgroundColor: '#FFF' },
  typeIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  typeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  typeDesc: { fontSize: 12, color: '#888', textAlign: 'center' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  
  imagePickerContainer: { alignItems: 'center', marginVertical: 24 },
  imagePicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 60 },
  imagePreviewSquare: { width: '100%', height: '100%', borderRadius: 20 },
  imageHint: { marginTop: 12, fontSize: 12, color: '#888' },
  
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  chipText: { fontSize: 14, fontWeight: '600' },
  subtitleSmall: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 },
  suggestedChip: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  suggestedChipText: { fontSize: 13, color: '#444' },

  formBox: { backgroundColor: '#F5F5F5', padding: 16, borderRadius: 16, gap: 12 },
  boxInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  boxButton: { backgroundColor: '#000', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center' },
  boxButtonText: { color: '#FFF', fontWeight: '700' },
  
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', padding: 16, borderRadius: 16, marginBottom: 8 },
  textArea: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 16, padding: 16, fontSize: 16, height: 120, textAlignVertical: 'top' },

  buttonContainer: { marginTop: 32 },
  backButton: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 16, fontWeight: '700', color: '#333' },
  nextButton: { flex: 2, height: 56, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  skipButton: { marginTop: 16, alignItems: 'center' },
  skipButtonText: { fontSize: 14, color: '#888', textDecorationLine: 'underline' },
});
