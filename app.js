const pinyinData = {
    shengmu: [
        'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
        'g', 'k', 'h', 'j', 'q', 'x',
        'zh', 'ch', 'sh', 'r', 'z', 'c', 's',
        'y', 'w'
    ],
    yunmu: [
        'a', 'o', 'e', 'i', 'u', 'ü',
        'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
        'ie', 'üe', 'er',
        'an', 'en', 'in', 'un', 'ün',
        'ang', 'eng', 'ing', 'ong'
    ],
    overall: [
        'zhi', 'chi', 'shi', 'ri',
        'zi', 'ci', 'si',
        'yi', 'wu', 'yu',
        'ye', 'yue', 'yuan',
        'yin', 'yun', 'ying'
    ],
    tones: ['ā', 'á', 'ǎ', 'à']
};

// 修正發音映射：包含聲調音頻修正
const soundMapping = {
    'b': '波', 'p': '坡', 'm': '摸', 'f': '佛',
    'd': '得', 't': '特', 'n': '呢', 'l': '勒',
    'g': '哥', 'k': '科', 'h': '喝',
    'j': '雞', 'q': '七', 'x': '希',
    'zh': '知', 'ch': '吃', 'sh': '師', 'r': '日',
    'z': '資', 'c': '次', 's': '思',
    'y': '衣', 'w': '烏',
    'a': '啊', 'o': '喔', 'e': '鵝', 'i': '衣', 'u': '屋', 'ü': '淤',
    'ai': '哀', 'ei': '欸', 'ui': '威', 'ao': '熬', 'ou': '歐', 'iu': '優',
    'ie': '耶', 'üe': '約', 'er': '兒',
    'an': '安', 'en': '恩', 'in': '因', 'un': '溫', 'ün': '暈',
    'ang': '昂', 'eng': '亨', 'ing': '英', 'ong': '翁',
    'zhi': '知', 'chi': '吃', 'shi': '師', 'ri': '日',
    'zi': '資', 'ci': '刺', 'si': '思',
    'yi': '衣', 'wu': '屋', 'yu': '淤', 'ye': '耶', 'yue': '約',
    // 聲調發音修正：明確標記聲調
    'ā': '第一聲 啊', 
    'á': '第二聲 啊', 
    'ǎ': '第三聲 啊', 
    'à': '第四聲 啊'
};

const mascots = [
    { id: 'panda', name: '小熊貓', img: 'assets/mascot.png', unlockAt: 0 },
    { id: 'kitty', name: '萌小貓', img: 'assets/mascot_kitty.png', unlockAt: 10 },
    { id: 'bunny', name: '跳跳兔', img: 'assets/mascot_bunny.png', unlockAt: 30 },
    { id: 'tiger', name: '小帥虎', img: 'assets/mascot_tiger.png', unlockAt: 50 },
    { id: 'puppy', name: '旺財狗', img: 'assets/mascot_puppy.png', unlockAt: 80 },
    { id: 'elephant', name: '大象君', img: 'assets/mascot_elephant.png', unlockAt: 120 },
    { id: 'monkey', name: '皮皮猴', img: 'assets/mascot_monkey.png', unlockAt: 180 },
];

let currentCategory = 'shengmu';
let selectedLetter = '';
let score = parseInt(localStorage.getItem('pinyin_score') || '0');
let learned = JSON.parse(localStorage.getItem('pinyin_learned') || '[]');
let recognition;

function initApp() {
    updateProgressUI();
    renderCards(currentCategory);
    setupRecognition();
}

function updateProgressUI() {
    document.getElementById('total-score').innerText = score;
    const mascotContainer = document.querySelector('.mascot-selection-grid');
    if (mascotContainer) {
        mascotContainer.innerHTML = mascots.map(m => `
            <div class="mascot-option ${score < m.unlockAt ? 'locked' : ''}" data-id="${m.id}" onclick="changeMascot('${m.id}')">
                <img src="${m.img}">
                <p>${m.name} (${m.unlockAt}分)</p>
                ${score < m.unlockAt ? '<div class="lock-overlay"><i class="fas fa-lock"></i></div>' : ''}
            </div>
        `).join('');
    }
}

function filterCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(getCategoryName(category))) btn.classList.add('active');
    });
    renderCards(category);
}

