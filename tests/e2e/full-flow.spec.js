import { test, expect } from '@playwright/test';

test.describe('Wedding Registry Flow', () => {
    test('should allow creating a wedding, adding gifts, and claiming them', async ({ page }) => {
        // Debug: Print console logs
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));

        // 1. Visit Landing Page
        await page.goto('/');
        await expect(page.getByText('The Modern Wedding Registry')).toBeVisible();

        // 2. Create Registry
        // Handle the confirmation dialog BEFORE triggering it
        page.once('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        // Click and wait for navigation specifically
        await page.getByRole('button', { name: "Create Registry" }).click();

        // Explicit wait for URL change
        await expect(page).toHaveURL(/.*\/dashboard\?id=.*/, { timeout: 10000 });
        await expect(page.getByText('Wedding Dashboard')).toBeVisible();

        // 3. Add a Gift
        const giftName = 'Super Fancy Mixer';
        await page.getByPlaceholder('Add gift').fill(giftName);
        await page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).click();

        // Verify Gift Appears
        await expect(page.getByText(giftName)).toBeVisible();
        await expect(page.getByText('Still needed')).toBeVisible();

        // 4. Guest View (Simulating same window for simplicity, but logically distinct)
        const guestLink = await page.getByText(/http:\/\/localhost:\d+\/guest\//).textContent();
        const guestUrl = guestLink.trim();

        await page.goto(guestUrl);
        await expect(page.getByRole('heading', { level: 2 })).toHaveText(/Wedding Registry/);

        // 5. Claim Gift
        const claimButton = page.getByRole('button', { name: "I'll Bring This" });
        await expect(claimButton).toBeVisible();

        // Handle claim alert
        page.on('dialog', dialog => dialog.accept());
        await claimButton.click();

        // Verify Claimed State
        await expect(page.getByText('Taken')).toBeVisible();
        // Reload to simulate fresh state if real-time isn't triggering fast enough for test
        await page.reload();
        await expect(page.getByText('Someone is bringing this')).toBeVisible();
    });
});
