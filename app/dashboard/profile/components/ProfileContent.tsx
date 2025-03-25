'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Define a server-side User interface
interface ServerUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  plan: string;
  lastLogin?: string; // ISO string date
  emailNotifications: boolean;
  notificationDigest: string;
  createdAt?: string; // ISO string date
  updatedAt?: string; // ISO string date
}

interface ProfileContentProps {
  userData: ServerUser;
}

export default function ProfileContent({ userData }: ProfileContentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Only update if there are changes
      if (formData.name !== userData.name) {
        const response = await fetch('/api/user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: formData.name }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to update profile');
        }

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        router.refresh(); // Refresh the page to update server data
      } else {
        setMessage({ type: 'info', text: 'No changes to save' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the plan display label
  const getPlanLabel = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return 'Free Plan';
      case 'pro':
        return 'Pro Plan';
      case 'business':
        return 'Business Plan';
      default:
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile Information */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="avatar mb-2">
                  <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    {userData.image ? (
                      <Image
                        src={userData.image}
                        alt={userData.name}
                        width={96}
                        height={96}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-primary text-primary-content text-2xl font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  Profile image from your sign-in provider
                </span>
              </div>

              <div className="flex-1 space-y-4">
                {/* Name Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Your name"
                  />
                </div>

                {/* Email Field (read-only) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    className="input input-bordered w-full"
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">
                      Email cannot be changed
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Message display */}
            {message.text && (
              <div className={`alert ${
                message.type === 'error' ? 'alert-error' : 
                message.type === 'success' ? 'alert-success' : 
                'alert-info'
              }`}>
                <span>{message.text}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="card-actions justify-end">
              <button
                type="submit"
                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || formData.name === userData.name}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Account Information</h2>
          
          <div className="space-y-4 mt-4">
            {/* Plan Information */}
            <div className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
              <div>
                <h3 className="font-semibold">Current Plan</h3>
                <p>{getPlanLabel(userData.plan)}</p>
              </div>
              {userData.plan.toLowerCase() === 'free' && (
                <Link href="/pricing" className="btn btn-primary btn-sm">
                  Upgrade
                </Link>
              )}
            </div>

            {/* Account Details */}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <tbody>
                  <tr>
                    <td className="font-semibold">Account ID</td>
                    <td className="font-mono text-xs truncate">{userData._id}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Role</td>
                    <td className="capitalize">{userData.role}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Last Login</td>
                    <td>{userData.lastLogin ? formatDate(userData.lastLogin) : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Account Created</td>
                    <td>{formatDate(userData.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notification Preferences Link */}
            <div className="card-actions mt-6">
              <Link href="/dashboard/settings" className="btn btn-outline w-full">
                Manage Notification Preferences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 