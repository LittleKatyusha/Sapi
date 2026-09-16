export default async function downloadPdf(blob, filename) {
  if (!(blob instanceof Blob) || blob.type.split(';')[0].toLowerCase() !== 'application/pdf' ||
      await blob.slice(0, 5).text() !== '%PDF-') {
    throw new Error('Respons dokumen bukan PDF yang valid.');
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180).replace(/\.pdf$/i, '') + '.pdf';
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
