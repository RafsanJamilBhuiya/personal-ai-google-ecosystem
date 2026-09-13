import { api } from './api.js';

const $ = selector => document.querySelector(selector);
const statusBox = $('#setup-status');
const serviceList = $('#google-services');
const dbButton = $('#initialize-db');

function setStatus(message, state = 'info') {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.dataset.state = state;
}

function renderServices(services = []) {
  if (!serviceList) return;
  serviceList.replaceChildren();
  for (const service of services) {
    const row = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = service.name || service.id || 'Google service';
    const detail = document.createElement('span');
    detail.textContent = service.enabled ? ` ${service.status || 'ready'}` : ' disabled';
    row.append(label, detail);
    serviceList.appendChild(row);
  }
}

async function loadStatus() {
  try {
    const result = await api('/api/google/setup/status');
    const auth = result.auth || {};
    renderServices(result.services || []);
    if (auth.connected) {
      setStatus('Google connected. The one-time connection is stored for reuse.', 'online');
      if (dbButton) dbButton.disabled = false;
    } else {
      setStatus('Google is not connected yet. Start the connection once below.', 'offline');
    }
  } catch (error) {
    setStatus(error.message || 'Worker is not configured or reachable.', 'error');
  }
}

$('#connect-google')?.addEventListener('click', async () => {
  try {
    setStatus('Preparing Google authorization…');
    const result = await api('/api/google/auth/url');
    window.location.href = result.authorization_url;
  } catch (error) {
    setStatus(error.message || 'Unable to start Google authorization.', 'error');
  }
});

dbButton?.addEventListener('click', async () => {
  try {
    dbButton.disabled = true;
    setStatus('Initializing the Personal AI System Database…');
    const result = await api('/api/google/database/initialize', { method: 'POST', body: '{}' });
    setStatus(`Database ready: ${result.result?.spreadsheetId || 'configured spreadsheet'}.`, 'online');
  } catch (error) {
    setStatus(error.message || 'Database initialization failed.', 'error');
    dbButton.disabled = false;
  }
});

$('#disconnect-google')?.addEventListener('click', async () => {
  try {
    await api('/api/google/auth/disconnect', { method: 'POST', body: '{}' });
    setStatus('Google disconnected.', 'offline');
    if (dbButton) dbButton.disabled = true;
    await loadStatus();
  } catch (error) {
    setStatus(error.message || 'Unable to disconnect Google.', 'error');
  }
});

loadStatus();
