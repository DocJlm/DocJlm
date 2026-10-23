// Produce responsive static heroes from the selected, AI-assisted source compositions.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [source,name,width] of [['hero-desktop.png','theresa-light.png',1600],['hero-mobile.png','theresa-mobile.png',720]]){
 const img=await loadImage(path.join(root,'assets/source/operation',source));
 const canvas=createCanvas(width,Math.round(img.height*width/img.width)),ctx=canvas.getContext('2d');
 ctx.fillStyle='#f7f9fa';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 fs.writeFileSync(path.join(root,'assets/hero',name),canvas.toBuffer('image/png'));
 console.log(name,canvas.width,canvas.height);
}
