import { Request } from "express";
import { ICourse } from "../models/course/courseType";

export interface ICourseBodyRequest extends Request {
  body: ICourse;
}

export interface ICourseUpdateBodyRequest extends Request {
  body: ICourse;
}

export interface IAddQuestionBodyRequest extends Request {
  body: {
    question: string;
    courseId: string;
    contentId: string;
  };
}

export interface IAddQuestionAnswerBodyRequest extends Request {
  body: {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
  };
}
