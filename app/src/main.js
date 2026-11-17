import '@fontsource/zilla-slab/500.css';
import '@fontsource/zilla-slab/700.css';
import '@fontsource/libre-franklin/400.css';
import '@fontsource/libre-franklin/600.css';
import './styles.css';
import { auth } from './auth.js';
import { createApi } from './api.js';
import { APP_ORIGIN } from './config.js';
import { makeRecord, profilePath, recordUri, validDid, graphemes, recordsEqual, PROVENANCE, REPORT_STATES } from './profile.js';
import { el, link, field, notice } from './dom.js';
import { identityView, recordView } from './views.js';
import { suppressedDids } from './moderation.js';

const api = createApi();
const root = document.querySelector('#app');
let routeVersion = 0;
let session = null;
let dirty = false;
let writing = false;
let currentMain;
let activeUrl = window.location.pathname + window.location.search + window.location.hash;

function navigate(path, { replace = false } = {}) {
  if (writing) return;
  if (dirty && !window.confirm('Leave without saving your draft?')) return;
  dirty = false;
  history[replace ? 'replaceState' : 'pushState'](null, '', path);
  render();
}

function shell() {
  root.replaceChildren(
    el('a', { href: '#main', className: 'skip-link' }, 'Skip to content'),
    el('header', { className: 'site-header' },
      link('/', [el('img', { src: '/itfti-seal.svg', alt: '', width: 42, height: 42 }), 'ItFtI'], {
        className: 'brand', 'aria-label': 'ItFtI impact profiles home',
      }),
      el('nav', { 'aria-label': 'Main navigation' },
        link('/edit', 'Your profile'), link('https://itfti.org', 'About ItFtI'),
      ),
    ),
    currentMain = el('main', { id: 'main', tabindex: '-1' }),
    el('footer', { className: 'site-footer' },
      el('p', {}, 'Your account holds the record. You decide what to share.'),
      el('div', { className: 'footer-links' }, link('/privacy', 'Privacy & publication'),
        link('mailto:hello@citizeninfra.org', 'Report a problem')),
    ),
  );
  return currentMain;
}

function home(main, version) {
  document.title = 'Your impact profile — ItFtI';
  main.append(el('div', { className: 'intro-layout' },
    el('section', { className: 'intro' },
      el('h1', {}, 'Your work.', el('br'), 'In your own account.'),
      el('p', { className: 'lede' }, 'A public place to explain what you work on, what you’re learning, and what would help it continue.'),
      link('/edit', 'Create or edit your profile', { className: 'button' }),
      el('p', { className: 'hint' }, 'Use your existing Bluesky / ATProto account.'),
    ),
    el('section', { className: 'reading-column' },
      el('h2', {}, 'A profile you can take with you'),
      el('p', {}, 'Your name, photo and bio come from Bluesky. Your impact summary and public links are saved as a separate record in your own personal data server.'),
      el('p', {}, 'Preview everything before publishing. You can edit or unpublish your impact record here. Your Bluesky profile stays unchanged.'),
      el('p', {}, 'ItFtI presents the author’s account of their work. It does not certify impact.'),
    ),
  ));
  const input = field('Bluesky handle or DID', 'lookup', '', {
    required: true, placeholder: 'name.bsky.social', autocomplete: 'off', spellcheck: 'false',
    autocapitalize: 'none', maxlength: '2048',
  });
  const result = el('div', { 'aria-live': 'polite' });
  const button = el('button', { type: 'submit', className: 'button secondary' }, 'Open profile');
  const form = el('form', { className: 'lookup', onSubmit: async (event) => {
    event.preventDefault();
    button.disabled = true;
    result.replaceChildren(notice('Finding the account…'));
    try {
      const did = await api.resolveDid(new FormData(form).get('lookup'));
      if (version !== routeVersion) return;
      navigate(profilePath(did));
    } catch (error) {
      result.replaceChildren(notice(error.message, true));
    } finally { button.disabled = false; }
  } }, input, button);
  main.append(el('section', { className: 'lookup-section' },
    el('h2', {}, 'Looking for someone’s profile?'), form, result,
  ));
}

