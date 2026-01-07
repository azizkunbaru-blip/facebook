const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { parseFbUrl } = require('./parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting: Prevent abuse (max 10 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." }
});

app.post('/api/parse', apiLimiter, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL wajib diisi" });
    }

    try {
        const data = await parseFbUrl(url);
        res.json(data);
    } catch (error) {
        console.error("Parser Error:", error.message);
        res.status(500).json({ 
            error: "Gagal memproses video.",
            details: "Pastikan video bersifat Publik atau link benar.",
            suggestion: "Coba gunakan fitur 'Salin Link' dari aplikasi Facebook langsung."
        });
    }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
