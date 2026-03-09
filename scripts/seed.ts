/**
 * Database Seed Script
 * Populates the database with initial data
 *
 * Run: npm run seed
 */

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { User, Product, Category, Coupon, Banner } from "@/models";

// ============================================
// HELPERS
// ============================================

const getColorCode = (name: string): string => {
  const colors: Record<string, string> = {
    Black: "#000000",
    White: "#FFFFFF",
    Grey: "#808080",
    Navy: "#000080",
    Olive: "#808000",
    Blue: "#0000FF",
    "Dark Blue": "#00008B",
    Pink: "#FFC0CB",
    "Pink Floral": "#FFC0CB",
    "Blue Floral": "#0000FF",
    Brown: "#A52A2A",
    "Off-White": "#F5F5F5",
  };
  return colors[name] || "#000000";
};

// ============================================
// SEED DATA
// ============================================

const categories = [
  {
    name: "Men",
    slug: "men",
    description: "Men's fashion and clothing",
    image:
      "https://images.unsplash.com/photo-1488161628813-99c974c76949?auto=format&fit=crop&q=80&w=400",
    icon: "👔",
    featured: true,
    displayOrder: 1,
  },
  {
    name: "Women",
    slug: "women",
    description: "Women's fashion and clothing",
    image:
      "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&q=80&w=400",
    icon: "👗",
    featured: true,
    displayOrder: 2,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Fashion accessories and more",
    image:
      "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=400",
    icon: "👜",
    featured: true,
    displayOrder: 3,
  },
  {
    name: "Footwear",
    slug: "footwear",
    description: "Shoes, sneakers and more",
    image:
      "https://images.unsplash.com/photo-1560769629-975e53efa466?auto=format&fit=crop&q=80&w=400",
    icon: "👟",
    featured: true,
    displayOrder: 4,
  },
  {
    name: "Winterwear",
    slug: "winterwear",
    description: "Winter collection - jackets, hoodies",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=400",
    icon: "🧥",
    featured: true,
    displayOrder: 5,
  },
  {
    name: "Plus Size",
    slug: "plus-size",
    description: "Plus size clothing for all",
    image:
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=400",
    icon: "✨",
    featured: false,
    displayOrder: 6,
  },
];

const banners = [
  {
    title: "New Arrivals",
    subtitle: "Fresh styles just dropped",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200",
    mobileImage:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600",
    link: "/products?sort=newest",
    linkText: "Shop Now",
    type: "hero",
    placement: "homepage",
    position: 1,
  },
  {
    title: "Men's Collection",
    subtitle: "Up to 50% Off",
    image:
      "https://images.unsplash.com/photo-1488161628813-99c974c76949?auto=format&fit=crop&q=80&w=1200",
    link: "/products?category=Men",
    linkText: "Explore",
    type: "hero",
    placement: "homepage",
    position: 2,
  },
  {
    title: "Women's Fashion",
    subtitle: "Trending Now",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
    link: "/products?category=Women",
    linkText: "Shop Collection",
    type: "hero",
    placement: "homepage",
    position: 3,
  },
  {
    title: "Winter Sale",
    subtitle: "Stay warm in style",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200",
    link: "/products?category=Winterwear",
    linkText: "Shop Winter",
    type: "promo",
    placement: "homepage",
    position: 4,
  },
];

const coupons = [
  {
    code: "WELCOME10",
    description: "10% off on your first order",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountAmount: 200,
    minOrderAmount: 499,
    isActive: true,
    isPublic: true,
    firstOrderOnly: true,
    termsAndConditions: "Valid for new customers only. Maximum discount ₹200.",
  },
  {
    code: "FLAT100",
    description: "Flat ₹100 off on orders above ₹999",
    discountType: "fixed",
    discountValue: 100,
    minOrderAmount: 999,
    isActive: true,
    isPublic: true,
    termsAndConditions: "Minimum order value ₹999.",
  },
  {
    code: "SUMMER20",
    description: "20% off on summer collection",
    discountType: "percentage",
    discountValue: 20,
    maxDiscountAmount: 500,
    minOrderAmount: 799,
    isActive: true,
    isPublic: true,
    applicableCategories: ["Men", "Women"],
    termsAndConditions: "Valid on Men and Women categories only.",
  },
];

