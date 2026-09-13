import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=['README.md','.gitignore','.env.example','LICENSE','package.json','package-lock.json','wrangler.toml','backend/worker.js','backend/integrations/registry.js','backend/security/auth.js','frontend/index.html','frontend/css/app.css','frontend/js/app.js','frontend/js/auth-guard.js','frontend/pages/login.html','frontend/pages/admin-profile.html','frontend/pages/app-integrations.html'];
const pages=['dashboard','chat','tasks','sheets','drive','gmail','calendar','docs','forms','blogger','maps','ai-providers','logs','settings'];
const missing=[...required,...pages.map(x=>`frontend/pages/${x}.html`)].filter(x=>!fs.existsSync(path.join(root,x)));
if(missing.length){console.error('Missing:',missing.join('\n'));process.exit(1)}
console.log(`Structure check passed: ${required.length+pages.length} required runtime/page files.`);
