/**
 * Generate & print Eartag Label / Kartu Ternak PDF from pembelian detail data.
 * Uses browser's print-to-PDF via hidden iframe (no external library needed).
 * Layout: grid of labels, one per ekor sapi (code_eartag + header info).
 */

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
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

/**
 * Build HTML content for Eartag Labels (grid layout, printable on A4).
 * @param {Object} header - pembelian header data (nota_sistem, nama_supplier, tgl_masuk, etc.)
 * @param {Array} details - array of detail rows (code_eartag, eartag, golongan, berat, harga)
 */
const buildEartagLabelHTML = (header, details) => {
    const user = getCurrentUser();
    const notaSistem = escapeHtml(header?.nota_sistem || '-');
    const nota = escapeHtml(header?.nota || '-');
    const supplier = escapeHtml(header?.nama_supplier || '-');
    const tglMasuk = formatDate(header?.tgl_masuk);
    const office = escapeHtml(header?.nama_office || '-');

    const labels = (details || [])
        .filter((d) => d && d.code_eartag)
        .map((d, idx) => {
            const codeEartag = escapeHtml(d.code_eartag || '');
            const eartagSupplier = escapeHtml(d.eartag_supplier || '');
            const golongan = d.golongan === 1 ? 'Boning' : d.golongan === 2 ? 'Karkas' : d.golongan === 3 ? 'Qurban' : '-';
            const berat = d.berat ? Number(d.berat).toLocaleString('id-ID') : '-';
            return `
            <div class="label">
                <div class="label-header">
                    <span class="logo">TernaSys</span>
                    <span class="office">${office}</span>
                </div>
                <div class="label-body">
                    <div class="code-eartag">${codeEartag}</div>
                    <div class="info-row">
                        <span class="info-label">Eartag Supplier:</span>
                        <span class="info-value">${eartagSupplier || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Golongan:</span>
                        <span class="info-value">${golongan}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Berat (kg):</span>
                        <span class="info-value">${berat}</span>
                    </div>
                </div>
                <div class="label-footer">
                    <div><strong>Nota:</strong> ${notaSistem}</div>
                    <div><strong>Tgl:</strong> ${tglMasuk}</div>
                </div>
                <div class="label-barcode">*${codeEartag}*</div>
            </div>`;
        }).join('');

    if (!labels) {
        return `<html><body><div style="padding:40px;text-align:center;font-family:Arial;">
            <h2>Tidak ada data eartag untuk pembelian ini</h2>
            <p>Pembelian dengan nota ${notaSistem} belum memiliki detail sapi (eartag).</p>
        </div></body></html>`;
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Label Eartag - ${notaSistem}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: #fff;
            color: #000;
            padding: 10mm;
        }
        .doc-header {
            text-align: center;
            margin-bottom: 8mm;
            border-bottom: 2px solid #000;
            padding-bottom: 4mm;
        }
        .doc-header h1 { font-size: 14pt; }
        .doc-header h2 { font-size: 11pt; font-weight: normal; margin-top: 2mm; }
        .doc-info {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            margin-bottom: 6mm;
        }
        .doc-info div { line-height: 1.4; }
        .labels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm;
        }
        .label {
            border: 1.5px solid #000;
            border-radius: 4px;
            padding: 3mm;
            width: 60mm;
            height: 40mm;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
        }
        .label-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #999;
            padding-bottom: 1.5mm;
            margin-bottom: 1.5mm;
            font-size: 7pt;
        }
        .label-header .logo { font-weight: bold; color: #1e40af; }
        .label-body { flex: 1; }
        .code-eartag {
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            margin: 1mm 0 2mm;
            letter-spacing: 1px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            line-height: 1.5;
        }
        .info-label { color: #555; }
        .info-value { font-weight: 600; }
        .label-footer {
            border-top: 1px dashed #999;
            padding-top: 1.5mm;
            font-size: 7pt;
            display: flex;
            justify-content: space-between;
        }
        .label-barcode {
            font-family: 'Courier New', monospace;
            font-size: 11pt;
            text-align: center;
            letter-spacing: 2px;
            margin-top: 1mm;
        }
        .footer {
            margin-top: 8mm;
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 3mm;
        }
        @media print {
            body { padding: 5mm; }
            .labels-grid { gap: 3mm; }
        }
    </style>
</head>
<body>
    <div class="doc-header">
        <h1>LABEL EARTAG / KARTU TERNAK</h1>
        <h2>${notaSistem} — ${supplier}</h2>
    </div>
    <div class="doc-info">
        <div>
            <strong>Nota Sistem:</strong> ${notaSistem}<br>
            <strong>Nota Supplier:</strong> ${nota}<br>
            <strong>Supplier:</strong> ${supplier}
        </div>
        <div style="text-align:right;">
            <strong>Tgl Masuk:</strong> ${tglMasuk}<br>
            <strong>Office:</strong> ${office}<br>
            <strong>Petugas:</strong> ${escapeHtml(user?.name || '-')}
        </div>
    </div>
    <div class="labels-grid">
        ${labels}
    </div>
    <div class="footer">
        Dokumen dicetak pada ${new Date().toLocaleString('id-ID')} | Sistem TernaSys — ${labels ? '' : ''}${(details || []).filter(d => d.code_eartag).length} ekor
    </div>
</body>
</html>`;
};

/**
 * Generate and print Eartag Label PDF.
 * @param {Object} pembelian - header data
 * @param {Array} details - detail rows with code_eartag
 */
export const downloadEartagLabelPDF = (pembelian, details = []) => {
    const html = buildEartagLabelHTML(pembelian, details);
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
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    }, 300);

    return { nota, html };
};
