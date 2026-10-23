// One clock drives every visible phase, action, code highlight and log event.
export const FPS=15, DURATION=24, FRAME_COUNT=FPS*DURATION;
export const PHASES=[
  {start:0,end:3,key:'decide',label:'DECIDE',color:'#00d5f5',line:4,caption:'SELECT THE NEXT ACTION'},
  {start:3,end:7,key:'act',label:'ACT',color:'#00d5f5',line:6,caption:'CALL TOOL / OBSERVE FAILURE'},
  {start:7,end:13,key:'repair',label:'REPAIR',color:'#ff4fa7',line:7,caption:'CONTAIN THE ERROR. REPAIR THE CALL.'},
  {start:13,end:18,key:'verify',label:'OBSERVE',color:'#9fdf68',line:6,caption:'RETRY / VERIFY THE RESULT'},
  {start:18,end:21,key:'deploy',label:'VERIFIED',color:'#ff6b28',line:5,caption:'PATCH VERIFIED / RELEASE'},
  {start:21,end:24,key:'checkpoint',label:'CHECKPOINT',color:'#00d5f5',line:8,caption:'SAVE CONTEXT / NEXT ITERATION'}
];
export function atTime(t){
 t=((t%DURATION)+DURATION)%DURATION;
 const phase=PHASES.find(p=>t>=p.start&&t<p.end);
 return {...phase,t,progress:(t-phase.start)/(phase.end-phase.start),error:t>=5&&t<16,patched:t>=10,verified:t>=16,reset:Math.max(0,(t-23)/1)};
}
export function actionAt(name,t){
 const s=atTime(t);
 const idle=name==='theresa'?'C1_Idle':'Idle';
 let action=idle,start=0,end=24;
 if(name==='amiya'&&t>=3&&t<7){action='Attack';start=3;end=7;}
 if(name==='theresa'&&t>=7&&t<13){action='C1_Skill_3';start=7;end=13;}
 if(name==='kaltsit'&&t>=13&&t<18){action='Attack';start=13;end=18;}
 if(name==='w'&&t>=18&&t<21){action='Skill_3';start=18;end=21;}
 const idleBlend=action===idle?0:Math.max(0,1-(t-start)/.18,1-(end-t)/.25);
 return {action,time:t-start,idle,idleBlend,reset:s.reset};
}
// Named cues are shared by battlefield containment and the readable patch panel.
// Progress describes this staged illustration, never live build telemetry.
export function visualAt(t){
 t=((t%DURATION)+DURATION)%DURATION;
 const smooth=(a,b)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
 const repair=t>=7&&t<13;
 const step=t<8.4?0:t<10?1:t<11.2?2:3;
 const titles=['TRACE THE FAILURE','BIND THE EXCEPTION','APPLY THE PATCH','ERROR CONTAINED'];
 return {repair,step,title:titles[step],charge:smooth(7,8.4),capture:smooth(8.4,10),
   patch:smooth(10,11.2),purge:smooth(11.2,13),
   attackPulse:t>=3&&t<7?Math.pow(Math.max(0,Math.sin(((t-3)%1.76666665)/1.76666665*Math.PI)),3):0,
   errorVisible:t>=3.5&&t<13,patchApplied:t>=10,contained:t>=13,
   alert:t>=5&&t<7,verified:t>=16};
}
export const CODE=[
 'async def run(task, harness, agent):',
 '  state = harness.start(task)',
 '  for _ in range(8):',
 '    action = await agent.decide(state)',
 '    if action.done: break',
 '    result = await harness.execute(action)',
 '    state = harness.observe(state, result)',
 '  return harness.checkpoint(state)'
];
