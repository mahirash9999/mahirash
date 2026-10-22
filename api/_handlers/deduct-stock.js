import { deductOrderStock } from "../_lib/stockManager.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Items array is required" });
  }

  try {
    const result = await deductOrderStock(items);
    return res.status(200).json({
      success: true,
      message: "Stock deducted successfully",
      updatedCount: result.updatedCount
    });
  } catch (err) {
    console.error("Stock deduction API error:", err.message);
    return res.status(500).json({ error: "Failed to deduct stock", details: err.message });
  }
}
