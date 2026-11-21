/* =========================================================
   INTERBANK CONECTA — App del cliente
   Secuencia: Ingreso → Registro → Código → Historial → Compromisos
              → Semáforo → Caso solucionado
   ========================================================= */
let ME=lsGet('ibc_me',null);            // {id, nombre}
let LOC=lsGet('ibc_cliente',{notifs:[],seen:{},estado:{}});
function saveLoc(){ lsSet('ibc_cliente',LOC); }
function nombre(){ return (ME&&ME.nombre||'Cliente').trim(); }
function primerNombre(){ return nombre().split(/\s+/)[0]; }
function iniciales(){ return nombre().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'C'; }
function misCasos(){ return ME?Store.all().filter(c=>c.clienteId===ME.id).sort((a,b)=>b.last-a.last):[]; }
function getCase(code){ return Store.get(code); }
function notify(code,txt){ LOC.notifs.unshift({t:Date.now(),code,txt,read:false}); LOC.notifs=LOC.notifs.slice(0,60); saveLoc(); }
function unread(){ return LOC.notifs.filter(n=>!n.read).length; }
function guardar(c){ LOC.seen[c.code]=c.history.length; LOC.estado[c.code]=c.estado; saveLoc(); Store.save(c); }

/* Avisos: detecta lo nuevo que hicieron el banco o el semáforo */
Store.onChange(()=>{
  let primero=null;
  misCasos().forEach(c=>{
    const visto=LOC.seen[c.code], n=c.history.length;
    if(visto===undefined){ LOC.seen[c.code]=n; LOC.estado[c.code]=c.estado; return; }
    if(n>visto){
      c.history.slice(visto).filter(h=>h.who!=='cliente').forEach(h=>{
        const txt=h.who==='asesor'?`💬 ${h.by||'Asesor'} (${c.code}): ${h.txt}`:h.ch==='Semáforo'?`🚦 ${c.code}: ${h.txt}`:`${c.code}: ${h.txt}`;
        notify(c.code,txt); if(!primero) primero=txt;
      });
      LOC.seen[c.code]=n;
    }
    LOC.estado[c.code]=c.estado;
  });
  saveLoc();
  if(primero) toast(primero.length>90?primero.slice(0,88)+'…':primero);
  if(!document.getElementById('sheet') && !escribiendo()) render();
});
function escribiendo(){ const a=document.activeElement; return a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT'); }

/* ---------- Navegación ---------- */
let view={name:ME?'home':'login',params:{}}, stack=[], dTab='pasaporte', listF='todos', semF='todos', semSeg='sol', agSel=0;
function go(name,params={}){ stack.push(view); view={name,params}; render(); const m=document.querySelector('main'); if(m) m.scrollTop=0; }
function back(){ view=stack.pop()||{name:'home',params:{}}; render(); }
function tab(name){ stack=[]; view={name,params:{}}; render(); }
function openCase(code,t){ dTab=t||'pasaporte'; go('detail',{code}); }

function topbar(title,sub,o={}){
  const u=unread();
  return `<div class="topbar">${o.back?`<button class="iconbtn" onclick="back()" aria-label="Volver">${ICON.back}</button>`:''}<h1>${esc(title)}${sub?`<div class="sub">${esc(sub)}</div>`:''}</h1>${o.noBell?'':`<button class="iconbtn" onclick="go('notifs')" aria-label="Avisos">${ICON.bell}${u?`<span class="dot">${u}</span>`:''}</button>`}</div>${estadoBD()}`;
}
function bottomNav(a){
  const it=[['home','Inicio',ICON.home],['list','Mis solicitudes',ICON.list],['sem','Semáforo',ICON.light],['profile','Perfil',ICON.user]];
  return `<nav class="bottom">${it.map(i=>`<button class="${a===i[0]?'on':''}" onclick="tab('${i[0]}')">${i[2]}<span>${i[1]}</span></button>`).join('')}</nav>`;
}
function caseCard(c,t){
  const s=semaforo(c);
  return `<div class="card tap" onclick="openCase('${c.code}','${t||'pasaporte'}')" ${t==='semaforo'?`style="border-left:5px solid var(--${s==='ok'?'azul':s})"`:''}>
    <div class="row between"><span class="code small" style="color:var(--verde-osc)">${c.code}</span>${semBadge(c)}</div>
    <h3 style="margin-top:8px">${esc(c.tipo)}</h3>
    ${c.prioridad&&c.estado!=='solucionado'?`<p class="small" style="color:var(--rojo)">⚑ Prioridad alta · reasignado a ${esc(c.responsable)}</p>`:''}
    <p class="small muted">${c.estado==='solucionado'?'Caso cerrado':c.estado==='registrado'?'Enviado al banco · esperando a un asesor':'Pendiente: '+esc(pendiente(c))}</p>
    ${t==='semaforo'?`<p class="small muted">🚦 ${esc(motivo(c))}</p>`:''}
    <div class="progress"><div style="width:${pct(c)}%"></div></div><div class="row between small muted"><span>${pct(c)}% completado</span><span>${esc(restante(c))}</span></div>
  </div>`;
}
const V={};

/* 1 · INGRESO */
V.login=()=>`<div class="login">
  <div class="logo"><div class="mark" style="width:92px;height:92px;border-radius:26px">${LOGO(70)}</div><h1>INTERBANK CONECTA</h1><p>Sistema de seguimiento y continuidad<br>de atención al cliente</p></div>
  <div style="margin-top:auto">
    <div class="card" style="box-shadow:0 4px 14px rgba(0,0,0,.08)"><div class="row"><div class="fic">${ICON.user}</div><div><b>Soy cliente</b><div class="muted small">Registra tu inconveniente y sigue tu caso de principio a fin</div></div></div>
      <label>¿Cómo te llamas?</label><input id="f-nombre" placeholder="Escribe tu nombre" autocomplete="given-name" maxlength="40" onkeydown="if(event.key==='Enter')ingresar()">
      <button class="btn mt" onclick="ingresar()">Ingresar</button></div>
    <p class="small muted" style="text-align:center;margin-top:6px">Prototipo académico con datos ficticios.<br>No solicita claves ni datos reales.</p>
  </div></div>`;
function ingresar(){
  const n=(document.getElementById('f-nombre')||{}).value||'';
  if(n.trim().length<2){ toast('Escribe tu nombre para continuar'); return; }
  ME={id:uid(),nombre:n.trim()}; lsSet('ibc_me',ME); LOC={notifs:[],seen:{},estado:{}}; saveLoc();
  stack=[]; view={name:'home',params:{}}; render();
}

/* Inicio */
V.home=()=>{
  const cs=misCasos(), act=cs.filter(c=>c.estado!=='solucionado'), cnt={verde:0,ambar:0,rojo:0}; act.forEach(c=>cnt[semaforo(c)]++);
  const next=act.slice().sort((a,b)=>deadline(a)-deadline(b))[0], sol=cs.length-act.length;
  return topbar('Hola, '+primerNombre(),'Bienvenido(a) a Interbank Conecta')+`<main>
  <div class="card hero"><p style="opacity:.9;font-size:13px">Solicitudes activas</p>
    <div class="row between"><b style="font-size:34px">${act.length}</b><span class="badge" style="background:rgba(255,255,255,.2);color:#fff">${sol} solucionada${sol===1?'':'s'}</span></div></div>
  <button class="btn" onclick="go('new')">${ICON.plus} Registrar un inconveniente</button>
  <h2 class="mt">Tu atención, conectada</h2>
  <div class="card tap" onclick="tab('list')"><div class="row"><div class="fic">${ICON.pass}</div><div style="flex:1;min-width:0"><span class="small muted">1 · Pasaporte de atención</span><h3 style="margin:2px 0">${cs.length} pasaporte${cs.length===1?'':'s'}</h3><p class="small muted">${cs.length?'Un código único con todo tu historial.':'Se crea al registrar tu primer inconveniente.'}</p></div></div></div>
  <div class="farrow">↓ cada registro actualiza tus compromisos</div>
  <div class="card tap" onclick="${next?`openCase('${next.code}','compromisos')`:`tab('list')`}"><div class="row"><div class="fic">${ICON.track}</div><div style="flex:1;min-width:0"><span class="small muted">2 · Panel de compromisos</span><h3 style="margin:2px 0">${act.length} compromiso${act.length===1?'':'s'} activo${act.length===1?'':'s'}</h3><p class="small muted">${next?`Próximo: <b class="code">${next.code}</b> · ${esc(restante(next))}`:'Sin compromisos pendientes'}</p></div></div></div>
  <div class="farrow">↓ los plazos los vigila el semáforo</div>
  <div class="card tap" onclick="tab('sem')"><div class="row"><div class="fic">🚦</div><div style="flex:1;min-width:0"><span class="small muted">3 · Semáforo</span>
    <div class="row" style="gap:12px;margin:6px 0;flex-wrap:wrap"><span class="row small" style="gap:4px"><span class="luz l-verde"></span><b>${cnt.verde}</b> en plazo</span><span class="row small" style="gap:4px"><span class="luz l-ambar"></span><b>${cnt.ambar}</b> riesgo</span><span class="row small" style="gap:4px"><span class="luz l-rojo"></span><b>${cnt.rojo}</b> detenido</span></div>
    <p class="small muted">Si tu caso se detiene, se alerta y se reasigna solo.</p></div></div></div>
  <div class="farrow">↺ cada alerta queda registrada en tu pasaporte</div>
  ${misCitas()}
  <h2 class="mt">Actividad reciente</h2>${cs.slice(0,2).map(c=>caseCard(c)).join('')||`<div class="card empty"><div style="font-size:34px">🪪</div><p><b>Aún no tienes solicitudes</b></p><p class="small">Registra tu primer inconveniente y se generará tu pasaporte de atención.</p><button class="btn mt" onclick="go('new')">${ICON.plus} Registrar un inconveniente</button></div>`}
  </main>`+bottomNav('home');
};

V.list=()=>{
  let cs=misCasos();
  if(listF==='activas') cs=cs.filter(c=>c.estado!=='solucionado');
  if(listF==='solucionadas') cs=cs.filter(c=>c.estado==='solucionado');
  return topbar('Mis solicitudes','Tus pasaportes de atención')+`<main>
  <div class="chips mb">${[['todos','Todas'],['activas','Activas'],['solucionadas','Solucionadas']].map(f=>`<button class="chip ${listF===f[0]?'on':''}" onclick="listF='${f[0]}';render()">${f[1]}</button>`).join('')}</div>
  ${cs.map(c=>caseCard(c)).join('')||`<div class="card empty"><p><b>No hay solicitudes aquí</b></p><p class="small">Toca el botón + para registrar un inconveniente.</p></div>`}<div style="height:70px"></div>
  </main><button class="fab" onclick="go('new')" aria-label="Nueva solicitud">${ICON.plus}</button>`+bottomNav('list');
};

/* 2 · REGISTRO */
let nuevo={tipo:'',canal:'App',desc:'',doc:''}, creando=false;
V.new=()=>topbar('Nuevo inconveniente','',{back:true,noBell:true})+`<main>
  <div class="card">
    <label style="margin-top:0">Tipo de inconveniente</label>
    <select id="f-tipo" onchange="nuevo.tipo=this.value;slaInfo()"><option value="">Selecciona una opción</option>${Object.keys(TIPOS).map(t=>`<option ${nuevo.tipo===t?'selected':''}>${t}</option>`).join('')}</select>
    <div id="sla-info" class="small" style="margin-top:6px;color:var(--verde-osc)"></div>
    <label>Canal</label>
    <div class="chips">${CANALES.map(c=>`<button class="chip ${nuevo.canal===c?'on':''}" onclick="nuevo.desc=document.getElementById('f-desc').value;nuevo.canal='${c}';render()">${c}</button>`).join('')}</div>
    <label>Cuéntanos qué pasó</label>
    <textarea id="f-desc" placeholder="Ej.: me cobraron dos veces el mismo consumo..." oninput="nuevo.desc=this.value">${esc(nuevo.desc)}</textarea>
    <label>Adjuntar documento</label>
    <label class="btn sec sm" style="margin:0;font-weight:600">${ICON.clip} <span id="docname">${nuevo.doc?esc(nuevo.doc):'Elegir archivo'}</span><input type="file" style="display:none" onchange="nuevo.doc=this.files[0]?this.files[0].name:'';document.getElementById('docname').textContent=nuevo.doc||'Elegir archivo'"></label>
  </div>
  <button class="btn" id="btn-crear" onclick="crearCaso()">Generar mi pasaporte</button>
  <p class="small muted" style="text-align:center;margin-top:10px">Solo lo cuentas una vez. No compartas claves ni PIN.</p></main>`;
function slaInfo(){ const el=document.getElementById('sla-info'); if(!el) return; const t=TIPOS[nuevo.tipo]; el.innerHTML=t?`→ Área responsable: <b>${t.area}</b> · Plazo para el semáforo: <b>${t.sla} h</b>`:''; }

/* 3 · GENERADOR DE CÓDIGO */
async function crearCaso(){
  if(creando) return;
  nuevo.desc=document.getElementById('f-desc').value;
  if(!nuevo.tipo){ toast('Selecciona el tipo de inconveniente'); return; }
  if(nuevo.desc.trim().length<10){ toast('Cuéntanos qué pasó (mínimo 10 caracteres)'); return; }
  creando=true; const b=document.getElementById('btn-crear'); if(b) b.textContent='Generando…';
  const code=await Store.nextCode(), t=now(), T=TIPOS[nuevo.tipo], m=cargas();
  const resp=ASESORES.slice().sort((a,b)=>m[a]-m[b])[0];
  const c={code,clienteId:ME.id,cliente:nombre(),tipo:nuevo.tipo,canal:nuevo.canal,desc:nuevo.desc.trim(),created:t,sla:T.sla,area:T.area,responsable:resp,estado:'registrado',blocked:false,blockReason:'',
    pasos:PASOS.map((p,i)=>({n:p,done:i<1})),history:[],docs:[],citas:[],last:t};
  c.history.push({t,who:'cliente',ch:nuevo.canal,txt:c.desc,doc:nuevo.doc||undefined}); if(nuevo.doc) c.docs.push(nuevo.doc);
  c.history.push({t:t+1000,who:'sistema',ch:nuevo.canal,txt:`Pasaporte ${code} creado y enviado al equipo de ${T.area}. Asesor asignado: ${resp}. Plazo comprometido: ${T.sla} h.`});
  guardar(c); notify(code,`Tu pasaporte ${code} fue creado. Cualquier asesor podrá continuar tu caso con este código.`);
  nuevo={tipo:'',canal:'App',desc:'',doc:''}; creando=false;
  dTab='pasaporte'; stack=[{name:'home',params:{}}]; view={name:'detail',params:{code}}; render();
  sheet(`<div style="text-align:center"><h3 style="font-size:18px">¡Pasaporte creado!</h3><p class="muted small">Tu código único es</p>
    <div class="card" style="border:2px solid var(--gris-bd);box-shadow:none;margin:8px 0"><span class="code" style="font-size:24px">${code}</span></div>
    <button class="btn" onclick="copiar('${code}')">Copiar código</button>
    ${AUTO[c.tipo]?`<div style="background:var(--verde-cl);border:1.5px solid var(--verde);border-radius:14px;padding:12px;margin-top:12px;text-align:left"><b style="color:var(--verde-osc)">⚡ Solución inmediata disponible</b><p class="small" style="margin-top:4px">Este caso se puede resolver ahora mismo, sin esperar.</p><button class="btn mt" onclick="autoResolver('${code}')">${AUTO[c.tipo].btn}</button></div>`:''}
    <button class="btn gris mt" onclick="closeSheet();render()">Ver mi pasaporte</button>
    <p class="small muted mt">Tu caso ya le llegó al equipo del banco. Te avisaremos cuando un asesor responda.</p></div>`);
}
function copiar(code){ try{ navigator.clipboard.writeText(code).then(()=>toast('Código copiado'),()=>toast('Tu código: '+code)); }catch(e){ toast('Tu código: '+code); } }

function autoResolver(code){
  const c=getCase(code), A=AUTO[c.tipo]; if(!A) return;
  sheet(`<h3 style="text-align:center">⚡ Resolviendo tu caso</h3><p class="small muted" style="text-align:center">${code}</p><div id="autoSteps" class="mt"></div>`);
  let i=0;
  const tick=()=>{
    const box=document.getElementById('autoSteps'); if(!box) return;
    const fin=i===A.pasos.length-1;
    box.innerHTML=A.pasos.slice(0,i+1).map((p,k)=>`<div class="row" style="padding:8px 0"><div class="chk ${k<i||fin?'on':'now'}">${k<i||fin?'✓':''}</div><span style="font-size:14px">${esc(p)}</span></div>`).join('');
    i++;
    if(i<A.pasos.length) setTimeout(tick,900);
    else setTimeout(()=>{
      const c2=getCase(code), t=now(); c2.autoTried=true; c2.pasos.forEach(p=>p.done=true); c2.estado='solucionado'; c2.blocked=false; c2.solucion=A.fin; c2.solvedAt=t; c2.last=t;
      c2.history.push({t,who:'sistema',ch:'App',txt:'Solución inmediata en menos de 1 minuto: '+A.fin});
      guardar(c2); notify(code,`✅ ¡Tu caso ${code} se resolvió al instante! ${A.fin}`);
      closeSheet(); dTab='pasaporte'; view={name:'detail',params:{code}}; render(); toast('¡Caso solucionado al instante!');
    },900);
  };
  tick();
}

/* Detalle del caso */
function segTabs(){ return `<div class="seg">${[['pasaporte','🪪 Pasaporte'],['compromisos','📋 Compromisos'],['semaforo','🚦 Semáforo']].map(t=>`<button class="${dTab===t[0]?'on':''}" onclick="dTab='${t[0]}';render()">${t[1]}</button>`).join('')}</div>`; }
const CONN={
  pasaporte:'🔗 Cada registro llega al instante al asesor, actualiza el <b>Panel de compromisos</b> y reinicia el contador del <b>Semáforo</b>.',
  compromisos:'🔗 El plazo de este panel es lo que mide el <b>Semáforo</b>. Cada avance del asesor queda en tu <b>Pasaporte</b>.',
  semaforo:'🔗 Cada cambio de color queda en tu <b>Pasaporte</b> y, si llega a rojo, el <b>Panel</b> muestra al nuevo responsable.'
};
V.detail=({code,hist})=>{
  const c=getCase(code); if(!c) return topbar('Mi caso','',{back:true})+`<main><div class="empty">${Store.ready?'Pasaporte no encontrado':'Cargando…'}</div></main>`;
  if(c.estado==='solucionado'&&!hist) return V.solved(c);
  const s=semaforo(c);
  return topbar('Mi caso',c.code,{back:true})+`<main>
  <div class="card hero"><div class="row between"><span class="code" style="font-size:17px">${c.code}</span><span class="badge" style="background:#fff;color:var(--texto)"><span class="luz ${SEM[s].l}"></span>${SEM[s].t}</span></div>
    <h3 style="margin-top:8px">${esc(c.tipo)}</h3><p class="small" style="opacity:.9">${c.estado==='registrado'?'Enviado al banco':ESTADOS[c.estado]} · ${esc(c.area)}${c.prioridad&&c.estado!=='solucionado'?' · ⚑ Prioridad alta':''}</p>
    <div class="progress" style="background:rgba(255,255,255,.25)"><div style="width:${pct(c)}%;background:#fff"></div></div>
    <div class="row between small"><span>${pct(c)}% completado</span><span>${esc(restante(c))}</span></div></div>
  ${segTabs()}
  ${dTab==='pasaporte'?tabPasaporte(c):dTab==='compromisos'?panelCompromisos(c,'cliente')+citasCaso(c)+pasosHtml(c,false):semVisual(c,'cliente')}
  <div class="conn">${CONN[dTab]}</div></main>`+bottomNav('list');
};
function tabPasaporte(c){
  const abierto=c.estado!=='solucionado'; let h='';
  if(abierto&&AUTO[c.tipo]&&!c.autoTried) h+=`<div class="card" style="background:var(--verde-cl)"><h3 style="color:var(--verde-osc)">⚡ Solución inmediata disponible</h3><p class="small">Resuelve este caso ahora, sin esperar.</p><button class="btn mt" onclick="autoResolver('${c.code}')">${AUTO[c.tipo].btn}</button></div>`;
  h+=`<div class="card"><div class="row between"><h3>Historial del pasaporte</h3><span class="small muted">${c.history.length} registros</span></div><p class="small muted mb">App, llamada, agencia y semáforo en un solo lugar.</p>${timeline(c,'cliente')}
  ${c.docs&&c.docs.length?`<div class="sep"></div><p class="small muted">Documentos (${c.docs.length})</p>${c.docs.map(d=>`<div class="doc">${esc(d)}</div>`).join(' ')}`:''}</div>`;
  if(abierto) h+=`<div class="card"><h3>Agregar información</h3>
    <textarea id="msg" placeholder="Mensaje para el asesor..." style="min-height:70px"></textarea>
    <label class="btn gris sm" style="margin-top:8px;color:var(--texto);font-weight:600">${ICON.clip} <span id="mdoc">Adjuntar documento</span><input type="file" id="mfile" style="display:none" onchange="document.getElementById('mdoc').textContent=this.files[0]?this.files[0].name:'Adjuntar documento'"></label>
    <button class="btn mt" onclick="msgCliente('${c.code}')">${ICON.send} Enviar al asesor</button></div>
    <button class="btn sec mb" onclick="cambiarCanal('${c.code}')">${ICON.headset} Continuar por otro canal</button>`;
  return h;
}
function msgCliente(code){
  const c=getCase(code), txt=document.getElementById('msg').value.trim(), f=document.getElementById('mfile').files[0];
  if(!txt&&!f){ toast('Escribe un mensaje o adjunta un documento'); return; }
  const t=now(); c.history.push({t,who:'cliente',ch:'App',txt:txt||'Adjuntó un documento',doc:f?f.name:undefined}); if(f){ c.docs=c.docs||[]; c.docs.push(f.name); }
  if(c.estado==='espera') c.estado='proceso'; c.last=t; document.activeElement&&document.activeElement.blur(); guardar(c); render(); toast('Enviado: el asesor ya lo puede ver');
}
function cambiarCanal(code){
  sheet(`<h3>Continuar por otro canal</h3><p class="muted small mb">El asesor abrirá tu pasaporte <b class="code">${code}</b>. No repites nada.</p>
  <button class="btn gris mt" style="justify-content:flex-start" onclick="closeSheet();pedirLlamada('${code}')">${ICON.phone} Que me llamen · sin esperar en línea</button>
  <button class="btn gris mt" style="justify-content:flex-start" onclick="closeSheet();go('turno',{code:'${code}'})">${ICON.ticket} Turno en agencia · sin colas</button>
  <button class="btn gris mt" style="justify-content:flex-start" onclick="canalWeb('${code}')">${ICON.link} Banca por internet</button>`);
}
function canalWeb(code){ const c=getCase(code), t=now(); c.history.push({t,who:'sistema',ch:'Banca por internet',txt:'El cliente continuó por Banca por internet. El asesor accede al pasaporte sin pedirle que repita su consulta.'}); c.last=t; guardar(c); closeSheet(); render(); toast('Ingresa tu código en la banca: '+code); }
function pedirLlamada(code){
  const fr=['Lo antes posible (≈15 min)','Hoy 12:00 – 13:00','Hoy 17:00 – 18:00','Mañana 9:00 – 10:00'];
  sheet(`<h3>Que me llamen</h3><p class="small muted mb">Un asesor te llamará con tu pasaporte <b class="code">${code}</b> abierto.</p>${fr.map(f=>`<button class="btn gris sm mt" onclick="confirmarLlamada('${code}','${f}')">${ICON.phone} ${f}</button>`).join('')}`);
}
function confirmarLlamada(code,fr){
  const c=getCase(code), t=now(); c.citas=c.citas||[]; c.citas.push({tipo:'llamada',fr,estado:'pendiente'});
  c.history.push({t,who:'cliente',ch:'Llamada',txt:`Pidió que lo llamen: ${fr}.`}); c.last=t;
  guardar(c); notify(code,`Te llamaremos: ${fr}. Ten a la mano tu código ${code}.`); closeSheet(); render(); toast('Llamada pedida: el asesor ya la ve en su agenda');
}
let turnoSel={ag:0,dia:0,hora:-1};
V.turno=({code})=>{
  const dias=['Hoy','Mañana','Pasado mañana'];
  return topbar('Turno en agencia',code,{back:true,noBell:true})+`<main>
  <div class="card" style="background:var(--verde-cl)"><p class="small"><b>Sin colas:</b> llegas a tu hora, vas a la <b>Ventanilla Conecta</b> y el asesor ya tiene tu caso abierto.</p></div>
  <div class="card"><label style="margin-top:0">Agencia</label>
    <select onchange="turnoSel.ag=+this.value;turnoSel.hora=-1;render()">${AGENCIAS.map((a,i)=>`<option value="${i}" ${turnoSel.ag===i?'selected':''}>${a}</option>`).join('')}</select>
    <label>Día</label><div class="chips">${dias.map((d,i)=>`<button class="chip ${turnoSel.dia===i?'on':''}" onclick="turnoSel.dia=${i};turnoSel.hora=-1;render()">${d}</button>`).join('')}</div>
    <label>Hora · afluencia (semáforo)</label>
    <div class="grid2">${HORAS.map((h,i)=>{const v=afluencia(turnoSel.ag+turnoSel.dia,i),k=colorAfl(v),on=turnoSel.hora===i; return `<button class="chip ${on?'on':''}" style="border-radius:12px;padding:10px;text-align:left" onclick="turnoSel.hora=${i};render()"><b>${h}</b><br><span class="row small" style="gap:5px;margin-top:4px"><span class="luz l-${k}"></span>${k==='verde'?'Baja':k==='ambar'?'Media':'Alta'}</span></button>`;}).join('')}</div>
    <p class="small muted mt">💡 Elige una hora en verde para no hacer cola.</p></div>
  <button class="btn" onclick="confirmarTurno('${code}')">${ICON.ticket} Reservar turno</button></main>`;
};
function confirmarTurno(code){
  if(turnoSel.hora<0){ toast('Elige una hora'); return; }
  const c=getCase(code), dias=['Hoy','Mañana','Pasado mañana'], tk='C-'+String(Math.floor(Math.random()*900)+100);
  const tr={tipo:'turno',tk,ag:AGENCIAS[turnoSel.ag],dia:dias[turnoSel.dia],hora:HORAS[turnoSel.hora],estado:'pendiente'};
  c.citas=c.citas||[]; c.citas.push(tr);
  const t=now(); c.history.push({t,who:'cliente',ch:'Agencia',txt:`Reservó el turno ${tk} en ${tr.ag} · ${tr.dia} ${tr.hora}.`}); c.last=t;
  guardar(c); notify(code,`Turno ${tk} confirmado: ${tr.ag}, ${tr.dia} a las ${tr.hora}.`); turnoSel={ag:0,dia:0,hora:-1};
  dTab='compromisos'; stack=[{name:'home',params:{}}]; view={name:'detail',params:{code}}; render();
  sheet(`<div style="text-align:center"><p class="muted">Tu turno</p><p class="code" style="font-size:40px;color:var(--verde-osc);margin:4px 0">${tk}</p><p><b>${esc(tr.ag)}</b></p><p>${tr.dia} · ${tr.hora}</p>
  <div class="card mt" style="background:var(--gris-cl);box-shadow:none"><p class="small">Pasaporte vinculado: <b class="code">${code}</b></p><p class="small">Espera estimada: <b>menos de 5 minutos</b></p></div><button class="btn" onclick="closeSheet()">Entendido</button></div>`);
}
function citaTxt(x){ return x.tipo==='turno'?`🎫 <b>Turno ${x.tk}</b> · ${x.dia} ${x.hora} · ${esc(x.ag)}`:`📞 <b>Te llamaremos</b> · ${esc(x.fr)}`; }
function citasCaso(c){ const cs=citasDe(c); if(!cs.length) return ''; return `<div class="card"><h3>Citas vinculadas</h3>${cs.map(x=>`<div class="row small" style="padding:6px 0;justify-content:space-between"><span>${citaTxt(x)}</span><span class="badge ${x.estado==='atendida'?'b-azul':'b-ambar'}">${x.estado==='atendida'?'Atendida':'Pendiente'}</span></div>`).join('')}</div>`; }
function misCitas(){
  const items=[]; misCasos().forEach(c=>citasDe(c).filter(x=>x.estado==='pendiente').forEach(x=>items.push(`<div class="row small" style="padding:6px 0">${citaTxt(x)} · <span class="code">${c.code}</span></div>`)));
  return items.length?`<div class="card"><h3>Mis citas</h3>${items.join('')}</div>`:'';
}

/* 6 · SEMÁFORO */
V.sem=()=>{
  const segBar=`<div class="seg" style="grid-template-columns:1fr 1fr">${[['sol','🚦 Solicitudes'],['ag','🏦 Agencias']].map(t=>`<button class="${semSeg===t[0]?'on':''}" onclick="semSeg='${t[0]}';render()">${t[1]}</button>`).join('')}</div>`;
  if(semSeg==='ag'){
    return topbar('Semáforo','Afluencia en agencias hoy')+`<main>${segBar}
    <div class="card"><label style="margin-top:0">Agencia</label><select onchange="agSel=+this.value;render()">${AGENCIAS.map((a,i)=>`<option value="${i}" ${agSel===i?'selected':''}>${a}</option>`).join('')}</select>
    <p class="small muted mt">Verde: poca gente · Ámbar: espera media · Rojo: mucha gente.</p></div>
    ${HORAS.map((h,i)=>{const v=afluencia(agSel,i),k=colorAfl(v); return `<div class="card row" style="padding:12px 14px;border-left:5px solid var(--${k})"><b style="width:52px">${h}</b><div style="flex:1"><div class="progress" style="margin:0"><div style="width:${v}%;background:var(--${k})"></div></div></div><span class="badge ${SEM[k].cls}" style="width:70px;justify-content:center">${v}%</span></div>`;}).join('')}
    <button class="btn" onclick="elegirParaTurno()">${ICON.ticket} Reservar turno en hora verde</button></main>`+bottomNav('sem');
  }
  const cs=misCasos(), cnt={verde:0,ambar:0,rojo:0,ok:0}; cs.forEach(c=>cnt[semaforo(c)]++);
  const ord={rojo:0,ambar:1,verde:2,ok:3};
  let lista=cs.sort((a,b)=>ord[semaforo(a)]-ord[semaforo(b)]); if(semF!=='todos') lista=lista.filter(c=>semaforo(c)===semF);
  const ch=(f,lab)=>`<button class="chip ${semF===f?'on':''}" onclick="semF='${f}';render()">${lab}</button>`;
  return topbar('Semáforo','Estado de tus solicitudes')+`<main>${segBar}
  <div class="chips mb">${ch('todos','Todos')}${ch('rojo','🔴 '+cnt.rojo)}${ch('ambar','🟡 '+cnt.ambar)}${ch('verde','🟢 '+cnt.verde)}${ch('ok','✔ '+cnt.ok)}</div>
  ${lista.map(c=>caseCard(c,'semaforo')).join('')||`<div class="card empty"><div style="font-size:34px">🚦</div><p><b>${cs.length?'No hay casos con este color':'Aún no hay solicitudes que vigilar'}</b></p>${cs.length?'':'<p class="small">Cuando registres un inconveniente, el semáforo vigilará su plazo.</p>'}</div>`}
  <div class="card small muted"><b>Criterios:</b> 🟢 avanza en plazo · 🟡 usó más del 60% del plazo o 24 h sin movimiento · 🔴 bloqueado, plazo vencido o 48 h sin movimiento.</div></main>`+bottomNav('sem');
};
function elegirParaTurno(){
  const act=misCasos().filter(c=>c.estado!=='solucionado');
  if(!act.length){ toast('Primero registra un inconveniente'); return; }
  turnoSel.ag=agSel;
  if(act.length===1){ go('turno',{code:act[0].code}); return; }
  sheet(`<h3>¿Para qué caso es el turno?</h3>${act.map(c=>`<button class="btn gris sm mt" style="justify-content:space-between" onclick="closeSheet();go('turno',{code:'${c.code}'})"><span class="code">${c.code}</span><span>${esc(c.tipo)}</span></button>`).join('')}`);
}

/* 7 · CASO SOLUCIONADO */
V.solved=(c)=>{
  const canales=[]; c.history.forEach(h=>{ if(h.ch&&h.ch!=='Semáforo'&&!canales.includes(h.ch)) canales.push(h.ch); });
  const alertas=c.history.filter(h=>h.ch==='Semáforo'&&/ÁMBAR|ROJO/.test(h.txt)).length;
  return topbar('Mi caso',c.code,{back:true})+`<main>
  <div class="card" style="background:var(--verde-cl);border:1.5px solid var(--verde)"><div class="row between"><span class="code" style="font-size:16px">${c.code}</span><span class="badge b-azul">✔ Solucionado</span></div>
    <h3 style="margin-top:6px">${esc(c.tipo)}</h3><div class="progress"><div style="width:100%"></div></div><div class="row between small muted"><span>100% completado</span><span>Caso cerrado</span></div></div>
  <div class="card" style="text-align:center"><div style="width:72px;height:72px;border-radius:50%;background:var(--verde);color:#fff;font-size:40px;display:flex;align-items:center;justify-content:center;margin:6px auto 10px">✓</div>
    <h3 style="font-size:19px">¡Tu caso fue solucionado!</h3><p class="muted">${esc(c.solucion||TIPOS[c.tipo].sol)}</p></div>
  <div class="card"><h3>Resumen de tu atención</h3>
    <p class="small" style="margin-top:8px">🪪 Canales: <b>${esc(canales.join(' → '))}</b></p>
    <p class="small">💬 Consultas repetidas: <b style="color:var(--verde-osc)">0</b></p>
    <p class="small">📋 Compromiso cumplido: <b>${c.pasos.filter(p=>p.done).length} de ${c.pasos.length} pasos</b></p>
    <p class="small">🚦 Alertas del semáforo: <b>${alertas}${alertas?' (atendida'+(alertas>1?'s':'')+')':''}</b></p>
    <p class="small">👤 Atendido por: <b>${esc(c.responsable)}</b></p>
    <p class="small">⏱ Tiempo total: <b>${fmtDur((c.solvedAt||c.last)-c.created)}</b></p></div>
  <div class="card" style="text-align:center"><h3>¿Cómo calificas la atención?</h3>
    <div class="row" style="justify-content:center;gap:8px;font-size:34px;margin:8px 0">${[1,2,3,4,5].map(i=>`<span style="cursor:pointer;color:${(c.rating||0)>=i?'#F2A900':'#D0D5D9'}" onclick="calificar('${c.code}',${i})">★</span>`).join('')}</div>
    <p class="small muted">${c.rating?'¡Gracias por tu calificación!':'Toca las estrellas para calificar'}</p></div>
  <button class="btn sec" onclick="dTab='pasaporte';go('detail',{code:'${c.code}',hist:true})">Ver historial completo</button></main>`+bottomNav('list');
};
function calificar(code,n){ const c=getCase(code); c.rating=n; guardar(c); render(); toast('¡Gracias por calificar!'); }

/* Avisos y perfil */
V.notifs=()=>{
  const html=topbar('Avisos','',{back:true,noBell:true})+`<main>${LOC.notifs.map(n=>`<div class="card tap" onclick="openCase('${n.code}')" style="${n.read?'':'border-left:4px solid var(--verde)'}"><p class="small muted">${fmtFecha(n.t)} · <span class="code">${n.code}</span></p><p style="font-size:14px">${esc(n.txt)}</p></div>`).join('')||'<div class="empty">No tienes avisos</div>'}</main>`+bottomNav('home');
  LOC.notifs.forEach(n=>n.read=true); saveLoc(); return html;
};
V.profile=()=>topbar('Perfil','')+`<main>
  <div class="card row"><div style="width:56px;height:56px;border-radius:50%;background:var(--verde-cl);color:var(--verde-osc);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px">${esc(iniciales())}</div><div><b>${esc(nombre())}</b><div class="muted small">Cliente Interbank Conecta</div></div></div>
  <div class="card"><h3>Mi resumen</h3><p class="small">Pasaportes creados: <b>${misCasos().length}</b></p><p class="small">Casos solucionados: <b>${misCasos().filter(c=>c.estado==='solucionado').length}</b></p><p class="small">Consultas repetidas: <b style="color:var(--verde-osc)">0</b></p></div>
  <div class="card"><h3>Avisos</h3>${['Notificación en la app','Correo electrónico','SMS'].map((p,i)=>`<div class="row between" style="padding:8px 0"><span style="font-size:14px">${p}</span><input type="checkbox" ${i<2?'checked':''} style="width:24px;height:24px;-webkit-appearance:checkbox;appearance:auto;accent-color:var(--verde)"></div>`).join('')}</div>
  <button class="btn gris" onclick="borrarMias()">Borrar mis solicitudes</button>
  <button class="btn sec mt" onclick="salir()">${ICON.logout} Salir</button></main>`+bottomNav('profile');
function borrarMias(){
  sheet(`<h3>¿Borrar tus solicitudes?</h3><p class="small muted mb">Se eliminarán tus ${misCasos().length} pasaporte(s) de la base de datos, también para los asesores.</p><button class="btn rojo" onclick="confirmarBorrar()">Sí, borrar</button><button class="btn gris mt" onclick="closeSheet()">Cancelar</button>`);
}
function confirmarBorrar(){ misCasos().forEach(c=>Store.remove(c.code)); LOC={notifs:[],seen:{},estado:{}}; saveLoc(); closeSheet(); render(); toast('Solicitudes borradas'); }
function salir(){ ME=null; lsSet('ibc_me',null); LOC={notifs:[],seen:{},estado:{}}; saveLoc(); stack=[]; view={name:'login',params:{}}; render(); }

function render(){
  document.getElementById('app').innerHTML=(V[view.name]||V.login)(view.params||{});
  if(view.name==='new') slaInfo();
}
Store.init(); render();
setInterval(()=>{ if(!document.getElementById('sheet')&&!escribiendo()) render(); },60000);
