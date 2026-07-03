import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initials = (user.email ?? "AD").slice(0, 2).toUpperCase();

  return (
    <DashboardShell initials={initials} email={user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}
