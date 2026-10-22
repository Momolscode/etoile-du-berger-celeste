const PACKAGE='fr.etoileduberger.celeste';
const CERTIFICATE='829f8625b1dd17c852e2cbc99f0886b3bed5e504f9499b589f3445f00b0ac122';
const CATALOG='https://momolscode.github.io/ebc-app/android-version.json';
const REPOSITORY='https://github.com/Momolscode/ebc-app';

export function releaseFromCatalog(data){
  if(!data||Array.isArray(data)||data.schema!=='celeste-android-update/1'||data.package!==PACKAGE||data.certificatSHA256!==CERTIFICATE
    ||!Number.isSafeInteger(data.versionCode)||data.versionCode<11||data.versionCode>2147483647
    ||typeof data.versionName!=='string'||!/^\d+(?:\.\d+){1,3}$/.test(data.versionName)||data.versionName.length>32
    ||typeof data.apkSha256!=='string'||!/^[a-f0-9]{64}$/.test(data.apkSha256))throw Error('CATALOGUE_REFUSE');
  const tag=`celeste-${data.versionName}-code${data.versionCode}`;
  const expected=`${REPOSITORY}/releases/download/${tag}/Celeste-Android-${data.versionName}.apk`;
  if(data.apkUrl!==expected)throw Error('LIEN_APK_REFUSE');
  return Object.freeze({version:data.versionName,code:data.versionCode,url:expected,notes:`${REPOSITORY}/releases/tag/${tag}`,sha:data.apkSha256});
}

export async function refreshDownload({document,fetch,setTimeout=globalThis.setTimeout,clearTimeout=globalThis.clearTimeout}){
  const status=document.getElementById('version-status');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(CATALOG,{credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal,headers:{Accept:'application/json'}});
    if(!response.ok)throw Error('CATALOGUE_INDISPONIBLE');
    const declared=Number(response.headers?.get('content-length'));
    if(Number.isFinite(declared)&&declared>16384)throw Error('CATALOGUE_TROP_GRAND');
    const text=await response.text();if(new TextEncoder().encode(text).length>16384)throw Error('CATALOGUE_TROP_GRAND');
    const release=releaseFromCatalog(JSON.parse(text));
    const link=document.getElementById('telecharger-apk'),version=document.getElementById('apk-version'),notes=document.getElementById('notes-version'),sha=document.getElementById('apk-sha');
    if(!link||!version||!notes||!sha)throw Error('INTERFACE_INCOMPLETE');
    link.href=release.url;version.textContent=`Version ${release.version} · Android · fichier APK`;notes.href=release.notes;sha.textContent=release.sha;
    if(status)status.textContent='Version vérifiée dans le catalogue officiel.';
    return true;
  }catch{
    if(status)status.textContent='Vérification momentanément indisponible. Le lien conserve la dernière version connue indiquée ci-dessus.';
    return false;
  }finally{clearTimeout(timer);}
}

if(typeof document!=='undefined'&&typeof globalThis.fetch==='function'){
  void refreshDownload({document,fetch:globalThis.fetch.bind(globalThis)});
}
