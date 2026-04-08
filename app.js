// ============================================================
// KaloriTakip - Ana Uygulama Mantığı (localStorage versiyonu)
// ============================================================

const LS_PREFIX = 'kaloriTakip_';

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                   "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_DAYS   = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

class CalorieTracker {
    constructor() {
        this.settings    = this.getDefaultSettings();
        this.activeLog   = [];           // log for the currently selected date
        this.currentResults = [];
        
        const now = new Date();
        this.todayKey       = this.getDateKey(now);
        this.activeDate     = this.todayKey;   // which date is being viewed/edited
        this.currentMonth   = now.getMonth();
        this.currentYear    = now.getFullYear();
        
        this.initElements();
        this.initEvents();
        this.addSVGGradient();
        this.init();
    }

    getDefaultSettings() {
        return { age: 30, gender: 'male', height: 186, weight: 143,
                 activity: 1.375, goal: 'lose', targetCalories: 2400 };
    }

    init() {
        this.loadSettings();
        this.calculateTarget();
        this.loadActiveLog();   // loads activeDate's log → updates UI
        this.renderCalendar();
    }

    // ==================== ELEMENT REFS ====================

    initElements() {
        this.targetEl     = document.getElementById('targetCalories');
        this.consumedEl   = document.getElementById('consumedCalories');
        this.remainingEl  = document.getElementById('remainingCalories');

        this.progressRing    = document.getElementById('progressRing');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressLabel   = document.getElementById('progressLabel');
        this.statusBadge     = document.getElementById('statusBadge');

        this.foodInput    = document.getElementById('foodInput');
        this.calculateBtn = document.getElementById('calculateBtn');

        this.resultsSection = document.getElementById('resultsSection');
        this.resultsList    = document.getElementById('resultsList');
        this.totalCalories  = document.getElementById('totalCalories');
        this.addBtn         = document.getElementById('addBtn');

        this.logList  = document.getElementById('logList');
        this.clearBtn = document.getElementById('clearBtn');

        // Date header inside log section
        this.logDateLabel = document.getElementById('logDateLabel');
        this.todayBackBtn = document.getElementById('todayBackBtn');

        // Input section subtitle
        this.inputDateLabel = document.getElementById('inputDateLabel');

        // Calendar
        this.calendarMonthYear = document.getElementById('calendarMonthYear');
        this.prevMonthBtn      = document.getElementById('prevMonthBtn');
        this.nextMonthBtn      = document.getElementById('nextMonthBtn');
        this.calendarGrid      = document.getElementById('calendarGrid');

        // Settings
        this.settingsBtn        = document.getElementById('settingsBtn');
        this.settingsModal      = document.getElementById('settingsModal');
        this.closeModal         = document.getElementById('closeModal');
        this.saveSettingsBtn    = document.getElementById('saveSettings');
        this.calculatedTargetEl = document.getElementById('calculatedTarget');
        this.inputAge      = document.getElementById('inputAge');
        this.inputGender   = document.getElementById('inputGender');
        this.inputHeight   = document.getElementById('inputHeight');
        this.inputWeight   = document.getElementById('inputWeight');
        this.inputActivity = document.getElementById('inputActivity');
        this.inputGoal     = document.getElementById('inputGoal');

        // PWA
        this.installBanner  = document.getElementById('installBanner');
        this.installBtn     = document.getElementById('installBtn');
        this.installDismiss = document.getElementById('installDismiss');
    }

    // ==================== EVENTS ====================

