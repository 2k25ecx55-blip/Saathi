const state = {
  language: 'en',
  currentTab: 'file', // 'file' or 'paste'
  selectedFile: null,
  fileBase64: null,
  fileText: null,
  pasteText: '',
  cameraStream: null,
  facingMode: 'environment',
  isAnalyzing: false,
  analysisResult: null,
  chatMessages: [],
  contacts: []
};

// UI Elements
const els = {
  langSelect: document.getElementById('language-select'),
  tabFileBtn: document.getElementById('tab-file-btn'),
  tabPasteBtn: document.getElementById('tab-paste-btn'),
  fileView: document.getElementById('file-view'),
  pasteView: document.getElementById('paste-view'),
  pasteTextarea: document.getElementById('paste-textarea'),
  analyzeBtn: document.getElementById('analyze-btn'),
  
  // File / Camera
  dropZone: document.getElementById('drop-zone'),
  fileEmptyUi: document.getElementById('file-empty-ui'),
  fileSelectedUi: document.getElementById('file-selected-ui'),
  fileName: document.getElementById('file-name'),
  clearFileBtn: document.getElementById('clear-file'),
  fileInput: document.getElementById('file-input'),
  startCameraBtn: document.getElementById('start-camera'),
  browseBtn: document.getElementById('browse-btn'),
  
  cameraUi: document.getElementById('camera-ui'),
  cameraVideo: document.getElementById('camera-video'),
  cameraCanvas: document.getElementById('camera-canvas'),
  closeCameraBtn: document.getElementById('close-camera'),
  capturePhotoBtn: document.getElementById('capture-photo'),
  flipCameraBtn: document.getElementById('flip-camera'),
  
  capturedUi: document.getElementById('captured-ui'),
  capturedPreview: document.getElementById('captured-preview'),
  retakePhotoBtn: document.getElementById('retake-photo'),
  
  errorAlert: document.getElementById('error-alert'),
  errorMessage: document.getElementById('error-message'),
  
  // Sections
  uploadZone: document.getElementById('upload-zone'),
  loadingState: document.getElementById('loading-state'),
  resultsState: document.getElementById('results-state'),
  
  // Results
  changeDocBtn: document.getElementById('change-doc-btn'),
  resTabSummary: document.getElementById('res-tab-summary'),
  resTabTodo: document.getElementById('res-tab-todo'),
  resTabDocs: document.getElementById('res-tab-docs'),
  resTabAsk: document.getElementById('res-tab-ask'),
  viewSummary: document.getElementById('view-summary'),
  viewTodo: document.getElementById('view-todo'),
  viewDocs: document.getElementById('view-docs'),
  viewAsk: document.getElementById('view-ask'),
  
  // Dynamic Content Elements
  valDocType: document.getElementById('val-doc-type'),
  valIssuer: document.getElementById('val-issuer'),
  valDate: document.getElementById('val-date'),
  valUrgency: document.getElementById('val-urgency'),
  valSummary: document.getElementById('val-summary'),
  valIfIgnored: document.getElementById('val-if-ignored'),
  panelIfIgnored: document.getElementById('panel-if-ignored'),
  valContacts: document.getElementById('val-contacts'),
  panelContacts: document.getElementById('panel-contacts'),
  valUnclear: document.getElementById('val-unclear'),
  panelUnclear: document.getElementById('panel-unclear'),
  actionsList: document.getElementById('actions-list'),
  noActionsMessage: document.getElementById('no-actions-message'),
  docsList: document.getElementById('docs-list'),
  noDocsMessage: document.getElementById('no-docs-message'),
  
  // Chat
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  chatSubmit: document.getElementById('chat-submit'),
  chatLog: document.getElementById('chat-log'),
  chatEmptyState: document.getElementById('chat-empty-state'),
  chatSampleQuestions: document.getElementById('chat-sample-questions')
};

