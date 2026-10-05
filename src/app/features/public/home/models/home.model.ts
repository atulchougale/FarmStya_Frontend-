export interface AmenityResponseDto {
  imageId: number;
  imageUrl: string;
  title: string;
  description: string;
  isCarasoul: boolean;
  isAmenity: boolean;
  farmHouseId: number;
  userId: number;
  createdDate: string;
}

export interface CarouselResponseDto {
  imageId: number;
  imageUrl: string;
  title: string;
  description: string;
  isCarasoul: boolean;
  isAmenity: boolean;
  farmHouseId: number;
  userId: number;
  createdDate: string;
}

export interface FeedbackResponseDto {
  feedbackId: number;
  farmHouseId: number;
  review: string;
  rating: number;
  createdBy: number;
  createdByName: string;
  createdDate: string;
}

