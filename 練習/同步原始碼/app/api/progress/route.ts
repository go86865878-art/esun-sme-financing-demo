import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validEvent } from '../../../public/cloud-model.mjs';
export const dynamic='force-dynamic';
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return response({error:'sign_in_required'},401);
 if(!env.DB)return response({error:'storage_unavailable'},503);
 const result=await env.DB.prepare('SELECT payload FROM study_events WHERE user_id = ? ORDER BY created_at, event_id').bind(user.userId).all();
 return response({userId:user.userId,events:result.results.map((row:any)=>JSON.parse(row.payload))});
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return response({error:'sign_in_required'},401);
 const origin=request.headers.get('Origin');
 if(origin!==new URL(request.url).origin)return response({error:'origin_not_allowed'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return response({error:'json_required'},415);
 if(Number(request.headers.get('Content-Length'))>1000000)return response({error:'too_large'},413);
 let body;try{const raw=await request.text();if(raw.length>1000000)return response({error:'too_large'},413);body=JSON.parse(raw);}catch{return response({error:'invalid_json'},400);}
 if(!body||!Array.isArray(body.events)||body.events.length>100||!body.events.every(validEvent))return response({error:'invalid_events'},400);
 if(!env.DB)return response({error:'storage_unavailable'},503);
 if(body.events.length)await env.DB.batch(body.events.map((e:any)=>env.DB!.prepare('INSERT OR IGNORE INTO study_events (user_id, event_id, payload, created_at) VALUES (?, ?, ?, ?)').bind(user.userId,e.id,JSON.stringify(e),e.at)));
 return response({accepted:body.events.map((e:any)=>e.id)});
}
