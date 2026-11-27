// Separate the new CORS-capable media responses from legacy opaque cache entries.
export function videoSource(url: string, preview = false, retry = false): string {
  const hashIndex = url.indexOf('#');
  const path = hashIndex < 0 ? url : url.slice(0, hashIndex);
  const hash = hashIndex < 0 ? '' : url.slice(hashIndex);
  return path + (path.includes('?') ? '&' : '?') + 'media-cache=2' +
    (preview ? '&preview-frame=1' : '') + (retry ? '&retry=1' : '') + hash;
}
