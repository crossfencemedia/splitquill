import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-6 text-6xl select-none">✦</div>

      <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--sq-purple)" }}>
        Page not found
      </h1>
      <p className="text-lg text-stone-500 max-w-sm mb-8">
        This page doesn&apos;t exist. Maybe the adventure went a different way.
      </p>

      <Link
        href="/"
        className="px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-opacity hover:opacity-90"
        style={{ background: "var(--sq-purple)" }}
      >
        Back to the start
      </Link>
    </main>
  );
}
