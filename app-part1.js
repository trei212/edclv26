/* ─── LOCAL STORAGE ────────────────────────────────────────────────── */
const LS={
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

/* ─── SHARE ────────────────────────────────────────────────────────── */
const encodeShare=ids=>ids.length?'#s='+ids.join('.'):'' ;
const decodeShare=h=>h?.startsWith('#s=')?h.slice(3).split('.').filter(Boolean):null;
const parseSharedHash=()=>{
  const ids=decodeShare(window.location.hash);
  return ids?ids.filter(id=>SCHEDULE.some(s=>s.id===id)):null;
};
const hap=(ms=8)=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch{}};

/* ─── APP STATE ────────────────────────────────────────────────────── */
function useApp(){
  const sharedOnLoad=React.useMemo(()=>parseSharedHash(),[]);
  const[selected,setSelected]=React.useState(()=>LS.get('sel',[]));
  const[crew,setCrew]=React.useState(()=>LS.get('crew',[]));
  const[markers,setMarkers]=React.useState(()=>LS.get('markers',[]));
  const[mapPins,setMapPins]=React.useState(()=>LS.get('mapPins',[]));
  const[sharedIds,setSharedIds]=React.useState(sharedOnLoad);
  const[weather,setWeather]=React.useState(()=>LS.get('weather',null));

  React.useEffect(()=>{LS.set('sel',selected);},[selected]);
  React.useEffect(()=>{LS.set('crew',crew);},[crew]);
  React.useEffect(()=>{LS.set('markers',markers);},[markers]);
  React.useEffect(()=>{LS.set('mapPins',mapPins);},[mapPins]);

  React.useEffect(()=>{
    if(sharedOnLoad)return;
    history.replaceState(null,'',encodeShare(selected)||window.location.pathname);
  },[selected,sharedOnLoad]);

  // Weather fetch
  React.useEffect(()=>{
    async function fetchWeather(){
      try{
        // Las Vegas coords — festival is outdoors at LV Motor Speedway
        const res=await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.2716&longitude=-115.0116&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles');
        const data=await res.json();
        const code=data.current.weather_code;
        const temp=Math.round(data.current.temperature_2m);
        const cond=code<=1?'Clear':code<=3?'Cloudy':code<=67?'Rain':code<=77?'Snow':code<=82?'Showers':'Storm';
        const w={temp,cond,updated:Date.now()};
        setWeather(w);LS.set('weather',w);
      }catch{}
    }
    const cached=LS.get('weather',null);
    if(!cached||Date.now()-cached.updated>1800000)fetchWeather();
  },[]);

  const recon=React.useMemo(()=>reconflict(selected),[selected]);
  const toggleSet=React.useCallback((id)=>{hap();setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);},[]);

  return{selected,toggleSet,recon,crew,setCrew,markers,setMarkers,mapPins,setMapPins,sharedIds,setSharedIds,weather};
}

function useClock(){
  const[now,setNow]=React.useState(Date.now());
  React.useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  return now;
}

/* ─── ARTIST NAME WITH B2B TREATMENT ──────────────────────────────── */
function ArtistName({name,size=16,color='#fff',block=false}){
  const parts=name.split(/\s+(B2B)\s+/);
  if(parts.length===1)return(
    <span style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:size,color,letterSpacing:'-.02em',lineHeight:1.05,display:block?'block':'inline'}}>
      {name}
    </span>
  );
  const segs=[];
  for(let i=0;i<parts.length;i++){
    if(parts[i]==='B2B')continue;
    segs.push({name:parts[i],hasB2B:i<parts.length-2&&parts[i+1]==='B2B'});
  }
  return(
    <span style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:size,color,letterSpacing:'-.02em',lineHeight:1.1,display:'block'}}>
      {segs.map((seg,i)=>(
        <span key={i} style={{display:'block'}}>
          {seg.name}
          {seg.hasB2B&&<span style={{fontSize:size*.55,fontWeight:600,opacity:.55,letterSpacing:'.06em',marginLeft:4}}>B2B</span>}
        </span>
      ))}
    </span>
  );
}

