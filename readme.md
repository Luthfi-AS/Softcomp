# CogniTrack AI

CogniTrack AI adalah platform analisis tingkat keterlibatan (engagement) dan emosi audiens secara real-time saat menonton video (seperti YouTube). Aplikasi ini menggunakan model *Machine Learning* yang terintegrasi langsung untuk mendeteksi ekspresi wajah dan tingkat fokus melalui webcam pengguna.

---

## 🚀 Panduan Penggunaan (Deployment / Web Version)

Bagi pengguna yang langsung mengakses aplikasi melalui website, berikut adalah ringkasan alur (User Experience Flow) untuk menggunakan CogniTrack AI. 
> 💡 **Tip:** Untuk membaca panduan bergaya *tutorial pengguna* yang lebih lengkap dan ramah pengguna, silakan cek file [ux.md](./ux.md).

### 1. Halaman Utama (Landing Page)
- **Tampilan**: Saat pertama kali membuka website, Anda akan disambut dengan halaman utama interaktif yang menjelaskan fungsi dan fitur unggulan dari CogniTrack AI.
- **Aksi**: Klik tombol **"Start Session"** untuk mulai mencoba platform.

### 2. Persiapan & Analisis Video (Halaman `/watch`)
- **Tampilan**: Ini adalah *dashboard* utama tempat Anda dapat memutar video sekaligus melihat analitik real-time.
- **Aksi / Flow**:
  1. **Masukkan URL Video**: Paste link video YouTube yang ingin Anda uji pada kolom yang tersedia, lalu klik tombol **"Analyze"**. Video YouTube akan langsung tersemat (embed) di layar.
  2. **Aktifkan Kamera**: Klik tombol **"Enable Camera"**. Browser akan meminta izin (allow) untuk mengakses webcam. Izinkan akses ini agar sistem bisa membaca ekspresi wajah.
  3. **Mulai Sesi**: Setelah kamera aktif, klik **"Start Session"**.
- **Apa yang Terjadi & Anda Dapatkan (Real-time)**:
  - Saat Anda menonton video, sistem akan menangkap (capture) gambar wajah Anda sekitar setiap 4 detik secara otomatis di latar belakang (tanpa mengganggu pemutaran video).
  - Di panel analisis sebelah kanan, Anda akan mendapatkan umpan balik langsung (real-time) berupa **Engagement Score** (Tingkat Keterlibatan/Fokus) dan **Emosi Dominan** (misalnya: Senang, Sedih, Netral, dll).

### 3. Ringkasan & Laporan (Halaman `/summary`)
- **Tampilan**: Halaman laporan komprehensif setelah sesi menonton selesai.
- **Aksi**: Jika video sudah selesai atau Anda ingin mengakhiri sesi, klik tombol **"End & Get Summary"**.
- **Apa yang Anda Dapatkan**:
  - Anda akan diarahkan ke halaman ringkasan (Summary).
  - Halaman ini menyajikan grafik dan analitik lengkap dari awal hingga akhir sesi. Anda bisa melihat rekap tingkat engagement dan emosi dominan secara keseluruhan.

### 🌐 Catatan Deployment Khusus (Vercel / Netlify / dll)
Karena repositori ini menggunakan struktur *monorepo* (folder frontend dan backend terpisah), pastikan saat men-deploy Frontend Next.js di platform seperti Vercel, Anda mengatur **Root Directory**:
1. Buka pengaturan (*Settings* > *General*) proyek di dasbor Vercel Anda.
2. Cari pengaturan **"Root Directory"**.
3. Isi dengan nilai: `app-cognitrack`
4. Lakukan **Save** lalu lakukan **Redeploy**. Jika langkah ini dilewati, Vercel akan gagal mencari Next.js dan memunculkan error *No Next.js version detected*.

---

## 💻 Panduan Menjalankan di Local (Untuk Developer)

