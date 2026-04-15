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

let currentCategory = 'shengmu';
let selectedLetter = '';

function initApp() {
    renderCards(currentCategory);
}

function filterCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(getCategoryName(category))) {
            btn.classList.add('active');
        }
    });

    renderCards(category);
}

function getCategoryName(category) {
    switch(category) {
        case 'shengmu': return '聲母';
        case 'yunmu': return '韻母';
        case 'overall': return '整體認讀';
        case 'tones': return '聲調';
        default: return '';
    }
}

function renderCards(category) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';

    pinyinData[category].forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `card ${category}`;
        card.style.animation = `zoomIn 0.3s ease-out ${index * 0.05}s both`;
        
        card.innerHTML = `
            <span class="letter">${item}</span>
        `;
        
        card.onclick = () => openLetter(item);
        grid.appendChild(card);
    });
}

function openLetter(letter) {
    selectedLetter = letter;
    const modal = document.getElementById('letter-modal');
    const modalLetter = document.getElementById('modal-letter');
    
    modalLetter.innerText = letter;
    modal.style.display = 'flex';
    
    // Auto speak
    speak(letter);
}

function closeModal() {
    document.getElementById('letter-modal').style.display = 'none';
}

function speakCurrent() {
    speak(selectedLetter);
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh-CN')) || voices.find(v => v.lang.includes('zh'));
    
    if (zhVoice) {
        utterance.voice = zhVoice;
    }
    
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8; // Slower for kids
    utterance.pitch = 1.1; // Slightly higher pitch for "cute" feel
    
    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded
window.speechSynthesis.onvoiceschanged = () => {
    // Some browsers need this event to populate voices
};

// View Switching
function switchView(view) {
    const homeView = document.getElementById('home-view');
    const gameView = document.getElementById('game-view');
    const navHome = document.getElementById('nav-home');
    const navGame = document.getElementById('nav-game');

    if (view === 'home') {
        homeView.style.display = 'block';
        gameView.style.display = 'none';
        navHome.classList.add('active');
        navGame.classList.remove('active');
    } else {
        homeView.style.display = 'none';
        gameView.style.display = 'block';
        navHome.classList.remove('active');
        navGame.classList.add('active');
        startNewRound();
    }
}

// Game Logic
let gameAnswer = '';

function startNewRound() {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';
    
    // Pick 4 random items from initials and finals
    const allItems = [...pinyinData.shengmu, ...pinyinData.yunmu];
    const options = [];
    while (options.length < 4) {
        const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
        if (!options.includes(randomItem)) {
            options.push(randomItem);
        }
    }
    
    gameAnswer = options[Math.floor(Math.random() * options.length)];
    
    options.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `card shengmu`;
        card.style.animation = `zoomIn 0.3s ease-out ${index * 0.1}s both`;
        card.innerHTML = `<span class="letter">${item}</span>`;
        card.onclick = () => checkAnswer(item, card);
        gameGrid.appendChild(card);
    });

    // Speak the answer
    setTimeout(() => speak(gameAnswer), 500);
}

function replayGameSound() {
    speak(gameAnswer);
}

function checkAnswer(selected, cardElement) {
    const status = document.getElementById('game-status');
    if (selected === gameAnswer) {
        status.innerText = "答對了！好棒！✨";
        cardElement.style.background = "#D4EDDA";
        cardElement.style.borderColor = "#28A745";
        
        speak("答對了");
        
        setTimeout(() => {
            status.innerText = "聽聽看，這是哪一個？";
            startNewRound();
        }, 1500);
    } else {
        status.innerText = "再試一次看看？💪";
        cardElement.style.background = "#F8D7DA";
        cardElement.style.borderColor = "#DC3545";
        speak("再試一次");
        
        cardElement.classList.add('shake');
        setTimeout(() => cardElement.classList.remove('shake'), 500);
    }
}

// Initial render
window.onload = initApp;

// Close modal on click outside
window.onclick = function(event) {
    const modal = document.getElementById('letter-modal');
    if (event.target == modal) {
        closeModal();
    }
}

