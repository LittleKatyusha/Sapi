/**
 * Generate & download Tanda Terima Barang PDF from pembelian data
 * Uses browser's print-to-PDF via hidden iframe (no external library needed).
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

/**
 * Build HTML content for Tanda Terima Barang
 */
const buildTandaTerimaHTML = (pembelian, title = 'TANDA TERIMA BARANG') => {
    const user = getCurrentUser();
    const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const nota = pembelian.nota_sistem || pembelian.nota_ho || pembelian.nota || '-';
    const supplier = pembelian.nama_supplier || '-';
    const supir = pembelian.nama_supir || '-';
    const plat = pembelian.plat_nomor || '-';
    const tglMasuk = formatDate(pembelian.tgl_masuk);
    const jumlah = pembelian.jumlah || 0;
    const berat = pembelian.berat_total || 0;
    const totalBelanja = formatCurrency(pembelian.total_belanja);
    const biayaTruk = formatCurrency(pembelian.biaya_truk);
    const biayaLain = formatCurrency(pembelian.biaya_lain);
    const biayaTotal = formatCurrency(pembelian.biaya_total);
    const jenisPembelian = pembelian.jenis_pembelian || '-';
    const office = pembelian.nama_office || '-';
    const penerima = user.name || '-';

    return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Tanda Terima Barang - ${nota}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; color: #000; padding: 30px; font-size: 12px; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; font-weight: bold; }
    .header h2 { font-size: 14px; margin-top: 4px; }
    .header p { font-size: 11px; margin-top: 4px; color: #444; }
    .doc-title { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; text-decoration: underline; }
    .info-section { margin-bottom: 20px; }
    .info-row { display: flex; margin-bottom: 6px; }
    .info-label { width: 160px; font-weight: bold; }
    .info-value { flex: 1; }
    .table-section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
    th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-box { text-align: center; width: 200px; }
    .signature-box .role { font-weight: bold; margin-bottom: 60px; }
    .signature-box .name { border-top: 1px solid #000; padding-top: 4px; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
    @media print { body { padding: 15px; } }
</style>
</head>
<body>
    <div class="header">
        <h1>CV. PUPUT BERSAUDARA</h1>
        <h2>Head Office</h2>
        <p>Jl. -------------- | Telp: (021) 12345678</p>
    </div>

    <div class="doc-title">${title}</div>

    <div class="info-section">
        <div class="info-row"><span class="info-label">No. Nota</span><span class="info-value">: ${nota}</span></div>
        <div class="info-row"><span class="info-label">Tanggal Penerimaan</span><span class="info-value">: ${today}</span></div>
        <div class="info-row"><span class="info-label">Tanggal Pembelian</span><span class="info-value">: ${tglMasuk}</span></div>
        <div class="info-row"><span class="info-label">Pemasok / Supplier</span><span class="info-value">: ${supplier}</span></div>
        <div class="info-row"><span class="info-label">Pengirim / Supir</span><span class="info-value">: ${supir}</span></div>
        <div class="info-row"><span class="info-label">Plat Nomor Kendaraan</span><span class="info-value">: ${plat}</span></div>
        <div class="info-row"><span class="info-label">Lokasi Penerimaan</span><span class="info-value">: ${office}</span></div>
        <div class="info-row"><span class="info-label">Jenis Pembelian</span><span class="info-value">: ${jenisPembelian}</span></div>
    </div>

    <div class="table-section">
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">No</th>
                    <th>Deskripsi Barang</th>
                    <th style="width: 80px;">Jumlah</th>
                    <th style="width: 100px;">Berat Total</th>
                    <th style="width: 120px;">Nilai (Rp)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: center;">1</td>
                    <td>${jenisPembelian}</td>
                    <td style="text-align: center;">${jumlah} ekor</td>
                    <td style="text-align: right;">${berat} kg</td>
                    <td style="text-align: right;">${totalBelanja}</td>
                </tr>
                <tr>
                    <td style="text-align: center;">2</td>
                    <td>Biaya Truk</td>
                    <td style="text-align: center;">-</td>
                    <td style="text-align: center;">-</td>
                    <td style="text-align: right;">${biayaTruk}</td>
                </tr>
                <tr>
                    <td style="text-align: center;">3</td>
                    <td>Biaya Lain-lain</td>
                    <td style="text-align: center;">-</td>
                    <td style="text-align: center;">-</td>
                    <td style="text-align: right;">${biayaLain}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="4" style="text-align: right;">TOTAL</td>
                    <td style="text-align: right;">${biayaTotal}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <p style="margin-top: 15px; font-size: 11px;">
        Barang yang diterima dalam kondisi baik dan sesuai dengan pesanan. Demikian tanda terima
        ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
    </p>

    <div class="signature-section">
        <div class="signature-box">
            <div class="role">Diterima oleh,</div>
            <div class="name">${penerima}</div>
        </div>
        <div class="signature-box">
            <div class="role">Diserahkan oleh,</div>
            <div class="name">${supir || supplier}</div>
        </div>
    </div>

    <div class="footer">
        Dokumen ini dicetak pada ${new Date().toLocaleString('id-ID')} | Sistem TernaSys
    </div>
</body>
</html>`;
};

/**
 * Generate and download Tanda Terima Barang PDF from pembelian data.
 * Opens a hidden iframe, writes the HTML, triggers print dialog (user can save as PDF).
 */
export const downloadTandaTerimaPDF = (pembelian, title = 'TANDA TERIMA BARANG') => {
    const html = buildTandaTerimaHTML(pembelian, title);
    const nota = pembelian.nota_sistem || pembelian.nota_ho || pembelian.nota || 'pembelian';

    // Use iframe to avoid navigating away from current page
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

    // Wait for content to render then print
    const printTimeout = setTimeout(() => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            console.error('Print failed:', e);
        }
        clearTimeout(printTimeout);
        // Remove iframe after print dialog closes
        setTimeout(() => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 1000);
    }, 300);

    // Fallback: if print doesn't trigger download, offer direct HTML download
    // (Some browsers block print on iframes — user can use Ctrl+P manually)
    return {
        nota,
        html
    };
};

export default downloadTandaTerimaPDF;
