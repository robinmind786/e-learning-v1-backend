import { Request } from "express";
import { IUser } from "../models/user/userType";

export interface ISignupBodyRequest extends Request {
  body: IUser;
}

export interface IActivationBodyRequest extends Request {
  body: {
    activationToken: string;
    otp: string;
  };
}

export interface ISigninBodyRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface IUpdateUserBodyRequest extends Request {
  body: {
    fname: string;
    lname: string;
    email: string;
  };
}

export interface IUpdatePasswordBodyRequest extends Request {
  body: {
    oldPassword: string;
    newPassword: string;
  };
}

export interface IUpdateUserRoleBodyRequest extends Request {
  body: {
    role: "user" | "instructor" | "admin" | undefined;
  };
}

export type Role = "user" | "instructor" | "admin" | undefined;

export interface DecodedJwtPayload {
  payload: { fname: string; lname: string; email: string; password: string };
  otp: number;
}

export interface IUserOAuthRequest extends Request {
  user?: any;
  isUserDB?: IUser;
}
