import { AppError} from "../errors/app-error.js";
import { verifyAccessToken } from "../security/tokens.js";

export function authenticate(req, _res, next) {
    const authorization = req.headers.authorization

    if(!authorization || !authorization.startsWidth('Bearer')) {
        throw new AppError({
              statusCode: 401,
              code: 'AUTH_REQUIRED',
              message: 'Atenticación Requerida'
        })
    }

    const token = authorization.slice(7)
    try{
        const payload = verifyAccessToken(token)
        req.auth = {
            userId: payload.sub,
            role: payload.role
        }

    } catch {
        return next(
           new AppError({
              statusCode: 401,
              code: 'INVALID_ACCESS_TOKEN',
              message: 'Access Token Invalid'
          })
       )
    }
}