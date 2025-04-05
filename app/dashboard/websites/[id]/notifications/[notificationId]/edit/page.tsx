'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isValidUrl } from '@/app/lib/utils';
import { useUpdateNotification } from '@/app/lib/hooks';

// Define notification types
const notificationTypes = [
  { id: 'purchase', name: 'Purchase', description: 'Someone purchased a product' },
  { id: 'signup', name: 'Sign Up', description: 'Someone signed up or subscribed' },
  { id: 'custom', name: 'Custom', description: 'Custom notification with any message' },
];

// Define the form data type
interface FormData {
  name: string;
  type: string;
  location: string;
  productName: string;
  message: string;
  url: string;
  image: string;
  status: string;
  displayRules: {
    pages: string[];
    frequency: string;
    delay: number;
  }
}

export default function EditNotificationPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;
  const notificationId = params.notificationId as string;
  
  const [formData, setFormData] = useState<FormData>({
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
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  const { 
    updateNotification,
    isUpdating,
    error: updateError
  } = useUpdateNotification();

  // Fetch notification data
  useEffect(() => {
    async function fetchNotification() {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch notification');
        }
        
        const notification = await response.json();
        
        // Convert to form data format
        setFormData({
          name: notification.name || '',
          type: notification.type || 'custom',
          location: notification.displayRules?.pages?.length ? 'specific' : 'global',
          productName: notification.productName || '',
          message: notification.message || '',
          url: notification.link || '',
          image: notification.image || '',
          status: notification.status || 'active',
          displayRules: {
            pages: notification.displayRules?.pages || [],
            frequency: notification.displayRules?.frequency || 'always',
            delay: notification.displayRules?.delay || 0,
          }
        });
        
        // Set custom pages
        if (notification.displayRules?.pages?.length) {
          setCustomPages(notification.displayRules.pages.join('\n'));
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching notification:', err);
        setFetchError(err.message || 'Failed to load notification');
        setIsLoading(false);
      }
    }
    
    fetchNotification();
  }, [notificationId]);

  // Handle input changes
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

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFetchError('');

    // Validate inputs
    if (!formData.name.trim()) {
      setFetchError('Notification name is required');
      return;
    }

    if (formData.type === 'purchase' && !formData.productName.trim()) {
      setFetchError('Product name is required for purchase notifications');
      return;
    }

    if (formData.url && !isValidUrl(formData.url)) {
      setFetchError('Please enter a valid URL');
      return;
    }

    // Process pages
    let pages: string[] = [];
    if (formData.location === 'specific' && customPages.trim()) {
      pages = customPages.split('\n')
        .map(page => page.trim())
        .filter(page => page);
    }

    try {
      // Create an update payload that matches the Notification type
      const updatePayload: any = {
        name: formData.name,
        message: formData.message,
        link: formData.url, // link is used in backend, url in frontend
        image: formData.image,
        status: formData.status,
        displayRules: {
          pages,
          frequency: formData.displayRules.frequency,
          delay: formData.displayRules.delay
        }
      };
      
      // Only add these fields if they exist in the form
      if (formData.productName) {
        updatePayload.productName = formData.productName;
      }
      
      if (formData.type) {
        updatePayload.type = formData.type;
      }
      
      await updateNotification(notificationId, updatePayload);

      // Redirect to the website details page instead of notifications page
      router.push(`/dashboard/websites/${websiteId}`);
    } catch (err: any) {
      console.error('Failed to update notification:', err);
      setFetchError(err.message || 'An error occurred while updating the notification');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const error = fetchError || updateError?.message;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Edit Notification</h1>
        <p className="text-neutral-content">
          Update the details of your social proof notification
        </p>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
                disabled={isUpdating}
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
                disabled={isUpdating}
              >
                {notificationTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.description}
                  </option>
                ))}
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
                disabled={isUpdating}
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
                  disabled={isUpdating}
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
                  disabled={isUpdating}
                />
              </div>
            )}

            <div className="form-control mb-4">
              <label className="label" htmlFor="message">
                <span className="label-text font-medium">Message</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="John from New York just purchased our Premium Plan"
                className="textarea textarea-bordered h-24"
                disabled={isUpdating}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label" htmlFor="url">
                <span className="label-text font-medium">URL (Optional)</span>
              </label>
              <input
                type="text"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com/product"
                className="input input-bordered w-full"
                disabled={isUpdating}
              />
              <label className="label">
                <span className="label-text-alt">Where users will go when they click the notification</span>
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
                disabled={isUpdating}
              />
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
                disabled={isUpdating}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

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
                disabled={isUpdating}
              >
                <option value="always">Always (show every time)</option>
                <option value="once">Once per visitor</option>
                <option value="daily">Once per day</option>
              </select>
            </div>

            <div className="form-control mb-6">
              <label className="label" htmlFor="displayRules.delay">
                <span className="label-text font-medium">Display Delay (seconds)</span>
              </label>
              <input
                type="number"
                id="displayRules.delay"
                name="displayRules.delay"
                value={formData.displayRules.delay}
                onChange={handleChange}
                min="0"
                max="60"
                className="input input-bordered w-full"
                disabled={isUpdating}
              />
              <label className="label">
                <span className="label-text-alt">Wait this many seconds before showing the notification</span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <Link 
                href={`/dashboard/websites/${websiteId}`}
                className="btn btn-outline"
              >
                Cancel
              </Link>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 