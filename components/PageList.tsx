import React, { useState } from 'react';
import { Page } from '../types';
import { Plus, X, Edit2, Check, Trash2, FileText } from 'lucide-react';

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
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">My Notebook</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {pages.map(page => (
            <div 
              key={page.id} 
              className={`p-3 rounded-xl border flex items-center justify-between group transition-all cursor-pointer ${
                activePageId === page.id 
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                if (editingId !== page.id) {
                  onSelectPage(page.id);
                  onClose();
                }
              }}
            >
              {editingId === page.id ? (
                <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    className="flex-1 p-2 border border-blue-300 rounded-lg outline-none text-sm"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                    onBlur={saveEdit}
                  />
                  <button onClick={saveEdit} className="text-green-600 p-2 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className={`font-semibold text-sm ${activePageId === page.id ? 'text-blue-700' : 'text-gray-800'}`}>
                      {page.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {page.elements.length} items
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                     <button 
                       onClick={(e) => { e.stopPropagation(); startEdit(page); }}
                       className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                       title="Rename"
                     >
                       <Edit2 size={16} />
                     </button>
                     {pages.length > 1 && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                         title="Delete"
                       >
                         <Trash2 size={16} />
                       </button>
                     )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={() => { onAddPage(); }}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all shadow-lg shadow-gray-200"
          >
            <Plus size={20} />
            Create New Page
          </button>
        </div>
      </div>
    </div>
  );
};