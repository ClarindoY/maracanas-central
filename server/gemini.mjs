import {setTimeout as pause} from 'node:timers/promises';
import {fail} from './workspace.mjs';
let nextRequest=0;
export function geminiConfig(env=process.env){
 const key=env.GEMINI_API_KEY?.trim();if(!key)fail(503,'Configure GEMINI_API_KEY no Render para habilitar o resumo pelo Gemini.');
 const model=env.GEMINI_MODEL||'gemini-3.5-flash-lite';if(!/^gemini-[a-zA-Z0-9._-]+$/.test(model))fail(400,'GEMINI_MODEL inválido. Use apenas o nome do modelo.');
 return {key,model};
}
export async function generateStructured({instructions,input,schema,onWaiting=()=>{}},fetcher=fetch,{sleep=pause,interval=fetcher===fetch?15000:0,maxRetries=2}={}){
 const {key,model}=geminiConfig();
 for(let attempt=0;attempt<=maxRetries;attempt++){
 const remaining=nextRequest-Date.now();if(interval>0&&remaining>0){onWaiting('Aguardando intervalo entre chamadas ao Gemini');await sleep(remaining);}
 nextRequest=Date.now()+interval;
 let response;try{response=await fetcher('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',redirect:'error',signal:AbortSignal.timeout(120000),headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:JSON.stringify(input)}]}],generationConfig:{maxOutputTokens:12000,responseMimeType:'application/json',responseJsonSchema:schema}})});}catch{fail(502,'Não foi possível conectar ao Gemini ou a resposta excedeu o tempo. O resumo anterior foi preservado.');}
 let data;try{data=await response.json();}catch{fail(502,'O Gemini retornou uma resposta inválida. O resumo anterior foi preservado.');}
 if(!response.ok){
 if(response.status===401||response.status===403)fail(502,'O Gemini recusou a chave ou as permissões (HTTP '+response.status+'). Confira GEMINI_API_KEY e o projeto no Google AI Studio.');
 if(response.status===404)fail(502,'Modelo Gemini indisponível neste projeto (HTTP 404). Confira GEMINI_MODEL e os modelos disponíveis no AI Studio.');
 if(response.status===429){const details=JSON.stringify(data.error?.details||[]);const hardLimit=/PerDay|per.day|RequestsPerDay|"quotaValue"\s*:\s*"?0/i.test(details);if(!hardLimit&&attempt<maxRetries){
 const hint=data.error?.details?.find(x=>x.retryDelay)?.retryDelay;const header=Number(response.headers?.get?.('retry-after'));const suggested=header>0?header:Number.parseFloat(hint);const wait=Math.max(15000,Number.isFinite(suggested)?suggested*1000:15000*(attempt+1));if(wait<=60000){onWaiting('Limite temporário do Gemini: aguardando para repetir a chamada');await sleep(wait);continue;}}
 fail(502,'Limite ou cota do Gemini atingido (HTTP 429). Confira Usage e Rate limits no Google AI Studio; o gratuito tem limites por projeto. O resumo anterior foi preservado.');}
 if(response.status>=500&&attempt<maxRetries){onWaiting('Gemini temporariamente indisponível: repetindo a chamada');await sleep(5000*(attempt+1));continue;}
 fail(502,'O Gemini recusou a solicitação (HTTP '+response.status+'). Confira o modelo e a configuração. O resumo anterior foi preservado.');}
 const candidate=data.candidates?.[0];if(candidate?.finishReason!=='STOP'||data.promptFeedback?.blockReason)fail(502,'O Gemini não concluiu esta parte (resposta interrompida ou bloqueada). O resumo anterior foi preservado.');
 const text=(candidate.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('');let parsed;try{parsed=JSON.parse(text);}catch{fail(502,'O Gemini não retornou JSON válido. O resumo anterior foi preservado.');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(502,'Formato do resumo Gemini inválido. O resumo anterior foi preservado.');
 const m=data.usageMetadata||{};return {parsed,model,usage:{input_tokens:m.promptTokenCount||0,output_tokens:(m.candidatesTokenCount||0)+(m.thoughtsTokenCount||0),total_tokens:m.totalTokenCount||0}};
 }
}
