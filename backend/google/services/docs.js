import { googleFetch } from "../client.js";
const base="https://docs.googleapis.com/v1/documents";
export const docs={get:(env,id)=>googleFetch(env,`${base}/${encodeURIComponent(id)}`),create:(env,title)=>googleFetch(env,base,{method:"POST",body:{title}}),batchUpdate:(env,id,requests)=>googleFetch(env,`${base}/${encodeURIComponent(id)}:batchUpdate`,{method:"POST",body:{requests}})};
