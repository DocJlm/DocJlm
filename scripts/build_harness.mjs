import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {loadActor,pose,mixPose,drawActor,bounds} from './spine_renderer.mjs';
import {FPS,DURATION,FRAME_COUNT,PHASES,CODE,atTime,actionAt,visualAt} from './harness_timeline.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'assets/source'),out=path.join(root,'assets/harness'),scratch=path.join(root,'.preview/harness');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
GlobalFonts.registerFromPath(path.join(src,'fonts/Anton-Regular.ttf'),'Anton');
if(fs.existsSync('/System/Library/Fonts/Menlo.ttc'))GlobalFonts.registerFromPath('/System/Library/Fonts/Menlo.ttc','Menlo');
const P={paper:'#f7f9fa',ink:'#12161b',night:'#091016',panel:'#0c151c',edge:'#30464f',muted:'#9aafbb',cyan:'#00d5f5',pink:'#ff4fa7',orange:'#ff6b28',green:'#9fdf68',white:'#edf5f8'};
const actors={},neutral={};
for(const[name,id]of[['amiya','char_002_amiya'],['kaltsit','char_003_kalts'],['w','char_113_cqbw']])actors[name]=await loadActor(path.join(src,'battle',name),id);
actors.theresa=await loadActor(path.join(src,'squad/theresa'),'enemy_3007_lrssia');
for(const[name,a]of Object.entries(actors)){pose(a,name==='theresa'?'C1_Idle':'Idle',0);neutral[name]=bounds(a);}
const art={};for(const n of ['theresa-portrait','battle-desktop','battle-mobile','error-cube','impact-cyan','impact-orange','containment-pink','deploy-gate'])art[n]=await loadImage(path.join(src,'harness',n+'.png'));
const portraits={theresa:art['theresa-portrait']};for(const n of ['amiya','kaltsit','w'])portraits[n]=await loadImage(path.join(src,'battle',n,'portrait.png'));
const logos={};for(const n of ['babel','rhodes'])logos[n]=await loadImage(path.join(src,'squad',n+'.png'));
const icons={};for(const n of ['terminal-2','code','eye','tool','device-floppy','check','alert-triangle','git-branch','player-play','cube']){
 for(const color of ['white','cyan','pink','orange','green'])icons[n+color]=await loadImage(Buffer.from(fs.readFileSync(path.join(src,'icons',n+'.svg'),'utf8').replaceAll('currentColor',P[color])));
}
const run=spawnSync('python3',[path.join(root,'scripts/harness_demo.py')],{encoding:'utf8'});
if(run.status!==0)throw Error(run.stderr);const demo=JSON.parse(run.stdout);
if(demo.status!=='verified'||demo.calls!==2||demo.retries!==1)throw Error('Demonstration failed; refusing to render a success story.');
const mobileArg=process.argv.includes('--mobile'),desktopArg=process.argv.includes('--desktop');
const onlyStill=process.argv.includes('--still'),encodeOnly=process.argv.includes('--encode-only');
const layouts={
 desktop:{width:1536,height:1024,stage:[570,0,966,644],feet:{amiya:[825,340],kaltsit:[1040,350],w:[1230,390],theresa:[945,525]},heights:{amiya:184,kaltsit:185,w:185,theresa:178},enemy:[[1410,400],[1325,500],[1480,535]],gate:[1298,180],console:[330,641,1072,357],rail:[1414,650,108,338],portrait:[-104,195,790,1185]},
 mobile:{width:768,height:1408,stage:[0,374,768,512],feet:{amiya:[158,664],kaltsit:[432,653],w:[614,697],theresa:[319,795]},heights:{amiya:155,kaltsit:160,w:161,theresa:168},enemy:[[550,790],[690,798],[713,710]],gate:[640,508],console:[0,914,768,494],portrait:[340,0,390,585]}
};
function text(g,s,x,y,size=18,color=P.white,font='Menlo'){g.font=`${size}px "${font}", monospace`;g.fillStyle=color;g.fillText(s,x,y);}
function fit(g,s,x,y,maxWidth,size,color,font='Anton'){g.font=`${size}px "${font}"`;while(g.measureText(s).width>maxWidth){size-=1;g.font=`${size}px "${font}"`;}g.fillStyle=color;g.fillText(s,x,y);}
function box(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function polygon(g,pts){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
function line(g,pts,c,w=2){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.stroke();}
function icon(g,n,c,x,y,size=24){g.drawImage(icons[n+c],x,y,size,size);}
function ellipse(g,x,y,rx,ry,c){g.beginPath();g.ellipse(x,y,rx,ry,0,0,2*Math.PI);g.fillStyle=c;g.fill();}
function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function glowLine(g,pts,c,w=2){g.save();g.shadowColor=c;g.shadowBlur=9;line(g,pts,c,w);g.restore();}
function fittedPortrait(g,name,x,y,w,h){
 const im=portraits[name];g.save();g.beginPath();g.rect(x,y,w,h);g.clip();box(g,x,y,w,h,'#23313b');
 if(name==='theresa')g.drawImage(im,220,300,560,560*h/w,x,y,w,h);
 else g.drawImage(im,0,im.height*.22,im.width,im.width*h/w,x,y,w,h);
 g.restore();
}
function background(l,mobile){
 const c=createCanvas(l.width,l.height),g=c.getContext('2d');box(g,0,0,l.width,l.height,P.paper);
 g.save();if(!mobile){polygon(g,[[870,0],[1536,0],[1536,644],[565,644],[570,420]]);g.clip();}g.drawImage(art[mobile?'battle-mobile':'battle-desktop'],...l.stage);g.restore();
 if(!mobile){
  g.save();g.globalAlpha=.7;g.drawImage(art['containment-pink'],-190,160,1030,1030);g.restore();
  g.drawImage(art['theresa-portrait'],...l.portrait);
  box(g,28,24,42,36,P.ink);g.drawImage(logos.babel,31,24,36,36);
  text(g,'B A B E L   /   A G E N T  H A R N E S S',88,48,18,P.ink);
  fit(g,'DocJlm',26,220,525,258,'#080a0d','Anton');box(g,553,193,24,27,P.orange);
  text(g,'Building with AI.',365,267,28,P.ink,'Anton');text(g,'Creating with curiosity.',365,303,28,P.ink,'Anton');
  line(g,[[365,330],[429,330]],P.ink,2);text(g,'AI / FIELD ENGINEER',365,357,14,'#546575');
  text(g,'THERESA',26,424,25,P.ink,'Anton');text(g,'BABEL',26,447,12,'#52606c');
  box(g,1273,15,247,31,'#091016e8');text(g,'SIMULATED AGENT RUN',1285,37,15,P.white);
  g.save();g.globalAlpha=.7;g.drawImage(logos.babel,1110,30,60,65);g.restore();
 }else{
  // Dedicated vertical composition; no desktop crop or scaled-down terminal.
  g.save();g.beginPath();g.rect(0,0,768,374);g.clip();g.globalAlpha=.65;g.drawImage(art['containment-pink'],310,-55,520,520);g.globalAlpha=1;g.drawImage(art['theresa-portrait'],...l.portrait);g.restore();
  box(g,24,22,29,27,P.ink);g.drawImage(logos.babel,26,23,25,25);
  text(g,'BABEL / AGENT HARNESS',64,43,17,P.ink);
  fit(g,'DocJlm',22,191,367,184,'#080a0d','Anton');box(g,396,169,18,22,P.orange);
  text(g,'Building with AI.',25,239,31,P.ink,'Anton');text(g,'Creating with curiosity.',25,278,31,P.ink,'Anton');
  text(g,'AI / FIELD ENGINEER',26,320,17,'#536574');
  box(g,0,350,768,24,P.ink);text(g,'SIMULATED AGENT RUN  /  FAN-MADE BABEL OPERATION',22,368,13,P.white);
 }
 return c;
}
function battle(g,l,t,mobile){
 const s=atTime(t),v=visualAt(t),cycle=t/DURATION*Math.PI*2;
 // HUD paths and grid highlights are semantic execution overlays on raster scenery.
 const a=l.feet.amiya,k=l.feet.kaltsit,w=l.feet.w,th=l.feet.theresa;
 const points=[a,[a[0]+65,a[1]+45],th,[k[0]-45,k[1]+70],k,w,l.gate];
 g.save();g.globalAlpha=.6+.1*Math.sin(cycle);glowLine(g,points,P.cyan,3);g.restore();
 for(let j=0;j<7;j++){const z=(t*.16+j/7)%1,seg=z*(points.length-1),i=Math.floor(seg),f=seg-i;const p=points[i],q=points[Math.min(i+1,points.length-1)];ellipse(g,p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f,3,2,P.cyan);}
 if(t>=18&&t<23){const[gx,gy]=l.gate,gw=mobile?90:104,gh=gw*1.5,opening=ease((t-18)/.8)*(1-ease((t-21.7)/1));g.save();g.beginPath();g.rect(gx-gw*opening/2,gy-gh+10,gw*opening,gh);g.clip();g.drawImage(art['deploy-gate'],gx-gw/2,gy-gh+10,gw,gh);g.restore();}
 const active={amiya:s.key==='act',theresa:s.key==='repair',kaltsit:s.key==='verify',w:s.key==='deploy'};
 const colors={amiya:P.cyan,theresa:P.pink,kaltsit:P.green,w:P.orange};
 for(const name of ['amiya','kaltsit','w','theresa']){
  const[x,y]=l.feet[name],r=mobile?43:52;
  polygon(g,[[x-r,y],[x,y-r*.45],[x+r,y],[x,y+r*.45]]);g.fillStyle=active[name]?colors[name]+'40':'#09101655';g.fill();g.strokeStyle=colors[name];g.lineWidth=active[name]?2.8:1;g.stroke();
  const actor=actors[name],b=neutral[name],sc=l.heights[name]/b.h,an=actionAt(name,t);
  pose(actor,an.action,an.time);
  if(an.idleBlend>0)mixPose(actor,an.idle,t,ease(an.idleBlend));
  if(an.reset>0)mixPose(actor,an.idle,0,ease(an.reset));
  drawActor(g,actor,x-(b.x+b.w/2)*sc,y+b.y*sc,sc);
 }
 const enemyAlpha=ease((t-3.5)/1.2)*(1-v.purge);
 const targets=[];
 for(let j=0;j<l.enemy.length;j++){
  const [tx,ty]=l.enemy[j],travel=1-ease((t-3.5-j*.3)/2),bind=v.capture;
  const center=mobile?[602,735]:[1365,460];
  const x=tx+travel*(mobile?32:70)+(center[0]-tx)*bind*.35;
  const y=ty-travel*40+(center[1]-ty)*bind*.35;
  targets.push([x,y]);
  const size=(mobile?108:145)*(1-.85*v.purge);
  g.save();g.globalAlpha=enemyAlpha;g.drawImage(art['error-cube'],x-size/2,y-size+7+Math.sin(t*2+j)*3,size,size);g.restore();
 }
 // A visible cast, beam and hit share Amiya's genuine Attack loop period.
 if(t>=3&&t<7){
  const e=targets[0],power=.3+.7*v.attackPulse,z=(mobile?190:255)*(.8+.2*v.attackPulse);
  g.save();g.globalAlpha=power;glowLine(g,[[a[0]+18,a[1]-85],[a[0]+90,a[1]-60],[e[0],e[1]-45]],P.cyan,5);
  glowLine(g,[[a[0]+18,a[1]-85],[e[0],e[1]-45]],P.white,1.8);
  g.drawImage(art['impact-cyan'],a[0]+40-z*.5,a[1]-65-z*.5,z,z);
  g.drawImage(art['impact-cyan'],e[0]-z*.65,e[1]-45-z*.65,z*1.3,z*1.3);g.restore();
 }
 if(v.repair){
  // One multi-target spell: wind-up → bind → patch → compress. The UI uses v too.
  const strength=.3+.7*v.charge,fade=1-.75*v.purge;
  g.save();g.globalAlpha=.85*strength*fade;
  const z=mobile?245:335;
  g.drawImage(art['containment-pink'],th[0]-z/2,th[1]-80-z/2,z,z);g.restore();
  targets.forEach(([ex,ey],j)=>{
   const spread=(mobile?165:225)*(1-.7*v.purge);
   g.save();g.globalAlpha=strength*fade;
   for(let k=0;k<3;k++){
    g.strokeStyle=k===1?'#ffd5ea':P.pink;g.lineWidth=k===1?1.8:3.2;
    g.shadowColor=P.pink;g.shadowBlur=12;g.beginPath();g.moveTo(th[0]+18,th[1]-70);
    g.bezierCurveTo(th[0]+95,th[1]-185-k*14,ex-115,ey+75+k*13,ex,ey-55);g.stroke();
   }
   g.shadowBlur=0;g.translate(ex,ey-55);g.rotate((t-7)*.19*(j%2?-1:1));
   g.drawImage(art['containment-pink'],-spread/2,-spread/2,spread,spread);g.restore();
  });
 }
 // Readable battlefield event ribbon; anchored to the floor, clear of faces.
 const banner=t>=5&&t<7?['TOOL TIMEOUT',P.pink]:v.repair?[v.title,P.pink]:t>=13&&t<16?['RETRY 01 / VERIFY',P.cyan]:t>=16&&t<21?['PATCH VERIFIED',P.green]:null;
 if(banner){const bx=mobile?390:1134,by=mobile?799:583,bw=mobile?356:380;
  box(g,bx,by,bw,38,'#091016ed');box(g,bx,by,5,38,banner[1]);
  icon(g,t>=16?'check':'tool',t>=16?'green':'pink',bx+12,by+8,23);
  text(g,banner[0],bx+46,by+28,mobile?24:25,banner[1],'Anton');}
 if(t>=13&&t<18){const f=(t-13)/5;g.save();g.globalAlpha=.5*Math.sin(f*Math.PI);glowLine(g,[[k[0]-70,k[1]-150+f*170],[k[0]+100,k[1]-150+f*170]],P.green,3);g.restore();if(t>=16){icon(g,'check','green',k[0]+45,k[1]-90,40);}}
 if(t>=18&&t<21){const f=(t-18)/3,[gx,gy]=l.gate;g.save();g.globalAlpha=Math.sin(f*Math.PI)*.8;glowLine(g,[[w[0]+25,w[1]-70],[gx,gy]],P.orange,4);const z=(mobile?235:330)*(.8+.2*Math.sin(f*Math.PI));g.drawImage(art['impact-orange'],gx-z*.56,gy-z*.62,z,z);for(let j=0;j<6;j++){const z=(f+j/6)%1;ellipse(g,gx+Math.cos(j*1.1)*z*60,gy+Math.sin(j*1.1)*z*50,3,3,P.orange);}g.restore();icon(g,'cube','orange',w[0]+(gx-w[0])*ease(f)-15,w[1]+(gy-w[1])*ease(f)-25,30);}
 if(!mobile){
  for(const[name,label]of[['amiya','AMIYA / TOOL ROUTER'],['kaltsit',"KAL’TSIT / VERIFY"],['w','W / RELEASE']]){const[x,y]=l.feet[name];box(g,x-72,y-l.heights[name]-35,165,28,'#091016e8');box(g,x-72,y-l.heights[name]-35,3,28,colors[name]);text(g,label,x-62,y-l.heights[name]-15,12,P.white);}
 }
}
function ambient(g,l,t,mobile){
 const f=t/DURATION*Math.PI*2,v=visualAt(t);g.save();g.globalAlpha=v.repair?.9:.4;g.strokeStyle=P.pink;g.lineWidth=v.repair?3:1.6;g.shadowColor=P.pink;g.shadowBlur=v.repair?12:0;
 if(!mobile){for(let j=0;j<2;j++){g.beginPath();g.moveTo(50,750+j*45);g.bezierCurveTo(200,760+Math.sin(f+j)*24,470,465+j*60,810,585+j*10);g.stroke();}}
 else{g.beginPath();g.moveTo(480,320);g.bezierCurveTo(690,270+Math.sin(f)*12,740,410,670,470);g.stroke();}
 g.restore();
}
function syntax(g,s,x,y,size){
 const parts=s.split(/(\b(?:async|def|for|in|await|if|break|return)\b|\b(?:run|start|decide|execute|observe|checkpoint)\b|\b\d+\b)/g);
 g.font=`${size}px Menlo, monospace`;let p=x;
 for(const token of parts){const color=/^(async|def|for|in|await|if|break|return)$/.test(token)?P.orange:/^(run|start|decide|execute|observe|checkpoint)$/.test(token)?P.cyan:/^\d+$/.test(token)?P.pink:P.white;g.fillStyle=color;g.fillText(token,p,y);p+=g.measureText(token).width;}
}
function traceRows(t){return demo.events.filter(e=>e.at<=t);}
function colorFor(e){return e.type==='timeout'?'pink':e.type==='verified'?'green':e.type==='repair'?'orange':'cyan';}
function consoleDesktop(g,l,t){
 const s=atTime(t),v=visualAt(t),[x,y,w,h]=l.console;
 const accent=v.alert||v.repair?P.pink:s.verified?P.green:s.color;
 polygon(g,[[x,y+20],[x+22,y],[x+310,y],[x+334,y-22],[x+w-26,y-22],[x+w,y],[x+w,y+h],[x,y+h]]);g.fillStyle=P.panel;g.fill();g.strokeStyle=accent+'99';g.lineWidth=2;g.stroke();
 glowLine(g,[[x+8,y+18],[x+25,y+3],[x+310,y+3],[x+335,y-19],[x+w-28,y-19]],accent,2.5);
 text(g,'// BABEL / AGENT HARNESS',x+18,y+30,15,P.white);
 text(g,'TOOL ROUTER  /  CONTEXT  /  CHECKPOINT',x+560,y+30,13,P.muted);
 line(g,[[x+16,y+44],[x+w-16,y+44]],P.edge,1);
 const cx=x+20,cw=558;
 const focus=t>=5&&t<18;
 if(focus){
  const title=v.alert?'TOOL TIMEOUT':v.repair?v.title:t<16?'RETRY WITH PATCH':'PATCH VERIFIED';
  text(g,'tools.py / bounded recovery',cx,y+71,16,P.muted);
  text(g,title,cx,y+117,36,accent,'Anton');
  const rows=v.alert?[
   ['!','ToolTimeout: tools.run(task)',P.pink],
   [' ','context.observe(error)',P.white],
   [' ','route → repair policy',P.cyan]]:[
   ['−','retry_on_timeout = False',P.pink],
   ['+',t>=10?'retry_on_timeout = True':'# preparing bounded repair',t>=10?P.green:P.muted],
   [' ',t>=13?'await harness.execute(action)':'# preserve task + error context',P.cyan]];
  rows.forEach(([sign,row,color],i)=>{
   const yy=y+148+i*43;box(g,cx,yy,cw,38,i===0?'#ff4fa71b':i===1&&t>=10?'#9fdf6829':'#10212b');
   box(g,cx,yy,3,38,color);text(g,sign,cx+11,yy+26,23,color);text(g,row,cx+40,yy+26,21,color);
  });
  const steps=['TRACE','BIND','PATCH','CLEAR'];
  steps.forEach((label,i)=>{const xx=cx+i*141,done=v.repair?i<=v.step:t>=13;
   box(g,xx,y+289,132,43,done?accent+'25':P.night);text(g,label,xx+13,y+318,21,done?accent:P.muted,'Anton');
   box(g,xx,y+332,132,3,done?accent:P.edge);
  });
 }else{
  icon(g,'code','cyan',cx,y+53,20);text(g,'agent.py / offline ReAct',cx+29,y+70,16,P.cyan);
  const cy=y+101;box(g,cx-3,cy+(s.line-1)*27-21,cw,27,s.color+'32');box(g,cx-3,cy+(s.line-1)*27-21,4,27,s.color);
  CODE.forEach((row,i)=>{text(g,String(i+1).padStart(2,'0'),cx,cy+i*27,13,P.muted);syntax(g,row,cx+32,cy+i*27,20);});
  text(g,t>=18?'CHECKPOINT READY / CONTEXT PRESERVED':'BOUNDED LOOP / ONE RETRY MAX',cx,y+329,15,s.color);
 }
 const fx=x+594;line(g,[[fx-12,y+54],[fx-12,y+h-15]],P.edge,1);
 const flow=[['DECIDE','git-branch','decide'],['ACT','terminal-2','act'],['OBSERVE','eye','verify'],['REPAIR','tool','repair']];
 for(const[i,[label,ico,key]]of flow.entries()){
  const fy=y+62+i*69,active=s.key===key||(s.key==='deploy'&&key==='verify');
  box(g,fx,fy,139,58,active?accent+'33':P.night);g.save();g.strokeStyle=active?accent:P.edge;g.lineWidth=active?2:1;if(active){g.shadowColor=accent;g.shadowBlur=14;}g.strokeRect(fx,fy,139,58);g.restore();
  icon(g,ico,active?(v.repair?'pink':s.verified?'green':'cyan'):'white',fx+9,fy+15,24);text(g,label,fx+41,fy+35,21,active?accent:P.white,'Anton');
 }
 const tx=x+753,tw=w-770;
 text(g,'EXECUTION / CONTEXT',tx,y+72,14,P.muted);
 const rows=traceRows(t).slice(-4);
 rows.forEach((e,i)=>{const ry=y+111+i*43;box(g,tx,ry-16,3,33,P[colorFor(e)]);text(g,e.type.toUpperCase(),tx+12,ry,16,P[colorFor(e)]);const short={decide:'tools.run(task)',call:e.at===13?'retry 1 / 1':'tools.run(task)',timeout:'ToolTimeout',repair:'enable retry',verified:'test_tool_retry',checkpoint:'context saved'}[e.type];text(g,short,tx+12,ry+19,16,P.white);});
 box(g,tx,y+289,tw,54,accent+'21');text(g,s.verified?'PATCH VERIFIED':v.repair?'REPAIR / '+String(v.step+1).padStart(2,'0'):v.alert?'EXCEPTION CAUGHT':'HARNESS / ACTIVE',tx+9,y+314,20,accent,'Anton');
 box(g,tx+9,y+330,tw-18,4,P.edge);box(g,tx+9,y+330,(tw-18)*s.progress,4,accent);
}
function consoleMobile(g,l,t){
 const s=atTime(t),v=visualAt(t),[x,y,w,h]=l.console;box(g,x,y,w,h,P.panel);box(g,0,y,768,3,P.cyan);
 text(g,'BABEL / AGENT HARNESS',24,y+39,25,P.white,'Anton');icon(g,'terminal-2','cyan',712,y+16,27);
 const steps=['DECIDE','ACT','OBSERVE','REPAIR'];const active=s.key==='repair'?3:s.key==='act'?1:s.key==='decide'?0:2;
 steps.forEach((p,i)=>{const fx=24+i*181;box(g,fx,y+58,171,43,i===active?'#15333d':P.night);text(g,p,fx+14,y+88,30,i===active?s.color:P.muted,'Anton');box(g,fx,y+99,i===active?171*s.progress:0,2,s.color);});
 const snippet=s.key==='repair'?['# tools.py / retry policy','− retry_on_timeout = False',t>=10?'+ retry_on_timeout = True':'  # preparing bounded repair']:
 s.key==='checkpoint'?['# checkpoint / saved context','return harness.checkpoint(state)','# next iteration is ready']:
 s.verified?['# result / verified','if action.done: break','return harness.checkpoint(state)']:
 ['action = await agent.decide(state)','result = await harness.execute(action)','state = harness.observe(state, result)'];
 text(g,v.repair?v.title:v.alert?'TOOL TIMEOUT':'agent.py / ACTIVE CONTEXT',24,y+141,v.repair||v.alert?29:22,v.repair||v.alert?P.pink:P.cyan,'Anton');
 snippet.forEach((row,i)=>{if(v.repair){const color=i===1?P.pink:i===2&&t>=10?P.green:P.white;box(g,20,y+157+i*39,728,36,color+'16');text(g,row,28,y+181+i*39,30,color);}else syntax(g,row,24,y+181+i*39,30);});
 line(g,[[24,y+280],[744,y+280]],P.edge,1);
 const rows=traceRows(t).slice(-3);rows.forEach((e,i)=>{const fy=y+319+i*37;icon(g,e.type==='timeout'?'alert-triangle':e.type==='verified'?'check':'terminal-2',colorFor(e),24,fy-23,25);text(g,e.message,64,fy,26,P[colorFor(e)]);});
 box(g,24,y+434,720,40,P.night);text(g,v.repair?v.title+' / '+(v.step+1)+' OF 4':s.caption,37,y+463,27,s.color,'Anton');
}
function rails(g,l,t,mobile){
 const s=atTime(t),names=['theresa','amiya','kaltsit','w'],labels=['THERESA','AMIYA',"KAL’TSIT",'W'],colors=[P.pink,P.cyan,P.green,P.orange];
 names.forEach((name,i)=>{
  const x=mobile?i*192+10:l.rail[0],y=mobile?839:l.rail[1]+i*85,w=mobile?180:l.rail[2],h=mobile?65:78;
  const active=(name==='theresa'&&s.key==='repair')||(name==='amiya'&&s.key==='act')||(name==='kaltsit'&&s.key==='verify')||(name==='w'&&s.key==='deploy');
  box(g,x,y,w,h,P.night);fittedPortrait(g,name,x+2,y+2,mobile?58:w-4,mobile?h-4:56);box(g,x,y+h-3,w,3,colors[i]);
  if(active){g.save();g.strokeStyle=colors[i];g.lineWidth=4;g.shadowColor=colors[i];g.shadowBlur=14;g.strokeRect(x+2,y+2,w-4,h-4);g.restore();}
  text(g,labels[i],mobile?x+70:x+6,mobile?y+38:y+h-8,mobile?22:18,P.white,'Anton');
 });
}
function makeFrame(base,l,t,mobile){
 const c=createCanvas(l.width,l.height),g=c.getContext('2d');g.drawImage(base,0,0);battle(g,l,t,mobile);
 // Portrait stays in front of the architecture; lower console is the foremost plane.
 if(!mobile)g.drawImage(art['theresa-portrait'],...l.portrait);
 ambient(g,l,t,mobile);rails(g,l,t,mobile);
 (mobile?consoleMobile:consoleDesktop)(g,l,t);
 if(!mobile){box(g,0,991,322,33,P.paper);text(g,'BABEL × DOCJLM',26,1005,13,P.ink);text(g,'CODE CONNECTS WORLDS.',26,1020,10,'#536574');}
 return c;
}

const metrics={fps:FPS,frames:FRAME_COUNT,seconds:DURATION,phases:PHASES,demonstration:demo,rendering:'Spine 3.8.99 / source illustration layers / native code typography',outputs:{}};
for(const mobile of [false,true]){
 if(mobileArg&&!mobile||desktopArg&&mobile)continue;
 const key=mobile?'mobile':'desktop',l=layouts[key],name='babel-harness-'+key,dir=path.join(scratch,name);fs.mkdirSync(dir,{recursive:true});
 const base=background(l,mobile),first=makeFrame(base,l,0,mobile);
 if(!encodeOnly){
  fs.writeFileSync(path.join(out,name+'.png'),makeFrame(base,l,10.6,mobile).toBuffer('image/png'));
  for(const t of [0,5.6,10.6,16.8,19.6,23.5])fs.writeFileSync(path.join(dir,'proof-'+t+'.png'),makeFrame(base,l,t,mobile).toBuffer('image/png'));
  if(!onlyStill)for(let i=0;i<FRAME_COUNT;i++){
   const t=i/FPS,c=makeFrame(base,l,t,mobile);
   if(t>23){const g=c.getContext('2d');g.globalAlpha=ease(t-23);g.drawImage(first,0,0);}
   fs.writeFileSync(path.join(dir,String(i).padStart(3,'0')+'.png'),c.toBuffer('image/png'));
   if(i%60===0)console.log(name+': '+i+'/'+FRAME_COUNT+' frames');
  }
 }
 if(!onlyStill){
  const encoded=path.join(dir,'encoded.gif');
  const ff=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(dir,'%03d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=diff:max_colors=256[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',encoded],{encoding:'utf8'});if(ff.status!==0)throw Error(ff.stderr);
  const optimized=path.join(dir,'optimized.gif');const opt=spawnSync('gifsicle',['-O3','--lossy=20',encoded,'-o',optimized],{encoding:'utf8'});if(opt.status!==0)throw Error(opt.stderr);
  const bytes=fs.statSync(optimized).size;fs.copyFileSync(optimized,path.join(out,name+'.gif'));
  metrics.outputs[key]={width:l.width,height:l.height,bytes,target:mobile?12_000_000:20_000_000};console.log(name+': '+bytes+' bytes');
 }
}
if(!onlyStill){const file=path.join(out,'build-info.json');if(fs.existsSync(file)){const previous=JSON.parse(fs.readFileSync(file));metrics.outputs={...previous.outputs,...metrics.outputs};}fs.writeFileSync(file,JSON.stringify(metrics,null,2)+'\n');}
