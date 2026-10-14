import { getFirestoreDb } from "./firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Deducts stock from Firestore for all items in an order.
 * Works per-variant and recalculates total stock and stock_status.
 * @param {Array} items - List of order items [{ id, size, quantity }]
 * @returns {Promise<{ success: boolean, updatedCount: number }>}
 */
export async function deductOrderStock(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, reason: "no_items", updatedCount: 0 };
  }

  const db = await getFirestoreDb();
  if (!db) {
    return { success: false, reason: "no_db", updatedCount: 0 };
  }

  // Normalize size for matching: e.g. "50 ml" -> "50ml", "100 ML" -> "100ml"
  const normSize = sz => String(sz || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Group purchased quantities by product ID
  const productDeductions = {};
  for (const item of items) {
    if (!item || !item.id) continue;
    const pid = String(item.id).trim();
    if (!productDeductions[pid]) {
      productDeductions[pid] = [];
    }
    productDeductions[pid].push({
      size: item.size || "",
      quantity: Math.max(1, Number(item.quantity) || 1)
    });
  }

  let updatedCount = 0;

  for (const [productId, purchases] of Object.entries(productDeductions)) {
    try {
      const productRef = doc(db, "products", productId);
      const snap = await getDoc(productRef);
      if (!snap.exists()) {
        console.warn(`[stockManager] Product ${productId} not found in Firestore.`);
        continue;
      }

      const pData = snap.data();
      let sizePrices = Array.isArray(pData.size_prices) ? [...pData.size_prices] : [];
      let totalStock = Number(pData.stock) || 0;

      if (sizePrices.length > 0) {
        for (const purchase of purchases) {
          const targetNorm = normSize(purchase.size);
          let matched = false;

          sizePrices = sizePrices.map(sp => {
            if (normSize(sp.size) === targetNorm) {
              matched = true;
              const currentVStock = Math.max(0, Number(sp.stock) || 0);
              const newVStock = Math.max(0, currentVStock - purchase.quantity);
              return { ...sp, stock: newVStock };
            }
            return sp;
          });

          // If size didn't match any specific variant, decrement total stock
          if (!matched) {
            totalStock = Math.max(0, totalStock - purchase.quantity);
          }
        }

        // Recalculate total product stock as sum of variants
        totalStock = sizePrices.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
      } else {
        // No variants, decrement overall product stock
        const totalPurchasedQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
        totalStock = Math.max(0, totalStock - totalPurchasedQty);
      }

      const autoStatus = totalStock === 0 ? "Out of Stock" : totalStock <= 5 ? "Low Stock" : "In Stock";

      await updateDoc(productRef, {
        stock: totalStock,
        stock_status: autoStatus,
        size_prices: sizePrices,
        updatedAt: new Date().toISOString()
      });

      console.log(`[stockManager] Deducted stock for ${productId} (${pData.name}): new stock = ${totalStock} (${autoStatus})`);
      updatedCount++;
    } catch (err) {
      console.error(`[stockManager] Failed to deduct stock for ${productId}:`, err.message);
    }
  }

  return { success: true, updatedCount };
}
