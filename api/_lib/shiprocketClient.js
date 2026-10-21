import axios from "axios";

// In-memory token cache for serverless warm instances (tokens valid for 10 days in Shiprocket)
let cachedToken = null;
let tokenExpiryTime = 0;

export const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

/**
 * Returns configured Shiprocket credentials from environment variables.
 * Prioritizes server-only variables (SHIPROCKET_*) over client-exposed ones.
 */
export function getShiprocketCredentials() {
  const email = process.env.SHIPROCKET_EMAIL || process.env.VITE_SHIPROCKET_EMAIL || "";
  const password = process.env.SHIPROCKET_PASSWORD || process.env.VITE_SHIPROCKET_PASSWORD || "";
  const defaultPickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || process.env.VITE_SHIPROCKET_PICKUP_PINCODE || "452001";
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || process.env.VITE_SHIPROCKET_PICKUP_LOCATION || "Primary";

  return { email, password, defaultPickupPincode, pickupLocation };
}

/**
 * Retrieves valid authentication token from Shiprocket or cache.
 */
export async function getShiprocketToken() {
  const { email, password } = getShiprocketCredentials();

  if (!email || !password) {
    return null; // Signals simulation / mock mode
  }

  const now = Date.now();
  // Return cached token if valid with at least 1 hour safety margin
  if (cachedToken && tokenExpiryTime > now + 3600 * 1000) {
    return cachedToken;
  }

  try {
    const authRes = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email,
      password
    }, {
      timeout: 10000
    });

    const token = authRes.data?.token;
    if (!token) {
      throw new Error("Shiprocket auth response missing token");
    }

    cachedToken = token;
    // Set 9 days expiry (Shiprocket token is valid 10 days)
    tokenExpiryTime = now + 9 * 24 * 3600 * 1000;
    return token;
  } catch (err) {
    console.error("[shiprocketClient] Authentication error:", err.response?.data || err.message);
    throw new Error(`Shiprocket auth failed: ${err.response?.data?.message || err.message}`);
  }
}

/**
 * Checks courier serviceability between pickup and delivery pincodes.
 */
export async function checkServiceability({
  deliveryPincode,
  pickupPincode,
  weight = 0.5,
  cod = 0,
  length = 12,
  breadth = 12,
  height = 8
}) {
  const cleanDeliveryPin = String(deliveryPincode || "").trim();
  const { defaultPickupPincode } = getShiprocketCredentials();
  const cleanPickupPin = String(pickupPincode || defaultPickupPincode || "452001").trim();

  if (!/^\d{6}$/.test(cleanDeliveryPin)) {
    return {
      available: false,
      message: "Please enter a valid 6-digit Indian PIN code."
    };
  }

  const token = await getShiprocketToken();

  // If credentials are not yet configured in env, provide realistic calculated ETA simulation
  if (!token) {
    const daysToAdd = cleanDeliveryPin.startsWith("45") ? 2 : cleanDeliveryPin.startsWith("4") ? 3 : 4;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysToAdd);
    const formattedDate = estDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

    return {
      available: true,
      simulated: true,
      pickupPincode: cleanPickupPin,
      deliveryPincode: cleanDeliveryPin,
      courierName: "Delhivery Express (Air)",
      estimatedDeliveryDays: daysToAdd,
      estimatedDeliveryDate: formattedDate,
      estimatedDeliveryIso: estDate.toISOString(),
      codAvailable: true,
      shippingRate: 0,
      courierOptions: [
        { id: 1, name: "Delhivery Air", etd: formattedDate, rating: 4.8, cod: true },
        { id: 2, name: "Blue Dart Express", etd: formattedDate, rating: 4.9, cod: true },
        { id: 3, name: "DTDC Premium", etd: formattedDate, rating: 4.6, cod: true }
      ]
    };
  }

  try {
    const params = {
      pickup_postcode: cleanPickupPin,
      delivery_postcode: cleanDeliveryPin,
      weight: Math.max(0.1, Number(weight) || 0.5),
      cod: cod ? 1 : 0,
      length: Number(length) || 12,
      breadth: Number(breadth) || 12,
      height: Number(height) || 8
    };

    const res = await axios.get(`${SHIPROCKET_BASE_URL}/courier/serviceability/`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      timeout: 10000
    });

    const data = res.data?.data;
    const availableCouriers = data?.available_courier_companies || [];

    if (!availableCouriers || availableCouriers.length === 0) {
      return {
        available: false,
        deliveryPincode: cleanDeliveryPin,
        message: "Delivery is currently unavailable to this PIN code via express couriers."
      };
    }

    // Pick recommended courier (lowest ETD / highest rating)
    const bestCourier = availableCouriers[0];
    const etd = bestCourier.etd || bestCourier.estimated_delivery_days;
    let formattedDate = "";

    if (bestCourier.etd) {
      try {
        const d = new Date(bestCourier.etd);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
        }
      } catch (_) {}
    }

    if (!formattedDate && bestCourier.estimated_delivery_days) {
      const d = new Date();
      d.setDate(d.getDate() + Number(bestCourier.estimated_delivery_days));
      formattedDate = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    }

    return {
      available: true,
      simulated: false,
      pickupPincode: cleanPickupPin,
      deliveryPincode: cleanDeliveryPin,
      courierName: bestCourier.courier_name,
      courierId: bestCourier.courier_company_id,
      estimatedDeliveryDays: bestCourier.estimated_delivery_days,
      estimatedDeliveryDate: formattedDate || "3-5 business days",
      codAvailable: Boolean(bestCourier.cod && bestCourier.cod === 1),
      shippingRate: bestCourier.rate || 0,
      courierOptions: availableCouriers.slice(0, 4).map(c => ({
        id: c.courier_company_id,
        name: c.courier_name,
        etd: c.etd,
        rating: c.rating,
        cod: c.cod === 1,
        rate: c.rate
      }))
    };
  } catch (err) {
    console.error("[shiprocketClient] Serviceability API error:", err.response?.data || err.message);
    return {
      available: false,
      message: err.response?.data?.message || "Serviceability check is temporarily unavailable. Please retry."
    };
  }
}

