export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      spots: {
        Row: {
          id: string;
          name: string;
          location: unknown;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location: unknown;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: unknown;
          address?: string | null;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          spot_id: string;
          storage_url: string;
          thumbnail_url: string | null;
          is_public: boolean;
          taken_at: string | null;
          created_at: string;
          exif_lat: number | null;
          exif_lng: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          spot_id: string;
          storage_url: string;
          thumbnail_url?: string | null;
          is_public?: boolean;
          taken_at?: string | null;
          created_at?: string;
          exif_lat?: number | null;
          exif_lng?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          spot_id?: string;
          storage_url?: string;
          thumbnail_url?: string | null;
          is_public?: boolean;
          taken_at?: string | null;
          created_at?: string;
          exif_lat?: number | null;
          exif_lng?: number | null;
        };
      };
    };
    Functions: {
      find_nearby_spot: {
        Args: {
          lat: number;
          lng: number;
          radius_meters?: number;
        };
        Returns: {
          id: string;
          name: string;
          address: string | null;
          location: unknown;
          distance_meters: number;
        }[];
      };
    };
  };
};

export type Spot = {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
};

export type SpotCandidate = {
  latitude: number;
  longitude: number;
};

export type Photo = {
  id: string;
  userId: string;
  spotId: string;
  storageUrl: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  takenAt: string | null;
  createdAt: string;
  exifLat: number | null;
  exifLng: number | null;
};

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type SpotApiItem = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  photo_count: number;
  thumbnail_url: string | null;
};

export type SpotPhotoApiItem = {
  id: string;
  user_id: string;
  spot_id: string;
  image_url: string | null;
  storage_url: string | null;
  storage_path: string;
  is_public: boolean;
  created_at: string;
  author_name: string;
};
