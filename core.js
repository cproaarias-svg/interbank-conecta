/* =========================================================
   INTERBANK CONECTA — Núcleo compartido (cliente + trabajadores)
   Base de datos: Firebase Firestore (respaldo local si no conecta)
   Prototipo académico · Creatividad Empresarial UTP
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCHovSkAlPsNUiSoa0_066tnPRBabZ5mCQ",
  authDomain: "interbank-conecta.firebaseapp.com",
  projectId: "interbank-conecta",
  storageBucket: "interbank-conecta.firebasestorage.app",
  messagingSenderId: "316718133071",
  appId: "1:316718133071:web:466a751c291a43f6eddf3a"
};
const H=3600*1000;
const ICON = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  track:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17h8"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  light:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="17" r="1.6" fill="currentColor"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>',
  headset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="14" width="5" height="6" rx="2"/><rect x="17" y="14" width="5" height="6" rx="2"/></svg>',
  clip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  ticket:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>'
};

const LOGO=(sz)=>`<svg width="${sz}" height="${sz}" style="width:${sz}px;height:${sz}px" viewBox="0 0 64 64" aria-label="Logo Interbank Conecta"><path d="M46.1 17.9 A20 20 0 1 0 46.1 46.1" fill="none" stroke="#00A651" stroke-width="8" stroke-linecap="round"/><rect x="25" y="25" width="14" height="14" rx="3.5" fill="#00843F"/><path d="M28.5 32.2l2.6 2.6 4.6-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="23" r="3.6" fill="#D93025"/><circle cx="53" cy="32" r="3.6" fill="#F2A900"/><circle cx="51" cy="41" r="3.6" fill="#00A651"/></svg>`;

const TIPOS={
  'Cargo no reconocido':{sla:72,area:'Prevención de fraudes',sol:'Confirmamos que el cargo no fue realizado por ti. El monto fue devuelto a tu cuenta.'},
  'Transferencia no reflejada':{sla:24,area:'Operaciones',sol:'La transferencia fue abonada al destinatario.'},
  'Problema con tarjeta':{sla:48,area:'Tarjetas',sol:'Tu tarjeta fue reactivada y ya puedes usarla.'},
  'Cobro de comisión':{sla:96,area:'Reclamos y comisiones',sol:'Se devolvió la comisión cobrada a tu cuenta.'},
  'Acceso a la app':{sla:24,area:'Canales digitales',sol:'Tu usuario fue desbloqueado. Ya puedes ingresar a la app.'},
  'Otro inconveniente':{sla:72,area:'Experiencia del cliente',sol:'Tu solicitud fue atendida y cerrada.'}
};
const AREAS=[...new Set(Object.values(TIPOS).map(t=>t.area))];
const CANALES=['App','Llamada','Agencia'];
const PASOS=['Registro del caso','Validación de información','Revisión del área responsable','Respuesta y solución al cliente'];
const ESTADOS={registrado:'Nuevo · sin atender',proceso:'En proceso',espera:'Esperando al cliente',solucionado:'Solucionado'};
const ASESORES=['Carla Mendoza','Luis Ramírez','Rosa Quispe','Jorge Salazar'];
const AUTO={
  'Acceso a la app':{btn:'Desbloquear mi usuario ahora',pasos:['Validando identidad con token digital…','Verificando bloqueo por intentos fallidos…','Usuario desbloqueado'],fin:'Tu usuario fue desbloqueado. Ya puedes ingresar a la app con tu clave.'},
  'Transferencia no reflejada':{btn:'Rastrear mi transferencia ahora',pasos:['Buscando la operación…','Consultando con el banco de destino…','Operación ubicada'],fin:'La transferencia fue abonada al destinatario hoy.'},
  'Problema con tarjeta':{btn:'Diagnosticar mi tarjeta ahora',pasos:['Revisando estado de la tarjeta…','Detectado: bloqueo preventivo por compra inusual','Bloqueo levantado'],fin:'Tu tarjeta tenía un bloqueo preventivo y ya fue reactivada.'}
};
const AGENCIAS=['Agencia Ate Vitarte','Agencia Centro de Lima','Agencia San Juan de Lurigancho','Agencia Los Olivos'];
const HORAS=['09:00','10:00','11:00','12:00','13:00','15:00','16:00','17:00'];
const AFL=[35,55,70,95,90,60,50,75];
function afluencia(ag,i){ return Math.max(10,Math.min(100,AFL[i]+((ag*13+i*7)%15)-7)); }
function colorAfl(v){ return v>=80?'rojo':v>=55?'ambar':'verde'; }

/* ---------- Almacenamiento local seguro ---------- */
function lsGet(k,def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch(e){ return def; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function uid(){ return 'c'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); }

/* ---------- Base de datos compartida ---------- */
const Store={
  mode:'local', cases:{}, offset:0, subs:[], ready:false, error:'',
  init(){
    try{
      if(window.firebase && firebase.initializeApp){
        firebase.initializeApp(FIREBASE_CONFIG);
        this.db=firebase.firestore();
        this.mode='firebase';
        this.db.collection('casos').onSnapshot(snap=>{
          const m={}; snap.forEach(d=>{ m[d.id]=d.data(); });
          this.cases=m; this.ready=true; this.error=''; this.emit();
        }, err=>this.fail(err));
        this.db.collection('meta').doc('reloj').onSnapshot(d=>{
          this.offset=(d.exists&&d.data().offset)||0; this.emit();
        }, ()=>{});
        return;
      }
    }catch(e){ console.error(e); }
    this.localInit();
  },
  localInit(){
    this.mode='local';
    this.cases=lsGet('ibc_shared_cases',{}); this.offset=lsGet('ibc_shared_offset',0); this.ready=true;
    window.addEventListener('storage',e=>{
      if(e.key==='ibc_shared_cases'){ this.cases=lsGet('ibc_shared_cases',{}); this.emit(); }
      if(e.key==='ibc_shared_offset'){ this.offset=lsGet('ibc_shared_offset',0); this.emit(); }
    });
    setTimeout(()=>this.emit(),0);
  },
  fail(err){
    console.error(err);
    this.error=(err&&err.code==='permission-denied')
      ?'La base de datos rechazó el acceso. Revisa las reglas de Firestore.'
      :'No se pudo conectar con la base de datos. Revisa tu conexión.';
    this.ready=true; this.emit();
  },
  emit(){ this.subs.forEach(f=>{ try{ f(this.cases); }catch(e){ console.error(e); } }); },
  onChange(f){ this.subs.push(f); },
  all(){ return Object.values(this.cases); },
  get(code){ return this.cases[code]; },
  save(c){
    const clean=JSON.parse(JSON.stringify(c));
    this.cases[c.code]=clean;
    if(this.mode==='firebase'){
      this.db.collection('casos').doc(c.code).set(clean).catch(err=>{ this.fail(err); toast('⚠️ No se pudo guardar. Revisa tu conexión.'); });
    } else lsSet('ibc_shared_cases',this.cases);
    this.emit();
  },
  remove(code){
    delete this.cases[code];
    if(this.mode==='firebase') this.db.collection('casos').doc(code).delete().catch(err=>this.fail(err));
    else lsSet('ibc_shared_cases',this.cases);
    this.emit();
  },
  setOffset(ms){
    this.offset=ms;
    if(this.mode==='firebase') this.db.collection('meta').doc('reloj').set({offset:ms}).catch(err=>this.fail(err));
    else lsSet('ibc_shared_offset',ms);
    this.emit();
  },
  async nextCode(){
    if(this.mode==='firebase'){
      try{
        const ref=this.db.collection('meta').doc('contador');
        const n=await this.db.runTransaction(async tx=>{
          const d=await tx.get(ref); const v=(d.exists&&d.data().n)||1000; tx.set(ref,{n:v+1}); return v+1;
        });
        return 'IBC-2026-'+n;
      }catch(e){ console.error(e); }
    }
    let n=lsGet('ibc_shared_seq',1000)+1;
    while(this.cases['IBC-2026-'+n]) n++;
    lsSet('ibc_shared_seq',n);
    return 'IBC-2026-'+n;
  }
};

/* ---------- Semáforo y compromisos ---------- */
function now(){ return Date.now()+(Store.offset||0); }
function deadline(c){ return c.created+c.sla*H; }
function semaforo(c){
  if(c.estado==='solucionado') return 'ok';
  const n=now(), usado=(n-c.created)/(c.sla*H), sin=n-c.last;
  if(c.blocked||n>deadline(c)||sin>48*H) return 'rojo';
  if(usado>0.6||sin>24*H) return 'ambar';
  return 'verde';
}
function motivo(c){
  const s=semaforo(c), n=now();
  if(s==='ok') return 'Caso cerrado';
  if(c.blocked) return 'Detenido: '+(c.blockReason||'bloqueo en un área');
  if(n>deadline(c)) return 'Plazo comprometido vencido';
  if(n-c.last>48*H) return 'Sin movimiento por más de 48 h';
  if(n-c.last>24*H) return 'Sin movimiento por más de 24 h';
  if(s==='ambar') return 'Consumió más del 60% del plazo';
  return 'Avanzando con normalidad';
}
const SEM={verde:{t:'En plazo',cls:'b-verde',l:'l-verde'},ambar:{t:'En riesgo',cls:'b-ambar',l:'l-ambar'},rojo:{t:'Detenido',cls:'b-rojo',l:'l-rojo'},ok:{t:'Solucionado',cls:'b-azul',l:'l-ok'}};
function semBadge(c){ const S=SEM[semaforo(c)]; return `<span class="badge ${S.cls}"><span class="luz ${S.l}"></span>${S.t}</span>`; }
function pct(c){ return Math.round(c.pasos.filter(p=>p.done).length/c.pasos.length*100); }
function fmtDur(ms){ const h=Math.round(ms/H); if(h<1) return 'menos de 1 h'; if(h<48) return h+' h'; return Math.round(h/24)+' días'; }
function restante(c){ if(c.estado==='solucionado') return 'Caso cerrado'; const r=deadline(c)-now(); return r<=0?'Plazo vencido hace '+fmtDur(-r):'Respuesta estimada en '+fmtDur(r); }
function fmtFecha(t){ const d=new Date(t); return d.toLocaleDateString('es-PE',{day:'2-digit',month:'short'})+' · '+d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function pendiente(c){ const p=c.pasos.find(p=>!p.done); return p?p.n:'Ninguna — caso cerrado'; }
function citasDe(c){ return c.citas||[]; }

/* Reasignación automática: el asesor con menos casos activos */
function cargas(){ const m={}; ASESORES.forEach(a=>m[a]=0); Store.all().forEach(c=>{ if(c.estado!=='solucionado'&&m[c.responsable]!==undefined) m[c.responsable]++; }); return m; }
function monitorSemaforo(){
  Store.all().forEach(c=>{
    const s=semaforo(c); let cambio=false;
    if(c.lastSem===undefined){ c.lastSem=s; cambio=true; }
    else if(s!==c.lastSem){
      const t=now();
      if(s==='ambar') c.history.push({t,who:'sistema',ch:'Semáforo',txt:`Semáforo en ÁMBAR (${motivo(c)}). Se envió una alerta preventiva a ${c.responsable}.`});
      if(s==='verde'&&c.lastSem!=='ok') c.history.push({t,who:'sistema',ch:'Semáforo',txt:'Semáforo volvió a VERDE: el caso avanza con normalidad.'});
      c.lastSem=s; cambio=true;
    }
    if(s==='rojo'&&!c.autoEsc){
      const m=cargas(), libre=ASESORES.filter(a=>a!==c.responsable).sort((a,b)=>m[a]-m[b])[0], prev=c.responsable;
      c.responsable=libre; c.autoEsc=true; c.prioridad=true; c.lastSem='rojo';
      c.history.push({t:now()+1,who:'sistema',ch:'Semáforo',txt:`Semáforo en ROJO (${motivo(c)}). Caso reasignado de ${prev} a ${libre} con prioridad alta.`});
      cambio=true;
    }
    if(cambio) Store.save(c);
  });
}

/* ---------- Piezas de interfaz compartidas ---------- */
function toast(msg){ const a=document.getElementById('app'); if(!a) return; const t=document.createElement('div'); t.className='toast'; t.textContent=msg; a.appendChild(t); setTimeout(()=>t.remove(),3200); }
function sheet(html){ closeSheet(); const bg=document.createElement('div'); bg.className='sheet-bg'; bg.id='sheet'; bg.innerHTML=`<div class="sheet"><div class="grab"></div>${html}</div>`; bg.addEventListener('click',e=>{ if(e.target===bg) closeSheet(); }); document.getElementById('app').appendChild(bg); }
function closeSheet(){ const s=document.getElementById('sheet'); if(s) s.remove(); }
function estadoBD(){
  if(Store.error) return `<div class="demo-tag" style="background:var(--rojo-cl);color:var(--rojo)">⚠️ ${esc(Store.error)}</div>`;
  if(!Store.ready) return `<div class="demo-tag">Conectando con la base de datos…</div>`;
  return Store.mode==='firebase'
    ? `<div class="demo-tag">🟢 Conectado en tiempo real · Prototipo académico UTP · No es una app oficial</div>`
    : `<div class="demo-tag">Modo sin conexión (solo este navegador) · Prototipo académico UTP</div>`;
}
function timeline(c,vista){
  return `<div class="tl">${c.history.slice().sort((a,b)=>a.t-b.t).map(h=>{
    const who=h.who==='cliente'?(vista==='cliente'?'Tú':esc(c.cliente||'Cliente')):h.who==='asesor'?'Asesor'+(h.by?' · '+esc(h.by):''):h.ch==='Semáforo'?'🚦 Semáforo':'Sistema Conecta';
    return `<div class="tl-item ${h.who}"><div class="who">${who}${h.ch!=='Semáforo'?`<span class="pill-ch">${esc(h.ch||'App')}</span>`:''} <span style="font-weight:400">· ${fmtFecha(h.t)}</span></div><div class="txt">${esc(h.txt)}</div>${h.doc?`<div class="doc">📎 ${esc(h.doc)}</div>`:''}</div>`;}).join('')}</div>`;
}
function semVisual(c,vista){
  const s=semaforo(c), n=now(), used=Math.max(0,Math.round((n-c.created)/(c.sla*H)*100)), sin=Math.max(0,Math.round((n-c.last)/H));
  const L=(k,col)=>`<div style="width:44px;height:44px;border-radius:50%;background:${s===k?col:'#3a4650'};box-shadow:${s===k?'0 0 16px '+col:'none'}"></div>`;
  const fill=s==='rojo'?'var(--rojo)':s==='ambar'?'var(--ambar)':s==='ok'?'var(--azul)':'var(--verde)';
  const ev=c.history.filter(h=>h.ch==='Semáforo').sort((a,b)=>b.t-a.t);
  const quien=vista==='cliente'?'tu caso':'el caso';
  return `<div class="card"><div class="row" style="gap:16px">
    <div style="background:#1F2A33;border-radius:28px;padding:9px;display:flex;flex-direction:column;gap:8px">${L('rojo','#D93025')}${L('ambar','#F2A900')}${L('verde','#00A651')}</div>
    <div style="flex:1;min-width:0">${semBadge(c)}<h3 style="margin-top:8px">${esc(motivo(c))}</h3>
    <p class="small muted">${s==='ok'?'El semáforo dejó de vigilar '+quien+'.':s==='verde'?'Avanza dentro del plazo comprometido.':s==='ambar'?'Alerta preventiva enviada a '+esc(c.responsable)+'.':'Reasignado con prioridad a '+esc(c.responsable)+'.'}</p></div></div>
    <label>Plazo consumido · ${used}%</label>
    <div style="position:relative;height:12px;background:var(--gris-cl);border-radius:6px;overflow:hidden"><div style="height:100%;width:${Math.min(100,used)}%;background:${fill}"></div><div style="position:absolute;left:60%;top:0;bottom:0;width:2px;background:#9A6B00"></div></div>
    <div class="row between small muted" style="margin-top:3px"><span>0%</span><span style="margin-left:18%">60% ámbar</span><span>100% rojo</span></div>
    <label>Sin movimiento · ${sin} h</label>
    <div style="position:relative;height:12px;background:var(--gris-cl);border-radius:6px;overflow:hidden"><div style="height:100%;width:${Math.min(100,sin/48*100)}%;background:${sin>48?'var(--rojo)':sin>24?'var(--ambar)':'var(--verde)'}"></div><div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#9A6B00"></div></div>
    <div class="row between small muted" style="margin-top:3px"><span>0 h</span><span>24 h ámbar</span><span>48 h rojo</span></div>
    ${c.blocked&&s!=='ok'?`<p class="small mt" style="color:var(--rojo);background:var(--rojo-cl);padding:8px 10px;border-radius:10px"><b>Bloqueo:</b> ${esc(c.blockReason)}</p>`:''}</div>
  <div class="card small"><div class="row" style="padding:4px 0"><span class="luz l-verde"></span><span><b>Verde:</b> monitorea</span></div><div class="row" style="padding:4px 0"><span class="luz l-ambar"></span><span><b>Ámbar:</b> alerta al responsable</span></div><div class="row" style="padding:4px 0"><span class="luz l-rojo"></span><span><b>Rojo:</b> reasigna solo${vista==='cliente'?' y te avisa':' y avisa al cliente'}</span></div></div>
  <div class="card"><h3>Eventos del semáforo</h3>${ev.length?ev.map(e=>`<div style="padding:8px 0;border-top:1px dashed var(--gris-bd)"><p class="small muted">${fmtFecha(e.t)}</p><p class="small">${esc(e.txt)}</p></div>`).join(''):'<p class="small muted">Sin alertas: siempre estuvo en verde.</p>'}</div>`;
}
function panelCompromisos(c,vista){
  return `<div class="card"><h3>Panel de compromisos</h3>
    <div class="grid2 small" style="margin:8px 0">
      <div><span class="muted">Área</span><br><b>${esc(c.area)}</b></div><div><span class="muted">Asesor</span><br><b>${esc(c.responsable)}</b></div>
      <div><span class="muted">Plazo</span><br><b>${c.sla} h</b></div><div><span class="muted">Fecha límite</span><br><b>${fmtFecha(deadline(c))}</b></div></div>
    <div class="sep"></div><p class="small">Pendiente: <b>${esc(pendiente(c))}</b></p><p class="small">Tiempo estimado: <b>${esc(restante(c))}</b></p>
    ${c.estado==='espera'?`<p class="small" style="color:#9A6B00;background:var(--ambar-cl);padding:8px 10px;border-radius:10px">${vista==='cliente'?'El asesor espera tu respuesta o documento.':'Esperando respuesta o documento del cliente.'}</p>`:''}
  </div>`;
}
function pasosHtml(c,editable){
  const idx=c.pasos.findIndex(p=>!p.done);
  return `<div class="card"><h3>Pasos hasta la solución</h3>${editable?'<p class="small muted mb">Toca el paso en curso para completarlo.</p>':''}<div class="steps">${c.pasos.map((p,i)=>`<div class="st" ${editable&&i===idx?`onclick="avanzarPaso('${c.code}')" style="cursor:pointer"`:''}><div class="chk ${p.done?'on':(i===idx?'now':'')}">${p.done?'✓':''}</div><div style="flex:1"><div style="font-size:14px;${p.done?'':'font-weight:600'}">${p.n}</div><div class="small muted">${p.done?'Completado':(i===idx?'En curso · '+esc(c.area):'Pendiente')}</div></div>${editable&&i===idx?'<span class="badge b-verde">Completar</span>':''}</div>`).join('')}</div></div>`;
}
