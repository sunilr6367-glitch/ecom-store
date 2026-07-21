import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log('Starting Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to local storefront
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Assuming there is a product on the homepage, click on it
    console.log('Finding a product to add to cart...');
    const productLink = page.locator('a[href^="/products/"]').first();
    await productLink.click();
    await page.waitForLoadState('networkidle');

    console.log('Adding to cart...');
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
    await addToCartBtn.click();
    await page.waitForTimeout(2000);

    console.log('Navigating to checkout...');
    await page.goto('http://localhost:3001/checkout', { waitUntil: 'networkidle' });

    console.log('Filling checkout form...');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="address_1"]', '123 Test St');
    await page.fill('input[name="city"]', 'Mumbai');
    await page.fill('input[name="postal_code"]', '400001');

    // Select India
    console.log('Selecting India from Country dropdown...');
    await page.click('button:has-text("Select country")');
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="Search country..."]', 'India');
    await page.click('button:has-text("India")');
    await page.waitForTimeout(2000); // Wait for API calls

    // Accept Terms
    console.log('Accepting terms...');
    const termsCheckbox = page.locator('input[type="checkbox"]').last();
    await termsCheckbox.check({ force: true });

    console.log('Clicking Continue to Payment...');
    await page.click('button:has-text("Continue to Payment")');
    await page.waitForTimeout(3000); // Wait for transition

    console.log('Taking screenshot...');
    const dest = path.resolve(process.cwd(), 'checkout_step2.png');
    await page.screenshot({ path: dest, fullPage: true });
    console.log('Screenshot saved to', dest);

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
