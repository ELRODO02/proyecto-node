import { logger } from "../../config/logger.js";

export function errorMiddleware(err, req, res, _next) {
    logger.error({
        err,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl
}, 'Unhandled application error')

    return res.status(500).json({
        success: false,
        error: {
           code: 'INTERNAL_SERVER_ERROR',
           message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
        },
        meta: {
            requestId: req.id
        }
         });
}
