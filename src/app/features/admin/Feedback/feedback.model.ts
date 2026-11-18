export interface FeedbackRequest {
  bookingId?: number;
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
