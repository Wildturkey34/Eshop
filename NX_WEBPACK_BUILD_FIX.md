# NX Webpack Build Configuration Fix

## Problem
Order-service and seller-service were not building properly with NX monorepo. The services would either:
- Not find the build target (`Cannot find build target @eshop/order-service:build:development`)
- Build with wrong configuration (`:build:production` instead of `:build:development`)
- Not show the server listening message

## Root Cause
The issue was caused by manually defining a `build` target in `package.json` with `@nx/webpack:webpack` executor. This conflicts with NX's webpack plugin which auto-generates build targets from `webpack.config.js`.

## Solution

### Step 1: Remove Manual Build Target
In `apps/order-service/package.json`, **remove** the manually defined build target:

```json
// ❌ DON'T DO THIS - Remove this section
"build": {
  "executor": "@nx/webpack:webpack",
  "outputs": ["{options.outputPath}"],
  "defaultConfiguration": "development",
  "options": {
    "target": "node",
    "compiler": "tsc",
    "outputPath": "apps/order-service/dist",
    "main": "apps/order-service/src/main.ts",
    "tsConfig": "apps/order-service/tsconfig.app.json",
    "webpackConfig": "apps/order-service/webpack.config.js"
  },
  ...
}
```

### Step 2: Let NX Webpack Plugin Auto-Generate
The NX webpack plugin (configured in `nx.json`) automatically generates build targets from `webpack.config.js`:

```json
// nx.json
{
  "plugin": "@nx/webpack/plugin",
  "options": {
    "buildTargetName": "build",
    "serveTargetName": "serve",
    ...
  }
}
```

### Step 3: Correct package.json Structure
Your `package.json` should only have the serve target (and other custom targets), **not** the build target:

```json
{
  "name": "@eshop/order-service",
  "version": "0.0.1",
  "private": true,
  "nx": {
    "targets": {
      "serve": {
        "continuous": true,
        "executor": "@nx/js:node",
        "defaultConfiguration": "development",
        "dependsOn": ["build"],
        "options": {
          "buildTarget": "@eshop/order-service:build",
          "runBuildTargetDependencies": false,
          "inspect": false
        },
        "configurations": {
          "development": {
            "buildTarget": "@eshop/order-service:build:development"
          },
          "production": {
            "buildTarget": "@eshop/order-service:build:production"
          }
        }
      }
    }
  }
}
```

### Step 4: Disable Inspector
Add `"inspect": false` to serve options to avoid "address already in use" errors when multiple services run.

### Step 5: Fix tsconfig.app.json
Ensure packages are included in the TypeScript compilation:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "module": "nodenext",
    "types": ["node", "express"],
    "rootDir": "../../",
    "moduleResolution": "nodenext",
    "tsBuildInfoFile": "dist/tsconfig.app.tsbuildinfo"
  },
  "include": ["src/**/*.ts", "../../packages/**/*.ts"],
  "exclude": []
}
```

## Key Takeaway
**Never manually define a `build` target in `package.json` when using the NX webpack plugin.** Let NX auto-generate it from your `webpack.config.js`.

## Reference: Working Services
- `apps/product-service/package.json` - No build target defined ✅
- `apps/auth-service/package.json` - No build target defined ✅
- `apps/api-gateway/package.json` - No build target defined ✅

## Bonus: Remove Dotenv from Utilities
If you're getting dotenv spam in logs, remove it from utility files:

```typescript
// ❌ DON'T import dotenv in utility files
import dotenv from 'dotenv';
dotenv.config();

// ✅ Let the main.ts or environment handle it
```
