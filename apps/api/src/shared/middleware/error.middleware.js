import { logger } from '../../config/logger.js'

export function errorMiddleware(err, req, res, _next) {
  console.error('===== ERROR REAL =====')
  console.error(err)
  console.error('======================')
  
  const statusCode = err.statusCode ?? 500

  if (statusCode < 500) {
    logger.warn(
      {
        err,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl
      },
      'Request failed'
    )
  } else {
    logger.error(
      {
        err,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl
      },
      'Unhandled application error'
    )
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code ?? 'INTERNAL_SERVER_ERROR',
      message:
        statusCode >= 500
          ? 'Internal server error'
          : err.message,
      ...(err.details ? { details: err.details } : {})
    },
    meta: {
      requestId: req.id
    }
  })
}