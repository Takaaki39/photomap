"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MapNavIcon } from "@/shared/ui/Nav/MapNavIcon";
import { PersonNavIcon } from "@/shared/ui/Nav/PersonNavIcon";

export type BottomNavActive = "map" | "upload" | "profile" | "none";

type NavItemProps = {
  active: boolean;
  href: string;
  label: string;
  icon: ReactNode;
};

function NavItem({ active, href, label, icon }: NavItemProps) {
  if (active) {
    return (
      <span className="app-footer__item--active" aria-current="page" aria-label={label}>
        {icon}
      </span>
    );
  }

  return (
    <Link href={href} className="app-footer__item" aria-label={label}>
      {icon}
    </Link>
  );
}

function UploadNavItem({ active, href, label }: Omit<NavItemProps, "icon">) {
  const fab = (
    <img
      src="/icons/add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"
      alt=""
      width={24}
      height={24}
      className="app-footer__upload-icon"
      aria-hidden
    />
  );

  return (
    <div className={`app-footer__upload-slot${active ? " app-footer__upload-slot--active" : ""}`}>
      {active ? (
        <span className="app-footer__upload" aria-current="page" aria-label={label}>
          {fab}
        </span>
      ) : (
        <Link href={href} className="app-footer__upload" aria-label={label}>
          {fab}
        </Link>
      )}
    </div>
  );
}

/** PhotoMap 共通フッターナビ（アイコンのみ） */
export function BottomNav({
  active,
}: {
  active: BottomNavActive;
}) {
  return (
    <nav className="app-footer" aria-label="メインナビゲーション">
      <NavItem active={active === "map"} href="/" label="マップ" icon={<MapNavIcon />} />
      <UploadNavItem active={active === "upload"} href="/upload" label="アップロード" />
      <NavItem active={active === "profile"} href="/profile" label="プロフィール" icon={<PersonNavIcon />} />
    </nav>
  );
}
