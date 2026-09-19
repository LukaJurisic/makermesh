import {expect, test} from '@playwright/test';

test('judge can inspect the complete espresso-cup story', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'A market appears when you ask.'})).toBeVisible();
  await page.getByRole('link', {name: 'Open the espresso-cup demo'}).click();

  await expect(page.getByRole('heading', {name: 'Your sourcing brief'})).toBeVisible();
  await expect(page.getByText('Fictional makers · Example data')).toBeVisible();
  await page.getByRole('button', {name: 'About this demo', exact: true}).first().click();
  await expect(page.getByRole('heading', {name: 'About this demo'})).toBeVisible();
  await page.getByRole('button', {name: 'Close drawer'}).click();
  const approveBrief = page.getByRole('button', {name: 'Approve brief'});
  await expect(approveBrief).toBeEnabled();
  await approveBrief.click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByRole('heading', {name: 'Research & sources'})).toBeVisible();

  await page.getByRole('button', {name: 'Replay example research'}).click();
  await expect(page.getByText('Fixture replay loaded')).toBeVisible();
  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Makers'})
    .click();
  await page.getByRole('button', {name: 'Open Atlas Clay Studio'}).click();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
  await page.getByRole('button', {name: 'Evidence'}).first().click();
  await expect(page.getByRole('heading', {name: /Controlled French reply/})).toBeVisible();
  await page.getByRole('button', {name: 'Close evidence'}).click();
  await page.getByRole('button', {name: 'Close drawer'}).click();

  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Outreach'})
    .click();
  await page.getByRole('button', {name: 'Review controlled draft'}).click();
  await expect(page.getByText('controlled-demo-recipient@redacted.invalid')).toBeVisible();
  await page.getByRole('button', {name: 'french'}).click();
  await expect(page.getByText('Bonjour,', {exact: false})).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Approve controlled draft'}).click();
  await expect(page.getByRole('button', {name: 'Approved in fixture'})).toBeVisible();
  await page.getByRole('button', {name: 'Close drawer'}).click();

  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Compare'})
    .click();
  await expect(page.getByRole('heading', {name: 'Compare makers'})).toBeVisible();
  await page.locator('input[type="range"]').fill('45');
  await expect(page.getByText('45%', {exact: true})).toBeVisible();

  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Passport'})
    .click();
  await expect(
    page.getByText('Demonstration profile — not a real supplier endorsement.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
});
