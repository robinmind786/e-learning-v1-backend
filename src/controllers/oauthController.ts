import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/user/userType";
import User from "../models/user/userModel";
import { sessionToken } from "../utils/sessionToken";
import { catchAsync } from "../utils/catchAsync";

interface IUserOAuthRequest extends Request {
  user?: any;
  isUserDB?: IUser;
}

export const googleAuth = catchAsync(
  async (
    req: IUserOAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Extracting user data from the request object
    const {
      given_name: giveName,
      family_name: familyName,
      email,
      picture,
      email_verified: isVerified,
    } = req.user?._json;

    // Constructing user data object
    const data = {
      fname: giveName,
      lname: familyName,
      email,
      avatar: {
        url: picture,
      },
      isVerified,
      isSocial: true,
    };

    // Check if user exists in the database
    const isUserDB = await User.findOne({ email });

    // Define redirect URL
    const redirectURL = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.toString()
      : "/";

    // If user doesn't exist in the database, create a new user
    if (!isUserDB) {
      const newUser = await User.create(data);
      await sessionToken(newUser, 200, res, next, redirectURL);
    } else {
      // If user exists, generate session token
      await sessionToken(isUserDB, 200, res, next, redirectURL);
    }
  }
);

export const githubAuth = catchAsync(
  async (
    req: IUserOAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Extracting user data from the request object
    const { name, login, avatar_url: avatarURL } = req.user?._json;

    // Constructing user data object
    const data = {
      fname: name.split(" ")[0],
      lname: name.split(" ")[1],
      email: login,
      avatar: {
        url: avatarURL,
      },
      isVerified: true,
      isSocial: true,
    };

    // Check if user exists in the database
    const isUserDB = await User.findOne({ email: login });

    // Define redirect URL
    const redirectURL = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.toString()
      : "/";

    // If user doesn't exist in the database, create a new user
    if (!isUserDB) {
      const newUser = await User.create(data);
      await sessionToken(newUser, 200, res, next, redirectURL);
    } else {
      // If user exists, generate session token
      await sessionToken(isUserDB, 200, res, next, redirectURL);
    }
  }
);
