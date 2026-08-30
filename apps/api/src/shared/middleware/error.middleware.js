import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js"



export function errorMiddleware(err, req, res, _next) {
    if (err instanceof AppError) {
        logger.warm({
            code: err.code,
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            details: err.details
        }, err.message)
        return res.status(err.statusCode)
        .json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.
                    details}: {})
            },
            meta: {
                requestId: req.id
            }
        })
    }
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
