import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '../../lib/trpc';

export default function JobsScreen() {
  const { data: jobsResponse, isLoading, error } = trpc.job.list.useQuery({});
  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => Alert.alert('Success', 'Successfully applied for the job!'),
    onError: (err) => Alert.alert('Error', 'Failed to apply. Is the backend running?')
  });

  const translateType = (type: string) => type === 'FREELANCE' ? 'Freelance' : 'Corporate';

  const renderJobCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="briefcase-outline" size={24} color="#666" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.company}>{item.publisher?.name || 'Company'} {item.publisher?.surname || ''}</Text>
        </View>
      </View>
      
      <View style={styles.tagsContainer}>
        <View style={styles.tag}><Text style={styles.tagText}>Remote</Text></View>
        <View style={[styles.tag, styles.typeTag]}>
          <Text style={styles.typeText}>{translateType(item.type)}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.applyButton, applyJob.isLoading && styles.applyButtonDisabled]} 
        onPress={() => applyJob.mutate({ jobId: item.id, applicantId: 'mock-mobile-user' })}
        disabled={applyJob.isLoading}
      >
        <Text style={styles.applyButtonText}>
          {applyJob.isLoading ? 'Applying...' : 'Apply Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Board</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Could not load jobs.</Text>
        </View>
      ) : (
        <FlatList
          data={jobsResponse?.items || []}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No jobs found right now.</Text>
          }
        />
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
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTag: {
    backgroundColor: '#E0F7FA',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeText: {
    fontSize: 12,
    color: '#00838F',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },
});
