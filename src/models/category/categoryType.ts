import { Types } from "mongoose";

export interface ICategory {
  _id?: Types.ObjectId;
  value: string;
  thumbnail?: string;
  isActive?: boolean;
}
