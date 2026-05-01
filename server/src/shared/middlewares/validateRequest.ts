import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validateRequest = (schema: ZodSchema, target: ValidationTarget) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate =
        target === 'body' ? req.body : target === 'query' ? req.query : req.params;
      const parsed = await schema.parseAsync(dataToValidate);
      
      if (target === 'body') {
        req.body = parsed;
      } else if (target === 'query') {
        req.query = parsed as any;
      } else {
        req.params = parsed as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        });
        return;
      }
      next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema) => validateRequest(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validateRequest(schema, 'query');
export const validateParams = (schema: ZodSchema) => validateRequest(schema, 'params');
