import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateStructured,geminiConfig} from '../server/gemini.mjs';
const args={instructions:'Use somente o documento.',input:{documents:[{page:1,text:'Edital público.'}]},schema:{type:'object',properties:{fields:{type:'array',items:{type:'object'}}},required:['fields']}};
const response=(status,data)=>({ok:status===200,status,json:async()=>data});
const success=()=>response(200,{candidates:[{finishReason:'STOP',content:{parts:[{text:'{"fields":[]}'}]}}],usageMetadata:{promptTokenCount:25,candidatesTokenCount:10,thoughtsTokenCount:3,totalTokenCount:38}});
test('Gemini usa chave em cabeçalho, destino fixo e JSON estruturado; contabiliza tokens',async()=>{
 const prev=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='private-test-only';
 try{const out=await generateStructured(args,async(url,r)=>{assert.equal(new URL(url).hostname,'generativelanguage.googleapis.com');assert.equal(new URL(url).search,'');assert.equal(r.headers['x-goog-api-key'],'private-test-only');assert.equal(r.redirect,'error');assert.equal(r.body.includes('private-test-only'),false);const b=JSON.parse(r.body);assert.equal(b.generationConfig.responseMimeType,'application/json');assert.deepEqual(b.generationConfig.responseJsonSchema,args.schema);assert.equal(b.systemInstruction.parts[0].text,args.instructions);return success();});assert.deepEqual(out.parsed,{fields:[]});assert.equal(out.usage.output_tokens,13);
 }finally{if(prev===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=prev;}
});
test('cota temporária repete com espera; cota diária não entra em repetição',async()=>{
 const prev=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test';
 try{let calls=0;const sleeps=[];const out=await generateStructured(args,async()=>++calls===1?response(429,{error:{details:[{retryDelay:'20s'}]}}):success(),{sleep:async ms=>sleeps.push(ms)});assert.equal(calls,2);assert.equal(sleeps[0],20000);assert.ok(out.parsed);
 calls=0;await assert.rejects(()=>generateStructured(args,async()=>{calls++;return response(429,{error:{details:[{quotaId:'GenerateRequestsPerDay',quotaValue:'0'}]}});},{sleep:async()=>{throw Error('Não deveria esperar');}}),e=>e.status===502&&/cota/.test(e.message));assert.equal(calls,1);
 }finally{if(prev===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=prev;}
});
test('chave ausente, modelo inseguro, bloqueio e autenticação falham sem vazar segredo',async()=>{
 assert.throws(()=>geminiConfig({}),e=>e.status===503);assert.throws(()=>geminiConfig({GEMINI_API_KEY:'x',GEMINI_MODEL:'https://malicious.test'}),e=>e.status===400);
 const prev=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='private-test-only';try{
 await assert.rejects(()=>generateStructured(args,async()=>response(403,{error:{message:'secret private-test-only'}})),e=>e.status===502&&!e.message.includes('private-test-only'));
 await assert.rejects(()=>generateStructured(args,async()=>response(200,{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"fields":[]}'}]}}]})),e=>e.status===502);
 }finally{if(prev===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=prev;}
});
