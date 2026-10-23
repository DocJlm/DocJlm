import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {loadActor,pose,drawActor} from '../scripts/spine_renderer.mjs';
import {atTime,actionAt,visualAt,DURATION,FPS,FRAME_COUNT} from '../scripts/harness_timeline.mjs';

const m=JSON.parse(fs.readFileSync('assets/source/battle/manifest.json'));
for(const f of [...m.assets.flatMap(a=>a.files),...m.portraits])assert.equal(createHash('sha256').update(fs.readFileSync('assets/source/battle/'+f.file)).digest('hex'),f.sha256);
const original=JSON.parse(fs.readFileSync('assets/source/squad/manifest.json'));
for(const f of [...original.assets.find(a=>a.name==='theresa').files,...original.emblems])assert.equal(createHash('sha256').update(fs.readFileSync('assets/source/squad/'+f.file)).digest('hex'),f.sha256);
for(const f of JSON.parse(fs.readFileSync('assets/source/harness/manifest.json')).assets)assert.equal(createHash('sha256').update(fs.readFileSync('assets/source/harness/'+f.file)).digest('hex'),f.sha256);
for(const[name,id,dir,action]of [['amiya','char_002_amiya','battle','Attack'],['kaltsit','char_003_kalts','battle','Attack'],['w','char_113_cqbw','battle','Skill_3'],['theresa','enemy_3007_lrssia','squad','C1_Skill_3']]){
 const actor=await loadActor(`assets/source/${dir}/${name}`,id);
 const render=t=>{const c=createCanvas(400,400),g=c.getContext('2d');pose(actor,action,t);drawActor(g,actor,200,350,.65);return g.getImageData(0,0,400,400).data;};
 const a=render(.1),b=render(.6);let changed=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>20)changed++;
 assert.ok(changed>100,`${name}: actual articulation required`);console.log(name,action,changed+' articulated pixels');
}
for(const[t,key]of [[0,'decide'],[3,'act'],[7,'repair'],[13,'verify'],[18,'deploy'],[21,'checkpoint'],[24,'decide']])assert.equal(atTime(t).key,key);
assert.equal(atTime(5).error,true);assert.equal(atTime(15).verified,false);assert.equal(atTime(16).verified,true);
assert.equal(actionAt('amiya',4).action,'Attack');assert.equal(actionAt('theresa',8).action,'C1_Skill_3');assert.equal(actionAt('w',19).action,'Skill_3');
// Containment may precede verification, but a patch must precede clearing errors.
assert.equal(visualAt(5.6).alert,true);
assert.equal(visualAt(7.5).step,0);assert.equal(visualAt(9).step,1);
assert.equal(visualAt(9.9).patchApplied,false);assert.equal(visualAt(10).patchApplied,true);
assert.equal(visualAt(10.6).step,2);assert.equal(visualAt(12).step,3);
assert.equal(visualAt(10.9).purge,0);assert.ok(visualAt(12).purge>0);
assert.equal(visualAt(13).errorVisible,false);assert.equal(visualAt(13).verified,false);
assert.equal(visualAt(16).verified,true);assert.deepEqual(visualAt(24),visualAt(0));
function inspectGif(b){
 assert.match(b.subarray(0,6).toString(),/^GIF8[79]a$/);const width=b.readUInt16LE(6),height=b.readUInt16LE(8);
 let p=13+((b[10]&128)?3*(2**((b[10]&7)+1)):0),frames=0,cs=0;
 function blocks(){while(b[p]!==0){const n=b[p++];p+=n;assert.ok(p<b.length);}p++;}
 while(p<b.length&&b[p]!==0x3b){const type=b[p++];if(type===0x21){const label=b[p++];if(label===0xf9)cs+=b.readUInt16LE(p+2);blocks();}else if(type===0x2c){const flags=b[p+8];p+=9;if(flags&128)p+=3*(2**((flags&7)+1));p++;blocks();frames++;}else assert.fail('Invalid GIF block');}
 assert.equal(b[p],0x3b);assert.ok(b.includes(Buffer.from('NETSCAPE2.0')));return{width,height,frames,seconds:cs/100};
}
for(const[key,w,h]of [['desktop',1536,1024],['mobile',768,1408]]){
 const name='assets/harness/babel-harness-'+key,b=fs.readFileSync(name+'.gif'),gif=inspectGif(b);assert.equal(gif.width,w);assert.equal(gif.height,h);assert.equal(gif.frames,FRAME_COUNT);assert.ok(Math.abs(gif.seconds-DURATION)<.1);
 const im=await loadImage(name+'.png');assert.equal(im.width,w);assert.equal(im.height,h);const c=createCanvas(w,h),g=c.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,w,h).data;for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255);
 console.log(key,gif,b.length+' bytes');
}
const readme=fs.readFileSync('README.md','utf8');assert.ok(readme.indexOf('babel-harness-desktop.gif')<readme.indexOf('https://www.zqcblog.com/'));
assert.ok(!readme.includes('assets/squad/'));assert.ok(!readme.includes('assets/hero/'));assert.ok(readme.includes('(max-width: 600px) and (prefers-reduced-motion: reduce)'));
assert.ok(!fs.readFileSync('.github/workflows/profile-art.yml','utf8').includes('build:harness'));
console.log('PASS: provenance, combat articulation, shared timeline, 24-second GIFs, static opacity and README integration.');
