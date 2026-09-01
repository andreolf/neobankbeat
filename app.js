
/* ── data ─────────────────────────────────────────────────────────
[name, cat, region, hq, founded, custody, network, cardType, cashback, yield, stables, kyc, niche, domain, note]
cat: T/H/W · custody: C=Custodial S=Self-custodial M=MPC self-custodial X=Mixed
kyc: Y / N / CO (card only) · niche codes in NICHE map
────────────────────────────────────────────────────────────────── */
/* ── boot render coalescing ──
   the layers below re-wrap render() and call it ~10× while booting, each pass
   rebuilding the full 368-card grid. The grid is invisible until .booted, so
   during boot the base render marks itself dirty and returns; the final script
   flips the flag and runs the fully-wrapped chain exactly once. */
window.__nbBoot=true;window.__nbDirty=false;
const NICHE={g:"general",w:"women",k:"teens & youth",i:"immigrants & migrants",b:"Black community",l:"LGBTQ+",f:"freelancers & creators",s:"SMB & startups",gg:"gig workers",sr:"seniors",md:"healthcare pros",ds:"disabilities",fb:"faith-based",tr:"travel & digital nomads",cl:"climate",ub:"underbanked"};
const CUST={C:"Custodial",S:"Self-custodial",M:"MPC self-custodial",X:"Mixed (fiat custodial + self-custody crypto)"};
const KYC={Y:"Yes",N:"No",CO:"Card only"};
const D=[
/* ══ TRADITIONAL · US ══ */
["Chime","T","US","San Francisco, US",2013,"C","Visa","Debit","—","~2% APY savings",0,"Y","g","chime.com","Largest US neobank; 20M+ members; SpotMe overdraft."],
["Varo","T","US","San Francisco, US",2015,"C","Visa","Debit","—","Up to 5% APY (conditions)",0,"Y","g","varomoney.com","First US consumer fintech with a national bank charter."],
["Current","T","US","New York, US",2015,"C","Visa","Debit","Points","~4% savings pods",0,"Y","g","current.com","Everyday + teen banking; in-app crypto trading."],
["SoFi","T","US","San Francisco, US",2011,"C","Visa/MC","Debit","—","Up to ~4.5% APY (tiers)",1,"Y","g","sofi.com","Bank charter; launched SoFiUSD stablecoin Dec 2025."],
["Ally Bank","T","US","Detroit, US",2009,"C","MC","Debit","—","Competitive online savers",0,"Y","g","ally.com","Largest US digital-only bank; 3M+ customers."],
["Dave","T","US","Los Angeles, US",2016,"C","Visa","Debit","—","—",0,"Y","g","dave.com","ExtraCash advances; budgeting-first."],
["MoneyLion","T","US","New York, US",2013,"C","Visa","Debit","—","—",0,"Y","g","moneylion.com","Banking + investing + credit-builder super-app."],
["One","T","US","Sacramento, US",2019,"C","Visa","Debit","Up to 3% (Walmart)","~4% APY savings",0,"Y","g","one.app","Walmart-backed; embedded retail banking."],
["Marcus","T","US","New York, US",2016,"C","—","Savings only","—","Competitive savers",0,"Y","g","marcus.com","Goldman Sachs' consumer digital bank."],
["Step","T","US","Palo Alto, US",2018,"C","Visa","Debit + credit builder","—","~4% savings goals",0,"Y","k","step.com","Teen banking + credit building, no fees."],
["Greenlight","T","US","Atlanta, US",2014,"C","MC","Debit","1% (plan)","Up to 5% savings (plan)",0,"Y","k","greenlight.com","Family banking; chores + parental controls."],
["Copper","T","US","Seattle, US",2019,"C","MC","Debit","—","—",0,"Y","k","getcopper.com","Teen banking + financial literacy."],
["Till Financial","T","US","Boston, US",2018,"C","Visa","Debit","—","—",0,"Y","k","tillfinancial.io","Family banking for kids' smart spending."],
["GoHenry","T","US","New York/London",2012,"C","Visa/MC","Debit","—","—",0,"Y","k","gohenry.com","Kids' money app; acquired by Acorns."],
["Albert","T","US","Culver City, US",2015,"C","MC","Debit","Offers","—",0,"Y","g","albert.com","Automated savings + 'Genius' advice."],
["Mercury","T","US","San Francisco, US",2017,"C","MC","Business debit + credit","1.5% (IO card)","Treasury yield",0,"Y","s","mercury.com","Startup banking; 200K+ companies."],
["Brex","T","US","San Francisco, US",2017,"C","MC","Corporate credit","Points","Yield on idle cash",0,"Y","s","brex.com","Corporate cards + banking for startups."],
["Ramp","T","US","New York, US",2019,"C","Visa","Corporate card","1.5%","Treasury yield",0,"Y","s","ramp.com","Spend management + business accounts."],
["Novo","T","US","Miami, US",2016,"C","MC","Business debit","—","—",0,"Y","s","novo.co","SMB checking for small operators."],
["Bluevine","T","US","Redwood City, US",2013,"C","MC","Business debit","—","~2% APY checking",0,"Y","s","bluevine.com","SMB checking + credit lines."],
["Relay","T","US","Toronto/US",2018,"C","Visa","Business debit","—","Yield on savings",0,"Y","s","relayfi.com","Multi-account SMB banking (Profit First)."],
["NorthOne","T","US","New York, US",2016,"C","MC","Business debit","—","—",0,"Y","s","northone.com","SMB banking for main-street businesses."],
["Rho","T","US","New York, US",2018,"C","MC","Corporate card","Up to 1.75%","Treasury",0,"Y","s","rho.co","Corporate banking + spend platform."],
["Grasshopper","T","US","New York, US",2019,"C","Visa","Business debit","1%","Competitive APY",0,"Y","s","grasshopper.bank","Chartered digital bank for startups + SMBs."],
["Found","T","US","San Francisco, US",2019,"C","MC","Business debit","—","—",0,"Y","f","found.com","Banking + taxes for the self-employed."],
["Lili","T","US","New York, US",2018,"C","Visa","Business debit","—","~Savings APY (plan)",0,"Y","f","lili.co","Freelancer banking with tax buckets."],
["Karat","T","US","Los Angeles, US",2019,"C","Visa","Business card","Creator perks","—",0,"Y","f","trykarat.com","Financial services built for creators."],
["Branch","T","US","Minneapolis, US",2015,"C","Visa","Debit","—","—",0,"Y","gg","branchapp.com","Instant pay + wallets for gig/hourly workers."],
["Panacea Financial","T","US","Little Rock, US",2020,"C","Visa","Debit + credit","—","—",0,"Y","md","panaceafinancial.com","Banking for doctors, dentists, vets."],
["Purple","T","US","New York, US",2018,"C","MC","Debit","—","—",0,"Y","ds","withpurple.com","Banking for people with disabilities; ABLE-friendly."],
["True Link","T","US","San Francisco, US",2012,"C","Visa","Prepaid","—","—",0,"Y","sr","truelinkfinancial.com","Cards protecting seniors + vulnerable adults."],
["Charlie","T","US","Los Angeles, US",2022,"C","Visa","Debit","—","Early Social Security access",0,"Y","sr","charliefinancial.com","Banking built for the 62+ community."],
["Greenwood","T","US","Atlanta, US",2020,"C","MC","Debit","—","—",0,"Y","b","gogreenwood.com","Digital banking for Black + Latino communities."],
["MoCaFi","T","US","New York, US",2016,"C","MC","Debit","—","—",0,"Y","b","mocafi.com","Closing the racial wealth gap via public-sector rails."],
["Majority","T","US","Houston, US",2019,"C","Visa","Debit","—","—",0,"Y","i","majority.com","$5.99/mo membership banking for migrants; no SSN needed."],
["Zolve","T","US","New York/Bengaluru",2020,"C","MC","Credit + debit","Rewards","—",0,"Y","i","zolve.com","US credit for arriving immigrants (IN→US corridor)."],
["Comun","T","US","New York, US",2021,"C","Visa","Debit","—","—",0,"Y","i","comun.app","Banking for Latino immigrants; passport onboarding."],
["Ellevest","T","US","New York, US",2014,"C","—","Investing + banking","—","—",0,"Y","w","ellevest.com","Women-first investing platform with banking roots."],
["First Women's Bank","T","US","Chicago, US",2021,"C","MC","Business banking","—","—",0,"Y","w","firstwomens.bank","Women-founded, women-led chartered bank for women-owned SMBs."],
/* ══ TRADITIONAL · CANADA ══ */
["KOHO","T","Canada","Toronto, CA",2014,"C","MC","Prepaid","Up to 2%","Up to ~4% interest",0,"Y","g","koho.ca","Canada's leading prepaid neobank; credit building."],
["Neo Financial","T","Canada","Calgary, CA",2019,"C","MC","Credit + savings","~5% at partners","~3-4% savings",0,"Y","g","neofinancial.com","Partner-merchant cashback network."],
["Wealthsimple","T","Canada","Toronto, CA",2014,"C","MC","Prepaid","1%","~4% on cash (tiers)",0,"Y","g","wealthsimple.com","Investing-first; custodial crypto trading."],
["EQ Bank","T","Canada","Toronto, CA",2016,"C","MC","Prepaid","0.5%","~4% everyday interest",0,"Y","g","eqbank.ca","Digital arm of Equitable Bank."],
["Mogo","H","Canada","Vancouver, CA",2003,"C","Visa","Prepaid","BTC cashback","—",0,"Y","g","mogo.ca","Prepaid + custodial bitcoin rewards."],
/* ══ TRADITIONAL · UK ══ */
["Monzo","T","UK","London, UK",2015,"C","MC","Debit","—","~4% savings pots",0,"Y","g","monzo.com","12M+ customers; UK license; US expansion."],
["Starling Bank","T","UK","London, UK",2014,"C","MC","Debit","—","~3-4% on balances",0,"Y","g","starlingbank.com","Profitable; Engine SaaS platform."],
["Atom Bank","T","UK","Durham, UK",2014,"C","—","Savings + mortgages","—","Competitive fixed savers",0,"Y","g","atombank.co.uk","App-only bank, no card."],
["Zopa Bank","T","UK","London, UK",2020,"C","Visa","Credit","—","~4-5% savings",0,"Y","g","zopa.com","P2P pioneer turned licensed bank."],
["Chase UK","T","UK","London, UK",2021,"C","Visa","Debit","1%","~4-5% saver",0,"Y","g","chase.co.uk","JPMorgan's UK digital bank."],
["Kroo","T","UK","London, UK",2016,"C","MC","Debit","—","~4% on balances",0,"Y","g","kroo.com","Licensed UK bank; social features."],
["Tide","T","UK","London, UK",2015,"C","MC","Business debit","Cashback (plan)","—",0,"Y","s","tide.co","1M+ SME members (UK + India)."],
["ANNA Money","T","UK","Cardiff, UK",2017,"C","MC","Business debit","1% select","—",0,"Y","s","anna.money","SME banking with AI admin assistant."],
["OakNorth","T","UK","London, UK",2015,"C","—","SMB lending + savers","—","Competitive savers",0,"Y","s","oaknorth.co.uk","Profitable SMB lender-bank."],
["Allica Bank","T","UK","Milton Keynes, UK",2019,"C","MC","Business","—","Rewards account",0,"Y","s","allica.bank","Established-SMB challenger bank."],
["Curve","T","UK","London, UK",2015,"C","MC","Card aggregator","1% select","—",0,"Y","g","curve.com","All cards in one; go-back-in-time."],
["Zempler Bank","T","UK","London, UK",2005,"C","MC","Business debit","—","—",0,"Y","s","zemplerbank.com","Formerly Cashplus; SME-focused."],
["Monese","T","UK","London, UK",2013,"C","MC","Debit","—","—",0,"Y","i","monese.com","No-credit-history onboarding; consumer app scaled back to B2B (XYB)."],
["Pockit","T","UK","London, UK",2014,"C","MC","Prepaid","—","—",0,"Y","ub","pockit.com","Accounts for the underbanked; absorbed Monese users."],
["Suits Me","T","UK","Cheshire, UK",2015,"C","MC","Debit","Retail cashback","—",0,"Y","ub","suitsmecard.com","No-credit-check accounts for excluded workers."],
["Tandem Bank","T","UK","London, UK",2013,"C","—","Savings + green loans","—","Competitive savers",0,"Y","cl","tandem.co.uk","Green digital bank; home-efficiency lending."],
["Algbra","T","UK","London, UK",2020,"C","MC","Debit","Ethical rewards","—",0,"Y","fb","algbra.com","Shariah-aligned, ethics-first UK fintech."],
["Kestrl","T","UK","London, UK",2019,"C","—","Money app","—","Halal savings",0,"Y","fb","kestrl.io","Muslim money app; UK + Malaysia."],
["Wahed","T","US/UK","New York, US",2015,"C","Visa","Debit (US)","—","Halal portfolios",0,"Y","fb","wahed.com","Halal investing + banking features."],
/* ══ TRADITIONAL · EUROPE ══ */
["N26","T","Europe","Berlin, DE",2013,"C","MC","Debit","—","~2-4% (region)",0,"Y","g","n26.com","8M+ customers; crypto via partner in some markets."],
["bunq","T","Europe","Amsterdam, NL",2012,"C","MC","Debit","1% (plan)","Up to ~3.4% interest",0,"Y","g","bunq.com","EU-wide; API-first; 'Bank of The Free'."],
["Vivid Money","T","Europe","Berlin, DE",2019,"C","Visa","Debit","Up to 3% (tiers)","~4% (tiers)",0,"Y","g","vivid.money","Cashback + investing; custodial crypto."],
["Tomorrow","T","Europe","Hamburg, DE",2018,"C","Visa","Debit","—","—",0,"Y","cl","tomorrow.one","Climate-positive spending."],
["C24 Bank","T","Europe","Frankfurt, DE",2020,"C","MC","Debit","—","Interest on balance",0,"Y","g","c24.de","CHECK24's digital bank."],
["Kontist","T","Europe","Berlin, DE",2016,"C","Visa","Business debit","—","—",0,"Y","f","kontist.com","Freelancer banking with auto tax buckets."],
["Fyrst","T","Europe","Bonn, DE",2019,"C","Visa","Business debit","—","—",0,"Y","s","fyrst.de","Deutsche Bank's SMB digital brand."],
["Qonto","T","Europe","Paris, FR",2016,"C","MC","Business debit","—","—",0,"Y","s","qonto.com","500K+ SME clients across FR/DE/ES/IT."],
["Shine","T","Europe","Paris, FR",2017,"C","MC","Business debit","—","—",0,"Y","f","shine.fr","Freelancer banking (Société Générale)."],
["Indy","T","Europe","Lyon, FR",2016,"C","MC","Business account","—","—",0,"Y","f","indy.fr","Freelancer accounting + banking."],
["Sumeria (Lydia)","T","Europe","Paris, FR",2013,"C","Visa","Debit","—","~2-4% on balance",0,"Y","g","sumeria.eu","France's P2P leader turned full account."],
["Nickel","T","Europe","Paris, FR",2014,"C","MC","Debit","—","—",0,"Y","ub","nickel.eu","Open an account at the tabac; 4M+ across FR/ES/BE/PT/DE."],
["BoursoBank","T","Europe","Paris, FR",1995,"C","Visa","Debit + credit","—","Competitive savers",0,"Y","g","boursobank.com","France's largest online bank; 7M+ (SocGen)."],
["Hello bank!","T","Europe","Paris, FR",2013,"C","Visa","Debit","—","—",0,"Y","g","hellobank.fr","BNP Paribas' digital bank."],
["Fortuneo","T","Europe","Brest, FR",2000,"C","MC","Debit + credit","—","Savers + brokerage",0,"Y","g","fortuneo.fr","Crédit Mutuel Arkéa's online bank."],
["Lunar","T","Europe","Aarhus, DK",2015,"C","Visa","Debit","—","~3-4% (tiers)",0,"Y","g","lunar.app","Nordic neobank (DK/SE/NO)."],
["Northmill","T","Europe","Stockholm, SE",2006,"C","MC","Debit","Cashback offers","Savings",0,"Y","g","northmill.com","Swedish licensed digital bank."],
["Rocker","T","Europe","Stockholm, SE",2017,"C","MC","Debit","—","Savings",0,"Y","g","rocker.com","Swedish challenger; pay + save + loans."],
["indó","T","Europe","Reykjavík, IS",2018,"C","MC","Debit","—","Competitive ISK savers",0,"Y","g","indo.is","Iceland's first neobank."],
["Hype","T","Europe","Milan, IT",2015,"C","MC","Debit","Offers","—",0,"Y","g","hype.it","One of Italy's largest neobanks (Banca Sella)."],
["Tinaba","T","Europe","Milan, IT",2015,"C","MC","Debit","—","—",0,"Y","g","tinaba.com","Italian money app with Banca Profilo."],
["Flowe","T","Europe","Milan, IT",2020,"C","MC","Debit (wooden card)","—","—",0,"Y","cl","flowe.com","Banca Mediolanum's green digital bank."],
["buddybank","T","Europe","Milan, IT",2018,"C","MC","Debit","—","—",0,"Y","g","buddybank.com","UniCredit's iPhone-native bank."],
["isybank","T","Europe","Milan, IT",2023,"C","MC","Debit","—","—",0,"Y","g","isybank.com","Intesa Sanpaolo's cloud-native digital bank."],
["Openbank","T","Europe","Madrid, ES",1995,"C","Visa/MC","Debit","—","Competitive savers",0,"Y","g","openbank.es","Santander's digital bank; now US/MX too."],
["imagin","T","Europe","Barcelona, ES",2020,"C","Visa","Debit","—","—",0,"Y","k","imagin.com","CaixaBank's youth-first money app."],
["MyInvestor","T","Europe","Madrid, ES",2017,"C","Visa","Debit","—","Competitive savers + funds",0,"Y","g","myinvestor.es","Andbank's digital bank + broker."],
["ZEN.com","T","Europe","Vilnius, LT",2018,"C","MC","Debit","Up to 1.5%","—",0,"Y","g","zen.com","EU e-money; multicurrency + merchant tools."],
["Paysera","T","Europe","Vilnius, LT",2004,"C","Visa","Debit","—","—",0,"Y","g","paysera.com","Baltic multicurrency veteran."],
["Trade Republic","T","Europe","Berlin, DE",2015,"C","Visa","Debit","1% saveback","~ECB rate on cash",0,"Y","g","traderepublic.com","Broker with full bank license; custodial crypto."],
["Finom","T","Europe","Amsterdam, NL",2019,"C","Visa","Business debit","Up to 3%","—",0,"Y","s","finom.co","SMB/freelancer banking across the EU."],
["Wise","T","Europe","London, UK",2011,"C","Visa/MC","Debit","—","Interest on balances (region)",0,"Y","tr","wise.com","Mid-market-rate FX; 16M+ customers."],
["Klarna","T","Europe","Stockholm, SE",2005,"C","Visa","Debit + BNPL","Rewards club","Savings (region)",0,"Y","g","klarna.com","BNPL giant with full banking accounts."],
["Salt Bank","T","Europe","Bucharest, RO",2024,"C","Visa","Debit","—","Competitive RON savers",0,"Y","g","salt.bank","Romania's first neobank (Banca Transilvania)."],
["Snappi","T","Europe","Athens, GR",2024,"C","Visa","Debit","—","—",0,"Y","g","snappi.com","Greek neobank (Piraeus-backed)."],
["Papara","T","Europe","Istanbul, TR",2016,"C","MC","Prepaid","Cashback offers","—",0,"Y","g","papara.com","17M+ users; Turkey's leading fintech."],
["Enpara","T","Europe","Istanbul, TR",2012,"C","MC","Debit","—","Competitive TRY savers",0,"Y","g","enpara.com","QNB's fee-free digital bank."],
["Monobank","T","Europe","Kyiv, UA",2017,"C","MC","Debit + credit","Cashback categories","Deposits",0,"Y","g","monobank.ua","8M+ customers; Ukraine's app-first bank."],
["T-Bank","T","Europe","Moscow, RU",2006,"C","MC (dom.)","Debit + credit","Cashback categories","Deposits",0,"Y","g","tbank.ru","Ex-Tinkoff; 40M+ customers, one of the largest standalone neobanks."],
["Kaspi","T","Europe","Almaty, KZ",2012,"C","MC","Debit + credit","In-app offers","Deposits",0,"Y","g","kaspi.kz","Kazakh super-app: payments + marketplace + fintech."],
["Uzum","T","Europe","Tashkent, UZ",2022,"C","MC (dom.)","Debit","In-app offers","—",0,"Y","g","uzum.uz","Uzbekistan's super-app + digital bank."],
["TBC UZ","T","Europe","Tashkent, UZ",2020,"C","MC","Debit","—","Deposits",0,"Y","g","tbcbank.uz","TBC's Uzbek digital bank; 20M+ registered."],
/* ══ TRADITIONAL · LATAM ══ */
["Nubank","T","LatAm","São Paulo, BR",2013,"C","MC","Credit + debit","—","~100% CDI",0,"Y","g","nubank.com.br","131M customers (FY25); custodial crypto; US OCC conditional approval."],
["Ualá","T","LatAm","Buenos Aires, AR",2017,"C","MC","Prepaid + credit","—","Remunerated account",1,"Y","g","uala.com.ar","AR/MX/CO; added crypto + dollar features."],
["Plata","T","LatAm","Mexico City, MX",2023,"C","MC","Credit + debit","Cashback","Interest on deposits",0,"Y","g","platacard.mx","Ex-Tinkoff team; fastest digital bank ever to $600M annualized revenue — full Mexican license as Banco Plata (Mar 2026), 3.5M+ credit-card customers."],
["albo","T","LatAm","Mexico City, MX",2016,"C","MC","Debit","—","—",0,"Y","g","albo.mx","One of Mexico's first challengers."],
["Klar","T","LatAm","Mexico City, MX",2019,"C","MC","Debit + credit","Up to 4%","Cetes-linked yield",0,"Y","g","klar.mx","Mexican credit-led neobank."],
["Stori","T","LatAm","Mexico City, MX",2018,"C","MC","Credit","—","Yield account",0,"Y","ub","storicard.com","Credit inclusion for underbanked Mexico; 3M+."],
["Fondeadora","T","LatAm","Mexico City, MX",2018,"C","MC","Debit","—","Yield",0,"Y","g","fondeadora.com","Mexican digital account."],
["Hey Banco","T","LatAm","Monterrey, MX",2018,"C","MC","Debit","Cashback","Yield",0,"Y","g","heybanco.com","Banregio's digital bank."],
["Cuenca","T","LatAm","Mexico City, MX",2018,"C","MC","Debit","—","—",0,"Y","g","cuenca.com","Mexican mobile-first account."],
["RappiPay","T","LatAm","Bogotá, CO",2019,"C","Visa","Debit + credit","In-app cashback","—",0,"Y","g","rappi.com","Banking inside the Rappi super-app."],
["Neon","T","LatAm","São Paulo, BR",2016,"C","Visa","Debit + credit","—","CDI-linked",0,"Y","g","neon.com.br","Brazilian mass-market neobank."],
["C6 Bank","T","LatAm","São Paulo, BR",2019,"C","MC","Debit + credit","Átomos points","CDI-linked",0,"Y","g","c6bank.com.br","JPMorgan-backed full digital bank."],
["Banco Inter","T","LatAm","Belo Horizonte, BR",2015,"C","MC","Debit + credit","1% (plan)","CDI-linked",0,"Y","g","inter.co","35M+ clients; super-app + US account."],
["PicPay","T","LatAm","São Paulo, BR",2012,"C","Visa","Debit + credit","In-app cashback","CDI-linked",1,"Y","g","picpay.com","Brazil's largest payments app; crypto + BRL stable rails."],
["PagBank","T","LatAm","São Paulo, BR",2019,"C","Visa","Debit + credit","—","CDI-linked",0,"Y","g","pagbank.com.br","PagSeguro's 30M+ user digital bank."],
["Cora","T","LatAm","São Paulo, BR",2019,"C","Visa","Business debit","—","—",0,"Y","s","cora.com.br","SMB banking for Brazilian PJs."],
["NG.cash","T","LatAm","Rio de Janeiro, BR",2021,"C","MC","Debit","—","—",1,"Y","k","ng.cash","Teen neobank; added crypto features."],
["Naranja X","T","LatAm","Córdoba, AR",2019,"C","Visa/MC","Debit + credit","—","Remunerated account",0,"Y","g","naranjax.com","Argentina's card giant gone digital."],
["Brubank","T","LatAm","Buenos Aires, AR",2017,"C","Visa","Debit","—","Remunerated account",0,"Y","g","brubank.com","First licensed digital bank in Argentina."],
["Prex","T","LatAm","Montevideo, UY",2015,"C","MC","Prepaid","—","—",0,"Y","g","prexcard.com","Regional prepaid (UY/AR/PE)."],
["ueno bank","T","LatAm","Asunción, PY",2021,"C","Visa","Debit + credit","—","Deposits",0,"Y","g","ueno.com.py","Paraguay's fast-growing digital bank."],
["Nequi","T","LatAm","Medellín, CO",2016,"C","Visa","Debit","—","—",0,"Y","g","nequi.com.co","Bancolombia's wallet-bank; 20M+."],
["Daviplata","T","LatAm","Bogotá, CO",2011,"C","—","Wallet","—","—",0,"Y","ub","daviplata.com","Davivienda's mass-market wallet; 18M+."],
["Movii","T","LatAm","Bogotá, CO",2018,"C","MC","Prepaid","—","—",0,"Y","ub","movii.com.co","Colombian financial inclusion player."],
["Lulo Bank","T","LatAm","Bogotá, CO",2021,"C","Visa","Debit","—","Yield account",0,"Y","g","lulobank.com","Colombia's first fully digital licensed bank."],
["Tenpo","T","LatAm","Santiago, CL",2017,"C","MC","Prepaid + credit","Offers","—",1,"Y","g","tenpo.cl","Chilean neobank; crypto + USDC features."],
["Global66","T","LatAm","Santiago, CL",2018,"C","MC","Debit","—","Yield (region)",0,"Y","tr","global66.com","Cross-border multicurrency for LatAm."],
["Zinli","T","LatAm","Panama City, PA",2020,"C","Visa","Prepaid","—","—",0,"Y","g","zinli.com","Digital dollars for Panama + region."],
["Qik","T","LatAm","Santo Domingo, DO",2021,"C","MC","Debit","Cashback","—",0,"Y","g","qik.com.do","Dominican Republic's first neobank."],
/* ══ TRADITIONAL · ASIA ══ */
["KakaoBank","T","Asia","Seongnam, KR",2016,"C","—","Debit","—","Competitive KRW savers",0,"Y","g","kakaobank.com","Korea's messaging-native bank; 23M+."],
["Toss Bank","T","Asia","Seoul, KR",2021,"C","—","Debit","—","Daily-interest account",0,"Y","g","tossbank.com","Part of the Toss super-app."],
["K bank","T","Asia","Seoul, KR",2016,"C","—","Debit","—","Competitive savers",0,"Y","g","kbanknow.com","Korea's first internet-only bank; Upbit ties."],
["WeBank","T","Asia","Shenzhen, CN",2014,"C","—","Digital lending","—","—",0,"Y","g","webank.com","Tencent-backed; world's largest digital bank by users."],
["MYbank","T","Asia","Hangzhou, CN",2015,"C","—","SME lending","—","—",0,"Y","s","mybank.cn","Ant Group's SME digital bank."],
["Jupiter","T","Asia","Mumbai, IN",2019,"C","Visa","Debit","1%","—",0,"Y","g","jupiter.money","Indian neobank on Federal Bank rails."],
["Niyo","T","Asia","Bengaluru, IN",2015,"C","Visa","Debit + forex","—","—",0,"Y","tr","goniyo.com","Zero-forex travel banking for Indians."],
["slice","T","Asia","Bengaluru, IN",2016,"C","Visa","Card + UPI","Up to 2%","—",0,"Y","g","sliceit.com","Merged with a small finance bank."],
["Freo","T","Asia","Bengaluru, IN",2015,"C","MC","Card + savings","Rewards","Savings",0,"Y","g","freo.money","Credit-led Indian neobank."],
["Open","T","Asia","Bengaluru, IN",2017,"C","Visa","Business","—","—",0,"Y","s","open.money","SME neobanking platform; 3M+ businesses."],
["RazorpayX","T","Asia","Bengaluru, IN",2019,"C","Visa","Business","—","—",0,"Y","s","razorpay.com","Business banking inside Razorpay."],
["FamPay","T","Asia","Bengaluru, IN",2019,"C","RuPay","Prepaid","Rewards","—",0,"Y","k","fampay.in","India's teen payments app."],
["Mahila Money","T","Asia","Delhi, IN",2021,"C","RuPay","Prepaid + loans","—","—",0,"Y","w","mahila.money","Neobank for Indian women entrepreneurs."],
["Airtel Payments Bank","T","Asia","Delhi, IN",2017,"C","MC","Debit","—","Interest on wallet",0,"Y","ub","airtel.in","Telco-led payments bank."],
["Jio Payments Bank","T","Asia","Mumbai, IN",2018,"C","RuPay","Debit","—","—",0,"Y","ub","jiopaymentsbank.com","Reliance's payments bank."],
["SadaPay","T","Asia","Karachi, PK",2019,"C","MC","Debit","—","—",0,"Y","g","sadapay.pk","Pakistan's design-led neobank."],
["NayaPay","T","Asia","Karachi, PK",2019,"C","Visa","Debit","—","—",0,"Y","g","nayapay.com","Pakistani money app + SMB rails."],
["Oraan","T","Asia","Karachi, PK",2018,"C","—","Savings committees","—","Committee-based savings",0,"Y","w","oraan.com","Women-first fintech digitizing ROSCAs."],
["bKash","T","Asia","Dhaka, BD",2011,"C","—","Wallet","—","—",0,"Y","ub","bkash.com","Bangladesh's mobile money giant; 70M+."],
["Nagad","T","Asia","Dhaka, BD",2019,"C","—","Wallet","—","—",0,"Y","ub","nagad.com.bd","Postal-linked mobile money."],
["GXS Bank","T","Asia","Singapore, SG",2022,"C","—","Savings + lending","—","Daily interest pockets",0,"Y","g","gxs.com.sg","Grab + Singtel digital bank."],
["MariBank","T","Asia","Singapore, SG",2022,"C","—","Savings + invest","—","Daily interest",0,"Y","g","maribank.sg","Sea Group's digital bank."],
["Trust Bank","T","Asia","Singapore, SG",2022,"C","Visa","Debit + credit","Linkpoints","Competitive savers",0,"Y","g","trustbank.sg","StanChart + FairPrice; 1M+ users."],
["ANEXT Bank","T","Asia","Singapore, SG",2022,"C","—","SME banking","—","—",0,"Y","s","anext.com.sg","Ant-backed SME wholesale digital bank."],
["Tonik","T","Asia","Manila, PH",2018,"C","MC","Debit","—","Up to 6% time deposits",0,"Y","g","tonikbank.com","First PH neobank license."],
["Maya","T","Asia","Manila, PH",2022,"C","Visa","Debit","Missions","Up to ~10% promo savings",1,"Y","g","maya.ph","PH super-app; regulated custodial crypto."],
["GoTyme Bank","T","Asia","Manila, PH",2022,"C","Visa","Debit","Rewards","~4-5% savings",0,"Y","g","gotyme.com.ph","Tyme + Gokongwei; kiosk onboarding."],
["UnionDigital","T","Asia","Manila, PH",2022,"C","—","Digital bank","—","Deposits",0,"Y","g","uniondigitalbank.io","UnionBank's digital-bank arm."],
["UNO Digital Bank","T","Asia","Manila, PH",2021,"C","MC","Debit","—","High-yield savers",0,"Y","g","uno.bank","Full-spectrum PH digital bank."],
["Bank Jago","T","Asia","Jakarta, ID",2020,"C","Visa","Debit","—","Yield pockets",0,"Y","g","jago.com","GoTo-ecosystem digital bank."],
["SeaBank","T","Asia","Jakarta, ID",2021,"C","—","Savings","—","Daily interest",0,"Y","g","seabank.co.id","Sea Group's Indonesian bank; Shopee-linked."],
["Blu by BCA","T","Asia","Jakarta, ID",2021,"C","MC","Debit","—","Savers",0,"Y","g","blubybcadigital.co.id","BCA's digital-native brand."],
["Allo Bank","T","Asia","Jakarta, ID",2021,"C","MC","Debit","—","Savers",0,"Y","g","allobank.com","CT Corp's digital bank."],
["Superbank","T","Asia","Jakarta, ID",2023,"C","—","Savings + lending","—","Competitive savers",0,"Y","g","superbank.id","Grab/Emtek/Singtel-backed."],
["Jenius","T","Asia","Jakarta, ID",2016,"C","Visa","Debit","—","Flexi saver",0,"Y","g","jenius.com","BTPN's pioneer digital bank."],
["LINE BK","T","Asia","Bangkok, TH",2020,"C","Visa","Debit","—","Special-rate savers",0,"Y","g","linebk.com","LINE x KBank social banking."],
["Timo","T","Asia","Ho Chi Minh, VN",2015,"C","Visa","Debit","—","Goal savers",0,"Y","g","timo.vn","Vietnam's first digital bank brand."],
["Cake","T","Asia","Ho Chi Minh, VN",2021,"C","Visa","Debit","Cashback","Competitive savers",0,"Y","g","cake.vn","VPBank + Be Group; 5M+ users."],
["TNEX","T","Asia","Hanoi, VN",2020,"C","—","Debit","—","—",0,"Y","g","tnex.com.vn","MSB's Gen-Z digital bank."],
["GXBank","T","Asia","Kuala Lumpur, MY",2023,"C","MC","Debit","—","Daily interest",0,"Y","g","gxbank.my","Grab-led; Malaysia's first digital bank live."],
["AEON Bank","T","Asia","Kuala Lumpur, MY",2023,"C","Visa","Debit","AEON points","Islamic savers",0,"Y","fb","aeonbank.com.my","Malaysia's first Islamic digital bank."],
["Boost Bank","T","Asia","Kuala Lumpur, MY",2024,"C","—","Savings","—","Daily interest",0,"Y","g","myboost.co","Axiata's digital bank."],
["Ryt Bank","T","Asia","Kuala Lumpur, MY",2025,"C","—","AI banking","—","Savers",0,"Y","g","rytbank.my","YTL+Sea AI-first digital bank."],
["PayPay Bank","T","Asia","Tokyo, JP",2000,"C","Visa","Debit","PayPay points","—",0,"Y","g","paypay-bank.co.jp","SoftBank ecosystem bank (ex-Japan Net Bank)."],
["Minna Bank","T","Asia","Fukuoka, JP",2021,"C","Visa","Debit","—","—",0,"Y","g","minna-bank.co.jp","Japan's first digital-native bank."],
["Rakuten Bank","T","Asia","Tokyo, JP",2001,"C","Visa/MC","Debit","Rakuten points","—",0,"Y","g","rakuten-bank.co.jp","Japan's largest online bank; 15M+."],
["LINE Bank TW","T","Asia","Taipei, TW",2021,"C","MC","Debit","Points","Savers",0,"Y","g","linebank.com.tw","Taiwan's messenger-native bank."],
["NEXT Bank","T","Asia","Taipei, TW",2022,"C","—","Debit","—","Savers",0,"Y","g","nextbank.com.tw","Taiwan virtual bank (Chunghwa-led)."],
["ZA Bank","T","Asia","Hong Kong, HK",2020,"C","Visa","Debit","Rewards","HKD/USD savers",1,"Y","g","za.group","First HK virtual bank; retail crypto trading + stablecoin-issuer banking."],
["Mox Bank","T","Asia","Hong Kong, HK",2020,"C","MC","Debit + credit","CashBack","Savers",0,"Y","g","mox.com","Standard Chartered's HK virtual bank."],
["WeLab Bank","T","Asia","Hong Kong, HK",2020,"C","MC","Debit","Rewards","Time deposits",0,"Y","g","welab.bank","Homegrown HK virtual bank."],
/* ══ TRADITIONAL · ANZ ══ */
["Up","T","ANZ","Melbourne, AU",2018,"C","MC","Debit","—","~4% savers (conditions)",0,"Y","g","up.com.au","Design-led neobank (Bendigo-backed)."],
["Judo Bank","T","ANZ","Melbourne, AU",2016,"C","—","SME + term deposits","—","Competitive TDs",0,"Y","s","judo.bank","Australian SME challenger."],
["Hnry","T","ANZ","Wellington, NZ",2017,"C","MC","Business debit","—","—",0,"Y","f","hnry.co.nz","Tax + banking for sole traders (NZ/AU)."],
/* ══ TRADITIONAL · AFRICA ══ */
["TymeBank","T","Africa","Johannesburg, ZA",2018,"C","Visa","Debit","Smart Shopper","Up to ~10% GoalSave",0,"Y","ub","tymebank.co.za","10M+ customers; kiosk onboarding; unicorn."],
["Bank Zero","T","Africa","Johannesburg, ZA",2018,"C","MC","Debit","—","—",0,"Y","g","bankzero.co.za","Mutual-model app-only bank."],
["Discovery Bank","T","Africa","Johannesburg, ZA",2019,"C","Visa","Debit + credit","Vitality rewards","Dynamic rates",0,"Y","g","discovery.co.za","Behavioural 'shared-value' digital bank."],
["Kuda","T","Africa","Lagos, NG",2019,"C","Visa","Debit","—","Annual interest",0,"Y","g","kuda.com","'Bank of the free'; NG + UK remittance."],
["OPay","T","Africa","Lagos, NG",2018,"C","Verve/MC","Debit","Offers","Daily interest (Owealth)",0,"Y","ub","opayweb.com","60M+ users; agent-network powerhouse."],
["PalmPay","T","Africa","Lagos, NG",2019,"C","Verve/MC","Debit","Offers","Daily interest",0,"Y","ub","palmpay.com","35M+ users; Transsion-backed."],
["Moniepoint","T","Africa","Lagos, NG",2015,"C","Verve/MC","Business + personal","—","—",0,"Y","s","moniepoint.com","SME banking unicorn."],
["FairMoney","T","Africa","Lagos, NG",2017,"C","—","Lending + accounts","—","High NGN fixed savers",0,"Y","g","fairmoney.io","Credit-led Nigerian neobank."],
["Carbon","T","Africa","Lagos, NG",2012,"C","Visa","Debit","—","Fixed savings",0,"Y","g","getcarbon.co","Lending-first digital bank."],
["ALAT by Wema","T","Africa","Lagos, NG",2017,"C","Visa","Debit","—","Goal savings",0,"Y","g","alat.ng","Nigeria's first fully digital bank."],
["Sparkle","T","Africa","Lagos, NG",2019,"C","Visa","Debit","—","—",0,"Y","g","sparkle.ng","Lifestyle + SMB digital bank."],
["Umba","T","Africa","Lagos/Nairobi",2018,"C","—","Digital banking","—","—",0,"Y","g","umba.com","NG + KE digital bank (acquired MFB license)."],
["Djamo","T","Africa","Abidjan, CI",2019,"C","Visa","Debit","—","—",0,"Y","ub","djamo.io","YC-backed francophone-Africa neobank; 1M+."],
["Wave","T","Africa","Dakar, SN",2018,"C","—","Mobile money","—","—",0,"Y","ub","wave.com","Radically cheap mobile money; 10M+ users."],
["Eversend","T","Africa","Kampala/Paris",2017,"C","Visa","Virtual cards","—","—",0,"Y","g","eversend.co","Pan-African multicurrency + transfers."],
["Fingo","T","Africa","Nairobi, KE",2021,"C","—","Debit","—","—",0,"Y","k","fingo.africa","Youth neobank with Ecobank."],
["Branch Intl","T","Africa","Nairobi/Lagos",2015,"C","—","Lending + wallet","—","Yield wallet",0,"Y","g","branch.co","Digital lending → neobanking (KE/NG/IN)."],
["Khazna","T","Africa","Cairo, EG",2020,"C","—","Earned-wage + card","—","—",0,"Y","ub","khazna.app","Egyptian financial super-app."],
["MNT-Halan","T","Africa","Cairo, EG",2018,"C","—","Lending + payments","—","—",0,"Y","ub","halan.com","Egypt's lending super-app unicorn."],
["Flouci","T","Africa","Tunis, TN",2018,"C","Visa","Debit (physical + virtual)","—","~7% savings account",0,"Y","ub","flouci.com","Tunisia's digital-banking super-app; BCT sandbox; 250K+ accounts."],
["Grey","T","Africa","Lagos, NG",2020,"C","MC","Virtual USD cards","—","—",0,"Y","f","grey.co","USD/GBP/EUR accounts for African freelancers."],
["PaySika","T","Africa","Douala, CM",2020,"C","Visa","Prepaid (virtual + physical)","—","—",0,"Y","ub","paysika.co","Chatbot-first neobank for francophone Africa — free Visa cards managed from WhatsApp, Messenger or Telegram; issued with Ecobank Cameroon."],
["Cleva","T","Africa","Lagos, NG",2023,"C","Visa","Virtual USD cards","—","—",0,"Y","f","getcleva.com","YC-backed USD accounts for Africans."],
/* ══ TRADITIONAL · MENA ══ */
["Telda","T","MENA","Cairo, EG",2021,"C","MC","Debit","—","—",0,"Y","k","telda.app","Egypt's Gen-Z P2P + card app."],
["Wio Bank","T","MENA","Abu Dhabi, AE",2022,"C","Visa","Debit","—","Competitive AED/USD savers",0,"Y","g","wio.io","ADQ/e&-backed; retail + SMB."],
["Zand","T","MENA","Dubai, AE",2022,"C","Visa","Digital banking","—","Deposits",0,"Y","g","zand.ae","First UAE all-digital bank license; crypto-friendly corporate banking."],
["YAP","T","MENA","Dubai, AE",2021,"C","Visa","Debit","—","—",0,"Y","g","yap.com","UAE's first independent digital banking app."],
["Liv.","T","MENA","Dubai, AE",2017,"C","Visa","Debit","Rewards","Goal savers",0,"Y","g","liv.me","Emirates NBD's lifestyle bank."],
["Pyypl","T","MENA","Dubai, AE",2017,"C","MC","Prepaid","—","—",0,"Y","ub","pyypl.com","Cards for the smartphone-first unbanked."],
["NOW Money","T","MENA","Dubai, AE",2016,"C","Visa","Payroll + debit","—","—",0,"Y","i","nowmoney.me","Accounts for migrant workers in the Gulf."],
["Sarwa","T","MENA","Dubai, AE",2017,"C","—","Invest + cash","—","Sarwa Save yield",0,"Y","g","sarwa.co","Invest + trade + cash app."],
["ila Bank","T","MENA","Manama, BH",2019,"C","Visa","Debit","—","Savers",0,"Y","g","ilabank.com","Bank ABC's digital bank."],
["Tweeq","T","MENA","Riyadh, SA",2022,"C","Mada/Visa","Debit","—","—",0,"Y","g","tweeq.sa","Saudi spending account."],
["STC Bank","T","MENA","Riyadh, SA",2018,"C","Visa/Mada","Debit","Rewards","—",0,"Y","g","stcbank.com.sa","From STC Pay to full digital bank."],
["D360 Bank","T","MENA","Riyadh, SA",2023,"C","Mada/Visa","Debit","—","Shariah-compliant",0,"Y","fb","d360.com","PIF-backed Islamic digital bank."],
["Weyay","T","MENA","Kuwait City, KW",2021,"C","Visa","Debit","—","—",0,"Y","k","weyay.com","NBK's youth-first digital bank."],
["One Zero","T","MENA","Tel Aviv, IL",2019,"C","MC","Debit","—","Competitive deposits",0,"Y","g","onezerobank.com","Israel's first new bank in 40+ years; AI banker."],
["Pride Bank","T","LatAm","São Paulo, BR",2019,"C","MC","Debit","—","—",0,"Y","l","pridebank.com.br","Digital bank for Brazil's LGBTQ+ community."],
/* ══ HYBRID · fiat + custodial crypto ══ */
["Revolut","H","Global","London, UK",2015,"C","Visa/MC","Debit + credit","Perks by tier","Savings vaults",1,"Y","g","revolut.com","50M+ users; crypto trading; stablecoin in FCA sandbox 2026."],
["Cash App","H","US","Oakland, US",2013,"C","Visa","Debit","Boosts","~4% savings (conditions)",0,"Y","g","cash.app","Block's P2P giant; BTC + Lightning."],
["Venmo","H","US","New York, US",2009,"C","Visa/MC","Debit + credit","Up to 3% (credit)","—",1,"Y","g","venmo.com","PayPal-owned; crypto incl. PYUSD."],
["Robinhood","H","US","Menlo Park, US",2013,"C","MC","Debit (Cash Card)","Round-up boosts","~4% Gold APY",1,"Y","g","robinhood.com","Broker + banking + crypto; USDG consortium member."],
["Crypto.com","H","Global","Singapore, SG",2016,"C","Visa","Prepaid (metal tiers)","Up to 5% CRO","Earn on crypto/stables",1,"Y","g","crypto.com","Tiered staking-gated cards; 90+ countries."],
["Coinbase Card","H","US","San Francisco, US",2012,"C","Visa/Amex","Debit + credit","Up to 4% rotating","USDC rewards",1,"Y","g","coinbase.com","Exchange card + new Amex One Card; Base builder."],
["Binance Card","H","Global","—",2017,"C","Visa","Debit","Up to 8% BNB","Earn products",1,"Y","g","binance.com","Availability varies; regional relaunches."],
["Bybit Card","H","Global","Dubai, AE",2018,"C","MC","Debit","Up to 10% campaigns","Earn",1,"Y","g","bybit.com","Trader-focused; caps lower effective rates."],
["OKX Card","H","Global","—",2017,"C","Visa","Debit","Up to 5%","Earn",1,"Y","g","okx.com","Best rates for active OKX users."],
["Bitget Card","H","Global","—",2018,"C","Visa","Debit","Campaign rewards","Earn",1,"Y","g","bitget.com","Exchange-linked card."],
["KuCard","H","Global","—",2017,"C","Visa","Debit","Rewards","Earn",1,"Y","g","kucoin.com","KuCoin's card."],
["CEX.IO Card","H","Global","London, UK",2013,"C","Visa","Debit","Rewards","Earn/staking",1,"Y","g","cex.io","Veteran exchange with card."],
["SpectroCoin","H","Europe","Vilnius, LT",2013,"C","Visa","Prepaid","—","—",1,"Y","g","spectrocoin.com","Baltic crypto wallet + card."],
["Bitpanda","H","Europe","Vienna, AT",2014,"C","Visa","Debit","Up to 2% (BEST)","Staking",1,"Y","g","bitpanda.com","Stocks + crypto + metals broker with card."],
["eToro Money","H","Europe","Tel Aviv, IL",2007,"C","Visa","Debit","—","Staking",1,"Y","g","etoro.com","Broker money app + card (UK/EU)."],
["Tap Global","H","Europe","London, UK",2018,"C","MC","Prepaid","Cashback tiers","—",1,"Y","g","withtap.com","Crypto + fiat app with card."],
["CoinJar","H","ANZ","Melbourne, AU",2013,"C","MC","Debit","Points","—",1,"Y","g","coinjar.com","Australia's longest-running exchange + card."],
["Plutus","H","Europe","London, UK",2015,"C","Visa","Debit","Up to 8% PLU","—",0,"Y","g","plutus.it","Perk-stacking rewards card."],
["Fold","H","US","Phoenix, US",2019,"C","Visa","Prepaid + credit","BTC rewards","BTC on savings",0,"Y","g","foldapp.com","Bitcoin-rewards card; public co (FLD)."],
["Gemini Credit Card","H","US","New York, US",2014,"C","MC","Credit","Up to 4% BTC/ETH","—",1,"Y","g","gemini.com","Real-time crypto-back credit."],
["BitPay Card","H","US","Atlanta, US",2011,"C","MC","Prepaid","—","—",1,"Y","g","bitpay.com","OG crypto payments + card."],
["Strike","H","Global","Chicago, US",2019,"C","Visa","Debit (US)","BTC rewards","—",1,"Y","g","strike.me","Lightning-native payments + remittance."],
["Xapo Bank","H","Global","Gibraltar",2013,"C","MC","Debit","1% in BTC","Interest on BTC + USD",1,"Y","g","xapobank.com","Licensed private bank for BTC wealth."],
["Wirex","H","Global","London, UK",2014,"C","Visa","Debit","Up to 8% Cryptoback","X-Accounts yield",1,"Y","g","wirexapp.com","Earliest-wave crypto card; 180+ countries."],
["Uphold","H","Global","New York, US",2015,"C","Visa/MC","Debit","Up to 2%","Staking",1,"Y","g","uphold.com","Multi-asset: crypto, metals, FX."],
["Nexo","H","Global","Zug, CH",2018,"C","Visa/MC","Dual credit/debit","Up to 2% (credit mode)","Earn (tiers)",1,"Y","g","nexo.com","Crypto credit lines; rewards in credit mode."],
["Krak","H","Global","San Francisco, US",2025,"C","MC","Debit (metal tiers)","Up to 2% (cash or BTC)","Up to 8% APY (Vaults)",1,"Y","g","kraken.com","Kraken's global money app; Kraktag P2P, IBAN salary, UK/EEA Mastercard."],
["KAST","H","Global","Hong Kong, HK",2024,"C","Visa","Prepaid (tiers)","Up to 3% stablecoin","Vaults up to ~10%",1,"Y","g","kast.xyz","Stablecoin neobank; ~$600M valuation."],
["RedotPay","H","Global","Hong Kong, HK",2023,"C","Visa/MC","Prepaid","Up to 1%","—",1,"Y","g","redotpay.com","~60% of global crypto-card volume (2026 reports)."],
["Kolo","H","Global","—",2022,"C","Visa/MC","Prepaid","2% BTC","—",1,"Y","tr","kolo.la","Zero-fee stablecoin card in 170+ countries; nomad favourite."],
["Lava","H","US","New York, US",2022,"C","Visa","Secured credit","Up to 5% BTC","USD yield on deposits",1,"Y","g","lava.xyz","Bitcoin line of credit + card; dropped self-custody (DLC) for cold-storage custody in Sept 2025."],
["COCA","H","Global","Dubai, AE",2023,"M","Visa/MC","Virtual + physical","Up to 8%","Real-time DeFi APY",1,"Y","tr","coca.xyz","MPC self-banking app: EUR IBAN + card, 75 countries; Wirex-issued cards."],
["Trustee Plus","H","Europe","Vilnius, LT",2019,"C","Visa","Prepaid","—","—",1,"Y","g","trusteeglobal.eu","Ukraine-popular crypto card."],
["Brighty","H","Europe","Baar (Zug), CH",2021,"C","Visa/MC","Virtual + physical","Tiers","Up to 10% stablecoin vaults",1,"Y","g","brighty.app","Swiss hybrid by ex-Revolut engineers: EUR IBANs + crypto in one app, USDC/USDT/EURC vaults; EU/EEA + CH, 350K+ registrations."],
["UR","H","Global","—",2023,"C","Visa/MC","Debit","—","—",1,"Y","g","ur.global","Global stablecoin money app."],
["XPlace","H","Global","Dubai, AE",2023,"C","Visa/MC","Prepaid","—","—",1,"Y","g","x.place","Crypto card (Pontech issuance)."],
["Mercado Pago","H","LatAm","Buenos Aires, AR",2003,"C","Visa/MC","Debit + credit","In-app offers","Remunerated account",1,"Y","g","mercadopago.com","LatAm super-app; crypto BR/MX; Meli Dollar."],
["Lemon","H","LatAm","Buenos Aires, AR",2019,"C","Visa","Prepaid","Up to 2% BTC","Yield on stables (region)",1,"Y","g","lemon.me","Argentina's crypto-card leader; 3M+."],
["Belo","H","LatAm","Buenos Aires, AR",2020,"C","MC","Prepaid","Crypto cashback","Yield on stables",1,"Y","g","belo.app","AR crypto neobank; travel-friendly."],
["Ripio","H","LatAm","Buenos Aires, AR",2013,"C","Visa","Prepaid","Crypto cashback","Earn",1,"Y","g","ripio.com","LatAm exchange + card (AR/BR/MX)."],
["Buenbit","H","LatAm","Buenos Aires, AR",2018,"C","MC","Prepaid","Crypto cashback","DAI/USDC yield",1,"Y","g","buenbit.com","Stablecoin-heavy AR exchange + card."],
["Bitso","H","LatAm","Mexico City, MX",2014,"C","MC","Debit (MX)","Crypto cashback","Yield on stables",1,"Y","g","bitso.com","LatAm's largest exchange; remittance rails."],
["DolarApp","H","LatAm","Mexico City, MX",2021,"C","MC","Debit","2% USDc on spend","Yield on USDc",1,"Y","g","dolarapp.com","Digital-dollar accounts for LatAm."],
["Littio","H","LatAm","Bogotá, CO",2021,"C","Visa","Debit","—","USD yield onchain",1,"Y","g","littio.co","USD accounts for Colombians (onchain rails)."],
["Meru","H","LatAm","Bogotá, CO",2021,"C","Visa","Virtual + physical","—","USDC yield",1,"Y","f","getmeru.com","Dollar accounts for LatAm freelancers."],
["Airtm","H","LatAm","Mexico City, MX",2015,"C","Visa","Virtual","—","—",1,"Y","f","airtm.com","Dollar wallet + P2P payouts."],
["Félix","H","LatAm","Mexico City, MX",2022,"C","—","WhatsApp remittance","—","—",1,"Y","i","felixpago.com","Chat-based remittances on stablecoin rails."],
["Chipper Cash","H","Africa","San Francisco, US",2018,"C","Visa","Virtual + physical","—","—",1,"Y","g","chippercash.com","Pan-African P2P + cards + crypto."],
["Yellow Card","H","Africa","Lagos, NG",2016,"C","—","On/off-ramp","—","—",1,"Y","g","yellowcard.io","Stablecoin ramps across 20+ African markets."],
["Bitnob","H","Africa","Lagos, NG",2020,"C","Visa","Virtual USD","—","BTC/USDT savings",1,"Y","g","bitnob.com","BTC + stablecoin banking for Africa."],
["Eco (Beam)","W","US","New York, US",2023,"S","—","Money app","—","Onchain yield",1,"N","g","beam.eco","Self-custodial dollars; Eco protocol."],
["Deel","H","Global","San Francisco, US",2019,"C","—","Payroll (no card yet)","—","Rewards on DLUSD",1,"Y","f","deel.com","1.5M workers; DLUSD on Bridge+Privy+Tempo."],
["Meow","H","US","New York, US",2021,"C","—","Business banking","—","Treasury yield",1,"Y","s","meow.com","SMB banking born from crypto treasuries."],
["Dakota","W","US","New York, US",2023,"S","Visa","Business","—","T-bill-backed balances",1,"Y","s","dakota.xyz","Business banking on stablecoin rails."],
["Slash","H","US","San Francisco, US",2021,"C","Visa","Business","Cashback","Yield",1,"Y","s","slash.com","SMB banking; crypto-native verticals."],
["Flex","H","US","San Francisco, US",2022,"C","Visa","Business charge + credit","Cashback + points","Up to ~2.5% APY on idle cash",1,"Y","s","flex.one","AI-native private banking for business owners; Flex Global moves money in 100+ countries on stablecoin rails."],
/* ══ WEB3-NATIVE · self-custodial ══ */
["MetaMask","W","Global","Consensys (global)",2016,"S","MC","Virtual + physical","Card rewards (region)","mUSD ~4% (Monad); DeFi-wide",1,"CO","g","metamask.io","Default self-custodial wallet; Agent Wallet: Blockaid scanning, tx simulation, MEV protection."],
["Phantom","W","Global","San Francisco, US",2021,"S","—","Wallet (no card)","—","In-app staking",1,"N","g","phantom.app","Solana-first multichain wallet; 15M+ users."],
["Solflare","W","Global","Belgrade, RS",2017,"S","Visa","Wallet + card","Card rewards","SOL staking",1,"CO","g","solflare.com","Solana wallet; card paused Jul 2026 — issuer Kulipa wound down; funds stay in wallet."],
["Rainbow","W","Global","New York, US",2019,"S","—","Wallet (no card)","Points","—",1,"N","g","rainbow.me","Open-source EVM wallet; Ledger/Trezor."],
["Xverse","W","Global","London, UK",2021,"S","—","Wallet (no card)","—","Stacks/BTC yield",1,"N","g","xverse.app","Bitcoin-native: ordinals, Stacks, Lightning."],
["Trust Wallet","W","Global","—",2017,"S","—","Wallet (no card)","—","Staking",1,"N","g","trustwallet.com","140M+ installs; Binance-linked self-custody."],
["Exodus","W","Global","Omaha, US",2015,"S","—","Wallet (no card)","—","Staking",1,"N","g","exodus.com","Public-company self-custody wallet (NYSE American)."],
["Zengo","W","Global","Tel Aviv, IL",2018,"M","—","Wallet (no card)","—","—",1,"N","g","zengo.com","MPC wallet, no seed phrase; acquired by eToro (Apr 2026)."],
["Payy","W","Global","New York, US",2023,"S","Visa","Virtual + physical","Points","—",1,"CO","g","payy.network","ZK-private stablecoin L2 + card; ~$220M volume."],
["Gnosis Pay","W","Europe","Zug, CH",2023,"S","Visa","Virtual + physical","Up to 4% (GNO)","DeFi via Safe",1,"CO","g","gnosispay.com","Card wired to your own Safe on Gnosis Chain."],
["Holyheld","W","Europe","London, UK",2020,"S","MC","Virtual + physical","Up to 1% USDC","—",1,"CO","f","holyheld.com","IBAN + card on your external wallet; gasless."],
["EtherFi Cash","W","Global","Miami, US",2025,"S","Visa","Virtual + physical","Up to 3%","Restaking yield",1,"CO","g","ether.fi","Spend against restaked collateral; $145M+ deposits."],
["Avici","W","Global","—",2024,"S","Visa","Virtual + physical","—","—",1,"CO","g","avici.money","Self-custody neobank with full Visa access."],
["Bleap","W","Global","London, UK",2024,"M","MC","Virtual + physical","Up to 20% promo USDC","—",1,"CO","g","bleap.finance","MPC key-sharding; zero FX; free ATM tier."],
["Tuyo","W","LatAm","—",2023,"S","—","Virtual + physical","P2P zero-fee","—",1,"CO","g","itstuyo.com","USDC on Base for EUR/USD/MXN corridors."],
["Ready","W","Global","London, UK",2018,"S","Visa","Metal + virtual","3% in STRK","Staking + BTCFi",1,"CO","g","ready.co","Formerly Argent; card suspended Jul 2026 — issuer Kulipa wound down."],
["Plasma One","W","Global","—",2025,"S","Visa","Virtual + physical","Up to 4% XPL","10%+ APY USD₮",1,"CO","g","plasma.to","Stablecoin neobank on own L1; XPL −94% from high."],
["Tria","W","Global","—",2024,"S","—","Virtual + physical","—","—",1,"CO","g","tria.so","Self-custodial money app."],
["Karta","W","Global","Redwood City, US",2020,"M","Visa","Virtual + physical","—","—",1,"CO","tr","karta.io","Telegram-first self-custody card (Rain-issued); settles on Tempo; no US."],
["Hyperbeat","W","Global","—",2024,"S","Visa","Virtual + physical","—","beatUSD / USD+ yield",1,"CO","g","hyperbeat.org","Liquid Banking on Hyperliquid: spend cash or borrow at point of sale via Morpho."],
["Cypher","W","Global","—",2022,"S","Visa","Virtual + physical","Rewards","—",1,"CO","g","cypherhq.io","Multichain card; also powers Moonwell Card."],
["Solayer Emerald","W","Global","—",2024,"S","Visa","Virtual + physical","Rewards","Restaking-linked (sUSD)",1,"CO","g","solayer.org","Solana restaking ecosystem card."],
["Exa","W","Global","Buenos Aires, AR",2023,"S","Visa","Virtual + physical","—","Onchain credit (Exactly)",1,"CO","g","exa.app","DeFi credit + debit on Exactly protocol."],
["1inch Card","W","Global","Dubai, AE",2023,"S","Visa","Debit","Up to 2%","—",1,"CO","g","1inch.io","Wallet-linked card; fees offset rewards."],
["SafePal","W","Global","Singapore, SG",2018,"S","MC","Wallet + card","—","Earn",1,"CO","g","safepal.com","Hardware + software wallet with card."],
["Tangem","W","Global","Zug, CH",2017,"S","Visa","Virtual (physical planned)","Up to 4% (promo)","—",1,"CO","g","tangem.com","Card-shaped hardware wallet maker; Tangem Pay spends self-custodial USDC on Polygon — live US/LatAm/APAC/MEA, EU/UK planned."],
["Bitget Wallet","W","Global","—",2018,"S","Visa/MC","Prepaid","Promos (up to 8%)","—",1,"CO","g","web3.bitget.com","90M-user wallet; card via DCS/Immersve/Fiat24; WeChat & Alipay; no US/CA."],
["BFinance","H","Global","Prague, CZ",2023,"C","Visa/MC","Virtual + physical","—","—",1,"Y","g","bfinance.app","Telegram-bot cards; ~$20M/mo volume; $10 issue + 2% top-up fees."],
["xPortal","W","Global","Sibiu, RO",2021,"S","MC","Wallet + card","Cashback","Staking",1,"CO","g","xportal.com","MultiversX super-app wallet + card."],
["Avalanche Card","W","Global","—",2024,"S","Visa","Debit","—","—",1,"CO","g","avax.network","Spend AVAX/stables self-custodially."],
["MiniPay","W","Global","Oslo, NO",2023,"S","—","Wallet + local rails","—","—",1,"N","ub","minipay.to","Opera's Celo wallet; 10M+; PIX/Mercado Pago rails."],
["El Dorado","W","LatAm","—",2022,"S","—","P2P super-app","—","—",1,"Y","g","eldorado.io","LatAm USDT P2P ramps (VE/CO/BR/AR/PE)."],
["Oobit","W","Global","Singapore, SG",2017,"S","Visa/MC","Tap-to-pay + card","Cashback","—",1,"Y","g","oobit.com","Non-custodial pass-through; Tether-backed; Agent Cards for AI agents."],
["Peanut","W","Global","Zug, CH",2022,"S","—","Payment links","—","—",1,"N","g","peanut.me","Claim-link crypto transfers; open protocol."],
["Morse","W","Global","London, UK",2023,"S","Visa","P2P + card","—","—",1,"Y","g","morsemoney.com","Stablecoin P2P on Solana, rebranded from Sling Money in April 2026; multi-currency accounts and a card across 150+ countries."],
["Fizen","W","Asia","Ho Chi Minh, VN",2022,"S","Visa/MC","Virtual + physical","Offers","—",1,"CO","tr","fizen.io","Tether-invested travel neobank: card + local QR payments across APAC/MENA."],
["Startale","W","Asia","Singapore, SG",2023,"S","Visa","Virtual + physical (waitlist)","Cashback in USDSC","Assets keep earning until spent (vaults)",1,"CO","g","startale.com","Sony/SBI-backed: self-custodial Visa spends Soneium L2 assets at 150M+ merchants; unveiled at WebX Tokyo 2026."],
["Deblock","W","Europe","Paris, FR",2022,"X","Visa","Virtual + physical","Tiers","~4% EUR (tiers)",1,"Y","g","deblock.com","French-licensed account + non-custodial wallet."],
["Stables","W","ANZ","Sydney, AU",2021,"C","MC","Virtual + physical","—","—",1,"Y","g","stables.money","Spend USDC anywhere Mastercard works."],
["Fiat24","W","Europe","Zurich, CH",2021,"S","Visa","Virtual + physical","—","—",1,"Y","g","fiat24.com","Swiss-licensed; your account is an NFT on Arbitrum."],
["Mine","W","Europe","Zug, CH",2024,"S","MC","Virtual (paid tiers soon)","—","Up to 5% via Aave V3 (opt-in)",1,"Y","g","mine.financial","Invite-only Swiss self-custody money app: CHF/EUR IBAN in your name settles as USDC in your wallet; card in 175+ countries."],
["Infini","W","Global","—",2024,"S","Visa","Virtual","—","Stablecoin yield",1,"CO","g","infini.money","Rebuilt after $49M exploit (Feb 2025)."],
["Moon","W","Global","—",2022,"S","Visa","Virtual","—","—",1,"N","g","paywithmoon.com","Privacy-lean virtual cards funded with crypto."],
["Moto","W","US","New York, US",2025,"S","Visa","Credit (Visa Infinite, waitlist)","5% base, up to 8% top tier","2–5% APY on USDC collateral",1,"CO","g","moto-card.com","DeFi charge card on Solana: USDC collateral earns yield while backing the credit line; lounge access + subscription rebates."],
["WeFi","W","Global","—",2023,"S","Visa/MC","Virtual + physical","Token rewards","Yield",1,"CO","g","wefi.xyz","'Deobank' — deposits stay in user control."],
["UglyCash","W","LatAm","San Juan, PR",2023,"C","Visa","Virtual + physical","Up to 5%","USD yield on stables",1,"Y","g","uglycash.com","LatAm dollar app on stablecoin rails."],
["Decaf","W","LatAm","—",2022,"S","Visa","Virtual + physical","—","—",1,"CO","g","decaf.so","Solana-based spending + global payouts."],
["SurfCash","W","Asia","—",2025,"S","—","QR payments (no card)","—","Up to 15% (Perena)",1,"N","tr","getsurf.cash","USDC → VietQR/PromptPay/PIX in ~10s; 0.5% fee; the rails cards can't touch."],
["Onboard","W","Africa","Lagos, NG",2021,"S","Visa","Virtual + physical","—","Onchain yield",1,"CO","g","onboard.xyz","Self-custody wallet + cards for Africa."],
["Alpian","T","Europe","Geneva, CH",2019,"C","Visa","Debit","—","CHF/EUR interest",0,"Y","g","alpian.com","Swiss-licensed digital private bank."],
["Yuh","H","Europe","Gland, CH",2021,"C","MC","Debit","Swissqoin rewards","Savings + invest",0,"Y","g","yuh.com","Swissquote x PostFinance app; custodial crypto trading."],
["neon","T","Europe","Zurich, CH",2017,"C","MC","Debit","—","—",0,"Y","g","neon-free.ch","Switzerland's leading independent neobank app."],
["Zak","T","Europe","Basel, CH",2017,"C","Visa","Debit","—","—",0,"Y","g","cler.ch","Bank Cler's free banking app."],
["Pixpay","T","Europe","Paris, FR",2019,"C","MC","Debit","—","—",0,"Y","k","pixpay.fr","Teen card; acquired by GoHenry (2022)."],
["Bling","T","Europe","Berlin, DE",2021,"C","Visa","Debit","—","—",0,"Y","k","bling.de","German family money app."],
["Kit","T","ANZ","Sydney, AU",2022,"C","MC","Prepaid","—","—",0,"Y","k","heykit.com.au","CommBank's kids' money app (x15ventures)."],
["Douugh","T","ANZ","Sydney, AU",2016,"C","MC","Debit","—","—",0,"Y","g","douugh.com","ASX-listed money app (AU/US)."],
["Parpera","T","ANZ","Sydney, AU",2020,"C","MC","Business debit","—","—",0,"Y","f","parpera.com","Money app for sole traders."],
["Aspire","T","Asia","Singapore, SG",2018,"C","Visa","Business debit","1% select","Yield on idle cash",0,"Y","s","aspireapp.com","SEA's all-in-one SMB finance OS."],
["YouTrip","T","Asia","Singapore, SG",2018,"C","MC","Prepaid multicurrency","—","—",0,"Y","tr","you.co","Travel wallet for SG/TH/MY."],
["Mashreq Neo","T","MENA","Dubai, AE",2017,"C","Visa","Debit","Rewards","Savers",0,"Y","g","mashreqneo.com","Mashreq's digital bank."],
["Nomad","T","LatAm","São Paulo, BR",2019,"C","MC","Debit (US account)","—","USD yield",0,"Y","tr","nomadglobal.com","US accounts + investing for Brazilians."],
["Daimo","W","Global","New York, US",2023,"S","—","Wallet (no card)","—","—",1,"N","g","daimo.com","Open-source self-custodial USDC wallet."],
["Vision Bank","T","MENA","Riyadh, SA",2024,"C","Mada/Visa","Debit","—","Shariah-compliant",0,"Y","fb","visionbank.sa","Saudi Arabia's third licensed digital bank."],
["Beyon Money","T","MENA","Manama, BH",2022,"C","Visa","Debit + wealth","Rewards","Savers",0,"Y","g","beyonmoney.com","Bahrain telco-backed financial super-app."],
["Fasset","H","MENA","Dubai, AE",2019,"C","Visa","Debit","Rewards","Yield on assets",1,"Y","fb","fasset.com","Ethical digital-asset super-app; UAE/ID/MY corridors."],
["Kontigo","W","LatAm","—",2024,"C","Visa","Virtual + physical","—","USDC yield",1,"Y","g","kontigo.lat","USDC neobank for Venezuela + LatAm corridors."],
["Veera","W","Global","Singapore, SG",2023,"S","—","Wallet + card","Card rewards","Vault yield 3–10% across 40 chains",1,"CO","g","veera.com","Onchain neobank: earn, invest (tokenized equities, gold, RWAs), borrow and spend self-custodially; 2M+ users in 187 countries, 30K cards."],
["Rizon","W","Global","—",2024,"S","Visa","Virtual + physical","—","Stablecoin yield",1,"CO","g","rizon.co","Stablecoin banking app on self-custody rails."],
["AllScale","W","Global","—",2024,"C","Visa","Business","—","—",1,"Y","s","allscale.io","Stablecoin business banking for global SMBs."],
["Nyla","T","Africa","Lagos, NG",2024,"C","Verve/MC","Debit","—","—",0,"Y","g","nyla.africa","Nigerian consumer neobank (new wave)."],
["Munify","T","MENA","Cairo, EG",2024,"C","MC","Debit","—","—",0,"Y","i","munify.app","Banking for Egyptian diaspora + remittances."],
["Moneco","T","Europe","Paris, FR",2022,"C","Visa","Debit","—","—",0,"Y","i","moneco.app","Neobank for African diaspora in Europe."],
["Superform","W","Global","—",2023,"S","—","Yield app","—","Cross-chain vault yield",1,"N","g","superform.xyz","Self-custodial onchain yield 'savings account'."],
["Baraka","T","MENA","Dubai, AE",2021,"C","—","Invest app","—","—",0,"Y","g","getbaraka.com","MENA retail investing app expanding to money features."],
["GCash","T","Asia","Manila, PH",2004,"C","Visa","Debit (GCash Card)","—","GSave up to 2.6%",0,"Y","ub","gcash.com","The Philippines' super-app wallet; ~94M users, GCredit + GSave make it bank-like."],
["PhonePe","T","Asia","Bengaluru, IN",2015,"C","RuPay/UPI","UPI + cards","Rewards","—",0,"Y","g","phonepe.com","India's UPI giant — 600M+ registered; wallets, deposits marketplace, insurance."],
["Paytm","T","Asia","Noida, IN",2010,"C","RuPay","Wallet + UPI","Cashback offers","—",0,"Y","g","paytm.com","India's OG super-app wallet; payments bank wound down, wallet + UPI live on."],
["GrabPay","T","Asia","Singapore, SG",2016,"C","MC (GrabPay Card)","Prepaid","GrabRewards","—",0,"Y","g","grab.com","SEA super-app wallet across 8 countries; sibling of GXS Bank."],
["GoPay","T","Asia","Jakarta, ID",2016,"C","—","Wallet","GoPay Coins","—",0,"Y","g","gopay.co.id","GoTo's wallet; Indonesia's ride-hail-born money app, Jago-partnered."],
["OVO","T","Asia","Jakarta, ID",2017,"C","—","Wallet","OVO Points","—",0,"Y","g","ovo.id","Grab-backed Indonesian e-wallet with investing + lending layers."],
["DANA","T","Asia","Jakarta, ID",2018,"C","—","Wallet","—","—",0,"Y","g","dana.id","Ant-backed Indonesian wallet; 180M+ registered users."],
["TrueMoney","T","Asia","Bangkok, TH",2003,"C","Visa/MC","Prepaid","—","—",0,"Y","ub","truemoney.com","CP Group's wallet across 7 SEA markets; Thailand's biggest."],
["MoMo","T","Asia","Ho Chi Minh City, VN",2013,"C","—","Wallet","—","—",0,"Y","g","momo.vn","Vietnam's leading e-wallet; 30M+ users, investments + savings."],
["ZaloPay","T","Asia","Ho Chi Minh City, VN",2016,"C","Visa","Wallet + card","—","—",0,"Y","g","zalopay.vn","VNG's wallet riding Zalo, Vietnam's biggest chat app."],
["Touch 'n Go eWallet","T","Asia","Kuala Lumpur, MY",2017,"C","Visa","Prepaid","—","GO+ ~3%",0,"Y","g","touchngo.com.my","Malaysia's toll-born wallet turned everyday money app; Ant-backed."],
/* ══ intake 2026-08 (new-neobank issues) ══ */
["Dolafy","H","LatAm","Brazil, BR",2025,"C","Visa","Prepaid","—","—",1,"Y","s","dolafy.com","Multi-currency (USD/EUR/BRL/AED/GBP) accounts for global businesses with custodial stablecoins and a Visa prepaid business card."],
["Brookwell","H","Global","New York, US",2025,"C","—","—","—","1% APY checking; up to ~5.5% stablecoin savings",1,"Y","g","brookwell.com","Stablecoin neobank with FDIC-protected checking (via Erebor Bank, N.A.) and custodial high-yield stablecoin savings plus global-spend cards."],
["Takenos","H","LatAm","Buenos Aires, AR",2022,"C","Visa/MC","Prepaid","—","Up to 3%",1,"Y","f","takenos.com","Digital-dollar wallet for LatAm freelancers to receive cross-border pay in stablecoins or local currency, with cards, QR payments and yield-bearing USD accounts."],
["Slush","W","Global","Palo Alto, US",2021,"S","—","—","—","SUI staking rewards",1,"N","g","slush.app","Official self-custodial Sui wallet by Mysten Labs (formerly Sui Wallet, merged with Stashed) with zkLogin, staking, in-app swaps and shareable claim links."],
["Solid","W","Global","Gibraltar, GI",2025,"M","Visa","Virtual","3% (USDC)","Up to 8% APY (USDC via Veda)",1,"CO","g","solid.xyz","Self-custodial onchain neobank (Safe smart accounts + MPC) with automated USDC yield, its own SoUSD stablecoin, and a Visa card (Rain) with 3% cashback and Apple/Google Pay."],
["Sony Bank","T","Asia","Tokyo, JP",2001,"C","Visa","Debit","0.5% (Japan)","—",0,"Y","g","moneykit.net","Branchless direct bank owned by Sony Financial; the Sony Bank WALLET Visa debit spends 11 currencies, with an English app for foreign residents."],
["AMP Bank GO","T","ANZ","Sydney, AU",2025,"C","Mastercard","Debit","—","—",0,"Y","s","amp.com.au","AMP Bank's mobile-first digital bank on Engine by Starling — Australia's first numberless small-business Mastercard debit cards, Spaces sub-accounts and fee-free FX."],
["Always.bank","T","US","Birmingham, US",2025,"C","—","—","—","—",0,"Y","s","always.bank","US digital bank for small businesses — an FDIC-insured brand of 22nd State Banking Company with checking, savings, CDs, SBA/USDA loans and invoice factoring."],
["Haventree Bank","T","Canada","Toronto, CA",2018,"C","—","—","—","2.5% Everyday Growth Account",0,"Y","g","haventreebank.com","Schedule I Canadian bank (ex Equity Financial Trust) that launched a direct-to-consumer digital bank in 2026 with a 2.5% growth account and CDIC-insured GICs."],
["Esh Bank","T","MENA","Tel Aviv, IL",2022,"C","—","—","—","—",0,"Y","g","esh.com","Israeli fully-digital bank whose patented Equal Sharing model returns 50% of interest income on customer balances, with no account fees."],
["Blink","T","MENA","Amman, JO",2022,"C","—","—","—","—",0,"Y","g","theblink.com","Jordan's first digital-only neobank by Capital Bank of Jordan — app-based account opening with a Jordanian ID in about 15 minutes, an instant virtual debit card and instant credit cards."],
["Yolat","T","Africa","Lagos, NG",2024,"C","—","—","—","—",0,"Y","i","yolat.com","Cross-border account for Africans and African businesses — earn, hold, send and pay across borders; licensed as FINTRAC MSB + Bank of Canada RPAA PSP, with a CBN IMTO for Nigeria inflows."],
["GetPlu","H","Global","Delaware, US",2026,"C","Visa","Virtual","—","—",1,"Y","i","getplu.com","Zero-fee virtual Visa dollar card funded with USD, USDC or USDT — instant issue after KYC, Apple/Google Pay, market hubs across Nigeria, Ghana, Kenya and North America on partner rails."]
];
/* pre-launch / emerging — kept in the machine dataset (data.json `emerging`) but excluded from the verified-active grid, counts and generated pages */
const EMERGING=[
["Reah","H","Global","Menlo Park, US",2025,"S","Visa","Corporate","—","Up to 12% APY",1,"Y","s","reah.com","Self-custodial onchain business-banking OS combining regulated fiat accounts via partners with a multi-sig stablecoin and BTC treasury, Visa corporate cards and up to 12% APY."]
];

/* the graveyard — delisted entities are archived here with their cause of
   death, never silently deleted. Same 15 fields as D, then three more:
   [15] delisted (ISO date), [16] cause kind (rail = partner/rail exit,
   acquired, regulator), [17] cause summary. Kept out of the grid, counts
   and generated profiles; exported as data.json `graveyard` and rendered
   at /graveyard/. */
const GRAVEYARD=[
["Juno","H","US","San Francisco, US",2019,"C","MC","Debit","Up to 5% JCOIN","Yield on USDC/USD",1,"Y","g","juno.finance","Checking + USDC salary splits.","2026-07-18","rail","Collateral damage of the 2024 Synapse/Evolve collapse: when Evolve Bank lost access to Synapse's ledger, customer funds froze across 50+ fintechs (~$95M went missing industry-wide). Juno wound down its Treasury account and pivoted to on-chain."],
["Fi Money","T","Asia","Bengaluru, IN",2019,"C","Visa","Debit","Rewards","—",0,"Y","g","fi.money","Salaried-professional neobank.","2026-07-18","rail","Partner Federal Bank ended the relationship (11 Mar 2026) amid the RBI's tightening of bank–fintech tie-ups and thin unit economics; 3.5M customers were redirected to the bank's own app as Fi pivoted to AI."],
["Kard","T","Europe","Paris, FR",2018,"C","MC","Debit","—","—",0,"Y","k","kard.eu","French teen banking app.","2026-07-18","rail","Its e-money provider terminated the contract, leaving no rail to operate on — the company went into liquidation."],
["Pomelo","T","US","San Francisco, US",2021,"C","MC","Credit + remittance","—","—",0,"Y","i","pomelo.com","Send money home via credit; US↔PH corridor.","2026-07-18","acquired","Acquired by Zepz (WorldRemit / Sendwave) in Jan 2026; the product was paused during integration and the team folded in — an exit, not a failure."],
["Z1","T","LatAm","São Paulo, BR",2020,"C","Visa","Debit","—","—",0,"Y","k","z1.app","Brazil's Gen-Z money app.","2026-07-18","acquired","Absorbed by crypto neobank NG.CASH; the Z1 brand was retired."],
["Will Bank","T","LatAm","São Paulo, BR",2017,"C","MC","Debit + credit","—","Yield",0,"Y","g","willbank.com.br","Card-first Brazilian neobank.","2026-07-16","regulator","Liquidated by Brazil's Central Bank (Jan 2026) — nominally for breaching Mastercard obligations, but tied to the collapse of the Banco Master conglomerate (a severe liquidity crisis and an ~R$11.5B fraud probe) that felled several linked institutions."]
];

/* ── state ── */
let cat="ALL", q="", region="", custody="", net="", niche="", wantYield=false, wantStable=false, wantNoKyc=false, wantAI=false, sortBy="az";
let cmp=new Set();
const grid=document.getElementById('grid');
const CATNAME={T:"traditional",H:"hybrid",W:"web3-native"};
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function custGroup(code){return code==="C"?"Custodial":code==="X"?"Mixed":"Self-custodial"}

/* ── populate selects ── */
(function(){
  const regions=[...new Set(D.map(r=>r[2]))].sort();
  const sel=document.getElementById('f-region');
  regions.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent="region: "+r;sel.appendChild(o)});
  const cs=document.getElementById('f-custody');
  ["Custodial","Self-custodial","Mixed"].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent="custody: "+c.toLowerCase();cs.appendChild(o)});
  const ns=document.getElementById('f-net');
  ["Visa","Mastercard","—"].forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent="card: "+(n==="—"?"none / wallet-only":n);ns.appendChild(o)});
  const nn=document.getElementById('f-niche');
  const used=[...new Set(D.map(r=>r[12]))];
  Object.entries(NICHE).filter(([k])=>used.includes(k)).forEach(([k,v])=>{
    const o=document.createElement('option');o.value=k;o.textContent="audience: "+v+" ("+D.filter(r=>r[12]===k).length+")";nn.appendChild(o);
  });
})();

/* ── stats ── */
document.getElementById('st-total').textContent=D.length;
document.getElementById('st-t').textContent=D.filter(r=>r[1]==="T").length;
document.getElementById('st-h').textContent=D.filter(r=>r[1]==="H").length;
document.getElementById('st-w').textContent=D.filter(r=>r[1]==="W").length;
document.getElementById('st-n').textContent=D.filter(r=>r[12]!=="g").length;

/* ── filtering ── */
function matches(r){
  const [name,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  if(cat!=="ALL"&&c!==cat)return false;
  if(region&&reg!==region)return false;
  if(custody&&custGroup(cu)!==custody)return false;
  if(niche&&ni!==niche)return false;
  if(net==="—"){if(nw!=="—")return false}
  else if(net==="Visa"&&!/Visa/i.test(nw))return false;
  else if(net==="Mastercard"&&!/(MC|Mastercard)/i.test(nw))return false;
  if(wantYield&&(y==="—"||!y))return false;
  if(wantStable&&!st)return false;
  if(wantNoKyc&&kyc!=="N")return false;
  if(wantAI&&!(X[name]||{}).ai)return false;
  if(q){
    const hay=(name+" "+CATNAME[c]+" "+reg+" "+hq+" "+CUST[cu]+" "+nw+" "+ct+" "+cb+" "+y+" "+KYC[kyc]+" "+NICHE[ni]+" "+note).toLowerCase();
    if(!hay.includes(q))return false;
  }
  return true;
}
function currentList(){
  let list=D.filter(matches);
  if(sortBy==="az")list.sort((a,b)=>a[0].localeCompare(b[0]));
  if(sortBy==="founded")list.sort((a,b)=>a[4]-b[4]);
  if(sortBy==="newest")list.sort((a,b)=>b[4]-a[4]);
  return list;
}
/* self-hosted logo overrides — for brands whose favicon Google's s2 service gets wrong or misses */
const LOGOMAP={"Moniepoint":"/logos/moniepoint.png","XPlace":"/logos/xplace.png"};
function logoSrc(dom,name){return LOGOMAP[name]||`https://www.google.com/s2/favicons?domain=${esc(dom)}&sz=64`}
/* compare-tray chip with mini logo */
function tchipHTML(n){
  const r=D.find(x=>x[0]===n),d=r&&r[13];
  const im=(d||LOGOMAP[n])?`<img loading="lazy" alt="" src="${logoSrc(d,n)}" onerror="this.remove()">`:'';
  return `<span class="tchip">${im}${esc(n)}<button aria-label="remove ${esc(n)}" data-n="${esc(n)}">✕</button></span>`;
}
function logoHTML(dom,name){
  const initial=esc(name.replace(/^the /i,"").charAt(0).toUpperCase());
  if(!dom&&!LOGOMAP[name])return `<div class="logo-box"><div class="logo-fb" style="display:flex">${initial}</div></div>`;
  return `<div class="logo-box"><img loading="lazy" alt="${esc(name)} logo" src="${logoSrc(dom,name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="logo-fb">${initial}</div></div>`;
}
function render(){
  if(window.__nbBoot){window.__nbDirty=true;return}
  const list=currentList();
  document.getElementById('count').innerHTML=`showing <b>${list.length}</b> of <b>${D.length}</b> neobanks`;
  const tN=list.filter(r=>r[1]==="T").length||.0001,hN=list.filter(r=>r[1]==="H").length||.0001,wN=list.filter(r=>r[1]==="W").length||.0001;
  const bar=document.getElementById('specbar');
  bar.children[0].style.flexGrow=tN;bar.children[1].style.flexGrow=hN;bar.children[2].style.flexGrow=wN;
  if(!list.length){grid.innerHTML=`<div class="empty">no neobanks match those filters<button class="pill p-all" onclick="clearAll()">clear filters</button></div>`;return}
  grid.innerHTML=list.map(r=>{
    const [name,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
    const on=cmp.has(name);
    const feat=name==="MetaMask"?" featured":"";
    return `<article class="card${feat}">
      <div class="chead">
        ${logoHTML(dom,name)}
        <div><div class="cname">${esc(name)}</div><div class="cmeta">${esc(hq)} · est. ${f}</div></div>
        <span class="chip ${c}">${CATNAME[c]}</span>
      </div>
      <div class="specs">
        <div class="spec"><div class="k">custody</div><div class="v">${CUST[cu]}</div></div>
        <div class="spec"><div class="k">card</div><div class="v">${esc(nw)}${nw!=="—"?" · "+esc(ct):""}</div></div>
        <div class="spec"><div class="k">cashback</div><div class="v">${esc(cb)}</div></div>
        <div class="spec"><div class="k">yield</div><div class="v">${esc(y)}</div></div>
        <div class="spec"><div class="k">region</div><div class="v">${esc(reg)}</div></div>
        <div class="spec"><div class="k">kyc</div><div class="v">${KYC[kyc]}</div></div>
      </div>
      <div class="cnote">${esc(note)}</div>
      <div class="cfoot">
        ${ni!=="g"?`<span class="nichetag">${NICHE[ni]}</span>`:""}
        ${st?'<span class="badge-s">stablecoins</span>':""}
        <button class="cmp-btn${on?" on":""}" data-n="${esc(name)}" aria-pressed="${on}">${on?"✓ comparing":"+ compare"}</button>
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll('.cmp-btn').forEach(b=>b.addEventListener('click',()=>toggleCmp(b.dataset.n)));
}

/* ── compare ── */
function toggleCmp(name){
  if(cmp.has(name))cmp.delete(name);
  else{
    if(cmp.size>=4){
      const hint=document.getElementById('trayhint');
      if(hint)hint.textContent="max 4 side by side — remove one first";
      else alert("Max 4 side by side — remove one first.");
      return;
    }
    cmp.add(name);
  }
  renderTray();render();
}
function renderTray(){
  const tray=document.getElementById('tray'),chips=document.getElementById('traychips');
  if(!cmp.size){tray.classList.remove('show');return}
  tray.classList.add('show');
  chips.innerHTML=[...cmp].map(tchipHTML).join("");
  chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>toggleCmp(b.dataset.n)));
  document.getElementById('gocmp').disabled=cmp.size<2;
}
const FIELDS=[["Category",r=>CATNAME[r[1]]],["Audience",r=>NICHE[r[12]]],["Region",r=>r[2]],["HQ",r=>r[3]],["Founded",r=>r[4]],
["Custody",r=>CUST[r[5]]],["Card network",r=>r[6]],["Card type",r=>r[7]],["Cashback",r=>r[8]],
["Yield",r=>r[9]],["Stablecoins",r=>r[10]?"Yes":"No"],["KYC",r=>KYC[r[11]]],["Notes",r=>r[14]]];
/* slug map identical to tests/build-pages.mjs so compare links hit the static profile pages */
const CMPSLUG=(()=>{const s={},t=new Set(),sl=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'entity';D.forEach(r=>{let x=sl(r[0]);while(t.has(x))x+='-2';t.add(x);s[r[0]]=x});return s})();
document.getElementById('gocmp').addEventListener('click',()=>{
  const rows=D.filter(r=>cmp.has(r[0]));
  let html=`<tr class="hdr"><td style="background:var(--panel2)"></td>${rows.map(r=>
    `<td><div class="cmpco">${logoHTML(r[13],r[0])}<div><div class="cmpnm">${esc(r[0])}</div><span class="chip ${r[1]}">${CATNAME[r[1]]}</span></div></div>`+
    `<div class="cmplinks"><a href="/n/${CMPSLUG[r[0]]}/">full profile →</a>${r[13]?`<a href="https://${esc(r[13])}" target="_blank" rel="noopener">${esc(r[13])} ↗</a>`:''}</div></td>`).join("")}</tr>`;
  FIELDS.forEach(([label,fn])=>{html+=`<tr><th>${label}</th>${rows.map(r=>`<td>${esc(fn(r))}</td>`).join("")}</tr>`});
  document.getElementById('cmptable').innerHTML=html;
  document.getElementById('overlay').classList.add('show');
  document.getElementById('ovclose').focus();
  nbevt('compare_open',{entities:rows.map(r=>r[0]).join(' vs '),count:rows.length});
});
document.getElementById('ovclose').addEventListener('click',()=>document.getElementById('overlay').classList.remove('show'));
/* backdrop click closes the compare overlay too */
document.getElementById('overlay').addEventListener('click',e=>{
  if(e.target.id==='overlay'||e.target.classList.contains('ov-wrap'))document.getElementById('overlay').classList.remove('show');
});
document.addEventListener('keydown',e=>{if(e.key==="Escape")document.getElementById('overlay').classList.remove('show')});

/* ── controls ── */
document.querySelectorAll('.pill[data-cat]').forEach(p=>p.addEventListener('click',()=>{
  cat=p.dataset.cat;
  document.querySelectorAll('.pill[data-cat]').forEach(x=>x.classList.toggle('on',x===p));
  render();
}));
document.getElementById('q').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();render()});
document.getElementById('f-region').addEventListener('change',e=>{region=e.target.value;render()});
document.getElementById('f-custody').addEventListener('change',e=>{custody=e.target.value;render()});
document.getElementById('f-net').addEventListener('change',e=>{net=e.target.value;render()});
document.getElementById('f-niche').addEventListener('change',e=>{niche=e.target.value;render()});
document.getElementById('f-yield').addEventListener('change',e=>{wantYield=e.target.checked;document.getElementById('lb-yield').classList.toggle('on',wantYield);render()});
document.getElementById('f-stable').addEventListener('change',e=>{wantStable=e.target.checked;document.getElementById('lb-stable').classList.toggle('on',wantStable);render()});
document.getElementById('f-nokyc').addEventListener('change',e=>{wantNoKyc=e.target.checked;document.getElementById('lb-nokyc').classList.toggle('on',wantNoKyc);render()});
document.getElementById('f-ai').addEventListener('change',e=>{wantAI=e.target.checked;document.getElementById('lb-ai').classList.toggle('on',wantAI);render()});
document.getElementById('sort').addEventListener('change',e=>{sortBy=e.target.value;render()});
function clearAll(){
  cat="ALL";q="";region="";custody="";net="";niche="";wantYield=wantStable=wantNoKyc=wantAI=false;sortBy="az";
  document.getElementById('q').value="";
  ['f-region','f-custody','f-net','f-niche','sort'].forEach(id=>document.getElementById(id).selectedIndex=0);
  ['f-yield','f-stable','f-nokyc','f-ai'].forEach(id=>document.getElementById(id).checked=false);
  ['lb-yield','lb-stable','lb-nokyc','lb-ai'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.querySelectorAll('.pill[data-cat]').forEach(x=>x.classList.toggle('on',x.dataset.cat==="ALL"));
  render();
}
document.getElementById('clearall').addEventListener('click',clearAll);

/* ── black & white mode (persisted across pages via localStorage) ── */
const bwbtn=document.getElementById('bwtoggle');
function setBW(on){
  document.body.classList.toggle('bw',on);
  bwbtn.setAttribute('aria-pressed',on);
  bwbtn.textContent=on?"◑ color":"◐ black & white";
  try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}
}
try{if(localStorage.getItem('nbbw')==='1')setBW(true)}catch(e){}
bwbtn.addEventListener('click',()=>setBW(!document.body.classList.contains('bw')));

render();


/* ═══ ENRICHMENT LAYER · profiles, licenses, founders, funding, world map ═══
   X[name] = { f: founders, l: license, m: money raised, s: story, a: active macro regions override } */
const X={
/* ══ intake 2026-08 ══ */
"Dolafy":{f:"Eduardo Borges",l:"Partner bank: Lead Bank (issuer); Bridge, a Stripe company (program manager)",s:"Bootstrapped by Eduardo Borges and two co-founders under AETERNUM CAPITAL LTDA, with no outside investors.",a:["LATAM","NA","EU","MENA"]},
"Brookwell":{f:"Ravi Riley",l:"Partner bank: Erebor Bank, N.A. (Member FDIC)",s:"Founded by Stable Money Company to bridge on-chain stablecoin yield with everyday banking."},
"Takenos":{l:"Fintech; stablecoin wallet on partner rails",m:"$5M seed (Variant, Lattice), 2025",s:"Founded 2022 in Buenos Aires; processed $500M+ across 500k+ users on its own Solana-based stablecoin.",a:["LATAM","NA","EU"]},
"Slush":{f:"Mysten Labs",l:"Self-custodial Sui wallet software",s:"Built by the Mysten Labs engineers behind Sui; rebranded from Sui Wallet to become the ecosystem's flagship consumer wallet."},
"Solid":{l:"Self-custodial Safe smart-accounts + MPC",s:"Positions itself as an onchain neobank for real life — earn DeFi yield, save gaslessly across chains, and spend worldwide while keeping assets self-custodial."},
"GetPlu":{l:"Card program on partner institutions (Crossmint rails); not a bank or custodian itself",s:"Positions one product three ways — dollar card, stablecoin card and an AI-Agent card — for the globally mobile: immigrants, freelancers and OFWs spending across 125+ countries."},
"Yolat":{f:"Toyosi Abolarin",l:"FINTRAC MSB + Bank of Canada RPAA PSP (CA); IMTO (CBN, NG)",s:"African-founded cross-border fintech licensed on both sides of the Atlantic — blockchain-rail transfers between Canada, the UK and African corridors, with AI-driven routing and compliance."},
"Sony Bank":{l:"Japanese banking license (Sony Financial Group)",s:"Launched in 2001 as Sony's internet-only bank; a multi-currency mainstay for Japan's savers that later pushed into Web3 products."},
"AMP Bank GO":{l:"Australian ADI (AMP Bank Limited)",s:"AMP Bank rebuilt from a mortgages-and-savings lender into a transactional digital bank for Australia's solopreneurs, on Starling's Engine."},
"Always.bank":{l:"FDIC-insured national bank charter (22nd State Banking Company)",s:"Century-old Alabama community bank 22nd State launched Always.bank as a nationwide advisory-first digital SMB bank."},
"Haventree Bank":{l:"Schedule I Canadian bank (CDIC member)",s:"A broker-channel alternative mortgage lender that built its own platform to go direct-to-consumer as a complementary savings home."},
"Esh Bank":{f:"Nir Zuk, Yuval Aloni",l:"Bank of Israel banking license (2022)",s:"Licensed by the Bank of Israel in 2022 (identifier No. 3), rolling out to the public with a patented model that returns half of interest income to customers."},
"Blink":{l:"Bank-owned neobank on Capital Bank of Jordan's banking license",s:"Launched in 2022 on Codebase Technologies' Digibanc platform with a swipe-based, social-media-style UI for Jordan's underbanked youth."},
"Reah":{l:"Self-custodial treasury; fiat accounts via partner banks (pre-launch)",s:"Founded 2025 in Menlo Park (CEO Charles Wayn) as an agentic onchain banking OS for global businesses; currently pre-launch / waitlist."},
/* US */
"Chime":{f:"Chris Britt, Ryan King",l:"Partner banks (The Bancorp, Stride)",m:"~$2.3B raised",s:"Built to end overdraft fees for paycheck-to-paycheck America; grew on two-day-early wage access and fee-free SpotMe."},
"Varo":{f:"Colin Walsh",l:"National bank charter (2020)",m:"~$1B raised",s:"Spent three years and ~$100M to become the first US consumer fintech granted its own national bank charter."},
"Current":{f:"Stuart Sopp",l:"Partner banks (Choice, Cross River)",m:"~$400M raised",s:"Started as a teen debit card, expanded to full-spectrum banking for Americans living paycheck to paycheck."},
"SoFi":{ai:"interface",f:"Mike Cagney, Dan Macklin, James Finnigan, Ian Brady",l:"National bank charter (2022)",m:"Public (SOFI)",s:"From Stanford alumni-funded student loans to a chartered digital bank; issued SoFiUSD stablecoin in Dec 2025."},
"Ally Bank":{f:"GMAC heritage",l:"National bank charter",m:"Public (ALLY)",s:"Born from GMAC's 2009 rebrand into a branchless bank; proof digital-only could scale before the fintech era."},
"Albert":{l:"Partner banks (Sutton Bank, Stride Bank; savings via Coastal Community Bank, Wells Fargo)",ai:"interface"},
"NorthOne":{l:"Partner bank (The Bancorp Bank, N.A.); Mastercard business debit"},
"C24 Bank":{l:"Full German banking license (BaFin); CHECK24 subsidiary"},
"Indy":{l:"Accounts via Swan, ACPR-licensed e-money institution (France); French IBAN"},
"Fortuneo":{l:"Crédit Mutuel Arkéa banking license (ACPR, France); brand of the group's online bank"},
"Tinaba":{l:"Partner bank (Banca Profilo, Bank of Italy register no. 5271); Tinaba is the tech layer"},
"Openbank":{l:"Full banking license within Santander Group (ECB/Bank of Spain); US via Santander Bank N.A."},
"Paysera":{l:"E-money institution license (Bank of Lithuania, 2012); EEA passported"},
"Cuenca":{l:"IFPE license (CNBV, Mexico, 2021) under Ley Fintech"},
"Movii":{l:"SEDPE e-money license (Superintendencia Financiera, Colombia)"},
"TNEX":{l:"Operates under Maritime Bank's (Vietnam) banking license as its digital bank"},
"Liv.":{l:"Operates under Emirates NBD's banking license (CBUAE) as its digital bank"},
"CEX.IO Card":{l:"MSB (FinCEN) + US state money-transmitter licenses; UK FCA cryptoasset registration; EU VASP (Lithuania)"},
"Trustee Plus":{l:"Lithuanian VASP (UAB Trustee Global); pursuing MiCA CASP license after Jan 2026 wind-down"},
"Meru":{l:"MSB registration (FinCEN, R3mit Solutions Inc.); USDC accounts via licensed US/EU partners"},
"Zak":{l:"Operates under Bank Cler's Swiss banking license (FINMA)"},
"Paytm":{l:"UPI TPAP riding on partner banks (Axis, Yes Bank, SBI, HDFC); wallet wound down with bank unit"},
"DANA":{l:"E-money issuer license (Bank Indonesia)"},
"Touch 'n Go eWallet":{l:"E-money issuer license (Bank Negara Malaysia)"},
"Allica Bank":{l:"Full UK banking license (PRA/FCA authorised)"},
"Northmill":{l:"Swedish banking license (Finansinspektionen, since 2019)"},
"Flowe":{l:"E-money institution (IMEL, Bank of Italy, 2019); founded by Banca Mediolanum"},
"imagin":{l:"Operates under CaixaBank's Spanish banking license (ECB/Bank of Spain supervised)"},
"RappiPay":{l:"Finance company charter (compania de financiamiento, SFC Colombia, 2022); Rappi-Davivienda JV; Fogafin-insured"},
"NG.cash":{l:"Payment institution (Banco Central do Brasil, e-money issuer license, May 2025)"},
"RazorpayX":{l:"Partner banks (RBL, ICICI, Yes, Axis, IDFC First); Razorpay holds RBI payment aggregator license"},
"SpectroCoin":{l:"Crypto VASP (Lithuania); e-money IBANs and Visa cards via UAB Pervesk (Bank of Lithuania EMI No. 17)"},
"Plutus":{l:"E-money card via Modulr (FCA EMI; Lithuanian EMI for EEA); PLU rewards self-custodial"},
"UR":{l:"Swiss fintech banking license (Art. 1b Banking Act, FINMA; SR Saphirstein AG); tokenized deposits"},
"Baraka":{l:"DFSA-regulated investment firm (DIFC, ref. 4153); broker-led model, execution via licensed partners"},
"AllScale":{l:"Self-custodial stablecoin platform; not a bank; compliance and settlement via licensed partners"},
"GrabPay":{l:"Major payment institution (MPI) license (MAS Singapore, PS20200167); e-money issuer"},
"Till Financial":{l:"Partner bank (Coastal Community Bank); FDIC pass-through; Visa debit cards"},
"Suits Me":{l:"E-money accounts issued by PrePay Technologies (FCA EMI, FRN 900010); Suits Me acts as agent/programme manager"},
"Fyrst":{l:"Brand of Deutsche Bank AG — full German banking license (ECB/BaFin); Postbank rails"},
"Rocker":{l:"Operates under Bankaktiebolaget Nordiska's Swedish banking license (Finansinspektionen); own PI license returned Sep 2025"},
"buddybank":{l:"UniCredit S.p.A. digital service — operates under UniCredit's Italian banking license (ECB supervised)"},
"MyInvestor":{l:"Own Spanish banking license (MyInvestor Banco S.A., Banco de España no. 1544; Andbank group); CNMV supervised"},
"Snappi":{l:"Full ECB banking license (via Bank of Greece, Jun 2024); Piraeus-backed digital bank"},
"Fondeadora":{l:"SOFIPO license (Fondea Technologies S.F.P., CNBV Mexico, ex-Apoyo Múltiple); Prosofipo deposit insurance"},
"Zinli":{l:"Registered e-money issuer (MFTECH S.A.) with Superintendencia de Bancos de Panamá — AML/CFT supervision only"},
"Bitget Card":{l:"Exchange VASP registrations (Lithuania, Bulgaria, Poland, Czechia); cards via issuer partners (DCS, Fiat24, Immersve)"},
"XPlace":{l:"Self-custodial (non-custodial Solana smart contracts); cards issued via Rain (Signify Holdings) under Visa license"},
"Nyla":{l:"Partner banks — tech company, not a bank; launching in Ghana via a licensed commercial bank (Islamic window)"},
"GoPay":{l:"E-money issuer licensed by Bank Indonesia (PT Dompet Anak Bangsa, since 2014); PJP Category 1; Bank Jago partner"},
"Zempler Bank":{l:"Full UK banking license (PRA/FCA, Feb 2021, ex-Cashplus); FSCS-protected"},
"Hello bank!":{l:"Operates under BNP Paribas' French banking license (direct-bank brand)"},
"Hype":{l:"E-money institution (IMEL, Banca d'Italia); being merged into Banca Sella (2026)"},
"isybank":{l:"Own Italian banking license (Intesa Sanpaolo group; ECB/Banca d'Italia supervised)"},
"ZEN.com":{l:"E-money institution (Bank of Lithuania, LB000457, 2018)"},
"Hey Banco":{l:"Own Mexican banking license (CNBV banca múltiple); independent of Banregio since Jan 2026"},
"Daviplata":{l:"Operates under Banco Davivienda's Colombian banking license (SFC-supervised)"},
"Qik":{l:"Full banking license (banco múltiple, Dominican Republic, Oct 2022; Grupo Popular)"},
"Nagad":{l:"Mobile money license (Bangladesh Bank MFS, with Bangladesh Post Office); 2024 digital-bank license under review"},
"KuCard":{l:"Card issued by Wallester AS (Estonian payment institution); KuCoin EU holds Austrian MiCA CASP license"},
"Tap Global":{l:"Gibraltar DLT/VASP license (GFSC, No. 25532); cards via Transact Payments EMI"},
"Kolo":{l:"AIFC FinTech Lab license (Kazakhstan) + Polish VASP; cards issued by Banco Popular de Puerto Rico"},
"Bling":{l:"E-money distributor of Treezor (ACPR-licensed French EMI, Société Générale group)"},
"Munify":{l:"US accounts via partner banks; in-principle DFSA license approval (UAE, Nov 2025)"},
"PhonePe":{l:"RBI PPI wallet (e-money issuer) + payment aggregator license (2025); IRDAI insurance broking"},
"OVO":{l:"Bank Indonesia e-money license (PT Visionet Internasional, 2017); QRIS + funds-transfer licenses"},
"ZaloPay":{l:"Licensed payment institution (SBV intermediary payment services license 04/GP-NHNN); Zion/VNG e-wallet"},
"Marcus":{l:"Goldman Sachs Bank USA national bank charter (OCC); Member FDIC"},
"EQ Bank":{l:"Trade name of Equitable Bank, Schedule I chartered bank (OSFI, Canada); CDIC member"},
"Vision Bank":{l:"Full Saudi digital bank license (SAMA); full operations approved Sep 2025"},
"Beyon Money":{l:"CBB-licensed payment institution group (Batelco Financial Services: PSP/AISP/PISP; BRS money changer; investment Cl.2)"},
"Fasset":{l:"VARA VASP license (Dubai, broker-dealer); provisional Islamic digital-bank license in Malaysia"},
"Moneco":{l:"Accounts and cards via regulated EMI partners (Europe/US); Moneco Canada registered with FINTRAC"},
"OakNorth":{l:"Full UK banking license (PRA/FCA, 2015)",ai:"underwriting"},
"TrueMoney":{l:"E-money license (Bank of Thailand) via Ascend Money; local e-money/payments licenses across 7 SEA markets",ai:"underwriting"},
"GCash":{l:"E-money issuer license (EMI-NBFI, Bangko Sentral ng Pilipinas) via G-Xchange Inc.; Mynt group",ai:"underwriting"},
"Nequi":{l:"Licensed compañía de financiamiento (Superfinanciera Colombia); spun out of Bancolombia's banking license",ai:"underwriting"},
"MoMo":{l:"Intermediary payment services / e-wallet license from State Bank of Vietnam; mobile money super-app",ai:"underwriting"},
"Freo":{l:"In-house RBI-licensed NBFC; savings and accounts via partner banks (Equitas, Yes Bank)",ai:"underwriting"},
"Dave":{ai:"underwriting",f:"Jason Wilk",l:"Partner bank (Evolve)",m:"Public (DAVE)",s:"Pitched as the bear that fights the banks: cash advances against overdrafts, then a full spending account."},
"MoneyLion":{ai:"underwriting",f:"Dee Choubey",l:"Partner banks",m:"Public; acquired by Gen Digital (2025)"},
"One":{f:"Walmart x Ribbit venture",l:"Partner bank (Coastal Community)",m:"Walmart-majority",s:"Walmart's play to own everyday banking for its 150M weekly shoppers; BNPL + debit + high-yield savings in one app."},
"Step":{f:"CJ MacDonald",l:"Partner bank (Evolve)",m:"~$175M+ raised",s:"Teen banking that builds credit history before 18 via a secured spend card."},
"Greenlight":{f:"Tim Sheehan, Johnson Cook",l:"Partner bank (Community Federal)",m:"~$550M raised"},
"Copper":{l:"Partner bank (Evolve Bank & Trust); relaunched family banking after 2024 Synapse collapse",f:"Eddie Behringer, Stefan Berglund",m:"~$40M raised"},
"GoHenry":{l:"Partner bank (Community Federal Savings Bank, US); UK cards via FCA-regulated e-money issuer",f:"Louise Hill, Dean Brauer",m:"Acquired by Acorns (2023)",s:"UK parents crowdfunded a kids' money app that taught a generation pocket-money-by-chores."},
"Mercury":{ai:"interface",f:"Immad Akhund",l:"Partner banks (Choice, Column)",m:"~$450M (val ~$3.5B)",s:"Startup banking that absorbed half of YC after SVB collapsed; added IO cards and personal banking."},
"Brex":{f:"Henrique Dubugras, Pedro Franceschi",l:"Partner banks",m:"~$1.5B raised",s:"Two Brazilian teens who sold a payments company before 20 rebuilt corporate cards around startup underwriting."},
"Ramp":{f:"Eric Glyman, Karim Atiyeh, Gene Lee",l:"Partner banks",m:"~$1B+ (val ~$22B, 2025)",s:"Spend management that markets itself on saving companies money; among the fastest-growing SaaS-fintechs ever."},
"Novo":{l:"Partner bank (Middlesex Federal Savings, F.A.); Mastercard debit; credit card via Continental Bank",f:"Michael Rangel, Tyler McIntyre",m:"~$170M raised"},
"Bluevine":{l:"Partner bank (Coastal Community Bank) + sweep-network program banks (up to $3M FDIC); credit line via Celtic Bank",f:"Eyal Lifshitz",m:"~$770M incl. debt"},
"Relay":{l:"Partner bank (Thread Bank, Member FDIC); previously Evolve Bank & Trust",f:"Yoseph West",m:"~$100M raised"},
"Rho":{l:"Partner bank (Webster Bank, N.A.); savings swept across 400+ FDIC banks via ADM",f:"Everett Cook, Alex Wheldon",m:"~$205M raised"},
"Grasshopper":{l:"National bank charter (de novo 2019)"},
"Found":{l:"Partner bank (Lead Bank); FDIC pass-through up to $250k; formerly Piermont Bank",m:"~$70M raised"},
"Lili":{l:"Partner bank (Sunrise Banks, N.A.); wires via Column Bank; formerly Choice Financial",f:"Lilac Bar David, Liran Zelkha",m:"~$80M raised"},
"Karat":{l:"Partner bank (Grasshopper Bank, N.A.); Karat Visa credit card issued by Cross River Bank",f:"Eric Wei, Will Kim",m:"~$100M+ incl. debt",s:"Underwrites creators on audience data instead of FICO."},
"Branch":{l:"Partner banks (Lead Bank; Evolve Bank & Trust); Mastercard debit for workforce payouts",f:"Atif Siddiqi",m:"~$100M+ raised"},
"Panacea Financial":{l:"Division of Primis Bank (NASDAQ: FRST) — operates under Primis's US bank charter; FDIC-insured",f:"Michael Jerkins, Ned Palmer",s:"Founded by two physicians who couldn't get loans during residency; banking for doctors, dentists and vets."},
"Purple":{l:"Partner bank (OMB Bank, Member FDIC); Mastercard debit issued by OMB Bank",f:"John Ciocca",s:"Banking for people with disabilities designed not to endanger ABLE benefit eligibility."},
"True Link":{l:"Partner bank (Sunrise Banks, N.A.); True Link Visa prepaid cards",f:"Kai Stinchcombe, Claire McDonnell",s:"Prepaid cards with guardrails protecting seniors from fraud and financial abuse."},
"Charlie":{l:"Partner bank (Sutton Bank); Visa debit; FDIC pass-through insurance",f:"Kevin Nazemi",m:"~$23M raised",s:"Banking for the 62+ crowd: early Social Security access and fraud protection over rewards points."},
"Greenwood":{l:"Partner bank (Coastal Community Bank); Mastercard debit; FDIC pass-through",f:"Ryan Glover, Killer Mike, Andrew Young",m:"~$40M+ raised",s:"Named for Tulsa's Black Wall Street; digital banking recirculating capital in Black and Latino communities."},
"MoCaFi":{l:"Partner bank (Sunrise Banks, N.A., Member FDIC) for accounts and Mastercard debit",f:"Wole Coaxum",m:"~$30M+ raised",s:"Ex-JPMorgan banker's answer to Ferguson: closing the racial wealth gap via public-sector disbursement rails."},
"Majority":{l:"Partner bank (Axiom Bank, N.A.); Visa debit; credit card issued by WebBank",f:"Magnus Larsson",m:"~$100M+ raised",s:"Membership banking for migrants: no SSN required, community advisors, bundled calling + remittance."},
"Zolve":{l:"Partner bank (Community Federal Savings Bank); deposits, debit and credit cards",f:"Raghunandan G",m:"~$300M incl. debt",s:"Credit cards for Indians landing in the US, underwritten on home-country data before they have a FICO."},
"Comun":{l:"Partner bank (Community Federal Savings Bank); Visa debit; FDIC pass-through",f:"Andres Santos, Abiel Gutierrez",m:"~$50M+ raised",s:"Built by Mexican founders for Latino immigrants: passport onboarding and fast remittance."},
"Ellevest":{l:"SEC-registered investment adviser; Partner bank (Coastal Community Bank) for cash accounts",f:"Sallie Krawcheck, Charlie Kroll",m:"~$150M raised",s:"Wall Street veteran Sallie Krawcheck's bet that investing designed around women's pay curves and lifespans closes the gender money gap."},
"First Women's Bank":{f:"Marianne Markowitz + founding team",l:"National bank charter",s:"The first US bank founded by women, led by women, focused on lending to women-owned businesses."},
"Robinhood":{ai:"interface",f:"Vlad Tenev, Baiju Bhatt",l:"Broker-dealer + partner banks; state crypto licenses",m:"Public (HOOD)"},
/* Canada */
"KOHO":{f:"Daniel Eberhard",m:"~C$400M raised",l:"Pursuing Schedule 1 bank license"},
"Neo Financial":{l:"Partner banks (Peoples Bank of Canada, Concentra Bank); CDIC-insured deposits",f:"Andrew Chau, Jeff Adamson",m:"~C$400M raised",s:"SkipTheDishes founders' second act: cashback-network banking from Calgary."},
"Wealthsimple":{l:"Broker-led: CIRO-registered investment dealer (WSII); cash held at CDIC member banks",f:"Michael Katchen, Brett Huneycutt",m:"Power Corp-backed; ~C$1B+",s:"Canada's index-investing evangelist turned full-stack money app with crypto."},
"Mogo":{l:"Cards issued by Peoples Trust Company; MogoTrade is a CIRO-regulated broker (Canada)",f:"David Feller, Greg Feller",m:"Public (MOGO)"},
/* UK */
"Monzo":{f:"Tom Blomfield + 4 co-founders",l:"UK banking license",m:"~£1.1B raised",s:"The hot-coral card that made banking a brand; born from the Mondo prepaid beta and a record 96-second crowdfund."},
"Starling Bank":{ai:"interface",f:"Anne Boden",l:"UK banking license",m:"~£900M raised",s:"Anne Boden left a 30-year banking career at 54 to build the UK's first consistently profitable neobank."},
"Atom Bank":{f:"Anthony Thomson, Mark Mullen",l:"UK banking license"},
"Zopa Bank":{ai:"underwriting",f:"Giles Andrews, James Alexander",l:"UK banking license (2020)",m:"~$1B raised",s:"Invented P2P lending in 2005, then traded the model for a full bank license."},
"Chase UK":{l:"UK subsidiary of JPMorgan"},
"Kroo":{f:"Nazim Valimahomed",l:"UK banking license"},
"Tide":{f:"George Bevis",l:"E-money; deposits via ClearBank",m:"~$300M raised"},
"ANNA Money":{f:"Eduard Panteleev, Boris Dyakonov",l:"E-money"},
"Curve":{l:"E-money institution (FCA UK, FRN 900926); EEA via Curve Europe UAB EMI (Bank of Lithuania)",f:"Shachar Bialick",m:"~$250M raised"},
"Monese":{l:"FCA-authorised e-money institution (FRN 900960); UK accounts as agent of PrePay Technologies; owned by Pockit",f:"Norris Koppel",m:"~$200M raised",s:"An Estonian founder rejected by UK banks built no-credit-history onboarding for migrants; consumer app later folded into B2B platform XYB."},
"Pockit":{l:"E-money via FCA-authorised EMIs (Modulr, PSI-Pay); owns Monese's EMI license",f:"Virraj Jatania",s:"Accounts for the UK's financially excluded; absorbed Monese's consumer base."},
"Tandem Bank":{l:"UK banking license",s:"Pivoted from challenger #2 to a green lender financing home decarbonisation."},
"Algbra":{l:"E-money institution (FCA, FRN 952360, UK)",f:"Zeiad Idris, Fizel Nejabat",s:"Shariah-compliant, values-based finance for the two billion people underserved on ethics."},
"Wahed":{l:"SEC-registered investment adviser; broker/custody via Apex Clearing (FINRA/SIPC)",f:"Junaid Wahedna",m:"~$75M raised"},
"Kestrl":{l:"Accounts and cards issued by AF Payments Ltd, FCA-authorised e-money institution (FRN 900440)",f:"Areeb Siddiqui, Daeng Termizi",s:"Muslim money app helping users grow wealth without interest."},
/* Europe */
"N26":{f:"Valentin Stalf, Maximilian Tayenthal",l:"German banking license",m:"~$1.8B raised",s:"Berlin's minimalist bank that scaled across the EU, retreated from UK/US, and finally reached profitability."},
"bunq":{ai:"interface",f:"Ali Niknam",l:"Dutch banking license",m:"Founder-funded (~€100M of Niknam's own) + raises",s:"Ali Niknam bootstrapped the Netherlands' first new banking license in 35 years with his own money."},
"Vivid Money":{l:"E-money institution (Vivid Money S.A., CSSF Luxembourg + DNB branch); AFM investment firm; MiCAR CASP (2025)",f:"Alexander Emeshev, Artem Yamanov",m:"~$200M+ raised"},
"Tomorrow":{l:"Partner bank (Solaris SE, full German banking license, BaFin-supervised)",f:"Inas Nureldin, Jakob Berndt, Michael Schweikart",s:"Hamburg social business: card spend funds climate projects."},
"Kontist":{l:"Partner bank (Solaris SE, BaFin-licensed); German IBAN accounts",f:"Christopher Plantener",s:"Freelancer banking that auto-reserves German taxes in real time."},
"Qonto":{ai:"interface",f:"Alexandre Prot, Steve Anavi",l:"Payment institution (ACPR); pursuing credit license",m:"~€620M raised",s:"Europe's SME banking leader out of Paris; absorbed Penta to own the German market too."},
"Shine":{l:"Payment institution (ACPR n°71758, France); funds safeguarded at Société Générale",f:"Nicolas Reboud, Raphaël Simon",m:"Acquired by SocGen (2020), later Ageras"},
"Sumeria (Lydia)":{l:"E-money institution (Lydia Solutions, ACPR France, CIB 17598); credit-institution license applied for",f:"Cyril Chiche, Antoine Porte",m:"~€260M raised",s:"France's 'send me a Lydia' P2P verb rebranded to Sumeria to become a real current account."},
"Nickel":{l:"Payment institution (Financière des Paiements Électroniques, ACPR no. 16598); BNP Paribas subsidiary",f:"Hugues Le Bret, Ryad Boulanouar",m:"Acquired by BNP Paribas (2017)",s:"Opened accounts through 6,500 tobacco shops — banking where French banks refused to go."},
"BoursoBank":{l:"Bank (Société Générale)"},
"Lunar":{ai:"interface",f:"Ken Villum Klausen",l:"Danish banking license",m:"~$500M raised"},
"indó":{f:"Haukur Skúlason, Tryggvi Björn Davíðsson",l:"Icelandic banking license"},
"Trade Republic":{f:"Christian Hecker, Thomas Pischke, Marco Cancellieri",l:"German full banking license (2023)",m:"~€1.2B raised",s:"Berlin broker that pays ECB rate on cash and hands out 1% saveback — a bank disguised as a savings plan."},
"Finom":{l:"E-money institution (FINOM Payments B.V., DNB Netherlands); EU/EEA passporting",f:"Ex-Modulbank team (Novikov, Laguta, Petrov, Stiskin)",m:"~€180M raised"},
"Wise":{f:"Kristo Käärmann, Taavet Hinrikus",l:"E-money/payment licenses globally",m:"Public (WISE.L)",s:"Two Estonians tired of hidden FX fees built mid-market-rate transfers; now moving £100B+ a year.",a:["EU","NA","ASIA","OC","LATAM","AF","MENA"]},
"Klarna":{ai:"interface",f:"Sebastian Siemiatkowski, Niklas Adalberth, Victor Jacobsson",l:"Swedish banking license",m:"Public (KLAR, 2025)"},
"Salt Bank":{l:"Bank (Banca Transilvania)"},
"Papara":{l:"E-money institution (CBRT, Turkey); license revoked Oct 2025, reinstated under state trusteeship",f:"Ahmed Karslı",m:"Profitable; acquired SadaPay (2024)",s:"Istanbul's fintech champion: 17M users and an M&A run across Turkey and Pakistan."},
"Enpara":{l:"Bank (QNB Finansbank)"},
"Monobank":{f:"Oleh Gorokhovskyi, Mykhailo Rogalskyi",l:"Operates on Universal Bank license",m:"Bootstrapped, profitable",s:"Built by the ex-PrivatBank team; kept Ukraine's payments running through blackouts and full-scale war, with a cat mascot."},
"T-Bank":{ai:"interface",f:"Oleg Tinkov (exited 2022)",l:"Russian banking license",m:"Public (MOEX)",s:"Tinkov built the world's largest standalone digital bank from a credit-card mailer; sanctions forced his exit."},
"Kaspi":{f:"Mikheil Lomtadze, Vyacheslav Kim",l:"Kazakh banking license",m:"Public (KSPI)",s:"Turned a distressed Kazakh bank into a super-app processing most of the country's payments and e-commerce."},
"Uzum":{l:"Bank license (UZ)"},
"TBC UZ":{ai:"underwriting",l:"Bank (TBC Group)",m:"Public parent (TBCG.L)"},
"Alpian":{f:"Schuyler Weiss",l:"Swiss banking license",m:"~CHF200M+ raised"},
"Yuh":{f:"Swissquote x PostFinance JV",l:"On Swissquote's banking license"},
"neon":{f:"Jörg Sandrock + team",l:"Partner: Hypothekarbank Lenzburg"},
"Pixpay":{l:"E-money distributor — agent of Treezor (ACPR-licensed EMI, Société Générale group); acquired by GoHenry/Acorns",f:"Benoit Grassin, Nicolas Klein, Caroline Ménager",m:"Acquired by GoHenry (2022)"},
/* LatAm */
"Nubank":{ai:"underwriting",f:"David Vélez, Cristina Junqueira, Edward Wible",l:"Bank licenses BR/MX/CO; conditional US OCC approval (2026)",m:"Public (NU)",s:"Started after David Vélez's kafkaesque São Paulo branch visit; now Latin America's most valuable financial institution with 100M+ customers."},
"Ualá":{ai:"underwriting",f:"Pierpaolo Barbieri",l:"Bank licenses (AR via Wilobank, MX via ABC Capital)",m:"~$1B+ raised incl. $195M round (Mar 2026) at $3.2B",s:"Buenos Aires historian-turned-founder set out to bank every Argentine teenager; now ~1 in 5 Argentine adults use it, with 11M+ customers across AR/MX/CO."},
"Plata":{ai:"underwriting",f:"Neri Tollardo (CEO) + ex-Tinkoff team",l:"Full Mexican bank license (Banco Plata, Mar 2026); Colombia Compañía de Financiamiento authorized",m:"$405M Series C at $5B (Apr 2026, Bicycle Capital, QIA, BTG Pactual) — $2B+ debt & equity total",s:"The Tinkoff playbook replayed in Mexico: proprietary core banking + AI risk engine built by 800 STEM hires, 750K first-time cardholders, $800M loan book — LatAm's most valuable private digital bank three years after founding."},
"albo":{l:"IFPE license (CNBV, Mexico, 2022) — e-money institution under Ley Fintech",f:"Ángel Sahagún",m:"~$150M+ raised"},
"Klar":{l:"SOFIPO license (CNBV, Mexico); acquiring Bineo for its bank license, approvals pending",ai:"underwriting",f:"Stefan Möller, Daniel Autrique",m:"~$500M incl. debt"},
"Stori":{ai:"underwriting",f:"Bin Chen, Marlene Garayzar + 3",l:"Sofipo (MX)",m:"~$550M incl. debt",s:"Credit cards for the 60% of Mexicans banks reject; unicorn built on inclusion economics."},
"Neon":{l:"Payment institution / e-money issuer authorised by Banco Central do Brasil (2021); Neon CTVM brokerage",ai:"interface",f:"Pedro Conrade",m:"~$700M raised"},
"C6 Bank":{ai:"interface",f:"Marcelo Kalim, Carlos Fonseca (ex-BTG)",l:"Bank license (BCB)",m:"JPMorgan ~46% owner"},
"Banco Inter":{ai:"interface",l:"Bank; Public (INTR)"},
"PicPay":{ai:"interface",f:"Anderson Chamon + J&F group",l:"Payment institution + bank (BCB)"},
"PagBank":{l:"Bank; Public (PAGS)"},
"Cora":{l:"SCFI license (Central Bank of Brazil, Jul 2024) + payment institution; formerly SCD",f:"Igor Senra, Leo Mendes",m:"~$200M raised"},
"Naranja X":{l:"Bank (Grupo Galicia)"},
"Brubank":{f:"Juan Bruchou",l:"Bank license (BCRA)"},
"Lulo Bank":{l:"Bank license (CO)"},
"Tenpo":{f:"Krealo (Credicorp)",l:"Preparing Chilean bank license"},
"Global66":{l:"Prepaid-card e-money issuer license (CMF, Chile); cross-border FX via Global 81 SpA",f:"Tomás Bercovich",m:"~$65M raised"},
"Mercado Pago":{ai:"underwriting",f:"Marcos Galperin (MELI)",l:"Payment/fintech licenses region-wide; pursuing MX bank license",m:"Public (MELI)",s:"MercadoLibre's payments arm became LatAm's default wallet; issues the Meli Dollar stable token in Brazil.",a:["LATAM"]},
"DolarApp":{l:"Digital-dollar (USDC) accounts on regulated partner banks' and custodians' rails; rebranded ARQ 2026",f:"Fernando Terrés, Zach Garman (ex-Revolut)",m:"~$60M+ raised",s:"Digital-dollar accounts (USDc) that let LatAm users escape peso volatility with a card."},
"Littio":{l:"On/off-ramp + issuer partners; USD via onchain treasuries"},
"Airtm":{l:"MSB registration (FinCEN, No. 31000329787639); USDC-based dollar wallet",f:"Ruben Galindo, Antonio García",m:"~$70M raised"},
"Félix":{l:"US money transmitter — state licenses (NMLS 2302775); agent of UniTeller/Intermex; USDC rails via Bitso",ai:"interface",f:"Manuel Godoy",m:"~$45M raised",s:"Send dollars home over WhatsApp; stablecoin rails under a chat interface."},
"Lemon":{l:"Registered VASP/PSAV (CNV Argentina, No. 162); payment account via Digifin S.A.",f:"Marcelo Cavazzoli, Borja Martel",m:"~$60M raised",s:"Argentina's crypto card leader, born in a Patagonian town, scaled on stablecoin savings culture."},
"Belo":{l:"VASP registration (CNV PSAV No. 52, Argentina, Jul 2024)",f:"Manuel Beaudroit",m:"~$10M raised"},
"Ripio":{l:"VASP: PSAV registration with CNV Argentina (Nos. 36/37, 2024); regional entities in BR/MX",f:"Sebastián Serrano",m:"~$90M raised"},
"Buenbit":{l:"VASP — registered PSAV with CNV (Argentina); stablecoin-focused exchange + card",f:"Federico Ogue",m:"~$11M raised"},
"Bitso":{f:"Daniel Vogel, Pablo González, Ben Peters",l:"IFPE (MX) + regional VASP licenses",m:"~$400M (val $2.2B)",s:"Mexico's first crypto unicorn; powers a meaningful share of US–MX remittances over stablecoin rails."},
"Nomad":{l:"Partner bank (Community Federal Savings Bank, US); FX via Ouribank (Brazil)",f:"Lucas Vargas, Patrick Sigrist",m:"~$60M raised"},
"UglyCash":{l:"US MSB + issuer partners"},
"El Dorado":{f:"Guillermo Goncalvez",s:"USDT P2P marketplace that became Venezuela's parallel dollar bank, expanding across the Andean region."},
"Prex":{l:"E-money (UY/AR/PE)"},
"ueno bank":{l:"Bank license (PY)"},
/* Africa */
"TymeBank":{f:"Coen Jonker + team",l:"SA banking license",m:"~$400M; unicorn (2024)",s:"Kiosk onboarding inside Pick n Pay stores cracked mass-market South African banking; now exporting the model to Asia."},
"Bank Zero":{f:"Michael Jordaan, Yatin Narsai",l:"Mutual bank license (SA)",s:"Ex-FNB CEO's zero-fee mutual bank built on its own core stack."},
"Discovery Bank":{ai:"interface",l:"SA banking license"},
"Kuda":{f:"Babs Ogundeyi, Musty Mustapha",l:"Microfinance bank (NG)",m:"~$90M raised",s:"'The bank of the free' — Nigeria's most-funded consumer neobank, now bridging NG↔UK remittance."},
"OPay":{f:"Yahui Zhou (Opera)",l:"Payment licenses (NG)",m:"~$570M raised",s:"Opera's super-app bet on Nigeria; 60M users via a massive street-agent network."},
"PalmPay":{ai:"underwriting",f:"Transsion-backed team",l:"Mobile money license (NG)"},
"Moniepoint":{ai:"underwriting",f:"Tosin Eniolorunda, Felix Ike",l:"MFB + switching licenses (NG)",m:"~$180M+; unicorn",s:"Started as agent-banking infrastructure, became the bank behind millions of Nigerian small businesses."},
"FairMoney":{ai:"underwriting",f:"Laurin Hainy, Matthieu Gendreau, Nicolas Berthozat",l:"Microfinance bank (NG)"},
"Carbon":{ai:"underwriting",f:"Chijioke Dozie, Ngozi Dozie",l:"Microfinance bank (NG)"},
"ALAT by Wema":{l:"Bank (Wema Bank)"},
"Sparkle":{f:"Uzoma Dozie",l:"Microfinance bank (NG)"},
"Umba":{l:"Microfinance bank license in Kenya (majority stake in Daraja MFB, CBK-approved 2022); Nigeria via partner bank",f:"Tiernan Kennedy, Barry O'Mahony",m:"~$20M raised"},
"Djamo":{l:"Microfinance license (BCEAO / Côte d'Ivoire MEF, Sep 2025 — first fintech); cards with partner banks",f:"Hassan Bourgi, Régis Bamba",m:"~$30M raised",s:"YC's first Ivorian startup; banking francophone West Africa's mobile-money generation."},
"Wave":{f:"Drew Durbin, Lincoln Quirk",l:"First non-telecom e-money issuer (BCEAO)",m:"~$300M+; unicorn",s:"Cut Senegal's mobile-money fees by ~70% with a Sendwave spin-out; francophone Africa's first unicorn."},
"Eversend":{l:"E-money issuer + PSP licenses (Bank of Uganda); FinCEN and FINTRAC registrations",f:"Stone Atwine"},
"Fingo":{l:"Partner bank (Ecobank Kenya); Central Bank of Kenya-approved product",f:"Kiiru Muhoya + team",m:"~$4M raised"},
"Branch Intl":{l:"Microfinance bank license in Kenya (84.9% of Century MFB, CBK-approved 2022); digital lending in NG/IN",ai:"underwriting",f:"Matt Flannery (Kiva co-founder), Daniel Jung",m:"~$260M raised"},
"Khazna":{l:"Pursuing Central Bank of Egypt digital-bank license (target mid-2026); lends via FRA-regulated entities",f:"Omar Saleh",m:"~$60M+ raised"},
"MNT-Halan":{l:"Microfinance and consumer finance licenses (FRA, Egypt); e-payments arm licensed by CBE",ai:"underwriting",f:"Mounir Nakhla, Ahmed Mohsen",m:"~$600M+ incl. debt; unicorn"},
"Flouci":{f:"Nebras Jemel, Anis Kallel, Rostom Bouazizi (Kaoun)",l:"Partner-bank model — BCT regulatory sandbox (1st cohort, 2020); not a bank",m:"~$2M raised",s:"Tunisia's financial super-app by Kaoun — free bank account + wallet with the first e-KYC and home-delivered card in the country."},
"Grey":{l:"MSB registrations (FinCEN US, FINTRAC Canada); accounts via licensed banking partners",f:"Idorenyin Obong, Femi Aghedo",m:"YC-backed"},
"PaySika":{f:"Roger Nengwe Ntafam, Stezen Bisselou-Nzengue",l:"Cards issued by Ecobank Cameroon under Visa license; PaySika Holding registered in France",m:"~$350K pre-seed (2021); Oui Capital's first Cameroon investment (2025)",s:"Two Cameroonian engineers who met in French engineering school built the region's first chatbot neobank — a 2020 pilot hit 275% month-over-month growth with zero marketing; now in Visa's Fast Track programme."},
"Cleva":{l:"MSB registration (FinCEN); USD accounts via licensed FDIC-insured US partner banks",f:"Tolu Alabi, Philip Abel",m:"YC-backed"},
"Yellow Card":{f:"Chris Maurice, Justin Poiroux",l:"Licensed/registered in 20+ African markets",m:"~$85M raised",s:"Two Auburn students' bitcoin kiosk became Africa's largest stablecoin on/off-ramp."},
"Bitnob":{l:"VASP applicant under Nigeria SEC's ARIP (approval-in-principle track); licensed partners for rails",f:"Bernard Parah"},
"Chipper Cash":{l:"Licensed e-money/payments across Africa (CBN, BoG, BoU, BNR); 40+ US money-transmitter licenses; FCA EMI (UK)",f:"Ham Serunjogi, Maijid Moujaled",m:"~$300M raised",s:"Ugandan-Ghanaian founders built pan-African P2P; survived the FTX-investor winter and refocused on cards + crypto.",a:["AF","NA","EU"]},
"Onboard":{f:"Yele Bademosi",s:"Self-custody 'deobank' thesis from Lagos: your keys, your dollars, your card."},
"MiniPay":{f:"Opera (built on Celo)",s:"Opera's 2MB stablecoin wallet for the Global South: 10M+ wallets, PIX and Mercado Pago rails, USSD-light design.",a:["AF","LATAM","ASIA"]},
/* MENA */
"Telda":{f:"Ahmed Sabbah, Youssef Sholqamy",l:"CBE-regulated (Meeza)",m:"~$60M raised",s:"Founded by Swvl's ex-CTO; Egypt's first Gen-Z money app."},
"Wio Bank":{f:"ADQ, e&, FAB consortium",l:"UAE banking license"},
"Zand":{f:"Mohamed Alabbar-led group",l:"UAE banking license",s:"First fully digital UAE bank license; corporate arm banks the Gulf's crypto companies."},
"YAP":{l:"Partner bank (Ruya Community Islamic Bank, CBUAE-licensed; formerly RAKBANK)",f:"Marwan Hachem, Anas Zaidan"},
"Pyypl":{l:"FSRA (ADGM) money services license No. 170031; non-bank payment institution; also CBB Bahrain, AFSA Kazakhstan",f:"Antti Arponen",m:"~$60M raised"},
"NOW Money":{l:"E-money institution / Stored Value Facility license (Central Bank of UAE); funds safeguarded at UAE banks incl. CBI",f:"Katharine Budd, Ian Dillon",s:"Payroll accounts for Gulf migrant workers excluded from traditional banks."},
"Sarwa":{l:"FSRA-regulated (ADGM, UAE) investment platform; robo-advisory and broker services",f:"Mark Chahwan, Jad Sayegh, Nadine Mezher"},
"ila Bank":{l:"Bank (ABC Group)"},
"Tweeq":{l:"SAMA e-money license"},
"STC Bank":{l:"Digital bank license (SAMA)"},
"D360 Bank":{l:"Digital bank license (SAMA); PIF-backed"},
"One Zero":{ai:"interface",f:"Amnon Shashua (Mobileye founder)",l:"Israeli banking license",m:"~$500M raised",s:"Israel's first new bank in 40+ years, built around an AI private banker."},
"Mashreq Neo":{l:"Bank (Mashreq)"},
"Weyay":{l:"Bank (NBK)"},
"Pride Bank":{l:"Not a bank; payment arrangement on Digital Banks' rails (BaaS, Brazil)",f:"Márcio Orlandi Jr.",s:"Brazil's digital bank for the LGBTQ+ community, born from exclusion at traditional branches."},
/* Asia */
"KakaoBank":{ai:"underwriting",f:"Kakao consortium",l:"Internet-only bank license (KR)",m:"Public (KRX)",s:"Launched from Korea's dominant messenger; 300K accounts in 24 hours, profitable within two years."},
"Toss Bank":{ai:"underwriting",f:"Lee Seung-gun (Viva Republica)",l:"Internet-only bank license (KR)",m:"Viva Republica ~$1.7B raised",s:"A dentist-turned-founder failed eight startups before Toss; the bank arm now anchors Korea's super-app."},
"K bank":{l:"Internet-only bank license (KT-led)",s:"Korea's first internet bank; balance sheet supercharged by being Upbit's banking partner."},
"WeBank":{ai:"underwriting",f:"Tencent-led consortium",l:"Private bank license (CN)",s:"The world's largest digital bank: 400M+ customers on Tencent rails."},
"MYbank":{ai:"underwriting",f:"Ant Group-led",l:"Private bank license (CN)"},
"Jupiter":{l:"Partner bank (Federal Bank); RBI PPI license via parent Amica Financial Technologies",f:"Jitendra Gupta",m:"~$160M raised"},
"Niyo":{l:"Partner banks (SBM Bank India, DCB Bank) — RBI-regulated issuers; no own license",f:"Vinay Bagri, Virender Bisht",m:"~$180M raised"},
"slice":{ai:"underwriting",f:"Rajan Bajaj",l:"Small finance bank (via NESFB merger)",m:"~$340M raised",s:"Card-first startup that pulled off the rare feat of merging into a licensed Indian bank."},
"Open":{l:"Partner banks (ICICI, Axis, Yes Bank +); RBI-licensed payment aggregator",f:"Anish Achuthan + 3",m:"~$190M raised"},
"FamPay":{l:"Partner bank (IDFC FIRST Bank) — co-branded RBI prepaid payment instruments; RuPay/Visa cards",f:"Sambhav Jain, Kush Taneja",m:"~$42M raised"},
"Mahila Money":{l:"No own license; lends on RBI-licensed NBFC partners' rails (Capital Trade Links, RupeeCircle)",f:"Sairee Chahal",s:"From the SHEROES women's community to credit and accounts for women entrepreneurs in Bharat."},
"Oraan":{l:"SECP-registered; NBFC (non-bank finance company) license from SECP Pakistan for lending; digital ROSCAs",f:"Halima Iqbal, Farwah Tapal",s:"Digitized Pakistan's women-led savings committees (ROSCAs) into a regulated product."},
"SadaPay":{l:"E-money institution (EMI) license from State Bank of Pakistan; owned by Papara",f:"Brandon Timinsky",m:"~$20M; acquired by Papara"},
"NayaPay":{l:"E-money institution (State Bank of Pakistan EMI license, 2021)",f:"Danish Lakhani",m:"~$13M raised"},
"bKash":{ai:"underwriting",f:"Kamal Quadir",l:"MFS license (Bangladesh Bank)",m:"Ant + SoftBank-backed",s:"'bKash me' is a verb in Bangladesh: 70M users, the reference case for mobile money outside Africa."},
"GXS Bank":{ai:"underwriting",l:"Digital full bank (MAS)"},
"MariBank":{ai:"underwriting",l:"Digital full bank (MAS)"},
"Trust Bank":{l:"Bank (StanChart x FairPrice)"},
"ANEXT Bank":{ai:"underwriting",l:"Digital wholesale bank (MAS)"},
"Aspire":{f:"Andrea Baronchelli + 3",l:"MPI (MAS)",m:"~$300M raised"},
"YouTrip":{l:"Major Payment Institution (MPI) license from MAS, Singapore — e-money issuance; funds safeguarded at DBS/StanChart/UOB",f:"Caecilia Chu, Arthur Mak",m:"~$100M+ raised"},
"Tonik":{ai:"underwriting",f:"Greg Krasnov",l:"PH digital bank license",m:"~$140M+ raised"},
"Maya":{ai:"underwriting",f:"PLDT/Voyager (Orlando Vea)",l:"PH digital bank + EMI + VASP",m:"~$300M+ raised"},
"GoTyme Bank":{l:"PH digital bank license (Tyme x Gokongwei)"},
"UnionDigital":{l:"PH digital bank license"},
"UNO Digital Bank":{ai:"underwriting",l:"PH digital bank license"},
"Bank Jago":{l:"Bank (OJK); GoTo ecosystem"},
"SeaBank":{ai:"underwriting",l:"Bank (OJK); Sea Group"},
"Blu by BCA":{l:"Bank (BCA Digital)"},
"Allo Bank":{l:"Bank (OJK); CT Corp"},
"Superbank":{ai:"underwriting",l:"Bank (OJK); Grab/Emtek/Singtel"},
"Jenius":{l:"Bank (BTPN/SMBC)"},
"LINE BK":{l:"JV on KBank license"},
"Timo":{l:"Partner: Ban Viet Bank"},
"Cake":{ai:"underwriting",f:"Be Group x VPBank",l:"Partner: VPBank",s:"Digital bank inside Vietnam's ride-hailing app Be; 5M users in four years."},
"GXBank":{l:"Digital bank license (BNM); Grab-led"},
"AEON Bank":{l:"Islamic digital bank license (BNM)"},
"Boost Bank":{l:"Digital bank license (BNM); Axiata"},
"Ryt Bank":{ai:"interface",f:"YTL x Sea",l:"Digital bank license (BNM)",s:"Malaysia's AI-first bank: an LLM assistant as the primary interface."},
"PayPay Bank":{l:"Bank (JP); SoftBank ecosystem"},
"Minna Bank":{f:"Fukuoka FG",l:"Bank license (JP)",s:"Japan's first digital-native bank, built cloud-first."},
"Rakuten Bank":{ai:"underwriting",l:"Bank; Public (JP)"},
"LINE Bank TW":{l:"Virtual bank license (TW FSC)"},
"NEXT Bank":{l:"Virtual bank license (TW FSC)"},
"ZA Bank":{f:"ZhongAn Online",l:"HK virtual bank; SFC-aligned crypto services",s:"First Hong Kong virtual bank live; first to open retail crypto trading and to bank stablecoin issuers."},
"Mox Bank":{l:"HK virtual bank (StanChart JV)"},
"WeLab Bank":{ai:"underwriting",f:"Simon Loong",l:"HK virtual bank"},
"Airtel Payments Bank":{l:"Payments bank license (RBI)"},
"Jio Payments Bank":{l:"Payments bank license (RBI)"},
/* ANZ */
"Up":{f:"Ferocia (Dom Pym, Grant Thomas)",l:"On Bendigo & Adelaide Bank license",s:"Built by a tiny Melbourne studio; consistently Australia's most-loved banking app."},
"Judo Bank":{l:"ADI license",m:"Public (JDO)"},
"Hnry":{l:"Partner bank (ASB in NZ; Monoova/Cuscal in AU); registered tax agent, client accounts in own name",f:"James Fuller, Claire Fuller",m:"~A$70M raised",s:"Flat-fee 'never think about tax again' banking for NZ/AU sole traders."},
"Kit":{f:"CommBank x15ventures",l:"On CBA rails"},
"Douugh":{l:"Partner banks (Regional Australia Bank; US via Choice Bank)",m:"Public (ASX:DOU)"},
"Parpera":{l:"AFSL authorised representative (MSC Advisory AFSL 480649); accounts issued by Wise Australia (AFSL 513764)",f:"Daniel Cannizzaro"},
/* Hybrid majors */
"Revolut":{ai:"interface",f:"Nik Storonsky, Vlad Yatsenko",l:"UK banking license (2024); EU license (Lithuania)",m:"~$2B raised; val ~$75B",s:"From a fee-free FX card in Canary Wharf to a 50M-user global super-app; the UK license took nine years.",a:["EU","NA","OC","ASIA","LATAM"]},
"Cash App":{f:"Block (Jack Dorsey)",l:"Via Block's bank + BitLicense",m:"Public (XYZ)",s:"Square's P2P experiment became Block's consumer bank and America's biggest retail bitcoin on-ramp."},
"Venmo":{l:"PayPal's US state licenses (money transmitter, NMLS 910457); crypto via NYDFS trust company PayPal Digital",f:"Andrew Kortina, Iqram Magdon-Ismail",m:"PayPal (PYPL)"},
"Crypto.com":{f:"Kris Marszalek + 3",l:"MiCA CASP, MAS MPI, US MSBs",s:"Rebranded from Monaco after buying the crypto.com domain; the arena-naming-rights era of CeFi."},
"Coinbase Card":{ai:"agentic",f:"Brian Armstrong, Fred Ehrsam",l:"US state licenses, MiCA; Public (COIN)",m:"Public (COIN)"},
"Binance Card":{f:"Changpeng Zhao",l:"Jurisdiction-dependent VASP registrations"},
"Bybit Card":{f:"Ben Zhou",l:"VARA (Dubai) + regional"},
"OKX Card":{ai:"agentic",f:"Star Xu",l:"VARA, MiCA (Malta)"},
"Gemini Credit Card":{f:"Cameron & Tyler Winklevoss",l:"NYDFS trust",m:"Public (GEMI, 2025)"},
"Fold":{l:"Partner bank (Sutton Bank) issues Fold Visa prepaid card; BTC via Fortress Trust, BitGo-insured custody",f:"Will Reeves",m:"Public (FLD)"},
"BitPay Card":{l:"BitLicense (NYDFS) + FinCEN MSB + 20+ state money-transmitter licenses",f:"Tony Gallippi, Stephen Pair"},
"Strike":{l:"Money transmitter licenses + NY BitLicense (NYDFS, 2026); Zap Solutions, Inc.",f:"Jack Mallers",m:"~$90M raised",s:"Chicago Lightning evangelist turning bitcoin rails into invisible remittance infrastructure."},
"Xapo Bank":{f:"Wences Casares",l:"Gibraltar banking license",s:"Casares — patient zero of Silicon Valley bitcoin — built a private bank for BTC wealth after his family lost everything to Argentine devaluations."},
"Wirex":{l:"E-money institution (FCA, FRN 902025); crypto via Wirex Digital Services VASP (OAM Italy)",ai:"agentic",f:"Pavel Matveev, Dmitry Lazarichev"},
"Uphold":{l:"FinCEN MSB + state money-transmitter licenses (US); FCA-registered cryptoasset firm (UK)",f:"Halsey Minor (CNET founder)"},
"Nexo":{l:"EU VASP registrations; MiCA CASP application pending; EEA served via MiCA-licensed Tangany + DLT Finance",ai:"interface",f:"Antoni Trenchev, Kosta Kantchev"},
"Krak":{f:"Kraken",l:"US state licenses; MiCA (EU)",s:"Kraken's move from exchange to money app: spend, yield and P2P Kraktags on one balance."},
"Lava":{f:"Shehzan Maredia",m:"~$227M raised (Founders Fund, Khosla)",l:"Custodial (cold storage, distributed keys) since Sept 2025",s:"Started as self-custodial DLC loans, pivoted to custody after a $200M raise — the loudest custody U-turn in bitcoin fintech."},
"COCA":{f:"Pavel Matveev (Wirex co-founder)",l:"MPC self-custody; e-money card partners (UK/EU)",m:"Stellar Development Foundation-backed",s:"1M+ users in 75 countries; 'self-banking' — EUR IBAN and card on a wallet only the user controls."},
"KAST":{l:"Runs on licensed partners' rails: custody via BitGo/Fireblocks, Visa cards via licensed issuers; not a bank",m:"~$70M+ at ~$600M valuation (2026)",s:"Stablecoin-native neobank for the dollar-hungry global middle class; premium metal tiers, HK roots."},
"RedotPay":{l:"Hong Kong MSO, money lender + TCSP licenses; VASP (RedotX UAB, Lithuania FCIS); MSB registrations (US/Canada)",ai:"agentic",f:"Michael Gao",m:"~$90M raised",s:"Hong Kong crypto-card factory reportedly carrying ~60% of global crypto-card volume by 2026."},
"Bitpanda":{f:"Eric Demuth, Paul Klanschek, Christian Trummer",l:"MiCA (AT); BaFin licenses",m:"~$500M; unicorn"},
"eToro Money":{l:"Broker-led; e-money institution (eToro Money UK, FCA FRN 900203; eToro Money Malta, MFSA)",ai:"interface",f:"Yoni Assia, Ronen Assia, David Ring",m:"Public (ETOR)"},
"CoinJar":{l:"VASP registrations (AUSTRAC DCE, Australia; FCA cryptoasset, UK); card issued by EML (AFSL 404131)",f:"Asher Tan, Ryan Zhou"},
"Deel":{l:"MSB + US state money-transmitter licenses (DPayments); US wallet via Alviere/CFSB; DLUSD via Bridge",f:"Alex Bouaziz, Shuo Wang",m:"~$680M raised",s:"Payroll for 1.5M global workers; issued its own DLUSD stablecoin on Stripe's Bridge + Privy + Tempo stack.",a:["NA","EU","LATAM","ASIA","AF","MENA","OC"]},
"Meow":{l:"Partner banks (Grasshopper Bank, Cross River Bank); fintech, not a bank; FDIC via partners",f:"Brandon Arvanaghi",m:"~$40M raised"},
"Slash":{l:"Partner bank (Column N.A., Member FDIC); previously Piermont Bank",ai:"agentic",f:"Victor Cardenas",m:"$160M raised; $100M Series C at $1.4B (Apr 2026, led by Ribbit)",s:"Founded by literal teenagers in 2020, Slash hit unicorn by banking the businesses everyone else rejects — crypto firms, performance marketers, e-commerce — and grew revenue from $10M to $250M+ annualized in 24 months."},
"Flex":{f:"Zaid Rahman",l:"Partner banks (Column, Lead, Thread)",m:"~$180M equity + $300M debt (val ~$1.2B)",s:"Started 2022 as a business credit card, now 'AI-native private banking' for mid-market owners — hit unicorn in July 2026 as Flex Global put invisible stablecoin rails under cross-border payments in 100+ countries."},
"Dakota":{s:"Business banking where deposits sit in tokenized T-bills onchain — a bank without a bank."},
/* Web3-native */
"MetaMask":{ai:"agentic",f:"Aaron Davis, Dan Finlay (Consensys)",l:"Self-custodial software — no banking license needed; card via licensed issuer partners",m:"Consensys ~$725M raised",s:"Born inside Consensys in 2016, the wallet that onboarded a generation to Ethereum — now shipping mUSD, the Card, and Agent Wallet for autonomous finance."},
"Phantom":{f:"Brandon Millman, Chris Kalani, Francesco Agosti",l:"Self-custodial software",m:"~$270M (val $3B)"},
"Solflare":{l:"Self-custodial software; card via Kulipa (issuer wound down Jul 2026; replacement expected Aug 2026)"},
"Rainbow":{f:"Mike Demarais, Christian Baroni, Jin Chung",m:"~$18M raised"},
"Xverse":{f:"Ken Liao",m:"~$10M raised"},
"Trust Wallet":{ai:"agentic",f:"Viktor Radchenko",m:"Binance-owned"},
"Exodus":{f:"JP Richardson, Daniel Castagnoli",m:"Public (EXOD)"},
"Zengo":{f:"Ouriel Ohayon + 3",m:"Acquired by eToro (Apr 2026, ~$70M reported); ~$24M raised",l:"MPC self-custody; no seed phrase",s:"Self-custodial MPC wallet (no seed phrase); acquired by eToro Apr 2026, product continues independently."},
"Payy":{f:"Polybase Labs (Sid Gandhi + team)",l:"Self-custodial ZK L2; card via issuer partners",s:"Private-by-default stablecoin payments: balances hidden with zero-knowledge proofs, spendable on a Visa."},
"Gnosis Pay":{f:"Stefan George, Martin Köppelmann",l:"E-money via Monavate (UK/EU); funds in your own Safe",m:"~$12.5M raised",s:"The first onchain bank account: a Visa card wired directly to a Safe smart account on Gnosis Chain."},
"Holyheld":{l:"E-money partners (EU); non-custodial top-ups"},
"EtherFi Cash":{f:"Mike Silagadze",l:"DeFi protocol + issuer partners",m:"~$32M + token",s:"Borrow against restaked ETH at the point of sale — credit without selling your stack."},
"Ready":{f:"Itamar Lesuisse, Gerald Goldstein",m:"~$50M raised (as Argent)",l:"Self-custodial software; card via Kulipa (non-EEA cut Jun 2026; issuer wound down Jul 2026)",s:"Argent pioneered smart-account wallets and social recovery; rebranded to Ready to become an onchain bank."},
"Plasma One":{f:"Paul Faecks",l:"Own L1; card via issuer partners",m:"~$74M + XPL sale; Tether-linked",s:"A stablecoin-native neobank running on its own chain — zero-fee USD₮ transfers, though XPL fell ~94% from its high."},
"Cypher":{l:"Self-custodial; principal card programs"},
"Karta":{f:"Nik Zimarkov",l:"Self-custodial (MPC via Privy); Visa issued by Rain",s:"25K+ monthly cardholders spending from their own wallet, reconciled on Tempo in under a second."},
"Brighty":{f:"Roger Buerli, Nick Denisenko (ex-Revolut)",l:"Razz Finanzz AG (CH); crypto via Polish VASP registration (Wireflexion); fiat, IBANs and cards via BaaS partners",m:"~$16.3M raised incl. $10M from Futurecraft Ventures (Dec 2024)",s:"Two ex-Revolut engineers building the Swiss take on the hybrid app: everyday EUR banking with stablecoin vaults up to 10% — custody on Fireblocks, distribution across EU/EEA and Switzerland."},
"Tangem":{f:"Andrey Kurennykh, Andrew Pantyukhin, Andreas Schmucki",l:"Self-custodial; funds in a user-controlled smart contract (USDC on Polygon); card by Paera LLC, issued by Third National via Rain",m:"~$23M raised ($15M SBI Group 2019; Shima Capital 2023)",s:"Sold millions of card-shaped hardware wallets, then made the wallet itself spendable: Tangem Pay (Dec 2025) turns self-custodied USDC into a Visa — the hardware company quietly becoming a neobank."},
"Kontigo":{l:"Self-custodial MPC wallet (USDC); no license of its own; fiat rails via partners",f:"Jesus Castillo, Gino Guatavita",m:"$20M seed (Dec 2025; DST Global, Y Combinator, Coinbase Ventures)",s:"Ex-Venmo/Nubank/Rappi team hit $30M annualized revenue, $1B payment volume and 1M users in under 12 months — with six engineers and one designer."},
"Bitget Wallet":{m:"Bitget ecosystem; $20M+ wallet war-chest",l:"Self-custodial; cards via DCS (Asia), Immersve (EU/UK/LatAm), Fiat24 (CN virtual)",s:"The exchange-adjacent wallet pushing hardest into cards — the only one plugged into WeChat Pay and Alipay."},
"BFinance":{f:"Knyaz Yussupov",l:"Czech VASP registration; Marqeta-issued cards",s:"A card programme that lives entirely inside a Telegram bot — crude, fee-heavy, and reportedly moving ~$20M a month anyway."},
"SurfCash":{f:"Akshat Sharma, C\u00e9sar Su\u00e1rez",l:"Self-custodial (BVI entity); decentralized protocols + licensed local partners; Circle Alliance",s:"The anti-card thesis: nomads in Vietnam, Thailand and Brazil don't need Visa — they need VietQR, PromptPay and Pix, which cards can't touch. SURF token-governed."},
"Hyperbeat":{f:"Kilian Boshoff, 800.HL",m:"$5.2M seed at ~$40M (ether.fi Ventures, Electric Capital, Coinbase Ventures)",l:"Self-custodial smart accounts (HyperEVM); Paxos Labs stablecoin infra",s:"Banking for the Hyperliquid economy: trade, earn and spend one balance — credit mode borrows via Morpho at the terminal."},
"Solayer Emerald":{l:"Self-custodial; Visa principal program"},
"Exa":{l:"DeFi protocol (Exactly); card via partners"},
"1inch Card":{f:"Sergej Kunz, Anton Bukov (1inch)",l:"Self-custodial; card via Baanx/Crypto Life"},
"SafePal":{f:"Veronica Wong",m:"Binance Labs-backed"},
"xPortal":{f:"MultiversX (Beniamin & Lucian Mincu)"},
"Avalanche Card":{f:"Ava Labs",l:"Self-custodial; issuer partners"},
"Oobit":{f:"Amram Adar, Aharon Miller",m:"~$25M (Tether-led)",s:"Tap-to-pay from your own wallet; first corporate crypto card for AI agents (Agent Cards)."},
"Peanut":{l:"Open-source protocol; no custody"},
"Morse":{f:"Mike Hudack, Simon Amor",l:"MiCA-licensed (Avian Labs Netherlands B.V.)",m:"~$30M raised",s:"Ex-Monzo/Facebook team making stablecoin P2P feel like iMessage, on Solana; rebranded from Sling Money in April 2026."},
"Fizen":{f:"Leo Vu",m:"Tether-invested"},
"Veera":{f:"Sukhdeep Bhogal",m:"$10M pre-seed + seed (6th Man Ventures, Sigma Capital, CMCC Titan Fund)",l:"Self-custodial; passkey-secured non-exportable keys",s:"A serial founder with three exits is folding wallet, broker and bank into one self-custodial app — multichain vaults across 40 chains, tokenized gold and equities, and a card waitlist at 30K before the VEERA token even launched."},
"Startale":{f:"Sota Watanabe",l:"Self-custodial; co-develops Soneium with Sony Block Solutions Labs (Sony Group JV)",m:"$63M Series A (Mar 2026): $50M SBI Group + $13M Sony Innovation Fund; $7M seed (Sony, Samsung Next, UOB VM)",s:"The Astar founder's bet that Japan Inc. does onchain banking: a Visa card where Soneium assets keep compounding until the second they're spent, cashback in its own USDSC dollar — and JPYSC, Japan's first trust-bank yen stablecoin, in the same stack."},
"Moto":{f:"Shimon Newman, Ramses Bautista (ex-Squads)",m:"$1.8M pre-seed (Cyber Fund, Eterna Capital, Dec 2025)",l:"Non-custodial; collateral held in Solana smart contracts, DeFi insurance pool instead of FDIC",s:"A Visa Infinite where the credit line is your own USDC earning 2–5% in smart contracts — 5% cashback at every tier, Netflix/Spotify/FT rebated at the top, settled monthly from collateral."},
"Deblock":{f:"Jean Meyer + ex-Ledger/Revolut team",l:"PSAN + payment institution (ACPR)",m:"~€16M raised",s:"A French-licensed current account where the crypto side stays in your own non-custodial wallet — the clearest mixed-custody design in Europe."},
"Stables":{l:"AFSL partners; Mastercard APAC program"},
"Fiat24":{l:"Swiss fintech license (FINMA)",s:"Your bank account is literally an NFT on Arbitrum; Swiss-regulated, onchain-settled."},
"Mine":{l:"Self-custodial software (EMM Ventures AG, Zug); card via Unblock Atomo SARL, EEA e-money institution; IBAN via regulated Swiss intermediary",s:"A Wise/Revolut pitch with the custody inverted: your Swiss IBAN receives francs or euros and they land as Circle USDC in a wallet only you hold — Mine custodies nothing, first 500 convert free."},
"Infini":{s:"Stablecoin card that survived a $49M private-key exploit in Feb 2025 and rebuilt."},
"WeFi":{f:"Maksym Sakharov + team",s:"Deobank thesis: deposits never leave user-controlled onchain accounts."},
"Daimo":{f:"DC Posch, Nalin Bhardwaj",m:"~$7M raised",l:"Open-source self-custodial software",s:"Open-source USDC wallet born from Devconnect payments frustration; passkey-secured, no seed phrase."},
"Decaf":{l:"Self-custodial; issuer partners"},
"Eco (Beam)":{f:"Andy Bromberg",l:"Self-custodial (Eco protocol)"},
"Bleap":{f:"Ex-Revolut founding team",l:"MPC self-custody; MC principal member"}
};

/* ── notable early investors · INV[name] = [[investor, domain], …] — public, top rounds only ── */
const INV={
  /* US consumer */
  "Chime": [["DST Global","dst-global.com"],["Sequoia Capital","sequoiacap.com"],["General Atlantic","generalatlantic.com"],["Tiger Global","tigerglobal.com"],["Menlo Ventures","menlovc.com"]],
  "Varo": [["Warburg Pincus","warburgpincus.com"],["The Rise Fund (TPG)","therisefund.com"],["Lone Pine Capital","lonepinecapital.com"]],
  "Current": [["Andreessen Horowitz","a16z.com"],["Tiger Global","tigerglobal.com"],["Avenir Growth","avenirgrowth.com"],["Foundation Capital","foundationcap.com"]],
  "SoFi": [["SoftBank","softbank.jp"],["Silver Lake","silverlake.com"],["Qatar Investment Authority","qia.qa"]],
  "Dave": [["Norwest Venture Partners","nvp.com"],["Section 32","section32.com"]],
  "One": [["Walmart","walmart.com"],["Ribbit Capital","ribbitcap.com"]],
  "Step": [["Coatue","coatue.com"],["Stripe","stripe.com"],["General Catalyst","generalcatalyst.com"],["Crosslink Capital","crosslinkcapital.com"]],
  "Greenlight": [["Andreessen Horowitz","a16z.com"],["TTV Capital","ttvcapital.com"],["Canapi Ventures","canapi.com"],["Owl Ventures","owlvc.com"],["Drive Capital","drivecapital.com"]],
  "Albert": [["CapitalG","capitalg.com"],["General Atlantic","generalatlantic.com"],["QED Investors","qedinvestors.com"]],
  "Greenwood": [["Truist","truist.com"],["Bank of America","bankofamerica.com"],["SoftBank","softbank.jp"]],
  "Robinhood": [["Index Ventures","indexventures.com"],["Andreessen Horowitz","a16z.com"],["DST Global","dst-global.com"],["Ribbit Capital","ribbitcap.com"],["Sequoia Capital","sequoiacap.com"]],
  /* US SMB */
  "Mercury": [["Andreessen Horowitz","a16z.com"],["Sequoia Capital","sequoiacap.com"],["CRV","crv.com"],["Coatue","coatue.com"]],
  "Brex": [["Y Combinator","ycombinator.com"],["DST Global","dst-global.com"],["Greenoaks","greenoaks.com"],["Ribbit Capital","ribbitcap.com"],["Tiger Global","tigerglobal.com"]],
  "Ramp": [["Founders Fund","foundersfund.com"],["Thrive Capital","thrivecap.com"],["Khosla Ventures","khoslaventures.com"],["Stripe","stripe.com"],["General Catalyst","generalcatalyst.com"]],
  "Novo": [["Valar Ventures","valar.com"],["Stripes","stripes.co"],["Crosslink Capital","crosslinkcapital.com"]],
  "Bluevine": [["Lightspeed","lsvp.com"],["Menlo Ventures","menlovc.com"],["83North","83north.com"],["Citi Ventures","citi.com"]],
  "Relay": [["Bain Capital Ventures","baincapitalventures.com"],["Better Tomorrow Ventures","btv.vc"],["Garage Capital","garage.vc"]],
  "Found": [["Sequoia Capital","sequoiacap.com"],["Founders Fund","foundersfund.com"],["Lightspeed","lsvp.com"]],
  "Lili": [["Group 11","group11.vc"],["Target Global","targetglobal.vc"]],
  "NorthOne": [["Battery Ventures","battery.com"],["Redpoint","redpoint.com"]],
  "Rho": [["DFJ Growth","dfjgrowth.com"],["M13","m13.co"]],
  "Slash": [["Ribbit Capital","ribbitcap.com"],["Khosla Ventures","khoslaventures.com"],["Goodwater Capital","goodwatercap.com"],["NEA","nea.com"],["Y Combinator","ycombinator.com"]],
  "Kontigo": [["DST Global","dst-global.com"],["Y Combinator","ycombinator.com"],["Coinbase Ventures","coinbase.com"],["Soma Capital","somacap.com"]],
  "Brighty": [["Futurecraft Ventures","futurecraft.ventures"]],
  "Tangem": [["SBI Group","sbigroup.co.jp"],["Shima Capital","shima.capital"]],
  "Flex": [["Halo Fund","halo.fund"],["Portage Ventures","portageinvest.com"],["Crosslink Capital","crosslinkcapital.com"],["Wellington Management","wellington.com"],["Titanium Ventures","titaniumventures.com"]],
  "Karat": [["Union Square Ventures","usv.com"],["SignalFire","signalfire.com"]],
  "Deel": [["Andreessen Horowitz","a16z.com"],["Spark Capital","sparkcapital.com"],["Coatue","coatue.com"],["Y Combinator","ycombinator.com"],["General Catalyst","generalcatalyst.com"]],
  /* Europe */
  "Revolut": [["Index Ventures","indexventures.com"],["DST Global","dst-global.com"],["Balderton Capital","balderton.com"],["Ribbit Capital","ribbitcap.com"],["Tiger Global","tigerglobal.com"]],
  "Monzo": [["Accel","accel.com"],["Passion Capital","passioncapital.com"],["General Catalyst","generalcatalyst.com"],["Y Combinator","ycombinator.com"],["Tencent","www.tencent.com"]],
  "N26": [["Valar Ventures","valar.com"],["Insight Partners","insightpartners.com"],["Tencent","www.tencent.com"],["Allianz X","allianzx.com"],["Earlybird","earlybird.com"]],
  "Starling Bank": [["Goldman Sachs","goldmansachs.com"],["Fidelity","fidelity.com"],["Qatar Investment Authority","qia.qa"],["Chrysalis","chrysalisinvestments.co.uk"]],
  "Wise": [["Index Ventures","indexventures.com"],["Andreessen Horowitz","a16z.com"],["Valar Ventures","valar.com"],["Baillie Gifford","bailliegifford.com"]],
  "bunq": [["Pollen Street Capital","pollencap.com"]],
  "Tide": [["Apax","apax.com"],["Anthemis","anthemis.com"],["Augmentum Fintech","augmentum.vc"],["LocalGlobe","localglobe.vc"],["Speedinvest","speedinvest.com"]],
  "Qonto": [["Valar Ventures","valar.com"],["Alven","alven.co"],["Tencent","www.tencent.com"],["DST Global","dst-global.com"],["TCV","tcv.com"]],
  "Trade Republic": [["Sequoia Capital","sequoiacap.com"],["Accel","accel.com"],["Founders Fund","foundersfund.com"],["Thrive Capital","thrivecap.com"],["Creandum","creandum.com"]],
  "Vivid Money": [["Ribbit Capital","ribbitcap.com"],["SoftBank","softbank.jp"],["Greenoaks","greenoaks.com"]],
  "Bitpanda": [["Valar Ventures","valar.com"],["Speedinvest","speedinvest.com"]],
  "Lunar": [["Kinnevik","kinnevik.com"],["Tencent","www.tencent.com"],["Seed Capital","seedcapital.dk"],["Greyhound Capital","greyhoundcapital.com"]],
  "Monese": [["Kinnevik","kinnevik.com"],["PayPal Ventures","paypal.com"],["Augmentum Fintech","augmentum.vc"],["HSBC","hsbc.com"]],
  "Zopa Bank": [["SoftBank","softbank.jp"],["Augmentum Fintech","augmentum.vc"]],
  "Atom Bank": [["BBVA","bbva.com"],["Toscafund","toscafund.com"]],
  "Allica Bank": [["TCV","tcv.com"],["Warwick Capital Partners","warwickcapital.com"],["Atalaya Capital","atalayacap.com"]],
  "OakNorth": [["SoftBank","softbank.jp"],["Clermont Group","theclermontgroup.com"],["GIC","www.gic.com.sg"],["Toscafund","toscafund.com"]],
  "Tandem Bank": [["Pollen Street Capital","pollencap.com"]],
  "Klarna": [["Sequoia Capital","sequoiacap.com"],["Atomico","atomico.com"],["Silver Lake","silverlake.com"],["Permira","permira.com"],["SoftBank","softbank.jp"]],
  "Sumeria (Lydia)": [["Tencent","www.tencent.com"],["Accel","accel.com"],["Dragoneer","dragoneer.com"]],
  "Indy": [["Singular","singular.vc"]],
  "Alpian": [["Intesa Sanpaolo","group.intesasanpaolo.com"],["REYL Intesa Sanpaolo","reyl.com"]],
  "Deblock": [["Headline","headline.com"],["Hoxton Ventures","hoxtonventures.com"]],
  "Majority": [["Valar Ventures","valar.com"],["Heartcore Capital","heartcore.com"]],
  /* LATAM */
  "Nubank": [["Sequoia Capital","sequoiacap.com"],["DST Global","dst-global.com"],["Kaszek","kaszek.com"],["Tencent","www.tencent.com"],["Berkshire Hathaway","berkshirehathaway.com"]],
  "Ualá": [["SoftBank","softbank.jp"],["Tencent","www.tencent.com"],["Allianz X","allianzx.com"],["Goldman Sachs","goldmansachs.com"],["Soros Fund Management","sorosfundmgmt.com"]],
  "Plata": [["Bicycle Capital","bicycle.capital"],["Qatar Investment Authority","qia.qa"],["BTG Pactual","btgpactual.com"],["Valor Capital Group","valorcapitalgroup.com"],["Kora","koramgmt.com"],["Hedosophia","hedosophia.com"]],
  "Veera": [["6th Man Ventures","6thman.ventures"],["CMCC Global","cmcc.vc"],["Sigma Capital","sigmavc.com"],["Cypher Capital","cyphercapital.com"]],
  "Klar": [["General Atlantic","generalatlantic.com"],["Prosus Ventures","prosus.com"],["Quona Capital","quona.com"],["Mouro Capital","mourocapital.com"]],
  "Stori": [["Lightspeed","lsvp.com"],["General Catalyst","generalcatalyst.com"],["Goodwater Capital","goodwatercap.com"],["BAI Capital","baicapital.com"]],
  "albo": [["Valar Ventures","valar.com"],["Greyhound Capital","greyhoundcapital.com"],["Mountain Nazca","nazca.mx"]],
  "Banco Inter": [["SoftBank","softbank.jp"]],
  "C6 Bank": [["JPMorgan Chase","jpmorganchase.com"],["GIC","www.gic.com.sg"]],
  "Neon": [["General Atlantic","generalatlantic.com"],["BBVA","bbva.com"],["Monashees","monashees.com"],["BlackRock","blackrock.com"]],
  "Cora": [["Greenoaks","greenoaks.com"],["Tiger Global","tigerglobal.com"],["Kaszek","kaszek.com"],["QED Investors","qedinvestors.com"],["Ribbit Capital","ribbitcap.com"]],
  "Brubank": [["Point72 Ventures","p72.vc"]],
  "Nomad": [["Stripes","stripes.co"],["Monashees","monashees.com"],["Spark Capital","sparkcapital.com"],["Tiger Global","tigerglobal.com"]],
  "Tenpo": [["Krealo (Credicorp)","grupocredicorp.com"]],
  "Global66": [["Quona Capital","quona.com"],["Magma Partners","magmapartners.com"]],
  "Bitso": [["Tiger Global","tigerglobal.com"],["Coatue","coatue.com"],["Pantera Capital","panteracapital.com"],["QED Investors","qedinvestors.com"],["Kaszek","kaszek.com"]],
  "Ripio": [["Digital Currency Group","dcg.co"],["Pantera Capital","panteracapital.com"],["Boost VC","boost.vc"]],
  "Airtm": [["Ribbit Capital","ribbitcap.com"],["BlueYard Capital","blueyard.com"]],
  "Comun": [["Redpoint","redpoint.com"],["Costanoa Ventures","costanoa.vc"],["South Park Commons","southparkcommons.com"]],
  "DolarApp": [["Y Combinator","ycombinator.com"],["Kaszek","kaszek.com"]],
  /* Africa */
  "Moniepoint": [["Oui Capital","ouicapital.vc"],["QED Investors","qedinvestors.com"],["Development Partners International","dpi-llp.com"],["Google (Africa Investment Fund)","google.com"],["Lightrock","lightrock.com"],["Visa","visa.com"]],
  "PaySika": [["Oui Capital","ouicapital.vc"]],
  "Kuda": [["Valar Ventures","valar.com"],["Target Global","targetglobal.vc"],["SBI Group","www.sbigroup.co.jp"]],
  "TymeBank": [["Tencent","www.tencent.com"],["Apis Partners","apis.pe"],["Nubank","nubank.com.br"],["Norrsken22","norrsken22.com"],["British International Investment","bii.co.uk"]],
  "OPay": [["SoftBank","softbank.jp"],["HongShan","hongshan.com"],["Source Code Capital","sourcecodecap.com"]],
  "PalmPay": [["Transsion","www.transsion.com"],["NetEase","www.netease.com"]],
  "FairMoney": [["Tiger Global","tigerglobal.com"],["Flourish Ventures","flourishventures.com"],["Speedinvest","speedinvest.com"]],
  "Chipper Cash": [["Ribbit Capital","ribbitcap.com"],["Bezos Expeditions","bezosexpeditions.com"],["Deciens Capital","deciens.com"]],
  "Wave": [["HRTG (Sequoia Heritage)","hrtg.com"],["Founders Fund","foundersfund.com"],["Stripe","stripe.com"],["Ribbit Capital","ribbitcap.com"],["Partech","partechpartners.com"]],
  "Djamo": [["Y Combinator","ycombinator.com"],["Partech","partechpartners.com"],["Janngo Capital","janngo.africa"]],
  "Carbon": [["Partech","partechpartners.com"]],
  "Flouci": [["Musha Ventures","mushaventures.com"],["Launch Africa","launchafrica.vc"]],
  /* Asia */
  "Toss Bank": [["PayPal Ventures","paypal.com"],["Kleiner Perkins","kleinerperkins.com"],["Altos Ventures","altos.vc"],["GIC","www.gic.com.sg"]],
  "Jupiter": [["Peak XV Partners","peakxv.com"],["Z47 (Matrix India)","z47.com"],["Tiger Global","tigerglobal.com"],["QED Investors","qedinvestors.com"]],
  "Niyo": [["Accel","accel.com"],["Prime Venture Partners","primevp.in"],["Tencent","www.tencent.com"],["Lightrock","lightrock.com"]],
  "slice": [["Tiger Global","tigerglobal.com"],["Insight Partners","insightpartners.com"],["Blume Ventures","blume.vc"]],
  "FamPay": [["Elevation Capital","elevationcapital.com"],["Y Combinator","ycombinator.com"],["Peak XV Partners","peakxv.com"],["General Catalyst","generalcatalyst.com"]],
  "RazorpayX": [["Peak XV Partners","peakxv.com"],["Tiger Global","tigerglobal.com"],["GIC","www.gic.com.sg"],["Ribbit Capital","ribbitcap.com"],["Y Combinator","ycombinator.com"]],
  "Open": [["Temasek","temasek.com.sg"],["Tiger Global","tigerglobal.com"],["3one4 Capital","3one4capital.com"],["IIFL","iifl.com"]],
  "Zolve": [["Accel","accel.com"],["Lightspeed","lsvp.com"],["DST Global","dst-global.com"],["Creaegis","creaegis.com"]],
  "Paytm": [["SoftBank","softbank.jp"],["Ant Group","antgroup.com"],["Alibaba","alibabagroup.com"],["Elevation Capital","elevationcapital.com"]],
  "PhonePe": [["Walmart","walmart.com"],["General Atlantic","generalatlantic.com"],["Ribbit Capital","ribbitcap.com"],["Tiger Global","tigerglobal.com"],["Qatar Investment Authority","qia.qa"]],
  "GCash": [["Globe Telecom","globe.com.ph"],["Ant Group","antgroup.com"],["Warburg Pincus","warburgpincus.com"],["Insight Partners","insightpartners.com"]],
  "Maya": [["PLDT","pldt.com"],["KKR","kkr.com"],["Tencent","www.tencent.com"],["IFC","ifc.org"]],
  "Tonik": [["Peak XV Partners","peakxv.com"],["Point72 Ventures","p72.vc"],["Mizuho","mizuhogroup.com"],["Prosus Ventures","prosus.com"]],
  "Aspire": [["Peak XV Partners","peakxv.com"],["Lightspeed","lsvp.com"],["Y Combinator","ycombinator.com"],["Tencent","www.tencent.com"],["PayPal Ventures","paypal.com"]],
  "YouTrip": [["Lightspeed","lsvp.com"],["Insignia Ventures","insignia.vc"]],
  "bKash": [["SoftBank","softbank.jp"],["Ant Group","antgroup.com"],["IFC","ifc.org"],["Gates Foundation","gatesfoundation.org"]],
  "DANA": [["Ant Group","antgroup.com"],["Emtek","emtek.co.id"]],
  "OVO": [["Grab","grab.com"]],
  "Superbank": [["Grab","grab.com"],["Singtel","singtel.com"],["Emtek","emtek.co.id"],["KakaoBank","kakaobank.com"]],
  "TrueMoney": [["CP Group","cpgroupglobal.com"],["Ant Group","antgroup.com"]],
  "MoMo": [["Warburg Pincus","warburgpincus.com"],["Goldman Sachs","goldmansachs.com"],["Mizuho","mizuhogroup.com"]],
  "WeBank": [["Tencent","www.tencent.com"]],
  "MYbank": [["Ant Group","antgroup.com"]],
  "WeLab Bank": [["Sequoia Capital","sequoiacap.com"],["Alibaba Entrepreneurs Fund","ent-fund.org"]],
  "SadaPay": [["Recharge Capital","rechargecapital.com"]],
  /* MENA */
  "Wio Bank": [["ADQ","adq.ae"],["e&","eand.com"],["Mubadala","mubadala.com"]],
  /* Canada / Oceania */
  "Wealthsimple": [["Power Corporation","powercorporation.com"],["Allianz X","allianzx.com"],["Meritech Capital","meritechcapital.com"],["Greylock","greylock.com"],["DST Global","dst-global.com"]],
  "KOHO": [["Drive Capital","drivecapital.com"],["Portage","sagard.com"],["Eldridge","eldridge.com"]],
  "Neo Financial": [["Valar Ventures","valar.com"],["Golden Ventures","golden.ventures"]],
  "Hnry": [["Left Lane Capital","leftlane.com"],["AirTree Ventures","airtree.vc"],["Icehouse Ventures","icehouseventures.co.nz"]],
  /* web3-native */
  "MetaMask": [["ParaFi Capital","parafi.com"],["Temasek","temasek.com.sg"],["SoftBank","softbank.jp"],["Microsoft (M12)","m12.vc"]],
  "Phantom": [["Paradigm","paradigm.xyz"],["Andreessen Horowitz","a16z.com"],["Variant","variant.fund"],["Jump Crypto","jumpcrypto.com"]],
  "Rainbow": [["Seven Seven Six","sevensevensix.com"]],
  "Zengo": [["Insight Partners","insightpartners.com"],["Samsung Next","samsungnext.com"]],
  "Startale": [["SBI Group","sbigroup.co.jp"],["Sony Innovation Fund","sonyinnovationfund.com"],["Samsung Next","samsungnext.com"],["UOB Venture Management","uobvm.com.sg"]],
  "Moto": [["Cyber Fund","cyber.fund"],["Eterna Capital","eternacapital.com"]],
  "EtherFi Cash": [["CoinFund","coinfund.io"],["OKX Ventures","okx.com"]],
  "KAST": [["Peak XV Partners","peakxv.com"],["HongShan","hongshan.com"]],
  "Plasma One": [["Founders Fund","foundersfund.com"],["Framework Ventures","framework.ventures"],["Bitfinex","bitfinex.com"]],
  "Morse": [["Union Square Ventures","usv.com"],["Ribbit Capital","ribbitcap.com"],["Slow Ventures","slow.co"]],
  "Fold": [["Craft Ventures","craftventures.com"]],
  "Strike": [["Ten31","ten31.vc"]],
  "Lava": [["Founders Fund","foundersfund.com"],["Khosla Ventures","khoslaventures.com"]],
  "Xapo Bank": [["Benchmark","benchmark.com"],["Index Ventures","indexventures.com"],["Greylock","greylock.com"]],
  "Krak": [["Hummingbird Ventures","hummingbird.vc"],["Tribe Capital","tribecap.co"],["Blockchain Capital","blockchain.capital"]],
  "Coinbase Card": [["Andreessen Horowitz","a16z.com"],["Union Square Ventures","usv.com"],["Ribbit Capital","ribbitcap.com"]],
  "Hyperbeat": [["ether.fi Ventures","ether.fi"],["Electric Capital","electriccapital.com"],["Coinbase Ventures","coinbase.com"]],
  "COCA": [["Stellar Development Foundation","stellar.org"]],
};

/* macro regions */
const MACROS={NA:"North America",EU:"Europe",LATAM:"Latin America",AF:"Africa",MENA:"MENA",ASIA:"Asia",OC:"Oceania"};
const ALLM=Object.keys(MACROS);
function macrosOf(r){
  const o=X[r[0]];
  if(o&&o.a)return o.a;
  const reg=r[2];
  if(reg==="Global")return ALLM;
  return {US:["NA"],Canada:["NA"],UK:["EU"],Europe:["EU"],LatAm:["LATAM"],Africa:["AF"],MENA:["MENA"],Asia:["ASIA"],ANZ:["OC"]}[reg]||[];
}
let mapFilter="";

/* redefine matches() to include the map filter (overrides earlier definition) */
function matches(r){
  const [name,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  if(cat!=="ALL"&&c!==cat)return false;
  if(region&&reg!==region)return false;
  if(custody&&custGroup(cu)!==custody)return false;
  if(niche&&ni!==niche)return false;
  if(net==="—"){if(nw!=="—")return false}
  else if(net==="Visa"&&!/Visa/i.test(nw))return false;
  else if(net==="Mastercard"&&!/(MC|Mastercard)/i.test(nw))return false;
  if(wantYield&&(y==="—"||!y))return false;
  if(wantStable&&!st)return false;
  if(wantNoKyc&&kyc!=="N")return false;
  if(wantAI&&!(X[name]||{}).ai)return false;
  if(mapFilter&&!macrosOf(r).includes(mapFilter))return false;
  if(q){
    const hay=(name+" "+CATNAME[c]+" "+reg+" "+hq+" "+CUST[cu]+" "+nw+" "+ct+" "+cb+" "+y+" "+KYC[kyc]+" "+NICHE[ni]+" "+note).toLowerCase();
    if(!hay.includes(q))return false;
  }
  return true;
}

/* ── world map (dot matrix) ── */
const GRID=[
"..............................................................",
"...NNN.....NNNNNN.............EE..............................",
"..NNNNNNN.NNNNNN.....E.......EEE....SSSSSSSSSSSSSSSSSS........",
".NNNNNNNNNNNNNNN....EE.....EEEEEEEEESSSSSSSSSSSSSSSSSSSSS....",
".NNNNNNNNNNNNNNN.....E....EEEEEEEEEESSSSSSSSSSSSSSSSSSSSSS...",
"..NNNNNNNNNNNNN...........EEEEEEEEEESSSSSSSSSSSSSSSSSSSSSS...",
"...NNNNNNNNNNN.............EEEEE.EEEE.SSSSSSSSSSSSSSSSSSS....",
"....NNNNNNNN...............EEEE..MMMM.SSSSSSSSSSSSSSSSSS.....",
".....NNNNN..................EE..MMMMMM.SSSSSSSSSSSSSSSS......",
"......NNN.......................MMMMMMM.SSSSSSSSSSSSSS.S.....",
".......NN......................MMMMMMMM..SSSSSSSSSSSS..SS....",
"........LL....................MMMMMMMM...SSSSSSSSSSS...S.....",
".........LLL...............AAAAAMMMMM....SSSSSSSSSS..........",
"..........LLLL............AAAAAAAAAMM.....SSSSSSSS...........",
"...........LLLLL.........AAAAAAAAAAAA......SSSS..SSS.........",
"...........LLLLLL........AAAAAAAAAAAAA......SS..SSSSS........",
"............LLLLL........AAAAAAAAAAAA.......S..SSSSSS........",
"............LLLLLL........AAAAAAAAAA...........SSSS..........",
".............LLLLL........AAAAAAAAA....................O.....",
".............LLLL..........AAAAAAA.............OOOO...OO.....",
"..............LLL..........AAAAA..............OOOOOOO........",
"..............LL............AAA...............OOOOOOO....O...",
".............LLL............AA.................OOOOO.....OO..",
".............LL..................................OO......O...",
"..............L.............................................."
];
const L2M={N:"NA",E:"EU",L:"LATAM",A:"AF",M:"MENA",S:"ASIA",O:"OC"};
(function buildMap(){
  const CS=10,rows=GRID.length,cols=Math.max(...GRID.map(r=>r.length));
  const groups={};
  GRID.forEach((row,y)=>{[...row].forEach((ch,x)=>{
    if(ch===".")return;
    (groups[ch]=groups[ch]||[]).push('<circle cx="'+(x*CS+CS/2)+'" cy="'+(y*CS+CS/2)+'" r="3.4" class="md-'+ch+'"/>');
  })});
  const counts={};ALLM.forEach(m=>counts[m]=D.filter(r=>macrosOf(r).includes(m)).length);
  const svg='<svg class="mapsvg" viewBox="0 0 '+(cols*CS)+' '+(rows*CS)+'" role="img" aria-label="World map of neobank activity">'+
    Object.entries(groups).map(([ch,cs])=>'<g class="mreg" data-mr="'+L2M[ch]+'"><title>'+MACROS[L2M[ch]]+' · '+counts[L2M[ch]]+' neobanks active</title>'+cs.join("")+'</g>').join("")+'</svg>';
  const colors={NA:"#89B0FF",EU:"#D075FF",LATAM:"#FFA680",AF:"#BAF24A",MENA:"#FF5C16",ASIA:"#CCE7FF",OC:"#EAC2FF"};
  const legend='<div class="mlegend">'+ALLM.map(m=>'<button class="mchip" data-mr="'+m+'"><span class="lg-dot" style="background:'+colors[m]+'"></span>'+MACROS[m]+' <b>'+counts[m]+'</b></button>').join("")+'</div>';
  const sec='<section class="mapwrap" id="mapsec"><div class="mapcard">'+
    '<div class="maphead"><h2>where they operate</h2><span class="mh-sub">click a region to filter · counts include global players</span></div>'+
    svg+legend+'</div></section>';
  document.querySelector('.spectrum').insertAdjacentHTML('afterend',sec);
  window.setMap=function(code){
    mapFilter=(mapFilter===code)?"":code;
    document.querySelectorAll('#mapsec .mreg').forEach(g=>g.classList.toggle('act',g.dataset.mr===mapFilter));
    document.querySelectorAll('#mapsec .mchip').forEach(b=>b.classList.toggle('on',b.dataset.mr===mapFilter));
    /* clicking a region should show its list — on the full-map view the grid is
       hidden, so drop back to the directory (like the country drill-down does) */
    if(mapFilter&&window.showView&&(document.body.dataset.view||'directory')!=='directory')showView('directory');
    render();
    if(mapFilter)document.getElementById('count').scrollIntoView({behavior:'smooth',block:'center'});
  };
  document.querySelectorAll('#mapsec .mreg').forEach(g=>g.addEventListener('click',()=>setMap(g.dataset.mr)));
  document.querySelectorAll('#mapsec .mchip').forEach(b=>b.addEventListener('click',()=>setMap(b.dataset.mr)));
  document.getElementById('clearall').addEventListener('click',()=>{if(mapFilter)setMap(mapFilter)});
})();

/* ── detail profile modal ── */
document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="detail" role="dialog" aria-modal="true" aria-label="Neobank profile"><div class="ov-wrap" id="dwrap"></div></div>');
const CATLONG={T:"Web2 · traditional bank (custodial)",H:"Hybrid · fiat + custodial crypto (CeFi)",W:"Web3 · self-custodial / onchain"};
const AITAG={underwriting:"AI underwriting in production",interface:"AI assistant as the interface",agentic:"banking for AI agents"};
function openDetail(name){
  const r=D.find(x=>x[0]===name);if(!r)return;
  const [n,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  const e=X[n]||{};
  const lic=e.l||((cu==="S"||cu==="M")?"Self-custodial software — cards via licensed issuer partners":"—");
  const macros=macrosOf(r).map(m=>'<span class="dreg">'+MACROS[m]+'</span>').join("");
  const fields=[["Category",CATLONG[c]],["Audience",NICHE[ni]],["HQ",hq],["Founded",f],["Custody",CUST[cu]],
    ["License / regulation",lic],["Founders",e.f||"—"],["Funding",e.m||"—"],
    ["Card",nw==="—"?"No card":nw+" · "+ct],["Cashback",cb],["Yield",y],
    ["Stablecoins",st?"Yes":"No"],["KYC",KYC[kyc]]];
  if(e.ai)fields.splice(1,0,["AI",AITAG[e.ai]||e.ai]);
  const badge=(e.f||e.s||e.m)?'<span class="enrich">researched profile</span>':'<span class="enrich pending">base profile — enrichment pending</span>';
  document.getElementById('dwrap').innerHTML=
    '<div class="ov-head"><h2>profile</h2><button class="ov-close" id="dclose">close ✕</button></div>'+
    '<div class="dhead">'+logoHTML(dom,n)+
      '<div><div class="dname">'+esc(n)+'</div>'+
      '<div class="dchips"><span class="chip '+c+'">'+CATNAME[c]+'</span>'+
      (ni!=="g"?'<span class="nichetag">'+NICHE[ni]+'</span>':"")+
      (st?'<span class="badge-s">stablecoins</span>':"")+badge+'</div></div></div>'+
    (e.s?'<p class="dstory">'+esc(e.s)+'</p>':"")+
    '<p class="dnote">'+esc(note)+'</p>'+
    '<div class="dgrid">'+fields.map(([k,v])=>'<div class="dfield"><div class="k">'+k+'</div><div class="v">'+esc(String(v))+'</div></div>').join("")+
      '<div class="dfield"><div class="k">Active regions</div><div class="dregs">'+macros+'</div></div></div>'+
    (dom?'<a class="dlink" href="https://'+esc(dom)+'" target="_blank" rel="noopener">visit '+esc(dom)+' ↗</a>':"")+
    '<button class="cmp-btn'+(cmp.has(n)?" on":"")+'" style="margin-left:10px" id="dcmp">'+(cmp.has(n)?"✓ comparing":"+ compare")+'</button>';
  document.getElementById('detail').classList.add('show');
  document.getElementById('dclose').addEventListener('click',closeDetail);
  document.getElementById('dcmp').addEventListener('click',()=>{toggleCmp(n);closeDetail();});
}
function closeDetail(){
  document.getElementById('detail').classList.remove('show');
  if(window.__lastFocus){try{window.__lastFocus.focus()}catch(_){}window.__lastFocus=null}
}
/* backdrop click closes: #dwrap spans the full width, so the dark area beside the modal is #dwrap, not #detail */
document.getElementById('detail').addEventListener('click',e=>{if(e.target.id==="detail"||e.target.id==="dwrap")closeDetail()});
document.addEventListener('keydown',e=>{if(e.key==="Escape")closeDetail()});
/* click any card (except the compare button) to open its profile */
document.getElementById('grid').addEventListener('click',e=>{
  if(e.target.closest('.cmp-btn'))return;
  const card=e.target.closest('.card');if(!card)return;
  const nm=card.querySelector('.cname');if(nm)openDetail(nm.textContent);
});
/* keyboard: Enter/Space on a focused card opens its profile */
document.getElementById('grid').addEventListener('keydown',e=>{
  if(e.key!=="Enter"&&e.key!==" ")return;
  if(e.target.closest('.cmp-btn'))return;
  const card=e.target.closest('.card');if(!card)return;
  e.preventDefault();
  const nm=card.querySelector('.cname');if(nm)openDetail(nm.textContent);
});
render();


/* ═══ v4 LAYER · UX fixes, regulation, sources, gen z/alpha, data section ═══ */

/* ── 1 · audience split: gen alpha vs gen z ── */
NICHE.k="gen alpha · kids & family";
NICHE.gz="gen z & students";
const GZ=["Step","FamPay","NG.cash","Telda","Weyay","imagin","Fingo","TNEX"];
D.forEach(r=>{if(GZ.includes(r[0]))r[12]="gz"});
(function rebuildNiche(){
  const nn=document.getElementById('f-niche');
  const keep=nn.value;
  while(nn.options.length>1)nn.remove(1);
  const used=[...new Set(D.map(r=>r[12]))];
  Object.entries(NICHE).filter(([k])=>used.includes(k)).forEach(([k,v])=>{
    const o=document.createElement('option');o.value=k;o.textContent="audience: "+v+" ("+D.filter(r=>r[12]===k).length+")";nn.appendChild(o);
  });
  nn.value=[...nn.options].some(o=>o.value===keep)?keep:"";
})();

/* ── 2 · clicking "directory" in the nav clears every filter ── */
document.getElementById('navdir').addEventListener('click',()=>{
  clearAll();
  if(mapFilter)setMap(mapFilter);
});

/* ── 3 · guided compare tray ── */
document.getElementById('traychips').insertAdjacentHTML('afterend','<span class="trayhint" id="trayhint"></span><button class="tclear" id="tclear">clear</button>');
document.getElementById('tclear').addEventListener('click',()=>{[...cmp].forEach(n=>cmp.delete(n));renderTray();render()});
function renderTray(){
  const tray=document.getElementById('tray'),chips=document.getElementById('traychips'),hint=document.getElementById('trayhint'),go=document.getElementById('gocmp');
  if(!cmp.size){tray.classList.remove('show');go.classList.remove('pulse');return}
  tray.classList.add('show');
  chips.innerHTML=[...cmp].map(tchipHTML).join("");
  chips.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>toggleCmp(b.dataset.n)));
  go.disabled=cmp.size<2;
  go.classList.toggle('pulse',cmp.size>=2);
  hint.textContent=cmp.size<2?("1 of 4 selected — pick at least one more, then hit the orange button"):(cmp.size+" of 4 selected — ready when you are →");
}

/* ── 4 · regulation layer (MiCA-aware) ── */
function regTypeOf(r){
  const e=X[r[0]]||{};const cu=r[5];const t=(e.l||"").toLowerCase();
  if(!t)return(cu==="S"||cu==="M")?"Self-custodial software":"Unclassified";
  if(/pursuing|preparing/.test(t))return"License pending (partner model today)";
  if(/partner bank|partner:|partner banks|(^|\s)on .*license|rails|jv on|operates on|subsidiary/.test(t))return"Partner-bank model";
  if(/self-custodial|open-source|no custody|mpc|own l1|defi protocol|eco protocol|protocol/.test(t))return"Self-custodial software";
  if(/mica/.test(t))return"MiCA CASP (EU)";
  if(/charter|banking license|bank license|bank \(|private bank|mutual bank|\badi\b|internet-only|virtual bank|digital bank|digital full bank|digital wholesale|payments bank|small finance|microfinance|\bmfs\b|sofipo|ifpe|bank licenses|bank;/.test(t))return"Licensed bank";
  if(/e-money|\bemi\b/.test(t))return"E-money institution";
  if(/payment institution|psan|\bmpi\b|payment licenses|payment\/fintech|mobile money|e-money issuer|afsl/.test(t))return"Payment institution";
  if(/vasp|msb|bitlicense|vara|trust|casp|state licenses|registrations/.test(t))return"VASP / MSB / crypto licenses";
  if(/broker/.test(t))return"Broker-led";
  if(/fintech license/.test(t))return"Fintech license (CH)";
  return"Other / mixed";
}
let regF="";
let countryF="";
/* countries an entity is verified available in (V[].cc); [] when unknown → strict filter, no false positives */
function countriesOf(r){return ((typeof V!=="undefined"&&V[r[0]])||{}).cc||[]}
(function buildRegFilter(){
  const counts={};D.forEach(r=>{const k=regTypeOf(r);counts[k]=(counts[k]||0)+1});
  const opts=Object.entries(counts).sort((a,b)=>b[1]-a[1])
    .map(([k,c])=>'<option value="'+k+'">regulation: '+k.toLowerCase()+' ('+c+')</option>').join("");
  document.getElementById('sep-toggles').insertAdjacentHTML('beforebegin','<select id="f-reg" aria-label="Regulation"><option value="">regulation: all</option>'+opts+'</select>');
  document.getElementById('f-reg').addEventListener('change',e=>{regF=e.target.value;render()});
  document.getElementById('clearall').addEventListener('click',()=>{regF="";document.getElementById('f-reg').selectedIndex=0});
  document.getElementById('navdir').addEventListener('click',()=>{regF="";document.getElementById('f-reg').selectedIndex=0});
})();

/* redefine matches() once more: adds regulation filter (keeps map filter) */
function matches(r){
  const [name,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  if(cat!=="ALL"&&c!==cat)return false;
  if(region&&reg!==region)return false;
  if(custody&&custGroup(cu)!==custody)return false;
  if(niche&&ni!==niche)return false;
  if(net==="—"){if(nw!=="—")return false}
  else if(net==="Visa"&&!/Visa/i.test(nw))return false;
  else if(net==="Mastercard"&&!/(MC|Mastercard)/i.test(nw))return false;
  if(wantYield&&(y==="—"||!y))return false;
  if(wantStable&&!st)return false;
  if(wantNoKyc&&kyc!=="N")return false;
  if(wantAI&&!(X[name]||{}).ai)return false;
  if(mapFilter&&!macrosOf(r).includes(mapFilter))return false;
  if(regF&&regTypeOf(r)!==regF)return false;
  if(countryF&&!countriesOf(r).includes(countryF))return false;
  if(q){
    const hay=(name+" "+CATNAME[c]+" "+reg+" "+hq+" "+CUST[cu]+" "+nw+" "+ct+" "+cb+" "+y+" "+KYC[kyc]+" "+NICHE[ni]+" "+regTypeOf(r)+" "+note+" "+countriesOf(r).join(" ")+" "+((X[name]||{}).l||"")+" "+((typeof SV!=="undefined"&&SV[name])||[]).join(" ")+((X[name]||{}).ai?" ai "+X[name].ai:"")).toLowerCase();
    if(!hay.includes(q))return false;
  }
  return true;
}

/* ── 5 · profiles: regulation type + verify/source links ── */
function openDetail(name){
  const r=D.find(x=>x[0]===name);if(!r)return;
  const [n,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  const e=X[n]||{};
  const lic=e.l||((cu==="S"||cu==="M")?"Self-custodial software — cards via licensed issuer partners":"—");
  const macros=macrosOf(r);
  const macroChips=macros.map(m=>'<span class="dreg">'+MACROS[m]+'</span>').join("");
  const fields=[["Category",CATLONG[c]],["Audience",NICHE[ni]],["HQ",hq],["Founded",f],["Custody",CUST[cu]],
    ["Regulation type",regTypeOf(r)],["License / regulation",lic],["Founders",e.f||"—"],["Funding",e.m||"—"],
    ["Card",nw==="—"?"No card":nw+" · "+ct],["Cashback",cb],["Yield",y],
    ["Stablecoins",st?"Yes":"No"],["KYC",KYC[kyc]]];
  const badge=(e.f||e.s||e.m)?'<span class="enrich">researched profile</span>':'<span class="enrich pending">base profile — enrichment pending</span>';
  const enc=encodeURIComponent(n);
  let src=[];
  if(dom)src.push(['official site','https://'+dom]);
  src.push(['news search','https://news.google.com/search?q=%22'+enc+'%22%20fintech']);
  src.push(['crunchbase','https://www.crunchbase.com/textsearch?q='+enc]);
  if(macros.includes("EU")){src.push(['FCA register (UK)','https://register.fca.org.uk/s/search?q='+enc+'&type=Companies']);src.push(['EBA registers (EU)','https://euclid.eba.europa.eu/register/']);}
  if(c!=="T"&&macros.includes("EU"))src.push(['ESMA MiCA register','https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica']);
  if(macros.includes("NA")){src.push(['SEC EDGAR search','https://www.sec.gov/edgar/search/#/q=%22'+enc+'%22']);src.push(['NMLS consumer access','https://www.nmlsconsumeraccess.org/']);}
  const srcHTML='<div class="srchead">verify &amp; sources</div><div class="srcrow">'+src.map(([t,u])=>'<a class="srclink" href="'+u+'" target="_blank" rel="noopener">'+t+' ↗</a>').join("")+'</div>';
  document.getElementById('dwrap').innerHTML=
    '<div class="ov-head"><h2>profile</h2><button class="ov-close" id="dclose">close ✕</button></div>'+
    '<div class="dhead">'+logoHTML(dom,n)+
      '<div><div class="dname">'+esc(n)+'</div>'+
      '<div class="dchips"><span class="chip '+c+'">'+CATNAME[c]+'</span>'+
      (ni!=="g"?'<span class="nichetag">'+NICHE[ni]+'</span>':"")+
      (st?'<span class="badge-s">stablecoins</span>':"")+badge+'</div></div></div>'+
    (e.s?'<p class="dstory">'+esc(e.s)+'</p>':"")+
    '<p class="dnote">'+esc(note)+'</p>'+
    '<div class="dgrid">'+fields.map(([k,v])=>'<div class="dfield"><div class="k">'+k+'</div><div class="v">'+esc(String(v))+'</div></div>').join("")+
      '<div class="dfield"><div class="k">Active regions</div><div class="dregs">'+macroChips+'</div></div></div>'+
    srcHTML+
    (dom?'<a class="dlink" href="https://'+esc(dom)+'" target="_blank" rel="noopener">visit '+esc(dom)+' ↗</a>':"")+
    '<button class="cmp-btn'+(cmp.has(n)?" on":"")+'" style="margin-left:10px" id="dcmp">'+(cmp.has(n)?"✓ comparing":"+ compare")+'</button>';
  document.getElementById('detail').classList.add('show');
  document.getElementById('dclose').addEventListener('click',closeDetail);
  document.getElementById('dcmp').addEventListener('click',()=>{toggleCmp(n);closeDetail();});
}

/* ── 6 · data section (l2beat-style) ── */
const USERS=[
["PhonePe",200,"MAU","2025"],["GCash",94,"users","2024"],
["WeBank",400,"customers","2024"],["Nubank",100,"customers","Q1 2025"],["bKash",70,"users","2024"],
["Mercado Pago",64,"MAU","2025"],["OPay",60,"users","2024"],["PicPay",58,"users","2024"],
["Cash App",57,"MAU","2024"],["Revolut",50,"customers","2025"],["PalmPay",35,"users","2025"],
["Banco Inter",35,"clients","2025"],["PagBank",32,"clients","2024"],["Maya",30,"users","2024"],
["KakaoBank",23,"customers","2024"],["Chime",22,"members","2024"],["Nequi",20,"users","2024"],
["Wise",16,"customers","2025"],["Phantom",15,"MAU","2025"],["Monzo",12,"customers","2025"],
["TymeBank",10,"customers","2024"],["MiniPay",10,"wallets","2025"],["Zengo",2,"users","2026"]];
const VOL=[
["Wise","£118B","cross-border volume, FY2024","annual report"],
["Mercado Pago","~$200B/yr","TPV run-rate, 2025","MELI filings"],
["Cash App","~$280B/yr","inflows, 2024","Block filings"],
["Kaspi","~$100B+/yr","payments TPV, 2024","Kaspi reports"],
["PagBank","~R$500B/yr","TPV, 2024","PAGS filings"],
["OPay","~$100B+/yr","TPV, 2024","company PRs"],
["RedotPay","~60% share","of global crypto-card volume, 2026","media reports"],
["Payy","~$220M","cumulative volume, 2025","company PR"],
["EtherFi Cash","$145M+","card deposits, 2025","company PR"]];
(function buildData(){
  const catColor={T:"var(--t)",H:"var(--h)",W:"var(--w)"};
  const catOf=n=>{const r=D.find(x=>x[0]===n);return r?r[1]:"T"};
  const max=Math.sqrt(USERS[0][1]);
  const bars=USERS.map(([n,v,metric,yr])=>{
    const w=(Math.sqrt(v)/max*100).toFixed(1);
    return '<div class="hbar"><span class="nm" data-n="'+esc(n)+'">'+esc(n)+'</span><span class="tr"><span class="fl" style="width:'+w+'%;background:'+catColor[catOf(n)]+'"></span></span><span class="vl">'+v+'M · '+metric+' · '+yr+'</span></div>';
  }).join("");
  /* founding wave histogram, stacked by category */
  const years=["<2010"];for(let y=2010;y<=2026;y++)years.push(String(y));
  const hc={};years.forEach(y=>hc[y]={T:0,H:0,W:0});
  D.forEach(r=>{const y=r[4]<2010?"<2010":String(r[4]);if(hc[y])hc[y][r[1]]++});
  const maxTot=Math.max(...years.map(y=>hc[y].T+hc[y].H+hc[y].W));
  const cols=years.map(y=>{
    const seg=(c,n)=>n?'<span class="seg" style="height:'+(n/maxTot*140).toFixed(1)+'px;background:'+catColor[c]+'" title="'+y+' · '+n+' '+CATNAME[c]+'"></span>':"";
    return '<div class="col" title="'+y+' · '+(hc[y].T+hc[y].H+hc[y].W)+' founded">'+seg("T",hc[y].T)+seg("H",hc[y].H)+seg("W",hc[y].W)+'</div>';
  }).join("");
  const xlab=years.map(y=>'<span>'+(y==="<2010"?"<10":y.slice(2))+'</span>').join("");
  const volRows=VOL.map(([n,fig,metric,srcT])=>'<tr><td data-n="'+esc(n)+'">'+esc(n)+'</td><td>'+esc(fig)+'</td><td>'+esc(metric)+'</td><td>'+esc(srcT)+'</td></tr>').join("");
  const sec='<section class="datasec" id="datasec">'+
    '<div class="dcard2"><h2>reported users</h2><div class="dsub">latest public figures · company PRs &amp; filings, 2024–2026 · mixed metrics (customers / MAU / wallets) · square-root scale · directional, verify via profiles</div>'+bars+'</div>'+
    '<div class="dcard2"><h2>the neobank waves</h2><div class="dsub">new neobanks founded per year, stacked by category — watch the web3-native wave arrive after 2020</div><div class="hist">'+cols+'</div><div class="hist-x">'+xlab+'</div></div>'+
    '<div class="dcard2"><h2>volume watch</h2><div class="dsub">payment / transaction volumes where a public, citable figure exists · directional · click a name for its profile and source links</div><div style="overflow-x:auto"><table class="voltable"><tr><th>entity</th><th>figure</th><th>metric</th><th>source</th></tr>'+volRows+'</table></div></div>'+
  '</section>';
  document.getElementById('grid').insertAdjacentHTML('afterend',sec);
  document.querySelectorAll('#datasec [data-n]').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.n)));
})();

/* ── 7 · MiCA note in methodology ── */
document.getElementById('methodology').insertAdjacentHTML('beforeend',
  '<p><b>Regulation layer:</b> every profile now shows a regulation type (licensed bank, e-money, payment institution, partner-bank model, MiCA CASP, VASP/MSB, or self-custodial software) plus verification links to the official registers: the <a href="https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica" target="_blank" rel="noopener">ESMA interim MiCA register</a>, <a href="https://euclid.eba.europa.eu/register/" target="_blank" rel="noopener">EBA payment &amp; e-money registers</a>, the <a href="https://register.fca.org.uk/s/" target="_blank" rel="noopener">FCA register</a>, <a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noopener">SEC EDGAR</a> and <a href="https://www.nmlsconsumeraccess.org/" target="_blank" rel="noopener">NMLS</a>. Under MiCA, custodial crypto neobanks operating in the EU need CASP authorization; self-custodial software generally sits outside licensing perimeters — one more reason the custody axis is the one to watch.</p>');

render();


/* ═══ v5 LAYER · profile sheet redesign, region chip colors, active-filter bar ═══ */
const PCOL={T:"#89B0FF",H:"#D075FF",W:"#BAF24A"};
const REGCOL={NA:"#89B0FF",EU:"#D075FF",LATAM:"#FFA680",AF:"#BAF24A",MENA:"#FF5C16",ASIA:"#CCE7FF",OC:"#EAC2FF"};

/* colorize map legend chips */
document.querySelectorAll('#mapsec .mchip').forEach(b=>b.style.setProperty('--rc',REGCOL[b.dataset.mr]));

/* active-filter chips bar */
document.querySelector('.controls').insertAdjacentHTML('afterend','<div class="activebar" id="activebar" aria-live="polite"></div>');
function updateActiveBar(){
  const bar=document.getElementById('activebar');
  const chips=[];
  const add=(label,fn)=>chips.push({label,fn});
  if(cat!=="ALL")add("category: "+CATNAME[cat],()=>{cat="ALL";document.querySelectorAll('.pill[data-cat]').forEach(x=>x.classList.toggle('on',x.dataset.cat==="ALL"))});
  if(q)add('search: "'+q+'"',()=>{q="";document.getElementById('q').value=""});
  if(niche)add("audience: "+NICHE[niche],()=>{niche="";document.getElementById('f-niche').selectedIndex=0});
  if(region)add("region: "+region,()=>{region="";document.getElementById('f-region').selectedIndex=0});
  if(mapFilter)add("map: "+MACROS[mapFilter],()=>{setMap(mapFilter)});
  if(custody)add("custody: "+custody.toLowerCase(),()=>{custody="";document.getElementById('f-custody').selectedIndex=0});
  if(net)add("card: "+(net==="—"?"wallet-only":net),()=>{net="";document.getElementById('f-net').selectedIndex=0});
  if(regF)add("regulation: "+regF.toLowerCase(),()=>{regF="";document.getElementById('f-reg').selectedIndex=0});
  if(countryF)add("country: "+countryF,()=>{countryF="";const s=document.getElementById('f-country');if(s)s.selectedIndex=0});
  if(wantYield)add("offers yield",()=>{wantYield=false;document.getElementById('f-yield').checked=false;document.getElementById('lb-yield').classList.remove('on')});
  if(wantStable)add("stablecoins",()=>{wantStable=false;document.getElementById('f-stable').checked=false;document.getElementById('lb-stable').classList.remove('on')});
  if(wantNoKyc)add("no-KYC",()=>{wantNoKyc=false;document.getElementById('f-nokyc').checked=false;document.getElementById('lb-nokyc').classList.remove('on')});
  if(wantAI)add("ai in production",()=>{wantAI=false;document.getElementById('f-ai').checked=false;document.getElementById('lb-ai').classList.remove('on')});
  if(!chips.length){bar.innerHTML="";return}
  bar.innerHTML='<span class="ab-label">active filters</span>'+chips.map((c,i)=>'<button class="fchip" data-i="'+i+'">'+esc(c.label)+' <i>✕</i></button>').join("")+'<button class="clear" id="ab-clear">clear all</button>';
  bar.querySelectorAll('.fchip').forEach(b=>b.addEventListener('click',()=>{chips[+b.dataset.i].fn();render()}));
  const ac=document.getElementById('ab-clear');
  if(ac)ac.addEventListener('click',()=>{clearAll();if(mapFilter)setMap(mapFilter);regF="";countryF="";const fr=document.getElementById('f-reg');if(fr)fr.selectedIndex=0;const fc=document.getElementById('f-country');if(fc)fc.selectedIndex=0;render()});
}

/* redefine render(): same grid, plus active-filter bar sync */
function render(){
  if(window.__nbBoot){window.__nbDirty=true;return}
  const list=currentList();
  document.getElementById('count').innerHTML='showing <b>'+list.length+'</b> of <b>'+D.length+'</b> neobanks';
  const tN=list.filter(r=>r[1]==="T").length||.0001,hN=list.filter(r=>r[1]==="H").length||.0001,wN=list.filter(r=>r[1]==="W").length||.0001;
  const bar=document.getElementById('specbar');
  bar.children[0].style.flexGrow=tN;bar.children[1].style.flexGrow=hN;bar.children[2].style.flexGrow=wN;
  updateActiveBar();
  if(!list.length){grid.innerHTML='<div class="empty">no neobanks match those filters<button class="pill p-all" onclick="clearAll()">clear filters</button></div>';return}
  grid.innerHTML=list.map(r=>{
    const [name,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
    const on=cmp.has(name);
    const feat=name==="MetaMask"?" featured":"";
    return '<article class="card'+feat+'" title="view profile" tabindex="0" role="button" aria-label="view '+esc(name)+' profile">'+
      '<div class="chead">'+logoHTML(dom,name)+
        '<div><div class="cname">'+esc(name)+'</div><div class="cmeta">'+esc(hq)+' · est. '+f+'</div></div>'+
        '<span class="chip '+c+'">'+CATNAME[c]+'</span></div>'+
      '<div class="specs">'+
        '<div class="spec"><div class="k">custody</div><div class="v">'+CUST[cu]+'</div></div>'+
        '<div class="spec"><div class="k">card</div><div class="v">'+esc(nw)+(nw!=="—"?" · "+esc(ct):"")+'</div></div>'+
        '<div class="spec"><div class="k">cashback</div><div class="v">'+esc(cb)+'</div></div>'+
        '<div class="spec"><div class="k">yield</div><div class="v">'+esc(y)+'</div></div>'+
        '<div class="spec"><div class="k">region</div><div class="v">'+esc(reg)+'</div></div>'+
        '<div class="spec"><div class="k">kyc</div><div class="v">'+KYC[kyc]+'</div></div>'+
      '</div>'+
      '<div class="cnote">'+esc(note)+'</div>'+
      '<div class="cfoot">'+
        (ni!=="g"?'<span class="nichetag">'+NICHE[ni]+'</span>':"")+
        (st?'<span class="badge-s">stablecoins</span>':"")+
        ((X[name]||{}).ai?'<span class="badge-ai">ai · '+X[name].ai+'</span>':"")+
        '<button class="cmp-btn'+(on?" on":"")+'" data-n="'+esc(name)+'" aria-pressed="'+on+'">'+(on?"✓ comparing":"+ compare")+'</button>'+
      '</div></article>';
  }).join("");
  grid.querySelectorAll('.cmp-btn').forEach(b=>b.addEventListener('click',()=>toggleCmp(b.dataset.n)));
}

/* redefine openDetail(): profile sheet design */
function openDetail(name){
  const r=D.find(x=>x[0]===name);if(!r)return;
  const [n,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  const e=X[n]||{};
  const pc=PCOL[c];
  const lic=e.l||((cu==="S"||cu==="M")?"Self-custodial software — cards via licensed issuer partners":"—");
  const macros=macrosOf(r);
  const regChips=macros.map(m=>'<span class="preg" style="--rc:'+REGCOL[m]+'">'+MACROS[m]+'</span>').join("");
  const badge=(e.f||e.s||e.m)?'<span class="enrich">researched profile</span>':'<span class="enrich pending">base profile — enrichment pending</span>';
  const enc=encodeURIComponent(n);
  let src=[];
  src.push(['news search','https://news.google.com/search?q=%22'+enc+'%22%20fintech']);
  src.push(['crunchbase','https://www.crunchbase.com/textsearch?q='+enc]);
  if(macros.includes("EU")){src.push(['FCA register (UK)','https://register.fca.org.uk/s/search?q='+enc+'&type=Companies']);src.push(['EBA registers (EU)','https://euclid.eba.europa.eu/register/']);}
  if(c!=="T"&&macros.includes("EU"))src.push(['ESMA MiCA register','https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica']);
  if(macros.includes("NA")){src.push(['SEC EDGAR','https://www.sec.gov/edgar/search/#/q=%22'+enc+'%22']);src.push(['NMLS','https://www.nmlsconsumeraccess.org/']);}
  const srcHTML=src.map(([t,u])=>'<a class="srclink" href="'+u+'" target="_blank" rel="noopener">'+t+' ↗</a>').join("");
  const facts=[["Category",CATLONG[c]],["Audience",NICHE[ni]],["HQ",hq],["Card",nw==="—"?"No card":nw+" · "+ct],
    ["Cashback",cb],["Yield",y],["Stablecoins",st?"Yes":"No"],["KYC",KYC[kyc]],
    ["License detail",lic],["Founders",e.f||"—"]];
  document.getElementById('dwrap').innerHTML=
  '<div class="pmodal" style="--pc:'+pc+'">'+
    '<div class="phero">'+
      '<button class="pclose" id="dclose">close ✕</button>'+
      '<div class="pherotop">'+
        '<div class="plogo">'+(dom?'<img loading="lazy" alt="'+esc(n)+' logo" src="https://www.google.com/s2/favicons?domain='+esc(dom)+'&sz=64" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="logo-fb">'+esc(n.charAt(0).toUpperCase())+'</div>':'<div class="logo-fb" style="display:flex">'+esc(n.charAt(0).toUpperCase())+'</div>')+'</div>'+
        '<div><div class="pname">'+esc(n)+'</div>'+
        (dom?'<div class="pdomain">'+esc(dom)+' · est. '+f+'</div>':'<div class="pdomain">est. '+f+'</div>')+
        '<div class="pchips"><span class="chip '+c+'">'+CATNAME[c]+'</span>'+
        (ni!=="g"?'<span class="nichetag">'+NICHE[ni]+'</span>':"")+
        (st?'<span class="badge-s">stablecoins</span>':"")+badge+'</div></div>'+
      '</div>'+
      (e.s?'<p class="pquote">'+esc(e.s)+'</p>':'<p class="pquote">'+esc(note)+'</p>')+
      (e.s?'<p class="pnote2">'+esc(note)+'</p>':"")+
    '</div>'+
    '<div class="pstats">'+
      '<div class="pstat"><div class="k">Founded</div><div class="v"><b>'+f+'</b> · '+esc(hq)+'</div></div>'+
      '<div class="pstat"><div class="k">Custody</div><div class="v">'+CUST[cu]+'</div></div>'+
      '<div class="pstat"><div class="k">Regulation</div><div class="v">'+regTypeOf(r)+'</div></div>'+
      '<div class="pstat"><div class="k">Funding</div><div class="v">'+esc(e.m||"—")+'</div></div>'+
    '</div>'+
    '<div class="pbody">'+
      '<dl class="pfacts">'+facts.map(([k,v])=>'<div class="row"><dt>'+k+'</dt><dd>'+esc(String(v))+'</dd></div>').join("")+'</dl>'+
      '<div class="pside">'+
        '<div class="psidehead">active regions</div><div class="pregs">'+regChips+'</div>'+
        '<div class="psidehead">verify &amp; sources</div><div class="srcrow">'+srcHTML+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="pactions">'+
      (dom?'<a class="pvisit" href="https://'+esc(dom)+'" target="_blank" rel="noopener">visit '+esc(dom)+' ↗</a>':"")+
      '<button class="pghost'+(cmp.has(n)?" on":"")+'" id="dcmp">'+(cmp.has(n)?"✓ comparing":"+ add to compare")+'</button>'+
    '</div>'+
  '</div>';
  document.getElementById('detail').classList.add('show');
  document.getElementById('dclose').addEventListener('click',closeDetail);
  document.getElementById('dcmp').addEventListener('click',()=>{toggleCmp(n);closeDetail();});
}
render();


/* ═══ v6 LAYER · region hover intel, news, extended profiles, legal links ═══ */

/* ── map region info panel (hover a region → top neobanks there) ── */
(function(){
  const card=document.querySelector('#mapsec .mapcard');
  card.insertAdjacentHTML('beforeend','<div class="mapinfo" id="mapinfo"></div>');
  const userOf={};USERS.forEach(([n,v,metric,yr])=>userOf[n]={v,metric,yr});
  window.showRegion=function(code){
    const el=document.getElementById('mapinfo');
    if(!code){el.innerHTML='<div class="mi-head"><span class="mi-sub">hover a region for its top neobanks · click to filter the directory</span></div>';return}
    const inReg=D.filter(r=>macrosOf(r).includes(code));
    const tops=USERS.filter(([n])=>{const r=D.find(x=>x[0]===n);return r&&macrosOf(r).includes(code)}).slice(0,5);
    let list;
    if(tops.length){
      list=tops.map(([n,v,metric])=>'<span class="mi-item" data-n="'+esc(n)+'"><b>'+esc(n)+'</b> · '+v+'M '+metric+'</span>').join("");
    }else{
      list=inReg.filter(r=>X[r[0]]&&(X[r[0]].s||X[r[0]].m)).slice(0,5).map(r=>'<span class="mi-item" data-n="'+esc(r[0])+'"><b>'+esc(r[0])+'</b> · '+CATNAME[r[1]]+'</span>').join("");
    }
    el.innerHTML='<div class="mi-head"><span class="mi-title" style="--rc:'+REGCOL[code]+'">'+MACROS[code]+'</span><span class="mi-sub">'+inReg.length+' neobanks active · top by reported users</span></div><div class="mi-list">'+list+'</div>';
    el.querySelectorAll('.mi-item').forEach(x=>x.addEventListener('click',ev=>{ev.stopPropagation();openDetail(x.dataset.n)}));
  };
  showRegion("");
  document.querySelectorAll('#mapsec .mreg').forEach(g=>{
    g.addEventListener('mouseenter',()=>showRegion(g.dataset.mr));
    g.addEventListener('mouseleave',()=>showRegion(mapFilter||""));
  });
  document.querySelectorAll('#mapsec .mchip').forEach(b=>{
    b.addEventListener('mouseenter',()=>showRegion(b.dataset.mr));
    b.addEventListener('mouseleave',()=>showRegion(mapFilter||""));
    b.addEventListener('click',()=>showRegion(mapFilter||""));
  });
})();

/* ── top news · auto-refreshed weekly by tests/build-news.mjs (cron: Monday) ──
   item = [date, headline, sub, link] — link is a full article URL, or a
   Google News search query for hand-curated entries. Do not edit between
   the AUTO markers by hand: the cron rewrites that block. */
const NEWS=[
/*NEWS-AUTO-START*/
["Aug 22","Stablecoin neobank Fasset lands $1 billion valuation as SBI backs its payments push","via CoinDesk · Fasset","https://news.google.com/rss/articles/CBMiygFBVV95cUxPdUwtSTQtSEQ3QVh3TUN5WnZMY1Qya3lGaUZuVllPT1JQUmZ1M21WRl8zTDIwZ3UxYUhibVN1NFhEczBjaGVLeU1jMVdlYlJKS09ySHZkN3ZrU0hXY1FHRXFtX2l6VUY0b1RMWnRCQUNZazZTeGRuQ3J4N18zYVRpWmgzdHFWdDV5aWRvSl9zLUwzS3hKODdVRXgxR2F1X1c3bHdON2tLdVBUUktUWFBBcTFNcE0zUEY2ZFdMblVVUl94Y19DUEJ0VHZR?oc=5"],
["Aug 18","Africa’s biggest bank considers stake in Nigerian fintech OPay ahead of planned $4 billion US IPO","via Business Insider Africa · OPay","https://news.google.com/rss/articles/CBMi0AFBVV95cUxONVp5Ukd4eVEwb0pWWDlYQkpYS3RLSjVVNUZhcnNoM2k4TlVPeGxtNy1hclhzVklPdDJrQjNNMGx1OXd6dUVQWDZoQXZhYVRRdVlUYmNFYkxiX0d0QlZaT2E2OFh1MElvM1hNaVhEYjQ4NXV5eUNkYXdSU2hLUFJuSUJTdFJ3YTFTS3NReW14VnhrNTNLWXg2Wl8wdnFyWUc0c2E5QUZmVXpHSjgzNUdzZy1DRC1RNTFZM0h4SC1XWllwVFhQdmRwZmlOeHdzYWNB?oc=5"],
["Aug 15","MetaMask Parent Consensys Taps Wall Street for 2026 IPO","via CoinMarketCap · MetaMask","https://news.google.com/rss/articles/CBMingFBVV95cUxPcmNLNXllaTQ1a0dxbkZ2VlFGOHM0YjhfVzNVeE0zN1JURXNXRmtXTEVaeGt3amhYZWVSVlFwN3hqY2VzRXI5SVZJc0N0OXVvY1hJaDVKMDdjVzVIdlUtdHBEOFQ4cU41YjJ4Umhtd004MkJmYVBsemM3bnAzWGZFRUc0RVNwZUc3QVFFd2lTWXVKUm5uMzVLYktuRTBOQQ?oc=5"],
["Aug 14","Nubank Profit Hits Record $1 Billion as Credit Book Surges","via Bloomberg · Nubank","https://news.google.com/rss/articles/CBMiswFBVV95cUxPTkZHcXhYN0dxOEN5d0Rob08wcTZ6cFNJVjdCa1hFZTFoWUxhYzdvckEzZHIwN3NITEFHTm9FaWtULVNPbm1lZGctc0tSRkZqaDE4bFh3dndWVVFBYVh4d1BnOE5LcGJXdWRmUU9RZlh0RWxYalByLW9zVFBMa1BUbjZud3lTNnQwMmlFcEM4T09tZmhfVXd6ejU1R1pwWDlPY2JJTzlLZ2JJUjY3R1Exc1IyNA?oc=5"],
["Aug 10","SEC settles charges over SpaceX, Klarna, pre-IPO share fraud","via Reuters · Klarna","https://news.google.com/rss/articles/CBMixgFBVV95cUxOM3ZsTGVPUklIeV9qX0NUZGtzVFlvNTZxb3lZZUVoOG1HRUkzZVlOdWZWcmZIYzR4eDNlZzJlTjNkQkRsa2ZJaFFKVk1iRTZhWFJTTEJOcUk5dGd4MF9aUWdIcm5BTXRVOGxnYzZsT3JZWEtWT0kxUGQ0aDNKdEFsMU5NQnBRVHZWNmh6YmViR3BvV1k3T0pHOWFOSDEwQ2NuQUtWOVhSR2JBWEJnRmEyemk1aFhCbm5xeF9ZeWZLTWlVcHgxZGc?oc=5"],
["Jul 16","Tether invests $20 million in Ualá as the fintech firm reaches $3.2 billion valuation","via The Block · Ualá","https://news.google.com/rss/articles/CBMi0gFBVV95cUxPVlVSVDJwcVJLWndQX0hwd1R3b2FZMUxnSHVtNTdfdVNkZWFBeVJ2RHBtd0ZpT0xyalhtSWlNNEc0UGlKNmpjSWpHamRWdmdRc21Qck54OE1mY0lQOUxFaWdMUzVabHJGekx3Z3QxQVdjSTA5eHFUWm9IS2lYRGhzVVp5YkV0X2g2emVTQ1RqeFc1dlREQWtYeEpxNzhCVElvVjFPcEhQLWR3SDdsLVNIMWZVY1ZsbXIxcVIwMVQ4cWx4SEFkOXMzUnBtLXVnRzFOelE?oc=5"],
["Jul 14","AI Banking Platform Flex Secures $1.2 Billion Valuation","via PYMNTS.com · Flex","https://news.google.com/rss/articles/CBMizAFBVV95cUxOdTNIUlc1emFjZkgzTFNPZmp3ZVRBUkl4dEt6U1FkWGhoYm13ZlhjMnI2bWlrTDEtSElybmF0Z3ROZllmdDVDSW0ybXdYeWRRazlpWkdYNTVaSUJnY01FNG16REU1bDdoTjI5d1cydDRmS0QzLWJiQmthS09ROHRXRlp6TzBIdF9DRHdEa0gtSXJRakR5Tms1MkFuek5mYjZQdmJMa1J6Vk40VHBhTkpoVVo4LU0wTngxZlF5LTVhbVVHc3FjZTdlengtVFg?oc=5"],
["Jun 29","MiniPay Launches Visa Card to Bring Stablecoin Spending to Everyday Commerce","via TechAfrica News · MiniPay","https://news.google.com/rss/articles/CBMitgFBVV95cUxPaWxFVmd3WXQ2d2hkN0dYM1d3czItSWR0SmtGLTFVbHQyUmg1TGY5X21JMTQxdzg4ZzE1cUNQWS1WTnhjT3h4VXdUb29DbndfTTRyN1ZjWWNDQjBqZzhrWXFzWWx4R20wRGdORmsxUVM5eHRCLXJSbUw5U3RTWWdYZ3BLSFo2U0lGX0JwcUdsNnpvY3pSWmlNNGRaUlM4U0owc2VVazl1SXRyRHl0Sng5R1VycnB0dw?oc=5"],
["Jun 24","SBI Group Launches JPYSC, Japan’s First Trust Bank-Backed Yen Stablecoin","via Yahoo Finance · Trust Bank","https://news.google.com/rss/articles/CBMimwFBVV95cUxPdDdiUFRNNGVqUDQ5WXFFajBUYnJ4cGVoQlZMWm02b1hPRGlsMDRuT0ZQTEhERXdTVVlBTTJLN3BZOEZUSFF5NXc0UHZGYkVwOGR3TVUtVV9FdHhBZnFFYmI2YWE2T3VIa1hjTFUxSHFsYXYxc2U3RWR6dW1ZdkRFamFrWE9SemlHYTluOUN6eXBvMTNuTF9WVmV5SQ?oc=5"],
["Jun 15","D360 Bank raises SAR 1.5B to become largest Saudi digital bank","via Dealroom · D360 Bank","https://news.google.com/rss/articles/CBMinAFBVV95cUxNYjJFOERRd2RKMkM2MDJqQWp5ajZ1TkVROFctczlpNnVDTTAzcFh6SU15Tnh4NTA2aXZGaE9rcTJsUzBRSGduN2p3Tm1XZFZQZ0RVbExkb0VMbDNncU5xMElwWlJ5b1NoRElvTDQ5SndKYzY0MkZlSTFFRnc3ak1BdFExMTJ4VE83N0lkMEZ4Q3lqNE43aEVCekN2VFM?oc=5"],
["Jun 15","Neobank Current raises $80 million, reports growth","via American Banker","https://news.google.com/rss/articles/CBMijAFBVV95cUxNRUgyNTY3a1NNWDJuMGxvemp3TG1wMGVrUkNuUWUxUGFPME8wY3lLT2NOVFJYM2duaERNYmpsZTc4U2RfT3J4S2hEdjBwOEVQWGt0Z0hDM2hvXzJxQVFQRHRSdDg5Y3dLMjJZcUxNQ250MnNBRWpFakZjU3JYbGFIT1lFYkR5X0h5NURlVw?oc=5"],
["Jun 11","Skadden, Simpson Thacher Steer Digital Bank's $142M IPO","via Law360","https://news.google.com/rss/articles/CBMimAFBVV95cUxNaExvUWc0a3dUZTNaOVBaZDJ5MVF1cllxUC03ZFRSZWlqTE9QaU0tRzh0ZFlIcnBjZzBLdWdlNWx4NkhLTDg4MTNYYlJheVZNb1JNaWNIRTM5SFhWLU41dXdFWGM5RWE0ZWlLMjR1eE5fd1VFS0c0cGNyOHJhY3JBUnVXd0xCS0hkVTFCV1pHbWdJdnFYNW9iT9IBVkFVX3lxTE1wWlZDSmJ1V2tnUFdXamd2YzhtRlBnalhBN1ExbXUwZWM3TnFtVWNsazJ0QW1ZM291U2szcFNGbDM0QWNMWWdfTWc3NzA4QXdaa0ZqS3lR?oc=5"],
["Jun 8","MNT-Halan Reaches $1.4B Valuation After New Investment Round","via Dabafinance · MNT-Halan","https://news.google.com/rss/articles/CBMie0FVX3lxTE5YRXlFLVE2SF8tTDVfQ0ViWXNFQzByWUpwaE1OQnN3MnE5cVQ0akN2bmxwV2IzcnFRV09QMzYtSzd2d2lSdllaM1JZQmxudWVaU3RZS1ZZYkFWY0Ewa1RQeW8yN3NRWmk1MDBpQTlHRjM5SEJ1QURpZ0haOA?oc=5"],
["Jun 2","Digital Bank Forbright Seeking to Raise $158 Million in US IPO","via Bloomberg","https://news.google.com/rss/articles/CBMisgFBVV95cUxPd0VqOUtTNzRTSU11dlJVaHFWNjJGZmNHc3M4TEtZWVRnUWVXM2FzRU9SMU4wSk9ydmdPMURlVlpSWXo0cUJXZ3BEX1hnRGctMF8wQXJXazg0Vlh3anNscHMzV1J3cHhhWm5seWQ4Rk9idy1qek9Dek9mY2JFZUdsRzJDeHd5V2tqUjhlam1EczhRMXdJaktnQ3JJblg2akNlODZ0bkJtMEpUcWlkVW1hT0ZR?oc=5"],
["May 28","SoFi launches native stablecoin to all its banking customers","via American Banker · SoFi","https://news.google.com/rss/articles/CBMinAFBVV95cUxNaFdPZE5xYlBvbm9JOGwwRzUxZmxpOWhOa1lqbURLc044QUZfNW9oQjY0eUZyVzJmdUlYUUl3TFQ4OUZIV0IzdHJfSmpNNWxlbDlMX01ReXBlTEJfN1NSLXFucVRzNi1WUVVKS1NxY0ZpcTRYU3ZnOWp4WUdXNXhnaFdyTjFxcnBudDBKd2xnUk5aQ1dsT2hEUzVfX3g?oc=5"],
["May 20","Digital Banking Startup Mercury Lands $200M At $5.2B Valuation Amid Fintech Funding Uptick","via Crunchbase News · Mercury","https://news.google.com/rss/articles/CBMimwFBVV95cUxPLTItcWp6dUNEUXZ2SUJvVTlKdUZSdFZROWd4bHFkblF6cDFnZkpXZEpXdlpSdWdDRTZ3ZUw5M3o0UEJULWxnNlN2UktzeHZpY3RRbWR0OWJSNzJFc3czTk41LW1EQ1Z2YTFqTjdtRldKRU9BSkVVTjh3MWFhTTc5V0p0SUF1c0hLYVlIV3JoVWJCTFcxcTJyRzhESQ?oc=5"],
["May 18","Profitable African Digital Bank Plots Going Public In USD 15 B IPO","via WeeTracker","https://news.google.com/rss/articles/CBMickFVX3lxTE9lQS1NTnhhRlBiMXRiOFNVVEo1U2h0ZkxUOHprZ05RcnMzczFDTmxScEtJMVhIZzFMd1ZDdWgydm5MaHJLY01ybGhXZWJwOUFud3NkRm95UTVFM0t0MWFmUUdUVE9HeEJkZjlfYkpMVlE0Zw?oc=5"],
["May 7","Indonesia's BNPL platform Kredivo acquires nearly full ownership of Vietnam’s Timo Digital Bank","via TNGlobal · Timo","https://news.google.com/rss/articles/CBMiyAFBVV95cUxOZ3BZUl90OU5aUUdWN1BMOC1KQ0V6NFV2MUFWZ3JsQUJEZVc0UVBEaUpVaWZ3aWxCMlp2cG1pb2p1eHdjMXg3d25ZbHVWY0xnN2lDejFHOWFZT1dxRHI5ZW9LbkxCNEx3VHhQUnhmRVNIbTQ0eDB2NElyUTAzVXJReE9LMlFlS0t1dXQ4a0pGSGoxQVI1dnFPNGhRM1lDMFJpd2hlNHlkbW5WVVdrX2p6NUZncXpJbmltcldLVlRLaG1mcTNOUW9UUQ?oc=5"],
["Apr 21","UK's Revolut eyes up to $200 billion valuation in IPO, FT reports","via Reuters · Revolut","https://news.google.com/rss/articles/CBMiowFBVV95cUxQMDM4bi1JcXRfYXIwa1JUQjhQNDBvcThRZVAzcEZHTk5YMEExU3Rvc0VTXzAxdjdFN0EtWXJhRTNjcmtYRVRFYmlBSk5TRlZ6SE1jRmFOLWxXVURVWXdwOG5rY2thenZJNEZUdGt3MU4zTDBKenZpbXVqS1EtRmZQV2ZwRWJxQWRTUEh4VlVfYzFKZ1RvUFk5TXdGaU1UZEphRDU4?oc=5"],
["Apr 20","Mexican neobank Plata hits $5 billion valuation","via Finextra Research · Plata","https://news.google.com/rss/articles/CBMikwFBVV95cUxPb2hhbHJuSE5EdW5Kb2tvM3RuazlmTVBFS3lYSUM3RS1CZF9uRUk1Mkh3c1d2REtEVDFFdkZCQ0pfTHg5WGdYa2pqYWYxOXZSczY4ZzNTNXozUXA3c09kd3Rjb19DS2dSeFkxR3JvMW0yMl9Jb2pGWGplNFUwem82VnkzX2l0NGd1RGpCams2ZGs4b2s?oc=5"],
["Apr 16","Slash, a Ramp competitor founded by teenagers, raises $100M at $1.4B valuation","via TechCrunch · Slash, Ramp","https://news.google.com/rss/articles/CBMirgFBVV95cUxOUmtYV283ckF0N1hCaURTU1NoZWNhVFo4d0Vla3BmYTBJQ3lOMjZhVnRIbzRTSVB5bENoM2tOSTZTVnFiZ0prTkgxV21Ba003V2UyNXdlc1d3QW1CSExvZk1KcFFLOUNLcUhsU2RWTlZEal9nWEpYM3BTRTlQeVhwQ2lxeFc5RGFxUU1jbXg0MmJtZWdLNkh6c1RfbnVoczRvYjdiUVFhV0U3V3F3Q0E?oc=5"],
["Apr 5","Monzo quits the US to focus on Europe ahead of a London IPO","via The Next Web · Monzo","https://news.google.com/rss/articles/CBMiYkFVX3lxTE94dkZBVTB4b01JQndIaWg2Uzd0YWphZkU1RGJ6dzkwWmJFNEhPT3FuVWs1TS0yVlNLb1BDd0YzNl9SNWo5aVpobDJiZTFTck1Mcl9aYTA1WU16NWdCNDM5OWh3?oc=5"],
["Mar 26","British Neobank Zopa Eyes Acquisitions for European Expansion","via Bloomberg","https://news.google.com/rss/articles/CBMisgFBVV95cUxQRnd0S0RpdkxydG4xYnJ3WUVtd0wyUF94dzgyQW83WDVOeDRKWU9LN3o3Y0tyUlJiYno2R3ZlV0JYOWprTnFTMGdKOXA3X2xtUEVYTkJsWXNuQlZpeGRwd0hRcVduZEtUVmdpUFJyejFYclFlQm1pSWpuOFVhS3YwcW5rdlFxajFnVllTMkY2UDF6am82YjNISE8yS3ZmYU1OUy15ZXNyb2p4VWpZZmJwZlpB?oc=5"],
["Mar 18","Palo Alto founder Nir Zuk sells digital bank Esh to Isracard at $130 million valuation","via calcalistech.com","https://news.google.com/rss/articles/CBMiZ0FVX3lxTE5Ed3pOMGVDTi01SEVDSXI2cEF5S080YlBCczh3bEdaQVNsRDdDVEFSajdsQTl6MW9LTWlMOVVpMHFxTGZzeU9CNjMzNDlSdnVBRnU4d2c3MWlkZUwwTDhTLWNhcHJ2NlE?oc=5"],
["Mar 10","Uzbekistan’s Uzum valuation leaps over 50% in 7 months to $2.3B","via TechCrunch · Uzum","https://news.google.com/rss/articles/CBMinAFBVV95cUxORGlUeTJCeWVoWW1YazdkN2ZVRm45UUpKRWhFcDIwM0VvVHowbkVxUE84YjVKY014d1lKQjRFNFI1SFAwSHZ3emhFaWY5UDRjQjh1cV9xbXRPSURjMzZ2d2RYUWNZZGtkc2RZR1VpT1ZxSjBEbDN2OFRxakxTRllIY0JERmpLTjEwU280SHNVM1FrYl9rN1VhcjYxTHU?oc=5"],
["Mar 4","India’s PhonePe Aims For $10.5 Billion Valuation in IPO","via PYMNTS.com · PhonePe","https://news.google.com/rss/articles/CBMirwFBVV95cUxOZUF2STA5amJvd2tMbXVCbUM5bERfWVhkM1F2Sm5QY2p0aE5xVGhVY0VOQ3JXdk1rMERYMnVFMS1ydzZSMUFDVlNIRWtZTDg2SU15Mlk3MUNfQUhXSkhRYzRGeHFXTDlLWHpmNkFmdW1GOHlxeVcwMFFRdDdrZUVBRFlfNVBpUFZYRHhUcmF6NHBqRDVRV0ctSHhhQm1Eb0Q2N2IxcnUtTElJdGU5d0h3?oc=5"],
["Feb 16","Philippines' Digital Bank Maya Looks to US Market for Up to $1B IPO","via Yahoo Finance","https://news.google.com/rss/articles/CBMiiAFBVV95cUxQb3I4SDlFYWtOVUxldGxJQ0RDcHlxZ1ZETnE3UHNibHVWY2ZuNmVGS1hKZjdWVEdzWXVxQ1FkUjRCOUh2cjZBaHFsQ2l5WlpVaHhjOGNOMGoxRVlvMWNoTXM0UzIyZlZkcnpaZ2psZGNQVkJaV004dHNDOEF4cEdUcFdJMmdTZ2tR?oc=5"],
["Feb 14","Chime Is Down 27% From Its IPO Price, Yet Posting 29% Revenue Growth: Why This New $15 Million Bet Stands Out","via Yahoo Finance · Chime","https://news.google.com/rss/articles/CBMieEFVX3lxTE5YMEV2TjE4NU5sd2FnVXlMdE5pbUVLSFQ4eTRfbGhuQndKVTJPc3JIMUpLNzYzeVVtY2xwODVHeV9oaHZrUGtma1VIV1QwN0VLaExJdnZsN19EVDBKdEQtaFFzd3pPX0M4VXJpV1pTbTJ5RXNNa0U2VA?oc=5"],
["Feb 9","Zoth: Privacy-First Stablecoin Neobank Raises Strategic Round","via Pulse 2.0","https://news.google.com/rss/articles/CBMihwFBVV95cUxNN0RXemk3cW5ha2JTT1BCUzRjTTl4MkFGZlgtazhOZkF5U01RUnJxVUNoeXJ4enFqdUFpMTNnQmw1dVRwS3NqMFJ4M0QtdnZXVFpMdl9WQjE4d3dUQ3lFWWR6Zkx4a0F6YnVtSmJNYkotem9qc01Qa1Nmc2dWdFpjMVdjY25jeGfSAYwBQVVfeXFMTmZqU1VrSnVtMDhlNXFJb0h2ODhHMnlNcEFvVG9XNEVqckN1bWFJWl94eTJTYXRNaEVuUHVHcXQzdGxjNjl1NjVLNWxOZUhsNVJYbEFFWEU1WDBnZzlDR0ppblZiNzhkYThtdkhXNGpaaGtUanNYVVBjcWJuZXhYbWg4YlRwdldSb251VC0?oc=5"],
["Feb 2","Exclusive: Warburg Pincus leads Varo's $124M funding","via Axios · Varo","https://news.google.com/rss/articles/CBMilgFBVV95cUxQY3FMSVljTC11eTZHU1ltSUkxdDd0UW9lQkxWMmg2RzYtdDhUbFpOYk5ELWJaalpWaE95LURUUEgtWHVkZVBkeE1na1BpT2I1ZzkxOUx4d0FNMk1ubkU5aDZlTmhLaUI0TGJqRUdLS21Gb25fVXVvaWJiOVU0ZGp2d1dFajZaeGNSYjZIYURFQWdPeE1vTEE?oc=5"],
["Jan 22","Capital One acquires Brex for a steep discount to its peak valuation, but early believers are laughing all the way to the bank","via TechCrunch · Brex","https://news.google.com/rss/articles/CBMi7wFBVV95cUxQUTQwTzVxZG1ZcURjODdleVd3MUszRmxXN3FDc09pWUhPOTFnUmhVVlY1aUtHc21aZUN1UU5jSEhUVGNRTzY5VndsRUFkMWV6aTNXcWlwbEFTRXl4Z0llekpualhua0ExY0ZyelVQdEZfZ2JDejh3XzJ5RDJuUlZKeFpEVnNwRGNJZVA4SWxFZ2RVNUZydUlsZzN4YkFkcFVyYTY0Y2VZbS1mWGlhR01tQktfcWd4aUk3Nzd3clI5WGI0ZnZHODd2bXNzcjN5VVREdHE2dkxTUWtfak9WVmp1VEttZC12VDBtWmVINHRQcw?oc=5"],
["Jan 20","Brazilian digital bank PicPay targets $2.5 billion valuation in US IPO","via Reuters · PicPay","https://news.google.com/rss/articles/CBMisAFBVV95cUxPY2p5aE9yT2NaZTRhMUpkZm9NV2J4Qm1QY1FrWGk1OWRaeS03cFN6bW91amFSTS0zUjMxMl9QejNndURwY2MteDdWZklQX1ItSHRBcm1adTlRRUI1SXJnbUFJRzJXaUdMRXZhMmhaM0hsSHNucF81WWJ0WXdfTWhjWG1kTzdVRlNpTDFHU19JdDlEWlVXVjQ3MEtWbXZFN05kaVRXM2lWaDdWR3FZTEllRw?oc=5"],
["Jan 16","Veera, the On-chain Neobank for everyday crypto users, raises a total of $10M, Backed by Sigma Capital, CMCC Titan Fund and more","via TradingView · Veera","https://news.google.com/rss/articles/CBMijAJBVV95cUxPRk1RVFVGSmpMZTNKVlRQWmNfc1R6U2hIU3RfM3QxTkUwZmN6cW5fdW5NUl84ZmRIeWJ0TkdWdGFiNEdjSjVPRDlZeGdsTENlVlpEejFMR0MzbnNJY0ZVRHIwX3VfOGNmS1FWa3BaVXl3Nlc0b1QyRTVfLWZ0U2NxU3YtLVZuRzA4SWFqaXhPWjhodWpsSmt1eXVqXzN5VENDMnhwejByVmVzMEoybVY3d1FrRGI1RFUtakNSdEFud0tId3NXMTROTWYtYUdmc0NjaXc1OGZaeklsT1luRVNRU2pMd3J1YUdNQUJMeHpRR29mU3NPc2p2SUJLak9EaXZiNERYMXBfWTFSZEhG?oc=5"]
/*NEWS-AUTO-END*/
];
const NEWS_UPDATED="2026-08-24";
(function buildNews(){
  /* the feed is a year-to-date timeline (one top story per 2-day window) —
     group rows under month headers so the six months scan like a chronicle */
  const MFULL={Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December'};
  const yr=(NEWS_UPDATED||'').slice(0,4);
  let rows='',lastMon='';
  NEWS.forEach(([d,h,sub,qq])=>{
    const mon=d.split(' ')[0];
    if(mon!==lastMon){lastMon=mon;rows+='<div class="n-month">'+(MFULL[mon]||mon)+(yr?' '+yr:'')+'</div>';}
    const href=/^https?:/.test(qq)?qq:'https://news.google.com/search?q='+encodeURIComponent(qq);
    rows+='<div class="newsrow"><div class="n-top"><span class="n-date">'+d+'</span><span class="n-head">'+esc(h)+'</span><a class="n-link" target="_blank" rel="noopener" href="'+esc(href)+'">read ↗</a></div><div class="n-sub">'+esc(sub)+'</div></div>';
  });
  const sub='the biggest neobank story of every couple of days, back to January · auto-curated from live feeds'+(NEWS_UPDATED?' · updated '+NEWS_UPDATED:'');
  document.getElementById('grid').insertAdjacentHTML('afterend',
    '<section class="datasec" id="newssec"><div class="dcard2"><h2>top news · '+yr+' timeline</h2><div class="dsub">'+sub+'</div>'+rows+'</div></section>');
})();

/* ── extended profiles: legal links, users/volume tiles, position, peers ── */
const USERMAP={};USERS.forEach(([n,v,metric,yr])=>USERMAP[n]={v,metric,yr});
const VOLMAP={};VOL.forEach(([n,fig,metric,src])=>VOLMAP[n]={fig,metric,src});
/* ── money-movement services (verified per provider docs; tags omitted when unverified) ── */
const SVLABEL={"on-ramp":"crypto on-ramp","off-ramp":"crypto off-ramp","fiat-payin":"fiat pay-in (bank rails)","fiat-payout":"fiat pay-out (bank rails)","iban":"own IBAN / account no.","multi-currency":"multi-currency hold","virtual-cards":"virtual cards","crypto-cards":"crypto-settled card"};
const SV={
"Wirex":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","multi-currency","virtual-cards","crypto-cards"],
"Crypto.com":["on-ramp","off-ramp","fiat-payin","fiat-payout","crypto-cards"],
"Nexo":["on-ramp","off-ramp","crypto-cards","virtual-cards"],
"Plutus":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","multi-currency","virtual-cards","crypto-cards"],
"Gnosis Pay":["on-ramp","fiat-payin","iban","crypto-cards"],
"MetaMask":["on-ramp","off-ramp","crypto-cards","virtual-cards"],
"Bybit Card":["crypto-cards","virtual-cards"],
"OKX Card":["crypto-cards","virtual-cards"],
"Coinbase Card":["crypto-cards","virtual-cards"],
"Bitpanda":["on-ramp","off-ramp","fiat-payin","fiat-payout","multi-currency","crypto-cards"],
"Strike":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban"],
"eToro Money":["off-ramp","fiat-payin","fiat-payout","multi-currency"],
"Zengo":["on-ramp","off-ramp"],
"Trust Wallet":["on-ramp","off-ramp"],
"Revolut":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","multi-currency","virtual-cards","crypto-cards"],
"N26":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","virtual-cards"],
"Monzo":["fiat-payin","fiat-payout","iban","virtual-cards"],
"bunq":["fiat-payin","fiat-payout","iban","multi-currency","virtual-cards"],
"Nubank":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","multi-currency","virtual-cards"],
"Cash App":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","virtual-cards"],
"Mercury":["fiat-payin","fiat-payout","iban","virtual-cards"],
"Qonto":["fiat-payin","fiat-payout","iban","virtual-cards"],
"Wise":["fiat-payin","fiat-payout","iban","multi-currency","virtual-cards"],
"Vivid Money":["on-ramp","off-ramp","fiat-payin","fiat-payout","iban","multi-currency","virtual-cards"]
};
/* ── FX markup on the free/standard plan (r=summary, d=as-of YYYY-MM, u=source). Sourced + spot-checked; rates change, always confirm with the issuer. ── */
const FX={
"Revolut":{r:"Interbank rate; free to £/$1,000/mo on weekdays, 0.5% over; +1% weekend markup",d:"2026-07",u:"https://www.revolut.com/en-US/legal/standard-fees/"},
"Wise":{r:"Mid-market rate + conversion fee, typically ~0.33–1.5%; free if you hold the currency",d:"2026-04",u:"https://wise.com/gateway/v1/us/disclosures/long-form"},
"N26":{r:"0% N26 markup on card payments; Mastercard rate passed through (Standard plan)",d:"2026-07",u:"https://n26.com/en-eu/using-debit-card-abroad"},
"Monzo":{r:"0% foreign transaction fee; Mastercard exchange rate, all tiers",d:"2026-07",u:"https://monzo.com/help/travelling/understanding-fees"},
"Starling Bank":{r:"0% foreign transaction fee; Mastercard rate, no markup, any day/amount",d:"2026-07",u:"https://www.starlingbank.com/travel/"},
"bunq":{r:"Mastercard rate + 0.5% up to €1,000/yr; 3% conversion fee above that (Free plan)",d:"2026-07",u:"https://www.bunq.com/personal-account/banking-plans/bunq-free"},
"Vivid Money":{r:"Visa base rate + up to 1% on non-EUR (0.5% rising toward 1% outside FX-market hours)",d:"2026-07",u:"https://support.vivid.money/en/articles/8680120-what-s-the-exchange-rate-for-purchases-made-in-a-currency-other-than-the-euro"},
"Cash App":{r:"3% foreign transaction fee; waived on card-present txns for Cash App Green users",d:"2026-07",u:"https://cash.app/us/en/legal/tos"},
"Varo":{r:"0% foreign transaction fee, no exchange-rate markup; Visa wholesale rate",d:"2026-07",u:"https://support.varomoney.com/hc/en-us/articles/21998473318932-International-Travel"},
"SoFi":{r:"0.2% conversion fee on debit foreign purchases/ATM (Mastercard); credit cards 0%",d:"2026-07",u:"https://support.sofi.com/hc/en-us/articles/360061173072-What-is-the-foreign-exchange-fee-on-the-SoFi-Checking-account"},
"Current":{r:"3% international transaction fee on all purchases (Visa wholesale rate)",d:"2026-07",u:"https://support.current.com/hc/en-us/articles/4408251826715-Can-I-use-my-card-Internationally"},
"Dave":{r:"3% foreign currency conversion fee on non-USD purchases (Mastercard wholesale rate)",d:"2026-07",u:"https://dave.com/deposit-agreement-coastal"},
"Wirex":{r:"0% FX markup (Visa principal member), all tiers; small spread if funding from crypto",d:"2026-07",u:"https://www.wirexapp.com/en-gb/stablecoin-and-crypto-card"},
"Bybit Card":{r:"Region-dependent FX on Mastercard rate: EEA 0.5%, AU 1%, BR 1.5%, APAC/MX 2%, AR 7%; +0.9% if crypto-funded",d:"2026-07",u:"https://www.bybit.com/en/help-center/article/Fees-and-Spending-Limits-Bybit-Card"},
"Qonto":{r:"Entry card 2% on non-EUR card payments; Plus 1%; X plan 0% (business only)",d:"2026-07",u:"https://support-fr.qonto.com/hc/en-us/articles/23947693926929-Can-I-use-my-Qonto-card-abroad"},
"Tide":{r:"Free plan 2.75% FX on non-GBP card txns; Smart/Pro/Max 0% (UK business)",d:"2026-07",u:"https://www.tide.co/features/expense-cards/"},
"Curve":{r:"Interbank 0% up to £/€250/mo then 2.99%; +1.5% weekend/holiday surcharge",d:"2026-07",u:"https://help.curve.com/en_gb/killer-fx-HyquHdnUu"},
"Bitpanda":{r:"0% Bitpanda FX on non-EUR (Visa markup may apply); real cost is the crypto-sell spread",d:"2026-07",u:"https://support.bitpanda.com/hc/en-us/articles/360018933120-What-is-the-Bitpanda-Card-and-what-are-its-benefits"},
"eToro Money":{r:"0% FX fee; interbank rate, no markup on supported currencies (UK/EU)",d:"2026-07",u:"https://www.etoro.com/money/using-debit-card-abroad/"},
"Mercury":{r:"3% currency conversion fee on all non-USD card transactions (Mastercard rate)",d:"2026-07",u:"https://support.mercury.com/hc/en-us/articles/32529650270484-Understanding-conversion-fees-for-non-USD-card-transactions"},
"Brex":{r:"Up to 3% FX markup on transactions needing conversion; local-currency cards avoid it",d:"2026-07",u:"https://www.brex.com/support/using-brex-internationally"}
};
function openDetail(name){
  const r=D.find(x=>x[0]===name);if(!r)return;
  const [n,c,reg,hq,f,cu,nw,ct,cb,y,st,kyc,ni,dom,note]=r;
  const e=X[n]||{};
  const pc=PCOL[c];
  const lic=e.l||((cu==="S"||cu==="M")?"Self-custodial software — cards via licensed issuer partners":"—");
  const macros=macrosOf(r);
  const regChips=macros.map(m=>'<span class="preg" style="--rc:'+REGCOL[m]+'">'+MACROS[m]+'</span>').join("");
  const badge=(e.f||e.s||e.m)?'<span class="enrich">researched profile</span>':'<span class="enrich pending">base profile — enrichment pending</span>';
  const enc=encodeURIComponent(n);
  /* verify & register links */
  let src=[['news search','https://news.google.com/search?q=%22'+enc+'%22%20fintech'],['crunchbase','https://www.crunchbase.com/textsearch?q='+enc]];
  if(macros.includes("EU")){src.push(['FCA register (UK)','https://register.fca.org.uk/s/search?q='+enc+'&type=Companies']);src.push(['EBA registers (EU)','https://euclid.eba.europa.eu/register/']);}
  if(c!=="T"&&macros.includes("EU"))src.push(['ESMA MiCA register','https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica']);
  if(macros.includes("NA")){src.push(['SEC EDGAR','https://www.sec.gov/edgar/search/#/q=%22'+enc+'%22']);src.push(['NMLS','https://www.nmlsconsumeraccess.org/']);}
  const srcHTML=src.map(([t,u])=>'<a class="srclink" href="'+u+'" target="_blank" rel="noopener">'+t+' ↗</a>').join("");
  /* legal & official links (terms, privacy) */
  let legal=[];
  if(dom){
    legal.push(['official site','https://'+dom]);
    legal.push(['terms &amp; conditions','https://www.google.com/search?q=site%3A'+encodeURIComponent(dom)+'+terms']);
    legal.push(['privacy policy','https://www.google.com/search?q=site%3A'+encodeURIComponent(dom)+'+privacy']);
    if(kyc!=="N")legal.push(['KYC / onboarding docs','https://www.google.com/search?q=site%3A'+encodeURIComponent(dom)+'+KYC+OR+verification']);
  }
  const legalHTML=legal.length?legal.map(([t,u])=>'<a class="srclink" href="'+u+'" target="_blank" rel="noopener">'+t+' ↗</a>').join(""):'<span class="mi-sub">no public domain on file</span>';
  /* stat tiles incl. users / volume when known */
  let tiles='<div class="pstat"><div class="k">Founded</div><div class="v"><b>'+f+'</b> · '+esc(hq)+'</div></div>'+
    '<div class="pstat"><div class="k">Custody</div><div class="v">'+CUST[cu]+'</div></div>'+
    '<div class="pstat"><div class="k">Regulation</div><div class="v">'+regTypeOf(r)+'</div></div>'+
    '<div class="pstat"><div class="k">Funding</div><div class="v">'+esc(e.m||"—")+'</div></div>';
  if(USERMAP[n])tiles+='<div class="pstat"><div class="k">Reported users</div><div class="v"><b>'+USERMAP[n].v+'M</b> · '+USERMAP[n].metric+" '"+USERMAP[n].yr.slice(-2)+'</div></div>';
  if(VOLMAP[n])tiles+='<div class="pstat"><div class="k">Volume</div><div class="v"><b>'+esc(VOLMAP[n].fig)+'</b> · '+esc(VOLMAP[n].metric)+'</div></div>';
  /* position in the directory */
  const catCount=D.filter(x=>x[1]===c).length;
  const regCount=D.filter(x=>macrosOf(x).includes(macros[0])).length;
  const pos='one of '+catCount+' '+CATNAME[c]+' neobanks tracked · one of '+regCount+' active in '+MACROS[macros[0]];
  /* KYC row with terms link */
  const kycVal=kyc==="N"?"No":KYC[kyc]+(dom?' · <a href="https://www.google.com/search?q=site%3A'+encodeURIComponent(dom)+'+terms" target="_blank" rel="noopener">see terms ↗</a>':"");
  const facts=[["Category",esc(CATLONG[c])],["Audience",esc(NICHE[ni])],["HQ",esc(hq)],["Card",esc(nw==="—"?"No card":nw+" · "+ct)],
    ["Cashback",esc(cb)],["Yield",esc(y)],["Stablecoins",st?"Yes":"No"],["KYC",kycVal],
    ["License detail",esc(lic)],["Founders",esc(e.f||"—")]];
  if(e.ai)facts.splice(1,0,["AI",AITAG[e.ai]||e.ai]);
  if(SV[n]&&SV[n].length)facts.push(["Services",SV[n].map(t=>esc(SVLABEL[t]||t)).join(" · ")]);
  if(FX[n])facts.push(["FX markup",esc(FX[n].r)+(FX[n].d?' <span class="mi-sub">('+esc(FX[n].d)+')</span>':"")+(FX[n].u?' · <a class="srclink" href="'+FX[n].u+'" target="_blank" rel="noopener">source ↗</a>':"")]);
  /* peers: same audience niche, else same category+region */
  let peers=(ni!=="g")?D.filter(x=>x[12]===ni&&x[0]!==n):D.filter(x=>x[1]===c&&x[2]===reg&&x[0]!==n);
  peers=peers.slice(0,6);
  const peersHTML=peers.length?peers.map(p=>'<span class="mi-item" data-peer="'+esc(p[0])+'"><b>'+esc(p[0])+'</b> · '+esc(p[2])+'</span>').join(""):'<span class="mi-sub">—</span>';
  const peersLabel=(ni!=="g")?'peers · '+NICHE[ni]:'peers · '+CATNAME[c]+' in '+reg;
  document.getElementById('dwrap').innerHTML=
  '<div class="pmodal" style="--pc:'+pc+'">'+
    '<div class="phero">'+
      '<button class="pclose" id="dclose">close ✕</button>'+
      '<div class="pherotop">'+
        '<div class="plogo">'+((dom||LOGOMAP[n])?'<img loading="lazy" alt="'+esc(n)+' logo" src="'+logoSrc(dom,n)+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="logo-fb">'+esc(n.charAt(0).toUpperCase())+'</div>':'<div class="logo-fb" style="display:flex">'+esc(n.charAt(0).toUpperCase())+'</div>')+'</div>'+
        '<div><div class="pname">'+esc(n)+'</div>'+
        (dom?'<div class="pdomain">'+esc(dom)+' · est. '+f+'</div>':'<div class="pdomain">est. '+f+'</div>')+
        '<div class="pchips"><span class="chip '+c+'">'+CATNAME[c]+'</span>'+
        (ni!=="g"?'<span class="nichetag">'+NICHE[ni]+'</span>':"")+
        (st?'<span class="badge-s">stablecoins</span>':"")+
        (e.ai?'<span class="badge-ai">ai · '+e.ai+'</span>':"")+badge+'</div></div>'+
      '</div>'+
      (e.s?'<p class="pquote">'+esc(e.s)+'</p>':'<p class="pquote">'+esc(note)+'</p>')+
      (e.s?'<p class="pnote2">'+esc(note)+'</p>':"")+
      '<div class="pposition">'+pos+'</div>'+
    '</div>'+
    '<div class="pstats">'+tiles+'</div>'+
    '<div class="pbody">'+
      '<dl class="pfacts">'+facts.map(([k,v])=>'<div class="row"><dt>'+k+'</dt><dd>'+v+'</dd></div>').join("")+'</dl>'+
      '<div class="pside">'+
        '<div class="psidehead">legal &amp; official</div><div class="srcrow">'+legalHTML+'</div>'+
        '<div class="psidehead">verify &amp; registers</div><div class="srcrow">'+srcHTML+'</div>'+
        '<div class="psidehead">active regions</div><div class="pregs">'+regChips+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="pmore"><div class="psidehead">'+peersLabel+'</div><div class="peers">'+peersHTML+'</div></div>'+
    '<div class="pactions">'+
      (dom?'<a class="pvisit" href="https://'+esc(dom)+'" target="_blank" rel="noopener">visit '+esc(dom)+' ↗</a>':"")+
      '<button class="pghost'+(cmp.has(n)?" on":"")+'" id="dcmp">'+(cmp.has(n)?"✓ comparing":"+ add to compare")+'</button>'+
    '</div>'+
  '</div>';
  document.getElementById('detail').classList.add('show');
  document.getElementById('dclose').addEventListener('click',closeDetail);
  document.getElementById('dclose').focus();
  document.getElementById('dcmp').addEventListener('click',()=>{toggleCmp(n);closeDetail();});
  document.querySelectorAll('#dwrap [data-peer]').forEach(p=>p.addEventListener('click',()=>openDetail(p.dataset.peer)));
}
render();


/* ═══ v7 LAYER · custom dropdowns + founder chips ═══ */

/* ── custom dropdowns replacing native selects ──
   The native <select> is display:none, so it is not a fallback: whatever this
   builds is the only way to reach the filters. It was mouse-only — a real
   <button> to open, but options were <div>s with click handlers and no tabindex,
   so a keyboard user could open a menu and then not choose from it.

   Focus stays on the button and aria-activedescendant names the active option,
   which is the ARIA listbox pattern that avoids moving focus into the popup. */
const DDS=[];
let DD_SEQ=0;
(function buildDropdowns(){
  document.querySelectorAll('.filterrow select').forEach(sel=>{
    const uid='dd'+(++DD_SEQ);
    const dd=document.createElement('div');dd.className='dd';
    dd.innerHTML='<button type="button" class="dd-btn" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="'+uid+'"><span class="lbl"></span></button><div class="dd-menu" role="listbox" id="'+uid+'"></div>';
    sel.parentNode.insertBefore(dd,sel.nextSibling);
    const btn=dd.querySelector('.dd-btn'),lbl=dd.querySelector('.lbl'),menu=dd.querySelector('.dd-menu');
    /* the <select> carries the accessible name; move it to the button that
       replaces it, or the control announces as unlabelled */
    const named=sel.getAttribute('aria-label')||(sel.id&&(document.querySelector('label[for="'+sel.id+'"]')||{}).textContent)||'';
    if(named)btn.setAttribute('aria-label',named.trim());
    let active=-1;
    function opts(){return [...menu.querySelectorAll('.dd-opt')]}
    function rebuild(){
      menu.innerHTML=[...sel.options].map((o,i)=>'<div class="dd-opt'+(i===sel.selectedIndex?" sel":"")+'" role="option" id="'+uid+'-o'+i+'" aria-selected="'+(i===sel.selectedIndex)+'" data-i="'+i+'">'+o.textContent+'</div>').join("");
      opts().forEach(op=>op.addEventListener('click',()=>pick(+op.dataset.i)));
    }
    function pick(i){
      sel.selectedIndex=i;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
      close();sync();btn.focus();
    }
    function sync(){
      lbl.textContent=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].textContent:"";
      opts().forEach((op,i)=>{
        const on=i===sel.selectedIndex;
        op.classList.toggle('sel',on);op.setAttribute('aria-selected',String(on));
      });
    }
    function setActive(i){
      const list=opts();if(!list.length)return;
      active=Math.max(0,Math.min(list.length-1,i));
      list.forEach((op,j)=>op.classList.toggle('active',j===active));
      btn.setAttribute('aria-activedescendant',list[active].id);
      list[active].scrollIntoView({block:'nearest'});
    }
    function close(){
      dd.classList.remove('open');btn.setAttribute('aria-expanded','false');
      btn.removeAttribute('aria-activedescendant');
      opts().forEach(op=>op.classList.remove('active'));active=-1;
    }
    function open(){
      DDS.forEach(o=>o.close());
      dd.classList.add('open');btn.setAttribute('aria-expanded','true');
      const r=btn.getBoundingClientRect();
      dd.classList.toggle('right',r.left>window.innerWidth*0.55);
      setActive(sel.selectedIndex);
    }
    btn.addEventListener('click',e=>{e.stopPropagation();dd.classList.contains('open')?close():open()});
    btn.addEventListener('keydown',e=>{
      const isOpen=dd.classList.contains('open');
      switch(e.key){
        case 'ArrowDown': e.preventDefault(); isOpen?setActive(active+1):open(); break;
        case 'ArrowUp':   e.preventDefault(); isOpen?setActive(active-1):open(); break;
        case 'Home':      if(isOpen){e.preventDefault();setActive(0)} break;
        case 'End':       if(isOpen){e.preventDefault();setActive(opts().length-1)} break;
        case 'Enter':
        case ' ':         e.preventDefault(); isOpen&&active>=0?pick(active):open(); break;
        case 'Escape':    if(isOpen){e.preventDefault();close()} break;
        case 'Tab':       close(); break;
        default:
          /* type a letter to jump, the one habit carried over from <select> */
          if(e.key.length===1&&/\S/.test(e.key)){
            if(!isOpen)open();
            const list=opts(),k=e.key.toLowerCase();
            const from=active+1;
            const hit=list.slice(from).findIndex(o=>o.textContent.trim().toLowerCase().startsWith(k));
            const idx=hit>=0?from+hit:list.findIndex(o=>o.textContent.trim().toLowerCase().startsWith(k));
            if(idx>=0)setActive(idx);
          }
      }
    });
    rebuild();sync();
    DDS.push({sel,sync,close,rebuild});
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.dd'))DDS.forEach(o=>o.close())});
  document.addEventListener('keydown',e=>{if(e.key==="Escape")DDS.forEach(o=>o.close())});
})();
/* keep dropdown labels in sync with any programmatic reset */
const _render_v7=render;
render=function(){_render_v7();DDS.forEach(o=>o.sync())};

/* ── founder chips: avatars + LinkedIn links + press search ── */
function founderChips(fstr,company,pc){
  const parts=fstr.split(/,\s*(?![^()]*\))/); /* split on commas outside parens */
  const plainRe=/team|consortium|jv|group|venture|heritage|backed|ecosystem|corp|bank|x15|labs|\+ ?\d|^ex-|opera|kraken|kakao|tencent|ant |walmart|pldt|adq|fukuoka|be group|yt l|ytl|commbank|transsion|swissquote|multiversx|ava labs|1inch|polybase|block |j&f|krealo|mercadolibre|\bfg\b/i;
  return parts.map(p=>{
    const disp=p.trim();if(!disp)return"";
    const clean=disp.replace(/\([^)]*\)/g,"").replace(/\+.*$/,"").trim();
    const words=clean.split(/\s+/);
    const linkable=!plainRe.test(disp)&&words.length>=2&&words.length<=4&&/^[A-ZÀ-Þ]/.test(clean);
    const initials=words.slice(0,2).map(x=>x.charAt(0).toUpperCase()).join("");
    if(!linkable)return '<span class="fdr plain"><span class="av">'+esc(initials||"·")+'</span>'+esc(disp)+'</span>';
    const q=encodeURIComponent(clean+' '+company);
    return '<a class="fdr" target="_blank" rel="noopener" title="find '+esc(clean)+' on LinkedIn" href="https://www.linkedin.com/search/results/people/?keywords='+q+'">'+
      '<span class="av">'+esc(initials)+'</span>'+esc(disp)+'</a>';
  }).join("");
}
const _openDetail_v7=openDetail;
openDetail=function(name){
  _openDetail_v7(name);
  const r=D.find(x=>x[0]===name);if(!r)return;
  const e=X[name]||{};
  /* replace the plain founders row with linked chips */
  if(e.f){
    const row=[...document.querySelectorAll('#dwrap .pfacts .row')].find(x=>x.querySelector('dt')&&x.querySelector('dt').textContent==='Founders');
    if(row)row.querySelector('dd').innerHTML='<div class="founders">'+founderChips(e.f,name,PCOL[r[1]])+'</div>';
  }
  /* early investors row (public, top rounds) */
  if(typeof INV!=="undefined"&&INV[name]){
    const dl=document.querySelector('#dwrap .pfacts');
    if(dl)dl.insertAdjacentHTML('beforeend','<div class="row"><dt>Early investors</dt><dd><div class="invs">'+
      INV[name].map(([nm,d])=>{var s=nm.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'investor';
      return '<a class="inv" title="'+esc(nm)+' — portfolio & fund profile" href="/investors/'+s+'/"><img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain='+esc(d)+'&sz=32" onerror="this.remove()">'+esc(nm)+'</a>'}).join("")+'</div></dd></div>');
  }
  /* press & interviews link into verify row */
  const rows=document.querySelectorAll('#dwrap .srcrow');
  if(rows.length>1){
    rows[1].insertAdjacentHTML('beforeend','<a class="srclink" target="_blank" rel="noopener" href="https://news.google.com/search?q='+encodeURIComponent('"'+name+'" founder interview')+'">press &amp; interviews ↗</a>');
  }
};
render();


/* ═══ v8 LAYER · researched volumes (July 2026), new charts ═══ */

/* ── data refresh from filings & research ── */
(function refreshData(){
  const upd={"Nubank":[131,"customers","2025"],"Mercado Pago":[78,"MAU","2025"],"Cash App":[59,"transacting actives","2025"],"Wise":[19,"customers","FY26"]};
  USERS.forEach(u=>{if(upd[u[0]]){u[1]=upd[u[0]][0];u[2]=upd[u[0]][1];u[3]=upd[u[0]][2]}});
  USERS.sort((a,b)=>b[1]-a[1]);
  Object.entries(upd).forEach(([n,[v,m,y]])=>{if(USERMAP[n]){USERMAP[n].v=v;USERMAP[n].metric=m;USERMAP[n].yr=y}});
  /* RedotPay: replace media share claim with the hard CoinDesk/StraitsX figure */
  const rp=D.find(r=>r[0]==="RedotPay");
  if(rp)rp[14]="Processed $2.95B card volume in 2025 — over 4x its next 13 competitors combined.";
  if(X["RedotPay"])X["RedotPay"].s="Hong Kong crypto-card leader: $2.95B card volume in 2025, more than 4x its next 13 competitors combined (CoinDesk/StraitsX).";
  document.querySelectorAll('#newssec .newsrow').forEach(row=>{
    if(row.textContent.includes('RedotPay')){
      row.querySelector('.n-head').textContent='RedotPay processed $2.95B in 2025 card volume';
      row.querySelector('.n-sub').textContent='CoinDesk/StraitsX data: over 4x its next 13 competitors combined; Visa carries >90% of on-chain card volume.';
    }
  });
})();

/* ── researched volume table (with real source links) ── */
const VOL2=[
["Cash App","$316B","inflows · FY2025","Block 10-K","https://www.stocktitan.net/sec-filings/XYZ/10-k-block-inc-files-annual-report-97739237536a.html",316],
["Mercado Pago","$278B","TPV · FY2025 · +41%","MELI results","https://www.businesswire.com/news/home/20260224265595/en/Mercado-Libre-Caps-Stellar-2025-Performance-with-45-YoY-Revenue-Growth-in-Q4-as-Strategic-Investments-Accelerate-Market-Share-Gains",278],
["Wise","$243.5B","cross-border volume · FY2026 · +31%","FY26 results","https://owners.wise.com/",243.5],
["OPay","~$100B+","TPV · 2024","company PRs","https://news.google.com/search?q=OPay%20TPV",100],
["PagBank","~R$500B (~$93B)","TPV · 2024","PAGS filings","https://www.sec.gov/edgar/search/#/q=%22PagBank%22",93],
["Kaspi","KZT 44.2T (~$85B)","payments TPV · FY2025 · +19%","Kaspi 4Q/FY25","https://ir.kaspi.kz/media/4Q__FY_2025_Financial_Results_.pdf",85],
["Wise (card)","$43.6B","card spend · FY2026 · +37%","FY26 results","https://owners.wise.com/",43.6],
["Nubank","$41.9B","deposits · Q4 2025","Nu FY25 results","https://international.nubank.com.br/company/nu-holdings-ltd-reports-fourth-quarter-and-full-year-2025-financial-results/",41.9],
["Crypto-card market","~$18B","annualized card spend · late 2025 · 106% CAGR","Artemis","https://research.artemisanalytics.com/p/stablecoin-payments-at-scale-how",18],
["Visa stablecoin-linked cards","~$5.2B","volume · 2025 · +319%","Visa","https://www.visa.com/en-us/thought-leadership/innovation/stablecoin-linked-cards-monetize-money-movement",5.2],
["RedotPay","$2.95B","card volume · 2025 · >4x next 13 combined","CoinDesk/StraitsX","https://www.coindesk.com/business/2026/03/29/stablecoin-payments-go-invisible-in-southeast-asia-as-crypto-card-business-surges",2.95],
["Payy","~$220M","cumulative volume · 2025","company PR","https://news.google.com/search?q=Payy%20stablecoin%20volume",0.22],
["EtherFi Cash","$55.4M","annual card spend · 2025 · top Dune cohort","ChainUp/Dune","https://www.chainup.com/blog/stablecoin-real-world-payments-visa-crypto-card-boom-2026/",0.055]];
/* patch profile volume tiles */
VOL2.forEach(([n,fig,metric,src,url])=>{VOLMAP[n]={fig,metric,src}});

(function rebuildDataCards(){
  const cards=document.querySelectorAll('#datasec .dcard2');
  const catColor={T:"var(--t)",H:"var(--h)",W:"var(--w)"};
  const catOf=n=>{const r=D.find(x=>x[0]===n);return r?r[1]:"T"};
  /* 1 · rebuild reported-users bars with refreshed figures */
  const max=Math.sqrt(Math.max(...USERS.map(u=>u[1])));
  cards[0].innerHTML='<h2>reported users</h2><div class="dsub">latest public figures · filings &amp; PRs, 2024–2026 · mixed metrics · square-root scale · click a name for its profile</div>'+
    USERS.map(([n,v,metric,yr])=>{
      const w=(Math.sqrt(v)/max*100).toFixed(1);
      return '<div class="hbar"><span class="nm" data-n="'+esc(n)+'">'+esc(n)+'</span><span class="tr"><span class="fl" style="width:'+w+'%;background:'+catColor[catOf(n)]+'"></span></span><span class="vl">'+v+'M · '+metric+' · '+yr+'</span></div>';
    }).join("");
  /* 2 · rebuild volume watch with researched, linked figures */
  const volRows=VOL2.map(([n,fig,metric,src,url])=>{
    const inD=D.some(r=>r[0]===n.replace(' (card)',''));
    const nameCell=inD?'<td data-n="'+esc(n.replace(' (card)',''))+'">'+esc(n)+'</td>':'<td style="cursor:default">'+esc(n)+'</td>';
    return '<tr>'+nameCell+'<td>'+esc(fig)+'</td><td>'+esc(metric)+'</td><td><a href="'+url+'" target="_blank" rel="noopener">'+esc(src)+' ↗</a></td></tr>';
  }).join("");
  cards[2].innerHTML='<h2>volume watch · researched july 2026</h2><div class="dsub">payment &amp; money volumes with a citable public source · mixed metrics and periods · every figure links to its source</div><div style="overflow-x:auto"><table class="voltable"><tr><th>entity</th><th>figure</th><th>metric · period</th><th>source</th></tr>'+volRows+'</table></div>';
  /* re-wire profile clicks */
  document.querySelectorAll('#datasec [data-n]').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.n)));

  /* 3 · the stablecoin card curve (Artemis/CoinDesk/Dune, approx) */
  const PTS=[["'23 Q1",0.10],["'23 Q3",0.15],["'24 Q1",0.22],["'24 Q3",0.38],["'25 Q1",0.60],["'25 Q3",1.05],["'25 Q4",1.5]];
  const W=640,H=200,PADL=36,PADB=26,PADT=18;
  const maxV=1.6,xw=(W-PADL-16)/(PTS.length-1);
  const xy=PTS.map(([l,v],i)=>[PADL+i*xw,H-PADB-(v/maxV)*(H-PADB-PADT)]);
  const poly=xy.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=poly+' '+(PADL+(PTS.length-1)*xw).toFixed(1)+','+(H-PADB)+' '+PADL+','+(H-PADB);
  const curve='<svg class="curve" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Monthly crypto card volume 2023 to 2025">'+
    '<polygon class="ar" points="'+area+'"/><polyline class="ln" points="'+poly+'"/>'+
    xy.map((p,i)=>'<circle class="pt" cx="'+p[0]+'" cy="'+p[1]+'" r="3.5"/><text x="'+p[0]+'" y="'+(H-8)+'" text-anchor="middle">'+PTS[i][0]+'</text>'+(i%2===0||i===PTS.length-1?'<text class="vlab" x="'+p[0]+'" y="'+(p[1]-9)+'" text-anchor="middle">$'+PTS[i][1]+'B</text>':"")).join("")+
    '</svg>';
  /* 4 · region × category matrix (computed live) */
  const cats=["T","H","W"];
  const rows=ALLM.map(m=>{
    const cells=cats.map(c=>{
      const n=D.filter(r=>r[1]===c&&macrosOf(r).includes(m)).length;
      const maxC=Math.max(1,...ALLM.map(mm=>D.filter(r=>r[1]===c&&macrosOf(r).includes(mm)).length));
      const alpha=(0.08+0.5*(n/maxC)).toFixed(2);
      const col=c==="T"?"137,176,255":c==="H"?"208,117,255":"186,242,74";
      return '<td data-hm="'+m+'|'+c+'" style="background:rgba('+col+','+alpha+')">'+n+'</td>';
    }).join("");
    return '<tr><td>'+MACROS[m]+'</td>'+cells+'</tr>';
  }).join("");
  const heat='<div style="overflow-x:auto"><table class="heat"><tr><th>region</th><th>traditional</th><th>hybrid</th><th>web3-native</th></tr>'+rows+'</table></div>';
  cards[2].insertAdjacentHTML('afterend',
    '<div class="dcard2"><h2>the stablecoin card curve</h2><div class="dsub">monthly crypto-card volume, $B — from ~$100M/mo (early 2023) to ~$1.5B/mo (late 2025), 106% CAGR · approx. from Artemis / CoinDesk / Dune trackers</div><div class="curvewrap">'+curve+'</div></div>'+
    '<div class="dcard2"><h2>who lives where · region × category</h2><div class="dsub">computed live from the directory · click any cell to filter to that region + category</div>'+heat+'</div>');
  /* heat cells filter the directory */
  document.querySelectorAll('.heat td[data-hm]').forEach(td=>td.addEventListener('click',()=>{
    const [m,c]=td.dataset.hm.split('|');
    if(mapFilter!==m)setMap(m);
    cat=c;
    document.querySelectorAll('.pill[data-cat]').forEach(x=>x.classList.toggle('on',x.dataset.cat===c));
    render();
    document.getElementById('count').scrollIntoView({behavior:'smooth',block:'center'});
  }));
})();

/* ── hero stat count-up (browsers only; static in non-visual environments) ── */
(function countUp(){
  if(!('IntersectionObserver' in window))return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.statrow .n').forEach(el=>{
    const target=parseInt(el.textContent,10);if(!target)return;
    let started=false;
    const io=new IntersectionObserver(es=>{es.forEach(e=>{
      if(!e.isIntersecting||started)return;started=true;io.disconnect();
      const t0=performance.now(),dur=900;
      (function tick(t){
        const p=Math.min(1,(t-t0)/dur);
        el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
        if(p<1)requestAnimationFrame(tick);
      })(t0);
    })});
    io.observe(el);
  });
})();
render();


/* ═══ v9 LAYER · verified links, X handles, country drill-down, intake ═══
   V[name] = { t: terms URL, p: privacy URL, x: X handle, in: {founderName: linkedinURL}, fx: {founderName: xHandle}, cc: [countries] }
   Only report-verified entries included; everything else keeps honest fallbacks. */
const V={
/* ══ intake 2026-08 ══ */
"Dolafy":{t:"https://dolafy.com/legal/",x:"dolafycom"},
"GetPlu":{t:"https://getplu.com/terms-of-service",x:"getpluapp",cc:["Nigeria","Ghana","Kenya","United States","Canada"]},
"Yolat":{x:"callyolat",in:{"Toyosi Abolarin":"https://www.linkedin.com/in/toyosi-abolarin-798b6942"},cc:["Canada","Nigeria","Kenya","Ghana","South Africa","United Kingdom"]},
"Brookwell":{t:"https://www.brookwell.com/terms",x:"brookwellapp"},
"Takenos":{t:"https://help.takenos.com/en/articles/11403392-terminos-y-condiciones",x:"takenosapp",cc:["Argentina","Bolivia","Chile","Colombia","Ecuador","Paraguay","Peru","United States"]},
"Slush":{p:"https://slush.app/privacy-policy",x:"SlushWallet"},
"Solid":{t:"https://support.solid.xyz/en/articles/13184959-legal-privacy-policy-terms-conditions",x:"SolidYield"},
"Sony Bank":{cc:["Japan"]},
"AMP Bank GO":{cc:["Australia"]},
"Always.bank":{cc:["United States"]},
"Haventree Bank":{cc:["Canada"]},
"Esh Bank":{cc:["Israel"]},
"Blink":{cc:["Jordan"]},
"Reah":{x:"ReahPlatform"},
/* US */
"Chime":{t:"https://www.chime.com/policies/",p:"https://www.chime.com/policies/privacy-policy/",x:"Chime",in:{"Chris Britt":"https://www.linkedin.com/in/chris-britt-a726036/"},cc:["United States"]},
"Varo":{t:"https://www.varomoney.com/privacy-legal/",p:"https://www.varomoney.com/privacy/",x:"varomoney",in:{"Colin Walsh":"https://www.linkedin.com/in/colinwalsh1/"},cc:["United States"]},
"Current":{x:"current",cc:["United States"]},
"SoFi":{t:"https://www.sofi.com/legal/",p:"https://www.sofi.com/legal/privacy/",x:"SoFi",cc:["United States"]},
"Ally Bank":{t:"https://www.ally.com/legal/",p:"https://www.ally.com/privacy/",x:"ally",cc:["United States"]},
"Dave":{t:"https://dave.com/terms",p:"https://dave.com/privacy",x:"davebanking",in:{"Jason Wilk":"https://www.linkedin.com/in/jasonwilk/"},cc:["United States"]},
"MoneyLion":{t:"https://www.moneylion.com/terms-and-conditions/",p:"https://www.moneylion.com/privacy-notice/",x:"MoneyLion",cc:["United States"]},
"One":{t:"https://www.onepay.com/legal",p:"https://www.onepay.com/legal/privacy-policies",x:"one",cc:["United States"]},
"Marcus":{p:"https://www.marcus.com/us/en/privacy-policy",x:"MarcusGS",cc:["United States"]},
"Step":{t:"https://step.com/legal",p:"https://step.com/policies/privacy",x:"step",in:{"CJ MacDonald":"https://www.linkedin.com/in/cjmacdonald1/"},cc:["United States"]},
"Greenlight":{t:"https://greenlight.com/terms",p:"https://privacy.greenlight.com/policies",x:"Greenlightcard",cc:["United States"]},
"Copper":{t:"https://www.getcopper.com/terms",x:"getcopperapp",cc:["United States"]},
"GoHenry":{t:"https://www.gohenry.com/us/terms-and-conditions",p:"https://www.gohenry.com/us/privacy-policy",x:"gohenry",cc:["United States","United Kingdom"]},
"Albert":{t:"https://albert.com/terms",x:"albertsavings",cc:["United States"]},
"Mercury":{t:"https://mercury.com/legal/terms",p:"https://mercury.com/legal/privacy",x:"mercury",in:{"Immad Akhund":"https://www.linkedin.com/in/immad/"},fx:{"Immad Akhund":"immad"},cc:["United States"]},
"Brex":{t:"https://www.brex.com/legal",p:"https://www.brex.com/legal/privacy",x:"brexHQ",in:{"Henrique Dubugras":"https://www.linkedin.com/in/henrique-dubugras-51a92b64/","Pedro Franceschi":"https://www.linkedin.com/in/pedrofranceschi/"},fx:{"Pedro Franceschi":"pedroh96"},cc:["United States"]},
"Ramp":{t:"https://ramp.com/legal",p:"https://ramp.com/legal/privacy-policy",x:"tryramp",in:{"Eric Glyman":"https://www.linkedin.com/in/eglyman/"},fx:{"Eric Glyman":"eglyman"},cc:["United States"]},
"Novo":{t:"https://www.novo.co/legal",p:"https://www.novo.co/legal/privacy",x:"banknovo",cc:["United States"]},
"Bluevine":{p:"https://www.bluevine.com/privacy-policy",x:"Bluevine",cc:["United States"]},
"Relay":{t:"https://relayfi.com/terms/",p:"https://relayfi.com/privacy/",x:"relayfinancial",cc:["United States","Canada"]},
"Rho":{t:"https://www.rho.co/policies/terms-of-service",p:"https://www.rho.co/policies/privacy-policy",x:"rhobusiness",cc:["United States"]},
"Found":{t:"https://found.com/legal",p:"https://found.com/legal/privacy",x:"foundforbiz",cc:["United States"]},
"Lili":{t:"https://lili.co/legal-documents/lili-terms-of-use",p:"https://lili.co/legal-documents/lili-privacy-policy",x:"LiliBanking",cc:["United States"]},
"Branch":{t:"https://www.branchapp.com/terms",p:"https://www.branchapp.com/privacy",x:"branchapp",cc:["United States"]},
"Purple":{x:"joinpurple",cc:["United States"]},
"Greenwood":{p:"https://gogreenwood.com/privacy-policy/",x:"Greenwood",in:{"Ryan Glover":"https://www.linkedin.com/in/ryan-glover-b8a4a34/"},cc:["United States"]},
"MoCaFi":{t:"https://www.mocafi.com/terms-of-service",p:"https://www.mocafi.com/privacy-policy",x:"MoCaFi",in:{"Wole Coaxum":"https://www.linkedin.com/in/wole-coaxum-9027433/"},cc:["United States"]},
"Majority":{t:"https://majority.com/en/terms-conditions/",p:"https://majority.com/en/privacy-policy/",x:"majority",in:{"Magnus Larsson":"https://www.linkedin.com/in/magnusdlarsson/"},cc:["United States"]},
"Zolve":{t:"https://zolve.com/policies/global/terms-of-use",p:"https://zolve.com/privacy-policy",x:"zolvehq",in:{"Raghunandan G":"https://www.linkedin.com/in/raghunandang/"},cc:["United States","India"]},
"Comun":{t:"https://www.comun.app/en/legal",p:"https://www.comun.app/en/legal/comun-privacy-policy",x:"comunapp",cc:["United States"]},
"Ellevest":{t:"https://www.ellevest.com/terms-of-service",x:"Ellevest",in:{"Sallie Krawcheck":"https://www.linkedin.com/in/salliekrawcheck/"},fx:{"Sallie Krawcheck":"SallieKrawcheck"},cc:["United States"]},
"Robinhood":{t:"https://robinhood.com/us/en/about/legal/",p:"https://robinhood.com/us/en/support/articles/privacy-policy/",x:"RobinhoodApp",in:{"Vlad Tenev":"https://www.linkedin.com/in/vladtenev/"},fx:{"Vlad Tenev":"vladtenev"},cc:["United States","United Kingdom"]},
/* Canada */
"KOHO":{t:"https://www.koho.ca/legal/",x:"KOHOfinancial",cc:["Canada"]},
"Neo Financial":{t:"https://www.neofinancial.com/legal",p:"https://www.neofinancial.com/legal/privacy-policy",x:"neofinancial",cc:["Canada"]},
"Wealthsimple":{t:"https://www.wealthsimple.com/en-ca/legal/terms",p:"https://www.wealthsimple.com/en-ca/legal/privacy",x:"Wealthsimple",in:{"Michael Katchen":"https://www.linkedin.com/in/mkatchen/"},cc:["Canada"]},
"EQ Bank":{t:"https://www.eqbank.ca/legal",p:"https://www.eqbank.ca/legal/privacy",x:"EQBank",cc:["Canada"]},
/* UK */
"Monzo":{t:"https://monzo.com/legal/terms-and-conditions/",p:"https://monzo.com/legal/privacy-notice/",x:"monzo",in:{"Tom Blomfield":"https://www.linkedin.com/in/tomblomfield/"},fx:{"Tom Blomfield":"t_blom"},cc:["United Kingdom","United States"]},
"Starling Bank":{t:"https://www.starlingbank.com/legal/",p:"https://www.starlingbank.com/legal/privacy-notice/",x:"StarlingBank",in:{"Anne Boden":"https://www.linkedin.com/in/anneboden/"},cc:["United Kingdom"]},
"Atom Bank":{t:"https://www.atombank.co.uk/terms/",x:"atom_bank",cc:["United Kingdom"]},
"Zopa Bank":{t:"https://www.zopa.com/terms-of-use",p:"https://www.zopa.com/privacy-notice",x:"zopa",cc:["United Kingdom"]},
"Chase UK":{t:"https://www.chase.co.uk/gb/en/legal/",p:"https://www.chase.co.uk/gb/en/legal/privacy-notice/",x:"ChaseUK",cc:["United Kingdom"]},
"Kroo":{t:"https://kroo.com/documents/current-account-terms-and-conditions.html",x:"getkroo",cc:["United Kingdom"]},
"Tide":{t:"https://www.tide.co/terms/",p:"https://www.tide.co/privacy/",x:"TideBusiness",cc:["United Kingdom","India","Germany"]},
"ANNA Money":{t:"https://anna.money/terms-and-conditions/",p:"https://anna.money/privacy-policy",x:"ANNA_money",cc:["United Kingdom","Australia"]},
"Curve":{t:"https://www.curve.com/en-gb/terms/",p:"https://www.curve.com/en-gb/privacy/",x:"imaginecurve",in:{"Shachar Bialick":"https://www.linkedin.com/in/shacharbialick/"},cc:["United Kingdom","European Union"]},
"Monese":{t:"https://monese.com/gb/en/legal",p:"https://www.monese.com/privacy",x:"monese",cc:["United Kingdom","European Union"]},
"Tandem Bank":{p:"https://www.tandem.co.uk/privacy-policy",x:"tandem",cc:["United Kingdom"]},
"Algbra":{t:"https://www.algbra.com/terms-and-conditions/",x:"algbra",cc:["United Kingdom"]},
"Wahed":{t:"https://www.wahed.com/legal",p:"https://www.wahed.com/legal/privacy-policy",x:"WahedInvest",cc:["United States","United Kingdom","Malaysia"]},
/* Europe */
"N26":{x:"n26",in:{"Valentin Stalf":"https://www.linkedin.com/in/valentinstalf/"},cc:["Germany","Austria","France","Spain","Italy","Netherlands","Belgium","Portugal","Ireland","Greece","Poland"]},
"bunq":{t:"https://www.bunq.com/documents/personal-account-terms-conditions",p:"https://www.bunq.com/documents/privacy-policy",x:"bunq",in:{"Ali Niknam":"https://www.linkedin.com/in/aliniknam/"},fx:{"Ali Niknam":"aliniknam"},cc:["Netherlands","Germany","France","Spain","Italy","Belgium","Austria","Ireland","Portugal"]},
"Vivid Money":{t:"https://vivid.money/de-ch/legal-documents/",p:"https://vivid.money/de-ch/privacy-policy/",x:"vivid_money",cc:["Germany","France","Spain","Italy","Netherlands"]},
"Qonto":{p:"https://qonto.com/en/legal-documents/privacy-notice",x:"getqonto",in:{"Alexandre Prot":"https://www.linkedin.com/in/alexandreprot/"},cc:["France","Germany","Spain","Italy"]},
"Sumeria (Lydia)":{x:"sumeria_app",cc:["France"]},
"Nickel":{x:"nickel",cc:["France","Spain","Belgium","Portugal","Germany"]},
"BoursoBank":{x:"BoursoBank",cc:["France"]},
"Lunar":{p:"https://www.lunar.app/en/privacy-policy",x:"lunar",in:{"Ken Villum Klausen":"https://www.linkedin.com/in/kenvillumklausen/"},cc:["Denmark","Sweden","Norway"]},
"Trade Republic":{p:"https://assets.traderepublic.com/assets/files/Privacy-Website_en-DE.pdf",x:"traderepublic",cc:["Germany","France","Spain","Italy","Netherlands","Austria","Belgium","Ireland","Portugal"]},
"Wise":{t:"https://wise.com/terms-and-conditions",p:"https://wise.com/privacy-policy",x:"Wise",in:{"Kristo Käärmann":"https://www.linkedin.com/in/kaarmann/","Taavet Hinrikus":"https://www.linkedin.com/in/taavet/"},fx:{"Kristo Käärmann":"kaarmann","Taavet Hinrikus":"taavet"},cc:["United Kingdom","United States","Australia","Singapore","Japan","Brazil","Canada","New Zealand","European Union","India","Philippines","Malaysia","UAE"]},
"Klarna":{t:"https://www.klarna.com/us/legal/",p:"https://www.klarna.com/us/privacy-policy/",x:"Klarna",in:{"Sebastian Siemiatkowski":"https://www.linkedin.com/in/sebastian-siemiatkowski-768977/"},fx:{"Sebastian Siemiatkowski":"klarnaseb"},cc:["Sweden","United States","United Kingdom","Germany","Australia","European Union"]},
"Papara":{t:"https://www.papara.com/en/legal-notices",p:"https://www.papara.com/en/legal-notices/privacy",x:"papara",cc:["Türkiye"]},
"Monobank":{t:"https://www.monobank.ua/terms",p:"https://www.monobank.ua/privacy",x:"monobank_ua",in:{"Oleh Gorokhovskyi":"https://www.linkedin.com/in/gorokhovsky/"},cc:["Ukraine"]},
"Kaspi":{t:"https://kaspi.kz/terms",x:"kaspikz",cc:["Kazakhstan","Türkiye"]},
"Revolut":{t:"https://www.revolut.com/legal/terms/",p:"https://www.revolut.com/privacy-policy/",x:"RevolutApp",in:{"Nik Storonsky":"https://www.linkedin.com/in/nikolay-storonsky/"},cc:["United Kingdom","Ireland","France","Germany","Spain","Italy","Poland","Romania","Lithuania","Netherlands","Portugal","United States","Australia","Singapore","Japan","Brazil","New Zealand","Switzerland","Mexico","India"]},
"Alpian":{t:"https://www.alpian.com/legal",p:"https://www.alpian.com/privacy-policy",x:"AlpianBank",cc:["Switzerland"]},
"Yuh":{t:"https://www.yuh.com/en/legal/",x:"yuh_app",cc:["Switzerland"]},
"neon":{x:"neon_switzerland",cc:["Switzerland"]},
/* LatAm */
"Nubank":{x:"nubank",in:{"David Vélez":"https://www.linkedin.com/in/david-velez-38185311/","Cristina Junqueira":"https://www.linkedin.com/in/cristina-junqueira-9a4b012/"},cc:["Brazil","Mexico","Colombia"]},
"Ualá":{x:"uala",in:{"Pierpaolo Barbieri":"https://www.linkedin.com/in/pierpaolo-barbieri-b8a3644/"},fx:{"Pierpaolo Barbieri":"pierpaolo"},cc:["Argentina","Mexico","Colombia"]},
"Klar":{x:"klarmx",cc:["Mexico"]},
"Stori":{t:"https://www.storicard.com/legales",p:"https://www.storicard.com/aviso-de-privacidad",x:"storicard",cc:["Mexico"]},
"C6 Bank":{t:"https://www.c6bank.com.br/termos-e-condicoes",p:"https://www.c6bank.com.br/politica-de-privacidade",x:"C6Bank",cc:["Brazil"]},
"Banco Inter":{p:"https://inter.co/politica-de-privacidade/",x:"bancointer",cc:["Brazil","United States"]},
"PicPay":{p:"https://picpay.com/politica-de-privacidade",x:"PicPay",cc:["Brazil"]},
"Mercado Pago":{t:"https://www.mercadopago.com.br/ajuda/termos-e-condicoes_300",p:"https://www.mercadopago.com.br/privacidade",x:"mercadopago",cc:["Argentina","Brazil","Mexico","Chile","Colombia","Peru","Uruguay"]},
"Bitso":{t:"https://bitso.com/legal/terms-of-service",p:"https://bitso.com/legal/privacy-policy",x:"Bitso",in:{"Daniel Vogel":"https://www.linkedin.com/in/danielvogel1/"},cc:["Mexico","Argentina","Brazil","Colombia"]},
"Lemon":{t:"https://www.lemon.me/terms",x:"lemoncash_ar",in:{"Marcelo Cavazzoli":"https://www.linkedin.com/in/marcelo-cavazzoli/"},fx:{"Marcelo Cavazzoli":"cavazzoli_m"},cc:["Argentina","Brazil","Peru"]},
"DolarApp":{t:"https://www.arqfinance.com/en-MX/legal",p:"https://www.arqfinance.com/legal/privacy-policy",x:"DolarApp",cc:["Mexico","Argentina","Colombia","Brazil"]},
"Airtm":{t:"https://www.airtm.com/en/terms-of-service",p:"https://www.airtm.com/en/privacy-policy",x:"airtm",cc:["Mexico","Venezuela","Argentina","Colombia","Peru","Chile","Brazil"]},
"Nomad":{t:"https://www.nomadglobal.com/legal",x:"nomadglobal",cc:["Brazil","United States"]},
/* Asia */
"KakaoBank":{x:"kakaobank",cc:["South Korea"]},
"Toss Bank":{x:"toss_bank",cc:["South Korea"]},
"Maya":{t:"https://www.maya.ph/terms-and-conditions",p:"https://www.maya.ph/privacy",x:"mayaiseverything",cc:["Philippines"]},
"Tonik":{t:"https://tonikbank.com/terms-conditions",x:"TonikBankPH",cc:["Philippines"]},
"GXS Bank":{t:"https://www.gxs.com.sg/terms-of-use",x:"gxsbank",cc:["Singapore"]},
"Aspire":{t:"https://aspireapp.com/tnc/master-service-agreement",p:"https://aspireapp.com/privacy-policy",x:"AspireApp",cc:["Singapore","Hong Kong","Indonesia","Vietnam"]},
"YouTrip":{x:"YouTripApp",cc:["Singapore","Thailand","Malaysia"]},
"ZA Bank":{t:"https://bank.za.group/en/terms",p:"https://bank.za.group/en/privacy",x:"zabankhk",cc:["Hong Kong"]},
"bKash":{t:"https://www.bkash.com/en/terms-and-conditions",p:"https://www.bkash.com/en/privacy-policy",x:"bKashLimited",cc:["Bangladesh"]},
"SadaPay":{t:"https://sadapay.pk/terms-conditions",p:"https://sadapay.pk/privacy-policy/",x:"sadapay",cc:["Pakistan"]},
"NayaPay":{t:"https://www.nayapay.com/terms",p:"https://www.nayapay.com/privacy",x:"NayaPayInc",cc:["Pakistan"]},
"Jupiter":{t:"https://jupiter.money/terms-and-conditions/",p:"https://jupiter.money/privacy-policy/",x:"JupiterMoneyApp",cc:["India"]},
"FamPay":{x:"FamPayHQ",cc:["India"]},
/* ANZ */
"Up":{t:"https://up.com.au/terms/",p:"https://up.com.au/privacy/",x:"upbanking",cc:["Australia"]},
"Hnry":{p:"https://hnry.co.nz/privacy",x:"hnry_nz",cc:["New Zealand","Australia"]},
/* Africa */
"TymeBank":{t:"https://www.tymebank.co.za/legal/",p:"https://www.tymebank.co.za/legal/privacy-policy/",x:"TymeBankZA",cc:["South Africa"]},
"Kuda":{t:"https://kuda.com/en-ng/legal/",p:"https://kuda.com/en-ng/legal/privacy-policy/",x:"joinkuda",in:{"Babs Ogundeyi":"https://www.linkedin.com/in/babs-ogundeyi-4b3b1b1/"},cc:["Nigeria","United Kingdom"]},
"OPay":{t:"https://www.opayweb.com/terms",p:"https://www.opayweb.com/privacy",x:"OPay_NG",cc:["Nigeria","Egypt"]},
"PalmPay":{t:"https://www.palmpay.com/terms",p:"https://www.palmpay.com/privacy",x:"PalmPay_ng",cc:["Nigeria","Ghana","Tanzania","Kenya"]},
"Moniepoint":{p:"https://moniepoint.com/privacy-policy",x:"moniepoint",in:{"Tosin Eniolorunda":"https://www.linkedin.com/in/tosineniolorunda/"},cc:["Nigeria","Kenya"]},
"Wave":{p:"https://www.wave.com/en/privacy/index.html",x:"wave_senegal",cc:["Senegal","Côte d'Ivoire","Mali","Burkina Faso","Uganda","Gambia"]},
"Djamo":{t:"https://www.djamo.io/terms",p:"https://www.djamo.io/privacy",x:"djamoapp",cc:["Côte d'Ivoire","Senegal"]},
"Flouci":{t:"https://fr.flouci.com/legal/conditions-dutilisation-du-service-flouci",p:"https://fr.flouci.com/legal/politique-de-confidendialite-du-client",cc:["Tunisia"]},
"Yellow Card":{t:"https://yellowcard.io/legal",p:"https://yellowcard.io/legal/privacy-policy",x:"yellowcard_app",in:{"Chris Maurice":"https://www.linkedin.com/in/chrismaurice1/"},fx:{"Chris Maurice":"chrismauriceyc"},cc:["Nigeria","Kenya","South Africa","Ghana","Uganda","Tanzania","Botswana","Cameroon","Senegal","Côte d'Ivoire","Zambia","Rwanda","Malawi","Gabon","DR Congo","Benin","Togo","Burkina Faso","Mali","Madagascar"]},
"Chipper Cash":{x:"chippercashapp",in:{"Ham Serunjogi":"https://www.linkedin.com/in/hamserunjogi/"},cc:["Nigeria","Ghana","Uganda","Kenya","Rwanda","South Africa","United States","United Kingdom"]},
"Grey":{t:"https://grey.co/legal/terms-of-service",p:"https://grey.co/legal/privacy-policy",x:"grey_finance",cc:["Nigeria","Kenya"]},
"PaySika":{t:"https://paysika.co/cm/en/general-conditions-of-use/",x:"Paysika_Afrique",fx:{"Roger Nengwe Ntafam":"rogernengwe"},cc:["Cameroon","Côte d'Ivoire"]},
"MiniPay":{t:"https://minipay.to/terms-of-service",p:"https://minipay.to/privacy-statement",x:"MiniPay",cc:["Nigeria","Kenya","Ghana","South Africa","Uganda","Brazil","Philippines"]},
/* MENA */
"Telda":{t:"https://telda.app/legal/",p:"https://telda.app/legal/privacy/",x:"telda",cc:["Egypt"]},
"Wio Bank":{t:"https://www.wio.io/terms",p:"https://www.wio.io/privacy-policy",x:"wiobank",cc:["UAE"]},
"One Zero":{t:"https://www.onezerobank.com/terms/",p:"https://www.onezerobank.com/privacy/",x:"OneZeroBank",cc:["Israel"]},
/* Hybrid */
"Cash App":{t:"https://cash.app/legal/us/en-us/tos",p:"https://cash.app/legal/us/en-us/privacy",x:"CashApp",cc:["United States"]},
"Venmo":{t:"https://venmo.com/legal/us-user-agreement/",p:"https://venmo.com/legal/us-privacy-policy/",x:"Venmo",cc:["United States"]},
"Crypto.com":{t:"https://crypto.com/document/terms",p:"https://crypto.com/document/privacy",x:"cryptocom",in:{"Kris Marszalek":"https://www.linkedin.com/in/krismarszalek/"},fx:{"Kris Marszalek":"kris"},cc:["Singapore","United States","United Kingdom","European Union","Australia","Brazil","Canada","UAE","South Korea"]},
"Coinbase Card":{t:"https://www.coinbase.com/legal/user_agreement",p:"https://www.coinbase.com/legal/privacy",x:"coinbase",in:{"Brian Armstrong":"https://www.linkedin.com/in/barmstrong/"},fx:{"Brian Armstrong":"brian_armstrong"},cc:["United States","United Kingdom","European Union","Canada","Australia","Singapore","Brazil"]},
"Gemini Credit Card":{t:"https://www.gemini.com/legal/user-agreement",p:"https://www.gemini.com/legal/privacy-policy",x:"Gemini",fx:{"Cameron Winklevoss":"cameron","Tyler Winklevoss":"tyler"},cc:["United States"]},
"Strike":{t:"https://strike.me/legal/tos/",p:"https://strike.me/legal/privacy/",x:"Strike",in:{"Jack Mallers":"https://www.linkedin.com/in/jackmallers/"},fx:{"Jack Mallers":"jackmallers"},cc:["United States","El Salvador","Argentina","Mexico","Philippines","Vietnam","Nigeria","Kenya","Ghana"]},
"Xapo Bank":{t:"https://www.xapobank.com/en/terms",x:"xapobank",in:{"Wences Casares":"https://www.linkedin.com/in/wenceslao-casares-b2404/"},fx:{"Wences Casares":"wences"},cc:["Gibraltar","United Kingdom","UAE","Global"]},
"Wirex":{t:"https://help.wirexapp.com/category/terms-and-policies-0427",x:"wirexapp",cc:["United Kingdom","European Union","Singapore","Australia","United States"]},
"Nexo":{t:"https://nexo.com/terms",p:"https://nexo.com/privacy-policy",x:"Nexo",fx:{"Antoni Trenchev":"AntoniNexo"},cc:["United Kingdom","European Union","Switzerland","Brazil","Mexico"]},
"Krak":{t:"https://www.kraken.com/legal",p:"https://www.kraken.com/legal/privacy",x:"krakenfx",cc:["European Union","United Kingdom"]},
"KAST":{t:"https://www.kast.xyz/legal",p:"https://www.kast.xyz/legal/privacy-policy",x:"Kast_money",cc:["Hong Kong","Singapore","Global"]},
"Lava":{t:"https://lava.xyz/termsofservice",p:"https://lava.xyz/privacypolicy",x:"lava_xyz",fx:{"Shehzan Maredia":"MarediaShehzan"},cc:["United States"]},
"COCA":{t:"https://www.coca.xyz/terms",p:"https://www.coca.xyz/privacy",x:"coca_card",cc:["United Kingdom","European Union","UAE","Global"]},
"BFinance":{t:"https://bfinance.app/terms",p:"https://bfinance.app/privacy",cc:["Czech Republic","European Union","Global"]},
"RedotPay":{t:"https://www.redotpay.com/en/terms/",p:"https://www.redotpay.com/en/privacy/",x:"RedotPay",cc:["Hong Kong","Singapore","Brazil","Argentina","Nigeria","Global"]},
"Uphold":{t:"https://uphold.com/legal",p:"https://uphold.com/legal/privacy-policy",x:"UpholdInc",cc:["United States","United Kingdom","European Union","Brazil","Mexico","Argentina"]},
"Deel":{t:"https://www.deel.com/legal/terms-of-service/",p:"https://www.deel.com/legal/privacy-policy/",x:"deel",in:{"Alex Bouaziz":"https://www.linkedin.com/in/alexbouaziz/"},fx:{"Alex Bouaziz":"Bouazizalex"},cc:["United States","United Kingdom","European Union","Brazil","India","Philippines","Nigeria","Australia","Canada","UAE","Singapore","Global"]},
"Bitpanda":{t:"https://www.bitpanda.com/en/legal",x:"bitpanda",cc:["Austria","Germany","France","Spain","Italy","United Kingdom"]},
"Fold":{t:"https://foldapp.com/legal/legal-overview",p:"https://foldapp.com/legal/privacy-policy",x:"fold_app",fx:{"Will Reeves":"wlvs"},cc:["United States"]},
"Flex":{t:"https://www.flex.one/terms-of-service",p:"https://www.flex.one/privacy",x:"FlexSuperApp",fx:{"Zaid Rahman":"zaidrmn"},cc:["United States"]},
/* Web3-native */
"Karta":{t:"https://legal.karta.io/b2c-card-terms",p:"https://legal.karta.io/b2c-privacy-policy",x:"Karta_Personal",cc:["Global"]},
"Hyperbeat":{t:"https://hyperbeat.org/terms",p:"https://hyperbeat.org/privacy",x:"hyperbeat",cc:["Global"]},
"Startale":{t:"https://startale.com/en/terms",x:"StartaleHQ",fx:{"Sota Watanabe":"WatanabeSota"},cc:["Global"]},
"Moto":{x:"usemotocard",cc:["United States"]},
"Bitget Wallet":{t:"https://web3.bitget.com/en/terms-of-use",p:"https://web3.bitget.com/en/privacy-policy",x:"BitgetWallet",cc:["Global"]},
"SurfCash":{t:"https://getsurf.cash/terms",p:"https://getsurf.cash/privacy",x:"SurfCashX",cc:["Vietnam","Thailand","Philippines","Brazil"]},
"MetaMask":{t:"https://metamask.io/terms-of-use/",p:"https://consensys.io/privacy-notice",x:"MetaMask",in:{"Dan Finlay":"https://www.linkedin.com/in/danfinlay/"},fx:{"Dan Finlay":"danfinlay","Aaron Davis":"kumavis_"},cc:["Global"]},
"Phantom":{t:"https://phantom.app/terms",p:"https://phantom.app/privacy",x:"phantom",in:{"Brandon Millman":"https://www.linkedin.com/in/brandonmillman/"},fx:{"Brandon Millman":"bchillman"},cc:["Global"]},
"Solflare":{t:"https://solflare.com/terms",p:"https://solflare.com/privacy",x:"solflare_wallet",cc:["Global"]},
"Rainbow":{t:"https://rainbow.me/terms-of-use",p:"https://rainbow.me/privacy",x:"rainbowdotme",fx:{"Mike Demarais":"mikedemarais"},cc:["Global"]},
"Xverse":{t:"https://www.xverse.app/terms",p:"https://www.xverse.app/privacy",x:"xverseApp",cc:["Global"]},
"Trust Wallet":{t:"https://trustwallet.com/terms-of-service",p:"https://trustwallet.com/privacy-policy",x:"TrustWallet",cc:["Global"]},
"Exodus":{t:"https://www.exodus.com/terms/",p:"https://www.exodus.com/privacy/",x:"exodus",cc:["Global"]},
"Zengo":{t:"https://zengo.com/terms-of-use/",p:"https://zengo.com/privacy-policy/",x:"zengo",fx:{"Ouriel Ohayon":"OurielOhayon"},cc:["Global"]},
"Payy":{t:"https://payy.network/terms",p:"https://payy.network/privacy",x:"payy_link",fx:{"Sid Gandhi":"sidgandhi_xyz"},cc:["Global"]},
"Gnosis Pay":{x:"gnosispay",in:{"Martin Köppelmann":"https://www.linkedin.com/in/martin-koeppelmann/"},fx:{"Martin Köppelmann":"koeppelmann","Stefan George":"StefanDGeorge"},cc:["United Kingdom","European Union","Brazil"]},
"EtherFi Cash":{t:"https://www.ether.fi/legal/terms-of-use",p:"https://www.ether.fi/legal/privacy-policy",x:"ether_fi",fx:{"Mike Silagadze":"MikeSilagadze"},cc:["Global"]},
"Ready":{p:"https://www.ready.co/legal/privacy/ready",x:"ready_co",in:{"Itamar Lesuisse":"https://www.linkedin.com/in/itamarl/"},fx:{"Itamar Lesuisse":"itamarl"},cc:["United Kingdom","European Union","Global"]},
"Plasma One":{t:"https://www.plasma.org/terms-of-service",p:"https://www.plasma.to/privacy",x:"Plasma",fx:{"Paul Faecks":"paulfaecks"},cc:["Global"]},
"Oobit":{t:"https://www.oobit.com/legal",p:"https://www.oobit.com/legal/privacy-notice",x:"oobit",cc:["Singapore","European Union","Global"]},
"Morse":{t:"https://morsemoney.com/legal",x:"slingmoney",in:{"Mike Hudack":"https://www.linkedin.com/in/mhudack/"},fx:{"Mike Hudack":"mhudack"},cc:["United States","United Kingdom","European Union","Nigeria","Kenya","Global"]},
"Deblock":{x:"DeblockApp",cc:["France","European Union"]},
"Fiat24":{x:"Fiat24Official",cc:["Switzerland","Global"]},
"Mine":{t:"https://mine.financial/terms",p:"https://mine.financial/privacy",x:"Mine_Wallet",cc:["Switzerland","Global"]},
"Stables":{p:"https://www.stables.money/legal/privacy-policy",x:"stablesmoney",cc:["Australia","Singapore","Philippines","Global"]},
"Daimo":{t:"https://daimo.com/terms-of-use",p:"https://daimo.com/privacy",x:"daimo_eth",fx:{"DC Posch":"dcposch","Nalin Bhardwaj":"nibnalin"},cc:["Global"]},
"Onboard":{t:"https://onboard.xyz/terms",p:"https://www.onboard.xyz/privacy-policy",x:"onboardglobal",fx:{"Yele Bademosi":"YeleBademosi"},cc:["Nigeria","Ghana","Kenya","Global"]},
/* gap-hunt additions */
"Vision Bank":{t:"https://www.visionbank.sa/terms",p:"https://www.visionbank.sa/privacy",x:"VisionBankSA",cc:["Saudi Arabia"]},
"Beyon Money":{x:"beyonmoney",cc:["Bahrain"]},
"Fasset":{t:"https://fasset.com/terms-and-conditions/",x:"fassetofficial",cc:["UAE","Indonesia","Malaysia","Türkiye"]},
"Kontigo":{p:"https://www.kontigo.lat/privacy",x:"kontigoapp",cc:["Venezuela","Colombia","Mexico"]},
"Brighty":{t:"https://brighty.app/en/termsAndPolicies",p:"https://brighty.app/en/privacy-policy",x:"brightyapp",cc:["Switzerland","EEA"]},
"Tangem":{t:"https://tangem.com/docs/en/terms-of-service.pdf",p:"https://tangem.com/docs/en/privacy-policy.pdf",x:"tangem",cc:["Global"]},
"Plata":{t:"https://bancoplata.mx/es/legal",x:"bancoplatamx",cc:["Mexico"]},
"Veera":{t:"https://veera.com/terms",p:"https://veera.com/privacy",x:"On_Veera",cc:["Global"]},
"Moneco":{x:"moneco_app",cc:["France","Belgium","Germany"]}
};

/* macro of each country (for the drill-down) */
const C2M={"United States":"NA","Canada":"NA","United Kingdom":"EU","Ireland":"EU","France":"EU","Germany":"EU","Spain":"EU","Italy":"EU","Netherlands":"EU","Belgium":"EU","Austria":"EU","Portugal":"EU","Poland":"EU","Romania":"EU","Lithuania":"EU","Sweden":"EU","Denmark":"EU","Norway":"EU","Switzerland":"EU","Greece":"EU","Iceland":"EU","Ukraine":"EU","Russia":"EU","Kazakhstan":"EU","Uzbekistan":"EU","Türkiye":"EU","European Union":"EU","Gibraltar":"EU","Brazil":"LATAM","Mexico":"LATAM","Argentina":"LATAM","Colombia":"LATAM","Chile":"LATAM","Peru":"LATAM","Uruguay":"LATAM","Paraguay":"LATAM","Venezuela":"LATAM","Panama":"LATAM","Dominican Republic":"LATAM","El Salvador":"LATAM","Nigeria":"AF","Kenya":"AF","South Africa":"AF","Ghana":"AF","Uganda":"AF","Tanzania":"AF","Senegal":"AF","Côte d'Ivoire":"AF","Mali":"AF","Burkina Faso":"AF","Gambia":"AF","Rwanda":"AF","Botswana":"AF","Cameroon":"AF","Zambia":"AF","Malawi":"AF","Gabon":"AF","DR Congo":"AF","Benin":"AF","Togo":"AF","Madagascar":"AF","Egypt":"MENA","UAE":"MENA","Saudi Arabia":"MENA","Bahrain":"MENA","Kuwait":"MENA","Israel":"MENA","India":"ASIA","Pakistan":"ASIA","Bangladesh":"ASIA","Singapore":"ASIA","Philippines":"ASIA","Indonesia":"ASIA","Malaysia":"ASIA","Thailand":"ASIA","Vietnam":"ASIA","South Korea":"ASIA","Japan":"ASIA","Taiwan":"ASIA","Hong Kong":"ASIA","China":"ASIA","Australia":"OC","New Zealand":"OC"};
function countriesOf(r){
  const v=V[r[0]];
  if(v&&v.cc)return v.cc.filter(c=>c!=="Global");
  return [];
}

/* ── enrich profiles: verified legal links, X handle, LinkedIn, countries ── */
const _openDetail_v9=openDetail;
openDetail=function(name){
  /* remember where focus came from (unless navigating peer→peer inside an open profile) */
  if(!document.getElementById('detail').classList.contains('show'))window.__lastFocus=document.activeElement;
  _openDetail_v9(name);
  document.getElementById('detail').scrollTop=0; /* peer→peer navigation shouldn't inherit scroll position */
  const r=D.find(x=>x[0]===name);if(!r)return;
  const v=V[name]||{};
  const dwrap=document.getElementById('dwrap');
  /* replace search-based legal links with verified direct URLs */
  if(v.t||v.p){
    const legalRow=dwrap.querySelectorAll('.srcrow')[0];
    if(legalRow){
      let html='';
      if(r[13])html+='<a class="srclink" href="https://'+esc(r[13])+'" target="_blank" rel="noopener">official site ↗</a>';
      if(v.t)html+='<a class="srclink" href="'+v.t+'" target="_blank" rel="noopener">terms &amp; conditions ↗</a><span class="verified">verified</span>';
      if(v.p)html+='<a class="srclink" href="'+v.p+'" target="_blank" rel="noopener">privacy policy ↗</a>';
      if(v.x)html+='<a class="srclink" href="https://x.com/'+v.x+'" target="_blank" rel="noopener">@'+esc(v.x)+' on 𝕏 ↗</a>';
      legalRow.innerHTML=html;
    }
    /* KYC row: point 'see terms' at the verified URL */
    const kycRow=[...dwrap.querySelectorAll('.pfacts .row')].find(x=>x.querySelector('dt')&&x.querySelector('dt').textContent==='KYC');
    if(kycRow&&v.t){const a=kycRow.querySelector('a');if(a)a.href=v.t;}
  }else if(v.x){
    const legalRow=dwrap.querySelectorAll('.srcrow')[0];
    if(legalRow)legalRow.insertAdjacentHTML('beforeend','<a class="srclink" href="https://x.com/'+v.x+'" target="_blank" rel="noopener">@'+esc(v.x)+' on 𝕏 ↗</a>');
  }
  /* logo click → official X profile */
  const logo=dwrap.querySelector('.plogo');
  if(logo&&v.x){
    logo.classList.add('haslink');
    logo.title='@'+v.x+' on X';
    logo.addEventListener('click',()=>window.open('https://x.com/'+v.x,'_blank'));
    const pd=dwrap.querySelector('.pdomain');
    if(pd)pd.insertAdjacentHTML('afterend','<div style="margin-top:6px"><a class="xtag" href="https://x.com/'+v.x+'" target="_blank" rel="noopener">𝕏 <b>@'+esc(v.x)+'</b></a></div>');
  }
  /* founder chips: upgrade to direct verified LinkedIn / personal X where confirmed */
  if(v.in||v.fx){
    dwrap.querySelectorAll('.fdr').forEach(chip=>{
      let node=chip;
      Object.entries(v.in||{}).forEach(([person,url])=>{
        if(!node.textContent.includes(person))return;
        if(node.tagName==='A'){node.href=url;node.title=person+' — verified LinkedIn';node.insertAdjacentHTML('beforeend','<span class="verified">✓</span>');}
        else{/* plain chip (e.g. "Tom Blomfield + 4 co-founders") — upgrade to a verified link */
          const a=document.createElement('a');
          a.className='fdr';a.href=url;a.target='_blank';a.rel='noopener';
          a.title=person+' — verified LinkedIn';a.innerHTML=node.innerHTML+'<span class="verified">✓</span>';
          node.replaceWith(a);node=a;
        }
      });
      Object.entries(v.fx||{}).forEach(([person,handle])=>{
        if(node.textContent.includes(person)&&node.parentNode){
          node.insertAdjacentHTML('afterend','<a class="xtag" style="align-self:center" href="https://x.com/'+handle+'" target="_blank" rel="noopener">𝕏 @'+esc(handle)+'</a>');
        }
      });
    });
  }
  /* countries of operation */
  const ccs=countriesOf(r);
  if(ccs.length){
    const regsHead=[...dwrap.querySelectorAll('.psidehead')].find(h=>h.textContent==='active regions');
    if(regsHead){
      regsHead.insertAdjacentHTML('beforebegin','<div class="psidehead">countries ('+ccs.length+')</div><div class="countrylist">'+ccs.map(c=>'<span class="cty">'+esc(c)+'</span>').join("")+'</div>');
    }
  }
};

/* ── card logos: click → X profile (event delegation, doesn't break profile-open) ── */
document.getElementById('grid').addEventListener('click',e=>{
  const box=e.target.closest('.logo-box');
  if(!box)return;
  const card=e.target.closest('.card');if(!card)return;
  const nm=card.querySelector('.cname');if(!nm)return;
  const v=V[nm.textContent];
  if(v&&v.x){e.stopPropagation();window.open('https://x.com/'+v.x,'_blank');}
},true);
/* mark linked logos visually after each render */
const _render_v9=render;
render=function(){
  _render_v9();
  document.querySelectorAll('#grid .card').forEach(card=>{
    const nm=card.querySelector('.cname');const v=nm&&V[nm.textContent];
    const box=card.querySelector('.logo-box');
    if(box&&v&&v.x){box.classList.add('haslink');box.title='@'+v.x+' on X';}
  });
};

/* ── country drill-down inside the map info panel ── */
const _showRegion_v9=window.showRegion;
window.showRegion=function(code){
  _showRegion_v9(code);
  if(!code)return;
  const el=document.getElementById('mapinfo');
  /* countries present in this macro region, with entity counts */
  const counts={};
  D.forEach(r=>{countriesOf(r).forEach(c=>{if(C2M[c]===code)counts[c]=(counts[c]||0)+1})});
  /* fold in single-country HQ presence for entities without cc data */
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12);
  if(!entries.length)return;
  el.insertAdjacentHTML('beforeend','<div class="mi-drill">'+entries.map(([c,n])=>'<span class="mi-cty" data-cty="'+esc(c)+'">'+esc(c)+' <b>'+n+'</b></span>').join("")+'</div>');
  el.querySelectorAll('.mi-cty').forEach(b=>b.addEventListener('click',ev=>{
    ev.stopPropagation();
    const cty=b.dataset.cty;
    document.getElementById('q').value=cty==="United States"?"US":cty;
    q=(cty==="United States"?"us":cty.toLowerCase());
    render();
    document.getElementById('count').scrollIntoView({behavior:'smooth',block:'center'});
  }));
};
if(mapFilter)showRegion(mapFilter);

/* ── intake: GitHub issue forms (must use template=, GitHub's chooser drops body prefills) ── */
(function buildIntake(){
  const REPO='https://github.com/andreolf/neobankbeat';
  document.getElementById('newssec').insertAdjacentHTML('beforebegin',
    '<section class="intake"><div class="intakecard">'+
    '<div class="it-txt"><h2>know a neobank we\'re missing?</h2><p>submissions + corrections happen in the open, on github. pre-filled issue templates — takes a minute.</p></div>'+
    '<a class="itbtn add" target="_blank" rel="noopener" href="'+REPO+'/issues/new?labels=new-neobank&template=new-neobank.yml">+ submit a neobank</a>'+
    '<a class="itbtn fix" target="_blank" rel="noopener" href="'+REPO+'/issues/new?labels=data-fix&template=data-fix.yml">suggest a correction</a>'+
    '</div></section>');
})();

/* ── map relocation: off the hero, into its own anchored section ── */
(function relocateMap(){
  const map=document.getElementById('mapsec');
  const datasec=document.getElementById('datasec');
  if(map&&datasec){datasec.parentNode.insertBefore(map,datasec);
    map.querySelector('.maphead h2').textContent='where they operate · world map';
    const nav=document.querySelector('.hnav');
    nav.insertAdjacentHTML('afterbegin','<a href="#mapsec">map</a>');
  }
})();

/* stats refresh for the new rows */
document.getElementById('st-total').textContent=D.length;
document.getElementById('st-t').textContent=D.filter(r=>r[1]==="T").length;
document.getElementById('st-h').textContent=D.filter(r=>r[1]==="H").length;
document.getElementById('st-w').textContent=D.filter(r=>r[1]==="W").length;
document.getElementById('st-n').textContent=D.filter(r=>r[12]!=="g").length;
render();


/* ═══ v10 LAYER · chart fixes + sources, wave splits, reports library ═══ */

(function fixCharts(){
  const cards=document.querySelectorAll('#datasec .dcard2');
  const catColor={T:"var(--t)",H:"var(--h)",W:"var(--w)"};
  const catOf=n=>{const r=D.find(x=>x[0]===n);return r?r[1]:"T"};
  const shortM=m=>m.replace('transacting actives','actives').replace('monthly transacting actives','actives');
  const shortY=y=>/^\d{4}$/.test(String(y))?"’"+String(y).slice(2):y;

  /* 1 · reported users: compact uncut labels + linked sources */
  const max=Math.sqrt(Math.max(...USERS.map(u=>u[1])));
  cards[0].innerHTML='<h2>reported users</h2><div class="dsub">latest public figures · mixed metrics · square-root scale · click a name for its profile</div>'+
    USERS.map(([n,v,metric,yr])=>{
      const w=(Math.sqrt(v)/max*100).toFixed(1);
      return '<div class="hbar"><span class="nm" data-n="'+esc(n)+'">'+esc(n)+'</span><span class="tr"><span class="fl" style="width:'+w+'%;background:'+catColor[catOf(n)]+'"></span></span><span class="vl">'+v+'M '+esc(shortM(metric))+' '+esc(shortY(yr))+'</span></div>';
    }).join("")+
    '<div class="chsrc">sources: <a href="https://international.nubank.com.br/company/nu-holdings-ltd-reports-fourth-quarter-and-full-year-2025-financial-results/" target="_blank" rel="noopener">Nu FY25 results</a> · <a href="https://www.businesswire.com/news/home/20260224265595/en/Mercado-Libre-Caps-Stellar-2025-Performance-with-45-YoY-Revenue-Growth-in-Q4-as-Strategic-Investments-Accelerate-Market-Share-Gains" target="_blank" rel="noopener">MELI FY25</a> · <a href="https://www.stocktitan.net/sec-filings/XYZ/10-k-block-inc-files-annual-report-97739237536a.html" target="_blank" rel="noopener">Block 10-K</a> · <a href="https://owners.wise.com/" target="_blank" rel="noopener">Wise FY26</a> · company PRs — full trail per entity in its profile</div>';

  /* 2 · founding wave: rebuilt with zero-year stubs, clickable year splits, sources */
  const years=["<2010"];for(let y=2010;y<=2026;y++)years.push(String(y));
  const buckets=years.map(y=>{
    const rows=y==="<2010"?D.filter(r=>r[4]<2010):D.filter(r=>String(r[4])===y);
    return {y,t:rows.filter(r=>r[1]==="T").length,h:rows.filter(r=>r[1]==="H").length,w:rows.filter(r=>r[1]==="W").length};
  });
  const maxTot=Math.max(...buckets.map(b=>b.t+b.h+b.w));
  cards[1].innerHTML='<h2>the neobank waves</h2><div class="dsub">founding year of the '+D.length+' tracked entities, stacked by category · <b style="color:var(--t)">traditional</b> → <b style="color:var(--h)">hybrid</b> → <b style="color:var(--w)">web3-native</b> · click a column for the split</div>'+
    '<div class="wv2">'+buckets.map((b,i)=>{
      const tot=b.t+b.h+b.w;
      if(!tot)return '<div class="wcol" data-i="'+i+'" title="'+b.y+': none tracked"><div class="wstub"></div></div>';
      const px=v=>(v/maxTot*150).toFixed(1);
      return '<div class="wcol" data-i="'+i+'" title="'+b.y+': '+tot+'">'+
        (b.w?'<div class="wseg w" style="height:'+px(b.w)+'px"></div>':'')+
        (b.h?'<div class="wseg h" style="height:'+px(b.h)+'px"></div>':'')+
        (b.t?'<div class="wseg t" style="height:'+px(b.t)+'px"></div>':'')+'</div>';
    }).join("")+'</div>'+
    '<div class="wlbls">'+buckets.map(b=>'<span>'+(b.y==="<2010"?"pre-’10":"’"+b.y.slice(2))+'</span>').join("")+'</div>'+
    '<div id="wvsplit"><span class="hint">click a year column to see its category split</span></div>'+
    '<div class="chsrc">source: computed live from the neobankbeat dataset ('+D.length+' verified-active entities; founding years from filings &amp; company pages). years with no tracked launches show a baseline tick — e.g. 2010 sits in the quiet gap between the first challenger wave and the mobile-first boom.</div>';
  cards[1].querySelectorAll('.wcol').forEach(col=>col.addEventListener('click',()=>{
    cards[1].querySelectorAll('.wcol').forEach(c=>c.classList.remove('on'));
    col.classList.add('on');
    const b=buckets[+col.dataset.i],tot=b.t+b.h+b.w;
    document.getElementById('wvsplit').innerHTML='<b>'+esc(b.y)+'</b> — '+tot+' founded:'+
      '<span class="dot" style="background:var(--t)"></span>'+b.t+' traditional'+
      '<span class="dot" style="background:var(--h)"></span>'+b.h+' hybrid'+
      '<span class="dot" style="background:var(--w)"></span>'+b.w+' web3-native';
  }));
  document.querySelectorAll('#datasec .hbar .nm[data-n]').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.n)));

  /* 3 · stablecoin curve: linked sources */
  const curveCard=[...document.querySelectorAll('#datasec .dcard2')].find(c=>c.textContent.includes('stablecoin card curve'));
  if(curveCard){
    const ds=curveCard.querySelector('.dsub');
    if(ds)ds.innerHTML='monthly crypto-card volume, $B — from ~$100M/mo (early 2023) to ~$1.5B/mo (late 2025), 106% CAGR · approximated curve';
    curveCard.insertAdjacentHTML('beforeend','<div class="chsrc">sources: <a href="https://research.artemisanalytics.com/p/stablecoin-payments-at-scale-how" target="_blank" rel="noopener">Artemis — Stablecoin Payments at Scale</a> · <a href="https://www.coindesk.com/business/2026/01/16/crypto-card-spending-hits-usd18-billion-annualized-as-stablecoin-use-shifts-to-everyday-payments" target="_blank" rel="noopener">CoinDesk, Jan 2026</a> · <a href="https://www.visa.com/en-us/thought-leadership/innovation/stablecoin-linked-cards-monetize-money-movement" target="_blank" rel="noopener">Visa stablecoin-linked cards</a></div>');
  }
  /* 4 · heat matrix: source line */
  const heatCard=[...document.querySelectorAll('#datasec .dcard2')].find(c=>c.querySelector('table.heat'));
  if(heatCard)heatCard.insertAdjacentHTML('beforeend','<div class="chsrc">source: computed live from the neobankbeat dataset · multi-country players counted in every region they operate (verified countries of operation).</div>');
})();

/* ── library: best neobank reports + full-URL resources, footer-linked ── */
(function buildLibrary(){
  const REPORTS=[
["The New Economics of Neobanking","Simon-Kucher","2025","The neobank-dedicated benchmark: ~400 neobanks, 1.4B accounts, who actually makes money.","https://www.simon-kucher.com/en/insights/new-economics-neobanking","landing","gated"],
["Challenger Bank Index","Fincog","updated monthly","Tracks ~100 challengers on scale, growth and funding; the closest thing to a neobank league table.","https://fincog.nl/publications/5/challenger-bank-index","landing","gated"],
["Global Fintech: From Recovery to Resurgence","BCG × QED","2026","State of fintech revenues, profitability and the agentic-AI wave.","https://www.bcg.com/publications/2026/from-recovery-to-resurgence-in-global-fintech","landing",""],
["Fintech's Next Chapter","BCG × QED","2025","Prior edition, direct PDF — scaled winners, embedded finance, challenger economics.","https://web-assets.bcg.com/e8/4d/5eeb786b4aefbf6c7270ed4d0afe/fintechs-next-chapter-may-2025.pdf","pdf",""],
["Pulse of Fintech H2'25","KPMG","2026","Global fintech VC/M&A investment data, direct PDF.","https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/2026/02/pulse-of-fintech-h2-2025.pdf","pdf",""],
["State of Fintech 2025","CB Insights","2026","Funding, unicorns and category trends across fintech.","https://www.cbinsights.com/research/report/fintech-trends-2025/","landing","gated"],
["Global Banking Annual Review","McKinsey","2025","The incumbent view: where banking profit pools are moving.","https://www.mckinsey.com/industries/financial-services/our-insights/global-banking-annual-review-2025","landing",""],
["State of Crypto","a16z crypto","2025","Stablecoins as crypto's killer app; adoption, infra and policy.","https://a16zcrypto.com/posts/article/state-of-crypto-report-2025/","landing",""],
["Stablecoins 2030 — Web3 to Wall Street","Citi GPS","2025","Citi's $1.9T base / $4T bull-case stablecoin projection, direct PDF.","https://www.citigroup.com/rcs/citigpa/storage/public/GPS_Report_Stablecoins_2030.pdf","pdf",""],
["Stablecoin Payments from the Ground Up","Artemis","2025","The crypto-card + stablecoin payments dataset this site's curve is built on, direct PDF.","https://reports.artemisanalytics.com/stablecoins/artemis-stablecoin-payments-from-the-ground-up-2025.pdf","pdf",""],
["Stablecoin-Linked Cards & Money Movement","Visa","2026","Visa's own numbers on the $5.2B stablecoin-card wave, 130+ programs.","https://www.visa.com/en-us/thought-leadership/innovation/stablecoin-linked-cards-monetize-money-movement","landing",""],
["Geography of Cryptocurrency","Chainalysis","2025","Country-by-country crypto adoption — where the web3-native banks grow.","https://www.chainalysis.com/reports/2025-geo-crypto-report/","landing","gated"],
["Annual Economic Report, ch. III — The Next-Generation Monetary System","BIS","2025-2026","The central-bank counterargument on stablecoins, direct PDF.","https://www.bis.org/publ/arpdf/ar2025e3.pdf","pdf",""],
["Global Findex Database","World Bank","2025","79% of adults now banked, 1.3B still unbanked — the inclusion frontier neobanks chase.","https://www.worldbank.org/en/publication/globalfindex","landing",""]];
  const RES=[
["Fintech Brainfood","https://www.fintechbrainfood.com"],["Fintech Takes","https://fintechtakes.com"],["Fintech Business Weekly","https://fintechbusinessweekly.substack.com"],["This Week in Fintech","https://www.thisweekinfintech.com"],["WhiteSight","https://whitesight.net"],["Fincog","https://fincog.nl"],["C-Innovation — 2025 in digital banking (free article)","https://www.c-innovation.eu/post/how-2025-reshaped-digital-banking-and-what-2026-will-demand-of-banks"],["CB Insights fintech research","https://www.cbinsights.com/research/fintech/"],["Artemis","https://www.artemisanalytics.com"],["Paymentscan — onchain crypto-card volumes & users","https://paymentscan.xyz"],["Dune","https://dune.com"],["DefiLlama","https://defillama.com"],["RWA.xyz","https://rwa.xyz"],["Visa Onchain Analytics","https://visaonchainanalytics.com"],["The Block Data","https://www.theblock.co/data"],["L2Beat","https://l2beat.com"],["Sifted (EU)","https://sifted.eu"],["TechCabal (Africa)","https://techcabal.com"],["Tech in Asia","https://www.techinasia.com"],["Contxto (LatAm)","https://contxto.com"],["ESMA MiCA register","https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica"],["EBA registers","https://euclid.eba.europa.eu/register/"],["FCA register","https://register.fca.org.uk/s/"],["World Bank Global Findex","https://www.worldbank.org/en/publication/globalfindex"],["BIS","https://www.bis.org"]];
  const badge=(k,g)=>(k==='pdf'?'<span class="rbadge pdf">direct pdf</span>':'<span class="rbadge">landing</span>')+(g?'<span class="rbadge gated">email-gated</span>':'');
  const repHTML=REPORTS.map(([t,pub,yr,d,u,k,g])=>'<div class="rep"><div class="rt"><a href="'+u+'" target="_blank" rel="noopener">'+esc(t)+'</a>'+badge(k,g)+'</div><div class="rm">'+esc(pub)+' · '+esc(yr)+'</div><div class="rd">'+esc(d)+'</div><div class="ru"><a href="'+u+'" target="_blank" rel="noopener">'+esc(u)+'</a></div></div>').join("");
  const resHTML=RES.map(([n,u])=>'<div class="lres"><div class="ln2">'+esc(n)+'</div><div class="lu"><a href="'+u+'" target="_blank" rel="noopener">'+esc(u)+'</a></div></div>').join("");
  /* beforebegin on the footer put this outside <main>, leaving it the one content
     section in no landmark; appending to main lands it in the same visual spot */
  (document.getElementById('main')||document.querySelector('footer')).insertAdjacentHTML(
    document.getElementById('main')?'beforeend':'beforebegin',
    '<section class="library" id="library"><h2>library · best neobank reports &amp; resources</h2><div class="lsub">the reports worth your weekend and the feeds worth your week · every url shown in full, verified july 2026 · gated = free but asks for an email</div>'+
    '<div class="libgrid"><div><div class="libh3">reports — neobank-dedicated first, then fintech, stablecoins, inclusion</div>'+repHTML+'</div>'+
    '<div><div class="libh3">the ongoing reading + data stack</div>'+resHTML+'</div></div></section>');
  /* library + methodology links live in the static footer (explore column) */
  /* methodology aside becomes a pointer to the library */
  const rc=document.querySelector('.rescard');
  if(rc)rc.innerHTML='<h3>resources moved to the library</h3><div class="respointer">every newsletter, dashboard, register and report — with full urls and direct pdfs — now lives in the <a href="#library">library section</a> at the bottom of the page, linked from the footer.</div>';
})();
render();


/* ═══ v11 LAYER · section views, curve sanity note, report charts ═══ */

/* ── four new charts from the library reports ── */
(function reportCharts(){
  const ds=document.getElementById('datasec');
  /* a · the neobank paradox — Simon-Kucher */
  ds.insertAdjacentHTML('beforeend','<div class="dcard2"><h2>the neobank paradox</h2><div class="dsub">massive adoption, thin economics — the core tension of the category</div>'+
    '<div class="paradox"><div class="pxstat"><div class="pn">1.4B</div><div class="pl">accounts held at neobanks worldwide</div></div>'+
    '<div class="pxstat"><div class="pn">~40%</div><div class="pl">of new account openings now go to neobanks</div></div>'+
    '<div class="pxstat"><div class="pn">~5%</div><div class="pl">of the banking revenue pool actually captured</div></div></div>'+
    '<div class="chsrc">source: <a href="https://www.simon-kucher.com/en/insights/new-economics-neobanking" target="_blank" rel="noopener">Simon-Kucher — The New Economics of Neobanking</a> · onboarding is the moat; monetization is the war.</div></div>');
  /* b · getting the world banked — Findex */
  const FDX=[["2011",51],["2014",62],["2017",69],["2021",76],["2025",79]];
  ds.insertAdjacentHTML('beforeend','<div class="dcard2"><h2>getting the world banked</h2><div class="dsub">share of adults worldwide with a financial account — the frontier every inclusion-first neobank in this directory is chasing</div>'+
    '<div class="fdx">'+FDX.map(([y,v])=>'<div class="fcol"><div class="fv">'+v+'%</div><div class="fbar" style="height:'+(v/79*120).toFixed(0)+'px"></div><div class="fy">'+y+'</div></div>').join("")+'</div>'+
    '<div class="chsrc">≈1.3B adults still unbanked in 2025 — mobile money and super-app wallets are closing the gap fastest. source: <a href="https://www.worldbank.org/en/publication/globalfindex" target="_blank" rel="noopener">World Bank — Global Findex Database 2025</a></div></div>');
  /* c · stablecoin supply, the 2030 question — Citi GPS */
  const PROJ=[["early 2026",0.32,"var(--w)","~$0.32T today"],["2030 · base",1.9,"var(--t)","$1.9T Citi base case"],["2030 · bull",4,"var(--h)","$4T Citi bull case"]];
  ds.insertAdjacentHTML('beforeend','<div class="dcard2"><h2>stablecoin supply · the 2030 question</h2><div class="dsub">from ~$317B outstanding today to Citi\'s trillion-dollar scenarios — the deposit base web3-native banks are built on</div>'+
    '<div class="proj">'+PROJ.map(([l,v,c,cap])=>'<div class="fcol"><div class="fv">'+cap+'</div><div class="fbar" style="height:'+(v/4*130).toFixed(0)+'px;background:'+c+'"></div><div class="fy">'+l+'</div></div>').join("")+'</div>'+
    '<div class="chsrc">source: <a href="https://www.citigroup.com/rcs/citigpa/storage/public/GPS_Report_Stablecoins_2030.pdf" target="_blank" rel="noopener">Citi GPS — Stablecoins 2030 (direct PDF)</a> · supply figure early 2026, market data.</div></div>');
  /* d · how stablecoins get spent — Artemis */
  const CMP=[["P2P stablecoin transfers",19,"var(--h)","$19B ann. · +5% growth"],["crypto-card spend (total market)",18,"var(--w)","$18B ann. · 106% CAGR"],["of which Visa stablecoin-linked",5.2,"var(--t)","$5.2B 2025 · +319%"],["of which RedotPay",2.95,"var(--accent)","$2.95B 2025"]];
  const mx=Math.max(...CMP.map(c=>c[1]));
  ds.insertAdjacentHTML('beforeend','<div class="dcard2 cmp"><h2>how stablecoins get spent · 2025</h2><div class="dsub">cards have caught peer-to-peer — the quiet flip in stablecoin usage</div>'+
    CMP.map(([l,v,c,cap])=>'<div class="hbar"><span class="nm" style="cursor:default">'+esc(l)+'</span><span class="tr"><span class="fl" style="width:'+(v/mx*100).toFixed(1)+'%;background:'+c+'"></span></span><span class="vl">'+esc(cap)+'</span></div>').join("")+
    '<div class="chsrc">sources: <a href="https://reports.artemisanalytics.com/stablecoins/artemis-stablecoin-payments-from-the-ground-up-2025.pdf" target="_blank" rel="noopener">Artemis (direct PDF)</a> · <a href="https://www.visa.com/en-us/thought-leadership/innovation/stablecoin-linked-cards-monetize-money-movement" target="_blank" rel="noopener">Visa</a> · <a href="https://www.coindesk.com/business/2026/03/29/stablecoin-payments-go-invisible-in-southeast-asia-as-crypto-card-business-surges" target="_blank" rel="noopener">CoinDesk/StraitsX</a></div></div>');
  /* curve sanity annotation: why $1.5B/mo is right, and what smaller trackers measure */
  const curveCard=[...document.querySelectorAll('#datasec .dcard2')].find(c=>c.textContent.includes('stablecoin card curve'));
  if(curveCard)curveCard.insertAdjacentHTML('beforeend','<div class="curvenote"><b>reading the number:</b> ~$1.5B/mo (≈$18B annualized) is Artemis\'s <i>total-market</i> estimate and checks out against the parts: Visa\'s stablecoin-linked programs alone did $5.2B in 2025, RedotPay $2.95B, Rain &gt;$3B and Reap &gt;$6B annualized. Dune\'s on-chain-tracked cohort (~$120M/mo, Dec \'25) looks smaller because it only counts a handful of natively on-chain programs — measurement scope, not contradiction.</div>');
})();

/* ── section views: the nav becomes tabs ── */
(function views(){
  const $=s=>document.querySelector(s);
  const VIEWS={
    directory:['.hero','.spectrum','.controls','#activebar','#count','#grid'],
    map:['#mapsec'],data:['#datasec'],news:['.intake','#newssec'],
    methodology:['#methodology'],library:['#library']
  };
  const HREF2VIEW={'#directory':'directory','#mapsec':'map','#datasec':'data','#newssec':'news','#methodology':'methodology','#library':'library'};
  let current='directory';
  window.showView=function(v,skipPush){
    if(!VIEWS[v])return;
    const same=current===v;
    current=v;
    Object.entries(VIEWS).forEach(([name,sels])=>sels.forEach(s=>{
      const el=$(s);if(!el)return;
      el.style.display=(name===v)?'':'none';
      if(name===v)el.classList.add('viewfade');else el.classList.remove('viewfade');
    }));
    document.querySelectorAll('.hnav a').forEach(a=>a.classList.toggle('on',HREF2VIEW[a.getAttribute('href')]===v));
    /* directory = the homepage: keep its URL clean, no hash */
    const url=v==='directory'?location.pathname+location.search:'#'+VIEWS[v][0].replace(/[.#]/,'');
    /* real history entries so the browser back button walks tabs instead of leaving the site */
    try{
      if(skipPush||same)history.replaceState(null,'',url);
      else history.pushState(null,'',url);
    }catch(_){/* file:// previews can reject history writes */}
    window.scrollTo({top:0,behavior:'instant'});
  };
  document.body.classList.add('viewmode');
  /* nav + footer + pointer links switch views */
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');if(!a)return;
    const v=HREF2VIEW[a.getAttribute('href')]||(a.getAttribute('href')==='#library'?'library':null);
    if(v){e.preventDefault();showView(v);}
  });
  /* brand click → back to the main page (directory, filters reset) */
  $('.logo').addEventListener('click',()=>{
    showView('directory');
    const nd=document.getElementById('navdir');if(nd)nd.click();
    window.scrollTo({top:0});
  });
  $('.logo').title='back to the directory';
  /* cross-view interactions land on the directory: heat cells + map country chips */
  document.addEventListener('click',e=>{
    if(e.target.closest('.heat td[data-hm]')||e.target.closest('.mi-cty'))showView('directory');
  },true);
  /* wave/user chart name clicks open profiles (overlay — no view switch needed) */
  /* back/forward buttons walk the view history */
  window.addEventListener('popstate',()=>{
    const v=HREF2VIEW[location.hash]||'directory';
    if(v!==current)showView(v,true); /* unchanged view = modal-history pop; don't re-render (would scroll to top) */
  });
  /* initial view from hash */
  const h=location.hash;
  const initial=Object.entries(HREF2VIEW).find(([href])=>href===h);
  showView(initial?initial[1]:(h==='#library'?'library':'directory'),true);
})();
render();


/* ═══ v12 LAYER · floating mini-map ═══ */
(function miniMap(){
  const MMCOL={NA:"#89B0FF",EU:"#D075FF",LATAM:"#FF5C16",AF:"#BAF24A",MENA:"#FFA680",ASIA:"#CCE7FF",OC:"#E5FFC3"};
  const cols=Math.max(...GRID.map(r=>r.length));
  let dots='';
  GRID.forEach(row=>{
    for(let i=0;i<cols;i++){
      const ch=row[i]||'.';
      const m=L2M[ch];
      dots+=m?'<span class="mmdot" data-m="'+m+'" style="background:'+MMCOL[m]+'"></span>':'<span class="mmdot sea"></span>';
    }
  });
  document.body.insertAdjacentHTML('beforeend',
    '<aside class="minimap" id="minimap" aria-label="mini world map">'+
    '<div class="mmhead"><span class="mmtitle">world</span>'+
    '<button class="mmbtn mmexpand" id="mmexpand" title="open the full map">⤢</button>'+
    '<button class="mmbtn mmcollapse" id="mmcollapse" title="collapse">🌍</button></div>'+
    '<div class="mmgrid" id="mmgrid" style="grid-template-columns:repeat('+cols+',4px)">'+dots+'</div>'+
    '<div class="mmlabel" id="mmlabel">click a region to filter · drag me</div></aside>');
  const mm=document.getElementById('minimap'),lbl=document.getElementById('mmlabel');
  const regionCount=m=>D.filter(r=>macrosOf(r).includes(m)).length;
  /* hover: highlight the region + show name & count */
  document.getElementById('mmgrid').addEventListener('mouseover',e=>{
    const m=e.target.dataset&&e.target.dataset.m;
    if(m){mm.dataset.hov=m;lbl.innerHTML='<b>'+MACROS[m]+'</b> · '+regionCount(m)+' neobanks';}
  });
  document.getElementById('mmgrid').addEventListener('mouseleave',()=>{delete mm.dataset.hov;syncLabel();});
  /* click a region: filter the directory (like the full map) · click the sea: open the full map */
  document.getElementById('mmgrid').addEventListener('click',e=>{
    const m=e.target.dataset&&e.target.dataset.m;
    if(m){
      if(document.body.dataset.view&&document.body.dataset.view!=='directory')showView('directory');
      setMap(m);
    }else{
      showView('map');
    }
  });
  document.getElementById('mmexpand').addEventListener('click',()=>showView('map'));
  document.getElementById('mmcollapse').addEventListener('click',()=>{
    mm.classList.toggle('min');
    document.getElementById('mmcollapse').title=mm.classList.contains('min')?'expand mini-map':'collapse';
  });
  /* sync highlight with the active map filter */
  function syncActive(){
    mm.classList.toggle('hasfilter',!!mapFilter);
    mm.querySelectorAll('.mmdot[data-m]').forEach(dd=>dd.classList.toggle('actv',dd.dataset.m===mapFilter));
    syncLabel();
  }
  function syncLabel(){
    lbl.innerHTML=mapFilter?('filtering: <b>'+MACROS[mapFilter]+'</b> · '+regionCount(mapFilter)+' shown'):'click a region to filter · drag me';
  }
  /* drag to move the widget anywhere — it's a toy, let people play */
  (function draggable(){
    let sx=0,sy=0,ox=0,oy=0,down=false,moved=false;
    const clamp=()=>{
      const r=mm.getBoundingClientRect();
      const x=Math.min(Math.max(r.left,8),window.innerWidth-r.width-8);
      const y=Math.min(Math.max(r.top,8),window.innerHeight-r.height-8);
      mm.style.left=x+'px';mm.style.top=y+'px';mm.style.right='auto';mm.style.bottom='auto';
    };
    try{
      const saved=JSON.parse(localStorage.getItem('mmpos')||'null');
      if(saved){mm.style.left=saved[0]+'px';mm.style.top=saved[1]+'px';mm.style.right='auto';mm.style.bottom='auto';requestAnimationFrame(clamp);}
    }catch(_){}
    mm.addEventListener('pointerdown',e=>{
      if(e.target.closest('.mmbtn'))return;
      down=true;moved=false;sx=e.clientX;sy=e.clientY;
      const r=mm.getBoundingClientRect();ox=r.left;oy=r.top;
      if(mm.setPointerCapture)try{mm.setPointerCapture(e.pointerId);}catch(_){}
    });
    mm.addEventListener('pointermove',e=>{
      if(!down)return;
      const dx=e.clientX-sx,dy=e.clientY-sy;
      if(!moved&&Math.abs(dx)+Math.abs(dy)<6)return;
      moved=true;mm.classList.add('dragging');
      mm.style.left=(ox+dx)+'px';mm.style.top=(oy+dy)+'px';mm.style.right='auto';mm.style.bottom='auto';
    });
    mm.addEventListener('pointerup',e=>{
      if(!down)return;down=false;
      if(moved){
        clamp();mm.classList.remove('dragging');
        const r=mm.getBoundingClientRect();
        try{localStorage.setItem('mmpos',JSON.stringify([Math.round(r.left),Math.round(r.top)]));}catch(_){}
      }
    });
    /* a real drag shouldn't count as a click (which opens the full map) */
    mm.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
    window.addEventListener('resize',()=>{if(mm.style.left)clamp();});
    /* double-click the title snaps it back home */
    mm.querySelector('.mmhead').addEventListener('dblclick',()=>{
      mm.style.left=mm.style.top='';mm.style.right='16px';mm.style.bottom='96px';
      try{localStorage.removeItem('mmpos');}catch(_){}
    });
  })();
  const _setMap_mm=window.setMap;
  window.setMap=function(code){_setMap_mm(code);syncActive();};
  /* hide on the full-map view (redundant there) */
  const _showView_mm=window.showView;
  window.showView=function(v,skipPush){_showView_mm(v,skipPush);document.body.classList.toggle('on-map',v==='map');};
  document.body.classList.toggle('on-map',location.hash==='#mapsec');
  syncActive();
})();


/* ═══ v13 LAYER · intake on the main page, map CTA, footer submit ═══ */

/* intake card belongs on the main (directory) page — right after the grid — and stays in news too */
(function intakeVisible(){
  const intake=document.querySelector('.intake');
  const grid=document.getElementById('grid');
  if(intake&&grid)grid.insertAdjacentElement('afterend',intake);
  const _sv=window.showView;
  window.showView=function(v,skipPush){
    _sv(v,skipPush);
    document.body.dataset.view=v;
    if(intake)intake.style.display=(v==='directory'||v==='news')?'':'none';
  };
  document.body.dataset.view=document.body.dataset.view||'directory';
  if(intake)intake.style.display='';
  /* submit link lives in the static footer (open source column) */
})();

/* full map: region click keeps you on the map, shows the panel, and offers a clear next step */
(function mapCTA(){
  const _sr=window.showRegion;
  window.showRegion=function(code){
    _sr(code);
    if(!code)return;
    const el=document.getElementById('mapinfo');
    if(!el||el.querySelector('.mi-cta'))return;
    const n=D.filter(r=>macrosOf(r).includes(code)).length;
    el.insertAdjacentHTML('beforeend','<button class="mi-cta">browse these '+n+' in the directory →</button>');
    el.querySelector('.mi-cta').addEventListener('click',()=>showView('directory'));
  };
  if(mapFilter)showRegion(mapFilter);
})();


/* ═══ v14 LAYER · shareable filter URLs + "/" search shortcut ═══ */
(function shareableFilters(){
  /* v15 · country-availability filter — uses verified V[].cc, strict (no false positives) */
  (function buildCountryFilter(){
    const cnt={};
    D.forEach(r=>{((V[r[0]]||{}).cc||[]).forEach(c=>{cnt[c]=(cnt[c]||0)+1})});
    const names=Object.keys(cnt).sort((a,b)=>a.localeCompare(b));
    if(!names.length)return;
    const opts=names.map(c=>'<option value="'+c+'">country: '+c+' ('+cnt[c]+')</option>').join("");
    const sep=document.getElementById('sep-toggles');
    if(sep)sep.insertAdjacentHTML('beforebegin','<select id="f-country" aria-label="Country availability"><option value="">country: available in…</option>'+opts+'</select>');
    const sel=document.getElementById('f-country');
    if(sel)sel.addEventListener('change',e=>{countryF=e.target.value;render()});
    const ca=document.getElementById('clearall');
    if(ca)ca.addEventListener('click',()=>{countryF="";if(sel)sel.selectedIndex=0});
    const nd=document.getElementById('navdir');
    if(nd)nd.addEventListener('click',()=>{countryF="";if(sel)sel.selectedIndex=0});
  })();
  /* write the active filter state into the query string (directory view only) */
  const _render_v14=render;
  render=function(){
    _render_v14();
    const p=new URLSearchParams();
    if(cat!=="ALL")p.set('cat',cat);
    if(q)p.set('q',q);
    if(niche)p.set('niche',niche);
    if(region)p.set('region',region);
    if(custody)p.set('custody',custody);
    if(net)p.set('net',net);
    if(typeof regF!=="undefined"&&regF)p.set('reg',regF);
    if(typeof countryF!=="undefined"&&countryF)p.set('country',countryF);
    if(wantYield)p.set('y','1');
    if(wantStable)p.set('s','1');
    if(wantNoKyc)p.set('nk','1');
    if(wantAI)p.set('ai','1');
    if(typeof mapFilter!=="undefined"&&mapFilter)p.set('map',mapFilter);
    if(sortBy!=="az")p.set('sort',sortBy);
    const qs=p.toString();
    if((document.body.dataset.view||'directory')==='directory'){
      try{history.replaceState(null,'',location.pathname+(qs?'?'+qs:''))}catch(_){}
    }
  };
  /* apply filters from the URL on load — drives the real controls so all UI stays in sync */
  const p=new URLSearchParams(location.search);
  if(p.get('cat')){const el=document.querySelector('.pill[data-cat="'+p.get('cat')+'"]');if(el)el.click();}
  if(p.get('q')){const qi=document.getElementById('q');qi.value=p.get('q');qi.dispatchEvent(new Event('input',{bubbles:true}));}
  [['niche','f-niche'],['region','f-region'],['custody','f-custody'],['net','f-net'],['reg','f-reg'],['country','f-country'],['sort','sort']].forEach(([k,id])=>{
    const v=p.get(k);if(!v)return;
    const s=document.getElementById(id);if(!s)return;
    s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));
  });
  [['y','f-yield'],['s','f-stable'],['nk','f-nokyc'],['ai','f-ai']].forEach(([k,id])=>{
    if(p.get(k)!=='1')return;
    const c=document.getElementById(id);if(!c)return;
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
  });
  if(p.get('map')&&window.setMap)setMap(p.get('map'));
  /* "/" focuses the search from anywhere */
  document.addEventListener('keydown',e=>{
    if(e.key!=='/'||e.metaKey||e.ctrlKey||e.altKey)return;
    const t=e.target;
    if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return;
    e.preventDefault();
    if(window.showView)showView('directory');
    document.getElementById('q').focus();
  });
})();

/* ── compare flow ⇄ browser history + URL ──
   1. the tray selection lives in the URL (?cmp=A,B) → reload/share keeps it
   2. opening the side-by-side overlay pushes a history entry → the back
      button closes the table instead of leaving the page (same as ✕/Esc) */
(function compareHistory(){
  /* keep ?cmp= in sync — the v14 layer rebuilds the query string on every
     render, so we append after it */
  const _r=render;
  render=function(){
    _r();
    if((document.body.dataset.view||'directory')!=='directory'||!cmp.size)return;
    try{
      const u=new URL(location.href);
      u.searchParams.set('cmp',[...cmp].join(','));
      history.replaceState(history.state,'',u.pathname+'?'+u.searchParams.toString());
    }catch(_){}
  };
  /* restore the tray from a shared / reloaded URL */
  const p=new URLSearchParams(location.search);
  if(p.get('cmp')){
    p.get('cmp').split(',').forEach(n=>{
      const r=D.find(x=>x[0].toLowerCase()===n.trim().toLowerCase());
      if(r&&cmp.size<4)cmp.add(r[0]);
    });
    if(cmp.size){renderTray();render();}
  }
  /* overlay ⇄ history */
  const ov=document.getElementById('overlay');
  let owned=false;
  new MutationObserver(()=>{
    const show=ov.classList.contains('show');
    if(show&&!owned){owned=true;try{history.pushState({nbCmpOv:1},'',location.href)}catch(_){}}
    else if(!show&&owned){owned=false;try{history.back()}catch(_){}}
  }).observe(ov,{attributes:true,attributeFilter:['class']});
  window.addEventListener('popstate',()=>{
    if(owned){owned=false;ov.classList.remove('show');}
  });
  /* copy-link: the query string already carries ?cmp=A,B */
  const share=document.getElementById('ovshare');
  if(share)share.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(location.href);share.textContent='copied ✓';}
    catch(_){share.textContent=location.search;}
    setTimeout(()=>{share.textContent='copy link';},1600);
    nbevt('compare_share',{cmp:new URLSearchParams(location.search).get('cmp')||''});
  });
  const xshare=document.getElementById('ovxshare');
  if(xshare)xshare.addEventListener('click',()=>{
    const cmp=new URLSearchParams(location.search).get('cmp')||'';
    const names=cmp.split(',').filter(Boolean).join(' vs ');
    nbevt('compare_share',{cmp:cmp,to:'x'});
    window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent((names?names+': ':'')+'side by side on neobankbeat')+'&url='+encodeURIComponent(location.href)+'&via=neobankbeat','_blank');
  });
})();

/* ── custom analytics events (vercel + ga4 via nbevt) ── */
document.addEventListener('submit',e=>{
  if(e.target.classList&&e.target.classList.contains('subform'))nbevt('subscribe',{from:'home'});
},true);
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a');if(!a)return;
  if(a.classList.contains('n-link')){
    const h=a.closest('.newsrow')?.querySelector('.n-head')?.textContent||'';
    nbevt('news_read',{headline:h.slice(0,120)});
  }else if(a.host==='neobankbeat.substack.com'){
    nbevt('newsletter_click',{from:'home'});
  }else if(a.pathname==='/data.json'){
    nbevt('data_download',{from:'home'});
  }
});

/* ── profile modal ⇄ browser history ──
   opening a profile pushes its real company-page URL (/n/<slug>/) so the address bar
   is shareable and a reload lands on the static page; the back button closes the
   modal and returns to the filtered directory — same as clicking ✕ */
(function modalHistory(){
  const slugify=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'entity';
  /* uniquify identically to tests/build-pages.mjs so the slug matches the static page */
  const SLUG={},taken=new Set();
  D.forEach(r=>{let s=slugify(r[0]);while(taken.has(s))s+='-2';taken.add(s);SLUG[r[0]]=s;});
  let owned=false; /* true → the top history entry is the modal's */
  const _open=openDetail;
  openDetail=function(name){
    _open(name);
    if(!SLUG[name])return;
    const url='/n/'+SLUG[name]+'/';
    try{
      if(owned)history.replaceState({nbModal:name},'',url); /* peer→peer swap inside an open profile */
      else{history.pushState({nbModal:name},'',url);owned=true;}
    }catch(_){}
    const acts=document.querySelector('#dwrap .pactions');
    if(acts&&!acts.querySelector('.ppage'))acts.insertAdjacentHTML('beforeend','<a class="pghost ppage" href="'+url+'">full page →</a>');
    if(acts&&!acts.querySelector('.pxshare')){
      acts.insertAdjacentHTML('beforeend','<a class="pghost pxshare" href="https://twitter.com/intent/tweet?text='+encodeURIComponent(name+' on neobankbeat: custody, license, cards & facts')+'&url='+encodeURIComponent('https://www.neobankbeat.com'+url)+'&via=neobankbeat" target="_blank" rel="noopener">share on 𝕏</a>');
      acts.querySelector('.pxshare').addEventListener('click',()=>nbevt('profile_share',{name:name}));
    }
  };
  const _close=closeDetail;
  closeDetail=function(){
    _close();
    if(owned){owned=false;try{history.back()}catch(_){}}
  };
  window.addEventListener('popstate',()=>{
    if(owned){owned=false;_close();} /* back pressed while a profile is open */
  });
})();
/* boot complete: run the one coalesced render (full wrapper chain), then reveal */
window.__nbBoot=false;
if(window.__nbDirty){window.__nbDirty=false;render();}
document.body.classList.add('booted');

window.__nbBoot=false;if(window.__nbDirty){window.__nbDirty=false;try{render()}catch(_){}}document.body.classList.add('booted');/* failsafe: separate block in case a layer above throws */

/* ── WebMCP: expose the dataset to in-browser AI agents (navigator.modelContext) ──
   harmless no-op in browsers without the API */
(function(){
  if(!(navigator.modelContext&&typeof navigator.modelContext.provideContext==='function'))return;
  let cache=null;
  const load=async()=>cache||(cache=await (await fetch('/data.json')).json());
  const txt=o=>({content:[{type:'text',text:JSON.stringify(o)}]});
  const brief=e=>({name:e.name,category:e.category,custody:e.custody,regulation_type:e.regulation_type,hq:e.hq,region:e.region,audience:e.audience,stablecoins:e.stablecoins,website:e.website,profile:'https://www.neobankbeat.com/n/'+e.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'/'});
  navigator.modelContext.provideContext({tools:[
    {name:'search_neobanks',
     description:'Search the open dataset of 368 verified-active neobanks by name, category (traditional/hybrid/web3-native), custody, regulation, audience niche, country or HQ. Returns brief records with profile URLs.',
     inputSchema:{type:'object',properties:{query:{type:'string',description:'free-text filter, e.g. "self-custodial europe" or "nubank"'},limit:{type:'number',description:'max results, default 10'}},required:['query']},
     async execute({query,limit}){const d=await load();const terms=String(query).toLowerCase().split(/\s+/).filter(Boolean);
       const hay=e=>[e.name,e.category,e.custody,e.regulation_type,e.audience,e.hq,e.region,(e.countries||[]).join(' '),(e.active_regions||[]).join(' ')].join(' ').toLowerCase();
       const hits=d.entities.filter(e=>{const h=hay(e);return terms.every(t=>h.includes(t))}).slice(0,limit||10).map(brief);
       return txt({count:hits.length,results:hits})}},
    {name:'get_neobank',
     description:'Get the full record for one neobank by exact name: license, card network, cashback, yield, KYC, founders, funding, investors, reported users with sources.',
     inputSchema:{type:'object',properties:{name:{type:'string',description:'exact entity name, e.g. "Nubank"'}},required:['name']},
     async execute({name}){const d=await load();const q=String(name).toLowerCase();
       const e=d.entities.find(x=>x.name.toLowerCase()===q)||d.entities.find(x=>x.name.toLowerCase().includes(q));
       return txt(e?{found:true,entity:e}:{found:false,hint:'no entity matched "'+name+'" — try search_neobanks'})}}
  ]});
})();

/* ═══ modal focus containment ═══
   Both overlays already carried role="dialog" aria-modal="true", but neither
   contained focus: Tab walked straight out into the page behind, which for a
   screen-reader or keyboard user means reading content the dialog is covering
   with no way to tell they had left. The compare overlay also never gave focus
   back to whatever opened it.

   Both are shown by adding .show, from several call sites, so this observes the
   class instead of wrapping each one — every present and future open/close path
   is covered without touching them. */
(function modalFocus(){
  const SEL='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const dialogs=['overlay','detail'];
  const opener=new WeakMap();
  const isOpen=el=>el&&el.classList.contains('show');
  /* offsetParent is the usual visibility test and the wrong one here: it is null
     for a position:fixed element, which both overlays are. checkVisibility is
     the direct question, and where it is unavailable every control inside an
     open dialog is visible anyway, so assuming so is safe. */
  const focusables=el=>[...el.querySelectorAll(SEL)].filter(n=>
    !n.hasAttribute('hidden')&&(typeof n.checkVisibility==='function'?n.checkVisibility():true));
  const openDialog=()=>dialogs.map(id=>document.getElementById(id)).find(isOpen);
  const inAnyDialog=n=>dialogs.some(id=>{const el=document.getElementById(id);return el&&el.contains(n)});

  /* The observer fires a microtask after .show lands, and the open handlers move
     focus into the dialog synchronously — so reading activeElement from inside
     the observer captures a control in the dialog, not the thing that opened it.
     Tracking the last focus outside any dialog sidesteps the ordering entirely. */
  let lastOutside=null;
  document.addEventListener('focusin',e=>{ if(!inAnyDialog(e.target))lastOutside=e.target },true);

  dialogs.forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    /* a hidden dialog should not read as a modal that is merely empty */
    if(!isOpen(el))el.setAttribute('aria-hidden','true');
    new MutationObserver(()=>{
      if(isOpen(el)){
        el.removeAttribute('aria-hidden');
        if(!opener.has(el))opener.set(el,lastOutside);
        if(!el.contains(document.activeElement)){
          const f=focusables(el);
          if(f.length)f[0].focus();
        }
      }else{
        el.setAttribute('aria-hidden','true');
        const back=opener.get(el);
        opener.delete(el);
        /* only pull focus back if it is still stranded inside the closed dialog */
        if(back&&(el.contains(document.activeElement)||document.activeElement===document.body)){
          try{back.focus()}catch(_){}
        }
      }
    }).observe(el,{attributes:true,attributeFilter:['class']});
  });

  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const el=openDialog();
    if(!el)return;
    const f=focusables(el);
    if(!f.length){e.preventDefault();return}
    const first=f[0],last=f[f.length-1];
    if(!el.contains(document.activeElement)){e.preventDefault();first.focus();return}
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  },true);
})();

/* ── nav drawer + language menu: close button, scrim/outside click, Esc ── */
document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.ndclose');if(c){c.closest('details').removeAttribute('open');return}document.querySelectorAll('.navdrawer[open],.langmenu[open]').forEach(function(d){if(!d.contains(e.target)||e.target===d)d.removeAttribute('open')})});
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.navdrawer[open],.langmenu[open]').forEach(function(d){d.removeAttribute('open')})});
