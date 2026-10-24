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
      <div className="p-6 rounded-2xl border bg-white border-[#E9DCCB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="text-[#800020]" size={22} />
            <h2 className="text-xl font-serif font-bold text-[#30231F]">Search Engine Optimization (SEO) & Dynamic Sitemap</h2>
          </div>
          <p className="text-sm text-[#75665D]">
            Real-time sitemap generation, OpenGraph metadata, Google Rich Snippets (Schema.org), and robots.txt crawling configuration.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FCF9F4] hover:bg-[#E9DCCB]/40 text-[#30231F] border border-[#E9DCCB] font-semibold rounded-xl text-sm transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh Counts</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSitemap}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#800020] text-white font-semibold rounded-xl hover:bg-[#650018] transition-all shadow-md shadow-[#800020]/25 text-sm cursor-pointer"
          >
            <Download size={15} />
            <span>{downloading ? "Generating..." : "Download sitemap.xml"}</span>
          </button>
        </div>
      </div>

      {/* Real-time Sitemap Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E9DCCB] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#75665D]">Total Sitemap URLs</span>
            <h3 className="text-2xl font-serif font-bold text-[#30231F] mt-1">{totalIndexedUrls}</h3>
            <span className="text-[12px] text-[#800020] font-semibold flex items-center gap-1 mt-1">
              <CheckCircle size={12} /> Auto-synced with DB
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center">
            <FileCode size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E9DCCB] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#75665D]">Active Products Indexed</span>
            <h3 className="text-2xl font-serif font-bold text-[#30231F] mt-1">{stats.productsCount}</h3>
            <span className="text-[12px] text-[#75665D] mt-1 block">With Schema.org & images</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center">
            <Search size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E9DCCB] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#75665D]">Catalog Categories</span>
            <h3 className="text-2xl font-serif font-bold text-[#30231F] mt-1">{stats.categoriesCount}</h3>
            <span className="text-[12px] text-[#75665D] mt-1 block">Dynamic URL routes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E9DCCB] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#75665D]">Core Store Pages</span>
            <h3 className="text-2xl font-serif font-bold text-[#30231F] mt-1">{stats.totalPages}</h3>
            <span className="text-[12px] text-[#75665D] mt-1 block">Home, Shop, About, Legal</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Live Sitemap Link & Direct Access Bar */}
      <div className="p-5 bg-[#30231F] text-white rounded-2xl border border-[#650018]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B88D46] mb-1">
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
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-[#B88D46]" /> : <Copy size={14} />}
            <span>{copied ? "Copied URL!" : "Copy URL"}</span>
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#650018] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-md"
          >
            <span>Open in New Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* SEO Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
            <h3 className="font-bold text-[#30231F] text-base flex items-center gap-2">
              <Share2 size={16} className="text-[#800020]" />
              Global Meta Defaults
            </h3>
            {saveSuccess && (
              <span className="text-xs text-[#800020] font-bold flex items-center gap-1">
                <Check size={14} /> Saved Successfully
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#75665D]">Default Title Pattern</label>
            <input
              type="text"
              value={seoSettings.defaultTitle}
              onChange={e => setSeoSettings({ ...seoSettings, defaultTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCCB] text-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none text-[#30231F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#75665D]">Default Meta Description</label>
            <textarea
              rows={3}
              value={seoSettings.defaultDescription}
              onChange={e => setSeoSettings({ ...seoSettings, defaultDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCCB] text-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none resize-none text-[#30231F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#75665D]">Global Keywords (Comma-separated)</label>
            <input
              type="text"
              value={seoSettings.defaultKeywords}
              onChange={e => setSeoSettings({ ...seoSettings, defaultKeywords: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCCB] text-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none text-[#30231F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#75665D]">Author</label>
              <input
                type="text"
                value={seoSettings.defaultAuthor}
                onChange={e => setSeoSettings({ ...seoSettings, defaultAuthor: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCCB] text-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none text-[#30231F]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#75665D]">Canonical Domain</label>
              <input
                type="url"
                value={seoSettings.canonicalDomain}
                onChange={e => setSeoSettings({ ...seoSettings, canonicalDomain: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCCB] text-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none text-[#30231F]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#800020] hover:bg-[#650018] text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-[#800020]/25"
            >
              Save SEO Configuration
            </button>
          </div>
        </form>

        {/* Robots.txt Live Inspector */}
        <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
              <h3 className="font-bold text-[#30231F] text-base flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#800020]" />
                robots.txt Rules Inspector
              </h3>
              <span className="text-[12px] font-mono px-2 py-0.5 bg-[#800020]/10 text-[#800020] rounded-md font-bold border border-[#800020]/20">
                Active: /robots.txt
              </span>
            </div>
            <p className="text-xs text-[#75665D]">
              The following rules protect sensitive checkout and customer account areas while prioritizing product catalogue indexing:
            </p>
            <div className="bg-[#30231F] p-4 rounded-xl border border-[#650018]/40 text-[12px] font-mono text-zinc-300 space-y-1 overflow-x-auto leading-relaxed shadow-inner">
              <p className="text-[#B88D46] font-bold"># Public Routes Allowed</p>
              <p className="text-zinc-300">Allow: /</p>
              <p className="text-zinc-300">Allow: /shop</p>
              <p className="text-zinc-300">Allow: /product/*</p>
              <p className="text-[#800020] font-bold pt-1"># Private Routes Disallowed</p>
              <p className="text-zinc-400">Disallow: /admin/*</p>
              <p className="text-zinc-400">Disallow: /cart</p>
              <p className="text-zinc-400">Disallow: /checkout</p>
              <p className="text-zinc-400">Disallow: /account</p>
              <p className="text-[#B88D46] font-bold pt-1"># Linked Sitemap</p>
              <p className="text-zinc-300">Sitemap: https://mahirash.com/sitemap.xml</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E9DCCB]">
            <span className="text-xs text-[#75665D]">Location: <code className="text-[#30231F] font-mono bg-[#FCF9F4] px-1.5 py-0.5 rounded border border-[#E9DCCB]">public/robots.txt</code></span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#800020] hover:underline font-bold flex items-center gap-1"
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
