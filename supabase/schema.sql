-- ==============================================================================
-- Kerala Super Store UK - Supabase PostgreSQL Schema
-- Database Schema for E-Commerce Platform with UK Localization & AI Cataloging
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'Kerala Superstore',
    tagline TEXT DEFAULT 'Your neighbourhood Kerala superstore — authentic groceries & spices delivered across the UK',
    phone TEXT DEFAULT '+44 7749 132122',
    whatsapp TEXT DEFAULT '+44 7749 132122',
    email TEXT DEFAULT 'info@keralasuperstores.com',
    address_line TEXT DEFAULT '4 Wallbrook Drive, Manchester',
    postcode TEXT DEFAULT 'M9 8PX',
    currency TEXT DEFAULT 'GBP',
    currency_symbol TEXT DEFAULT '£',
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 50.00,
    standard_delivery_charge NUMERIC(10, 2) DEFAULT 3.99,
    cod_enabled BOOLEAN DEFAULT true,
    announcement_text TEXT DEFAULT '🇬🇧 Free UK Delivery on orders over £50 | 4 Wallbrook Drive, Manchester M9 8PX | Parking at rear',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANDS
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    size_weight TEXT NOT NULL, -- e.g. "5 kg", "500 g", "1 Litre"
    price NUMERIC(10, 2) NOT NULL, -- in GBP £
    offer_price NUMERIC(10, 2), -- if on discount
    stock_quantity INT NOT NULL DEFAULT 50,
    low_stock_threshold INT DEFAULT 10,
    barcode TEXT,
    description TEXT,
    ingredients TEXT,
    allergens TEXT, -- Crucial for UK Natasha's Law compliance
    tags TEXT[], -- array of keywords
    image_url TEXT NOT NULL,
    additional_images TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published', -- 'published', 'draft', 'archived'
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN (
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(ingredients, ''))
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID, -- links to supabase auth.users
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    postcode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_postcode TEXT NOT NULL,
    delivery_method TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'click_and_collect'
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 3.99,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery', -- 'cash_on_delivery', 'card_stripe'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    order_status TEXT NOT NULL DEFAULT 'new', -- 'new', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_size TEXT,
    product_image TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 8. PROMOTIONAL BANNERS
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    badge TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products, categories, brands, settings, banners
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public can view settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public can view banners" ON banners FOR SELECT USING (is_active = true);

-- Allow public to insert orders (guest checkout)
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert order items" ON order_items FOR INSERT WITH CHECK (true);
