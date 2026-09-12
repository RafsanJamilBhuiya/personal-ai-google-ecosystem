import { googleFetch } from "../client.js";
const base="https://www.googleapis.com/blogger/v3";
export const blogger={blogs:(env,blogId)=>googleFetch(env,`${base}/blogs/${encodeURIComponent(blogId)}`),posts:(env,blogId,params={})=>{const p=new URLSearchParams(params);return googleFetch(env,`${base}/blogs/${encodeURIComponent(blogId)}/posts?${p}`)},createPost:(env,blogId,post)=>googleFetch(env,`${base}/blogs/${encodeURIComponent(blogId)}/posts`,{method:"POST",body:post})};