async function publicProfile(main, did, version) {
  document.title = 'Impact profile — ItFtI';
  if (!validDid(did)) {
    main.append(el('h1', {}, 'This profile address is incomplete'), el('p', {}, 'Open a profile using its Bluesky handle or DID.'), link('/', 'Find a profile'));
    return;
  }
  if (suppressedDids.has(did)) {
    main.append(el('h1', {}, 'This profile is unavailable on ItFtI'), link('/privacy', 'About host-level takedowns'));
    return;
  }
  main.append(notice('Reading the profile from its owner’s account…'));
  const [recordResult, identityResult] = await Promise.allSettled([api.readRecord(did), api.readIdentity(did)]);
  if (version !== routeVersion) return;
  main.replaceChildren();
  if (recordResult.status === 'rejected') {
    main.append(el('h1', {}, 'The profile could not be loaded'),
      notice(recordResult.reason.message, true),
      el('button', { className: 'button secondary', onClick: () => render() }, 'Try loading again'));
    return;
  }
  const { record, source } = recordResult.value;
  if (!record) {
    main.append(el('h1', {}, 'No published impact profile'),
      el('p', {}, 'This account has no ItFtI profile record. It may not have been published, or its owner may have removed it.'),
      link(`https://bsky.app/profile/${encodeURIComponent(did)}`, 'View the account on Bluesky'),
      link('/', 'Find another profile', { className: 'next-link' }));
    return;
  }
  const identity = identityResult.status === 'fulfilled' ? identityResult.value : null;
  document.title = `${identity?.displayName || identity?.handle || 'ATProto account'} — impact profile`;
  main.append(el('h1', { className: 'profile-heading' }, 'Impact profile'),
    identityView(did, identity, identity ? '' : 'Bluesky details could not be loaded.'),
    recordView(record),
    el('section', { className: 'record-source' },
      el('h2', {}, 'About this record'),
      el('p', {}, 'Published by this account. Claims and linked reports belong to their authors; ItFtI does not certify them.'),
      el('p', {}, `Updated ${new Date(record.updatedAt || record.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}.`),
      link(source, 'Read the source record'),
      el('p', { className: 'record-uri' }, recordUri(did)),
      el('button', { className: 'text-button', onClick: () => render() }, 'Refresh from source'),
    ));
}

function loginView(main, message = '') {
  document.title = 'Sign in — ItFtI';
  main.replaceChildren(el('h1', {}, 'Your impact profile'),
    el('p', { className: 'lede' }, 'Sign in with the account that will hold your record.'),
    el('p', {}, 'You’ll approve access on your account provider’s own page. ItFtI never asks for your password.'),
  );
  const status = el('div', { 'aria-live': 'polite' });
  if (message) status.append(notice(message, true));
  const button = el('button', { type: 'submit', className: 'button' }, 'Continue with Bluesky / ATProto');
  const form = el('form', { className: 'sign-in', onSubmit: async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.replaceChildren(notice('Opening your account provider…'));
    try {
      await auth.signIn(new FormData(form).get('account'));
    } catch {
      status.replaceChildren(notice('Sign-in could not start. Check your handle and network connection, then try again. This address must also be configured for OAuth.', true));
      button.disabled = false;
    }
  } },
  field('Bluesky handle or ATProto DID', 'account', '', {
    placeholder: 'name.bsky.social', required: true, autocomplete: 'username', spellcheck: 'false',
    autocapitalize: 'none', maxlength: '2048',
  }), button);
  main.append(form, status,
    el('section', { className: 'explainer' },
      el('h2', {}, 'Only your impact record'),
      el('p', {}, 'The app asks to create, edit and delete its own profile record. Your Bluesky posts, follows, messages and profile are outside that permission.'),
      el('p', {}, 'Bluesky details are read publicly. Signing in alone publishes nothing.'),
      link('/privacy', 'Read about browser sessions and public records'),
    ));
}

