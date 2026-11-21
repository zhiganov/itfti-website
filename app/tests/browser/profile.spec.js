import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const DID = 'did:plc:abcdefghijklmnopqrstuvwx';
const path = `/profile/${encodeURIComponent(DID)}`;
const initial = {
  $type: 'org.itfti.profile', summary: 'I help a fictional repair group make its guides easier to use.',
  areas: ['Repair & reuse', 'Public-interest technology'],
  reports: [{ id: 'learning', title: 'What we learned from revising the guide', url: 'https://example.org/report', revision: 'v1', provenance: 'self-report', state: 'current' }],
  createdAt: '2026-11-16T12:00:00.000Z',
};

async function fixture(page, { published = true, signedIn = true, failSave = false, failRead = false, sdkLifecycle = false, reports } = {}) {
  let record = published ? { ...structuredClone(initial), ...(reports ? { reports } : {}) } : null;
  let writes = 0;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', async (route) => {
    const url = route.request().url();
    let data;
    let status = 200;
    if (url.startsWith('https://plc.directory/')) data = {
      id: DID, alsoKnownAs: ['at://fictional.example.org'],
      service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example.org' }],
    };
    else if (url.includes('getProfile')) data = {
      did: DID, displayName: 'Alex Example', handle: 'fictional.example.org',
      description: 'Fictional person used only for interface tests.',
    };
    else if (url.includes('resolveHandle')) data = { did: DID };
    else if (url.includes('getRecord')) {
      if (failRead) { data = { error: 'InternalError' }; status = 500; }
      else if (!record) { data = { error: 'RecordNotFound' }; status = 400; }
      else data = { uri: `at://${DID}/org.itfti.profile/self`, cid: 'fixture-cid', value: record };
    } else return route.abort();
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  const sessionSource = `let active = ${signedIn};
    const session = {
      sub: ${JSON.stringify(DID)},
      async fetchHandler(path, options) {
        return fetch('/__test__/write?method=' + path.split('.').pop(), options);
      },
      async signOut() {}
    };`;
  await page.route('**/src/auth.js', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: sdkLifecycle ? `
    import { createAuth } from '/src/auth.js?callback-lifecycle-fixture';
    ${sessionSource}
    class BrowserOAuthClient {
      constructor(options) { this.options = options; }
      static async load(options) { return new BrowserOAuthClient(options); }
      async init() {
        this.options.onSessionDeleted(session.sub);
        this.options.onSessionUpdated?.(session.sub, {});
        return { session };
      }
    }
    export const auth = createAuth({
      loadSdk: async () => ({ BrowserOAuthClient }),
    });` : `${sessionSource}
    export const auth = {
      async init() { return active ? session : null; },
      async signIn() { throw new Error('Synthetic test: no live OAuth'); },
      async signOut() { active = false; },
      onDeleted() { return () => {}; }
    };`,
  }));
  await page.route('**/__test__/write?*', async (route) => {
    writes++;
    if (failSave) return route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"InvalidSwap"}' });
    const body = route.request().postDataJSON();
    expect(body.repo).toBe(DID);
    expect(body.collection).toBe('org.itfti.profile');
    expect(body.rkey).toBe('self');
    const deleting = route.request().url().endsWith('deleteRecord');
    record = deleting ? null : body.record;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(deleting ? {} : {
      uri: `at://${DID}/org.itfti.profile/self`, cid: 'fixture-cid',
    }) });
  });
  return { writes: () => writes, errors, record: () => record };
}

