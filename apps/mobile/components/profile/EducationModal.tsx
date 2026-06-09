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

export interface EducationData {
  eduId?: string;
  instName: string;
  instDegree: string;
  instProgram: string;
  startDate: string;
  endDate?: string;
  instDesc?: string;
}

interface EducationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EducationData) => void;
  initialData?: EducationData | null;
}

export default function EducationModal({ visible, onClose, onSave, initialData }: EducationModalProps) {
  const [instName, setInstName] = useState('');
  const [instDegree, setInstDegree] = useState('');
  const [instProgram, setInstProgram] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instDesc, setInstDesc] = useState('');

  useEffect(() => {
    if (initialData) {
      setInstName(initialData.instName);
      setInstDegree(initialData.instDegree);
      setInstProgram(initialData.instProgram);
      setStartDate(initialData.startDate.split('T')[0]);
      setEndDate(initialData.endDate ? initialData.endDate.split('T')[0] : '');
      setInstDesc(initialData.instDesc || '');
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setInstName('');
    setInstDegree('');
    setInstProgram('');
    setStartDate('');
    setEndDate('');
    setInstDesc('');
  };

  const handleSave = () => {
    if (!instName || !startDate) {
      Alert.alert('Hata', 'Lütfen Okul/Kurum ve Başlangıç Tarihi alanlarını doldurun.');
      return;
    }
    onSave({
      eduId: initialData?.eduId,
      instName,
      instDegree,
      instProgram,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      instDesc
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{initialData ? 'Eğitimi Düzenle' : 'Yeni Eğitim Ekle'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Okul / Kurum *</Text>
              <TextInput style={styles.input} value={instName} onChangeText={setInstName} placeholder="Örn: Boğaziçi Üniversitesi" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Derece</Text>
              <TextInput style={styles.input} value={instDegree} onChangeText={setInstDegree} placeholder="Örn: Lisans" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bölüm / Program</Text>
              <TextInput style={styles.input} value={instProgram} onChangeText={setInstProgram} placeholder="Örn: Bilgisayar Mühendisliği" />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Başlangıç (YYYY-AA-GG) *</Text>
                <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2019-09-15" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Bitiş (Devam ediyorsa boş)</Text>
                <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2023-06-20" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput style={[styles.input, styles.textArea]} value={instDesc} onChangeText={setInstDesc} placeholder="Kulüpler, projeler, başarılar..." multiline numberOfLines={4} />
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
