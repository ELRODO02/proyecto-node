import { ZodError } from 'zod'
import { AppError } from '../errors/app-error'

export function validate(schema) {
    return function validationMiddleware(
        req, res, next
    ) {
        try {
            const result = schema.parse({
              body: req.body,
              params: req.params,
              query: req.query  
            })
            req.validate = result
            next()

        } catch (error) {
            if (error instanceof ZodError) {
                new AppError ({
                    statusCode: 400,
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: error.issues
                })
            }

        }
    }
}