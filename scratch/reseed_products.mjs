import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

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

const NEW_10_PRODUCTS = [
  {
    id: "dior-sauvage-elixir",
    name: "DIOR Sauvage Elixir",
    brand: "DIOR",
    category: "Extrait De Parfum",
    subcategory: "Designer Luxury",
    collection: "Connoisseur Selection",
    gender: "Men",
    fragrance_family: "Aromatic Spicy",
    fragrance_concentration: "Extrait De Parfum (30-40%)",
    price: 11000,
    original_price: 14000,
    sizes: "60ml, 100ml",
    size_prices: [
      {
        size: "60ml",
        price: 11000,
        original_price: 14000,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 16500,
        original_price: 20000,
        stock: 0,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800"
        ]
      }
    ],
    rating: 5.0,
    reviews_count: 476,
    top_notes: "Cinnamon, Nutmeg, Cardamom, Grapefruit",
    heart_notes: "Lavender",
    base_notes: "Licorice, Sandalwood, Amber, Patchouli, Haitian Vetiver",
    longevity: "16+ Hours",
    sillage: "Enormous",
    tags: ["BESTSELLER", "EXTRAIT"],
    description: "An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices, a 'tailored' lavender essence and a blend of rich woods forming the signature of its powerful trail."
  },
  {
    id: "bleu-de-chanel-parfum",
    name: "BLEU DE CHANEL Parfum",
    brand: "CHANEL",
    category: "Parfum",
    subcategory: "Designer Luxury",
    collection: "Private Reserve",
    gender: "Men",
    fragrance_family: "Woody Aromatic",
    fragrance_concentration: "Parfum (20-30%)",
    price: 9800,
    original_price: 12000,
    sizes: "50ml, 100ml",
    size_prices: [
      {
        size: "50ml",
        price: 9800,
        original_price: 12000,
        stock: 18,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 15200,
        original_price: 18500,
        stock: 12,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      }
    ],
    rating: 4.9,
    reviews_count: 389,
    top_notes: "Lemon Zest, Bergamot, Mint, Artemisia",
    heart_notes: "Lavender, Pineapple, Geranium, Green Notes",
    base_notes: "Sandalwood, Cedar, Amberwood, Iso E Super, Tonka Bean",
    longevity: "12-14 Hours",
    sillage: "Strong",
    tags: ["ICONIC", "LUXURY"],
    description: "The most intense expression of BLEU DE CHANEL. An aromatic, intensely woody fragrance that opens with powerful freshness and lingers with an extraordinary accord of New Caledonian sandalwood."
  },
  {
    id: "baccarat-rouge-540-extrait",
    name: "BACCARAT ROUGE 540 Extrait",
    brand: "MAISON FRANCIS KURKDJIAN",
    category: "Extrait De Parfum",
    subcategory: "Niche Hauteur",
    collection: "Royal Vault",
    gender: "Unisex",
    fragrance_family: "Amber Floral",
    fragrance_concentration: "Extrait De Parfum (30-40%)",
    price: 32000,
    original_price: 38000,
    sizes: "70ml, 200ml",
    size_prices: [
      {
        size: "70ml",
        price: 32000,
        original_price: 38000,
        stock: 8,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      },
      {
        size: "200ml",
        price: 65000,
        original_price: 75000,
        stock: 0,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"
        ]
      }
    ],
    rating: 5.0,
    reviews_count: 512,
    top_notes: "Bitter Almond, Saffron",
    heart_notes: "Egyptian Jasmine, Cedarwood",
    base_notes: "Ambergris, Woody Musks, Cashmeran",
    longevity: "18+ Hours",
    sillage: "Enormous",
    tags: ["ULTRA LUXURY", "SIGNATURE"],
    description: "The Extrait de parfum augments the strength and radiance of the fragrance's amber woody floral aura. Jasmine blossoms and woody musks engage in an alchemy of the senses."
  },
  {
    id: "tom-ford-tobacco-vanille",
    name: "TOM FORD Tobacco Vanille",
    brand: "TOM FORD",
    category: "Eau de Parfum",
    subcategory: "Private Blend",
    collection: "Connoisseur Selection",
    gender: "Unisex",
    fragrance_family: "Oriental Spicy",
    fragrance_concentration: "Eau de Parfum (15-20%)",
    price: 18500,
    original_price: 22000,
    sizes: "50ml, 100ml",
    size_prices: [
      {
        size: "50ml",
        price: 18500,
        original_price: 22000,
        stock: 14,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=800",
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 29000,
        original_price: 34000,
        stock: 9,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=800"
        ]
      }
    ],
    rating: 4.9,
    reviews_count: 320,
    top_notes: "Tobacco Leaf, Spicy Notes",
    heart_notes: "Vanilla, Cacao, Tonka Bean, Tobacco Blossom",
    base_notes: "Dried Fruits, Woody Notes",
    longevity: "14+ Hours",
    sillage: "Strong",
    tags: ["BESTSELLER", "PRIVATE BLEND"],
    description: "Opulent, warm and iconic. Tom Ford's affection for London inspired this scent, reminiscent of an English gentlemen's club, redolent with spice and rich tobacco."
  },
  {
    id: "creed-aventus",
    name: "CREED Aventus",
    brand: "CREED",
    category: "Eau de Parfum",
    subcategory: "Heritage Niche",
    collection: "Royal Vault",
    gender: "Men",
    fragrance_family: "Chypre Fruity",
    fragrance_concentration: "Eau de Parfum (15-20%)",
    price: 24000,
    original_price: 28000,
    sizes: "50ml, 100ml",
    size_prices: [
      {
        size: "50ml",
        price: 24000,
        original_price: 28000,
        stock: 12,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 36500,
        original_price: 42000,
        stock: 6,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800"
        ]
      }
    ],
    rating: 4.9,
    reviews_count: 615,
    top_notes: "Pineapple, Bergamot, Black Currant, Apple",
    heart_notes: "Birch, Patchouli, Moroccan Jasmine, Rose",
    base_notes: "Musk, Oakmoss, Ambergris, Vanille",
    longevity: "12-14 Hours",
    sillage: "Strong & Radiating",
    tags: ["LEGENDARY", "ROYAL"],
    description: "The exceptional Aventus was inspired by the dramatic life of a historic emperor, celebrating strength, power and success. Sensory notes of blackcurrant, Italian bergamot and French apples."
  },
  {
    id: "ysl-libre-le-parfum",
    name: "YVES SAINT LAURENT Libre Le Parfum",
    brand: "YVES SAINT LAURENT",
    category: "Extrait De Parfum",
    subcategory: "Designer Luxury",
    collection: "Connoisseur Selection",
    gender: "Women",
    fragrance_family: "Warm Floral",
    fragrance_concentration: "Extrait De Parfum (30-40%)",
    price: 8900,
    original_price: 10500,
    sizes: "50ml, 90ml",
    size_prices: [
      {
        size: "50ml",
        price: 8900,
        original_price: 10500,
        stock: 20,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"
        ]
      },
      {
        size: "90ml",
        price: 13400,
        original_price: 16000,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      }
    ],
    rating: 4.8,
    reviews_count: 245,
    top_notes: "Ginger, Saffron, Mandarin Orange, Bergamot",
    heart_notes: "Orange Blossom, French Diva Lavender",
    base_notes: "Bourbon Vanilla, Honey, Tonka Bean, Vetiver",
    longevity: "12+ Hours",
    sillage: "Strong",
    tags: ["BESTSELLER", "HOT"],
    description: "The most concentrated and long-lasting iteration of Libre. Enriched with saffron accord harvested in the Ourika Community Gardens, blazing with an insolent sensuality."
  },
  {
    id: "parfums-de-marly-layton",
    name: "PARFUMS DE MARLY Layton",
    brand: "PARFUMS DE MARLY",
    category: "Eau de Parfum",
    subcategory: "Haute Parfumerie",
    collection: "Royal Vault",
    gender: "Unisex",
    fragrance_family: "Oriental Floral",
    fragrance_concentration: "Eau de Parfum (15-20%)",
    price: 19500,
    original_price: 23000,
    sizes: "75ml, 125ml",
    size_prices: [
      {
        size: "75ml",
        price: 19500,
        original_price: 23000,
        stock: 10,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      },
      {
        size: "125ml",
        price: 26500,
        original_price: 31000,
        stock: 7,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        ]
      }
    ],
    rating: 4.9,
    reviews_count: 288,
    top_notes: "Apple, Lavender, Bergamot, Mandarin Orange",
    heart_notes: "Geranium, Violet, Jasmine",
    base_notes: "Vanilla, Cardamom, Sandalwood, Pepper, Guaiac Wood, Patchouli",
    longevity: "14+ Hours",
    sillage: "Enormous",
    tags: ["ROYAL", "CONNOISSEUR"],
    description: "An addictive and distinct composition infused with spicy cardamom, decadent vanilla, and crisp apple that asserts noble sophistication fit for the Court of Versailles."
  },
  {
    id: "kilian-angels-share",
    name: "KILIAN Angels' Share",
    brand: "KILIAN",
    category: "Eau de Parfum",
    subcategory: "The Liquors",
    collection: "Connoisseur Selection",
    gender: "Unisex",
    fragrance_family: "Warm Gourmand",
    fragrance_concentration: "Eau de Parfum (15-20%)",
    price: 17500,
    original_price: 21000,
    sizes: "50ml, 100ml",
    size_prices: [
      {
        size: "50ml",
        price: 17500,
        original_price: 21000,
        stock: 11,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 28000,
        original_price: 33500,
        stock: 8,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800"
        ]
      }
    ],
    rating: 5.0,
    reviews_count: 360,
    top_notes: "Cognac Essence",
    heart_notes: "Cinnamon, Tonka Bean Absolute, Oak Wood",
    base_notes: "Praline, Vanilla, Creamy Sandalwood",
    longevity: "15+ Hours",
    sillage: "Intense",
    tags: ["GOURMAND", "TRENDING"],
    description: "Kilian Hennessy's most personal fragrance creation yet, inspired by his eighth-generation inheritance of Hennessy savoir-faire in cognac-making."
  },
  {
    id: "giorgio-armani-acqua-di-gio-parfum",
    name: "GIORGIO ARMANI Acqua Di Giò Parfum",
    brand: "GIORGIO ARMANI",
    category: "Parfum",
    subcategory: "Designer Luxury",
    collection: "Signature Edition",
    gender: "Men",
    fragrance_family: "Aquatic Woody",
    fragrance_concentration: "Parfum (20-30%)",
    price: 6500,
    original_price: 7800,
    sizes: "40ml, 75ml, 125ml",
    size_prices: [
      {
        size: "40ml",
        price: 6500,
        original_price: 7800,
        stock: 22,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      },
      {
        size: "75ml",
        price: 9900,
        original_price: 12000,
        stock: 16,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800"
        ]
      },
      {
        size: "125ml",
        price: 13500,
        original_price: 16500,
        stock: 10,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      }
    ],
    rating: 4.8,
    reviews_count: 190,
    top_notes: "Marine Notes, Bergamot",
    heart_notes: "Rosemary, Clary Sage, Geranium",
    base_notes: "Olibanum Incense, Patchouli",
    longevity: "10-12 Hours",
    sillage: "Moderate to Heavy",
    tags: ["FRESH", "AQUATIC"],
    description: "A deep, intense freshness punctuated by incense notes that add mysterious warmth to Acqua Di Giò's iconic marine facets."
  },
  {
    id: "mahirash-royal-imperial-oud",
    name: "MAHIRASH Royal Imperial Oud",
    brand: "MAHIRASH",
    category: "Extrait De Parfum",
    subcategory: "Pure Artisanal",
    collection: "Royal Vault",
    gender: "Unisex",
    fragrance_family: "Oriental Woody",
    fragrance_concentration: "Extrait De Parfum (30-40%)",
    price: 12500,
    original_price: 16000,
    sizes: "50ml, 100ml",
    size_prices: [
      {
        size: "50ml",
        price: 12500,
        original_price: 16000,
        stock: 25,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 21000,
        original_price: 27000,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"
        ]
      }
    ],
    rating: 5.0,
    reviews_count: 512,
    top_notes: "Royal Cambodian Oud, Bergamot, Saffron",
    heart_notes: "Amber Resin, Taif Rose, Cinnamon Bark",
    base_notes: "Aged Oud Wood, Madagascar Vanilla, Creamy Sandalwood",
    longevity: "18+ Hours",
    sillage: "Opulent & Intensely Radiating",
    tags: ["SIGNATURE", "HERITAGE"],
    description: "The crown jewel of Mahirash Parfumerie. Blended with rare aged Cambodian Oud, Taif rose petals and golden amber resin for an unforgettable royal presence."
  }
];

