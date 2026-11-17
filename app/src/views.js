import { el, link } from './dom.js';
import { httpsUrl } from './profile.js';

export function identityView(did, identity, warning = '') {
  return el('section', { className: 'identity', 'aria-label': 'Bluesky identity' },
    identity?.avatar && el('img', {
      className: 'avatar', src: identity.avatar, alt: '', width: 88, height: 88,
      referrerpolicy: 'no-referrer',
      onError: (event) => { event.currentTarget.hidden = true; },
    }),
    el('div', {},
      el('h2', { className: 'person-name' }, identity?.displayName || identity?.handle || 'ATProto account'),
      link(`https://bsky.app/profile/${encodeURIComponent(did)}`, identity?.handle ? `@${identity.handle}` : 'View on Bluesky'),
      identity?.description && el('p', { className: 'bio' }, identity.description),
      warning && el('p', { className: 'hint' }, warning),
    ),
  );
}

export function recordView(record) {
  const reports = record.reports || [];
  return el('div', { className: 'record' },
    el('section', { className: 'work-section' },
      el('h2', {}, 'What I’m working on'),
      el('p', { className: 'work-summary' }, record.summary),
      record.areas?.length && el('ul', { className: 'areas', 'aria-label': 'Areas of work' },
        record.areas.map((area) => el('li', {}, area))),
    ),
    reports.length > 0 && el('section', { className: 'work-section' },
      el('h2', {}, 'Reports & learning'),
      el('ul', { className: 'reports' }, reports.map((report) =>
        el('li', {},
          link(httpsUrl(report.url), report.title || report.id, { className: 'report-title' }),
          el('p', { className: 'report-context' },
            `${report.provenance.replaceAll('-', ' ')} · ${report.state.replaceAll('-', ' ')} · revision ${report.revision}`,
          ),
          report.period && el('p', { className: 'hint' }, report.period),
          report.statusUrl && link(httpsUrl(report.statusUrl), 'Check report status'),
        ),
      )),
    ),
    (record.supportProfile || record.badge) && el('section', { className: 'work-section' },
      el('h2', {}, 'Support & further detail'),
      el('ul', { className: 'plain-links' },
        record.supportProfile && el('li', {}, link(httpsUrl(record.supportProfile), 'Read my support profile')),
        record.badge && el('li', {}, link(httpsUrl(record.badge), 'View my impact card')),
      ),
    ),
  );
}
