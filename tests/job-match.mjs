/* job-match.mjs — client-side CV → job matching for /jobs/match/ (no AI, no upload). */

export const jobMatchCss = () => `
.jmatch{margin:20px 0 32px;max-width:760px}
.jmpanel{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:22px 22px 20px}
.jmprivacy{display:flex;gap:12px;align-items:flex-start;background:rgba(186,242,74,.07);border:1px solid color-mix(in srgb,#BAF24A 32%,transparent);border-radius:10px;padding:12px 14px;margin:0 0 20px;font-size:12.5px;line-height:1.5;color:var(--muted)}
.jmprivacy b{color:var(--text);font-weight:600}
.jmprivacy .k{flex:0 0 auto;font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#BAF24A;background:rgba(186,242,74,.12);border-radius:99px;padding:4px 9px;margin-top:1px}
.jmupload{display:block;width:100%;box-sizing:border-box;min-height:128px;border:1.5px dashed color-mix(in srgb,var(--acc) 50%,var(--line));border-radius:12px;padding:24px 20px;text-align:center;background:rgba(255,92,22,.03);cursor:pointer;transition:border-color .15s,background .15s,transform .12s}
.jmupload:hover{border-color:var(--acc);background:rgba(255,92,22,.07)}
.jmupload.drag{border-color:var(--acc);background:rgba(255,92,22,.1);transform:scale(1.005)}
.jmupload.hasfile{border-style:solid;border-color:color-mix(in srgb,#BAF24A 45%,var(--line));background:rgba(186,242,74,.06)}
.jmupload input[type=file]{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.jmbrowse{margin-top:14px;font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--text);background:rgba(255,92,22,.14);border:1px solid color-mix(in srgb,var(--acc) 45%,transparent);border-radius:99px;padding:8px 18px;cursor:pointer}
.jmbrowse:hover{background:rgba(255,92,22,.22);border-color:var(--acc)}
.jmupload .ico{font-size:26px;line-height:1;margin-bottom:10px;opacity:.9}
.jmupload .t{font-weight:600;font-size:15px;color:var(--text)}
.jmupload .sub{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);margin-top:8px;line-height:1.45}
.jmformats{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);margin:10px 0 0;line-height:1.5;text-align:center}
.jmformats b{color:var(--muted);font-weight:600}
.jmupload .fname{font-family:'Noto Sans Mono',monospace;font-size:12px;color:#BAF24A;margin-top:10px;word-break:break-all}
.jmdiv{display:flex;align-items:center;gap:12px;margin:16px 0;font-family:'Noto Sans Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.jmdiv::before,.jmdiv::after{content:'';flex:1;height:1px;background:var(--line)}
.jmpaste label{display:block;font-family:'Noto Sans Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:0 0 8px}
.jmpaste textarea{display:block;width:100%;box-sizing:border-box;min-height:140px;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:12.5px;line-height:1.55;padding:12px 14px;resize:vertical}
.jmpaste textarea:focus{outline:none;border-color:var(--acc)}
.jmactions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:18px}
.jmrun{background:var(--acc);color:#0A0A10;font-weight:700;font-family:'Noto Sans Mono',monospace;font-size:13.5px;border:0;border-radius:10px;padding:12px 22px;cursor:pointer;flex:1 1 auto;min-width:180px}
.jmrun:disabled{opacity:.55;cursor:wait}
.jmclear{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--muted);background:none;border:1px solid var(--line);border-radius:10px;padding:11px 16px;cursor:pointer}
.jmclear:hover{color:var(--text);border-color:var(--dim)}
.jmstatus{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--dim);margin:14px 0 0;min-height:18px;line-height:1.45}
.jmerr{color:#ff8f5c}
.jmprog{margin:16px 0 0}
.jmprogmeta{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:8px}
.jmprogmeta b{color:var(--text);font-weight:600;flex:1}
.jmprogpct{color:var(--acc);font-weight:700;font-size:13px;white-space:nowrap}
.jmprogtrack{height:9px;background:var(--line);border-radius:99px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
.jmprogtrack i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--acc),#ff8f5c 55%,#BAF24A);border-radius:99px;transition:width .22s ease}
.jmprog.done .jmprogtrack i{background:#BAF24A}
.jmprog.done .jmprogpct{color:#BAF24A}
.jmres{margin-top:26px;padding-top:22px;border-top:1px solid var(--line)}
.jmresh{font-family:'Noto Sans Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:0 0 12px}
.jmcard{display:block;background:var(--bg);border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin:0 0 8px;text-decoration:none;transition:border-color .12s,transform .1s}
.jmcard:hover{border-color:var(--acc);transform:translateY(-1px)}
.jmcard .row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.jmcard .t{font-weight:700;font-size:14.5px;color:var(--text);line-height:1.35}
.jmcard .co{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--acc);margin-top:4px}
.jmcard .meta{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);margin-top:6px}
.jmcard .why{ font-size:12px;color:var(--muted);margin-top:10px;line-height:1.55}
.jmcard .why .wl{display:block;margin-top:4px}
.jmcard .why .wl b{color:var(--text);font-weight:600;font-family:'Noto Sans Mono',monospace;font-size:11px}
.jmcard .pct{font-family:'Noto Sans Mono',monospace;font-size:11px;color:#BAF24A;white-space:nowrap;flex-shrink:0}
.jmempty{font-size:13.5px;color:var(--muted);line-height:1.6}
.jmhow{margin-top:32px;max-width:760px}
.jmhow h2{font-size:17px;margin:0 0 10px}
.jmhow p{font-size:13.5px;color:var(--muted);line-height:1.6;margin:0 0 10px}
@media(max-width:640px){.jmactions{flex-direction:column;align-items:stretch}.jmrun{width:100%}}
`;

