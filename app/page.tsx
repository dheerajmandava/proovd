import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar */}
      <div className="navbar bg-base-100 border-b border-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-content text-base font-bold">SP</span>
              </div>
              <span className="font-semibold text-lg">Proovd</span>
            </div>
          </div>
          <div className="flex-none hidden md:block">
            <ul className="menu menu-horizontal px-1">
              <li><Link href="/features" className="text-base-content/80 hover:text-primary">Features</Link></li>
              <li><Link href="/pricing" className="text-base-content/80 hover:text-primary">Pricing</Link></li>
              <li><Link href="/docs" className="text-base-content/80 hover:text-primary">Documentation</Link></li>
              <li><Link href="/auth/signin" className="text-base-content/80 hover:text-primary">Sign in</Link></li>
              <li><Link href="/auth/signup" className="btn btn-primary btn-sm ml-4">Sign up</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero min-h-[60vh] bg-base-100 pt-12">
        <div className="hero-content text-center">
          <div className="max-w-3xl">
            <div className="badge badge-accent badge-outline mb-6 py-3 px-4 gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
              <span className="font-medium">Now Available</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-base-content">
              Social proof that <span className="text-primary">drives conversion</span>
            </h1>
            
            <p className="text-xl text-base-content/70 mb-10 max-w-2xl mx-auto">
              Boost credibility and conversions with elegant activity notifications that showcase real user engagement
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
              <Link 
                href="/auth/signup" 
                className="btn btn-primary btn-lg"
              >
                <span>Start free trial</span>
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Link>
              <Link 
                href="/pricing" 
                className="btn btn-ghost btn-lg"
              >
                View pricing
              </Link>
            </div>
            
            <p className="text-sm text-base-content/60">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-t border-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-70">
            <span className="text-base-content/40 text-sm font-medium">TRUSTED BY INNOVATIVE TEAMS AT</span>
            <img src="/images/acme-logo.svg" alt="Acme" className="h-6" />
            <img src="/images/globex-logo.svg" alt="Globex" className="h-6" />
            <img src="/images/soylent-logo.svg" alt="Soylent" className="h-6" />
            <img src="/images/initech-logo.svg" alt="Initech" className="h-6" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-base-content">
              Designed for modern web apps
            </h2>
            <p className="text-lg text-base-content/70">
              Add social proof notifications to your site in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="card-title">Real-time Notifications</h3>
                <p className="text-base-content/70">Low-latency WebSocket notifications that render instantly to your visitors</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <h3 className="card-title">Customizable UI</h3>
                <p className="text-base-content/70">Perfectly match your brand and design aesthetic with customizable templates</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="card-title">Detailed Analytics</h3>
                <p className="text-base-content/70">Track notification performance with comprehensive metrics and insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* For Developers Section */}
      <section className="py-24 bg-base-100 relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-base-200 -z-10 rounded-l-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge badge-primary badge-outline mb-6 py-3 px-4">
                <span className="font-medium">For Developers</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-base-content">
                Built for modern development workflows
              </h2>
              <p className="text-lg text-base-content/70 mb-8">
                Designed with developer experience at the forefront. API-first, typesafe, and production-ready.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-sm mt-1">✓</div>
                  <div>
                    <h3 className="font-medium">RESTful & Realtime APIs</h3>
                    <p className="text-base-content/70 text-sm">Complete REST API with WebSocket support for real-time events</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-sm mt-1">✓</div>
                  <div>
                    <h3 className="font-medium">Framework Agnostic</h3>
                    <p className="text-base-content/70 text-sm">Ready-to-use components for React, Vue, and Angular</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="badge badge-primary badge-sm mt-1">✓</div>
                  <div>
                    <h3 className="font-medium">Edge Infrastructure</h3>
                    <p className="text-base-content/70 text-sm">CDN-distributed network for global sub-50ms response times</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <Link href="/docs" className="btn btn-link text-primary no-underline p-0">
                  View documentation
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="card bg-base-200 shadow-lg w-full">
              <div className="card-body p-4">
                <div className="mockup-code">
                  <pre data-prefix="$"><code>// Initialize Proovd</code></pre>
                  <pre data-prefix=">" className="text-success"><code>import {'{'} Proovd {'}'} from '@proovd/react';</code></pre>
                  <pre data-prefix=""><code></code></pre>
                  <pre data-prefix="$"><code>// Configure your instance</code></pre>
                  <pre data-prefix=">" className="text-success"><code>const socialProof = new Proovd({'{'}</code></pre>
                  <pre data-prefix=""><code>  apiKey: 'your_api_key',</code></pre>
                  <pre data-prefix=""><code>  position: 'bottom-left',</code></pre>
                  <pre data-prefix=""><code>  theme: 'light',</code></pre>
                  <pre data-prefix=">" className="text-success"><code>{'}'});</code></pre>
                  <pre data-prefix=""><code></code></pre>
                  <pre data-prefix="$"><code>// Show notification</code></pre>
                  <pre data-prefix=">" className="text-success"><code>socialProof.show({'{'}</code></pre>
                  <pre data-prefix=""><code>  message: 'Someone just signed up',</code></pre>
                  <pre data-prefix=""><code>  timestamp: new Date(),</code></pre>
                  <pre data-prefix=""><code>  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',</code></pre>
                  <pre data-prefix=""><code>  delay: 5000,</code></pre>
                  <pre data-prefix=">" className="text-success"><code>{'}'});</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-24 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-base-content">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Start for free, pay only for what you use. No long-term contracts or commitments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="card bg-base-100 hover:shadow-xl transition-all">
              <div className="card-body p-8">
                <h3 className="opacity-60 text-xs font-bold uppercase">Free</h3>
                <div className="my-2">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-base-content/60 ml-1">Forever free</span>
                </div>

                <p className="text-sm text-base-content/70 mb-6">Perfect for getting started and testing the waters</p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">1,000 notifications/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Basic templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Community forum access</span>
                  </div>
                </div>

                <Link href="/auth/signup" className="btn btn-outline btn-block">
                  Get started
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="card bg-base-100 shadow-xl border-2 border-primary">
              <div className="card-body p-8">
                <div className="badge badge-primary absolute -top-2 right-8">Popular</div>
                <h3 className="opacity-60 text-xs font-bold uppercase">Pro</h3>
                <div className="my-2">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-base-content/60 ml-1">per month</span>
                </div>

                <p className="text-sm text-base-content/70 mb-6">For growing businesses ready to leverage social proof</p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Unlimited notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Custom templates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Priority email support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Detailed analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">API & webhook access</span>
                  </div>
                </div>

                <Link href="/auth/signup?plan=pro" className="btn btn-primary btn-block">
                  Start 14-day trial
                </Link>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="card bg-base-100 hover:shadow-xl transition-all">
              <div className="card-body p-8">
                <h3 className="opacity-60 text-xs font-bold uppercase">Enterprise</h3>
                <div className="my-2">
                  <span className="text-3xl font-bold">Custom</span>
                  <span className="text-base-content/60 ml-1">Contact for pricing</span>
                </div>

                <p className="text-sm text-base-content/70 mb-6">For larger organizations with custom requirements</p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Dedicated account manager</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">Enterprise SLA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="badge badge-primary badge-sm mt-0.5">✓</div>
                    <span className="text-sm">On-premise deployment</span>
                  </div>
                </div>

                <Link href="/contact" className="btn btn-outline btn-block">
                  Contact sales
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-8">Frequently asked questions</h3>
            <div className="space-y-4">
              <div className="collapse collapse-arrow bg-base-100">
                <input type="radio" name="faq-accordion" checked readOnly /> 
                <div className="collapse-title font-medium">
                  How does the free tier work?
                </div>
                <div className="collapse-content"> 
                  <p className="text-base-content/70">
                    Our free tier gives you 1,000 notifications per month at no cost. No credit card required to sign up, and you can upgrade to a paid plan anytime when you need more capacity.
                  </p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100">
                <input type="radio" name="faq-accordion" /> 
                <div className="collapse-title font-medium">
                  Can I change plans later?
                </div>
                <div className="collapse-content"> 
                  <p className="text-base-content/70">
                    Yes, you can upgrade, downgrade or cancel anytime. We prorate subscriptions, so you'll only pay for what you use.
                  </p>
                </div>
              </div>
              
              <div className="collapse collapse-arrow bg-base-100">
                <input type="radio" name="faq-accordion" /> 
                <div className="collapse-title font-medium">
                  What payment methods do you accept?
                </div>
                <div className="collapse-content"> 
                  <p className="text-base-content/70">
                    We accept all major credit cards and PayPal. Enterprise customers can pay via invoice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-base-100">
        <div className="hero max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hero-content flex-col text-center p-0">
            <div className="card w-full bg-gradient-to-r from-primary to-secondary text-primary-content">
              <div className="card-body p-12">
                <h2 className="card-title text-3xl font-bold mx-auto mb-4">
                  Ready to boost your conversions?
                </h2>
                <p className="text-xl mb-10 max-w-lg mx-auto opacity-90">
                  Join thousands of companies using Proovd to build trust and increase sales
                </p>
                <div className="card-actions justify-center">
                  <Link href="/auth/signup" className="btn btn-lg glass">
                    Start your free trial
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </Link>
                  <Link href="/docs" className="btn btn-lg btn-ghost text-white border-white border hover:bg-white/10">
                    View documentation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer p-10 bg-base-200 text-base-content border-t border-base-300">
        <div className="md:place-self-center md:justify-self-start">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-content text-base font-bold">SP</span>
            </div>
            <span className="font-semibold text-lg">Proovd</span>
          </div>
          <p className="text-sm max-w-xs opacity-60">
            Modern social proof notifications designed for developers and marketers to boost trust and conversions.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="#" aria-label="Twitter" className="btn btn-circle btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
              </svg>
            </a>
            <a href="#" aria-label="GitHub" className="btn btn-circle btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="btn btn-circle btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>
        <div>
          <span className="footer-title">Product</span> 
          <Link href="/features" className="link link-hover">Features</Link>
          <Link href="/pricing" className="link link-hover">Pricing</Link>
          <Link href="/docs" className="link link-hover">Documentation</Link>
          <Link href="/changelog" className="link link-hover">Changelog</Link>
        </div> 
        <div>
          <span className="footer-title">Company</span> 
          <Link href="/about" className="link link-hover">About</Link>
          <Link href="/blog" className="link link-hover">Blog</Link>
          <Link href="/careers" className="link link-hover">Careers</Link>
          <Link href="/contact" className="link link-hover">Contact</Link>
        </div>
      </footer>
      <footer className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
        <div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <p className="text-sm">© {new Date().getFullYear()} Proovd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="link link-hover text-sm">Privacy</Link>
              <Link href="/terms" className="link link-hover text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

