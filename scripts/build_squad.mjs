import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {loadActor,pose,mixPose,drawActor,bounds} from './spine_renderer.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'assets/source/squad'),art=path.join(root,'assets/source/operation');
const output=path.join(root,'assets/squad'),scratch=path.join(root,'.preview/squad');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
GlobalFonts.registerFromPath(path.join(root,'assets/source/fonts/BarlowCondensed-Bold.ttf'),'Barlow Condensed');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'))),actors={};
for(const a of manifest.assets)actors[a.name]=await loadActor(path.join(source,a.name),a.base);
const icons={};for(const n of ['bug','cube'])icons[n]=await loadImage(Buffer.from(fs.readFileSync(path.join(root,'assets/source/icons',n+'.svg'),'utf8').replaceAll('currentColor',n==='bug'?'#ff5a1f':'#00a7c8')));
const logos={};for(const n of ['babel','rhodes'])logos[n]=await loadImage(path.join(source,n+'.png'));
const FPS=15,COUNT=180,onlyStill=process.argv.includes('--still'),encodeOnly=process.argv.includes('--encode-only');
const P={paper:'#f7f9fa',ink:'#12161b',muted:'#596873',cyan:'#00d5f5',orange:'#ff5a1f',line:'#d3dce1'};
const steps=['BRANCH','DEBUG','BUILD','DEPLOY'];
function text(c,s,x,y,size=14,color=P.ink,font='monospace'){c.fillStyle=color;c.font=`${size}px ${font}`;c.fillText(s,x,y);}
function box(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}
function line(c,points,color=P.cyan,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
const layout={
 desktop:{width:1280,height:720,coords:{amiya:[267,486],theresa:[508,435],kaltsit:[749,394],w:[971,340]},heights:{amiya:196,theresa:232,kaltsit:194,w:186},
  route:[[170,568],[331,524],[362,504],[420,488],[468,480],[570,448],[600,462],[707,434],[798,390],[822,399],[904,363],[994,338],[1032,321],[1054,300]],
  gate:[[1002,210],[1074,249],[1074,347],[1002,307]],bug:[570,385],cube:[805,324],city:[[1160,115],[1200,80],[1220,185]],labels:{amiya:[202,527],theresa:[441,477],kaltsit:[684,434],w:[905,382]}},
 mobile:{width:640,height:960,coords:{amiya:[175,355],theresa:[375,320],kaltsit:[205,745],w:[440,680]},heights:{amiya:190,theresa:220,kaltsit:192,w:186},
  route:[[83,294],[203,257],[260,326],[308,362],[316,426],[289,499],[281,552],[251,569],[304,635],[316,681],[411,725],[485,704],[532,663],[554,636]],
  gate:[[499,517],[560,556],[560,668],[499,632]],bug:[443,273],cube:[250,583],city:[[540,93],[589,145],[552,237]],labels:{amiya:[104,394],theresa:[303,359],kaltsit:[128,788],w:[368,726]}}
};
const timeline={amiya:[[0,3,'Interact',3],[3,12,'Relax',9]],theresa:[[0,12,'C1_Idle',1]],kaltsit:[[0,6,'Relax',1],[6,9,'Interact',1],[9,12,'Relax',.45]],w:[[0,9,'Relax',2.25],[9,12,'Interact',2]]};
function state(name,t){const seg=timeline[name],i=seg.findIndex(a=>t>=a[0]&&t<a[1]),[start,end,action,cycles]=seg[i];return {action,time:actors[name].data.findAnimation(action).duration*(t-start)/(end-start)*cycles,next:seg[(i+1)%seg.length][2],blend:Math.max(0,(t-end+.3)/.3)};}
const neutral={};for(const name of Object.keys(actors)){pose(actors[name],name==='theresa'?'C1_Idle':'Relax',0);neutral[name]=bounds(actors[name]);}
function samplePath(points,p){const lengths=points.slice(1).map((v,i)=>Math.hypot(v[0]-points[i][0],v[1]-points[i][1]));let d=p*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const f=d/lengths[i];return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];}d-=lengths[i];}return points.at(-1);}
function drawStageFx(g,l,t){
 // Code-native data-route animation sits on the illustrated conduits; no live data implied.
 const phase=Math.floor(t/3),local=(t%3)/3;
 for(let j=0;j<3;j++){const [x,y]=samplePath(l.route,(t/12+j*.045)%1);g.save();g.globalAlpha=.7-j*.18;ellipse(g,x,y,5-j,3,P.cyan);g.restore();}
 // The energy membrane withdraws during deploy. Its frame remains part of the source illustration.
 g.save();polygon(g,l.gate);g.clip();const opening=phase===3?Math.sin(Math.PI*local):0;
 g.globalAlpha=.1*(1-opening);box(g,l.gate[0][0],l.gate[0][1],100,180,P.orange);
 g.globalAlpha=.32*(1-opening);for(let y=l.gate[0][1];y<l.gate[0][1]+180;y+=12)line(g,[[l.gate[0][0],y],[l.gate[0][0]+90,y]],P.orange,1);g.restore();
 if(phase===3){const a=l.gate[3],b=l.gate[1];g.save();g.globalAlpha=Math.sin(local*Math.PI);g.drawImage(icons.cube,a[0]-32+(b[0]-a[0]+44)*local,a[1]-24+(b[1]-a[1])*local,28,28);g.restore();g.save();g.globalAlpha=Math.sin(local*Math.PI)*.65;for(let i=0;i<l.city.length;i++){if(local>i*.15)ellipse(g,...l.city[i],3,5,P.orange);}g.restore();}
 const [bx,by]=l.bug;
 if(phase===1){const captured=local>.5,scale=captured?Math.max(.3,1-(local-.5)*1.4):1;
  g.save();g.globalAlpha=Math.sin(Math.min(1,local*5)*Math.PI/2);box(g,bx-8,by-8,44,44,'#f7f9faee');g.drawImage(icons.bug,bx+(1-scale)*14,by+(1-scale)*14,28*scale,28*scale);g.restore();}
 if(phase===2||phase===3){const [x,y]=l.cube,build=phase===2?Math.min(3,1+Math.floor(local*3)):3;for(let i=0;i<build;i++){g.save();g.globalAlpha=.85;g.drawImage(icons.cube,x,y-i*20,34,34);g.restore();}}
}
function frame(bg,l,t){const c=createCanvas(l.width,l.height),g=c.getContext('2d');g.drawImage(bg,0,0,l.width,l.height);const mobile=l.width===640;
 drawStageFx(g,l,t);
 // Back-to-front compositing, with per-model root offsets corrected to actual floor contact.
 for(const name of ['w','kaltsit','theresa','amiya']){const [x,y]=l.coords[name],b=neutral[name],scale=l.heights[name]/b.h,s=state(name,t);ellipse(g,x,y+2,l.heights[name]*.19,7,'#12161b30');pose(actors[name],s.action,s.time);if(s.blend>0)mixPose(actors[name],s.next,0,s.blend);drawActor(g,actors[name],x-(b.x+b.w/2)*scale,y+b.y*scale,scale);}
 // Legible station plaques are real UI text; the environment itself is raster source artwork.
 for(const [i,name]of ['amiya','theresa','kaltsit','w'].entries()){const [x,y]=l.labels[name],active=Math.floor(t/3)===i;box(g,x,y,144,30,'#f7f9faf2');box(g,x,y,4,30,active?(i===3?P.orange:P.cyan):P.ink);text(g,`${String(i+1).padStart(2,'0')} / ${steps[i]}`,x+12,y+21,20,P.ink,'Barlow Condensed');}
 box(g,0,0,l.width,65,'#f7f9faf5');box(g,22,18,4,31,P.orange);text(g,'OPERATION / COMPILE',37,40,mobile?30:32,P.ink,'Barlow Condensed');
 text(g,mobile?'BABEL × DOCJLM':'BABEL × DOCJLM   /   CODE CONNECTS WORLDS',mobile?390:740,37,mobile?14:16,P.muted);
 const footer=l.height-53;box(g,0,footer,l.width,53,'#f7f9faf5');const phase=Math.floor(t/3),progress=(t%3)/3;
 const status=['git switch -c curiosity','BUG CONTAINED.','build → learn → create','Ship something good.'][phase];
 text(g,`${steps[phase]} /`,22,footer+23,15,P.muted);text(g,status,mobile?115:130,footer+24,mobile?16:18,P.ink);
 text(g,'FAN-MADE LOOP · NOT LIVE TELEMETRY',22,footer+43,10,P.muted);
 const x=mobile?475:1040,w=mobile?140:210;box(g,x,footer+20,w,4,P.line);box(g,x,footer+20,w*(phase+progress)/4,4,phase===3?P.orange:P.cyan);
 // Original emblems are retained as discreet archive insignia.
 for(const [i,n]of ['babel','rhodes'].entries()){const x=l.width-70+i*29,y=footer+31;box(g,x,y,23,19,P.ink);g.drawImage(logos[n],x+3,y+1,17,17);}
 return c;
}
const metrics={fps:FPS,frames:COUNT,seconds:12,renderer:'Spine 3.8.99 + CPU mesh rasterizer over AI-assisted isometric scenery',animations:timeline,layout,outputs:{}};
for(const mobile of [false,true]){
 const name=mobile?'babel-mobile':'babel-desktop',dir=path.join(scratch,name),l=layout[mobile?'mobile':'desktop'];fs.mkdirSync(dir,{recursive:true});const bg=await loadImage(path.join(art,mobile?'scene-mobile.png':'scene-desktop.png'));
 for(let i=0;i<(encodeOnly?0:onlyStill?1:COUNT);i++){const bytes=frame(bg,l,i/FPS).toBuffer('image/png');fs.writeFileSync(path.join(dir,String(i).padStart(3,'0')+'.png'),bytes);if(i===0)fs.writeFileSync(path.join(output,name+'.png'),bytes);}
 if(!onlyStill){
  const encoded=path.join(dir,'encoded.gif');const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(FPS),'-i',path.join(dir,'%03d.png'),'-filter_complex',`[0:v]split[a][b];[a]palettegen=stats_mode=full:max_colors=${mobile?80:192}[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,'-loop','0',encoded],{encoding:'utf8'});
  if(result.status!==0)throw new Error('GIF encode failed: '+result.stderr);
  const optimized=path.join(dir,'optimized.gif');const opt=spawnSync('gifsicle',['-O3',mobile?'--lossy=45':'--lossy=35',encoded,'-o',optimized],{encoding:'utf8'});if(opt.status!==0)throw new Error('Gifsicle failed: '+(opt.stderr||opt.error));
  if(fs.statSync(optimized).size>(mobile?5_000_000:8_000_000))throw new Error(name+' exceeds encoded size budget: '+fs.statSync(optimized).size);
  fs.copyFileSync(optimized,path.join(output,name+'.gif'));metrics.outputs[name]={width:l.width,height:l.height,bytes:fs.statSync(optimized).size};
 }
 console.log('Built',name,metrics.outputs[name]||'still preview');
}
if(!onlyStill)fs.writeFileSync(path.join(output,'build-info.json'),JSON.stringify(metrics,null,2)+'\n');
