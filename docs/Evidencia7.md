# Juan Rodolfo Mosqueda Lozano 

# 13/09/2026


Codigo de permissions.js
```js
export const permissionsByRole = 
    Object.freeze({
        CUSTOMER: new Set([
          'products: read',
          'orders: create',
          'orders: read-own'
        ]),
        ADMIN: new Set([
            'products: read',
            'products: create',
            'products: update',
            'products: delete',
            'users: read',
            'orders: read',
            'orders: update'
        ]),
        SUPER_ADMIN: new Set([
            '*'
        ])
    })
```
Codigo de authorize.middleware.js
```js
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

```
Modificaciones a products.routes.js
```js
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'

router.post(
  '/',
  authorize('products: create'),
  validate(createProductSchema),
  asyncHandler(createProduct)
)

router.patch(
  '/:id',
  authorize('products: update'),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
)

router.delete(
  '/:id',
  authorize('products: delete'),
  validate(deleteProductSchema),
  asyncHandler(deleteProduct)
)
```
Codigo de promote-admin.js
```js
import {
  db
} from '../src/config/firebase.js'

const email =
  process.argv[2]

if (!email) {
  console.error(
    'Uso: node apps/api/scripts/promote-admin.js correo@dominio.com'
  )

  process.exit(1)
}

const snapshot =
  await db
    .collection('users')
    .where(
      'email',
      '==',
      email.toLowerCase()
    )
    .limit(1)
    .get()

if (snapshot.empty) {
  console.error(
    'Usuario no encontrado'
  )

  process.exit(1)
}

await snapshot.docs[0]
  .ref
  .update({
    role:
      'ADMIN'
  })

console.log(
  `Usuario ${email} promovido a ADMIN`
)

process.exit(0)
```