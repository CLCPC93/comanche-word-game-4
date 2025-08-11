
const WORD_LENGTH = 4;
const MAX_GUESSES = 6;
const validWords = DAILY_WORDS;

const todayIndex = Math.floor((new Date() - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24)) % validWords.length;
const secretWord = validWords[todayIndex];
const secretArray = Array.from(secretWord.matchAll(/ts|kw|./g), m => m[0]);

let currentGuess = [];
let currentRow = 0;
let results = [];

// --- Keyboard state tracking (best-known status) ---
const KEY_ORDER = { absent:0, present:1, correct:2 };
const keyStates = {};

function setKeyState(letter, next) {
  const prev = keyStates[letter];
  if (!prev || KEY_ORDER[next] > KEY_ORDER[prev]) keyStates[letter] = next;
}

function applyKeyStyles() {
  document.querySelectorAll('#keyboard-container .keyboard-button').forEach(btn => {
    const k = btn.textContent;
    btn.classList.remove('correct','present','absent');
    const s = keyStates[k];
    if (s) btn.classList.add(s);
  });
}

function scoreGuess(guessArr, answerArr) {
  const res = Array(WORD_LENGTH).fill('absent');
  const counts = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      res[i] = 'correct';
    } else {
      const ch = answerArr[i];
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (res[i] === 'correct') continue;
    const g = guessArr[i];
    if (counts[g] > 0) {
      res[i] = 'present';
      counts[g]--;
    }
  }
  return res;
}

window.addEventListener('DOMContentLoaded', () => {
  const gameBoard = document.getElementById('game-board');
  const keyboard = document.getElementById('keyboard-container');
  const messageContainer = document.getElementById('message-container');
  const shareButton = document.getElementById('share-button');

  function createBoard() {
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.classList.add('row');
      row.setAttribute('id', 'row-' + r);
      for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.setAttribute('id', 'tile-' + r + '-' + i);
        row.appendChild(tile);
      }
      gameBoard.appendChild(row);
    }
  }

  function createKeyboard() {
    const keys = [
      'b','h','k','kw','m','n','p','r','s','t','ts','w','y','ʔ',
      'a','e','i','o','u','ʉ','a̠','e̠','i̠','o̠','u̠','ʉ̠','←','⏎'
    ];
    keys.forEach(key => {
      const button = document.createElement('button');
      button.textContent = key;
      button.classList.add('keyboard-button');
      button.addEventListener('click', () => handleKey(key));
      keyboard.appendChild(button);
    });
  }

  function handleKey(key) {
    messageContainer.textContent = "";  
    if (key === '←') {
      currentGuess.pop();
    } else if (key === '⏎') {
      submitGuess();
      return;
    } else if (currentGuess.length < WORD_LENGTH) {
      currentGuess.push(key);
    }
    updateBoard();
  }

  function updateBoard() {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      tile.textContent = currentGuess[i] || '';
    }
  }

  function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) return;

    const guess = currentGuess.join('');
    if (!validWords.includes(guess)) {
      showMessage('Invalid word');
      return;
    }

    const guessArray = [...currentGuess].map(c => c.normalize('NFC'));
    const answerArray = [...secretArray].map(c => c.normalize('NFC'));

    const verdicts = scoreGuess(guessArray, answerArray);
    const emojiRow = [];

    for (let i = 0; i < WORD_LENGTH; i++) {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      tile.classList.remove('correct','present','absent');
      tile.classList.add(verdicts[i]);

      setKeyState(guessArray[i], verdicts[i]);

      emojiRow.push(verdicts[i] === 'correct' ? '🟦' : verdicts[i] === 'present' ? '🩵' : '⬜');
    }
    applyKeyStyles();

    results.push(emojiRow.join(''));

    const guessWord = guessArray.join('');
    if (guessWord === answerArray.join('')) {
      showMessage("Tsaaku ʉnʉ̠!\nYou got it!");
      shareButton.style.display = "inline-block";
      const guessCount = currentRow + 1;
      shareButton.onclick = () => {
        const header = `Comanche Word Game ${WORD_LENGTH} - ${guessCount}/${MAX_GUESSES}`;
        const full = `${header}\n${results.join('\n')}`;
        navigator.clipboard.writeText(full);
        alert("Score copied to clipboard!");
      };
    } else if (currentRow === MAX_GUESSES - 1) {
      showMessage('The word was: ' + secretArray.join(''));
    }

    currentRow++;
    currentGuess = [];
  }

  function showMessage(msg) {
    messageContainer.textContent = msg;
    messageContainer.style.fontSize = "1.8em";
    messageContainer.style.fontWeight = "bold";
    messageContainer.style.marginTop = "1em";
  }

  createBoard();
  createKeyboard();
  applyKeyStyles();
});
