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
    faqAccordion: document.getElementById('faqAccordion')
};

// --- STATE MANAGEMENT ---
let isLoading = false;
const CONFIG = {
    API_URL: 'http://localhost:3000/api/parse',
    FB_REGEX: /(?:https?:\/\/)?(?:www\.|m\.|web\.|fb\.watch\/)(?:facebook\.com\/|fb\.watch\/)(?:watch\/\?v=|videos\/|reel\/|groups\/.*?\/permalink\/|story\.php\?story_fbid=)?([a-zA-Z0-9\.\_\-]+)/
};

// --- FAQ DATA ---
const faqs = [
    { q: "Apakah ini gratis?", a: "Ya, layanan ini 100% gratis selamanya tanpa biaya tersembunyi." },
    { q: "Mengapa link saya gagal diproses?", a: "Pastikan video tersebut bersifat 'Public' dan bukan video dari grup privat." },
    { q: "Bisa download di Android/iOS?", a: "Tentu! Situs ini sepenuhnya responsif dan dapat diakses dari browser seluler apa pun." },
    { q: "Di mana video tersimpan?", a: "Tergantung browser Anda, biasanya ada di folder 'Downloads'." },
    { q: "Apakah butuh login Facebook?", a: "Sama sekali tidak. Kami tidak pernah meminta data akun Anda." },
    { q: "Kualitas apa yang tersedia?", a: "Jika video aslinya mendukung, kami akan menampilkan pilihan SD dan HD." }
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

// --- LOGIC ---

async function handleDownload() {
    const url = UI.urlInput.value.trim();
    if (!validateUrl()) return;

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
            showToast("Video ditemukan!", "success");
        } else {
            throw new Error(data.error || "Gagal memproses link");
        }
    } catch (err) {
        showToast(err.message, "error");
        UI.resultArea.classList.add('hidden');
    } finally {
        setLoading(false);
    }
}

function validateUrl() {
    const url = UI.urlInput.value;
    const isValid = CONFIG.FB_REGEX.test(url);
    
    if (url.length > 0) {
        UI.urlHelper.classList.remove('hidden');
        if (isValid) {
            UI.urlHelper.innerText = "Link valid! Siap diproses.";
            UI.urlHelper.className = "px-4 py-2 text-xs text-green-500 font-medium";
        } else {
            UI.urlHelper.innerText = "Bukan link Facebook yang didukung.";
            UI.urlHelper.className = "px-4 py-2 text-xs text-red-500 font-medium";
        }
    } else {
        UI.urlHelper.classList.add('hidden');
    }
    return isValid;
}

function normalizeUrl(url) {
    // Menghapus query string yang tidak perlu seperti fbclid, dll
    try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
    } catch (e) { return url; }
}

function setLoading(state) {
    isLoading = state;
    UI.getBtn.disabled = state;
    UI.getBtn.innerHTML = state ? `<i class="fa-solid fa-circle-notch animate-spin"></i> Fetching...` : `<span>Get Video</span>`;
    
    if (state) {
        UI.resultArea.classList.remove('hidden');
        UI.skeleton.classList.remove('hidden');
        UI.videoCard.classList.add('hidden');
    } else {
        UI.skeleton.classList.add('hidden');
    }
}

function renderResult(data) {
    UI.videoCard.classList.remove('hidden');
    document.getElementById('vidThumb').src = data.thumbnail;
    document.getElementById('vidTitle').innerText = data.title;
    document.getElementById('vidDuration').innerText = data.duration;

    const btnContainer = document.getElementById('downloadButtons');
    btnContainer.innerHTML = '';

    data.sources.forEach(src => {
        const btn = document.createElement('button');
        btn.className = "flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white px-5 py-3 rounded-xl transition-all font-bold border border-slate-200 dark:border-slate-700";
        btn.innerHTML = `
            <i class="fa-solid fa-download"></i>
            <span>${src.quality} (${src.sizeMB}MB)</span>
        `;
        btn.onclick = () => window.open(src.url, '_blank');
        btnContainer.appendChild(btn);
    });

    // Add Copy Link button
    const copyBtn = document.createElement('button');
    copyBtn.className = "flex items-center gap-2 text-slate-400 hover:text-indigo-600 px-5 py-3";
    copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Link`;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(UI.urlInput.value);
        showToast("Link disalin ke clipboard", "success");
    };
    btnContainer.appendChild(copyBtn);
}

// --- UTILS ---

async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        UI.urlInput.value = text;
        validateUrl();
    } catch (err) {
        showToast("Gagal mengakses clipboard", "error");
    }
}

function showToast(msg, type = "success") {
    const toastIcon = document.getElementById('toastIcon');
    document.getElementById('toastMsg').innerText = msg;
    
    if (type === "error") {
        toastIcon.className = "fa-solid fa-circle-xmark text-red-500";
    } else {
        toastIcon.className = "fa-solid fa-circle-check text-green-400";
    }

    UI.toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        UI.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
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
        pill.className = "text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 truncate max-w-[150px]";
        pill.innerText = url;
        pill.onclick = () => {
            UI.urlInput.value = url;
            validateUrl();
        };
        UI.historyContainer.appendChild(pill);
    });
}

function renderFaqs() {
    UI.faqAccordion.innerHTML = faqs.map((f, i) => `
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button onclick="this.nextElementSibling.classList.toggle('hidden')" class="w-full flex justify-between items-center p-4 text-left font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                ${f.q}
                <i class="fa-solid fa-chevron-down text-xs"></i>
            </button>
            <div class="hidden p-4 text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800">
                ${f.a}
            </div>
        </div>
    `).join('');
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
