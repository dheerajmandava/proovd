'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SignUpClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
    general?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Clear errors when user types
    setErrors(prev => ({ ...prev, [name]: undefined }));
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
      isValid = false;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Register the user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.provider === 'google') {
          // Special case: account exists with Google
          setErrors({
            general: data.message || 'This email is already registered using Google. Please sign in with Google.'
          });
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      setSuccess('Account created successfully! Signing you in...');
      
      // Log the newly created user
      console.log('User registration successful:', data.user);
      
      // Sign in the user automatically after successful registration
      setTimeout(async () => {
        try {
          console.log(`Attempting to sign in with email: ${formData.email.trim().toLowerCase()}`);
          
          const result = await signIn('credentials', {
            redirect: false,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            callbackUrl: '/dashboard'
          });

          if (result?.error) {
            console.error('Sign-in error after registration:', result.error);
            setErrors({ 
              general: `Failed to sign in after registration: ${result.error}. Please sign in manually.` 
            });
            setIsLoading(false);
            return;
          }

          console.log('Auto sign-in successful, redirecting to dashboard');
          // Redirect to dashboard on success
          router.push('/dashboard');
        } catch (error) {
          console.error('Exception during auto sign-in:', error);
          setErrors({ general: 'Failed to sign in after registration. Please sign in manually.' });
          setIsLoading(false);
        }
      }, 3000); // Increased timeout to give database more time
      
    } catch (err: any) {
      setErrors({ general: err.message || 'Something went wrong' });
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    signIn('google', { callbackUrl });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-12">
      <div className="card max-w-md w-full bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <Link href="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-2">
              <div className="mask mask-squircle bg-primary w-10 h-10 flex items-center justify-center">
                <span className="text-primary-content text-lg font-bold">SP</span>
              </div>
              Proovd
            </Link>
            <h1 className="text-2xl font-bold mt-4">Create an account</h1>
            <p className="text-sm opacity-70 mt-2">
              Join thousands of marketers using social proof to boost conversions
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="alert alert-error mb-6 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="alert alert-success mb-6 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="text-error text-xs mt-1">{errors.password}</span>}
              <label className="label">
                <span className="label-text-alt text-base-content/70">Must be at least 8 characters with uppercase, lowercase, and numbers</span>
              </label>
            </div>

            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
              </div>
              {errors.confirmPassword && <span className="text-error text-xs mt-1">{errors.confirmPassword}</span>}
            </div>

            <div className="form-control mb-6">
              <label className="cursor-pointer label justify-start gap-3">
                <input 
                  type="checkbox" 
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className={`checkbox checkbox-primary ${errors.agreeToTerms ? 'checkbox-error' : ''}`} 
                />
                <span className="label-text text-sm">
                  I agree to the <Link href="/terms" className="link link-primary">Terms of Service</Link> and <Link href="/privacy" className="link link-primary">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreeToTerms && <span className="text-error text-xs mt-1">{errors.agreeToTerms}</span>}
            </div>

            <div className="form-control mb-6">
              <button 
                type="submit" 
                className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="divider text-base-content/50 text-xs">OR SIGN UP WITH</div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="btn btn-outline w-full flex items-center gap-2"
              disabled={isLoading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-base-content/70">
              Already have an account?{" "}
              <Link href="/auth/signin" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 