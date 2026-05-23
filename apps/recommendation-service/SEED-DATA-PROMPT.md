generate all output as mongoimport extended JSON. Generate one collection at a time and wait for me to say "next" before proceeding.

# Seed Data Generation Prompt for Recommendation Engine

## Context for the AI

This is a MongoDB database (accessed via Prisma ORM) for a multi-vendor e-commerce platform. You need to generate realistic seed data for a **hybrid recommendation engine** (content-based + item-item collaborative filtering). The data must satisfy specific statistical requirements for the recommendation algorithms to produce meaningful results — not just random data.

---

## Critical Requirements Before Generating Anything

### For Content-Based Filtering to work:

- Products must have **diverse, realistic, specific tags** (e.g. `["wireless", "noise-cancelling", "over-ear", "bluetooth-5.0"]` not `["product", "item", "new"]`)
- Products must be spread across **at least 4 different categories** and **8+ subcategories**
- Each category must have **at least 5 products** so similarity comparisons are meaningful
- Price ranges must vary realistically within and across categories

### For Item-Item Collaborative Filtering to work:

- The interaction data MUST have **overlap** — multiple users must interact with the same products
- At least **10-15 "popular" products** must appear in **5 or more different users'** action histories
- At least **5 "very popular" products** must appear in **8 or more different users'** action histories
- If every user interacts with completely different products, collaborative filtering produces zero scores and breaks

### General:

- All ObjectId references must be **consistent** — a `shopId` in a product must match a real shop's `_id`
- All `productId` references in `userAnalytics.actions` must match real product `_id` values
- All `shopId` references in `userAnalytics.actions` must match real shop `_id` values

---

## Field Format Requirements (Read Before Generating Anything)

These are the fields that AI generators most commonly get wrong. Every single one of these will cause either a broken import or broken frontend rendering.

---

### COLORS — hex codes only

The product detail page renders colors as CSS `backgroundColor` directly. String names like `"Midnight"`, `"Starlight"`, `"Space Gray"`, `"Product Red"` are NOT valid CSS and will render as invisible blank circles.

**Rule:** Every value in `products.colors[]` must be a valid CSS hex color code.

```
WRONG: ["Midnight Black", "Pearl White", "Product Red"]
RIGHT: ["#000000", "#f5f5f0", "#ff3b30"]
```

Use only these hex values — they correspond to the color options available in the platform's filter UI:

- Black → `"#000000"`
- White → `"#ffffff"`
- Red → `"#ff0000"`
- Green → `"#00ff00"`
- Blue → `"#0000ff"`
- Yellow → `"#ffff00"`
- Magenta → `"#ff00ff"`
- Cyan → `"#00ffff"`

Each product should have 1-3 colors. Do NOT make up other hex values outside this list.

---

### SIZES — category-appropriate only

The size selector only has these values: `["XS", "S", "M", "L", "XL", "XXL"]`

**Rule by category:**

- **Fashion** (Men's Clothing, Women's Clothing): always include 3-5 sizes from the list above
- **Fashion** (Footwear): use numeric shoe sizes as strings: `["38", "39", "40", "41", "42", "43", "44"]`
- **Fashion** (Bags & Accessories, Watches, Sunglasses): empty array `[]`
- **Electronics**: always empty array `[]` — electronics do not have clothing sizes
- **Home & Garden**: always empty array `[]`
- **Beauty & Health**: always empty array `[]`
- **Sports & Outdoors** (Gym Equipment, Outdoor Gear, Cycling): empty array `[]`
- **Sports & Outdoors** (Yoga & Fitness workout clothing): use clothing sizes from the list

```
WRONG (Electronics): "sizes": ["Small", "Medium", "Large"]
WRONG (Electronics): "sizes": ["6GB", "8GB", "12GB"]  ← these go in custom_specifications instead
RIGHT (Electronics): "sizes": []
RIGHT (Fashion tops): "sizes": ["XS", "S", "M", "L", "XL"]
```

---

### TAGS — semantic overlap required for recommendation quality

Tags are the primary signal for content-based similarity. For the recommendation engine to find that "Product A is similar to Product B," they must share tags.

**Rules:**

- All tag strings must be **lowercase and hyphenated** (no spaces, no uppercase): `"noise-cancelling"` not `"Noise Cancelling"`
- Every product in the same subcategory MUST share at least 2-3 tags
- Every product in the same category MUST share at least 1 tag (a category-level tag)
- Tags should be specific attributes, not generic words

