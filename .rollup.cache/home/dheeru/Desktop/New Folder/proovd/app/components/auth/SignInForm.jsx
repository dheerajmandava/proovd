'use client';
import { useState, useEffect } from 'react';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('callbackUrl')) || '/dashboard';
    // Log any errors passed in the URL
    useEffect(() => {
        const errorFromUrl = searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('error');
        if (errorFromUrl) {
            console.log('Error from URL:', errorFromUrl);
            setError(getErrorMessage(errorFromUrl));
        }
    }, [searchParams]);
    // Helper function to get user-friendly error messages
    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'CredentialsSignin':
                return 'Invalid email or password. Please check your credentials and try again.';
            case 'OAuthSignin':
            case 'OAuthCallback':
                return 'There was an error with the social sign-in. Please try again.';
            case 'SessionRequired':
                return 'You need to be signed in to access that page.';
            case 'AccessDenied':
                return 'You do not have permission to access that resource.';
            case 'CLIENT_FETCH_ERROR':
                return 'Unable to connect to the authentication service. Please check your connection and try again.';
            default:
                return `Authentication error: ${errorCode}. Please try again.`;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            console.log('Attempting to sign in with:', { email, redirect: false });
            const result = await nextAuthSignIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl,
            });
            console.log('Sign in result:', result);
            if (result === null || result === void 0 ? void 0 : result.error) {
                setError(getErrorMessage(result.error));
                setIsLoading(false);
                return;
            }
            if (result === null || result === void 0 ? void 0 : result.ok) {
                console.log('Successfully signed in, redirecting to:', callbackUrl);
                // Redirect to dashboard on success
                router.push(callbackUrl);
                router.refresh();
            }
            else {
                setError('Failed to sign in. Please try again.');
                setIsLoading(false);
            }
        }
        catch (error) {
            console.error('Sign in error:', error);
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await nextAuthSignIn('google', {
                callbackUrl
            });
            // No need to redirect here as NextAuth will handle it
        }
        catch (error) {
            console.error('Google sign in error:', error);
            setError('Failed to initialize Google sign-in. Please try again.');
            setIsLoading(false);
        }
    };
    return (<div className="flex flex-col items-center justify-center w-full max-w-md p-6">
      <div className="w-full bg-base-100 shadow-xl rounded-box p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        
        {error && (<div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>)}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input id="email" type="email" placeholder="Email" className="input input-bordered w-full" value={email} onChange={(e) => setEmail(e.target.value)} required/>
          </div>
          
          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">Password</span>
            </label>
            <input id="password" type="password" placeholder="Password" className="input input-bordered w-full" value={password} onChange={(e) => setPassword(e.target.value)} required/>
          </div>
          
          <div className="form-control mt-6">
            <button type="submit" className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="divider my-6">OR</div>
        
        <button onClick={handleGoogleSignIn} className="btn btn-outline w-full" disabled={isLoading}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>);
}
