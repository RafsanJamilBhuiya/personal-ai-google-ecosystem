/* Pages-only activation helper. Safe for static hosting. */
(function(){
  'use strict';
  const KEY='personal-ai-pages-runtime-v1';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}}
  function write(v){localStorage.setItem(KEY,JSON.stringify(v))}
  window.PersonalAIPages={
    mode:'github-pages-only', backend:false, storage:'localStorage',
    state:read,
    save:write,
    addTask(command){const s=read();s.tasks=Array.isArray(s.tasks)?s.tasks:[];const t={task_id:crypto.randomUUID(),created_at:new Date().toISOString(),command,status:'local'};s.tasks.unshift(t);write(s);return t},
    addChat(role,message){const s=read();s.chat_history=Array.isArray(s.chat_history)?s.chat_history:[];s.chat_history.push({message_id:crypto.randomUUID(),timestamp:new Date().toISOString(),role,message});write(s)}
  };
})();
