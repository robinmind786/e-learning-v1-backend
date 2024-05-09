import { Request } from "express";

export interface IAddReviewBodyRequest extends Request {
  body: {
    review: string;
    rating: number;
    userId: string;
    courseId: string;
  };
}
