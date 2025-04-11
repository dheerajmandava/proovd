'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StyleEditor from './StyleEditor';
import { X, Plus } from 'lucide-react';

// Define component properties interface
export interface ComponentProps {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  style?: Record<string, string>;
}

// Define notification template interface
interface NotificationData {
  _id?: string; // Use _id to match MongoDB convention
  id?: string; // Keep id if used elsewhere, but prefer _id
  name: string;
  websiteId: string;
  components: ComponentProps[];
  // Add other fields if necessary (e.g., status, created/updated dates)
}

// Default component style presets
const componentDefaults: Record<string, { content: string; style: Record<string, string> }> = {
  text: {
    content: 'Add your text here',
    style: { fontSize: '14px', color: '#333333' }
  },
  image: {
    content: 'https://placehold.co/60x60',
    style: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }
  },
  badge: {
    content: 'New',
    style: { backgroundColor: '#4338ca', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }
  },
  price: {
    content: '$99.99',
    style: { color: '#10b981', fontWeight: 'bold', fontSize: '16px' }
  },
  rating: {
    content: '★★★★☆',
    style: { color: '#f59e0b', fontSize: '16px' }
  },
  user: {
    content: 'John Doe',
    style: { fontWeight: 'bold' }
  },
  location: {
    content: 'New York, USA',
    style: { color: '#6b7280', fontSize: '12px' }
  },
  time: {
    content: '2 minutes ago',
    style: { color: '#6b7280', fontSize: '12px', fontStyle: 'italic' }
  },
};

// Define CSS styles for components
const styles = `
  .notification-component {
    position: absolute;
    transition: transform 0.2s ease;
    cursor: move;
    user-select: none;
  }
  
  .notification-component.dragging {
    opacity: 0.8;
    z-index: 100;
  }
  
  .notification-component.inline-editing {
    cursor: text;
    z-index: 50;
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    user-select: text;
  }
  
  .inline-editor-wrapper {
    min-width: 100px;
    min-height: 40px;
  }
  
  .loading-editor {
    padding: 8px;
    font-style: italic;
    color: #6b7280;
    background-color: #f9fafb;
    border-radius: 4px;
  }
  
  .editorjs-content h1, .editorjs-content h2, .editorjs-content h3 {
    margin: 0.5em 0;
    font-weight: bold;
  }
  
  .editorjs-content p {
    margin: 0.5em 0;
  }
  
  .editorjs-content ul, .editorjs-content ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  /* Editor.js toolbar styles */
  .ce-toolbar__content {
    max-width: 100% !important;
  }
  
  .ce-block__content {
    max-width: 100% !important;
  }
`;

// Update props definition
interface NotificationBuilderProps {
  websiteId: string; // Passed directly now
  initialNotificationData?: NotificationData; // Renamed prop
  isEditing?: boolean; // Flag for edit mode
}

