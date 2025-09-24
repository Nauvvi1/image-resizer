const el = (id) => document.getElementById(id);

const fileInput = el('fileInput');
const pickBtn = el('pickBtn');
const dropzone = el('dropzone');
const fileInfo = el('fileInfo');

const formatEl = el('format');
const qualityEl = el('quality');
const qualityVal = el('qualityVal');
const losslessEl = el('lossless');
const widthEl = el('width');
const heightEl = el('height');
const fitEl = el('fit');
const enlargeEl = el('enlarge');
const preserveMetaEl = el('preserveMeta');
const noBiggerEl = el('noBigger');

const processBtn = el('processBtn');
const downloadBtn = el('downloadBtn');
const statusEl = el('status');

const previewIn = el('previewIn');
const previewOut = el('previewOut');
const metaIn = el('metaIn');
const metaOut = el('metaOut');

let originalFile = null;
let outputBlob = null;

qualityEl.addEventListener('input', () => qualityVal.textContent = qualityEl.value);
pickBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag');
}));
['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag');
}));
dropzone.addEventListener('drop', e => {
  const f = e.dataTransfer.files?.[0];
  if (f) handleFile(f);
});

function handleFile(file) {
  originalFile = file;
  fileInfo.classList.remove('hidden');
  fileInfo.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type}`;
  const url = URL.createObjectURL(file);
  previewIn.src = url;
  metaIn.textContent = `${file.type}, ${(file.size / 1024).toFixed(1)} KB`;
  previewOut.src = '';
  metaOut.textContent = '—';
  outputBlob = null;
  downloadBtn.disabled = true;
}

processBtn.addEventListener('click', async () => {
  if (!originalFile) return;
  try {
    statusEl.textContent = 'Processing…';
    const fd = new FormData();
    fd.append('image', originalFile);
    fd.append('format', formatEl.value);
    fd.append('quality', qualityEl.value);
    fd.append('lossless', losslessEl.checked ? 'true' : 'false');
    if (widthEl.value) fd.append('width', widthEl.value);
    if (heightEl.value) fd.append('height', heightEl.value);
    fd.append('fit', fitEl.value);
    fd.append('enlarge', enlargeEl.checked ? 'true' : 'false');
    fd.append('preserveMeta', preserveMetaEl.checked ? 'true' : 'false');
    fd.append('noBiggerThanOriginal', noBiggerEl.checked ? 'true' : 'false');

    const res = await fetch('/api/resize', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    outputBlob = blob;

    const outUrl = URL.createObjectURL(blob);
    previewOut.src = outUrl;
    metaOut.textContent = `${blob.type || 'image/*'}, ${(blob.size / 1024).toFixed(1)} KB (Δ ${Math.round((blob.size - originalFile.size) / 1024)} KB)`;
    statusEl.textContent = (blob.size <= originalFile.size) ? 'Done ✓ (smaller or equal)' : 'Done ✓ (may be larger)';
    downloadBtn.disabled = false;
  } catch (e) {
    console.error(e);
    statusEl.textContent = 'Error: ' + e.message;
  }
});

downloadBtn.addEventListener('click', () => {
  if (!outputBlob || !originalFile) return;
  const ext = formatEl.value === 'jpeg' ? 'jpg' : formatEl.value;
  const name = originalFile.name.replace(/\.[^.]+$/, '') + '.' + ext;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(outputBlob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
});
