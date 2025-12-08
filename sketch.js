// ----------------------
// 地层数据（真实周口店+扩展字段）
// ----------------------
let layers = [
  {name:"Layer 1", type:"表土层", age:"近现代", top:131.00, bottom:129.50, density:[1.2,1.4], gravel:[0,2], moisture:[8,12], magnetic:[0.1,0.3], comp:"表层混合土壤", note:"受现代扰动明显"},
  {name:"Layer 2", type:"黄土状砂质粘土", age:"全新世", top:129.50, bottom:128.00, density:[1.4,1.6], gravel:[2,5], moisture:[10,14], magnetic:[0.2,0.5], comp:"粉砂与粘土混合", note:"局部风化"},
  {name:"Layer 3", type:"粘土夹砾石", age:"晚更新世", top:128.00, bottom:124.00, density:[1.6,1.9], gravel:[15,25], moisture:[12,18], magnetic:[0.5,0.8], comp:"砾石混入粘土", note:"沉积环境多变"},
  {name:"Layer 4", type:"灰黄色粉砂", age:"晚更新世", top:124.00, bottom:120.00, density:[1.4,1.7], gravel:[5,12], moisture:[9,15], magnetic:[0.3,0.6], comp:"粉砂沉积", note:"粒径均一"},
  {name:"Layer 5", type:"黑色堆积层", age:"中更新世", top:120.00, bottom:115.00, density:[1.5,1.8], gravel:[8,15], moisture:[14,20], magnetic:[0.6,1.0], comp:"富含有机质", note:"文化堆积痕迹"},
  {name:"Layer 6", type:"灰黑色洞穴堆积", age:"中更新世", top:115.00, bottom:110.00, density:[1.3,1.6], gravel:[10,20], moisture:[15,22], magnetic:[1.0,1.4], comp:"洞穴沉积", note:"动物活动迹象"},
  {name:"Layer 7", type:"灰黄色粉砂", age:"中更新世", top:110.00, bottom:107.00, density:[1.4,1.6], gravel:[3,10], moisture:[12,16], magnetic:[0.5,0.9], comp:"粉砂沉积", note:"分层清晰"},
  {name:"Layer 8", type:"灰褐色粘土", age:"中更新世", top:107.00, bottom:104.00, density:[1.6,1.9], gravel:[0,3], moisture:[14,19], magnetic:[0.7,1.1], comp:"粘土沉积", note:"压实度较高"},
  {name:"Layer 9", type:"浅黄色粘土", age:"早更新世", top:104.00, bottom:101.00, density:[1.5,1.8], gravel:[0,2], moisture:[11,15], magnetic:[0.9,1.3], comp:"风成粘土", note:"沉积速率低"},
  {name:"Layer 10", type:"灰褐色粉砂", age:"早更新世", top:101.00, bottom:99.00, density:[1.4,1.7], gravel:[3,8], moisture:[10,14], magnetic:[0.7,1.0], comp:"粉砂夹少量砂粒", note:"粒度略变"},
  {name:"Layer 11", type:"浅灰色砂层", age:"早更新世", top:99.00, bottom:97.00, density:[1.5,1.8], gravel:[5,12], moisture:[8,12], magnetic:[0.4,0.8], comp:"砂层", note:"透水性高"},
  {name:"Layer 12", type:"洞穴堆积", age:"早更新世", top:97.00, bottom:96.00, density:[1.3,1.5], gravel:[10,20], moisture:[16,22], magnetic:[1.1,1.5], comp:"洞穴沉积", note:"含碎骨与石屑"},
  {name:"Layer 13", type:"岩层基底", age:"更早", top:96.00, bottom:95.00, density:[2.0,2.4], gravel:[0,1], moisture:[1,3], magnetic:[0.2,0.4], comp:"基岩", note:"结构稳定"}
];

const maxElevation = 131.00;
const minElevation = 95.00;
const X_LEFT = 94.5;
const X_RIGHT = 118.5;

// 平滑变量
let smooth = { density:0,targetDensity:0, gravel:0,targetGravel:0, moisture:0,targetMoisture:0, magnetic:0,targetMagnetic:0 };
let lastUpdate = 0;
let interval = 300;

// 摄像头 & canvas 句柄
let cam;

function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  c.id('hudCanvas');
  c.style('position','absolute'); c.style('top','0px'); c.style('left','0px'); c.style('z-index','2'); c.style('background','transparent');
  textFont('monospace'); noCursor();

  // 初始化 smooth
  let L0 = layers[0];
  smooth.density   = (L0.density[0] + L0.density[1]) / 2;
  smooth.gravel    = (L0.gravel[0]  + L0.gravel[1])  / 2;
  smooth.moisture  = (L0.moisture[0]+ L0.moisture[1]) / 2;
  smooth.magnetic  = (L0.magnetic[0]+ L0.magnetic[1]) / 2;

  // 点击按钮启动摄像头
  const startBtn = document.getElementById('startCam');
  startBtn.addEventListener('click', async () => {
    await startCamera();
    startBtn.style.display = 'none';
  });
}

async function startCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    let backCamera = videoDevices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
    let deviceId = backCamera ? backCamera.deviceId : undefined;

    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: deviceId ? undefined : { exact: "environment" }
      },
      audio: false
    };

    cam = createCapture(constraints);
    cam.id('cameraElement');
    cam.elt.setAttribute('playsinline','');
    cam.elt.setAttribute('autoplay','');
    cam.style('position','absolute');
    cam.style('top','0px');
    cam.style('left','0px');
    cam.style('z-index','1');
    cam.style('object-fit','cover');
  } catch (e) {
    console.error("Camera error:", e);
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  if(cam) cam.size(windowWidth, windowHeight);
}

