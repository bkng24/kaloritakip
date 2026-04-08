// ============================================================
// KaloriTakip - Ana Uygulama Mantığı
// ============================================================

class CalorieTracker {
    constructor() {
        this.settings = this.loadSettings();
        this.todayLog = this.loadTodayLog();
        this.currentResults = [];
        this.deferredPrompt = null;
        
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        this.selectedArchiveDate = this.getTodayKey();
        
        this.initElements();
        this.initEvents();
        this.calculateTarget();
        this.updateUI();
        this.renderCalendar();
        this.loadArchiveForSelectedDate();
        this.addSVGGradient();
    }

    // ==================== INITIALIZATION ====================
    
    initElements() {
        // Stats
        this.targetEl = document.getElementById('targetCalories');
        this.consumedEl = document.getElementById('consumedCalories');
        this.remainingEl = document.getElementById('remainingCalories');

        // Progress
        this.progressRing = document.getElementById('progressRing');
        this.progressPercent = document.getElementById('progressPercent');
        this.progressLabel = document.getElementById('progressLabel');
        this.statusBadge = document.getElementById('statusBadge');

        // Input
        this.foodInput = document.getElementById('foodInput');
        this.calculateBtn = document.getElementById('calculateBtn');

        // Results
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsList = document.getElementById('resultsList');
        this.totalCalories = document.getElementById('totalCalories');
        this.addBtn = document.getElementById('addBtn');

        // Log (today)
        this.logList = document.getElementById('logList');
        this.logEmpty = document.getElementById('logEmpty');
        this.clearBtn = document.getElementById('clearBtn');

        // Archive UI
        this.calendarMonthYear = document.getElementById('calendarMonthYear');
        this.prevMonthBtn = document.getElementById('prevMonthBtn');
        this.nextMonthBtn = document.getElementById('nextMonthBtn');
        this.calendarGrid = document.getElementById('calendarGrid');
        
        this.archiveSummary = document.getElementById('archiveSummary');
        this.archiveTarget = document.getElementById('archiveTarget');
        this.archiveConsumed = document.getElementById('archiveConsumed');
        this.archiveRemaining = document.getElementById('archiveRemaining');
        this.archiveRemainingCard = document.getElementById('archiveRemainingCard');

        this.archiveList = document.getElementById('archiveList');
        this.deleteDayBtn = document.getElementById('deleteDayBtn');

        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModal = document.getElementById('closeModal');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.calculatedTargetEl = document.getElementById('calculatedTarget');

        // Settings inputs
        this.inputAge = document.getElementById('inputAge');
        this.inputGender = document.getElementById('inputGender');
        this.inputHeight = document.getElementById('inputHeight');
        this.inputWeight = document.getElementById('inputWeight');
        this.inputActivity = document.getElementById('inputActivity');
        this.inputGoal = document.getElementById('inputGoal');
        
        // PWA Install
        this.installBanner = document.getElementById('installBanner');
        this.installBtn = document.getElementById('installBtn');
        this.installDismiss = document.getElementById('installDismiss');
    }


