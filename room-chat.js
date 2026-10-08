import { auth, db, collection, doc, setDoc, onSnapshot, query, limit, serverTimestamp } from './firebase.js';
const el = (tag, className='', text='') => { const item=document.createElement(tag); item.className=className; item.textContent=text; return item; };
const safeImage = url => typeof url==='string' && /^(https:\/\/|data:image\/(png|jpeg|gif|webp);base64,)/i.test(url);
export const avatarURL = url => safeImage(url) && url.length <= 2048 ? url : '';
export function createAvatar(url, username='?') {
  const avatar=el('span','chat-avatar',(username || '?').replace(/^@/,'').charAt(0).toUpperCase());
  if(safeImage(url)){const image=el('img');image.src=url;image.alt=`${username || 'Member'} profile picture`;image.loading='lazy';image.addEventListener('error',()=>image.remove(),{once:true});avatar.append(image);}
  return avatar;
}
// Render with text nodes only: pasted HTML, script tags and code cannot execute.
function prose(text) {
  const paragraph=el('p','chat-prose');
  const pattern=/(`[^`\n]+`)|(@[\p{L}\p{N}_.-]+)/gu; let last=0;
  for(const match of text.matchAll(pattern)){
    paragraph.append(document.createTextNode(text.slice(last,match.index)));
    paragraph.append(match[1]?el('code','inline-code',match[1].slice(1,-1)):el('span','user-mention',match[2]));last=match.index+match[0].length;
  }
  paragraph.append(document.createTextNode(text.slice(last)));return paragraph;
}
export function looksLikeCode(text) {
  const value=text.trim();
  return /^(?:<!doctype|<\/?[a-z][\w-]*(?:\s[^>]*|)>)/i.test(value)
    || /^[\[{][\s\S]*[\]}]$/.test(value) && /["':]/.test(value)
    || /^(?:\s*)(?:import\s.+\sfrom\s|(?:export\s+)?(?:const|let|var)\s+\w+\s*=|(?:async\s+)?function\s+\w+\s*\(|(?:async\s+)?def\s+\w+\s*\(|class\s+\w+|(?:if|for|while)\s*\(.+\)\s*\{|(?:SELECT|INSERT INTO|CREATE TABLE)\s)/m.test(value)
    || /^\s*[.#][\w-]+[^\n]*\{[\s\S]*:[\s\S]*\}/m.test(value)
    || value.split('\n').filter(line=>/^\s*(?:[\w.$]+\([^\n]*\);?|[}\]];?|\/\/|#\s|\w+\s*[:=]\s*.+[;,])\s*$/.test(line)).length>=2;
}
function codeBlock(text, language='') {
  const block=el('section','chat-code-block');const heading=el('div','chat-code-heading');
  heading.append(el('span','',language || 'Code'));
  const copy=el('button','chat-code-copy','Copy');copy.type='button';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);copy.textContent='Copied';}catch{copy.textContent='Select code to copy';}setTimeout(()=>copy.textContent='Copy',2000);});heading.append(copy);
  const pre=el('pre');pre.tabIndex=0;pre.setAttribute('aria-label',`${language || 'Code'} snippet`);pre.append(el('code','',text));block.append(heading,pre);return block;
}
export function renderChatContent(text) {
  const container=el('div','chat-content');
  const fences=/```([^\n`]*)\n?([\s\S]*?)(?:```|$)/g;let last=0,found=false;
  for(const match of text.matchAll(fences)){
    found=true;const before=text.slice(last,match.index);if(before.trim())container.append(prose(before));
    container.append(codeBlock(match[2].replace(/\n$/,''),match[1].trim().slice(0,30)));last=match.index+match[0].length;
  }
  if(!found){container.append(looksLikeCode(text)?codeBlock(text):prose(text));}
  else if(text.slice(last).trim())container.append(prose(text.slice(last)));
  return container;
}
export function createRoomTools({input,profile,onError}) {
  let roomId=null,unsubscribe,interval,idleTimer,writeAt=0,members=[],messages=[],options=[],selected=0,range=null;
  const suggestions=document.getElementById('roomMentionSuggestions'),indicator=document.getElementById('roomTypingIndicator');
  const username=()=> (profile()?.username || 'Coriva member').replace(/^@/,'');
  const candidates=()=> [...new Map([...messages.map(m=>({uid:m.senderUid,username:m.senderUsername})),...members].filter(m=>m.uid && m.username).map(m=>[m.uid,{...m,username:m.username.replace(/^@/,'')}])).values()].filter(m=>m.uid!==auth.currentUser?.uid);
  function hide(){suggestions.replaceChildren();suggestions.classList.add('hidden');input.removeAttribute('aria-activedescendant');options=[];range=null;}
  function renderTyping(){
    const now=Date.now(),names=members.filter(m=>m.uid!==auth.currentUser?.uid && m.typing && now-(m.updatedAt?.toMillis?.() || 0)<6500).map(m=>m.username);
    indicator.textContent=names.length?`${names.slice(0,3).join(', ')}${names.length>3?' and others':''} ${names.length===1?'is':'are'} typing…`:'';
  }
  async function publish(typing, target=roomId){
    if(!target || !auth.currentUser)return;
    try{await setDoc(doc(db,'rooms',target,'members',auth.currentUser.uid),{uid:auth.currentUser.uid,username:username().slice(0,100),photoURL:avatarURL(profile()?.profilePicture),typing,updatedAt:serverTimestamp()});}
    catch(error){onError(error);}
  }
  function stopTyping(){clearTimeout(idleTimer);if(roomId)publish(false);writeAt=0;}
  function pick(index){const person=options[index];if(!person || !range)return;input.setRangeText(`@${person.username} `,range.start,range.end,'end');hide();input.focus();}
  function highlight(){[...suggestions.children].forEach((node,i)=>{node.classList.toggle('selected',i===selected);node.setAttribute('aria-selected',String(i===selected));});input.setAttribute('aria-activedescendant',`mention-option-${selected}`);}
  input.addEventListener('input',()=>{
    if(roomId && auth.currentUser){
      clearTimeout(idleTimer);
      if(input.value.trim()){if(Date.now()-writeAt>2500){publish(true);writeAt=Date.now();}idleTimer=setTimeout(stopTyping,4500);}else stopTyping();
    }
    const start=input.value.lastIndexOf('@',input.selectionStart-1),before=input.value[start-1];
    if(start<0 || (before && !/\s/.test(before))){hide();return;}
    const fragment=input.value.slice(start+1,input.selectionStart);if(fragment.includes('\n') || fragment.length>100){hide();return;}
    options=candidates().filter(m=>m.username.toLowerCase().startsWith(fragment.toLowerCase())).slice(0,8);selected=0;range={start,end:input.selectionStart};suggestions.replaceChildren();
    options.forEach((person,i)=>{const option=el('button','mention-option',`@${person.username}`);option.type='button';option.id=`mention-option-${i}`;option.setAttribute('role','option');option.addEventListener('mousedown',e=>e.preventDefault());option.addEventListener('click',()=>pick(i));suggestions.append(option);});suggestions.classList.toggle('hidden',!options.length);if(options.length)highlight();
  });
  input.setAttribute('aria-controls','roomMentionSuggestions');input.setAttribute('aria-autocomplete','list');
  input.addEventListener('keydown',event=>{
    if(options.length && ['ArrowDown','ArrowUp','Enter','Tab','Escape'].includes(event.key)){
      event.preventDefault();if(event.key==='Escape')hide();else if(event.key==='Enter'||event.key==='Tab')pick(selected);else{selected=(selected+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;highlight();}return;
    }
    if(event.key==='Enter' && (event.ctrlKey||event.metaKey)){event.preventDefault();input.form.requestSubmit();}
  });
  input.addEventListener('blur',()=>{stopTyping();setTimeout(hide,150);});
  function close(){const old=roomId;clearTimeout(idleTimer);clearInterval(interval);unsubscribe?.();unsubscribe=null;roomId=null;members=[];messages=[];hide();indicator.textContent='';if(old)publish(false,old);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTyping();});
  const page=document.getElementById('roomPage');
  if(page)new MutationObserver(()=>{if(page.classList.contains('hidden')&&roomId)close();}).observe(page,{attributes:true,attributeFilter:['class']});
  return {
    open(id){close();roomId=id;writeAt=0;if(auth.currentUser)publish(false);unsubscribe=onSnapshot(query(collection(db,'rooms',id,'members'),limit(200)),snapshot=>{members=snapshot.docs.map(d=>d.data());renderTyping();},onError);interval=setInterval(renderTyping,1000);},
    close,setMessages(items){messages=items;},sent(){stopTyping();hide();},
    mentionedUsers(text){return candidates().filter(m=>{const target=`@${m.username}`.toLowerCase(),value=text.toLowerCase();let index=value.indexOf(target);while(index!==-1){const left=value[index-1],right=value[index+target.length];if((!left||/\s/.test(left))&&(!right||/[\s,!?;:.)]/.test(right)))return true;index=value.indexOf(target,index+target.length);}return false;}).slice(0,10).map(m=>m.uid);}
  };
}
