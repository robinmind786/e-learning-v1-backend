import { Types } from "mongoose";

export const isValidId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};