export default function NotificationBuilder({ 
  websiteId, 
  initialNotificationData, 
  isEditing = false 
}: NotificationBuilderProps) {
  const router = useRouter();

  // State variables
  const [templateName, setTemplateName] = useState('New Notification');
  const [components, setComponents] = useState<ComponentProps[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ComponentProps | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDirectMoving, setIsDirectMoving] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialComponentPos, setInitialComponentPos] = useState({ x: 0, y: 0 });
  const [previewSize] = useState<'realestate'>('realestate');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'custom'>('light');
  const [previewMode, setPreviewMode] = useState<'standalone' | 'website'>('standalone');
  const [customDimensions, setCustomDimensions] = useState({ width: 280, height: 120 });
  const [tempDimensions, setTempDimensions] = useState({ width: '280', height: '120' });
  
  // Define notification preview dimensions for different sizes
  const previewDimensions = {
    realestate: { 
      // Using configurable dimensions
      width: customDimensions.width, 
      height: customDimensions.height, 
      padding: "12px",
      borderRadius: "8px", 
      border: "1px solid #e5e7eb",
      shadow: "0 6px 12px -3px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)"
    }
  };
  
  // Define background colors for preview
  const previewBackgrounds = {
    light: { bg: 'white', text: '#333333' },
    dark: { bg: '#1f2937', text: 'white' },
    custom: { bg: '#f8f9fa', text: '#333333' }
  };
  
  // Define notification positions
  const notificationPositions = {
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
  };
  
  // Default position
  const [notificationPosition, setNotificationPosition] = useState<keyof typeof notificationPositions>('center');

  // Configure drag sensors - updated for maximum sensitivity
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // No activation constraints for immediate response
      activationConstraint: null,
    }),
    useSensor(TouchSensor, {
      // No activation constraints for immediate response
      activationConstraint: null,
    }),
    useSensor(PointerSensor, {
      // No activation constraints for immediate response 
      activationConstraint: null,
    })
  );

  // Initialize from existing template OR initial data if editing
  useEffect(() => {
    if (isEditing && initialNotificationData) {
      setTemplateName(initialNotificationData.name);
      setComponents(initialNotificationData.components || []); // Ensure components array exists
      // Set other relevant states if needed, e.g., notificationPosition
    } else if (!isEditing) {
      // Reset state if navigating from edit to new (optional)
      setTemplateName('New Notification');
      setComponents([]);
    }
    // Add dependencies: isEditing and initialNotificationData
  }, [isEditing, initialNotificationData]);

  // Add a custom CSS class to the document when dragging for better cursor feedback
  useEffect(() => {
    if (isDirectMoving) {
      document.body.classList.add('grabbing-cursor');
    } else {
      document.body.classList.remove('grabbing-cursor');
    }
    
    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('grabbing-cursor');
    };
  }, [isDirectMoving]);

  // Generate unique ID for components
  const generateComponentId = (type: string) => `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Handle adding a new component
  const handleAddComponent = useCallback((type: string) => {
    const { content, style } = componentDefaults[type];
    
    // Determine a good default position based on existing components
    const defaultX = Math.floor(Math.random() * 50) + 10;
    const defaultY = Math.floor(Math.random() * 20) + 10;
    
    const newComponent: ComponentProps = {
      id: generateComponentId(type),
      type,
      content,
      position: { x: defaultX, y: defaultY },
      style,
    };
    
    setComponents(prev => [...prev, newComponent]);
    
    // Auto-select the newly added component
    setSelectedComponent(newComponent);
  }, []);

  // Handle updating a component's properties
  const handleUpdateComponent = useCallback((id: string, updates: Partial<ComponentProps>) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, ...updates } : comp
      )
    );
    
    // Also update the selected component if it's the one being modified
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : prev);
    }
  }, [selectedComponent]);

  // Handle removing a component
  const handleRemoveComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    
    // Deselect if the removed component was selected
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  }, [selectedComponent]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    
    // Update component position based on drag delta
    setComponents(prev => 
      prev.map(comp => {
        if (comp.id === id) {
          return {
            ...comp,
            position: {
              x: comp.position.x + delta.x,
              y: comp.position.y + delta.y,
            },
          };
        }
        return comp;
      })
    );
    
    // Also update selected component if it's the one being dragged
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => {
        if (!prev) return null;
        return {
          ...prev,
          position: {
            x: prev.position.x + delta.x,
            y: prev.position.y + delta.y,
          },
        };
      });
    }
    
    setActiveDragId(null);
  }, [selectedComponent]);

  // Enable direct mouse movement by default (no need for shift key)
  const handleStartDirectMove = useCallback((e: React.MouseEvent, component: ComponentProps) => {
    // Always enable direct movement for better UX
    e.stopPropagation();
    e.preventDefault();
    
    // Set active component
    setSelectedComponent(component);
    
    // Get the exact element that was clicked
    const element = e.currentTarget as HTMLElement;
    
    // Only start direct movement if primary mouse button is pressed (left click)
    if (e.button === 0) {
      // Mark as moving - this changes cursor and adds visual feedback
      setIsDirectMoving(true);
      
      // Store initial mouse position relative to viewport
      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;
      
      // Get initial element position
      const initialComponentX = component.position.x;
      const initialComponentY = component.position.y;
      
      // Store these positions for the move handler
      setInitialMousePos({ x: initialMouseX, y: initialMouseY });
      setInitialComponentPos({ x: initialComponentX, y: initialComponentY });
      
      // Define move handler
      const handleMove = (moveEvent: MouseEvent) => {
        // Calculate distance moved
        const deltaX = moveEvent.clientX - initialMouseX;
        const deltaY = moveEvent.clientY - initialMouseY;
        
        // Calculate new position
        const newX = initialComponentX + deltaX;
        const newY = initialComponentY + deltaY;
        
        // Update the component's position in state - this triggers re-render
        setComponents(prev => 
          prev.map(comp => {
            if (comp.id === component.id) {
              return {
                ...comp,
                position: { x: newX, y: newY }
              };
            }
            return comp;
          })
        );
        
        // Update selected component too
        setSelectedComponent(prev => {
          if (!prev || prev.id !== component.id) return prev;
          return {
            ...prev,
            position: { x: newX, y: newY }
          };
        });
      };
      
      // Define mouse up handler to stop dragging
      const handleUp = () => {
        setIsDirectMoving(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      
      // Add event listeners
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    }
  }, []);

  // Handle saving the template
  const handleSaveTemplate = async () => {
    if (components.length === 0) {
      toast.error('Please add at least one component to the notification');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = initialNotificationData?._id 
        ? `/api/websites/${websiteId}/notifications/${initialNotificationData._id}`
        : `/api/websites/${websiteId}/notifications`;
      
      const method = initialNotificationData?._id ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          components,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification template');
      }

      toast.success('Notification template saved successfully');
      
      // Redirect to the notifications list
      router.push(`/dashboard/websites/${websiteId}/notifications`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save notification template');
    } finally {
      setIsLoading(false);
    }
  };

  // Render a component based on its type
  const renderComponent = (component: ComponentProps) => {
    const { type, content, style = {} } = component;
    const isActive = activeDragId === component.id;
    const isSelected = selectedComponent?.id === component.id;
    const isMoving = isDirectMoving && selectedComponent?.id === component.id;

    const baseProps = {
      id: component.id,
      className: `notification-component ${isActive ? 'opacity-80' : ''} ${isSelected ? 'ring-2 ring-primary' : ''} ${isMoving ? 'dragging' : ''}`,
      style: {
        ...style,
        transform: `translate(${component.position.x}px, ${component.position.y}px)`,
        position: 'absolute' as const,
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedComponent(component);
      },
      onMouseDown: (e: React.MouseEvent) => {
        handleStartDirectMove(e, component);
      },
      'data-draggable': 'true',
      'data-component-type': type,
      title: 'Click and drag to move',
    };

    switch (type) {
      case 'text':
        return (
          <div 
            key={component.id} 
            {...baseProps}
            style={{ ...baseProps.style, overflow: 'hidden' }}
            className={`${baseProps.className} inline-editor-wrapper`}
          >
            <div 
              className="prose dark:prose-invert max-w-none w-full h-full"
              dangerouslySetInnerHTML={{ __html: content || '' }}
            />
          </div>
        );
      case 'image':
        return (
          <img 
            key={component.id}
            {...baseProps} 
            src={content} 
            alt="Notification image" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/60x60?text=Error';
            }}
          />
        );
      case 'badge':
        return <div key={component.id} {...baseProps}>{content}</div>;
      case 'price':
        return <div key={component.id} {...baseProps}>{content}</div>;
      case 'rating':
        return <div key={component.id} {...baseProps}>{content}</div>;
      case 'user':
        return <div key={component.id} {...baseProps}>{content}</div>;
      case 'location':
        return <div key={component.id} {...baseProps}>{content}</div>;
      case 'time':
        return <div key={component.id} {...baseProps}>{content}</div>;
      default:
        return <div key={component.id} {...baseProps}>{content}</div>;
    }
  };

  // Get a more user-friendly component name
  const getComponentDisplayName = (type: string) => {
    const names: Record<string, string> = {
      text: 'Text',
      image: 'Image',
      badge: 'Badge',
      price: 'Price',
      rating: 'Rating',
      user: 'User Name',
      location: 'Location',
      time: 'Time Ago',
    };
    return names[type] || type;
  };

  // Handle native HTML5 drag events for better compatibility
  const handleNativeDragOver = useCallback((e: React.DragEvent) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  
  const handleNativeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Get the component type from the dataTransfer
    const componentType = e.dataTransfer.getData('component/type');
    if (!componentType) return;
    
    // Calculate drop position relative to the target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add the component at the drop position
    const { content, style } = componentDefaults[componentType] || componentDefaults.text;
    
    const newComponent: ComponentProps = {
      id: generateComponentId(componentType),
      type: componentType,
      content,
      position: { x, y },
      style,
    };
    
    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col h-full">
        {/* Modern Header with gradient and more intuitive controls */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-base-300 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <label className="text-xs font-medium text-base-content/70 block mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="input input-bordered w-full max-w-xs text-base font-medium"
                  placeholder="My Notification Template"
                />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-base-content/70 block mb-1">Position</label>
                <select 
                  value={notificationPosition}
                  onChange={(e) => setNotificationPosition(e.target.value as keyof typeof notificationPositions)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="center">Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex gap-2">
                <div>
                  <label className="text-xs font-medium text-base-content/70 block mb-1">Width (px)</label>
                  <input
                    type="text"
                    value={tempDimensions.width}
                    onChange={(e) => {
                      setTempDimensions({...tempDimensions, width: e.target.value});
                      
                      // Only update actual dimensions when there's a valid number
                      if (e.target.value !== '') {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setCustomDimensions({...customDimensions, width: Math.min(Math.max(value, 100), 600)});
                        }
                      }
                    }}
                    onBlur={() => {
                      // On blur, ensure we have a valid dimension
                      if (tempDimensions.width === '' || isNaN(parseInt(tempDimensions.width))) {
                        setTempDimensions({...tempDimensions, width: '280'});
                        setCustomDimensions({...customDimensions, width: 280});
                      }
                    }}
                    className="input input-bordered input-sm w-20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-base-content/70 block mb-1">Height (px)</label>
                  <input
                    type="text"
                    value={tempDimensions.height}
                    onChange={(e) => {
                      setTempDimensions({...tempDimensions, height: e.target.value});
                      
                      // Only update actual dimensions when there's a valid number
                      if (e.target.value !== '') {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          setCustomDimensions({...customDimensions, height: Math.min(Math.max(value, 50), 400)});
                        }
                      }
                    }}
                    onBlur={() => {
                      // On blur, ensure we have a valid dimension
                      if (tempDimensions.height === '' || isNaN(parseInt(tempDimensions.height))) {
                        setTempDimensions({...tempDimensions, height: '120'});
                        setCustomDimensions({...customDimensions, height: 120});
                      }
                    }}
                    className="input input-bordered input-sm w-20"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-base-content/70 block mb-1">Theme</label>
                <div className="flex border rounded-lg overflow-hidden">
                  <button 
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewBg === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setPreviewBg('light')}
                  >
                    Light
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${previewBg === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-700 text-gray-100 hover:bg-gray-600'}`}
                    onClick={() => setPreviewBg('dark')}
                  >
                    Dark
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn ${showPreview ? 'btn-outline' : 'btn-primary'} btn-sm`}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Edit Mode' : 'Preview'}
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveTemplate}
                  disabled={isLoading}
                >
                  {isLoading ? 
                    <span className="flex items-center gap-2">
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </span> 
                    : 'Save Template'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main builder interface */}
        <div className="flex gap-4 h-full">
          {/* Modern Component palette with categories - LEFT COLUMN */}
          <div className="w-64 bg-base-100 rounded-lg shadow-md border border-base-300 overflow-hidden flex flex-col">
            <div className="p-4 bg-base-200 border-b border-base-300">
              <h3 className="text-base font-semibold">Components</h3>
              <p className="text-xs text-base-content/70 mt-1">Drag elements to create your notification</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-base-content/50 pl-1">Content</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['text', 'image'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddComponent(type)}
                      className="btn btn-sm h-auto flex flex-col items-center py-2 gap-1 bg-base-100 hover:bg-base-200 border border-base-300"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('component/type', type);
                      }}
                    >
                      <ComponentIcon type={type} />
                      <span className="text-xs">{getComponentDisplayName(type)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-base-content/50 pl-1">Elements</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['badge', 'price', 'rating'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddComponent(type)}
                      className="btn btn-sm h-auto flex flex-col items-center py-2 gap-1 bg-base-100 hover:bg-base-200 border border-base-300"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('component/type', type);
                      }}
                    >
                      <ComponentIcon type={type} />
                      <span className="text-xs">{getComponentDisplayName(type)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-base-content/50 pl-1">User Info</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['user', 'location', 'time'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddComponent(type)}
                      className="btn btn-sm h-auto flex flex-col items-center py-2 gap-1 bg-base-100 hover:bg-base-200 border border-base-300"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('component/type', type);
                      }}
                    >
                      <ComponentIcon type={type} />
                      <span className="text-xs">{getComponentDisplayName(type)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-base-300 p-3">
              <div className="space-y-3">
                <h4 className="text-xs font-medium uppercase text-base-content/50">Selected Component</h4>
                
                {selectedComponent ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center gap-1.5">
                        <ComponentIcon type={selectedComponent.type} />
                        {getComponentDisplayName(selectedComponent.type)}
                      </span>
                      
                      <button 
                        className="btn btn-ghost btn-xs btn-square text-error"
                        onClick={() => handleRemoveComponent(selectedComponent.id)}
                        title="Remove component"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 text-xs text-base-content/70 bg-base-200 rounded-md p-2">
                      <span>Position</span>
                      <span className="font-mono">X: {selectedComponent.position.x}, Y: {selectedComponent.position.y}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-base-content/60 bg-base-200 p-3 rounded-md">
                    Click on any component in the preview to edit it
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview canvas - MIDDLE COLUMN */}
          <div className="flex-1 flex flex-col">
            <div className="relative bg-base-100 rounded-lg shadow-lg overflow-hidden border border-base-300 h-full">
              <div className="bg-base-200 p-3 flex justify-between items-center border-b border-base-300">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium">Notification Preview</h3>
                    <p className="text-xs text-base-content/60">Dimensions: {previewDimensions[previewSize].width}px × {previewDimensions[previewSize].height}px</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="bg-green-500 w-2.5 h-2.5 rounded-full"></span>
                    <span className="text-xs font-medium text-base-content/80">Live Preview</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
              </div>

              {/* Canvas with browser-like frame for realistic preview */}
              <div className="relative flex flex-col h-full">
                <div className="bg-gray-100 dark:bg-gray-800 border-b border-base-300 p-2 flex items-center">
                  <div className="flex items-center bg-white dark:bg-gray-900 rounded px-2 py-1 w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">yourwebsite.com</span>
                  </div>
                </div>

                {/* Realistic website background */}
                <div 
                  className="relative flex-1 p-6 flex items-center justify-center bg-pattern"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${previewBg === 'light' ? '000000' : 'ffffff'}' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: previewBg === 'light' ? '#f9fafb' : '#1f2937',
                    minHeight: '350px',
                    overflow: 'hidden'
                  }}
                >
                  {/* DndContext for drag and drop functionality */}
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                  >
                    <div 
                      className={`relative ${previewMode === 'standalone' ? '' : 'mx-auto'}`}
                      style={{
                        position: 'absolute',
                        ...(notificationPosition === 'center' 
                          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
                          : notificationPositions[notificationPosition]),
                        width: `${previewDimensions[previewSize].width}px`,
                        height: `${previewDimensions[previewSize].height}px`,
                        boxShadow: previewDimensions[previewSize].shadow,
                        borderRadius: previewDimensions[previewSize].borderRadius,
                        border: previewDimensions[previewSize].border,
                        padding: previewDimensions[previewSize].padding,
                        backgroundColor: previewBackgrounds[previewBg].bg,
                        color: previewBackgrounds[previewBg].text,
                        cursor: isDirectMoving ? 'grabbing' : 'default',
                        transition: 'box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
                        zIndex: 50
                      }}
                      onClick={() => {
                        // Deselect any component when clicking on the background
                        setSelectedComponent(null);
                      }}
                      onDragOver={handleNativeDragOver}
                      onDrop={handleNativeDrop}
                    >
                      {/* Visual indicator for current component position */}
                      {selectedComponent && !showPreview && (
                        <div
                          className="absolute pointer-events-none opacity-0"
                          style={{
                            left: `${selectedComponent.position.x}px`,
                            top: `${selectedComponent.position.y}px`,
                            width: '1px',
                            height: '1px',
                          }}
                        ></div>
                      )}
                      
                      {/* Render all components in their proper positions */}
                      {components.map((component) => (
                        <React.Fragment key={component.id}>
                          {renderComponent(component)}
                        </React.Fragment>
                      ))}
                      
                      {components.length === 0 && !showPreview && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center px-4 py-2 border-2 border-dashed border-base-300 rounded-lg bg-base-200/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium" style={{ color: `${previewBackgrounds[previewBg].text}` }}>
                              Add components here
                            </p>
                            <p className="text-xs mt-1" style={{ color: `${previewBackgrounds[previewBg].text}80` }}>
                              Drag and drop or click buttons from the panel
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Direct edit hint message */}
                      {components.length > 0 && !showPreview && selectedComponent && (
                        <div className="absolute bottom-1 right-1 text-[10px] bg-primary/90 text-primary-content px-1.5 py-0.5 rounded pointer-events-none">
                          Edit Mode
                        </div>
                      )}
                    </div>
                    
                    {/* Instructions overlay when in edit mode and no components */}
                    {components.length === 0 && !showPreview && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
                        Drag components onto the notification
                      </div>
                    )}
                  </DndContext>
                </div>
              </div>
            </div>
          </div>
            
          {/* Properties panel - RIGHT COLUMN */}
          <div className="w-80 bg-base-100 rounded-lg shadow-md border border-base-300 overflow-hidden flex flex-col">
            <div className="bg-base-200 border-b border-base-300 px-4 py-3 flex justify-between items-center">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M12 2H2v10h10V2z"></path>
                  <path d="M22 12h-10v10h10V12z"></path>
                  <path d="M12 12H2v10h10V12z"></path>
                </svg>
                Style Properties
              </h3>
              {selectedComponent && (
                <div className="badge badge-sm">
                  {getComponentDisplayName(selectedComponent.type)}
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {selectedComponent ? (
                <StyleEditor 
                  component={selectedComponent} 
                  onUpdate={(updates) => {
                    handleUpdateComponent(selectedComponent.id, updates);
                  }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-base-content/40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium mb-1">No Component Selected</h4>
                  <p className="text-sm text-base-content/60 max-w-xs">
                    Select a component in the preview area to customize its appearance and behavior
                  </p>
                  
                  <div className="mt-6 bg-base-200 rounded-lg p-3 text-left w-full">
                    <h5 className="text-xs font-medium uppercase text-base-content/50 mb-2">Quick Tips</h5>
                    <ul className="text-xs space-y-1.5 text-base-content/70">
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-primary mt-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Drag components directly onto the notification</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-primary mt-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Double-click text elements to edit content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-primary mt-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Click and drag to reposition components</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Component icon renderer
function ComponentIcon({ type }: { type: string }) {
  switch (type) {
    case 'text':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
      );
    case 'image':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    case 'badge':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      );
    case 'price':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'rating':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case 'user':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case 'location':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    case 'time':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      );
  }
} 