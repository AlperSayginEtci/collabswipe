import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { trpc } from '../lib/trpc';
import { useUser } from '../context/UserContext';

type TicketStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

export default function SupportScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const utils = trpc.useUtils();

  // Create Ticket Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Diğer');
  const [message, setMessage] = useState('');

  // Ticket Details states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Queries & Mutations
  const { data: tickets, isLoading: isTicketsLoading } = trpc.ticket.getMyTickets.useQuery(
    undefined,
    { enabled: !!userId }
  );

  const { data: activeTicket, isLoading: isActiveTicketLoading } = trpc.ticket.getTicketById.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId }
  );

  const createTicket = trpc.ticket.createTicket.useMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      utils.ticket.getMyTickets.invalidate();
    }
  });

  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setReplyMessage('');
      utils.ticket.getTicketById.invalidate({ ticketId: selectedTicketId! });
      utils.ticket.getMyTickets.invalidate();
    }
  });

  const handleCreateTicket = () => {
    if (!subject.trim() || !message.trim()) return;
    createTicket.mutate({
      subject: subject.trim(),
      category,
      message: message.trim(),
    });
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicketId) return;
    addMessage.mutate({
      ticketId: selectedTicketId,
      content: replyMessage.trim()
    });
  };

  const renderTicketCard = ({ item }: { item: any }) => {
    const isClosed = item.status === 'CLOSED';
    const isResolved = item.status === 'RESOLVED';
    
    let statusText = 'Açık';
    let statusColor = '#F59E0B'; // Orange
    let statusBg = '#FEF3C7';

    if (isClosed) {
      statusText = 'Kapalı';
      statusColor = '#6B7280'; // Gray
      statusBg = '#F3F4F6';
    } else if (isResolved) {
      statusText = 'Çözüldü';
      statusColor = '#10B981'; // Green
      statusBg = '#D1FAE5';
    }

    return (
      <TouchableOpacity 
        style={styles.ticketCard} 
        onPress={() => setSelectedTicketId(item.id)}
      >
        <View style={styles.ticketHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.ticketDate}>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
        </View>
        <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.ticketCategory}><MaterialCommunityIcons name="tag-outline" size={13} color="#666" /> {item.category}</Text>
      </TouchableOpacity>
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Teknik Hata (Bug)': return '#EF4444';
      case 'Hesap veya Profil': return '#3B82F6';
      case 'Öneri / Geri Bildirim': return '#8B5CF6';
      default: return '#10B981';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {selectedTicketId ? (
          <TouchableOpacity onPress={() => setSelectedTicketId(null)} style={styles.headerBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1A1A1A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.headerBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {selectedTicketId ? 'Talep Detayı' : 'Destek Merkezi'}
        </Text>
        {!selectedTicketId ? (
          <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.headerBtn}>
            <MaterialCommunityIcons name="plus" size={26} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {/* Main Content Area */}
      {selectedTicketId ? (
        // Ticket Chat View
        isActiveTicketLoading || !activeTicket ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.ticketInfoPanel}>
              <Text style={styles.activeSubject}>{activeTicket.subject}</Text>
              <Text style={[styles.activeCategory, { color: getCategoryColor(activeTicket.category) }]}>
                {activeTicket.category}
              </Text>
            </View>
            
            <ScrollView 
              style={styles.chatScroll} 
              contentContainerStyle={{ padding: 16 }}
              ref={(ref) => {
                // Auto scroll to bottom
                setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
              }}
            >
              {activeTicket.messages.map((msg: any) => {
                const isMe = msg.senderId === userId;
                return (
                  <View 
                    key={msg.id} 
                    style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
                  >
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                      {msg.isAdmin && (
                        <Text style={styles.adminTag}>
                          <MaterialCommunityIcons name="shield-check" size={12} color="#4F46E5" /> Destek Ekibi
                        </Text>
                      )}
                      <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                        {msg.content}
                      </Text>
                      <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {activeTicket.status !== 'CLOSED' ? (
              <View style={styles.composer}>
                <TextInput 
                  value={replyMessage}
                  onChangeText={setReplyMessage}
                  placeholder="Bir cevap yazın..."
                  style={styles.composerInput}
                  multiline
                />
                <TouchableOpacity 
                  onPress={handleSendReply}
                  disabled={!replyMessage.trim() || addMessage.isLoading}
                  style={[styles.sendBtn, !replyMessage.trim() && { opacity: 0.5 }]}
                >
                  {addMessage.isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.closedPanel}>
                <Text style={styles.closedText}>Bu destek talebi kapatılmıştır.</Text>
              </View>
            )}
          </KeyboardAvoidingView>
        )
      ) : (
        // Ticket List View
        isTicketsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : tickets?.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons name="lifebuoy" size={64} color="#CCC" />
            <Text style={styles.noTicketsTitle}>Destek Talebiniz Yok</Text>
            <Text style={styles.noTicketsDesc}>
              Yaşadığınız problemler hakkında yeni bir talep oluşturabilirsiniz.
            </Text>
            <TouchableOpacity 
              style={styles.createBtnBig} 
              onPress={() => setIsModalOpen(true)}
            >
              <Text style={styles.createBtnBigText}>Yeni Talep Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={renderTicketCard}
            contentContainerStyle={{ padding: 16 }}
          />
        )
      )}

      {/* Create Ticket Modal */}
      <Modal visible={isModalOpen} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Destek Talebi</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <MaterialCommunityIcons name="close" size={26} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.formLabel}>Konu</Text>
            <TextInput 
              style={styles.formInput}
              placeholder="Sorunu kısaca özetleyin"
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.formLabel}>Kategori</Text>
            <View style={styles.categoryRow}>
              {['Teknik Hata (Bug)', 'Hesap veya Profil', 'Öneri / Geri Bildirim', 'Diğer'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryBtnText, category === cat && styles.categoryBtnTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Mesajınız</Text>
            <TextInput 
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Sorunu detaylıca açıklayın..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, (!subject.trim() || !message.trim()) && { opacity: 0.5 }]}
              onPress={handleCreateTicket}
              disabled={!subject.trim() || !message.trim() || createTicket.isLoading}
            >
              {createTicket.isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Talebi Gönder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EFEFEF' 
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noTicketsTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 16 },
  noTicketsDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 30, lineHeight: 20 },
  createBtnBig: { backgroundColor: '#000', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 24 },
  createBtnBigText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  
  ticketCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 20, padding: 16, marginBottom: 12 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  ticketDate: { fontSize: 12, color: '#888' },
  ticketSubject: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  ticketCategory: { fontSize: 12, color: '#666' },

  ticketInfoPanel: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  activeSubject: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  activeCategory: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  
  chatScroll: { flex: 1, backgroundColor: '#FAFAFA' },
  msgRow: { flexDirection: 'row', marginBottom: 12, width: '100%' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: '#000', borderBottomRightRadius: 0 },
  bubbleOther: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EFEFEF', borderBottomLeftRadius: 0 },
  adminTag: { fontSize: 10, fontWeight: '800', color: '#4F46E5', marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: '#FFF' },
  msgTextOther: { color: '#1A1A1A' },
  msgTime: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)' },
  msgTimeOther: { color: '#888' },

  composer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EFEFEF', alignItems: 'center' },
  composerInput: { flex: 1, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 14, color: '#333' },
  sendBtn: { backgroundColor: '#000', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  closedPanel: { padding: 16, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#EFEFEF', alignItems: 'center' },
  closedText: { fontSize: 13, color: '#666', fontWeight: '600' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  formInput: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: '#333' },
  formTextArea: { height: 120, paddingTop: 12, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  categoryBtnActive: { backgroundColor: '#000' },
  categoryBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },
  categoryBtnTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: '#000', borderRadius: 16, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