    initEvents() {
        this.calculateBtn.addEventListener('click', () => this.handleCalculate());
        this.addBtn.addEventListener('click', () => this.addToLog());
        this.clearBtn.addEventListener('click', () => this.clearLog());
        
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Real-time target calculation in settings
        ['inputAge', 'inputGender', 'inputHeight', 'inputWeight', 'inputActivity', 'inputGoal'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateCalculatedTarget());
        });
        
        // Keyboard shortcut
        this.foodInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleCalculate();
            }
        });

        // Archive interactions
        this.prevMonthBtn.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderCalendar();
        });
        
        this.nextMonthBtn.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderCalendar();
        });

        this.deleteDayBtn.addEventListener('click', () => this.deleteArchiveDay());
    }



    renderCalendar() {
        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        this.calendarMonthYear.textContent = `${months[this.currentMonth]} ${this.currentYear}`;
        
        this.calendarGrid.innerHTML = '';
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        
        // Empty slots
        for (let i = 0; i < startDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            this.calendarGrid.appendChild(emptyDiv);
        }
        
        // Day slots
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;
            
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            
            if (this.selectedArchiveDate === dateStr) {
                dayDiv.classList.add('selected');
            }
            
            if (localStorage.getItem(`kaloriTakip_log_${dateStr}`)) {
                dayDiv.classList.add('has-log');
            }
            
            dayDiv.addEventListener('click', () => {
                this.selectedArchiveDate = dateStr;
                this.renderCalendar();
                this.loadArchiveForSelectedDate();
            });
            
            this.calendarGrid.appendChild(dayDiv);
        }
    }

    addSVGGradient() {
        const svg = document.querySelector('.progress-ring');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'progressGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#8b5cf6');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#10b981');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    }

    // ==================== SETTINGS ====================
    
    loadSettings() {
        const saved = localStorage.getItem('kaloriTakip_settings');
        if (saved) return JSON.parse(saved);
        return {
            age: 30,
            gender: 'male',
            height: 186,
            weight: 143,
            activity: 1.375,
            goal: 'lose',
            targetCalories: 2400
        };
    }

    openSettings() {
        this.inputAge.value = this.settings.age;
        this.inputGender.value = this.settings.gender;
        this.inputHeight.value = this.settings.height;
        this.inputWeight.value = this.settings.weight;
        this.inputActivity.value = this.settings.activity;
        this.inputGoal.value = this.settings.goal;
        this.updateCalculatedTarget();
        this.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    calculateBMR(age, gender, height, weight) {
        // Mifflin-St Jeor Equation
        if (gender === 'male') {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    }

    calculateTDEE(bmr, activity) {
        return bmr * activity;
    }

    calculateTarget() {
        const bmr = this.calculateBMR(
            this.settings.age,
            this.settings.gender,
            this.settings.height,
            this.settings.weight
        );
        const tdee = this.calculateTDEE(bmr, this.settings.activity);
        
        let target;
        switch (this.settings.goal) {
            case 'lose':
                target = tdee - 750; // Aggressive deficit for weight loss
                break;
            case 'gain':
                target = tdee + 500;
                break;
            default:
                target = tdee;
        }
        
        this.settings.targetCalories = Math.round(target);
        localStorage.setItem('kaloriTakip_settings', JSON.stringify(this.settings));
    }

    updateCalculatedTarget() {
        const age = parseInt(this.inputAge.value) || 30;
        const gender = this.inputGender.value;
        const height = parseInt(this.inputHeight.value) || 186;
        const weight = parseInt(this.inputWeight.value) || 143;
        const activity = parseFloat(this.inputActivity.value) || 1.375;
        const goal = this.inputGoal.value;
        
        const bmr = this.calculateBMR(age, gender, height, weight);
        const tdee = this.calculateTDEE(bmr, activity);
        
        let target;
        switch (goal) {
            case 'lose': target = tdee - 750; break;
            case 'gain': target = tdee + 500; break;
            default: target = tdee;
        }
        
        this.calculatedTargetEl.textContent = Math.round(target) + ' kcal';
    }

    saveSettings() {
        this.settings = {
            age: parseInt(this.inputAge.value) || 30,
            gender: this.inputGender.value,
            height: parseInt(this.inputHeight.value) || 186,
            weight: parseInt(this.inputWeight.value) || 143,
            activity: parseFloat(this.inputActivity.value) || 1.375,
            goal: this.inputGoal.value,
            targetCalories: this.settings.targetCalories
        };
        
        this.calculateTarget();
        localStorage.setItem('kaloriTakip_settings', JSON.stringify(this.settings));
        this.updateUI();
        this.closeSettings();
        this.showToast('Ayarlar kaydedildi!', 'success');
    }

    // ==================== FOOD PARSING ====================
    
    parseFoodInput(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const results = [];
        
        for (const line of lines) {
            const parsed = this.parseLine(line.trim());
            results.push(parsed);
        }
        
        return results;
    }

    parseLine(line) {
        const original = line;
        line = line.toLowerCase().trim();
        
        // Remove common prefixes
        line = line.replace(/^[-•*]\s*/, '');
        
        // Try to extract quantity
        let quantity = 1;
        let gramAmount = null;
        let cleanedLine = line;
        
        // Pattern: "200gr tavuk" veya "200g tavuk" veya "200 gr tavuk"
        const gramPattern = /(\d+(?:[.,]\d+)?)\s*(?:gr|gram|g)\b/i;
        const gramMatch = line.match(gramPattern);
        if (gramMatch) {
            gramAmount = parseFloat(gramMatch[1].replace(',', '.'));
            cleanedLine = line.replace(gramMatch[0], '').trim();
        }
        
        // Pattern: "2 dilim ekmek", "bir kase çorba"
        const quantityPattern = /^(\d+(?:[.,]\d+)?|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yarım|çeyrek)\s+/i;
        const quantityMatch = cleanedLine.match(quantityPattern);
        if (quantityMatch) {
            const qVal = quantityMatch[1].replace(',', '.');
            quantity = QUANTITY_WORDS[qVal] || parseFloat(qVal) || 1;
            cleanedLine = cleanedLine.substring(quantityMatch[0].length).trim();
        }
        
        // Check for "buçuk" pattern (e.g., "1 buçuk" = 1.5)
        if (cleanedLine.match(/^buçuk\s+/)) {
            quantity += 0.5;
            cleanedLine = cleanedLine.replace(/^buçuk\s+/, '');
        }
        
        // Remove unit words from the search text for better matching
        const unitWords = ['dilim', 'adet', 'porsiyon', 'kase', 'bardak', 'fincan', 
                          'kaşık', 'yemek kaşığı', 'çay kaşığı', 'avuç', 'top', 
                          'parça', 'paket', 'salkım', 'kadeh', 'tek', 'tabak',
                          'tane', 'kutu', 'şişe'];
        
        let foundUnit = null;
        for (const unit of unitWords) {
            if (cleanedLine.includes(unit)) {
                foundUnit = unit;
                cleanedLine = cleanedLine.replace(unit, '').trim();
                break;
            }
        }
        
        // Find best matching food
        const match = this.findBestMatch(cleanedLine);
        
        if (match) {
            let calories;
            if (gramAmount) {
                // Calculate based on gram amount
                calories = Math.round((match.kalori / match.miktar) * gramAmount * quantity);
            } else {
                calories = Math.round(match.kalori * quantity);
            }
            
            let detail = '';
            if (gramAmount) {
                detail = `${quantity > 1 ? quantity + ' × ' : ''}${gramAmount}g`;
            } else {
                detail = `${quantity} ${match.birim}`;
            }
            
            return {
                original: original,
                food: match.isim,
                calories: calories,
                detail: detail,
                found: true
            };
        }
        
        return {
            original: original,
            food: original,
            calories: 0,
            detail: 'Bulunamadı',
            found: false
        };
    }

    findBestMatch(searchText) {
        searchText = searchText.toLowerCase().trim();
        if (!searchText) return null;
        
        // Remove common words
        searchText = searchText.replace(/\b(bir|tane|adet|biraz|az|çok|büyük|küçük|orta)\b/g, '').trim();
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const food of FOOD_DATABASE) {
            for (const alias of food.aliases) {
                const score = this.calculateMatchScore(searchText, alias.toLowerCase());
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = food;
                }
            }
        }
        
        // Require minimum score threshold
        if (bestScore >= 0.4) {
            return bestMatch;
        }
        
        return null;
    }

    calculateMatchScore(search, target) {
        // Exact match
        if (search === target) return 1.0;
        
        // Contains
        if (target.includes(search)) return 0.85;
        if (search.includes(target)) return 0.75;
        
        // Word-level matching
        const searchWords = search.split(/\s+/);
        const targetWords = target.split(/\s+/);
        
        let matchedWords = 0;
        for (const sw of searchWords) {
            for (const tw of targetWords) {
                if (tw.includes(sw) || sw.includes(tw)) {
                    matchedWords++;
                    break;
                }
            }
        }
        
        const wordScore = matchedWords / Math.max(searchWords.length, targetWords.length);
        if (wordScore > 0) return wordScore * 0.7;
        
        // Levenshtein for typo tolerance
        const distance = this.levenshtein(search, target);
        const maxLen = Math.max(search.length, target.length);
        const similarity = 1 - (distance / maxLen);
        
        return similarity * 0.5;
    }

    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i-1] === a[j-1]) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1,
                        matrix[i][j-1] + 1,
                        matrix[i-1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // ==================== CALCULATE & DISPLAY ====================
    
    handleCalculate() {
        const text = this.foodInput.value.trim();
        if (!text) {
            this.showToast('Lütfen yediklerini yaz!', 'error');
            return;
        }
        
        // Loading animation
        this.calculateBtn.classList.add('loading');
        this.calculateBtn.querySelector('.btn-icon').textContent = '⏳';
        
        // Simulate AI processing delay for UX
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
        
        for (const result of this.currentResults) {
            const item = document.createElement('div');
            item.className = `result-item${result.found ? '' : ' not-found'}`;
            
            if (result.found) {
                item.innerHTML = `
                    <div class="result-food">
                        <span class="result-food-name">${this.capitalize(result.food)}</span>
                        <span class="result-food-detail">${result.detail}</span>
                    </div>
                    <span class="result-calories">${result.calories} kcal</span>
                `;
                total += result.calories;
            } else {
                item.innerHTML = `
                    <div class="result-food">
                        <span class="result-food-name">❓ ${result.original}</span>
                        <span class="result-food-detail">Veritabanında bulunamadı</span>
                    </div>
                    <span class="result-calories">— kcal</span>
                `;
            }
            
            this.resultsList.appendChild(item);
        }
        
        this.totalCalories.textContent = total + ' kcal';
        this.resultsSection.style.display = 'block';
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==================== DAILY LOG ====================
    
    // ==================== LOG HELPERS ====================
    getDateKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    loadTodayLog() {
        const today = this.getTodayKey();
        return this.loadLogForKey(today);
    }

    loadLogForKey(key) {
        const saved = localStorage.getItem(`kaloriTakip_log_${key}`);
        return saved ? JSON.parse(saved) : [];
    }

    saveLogForKey(key, data) {
        localStorage.setItem(`kaloriTakip_log_${key}`, JSON.stringify(data));
    }

    getTodayKey() {
        return this.getDateKey(new Date());
    }

    // ==================== ARCHIVE ====================
    loadArchiveForSelectedDate() {
        const key = this.selectedArchiveDate;
        if (!key) {
            this.archiveList.innerHTML = `<p class="archive-empty">Seçilen tarihte bir kayıt yok.</p>`;
            this.deleteDayBtn.style.display = 'none';
            this.archiveSummary.style.display = 'none';
            return;
        }
        const log = this.loadLogForKey(key);
        this.renderArchiveList(log);
        this.deleteDayBtn.style.display = log.length ? 'block' : 'none';
    }

    renderArchiveList(log) {
        this.archiveList.innerHTML = '';
        if (log.length === 0) {
            this.archiveList.innerHTML = `<p class="archive-empty">Seçilen tarihte bir kayıt yok.</p>`;
            this.archiveSummary.style.display = 'none';
            return;
        }
        
        const target = this.settings.targetCalories;
        const consumed = log.reduce((sum, entry) => sum + entry.calories, 0);
        const remaining = target - consumed;

        this.archiveTarget.textContent = target;
        this.archiveConsumed.textContent = consumed;
        
        if (remaining < 0) {
            this.archiveRemaining.textContent = Math.abs(remaining);
            this.archiveRemainingCard.querySelector('.summary-label').textContent = 'Aşıldı';
            this.archiveRemaining.style.color = '#ef4444';
        } else {
            this.archiveRemaining.textContent = remaining;
            this.archiveRemainingCard.querySelector('.summary-label').textContent = 'Kalan';
            this.archiveRemaining.style.color = '';
        }
        
        this.archiveSummary.style.display = 'grid';

        for (const entry of log) {
            const el = document.createElement('div');
            el.className = 'log-entry';
            el.innerHTML = `
                <div class="log-entry-info">
                    <span class="log-entry-name">${this.capitalize(entry.food)}</span>
                    <span class="log-entry-time">${entry.time} • ${entry.detail}</span>
                </div>
                <div class="log-entry-right">
                    <span class="log-entry-cal">${entry.calories} kcal</span>
                </div>
            `;
            this.archiveList.appendChild(el);
        }
    }

    deleteArchiveDay() {
        const key = this.selectedArchiveDate;
        if (!key) return;
        if (confirm('Seçilen günün tüm kayıtlarını silmek istediğinize emin misiniz?')) {
            localStorage.removeItem(`kaloriTakip_log_${key}`);
            this.renderCalendar();
            this.loadArchiveForSelectedDate();
            this.showToast('Günlük silindi!', 'success');
        }
    }

    // ==================== DAILY LOG ====================
    saveTodayLog() {
        const today = this.getTodayKey();
        this.saveLogForKey(today, this.todayLog);
    }

    addToLog() {
        const foundResults = this.currentResults.filter(r => r.found);
        if (foundResults.length === 0) {
            this.showToast('Eklenecek yemek bulunamadı!', 'error');
            return;
        }
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        for (const result of foundResults) {
            this.todayLog.push({
                id: Date.now() + Math.random(),
                food: result.food,
                calories: result.calories,
                detail: result.detail,
                time: timeStr
            });
        }
        
        this.saveTodayLog();
        this.updateUI();
        
        // Clear input and results
        this.foodInput.value = '';
        this.resultsSection.style.display = 'none';
        this.currentResults = [];
        
        this.showToast(`${foundResults.length} yemek günlüğe eklendi!`, 'success');
    }

    removeFromLog(id) {
        this.todayLog = this.todayLog.filter(entry => entry.id !== id);
        this.saveTodayLog();
        this.updateUI();
    }

    clearLog() {
        if (confirm('Bugünün günlüğünü temizlemek istediğine emin misin?')) {
            this.todayLog = [];
            this.saveTodayLog();
            this.updateUI();
            this.showToast('Günlük temizlendi!', 'success');
        }
    }

    // ==================== UI UPDATE ====================
    
    updateUI() {
        const target = this.settings.targetCalories;
        const consumed = this.todayLog.reduce((sum, entry) => sum + entry.calories, 0);
        const remaining = Math.max(0, target - consumed);
        const percent = Math.min(100, Math.round((consumed / target) * 100));
        
        // Animate numbers
        this.animateNumber(this.targetEl, target);
        this.animateNumber(this.consumedEl, consumed);
        this.animateNumber(this.remainingEl, remaining);
        
        // Progress ring
        const circumference = 2 * Math.PI * 85; // r=85
        const offset = circumference - (percent / 100) * circumference;
        this.progressRing.style.strokeDasharray = circumference;
        this.progressRing.style.strokeDashoffset = offset;
        
        this.progressPercent.textContent = percent + '%';
        
        // Status and colors
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
            
            // Change ring color to red
            const stops = document.querySelectorAll('#progressGradient stop');
            if (stops.length >= 2) {
                stops[0].setAttribute('stop-color', '#ef4444');
                stops[1].setAttribute('stop-color', '#dc2626');
            }
        }
        
        // Reset ring color if within target
        if (consumed <= target) {
            const stops = document.querySelectorAll('#progressGradient stop');
            if (stops.length >= 2) {
                stops[0].setAttribute('stop-color', '#8b5cf6');
                stops[1].setAttribute('stop-color', '#10b981');
            }
        }
        
        // Update remaining card color
        if (consumed > target) {
            this.remainingEl.parentElement.querySelector('.stat-value').style.color = '#ef4444';
            this.remainingEl.textContent = '0';
        } else {
            this.remainingEl.parentElement.querySelector('.stat-value').style.color = '';
        }
        
        // Update log display
        this.renderLog();
    }

    renderLog() {
        this.logList.innerHTML = '';
        
        if (this.todayLog.length === 0) {
            this.logList.innerHTML = `
                <div class="log-empty" id="logEmpty">
                    <span class="empty-icon">🍽️</span>
                    <p>Henüz bir şey eklenmedi</p>
                </div>
            `;
            this.clearBtn.style.display = 'none';
            return;
        }
        
        this.clearBtn.style.display = 'block';
        
        for (const entry of this.todayLog) {
            const el = document.createElement('div');
            el.className = 'log-entry';
            el.innerHTML = `
                <div class="log-entry-info">
                    <span class="log-entry-name">${this.capitalize(entry.food)}</span>
                    <span class="log-entry-time">${entry.time} • ${entry.detail}</span>
                </div>
                <div class="log-entry-right">
                    <span class="log-entry-cal">${entry.calories} kcal</span>
                    <button class="log-entry-delete" data-id="${entry.id}" title="Sil">×</button>
                </div>
            `;
            
            el.querySelector('.log-entry-delete').addEventListener('click', (e) => {
                this.removeFromLog(entry.id);
            });
            
            this.logList.appendChild(el);
        }
    }

    // ==================== UTILITIES ====================
    
    animateNumber(element, target) {
        const current = parseInt(element.textContent) || 0;
        const diff = target - current;
        const steps = 20;
        const increment = diff / steps;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            if (step >= steps) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current + increment * step);
            }
        }, 25);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showToast(message, type = 'success') {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalorieTracker();
    
    // PWA Install Banner Logic
    const installBanner = document.getElementById('installBanner');
    const installBtn = document.getElementById('installBtn');
    const installDismiss = document.getElementById('installDismiss');
    let deferredPrompt = null;
    
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone === true;
    
    // Check if dismissed before
    const dismissed = localStorage.getItem('kaloriTakip_installDismissed');
    
    if (!isStandalone && !dismissed) {
        // iOS Safari detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS && isSafari) {
            // Show iOS-specific install instructions
            setTimeout(() => {
                installBanner.style.display = 'flex';
                const content = installBanner.querySelector('.install-content');
                content.innerHTML = `
                    <span>📲</span>
                    <div>
                        <strong>Ana Ekrana Ekle</strong>
                        <small>Paylaş 📤 → "Ana Ekrana Ekle"</small>
                    </div>
                `;
                installBtn.style.display = 'none';
            }, 3000);
        }
        
        // Android / Chrome install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(() => {
                installBanner.style.display = 'flex';
            }, 3000);
        });
        
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        installBanner.style.display = 'none';
                    }
                    deferredPrompt = null;
                }
            });
        }
        
        if (installDismiss) {
            installDismiss.addEventListener('click', () => {
                installBanner.style.display = 'none';
                localStorage.setItem('kaloriTakip_installDismissed', 'true');
            });
        }
    }
});
