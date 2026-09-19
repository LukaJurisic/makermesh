import {expect, test} from '@playwright/test';

test('a buyer can save a draft without replacing it with the example', async ({page}) => {
  await page.goto('/compose');
  await page.getByLabel('Your production request').fill('Make 320 custom plates for a café.');
  await page.getByLabel('Quantity', {exact: true}).fill('320 plates');
  await page.getByRole('button', {name: 'Save draft'}).click();
  await expect(page.getByRole('status')).toHaveText('Draft saved on this device.');
  await page.reload();
  await expect(page.getByLabel('Your production request')).toHaveValue(
    'Make 320 custom plates for a café.',
  );
  await expect(page.getByLabel('Quantity', {exact: true})).toHaveValue('320 plates');
  await page.getByRole('link', {name: 'Open example project'}).click();
  await expect(page.getByRole('heading', {name: 'Your sourcing brief'})).toBeVisible();
  await page.goto('/compose');
  await expect(page.getByLabel('Your production request')).toHaveValue(
    'Make 320 custom plates for a café.',
  );
});

test('maker search and filters narrow the directory and can be cleared', async ({page}) => {
  await page.goto('/projects/harbour-coffee-lab/makers');
  await page.getByLabel('Search makers').fill('No matching maker here');
  await expect(page.getByText('No makers match yet.')).toBeVisible();
  await page.getByRole('button', {name: 'Clear filters'}).click();
  await page.getByLabel('Quote availability').selectOption('awaiting');
  await expect(page.getByText('Quote needed').first()).toBeVisible();
  await page.getByLabel('Quote availability').selectOption('all');
  await page.getByLabel('Search makers').fill('Atlas');
  await expect(
    page.getByRole('button', {name: 'Open Atlas Clay Studio', exact: true}),
  ).toBeVisible();
  await page.getByRole('button', {name: 'Open Atlas Clay Studio', exact: true}).click();
  await page.getByRole('tab', {name: 'Quote & terms'}).click();
  await expect(page.getByText('72 MAD', {exact: true}).last()).toBeVisible();
});
