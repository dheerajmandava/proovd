import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getServerSideWebsites } from '@/app/lib/server/data-fetchers';
import CodeSection from '@/app/dashboard/components/CodeSection';
export default async function EventsPage() {
    var _a;
    // Get the session and user data
    const session = await auth();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        redirect('/auth/signin');
    }
    // Fetch websites
    const websites = await getServerSideWebsites();
    if (websites.length === 0) {
        redirect('/dashboard/websites/new');
    }
    // Get the first website ID for examples
    const websiteId = websites[0]._id.toString();
    return (<div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Event Tracking</h1>
        <p className="text-base-content/70">
          Track user activity on your website to generate social proof notifications automatically.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <div className="col-span-2">
          {/* Installation Guide */}
          <div className="card bg-base-200 shadow-sm mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">How to Install</h2>
              <p className="mb-4">
                Add the following script tag to your website to enable event tracking:
              </p>
              
              <CodeSection code={`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.proovd.in'}/api/cdn/events-sdk/${websiteId}.js"></script>`} language="html"/>
              
              <p className="mt-4 text-sm text-base-content/70">
                Place this script in the <code>&lt;head&gt;</code> section of your website.
                It will automatically track page views and set up the tracking tools.
              </p>
            </div>
          </div>
          
          {/* Usage Guide */}
          <div className="card bg-base-200 shadow-sm mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Tracking Events</h2>
              <p className="mb-4">
                After installing the script, you can track different types of events:
              </p>
              
              {/* Signup Example */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Track Signups</h3>
                <CodeSection code={`// When a user signs up
proovdEvents.trackSignup({
  name: "John Doe",
  email: "john@example.com", // Optional
  location: "New York" // Optional
});`} language="javascript"/>
              </div>
              
              {/* Purchase Example */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Track Purchases</h3>
                <CodeSection code={`// When a user makes a purchase
proovdEvents.trackPurchase({
  productName: "Premium Plan",
  productId: "plan-123", // Optional
  price: 49.99, // Optional
  currency: "USD", // Optional
  userName: "Jane Smith" // Optional
});`} language="javascript"/>
              </div>
              
              {/* Custom Example */}
              <div>
                <h3 className="font-semibold mb-2">Track Custom Events</h3>
                <CodeSection code={`// Track any custom event
proovdEvents.trackCustom("Download", {
  fileName: "ebook.pdf",
  category: "Marketing Guide"
});`} language="javascript"/>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar with Benefits */}
        <div>
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Benefits</h2>
              
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-primary text-primary-content rounded-full p-1 w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Automatic Notifications</h3>
                    <p className="text-sm text-base-content/70">Events are automatically converted into social proof notifications.</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-primary text-primary-content rounded-full p-1 w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Updates</h3>
                    <p className="text-sm text-base-content/70">Visitors see activity as it happens on your website.</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-primary text-primary-content rounded-full p-1 w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Build Trust</h3>
                    <p className="text-sm text-base-content/70">Show genuine activity to boost visitor confidence.</p>
                  </div>
                </li>
                
                <li className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-primary text-primary-content rounded-full p-1 w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Increase Conversions</h3>
                    <p className="text-sm text-base-content/70">Drive more sales with social proof notifications.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
