import { db } from "../components/Firebase";
import { collection, getDocs } from "firebase/firestore";

const BASE_URL = "https://mahirash.com";

const escapeXml = (unsafe) => {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
};

/**
 * Generates a full XML Sitemap string dynamically using live Firestore data
 * @returns {Promise<string>} XML string
 */
export const generateDynamicSitemapXML = async () => {
  const currentDate = new Date().toISOString().split("T")[0];

  // Static high-value routes
  const staticRoutes = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/shop`, priority: "0.9", changefreq: "daily" },
    { loc: `${BASE_URL}/about`, priority: "0.7", changefreq: "monthly" },
    { loc: `${BASE_URL}/contact`, priority: "0.7", changefreq: "monthly" },
    { loc: `${BASE_URL}/privacy`, priority: "0.5", changefreq: "yearly" },
    { loc: `${BASE_URL}/terms`, priority: "0.5", changefreq: "yearly" },
    { loc: `${BASE_URL}/return-policy`, priority: "0.5", changefreq: "yearly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Append Static Pages
  for (const page of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${page.loc}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  try {
    // 2. Fetch Active Categories from Firestore
    const catSnap = await getDocs(collection(db, "categories"));
    if (!catSnap.empty) {
      catSnap.docs.forEach((docSnap) => {
        const cat = docSnap.data();
        if (cat.is_active !== false && cat.name) {
          xml += `  <url>\n`;
          xml += `    <loc>${BASE_URL}/shop?category=${encodeURIComponent(cat.name)}</loc>\n`;
          xml += `    <lastmod>${currentDate}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }
      });
    }

    // 3. Fetch Active Products from Firestore
    const prodSnap = await getDocs(collection(db, "products"));
    if (!prodSnap.empty) {
      prodSnap.docs.forEach((docSnap) => {
        const prod = docSnap.data();
        if (prod.is_active !== false) {
          const prodUrl = `${BASE_URL}/product/${docSnap.id}`;
          const prodImg = prod.image || (Array.isArray(prod.images) ? prod.images[0] : "");
          const prodDate = prod.updatedAt?.toDate?.()?.toISOString()?.split("T")[0]
            || prod.createdAt?.toDate?.()?.toISOString()?.split("T")[0]
            || currentDate;

          xml += `  <url>\n`;
          xml += `    <loc>${prodUrl}</loc>\n`;
          xml += `    <lastmod>${prodDate}</lastmod>\n`;
          xml += `    <changefreq>daily</changefreq>\n`;
          xml += `    <priority>0.85</priority>\n`;

          if (prodImg) {
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${escapeXml(prodImg)}</image:loc>\n`;
            xml += `      <image:title>${escapeXml(prod.name || "Mahirash Fragrance")}</image:title>\n`;
            xml += `    </image:image>\n`;
          }

          xml += `  </url>\n`;
        }
      });
    }

    // 4. Fetch Active Blogs from Firestore
    const blogSnap = await getDocs(collection(db, "blogs"));
    if (!blogSnap.empty) {
      blogSnap.docs.forEach((docSnap) => {
        const blog = docSnap.data();
        if (blog.is_active !== false) {
          const blogUrl = `${BASE_URL}/blog/${blog.slug || docSnap.id}`;
          xml += `  <url>\n`;
          xml += `    <loc>${blogUrl}</loc>\n`;
          xml += `    <lastmod>${currentDate}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        }
      });
    }
  } catch (err) {
    console.error("Error generating dynamic sitemap from Firestore:", err);
  }

  xml += `</urlset>\n`;
  return xml;
};

/**
 * Triggers a download of the newly generated dynamic sitemap.xml in browser
 */
export const downloadDynamicSitemap = async () => {
  const xmlContent = await generateDynamicSitemapXML();
  const blob = new Blob([xmlContent], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sitemap.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return xmlContent;
};
