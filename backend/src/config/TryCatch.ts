import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
  req: Request | any,
  res: Response,
  next: NextFunction
) => Promise<any>;

const TryCatch = (handler: AsyncFunction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      console.error("Error in handler:", error);
      res.status(500).json({
        message: error?.message || "Internal server error",
      });
    }
  };
};

export default TryCatch;
