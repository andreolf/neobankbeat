const fs=require('fs');
const {JSDOM}=require('jsdom');
const rawHtml=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');

// The homepage loads its code from /app.js. jsdom fetches external scripts
// asynchronously, which every assertion below would race, so the file is folded
// back inline for the DOM tests only — same bytes, same order, synchronous.
// Flow 31 checks the real <script src> wiring separately.
const APP_SRC=(rawHtml.match(/<script src="\/app\.js\?v=[0-9a-f]+"><\/script>/)||[])[0];
const APP_JS=APP_SRC?fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'):null;
const html=APP_SRC?rawHtml.replace(APP_SRC,()=>'<script>'+APP_JS+'</script>'):rawHtml;

// polyfills BEFORE scripts execute
const dom=new JSDOM(html,{
  runScripts:'dangerously',
  pretendToBeVisual:true,
  url:'https://neobankbeat.test/',
  beforeParse(window){
    window.Element.prototype.scrollIntoView=function(){};
    window.alert=(m)=>{window.__lastAlert=m};
    window.matchMedia=window.matchMedia||(()=>({matches:false,addListener(){},removeListener(){}}));
    window.__jsErrors=[];
    window.addEventListener('error',e=>window.__jsErrors.push(e.message));
  }
});
const w=dom.window,d=w.document;
let fails=[],passes=0;
function ok(cond,label){ if(cond){passes++;} else {fails.push(label); console.log('  FAIL:',label);} }
if(w.__jsErrors&&w.__jsErrors.length){console.log('PAGE JS ERRORS:',w.__jsErrors);}
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
const countText=()=>d.getElementById('count').textContent;

console.log('— flow 1: initial render');
ok(d.querySelectorAll('#grid .card').length>0,'cards rendered');
ok(countText().includes('380'),'shows 380 total ('+countText()+')');
ok(d.getElementById('mapsec')!==null,'map section built');
ok(d.getElementById('newssec')!==null,'news section built');
ok(d.getElementById('datasec')!==null,'data section built');
ok(d.querySelector('.credit')!==null,'francesco credit in footer');
ok(d.getElementById('f-reg')!==null,'regulation filter present');

console.log('— flow 2: category filter → active bar → nav reset');
click(d.querySelector('.pill[data-cat="W"]'));
ok(countText().includes('showing 58'),'W filter → 58 ('+countText()+')');
ok(d.getElementById('activebar').textContent.includes('web3-native'),'active bar shows category chip');
click(d.getElementById('navdir'));
ok(countText().includes('380'),'directory nav resets filters ('+countText()+')');
ok(d.getElementById('activebar').innerHTML==='','active bar cleared');

console.log('— flow 3: active-filter chip removal');
click(d.querySelector('.pill[data-cat="H"]'));
d.getElementById('f-stable').checked=true;
d.getElementById('f-stable').dispatchEvent(new w.Event('change',{bubbles:true}));
ok(d.querySelectorAll('#activebar .fchip').length===2,'two filter chips shown');
click(d.querySelectorAll('#activebar .fchip')[0]); // remove category
ok(!d.getElementById('activebar').textContent.includes('hybrid'),'category chip removed via ✕');
click(d.getElementById('ab-clear')||d.getElementById('navdir'));
ok(countText().includes('380'),'clear all restores 380');

console.log('— flow 4: map region click filters + info panel');
const naChip=d.querySelector('#mapsec .mchip[data-mr="AF"]');
click(naChip);
const afCount=w.eval("D.filter(r=>macrosOf(r).includes('AF')).length");
ok(countText().includes('showing '+afCount),'Africa map filter → '+afCount+' ('+countText()+')');
ok(naChip.classList.contains('on'),'Africa chip active state');
ok(d.getElementById('activebar').textContent.includes('Africa'),'active bar shows map chip');
// hover simulation
naChip.dispatchEvent(new w.MouseEvent('mouseenter',{bubbles:true}));
ok(d.getElementById('mapinfo').textContent.includes('Africa'),'map info shows Africa on hover');
ok(d.querySelectorAll('#mapinfo .mi-item').length>0,'map info lists top neobanks');
click(naChip); // toggle off
ok(countText().includes('380'),'map filter toggles off');

console.log('— flow 5: profile open/close, peers, legal links');
click(d.querySelector('#grid .card .cname'));
ok(d.getElementById('detail').classList.contains('show'),'profile opens on card click');
ok(d.querySelector('#dwrap .pmodal')!==null,'new pmodal design used');
ok(d.querySelector('#dwrap .pstats')!==null,'stat tiles present');
ok(d.getElementById('dwrap').innerHTML.includes('legal'),'legal & official section present');
ok(d.getElementById('dwrap').innerHTML.includes('terms'),'terms link present');
const peer=d.querySelector('#dwrap [data-peer]');
if(peer){const pn=peer.dataset.peer;click(peer);
  ok(d.querySelector('#dwrap .pname').textContent===pn,'peer click navigates to peer profile ('+pn+')');}
else ok(true,'no peers (skip)');
click(d.getElementById('dclose'));
ok(!d.getElementById('detail').classList.contains('show'),'profile closes');

console.log('— flow 6: profile with users+volume tiles (Wise)');
w.openDetail('Wise');
ok(d.getElementById('dwrap').innerHTML.includes('Reported users'),'users tile on Wise');
ok(d.getElementById('dwrap').innerHTML.includes('Volume'),'volume tile on Wise');
ok(d.getElementById('dwrap').innerHTML.includes('FCA register'),'FCA link on Wise');
w.closeDetail();

console.log('— flow 7: compare flow with guidance');
const btns=d.querySelectorAll('#grid .cmp-btn');
click(btns[0]);
ok(d.getElementById('tray').classList.contains('show'),'tray appears after 1 pick');
ok(d.getElementById('trayhint').textContent.includes('pick at least one more'),'hint guides to pick more');
ok(d.getElementById('gocmp').disabled===true,'compare disabled at 1');
click(d.querySelectorAll('#grid .cmp-btn')[1]);
ok(d.getElementById('gocmp').disabled===false,'compare enabled at 2');
ok(d.getElementById('gocmp').classList.contains('pulse'),'button pulses at 2');
ok(d.getElementById('trayhint').textContent.includes('ready'),'hint says ready');
click(d.getElementById('gocmp'));
ok(d.getElementById('overlay').classList.contains('show'),'side-by-side opens');
ok(d.querySelectorAll('#cmptable tr').length>10,'comparison table has rows');
click(d.getElementById('ovclose'));
ok(!d.getElementById('overlay').classList.contains('show'),'side-by-side closes');
click(d.getElementById('tclear'));
ok(!d.getElementById('tray').classList.contains('show'),'tray clear empties selection');

console.log('— flow 8: regulation filter');
const fr=d.getElementById('f-reg');
fr.value='Licensed bank';fr.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(!countText().startsWith('showing 335')&&/^showing \d+ of 380/.test(countText()),'regulation filter applies ('+countText()+')');
ok(d.getElementById('activebar').textContent.includes('licensed bank'),'active bar shows regulation chip');
click(d.getElementById('navdir'));
ok(countText().includes('380'),'nav reset clears regulation too');

console.log('— flow 9: search + gen z audience');
const qi=d.getElementById('q');
qi.value='women';qi.dispatchEvent(new w.Event('input',{bubbles:true}));
ok(/^showing \d{1,2} of 380/.test(countText()),'search women narrows ('+countText()+')');
click(d.getElementById('navdir'));
const nn=d.getElementById('f-niche');
ok([...nn.options].some(o=>o.value==='gz'),'gen z option exists');
ok([...nn.options].some(o=>o.textContent.includes('gen alpha')),'gen alpha label exists');
nn.value='gz';nn.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(countText().includes('showing 8'),'gen z → 8 ('+countText()+')');
click(d.getElementById('navdir'));

console.log('— flow 10: escape key + overlay background click');
w.openDetail('MetaMask');
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
ok(!d.getElementById('detail').classList.contains('show'),'ESC closes profile');
ok(d.getElementById('dwrap').innerHTML.includes('Agent Wallet'),'MetaMask profile enriched');


console.log('— flow 11: custom dropdowns');
ok(d.querySelectorAll('.filterrow .dd').length===6,'6 custom dropdowns built ('+d.querySelectorAll('.filterrow .dd').length+')');
const audDD=d.querySelectorAll('.filterrow .dd')[0];
click(audDD.querySelector('.dd-btn'));
ok(audDD.classList.contains('open'),'audience dropdown opens');
const gzOpt=[...audDD.querySelectorAll('.dd-opt')].find(o=>o.textContent.includes('gen z'));
ok(gzOpt!==undefined,'gen z option in custom menu');
click(gzOpt);
ok(!audDD.classList.contains('open'),'menu closes after pick');
ok(countText().includes('showing 8'),'custom dropdown filters → 8 ('+countText()+')');
ok(audDD.querySelector('.lbl').textContent.includes('gen z'),'button label updates');
click(d.getElementById('navdir'));
ok(audDD.querySelector('.lbl').textContent.includes('audience: all'),'label resets on nav clear ('+audDD.querySelector('.lbl').textContent+')');
ok(countText().includes('380'),'count back to 380');

