import React, { useRef } from 'react';
import { ToolType, Page } from '../types';
import { Pen, Square, Circle, Minus, StickyNote, Eraser, Plus, ChevronLeft, ChevronRight, Save, Download } from 'lucide-react';

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
  onClearPage: () => void; // Trigger for shake/clear logic
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
      {/* Top Bar: Pages & Save */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2">
           <button 
             onClick={onSave}
             className="p-2 rounded-full hover:bg-gray-100 text-gray-700 flex items-center gap-2"
             title="Save Notebook"
           >
             <Save size={20} />
           </button>
           <button 
             onClick={onDownloadPDF}
             className="p-2 rounded-full hover:bg-gray-100 text-gray-700 flex items-center gap-2"
             title="Download PDF"
           >
             <Download size={20} />
           </button>
        </div>

        {/* Center: Page Controls / Page Title */}
        <div className="flex items-center bg-gray-100 rounded-full px-1 py-1">
          <button 
            onClick={onPrevPage} 
            disabled={currentPageIndex === 0}
            className="p-1.5 rounded-full disabled:opacity-30 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={onTogglePageList}
            className="flex items-center gap-2 px-3 py-1 hover:bg-white rounded-md mx-1 transition-all"
          >
             <span className="text-sm font-semibold text-gray-800 max-w-[100px] sm:max-w-[200px] truncate">
               {pages[currentPageIndex]?.name || `Page ${currentPageIndex + 1}`}
             </span>
             <span className="text-xs text-gray-500 font-mono bg-gray-200 px-1.5 rounded-sm">
                {currentPageIndex + 1}/{pages.length}
             </span>
          </button>

          <button 
            onClick={onNextPage} 
            disabled={currentPageIndex === pages.length - 1}
            className="p-1.5 rounded-full disabled:opacity-30 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="flex items-center">
            <button onClick={onAddPage} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                <Plus size={22} />
            </button>
        </div> 
      </div>

      {/* Bottom Bar: Tools */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-xl rounded-2xl px-4 py-3 flex flex-col gap-3 z-50 border border-gray-100 max-w-[95vw]">
        
        {/* Tools Row */}
        <div className="flex items-center space-x-4 justify-between">
          <ToolBtn active={currentTool === 'pen'} onClick={() => setTool('pen')} icon={<Pen size={20} />} />
          <ToolBtn active={currentTool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={20} />} />
          <ToolBtn active={currentTool === 'circle'} onClick={() => setTool('circle')} icon={<Circle size={20} />} />
          <ToolBtn active={currentTool === 'line'} onClick={() => setTool('line')} icon={<Minus size={20} />} />
          <div className="w-px h-8 bg-gray-200 mx-1"></div>
          <ToolBtn active={currentTool === 'note'} onClick={() => setTool('note')} icon={<StickyNote size={20} />} />
          
          {/* Eraser with Long Press */}
          <ToolBtn 
            active={currentTool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            onLongPress={() => {
              // Switch to eraser AND trigger clear
              setTool('eraser');
              onClearPage();
            }}
            icon={<Eraser size={20} />} 
          />
        </div>

        {/* Colors Row (Only if not Eraser or Note) */}
        {currentTool !== 'eraser' && currentTool !== 'note' && (
          <div className="flex items-center justify-center space-x-3 pt-1 border-t border-gray-100">
             {COLORS.map(c => (
               <button
                 key={c}
                 onClick={() => setColor(c)}
                 className={`w-6 h-6 rounded-full transition-transform ${currentColor === c ? 'scale-125 ring-2 ring-gray-400' : 'hover:scale-110'}`}
                 style={{ backgroundColor: c }}
               />
             ))}
          </div>
        )}
      </div>
    </>
  );
};

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  icon: React.ReactNode;
}

const ToolBtn: React.FC<ToolBtnProps> = ({ active, onClick, onLongPress, icon }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressed = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPressed.current = false;
    // Start timer for long press
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        isLongPressed.current = true;
        // Provide tactile feedback if available (vibration)
        if (navigator.vibrate) navigator.vibrate(50);
        onLongPress();
      }, 600); // 600ms hold time
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Only trigger click if it wasn't a long press
    if (!isLongPressed.current) {
      onClick();
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      // Disable context menu on mobile to prevent standard long-press menus
      onContextMenu={(e) => e.preventDefault()}
      className={`p-3 rounded-xl transition-all select-none touch-none ${
        active ? 'bg-black text-white shadow-lg scale-110' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {icon}
    </button>
  );
};