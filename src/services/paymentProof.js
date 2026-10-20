import HttpClient from './httpClient';

/**
 * Resolve a proof URL/path to the authenticated stream endpoint.
 * Handles the API URL, a raw MinIO object key, and legacy presigned URLs.
 */
export const resolvePaymentFileEndpoint = (urlOrPath) => {
  if (!urlOrPath) return null;
  const target = String(urlOrPath).trim();
  if (/^https?:\/\//i.test(target)) {
    try {
      const parsed = new URL(target);
      if (parsed.pathname.startsWith('/api/')) return parsed.pathname + parsed.search;
      const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, '').replace(/^ternasys\//, '');
      return `/api/ho/payment/proof/${key}`;
    } catch {
      return target;
    }
  }
  if (target.startsWith('/')) return target;
  return `/api/ho/payment/proof/${target.replace(/^\/+/, '')}`;
};

/**
 * Download a private proof file with the auth token attached (returns a Blob).
 * `endpointOverride` lets RPH reuse the same downloader with its own stream route.
 */
export const fetchPaymentProofBlob = async (urlOrPath, endpointOverride) => {
  const endpoint = endpointOverride || resolvePaymentFileEndpoint(urlOrPath);
  if (!endpoint) throw new Error('Bukti pembayaran tidak tersedia');
  const blob = await HttpClient.get(endpoint, { responseType: 'blob', cache: false });
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('Bukti pembayaran tidak dapat dibuka');
  }
  return blob;
};

/**
 * Last-resort download when popups are blocked or the type is not viewable.
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

/**
 * Open a proof in a NEW TAB in the same gesture as the click.
 *
 * The tab is opened synchronously (before any await) so popup blockers allow
 * it, then navigated to /bukti.html, which renders the blob and exposes an
 * Unduh button. On failure the tab is closed and the error rethrown.
 */
export const openPaymentProofInNewTab = async (urlOrPath, { endpoint } = {}) => {
  const tab = window.open('', '_blank');

  try {
    const blob = await fetchPaymentProofBlob(urlOrPath, endpoint);
    const filename = String(urlOrPath || 'bukti-pembayaran').split('/').pop()?.split('?')[0] || 'bukti-pembayaran';
    const type = blob.type || '';
    const viewable = type.startsWith('image/') || type === 'application/pdf';

    if (!tab) {
      downloadBlob(blob, filename);
      return { mode: 'download' };
    }

    if (!viewable) {
      tab.close();
      downloadBlob(blob, filename);
      return { mode: 'download' };
    }

    const localUrl = URL.createObjectURL(blob);
    const handoff = `/bukti.html?src=${encodeURIComponent(localUrl)}&name=${encodeURIComponent(filename)}`;

    try {
      tab.opener = null;
      tab.location.replace(handoff);
    } catch {
      tab.location.href = handoff;
    }

    // The new tab now owns the blob URL; release this page's reference later.
    setTimeout(() => URL.revokeObjectURL(localUrl), 120_000);
    return { mode: 'tab' };
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
};

export default {
  resolvePaymentFileEndpoint,
  fetchPaymentProofBlob,
  openPaymentProofInNewTab,
};
