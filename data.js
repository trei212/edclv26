/* ─── STAGE CONFIG ─────────────────────────────────────────────────── */
const STAGE_CFG={
  kineticFIELD:  {key:'kinetic-field',  p:'#fc3cbf',s:'#0bf5f8',label:'kineticFIELD',  short:'KF'},
  neonGARDEN:    {key:'neon-garden',    p:'#f844a5',s:'#16e6fd',label:'neonGARDEN',    short:'NG'},
  circuitGROUNDS:{key:'circuit-grounds',p:'#2582f6',s:'#fa45b9',label:'circuitGROUNDS',short:'CG'},
  stereoBLOOM:   {key:'stereo-bloom',   p:'#ff3eb2',s:'#14caff',label:'stereoBLOOM',   short:'SB'},
  cosmicMEADOW:  {key:'cosmic-meadow',  p:'#ec4ca4',s:'#14c4ed',label:'cosmicMEADOW',  short:'CM'},
  bassPOD:       {key:'bass-pod',       p:'#fa337f',s:'#abe400',label:'bassPOD',       short:'BP'},
  wasteland:     {key:'wasteland',      p:'#c8ea1d',s:'#ff6e03',label:'wasteLAND',     short:'WL'},
  quantumValley: {key:'quantum-valley', p:'#2b96ef',s:'#00d4ff',label:'quantumVALLEY', short:'QV'},
  bionicJungle:  {key:'bionic-jungle',  p:'#62e80b',s:'#0bcef0',label:'bionicJUNGLE',  short:'BJ'},
};
const MAIN_STAGES=Object.keys(STAGE_CFG);

/* ─── GENRE CONFIG ─────────────────────────────────────────────────── */
const GENRES={
  'House':        {color:'#ff9f43',label:'House'},
  'Techno':       {color:'#00d4ff',label:'Techno'},
  'Bass':         {color:'#62e80b',label:'Bass'},
  'Melodic':      {color:'#bf5fff',label:'Melodic'},
  'Trance':       {color:'#2b96ef',label:'Trance'},
  'Hard Dance':   {color:'#ff6e03',label:'Hard Dance'},
  'Drum & Bass':  {color:'#abe400',label:'Drum & Bass'},
  'Mainstage':    {color:'#ffffff',label:'Mainstage'},
  'Electronic':   {color:'#aaa',   label:'Electronic'},
};

/* ─── ASSET HELPERS ────────────────────────────────────────────────── */
const A=p=>`assets/webp/${p}`;
const IC=p=>`assets/icons/${p}`;
const H=p=>`assets/headers/${p}`;
const WM=k=>`assets/webp/${k}-wordmark.webp`;
const SI=k=>`assets/icons/stage-icon/stage-${k}-icon.webp`;
const SL=k=>`assets/icons/stage-lockup/stage-${k}-lockup.webp`;
const NAV_IC=n=>`assets/icons/nav/${n}.webp`;
const ACT_IC=n=>`assets/icons/action/${n}.webp`;
const UTIL_IC=n=>`assets/icons/utility/${n}.webp`;

