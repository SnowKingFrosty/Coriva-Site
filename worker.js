import { createRemoteJWKSet, jwtVerify } from 'jose';
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const MAX = 2 * 1024 * 1024;
export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim());
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (status, error) => Response.json(typeof error === 'string' ? {error} : error,{status,headers});
  if (!origin || !allowed.includes(origin)) return reply(403,'This website is not authorized for uploads.');
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/upload') return reply(404,'Not found.');
  if (!env.IMAGEKIT_PRIVATE_KEY) return reply(503,'The site owner must configure the ImageKit private key in the upload service.');
  let uid;
  try {
   const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
   if (!token) return reply(401,'Sign in before uploading.');
   const {payload} = await jwtVerify(token,keys,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,audience:env.FIREBASE_PROJECT_ID});
   if (!payload.sub || payload.sub.length>128 || !payload.iat || payload.iat>Date.now()/1000 || payload.firebase?.sign_in_provider==='anonymous') return reply(401,'Sign in with your Coriva account.');
   uid = payload.sub;
  } catch {return reply(401,'Your sign-in could not be verified. Sign in again.');}
  if (!env.UPLOAD_LIMITER || !(await env.UPLOAD_LIMITER.limit({key:uid})).success) return reply(429,'Too many uploads. Wait a minute and retry.');
  try {
   if (Number(request.headers.get('Content-Length'))>MAX+65536) return reply(413,'Upload exceeds 2 MB after compression.');
   // Bound the streamed body as well, including requests without Content-Length.
   const reader=request.body?.getReader(); if(!reader)return reply(400,'No file received.');
   let size=0; const chunks=[];
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX+65536){await reader.cancel();return reply(413,'Upload exceeds 2 MB after compression.');}chunks.push(value);}
   const form=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData();
   const file=form.get('file');
   const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','video/mp4':'mp4','video/webm':'webm'};
   if(!file || typeof file==='string' || !extensions[file.type] || file.size===0 || file.size>MAX)return reply(400,'Use JPG, PNG, WebP, GIF, MP4, or WebM up to 2 MB after compression.');
   const body=new FormData();body.set('file',file,`media.${extensions[file.type]}`);
   body.set('fileName',`${crypto.randomUUID()}.${extensions[file.type]}`);
   body.set('folder',`/coriva/${encodeURIComponent(uid)}`);body.set('useUniqueFileName','true');body.set('overwriteFile','false');
   const result=await fetch('https://upload.imagekit.io/api/v1/files/upload',{method:'POST',headers:{Authorization:'Basic '+btoa(env.IMAGEKIT_PRIVATE_KEY+':')},body,signal:AbortSignal.timeout(35000)});
   const data=await result.json();
   if(!result.ok)return reply(502,'ImageKit rejected the upload. The site owner should check the API key and account storage allowance.');
   if(!data.url?.startsWith('https://'))return reply(502,'ImageKit did not return a valid image URL.');
   return reply(200,{url:data.url,fileId:data.fileId});
  }catch(error){return reply(502,error.name==='TimeoutError'?'ImageKit did not respond in time. Retry the upload.':'The upload service could not process this file. Please retry.');}
 }
};
