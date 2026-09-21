import React from 'react';
import { motion } from 'framer-motion';
import { Gem, Shield, Heart, Compass, Leaf, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../components/Firebase';
import { doc, getDoc } from 'firebase/firestore';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';
import OptimizedCloudinaryImage from '../components/OptimizedCloudinaryImage';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }
};

const About = () => {
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'settings', 'about_page');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setContent(snap.data().content || '');
        } else {
          setContent('');
        }
      } catch (err) {
        console.error("Failed to load about page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title="Our Story & Atelier Philosophy | Mahirash"
        description="Discover the story behind Mahirash. Crafted with rare botanical extraits, unyielding luxury standards, and haute parfumerie heritage."
        url="https://mahirash.com/about"
        keywords="Mahirash story, about Mahirash, luxury perfume brand India, haute parfumerie philosophy"
      />
      <PageHeader
        title="Our Atelier Story"
        subtitle="Crafted with rare botanical extraits, designed for the olfactory connoisseur."
        breadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'About Us' },
        ]}
      />

      <section className="py-16 md:py-24 bg-[#f5f5f5]">
        <div className="max-w-5xl mx-auto px-5 md:px-10 lg:px-14">
          <div
            className="prose prose-zinc lg:prose-lg max-w-none text-zinc-600 font-light leading-relaxed cms-content-editor"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </section>

    </div>
  );
};

export default About;