function getCategoryName(category) {
    const names = { shengmu: '聲母', yunmu: '韻母', overall: '整體', tones: '聲調' };
    return names[category] || '';
}

function renderCards(category) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';
    pinyinData[category].forEach((item, index) => {
        const isLearned = learned.includes(item);
        const card = document.createElement('div');
        card.className = `card ${category} ${isLearned ? 'learned' : ''}`;
        card.style.animation = `zoomIn 0.3s ease-out ${index * 0.05}s both`;
        card.innerHTML = `<span class="letter">${item}</span>${isLearned ? '<i class="fas fa-check-circle checkmark"></i>' : ''}`;
        card.onclick = () => openLetter(item);
        grid.appendChild(card);
    });
}

function openLetter(letter) {
    selectedLetter = letter;
    document.getElementById('modal-letter').innerText = letter;
    document.getElementById('letter-modal').style.display = 'flex';
    document.getElementById('rec-status').innerText = '準備好跟我讀了嗎？';
    speak(letter);

    if (!learned.includes(letter)) {
        learned.push(letter);
        localStorage.setItem('pinyin_learned', JSON.stringify(learned));
        renderCards(currentCategory);
    }
}

function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const soundContent = soundMapping[text] || text;
    const utterance = new SpeechSynthesisUtterance(soundContent);
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh-CN')) || voices.find(v => v.lang.includes('zh'));
    
    if (zhVoice) utterance.voice = zhVoice;
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
}

function setupRecognition() {
    if (!('webkitSpeechRecognition' in window)) return;
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        const status = document.getElementById('rec-status');
        if (result.includes(selectedLetter) || result.includes(soundMapping[selectedLetter])) {
            status.innerHTML = "🎉 <span style='color: #28A745'>發音正確！好棒！</span>";
            addScore(2);
        } else {
            status.innerHTML = "🤏 <span style='color: #FF9F43'>差一點點，再試一次！</span>";
        }
    };
    recognition.onend = () => { document.getElementById('mic-btn').classList.remove('pulse'); };
}

function startListening() {
    if (!recognition) return;
    document.getElementById('mic-btn').classList.add('pulse');
    document.getElementById('rec-status').innerText = '正在聽你說話...';
    try { recognition.start(); } catch(e) {}
}

function addScore(points) {
    score += points;
    localStorage.setItem('pinyin_score', score);
    updateProgressUI();
}

function closeModal() {
    document.getElementById('letter-modal').style.display = 'none';
    if (recognition) recognition.stop();
}

function switchView(view) {
    ['home-view', 'game-view', 'mascot-view'].forEach(v => {
        document.getElementById(v).style.display = (v === view + '-view') ? 'block' : 'none';
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.id === 'nav-' + view);
    });
    if (view === 'game') startNewRound();
    if (view === 'mascot') updateProgressUI();
}

let gameAnswer = '';
function startNewRound() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    const allItems = [...pinyinData.shengmu, ...pinyinData.yunmu, ...pinyinData.tones];
    const options = [];
    while (options.length < 4) {
        const rand = allItems[Math.floor(Math.random() * allItems.length)];
        if (!options.includes(rand)) options.push(rand);
    }
    gameAnswer = options[Math.floor(Math.random() * options.length)];
    options.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card shengmu';
        card.innerHTML = `<span class="letter">${item}</span>`;
        card.onclick = () => checkAnswer(item, card);
        grid.appendChild(card);
    });
    setTimeout(() => speak(gameAnswer), 500);
}

function checkAnswer(ans, el) {
    const status = document.getElementById('game-status');
    if (ans === gameAnswer) {
        status.innerText = "答對了！加 5 分！✨";
        el.style.background = "#D4EDDA";
        addScore(5);
        setTimeout(() => {
            status.innerText = "聽聽看，這是哪一個？";
            startNewRound();
        }, 1500);
    } else {
        status.innerText = "加油，再試試！💪";
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }
}

function changeMascot(id) {
    const m = mascots.find(x => x.id === id);
    if (score < m.unlockAt) return;
    document.querySelectorAll('.mascot-img').forEach(img => img.src = m.img);
    alert(`切換成功！現在是由 ${m.name} 陪你學習喔！`);
}

window.onload = initApp;
window.speechSynthesis.onvoiceschanged = () => {};
