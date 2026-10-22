import { checkServiceability } from "../_lib/shiprocketClient.js";

export default async function handler(req, res) {
  // Support both GET and POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const deliveryPincode = req.query?.pincode || req.body?.pincode || req.query?.deliveryPincode || req.body?.deliveryPincode;
  const pickupPincode = req.query?.pickupPincode || req.body?.pickupPincode;
  const weight = req.query?.weight || req.body?.weight || 0.5;
  const cod = req.query?.cod || req.body?.cod || 0;
  const length = req.query?.length || req.body?.length || 12;
  const breadth = req.query?.breadth || req.body?.breadth || 12;
  const height = req.query?.height || req.body?.height || 8;

  if (!deliveryPincode) {
    return res.status(400).json({ error: "Missing delivery pincode parameter" });
  }

  try {
    const result = await checkServiceability({
      deliveryPincode,
      pickupPincode,
      weight,
      cod,
      length,
      breadth,
      height
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/shipping/serviceability] Error:", err.message);
    return res.status(500).json({
      available: false,
      error: "Failed to verify PIN code serviceability",
      message: err.message
    });
  }
}