function findLayerByElevation(elev){
  for(let l of layers) if(elev<=l.top && elev>=l.bottom) return l;
  return layers[layers.length-1];
}

function draw(){
  clear();
  drawGrid();
  drawFrameLines();
  drawCrosshair();

  const cx = width/2;
  const cy = height/2;

  const elevation_center = map(cy,0,height,maxElevation,minElevation);
  const depth_center = maxElevation - elevation_center;
  const geoX_center = map(cx,0,width,X_LEFT,X_RIGHT);

  let currentLayer = findLayerByElevation(elevation_center);

  if(currentLayer && millis()-lastUpdate>interval){
    lastUpdate = millis();
    smooth.targetDensity   = random(currentLayer.density[0],currentLayer.density[1]);
    smooth.targetGravel    = random(currentLayer.gravel[0],currentLayer.gravel[1]);
    smooth.targetMoisture  = random(currentLayer.moisture[0],currentLayer.moisture[1]);
    smooth.targetMagnetic  = random(currentLayer.magnetic[0],currentLayer.magnetic[1]);
  }

  smooth.density  = lerp(smooth.density, smooth.targetDensity, 0.05);
  smooth.gravel   = lerp(smooth.gravel, smooth.targetGravel, 0.05);
  smooth.moisture = lerp(smooth.moisture, smooth.targetMoisture, 0.05);
  smooth.magnetic = lerp(smooth.magnetic, smooth.targetMagnetic, 0.05);

  let jitterX = (noise(frameCount*0.002)-0.5)*0.6;
  let jitterY = (noise(frameCount*0.002+1000)-0.5)*0.6;

  let displayElevation = elevation_center + jitterY;
  let displayX = geoX_center + jitterX;
  let displayDepth = maxElevation - displayElevation;

  drawHUD({
    elevation: displayElevation,
    depth: displayDepth,
    xCoord: displayX,
    layer: currentLayer,
    density: smooth.density,
    gravel: smooth.gravel,
    moisture: smooth.moisture,
    magnetic: smooth.magnetic
  });

  drawAnomalyIndicator(currentLayer);

  noStroke();
  fill(0,255,120,120);
  textAlign(CENTER); textSize(12);
  text("PLACE TARGET UNDER THE CROSSHAIR TO SCAN", width/2, height-18);
}

// ---------- 绘制函数 ----------
function drawGrid(){
  stroke(0,255,100,50);
  for(let x=0;x<width;x+=40) line(x,0,x,height);
  for(let y=0;y<height;y+=40) line(0,y,width,y);
}

function drawFrameLines(){
  stroke(0,255,80); strokeWeight(2);
  let m=20;
  line(m,m,m+60,m); line(m,m,m,m+60);
  line(width-m,m,width-m-60,m); line(width-m,m,width-m,m+60);
  line(m,height-m,m+60,height-m); line(m,height-m,m,height-m-60);
  line(width-m,height-m,width-m-60,height-m); line(width-m,height-m,width-m,height-m-60);
}

function drawCrosshair(){
  stroke(0,255,0); strokeWeight(2);
  let cx = width/2, cy = height/2;
  line(cx-20,cy,cx+20,cy);
  line(cx,cy-20,cx,cy+20);
  noFill();
  stroke(0,255,120,40); strokeWeight(1.5);
  ellipse(cx,cy,36+sin(millis()/400)*4,36+sin(millis()/400)*4);
}

function drawHUD(i){
  fill(0,255,100); textSize(12); textAlign(LEFT);
  let marginX=18, marginY=24;
  let t="";
  t+="SCAN DATA\n--------------------------------------\n";
  t+="Elevation:        "+i.elevation.toFixed(2)+" m\n";
  t+="Depth:            "+i.depth.toFixed(2)+" m\n";
  t+="X Coord:          "+i.xCoord.toFixed(2)+"\n";
  if(i.layer){
    t+="\nLAYER INFORMATION\n";
    t+="Layer:            "+i.layer.name+"\n";
    t+="Type:             "+i.layer.type+"\n";
    t+="Age:              "+i.layer.age+"\n";
    t+="Density:          "+i.density.toFixed(2)+" g/cm³\n";
    t+="Gravel Ratio:     "+i.gravel.toFixed(1)+" %\n";
    t+="Moisture:         "+i.moisture.toFixed(1)+" %\n";
    t+="Magnetic Susc.:   "+i.magnetic.toFixed(2)+"\n";
    t+="Composition:      "+i.layer.comp+"\n";
    t+="Note:             "+i.layer.note+"\n";
  }
  text(t, marginX, marginY);
}

function drawAnomalyIndicator(layer){
  let baseProb=0.002;
  if(!layer) layer={};
  if(layer.name && (layer.name.includes("Layer 4")||layer.name.includes("Layer 5")||layer.name.includes("Layer 6"))) baseProb=0.01;
  if(random()<baseProb){
    push();
    fill(255,200,50,180); noStroke();
    rect(width-140,20,120,36,6);
    fill(20); textSize(12); textAlign(LEFT);
    text("ANOMALY DETECTED", width-130,43);
    pop();
  }
}

