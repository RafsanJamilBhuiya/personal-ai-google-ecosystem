/* GitHub Pages-only runtime mode.
 * No external backend is required for the static UI shell.
 * Data is persisted locally in the browser; Google APIs can be connected
 * from the browser using Google Identity Services when configured.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'personal-ai-pages-runtime-v1';

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeState(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  window.PersonalAIPages = {
    mode: 'github-pages-only',
    backend: false,
    realtime: 'browser-local',
    storage: 'localStorage',
    readState,
    writeState,
    saveTask(task) {
      const state = readState();
      state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
      state.tasks.unshift({
        task_id: task.task_id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        status: task.status || 'local',
        command: task.command || '',
        result: task.result || null
      });
      writeState(state);
      return state.tasks[0];
    },
    saveChat(message) {
      const state = readState();
      state.chat_history = Array.isArray(state.chat_history) ? state.chat_history : [];
      state.chat_history.push({
        message_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...message
      });
      writeState(state);
    }
  };
})();
