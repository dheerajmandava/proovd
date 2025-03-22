'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateNotificationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    
    // Get all required fields
    const name = formData.get('name') as string;
    const message = formData.get('message') as string;
    const type = formData.get('type') as string;
    const productName = formData.get('productName') as string;
    const location = formData.get('location') as string;
    const url = formData.get('url') as string;
    const status = formData.get('status') as string;
    
    // Validate required fields based on type
    if (type === 'purchase' && !productName) {
      setError('Product name is required for purchase notifications');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          message,
          type,
          productName: type === 'purchase' ? productName : undefined,
          location,
          url,
          status: status || 'active'
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create notification');
      }
      
      router.push('/dashboard/notifications');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Notification</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/dashboard/notifications">Notifications</Link></li>
            <li>Create</li>
          </ul>
        </div>
      </div>
      
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-medium">Name <span className="text-error">*</span></span>
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="Black Friday Sale Notification" 
                className="input input-bordered w-full" 
                required 
              />
              <label className="label">
                <span className="label-text-alt">A name to identify this notification (for your reference only).</span>
              </label>
            </div>
            
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-medium">Message <span className="text-error">*</span></span>
              </label>
              <input 
                type="text" 
                name="message" 
                placeholder="John from New York just purchased Product X" 
                className="input input-bordered w-full" 
                required 
              />
              <label className="label">
                <span className="label-text-alt">This is the message that will be displayed to your users.</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Type <span className="text-error">*</span></span>
                </label>
                <select 
                  name="type" 
                  className="select select-bordered w-full" 
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Select notification type</option>
                  <option value="purchase">Purchase</option>
                  <option value="signup">Sign Up</option>
                  <option value="review">Review</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Product Name <span className="text-error">*</span></span>
                </label>
                <input 
                  type="text" 
                  name="productName" 
                  placeholder="Premium Plan" 
                  className="input input-bordered w-full" 
                  required 
                />
                <label className="label">
                  <span className="label-text-alt">Required for purchase notifications.</span>
                </label>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Location <span className="text-error">*</span></span>
                </label>
                <select 
                  name="location" 
                  className="select select-bordered w-full" 
                  required
                  defaultValue="global"
                >
                  <option value="global">All Pages (Global)</option>
                  <option value="homepage">Homepage Only</option>
                  <option value="products">Product Pages Only</option>
                  <option value="checkout">Checkout Pages Only</option>
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">URL (optional)</span>
                </label>
                <input 
                  type="url" 
                  name="url" 
                  placeholder="https://your-product-page.com" 
                  className="input input-bordered w-full" 
                />
                <label className="label">
                  <span className="label-text-alt">Where users will be directed when they click on the notification.</span>
                </label>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Status <span className="text-error">*</span></span>
                </label>
                <select 
                  name="status" 
                  className="select select-bordered w-full" 
                  required
                  defaultValue="active"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="form-control mt-6">
              <div className="alert bg-base-200 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Notifications will be displayed to your users in real-time based on your settings.</span>
              </div>
            </div>
            
            <div className="card-actions justify-end mt-6">
              <Link href="/dashboard/notifications" className="btn btn-ghost">Cancel</Link>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Creating...
                  </>
                ) : 'Create Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 