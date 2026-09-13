(function () {
  'use strict';
  const stateKey = 'personal-ai-pages-runtime-v1';
  const state = () => {
    try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); }
    catch (_) { return {}; }
  };
  const save = (value) => localStorage.setItem(stateKey, JSON.stringify(value));

  window.PersonalAIPages = {
    mode: 'github-pages-only',
    backend: false,
    storage: 'localStorage',
    getState: state,
    setState: save,
    createTask(command) {
      const current = state();
      current.tasks = Array.isArray(current.tasks) ? current.tasks : [];
      const task = {
        task_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        command,
        status: 'local'
      };
      current.tasks.unshift(task);
      save(current);
      return task;
    },
    addChat(role, message) {
      const current = state();
      current.chat_history = Array.isArray(current.chat_history) ? current.chat_history : [];
      current.chat_history.push({
        message_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        role,
        message
      });
      save(current);
    }
  };
})();
