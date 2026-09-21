import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

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

const PRODUCTS_SEED = [
  {
    id: "versace-pour-homme-edt",
    name: "VERSACE Pour Homme EDT",
    category: "Eau de Toilette",
    gender: "Men",
    tag: "OUTLET",
    price: 5000,
    original_price: 6000,
    stock: 27,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 5000,
        original_price: 6000,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 8500,
        original_price: 10000,
        stock: 12,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 100ml",
    rating: 4.8,
    top_notes: "Lemon, Neroli, Bergamot, Rose de Mai",
    heart_notes: "Hyacinth, Clary Sage, Cedar, Geranium",
    base_notes: "Tonka Bean, Musk, Amber",
    longevity: "8-10 Hours",
    sillage: "Moderate to Heavy",
    description: "Versace Pour Homme has been created from essential ingredients of Mediterranean origin with the potential to convey through aromatic notes the character of today’s man."
  },
  {
    id: "versace-bright-crystal-absolu",
    name: "VERSACE Bright Crystal Absolu",
    category: "Extrait de Parfum",
    gender: "Women",
    tag: "BESTSELLER",
    price: 7000,
    original_price: 10000,
    stock: 30,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "10ml",
        price: 2500,
        original_price: 3500,
        stock: 20,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      },
      {
        size: "50ml",
        price: 7000,
        original_price: 10000,
        stock: 10,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"
        ]
      }
    ],
    sizes: "10ml, 50ml",
    rating: 4.9,
    top_notes: "Yuzu, Pomegranate, Ice Accord",
    heart_notes: "Raspberry, Lotus, Peony, Magnolia",
    base_notes: "Acajou Wood, Amber, Musk",
    longevity: "12+ Hours",
    sillage: "Intense Sillage",
    description: "An intense version of the beloved Bright Crystal fragrance. Enhanced concentration for absolute longevity and vibrant floral luxury."
  },
  {
    id: "ysl-libre-edp",
    name: "YVES SAINT LAURENT Libre EDP",
    category: "Eau de Parfum",
    gender: "Women",
    tag: "NEW",
    price: 6000,
    original_price: 7000,
    stock: 26,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 6000,
        original_price: 7000,
        stock: 18,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 9999,
        original_price: 11500,
        stock: 8,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 100ml",
    rating: 4.9,
    top_notes: "Lavender Essence, Mandarin Orange, Blackcurrant",
    heart_notes: "Lavender, Orange Blossom, Jasmine",
    base_notes: "Madagascar Vanilla, Musk, Cedar, Ambergris",
    longevity: "10-12 Hours",
    sillage: "Heavy Sillage",
    description: "The grand floral fragrance of freedom. Combining burning sensuality of noble French lavender and Moroccan orange blossom."
  },
  {
    id: "giorgio-armani-my-way-edp",
    name: "GIORGIO ARMANI My Way EDP",
    category: "Floral & Fresh",
    gender: "Women",
    tag: "NEW",
    price: 5500,
    original_price: 7000,
    stock: 23,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 5500,
        original_price: 7000,
        stock: 14,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"
        ]
      },
      {
        size: "90ml",
        price: 8900,
        original_price: 11000,
        stock: 9,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
          "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 90ml",
    rating: 4.8,
    top_notes: "Bergamot, Egyptian Orange Blossom",
    heart_notes: "Indian Tuberose, Jasmine",
    base_notes: "Bourbon Vanilla, Virginia Cedar, White Musk",
    longevity: "10+ Hours",
    sillage: "Moderate Sillage",
    description: "My Way is the scent of discoveries and connections for an open-minded, curious and authentic woman who is ready to broaden her horizons."
  },
  {
    id: "test-crystal-absolu",
    name: "TEST Crystal Absolu",
    category: "Extrait de Parfum",
    gender: "Unisex",
    tag: "TEST",
    price: 1000,
    original_price: 5000,
    stock: 40,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "10ml",
        price: 1000,
        original_price: 5000,
        stock: 25,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800",
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800"
        ]
      },
      {
        size: "50ml",
        price: 3500,
        original_price: 7500,
        stock: 15,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
          "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800"
        ]
      }
    ],
    sizes: "10ml, 50ml",
    rating: 4.7,
    top_notes: "Ocean Mist, Zesty Bergamot",
    heart_notes: "Blue Lotus, Sea Salt",
    base_notes: "Driftwood, Clean Musk",
    longevity: "12 Hours",
    sillage: "Intense",
    description: "Exclusive tester edition of Crystal Absolu, showcasing ultra-pure botanical extraits with intense marine fresh notes."
  },
  {
    id: "prada-paradoxe-edp",
    name: "PRADA Paradoxe EDP",
    category: "Luxury Perfumes",
    gender: "Women",
    tag: "PREMIUM",
    price: 2999,
    original_price: 3499,
    stock: 30,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 2999,
        original_price: 3499,
        stock: 20,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1583445013765-46c20c4a6772?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1583445013765-46c20c4a6772?q=80&w=800",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800"
        ]
      },
      {
        size: "90ml",
        price: 6499,
        original_price: 7999,
        stock: 10,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
          "https://images.unsplash.com/photo-1583445013765-46c20c4a6772?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 90ml",
    rating: 4.9,
    top_notes: "Calabrian Bergamot, Tangerine, Pear",
    heart_notes: "Neroli, Orange Blossom, Sambac Jasmine",
    base_notes: "Amber, White Musk, Bourbon Vanilla",
    longevity: "12+ Hours",
    sillage: "Heavy Sillage",
    description: "An avant-garde floral amber fragrance that embraces the paradoxes of iconic ingredients to reveal new scented sensations."
  },
  {
    id: "tom-ford-black-orchid-parfum",
    name: "TOM FORD Black Orchid Parfum",
    category: "Woody & Amber",
    gender: "Unisex",
    tag: "ROYAL EDITION",
    price: 8999,
    original_price: 11999,
    stock: 19,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 8999,
        original_price: 11999,
        stock: 12,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 14500,
        original_price: 18000,
        stock: 7,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 100ml",
    rating: 5.0,
    top_notes: "Black Truffle, Ylang-Ylang, Blackcurrant, Bergamot",
    heart_notes: "Black Orchid, Ylang-Ylang, Rum",
    base_notes: "Patchouli, Sandalwood, Vanilla, Incense",
    longevity: "14+ Hours",
    sillage: "Enormous Sillage",
    description: "A luxurious and sensual fragrance of rich, dark accords and an alluring potion of black orchids and spice."
  },
  {
    id: "bleu-de-chanel-edp",
    name: "BLEU DE CHANEL Eau de Parfum",
    category: "Luxury Perfumes",
    gender: "Men",
    tag: "BESTSELLER",
    price: 9500,
    original_price: 12000,
    stock: 25,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 6500,
        original_price: 8000,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 9500,
        original_price: 12000,
        stock: 10,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800",
          "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 100ml",
    rating: 4.9,
    top_notes: "Grapefruit, Lemon, Mint, Pink Pepper",
    heart_notes: "Ginger, Nutmeg, Jasmine, Iso E Super",
    base_notes: "Incense, Vetiver, Cedar, Sandalwood, Patchouli",
    longevity: "10-12 Hours",
    sillage: "Strong Sillage",
    description: "An aromatic-woody fragrance with a captivating trail. A tribute to masculine freedom in a deep night-blue bottle."
  },
  {
    id: "dior-sauvage-elixir",
    name: "DIOR Sauvage Elixir",
    category: "Extrait de Parfum",
    gender: "Men",
    tag: "PRIVATE RESERVE",
    price: 11000,
    original_price: 14000,
    stock: 20,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "60ml",
        price: 11000,
        original_price: 14000,
        stock: 14,
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
        stock: 6,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
          "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=800"
        ]
      }
    ],
    sizes: "60ml, 100ml",
    rating: 5.0,
    top_notes: "Cinnamon, Nutmeg, Cardamom, Grapefruit",
    heart_notes: "Lavender",
    base_notes: "Licorice, Amber, Patchouli, Vetiver",
    longevity: "16+ Hours",
    sillage: "Enormous",
    description: "An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices."
  },
  {
    id: "mahirash-royal-amber-oud",
    name: "MAHIRASH Royal Amber Oud Extrait",
    category: "Oud Collection",
    gender: "Unisex",
    tag: "SIGNATURE EXTRAIT",
    price: 3999,
    original_price: 5999,
    stock: 45,
    stock_status: "In Stock",
    size_prices: [
      {
        size: "50ml",
        price: 3999,
        original_price: 5999,
        stock: 25,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800",
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800"
        ]
      },
      {
        size: "100ml",
        price: 6999,
        original_price: 9999,
        stock: 15,
        is_preorder: false,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800"
        ]
      },
      {
        size: "200ml",
        price: 11999,
        original_price: 15999,
        stock: 5,
        is_preorder: true,
        image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
        images: [
          "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800",
          "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800"
        ]
      }
    ],
    sizes: "50ml, 100ml, 200ml",
    rating: 4.95,
    top_notes: "Royal Cambodian Oud, Bergamot, Saffron",
    heart_notes: "Amber Resin, Taif Rose, Cinnamon Bark",
    base_notes: "Aged Oud Wood, Madagascar Vanilla, Creamy Sandalwood",
    longevity: "14+ Hours",
    sillage: "Opulent & Intensely Radiating",
    description: "The crown jewel of Mahirash Parfumerie. Blended with rare Cambodian Oud and golden amber resin for an unforgettable signature aroma."
  }
];

async function seed() {
  console.log("Signing in as Super Admin...");
  try {
    await signInWithEmailAndPassword(auth, "mahirsh9999@gmail.com", "Super@321.Admin");
    console.log("✓ Authenticated successfully!");
  } catch (err) {
    console.warn("Auth note:", err.message);
  }

  console.log("Seeding 10 luxury designer products with per-variant multi-images & pre-orders into Firestore...");
  for (const item of PRODUCTS_SEED) {
    const allVariantImages = item.size_prices.flatMap(sp => sp.images || (sp.image ? [sp.image] : [])).filter(Boolean);
    const primaryImg = item.size_prices[0]?.images?.[0] || item.size_prices[0]?.image || "";

    const ref = doc(db, "products", item.id);
    await setDoc(ref, {
      ...item,
      image: primaryImg,
      images: allVariantImages,
      is_active: true,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log(`✓ Seeded: ${item.name} (${item.sizes})`);
  }
  console.log("SUCCESS! All 10 products successfully seeded into Firebase Firestore.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
