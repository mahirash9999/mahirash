import React, { useState, useEffect } from "react";
import {
  Globe,
  FileCode,
  Download,
  ExternalLink,
  Check,
  RefreshCw,
  Search,
  CheckCircle,
  Copy,
  Sparkles,
  ShieldCheck,
  Share2
} from "lucide-react";
import { generateDynamicSitemapXML, downloadDynamicSitemap } from "../../../utils/sitemapGenerator";
import { db } from "../../../components/Firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const SEOManager = () => {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    blogsCount: 0,
    totalPages: 7
  });

  const [seoSettings, setSeoSettings] = useState({
    defaultTitle: "Mahirash | Luxury Perfumes & Artisan Extraits",
    defaultDescription: "Discover Mahirash luxury fragrances, rare botanical extraits de parfum, artisanal Cambodian oud, and signature perfumes designed to leave a lasting impression.",
    defaultKeywords: "Mahirash, Mahirash perfumes, luxury perfumes, extrait de parfum, royal oud, fine fragrances, artisanal scents, luxury fragrance house India",
    defaultAuthor: "Mahirash Parfumerie",
    canonicalDomain: "https://mahirash.com"
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [prodSnap, catSnap, blogSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "blogs"))
      ]);

      setStats({
        productsCount: prodSnap.docs.filter(d => d.data().is_active !== false).length,
        categoriesCount: catSnap.docs.filter(d => d.data().is_active !== false).length,
        blogsCount: blogSnap.docs.filter(d => d.data().is_active !== false).length,
        totalPages: 7
      });

      const settingsDoc = await getDoc(doc(db, "settings", "seo_settings"));
      if (settingsDoc.exists()) {
        setSeoSettings(prev => ({ ...prev, ...settingsDoc.data() }));
      }
    } catch (err) {
      console.error("Error fetching SEO stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadSitemap = async () => {
    setDownloading(true);
    try {
      await downloadDynamicSitemap();
    } catch (err) {
      alert("Failed to download sitemap: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("https://mahirash.com/sitemap.xml");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "seo_settings"), seoSettings, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    }
  };

  const totalIndexedUrls = stats.totalPages + stats.categoriesCount + stats.productsCount + stats.blogsCount;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border bg-white border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="text-[#b8860b]" size={22} />
            <h2 className="text-xl font-bold text-zinc-900">Search Engine Optimization (SEO) & Dynamic Sitemap</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Real-time sitemap generation, OpenGraph metadata, Google Rich Snippets (Schema.org), and robots.txt crawling configuration.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh Counts</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSitemap}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#b8860b] text-white font-semibold rounded-xl hover:bg-black transition-all shadow-md text-sm cursor-pointer"
          >
            <Download size={15} />
            <span>{downloading ? "Generating..." : "Download sitemap.xml"}</span>
          </button>
        </div>
      </div>

      {/* Real-time Sitemap Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Total Sitemap URLs</span>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{totalIndexedUrls}</h3>
            <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle size={12} /> Auto-synced with DB
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#b8860b] flex items-center justify-center">
            <FileCode size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Active Products Indexed</span>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.productsCount}</h3>
            <span className="text-[12px] text-zinc-500 mt-1 block">With Schema.org & images</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Search size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Catalog Categories</span>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.categoriesCount}</h3>
            <span className="text-[12px] text-zinc-500 mt-1 block">Dynamic URL routes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Core Store Pages</span>
            <h3 className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalPages}</h3>
            <span className="text-[12px] text-zinc-500 mt-1 block">Home, Shop, About, Legal</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Live Sitemap Link & Direct Access Bar */}
      <div className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e5d5ab] mb-1">
            <Globe size={14} />
            <span>Live Dynamic Sitemap Endpoint</span>
          </div>
          <p className="font-mono text-sm text-zinc-300">https://mahirash.com/sitemap.xml</p>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Crawlers (Googlebot, Bingbot) and users can access this URL directly for real-time indexing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "Copied URL!" : "Copy URL"}</span>
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#b8860b] hover:bg-[#9a7008] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <span>Open in New Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* SEO Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveSettings} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
              <Share2 size={16} className="text-[#b8860b]" />
              Global Meta Defaults
            </h3>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check size={14} /> Saved Successfully
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Default Title Pattern</label>
            <input
              type="text"
              value={seoSettings.defaultTitle}
              onChange={e => setSeoSettings({ ...seoSettings, defaultTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:border-[#b8860b] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Default Meta Description</label>
            <textarea
              rows={3}
              value={seoSettings.defaultDescription}
              onChange={e => setSeoSettings({ ...seoSettings, defaultDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:border-[#b8860b] outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Global Keywords (Comma-separated)</label>
            <input
              type="text"
              value={seoSettings.defaultKeywords}
              onChange={e => setSeoSettings({ ...seoSettings, defaultKeywords: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:border-[#b8860b] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Author</label>
              <input
                type="text"
                value={seoSettings.defaultAuthor}
                onChange={e => setSeoSettings({ ...seoSettings, defaultAuthor: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:border-[#b8860b] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">Canonical Domain</label>
              <input
                type="url"
                value={seoSettings.canonicalDomain}
                onChange={e => setSeoSettings({ ...seoSettings, canonicalDomain: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm focus:border-[#b8860b] outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#b8860b] hover:bg-black text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-sm"
            >
              Save SEO Configuration
            </button>
          </div>
        </form>

        {/* Robots.txt Live Inspector */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#b8860b]" />
                robots.txt Rules Inspector
              </h3>
              <span className="text-[12px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">
                Active: /robots.txt
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              The following rules protect sensitive checkout and customer account areas while prioritizing product catalogue indexing:
            </p>
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-[12px] font-mono text-zinc-300 space-y-1 overflow-x-auto leading-relaxed">
              <p className="text-emerald-400 font-bold"># Public Routes Allowed</p>
              <p className="text-zinc-400">Allow: /</p>
              <p className="text-zinc-400">Allow: /shop</p>
              <p className="text-zinc-400">Allow: /product/*</p>
              <p className="text-amber-400 font-bold pt-1"># Private Routes Disallowed</p>
              <p className="text-zinc-500">Disallow: /admin/*</p>
              <p className="text-zinc-500">Disallow: /cart</p>
              <p className="text-zinc-500">Disallow: /checkout</p>
              <p className="text-zinc-500">Disallow: /account</p>
              <p className="text-[#e5d5ab] font-bold pt-1"># Linked Sitemap</p>
              <p className="text-zinc-300">Sitemap: https://mahirash.com/sitemap.xml</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">Location: <code className="text-zinc-800 font-mono">public/robots.txt</code></span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#b8860b] hover:underline font-bold flex items-center gap-1"
            >
              <span>View Live robots.txt</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOManager;
