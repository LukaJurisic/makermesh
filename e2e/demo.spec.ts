import {expect, test} from '@playwright/test';

test('judge can inspect the complete espresso-cup story', async ({page}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {name: 'Find a workshop for your café’s next cups.'}),
  ).toBeVisible();
  await page.getByRole('link', {name: 'See a café order', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Will this order work for you?'})).toBeVisible();
  await page.goto('/projects/harbour-coffee-lab/brief');

  await expect(page.getByRole('heading', {name: 'Your sourcing brief'})).toBeVisible();
  await expect(page.getByText('Example order · fictional workshops · Example data')).toBeVisible();
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
    .getByRole('link', {name: 'Workshops'})
    .click();
  await page.getByRole('button', {name: 'Open Atlas Clay Studio'}).click();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
  await page.getByRole('button', {name: 'View source'}).first().click();
  await expect(page.getByRole('heading', {name: /Controlled French reply/})).toBeVisible();
  await page.getByRole('button', {name: 'Close source'}).click();
  await page.getByRole('button', {name: 'Close drawer'}).click();

  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Messages'})
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
    .getByRole('link', {name: 'Quote'})
    .click();
  await expect(page.getByRole('heading', {name: 'Will this order work for you?'})).toBeVisible();
  await page.locator('input[type="range"]').fill('45');
  await expect(page.getByText('45%', {exact: true})).toBeVisible();

  await page
    .getByRole('navigation', {name: 'Project stages'})
    .getByRole('link', {name: 'Profile'})
    .click();
  await expect(
    page.getByText('Demonstration profile — not a real supplier endorsement.'),
  ).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Atlas Clay Studio'})).toBeVisible();
});
