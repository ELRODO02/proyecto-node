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