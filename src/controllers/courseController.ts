import Course from "../models/course/courseModel";
import CourseService from "../services/CourseService";

const courseController = new CourseService(Course);

export default courseController;
