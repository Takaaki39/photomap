/** Material photo_prints (24dp, E3E3E3) — `public/icons/`. ギャラリー用。 */
export const PHOTO_PRINTS_NAV_ICON_SRC =
  "/icons/photo_prints_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";

export function PhotoPrintsNavIcon() {
  return (
    <img
      src={PHOTO_PRINTS_NAV_ICON_SRC}
      alt=""
      width={32}
      height={32}
      className="block pointer-events-none"
      aria-hidden
    />
  );
}
