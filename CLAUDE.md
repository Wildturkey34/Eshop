# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Run all services in development mode
pnpm dev

# Run individual services
npx nx serve api-gateway
npx nx serve auth-service
npx nx serve product-service
npx nx serve seller-service
npx nx serve order-service
npx nx serve admin-service
npx nx serve chatting-service
npx nx serve kafka-service
npx nx serve recommendation-service

# Run frontend apps
pnpm user-ui            # User-facing storefront (Port 3000)
pnpm seller-ui          # Seller dashboard (Port 3001)
pnpm admin-ui           # Admin dashboard (Port 3002)

# Build a service
npx nx build <app-name>

# Generate Prisma client after schema changes
pnpm prisma:generate

# Generate API docs
pnpm auth-docs
pnpm product-docs
pnpm seller-docs
```

## Project Overview

This is a **production-ready e-commerce platform** built as an **Nx monorepo** with **microservices architecture**. The platform supports three user roles (customers, sellers, admins) with separate frontends, real-time chat, analytics tracking, payment processing, and event-driven architecture.

## Architecture Overview

### System Architecture Pattern
```
Client Applications (Next.js 15)
    ↓
API Gateway (Port 8080) - Rate limiting, CORS, routing
    ↓
Microservices Layer (Express.js)
    ├─ Auth Service (6001)
    ├─ Product Service (6002)
    ├─ Seller Service (6003)
    ├─ Order Service (6004)
    ├─ Admin Service (6005)
    ├─ Chatting Service (6006) - WebSocket + HTTP
    └─ Recommendation Service (6007)
    ↓
Data Layer
    ├─ MongoDB (Prisma ORM)
    └─ Redis (Cache)

Async Event Processing
    User Actions → Kafka Topic → Kafka Service → Analytics DB
