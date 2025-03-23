'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('docs');
  
  const faqs = [
    {
      question: "How do I add a new website?",
      answer: "Go to the Websites page from the sidebar and click the 'Add Website' button. Fill in your website details and submit the form. Once added, you'll need to verify your domain ownership before creating notifications."
    },
    {
      question: "How do I verify my website?",
      answer: "After adding your website, you'll be guided through the verification process. You can either add a meta tag to your website's HTML or upload a verification file to your domain. Once verified, you can start creating notifications."
    },
    {
      question: "How do notifications appear on my website?",
      answer: "Notifications appear as small pop-up cards in the position you specify in your website settings (top-left, top-right, bottom-left, or bottom-right). They show according to the timing and display settings you configure."
    },
    {
      question: "Can I customize the appearance of notifications?",
      answer: "Yes, you can customize the position, theme (light or dark), display duration, and delay between notifications in your website settings. Further styling options are available in the notification creation form."
    },
    {
      question: "How do I track the performance of my notifications?",
      answer: "Each website has an Analytics tab that shows impressions, clicks, and conversion rates. You can view overall statistics or drill down to individual notification performance."
    },
    {
      question: "What is the website ID used for?",
      answer: "The website ID is a unique identifier for your website in the Proovd system. It's required when implementing the notification widget on your site and is used to authenticate requests to our API."
    },
    {
      question: "How do I install the notification widget on my website?",
      answer: "Go to your website's setup page and copy the installation code. Add this script tag to your website's HTML, preferably just before the closing </body> tag: <code>&lt;script src=\"https://cdn.proovd.in/w/YOUR_WEBSITE_ID.js\"&gt;&lt;/script&gt;</code>. The widget will automatically load and display your notifications."
    },
    {
      question: "Can I limit which domains display my notifications?",
      answer: "Yes, in your website settings, you can specify allowed domains. This helps prevent unauthorized use of your notifications on other websites."
    }
  ];
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li>Help</li>
          </ul>
        </div>
      </div>
      
      <div className="tabs tabs-boxed bg-base-200 mb-6">
        <a 
          className={`tab ${activeTab === 'faq' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
          FAQ
        </a>
        <a 
          className={`tab ${activeTab === 'docs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          Documentation
        </a>
        <a 
          className={`tab ${activeTab === 'support' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
          Support
        </a>
      </div>
      
      {activeTab === 'faq' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-6">Frequently Asked Questions</h2>
            
            <div className="join join-vertical w-full">
              {faqs.map((faq, index) => (
                <div key={index} className="collapse collapse-arrow join-item border-b border-base-200">
                  <input type="radio" name="faq-accordion" defaultChecked={index === 0} /> 
                  <div className="collapse-title text-lg font-medium">
                    {faq.question}
                  </div>
                  <div className="collapse-content">
                    <p className="text-base-content/80" dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Can't find an answer? Check our <button className="underline font-medium" onClick={() => setActiveTab('docs')}>documentation</button> or <button className="underline font-medium" onClick={() => setActiveTab('support')}>contact support</button>.</span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'docs' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-6">Documentation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-start">
                    <BookOpenIcon className="w-8 h-8 text-primary mr-4" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Getting Started Guide</h3>
                      <p className="text-base-content/80 mb-4">Learn the basics of Proovd and set up your first notification in minutes.</p>
                      <Link href="/dashboard/docs/getting-started" className="btn btn-primary btn-sm">Read Guide</Link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-start">
                    <AcademicCapIcon className="w-8 h-8 text-primary mr-4" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Documentation</h3>
                      <p className="text-base-content/80 mb-4">Technical documentation for developers to integrate Proovd into their applications.</p>
                      <Link href="/dashboard/docs/api" className="btn btn-primary btn-sm">View API Docs</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'support' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-6">Contact Support</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="text-lg font-medium mb-4">Email Support</h3>
                  <p className="text-base-content/80 mb-4">
                    Send us an email and we'll get back to you within 24 hours.
                  </p>
                  <a 
                    href="mailto:proovdbusiness@gmail.com" 
                    className="btn btn-primary gap-2"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    Email Support
                  </a>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="text-lg font-medium mb-4">Live Chat</h3>
                  <p className="text-base-content/80 mb-4">
                    Chat with our support team in real-time during business hours.
                  </p>
                  <button 
                    className="btn btn-primary gap-2"
                    onClick={() => alert('Live chat feature coming soon!')}
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
            
            <div className="divider my-8">Or submit a support ticket</div>
            
            <form onSubmit={(e) => { e.preventDefault(); alert('Support ticket submitted!'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input type="text" className="input input-bordered" />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input type="email" className="input input-bordered" />
                </div>
              </div>
              
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Subject</span>
                </label>
                <input type="text" className="input input-bordered" />
              </div>
              
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Message</span>
                </label>
                <textarea className="textarea textarea-bordered h-32"></textarea>
              </div>
              
              <div className="form-control">
                <button type="submit" className="btn btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 