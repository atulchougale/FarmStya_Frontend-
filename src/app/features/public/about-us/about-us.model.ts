export interface AboutUsFeatureResponseDto {
  featureId: number;
  aboutUsId: number;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
}

export interface AboutUsResponseDto {
  aboutUsId: number;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  storyTitle: string;
  storyDescription: string;
  farmHouseId: number;
  features: AboutUsFeatureResponseDto[];
}