import {hostingConfig,securityHeaders,sessionCookie,clientIP,serveStatic} from './hosting.mjs';
import {enabledSources,searchSource,sourceDetail} from './multisources.mjs';
import {createServer} from 'node:http';
import {remoteURL,fetchPNCP} from './pncp.mjs';
import {openAuth,verifyPassword,hashPassword,token,permissions} from './auth.mjs';
const hosting=hostingConfig();const auth=openAuth();const dummy=await hashPassword(token());let active=0,authActive=0;
const origins=hosting.origins;
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>16384)throw new Error('Corpo excede limite.');}return JSON.parse(data||'{}');}
export const server=createServer(async(req,res)=>{
 for(const [key,value] of Object.entries(securityHeaders(hosting.production)))res.setHeader(key,value);
 function reply(status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});res.end(JSON.stringify(data));}
 try {
 if(hosting.production?!hosting.hosts.has(req.headers.host||''):!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||''))return reply(403,{error:'Host não permitido.'});
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/api/health'&&req.method==='GET'){auth.db.prepare('SELECT 1').get();return reply(200,{ok:true});}
 if(hosting.production&&req.headers['x-forwarded-proto']!=='https'){res.writeHead(308,{Location:hosting.primary+u.pathname+u.search});return res.end();}
 if(!u.pathname.startsWith('/api/')){if(hosting.production&&await serveStatic(req,res,u))return;return reply(404,{error:'Página não encontrada.'});}
 if(req.method!=='GET'&&(!origins.has(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json')))return reply(403,{error:'Origem ou formato não permitido.'});
 const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(hosting.cookieName+'='))?.slice(hosting.cookieName.length+1);
 if(u.pathname==='/api/auth/login'&&req.method==='POST'){
 const b=await body(req);const login=String(b.login||'').trim().toLowerCase();const ip=clientIP(req,hosting);
 if(auth.blocked('ip:'+ip)||auth.blocked('user:'+login))return reply(429,{error:'Muitas tentativas. Aguarde 15 minutos.'});
 if(authActive>=3)return reply(429,{error:'Aguarde e tente novamente.'});
 const user=auth.db.prepare('SELECT * FROM users WHERE login=?').get(login);let ok;authActive++;try{ok=await verifyPassword(b.password,user?.password||dummy);}finally{authActive--;}
 if(!ok||!user?.active){auth.fail('ip:'+ip);auth.fail('user:'+login);auth.audit('anônimo','Falha de login');return reply(401,{error:'Login ou senha inválidos.'});}
 auth.clear('user:'+login);const s=auth.createSession(user.id,b.remember===true);res.setHeader('Set-Cookie',sessionCookie(hosting,s.raw,b.remember===true));auth.audit(user.id,'Login concluído');return reply(200,{user:auth.pub(user),csrf:s.csrf});
 }
 const session=auth.session(raw);
 if(!session)return reply(401,{error:'Entre com login e senha.'});
 if(req.method!=='GET'&&req.headers['x-csrf-token']!==session.csrf)return reply(403,{error:'Sessão inválida. Refaça o login.'});
 if(u.pathname==='/api/auth/me'&&req.method==='GET')return reply(200,session);
 if(u.pathname==='/api/auth/logout'&&req.method==='POST'){auth.logout(raw);auth.audit(session.user.id,'Logout concluído');res.setHeader('Set-Cookie',sessionCookie(hosting,''));return reply(200,{ok:true});}
 if(u.pathname==='/api/auth/password'&&req.method==='POST'){const b=await body(req);const user=auth.db.prepare('SELECT * FROM users WHERE id=?').get(session.user.id);if(!await verifyPassword(b.current,user.password))return reply(401,{error:'Senha atual inválida.'});const h=await hashPassword(b.next);auth.db.prepare('UPDATE users SET password=? WHERE id=?').run(h,user.id);auth.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);auth.audit(user.id,'Senha alterada e sessões encerradas');return reply(200,{ok:true});}
 if(u.pathname.startsWith('/api/admin/')){
 if(!session.user.admin)return reply(403,{error:'Acesso exclusivo da administradora.'});
 if(u.pathname==='/api/admin/users'&&req.method==='GET')return reply(200,auth.users());
 if(u.pathname==='/api/admin/audit'&&req.method==='GET')return reply(200,auth.db.prepare('SELECT time,actor,action FROM audit ORDER BY id DESC LIMIT 100').all());
 if(u.pathname==='/api/admin/users'&&req.method==='POST'){const b=await body(req);const login=String(b.login||'').toLowerCase();if(!/^[a-z0-9._-]{3,64}$/.test(login)||!b.name?.trim()||!/^\S+@\S+\.\S+$/.test(b.email||''))return reply(400,{error:'Dados inválidos.'});const h=await hashPassword(b.password);auth.db.prepare('INSERT INTO users(id,name,login,email,password,permissions) VALUES(?,?,?,?,?,?)').run(token(),b.name.trim(),login,b.email.trim().toLowerCase(),h,JSON.stringify((b.permissions||[]).filter(p=>permissions.includes(p))));auth.audit(session.user.id,'Funcionário criado');return reply(201,{ok:true});}
 if(u.pathname==='/api/admin/users'&&req.method==='PATCH'){const b=await body(req);const target=auth.db.prepare('SELECT * FROM users WHERE id=?').get(b.id);if(!target||target.admin)return reply(400,{error:'Perfil inválido ou administrador protegido.'});auth.db.prepare('UPDATE users SET active=?,permissions=? WHERE id=?').run(b.active===true?1:0,JSON.stringify((b.permissions||[]).filter(p=>permissions.includes(p))),b.id);auth.db.prepare('DELETE FROM sessions WHERE user_id=?').run(b.id);auth.audit(session.user.id,'Permissões/status alterados; sessões revogadas');return reply(200,{ok:true});}
 }
 if(u.pathname.startsWith('/api/sources')){
 if(req.method!=='GET')return reply(405,{error:'Método não permitido.'});
 if(!session.user.admin&&!session.user.permissoes.includes('Buscar editais'))return reply(403,{error:'Sem permissão para buscar editais.'});
 if(u.pathname==='/api/sources')return reply(200,enabledSources);
 const m=u.pathname.match(/^\/api\/sources\/(am|mg|rs|sesc|rj)\/(search|detail)$/);
 if(!m)return reply(404,{error:'Fonte não encontrada.'});
 if(active>=1)return reply(429,{error:'Aguarde as consultas em andamento.'});
 active++;try{return reply(200,m[2]==='search'?await searchSource(m[1],u.searchParams.get('q'),Number(u.searchParams.get('page')||1)):await sourceDetail(m[1],u.searchParams.get('id')||''));}catch(e){return reply(502,{error:e.message});}finally{active--;}
 }
 if(u.pathname.startsWith('/api/pncp-proxy/')){if(!session.user.admin&&!session.user.permissoes.includes('Buscar editais'))return reply(403,{error:'Sem permissão para buscar editais.'});let remote;try{remote=remoteURL(req.url);}catch(e){return reply(400,{error:e.message});}if(active>=4)return reply(429,{error:'Aguarde as consultas.'});active++;try{return reply(200,await fetchPNCP(remote));}catch(e){return reply(502,{error:e.message});}finally{active--;}}
 return reply(404,{error:'Rota não encontrada.'});
 }catch(e){reply(400,{error:e.code?.includes('CONSTRAINT')?'Login ou e-mail já cadastrado.':'Operação inválida. Confira os dados e tente novamente.'});}
});

server.listen(Number(process.env.PORT||3001),hosting.production?'0.0.0.0':'127.0.0.1',()=>console.log('Servidor Maracanãs pronto na porta '+Number(process.env.PORT||3001)));
process.on('SIGTERM',()=>server.close(()=>{auth.db.close();process.exit(0);}));
