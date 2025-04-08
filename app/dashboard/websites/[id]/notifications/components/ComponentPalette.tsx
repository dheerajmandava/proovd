'use client';

import React from 'react';

export type ComponentType = 'text' | 'avatar' | 'badge' | 'price' | 'counter' | 'rating' | 'progress' | 'time' | 'location';

interface ComponentPaletteProps {
  onDragStart: (type: ComponentType) => void;
}

export default function ComponentPalette({ onDragStart }: ComponentPaletteProps) {
  // Component categories with their items
  const categories = [
    {
      name: 'Basic',
      components: [
        { type: 'text' as ComponentType, label: 'Text', icon: 'text-size' },
        { type: 'avatar' as ComponentType, label: 'Avatar', icon: 'user-circle' },
        { type: 'badge' as ComponentType, label: 'Badge', icon: 'tag' },
      ]
    },
    {
      name: 'Data',
      components: [
        { type: 'price' as ComponentType, label: 'Price', icon: 'currency-dollar' },
        { type: 'counter' as ComponentType, label: 'Counter', icon: 'calculator' },
        { type: 'rating' as ComponentType, label: 'Rating', icon: 'star' },
        { type: 'progress' as ComponentType, label: 'Progress', icon: 'chart-bar' },
      ]
    },
    {
      name: 'Info',
      components: [
        { type: 'time' as ComponentType, label: 'Time', icon: 'clock' },
        { type: 'location' as ComponentType, label: 'Location', icon: 'map-pin' },
      ]
    }
  ];

  // Handle drag start event
  const handleDragStart = (type: ComponentType, event: React.DragEvent) => {
    // Set data for drag operation
    event.dataTransfer.setData('component/type', type);
    event.dataTransfer.effectAllowed = 'copy';
    
    // Call the parent handler
    onDragStart(type);
  };

  // Render an icon based on name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'text-size':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        );
      case 'user-circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'tag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'currency-dollar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'calculator':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'star':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'chart-bar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'clock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'map-pin':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4">Components</h3>
      <p className="text-sm opacity-70 mb-4">Drag or click to add components to your notification</p>
      
      <div className="flex-grow overflow-y-auto">
        {categories.map((category) => (
          <div key={category.name} className="mb-6">
            <h4 className="text-sm font-semibold mb-2">{category.name}</h4>
            <div className="grid grid-cols-1 gap-2">
              {category.components.map((component) => (
                <div
                  key={component.type}
                  className="flex items-center p-2 bg-base-100 rounded-lg shadow-sm cursor-grab hover:bg-primary hover:text-primary-content transition-colors"
                  onClick={() => onDragStart(component.type)}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(component.type, e)}
                  data-component-type={component.type}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-base-200 rounded-md mr-3">
                    {renderIcon(component.icon)}
                  </div>
                  <span className="font-medium">{component.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 