function fieldsFrom(record) {
  return {
    summary: record?.summary || '', areas: (record?.areas || []).join('\n'),
    supportProfile: record?.supportProfile || '', badge: record?.badge || '',
    reports: structuredClone(record?.reports || []),
  };
}

async function editor(main, version) {
  document.title = 'Edit your impact profile — ItFtI';
  main.append(notice('Checking your sign-in…'));
  try { session = await auth.init(); } catch {
    if (version === routeVersion) loginView(main, 'Your sign-in could not be restored. Sign in again, or check that this host is configured for OAuth.');
    return;
  }
  if (version !== routeVersion) return;
  if (window.location.pathname === '/oauth/callback') {
    history.replaceState(null, '', '/edit');
    activeUrl = '/edit';
  }
  if (!session) { loginView(main); return; }
  const signedIn = session;
  let statusText = '';
  let statusError = false;
  if (!validDid(signedIn.sub)) { loginView(main, 'The signed-in account has no supported DID.'); return; }
  main.replaceChildren(notice('Loading your existing record before editing…'));
  const [recordResult, identityResult] = await Promise.allSettled([api.readRecord(signedIn.sub), api.readIdentity(signedIn.sub)]);
  if (version !== routeVersion || session !== signedIn) return;
  if (recordResult.status === 'rejected') {
    main.replaceChildren(el('h1', {}, 'Your record could not be loaded'),
      notice(recordResult.reason.message, true),
      el('p', {}, 'Editing stays off so a connection problem cannot overwrite an existing profile.'),
      el('button', { className: 'button', onClick: () => render() }, 'Load again'),
      signOutButton());
    return;
  }
  const loaded = recordResult.value;
  const identity = identityResult.status === 'fulfilled' ? identityResult.value : null;
  let fields = fieldsFrom(loaded.record);
  let mustReload = false;
  let candidate = null;
  let deleting = false;
  let form;

  function signOutButton() {
    return el('button', { className: 'text-button', disabled: writing, onClick: async () => {
      if (dirty && !window.confirm('Discard this draft and sign out?')) return;
      try {
        await auth.signOut(signedIn);
        session = null;
        dirty = false;
        navigate('/edit', { replace: true });
      } catch {
        statusText = 'Sign-out could not be confirmed. Close this tab or retry before using a shared device.';
        statusError = true;
        main.append(notice(statusText, true));
      }
    } }, 'Sign out');
  }

  function collect() {
    if (!form) return;
    const data = new FormData(form);
    fields = {
      summary: data.get('summary') || '', areas: data.get('areas') || '',
      supportProfile: data.get('supportProfile') || '', badge: data.get('badge') || '',
      reports: fields.reports.map((report, index) => {
        const result = { ...report };
        for (const name of ['id', 'title', 'url', 'revision', 'period', 'published', 'provenance', 'state', 'statusUrl']) {
          result[name] = data.get(`reports.${index}.${name}`) || '';
        }
        return result;
      }),
    };
  }

  async function perform(action) {
    if (writing || mustReload || session !== signedIn) return;
    writing = true;
    statusText = action === 'delete' ? 'Deleting your impact record…' : 'Saving your approved record…';
    statusError = false;
    draw();
    try {
      if (action === 'delete') await api.unpublish(signedIn, loaded.cid);
      else await api.publish(signedIn, candidate, loaded.cid);
      // A successful write alone does not prove anonymous public reads.
      const fresh = await api.readRecord(signedIn.sub);
      if (action === 'delete' ? fresh.record !== null : !recordsEqual(fresh.record, candidate)) {
        throw new Error('Read-back differs from the requested change.');
      }
      loaded.record = fresh.record;
      loaded.cid = fresh.cid;
      fields = fieldsFrom(fresh.record);
      candidate = null;
      deleting = false;
      dirty = false;
      statusText = action === 'delete'
        ? 'Your impact record is unpublished. Copies held elsewhere may remain.'
        : 'Published and read back from your account. Open your public page to see it signed out.';
    } catch (error) {
      mustReload = true;
      statusError = true;
      statusText = error.mustReload ? error.message : 'The change could not be verified. Reload the record before trying again.';
    } finally {
      writing = false;
      if (version === routeVersion && session === signedIn) draw();
    }
  }

  function reportEditor(report, index) {
    const prefix = `reports.${index}.`;
    return el('fieldset', { className: 'report-editor' },
      el('legend', {}, `Report ${index + 1}`),
      field('Report title (optional)', prefix + 'title', report.title, { maxlength: '1200' }),
      field('Public report URL', prefix + 'url', report.url, { type: 'url', required: true, maxlength: '2048' }),
      el('div', { className: 'field-pair' },
        field('Report ID', prefix + 'id', report.id, { required: true, maxlength: '128', help: 'A stable name, such as learning-2026.' }),
        field('Revision', prefix + 'revision', report.revision, { required: true, maxlength: '64', help: 'The exact version this link describes.' }),
      ),
      el('div', { className: 'field-pair' },
        field('Report basis', prefix + 'provenance', report.provenance || 'self-report', { options: PROVENANCE }),
        field('Report status', prefix + 'state', report.state || 'current', { options: REPORT_STATES }),
      ),
      el('p', { className: 'hint' }, 'Describe the report’s actual review basis. Linking it here adds no review or certification.'),
      el('details', {},
        el('summary', {}, 'Period, publication date and status link'),
        field('Period (optional)', prefix + 'period', report.period, { maxlength: '64' }),
        field('Publication timestamp (optional)', prefix + 'published', report.published, { placeholder: '2026-11-16T12:00:00Z' }),
        field('Status URL (optional)', prefix + 'statusUrl', report.statusUrl, { type: 'url', maxlength: '2048' }),
      ),
      el('button', { type: 'button', className: 'text-button', onClick: () => {
        collect(); fields.reports.splice(index, 1); candidate = null; dirty = true; draw();
      } }, `Remove report ${index + 1}`),
    );
  }

  function draw() {
    if (version !== routeVersion) return;
    const status = statusText && notice(statusText, statusError);
    const statusRegion = el('div', { className: 'editor-status', 'aria-live': 'polite' }, status);
    main.replaceChildren(
      el('div', { className: 'heading-row' }, el('h1', { tabindex: '-1' }, candidate ? 'Review your public profile' : 'Your impact profile'), signOutButton()),
      statusRegion,
    );
    if (mustReload) {
      main.append(el('button', { className: 'button', onClick: () => { dirty = false; render(); } }, 'Reload the source record'));
      return;
    }
    const aside = el('aside', { className: 'editor-context' },
      identityView(signedIn.sub, identity, identity ? '' : 'Bluesky details are temporarily unavailable.'),
      el('p', { className: 'hint' }, 'Name, photo and bio come from Bluesky. Edit them there.'),
      el('p', { className: 'account-did' }, signedIn.sub),
      el('section', { className: 'explainer' },
        el('h2', {}, 'You control the record'),
        el('p', {}, 'Your impact profile lives in your own ATProto account. Anyone can read it once you publish.'),
        el('p', {}, 'Keep private evidence and other people’s contact details out. A linked report stays on its existing website.'),
        loaded.record && link(profilePath(signedIn.sub), 'Open your public profile'),
      ),
    );
    const body = el('div', { className: 'editor-body' });
    main.append(el('div', { className: 'editor-layout' }, aside, body));
    if (candidate) {
      body.append(el('p', { className: 'review-note' }, 'This is a preview. Publishing will save the impact content below as a public record in your account.'),
        recordView(candidate),
        el('section', { className: 'publication-confirmation' },
          el('h2', {}, 'Ready to make this public?'),
          el('p', {}, 'Deleting the record later cannot recall copies already held by others.'),
          el('p', { className: 'record-uri' }, recordUri(signedIn.sub)),
        ));
      const confirmButton = el('button', {
        className: 'button', type: 'button', disabled: true,
        onClick: () => perform('publish'),
      }, loaded.record ? 'Publish these changes' : 'Publish my impact profile');
      const approval = el('input', { type: 'checkbox', disabled: writing, onChange: (event) => {
        confirmButton.disabled = !event.target.checked || writing;
      } });
      body.append(el('label', { className: 'checkbox-label' }, approval, 'I approve this impact content for anyone to read.'),
        el('div', { className: 'actions' }, confirmButton,
          el('button', { className: 'button secondary', disabled: writing, onClick: () => {
            candidate = null; draw(); main.querySelector('h1').focus();
          } }, 'Back to editing')));
      if (writing) body.querySelectorAll('button, input').forEach((control) => { control.disabled = true; });
      return;
    }
    const counter = el('p', { className: 'hint', id: 'summary-count', 'aria-live': 'polite' }, `${graphemes(fields.summary)} / 300 characters`);
    form = el('form', { onInput: () => { dirty = true; }, onSubmit: (event) => {
      event.preventDefault();
      collect();
      try {
        candidate = makeRecord(fields, loaded.record);
        deleting = false;
        statusText = ''; statusError = false; draw();
        main.querySelector('h1').focus();
      } catch (error) {
        statusText = error.message; statusError = true;
        statusRegion.replaceChildren(notice(statusText, true));
        statusRegion.querySelector('[role=alert]').focus();
      }
    } },
    el('fieldset', { disabled: writing },
      el('legend', { className: 'sr-only' }, 'Impact content'),
      field('What are you working on?', 'summary', fields.summary, {
        multiline: true, rows: '5', required: true, maxlength: '3000', 'aria-describedby': 'summary-help summary-count',
        help: 'Explain your actual work and role in a few sentences. Keep impact claims within their evidence.',
        onInput: (event) => { counter.textContent = `${graphemes(event.target.value)} / 300 characters`; },
      }), counter,
      field('Areas of work (optional)', 'areas', fields.areas, {
        multiline: true, rows: '3', help: 'One per line, up to 8. For example: public-interest technology.',
      }),
      el('section', { className: 'editor-section' },
        el('h2', {}, 'Reports & learning'),
        el('p', {}, 'Link only reports you have approved for public sharing.'),
        fields.reports.map(reportEditor),
        fields.reports.length < 10 && el('button', { type: 'button', className: 'button secondary small', onClick: () => {
          collect(); fields.reports.push({ provenance: 'self-report', state: 'current' });
          candidate = null; dirty = true; draw();
          document.getElementById(`reports-${fields.reports.length - 1}-title`)?.focus();
        } }, 'Add a report link'),
      ),
      el('section', { className: 'editor-section' },
        el('h2', {}, 'Support & further detail'),
        field('Support-profile URL (optional)', 'supportProfile', fields.supportProfile, {
          type: 'url', maxlength: '2048', help: 'Your public itf-manifest.json, if you have one.',
        }),
        field('Impact-card URL (optional)', 'badge', fields.badge, {
          type: 'url', maxlength: '2048', help: 'A public card or itf-badge.json. Adding a link does not certify its claims.',
        }),
      ),
      el('button', { type: 'submit', className: 'button' }, 'Review before publishing'),
      el('p', { className: 'hint' }, loaded.record ? 'Your published version stays unchanged until you approve the next one.' : 'This draft is kept in this tab only. Nothing is saved until you publish.'),
    ));
    body.append(form);
    if (loaded.record) {
      body.append(el('section', { className: 'unpublish-section' },
        el('h2', {}, 'Unpublish this profile'),
        el('p', {}, 'Delete your ItFtI profile record from your account. Your Bluesky profile and linked reports stay where they are.'),
        !deleting ? el('button', { className: 'text-button', disabled: writing, onClick: () => {
          collect(); deleting = true; draw();
        } }, 'Unpublish…') : el('div', {},
          el('p', {}, 'This removes the source record. Copies already held elsewhere may remain.'),
          el('div', { className: 'actions' },
            el('button', { className: 'button', disabled: writing, onClick: () => perform('delete') }, 'Delete my impact record'),
            el('button', { className: 'button secondary', disabled: writing, onClick: () => { collect(); deleting = false; draw(); } }, 'Keep it published'),
          )),
      ));
    }
  }
  draw();
}