console.log('— flow 12: founder chips + press link');
w.openDetail('Nubank');
const chips=d.querySelectorAll('#dwrap .fdr');
ok(chips.length>=3,'Nubank founder chips rendered ('+chips.length+')');
const linked=[...chips].filter(c=>c.tagName==='A');
ok(linked.length>=3,'founder chips link out ('+linked.length+' linked)');
ok(linked[0].href.includes('linkedin.com'),'links go to LinkedIn search');
ok(linked[0].querySelector('.av')!==null,'avatar initials present');
ok(d.getElementById('dwrap').innerHTML.includes('press'),'press & interviews link present');
w.closeDetail();
w.openDetail('Up'); /* founders: "Ferocia (Dom Pym, Grant Thomas)" edge case */
ok(d.querySelectorAll('#dwrap .fdr').length>=1,'Up founder chips render without crash');
w.closeDetail();
w.openDetail('Kit'); /* "CommBank x15ventures" should be plain, unlinked */
const kitChips=d.querySelectorAll('#dwrap .fdr');
ok(kitChips.length===1&&kitChips[0].tagName!=='A','org-only founder stays unlinked');
w.closeDetail();


console.log('— flow 13: resources panel + researched volumes + new charts');
ok(d.querySelector('.rescard')!==null,'resources panel exists');
ok(d.querySelectorAll('#library .lres').length>=20,'20+ resource links in library ('+d.querySelectorAll('#library .lres').length+')');
ok([...d.querySelectorAll('#library .lres a')].some(a=>a.href.includes('fintechbrainfood')),'Fintech Brainfood linked');
ok([...d.querySelectorAll('#library .lres a')].some(a=>a.href.includes('l2beat')),'L2Beat credited');
const volCard=[...d.querySelectorAll('#datasec .dcard2')].find(c=>c.textContent.includes('volume watch'));
ok(volCard!==undefined,'researched volume card exists');
ok(volCard.textContent.includes('$316B'),'Cash App $316B from 10-K');
ok(volCard.textContent.includes('$243.5B'),'Wise FY26 $243.5B');
ok(volCard.textContent.includes('$2.95B'),'RedotPay hard figure $2.95B');
ok(volCard.querySelectorAll('a').length>=12,'volume rows all have source links ('+volCard.querySelectorAll('a').length+')');
ok(d.querySelector('.curve')!==null,'stablecoin curve chart rendered');
ok(d.querySelector('table.heat')!==null,'region×category matrix rendered');
const usersCard=[...d.querySelectorAll('#datasec .dcard2')][0];
ok(usersCard.textContent.includes('131M'),'Nubank users refreshed to 131M');
// heat cell click filters
const cell=d.querySelector('.heat td[data-hm="AF|W"]');
click(cell);
const afW=w.eval("D.filter(r=>r[1]==='W'&&macrosOf(r).includes('AF')).length");
ok(countText().includes('showing '+afW),'heat cell filters Africa×web3 → '+afW+' ('+countText()+')');
click(d.getElementById('navdir'));
// news refresh — headlines rotate via cron, so assert structure not content
const newsRows=[...d.querySelectorAll('#newssec .newsrow')];
ok(newsRows.length>=8,'news section has 8+ headlines ('+newsRows.length+')');
ok(newsRows.every(r=>r.querySelector('.n-head').textContent.trim().length>20&&r.querySelector('a.n-link[href^="http"]')),'every headline has a title and an external link');
// profile shows researched volume
w.openDetail('RedotPay');
ok(d.getElementById('dwrap').textContent.includes('$2.95B'),'RedotPay profile shows hard volume');
w.closeDetail();


console.log('— flow 14: verified links + X handles + logo clicks');
w.openDetail('Monzo');
let dw=d.getElementById('dwrap');
ok(dw.innerHTML.includes('monzo.com/legal/terms-and-conditions'),'Monzo verified terms URL embedded');
ok(dw.innerHTML.includes('x.com/monzo'),'Monzo X handle linked');
ok(dw.querySelector('.plogo.haslink')!==null,'profile logo is clickable to X');
ok(dw.innerHTML.includes('verified'),'verified badge shown');
const monzoChips=[...dw.querySelectorAll('a.fdr')];
ok(monzoChips.some(c=>c.href.includes('linkedin.com/in/tomblomfield')),'Tom Blomfield direct LinkedIn');
ok(dw.innerHTML.includes('x.com/t_blom'),'founder personal X handle linked');
w.closeDetail();
w.openDetail('Nubank');
dw=d.getElementById('dwrap');
ok([...dw.querySelectorAll('a.fdr')].some(c=>c.href.includes('david-velez')),'Vélez verified LinkedIn');
ok(dw.textContent.includes('countries (3)')||dw.textContent.includes('countries ('),'countries list rendered');
ok(dw.textContent.includes('Colombia'),'Nubank country-level ops shown');
w.closeDetail();
// unverified entity keeps fallback search links, never fabricated
w.openDetail('Tinaba');
dw=d.getElementById('dwrap');
ok(dw.innerHTML.includes('google.com/search?q=site'),'unverified entity keeps honest search fallback');
ok(!dw.innerHTML.includes('tinaba.com/terms'),'no fabricated terms URL for unverified entity');
w.closeDetail();

console.log('— flow 15: gap-hunt rows + refreshed stats');
ok(w.eval("D.length")===380,'dataset now 380');
ok(d.getElementById('st-total').textContent==='380','hero stat refreshed to 380');
w.openDetail('Kontigo');
ok(d.getElementById('dwrap').textContent.includes('Venezuela'),'Kontigo gap-hunt profile works');
w.closeDetail();

console.log('— flow 16: country drill-down on map');
w.showRegion('AF');
const drill=d.querySelectorAll('#mapinfo .mi-cty');
ok(drill.length>0&&drill.length<=12,'country chips render, capped ('+drill.length+')');
ok([...drill].some(c=>c.textContent.includes('Nigeria')),'Nigeria appears in Africa drill-down');
click([...drill].find(c=>c.textContent.includes('Nigeria')));
ok(/^showing \d+ of 380/.test(countText())&&!countText().startsWith('showing 380'),'country click filters directory ('+countText()+')');
click(d.getElementById('navdir'));
ok(d.querySelector('#mapsec')!==null&&d.getElementById('mapsec').previousElementSibling.id!=='spectrum','map relocated off the hero');
ok([...d.querySelectorAll('.hnav a')].some(a=>a.getAttribute('href')==='#mapsec'),'map nav link added');

console.log('— flow 17: github intake form');
const it=d.querySelector('.intakecard');
ok(it!==null,'intake card exists');
const addBtn=it.querySelector('.itbtn.add');
ok(addBtn.href.includes('github.com')&&addBtn.href.includes('issues/new'),'submit goes to GitHub issues');
ok(addBtn.href.includes('labels=new-neobank'),'issue pre-labeled');
ok(addBtn.href.includes('template=new-neobank.yml'),'links to the issue-form template (chooser drops body prefills)');
ok(it.querySelector('.itbtn.fix').href.includes('template=data-fix.yml'),'correction template present');


console.log('— flow 18: v10 chart fixes + wave splits + library');
// bar fills must be block-level (the invisible-colors bug)
const flCSS=[...d.styleSheets].length; // jsdom stylesheet check unreliable; assert via markup+CSS text
ok(w.eval("document.querySelector('style').textContent.includes('.hbar .fl{display:block')"),'bar fill display:block fix present');
const uc=[...d.querySelectorAll('#datasec .dcard2')][0];
ok(uc.querySelector('.fl')!==null&&uc.querySelector('.fl').style.width.includes('%'),'user bars have width fills');
ok(!uc.textContent.includes('· 20'),'labels use compact format (no truncating dots)');
ok(uc.querySelector('.chsrc')!==null&&uc.querySelector('.chsrc a')!==null,'users chart has linked sources');
// wave chart v2
const wc=[...d.querySelectorAll('#datasec .dcard2')][1];
ok(wc.querySelectorAll('.wcol').length===18,'wave has 18 columns');
ok(wc.querySelectorAll('.wstub').length>0,'zero years show baseline stubs');
const col16=[...wc.querySelectorAll('.wcol')].find(c=>c.title.startsWith('2016'));
click(col16);
const split=d.getElementById('wvsplit').textContent;
ok(/2016 — \d+ founded:/.test(split)&&split.includes('traditional')&&split.includes('web3-native'),'clicking a column shows the split ('+split.trim().slice(0,40)+'…)');
ok(wc.querySelector('.chsrc')!==null,'wave chart has a source line');
// curve + heat sources
const cc=[...d.querySelectorAll('#datasec .dcard2')].find(c=>c.textContent.includes('stablecoin card curve'));
ok(cc.querySelector('.chsrc a[href*="artemisanalytics"]')!==null,'curve cites Artemis with a link');
const hc=[...d.querySelectorAll('#datasec .dcard2')].find(c=>c.querySelector('table.heat'));
ok(hc.querySelector('.chsrc')!==null,'heat matrix has a source line');
// library
const lib=d.getElementById('library');
ok(lib!==null,'library section exists');
ok(lib.querySelectorAll('.rep').length>=13,'13+ reports listed ('+lib.querySelectorAll('.rep').length+')');
ok([...lib.querySelectorAll('.rep .ru a')].every(a=>a.textContent.startsWith('http')),'full URLs shown for every report');
ok(lib.querySelectorAll('.rbadge.pdf').length>=4,'direct-PDF badges present');
ok(lib.querySelectorAll('.rbadge.gated').length>=3,'email-gated flags present');
ok(lib.querySelectorAll('.lres').length>=20,'resources with full URLs ('+lib.querySelectorAll('.lres').length+')');
// footer-linked, not in main nav
ok([...d.querySelectorAll('footer a')].some(a=>a.getAttribute('href')==='#library'),'footer links to library');
ok(![...d.querySelectorAll('.hnav a')].some(a=>a.getAttribute('href')==='#library'),'library NOT in main nav');
ok(d.querySelector('.rescard .respointer a[href="#library"]')!==null,'methodology aside points to library');


