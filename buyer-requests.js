import { auth, db, collection, doc, addDoc, getDoc, onSnapshot, onAuthStateChanged, runTransaction, serverTimestamp } from './firebase.js';
const elements = new Map([...document.querySelectorAll('[id]')].map(n => [n.id,n]));
const $=id=>elements.get(id);
const el=(tag,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
const button=(text,action)=>{const n=el('button','secondary-btn',text);n.type='button';n.onclick=async()=>{n.disabled=true;try{await action();}catch(error){$('requestsStatus').textContent=error.message;$('tasksStatus').textContent=error.message;$('requestDetailStatus').textContent=error.message;}finally{n.disabled=false;}};return n;};
const requestRef=id=>doc(db,'buyerRequests',id);
const applicationRef=(id,storeId)=>doc(db,'buyerRequests',id,'applications',storeId);
const alertRef=(uid,id,kind,storeId)=>doc(db,'notifications',uid,'items',`request_${id}_${kind}_${storeId}`);
const alertData=(id,kind,store)=>({requestId:id,requestKind:kind,storeId:store.id,storeName:store.name,title:kind==='apply'?'New project application':kind==='selected'?'Project awarded':'Project complete',body:kind==='apply'?`${store.name} applied to your project.`:kind==='selected'?`Your store ${store.name} was selected for this project.`:`Your project is done, Please contact '${store.name}' for further details.`,read:false,createdAt:serverTimestamp()});
export async function applyToRequest(id,storeId){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in to apply.');
 await runTransaction(db,async tx=>{
  const ref=requestRef(id),appRef=applicationRef(id,storeId);
  const [request,store,existing]=await Promise.all([tx.get(ref),tx.get(doc(db,'stores',storeId)),tx.get(appRef)]);
  if(!request.exists() || request.data().status!=='open')throw Error('This project is no longer accepting applications.');
  if(!store.exists() || store.data().ownerUid!==uid)throw Error('Choose a storefront you own.');
  if(request.data().buyerUid===uid)throw Error('You cannot apply to your own request.');
  if(existing.exists())throw Error('This store has already applied.');
  const shop={id:storeId,name:store.data().name};
  tx.set(appRef,{creatorUid:uid,storeId,storeName:shop.name,createdAt:serverTimestamp()});
  tx.set(alertRef(request.data().buyerUid,id,'apply',storeId),alertData(id,'apply',shop));
 });
}
export async function selectApplication(id,storeId){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in to select a store.');
 await runTransaction(db,async tx=>{
  const ref=requestRef(id);const [request,application]=await Promise.all([tx.get(ref),tx.get(applicationRef(id,storeId))]);
  if(!request.exists() || request.data().buyerUid!==uid)throw Error('Only the buyer can choose a store.');
  if(request.data().status!=='open')throw Error('A store has already been selected.');
  if(!application.exists())throw Error('Application is unavailable.');
  const app=application.data(),shop={id:storeId,name:app.storeName};
  tx.update(ref,{status:'active',assignedUid:app.creatorUid,storeId,storeName:app.storeName,updatedAt:serverTimestamp()});
  tx.set(alertRef(app.creatorUid,id,'selected',storeId),alertData(id,'selected',shop));
 });
}
export async function completeRequest(id){
 const uid=auth.currentUser?.uid;if(!uid)throw Error('Sign in to complete a job.');
 await runTransaction(db,async tx=>{
  const ref=requestRef(id),snapshot=await tx.get(ref);
  if(!snapshot.exists())throw Error('Project is unavailable.');
  const request=snapshot.data();
  if(request.assignedUid!==uid)throw Error('Only the selected creator can complete this job.');
  if(request.status!=='active')throw Error('This project is already completed or has not been awarded.');
  tx.update(ref,{status:'completed',completedAt:serverTimestamp(),updatedAt:serverTimestamp()});
  tx.set(alertRef(request.buyerUid,id,'completed',request.storeId),alertData(id,'completed',{id:request.storeId,name:request.storeName}));
 });
}
export function initBuyerRequests(api){
 let requests=[],appStops=[],detailId=null;
 const money=r=>new Intl.NumberFormat(undefined,{style:'currency',currency:r.currency}).format(r.budget);
 function baseCard(r){const card=el('article','job-card request-card');card.dataset.requestId=r.id;card.append(el('h3','',r.title),el('p','request-description',r.description),el('strong','',`Budget: ${money(r)}`),el('p','helper-text',r.status==='open'?'Accepting applications':r.status==='active'?`In progress · ${r.storeName}`:`Completed · ${r.storeName}`));return card;}
 function render(){
  const q=api.search().toLowerCase();$('requestsGrid').replaceChildren();
  const matches=requests.filter(r=>`${r.title} ${r.description}`.toLowerCase().includes(q));
  $('requestsDirectoryStatus').textContent=`${matches.length} buyer ${matches.length===1?'request':'requests'} found`;
  for(const r of matches){const card=baseCard(r);
   if(r.buyerUid===auth.currentUser?.uid)card.append(button('View applications',()=>openRequest(r.id)));
   else if(r.status==='open')card.append(button('Apply',async()=>{
    if(!api.requireAuth())return;
    const stores=api.stores().filter(s=>s.ownerUid===auth.currentUser.uid);
    if(!stores.length)throw Error('Create a storefront before applying to a project.');
    $('applyStoreSelect').replaceChildren(...stores.map(s=>{const n=el('option','',s.name);n.value=s.id;return n;}));
    $('applyRequestForm').dataset.requestId=r.id;$('applyRequestTitle').textContent=`Apply to ${r.title}`;$('applyRequestStatus').textContent='';api.openModal($('applyRequestModal'));
   }));
   $('requestsGrid').append(card);
  }
  if(!matches.length)$('requestsGrid').append(el('p','empty-state',q?'No buyer requests match your search.':'No buyer requests yet. Post the first project.'));
  renderTasks();
 }
 function renderTasks(){
  const uid=auth.currentUser?.uid;const list=$('tasksList');list.replaceChildren();
  const mine=requests.filter(r=>uid && (r.assignedUid===uid || r.buyerUid===uid));
  for(const r of mine.sort((a,b)=>(a.status==='completed')-(b.status==='completed'))){const card=baseCard(r);
   card.append(el('p','helper-text',r.buyerUid===uid?'Your buyer request':'Your assigned project'));
   if(r.assignedUid===uid && r.status==='active')card.append(button('Complete Job',async()=>{if(confirm('Mark this project complete and notify the buyer?'))await completeRequest(r.id);}));
   if(r.buyerUid===uid)card.append(button('View applications',()=>openRequest(r.id)));
   if(r.storeId)card.append(button('Open storefront',()=>api.openStore(r.storeId)));
   list.append(card);
  }
  if(!mine.length)list.append(el('p','empty-state','Your posted requests and projects awarded to your store will appear here.'));
 }
 function openRequest(id){
  const request=requests.find(r=>r.id===id);if(!request)throw Error('This buyer request is unavailable.');
  $('requestDetailStatus').textContent='';
  detailId=id;appStops.forEach(stop=>stop());appStops=[];
  $('requestDetail').replaceChildren(baseCard(request));
  if(request.buyerUid===auth.currentUser?.uid){
   const list=el('div','jobs-list');$('requestDetail').append(el('h3','','Applications'),list);
   appStops.push(onSnapshot(collection(db,'buyerRequests',id,'applications'),snapshot=>{
    list.replaceChildren();for(const item of snapshot.docs){const app=item.data(),card=el('article','job-card');card.append(el('strong','',app.storeName),button('View storefront',()=>api.openStore(app.storeId)));
     if(request.status==='open')card.append(button('Select this store',async()=>{if(confirm(`Choose ${app.storeName} for this project?`))await selectApplication(id,app.storeId);}));
     else if(request.storeId===app.storeId)card.append(el('span','store-category-badge','Selected'));
     list.append(card);
    }if(!snapshot.docs.length)list.append(el('p','empty-state','No applications yet. You’ll be notified when a store applies.'));
   },error=>{$('requestsStatus').textContent=error.message;}));
  }
  api.openModal($('requestDetailModal'));
 }
 function showTasks(){
  if(!api.requireAuth())return;
  document.querySelector('.page-shell').classList.add('hidden');$('notificationsPage').classList.add('hidden');
  document.querySelectorAll('.modal-overlay,.storefront-page,.room-page').forEach(n=>n.classList.add('hidden'));
  $('tasksPage').classList.remove('hidden');$('tasksPage').setAttribute('aria-hidden','false');renderTasks();window.scrollTo(0,0);
 }
 for(const id of ['tasksButton','notificationTasksButton'])$(id).onclick=()=>{if(api.requireAuth()){location.hash='tasks';showTasks();}};
 $('closeTasks').onclick=()=>{location.hash='feed';$('tasksPage').classList.add('hidden');document.querySelector('.page-shell').classList.remove('hidden');};
 $('tasksNotificationsButton').onclick=()=>{location.hash='notifications';};
 window.addEventListener('hashchange',()=>{if(location.hash==='#tasks')showTasks();else{$('tasksPage').classList.add('hidden');$('tasksPage').setAttribute('aria-hidden','true');}});
 $('newBuyerRequest').onclick=()=>{if(!api.requireAuth())return;$('buyerRequestForm').reset();$('buyerRequestFormStatus').textContent='';api.openModal($('buyerRequestModal'));};
 for(const [buttonId,modalId] of [['closeBuyerRequest','buyerRequestModal'],['closeApplyRequest','applyRequestModal'],['closeRequestDetail','requestDetailModal']])$(buttonId).onclick=()=>{api.closeModal($(modalId));if(modalId==='requestDetailModal'){detailId=null;appStops.forEach(stop=>stop());appStops=[];}};
 $('buyerRequestForm').onsubmit=async event=>{
  event.preventDefault();if(!api.requireAuth())return;const form=event.currentTarget,submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;
  try{await addDoc(collection(db,'buyerRequests'),{buyerUid:auth.currentUser.uid,title:form.elements.title.value.trim(),description:form.elements.description.value.trim(),budget:Number(form.elements.budget.value),currency:form.elements.currency.value,status:'open',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});api.closeModal($('buyerRequestModal'));}catch(error){$('buyerRequestFormStatus').textContent=error.message;}finally{submit.disabled=false;}
 };
 $('applyRequestForm').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;try{await applyToRequest(form.dataset.requestId,$('applyStoreSelect').value);api.closeModal($('applyRequestModal'));$('requestsStatus').textContent='Application sent. The buyer will choose a store.';}catch(error){$('applyRequestStatus').textContent=error.message;}finally{submit.disabled=false;}};
 onAuthStateChanged(auth,user=>{detailId=null;appStops.forEach(stop=>stop());appStops=[];$('tasksButton').classList.toggle('hidden',!user);if(!user){$('tasksPage').classList.add('hidden');['requestDetailModal','applyRequestModal','buyerRequestModal'].forEach(id=>api.closeModal($(id)));}render();if(user && location.hash==='#tasks')showTasks();});
 onSnapshot(collection(db,'buyerRequests'),snapshot=>{requests=snapshot.docs.map(s=>({id:s.id,...s.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));render();if(detailId)openRequest(detailId);},error=>{$('requestsStatus').textContent=error.message;});
 return {render,openRequest,refreshStores:render};
}