**Required category-level tags (every product in a category must include these):**

- Electronics: must include `"electronics"`
- Fashion: must include `"fashion"`
- Home & Garden: must include `"home-garden"`
- Sports & Outdoors: must include `"sports"`
- Beauty & Health: must include `"beauty"`

**Required subcategory-level tags (every product in a subcategory must include these):**

- Headphones: `"headphones"`, `"audio"`
- Smartphones: `"smartphone"`, `"mobile"`
- Laptops: `"laptop"`, `"computer"`
- Skincare: `"skincare"`
- Running (shoes/gear): `"running"`
- Yoga & Fitness: `"fitness"`
- etc.

This overlap is what allows the content-based engine to say "these two products are similar." Without it, cosine similarity between products in the same category will be near zero.

---

### MONGODB FIELD TYPES — plain String vs @db.ObjectId

This is the most critical import requirement. Some `String` fields in Prisma are tagged `@db.ObjectId`, meaning they store BSON ObjectId. Others are plain strings. In mongoimport extended JSON:

- `@db.ObjectId` fields → use `{ "$oid": "..." }` format
- Plain `String` fields → use a plain string `"..."`

**If you use `{ "$oid": "..." }` for a plain String field, Prisma lookups like `findUnique({ where: { userId: "somestring" } })` will silently fail — returning null even when the record exists.**

Complete mapping for the collections you need to generate:

| Collection           | Field              | Type               | mongoimport format      |
| -------------------- | ------------------ | ------------------ | ----------------------- |
| sellers              | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| shops                | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| shops                | `sellerId`         | @db.ObjectId       | `{ "$oid": "..." }`     |
| users                | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| products             | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| products             | `shopId`           | @db.ObjectId       | `{ "$oid": "..." }`     |
| products             | `discount_codes[]` | @db.ObjectId array | `[]` (leave empty)      |
| images               | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| images               | `productsId`       | @db.ObjectId       | `{ "$oid": "..." }`     |
| **userAnalytics**    | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| **userAnalytics**    | **`userId`**       | **plain String**   | **`"plain-string-id"`** |
| **productAnalytics** | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| **productAnalytics** | **`productId`**    | **plain String**   | **`"plain-string-id"`** |
| **productAnalytics** | **`shopId`**       | **plain String**   | **`"plain-string-id"`** |
| orders               | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| orders               | `userId`           | @db.ObjectId       | `{ "$oid": "..." }`     |
| orders               | `shopId`           | @db.ObjectId       | `{ "$oid": "..." }`     |
| orderItems           | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| orderItems           | `orderId`          | @db.ObjectId       | `{ "$oid": "..." }`     |
| **orderItems**       | **`productId`**    | **plain String**   | **`"plain-string-id"`** |
| uniqueShopVisitors   | `_id`              | @db.ObjectId       | `{ "$oid": "..." }`     |
| uniqueShopVisitors   | `shopId`           | @db.ObjectId       | `{ "$oid": "..." }`     |
| uniqueShopVisitors   | `userId`           | @db.ObjectId       | `{ "$oid": "..." }`     |

The bold rows are the ones most likely to be wrong. `userAnalytics.userId`, `productAnalytics.productId`, `productAnalytics.shopId`, and `orderItems.productId` must be **plain strings** that equal the hex string of the referenced ObjectId — not wrapped in `{ "$oid": "..." }`.

Example for `userAnalytics`:

```json
{
  "_id": { "$oid": "67e5c8f4a1b2c3d4e5f6c001" },
  "userId": "67e5c8f4a1b2c3d4e5f6d001"
}
```

Note: `_id` uses `$oid`, but `userId` is the bare string of the user's ObjectId hex.

---

### ENUM VALUES — exact casing required

These are Prisma enums and string constants validated by the application. Wrong casing causes either import failure or silent filtering bugs.

| Field                            | Valid values                                                          | Wrong examples                  |
| -------------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| `products.status`                | `"Active"` `"Pending"` `"Draft"`                                      | `"active"` `"ACTIVE"`           |
| `orders.status`                  | `"Paid"` for seed data                                                | `"paid"` `"PAID"` `"Completed"` |
| `orders.deliveryStatus`          | `"Ordered"` `"Packed"` `"Shipped"` `"Out for Delivery"` `"Delivered"` | `"ordered"` `"shipped"`         |
| `sellers.notificationPreference` | `"email"` `"web"` `"app"` `"all"`                                     | `"Email"` `"All"`               |
| `products.cashOnDelivery`        | `"yes"` or `"no"`                                                     | `true` `"Yes"` `"YES"`          |

