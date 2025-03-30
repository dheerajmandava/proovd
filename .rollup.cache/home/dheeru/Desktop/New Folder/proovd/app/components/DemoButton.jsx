'use client';
export default function DemoButton() {
    return (<button className="btn btn-ghost btn-lg" onClick={() => {
            const demo = document.getElementById('demo');
            demo === null || demo === void 0 ? void 0 : demo.scrollIntoView({ behavior: 'smooth' });
        }}>
      Watch Demo
    </button>);
}