console.log('— flow 19: view tabs + brand reset + report charts + super-apps');
// default view: directory visible, others hidden
ok(d.querySelector('#grid').style.display!=='none','directory visible by default');
ok(d.querySelector('#datasec').style.display==='none','data hidden by default');
// nav click → data view
const dataLink=[...d.querySelectorAll('.hnav a')].find(a=>a.getAttribute('href')==='#datasec');
click(dataLink);
ok(d.querySelector('#datasec').style.display!=='none'&&d.querySelector('#grid').style.display==='none','data tab shows data, hides directory');
ok(dataLink.classList.contains('on'),'active tab highlighted');
// new report charts present
ok([...d.querySelectorAll('#datasec .dcard2 h2')].some(h=>h.textContent.includes('neobank paradox')),'paradox chart exists');
ok([...d.querySelectorAll('#datasec .dcard2 h2')].some(h=>h.textContent.includes('world banked')),'findex chart exists');
ok([...d.querySelectorAll('#datasec .dcard2 h2')].some(h=>h.textContent.includes('2030 question')),'citi projection chart exists');
ok([...d.querySelectorAll('#datasec .dcard2 h2')].some(h=>h.textContent.includes('how stablecoins get spent')),'artemis comparison chart exists');
ok(d.querySelector('.curvenote')!==null&&d.querySelector('.curvenote').textContent.includes('measurement scope'),'curve sanity note explains the $1.5B/mo figure');
ok([...d.querySelectorAll('.chsrc a')].some(a=>a.href.includes('citigroup.com')),'Citi PDF linked');
ok([...d.querySelectorAll('.chsrc a')].some(a=>a.href.includes('simon-kucher')),'Simon-Kucher linked');
// heat cell click switches back to directory view
const cell2=d.querySelector('.heat td[data-hm="ASIA|T"]');
click(cell2);
ok(d.querySelector('#grid').style.display!=='none','heat click lands on directory view');
// brand click resets everything
click(d.querySelector('.logo'));
ok(countText().includes('380'),'brand click resets to full directory ('+countText()+')');
ok(d.querySelector('#grid').style.display!=='none','brand click shows directory');
// super-app wallets in
w.openDetail('GCash');
ok(d.getElementById('dwrap').textContent.includes('94M')||d.getElementById('dwrap').textContent.includes('super-app'),'GCash profile live');
w.closeDetail();
ok(w.eval("USERS.some(u=>u[0]==='PhonePe')"),'PhonePe in the users chart data');
// map + library views
const mapLink=[...d.querySelectorAll('.hnav a')].find(a=>a.getAttribute('href')==='#mapsec');
click(mapLink);
ok(d.querySelector('#mapsec').style.display!=='none'&&d.querySelector('#grid').style.display==='none','map tab isolates the map');
const libFooter=[...d.querySelectorAll('footer a')].find(a=>a.getAttribute('href')==='#library');
click(libFooter);
ok(d.querySelector('#library').style.display!=='none','footer library link opens library view');
click(d.getElementById('navdir'));


console.log('— flow 20: floating mini-map');
const mm=d.getElementById('minimap');
ok(mm!==null,'mini-map widget exists');
ok(mm.querySelectorAll('.mmdot[data-m]').length>100,'region dots rendered ('+mm.querySelectorAll('.mmdot[data-m]').length+')');
// hover shows region + count
const afDot=mm.querySelector('.mmdot[data-m="AF"]');
afDot.dispatchEvent(new w.MouseEvent('mouseover',{bubbles:true}));
ok(mm.dataset.hov==='AF'&&d.getElementById('mmlabel').textContent.includes('Africa'),'hover highlights Africa with count');
// click a region dot: switches back to the directory and applies the region filter
click(d.querySelectorAll('.hnav a')[0]); // go to map view first to prove switch-back
ok(d.querySelector('#grid').style.display==='none','on map view before minimap click');
click(afDot);
ok(d.querySelector('#grid').style.display!=='none','minimap region click returns to the directory');
ok(w.eval('mapFilter')==='AF','minimap region click applies the Africa filter');
click(d.getElementById('navdir'));
w.eval('setMap(null)');
// expand button opens the map view; minimap hides there
click(d.getElementById('mmexpand'));
ok(d.querySelector('#mapsec').style.display!=='none','expand opens the full map');
ok(d.body.classList.contains('on-map'),'minimap hidden on map view (body flag)');
click(d.getElementById('navdir'));
ok(!d.body.classList.contains('on-map'),'minimap returns off the map view');
// collapse toggle
click(d.getElementById('mmcollapse'));
ok(mm.classList.contains('min'),'collapses to a button');
click(d.getElementById('mmcollapse'));
ok(!mm.classList.contains('min'),'expands back');


console.log('— flow 21: intake on main page + map CTA + footer submit');
click(d.getElementById('navdir'));
ok(d.querySelector('.intake').style.display!=='none'&&d.querySelector('#grid').nextElementSibling.classList.contains('intake'),'intake visible on the directory page, right after the grid');
const dataLink2=[...d.querySelectorAll('.hnav a')].find(a=>a.getAttribute('href')==='#datasec');
click(dataLink2);
ok(d.querySelector('.intake').style.display==='none','intake hidden on data view');
click(d.getElementById('navdir'));
// full map region click → CTA into directory
const mapLink2=[...d.querySelectorAll('.hnav a')].find(a=>a.getAttribute('href')==='#mapsec');
click(mapLink2);
const afRegion=d.querySelector('#mapsec .mreg[data-mr="AF"]');
click(afRegion);
const cta=d.querySelector('#mapinfo .mi-cta');
ok(cta!==null&&/browse these \d+ in the directory/.test(cta.textContent),'region click offers a directory CTA ('+(cta?cta.textContent:'none')+')');
click(cta);
ok(d.querySelector('#grid').style.display!=='none'&&!countText().includes('showing 380 of 380'),'CTA lands on the filtered directory ('+countText()+')');
click(d.getElementById('navdir'));
ok([...d.querySelectorAll('footer a')].some(a=>a.href.includes('issues/new')&&a.textContent.includes('submit')),'footer has the submit-a-neobank link');
ok([...d.querySelectorAll('footer')].some(f=>f.textContent.includes('open source')),'footer declares open source');

console.log('— flow 22: overlay backdrop clicks close');
w.openDetail('Chime');
ok(d.getElementById('detail').classList.contains('show'),'profile open');
click(d.querySelector('#dwrap .pname')); // click INSIDE the modal must not close it
ok(d.getElementById('detail').classList.contains('show'),'click inside modal keeps it open');
click(d.getElementById('dwrap')); // dark area beside the modal
ok(!d.getElementById('detail').classList.contains('show'),'backdrop click closes profile');
click(d.querySelectorAll('#grid .cmp-btn')[0]);
click(d.querySelectorAll('#grid .cmp-btn')[1]);
click(d.getElementById('gocmp'));
ok(d.getElementById('overlay').classList.contains('show'),'compare open');
click(d.getElementById('overlay'));
ok(!d.getElementById('overlay').classList.contains('show'),'backdrop click closes compare');
click(d.getElementById('tclear'));

console.log('— flow 23: shareable filter URLs');
click(d.querySelector('.pill[data-cat="W"]'));
ok(w.location.search.includes('cat=W'),'category filter lands in the URL ('+w.location.search+')');
d.getElementById('f-stable').checked=true;
d.getElementById('f-stable').dispatchEvent(new w.Event('change',{bubbles:true}));
ok(w.location.search.includes('s=1'),'stablecoin toggle lands in the URL');
click(d.getElementById('navdir'));
ok(w.location.search==='','clearing filters cleans the URL ('+w.location.search+')');
// fresh session opening a shared URL applies the filters
const dom2=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://neobankbeat.test/?cat=W&s=1',
  beforeParse(window){window.Element.prototype.scrollIntoView=function(){};window.alert=()=>{};window.matchMedia=window.matchMedia||(()=>({matches:false,addListener(){},removeListener(){}}));}});
