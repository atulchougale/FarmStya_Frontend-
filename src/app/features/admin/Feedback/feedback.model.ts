export interface FeedbackRequest {
  feedBackId: number;
  farmHouseId: number;
  review: string;
  rating: number;
}

export interface FeedbackResponse {
  feedbackId: number;
  farmHouseId: number;
  review: string;
  rating: number;
  createdBy: number;
  createdByName: string;
  createdDate: string;
}