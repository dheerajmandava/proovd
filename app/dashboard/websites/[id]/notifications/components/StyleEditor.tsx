'use client';

import { useState, useEffect } from 'react';
import { ComponentProps } from './NotificationBuilder';

interface StyleEditorProps {
  component: ComponentProps | undefined | null;
  onUpdate: (updates: Partial<ComponentProps>) => void;
}

export default function StyleEditor({ component, onUpdate }: StyleEditorProps) {
  const [content, setContent] = useState('');
  const [style, setStyle] = useState<Record<string, string>>({});
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Update local state when component changes
  useEffect(() => {
    if (component) {
      setContent(component.content);
      setStyle(component.style || {});
      setPosition(component.position);
    }
  }, [component]);

  // Handler for content changes
  const handleContentChange = (value: string) => {
    setContent(value);
    onUpdate({ content: value });
  };

  // Handler for style changes
  const handleStyleChange = (property: string, value: string) => {
    // Prevent updates if the value hasn't changed (fixes infinite update loop)
    if (style[property] === value) return;
    
    const updatedStyle = { ...style, [property]: value };
    setStyle(updatedStyle);
    onUpdate({ style: updatedStyle });
  };

  // Handler for position updates
  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    // Prevent updates if the value hasn't changed (fixes potential infinite loop)
    if (position[axis] === value) return;
    
    const updatedPosition = { ...position, [axis]: value };
    setPosition(updatedPosition);
    onUpdate({ position: updatedPosition });
  };

  // Reset styles to defaults
  const resetStyles = () => {
    if (!component) return;
    
    let defaultStyle: Record<string, string> = {};
    
    switch (component.type) {
      case 'text':
        defaultStyle = { fontSize: '14px', color: '#333333' };
        break;
      case 'image':
        defaultStyle = { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' };
        break;
      case 'badge':
        defaultStyle = { backgroundColor: '#4338ca', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' };
        break;
      case 'price':
        defaultStyle = { color: '#10b981', fontWeight: 'bold', fontSize: '16px' };
        break;
      case 'rating':
        defaultStyle = { color: '#f59e0b', fontSize: '16px' };
        break;
      case 'user':
        defaultStyle = { fontWeight: 'bold' };
        break;
      case 'location':
        defaultStyle = { color: '#6b7280', fontSize: '12px' };
        break;
      case 'time':
        defaultStyle = { color: '#6b7280', fontSize: '12px', fontStyle: 'italic' };
        break;
      default:
        defaultStyle = { fontSize: '14px', color: '#333333' };
    }
    
    setStyle(defaultStyle);
    onUpdate({ style: defaultStyle });
  };

  // Get component type label
  const getComponentLabel = (type: string): string => {
    const labels: Record<string, string> = {
      text: 'Text',
      image: 'Image',
      badge: 'Badge',
      price: 'Price',
      rating: 'Rating Stars',
      user: 'User Name',
      location: 'Location',
      time: 'Time Ago',
    };
    
    return labels[type] || 'Component';
  };

  if (!component) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-base-content/60">
        <p className="text-sm">Select a component to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Edit {getComponentLabel(component.type)}
        </h3>
        
        <button 
          className="btn btn-sm btn-ghost"
          onClick={resetStyles}
          title="Reset styles to default"
        >
          Reset
        </button>
      </div>
      
      <div className="divider my-2"></div>
      
      {/* Content editor */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Content</span>
        </label>
        
        {component.type === 'image' ? (
          <input
            type="url"
            className="input input-bordered w-full"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter image URL..."
          />
        ) : (
          <input
            type="text"
            className="input input-bordered w-full"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter content..."
          />
        )}
      </div>
      
      <div className="divider my-2">Style</div>
      
      {/* Text color */}
      {component.type !== 'image' && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Text Color</span>
            <span className="label-text-alt">{style.color || '#333333'}</span>
          </label>
          <input
            type="color"
            className="w-full h-10 rounded-md cursor-pointer"
            value={style.color || '#333333'}
            onChange={(e) => handleStyleChange('color', e.target.value)}
          />
        </div>
      )}
      
      {/* Background color - for badges */}
      {component.type === 'badge' && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Background Color</span>
            <span className="label-text-alt">{style.backgroundColor || '#4338ca'}</span>
          </label>
          <input
            type="color"
            className="w-full h-10 rounded-md cursor-pointer"
            value={style.backgroundColor || '#4338ca'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          />
        </div>
      )}
      
      {/* Font size */}
      {component.type !== 'image' && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Font Size</span>
            <span className="label-text-alt">{style.fontSize || '14px'}</span>
          </label>
          <input
            type="range"
            min="8"
            max="32"
            step="1"
            className="range range-sm"
            value={(style.fontSize || '14px').replace('px', '')}
            onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
          />
        </div>
      )}
      
      {/* Font weight */}
      {component.type !== 'image' && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Font Weight</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={style.fontWeight || 'normal'}
            onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </div>
      )}
      
      {/* Font style */}
      {component.type !== 'image' && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Font Style</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={style.fontStyle || 'normal'}
            onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      )}
      
      {/* Width and height for images */}
      {component.type === 'image' && (
        <>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Width</span>
              <span className="label-text-alt">{style.width || '60px'}</span>
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              className="range range-sm"
              value={(style.width || '60px').replace('px', '')}
              onChange={(e) => handleStyleChange('width', `${e.target.value}px`)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Height</span>
              <span className="label-text-alt">{style.height || '60px'}</span>
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              className="range range-sm"
              value={(style.height || '60px').replace('px', '')}
              onChange={(e) => handleStyleChange('height', `${e.target.value}px`)}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Border Radius</span>
              <span className="label-text-alt">{style.borderRadius || '4px'}</span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              className="range range-sm"
              value={(style.borderRadius || '4px').replace('px', '')}
              onChange={(e) => handleStyleChange('borderRadius', `${e.target.value}px`)}
            />
          </div>
        </>
      )}
      
      {/* Border for all components */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Border</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={style.border || 'none'}
          onChange={(e) => handleStyleChange('border', e.target.value)}
        >
          <option value="none">None</option>
          <option value="1px solid #e5e7eb">Thin</option>
          <option value="2px solid #e5e7eb">Medium</option>
          <option value="3px solid #e5e7eb">Thick</option>
        </select>
      </div>
      
      <div className="divider my-2">Position</div>
      
      {/* X position */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">X Position</span>
          <span className="label-text-alt">{position.x}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="280"
          step="1"
          className="range range-sm"
          value={position.x}
          onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
        />
      </div>
      
      {/* Y position */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Y Position</span>
          <span className="label-text-alt">{position.y}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="150"
          step="1"
          className="range range-sm"
          value={position.y}
          onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
        />
      </div>
      
      {/* Opacity */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Opacity</span>
          <span className="label-text-alt">{style.opacity || '1'}</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          className="range range-sm"
          value={style.opacity || '1'}
          onChange={(e) => handleStyleChange('opacity', e.target.value)}
        />
      </div>
      
      {/* Text alignment for text components */}
      {['text', 'user', 'location', 'time', 'price'].includes(component.type) && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Text Alignment</span>
          </label>
          <div className="join w-full">
            <button
              type="button"
              className={`btn btn-sm join-item flex-1 ${style.textAlign === 'left' || !style.textAlign ? 'btn-active' : ''}`}
              onClick={() => handleStyleChange('textAlign', 'left')}
            >
              Left
            </button>
            <button
              type="button"
              className={`btn btn-sm join-item flex-1 ${style.textAlign === 'center' ? 'btn-active' : ''}`}
              onClick={() => handleStyleChange('textAlign', 'center')}
            >
              Center
            </button>
            <button
              type="button"
              className={`btn btn-sm join-item flex-1 ${style.textAlign === 'right' ? 'btn-active' : ''}`}
              onClick={() => handleStyleChange('textAlign', 'right')}
            >
              Right
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 