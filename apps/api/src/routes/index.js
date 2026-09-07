import { Router } from 'express'
import healthRoutes from './../modules/health/health.routes.js'
import productRoutes from './../modules/products/product.routes.js'

const router = Router()

router.get('/',healthRoutes)
router.get('/products', productRoutes)

export default router