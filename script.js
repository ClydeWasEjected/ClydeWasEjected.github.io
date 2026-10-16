(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EMAIL = ['clyde.john253', 'gmail.com'].join('@');
  const mailto = (subject) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

  /* ---------- content shared by terminal, diagram and menu ---------- */
  const HOSTS = {
    internet: ['Internet', 'Everything outside. Nothing reaches the lab without going through pfSense first.'],
    pfsense: ['pfSense', 'Gateway and firewall. Ruleset audited, explicit allow and deny rules (never any-any), logging on, NAT verified. Segmented with VLANs, with traffic between them controlled by pfSense rules.'],
    lan: ['LAN', 'The lab network, segmented with VLANs and controlled by pfSense rules.'],
    a8: ['Proxmox A8', 'Always-on node. Runs pfSense and the service containers. Rule I keep: infrastructure-critical machines never live on a node that gets switched off.'],
    claude: ['Automation host', 'Always-on Debian container running Claude Code, with Syncthing keeping my notes in sync and Hermes running on systemd timers.'],
    lab: ['proxmox-lab', 'Second node on a gaming PC. Hosts the lab VMs and runs only when I need it.'],
    dc01: ['DC01', 'Domain controller for ad.jnclydehl.local: departmental OUs, groups, users, GPOs. Once traced a failed domain join to a DNS zone loading delay.'],
    win11: ['WIN11-01', 'Domain-joined Windows 11 client. Where policies land and where the attack, detect and defend exercises will run.']
  };
  const ALIAS = { pfsense: 'pfsense', dc01: 'dc01', 'win11-01': 'win11', win11: 'win11', proxmox: 'a8', 'proxmox-a8': 'a8', a8: 'a8', 'proxmox-lab': 'lab', lab: 'lab', automation: 'claude', claude: 'claude', lan: 'lan', internet: 'internet' };

  /* ---------- entrance reveal ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  $$('[data-rise], [data-card]').forEach((el, i) => {
    if (el.dataset.card !== undefined) el.style.setProperty('--i', String(i % 3));
    io.observe(el);
  });

  /* ---------- cursor spotlight on cards ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.card, .proj').forEach((c) => c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    }));
  }

  /* ---------- scroll progress + active nav ---------- */
  const bar = $('.progress i');
  const links = $$('.pill a');
  const targets = links.map((a) => $(a.getAttribute('href')));
  let tick = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    let cur = 0;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
    tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Barcelona clock ---------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const tz = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short', timeZone: 'Europe/Madrid' });
  const tickClock = () => {
    const d = new Date();
    clock.textContent = fmt.format(d);
    const z = (tz.formatToParts(d).find((p) => p.type === 'timeZoneName') || {}).value || 'CET';
    $('#clock-sub').textContent = `${z} · Europe/Madrid`;
  };
  tickClock(); setInterval(tickClock, 15000);

  /* ---------- lab diagram ---------- */
  const cap = $('#topo-cap');
  const nodes = $$('.node');
  const capDefault = cap.textContent;
  nodes.forEach((n) => {
    const pick = () => {
      nodes.forEach((x) => x.classList.toggle('sel', x === n));
      const h = HOSTS[n.dataset.n];
      cap.textContent = h ? `${h[0]}. ${h[1]}` : capDefault;
    };
    n.addEventListener('click', pick);
    n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });

  /* ---------- email: built on click, never in the page source ---------- */
  const mailBtn = $('#mail-btn');
  if (mailBtn) {
    mailBtn.addEventListener('click', (e) => { e.preventDefault(); location.href = mailto('Hello Clyde'); });
    mailBtn.setAttribute('href', '#contact');
  }
  // old cached pages may still have the copy button: make it send mail too
  const oldCopy = $('#copy');
  if (oldCopy) oldCopy.addEventListener('click', () => { location.href = mailto('Hello Clyde'); });

  /* ---------- accent colour ---------- */
  function setAccent(c) {
    document.documentElement.style.setProperty('--accent', c);
    document.querySelector('meta[name=theme-color]');
    $$('.swatches button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accent === c)));
    try { localStorage.setItem('accent', c); } catch {}
  }
  $$('.swatches button').forEach((b) => b.addEventListener('click', () => setAccent(b.dataset.accent)));
  try { const a = localStorage.getItem('accent'); if (a) setAccent(a); } catch {}

  /* ---------- effects: matrix rain + confetti ---------- */
  const cv = $('#fx'), g = cv.getContext('2d');
  let raf = 0;
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
  const stop = () => { cancelAnimationFrame(raf); g.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('on'); };
  const fx = {
    matrix() {
      if (reduce) return;
      stop(); size(); cv.classList.add('on');
      const cols = Math.floor(cv.width / 18), drops = Array(cols).fill(0).map(() => Math.random() * -40);
      const t0 = performance.now();
      const frame = (t) => {
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, cv.width, cv.height);
        g.fillStyle = '#7ddc5b'; g.font = '16px JetBrains Mono, monospace';
        drops.forEach((y, i) => {
          g.fillText(String.fromCharCode(0x30a0 + Math.random() * 96), i * 18, y * 18);
          drops[i] = y * 18 > cv.height && Math.random() > 0.975 ? 0 : y + 1;
        });
        if (t - t0 < 7000) raf = requestAnimationFrame(frame); else stop();
      };
      raf = requestAnimationFrame(frame);
    },
    confetti() {
      if (reduce) return;
      stop(); size(); cv.classList.remove('on');
      const colors = [getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff4b2b', '#ffffff', '#7ddc5b', '#4da3ff', '#ffc233'];
      const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 3, c: colors[(Math.random() * colors.length) | 0], a: 1 }));
      const frame = () => {
        g.clearRect(0, 0, cv.width, cv.height);
        let alive = 0;
        ps.forEach((p) => { p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.a -= 0.008; if (p.a > 0) { alive++; g.globalAlpha = p.a; g.fillStyle = p.c; g.fillRect(p.x, p.y, p.r, p.r * 1.6); } });
        g.globalAlpha = 1;
        if (alive) raf = requestAnimationFrame(frame); else stop();
      };
      raf = requestAnimationFrame(frame);
    }
  };
  cv.addEventListener('click', stop);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') stop(); });
  addEventListener('resize', () => { if (cv.classList.contains('on')) size(); });
  // Konami code
  const KON = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kp = 0;
  addEventListener('keydown', (e) => { kp = e.key === KON[kp] ? kp + 1 : (e.key === KON[0] ? 1 : 0); if (kp === KON.length) { kp = 0; fx.matrix(); } });

  /* ---------- hero name reacts to the cursor ---------- */
  const nm = $('.hero .name');
  if (nm && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const txt = nm.textContent; nm.textContent = '';
    const ls = [...txt].map((ch) => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); nm.appendChild(s); return { el: s, y: 0, r: 0, ty: 0, tr: 0 }; });
    let run2 = false;
    const loop = () => {
      let moving = false;
      ls.forEach((l) => {
        l.y += (l.ty - l.y) * 0.14; l.r += (l.tr - l.r) * 0.14;
        if (Math.abs(l.ty - l.y) > 0.05 || Math.abs(l.tr - l.r) > 0.02) moving = true;
        l.el.style.transform = `translate3d(0,${l.y.toFixed(2)}px,0) rotate(${l.r.toFixed(2)}deg)`;
      });
      if (moving) requestAnimationFrame(loop); else run2 = false;
    };
    const kick = () => { if (!run2) { run2 = true; requestAnimationFrame(loop); } };
    $('.hero').addEventListener('pointermove', (e) => {
      ls.forEach((l) => {
        const r = l.el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const k = Math.max(0, 1 - Math.hypot(dx, dy) / 380);
        l.ty = -k * 22; l.tr = (dx / 380) * -5 * k;
      });
      kick();
    });
    $('.hero').addEventListener('pointerleave', () => { ls.forEach((l) => { l.ty = 0; l.tr = 0; }); kick(); });
  }

  /* ---------- hero name on touch screens: idle wave, letters jump when tapped ---------- */
  if (nm && !reduce && !matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const txt2 = nm.textContent; nm.textContent = '';
    nm.classList.add('touch');
    [...txt2].forEach((ch, k) => {
      const sp = document.createElement('span');
      sp.textContent = ch; sp.setAttribute('aria-hidden', 'true'); sp.style.setProperty('--k', k);
      sp.addEventListener('pointerdown', () => {
        sp.animate([{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-34px) rotate(-7deg)' }, { transform: 'translateY(0) rotate(0deg)' }], { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      });
      nm.appendChild(sp);
    });
  }

  /* ---------- terminal ---------- */
  const out = $('#term-out'), form = $('#term-form'), input = $('#term-input');
  const history = []; let hi = 0;
  const line = (html, cls = 'ok') => {
    const d = document.createElement('div');
    d.className = 'ln ' + cls; d.innerHTML = html; out.appendChild(d);
    out.scrollTop = out.scrollHeight; return d;
  };
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const COMMANDS = {
    help: () => [
      'Commands:',
      '  <span class="hl">whoami</span>          who am I',
      '  <span class="hl">ls hosts</span>        what runs in the lab',
      '  <span class="hl">cat &lt;host&gt;</span>     details, e.g. cat dc01',
      '  <span class="hl">certs</span>           my exam path',
      '  <span class="hl">skills</span>          what I use',
      '  <span class="hl">contact</span>         how to reach me',
      '  <span class="hl">sudo hire clyde</span> try it',
      '  <span class="hl">clear</span>'
    ],
    whoami: () => [
      'Clyde Caiga, 19, Barcelona.',
      'IT support engineer (Intune, Autopilot, Entra ID, Azure).',
      'Five years volunteer sysadmin, now Team Lead of IT, for a church network.',
      'Building a homelab to learn the attack, the detection and the fix.',
      '<span class="dim">Goal: SOC analyst, then red team.</span>'
    ],
    certs: () => [
      'Path, in order. <span class="hl">None passed yet.</span>',
      '  <span class="g">next</span>  SC-900  Security fundamentals',
      '  <span class="dim">then</span>  AZ-900  Azure fundamentals',
      '  <span class="dim">then</span>  SC-300  Identity administrator',
      '  <span class="dim">then</span>  AZ-104  Azure administrator',
      '  <span class="dim">then</span>  MD-102  Endpoint administrator',
      '  <span class="dim">then</span>  SC-200  Security operations analyst'
    ],
    skills: () => [
      '<span class="hl">work</span>  Intune, Autopilot, Entra ID, Azure, Jira, ISL Online',
      '<span class="hl">lab</span>   pfSense, Proxmox, Active Directory, Tailscale, Linux, Kali',
      '<span class="hl">code</span>  Python, PowerShell, Flutter, Git'
    ],
    contact: () => [
      'email     <a href="#" data-mail="Hello Clyde">Send me an email</a>',
      'github    <a href="https://github.com/ClydeWasEjected">ClydeWasEjected</a>',
      'linkedin  <a href="https://www.linkedin.com/in/clydejcaiga">clydejcaiga</a>'
    ],
    ls: (a) => a[0] === 'hosts'
      ? ['pfsense   dc01   win11-01   proxmox-a8   proxmox-lab   automation', '<span class="dim">try: cat dc01</span>']
      : ['hosts  <span class="dim">(try: ls hosts)</span>'],
    cat: (a) => {
      const k = ALIAS[(a[0] || '').toLowerCase()];
      if (!k) return [a[0] ? `cat: ${esc(a[0])}: no such host` : 'usage: cat &lt;host&gt;'];
      return [`<span class="hl">${HOSTS[k][0]}</span>`, HOSTS[k][1]];
    },
    sudo: (a) => {
      if (a.join(' ') === 'hire clyde') {
        setTimeout(() => { location.href = mailto('Let\'s hire you'); }, 900);
        return ['<span class="g">[sudo] permission granted.</span>', 'Opening your mail client…'];
      }
      return ['sudo: nice try. Only <span class="hl">sudo hire clyde</span> is allowed here.'];
    },
    clear: () => { out.innerHTML = ''; return []; }
  };

  /* ---------- v2: more commands ---------- */
  const FLAG = 'clyde-has-access', FLAG_B64 = 'Y2x5ZGUtaGFzLWFjY2Vzcw==';
  let solved = false;
  COMMANDS.help = () => [
    'Commands:',
    '  <span class="hl">whoami</span>  <span class="hl">neofetch</span>  <span class="hl">skills</span>  <span class="hl">certs</span>  <span class="hl">contact</span>',
    '  <span class="hl">ls hosts</span>  <span class="hl">cat &lt;host&gt;</span>  <span class="hl">nmap jnclydehl.local</span>',
    '  <span class="hl">theme red|green|blue|amber</span>  <span class="hl">matrix</span>  <span class="hl">history</span>  <span class="hl">clear</span>',
    '  <span class="hl">sudo hire clyde</span>',
    '<span class="dim">Tab completes. Somewhere in here is a hidden flag. Try ls -a.</span>'
  ];
  COMMANDS.certs = () => [
    '<span class="hl">Earned</span>',
    '  Hack The Box   Junior Penetration Tester course',
    '  Alison         Vulnerability Assessment and Pentesting   Nov 2025',
    '  Cisco          Networking Devices and Initial Config      Jul 2024',
    '  Cisco          Networking Basics                          Dec 2023',
    '  freeCodeCamp   JavaScript Algorithms and Data Structures  Dec 2023',
    '  Cisco          Introduction to Cybersecurity              Jul 2023',
    '<span class="hl">Exam path, in order. None passed yet.</span>',
    '  <span class="g">next</span>  SC-900  <span class="dim">then</span> AZ-900, SC-300, AZ-104, MD-102, SC-200'
  ];
  COMMANDS.neofetch = () => [
    '<span class="hl">clyde</span>@<span class="hl">jnclydehl</span>',
    '-----------------',
    '<span class="hl">Role</span>      IT support engineer, Barcelona',
    '<span class="hl">Uptime</span>    19 years, Linux since 15',
    '<span class="hl">Hosts</span>     pfSense, DC01, WIN11-01, 2x Proxmox, automation host',
    '<span class="hl">Shell</span>     bash, PowerShell',
    '<span class="hl">Langs</span>     es, en, ca, tl, fr',
    '<span class="hl">Coding</span>    Python, PowerShell, Flutter, JavaScript',
    '<span class="hl">Goal</span>      SOC analyst, then red team',
    '<span class="hl">Packages</span>  a lot of them, mostly installed in the lab'
  ];
  COMMANDS.nmap = (a) => {
    if (!(a.join(' ') || '').includes('jnclydehl')) return ['usage: nmap jnclydehl.local'];
    return [
      '<span class="dim">Demo output. Nothing is being scanned, this is a drawing of my lab.</span>',
      'Nmap scan report for jnclydehl.local',
      'pfsense       <span class="g">443/tcp  open</span>  https (GUI, LAN only)',
      'dc01          <span class="g">53/tcp   open</span>  dns',
      '                     <span class="g">88/tcp   open</span>  kerberos',
      '                     <span class="g">389/tcp  open</span>  ldap',
      'win11-01       <span class="g">445/tcp  open</span>  smb',
      'Done: 3 hosts up. <span class="hl">Now the interesting part is detecting this scan.</span>'
    ];
  };
  COMMANDS.history = () => history.length ? history.map((h, i) => `  ${i + 1}  ${esc(h)}`) : ['(empty)'];
  const _ls = COMMANDS.ls;
  COMMANDS.ls = (a) => a[0] === '-a' ? ['.  ..  hosts  <span class="hl">.secret</span>  <span class="dim">(try cat .secret)</span>'] : _ls(a);
  const _cat = COMMANDS.cat;
  COMMANDS.cat = (a) => a[0] === '.secret'
    ? [`<span class="g">${FLAG_B64}</span>`, '<span class="dim">That is not plain text. Try: base64 -d &lt;string&gt;</span>']
    : _cat(a);
  COMMANDS.base64 = (a) => {
    if (a[0] !== '-d' || !a[1]) return ['usage: base64 -d &lt;string&gt;'];
    try { return [`<span class="g">${esc(atob(a[1]))}</span>`, '<span class="dim">Looks like a password. Try: submit &lt;it&gt;</span>']; }
    catch { return ['base64: invalid input']; }
  };
  COMMANDS.submit = (a) => {
    if ((a[0] || '') !== FLAG) return ['<span class="hl">Wrong flag.</span> Keep looking.'];
    if (!solved) { solved = true; fx.confetti(); }
    return ['<span class="g">Flag accepted. You found it.</span>', 'Now write to me: <a href="#" data-mail="I found the flag">Send an email</a>'];
  };
  COMMANDS.matrix = () => { fx.matrix(); return ['Wake up, Neo… <span class="dim">(Esc or click to leave)</span>']; };
  COMMANDS.theme = (a) => {
    const m = { red: '#ff4b2b', green: '#7ddc5b', blue: '#4da3ff', amber: '#ffc233' };
    if (!m[a[0]]) return ['usage: theme red|green|blue|amber'];
    setAccent(m[a[0]]); return [`accent set to ${a[0]}`];
  };
  COMMANDS.whoami = () => [
    'Clyde Caiga, 19, Barcelona.',
    'IT support (Intune, Entra ID, Azure), five years volunteer sysadmin for a church network.',
    'Founder of StudentBoard. Homelab: Proxmox, pfSense, Active Directory.',
    '<span class="dim">Goal: SOC analyst, then red team.</span>'
  ];

  /* tab completion */
  const NAMES = Object.keys(COMMANDS).concat(['nmap jnclydehl.local', 'ls hosts', 'ls -a', 'sudo hire clyde', 'base64 -d']);
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const v = input.value;
    const parts = v.split(/\s+/);
    if (parts[0] === 'cat' && parts.length === 2) {
      const hit = Object.keys(ALIAS).concat(['.secret']).find((k) => k.startsWith(parts[1]));
      if (hit) input.value = 'cat ' + hit;
    } else {
      const hit = NAMES.find((n) => n.startsWith(v) && n !== v);
      if (hit) input.value = hit;
    }
  });

  /* ---------- proof of work: tabs and live demos ---------- */
  const tabs = $$('.tabs [role=tab]');
  const selectTab = (t, focus) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      const p = document.getElementById(x.getAttribute('aria-controls')); p.hidden = !on;
      if (on) { $$('[data-card]', p).forEach((c) => c.classList.add('in')); x.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
    });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  $$('.tp .card').forEach((c) => c.classList.add('in'));

  // GPO scope demo
  const GPO = {
    ops: [
      ['Default Domain Policy', 'applies · domain root', 1],
      ['GPO-Workstation-Baseline', 'applies · inherited from Departments', 1],
      ['GPO-Local-Admins', 'applies · inherited from Departments', 1],
      ['GPO-Security-PSLogging', 'not applied · wrong OU', 0],
      ['Script block logging (4104)', 'off · registry key absent', 0]
    ],
    sec: [
      ['Default Domain Policy', 'applies · domain root', 1],
      ['GPO-Workstation-Baseline', 'applies · inherited from Departments', 1],
      ['GPO-Local-Admins', 'applies · inherited from Departments', 1],
      ['GPO-Security-PSLogging', 'applies · linked to Security/Computers', 1],
      ['Script block logging (4104)', 'on · events captured', 1]
    ]
  };
  const gOut = $('#gpo-out');
  const showOU = (k) => {
    $$('[data-ou]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ou === k)));
    gOut.innerHTML = '';
    GPO[k].forEach(([n, st, on], i) => {
      const li = document.createElement('li'); li.className = on ? 'on' : 'off'; li.style.animationDelay = i * 40 + 'ms';
      li.innerHTML = `<span>${n}</span><em>${st}</em>`; gOut.appendChild(li);
    });
  };
  $$('[data-ou]').forEach((b) => b.addEventListener('click', () => showOU(b.dataset.ou)));
  showOU('ops');

  // SSO round trip demo
  const FLOW = {
    saml: [
      'You open the app (the service provider). It has no session for you.',
      'It redirects you to Entra ID (the identity provider) with a SAML request.',
      'You sign in at Entra. Conditional Access and MFA run here.',
      'Entra posts a signed assertion to the app\'s reply URL.',
      'The app checks the signature and the entity ID, then lets you in.'
    ],
    oidc: [
      'The app sends you to the authorize endpoint asking for openid, profile and email.',
      'You sign in and consent. Entra checks the redirect URI against the app registration.',
      'Entra redirects back to the redirect URI with an ID token.',
      'I paste the token into jwt.ms and read the claims: issuer, audience, expiry.',
      'A real app validates the signature with the published keys before trusting it.'
    ]
  };
  const flow = $('#flow');
  const showProto = (k) => {
    $$('[data-proto]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.proto === k)));
    flow.innerHTML = '';
    FLOW[k].forEach((t, i) => { const li = document.createElement('li'); li.textContent = t; li.style.animationDelay = i * 50 + 'ms'; flow.appendChild(li); });
  };
  $$('[data-proto]').forEach((b) => b.addEventListener('click', () => showProto(b.dataset.proto)));
  showProto('saml');

  /* ---------- more terminal commands for the showcase ---------- */
  COMMANDS.gpo = () => [
    '<span class="hl">Default Domain Policy</span>        domain root: 14 chars, lockout 5 tries',
    '<span class="hl">GPO-Workstation-Baseline</span>     Departments: firewall, screen lock, SMBv1 off',
    '<span class="hl">GPO-Local-Admins</span>             Departments: SG_IT_Admins as local admins',
    '<span class="hl">GPO-Operations-Restrictions</span>  Operations/Users: Settings blocked',
    '<span class="hl">GPO-Security-PSLogging</span>       Security/Computers: script block logging',
    '<span class="dim">Each one tested where it applies and where it must not.</span>'
  ];
  COMMANDS.incidents = () => [
    '<span class="g">Sep 27</span>  report and its alert lost to one DNS blip   <span class="dim">fix: SMTP retries + local log</span>',
    '<span class="g">Sep 24</span>  wrong VM renamed                           <span class="dim">fix: snapshot, rename back, clean DNS</span>',
    '<span class="g">Sep 16</span>  WAN routing broke on reboot               <span class="dim">fix: pin the default gateway</span>'
  ];
  COMMANDS.hermes = () => [
    'Hermes: my dashboard, reports and playbook academy.',
    '  build.py every 5 min on the automation host, page served from a second container, Tailscale only',
    '  reports at 08:00 and 22:00, systemd timers with retries',
    '  playbooks: step by step, evidence attached, docs drafted from it',
    '<span class="dim">Details in the Proof of work section.</span>'
  ];
  COMMANDS.pentest = () => [
    'Order: <span class="hl">understand, attack, detect, fix</span>',
    '  <span class="g">now</span>   base: methodology, web, Linux',
    '  next  boxes and written reports, then an AD attack chain in my lab',
    '  rules: notes for everything, one hour before a hint',
    '<span class="dim">Tools next: BloodHound, Impacket, NetExec.</span>'
  ];
  COMMANDS.proof = () => ['Scroll to <a href="#proof">Proof of work</a>, or try: gpo, incidents, hermes, pentest.'];
  const _help = COMMANDS.help;
  COMMANDS.help = () => _help().slice(0, -1).concat([
    '  <span class="hl">stack</span>  <span class="hl">gpo</span>  <span class="hl">incidents</span>  <span class="hl">hermes</span>  <span class="hl">pentest</span>  <span class="hl">proof</span>',
    '<span class="dim">Tab completes. Somewhere in here is a hidden flag. Try ls -a.</span>'
  ]);

  /* ---------- stack filter ---------- */
  const fbtns = $$('[data-f]');
  fbtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.f;
    fbtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $$('.chips2 li').forEach((li) => li.classList.toggle('dim', f !== 'all' && li.dataset.lv !== f));
  }));
  COMMANDS.stack = () => [
    '<span class="hl">infra</span>     Proxmox, pfSense, Linux, LXC, Docker, nginx, systemd, Tailscale, Syncthing',
    '<span class="hl">microsoft</span> Active Directory, GPO, Entra ID, Intune, Autopilot, Azure, Okta, SAML/OIDC',
    '<span class="hl">security</span>  Kali, Nmap, Wireshark, SIEM, Hack The Box, SOC simulator',
    '<span class="hl">code</span>      Python, PowerShell, Bash, Git, GitHub Actions, Flutter, Supabase',
    '<span class="dim">Full list with levels in the Stack section.</span>'
  ];

  const run = (raw) => {
    const text = raw.trim();
    if (!text) return;
    history.push(text); hi = history.length;
    line(esc(text), 'cmd');
    const [c, ...args] = text.split(/\s+/);
    const fn = COMMANDS[c.toLowerCase()];
    const res = fn ? fn(args) : [`${esc(c)}: command not found. Try <span class="hl">help</span>.`];
    res.forEach((l) => line(l));
  };
  out.addEventListener('click', (e) => { const m = e.target.closest('[data-mail]'); if (m) { e.preventDefault(); location.href = mailto(m.dataset.mail); } });
  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi]; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; }
  });
  $$('#chips button').forEach((b) => b.addEventListener('click', () => run(b.dataset.cmd)));
  // boot sequence, typed one line at a time
  const boot = ['<span class="dim">connecting to jnclydehl.local …</span>', '<span class="g">ok.</span> Welcome. Type <span class="hl">help</span>, or tap a command below.'];
  boot.forEach((l, i) => reduce ? line(l) : setTimeout(() => line(l), 500 + i * 450));

  /* ---------- command menu (Cmd/Ctrl+K) ---------- */
  const dlg = $('#palette'), pin = $('#pal-in'), plist = $('#pal-list');
  const ITEMS = [
    ['Home', '#top'], ['The lab', '#lab'], ['Exam path', '#path'], ['Proof of work', '#proof'], ['The stack', '#stack'], ['Active Directory', 'tab:t-ad'], ['Identity and IAM', 'tab:t-iam'], ['Security ops', 'tab:t-sec'], ['Pentesting', 'tab:t-pen'], ['Automation', 'tab:t-aut'], ['Hermes and playbooks', 'tab:t-her'], ['Things I built', '#work'], ['Contact', '#contact'],
    ['Send an email', 'mail'], ['GitHub', 'https://github.com/ClydeWasEjected'], ['LinkedIn', 'https://www.linkedin.com/in/clydejcaiga']
  ];
  let sel = 0, shown = ITEMS;
  const draw = () => {
    plist.innerHTML = '';
    shown.forEach(([t, h], i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
      li.innerHTML = `<span>${t}</span><small>${h.startsWith('http') ? '↗' : h === 'mail' ? 'email' : h.startsWith('tab:') ? 'proof' : h}</small>`;
      li.addEventListener('click', () => go(i));
      plist.appendChild(li);
    });
  };
  const go = (i) => {
    const it = shown[i]; if (!it) return; dlg.close();
    if (it[1].startsWith('tab:')) { selectTab(document.getElementById(it[1].slice(4))); location.hash = '#proof'; }
    else if (it[1] === 'mail') location.href = mailto('Hello Clyde');
    else if (it[1].startsWith('http')) window.open(it[1], '_blank', 'noopener');
    else location.hash = it[1];
  };
  const openPal = () => { pin.value = ''; shown = ITEMS; sel = 0; draw(); dlg.showModal(); pin.focus(); };
  $('#open-palette').addEventListener('click', openPal);
  addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPal(); } });
  pin.addEventListener('input', () => { const q = pin.value.toLowerCase(); shown = ITEMS.filter(([t]) => t.toLowerCase().includes(q)); sel = 0; draw(); });
  pin.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); draw(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
    if (e.key === 'Enter') { e.preventDefault(); go(sel); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
