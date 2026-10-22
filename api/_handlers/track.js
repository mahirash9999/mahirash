import { trackShiprocketAwb } from "../_lib/shiprocketClient.js";

export default async function handler(req, res) {
  const awb = req.query?.awb || req.body?.awb;

  if (!awb) {
    return res.status(400).json({ error: "Missing AWB tracking code parameter" });
  }

  try {
    const result = await trackShiprocketAwb(awb);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/track] Error Details:", err.message);
    return res.status(500).json({
      error: "Could not retrieve live tracking data",
      message: err.message
    });
  }
}
