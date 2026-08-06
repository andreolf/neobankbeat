/* job-match.mjs — client-side CV → job matching for /jobs/match/ (no AI, no upload). */

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const jobMatchCss = () => `
.jmatch{margin:22px 0 28px;max-width:760px}
.jmprivacy{display:flex;gap:10px;align-items:flex-start;background:rgba(186,242,74,.08);border:1px solid color-mix(in srgb,#BAF24A 35%,transparent);border-radius:12px;padding:14px 16px;margin:0 0 20px;font-size:13px;line-height:1.55;color:var(--muted)}
.jmprivacy b{color:var(--text)}
.jmprivacy .k{font-family:'Noto Sans Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#BAF24A;white-space:nowrap;margin-top:2px}
.jmupload{border:1px dashed color-mix(in srgb,var(--acc) 45%,var(--line));border-radius:14px;padding:28px 20px;text-align:center;background:rgba(255,92,22,.04);cursor:pointer;transition:border-color .15s,background .15s}
.jmupload:hover,.jmupload.drag{border-color:var(--acc);background:rgba(255,92,22,.08)}
.jmupload input{position:absolute;opacity:0;width:0;height:0}
.jmupload .ico{font-size:28px;margin-bottom:8px;opacity:.85}
.jmupload .t{font-weight:600;font-size:15px;color:var(--text)}
.jmupload .sub{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--dim);margin-top:6px}
.jmpaste{margin-top:16px}
.jmpaste label{display:block;font-family:'Noto Sans Mono',monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:0 0 8px}
.jmpaste textarea{width:100%;box-sizing:border-box;min-height:120px;background:var(--bg);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:12.5px;line-height:1.55;padding:12px 14px;resize:vertical}
.jmpaste textarea:focus{outline:none;border-color:var(--acc)}
.jmrun{margin-top:16px;display:inline-block;background:var(--acc);color:#0A0A10;font-weight:700;font-family:'Noto Sans Mono',monospace;font-size:13.5px;border:0;border-radius:10px;padding:12px 22px;cursor:pointer}
.jmrun:disabled{opacity:.55;cursor:wait}
.jmstatus{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--dim);margin:12px 0 0;min-height:18px}
.jmerr{color:#ff8f5c}
.jmres{margin-top:28px}
.jmresh{font-family:'Noto Sans Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin:0 0 12px}
.jmcard{display:block;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin:0 0 8px;text-decoration:none;transition:border-color .12s}
.jmcard:hover{border-color:var(--acc)}
.jmcard .row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.jmcard .t{font-weight:700;font-size:14.5px;color:var(--text)}
.jmcard .co{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--acc)}
.jmcard .meta{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);margin-top:6px}
.jmcard .why{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5}
.jmcard .why b{color:var(--text);font-weight:600}
.jmcard .pct{font-family:'Noto Sans Mono',monospace;font-size:11px;color:#BAF24A;white-space:nowrap}
.jmempty{font-size:13.5px;color:var(--muted);line-height:1.6}
`;

export const jobMatchHtml = (jobCount, nCompanies) => `
  <div class="jmprivacy"><span class="k">private</span><span><b>Your CV never leaves this browser.</b> We do not upload, store, or log it — no server, no database, no cookies. Matching runs locally against <a href="/jobs/data.json">jobs/data.json</a>. Close the tab and it is gone.</span></div>

  <div class="jmatch" id="jmatch">
    <label class="jmupload" id="jmdrop">
      <input type="file" id="jmfile" accept=".pdf,.docx,.doc,.txt,text/plain,application/pdf">
      <div class="ico">↑</div>
      <div class="t">Drop your CV here</div>
      <div class="sub">PDF · Word (.docx) · plain text · or paste below</div>
    </label>

    <div class="jmpaste">
      <label for="jmpaste">Or paste CV text</label>
      <textarea id="jmpaste" placeholder="Paste your CV, LinkedIn export, or résumé text…"></textarea>
    </div>

    <button type="button" class="jmrun" id="jmrun">find matching roles →</button>
    <p class="jmstatus" id="jmstatus" aria-live="polite"></p>

    <div class="jmres" id="jmres" hidden>
      <p class="jmresh" id="jmresh"></p>
      <div id="jmlist"></div>
    </div>
  </div>

  <article style="max-width:760px;margin-top:28px">
  <h2>how matching works</h2>
  <p>No AI, no accounts. Your CV text is tokenised and scored against ${jobCount.toLocaleString('en-US')} live neobank roles using keyword overlap and TF‑IDF weighting — title matches count more than body text. It is a starting point, not career advice: always read the full posting and apply on the company's site.</p>
  <p style="font-size:12.5px;color:var(--dim)">Prefer browsing? <a href="/jobs/">See all roles</a> · ${nCompanies} companies hiring · refreshed daily from official career APIs.</p>
  </article>`;

