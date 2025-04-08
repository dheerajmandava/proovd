'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useParams, useRouter } from 'next/navigation';
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
interface NotificationTemplate {
  id?: string;
  name: string;
  websiteId: string;
  components: ComponentProps[];
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

// Update the styles at the top to include better cursor handling
const styles = `
  .grabbing-cursor, .grabbing-cursor * {
    cursor: grabbing !important;
  }
  
  .notification-component {
    position: absolute;
    cursor: grab; 
    user-select: none;
    touch-action: none;
    transition: box-shadow 0.1s ease, transform 0.1s ease;
  }
  
  .notification-component:active {
    cursor: grabbing;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 50;
  }
  
  .notification-component.dragging {
    cursor: grabbing;
    opacity: 0.9;
    z-index: 50;
    transition: none;
  }
`;

export default function NotificationBuilder({ existingTemplate }: { existingTemplate?: NotificationTemplate }) {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;

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
  
  // Define notification preview dimensions for different sizes
  const previewDimensions = {
    realestate: { 
      // Using the exact "max-w-sm" from the real estate template
      width: 384, 
      // Auto height based on content is ideal, but we need a fixed height for the builder
      height: "auto", 
      // Match the exact padding from the template
      padding: 16, // p-4
      // Match exact border and rounded styles
      borderRadius: 8, // rounded-lg
      border: "1px solid #e5e7eb", // border border-gray-200
      shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" // shadow-lg
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
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
  };
  
  // Default position
  const [notificationPosition, setNotificationPosition] = useState<keyof typeof notificationPositions>('bottom-left');

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

  // Initialize from existing template if provided
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name);
      setComponents(existingTemplate.components);
    }
  }, [existingTemplate]);

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
      const endpoint = existingTemplate?.id 
        ? `/api/websites/${websiteId}/notifications/${existingTemplate.id}`
        : `/api/websites/${websiteId}/notifications`;
      
      const method = existingTemplate?.id ? 'PUT' : 'POST';
      
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

    // Create base props WITHOUT the key
    const baseProps = {
      id: component.id,
      className: `notification-component ${isActive ? 'opacity-80' : ''} ${isSelected ? 'ring-2 ring-primary' : ''} ${isMoving ? 'dragging' : ''}`,
      style: {
        ...style,
        transform: `translate(${component.position.x}px, ${component.position.y}px)`,
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedComponent(component);
      },
      onMouseDown: (e: React.MouseEvent) => handleStartDirectMove(e, component),
      'data-draggable': 'true',
      'data-component-type': type,
      title: 'Click and drag to move',
    };

    switch (type) {
      case 'text':
        return <div key={component.id} {...baseProps}>{content}</div>;
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
        {/* Header with buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="input input-bordered w-full max-w-xs"
              placeholder="Notification Name"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
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
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Main builder interface */}
        <div className="flex gap-4 h-full">
          {/* Component palette */}
          <div className="w-64 bg-base-200 rounded-lg shadow-md p-4 flex flex-col">
            <h3 className="text-lg font-medium mb-3">Components</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(componentDefaults).map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddComponent(type)}
                  className="btn btn-sm btn-outline h-auto flex flex-col items-center py-2 gap-1"
                >
                  <ComponentIcon type={type} />
                  <span className="text-xs">{getComponentDisplayName(type)}</span>
                </button>
              ))}
            </div>
            
            <div className="divider my-3">Selected Component</div>
            
            {selectedComponent ? (
              <div className="mt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {getComponentDisplayName(selectedComponent.type)}
                  </span>
                  
                  <button 
                    className="btn btn-ghost btn-xs btn-square text-error"
                    onClick={() => handleRemoveComponent(selectedComponent.id)}
                    title="Remove component"
                  >
                    <X 
                      size={16}
                      className="cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveComponent(selectedComponent.id);
                      }}
                      style={{ userSelect: 'none' as const }}
                    />
                  </button>
                </div>
                
                <div className="text-xs text-base-content/70">
                  Position: {selectedComponent.position.x}, {selectedComponent.position.y}
                </div>
              </div>
            ) : (
              <div className="text-sm text-base-content/60 mt-2">
                No component selected. Click on a component in the preview to edit it.
              </div>
            )}
          </div>

          {/* Preview canvas */}
          <div className="flex-1 flex flex-col">
            <div className="relative bg-base-100 rounded-lg shadow-lg overflow-hidden border-2 border-base-300">
              <div className="bg-base-200 p-2 flex justify-between items-center">
                <div className="text-sm font-medium flex items-center gap-2">
                  <span>Preview</span>
                  <div className="flex border rounded overflow-hidden">
                    <button 
                      className={`px-2 py-1 text-xs ${previewBg === 'light' ? 'bg-primary text-primary-content' : 'bg-white text-gray-800'}`}
                      onClick={() => setPreviewBg('light')}
                      title="Light background"
                    >
                      Light
                    </button>
                    <button 
                      className={`px-2 py-1 text-xs ${previewBg === 'dark' ? 'bg-primary text-primary-content' : 'bg-gray-800 text-white'}`}
                      onClick={() => setPreviewBg('dark')}
                      title="Dark background"
                    >
                      Dark
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium bg-primary text-primary-content px-2 py-1 rounded">
                    Real Estate Template (max-w-sm)
                  </div>
                  <div className="text-xs text-base-content/60">
                    384px width × auto height
                  </div>
                </div>
              </div>
              
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToWindowEdges]}
              >
                <div 
                  className={`relative mx-auto flex justify-center items-center bg-white`}
                  style={{
                    width: previewDimensions[previewSize].width,
                    height: previewDimensions[previewSize].height === "auto" ? "auto" : previewDimensions[previewSize].height,
                    minHeight: 100, // Minimum height to ensure there's space for components
                    boxShadow: previewDimensions[previewSize].shadow,
                    overflow: 'hidden',
                    borderRadius: previewDimensions[previewSize].borderRadius,
                    border: previewDimensions[previewSize].border,
                    padding: previewDimensions[previewSize].padding,
                    backgroundColor: previewBackgrounds[previewBg].bg,
                    color: previewBackgrounds[previewBg].text,
                  }}
                  onClick={() => setSelectedComponent(null)}
                  onDragOver={handleNativeDragOver}
                  onDrop={handleNativeDrop}
                  onMouseDown={(e) => {
                    // If clicking directly on the container (not a component)
                    if (e.target === e.currentTarget && selectedComponent) {
                      // Calculate new position based on mouse coordinates
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      // Only update if within bounds
                      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                        // Update the selected component's position
                        setComponents(prev => 
                          prev.map(comp => {
                            if (comp.id === selectedComponent.id) {
                              return {
                                ...comp,
                                position: { x, y }
                              };
                            }
                            return comp;
                          })
                        );
                        
                        setSelectedComponent(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            position: { x, y }
                          };
                        });
                      }
                    }
                  }}
                >
                  {components.map((component) => renderComponent(component))}
                  
                  {components.length === 0 && !showPreview && (
                    <div className="absolute inset-0 flex items-center justify-center text-base-content/40">
                      <p className="text-sm text-center px-4" style={{ color: `${previewBackgrounds[previewBg].text}80` }}>
                        This is the actual notification size.<br />
                        Add components using the buttons on the left.
                      </p>
                    </div>
                  )}
                  
                  {/* Positioning help tooltip */}
                  {/* {components.length > 0 && !isDirectMoving && (
                    <div className="absolute bottom-2 right-2 text-xs bg-base-200/80 text-base-content/80 px-2 py-1 rounded-md pointer-events-none">
                      <span className="font-medium">Pro tip:</span> Just click and drag elements to move them
                    </div>
                  )} */}
                  
                  {/* Visual indicator for direct moving mode */}
                  {/* {isDirectMoving && (
                    <div className="absolute inset-0 border-2 border-primary pointer-events-none">
                      <div className="absolute top-2 left-2 bg-primary text-primary-content text-xs px-2 py-1 rounded-md">
                        Moving component with mouse - release to place
                      </div>
                    </div>
                  )} */}
                </div>
              </DndContext>
            </div>
            
            {/* Properties panel */}
            <div className="mt-4 bg-base-200 rounded-lg shadow-md p-4 max-h-[350px] overflow-y-auto">
              <StyleEditor 
                component={selectedComponent} 
                onUpdate={(updates) => {
                  if (selectedComponent) {
                    handleUpdateComponent(selectedComponent.id, updates);
                  }
                }} 
              />
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