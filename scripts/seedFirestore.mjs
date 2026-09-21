import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: "mahirsh-perfumes.firebaseapp.com",
  projectId: "mahirsh-perfumes",
  storageBucket: "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: "1072646270197",
  appId: "1:1072646270197:web:6d3f2179eaf9d37668e9bc",
  measurementId: "G-BTBJLT8N3J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const categories = [
  { id: 'cat_extrait', name: 'Extrait de Parfum', slug: 'extrait-de-parfum', description: 'Concentrated 25-30% Artisanal Extraits', is_active: true, sort_order: 1 },
  { id: 'cat_eau_parfum', name: 'Eau de Parfum', slug: 'eau-de-parfum', description: 'Rich 15-20% Everyday Luxury Perfumes', is_active: true, sort_order: 2 },
  { id: 'cat_oud', name: 'Oud Collection', slug: 'oud-collection', description: 'Royal Agarwood & Oriental Reserve', is_active: true, sort_order: 3 },
  { id: 'cat_woody', name: 'Woody & Amber', slug: 'woody-amber', description: 'Cedar, Sandalwood & Amber Formulations', is_active: true, sort_order: 4 },
  { id: 'cat_floral', name: 'Floral & Fresh', slug: 'floral-fresh', description: 'Rare Blooming Rose, Jasmine & Citrus', is_active: true, sort_order: 5 },
  { id: 'cat_gifts', name: 'Gift Sets', slug: 'gift-sets', description: 'Discovery Vaults & Luxury Gift Boxes', is_active: true, sort_order: 6 }
];

const subcategories = [
  { id: 'sub_signature_oud', name: 'Signature Oud', slug: 'signature-oud', parent_category: 'Oud Collection', is_active: true, sort_order: 1 },
  { id: 'sub_royal_extraits', name: 'Royal Extraits', slug: 'royal-extraits', parent_category: 'Extrait de Parfum', is_active: true, sort_order: 2 },
  { id: 'sub_amber_spice', name: 'Amber & Spice', slug: 'amber-spice', parent_category: 'Woody & Amber', is_active: true, sort_order: 3 },
  { id: 'sub_fresh_citrus', name: 'Zesty Citrus', slug: 'zesty-citrus', parent_category: 'Floral & Fresh', is_active: true, sort_order: 4 },
  { id: 'sub_discovery_vault', name: 'Discovery Set', slug: 'discovery-set', parent_category: 'Gift Sets', is_active: true, sort_order: 5 },
  { id: 'sub_gourmand', name: 'Gourmand Reserve', slug: 'gourmand-reserve', parent_category: 'Eau de Parfum', is_active: true, sort_order: 6 }
];