const products = [
  {
    name: "Men's Oversized T-Shirt - Black",
    description:
      "Premium cotton oversized t-shirt for casual everyday wear. Soft, breathable fabric with a relaxed fit that's perfect for streetwear looks.",
    price: 499,
    originalPrice: 999,
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Men",
    subcategory: "T-Shirts",
    brand: "Baefikra",
    tags: ["oversized", "cotton", "casual", "streetwear"],
    variations: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "White", "Grey"],
    },
    stock: 100,
    featured: true,
    recommended: true,
  },
  {
    name: "Sleek Urban Jacket - Navy",
    description:
      "Modern urban jacket with a sleek design. Water-resistant outer layer with warm inner lining.",
    price: 1299,
    originalPrice: 2499,
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Men",
    subcategory: "Jackets",
    brand: "UrbanFit",
    tags: ["jacket", "winter", "urban"],
    variations: {
      sizes: ["M", "L", "XL", "XXL"],
      colors: ["Navy", "Black", "Olive"],
    },
    stock: 50,
    featured: true,
  },
  {
    name: "Women's Floral Summer Dress",
    description: "Light and breezy floral dress perfect for summer.",
    price: 899,
    originalPrice: 1999,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Women",
    subcategory: "Dresses",
    brand: "Baefikra",
    tags: ["summer", "floral", "casual"],
    variations: {
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Blue Floral", "Pink Floral"],
    },
    stock: 75,
    featured: true,
    recommended: true,
  },
  {
    name: "Classic Denim Jeans - Blue",
    description: "Timeless classic denim jeans with a comfortable regular fit.",
    price: 1499,
    originalPrice: 2999,
    images: [
      "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Men",
    subcategory: "Jeans",
    brand: "DenimCo",
    tags: ["denim", "jeans", "classic"],
    variations: {
      sizes: ["28", "30", "32", "34", "36"],
      colors: ["Blue", "Dark Blue"],
    },
    stock: 120,
    recommended: true,
  },
  {
    name: "Casual White Sneakers",
    description: "Essential white sneakers that go with everything.",
    price: 1999,
    originalPrice: 3999,
    images: [
      "https://images.unsplash.com/photo-1560769629-975e53efa466?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Footwear",
    subcategory: "Sneakers",
    brand: "SoleMates",
    tags: ["sneakers", "white", "casual"],
    variations: {
      sizes: ["6", "7", "8", "9", "10", "11"],
      colors: ["White"],
    },
    stock: 60,
    featured: true,
  },
  {
    name: "Graphic Printed Hoodie",
    description: "Stand out with this unique graphic hoodie.",
    price: 899,
    originalPrice: 1499,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Winterwear",
    subcategory: "Hoodies",
    brand: "PrintMasters",
    tags: ["hoodie", "graphic", "winter"],
    variations: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "Grey"],
    },
    stock: 80,
    featured: true,
  },
  {
    name: "Women's High-Waist Skinny Jeans",
    description: "Flattering high-waist skinny jeans with stretch for comfort.",
    price: 1299,
    originalPrice: 2499,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Women",
    subcategory: "Jeans",
    brand: "Baefikra",
    tags: ["jeans", "skinny", "high-waist"],
    variations: {
      sizes: ["26", "28", "30", "32"],
      colors: ["Blue", "Black"],
    },
    stock: 90,
    recommended: true,
  },
  {
    name: "Premium Leather Belt",
    description: "Genuine leather belt with a classic silver buckle.",
    price: 599,
    originalPrice: 1199,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
    ],
    category: "Accessories",
    subcategory: "Belts",
    brand: "LeatherCraft",
    tags: ["belt", "leather", "accessory"],
    variations: {
      sizes: ["30", "32", "34", "36", "38"],
      colors: ["Brown", "Black"],
    },
    stock: 150,
  },
];

// ============================================
// DYNAMIC PRODUCT GENERATION
// ============================================

