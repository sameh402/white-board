import React, { useState } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
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
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentStart, setCurrentStart] = useState<Point | null>(null);
  const [currentEnd, setCurrentEnd] = useState<Point | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Track if we are currently dragging a gesture
  const [isDrawing, setIsDrawing] = useState(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const startPoint = { x: locationX, y: locationY };
        
        // Deselect note on canvas touch
        setSelectedNoteId(null);
        
        setIsDrawing(true);
        setCurrentStart(startPoint);
        setCurrentEnd(startPoint);
        setCurrentPoints([startPoint]);

        if (tool === 'note') {
           const newNote: NoteElement = {
            id: Date.now().toString(),
            type: 'note',
            x: locationX,
            y: locationY,
            text: '',
            width: 150,
            height: 150,
            color: '#fef3c7',
          };
          onAddElement(newNote);
          setIsDrawing(false); 
          setSelectedNoteId(newNote.id);
        }
      },

      onPanResponderMove: (evt) => {
        if (!isDrawing && tool !== 'note') return; // Note handled in Grant
        const { locationX, locationY } = evt.nativeEvent;
        const point = { x: locationX, y: locationY };
        
        setCurrentEnd(point);

        if (tool === 'pen' || tool === 'eraser') {
          setCurrentPoints(prev => [...prev, point]);
        }
      },

      onPanResponderRelease: () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        if (!currentStart || !currentEnd) return;
        
        const id = Date.now().toString();

        if (tool === 'pen' || tool === 'eraser') {
           const el: DrawElement = {
            id,
            type: 'pen',
            points: currentPoints,
            color: tool === 'eraser' ? '#ffffff' : color,
            strokeWidth: tool === 'eraser' ? strokeWidth * 5 : strokeWidth,
          };
          onAddElement(el);
        } else if (tool === 'rect' || tool === 'circle' || tool === 'line') {
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
      }
    })
  ).current;

  const renderPath = (points: Point[]) => {
    if (points.length === 0) return '';
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  };

  return (
    <View style={styles.container} {...(tool !== 'note' ? panResponder.panHandlers : {})}>
      {/* Background/Touch Layer for Note creation specifically or general touches */}
      {tool === 'note' && (
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
      )}

      <Svg style={StyleSheet.absoluteFill}>
        {/* Render Saved Elements */}
        {elements.map((el) => {
           if (el.type === 'pen') {
             return (
               <Path
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
               <Rect
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
               <Circle
                 key={el.id}
                 cx={cx}
                 cy={cy}
                 r={rx} // SVG Circle uses r, Ellipse uses rx/ry. Simplified to Circle if aspect 1:1 or logic
                 stroke={el.color}
                 strokeWidth={el.strokeWidth}
                 fill="none"
               />
             );
           } else if (el.type === 'line') {
             return (
               <Line
                 key={el.id}
                 x1={el.startPoint.x}
                 y1={el.startPoint.y}
                 x2={el.endPoint.x}
                 y2={el.endPoint.y}
                 stroke={el.color}
                 strokeWidth={el.strokeWidth}
                 strokeLinecap="round"
               />
             );
           }
           return null;
        })}

        {/* Render Preview */}
        {isDrawing && currentStart && currentEnd && (
          <>
            {(tool === 'pen' || tool === 'eraser') && (
              <Path
                d={renderPath(currentPoints)}
                stroke={tool === 'eraser' ? '#ffffff' : color}
                strokeWidth={tool === 'eraser' ? strokeWidth * 5 : strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.6}
              />
            )}
            {tool === 'rect' && (
              <Rect
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
               <Circle
                 cx={Math.min(currentStart.x, currentEnd.x) + Math.abs(currentStart.x - currentEnd.x) / 2}
                 cy={Math.min(currentStart.y, currentEnd.y) + Math.abs(currentStart.y - currentEnd.y) / 2}
                 r={Math.abs(currentStart.x - currentEnd.x) / 2}
                 stroke={color}
                 strokeWidth={strokeWidth}
                 fill="none"
                 opacity={0.6}
               />
            )}
            {tool === 'line' && (
              <Line
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
      </Svg>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});