function applyTranslations() {
  const t = window.translations[state.language];
  if (!t) return;
  
  // Static Header / Body
  document.getElementById('header-app-name').textContent = t.appName;
  document.getElementById('tagline').textContent = t.tagline;
  document.getElementById('subtagline').textContent = t.subtagline;
  document.getElementById('privacy-badge').textContent = t.privacyBadge;
  
  // Upload Zone
  document.getElementById('upload-title').textContent = t.uploadTitle;
  document.getElementById('upload-subtitle').textContent = t.uploadSubtitle;
  document.getElementById('file-tab-title').textContent = t.fileTabTitle;
  document.getElementById('paste-tab-title').textContent = t.pasteTabTitle;
  document.getElementById('drag-drop-text').innerHTML = t.dragDropText + ', or ';
  document.getElementById('take-photo-text').textContent = t.takePhotoText;
  
  els.pasteTextarea.placeholder = t.pastePlaceholder;
  document.getElementById('analyze-btn-text').textContent = t.analyzeButton;
  
  // Results Navigation
  document.getElementById('label-tab-summary').textContent = t.tabSummary;
  document.getElementById('label-tab-todo').textContent = t.tabTodo;
  document.getElementById('label-tab-docs').textContent = t.tabDocs;
  document.getElementById('label-tab-ask').textContent = t.tabAsk;
  
  // Summary Tab
  document.getElementById('lbl-doc-type').textContent = t.typeLabel;
  document.getElementById('lbl-issuer').textContent = t.issuerLabel;
  document.getElementById('lbl-date').textContent = t.dateLabel;
  document.getElementById('lbl-urgency').textContent = t.urgencyLabel;
  
  // Chat Tab
  document.getElementById('lbl-ask-title').innerHTML = `<i data-lucide="message-square" class="w-5 h-5 text-emerald-600"></i> ${t.askTitle}`;
  document.getElementById('lbl-ask-subtitle').textContent = t.askSubtitle;
  document.getElementById('lbl-ask-empty').textContent = t.askEmptyNotice;
  document.getElementById('lbl-ask-warning').textContent = t.askWarningGrounded;
  els.chatInput.placeholder = t.askPlaceholder;
  document.getElementById('lbl-ask-send').textContent = t.askSendButton;
  
  lucide.createIcons();
}

function init() {
  applyTranslations();
  
  els.langSelect.addEventListener('change', (e) => {
    state.language = e.target.value;
    applyTranslations();
  });
  
  els.tabFileBtn.addEventListener('click', () => setUploadTab('file'));
  els.tabPasteBtn.addEventListener('click', () => setUploadTab('paste'));
  
  els.pasteTextarea.addEventListener('input', (e) => {
    state.pasteText = e.target.value;
    checkAnalyzeEnabled();
  });
  
  // File inputs
  els.browseBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  
  els.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); els.dropZone.classList.add('border-emerald-500', 'bg-emerald-50'); });
  els.dropZone.addEventListener('dragleave', () => { els.dropZone.classList.remove('border-emerald-500', 'bg-emerald-50'); });
  els.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('border-emerald-500', 'bg-emerald-50');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  
  els.clearFileBtn.addEventListener('click', clearFile);
  
  // Camera
  els.startCameraBtn.addEventListener('click', startCamera);
  els.closeCameraBtn.addEventListener('click', stopCamera);
  els.flipCameraBtn.addEventListener('click', () => {
    state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
    startCamera();
  });
  els.capturePhotoBtn.addEventListener('click', capturePhoto);
  els.retakePhotoBtn.addEventListener('click', () => {
    els.capturedUi.classList.add('hidden');
    startCamera();
  });
  
  els.analyzeBtn.addEventListener('click', doAnalyze);
  els.changeDocBtn.addEventListener('click', resetApp);
  
  // Result Tabs
  els.resTabSummary.addEventListener('click', () => switchResultTab('summary'));
  els.resTabTodo.addEventListener('click', () => switchResultTab('todo'));
  els.resTabDocs.addEventListener('click', () => switchResultTab('docs'));
  els.resTabAsk.addEventListener('click', () => switchResultTab('ask'));
  
  // Chat
  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChat();
  });
}

