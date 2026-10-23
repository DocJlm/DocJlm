import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||path.join(repo,'preview.html'));
let html=marked.parse(fs.readFileSync(path.join(repo,'README.md'),'utf8'));
html=html.replace(/https:\/\/raw.githubusercontent.com\/DocJlm\/DocJlm\/output\/([^"\s]+)/g,(_,name)=>'assets/generated/'+name);
html=html.replace(/(src|srcset)="(assets\/[^\"]+)"/g,(_,attr,p)=>{
 const mime={'.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.webp':'image/webp'}[path.extname(p)];
 if(!mime)throw new Error('Unsupported image type: '+p);
 const bytes=fs.readFileSync(path.join(repo,p));
 const still=p.endsWith('github-snake.svg')?' data-static-src="data:image/svg+xml;base64,'+Buffer.from(bytes.toString().replace('</svg>','<style>*{animation:none!important}</style></svg>')).toString('base64')+'"':'';
 return attr+'="data:'+mime+';base64,'+bytes.toString('base64')+'"'+still;
});
html=html.replaceAll('href="CREDITS.md"','href="#credits"');
const css=(theme)=>fs.readFileSync(path.join(repo,'node_modules/github-markdown-css/github-markdown-'+theme+'.css'),'utf8');
const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DocJlm — BABEL / AGENT HARNESS</title>
<style id="light-css">${css('light')}</style><style id="dark-css" media="not all">${css('dark')}</style>
<style>*{box-sizing:border-box}body{margin:0;background:#eef2f4;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#12161b}header{padding:18px 24px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:1100px;margin:auto}header strong{margin-right:auto;font-size:14px}button,select{background:#fff;border:1px solid #ccd6dc;border-radius:7px;padding:8px 11px;color:#22323d;font:inherit;font-size:13px;cursor:pointer}button[aria-pressed=true]{background:#007e99;color:white}.note{max-width:1000px;margin:0 auto;padding:0 24px 16px;font-size:12px;line-height:1.6;color:#596873}article{padding:32px;border:1px solid #d1d9e0;border-radius:8px;max-width:960px;width:calc(100% - 32px)}article[data-size=mobile]{width:375px;padding:16px}article[data-size=small]{width:320px;padding:16px}body.dark{background:#10161c;color:#e5edf1}body.dark .note{color:#a8bdc8}body.dark article{border-color:#34424c}.markdown-body{margin:0 auto 24px;max-width:min(960px,calc(100% - 16px))}.markdown-body img{height:auto}#credits{max-width:960px;padding:20px;margin:0 auto 20px;font-size:12px;line-height:1.6;color:inherit}#credits a{color:inherit}@media(max-width:600px){article{padding:16px;width:calc(100% - 16px)}header{padding:16px}}</style></head>
<body><header><strong>DOCJLM / AGENT HARNESS</strong><button id="light" aria-pressed="true">Light background</button><button id="dark" aria-pressed="false">Dark background</button><button id="desktop" aria-pressed="true">Desktop</button><button id="mobile" aria-pressed="false">375px</button><button id="small" aria-pressed="false">320px</button><label><select id="motion" aria-label="Motion preference"><option value="system">Motion: system</option><option value="animate">Motion: on</option><option value="reduce">Reduced motion</option></select></label></header><p class="note">Archived local preview · fixed white-and-charcoal artwork in both backgrounds. This retains the pre-publication calendar snapshot from 2026-10-22; unavailable statistics are labelled explicitly. The published profile now has complete daily statistics: <a href="https://github.com/DocJlm">View live GitHub profile ↗</a>.</p><article class="markdown-body" data-size="desktop">${html}</article><aside id="credits">Character artwork © Hypergryph. <a href="https://www.bilibili.com/opus/920244864025624583">Reference provenance</a>. The portrait and scenery are AI-assisted fan artwork. The squad uses original Spine combat animations. A deterministic offline harness drives a 24-second tool-failure, repair and verification story; it is not a live agent session. Static alternatives respect reduced motion. Full credits and maintenance instructions are included in the source package.</aside>
<script>
const article=document.querySelector('article');
const sources=[...document.querySelectorAll('picture source')];
for(const s of sources)s.dataset.originalMedia=s.media;
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
function syncPictures(){const small=article.getBoundingClientRect().width<=600;const v=document.getElementById('motion').value;const reduced=v==='system'?systemMotion.matches:v==='reduce';for(const s of sources){const m=s.dataset.originalMedia;const matches=(!m.includes('max-width')||small)&&(!m.includes('reduced-motion')||reduced);s.media=matches?'all':'not all';}for(const img of document.querySelectorAll('img[data-static-src]')){img.dataset.animatedSrc ||= img.src;const src=reduced?img.dataset.staticSrc:img.dataset.animatedSrc;if(img.src!==src)img.src=src;}}
systemMotion.addEventListener('change',syncPictures);
function theme(value){document.body.classList.toggle('dark',value==='dark');document.getElementById('dark-css').media=value==='dark'?'all':'not all';document.getElementById('light-css').media=value==='light'?'all':'not all';for(const n of ['light','dark'])document.getElementById(n).setAttribute('aria-pressed',String(n===value));}
function size(value){article.dataset.size=value;for(const n of ['desktop','mobile','small'])document.getElementById(n).setAttribute('aria-pressed',String(n===value));syncPictures();}
for(const n of ['light','dark'])document.getElementById(n).onclick=()=>theme(n);
for(const n of ['desktop','mobile','small'])document.getElementById(n).onclick=()=>size(n);
document.getElementById('motion').onchange=syncPictures;
new ResizeObserver(syncPictures).observe(article);
theme('light');syncPictures();
</script></body></html>`;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,page);
console.log('Built offline preview:',output);
