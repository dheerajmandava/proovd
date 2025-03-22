'use client';

export default function DemoButton() {
  return (
    <button 
      className="btn btn-ghost btn-lg"
      onClick={() => {
        const demo = document.getElementById('demo');
        demo?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      Watch Demo
    </button>
  );
} 