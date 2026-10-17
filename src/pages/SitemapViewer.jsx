import React, { useState, useEffect } from "react";
import { generateDynamicSitemapXML, downloadDynamicSitemap } from "../utils/sitemapGenerator";
import { Download, RefreshCw, FileCode, Check } from "lucide-react";

const SitemapViewer = () => {
  const [xml, setXml] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadSitemap = async () => {
    setLoading(true);
    try {
      const result = await generateDynamicSitemapXML();
      setXml(result);
    } catch (err) {
      console.error(err);
      setXml("<!-- Error generating sitemap -->");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSitemap();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-zinc-200 font-mono text-xs p-4 sm:p-8 pt-36">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-[#c9a962]" />
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic XML Sitemap</h1>
              <p className="text-[12px] text-zinc-400">Live generated from active Firestore products, categories & pages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSitemap}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : null}
              <span>{copied ? "Copied!" : "Copy XML"}</span>
            </button>
            <button
              onClick={downloadDynamicSitemap}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#b8860b] hover:bg-[#a07409] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download sitemap.xml</span>
            </button>
          </div>
        </div>

        {/* XML Raw Viewer */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 overflow-x-auto shadow-2xl">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#b8860b]" />
              <p>Fetching real-time sitemap from database...</p>
            </div>
          ) : (
            <pre className="text-emerald-400/90 whitespace-pre font-mono leading-relaxed select-all">
              {xml}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default SitemapViewer;
