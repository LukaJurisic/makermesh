import {expect, test} from '@playwright/test';

test('judge can inspect the complete espresso-cup story', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'A market appears when you ask.'})).toBeVisible();
  await page.getByRole('link', {name: 'Open the espresso-cup demo'}).click();

  await expect(page.getByRole('heading', {name: 'Structured sourcing brief'})).toBeVisible();
  await expect(page.getByText('Demonstration fixture', {exact: true})).toBeVisible();
  await expect(page.getByText(/Nothing here is live yet\./)).toBeAttached();
  const approveBrief = page.getByRole('button', {name: 'Approve brief'});
  await expect(approveBrief).toBeEnabled();
  await approveBrief.click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByText(/^Brief approved · Fixture activity/)).toBeVisible();

  await page.getByRole('button', {name: 'Start fixture replay'}).click();
  await expect(page.getByText('Fixture replay loaded')).toBeVisible();
  await page.locator('.stage-tabs').getByRole('link', {name: 'Makers'}).click();
  await page.getByRole('button', {name: 'Open Atlas Clay Studio'}).click();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
  await page.getByRole('button', {name: 'Evidence'}).first().click();
  await expect(page.getByRole('heading', {name: /Controlled French reply/})).toBeVisible();
  await page.getByRole('button', {name: 'Close evidence'}).click();
  await page.getByRole('button', {name: 'Close drawer'}).click();

  await page.locator('.stage-tabs').getByRole('link', {name: 'Outreach'}).click();
  await page.getByRole('button', {name: 'Review controlled draft'}).click();
  await expect(page.getByText('controlled-demo-recipient@redacted.invalid')).toBeVisible();
  await page.getByRole('button', {name: 'french'}).click();
  await expect(page.getByText('Bonjour,', {exact: false})).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Approve controlled draft'}).click();
  await expect(page.getByRole('button', {name: 'Approved in fixture'})).toBeVisible();
  await page.getByRole('button', {name: 'Close drawer'}).click();

  await page.locator('.stage-tabs').getByRole('link', {name: 'Compare'}).click();
  await expect(page.getByRole('heading', {name: 'Deterministic comparison'})).toBeVisible();
  await page.locator('input[type="range"]').fill('45');
  await expect(page.getByText('45%', {exact: true})).toBeVisible();

  await page.locator('.stage-tabs').getByRole('link', {name: 'Passport'}).click();
  await expect(
    page.getByText('Demonstration profile — not a real supplier endorsement.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
});
