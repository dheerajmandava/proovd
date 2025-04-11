'use client';

import React, { useState } from 'react';
import { ComponentProps } from './NotificationBuilder';
import { SketchPicker } from 'react-color';
import { 
  ChevronDown, ChevronUp, Type, Circle, Square, Move, 
  BoldIcon, ItalicIcon, UnderlineIcon, AlignLeft, AlignCenter, AlignRight, 
  XCircle, Image, RefreshCw
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Define the props interface for RichTextEditor explicitly
interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  inlineEditing?: boolean;
  // onEditorReady?: (editor: Editor | null) => void; // Assuming Editor type comes from Tiptap
  readOnly?: boolean;
}

interface StyleEditorProps {
  component: ComponentProps | null;
  onUpdate: (updates: Partial<ComponentProps>) => void;
}

// Dynamic import of RichTextEditor component with explicit type
const RichTextEditor = dynamic<RichTextEditorProps>(() => import('../../../../../components/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="loading-editor p-4 border rounded bg-base-200">Loading editor...</div>
});

export default function StyleEditor({ component, onUpdate }: StyleEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    spacing: false,
    background: false,
    border: false,
    dimensions: false,
  });

  if (!component) {
    return null;
  }

  const { type, content = '', style = {} } = component;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateStyle = (key: string, value: string) => {
    onUpdate({
      style: {
        ...style,
        [key]: value,
      },
    });
  };

  const resetStyles = (category: string) => {
    const newStyle = { ...style };
    if (category === 'text') {
      delete newStyle.color;
      delete newStyle.fontSize;
      // Remove redundant styles handled by Tiptap
      // delete newStyle.fontWeight;
      // delete newStyle.fontStyle;
      // delete newStyle.textAlign;
      // delete newStyle.textTransform;
    } else if (category === 'spacing') {
      delete newStyle.margin;
      delete newStyle.padding;
    } else if (category === 'background') {
      delete newStyle.backgroundColor;
      delete newStyle.backgroundImage;
      delete newStyle.backgroundSize;
      delete newStyle.opacity;
    } else if (category === 'border') {
      delete newStyle.border;
      delete newStyle.borderRadius;
    } else if (category === 'dimensions') {
      delete newStyle.width;
      delete newStyle.height;
      delete newStyle.minWidth;
      delete newStyle.minHeight;
      delete newStyle.maxWidth;
      delete newStyle.maxHeight;
    }
    onUpdate({ style: newStyle });
  };

  // Define section styles for consistency
  const SectionHeader = ({ 
    title, 
    section, 
    icon 
  }: { 
    title: string; 
    section: keyof typeof expandedSections;
    icon: React.ReactNode;
  }) => (
    <div 
      className={`flex justify-between items-center p-2 rounded hover:bg-base-200 cursor-pointer transition-colors ${
        expandedSections[section] ? 'bg-base-200 mb-2' : ''
      }`}
      onClick={() => toggleSection(section)}
    >
      <span className="font-medium flex items-center gap-2">
        {icon}
        {title}
      </span>
      <button className="text-base-content/60 hover:text-base-content p-1">
        {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );

  const FormField = ({ 
    label, 
    children 
  }: { 
    label: string; 
    children: React.ReactNode;
  }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-base-content/70 mb-1">{label}</label>
      {children}
    </div>
  );

  const ResetButton = ({ category }: { category: string }) => (
    <button
      onClick={() => resetStyles(category)}
      className="absolute top-0 right-0 -mt-1 -mr-1 text-base-content/40 hover:text-error transition-colors"
      title="Reset to default"
    >
      <RefreshCw size={14} />
    </button>
  );

  // Content Update Function
  const updateComponentContent = (value: string) => {
    onUpdate({
      content: value,
    });
  };

  // Function to render appropriate controls based on component type
  return (
    <div className="space-y-4">
      {/* Content section using RichTextEditor for text types */}
      {type === 'text' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-base-content/70 mb-1">Content</label>
          <RichTextEditor
            content={content}
            onChange={updateComponentContent}
            placeholder="Enter notification text..."
            minHeight="150px" // Give it some default height in the panel
            inlineEditing={false} // Ensure full toolbar is shown
          />
        </div>
      )}

      {/* Basic content input for non-text types */}
      {(type !== 'text' && (type === 'badge' || type === 'price' || type === 'user' || type === 'location' || type === 'time')) && (
        <div className="mb-4">
          <FormField label="Content">
            <input
              type="text"
              value={content}
              onChange={(e) => updateComponentContent(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </FormField>
        </div>
      )}
      
      {type === 'image' && (
        <div className="mb-4">
          <FormField label="Image URL">
            <div className="flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => updateComponentContent(e.target.value)}
                className="input input-bordered input-sm flex-1"
                placeholder="https://example.com/image.jpg"
              />
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => updateComponentContent('https://placehold.co/100x100')}
                title="Reset to placeholder"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </FormField>
          
          <div className="mt-2 bg-base-200 rounded-md p-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-base-300 rounded overflow-hidden">
              <img 
                src={content || 'https://placehold.co/100x100'} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/100x100?text=Error';
                }}
              />
            </div>
            <div className="text-xs text-base-content/70">
              <p>Preview</p>
              <p className="text-[10px] mt-0.5 text-base-content/50">Using optimized image sizes is recommended</p>
            </div>
          </div>
        </div>
      )}

      {/* Text Styling - Only show for non-text components now */}
      {(type !== 'text' && (type === 'badge' || type === 'price' || type === 'user' || type === 'location' || type === 'time')) && (
        <div className="relative">
          <SectionHeader title="Text Style" section="text" icon={<Type size={16} />} />
          
          {expandedSections.text && (
            <div className="space-y-3 pl-2 pr-5 relative">
              <ResetButton category="text" />
              
              {/* Remaining Text Style Controls */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Font Size">
                  <select
                    value={style.fontSize || ''}
                    onChange={(e) => updateStyle('fontSize', e.target.value)}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="">Default</option>
                    <option value="10px">Tiny (10px)</option>
                    <option value="12px">Small (12px)</option>
                    <option value="14px">Medium (14px)</option>
                    <option value="16px">Large (16px)</option>
                    <option value="18px">XL (18px)</option>
                    <option value="24px">XXL (24px)</option>
                  </select>
                </FormField>
                
                <FormField label="Color">
                  {/* Color picker button logic - kept for non-text components */}
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full h-9 rounded border border-base-300 flex items-center px-2 hover:bg-base-200 transition-colors"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      style={{ background: style.color || '#333333' }}
                    >
                      <span className="h-5 w-5 rounded-full border border-gray-400 mr-2" style={{ background: style.color || '#333333' }}></span>
                      <span className="text-sm font-mono" style={{ color: style.color ? getContrastColor(style.color) : 'white' }}>
                        {style.color || 'Default'}
                      </span>
                    </button>
                    
                    {showColorPicker && (
                      <div className="absolute z-10 mt-1">
                        <div className="fixed inset-0" onClick={() => setShowColorPicker(false)}></div>
                        <div className="relative">
                          <SketchPicker
                            color={style.color || '#333333'}
                            onChange={(color) => updateStyle('color', color.hex)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Spacing Section */}
      <div className="relative">
        <SectionHeader title="Spacing" section="spacing" icon={<Move size={16} />} />
        
        {expandedSections.spacing && (
          <div className="grid grid-cols-2 gap-3 pl-2 pr-5">
            <ResetButton category="spacing" />
            
            <FormField label="Padding">
              <select
                value={style.padding || ''}
                onChange={(e) => updateStyle('padding', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Default</option>
                <option value="0">None</option>
                <option value="2px">Tiny (2px)</option>
                <option value="4px">Small (4px)</option>
                <option value="8px">Medium (8px)</option>
                <option value="12px">Large (12px)</option>
                <option value="16px">XL (16px)</option>
              </select>
            </FormField>
            
            <FormField label="Margin">
              <select
                value={style.margin || ''}
                onChange={(e) => updateStyle('margin', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Default</option>
                <option value="0">None</option>
                <option value="2px">Tiny (2px)</option>
                <option value="4px">Small (4px)</option>
                <option value="8px">Medium (8px)</option>
                <option value="12px">Large (12px)</option>
                <option value="16px">XL (16px)</option>
              </select>
            </FormField>
          </div>
        )}
      </div>
      
      {/* Background Section */}
      <div className="relative">
        <SectionHeader title="Background" section="background" icon={<Square size={16} />} />
        
        {expandedSections.background && (
          <div className="grid grid-cols-2 gap-3 pl-2 pr-5">
            <ResetButton category="background" />
            
            <FormField label="Background Color">
              <div className="relative">
                <button
                  type="button"
                  className="w-full h-9 rounded border border-base-300 flex items-center px-2 hover:bg-base-200 transition-colors"
                  onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                  style={{ background: style.backgroundColor || 'transparent' }}
                >
                  {style.backgroundColor ? (
                    <span className="h-5 w-5 rounded-full border border-gray-400 mr-2" style={{ background: style.backgroundColor }}></span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-gray-400 mr-2 bg-transparent relative">
                      <XCircle size={14} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500" />
                    </span>
                  )}
                  <span className="text-sm font-mono" style={{ color: style.backgroundColor ? getContrastColor(style.backgroundColor) : 'inherit' }}>
                    {style.backgroundColor || 'None'}
                  </span>
                </button>
                
                {showBgColorPicker && (
                  <div className="absolute z-10 mt-1">
                    <div className="fixed inset-0" onClick={() => setShowBgColorPicker(false)}></div>
                    <div className="relative">
                      <SketchPicker
                        color={style.backgroundColor || '#ffffff'}
                        onChange={(color) => updateStyle('backgroundColor', color.hex)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </FormField>
            
            <FormField label="Opacity">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={style.opacity || '1'}
                onChange={(e) => updateStyle('opacity', e.target.value)}
                className="range range-xs range-primary w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>{Math.round(parseFloat(style.opacity || '1') * 100)}%</span>
                <span>100%</span>
              </div>
            </FormField>
          </div>
        )}
      </div>
      
      {/* Border Section */}
      <div className="relative">
        <SectionHeader title="Border" section="border" icon={<Circle size={16} />} />
        
        {expandedSections.border && (
          <div className="grid grid-cols-2 gap-3 pl-2 pr-5">
            <ResetButton category="border" />
            
            <FormField label="Border Type">
              <select
                value={style.border || ''}
                onChange={(e) => updateStyle('border', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">None</option>
                <option value="1px solid #e5e7eb">Thin</option>
                <option value="2px solid #e5e7eb">Medium</option>
                <option value="3px solid #e5e7eb">Thick</option>
                <option value="1px dashed #e5e7eb">Dashed</option>
                <option value="1px dotted #e5e7eb">Dotted</option>
              </select>
            </FormField>
            
            <FormField label="Border Radius">
              <select
                value={style.borderRadius || ''}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Square</option>
                <option value="2px">Slightly Rounded</option>
                <option value="4px">Rounded</option>
                <option value="8px">Very Rounded</option>
                <option value="16px">Pill</option>
                <option value="9999px">Circle</option>
              </select>
            </FormField>
          </div>
        )}
      </div>
      
      {/* Dimensions Section */}
      <div className="relative">
        <SectionHeader title="Dimensions" section="dimensions" icon={<Image size={16} />} />
        
        {expandedSections.dimensions && (
          <div className="grid grid-cols-2 gap-3 pl-2 pr-5">
            <ResetButton category="dimensions" />
            
            <FormField label="Width">
              <div className="join w-full">
                <input
                  type="text"
                  value={style.width || ''}
                  onChange={(e) => updateStyle('width', e.target.value)}
                  className="input input-bordered input-sm join-item flex-1"
                  placeholder="auto"
                />
                <select
                  className="select select-bordered select-sm join-item"
                  value={style.width?.toString().replace(/[0-9]/g, '') || 'px'}
                  onChange={(e) => {
                    const numValue = style.width?.toString().replace(/[^0-9]/g, '') || '';
                    updateStyle('width', numValue + e.target.value);
                  }}
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </div>
            </FormField>
            
            <FormField label="Height">
              <div className="join w-full">
                <input
                  type="text"
                  value={style.height || ''}
                  onChange={(e) => updateStyle('height', e.target.value)}
                  className="input input-bordered input-sm join-item flex-1"
                  placeholder="auto"
                />
                <select
                  className="select select-bordered select-sm join-item"
                  value={style.height?.toString().replace(/[0-9]/g, '') || 'px'}
                  onChange={(e) => {
                    const numValue = style.height?.toString().replace(/[^0-9]/g, '') || '';
                    updateStyle('height', numValue + e.target.value);
                  }}
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                </select>
              </div>
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine contrasting text color
function getContrastColor(hex: string) {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  // 3 digits
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } 
  // 6 digits
  else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white depending on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
} 