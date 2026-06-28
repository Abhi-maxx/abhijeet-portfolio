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
      // reveal interactive input after scripted intro finishes
      const inputRow = document.getElementById('termInputRow');
      const hint = document.getElementById('termHint');
      if(inputRow) inputRow.style.display = 'flex';
      if(hint) hint.style.display = 'block';
      const termInput = document.getElementById('termInput');
      if(termInput) setTimeout(()=>termInput.focus(), 200);
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
    navLinks.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>{
        navLinks.classList.remove('open');
        navToggle.textContent = '☰';
      });
    });
  }

  // ===== INTERACTIVE AI TERMINAL =====
  const termInput = document.getElementById('termInput');
  if(termInput){
    termInput.addEventListener('keydown', async (e)=>{
      if(e.key !== 'Enter') return;
      const value = termInput.value.trim();
      if(!value) return;
      termInput.value = '';
      termInput.disabled = true;

      // echo user line
      const userLine = document.createElement('div');
      userLine.className = 'line term-line-user';
      userLine.innerHTML = `<span class="prompt-sym">➜</span> ${escapeHtml(value)}`;
      termBody.appendChild(userLine);

      // loading line
      const loadingLine = document.createElement('div');
      loadingLine.className = 'line term-line-loading';
      loadingLine.textContent = 'thinking...';
      termBody.appendChild(loadingLine);
      termBody.scrollTop = termBody.scrollHeight;

      try{
        const res = await fetch('/api/chat', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mode:'terminal', input: value })
        });
        const data = await res.json();
        loadingLine.remove();
        const replyLine = document.createElement('div');
        if(!res.ok || data.error){
          replyLine.className = 'line term-line-error';
          replyLine.textContent = 'Error: ' + (data.error || 'something went wrong');
        } else {
          replyLine.className = 'line term-line-ai';
          replyLine.textContent = data.reply;
        }
        termBody.appendChild(replyLine);
      } catch(err){
        loadingLine.remove();
        const errLine = document.createElement('div');
        errLine.className = 'line term-line-error';
        errLine.textContent = 'Connection error — try again.';
        termBody.appendChild(errLine);
      }

      termInput.disabled = false;
      termInput.focus();
      termBody.scrollTop = termBody.scrollHeight;
    });
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== AI JOB MATCH SCORE =====
  const jmBtn = document.getElementById('jmBtn');
  const jmInput = document.getElementById('jmInput');
  const jmResult = document.getElementById('jmResult');

  if(jmBtn){
    jmBtn.addEventListener('click', async ()=>{
      const jd = jmInput.value.trim();
      if(!jd){
        jmInput.focus();
        return;
      }
      jmBtn.disabled = true;
      const originalText = jmBtn.textContent;
      jmBtn.textContent = 'Analyzing...';
      jmResult.style.display = 'block';
      jmResult.innerHTML = `<div class="term-line-loading" style="font-family:'JetBrains Mono',monospace;">Comparing job description against resume...</div>`;

      try{
        const res = await fetch('/api/chat', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mode:'jobmatch', input: jd })
        });
        const data = await res.json();

        if(!res.ok || data.error){
          jmResult.innerHTML = `<div class="jm-error">Error: ${escapeHtml(data.error || 'something went wrong')}</div>`;
        } else {
          const matchesHtml = (data.matches || []).map(m=>`<li>${escapeHtml(m)}</li>`).join('');
          const gapsHtml = (data.gaps || []).map(g=>`<li>${escapeHtml(g)}</li>`).join('');
          jmResult.innerHTML = `
            <div class="jm-score-row">
              <div class="jm-score-circle">${data.score}%</div>
              <div class="jm-verdict">${escapeHtml(data.verdict || '')}</div>
            </div>
            ${matchesHtml ? `<div><div class="jm-list-title">Matches</div><ul class="jm-list matches">${matchesHtml}</ul></div>` : ''}
            ${gapsHtml ? `<div><div class="jm-list-title">Gaps</div><ul class="jm-list gaps">${gapsHtml}</ul></div>` : ''}
          `;
        }
      } catch(err){
        jmResult.innerHTML = `<div class="jm-error">Connection error — try again.</div>`;
      }

      jmBtn.disabled = false;
      jmBtn.textContent = originalText;
    });
  }