"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AddCircleNavIcon } from "@/components/Nav/AddCircleNavIcon";
import { MapNavIcon } from "@/components/Nav/MapNavIcon";
import { PersonNavIcon } from "@/components/Nav/PersonNavIcon";
import { PhotoPrintsNavIcon } from "@/components/Nav/PhotoPrintsNavIcon";

export type BottomNavActive = "map" | "gallery" | "upload" | "profile";

const inactive =
  "flex flex-col items-center justify-center gap-0.5 px-4 py-2 text-[#6b7280] transition-colors hover:text-[#111827]";
const activePill =
  "flex flex-col items-center justify-center gap-0.5 rounded-full bg-[#bbf7d0] px-5 py-2 text-[#111827]";

type NavItemProps = {
  active: boolean;
  href: string;
  label: string;
  icon: ReactNode;
};

function NavItem({ active, href, label, icon }: NavItemProps) {
  const content = (
    <>
      {icon}
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </>
  );

  if (active) {
    return (
      <span className={activePill} aria-current="page">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={inactive}>
      {content}
    </Link>
  );
}

/** PhotoMap 共通フッターナビ: 白背景 + 緑ピルのアクティブ表示 */
export function BottomNav({
  active,
  galleryHref,
}: {
  active: BottomNavActive;
  galleryHref?: string;
}) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center justify-around border-t border-[#e5e7eb] bg-white pb-safe">
      <NavItem active={active === "map"} href="/" label="マップ" icon={<MapNavIcon />} />
      <NavItem
        active={active === "gallery"}
        href={galleryHref ?? "/"}
        label="ギャラリー"
        icon={<PhotoPrintsNavIcon />}
      />
      <NavItem active={active === "upload"} href="/upload" label="アップロード" icon={<AddCircleNavIcon />} />
      <NavItem active={active === "profile"} href="/profile" label="プロフィール" icon={<PersonNavIcon />} />
    </nav>
  );
}
