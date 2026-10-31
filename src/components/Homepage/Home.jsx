import React from 'react';
import Hero from '../Home/Hero';
import CategorySection from '../Home/CategorySection';
import Bestsellers from '../Home/Bestsellers';
import ShopTheLook from '../Home/ShopTheLook';
import BenefitsStrip from '../Home/BenefitsStrip';
import GallerySwiper from '../Home/GallerySwiper';
import Testimonials from '../Home/Testimonials';
import RandomProducts from '../Home/RandomProducts';
import TheJournal from '../Home/TheJournal';
import HomeFAQ from '../Home/HomeFAQ';
import SEOHead from '../SEOHead';

const Home = () => {
  return (
    <main className="bg-[#FCF9F4] text-[#30231F] min-h-screen relative overflow-hidden selection:bg-[#800020] selection:text-white">

      <SEOHead
        title="Mahirash | Luxury Perfumes & Pure Fragrance Extraits"
        description="Explore Mahirash for luxury long-lasting perfumes, royal oud blends, and fine fragrance gift collections. Express delivery across India."
        keywords="Mahirash, Mahirash perfumes, luxury perfume, oud perfume, buy perfume online India, best perfume brand India"
        url="https://mahirash.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          "name": "Mahirash Luxury Perfumes",
          "url": "https://mahirash.com/",
          "logo": "/logom.webp",
          "email": "help@mahirash.com",
          "telephone": "+91-8959041514",
          "description": "Mahirash is a modern luxury fragrance house offering rare extrait de parfums, artisan botanical blends, and royal ouds with express shipping across India."
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
        <TheJournal />
        <HomeFAQ />
        <Testimonials />
      </div>
    </main>
  );
};

export default Home;