const products = [
  {
    id: "prod_royal_oud",
    name: "Royal Oud Extrait de Parfum",
    category: "Oud Collection",
    subcategory: "Signature Oud",
    collection: "The Royal Edition",
    gender: "Unisex",
    description: "<p>A opulent formulation crafted with rare Cambodian Agarwood, infused with Saffron, Smoked Cedar, and golden Amber.</p>",
    price: 4999,
    original_price: 6999,
    size_prices: [
      { size: "50ml", price: 4999, original_price: 6999 },
      { size: "100ml", price: 7999, original_price: 9999 },
      { size: "Sample Set", price: 999, original_price: 1499 }
    ],
    stock: 25,
    stock_status: "In Stock",
    sizes: "50ml, 100ml, Sample Set",
    colors: "Oud, Woody, Amber, Spice",
    material: "Extrait de Parfum (30%)",
    top_notes: "Cambodian Agarwood, Saffron, Pink Pepper",
    heart_notes: "Bulgarian Rose, Smoked Cedar, Patchouli",
    base_notes: "Assam Oud, Golden Amber, Creamy Musk",
    longevity: "14+ Hours",
    sillage: "Intense Projection",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.6, length: 15, breadth: 10, height: 20 },
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_velvet_amber",
    name: "Velvet Amber & Vanilla",
    category: "Woody & Amber",
    subcategory: "Amber & Spice",
    collection: "Bestselling Scents",
    gender: "Women",
    description: "<p>Warm, seductive Madagascar Vanilla blended seamlessly with golden Amber, Tonka Bean, and Bourbon Vanilla.</p>",
    price: 3499,
    original_price: 4499,
    size_prices: [
      { size: "50ml", price: 3499, original_price: 4499 },
      { size: "100ml", price: 5499, original_price: 6999 }
    ],
    stock: 18,
    stock_status: "In Stock",
    sizes: "50ml, 100ml",
    colors: "Amber, Vanilla, Spice, Gourmand",
    material: "Eau de Parfum (20%)",
    top_notes: "Madagascar Vanilla, Cardamom, Bergamot",
    heart_notes: "Golden Amber, Tonka Bean, Cinnamon",
    base_notes: "White Musk, Sandalwood, Bourbon Vanilla",
    longevity: "10-12 Hours",
    sillage: "Moderate to Heavy",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.5, length: 14, breadth: 10, height: 18 },
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_imperium_citrus",
    name: "Imperium Citrus & Vetiver",
    category: "Floral & Fresh",
    subcategory: "Zesty Citrus",
    collection: "New Launches",
    gender: "Men",
    description: "<p>A crisp, invigorating burst of Calabrian Bergamot and Grapefruit layered over Haitian Vetiver and Oakmoss.</p>",
    price: 2999,
    original_price: 3999,
    size_prices: [
      { size: "50ml", price: 2999, original_price: 3999 },
      { size: "100ml", price: 4999, original_price: 5999 }
    ],
    stock: 30,
    stock_status: "In Stock",
    sizes: "50ml, 100ml",
    colors: "Citrus, Woody, Fresh, Vetiver",
    material: "Eau de Parfum (20%)",
    top_notes: "Calabrian Bergamot, Lemon Zest, Grapefruit",
    heart_notes: "Haitian Vetiver, Pink Pepper, Cedar",
    base_notes: "Oakmoss, Ambergris, Dry Woods",
    longevity: "8-10 Hours",
    sillage: "Fresh & Crisp",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.5, length: 14, breadth: 10, height: 18 },
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_sultanate_oud",
    name: "Sultanate Oud Extraordinaire",
    category: "Extrait de Parfum",
    subcategory: "Royal Extraits",
    collection: "Private Reserve",
    gender: "Unisex",
    description: "<p>Our pinnacle creation: pure 35% concentration featuring Royal Indian Oud, Leather, Birch Tar, and Black Amber.</p>",
    price: 8999,
    original_price: 11999,
    size_prices: [
      { size: "50ml", price: 8999, original_price: 11999 },
      { size: "100ml", price: 13999, original_price: 16999 }
    ],
    stock: 10,
    stock_status: "In Stock",
    sizes: "50ml, 100ml",
    colors: "Oud, Leather, Spice, Amber",
    material: "Pure Extrait de Parfum (35%)",
    top_notes: "Incense, Saffron, Thyme",
    heart_notes: "Royal Indian Oud, Leather Accord, Rose Absolue",
    base_notes: "Black Amber, Birch Tar, Sandalwood",
    longevity: "16+ Hours",
    sillage: "Enveloping & Heavy",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.7, length: 16, breadth: 12, height: 22 },
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_discovery_vault",
    name: "Mahirash Discovery Vault (5 x 10ml)",
    category: "Gift Sets",
    subcategory: "Discovery Set",
    collection: "New Launches",
    gender: "Unisex",
    description: "<p>Experience our entire haute parfumerie collection in 5 travel luxury atomizers (Royal Oud, Velvet Amber, Imperium, Sultanate, Rose Royale).</p>",
    price: 1999,
    original_price: 2999,
    size_prices: [
      { size: "Sample Set", price: 1999, original_price: 2999 }
    ],
    stock: 40,
    stock_status: "In Stock",
    sizes: "Sample Set",
    colors: "Oud, Amber, Citrus, Rose, Vanilla",
    material: "Discovery Vault",
    top_notes: "Assorted Luxury Top Notes",
    heart_notes: "Assorted Signature Middle Notes",
    base_notes: "Assorted Rare Base Notes",
    longevity: "10-14 Hours",
    sillage: "Varies per scent",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.8, length: 20, breadth: 15, height: 8 },
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_rose_royale",
    name: "Rose Royale Eau de Parfum",
    category: "Floral & Fresh",
    subcategory: "Zesty Citrus",
    collection: "Bestselling Scents",
    gender: "Women",
    description: "<p>A regal blend of Taif Rose petals, Pink Peppercorn, and Turkish Rose on a bed of White Amber and Honey.</p>",
    price: 3799,
    original_price: 4999,
    size_prices: [
      { size: "50ml", price: 3799, original_price: 4999 },
      { size: "100ml", price: 5999, original_price: 7499 }
    ],
    stock: 22,
    stock_status: "In Stock",
    sizes: "50ml, 100ml",
    colors: "Floral, Rose, Amber, Fresh",
    material: "Eau de Parfum (20%)",
    top_notes: "Taif Rose, Pink Peppercorn",
    heart_notes: "Turkish Rose, Jasmine, Lychee",
    base_notes: "White Amber, Honey, Cedarwood",
    longevity: "10-12 Hours",
    sillage: "Radiant Floral",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop"
    ],
    shipping: { weight: 0.5, length: 14, breadth: 10, height: 18 },
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log("🚀 Starting Firestore Seeding for Mahirash Luxury Perfumes...");

  try {
    await signInWithEmailAndPassword(auth, "mahirsh9999@gmail.com", "Super@321.Admin");
    console.log("🔑 Authenticated as Super Admin");
  } catch (authErr) {
    try {
      await createUserWithEmailAndPassword(auth, "mahirsh9999@gmail.com", "Super@321.Admin");
      console.log("🔑 Registered and Authenticated as Super Admin");
    } catch (createErr) {
      console.warn("Auth warning:", createErr.message);
    }
  }

  for (const cat of categories) {
    await setDoc(doc(db, "categories", cat.id), cat);
    console.log(`✓ Seeded Category: ${cat.name}`);
  }

  for (const sub of subcategories) {
    await setDoc(doc(db, "subcategories", sub.id), sub);
    console.log(`✓ Seeded Subcategory: ${sub.name}`);
  }

  for (const prod of products) {
    await setDoc(doc(db, "products", prod.id), prod);
    console.log(`✓ Seeded Product: ${prod.name}`);
  }

  console.log("🎉 Firestore Seeding Successfully Completed!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
