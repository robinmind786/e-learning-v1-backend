/* eslint-disable @typescript-eslint/no-unsafe-argument */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

interface PassportConfigTS {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

interface StrategiesConfig {
  google: PassportConfigTS;
  github: PassportConfigTS;
}

const strategiesConfig: StrategiesConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ??
      "http://localhost:8000/api/v1/user/auth/google/callback",
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    callbackURL:
      process.env.GITHUB_CALLBACK_URL ??
      "http://localhost:8000/api/v1/user/auth/github/callback",
  },
};

const handleAuthSuccess = (
  accessToken: string,
  refreshToken: string,
  profile: any,
  cb: any
): void => {
  const email: any = profile.emails ? profile.emails[0].value : null;
  cb(null, profile, email);
};

const initializePassport = (): void => {
  passport.use(new GoogleStrategy(strategiesConfig.google, handleAuthSuccess));
  passport.use(new GitHubStrategy(strategiesConfig.github, handleAuthSuccess));
};

export { passport, initializePassport };
