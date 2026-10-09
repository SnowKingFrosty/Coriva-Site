import {auth,db,collection,doc,query,where,orderBy,limit,onSnapshot,onAuthStateChanged,getDoc,addDoc,setDoc,serverTimestamp} from './firebase.js';
import {createAvatar,renderChatContent,avatarURL} from './room-chat.js';
const el=(tag,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
export function paymentURL(value){const url=new URL(value);if(url.protocol!=='https:' || url.username || url.password || url.href.length>1000)throw Error('Use a valid HTTPS payment link, up to 1,000 characters.');return url.href;}
export function validPaymentQR(value){
 try{const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password && url.href.length<=2048;}catch{return false;}
}
export function createPaymentCard(message){
 const card=el('div','payment-message-card');let url;
 try{url=paymentURL(message.paymentUrl);}catch{return el('p','helper-text','This payment link is unavailable.');}
 card.append(el('strong','',message.paymentLabel || 'Payment link'));
 const link=el('a','primary-btn','Open payment link');link.href=url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
 card.append(el('span','helper-text',new URL(url).hostname));
 const qr=el('div','payment-message-qr');
 if(validPaymentQR(message.paymentQrUrl) || /^data:image\/(png|jpeg|webp);base64,/i.test(message.paymentQrUrl || '')){
  const image=el('img');image.src=message.paymentQrUrl;image.alt='Uploaded payment QR code';image.addEventListener('error',()=>{qr.replaceChildren(el('p','helper-text','The QR image could not load. Use the payment link above.'));},{once:true});qr.append(image);
 }else qr.append(el('p','helper-text','No uploaded QR code is attached. Use the payment link above.'));
 card.append(qr);
 return card;
}
export async function sendStorePayment(conversationId,profile){
 const user=auth.currentUser;if(!user)throw Error('Sign in to send a payment link.');
 const conversation=await getDoc(doc(db,'chats',conversationId));
 if(!conversation.exists() || !conversation.data().participants.includes(user.uid))throw Error('This conversation is unavailable.');
 const store=await getDoc(doc(db,'stores',conversation.data().storeId));
 if(!store.exists() || store.data().ownerUid!==user.uid || !conversation.data().participants.some(uid=>uid!==user.uid))throw Error('Only the storefront owner can send a payment link to a buyer.');
 if(!store.data().paymentUrl)throw Error('Save a payment link in Manage storefront before sending it.');
 const url=paymentURL(store.data().paymentUrl),label=String(store.data().paymentLabel || 'Payment link').trim();
 if(!label || label.length>100)throw Error('Save a payment label of 1–100 characters.');
 if(!validPaymentQR(store.data().paymentQrUrl))throw Error('Upload your payment QR code in Manage storefront before sending it.');
 if(auth.currentUser?.uid!==user.uid)throw Error('Your session changed. Please try again.');
 return addDoc(collection(db,'chats',conversationId,'messages'),{senderUid:user.uid,senderUsername:profile?.username || 'Creator',senderPhotoURL:avatarURL(profile?.profilePicture),text:`Payment link: ${label}`,type:'payment',paymentUrl:url,paymentLabel:label,paymentQrUrl:store.data().paymentQrUrl,createdAt:serverTimestamp()});
}
export function initStoreMessages(api){
 const $=id=>document.getElementById(id);let store=null,conversation=null,stopInbox,stopThread,watchers=new Map(),session=0;
 const allowed=()=>auth.currentUser && api.isCreator() && store?.ownerUid===auth.currentUser.uid;
 const notice=error=>{$('storeMessagesStatus').textContent=error.code==='permission-denied'?'Sending was blocked by Firestore rules. Publish the updated rules and try again.':error.message;};
 function stop(){session++;stopInbox?.();stopThread?.();stopInbox=stopThread=null;for(const entry of watchers.values())entry.stop?.();watchers.clear();conversation=null;$('creatorMessageComposer').classList.add('hidden');$('creatorPaymentActions').classList.add('hidden');}
 function close(){const previous=store;stop();store=null;$('storeMessagesPage').classList.add('hidden');$('storeMessagesPage').setAttribute('aria-hidden','true');if(previous && allowedFor(previous))api.openStore(previous.id);}
 const allowedFor=s=>auth.currentUser && api.isCreator() && s.ownerUid===auth.currentUser.uid;
 function inbox(){
  const list=$('storeConversations');list.replaceChildren();
  for(const entry of [...watchers.values()].sort((a,b)=>(b.message?.createdAt?.toMillis?.()||0)-(a.message?.createdAt?.toMillis?.()||0))){
   const button=el('button',`store-conversation-card${conversation?.id===entry.id?' selected':''}`);button.type='button';button.dataset.conversationId=entry.id;
   button.append(el('strong','',entry.buyerName || (entry.message?.senderUid!==auth.currentUser?.uid?entry.message?.senderUsername:'') || 'Buyer conversation'),el('span','',entry.message?.text || 'Open conversation'));
   button.onclick=()=>select(entry);list.append(button);
  }
  if(!list.childElementCount)list.append(el('p','empty-state','Buyer conversations for this storefront will appear here.'));
 }
 function select(entry){
  if(!allowed())return;conversation=entry;stopThread?.();const token=++session;
  $('storeMessagesStatus').textContent='';$('creatorMessageComposer').classList.remove('hidden');$('creatorPaymentActions').classList.remove('hidden');inbox();
  $('creatorMessageThread').replaceChildren(el('p','helper-text','Loading conversation…'));
  stopThread=onSnapshot(query(collection(db,'chats',entry.id,'messages'),orderBy('createdAt','asc')),snapshot=>{
   if(token!==session || !allowed())return;
   const thread=$('creatorMessageThread');thread.replaceChildren();
   const messages=snapshot.docs.map(item=>item.data());entry.buyerName=messages.find(m=>m.senderUid!==auth.currentUser.uid && m.senderUsername)?.senderUsername;
   $('creatorConversationTitle').textContent=entry.buyerName || 'Buyer conversation';inbox();
   for(const message of messages){const bubble=el('article',`chat-message${message.senderUid===auth.currentUser.uid?' mine':''}`);const identity=el('div','room-message-identity');identity.append(createAvatar(message.senderPhotoURL,message.senderUsername),el('strong','',message.senderUid===auth.currentUser.uid?'You':message.senderUsername || 'Buyer'));bubble.append(identity,message.type==='payment'?createPaymentCard(message):renderChatContent(message.text || ''));bubble.append(el('time','helper-text',message.createdAt?.toDate?.().toLocaleString() || 'Just now'));thread.append(bubble);}
   if(!messages.length)thread.append(el('p','empty-state','Send a message to start the conversation.'));thread.scrollTop=thread.scrollHeight;
   if(!$('storeMessagesPage').classList.contains('hidden') && !document.hidden)setDoc(doc(db,'chats',entry.id,'readStates',auth.currentUser.uid),{readAt:serverTimestamp()}).catch(notice);
  },notice);
 }
 function open(selected){
  if(!allowedFor(selected))return;stop();store=selected;const ownerUid=auth.currentUser.uid;
  $('storeMessagesTitle').textContent=`${store.name} · Messages`;$('storeMessagesStatus').textContent='';$('creatorMessageThread').replaceChildren(el('p','empty-state','Select a buyer conversation to read messages or send a payment link.'));$('creatorConversationTitle').textContent='Buyer messages';
  document.querySelectorAll('.modal-overlay,.storefront-page,.room-page').forEach(n=>n.classList.add('hidden'));$('tasksPage').classList.add('hidden');$('notificationsPage').classList.add('hidden');
  $('storeMessagesPage').classList.remove('hidden');$('storeMessagesPage').setAttribute('aria-hidden','false');window.scrollTo(0,0);
  stopInbox=onSnapshot(query(collection(db,'chats'),where('participants','array-contains',ownerUid)),snapshot=>{
   if(!allowed() || store.id!==selected.id)return;
   const items=snapshot.docs.map(item=>({id:item.id,...item.data()})).filter(item=>item.storeId===store.id && item.participants.includes(ownerUid) && item.participants.some(uid=>uid!==ownerUid));
   const ids=new Set(items.map(item=>item.id));for(const [id,entry] of watchers)if(!ids.has(id)){entry.stop?.();watchers.delete(id);if(conversation?.id===id){stopThread?.();conversation=null;$('creatorMessageComposer').classList.add('hidden');$('creatorPaymentActions').classList.add('hidden');$('creatorMessageThread').replaceChildren();}}
   for(const item of items)if(!watchers.has(item.id)){const entry={...item,message:null};watchers.set(item.id,entry);entry.stop=onSnapshot(query(collection(db,'chats',item.id,'messages'),orderBy('createdAt','desc'),limit(1)),snapshot=>{if(!allowed())return;entry.message=snapshot.docs[0]?.data();inbox();},notice);}
   inbox();
  },notice);
 }
 $('storefrontMessagesButton').onclick=()=>{const selected=api.store();if(selected)open(selected);};$('closeStoreMessages').onclick=close;
 $('creatorMessageComposer').onsubmit=async event=>{event.preventDefault();if(!allowed() || !conversation)return;const form=event.currentTarget,text=form.elements.message.value.trim(),button=form.querySelector('[type=submit]');if(!text || text.length>500 || button.disabled)return;button.disabled=true;try{await addDoc(collection(db,'chats',conversation.id,'messages'),{senderUid:auth.currentUser.uid,senderUsername:api.profile()?.username || 'Creator',senderPhotoURL:avatarURL(api.profile()?.profilePicture),text,createdAt:serverTimestamp()});form.reset();}catch(error){notice(error);}finally{button.disabled=false;}};
 $('sendCreatorPayment').onclick=async event=>{if(!allowed() || !conversation)return;const button=event.currentTarget;if(button.disabled)return;button.disabled=true;try{await sendStorePayment(conversation.id,api.profile());$('storeMessagesStatus').textContent='Saved payment link and QR code sent.';}catch(error){notice(error);}finally{button.disabled=false;}};
 onAuthStateChanged(auth,()=>{if(store && !allowed()){stop();store=null;$('storeMessagesPage').classList.add('hidden');}});
 return {open,refreshRole(){if(store && !allowed()){stop();store=null;$('storeMessagesPage').classList.add('hidden');}}};
}
