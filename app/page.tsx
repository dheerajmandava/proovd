import Link from 'next/link';
import Image from 'next/image';
import WaitlistForm from './components/WaitlistForm';
import { GoogleAnalytics } from '@next/third-parties/google'
import SampleNotification from './components/SampleNotification';
import NotificationTemplates from './components/NotificationTemplates';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Minimal Header */}
      <header className="py-6 border-b border-base-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-content text-base font-bold">P</span>
              </div>
              <span className="font-semibold text-lg">Proovd</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin" className="text-base-content/70 hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-6">
                Try Demo for free
              </div>
            
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Boost conversions with <span className="text-primary">notifications</span>
              </h1>
            
              <p className="text-lg text-base-content/70 mb-12 max-w-2xl mx-auto">
                Boost credibility and conversions with elegant activity notifications that showcase real user engagement
              </p>
            </div>
            
            <div className="max-w-md mx-auto mb-16">
              <WaitlistForm />
            </div>
          </div>
          
          {/* Live Demo Showcase */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl my-12 p-6 md:p-12 shadow-xl max-w-6xl mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl -z-10 transform -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">See It In Action</h2>
                <p className="text-lg mb-6">Proovd displays elegant notifications that show real-time activity on your website:</p>
                
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600 mt-1">✓</div>
                    <div>
                      <span className="font-medium block">Simple Custom Notifications</span>
                      <span className="text-sm text-base-content/70">Create basic notifications with your own content</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600 mt-1">✓</div>
                    <div>
                      <span className="font-medium flex items-center gap-2">
                        Event-based Notifications
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded text-[10px]">Coming Soon</span>
                      </span>
                      <span className="text-sm text-base-content/70">Display notifications based on specific events</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center text-green-600 mt-1">✓</div>
                    <div>
                      <span className="font-medium flex items-center gap-2">
                        Live Visitor Activity
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded text-[10px]">Coming Soon</span>
                      </span>
                      <span className="text-sm text-base-content/70">Show real-time browsing and engagement</span>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-8">
                  <Link href="/dashboard" className="btn btn-primary">
                    Try Demo for free
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                {/* Mockup of a website with notifications */}
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="bg-gray-800 h-6 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <div className="rounded-lg bg-indigo-50 overflow-hidden border border-indigo-100 p-2">
                      <div className="h-44 bg-white rounded">
                        {/* Example of website content */}
                        <div className="py-3 px-4 border-b">
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="p-4">
                          <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Live Sample Notification (replaces the static examples) */}
                <div className="absolute -bottom-8 -left-4">
                  <SampleNotification />
                </div>
                
                {/* Second Sample Notification (staggered) */}
                <div className="absolute top-4 -right-4">
                  <SampleNotification secondaryNotification={true} />
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="py-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Proovd?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Instant Setup</h3>
                <p className="text-base-content/70">Add one line of code to your website and start showing social proof notifications in minutes.</p>
              </div>
              
              <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
                <p className="text-base-content/70">Track impressions, clicks, and conversions to optimize your social proof strategy.</p>
              </div>
              
              <div className="bg-base-100 p-6 rounded-xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Fully Customizable</h3>
                <p className="text-base-content/70">Match your brand with custom styles, positions, timing, and notification content.</p>
              </div>
            </div>
          </div>
          
          {/* Product Roadmap Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 py-16 my-8 rounded-2xl">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4">Product Roadmap</h2>
              <p className="text-center text-base-content/70 max-w-2xl mx-auto mb-12">
                We're actively developing new features to enhance your social proof capabilities:
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Real-Time Integrations</h3>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <p className="text-base-content/70">Connect with Shopify, WooCommerce, and Stripe to display actual purchase activity.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Advanced Templates</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">In Development</span>
                  </div>
                  <p className="text-base-content/70">More notification types and design options for various user actions and events.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Events API</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Planned</span>
                  </div>
                  <p className="text-base-content/70">Custom JavaScript API to track and display real-time user actions on your website.</p>
                </div>
              </div>
              
              <div className="mt-10 text-center">
                <Link href="/contact" className="btn btn-outline btn-primary">
                  Join Early Access Program
                </Link>
              </div>
            </div>
          </div>
          
          {/* Template Showcase Section */}
          <div className="py-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Notification Templates</h2>
            <p className="text-center text-base-content/70 max-w-2xl mx-auto mb-12">
              Choose from a variety of notification styles to match your brand and goals
            </p>
            
            <NotificationTemplates />
            
            <div className="mt-16 text-center">
              <p className="mb-6 text-base-content/70">
                Ready to boost conversions with social proof?
              </p>
              <Link href="/auth/signup" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
            </div>
          </div>
          
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-base-200 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-content text-xs font-bold">P</span>
              </div>
              <span className="font-semibold">Proovd</span>
            </div>
            
            <div className="flex gap-6 text-sm text-base-content/70">
              <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            
            <div className="text-sm text-base-content/50 mt-4 md:mt-0">
              © {new Date().getFullYear()} Proovd
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

