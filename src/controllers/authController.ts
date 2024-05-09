import User from "../models/user/userModel";
import Authenticator from "../services/AuthenticatorService";

const authController = new Authenticator(User);

export default authController;