export const jobMatchHtml = (jobCount, nCompanies) => `
  <div class="jmatch" id="jmatch">
    <div class="jmpanel">
      <div class="jmprivacy"><span class="k">private</span><span><b>Nothing leaves your browser.</b> No upload, no storage, no cookies — matching runs locally. Close the tab and your CV is gone.</span></div>

      <div class="jmupload" id="jmdrop" tabindex="0" role="group" aria-label="Upload CV file">
        <input type="file" id="jmfile" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt">
        <div class="ico" id="jmico">↑</div>
        <div class="t" id="jmuptitle">Drop your CV here</div>
        <div class="sub" id="jmupsub">PDF or Word (.docx) with selectable text</div>
        <button type="button" class="jmbrowse" id="jmbrowse">choose PDF or Word</button>
        <p class="jmformats"><b>PNG, JPG &amp; screenshots are not supported</b> — we need real text, not a photo. Save/export as PDF, or paste the CV below.</p>
        <div class="fname" id="jmfname" hidden></div>
      </div>

      <div class="jmdiv">or paste</div>

      <div class="jmpaste">
        <label for="jmtext">CV text</label>
        <textarea id="jmtext" placeholder="Paste your CV text here — works great if you only have a screenshot: retype or copy from the image…"></textarea>
      </div>

      <div class="jmactions">
        <button type="button" class="jmrun" id="jmrun">find matching roles →</button>
        <button type="button" class="jmclear" id="jmclear" hidden>clear</button>
      </div>
      <p class="jmstatus" id="jmstatus" aria-live="polite"></p>
      <div class="jmprog" id="jmprog" hidden>
        <div class="jmprogmeta"><b id="jmproglabel">Starting…</b><span class="jmprogpct" id="jmprogpct">0%</span></div>
        <div class="jmprogtrack"><i id="jmprogb"></i></div>
      </div>

      <div class="jmres" id="jmres" hidden>
        <p class="jmresh" id="jmresh"></p>
        <div id="jmlist"></div>
      </div>
    </div>
  </div>

  <article class="jmhow">
  <h2>how matching works</h2>
  <p>Keyword overlap + TF‑IDF against ${jobCount.toLocaleString('en-US')} live roles — title matches weighted higher. No AI, no accounts. A starting point, not career advice.</p>
  <p style="font-size:12.5px;color:var(--dim)"><a href="/jobs/">Browse all roles</a> · ${nCompanies} companies · <a href="/jobs/data.json">jobs/data.json</a></p>
  </article>`;

