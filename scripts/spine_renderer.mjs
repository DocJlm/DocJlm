// Offline Spine 3.8 renderer. Bone/mesh evaluation uses the upstream runtime;
// CPU canvas triangles replace the exporter's legacy native WebGL dependency.
import fs from 'node:fs';
import path from 'node:path';
import {createCanvas, loadImage} from '@napi-rs/canvas';
import {TextureAtlas, FakeTexture, AtlasAttachmentLoader, SkeletonBinary,
  Skeleton, RegionAttachment, MeshAttachment, ClippingAttachment,
  MixBlend, MixDirection} from '@node-spine-runtimes/core-3.8.99';

export async function loadActor(dir, base) {
  const image=await loadImage(path.join(dir,base+'.png'));
  const texture=createCanvas(image.width,image.height), tc=texture.getContext('2d');
  tc.drawImage(image,0,0);
  // Ark-Models distributes PMA textures. Canvas expects straight RGBA.
  const pixels=tc.getImageData(0,0,image.width,image.height);
  for(let i=0;i<pixels.data.length;i+=4){const a=pixels.data[i+3];
    if(a>0&&a<255)for(let k=0;k<3;k++)pixels.data[i+k]=Math.min(255,Math.round(pixels.data[i+k]*255/a));
  }
  tc.putImageData(pixels,0,0);
  const atlas=new TextureAtlas(fs.readFileSync(path.join(dir,base+'.atlas'),'utf8'),()=>new FakeTexture(texture));
  const data=new SkeletonBinary(new AtlasAttachmentLoader(atlas)).readSkeletonData(fs.readFileSync(path.join(dir,base+'.skel')));
  if(data.version!=='3.8.99')throw new Error('Unexpected Spine version: '+data.version);
  return {data,skeleton:new Skeleton(data),texture};
}

export function pose(actor,name,time) {
  const {skeleton,data}=actor, animation=data.findAnimation(name);
  if(!animation)throw new Error('Missing animation '+name);
  skeleton.setToSetupPose();
  animation.apply(skeleton,0,time,true,[],1,MixBlend.setup,MixDirection.mixIn);
  skeleton.updateWorldTransform();
}

export function mixPose(actor,name,time,alpha){
  actor.data.findAnimation(name).apply(actor.skeleton,0,time,true,[],alpha,MixBlend.replace,MixDirection.mixIn);
  actor.skeleton.updateWorldTransform();
}

function triangle(ctx,img,uv,v,indices){
  const [i,j,k]=indices.map(n=>n*2);
  const u0=uv[i]*img.width,w0=uv[i+1]*img.height;
  const u1=uv[j]*img.width,w1=uv[j+1]*img.height;
  const u2=uv[k]*img.width,w2=uv[k+1]*img.height;
  const d=(u1-u0)*(w2-w0)-(u2-u0)*(w1-w0);
  if(Math.abs(d)<1e-7)return;
  const a=((v[j]-v[i])*(w2-w0)-(v[k]-v[i])*(w1-w0))/d;
  const c=((u1-u0)*(v[k]-v[i])-(u2-u0)*(v[j]-v[i]))/d;
  const b=((v[j+1]-v[i+1])*(w2-w0)-(v[k+1]-v[i+1])*(w1-w0))/d;
  const e=((u1-u0)*(v[k+1]-v[i+1])-(u2-u0)*(v[j+1]-v[i+1]))/d;
  // Expand the clip by a subpixel to avoid anti-aliased cracks between mesh faces.
  const ids=[i,j,k], orientation=Math.sign((v[j]-v[i])*(v[k+1]-v[i+1])-(v[j+1]-v[i+1])*(v[k]-v[i]));
  if(!orientation)return;
  const normals=ids.map((n,z)=>{const m=ids[(z+1)%3],dx=v[m]-v[n],dy=v[m+1]-v[n+1],l=Math.hypot(dx,dy);return [orientation*dy/l,-orientation*dx/l];});
  const corners=ids.map((n,z)=>{const p=normals[(z+2)%3],q=normals[z],factor=Math.min(5,.65/Math.max(.01,1+p[0]*q[0]+p[1]*q[1]));return [v[n]+(p[0]+q[0])*factor,v[n+1]+(p[1]+q[1])*factor];});
  ctx.save();ctx.beginPath();ctx.moveTo(...corners[0]);ctx.lineTo(...corners[1]);ctx.lineTo(...corners[2]);ctx.closePath();ctx.clip();
  ctx.transform(a,b,c,e,v[i]-a*u0-c*w0,v[i+1]-b*u0-e*w0);
  ctx.drawImage(img,0,0);ctx.restore();
}

export function drawActor(ctx,actor,x,y,scale,flip=false){
  const {skeleton,texture}=actor;
  ctx.save();ctx.translate(x,y);ctx.scale(flip?-scale:scale,-scale);
  for(const slot of skeleton.drawOrder){
    const at=slot.getAttachment(); if(!at||!slot.bone.active)continue;
    if(at instanceof ClippingAttachment)throw new Error('Clipping attachment requires explicit support');
    let vertices,triangles;
    if(at instanceof RegionAttachment){vertices=new Float32Array(8);at.computeWorldVertices(slot.bone,vertices,0,2);triangles=[0,1,2,2,3,0];}
    else if(at instanceof MeshAttachment){vertices=new Float32Array(at.worldVerticesLength);at.computeWorldVertices(slot,0,at.worldVerticesLength,vertices,0,2);triangles=at.triangles;}
    else continue;
    const alpha=skeleton.color.a*slot.color.a*at.color.a;if(alpha<0.005)continue;
    ctx.globalAlpha=alpha;
    ctx.globalCompositeOperation=slot.data.blendMode===1?'lighter':'source-over';
    for(let t=0;t<triangles.length;t+=3)triangle(ctx,texture,at.uvs,vertices,[triangles[t],triangles[t+1],triangles[t+2]]);
  }
  ctx.restore();
}

export function bounds(actor){
  const offset={x:0,y:0,set(x,y){this.x=x;this.y=y;}},size={...offset};
  actor.skeleton.getBounds(offset,size);
  return {x:offset.x,y:offset.y,w:size.x,h:size.y};
}
