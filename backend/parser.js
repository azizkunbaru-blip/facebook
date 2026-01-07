const axios = require('axios');

/**
 * Logika Parser
 * Catatan: FB sering memblokir bot. Di produksi, gunakan library seperti 'fb-video-downloader' 
 * atau scraping service. Di sini kita buat struktur handlernya.
 */
async function parseFbUrl(url) {
    // Validasi domain sederhana
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
        throw new Error("Invalid Domain");
    }

    // MOCK RESPONSE untuk keperluan Testing UI
    // Ganti bagian ini dengan logika scraping/API real
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                title: "Kucing Lucu Bermain Bola #Shorts",
                thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500",
                duration: "01:24",
                sources: [
                    { quality: "HD", type: "mp4", url: "#", sizeMB: "12.5" },
                    { quality: "SD", type: "mp4", url: "#", sizeMB: "4.2" }
                ]
            });
        }, 1500); // Simulasi delay network
    });
}

module.exports = { parseFbUrl };
