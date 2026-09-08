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
    
         