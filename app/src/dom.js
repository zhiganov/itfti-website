export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'className') node.className = value;
    else if (['value', 'checked', 'disabled', 'hidden'].includes(key)) node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child !== null && child !== undefined && child !== false) {
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }
  return node;
}

export const link = (href, text, props = {}) => el('a', {
  href, ...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {}), ...props,
}, text);

export function notice(text, error = false) {
  return el('p', { className: 'notice', role: error ? 'alert' : 'status', tabindex: '-1' }, text);
}

export function field(label, name, value = '', { help, multiline, options, ...props } = {}) {
  const id = name.replaceAll('.', '-');
  const control = options
    ? el('select', { id, name, ...props }, options.map((option) => el('option', {
      value: option, selected: option === value,
    }, option.replaceAll('-', ' '))))
    : el(multiline ? 'textarea' : 'input', { id, name, value, ...props });
  if (help) control.setAttribute('aria-describedby', [...new Set([...(props['aria-describedby'] || '').split(' ').filter(Boolean), `${id}-help`])].join(' '));
  return el('div', { className: 'field' },
    el('label', { for: id }, label), control,
    help && el('p', { id: `${id}-help`, className: 'hint' }, help),
  );
}