const w2=dom2.window,d2=w2.document;
const expW=w2.eval("D.filter(r=>r[1]==='W'&&r[10]).length");
ok(d2.getElementById('count').textContent.includes('showing '+expW),'shared URL applies cat=W + stablecoins → '+expW+' ('+d2.getElementById('count').textContent+')');
ok(d2.querySelector('.pill[data-cat="W"]').classList.contains('on'),'W pill reflects the shared URL state');

(async()=>{
console.log('— flow 24: shareable compare URLs + overlay history');
// fresh session opening a shared ?cmp= URL restores the tray
const dom3=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://neobankbeat.test/?cmp=Nubank,Chime',
  beforeParse(window){window.Element.prototype.scrollIntoView=function(){};window.alert=()=>{};window.matchMedia=window.matchMedia||(()=>({matches:false,addListener(){},removeListener(){}}));}});
const w3=dom3.window,d3=w3.document;
ok(w3.eval('cmp.size')===2,'shared ?cmp= URL restores 2 entities into the tray');
ok(d3.getElementById('tray').classList.contains('show'),'tray visible from shared URL');
ok(!d3.getElementById('gocmp').disabled,'compare button ready from shared URL');
// overlay pushes a history entry; back closes it (MutationObserver is async → wait a tick)
const click3=el=>el.dispatchEvent(new w3.MouseEvent('click',{bubbles:true,cancelable:true}));
click3(d3.getElementById('gocmp'));
ok(d3.getElementById('overlay').classList.contains('show'),'compare overlay opens from restored tray');
await new Promise(r=>setTimeout(r,100));
w3.history.back();
await new Promise(r=>setTimeout(r,300));
ok(!d3.getElementById('overlay').classList.contains('show'),'browser back closes the compare overlay');
ok(w3.location.search.includes('cmp='),'tray selection still in the URL after back');

console.log('— flow 25: no stale entity counts on evergreen surfaces');
{
  const path=require('path');
  const total=w3.eval('D.length');
  // files whose copy claims a *current* total — dated blog posts and reports are exempt
  const evergreen=['llms.txt','robots.txt','AGENTS.md','README.md','openapi.json','sitemap.md',
    'faq/index.html','glossary/index.html','404.html','blog/index.html'];
  for(const f of evergreen){
    let txt=fs.readFileSync(path.join(__dirname,'..',f),'utf8');
    // dated post titles in the blog index are historical snapshots, not stale copy
    if(f==='blog/index.html')txt=txt.split('<div class="postlist">')[0];
    // "334 of 380 entities" states a subset and proves it knows the total, so the
    // only numbers worth flagging are the ones presenting themselves as the total
    const stale=[...txt.matchAll(/\b(3[0-9]{2})\b(?! of \d)(?=[^.]{0,60}?(?:neobank|entit|verified))/gi)]
      .map(m=>+m[1]).filter(n=>n>=300&&n<500&&n!==total);
    ok(stale.length===0,f+' has no stale totals (found: '+[...new Set(stale)].join(',')+' vs '+total+')');
  }
}

