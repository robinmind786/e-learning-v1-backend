import { check, ValidationChain } from "express-validator";

interface ValidationMiddleware {
  userSignupSchema: ValidationChain[];
  userActivation: ValidationChain[];
  userSigninSchema: ValidationChain[];
  socialAuthSchema: ValidationChain[];
  userUpdatSchema: ValidationChain[];
  updateUserPasswordSchema: ValidationChain[];
  forgotUserPassword: ValidationChain[];
  resetUserPassword: ValidationChain[];
  userRoleUpdate: ValidationChain[];
  courseCreateSchema: ValidationChain[];
  courseUpdateSchema: ValidationChain[];
  questionValidationSchema: ValidationChain[];
  answerValidationSchema: ValidationChain[];
  reviewValidationSchema: ValidationChain[];
  replyReviewValidationSchema: ValidationChain[];
}
const userSignupSchema: ValidationChain[] = [
  check("fname")
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 32 })
    .withMessage("Last name should be between 2 and 32 characters"),
  check("lname")
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 32 })
    .withMessage("Last name should be between 2 and 32 characters"),
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address."),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage(
      "Password must include at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters long."
    ),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match."),
];

const userActivation: ValidationChain[] = [
  check("otp")
    .notEmpty()
    .withMessage(
      "Verification code is required. Please enter the code to proceed."
    ),
  check("activationToken")
    .notEmpty()
    .withMessage(
      "Activation Token is required. Please provide the necessary details to complete the activation."
    ),
];

const userSigninSchema: ValidationChain[] = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address."),

  check("password").notEmpty().withMessage("Password is required"),
];

const socialAuthSchema: ValidationChain[] = [
  check("name")
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 3, max: 32 })
    .withMessage("Name should be between 3 and 32 characters"),
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address."),
];

const userUpdatSchema: ValidationChain[] = [
  check("fname")
    .optional()
    .isLength({ min: 2, max: 32 })
    .withMessage("First name should be between 2 and 32 characters"),
  check("lname")
    .optional()
    .isLength({ min: 2, max: 32 })
    .withMessage("Last name should be between 2 and 32 characters"),
  check("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address."),
];

const updateUserPasswordSchema: ValidationChain[] = [
  check("oldPassword").notEmpty().withMessage("Old password is required"),
  check("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage(
      "New password must include at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters long."
    ),
  check("confirmNewPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match.")
    .custom((value, { req }) => value !== req.body.oldPassword)
    .withMessage("New password must be different from the old password."),
];

const forgotUserPassword: ValidationChain[] = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address."),
];

const resetUserPassword: ValidationChain[] = [
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    .withMessage(
      "Password must include at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 8 characters long."
    ),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match."),
];

const userRoleUpdate: ValidationChain[] = [
  check("role")
    .exists()
    .withMessage("Role property is required.")
    .isIn(["user", "admin", "instructor"])
    .withMessage(
      "Invalid role. Allowed values are 'user', instructor and 'admin'."
    )
    .custom((value, { req }) => {
      if (value !== "user" && value !== "admin" && value !== "instructor") {
        throw new Error(
          "Invalid role. Allowed values are 'user' instructor, and 'admin'."
        );
      }
      return true;
    }),
];

const courseCreateSchema: ValidationChain[] = [
  check("name")
    .notEmpty()
    .withMessage("Course name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Course name should be between 3 and 100 characters"),
  check("description").notEmpty().withMessage("Description is required"),
  check("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price should be a number"),
  check("estimatedPrice")
    .optional()
    .isNumeric()
    .withMessage("Estimated price should be a number"),

  check().custom((value, { req }) => {
    const price = parseFloat(req.body.price as string);
    const estimatedPrice = parseFloat(req.body.estimatedPrice as string);

    if (!isNaN(price) && !isNaN(estimatedPrice) && price <= estimatedPrice) {
      throw new Error("Price must be greater than estimatedPrice");
    }

    return true;
  }),
  check("courseData.*.title")
    .notEmpty()
    .withMessage("Course data title is required")
    .isString(),
  check("courseData.*.videoUrl")
    .notEmpty()
    .withMessage("Course data video URL is required")
    .isString(),
  // .isURL()
  // .withMessage("Invalid video URL"),

  check("reviews.*.rating")
    .notEmpty()
    .withMessage("Review rating is required")
    .isNumeric(),
  check("reviews.*.comment")
    .notEmpty()
    .withMessage("Review comment is required")
    .isString(),
];

