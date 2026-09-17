import { permissionsByRole } from "../../config/permissions.js";
import { AppError } from '../errors/app-error.js'

export function authorize(permission) {
    return function authorizationMiddleware(req, _res, next) {
        const role =  req.auth?.role
        const permissions = permissionsByRole[role]
        if (!permissions || (!permissions.has('*') && !permissions.has(permission)))
        {
            return next (new AppError({
                statusCode: 403,
                code: 'FORBIDDEN',
                message: 'No tiene permisos para realizar la operación'
            }))
        }
        return next()
    }
}
