'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isValidUrl } from '@/app/lib/utils';
import NotificationBuilder, { NotificationConfig } from '../components/NotificationBuilder';

// Define notification modes
type NotificationMode = 'simple' | 'builder';

export default function NewNotificationPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;
  
  // State to track which mode is active (simple form or advanced builder)
  const [mode, setMode] = useState<NotificationMode>('simple');
  
  // State for the simple form
  const [formData, setFormData] = useState({
    name: '',
    type: 'purchase',
    location: 'global',
    productName: '',
    message: '',
    url: '',
    image: '',
    status: 'active',
    displayRules: {
      pages: [],
      frequency: 'always',
      delay: 0,
    }
  });
  
  const [customPages, setCustomPages] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes for simple form
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., displayRules.frequency)
      const [parent, child] = name.split('.');
      
      if (parent === 'displayRules') {
        setFormData(prev => ({
          ...prev,
          displayRules: {
            ...prev.displayRules,
            [child]: child === 'delay' ? Number(value) : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  // Handle form submission for simple mode
  async function handleSubmitSimple(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!formData.name.trim()) {
      setError('Notification name is required');
      return;
    }

    if (formData.type === 'purchase' && !formData.productName.trim()) {
      setError('Product name is required for purchase notifications');
      return;
    }

    if (formData.url && !isValidUrl(formData.url)) {
      setError('Please enter a valid URL');
      return;
    }

    // Process pages
    let pages: string[] = [];
    if (formData.location === 'specific' && customPages.trim()) {
      pages = customPages.split('\n')
        .map(page => page.trim())
        .filter(page => page);
    }

    // Start submission
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/websites/${websiteId}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          displayRules: {
            ...formData.displayRules,
            pages
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      // Redirect to the website details page
      router.push(`/dashboard/websites/${websiteId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the notification');
      setIsSubmitting(false);
    }
  }
  
  // Handle builder notification save
  async function handleSaveBuilderNotification(config: NotificationConfig) {
    setError('');
    setIsSubmitting(true);
    
    try {
      // Convert builder config to API format
      const notificationData = {
        name: config.name,
        type: 'custom',
        status: 'active',
        // Extract main text from components if available
        message: config.components.find(c => c.type === 'text')?.content || '',
        // Extract image from avatar if available
        image: config.components.find(c => c.type === 'avatar')?.image || '',
        location: 'global',
        displayRules: {
          frequency: config.displayRules.frequency,
          delay: config.displayRules.delay,
          pages: config.displayRules.pages,
        },
        // Store the full builder config as a JSON string in a custom field
        builderConfig: JSON.stringify(config),
        theme: config.theme,
        position: config.position,
        animation: config.animation,
        displayDuration: config.displayDuration,
      };
      
      const response = await fetch(`/api/websites/${websiteId}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      // Redirect to the website details page
      router.push(`/dashboard/websites/${websiteId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the notification');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Add New Notification</h1>
        <p className="text-neutral-content">
          Create a new social proof notification for your website
        </p>
      </div>
      
      {/* Mode selector */}
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Choose Creation Method</h2>
          
          <div className="tabs tabs-boxed">
            <a 
              className={`tab ${mode === 'simple' ? 'tab-active' : ''}`}
              onClick={() => setMode('simple')}
            >
              Simple Form
            </a>
            <a 
              className={`tab ${mode === 'builder' ? 'tab-active' : ''}`}
              onClick={() => setMode('builder')}
            >
              Visual Builder
            </a>
          </div>
          
          <div className="mt-4">
            {mode === 'simple' ? (
              <p className="text-sm text-base-content/70">
                <strong>Simple Form:</strong> Quickly create basic notifications with a simple form.
              </p>
            ) : (
              <p className="text-sm text-base-content/70">
                <strong>Visual Builder:</strong> Create custom notifications with a drag-and-drop interface.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Show the appropriate editor based on mode */}
      {mode === 'simple' ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <form onSubmit={handleSubmitSimple}>
              <div className="form-control mb-4">
                <label className="label" htmlFor="name">
                  <span className="label-text font-medium">Notification Name</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Black Friday Sale"
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <label className="label">
                  <span className="label-text-alt">For your reference only</span>
                </label>
              </div>

              <div className="form-control mb-4">
                <label className="label" htmlFor="type">
                  <span className="label-text font-medium">Notification Type</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
                >
                  <option value="purchase">Purchase - Someone purchased a product</option>
                  <option value="signup">Sign Up - Someone signed up or subscribed</option>
                  <option value="custom">Custom - Custom notification with any message</option>
                </select>
              </div>

              <div className="form-control mb-4">
                <label className="label" htmlFor="location">
                  <span className="label-text font-medium">Display Location</span>
                </label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
                >
                  <option value="global">All Pages</option>
                  <option value="specific">Specific Pages</option>
                </select>
              </div>

              {formData.location === 'specific' && (
                <div className="form-control mb-4">
                  <label className="label" htmlFor="pages">
                    <span className="label-text font-medium">Specific Pages</span>
                  </label>
                  <textarea
                    id="pages"
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    placeholder="Enter each URL or path on a new line&#10;e.g., /products&#10;https://example.com/about"
                    className="textarea textarea-bordered h-24"
                    disabled={isSubmitting}
                  />
                  <label className="label">
                    <span className="label-text-alt">Enter one URL per line</span>
                  </label>
                </div>
              )}

              {formData.type === 'purchase' && (
                <div className="form-control mb-4">
                  <label className="label" htmlFor="productName">
                    <span className="label-text font-medium">Product Name</span>
                  </label>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    placeholder="Premium Plan"
                    className="input input-bordered w-full"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="form-control mb-4">
                <label className="label" htmlFor="message">
                  <span className="label-text font-medium">
                    {formData.type === 'custom' ? 'Message' : 'Additional Message (Optional)'}
                  </span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={
                    formData.type === 'custom'
                      ? 'John just joined our community!'
                      : 'Add additional context (optional)'
                  }
                  className="textarea textarea-bordered h-20"
                  disabled={isSubmitting}
                  required={formData.type === 'custom'}
                />
              </div>

              <div className="form-control mb-4">
                <label className="label" htmlFor="url">
                  <span className="label-text font-medium">Destination URL (Optional)</span>
                </label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com/product-page"
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <label className="label">
                  <span className="label-text-alt">Where users will go when clicking the notification</span>
                </label>
              </div>

              <div className="form-control mb-4">
                <label className="label" htmlFor="image">
                  <span className="label-text font-medium">Image URL (Optional)</span>
                </label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <label className="label">
                  <span className="label-text-alt">Avatar image URL (we'll use a default if not provided)</span>
                </label>
              </div>

              <div className="form-control mb-4">
                <label className="label" htmlFor="status">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <h3 className="font-bold text-lg mt-8 mb-4">Display Settings</h3>

              <div className="form-control mb-4">
                <label className="label" htmlFor="displayRules.frequency">
                  <span className="label-text font-medium">Display Frequency</span>
                </label>
                <select
                  id="displayRules.frequency"
                  name="displayRules.frequency"
                  value={formData.displayRules.frequency}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
                >
                  <option value="always">Always (show every time)</option>
                  <option value="once">Once per visitor</option>
                  <option value="daily">Once per day</option>
                </select>
              </div>

              <div className="form-control mb-6">
                <label className="label" htmlFor="displayRules.delay">
                  <span className="label-text font-medium">Delay (seconds)</span>
                </label>
                <input
                  type="number"
                  id="displayRules.delay"
                  name="displayRules.delay"
                  value={formData.displayRules.delay}
                  onChange={handleChange}
                  min="0"
                  max="300"
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <label className="label">
                  <span className="label-text-alt">How long to wait before showing this notification (0-300 seconds)</span>
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <Link href={`/dashboard/websites/${websiteId}`} className="btn btn-outline">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <NotificationBuilder 
          websiteId={websiteId}
          onSave={handleSaveBuilderNotification}
        />
      )}
    </div>
  );
} 