export const jobMatchScript = (deptLabels) => `<script>
(function(){
var STOP=new Set('a an the and or but in on at to for of is are was be been being have has had do does did will would could should may might must can with from as by about into through during before after above below between under over out up down not no nor so if then than too very just also only same other more most such each per via you your our their this that these those were being been being role team work job jobs est progama cadastro'.split(' '));
var SHORT_OK=new Set('aml kyc kyb pci sre ios api sql aws gcp php ux hr fp a b c r d'.split(' '));
var ACRONYM={aml:'AML (anti-money laundering)',kyc:'KYC (Know Your Customer)',kyb:'KYB (Know Your Business)',pci:'PCI',sre:'SRE',api:'API',sql:'SQL',aws:'AWS',gcp:'GCP',ios:'iOS',pos:'POS'};
var DEPT=${JSON.stringify(deptLabels)};
var PDF_JS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
var PDF_WK='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
var MAMMOTH_JS='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

function loadScript(url){
  return new Promise(function(resolve,reject){
    var existing=document.querySelector('script[data-jm="'+url+'"]');
    if(existing){
      if(existing.dataset.loaded==='1'){resolve();return}
      existing.addEventListener('load',function(){resolve()});
      existing.addEventListener('error',function(){reject(new Error('Could not load helper script'))});
      return;
    }
    var s=document.createElement('script');s.src=url;s.dataset.jm=url;
    s.onload=function(){s.dataset.loaded='1';resolve()};
    s.onerror=function(){reject(new Error('Could not load helper script'))};
    document.head.appendChild(s);
  });
}
var pdfReady=loadScript(PDF_JS).then(function(){
  if(!window.pdfjsLib)throw new Error('PDF reader failed to load');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDF_WK;
  return window.pdfjsLib;
});
var mammothReady=loadScript(MAMMOTH_JS);

function tok(s){return String(s||'').toLowerCase().replace(/[^a-z0-9+#./-]/g,' ').split(/\\s+/).filter(function(w){
  if(!w||STOP.has(w))return false;
  if(SHORT_OK.has(w))return true;
  return w.length>=4&&w.length<40&&/[aeiouy]/i.test(w);
})}
function uniq(a){var o={},r=[];a.forEach(function(x){if(!o[x]){o[x]=1;r.push(x)}});return r}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function isReadableCv(text){
  var t=String(text||'');
  if(t.length<120)return false;
  var letters=(t.match(/[a-zA-Z]/g)||[]).length;
  if(letters/t.length<0.55)return false;
  var words=t.match(/[a-zA-Z]{4,}/g)||[];
  if(words.length<12)return false;
  if(/[\x00-\x08\x0E-\x1F]/.test(t))return false;
  if((t.match(/[\uFFFD]/g)||[]).length>2)return false;
  return true;
}

function labelTok(t){return ACRONYM[t]||t.replace(/\\b\\w/g,function(c){return c.toUpperCase()})}

function explain(job,titleHits,bodyHits){
  var lines=[];
  if(titleHits.length)lines.push('<span class="wl"><b>Role:</b> your CV overlaps with '+esc(titleHits.slice(0,4).map(labelTok).join(', '))+' in this job title</span>');
  if(bodyHits.length)lines.push('<span class="wl"><b>Experience:</b> shared terms include '+esc(bodyHits.slice(0,5).map(labelTok).join(', '))+'</span>');
  var dept=DEPT[job.dept]||'';
  if(dept&&bodyHits.length>=2)lines.push('<span class="wl"><b>Track:</b> fits the '+esc(dept)+' bucket on our board</span>');
  return lines.length?lines.join(''):'<span class="wl">Some keyword overlap with this posting — read the full role to confirm</span>';
}

function loadJobs(){return fetch('/jobs/data.json').then(function(r){if(!r.ok)throw new Error('fetch');return r.json()}).then(function(d){return d.jobs||[]})}

function extractPdf(file,onProg){
  return pdfReady.then(function(pdfjs){
    return file.arrayBuffer().then(function(buf){
      onProg(15,'Opening PDF…');
      return pdfjs.getDocument({data:buf}).promise.then(function(pdf){
        var pages=[],i=1,n=pdf.numPages||1;
        function next(){
          if(i>n){
            onProg(52,'Text extracted from PDF');
            return pages.join('\\n\\n');
          }
          onProg(15+Math.round((i/n)*36),'Reading page '+i+' of '+n+'…');
          return pdf.getPage(i++).then(function(page){
            return page.getTextContent().then(function(c){
              pages.push(c.items.map(function(it){return it.str}).join(' '));
              return next();
            });
          });
        }
        return next();
      });
    });
  });
}

function extractDocx(file,onProg){
  onProg(18,'Opening Word file…');
  return mammothReady.then(function(){
    if(!window.mammoth)throw new Error('Word reader failed to load');
    return file.arrayBuffer().then(function(buf){
      return mammoth.extractRawText({arrayBuffer:buf}).then(function(r){
        onProg(50,'Text extracted from Word');
        return r.value||'';
      });
    });
  });
}

function readFile(file,onProg){
  return Promise.resolve().then(function(){
    var n=(file.name||'').toLowerCase(),type=file.type||'';
    onProg(8,'Loading '+file.name+'…');
    if(/^image\\//.test(type)||/\\.(png|jpe?g|gif|webp|bmp|heic|svg)$/i.test(n))
      throw new Error('PNG/JPG screenshots cannot be read — export a PDF, open the .docx, or paste the text below.');
    if(n.endsWith('.txt')||type==='text/plain')return file.text().then(function(t){onProg(45,'Text loaded');return t});
    if(n.endsWith('.pdf')||type==='application/pdf')return extractPdf(file,onProg);
    if(n.endsWith('.docx')||type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return extractDocx(file,onProg);
    throw new Error('Use PDF, DOCX, or TXT — or paste your CV text below.');
  });
}

function score(cvText,jobs,onProg){
  onProg(78,'Scoring against '+jobs.length.toLocaleString()+' roles…');
  var cvTok=tok(cvText),cvSet=uniq(cvTok),cvF={};
  cvTok.forEach(function(t){cvF[t]=(cvF[t]||0)+1});
  if(cvSet.length<8)return [];
  var df={},N=jobs.length;
  jobs.forEach(function(j){uniq(tok(j.title+' '+(j.description||'').slice(0,5000))).forEach(function(t){df[t]=(df[t]||0)+1})});
  var max=0,out=jobs.map(function(j){
    var titleTok=tok(j.title),bodyTok=tok((j.description||'').slice(0,5000));
    var allTok=titleTok.concat(bodyTok),score=0,titleHits=[],bodyHits=[];
    cvSet.forEach(function(t){
      var inTitle=titleTok.indexOf(t)>=0,inBody=bodyTok.indexOf(t)>=0;
      if(!inTitle&&!inBody)return;
      var tf=allTok.filter(function(x){return x===t}).length;
      var idf=Math.log((N+1)/((df[t]||0)+1))+1;
      score+=(cvF[t]||1)*tf*idf*(inTitle?3:1);
      if(inTitle)titleHits.push(t);else bodyHits.push(t);
    });
    if(score>max)max=score;
    return {job:j,score:score,titleHits:titleHits,bodyHits:bodyHits};
  }).filter(function(x){return x.score>0}).sort(function(a,b){return b.score-a.score}).slice(0,20);
  out.forEach(function(x){x.pct=max?Math.round(x.score/max*100):0});
  onProg(92,'Ranking top matches…');
  return out;
}

function render(hits){
  var res=document.getElementById('jmres'),list=document.getElementById('jmlist'),head=document.getElementById('jmresh');
  if(!hits.length){
    res.hidden=false;head.textContent='no strong matches';
    list.innerHTML='<p class="jmempty">Add more skills, job titles, or tools (e.g. customer service, Python, payments). Or <a href="/jobs/">browse all roles</a>.</p>';
    res.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  res.hidden=false;
  head.textContent='top '+hits.length+' matches';
  list.innerHTML=hits.map(function(h){
    var j=h.job,dept=DEPT[j.dept]||'Other';
    return '<a class="jmcard" href="'+esc(j.path||('/jobs/j/'+j.id+'/'))+'">'+
      '<div class="row"><span class="t">'+esc(j.title)+'</span><span class="pct">'+h.pct+'% fit</span></div>'+
      '<div class="co">'+esc(j.company)+'</div>'+
      '<div class="meta">'+esc(j.location)+' · '+esc(dept)+(j.salary?' · '+esc(j.salary):'')+'</div>'+
      '<div class="why">'+explain(j,h.titleHits,h.bodyHits)+'</div></a>'}).join('');
  res.scrollIntoView({behavior:'smooth',block:'start'});
  try{nbevt('job_cv_match',{hits:hits.length,top:hits[0]&&hits[0].job.company})}catch(_){}
}

var cvText='',jobsCache=null,busy=false;
var statusEl=document.getElementById('jmstatus'),runBtn=document.getElementById('jmrun'),clearBtn=document.getElementById('jmclear');
var fileInput=document.getElementById('jmfile'),textEl=document.getElementById('jmtext'),dropEl=document.getElementById('jmdrop');
var fnameEl=document.getElementById('jmfname'),upTitle=document.getElementById('jmuptitle'),upSub=document.getElementById('jmupsub'),icoEl=document.getElementById('jmico');
var progEl=document.getElementById('jmprog'),progBar=document.getElementById('jmprogb'),progLabel=document.getElementById('jmproglabel'),progPct=document.getElementById('jmprogpct');

function setStatus(msg,err){statusEl.textContent=msg||'';statusEl.className='jmstatus'+(err?' jmerr':'')}
function setProg(pct,label,done){
  progEl.hidden=false;progEl.classList.toggle('done',!!done);
  progBar.style.width=Math.min(100,Math.max(0,pct))+'%';
  progPct.textContent=Math.round(pct)+'%';
  if(label)progLabel.textContent=label;
}
function hideProg(){progEl.hidden=true;progEl.classList.remove('done');progBar.style.width='0%';progPct.textContent='0%'}
function setBusy(on){busy=on;runBtn.disabled=on;clearBtn.disabled=on;dropEl.style.pointerEvents=on?'none':'auto'}
function hasInput(){return (textEl.value||'').trim().length>=120||cvText.length>=120}

function setFileUI(name){
  if(name){
    dropEl.classList.add('hasfile');fnameEl.hidden=false;fnameEl.textContent=name;
    upTitle.textContent='CV loaded';upSub.textContent='Drop another file to replace';icoEl.textContent='✓';
    clearBtn.hidden=false;
  }else{
    dropEl.classList.remove('hasfile');fnameEl.hidden=true;fnameEl.textContent='';
    upTitle.textContent='Drop your CV here';upSub.textContent='PDF or Word (.docx) with selectable text';icoEl.textContent='↑';
  }
}

function clearAll(){
  if(busy)return;
  cvText='';textEl.value='';fileInput.value='';setFileUI('');
  document.getElementById('jmres').hidden=true;setStatus('');hideProg();clearBtn.hidden=true;
}

function runMatch(fromFile){
  var text=(textEl.value||'').trim()||cvText;
  if(text.length<120){setStatus('Need a bit more text — upload a full CV or paste more detail.',true);textEl.focus();return Promise.resolve()}
  if(!isReadableCv(text)){
    var msg=fromFile?'This PDF has no selectable text (maybe a scan/photo export). Paste the CV text below instead.':'That does not look like readable CV text — use a PDF with real text or paste below.';
    setStatus(msg,true);hideProg();textEl.focus();return Promise.resolve();
  }
  setBusy(true);
  if(!fromFile){setProg(60,'Preparing match…');setStatus('')}
  var p=jobsCache?Promise.resolve(jobsCache):loadJobs().then(function(j){setProg(68,'Loaded job board…');jobsCache=j;return j});
  return p.then(function(jobs){
    var hits=score(text,jobs,setProg);
    setProg(100,hits.length?'Done — '+hits.length+' matches!':'Done — no strong matches',true);
    render(hits);
    setStatus(hits.length?'Matched against '+jobs.length.toLocaleString()+' roles — nothing left your browser.':'No strong matches — try pasting more skills and job titles.');
  }).catch(function(){
    setStatus('Could not load job data — check your connection and try again.',true);hideProg();
  }).finally(function(){setBusy(false)});
}

function handleFile(f){
  if(busy)return;
  setBusy(true);hideProg();document.getElementById('jmres').hidden=true;
  setStatus('');setProg(2,'Starting…');
  readFile(f,setProg).then(function(t){
    if(!t||!String(t).trim())throw new Error('This PDF appears empty — if it is a scan, paste the text below.');
    if(!isReadableCv(t))throw new Error('This PDF has no selectable text (maybe a scan/photo export). Paste the CV text below instead.');
    cvText=t;textEl.value=t.slice(0,12000)+(t.length>12000?'\\n…':'');
    setFileUI(f.name);setProg(58,'CV ready — matching…');
    return runMatch(true);
  }).catch(function(e){
    setStatus(e.message||'Could not read file',true);hideProg();setBusy(false);
  });
}

fileInput.addEventListener('change',function(){
  var f=fileInput.files&&fileInput.files[0];if(f)handleFile(f);
});

document.getElementById('jmbrowse').addEventListener('click',function(e){
  e.preventDefault();e.stopPropagation();if(!busy)fileInput.click();
});

dropEl.addEventListener('keydown',function(e){if(!busy&&(e.key==='Enter'||e.key===' ')){e.preventDefault();fileInput.click()}});

dropEl.addEventListener('dragenter',function(e){e.preventDefault();e.stopPropagation();if(!busy)dropEl.classList.add('drag')});
dropEl.addEventListener('dragover',function(e){e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='copy';if(!busy)dropEl.classList.add('drag')});
dropEl.addEventListener('dragleave',function(e){e.preventDefault();if(!dropEl.contains(e.relatedTarget))dropEl.classList.remove('drag')});
dropEl.addEventListener('drop',function(e){
  e.preventDefault();e.stopPropagation();dropEl.classList.remove('drag');
  var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f&&!busy)handleFile(f);
});

document.addEventListener('dragover',function(e){
  if(e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types,'Files')>=0)e.preventDefault();
});
document.addEventListener('drop',function(e){
  if(!dropEl.contains(e.target)&&e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types,'Files')>=0)e.preventDefault();
});

textEl.addEventListener('input',function(){if(!busy)clearBtn.hidden=!hasInput()&&!fnameEl.textContent});
runBtn.addEventListener('click',function(){if(!busy)runMatch(false)});
clearBtn.addEventListener('click',clearAll);
textEl.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&!busy){e.preventDefault();runMatch(false)}});

pdfReady.catch(function(){});
})();
</script>`;
