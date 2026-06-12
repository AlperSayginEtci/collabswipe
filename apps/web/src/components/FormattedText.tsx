import React from 'react';

export function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  
  // Split the text by mentions (words starting with @ followed by word characters/spaces, but a simple way is matching @Word)
  // Let's just match @[A-Za-zğüşıöçĞÜŞİÖÇ]+( [A-Za-zğüşıöçĞÜŞİÖÇ]+)? for name and surname.
  // Actually, since we don't know the exact name boundaries without markdown, a simple @Word is safer, or we just rely on splitting by space and checking if it starts with @
  
  const words = text.split(/(\s+)/);
  
  return (
    <>
      {words.map((word, index) => {
        if (word.startsWith('@') && word.length > 1) {
          return <span key={index} className="text-primary font-semibold hover:underline cursor-pointer">{word}</span>;
        }
        return <span key={index}>{word}</span>;
      })}
    </>
  );
}
