export const COMPANIES=['REP','Maracanãs','REP MAR'];
export const SECTORS=['Captação','Orçamento','Documentação','Disputa','Execução'];
export const ROLES=['Operacional','Coordenador do setor','Coordenadora geral','Gerência'];
export const DELIVERY_STATES=['Aberta','Em andamento','Em revisão','Aguardando informação','Bloqueada','Concluída'];
export const PROCESS_OPTIONS={approval:['','Aguardando aprovação','Aprovado','Não aprovado'],budget:['','Pendente','Em elaboração','Em revisão','Concluído'],documentation:['','Pendente','Em conferência','Validada'],strategy:['','Pendente','Em revisão','Validada'],result:['','Aguardando resultado','Ganho','Não ganho','Ganho parcial'],execution:['','Em execução','Concluída']};
export const CARDS=[['found','Editais encontrados'],['approval','Aguardando aprovação'],['budgetPending','Orçamentos pendentes'],['budgetReview','Orçamentos em análise'],['docsPending','Documentação pendente'],['ready','Prontos para disputa'],['upcoming','Disputas próximas'],['resultPending','Aguardando resultado'],['results','Ganhos / não ganhos'],['execution','Em execução'],['late','Tarefas atrasadas']];
export const readyForDispute=(meta,tender)=>meta.approval==='Aprovado'&&meta.budget==='Concluído'&&meta.documentation==='Validada'&&meta.strategy==='Validada'&&meta.preparationValidated===true&&tender.readingReport?.complete!==false;
export const brazilDay=time=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));
export function deliveryTiming(task,now=Date.now()){
 const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(task.due||'');const active=task.status!=='Concluída';const stage=task.stageStartedAt||task.createdAt;const end=task.completedAt?Date.parse(task.completedAt):now;
 return {late:active&&!!task.due&&(dateOnly?brazilDay(now)>task.due:Date.parse(task.due)<now),today:active&&!!task.due&&(dateOnly?task.due===brazilDay(now):brazilDay(task.due)===brazilDay(now)),stageMs:stage?Math.max(0,end-Date.parse(stage)):null,lateMs:task.due?Math.max(0,end-Date.parse(dateOnly?task.due+'T23:59:59-03:00':task.due)):0};
}
