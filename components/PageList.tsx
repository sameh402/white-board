import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet, FlatList } from 'react-native';
import { Page } from '../types';
import { Plus, X, Edit2, Check, Trash2, FileText } from 'lucide-react-native';

interface PageListProps {
  pages: Page[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onRenamePage: (id: string, name: string) => void;
  onDeletePage: (id: string) => void;
  onClose: () => void;
}

export const PageList: React.FC<PageListProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (page: Page) => {
    setEditingId(page.id);
    setEditName(page.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenamePage(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
               <FileText size={20} color="#2563eb" />
               <Text style={styles.title}>My Notebook</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={pages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: page }) => (
               <TouchableOpacity 
                 style={[
                    styles.pageItem, 
                    activePageId === page.id && styles.activePage
                 ]}
                 onPress={() => {
                   if (editingId !== page.id) {
                     onSelectPage(page.id);
                     onClose();
                   }
                 }}
               >
                 {editingId === page.id ? (
                    <View style={styles.editRow}>
                      <TextInput 
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                        onBlur={saveEdit}
                      />
                      <TouchableOpacity onPress={saveEdit}>
                        <Check size={18} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                 ) : (
                    <>
                      <View style={styles.pageInfo}>
                         <Text style={[styles.pageName, activePageId === page.id && styles.activeText]}>
                            {page.name}
                         </Text>
                         <Text style={styles.pageMeta}>{page.elements.length} items</Text>
                      </View>
                      
                      <View style={styles.actions}>
                         <TouchableOpacity onPress={() => startEdit(page)} style={styles.actionBtn}>
                            <Edit2 size={16} color="#9ca3af" />
                         </TouchableOpacity>
                         {pages.length > 1 && (
                            <TouchableOpacity onPress={() => onDeletePage(page.id)} style={styles.actionBtn}>
                               <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                         )}
                      </View>
                    </>
                 )}
               </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity onPress={onAddPage} style={styles.createBtn}>
               <Plus size={20} color="white" />
               <Text style={styles.createBtnText}>Create New Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  pageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  activePage: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  pageInfo: {
    flex: 1,
  },
  pageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeText: {
    color: '#1d4ed8',
  },
  pageMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  createBtn: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  createBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});