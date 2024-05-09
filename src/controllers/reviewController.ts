import Review from "../models/review/reviewModel";
import ReviewService from "../services/ReviewService";

const reviewController = new ReviewService(Review);

export default reviewController;
