import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-6 text-6xl select-none" aria-hidden="true">✦</div>

      <h1 className="text-5xl font-bold mb-3" style={{ color: "var(--sq-purple)" }}>
        Splitquill
      </h1>
      <p className="text-xl text-stone-500 mb-2 italic">Branch into wonder.</p>
      <p className="text-lg text-stone-600 max-w-sm mb-10">
        A branching adventure story where your child is the hero — illustrated just for them.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="w-full py-4 rounded-2xl text-white font-semibold text-lg text-center transition-opacity hover:opacity-90"
          style={{ background: "var(--sq-purple)" }}
        >
          Start your story
        </Link>
        <Link
          href="/signin"
          className="w-full py-4 rounded-2xl text-stone-600 font-semibold text-lg text-center border border-stone-200 hover:bg-stone-50 transition-colors"
        >
          Sign in
        </Link>
      </div>

      <p className="mt-10 text-sm text-stone-500 max-w-xs">
        Faith-values-aware adventures. Your child&apos;s photo. Four unique story paths.
      </p>
    </main>
  );
}
