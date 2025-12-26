'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function NewWebsitePage() {
  const [shop, setShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic cleaning
      let cleanShop = shop.trim().toLowerCase();
      cleanShop = cleanShop.replace(/^https?:\/\//, '');
      cleanShop = cleanShop.replace(/\/$/, '');

      // Append .myshopify.com if not present
      if (!cleanShop.includes('.')) {
        cleanShop += '.myshopify.com';
      }

      // Basic validation
      if (!cleanShop.endsWith('.myshopify.com')) {
        throw new Error('Please enter a valid Shopify store domain (e.g., your-store.myshopify.com)');
      }

      // Redirect to OAuth
      window.location.href = `/api/shopify/auth?shop=${cleanShop}&websiteId=new`;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Connect Your Store</h1>
        <p className="text-base-content/70">
          Enter your Shopify store URL to install Proovd and start boosting conversions.
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-6">
              <label className="label">
                <span className="label-text font-medium">Shopify Store Domain</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingBag className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  placeholder="my-store.myshopify.com"
                  className="input input-bordered w-full pl-10"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  We'll redirect you to Shopify to approve the installation.
                </span>
              </label>
            </div>

            {error && (
              <div className="alert alert-error mb-6 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="btn btn-primary w-full gap-2"
                disabled={!shop || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Store
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <Link href="/dashboard/websites" className="btn btn-ghost w-full">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-base-content/50">
        <p>ProTip: Just enter your store name (e.g. "my-brand") and we'll handle the rest.</p>
      </div>
    </div>
  );
}