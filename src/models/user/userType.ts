import { Types } from "mongoose";

export interface IUserEducation {
  name: string;
}

export interface SocialProfile {
  url: string;
  title: string;
}

export interface IUserSocialProfile {
  facebook: SocialProfile;
  x: SocialProfile;
  github: SocialProfile;
  youtube: SocialProfile;
  instagram: SocialProfile;
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
  socialProfile?: IUserSocialProfile;
  courses?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  correctPassword?: (candidatePassword: string) => Promise<boolean>;
  signAccessToken?: () => string;
  signRefreshToken?: () => string;
  populate?: any;
}
