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

# Run frontend apps
pnpm seller-ui          # Seller dashboard
pnpm user-ui            # User-facing storefront

# Build a service
npx nx build <app-name>

# Generate Prisma client after schema changes
pnpm prisma:generate

# Generate API docs
pnpm auth-docs
pnpm product-docs
```

## Architecture Overview

This is an **Nx monorepo** for an e-commerce platform with microservices architecture.

### Apps (`apps/`)
- **api-gateway** - Express.js gateway that routes requests to microservices
- **auth-service** - Express.js authentication service (JWT-based)
- **product-service** - Express.js product management service
- **seller-ui** - Next.js 15 seller dashboard
- **user-ui** - Next.js 15 customer storefront

### Shared Packages (`packages/`)
- **components** - Shared React components
- **error-handler** - Centralized error handling utilities
- **middleware** - Shared Express middleware
- **libs/imagekit** - ImageKit integration for image uploads

### Data Layer
- **Database**: MongoDB (via Prisma ORM)
- **Cache**: Redis (ioredis)
- **Schema**: `prisma/schema.prisma` - defines users, sellers, shops, products, discount codes

### Key Integrations
- **Stripe** - Payment processing
- **ImageKit** - Image storage and CDN
- **Nodemailer** - Email sending

### Frontend Stack
- Next.js 15 with React 19
- Tailwind CSS for styling
- React Query for server state
- Jotai for client state
- React Hook Form for forms
