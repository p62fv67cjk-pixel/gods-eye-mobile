(()=>{
  const style=document.createElement('style');
  style.textContent=`
    #cameraCard{overflow:hidden}
    #cameraCard img{display:block;transition:.2s opacity}
    #cameraCard img.is-hidden{display:none}
    .camUnavailable{height:120px;border-radius:15px;display:none;place-items:center;text-align:center;padding:18px;background:linear-gradient(145deg,rgba(121,242,208,.08),rgba(139,197,255,.06));border:1px solid rgba(255,255,255,.08);color:#aeb8c6;font-size:13px}
    .camUnavailable.show{display:grid}
    .camMeta{display:flex;align-items:center;gap:8px;margin:10px 3px 2px}.camBadge{width:9px;height:9px;border-radius:50%;background:#79f2d0;box-shadow:0 0 12px rgba(121,242,208,.65)}
  `;
  document.head.appendChild(style);

  const card=$('cameraCard');
  let fallback=document.getElementById('cameraUnavailable');
  if(!fallback){fallback=document.createElement('div');fallback.id='cameraUnavailable';fallback.className='camUnavailable';fallback.innerHTML='<div><b>Snapshot temporarily unavailable</b><br><span style="opacity:.75">The camera pin is live, but this image is not responding right now.</span></div>';const img=$('cameraImage');img.insertAdjacentElement('afterend',fallback)}

  camProps=function(entity){
    if(!entity)return null;
    if(entity._cameraRaw)return entity._cameraRaw;
    const raw=entity.properties?._raw;
    if(raw?.getValue){try{return raw.getValue(Cesium.JulianDate.now())}catch(_){return null}}
    return raw||null;
  };

  function setCameraImage(url){
    const img=$('cameraImage');
    fallback.classList.remove('show');
    img.classList.remove('is-hidden');
    img.onerror=()=>{img.classList.add('is-hidden');fallback.classList.add('show')};
    img.onload=()=>{img.classList.remove('is-hidden');fallback.classList.remove('show')};
    if(!url){img.removeAttribute('src');img.classList.add('is-hidden');fallback.classList.add('show');return}
    img.src=url+(url.includes('?')?'&':'?')+'t='+Date.now();
  }

  showCamera=function(entity){
    const p=camProps(entity);if(!p)return;
    selectedCamera=p;
    $('cameraTitle').textContent=p.title||'Public traffic camera';
    $('cameraViewText').textContent=p.view||p.region||'Transport for NSW';
    setCameraImage(p.href||p.image||'');
    card.classList.add('show');
  };

  addCameraFeature=function(f){
    const c=f?.geometry?.coordinates;if(!c)return;
    const lon=Number(c[0]),lat=Number(c[1]),p=f.properties||{};
    if(!Number.isFinite(lon)||!Number.isFinite(lat))return;
    const e=viewer.entities.add({
      position:Cesium.Cartesian3.fromDegrees(lon,lat,26),
      point:{
        pixelSize:13,
        color:Cesium.Color.fromCssColorString('#79f2d0'),
        outlineColor:Cesium.Color.fromCssColorString('rgba(255,255,255,.95)'),
        outlineWidth:2,
        disableDepthTestDistance:Number.POSITIVE_INFINITY,
        distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,30000000),
        scaleByDistance:new Cesium.NearFarScalar(2500,1.45,18000000,.75)
      }
    });
    e._cameraRaw=p;
    cameraEntities.push(e);
  };

  loadPublicCameras=async function(){
    clearCameras();$('camCount').textContent='Loading…';
    try{
      const r=await fetch(`./data/cameras.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
      const d=await r.json();(d.features||[]).forEach(addCameraFeature);cameraDataLoaded=true;
      $('camCount').textContent=`${cameraEntities.length} cameras on map`;
      viewer.scene.requestRender();toast(`${cameraEntities.length} camera pins ready`);
    }catch(e){console.error(e);$('camCount').textContent='Could not load camera data';toast('Camera data could not load',3800)}
  };

  $('refreshCam').onclick=()=>{if(selectedCamera)setCameraImage(selectedCamera.href||selectedCamera.image||'')};
  $('openCamSource').onclick=()=>{const u=selectedCamera?.href||selectedCamera?.image;if(u)window.open(u,'_blank','noopener,noreferrer');else window.open('https://www.livetraffic.com/','_blank','noopener,noreferrer')};

  setTimeout(()=>{if(viewer)loadPublicCameras()},300);
})();
