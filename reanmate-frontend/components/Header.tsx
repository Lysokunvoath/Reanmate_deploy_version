"use client";

import { usePathname } from "next/navigation";
import SiteNavbar from "@/components/SiteNavbar";

/** In-app header — thin wrapper so existing imports keep working */
export default function Header({ gradeLabel }: { gradeLabel?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <SiteNavbar
      variant="app"
      homeHref={isAdmin ? "/admin" : "/home"}
      gradeLabel={gradeLabel}
      isAdmin={isAdmin}
      homeActive={!isAdmin && pathname === "/home"}
    />
  );
}
