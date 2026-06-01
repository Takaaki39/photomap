/** Material account_circle (24dp, E3E3E3) — `public/icons/`. */
export const ACCOUNT_CIRCLE_NAV_ICON_SRC =
  "/icons/account_circle_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";

export function AccountCircleNavIcon() {
  return (
    <img
      src={ACCOUNT_CIRCLE_NAV_ICON_SRC}
      alt=""
      width={32}
      height={32}
      className="block pointer-events-none"
      aria-hidden
    />
  );
}
