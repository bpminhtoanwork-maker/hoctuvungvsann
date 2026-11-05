// --- BỘ DỮ LIỆU TỪ VỰNG MẪU (HSK 1 - HSK 6) ---
const defaultHSKDataset = [
  { id: 101, zh: "你好", pinyin: "nǐ hǎo", vi: "Xin chào", en: "Hello", de: "Hallo", hsk: "HSK1" },
  { id: 102, zh: "谢谢", pinyin: "xièxie", vi: "Cảm ơn", en: "Thank you", de: "Danke", hsk: "HSK1" },
  { id: 103, zh: "再见", pinyin: "zàijiàn", vi: "Tạm biệt", en: "Goodbye", de: "Auf Wiedersehen", hsk: "HSK1" },
  { id: 201, zh: "机场", pinyin: "jīchǎng", vi: "Sân bay", en: "Airport", de: "Flughafen", hsk: "HSK2" },
  { id: 301, zh: "照顾", pinyin: "zhàogù", vi: "Chăm sóc", en: "Take care of", de: "Kümmern", hsk: "HSK3" },
  { id: 401, zh: "经济", pinyin: "jīngjì", vi: "Kinh tế", en: "Economy", de: "Wirtschaft", hsk: "HSK4" },
  { id: 501, zh: "积极", pinyin: "jījí", vi: "Tích cực", en: "Active", de: "Aktiv", hsk: "HSK5" },
  { id: 601, zh: "抽象", pinyin: "chōuxiàng", vi: "Trừu tượng", en: "Abstract", de: "Abstrakt", hsk: "HSK6" }
];

// --- QUẢN LÝ TRẠNG THÁI & LOCALSTORAGE ---
let vocabList = JSON.parse(localStorage.getItem('polylang_vocab'));
if (!vocabList || vocabList.length === 0) {
  vocabList = defaultHSKDataset;
  localStorage.setItem('polylang_vocab', JSON.stringify(vocabList));
}

let selectedHSK = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];
let currentCard = null;

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  loadSavedBackground();
});

// --- QUẢN LÝ ẢNH NỀN TOÀN CỤC ---
function setPresetBackground(url) {
  applyBackground(`url('${url}')`);
  localStorage.setItem('polylang_bg', `url('${url}')`);
  alert("Đã cập nhật ảnh nền thành công!");
}

function changeBackgroundFromFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const bgStyle = `url('${e.target.result}')`;
      applyBackground(bgStyle);
      localStorage.setItem('polylang_bg', bgStyle);
      alert("Đã tải và cập nhật ảnh nền từ máy thành công!");
    };
    reader.readAsDataURL(file);
  }
}

function applyBackground(bgValue) {
  const body = document.getElementById('app-body');
  body.style.backgroundImage = bgValue;
}

function resetBackground() {
  const body = document.getElementById('app-body');
  body.style.backgroundImage = 'none';
  localStorage.removeItem('polylang_bg');
  alert("Đã đặt lại nền mặc định!");
}

function loadSavedBackground() {
  const savedBg = localStorage.getItem('polylang_bg');
  if (savedBg) {
    applyBackground(savedBg);
  }
}

// --- QUẢN LÝ API KEY GROQ (Lưu an toàn ở trình duyệt) ---
function setGroqKey() {
  const currentKey = localStorage.getItem('polylang_groq_key') || '';
  const newKey = prompt("Nhập Groq API Key của bạn (Lấy miễn phí tại console.groq.com):", currentKey);
  if (newKey !== null) {
    localStorage.setItem('polylang_groq_key', newKey.trim());
    if (newKey.trim()) {
      alert("Đã lưu Groq API Key thành công trên trình duyệt của bạn!");
    } else {
      alert("Đã xóa API Key!");
    }
  }
}

// --- CHUYỂN TAB (3 Tabs) ---
function switchTab(tab) {
  const btnInput = document.getElementById('btn-tab-input');
  const btnQuiz = document.getElementById('btn-tab-quiz');
  const btnBg = document.getElementById('btn-tab-background');

  const tabInput = document.getElementById('tab-input');
  const tabQuiz = document.getElementById('tab-quiz');
  const tabBg = document.getElementById('tab-background');

  const inactiveClass = "py-4 px-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs md:text-base font-semibold";
  const activeClass = "py-4 px-2 tab-active transition-colors text-xs md:text-base font-semibold";

  btnInput.className = inactiveClass;
  btnQuiz.className = inactiveClass;
  btnBg.className = inactiveClass;

  tabInput.classList.add('hidden');
  tabQuiz.classList.add('hidden');
  tabBg.classList.add('hidden');

  if (tab === 'input') {
    btnInput.className = activeClass;
    tabInput.classList.remove('hidden');
  } else if (tab === 'quiz') {
    btnQuiz.className = activeClass;
    tabQuiz.classList.remove('hidden');
    startQuiz();
  } else if (tab === 'background') {
    btnBg.className = activeClass;
    tabBg.classList.remove('hidden');
  }
}

