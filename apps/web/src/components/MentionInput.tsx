import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function MentionInput({ value, onChange, placeholder, className, autoFocus, onKeyDown }: MentionInputProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const { data: searchResults, isLoading } = trpc.user.search.useQuery(
    { query: mentionQuery || '' },
    { enabled: mentionQuery !== null && mentionQuery.trim().length > 0 }
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);
    
    const selectionEnd = e.target.selectionEnd;
    const textBeforeCursor = text.slice(0, selectionEnd || 0);
    
    // Match @ followed by word characters (including Turkish chars) up to the cursor
    const match = textBeforeCursor.match(/@([a-zA-ZğüşıöçĞÜŞİÖÇ ]*)$/);
    
    if (match) {
      setMentionQuery(match[1]);
      setCursorPos((selectionEnd || 0) - match[1].length - 1);
      
      if (inputRef.current) {
        setMenuPosition({
          top: inputRef.current.offsetHeight + 5,
          left: 10
        });
      }
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (user: any) => {
    if (cursorPos === null || mentionQuery === null) return;
    
    const textBeforeMention = value.slice(0, cursorPos);
    const textAfterMention = value.slice(cursorPos + mentionQuery.length + 1);
    
    const fullName = `${user.name} ${user.surname || ''}`.trim();
    const newText = `${textBeforeMention}@${fullName} ${textAfterMention}`;
    
    onChange(newText);
    setMentionQuery(null);
    setCursorPos(null);
    
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPos = textBeforeMention.length + fullName.length + 2;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  return (
    <div className="relative flex-1 flex">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />
      
      {mentionQuery !== null && (
        <div 
          className="absolute z-50 bg-card border border-border shadow-xl rounded-xl w-64 max-h-60 overflow-y-auto overflow-x-hidden bottom-full mb-2"
          style={{ left: `${menuPosition.left}px` }}
        >
          {isLoading && mentionQuery.trim().length > 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Aranıyor...</div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="flex flex-col py-1">
              {searchResults.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectMention(user)}
                  className="flex items-center gap-3 p-2 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary shrink-0 overflow-hidden border border-border/40">
                    <img 
                      src={(user?.image || ((user as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                      alt={user.name || ''} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate text-foreground">
                      {user.name} {user.surname}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          ) : mentionQuery.trim().length > 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Sonuç bulunamadı</div>
          ) : (
             <div className="p-3 text-sm text-muted-foreground text-center">Etiketlemek için isim yazın</div>
          )}
        </div>
      )}
    </div>
  );
}
