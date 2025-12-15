import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator, Text } from 'react-native';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { Toolbar } from './components/Toolbar';
import { PageList } from './components/PageList';
import { useShake } from './hooks/useShake';
import { Page, ToolType, CanvasElement } from './types';
import { Eraser, Smartphone } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const STORAGE_KEY = 'expo-whiteboard-data';

const INITIAL_PAGE: Page = {
  id: 'page-1',
  name: 'First Page',
  elements: [],
};

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([INITIAL_PAGE]);
  const [currentPageId, setCurrentPageId] = useState<string>('page-1');
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isPageListOpen, setIsPageListOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isShakeClearing, setIsShakeClearing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const currentPage = pages[currentPageIndex] || pages[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPages(parsed);
            setCurrentPageId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load notebook", e);
      }
    };
    loadData();
  }, []);

  const saveNotebook = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      console.error("Failed to save", e);
    }
  }, [pages]);

  useEffect(() => {
    const timer = setTimeout(saveNotebook, 5000);
    return () => clearTimeout(timer);
  }, [pages, saveNotebook]);

  // PDF Export logic for Expo
  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      // Construct HTML SVG
      let svgContent = '';
      currentPage.elements.forEach(el => {
        if (el.type === 'pen') {
           const d = el.points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
           svgContent += `<path d="${d}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
        } else if (el.type === 'rect') {
           const x = Math.min(el.startPoint.x, el.endPoint.x);
           const y = Math.min(el.startPoint.y, el.endPoint.y);
           const w = Math.abs(el.startPoint.x - el.endPoint.x);
           const h = Math.abs(el.startPoint.y - el.endPoint.y);
           svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none" />`;
        } else if (el.type === 'circle') {
           const rx = Math.abs(el.startPoint.x - el.endPoint.x) / 2;
           const cx = Math.min(el.startPoint.x, el.endPoint.x) + rx;
           const cy = Math.min(el.startPoint.y, el.endPoint.y) + rx; // Assumed circle
           svgContent += `<circle cx="${cx}" cy="${cy}" r="${rx}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none" />`;
        } else if (el.type === 'line') {
           svgContent += `<line x1="${el.startPoint.x}" y1="${el.startPoint.y}" x2="${el.endPoint.x}" y2="${el.endPoint.y}" stroke="${el.color}" stroke-width="${el.strokeWidth}" stroke-linecap="round" />`;
        } else if (el.type === 'note') {
           // Notes are harder to render in simple SVG print, we'll approximate with a div-like foreignObject or just a yellow rect and text
           svgContent += `
             <rect x="${el.x - el.width/2}" y="${el.y - el.height/2}" width="${el.width}" height="${el.height}" fill="${el.color}" />
             <text x="${el.x - el.width/2 + 10}" y="${el.y - el.height/2 + 20}" font-family="Arial" font-size="12" fill="black">
               ${el.text.substring(0, 50)}...
             </text>
           `;
        }
      });

      const html = `
        <html>
          <body style="margin:0; padding:0;">
            <svg width="100%" height="100%" viewBox="0 0 800 1200" xmlns="http://www.w3.org/2000/svg">
              ${svgContent}
            </svg>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (err) {
      Alert.alert("Error", "Failed to generate PDF");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddElement = (el: CanvasElement) => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) return { ...p, elements: [...p.elements, el] };
      return p;
    }));
  };

  const handleUpdateNote = (id: string, text: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        return { ...p, elements: p.elements.map(el => el.id === id && el.type === 'note' ? { ...el, text } : el) };
      }
      return p;
    }));
  };

  const handleDeleteElement = (id: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        return { ...p, elements: p.elements.filter(el => el.id !== id) };
      }
      return p;
    }));
  };

  const addPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: Page = { id: newId, name: `Page ${pages.length + 1}`, elements: [] };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newId);
  };

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageId(pages[currentPageIndex + 1].id);
  };

  const prevPage = () => {
    if (currentPageIndex > 0) setCurrentPageId(pages[currentPageIndex - 1].id);
  };

  const renamePage = (id: string, newName: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
        Alert.alert("Cannot delete last page");
        return;
    }
    const idx = pages.findIndex(p => p.id === id);
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (currentPageId === id) {
        const newIdx = Math.max(0, idx - 1);
        setCurrentPageId(newPages[newIdx].id);
    }
  };

  const triggerClearSequence = useCallback(() => {
    if (!isShakeClearing) {
      setIsShakeClearing(true);
      setCountdown(5);
    }
  }, [isShakeClearing]);

  useShake(triggerClearSequence);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isShakeClearing && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isShakeClearing && countdown === 0) {
      setPages(prev => prev.map(p => {
        if (p.id === currentPageId) return { ...p, elements: [] };
        return p;
      }));
      setIsShakeClearing(false);
    }
    return () => clearTimeout(timer);
  }, [isShakeClearing, countdown, currentPageId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.canvasContainer}>
        <WhiteboardCanvas 
          elements={currentPage.elements}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          onAddElement={handleAddElement}
          onUpdateNote={handleUpdateNote}
          onDeleteElement={handleDeleteElement}
        />
      </View>

      <Toolbar 
        currentTool={tool}
        setTool={setTool}
        currentColor={color}
        setColor={setColor}
        onAddPage={addPage}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onSave={saveNotebook}
        onDownloadPDF={downloadPDF}
        currentPageIndex={currentPageIndex}
        activePageId={currentPageId}
        pages={pages}
        onTogglePageList={() => setIsPageListOpen(true)}
        onClearPage={triggerClearSequence}
      />

      {isPageListOpen && (
        <PageList 
          pages={pages}
          activePageId={currentPageId}
          onSelectPage={setCurrentPageId}
          onAddPage={addPage}
          onRenamePage={renamePage}
          onDeletePage={deletePage}
          onClose={() => setIsPageListOpen(false)}
        />
      )}

      {isExporting && (
        <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Generating PDF...</Text>
            </View>
        </View>
      )}

      {isShakeClearing && (
        <View style={styles.clearOverlay}>
          <View style={styles.iconContainer}>
            <Smartphone size={64} color="white" />
          </View>
          <Text style={styles.clearTitle}>Clearing Page...</Text>
          <Text style={styles.clearSub}>Shake detected</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <View style={styles.cancelButtonContainer}>
             {/* Native Button wrapper to handle touches */}
             <Text 
                onPress={() => setIsShakeClearing(false)}
                style={styles.cancelButton}
             >
                CANCEL
             </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  canvasContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '600',
    color: '#374151',
  },
  clearOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  clearTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  clearSub: {
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  countdown: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 40,
  },
  cancelButtonContainer: {
     backgroundColor: 'white',
     borderRadius: 30,
     overflow: 'hidden',
  },
  cancelButton: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      fontSize: 18,
      fontWeight: 'bold',
      color: 'black',
  }
});

export default App;