import { googleFetch } from "../client.js";
const base="https://forms.googleapis.com/v1/forms";
export const forms={get:(env,id)=>googleFetch(env,`${base}/${encodeURIComponent(id)}`),create:(env,info)=>googleFetch(env,base,{method:"POST",body:{info}}),batchUpdate:(env,id,requests)=>googleFetch(env,`${base}/${encodeURIComponent(id)}:batchUpdate`,{method:"POST",body:{requests}})};
