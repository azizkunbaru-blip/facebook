/**
 * FB Video Downloader - Core Logic
 * Author: Senior Frontend Engineer
 */

const UI = {
    urlInput: document.getElementById('urlInput'),
    urlHelper: document.getElementById('urlHelper'),
    getBtn: document.getElementById('getBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    resultArea: document.getElementById('resultArea'),
    skeleton: document.getElementById('skeleton'),
    videoCard: document.getElementById('videoCard'),
    historyContainer: document.getElementById('historyContainer'),
    themeToggle: document.getElementById('themeToggle'),
    toast: document.getElementById('toast'),
    faqAccordion: document.getElementById('faqAccordion'),
    downloadButtons: document.getElementById('downloadButtons')
};

// --- CONFIGURATION ---
const CONFIG = {
    API_URL: 'http://localhost:3000/api/parse', // Ganti dengan URL produksi Anda
    FB_REGEX: /(?:https?:\/\/)?(?:www\.|m\.|web\.|fb\.watch\/)(?:facebook\.com\/|fb\.watch\/)(?:watch\/\?v=|videos\/|reel\/|groups\/.*?\/permalink\/|story\.php\?story_fbid=)?([a-zA-Z0-9\.\_\-]+)/
};

const faqs = [
    { q: "Apakah layanan ini gratis?", a: "Ya, 100% gratis tanpa biaya atau batas unduhan harian." },
    { q: "Mengapa video tidak bisa diunduh?", a: "Pastikan video bersifat 'Public'. Video dari grup privat atau akun yang dikunci tidak dapat diambil oleh server." },
    { q: "Apakah video tersimpan di server ini?", a: "Tidak. Kami hanya memproses link dan mengarahkan Anda ke file sumber asli Facebook." },
    { q: "Bisa download video Reel?", a: "Tentu, masukkan saja link Reel Facebook Anda ke kolom di atas." },
    { q: "Kualitas apa yang tersedia?", a: "Tersedia pilihan SD (Standard) dan HD (High Definition) sesuai kualitas asli unggahan." },
    { q: "Video terbuka di tab baru bukannya terunduh?", a: "Beberapa browser memblokir unduhan otomatis. Jika itu terjadi, klik kanan pada video lalu pilih 'Save Video As'." }
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderFaqs();
    renderHistory();
    
    UI.getBtn.addEventListener('click', handleDownload);
    UI.pasteBtn.addEventListener('click', handlePaste);
    UI.themeToggle.addEventListener('click', toggleTheme);
    UI.urlInput.addEventListener('input', validateUrl);
});

// --- CORE FUNCTIONS ---

async function handleDownload() {
    const url = UI.urlInput.value.trim();
    if (!validateUrl()) {
        showToast("Link Facebook tidak valid!", "error");
        return;
    }

    setLoading(true);
    saveToHistory(url);

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizeUrl(url) })
        });

        const data = await response.json();

        if (response.ok) {
            renderResult(data);
            showToast("Video berhasil diekstrak!", "success");
            // Scroll otomatis ke hasil
            UI.resultArea.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error(data.details || data.error || "Gagal memproses link");
        }
    } catch (err) {
        showToast(err.message, "error");
        UI.resultArea.classList.add('hidden');
    } finally {
        setLoading(false);
    }
}

/**
 * Render hasil ekstraksi ke UI
 */
function renderResult(data) {
    UI.videoCard.classList.remove('hidden');
    document.getElementById('vidThumb').src = data.thumbnail;
    document.getElementById('vidTitle').innerText = data.title;
    document.getElementById('vidDuration').innerText = data.duration;

    UI.downloadButtons.innerHTML = '';

    data.sources.forEach(src => {
        const btn = document.createElement('button');
        btn.className = "group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl transition-all font-bold shadow-lg active:scale-95";
        btn.innerHTML = `
            <i class="fa-solid fa-download group-hover:bounce"></i>
            <div class="text-left">
                <div class="text-xs opacity-80 uppercase tracking-widest">Download</div>
                <div class="text-lg">${src.quality} Video</div>
            </div>
        `;
        
        // Logika Force Download menggunakan Blob
        btn.onclick = () => triggerDownload(src.url, `${data.title}-${src.quality}.mp4`);
        
        UI.downloadButtons.appendChild(btn);
    });
}

