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