    initEvents() {
        this.calculateBtn.addEventListener('click', () => this.handleCalculate());
        this.addBtn.addEventListener('click',       () => this.addToLog());
        this.clearBtn.addEventListener('click',     () => this.clearLog());

        this.todayBackBtn.addEventListener('click', () => {
            this.setActiveDate(this.todayKey);
            // Jump calendar to current month if needed
            const now = new Date();
            this.currentMonth = now.getMonth();
            this.currentYear  = now.getFullYear();
            this.renderCalendar();
        });

        this.settingsBtn.addEventListener('click',  () => this.openSettings());
        this.closeModal.addEventListener('click',   () => this.closeSettings());
        this.settingsModal.addEventListener('click', e => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());

        ['inputAge','inputGender','inputHeight','inputWeight','inputActivity','inputGoal'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateCalculatedTarget());
        });

        this.foodInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.ctrlKey) this.handleCalculate();
        });

        this.prevMonthBtn.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
            this.renderCalendar();
        });
        this.nextMonthBtn.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
            this.renderCalendar();
        });
    }

    // ==================== ACTIVE DATE ====================

    setActiveDate(date) {
        this.activeDate = date;
        this.loadActiveLog();
        this.renderCalendar();
    }

    loadActiveLog() {
        this.activeLog = this.readLog(this.activeDate);
        this.updateUI();
    }

    // ==================== LOCALSTORAGE ====================

    readLog(dateKey) {
        try { return JSON.parse(localStorage.getItem(LS_PREFIX + 'log_' + dateKey)) || []; }
        catch { return []; }
    }

    writeLog(dateKey, data) {
        localStorage.setItem(LS_PREFIX + 'log_' + dateKey, JSON.stringify(data));
    }

    deleteLog(dateKey) {
        localStorage.removeItem(LS_PREFIX + 'log_' + dateKey);
    }

    getAllLogKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(LS_PREFIX + 'log_')) {
                const d = k.replace(LS_PREFIX + 'log_', '');
                if (/^\d{4}-\d{2}-\d{2}$/.test(d)) keys.push(d);
            }
        }
        return keys;
    }

    // ==================== SETTINGS ====================

    loadSettings() {
        try {
            const raw = localStorage.getItem(LS_PREFIX + 'settings');
            if (raw) this.settings = JSON.parse(raw);
        } catch { this.settings = this.getDefaultSettings(); }
    }

    openSettings() {
        this.inputAge.value      = this.settings.age;
        this.inputGender.value   = this.settings.gender;
        this.inputHeight.value   = this.settings.height;
        this.inputWeight.value   = this.settings.weight;
        this.inputActivity.value = this.settings.activity;
        this.inputGoal.value     = this.settings.goal;
        this.updateCalculatedTarget();
        this.settingsModal.classList.add('active');
    }

    closeSettings() { this.settingsModal.classList.remove('active'); }

    calculateBMR(age, gender, height, weight) {
        return gender === 'male'
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;
    }

    calculateTDEE(bmr, activity) { return bmr * activity; }

    calculateTarget() {
        const bmr  = this.calculateBMR(this.settings.age, this.settings.gender,
                                        this.settings.height, this.settings.weight);
        const tdee = this.calculateTDEE(bmr, this.settings.activity);
        const offs = this.settings.goal === 'lose' ? -750 : this.settings.goal === 'gain' ? 500 : 0;
        this.settings.targetCalories = Math.round(tdee + offs);
    }

    updateCalculatedTarget() {
        const age      = parseInt(this.inputAge.value) || 30;
        const gender   = this.inputGender.value;
        const height   = parseInt(this.inputHeight.value) || 186;
        const weight   = parseInt(this.inputWeight.value) || 143;
        const activity = parseFloat(this.inputActivity.value) || 1.375;
        const goal     = this.inputGoal.value;
        const bmr      = this.calculateBMR(age, gender, height, weight);
        const tdee     = this.calculateTDEE(bmr, activity);
        const offs     = goal === 'lose' ? -750 : goal === 'gain' ? 500 : 0;
        this.calculatedTargetEl.textContent = Math.round(tdee + offs) + ' kcal';
    }

    saveSettings() {
        this.settings = {
            age:      parseInt(this.inputAge.value) || 30,
            gender:   this.inputGender.value,
            height:   parseInt(this.inputHeight.value) || 186,
            weight:   parseInt(this.inputWeight.value) || 143,
            activity: parseFloat(this.inputActivity.value) || 1.375,
            goal:     this.inputGoal.value,
            targetCalories: this.settings.targetCalories
        };
        this.calculateTarget();
        localStorage.setItem(LS_PREFIX + 'settings', JSON.stringify(this.settings));
        this.updateUI();
        this.closeSettings();
        this.showToast('Ayarlar kaydedildi!', 'success');
    }

    // ==================== FOOD PARSING ====================

    parseFoodInput(text) {
        return text.split('\n').filter(l => l.trim()).map(l => this.parseLine(l.trim()));
    }

    parseLine(line) {
        const original = line;
        line = line.toLowerCase().trim().replace(/^[-•*]\s*/, '');

        let quantity = 1, gramAmount = null, cleanedLine = line;

        const gramMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(?:gr|gram|g)\b/i);
        if (gramMatch) {
            gramAmount   = parseFloat(gramMatch[1].replace(',', '.'));
            cleanedLine  = line.replace(gramMatch[0], '').trim();
        }

        const qMatch = cleanedLine.match(/^(\d+(?:[.,]\d+)?|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım|çeyrek)\s+/i);
        if (qMatch) {
            const qv = qMatch[1].replace(',', '.');
            quantity    = QUANTITY_WORDS[qv] || parseFloat(qv) || 1;
            cleanedLine = cleanedLine.substring(qMatch[0].length).trim();
        }

        if (cleanedLine.match(/^buçuk\s+/)) { quantity += 0.5; cleanedLine = cleanedLine.replace(/^buçuk\s+/, ''); }

        for (const u of ['dilim','adet','porsiyon','kase','bardak','fincan','kaşık',
                          'yemek kaşığı','çay kaşığı','avuç','top','parça','paket',
                          'salkım','kadeh','tek','tabak','tane','kutu','şişe']) {
            if (cleanedLine.includes(u)) { cleanedLine = cleanedLine.replace(u, '').trim(); break; }
        }

        const match = this.findBestMatch(cleanedLine);
        if (match) {
            const calories = gramAmount
                ? Math.round((match.kalori / match.miktar) * gramAmount * quantity)
                : Math.round(match.kalori * quantity);
            const detail = gramAmount
                ? `${quantity > 1 ? quantity + ' × ' : ''}${gramAmount}g`
                : `${quantity} ${match.birim}`;
            return { original, food: match.isim, calories, detail, found: true };
        }
        return { original, food: original, calories: 0, detail: 'Bulunamadı', found: false };
    }

    findBestMatch(searchText) {
        searchText = searchText.toLowerCase().trim()
            .replace(/\b(bir|tane|adet|biraz|az|çok|büyük|küçük|orta)\b/g, '').trim();
        if (!searchText) return null;

        let bestMatch = null, bestScore = 0;
        for (const food of FOOD_DATABASE) {
            for (const alias of food.aliases) {
                const score = this.calculateMatchScore(searchText, alias.toLowerCase());
                if (score > bestScore) { bestScore = score; bestMatch = food; }
            }
        }
        return bestScore >= 0.4 ? bestMatch : null;
    }

    calculateMatchScore(search, target) {
        if (search === target) return 1.0;
        if (target.includes(search)) return 0.85;
        if (search.includes(target)) return 0.75;

        const sw = search.split(/\s+/), tw = target.split(/\s+/);
        let matched = 0;
        for (const s of sw) for (const t of tw) if (t.includes(s) || s.includes(t)) { matched++; break; }
        const ws = matched / Math.max(sw.length, tw.length);
        if (ws > 0) return ws * 0.7;

        const d = this.levenshtein(search, target);
        return (1 - d / Math.max(search.length, target.length)) * 0.5;
    }

    levenshtein(a, b) {
        const m = [];
        for (let i = 0; i <= b.length; i++) m[i] = [i];
        for (let j = 0; j <= a.length; j++) m[0][j] = j;
        for (let i = 1; i <= b.length; i++)
            for (let j = 1; j <= a.length; j++)
                m[i][j] = b[i-1] === a[j-1]
                    ? m[i-1][j-1]
                    : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
        return m[b.length][a.length];
    }

    // ==================== CALCULATE ====================

    handleCalculate() {
        const text = this.foodInput.value.trim();
        if (!text) { this.showToast('Lütfen yediklerini yaz!', 'error'); return; }

        this.calculateBtn.classList.add('loading');
        this.calculateBtn.querySelector('.btn-icon').textContent = '⏳';

        setTimeout(() => {
            this.currentResults = this.parseFoodInput(text);
            this.displayResults();
            this.calculateBtn.classList.remove('loading');
            this.calculateBtn.querySelector('.btn-icon').textContent = '⚡';
        }, 600);
    }

    displayResults() {
        this.resultsList.innerHTML = '';
        let total = 0;

        for (const r of this.currentResults) {
            const item = document.createElement('div');
            item.className = `result-item${r.found ? '' : ' not-found'}`;
            item.innerHTML = r.found
                ? `<div class="result-food">
                       <span class="result-food-name">${this.capitalize(r.food)}</span>
                       <span class="result-food-detail">${r.detail}</span>
                   </div><span class="result-calories">${r.calories} kcal</span>`
                : `<div class="result-food">
                       <span class="result-food-name">❓ ${r.original}</span>
                       <span class="result-food-detail">Veritabanında bulunamadı</span>
                   </div><span class="result-calories">— kcal</span>`;
            if (r.found) total += r.calories;
            this.resultsList.appendChild(item);
        }

        this.totalCalories.textContent = total + ' kcal';
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==================== LOG ====================

    addToLog() {
        const found = this.currentResults.filter(r => r.found);
        if (!found.length) { this.showToast('Eklenecek yemek bulunamadı!', 'error'); return; }

        const now    = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        for (const r of found) {
            this.activeLog.push({
                id: Date.now() + Math.random(),
                food: r.food, calories: r.calories,
                detail: r.detail, time: timeStr
            });
        }

        this.writeLog(this.activeDate, this.activeLog);
        this.updateUI();
        this.foodInput.value = '';
        this.resultsSection.style.display = 'none';
        this.currentResults = [];
        this.showToast(`${found.length} yemek eklendi!`, 'success');
    }

    removeFromLog(id) {
        this.activeLog = this.activeLog.filter(e => e.id !== id);
        this.writeLog(this.activeDate, this.activeLog);
        this.renderCalendar(); // dot may disappear
        this.updateUI();
    }

    clearLog() {
        const label = this.activeDate === this.todayKey ? 'bugünün günlüğünü' : `${this.formatDate(this.activeDate)} günlüğünü`;
        if (confirm(`${this.capitalize(label)} temizlemek istediğine emin misin?`)) {
            this.activeLog = [];
            this.deleteLog(this.activeDate);
            this.renderCalendar();
            this.updateUI();
            this.showToast('Günlük temizlendi!', 'success');
        }
    }

    // ==================== CALENDAR ====================

    renderCalendar() {
        const logKeys = this.getAllLogKeys();

        this.calendarMonthYear.textContent = `${TR_MONTHS[this.currentMonth]} ${this.currentYear}`;
        this.calendarGrid.innerHTML = '';

        const firstDay    = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const startDay    = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < startDay; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            this.calendarGrid.appendChild(div);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = i;

            if (dateStr === this.activeDate)  div.classList.add('selected');
            if (dateStr === this.todayKey)    div.classList.add('today');
            if (logKeys.includes(dateStr))    div.classList.add('has-log');

            div.addEventListener('click', () => this.setActiveDate(dateStr));
            this.calendarGrid.appendChild(div);
        }
    }

    // ==================== UI UPDATE ====================

    updateUI() {
        const target   = this.settings.targetCalories;
        const consumed = this.activeLog.reduce((s, e) => s + e.calories, 0);
        const remaining = Math.max(0, target - consumed);
        const percent   = Math.min(100, Math.round((consumed / target) * 100));

        this.animateNumber(this.targetEl,    target);
        this.animateNumber(this.consumedEl,  consumed);
        this.animateNumber(this.remainingEl, remaining);

        const circumference = 2 * Math.PI * 85;
        this.progressRing.style.strokeDasharray  = circumference;
        this.progressRing.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        this.progressPercent.textContent = percent + '%';

        const stops = document.querySelectorAll('#progressGradient stop');
        if (consumed === 0) {
            this.progressLabel.textContent = 'başla!';
            this.statusBadge.className = 'status-badge';
            this.statusBadge.innerHTML = '<span class="status-icon">🍽️</span><span class="status-text">Yemek girmeye başla!</span>';
        } else if (consumed <= target * 0.8) {
            this.progressLabel.textContent = 'hedefe kalan';
            this.statusBadge.className = 'status-badge';
            this.statusBadge.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Hedef içindesin! Devam et.</span>';
        } else if (consumed <= target) {
            this.progressLabel.textContent = 'neredeyse!';
            this.statusBadge.className = 'status-badge warning';
            this.statusBadge.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">Hedefe yaklaşıyorsun, dikkatli ol!</span>';
        } else {
            this.progressLabel.textContent = 'aşıldı!';
            this.statusBadge.className = 'status-badge danger';
            this.statusBadge.innerHTML = `<span class="status-icon">🚫</span><span class="status-text">Hedefi ${consumed - target} kcal aştın!</span>`;
            if (stops.length >= 2) { stops[0].setAttribute('stop-color','#ef4444'); stops[1].setAttribute('stop-color','#dc2626'); }
        }
        if (consumed <= target && stops.length >= 2) {
            stops[0].setAttribute('stop-color','#8b5cf6'); stops[1].setAttribute('stop-color','#10b981');
        }

        if (consumed > target) {
            this.remainingEl.parentElement.querySelector('.stat-value').style.color = '#ef4444';
            this.remainingEl.textContent = '0';
        } else {
            this.remainingEl.parentElement.querySelector('.stat-value').style.color = '';
        }

        // Date header
        const isToday = this.activeDate === this.todayKey;
        this.logDateLabel.textContent  = isToday ? 'Bugünün Günlüğü' : this.formatDate(this.activeDate) + ' Günlüğü';
        this.todayBackBtn.style.display = isToday ? 'none' : 'flex';

        // Input section subtitle update
        if (this.inputDateLabel) {
            this.inputDateLabel.textContent = isToday
                ? 'Yediklerini aşağıya yaz, yapay zeka kalorilerini hesaplasın.'
                : `${this.formatDate(this.activeDate)} için ekle`;
        }

        this.renderLog();
    }

    renderLog() {
        this.logList.innerHTML = '';

        if (this.activeLog.length === 0) {
            this.logList.innerHTML = `
                <div class="log-empty">
                    <span class="empty-icon">🍽️</span>
                    <p>Bu tarihte kayıt yok</p>
                </div>`;
            this.clearBtn.style.display = 'none';
            return;
        }

        this.clearBtn.style.display = 'block';

        for (const entry of this.activeLog) {
            const el = document.createElement('div');
            el.className = 'log-entry';
            el.innerHTML = `
                <div class="log-entry-info">
                    <span class="log-entry-name">${this.capitalize(entry.food)}</span>
                    <span class="log-entry-time">${entry.time} • ${entry.detail}</span>
                </div>
                <div class="log-entry-right">
                    <span class="log-entry-cal">${entry.calories} kcal</span>
                    <button class="log-entry-delete" title="Sil">×</button>
                </div>`;
            el.querySelector('.log-entry-delete').addEventListener('click', () => this.removeFromLog(entry.id));
            this.logList.appendChild(el);
        }
    }

    // ==================== HELPERS ====================

    getDateKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    formatDate(dateStr) {
        // "2025-04-08" → "8 Nisan"
        const [y, m, d] = dateStr.split('-').map(Number);
        return `${d} ${TR_MONTHS[m-1]}`;
    }

    addSVGGradient() {
        const svg  = document.querySelector('.progress-ring');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const g    = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        g.setAttribute('id', 'progressGradient');
        g.setAttribute('x1','0%'); g.setAttribute('y1','0%');
        g.setAttribute('x2','100%'); g.setAttribute('y2','100%');
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#8b5cf6');
        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#10b981');
        g.appendChild(s1); g.appendChild(s2); defs.appendChild(g);
        svg.insertBefore(defs, svg.firstChild);
    }

    animateNumber(el, target) {
        const current = parseInt(el.textContent) || 0;
        const diff = target - current;
        const steps = 20;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            if (step >= steps) { el.textContent = target; clearInterval(timer); }
            else el.textContent = Math.round(current + (diff / steps) * step);
        }, 25);
    }

    capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

    showToast(message, type = 'success') {
        document.querySelector('.toast')?.remove();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalorieTracker();

    const installBanner  = document.getElementById('installBanner');
    const installBtn     = document.getElementById('installBtn');
    const installDismiss = document.getElementById('installDismiss');
    let deferredPrompt = null;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.navigator.standalone === true;
    const dismissed    = localStorage.getItem('kaloriTakip_installDismissed');

    if (!isStandalone && !dismissed) {
        const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (isIOS && isSafari) {
            setTimeout(() => {
                installBanner.style.display = 'flex';
                installBanner.querySelector('.install-content').innerHTML = `
                    <span>📲</span>
                    <div><strong>Ana Ekrana Ekle</strong><small>Paylaş 📤 → "Ana Ekrana Ekle"</small></div>`;
                installBtn.style.display = 'none';
            }, 3000);
        }

        window.addEventListener('beforeinstallprompt', e => {
            e.preventDefault(); deferredPrompt = e;
            setTimeout(() => installBanner.style.display = 'flex', 3000);
        });

        installBtn?.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') installBanner.style.display = 'none';
                deferredPrompt = null;
            }
        });

        installDismiss?.addEventListener('click', () => {
            installBanner.style.display = 'none';
            localStorage.setItem('kaloriTakip_installDismissed', 'true');
        });
    }
});