/* ─── GENRE PILL ───────────────────────────────────────────────────── */
function GenrePill({genre,small=false}){
  const gc=GENRES[genre]||GENRES['Electronic'];
  return(
    <span style={{
      display:'inline-flex',alignItems:'center',gap:3,
      padding:small?'2px 7px':'3px 9px',
      borderRadius:20,
      background:`${gc.color}18`,
      border:`1px solid ${gc.color}44`,
      fontSize:small?8:9,
      color:gc.color,
      fontWeight:700,
      letterSpacing:'.05em',
      whiteSpace:'nowrap',
    }}>
      <span style={{width:5,height:5,borderRadius:'50%',background:gc.color,display:'inline-block',flexShrink:0}}/>
      {gc.label}
    </span>
  );
}

/* ─── SCREEN HEADER ────────────────────────────────────────────────── */
function ScreenHeader({img,height=130,title,copy,extra}){
  return(
    <div style={{position:'relative',overflow:'hidden',flexShrink:0,height}}>
      <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center bottom',display:'block'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(8,12,24,.2) 0%,rgba(8,12,24,.5) 60%,var(--bg) 100%)'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 20px 16px'}}>
        {title&&(
          <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:28,letterSpacing:'-.02em',color:'#fff',lineHeight:1,marginBottom:copy?5:0,textShadow:'0 2px 16px rgba(0,0,0,.5)'}}>{title}</div>
        )}
        {copy&&<div style={{fontSize:12,color:'rgba(255,255,255,.4)',fontStyle:'italic',fontWeight:300,marginBottom:extra?8:0}}>{copy}</div>}
        {extra}
      </div>
    </div>
  );
}

/* ─── WEATHER PILL ─────────────────────────────────────────────────── */
function WeatherPill({weather}){
  if(!weather)return null;
  const icons={'Clear':'☀','Cloudy':'☁','Rain':'🌧','Snow':'❄','Showers':'🌦','Storm':'⛈'};
  return(
    <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:20,padding:'4px 10px',backdropFilter:'blur(8px)'}}>
      <span style={{fontSize:12}}>{icons[weather.cond]||'🌡'}</span>
      <span style={{fontFamily:'Space Mono,monospace',fontSize:11,color:'rgba(255,255,255,.7)',fontWeight:700}}>{weather.temp}°F</span>
      <span style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>{weather.cond}</span>
    </div>
  );
}