function setUploadTab(tab) {
  state.currentTab = tab;
  if (tab === 'file') {
    els.tabFileBtn.classList.add('border-emerald-600', 'text-emerald-700');
    els.tabFileBtn.classList.remove('border-transparent', 'text-slate-500');
    els.tabPasteBtn.classList.remove('border-emerald-600', 'text-emerald-700');
    els.tabPasteBtn.classList.add('border-transparent', 'text-slate-500');
    els.fileView.classList.remove('hidden');
    els.pasteView.classList.add('hidden');
  } else {
    els.tabPasteBtn.classList.add('border-emerald-600', 'text-emerald-700');
    els.tabPasteBtn.classList.remove('border-transparent', 'text-slate-500');
    els.tabFileBtn.classList.remove('border-emerald-600', 'text-emerald-700');
    els.tabFileBtn.classList.add('border-transparent', 'text-slate-500');
    els.pasteView.classList.remove('hidden');
    els.fileView.classList.add('hidden');
  }
  checkAnalyzeEnabled();
}

async function handleFile(file) {
  if (!file) return;
  state.selectedFile = file;
  els.fileName.textContent = file.name;
  els.fileEmptyUi.classList.add('hidden');
  els.fileSelectedUi.classList.remove('hidden');
  els.fileSelectedUi.classList.add('flex');
  
  if (file.type === 'application/pdf') {
    state.fileBase64 = null;
    state.fileText = await extractPdfText(file);
  } else if (file.type.startsWith('image/')) {
    state.fileText = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      // Remove data:image/...;base64,
      const result = e.target.result;
      state.fileBase64 = result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }
  checkAnalyzeEnabled();
}

function clearFile() {
  state.selectedFile = null;
  state.fileBase64 = null;
  state.fileText = null;
  els.fileInput.value = '';
  els.fileEmptyUi.classList.remove('hidden');
  els.fileSelectedUi.classList.add('hidden');
  els.fileSelectedUi.classList.remove('flex');
  checkAnalyzeEnabled();
}

async function extractPdfText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + '\n';
    }
    return fullText;
  } catch (e) {
    showError("Could not read PDF. Make sure it contains extractable text.");
    return null;
  }
}

async function startCamera() {
  els.dropZone.classList.add('hidden');
  els.cameraUi.classList.remove('hidden');
  
  try {
    if (state.cameraStream) stopCamera();
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.facingMode }
    });
    els.cameraVideo.srcObject = state.cameraStream;
  } catch (err) {
    stopCamera();
    showError("Camera access denied or unavailable.");
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
  }
  els.cameraUi.classList.add('hidden');
  if (!state.selectedFile && els.capturedUi.classList.contains('hidden')) {
    els.dropZone.classList.remove('hidden');
  }
}

function capturePhoto() {
  els.cameraCanvas.width = els.cameraVideo.videoWidth;
  els.cameraCanvas.height = els.cameraVideo.videoHeight;
  const ctx = els.cameraCanvas.getContext('2d');
  ctx.drawImage(els.cameraVideo, 0, 0);
  
  const dataUrl = els.cameraCanvas.toDataURL('image/jpeg', 0.8);
  els.capturedPreview.src = dataUrl;
  
  // Save as base64 for LLM
  state.fileBase64 = dataUrl.split(',')[1];
  state.fileText = null;
  state.selectedFile = { type: 'image/jpeg' }; // mock
  
  stopCamera();
  els.cameraUi.classList.add('hidden');
  els.dropZone.classList.add('hidden');
  els.capturedUi.classList.remove('hidden');
  checkAnalyzeEnabled();
}

function checkAnalyzeEnabled() {
  let canAnalyze = false;
  if (state.currentTab === 'file') {
    canAnalyze = !!state.selectedFile && (!!state.fileBase64 || !!state.fileText);
  } else {
    canAnalyze = state.pasteText.trim().length > 10;
  }
  els.analyzeBtn.disabled = !canAnalyze;
}

function showError(msg) {
  els.errorMessage.textContent = msg;
  els.errorAlert.classList.remove('hidden');
  setTimeout(() => els.errorAlert.classList.add('hidden'), 8000);
}

// ----------------------------------------------------
// OLLAMA INTEGRATION
// ----------------------------------------------------
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'llava'; // Use a vision model if images are supported