Jika Anda ingin menjalankan atau mengembangkan projek ini di komputer lokal, ikuti langkah-langkah di bawah ini. Projek ini memiliki dua *service* yang harus dijalankan: **Backend (FastAPI)** dan **Frontend (Next.js)**.

### Prasyarat
- Python 3.9+
- Node.js (v16 atau terbaru) & npm
- Git & Git LFS (Large File Storage)

### Langkah 1: Clone Repository & Persiapan Model ML
1. Buka terminal, lalu clone repositori ini:
   ```bash
   git clone <url-repo-anda>
   cd Softcomp
   ```
2. Pastikan file model Machine Learning sudah terunduh sempurna. Jika file dilacak menggunakan Git LFS, jalankan perintah:
   ```bash
   git lfs pull
   ```
3. Pastikan file model bernama `best_model_overall.pth` berada di dalam folder `models/` (yaitu `Softcomp/models/best_model_overall.pth`).

### Langkah 2: Setup & Jalankan Backend (FastAPI)
Backend bertugas memproses *Computer Vision*, menerima gambar dari frontend, dan melakukan *inference* menggunakan model PyTorch.

1. Masuk ke direktori backend:
   ```bash
   cd cogni-track
   ```
2. Buat dan aktifkan *Virtual Environment* (Sangat direkomendasikan):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install *dependencies* utama:
   ```bash
   pip install -r requirements.txt
   ```
4. Install PyTorch (Pilih salah satu baris perintah di bawah sesuai spesifikasi komputer Anda):
   ```bash
   # OPSI 1: CPU Only (Ringan, cocok untuk laptop biasa)
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

   # OPSI 2: GPU (NVIDIA CUDA 12.1) - Jika Anda punya GPU NVIDIA yang mumpuni
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
   ```
5. Jalankan server Backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Backend sekarang berjalan di `http://localhost:8000` (Dokumentasi API tersedia di `http://localhost:8000/docs`).*

> **Fitur Mock Mode:** Jangan khawatir jika model `.pth` gagal dimuat atau PyTorch bermasalah. Backend dilengkapi "Mock Mode" otomatis yang akan mengembalikan data *dummy* logis sehingga Frontend/UI tetap bisa dijalankan untuk keperluan testing UI.

### Langkah 3: Setup & Jalankan Frontend (Next.js)
Frontend bertugas merender UI aplikasi, memutar video YouTube, dan menangkap frame webcam.

1. Buka terminal baru (biarkan terminal backend di Langkah 2 tetap menyala).
2. Masuk ke direktori frontend:
   ```bash
   cd app-cognitrack
   ```
3. Install *dependencies* Node.js:
   ```bash
   npm install
   ```
4. Jalankan server pengembangan (Dev Server):
   ```bash
   npm run dev
   ```
   *Frontend sekarang berjalan di `http://localhost:3000`*

### Langkah 4: Mulai Eksplorasi
Buka browser favorit Anda (Chrome/Firefox/Edge) dan akses **`http://localhost:3000`**. Anda bisa mulai mengikuti alur seperti pada bagian **Panduan Penggunaan** di atas!

---

### 🛠️ Troubleshooting (Masalah yang Sering Terjadi)

- **Kamera tidak muncul?** Pastikan Anda menekan tombol "Enable Camera" dan memberikan izin di popup browser (samping URL bar).
- **CORS Error (Tidak bisa terkoneksi ke backend)?** Pastikan Backend Anda berjalan tepat di port `8000` dan frontend di port `3000`. Konfigurasi keamanan CORS di backend mengatur secara eksplisit dua port ini agar bisa berkomunikasi.
- **Laptop panas / lag saat "Start Session"?** Hal ini normal karena inference ML berjalan. Jika berjalan di lokal dengan perangkat tanpa GPU, proses deteksi memakan kinerja prosesor. Resolusi tangkapan webcam sengaja dibuat 224x224 (JPEG) dengan interval 4 detik agar beban lebih seimbang.