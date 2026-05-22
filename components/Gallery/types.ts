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