const courseUpdateSchema: ValidationChain[] = [
  check("name")
    .optional()
    .isString()
    .isLength({ min: 3, max: 100 })
    .withMessage("Course name should be between 3 and 100 characters"),

  check("description")
    .optional()
    .isString()
    .withMessage("Description should be a string"),

  check("price").optional().isNumeric().withMessage("Price should be a number"),

  check("estimatedPrice")
    .optional()
    .isNumeric()
    .withMessage("Estimated price should be a number"),

  check()
    .optional()
    .custom((value, { req }) => {
      const price = parseFloat(req.body.price as string);
      const estimatedPrice = parseFloat(req.body.estimatedPrice as string);

      if (!isNaN(price) && !isNaN(estimatedPrice) && price <= estimatedPrice) {
        throw new Error("Price must be greater than estimatedPrice");
      }

      return true;
    }),

  check("courseData.*.title")
    .optional()
    .isString()
    .withMessage("Course data title should be a string"),

  check("courseData.*.videoUrl")
    .optional()
    .isString()
    .isURL()
    .withMessage("Invalid video URL"),

  check("reviews.*.rating")
    .optional()
    .isNumeric()
    .withMessage("Review rating should be a number"),

  check("reviews.*.comment")
    .optional()
    .isString()
    .withMessage("Review comment should be a string"),
];

const questionValidationSchema: ValidationChain[] = [
  check("question")
    .notEmpty()
    .withMessage("Question is required")
    .isString()
    .withMessage("Question should be a string"),

  check("courseId")
    .notEmpty()
    .withMessage("Course ID is required")
    .isMongoId()
    .withMessage("Invalid Course ID"),

  check("contentId")
    .notEmpty()
    .withMessage("Content ID is required")
    .isMongoId()
    .withMessage("Invalid Content ID"),
];

const answerValidationSchema: ValidationChain[] = [
  check("answer")
    .notEmpty()
    .withMessage("Answer is required")
    .isString()
    .withMessage("Answer should be a string"),

  check("courseId")
    .notEmpty()
    .withMessage("Course ID is required")
    .isMongoId()
    .withMessage("Invalid Course ID"),

  check("contentId")
    .notEmpty()
    .withMessage("Content ID is required")
    .isMongoId()
    .withMessage("Invalid Content ID"),

  check("questionId")
    .notEmpty()
    .withMessage("Question ID is required")
    .isMongoId()
    .withMessage("Invalid Question ID"),
];

const reviewValidationSchema: ValidationChain[] = [
  check("review")
    .notEmpty()
    .withMessage("Review is required")
    .isString()
    .withMessage("Review should be a string"),

  check("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isNumeric()
    .withMessage("Rating should be a number")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating should be between 0 and 5"),
];

const replyReviewValidationSchema: ValidationChain[] = [
  check("comment")
    .notEmpty()
    .withMessage("Comment is required")
    .isString()
    .withMessage("Comment should be a string"),

  check("courseId")
    .notEmpty()
    .withMessage("Course ID is required")
    .isMongoId()
    .withMessage("Invalid Course ID"),

  check("reviewId")
    .notEmpty()
    .withMessage("Review ID is required")
    .isMongoId()
    .withMessage("Invalid Review ID"),
];

const validationMiddleware: ValidationMiddleware = {
  userSignupSchema,
  userActivation,
  userSigninSchema,
  socialAuthSchema,
  userUpdatSchema,
  updateUserPasswordSchema,
  forgotUserPassword,
  resetUserPassword,
  userRoleUpdate,
  courseCreateSchema,
  courseUpdateSchema,
  questionValidationSchema,
  answerValidationSchema,
  reviewValidationSchema,
  replyReviewValidationSchema,
};

export default validationMiddleware;
