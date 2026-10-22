import { checkDelhiveryServiceability } from "../_lib/delhiveryClient.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pincode = req.query?.pincode || req.body?.pincode;
  const weight = req.query?.weight || req.body?.weight || 0.5;

  if (!pincode) {
    return res.status(400).json({ error: "pincode query or body parameter is required" });
  }

  try {
    const result = await checkDelhiveryServiceability({ pincode, weight });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/delhivery/serviceability] Error:", err.message);
    return res.status(500).json({
      serviceable: false,
      error: "Failed to verify pincode with Delhivery",
      message: err.message
    });
  }
}
