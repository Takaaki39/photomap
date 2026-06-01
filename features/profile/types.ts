export type MyPhoto = {
  id: string;
  spot_id: string;
  spot_name: string;
  image_url: string;
  storage_url: string;
  is_public: boolean;
  created_at: string;
};

export type MeProfile = {
  display_name: string;
  username: string | null;
  bio: string | null;
  primary_location: string | null;
  avatar_url: string | null;
  email: string | null;
  member_since: string | null;
};

export type FavoriteSpot = {
  spotKey: string;
  name: string;
  region: string;
  photos: MyPhoto[];
  coverUrl: string | null;
};