/**
 * Creates an adhoc order in Shiprocket.
 */
export async function createShiprocketOrder(payload) {
  const token = await getShiprocketToken();
  const { pickupLocation } = getShiprocketCredentials();

  if (!token) {
    const randomAwb = "AWB_" + Math.floor(10000000 + Math.random() * 90000000);
    const randomShipmentId = "SIM_" + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      simulated: true,
      orderId: payload.order_id,
      shipmentId: randomShipmentId,
      awbCode: randomAwb,
      courierName: "Delhivery (Simulated)",
      trackingUrl: `https://shiprocket.co/tracking/${randomAwb}`
    };
  }

  const orderPayload = {
    ...payload,
    pickup_location: payload.pickup_location || pickupLocation
  };

  const res = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, orderPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    timeout: 15000
  });

  const d = res.data;
  return {
    success: true,
    simulated: false,
    orderId: d.order_id,
    shipmentId: d.shipment_id,
    awbCode: d.awb_code || "",
    courierName: d.courier_name || "",
    courierCompanyId: d.courier_company_id || null,
    trackingUrl: d.tracking_url || (d.awb_code ? `https://shiprocket.co/tracking/${d.awb_code}` : "")
  };
}

/**
 * Assigns courier and generates AWB for an existing Shiprocket shipment.
 */
export async function assignShiprocketCourier({ shipmentId, courierId }) {
  const token = await getShiprocketToken();
  if (!token) {
    const randomAwb = "AWB_" + Math.floor(10000000 + Math.random() * 90000000);
    return {
      success: true,
      simulated: true,
      awbCode: randomAwb,
      courierName: "Delhivery Air (Simulated)"
    };
  }

  const res = await axios.post(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    shipment_id: shipmentId,
    courier_id: courierId || undefined
  }, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000
  });

  const responseData = res.data?.response?.data;
  return {
    success: true,
    awbCode: responseData?.awb_code,
    courierName: responseData?.courier_name,
    courierCompanyId: responseData?.courier_company_id
  };
}

/**
 * Generates pickup request for an AWB/shipment.
 */
