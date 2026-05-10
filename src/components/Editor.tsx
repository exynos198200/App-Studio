import React, { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  language: string;
}

export default function Editor({ content, onChange }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Log key presses for debugging
    if (e.key === 'Tab' || e.key === 'Enter') {
      console.log('Key down:', e.key);
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      // set textarea value to: text before caret + tab + text after caret
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);

      // put caret at right position again (using setTimeout to ensure state update)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

    // Auto-indent: when Enter is pressed, match previous line's indent
    if (e.key === 'Enter') {
      const start = e.currentTarget.selectionStart;
      const textBefore = content.substring(0, start);
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^\s*/);
      const indent = match ? match[0] : '';
      
      if (indent) {
        e.preventDefault();
        const newValue = content.substring(0, start) + '\n' + indent + content.substring(start);
        onChange(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
          }
        }, 0);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          console.log('Editor onChange: value length', e.target.value.length);
          onChange(e.target.value);
        }}
        onPaste={(e) => {
          console.log('Editor onPaste triggered');
          // Standard behavior should work with controlled component, 
          // but we log it to confirm the event happens.
        }}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 w-full h-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm outline-none resize-none no-scrollbar leading-relaxed"
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
      />
    </div>
  );
}
