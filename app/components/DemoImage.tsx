'use client';

export default function DemoImage() {
  return (
    <img
      src="/images/demo.png"
      alt="SocialProofify Demo"
      className="rounded-2xl shadow-2xl w-full"
      onError={(e) => {
        e.currentTarget.src = 'https://placehold.co/1200x800/3b82f6/ffffff?text=SocialProofify+Demo';
      }}
    />
  );
} 