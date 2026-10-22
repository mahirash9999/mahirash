import adminOrderStatusHandler from "./_handlers/admin-order-status.js";
import deductStockHandler from "./_handlers/deduct-stock.js";
import getOrdersHandler from "./_handlers/get-orders.js";
import linkGuestOrdersHandler from "./_handlers/link-guest-orders.js";
import sendEmailHandler from "./_handlers/send-email.js";
import sendOrderEmailHandler from "./_handlers/send-order-email.js";
import sendOtpHandler from "./_handlers/send-otp.js";
import verifyOtpHandler from "./_handlers/verify-otp.js";
import shiprocketHandler from "./_handlers/shiprocket.js";
import trackHandler from "./_handlers/track.js";
import delhiveryServiceabilityHandler from "./_handlers/delhivery-serviceability.js";
import shippingAssignCourierHandler from "./_handlers/shipping-assign-courier.js";
import shippingCreateShipmentHandler from "./_handlers/shipping-create-shipment.js";
import shippingRequestPickupHandler from "./_handlers/shipping-request-pickup.js";
import shippingServiceabilityHandler from "./_handlers/shipping-serviceability.js";
import shippingTrackHandler from "./_handlers/shipping-track.js";
import webhooksShippingHandler from "./_handlers/webhooks-shipping.js";

const ROUTE_HANDLERS = {
  "admin-order-status": adminOrderStatusHandler,
  "deduct-stock": deductStockHandler,
  "get-orders": getOrdersHandler,
  "link-guest-orders": linkGuestOrdersHandler,
  "send-email": sendEmailHandler,
  "send-order-email": sendOrderEmailHandler,
  "send-otp": sendOtpHandler,
  "verify-otp": verifyOtpHandler,
  "shiprocket": shiprocketHandler,
  "track": trackHandler,
  "delhivery/serviceability": delhiveryServiceabilityHandler,
  "shipping/assign-courier": shippingAssignCourierHandler,
  "shipping/create-shipment": shippingCreateShipmentHandler,
  "shipping/request-pickup": shippingRequestPickupHandler,
  "shipping/serviceability": shippingServiceabilityHandler,
  "shipping/track": shippingTrackHandler,
  "webhooks/shipping": webhooksShippingHandler
};

function normalizeRoute(route) {
  if (!route || typeof route !== "string") return "";
  let clean = route.trim();
  clean = clean.split("?")[0];
  clean = clean.replace(/^\/?(api\/)?/, "");
  clean = clean.replace(/\/+$/, "");
  clean = clean.replace(/\.js$/, "");
  return clean;
}

export default async function handler(req, res) {
  // Ensure helper response methods exist
  if (!res.status) {
    res.status = function(code) {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
      return res;
    };
  }
  if (!res.send) {
    res.send = function(data) {
      res.end(data);
      return res;
    };
  }

  // Parse query parameters
  if (!req.query) {
    req.query = {};
  }
  try {
    const urlObj = new URL(req.url || "", `http://${req.headers?.host || "localhost"}`);
    for (const [key, val] of urlObj.searchParams.entries()) {
      if (req.query[key] === undefined) {
        req.query[key] = val;
      }
    }
  } catch (_) {}

  // Parse body if stream or raw string
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {}
  } else if (!req.body && req.method !== "GET" && req.method !== "HEAD" && typeof req.on === "function") {
    try {
      const raw = await new Promise((resolve) => {
        let data = "";
        req.on("data", chunk => { data += chunk; });
        req.on("end", () => resolve(data));
        req.on("error", () => resolve(""));
      });
      if (raw) {
        try {
          req.body = JSON.parse(raw);
        } catch (_) {
          req.body = raw;
        }
      }
    } catch (_) {}
  }

  // Determine target route from multiple sources
  let routeCandidate = "";
  if (req.query?.__route) {
    routeCandidate = req.query.__route;
  } else if (req.headers && (req.headers["x-matched-path"] || req.headers["x-vercel-original-url"])) {
    routeCandidate = req.headers["x-matched-path"] || req.headers["x-vercel-original-url"];
  } else if (req.url) {
    try {
      const urlObj = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
      routeCandidate = urlObj.pathname;
    } catch (_) {
      routeCandidate = req.url;
    }
  }

  const normalized = normalizeRoute(routeCandidate);

  // Health / Root check
  if (!normalized || normalized === "health" || normalized === "index") {
    return res.status(200).json({
      success: true,
      service: "Mahirash Atelier API",
      status: "operational",
      timestamp: new Date().toISOString()
    });
  }

  const targetHandler = ROUTE_HANDLERS[normalized];

  if (!targetHandler) {
    console.warn(`[api/index] Route not found: "${normalized}" (raw: "${routeCandidate}")`);
    return res.status(404).json({
      error: `API route /api/${normalized} not found`,
      requestedRoute: normalized
    });
  }

  try {
    return await targetHandler(req, res);
  } catch (err) {
    console.error(`[api/index] Internal error in /api/${normalized}:`, err);
    return res.status(500).json({
      error: "Internal Server Error",
      route: normalized,
      message: err.message
    });
  }
}
