// WebGL-скульптура соединения: два объёмных звена в цветах OZON и CDEK.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
// Замкнутое звено с закруглёнными внешним и внутренним контурами.
function linkGeometry(size,band,depth){
 const shape=new THREE.Shape();
 const draw=(path,half,radius)=>{path.moveTo(-half+radius,-half);path.lineTo(half-radius,-half);path.quadraticCurveTo(half,-half,half,-half+radius);path.lineTo(half,half-radius);path.quadraticCurveTo(half,half,half-radius,half);path.lineTo(-half+radius,half);path.quadraticCurveTo(-half,half,-half,half-radius);path.lineTo(-half,-half+radius);path.quadraticCurveTo(-half,-half,-half+radius,-half);};
 draw(shape,size/2,.6);const hole=new THREE.Path();draw(hole,size/2-band,.33);shape.holes.push(hole);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:8,steps:1,bevelSize:.075,bevelThickness:.075,curveSegments:32});geometry.translate(0,0,-depth/2);geometry.computeVertexNormals();return geometry;
}
// Сцена останавливается вне экрана и в скрытой вкладке; reduced motion оставляет статичный кадр.
export function initScene(container,variant='links'){
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xf5f6f8,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=variant==='links';renderer.shadowMap.type=THREE.PCFShadowMap;renderer.domElement.setAttribute('aria-hidden','true');container.prepend(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(1.8,3.1,11.8);camera.lookAt(0,0,0);
 const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.04).texture;environment.dispose();pmrem.dispose();
 scene.environmentIntensity=.6;scene.add(new THREE.HemisphereLight(0xffffff,0x8190ad,.6));
 const key=new THREE.DirectionalLight(0xffffff,2.7);key.position.set(variant==='links'?0:-4,variant==='links'?14:7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.04;key.shadow.radius=6;key.shadow.blurSamples=12;scene.add(key);
 const fill=new THREE.DirectionalLight(0xc8deff,.9);fill.position.set(5,1,2);scene.add(fill);
 const sculpture=new THREE.Group();sculpture.rotation.set(.05,-.2,-.22);scene.add(sculpture);
 const material=color=>new THREE.MeshPhysicalMaterial({color,metalness:.05,roughness:.3,clearcoat:.4,clearcoatRoughness:.25});
 let flow;
 if(variant==='links'){
  // Match the DPD composition: two perpendicular, interlocked ring planes.
  const tilt=-.95,halfSeparation=.7;
  const blue=new THREE.Mesh(linkGeometry(3.5,.7,.7),material(0x005bff));blue.position.x=-halfSeparation;blue.rotation.x=tilt;blue.castShadow=true;blue.receiveShadow=true;sculpture.add(blue);
  const green=new THREE.Mesh(linkGeometry(3.5,.7,.7),material(0x00b33c));green.position.x=halfSeparation;green.rotation.x=tilt+Math.PI/2;green.castShadow=true;green.receiveShadow=true;sculpture.add(green);
  sculpture.rotation.z=-.38;
 }else if(variant==='parcel'){
  const box=new THREE.Mesh(new RoundedBoxGeometry(2.8,2.5,2.5,4,.16),material(0xffffff));sculpture.add(box);
  const tape=new THREE.Mesh(new RoundedBoxGeometry(.48,2.53,2.53,3,.04),material(0x00b33c));sculpture.add(tape);
  const label=new THREE.Mesh(new RoundedBoxGeometry(.95,.65,.04,2,.06),material(0x005bff));label.position.set(-.75,-.35,1.27);sculpture.add(label);
  sculpture.rotation.set(.15,.4,-.18);
 }else{
  flow=new MarchingCubes(48,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.22,metalness:.08,clearcoat:.6}),false,true,15000);
  flow.scale.setScalar(5.5);sculpture.add(flow);
 }
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.7;floor.receiveShadow=true;scene.add(floor);
 let visible=true,frame=0,targetX=0,targetY=0,currentX=0,currentY=0,velocityX=0,velocityY=0,lastTime=0,elapsed=0,drag=null;
 const baseY=variant==='parcel'?.4:-.2,baseX=variant==='parcel'?.15:.05;
 const mobile=matchMedia('(max-width:600px)');
 function pose(time){
  const sway=mobile.matches?.2:.16;
  sculpture.rotation.y=baseY+currentX+Math.sin(time*.7)*sway;sculpture.rotation.x=baseX+currentY+Math.sin(time*.55)*.06;
  sculpture.position.y=Math.sin(time*1.2)*(mobile.matches?.23:.19);
  if(flow){flow.reset();const distance=.135+Math.sin(time*.8)*.065;flow.addBall(.5-distance,.5,.5,1.2,12,new THREE.Color(0x005bff));flow.addBall(.5+distance,.5+Math.sin(time*.8)*.025,.5,1.2,12,new THREE.Color(0x00b33c));flow.update();}
 }
 // Камера следует пропорциям контейнера, без скачков внешней разметки.
 function resize(){
  const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;
  const desktopLinks=variant==='links'&&matchMedia('(min-width:1001px)').matches;
  const shadowSpace=desktopLinks?64:0;
  renderer.setSize(width,height+shadowSpace);
  camera.aspect=width/height;
  camera.zoom=desktopLinks?Math.max(1,Math.min(1.22,camera.aspect/.95)):1;
  camera.position.z=variant==='links'?Math.max(12,10/camera.aspect):Math.max(8,(variant==='flow'?13:8.1)/camera.aspect);
  if(shadowSpace)camera.setViewOffset(width,height,0,0,width,height+shadowSpace);else camera.clearViewOffset();
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();pose(elapsed);renderer.render(scene,camera);
 }
 new ResizeObserver(resize).observe(container);resize();container.classList.add('scene-ready');
 const canvas=renderer.domElement;
 // Horizontal touch drag has bounded rubber resistance; vertical page scrolling stays native.
 canvas.addEventListener('pointerdown',event=>{if(reduced.matches||event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);container.classList.add('dragging');});
 canvas.addEventListener('pointermove',event=>{if(reduced.matches)return;if(drag){targetX=Math.tanh((event.clientX-drag.x)/150)*.65;targetY=Math.tanh((event.clientY-drag.y)/150)*.25;}else if(event.pointerType==='mouse'){const rect=canvas.getBoundingClientRect();targetX=((event.clientX-rect.left)/rect.width-.5)*.2;targetY=((event.clientY-rect.top)/rect.height-.5)*.12;}});
 function release(){drag=null;targetX=targetY=0;container.classList.remove('dragging');}
 ['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(event=>canvas.addEventListener(event,release));
 function render(time){if(!visible||document.hidden||reduced.matches){frame=0;lastTime=0;return;}const dt=Math.min((time-(lastTime||time))/1000,.032);lastTime=time;elapsed+=dt;
  // Damped spring (mass 1, stiffness 100, damping 10) carries velocity through release.
  velocityX+=((targetX-currentX)*100-velocityX*10)*dt;velocityY+=((targetY-currentY)*100-velocityY*10)*dt;currentX+=velocityX*dt;currentY+=velocityY*dt;
  pose(elapsed);renderer.render(scene,camera);frame=requestAnimationFrame(render);
 }
 function resume(){if(reduced.matches){release();currentX=currentY=velocityX=velocityY=0;pose(0);}if(!frame&&!reduced.matches&&visible&&!document.hidden)frame=requestAnimationFrame(render);else renderer.render(scene,camera);}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}resume();},{threshold:.02}).observe(container);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resume();
}
