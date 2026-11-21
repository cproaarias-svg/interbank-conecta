/* =========================================================
   INTERBANK CONECTA — Panel de trabajadores (asesores)
   Recibe en tiempo real los casos que registran los clientes
   ========================================================= */
let YO=lsGet('ibc_asesor',null);
let vistos=null; // códigos ya conocidos (para avisar casos nuevos)
let alertasLeidas=lsGet('ibc_asesor_alertas',{});
function getCase(code){ return Store.get(code); }
function todos(){ return Store.all(); }

Store.onChange(()=>{
  const codes=todos().map(c=>c.code);
  if(vistos===null){ if(Store.ready) vistos=new Set(codes); }
  else{
    const nuevos=todos().filter(c=>!vistos.has(c.code));
    nuevos.forEach(c=>vistos.add(c.code));
    if(nuevos.length&&YO){ const c=nuevos[0]; toast(`🔔 Nuevo caso ${c.code} de ${c.cliente||'un cliente'}: ${c.tipo}`); try{ navigator.vibrate&&navigator.vibrate(200); }catch(e){} }
  }
  if(YO) monitorSemaforo();
  if(!document.getElementById('sheet')&&!escribiendo()) render();
});
function escribiendo(){ const a=document.activeElement; return a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT'); }

/* ---------- Navegación ---------- */
let view={name:YO?'home':'login',params:{}}, stack=[], dTab='pasaporte', filtro='todos', asesorSel='';
function go(name,params={}){ stack.push(view); view={name,params}; render(); const m=document.querySelector('main'); if(m) m.scrollTop=0; }
function back(){ view=stack.pop()||{name:'home',params:{}}; render(); }
function tab(name){ stack=[]; view={name,params:{}}; render(); }
function openCase(code,t){ dTab=t||'pasaporte'; go('detail',{code}); }
function alertas(){ return todos().filter(c=>['rojo','ambar'].includes(semaforo(c))).sort((a,b)=>(semaforo(a)==='rojo'?0:1)-(semaforo(b)==='rojo'?0:1)); }
function alertasNuevas(){ return alertas().filter(c=>!alertasLeidas[c.code+semaforo(c)]).length; }

function topbar(title,sub,o={}){
  const u=alertasNuevas();
  return `<div class="topbar asesor">${o.back?`<button class="iconbtn" onclick="back()" aria-label="Volver">${ICON.back}</button>`:''}<h1>${esc(title)}${sub?`<div class="sub">${esc(sub)}</div>`:''}</h1>${o.noBell?'':`<button class="iconbtn" onclick="tab('alerts')" aria-label="Alertas">${ICON.bell}${u?`<span class="dot" style="border-color:#2F3B45">${u}</span>`:''}</button>`}</div>${estadoBD()}`;
}
function bottomNav(a){
  const al=alertas().length;
  const it=[['home','Inicio',ICON.home],['cases','Semáforo',ICON.light],['alerts','Alertas',ICON.alert,al],['profile','Perfil',ICON.user]];
  return `<nav class="bottom asesor">${it.map(i=>`<button class="${a===i[0]?'on':''}" onclick="tab('${i[0]}')">${i[2]}${i[3]?`<span class="nb">${i[3]}</span>`:''}<span>${i[1]}</span></button>`).join('')}</nav>`;
}
function caseCard(c,t){
  const s=semaforo(c), pend=citasDe(c).filter(x=>x.estado==='pendiente').length;
  return `<div class="card tap" onclick="openCase('${c.code}','${t||'pasaporte'}')" style="border-left:5px solid var(--${s==='ok'?'azul':s})">
    <div class="row between"><span class="code small" style="color:var(--verde-osc)">${c.code}</span>${semBadge(c)}</div>
    <h3 style="margin-top:8px">${esc(c.tipo)}${c.estado==='registrado'?' <span class="badge b-azul" style="font-size:10px">NUEVO</span>':''}${c.prioridad&&c.estado!=='solucionado'?' <span class="badge b-rojo" style="font-size:10px">⚑ Prioridad</span>':''}</h3>
    <p class="small"><b>${esc(c.cliente||'Cliente')}</b> · ${esc(c.area)} · ${esc(c.responsable)}${c.responsable===YO?' (tú)':''}</p>
    <p class="small muted">🚦 ${esc(motivo(c))}${pend?` · 📅 ${pend} cita${pend>1?'s':''}`:''}</p>
    <div class="progress"><div style="width:${pct(c)}%"></div></div><div class="row between small muted"><span>${ESTADOS[c.estado]}</span><span>${esc(restante(c))}</span></div>
  </div>`;
}
const V={};

V.login=()=>`<div class="login" style="background:linear-gradient(180deg,#2F3B45 0%,#1F2A33 55%,#fff 55%)">
  <div class="logo"><div class="mark" style="width:92px;height:92px;border-radius:26px">${LOGO(70)}</div><h1>INTERBANK CONECTA</h1><p>Panel de trabajadores<br>Atención y seguimiento de casos</p></div>
  <div style="margin-top:auto">
    <div class="card" style="box-shadow:0 4px 14px rgba(0,0,0,.08)"><div class="row"><div class="fic" style="background:#E3E7EA;color:#2F3B45">${ICON.headset}</div><div><b>Soy asesor / supervisor</b><div class="muted small">Recibe los casos de los clientes en tiempo real</div></div></div>
      <label>Elige tu usuario</label><div class="chips">${ASESORES.map(a=>`<button class="chip asesor ${asesorSel===a?'on':''}" onclick="asesorSel='${a}';render()">${a}</button>`).join('')}</div>
      <button class="btn dark mt" onclick="entrar()">Ingresar al panel</button></div>
    <p class="small muted" style="text-align:center;margin-top:6px">Prototipo académico con datos ficticios.<br>No solicita claves ni datos reales.</p>
  </div></div>`;
function entrar(){ if(!asesorSel){ toast('Elige tu usuario'); return; } YO=asesorSel; lsSet('ibc_asesor',YO); vistos=new Set(todos().map(c=>c.code)); monitorSemaforo(); stack=[]; view={name:'home',params:{}}; render(); }

V.home=()=>{
  const cs=todos(), cnt={verde:0,ambar:0,rojo:0,ok:0}; cs.forEach(c=>cnt[semaforo(c)]++);
  const nuevos=cs.filter(c=>c.estado==='registrado').sort((a,b)=>b.created-a.created);
  const mios=cs.filter(c=>c.responsable===YO&&c.estado!=='solucionado');
  return topbar('Hola, '+YO.split(' ')[0],'Panel de trabajadores')+`<main>
  <div class="card hero asesor"><p style="opacity:.85;font-size:13px">Semáforo de solicitudes · ${cs.length} caso${cs.length===1?'':'s'}</p>
    <div class="grid3 mt" style="text-align:center">
      <div onclick="filtro='verde';tab('cases')" style="cursor:pointer"><span class="luz l-verde" style="width:18px;height:18px"></span><b style="display:block;font-size:26px">${cnt.verde}</b><span class="small">En plazo</span></div>
      <div onclick="filtro='ambar';tab('cases')" style="cursor:pointer"><span class="luz l-ambar" style="width:18px;height:18px"></span><b style="display:block;font-size:26px">${cnt.ambar}</b><span class="small">En riesgo</span></div>
      <div onclick="filtro='rojo';tab('cases')" style="cursor:pointer"><span class="luz l-rojo" style="width:18px;height:18px"></span><b style="display:block;font-size:26px">${cnt.rojo}</b><span class="small">Detenidos</span></div>
    </div></div>
  <div class="card"><p class="small muted mb">Buscar pasaporte (cliente que llama o llega a agencia)</p>
    <div class="searchbox"><input id="q" placeholder="IBC-2026-...." autocomplete="off" onkeydown="if(event.key==='Enter')buscar()"><button class="btn dark" style="width:auto" onclick="buscar()">${ICON.search}</button></div></div>
  <h2>🔔 Casos nuevos sin atender (${nuevos.length})</h2>
  ${nuevos.map(c=>caseCard(c)).join('')||'<div class="card empty small">No hay casos nuevos. Cuando un cliente registre uno, aparecerá aquí al instante.</div>'}
  ${agenda()}
  <h2>Mis casos activos (${mios.length})</h2>
  ${mios.map(c=>caseCard(c)).join('')||'<div class="card empty small">No tienes casos asignados.</div>'}
  <div class="card" style="border:1.5px dashed var(--gris-bd)"><h3>Simulador de tiempo (demo)</h3><p class="small muted mb">Adelanta el reloj para todos (clientes y asesores) y verás cómo cambia el semáforo y se reasignan los casos en rojo.</p>
    <div class="grid3"><button class="btn gris sm" onclick="reloj(12)">+12 h</button><button class="btn gris sm" onclick="reloj(24)">+1 día</button><button class="btn gris sm" onclick="reloj(0)">Reiniciar</button></div>
    ${Store.offset?`<p class="small muted mt">Reloj adelantado: +${Math.round(Store.offset/H)} h</p>`:''}</div>
  </main>`+bottomNav('home');
};
function reloj(h){ Store.setOffset(h?Store.offset+h*H:0); setTimeout(()=>{ monitorSemaforo(); render(); },300); toast(h?`Reloj +${h} h para todos`:'Reloj reiniciado'); }
function buscar(){ const q=(document.getElementById('q').value||'').trim().toUpperCase(); if(getCase(q)) openCase(q); else toast('No se encontró '+q); }
function agenda(){
  const items=[];
  todos().forEach(c=>citasDe(c).forEach((x,i)=>{ if(x.estado==='pendiente') items.push({c,x,i}); }));
  if(!items.length) return '';
  return `<div class="card"><h3>📅 Agenda Conecta</h3><p class="small muted mb">Turnos y llamadas que pidieron los clientes.</p>${items.map(({c,x,i})=>`<div class="row" style="padding:8px 0;border-top:1px dashed var(--gris-bd)"><div style="flex:1"><b>${x.tipo==='turno'?'🎫 '+x.tk+' · '+x.dia+' '+x.hora:'📞 Llamar · '+esc(x.fr)}</b><div class="small muted">${esc(c.cliente)} · ${c.code}${x.tipo==='turno'?' · '+esc(x.ag):''}</div></div><button class="btn dark sm" style="width:auto" onclick="atenderCita('${c.code}',${i})">${x.tipo==='turno'?'Atender':'Llamar'}</button></div>`).join('')}</div>`;
}

V.cases=()=>{
  const ord={rojo:0,ambar:1,verde:2,ok:3};
  let cs=todos().sort((a,b)=>ord[semaforo(a)]-ord[semaforo(b)]||deadline(a)-deadline(b));
  if(filtro==='mios') cs=cs.filter(c=>c.responsable===YO);
  else if(filtro!=='todos') cs=cs.filter(c=>semaforo(c)===filtro);
  const f=[['todos','Todos'],['rojo','🔴 Detenidos'],['ambar','🟡 En riesgo'],['verde','🟢 En plazo'],['ok','✔ Solucionados'],['mios','👤 Míos']];
  return topbar('Semáforo','Todas las solicitudes de clientes')+`<main>
  <div class="chips mb">${f.map(x=>`<button class="chip asesor ${filtro===x[0]?'on':''}" onclick="filtro='${x[0]}';render()">${x[1]}</button>`).join('')}</div>
  ${cs.map(c=>caseCard(c,'semaforo')).join('')||'<div class="card empty">No hay casos aquí</div>'}
  <div class="card small muted"><b>Criterios:</b> 🟢 avanza en plazo · 🟡 usó más del 60% del plazo o 24 h sin movimiento · 🔴 bloqueado, plazo vencido o 48 h sin movimiento → se reasigna solo.</div></main>`+bottomNav('cases');
};

V.alerts=()=>{
  const al=alertas();
  const html=topbar('Alertas','Generadas por el semáforo',{noBell:true})+`<main>
  ${al.map(c=>{const s=semaforo(c); return `<div class="card alert ${s==='ambar'?'ambar':''}">
    <div class="row between"><span class="badge ${SEM[s].cls}"><span class="luz ${SEM[s].l}"></span>${SEM[s].t}</span><span class="code small">${c.code}</span></div>
    <h3 style="margin-top:8px">${esc(c.tipo)} · ${esc(c.cliente)}</h3><p class="small"><b>${esc(motivo(c))}</b></p>
    <p class="small muted">Área: ${esc(c.area)} · Responsable: ${esc(c.responsable)}</p><p class="small muted">${esc(restante(c))}</p>
    <div class="grid2 mt"><button class="btn sm dark" onclick="openCase('${c.code}','compromisos')">Atender</button><button class="btn sm gris" onclick="escalar('${c.code}')">Escalar</button></div></div>`;}).join('')||'<div class="empty">No hay alertas. Todo avanza con normalidad.</div>'}</main>`+bottomNav('alerts');
  al.forEach(c=>alertasLeidas[c.code+semaforo(c)]=1); lsSet('ibc_asesor_alertas',alertasLeidas); return html;
};

/* Detalle del caso (vista del asesor) */
function segTabs(){ return `<div class="seg">${[['pasaporte','🪪 Pasaporte'],['compromisos','📋 Compromisos'],['semaforo','🚦 Semáforo']].map(t=>`<button class="asesor ${dTab===t[0]?'on':''}" onclick="dTab='${t[0]}';render()">${t[1]}</button>`).join('')}</div>`; }
V.detail=({code})=>{
  const c=getCase(code); if(!c) return topbar('Caso','',{back:true})+'<main><div class="empty">Pasaporte no encontrado</div></main>';
  const s=semaforo(c), abierto=c.estado!=='solucionado';
  let body='';
  if(dTab==='pasaporte'){
    body+=`<p class="small" style="background:var(--verde-cl);color:var(--verde-osc);padding:10px 12px;border-radius:12px;margin-bottom:12px">✔ Tienes todo el historial: no pidas al cliente que repita su consulta.</p>`;
    if(abierto) body+=`<div class="card"><h3>Responder al cliente</h3>
      <div class="chips" style="margin:8px 0" id="chs">${['App','Llamada','Agencia'].map((ch,i)=>`<button class="chip asesor ${i===0?'on':''}" onclick="document.querySelectorAll('#chs .chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${ch}</button>`).join('')}</div>
      <textarea id="resp" placeholder="Escribe la respuesta o la acción realizada..." style="min-height:70px"></textarea>
      <button class="btn dark mt" onclick="responder('${c.code}')">${ICON.send} Enviar al cliente</button></div>`;
    body+=`<div class="card"><div class="row between"><h3>Historial del pasaporte</h3><span class="small muted">${c.history.length}</span></div>${timeline(c,'asesor')}
    ${c.docs&&c.docs.length?`<div class="sep"></div><p class="small muted">Documentos</p>${c.docs.map(d=>`<div class="doc">${esc(d)}</div>`).join(' ')}`:''}</div>`;
  } else if(dTab==='compromisos'){
    body+=panelCompromisos(c,'asesor');
    if(abierto&&c.responsable!==YO) body+=`<button class="btn dark mb" onclick="tomar('${c.code}')">${ICON.user} Tomar este caso</button>`;
    const cs=citasDe(c);
    if(cs.length) body+=`<div class="card"><h3>Citas del cliente</h3>${cs.map((x,i)=>`<div class="row" style="padding:8px 0;border-top:1px dashed var(--gris-bd)"><div style="flex:1;font-size:13px"><b>${x.tipo==='turno'?'🎫 Turno '+x.tk+' · '+x.dia+' '+x.hora:'📞 Llamar · '+esc(x.fr)}</b>${x.tipo==='turno'?`<div class="small muted">${esc(x.ag)}</div>`:''}</div>${x.estado==='pendiente'?`<button class="btn dark sm" style="width:auto" onclick="atenderCita('${c.code}',${i})">${x.tipo==='turno'?'Atender':'Llamar'}</button>`:'<span class="badge b-azul">Atendida</span>'}</div>`).join('')}</div>`;
    body+=pasosHtml(c,abierto);
    if(abierto) body+=`<div class="card"><h3>Acciones</h3><div class="grid2 mt">
      <button class="btn sm gris" onclick="pedirDoc('${c.code}')">Pedir documento</button>
      <button class="btn sm gris" onclick="derivar('${c.code}')">Derivar área</button>
      <button class="btn sm ${c.blocked?'':'gris'}" onclick="toggleBloqueo('${c.code}')">${c.blocked?'Desbloquear':'Marcar bloqueo'}</button>
      <button class="btn sm" onclick="pedirSolucion('${c.code}')">Solucionar</button></div></div>`;
  } else {
    body+=semVisual(c,'asesor');
    if(abierto&&(s==='rojo'||s==='ambar')) body+=`<button class="btn dark mb" onclick="escalar('${c.code}')">Escalar a supervisión</button>`;
  }
  return topbar('Pasaporte '+c.code,c.cliente,{back:true})+`<main>
  <div class="card" style="border-top:5px solid var(--${s==='ok'?'azul':s})">
    <div class="row between">${semBadge(c)}<span class="badge b-gris">${ESTADOS[c.estado]}</span></div>
    <h3 style="margin-top:8px">${esc(c.tipo)}</h3>
    <p class="small"><b>${esc(c.cliente)}</b> · Canal: ${esc(c.canal)} · ${esc(c.area)}${c.prioridad&&abierto?' · ⚑ Prioridad alta':''}</p>
    <div class="progress"><div style="width:${pct(c)}%"></div></div>
    <p class="small muted">${esc(restante(c))} · Último movimiento hace ${fmtDur(now()-c.last)}</p></div>
  ${segTabs()}${body}
  <div class="conn">🔗 Todo lo que hagas aquí le llega al instante al cliente: queda en su <b>Pasaporte</b>, actualiza su <b>Panel de compromisos</b> y su <b>Semáforo</b>.</div></main>`+bottomNav('cases');
};

/* ---------- Acciones del asesor (se guardan en la base de datos) ---------- */
function accion(c,txt,ch){ const t=now(); c.history.push({t,who:'asesor',by:YO,ch:ch||'App',txt}); c.last=t; c.autoEsc=false; if(c.estado==='registrado') c.estado='proceso'; if(c.pasos[1]&&!c.pasos[1].done&&c.estado==='proceso'&&!c.pasos.slice(1).some(p=>p.done)){} Store.save(c); }
function canalSel(){ const o=document.querySelector('#chs .chip.on'); return o?o.textContent:'App'; }
function responder(code){
  const c=getCase(code), el=document.getElementById('resp'), txt=el.value.trim();
  if(!txt){ toast('Escribe una respuesta'); return; }
  el.blur(); accion(c,txt,canalSel()); render(); toast('Enviado: el cliente ya lo ve en su celular');
}
function tomar(code){ const c=getCase(code), prev=c.responsable; c.responsable=YO; accion(c,`${YO} tomó el caso${prev&&prev!==YO?' (antes: '+prev+')':''}. Ya tengo tu pasaporte, no necesitas repetir tu consulta.`,'App'); render(); toast('Caso asignado a ti'); }
function avanzarPaso(code){
  const c=getCase(code), i=c.pasos.findIndex(p=>!p.done); if(i<0) return;
  if(i===c.pasos.length-1){ pedirSolucion(code); return; }
  c.pasos[i].done=true; c.blocked=false;
  const msg=i===1?'Validamos tu información. Tu caso pasa a revisión del área responsable.':`El área de ${c.area} revisó tu caso. En breve te damos la solución.`;
  accion(c,`Paso completado: ${c.pasos[i].n}. ${msg}`,'App'); render(); toast('Paso completado · el cliente lo ve al instante');
}
function pedirDoc(code){
  sheet(`<h3>Solicitar documento</h3><label>Documento requerido</label><select id="docreq"><option>Estado de cuenta</option><option>Voucher de la operación</option><option>Captura de pantalla del error</option><option>Foto de la tarjeta (sin números completos)</option></select>
  <button class="btn dark mt" onclick="confirmarDoc('${code}')">Enviar solicitud</button>`);
}
function confirmarDoc(code){ const c=getCase(code), d=document.getElementById('docreq').value; c.estado='espera'; accion(c,`Por favor adjunta: ${d}. Puedes hacerlo desde tu pasaporte en la app.`,'App'); c.estado='espera'; Store.save(c); closeSheet(); render(); toast('Solicitud enviada al cliente'); }
function derivar(code){
  const c=getCase(code);
  sheet(`<h3>Derivar a otra área</h3><p class="small muted">El área recibirá el pasaporte completo.</p>${AREAS.filter(a=>a!==c.area).map(a=>`<button class="btn gris sm mt" onclick="confirmarDerivar('${code}','${a}')">${a}</button>`).join('')}`);
}
function confirmarDerivar(code,a){ const c=getCase(code), prev=c.area; c.area=a; accion(c,`Tu caso fue derivado de ${prev} a ${a} con todo su historial. No necesitas repetir tu consulta.`,'App'); closeSheet(); render(); toast('Caso derivado a '+a); }
function toggleBloqueo(code){
  const c=getCase(code);
  if(c.blocked){ c.blocked=false; c.blockReason=''; accion(c,'El bloqueo fue resuelto. Tu caso continúa.','App'); render(); toast('Caso desbloqueado'); return; }
  sheet(`<h3>Registrar bloqueo</h3><label>¿Dónde está detenido?</label><select id="breason"><option>Esperando respuesta de otra área</option><option>Falta información del cliente</option><option>Validación con otro banco</option><option>Falla del sistema</option></select>
  <button class="btn rojo mt" onclick="confirmarBloqueo('${code}')">Marcar como detenido</button>`);
}
function confirmarBloqueo(code){ const c=getCase(code); c.blocked=true; c.blockReason=document.getElementById('breason').value; c.history.push({t:now(),who:'sistema',ch:'Semáforo',txt:`Bloqueo registrado: ${c.blockReason}. El semáforo pasa a ROJO.`}); Store.save(c); closeSheet(); setTimeout(()=>{ monitorSemaforo(); render(); },200); toast('Semáforo en rojo · alerta generada'); }
function escalar(code){ const c=getCase(code); c.history.push({t:now(),who:'sistema',ch:'Semáforo',txt:`Caso escalado a Supervisión de ${c.area} por alerta del semáforo.`}); c.responsable='Supervisión · '+c.area; c.blocked=false; c.last=now(); c.prioridad=true; Store.save(c); render(); toast('Caso escalado a supervisión'); }
function pedirSolucion(code){
  const c=getCase(code);
  sheet(`<h3>Solucionar caso ${code}</h3><label>Solución entregada al cliente</label><textarea id="soltxt" style="min-height:90px">${esc(TIPOS[c.tipo].sol)}</textarea>
  <button class="btn mt" onclick="solucionar('${code}')">✔ Marcar como solucionado</button>`);
}
function solucionar(code){
  const c=getCase(code), sol=(document.getElementById('soltxt').value||TIPOS[c.tipo].sol).trim(), t=now();
  c.pasos.forEach(p=>p.done=true); c.estado='solucionado'; c.blocked=false; c.solucion=sol; c.solvedAt=t; c.lastSem='ok';
  c.history.push({t,who:'asesor',by:YO,ch:'App',txt:`${sol} Caso solucionado.`}); c.last=t;
  Store.save(c); closeSheet(); render(); toast('✅ Caso solucionado · el cliente ya lo ve');
}
function atenderCita(code,i){
  const c=getCase(code), x=c.citas[i]; x.estado='atendida';
  accion(c,x.tipo==='turno'?`Fuiste atendido en ${x.ag} con tu turno ${x.tk}, sin cola. Continuamos tu caso desde el pasaporte.`:`Te llamamos en la franja que pediste (${x.fr}). Continuamos tu caso sin que repitas tu consulta.`,x.tipo==='turno'?'Agencia':'Llamada');
  dTab='pasaporte'; if(view.name!=='detail') go('detail',{code}); else render(); toast('Cita atendida');
}

V.profile=()=>{
  const cs=todos(), r=cs.filter(c=>c.rating);
  return topbar('Perfil del asesor','',{noBell:true})+`<main>
  <div class="card row"><div style="width:56px;height:56px;border-radius:50%;background:#E3E7EA;color:#2F3B45;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px">${esc(YO.split(' ').map(w=>w[0]).join(''))}</div>
  <div><b>${esc(YO)}</b><div class="muted small">Asesor(a) · Experiencia del cliente</div></div></div>
  <div class="card"><h3>Indicadores del equipo</h3>
  <p class="small">Casos totales: <b>${cs.length}</b></p><p class="small">Mis casos activos: <b>${cs.filter(c=>c.responsable===YO&&c.estado!=='solucionado').length}</b></p>
  <p class="small">Solucionados: <b>${cs.filter(c=>c.estado==='solucionado').length}</b></p><p class="small">Detenidos: <b>${cs.filter(c=>semaforo(c)==='rojo').length}</b></p>
  <p class="small">Calificación promedio: <b>${r.length?(r.reduce((s,c)=>s+c.rating,0)/r.length).toFixed(1)+' ★':'Sin calificaciones'}</b></p></div>
  <button class="btn sec" onclick="salir()">${ICON.logout} Salir</button></main>`+bottomNav('profile');
};
function salir(){ YO=null; lsSet('ibc_asesor',null); asesorSel=''; stack=[]; view={name:'login',params:{}}; render(); }

function render(){ document.getElementById('app').innerHTML=(V[view.name]||V.login)(view.params||{}); }
Store.init(); render();
setInterval(()=>{ if(YO){ monitorSemaforo(); } if(!document.getElementById('sheet')&&!escribiendo()) render(); },60000);
