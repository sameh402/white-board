import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NoteElement } from '../types';
import { Trash2 } from 'lucide-react-native';

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
  return (
    <View
      style={[
        styles.container,
        {
          left: note.x - note.width / 2, // Center positioning logic
          top: note.y - note.height / 2,
          width: note.width,
          height: note.height,
          backgroundColor: note.color,
          zIndex: isSelected ? 30 : 10,
          borderColor: isSelected ? '#3b82f6' : 'transparent',
          borderWidth: isSelected ? 2 : 0,
        },
      ]}
      onTouchEnd={(e) => {
          e.stopPropagation();
          onSelect(note.id);
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onDelete(note.id)}
          style={styles.deleteBtn}
        >
          <Trash2 size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>
      <TextInput
        value={note.text}
        onChangeText={(text) => onUpdate(note.id, text)}
        multiline
        style={styles.input}
        placeholder="Type here..."
        placeholderTextColor="#6b7280"
        onFocus={() => onSelect(note.id)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'flex-end',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  deleteBtn: {
    padding: 2,
  },
  input: {
    flex: 1,
    padding: 8,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1f2937',
  },
});