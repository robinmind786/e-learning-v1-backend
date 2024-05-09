import { Types } from "mongoose";

export interface IUserEducation {
  name: string;
}

export interface IUserSocialProfile {
  name: string;
  url: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  fname: string;
  lname: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  protfilo?: string;
  avatar?: string;
  password?: string;
  role?: "user" | "instructor" | "admin";
  isVerified?: boolean;
  isSocial?: boolean;
  education?: IUserEducation[];
  socialProfile?: IUserSocialProfile[];
  courses?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  correctPassword?: (candidatePassword: string) => Promise<boolean>;
  signAccessToken?: () => string;
  signRefreshToken?: () => string;
  populate?: any;
}
