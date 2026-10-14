export function setProgress(work,id,update,{reset=false}={}){
 work.transaction(()=>{const row=work.get(id);const {version,creatorId,creatorName,createdAt,updatedAt,...saved}=row;const now=new Date().toISOString();const prior=reset?{}:row.analysisProgress||{};
 const next={...prior,...update,startedAt:prior.startedAt||now,updatedAt:now};
 work.db.prepare('UPDATE tenders SET data=?,version=version+1,updated=? WHERE id=?').run(JSON.stringify({...saved,analysisProgress:next}),now,id);
 });
}
