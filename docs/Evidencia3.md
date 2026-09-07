#Evidencia 3

##27/08/2026

### Juan Rodolfo Mosqueda lozano

En esta ocasion se levanto una base de datos en firebase para el back, ademas de instalar paquetes para poder usar firebase en visual studio, tambien se creo una nueva rama llamada feature/firebase.
Se añadieron varios archivos nuevos en la carpeta de modules y se trabajaron en varios añadiendo codigo para el back.

Codigo de firebase.js
```js
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore'
import { env } from './env.js'

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID
})



export const db= getFirestore(firebaseApp)
```

Codigo de app-error.js
```js
export class AppError extends Error {
    constructor({
        statusCode,
        code,
        message,
        details
    }) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.code = code 
        this.details = details
    }
}
```

Codigo de async-handler.js
```js
export function asyncHandler(handler) {
    return function wrapperHandler(
        req,
        res,
        next
    ) {
        Promise.resolve(
            handler(req, res, next)
        ).catch(next)
    }
}
```

Codigo de validate.middleware.js
```js
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
```

Cambios en .gitignore
```
#service account
apps/api/secrets/*.json
```
cambios hechos en config/env.js
```js
 LOG_LEVEL: process.env.LOG_LEVEL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
})

if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is required')
}

```


Trabajamos en el archivo error.middleware.js
```js
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


```

