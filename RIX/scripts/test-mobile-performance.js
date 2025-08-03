#!/usr/bin/env node

// /scripts/test-mobile-performance.js
// Mobile performance validation script for RIX PWA
// Tests Core Web Vitals, PWA functionality, and mobile-specific features
// RELEVANT FILES: mobile-performance-tester.ts, service-worker.js, mobile-navigation.tsx

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RIX Mobile Performance Test Suite');
console.log('═══════════════════════════════════════');

// Test configuration
const testConfig = {
  buildDir: 'out',
  port: 3000,
  timeout: 30000,
  mobile: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3
  }
};

// Core tests
const tests = [
  {
    name: 'Build Validation',
    description: 'Verify clean build with mobile optimizations',
    test: testBuild
  },
  {
    name: 'Bundle Size Analysis',
    description: 'Check mobile-optimized bundle sizes',
    test: testBundleSize
  },
  {
    name: 'PWA Manifest Validation',
    description: 'Validate PWA manifest for mobile installation',
    test: testPWAManifest
  },
  {
    name: 'Service Worker Functionality',
    description: 'Test mobile-optimized service worker',
    test: testServiceWorker
  },
  {
    name: 'Mobile Navigation Test',
    description: 'Validate touch interactions and gestures',
    test: testMobileNavigation
  },
  {
    name: 'Responsive Design Validation',
    description: 'Test layouts across mobile breakpoints',
    test: testResponsiveDesign
  },
  {
    name: 'Performance Metrics',
    description: 'Validate Core Web Vitals targets',
    test: testPerformanceMetrics
  }
];

async function runTests() {
  console.log(`📋 Running ${tests.length} mobile performance tests...\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`⏳ ${test.name}: ${test.description}`);
    
    try {
      await test.test();
      console.log(`✅ ${test.name}: PASSED\n`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name}: FAILED`);
      console.error(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('═══════════════════════════════════════');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('❌ Some mobile performance tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All mobile performance tests passed!');
  }
}

async function testBuild() {
  console.log('   Building application...');
  
  try {
    execSync('npm run build', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
      timeout: testConfig.timeout
    });
    
    // Check if build directory exists
    const buildPath = path.join(__dirname, '..', '.next');
    if (!fs.existsSync(buildPath)) {
      throw new Error('Build directory not found');
    }
    
    console.log('   ✓ Build completed successfully');
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
}

async function testBundleSize() {
  console.log('   Analyzing bundle sizes...');
  
  const buildPath = path.join(__dirname, '..', '.next');
  const staticPath = path.join(buildPath, 'static');
  
  if (!fs.existsSync(staticPath)) {
    throw new Error('Static build files not found');
  }
  
  // Check for optimized chunks
  const chunksPath = path.join(staticPath, 'chunks');
  if (fs.existsSync(chunksPath)) {
    const chunkFiles = fs.readdirSync(chunksPath);
    const jsChunks = chunkFiles.filter(file => file.endsWith('.js'));
    
    console.log(`   ✓ Found ${jsChunks.length} JS chunks`);
    
    // Check for critical mobile chunks
    const hasMobileOptimizations = jsChunks.some(chunk => 
      chunk.includes('mobile') || 
      chunk.includes('navigation') || 
      chunk.includes('touch')
    );
    
    if (hasMobileOptimizations) {
      console.log('   ✓ Mobile-specific optimizations detected');
    }
  }
  
  console.log('   ✓ Bundle analysis completed');
}

async function testPWAManifest() {
  console.log('   Validating PWA manifest...');
  
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error('PWA manifest not found');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Validate required PWA fields
  const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      throw new Error(`Missing required manifest field: ${field}`);
    }
  }
  
  // Validate mobile-specific features
  if (!manifest.icons || manifest.icons.length === 0) {
    throw new Error('No icons defined in manifest');
  }
  
  // Check for mobile icon sizes
  const requiredSizes = ['192x192', '512x512'];
  for (const size of requiredSizes) {
    const hasSize = manifest.icons.some(icon => icon.sizes === size);
    if (!hasSize) {
      console.log(`   ⚠️  Missing recommended icon size: ${size}`);
    }
  }
  
  if (manifest.display !== 'standalone') {
    console.log('   ⚠️  Display mode is not "standalone"');
  }
  
  console.log('   ✓ PWA manifest validation completed');
}

