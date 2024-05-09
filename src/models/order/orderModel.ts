import { Schema, model } from "mongoose";
import { IOrder } from "./orderType";

const orderSchema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    paymentInfo: {
      type: Object,
      //   required: true
    },
  },
  {
    timestamps: true,
  }
);

const Order = model<IOrder>("Order", orderSchema);
export default Order;
