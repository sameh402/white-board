import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { ToolType, Page } from '../types';
import { Pen, Square, Circle, Minus, StickyNote, Eraser, Plus, ChevronLeft, ChevronRight, Save, Download } from 'lucide-react-native';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  onAddPage: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSave: () => void;
  onDownloadPDF: () => void;
  onClearPage: () => void;
  currentPageIndex: number;
  activePageId: string;
  pages: Page[];
  onTogglePageList: () => void;
}

const COLORS = ['#000000', '#dc2626', '#16a34a', '#2563eb', '#9333ea'];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  currentColor,
  setColor,
  onAddPage,
  onNextPage,
  onPrevPage,
  currentPageIndex,
  onSave,
  onDownloadPDF,
  onClearPage,
  pages,
  onTogglePageList
}) => {
  return (
    <>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topGroup}>
           <TouchableOpacity onPress={onSave} style={styles.iconBtn}>
             <Save size={24} color="#374151" />
           </TouchableOpacity>
           <TouchableOpacity onPress={onDownloadPDF} style={styles.iconBtn}>
             <Download size={24} color="#374151" />
           </TouchableOpacity>
        </View>

        <View style={styles.pageControls}>
          <TouchableOpacity onPress={onPrevPage} disabled={currentPageIndex === 0} style={[styles.navBtn, currentPageIndex === 0 && styles.disabled]}>
            <ChevronLeft size={20} color="#4b5563" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onTogglePageList} style={styles.pageInfo}>
             <Text style={styles.pageTitle} numberOfLines={1}>
               {pages[currentPageIndex]?.name || `Page ${currentPageIndex + 1}`}
             </Text>
             <Text style={styles.pageCount}>
                {currentPageIndex + 1}/{pages.length}
             </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onNextPage} disabled={currentPageIndex === pages.length - 1} style={[styles.navBtn, currentPageIndex === pages.length - 1 && styles.disabled]}>
            <ChevronRight size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.topGroup}>
            <TouchableOpacity onPress={onAddPage} style={styles.addBtn}>
                <Plus size={24} color="#2563eb" />
            </TouchableOpacity>
        </View> 
      </View>

      {/* Bottom Bar: Tools */}
      <View style={styles.bottomBar}>
        <View style={styles.toolRow}>
          <ToolBtn active={currentTool === 'pen'} onPress={() => setTool('pen')} icon={<Pen size={20} color={currentTool === 'pen' ? '#fff' : '#6b7280'} />} />
          <ToolBtn active={currentTool === 'rect'} onPress={() => setTool('rect')} icon={<Square size={20} color={currentTool === 'rect' ? '#fff' : '#6b7280'} />} />
          <ToolBtn active={currentTool === 'circle'} onPress={() => setTool('circle')} icon={<Circle size={20} color={currentTool === 'circle' ? '#fff' : '#6b7280'} />} />
          <ToolBtn active={currentTool === 'line'} onPress={() => setTool('line')} icon={<Minus size={20} color={currentTool === 'line' ? '#fff' : '#6b7280'} />} />
          <View style={styles.separator} />
          <ToolBtn active={currentTool === 'note'} onPress={() => setTool('note')} icon={<StickyNote size={20} color={currentTool === 'note' ? '#fff' : '#6b7280'} />} />
          <ToolBtn 
            active={currentTool === 'eraser'} 
            onPress={() => setTool('eraser')} 
            onLongPress={() => {
              setTool('eraser');
              onClearPage();
            }}
            icon={<Eraser size={20} color={currentTool === 'eraser' ? '#fff' : '#6b7280'} />} 
          />
        </View>

        {currentTool !== 'eraser' && currentTool !== 'note' && (
          <View style={styles.colorRow}>
             {COLORS.map(c => (
               <TouchableOpacity
                 key={c}
                 onPress={() => setColor(c)}
                 style={[
                    styles.colorDot, 
                    { backgroundColor: c }, 
                    currentColor === c && styles.colorActive
                 ]}
               />
             ))}
          </View>
        )}
      </View>
    </>
  );
};

interface ToolBtnProps {
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  icon: React.ReactNode;
}

const ToolBtn: React.FC<ToolBtnProps> = ({ active, onPress, onLongPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    onLongPress={onLongPress}
    delayLongPress={600}
    style={[styles.toolBtn, active && styles.toolBtnActive]}
  >
    {icon}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        zIndex: 50,
    },
    topGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    addBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
    },
    pageControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        padding: 4,
    },
    navBtn: {
        padding: 6,
    },
    disabled: {
        opacity: 0.3,
    },
    pageInfo: {
        alignItems: 'center',
        paddingHorizontal: 12,
        maxWidth: 150,
    },
    pageTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    pageCount: {
        fontSize: 10,
        color: '#6b7280',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 30,
        left: '10%',
        right: '10%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    toolRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    separator: {
        width: 1,
        height: 24,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 4,
    },
    toolBtn: {
        padding: 10,
        borderRadius: 12,
    },
    toolBtnActive: {
        backgroundColor: '#000',
        transform: [{ scale: 1.1 }],
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorActive: {
        borderWidth: 2,
        borderColor: '#9ca3af',
        transform: [{ scale: 1.2 }],
    },
});