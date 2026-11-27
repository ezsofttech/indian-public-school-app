import rawReviews from "@/public/collections/reviews.json";

export interface StaticReview {
  _id?: string;
  publicId?: string;
  reviewerName: string;
  reviewerRole?: string;
  rating?: number;
  reviewText?: string;
  isApproved?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export const staticReviews: StaticReview[] = (rawReviews as unknown as StaticReview[]).filter(
  (review) => review.isApproved !== false
);

export default staticReviews;
