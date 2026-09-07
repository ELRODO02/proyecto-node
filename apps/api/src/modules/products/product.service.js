// se utiliza para validar la informacion antes de mandarla al repositorio
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

    