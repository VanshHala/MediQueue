// Centralized Error Handling Middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
};
