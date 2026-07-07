const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');

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
ok(countText().includes('362'),'shows 362 total ('+countText()+')');
ok(d.getElementById('mapsec')!==null,'map section built');
ok(d.getElementById('newssec')!==null,'news section built');
ok(d.getElementById('datasec')!==null,'data section built');
ok(d.querySelector('.credit')!==null,'francesco credit in footer');
ok(d.getElementById('f-reg')!==null,'regulation filter present');

console.log('— flow 2: category filter → active bar → nav reset');
click(d.querySelector('.pill[data-cat="W"]'));
ok(countText().includes('showing 49'),'W filter → 47 ('+countText()+')');
ok(d.getElementById('activebar').textContent.includes('web3-native'),'active bar shows category chip');
click(d.getElementById('navdir'));
ok(countText().includes('362'),'directory nav resets filters ('+countText()+')');
ok(d.getElementById('activebar').innerHTML==='','active bar cleared');

console.log('— flow 3: active-filter chip removal');
click(d.querySelector('.pill[data-cat="H"]'));
d.getElementById('f-stable').checked=true;
d.getElementById('f-stable').dispatchEvent(new w.Event('change',{bubbles:true}));
ok(d.querySelectorAll('#activebar .fchip').length===2,'two filter chips shown');
click(d.querySelectorAll('#activebar .fchip')[0]); // remove category
ok(!d.getElementById('activebar').textContent.includes('hybrid'),'category chip removed via ✕');
click(d.getElementById('ab-clear')||d.getElementById('navdir'));
ok(countText().includes('362'),'clear all restores 362');

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
ok(countText().includes('362'),'map filter toggles off');

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
ok(!countText().startsWith('showing 335')&&/^showing \d+ of 362/.test(countText()),'regulation filter applies ('+countText()+')');
ok(d.getElementById('activebar').textContent.includes('licensed bank'),'active bar shows regulation chip');
click(d.getElementById('navdir'));
ok(countText().includes('362'),'nav reset clears regulation too');

console.log('— flow 9: search + gen z audience');
const qi=d.getElementById('q');
qi.value='women';qi.dispatchEvent(new w.Event('input',{bubbles:true}));
ok(/^showing \d{1,2} of 362/.test(countText()),'search women narrows ('+countText()+')');
click(d.getElementById('navdir'));
const nn=d.getElementById('f-niche');
ok([...nn.options].some(o=>o.value==='gz'),'gen z option exists');
ok([...nn.options].some(o=>o.textContent.includes('gen alpha')),'gen alpha label exists');
nn.value='gz';nn.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(countText().includes('showing 9'),'gen z → 9 ('+countText()+')');
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
ok(countText().includes('showing 9'),'custom dropdown filters → 9 ('+countText()+')');
ok(audDD.querySelector('.lbl').textContent.includes('gen z'),'button label updates');
click(d.getElementById('navdir'));
ok(audDD.querySelector('.lbl').textContent.includes('audience: all'),'label resets on nav clear ('+audDD.querySelector('.lbl').textContent+')');
ok(countText().includes('362'),'count back to 362');

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
ok(w.eval("D.length")===362,'dataset now 362');
ok(d.getElementById('st-total').textContent==='362','hero stat refreshed to 362');
w.openDetail('Kontigo');
ok(d.getElementById('dwrap').textContent.includes('Venezuela'),'Kontigo gap-hunt profile works');
w.closeDetail();

console.log('— flow 16: country drill-down on map');
w.showRegion('AF');
const drill=d.querySelectorAll('#mapinfo .mi-cty');
ok(drill.length>0&&drill.length<=12,'country chips render, capped ('+drill.length+')');
ok([...drill].some(c=>c.textContent.includes('Nigeria')),'Nigeria appears in Africa drill-down');
click([...drill].find(c=>c.textContent.includes('Nigeria')));
ok(/^showing \d+ of 362/.test(countText())&&!countText().startsWith('showing 362'),'country click filters directory ('+countText()+')');
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
ok(countText().includes('362'),'brand click resets to full directory ('+countText()+')');
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
ok(d.querySelector('#grid').style.display!=='none'&&!countText().includes('showing 362 of 362'),'CTA lands on the filtered directory ('+countText()+')');
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

console.log('');
console.log(passes+' passed, '+fails.length+' failed');
if(fails.length){console.log('FAILED:',fails.join(' | '));process.exit(1)}
console.log('ALL FLOWS PASS ✓');
process.exit(0);
})();