async function doAnalyze() {
  els.uploadZone.classList.add('hidden');
  els.loadingState.classList.remove('hidden');
  els.loadingState.classList.add('flex');
  
  const lang = state.language;
  const systemPrompt = window.promptBuilder.buildAnalyzeSystemPrompt(lang);
  let messages = [{ role: 'system', content: systemPrompt }];
  
  if (state.currentTab === 'file' && state.fileBase64) {
    messages.push({
      role: 'user',
      content: `Please read and explain this official document image in ${lang}. Output JSON only following the schema.`,
      images: [state.fileBase64]
    });
  } else {
    const text = state.currentTab === 'paste' ? state.pasteText : state.fileText;
    messages.push({
      role: 'user',
      content: window.promptBuilder.buildAnalyzeUserPrompt(text, lang)
    });
  }
  
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        format: 'json',
        stream: false,
        options: { temperature: 0.1 }
      })
    });
    
    if (!res.ok) throw new Error("Ollama returned an error. Ensure CORS is enabled (OLLAMA_ORIGINS='*').");
    
    const data = await res.json();
    let rawContent = data.message.content;
    
    // Clean JSON markdown blocks if any
    rawContent = rawContent.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1');
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      rawContent = rawContent.slice(firstBrace, lastBrace + 1);
    }
    
    const result = JSON.parse(rawContent);
    state.analysisResult = result;
    state.contacts = result.contacts || [];
    renderResults(result);
    
  } catch (err) {
    els.loadingState.classList.add('hidden');
    els.loadingState.classList.remove('flex');
    els.uploadZone.classList.remove('hidden');
    showError("Analysis failed: " + err.message + ". Make sure Ollama is running and CORS is enabled.");
  }
}