For seed data: set all products to `status: "Active"`, all orders to `status: "Paid"` and `deliveryStatus: "Delivered"`.

---

### OTHER REQUIRED FIELDS THAT CANNOT BE NULL

- `products.custom_properties` — schema is `Json` (NOT `Json?`). Must be `{}` not `null`. An AI that omits this or sets it to null will cause the import to fail.
- `products.regular_price` — must be greater than or equal to `sale_price`. Never set `regular_price < sale_price`.
- `products.discount_codes` — set to `[]` (empty array). Do not invent discount code ObjectIds.
- `userAnalytics.actions` — set to an array of action objects, never `null`. Even for casual users, it must be an array (can be empty `[]` but prefer having at least 2 actions).

---

## What to Generate

### 1. sellers (5 records)

Each seller needs:

```
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  phone_number: string,
  country: string,
  password: string (bcrypt hash, use "$2b$10$example_hashed_password_here" as placeholder),
  stripeId: null,
  lowStockThreshold: 10,
  notificationPreference: "all",
  emailNotifications: true,
  isDeleted: false,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 2. shops (5 records, one per seller)

Each shop needs:

```
{
  _id: ObjectId,
  name: string (realistic shop name),
  bio: string,
  category: string (must match one of the platform categories below),
  address: string,
  opening_hours: string,
  socialLinks: [],
  ratings: float (3.5 to 5.0),
  followerCount: integer (10-500),
  sellerId: ObjectId (references a seller),
  isDeleted: false,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Platform categories to use:** Electronics, Fashion, Home & Garden, Sports & Outdoors, Beauty & Health

Assign one category per shop. Distribute shops so there are 1-2 shops per category.

### 3. products (50 records)

**Distribution rule — this is critical:**

- 12 products in Electronics
- 12 products in Fashion
- 10 products in Home & Garden
- 8 products in Sports & Outdoors
- 8 products in Beauty & Health

Each product needs:

```
{
  _id: ObjectId,
  title: string,
  slug: string (url-friendly lowercase hyphenated, unique — e.g. "sony-wh1000xm5-headphones"),
  category: string (must EXACTLY match one of the 5 platform categories — case-sensitive),
  subCategory: string (must EXACTLY match a subcategory under that category in site_config),
  short_description: string,
  detailed_description: string (2-3 sentences),
  tags: string[] (MINIMUM 5 tags — lowercase-hyphenated, must include category tag + subcategory tag + specific attributes — see tag rules above),
  brand: string (use real brand names — "Sony", "Nike", "IKEA", "Cetaphil" etc.),
  colors: string[] (hex codes only — see color rules above. Empty [] for Beauty & Health and Home & Garden),
  sizes: string[] (see size rules above — Electronics and most non-clothing must be []),
  stock: integer (5-200),
  sale_price: float,
  regular_price: float (must be >= sale_price, typically 10-30% higher),
  ratings: float (3.0 to 5.0),
  warranty: string or null ("1 Year", "2 Years", "6 Months", null — electronics usually have warranty, fashion usually null),
  custom_specifications: object (relevant key-value specs — see examples below),
  custom_properties: {} (REQUIRED — never null, use empty object if nothing to add),
  cashOnDelivery: "yes",
  discount_codes: [],
  isDeleted: false,
  status: "Active",
  total_sales: integer (0-500),
  shopId: ObjectId using {"$oid":"..."} format (references a shop in the same category),
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**custom_specifications examples by category:**

- Headphones: `{ "connectivity": "Bluetooth 5.0", "battery_life": "30 hours", "driver_size": "40mm", "impedance": "32 Ohm" }`
- Smartphones: `{ "ram": "8GB", "storage": "128GB", "camera": "108MP", "battery": "5000mAh", "os": "Android 14" }`
- Laptops: `{ "processor": "Intel Core i7", "ram": "16GB", "storage": "512GB SSD", "display": "15.6 inch FHD" }`
- Running Shoes: `{ "material": "Mesh upper", "sole": "Rubber", "closure": "Lace-up", "terrain": "Road" }`
- Skincare: `{ "skin_type": "All skin types", "volume": "50ml", "spf": "SPF 30", "key_ingredients": "Vitamin C, Niacinamide" }`
- Furniture: `{ "material": "Oak wood", "dimensions": "120x60x75 cm", "weight_capacity": "150kg", "assembly": "Required" }`

**Subcategory examples per category:**

- Electronics: Headphones, Smartphones, Laptops, Cameras, Speakers, Smartwatches, Accessories
- Fashion: Men's Clothing, Women's Clothing, Footwear, Bags & Accessories, Watches, Sunglasses
- Home & Garden: Kitchen, Bedding, Furniture, Lighting, Garden Tools, Storage
- Sports & Outdoors: Gym Equipment, Outdoor Gear, Yoga & Fitness, Cycling, Running
- Beauty & Health: Skincare, Haircare, Supplements, Makeup, Personal Care

**Tag quality requirement — examples of BAD vs GOOD:**

- BAD: `["product", "sale", "new", "item"]`
- GOOD (Headphones): `["wireless", "noise-cancelling", "over-ear", "bluetooth-5.0", "studio-quality", "foldable"]`
- GOOD (Running Shoes): `["lightweight", "trail-running", "breathable", "cushioned", "waterproof", "size-6-to-13"]`
- GOOD (Face Serum): `["vitamin-c", "anti-aging", "brightening", "hyaluronic-acid", "vegan", "cruelty-free"]`

### 4. users (25 records)

```
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  role: "user",
  password: "$2b$10$placeholder_hashed_password",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 5. userAnalytics (25 records, one per user)

This is the most important collection for the recommendation engine. Each record's `actions` array is what the recommendation service reads.

**Action object shape (exact format the Kafka service stores):**

```json
{
  "productId": "ObjectId string",
  "shopId": "ObjectId string",
  "action": "product_view" | "add_to_cart" | "add_to_wishlist" | "purchase",
  "timestamp": "2026-01-15T10:23:00.000Z"
}
```

Note: No `userId` field inside the action object. `userId` is only on the parent `userAnalytics` document. Timestamp is ISO 8601 string, not a Unix integer.

**Full record shape:**

```
{
  _id: ObjectId,
  userId: string (ObjectId of a user, stored as string NOT ObjectId),
  country: string,
  city: string,
  device: "mobile" | "desktop" | "tablet",
  lastVisited: ISODate,
  actions: [ array of action objects — see rules below ],
  recommendations: null,
  lastTrained: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Action distribution rules — READ CAREFULLY:**

Total actions across all users: ~150-175 actions

User tiers (define before generating actions):

- **Power users (5 users):** 10-12 actions each — these users interact with many products including popular ones
- **Regular users (10 users):** 5-7 actions each — mix of popular and niche products
- **Casual users (10 users):** 2-4 actions each — mostly just views on popular products

Action type distribution per user:

- `product_view` makes up 60% of actions (most common)
- `add_to_wishlist` makes up 25% of actions
- `add_to_cart` makes up 15% of actions
- NOTE: `purchase` is NOT included in userAnalytics.actions (it is not tracked by the Kafka consumer)
- NOTE: A user should NOT have duplicate `add_to_cart` for the same productId (Kafka deduplicates this)
- NOTE: A user should NOT have duplicate `add_to_wishlist` for the same productId (Kafka deduplicates this)
- A user CAN have multiple `product_view` entries for the same product (views are always appended)

**Overlap requirement — define "popular products" first:**

Before generating actions, designate:

- **Tier 1 popular (5 products):** These appear in 10-15 different users' action arrays. Pick 1-2 from Electronics, 1-2 from Fashion, 1 from any other category.
- **Tier 2 popular (10 products):** These appear in 5-8 different users' action arrays.
- **Tier 3 niche (35 products):** These appear in 1-3 users' action arrays.

This overlap is what makes collaborative filtering find "users who liked A also liked B."

**Category affinity per user (for realism):**
Assign each user 1-2 preferred categories. 70% of their actions should be products from those categories. 30% can be cross-category (this is what makes CF interesting — cross-category discovery).

### 6. productAnalytics (50 records, one per product)

These must be **consistent with the userAnalytics actions** — derive them from the actions you generated above.

```
{
  _id: ObjectId,
  productId: string (must match a product _id, stored as string),
  shopId: string (must match the product's shopId, stored as string),
  views: integer (count of product_view actions for this product across ALL users),
  cartAdds: integer (count of add_to_cart actions across ALL users),
  wishListAdds: integer (count of add_to_wishlist actions across ALL users),
  purchases: integer (0-50, set independently since purchase isn't tracked via Kafka),
  lastViewedAt: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 7. shopAnalytics (5 records, one per shop)

```
{
  _id: ObjectId,
  shopId: ObjectId (references a shop),
  totalVisitors: integer,
  countryStats: { "India": int, "US": int, "UK": int, ... },
  cityStats: { "Mumbai": int, "Delhi": int, ... },
  deviceStats: { "mobile": int, "desktop": int, "tablet": int },
  lastVisitedAt: ISODate,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 8. images (one image per product — 50 records)

Each product needs at least one image record. Use the same single ImageKit URL for all products (the user will provide the URL — use a placeholder like `https://ik.imagekit.io/yourstore/placeholder-product.jpg`).

```
{
  _id: ObjectId,
  file_id: "placeholder_file_id",
  url: "https://ik.imagekit.io/yourstore/placeholder-product.jpg",
  productsId: ObjectId (references the product),
  userId: null,
  shopId: null
}
```

One record per product. The `productsId` must match the product's `_id`.

### 9. site_config (1 record — CRITICAL)

This single record drives all category/subcategory dropdowns across the entire platform. Without it, product creation, filtering, and admin UI will not work.

```
{
  _id: ObjectId,
  categories: [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports & Outdoors",
    "Beauty & Health"
  ],
  subCategories: {
    "Electronics": ["Headphones", "Smartphones", "Laptops", "Cameras", "Speakers", "Smartwatches", "Accessories"],
    "Fashion": ["Men's Clothing", "Women's Clothing", "Footwear", "Bags & Accessories", "Watches", "Sunglasses"],
    "Home & Garden": ["Kitchen", "Bedding", "Furniture", "Lighting", "Garden Tools", "Storage"],
    "Sports & Outdoors": ["Gym Equipment", "Outdoor Gear", "Yoga & Fitness", "Cycling", "Running"],
    "Beauty & Health": ["Skincare", "Haircare", "Supplements", "Makeup", "Personal Care"]
  },
  logo: null,
  banner: null
}
```

### 10. orders + orderItems (derived from purchase actions)

For every `purchase` action in any user's `userAnalytics.actions`, generate a matching order record. This keeps the data internally consistent and gives the order history endpoints real data to return.

Order record:

```
{
  _id: ObjectId,
  userId: ObjectId (the user who made the purchase),
  shopId: ObjectId (the shop the product belongs to),
  total: float (the product's sale_price × quantity),
  status: "Completed",
  deliveryStatus: "Delivered",
  couponCode: null,
  discountAmount: null,
  shippingAddressId: null,
  createdAt: ISODate (match the purchase action's timestamp),
  updatedAt: ISODate
}
```

OrderItem record (one per order):

```
{
  _id: ObjectId,
  orderId: ObjectId (references the order above),
  productId: string (the product _id as string),
  quantity: 1,
  price: float (product's sale_price),
  selectedOptions: null,
  createdAt: ISODate
}
```

### 11. uniqueShopVisitors (records linking users to shops they visited)

Generate ~60-80 records. Each user should have visited 2-4 shops. Must reference real shopId and userId ObjectIds.

```
{
  _id: ObjectId,
  shopId: ObjectId,
  userId: ObjectId,
  visitedAt: ISODate
}
```

---

## Output Format

Generate the data as **MongoDB insertMany-compatible JSON** — one array per collection, in this insertion order (order matters for foreign key consistency):

1. `sellers`
2. `shops`
3. `users`
4. `products`
5. `images` (one per product, referencing `productsId`)
6. `site_config` (single record)
7. `userAnalytics` (with actions array per user)
8. `productAnalytics` (derived from userAnalytics actions)
9. `orders`
10. `orderItems`
11. `shopAnalytics`
12. `uniqueShopVisitors`

Name each array clearly (e.g. `// === SELLERS ===` before each block).

Use `{ "$oid": "..." }` format for ObjectId fields and `{ "$date": "..." }` for dates if generating for mongoimport. Otherwise use plain string ObjectIds if generating for a Node.js script.

If generating a Node.js script using Prisma, use `prisma.collection.createMany({ data: [...] })` calls in the correct insertion order (sellers before shops, shops before products, users before userAnalytics).

---

## Validation Checklist (verify before outputting)

**Referential integrity:**

- [ ] Every `shopId` in a product matches a real shop `_id`
- [ ] Every `sellerId` in a shop matches a real seller `_id`
- [ ] Every `productId` in `userAnalytics.actions` matches a real product `_id`
- [ ] Every `shopId` in `userAnalytics.actions` matches a real shop `_id`
- [ ] Every `userId` in `userAnalytics` matches a real user `_id`
- [ ] Every `productId` in `productAnalytics` matches a real product `_id`
- [ ] Every `images` record has a valid `productsId` referencing a real product
- [ ] Every order's `userId` and `shopId` reference real user and shop `_id` values
- [ ] Every `orderItem`'s `orderId` references a real order
- [ ] Each shop's `sellerId` is unique — no two shops share the same seller

**Recommendation algorithm quality:**

- [ ] Tier 1 popular products appear in 10+ users' action arrays
- [ ] Tier 2 popular products appear in 5+ users' action arrays
- [ ] No user has duplicate `add_to_cart` for the same product
- [ ] No user has duplicate `add_to_wishlist` for the same product
- [ ] No user has duplicate `purchase` for the same product
- [ ] Every `purchase` action in `userAnalytics` has a corresponding order + orderItem record
- [ ] Every product has minimum 5 tags — all lowercase-hyphenated
- [ ] Every product includes its category-level tag (e.g. `"electronics"`, `"fashion"`)
- [ ] Products in the same subcategory share at least 2-3 tags
- [ ] `productAnalytics.views` matches the total `product_view` action count for that product across ALL users
- [ ] `productAnalytics.cartAdds`, `wishListAdds`, `purchases` counts match the action data

**Field formats:**

- [ ] All `products.colors[]` values are hex codes from the approved list — NO color name strings
- [ ] Electronics, Home & Garden, Beauty & Health products have `sizes: []`
- [ ] Fashion clothing products have sizes from `["XS","S","M","L","XL","XXL"]` only
- [ ] `products.custom_properties` is `{}` — never `null` or omitted
- [ ] `products.regular_price` >= `products.sale_price` for every product
- [ ] `products.status` is exactly `"Active"` (capital A)
- [ ] `orders.status` is exactly `"Paid"` (capital P)
- [ ] `orders.deliveryStatus` is exactly `"Delivered"` (capital D)
- [ ] `products.cashOnDelivery` is `"yes"` or `"no"` — not boolean, not capitalised
- [ ] `products.discount_codes` is `[]` — not null, not omitted
- [ ] `products.category` and `products.subCategory` exactly match the values in `site_config`
- [ ] Action timestamps are ISO 8601 strings — NOT Unix integer timestamps
- [ ] No `userId` field inside individual action objects
- [ ] Slugs are unique and URL-friendly (lowercase, hyphens only, no spaces)
- [ ] `site_config` has exactly one record

**MongoDB import format (ObjectId vs plain String):**

- [ ] `userAnalytics.userId` is a plain string — NOT wrapped in `{ "$oid": "..." }`
- [ ] `productAnalytics.productId` is a plain string — NOT wrapped in `{ "$oid": "..." }`
- [ ] `productAnalytics.shopId` is a plain string — NOT wrapped in `{ "$oid": "..." }`
- [ ] `orderItems.productId` is a plain string — NOT wrapped in `{ "$oid": "..." }`
- [ ] All actual ObjectId fields (`_id`, `shopId` in products, `userId`/`shopId` in orders, etc.) DO use `{ "$oid": "..." }`

---

---

## Known Bugs in the Current Codebase (relevant to seed data)

### Bug 1 — `actionType` vs `action` field name mismatch

The `recommendationService.ts` maps weights using `d.actionType`:

```ts
case 'purchase': return [1.0];
case 'add_to_cart': return [0.7];
```

But the Kafka service stores actions with field name `action` (not `actionType`). Seed data must use `action` to match what Kafka actually writes. The recommendation service needs a field name fix separately.

### Bug 2 — `userId` missing inside action objects

The recommendation service's `UserAction` interface expects `userId` inside each action object, but Kafka never stores it there. The `userId` lives on the parent `userAnalytics` document. Do NOT include `userId` inside individual action entries — match what Kafka actually stores.

### Bug 3 — `purchase` not in Kafka validActions (live system gap)

The Kafka consumer's `validActions` array does not include `purchase`, so real user purchases won't be tracked via Kafka currently. However, since `purchase` is a critical signal for recommendations (weight 1.0), include it in seed data directly. The Kafka service needs `'purchase'` added to `validActions` as a separate fix.

### Bug 4 — timestamp format

The Kafka service stores `timestamp: new Date()` which Prisma writes as ISODate in MongoDB. When generating seed data, use ISO 8601 date strings (e.g. `"2026-01-15T10:23:00.000Z"`) — not Unix milliseconds integers — to match the live system format.
