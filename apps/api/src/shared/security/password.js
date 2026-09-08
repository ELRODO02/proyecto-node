//este archivo nos sirve para recibir una palabra o string y encriptarla y desencriptarla, para poder guardar la contraseña de los usuarios de manera segura en la base de datos
import bcrypt from 'bcryptjs'
const SALT_ROUNDS = 12

export function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
}

export function verifyPassword (password, hashPassword) {
    return bcrypt.compare(password, hashPassword)
}