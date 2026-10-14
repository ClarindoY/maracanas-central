import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openAuth,permissions} from '../server/auth.mjs';
import {openWorkspace} from '../server/workspace.mjs';
import {openOperations} from '../server/operations.mjs';
import {deliveryTiming} from '../shared/operations.mjs';
function setup(){const dir=mkdtempSync(join(tmpdir(),'operations-')),auth=openAuth(join(dir,'auth.sqlite'));const users={};for(const [id,name,admin] of [['admin','Gestora',1],['p','Paulo',0],['h','Hellen',0],['v','Vitor',0],['pat','Patrícia',0]]){auth.db.prepare('INSERT INTO users(id,name,login,email,password,admin,permissions) VALUES(?,?,?,?,?,?,?)').run(id,name,id,id+'@test.test','unused',admin,JSON.stringify(permissions));users[id]={id,nome:name,admin:!!admin,permissoes:permissions};}const work=openWorkspace(auth,join(dir,'documents'));const ops=openOperations(work,auth);work.setHooks({observer:ops.notify,viewer:ops.view,guard:ops.guard});ops.configure(users.admin,{sectorCoordinatorId:'p',generalCoordinatorId:'h',profiles:[{id:'p',role:'Coordenador do setor'},{id:'h',role:'Coordenadora geral'},{id:'v',role:'Operacional'},{id:'pat',role:'Operacional'}]});return {auth,work,ops,users,close:()=>{auth.db.close();rmSync(dir,{recursive:true,force:true});}};}
const date=offset=>new Date(Date.now()+offset).toISOString();
test('dashboard real: empresa, responsáveis, cards, tarefas atrasadas, evidência e Hellen notificada',()=>{
 const f=setup();const {work:w,ops:o,users:u}=f;try{const t=w.create(u.v,{titulo:'Hospedagem',fonte:'PNCP'});
 let record=o.detail(u.p,t.id).meta;o.saveMeta(u.p,t.id,{version:record.version,changes:{company:'REP',contract:'Contrato 001',approval:'Aguardando aprovação',analysisNote:'Anexos conferidos',approverId:'h',budget:'Pendente',documentation:'Pendente',strategy:'Pendente',disputeAt:date(3600000),operatorId:'p'}});
 const detail=o.taskSave(u.p,t.id,{changes:{title:'Conferir anexos',sector:'Documentação',owner:'v',due:date(-3600000),status:'Em andamento'}});const task=detail.deliveries[0];let d=o.dashboard(u.v,{company:'REP'});assert.equal(d.counts.found,1);assert.equal(d.counts.approval,1);assert.equal(d.counts.budgetPending,1);assert.equal(d.counts.docsPending,1);assert.equal(d.counts.upcoming,1);assert.equal(d.counts.late,1);assert.equal(d.rows[0].owner,'v');assert.ok(o.notifications(u.h).unread>0);assert.equal(o.notifications(u.v).unread,0);
 assert.equal(o.dashboard(u.v,{company:'Maracanãs'}).totalProcesses,0);assert.equal(o.dashboard(u.v,{owner:'pat'}).counts.late,0);
 assert.throws(()=>o.taskSave(u.p,t.id,{version:task.version,changes:{status:'Concluída'}},task.id),e=>e.status===400);assert.throws(()=>o.taskSave(u.p,t.id,{version:task.version,changes:{due:date(7200000)}},task.id),e=>e.status===400);
 const revised=o.taskSave(u.p,t.id,{version:task.version,changes:{due:date(7200000),reason:'Órgão adiou a entrega'}},task.id).deliveries[0];assert.equal(revised.originalDue,task.due);assert.equal(revised.history.at(-1).reason,'Órgão adiou a entrega');
 assert.throws(()=>o.taskSave(u.pat,t.id,{version:revised.version,changes:{status:'Concluída',evidence:'Conferido'}},task.id),e=>e.status===403);
 const done=o.taskSave(u.v,t.id,{version:revised.version,changes:{status:'Concluída',evidence:'Anexos conferidos com os PDFs oficiais.'}},task.id).deliveries[0];assert.equal(done.updatedBy,'Vitor');d=o.dashboard(u.v,{company:'REP'});assert.equal(d.counts.late,0);assert.equal(d.sectors.find(s=>s.name==='Documentação').done,1);
 const note=o.notifications(u.h).items[0];assert.throws(()=>o.seen(u.v,note.id),e=>e.status===404);assert.ok(o.seen(u.h,note.id).items[0].seen);
 }finally{f.close();}
});
test('aprovação e preparação não são inferidas; coordenação geral confirma resultado com referência',()=>{
 const f=setup();const {work:w,ops:o,users:u}=f;try{const t=w.create(u.v,{titulo:'Pregão A'});const save=(user,changes)=>o.saveMeta(user,t.id,{version:o.detail(user,t.id).meta.version,changes});assert.throws(()=>save(u.p,{budget:'Concluído'}),e=>e.status===400&&/entrega/.test(e.message));assert.throws(()=>save(u.p,{preparationValidated:true}),e=>e.status===400);assert.throws(()=>save(u.p,{approval:'Aprovado',approvalReason:'Validado'}),e=>e.status===403);
 const budgetTask=o.taskSave(u.p,t.id,{changes:{title:'Planilha de custos finalizada',sector:'Orçamento',owner:'p',due:date(3600000),status:'Concluída',evidence:'Cotações revisadas e planilha entregue'}}).deliveries[0];
 save(u.h,{budgetDeliveryId:budgetTask.id,approval:'Aprovado',approvalReason:'Condições comerciais aprovadas',company:'Maracanãs',budget:'Concluído',documentation:'Validada',strategy:'Validada',validationNote:'Documentos e limites conferidos',preparationValidated:true});assert.equal(o.dashboard(u.v).counts.ready,1);assert.throws(()=>save(u.p,{result:'Ganho'}),e=>e.status===400);
 save(u.p,{result:'Ganho parcial',resultNote:'Ata oficial, item 3 confirmado',contract:'Contrato 123',execution:'Em execução'});const d=o.dashboard(u.v);assert.equal(d.resultCounts.partial,1);assert.equal(d.counts.execution,1);assert.equal(d.counts.resultPending,0);
 }finally{f.close();}
});
test('planilha, margens e documentos restritos não vazam nem são sobrescritos por operador',()=>{
 const f=setup();const {work:w,ops:o,users:u}=f;try{const t=w.create(u.admin,{titulo:'Processo privado',manual:{b4_5:'Margem privada'},analysis:{pricing:[{name:'Hotel',quantity:1,unitPrice:100,unitCost:50,taxPercent:0,indirectCost:0,disputable:true}],tasks:[],review:{technical:'',documentary:'',operational:'',financial:'Viável',conclusion:'',reason:'Custos privados'}}});const shown=w.detail(u.v,t.id);assert.deepEqual(shown.analysis.pricing,[]);assert.equal(shown.manual.b4_5,undefined);assert.equal(shown.analysis.review.reason,'');assert.throws(()=>o.budgetView(u.v,t.id),e=>e.status===403);o.budgetView(u.p,t.id);assert.equal(o.detail(u.h,t.id).budgetViews[0].name,'Paulo');assert.equal(o.detail(u.h,t.id).meta.budget,'');
 assert.throws(()=>w.patch(u.v,t.id,{version:w.get(t.id).version,changes:{manual:{b4_5:'Alterada'}}}),e=>e.status===403);
 const safe=w.patch(u.v,t.id,{version:w.get(t.id).version,changes:{analysis:{...shown.analysis,tasks:[{text:'Conferir',owner:'v',due:'2026-12-01',status:'Aberta'}]}}});assert.equal(safe.analysis.pricing.length,1);assert.equal(safe.analysis.review.financial,'Viável');
 const doc=w.upload(u.admin,t.id,'Dados bancarios.pdf',Buffer.from('%PDF-1.7\nteste'));o.restrictDocument(u.p,t.id,doc.id,true);assert.equal(o.documentAllowed(u.v,doc.id),false);assert.equal(w.detail(u.v,t.id).documents.length,0);assert.equal(w.detail(u.p,t.id).documents[0].restricted,true);
 assert.throws(()=>o.restrictDocument(u.v,t.id,doc.id,false),e=>e.status===403);
 }finally{f.close();}
});
test('pendências anteriores entram no dashboard sem inventar setor ou horário e migram sem duplicar',()=>{
 const f=setup();const {work:w,ops:o,users:u}=f;try{const t=w.create(u.admin,{titulo:'Processo anterior',analysis:{pricing:[],tasks:[{text:'Documento ausente',owner:'v',due:'2020-01-01',status:'Aberta'}],review:{technical:'',documentary:'',operational:'',financial:'',conclusion:'',reason:''}}});let d=o.dashboard(u.v);assert.equal(d.counts.late,1);assert.equal(d.rows[0].sector,'');assert.equal(d.rows[0].stageMs,null);assert.equal(d.rows[0].due,'2020-01-01');o.taskSave(u.p,t.id,{changes:{title:'Documento ausente',sector:'Documentação',owner:'v',due:date(-3600000),status:'Aberta',sourceLegacyIndex:0}});d=o.dashboard(u.v);assert.equal(d.counts.late,1);assert.equal(d.rows.length,1);assert.equal(d.rows[0].legacy,false);assert.equal(o.detail(u.p,t.id).legacyPendencies.length,0);
 }finally{f.close();}
});
test('datas locais: vencimento hoje não é atrasado antes do horário; tempo na etapa é independente',()=>{
 const now=Date.parse('2026-10-14T12:00:00-03:00');const timing=deliveryTiming({status:'Em andamento',due:'2026-10-14T13:00:00-03:00',stageStartedAt:'2026-10-13T12:00:00-03:00'},now);assert.equal(timing.today,true);assert.equal(timing.late,false);assert.equal(timing.stageMs,86400000);const dateOnly=deliveryTiming({status:'Aberta',due:'2026-10-14'},now);assert.equal(dateOnly.today,true);assert.equal(dateOnly.late,false);assert.equal(dateOnly.stageMs,null);
});
