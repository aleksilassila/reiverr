//@ts-check
import { expect, test } from '@playwright/test';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('../package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

test.describe('UI Tests', () => {
	test('Home page', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Home')).toBeVisible();
		await page.getByText('Home').click();
		await test.step('Check top bar links exist', async () => {
			await expect(page.getByRole('link', {name: 'Reiverr', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Reiverr', exact: true})).toHaveAttribute('href', '/')
			await expect(page.getByRole('link', {name: 'Home', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Home', exact: true})).toHaveAttribute('href', '/')
			await expect(page.getByRole('link', {name: 'Library', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Library', exact: true})).toHaveAttribute('href', '/library')
			await expect(page.getByRole('link', {name: 'Sources', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Sources', exact: true})).toHaveAttribute('href', '/sources')
			await expect(page.getByRole('link', {name: 'Settings', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Settings', exact: true})).toHaveAttribute('href', '/settings')
		});

		await test.step('Check Carousel sections exist', async () => {
			await expect(page.getByText('Popular People', {exact: true})).toBeVisible();
			await expect(page.getByText('Upcoming Movies', {exact: true})).toBeVisible();
			await expect(page.getByText('Upcoming Series', {exact: true})).toBeVisible();
			await expect(page.getByText('Genres', {exact: true})).toBeVisible();
			await expect(page.getByText('New Digital Releases', {exact: true})).toBeVisible();
			await expect(page.getByText('Streaming Now', {exact: true})).toBeVisible();
			await expect(page.getByText('TV Networks', {exact: true})).toBeVisible();
		});
	});

	test('Library', async ({ page }) => {
		await page.goto('/library');
		await expect(page.getByText('Latest Addition')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Available', exact: true})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Watched', exact: true})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Unavailable', exact: true})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Play', exact: true})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Details', exact: true})).toBeVisible();
	});

	test('Sources', async ({ page }) => {
		await page.goto('/sources');
		await expect(page.getByText('Movies Provider')).toBeVisible();
		await expect(page.getByText('Radarr')).toBeVisible();
		await expect(page.getByText('Shows Provider')).toBeVisible();
		await expect(page.getByText('Sonarr')).toBeVisible();
	});

	test('Settings', async ({ page }) => {
		await page.goto('/settings');

		await test.step('Check top bar links exist', async () => {
			await expect(page.getByRole('link', {name: 'Reiverr', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Reiverr', exact: true})).toHaveAttribute('href', '/')
			await expect(page.getByRole('link', {name: 'Home', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Home', exact: true})).toHaveAttribute('href', '/')
			await expect(page.getByRole('link', {name: 'Library', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Library', exact: true})).toHaveAttribute('href', '/library')
			await expect(page.getByRole('link', {name: 'Sources', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Sources', exact: true})).toHaveAttribute('href', '/sources')
			await expect(page.getByRole('link', {name: 'Settings', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Settings', exact: true})).toHaveAttribute('href', '/settings')
		});

		await test.step('Check side buttons exist', async () => {
			await expect(page.getByRole('button', {name: 'General', exact: true})).toBeVisible();
			await expect(page.getByRole('button', {name: 'Integrations', exact: true})).toBeVisible();
		});

		await test.step('Check bottom bar links exist', async () => {
			await expect(page.getByText(pkg.version)).toBeVisible();
			await expect(page.getByRole('link', {name: 'Changelog', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'Changelog', exact: true})).toHaveAttribute('href', 'https://github.com/aleksilassila/reiverr/releases');
			await expect(page.getByRole('link', {name: 'GitHub', exact: true})).toBeVisible();
			await expect(page.getByRole('link', {name: 'GitHub', exact: true})).toHaveAttribute('href', 'https://github.com/aleksilassila/reiverr');
		});
		await test.step('Check User Interface section', async () => {
			await expect(page.getByRole('heading', {name: 'User Interface'})).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Language', exact: true })).toBeVisible();
			await expect(page.getByRole('combobox').first()).toBeVisible();
			await expect(page.getByRole('button', {name: 'Save Changes'})).toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('en')
			await expect(page.getByRole('button', {name: 'Save Changes'})).toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('de')
			await expect(page.getByRole('button', {name: 'Save Changes'})).not.toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('es')
			await expect(page.getByRole('button', {name: 'Save Changes'})).not.toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('fr')
			await expect(page.getByRole('button', {name: 'Save Changes'})).not.toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('it')
			await expect(page.getByRole('button', {name: 'Save Changes'})).not.toHaveClass(/cursor-not-allowed/);
			await page.getByRole('combobox').first().click()
			await page.getByRole('combobox').first().selectOption('en')
			await expect(page.getByRole('button', {name: 'Save Changes'})).toHaveClass(/cursor-not-allowed/);
			await expect(page.locator('.w-11').first()).toBeEnabled();
			await expect(page.getByRole('spinbutton')).toHaveValue('150')
		});

		await test.step('Check Discovery section', async () => {
			await expect(page.getByRole('heading', {name: 'Discovery', exact: true})).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Region', exact: true })).toBeVisible();
			await expect(page.getByRole('combobox').nth(1)).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Exclude library items from Discovery', exact: true })).toBeVisible();
			await expect(page.locator('.w-11').nth(1)).toBeEnabled();
			await expect(page.getByText('Filter results based on spoken language. Takes ISO 639-1 language codes separated with commas. Leave empty to disable.')).toBeVisible();
			await expect(page.getByPlaceholder('en,fr,de')).toBeVisible();
		});
	});
});