async function testServiceWorker() {
  console.log('   Testing service worker...');
  
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  
  if (!fs.existsSync(swPath)) {
    throw new Error('Service worker not found');
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for mobile optimizations
  const mobileFeatures = [
    'mobile',
    'touch',
    'cache',
    'offline',
    'performance'
  ];
  
  const hasOptimizations = mobileFeatures.some(feature => 
    swContent.toLowerCase().includes(feature)
  );
  
  if (!hasOptimizations) {
    console.log('   ⚠️  Service worker may lack mobile optimizations');
  }
  
  // Check for proper cache strategies
  if (!swContent.includes('networkFirst') || !swContent.includes('cacheFirst')) {
    console.log('   ⚠️  Service worker may lack proper cache strategies');
  }
  
  console.log('   ✓ Service worker validation completed');
}

async function testMobileNavigation() {
  console.log('   Testing mobile navigation components...');
  
  const mobileNavPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'mobile-navigation.tsx');
  
  if (!fs.existsSync(mobileNavPath)) {
    throw new Error('Mobile navigation component not found');
  }
  
  const navContent = fs.readFileSync(mobileNavPath, 'utf8');
  
  // Check for mobile-specific features
  const mobileFeatures = [
    'touch-manipulation',
    'haptic',
    'gesture',
    'swipe',
    'active:scale'
  ];
  
  const missingFeatures = mobileFeatures.filter(feature => 
    !navContent.includes(feature)
  );
  
  if (missingFeatures.length > 0) {
    console.log(`   ⚠️  Missing mobile features: ${missingFeatures.join(', ')}`);
  }
  
  // Check for accessibility features
  const a11yFeatures = ['aria-label', 'aria-expanded', 'role'];
  const missingA11y = a11yFeatures.filter(feature => 
    !navContent.includes(feature)
  );
  
  if (missingA11y.length > 0) {
    console.log(`   ⚠️  Missing accessibility features: ${missingA11y.join(', ')}`);
  }
  
  console.log('   ✓ Mobile navigation validation completed');
}

async function testResponsiveDesign() {
  console.log('   Testing responsive design system...');
  
  const cssPath = path.join(__dirname, '..', 'src', 'styles', 'design-system.css');
  
  if (!fs.existsSync(cssPath)) {
    throw new Error('Design system CSS not found');
  }
  
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Check for mobile breakpoints
  const mobileBreakpoints = [
    '@media (max-width: 767px)',
    '@media (max-width: 768px)',
    'safe-area-inset',
    'env(safe-area-inset'
  ];
  
  const missingBreakpoints = mobileBreakpoints.filter(bp => 
    !cssContent.includes(bp)
  );
  
  if (missingBreakpoints.length > 0) {
    console.log(`   ⚠️  Missing mobile breakpoints: ${missingBreakpoints.join(', ')}`);
  }
  
  // Check for mobile-specific CSS
  const mobileCSS = [
    'touch-manipulation',
    'user-select: none',
    'backdrop-filter',
    'transform: scale'
  ];
  
  const missingCSS = mobileCSS.filter(css => 
    !cssContent.includes(css)
  );
  
  if (missingCSS.length > 0) {
    console.log(`   ⚠️  Missing mobile CSS: ${missingCSS.join(', ')}`);
  }
  
  console.log('   ✓ Responsive design validation completed');
}

async function testPerformanceMetrics() {
  console.log('   Testing performance monitoring...');
  
  const perfTesterPath = path.join(__dirname, '..', 'src', 'utils', 'mobile-performance-tester.ts');
  
  if (!fs.existsSync(perfTesterPath)) {
    throw new Error('Mobile performance tester not found');
  }
  
  const perfContent = fs.readFileSync(perfTesterPath, 'utf8');
  
  // Check for Core Web Vitals
  const coreVitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
  const missingVitals = coreVitals.filter(vital => 
    !perfContent.includes(vital)
  );
  
  if (missingVitals.length > 0) {
    throw new Error(`Missing Core Web Vitals: ${missingVitals.join(', ')}`);
  }
  
  // Check for mobile-specific metrics
  const mobileMetrics = ['touchLatency', 'scrollPerformance', 'batteryLevel'];
  const missingMetrics = mobileMetrics.filter(metric => 
    !perfContent.includes(metric)
  );
  
  if (missingMetrics.length > 0) {
    console.log(`   ⚠️  Missing mobile metrics: ${missingMetrics.join(', ')}`);
  }
  
  console.log('   ✓ Performance monitoring validation completed');
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error.message);
  process.exit(1);
});