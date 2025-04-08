'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const TEMPLATE_TYPES = {
  ECOMMERCE: 'ecommerce',
  SAAS: 'saas',
  REALESTATE: 'realestate',
  URGENCY: 'urgency',
  SOCIAL: 'social',
  GEO: 'geo'
};

export default function NotificationTemplates() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATE_TYPES.ECOMMERCE);
  const [isVisible, setIsVisible] = useState(true);

  // Auto rotate through templates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setActiveTemplate(prev => {
          const types = Object.values(TEMPLATE_TYPES);
          const currentIndex = types.indexOf(prev);
          const nextIndex = (currentIndex + 1) % types.length;
          return types[nextIndex];
        });
        setIsVisible(true);
      }, 500);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <div className="flex gap-2 justify-center mb-8">
        {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
          <button 
            key={key}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setActiveTemplate(value);
                setIsVisible(true);
              }, 300);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeTemplate === value 
                ? 'bg-primary text-white' 
                : 'bg-base-200 hover:bg-base-300'
            }`}
          >
            {key.charAt(0) + key.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      
      <div className="relative h-24">
        {/* E-commerce Template */}
        {activeTemplate === TEMPLATE_TYPES.ECOMMERCE && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                  <Image 
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff" 
                    alt="Product"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">Michael from London</div>
                      <div className="text-xs text-base-content/70">just purchased Premium Running Shoes</div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">$149</div>
                  </div>
                  <div className="text-xs text-base-content/50 mt-1">2 minutes ago</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* SaaS Template */}
        {activeTemplate === TEMPLATE_TYPES.SAAS && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg p-4 max-w-sm mx-auto text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
                <div>
                  <div className="font-medium text-sm">John D. just upgraded to Pro</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-white/80">Joined 42 others this week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Real Estate Template */}
        {activeTemplate === TEMPLATE_TYPES.REALESTATE && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
              <div className="flex gap-3">
                <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                  <Image 
                    src="https://images.unsplash.com/photo-1568605114967-8130f3a36994" 
                    alt="House"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium text-sm">Sunset Villa</div>
                  <div className="text-xs text-base-content/70">
                    <span className="font-semibold">12 people</span> viewing this property now
                  </div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Hot property</span>
                    <span className="text-base-content/50 ml-2">$1.2M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Urgency Template */}
        {activeTemplate === TEMPLATE_TYPES.URGENCY && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Limited Time Offer</div>
                  <div className="text-xs text-base-content/70">
                    Only <span className="font-bold text-red-600">3 seats left</span> at this price
                  </div>
                  <div className="mt-1 flex items-center">
                    <div className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">
                      Offer expires in 2:59:13
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Social Validation Template */}
        {activeTemplate === TEMPLATE_TYPES.SOCIAL && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Rachel T.</div>
                  <div className="flex text-amber-400 my-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-xs text-base-content/70 italic">"Excellent service, highly recommend!"</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Geographical Template */}
        {activeTemplate === TEMPLATE_TYPES.GEO && (
          <div 
            className={`absolute w-full transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">New York, USA</div>
                  <div className="text-xs text-base-content/70">
                    <span className="font-semibold">32 people</span> from your area are using our service
                  </div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Near you</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 