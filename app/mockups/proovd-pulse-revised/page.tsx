'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProovdPulseRevised() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('user-view');
  const [activeContext, setActiveContext] = useState('browsing');
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  if (!isHydrated) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-content text-base font-bold">P</span>
            </div>
            <span className="font-semibold text-lg ml-2">Proovd</span>
            <span className="text-sm text-gray-500 ml-2">| ProovdPulse Revised</span>
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
          <h1 className="text-2xl font-bold mb-3">ProovdPulse: Smart Engagement Signals</h1>
          <p className="text-gray-600 mb-4">
            ProovdPulse uses real-time engagement metrics to create subtle, contextual engagement indicators
            that enhance the shopping experience without making verification claims.
          </p>
          
          <div className="tabs tabs-boxed bg-gray-100 inline-flex mb-4">
            <a 
              className={`tab ${activeTab === 'user-view' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('user-view')}
            >
              User Experience View
            </a>
            <a 
              className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard View
            </a>
          </div>
        </div>
        
        {/* User Experience View */}
        {activeTab === 'user-view' && (
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
                    <div className="w-full md:w-2/5 relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-6xl">🎧</span>
                      </div>
                      
                      {/* Activity Indicator - Always Shows */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm shadow-md text-xs px-3 py-1.5 rounded-full flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span>42 people viewing</span>
                      </div>
                      
                      {/* Focus Heatmap - For Browsing Context */}
                      {activeContext === 'browsing' && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-[40%] left-[40%] w-16 h-16 bg-red-500/30 rounded-full blur-lg"></div>
                          <div className="absolute bottom-[30%] right-[30%] w-12 h-12 bg-yellow-500/20 rounded-full blur-lg"></div>
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
                            
                            {/* Feature Interest Indicator */}
                            {activeContext === 'browsing' && (
                              <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Most viewed feature
                              </div>
                            )}
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
                      <div className="relative">
                        <button className="btn btn-primary w-full mb-3 relative">
                          Add to Cart
                          
                          {/* Cart Activity Indicator for Purchase Context */}
                          {activeContext === 'purchase' && (
                            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
                              +3
                            </span>
                          )}
                        </button>
                        
                        {/* Social Momentum Indicator */}
                        {activeContext === 'purchase' && (
                          <div className="bg-gray-50 border rounded-md p-3 text-sm mb-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Recent Activity</span>
                              <span className="text-xs text-gray-500">Last 24 hours</span>
                            </div>
                            <div className="mt-2 relative h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: '78%' }}></div>
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-gray-500">
                              <span>Added to cart: 64</span>
                              <span>Purchased: 52</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center text-sm text-gray-500">
                          Free shipping • 30-day returns • 2-year warranty
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Section - For Review Context */}
                  {activeContext === 'reviews' && (
                    <div className="mt-8 border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Customer Reviews</h3>
                        <span className="text-sm text-blue-600">View all 342 reviews →</span>
                      </div>
                      
                      {/* Reading Pattern Visualization */}
                      <div className="mb-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"></path>
                          </svg>
                          <div>
                            <div className="font-medium">Review insights</div>
                            <p>Most readers focus on sound quality and battery life mentions</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="border rounded-lg p-4 relative">
                          {/* Highlight pattern visualization */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-yellow-400/20 rounded-lg blur-sm"></div>
                          </div>
                          
                          <div className="flex justify-between mb-2 relative">
                            <div>
                              <div className="font-medium">Amazing Sound Quality</div>
                              <div className="text-yellow-400 flex">★★★★★</div>
                            </div>
                            <div className="text-sm text-gray-500">2 days ago</div>
                          </div>
                          <p className="text-sm text-gray-600 relative">
                            The noise cancellation is incredible - I can't hear anything around me when I'm using these.
                            <span className="bg-yellow-100/50 px-1">The sound quality is crisp and the bass is deep without being overwhelming.</span>
                          </p>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Michael T.</span>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4 relative">
                          {/* Highlight pattern visualization */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 w-1/2 h-8 bg-yellow-400/20 rounded-lg blur-sm"></div>
                          </div>
                          
                          <div className="flex justify-between mb-2">
                            <div>
                              <div className="font-medium">Battery Life is Unmatched</div>
                              <div className="text-yellow-400 flex">★★★★★</div>
                            </div>
                            <div className="text-sm text-gray-500">1 week ago</div>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="bg-yellow-100/50 px-1">I've been using these for over a week and only had to charge them once.</span>
                            The comfort is great for long listening sessions and they look stylish too.
                          </p>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Sarah K.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Controls Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">ProovdPulse Controls</h3>
              <p className="text-sm text-gray-600 mb-6">
                Switch between different contexts to see how ProovdPulse adapts its signals based on visitor intent.
              </p>
              
              <div className="space-y-4">
                <div className="card bg-base-100 border">
                  <div className="card-body p-4">
                    <h4 className="card-title text-base">Visitor Context</h4>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button 
                        className={`btn btn-sm ${activeContext === 'browsing' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveContext('browsing')}
                      >
                        Product Discovery
                      </button>
                      <button 
                        className={`btn btn-sm ${activeContext === 'reviews' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveContext('reviews')}
                      >
                        Reading Reviews
                      </button>
                      <button 
                        className={`btn btn-sm ${activeContext === 'purchase' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveContext('purchase')}
                      >
                        Ready to Purchase
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-base-100 border">
                  <div className="card-body p-4">
                    <h4 className="card-title text-base">How It Works</h4>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-start">
                        <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0">1</div>
                        <p className="text-sm">Our script anonymously tracks user interactions and engagement</p>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0">2</div>
                        <p className="text-sm">We identify patterns like focus areas, popular features, and activity</p>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0">3</div>
                        <p className="text-sm">We display contextual engagement cues without making verification claims</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card bg-green-50 border border-green-100">
                  <div className="card-body p-4">
                    <h4 className="card-title text-green-800 text-base">Key Benefits</h4>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        No verification claims - just real engagement metrics
                      </li>
                      <li className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Seamlessly integrated with site design
                      </li>
                      <li className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Adapts to visitor context and needs
                      </li>
                      <li className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Uses only data we can collect directly
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="grid gap-8 grid-cols-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b px-6 py-4">
                <h3 className="text-lg font-bold">ProovdPulse Analytics Dashboard</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="stat bg-base-100 border rounded-lg p-4">
                    <div className="stat-title text-xs uppercase text-gray-500">Engagement Rate</div>
                    <div className="stat-value text-2xl text-primary">76%</div>
                    <div className="stat-desc text-success text-xs flex items-center mt-1">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                      </svg>
                      21% increase
                    </div>
                  </div>
                  
                  <div className="stat bg-base-100 border rounded-lg p-4">
                    <div className="stat-title text-xs uppercase text-gray-500">Avg. Time on Product</div>
                    <div className="stat-value text-2xl text-primary">3:42</div>
                    <div className="stat-desc text-success text-xs flex items-center mt-1">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                      </svg>
                      +45 seconds
                    </div>
                  </div>
                  
                  <div className="stat bg-base-100 border rounded-lg p-4">
                    <div className="stat-title text-xs uppercase text-gray-500">Cart Add Rate</div>
                    <div className="stat-value text-2xl text-primary">24.6%</div>
                    <div className="stat-desc text-success text-xs flex items-center mt-1">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                      </svg>
                      6.2% increase
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="font-bold mb-4">Engagement Hotspots</h4>
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr>
                          <th>Element Type</th>
                          <th>Location</th>
                          <th>Engagement</th>
                          <th>Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            Product Image
                          </td>
                          <td>Top of page</td>
                          <td>82%</td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              <span>High</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Feature List
                          </td>
                          <td>Mid-page</td>
                          <td>64%</td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              <span>Medium</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            Add to Cart
                          </td>
                          <td>Bottom of page</td>
                          <td>78%</td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '95%' }}></div>
                              </div>
                              <span>Very High</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            Reviews
                          </td>
                          <td>Bottom section</td>
                          <td>59%</td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                              </div>
                              <span>Medium</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-4">Visitor Engagement Heatmap</h4>
                    <div className="bg-gray-100 rounded-lg p-4 aspect-[4/3] relative overflow-hidden">
                      {/* Simulated Heatmap */}
                      <div className="absolute inset-0 opacity-70">
                        <div className="absolute top-[30%] left-[20%] w-24 h-24 bg-red-500 rounded-full blur-xl"></div>
                        <div className="absolute bottom-[20%] right-[30%] w-32 h-20 bg-yellow-500 rounded-full blur-xl"></div>
                        <div className="absolute top-[60%] right-[20%] w-20 h-20 bg-green-500 rounded-full blur-xl"></div>
                      </div>
                      
                      {/* Page Layout Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/30 backdrop-blur-sm w-3/4 h-3/4 rounded border border-white/50 flex flex-col">
                          <div className="h-1/4 border-b border-white/50 flex items-center justify-center text-xs text-white/80">Header Area</div>
                          <div className="flex-1 flex">
                            <div className="w-2/5 border-r border-white/50 flex items-center justify-center text-xs text-white/80">Product Image</div>
                            <div className="w-3/5 flex items-center justify-center text-xs text-white/80">Product Details</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-4">A/B Testing Results</h4>
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">ProovdPulse vs. Standard Notifications</span>
                          <span className="badge badge-success">Completed</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">May 1 - May 15, 2023 • 10,532 visitors</div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm mr-4">ProovdPulse</span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                          <span className="text-sm ml-4 font-medium">24.6%</span>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                          <span className="text-sm mr-4">Standard</span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: '38%' }}></div>
                          </div>
                          <span className="text-sm ml-4 font-medium">18.4%</span>
                        </div>
                        
                        <div className="mt-4 bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                          <div className="font-medium mb-1">Result: 33.7% improvement</div>
                          <p>ProovdPulse engagement signals led to significantly higher cart adds and engagement.</p>
                        </div>
                      </div>
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
            ProovdPulse Mockup - Proovd © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
} 