/* ─── BOTTOM NAV ───────────────────────────────────────────────────── */
function BottomNav({tab,setTab,phase}){
  const isLive=phase==='live';
  const TABS=[
    {id:'home',  icon:isLive?NAV_IC('nav-live'):NAV_IC('nav-home'),   label:'Home'},
    {id:'lineup',icon:NAV_IC('nav-schedule'),                          label:'Lineup'},
    {id:'mylist',icon:NAV_IC('nav-countdown'),                         label:'My Sets'},
    {id:'map',   icon:NAV_IC('nav-map'),                               label:'Map'},
    {id:'crew',  icon:NAV_IC('nav-kit'),                               label:'Crew'},
  ];
  return(
    <nav style={{
      position:'absolute',bottom:0,left:0,right:0,zIndex:100,
      background:'rgba(8,12,24,.97)',backdropFilter:'blur(28px)',
      borderTop:'1px solid rgba(255,255,255,.08)',
      display:'flex',
      paddingBottom:'env(safe-area-inset-bottom,16px)',
    }}>
      {TABS.map(t=>{
        const act=tab===t.id;
        return(
          <button key={t.id} onClick={()=>{hap(6);setTab(t.id);}} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',
            gap:3,paddingTop:10,paddingBottom:4,
            transition:'opacity .18s',opacity:act?1:.3,
          }}>
            <img src={t.icon} alt="" style={{
              width:26,height:26,objectFit:'contain',mixBlendMode:'screen',
              filter:act?`drop-shadow(0 0 10px #fc3cbf) brightness(1.3)`:'brightness(.7)',
              transition:'filter .18s',
            }}/>
            <span style={{fontSize:9,fontWeight:act?700:500,letterSpacing:'.07em',textTransform:'uppercase',color:act?'#fff':'rgba(255,255,255,.3)',fontFamily:'DM Sans,sans-serif'}}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── SET CARD ─────────────────────────────────────────────────────── */
function SetCard({set,selected,onToggle,recon,sharedIds,compact=false}){
  const sc=STAGE_CFG[set.stage];
  const isSel=selected.includes(set.id);
  const rec=recon[set.id]||set;
  const isShared=sharedIds?.includes(set.id);
  const pip=isShared&&!isSel;
  const both=isShared&&isSel;

  return(
    <div onClick={()=>onToggle(set.id)} style={{
      background:isSel?`linear-gradient(135deg,${sc.p}22,rgba(13,18,36,.98))`:'rgba(255,255,255,.04)',
      border:`1px solid ${isSel?sc.p+'77':'rgba(255,255,255,.08)'}`,
      borderRadius:16,
      padding:'13px 14px',
      marginBottom:8,
      display:'flex',gap:12,alignItems:'flex-start',
      cursor:'pointer',
      transition:'all .14s',
      boxShadow:isSel?`0 4px 28px ${sc.p}28`:'none',
    }}>
      {/* Stage icon block */}
      <div style={{
        width:54,height:54,flexShrink:0,
        background:isSel?`${sc.p}22`:'rgba(255,255,255,.06)',
        border:`1px solid ${isSel?sc.p+'55':'rgba(255,255,255,.1)'}`,
        borderRadius:12,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:isSel?`0 0 16px ${sc.p}44`:'none',
      }}>
        <img src={SI(sc.key)} alt={sc.label} style={{width:34,height:34,objectFit:'contain',mixBlendMode:'screen'}}/>
      </div>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        {/* Live dot + time */}
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
          <span className="mono" style={{fontSize:10,color:isSel?sc.s:'rgba(255,255,255,.4)'}}>{fmtT(set.s)}</span>
          <span style={{fontSize:9,color:'rgba(255,255,255,.18)'}}>–</span>
          <span className="mono" style={{fontSize:10,color:'rgba(255,255,255,.28)'}}>{fmtT(set.e)}</span>
        </div>

        {/* Artist name */}
        <ArtistName name={set.artist} size={compact?14:16} color={isSel?'#fff':'rgba(255,255,255,.85)'}/>

        {/* Stage wordmark + genre */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}>
          <img src={WM(sc.key)} alt={sc.label} style={{height:13,objectFit:'contain',objectPosition:'left',mixBlendMode:'screen',maxWidth:90}}/>
          <GenrePill genre={set.g} small/>
        </div>

        {/* Catch window */}
        {isSel&&(
          <div style={{marginTop:8,paddingTop:7,borderTop:`1px solid ${sc.p}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <span className="mono" style={{fontSize:8.5,color:'rgba(255,255,255,.3)',letterSpacing:'.06em'}}>CATCH</span>
              <span className="mono" style={{fontSize:8.5,color:sc.s,fontWeight:700}}>{fmtT(rec.cs)} – {fmtT(rec.ce)}</span>
              {rec.trimmed&&<span style={{fontSize:8,color:sc.s,background:`${sc.s}18`,borderRadius:4,padding:'1px 6px'}}>−{rec.trimMin}m</span>}
              {rec.conflict&&<span style={{fontSize:8,color:'#ff5555',background:'rgba(255,85,85,.12)',borderRadius:4,padding:'1px 6px',display:'flex',alignItems:'center',gap:3}}>
                <img src={ACT_IC('action-alert')} alt="" style={{width:10,height:10,mixBlendMode:'screen'}}/>conflict
              </span>}
            </div>
          </div>
        )}
      </div>

      {/* Selector / pip */}
      <div style={{
        width:26,height:26,borderRadius:'50%',flexShrink:0,marginTop:2,
        background:isSel?sc.p:pip?`${sc.p}22`:'rgba(255,255,255,.07)',
        border:`2px solid ${isSel?sc.p:pip?sc.p:'rgba(255,255,255,.12)'}`,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:isSel?`0 0 16px ${sc.p}88`:'none',
        transition:'all .14s',
      }}>
        {isSel&&<span style={{fontSize:13,color:'#000',fontWeight:900,lineHeight:1}}>✓</span>}
        {pip&&<span style={{width:8,height:8,borderRadius:'50%',background:sc.p,display:'block'}}/>}
      </div>
    </div>
  );
}

/* ─── HOME SCREEN ──────────────────────────────────────────────────── */
function HomeScreen({selected,toggleSet,recon,sharedIds,weather}){
  const now=useClock();
  const phase=getFestPhase(now);
  if(phase.phase==='pre')return<HomeCountdown now={now} selected={selected} weather={weather}/>;
  if(phase.phase==='live')return<HomeLive now={now} day={phase.day} dayStart={phase.dayStart} selected={selected} toggleSet={toggleSet} recon={recon} sharedIds={sharedIds} weather={weather}/>;
  if(phase.phase==='inter')return<HomeInter nextDay={phase.nextDay} nextStart={phase.nextStart} now={now}/>;
  return<HomePost selected={selected}/>;
}

/* ─── HOME COUNTDOWN ───────────────────────────────────────────────── */
function HomeCountdown({now,selected,weather}){
  const target=DAY_STARTS[0].getTime();
  const diff=Math.max(0,target-now);
  const dd=Math.floor(diff/86400000);
  const hh=Math.floor((diff%86400000)/3600000);
  const mm=Math.floor((diff%3600000)/60000);
  const ss=Math.floor((diff%60000)/1000);
  const pad=n=>String(n).padStart(2,'0');
  const showCTA=diff<7*86400000; // under 7 days

  // Gradient colors per unit cycling through stage palette
  const unitColors=[STAGE_CFG.kineticFIELD.p,STAGE_CFG.circuitGROUNDS.p,STAGE_CFG.cosmicMEADOW.p,STAGE_CFG.bionicJungle.p];

  const units=dd>0
    ?[{v:pad(dd),l:'DAYS',c:unitColors[0]},{v:pad(hh),l:'HRS',c:unitColors[1]},{v:pad(mm),l:'MIN',c:unitColors[2]},{v:pad(ss),l:'SEC',c:unitColors[3]}]
    :[{v:pad(hh),l:'HRS',c:unitColors[0]},{v:pad(mm),l:'MIN',c:unitColors[1]},{v:pad(ss),l:'SEC',c:unitColors[2]}];

  return(
    <div style={{flex:1,overflowY:'auto',paddingBottom:88,background:'var(--bg)'}}>
      {/* Hero */}
      <div style={{position:'relative',overflow:'hidden',height:220}}>
        <img src={H('header-home-pre.webp')} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(8,12,24,.1) 0%,rgba(8,12,24,.95) 100%)'}}/>
        <div style={{position:'absolute',bottom:16,left:20,right:20,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div>
            <img src={A('edc-logo.webp')} alt="EDC" style={{height:36,marginBottom:6,filter:'drop-shadow(0 0 12px rgba(252,60,191,.5))'}}/>
            <div style={{fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.22em',textTransform:'uppercase'}}>Las Vegas · May 15–17</div>
          </div>
          <WeatherPill weather={weather}/>
        </div>
      </div>

      <div style={{padding:'0 20px'}}>
        {/* Countdown units stacked */}
        <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:22,padding:'24px 20px',marginBottom:20,marginTop:8}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.24em',textTransform:'uppercase',textAlign:'center',marginBottom:20}}>Gates Open In</div>
          <div style={{display:'flex',justifyContent:'center',gap:dd>0?10:16}}>
            {units.map(({v,l,c},i)=>(
              <div key={l} style={{textAlign:'center',flex:1,maxWidth:80}}>
                <div style={{
                  fontFamily:'Sora,sans-serif',fontWeight:800,
                  fontSize:dd>0?52:64,
                  color:c,lineHeight:.9,
                  textShadow:`0 0 30px ${c}88,0 0 60px ${c}44`,
                  letterSpacing:'-.03em',
                }}>{v}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.3)',letterSpacing:'.18em',marginTop:8,fontFamily:'DM Sans,sans-serif',fontWeight:600}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Italic vibe copy */}
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontStyle:'italic',color:'rgba(255,255,255,.35)',fontSize:13,fontWeight:300}}>{COPY.homePre}</div>
        </div>

        {/* CTA cards — shown when close */}
        {showCTA&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.2em',textTransform:'uppercase',textAlign:'center',marginBottom:12}}>{COPY.ctaPre}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {/* Lineup CTA */}
              <div style={{position:'relative',borderRadius:16,overflow:'hidden',cursor:'pointer',border:`1px solid ${STAGE_CFG.kineticFIELD.p}33`}}
                onClick={()=>window.__setTab&&window.__setTab('lineup')}>
                <img src={H('header-byday.webp')} alt="" style={{width:'100%',height:90,objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent,rgba(8,12,24,.9))'}}/>
                <div style={{position:'absolute',bottom:10,left:10,right:10}}>
                  <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:13,color:'#fff',marginBottom:2}}>Plan Your Night</div>
                  <div style={{fontSize:10,color:STAGE_CFG.kineticFIELD.p,display:'flex',alignItems:'center',gap:4}}>Browse lineup →</div>
                </div>
              </div>
              {/* My Sets CTA */}
              <div style={{position:'relative',borderRadius:16,overflow:'hidden',cursor:'pointer',border:`1px solid ${STAGE_CFG.cosmicMEADOW.p}33`}}
                onClick={()=>window.__setTab&&window.__setTab('mylist')}>
                <img src={H('header-export.webp')} alt="" style={{width:'100%',height:90,objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent,rgba(8,12,24,.9))'}}/>
                <div style={{position:'absolute',bottom:10,left:10,right:10}}>
                  <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:13,color:'#fff',marginBottom:2}}>My Sets</div>
                  <div style={{fontSize:10,color:STAGE_CFG.cosmicMEADOW.p,display:'flex',alignItems:'center',gap:4}}>Export →</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lineup teaser */}
        {selected.length>0&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:16}}>My Lineup</div>
              <div style={{fontSize:11,color:STAGE_CFG.kineticFIELD.p,fontWeight:600}}>{selected.length} sets</div>
            </div>
            {[1,2,3].map(dn=>{
              const dSets=SCHEDULE.filter(s=>selected.includes(s.id)&&s.day===dn).sort((a,b)=>toM(a.s)-toM(b.s));
              if(!dSets.length)return null;
              return(
                <div key={dn} style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.2)',letterSpacing:'.16em',textTransform:'uppercase',marginBottom:7}}>{DAYS_LABEL[dn-1].toUpperCase()}</div>
                  {dSets.slice(0,2).map(s=>{
                    const sc=STAGE_CFG[s.stage];
                    return(
                      <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                        <img src={SI(sc.key)} alt="" style={{width:22,height:22,objectFit:'contain',mixBlendMode:'screen',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <ArtistName name={s.artist} size={12}/>
                          <img src={WM(sc.key)} alt="" style={{height:11,objectFit:'contain',objectPosition:'left',mixBlendMode:'screen',marginTop:2}}/>
                        </div>
                        <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.3)',flexShrink:0}}>{fmtT(s.s)}</span>
                      </div>
                    );
                  })}
                  {dSets.length>2&&<div style={{fontSize:10,color:'rgba(255,255,255,.18)',textAlign:'center',paddingTop:5}}>+{dSets.length-2} more</div>}
                </div>
              );
            })}
          </div>
        )}
        {selected.length===0&&!showCTA&&(
          <div style={{textAlign:'center',padding:'24px 0',color:'rgba(255,255,255,.2)',fontSize:13,fontStyle:'italic'}}>Head to Lineup to build your night →</div>
        )}
      </div>
    </div>
  );
}

/* ─── HOME LIVE ────────────────────────────────────────────────────── */
function HomeLive({now,day,dayStart,selected,toggleSet,recon,sharedIds,weather}){
  const[expandedId,setExpandedId]=React.useState(null);
  const[stageFilter,setStageFilter]=React.useState('ALL');
  const{playing,upcoming,festMin}=getLiveData(day,dayStart,selected,now);

  const myNow=playing.find(s=>selected.includes(s.id));
  const myNext=SCHEDULE.filter(s=>s.day===day&&selected.includes(s.id)&&toM(s.s)>festMin).sort((a,b)=>toM(a.s)-toM(b.s))[0]||null;
  const heroSet=myNow||(playing[0]||null);
  const heroSc=heroSet?STAGE_CFG[heroSet.stage]:STAGE_CFG.kineticFIELD;

  let pct=0,endsInSecs=0;
  if(heroSet){
    const sm=toM(heroSet.s),em=toM(heroSet.e);
    pct=Math.min(100,Math.max(0,Math.round((festMin-sm)/(em-sm)*100)));
    endsInSecs=Math.max(0,Math.round((em-festMin)*60));
  }

  const othersNow=playing.filter(s=>s.id!==heroSet?.id).filter(s=>stageFilter==='ALL'||STAGE_CFG[s.stage]?.short===stageFilter);
  const {val:endsVal,sub:endsSub}=fmtEndsIn(endsInSecs);

  // Leave-by
  let leaveBy=null;
  if(myNext&&myNow){
    const leaveMs=dayStart.getTime()+(toM(myNext.s)-5-17*60)*60000;
    const diffMs=Math.max(0,leaveMs-now);
    const lm=Math.floor(diffMs/60000),ls=Math.floor((diffMs%60000)/1000);
    leaveBy=diffMs<300000?`${lm}:${String(ls).padStart(2,'0')}`:`${lm}m`;
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Hero */}
      <div style={{position:'relative',overflow:'hidden',flexShrink:0}}>
        <img src={heroSet?A(`${heroSc.key}-backdrop.webp`):H('header-home-live.webp')} alt=""
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',mixBlendMode:'lighten',opacity:.65}}/>
        <div style={{position:'absolute',inset:0,background:`linear-gradient(180deg,rgba(8,12,24,.35) 0%,rgba(8,12,24,0) 30%,rgba(8,12,24,.9) 100%)`}}/>
        {heroSet&&<div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse 100% 50% at 50% 0%,${heroSc.p}24,transparent 65%)`}}/>}

        <div style={{position:'relative',padding:'50px 20px 18px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,45,120,.1)',border:'1px solid rgba(255,45,120,.3)',borderRadius:20,padding:'5px 13px'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#ff2d78',boxShadow:'0 0 10px #ff2d78',animation:'pulse 2s infinite'}}/>
                <span style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:11,color:'#ff2d78',letterSpacing:'.1em'}}>LIVE</span>
              </div>
              <span style={{fontSize:11,color:'rgba(255,255,255,.3)',fontFamily:'DM Sans,sans-serif'}}>{DAYS_SHORT[day-1]}</span>
            </div>
            <WeatherPill weather={weather}/>
          </div>

          {heroSet&&(
            <>
              <img src={WM(heroSc.key)} alt={heroSc.label} style={{height:16,objectFit:'contain',objectPosition:'left',mixBlendMode:'screen',marginBottom:10}}/>
              <ArtistName name={heroSet.artist} size={32} color='#fff'/>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8,marginBottom:14}}>
                <span className="mono" style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{fmtT(heroSet.s)} – {fmtT(heroSet.e)}</span>
                <GenrePill genre={heroSet.g} small/>
              </div>
              {/* Progress + ENDS IN */}
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div style={{height:6,borderRadius:3,background:'rgba(255,255,255,.1)',overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${heroSc.p}88,${heroSc.p})`,boxShadow:`0 0 14px ${heroSc.p}`,borderRadius:3,transition:'width 1s linear'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                    <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.25)'}}>{fmtT(heroSet.s)}</span>
                    <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.25)'}}>{fmtT(heroSet.e)}</span>
                  </div>
                </div>
                <div style={{background:`${heroSc.p}12`,border:`1.5px solid ${heroSc.p}66`,borderRadius:12,padding:'8px 14px',textAlign:'center',flexShrink:0}}>
                  <div style={{fontSize:8,color:heroSc.p,letterSpacing:'.12em',marginBottom:2,fontWeight:700}}>ENDS IN</div>
                  <div className="mono" style={{fontWeight:700,fontSize:18,color:'#fff',lineHeight:1}}>{endsVal}</div>
                  <div style={{fontSize:7,color:'rgba(255,255,255,.25)',letterSpacing:'.1em',marginTop:2}}>{endsSub}</div>
                </div>
              </div>
            </>
          )}

          {!heroSet&&(
            <div style={{paddingTop:10,paddingBottom:10}}>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:36,color:'rgba(255,255,255,.15)',marginBottom:6}}>LIVE</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.3)',fontStyle:'italic'}}>{COPY.homeLive}</div>
            </div>
          )}
        </div>
      </div>

      {/* Also live — scrollable */}
      <div style={{flex:1,overflowY:'auto',paddingBottom:88}}>
        {/* Up next */}
        {myNext&&(
          <div style={{margin:'12px 16px 0',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:16,padding:'13px 14px'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.22)',letterSpacing:'.16em',textTransform:'uppercase',marginBottom:10}}>Up Next · Your Schedule</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <ArtistName name={myNext.artist} size={16}/>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:5}}>
                  <img src={WM(STAGE_CFG[myNext.stage].key)} alt="" style={{height:12,objectFit:'contain',mixBlendMode:'screen'}}/>
                  <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.35)'}}>{fmtT(myNext.s)}</span>
                </div>
              </div>
              {leaveBy&&(
                <div style={{background:`${STAGE_CFG.kineticFIELD.p}14`,borderRadius:12,padding:'10px 14px',border:`1px solid ${STAGE_CFG.kineticFIELD.p}22`,flexShrink:0,textAlign:'center'}}>
                  <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:22,color:STAGE_CFG.kineticFIELD.p,lineHeight:1}}>{leaveBy}</div>
                  <div style={{fontSize:8,color:'rgba(255,255,255,.28)',letterSpacing:'.1em',textTransform:'uppercase',marginTop:3}}>leave by</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage filter pills */}
        {playing.length>1&&(
          <div style={{display:'flex',gap:6,overflowX:'auto',padding:'12px 16px 0',paddingBottom:0}}>
            {['ALL',...playing.map(s=>STAGE_CFG[s.stage]?.short).filter((v,i,a)=>a.indexOf(v)===i)].map(f=>{
              const act=stageFilter===f;
              const stageKey=Object.keys(STAGE_CFG).find(k=>STAGE_CFG[k].short===f);
              const color=stageKey?STAGE_CFG[stageKey].p:'#fc3cbf';
              return(
                <button key={f} onClick={()=>setStageFilter(f)} style={{
                  flexShrink:0,padding:'5px 12px',borderRadius:20,fontSize:10,fontWeight:700,
                  background:act?`${color}22`:'rgba(255,255,255,.05)',
                  border:`1px solid ${act?color:'rgba(255,255,255,.1)'}`,
                  color:act?color:'rgba(255,255,255,.4)',
                  letterSpacing:'.05em',
                }}>{f==='ALL'?'ALL STAGES':f}</button>
              );
            })}
          </div>
        )}

        {/* Also live header */}
        {othersNow.length>0&&(
          <div style={{padding:'12px 16px 4px'}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.22)',letterSpacing:'.16em',textTransform:'uppercase'}}>Also Live Now</div>
          </div>
        )}

        {/* Compact cards strip with tap-to-expand (Option C) */}
        {othersNow.length>0&&(
          <div style={{padding:'8px 16px 0'}}>
            {othersNow.map(s=>{
              const sc2=STAGE_CFG[s.stage];
              const isExpanded=expandedId===s.id;
              const sm=toM(s.s),em=toM(s.e);
              const spct=Math.min(100,Math.max(0,Math.round((festMin-sm)/(em-sm)*100)));
              const secs=Math.max(0,Math.round((em-festMin)*60));
              const{val:sv,sub:ss2}=fmtEndsIn(secs);

              if(isExpanded){
                // Full expanded card
                return(
                  <div key={s.id} onClick={()=>setExpandedId(null)}
                    style={{background:`linear-gradient(135deg,${sc2.p}1a,rgba(13,18,36,.98))`,border:`1px solid ${sc2.p}55`,borderRadius:16,padding:'14px',marginBottom:10,cursor:'pointer',animation:'fadeUp .2s ease'}}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:60,flexShrink:0,background:`${sc2.p}18`,border:`1px solid ${sc2.p}44`,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'8px 4px',minHeight:70}}>
                        <img src={SI(sc2.key)} alt="" style={{width:32,height:32,objectFit:'contain',mixBlendMode:'screen'}}/>
                        <div style={{fontSize:7,color:sc2.p,fontWeight:700,textAlign:'center',letterSpacing:'.04em'}}>{sc2.short}</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:sc2.p,boxShadow:`0 0 8px ${sc2.p}`,animation:'pulse 2s infinite'}}/>
                          <span style={{fontSize:10,color:sc2.p,fontWeight:700,letterSpacing:'.1em'}}>LIVE NOW</span>
                          <GenrePill genre={s.g} small/>
                        </div>
                        <ArtistName name={s.artist} size={20} color='#fff'/>
                        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,marginBottom:4}}>
                          <span className="mono" style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{fmtT(s.s)}</span>
                          <span className="mono" style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>{fmtT(s.e)}</span>
                        </div>
                        <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
                          <div style={{width:`${spct}%`,height:'100%',background:`linear-gradient(90deg,${sc2.p}88,${sc2.p})`,boxShadow:`0 0 10px ${sc2.p}`,borderRadius:3}}/>
                        </div>
                      </div>
                      <div style={{flexShrink:0,background:`${sc2.p}10`,border:`1.5px solid ${sc2.p}66`,borderRadius:12,padding:'9px 10px',textAlign:'center',minWidth:80}}>
                        <div style={{fontSize:8,color:sc2.p,letterSpacing:'.1em',marginBottom:3,fontWeight:700}}>ENDS IN</div>
                        <div className="mono" style={{fontWeight:700,fontSize:sv.length>5?15:20,color:'#fff',lineHeight:1}}>{sv}</div>
                        <div style={{fontSize:6.5,color:'rgba(255,255,255,.25)',letterSpacing:'.08em',marginTop:2}}>{ss2}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Compact card
              return(
                <div key={s.id} onClick={()=>setExpandedId(s.id)}
                  style={{display:'inline-flex',flexDirection:'column',gap:6,width:120,verticalAlign:'top',marginRight:8,marginBottom:8,background:`linear-gradient(160deg,${sc2.p}16,rgba(13,18,36,.95))`,border:`1px solid ${sc2.p}44`,borderTop:`2px solid ${sc2.p}`,borderRadius:14,padding:'11px 10px',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <img src={SI(sc2.key)} alt="" style={{width:22,height:22,objectFit:'contain',mixBlendMode:'screen',flexShrink:0}}/>
                    <span style={{fontSize:8,color:sc2.p,fontWeight:700,letterSpacing:'.04em'}}>{sc2.short}</span>
                  </div>
                  <ArtistName name={s.artist} size={11} color='rgba(255,255,255,.9)'/>
                  <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
                    <div style={{width:`${spct}%`,height:'100%',background:`linear-gradient(90deg,${sc2.p}66,${sc2.p})`,boxShadow:`0 0 6px ${sc2.p}`}}/>
                  </div>
                  <div style={{background:`${sc2.p}12`,border:`1px solid ${sc2.p}33`,borderRadius:8,padding:'4px 5px',textAlign:'center'}}>
                    <div style={{fontSize:7.5,color:sc2.p,letterSpacing:'.08em',marginBottom:1,fontWeight:700}}>ENDS IN</div>
                    <div className="mono" style={{fontWeight:700,fontSize:12,color:'#fff',lineHeight:1}}>{sv}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {playing.length===0&&(
          <div style={{padding:'32px 20px',textAlign:'center',color:'rgba(255,255,255,.2)',fontSize:13,fontStyle:'italic'}}>No sets playing right now</div>
        )}
      </div>
    </div>
  );
}

function HomeInter({nextDay,nextStart,now}){
  const diff=Math.max(0,nextStart-now);
  const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  const pad=n=>String(n).padStart(2,'0');
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',paddingBottom:88}}>
      <div style={{position:'relative',height:180,overflow:'hidden',flexShrink:0}}>
        <img src={H('header-home-live.webp')} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent,var(--bg))'}}/>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 20px'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,.25)',letterSpacing:'.22em',textTransform:'uppercase',marginBottom:18}}>{DAYS_LABEL[nextDay-2]} Starts In</div>
        <div style={{display:'flex',gap:14}}>
          {[{v:pad(h),l:'HRS',c:STAGE_CFG.kineticFIELD.p},{v:pad(m),l:'MIN',c:STAGE_CFG.circuitGROUNDS.p},{v:pad(s),l:'SEC',c:STAGE_CFG.cosmicMEADOW.p}].map(({v,l,c})=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:48,color:c,textShadow:`0 0 20px ${c}`,lineHeight:1}}>{v}</div>
              <div className="mono" style={{fontSize:8,color:'rgba(255,255,255,.22)',letterSpacing:'.14em',marginTop:5}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomePost({selected}){
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',paddingBottom:88}}>
      <div style={{position:'relative',height:200,overflow:'hidden',flexShrink:0}}>
        <img src={H('header-home-pre.webp')} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.4}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent,var(--bg))'}}/>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px'}}>
        <div style={{fontFamily:'Sora,sans-serif',fontSize:24,fontWeight:800,marginBottom:10,color:'rgba(255,255,255,.5)',textAlign:'center'}}>See you next year</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.25)',textAlign:'center',marginBottom:6}}>EDC Las Vegas 2026 · {selected.length} sets caught</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,.2)',fontStyle:'italic'}}>what a night.</div>
      </div>
    </div>
  );
}
