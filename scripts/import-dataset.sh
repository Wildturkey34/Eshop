#!/bin/bash

# Load DATABASE_URL from root .env (handles spaces around = signs)
ENV_FILE="$(dirname "$0")/../.env"
DATABASE_URL=$(grep '^DATABASE_URL' "$ENV_FILE" | head -1 | sed 's/^DATABASE_URL\s*=\s*//' | tr -d '"' | tr -d "'")

DATASET="$(dirname "$0")/../dataset"
DB="development"

echo "🚀 Importing seed dataset into MongoDB..."
echo ""

run_import() {
  local collection=$1
  local file=$2
  echo "  → $collection"
  mongoimport \
    --uri "$DATABASE_URL" \
    --db "$DB" \
    --collection "$collection" \
    --jsonArray \
    --mode=insert \
    --file "$DATASET/$file"
}

# Order matters — foreign keys must exist before referencing collections
run_import "sellers"            "sellers.json"
run_import "shops"              "shops.json"
run_import "users"              "users.json"
run_import "products"           "products.json"
run_import "images"             "images.json"
run_import "site_config"        "site_config.json"
run_import "userAnalytics"      "user-analytics.json"
run_import "productAnalytics"   "product-analytics.json"
run_import "orders"             "orders.json"
run_import "orderItems"         "order-items.json"
run_import "shopAnalytics"      "shop-analytics.json"
run_import "uniqueShopVisitors" "unique-shop-visitors.json"

echo ""
echo "✅ Done!"
