/** Material map (24dp, E3E3E3) — `public/icons/`. */
export const MAP_NAV_ICON_SRC = "/icons/map_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";

export function MapNavIcon() {
  return (
    <img
      src={MAP_NAV_ICON_SRC}
      alt=""
      width={32}
      height={32}
      className="block pointer-events-none"
      aria-hidden
    />
  );
}
