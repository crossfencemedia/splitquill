"use client";

export default function UpgradeBanner() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4 text-center">
      <p className="text-purple-800 font-semibold mb-1">You&apos;ve used all your stories this month.</p>
      <p className="text-purple-600 text-sm mb-3">Upgrade to Premium for 4 stories/month.</p>
      <button
        onClick={async () => {
          const res = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier: 'premium' }),
          })
          const { url } = await res.json()
          window.location.href = url
        }}
        className="bg-[#7C3AED] text-white px-6 py-2 rounded-full text-sm font-semibold"
      >
        Upgrade to Premium — $4.99/mo
      </button>
    </div>
  );
}
