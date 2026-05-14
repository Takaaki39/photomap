/** Material person (24dp, E3E3E3) — `public/icons/`. */
export const PERSON_NAV_ICON_SRC =
  "/icons/person_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";

export function PersonNavIcon() {
  return (
    <img
      src={PERSON_NAV_ICON_SRC}
      alt=""
      width={32}
      height={32}
      className="block pointer-events-none"
      aria-hidden
    />
  );
}
