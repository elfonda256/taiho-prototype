// Middleware Penanganan Error Ramah Pengguna
// Tidak pernah menampilkan pesan teknis/SQL membingungkan kepada pengguna lantai pabrik

function errorHandler(err, req, res, next) {
  console.error('SERVER ERROR LOG:', err);

  let statusCode = err.statusCode || 500;
  let userMessage = 'Terjadi kendala saat memproses permintaan. Silakan coba kembali atau hubungi supervisor gudang.';
  let recoveryTip = 'Pastikan koneksi internet stabil dan data yang diisi telah lengkap.';

  // Tangani error database umum & konstrain
  if (err.message && err.message.includes('CHECK constraint failed: current_stock >= 0')) {
    statusCode = 400;
    userMessage = 'Jumlah material yang diminta melebihi sisa stok yang tersedia di lokasi ini.';
    recoveryTip = 'Periksa kembali jumlah stok fisik aktual atau kurangi kuantitas pengeluaran.';
  } else if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    statusCode = 400;
    userMessage = 'Data referensi (seperti kode material atau lokasi) tidak ditemukan dalam sistem.';
    recoveryTip = 'Pastikan kode QR atau lokasi yang dipilih sudah terdaftar di master data.';
  } else if (err.message && err.message.includes('UNIQUE constraint failed')) {
    statusCode = 400;
    userMessage = 'Nomor referensi atau kode transaksi ini sudah pernah digunakan sebelumnya.';
    recoveryTip = 'Gunakan nomor referensi baru atau perbarui halaman untuk sinkronisasi data.';
  } else if (err.message && (err.message.includes('IMMUTABLE') || err.message.includes('DILARANG DIUBAH') || err.message.includes('DILARANG DIHAPUS') || err.message.includes('Audit log'))) {
    statusCode = 403;
    userMessage = 'PELANGGARAN INTEGRITAS DATA: Buku besar mutasi dan log audit bersifat permanen dan DILARANG DIUBAH atau DIHAPUS.';
    recoveryTip = 'Setiap koreksi wajib dilakukan melalui transaksi baru (adjustment / pembatalan resmi), bukan menghapus riwayat.';
  } else if (err.customMessage) {
    statusCode = err.statusCode || 400;
    userMessage = err.customMessage;
    recoveryTip = err.recoveryTip || recoveryTip;
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    bantuan: recoveryTip
  });
}

module.exports = errorHandler;
