# LiftLab Deployment Guide 🚀

> **Complete guide for deploying LiftLab to GitHub Pages with automated CI/CD**

## 🎯 **Overview**

This guide will help you deploy LiftLab to GitHub Pages with automated builds using GitHub Actions. The setup includes:

- **Automated builds** on every push to main
- **Static hosting** on GitHub Pages
- **Custom domain support** (optional)
- **Build optimization** for production
- **Automatic dependency management**

---

## 📋 **Prerequisites**

- GitHub repository with LiftLab code
- GitHub account with Pages enabled
- Node.js 18+ (for local development)
- Basic understanding of Git workflows

---

## 🔧 **Setup Instructions**

### **Step 1: Repository Configuration**

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - This allows custom workflows to deploy to Pages

2. **Set Repository Permissions**:
   - Go to **Settings** → **Actions** → **General**
   - Under **Workflow permissions**, select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**

### **Step 2: Create GitHub Actions Workflow**

Create the following file in your repository:

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy LiftLab to GitHub Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Build job
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Pages
        uses: actions/configure-pages@v4
        with:
          # Automatically inject basePath in your Next.js configuration file and disable
          # server side image optimization (https://nextjs.org/docs/api-reference/next/image#unoptimized).
          #
          # You may remove this line if you want to manage the configuration yourself.
          static_site_generator: custom

      - name: Install dependencies
        run: npm ci

      - name: Build simulation engine
        run: npm run build --workspace=@lift-lab/sim

      - name: Build web application
        run: npm run build --workspace=@lift-lab/web

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./packages/web/dist

  # Deployment job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### **Step 3: Configure Vite for GitHub Pages**

Update your Vite configuration to work with GitHub Pages:

**`packages/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages
  // Replace 'your-repo-name' with your actual repository name
  base: process.env.NODE_ENV === 'production' ? '/LiftLab/' : '/',
  build: {
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          vendor: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
          simulation: ['@lift-lab/sim']
        }
      }
    }
  },
  // Ensure proper asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif']
})
```

### **Step 4: Update Package Scripts**

Add deployment-specific scripts to your root `package.json`:

```json
{
  "scripts": {
    "dev": "npm run dev --workspace=@lift-lab/web",
    "build": "npm run build --workspace=@lift-lab/sim && npm run build --workspace=@lift-lab/web",
    "build:prod": "NODE_ENV=production npm run build",
    "preview": "npm run preview --workspace=@lift-lab/web",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "format": "prettier --write .",
    "type-check": "npm run type-check --workspace=@lift-lab/sim && npm run type-check --workspace=@lift-lab/web",
    "test-sim": "npm run test-sim --workspace=@lift-lab/sim",
    "simulate": "npm run simulate --workspace=@lift-lab/sim",
    "cli": "npm run cli --workspace=@lift-lab/sim",
    "clean": "rm -rf packages/*/dist packages/*/node_modules node_modules",
    "postinstall": "npm run build"
  }
}
```

---

## 🚀 **Deployment Process**

### **Automatic Deployment**

Once set up, deployment is automatic:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "feat: add new elevator algorithm"
   git push origin main
   ```

2. **GitHub Actions will**:
   - Install dependencies
   - Build the simulation engine
   - Build the web application
   - Deploy to GitHub Pages
   - Provide deployment URL

3. **Access your site**:
   - URL: `https://yourusername.github.io/your-repo-name/`
   - Updates automatically on every push

### **Manual Deployment**

You can also trigger deployment manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy LiftLab to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

---

## 🔧 **Configuration Options**

### **Custom Domain (Optional)**

To use a custom domain:

1. **Add CNAME file**:
   Create `packages/web/public/CNAME` with your domain:
   ```
   liftlab.yourdomain.com
   ```

2. **Update Vite config**:
   ```typescript
   export default defineConfig({
     base: process.env.NODE_ENV === 'production' ? '/' : '/',
     // ... rest of config
   })
   ```

3. **Configure DNS**:
   - Add CNAME record pointing to `yourusername.github.io`
   - Or A records pointing to GitHub Pages IPs

### **Environment Variables**

