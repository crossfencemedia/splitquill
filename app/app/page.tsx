import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UpgradeBanner from "./upgrade-banner";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const showLimitBanner = params?.limit_reached === '1'
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Check if they have a child profile
  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", user.id)
    .limit(1);

  if (!children || children.length === 0) {
    redirect("/app/profile/new");
  }

  const child = children[0];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-4 text-5xl select-none">✦</div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--sq-purple)" }}>
        Hi, {child.name}&apos;s family!
      </h1>
      <p className="text-stone-500 mb-10">Ready for a new adventure?</p>

      {showLimitBanner && <UpgradeBanner />}

      <Link
        href="/app/pick"
        className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-lg text-center transition-opacity hover:opacity-90"
        style={{ background: "var(--sq-purple)" }}
      >
        Start a new story
      </Link>
    </main>
  );
}
