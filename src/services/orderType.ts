import { Request } from "express";

export interface IOrderCreateBodyRequest extends Request {
  body: {
    courseId: string;
    paymentInfo?: any;
  };
}
