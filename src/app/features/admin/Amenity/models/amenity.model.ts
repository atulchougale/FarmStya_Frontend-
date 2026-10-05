export interface AmenityRequest {
  imageId: number;
  imageUrl: string;
  title: string;
  description: string;
  isAmenity: boolean;
  isCarasoul: boolean;
  farmHouseId: number;
}

export interface AmenityResponse {
  imageId: number;
  imageUrl: string;
  title: string;
  description: string;
  isAmenity: boolean;
  isCarasoul: boolean;
  farmHouseId: number;
  createdBy: number;
}