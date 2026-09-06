/**
 * Generate & print Surat Jalan (Delivery Order) PDF from pembelian data.
 * Uses browser's print-to-PDF via hidden iframe.
 */

const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : {};
    } catch {
        return {};
    }
};

const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const buildSuratJalanHTML = (pembelian, details = []) => {
    const user = getCurrentUser();
    const notaSistem = escapeHtml(pembelian?.nota_sistem || '-');
    const nota = escapeHtml(pembelian?.nota || '-');
    const supplier = escapeHtml(pembelian?.nama_supplier || '-');
    const tglMasuk = formatDate(pembelian?.tgl_masuk);
    const office = escapeHtml(pembelian?.nama_office || '-');
    const supir = escapeHtml(pembelian?.nama_supir || '-');
    const platNomor = escapeHtml(pembelian?.plat_nomor || '-');
    const jumlah = pembelian?.jumlah || (details ? details.length : 0);
    const note = escapeHtml(pembelian?.note || '-');

    const golonganText = (g) => g === 1 ? 'Boning' : g === 2 ? 'Karkas' : g === 3 ? 'Qurban' : '-';

    const itemRows = (details && details.length > 0)
        ? details.map((d, i) => `
            <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td style="text-align:center;">${escapeHtml(d.code_eartag || '-')}</td>
                <td style="text-align:center;">${escapeHtml(d.eartag_supplier || '-')}</td>
                <td style="text-align:center;">${golonganText(d.golongan)}</td>
                <td style="text-align:right;">${d.berat ? Number(d.berat).toLocaleString('id-ID') : '-'}</td>
                <td style="text-align:right;">${d.harga ? formatCurrency(d.harga) : '-'}</td>
            </tr>`).join('')
        : `<tr><td colspan="6" style="text-align:center;padding:8mm;">Header-only: ${jumlah} ekor (detail per ekor belum di-input)</td></tr>`;

    const totalBerat = details && details.length > 0
        ? details.reduce((s, d) => s + Number(d.berat || 0), 0)
        : (pembelian?.berat_total || 0);

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Jalan - ${notaSistem}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; color: #000; padding: 15mm 12mm; font-size: 10pt; }
        .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #000; padding-bottom: 4mm; margin-bottom: 6mm; }
        .doc-header .brand { font-size: 18pt; font-weight: bold; color: #1e40af; }
        .doc-header .brand-sub { font-size: 8pt; color: #666; }
        .doc-title { text-align: right; }
        .doc-title h1 { font-size: 14pt; text-transform: uppercase; letter-spacing: 1px; }
        .doc-title .doc-no { font-size: 9pt; margin-top: 2mm; }
        .info-block { display: flex; justify-content: space-between; margin-bottom: 6mm; font-size: 9pt; }
        .info-block .info-col { line-height: 1.6; }
        .info-block .info-label { color: #555; font-size: 8pt; text-transform: uppercase; }
        .info-block .info-value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; font-size: 9pt; }
        th, td { border: 1px solid #000; padding: 2mm 3mm; }
        th { background: #f3f4f6; text-align: center; font-size: 8pt; text-transform: uppercase; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 8mm; }
        .totals table { width: 50%; }
        .totals td { border: none; }
        .totals .total-row { font-weight: bold; border-top: 2px solid #000; }
        .signatures { display: flex; justify-content: space-between; margin-top: 10mm; font-size: 9pt; }
        .sig-block { text-align: center; width: 30%; }
        .sig-block .role { margin-bottom: 15mm; }
        .sig-block .name { font-weight: 600; border-top: 1px solid #000; padding-top: 2mm; }
        .footer { margin-top: 8mm; text-align: center; font-size: 8pt; color: #666; border-top: 1px solid #ccc; padding-top: 3mm; }
        @media print { body { padding: 10mm 8mm; } }
    </style>
</head>
<body>
    <div class="doc-header">
        <div>
            <div class="brand">TernaSys</div>
            <div class="brand-sub">Sistem Terintegrasi Ternak Sapi</div>
        </div>
        <div class="doc-title">
            <h1>Surat Jalan</h1>
            <div class="doc-no">No: ${notaSistem}</div>
            <div class="doc-no">Tanggal: ${tglMasuk}</div>
        </div>
    </div>

    <div class="info-block">
        <div class="info-col">
            <div class="info-label">Dari (Supplier)</div>
            <div class="info-value">${supplier}</div>
            <br>
            <div class="info-label">Tujuan (Office)</div>
            <div class="info-value">${office}</div>
        </div>
        <div class="info-col" style="text-align:right;">
            <div class="info-label">Nota Supplier</div>
            <div class="info-value">${nota}</div>
            <br>
            <div class="info-label">Kendaraan</div>
            <div class="info-value">${platNomor} — ${supir}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width:8%;">No</th>
                <th style="width:22%;">Code Eartag</th>
                <th style="width:22%;">Eartag Supplier</th>
                <th style="width:14%;">Golongan</th>
                <th style="width:17%;">Berat (kg)</th>
                <th style="width:17%;">Harga</th>
            </tr>
        </thead>
        <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
        <table>
            <tr><td>Total Ekor</td><td style="text-align:right;">${jumlah} ekor</td></tr>
            <tr><td>Total Berat</td><td style="text-align:right;">${Number(totalBerat).toLocaleString('id-ID')} kg</td></tr>
            <tr class="total-row"><td>Catatan</td><td>${note}</td></tr>
        </table>
    </div>

    <div class="signatures">
        <div class="sig-block">
            <div class="role">Dibuat oleh (Petugas HO),</div>
            <div class="name">${escapeHtml(user?.name || '-')}</div>
        </div>
        <div class="sig-block">
            <div class="role">Diserahkan oleh (Supplier),</div>
            <div class="name">${supplier}</div>
        </div>
        <div class="sig-block">
            <div class="role">Diterima oleh (Petugas),</div>
            <div class="name">&nbsp;</div>
        </div>
    </div>

    <div class="footer">Dokumen ini dicetak pada ${new Date().toLocaleString('id-ID')} | Sistem TernaSys</div>
</body>
</html>`;
};

export const downloadSuratJalanPDF = (pembelian, details = []) => {
    const html = buildSuratJalanHTML(pembelian, details);
    const nota = pembelian?.nota_sistem || pembelian?.nota || 'pembelian';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const printTimeout = setTimeout(() => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            console.error('Print failed:', e);
        }
        clearTimeout(printTimeout);
        setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
    }, 300);

    return { nota, html };
};
