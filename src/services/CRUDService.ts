import { Model, Document, UpdateQuery, FilterQuery } from "mongoose";
import { catchAsync } from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import ApiError from "../middlewares/errors/apiError";
import { isValidId } from "../helpers/isValidId";
import { uploadImg } from "../helpers/fileHandling";

interface ICreateBodyRequest extends Request {
  body: any;
}

interface IUpdateBodyRequest extends Request {
  body: any;
  params: any;
}

class CrudService<T extends Document> {
  private readonly Model: Model<T>;
  constructor(Model: Model<any>) {
    this.Model = Model;
  }

  create = catchAsync(
    async (req: ICreateBodyRequest, res: Response, next: NextFunction) => {
      const data = req.body;

      const thumbnail = data.map((item: any) => item.thumbnail).filter(Boolean);

      if (thumbnail.length > 0) {
        await uploadImg(data as any[], "categories");
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        const error: ApiError = new ApiError(
          "Oops! It seems that some data is missing or invalid. Please make sure to provide an array of valid data.",
          400
        );
        next(error);
        return;
      }

      const createdDocuments = await this.Model.insertMany(data);

      res.status(201).json({
        status: true,
        message: `${this.Model.modelName} created successfully.`,
        data: createdDocuments,
      });
    }
  );

  getSingle = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const paramsId = req.params.id;
      if (!isValidId(paramsId)) {
        const error: ApiError = new ApiError(
          `Oops! It seems like the ${this.Model.modelName} ID provided is invalid`,
          400
        );
        next(error);
        return;
      }

      const result = await this.Model.findById(req.params.id);

      if (!result) {
        const error: ApiError = new ApiError(
          `Oh no! The ${this.Model.modelName} you're looking for doesn't exist.`,
          404
        );
        next(error);
        return;
      }

      res.status(200).json({
        status: true,
        message: `${this.Model.modelName} retrieved successfully.`,
        data: result,
      });
    }
  );

  getAll = (type: string): any =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
      let result;
      if (type === "user") {
        result = await this.Model.find({
          isActive: true,
        } as unknown as FilterQuery<T>);
      } else if (type === "admin") {
        result = await this.Model.find().select("+isActive").sort("-createAt");
      }

      if (!result || result.length === 0) {
        const error: ApiError = new ApiError(
          `Oops! It seems like there are no ${this.Model.modelName}s available at the moment. Please check back later or contact support for assistance.`,
          404
        );
        next(error);
        return;
      }

      res.status(200).json({
        status: true,
        length: result.length,
        data: result,
      });
    });

  update = catchAsync(
    async (req: IUpdateBodyRequest, res: Response, next: NextFunction) => {
      const paramsId: string = req.params.id;
      const dataToUpdate: UpdateQuery<T> = req.body;

      if (!isValidId(paramsId)) {
        const error: ApiError = new ApiError(
          `Oops! It seems like the ${this.Model.modelName} ID provided is invalid`,
          400
        );
        next(error);
        return;
      }

      const updatedDocument = await this.Model.findByIdAndUpdate(
        paramsId,
        dataToUpdate,
        { new: true }
      );

      if (!updatedDocument) {
        const error: ApiError = new ApiError(
          `No ${this.Model.modelName} document found with the provided ID.`,
          404
        );
        next(error);
        return;
      }

      res.status(200).json({
        status: true,
        message: `${this.Model.modelName} updated successfully.`,
        data: updatedDocument,
      });
    }
  );

  deleteMany = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        const error: ApiError = new ApiError(
          "Oops! It seems that some data is missing or invalid. Please make sure to provide an array of valid IDs.",
          400
        );
        next(error);
        return;
      }

      const result = await this.Model.deleteMany({ _id: { $in: data } });

      if (result.deletedCount === 0) {
        const error: ApiError = new ApiError(
          `No ${this.Model.modelName} documents were deleted.`,
          404
        );
        next(error);
        return;
      }

      res.status(204).json({
        status: true,
        message: `${result.deletedCount} ${this.Model.modelName} documents deleted successfully.`,
      });
    }
  );
}

export default CrudService;