/* ─── TIME UTILS ───────────────────────────────────────────────────── */
const toM=t=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
const fmtT=t=>{const[h,m]=t.split(':').map(Number);const hh=h%24;const ap=hh>=12?'PM':'AM';const d=hh===0?12:hh>12?hh-12:hh;return`${d}:${String(m).padStart(2,'0')} ${ap}`;};
const fmtEndsIn=secs=>{
  if(secs>=3600){const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;return{val:`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,sub:'HR  MIN  SEC'};}
  const m=Math.floor(secs/60),s=secs%60;
  return{val:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,sub:'MIN  SEC'};
};
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');

/* ─── FESTIVAL TIMING ──────────────────────────────────────────────── */
const DAY_STARTS=[
  new Date('2026-05-15T17:00:00-07:00'),
  new Date('2026-05-16T17:00:00-07:00'),
  new Date('2026-05-17T17:00:00-07:00'),
];
const FEST_END=new Date('2026-05-18T05:30:00-07:00');
const DAYS_LABEL=['Friday','Saturday','Sunday'];
const DAYS_SHORT=['Fri May 15','Sat May 16','Sun May 17'];

function getFestPhase(now=Date.now()){
  const t=new Date(now);
  if(t<DAY_STARTS[0])return{phase:'pre'};
  if(t>FEST_END)return{phase:'post'};
  for(let i=2;i>=0;i--){
    const end=new Date(DAY_STARTS[i].getTime()+12.5*3600000);
    if(t>=DAY_STARTS[i]&&t<=end)return{phase:'live',day:i+1,dayStart:DAY_STARTS[i]};
  }
  for(let i=0;i<2;i++){
    const prevEnd=new Date(DAY_STARTS[i].getTime()+12.5*3600000);
    if(t>prevEnd&&t<DAY_STARTS[i+1])return{phase:'inter',nextDay:i+2,nextStart:DAY_STARTS[i+1]};
  }
  return{phase:'live',day:1,dayStart:DAY_STARTS[0]};
}

function getLiveData(day,dayStart,selectedIds,now=Date.now()){
  const elapsed=(now-dayStart.getTime())/60000;
  const festMin=17*60+elapsed;
  const daySets=SCHEDULE.filter(s=>s.day===day&&MAIN_STAGES.includes(s.stage));
  const playing=daySets.filter(s=>festMin>=toM(s.s)&&festMin<toM(s.e));
  const upcoming=daySets.filter(s=>toM(s.s)>festMin).sort((a,b)=>toM(a.s)-toM(b.s));
  return{playing,upcoming,festMin};
}

/* ─── CONFLICT RECON ───────────────────────────────────────────────── */
function reconflict(selectedIds){
  const result={};
  for(const day of[1,2,3]){
    const daySel=SCHEDULE.filter(s=>selectedIds.includes(s.id)&&s.day===day).sort((a,b)=>toM(a.cs)-toM(b.cs));
    const recon=daySel.map(s=>({...s}));
    for(let i=0;i<recon.length-1;i++){
      const a=recon[i],b=recon[i+1];
      const overlap=toM(a.ce)-toM(b.cs);
      if(overlap>0){
        if(overlap<=15){recon[i]={...a,ce:b.cs,trimmed:true,trimMin:overlap};}
        else{recon[i]={...a,conflict:true};recon[i+1]={...b,conflict:true};}
      }
    }
    recon.forEach(s=>{result[s.id]=s;});
  }
  return result;
}

/* ─── SCHEDULE DATA (with genre tags) ─────────────────────────────── */
const RAW=[
 // kineticFIELD
 {stage:'kineticFIELD',day:1,artist:'LAIDBACK LUKE B2B CHUCKIE',s:'19:00',e:'20:00',g:'House'},
 {stage:'kineticFIELD',day:1,artist:'KOROLOVA',s:'20:00',e:'21:00',g:'Melodic'},
 {stage:'kineticFIELD',day:1,artist:'ARGY',s:'21:00',e:'22:00',g:'Techno'},
 {stage:'kineticFIELD',day:1,artist:'CHRIS LORENZO',s:'22:07',e:'23:15',g:'House'},
 {stage:'kineticFIELD',day:1,artist:'PORTER ROBINSON',s:'23:15',e:'25:47',g:'Melodic'},
 {stage:'kineticFIELD',day:1,artist:'FISHER',s:'25:47',e:'26:57',g:'House'},
 {stage:'kineticFIELD',day:1,artist:'CHARLOTTE DE WITTE',s:'28:14',e:'29:28',g:'Techno'},
 {stage:'kineticFIELD',day:2,artist:'AR/CO',s:'19:00',e:'20:00',g:'Mainstage'},
 {stage:'kineticFIELD',day:2,artist:'HAYLA',s:'20:00',e:'21:00',g:'Melodic'},
 {stage:'kineticFIELD',day:2,artist:'STEVE AOKI',s:'21:00',e:'23:19',g:'Mainstage'},
 {stage:'kineticFIELD',day:2,artist:'HARDWELL',s:'23:19',e:'24:28',g:'Mainstage'},
 {stage:'kineticFIELD',day:2,artist:'JOHN SUMMIT',s:'24:32',e:'25:40',g:'House'},
 {stage:'kineticFIELD',day:2,artist:'KASKADE',s:'27:01',e:'28:10',g:'Mainstage'},
 {stage:'kineticFIELD',day:2,artist:'ABOVE & BEYOND',s:'28:14',e:'29:28',g:'Trance'},
 {stage:'kineticFIELD',day:3,artist:'LAYTON GIORDANI',s:'21:00',e:'22:00',g:'Techno'},
 {stage:'kineticFIELD',day:3,artist:'FUNK TRIBU',s:'22:07',e:'23:15',g:'House'},
 {stage:'kineticFIELD',day:3,artist:'GRIZ B2B WOOLI',s:'23:19',e:'24:28',g:'Bass'},
 {stage:'kineticFIELD',day:3,artist:'MARTIN GARRIX',s:'24:28',e:'25:30',g:'Mainstage'},
 {stage:'kineticFIELD',day:3,artist:'ZEDD',s:'25:30',e:'27:01',g:'Mainstage'},
 {stage:'kineticFIELD',day:3,artist:'CLOONEE',s:'27:01',e:'28:10',g:'House'},
 {stage:'kineticFIELD',day:3,artist:'ARMIN VAN BUUREN',s:'28:14',e:'29:28',g:'Trance'},
 // neonGARDEN
 {stage:'neonGARDEN',day:1,artist:'ANASTAZJA',s:'19:00',e:'20:30',g:'Techno'},
 {stage:'neonGARDEN',day:1,artist:'DJ TENNIS B2B CHLOE CAILLET',s:'22:00',e:'23:30',g:'House'},
 {stage:'neonGARDEN',day:1,artist:'ADRIATIQUE',s:'25:00',e:'26:30',g:'Melodic'},
 {stage:'neonGARDEN',day:1,artist:'JOSEPH CAPRIATI',s:'26:30',e:'28:00',g:'Techno'},
 {stage:'neonGARDEN',day:1,artist:'ELI BROWN',s:'28:00',e:'29:30',g:'House'},
 {stage:'neonGARDEN',day:2,artist:'AHMED SPINS',s:'22:00',e:'23:30',g:'House'},
 {stage:'neonGARDEN',day:2,artist:'LUCIANO',s:'23:30',e:'25:30',g:'Techno'},
 {stage:'neonGARDEN',day:2,artist:'JOSH BAKER B2B KETTAMA B2B PROSPA',s:'27:30',e:'29:30',g:'House'},
 {stage:'neonGARDEN',day:3,artist:'BAD BEAT',s:'19:00',e:'20:15',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'ADIEL',s:'21:30',e:'22:50',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'DJ GIGOLA',s:'22:50',e:'24:10',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'999999999',s:'24:10',e:'25:30',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'INDIRA PAGANOTTO',s:'25:30',e:'26:50',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'KI/KI',s:'26:50',e:'28:10',g:'Techno'},
 {stage:'neonGARDEN',day:3,artist:'KLANGKUENSTLER',s:'28:10',e:'29:30',g:'Techno'},
 // circuitGROUNDS
 {stage:'circuitGROUNDS',day:1,artist:'1991',s:'19:00',e:'20:00',g:'Drum & Bass'},
 {stage:'circuitGROUNDS',day:1,artist:'BOU',s:'20:00',e:'21:00',g:'Drum & Bass'},
 {stage:'circuitGROUNDS',day:1,artist:'I HATE MODELS',s:'22:00',e:'23:15',g:'Techno'},
 {stage:'circuitGROUNDS',day:1,artist:'LEVITY',s:'23:15',e:'24:25',g:'Electronic'},
 {stage:'circuitGROUNDS',day:1,artist:'HOLY PRIEST',s:'26:35',e:'27:30',g:'Techno'},
 {stage:'circuitGROUNDS',day:1,artist:'LEVEL UP',s:'28:30',e:'29:30',g:'Electronic'},
 {stage:'circuitGROUNDS',day:2,artist:'DJ MANDY',s:'19:00',e:'20:00',g:'Techno'},
 {stage:'circuitGROUNDS',day:2,artist:'KETTAMA',s:'21:15',e:'22:45',g:'House'},
 {stage:'circuitGROUNDS',day:2,artist:'BOYS NOIZE',s:'27:15',e:'28:30',g:'Techno'},
 {stage:'circuitGROUNDS',day:2,artist:'LILLY PALMER',s:'28:30',e:'29:30',g:'Techno'},
 {stage:'circuitGROUNDS',day:3,artist:'LINSKA',s:'19:00',e:'20:30',g:'Techno'},
 {stage:'circuitGROUNDS',day:3,artist:'ANNA',s:'20:30',e:'22:00',g:'Techno'},
 {stage:'circuitGROUNDS',day:3,artist:'BELTRAN',s:'22:00',e:'23:30',g:'Techno'},
 {stage:'circuitGROUNDS',day:3,artist:'CHRIS STUSSY',s:'23:30',e:'25:00',g:'House'},
 {stage:'circuitGROUNDS',day:3,artist:'KEVIN DE VRIES',s:'28:00',e:'29:30',g:'Techno'},
 // stereoBLOOM
 {stage:'stereoBLOOM',day:1,artist:'ABANA B2B JULIET MENDOZA',s:'19:00',e:'20:00',g:'House'},
 {stage:'stereoBLOOM',day:1,artist:'JOSH BAKER',s:'24:45',e:'26:00',g:'House'},
 {stage:'stereoBLOOM',day:2,artist:'DISCIP',s:'21:00',e:'22:00',g:'Hard Dance'},
 {stage:'stereoBLOOM',day:2,artist:'CID',s:'25:45',e:'27:00',g:'House'},
 {stage:'stereoBLOOM',day:2,artist:'HNTR',s:'27:00',e:'28:15',g:'Bass'},
 {stage:'stereoBLOOM',day:2,artist:'BOLO',s:'28:15',e:'29:30',g:'Bass'},
 {stage:'stereoBLOOM',day:3,artist:'KLO',s:'19:00',e:'20:00',g:'Electronic'},
 {stage:'stereoBLOOM',day:3,artist:'HAMDI',s:'23:45',e:'25:00',g:'Bass'},
 {stage:'stereoBLOOM',day:3,artist:'CHRIS LORENZO B2B BULLET TOOTH',s:'25:00',e:'26:15',g:'House'},
 {stage:'stereoBLOOM',day:3,artist:'LU.RE',s:'28:30',e:'29:30',g:'Techno'},
 // cosmicMEADOW
 {stage:'cosmicMEADOW',day:1,artist:'JACKIE HOLLANDER',s:'19:00',e:'19:55',g:'Melodic'},
 {stage:'cosmicMEADOW',day:1,artist:'FROST CHILDREN',s:'21:00',e:'22:15',g:'Melodic'},
 {stage:'cosmicMEADOW',day:2,artist:'FROST CHILDREN',s:'19:00',e:'20:15',g:'Melodic'},
 {stage:'cosmicMEADOW',day:2,artist:'HANNAH LAING',s:'20:15',e:'21:25',g:'House'},
 {stage:'cosmicMEADOW',day:2,artist:'BUNT.',s:'24:40',e:'26:10',g:'Melodic'},
 {stage:'cosmicMEADOW',day:2,artist:'INTERPLANETARY CRIMINAL',s:'26:10',e:'27:30',g:'House'},
 {stage:'cosmicMEADOW',day:2,artist:'DJ GIGOLA B2B MCR-T',s:'28:30',e:'29:30',g:'Techno'},
 {stage:'cosmicMEADOW',day:3,artist:'GRAVAGERZ',s:'19:00',e:'20:00',g:'Bass'},
 {stage:'cosmicMEADOW',day:3,artist:'DABIN',s:'23:00',e:'24:05',g:'Melodic'},
 {stage:'cosmicMEADOW',day:3,artist:'ALISON WONDERLAND',s:'24:05',e:'25:05',g:'Melodic'},
 {stage:'cosmicMEADOW',day:3,artist:'BLACK TIGER SEX MACHINE',s:'27:20',e:'28:30',g:'Bass'},
 // bassPOD
 {stage:'bassPOD',day:1,artist:'HEYZ',s:'20:40',e:'21:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'GORILLAT',s:'22:30',e:'23:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'GHENGAR',s:'23:30',e:'24:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'ATLIENS',s:'24:30',e:'25:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'KAI WACHI',s:'25:30',e:'26:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'ADVENTURE CLUB',s:'26:30',e:'27:30',g:'Bass'},
 {stage:'bassPOD',day:1,artist:'CULTURE SHOCK',s:'27:30',e:'28:30',g:'Drum & Bass'},
 {stage:'bassPOD',day:1,artist:'CYCLOPS',s:'28:30',e:'29:30',g:'Bass'},
 {stage:'bassPOD',day:2,artist:'FALLEN WITH MC DINO',s:'19:00',e:'19:50',g:'Drum & Bass'},
 {stage:'bassPOD',day:2,artist:'AVELLO B2B DENNETT',s:'19:50',e:'20:40',g:'Drum & Bass'},
 {stage:'bassPOD',day:2,artist:'HYBRID MINDS',s:'21:30',e:'22:30',g:'Drum & Bass'},
 {stage:'bassPOD',day:2,artist:'DELTA HEAVY',s:'23:30',e:'24:30',g:'Drum & Bass'},
 {stage:'bassPOD',day:2,artist:'GETTER',s:'24:30',e:'25:30',g:'Bass'},
 {stage:'bassPOD',day:2,artist:'EPTIC B2B SPACE LACES',s:'25:30',e:'26:30',g:'Bass'},
 {stage:'bassPOD',day:2,artist:'DOCTOR P B2B FLUX PAVILION B2B FUNTCASE',s:'26:30',e:'27:30',g:'Bass'},
 {stage:'bassPOD',day:2,artist:'HOL!',s:'27:30',e:'28:30',g:'Bass'},
 {stage:'bassPOD',day:3,artist:'EAZYBAKED',s:'20:40',e:'21:30',g:'Bass'},
 {stage:'bassPOD',day:3,artist:'INFEKT B2B SAMPLIFIRE',s:'21:30',e:'22:30',g:'Bass'},
 {stage:'bassPOD',day:3,artist:'A.M.C',s:'22:30',e:'23:30',g:'Drum & Bass'},
 {stage:'bassPOD',day:3,artist:'AHEE B2B LIQUID STRANGER',s:'25:30',e:'26:30',g:'Bass'},
 {stage:'bassPOD',day:3,artist:'BOOGIE T B2B DISTINCT MOTIVE',s:'27:30',e:'28:30',g:'Bass'},
 {stage:'bassPOD',day:3,artist:'AEON:MODE',s:'28:30',e:'29:30',g:'Bass'},
 // wasteland
 {stage:'wasteland',day:1,artist:'DOMINA',s:'19:00',e:'20:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'JOHANNES SCHUSTER',s:'21:30',e:'22:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'ADRIAN MILLS',s:'22:30',e:'23:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'CLOUDY',s:'23:30',e:'24:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'KUKO',s:'24:30',e:'25:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'GRAVEDGR',s:'25:30',e:'26:30',g:'Hard Dance'},
 {stage:'wasteland',day:1,artist:'DYEN',s:'27:30',e:'28:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'CUTDWN',s:'19:00',e:'20:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'DEAD X',s:'20:30',e:'21:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'LADY FAITH B2B LNY TNZ',s:'23:30',e:'24:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'CODE BLACK B2B AUDIOFREQ B2B TONESHIFTERZ',s:'24:30',e:'25:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'DA TWEEKAZ',s:'25:30',e:'26:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'LIL TEXAS',s:'26:30',e:'27:30',g:'Hard Dance'},
 {stage:'wasteland',day:2,artist:'ALYSSA JOLEE',s:'28:30',e:'29:30',g:'Hard Dance'},
 {stage:'wasteland',day:3,artist:'CLAWZ',s:'20:30',e:'21:30',g:'Hard Dance'},
 {stage:'wasteland',day:3,artist:'DJ ISAAC',s:'23:30',e:'24:30',g:'Hard Dance'},
 // quantumValley
 {stage:'quantumValley',day:1,artist:'COLD BLUE',s:'21:00',e:'22:00',g:'Trance'},
 {stage:'quantumValley',day:1,artist:'DARUDE',s:'23:00',e:'24:00',g:'Trance'},
 {stage:'quantumValley',day:1,artist:'COSMIC GATE',s:'24:00',e:'25:00',g:'Trance'},
 {stage:'quantumValley',day:1,artist:'GARETH EMERY',s:'25:00',e:'26:00',g:'Trance'},
 {stage:'quantumValley',day:1,artist:'ILAN BLUESTONE',s:'26:00',e:'27:00',g:'Trance'},
 {stage:'quantumValley',day:1,artist:'DARREN PORTER',s:'28:00',e:'29:30',g:'Trance'},
 {stage:'quantumValley',day:2,artist:'BILLY GILLIES',s:'21:30',e:'22:30',g:'Trance'},
 {stage:'quantumValley',day:2,artist:'ANDREW RAYEL',s:'23:30',e:'24:30',g:'Trance'},
 {stage:'quantumValley',day:2,artist:'ASTRIX',s:'26:30',e:'27:30',g:'Trance'},
 {stage:'quantumValley',day:3,artist:'CRISTOPH',s:'22:00',e:'23:00',g:'Techno'},
 {stage:'quantumValley',day:3,artist:'ELI & FUR',s:'23:00',e:'24:00',g:'Melodic'},
 {stage:'quantumValley',day:3,artist:'CASSIAN',s:'25:00',e:'26:15',g:'Melodic'},
 {stage:'quantumValley',day:3,artist:'INNELLEA',s:'27:30',e:'28:30',g:'Techno'},
 {stage:'quantumValley',day:3,artist:'KREAM',s:'28:30',e:'29:30',g:'House'},
 // bionicJungle
 {stage:'bionicJungle',day:1,artist:'HEIDI LAWDEN B2B MASHA MAR',s:'17:00',e:'19:00',g:'Techno'},
 {stage:'bionicJungle',day:1,artist:'AVALON EMERSON',s:'28:00',e:'29:30',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'BASHKKA B2B SEDEF ADASI',s:'21:00',e:'22:30',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'HAAI B2B LUKE ALESSI',s:'22:30',e:'24:00',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'BAD BOOMBOX B2B OLLIE LISHMAN',s:'25:15',e:'26:30',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'BENWAL',s:'26:30',e:'27:30',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'BAUGRUPPE90',s:'27:30',e:'28:30',g:'Techno'},
 {stage:'bionicJungle',day:2,artist:'CLUB ANGEL',s:'28:30',e:'29:30',g:'Techno'},
 {stage:'bionicJungle',day:3,artist:'ALVES',s:'19:00',e:'20:30',g:'Techno'},
 {stage:'bionicJungle',day:3,artist:'ISABELLA',s:'20:30',e:'22:30',g:'Techno'},
 {stage:'bionicJungle',day:3,artist:'KINAHAU',s:'22:30',e:'24:00',g:'Techno'},
 {stage:'bionicJungle',day:3,artist:'DJ TENNIS B2B RED AXES',s:'25:30',e:'27:30',g:'Techno'},
 {stage:'bionicJungle',day:3,artist:'BELTRAN B2B SIMAS',s:'27:30',e:'29:30',g:'Techno'},
];

const SCHEDULE=RAW.map(r=>({
  ...r,
  id:`${STAGE_CFG[r.stage]?.short||r.stage}-${slugify(r.artist)}-d${r.day}`,
  cs:r.s, ce:r.e,
}));

/* ─── COPY ─────────────────────────────────────────────────────────── */
const COPY={
  homePre:   "the electric sky doesn't judge.",
  homeLive:  "you're exactly where you need to be. probably.",
  schedule:  "chart your night. adjust as needed.",
  grid:      "the full picture. while you can still read it.",
  map:       "find your way. eventually.",
  crew:      "your people. hold onto them.",
  myList:    "proof it happened.",
  ctaPre:    "your night won't plan itself.",
  ctaSub:    "gates open soon. the rest is up to you.",
};
