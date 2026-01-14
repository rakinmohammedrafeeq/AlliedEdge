// Tiny smoke test for the feed endpoint + mapping assumptions.
// Run with: node scripts/smoke-feed.mjs

const base = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const url = `${base}/posts?page=0&size=20&sortBy=newest`;

const res = await fetch(url, { headers: { Accept: 'application/json' } });
const ct = res.headers.get('content-type') || '';
const text = await res.text();

console.log('URL:', url);
console.log('STATUS:', res.status);
console.log('CONTENT-TYPE:', ct);

let json;
try {
  json = JSON.parse(text);
} catch {
  console.log('BODY (first 800 chars):', text.slice(0, 800));
  process.exit(1);
}

const content = json?.postPage?.content ?? json?.content ?? (Array.isArray(json) ? json : null);
console.log('SHAPE_KEYS:', json && typeof json === 'object' ? Object.keys(json) : typeof json);
console.log('POST_COUNT:', Array.isArray(content) ? content.length : 'NOT_ARRAY');

if (Array.isArray(content) && content[0]) {
  const p = content[0];
  console.log('FIRST_POST_KEYS:', Object.keys(p));
  console.log('AUTHOR_NAME_FALLBACK:', p?.user?.displayName || p?.user?.username || p?.authorName || '(missing)');
}

