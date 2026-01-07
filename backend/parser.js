const axios = require('axios');

async function parseFbUrl(url) {
    try {
        // 1. Fetch source code halaman Facebook
        // Kita gunakan User-Agent mobile agar HTML lebih ringan & mudah di-parse
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'
            }
        });

        const html = response.data;

        // 2. Cari link video SD dan HD menggunakan Regex
        // Facebook menyimpan link video dalam properti browser_native_sd_url / hd_url
        const sdMatch = html.match(/"browser_native_sd_url":"([^"]+)"/);
        const hdMatch = html.match(/"browser_native_hd_url":"([^"]+)"/);
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const thumbMatch = html.match(/meta property="og:image" content="([^"]+)"/);

        if (!sdMatch && !hdMatch) {
            throw new Error("Video tidak ditemukan atau bersifat privat.");
        }

        const sources = [];
        if (hdMatch) {
            sources.push({
                quality: "HD",
                type: "mp4",
                url: hdMatch[1].replace(/\\/g, ''), // Membersihkan backslash dari JSON
                sizeMB: "Estimating..." 
            });
        }
        if (sdMatch) {
            sources.push({
                quality: "SD",
                type: "mp4",
                url: sdMatch[1].replace(/\\/g, ''),
                sizeMB: "Estimating..."
            });
        }

        return {
            title: titleMatch ? titleMatch[1].replace(' | Facebook', '') : "Facebook Video",
            thumbnail: thumbMatch ? thumbMatch[1].replace(/&amp;/g, '&') : "https://via.placeholder.com/500",
            duration: "Video",
            sources: sources
        };

    } catch (error) {
        throw new Error("Gagal mengekstrak video: " + error.message);
    }
}

module.exports = { parseFbUrl };
