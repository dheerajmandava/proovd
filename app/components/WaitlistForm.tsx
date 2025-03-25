'use client';

import { useState } from 'react';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
      console.error('Error submitting to waitlist:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-base-200 rounded-lg p-6 shadow-sm border border-base-200">
      {status === 'success' ? (
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-xl font-semibold mb-2">Thank you for joining!</h3>
          <p className="text-base-content/70">
            We'll notify you when Proovd launches.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4 text-center">Join the waitlist</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 rounded-md border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                required
              />
              {status === 'error' && (
                <p className="mt-2 text-sm text-error">{errorMessage}</p>
              )}
            </div>
            
            <button
              type="submit"
              className={`w-full bg-primary hover:bg-primary-focus text-white font-medium py-3 px-4 rounded-md transition-colors ${
                status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={status === 'loading'}
            >
              <i>{status === 'loading' ? 'Please wait...' : 'Let\'s Goooo'}</i>
            </button>
            
            <p className="mt-3 text-xs text-center text-base-content/60">
              No spam. We'll only notify you when we launch.
            </p>
          </form>
        </>
      )}
    </div>
  );
} 