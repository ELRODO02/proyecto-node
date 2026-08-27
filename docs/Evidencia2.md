#   Evidencia 2
## 26/08/2026
### En esta sesión se realizo el app.js, server,js, eslint.config.js principalmente, además de que se realizaron distintas correcciones para lograr levantar el server, se agregaron tambien el archivo .nvmrc y .editorconfig

El codigo de app.js

```JS
import { randomUUID } from 'node:crypto';
import cors from 'cors'
import express from 'express'
import helmet from 'helmet' 
import pinoHttp from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js '
import router from './routes/index.js'
import { errorMiddleware } from './shared/middleware/error.middleware.js'
import { notFoundMiddleware } from './shared/middleware/not-found.middleware.js'

export const app = express()
app.disable('x-powered-by')

app.use(pinoHttp({
    logger,
    genReqId(req, res) {
        const existingRequestId = req.headers['x-request-id']
        const requestId = typeof existingRequestId === 'string' ? existingRequestId : randomUUID()

        res.setHeader('x-request-id', requestId)
        return requestId
  }
}))

app.use(helmet())
app.use(cors({
    origin: env.CORS_ORIGIN
}))
app.use(express.json({
    limit: '1mb'
}))
app.use(express.urlencoded({
    extended: false,
    limit: '1mb'
}))
app.use(env.API_PREFIX, router)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

```
El codigo de server.js

```JS
import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

const server = app.listen(env.PORT, () => {

    logger.info({
        port: env.PORT,
        environment: env.NODE_ENV
    }, `Proyecto NodeJS running: ${env.PORT}`)

})

let shuttingDown = false

function shutdown(signal) {

    if (shuttingDown) {
        return
    }

    shuttingDown = true

    logger.info({
        signal
    }, 'Inicia proceso de apagado del server')

    server.close((error) => {

        if (error) {

            logger.error({
                err: error
            }, 'Error cuando se apagaba el server')

            process.exit(1)
        }

        logger.info('Servidor HTTP cerrado')

        process.exit(0)
    })

    setTimeout(() => {

        logger.error('Forzado a apagar despues de cierto tiempo')

        process.exit(1)

    }, 10000).unref()
}


process.on('SIGINT', () => {
    shutdown('SIGINT')
})

process.on('SIGTERM', () => {
    shutdown('SIGTERM')
})

```
El codigo de eslint.config.js

```JS
import js from '@eslint/js'
import globals from 'globals'

export default [
    {
        ignores: [
            'node_modules/**',
            'coverage/**',
        ]
    },
    js.configs.recommended,
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': [
                'error', {
                    argsIgnorePattern: '^_',
                }
            ]
        }
    }
]

```
El condigo de .gitignore

```
#Dependencias
node_modules/

#Entorno
.env

#Logs
*.log
logs/

#Test
coverage/

#Build
dist/
build/

```
El codigo de .editorconfig

```
root = true
[+*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 4
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

```





