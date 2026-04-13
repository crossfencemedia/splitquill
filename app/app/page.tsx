import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomePageClient from "./home-client";

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

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) {
    redirect("/app/profile/new");
  }

  return (
    <HomePageClient
      children={children}
      showLimitBanner={showLimitBanner}
    />
  );
}