function privacy(main) {
  document.title = 'Privacy & publication — ItFtI';
  main.append(el('article', { className: 'policy' },
    el('h1', {}, 'Privacy & publication'),
    el('p', { className: 'lede' }, 'Your impact record is public. Your sign-in stays in this browser.'),
    el('h2', {}, 'What is stored where'),
    el('p', {}, 'The profile record is stored in your ATProto account’s personal data server. ItFtI hosts the app files, not a central profile database. Draft text stays in this tab’s memory and is lost when you leave or reload.'),
    el('p', {}, 'The OAuth library stores session credentials and signing keys in this browser’s IndexedDB. Sign out when you finish on a shared device. Clearing site data also removes local credentials; your account provider controls server-side grants.'),
    el('h2', {}, 'Who receives requests'),
    el('p', {}, 'This browser contacts your personal data server, your account’s authorization provider, the PLC directory for did:plc identities, and did:web websites when needed. Bluesky’s public API resolves handles and provides public names, avatars and bios. These services see your IP address and requested account identifiers. Avatars load from their image host.'),
    el('p', {}, 'The hosting provider receives ordinary requests for the app files. ItFtI adds no analytics, advertising, tracking scripts or private-message access. Public profile responses are requested fresh rather than saved in application storage.'),
    el('h2', {}, 'What publication means'),
    el('p', {}, 'Preview and approve the impact content before it is written. OAuth permission does not itself publish a profile. The app never changes your Bluesky bio, posts or follows. Names and bios shown alongside your impact record reflect the account’s current public Bluesky profile.'),
    el('p', {}, 'Unpublishing deletes the ItFtI record from your PDS. Refreshing this app then reads its absence. Other services may already have copied the public record; deletion cannot recall those copies.'),
    el('h2', {}, 'Claims, corrections and takedowns'),
    el('p', {}, 'Profiles are accounts of work published by their authors. ItFtI does not certify impact or verify linked claims. Authors can correct their record or unpublish it.'),
    el('p', {}, 'For a privacy, abuse or takedown request, contact ', link('mailto:hello@citizeninfra.org', 'hello@citizeninfra.org'), ' with the profile URL. The host can suppress a profile on this app; only the account owner can change the source record. Avoid sending private evidence in an initial report.'),
    link('/', 'Back to impact profiles'),
  ));
}

