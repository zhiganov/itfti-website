import { el, link } from './dom.js';
import { httpsUrl, provenanceLabel, stateLabel, flaggedState } from './profile.js';

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
      el('p', { className: 'hint reports-note' }, 'Report bases are declared by the author; see each report for its review.'),
      el('ul', { className: 'reports' }, reports.map(reportView)),
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

function reportView(report) {
  const flagged = flaggedState(report.state);
  const status = report.statusUrl && link(httpsUrl(report.statusUrl), 'Check report status', { className: 'report-status' });
  return el('li', { className: flagged ? `report-flagged report-${report.state}` : undefined },
    flagged && el('p', { className: 'report-flag' }, report.state === 'withdrawn' ? 'Withdrawn' : 'Corrected'),
    flagged && status,
    link(httpsUrl(report.url), report.title || report.id, { className: 'report-title' }),
    el('p', { className: 'report-context' },
      `${provenanceLabel(report.provenance)} · ${stateLabel(report.state)} · revision ${report.revision}`,
    ),
    report.period && el('p', { className: 'hint' }, report.period),
    !flagged && status,
  );
}