async function run() {
  console.log("Authenticating as admin@mahirash.com...");
  await signInWithEmailAndPassword(auth, "admin@mahirash.com", "Mahirash@1234");
  console.log("✓ Logged in as Admin!");

  console.log("\nDeleting all current products in Firestore...");
  const existingSnap = await getDocs(collection(db, "products"));
  let deletedCount = 0;
  for (const docSnapshot of existingSnap.docs) {
    await deleteDoc(doc(db, "products", docSnapshot.id));
    console.log(` - Deleted product: ${docSnapshot.id}`);
    deletedCount++;
  }
  console.log(`✓ Deleted ${deletedCount} existing products.\n`);

  console.log("Uploading 10 new luxury perfume products...");
  for (const p of NEW_10_PRODUCTS) {
    const totalStock = p.size_prices.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
    const autoStatus = totalStock === 0 ? "Out of Stock" : totalStock <= 5 ? "Low Stock" : "In Stock";
    const allImages = p.size_prices.flatMap(sp => sp.images || (sp.image ? [sp.image] : [])).filter(Boolean);
    const primaryImg = p.size_prices[0]?.images?.[0] || p.size_prices[0]?.image || "";

    const docData = {
      ...p,
      stock: totalStock,
      stock_status: autoStatus,
      image: primaryImg,
      images: allImages,
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "products", p.id), docData);
    console.log(`✓ Uploaded: ${p.name} (${p.brand}) [Stock: ${totalStock}, Variants: ${p.size_prices.length}]`);
  }

  console.log("\n🎉 ALL 10 LUXURY PRODUCTS SUCCESSFULLY UPLOADED!");
  process.exit(0);
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
