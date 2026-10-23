import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {loadActor,pose,drawActor} from '../scripts/spine_renderer.mjs';

const dir='assets/source/squad';
const m=JSON.parse(fs.readFileSync(dir+'/manifest.json'));
for(const file of [...m.assets.flatMap(a=>a.files),...m.emblems]){
  assert.equal(createHash('sha256').update(fs.readFileSync(dir+'/'+file.file)).digest('hex'),file.sha256,'Original source must match pinned provenance');
}
// Verify actual local articulation at a fixed position, without translation.
for(const a of m.assets){
  const actor=await loadActor(dir+'/'+a.name,a.base),action=a.name==='theresa'?'C1_Idle':'Relax';
  const render=t=>{const c=createCanvas(320,320),g=c.getContext('2d');pose(actor,action,t);drawActor(g,actor,180,300,.6);return g.getImageData(0,0,320,320).data;};
  const first=render(0),later=render(.4);let changed=0;
  for(let i=0;i<first.length;i+=4)if(Math.abs(first[i]-later[i])+Math.abs(first[i+1]-later[i+1])+Math.abs(first[i+2]-later[i+2])+Math.abs(first[i+3]-later[i+3])>20)changed++;
  assert.ok(changed>100,a.name+' must visibly articulate in place');
  console.log(a.name+': '+changed+' changed pixels at a fixed position');
}

// Inspect GIF blocks directly: do not confuse a .gif extension with animation.
function inspectGif(b){
  assert.match(b.subarray(0,6).toString(),/^GIF8[79]a$/);const width=b.readUInt16LE(6),height=b.readUInt16LE(8);
  let p=13+((b[10]&128)?3*(2**((b[10]&7)+1)):0),frames=0,centiseconds=0;
  function subblocks(){while(b[p]!==0){const n=b[p++];p+=n;assert.ok(p<b.length);}p++;}
  while(p<b.length&&b[p]!==0x3b){const type=b[p++];
    if(type===0x21){const label=b[p++];if(label===0xf9)centiseconds+=b.readUInt16LE(p+2);subblocks();}
    else if(type===0x2c){const flags=b[p+8];p+=9;if(flags&128)p+=3*(2**((flags&7)+1));p++;subblocks();frames++;}
    else assert.fail('Malformed GIF block '+type);
  }
  assert.equal(b[p],0x3b);assert.ok(b.includes(Buffer.from('NETSCAPE2.0')));
  return {width,height,frames,seconds:centiseconds/100};
}
for(const [name,w,h,limit]of [['babel-desktop',1280,720,8_000_000],['babel-mobile',640,960,5_000_000]]){
  const b=fs.readFileSync('assets/squad/'+name+'.gif'),gif=inspectGif(b);
  assert.equal(gif.width,w);assert.equal(gif.height,h);assert.equal(gif.frames,180);assert.ok(Math.abs(gif.seconds-12)<.1);assert.ok(b.length<=limit,name+' exceeds size budget');
  const img=await loadImage('assets/squad/'+name+'.png');assert.equal(img.width,w);assert.equal(img.height,h);
  const c=createCanvas(w,h),g=c.getContext('2d');g.drawImage(img,0,0);const rgba=g.getImageData(0,0,w,h).data;
  for(let i=3;i<rgba.length;i+=4)assert.equal(rgba[i],255,'Static scene must be fully opaque');
  console.log(name,gif,b.length+' bytes');
}
const readme=fs.readFileSync('README.md','utf8');
assert.ok(readme.indexOf('https://www.zqcblog.com/')<readme.indexOf('02 / BABEL'));
assert.ok(readme.includes('(max-width: 600px) and (prefers-reduced-motion: reduce)'));
assert.ok(!fs.readFileSync('.github/workflows/profile-art.yml','utf8').includes('build:squad'));
console.log('PASS: source provenance, real in-place motion, GIF frames/duration/size, opaque static images and README integration.');
