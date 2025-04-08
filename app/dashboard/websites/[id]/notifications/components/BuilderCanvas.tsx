'use client';

import { useRef, useState } from 'react';
import { ComponentProps } from './NotificationBuilder';

interface BuilderCanvasProps {
  components: ComponentProps[];
  theme: 'light' | 'dark';
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  onRemoveComponent: (id: string) => void;
  onUpdateComponent: (id: string, props: Partial<ComponentProps>) => void;
}

export default function BuilderCanvas({
  components,
  theme,
  selectedComponentId,
  onSelectComponent,
  onRemoveComponent,
  onUpdateComponent
}: BuilderCanvasProps) {
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle component selection
  const handleComponentClick = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    onSelectComponent(componentId);
  };

  // Handle component removal
  const handleRemoveComponent = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    onRemoveComponent(componentId);
  };

  // Render a specific component based on its type
  const renderComponent = (component: ComponentProps) => {
    const isSelected = selectedComponentId === component.id;
    
    // Common component wrapper styles
    const wrapperClasses = `
      relative p-1 mb-2 rounded group cursor-pointer
      ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-base-300/20'}
    `;
    
    switch (component.type) {
      case 'avatar':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                ${component.size === 'sm' ? 'w-8 h-8' : component.size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}
                rounded-full overflow-hidden bg-base-300 flex-shrink-0
              `}
            >
              {component.image ? (
                <img 
                  src={component.content || component.image} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center font-bold text-base-content"
                  style={{ backgroundColor: component.backgroundColor || '#e5e7eb' }}
                >
                  {component.content?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'text':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                ${component.size === 'sm' ? 'text-xs' : component.size === 'lg' ? 'text-base font-medium' : 'text-sm'}
              `}
              style={{ color: component.color || 'inherit' }}
            >
              {component.content || 'Text content'}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'badge':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                badge 
                ${component.size === 'sm' ? 'badge-sm' : component.size === 'lg' ? 'badge-lg' : ''}
                ${component.style === 'outlined' ? 'badge-outline' : component.style === 'subtle' ? 'badge-ghost' : ''}
              `}
              style={{ 
                backgroundColor: component.style !== 'outlined' ? (component.backgroundColor || '') : undefined,
                color: component.color || 'inherit',
                borderColor: component.style === 'outlined' ? (component.color || '') : undefined
              }}
            >
              {component.content || 'Badge'}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'counter':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                ${component.size === 'sm' ? 'text-xs' : component.size === 'lg' ? 'text-base font-medium' : 'text-sm'}
                ${component.isLive ? 'animate-pulse' : ''}
              `}
              style={{ color: component.color || 'inherit' }}
            >
              <span className="font-semibold">{component.value || '42'}</span>
              {' '}{component.content || 'people viewing'}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'time':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                ${component.size === 'sm' ? 'text-xs' : component.size === 'lg' ? 'text-sm' : 'text-xs'}
                opacity-70
              `}
              style={{ color: component.color || 'inherit' }}
            >
              {component.content || '2 minutes ago'}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'rating':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => {
                const rating = parseFloat(component.content || '4.5');
                const isHalf = i + 0.5 === Math.floor(rating) + 0.5 && rating % 1 !== 0;
                const isFilled = i < Math.floor(rating);
                
                return (
                  <span 
                    key={i} 
                    className={`
                      ${component.size === 'sm' ? 'text-sm' : component.size === 'lg' ? 'text-lg' : 'text-base'}
                      ${isFilled ? 'text-warning' : 'text-base-300'}
                    `}
                  >
                    {isHalf ? '★' : isFilled ? '★' : '☆'}
                  </span>
                );
              })}
              <span className="ml-1 text-xs">
                {component.content || '4.5'}
              </span>
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'progress':
        const progressValue = parseInt(component.content || '75');
        
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div className="w-full">
              <div className="w-full bg-base-300 rounded-full h-2 mb-1">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${progressValue}%`,
                    backgroundColor: component.color || '#4ade80' 
                  }}
                ></div>
              </div>
              <div className="text-xs opacity-70">{progressValue}% complete</div>
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'location':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div className="flex items-center gap-1">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ color: component.color || 'inherit' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span 
                className={`
                  ${component.size === 'sm' ? 'text-xs' : component.size === 'lg' ? 'text-base font-medium' : 'text-sm'}
                `}
                style={{ color: component.color || 'inherit' }}
              >
                {component.content || 'New York, USA'}
              </span>
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      case 'price':
        return (
          <div 
            className={wrapperClasses}
            onClick={(e) => handleComponentClick(e, component.id)}
          >
            <div 
              className={`
                badge 
                ${component.size === 'sm' ? 'badge-sm' : component.size === 'lg' ? 'badge-lg' : ''}
                ${component.style === 'outlined' ? 'badge-outline' : component.style === 'subtle' ? 'badge-ghost' : 'badge-success'}
              `}
              style={{ 
                backgroundColor: component.style !== 'outlined' ? (component.backgroundColor || '') : undefined,
                color: component.color || 'inherit',
                borderColor: component.style === 'outlined' ? (component.color || '') : undefined
              }}
            >
              {component.content || '$149'}
            </div>
            {renderRemoveButton(component.id)}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render the remove button for a component
  const renderRemoveButton = (componentId: string) => {
    return (
      <button 
        className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-error text-error-content opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
        onClick={(e) => handleRemoveComponent(e, componentId)}
      >
        ×
      </button>
    );
  };

  // Render the notification preview
  const renderNotificationPreview = () => {
    return (
      <div 
        className={`
          p-4 rounded-lg shadow-md w-full max-w-xs mx-auto
          ${theme === 'dark' ? 'bg-neutral text-neutral-content' : 'bg-white text-base-content'}
        `}
      >
        <div className="flex flex-col space-y-2">
          {components.length > 0 ? (
            components.map((component) => (
              <div key={component.id}>
                {renderComponent(component)}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-content/50">
              <p className="mb-2">Your notification is empty</p>
              <p className="text-sm">Add components from the left panel</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={canvasRef}
      className="h-full w-full flex items-center justify-center p-6 bg-base-200 rounded-lg"
      onClick={() => onSelectComponent('')}
    >
      {renderNotificationPreview()}
    </div>
  );
} 