console.log('— flow 26: generated who-owns / alternatives pages are substantive (no thin/broken pages)');
{
  const path=require('path');
  const root=path.join(__dirname,'..');
  const stripArticle=h=>{const m=h.match(/<article[\s\S]*?<\/article>/);return (m?m[0]:'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();};
  const ldOf=h=>[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>{try{return JSON.parse(m[1])}catch(e){return null}});
  let checked=0,thin=[],badld=[],nofaq=[],artifacts=[];
  const dirs=fs.readdirSync(path.join(root,'n'),{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
  for(const s of dirs){
    for(const sub of ['who-owns','alternatives']){
      const p=path.join(root,'n',s,sub,'index.html');
      if(!fs.existsSync(p))continue;
      checked++;
      const h=fs.readFileSync(p,'utf8');
      if(stripArticle(h).length<500)thin.push(sub+'/'+s);
      const lds=ldOf(h);
      if(lds.some(l=>l===null))badld.push(sub+'/'+s);
      if(!lds.some(l=>((l&&l['@graph'])||[]).some(n=>n['@type']==='FAQPage')))nofaq.push(sub+'/'+s);
      if(/>undefined<|>NaN<|>null<|is a {2}|include \.|and \.<|\/n\/\/|\/vs\/\//.test(h))artifacts.push(sub+'/'+s);
      if(!/short answer/.test(h))artifacts.push('noans:'+sub+'/'+s);
    }
  }
  ok(checked>=700,'scanned all generated answer pages ('+checked+')');
  ok(thin.length===0,'no thin answer pages (<500 chars): '+thin.slice(0,5).join(', '));
  ok(badld.length===0,'all answer-page JSON-LD parses ('+badld.slice(0,5).join(', ')+')');
  ok(nofaq.length===0,'every answer page carries FAQ schema ('+nofaq.slice(0,5).join(', ')+')');
  ok(artifacts.length===0,'no template artifacts/broken links in answer pages ('+artifacts.slice(0,5).join(', ')+')');

  // topic hubs: same bar, plus every row must reach a real profile and the
  // stated count must equal the rows actually rendered
  // hub paths come from /browse/, the generated index of them: naming the families
  // here instead meant two new ones shipped without any of these checks running
  const HUB_PATHS=[...fs.readFileSync(path.join(root,'browse','index.html'),'utf8')
    .matchAll(/href="\/([a-z]+\/[a-z0-9-]+)\/"(?= class="|>)/g)].map(m=>m[1])
    .filter(p=>!/^(n|vs|blog|infra|investors|jobs|report)\//.test(p));
  let hubs=0;const hthin=[],hbad=[],hcount=[],hlinks=[],hdup=new Map();
  {
    for(const id of HUB_PATHS){
      const p=path.join(root,id,'index.html');
      if(!fs.existsSync(p)){hthin.push(id+' (missing)');continue}
      hubs++;
      const h=fs.readFileSync(p,'utf8');
      if(stripArticle(h).length<900)hthin.push(id);
      const lds=ldOf(h);
      if(lds.some(l=>l===null)||!lds.some(l=>((l&&l['@graph'])||[]).some(n=>n['@type']==='FAQPage')))hbad.push(id);
      const claimed=+(h.match(/<b>(\d+) of \d+ tracked neobanks<\/b>/)||[])[1];
      const trs=(h.match(/<tbody>[\s\S]*?<\/tbody>/)||[''])[0];
      const rows=(trs.match(/<tr>/g)||[]).length;
      const listed=((lds.flatMap(l=>(l&&l['@graph'])||[]).find(n=>n['@type']==='ItemList')||{}).numberOfItems)|0;
      if(!(claimed===rows&&claimed===listed&&claimed>=6))hcount.push(id+' (h1:'+claimed+' rows:'+rows+' ld:'+listed+')');
      for(const m of trs.matchAll(/href="(\/n\/[^"]+)"/g))
        if(!fs.existsSync(path.join(root,m[1],'index.html')))hlinks.push(id+' → '+m[1]);
      const h1=(h.match(/<h1>([^<]*)<\/h1>/)||[])[1];
      hdup.set(h1,(hdup.get(h1)||0)+1);
    }
  }
  ok(hubs>=40,'scanned topic hub pages ('+hubs+')');
  ok(hthin.length===0,'no thin hub pages (<900 chars): '+hthin.slice(0,5).join(', '));
  ok(hbad.length===0,'every hub has parseable JSON-LD with FAQ schema ('+hbad.slice(0,5).join(', ')+')');
  ok(hcount.length===0,'hub headline count == table rows == ItemList length ('+hcount.slice(0,4).join(', ')+')');
  ok(hlinks.length===0,'every hub table row links a real profile ('+hlinks.slice(0,4).join(', ')+')');
  ok([...hdup.values()].every(v=>v===1),'no two hubs share an h1 ('+[...hdup].filter(x=>x[1]>1).map(x=>x[0]).join(', ')+')');
  ok(fs.existsSync(path.join(root,'browse','index.html')),'/browse/ hub index exists');
  // a hub that exists on disk but is not linked from /browse/ is orphaned, and
  // since HUB_PATHS is read *from* /browse/, the disk side is what needs checking
  {
    const fams=new Set(HUB_PATHS.map(p=>p.split('/')[0]));
    const onDisk=[...fams].flatMap(f=>fs.readdirSync(path.join(root,f),{withFileTypes:true})
      .filter(x=>x.isDirectory()).map(x=>f+'/'+x.name));
    const orphan=onDisk.filter(p=>!HUB_PATHS.includes(p));
    ok(orphan.length===0,'every hub on disk is linked from /browse/ ('+orphan.slice(0,5).join(', ')+')');
    ok(HUB_PATHS.length===onDisk.length,'/browse/ links every hub ('+HUB_PATHS.length+' linked, '+onDisk.length+' on disk)');
    ok(fams.size>=6,'hubs span every family ('+[...fams].join(' ')+')');
  }
}

console.log('— flow 27: every footer comes from one source (no hand-edited drift)');
{
  // Delegates to sync-footers.mjs --check rather than reimplementing it: two
  // copies of the drift rule would be the drift this flow exists to catch.
  const {execSync}=require('child_process');
  const path=require('path');
  let out='',code=0;
  try{ out=execSync('node '+path.join(__dirname,'sync-footers.mjs')+' --check',{encoding:'utf8'}); }
  catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status||1; }
  const drifted=[...out.matchAll(/^footer drift: (.+)$/gm)].map(m=>m[1]);
  const navDrift=[...out.matchAll(/^nav drift: (.+)$/gm)].map(m=>m[1]);
  const missing=(out.match(/^index\.html footer is missing: (.+)$/m)||[])[1];
  const navMissing=(out.match(/^index\.html nav is missing: (.+)$/m)||[])[1];
  ok(code===0,'no footer or nav drift'+(drifted.length+navDrift.length?' ('+(drifted.length+navDrift.length)+' file(s): '+[...drifted,...navDrift].slice(0,3).join(', ')+' — run node tests/sync-footers.mjs)':''));
  ok(!missing,'homepage footer reaches every canonical destination'+(missing?' (missing: '+missing+')':''));
  ok(!navMissing,'homepage nav reaches every canonical destination'+(navMissing?' (missing: '+navMissing+')':''));
  ok(/flat footers and \d+ navs match/.test(out),'footer and nav checks ran over the whole tree');

  // every nav on the site offers the same destinations in the same order, so
  // "where am I / where can I go" never depends on which page you landed on
  {
    const root2=path.join(__dirname,'..');
    const SKIP=/^(node_modules|\.git|tests|reports|substack-html|og|fonts|dataset)$/;
    const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>
      x.isDirectory()?(SKIP.test(x.name)?[]:walk(path.join(d,x.name))):x.name.endsWith('.html')?[path.join(d,x.name)]:[]);
    // canonical order, read from the source the sync writes from
    const CANON=fs.readFileSync(path.join(__dirname,'footer.mjs'),'utf8')
      .match(/export const NAV_LINKS = \[([\s\S]*?)\];/)[1]
      .match(/"(\/[^"]*)"/g).map(s=>s.slice(1,-1));
    const outOfOrder=[],incomplete=[];let n=0;
    for(const f of walk(root2)){
      const h=fs.readFileSync(f,'utf8');
      const m=h.match(/<nav [^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/);
      if(!m)continue;
      n++;
      const rel=path.relative(root2,f);
      // the language chooser is a control, not a primary-nav destination, so
      // drop its links before reading the nav's canonical order
      const navMarkup=m[0].replace(/<details class="langmenu">[\s\S]*?<\/details>/,'');
      // drop the logo link (the report edition carries one) and on-page anchors
      // (the homepage swaps three of its links for them, correctly)
      const hrefs=[...navMarkup.matchAll(/<a(?![^>]*class="logo")[^>]*href="([^"]+)"/g)].map(x=>x[1])
        .filter(x=>x.startsWith('/'));
      const canonHere=CANON.filter(c=>hrefs.includes(c));
      if(hrefs.join(' ')!==canonHere.join(' '))outOfOrder.push(rel);
      // only the homepage may substitute anchors, and never for more than its own sections
      if(canonHere.length<CANON.length&&rel!=='index.html')incomplete.push(rel+' (missing '+CANON.filter(c=>!hrefs.includes(c)).join(' ')+')');
    }
    ok(n>1600,'scanned every primary nav on the site ('+n+')');
    ok(outOfOrder.length===0,'every nav lists its destinations in the canonical order ('+outOfOrder.slice(0,4).join(', ')+')');
    ok(incomplete.length===0,'only the homepage substitutes nav links for on-page anchors ('+incomplete.slice(0,4).join(', ')+')');
    ok(CANON.includes('/browse/'),'the nav includes /browse/');
  }
}

console.log('— flow 28: every internal link resolves (no links to delisted neobanks)');
{
  // A neobank leaving the dataset deletes its /n/<slug>/ page, but hand-written
  // blog prose keeps linking to it. That is how /n/fi-money/ survived a removal.
  const path=require('path');
  const root=path.join(__dirname,'..');
  const SKIP=/^(node_modules|\.git|tests|reports|substack-html|og|fonts|dataset)$/;
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>
    x.isDirectory()?(SKIP.test(x.name)?[]:walk(path.join(d,x.name))):x.name.endsWith('.html')?[path.join(d,x.name)]:[]);
  const files=walk(root);
  const exists=p=>fs.existsSync(p)||fs.existsSync(path.join(p,'index.html'));
  const bad=[];let links=0;
  for(const f of files){
    let h=fs.readFileSync(f,'utf8');
    // strip <script> bodies: the homepage builds hrefs from template strings
    h=h.replace(/<script[\s\S]*?<\/script>/g,'');
    for(const m of h.matchAll(/href="(\/[^"#?]*)/g)){
      const href=m[1];
      if(/^\/(data\.json|llms|sitemap|openapi|robots|AGENTS|index\.md|favicon|apple-touch|_vercel|\.well-known)/.test(href))continue;
      links++;
      const target=path.join(root,decodeURIComponent(href));
      if(!exists(target))bad.push(path.relative(root,f)+' → '+href);
    }
  }
  ok(links>3000,'scanned internal links across the tree ('+links+' in '+files.length+' files)');
  ok(bad.length===0,'no broken internal links'+(bad.length?' ('+bad.length+': '+[...new Set(bad)].slice(0,5).join(', ')+')':''));
}

console.log('— flow 29: head metadata is complete and snippet-sized');
{
  // 87% of descriptions used to run past ~160 chars, which hands the SERP snippet
  // back to Google to rewrite. og:description keeps the full sentence.
  const path=require('path');
  const root=path.join(__dirname,'..');
  const SKIP=/^(node_modules|\.git|tests|reports|substack-html|og|fonts|dataset)$/;
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>
    x.isDirectory()?(SKIP.test(x.name)?[]:walk(path.join(d,x.name))):x.name.endsWith('.html')?[path.join(d,x.name)]:[]);
  const long=[],noDesc=[],noCanon=[],badOg=[];
  for(const f of walk(root)){
    const h=fs.readFileSync(f,'utf8');
    const rel=path.relative(root,f);
    if(/<meta name="robots" content="noindex/.test(h))continue;
    const d=(h.match(/<meta name="description" content="([^"]*)"/)||[])[1];
    if(!d)noDesc.push(rel);
    else if(d.replace(/&[a-z]+;/g,'x').length>160)long.push(rel+' ('+d.length+')');
    if((h.match(/<link rel="canonical"/g)||[]).length!==1)noCanon.push(rel);
    const og=(h.match(/<meta property="og:image" content="https:\/\/www\.neobankbeat\.com([^"]*)"/)||[])[1];
    if(og&&!fs.existsSync(path.join(root,og)))badOg.push(rel+' → '+og);
  }
  ok(long.length===0,'no meta description over 160 chars'+(long.length?' ('+long.length+': '+long.slice(0,4).join(', ')+')':''));
  ok(noDesc.length===0,'every indexable page has a meta description'+(noDesc.length?' ('+noDesc.join(', ')+')':''));
  ok(noCanon.length===0,'every indexable page has exactly one canonical'+(noCanon.length?' ('+noCanon.join(', ')+')':''));
  ok(badOg.length===0,'every og:image resolves to a file'+(badOg.length?' ('+badOg.slice(0,4).join(', ')+')':''));
}

console.log('— flow 30: prose counts match the dataset (no hand-written totals drifting)');
{
  // Delegates to sync-counts.mjs --check for the same reason flow 27 delegates
  // to sync-footers: a second copy of the rules would drift too.
  const {execSync}=require('child_process');
  const path=require('path');
  let out='',code=0;
  try{ out=execSync('node '+path.join(__dirname,'sync-counts.mjs')+' --check',{encoding:'utf8'}); }
  catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status||1; }
  const drifted=[...out.matchAll(/^\s+(\S+\.(?:txt|md|html):.+)$/gm)].map(m=>m[1]);
  ok(code===0,'no count drift in hand-written prose'+(drifted.length?' ('+drifted.length+': '+drifted.slice(0,3).join(' | ')+' — run node tests/sync-counts.mjs)':''));
  ok(/counts in sync across/.test(out),'count check ran');

  // dated posts cite the dataset size they were written against; each must either
  // still match live data or carry a note saying it doesn't
  let aout='',acode=0;
  try{ aout=execSync('node '+path.join(__dirname,'sync-blog-asof.mjs')+' --check',{encoding:'utf8'}); }
  catch(e){ aout=(e.stdout||'')+(e.stderr||''); acode=e.status||1; }
  const astale=[...aout.matchAll(/^\s+(blog\/\S+:.+)$/gm)].map(m=>m[1]);
  ok(acode===0,'every dated post with stale counts carries an as-of note'+(astale.length?' ('+astale.length+': '+astale.slice(0,3).join(' | ')+' — run node tests/sync-blog-asof.mjs)':''));
  {
    const root2=path.join(__dirname,'..');
    const total=w3.eval('D.length');
    const bad=[];let stamped=0;
    for(const d of fs.readdirSync(path.join(root2,'blog'),{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name)){
      const f=path.join(root2,'blog',d,'index.html');
      if(!fs.existsSync(f))continue;
      const h=fs.readFileSync(f,'utf8');
      if(!/asof:start/.test(h))continue;
      stamped++;
      const live=+(h.match(/now tracks <b>(\d+)<\/b>/)||[])[1];
      const snap=+(h.match(/snapshot of <b>(\d+)<\/b>/)||[])[1];
      if(live!==total)bad.push(d+' (says live '+live+')');
      if(snap===total)bad.push(d+' (note claims a snapshot equal to live)');
      if(!/\.asof\{/.test(h))bad.push(d+' (note has no styles)');
    }
    ok(stamped>=10,'dated posts carry as-of notes ('+stamped+')');
    ok(bad.length===0,'as-of notes quote the current total ('+bad.slice(0,4).join(', ')+')');
  }

  // the agent surface is generated; if it is stale the skill hash stops matching
  // and discovery clients drop the skill entirely
  const root=path.join(__dirname,'..');
  const idx=JSON.parse(fs.readFileSync(path.join(root,'.well-known/agent-skills/index.json'),'utf8'));
  const skill=fs.readFileSync(path.join(root,'.well-known/agent-skills/neobank-dataset/SKILL.md'),'utf8');
  const hash=require('crypto').createHash('sha256').update(skill).digest('hex');
  ok(idx.skills[0].sha256===hash,'agent-skill sha256 matches SKILL.md');
  const total=w3.eval('D.length');
  for(const f of ['.well-known/api-catalog','.well-known/agent-skills/index.json','.well-known/agent-skills/neobank-dataset/SKILL.md','openapi.json']){
    const txt=fs.readFileSync(path.join(root,f),'utf8');
    const stale=[...txt.matchAll(/\b(\d{3})\b(?=[^.]{0,60}?(?:neobank|entit|verified))/gi)]
      .map(m=>+m[1]).filter(n=>n>=300&&n<500&&n!==total);
    ok(stale.length===0,f+' has no stale totals (found: '+[...new Set(stale)].join(',')+' vs '+total+')');
  }
}

console.log('— flow 31: the homepage ships its code as a cacheable file, not as markup');
{
  const path=require('path');
  const root=path.join(__dirname,'..');
  ok(!!APP_SRC,'index.html loads /app.js via <script src>');
  ok(fs.existsSync(path.join(root,'app.js')),'app.js exists on disk');

  const {execSync}=require('child_process');
  let sync=true;
  try{ execSync('node '+path.join(__dirname,'build-app-js.mjs')+' --check',{encoding:'utf8'}); }catch(e){ sync=false; }
  ok(sync,'app.js and index.html agree (run node tests/build-app-js.mjs)');

  // the whole point: markup a crawler must parse before it sees any content
  ok(rawHtml.length<110*1024,'index.html markup is under 110KB ('+(rawHtml.length/1024).toFixed(0)+'KB)');
  const inlineJs=[...rawHtml.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(m=>!/ld\+json/.test(m[1])).reduce((a,m)=>a+m[2].length,0);
  ok(inlineJs<4*1024,'almost no inline JS left in the page ('+(inlineJs/1024).toFixed(1)+'KB, analytics stubs only)');

  // an immutable cache with a stale hash would serve last week's app forever
  const h=(APP_SRC.match(/v=([0-9a-f]+)/)||[])[1];
  const pre=(rawHtml.match(/<link rel="preload" as="script" href="\/app\.js\?v=([0-9a-f]+)">/)||[])[1];
  ok(pre===h,'preload hint and script tag point at the same version ('+pre+' vs '+h+')');
  const real=require('crypto').createHash('sha256')
    .update(fs.readFileSync(path.join(root,'app.js'),'utf8')).digest('hex').slice(0,10);
  ok(real===h,'?v= hash matches app.js contents ('+real+' vs '+h+')');

  // the dataset, the map grid and the news block are JS literals other builds parse;
  // any script still hunting for them in index.html silently stopped working
  const LITERALS=/const (?:GRID|L2M|NEWS_UPDATED)=|NEWS-AUTO-START|\bD\b\.map|const D=/;
  const wrongFile=[];
  for(const f of fs.readdirSync(__dirname).filter(x=>/\.(mjs|js)$/.test(x)&&!/^(flowtest|build-app-js|homepage-js)\./.test(x))){
    const s=fs.readFileSync(path.join(__dirname,f),'utf8');
    if(LITERALS.test(s)&&/['"]index\.html['"]/.test(s)&&!/homepage-js|app\.js/.test(s))wrongFile.push(f);
  }
  ok(wrongFile.length===0,'no build script still parses homepage JS out of index.html ('+wrongFile.join(', ')+')');

  // a workflow with an unrecognised top-level key is invalid, and GitHub reports it
  // as a failed run rather than a config error — `soname:` for `name:` cost six of them
  {
    const VALID=new Set(['name','on','permissions','jobs','env','defaults','concurrency','run-name']);
    const wf=path.join(root,'.github','workflows');
    const broken=[];
    for(const f of fs.readdirSync(wf)){
      const keys=[...fs.readFileSync(path.join(wf,f),'utf8').matchAll(/^([A-Za-z_][\w-]*):/gm)].map(m=>m[1]);
      const bad=keys.filter(k=>!VALID.has(k));
      if(bad.length)broken.push(f+' ('+bad.join(',')+')');
      else if(!keys.includes('name')||!keys.includes('on')||!keys.includes('jobs'))broken.push(f+' (missing name/on/jobs)');
    }
    ok(broken.length===0,'every workflow file has only valid top-level keys ('+broken.join(', ')+')');
  }

  const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  const rule=(vercel.headers||[]).find(x=>/app\\?\.js|\/app\.js/.test(x.source));
  ok(!!rule&&rule.headers.some(x=>/cache-control/i.test(x.key)&&/immutable/.test(x.value)),
    'app.js is served with an immutable cache header');

  // Headers a static site gets for free and a scanner marks it down for missing.
  const all=(vercel.headers||[]).find(x=>x.source==='/(.*)');
  const want=['X-Content-Type-Options','Referrer-Policy','X-Frame-Options','Permissions-Policy'];
  const got=all?all.headers.map(x=>x.key):[];
  ok(want.every(k=>got.includes(k)),'baseline security headers set for every path ('+want.filter(k=>!got.includes(k)).join(', ')+')');
}

console.log('— flow 32: every page below / declares a breadcrumb trail');
{
  // Google swaps the URL line in a result for the trail when it finds one, so a
  // page without one looks different in the SERP to every page around it.
  // Delegates to sync-crumbs.mjs --check, same reasoning as flow 27.
  const {execSync}=require('child_process');
  const path=require('path');
  let out='',code=0;
  try{ out=execSync('node '+path.join(__dirname,'sync-crumbs.mjs')+' --check',{encoding:'utf8'}); }
  catch(e){ out=(e.stdout||'')+(e.stderr||''); code=e.status||1; }
  const bare=[...out.matchAll(/^no breadcrumbs(?: \(generated[^)]*\))?: (.+)$/gm)].map(m=>m[1]);
  ok(code===0,'no page is missing its BreadcrumbList'+(bare.length?' ('+bare.length+': '+bare.slice(0,3).join(' ')+' — run node tests/sync-crumbs.mjs)':''));
  const n=+(out.match(/all (\d+) indexable pages/)||[])[1];
  ok(n>1600,'breadcrumb check covered the whole site ('+n+' pages)');
}

console.log('— flow 33: text colours clear WCAG AA against every surface');
{
  // --dim was #5A5A68: 2.62–2.91:1 on the three dark surfaces, against the 4.5:1
  // that text under 18pt requires. It is used for footers, captions, .meta and
  // placeholders, so most of the small print on the site failed. The light theme
  // failed too, at 3.08:1. Computed here rather than eyeballed so a future
  // palette tweak cannot quietly undo it.
  const lin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
  const lum=h=>{const n=parseInt(h.slice(1),16);return 0.2126*lin(n>>16&255)+0.7152*lin(n>>8&255)+0.0722*lin(n&255)};
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
  const AA=4.5;

  const path=require('path');
  const root=path.join(__dirname,'..');
  const css=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const grab=(block,name)=>((block.match(new RegExp('--'+name+':\\s*(#[0-9A-Fa-f]{6})'))||[])[1]||'').toUpperCase();
  const themes={
    dark:(css.match(/:root\{[\s\S]*?\}/)||[''])[0],
    light:(css.match(/body\.bw\{[\s\S]*?\}/)||[''])[0],
  };
  for(const [label,block] of Object.entries(themes)){
    const surfaces=['bg','panel','panel2'].map(n=>grab(block,n)).filter(Boolean);
    ok(surfaces.length===3,label+' theme declares bg, panel and panel2');
    for(const fg of ['text','muted','dim']){
      const c=grab(block,fg);
      if(!c){ok(false,label+' theme declares --'+fg);continue}
      const worst=Math.min(...surfaces.map(s=>ratio(c,s)));
      ok(worst>=AA,label+' --'+fg+' ('+c+') clears AA on every surface ('+worst.toFixed(2)+':1)');
    }
  }
  // blog.css styles every page that is not the homepage, so it must agree
  const blog=fs.readFileSync(path.join(root,'blog','blog.css'),'utf8');
  for(const fg of ['muted','dim']){
    const a=grab((css.match(/:root\{[\s\S]*?\}/)||[''])[0],fg);
    const b=grab((blog.match(/:root\{[\s\S]*?\}/)||[''])[0],fg);
    ok(a===b&&!!a,'blog.css --'+fg+' matches the homepage ('+b+' vs '+a+')');
  }
}

console.log('— flow 34: every page has a skip link and one main landmark');
{
  // The homepage carried a skip link from the start; the other 1,664 pages left a
  // keyboard user tabbing the whole nav on every page. The homepage's own <main>
  // wrapped just the card grid, leaving the hero, filters, charts and library in
  // no landmark at all.
  const path=require('path');
  const root=path.join(__dirname,'..');
  const SKIPDIR=new Set(['node_modules','.git','reports','substack-html']);
  const walk=(dir,out=[])=>{
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      if(e.name.startsWith('.')||SKIPDIR.has(e.name))continue;
      const p=path.join(dir,e.name);
      if(e.isDirectory())walk(p,out); else if(e.name.endsWith('.html'))out.push(p);
    }
    return out;
  };
  const noSkip=[],dangling=[],multiMain=[],noMain=[];
  for(const f of walk(root)){
    const s=fs.readFileSync(f,'utf8');
    if(/<meta name="robots" content="noindex/.test(s)&&!/<main/.test(s))continue;
    const rel=path.relative(root,f);
    const mains=(s.match(/<main[\s>]/g)||[]).length;
    if(mains===0){noMain.push(rel);continue}
    if(mains>1)multiMain.push(rel);
    const m=s.match(/<a class="skip" href="#([^"]+)"/);
    if(!m){noSkip.push(rel);continue}
    if(!new RegExp('id="'+m[1]+'"').test(s))dangling.push(rel+' -> #'+m[1]);
  }
  ok(noSkip.length===0,'every page with a main landmark has a skip link'+(noSkip.length?' ('+noSkip.length+' missing, e.g. '+noSkip[0]+')':''));
  ok(dangling.length===0,'every skip link resolves to an id on the page'+(dangling.length?' ('+dangling.slice(0,3).join(', ')+')':''));
  ok(multiMain.length===0,'no page declares more than one <main>'+(multiMain.length?' ('+multiMain.slice(0,3).join(', ')+')':''));

  // and on the homepage specifically, the landmark has to hold the content
  const m=d.querySelector('main');
  ok(!!m&&m.id==='main','the homepage main landmark is <main id="main">');
  for(const [label,sel] of [['the filters','.filterrow'],['the hero stats','.statrow'],['the card grid','#grid']]){
    const el=d.querySelector(sel);
    ok(!!el&&m.contains(el),label+' sits inside the main landmark');
  }
  ok(!m.contains(d.querySelector('header'))&&!m.contains(d.querySelector('footer')),
    'the header and footer stay outside the main landmark');
}

console.log('— flow 35: share text carries no dashes');
{
  // Composed posts read as machine-written with an em dash in them, so the three
  // share templates use a colon instead. This covers the static profile pages and
  // both runtime templates in app.js.
  const path=require('path');
  const root=path.join(__dirname,'..');
  const decode=(s)=>{
    const m=s.match(/intent\/tweet\?([^"']+)/);
    if(!m)return null;
    return new (require('url').URLSearchParams)(m[1].replace(/&amp;/g,'&')).get('text');
  };
  const page=fs.readFileSync(path.join(root,'n','revolut','index.html'),'utf8');
  const t=decode(page);
  ok(!!t,'the profile page has a share link');
  ok(t&&!/[—–-]/.test(t),'profile share text has no dash ('+t+')');

  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const runtime=(app.match(/intent\/tweet\?text='\+encodeURIComponent\(([^;]{0,160})/g)||[]);
  ok(runtime.length===2,'both runtime share templates found ('+runtime.length+')');
  const dashed=runtime.filter(s=>/[—–]/.test(s));
  ok(dashed.length===0,'no runtime share template contains a dash'+(dashed.length?' ('+dashed[0]+')':''));

  // and the live modal, built the way a user triggers it
  const dm=d.querySelector('.pxshare');
  if(dm){
    const mt=decode(dm.getAttribute('href')||'');
    ok(mt&&!/[—–]/.test(mt),'modal share text has no dash ('+mt+')');
  }
}

console.log('— flow 36: every table header cell declares a scope');
{
  // Without scope, the header-to-cell association is the screen reader's guess.
  // Delegates to sync-tables.mjs --check, same reasoning as flows 27 and 32.
  const {execSync}=require('child_process');
  const path=require('path');
  let code=0;
  try{ execSync('node '+path.join(__dirname,'sync-tables.mjs')+' --check',{encoding:'utf8'}); }
  catch(e){ code=1; }
  ok(code===0,'no table header is missing a scope (run node tests/sync-tables.mjs)');
}

console.log('— flow 37: the filters are operable by keyboard alone');
{
  // The native <select> behind each dropdown is display:none, so the custom
  // widget is the only way in. It shipped mouse-only: a real <button> to open,
  // then options that were <div>s with click handlers and no tabindex, so a
  // keyboard user could open a menu and not choose from it.
  const key=(el,k)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
  const dd=d.querySelectorAll('.filterrow .dd')[0];
  const btn=dd.querySelector('.dd-btn'),menu=dd.querySelector('.dd-menu');
  const sel=dd.parentNode.querySelector('select');
  const activeText=()=>((menu.querySelector('.dd-opt.active')||{}).textContent||'').trim();

  ok(btn.getAttribute('aria-controls')===menu.id&&!!menu.id,'dropdown button points at its listbox');
  ok(!!btn.getAttribute('aria-label'),'dropdown button carries the label from the select it replaced');
  ok(menu.getAttribute('role')==='listbox','popup is a listbox');
  ok([...menu.querySelectorAll('.dd-opt')].every(o=>o.id&&o.hasAttribute('aria-selected')),
    'every option has an id and aria-selected');

  key(btn,'ArrowDown');
  ok(dd.classList.contains('open')&&btn.getAttribute('aria-expanded')==='true','ArrowDown opens the menu');
  ok(!!d.getElementById(btn.getAttribute('aria-activedescendant')),'aria-activedescendant resolves to a real option');

  const first=activeText();
  key(btn,'ArrowDown');
  ok(activeText()!==first&&activeText()!=='','ArrowDown moves the active option');
  key(btn,'End');
  const last=activeText();
  key(btn,'Home');
  ok(activeText()!==last,'Home and End jump to the ends');

  let fired=0; sel.addEventListener('change',()=>fired++);
  key(btn,'ArrowDown');
  const want=activeText();
  key(btn,'Enter');
  ok(fired===1,'Enter fires exactly one change on the underlying select ('+fired+')');
  ok(sel.options[sel.selectedIndex].textContent.trim()===want,'Enter selects the active option ('+want+')');
  ok(!dd.classList.contains('open'),'menu closes after a keyboard pick');
  ok(dd.querySelector('.lbl').textContent.trim()===want,'button label reflects the keyboard pick');
  ok(menu.querySelectorAll('.dd-opt[aria-selected="true"]').length===1,'exactly one option is aria-selected');
  ok(countText()!==''&&/showing/.test(countText()),'the grid re-rendered after a keyboard-only filter change');

  const beforeIdx=sel.selectedIndex;
  key(btn,'ArrowDown'); key(btn,'Escape');
  ok(!dd.classList.contains('open'),'Escape closes the menu');
  ok(sel.selectedIndex===beforeIdx,'Escape does not change the selection');
  ok(btn.getAttribute('aria-activedescendant')===null,'activedescendant is cleared when closed');

  // put the page back for anything downstream
  sel.selectedIndex=0; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
}

console.log('— flow 38: modals contain focus and hand it back');
{
  // Both overlays declared aria-modal="true" while letting Tab walk out into the
  // page behind them, and the compare overlay never returned focus to whatever
  // opened it. A dialog that lies about being modal is worse than one that does
  // not claim to be.
  const key=(el,k,shift)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,shiftKey:!!shift,bubbles:true,cancelable:true}));
  const ov=d.getElementById('overlay'),det=d.getElementById('detail');
  const vis=el=>[...el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];

  ok(ov.getAttribute('aria-hidden')==='true'&&det.getAttribute('aria-hidden')==='true',
    'closed dialogs are aria-hidden, so they do not read as empty modals');

  // open it the way flow 7 does: pick two cards, then press compare
  d.querySelectorAll('#grid .cmp-btn').forEach((b,i)=>{ if(i<2)click(b) });
  const go=d.getElementById('gocmp');
  go.focus();
  const before=d.activeElement;
  click(go);
  await new Promise(r=>setTimeout(r,0));   // let the class observer run
  ok(ov.classList.contains('show'),'compare overlay opened for the focus test');
  ok(!ov.hasAttribute('aria-hidden'),'an open dialog drops aria-hidden');
  ok(ov.contains(d.activeElement),'focus moves into the dialog on open');

  const f=vis(ov);
  ok(f.length>1,'the dialog has focusable controls to cycle ('+f.length+')');
  f[f.length-1].focus();
  key(f[f.length-1],'Tab');
  ok(d.activeElement===f[0],'Tab from the last control wraps to the first, not out of the dialog');
  f[0].focus();
  key(f[0],'Tab',true);
  ok(d.activeElement===f[f.length-1],'Shift+Tab from the first wraps to the last');

  key(d.body,'Escape');
  await new Promise(r=>setTimeout(r,0));
  ok(!ov.classList.contains('show'),'Escape closes the compare overlay');
  ok(ov.getAttribute('aria-hidden')==='true','a closed dialog is aria-hidden again');
  ok(d.activeElement===before,'focus returns to the control that opened it');
}

console.log('— flow 39: site-wide structural SEO invariants');
{
  // Each assertion here exists because the audit that wrote it found a real
  // defect: unparseable JSON-LD hidden inside a JSON array, a canonical that
  // pointed at the wrong path, ItemList counts that disagreed with the rows
  // rendered, and future-dated posts. None were caught by the flows above.
  const path=require('path');
  const root=path.join(__dirname,'..');
  const SKIP=/^(node_modules|\.git|tests|reports|substack-html|og|fonts|dataset|\.well-known)$/;
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>
    x.isDirectory()?(SKIP.test(x.name)?[]:walk(path.join(d,x.name)))
      :x.name.endsWith('.html')?[path.join(d,x.name)]:[]);
  // an @graph, a bare node and a top-level array are all legal shapes
  const flat=a=>Array.isArray(a)?a.flatMap(flat):(a&&a['@graph']?flat(a['@graph']):[a]);
  const BASE='https://www.neobankbeat.com';
  const today=new Date().toISOString().slice(0,10);

  const badLd=[],badCanon=[],future=[],badList=[],thinDesc=[];
  const titles=new Map(),pages=new Set();
  for(const f of walk(root)){
    const h=fs.readFileSync(f,'utf8');
    if(/<meta name="robots" content="noindex/.test(h))continue;
    const rel=path.relative(root,f);
    const url=rel==='index.html'?'/':'/'+rel.replace(/index\.html$/,'');
    pages.add(url);

    const t=(h.match(/<title>([^<]*)<\/title>/)||[])[1]||'';
    titles.set(t,(titles.get(t)||0)+1);

    const canon=(h.match(/<link rel="canonical" href="([^"]*)"/)||[])[1];
    if(canon!==BASE+url)badCanon.push(rel+' → '+canon);

    let nodes=[];
    for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
      try{ nodes.push(...flat(JSON.parse(m[1]))); }catch(e){ badLd.push(rel); }
    }
    for(const nd of nodes){
      if(!nd||!nd['@type'])badLd.push(rel+' (node with no @type)');
      for(const k of ['datePublished','dateModified'])
        if(nd[k]&&String(nd[k]).slice(0,10)>today)future.push(rel+' '+k+'='+nd[k]);
      if(nd['@type']==='ItemList'&&nd.numberOfItems!==undefined
        &&nd.numberOfItems!==(nd.itemListElement||[]).length)
        badList.push(rel+' ('+nd.numberOfItems+' vs '+(nd.itemListElement||[]).length+')');
      if(nd['@type']==='FAQPage')
        for(const q of nd.mainEntity||[])
          if(!q.name||!(q.acceptedAnswer&&q.acceptedAnswer.text&&q.acceptedAnswer.text.length>=40))
            thinDesc.push(rel+': '+String(q.name).slice(0,40));
    }
  }

  ok(pages.size>1600,'walked the whole indexable tree ('+pages.size+' pages)');
  ok(badLd.length===0,'every JSON-LD block parses and every node is typed'+(badLd.length?' ('+[...new Set(badLd)].slice(0,4).join(', ')+')':''));
  ok(badCanon.length===0,'every canonical points at the page that declares it'+(badCanon.length?' ('+badCanon.length+': '+badCanon.slice(0,3).join(', ')+')':''));
  ok(badList.length===0,'every ItemList numberOfItems matches its elements'+(badList.length?' ('+badList.slice(0,3).join(', ')+')':''));
  ok(thinDesc.length===0,'every FAQ entry has a question and a real answer'+(thinDesc.length?' ('+thinDesc.length+': '+thinDesc.slice(0,3).join(' | ')+')':''));
  const dupT=[...titles].filter(x=>x[1]>1);
  ok(dupT.length===0,'no two indexable pages share a <title>'+(dupT.length?' ('+dupT.slice(0,3).map(x=>x[1]+'× '+x[0].slice(0,40)).join(' | ')+')':''));

  // sitemap and disk must agree in both directions, or pages ship uncrawled
  const sm=new Set([...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8')
    .matchAll(/<loc>https:\/\/www\.neobankbeat\.com([^<]*)<\/loc>/g)].map(m=>m[1]||'/'));

  // A future date is legal only for a post being held back: it must be absent
  // from the sitemap, since Google discards a future lastmod and would date the
  // result unpredictably. Dated and submitted at once is the bug to catch.
  const scheduled=new Set(future.map(x=>'/'+x.split(' ')[0].replace(/index\.html$/,'')));
  const leaked=[...scheduled].filter(u=>sm.has(u));
  ok(leaked.length===0,'no future-dated page is in the sitemap'+(leaked.length?' ('+leaked.join(' ')+')':''));

  const unlisted=[...pages].filter(u=>!sm.has(u)&&!scheduled.has(u));
  const ghosts=[...sm].filter(u=>!pages.has(u)&&!/\.\w+$/.test(u));
  ok(unlisted.length===0,'every indexable page is in the sitemap'+(unlisted.length?' ('+unlisted.length+': '+unlisted.slice(0,4).join(' ')+')':''));
  ok(ghosts.length===0,'the sitemap lists no page that is missing from disk'+(ghosts.length?' ('+ghosts.slice(0,4).join(' ')+')':''));

  // the feeds are hand-maintained XML; a single mismatched tag silently kills
  // the whole feed for every RSS reader (the blog feed shipped broken for
  // three weeks — a missing <item> nobody saw). Parse, don't trust.
  for(const rel of ['blog/feed.xml','jobs/feed.xml','sitemap.xml']){
    const xml=fs.readFileSync(path.join(root,rel),'utf8');
    const parsed=new (new JSDOM('').window.DOMParser)().parseFromString(xml,'text/xml');
    const err=parsed.querySelector('parsererror');
    ok(!err,rel+' is well-formed XML'+(err?' ('+err.textContent.split('\n')[0].slice(0,80)+')':''));
  }

  // /data/ promises a dictionary of the schema, so a field or enum value that
  // exists in data.json but not on that page is a broken promise. region, note,
  // story and volume were all on every entity and none were documented.
  {
    const D=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
    const doc=fs.readFileSync(path.join(root,'data','index.html'),'utf8');
    const dict=(doc.match(/<table class="fdict">[\s\S]*?<\/table>/)||[''])[0];
    const fields=new Set();
    for(const e of D.entities)for(const k of Object.keys(e))fields.add(k);
    const undoc=[...fields].filter(k=>!new RegExp('(^|[>\\s·])'+k+'($|[<\\s·])').test(dict));
    ok(undoc.length===0,'every data.json field is in the /data/ dictionary'+(undoc.length?' ('+undoc.join(', ')+')':''));
    const regs=[...new Set(D.entities.map(e=>e.regulation_type).filter(Boolean))];
    const missingReg=regs.filter(r=>!dict.includes(r));
    ok(missingReg.length===0,'every regulation_type value is listed on /data/'+(missingReg.length?' ('+missingReg.join(' | ')+')':''));
  }

  // a lastmod in the future is one Google discards, taking the file's real date with it
  const badMod=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8')
    .matchAll(/<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)]
    .filter(m=>m[2]>today).map(m=>m[1].replace(BASE,'')+' ('+m[2]+')');
  ok(badMod.length===0,'no sitemap lastmod is in the future'+(badMod.length?' ('+badMod.slice(0,3).join(', ')+')':''));
}

console.log('');
console.log(passes+' passed, '+fails.length+' failed');
if(fails.length){console.log('FAILED:',fails.join(' | '));process.exit(1)}
console.log('ALL FLOWS PASS ✓');
process.exit(0);
})();
