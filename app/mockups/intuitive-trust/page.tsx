'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function IntuitiveProovd() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('demo');
  const [mode, setMode] = useState('contextual');
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  if (!isHydrated) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-content text-base font-bold">P</span>
            </div>
            <span className="font-semibold text-lg ml-2">Proovd</span>
            <span className="text-sm text-gray-500 ml-2">| Intuitive Trust</span>
          </div>
          
          <Link href="/dashboard" className="btn btn-sm btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold mb-3">Intuitive Trust: Beyond Notifications</h1>
          <p className="text-gray-600 mb-4">
            A revolutionary approach that naturally integrates social proof into the customer journey
            without popups, overlays, or visual disruptions of any kind.
          </p>
          
          <div className="tabs tabs-boxed bg-gray-100 inline-flex mb-4">
            <a 
              className={`tab ${activeTab === 'demo' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('demo')}
            >
              Interactive Demo
            </a>
            <a 
              className={`tab ${activeTab === 'concept' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('concept')}
            >
              The Concept
            </a>
          </div>
        </div>
        
        {activeTab === 'demo' && (
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Mock Browser Header */}
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center text-sm text-gray-500">yourstore.com/products/premium-headphones</div>
                </div>
                
                {/* Product Page Content */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    <div className="w-full md:w-2/5">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-6xl">🎧</span>
                      </div>
                      
                      {/* Contextual Trust - Viewing Indicator */}
                      {mode === 'contextual' && (
                        <div className="mt-2 text-center">
                          <span className="text-xs text-slate-500 inline-flex items-center">
                            <svg className="w-3 h-3 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            42 people viewing this item
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="w-full md:w-3/5">
                      <h2 className="text-xl font-bold mb-2">Premium Noise-Cancelling Headphones</h2>
                      
                      <div className="flex items-center mb-4">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                            </svg>
                          ))}
                          <span className="text-gray-600 ml-2">4.8 (342 reviews)</span>
                        </div>
                        
                        {/* Natural Trust - Review Quality */}
                        {mode === 'natural' && (
                          <span className="ml-2 inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            High quality reviews
                          </span>
                        )}
                      </div>
                      
                      <div className="text-2xl font-bold mb-4">$249.99</div>
                      
                      <div className="mb-6">
                        <h3 className="font-medium mb-2">Key Features:</h3>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Active Noise Cancellation</span>
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>40-Hour Battery Life</span>
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Hi-Fi Sound with Deep Bass</span>
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Comfortable Over-Ear Design</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Add to Cart Section */}
                      <div>
                        <button className="btn btn-primary w-full mb-3">
                          Add to Cart
                        </button>
                        
                        {/* Contextual Trust - Purchase Context */}
                        {mode === 'contextual' && (
                          <div className="text-center text-xs text-slate-500 mb-3">
                            8 people added this to cart in the last hour
                          </div>
                        )}
                        
                        {/* Natural Trust - Product Guarantee */}
                        {mode === 'natural' && (
                          <div className="text-center text-xs text-slate-500 mb-3">
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Satisfaction guarantee • 30-day returns
                            </span>
                          </div>
                        )}
                        
                        {/* Integrated Trust - Implicit validation */}
                        {mode === 'integrated' && (
                          <div className="flex items-center justify-center text-xs text-slate-500 mb-3 space-x-3">
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 text-slate-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ships today
                            </span>
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 text-slate-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              342 buyers
                            </span>
                            <span className="inline-flex items-center">
                              <svg className="w-3 h-3 text-slate-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              Top rated
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center text-sm text-gray-500">
                          Free shipping • 2-year warranty
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Reviews */}
                  <div className="mt-8 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">Customer Reviews</h3>
                      
                      {/* Integrated Trust - Aggregate Review data */}
                      {mode === 'integrated' && (
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="flex items-center text-green-700">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                            92% positive
                          </span>
                          <span className="flex items-center text-blue-700">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            85 comments
                          </span>
                        </div>
                      )}
                      
                      <span className="text-sm text-blue-600">View all 342 reviews →</span>
                    </div>
                    
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <div className="font-medium">Amazing Sound Quality</div>
                            <div className="text-yellow-400 flex">★★★★★</div>
                          </div>
                          <div className="text-sm text-gray-500">2 days ago</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          The noise cancellation is incredible - I can't hear anything around me when I'm using these.
                          The sound quality is crisp and the bass is deep without being overwhelming.
                        </p>
                        <div className="mt-2 text-sm flex items-center justify-between">
                          <span className="font-medium">Michael T.</span>
                          
                          {/* Natural Trust - Review Attribution */}
                          {mode === 'natural' && (
                            <span className="inline-flex items-center text-xs text-green-700">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Verified purchase
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <div className="font-medium">Battery Life is Unmatched</div>
                            <div className="text-yellow-400 flex">★★★★★</div>
                          </div>
                          <div className="text-sm text-gray-500">1 week ago</div>
                        </div>
                        <p className="text-sm text-gray-600">
                          I've been using these for over a week and only had to charge them once.
                          The comfort is great for long listening sessions and they look stylish too.
                        </p>
                        
                        <div className="mt-2 text-sm flex items-center justify-between">
                          <span className="font-medium">Sarah K.</span>
                          
                          {/* Contextual Trust - Social Context */}
                          {mode === 'contextual' && (
                            <span className="text-xs text-gray-500">24 found this helpful</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Intuitive Trust Controls</h3>
              <p className="text-sm text-gray-600 mb-6">
                Experiment with different non-intrusive trust approaches that naturally integrate with your website design and customer journey.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Trust Strategy</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mode" 
                        value="contextual" 
                        checked={mode === 'contextual'} 
                        onChange={() => setMode('contextual')}
                        className="radio radio-sm radio-primary mr-3" 
                      />
                      <div>
                        <h5 className="font-medium text-sm">Contextual Trust</h5>
                        <p className="text-xs text-gray-500">Integrates real-time social context directly into the user's journey</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mode" 
                        value="natural" 
                        checked={mode === 'natural'} 
                        onChange={() => setMode('natural')}
                        className="radio radio-sm radio-primary mr-3" 
                      />
                      <div>
                        <h5 className="font-medium text-sm">Natural Trust Signals</h5>
                        <p className="text-xs text-gray-500">Adds subtle verification and quality indicators that feel native to the interface</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mode" 
                        value="integrated" 
                        checked={mode === 'integrated'} 
                        onChange={() => setMode('integrated')}
                        className="radio radio-sm radio-primary mr-3" 
                      />
                      <div>
                        <h5 className="font-medium text-sm">Integrated Trust Metrics</h5>
                        <p className="text-xs text-gray-500">Embeds aggregated trust data that complements existing site content</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                <div className="card bg-blue-50 border border-blue-100 p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Why This Is Revolutionary</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Unlike traditional notifications and popups, Intuitive Trust:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm text-blue-800">Never interrupts the user experience with popups</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm text-blue-800">Feels like a natural part of the website design</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm text-blue-800">Provides trust signals exactly where they're most relevant</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm text-blue-800">Enhances the decision process at critical moments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'concept' && (
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                <h3 className="text-lg font-bold mb-4">The Intuitive Trust Philosophy</h3>
                
                <div className="prose max-w-none">
                  <p>
                    Intuitive Trust represents a fundamental shift in how we think about social proof. 
                    Instead of treating trust signals as separate elements that interrupt the user experience, 
                    we integrate them naturally into the customer journey.
                  </p>
                  
                  <h4>Key Principles:</h4>
                  
                  <ol className="space-y-3">
                    <li>
                      <strong>Contextual Relevance:</strong> Trust signals appear precisely where they're most relevant to 
                      the decision-making process, not as random popups.
                    </li>
                    <li>
                      <strong>Design Cohesion:</strong> Trust elements adopt the website's existing design language, 
                      appearing as native components rather than third-party add-ons.
                    </li>
                    <li>
                      <strong>Meaningful Data:</strong> We only display information that genuinely helps users make better 
                      decisions, not arbitrary social proof for its own sake.
                    </li>
                    <li>
                      <strong>Non-Disruptive:</strong> Zero popups, notifications, or overlays that interrupt 
                      the user's natural browsing flow.
                    </li>
                  </ol>
                  
                  <h4>Why Traditional Social Proof Fails:</h4>
                  
                  <p>
                    Traditional popup notifications like "John from California just bought this" create 
                    several significant problems:
                  </p>
                  
                  <ul className="space-y-2">
                    <li>They interrupt the user flow, creating friction and frustration</li>
                    <li>They feel like marketing gimmicks, not genuine information</li>
                    <li>They compete with the website's carefully crafted design</li>
                    <li>They often contain fake or irrelevant information</li>
                    <li>They trigger notification fatigue, diminishing their effectiveness</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold mb-4">Implementation & Integration</h3>
                
                <div className="mb-4 bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  &lt;script src="https://proovd.io/intuitive-trust.js" 
                  data-site-id="YOUR_SITE_ID"
                  data-strategy="contextual"
                  data-theme="inherit"&gt;&lt;/script&gt;
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  The Intuitive Trust system analyzes your website's structure and design, then intelligently 
                  injects relevant trust signals where they make most sense in the user journey.
                </p>
                
                <h4 className="font-medium text-sm mb-2">Key Implementation Features</h4>
                
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">Auto-detects your site's design system and adapts to match</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">Uses existing DOM elements - no floating layers</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">Extremely lightweight (under 5kb)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-sm">Connects with your existing analytics to use real data</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4">Three Trust Strategies:</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Contextual Trust</h4>
                      <p className="text-sm text-gray-600">Provides social context about how other customers are engaging with the product or content in real-time, creating a sense of shared experience.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Natural Trust Signals</h4>
                      <p className="text-sm text-gray-600">Adds subtle verification and quality indicators that establish authenticity and credibility without disrupting the design.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Integrated Trust Metrics</h4>
                      <p className="text-sm text-gray-600">Embeds key aggregated data points that provide helpful context for decision-making while feeling native to the site.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Intuitive Trust Mockup - Proovd © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
} 