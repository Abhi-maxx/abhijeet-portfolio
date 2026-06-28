// Terminal typing sequence
  const termBody = document.getElementById('termBody');
  const lines = [
    {p:true, html:`<span class="key">curl</span> <span class="str">-X GET</span> https://api.dev/abhijeet`},
    {p:false, html:`<span class="com">// fetching developer profile...</span>`},
    {p:false, html:`{`},
    {p:false, html:`&nbsp;&nbsp;"name": <span class="str">"Abhijeet Divekar"</span>,`},
    {p:false, html:`&nbsp;&nbsp;"role": <span class="str">"Full Stack Developer"</span>,`},
    {p:false, html:`&nbsp;&nbsp;"stack": [<span class="str">"Angular"</span>, <span class="str">"ASP.NET Core"</span>, <span class="str">"Azure"</span>],`},
    {p:false, html:`&nbsp;&nbsp;"experience": <span class="key">1.9</span>,`},
    {p:false, html:`&nbsp;&nbsp;"status": <span class="str">"available_for_hire"</span>`},
    {p:false, html:`}`},
  ];
  let li = 0;
  function typeLine(){
    if(li >= lines.length){
      const cur = document.createElement('div');
      cur.innerHTML = `<span class="prompt-sym">➜</span> <span class="cursor"></span>`;
      cur.className = 'line';
      termBody.appendChild(cur);
      return;
    }
    const lineObj = lines[li];
    const div = document.createElement('div');
    div.className = 'line';
    if(lineObj.p){ div.innerHTML = `<span class="prompt-sym">➜</span> `; }
    termBody.appendChild(div);
    const target = lineObj.html;
    setTimeout(()=>{
      div.innerHTML = (lineObj.p ? `<span class="prompt-sym">➜</span> ` : '') + target;
      li++;
      setTimeout(typeLine, lineObj.p ? 380 : 160);
    }, 40);
  }
  typeLine();

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('show');
        e.target.querySelectorAll('.bar-fill').forEach(fill=>{
          fill.style.width = fill.dataset.pct + '%';
        });
        obs.unobserve(e.target);
      }
    });
  }, {threshold:0.15});
  reveals.forEach(el=>obs.observe(el));

  // respect reduced motion
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    reveals.forEach(el=>el.classList.add('show'));
  }

  // Card tilt on hover
  document.querySelectorAll('.card, .endpoint').forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -6;
      const ry = ((x / r.width) - 0.5) * 6;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform = ''; });
  });

  // Contact form -> mailto
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const message = document.getElementById('cf-message').value.trim();
      const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:abhijeetdivekar744@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', ()=>{
      navLinks.classList.toggle('open');
      navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
    // close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>{
        navLinks.classList.remove('open');
        navToggle.textContent = '☰';
      });
    });
  }