export const jobMatchScript = (deptLabels) => `<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js" defer></script>
<script>
(function(){
var STOP=new Set('a an the and or but in on at to for of is are was be been being have has had do does did will would could should may might must can with from as by about into through during before after above below between under over out up down not no nor so if then than too very just also only same other more most such each per via'.split(' '));
var DEPT=${JSON.stringify(deptLabels)};

function tok(s){return String(s||'').toLowerCase().replace(/[^a-z0-9+#./-]/g,' ').split(/\\s+/).filter(function(w){return w.length>2&&w.length<40&&!STOP.has(w)})}
function uniq(a){var o={},r=[];a.forEach(function(x){if(!o[x]){o[x]=1;r.push(x)}});return r}

function loadJobs(){return fetch('/jobs/data.json').then(function(r){return r.json()}).then(function(d){return d.jobs||[]})}

function extractPdf(file){
  return file.arrayBuffer().then(function(buf){
    var pdfjs=window['pdfjsLib']||window.pdfjsLib;
    if(!pdfjs)throw new Error('PDF reader still loading — try again in a second');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return pdfjs.getDocument({data:buf}).promise.then(function(pdf){
      var pages=[],i=1;
      function next(){if(i>pdf.numPages)return pages.join('\\n\\n');return pdf.getPage(i++).then(function(page){
        return page.getTextContent().then(function(c){pages.push(c.items.map(function(it){return it.str}).join(' '));return next()})})}
      return next()})})}

function extractDocx(file){
  if(!window.mammoth)throw new Error('Word reader still loading — try again in a second');
  return file.arrayBuffer().then(function(buf){return mammoth.extractRawText({arrayBuffer:buf}).then(function(r){return r.value||''})})}

function readFile(file){
  var n=(file.name||'').toLowerCase();
  if(n.endsWith('.txt')||file.type==='text/plain')return file.text();
  if(n.endsWith('.pdf')||file.type==='application/pdf')return extractPdf(file);
  if(n.endsWith('.docx')||file.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return extractDocx(file);
  return file.text().catch(function(){throw new Error('Unsupported file — use PDF, DOCX, or TXT')})}

function score(cvText,jobs){
  var cvTok=tok(cvText),cvSet=uniq(cvTok),cvF={};
  cvTok.forEach(function(t){cvF[t]=(cvF[t]||0)+1});
  if(cvSet.length<8)return [];

  var df={},N=jobs.length;
  jobs.forEach(function(j){
    uniq(tok(j.title+' '+(j.description||'').slice(0,5000))).forEach(function(t){df[t]=(df[t]||0)+1});
  });

  var max=0,out=jobs.map(function(j){
    var titleTok=tok(j.title),bodyTok=tok((j.description||'').slice(0,5000));
    var allTok=titleTok.concat(bodyTok),score=0,matched=[];
    cvSet.forEach(function(t){
      var inTitle=titleTok.indexOf(t)>=0,inBody=bodyTok.indexOf(t)>=0;
      if(!inTitle&&!inBody)return;
      var tf=allTok.filter(function(x){return x===t}).length;
      var idf=Math.log((N+1)/((df[t]||0)+1))+1;
      var w=(cvF[t]||1)*tf*idf*(inTitle?3:1);
      score+=w;
      matched.push(t);
    });
    if(score>max)max=score;
    return {job:j,score:score,matched:uniq(matched).slice(0,10)};
  }).filter(function(x){return x.score>0}).sort(function(a,b){return b.score-a.score}).slice(0,20);

  out.forEach(function(x){x.pct=max?Math.round(x.score/max*100):0});
  return out;
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function render(hits){
  var res=document.getElementById('jmres'),list=document.getElementById('jmlist'),head=document.getElementById('jmresh');
  if(!hits.length){
    res.hidden=false;head.textContent='no strong matches';
    list.innerHTML='<p class="jmempty">Try pasting more detail — skills, job titles, tools, and domains (e.g. AML, Kotlin, payments). Or <a href="/jobs/">browse all roles</a>.</p>';
    return;
  }
  res.hidden=false;
  head.textContent='top '+hits.length+' matches';
  list.innerHTML=hits.map(function(h){
    var j=h.job,dept=DEPT[j.dept]||'Other';
    var why=h.matched.slice(0,6).join(', ');
    return '<a class="jmcard" href="'+esc(j.path||('/jobs/j/'+j.id+'/'))+'">'+
      '<div class="row"><span class="t">'+esc(j.title)+'</span><span class="pct">'+h.pct+'% fit</span></div>'+
      '<div class="co">'+esc(j.company)+'</div>'+
      '<div class="meta">'+esc(j.location)+' · '+esc(dept)+(j.salary?' · '+esc(j.salary):'')+'</div>'+
      (why?'<div class="why"><b>Matched:</b> '+esc(why)+'</div>':'')+
      '</a>'}).join('');
  try{nbevt('job_cv_match',{hits:hits.length,top:hits[0]&&hits[0].job.company})}catch(_){}
}

var cvText='',statusEl=document.getElementById('jmstatus'),runBtn=document.getElementById('jmrun');
var fileInput=document.getElementById('jmfile'),pasteEl=document.getElementById('jmpaste'),dropEl=document.getElementById('jmdrop');

function setStatus(msg,err){statusEl.textContent=msg||'';statusEl.className='jmstatus'+(err?' jmerr':'')}

fileInput.addEventListener('change',function(){
  var f=fileInput.files&&fileInput.files[0];if(!f)return;
  setStatus('Reading '+f.name+'…');
  readFile(f).then(function(t){cvText=t;pasteEl.value=t.slice(0,8000)+(t.length>8000?'\\n…':'');setStatus('Loaded '+f.name+' ('+t.length.toLocaleString()+' chars) — click find matching roles')}).catch(function(e){setStatus(e.message||'Could not read file',true)});
});

['dragenter','dragover'].forEach(function(ev){dropEl.addEventListener(ev,function(e){e.preventDefault();dropEl.classList.add('drag')})});
['dragleave','drop'].forEach(function(ev){dropEl.addEventListener(ev,function(e){e.preventDefault();dropEl.classList.remove('drag')})});
dropEl.addEventListener('drop',function(e){
  var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(!f)return;
  fileInput.files=e.dataTransfer.files;fileInput.dispatchEvent(new Event('change'));
});

var jobsCache=null;
runBtn.addEventListener('click',function(){
  var text=(pasteEl.value||'').trim()||cvText;
  if(text.length<120){setStatus('Paste or upload a CV first — need a bit more text to match.',true);return}
  runBtn.disabled=true;setStatus('Matching against live roles…');
  var p=jobsCache?Promise.resolve(jobsCache):loadJobs().then(function(j){jobsCache=j;return j});
  p.then(function(jobs){render(score(text,jobs));setStatus('Done — '+jobs.length.toLocaleString()+' roles scanned locally.')}).catch(function(){setStatus('Could not load job data — try again.',true)}).finally(function(){runBtn.disabled=false});
});
})();
</script>`;
