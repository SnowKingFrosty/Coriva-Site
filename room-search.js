const el=(tag,className='',text='')=>{const node=document.createElement(tag);node.className=className;node.textContent=text;return node;};
const lower=text=>String(text || '').toLocaleLowerCase();
export function parseSearchQuery(query) {
  const raw=String(query || '').trim();
  const match=raw.match(/^@(?:"([^"]+)"|([^\s]+))(?:\s+([\s\S]*))?$/);
  return match?{user:lower(match[1] || match[2]),term:lower((match[3] || '').trim())}:{user:'',term:lower(raw)};
}
export function matchesRoomQuery(room,query) {
  const {user,term}=parseSearchQuery(query);
  const creator=lower(room.creatorUsername).replace(/^@/,'');
  return (!user || creator===user) && (!term || lower(`${room.title || ''} ${room.description || ''} ${room.creatorUsername || ''}`).includes(term));
}
export function initRoomSearch({jump}) {
  const form=document.getElementById('roomMessageSearchForm'),input=document.getElementById('roomMessageSearchInput'),clear=document.getElementById('clearRoomMessageSearch'),status=document.getElementById('roomMessageSearchStatus'),results=document.getElementById('roomMessageSearchResults');
  let messages=[],visibleCount=50;
  function highlighted(text,term){
    const span=el('span');if(!term){span.textContent=text;return span;}let start=0,index=lower(text).indexOf(term);
    while(index!==-1){span.append(document.createTextNode(text.slice(start,index)),el('mark','',text.slice(index,index+term.length)));start=index+term.length;index=lower(text).indexOf(term,start);}
    span.append(document.createTextNode(text.slice(start)));return span;
  }
  function render(){
    const query=input.value.trim(),{user,term}=parseSearchQuery(query);results.replaceChildren();clear.classList.toggle('hidden',!input.value);results.classList.toggle('hidden',!query);
    if(!query){status.textContent='';return;}
    const matches=messages.filter(message=>(!user || lower(message.senderUsername).replace(/^@/,'')===user) && (!term || [message.text,message.gifTitle,...(!user?[message.senderUsername]:[])].some(text=>lower(text).includes(term)))).slice().reverse();
    status.textContent=matches.length?`${matches.length} ${matches.length===1?'message':'messages'} found${matches.length>visibleCount?` · Showing ${visibleCount}`:''}. Select a result to jump to it.`:`No messages found for “${input.value.trim()}”.`;
    if(!matches.length)return;
    for(const message of matches.slice(0,visibleCount)){
      const button=el('button','room-search-result');button.type='button';button.dataset.searchMessageId=message.id;
      const author=highlighted(message.senderUsername || 'Coriva member',user || term);author.className='room-search-result-author';
      const raw=message.text || message.gifTitle || 'GIF';const index=lower(raw).indexOf(term),start=Math.max(0,index-65);
      const snippet=(start?'…':'')+raw.slice(start,start+240)+(raw.length>start+240?'…':'');
      const preview=highlighted(snippet,term);preview.className='room-search-result-preview';
      const date=message.createdAt?.toDate?.();
      button.append(author,preview,el('time','',date?date.toLocaleString():'Just now'));
      button.addEventListener('click',()=>jump(message.id));results.append(button);
    }
    if(matches.length>visibleCount){const more=el('button','secondary-btn','Show more results');more.type='button';more.addEventListener('click',()=>{visibleCount+=50;render();});results.append(more);}
  }
  input.addEventListener('input',()=>{visibleCount=50;render();});
  form.addEventListener('submit',event=>{event.preventDefault();visibleCount=50;render();});
  clear.addEventListener('click',()=>{input.value='';visibleCount=50;render();jump(null);input.focus();});
  return {update(items){messages=items;render();},reset(){input.value='';messages=[];visibleCount=50;render();}};
}
