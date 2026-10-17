// Scroll-driven robot: the model builds up from a wireframe as the page scrolls, and the camera
// moves round it, one pose per section. Everything is driven by scroll position, so it plays at the
// reader's pace; with reduced motion the idle sway is off.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const canvas=document.getElementById('robot'),stage=canvas.parentElement;
const loader=document.getElementById('loader'),bar=document.getElementById('loaderBar'),loaderText=document.getElementById('loaderText');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fail=()=>{stage.classList.add('no-webgl');loader.classList.add('done');};

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch{fail();}
if(renderer)start();

function start(){
renderer.setClearColor(0x0b0f14,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.localClippingEnabled=true;

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x0b0f14,6,14);
const camera=new THREE.PerspectiveCamera(32,1,.05,50);

scene.add(new THREE.HemisphereLight(0xdfe8f2,0x1a2230,1.1));
const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(3,5,4);scene.add(key);
const rim=new THREE.DirectionalLight(0xf5b82e,1.4);rim.position.set(-4,2.5,-3);scene.add(rim);

// A floor of field tiles, faded out by the fog.
const grid=new THREE.GridHelper(12,20,0x2a3542,0x18212b);grid.position.y=0;scene.add(grid);

const robot=new THREE.Group();scene.add(robot);
const cut={solid:new THREE.Plane(new THREE.Vector3(0,-1,0),0),wire:new THREE.Plane(new THREE.Vector3(0,1,0),0)};
let size=new THREE.Vector3(1,1,1),loaded=false;

const gltfLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
gltfLoader.load('assets/input-output.glb',gltf=>{
  const model=gltf.scene;
  // Normalise: about 1 unit across, resting on the floor, centred.
  const box=new THREE.Box3().setFromObject(model);box.getSize(size);
  const scale=1/Math.max(size.x,size.z);model.scale.setScalar(scale);
  box.setFromObject(model);const c=box.getCenter(new THREE.Vector3());
  model.position.sub(new THREE.Vector3(c.x,box.min.y,c.z));
  box.setFromObject(model);box.getSize(size);
  const wire=new THREE.MeshBasicMaterial({color:0xf5b82e,wireframe:true,transparent:true,opacity:.07,clippingPlanes:[cut.wire],depthWrite:false});
  const wires=[];
  model.traverse(o=>{
    if(!o.isMesh)return;
    o.material=o.material.clone();o.material.clippingPlanes=[cut.solid];
    const w=new THREE.Mesh(o.geometry,wire);w.matrixAutoUpdate=false;wires.push([o,w]);
  });
  robot.add(model);model.updateMatrixWorld(true);
  for(const [o,w] of wires){w.matrix.copy(o.matrixWorld);robot.add(w);}
  loaded=true;loader.classList.add('done');
},xhr=>{
  if(xhr.total){const f=xhr.loaded/xhr.total;bar.style.width=`${Math.round(f*100)}%`;}
},()=>{loaderText.textContent='The 3D robot could not load.';fail();});

// One camera pose per section: azimuth and elevation (degrees), distance, and how high to look.
const poses=[
  {az:-35,el:14,dist:3.7,look:.16},   // hero
  {az:25,el:18,dist:3.1,look:.18},    // your CAD
  {az:90,el:10,dist:2.9,look:.17},    // physics: side on
  {az:160,el:22,dist:3.1,look:.18},   // the match: from behind
  {az:220,el:32,dist:3.3,look:.15},   // controls
  {az:300,el:52,dist:3.6,look:.12},   // privacy: from above
  {az:325,el:16,dist:3.7,look:.16},   // call to action
];
const steps=[...document.querySelectorAll('.step')];
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=(a,b,t)=>a+(b-a)*t;

/** Where we are between sections: 0 at the first, steps.length-1 at the last. */
function progress(){
  const mid=innerHeight*.5;
  let i=0;
  for(let k=0;k<steps.length;k++){const r=steps[k].getBoundingClientRect();if(r.top+r.height*.5<=mid)i=k;}
  const a=steps[i].getBoundingClientRect(),next=steps[i+1];
  if(!next)return i;
  const b=next.getBoundingClientRect();
  const from=a.top+a.height*.5,to=b.top+b.height*.5;
  return i+Math.min(1,Math.max(0,(mid-from)/(to-from)));
}

const current={az:poses[0].az,el:poses[0].el,dist:poses[0].dist,look:poses[0].look,build:0};
function target(){
  const p=progress(),i=Math.min(poses.length-2,Math.floor(p)),t=ease(Math.min(1,p-i));
  const a=poses[i],b=poses[i+1];
  return {az:lerp(a.az,b.az,t),el:lerp(a.el,b.el,t),dist:lerp(a.dist,b.dist,t),look:lerp(a.look,b.look,t),
    // The robot is fully built by the end of the second section.
    build:Math.min(1,Math.max(0,p/1.6))};
}

function resize(){
  const w=stage.clientWidth,h=stage.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio,w<760?1.5:1.75));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  // Text sits on the left on wide screens and at the bottom on narrow ones: shift the robot clear of it.
  // ?poster renders the robot centred, for the link-preview image.
  if(new URLSearchParams(location.search).has('poster'))camera.clearViewOffset();
  else if(w>=760)camera.setViewOffset(w,h,-w*.17,0,w,h);else camera.setViewOffset(w,h,0,h*.24,w,h);
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  if(!loaded)return;
  const goal=target(),k=1-Math.pow(.0015,Math.min(.1,clock.getDelta()));
  for(const key of Object.keys(current))current[key]=lerp(current[key],goal[key],k);
  const sway=reduced?0:Math.sin(performance.now()/4000)*3;
  const az=THREE.MathUtils.degToRad(current.az+sway),el=THREE.MathUtils.degToRad(current.el);
  const look=new THREE.Vector3(0,current.look*size.y*2.2,0);
  camera.position.set(look.x+current.dist*Math.cos(el)*Math.sin(az),look.y+current.dist*Math.sin(el),look.z+current.dist*Math.cos(el)*Math.cos(az));
  camera.lookAt(look);
  // Build height: the solid shows below it, the wireframe above.
  const h=lerp(-.01,size.y+.01,current.build);
  cut.solid.constant=h;cut.wire.constant=-h;
  renderer.render(scene,camera);
}
frame();
}
