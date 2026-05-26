"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MapNavIcon } from "@/components/Nav/MapNavIcon";
import { PersonNavIcon } from "@/components/Nav/PersonNavIcon";
import { PhotoPrintsNavIcon } from "@/components/Nav/PhotoPrintsNavIcon";

export type BottomNavActive = "map" | "gallery" | "upload" | "profile";

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
      <span className="app-footer__label">{label}</span>
    </>
  );

  if (active) {
    return (
      <span className="app-footer__item--active" aria-current="page">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className="app-footer__item">
      {content}
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
      <span className="app-footer__upload-label">{label}</span>
    </div>
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
    <nav className="app-footer">
      <NavItem active={active === "map"} href="/" label="マップ" icon={<MapNavIcon />} />
      <NavItem
        active={active === "gallery"}
        href={galleryHref ?? "/"}
        label="ギャラリー"
        icon={<PhotoPrintsNavIcon />}
      />
      <UploadNavItem active={active === "upload"} href="/upload" label="アップロード" />
      <NavItem active={active === "profile"} href="/profile" label="プロフィール" icon={<PersonNavIcon />} />
    </nav>
  );
}
