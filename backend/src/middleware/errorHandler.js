export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
