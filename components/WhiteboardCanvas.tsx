import React, { useRef, useState } from 'react';
import { CanvasElement, DrawElement, NoteElement, Point, ShapeElement, ToolType } from '../types';
import { StickyNote } from './StickyNote';

interface WhiteboardCanvasProps {
  elements: CanvasElement[];
  tool: ToolType;
  color: string;
  strokeWidth: number;
  onAddElement: (el: CanvasElement) => void;
  onUpdateNote: (id: string, text: string) => void;
  onDeleteElement: (id: string) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  elements,
  tool,
  color,
  strokeWidth,
  onAddElement,
  onUpdateNote,
  onDeleteElement,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentStart, setCurrentStart] = useState<Point | null>(null);
  const [currentEnd, setCurrentEnd] = useState<Point | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const getCoordinates = (e: React.PointerEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on the canvas, deselect notes unless specifically clicked
    if ((e.target as any).tagName === 'svg' || (e.target as any).tagName === 'path' || (e.target as any).tagName === 'rect' || (e.target as any).tagName === 'ellipse' || (e.target as any).tagName === 'line') {
      setSelectedNoteId(null);
    }

    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentStart(coords);
    setCurrentEnd(coords); // Initialize end as start
    setCurrentPoints([coords]);

    if (tool === 'note') {
      const newNote: NoteElement = {
        id: Date.now().toString(),
        type: 'note',
        x: coords.x,
        y: coords.y,
        text: '',
        width: 160,
        height: 160,
        color: '#fef3c7', // Default yellow sticky note
      };
      onAddElement(newNote);
      setIsDrawing(false); // Immediate finish for note
      setSelectedNoteId(newNote.id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    setCurrentEnd(coords);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPoints((prev) => [...prev, coords]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (!currentStart || !currentEnd) return;

    // Create the element based on tool
    const id = Date.now().toString();

    if (tool === 'pen') {
      const el: DrawElement = {
        id,
        type: 'pen',
        points: currentPoints,
        color: color,
        strokeWidth: strokeWidth,
      };
      onAddElement(el);
    } else if (tool === 'eraser') {
      // Eraser logic is tricky in SVG. 
      // Simplified: We draw a white line for "erasing" or we just interpret it as a "white pen".
      // For true vector erasing, we'd need collision detection. 
      // Let's go with "White Pen" approach for simplicity in this demo structure.
      const el: DrawElement = {
        id,
        type: 'pen',
        points: currentPoints,
        color: '#ffffff', // Background color
        strokeWidth: strokeWidth * 4, // Eraser is bigger
      };
      onAddElement(el);
    } else if (tool === 'rect' || tool === 'circle' || tool === 'line') {
        // Prevent accidental tiny clicks creating shapes
        const dist = Math.hypot(currentEnd.x - currentStart.x, currentEnd.y - currentStart.y);
        if (dist > 5) {
            const el: ShapeElement = {
                id,
                type: tool,
                startPoint: currentStart,
                endPoint: currentEnd,
                color: color,
                strokeWidth: strokeWidth,
            };
            onAddElement(el);
        }
    }

    setCurrentPoints([]);
    setCurrentStart(null);
    setCurrentEnd(null);
  };

  // Helper to render paths
  const renderPath = (points: Point[]) => {
    if (points.length === 0) return '';
    const d = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return d;
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden touch-none">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Render Saved Elements */}
        {elements.map((el) => {
          if (el.type === 'pen') {
            return (
              <path
                key={el.id}
                d={renderPath(el.points)}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          } else if (el.type === 'rect') {
            const x = Math.min(el.startPoint.x, el.endPoint.x);
            const y = Math.min(el.startPoint.y, el.endPoint.y);
            const w = Math.abs(el.startPoint.x - el.endPoint.x);
            const h = Math.abs(el.startPoint.y - el.endPoint.y);
            return (
              <rect
                key={el.id}
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                fill="none"
              />
            );
          } else if (el.type === 'circle') {
            const rx = Math.abs(el.startPoint.x - el.endPoint.x) / 2;
            const ry = Math.abs(el.startPoint.y - el.endPoint.y) / 2;
            const cx = Math.min(el.startPoint.x, el.endPoint.x) + rx;
            const cy = Math.min(el.startPoint.y, el.endPoint.y) + ry;
            return (
              <ellipse
                key={el.id}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                stroke={el.color}
                strokeWidth={el.strokeWidth}
                fill="none"
              />
            );
          } else if (el.type === 'line') {
             return (
                 <line 
                    key={el.id}
                    x1={el.startPoint.x}
                    y1={el.startPoint.y}
                    x2={el.endPoint.x}
                    y2={el.endPoint.y}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    strokeLinecap="round"
                 />
             )
          }
          return null;
        })}

        {/* Render Preview of Current Action */}
        {isDrawing && currentStart && currentEnd && (
          <>
            {(tool === 'pen' || tool === 'eraser') && (
              <path
                d={renderPath(currentPoints)}
                stroke={tool === 'eraser' ? '#ffffff' : color}
                strokeWidth={tool === 'eraser' ? strokeWidth * 4 : strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
            )}
            {tool === 'rect' && (
              <rect
                x={Math.min(currentStart.x, currentEnd.x)}
                y={Math.min(currentStart.y, currentEnd.y)}
                width={Math.abs(currentStart.x - currentEnd.x)}
                height={Math.abs(currentStart.y - currentEnd.y)}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.6}
              />
            )}
            {tool === 'circle' && (
              <ellipse
                cx={Math.min(currentStart.x, currentEnd.x) + Math.abs(currentStart.x - currentEnd.x) / 2}
                cy={Math.min(currentStart.y, currentEnd.y) + Math.abs(currentStart.y - currentEnd.y) / 2}
                rx={Math.abs(currentStart.x - currentEnd.x) / 2}
                ry={Math.abs(currentStart.y - currentEnd.y) / 2}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.6}
              />
            )}
            {tool === 'line' && (
                <line 
                   x1={currentStart.x}
                   y1={currentStart.y}
                   x2={currentEnd.x}
                   y2={currentEnd.y}
                   stroke={color}
                   strokeWidth={strokeWidth}
                   strokeLinecap="round"
                   opacity={0.6}
                />
            )}
          </>
        )}
      </svg>

      {/* Render Sticky Notes (HTML Layer) */}
      {elements
        .filter((el): el is NoteElement => el.type === 'note')
        .map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onSelect={setSelectedNoteId}
            onUpdate={onUpdateNote}
            onDelete={onDeleteElement}
          />
        ))}
    </div>
  );
};