test('successful callback cleanup reaches the editor through the real auth wrapper', async ({ page }) => {
  const state = await fixture(page, { published: false, sdkLifecycle: true });
  await page.goto('/oauth/callback#state=synthetic-state&code=synthetic-code');
  await expect(page.getByLabel('What are you working on?', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/edit$/);
  expect(state.writes()).toBe(0);
  expect(state.errors).toEqual([]);
});

test('anonymous public viewing, refresh, missing record and safe text', async ({ page }) => {
  const state = await fixture(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Alex Example' })).toBeVisible();
  await expect(page.getByText(initial.summary)).toBeVisible();
  await expect(page.getByRole('link', { name: '@fictional.example.org' })).toHaveAttribute('href', `https://bsky.app/profile/${encodeURIComponent(DID)}`);
  await page.getByRole('button', { name: 'Refresh from source' }).click();
  await expect(page.getByText(initial.summary)).toBeVisible();
  expect(state.writes()).toBe(0);
  expect(state.errors).toEqual([]);
});

test('report labels, withdrawn and corrected reports, and the self-declared note', async ({ page }) => {
  const state = await fixture(page, { reports: [
    { id: 'current', title: 'Current fictional report', url: 'https://example.org/current', revision: 'v2', provenance: 'independent-evaluation', state: 'current' },
    { id: 'withdrawn', title: 'Withdrawn fictional report', url: 'https://example.org/withdrawn', revision: 'v1', provenance: 'ai-assisted', state: 'withdrawn', statusUrl: 'https://example.org/withdrawn/status' },
    { id: 'corrected', title: 'Corrected fictional report', url: 'https://example.org/corrected', revision: 'v3', provenance: 'peer-review', state: 'corrected' },
  ] });
  await page.goto(path);
  await expect(page.getByText('Report bases are declared by the author; see each report for its review.')).toBeVisible();
  const items = page.locator('.reports > li');
  await expect(items.nth(0)).toContainText('independently evaluated · current · revision v2');
  await expect(items.nth(0).locator('.report-flag')).toHaveCount(0);
  const withdrawn = items.nth(1);
  await expect(withdrawn.locator('.report-flag')).toHaveText('Withdrawn');
  await expect(withdrawn).toContainText('AI-assisted · withdrawn · revision v1');
  const links = withdrawn.getByRole('link');
  await expect(links.nth(0)).toHaveText('Check report status');
  await expect(links.nth(0)).toHaveAttribute('href', 'https://example.org/withdrawn/status');
  await expect(links.nth(1)).toHaveText('Withdrawn fictional report');
  await expect(items.nth(2).locator('.report-flag')).toHaveText('Corrected');
  await expect(items.nth(2)).toContainText('peer-reviewed · corrected · revision v3');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/report-states.png', fullPage: true });
  expect(state.errors).toEqual([]);
});

test('publish requires review and explicit approval; edits, source read-back and unpublish work', async ({ page }) => {
  const state = await fixture(page, { published: false });
  await page.goto('/edit');
  await page.getByLabel('What are you working on?').fill('I maintain a fictional guide. <script>alert("example")</script>');
  await page.getByRole('button', { name: 'Review before publishing' }).click();
  const publish = page.getByRole('button', { name: 'Publish my impact profile', exact: true });
  await expect(publish).toBeDisabled();
  expect(state.writes()).toBe(0);
  await expect(page.getByText('I maintain a fictional guide. <script>alert("example")</script>', { exact: true })).toBeVisible();
  await page.getByLabel('I approve this impact content for anyone to read.').check();
  await publish.click();
  await expect(page.getByRole('status')).toContainText('Published and read back');
  expect(state.writes()).toBe(1);
  await page.getByLabel('What are you working on?').fill('An updated fictional account.');
  await page.getByRole('button', { name: 'Review before publishing' }).click();
  await page.getByLabel('I approve this impact content for anyone to read.').check();
  await page.getByRole('button', { name: 'Publish these changes' }).click();
  await expect(page.getByRole('status')).toContainText('Published and read back');
  expect(state.record().createdAt).toBeTruthy();
  await page.getByRole('button', { name: 'Unpublish…', exact: true }).click();
  expect(state.writes()).toBe(2);
  await page.getByRole('button', { name: 'Delete my impact record' }).click();
  await expect(page.getByRole('status')).toContainText('unpublished');
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'No published impact profile' })).toBeVisible();
  expect(state.writes()).toBe(3);
  expect(state.errors).toEqual([]);
});

