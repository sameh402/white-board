export type ToolType = 'pen' | 'rect' | 'circle' | 'line' | 'note' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ToolType;
  color: string;
}

export interface DrawElement extends BaseElement {
  type: 'pen';
  points: Point[];
  strokeWidth: number;
}

export interface ShapeElement extends BaseElement {
  type: 'rect' | 'circle' | 'line';
  startPoint: Point;
  endPoint: Point;
  strokeWidth: number;
}

export interface NoteElement extends BaseElement {
  type: 'note';
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  color: string;
}

export type CanvasElement = DrawElement | ShapeElement | NoteElement;

export interface Page {
  id: string;
  name: string;
  elements: CanvasElement[];
}