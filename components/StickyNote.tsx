import React, { useRef, useEffect } from 'react';
import { NoteElement } from '../types';
import { Trash2 } from 'lucide-react';

interface StickyNoteProps {
  note: NoteElement;
  isSelected: boolean;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus if just created (empty text)
  useEffect(() => {
    if (note.text === '' && textAreaRef.current && isSelected) {
      textAreaRef.current.focus();
    }
  }, [note.id, isSelected]);

  return (
    <div
      className={`absolute shadow-lg flex flex-col transition-transform duration-200 ${
        isSelected ? 'z-30 scale-105 ring-2 ring-blue-500' : 'z-10'
      }`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
        transform: 'translate(-50%, -50%)', // Center the note on the click point
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(note.id);
      }}
    >
      <div className="flex justify-end p-1 bg-black/5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-gray-600 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        ref={textAreaRef}
        value={note.text}
        onChange={(e) => onUpdate(note.id, e.target.value)}
        className="w-full h-full p-2 bg-transparent resize-none border-none outline-none font-handwriting text-gray-800"
        placeholder="Type here..."
        style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
      />
    </div>
  );
};