import React from 'react';
import Hero from '../Home/Hero';
import CategorySection from '../Home/CategorySection';
import Bestsellers from '../Home/Bestsellers';
import ShopTheLook from '../Home/ShopTheLook';
import BenefitsStrip from '../Home/BenefitsStrip';
import GallerySwiper from '../Home/GallerySwiper';
import Testimonials from '../Home/Testimonials';
import RandomProducts from '../Home/RandomProducts';
import SEOHead from '../SEOHead';

const Home = () => {
  return (
    <main className="bg-[#FAF8F5] text-[#111111] min-h-screen relative overflow-hidden selection:bg-[#B8860B] selection:text-white">
      {/* Ambient Radial Golden Light Lighting Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(184,134,11,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_bottom_right,rgba(184,134,11,0.04)_0%,transparent_60%)] pointer-events-none z-0" />

      <SEOHead
        title="Mahirash Parfumerie | Haute Parfumerie & Luxury Artisan Extraits"
        description="Explore Mahirash Parfumerie for rare extrait de parfums, royal oud blends, luxury eau de parfums, and bespoke fragrance collections. Worldwide express shipping."
        keywords="Mahirash, Mahirash Parfumerie, mahirash.com, luxury perfume, extrait de parfum, royal oud, designer fragrance India, niche perfumerie"
        url="https://mahirash.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          "name": "Mahirash Parfumerie",
          "url": "https://mahirash.com/",
          "logo": "/logom.webp",
          "email": "help@mahirash.com",
          "telephone": "+91-8959041514",
          "description": "Mahirash Parfumerie is a modern haute perfumerie atelier offering rare extrait de parfums, artisan botanical blends, and royal ouds with express worldwide shipping."
        }}
      />
      <div className="relative z-10">
        <Hero />
        <BenefitsStrip />
        <GallerySwiper />
        <CategorySection />
        <Bestsellers />
        <RandomProducts />
        <ShopTheLook />
        <Testimonials />
      </div>
    </main>
  );
};

export default Home;
