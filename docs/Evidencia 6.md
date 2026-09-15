# Juan Rodolfo Mosqueda Lozano 
# 13/09/2026

Durante esta sesión se implementaron y organizaron los módulos de autenticación y usuarios de la API. Se trabajó en el inicio de sesión, generación y validación de tokens, controladores y rutas de autenticación, así como en un middleware para proteger las rutas que requieren acceso autorizado. También se desarrollaron los controladores y rutas correspondientes a los usuarios, permitiendo estructurar correctamente las operaciones relacionadas con su gestión dentro del sistema.

Codigo de auth.controller.js
```js
import * as authService from './auth.service.js'

export async function register (req,res) {
    const data = authService.register(req.validated.body)

    return res.status(201).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function login(req,res) {
    const data = authService.login(req.validated.body)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

export async function refresh (req,res) {
    const data = authService.refresh(req.validated.body.refreshToken)

    return res.status(200).json({
        success: true,
        data,
        meta: {
            requestId: req.id
        }
    })
}

```
Codigo de auth.routes.js
```js
import { Router } from 'express'
import { login,refresh,register } from './auth.controller.js'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'

const router = Router()

router.post('/register', validate(registerSchema), asyncHandler(register))
router.post('/login', validate(loginSchema), asyncHandler(login))
router.post('/refresh', validate(refreshSchema), asyncHandler(refresh))

export default router

```
Codigo de authenticate.middleware.js
```js
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
```
Codigo de user.controller.js
```js
import { AppError } from "../../shared/errors/app-error.js";
import * as userRepository from "./user.repository.js"

export async function me (req, res) {
    const user = await userRepository.findById(req.auth.userId)
    if (!user) {
        throw new AppError({
              statusCode: 404,
              code: 'USER_NOT_FOUND',
              message: 'Usuario no encontrado'
        })
    }
    return res.status(200).json({
        success: true,
        data: user,
        meta: {
            requestId: req.id
        }
    })
}
```
Codigo de user.routes.js
```js
import { Router } from "express";
import { me } from "./user.controllers.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js"

const router = Router()

router.get('/me', authenticate, asyncHandler(me))
  
    export default router
```
Cambios a index.js
```js
import authRoutes from './../modules/auth/auth.routes.js'
import userRoutes from './../modules/users/user.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)
```