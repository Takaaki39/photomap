export type GallerySpot = {
  id: string;
  name: string;
  address: string | null;
};

export type GalleryPhoto = {
  id: string;
  image_url: string | null;
  created_at: string;
  taken_at?: string | null;
  spot_id?: string | null;
  spot_name?: string | null;
  spot_address?: string | null;
};

export type SpotDetail = GallerySpot & {
  lat: number | null;
  lng: number | null;
};

export type SpotPhoto = {
  id: string;
  user_id: string;
  image_url: string | null;
  storage_url: string | null;
  is_public: boolean;
  created_at: string;
  author_name: string;
};
