# Evidencia 5

# 08/09/2026

# Juan Rodolfo Mosqueda lozano

En esta sesión de clase se trabajó en la implementación y organización del sistema de autenticación del proyecto. Se modificaron y agregaron archivos relacionados con la configuración del entorno y Firebase, la generación y manejo de tokens, el repositorio y esquema de usuarios, así como los módulos de autenticación, servicio de autenticación y manejo de contraseñas. También se realizaron ajustes para integrar correctamente estas funcionalidades dentro de la aplicación y mantener una estructura más ordenada y modular del código.

Modificaciones a .env

```env
#auth
JWT_ACCESS_SECRET=palabra_super_secreta
JWT_REFRESH_SECRET=palabra_super_secreta_2
JWT_REFRESH_EXPIRES_IN=7d
```

Codigo de auth.js

```js
import { env } from './env.js'

if (!env.JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is required')
}

if (!env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required')
}

export const authConfig = Object.freeze({
    accessSecret:  env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
})
```

Modificaciones hechas a firebase.js:
```js
if (
  !env.FIREBASE_PROJECT_ID ||
  !env.FIREBASE_CLIENT_EMAIL ||
  !env.FIREBASE_PRIVATE_KEY
) {
  throw new Error(
    'Firebase environment variables are missing'
  )
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      })
```
Modificaciones hechas a env.js:
```js
export const env = Object.freeze({
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
    API_PREFIX: process.env.API_PREFIX,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN
})
```
Codigo del archivo tokens.js recien agregado:
```js
// En este archivo se manejan los tokens de acceso y refresh, para poder autenticar a los usuarios y mantener su sesión activa sin necesidad de que ingresen sus credenciales cada vez que acceden a la aplicación.

import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { authConfig } from '../../config/auth.js'

export function signAccessToken (payload) {
    return jwt.sign(payload, authConfig.accessSecret, {
        expiresIn: authConfig.accessExpiresIn
    })
}

export function signRefreshToken (payload) {
    return jwt.sign(payload, authConfig.refreshSecret, {
        expiresIn: authConfig.refreshExpiresIn
    })
}

export function verifyAccessToken (token) {
    return jwt.verify(token, authConfig.accessSecret)
}

export function verifyRefreshToken (token) {
    return jwt.verify(token, authConfig.refreshSecret)
}

export function hashToken (token) {
    return createHash('sha256').update(token).digest('hex')
}
```

Codigo del archivo recien agregado user.repository.js:
```js
//Archivo que interactua con la base de datos de usuarios, utilizando Firebase como proveedor de servicios en la nube. Este archivo contiene funciones para crear, leer, actualizar y eliminar usuarios en la base de datos, así como para autenticar a los usuarios mediante tokens de acceso y refresh.

import { FieldValue } from "firebase-admin/firestore";
import { db } from '../../config/firebase.js';

const usersCollection = db.collection('users');

function mapTimestamp(value) {
  return value?.toDate?.()?.toISOString() ?? null;
}

function mapUser(document) {
    if (!document.exists) {
        return null;
    }
    const data = document.data();
    return {
        id: document.id,
        email: data.email,
        name: data.name,
        role: data.role,
        active: data.active,
        createdAt: mapTimestamp(data.createdAt),
        updatedAt: mapTimestamp(data.updatedAt)
    };
}

export async function createUser( data ) {
    const user = usersCollection.doc()
    await user.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    })
    const created = await user.get()
    return mapUser(created)
}

export async function findById (id) {
    const doc = await usersCollection.doc(id).get()
    return mapUser(doc)
}

export async function findByEmail (email) {
    const user = await usersCollection.where('email', '==', email).limit(1).get()
    
    
    if (user.empty) {
        return null
}

const foundUser = user[0]
return {
    ...mapUser(foundUser),
    passwordHash: foundUser.data().passwordHash
    }
 }
    
```

Codigo de auth.repository.js
```js
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase.js';

const refreshTokensCollection = db.collection('refreshTokens');

export async function saveRefreshToken ({
    userId,
    tokenHash
}) {
    await refreshTokensCollection.doc(tokenHash).set({
        userId,
        revoked: false,
        createdAt: FieldValue.serverTimestamp(),
    });
}

export async function findRefreshToken (tokenHash) {
    const token = await refreshTokensCollection.doc(tokenHash).get();
    if (!token.exists) {
        return null;
    }
    return {
        id: token.id,
        ...token.data()
    }
}

export async function revokeRefreshToken (tokenHash) {
    await refreshTokensCollection.doc(tokenHash).set({
        revoked: true,
        revokedAt: FieldValue.serverTimestamp()
    }, { 
        merge: true 

    });
}
```

Codigo de auth.schema.js
```js
import { z } from 'zod'

const empty = z.object({}).default({})

const email = z.string().trim().toLowerCase().email()
const password = z.string().min(8).max(100)

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email,
    password,
  }),
  params: empty,
  query: empty
})

export const loginSchema = z.object({
  body: z.object({
    email,
    password
  }),
  params: empty,
  query: empty
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
    }),
    params: empty,
    query: empty
})
```

Codigo de auth.service.js
```js
import { AppError } from '../../shared/errors/app-error.js'
import { hashPassword, verifyPassword } from '../../shared/security/password.js'
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/security/token.js'
import * as userRepository from '../users/user.repository.js'
import * as authRepository from './auth.repository.js'

function issueTokens (user) {
    const payload = {
        sub: user.id,
        role: user.role
    }
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload)
    }
}

export async function register (data) {
    const existingUser = await userRepository.findByEmail(data.email)
    if (existingUser) {
        throw new AppError({
              statusCode: 409,
              code: 'EMAIL_EXISTS',
              message: 'El correo ya fue registrado'
        })
    }
    const user = userRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: 'CUSTOMER',
        active: true
    })
    const tokens = issueTokens(user)
    await authRepository.saveRefreshToken({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken)
    })
    return { user, 
        ...tokens 
    }
}
    
```
Codigo de password.js
```js
//este archivo nos sirve para recibir una palabra o string y encriptarla y desencriptarla, para poder guardar la contraseña de los usuarios de manera segura en la base de datos
import bcrypt from 'bcryptjs'
const SALT_ROUNDS = 12

export function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
}

export function verifyPassword (password, hashPassword) {
    return bcrypt.compare(password, hashPassword)
}
``` 