export async function requestShiprocketPickup({ shipmentId, pickupDate }) {
  const token = await getShiprocketToken();
  if (!token) {
    return {
      success: true,
      simulated: true,
      pickupScheduledDate: pickupDate || new Date().toISOString().substring(0, 10),
      message: "Pickup scheduled (Simulation mode)"
    };
  }

  const res = await axios.post(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
    shipment_id: [shipmentId],
    pickup_date: pickupDate ? [pickupDate] : undefined
  }, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000
  });

  return {
    success: true,
    data: res.data
  };
}

/**
 * Retrieves live tracking data for an AWB.
 */
export async function trackShiprocketAwb(awbCode) {
  const cleanAwb = String(awbCode || "").trim();
  const token = await getShiprocketToken();

  if (!token || cleanAwb.startsWith("AWB_") || cleanAwb.startsWith("SIM_")) {
    const today = new Date();
    const formatOffset = (daysAgo, hours, mins) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      d.setHours(hours, mins, 0, 0);
      return d.toISOString().replace("T", " ").substring(0, 19);
    };

    return {
      success: true,
      simulated: true,
      provider: "Delhivery Express (Simulated)",
      awb: cleanAwb,
      currentStatus: "In Transit",
      estimatedDelivery: formatOffset(-2, 18, 0),
      scans: [
        {
          date: formatOffset(0, 10, 30),
          activity: "Consignment arrived at Hub facility (Regional Sorting Centre)",
          location: "Destination Sorting Facility",
          status: "In Transit"
        },
        {
          date: formatOffset(1, 14, 15),
          activity: "Package scanned and dispatched via express air cargo",
          location: "Transit Airport Hub",
          status: "In Transit"
        },
        {
          date: formatOffset(1, 18, 45),
          activity: "Package picked up by courier associate from Mahirash Atelier",
          location: "Indore Warehouse",
          status: "Picked Up"
        },
        {
          date: formatOffset(2, 11, 0),
          activity: "Shipping manifest verified and packaging completed",
          location: "Mahirash Atelier Fulfillment Center",
          status: "Manifest Created"
        },
        {
          date: formatOffset(2, 9, 30),
          activity: "Order verified, fragrance bottles quality-checked and prepared",
          location: "System Order Gateway",
          status: "Order Confirmed"
        }
      ]
    };
  }

  const res = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/awb/${cleanAwb}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 12000
  });

  const trackData = res.data;
  if (trackData?.tracking_data?.shipment_track?.length) {
    const details = trackData.tracking_data.shipment_track[0];
    return {
      success: true,
      simulated: false,
      provider: details.courier_name || "Shiprocket Courier Partner",
      awb: details.awb_code,
      currentStatus: details.current_status || "In Transit",
      estimatedDelivery: details.edd || "Estimated in 3-4 days",
      scans: (details.scans || []).map(scan => ({
        date: scan.date,
        activity: scan.activity,
        location: scan.location,
        status: scan["sr-status"] || scan.activity
      }))
    };
  }

  return {
    success: true,
    simulated: false,
    provider: "Shiprocket Courier Partner",
    awb: cleanAwb,
    currentStatus: "Manifested",
    estimatedDelivery: "Pending carrier pickup",
    scans: []
  };
}

/**
 * Normalizes courier status string into application normalized shipment status.
 */
export function normalizeShipmentStatus(rawStatus) {
  const s = String(rawStatus || "").trim().toUpperCase();
  if (s.includes("DELIVERED")) return "Delivered";
  if (s.includes("OUT FOR DELIVERY")) return "Out for Delivery";
  if (s.includes("IN TRANSIT") || s.includes("REACHED") || s.includes("TRANSIT")) return "In Transit";
  if (s.includes("PICKED UP") || s.includes("SHIPPED") || s.includes("DISPATCHED")) return "Picked Up";
  if (s.includes("PICKUP SCHEDULED") || s.includes("PICKUP QUEUED")) return "Pickup Scheduled";
  if (s.includes("AWB") || s.includes("MANIFEST")) return "AWB Generated";
  if (s.includes("RTO") || s.includes("RETURN")) return "RTO Initiated";
  if (s.includes("CANCEL")) return "Cancelled";
  if (s.includes("EXCEPTION") || s.includes("DELAY")) return "Delivery Exception";
  return "In Transit";
}
