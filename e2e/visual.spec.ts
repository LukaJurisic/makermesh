import {expect, test} from '@playwright/test';

const viewports = [
  {name: 'desktop-1440x900', width: 1440, height: 900},
  {name: 'laptop-1280x800', width: 1280, height: 800},
  {name: 'tablet-768x1024', width: 768, height: 1024},
  {name: 'mobile-390x844', width: 390, height: 844},
] as const;

async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => (image.complete ? Promise.resolve() : image.decode())),
    );
  });
  await page.waitForTimeout(650);
}

for (const viewport of viewports) {
  test(`captures ${viewport.name}`, async ({page}) => {
    test.skip(test.info().project.name !== 'chromium', 'Capture each canonical viewport once.');
    await page.setViewportSize({width: viewport.width, height: viewport.height});
    await page.goto('/');
    await settle(page);
    await expect(page.getByRole('heading', {name: 'A market appears when you ask.'})).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/${viewport.name}-landing.png`,
      fullPage: true,
    });

    await page.goto('/projects/harbour-coffee-lab/brief');
    await settle(page);
    await expect(page.getByRole('heading', {name: 'Structured sourcing brief'})).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/${viewport.name}-brief.png`,
      fullPage: true,
    });

    await page.goto('/projects/harbour-coffee-lab/passport?present=1');
    await settle(page);
    await expect(
      page.getByText('Demonstration profile — not a real supplier endorsement.'),
    ).toBeVisible();
    await page.screenshot({
      path: `artifacts/screenshots/${viewport.name}-passport.png`,
      fullPage: true,
    });
  });
}
