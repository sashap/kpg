/* Offline product photography, an accessible shop and a persistent locker. */
(function(root){'use strict';
const E=root.FoilEquipment,media=root.FoilEquipmentMedia;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function photo(item,index=0,thumb=false){
 const m=media[item.art],v=m.views[index]||m.views[0];
 return `<img class="gear-product-photo" src="${v.data}" alt="${thumb?'':esc(item.brand+' '+item.name+' — '+v.label)}" ${thumb?'loading="lazy"':''} decoding="async" draggable="false" style="--photo-scale:${m.scale||1};--photo-y:${m.y||0}%">`;
}
function create({modal,state,current,started,save,apply,back}){
 let tab='wing',selected='mantis-6',notice='',brand='all',photoIndex=0;
 function show(focus='gear-back',preserve=false){
  const scroll=preserve?document.getElementById('modal-card').scrollTop:0,listScroll=preserve?(document.querySelector('.gear-list')?.scrollTop||0):0;
  const e=state(),s=current(),g=E.tune(e.equipped),category=E.catalog.filter(p=>p.type===tab),brands=[...new Set(category.map(p=>p.brand))].sort();
  if(brand!=='all'&&!brands.includes(brand))brand='all';
  const items=category.filter(p=>brand==='all'||p.brand===brand),p=items.find(p=>p.id===selected)||items[0];
  if(selected!==p.id)photoIndex=0;selected=p.id;
  const m=media[p.art];photoIndex=Math.min(photoIndex,m.views.length-1);
  const owned=e.owned.includes(p.id),active=e.equipped[tab]===p.id,comparison=E.tune({...e.equipped,[tab]:p.id});
  const delta=(value,base)=>{const n=Math.round((value/base-1)*100);return (n>0?'+':'')+n+'%';};
  const cost=p.price,canBuy=e.balance>=cost;
  modal(`<div class="gear-top"><div><span class="eyebrow">EQUIPMENT SHOP & LOCKER</span><h2 id="modal-title">Build your next flight.</h2></div><div class="gear-wallet"><b id="gear-balance">${e.balance.toLocaleString()}</b><span>ACADEMY CREDITS</span></div></div>
   <p class="gear-intro">${E.catalog.length} ways to find your flow. Earn credits on the water and build your setup.</p>
   <div class="gear-tabs" role="tablist" aria-label="Equipment categories">${E.categories.map(k=>`<button role="tab" id="gear-tab-${k}" data-gear-tab="${k}" aria-controls="gear-results" tabindex="${k===tab?0:-1}" aria-selected="${k===tab}">${k==='foil'?'Foil kits':k==='board'?'Boards':'Wings'} <small>${E.catalog.filter(p=>p.type===k).length}</small></button>`).join('')}</div>
   <div class="gear-filter"><label for="gear-brand">Brand</label><select id="gear-brand"><option value="all">All brands</option>${brands.map(b=>`<option value="${esc(b)}" ${brand===b?'selected':''}>${esc(b)}</option>`).join('')}</select><span aria-live="polite">${items.length} ${items.length===1?'option':'options'}</span></div>
   <div class="gear-layout"><div class="gear-list" id="gear-results" role="tabpanel" aria-labelledby="gear-tab-${tab}">${items.map(i=>`<button class="gear-item ${i.id===p.id?'selected':''}" data-gear-item="${i.id}" aria-pressed="${i.id===p.id}"><div class="gear-thumb" aria-hidden="true">${photo(i,0,true)}</div><span><small>${esc(i.brand)}</small><b>${esc(i.name)}</b><em>${esc(i.role)}</em></span><strong>${e.equipped[tab]===i.id?'In use':e.owned.includes(i.id)?'Owned':i.price+' ◈'}</strong></button>`).join('')}</div>
   <section class="gear-detail" aria-label="Selected equipment">
    <figure class="gear-gallery"><button id="gear-photo-open" class="gear-photo-stage" aria-label="Enlarge ${esc(p.name)} photo">${photo(p,photoIndex)}<span class="gear-enlarge" aria-hidden="true">⤢ View detail</span></button>
     ${m.views.length>1?`<div class="gear-photo-views" role="group" aria-label="Product views">${m.views.map((v,i)=>`<button data-gear-photo="${i}" aria-pressed="${i===photoIndex}" aria-label="${esc(v.label)}">${photo(p,i,true)}<span>${esc(v.label)}</span></button>`).join('')}</div>`:''}
     <figcaption>${esc(m.caption)} <span>${esc(m.credit)}</span></figcaption>
    </figure>
    <small class="eyebrow">${esc(p.brand)} · ${esc(p.role)}</small><h3>${esc(p.name)}</h3><p class="gear-spec">${esc(p.spec)}</p><p>${esc(p.benefit)}</p><p class="gear-trade"><b>Tradeoff</b> ${esc(p.trade)}</p>
    <dl class="gear-comparison"><div><dt>Pull at equal wind</dt><dd>${delta(comparison.wingPower,g.wingPower)}</dd></div><div><dt>Lift at equal speed</dt><dd>${delta(comparison.area/comparison.mass,g.area/g.mass)}</dd></div><div><dt>Hull resistance</dt><dd>${delta(comparison.hullDrag,g.hullDrag)}</dd></div><div><dt>Foil profile drag</dt><dd>${delta(comparison.foilDrag,g.foilDrag)}</dd></div></dl>
    <small class="gear-estimate">Game tuning compared with your current setup. Lower drag helps; less lift needs more speed.</small>
    <div class="gear-purchase">${active?'<button class="primary-button" disabled>Currently equipped</button>':owned?`<button class="primary-button" id="gear-equip">${started()?'Use & return to launch':'Use this equipment'}</button>`:`<button class="primary-button" id="gear-buy" ${canBuy?'':'disabled'}>Buy · ${cost} credits</button>${canBuy?'':`<small>Earn ${cost-e.balance} more credits.</small>`}`}</div>
    ${p.source?`<a class="gear-reference" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Manufacturer reference ↗</a>`:''}
   </section></div>
   <p id="gear-notice" class="gear-notice" role="status">${esc(notice||'Owned gear stays in your locker. Switching is free; crashes never cost credits.')}</p>
   <div class="gear-loadout"><b>Your setup</b><span>${[g.board,g.foil,g.wing].map(p=>esc(p.name)).join(' · ')}</span><small>${E.advice(e.equipped,s?.config.wind).map(esc).join(' ')}</small></div>
   <details class="gear-earn"><summary>How to earn credits & recent activity</summary><p>Start with 350 credits. Earn 1 per 4 seconds on foil, 8 per foiling gate, and 8–40 for clean maneuvers. A first course completion pays 140 plus 20 per star; improved stars pay the difference. One-time flight milestones at 5, 15, 30, 60 and 120 seconds pay 50, 80, 120, 180 and 240.</p><p>${Math.floor(e.flightSeconds)} seconds flown · ${Math.floor(e.earned)} credits earned. Replaying a completed course still earns flight and maneuver rewards.</p>${e.log.length?`<ul>${e.log.map(r=>`<li><span>${esc(r.label)}</span><b>${r.amount>0?'+':''}${r.amount} ◈</b></li>`).join('')}</ul>`:''}</details>
   <p class="note">Product-family photography; size and color shown can vary. On-water models use simplified shapes and performance inspired by the selected equipment. Every foil kit includes a matched mast, fuselage and stabilizer with an 85 cm game mast. Credits are game money only. ${save.available()?'Your locker saves in this browser.':'Storage is unavailable: your locker lasts for this visit.'}</p>
   <div class="gear-footer"><button id="gear-back" class="primary-button">${started()?'Back to the water':'Back'}</button><button id="gear-starter" class="text-button">${started()?'Starter setup & return to launch':'Use starter setup'}</button></div>`,true);
  const card=document.getElementById('modal-card');
  const target=focus==='selected'?card.querySelector(`[data-gear-item="${selected}"]`):document.getElementById(focus);
  (target||document.getElementById('gear-back')).setAttribute('data-initial-focus','');
  card.scrollTop=scroll;card.querySelector('.gear-list').scrollTop=listScroll;
  document.querySelectorAll('[data-gear-tab]').forEach(b=>{
   b.onclick=()=>{tab=b.dataset.gearTab;selected=e.equipped[tab];photoIndex=0;notice='';show('gear-tab-'+tab);};
   b.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const i=E.categories.indexOf(tab),k=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowLeft'?2:1))%3;document.getElementById('gear-tab-'+E.categories[k]).click();};
  });
  document.getElementById('gear-brand').onchange=event=>{brand=event.target.value;photoIndex=0;notice='';show('gear-brand',true);};
  document.querySelectorAll('[data-gear-item]').forEach(b=>b.onclick=()=>{selected=b.dataset.gearItem;photoIndex=0;notice='';show('selected',true);});
  document.querySelectorAll('[data-gear-photo]').forEach(b=>b.onclick=()=>{
   photoIndex=Number(b.dataset.gearPhoto);document.querySelector('#gear-photo-open .gear-product-photo').outerHTML=photo(p,photoIndex);
   document.querySelectorAll('[data-gear-photo]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));
  });
  document.getElementById('gear-photo-open').onclick=()=>{
   const d=document.createElement('dialog');d.className='gear-photo-dialog';d.setAttribute('aria-label',p.brand+' '+p.name+' product photo');
   d.innerHTML=`<div class="gear-photo-heading"><span><b>${esc(p.brand)} ${esc(p.name)}</b><small>${esc(m.views[photoIndex].label)}</small></span><button class="round" aria-label="Close photo">×</button></div><div class="gear-photo-full">${photo(p,photoIndex)}</div><p>${esc(m.caption)} ${esc(m.credit)}</p>`;
   document.body.appendChild(d);d.addEventListener('close',()=>{d.remove();document.getElementById('gear-photo-open')?.focus({preventScroll:true});});d.querySelector('button').onclick=()=>d.close();
   // Native dialog traps focus. Stop the game's outer modal keyboard handler.
   d.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();d.close();}});
   d.onclick=event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}};
   d.showModal();
  };
  document.getElementById('gear-buy')?.addEventListener('click',()=>{const r=E.buy(e,p.id);notice=r.message;save();show('gear-equip',true);});
  document.getElementById('gear-equip')?.addEventListener('click',()=>{if(E.equip(e,p.id)){save();apply(e.equipped);notice=p.name+' equipped.';show('gear-back',true);}});
  document.getElementById('gear-starter').onclick=()=>{e.equipped={...E.defaults};save();apply(e.equipped);notice='Original equipment restored. Your purchases stay in the locker.';show('gear-starter',true);};
  document.getElementById('gear-back').onclick=back;
 }
 return {open(){notice='';show();}};
}
root.FoilEquipmentUI={create};
})(globalThis);
