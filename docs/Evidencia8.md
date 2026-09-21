# Juan Rodolfo Mosqueda Lozano 

# 20/09/2026

En esta sesión se trabajó en la implementación del módulo de categorías del proyecto. Se crearon los archivos necesarios para validar los datos de entrada, manejar las operaciones de consulta, creación, actualización y eliminación de categorías en la base de datos, así como aplicar la lógica correspondiente desde el servicio. También se configuraron las rutas para conectar estas funciones con la API y se realizaron correcciones en la estructura e importaciones de los archivos para asegurar su correcto funcionamiento.

Codigo de category.schema.js
```js
import { z } from 'zod'

const empty = z.object({}).default({})

const params = z.object({
    id: z.string().trim().min(1)
})

const categoryBody = z.object({
    id: z.string().trim().min(2).max(100),
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+$/),
    active: z.boolean().default(true)
})

export const listCategoriesSchema = z.object({
    body: empty,
    params: empty,
    query: empty
})

export const getCategorySchema = z.object({
    body: empty,
    params: empty,
    query: empty
})

export const createCategorySchema = z.object({
    body: categoryBody,
    params: empty,
    query: empty
})

export const updateCategorySchema = z.object({
    body: categoryBody.partial().refine(value => Object.keys(value).length > 0 , {
        message: 'Es requerido minimo un campo'
    }),
    params,
    query: empty
})

export const deleteCategorySchema = z.object({
    body: empty,
    params,
    query: empty
})

```
Codigo de category.repository.js
```js
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'

const categoriesCollection = db.collection('categories')

function mapTimestamp (value) {
  return value?.toDate?.()?.toISOString() ?? null
}

function mapCategory (document) {
  if (!document.exists) {
    return null
  }

  const data = document.data()

  return {
    id: document.id,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt)
  }
}

export async function listCategories () {
  const categories = await categoriesCollection
    .orderBy('name')
    .get()

  return categories.docs.map(mapCategory)
}

export async function findCategoryById (id) {
  const category = await categoriesCollection
    .doc(id)
    .get()

  return mapCategory(category)
}

export async function findCategoryBySlug (slug) {
  const category = await categoriesCollection
    .where('slug', '==', slug)
    .limit(1)
    .get()

  return category.empty
    ? null
    : mapCategory(category.docs[0])
}

export async function createCategory (data) {
  const category = categoriesCollection.doc()

  await category.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  })

  return mapCategory(await category.get())
}

export async function updateCategory (id, data) {
  const category = categoriesCollection.doc(id)

  await category.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp()
  })

  return mapCategory(await category.get())
}

export async function deleteCategory (id) {
  await categoriesCollection.doc(id).delete()
}
```
Codigo de category.service.js
```js
import { AppError } from '../../shared/errors/app-error.js'
import * as categoryRepository from './category.repository.js'

export async function listCategories() {
    return categoryRepository.listCategories()
}

export async function getCategory(id) {
    const category = await categoryRepository.findCategoryById(id)
    if (!category) {
        throw new AppError({
            statusCode: 400,
            code: 'CATEGORY_NOT_FOUND',
            message: 'Categoría no encontrada'
        })
    }
    return category
}

export async function createCategory(data) {
    const exists = await categoryRepository.findCategoryBySlug(data.slug)
    if (exists) {
        throw new AppError({
            statusCode: 404,
            code: 'CATEGORY_SLUG_exist',
            message: 'El slug ya existe'
        })
    }
    return categoryRepository.createCategory(data)
}

export async function updateCategory(id, data) {
    await getCategory(id)
    if(data.slug) {
        const exists = await categoryRepository.findCategoryBySlug(data.slug)

        if (exists && exists.id !== id) {
            throw new AppError({
            statusCode: 409,
            code: 'CATEGORY_SLUG_EXISTS',
            message: 'El slug ya existe'
        })
      }
    }
      return categoryRepository.updateCategory(id, data)
    }

export  async function deleteCategory(id) {
        await getCategory(id)
        await categoryRepository.deleteCategory(id)
    }

```
Codigo de category.routes.js
```js
import { Router } from 'express'
import * as controller from './category.controller.js'
import * as schema from './category.schema.js'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { validate } from '../../shared/middleware/validate.middleware.js'
import { authorize } from '../../shared/middleware/authorize.middleware.js'
import { authenticate } from '../../shared/middleware/authenticate.middleware.js'

const router = Router()

router.get('/', validate(schema.listCategoriesSchema), asyncHandler(controller.getCategory))
router.post('/', 
    authenticate, 
    authorize('products: create'), 
    validate(schema.createCategorySchema), 
    asyncHandler(controller.createCategory)
)

    router.patch('/:id', 
    authenticate, 
    authorize('products: update'), 
    validate(schema.updateCategorySchema), 
    asyncHandler(controller.updateCategory)
)

    router.delete('/:id', 
    authenticate, 
    authorize('products: delete'), 
    validate(schema.deleteCategorySchema), 
    asyncHandler(controller.deleteCategory)
)

export default router

```

