# KaloriTakip - Günlük Kalori Takip Uygulaması 🔥

iPhone'da kullanılabilen PWA (Progressive Web App) kalori takip uygulaması.

## Özellikler

- 🔥 Yapay zeka destekli kalori hesaplama (200+ Türkçe yemek)
- 📊 Günlük kalori hedefi takibi (BMR/TDEE hesaplaması)
- 📱 iPhone'da native uygulama gibi çalışır (PWA)
- 💾 Veriler cihazda saklanır (localStorage)
- 🌙 Modern dark tema
- 📶 Offline çalışır (Service Worker)

## İnternet Üzerinden Deploy Etme

### Seçenek 1: Netlify Drop (En Kolay - Araç Gerekmez)

1. [https://app.netlify.com/drop](https://app.netlify.com/drop) adresine git
2. Calory klasörünü sürükle-bırak
3. Otomatik olarak canlı URL alırsın!
4. Netlify hesabı oluşturarak özel domain ekleyebilirsin

### Seçenek 2: Vercel (Node.js Gerekli)

```bash
npm install -g vercel
vercel
```

### Seçenek 3: GitHub Pages

1. GitHub'a repo oluştur
2. Dosyaları yükle
3. Settings > Pages > Source: main branch

## iPhone'da Kullanma

1. Safari'den deploy edilen URL'yi aç
2. Paylaş butonuna (📤) bas
3. "Ana Ekrana Ekle" seçeneğini seç
4. Artık native uygulama gibi kullanabilirsin!

## Dosya Yapısı

```
Calory/
├── index.html          # Ana HTML dosyası
├── style.css           # Stiller (iOS uyumlu)
├── app.js              # Uygulama mantığı
├── food-database.js    # Türkçe yemek veritabanı
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline destek)
└── icons/              # Uygulama ikonları
```
