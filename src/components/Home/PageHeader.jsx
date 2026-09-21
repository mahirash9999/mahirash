import React from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const PageHeader = ({ title, subtitle, breadcrumbItems = [] }) => {
  return (
    <section className="relative w-full bg-[#f5f5f5] mt-[145px] md:mt-[130px] overflow-hidden border-b border-zinc-200">
      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14 py-5">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;
            if (isLast) {
              return (
                <React.Fragment key={index}>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-700">
                    {item.label}
                  </span>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={index}>
                <Link
                  to={item.path || "/"}
                  className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors"
                >
                  {isFirst && <Home size={12} strokeWidth={2} />}
                  <span>{item.label}</span>
                </Link>
                <ChevronRight size={10} className="text-zinc-300" strokeWidth={2.5} />
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </section>
  );
};

export default PageHeader;
