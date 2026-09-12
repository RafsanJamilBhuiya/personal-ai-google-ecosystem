import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
test('required runtime files exist',()=>{for(const f of ['package.json','package-lock.json','wrangler.toml','backend/worker.js','frontend/index.html','frontend/js/app.js','frontend/css/app.css']) assert.equal(fs.existsSync(path.join(root,f)),true,f);});
test('all planned pages exist',()=>{const pages=['dashboard','chat','tasks','sheets','drive','gmail','calendar','docs','forms','blogger','maps','ai-providers','logs','settings'];for(const p of pages)assert.equal(fs.existsSync(path.join(root,'frontend/pages',`${p}.html`)),true,p);});
