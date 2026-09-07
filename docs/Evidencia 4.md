# Evidencia 4
# 02/08/2026

# Juan Rodolfo Mosqueda Lozano

En esta sesion trabajamos principalmente los archivos de la carpeta products dentro de modules. El archivo product.repository.js maneja la comunicación con la base de datos, mientras que product.service.js contiene la lógica de negocio. product.controller.js procesa las solicitudes y respuestas de la API, product.routes.js define las rutas disponibles y product.schema.js establece las validaciones que deben cumplir los datos de los productos. Además de trabajar estos archivos tambien se corrigieron algunos errores de sintaxis y rutas que se quedaron de la sesión pasada.

Codigo de product.schema.js:  es el que nos da toda la forma  en que vamos a guardar la informacion de los productos en la base de datos, es decir, es el esquema que nos va a permitir validar la informacion que nos llega del cliente y nos va a permitir crear un producto en la base de datos.
```js

import { z } from 'zod'

const productBodySchema= z.object({
    name: z.string().trim().min(3).max(120),
    slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9][a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(2000).default(''),
    price: z.number().finite().nonnegative(),
    stock: z.number().int().nonnegative(),
    category: z.string().trim().min(2).max(80),
    active: z.boolean().default(true)
})

const productIdParams = z.object({
    id: z.string().trim().min(1)
})

export const createProductSchema = z.object({
    body: productBodySchema,
    params: z.object({}),
    query: z.object({})
})

export const productIdSchema =z.object({
    body: z.object({}),
    params: productIdParams,
    query: z.object({})
})

export const updateProductSchema = z.object({
    body: productBodySchema.partial().refine((body) => {
        Object.keys(body).lenght > 0, {
            message: 'Se requiere minimo un campo'
        }
    }),
    params: productIdParams,
    query: z.object({})

})
export const listProductsSchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        ative: z.enum(['true', 'false']).optional().transform((value) => {
            value === undefined ? undefined : value === 'true'
        })
    })
})

```

Codigo de product.repository.js
```js

// en este archivo es donde se le dice que se modifique al repositorio
import { db } from '../../config/firebase.js'
import { FieldValue } from 'firebase-admin/firestore'

const productsCollection = db.collection('products')

function mapProduct(document) {
    if (!document.exists) {
        return null
    }

    const data = document.data()

    return {
        id: document.id,
        ...data,
        createAt: data.createdAt?.toDate?.()?.toIOSString() ?? null,
        updateAt: data.createdAt?.toDate?.()?.toIOSString() ?? null,
        

    }
}

export async function createProduct(data) {
  const productRef = productsCollection.doc()

  await productRef.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  })
  const created = await productRef.get()
  return mapProduct(created)
  }

  export async function findProductById(id) {
    const product = await productsCollection.doc(id).get()
    return mapProduct(product)
  }

  export async function listProducts({ limit, active}) {
    let query = productsCollection.orderBy('createdAt', 'desc').limit(limit)

    if (active !== undefined) {
        query = productsCollection.where('active', '==', active).orderBy('createdAt', 'desc').limit(limit)
    }
    const products = await query.get()
    return products.docs.map(mapProduct)
  }

  export async function updateProduct(id, data) {
    const productToUpdate = productsCollection.doc(id)
    await productToUpdate.update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
    })
    const product = await productToUpdate.get()
    return mapProduct(product)
  }

  export async function deleteProduct(id) {
    await productsCollection.doc(id).delete()
  }

  export async function findProductBySku(sku) {
    const product = await productsCollection.where('sku', '==', sku).limit(1).get()

    if (product.empty) {
        return null
    }

    return mapProduct(product.docs[0])
  }

```

Codigo de product.service.js: se utiliza para validar la informacion antes de mandarla al repositorio

```js

import { AppError } from '../../shared/errors/app-error.js'
import * as productRepository from './product.repository.js'

export function listProducts(filters) {
    return productRepository.listProducts(filters)
}

export async function getProduct(id) {
    const product = await productRepository.findProductById(id)
    if (!product) {
        throw new AppError({
            statusCode: 404,
            code: 'Producto_no_encontrado',
            message: 'Producto no encontrado'
        })
    }
    return product
}

export async function createProduct(data) {
    const existingProduct = await productRepository.findProductBySku(data.sku)
    if ( existingProduct) {
 
        throw new AppError({
            statusCode: 409,
            code: 'Producto_con_sku_existente',
            message: 'Producto con sku existente'
        })
    }
    return productRepository.createProduct(data)
}

export async function updateProduct(id, changes) {
    const currentProduct = await getProduct(id)
    if (changes.sku && changes.sku !== currentProduct.sku) {
        const product = await productRepository.findProductBySku(changes.sku)
        if (product) {
            throw new AppError({
                statusCode: 409,
                code: 'Producto_con_sku_existente',
                message: 'Producto con sku existente'
            })
        }  
    }
    return productRepository.updateProduct(id, changes)
}

export async function deleteProduct(id) {
    await getProduct(id)
    await productRepository.deleteProduct(id)
}
    
```

Codigo de product.controller.js: Con este codigo se regresan los mensajes con la información que se esta pidiendo

```js


import * as productService from './product.service.js'

export async function listProducts(req,res)  {
    const products= await productService.listProducts(req.validate.query)
    return res.status(200).json({
        succes: true,
        data: products,
        meta: {
            count: products.length,
            requestId: req.id
        }
    })
}

export async function getProduct(req,res)  {
    const product = await productService.getProduct(req.validate.body)
    return res.status(200).json({
        succes: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}

export async function createProduct(req,res)  {
    const product = await productService.createProduct(req.validate.body)
    return res.status(200).json({
        succes: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}

export async function updateProduct(req, res)  {
    const product = await productService.updateProduct(req.validate.params.id, req.validate.body)
    return res.status(200).json({
        succes: true,
        data: product,
        meta: {
            requestId: req.id
        }
    })
}

export async function deleteProduct(req,res)  {
    await productService.deleteProduct(req.validate.params.id)
    return res.status(204).send()
}

```

Codigo de product.routes.js

```js
import { Router } from 'express'
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from './product.controller.js'
import { createProductSchema, listProductsSchema, productIdSchema, updateProductSchema } from './product.schema.js'
import { asyncHandler } from '../../shared/middleware/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'

const router = Router()

router.get('/', validate(listProductsSchema), asyncHandler(listProducts))
router.get('/:id', validate(productIdSchema), asyncHandler(getProduct))
router.post('/', validate(createProductSchema), asyncHandler(createProduct))
router.patch('/:id', validate(updateProductSchema), asyncHandler(updateProduct))
router.delete('/:id', validate(productIdSchema), asyncHandler(deleteProduct))

export default router

```

Cambios realizados en index.js

```js
import productRoutes from './../modules/products/product.routes.js'
router.get('/products', productRoutes)

```