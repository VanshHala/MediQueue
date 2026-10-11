import { ZodError } from 'zod';

// Middleware generator to validate req.body against a Zod schema
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return res.status(400).json({
          success: false,
          message: errorMessages || 'Invalid request parameters'
        });
      }
      next(error);
    }
  };
};
