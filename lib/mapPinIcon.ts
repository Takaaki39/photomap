import L from "leaflet";

/** ピンベース SVG（重ね合わせの土台） */
export const MAP_PIN_BASE_SRC = "/icons/mappin-base.svg";

/** ベース上に重ねるアイコン一覧。キーを変えるだけで切り替え可能 */
export const MAP_PIN_OVERLAYS = {
  /** 従来の map-pin.svg */
  default: "/map-pin.svg",
  camera: "/icons/camera.svg",
  photo: "/icons/add_photo_alternate_32dp.svg",
} as const;

export type MapPinOverlayKey = keyof typeof MAP_PIN_OVERLAYS;

/** mappin-base.svg viewBox 96×116 に合わせた表示サイズ */
export const MAP_PIN_ICON_SIZE = { width: 33, height: 40 } as const;

/** 地理座標アンカー（先端付近 x=48, y=101） */
const ANCHOR_Y = (101 * MAP_PIN_ICON_SIZE.height) / 116;

const divIconCache = new Map<MapPinOverlayKey, L.DivIcon>();

function buildPinHtml(overlaySrc: string) {
  return `<div class="map-pin-marker" aria-hidden="true">
  <img class="map-pin-marker__base" src="${MAP_PIN_BASE_SRC}" alt="" draggable="false" />
  <span class="map-pin-marker__slot">
    <img class="map-pin-marker__overlay" src="${overlaySrc}" alt="" draggable="false" />
  </span>
</div>`;
}

/** ベース + オーバーレイを HTML で重ねた Leaflet アイコン */
export function getMapPinDivIcon(overlay: MapPinOverlayKey = "default"): L.DivIcon {
  const cached = divIconCache.get(overlay);
  if (cached) return cached;

  const overlaySrc = MAP_PIN_OVERLAYS[overlay];
  const icon = L.divIcon({
    className: "map-pin-marker-wrap",
    html: buildPinHtml(overlaySrc),
    iconSize: [MAP_PIN_ICON_SIZE.width, MAP_PIN_ICON_SIZE.height],
    iconAnchor: [MAP_PIN_ICON_SIZE.width / 2, ANCHOR_Y],
    popupAnchor: [0, -ANCHOR_Y],
  });

  divIconCache.set(overlay, icon);
  return icon;
}

/** 全マーカーのアイコンを差し替える */
export function setMarkerOverlayIcon(marker: L.Marker, overlay: MapPinOverlayKey) {
  marker.setIcon(getMapPinDivIcon(overlay));
}
