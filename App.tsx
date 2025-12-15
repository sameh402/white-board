import React, { useState, useEffect, useCallback } from 'react';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { Toolbar } from './components/Toolbar';
import { PageList } from './components/PageList';
import { useShake } from './hooks/useShake';
import { Page, ToolType, CanvasElement } from './types';
import { X, Smartphone, Eraser, Loader2 } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'expo-whiteboard-data';

const INITIAL_PAGE: Page = {
  id: 'page-1',
  name: 'First Page',
  elements: [],
};

const App: React.FC = () => {
  // State
  const [pages, setPages] = useState<Page[]>([INITIAL_PAGE]);
  const [currentPageId, setCurrentPageId] = useState<string>('page-1');
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isPageListOpen, setIsPageListOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Shake & Clear State
  const [isShakeClearing, setIsShakeClearing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Derived State
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const currentPage = pages[currentPageIndex] || pages[0];

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPages(parsed);
          setCurrentPageId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load saved notebook");
      }
    }
  }, []);

  const saveNotebook = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    console.log("Notebook saved");
  }, [pages]);

  useEffect(() => {
    const timer = setTimeout(saveNotebook, 5000);
    return () => clearTimeout(timer);
  }, [pages, saveNotebook]);

  // --- PDF Export ---
  const downloadPDF = async () => {
    const element = document.getElementById('whiteboard-capture-area');
    if (!element) return;
    
    setIsExporting(true);
    // Short delay to allow UI to update (show loading)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const widthRatio = pageWidth / canvas.width;
      const heightRatio = pageHeight / canvas.height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const canvasWidth = canvas.width * ratio;
      const canvasHeight = canvas.height * ratio;
      
      const marginX = (pageWidth - canvasWidth) / 2;
      const marginY = (pageHeight - canvasHeight) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, canvasWidth, canvasHeight);
      pdf.save(`${currentPage.name || 'whiteboard'}.pdf`);
      
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Element Management ---
  const handleAddElement = (el: CanvasElement) => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        return { ...p, elements: [...p.elements, el] };
      }
      return p;
    }));
  };

  const handleUpdateNote = (id: string, text: string) => {
    setPages(prev => prev.map(p => {
      if (p.id === currentPageId) {
        const newElements = p.elements.map(el => 
          el.id === id && el.type === 'note' ? { ...el, text } : el
        );
        return { ...p, elements: newElements };
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

  // --- Page Management ---
  const addPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: Page = { id: newId, name: `Page ${pages.length + 1}`, elements: [] };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newId);
  };

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageId(pages[currentPageIndex + 1].id);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageId(pages[currentPageIndex - 1].id);
    }
  };

  const renamePage = (id: string, newName: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
        alert("Cannot delete the last page.");
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

  // --- Shake / Clear Logic ---
  const triggerClearSequence = useCallback(() => {
    if (!isShakeClearing) {
      setIsShakeClearing(true);
      setCountdown(5);
    }
  }, [isShakeClearing]);

  const { requestPermission } = useShake(triggerClearSequence);

  useEffect(() => {
    const handleTouch = () => {
      requestPermission();
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('click', handleTouch);
    };
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('click', handleTouch);
    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('click', handleTouch);
    };
  }, [requestPermission]);

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
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
      
      {/* Main Canvas Area */}
      <div className="flex-1 relative" id="whiteboard-capture-area">
        <WhiteboardCanvas 
          elements={currentPage.elements}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          onAddElement={handleAddElement}
          onUpdateNote={handleUpdateNote}
          onDeleteElement={handleDeleteElement}
        />
      </div>

      {/* Floating Toolbar */}
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

      {/* Page List Modal */}
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

      {/* Loading Overlay for Export */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                <p className="font-semibold text-gray-700">Generating PDF...</p>
            </div>
        </div>
      )}

      {/* Shake/Clear Confirmation Overlay */}
      {isShakeClearing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
          <div className="mb-8 p-6 bg-white/10 rounded-full">
            <Eraser size={64} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Clearing Page...</h2>
          <p className="text-white/60 mb-4">Shake detected or Eraser held</p>
          <div className="text-9xl font-black text-red-500 mb-8 font-mono tabular-nums">
            {countdown}
          </div>
          <button 
            onClick={() => setIsShakeClearing(false)}
            className="px-8 py-3 bg-white text-black text-lg font-bold rounded-full hover:bg-gray-200 hover:scale-105 transition-all flex items-center gap-2"
          >
            <X size={24} />
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
};

export default App;