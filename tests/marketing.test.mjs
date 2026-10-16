import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openAuth} from '../server/auth.mjs';
import {openMarketing,marketingRequest,validateBrief} from '../server/marketing.mjs';
import {DEFAULT_BRIEF,TECHNIQUES,EMPTY_PROFILE,OBJECTIVES,STYLES} from '../shared/marketing.mjs';
const content={title:'Café especial',blocks:[{heading:'Uma pausa melhor',text:'Descubra o sabor do café da sua região.',visual:'Xícara sobre mesa clara'}],caption:'',cta:'Conheça nossa seleção.',notes:[]};
function fixture(generate=async()=>({parsed:structuredClone(content),model:'fake-test',usage:{total_tokens:10}})){
 const auth=openAuth(':memory:');for(const id of ['a','b'])auth.db.prepare('INSERT INTO users(id,name,login,email,password,permissions) VALUES(?,?,?,?,?,?)').run(id,id,id,id+'@test.test','unused','[]');return {auth,m:openMarketing(auth,generate),a:{id:'a'},b:{id:'b'}};
}
test('tema livre e todas as opções da referência compõem instruções reais',()=>{
 assert.equal(OBJECTIVES.length,9);assert.equal(STYLES.length,8);assert.equal(TECHNIQUES.length,13);
 const brief=validateBrief({...DEFAULT_BRIEF,topic:'Campanha para cafeteria',techniques:TECHNIQUES.map(([name])=>name)});
 const request=marketingRequest(brief,EMPTY_PROFILE);assert.equal(request.input.brief.topic,'Campanha para cafeteria');assert.equal(request.input.selectedTechniques.length,13);assert.ok(request.input.selectedTechniques.every(t=>t.instruction.length>20));assert.match(request.instructions,/QUALQUER tema/);
 assert.throws(()=>validateBrief({...brief,techniques:['injetar chave']}),e=>e.status===400);
});
test('biblioteca privada, versões, conflito de edição e exclusão isolada',async()=>{
 const {auth,m,a,b}=fixture();try{
 const c=await m.create(a,{...DEFAULT_BRIEF,topic:'Cafeteria'});assert.equal(m.list(a).length,1);assert.equal(m.list(b).length,0);assert.throws(()=>m.get(b,c.id),e=>e.status===404);assert.throws(()=>m.remove(b,c.id,1),e=>e.status===404);
 const next=m.patch(a,c.id,{version:1,data:{...content,title:'Outra versão'},favorite:true,status:'Pronto'});assert.equal(next.version,2);assert.equal(m.versions(a,c.id).length,2);assert.equal(m.versions(a,c.id)[1].data.title,content.title);assert.throws(()=>m.patch(a,c.id,{version:1,status:'Publicado'}),e=>e.status===409);assert.throws(()=>m.remove(a,c.id,1),e=>e.status===409);
 m.remove(a,c.id,2);assert.equal(m.list(a).length,0);assert.equal(auth.db.prepare('SELECT count(*) n FROM marketing_versions').get().n,0);
 }finally{auth.db.close();}
});
test('perfil é privado e utilizado na geração; concorrência de perfil não perde dados',async()=>{
 let sent;const {auth,m,a,b}=fixture(async req=>{sent=req;return {parsed:content,model:'fake',usage:{}};});try{
 m.saveProfile(a,{version:0,data:{...EMPTY_PROFILE,audience:'Clientes de uma cafeteria',voice:'Acolhedor'}});assert.equal(m.profile(b).data.audience,'');assert.throws(()=>m.saveProfile(a,{version:0,data:EMPTY_PROFILE}),e=>e.status===409);
 await m.create(a,{...DEFAULT_BRIEF,topic:'Dia do café'});assert.equal(sent.input.profile.voice,'Acolhedor');
 }finally{auth.db.close();}
});
test('falha de IA não cria registro parcial e libera próxima tentativa',async()=>{
 let count=0;const {auth,m,a}=fixture(async()=>{if(!count++)throw Error('offline');return {parsed:content,model:'fake',usage:{}};});try{
 await assert.rejects(m.create(a,{...DEFAULT_BRIEF,topic:'Teste'}),e=>e.status===502);assert.equal(m.list(a).length,0);await m.create(a,{...DEFAULT_BRIEF,topic:'Teste'});assert.equal(m.list(a).length,1);
 }finally{auth.db.close();}
});
test('mesmo usuário não dispara duas gerações simultâneas',async()=>{
 let finish;const {auth,m,a}=fixture(()=>new Promise(r=>{finish=r;}));try{
 const pending=m.create(a,{...DEFAULT_BRIEF,topic:'Teste'});await assert.rejects(m.create(a,{...DEFAULT_BRIEF,topic:'Duplicado'}),e=>e.status===429);finish({parsed:content,model:'fake',usage:{}});await pending;
 }finally{auth.db.close();}
});
test('post curto acima de 280 caracteres é rejeitado sem gravar',async()=>{
 const {auth,m,a}=fixture(async()=>({parsed:{...content,blocks:[{heading:'',text:'x'.repeat(281),visual:''}]},model:'fake',usage:{}}));try{await assert.rejects(m.create(a,{...DEFAULT_BRIEF,format:'Tweet / post curto',topic:'Teste'}),e=>e.status===502);assert.equal(m.list(a).length,0);}finally{auth.db.close();}
});
