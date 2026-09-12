import { googleFetch } from "../client.js";
const base="https://www.googleapis.com/drive/v3";
export const drive={list:(env,q="trashed=false",pageSize=100)=>googleFetch(env,`${base}/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=files(id,name,mimeType,parents,modifiedTime),nextPageToken`),get:(env,id)=>googleFetch(env,`${base}/files/${encodeURIComponent(id)}?fields=*`),create:(env,metadata)=>googleFetch(env,`${base}/files`,{method:"POST",body:metadata})};