For different environments, you can use GitHub Secrets:

1. **Go to Settings** → **Secrets and variables** → **Actions**
2. **Add secrets**:
   - `VITE_API_URL` (if you add backend later)
   - `VITE_ANALYTICS_ID` (for analytics)

3. **Use in workflow**:
   ```yaml
   - name: Build web application
     run: npm run build --workspace=@lift-lab/web
     env:
       VITE_API_URL: ${{ secrets.VITE_API_URL }}
   ```

### **Build Optimization**

For better performance, consider these optimizations:

**`packages/web/vite.config.ts`**:
```typescript
export default defineConfig({
  build: {
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          konva: ['konva', 'react-konva'],
          simulation: ['@lift-lab/sim']
        }
      }
    }
  }
})
```

---

## 📊 **Monitoring & Analytics**

### **GitHub Actions Monitoring**

Monitor your deployments:

1. **Actions tab**: View build status and logs
2. **Environments**: See deployment history and status
3. **Notifications**: Get email alerts on build failures

### **Performance Monitoring**

Add performance monitoring to your app:

**`packages/web/src/main.tsx`**:
```typescript
// Add performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart);
  });
}
```

### **Analytics Integration**

Add Google Analytics or similar:

1. **Install analytics**:
   ```bash
   npm install --workspace=@lift-lab/web @vercel/analytics
   ```

2. **Add to app**:
   ```typescript
   import { Analytics } from '@vercel/analytics/react';
   
   function App() {
     return (
       <>
         {/* Your app content */}
         <Analytics />
       </>
     );
   }
   ```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Fails with "Module not found"**
```bash
# Solution: Ensure all dependencies are in package.json
npm install --workspace=@lift-lab/web missing-package
```

#### **404 on Refresh (SPA Routing)**
Add to `packages/web/public/_redirects`:
```
/*    /index.html   200
```

Or for GitHub Pages, create `packages/web/public/404.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <script>
    // Redirect to index.html for SPA routing
    window.location.replace('/LiftLab/');
  </script>
</head>
</html>
```

#### **Assets Not Loading**
Ensure base path is correct in `vite.config.ts`:
```typescript
base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
```

#### **Large Bundle Size**
Enable code splitting:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
      }
    }
  }
}
```

### **Debug Deployment**

1. **Check workflow logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed steps to see errors

2. **Test locally**:
   ```bash
   # Build and preview locally
   npm run build:prod
   npm run preview
   ```

3. **Validate build output**:
   ```bash
   # Check if files are generated
   ls -la packages/web/dist/
   ```

---

## 🔄 **Advanced Workflows**

### **Multi-Environment Deployment**

Deploy to staging and production:

**`.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: ["develop"]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      # ... build steps ...
      - name: Deploy to staging
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/web/dist
          destination_dir: staging
```

### **Pull Request Previews**

Create preview deployments for PRs:

**`.github/workflows/preview.yml`**:
```yaml
name: Preview Deployment

on:
  pull_request:
    branches: ["main"]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      # ... build steps ...
      - name: Deploy preview
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/web/dist
          destination_dir: preview/pr-${{ github.event.number }}
```

---

## 📈 **Performance Optimization**

### **Build Performance**

Speed up builds:

```yaml
# In your workflow
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### **Runtime Performance**

Optimize the deployed app:

1. **Enable compression** in Vite config
2. **Use CDN** for large assets
3. **Implement lazy loading** for components
4. **Add service worker** for caching

---

## 🎉 **Success Checklist**

After deployment, verify:

- ✅ **Site loads** at GitHub Pages URL
- ✅ **Simulation works** correctly
- ✅ **All assets load** (no 404s in console)
- ✅ **Responsive design** works on mobile
- ✅ **Performance** is acceptable (< 3s load time)
- ✅ **SEO basics** (title, meta tags)
- ✅ **Analytics** tracking (if enabled)

---

## 🔗 **Useful Links**

- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Vite Deployment Guide**: https://vitejs.dev/guide/static-deploy.html
- **Custom Domain Setup**: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

---

**Your LiftLab deployment is now ready! 🚀 Push to main and watch it deploy automatically.** ✨
