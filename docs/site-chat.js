(function(){
  'use strict';
  var API='https://crm.vaivoandomoradadosol.com.br/api/chat';
  var active=null, timer=null, lastId=0, fallback='';
  var esc=function(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var post=async function(path,data){var r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data),cache:'no-store'});var x=await r.json();if(!r.ok)throw new Error(x.error||'Não foi possível iniciar o atendimento.');return x};
  var upload=async function(file){var data=new FormData();data.append('token',active.token);data.append('file',file);var r=await fetch(API+'/visitor/upload',{method:'POST',body:data,cache:'no-store'});var x=await r.json();if(!r.ok)throw new Error(x.error||'Não foi possível enviar o arquivo.');return x};
  var download=async function(id,name){var r=await fetch(API+'/visitor/attachment/'+id,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({token:active.token}),cache:'no-store'});if(!r.ok)throw new Error('Não foi possível abrir o arquivo.');var url=URL.createObjectURL(await r.blob()),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(function(){URL.revokeObjectURL(url)},60000)};
  var root=document.createElement('div');root.id='vv-chat-root';document.body.appendChild(root);
  function close(){clearInterval(timer);root.innerHTML=active?'<button type="button" class="vv-chat-launcher">Voltar ao atendimento 💬</button>':'';document.body.classList.remove('vv-chat-open');if(active)root.querySelector('button').onclick=chat}
  function context(link){
    var box=link.closest('article,section')||document;
    var title=box.querySelector('h3,h2')?.textContent.trim()||'Viagem sob consulta';
    var price=box.querySelector('.preco .val,.valor,#destaque-preco')?.textContent.trim().replace(/\s+/g,' ').slice(0,60)||'';
    var id=Number(link.dataset.editorialId||0);
    return {offer_title:title.slice(0,160),offer_price:price,offer_id:id||null,page_url:location.href.slice(0,400)};
  }
  function waLink(original,name,ctx){
    var u=new URL(original);var previous=u.searchParams.get('text')||'';
    u.searchParams.set('text','Olá! Meu nome é '+name+'. '+(previous||'Tenho interesse em '+ctx.offer_title+'.')+(ctx.offer_price?' Valor exibido: '+ctx.offer_price+'.':''));
    return u.toString();
  }
  function count(source,id){if(!navigator.sendBeacon)return;var d={source:source};if(id)d.offer_id=id;navigator.sendBeacon('https://crm.vaivoandomoradadosol.com.br/api/site/click',new Blob([JSON.stringify(d)],{type:'text/plain'}))}
  function form(link){
    var ctx=context(link),original=link.href;
    root.innerHTML='<div class="vv-chat-backdrop"></div><section class="vv-chat-panel" role="dialog" aria-modal="true" aria-labelledby="vv-chat-title"><button type="button" class="vv-chat-close" aria-label="Fechar">×</button><h2 id="vv-chat-title">Vamos conversar sobre sua viagem</h2><p class="vv-chat-offer">'+esc(ctx.offer_title)+(ctx.offer_price?' · '+esc(ctx.offer_price):'')+'</p><p>Deixe seus dados para iniciar o atendimento.</p><form id="vv-chat-lead"><label>Seu nome<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label><label>Celular com DDD<input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(16) 99999-9999" required></label><label class="vv-chat-consent"><input name="consent" type="checkbox" required> Autorizo a agência a usar meu nome e celular para responder a esta solicitação.</label><p class="vv-chat-error" role="alert" hidden></p><button type="submit">Continuar</button></form></section>';
    document.body.classList.add('vv-chat-open');
    root.querySelector('.vv-chat-close').onclick=close;root.querySelector('.vv-chat-backdrop').onclick=close;
    root.querySelector('input[name="name"]').focus();
    root.querySelector('form').onsubmit=async function(e){e.preventDefault();var f=e.currentTarget,button=f.querySelector('button[type="submit"]'),name=f.elements.name.value.trim(),phone=f.elements.phone.value.trim();button.disabled=true;button.textContent='Conectando…';try{
      var result=await post('/start',Object.assign({name:name,phone:phone,consent:f.elements.consent.checked,message:'Tenho interesse em '+ctx.offer_title+'.'},ctx));
      fallback=waLink(original,name,ctx);
      count(result.online?'chat':ctx.offer_id?'offer_whatsapp':'page_whatsapp',ctx.offer_id);
      if(result.online&&result.token){active={token:result.token,name:name,title:ctx.offer_title};sessionStorage.setItem('vv-site-chat',JSON.stringify({active:active,fallback:fallback}));chat();}
      else location.assign(fallback);
    }catch(err){var error=f.querySelector('.vv-chat-error');error.hidden=false;error.textContent=err.message;button.disabled=false;button.textContent='Continuar'}};
  }
  function chat(){
    lastId=0;clearInterval(timer);
    root.innerHTML='<div class="vv-chat-backdrop"></div><section class="vv-chat-panel vv-chat-conversation" role="dialog" aria-modal="true" aria-labelledby="vv-chat-title"><button type="button" class="vv-chat-close" aria-label="Fechar">×</button><h2 id="vv-chat-title">Atendimento Vai Voando</h2><p class="vv-chat-offer">'+esc(active.title)+'</p><div class="vv-chat-messages" aria-live="polite"></div><form id="vv-chat-message"><label class="vv-chat-attach" title="Anexar imagem ou PDF">📎<input name="file" type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" aria-label="Anexar imagem ou PDF" hidden></label><input name="body" maxlength="1000" placeholder="Escreva sua mensagem" aria-label="Mensagem" required><button type="submit">Enviar</button></form><small class="vv-chat-file-hint">Imagens e PDF de até 5 MB</small><p class="vv-chat-fallback" hidden>Nosso atendimento ficou indisponível. <a href="'+esc(fallback)+'">Continuar no WhatsApp ↗</a></p></section>';
    root.querySelector('.vv-chat-close').onclick=close;root.querySelector('.vv-chat-backdrop').onclick=close;
    root.querySelector('form').onsubmit=async function(e){e.preventDefault();var f=e.currentTarget,body=f.elements.body.value.trim();if(!body)return;f.elements.body.disabled=true;try{await post('/visitor/send',{token:active.token,body:body});f.elements.body.value='';await poll()}catch(err){root.querySelector('.vv-chat-fallback').hidden=false}finally{f.elements.body.disabled=false;f.elements.body.focus()}};
    root.querySelector('input[name="file"]').onchange=async function(e){var file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024){alert('O arquivo deve ter até 5 MB.');e.target.value='';return}e.target.disabled=true;try{await upload(file);await poll()}catch(err){alert(err.message)}finally{e.target.disabled=false;e.target.value=''}};
    poll();timer=setInterval(poll,4000);
  }
  async function poll(){
    if(!active)return;
    try{var result=await post('/visitor/messages',{token:active.token,after:lastId});var panel=root.querySelector('.vv-chat-messages');if(!panel)return;
      result.messages.forEach(function(m){lastId=Math.max(lastId,m.id);var div=document.createElement('div');div.className='vv-chat-bubble '+(m.sender==='staff'?'staff':'visitor');if(m.attachment_id){var link=document.createElement('button');link.type='button';link.className='vv-chat-download';link.textContent='📎 '+m.filename;link.onclick=function(){download(m.attachment_id,m.filename).catch(function(err){alert(err.message)})};div.appendChild(link)}else div.textContent=m.body;panel.appendChild(div)});
      panel.scrollTop=panel.scrollHeight;
      if(result.status!=='open'){clearInterval(timer);root.querySelector('.vv-chat-fallback').hidden=false;root.querySelector('form').hidden=true;sessionStorage.removeItem('vv-site-chat');}
    }catch(err){console.error('Atendimento',err)}
  }
  document.addEventListener('click',function(e){var link=e.target.closest('a.btn-zap[href^="https://wa.me/"],a.btn-zap[href^="https://api.whatsapp.com/"]');if(!link)return;e.preventDefault();form(link)},true);
  try{var saved=JSON.parse(sessionStorage.getItem('vv-site-chat')||'null');if(saved&&saved.active&&saved.active.token){active=saved.active;fallback=saved.fallback||'';close()}}catch(e){sessionStorage.removeItem('vv-site-chat')}
})();

