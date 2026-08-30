import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFilePath)
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
    LOG_LEVEL: process.env.LOG_LEVEL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
})

if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is required')
}