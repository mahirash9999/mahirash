import { getDelhiveryPackingSlip } from "../_lib/delhiveryClient.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const waybill = req.query?.waybill || req.body?.waybill;
  if (!waybill) {
    return res.status(400).json({ error: "waybill is required." });
  }

  try {
    const result = await getDelhiveryPackingSlip(waybill);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/delhivery-label] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to generate Delhivery shipping label"
    });
  }
}

