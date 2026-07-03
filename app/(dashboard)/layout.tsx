import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DarkModeToggle from "@/components/DarkModeToggle";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initials = (user.email ?? "AD").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface-1">
      <aside className="w-[220px] shrink-0 bg-surface-2 border-r border-border flex flex-col p-4 gap-0.5">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <Image src="/logo.png" alt="Linclean Service" width={86} height={86} className="rounded-[10px]" />
        </div>

        <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted px-2 pt-3 pb-1">
          Menu
        </div>
        <NavLinks />

        <div className="mt-auto border-t border-border pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-[11px] font-medium text-primary">
                {initials}
              </div>
              <div>
                <div className="text-xs font-medium text-text-primary">Admin</div>
                <div className="text-[10px] text-text-muted truncate max-w-[100px]">{user.email}</div>
              </div>
            </div>
            <DarkModeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">{children}</main>
    </div>
  );
}
