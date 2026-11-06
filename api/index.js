import fs from "fs";
import path from "path";

const ROUTE_LOADERS = {
  "admin-order-status": () => import(`./_handlers/admin-order-status.js?t=${Date.now()}`),
  "deduct-stock": () => import(`./_handlers/deduct-stock.js?t=${Date.now()}`),
  "get-orders": () => import(`./_handlers/get-orders.js?t=${Date.now()}`),
  "link-guest-orders": () => import(`./_handlers/link-guest-orders.js?t=${Date.now()}`),
  "send-email": () => import(`./_handlers/send-email.js?t=${Date.now()}`),
  "send-order-email": () => import(`./_handlers/send-order-email.js?t=${Date.now()}`),
  "send-otp": () => import(`./_handlers/send-otp.js?t=${Date.now()}`),
  "verify-otp": () => import(`./_handlers/verify-otp.js?t=${Date.now()}`),
  "shiprocket": () => import(`./_handlers/shiprocket.js?t=${Date.now()}`),
  "track": () => import(`./_handlers/delhivery-track.js?t=${Date.now()}`),
  "delhivery/serviceability": () => import(`./_handlers/delhivery-serviceability.js?t=${Date.now()}`),
  "delhivery/create-shipment": () => import(`./_handlers/delhivery-create-shipment.js?t=${Date.now()}`),
  "delhivery-create-shipment": () => import(`./_handlers/delhivery-create-shipment.js?t=${Date.now()}`),
  "delhivery/track": () => import(`./_handlers/delhivery-track.js?t=${Date.now()}`),
  "delhivery-track": () => import(`./_handlers/delhivery-track.js?t=${Date.now()}`),
  "delhivery/label": () => import(`./_handlers/delhivery-label.js?t=${Date.now()}`),
  "delhivery-label": () => import(`./_handlers/delhivery-label.js?t=${Date.now()}`),
  "delhivery/pickup": () => import(`./_handlers/delhivery-pickup.js?t=${Date.now()}`),
  "delhivery-pickup": () => import(`./_handlers/delhivery-pickup.js?t=${Date.now()}`),
  "delhivery/cancel": () => import(`./_handlers/delhivery-cancel.js?t=${Date.now()}`),
  "delhivery-cancel": () => import(`./_handlers/delhivery-cancel.js?t=${Date.now()}`),
  "shipping/assign-courier": () => import(`./_handlers/shipping-assign-courier.js?t=${Date.now()}`),
  "shipping/create-shipment": () => import(`./_handlers/delhivery-create-shipment.js?t=${Date.now()}`),
  "shipping/request-pickup": () => import(`./_handlers/delhivery-pickup.js?t=${Date.now()}`),
  "shipping/serviceability": () => import(`./_handlers/delhivery-serviceability.js?t=${Date.now()}`),
  "shipping/track": () => import(`./_handlers/delhivery-track.js?t=${Date.now()}`),
  "webhooks/shipping": () => import(`./_handlers/webhooks-shipping.js?t=${Date.now()}`),
  "razorpay-create-order": () => import(`./_handlers/razorpay-create-order.js?t=${Date.now()}`),
  "razorpay/create-order": () => import(`./_handlers/razorpay-create-order.js?t=${Date.now()}`),
  "razorpay-verify-payment": () => import(`./_handlers/razorpay-verify-payment.js?t=${Date.now()}`),
  "razorpay/verify-payment": () => import(`./_handlers/razorpay-verify-payment.js?t=${Date.now()}`)
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
      service: "Mahirash Perfumes API",
      status: "operational",
      timestamp: new Date().toISOString()
    });
  }

  let loader = ROUTE_LOADERS[normalized];

  // Fallback: check if direct file exists in _handlers
  if (!loader) {
    try {
      const sanitizedName = normalized.replace(/[^a-zA-Z0-9-_]/g, "");
      const directPath = path.resolve(process.cwd(), "api", "_handlers", `${sanitizedName}.js`);
      if (fs.existsSync(directPath)) {
        loader = () => import(`./_handlers/${sanitizedName}.js?t=${Date.now()}`);
      }
    } catch (_) {}
  }

  if (!loader) {
    console.warn(`[api/index] Route not found: "${normalized}" (raw: "${routeCandidate}")`);
    return res.status(404).json({
      error: `API route /api/${normalized} not found`,
      requestedRoute: normalized
    });
  }

  try {
    const mod = await loader();
    const targetHandler = mod.default || mod;
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
