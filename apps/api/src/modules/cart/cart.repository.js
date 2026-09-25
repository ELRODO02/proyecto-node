import {
  FieldValue
} from 'firebase-admin/firestore'

import {
  db
} from '../../config/firebase.js'

function cartRef(
  userId
) {
  return db
    .collection('carts')
    .doc(userId)
}

function itemsRef(
  userId
) {
  return cartRef(userId)
    .collection('items')
}

export async function listItems(
  userId
) {
  const snapshot =
    await itemsRef(userId)
      .get()

  return snapshot.docs.map(
    document => ({
      productId:
        document.id,

      ...document.data()
    })
  )
}

export async function upsertItem(
  userId,
  productId,
  quantity
) {
  await cartRef(userId)
    .set(
      {
        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge:
          true
      }
    )

  await itemsRef(userId)
    .doc(productId)
    .set(
      {
        quantity,

        updatedAt:
          FieldValue.serverTimestamp()
      },
      {
        merge:
          true
      }
    )
}

export async function removeItem(
  userId,
  productId
) {
  await itemsRef(userId)
    .doc(productId)
    .delete()
}

export async function clearCart(
  userId
) {
  const snapshot =
    await itemsRef(userId)
      .get()

  const batch =
    db.batch()

  snapshot.docs.forEach(
    document => {
      batch.delete(
        document.ref
      )
    }
  )

  await batch.commit()
}