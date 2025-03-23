import SignInForm from "@/app/components/auth/SignInForm";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Proovd</h1>
          <p className="text-gray-700 opacity-80">
            Sign in to your account to access your dashboard
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center">Loading sign-in form...</div>}>
          <SignInForm />
        </Suspense>
        
        <div className="text-center mt-8">
          <p className="text-sm text-gray-700 opacity-80">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-primary hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 