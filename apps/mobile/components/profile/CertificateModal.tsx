import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CertificateData {
  cerId?: string;
  title: string;
  org: string;
  startDate: string;
  endDate?: string;
  competencyId?: string;
  competencyURL?: string;
}

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CertificateData) => void;
  initialData?: CertificateData | null;
}

export default function CertificateModal({ visible, onClose, onSave, initialData }: CertificateModalProps) {
  const [title, setTitle] = useState('');
  const [org, setOrg] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isCurrent, setIsCurrent] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [competencyId, setCompetencyId] = useState('');
  const [competencyURL, setCompetencyURL] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setOrg(initialData.org);
      setStartDate(new Date(initialData.startDate));
      if (initialData.endDate) {
        setEndDate(new Date(initialData.endDate));
        setIsCurrent(false);
      } else {
        setEndDate(new Date());
        setIsCurrent(true);
      }
      setCompetencyId(initialData.competencyId || '');
      setCompetencyURL(initialData.competencyURL || '');
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setOrg('');
    setStartDate(new Date());
    setEndDate(new Date());
    setIsCurrent(true);
    setCompetencyId('');
    setCompetencyURL('');
  };

  const handleSave = () => {
    if (!title || !org || !startDate) {
      Alert.alert('Hata', 'Lütfen Sertifika Adı, Veren Kurum ve Veriliş Tarihi alanlarını doldurun.');
      return;
    }
    
    let urlToSave = competencyURL.trim();
    if (urlToSave && !urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      urlToSave = `https://${urlToSave}`;
    }

    onSave({
      cerId: initialData?.cerId,
      title,
      org,
      startDate: startDate.toISOString(),
      endDate: isCurrent ? undefined : endDate.toISOString(),
      competencyId,
      competencyURL: urlToSave
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{initialData ? 'Sertifikayı Düzenle' : 'Yeni Sertifika Ekle'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sertifika Adı *</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Örn: AWS Certified Developer" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Veren Kurum *</Text>
              <TextInput style={styles.input} value={org} onChangeText={setOrg} placeholder="Örn: Amazon Web Services" />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Veriliş Tarihi *</Text>
                <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowStartPicker(true)}>
                  <Text style={{ color: '#333' }}>{startDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>
              </View>
              {!isCurrent && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Geçerlilik Bitiş</Text>
                  <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowEndPicker(true)}>
                    <Text style={{ color: '#333' }}>{endDate.toLocaleDateString('tr-TR')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#555', fontWeight: '600' }}>Geçerliliği Devam Ediyor</Text>
              <Switch value={isCurrent} onValueChange={setIsCurrent} trackColor={{ true: '#000', false: '#CCC' }} thumbColor="#FFF" />
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yetkinlik / Sertifika Kimliği</Text>
              <TextInput style={styles.input} value={competencyId} onChangeText={setCompetencyId} placeholder="Örn: AWS-123456" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yetkinlik URL'si</Text>
              <TextInput style={styles.input} value={competencyURL} onChangeText={setCompetencyURL} placeholder="Örn: https://aws.amazon.com/verify..." autoCapitalize="none" />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: '#333',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  saveBtn: {
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