function render() {
  const version = ++routeVersion;
  activeUrl = window.location.pathname + window.location.search + window.location.hash;
  const main = shell();
  const path = window.location.pathname;
  if (path === '/') home(main, version);
  else if (['/edit', '/oauth/callback'].includes(path)) editor(main, version);
  else if (path === '/privacy') privacy(main);
  else if (path.startsWith('/profile/')) {
    let did = '';
    try { did = decodeURIComponent(path.slice('/profile/'.length)); } catch { /* Show the invalid-address state. */ }
    publicProfile(main, did, version);
  } else main.append(el('h1', {}, 'Page not found'), link('/', 'Back to impact profiles'));
}

document.addEventListener('click', (event) => {
  const anchor = event.target.closest?.('a[href]');
  if (!anchor || anchor.target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const url = new URL(anchor.href);
  if (url.origin === location.origin && !url.hash && ['http:', 'https:'].includes(url.protocol)) {
    event.preventDefault();
    navigate(url.pathname + url.search);
  }
});
window.addEventListener('popstate', () => {
  if (writing || (dirty && !window.confirm('Leave without saving your draft?'))) {
    // Restore the address without destroying the draft's live DOM and closure.
    history.pushState(null, '', activeUrl);
    return;
  }
  dirty = false;
  render();
});
window.addEventListener('beforeunload', (event) => {
  if (dirty || writing) { event.preventDefault(); event.returnValue = ''; }
});
auth.onDeleted((did) => {
  if (session?.sub !== did) return;
  session = null;
  dirty = false;
  routeVersion++;
  loginView(currentMain, 'Your session expired or was revoked. Sign in again before editing.');
});
render();
