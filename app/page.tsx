import Link from 'next/link';
import WaitlistForm from './components/WaitlistForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Minimal Header */}
      <header className="py-6 border-b border-base-200">
        
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-content text-base font-bold">P</span>
            </div>
            <span className="font-semibold text-lg">Proovd</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-6">
                Coming Soon
            </div>
            
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Visitor momentum that <span className="text-primary">drives conversion</span>
            </h1>
            
              <p className="text-lg text-base-content/70 mb-12 max-w-2xl mx-auto">
              Boost credibility and conversions with elegant activity notifications that showcase real user engagement
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-base-200 bg-base-100">
        <div className="container mx-auto px-4 text-center text-sm text-base-content/50">
          © {new Date().getFullYear()} Proovd
        </div>
      </footer>
    </div>
  );
}

