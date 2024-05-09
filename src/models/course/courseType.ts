import { Types } from "mongoose";
import { IUser } from "../user/userType";

export interface ICourseDetails {
  title: string;
  thumbnail?: {
    public_id: string;
    url: string;
  };
  shortDescription: string;
  description: string;
  price: number;
  disPrice: number;
  duration: number;
  category: string;
  level: string;
  language: string;
  featured: boolean;
  videoLength: string;
  totalLecture: number;
  purchased: number;
  tags: string[];
  populate?: any;
}

export interface ICommentReply {
  user?: IUser;
  answer: string;
}

export interface IComment {
  _id?: Types.ObjectId;
  user?: IUser;
  question: string;
  questionReplies: ICommentReply[];
}

export interface ILink {
  title: string;
  url: string;
}

export interface IVideo {
  title: string;
  description: string;
  url: string;
  links: ILink[];
}

export interface Ilectures {
  videoUrl: IVideo[];
  videoSection: string;
  comments: IComment[];
  suggestions: string;
}

export interface IBenefits {
  title: string;
  description: string;
}

export interface IPrerequisites {
  title: string;
  description: string;
}

export interface ICourse {
  _id?: Types.ObjectId;
  courseDetails: ICourseDetails;
  lectures: Ilectures[];
  instructor: IUser;
  benefits: IBenefits[];
  prerequisites: IPrerequisites[];
  users: IUser;
  populate?: any;
}