const generateAdditionalProducts = () => {
  const additional: any[] = [];
  const categoryNames = [
    "Men",
    "Women",
    "Accessories",
    "Footwear",
    "Winterwear",
    "Plus Size",
  ];

  const brands = [
    "Baefikra",
    "UrbanFit",
    "SoleMates",
    "DenimCo",
    "TrendSetter",
    "LuxeWear",
    "ActivePure",
  ];
  const colors = [
    "Black",
    "White",
    "Grey",
    "Navy",
    "Olive",
    "Blue",
    "Pink",
    "Brown",
  ];
  const sizes = ["S", "M", "L", "XL", "XXL"];

  const productTemplates: Record<string, string[]> = {
    Men: ["T-Shirt", "Shirt", "Jeans", "Trousers", "Shorts", "Polo"],
    Women: ["Dress", "Top", "Skirt", "Jeans", "Leggings", "Kurta"],
    Accessories: ["Wallet", "Sunglasses", "Watch", "Handbag", "Cap", "Socks"],
    Footwear: ["Sneakers", "Loafers", "Slippers", "Boots", "Formal Shoes"],
    Winterwear: ["Hoodie", "Sweatshirt", "Jacket", "Sweater", "Coat"],
    "Plus Size": [
      "Comfort Tee",
      "Relaxed Fit Jeans",
      "Essential Shirt",
      "Maxi Dress",
    ],
  };

  const images: Record<string, string[]> = {
    Men: [
      "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1505022610485-0249ba5b3675?auto=format&fit=crop&q=80&w=800",
    ],
    Women: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=800",
    ],
    Accessories: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=800",
    ],
    Footwear: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800",
    ],
  };

  for (let i = 1; i <= 300; i++) {
    const category =
      categoryNames[Math.floor(Math.random() * categoryNames.length)];
    const type =
      productTemplates[category][
        Math.floor(Math.random() * productTemplates[category].length)
      ];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const name = `${brand} ${type} - ${i}`;

    const price = Math.floor(Math.random() * 2000) + 299;
    const catImages = images[category] || images["Men"];

    additional.push({
      name,
      description: `This is a high-quality ${type} from ${brand}. Perfect for any occasion. Made with premium materials for comfort and style.`,
      price,
      originalPrice: Math.floor(price * 1.5),
      images: [catImages[Math.floor(Math.random() * catImages.length)]],
      category,
      subcategory: type,
      brand,
      tags: [type.toLowerCase(), brand.toLowerCase(), category.toLowerCase()],
      variations: {
        sizes: sizes.slice(0, Math.floor(Math.random() * 3) + 3),
        colors: [colors[Math.floor(Math.random() * colors.length)]],
      },
      stock: Math.floor(Math.random() * 200) + 10,
      featured: Math.random() > 0.8,
      recommended: Math.random() > 0.7,
    });
  }

  return additional;
};

const allProducts = [...products, ...generateAdditionalProducts()];

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("\n🌱 Starting database seed...\n");

  try {
    await connectDB();
    console.log("✅ Connected to MongoDB\n");

    // Seed Categories
    console.log("🏷️  Seeding categories...");
    const categoryMap = new Map();

    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        const newCat = await Category.create(cat);
        categoryMap.set(cat.name, newCat._id);
        console.log(`   ✓ Created: ${cat.name}`);
      } else {
        categoryMap.set(cat.name, existing._id);
        console.log(`   - Exists: ${cat.name}`);
      }
    }

    // Seed Banners
    console.log("\n🖼️  Seeding banners...");
    await Banner.deleteMany({});
    for (const banner of banners) {
      await Banner.create(banner);
      console.log(`   ✓ Created: ${banner.title}`);
    }

    // Get or create admin user
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Baefikra Admin",
        email: "admin@baefikra.com",
        role: "admin",
        isVerified: true,
      });
      console.log("\n👤 Created admin user");
    }

    // Seed Coupons
    console.log("\n🎟️  Seeding coupons...");
    for (const coupon of coupons) {
      const existing = await Coupon.findOne({ code: coupon.code });
      if (!existing) {
        const now = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);

        await Coupon.create({
          ...coupon,
          validFrom: now,
          validTo: nextYear,
          createdBy: admin._id,
        });
        console.log(`   ✓ Created: ${coupon.code}`);
      } else {
        console.log(`   - Exists: ${coupon.code}`);
      }
    }

    // Seed Products
    console.log("\n📦 Seeding products...");
    for (const product of allProducts) {
      const slug = product.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const existing = await Product.findOne({ slug });
      if (!existing) {
        // Find category ID
        const categoryId = categoryMap.get(product.category);

        if (!categoryId) {
          console.warn(
            `   ⚠️ Category not found for product: ${product.name} (${product.category})`,
          );
          continue;
        }

        // Format variations colors
        const formattedColors = product.variations.colors.map(
          (colorName: string) => ({
            name: colorName,
            code: getColorCode(colorName),
          }),
        );

        await Product.create({
          ...product,
          slug,
          category: categoryId,
          rating: Math.round((Math.random() * 1 + 4) * 10) / 10,
          sold: Math.floor(Math.random() * 500),
          views: Math.floor(Math.random() * 2000),
          variations: {
            ...product.variations,
            colors: formattedColors,
          },
        });
        console.log(`   ✓ Created: ${product.name}`);
      } else {
        console.log(`   - Exists: ${product.name}`);
      }
    }

    console.log("\n✨ Seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📤 Disconnected from MongoDB\n");
  }
}

main();
