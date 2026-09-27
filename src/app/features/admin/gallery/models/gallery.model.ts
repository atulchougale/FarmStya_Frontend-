export interface GalleryRequest {
  imageId: number;
  imageUrl: string;
  imageName: string;
  category: string;
  description: string;
  isFavorite: boolean;
  displayOrder: number;
  farmHouseId: number;
}

export interface GalleryResponse {
  imageId: number;
  imageUrl: string;
  imageName: string;
  category: string;
  description: string;
  displayOrder: number;
  isFavorite: boolean;
  farmHouseId: number;
  createdBy: number;
}

export interface GalleryCategory {
  label: string;
  value: string;
}