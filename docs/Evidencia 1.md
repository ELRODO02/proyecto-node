#Evidencia 1

El codigo del ENV
```ENV
NODE_ENV=development
PORT=4050
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```
El codigo de env.js
```js
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.direname(currentFile)
const envPath = path.resolve(currentDirectory, '../../.env')

dotenv.config({ path: envPath })



const port =  Number(process.env.PORT ?? 4000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe de ser valido')
}

export const env = Object.freeze({
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    API_PREFIX: process.env.API_PREFIX,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    LOG_LEVEL: process.env.LOG_LEVEL
})


```
El codigo de logger.js
```js
import pino from 'pino'
import {env} from './env.js'

const transport = 
env.NODE_ENV == 'production' ? undefined : pino.transport ({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
    }
})

export const logger = pino({
    level: env.LOG_LEVEL
}, transport)
```

El codigo de health.controllers.js
```js
import { env } from '../../config/env.js'

export function getHealth(req, res) {
    return res.status(200).json({
        success: true,
        data: {
            service: 'ecommerce-api',
            status: 'ok',
            environment: env.NODE_ENV,
            uptime: Number(process.uptime().toFixed(2)),
            timestamp: new Date().toISOString()
        },
        meta: {
            requestId: req.id
        }
    })
}

```

El codigo de health.routes.js
```js
import { Router } from 'express';
import { getHealth } from './health.controller.js';

const healthRoutes = Router();

healthRoutes.get('/', getHealth);

export default healthRoutes;
```

El codigo de index.js
```js
import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';

const router = Router();

router.get('/', healthRoutes);

export default router;
```

El codigo de error.middleware.js
```js
import { logger } from "../../config/logger.js";

export function errorMiddleware(err, req, res, next) {
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

El codigo de not-found.middleware.js
```js
export function notFoundMiddleware(req, res) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    },
    meta: {
      requestId: req.id
    }
  })
}
```

