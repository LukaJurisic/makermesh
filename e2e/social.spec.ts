import {expect, test} from '@playwright/test';

test('generates the MakerMesh Open Graph image', async ({page}) => {
  test.skip(test.info().project.name !== 'chromium', 'Generate the canonical asset once.');
  await page.setViewportSize({width: 1200, height: 630});
  await page.goto('/share-card');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => (image.complete ? Promise.resolve() : image.decode())),
    );
  });
  await expect(
    page.getByRole('heading', {name: 'Find a workshop for your café’s next cups.'}),
  ).toBeVisible();
  await page.screenshot({path: 'public/social/makermesh-og.png'});
});
