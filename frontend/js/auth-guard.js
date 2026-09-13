import { api } from './api.js';
export async function requireAdmin(){try{const s=await api('/api/auth/status');if(!s.authenticated){location.replace('./login.html');return null;}return s;}catch{location.replace('./login.html');return null;}}
export async function logoutAdmin(){await api('/api/auth/logout',{method:'POST'}).catch(()=>{});location.replace('./login.html');}