/**
 * Memaksa Browser mendownload file (Force Download)
 */
async function triggerDownload(videoUrl, filename) {
    showToast("Menyiapkan file unduhan...", "success");
    
    try {
        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error();
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace(/[^\w\s-]/gi, ''); // Clean filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast("Unduhan dimulai!", "success");
    } catch (e) {
        // Fallback jika CORS memblokir fetch langsung
        window.open(videoUrl, '_blank');
        showToast("Membuka link video (Gunakan 'Simpan Sebagai' jika tidak terunduh)", "success");
    }
}

// --- UTILITIES & UI HELPERS ---

function validateUrl() {
    const url = UI.urlInput.value;
    const isValid = CONFIG.FB_REGEX.test(url);
    
    if (url.length > 0) {
        UI.urlHelper.classList.remove('hidden');
        if (isValid) {
            UI.urlHelper.innerText = "Link valid! Siap diproses.";
            UI.urlHelper.className = "px-4 py-2 text-xs text-green-500 font-medium";
            UI.getBtn.classList.add('ring-4', 'ring-indigo-500/20');
        } else {
            UI.urlHelper.innerText = "Bukan link Facebook yang didukung.";
            UI.urlHelper.className = "px-4 py-2 text-xs text-red-500 font-medium";
            UI.getBtn.classList.remove('ring-4', 'ring-indigo-500/20');
        }
    } else {
        UI.urlHelper.classList.add('hidden');
    }
    return isValid;
}

function normalizeUrl(url) {
    try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
    } catch (e) { return url; }
}

async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        UI.urlInput.value = text;
        validateUrl();
        showToast("Link ditempel dari clipboard");
    } catch (err) {
        showToast("Gagal mengakses clipboard", "error");
    }
}

function setLoading(state) {
    UI.getBtn.disabled = state;
    UI.getBtn.innerHTML = state ? `<i class="fa-solid fa-circle-notch animate-spin"></i> Processing...` : `<span>Get Video</span>`;
    
    if (state) {
        UI.resultArea.classList.remove('hidden');
        UI.skeleton.classList.remove('hidden');
        UI.videoCard.classList.add('hidden');
    } else {
        UI.skeleton.classList.add('hidden');
    }
}

function showToast(msg, type = "success") {
    const toastIcon = document.getElementById('toastIcon');
    document.getElementById('toastMsg').innerText = msg;
    toastIcon.className = type === "error" ? "fa-solid fa-circle-xmark text-red-500" : "fa-solid fa-circle-check text-green-400";

    UI.toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => UI.toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

function saveToHistory(url) {
    let history = JSON.parse(localStorage.getItem('fb_history') || '[]');
    if (!history.includes(url)) {
        history.unshift(url);
        history = history.slice(0, 5);
        localStorage.setItem('fb_history', JSON.stringify(history));
        renderHistory();
    }
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('fb_history') || '[]');
    if (history.length === 0) return;

    UI.historyContainer.classList.remove('opacity-0');
    UI.historyContainer.innerHTML = '<span class="text-xs text-slate-400 self-center mr-2">Baru saja:</span>';
    
    history.forEach(url => {
        const pill = document.createElement('button');
        pill.className = "text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full hover:bg-indigo-600 hover:text-white transition-colors truncate max-w-[120px]";
        pill.innerText = url;
        pill.onclick = () => { UI.urlInput.value = url; validateUrl(); };
        UI.historyContainer.appendChild(pill);
    });
}

function renderFaqs() {
    UI.faqAccordion.innerHTML = faqs.map((f) => `
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <button onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180')" class="w-full flex justify-between items-center p-4 text-left font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                ${f.q}
                <i class="fa-solid fa-chevron-down text-xs transition-transform"></i>
            </button>
            <div class="hidden p-4 text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800 leading-relaxed bg-slate-50/50 dark:bg-slate-900/50">
                ${f.a}
            </div>
        </div>
    `).join('');
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}
