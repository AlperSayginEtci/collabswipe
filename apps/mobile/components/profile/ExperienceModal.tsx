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
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface ExperienceData {
  expId?: string;
  title: string;
  corp: string;
  type: 'WORK' | 'INTERNSHIP';
  locType: 'REMOTE' | 'ONSITE' | 'HYBRID';
  startDate: string;
  endDate?: string;
  desc?: string;
}

interface ExperienceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ExperienceData) => void;
  initialData?: ExperienceData | null;
}

export default function ExperienceModal({ visible, onClose, onSave, initialData }: ExperienceModalProps) {
  const [title, setTitle] = useState('');
  const [corp, setCorp] = useState('');
  const [type, setType] = useState<'WORK' | 'INTERNSHIP'>('WORK');
  const [locType, setLocType] = useState<'REMOTE' | 'ONSITE' | 'HYBRID'>('ONSITE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCorp(initialData.corp);
      setType(initialData.type);
      setLocType(initialData.locType);
      setStartDate(initialData.startDate.split('T')[0]);
      setEndDate(initialData.endDate ? initialData.endDate.split('T')[0] : '');
      setDesc(initialData.desc || '');
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setCorp('');
    setType('WORK');
    setLocType('ONSITE');
    setStartDate('');
    setEndDate('');
    setDesc('');
  };

  const handleSave = () => {
    if (!title || !corp || !startDate) {
      Alert.alert('Hata', 'Lütfen Pozisyon, Şirket ve Başlangıç Tarihi alanlarını doldurun.');
      return;
    }
    onSave({
      expId: initialData?.expId,
      title,
      corp,
      type,
      locType,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      desc
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{initialData ? 'Deneyimi Düzenle' : 'Yeni Deneyim Ekle'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pozisyon / Unvan *</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Örn: Frontend Developer" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şirket *</Text>
              <TextInput style={styles.input} value={corp} onChangeText={setCorp} placeholder="Örn: Google" />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Tür</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={[styles.typeBtn, type === 'WORK' && styles.typeBtnActive]} onPress={() => setType('WORK')}>
                    <Text style={[styles.typeBtnText, type === 'WORK' && styles.typeBtnTextActive]}>İş</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, type === 'INTERNSHIP' && styles.typeBtnActive]} onPress={() => setType('INTERNSHIP')}>
                    <Text style={[styles.typeBtnText, type === 'INTERNSHIP' && styles.typeBtnTextActive]}>Staj</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Çalışma Şekli</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={[styles.typeBtn, locType === 'REMOTE' && styles.typeBtnActive]} onPress={() => setLocType('REMOTE')}>
                    <Text style={[styles.typeBtnText, locType === 'REMOTE' && styles.typeBtnTextActive]}>Uzaktan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, locType === 'ONSITE' && styles.typeBtnActive]} onPress={() => setLocType('ONSITE')}>
                    <Text style={[styles.typeBtnText, locType === 'ONSITE' && styles.typeBtnTextActive]}>Ofis</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Başlangıç (YYYY-AA-GG) *</Text>
                <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2023-01-15" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Bitiş (Devam ediyorsa boş)</Text>
                <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2024-05-20" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput style={[styles.input, styles.textArea]} value={desc} onChangeText={setDesc} placeholder="Görevlerinizi ve başarılarınızı anlatın..." multiline numberOfLines={4} />
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    height: 48,
  },
  typeBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
  },
  typeBtnTextActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  saveBtn: {
    backgroundColor: '#4ECDC4',
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
