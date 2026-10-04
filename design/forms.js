(function(){
  var TO='admin@nzmiracle.com';
  document.querySelectorAll('form[data-subject]').forEach(function(f){
    var status=f.querySelector('.form-status');
    f.setAttribute('novalidate','');
    function setBad(field,bad,msg){var w=field.closest('.field');if(!w)return;w.classList.toggle('bad',bad);var e=w.querySelector('.err');if(e&&msg)e.textContent=msg}
    f.querySelectorAll('input,select,textarea').forEach(function(el){
      el.addEventListener('blur',function(){if(el.willValidate&&el.type!=='checkbox')setBad(el,!el.checkValidity(),el.validationMessage)});
      el.addEventListener('input',function(){if(el.closest('.field')&&el.closest('.field').classList.contains('bad')&&el.checkValidity())setBad(el,false)});
    });
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var first=null;
      f.querySelectorAll('input,select,textarea').forEach(function(el){
        if(!el.willValidate)return;var ok=el.checkValidity();
        if(el.type!=='checkbox')setBad(el,!ok,el.validationMessage);
        if(!ok&&!first)first=el;
      });
      if(first){first.focus();if(status){status.className='form-status';status.textContent='Please check the highlighted fields.'}return}
      var lines=[];
      f.querySelectorAll('.field').forEach(function(w){
        var el=w.querySelector('input,select,textarea');if(!el||!el.value)return;
        var lab=(w.querySelector('label')||{}).textContent||el.name;lines.push(lab.replace(/\s*\(optional\)\s*/i,'').trim()+': '+el.value);
      });
      f.querySelectorAll('fieldset').forEach(function(fs){
        var picked=[].map.call(fs.querySelectorAll('input:checked'),function(i){return i.value});
        if(picked.length)lines.push(fs.querySelector('legend').textContent.trim()+': '+picked.join(', '));
      });
      var url='mailto:'+TO+'?subject='+encodeURIComponent(f.getAttribute('data-subject'))+'&body='+encodeURIComponent(lines.join('\n'));
      window.location.href=url;
      if(status){status.className='form-status ok';status.textContent='Thanks. Your email app should open with your enquiry ready to send. If it does not, write to '+TO+'.'}
    });
  });
})();