```

### Backend Services (`apps/`)

#### 1. **api-gateway** (Port 8080)
Express.js API Gateway that orchestrates all microservice communication.
- **Features:**
  - Routes requests to all backend services
  - Rate limiting (100 req/min anonymous, 1000 req/min authenticated)
  - CORS enabled for localhost:3000-3002
  - Morgan logging
  - Proxy routing to: product, seller, order, admin, chatting services

#### 2. **auth-service** (Port 6001)
JWT-based authentication and user management.
- **Features:**
  - User & seller registration with email OTP verification
  - JWT token generation with cookie-based sessions
  - Password hashing with bcryptjs
  - Stripe integration for seller payment setup
  - Email templates with Nodemailer
  - Swagger/OpenAPI documentation
- **Endpoints:** `/auth/user/*`, `/auth/seller/*`

#### 3. **product-service** (Port 6002)
Product catalog and inventory management.
- **Features:**
  - Product CRUD with ImageKit image uploads
  - Category and subcategory management
  - Stock tracking with low-stock notifications (node-cron)
  - Product analytics tracking (views, cart adds, wishlist)
  - Bulk operations and filtering
  - Swagger documentation
- **Endpoints:** `/product/*`

#### 4. **seller-service** (Port 6003)
Seller dashboard operations and shop management.
- **Features:**
  - Seller profile and shop management
  - Discount code creation and management
  - Low stock alert threshold configuration
  - Notification preferences (email, web, app)
  - Scheduled cron jobs for seller-specific tasks
  - Shop analytics and follower tracking
- **Endpoints:** `/seller/*`

#### 5. **order-service** (Port 6004)
Order processing and payment handling.
- **Features:**
  - Order creation with Stripe payment integration
  - Stripe webhook handling for payment confirmations
  - Raw body parsing for webhook signature verification
  - Order status and delivery tracking
  - Order items and shipping address management
  - Order history and analytics
- **Endpoints:** `/order/*`

#### 6. **admin-service** (Port 6005)
Platform administration and configuration.
- **Features:**
  - Site configuration management (categories, subcategories)
  - User and seller oversight
  - Order and payment management
  - Platform analytics and reporting
  - System-wide settings
- **Endpoints:** `/admin/*`

#### 7. **chatting-service** (Port 6006)
Real-time messaging between users and sellers.
- **Features:**
  - WebSocket server for real-time bidirectional communication
  - Kafka consumer integration for async message processing
  - Conversation group management
  - Participant tracking with online/offline status
  - Message persistence with delivery/read status
  - Connection state management
- **Endpoints:** `/chat/*` (HTTP) + WebSocket connections

#### 8. **kafka-service** (No exposed port)
Event consumer for async analytics processing.
- **Features:**
  - Consumes `users-events` Kafka topic
  - Processes user analytics events (product_view, add_to_cart, add_to_wishlist, etc.)
  - Event queue batching with 3-second intervals
  - Updates user analytics with action history
  - Retry logic with exponential backoff (max 10 retries)
  - Location and device tracking

#### 9. **recommendation-service** (Port 6007)
Product recommendation engine (placeholder for ML integration).
- **Status:** Currently minimal implementation
- **Future:** ML-based product recommendations

### Frontend Applications (`apps/`)

#### 1. **user-ui** (Port 3000)
Customer-facing storefront built with Next.js 15.
- **Features:**
  - Product browsing, search, filtering
  - Shopping cart and wishlist
  - Order placement and tracking
  - User profile and address management
  - Real-time chat with sellers (WebSocket)
  - Location tracking for analytics
  - Multiple pages: products, shop, order details, checkout
- **Tech Stack:** Next.js 15, React 19, Tailwind CSS, React Query, Jotai, Framer Motion

#### 2. **seller-ui** (Port 3001)
Seller dashboard for managing shops and products.
- **Features:**
  - Product management (create, edit, delete)
  - Inbox/chat interface for customer communication
  - Order fulfillment and tracking
  - Shop analytics and reporting
  - Discount code management
  - Inventory alerts
- **Tech Stack:** Next.js 15, React 19, Tailwind CSS, React Query, Zustand

#### 3. **admin-ui** (Port 3002)
Admin dashboard for platform management.
- **Features:**
  - Site customization and configuration
  - User and seller management
  - Order and payment oversight
  - Product moderation
  - Platform events and analytics
  - System settings
- **Tech Stack:** Next.js 15, React 19, Tailwind CSS, ApexCharts, Recharts

### Shared Packages (`packages/`)

#### Core Packages
- **error-handler** - Centralized error handling
  - Custom error classes: AppError, NotFoundError, ValidationError, AuthError, ForbiddenError, DatabaseError, RateLimitError
  - Error middleware for consistent API responses

- **middleware** - Express middleware
  - Authentication middleware (JWT validation)
  - Role-based authorization (isSeller, isUser, isAdmin)

- **utils** - Utility functions
  - Kafka client setup and configuration
  - Logging utilities

#### Internal Libraries (`packages/libs/`)
- **prisma** - Singleton PrismaClient instance with dev hot-reload
- **redis** - Redis client using ioredis
- **imagekit** - ImageKit image CDN integration
- **email** - Email service setup with Nodemailer

### Data Layer

#### Database: MongoDB (via Prisma ORM)
Schema location: `prisma/schema.prisma`

**Core Models:**
- **users** - Customer accounts (role, password, avatar, email)
- **sellers** - Seller accounts (Stripe integration, notification preferences)
- **shops** - Seller shop profiles (ratings, reviews, followers, social links)
- **products** - Product listings (images, pricing, stock, specs, analytics)
- **orders** - Order records linked to users and shops
- **orderItems** - Individual items in orders (pricing, options, quantity)
- **address** - User delivery addresses (Home/Work/Other types)

**Analytics Models:**
- **userAnalytics** - User location, device, actions history, last visit
- **productAnalytics** - Product views, cart adds, wishlist adds, purchases
- **shopAnalytics** - Shop visitor counts by country/city/device
- **uniqueShopVisitors** - Track unique visitors per shop

**Support Models:**
- **images** - ImageKit file references
- **shopReviews** - User ratings and reviews of shops
- **followers** - Shop followers tracking
- **discount_codes** - Seller-created discount codes
- **site_config** - Platform categories and subcategories
- **conversationGroup** - Chat conversations
- **participant** - Chat participants with online status
- **message** - Chat messages with delivery status
- **notifications** - In-app notifications

#### Cache: Redis (ioredis)
Used for session management and caching frequently accessed data.

### Technology Stack

#### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ORM:** Prisma
- **Authentication:** JWT, bcryptjs
- **Async Messaging:** Kafka (kafkajs)
- **Caching:** Redis (ioredis)
- **Image Storage:** ImageKit
- **Payments:** Stripe (with webhooks)
- **Email:** Nodemailer (EJS templates)
- **Job Scheduling:** node-cron
- **Real-time:** WebSocket (ws)
- **API Docs:** Swagger/OpenAPI

#### Frontend
- **Framework:** Next.js 15
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **State Management:** Jotai, Zustand
- **Data Fetching:** React Query
- **Forms:** React Hook Form
- **Animations:** Framer Motion
- **Charts:** ApexCharts, Recharts
- **Notifications:** react-hot-toast, sonner
- **Build Tool:** SWC

#### Build & Development
- **Monorepo:** Nx
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Testing:** Jest
- **Bundler:** Webpack
- **Compiler:** SWC

### Key Features

#### User Features
- Product browsing with advanced filtering
- Shopping cart and wishlist
- Secure checkout with Stripe
- Order tracking
- Real-time chat with sellers
- Shop following system
- Product reviews and ratings
- Location-based analytics

#### Seller Features
- Shop creation and customization
- Product management with image uploads
- Inventory tracking with low-stock alerts
- Discount code creation
- Real-time chat with customers
- Sales analytics and reporting
- Order fulfillment management
- Notification preferences

#### Admin Features
- Platform configuration
- User and seller management
- Order and payment oversight
- Product moderation
- Analytics dashboards
- Category management

#### Platform Features
- Multi-tenant architecture (users, sellers, admins)
- Event-driven analytics with Kafka
- Real-time communication with WebSocket
- Rate limiting and security
- Email notifications
- Image CDN integration
- Payment processing with Stripe
- Scheduled jobs for automated tasks

### Service Ports Reference

| Service | Port | Type |
|---------|------|------|
| API Gateway | 8080 | HTTP |
| Auth Service | 6001 | HTTP |
| Product Service | 6002 | HTTP |
| Seller Service | 6003 | HTTP |
| Order Service | 6004 | HTTP |
| Admin Service | 6005 | HTTP |
| Chatting Service | 6006 | HTTP + WebSocket |
| Recommendation Service | 6007 | HTTP |
| User UI | 3000 | Next.js |
| Seller UI | 3001 | Next.js |
| Admin UI | 3002 | Next.js |

### Key Integrations

- **Stripe** - Payment processing and seller payouts
- **ImageKit** - Image storage, transformation, and CDN
- **Nodemailer** - Transactional emails (OTP, notifications)
- **Kafka** - Event streaming for analytics
- **WebSocket** - Real-time bidirectional communication
