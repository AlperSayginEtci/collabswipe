import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, FlatList, StyleSheet, TextInputProps } from 'react-native';
import { trpc } from '../lib/trpc';

interface MentionTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: any;
}

export function MentionTextInput({ value, onChangeText, containerStyle, ...props }: MentionTextInputProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { data: searchResults, isLoading } = trpc.user.search.useQuery(
    { query: mentionQuery || '' },
    { enabled: mentionQuery !== null && mentionQuery.trim().length > 0 }
  );

  const handleSelectionChange = (e: any) => {
    const { selection } = e.nativeEvent;
    const currentCursorPos = selection.end;
    
    if (value && currentCursorPos !== null) {
      const textBeforeCursor = value.substring(0, currentCursorPos);
      const match = textBeforeCursor.match(/@([a-zA-ZğüşıöçĞÜŞİÖÇ ]*)$/);
      
      if (match) {
        setMentionQuery(match[1]);
        setCursorPos(currentCursorPos - match[1].length - 1);
      } else {
        setMentionQuery(null);
      }
    }
    
    if (props.onSelectionChange) {
      props.onSelectionChange(e);
    }
  };

  const handleSelectMention = (user: any) => {
    if (cursorPos === null || mentionQuery === null) return;
    
    const textBeforeMention = value.substring(0, cursorPos);
    const textAfterMention = value.substring(cursorPos + mentionQuery.length + 1);
    
    const fullName = `${user.name} ${user.surname || ''}`.trim();
    const newText = `${textBeforeMention}@${fullName} ${textAfterMention}`;
    
    onChangeText(newText);
    setMentionQuery(null);
    setCursorPos(null);
    
    // Focus and maybe set selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        {...props}
      />
      
      {mentionQuery !== null && (
        <View style={styles.dropdownContainer}>
          {isLoading && mentionQuery.trim().length > 0 ? (
            <Text style={styles.centerText}>Aranıyor...</Text>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item: any) => item.id}
              style={{ maxHeight: 150 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.mentionItem}
                  onPress={() => handleSelectMention(item)}
                >
                  <Image 
                    source={{ uri: item.image || `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024` }} 
                    style={styles.mentionAvatar}
                  />
                  <Text style={styles.mentionName} numberOfLines={1}>
                    {item.name} {item.surname}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : mentionQuery.trim().length > 0 ? (
            <Text style={styles.centerText}>Sonuç bulunamadı</Text>
          ) : (
            <Text style={styles.centerText}>Etiketlemek için isim yazın</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
    marginTop: 5,
    overflow: 'hidden'
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  mentionAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eee',
    marginRight: 10
  },
  mentionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  centerText: {
    padding: 15,
    textAlign: 'center',
    color: '#888',
    fontSize: 14
  }
});
