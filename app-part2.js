/* ─── SEARCH WITH AUTO-SUGGEST ──────────────────────────────────────── */
function SearchBar({value,onChange,onSelect,allSets}){
  const[open,setOpen]=React.useState(false);
  const suggestions=React.useMemo(()=>{
    if(!value.trim()||value.length<2)return[];
    const q=value.toLowerCase();
    const matches=allSets.filter(s=>s.artist.toLowerCase().includes(q)||STAGE_CFG[s.stage]?.label.toLowerCase().includes(q)||s.g.toLowerCase().includes(q));
    // Dedupe by artist name
    const seen=new Set();
    return matches.filter(s=>{if(seen.has(s.artist))return false;seen.add(s.artist);return true;}).slice(0,6);
  },[value,allSets]);

  React.useEffect(()=>{setOpen(suggestions.length>0);},[suggestions]);

  return(
    <div style={{position:'relative',zIndex:50}}>
      <div style={{position:'relative'}}>
        <img src={ACT_IC('action-search')} alt="" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:16,height:16,mixBlendMode:'screen',opacity:.5,pointerEvents:'none'}}/>
        <input
          value={value}
          onChange={e=>{onChange(e.target.value);}}
          onFocus={()=>setOpen(suggestions.length>0)}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          placeholder="Search artists, stages, genres…"
          style={{width:'100%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',borderRadius:12,padding:'10px 36px 10px 36px',color:'#fff',fontSize:14,outline:'none',fontFamily:'DM Sans,sans-serif'}}
        />
        {value&&<button onClick={()=>{onChange('');setOpen(false);}} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:18,opacity:.4,padding:4,color:'#fff'}}>×</button>}
      </div>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'rgba(13,18,36,.98)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          {suggestions.map(s=>{
            const sc=STAGE_CFG[s.stage];
            return(
              <div key={s.id} onMouseDown={()=>{onSelect(s);setOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.05)',transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <img src={SI(sc.key)} alt="" style={{width:24,height:24,objectFit:'contain',mixBlendMode:'screen',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.artist}</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginTop:2}}>
                    <img src={WM(sc.key)} alt="" style={{height:10,objectFit:'contain',mixBlendMode:'screen'}}/>
                    <GenrePill genre={s.g} small/>
                  </div>
                </div>
                <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.3)',flexShrink:0}}>{fmtT(s.s)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── LINEUP SCREEN ─────────────────────────────────────────────────── */
function LineupScreen({selected,toggleSet,recon,sharedIds}){
  const[view,setView]=React.useState('byday');
  const[day,setDay]=React.useState(1);
  const[search,setSearch]=React.useState('');
  const[genreFilter,setGenreFilter]=React.useState('ALL');
  const[scrollTarget,setScrollTarget]=React.useState(null);
  const now=useClock();
  const phase=getFestPhase(now);
  const nowDay=phase.phase==='live'?phase.day:null;

  const allMainSets=React.useMemo(()=>SCHEDULE.filter(s=>MAIN_STAGES.includes(s.stage)),[]);

  const filteredSets=React.useMemo(()=>{
    let sets=allMainSets;
    if(search.trim()){const q=search.toLowerCase();sets=sets.filter(s=>s.artist.toLowerCase().includes(q)||STAGE_CFG[s.stage]?.label.toLowerCase().includes(q)||s.g.toLowerCase().includes(q));}
    if(genreFilter!=='ALL')sets=sets.filter(s=>s.g===genreFilter);
    return sets;
  },[search,genreFilter,allMainSets]);

  const displaySets=React.useMemo(()=>{
    if(view==='alpha')return[...filteredSets].sort((a,b)=>a.artist.localeCompare(b.artist));
    if(view==='grid')return filteredSets;
    return filteredSets.filter(s=>s.day===day).sort((a,b)=>toM(a.s)-toM(b.s));
  },[filteredSets,view,day]);

  function handleSuggestSelect(set){
    setSearch('');
    setView('byday');
    setDay(set.day);
    setScrollTarget(set.id);
  }

  const allGenres=['ALL',...Object.keys(GENRES)];
  const headerImg=view==='grid'?H('header-grid.webp'):view==='alpha'?H('header-schedule.webp'):H('header-byday.webp');

  if(view==='grid')return(
    <GridView selected={selected} toggleSet={toggleSet} recon={recon} sharedIds={sharedIds}
      onBack={()=>setView('byday')} search={search} setSearch={setSearch} onSuggestSelect={handleSuggestSelect} allMainSets={allMainSets}/>
  );

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Header */}
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={headerImg} height={120} title="LINEUP" copy={COPY.schedule}/>
        <div style={{padding:'0 16px 0'}}>
          {/* Search */}
          <div style={{marginBottom:10}}>
            <SearchBar value={search} onChange={setSearch} onSelect={handleSuggestSelect} allSets={allMainSets}/>
          </div>
          {/* View pills */}
          <div style={{display:'flex',gap:6,marginBottom:10,alignItems:'center'}}>
            {[['byday','By Day'],['alpha','A–Z'],['grid','Grid']].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:'6px 14px',borderRadius:20,fontWeight:700,fontSize:11,
                background:view===v?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.07)',
                color:view===v?'#000':'rgba(255,255,255,.5)',
                boxShadow:view===v?`0 0 16px ${STAGE_CFG.kineticFIELD.p}55`:'none',
                letterSpacing:'.04em',
              }}>{l}</button>
            ))}
            {view==='byday'&&(
              <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                {[['Fri',1],['Sat',2],['Sun',3]].map(([l,d])=>(
                  <button key={d} onClick={()=>setDay(d)} style={{
                    padding:'5px 12px',borderRadius:16,fontWeight:600,fontSize:11,
                    background:day===d?'rgba(255,255,255,.12)':'transparent',
                    color:day===d?'#fff':'rgba(255,255,255,.3)',
                    border:day===d?'1px solid rgba(255,255,255,.2)':'1px solid transparent',
                    position:'relative',
                  }}>
                    {l}
                    {nowDay===d&&<span style={{position:'absolute',top:0,right:0,width:6,height:6,borderRadius:'50%',background:'#ff2d78',boxShadow:'0 0 6px #ff2d78'}}/>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Genre filter */}
          <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:10}}>
            {allGenres.map(g=>{
              const act=genreFilter===g;
              const gc=GENRES[g];
              const color=gc?gc.color:'#fc3cbf';
              return(
                <button key={g} onClick={()=>setGenreFilter(g)} style={{
                  flexShrink:0,padding:'4px 11px',borderRadius:20,fontSize:9.5,fontWeight:700,letterSpacing:'.04em',
                  background:act?`${color}22`:'rgba(255,255,255,.05)',
                  border:`1px solid ${act?color:'rgba(255,255,255,.1)'}`,
                  color:act?color:'rgba(255,255,255,.35)',
                  display:'flex',alignItems:'center',gap:5,
                }}>
                  {gc&&<span style={{width:6,height:6,borderRadius:'50%',background:color,display:'inline-block'}}/>}
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sets list */}
      <div style={{flex:1,overflowY:'auto',padding:'6px 16px 104px'}}>
        {displaySets.length===0&&(
          <div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,.2)',fontSize:13,fontStyle:'italic'}}>
            {search||genreFilter!=='ALL'?'No artists match.':'Nothing here.'}
          </div>
        )}
        {displaySets.map(s=>(
          <SetCard key={s.id} set={s} selected={selected} onToggle={toggleSet} recon={recon} sharedIds={sharedIds}/>
        ))}
      </div>
    </div>
  );
}

/* ─── GRID VIEW ─────────────────────────────────────────────────────── */
function GridView({selected,toggleSet,recon,sharedIds,onBack,search,setSearch,onSuggestSelect,allMainSets}){
  const[day,setDay]=React.useState(1);
  const now=useClock();
  const phase=getFestPhase(now);

  // Horizontal grid: stages = rows (left col), time = columns (top row)
  const ROW_H=72, LCOL=68, TCOL=44, HOUR_W=80;
  const FEST_START=17*60, FEST_END=29*60+30;
  const TOTAL_MINS=FEST_END-FEST_START;
  const TOTAL_W=Math.ceil(TOTAL_MINS/60)*HOUR_W;
  const hours=[];for(let h=17;h<30;h++)hours.push(h);

  const daySets=React.useMemo(()=>SCHEDULE.filter(s=>s.day===day&&MAIN_STAGES.includes(s.stage)),[day]);

  let nowX=null;
  if(phase.phase==='live'&&phase.day===day){
    const elapsed=(now-phase.dayStart.getTime())/60000;
    nowX=((17*60+elapsed-FEST_START)/TOTAL_MINS)*TOTAL_W;
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={H('header-grid.webp')} height={120} title="GRID" copy={COPY.grid}
          extra={
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <button onClick={onBack} style={{opacity:.5,fontSize:13,padding:'3px 6px',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,color:'#fff',background:'rgba(255,255,255,.06)',marginRight:4}}>← Lineup</button>
              {[['Fri',1],['Sat',2],['Sun',3]].map(([l,d])=>(
                <button key={d} onClick={()=>setDay(d)} style={{
                  padding:'5px 14px',borderRadius:16,fontWeight:700,fontSize:11,
                  background:day===d?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.07)',
                  color:day===d?'#000':'rgba(255,255,255,.4)',
                }}>{l}</button>
              ))}
            </div>
          }
        />
      </div>

      {/* Scrollable grid */}
      <div style={{flex:1,overflow:'auto'}}>
        <div style={{minWidth:LCOL+TCOL+TOTAL_W+40}}>
          {/* Top-left corner + time header */}
          <div style={{display:'flex',position:'sticky',top:0,zIndex:30,background:'rgba(8,12,24,.98)'}}>
            <div style={{width:LCOL+TCOL,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.07)',borderBottom:'1px solid rgba(255,255,255,.07)'}}/>
            <div style={{position:'relative',flex:1,display:'flex'}}>
              {hours.map(h=>(
                <div key={h} style={{width:HOUR_W,flexShrink:0,padding:'8px 0',textAlign:'center',borderRight:'1px solid rgba(255,255,255,.04)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
                  <span className="mono" style={{fontSize:9,color:'rgba(255,255,255,.3)'}}>{h>=24?(h-24)+':00':h+':00'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage rows */}
          {MAIN_STAGES.map((sg,ri)=>{
            const sc=STAGE_CFG[sg];
            const stageSets=daySets.filter(s=>s.stage===sg);
            return(
              <div key={sg} style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,.05)',minHeight:ROW_H}}>
                {/* Stage label col */}
                <div style={{width:LCOL,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,padding:'8px 4px',borderRight:'1px solid rgba(255,255,255,.07)',background:'rgba(8,12,24,.7)',position:'sticky',left:0,zIndex:10}}>
                  <img src={SI(sc.key)} alt={sc.label} style={{width:28,height:28,objectFit:'contain',mixBlendMode:'screen'}}/>
                  <div style={{fontSize:7,color:sc.p,fontWeight:700,textAlign:'center',letterSpacing:'.04em'}}>{sc.short}</div>
                </div>
                {/* Timeline col */}
                <div style={{width:TCOL,flexShrink:0,borderRight:'1px solid rgba(255,255,255,.05)',background:'rgba(8,12,24,.5)',position:'sticky',left:LCOL,zIndex:9}}/>
                {/* Set blocks */}
                <div style={{position:'relative',flex:1,minHeight:ROW_H}}>
                  {/* Hour grid lines */}
                  {hours.map(h=>(
                    <div key={h} style={{position:'absolute',left:(h*60-FEST_START)/TOTAL_MINS*TOTAL_W,top:0,bottom:0,width:1,background:'rgba(255,255,255,.04)'}}/>
                  ))}
                  {/* NOW line */}
                  {nowX!==null&&<div style={{position:'absolute',left:nowX,top:0,bottom:0,width:2,background:'#ff2d78',boxShadow:'0 0 8px #ff2d78',zIndex:20}}/>}
                  {/* Set blocks */}
                  {stageSets.map(s=>{
                    const isSel=selected.includes(s.id);
                    const isShared=sharedIds?.includes(s.id);
                    const rec=recon[s.id]||s;
                    const left=((toM(s.s)-FEST_START)/TOTAL_MINS)*TOTAL_W;
                    const width=Math.max(((toM(s.e)-toM(s.s))/TOTAL_MINS)*TOTAL_W-2,30);
                    return(
                      <div key={s.id} onClick={()=>toggleSet(s.id)} style={{
                        position:'absolute',
                        left,width,top:6,bottom:6,
                        background:isSel?`${sc.p}2e`:`${sc.p}0e`,
                        border:`1px solid ${isSel?sc.p+'77':sc.p+'22'}`,
                        borderTop:`3px solid ${isSel?sc.p:sc.p+'55'}`,
                        borderRadius:8,padding:'5px 7px',overflow:'hidden',cursor:'pointer',
                        boxShadow:isSel?`0 0 18px ${sc.p}44,inset 0 0 12px ${sc.p}08`:'none',
                        transition:'all .14s',
                      }}>
                        <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:9,color:isSel?'#fff':'rgba(255,255,255,.65)',lineHeight:1.2,marginBottom:3}}>
                          {s.artist.replace(/\s+B2B\s+/g,' B2B ').split(' B2B ').map((part,i,arr)=>(
                            <span key={i} style={{display:'block'}}>
                              {part}{i<arr.length-1&&<span style={{fontSize:6.5,opacity:.5,marginLeft:2}}>B2B</span>}
                            </span>
                          ))}
                        </div>
                        {isSel&&width>60&&<div className="mono" style={{fontSize:6,color:sc.s}}>{fmtT(rec.cs)}–{fmtT(rec.ce)}</div>}
                        {isShared&&!isSel&&<div style={{position:'absolute',top:4,right:4,width:5,height:5,borderRadius:'50%',background:sc.p,opacity:.7}}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MY SETS SCREEN ─────────────────────────────────────────────────── */
function MySetsScreen({selected,toggleSet,recon,sharedIds,markers}){
  const[showExport,setShowExport]=React.useState(false);
  if(showExport)return<ExportScreen selected={selected} recon={recon} sharedIds={sharedIds} markers={markers} onBack={()=>setShowExport(false)}/>;

  const selTotal=selected.length;
  const conflicts=Object.values(recon).filter(s=>s.conflict).length;
  const trimmed=Object.values(recon).filter(s=>s.trimmed).length;

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={H('header-export.webp')} height={120} title="MY SETS" copy={COPY.myList}
          extra={
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{fontSize:11,color:STAGE_CFG.kineticFIELD.p,fontWeight:700,background:`${STAGE_CFG.kineticFIELD.p}14`,borderRadius:12,padding:'3px 10px'}}>{selTotal} sets</div>
                {conflicts>0&&<div style={{fontSize:10,color:'#ff5555',background:'rgba(255,85,85,.1)',borderRadius:10,padding:'3px 9px',display:'flex',alignItems:'center',gap:4}}>
                  <img src={ACT_IC('action-alert')} alt="" style={{width:11,height:11,mixBlendMode:'screen'}}/>{conflicts} conflict{conflicts>1?'s':''}
                </div>}
                {trimmed>0&&<div style={{fontSize:10,color:STAGE_CFG.kineticFIELD.s,background:`${STAGE_CFG.kineticFIELD.s}10`,borderRadius:10,padding:'3px 9px'}}>{trimmed} trimmed</div>}
              </div>
              <button onClick={()=>setShowExport(true)} style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'7px 14px',borderRadius:10,
                background:`linear-gradient(135deg,${STAGE_CFG.kineticFIELD.p},${STAGE_CFG.kineticFIELD.s})`,
                color:'#000',fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:12,
                boxShadow:`0 4px 20px ${STAGE_CFG.kineticFIELD.p}44`,
              }}>
                <img src={ACT_IC('action-download')} alt="" style={{width:14,height:14,filter:'invert(1)'}}/>Export
              </button>
            </div>
          }
        />
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'8px 16px 104px'}}>
        {selTotal===0&&(
          <div style={{textAlign:'center',padding:'50px 20px',color:'rgba(255,255,255,.2)'}}>
            <div style={{fontSize:32,marginBottom:12,opacity:.3}}>◈</div>
            <div style={{fontSize:14,fontStyle:'italic',marginBottom:6}}>nothing yet.</div>
            <div style={{fontSize:12}}>Head to Lineup to add sets</div>
          </div>
        )}
        {[1,2,3].map(dn=>{
          const dSets=SCHEDULE.filter(s=>selected.includes(s.id)&&s.day===dn).sort((a,b)=>toM(a.s)-toM(b.s)).filter(s=>{const r=recon[s.id]||s;return toM(r.ce)>toM(r.cs);});
          if(!dSets.length)return null;
          return(
            <div key={dn} style={{marginBottom:20}}>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:15,marginBottom:12,color:'rgba(255,255,255,.7)',letterSpacing:'-.01em'}}>
                {DAYS_LABEL[dn-1].toUpperCase()} <span style={{fontSize:11,color:'rgba(255,255,255,.3)',fontWeight:400}}>May {14+dn}</span>
              </div>
              {dSets.map(s=>(
                <SetCard key={s.id} set={s} selected={selected} onToggle={toggleSet} recon={recon} sharedIds={sharedIds}/>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── EXPORT SCREEN ─────────────────────────────────────────────────── */
function ExportScreen({selected,recon,sharedIds,markers,onBack}){
  const[stage,setStage]=React.useState('kineticFIELD');
  const[ratio,setRatio]=React.useState('9:16');
  const[day,setDay]=React.useState(1);
  const[exporting,setExporting]=React.useState(false);
  const canvasRef=React.useRef();
  const sc=STAGE_CFG[stage];

  const selSets=React.useMemo(()=>
    SCHEDULE.filter(s=>selected.includes(s.id)&&s.day===day&&MAIN_STAGES.includes(s.stage))
      .sort((a,b)=>toM(a.s)-toM(b.s))
      .filter(s=>{const r=recon[s.id]||s;return toM(r.ce)>toM(r.cs);})
  ,[selected,day,recon]);

  const dayMarkers=React.useMemo(()=>markers.filter(m=>!m.day||m.day===day).sort((a,b)=>toM(a.time||'19:00')-toM(b.time||'19:00')),[markers,day]);
  const RATIOS={'9:16':[1080,1920],'4:5':[1080,1350],'1:1':[1080,1080],'19.5:9':[1920,882]};

  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  async function doExport(){
    setExporting(true);
    try{
      await document.fonts.ready;
      const[W,H]=RATIOS[ratio]||[1080,1920];
      const canvas=canvasRef.current;
      canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d');
      const bg=new Image();
      await new Promise(res=>{bg.onload=res;bg.onerror=res;bg.src=A(`${sc.key}-backdrop.webp`);});
      ctx.fillStyle='#080c18';ctx.fillRect(0,0,W,H);
      if(bg.complete&&bg.naturalWidth){
        const bw=bg.naturalWidth,bh=bg.naturalHeight,scale=Math.max(W/bw,H/bh),dw=bw*scale,dh=bh*scale;
        ctx.globalAlpha=.55;ctx.globalCompositeOperation='lighten';
        ctx.drawImage(bg,(W-dw)/2,(H-dh)/2,dw,dh);
        ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      }
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'rgba(8,12,24,.8)');grad.addColorStop(.3,'rgba(8,12,24,.15)');grad.addColorStop(.65,'rgba(8,12,24,.45)');grad.addColorStop(1,'rgba(8,12,24,.92)');
      ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W/2,H*.07,0,W/2,H*.07,W*.75);
      rg.addColorStop(0,sc.p+'2e');rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
      const pad=W*.055;let y=H*.062;
      ctx.font=`900 ${W*.16}px Orbitron,sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff';
      ctx.shadowColor=sc.p;ctx.shadowBlur=W*.055;ctx.fillText('edc',W/2,y+W*.12);ctx.shadowBlur=0;y+=W*.135;
      ctx.font=`300 ${W*.027}px DM Sans,sans-serif`;ctx.fillStyle='rgba(255,255,255,.38)';ctx.letterSpacing=`${W*.012}px`;
      ctx.fillText(`LAS VEGAS 2026 · ${DAYS_LABEL[day-1].toUpperCase()}`,W/2,y);ctx.letterSpacing='0px';y+=H*.018;
      const lg=ctx.createLinearGradient(pad,0,W-pad,0);lg.addColorStop(0,'transparent');lg.addColorStop(.5,sc.p+'aa');lg.addColorStop(1,'transparent');
      ctx.strokeStyle=lg;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pad,y+H*.01);ctx.lineTo(W-pad,y+H*.01);ctx.stroke();y+=H*.03;
      const CH=H*.073,CG=H*.011;
      const allItems=[...dayMarkers.map(d=>({type:'marker',data:d})),...selSets.map(s=>({type:'set',data:s}))].sort((a,b)=>{
        const ta=a.type==='marker'?toM(a.data.time||'19:00'):toM(a.data.s);
        const tb=b.type==='marker'?toM(b.data.time||'19:00'):toM(b.data.s);return ta-tb;
      });
      for(const item of allItems){
        if(y+CH>H*.93)break;
        if(item.type==='marker'){
          const mk=item.data,mc=mk.color||'#FFD700';
          const mg=ctx.createLinearGradient(pad,0,W-pad,0);mg.addColorStop(0,'transparent');mg.addColorStop(.5,mc+'77');mg.addColorStop(1,'transparent');
          ctx.strokeStyle=mg;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,y+CG);ctx.lineTo(W-pad,y+CG);ctx.stroke();
          ctx.font=`700 ${W*.023}px Space Mono,monospace`;ctx.fillStyle=mc;ctx.textAlign='center';
          ctx.fillText(`${mk.label||''}${mk.time?' · '+fmtT(mk.time):''}`,W/2,y+CG*3);y+=CG*4.5;continue;
        }
        const s=item.data,stSc=STAGE_CFG[s.stage],rec=recon[s.id]||s;
        // Genre color dot
        const gc=GENRES[s.g]||GENRES['Electronic'];
        ctx.fillStyle=`${stSc.p}1a`;roundRect(ctx,pad,y,W-pad*2,CH,W*.016);ctx.fill();
        ctx.fillStyle=stSc.p;ctx.shadowColor=stSc.p;ctx.shadowBlur=W*.022;
        roundRect(ctx,pad,y,W*.011,CH,W*.004);ctx.fill();ctx.shadowBlur=0;
        // Genre dot
        ctx.fillStyle=gc.color;ctx.beginPath();ctx.arc(pad+W*.022,y+CH*.25,W*.009,0,Math.PI*2);ctx.fill();
        // Artist
        const maxW=(W-pad*2)*.65;
        ctx.font=`800 ${W*.034}px Sora,sans-serif`;ctx.fillStyle='#fff';ctx.textAlign='left';
        let aText=s.artist.replace(/\s+B2B\s+/g,' B2B ');
        while(ctx.measureText(aText).width>maxW&&aText.length>4)aText=aText.slice(0,-1);
        if(aText!==s.artist)aText+='…';
        ctx.fillText(aText,pad+W*.04,y+CH*.44);
        // Genre label
        ctx.font=`600 ${W*.02}px DM Sans,sans-serif`;ctx.fillStyle=gc.color;
        ctx.fillText(s.g,pad+W*.04,y+CH*.8);
        // Stage wordmark (right align)
        ctx.font=`600 ${W*.022}px DM Sans,sans-serif`;ctx.fillStyle=stSc.p;ctx.textAlign='right';
        ctx.fillText(stSc.label,W-pad-W*.018,y+CH*.8);
        // Times
        ctx.font=`400 ${W*.019}px Space Mono,monospace`;ctx.fillStyle='rgba(255,255,255,.28)';
        ctx.fillText(`${fmtT(s.s)}–${fmtT(s.e)}`,W-pad-W*.018,y+CH*.44);
        // Catch window
        ctx.font=`700 ${W*.022}px Space Mono,monospace`;ctx.fillStyle=stSc.s;
        ctx.fillText(`CATCH ${fmtT(rec.cs)}–${fmtT(rec.ce)}`,W/2,y+CH*.44);
        y+=CH+CG;
      }
      if(selSets.length===0){ctx.font=`300 ${W*.038}px DM Sans,sans-serif`;ctx.fillStyle='rgba(255,255,255,.2)';ctx.textAlign='center';ctx.fillText('No sets selected',W/2,H/2);}
      ctx.font=`300 ${W*.019}px Space Mono,monospace`;ctx.fillStyle='rgba(255,255,255,.18)';ctx.textAlign='center';
      ctx.fillText('MY EDC LV 2026 · UNDER THE ELECTRIC SKY',W/2,H*.965);
      canvas.toBlob(blob=>{
        if(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File([blob],'edc-schedule.png',{type:'image/png'})]})){
          navigator.share({files:[new File([blob],'edc-schedule.png',{type:'image/png'})],title:'My EDC 2026'}).catch(()=>{});
        }else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`edc-2026-${['fri','sat','sun'][day-1]}.png`;a.click();}
        setExporting(false);
      },'image/png');
    }catch(e){console.error(e);setExporting(false);}
  }

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{display:'none'}}/>
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={H('header-export.webp')} height={100}
          extra={
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <button onClick={onBack} style={{opacity:.5,fontSize:18,padding:'2px 6px',color:'#fff'}}>←</button>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:22,letterSpacing:'-.02em'}}>EXPORT</div>
            </div>
          }
        />
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 104px'}}>
        {/* Day */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.14em',textTransform:'uppercase',marginBottom:8}}>Day</div>
          <div style={{display:'flex',gap:6}}>
            {[['Friday',1],['Saturday',2],['Sunday',3]].map(([l,d])=>(
              <button key={d} onClick={()=>setDay(d)} style={{padding:'8px 14px',borderRadius:10,fontWeight:700,fontSize:12,background:day===d?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.07)',color:day===d?'#000':'rgba(255,255,255,.35)'}}>{l}</button>
            ))}
          </div>
        </div>
        {/* Preview */}
        <div style={{position:'relative',borderRadius:16,overflow:'hidden',marginBottom:16,border:`1px solid ${sc.p}33`,boxShadow:`0 0 36px ${sc.p}18`,aspectRatio:ratio==='9:16'?'9/16':ratio==='4:5'?'4/5':ratio==='1:1'?'1/1':'19.5/9',background:'var(--bg)'}}>
          <img src={A(`${sc.key}-backdrop.webp`)} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',mixBlendMode:'lighten',opacity:.5}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(8,12,24,.7) 0%,rgba(8,12,24,.15) 40%,rgba(8,12,24,.82) 100%)'}}/>
          <div style={{position:'relative',zIndex:2,padding:'14px 12px 10px'}}>
            <div style={{textAlign:'center',marginBottom:10}}>
              <div style={{fontFamily:'Orbitron,sans-serif',fontWeight:900,fontSize:32,color:sc.p,textShadow:`0 0 18px ${sc.p}`,lineHeight:1}}>edc</div>
              <div style={{fontSize:8,color:'rgba(255,255,255,.4)',letterSpacing:'.2em',marginTop:2,textTransform:'uppercase'}}>LV 2026 · {DAYS_LABEL[day-1].toUpperCase()}</div>
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${sc.p}88,transparent)`,marginTop:7}}/>
            </div>
            {selSets.length===0&&<div style={{textAlign:'center',padding:'14px 0',color:'rgba(255,255,255,.2)',fontSize:10}}>No sets selected</div>}
            {selSets.map(s=>{
              const stSc=STAGE_CFG[s.stage];const rec=recon[s.id]||s;const gc=GENRES[s.g]||GENRES['Electronic'];
              return(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,background:'rgba(0,0,0,.55)',borderRadius:8,padding:'6px 8px',borderLeft:`3px solid ${stSc.p}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.artist}</div>
                    <div style={{display:'flex',gap:4,alignItems:'center',marginTop:1}}>
                      <span style={{fontSize:7,color:stSc.p}}>{stSc.label}</span>
                      <span style={{width:4,height:4,borderRadius:'50%',background:gc.color,display:'inline-block'}}/>
                      <span style={{fontSize:7,color:gc.color}}>{s.g}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div className="mono" style={{fontSize:7,color:'rgba(255,255,255,.28)'}}>{fmtT(s.s)}–{fmtT(s.e)}</div>
                    <div className="mono" style={{fontSize:7,color:stSc.s,fontWeight:700}}>↳ {fmtT(rec.cs)}–{fmtT(rec.ce)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Stage backdrop */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.14em',textTransform:'uppercase',marginBottom:8}}>Stage Backdrop</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {MAIN_STAGES.map(sg=>{
              const sv=STAGE_CFG[sg];const act=stage===sg;
              return(
                <button key={sg} onClick={()=>setStage(sg)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:10,border:`1px solid ${act?sv.p:sv.p+'33'}`,background:act?`${sv.p}22`:'rgba(255,255,255,.04)',boxShadow:act?`0 0 10px ${sv.p}44`:'none',transition:'all .14s'}}>
                  <img src={SI(sv.key)} alt="" style={{width:16,height:16,objectFit:'contain',mixBlendMode:'screen'}}/>
                  <span style={{fontSize:9,color:act?sv.p:'rgba(255,255,255,.35)',fontWeight:700}}>{sv.short}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Ratio */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.14em',textTransform:'uppercase',marginBottom:8}}>Ratio</div>
          <div style={{display:'flex',gap:6}}>
            {['9:16','4:5','1:1','19.5:9'].map(r=>(
              <button key={r} onClick={()=>setRatio(r)} style={{padding:'7px 12px',borderRadius:9,border:`1px solid ${ratio===r?'rgba(255,255,255,.3)':'rgba(255,255,255,.08)'}`,background:ratio===r?'rgba(255,255,255,.1)':'rgba(255,255,255,.03)',color:ratio===r?'#fff':'rgba(255,255,255,.3)',fontFamily:'Space Mono,monospace',fontSize:10}}>{r}</button>
            ))}
          </div>
        </div>
        {/* Share */}
        <div style={{marginBottom:16,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:600,fontSize:12,marginBottom:2}}>Share My Schedule</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Encodes your full selection as a link</div>
          </div>
          <button onClick={()=>{
            const url=window.location.origin+window.location.pathname+encodeShare(selected);
            if(navigator.share)navigator.share({url,title:'My EDC 2026 lineup'}).catch(()=>{});
            else navigator.clipboard.writeText(url).then(()=>alert('Copied!')).catch(()=>{});
          }} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,background:`${STAGE_CFG.kineticFIELD.p}18`,border:`1px solid ${STAGE_CFG.kineticFIELD.p}44`,flexShrink:0}}>
            <img src={ACT_IC('action-share')} alt="" style={{width:14,height:14,mixBlendMode:'screen'}}/>
            <span style={{fontSize:11,color:STAGE_CFG.kineticFIELD.p,fontWeight:600}}>Share</span>
          </button>
        </div>
        <button onClick={doExport} disabled={exporting} style={{width:'100%',padding:'17px',borderRadius:14,background:exporting?'rgba(255,255,255,.06)':`linear-gradient(135deg,${sc.p},${sc.s})`,color:exporting?'rgba(255,255,255,.3)':'#000',fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:14,letterSpacing:'-.01em',boxShadow:exporting?'none':`0 8px 36px ${sc.p}44`,display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .2s'}}>
          <img src={ACT_IC('action-download')} alt="" style={{width:18,height:18,mixBlendMode:exporting?'normal':'multiply',opacity:exporting?.3:1}}/>
          {exporting?'Rendering…':'Save Wallpaper'}
        </button>
      </div>
    </div>
  );
}

/* ─── MAP SCREEN ─────────────────────────────────────────────────────── */
function MapScreen({mapPins,setMapPins,markers,crew}){
  const[zoom,setZoom]=React.useState(1);
  const[pan,setPan]=React.useState({x:0,y:0});
  const[selPin,setSelPin]=React.useState(null);
  const[addMode,setAddMode]=React.useState(false);
  const[addForm,setAddForm]=React.useState({label:'',time:'',color:'#00d4ff',icon:'meetup',crewId:''});
  const touchRef=React.useRef({});

  function onTS(e){if(e.touches.length===2){touchRef.current.pinching=true;touchRef.current.startDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);touchRef.current.startZoom=zoom;}else if(e.touches.length===1){touchRef.current.dragging=true;touchRef.current.startX=e.touches[0].clientX-pan.x;touchRef.current.startY=e.touches[0].clientY-pan.y;}}
  function onTM(e){if(touchRef.current.pinching&&e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);setZoom(Math.min(4,Math.max(.5,touchRef.current.startZoom*d/touchRef.current.startDist)));}else if(touchRef.current.dragging&&e.touches.length===1&&zoom>1){setPan({x:e.touches[0].clientX-touchRef.current.startX,y:e.touches[0].clientY-touchRef.current.startY});}}
  function onTE(){touchRef.current.pinching=false;touchRef.current.dragging=false;}

  const PIN_ICONS={meetup:UTIL_IC('utility-meet-up-point'),totem:UTIL_IC('utility-totem'),water:UTIL_IC('utility-water'),restroom:UTIL_IC('utility-restroom'),food:UTIL_IC('utility-food-and-drink'),charging:UTIL_IC('utility-charging'),shuttle:UTIL_IC('utility-shuttle'),rideshare:UTIL_IC('utility-rideshare'),entrance:UTIL_IC('utility-entrance'),exit:UTIL_IC('utility-exit')};

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={H('header-map.webp')} height={110} title="MAP" copy={COPY.map}
          extra={
            <div style={{display:'flex',gap:8}}>
              {zoom>1&&<button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} style={{padding:'5px 10px',borderRadius:8,background:'rgba(255,255,255,.08)',color:'rgba(255,255,255,.5)',fontSize:11}}>Reset</button>}
              <button onClick={()=>setAddMode(!addMode)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,fontSize:11,fontWeight:600,border:`1px solid ${addMode?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.12)'}`,background:addMode?`${STAGE_CFG.kineticFIELD.p}22`:'rgba(255,255,255,.06)',color:addMode?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.5)'}}>
                <img src={addMode?ACT_IC('action-more'):ACT_IC('action-add')} alt="" style={{width:13,height:13,mixBlendMode:'screen'}}/>{addMode?'Cancel':'+ Pin'}
              </button>
            </div>
          }
        />
        {addMode&&(
          <div style={{padding:'10px 16px 14px',background:'rgba(13,18,36,.9)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{display:'flex',gap:5,overflowX:'auto',marginBottom:8}}>
              {Object.keys(PIN_ICONS).map(k=>(
                <button key={k} onClick={()=>setAddForm(f=>({...f,icon:k}))} style={{flexShrink:0,display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:10,border:`1px solid ${addForm.icon===k?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.1)'}`,background:addForm.icon===k?`${STAGE_CFG.kineticFIELD.p}22`:'transparent',fontSize:9,color:addForm.icon===k?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.35)',fontWeight:600}}>
                  <img src={PIN_ICONS[k]} alt="" style={{width:12,height:12,mixBlendMode:'screen'}}/>{k}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:7,alignItems:'center'}}>
              <input value={addForm.label} onChange={e=>setAddForm(f=>({...f,label:e.target.value}))} placeholder="Label" style={{flex:2,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'8px 10px',color:'#fff',fontSize:13,outline:'none'}}/>
              <input value={addForm.time} onChange={e=>setAddForm(f=>({...f,time:e.target.value}))} placeholder="Time" style={{flex:1,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,padding:'8px 10px',color:'#fff',fontSize:13,outline:'none'}}/>
              <input type="color" value={addForm.color} onChange={e=>setAddForm(f=>({...f,color:e.target.value}))} style={{width:36,height:36,borderRadius:6,border:'1px solid rgba(255,255,255,.12)',background:'none',cursor:'pointer',padding:2}}/>
            </div>
            <div style={{fontSize:10,color:STAGE_CFG.kineticFIELD.p,marginTop:6,fontStyle:'italic'}}>Tap the map to place your pin</div>
          </div>
        )}
      </div>
      <div style={{flex:1,position:'relative',overflow:'hidden',background:'#030408',cursor:addMode?'crosshair':'grab'}}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        onClick={e=>{if(!addMode)return;const r=e.currentTarget.getBoundingClientRect();const x=parseFloat(((e.clientX-r.left)/r.width*100).toFixed(1));const y=parseFloat(((e.clientY-r.top)/r.height*100).toFixed(1));setMapPins(p=>[...p,{id:Date.now(),x,y,...addForm}]);setAddMode(false);}}>
        <div style={{width:'100%',height:'100%',transform:`scale(${zoom}) translate(${pan.x/zoom}px,${pan.y/zoom}px)`,transformOrigin:'center center',transition:'transform .05s',position:'relative'}}>
          <img src="assets/map.webp" alt="EDC Map" onError={e=>e.target.style.display='none'} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:.1,pointerEvents:'none'}}>
            <img src={UTIL_IC('utility-stage')} alt="" style={{width:56,height:56,mixBlendMode:'screen',marginBottom:10}}/>
            <div style={{fontFamily:'Sora,sans-serif',fontSize:13,letterSpacing:'.1em',color:'#fff'}}>MAP COMING SOON</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginTop:4}}>Add assets/map.webp to enable</div>
          </div>
          {MAIN_STAGES.map((sg,i)=>{
            const sc=STAGE_CFG[sg];
            const pos=[{x:50,y:52},{x:24,y:40},{x:51,y:28},{x:75,y:44},{x:72,y:68},{x:28,y:68},{x:76,y:28},{x:62,y:35},{x:38,y:35}][i]||{x:50,y:50};
            return(
              <div key={sg} onClick={e=>{e.stopPropagation();setSelPin({type:'stage',stage:sg,sc});}} style={{position:'absolute',left:`${pos.x}%`,top:`${pos.y}%`,transform:'translate(-50%,-50%)',cursor:'pointer',zIndex:10}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:`${sc.p}22`,border:`1.5px solid ${sc.p}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 14px ${sc.p}66`}}>
                  <img src={SI(sc.key)} alt="" style={{width:20,height:20,objectFit:'contain',mixBlendMode:'screen'}}/>
                </div>
              </div>
            );
          })}
          {mapPins.map(pin=>(
            <div key={pin.id} onClick={e=>{e.stopPropagation();setSelPin({type:'pin',pin});}} style={{position:'absolute',left:`${pin.x}%`,top:`${pin.y}%`,transform:'translate(-50%,-100%)',cursor:'pointer',zIndex:15}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:`${pin.color||'#00d4ff'}22`,border:`1.5px solid ${pin.color||'#00d4ff'}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 3px',boxShadow:`0 0 10px ${pin.color||'#00d4ff'}88`}}>
                <img src={PIN_ICONS[pin.icon]||PIN_ICONS.meetup} alt="" style={{width:16,height:16,objectFit:'contain',mixBlendMode:'screen'}}/>
              </div>
              <div style={{fontSize:7,color:pin.color||'#00d4ff',textAlign:'center',whiteSpace:'nowrap',fontWeight:700,textShadow:'0 1px 3px rgba(0,0,0,.9)'}}>{pin.label}</div>
            </div>
          ))}
        </div>
        <div style={{position:'absolute',right:12,top:12,display:'flex',flexDirection:'column',gap:6,zIndex:20}}>
          {['+','−'].map(b=>(
            <button key={b} onClick={()=>setZoom(z=>Math.min(4,Math.max(.5,z+(b==='+'?.3:-.3))))} style={{width:34,height:34,borderRadius:8,background:'rgba(8,12,24,.85)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.6)',fontSize:18}}>{b}</button>
          ))}
        </div>
        {selPin&&(
          <div style={{position:'absolute',bottom:16,left:16,right:60,background:'rgba(8,12,24,.96)',backdropFilter:'blur(20px)',borderRadius:16,padding:'13px 15px',zIndex:30,border:`1px solid ${selPin.sc?.p||selPin.pin?.color||'rgba(255,255,255,.1)'}33`}}>
            {selPin.type==='stage'&&(<>
              <img src={SL(selPin.sc.key)} alt="" style={{height:20,objectFit:'contain',mixBlendMode:'screen',marginBottom:5}}/>
              <div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Tap a set in Lineup to select</div>
            </>)}
            {selPin.type==='pin'&&(<>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <img src={PIN_ICONS[selPin.pin.icon]||PIN_ICONS.meetup} alt="" style={{width:20,height:20,mixBlendMode:'screen'}}/>
                <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,color:selPin.pin.color||'#00d4ff'}}>{selPin.pin.label}</div>
              </div>
              {selPin.pin.time&&<div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:4}}>⏱ {selPin.pin.time}</div>}
              <button onClick={()=>{setMapPins(p=>p.filter(x=>x.id!==selPin.pin.id));setSelPin(null);}} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#ff5555',background:'rgba(255,85,85,.1)',border:'1px solid rgba(255,85,85,.2)',borderRadius:6,padding:'4px 10px'}}>
                <img src={ACT_IC('action-delete')} alt="" style={{width:11,height:11,mixBlendMode:'screen'}}/>Remove
              </button>
            </>)}
            <button onClick={()=>setSelPin(null)} style={{position:'absolute',top:10,right:12,fontSize:18,opacity:.3,padding:4,color:'#fff'}}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CREW SCREEN ────────────────────────────────────────────────────── */
function CrewScreen({crew,setCrew,markers,setMarkers}){
  const[editCrew,setEditCrew]=React.useState(null);
  const[editMark,setEditMark]=React.useState(null);
  const[cf,setCf]=React.useState({name:'',origin:'',rep:'',findUs:'',photo:''});
  const[mf,setMf]=React.useState({label:'',time:'',day:0,color:'#FFD700'});

  function saveCrew(){if(!cf.name.trim())return;if(editCrew==='new')setCrew(p=>[...p,{id:Date.now(),...cf}]);else setCrew(p=>p.map(c=>c.id===editCrew?{...c,...cf}:c));setEditCrew(null);}
  function saveMark(){if(!mf.label.trim())return;const mk={id:Date.now(),...mf};if(editMark==='new')setMarkers(p=>[...p,mk]);else setMarkers(p=>p.map(m=>m.id===editMark?{...m,...mf}:m));setEditMark(null);}
  function handlePhoto(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setCf(c=>({...c,photo:ev.target.result}));r.readAsDataURL(f);}

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flexShrink:0,background:'rgba(8,12,24,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <ScreenHeader img={H('header-crew.webp')} height={120} title="CREW" copy={COPY.crew}
          extra={
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span/>
              {crew.length<3&&<button onClick={()=>{setCf({name:'',origin:'',rep:'',findUs:'',photo:''});setEditCrew('new');}} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,border:`1px solid ${STAGE_CFG.kineticFIELD.p}44`,background:`${STAGE_CFG.kineticFIELD.p}12`,color:STAGE_CFG.kineticFIELD.p,fontWeight:600,fontSize:11}}>
                <img src={ACT_IC('action-add')} alt="" style={{width:13,height:13,mixBlendMode:'screen'}}/>Add Crew
              </button>}
            </div>
          }
        />
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'10px 16px 104px'}}>
        {/* Crew form */}
        {editCrew&&(
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:18,padding:'16px',marginBottom:16}}>
            <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,marginBottom:12,fontSize:14}}>{editCrew==='new'?'New Crew':'Edit Crew'}</div>
            <div style={{display:'flex',gap:12,marginBottom:12,alignItems:'center'}}>
              <div style={{width:66,height:66,borderRadius:14,background:'rgba(255,255,255,.07)',border:'1px dashed rgba(255,255,255,.18)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                {cf.photo?<img src={cf.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<img src={UTIL_IC('utility-totem')} alt="" style={{width:34,height:34,mixBlendMode:'screen',opacity:.4}}/>}
              </div>
              <label style={{padding:'7px 14px',borderRadius:8,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.6)',fontSize:11,cursor:'pointer'}}>
                Photo <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
              </label>
            </div>
            {[['name','Crew Name *'],['origin','From'],['rep','Rep'],['findUs','Find Us']].map(([k,l])=>(
              <div key={k} style={{marginBottom:8}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,.28)',marginBottom:3}}>{l}</div>
                <input value={cf[k]} onChange={e=>setCf(c=>({...c,[k]:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'9px 12px',color:'#fff',fontSize:14,outline:'none'}}/>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button onClick={saveCrew} style={{flex:1,padding:'11px',borderRadius:10,background:STAGE_CFG.kineticFIELD.p,color:'#000',fontWeight:800,fontSize:13,fontFamily:'Sora,sans-serif'}}>Save</button>
              <button onClick={()=>setEditCrew(null)} style={{padding:'11px 18px',borderRadius:10,background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.4)',fontSize:13}}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{fontSize:9,color:'rgba(255,255,255,.25)',letterSpacing:'.16em',textTransform:'uppercase',marginBottom:8}}>Totems ({crew.length}/3)</div>
        {crew.length===0&&!editCrew&&<div style={{textAlign:'center',padding:'20px',color:'rgba(255,255,255,.2)',fontSize:12,border:'1px dashed rgba(255,255,255,.08)',borderRadius:14,marginBottom:14}}>Add your crew to link them to map pins</div>}
        {crew.map(c=>(
          <div key={c.id} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:'14px',marginBottom:10,display:'flex',gap:12,alignItems:'center'}}>
            <div style={{width:62,height:62,borderRadius:14,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
              {c.photo?<img src={c.photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<img src={UTIL_IC('utility-totem')} alt="" style={{width:34,height:34,mixBlendMode:'screen',opacity:.45}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:13,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
              {c.origin&&<div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:2}}>{c.origin}{c.rep&&` · ${c.rep}`}</div>}
              {c.findUs&&<div style={{fontSize:10,color:STAGE_CFG.kineticFIELD.p,marginTop:4,display:'flex',alignItems:'center',gap:4}}>
                <img src={UTIL_IC('utility-meet-up-point')} alt="" style={{width:12,height:12,mixBlendMode:'screen'}}/>{c.findUs}
              </div>}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              <button onClick={()=>{setCf({name:c.name,origin:c.origin||'',rep:c.rep||'',findUs:c.findUs||'',photo:c.photo||''});setEditCrew(c.id);}} style={{padding:'5px 8px',borderRadius:6,background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.4)',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                <img src={ACT_IC('action-edit')} alt="" style={{width:10,height:10,mixBlendMode:'screen'}}/>Edit
              </button>
              <button onClick={()=>setCrew(p=>p.filter(x=>x.id!==c.id))} style={{padding:'5px 8px',borderRadius:6,background:'rgba(255,85,85,.1)',color:'#ff5555',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                <img src={ACT_IC('action-delete')} alt="" style={{width:10,height:10,mixBlendMode:'screen'}}/>×
              </button>
            </div>
          </div>
        ))}
        {/* Markers */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'18px 0 8px'}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.25)',letterSpacing:'.16em',textTransform:'uppercase'}}>Meetup Markers</div>
          <button onClick={()=>{setMf({label:'',time:'',day:0,color:'#FFD700'});setEditMark('new');}} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:STAGE_CFG.kineticFIELD.p,background:`${STAGE_CFG.kineticFIELD.p}12`,border:`1px solid ${STAGE_CFG.kineticFIELD.p}33`,borderRadius:8,padding:'4px 10px',fontWeight:600}}>
            <img src={ACT_IC('action-add')} alt="" style={{width:11,height:11,mixBlendMode:'screen'}}/>Add
          </button>
        </div>
        {editMark&&(
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:14,padding:'13px',marginBottom:12}}>
            {[['label','Label *'],['time','Festival Time (e.g. 23:00)']].map(([k,l])=>(
              <div key={k} style={{marginBottom:8}}>
                <div style={{fontSize:9,color:'rgba(255,255,255,.28)',marginBottom:3}}>{l}</div>
                <input value={mf[k]} onChange={e=>setMf(f=>({...f,[k]:e.target.value}))} style={{width:'100%',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:7,padding:'8px 10px',color:'#fff',fontSize:13,outline:'none'}}/>
              </div>
            ))}
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}>
              <div><div style={{fontSize:9,color:'rgba(255,255,255,.28)',marginBottom:3}}>Color</div>
                <input type="color" value={mf.color} onChange={e=>setMf(f=>({...f,color:e.target.value}))} style={{width:42,height:33,borderRadius:6,border:'1px solid rgba(255,255,255,.12)',background:'none',cursor:'pointer',padding:2}}/></div>
              <div style={{flex:1}}><div style={{fontSize:9,color:'rgba(255,255,255,.28)',marginBottom:3}}>Day</div>
                <div style={{display:'flex',gap:4}}>
                  {[0,1,2,3].map(d=>(
                    <button key={d} onClick={()=>setMf(f=>({...f,day:d}))} style={{flex:1,padding:'6px 2px',borderRadius:6,background:mf.day===d?STAGE_CFG.kineticFIELD.p:'rgba(255,255,255,.07)',color:mf.day===d?'#000':'rgba(255,255,255,.4)',fontSize:10,fontWeight:700}}>
                      {d===0?'All':['F','Sa','Su'][d-1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={saveMark} style={{flex:1,padding:'10px',borderRadius:9,background:STAGE_CFG.kineticFIELD.p,color:'#000',fontWeight:800,fontSize:12,fontFamily:'Sora,sans-serif'}}>Save</button>
              <button onClick={()=>setEditMark(null)} style={{padding:'10px 18px',borderRadius:9,background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.4)',fontSize:12}}>Cancel</button>
            </div>
          </div>
        )}
        {markers.length===0&&!editMark&&<div style={{textAlign:'center',padding:'14px',color:'rgba(255,255,255,.15)',fontSize:11,border:'1px dashed rgba(255,255,255,.06)',borderRadius:12}}>No markers · They appear on schedule &amp; exports</div>}
        {markers.map(m=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:m.color,boxShadow:`0 0 8px ${m.color}`,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13}}>{m.label}</div>
              {m.time&&<div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginTop:1}}>{fmtT(m.time)}{m.day>0?` · ${['Fri','Sat','Sun'][m.day-1]}`:' · All days'}</div>}
            </div>
            <button onClick={()=>setMarkers(p=>p.filter(x=>x.id!==m.id))} style={{padding:'4px 7px',borderRadius:6,background:'rgba(255,85,85,.1)',color:'#ff5555',display:'flex',alignItems:'center',gap:3,fontSize:11}}>
              <img src={ACT_IC('action-delete')} alt="" style={{width:10,height:10,mixBlendMode:'screen'}}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── INSTALL PROMPT ─────────────────────────────────────────────────── */
function InstallPrompt(){
  const[show,setShow]=React.useState(false);
  const[prompt,setPrompt]=React.useState(null);
  React.useEffect(()=>{
    const v=parseInt(LS.get('visits',0))+1;LS.set('visits',v);
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();setPrompt(e);if(v>=2&&!LS.get('installDismissed'))setShow(true);});
  },[]);
  if(!show)return null;
  return(
    <div style={{position:'fixed',bottom:84,left:14,right:14,background:'rgba(8,12,24,.98)',backdropFilter:'blur(28px)',borderRadius:22,padding:'16px',border:`1px solid ${STAGE_CFG.kineticFIELD.p}33`,boxShadow:`0 8px 40px rgba(0,0,0,.6)`,zIndex:200,animation:'fadeUp .3s ease'}}>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
        <img src={A('icon-192.webp')} alt="" style={{width:46,height:46,borderRadius:12,flexShrink:0}}/>
        <div>
          <div style={{fontFamily:'Sora,sans-serif',fontWeight:700,fontSize:14,marginBottom:2}}>Add to Home Screen</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.35)'}}>Offline access. Signal's rough out there.</div>
        </div>
        <button onClick={()=>{LS.set('installDismissed',1);setShow(false);}} style={{fontSize:22,opacity:.25,padding:4,color:'#fff',marginLeft:'auto'}}>×</button>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={async()=>{if(prompt){await prompt.prompt();setShow(false);}}} style={{flex:1,padding:'11px',borderRadius:10,background:`linear-gradient(135deg,${STAGE_CFG.kineticFIELD.p},${STAGE_CFG.kineticFIELD.s})`,color:'#000',fontWeight:800,fontSize:13,fontFamily:'Sora,sans-serif'}}>Install</button>
        <button onClick={()=>setShow(false)} style={{padding:'11px 16px',borderRadius:10,background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.35)',fontSize:13}}>Later</button>
      </div>
    </div>
  );
}

/* ─── SHARED BANNER ──────────────────────────────────────────────────── */
function SharedBanner({sharedIds,onDismiss}){
  if(!sharedIds)return null;
  return(
    <div style={{position:'absolute',top:0,left:0,right:0,zIndex:90,background:`${STAGE_CFG.stereoBLOOM.p}1a`,backdropFilter:'blur(12px)',borderBottom:`1px solid ${STAGE_CFG.stereoBLOOM.p}33`,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <img src={ACT_IC('action-share')} alt="" style={{width:14,height:14,mixBlendMode:'screen'}}/>
        <span style={{fontSize:11,color:STAGE_CFG.stereoBLOOM.p,fontWeight:600}}>Viewing shared lineup · {sharedIds.length} sets</span>
      </div>
      <button onClick={onDismiss} style={{fontSize:11,color:'rgba(255,255,255,.4)',padding:'2px 8px',borderRadius:6,background:'rgba(255,255,255,.07)'}}>Dismiss</button>
    </div>
  );
}

/* ─── AUDIT PANEL ────────────────────────────────────────────────────── */
function AuditPanel({selected,recon,onClose}){
  const[r,setR]=React.useState(null);
  React.useEffect(()=>{
    const res={pwa:{manifest:!!document.querySelector('link[rel=manifest]'),sw:'serviceWorker' in navigator,swActive:false}};
    navigator.serviceWorker?.getRegistration().then(reg=>{res.pwa.swActive=!!reg?.active;setR({...res});});
    const seen=new Set(),dups=[];SCHEDULE.forEach(s=>{if(seen.has(s.id))dups.push(s.id);seen.add(s.id);});
    res.schedule={total:SCHEDULE.length,mainStage:SCHEDULE.filter(s=>MAIN_STAGES.includes(s.stage)).length,dups};
    const conflicts=[],trimmed=[];Object.values(recon).forEach(s=>{if(s.conflict)conflicts.push(s.artist);if(s.trimmed)trimmed.push(`${s.artist} −${s.trimMin}m`);});
    res.conflicts={count:conflicts.length,items:conflicts,trimmed};
    res.storage={selected:selected.length,lsKeys:Object.keys(localStorage).length};
    setR(res);
  },[]);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(8,12,24,.97)',zIndex:999,overflowY:'auto',padding:'60px 20px 40px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
        <div style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:16,color:STAGE_CFG.kineticFIELD.p}}>DEV AUDIT</div>
        <button onClick={onClose} style={{fontSize:22,opacity:.4,padding:4,color:'#fff'}}>×</button>
      </div>
      {!r&&<div style={{color:'rgba(255,255,255,.4)'}}>Running…</div>}
      {r&&Object.entries(r).map(([k,v])=>(
        <div key={k} style={{marginBottom:14,background:'rgba(255,255,255,.04)',borderRadius:12,padding:'12px 14px'}}>
          <div style={{fontWeight:700,fontSize:11,color:STAGE_CFG.kineticFIELD.s,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>{k}</div>
          <pre style={{fontSize:11,color:'rgba(255,255,255,.5)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{JSON.stringify(v,null,2)}</pre>
        </div>
      ))}
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────────────── */
function App(){
  const[tab,setTab]=React.useState('home');
  const[auditOpen,setAuditOpen]=React.useState(false);
  const now=useClock();
  const phase=getFestPhase(now);
  const{selected,toggleSet,recon,crew,setCrew,markers,setMarkers,mapPins,setMapPins,sharedIds,setSharedIds,weather}=useApp();

  // Expose setTab globally for CTA cards on home countdown
  React.useEffect(()=>{window.__setTab=setTab;},[]);

  React.useEffect(()=>{
    if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  },[]);

  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      <SharedBanner sharedIds={sharedIds} onDismiss={()=>setSharedIds(null)}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',marginTop:sharedIds?42:0,position:'relative'}}>
        <div className="anim-up" key={tab} style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {tab==='home'   &&<HomeScreen selected={selected} toggleSet={toggleSet} recon={recon} sharedIds={sharedIds} weather={weather}/>}
          {tab==='lineup' &&<LineupScreen selected={selected} toggleSet={toggleSet} recon={recon} sharedIds={sharedIds}/>}
          {tab==='mylist' &&<MySetsScreen selected={selected} toggleSet={toggleSet} recon={recon} sharedIds={sharedIds} markers={markers}/>}
          {tab==='map'    &&<MapScreen mapPins={mapPins} setMapPins={setMapPins} markers={markers} crew={crew}/>}
          {tab==='crew'   &&<CrewScreen crew={crew} setCrew={setCrew} markers={markers} setMarkers={setMarkers}/>}
        </div>
        <BottomNav tab={tab} setTab={setTab} phase={phase.phase}/>
      </div>
      <InstallPrompt/>
      {auditOpen&&<AuditPanel selected={selected} recon={recon} onClose={()=>setAuditOpen(false)}/>}
      <div onContextMenu={e=>{e.preventDefault();setAuditOpen(true);}} onTouchStart={(()=>{let t;return()=>{t=setTimeout(()=>setAuditOpen(true),800);}})()}
        onTouchEnd={()=>{}} style={{position:'absolute',bottom:3,right:7,fontSize:9,color:'rgba(255,255,255,.04)',zIndex:50,userSelect:'none'}}>v3.0.0</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
