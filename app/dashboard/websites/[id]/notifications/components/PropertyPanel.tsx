'use client';

import { useState, useEffect } from 'react';
import { ComponentProps } from './NotificationBuilder';

interface PropertyPanelProps {
  component: ComponentProps | null;
  onUpdateComponent: (props: Partial<ComponentProps>) => void;
}

export default function PropertyPanel({ 
  component, 
  onUpdateComponent 
}: PropertyPanelProps) {
  const [localState, setLocalState] = useState<Partial<ComponentProps>>({});
  
  // Reset local state when selected component changes
  useEffect(() => {
    if (component) {
      setLocalState(component);
    } else {
      setLocalState({});
    }
  }, [component]);
  
  // Handle changes to component properties
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let finalValue: any = value;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    // Handle number inputs
    if (type === 'number') {
      finalValue = parseFloat(value);
    }
    
    // Update local state
    setLocalState((prev) => ({
      ...prev,
      [name]: finalValue
    }));
    
    // Update component in parent
    onUpdateComponent({ [name]: finalValue });
  };
  
  // Render form fields for a specific component type
  const renderComponentProperties = () => {
    if (!component) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-base-content/70">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="font-medium mb-1">No Component Selected</p>
          <p className="text-sm">Select a component to edit its properties</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold border-b pb-2 mb-4">
          {getComponentTitle(component.type)} Properties
        </h3>
        
        {/* Common properties for all component types */}
        {renderCommonProperties()}
        
        {/* Component-specific properties */}
        {renderSpecificProperties()}
      </div>
    );
  };
  
  // Get title for a component type
  const getComponentTitle = (type: string): string => {
    const titles: Record<string, string> = {
      avatar: 'Avatar',
      text: 'Text',
      badge: 'Badge',
      counter: 'Counter',
      time: 'Timestamp',
      rating: 'Rating',
      progress: 'Progress',
      location: 'Location',
      price: 'Price',
    };
    
    return titles[type] || 'Component';
  };
  
  // Render common properties shared by most component types
  const renderCommonProperties = () => {
    if (!component) return null;
    
    // Different component types have different common fields
    const commonFields = [];
    
    // Most components have size
    if (['avatar', 'text', 'badge', 'counter', 'time', 'rating', 'location', 'price'].includes(component.type)) {
      commonFields.push(
        <div key="size" className="form-control">
          <label className="label">
            <span className="label-text font-medium">Size</span>
          </label>
          <select
            name="size"
            value={localState.size || 'md'}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
      );
    }
    
    // Most components have color
    if (['text', 'badge', 'counter', 'time', 'rating', 'progress', 'location', 'price'].includes(component.type)) {
      commonFields.push(
        <div key="color" className="form-control">
          <label className="label">
            <span className="label-text font-medium">Text Color</span>
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              name="color"
              value={localState.color || '#000000'}
              onChange={handleChange}
              className="input input-bordered w-12 h-10 p-1"
            />
            <input
              type="text"
              name="color"
              value={localState.color || '#000000'}
              onChange={handleChange}
              className="input input-bordered flex-grow"
            />
          </div>
        </div>
      );
    }
    
    // Many components have content
    if (['text', 'badge', 'counter', 'time', 'rating', 'location', 'price'].includes(component.type)) {
      commonFields.push(
        <div key="content" className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              {component.type === 'rating' ? 'Rating Value' : 
               component.type === 'price' ? 'Price' : 
               component.type === 'counter' ? 'Label' : 
               component.type === 'location' ? 'Location' : 
               'Content'}
            </span>
          </label>
          <input
            type="text"
            name="content"
            value={localState.content || ''}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder={getContentPlaceholder(component.type)}
          />
        </div>
      );
    }
    
    return commonFields;
  };
  
  // Get placeholder text for content field based on component type
  const getContentPlaceholder = (type: string): string => {
    const placeholders: Record<string, string> = {
      text: 'Enter text content',
      badge: 'Badge text',
      counter: 'people viewing',
      time: '2 minutes ago',
      rating: '4.5',
      location: 'New York, USA',
      price: '$149',
    };
    
    return placeholders[type] || '';
  };
  
  // Render properties specific to a component type
  const renderSpecificProperties = () => {
    if (!component) return null;
    
    switch (component.type) {
      case 'avatar':
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Image URL</span>
              </label>
              <input
                type="text"
                name="image"
                value={localState.image || ''}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Background Color</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  value={localState.backgroundColor || '#e5e7eb'}
                  onChange={handleChange}
                  className="input input-bordered w-12 h-10 p-1"
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={localState.backgroundColor || '#e5e7eb'}
                  onChange={handleChange}
                  className="input input-bordered flex-grow"
                />
              </div>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Initial/Fallback</span>
              </label>
              <input
                type="text"
                name="content"
                value={localState.content || ''}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="J"
                maxLength={2}
              />
              <label className="label">
                <span className="label-text-alt">Used when no image is available</span>
              </label>
            </div>
          </>
        );
        
      case 'badge':
      case 'price':
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Style</span>
              </label>
              <select
                name="style"
                value={localState.style || 'filled'}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="filled">Filled</option>
                <option value="outlined">Outlined</option>
                <option value="subtle">Subtle</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Background Color</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="backgroundColor"
                  value={localState.backgroundColor || '#4ade80'}
                  onChange={handleChange}
                  className="input input-bordered w-12 h-10 p-1"
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={localState.backgroundColor || '#4ade80'}
                  onChange={handleChange}
                  className="input input-bordered flex-grow"
                />
              </div>
            </div>
          </>
        );
        
      case 'counter':
        return (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Value</span>
              </label>
              <input
                type="number"
                name="value"
                value={localState.value || 42}
                onChange={handleChange}
                className="input input-bordered w-full"
                min="0"
              />
            </div>
            
            <div className="form-control">
              <label className="label flex justify-between">
                <span className="label-text font-medium">Live Updates</span>
                <input
                  type="checkbox"
                  name="isLive"
                  checked={!!localState.isLive}
                  onChange={handleChange}
                  className="toggle toggle-primary"
                />
              </label>
              <p className="text-xs text-base-content/70">
                Shows a subtle animation to suggest real-time updates
              </p>
            </div>
          </>
        );
        
      case 'progress':
        return (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Progress Value (%)</span>
            </label>
            <input
              type="range"
              name="content"
              value={localState.content || '75'}
              onChange={handleChange}
              className="range range-primary"
              min="0"
              max="100"
              step="1"
            />
            <div className="flex justify-between text-xs px-2 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        );
        
      case 'rating':
        return (
          <>
            <div className="flex -mx-1 my-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="mx-1"
                  onClick={() => {
                    onUpdateComponent({ content: value.toString() });
                    setLocalState((prev) => ({ ...prev, content: value.toString() }));
                  }}
                >
                  <span className={`text-2xl ${parseFloat(localState.content || '0') >= value ? 'text-warning' : 'text-base-300'}`}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="h-full overflow-y-auto p-1">
      {renderComponentProperties()}
    </div>
  );
} 