function renderResults(res) {
  els.loadingState.classList.add('hidden');
  els.loadingState.classList.remove('flex');
  els.resultsState.classList.remove('hidden');
  
  const t = window.translations[state.language];
  
  els.valDocType.textContent = res.documentType || "Unknown";
  els.valIssuer.textContent = res.issuingAuthority || "Unknown";
  els.valDate.textContent = res.letterDate || "Not mentioned";
  
  // Urgency
  els.valUrgency.textContent = t.urgencyMap[res.urgencyLevel || "LOW"];
  els.valUrgency.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border";
  if (res.urgencyLevel === "CRITICAL") els.valUrgency.classList.add("bg-rose-100", "text-rose-700", "border-rose-200");
  else if (res.urgencyLevel === "HIGH") els.valUrgency.classList.add("bg-orange-100", "text-orange-700", "border-orange-200");
  else els.valUrgency.classList.add("bg-slate-100", "text-slate-600", "border-slate-200");
  
  els.valSummary.textContent = res.summary;
  
  if (res.consequencesIfIgnored) {
    els.panelIfIgnored.classList.remove('hidden');
    els.valIfIgnored.textContent = res.consequencesIfIgnored;
  } else {
    els.panelIfIgnored.classList.add('hidden');
  }
  
  if (res.contacts && res.contacts.length > 0) {
    els.panelContacts.classList.remove('hidden');
    els.valContacts.innerHTML = res.contacts.map(c => `<li><strong>${c.label}:</strong> <span class="font-mono bg-white/50 px-1 rounded">${c.value}</span></li>`).join('');
  } else {
    els.panelContacts.classList.add('hidden');
  }
  
  // Actions
  els.actionsList.innerHTML = '';
  if (res.actionItems && res.actionItems.length > 0) {
    els.noActionsMessage.classList.add('hidden');
    res.actionItems.forEach(act => {
      els.actionsList.innerHTML += `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex gap-4">
          <div class="flex-1">
            <h4 class="font-bold text-slate-900">${act.task}</h4>
            <p class="text-sm text-slate-600 mt-1">${act.whyItMatters}</p>
          </div>
          ${act.deadlineDate ? `
            <div class="text-right">
              <div class="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Deadline</div>
              <div class="font-bold text-slate-900">${act.deadlineDate}</div>
            </div>
          ` : ''}
        </div>
      `;
    });
  } else {
    els.noActionsMessage.classList.remove('hidden');
    els.noActionsMessage.textContent = t.noActionItems;
  }
  
  // Docs
  els.docsList.innerHTML = '';
  if (res.requiredDocuments && res.requiredDocuments.length > 0) {
    els.noDocsMessage.classList.add('hidden');
    res.requiredDocuments.forEach((doc, i) => {
      els.docsList.innerHTML += `
        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <input type="checkbox" class="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600">
          <span class="text-slate-700 font-medium">${doc}</span>
        </label>
      `;
    });
  } else {
    els.noDocsMessage.classList.remove('hidden');
    els.noDocsMessage.textContent = t.noDocs;
  }
  
  // Chat Sample Questions
  const samples = t.sampleQuestions || ["What is the penalty if I miss the deadline?", "Who should I contact for help?"];
  els.chatSampleQuestions.innerHTML = samples.map(q => 
    `<button type="button" class="sample-q text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-700 transition-colors text-left">"${q}"</button>`
  ).join('');
  
  document.querySelectorAll('.sample-q').forEach(btn => {
    btn.addEventListener('click', (e) => {
      els.chatInput.value = e.target.textContent.replace(/"/g, '');
    });
  });
  
  switchResultTab('summary');
}

function switchResultTab(tab) {
  const tabs = ['summary', 'todo', 'docs', 'ask'];
  tabs.forEach(t => {
    const btn = document.getElementById(`res-tab-${t}`);
    const view = document.getElementById(`view-${t}`);
    if (t === tab) {
      btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-800');
      btn.classList.remove('bg-white', 'text-slate-600', 'border-transparent');
      view.classList.remove('hidden');
    } else {
      btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-800');
      btn.classList.add('bg-white', 'text-slate-600', 'border-transparent');
      view.classList.add('hidden');
    }
  });
}

function resetApp() {
  els.resultsState.classList.add('hidden');
  els.uploadZone.classList.remove('hidden');
  state.analysisResult = null;
  state.chatMessages = [];
  els.chatLog.innerHTML = '';
  els.chatLog.classList.add('hidden');
  els.chatEmptyState.classList.remove('hidden');
}

// CHAT logic
async function handleChat() {
  const query = els.chatInput.value.trim();
  if (!query || state.isAnalyzing) return;
  
  els.chatInput.value = '';
  els.chatSubmit.disabled = true;
  state.isAnalyzing = true;
  
  els.chatEmptyState.classList.add('hidden');
  els.chatLog.classList.remove('hidden');
  
  // Add User Message
  state.chatMessages.push({ role: 'user', content: query });
  appendChatMessage('user', query);
  
  // Prep Assistant Message DOM
  const assistantId = 'msg-' + Date.now();
  appendChatMessage('assistant', '', assistantId);
  const msgEl = document.getElementById(assistantId);
  
  // Build prompt
  const docText = state.currentTab === 'paste' ? state.pasteText : (state.fileText || "Document Image Provided");
  const sysPrompt = window.promptBuilder.buildAskSystemPrompt(docText, state.language, state.analysisResult.issuingAuthority, state.contacts);
  
  const apiMessages = [
    { role: 'system', content: sysPrompt },
    ...state.chatMessages
  ];
  
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        stream: true,
        options: { temperature: 0.1 }
      })
    });
    
    if (!res.ok) throw new Error("Failed to stream answer");
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullAnswer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullAnswer += parsed.message.content;
            msgEl.innerHTML = marked.parse(fullAnswer);
          }
        } catch (e) {}
      }
    }
    state.chatMessages.push({ role: 'assistant', content: fullAnswer });
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  } finally {
    state.isAnalyzing = false;
    els.chatSubmit.disabled = false;
  }
}

function appendChatMessage(role, content, id = null) {
  const isUser = role === 'user';
  const html = `
    <div class="flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}">
      ${!isUser ? `<div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm text-xs font-bold">सा</div>` : ''}
      <div ${id ? `id="${id}"` : ''} class="max-w-[85%] p-3.5 rounded-2xl text-sm ${isUser ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-900 rounded-bl-none'}">
        ${isUser ? content : marked.parse(content)}
      </div>
      ${isUser ? `<div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"><i data-lucide="user" class="w-4 h-4"></i></div>` : ''}
    </div>
  `;
  els.chatLog.insertAdjacentHTML('beforeend', html);
  lucide.createIcons();
  els.chatLog.parentElement.scrollTop = els.chatLog.parentElement.scrollHeight;
}

// Start
init();
