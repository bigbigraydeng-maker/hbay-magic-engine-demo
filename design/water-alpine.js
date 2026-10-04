(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root=document.documentElement;

  // reveal on scroll
  var targets=document.querySelectorAll('.water-article > *, .promise-head, .promise, .promise-ref, .profile .section-head, .sample-panel, .explain > div, .reading > *');
  if(!reduce&&'IntersectionObserver' in window){
    targets.forEach(function(el,i){el.classList.add('reveal');el.style.setProperty('--d',(i%3)*90+'ms')});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    targets.forEach(function(el){io.observe(el)});
  }

  // count-up numbers
  function fmt(n,dec,comma){var t=n.toFixed(dec);return comma?Number(t).toLocaleString('en-NZ',{minimumFractionDigits:dec,maximumFractionDigits:dec}):t}
  if(!reduce&&'IntersectionObserver' in window){
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;cio.unobserve(e.target);
      var el=e.target,raw=el.getAttribute('data-count'),comma=raw.indexOf(',')>-1,end=parseFloat(raw.replace(/,/g,'')),dec=(raw.split('.')[1]||'').length,t0=null,dur=1400;
      function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),v=end*(1-Math.pow(1-k,3));el.textContent=fmt(v,dec,comma);if(k<1)requestAnimationFrame(step);else el.textContent=raw}
      requestAnimationFrame(step);
    })},{threshold:.6});
    document.querySelectorAll('[data-count]').forEach(function(el){cio.observe(el)});
  }

  // parallax + depth gauge fill
  var gauge=document.querySelector('.depth-gauge'),fill=document.querySelector('.gauge-fill'),ticking=false;
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){
      var y=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;
      if(!reduce){
        root.style.setProperty('--py',Math.min(90,y*.12)+'px');
        var ls=document.getElementById('landscape');
        if(ls){var r=ls.getBoundingClientRect();root.style.setProperty('--py2',(-r.top*.08)+'px')}
      }
      if(fill&&h>0)fill.style.height=Math.min(100,y/h*100)+'%';
      if(gauge)gauge.classList.toggle('show',y>260);
      ticking=false;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  // active gauge stop
  var stops={};document.querySelectorAll('.depth-gauge a').forEach(function(a){stops[a.getAttribute('data-depth')]=a});
  var ids=['top','landscape','artesian','source','profile'];
  function setActive(){
    var mid=window.innerHeight*.45,cur='top';
    ids.forEach(function(id){var el=id==='top'?document.querySelector('.water-hero'):document.getElementById(id);if(el&&el.getBoundingClientRect().top<=mid)cur=id});
    Object.keys(stops).forEach(function(k){stops[k].classList.toggle('on',k===cur)});
  }
  window.addEventListener('scroll',setActive,{passive:true});setActive();

  // promise cards
  document.querySelectorAll('.promise').forEach(function(b){
    b.addEventListener('click',function(){
      var open=b.getAttribute('aria-expanded')==='true';
      document.querySelectorAll('.promise').forEach(function(o){o.setAttribute('aria-expanded','false')});
      b.setAttribute('aria-expanded',open?'false':'true');
    });
  });

  // mineral bubbles
  var note=document.getElementById('mineral-note'),base=note?note.textContent:'';
  document.querySelectorAll('.mineral').forEach(function(m){
    function show(){document.querySelectorAll('.mineral').forEach(function(o){o.classList.toggle('active',o===m)});if(note)note.textContent=m.getAttribute('data-note')}
    function hide(){m.classList.remove('active');if(note)note.textContent=base}
    m.addEventListener('mouseenter',show);m.addEventListener('focus',show);m.addEventListener('click',show);
    m.addEventListener('mouseleave',hide);m.addEventListener('blur',hide);
  });
})();
