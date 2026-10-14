import React,{useEffect,useState} from 'react';
export default function ProcessingProgress({progress,status,error}){
 const [now,setNow]=useState(Date.now());const active=['fila','processando'].includes(status||progress?.status);
 useEffect(()=>{if(!active)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[active]);
 if(!progress&&!active)return null;
 const failed=['falhou','interrompida'].includes(status||progress?.status);const finished=(status||progress?.status)==='concluída';
 const total=progress?.total,completed=progress?.completed;
 const known=Number.isFinite(total)&&total>0&&Number.isFinite(completed);
 const percent=finished?100:known?Math.min(100,Math.max(0,Math.floor(100*completed/total))):null;
 const seconds=progress?.startedAt?Math.max(0,Math.floor(((active?now:Date.parse(progress.updatedAt))-Date.parse(progress.startedAt))/1000)):null;
 return <section className="processing-progress" aria-live="polite"><div><b>{failed?'Processamento interrompido':finished?'Processamento concluído':progress?.label||'Aguardando processamento'}</b><strong>{percent===null?'':percent+'%'}</strong></div>
 <progress aria-label="Progresso da etapa atual" {...(percent===null?{}:{value:percent,max:100})}/>
 {known&&!finished&&<p>Etapa atual: {completed} de {total} {progress.unit||'etapas'}. O percentual se refere a esta etapa.</p>}
 {progress?.document&&active&&<p>{progress.documentNumber?'Documento '+progress.documentNumber+' de '+progress.documentsTotal+' · ':''}{progress.document}{progress.page?' · página '+progress.page+' de '+progress.pagesInDocument:''}</p>}
 {progress?.part&&active&&<p>Parte {progress.part} de {progress.totalParts}{progress.block?' · '+progress.block:''}</p>}
 {active&&percent===null&&<p>Preparando a etapa. O progresso aparecerá quando a quantidade for conhecida.</p>}
 {seconds!==null&&<small>Tempo decorrido: {Math.floor(seconds/60)} min {seconds%60} s{active?' · você pode acompanhar pela ficha':''}</small>}
 {failed&&<p role="alert">{error||'A tentativa parou. Reprocesse para tentar novamente; o resumo anterior foi preservado.'}</p>}
 <style>{`.processing-progress{background:#eff6ff;border:1px solid #cbdcf2;border-radius:10px;padding:16px;margin:14px 0;color:#12315a}.processing-progress>div{display:flex;justify-content:space-between;gap:12px}.processing-progress progress{width:100%;height:18px;accent-color:#0767ef;margin:12px 0 4px}.processing-progress p{margin:6px 0;font-size:13px}.processing-progress small{color:#526985}`}</style></section>;
}