// --- GỌI GROQ API TỰ ĐỘNG ĐIỀN DỮ LIỆU ---
async function translateWithGroq() {
  const textVi = document.getElementById('vi').value.trim();
  if (!textVi) {
    alert("Vui lòng nhập từ tiếng Việt trước khi gọi AI!");
    document.getElementById('vi').focus();
    return;
  }

  let apiKey = localStorage.getItem('polylang_groq_key');
  if (!apiKey) {
    apiKey = prompt("Chưa tìm thấy Groq API Key! Vui lòng nhập API Key của bạn (Lấy miễn phí tại console.groq.com):");
    if (!apiKey) return;
    localStorage.setItem('polylang_groq_key', apiKey.trim());
  }

  const promptText = `Dịch từ tiếng Việt sau sang định dạng JSON thuần túy:
- zh: Chữ Hán giản thể
- pinyin: Phiên âm Pinyin đầy đủ dấu
- en: Tiếng Anh chuẩn
- de: Tiếng Đức chuẩn
- hsk: Gợi ý cấp độ HSK phù hợp nhất (chỉ trả về dạng "HSK1", "HSK2", "HSK3", "HSK4", "HSK5" hoặc "HSK6")

Từ tiếng Việt cần dịch là: "${textVi}"`;

  const aiBtn = document.getElementById('btn-ai-translate');
  const oldHTML = aiBtn.innerHTML;

  try {
    aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> AI đang dịch...`;
    aiBtn.disabled = true;
    
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if(data.error) throw new Error(data.error.message);

    let rawResponse = data.choices[0].message.content;
    const result = JSON.parse(rawResponse);

    document.getElementById('zh').value = result.zh || '';
    document.getElementById('pinyin').value = result.pinyin || '';
    document.getElementById('en').value = result.en || '';
    document.getElementById('de').value = result.de || '';
    document.getElementById('hsk').value = result.hsk || 'HSK1';

  } catch (err) {
    alert("Lỗi gọi Groq API: " + err.message + "\n(Hãy kiểm tra lại Key hoặc bấm vào biểu tượng chìa khóa trên thanh menu để cập nhật key mới).");
  } finally {
    aiBtn.innerHTML = oldHTML;
    aiBtn.disabled = false;
  }
}

// --- QUẢN LÝ DỮ LIỆU & BẢNG ---
function addVocabulary(e) {
  e.preventDefault();
  const newItem = {
    id: Date.now(),
    vi: document.getElementById('vi').value.trim(),
    zh: document.getElementById('zh').value.trim(),
    pinyin: document.getElementById('pinyin').value.trim(),
    en: document.getElementById('en').value.trim(),
    de: document.getElementById('de').value.trim(),
    hsk: document.getElementById('hsk').value
  };

  vocabList.unshift(newItem);
  saveAndRender();
  document.getElementById('vocab-form').reset();
}

function saveAndRender() {
  localStorage.setItem('polylang_vocab', JSON.stringify(vocabList));
  renderTable();
}

function resetToDefaultData() {
  if (confirm('Bạn có muốn khôi phục lại bộ từ vựng HSK mẫu ban đầu không?')) {
    vocabList = [...defaultHSKDataset];
    saveAndRender();
    alert('Đã khôi phục thành công!');
  }
}

function renderTable() {
  const tbody = document.getElementById('vocab-table-body');
  document.getElementById('vocab-count').innerText = vocabList.length;
  tbody.innerHTML = '';

  if (vocabList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">Chưa có từ vựng nào.</td></tr>`;
    return;
  }

  vocabList.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50 transition-colors";
    tr.innerHTML = `
      <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold">${item.hsk}</span></td>
      <td class="p-3 font-bold text-slate-800">${item.zh}</td>
      <td class="p-3 text-slate-500">${item.pinyin || '-'}</td>
      <td class="p-3">${item.vi}</td>
      <td class="p-3">${item.en}</td>
      <td class="p-3">${item.de}</td>
      <td class="p-3 text-center">
        <button onclick="deleteItem(${item.id})" class="text-red-400 hover:text-red-600 p-1"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteItem(id) {
  vocabList = vocabList.filter(item => item.id !== id);
  saveAndRender();
}

function clearAllData() {
  if (confirm('Bạn có chắc muốn xóa sạch toàn bộ từ vựng?')) {
    vocabList = [];
    saveAndRender();
  }
}

function exportJSON() {
  if (vocabList.length === 0) return alert('Chưa có dữ liệu để xuất!');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabList, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `polylang_hsk_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// --- LOGIC FLASHCARD & QUIZ (TAB 2) ---
function toggleHskFilter(hsk) {
  const btn = document.querySelector(`[data-hsk="${hsk}"]`);
  if (selectedHSK.includes(hsk)) {
    selectedHSK = selectedHSK.filter(item => item !== hsk);
    btn.className = "hsk-filter-btn px-3 py-1 rounded-full border text-xs font-semibold bg-white border-slate-200 text-slate-400";
  } else {
    selectedHSK.push(hsk);
    btn.className = "hsk-filter-btn px-3 py-1 rounded-full border text-xs font-semibold bg-indigo-50 border-indigo-300 text-indigo-700";
  }
  startQuiz();
}

function startQuiz() {
  const quizContainer = document.getElementById('quiz-container');
  const noQuizMsg = document.getElementById('no-quiz-msg');

  const filteredList = vocabList.filter(item => selectedHSK.includes(item.hsk));

  if (filteredList.length === 0) {
    quizContainer.classList.add('hidden');
    noQuizMsg.classList.remove('hidden');
    return;
  }

  noQuizMsg.classList.add('hidden');
  quizContainer.classList.remove('hidden');

  const randomIndex = Math.floor(Math.random() * filteredList.length);
  currentCard = filteredList[randomIndex];

  document.getElementById('quiz-form').reset();
  document.getElementById('solution-box').classList.add('hidden');
  document.getElementById('card-pinyin-hint').classList.add('hidden');
  document.getElementById('btn-submit').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');

  ['vi', 'en', 'de'].forEach(lang => {
    const input = document.getElementById(`ans-${lang}`);
    const fb = document.getElementById(`feedback-${lang}`);
    input.disabled = false;
    input.className = "w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-400 outline-none text-sm bg-white";
    fb.classList.add('hidden');
  });

  document.getElementById('card-hsk').innerText = currentCard.hsk;
  document.getElementById('card-zh').innerText = currentCard.zh;
  document.getElementById('card-pinyin').innerText = currentCard.pinyin || 'Chưa có';
}

function normalizeStr(str) {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function checkAnswers(e) {
  e.preventDefault();
  if (!currentCard) return;

  const userAnswers = {
    vi: document.getElementById('ans-vi').value,
    en: document.getElementById('ans-en').value,
    de: document.getElementById('ans-de').value
  };

  ['vi', 'en', 'de'].forEach(lang => {
    const inputField = document.getElementById(`ans-${lang}`);
    const fb = document.getElementById(`feedback-${lang}`);
    inputField.disabled = true;

    const isCorrect = normalizeStr(userAnswers[lang]) === normalizeStr(currentCard[lang]);

    fb.classList.remove('hidden');
    if (isCorrect) {
      inputField.className = "w-full border rounded-lg p-2.5 outline-none text-sm border-emerald-500 bg-emerald-50 text-emerald-900";
      fb.className = "text-xs mt-1 font-semibold text-emerald-600";
      fb.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Chính xác!`;
    } else {
      inputField.className = "w-full border rounded-lg p-2.5 outline-none text-sm border-rose-500 bg-rose-50 text-rose-900";
      fb.className = "text-xs mt-1 font-semibold text-rose-600";
      fb.innerHTML = `<i class="fa-solid fa-circle-xmark mr-1"></i> Chưa đúng (Đáp án: <b>${currentCard[lang]}</b>)`;
    }
  });

  document.getElementById('card-pinyin-hint').classList.remove('hidden');
  document.getElementById('sol-zh').innerText = currentCard.zh;
  document.getElementById('sol-pinyin').innerText = currentCard.pinyin || 'Không có';
  document.getElementById('sol-vi').innerText = currentCard.vi;
  document.getElementById('sol-en').innerText = currentCard.en;
  document.getElementById('sol-de').innerText = currentCard.de;
  document.getElementById('solution-box').classList.remove('hidden');

  document.getElementById('btn-submit').classList.add('hidden');
  document.getElementById('btn-next').classList.remove('hidden');
}

function nextCard() {
  startQuiz();
}