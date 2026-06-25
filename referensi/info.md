1. AKUISISI VIDEO
   - Rekam/baca video wajah (idealnya ≥ 100–200 fps seperti CASME2; webcam 30fps = kompromi).

2. PREPROCESSING
   - Deteksi & align wajah (mis. MediaPipe/dlib) tiap frame → crop konsisten.
   - Grayscale untuk tahap spotting.

3. SPOTTING MICRO-EXPRESSION  ← kunci "genuine"
   - Hitung perubahan gerak antar-frame (mis. optical flow / frame difference)
     di region ROI (alis, mulut, mata).
   - Cari segmen dengan lonjakan gerak singkat:
       onset  = awal naiknya magnitude
       apex   = puncak magnitude
   - Abaikan gerak besar/lambat (itu ekspresi makro / pose, bukan micro).

4. EKSTRAKSI FITUR (samakan PERSIS dengan training)
   - compute_optical_flow(onset_bgr, apex_bgr) → 3 kanal uint8.
   - eval_transform: Resize 224×224 → ToTensor → Normalize(ImageNet).

5. INFERENSI ENSEMBLE  ← cara paling tepat untuk genuine
   - Jalankan SEMUA 26 model fold (atau subset) pada tensor yang sama.
   - probs_i = softmax(logits_i / T)   (T = temperature, mis. 1.2–2.0)
   - probs   = rata-rata(probs_i)       (ensemble averaging)
   - Alasan: tiap fold tidak pernah lihat subjek tertentu; merata-ratakan
     memberi estimasi subject-independent yang stabil & jujur.

6. PEMETAAN VALENSI
   - Vp = probs[happiness] + probs[surprise]
   - Vn = probs[others]
   - Vd = probs[disgust]+probs[fear]+probs[repression]+probs[sadness]

7. FUZZY ENGAGEMENT SCORE (rumus Anda yang sudah ada) → skor 0–100.

8. AGREGASI TEMPORAL
   - Satu video bisa berisi banyak micro-expression.
   - Skor akhir = rata-rata/median skor tiap apex, atau time-series engagement.