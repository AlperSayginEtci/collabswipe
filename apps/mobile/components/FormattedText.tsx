import React from 'react';
import { Text } from 'react-native';

export function FormattedText({ text, style, mentionStyle }: { text: string; style?: any; mentionStyle?: any }) {
  if (!text) return null;
  
  const words = text.split(/(\s+)/);
  
  return (
    <Text style={style}>
      {words.map((word, index) => {
        if (word.startsWith('@') && word.length > 1) {
          return (
            <Text key={index} style={[mentionStyle, { color: '#007AFF', fontWeight: 'bold' }]}>
              {word}
            </Text>
          );
        }
        return <Text key={index}>{word}</Text>;
      })}
    </Text>
  );
}