test('failed initial reads cannot become an empty-record overwrite', async ({ page }) => {
  const state = await fixture(page, { failRead: true });
  await page.goto('/edit');
  await expect(page.getByRole('heading', { name: 'Your record could not be loaded' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review before publishing' })).toHaveCount(0);
  expect(state.writes()).toBe(0);
});

test('conflicts lock the editor without replaying a write', async ({ page }) => {
  const state = await fixture(page, { failSave: true });
  await page.goto('/edit');
  await page.getByLabel('What are you working on?').fill('A fictional concurrent edit.');
  await page.getByRole('button', { name: 'Review before publishing' }).click();
  await page.getByLabel('I approve this impact content for anyone to read.').check();
  await page.getByRole('button', { name: 'Publish these changes' }).click();
  await expect(page.getByRole('alert')).toContainText('changed elsewhere');
  await expect(page.getByRole('button', { name: 'Reload the source record' })).toBeVisible();
  expect(state.writes()).toBe(1);
});

test('reports preserve contract metadata, unsafe links are rejected, and sign-out clears the editor', async ({ page }) => {
  const state = await fixture(page, { published: false });
  await page.goto('/edit');
  await page.getByLabel('What are you working on?').fill('Fictional work.');
  await page.getByRole('button', { name: 'Add a report link' }).click();
  await page.getByLabel('Report title (optional)').fill('A fictional learning report');
  await page.getByLabel('Public report URL').fill('https://example.org/learning');
  await page.getByLabel('Report ID', { exact: true }).fill('learning');
  await page.getByLabel('Revision', { exact: true }).fill('v1');
  await page.getByLabel('Report basis').selectOption('ai-assisted');
  await page.getByRole('button', { name: 'Review before publishing' }).click();
  await expect(page.getByText('AI-assisted · current · revision v1')).toBeVisible();
  await page.getByRole('button', { name: 'Back to editing' }).click();
  await page.getByLabel('Support-profile URL (optional)').fill('http://example.org/private');
  await page.getByRole('button', { name: 'Review before publishing' }).click();
  await expect(page.getByRole('alert')).toContainText('HTTPS');
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue with Bluesky / ATProto' })).toBeVisible();
  await expect(page.getByLabel('What are you working on?')).toHaveCount(0);
  expect(state.writes()).toBe(0);
});

test('official SDK initializes a signed-out loopback session without live account access', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/edit');
  await expect(page.getByRole('button', { name: 'Continue with Bluesky / ATProto' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('desktop and mobile render the editor, review and public profile without overflow', async ({ page }) => {
  const state = await fixture(page);
  const directory = process.env.ITF_SCREENSHOTS;
  if (directory) await mkdir(directory, { recursive: true });
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/edit');
    await expect(page.getByLabel('What are you working on?')).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Code of Conduct', exact: true })).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'App licence', exact: true })).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'This site is powered by Netlify', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (directory) await page.screenshot({ path: `${directory}/editor-${name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Review before publishing' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Review your public profile' })).toBeVisible();
    if (directory) await page.screenshot({ path: `${directory}/review-${name}.png`, fullPage: true });
    page.once('dialog', (dialog) => dialog.accept());
    await page.goto(path);
    await expect(page.getByText(initial.summary)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (directory) await page.screenshot({ path: `${directory}/profile-${name}.png`, fullPage: true });
  }
  expect(state.errors).toEqual([]);
  expect(state.writes()).toBe(0);
});

test('policy links and distributed app licence are available without signing in', async ({ page, request }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/privacy');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Code of Conduct', exact: true })).toHaveAttribute('href', 'https://github.com/zhiganov/itfti-website/blob/main/app/CODE_OF_CONDUCT.md');
  await expect(footer.getByRole('link', { name: 'App licence', exact: true })).toHaveAttribute('target', '_blank');
  await expect(footer.getByRole('link', { name: 'This site is powered by Netlify', exact: true })).toHaveAttribute('href', 'https://www.netlify.com/');
  const response = await request.get('/licenses/itfti-profile-app.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(await response.text()).toContain('MIT License');
  expect(await response.text()).toContain('It does not relicense profile records');
});

test('history cancellation preserves the draft, and cancel-unpublish keeps intervening edits', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Your profile', exact: true }).click();
  const summary = page.getByLabel('What are you working on?');
  await summary.fill('An unsaved fictional draft.');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(summary).toHaveValue('An unsaved fictional draft.');
  await expect(page).toHaveURL(/\/edit$/);
  await page.getByRole('button', { name: 'Unpublish…', exact: true }).click();
  await page.getByLabel('What are you working on?').fill('Edited while deciding to keep it published.');
  await page.getByRole('button', { name: 'Keep it published' }).click();
  await expect(page.getByLabel('What are you working on?')).toHaveValue('Edited while deciding to keep it published.');
  expect(state.writes()).toBe(0);
});

test('a stale account lookup cannot replace a newer page', async ({ page }) => {
  await fixture(page);
  let completeLookup;
  const deferred = new Promise((resolve) => { completeLookup = resolve; });
  await page.route('**/xrpc/com.atproto.identity.resolveHandle?*', async (route) => {
    await deferred;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ did: DID }) });
  });
  await page.goto('/');
  await page.getByLabel('Bluesky handle or DID').fill('fictional.example.org');
  // Retain the initiating button even after its page is detached. Its finally
  // handler re-enables it only after resolution and the route decision finish.
  const initiatingButton = await page.getByRole('button', { name: 'Open profile', exact: true }).elementHandle();
  await page.getByRole('button', { name: 'Open profile', exact: true }).click();
  await page.getByRole('link', { name: 'Privacy & publication' }).click();
  completeLookup();
  await expect.poll(() => initiatingButton.evaluate((button) => button.disabled)).toBe(false);
  await expect(page.getByRole('heading', { name: 'Privacy & publication', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/privacy$/);
});
