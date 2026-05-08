import React, { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  language: string;
}

export default function Editor({ content, onChange }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle key events for Tab and Auto-indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

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
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] dark:bg-[#050505]">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="flex-1 w-full h-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm outline-none resize-none no-scrollbar leading-relaxed"
        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
      />
    </div>
  );
}
