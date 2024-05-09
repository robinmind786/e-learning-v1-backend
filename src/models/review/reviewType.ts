import { ICourse } from "../course/courseType";
import { IUser } from "../user/userType";

export interface IReviewReply {
  user?: IUser;
  reply: string;
}

export interface IReview {
  user: IUser;
  course: ICourse;
  rating: number;
  review?: string;
  reviewReplies?: IReviewReply[];
  populate?: any;
}
