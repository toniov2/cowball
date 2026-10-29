function boot() {
'use strict';
const APP_VERSION = '1.9.2';
// ===== Об авторе (ссылки добавить сюда: { label:'TikTok', url:'https://...' }) =====
const AUTHOR = { name: 'собачка Тонио В2', handle: 'Тонио_В2', links: [] };

// ================== Утилиты ==================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const norm = (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hex = n => '#' + n.toString(16).padStart(6, '0');
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// ================== Константы поля ==================
let fieldVisualScale = 1;
let W = 800, H = 450, FX = 20, FY = 10, FW = 760, FH = 430, GH = 150;
const CR = 17, BR = 6, S = 0.05;
const wx = x => (x - W / 2) * S, wz = y => (y - H / 2) * S;

// ================== Настройки ==================
const DEF = {
  time: 90, diff: 1, size: 5, power: true, autoSwitch: true, assist: true, comment: true, replay: true,
  crossEnabled: true, crossAutoTarget: true, crossLead: true, crossHigh: true, crossLow: true,
  crossCurve: true, crossAvoidBlocks: true, crossRun: true, crossPower: true, crossHint: true,
  musicEnabled: true, musicMenu: 'pasture', musicTour: 'cup', musicMatch: 'anthem',
  cam: 0, stadium: 'classic', tod: 'auto', weather: 'auto',
  gfx: 'ultra', res: 100, crowd: -1, parts: -1, fpsCap: 60, showFps: false,
  inputModeV33: 'auto', keyboardLayoutV33: 'wasd', padBindsV33: { kick:0, pass:2, cross:1, sprint:7, sw:3, pause:9 },
  vMaster: 80, vMusic: 55, vSfx: 85, vCrowd: 60, vBall: 80, vWhistle: 70, vSteps: 34, vGoal: 85, stadiumSound: true, anthemEnabled: true, cartoonSounds: false, realisticCamera: true,
  hand: 'right', btn: 100, opac: 80, vib: true, touchUI: 'auto',
  hat: 0, ballStyle: 0,
  shadowQ: 'auto', dynamicRes: false, powerSave: false, viewDist: 100, crowdAnimate: true, sensitivity: 100, deadZone: 8,
  grassDetail: true, reflections: true, brightness: 100, contrast: 100, saturation: 100,
  vignette: true, glow: true, shaderFXV36: true, shaderPreset: 'cinematic', shaderQuality: 'ultra',
  shaderBloom: 70, shaderChromatic: 30, shaderGrain: 10, shaderSharpen: 30, shaderVignette: 25, shaderExposure: 100, shaderSaturation: 105, cameraShake: true, ballTrail: true,
  cameraFov: 50, cameraHeight: 100, cameraDistance: 100, cameraSmooth: 100,
  uiAnim: 'full', weatherIntensity: 100, stadiumDetail: 'auto', rulesEnabled: true,
  myTeam: 'bur', wins: 0, played: 0, goals: 0, tutDone: false, trophies: [], trophyCabinet: [], career: null, comp: null, utData: null,
  accessProfile: 'standard', coatVariety: true, activeFormTemplate: 0, useCustomForm: false, localRecords: [], controlsLayoutV46: null, lang: 'ru', fourShadows: null, shadowRate: 0,
  minimapV21: true, oneButtonV21: false, localTouchV21: false, commentaryVoiceV21: false, achievementsV21: [],
  playerProfileV21: { coat:'#d8dce2', scarf:'#b8ff3d', scarfOn:true, horns:false, number:10, surname:'TONIO', celebration:0 },
  kitTemplates: [
    { name: 'Синяя классика', c1: '#3a86ff', c2: '#ffffff', pat: 0 },
    { name: 'Оранжевый шторм', c1: '#ff7a1a', c2: '#ffffff', pat: 2 },
    { name: 'Неоновое пастбище', c1: '#b8ff3d', c2: '#15211b', pat: 4 }
  ]
};
let cowballRecoveredV31 = false;
const settings = Object.assign({}, DEF);
try {
  const raw = localStorage.getItem('cowball');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid save shape');
    Object.assign(settings, parsed);
  }
} catch (e) {
  // If the main save was damaged, try the last known-good copy before falling back to defaults.
  for (const key of ['cowball_backup_v31', 'cowball_preimport_v31']) {
    try {
      const rawBackup = localStorage.getItem(key);
      if (!rawBackup) continue;
      const parsedBackup = JSON.parse(rawBackup);
      if (!parsedBackup || typeof parsedBackup !== 'object' || Array.isArray(parsedBackup)) continue;
      Object.assign(settings, parsedBackup);
      try { localStorage.setItem('cowball', JSON.stringify(parsedBackup)); } catch (_) {}
      cowballRecoveredV31 = true;
      break;
    } catch (_) {}
  }
}
window.__cowballRecoveredV31 = cowballRecoveredV31;
// Санитизация: повреждённое или устаревшее сохранение не должно ломать игру.
const _clampSetting = (k, lo, hi) => { const v = Number(settings[k]); settings[k] = Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : DEF[k]; };
if (![3, 5, 11].includes(Number(settings.size))) settings.size = DEF.size;
if (!['ru','en','fr','es','tr','az'].includes(settings.lang)) settings.lang = 'ru';
if (![null,true,false].includes(settings.fourShadows)) settings.fourShadows = null; settings.fourShadows = false;
if (![0,1,2,4].includes(Number(settings.shadowRate))) settings.shadowRate = 0;
if (!['auto','min','low','med','high','ultra','custom'].includes(settings.gfx)) settings.gfx = DEF.gfx;
if (!['off','low','medium','high','auto'].includes(settings.shadowQ)) settings.shadowQ = DEF.shadowQ;
if (![30,45,60,90,120,0].includes(Number(settings.fpsCap))) settings.fpsCap = DEF.fpsCap;
['res','btn','opac','vMaster','vMusic','vSfx','vCrowd','brightness','contrast','saturation','viewDist','cameraFov','cameraHeight','cameraDistance','cameraSmooth','weatherIntensity','sensitivity','deadZone'].forEach(k => _clampSetting(k, ({res:50,btn:70,opac:30,vMaster:0,vMusic:0,vSfx:0,vCrowd:0,brightness:50,contrast:50,saturation:0,viewDist:70,cameraFov:40,cameraHeight:70,cameraDistance:70,cameraSmooth:50,weatherIntensity:0,sensitivity:50,deadZone:0}[k] ?? 0), ({res:100,btn:140,opac:100,vMaster:100,vMusic:100,vSfx:100,vCrowd:100,brightness:150,contrast:150,saturation:150,viewDist:160,cameraFov:75,cameraHeight:150,cameraDistance:150,cameraSmooth:150,weatherIntensity:150,sensitivity:150,deadZone:40}[k] ?? 100)));
['dynamicRes','powerSave','crowdAnimate','grassDetail','reflections','vignette','glow','shaderFXV36','cameraShake','ballTrail','rulesEnabled','minimapV21','oneButtonV21','localTouchV21','commentaryVoiceV21'].forEach(k => { if (typeof settings[k] !== 'boolean') settings[k] = DEF[k]; });
if (!['cinematic','sport','neon','natural','custom'].includes(settings.shaderPreset)) settings.shaderPreset = DEF.shaderPreset;
if (!['balanced','high','ultra','auto'].includes(settings.shaderQuality)) settings.shaderQuality = DEF.shaderQuality;
['shaderBloom','shaderChromatic','shaderGrain','shaderSharpen','shaderVignette','shaderExposure','shaderSaturation'].forEach(k => _clampSetting(k, 0, k === 'shaderGrain' ? 50 : k === 'shaderVignette' ? 70 : k === 'shaderExposure' || k === 'shaderSaturation' ? 150 : k === 'shaderBloom' ? 150 : 100));
if (settings.shaderExposure < 50) settings.shaderExposure = DEF.shaderExposure;
if(!Array.isArray(settings.achievementsV21)) settings.achievementsV21=[];
settings.playerProfileV21=Object.assign({},DEF.playerProfileV21,settings.playerProfileV21&&typeof settings.playerProfileV21==='object'?settings.playerProfileV21:{});
if(!/^#[0-9a-f]{6}$/i.test(settings.playerProfileV21.coat))settings.playerProfileV21.coat=DEF.playerProfileV21.coat;
if(!/^#[0-9a-f]{6}$/i.test(settings.playerProfileV21.scarf))settings.playerProfileV21.scarf=DEF.playerProfileV21.scarf;
settings.playerProfileV21.number=clamp(+settings.playerProfileV21.number||10,1,99);settings.playerProfileV21.surname=String(settings.playerProfileV21.surname||'TONIO').slice(0,12);settings.playerProfileV21.celebration=clamp(+settings.playerProfileV21.celebration||0,0,7);
if (!['full','reduced','off'].includes(settings.uiAnim)) settings.uiAnim = DEF.uiAnim;
if (!['auto','low','medium','high'].includes(settings.stadiumDetail)) settings.stadiumDetail = DEF.stadiumDetail;
if (![0,1,2].includes(Number(settings.diff))) settings.diff = DEF.diff;
if (![0,1,2].includes(Number(settings.cam))) settings.cam = DEF.cam;
if (!['classic','arena','dome','coastal','neon','royal','desert','winter'].includes(settings.stadium)) settings.stadium = DEF.stadium;
if (!['auto','day','dusk','night'].includes(settings.tod)) settings.tod = DEF.tod;
if (!['auto','clear','rain','snow','fog'].includes(settings.weather)) settings.weather = DEF.weather;
if (!['right','left'].includes(settings.hand)) settings.hand = DEF.hand;
if (!['auto','pc','touch','gamepad'].includes(settings.inputModeV33)) settings.inputModeV33 = DEF.inputModeV33;
if (!['wasd','arrows'].includes(settings.keyboardLayoutV33)) settings.keyboardLayoutV33 = DEF.keyboardLayoutV33;
settings.padBindsV33 = Object.assign({}, DEF.padBindsV33, settings.padBindsV33 && typeof settings.padBindsV33 === 'object' && !Array.isArray(settings.padBindsV33) ? settings.padBindsV33 : {});
['kick','pass','cross','sprint','sw','pause'].forEach(k => { const n = Number(settings.padBindsV33[k]); settings.padBindsV33[k] = Number.isFinite(n) ? clamp(Math.round(n),0,15) : DEF.padBindsV33[k]; });
if (!['auto','on','off'].includes(settings.touchUI)) settings.touchUI = DEF.touchUI;
if (!['standard','large','contrast','colorblind','reduced'].includes(settings.accessProfile)) settings.accessProfile = DEF.accessProfile;
if (typeof settings.coatVariety !== 'boolean') settings.coatVariety = true;
if (typeof settings.useCustomForm !== 'boolean') settings.useCustomForm = false;
if (!Array.isArray(settings.localRecords)) settings.localRecords = [];
if (!Array.isArray(settings.trophyCabinet)) settings.trophyCabinet = [];
settings.trophyCabinet = settings.trophyCabinet.filter(t => t && typeof t === 'object').slice(0, 100);
if (settings.career && typeof settings.career !== 'object') settings.career = null;
const _defaultKits = [
  { name: 'Синяя классика', c1: '#3a86ff', c2: '#ffffff', pat: 0 },
  { name: 'Оранжевый шторм', c1: '#ff7a1a', c2: '#ffffff', pat: 2 },
  { name: 'Неоновое пастбище', c1: '#b8ff3d', c2: '#15211b', pat: 4 }
];
if (!Array.isArray(settings.kitTemplates) || !settings.kitTemplates.length) settings.kitTemplates = _defaultKits.map(x => Object.assign({}, x));
settings.kitTemplates = settings.kitTemplates.slice(0, 8).map((x, i) => ({ name: String(x && x.name || ('Комплект ' + (i + 1))).slice(0, 24), c1: /^#[0-9a-f]{6}$/i.test(x && x.c1 || '') ? x.c1 : _defaultKits[i % _defaultKits.length].c1, c2: /^#[0-9a-f]{6}$/i.test(x && x.c2 || '') ? x.c2 : '#ffffff', pat: clamp(Number(x && x.pat) || 0, 0, 4) }));
settings.activeFormTemplate = clamp(Number(settings.activeFormTemplate) || 0, 0, settings.kitTemplates.length - 1);
settings.localRecords = settings.localRecords.filter(r => r && typeof r === 'object').slice(0, 100);
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('cowball', JSON.stringify(settings)); } catch (e) {} }, 150); }
// Keep the previous valid save before replacing it. If storage is full, normal saving still proceeds.
const saveV31Base = save;
save = function () {
  try {
    const raw = localStorage.getItem('cowball');
    if (raw && raw.length <= 3 * 1024 * 1024) {
      const prior = JSON.parse(raw);
      if (prior && typeof prior === 'object' && !Array.isArray(prior)) localStorage.setItem('cowball_backup_v31', raw);
    }
  } catch (e) { /* Backup is best-effort; it must never block gameplay saves. */ }
  return saveV31Base.apply(this, arguments);
};

const DIFF = [
  { n: 'Лёгкая',  spd: 2.05, aim: 40, pow: 8.4, shoot: 0.26, gk: 0.40 },
  { n: 'Обычная', spd: 2.40, aim: 18, pow: 9.3, shoot: 0.38, gk: 0.56 },
  { n: 'Сложная', spd: 2.78, aim: 6,  pow: 10.2, shoot: 0.52, gk: 0.70 }
];
const TIMES = [60, 90, 180];
const PRESETS = { low: { pr: 0.65, crowd: 1, parts: 1 }, med: { pr: 0.9, crowd: 2, parts: 1 }, high: { pr: 1.5, crowd: 3, parts: 2 }, ultra: { pr: 3.0, crowd: 3, parts: 2 } };
// Первый запуск после обновления использует максимальный профиль. Далее настройки сохраняются;
// динамическое разрешение помогает удерживать FPS на слабых устройствах без отключения эффектов.
if (!settings._gfxDefaultsAppliedV40) {
  settings.gfx = 'ultra'; settings.res = 100; settings.dynamicRes = false; settings.powerSave = false;
  settings._gfxDefaultsAppliedV40 = true; save();
} else {
  if (!['min','low','med','high','ultra','auto','custom'].includes(settings.gfx)) settings.gfx = 'ultra';
  settings.res = clamp(Number(settings.res) || 100, 50, 100);
  if (typeof settings.dynamicRes !== 'boolean') settings.dynamicRes = false;
}
// V45: default to Ultra, but allow a reversible resolution scale if the measured frame
// time remains poor for several seconds. The selected graphics preset is never downgraded.
if (!settings._adaptivePerformanceV45) {
  settings.dynamicRes = true;
  settings.res = 100;
  settings._adaptivePerformanceV45 = true;
  save();
}
const MUSIC_LIBRARY = {
  pasture: { name:'Пастбище на рассвете', bpm:88, chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], kick:0.16, bassWave:'sine', leadWave:'triangle', bass:0.16, lead:0.055, pad:0.03, snare:[8], hats:false },
  moo: { name:'Му-зыкальный грув', bpm:102, chords:[[62,65,69],[57,62,65],[59,62,67],[55,59,62]], kick:0.23, bassWave:'triangle', leadWave:'sine', bass:0.2, lead:0.07, pad:0.025, snare:[4,12], hats:true },
  sunset: { name:'Закат над ареной', bpm:94, chords:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]], kick:0.18, bassWave:'sine', leadWave:'triangle', bass:0.17, lead:0.06, pad:0.04, snare:[12], hats:false },
  cup: { name:'Кубковый марш', bpm:104, chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]], kick:0.3, bassWave:'sawtooth', leadWave:'triangle', bass:0.19, lead:0.07, pad:0.025, snare:[4,12], hats:true },
  road: { name:'Дорога к финалу', bpm:112, chords:[[62,66,69],[57,61,64],[59,62,66],[55,59,62]], kick:0.33, bassWave:'triangle', leadWave:'sawtooth', bass:0.2, lead:0.06, pad:0.02, snare:[4,10,12], hats:true },
  grand: { name:'Большой финал', bpm:98, chords:[[60,64,67],[53,57,60],[55,59,62],[57,60,64]], kick:0.28, bassWave:'sawtooth', leadWave:'triangle', bass:0.18, lead:0.075, pad:0.04, snare:[8,12], hats:false },
  anthem: { name:'Гимн матча', bpm:118, chords:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]], kick:0.5, bassWave:'sawtooth', leadWave:'triangle', bass:0.2, lead:0.07, pad:0.02, snare:[4,12], hats:true },
  rush: { name:'Рывок к воротам', bpm:132, chords:[[60,64,67],[57,60,64],[55,59,62],[53,57,60]], kick:0.55, bassWave:'square', leadWave:'sawtooth', bass:0.16, lead:0.06, pad:0, snare:[4,8,12], hats:true },
  night: { name:'Ночная арена', bpm:108, chords:[[53,57,60],[55,59,62],[57,60,64],[60,64,67]], kick:0.4, bassWave:'triangle', leadWave:'sine', bass:0.17, lead:0.055, pad:0.035, snare:[8], hats:true },
  pulse: { name:'Стадионный пульс', bpm:124, chords:[[57,60,64],[53,57,60],[55,59,62],[52,55,59]], kick:0.45, bassWave:'sawtooth', leadWave:'square', bass:0.18, lead:0.045, pad:0.018, snare:[4,12], hats:true },
  velocity: { name:'На полной скорости', bpm:132, chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], kick:0.48, bassWave:'triangle', leadWave:'sawtooth', bass:0.17, lead:0.052, pad:0.012, snare:[4,8,12], hats:true },
  rise: { name:'Путь к финалу', bpm:96, chords:[[53,57,60],[55,59,62],[60,64,67],[57,60,64]], kick:0.22, bassWave:'sine', leadWave:'triangle', bass:0.14, lead:0.065, pad:0.065, snare:[12], hats:false },
  spotlight: { name:'Под светом арены', bpm:102, chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]], kick:0.24, bassWave:'triangle', leadWave:'sine', bass:0.13, lead:0.045, pad:0.07, snare:[8], hats:true },
  victory: { name:'Большая победа', bpm:116, chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]], kick:0.39, bassWave:'sawtooth', leadWave:'triangle', bass:0.18, lead:0.067, pad:0.032, snare:[4,12], hats:true },
  afterglow: { name:'Огни после заката', bpm:88, chords:[[57,60,64],[60,64,67],[53,57,60],[55,59,62]], kick:0.16, bassWave:'sine', leadWave:'triangle', bass:0.13, lead:0.05, pad:0.055, snare:[12], hats:false }
};
const MUSIC_OPTIONS = {
  menu:[['pasture','Пастбище на рассвете'],['moo','Му-зыкальный грув'],['sunset','Закат над ареной'],['pulse','Стадионный пульс'],['spotlight','Под светом арены'],['afterglow','Огни после заката']],
  tour:[['cup','Кубковый марш'],['road','Дорога к финалу'],['grand','Большой финал'],['velocity','На полной скорости'],['rise','Путь к финалу'],['victory','Большая победа']],
  match:[['anthem','Гимн выхода команд'],['rush','Рывок к воротам'],['night','Ночная арена'],['pulse','Стадионный пульс'],['rise','Путь к финалу'],['victory','Большая победа']]
};
// Migrate saved selections from the removed menu theme and repair stale track IDs.
{
  let changed = false;
  for (const [key, fallback] of [['musicMenu','sunset'],['musicTour','cup'],['musicMatch','anthem']]) {
    if (!MUSIC_LIBRARY[settings[key]]) { settings[key] = fallback; changed = true; }
  }
  if (changed) save();
}
const gfxLevel = () => settings.gfx === 'auto' ? 'ultra' : settings.gfx === 'min' ? 'low' : settings.gfx === 'custom' ? 'med' : settings.gfx;
const effCrowd = () => settings.powerSave && settings.crowd < 0 ? 1 : (settings.crowd >= 0 ? settings.crowd : PRESETS[gfxLevel()].crowd);
const effParts = () => settings.powerSave ? Math.min(1, settings.parts >= 0 ? settings.parts : PRESETS[gfxLevel()].parts) : (settings.parts >= 0 ? settings.parts : PRESETS[gfxLevel()].parts);

// ================== Команды (выдуманные) ==================
const TEAMS = [
  { id: 'bur', name: 'Бурёнки',          code: 'БУР', kind: 'cow',    feat: 'bell',    c1: 0x3a86ff, c2: 0xffffff, gk: 0xffd23f, spd: 3, pow: 3, def: 3, tag: 'Классика молочного футбола' },
  { id: 'rog', name: 'Рогатые',          code: 'РОГ', kind: 'cow',    feat: 'horns',   c1: 0xff7a1a, c2: 0xffffff, gk: 0x7be37b, spd: 3, pow: 4, def: 2, tag: 'Бодаются и не извиняются' },
  { id: 'zhk', name: 'Жук-iPhone',         code: 'IPH', kind: 'cow', feat: 'phone',   c1: 0xb266ff, c2: 0x19e3ff, gk: 0xffd23f, spd: 4, pow: 2, def: 3, tag: 'Всегда на связи, редко в игре' },
  { id: 'hol', name: 'Хладнокровные',    code: 'ХЛД', kind: 'cow',    feat: 'shades',  c1: 0x29d3b0, c2: 0xffffff, gk: 0xff7ac8, spd: 2, pow: 3, def: 5, tag: 'Не нервничают даже в овертайме' },
  { id: 'nos', name: 'Жуки-Носороги',    code: 'ЖНО', kind: 'cow', feat: 'rhino',   c1: 0xc9792b, c2: 0x3b2410, fur: 0xc9a074, dark: 0x2a1a0c, gk: 0x3a86ff, spd: 2, pow: 5, def: 3, tag: 'Таранят всё подряд' },
  { id: 'tap', name: 'Молочные Тапки',   code: 'МТП', kind: 'cow',    feat: 'bow',     c1: 0xff7ac8, c2: 0xffffff, gk: 0x29d3b0, spd: 3, pow: 2, def: 3, tag: 'Играют по-домашнему' },
  { id: 'sen', name: 'Сенокосы',         code: 'СЕН', kind: 'cow',    feat: 'straw',   c1: 0xffd23f, c2: 0x7a5a00, gk: 0x3a86ff, spd: 3, pow: 3, def: 4, tag: 'Всё лето на поле' },
  { id: 'byk', name: 'Чёрные Быки',      code: 'ЧБК', kind: 'cow',    feat: 'ring',    c1: 0xd4af37, c2: 0x111111, fur: 0x2b2d36, dark: 0x14151a, gk: 0xb8ff3d, spd: 3, pow: 5, def: 2, tag: 'Красное не любят' },
  { id: 'bgk', name: 'Божьи Коровки',    code: 'БКР', kind: 'cow', feat: 'ladybug', c1: 0xe0102e, c2: 0xffffff, gk: 0xffd23f, spd: 5, pow: 1, def: 2, tag: 'Маленькие, но очень быстрые' },
  { id: 'kos', name: 'Космо-Бурёнки',    code: 'КОС', kind: 'cow',    feat: 'helmet',  c1: 0xdfe6f2, c2: 0xff9f1c, gk: 0xff4d3d, spd: 4, pow: 3, def: 2, tag: 'Играют при низкой гравитации' },
  { id: 'skr', name: 'Золотые Скарабеи', code: 'ЗСК', kind: 'cow', feat: 'scarab',  c1: 0xf2c200, c2: 0x5a3b00, fur: 0xf0cf6a, dark: 0x5a3b00, gk: 0x3a86ff, spd: 3, pow: 3, def: 4, tag: 'Вечные, как пирамиды' },
  { id: 'trv', name: 'Травоядные',       code: 'ТРВ', kind: 'cow',    feat: 'grass',   c1: 0x7ee03c, c2: 0xffffff, gk: 0xff7ac8, spd: 4, pow: 3, def: 3, tag: 'Питаются только газоном' },
  { id: 'cyb', name: 'Cyber-Бурёнки',     code: 'CYB', kind: 'cow',    feat: 'helmet',  c1: 0x00e5ff, c2: 0x14243a, gk: 0xffd23f, spd: 5, pow: 3, def: 2, tag: 'Футбол будущего' },
  { id: 'nin', name: 'Ниндзя-Муу',        code: 'NIN', kind: 'cow',    feat: 'shades',  c1: 0x5d5fef, c2: 0x17172b, fur: 0x292b42, dark: 0x101018, gk: 0xff7ac8, spd: 5, pow: 3, def: 2, tag: 'Тихие, быстрые, опасные' },
  { id: 'pir', name: 'Пираты Пастбища',   code: 'PIR', kind: 'cow',    feat: 'horns',   c1: 0x9b5b32, c2: 0xf5e6c8, gk: 0x7be37b, spd: 3, pow: 4, def: 4, tag: 'Охотятся за золотым мячом' },
  { id: 'neo', name: 'Неоновые Коровы',   code: 'NEO', kind: 'cow',    feat: 'bow',     c1: 0xff3cac, c2: 0x3bf4ff, gk: 0xb8ff3d, spd: 4, pow: 3, def: 3, tag: 'Сияют даже ночью' },
  { id: 'vul', name: 'Вулканические Быки',code: 'VUL', kind: 'cow',    feat: 'ring',    c1: 0xff4b23, c2: 0x332020, fur: 0x382426, dark: 0x171012, gk: 0x3a86ff, spd: 2, pow: 5, def: 4, tag: 'Горячий характер' },
  { id: 'arc', name: 'Аркадные Мустанги', code: 'ARC', kind: 'cow',    feat: 'scarab',  c1: 0x22d07a, c2: 0x182a20, gk: 0xffd23f, spd: 4, pow: 4, def: 3, tag: 'Рождены для большого матча' },
  { id: 'spt', name: 'Космо-Телефоны',    code: 'SPT', kind: 'cow',    feat: 'phone',   c1: 0x4e7cff, c2: 0xf1f5ff, gk: 0xff7ac8, spd: 5, pow: 2, def: 3, tag: 'Связь с победой установлена' },
  { id: 'mud', name: 'Грязевые Громилы',  code: 'MUD', kind: 'cow',    feat: 'rhino',   c1: 0x8c6548, c2: 0x34251a, fur: 0x75533d, dark: 0x332116, gk: 0xb8ff3d, spd: 2, pow: 5, def: 5, tag: 'Не боятся грязной работы' },
  { id: 'aur', name: 'Аврора FC',         code: 'AUR', kind: 'cow',    feat: 'straw',   c1: 0x8e6bff, c2: 0xefffff, gk: 0xffd23f, spd: 4, pow: 3, def: 4, tag: 'Играют как северное сияние' },

  // Национальные сборные — используются в отдельном Чемпионате мира.
  { id: 'nat_deu', name: 'Германия', code: 'GER', kind: 'nation', nation: true, c1: 0xffffff, c2: 0x111111, fur: 0xf7f2e8, dark: 0x232323, gk: 0x39a8ff, spd: 4, pow: 4, def: 4, feat: 'horns', tag: 'Сборная Германии' },
  { id: 'nat_esp', name: 'Испания', code: 'ESP', kind: 'nation', nation: true, c1: 0xc8102e, c2: 0xffd43b, gk: 0x29d3b0, spd: 4, pow: 4, def: 3, feat: 'bell', tag: 'Сборная Испании' },
  { id: 'nat_fra', name: 'Франция', code: 'FRA', kind: 'nation', nation: true, c1: 0x173f8a, c2: 0xffffff, gk: 0xffd23f, spd: 4, pow: 4, def: 4, feat: 'shades', tag: 'Сборная Франции' },
  { id: 'nat_ita', name: 'Италия', code: 'ITA', kind: 'nation', nation: true, c1: 0x0877b9, c2: 0xffffff, gk: 0x2f2f2f, spd: 3, pow: 4, def: 5, feat: 'bow', tag: 'Сборная Италии' },
  { id: 'nat_eng', name: 'Англия', code: 'ENG', kind: 'nation', nation: true, c1: 0xffffff, c2: 0xd71920, gk: 0x36b56d, spd: 4, pow: 4, def: 4, feat: 'ring', tag: 'Сборная Англии' },
  { id: 'nat_bra', name: 'Бразилия', code: 'BRA', kind: 'nation', nation: true, c1: 0xffdf00, c2: 0x159447, gk: 0x2458bd, spd: 5, pow: 5, def: 3, feat: 'straw', tag: 'Сборная Бразилии' },
  { id: 'nat_arg', name: 'Аргентина', code: 'ARG', kind: 'nation', nation: true, c1: 0x75c9ed, c2: 0xffffff, gk: 0x242424, spd: 4, pow: 4, def: 3, feat: 'bell', tag: 'Сборная Аргентины' },
  { id: 'nat_por', name: 'Португалия', code: 'POR', kind: 'nation', nation: true, c1: 0xc51e32, c2: 0x17633b, gk: 0xffd23f, spd: 4, pow: 4, def: 3, feat: 'horns', tag: 'Сборная Португалии' },
  { id: 'nat_ned', name: 'Нидерланды', code: 'NED', kind: 'nation', nation: true, c1: 0xf36c21, c2: 0xffffff, gk: 0x2a55a4, spd: 5, pow: 4, def: 3, feat: 'shades', tag: 'Сборная Нидерландов' },
  { id: 'nat_jpn', name: 'Япония', code: 'JPN', kind: 'nation', nation: true, c1: 0x173d8a, c2: 0xffffff, gk: 0xffd23f, spd: 5, pow: 3, def: 4, feat: 'helmet', tag: 'Сборная Японии' },
  { id: 'nat_aze', name: 'Азербайджан', code: 'AZE', kind: 'nation', nation: true, c1: 0x00a3dd, c2: 0xe31e36, gk: 0x2d8b57, spd: 4, pow: 3, def: 4, feat: 'ring', tag: 'Сборная Азербайджана' },
  { id: 'nat_cro', name: 'Хорватия', code: 'CRO', kind: 'nation', nation: true, c1: 0xd71920, c2: 0xffffff, gk: 0x2458bd, spd: 3, pow: 4, def: 4, feat: 'scarab', tag: 'Сборная Хорватии' },
  { id: 'nat_uru', name: 'Уругвай', code: 'URU', kind: 'nation', nation: true, c1: 0x70c7ed, c2: 0xffffff, gk: 0x222222, spd: 4, pow: 4, def: 4, feat: 'bell', tag: 'Сборная Уругвая' },
  { id: 'nat_mar', name: 'Марокко', code: 'MAR', kind: 'nation', nation: true, c1: 0xc1272d, c2: 0x087a4a, gk: 0xffd23f, spd: 4, pow: 3, def: 5, feat: 'horns', tag: 'Сборная Марокко' },
  { id: 'nat_kor', name: 'Южная Корея', code: 'KOR', kind: 'nation', nation: true, c1: 0xffffff, c2: 0xcd2e3a, gk: 0x17468a, spd: 5, pow: 3, def: 4, feat: 'phone', tag: 'Сборная Южной Кореи' },
  { id: 'nat_usa', name: 'США', code: 'USA', kind: 'nation', nation: true, c1: 0x17468a, c2: 0xffffff, gk: 0xcd2e3a, spd: 4, pow: 4, def: 3, feat: 'shades', tag: 'Сборная США' },
  // Только выдуманные клубы. Реальных клубов в Cowball нет.
  { id: 'pl_ars', name: 'Неоновые Волки', code: 'NVK', league: 'premier', c1: 0x22d07a, c2: 0x111111, gk: 0x36b56d, spd: 4, pow: 4, def: 4, feat: 'horns', tag: 'Неон-лига · выдуманный клуб' },
  { id: 'pl_liv', name: 'Красные Кометы', code: 'KKT', league: 'premier', c1: 0xc8102e, c2: 0xffffff, gk: 0x29d3b0, spd: 5, pow: 4, def: 3, feat: 'bell', tag: 'Неон-лига · выдуманный клуб' },
  { id: 'pl_mci', name: 'Голубые Молнии', code: 'GML', league: 'premier', c1: 0x6cabdd, c2: 0xffffff, gk: 0xffd23f, spd: 5, pow: 4, def: 4, feat: 'helmet', tag: 'Неон-лига · выдуманный клуб' },
  { id: 'pl_mun', name: 'Ржавые Ракеты', code: 'RRK', league: 'premier', c1: 0xda291c, c2: 0xfbe122, gk: 0x333333, spd: 4, pow: 4, def: 3, feat: 'ring', tag: 'Неон-лига · выдуманный клуб' },
  { id: 'll_rma', name: 'Королевские Бизоны', code: 'KRB', league: 'laliga', c1: 0xffffff, c2: 0xfebd11, gk: 0x8e6bff, spd: 5, pow: 5, def: 4, feat: 'crown', tag: 'Солнечная лига · выдуманный клуб' },
  { id: 'll_bar', name: 'Сине-Гранатовые Жуки', code: 'SGZ', league: 'laliga', c1: 0x004d98, c2: 0xa50044, gk: 0x00a3dd, spd: 4, pow: 5, def: 3, feat: 'shades', tag: 'Солнечная лига · выдуманный клуб' },
  { id: 'll_atm', name: 'Полуночные Быки', code: 'PLB', league: 'laliga', c1: 0xcb3524, c2: 0xffffff, gk: 0x222222, spd: 4, pow: 4, def: 5, feat: 'horns', tag: 'Солнечная лига · выдуманный клуб' },
  { id: 'll_sev', name: 'Белые Скорпионы', code: 'BSC', league: 'laliga', c1: 0xffffff, c2: 0xc8102e, gk: 0x2458bd, spd: 3, pow: 4, def: 4, feat: 'bell', tag: 'Солнечная лига · выдуманный клуб' },
  { id: 'bl_bay', name: 'Железные Копыта', code: 'ZHK', league: 'bundesliga', c1: 0xdc052d, c2: 0xffffff, gk: 0x008b5a, spd: 5, pow: 5, def: 4, feat: 'ring', tag: 'Стальная лига · выдуманный клуб' },
  { id: 'bl_bvb', name: 'Жёлтые Штормы', code: 'ZSH', league: 'bundesliga', c1: 0xffe500, c2: 0x111111, gk: 0x2458bd, spd: 4, pow: 4, def: 3, feat: 'horns', tag: 'Стальная лига · выдуманный клуб' },
  { id: 'bl_lev', name: 'Алые Пумы', code: 'ALP', league: 'bundesliga', c1: 0xe32219, c2: 0x111111, gk: 0x29d3b0, spd: 4, pow: 4, def: 4, feat: 'scarab', tag: 'Стальная лига · выдуманный клуб' },
  { id: 'bl_rbl', name: 'Ледяные Драконы', code: 'LDD', league: 'bundesliga', c1: 0xffffff, c2: 0xda291c, gk: 0x222222, spd: 5, pow: 4, def: 3, feat: 'helmet', tag: 'Стальная лига · выдуманный клуб' },
  { id: 'sa_int', name: 'Теневые Пантеры', code: 'TPN', league: 'seriea', c1: 0x00529f, c2: 0x111111, gk: 0xffffff, spd: 4, pow: 4, def: 5, feat: 'shades', tag: 'Теневая лига · выдуманный клуб' },
  { id: 'sa_mil', name: 'Красные Фантомы', code: 'KFN', league: 'seriea', c1: 0xfb090b, c2: 0x111111, gk: 0x2f9b52, spd: 4, pow: 4, def: 4, feat: 'ring', tag: 'Теневая лига · выдуманный клуб' },
  { id: 'sa_juv', name: 'Чёрно-Белые Громы', code: 'CHG', league: 'seriea', c1: 0xffffff, c2: 0x111111, gk: 0x8e6bff, spd: 3, pow: 4, def: 5, feat: 'horns', tag: 'Теневая лига · выдуманный клуб' },
  { id: 'sa_nap', name: 'Бирюзовые Киты', code: 'BKT', league: 'seriea', c1: 0x00a6d6, c2: 0xffffff, gk: 0x222222, spd: 4, pow: 4, def: 3, feat: 'bell', tag: 'Теневая лига · выдуманный клуб' },
  { id: 'l1_psg', name: 'Космические Лисы', code: 'KLF', league: 'ligue1', c1: 0x004170, c2: 0xda291c, gk: 0xffffff, spd: 5, pow: 5, def: 3, feat: 'helmet', tag: 'Космо-лига · выдуманный клуб' },
  { id: 'l1_om', name: 'Снежные Бизоны', code: 'SNB', league: 'ligue1', c1: 0xffffff, c2: 0x00a6d6, gk: 0x222222, spd: 4, pow: 4, def: 4, feat: 'bell', tag: 'Космо-лига · выдуманный клуб' },
  { id: 'l1_mon', name: 'Алмазные Мустанги', code: 'ALM', league: 'ligue1', c1: 0xce1126, c2: 0xffffff, gk: 0x00a6d6, spd: 4, pow: 4, def: 3, feat: 'crown', tag: 'Космо-лига · выдуманный клуб' },
  { id: 'l1_lil', name: 'Медные Грифоны', code: 'MDG', league: 'ligue1', c1: 0xce1126, c2: 0x173f8a, gk: 0xffd23f, spd: 3, pow: 4, def: 4, feat: 'horns', tag: 'Космо-лига · выдуманный клуб' }
];
// Дополнительные выдуманные клубы и сборные, с уникальными цветами и рейтингами.
const EXTRA_CLUBS = [
  ['Лунные Бизоны',0x6b7cff,0xf4f5ff],['Грозовые Копыта',0x263238,0xffd54f],['Изумрудные Лисы',0x087f5b,0xb2f2bb],['Коралловые Акулы',0xff6b6b,0x1864ab],['Полярные Волки',0xe7f5ff,0x364fc7],['Медные Фениксы',0xb45309,0xffedd5],['Сапфировые Пантеры',0x364fc7,0x91a7ff],['Янтарные Грифоны',0xf08c00,0x212529],['Туманные Драконы',0x868e96,0x74c0fc],['Вишнёвые Кометы',0xa61e4d,0xffdeeb],['Стальные Киты',0x495057,0x99e9f2],['Солнечные Барсы',0xffc078,0x7c2d12],['Лазурные Орлы',0x1098ad,0xe3fafc],['Фиолетовые Бизоны',0x7048e8,0xe5dbff],['Северные Мустанги',0x0b7285,0xc5f6fa],['Песчаные Титаны',0xc2a878,0x3d2b1f],['Космические Пантеры',0x343a40,0xe599f7],['Алые Соколы',0xc92a2a,0xffec99],['Горные Грифоны',0x5c940d,0xd8f5a2],['Турбо-Бурёнки',0x12b886,0x212529],
  ['Лиловые Кометы',0x862e9c,0xffc9f2],['Бирюзовые Рыси',0x0b7285,0x63e6be],['Красные Гейзеры',0xe03131,0xffd43b],['Зелёные Метеоры',0x2b8a3e,0xd3f9d8],['Серебряные Быки',0xadb5bd,0x343a40],['Оранжевые Кобры',0xf76707,0x212529],['Синие Громы',0x1864ab,0x91c9ff],['Розовые Титаны',0xd63384,0xffdeeb],['Белые Вихри',0xf1f3f5,0x495057],['Золотые Волки',0xe6b800,0x382b00] ];
EXTRA_CLUBS.forEach((v,i)=>TEAMS.push({id:'fx_'+i,name:v[0],code:('FX'+String(i+1).padStart(2,'0')),kind:'cow',league:['premier','laliga','bundesliga','seriea','ligue1'][i%5],c1:v[1],c2:v[2],gk:[0xffd43b,0x4dabf7,0xff8787][i%3],spd:2+(i%3),pow:2+((i+1)%4),def:2+((i+2)%4),feat:['horns','bell','shades','helmet','ring'][i%5],tag:'Выдуманный клуб · сезон Cowball'}));
const EXTRA_CLUBS_MORE = [
  ['Тундровые Бизоны',0x5c677d,0xe0fbfc],['Громовые Бараны',0x343a40,0xffd43b],['Песчаные Совы',0xc2a878,0x2b2118],['Ледяные Киты',0x4dabf7,0xe7f5ff],['Рубиновые Единороги',0xa61e4d,0xffc9c9],
  ['Штормовые Еноты',0x495057,0x74c0fc],['Медовые Барсуки',0xf08c00,0x3b2500],['Кедровые Лоси',0x2b8a3e,0xc0eb75],['Комета-7',0x7048e8,0x63e6be],['Коралловые Манты',0xff6b6b,0x0b7285],
  ['Малахитовые Волки',0x087f5b,0xd3f9d8],['Бронзовые Филины',0x9c6644,0xffe8cc],['Сахарные Драконы',0xf8f0fc,0x7950f2],['Северные Киты',0x1864ab,0xc5f6fa],['Облачные Тигры',0xadb5bd,0xff922b],
  ['Факелы Пастбища',0xff922b,0xffec99],['Эхо Арены',0x5f3dc4,0xf3d9fa],['Молочный Экспресс',0xf8f9fa,0x12b886]
];
EXTRA_CLUBS_MORE.forEach((v,i)=>TEAMS.push({id:'fx_more_'+i,name:v[0],code:'MX'+String(i+1).padStart(2,'0'),kind:'cow',league:['premier','laliga','bundesliga','seriea','ligue1'][i%5],c1:v[1],c2:v[2],gk:[0xffd43b,0x4dabf7,0xff8787][i%3],spd:2+(i%3),pow:2+((i+1)%4),def:2+((i+2)%4),feat:['horns','bell','shades','helmet','ring'][i%5],tag:'Выдуманный клуб · сезон Cowball'}));
const TIER_CLUBS = [
  ['Сонные Телёнки',0x718096,0xe2e8f0,1,1,2,'Слабая'],['Пыльные Копыта',0x8c7b6b,0xe8d6b3,1,2,1,'Слабая'],
  ['Последний Свисток',0x495057,0xff8787,2,1,1,'Слабая'],['Забытые Бутсы',0x6c757d,0xf1f3f5,2,2,1,'Слабая'],
  ['Черепашьи Гонщики',0x2b8a3e,0xc0eb75,1,2,2,'Слабая'],['Пустые Трибуны FC',0x495057,0xadb5bd,2,1,2,'Слабая'],
  ['Мокрые Вафли',0xf08c00,0xffe8cc,1,1,1,'Слабая'],['Клуб Сломанных Рогов',0x862e9c,0xd0bfff,2,2,2,'Слабая'],
  ['Клеверные Коровы',0x2f9e44,0xd3f9d8,3,3,3,'Средняя'],['Городские Пастухи',0x1864ab,0x91a7ff,3,2,3,'Средняя'],
  ['Медные Молнии',0xb45309,0xffd8a8,2,3,3,'Средняя'],['Долинные Скакуны',0x0b7285,0x99e9f2,3,3,2,'Средняя'],
  ['Футбольные Пончики',0xd63384,0xffdeeb,3,3,3,'Средняя'],['Клеверный Шторм',0x087f5b,0x8ce99a,4,3,3,'Средняя'],
  ['Аренные Ламы',0x7048e8,0xffc9c9,3,2,4,'Средняя'],['Команда Большого Сыра',0xe6b800,0xfff3bf,3,3,3,'Средняя'],
  ['Имперские Бизоны',0x364fc7,0xe7f5ff,5,4,4,'Сильная'],['Сверхзвуковые Быки',0x1098ad,0xc5f6fa,4,5,4,'Сильная'],
  ['Премьерские Фениксы',0xc92a2a,0xffec99,4,4,5,'Сильная'],['Звёздный Рой',0x5f3dc4,0xe5dbff,5,5,3,'Сильная'],
  ['Чёрные Метеоры',0x212529,0x74c0fc,5,3,5,'Сильная'],['Атласские Титаны',0x9c6644,0xffe8cc,5,5,5,'Сильная'],
  ['Корона Пастбища',0xf08c00,0xfff3bf,4,5,5,'Сильная'],['Золотой Шторм',0x9a6700,0x63e6be,5,4,5,'Сильная']
];
TIER_CLUBS.forEach((v,i)=>TEAMS.push({id:'fiction_tier_'+i,name:v[0],code:'FT'+String(i+1).padStart(2,'0'),kind:'cow',league:null,c1:v[1],c2:v[2],spd:v[3],pow:v[4],def:v[5],tier:v[6],gk:[0x4dabf7,0xffd43b,0xff8787][i%3],feat:['horns','bell','shades','helmet','ring'][i%5],tag:`${v[6]} выдуманная команда · сезон Cowball`}));
const EXTRA_NATIONS = [
 ['Швеция','SWE',0x1769aa,0xffd43b],['Норвегия','NOR',0xba0c2f,0xffffff],['Дания','DEN',0xc8102e,0xffffff],['Польша','POL',0xffffff,0xdc143c],['Турция','TUR',0xe30a17,0xffffff],['Швейцария','SUI',0xd52b1e,0xffffff],['Австрия','AUT',0xed2939,0xffffff],['Бельгия','BEL',0x111111,0xfdda24],['Шотландия','SCO',0x0065bd,0xffffff],['Украина','UKR',0x0057b7,0xffd700],['Греция','GRE',0x0d5eaf,0xffffff],['Чехия','CZE',0xd7141a,0xffffff],['Сербия','SRB',0xc6363c,0x0c4076],['Сенегал','SEN',0x00853f,0xffd100],['Нигерия','NGA',0x008751,0xffffff],['Камерун','CMR',0x007a5e,0xce1126],['Египет','EGY',0xce1126,0xffffff],['Алжир','ALG',0x006633,0xffffff],['Канада','CAN',0xd80621,0xffffff],['Мексика','MEX',0x006847,0xffffff],['Колумбия','COL',0xfcd116,0x003893],['Чили','CHI',0xd52b1e,0xffffff],['Перу','PER',0xd91023,0xffffff],['Коста-Рика','CRC',0x002b7f,0xffffff],['Австралия','AUS',0x012169,0xffd700],['Иран','IRN',0x239f40,0xffffff],['Саудовская Аравия','KSA',0x006c35,0xffffff],['Катар','QAT',0x8a1538,0xffffff],['Ирак','IRQ',0xce1126,0xffffff],['Узбекистан','UZB',0x1eb53a,0xffffff] ];
EXTRA_NATIONS.push(
  ['Исландия','ISL',0x02529c,0xdc1e35],['Финляндия','FIN',0xffffff,0x003580],['Ирландия','IRL',0x169b62,0xff883e],['Уэльс','WAL',0xd30731,0xffffff],
  ['Грузия','GEO',0xffffff,0xff0000],['Армения','ARM',0xd90012,0x0033a0],['Гана','GHA',0xce1126,0xfcd116],['ЮАР','RSA',0x007749,0xffb81c],
  ['Тунис','TUN',0xe70013,0xffffff],['Кот-д’Ивуар','CIV',0xf77f00,0x009e60],['Эквадор','ECU',0xffd100,0x0033a0],['Новая Зеландия','NZL',0x00247d,0xffffff]
);
const SUBFLAG = code => String.fromCodePoint(0x1f3f4, ...Array.from(code).map(ch => 0xe0061 + ch.charCodeAt(0) - 97), 0xe007f);
const NATION_FLAGS = {
  GER:'🇩🇪', ESP:'🇪🇸', FRA:'🇫🇷', ITA:'🇮🇹', ENG:SUBFLAG('gbeng'), BRA:'🇧🇷', ARG:'🇦🇷', POR:'🇵🇹', NED:'🇳🇱', JPN:'🇯🇵', AZE:'🇦🇿', CRO:'🇭🇷', URU:'🇺🇾', MAR:'🇲🇦', KOR:'🇰🇷', USA:'🇺🇸',
  SWE:'🇸🇪', NOR:'🇳🇴', DEN:'🇩🇰', POL:'🇵🇱', TUR:'🇹🇷', SUI:'🇨🇭', AUT:'🇦🇹', BEL:'🇧🇪', SCO:SUBFLAG('gbsct'), UKR:'🇺🇦', GRE:'🇬🇷', CZE:'🇨🇿', SRB:'🇷🇸', SEN:'🇸🇳', NGA:'🇳🇬', CMR:'🇨🇲', EGY:'🇪🇬', ALG:'🇩🇿', CAN:'🇨🇦', MEX:'🇲🇽', COL:'🇨🇴', CHI:'🇨🇱', PER:'🇵🇪', CRC:'🇨🇷', AUS:'🇦🇺', IRN:'🇮🇷', KSA:'🇸🇦', QAT:'🇶🇦', IRQ:'🇮🇶', UZB:'🇺🇿',
  PAR:'🇵🇾', ROU:'🇷🇴', HUN:'🇭🇺', SVK:'🇸🇰', SVN:'🇸🇮', BUL:'🇧🇬', KAZ:'🇰🇿', JOR:'🇯🇴', CHN:'🇨🇳', THA:'🇹🇭', VIE:'🇻🇳', MLI:'🇲🇱', COD:'🇨🇩', PAN:'🇵🇦', JAM:'🇯🇲', VEN:'🇻🇪', BOL:'🇧🇴', ALB:'🇦🇱', MKD:'🇲🇰', BIH:'🇧🇦', MNE:'🇲🇪', KEN:'🇰🇪',
  ISL:'🇮🇸', FIN:'🇫🇮', IRL:'🇮🇪', WAL:SUBFLAG('gbwls'), GEO:'🇬🇪', ARM:'🇦🇲', GHA:'🇬🇭', RSA:'🇿🇦', TUN:'🇹🇳', CIV:'🇨🇮', ECU:'🇪🇨', NZL:'🇳🇿'
};
EXTRA_NATIONS.forEach((v,i)=>TEAMS.push({id:'nationx_'+i,name:v[0],code:v[1],kind:'nation',nation:true,flag:NATION_FLAGS[v[1]],c1:v[2],c2:v[3],gk:0xffd43b,spd:3+(i%3),pow:3+((i+1)%3),def:3+((i+2)%3),feat:['horns','bell','shades','helmet','ring'][i%5],tag:'Вымышленная игровая модель сборной · '+v[0]}));
[['Парагвай','PAR',0xd52b1e,0xffffff],['Румыния','ROU',0xfcd116,0x002b7f],['Венгрия','HUN',0xce2939,0xffffff],['Словакия','SVK',0x0b4ea2,0xee1c25],['Словения','SVN',0xffffff,0x005da4],['Болгария','BUL',0xffffff,0x00966e],
 ['Казахстан','KAZ',0x00afca,0xfec50c],['Иордания','JOR',0xce1126,0xffffff],['Китай','CHN',0xde2910,0xffde00],['Таиланд','THA',0xa51931,0x2d2a4a],['Вьетнам','VIE',0xda251d,0xffcd00],['Мали','MLI',0xfcd116,0x14b53a],
 ['ДР Конго','COD',0x00a1de,0xce1021],['Панама','PAN',0xda121a,0x072357],['Ямайка','JAM',0xfed100,0x009b3a],['Венесуэла','VEN',0x7a1531,0xffcc00],['Боливия','BOL',0x007a33,0xffffff],['Албания','ALB',0xe41e20,0x111111],
 ['Северная Македония','MKD',0xd20000,0xf9d616],['Босния и Герцеговина','BIH',0x002f6c,0xfecb00],['Черногория','MNE',0xc40308,0xd4af37],['Кения','KEN',0xbb0000,0x006600]]
 .forEach((v, i) => TEAMS.push({ id: 'nationy_' + i, name: v[0], code: v[1], kind: 'nation', nation: true, flag: NATION_FLAGS[v[1]], c1: v[2], c2: v[3], gk: [0xffd43b, 0x4dabf7, 0xff8787][i % 3], spd: 2 + (i % 4), pow: 2 + ((i + 1) % 4), def: 2 + ((i + 2) % 4), feat: ['horns', 'bell', 'shades', 'helmet', 'ring'][i % 5], tag: 'Вымышленная игровая модель сборной · ' + v[0] }));
TEAMS.forEach(t => { if (t.nation) t.flag = NATION_FLAGS[t.code] || '🏳️'; });
// ---------- v34: настоящие клубы и локализованные названия сборных ----------
(function realClubs() {
  const R = {
   pl_ars:['Арсенал','Arsenal',0xef0107,0xffffff],pl_liv:['Ливерпуль','Liverpool',0xc8102e,0xffffff],pl_mci:['Манчестер Сити','Manchester City',0x6cabdd,0xffffff],pl_mun:['Манчестер Юнайтед','Manchester United',0xda291c,0xfbe122],
   fx_0:['Челси','Chelsea',0x034694,0xffffff],fx_5:['Тоттенхэм','Tottenham',0xffffff,0x132257],fx_10:['Ньюкасл','Newcastle',0x222222,0xffffff],fx_15:['Астон Вилла','Aston Villa',0x670e36,0x95bfe5],fx_20:['Вест Хэм','West Ham',0x7a263a,0x1bb1e7],fx_25:['Брайтон','Brighton',0x0057b8,0xffffff],
   fx_more_0:['Эвертон','Everton',0x003399,0xffffff],fx_more_5:['Лестер','Leicester',0x003090,0xfdbe11],fx_more_10:['Вулверхэмптон','Wolverhampton',0xfdb913,0x231f20],fx_more_15:['Кристал Пэлас','Crystal Palace',0x1b458f,0xc4122e],
   ll_rma:['Реал Мадрид','Real Madrid',0xffffff,0xfebe10],ll_bar:['Барселона','Barcelona',0xa50044,0x004d98],ll_atm:['Атлетико Мадрид','Atlético Madrid',0xcb3524,0xffffff],ll_sev:['Севилья','Sevilla',0xffffff,0xd4021d],
   fx_1:['Валенсия','Valencia',0xf5f5f5,0xff7f00],fx_6:['Реал Сосьедад','Real Sociedad',0x0067b1,0xffffff],fx_11:['Вильярреал','Villarreal',0xfbe122,0x005187],fx_16:['Бетис','Real Betis',0x0bb363,0xffffff],fx_21:['Атлетик Бильбао','Athletic Club',0xee2523,0xffffff],fx_26:['Хетафе','Getafe',0x005999,0xffffff],
   fx_more_1:['Сельта','Celta Vigo',0x8ac3ee,0xffffff],fx_more_6:['Осасуна','Osasuna',0xd91a21,0x0a346f],fx_more_11:['Мальорка','Mallorca',0xe20613,0x111111],fx_more_16:['Райо Вальекано','Rayo Vallecano',0xffffff,0xe53027],
   bl_bay:['Бавария','Bayern Munich',0xdc052d,0xffffff],bl_bvb:['Боруссия Дортмунд','Borussia Dortmund',0xfde100,0x111111],bl_lev:['Байер Леверкузен','Bayer Leverkusen',0xe32221,0x111111],bl_rbl:['РБ Лейпциг','RB Leipzig',0xdd0741,0xffffff],
   fx_2:['Айнтрахт Франкфурт','Eintracht Frankfurt',0x111111,0xe1000f],fx_7:['Вольфсбург','Wolfsburg',0x65b32e,0xffffff],fx_12:['Боруссия Мёнхенгладбах','Mönchengladbach',0xffffff,0x00a550],fx_17:['Штутгарт','Stuttgart',0xffffff,0xe32219],fx_22:['Фрайбург','Freiburg',0xe2001a,0x111111],fx_27:['Хоффенхайм','Hoffenheim',0x1961b5,0xffffff],
   fx_more_2:['Вердер','Werder Bremen',0x1d9053,0xffffff],fx_more_7:['Унион Берлин','Union Berlin',0xeb1923,0xffffff],fx_more_12:['Майнц','Mainz',0xc3141e,0xffffff],fx_more_17:['Аугсбург','Augsburg',0xba3733,0x00875a],
   sa_int:['Интер','Inter',0x0068a8,0x111111],sa_mil:['Милан','AC Milan',0xfb090b,0x111111],sa_juv:['Ювентус','Juventus',0xffffff,0x111111],sa_nap:['Наполи','Napoli',0x12a0d7,0xffffff],
   fx_3:['Рома','Roma',0x8e1f2f,0xf0bc42],fx_8:['Лацио','Lazio',0x87d8f7,0xffffff],fx_13:['Аталанта','Atalanta',0x1e71b8,0x111111],fx_18:['Фиорентина','Fiorentina',0x482e92,0xffffff],fx_23:['Болонья','Bologna',0x1a2f48,0xa21c26],fx_28:['Торино','Torino',0x8b1a1a,0xffffff],
   fx_more_3:['Удинезе','Udinese',0xffffff,0x111111],fx_more_8:['Сассуоло','Sassuolo',0x00a550,0x111111],fx_more_13:['Дженоа','Genoa',0xa00028,0x0f1f4b],
   l1_psg:['ПСЖ','Paris Saint-Germain',0x004170,0xda291c],l1_om:['Марсель','Marseille',0x2faee0,0xffffff],l1_mon:['Монако','Monaco',0xe3000f,0xffffff],l1_lil:['Лилль','Lille',0xe01e13,0x1e2c60],
   fx_4:['Лион','Lyon',0xffffff,0x1a3a8f],fx_9:['Ницца','Nice',0xe3000f,0x111111],fx_14:['Ренн','Rennes',0xe13327,0x111111],fx_19:['Ланс','Lens',0xff0000,0xffd400],fx_24:['Страсбур','Strasbourg',0x009fe3,0xffffff],fx_29:['Нант','Nantes',0xfcd116,0x007a3d],
   fx_more_4:['Тулуза','Toulouse',0x5e2a84,0xffffff],fx_more_9:['Реймс','Reims',0xe4002b,0xffffff],fx_more_14:['Монпелье','Montpellier',0x1d3f8c,0xf47920],
   fiction_tier_0:['Эльче','Elche',0x00963f,0xffffff,'es'],fiction_tier_1:['Кадис','Cádiz',0xfcd116,0x003a8f,'es'],fiction_tier_2:['Алавес','Alavés',0x0761af,0xffffff,'es'],fiction_tier_3:['Леванте','Levante',0x004b93,0xa5001c,'es'],
   fiction_tier_4:['Эспаньол','Espanyol',0x0b6cb7,0xffffff,'es'],fiction_tier_5:['Бёрнли','Burnley',0x6c1d45,0x99d6ea,'en'],fiction_tier_6:['Шеффилд Юнайтед','Sheffield United',0xee2737,0x111111,'en'],fiction_tier_7:['Ипсвич Таун','Ipswich Town',0x3a64a3,0xffffff,'en'],
   fiction_tier_8:['Аякс','Ajax',0xffffff,0xd2122e,'nl'],fiction_tier_9:['Бенфика','Benfica',0xe83030,0xffffff,'pt'],fiction_tier_10:['Порту','Porto',0x003893,0xffffff,'pt'],fiction_tier_11:['Спортинг','Sporting CP',0x008057,0xffffff,'pt'],
   fiction_tier_12:['ПСВ','PSV',0xed1c24,0xffffff,'nl'],fiction_tier_13:['Селтик','Celtic',0x16a34a,0xffffff,'en'],fiction_tier_14:['Зенит','Zenit',0x0099d8,0xffffff,'ru'],fiction_tier_15:['Фенербахче','Fenerbahçe',0x002d72,0xffe100,'tr'],
   fiction_tier_16:['Галатасарай','Galatasaray',0xfdb913,0xa90432,'tr'],fiction_tier_17:['Бока Хуниорс','Boca Juniors',0x003f8a,0xf4c400,'es'],fiction_tier_18:['Ривер Плейт','River Plate',0xffffff,0xe30613,'es'],fiction_tier_19:['Фламенго','Flamengo',0xc8102e,0x111111,'pt'],
   fiction_tier_20:['Бешикташ','Beşiktaş',0x111111,0xffffff,'tr'],fiction_tier_21:['Андерлехт','Anderlecht',0x5b2a86,0xffffff,'fr'],fiction_tier_22:['Шахтёр Донецк','Shakhtar Donetsk',0xf47b20,0x111111,'sl'],fiction_tier_23:['Црвена Звезда','Red Star Belgrade',0xe30613,0xffffff,'sl']
  };
  const LG = { premier:'Английская Премьер-лига', laliga:'Ла Лига', bundesliga:'Бундеслига', seriea:'Серия A', ligue1:'Лига 1' };
  TEAMS.forEach(tm => {
    const r = R[tm.id];
    if (r) { tm.name = r[0]; tm._en = r[1]; tm.c1 = r[2]; tm.c2 = r[3]; if (r[4]) tm.pool = r[4]; tm.tag = tm.league ? 'Клуб · ' + LG[tm.league] : 'Клуб · ' + (tm.tier || ''); }
    else if (tm.nation) tm.tag = 'Сборная · ' + tm.name;
    tm.name0 = tm.name;
  });
  const ENGL = { ENG:{en:'England',fr:'Angleterre',es:'Inglaterra',tr:'İngiltere',az:'İngiltərə'}, SCO:{en:'Scotland',fr:'Écosse',es:'Escocia',tr:'İskoçya',az:'Şotlandiya'}, WAL:{en:'Wales',fr:'Pays de Galles',es:'Gales',tr:'Galler',az:'Uels'} };
  window.applyTeamNames = function () {
    const lg = (settings && settings.lang) || 'ru'; let dn = null;
    if (lg !== 'ru') { try { dn = new Intl.DisplayNames([lg], { type: 'region' }); } catch (e) {} }
    TEAMS.forEach(tm => {
      if (tm._ru === undefined) tm._ru = tm.name;
      let n = tm._ru;
      if (lg !== 'ru') {
        if (tm._en) n = tm._en;
        else if (tm.nation) {
          if (ENGL[tm.code]) n = ENGL[tm.code][lg] || n;
          else if (dn && tm.flag) { const cp = Array.from(tm.flag).map(c => c.codePointAt(0)); if (cp.length === 2 && cp[0] >= 0x1F1E6 && cp[0] <= 0x1F1FF) { try { n = dn.of(String.fromCharCode(cp[0] - 0x1F1E6 + 65, cp[1] - 0x1F1E6 + 65)) || n; } catch (e) {} } }
        }
      }
      tm.name = n;
    });
  };
  const LGN = { league_premier:['Премьер-лига','⚡'], league_laliga:['Ла Лига','☀️'], league_bundesliga:['Бундеслига','🛡️'], league_seriea:['Серия A','🌑'], league_ligue1:['Лига 1','🚀'] };
  window.applyTeamNames();
})();
// ---------- Уникальная форма у каждой команды: рисунок майки (0 однотонная, 1 кольца, 2 полосы, 3 половинки, 4 перевязь) ----------
(function assignKits() {
  const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255], dist = (a, b) => { const A = rgb(a), B = rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  const fixed = { ARG: 2, PAR: 2, CRO: 1, SVK: 0, URU: 0, NED: 0, BRA: 0 }, seen = [];
  TEAMS.forEach(t => {
    const similar = seen.filter(s => dist(s.c1, t.c1) < 75).length;   // чем больше похожих по цвету, тем «дальше» рисунок
    t.pat = fixed[t.code] !== undefined ? fixed[t.code] : similar % 5; seen.push(t);
  });
})();
const teamById = id => TEAMS.find(t => t.id === id) || TEAMS[0];
const teamPower = t => (t.spd + t.pow + t.def) / 3;
const teamTierLabel = t => t.tier || (teamPower(t) < 2.25 ? 'Слабая' : teamPower(t) >= 4.15 ? 'Сильная' : 'Средняя');

const HATS = ['Без шапки', 'Кепка', 'Корона', 'Цилиндр', 'Колпак'];
const BALLS = [
  { n: 'Классика', base: 0xffffff, patch: 0x1b1b1b },
  { n: 'Золотой',  base: 0xf2c200, patch: 0x6a4d00 },
  { n: 'Неон',     base: 0xb8ff3d, patch: 0x14210a },
  { n: 'Розовый',  base: 0xff7ac8, patch: 0x4a1030 },
  { n: 'Синий',    base: 0x3a86ff, patch: 0xffffff }
];

// ================== Комментатор ==================
const LINES = {
  kickoff: ['Стартовый свисток! Коровы выходят на поле.', 'Поехали! Мяч в игре, сено в руках.', 'Матч начался, трибуны мычат от восторга.'],
  goal: ['ГОЛ! Какое мощное копыто!', 'Мяч в сетке! Трибуны в молочном экстазе!', 'Это было неудержимо!', 'Гол! Вратарь даже не успел замычать.'],
  save: ['Вратарь спасает! Рога сработали!', 'Сэйв! Вот это реакция!', 'Взято! Мяч словно в сене утонул.'],
  cross: ['Навес в штрафную!', 'Подача на ход — защитники не успевают!', 'Мяч летит к дальней штанге!'],
  post: ['Штанга! Совсем чуть-чуть!', 'Звенит перекладина!', 'Мимо на волосок!'],
  miss: ['Мимо ворот. Мяч улетел в сено.', 'Не повезло! Чуть-чуть не хватило.'],
  pass: ['Красивый пас!', 'Передача как по маслу — молочному.'],
  power: ['Бонус на поле!', 'Кто-то нашёл подарок!'],
  hay: ['Сено! Скорость на максимум!', 'Корова пообедала и побежала быстрее.'],
  bell: ['Колокольчик! Соперники замерли!', 'Дзынь! Все стоят и слушают.'],
  milk: ['Молочный сверхудар заряжен!', 'Литр силы в одной бутылке!'],
  corner: ['Мяч застрял — судья выбил его в центр.'],
  last: ['Финальные секунды! Всё решается сейчас!', 'Время уходит, трибуны не дышат.'],
  win: ['Победа! Сегодня молоко только для победителей!', 'Финальный свисток — и праздник на поле!'],
  lose: ['Не повезло. В следующий раз повезёт.', 'Поражение, но голову выше, рога вперёд!'],
  draw: ['Ничья. Все в молоке, никто не в обиде.']
};

// ================== Звук (процедурный движок) ==================
const Audio_ = (() => {
  let ctx = null, master, comp, busM, busS, busC, verbIn, brown, white, crowdGain;
  let crowdBase = 0, crowdTarget = 0, swellT = 0, mus = null, musTimer = null;
  const vol = k => clamp((settings[k] || 0) / 100, 0, 1);

  function makeBrown(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    return b;
  }
  function makeWhite(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeIR(sec, decay) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  
// v15: расширенный набор плавных празднований, поверх исходной анимации.
const _cowAnimCelebrationsV15 = cowAnimExtra;
cowAnimExtra = function(c, spd, dt) {
  _cowAnimCelebrationsV15(c, spd, dt);
  if (state !== 'goal' || !c || c.team !== lastScorer) return;
  const t = Math.max(0, goalT), isStar = c === celeb;
  if (c.celebrationV15 == null && isStar) c.celebrationV15 = Math.floor(Math.random() * 8);
  const type = isStar ? (c.celebrationV15 || 0) : ((Math.abs(c.lk || 0) + (score[0] + score[1])) % 8 | 0);
  const wave = Math.sin(t * 0.19 + (c.lk || 0) * 0.8);
  const hop = Math.max(0, Math.sin(t * (type === 1 ? 0.24 : 0.15) + (isStar ? 0 : (c.lk || 0)))) ;
  c.celebrationLiftV15 = 0;
  if (type === 0) { // руки в стороны / раскрытая грудь
    c.body.rotation.z -= 0.12 + hop * 0.08; c.head.rotation.z -= 0.12;
    c.legs.forEach((l,i)=>{ l.rotation.z += (i<2 ? -1 : 1) * 0.12 * hop; });
  } else if (type === 1) { // повторные прыжки
    c.hopY = Math.max(c.hopY || 0, hop * 0.72); c.body.rotation.z -= 0.12 * hop;
    c.legs.forEach((l,i)=>{ l.rotation.z += (i%2 ? -1 : 1) * hop * 0.22; });
  } else if (type === 2) { // разворот и круг
    c.body.rotation.y += Math.sin(t * 0.055) * 0.65; c.body.rotation.z -= 0.08;
    c.tail.rotation.x += wave * 0.35;
  } else if (type === 3) { // имитация коленного скольжения
    const slide = Math.min(1, t / 18) * (t < 58 ? 1 : Math.max(0, 1 - (t - 58) / 24));
    c.body.rotation.z -= 0.42 * slide; c.body.rotation.x += 0.18 * slide;
    c.legs.forEach((l,i)=>{ l.rotation.z += (i < 2 ? 0.48 : -0.18) * slide; });
  } else if (type === 4) { // указывает на трибуны
    c.body.rotation.z -= 0.16 + hop * 0.05; c.body.rotation.y += Math.sin(t * 0.035) * 0.18;
    c.head.rotation.z -= 0.22;
  } else if (type === 5) { // победный танец
    c.body.rotation.z += wave * 0.22; c.body.rotation.y += Math.sin(t * 0.08) * 0.35;
    c.legs.forEach((l,i)=>{ l.rotation.z += Math.sin(t * 0.16 + i * Math.PI / 2) * 0.32; });
  } else if (type === 6) { // поклон / благодарность
    c.body.rotation.z += 0.22 * Math.min(1, t / 16) * (t < 45 ? 1 : Math.max(0, 1 - (t - 45) / 28));
    c.head.rotation.z += 0.2; c.tail.rotation.x += wave * 0.12;
  } else { // бег к партнёрам и лёгкие подпрыгивания
    c.body.rotation.z -= 0.1 + hop * 0.06; c.hopY = Math.max(c.hopY || 0, hop * 0.35);
    c.legs.forEach((l,i)=>{ l.rotation.z += Math.sin(t * 0.18 + i * Math.PI) * 0.26; });
  }
  if (c.arms && c.arms.length) c.arms.forEach((a,i)=>{ a.rotation.x += Math.sin(t * 0.17 + i * Math.PI) * 0.55; a.rotation.z += (i ? 1 : -1) * (0.25 + hop * 0.3); });
};
const _goalCelebrationV15 = goal;
goal = function(team) {
  _goalCelebrationV15(team);
  if (celeb) celeb.celebrationV15 = Math.floor(Math.random() * 8);
  cows.forEach(c => { if (c.team === team) { c.celebrationStartV15 = clock; } });
};

function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.connect(comp); comp.connect(ctx.destination);
    busM = ctx.createGain(); busS = ctx.createGain(); busC = ctx.createGain();
    busM.connect(master); busS.connect(master); busC.connect(master);
    const conv = ctx.createConvolver(); conv.buffer = makeIR(1.6, 2.6);
    verbIn = ctx.createGain(); verbIn.gain.value = 0.25; verbIn.connect(conv); conv.connect(master);
    brown = makeBrown(3); white = makeWhite(1);
    startCrowd(); applyVolumes();
  }
  function applyVolumes() {
    if (!ctx) return; const t = ctx.currentTime;
    master.gain.setTargetAtTime(Math.pow(vol('vMaster'), 1.4), t, 0.05);
    busM.gain.setTargetAtTime(vol('vMusic') * 0.9 * (settings.musicEnabled ? 1 : 0), t, 0.05);
    busS.gain.setTargetAtTime(vol('vSfx'), t, 0.05);
    busC.gain.setTargetAtTime(vol('vCrowd'), t, 0.05);
  }
  function startCrowd() {
    const src = ctx.createBufferSource(); src.buffer = brown; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    crowdGain = ctx.createGain(); crowdGain.gain.value = 0;
    src.connect(bp); bp.connect(lp); lp.connect(crowdGain); crowdGain.connect(busC); crowdGain.connect(verbIn);
    src.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23; const lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(crowdGain.gain); lfo.start();
    setInterval(() => { if (crowdGain) crowdGain.gain.setTargetAtTime(crowdTarget, ctx.currentTime, 0.4); }, 250);
  }
  // level 0..1 — «накал» на трибунах; 0 — тишина (меню)
  function crowd(level) { crowdBase = level <= 0 ? 0 : 0.03 + 0.17 * level; if (Date.now() > swellT) crowdTarget = crowdBase; }
  function swell(a, dur) { crowdTarget = Math.max(crowdBase, a); swellT = Date.now() + dur * 1000; setTimeout(() => { if (Date.now() >= swellT - 20) crowdTarget = crowdBase; }, dur * 1000 + 40); }

  function route(node, pan, wet) {
    let n = node;
    if (pan !== undefined && pan !== 0 && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); n.connect(p); n = p; }
    n.connect(busS);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; n.connect(w); w.connect(verbIn); }
  }
  function tone(type, f0, f1, dur, v, pan, wet, delay, attack) {
    if (!ctx) return; const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); route(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, v, f, q, type, pan, wet, delay) {
    if (!ctx) return; const t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(); s.buffer = white;
    const bp = ctx.createBiquadFilter(); bp.type = type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); route(g, pan, wet); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  }
  const sfx = {
    kick(power, pan) { if (!ctx) return; power = power || 0.5; tone('sine', 170 + power * 70, 46, 0.14, 0.45 + 0.35 * power, pan, 0.12); noise(0.05, 0.22 + 0.2 * power, 1800, 0.8, 'bandpass', pan); },
    pass(power, pan) { if (!ctx) return; power = clamp(power || 0.45, 0.2, 1); tone('triangle', 235 + power * 65, 82, 0.095, 0.24 + power * 0.16, pan, 0.12); noise(0.035, 0.12 + power * 0.06, 1550, 1.25, 'bandpass', pan, 0.08, 0.012); },
    shot(power, pan) { if (!ctx) return; power = clamp(power || 0.7, 0.2, 1); tone('sine', 215 + power * 80, 42, 0.2, 0.44 + power * 0.28, pan, 0.2); noise(0.065, 0.2 + power * 0.16, 2250, 0.9, 'bandpass', pan, 0.18); tone('triangle', 760, 210, 0.13, 0.11 + power * 0.07, pan, 0.12, 0.018); },
    receive(pan) { if (!ctx) return; noise(0.035, 0.16, 980, 1.4, 'bandpass', pan, 0.12); tone('triangle', 165, 105, 0.07, 0.16, pan, 0.12); },
    footstep(pan, run) { if (!ctx) return; const k = clamp(run || 0.5, 0.2, 1); noise(0.045, 0.05 + k * 0.045, 240 + k * 180, 0.85, 'lowpass', pan, 0.04); tone('sine', 94 + k * 24, 52, 0.055, 0.055 + k * 0.035, pan, 0.025); },
    glove(pan) { if (!ctx) return; noise(0.075, 0.2, 490, 0.85, 'lowpass', pan, 0.16); tone('sine', 145, 68, 0.1, 0.15, pan, 0.1); },
    net(pan, speed) { if (!ctx) return; const k = clamp((speed || 4) / 18, 0.2, 1); noise(0.19, 0.07 + k * 0.09, 1650, 2.1, 'bandpass', pan, 0.3); tone('sine', 470 + k * 180, 225, 0.17, 0.06 + k * 0.08, pan, 0.3); },
    bodyHit(pan) { if (!ctx) return; noise(0.085, 0.12, 420, 0.75, 'lowpass', pan, 0.12); tone('sine', 120, 54, 0.11, 0.15, pan, 0.08); },
    coinToss() { if (!ctx) return; tone('sine', 1100, 1750, 0.07, 0.1, 0, 0.15); tone('triangle', 1550, 720, 0.17, 0.12, 0, 0.22, 0.075); tone('sine', 820, 1180, 0.08, 0.075, 0, 0.16, 0.19); },
    handshake() { if (!ctx) return; noise(0.06, 0.055, 750, 1.2, 'bandpass', 0, 0.08); tone('triangle', 280, 205, 0.08, 0.055, 0, 0.05, 0.035); },
    moo(len, pitch, v, pan) {
      if (!ctx) return; len = len || 0.6; pitch = pitch || 140; v = v || 0.2;
      const t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'square';
      o.frequency.setValueAtTime(pitch * 1.25, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + len);
      o2.frequency.setValueAtTime(pitch * 0.63, t); o2.frequency.exponentialRampToValueAtTime(pitch * 0.35, t + len);
      f.type = 'lowpass'; f.frequency.value = 650; f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(f); o2.connect(f); f.connect(g); route(g, pan, 0.2); o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
    },
    bzz(len, v, pan) {
      if (!ctx) return; len = len || 0.45; v = v || 0.16;
      const t = ctx.currentTime, o = ctx.createOscillator(), am = ctx.createOscillator(), amg = ctx.createGain(), g1 = ctx.createGain(), env = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(95, t + len);
      am.frequency.value = 42; amg.gain.value = 0.5; g1.gain.value = 0.5; am.connect(amg); amg.connect(g1.gain);
      env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(v, t + 0.04); env.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g1); g1.connect(env); route(env, pan, 0.15); o.start(t); am.start(t); o.stop(t + len + 0.05); am.stop(t + len + 0.05);
    },
    creature(kind, big, pan) { if (kind === 'beetle') this.bzz(big ? 0.9 : 0.4, big ? 0.22 : 0.14, pan); else this.moo(big ? 1.0 : 0.35, big ? 120 : 160, big ? 0.28 : 0.12, pan); },
    whistle(len) {
      if (!ctx) return; len = len || 0.45; const t = ctx.currentTime, g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.03); g.gain.setValueAtTime(0.11, t + Math.max(0.04, len - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 32; lg.gain.value = 55; lfo.connect(lg);
      [2480, 2560].forEach(fr => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr; lg.connect(o.frequency); o.connect(g); o.start(t); o.stop(t + len + 0.02); });
      lfo.start(t); lfo.stop(t + len + 0.02); route(g, 0, 0.35);
    },
    horn() {
      if (!ctx) return; const t = ctx.currentTime, g = ctx.createGain(), f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08); g.gain.setValueAtTime(0.16, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      [110, 164.8, 220].forEach(fr => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + 1.55); });
      f.connect(g); route(g, 0, 0.4);
    },
    post(pan) { tone('sine', 920, 880, 0.55, 0.35, pan, 0.4); noise(0.2, 0.2, 3200, 4, 'bandpass', pan, 0.3); },
    save(pan) { noise(0.12, 0.35, 700, 1.2, 'bandpass', pan, 0.15); tone('sine', 120, 70, 0.12, 0.3, pan); },
    cross(pan) { noise(0.2, 0.12, 1250, 0.75, 'bandpass', pan, 0.25); tone('triangle', 380, 760, 0.22, 0.12, pan, 0.18); },
    bounce(pan, impact) { const v = clamp(impact || 0.35, 0.12, 0.55); tone('triangle', 190 + v * 110, 72, 0.12, 0.12 + v * 0.24, pan, 0.08); },
    tackle(pan) { noise(0.075, 0.22, 950, 1.1, 'bandpass', pan, 0.08); tone('sine', 125, 62, 0.11, 0.18, pan); },
    goal(pan) { [523, 659, 784].forEach((f, i) => tone('triangle', f, f * 1.01, 0.48, 0.13, pan, 0.24, i * 0.11)); },
    pick() { [660, 880, 1320].forEach((f, i) => tone('triangle', f, f, 0.18, 0.18, 0, 0.3, i * 0.07)); },
    bell() { [800, 1500, 2230].forEach((f, i) => tone('sine', f, f * 0.998, 1.3, 0.16 / (i + 1), 0, 0.5)); },
    ui() { tone('triangle', 560, 700, 0.07, 0.12); },
    back() { tone('triangle', 420, 330, 0.08, 0.1); },
    beep(final) { tone('sine', final ? 880 : 440, final ? 880 : 440, final ? 0.35 : 0.14, 0.18); },
    anthem() { [392, 494, 587, 659].forEach((f, i) => tone('triangle', f, f, 1.2, 0.055, 0, 0.28, i * 0.25, 0.22)); },
    kickoff() { this.whistle(0.62); },
    cheer(a, dur) { swell(a || 0.4, dur || 2.5); },
    ooh() { swell(0.28, 1.2); }
  };

  // ---- Музыка: отдельные процедурные темы для меню, турнира и матча ----
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function mnote(type, m, t, dur, v, lp, atk) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = mtof(m); let n = o;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (atk || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(g); g.connect(busM); o.start(t); o.stop(t + dur + 0.05);
  }
  function mkick(t, v) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.16); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(busM); o.start(t); o.stop(t + 0.22); }
  function mnoise(t, dur, v, f, type) { const s = ctx.createBufferSource(); s.buffer = white; const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(b); b.connect(g); g.connect(busM); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05); }
  function playStep(mode, step, t, trackId) {
    const song = MUSIC_LIBRARY[trackId] || MUSIC_LIBRARY.sunset;
    const bar = Math.floor(step / 16) % 4, s = step % 16, ch = song.chords[bar], sp = 60 / song.bpm / 4;
    if (mode === 'match') {
      if (s % 4 === 0) mkick(t, song.kick);
      if (song.snare.indexOf(s) >= 0) mnoise(t, 0.12, 0.16, 1800, 'bandpass');
      if (song.hats && s % 2 === 1) mnoise(t, 0.04, 0.075, 7000, 'highpass');
      if ([0, 3, 6, 8, 11, 14].indexOf(s) >= 0) mnote(song.bassWave, ch[0] - 24, t, sp * 2.2, song.bass, 420);
      if (s % 2 === 0) mnote(song.leadWave, ch[(s / 2) % 3] + (s >= 8 ? 24 : 12), t, sp * 1.5, song.lead, 3000);
      if (song.pad && (s === 0 || s === 8)) mnote('sawtooth', ch[2] + 12, t, sp * 1.5, song.pad, 1400);
    } else {
      if (s === 0 || (mode === 'tour' && s === 8)) mkick(t, song.kick);
      if (mode === 'tour' && s === 10) mkick(t, song.kick * 0.65);
      if (song.hats && s % 4 === 2) mnoise(t, 0.04, 0.055, 7000, 'highpass');
      if (song.snare.indexOf(s) >= 0) mnoise(t, 0.07, 0.08, 2200, 'bandpass');
      if (s === 0) { ch.forEach(m => mnote(song.bassWave, m, t, sp * 14, song.pad, 900, 0.7)); mnote('sine', ch[0] - 24, t, sp * 8, song.bass, 0, 0.02); }
      if (s % 4 === 0) mnote(song.leadWave, ch[(s / 4) % 3] + 12, t, sp * 3, song.lead, 2600);
    }
  }
  function sched() {
    if (!mus || !ctx) return;
    const song = MUSIC_LIBRARY[mus.track] || MUSIC_LIBRARY.sunset;
    while (mus.next < ctx.currentTime + 0.2) { playStep(mus.mode, mus.step, mus.next, mus.track); mus.next += 60 / song.bpm / 4; mus.step = (mus.step + 1) % 64; }
  }
  const music = {
    play(mode) {
      const slot = ({ menu:'musicMenu', tour:'musicTour', match:'musicMatch' })[mode] || 'musicMenu';
      const fallback = ({ musicMenu:'sunset', musicTour:'cup', musicMatch:'anthem' })[slot], track = MUSIC_LIBRARY[settings[slot]] ? settings[slot] : fallback;
      const changed = !mus || mus.mode !== mode || mus.track !== track;
      if (!settings.musicEnabled) { mus = null; return; }
      if (!changed) return;
      if (!ctx) return;
      mus = { mode, track, step: 0, next: ctx.currentTime + 0.12 }; if (!musTimer) musTimer = setInterval(sched, 60);
    },
    stop() { mus = null; },
    duck(sec) { if (!ctx) return; const t = ctx.currentTime, v = vol('vMusic') * 0.9 * (settings.musicEnabled ? 1 : 0); busM.gain.cancelScheduledValues(t); busM.gain.setTargetAtTime(v * 0.2, t, 0.05); busM.gain.setTargetAtTime(v, t + sec, 0.4); }
  };
  return { init, applyVolumes, crowd, swell, sfx, music, ok: () => !!ctx };
})();
const SFX = Audio_.sfx;

// ================== Three.js: сцена ==================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance', alpha: false });
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.LinearToneMapping; renderer.toneMappingExposure = 0.9;   // ACES обесцвечивал картинку
// Качественные real-time тени от направленного света и стадионных прожекторов.
renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; let shadowTick = 0;   // тени обновляем по расписанию, а не каждый кадр
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
let renderScale = 1, camF = 1;
const computePR = () => Math.max(0.5, Math.min(window.devicePixelRatio || 1, PRESETS[gfxLevel()].pr, 3) * (settings.res / 100) * renderScale);
let _appliedPixelRatioV33 = 0, _appliedWidthV33 = 0, _appliedHeightV33 = 0;
function applyRes() { const pr = computePR(); const w = Math.max(1, Math.round(window.innerWidth)), h = Math.max(1, Math.round(window.innerHeight)); if (Math.abs(pr - _appliedPixelRatioV33) > 0.01) { renderer.setPixelRatio(pr); _appliedPixelRatioV33 = pr; _appliedWidthV33 = _appliedHeightV33 = 0; } if (w !== _appliedWidthV33 || h !== _appliedHeightV33) { renderer.setSize(w, h, false); _appliedWidthV33 = w; _appliedHeightV33 = h; } }
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1020);
scene.fog = new THREE.Fog(0x0a1020, 60, 150);
const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 240);
const hemi = new THREE.HemisphereLight(0xffffff, 0x36552b, 1.0); scene.add(hemi);
const dirL = new THREE.DirectionalLight(0xfff8e8, 0.92); dirL.position.set(-12, 25, 14);
dirL.castShadow = true; dirL.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
dirL.shadow.camera.left = -30; dirL.shadow.camera.right = 30; dirL.shadow.camera.top = 25; dirL.shadow.camera.bottom = -25; dirL.shadow.camera.near = 1; dirL.shadow.camera.far = 100; dirL.shadow.camera.updateProjectionMatrix();
dirL.shadow.camera.near = 1; dirL.shadow.camera.far = 75; dirL.shadow.bias = -0.00018; dirL.shadow.normalBias = 0.025; dirL.shadow.radius = IS_TOUCH ? 2 : 3;
scene.add(dirL);
const stadiumSpots = [];
[[-30, -(FH * S / 2 + 9)], [30, -(FH * S / 2 + 9)], [-30, FH * S / 2 + 9], [30, FH * S / 2 + 9]].forEach(([x,z], i) => {
  const light = new THREE.SpotLight(0xfff2d6, 0, 75, Math.PI / 4.3, 0.48, 1.6);
  light.position.set(x, 16, z); light.target.position.set(0, 0, 0); light.castShadow = !IS_TOUCH && (i === 0 || i === 2);
  if (light.castShadow) { light.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024); light.shadow.bias = -0.0002; light.shadow.normalBias = 0.02; light.shadow.radius = IS_TOUCH ? 2 : 4; }
  scene.add(light); scene.add(light.target); stadiumSpots.push(light);
});

const M = c => new THREE.MeshLambertMaterial({ color: c });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const SP = (r, ws, hs) => new THREE.SphereGeometry(r, ws || 10, hs || 8);
const CN = (r, h, s) => new THREE.ConeGeometry(r, h, s || 6);
const CY = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 8);
const TR = (r, t, rs, ts) => new THREE.TorusGeometry(r, t, rs || 6, ts || 12);
const mp = (geo, color, pos, rot, scale) => ({ geo, color, pos, rot, scale });
const softTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  const m = new THREE.Matrix4(), e = new THREE.Euler(), qq = new THREE.Quaternion(), c = new THREE.Color(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  parts.forEach(p => {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    const r = p.rot || [0, 0, 0], s = p.scale || [1, 1, 1];
    e.set(r[0], r[1], r[2]); qq.setFromEuler(e); v.set(p.pos[0], p.pos[1], p.pos[2]); sc.set(s[0], s[1], s[2]);
    m.compose(v, qq, sc); g.applyMatrix4(m); c.setHex(p.color);
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) col.push(c.r, c.g, c.b);
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// ================== Время суток и погода ==================
const ENVS = {
  day:   { bg: 0x8fd0ff, hemiS: 0xf4f8ff, hemiG: 0x39733a, hemiI: 1.05, dirC: 0xfff7e8, dirI: 0.9, lamp: 0.0, pitch: 1.08, ground: 0x1d4a26 },
  dusk:  { bg: 0xd98a62, hemiS: 0xffd9bd, hemiG: 0x3d4a35, hemiI: 0.95, dirC: 0xffb070, dirI: 0.75, lamp: 0.6, pitch: 0.9,  ground: 0x1a3a22 },
  night: { bg: 0x0a1020, hemiS: 0xcfe0ff, hemiG: 0x1d3a22, hemiI: 0.95, dirC: 0xfff4dc, dirI: 0.7,  lamp: 1.0, pitch: 0.85, ground: 0x12281a }
};
const SKY = { day: { top: 0x2f7fe0, mid: 0x7fc3ff, h: 0xcdeaff }, dusk: { top: 0x3a3f86, mid: 0xd9708a, h: 0xffb27a }, night: { top: 0x050a1e, mid: 0x0e1b44, h: 0x23366e } };
const skyCv = document.createElement('canvas'); skyCv.width = 4; skyCv.height = 128;
const skyTex = new THREE.CanvasTexture(skyCv); skyTex.encoding = THREE.sRGBEncoding;
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 12), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })); skyDome.renderOrder = -10; scene.add(skyDome);
const stars = (() => {
  const sp = []; for (let i = 0; i < 170; i++) { const a = Math.random() * 6.283, e = 0.12 + Math.random() * 1.2; sp.push(Math.cos(a) * Math.cos(e) * 140, Math.sin(e) * 140, Math.sin(a) * Math.cos(e) * 140); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, color: 0xffffff, fog: false, transparent: true, opacity: 0.85, depthWrite: false })); p.visible = false; scene.add(p); return p;
})();
function paintSky(tod, weather) {
  const Sk = SKY[tod], g = skyCv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
  const col = hex => { const c = new THREE.Color(hex); if (weather === 'rain') c.lerp(new THREE.Color(0x56677f), 0.55); else if (weather === 'snow') c.lerp(new THREE.Color(0xc9d6e4), 0.5); return '#' + c.getHexString(); };
  gr.addColorStop(0, col(Sk.top)); gr.addColorStop(0.3, col(Sk.mid)); gr.addColorStop(0.5, col(Sk.h)); gr.addColorStop(1, col(Sk.h));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128); skyTex.needsUpdate = true; stars.visible = tod === 'night' && weather === 'clear';
}
let curEnv = { tod: 'night', weather: 'clear' };
const stripeMats = [], stripeBase = [];
const lampM = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });
const groundMat = M(0x12281a);
const snowCover = new THREE.Mesh(new THREE.PlaneGeometry(36.4, 20.9), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
snowCover.rotation.x = -Math.PI / 2; snowCover.position.y = 0.012; snowCover.visible = false; scene.add(snowCover);

function applyEnv(tod, weather) {
  if (!tod || tod === 'auto') { const r = Math.random(); tod = r < 0.4 ? 'day' : r < 0.7 ? 'dusk' : 'night'; }
  if (!weather || weather === 'auto') { const r = Math.random(); weather = r < 0.6 ? 'clear' : r < 0.82 ? 'rain' : 'snow'; }
  const E = ENVS[tod]; curEnv = { tod, weather }; paintSky(tod, weather);
  const bg = new THREE.Color(SKY[tod].h); let near = 70, far = 170, hI = E.hemiI;
  if (weather === 'rain') { bg.lerp(new THREE.Color(0x56677f), 0.55); near = 28; far = 105; hI *= 0.85; }
  if (weather === 'snow') { bg.lerp(new THREE.Color(0xc9d6e4), 0.5); near = 38; far = 125; }
  if (weather === 'fog') { bg.lerp(new THREE.Color(0x8793a3), 0.48); near = 12; far = 68; hI *= 0.72; }
  far *= (settings.viewDist || 100) / 100;
  scene.background = bg; scene.fog.color.copy(bg); scene.fog.near = near; scene.fog.far = far;
  hemi.color.setHex(E.hemiS); hemi.groundColor.setHex(E.hemiG); hemi.intensity = hI;
  dirL.color.setHex(E.dirC); dirL.intensity = E.dirI * (weather === 'rain' ? 0.8 : 1);
  stadiumSpots.forEach(light => { light.intensity = E.lamp * 1.2 * (weather === 'rain' ? 1.15 : 1.0); });
  lampHalos.forEach(h => { h.material.opacity = gfxLevel() === 'low' ? 0 : 0.6 * E.lamp; h.visible = h.material.opacity > 0; });
  lampM.color.copy(new THREE.Color(0x4a5060).lerp(new THREE.Color(0xfff7d6), E.lamp));
  groundMat.color.setHex(E.ground);
  stripeMats.forEach((m, i) => { m.color.setHex(stripeBase[i]); m.color.multiplyScalar(E.pitch * (weather === 'rain' ? 0.9 : 1)); });
  snowCover.visible = weather === 'snow';
  if (typeof wetSheen !== 'undefined') wetSheen.visible = weather === 'rain' && !!settings.reflections && gfxLevel() !== 'low';
  rainLines.visible = weather === 'rain' && effParts() > 0 && settings.weatherIntensity > 0;
  snowPts.visible = weather === 'snow' && effParts() > 0 && settings.weatherIntensity > 0;
  const n = (effParts() === 2 ? 1 : 0.5) * clamp(settings.weatherIntensity / 100, 0, 1.5);
  rainGeo.setDrawRange(0, Math.floor(RAIN_N * 2 * n)); snowGeo.setDrawRange(0, Math.floor(SNOW_N * n));
  return curEnv;
}

// ================== Поле ==================
const ground = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; ground.material = groundMat; scene.add(ground);
const fieldW = FW * S, fieldD = FH * S, hx = fieldW / 2, hz = fieldD / 2;
// Текстура травы: тонкие «травинки» разной яркости + мягкие тёмные пятна; один маленький канвас на все полосы.
const grassMap = (() => {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.fillStyle = '#dcdcdc'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1100; i++) { const v = 175 + (Math.random() * 80 | 0); g.fillStyle = `rgba(${v},${v + (Math.random() * 14 | 0)},${v - 12},${0.22 + Math.random() * 0.35})`; g.fillRect(Math.random() * s, Math.random() * s, 1, 2 + Math.random() * 4); }
  for (let i = 0; i < 10; i++) { const x = Math.random() * s, y = Math.random() * s, gr = g.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, 'rgba(60,90,40,.10)'); gr.addColorStop(1, 'rgba(60,90,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 10); t.encoding = THREE.sRGBEncoding;
  t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return t;
})();
for (let i = 0; i < 12; i++) {
  const w = fieldW / 12, base = new THREE.Color(i % 2 ? 0x2fa63e : 0x40bf50).offsetHSL((Math.random() - 0.5) * 0.014, (Math.random() - 0.5) * 0.07, (Math.random() - 0.5) * 0.035).getHex(),
    m = new THREE.MeshLambertMaterial({ color: base, map: grassMap });
  stripeMats.push(m); stripeBase.push(base);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, fieldD), m);
  s.rotation.x = -Math.PI / 2; s.position.set(-hx + w * (i + 0.5), 0, 0); s.receiveShadow = true; scene.add(s);
}
// V44 external grass-detail texture: tiling grayscale detail combines with pitch colors and weather tint.
(function loadGrassTextureV44(){
  try {
    const loader = new THREE.TextureLoader();
    loader.load('grass-field.png', tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.5, 10);
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
      stripeMats.forEach(m => { m.map = tex; m.needsUpdate = true; });
    }, undefined, () => {});
  } catch (_) {}
})();

// Крупные неровные пятна «стрижки» поверх полос: разные оттенки зелёного без тяжёлых шейдеров.
const patchPlane = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 46; i++) { const x = Math.random() * 256, y = Math.random() * 128, r = 14 + Math.random() * 30, dark = Math.random() < 0.55, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, dark ? 'rgba(8,48,14,.13)' : 'rgba(170,255,110,.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); }
  const t = new THREE.CanvasTexture(c), m = new THREE.Mesh(new THREE.PlaneGeometry(fieldW, fieldD), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; m.material.polygonOffset = true; m.material.polygonOffsetFactor = -1; m.material.polygonOffsetUnits = -1; scene.add(m); return m;
})();
const wetSheen = new THREE.Mesh(new THREE.PlaneGeometry(fieldW, fieldD), new THREE.MeshBasicMaterial({color:0x9cc9ff,transparent:true,opacity:.055,depthWrite:false,blending:THREE.AdditiveBlending}));
wetSheen.rotation.x=-Math.PI/2; wetSheen.position.y=.016; wetSheen.visible=false; wetSheen.renderOrder=2; scene.add(wetSheen);
const lineM = new THREE.MeshBasicMaterial({ color: 0xf6f8f2 });
const fieldEdgeM = new THREE.LineBasicMaterial({ color: 0xf6f8f2 });
function line(x1, z1, x2, z2, t) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.hypot(x2 - x1, z2 - z1), t || 0.14), lineM);
  m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  m.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2); m.renderOrder = 3; scene.add(m);
}
line(-hx, -hz, hx, -hz); line(-hx, hz, hx, hz); line(-hx, -hz, -hx, hz); line(hx, -hz, hx, hz); line(0, -hz, 0, hz);
// Полные штрафные площади, отметки пенальти и дуги; разметка привязана к масштабу поля.
[-1, 1].forEach(sd => {
  const gx = sd * hx, edge = sd * (hx - 7.5), spotX = sd * (hx - 5.5);
  line(gx, -7, edge, -7); line(gx, 7, edge, 7); line(edge, -7, edge, 7);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), lineM);
  spot.rotation.x = -Math.PI / 2; spot.position.set(spotX, 0.034, 0); scene.add(spot);
  const arcPts = [];
  for (let i = 0; i <= 64; i++) {
    const a = i / 64 * Math.PI * 2, x = spotX + sd * 2.2 * Math.cos(a), z = 2.2 * Math.sin(a);
    if (sd * x < hx - 7.5 - 0.02) arcPts.push(new THREE.Vector3(x, 0.034, z));
  }
  if (arcPts.length > 1) { const geo = new THREE.BufferGeometry().setFromPoints(arcPts); scene.add(new THREE.Line(geo, fieldEdgeM)); }
});
// Угловые дуги и флажки.
[-1, 1].forEach(sx => [-1, 1].forEach(sz => {
  const arcPts = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; arcPts.push(new THREE.Vector3(sx * (hx - 0.55 * Math.cos(a)), 0.034, sz * (hz - 0.55 * Math.sin(a)))); }
  const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts); scene.add(new THREE.Line(arcGeo, fieldEdgeM));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, 1.35, 10), M(0xf4f7ff)); pole.position.set(sx * (hx - .4), .67, sz * (hz - .4)); scene.add(pole);
  const flag = new THREE.Mesh(new THREE.ConeGeometry(.28, .42, 4), M(sx === -1 ? 0xb8ff3d : 0xff7a1a)); flag.rotation.z = -Math.PI / 2; flag.position.set(sx * (hx - .25), 1.1, sz * (hz - .4)); scene.add(flag);
}));
[-1, 1].forEach(sd => {
  const bx = sd * hx, bi = sd * (hx - 4.5);
  line(bx, -4.5, bi, -4.5); line(bx, 4.5, bi, 4.5); line(bi, -4.5, bi, 4.5);
  const sp = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), lineM);
  sp.rotation.x = -Math.PI / 2; sp.position.set(sd * (hx - 3.2), 0.034, 0); scene.add(sp);
});
const ring = new THREE.Mesh(new THREE.RingGeometry(2.68, 2.82, 48), lineM);
ring.rotation.x = -Math.PI / 2; ring.position.y = 0.034; scene.add(ring);
const cdot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), lineM);
cdot.rotation.x = -Math.PI / 2; cdot.position.y = 0.034; scene.add(cdot);

// --- ворота ---
const nets = [];
const postM = M(0xffffff), gw = GH * S, gHt = 2.4, gDepth = 1.6;
const goalMats = [];
[-1, 1].forEach(sd => {
  const gx = sd * hx;
  [-1, 1].forEach(zs => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, gHt, 10), postM); p.castShadow = true; p.position.set(gx, gHt / 2, zs * gw / 2); scene.add(p);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, gHt, 8), postM); b.castShadow = true; b.position.set(gx + sd * gDepth, gHt / 2, zs * gw / 2); scene.add(b);
  });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, gw, 10), postM);
  bar.castShadow = true; bar.rotation.x = Math.PI / 2; bar.position.set(gx, gHt, 0); scene.add(bar);
  // Сетка расположена ЗА плоскостью ворот: передняя часть проёма полностью открыта.
  // Рисуем заднюю сетку и боковые/верхнюю направляющие отдельными линиями, а не BoxGeometry,
  // иначе сетка пересекает створ и визуально выглядит как зашитые ворота.
  const netPts = [];
  const backX = gx + sd * (gDepth - 0.04);
  const frontX = gx + sd * 0.06;
  const z0 = -gw / 2 + 0.04, z1 = gw / 2 - 0.04;
  const y0 = 0.08, y1 = gHt - 0.06;
  const seg = (a,b) => { netPts.push(a[0],a[1],a[2], b[0],b[1],b[2]); };
  // задняя плоскость сетки
  for (let i=0;i<=10;i++) { const z=lerp(z0,z1,i/10); seg([backX,y0,z],[backX,y1,z]); }
  for (let i=0;i<=6;i++) { const y=lerp(y0,y1,i/6); seg([backX,y,z0],[backX,y,z1]); }
  // две боковые стенки и потолок сетки; передняя плоскость намеренно отсутствует
  [-1,1].forEach(side => { const z=side<0?z0:z1; for(let i=0;i<=4;i++){ const x=lerp(frontX,backX,i/4); seg([x,y0,z],[x,y1,z]); } for(let i=0;i<=4;i++){ const y=lerp(y0,y1,i/4); seg([frontX,y,z],[backX,y,z]); } });
  for(let i=0;i<=4;i++){ const x=lerp(frontX,backX,i/4); seg([x,y1,z0],[x,y1,z1]); }
  const netGeo = new THREE.BufferGeometry(); netGeo.setAttribute('position', new THREE.Float32BufferAttribute(netPts,3));
  const netMat = new THREE.LineBasicMaterial({ color: 0xf4f8ff, transparent: true, opacity: 0.22 });
  const net = new THREE.LineSegments(netGeo, netMat);
  nets.push({ geo: netGeo, mat: netMat, base: Float32Array.from(netPts), sd, front: frontX, back: backX, amp: 0, vel: 0, cy: 1, cz: 0 });
  net.frustumCulled = false; scene.add(net);
  const gm = new THREE.MeshBasicMaterial({ color: 0x3a86ff, transparent: true, opacity: 0.18 }); goalMats.push(gm);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, gw + 1), gm);
  mat.rotation.x = -Math.PI / 2; mat.position.set(gx - sd * 0.8, 0.015, 0); scene.add(mat);
});

// --- борта (v35): много разной рекламы, логотип игры, бегущая LED-лента ---
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawLogoMark(g, cx, cy, s) {
  const u = s / 128; g.save(); g.translate(cx - 64 * u, cy - 64 * u); g.scale(u, u);
  const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#ff6fb5'); gr.addColorStop(1, '#6d4bff'); g.fillStyle = gr; rr(g, 4, 4, 120, 120, 30); g.fill();
  g.fillStyle = '#f7ecd6'; g.beginPath(); g.moveTo(30, 40); g.quadraticCurveTo(14, 18, 30, 12); g.quadraticCurveTo(36, 26, 44, 34); g.fill();
  g.beginPath(); g.moveTo(98, 40); g.quadraticCurveTo(114, 18, 98, 12); g.quadraticCurveTo(92, 26, 84, 34); g.fill();
  g.fillStyle = '#2b2b3a'; g.beginPath(); g.ellipse(20, 56, 14, 8, -0.4, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(108, 56, 14, 8, 0.4, 0, 6.3); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(64, 66, 38, 42, 0, 0, 6.3); g.fill();
  g.fillStyle = '#2b2b3a'; g.beginPath(); g.ellipse(42, 42, 10, 13, 0.5, 0, 6.3); g.fill();
  g.beginPath(); g.arc(80, 56, 5, 0, 6.3); g.fill(); g.beginPath(); g.arc(50, 58, 5, 0, 6.3); g.fill();
  g.fillStyle = '#ffb3d1'; g.beginPath(); g.ellipse(64, 88, 24, 16, 0, 0, 6.3); g.fill();
  g.fillStyle = '#c2407a'; g.beginPath(); g.ellipse(55, 88, 3.5, 5, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(73, 88, 3.5, 5, 0, 0, 6.3); g.fill();
  g.restore();
}
const LOGO_SVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23ff6fb5'/><stop offset='1' stop-color='%236d4bff'/></linearGradient></defs><rect x='4' y='4' width='120' height='120' rx='30' fill='url(%23g)'/><path d='M30 40Q14 18 30 12Q36 26 44 34Z' fill='%23f7ecd6'/><path d='M98 40Q114 18 98 12Q92 26 84 34Z' fill='%23f7ecd6'/><ellipse cx='20' cy='56' rx='14' ry='8' transform='rotate(-23 20 56)' fill='%232b2b3a'/><ellipse cx='108' cy='56' rx='14' ry='8' transform='rotate(23 108 56)' fill='%232b2b3a'/><ellipse cx='64' cy='66' rx='38' ry='42' fill='%23fff'/><ellipse cx='42' cy='42' rx='10' ry='13' transform='rotate(28 42 42)' fill='%232b2b3a'/><circle cx='80' cy='56' r='5' fill='%232b2b3a'/><circle cx='50' cy='58' r='5' fill='%232b2b3a'/><ellipse cx='64' cy='88' rx='24' ry='16' fill='%23ffb3d1'/><ellipse cx='55' cy='88' rx='3.5' ry='5' fill='%23c2407a'/><ellipse cx='73' cy='88' rx='3.5' ry='5' fill='%23c2407a'/></svg>";
try {
  document.documentElement.style.setProperty('--logoimg', 'url("data:image/svg+xml;utf8,' + LOGO_SVG + '")');
  let ic = document.querySelector('link[rel~="icon"]'); if (!ic) { ic = document.createElement('link'); ic.rel = 'icon'; document.head.appendChild(ic); } ic.href = 'data:image/svg+xml;utf8,' + LOGO_SVG;
} catch (e) {}
const AD_BRANDS = [
  ['МОЛОЧНАЯ ЛИГА', '🥛', '#ffffff', '#1565c0'], ['СЕНО+', '🌾', '#1b1b1b', '#ffd54f'], ['МУУУ-БАНК', '💳', '#ffffff', '#2e7d32'], ['ТРАВКА-COLA', '🥤', '#ffffff', '#d32f2f'],
  ['БУРЁНКА МОБАЙЛ', '📱', '#ffffff', '#7b1fa2'], ['РОГА & КОПЫТА', '🐂', '#ffffff', '#e65100'], ['СЫРНЫЙ ДОМ', '🧀', '#3e2723', '#ffca28'], ['КОЛОКОЛЬЧИК TV', '🔔', '#ffffff', '#00838f'],
  ['АГРО-ТУРБО', '🚜', '#ffffff', '#558b2f'], ['ФЕРМА 24', '🥕', '#ffffff', '#ef6c00'], ['СПОРТ-ЛАКТ', '⚽', '#ffffff', '#0277bd'], ['ПАСТБИЩЕ AIR', '✈️', '#0d47a1', '#e3f2fd'],
  ['ЗЁРНЫШКО', '🌽', '#3e2723', '#fdd835'], ['КОРОВИЙ ЭКСПРЕСС', '🚚', '#ffffff', '#c62828'], ['МУ-ПИЦЦА', '🍕', '#ffffff', '#bf360c'], ['COWBALL', 'LOGO', '#ffffff', '#ff4fa3']
];
function adTexture(shift) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 128; const g = c.getContext('2d'), n = 8, pw = 2048 / n;
  const tags = ['Официальный партнёр', 'Генеральный спонсор', 'Партнёр матча', 'Рекомендует Cowball'];
  for (let i = 0; i < n; i++) {
    const b = AD_BRANDS[(i * 2 + shift) % AD_BRANDS.length], x = i * pw;
    const gr = g.createLinearGradient(x, 0, x + pw, 128); gr.addColorStop(0, b[3]); gr.addColorStop(1, '#0a0e17'); g.fillStyle = gr; g.fillRect(x, 0, pw, 128);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x, 0, pw, 6); g.fillRect(x, 122, pw, 6);
    g.textBaseline = 'middle'; g.textAlign = 'center';
    if (b[1] === 'LOGO') drawLogoMark(g, x + 58, 64, 84); else { g.font = '56px Arial'; g.fillStyle = '#fff'; g.fillText(b[1], x + 56, 66); }
    g.fillStyle = b[2]; g.font = 'italic 900 ' + (b[0].length > 12 ? 32 : 42) + 'px Arial'; g.fillText(b[0], x + pw / 2 + 36, 52, pw - 130);
    g.font = '700 20px Arial'; g.fillStyle = 'rgba(255,255,255,.78)'; g.fillText(tags[(i + shift) % 4], x + pw / 2 + 36, 98, pw - 130);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + pw - 3, 8, 3, 112);
  }
  const tx = new THREE.CanvasTexture(c); tx.wrapS = THREE.RepeatWrapping; return tx;
}
const adTexA = adTexture(0), adTexB = adTexture(5);
const adMat = new THREE.MeshBasicMaterial({ map: adTexA }), adMat2 = new THREE.MeshBasicMaterial({ map: adTexB }), darkM = M(0x0a0e17);
[-hz - 1.0, hz + 1.0].forEach(z => { const b = new THREE.Mesh(new THREE.BoxGeometry(fieldW + 4, 1.0, 0.18), [darkM, darkM, darkM, darkM, adMat, adMat]); b.position.set(0, 0.5, z); scene.add(b); });
[-1, 1].forEach(sd => { const m2 = [darkM, darkM, darkM, darkM, darkM, darkM]; m2[sd > 0 ? 1 : 0] = adMat2; const b = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, fieldD + 2.2), m2); b.position.set(sd * (hx + gDepth + 0.6), 0.5, 0); scene.add(b); });
{ const lc = document.createElement('canvas'); lc.width = lc.height = 256; drawLogoMark(lc.getContext('2d'), 128, 128, 232);
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lc), transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  lm.rotation.x = -Math.PI / 2; lm.position.set(0, 0.024, 0); scene.add(lm); }

// Табло над главной трибуной: отдельная текстура, обновляется только при смене счёта/секунды.
const boardCanvas = document.createElement('canvas'); boardCanvas.width = 512; boardCanvas.height = 160;
const boardCtx = boardCanvas.getContext('2d'), boardTexture = new THREE.CanvasTexture(boardCanvas);
boardTexture.encoding = THREE.sRGBEncoding;
const boardFrame = box(10.4, 3.5, 0.55, darkM); boardFrame.position.set(0, 9.1, -(hz + 8.7)); scene.add(boardFrame);
const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 2.95), new THREE.MeshBasicMaterial({ map: boardTexture, toneMapped: false }));
boardFace.position.set(0, 9.1, -(hz + 8.39)); scene.add(boardFace);
[-1, 1].forEach(s => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.7, 8), M(0x2a3042)); leg.position.set(s * 4.35, 5.7, -(hz + 8.7)); scene.add(leg); });
function drawStadiumScoreboard() {
  const g = boardCtx; if (!g) return;
  g.clearRect(0, 0, 512, 160); g.fillStyle = '#08101b'; g.fillRect(0, 0, 512, 160);
  g.fillStyle = '#b8ff3d'; g.font = '700 19px Arial'; g.textAlign = 'center'; g.fillText('COWBALL · MATCHDAY', 256, 28);
  const a = sideTeam[0], b = sideTeam[1], shown = t => t.nation ? `${t.flag} ${t.code}` : (/^FT\d+$/i.test(String(t.code||'')) ? String(t.name||'КЛУБ').replace(/[^A-ZА-ЯЁ]/gi,'').slice(0,4).toUpperCase() : t.code);
  g.font = '800 27px Arial'; g.textAlign = 'left'; g.fillStyle = '#' + a.c1.toString(16).padStart(6, '0'); g.fillText(shown(a), 22, 85);
  g.textAlign = 'right'; g.fillStyle = '#' + b.c1.toString(16).padStart(6, '0'); g.fillText(shown(b), 490, 85);
  g.textAlign = 'center'; g.fillStyle = '#f7f9ff'; g.font = '800 48px Arial'; g.fillText(`${score[0]} : ${score[1]}`, 256, 103);
  const sec = Math.max(0, Math.ceil(timeLeft)), time = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  g.fillStyle = '#d2dcf0'; g.font = '700 18px Arial'; g.fillText(time, 256, 139); boardTexture.needsUpdate = true;
}

// --- прожекторы и деревья ---
const poleM = M(0x2a3042), lampHalos = [];
[[-30, -hz - 9], [30, -hz - 9], [-30, hz + 9], [30, hz + 9]].forEach(([x, z]) => {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 16, 8), poleM); pole.position.set(x, 8, z); scene.add(pole);
  const lamp = box(4.2, 2.2, 0.4, lampM); lamp.position.set(x, 16.4, z); lamp.lookAt(0, 8, 0); scene.add(lamp);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xfff2d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(11, 11, 1); halo.position.set(x, 16.4, z); halo.visible = false; scene.add(halo); lampHalos.push(halo);
});
for (let i = 0; i < 16; i++) {
  const x = -46 + i * 6 + Math.random() * 3, z = -hz - 24 - Math.random() * 12;
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), M(0x3b2c1c)); tr.position.set(x, 1, z); scene.add(tr);
  const cr = new THREE.Mesh(new THREE.ConeGeometry(2 + Math.random(), 5 + Math.random() * 2, 8), M(0x153a22)); cr.position.set(x, 4.2, z); scene.add(cr);
}

// ================== Коровы-зрители ==================
const CW = 0xf7f2e8, CB = 0x232323, CP = 0xf2a7b5, CC = 0xf3e6c4;
const specMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const SPEC_FUR = [[0xf7f2e8, 0x232323], [0xf7f2e8, 0x6b3f1f], [0xe9dcc2, 0x8b5a34], [0x3a2a22, 0xe9dcc2], [0x2b2b2e, 0xf7f2e8], [0xc99a62, 0xf7f2e8], [0xffffff, 0xff9fb0]];
const SPEC_JERSEY = [0xe23b3b, 0x2f6bff, 0xf2c200, 0x2aa84a, 0xff7a1a, 0x8a4bd8, 0xffffff, 0x14b8a6], specCols = [0xe23b3b, 0x2f6bff];
const jerseyOf = s => s.side < 2 ? specCols[s.side] : SPEC_JERSEY[s.jIdx];
const specCache = {};
function specBodyGeo(jersey, up, fi) {
  fi = fi || 0; const key = jersey + '|' + up + '|' + fi; if (specCache[key]) return specCache[key];
  const fur = SPEC_FUR[fi][0], spot = SPEC_FUR[fi][1], p = [mp(RBX(.85, .95, .6), fur, [0, .475, 0]), mp(RBX(.4, .35, .62), spot, [-.22, .62, 0]), mp(RBX(.88, .42, .64), jersey, [0, .4, 0])];
  [-1, 1].forEach(s => {
    if (!up) p.push(mp(RBX(.2, .6, .22), fur, [s * .55, .5, 0]), mp(RBX(.22, .12, .24), CB, [s * .55, .2, 0]));
    else p.push(mp(RBX(.2, .7, .22), fur, [s * .62, 1.0, 0], [0, 0, -s * .35]), mp(RBX(.22, .12, .24), CB, [s * .76, 1.4, 0], [0, 0, -s * .35]));
  });
  return (specCache[key] = mergeParts(p));
}
function specHeadGeo(fi, horn, acc, col) {
  const fur = SPEC_FUR[fi][0], spot = SPEC_FUR[fi][1], eye = (fi === 3 || fi === 4) ? 0xffffff : CB, c = SPEC_JERSEY[col % SPEC_JERSEY.length];
  const p = [mp(RBX(.62, .56, .56), fur, [0, 0, 0]), mp(RBX(.3, .26, .58), spot, [-.12, .12, 0]), mp(RBX(.42, .28, .2), CP, [0, -.12, .36]),
    mp(RBX(.05, .05, .04), CB, [-.1, -.1, .47]), mp(RBX(.05, .05, .04), CB, [.1, -.1, .47]), mp(RBX(.1, .1, .06), eye, [-.17, .1, .29]), mp(RBX(.1, .1, .06), eye, [.17, .1, .29])];
  [-1, 1].forEach(s => {
    if (horn !== 'none') p.push(mp(CN(.07, horn === 'big' ? .5 : .32, 5), CC, [s * .22, horn === 'big' ? .5 : .42, 0], [0, 0, -s * .35]));
    p.push(mp(RBX(.3, .1, .12), s > 0 ? spot : fur, [s * .42, .15, 0], [0, 0, s * .2]));
  });
  if (acc === 'cap') p.push(mp(RBX(.66, .14, .6), c, [0, .34, 0]), mp(RBX(.3, .04, .22), c, [0, .3, .4]));
  else if (acc === 'beanie') p.push(mp(RBX(.64, .22, .6), c, [0, .36, 0]), mp(SP(.09, 6, 5), 0xffffff, [0, .52, 0]));
  else if (acc === 'glasses') p.push(mp(RBX(.5, .1, .06), 0x111111, [0, .12, .31]), mp(RBX(.1, .1, .07), 0x4aa8ff, [-.14, .12, .32]), mp(RBX(.1, .1, .07), 0x4aa8ff, [.14, .12, .32]));
  else if (acc === 'sombrero') p.push(mp(CY(.42, .42, .04, 10), 0xe6c870, [0, .32, 0]), mp(CY(.18, .22, .2, 8), 0xe6c870, [0, .44, 0]), mp(CY(.23, .23, .05, 8), c, [0, .37, 0]));
  else if (acc === 'bow') p.push(mp(CN(.1, .18, 4), 0xff4d8d, [-.05, .32, .26], [0, 0, 1.57]), mp(CN(.1, .18, 4), 0xff4d8d, [-.05, .32, .08], [0, 0, -1.57]), mp(SP(.06, 6, 5), 0xff2d6d, [-.05, .32, .17]));
  else if (acc === 'headband') p.push(mp(RBX(.64, .08, .6), c, [0, .3, 0]));
  else if (acc === 'crown') { p.push(mp(RBX(.46, .08, .46), 0xf2c200, [0, .32, 0])); [-.15, 0, .15].forEach(x => p.push(mp(CN(.06, .2, 4), 0xf2c200, [x, .45, 0]))); }
  return mergeParts(p);
}
const SPEC_ACC = ['none', 'none', 'cap', 'cap', 'beanie', 'glasses', 'sombrero', 'bow', 'headband', 'crown'], SPEC_HORN = ['cream', 'cream', 'none', 'big'];
const specHeads = Array.from({ length: 36 }, (_, i) => { const fi = i % SPEC_FUR.length; return { fi, geo: specHeadGeo(fi, SPEC_HORN[(Math.random() * 4) | 0], SPEC_ACC[(Math.random() * SPEC_ACC.length) | 0], (Math.random() * 8) | 0) }; });
const spectators = []; let standRoot = null, specSets = null, specTick = 0;
const standM = M(0x2c3a66), roofM = M(0x2b3345), ledM = new THREE.MeshBasicMaterial({ color: 0xfff2c8 }), seatMats = [];
try { new THREE.TextureLoader().load('stadium-concrete.png', tx => { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(2, 2); tx.encoding = THREE.sRGBEncoding; tx.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); standM.map = tx; standM.needsUpdate = true; }, undefined, () => {}); } catch (_) {}
const seatTexBase = (() => {   // сиденья: цветные секции вместо голого серого бетона
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d'), pal = ['#d8333a', '#2a67d8', '#f2c200', '#f4f4f4', '#2aa84a', '#ff7a1a'];
  g.fillStyle = '#222a3a'; g.fillRect(0, 0, 256, 32);
  for (let sec = 0; sec < 4; sec++) { g.fillStyle = pal[(Math.random() * pal.length) | 0]; for (let x = 0; x < 64; x += 8) for (let y = 2; y < 32; y += 10) g.fillRect(sec * 64 + x + 1, y, 6, 7); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding;
  try { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; seatMats.forEach(sm => { if (sm.map) { sm.map.image = im; sm.map.needsUpdate = true; } }); }; im.src = 'stadium-seats.png'; } catch (_) {}
  return t;
})();
function buildStand(root, cx, cz, rotY, len, steps, fill, roof) {
  const gp = new THREE.Group(); gp.position.set(cx, 0, cz); gp.rotation.y = rotY; root.add(gp); gp.updateMatrixWorld(true);
  const own = root.userData.own || (root.userData.own = []);
  const tex = seatTexBase.clone(); tex.needsUpdate = true; tex.repeat.set(len / 8, 1);
  const seatMat = new THREE.MeshLambertMaterial({ map: tex }), pg = new THREE.PlaneGeometry(len, 1.25); seatMats.push(seatMat); own.push(seatMat, tex, pg);
  for (let i = 0; i < steps; i++) {
    const h = 0.7 * (i + 1), z = -i * 1.25;
    const st = new THREE.Mesh(RBX(len, h, 1.25, 0.16), standM); st.position.set(0, h / 2, z); gp.add(st); own.push(st.geometry);
    const seat = new THREE.Mesh(pg, seatMat); seat.rotation.x = -Math.PI / 2; seat.position.set(0, h + 0.015, z); gp.add(seat);
    if (fill <= 0) continue;
    for (let x = -len / 2 + 0.8; x < len / 2 - 0.4; x += 1.3) {
      if (Math.random() > fill) continue;
      const hv = specHeads[(Math.random() * specHeads.length) | 0], r = Math.random(), side = r < 0.4 ? 0 : r < 0.8 ? 1 : 2;
      const g = new THREE.Group(); g.position.set(x + (Math.random() - 0.5) * 0.2, h, z + 0.05); g.scale.setScalar(0.9 + Math.random() * 0.22); g.rotation.y = (Math.random() - 0.5) * 0.25; gp.add(g);
      const s = { g, side, fan: side < 2 ? side : (Math.random() < 0.5 ? 0 : 1), jIdx: (Math.random() * SPEC_JERSEY.length) | 0, fi: hv.fi };
      s.geoD = specBodyGeo(jerseyOf(s), false, s.fi); s.geoU = specBodyGeo(jerseyOf(s), true, s.fi);
      s.body = new THREE.Mesh(s.geoD, specMat); g.add(s.body);
      s.head = new THREE.Mesh(hv.geo, specMat); s.head.position.y = 1.24; g.add(s.head);
      const wp = new THREE.Vector3(x, h, z).applyMatrix4(gp.matrixWorld);
      Object.assign(s, { base: h, rot: rotY, px: wp.x, pz: wp.z, ph: Math.random() * 6.28 }); spectators.push(s);
    }
  }
  const back = box(len, 0.7 * steps + 2.5, 0.3, standM); back.position.set(0, (0.7 * steps + 2.5) / 2, -steps * 1.25 - 0.2); gp.add(back); own.push(back.geometry);
  if (roof) {   // навес над главной трибуной: плита, светящийся край и колонны
    const top = 0.7 * steps + 4.4, rf = new THREE.Mesh(RBX(len, 0.22, 7, 0.07), roofM); rf.position.set(0, top, -2.9); rf.rotation.x = 0.1; gp.add(rf); own.push(rf.geometry);
    const led = box(len, 0.1, 0.1, ledM); led.position.set(0, top - 0.32, 0.55); gp.add(led); own.push(led.geometry);
    for (let x = -len / 2 + 3; x < len / 2; x += 14) { const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, top + 0.3, 8), roofM); cl.position.set(x, (top + 0.3) / 2, -steps * 1.25 - 0.1); gp.add(cl); own.push(cl.geometry); }
    // v28: ферма под навесом — два пояса и диагонали одним InstancedMesh (1 draw call на трибуну)
    const chG = box(len, 0.1, 0.1, roofM); [top - 0.15, top - 0.85].forEach(y => { const ch = new THREE.Mesh(chG.geometry, roofM); ch.position.set(0, y, -2.9); gp.add(ch); });
    own.push(chG.geometry);
    const span = 3.5, nD = Math.max(1, Math.floor(len / span)), dG = new THREE.BoxGeometry(0.08, Math.hypot(span, 0.7), 0.08), tr = new THREE.InstancedMesh(dG, roofM, nD), to = new THREE.Object3D(), ang = Math.atan2(span, 0.7);
    for (let i = 0; i < nD; i++) { to.position.set(-len / 2 + span * (i + 0.5), top - 0.5, -2.9); to.rotation.set(0, 0, (i % 2 ? 1 : -1) * ang); to.updateMatrix(); tr.setMatrixAt(i, to.matrix); }
    tr.instanceMatrix.needsUpdate = true; tr.frustumCulled = false; gp.add(tr); own.push(dG);
  }
}
function applyStadiumStyle() {
  const mode = settings.stadium || 'classic';
  // Lightweight stadium presets: different architecture palettes without extra geometry cost.
  const palettes = {
    classic: { stand: 0x2c3a66, fog: 170, ad: 0xffffff, seat: 0xffffff },
    arena:   { stand: 0x34476e, fog: 205, ad: 0xc6d6ff, seat: 0xd6e4ff },
    dome:    { stand: 0x4a5170, fog: 145, ad: 0xe6eaff, seat: 0xe8ecff },
    coastal: { stand: 0x1d6a82, fog: 190, ad: 0x8cf0e4, seat: 0xb8f6ee },
    neon:    { stand: 0x3b2a78, fog: 180, ad: 0xc7ff3d, seat: 0xe0c8ff },
    royal:   { stand: 0x4a2d62, fog: 175, ad: 0xffd66b, seat: 0xffe0a0 },
    desert:  { stand: 0x8a5a3c, fog: 165, ad: 0xffd19b, seat: 0xffd6a8 },
    winter:  { stand: 0x5a7690, fog: 185, ad: 0xe8f6ff, seat: 0xe8f6ff }
  };
  const pal = palettes[mode] || palettes.classic;
  standM.color.setHex(pal.stand); roofM.color.setHex(pal.stand).multiplyScalar(1.3); seatMats.forEach(m => m.color.setHex(pal.seat));
  if (scene.fog) scene.fog.far = pal.fog;
  if (typeof adMat !== 'undefined' && adMat) { adMat.color.setHex(pal.ad); if (typeof adMat2 !== 'undefined') adMat2.color.setHex(pal.ad); }
}
let crowdBodies = null, crowdHeads = null, crowdEarsV24=null, crowdHornsV24=null, crowdScarvesV24=null, crowdInstData = [], crowdWaveTick = 0, crowdWaveTime = 0;
const crowdInstObj = new THREE.Object3D();
function buildCrowdInstances(root, E, outer, fill) {
  crowdInstData = []; crowdBodies = crowdHeads = crowdEarsV24 = crowdHornsV24 = crowdScarvesV24 = null;
  if (fill <= 0) return;
  const level = gfxLevel(), detail = settings.stadiumDetail || 'auto', budget = settings.powerSave || level === 'low' || detail === 'low' ? 380 : detail === 'medium' || level === 'med' ? 1450 : detail === 'high' ? 4200 : (level === 'ultra' ? 5200 : level === 'high' ? 3200 : 800);
  const sides = [
    {cx:0,cz:-hz-3,rot:0,len:outer*2,steps:10},
    {cx:0,cz:hz+3,rot:Math.PI,len:outer*2,steps:8},
    {cx:E,cz:0,rot:-Math.PI/2,len:fieldD+6,steps:8},
    {cx:-E,cz:0,rot:Math.PI/2,len:fieldD+6,steps:8}
  ];
  const candidates=[];
  sides.forEach((sd,si)=>{
    const cols=Math.max(12,Math.floor(sd.len/(level==='low'?.92:.58)));
    for(let row=0;row<sd.steps;row++) for(let col=0;col<cols;col++) {
      if (Math.random()>Math.min(.99,fill+0.18)) continue;
      const lx=-sd.len/2+(col+.5)*sd.len/cols+(Math.random()-.5)*.14, lz=-row*1.25-.07;
      const wx0=sd.cx+Math.cos(sd.rot)*lx+Math.sin(sd.rot)*lz, wz0=sd.cz-Math.sin(sd.rot)*lx+Math.cos(sd.rot)*lz;
      candidates.push({x:wx0,z:wz0,y:.7*(row+1),scale:.78+Math.random()*.34,ph:Math.random()*6.28,side:si,sector:Math.floor(col/Math.max(1,cols/4))});
    }
  });
  // Shuffle once at build time; no new objects are created in the render loop.
  for(let i=candidates.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  crowdInstData=candidates.slice(0,Math.min(budget,candidates.length));
  if(!crowdInstData.length) return;
  // Instanced cow silhouettes: broader oval torso, larger head, ears, horns and team scarf.
  const bodyGeo=new THREE.SphereGeometry(.32,9,7), headGeo=new THREE.SphereGeometry(.205,8,6), hornGeo=new THREE.ConeGeometry(.055,.19,6), scarfGeo=RBX(.34,.085,.055,.018), earGeoV24=new THREE.SphereGeometry(.09,7,5);
  bodyGeo.scale(1.35,.86,.9); headGeo.scale(1.08,.96,.92); earGeoV24.scale(1.35,.52,.48);
  const mat=new THREE.MeshLambertMaterial({color:0xffffff}), headMat=new THREE.MeshLambertMaterial({color:0xffffff}), hornMat=new THREE.MeshLambertMaterial({color:0xf4ead8}), scarfMat=new THREE.MeshLambertMaterial({color:0xffffff});
  crowdBodies=new THREE.InstancedMesh(bodyGeo,mat,crowdInstData.length); crowdHeads=new THREE.InstancedMesh(headGeo,headMat,crowdInstData.length);
  const crowdHorns=new THREE.InstancedMesh(hornGeo,hornMat,crowdInstData.length*2), crowdScarves=new THREE.InstancedMesh(scarfGeo,scarfMat,crowdInstData.length), crowdEars=new THREE.InstancedMesh(earGeoV24,headMat,crowdInstData.length*2); crowdHornsV24=crowdHorns; crowdScarvesV24=crowdScarves; crowdEarsV24=crowdEars;
  crowdBodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage); crowdHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const obj=new THREE.Object3D(), color=new THREE.Color(), jersey=[0xe23b3b,0x2f6bff,0xf2c200,0x2aa84a,0xff7a1a,0x8a4bd8,0xffffff,0x14b8a6,0x18212d];
  crowdInstData.forEach((d,i)=>{
    let ci; if(d.side===0) ci=specCols[0]; else if(d.side===1) ci=specCols[1]; else ci=jersey[(Math.random()*jersey.length)|0];
    color.setHex(ci); if(Math.random()<.18) color.offsetHSL((Math.random()-.5)*.08,(Math.random()-.5)*.12,(Math.random()-.5)*.12); d.color=color.getHex();
    obj.position.set(d.x,d.y+.34*d.scale,d.z); obj.rotation.set(0,(Math.random()-.5)*.18,0); obj.scale.set(d.scale,d.scale,d.scale); obj.updateMatrix(); crowdBodies.setMatrixAt(i,obj.matrix); crowdBodies.setColorAt(i,color);
    color.setHex(Math.random()<.62?0xf2e6d2:0x8c5a3c); d.headColor=color.getHex(); obj.position.set(d.x,d.y+.67*d.scale,d.z+.015); obj.rotation.set(0,(Math.random()-.5)*.12,0); obj.updateMatrix(); crowdHeads.setMatrixAt(i,obj.matrix); crowdHeads.setColorAt(i,color);
    for(let h=0;h<2;h++){
      const side=h?1:-1;
      obj.position.set(d.x+side*.12*d.scale,d.y+.88*d.scale,d.z); obj.rotation.set(0,0,side*.18); obj.scale.set(d.scale,d.scale,d.scale); obj.updateMatrix(); crowdHorns.setMatrixAt(i*2+h,obj.matrix);
      color.setHex(d.headColor); obj.position.set(d.x+side*.18*d.scale,d.y+.69*d.scale,d.z+.015); obj.rotation.set(0,0,side*.2); obj.updateMatrix(); crowdEars.setMatrixAt(i*2+h,obj.matrix); crowdEars.setColorAt(i*2+h,color);
    }
    color.setHex(ci); obj.position.set(d.x,d.y+.43*d.scale,d.z+.255*d.scale);obj.rotation.set(0,0,0);obj.scale.set(d.scale,d.scale,d.scale);obj.updateMatrix();crowdScarves.setMatrixAt(i,obj.matrix);crowdScarves.setColorAt(i,color);
  });
  [crowdBodies,crowdHeads,crowdHorns,crowdScarves,crowdEars].forEach(m=>{m.instanceMatrix.needsUpdate=true;m.castShadow=false;m.receiveShadow=false;root.add(m);});
  root.userData.own.push(bodyGeo,headGeo,hornGeo,scarfGeo,earGeoV24,mat,headMat,hornMat,scarfMat);
}
function updateInstancedCrowd(dt) {
  if(!crowdBodies||!crowdHeads||!crowdEarsV24||!crowdHornsV24||!crowdScarvesV24||!settings.crowdAnimate||settings.powerSave||(gfxLevel()!=='high'&&gfxLevel()!=='ultra')) return;
  crowdWaveTime+=dt; if(++crowdWaveTick%8!==0) return;
  const obj=crowdInstObj;
  crowdInstData.forEach((d,i)=>{
    const wave=(state==='goal'?0.16:0.055)*Math.max(0,Math.sin(crowdWaveTime*.11-d.x*.34+d.z*.2+d.ph));
    const sway=Math.sin(crowdWaveTime*.06+d.ph)*.055, nod=Math.sin(crowdWaveTime*.07+d.ph)*.08;
    obj.position.set(d.x,d.y+.34*d.scale+wave,d.z); obj.rotation.set(0,sway,0); obj.scale.set(d.scale,d.scale,d.scale); obj.updateMatrix(); crowdBodies.setMatrixAt(i,obj.matrix);
    obj.position.set(d.x,d.y+.67*d.scale+wave,d.z+.015); obj.rotation.set(0,sway,nod); obj.updateMatrix(); crowdHeads.setMatrixAt(i,obj.matrix);
    for(let h=0;h<2;h++){
      const side=h?1:-1;
      obj.position.set(d.x+side*.12*d.scale,d.y+.88*d.scale+wave,d.z);obj.rotation.set(0,sway,side*.18+nod);obj.scale.set(d.scale,d.scale,d.scale);obj.updateMatrix();crowdHornsV24.setMatrixAt(i*2+h,obj.matrix);
      obj.position.set(d.x+side*.18*d.scale,d.y+.69*d.scale+wave,d.z+.015);obj.rotation.set(0,sway,side*.2+nod);obj.updateMatrix();crowdEarsV24.setMatrixAt(i*2+h,obj.matrix);
    }
    obj.position.set(d.x,d.y+.43*d.scale+wave*.5,d.z+.255*d.scale);obj.rotation.set(0,sway,0);obj.scale.set(d.scale,d.scale,d.scale);obj.updateMatrix();crowdScarvesV24.setMatrixAt(i,obj.matrix);
  });
  [crowdBodies,crowdHeads,crowdEarsV24,crowdHornsV24,crowdScarvesV24].forEach(m=>{m.instanceMatrix.needsUpdate=true;});
}
function buildStands() {
  if (standRoot) { (standRoot.userData.own || []).forEach(o => o.dispose && o.dispose()); scene.remove(standRoot); }
  spectators.length = 0; seatMats.length = 0; standRoot = new THREE.Group(); scene.add(standRoot); standRoot.userData.own=[];
  const f = [0, 0.3, 0.62, 0.85][effCrowd()], E = hx + gDepth + 3.6, outer = E + 4.4;
  const liveFill = settings.powerSave ? f*.035 : f*.12;
  // More rows and higher stands create a closed, multi-tier bowl; distant fans are instanced.
  buildStand(standRoot, 0, -hz - 3, 0, outer * 2, 10, liveFill, true);
  buildStand(standRoot, 0, hz + 3, Math.PI, outer * 2, 8, liveFill*.7, false);
  buildStand(standRoot, E, 0, -Math.PI / 2, fieldD + 6, 8, liveFill*.9, false);
  buildStand(standRoot, -E, 0, Math.PI / 2, fieldD + 6, 8, liveFill*.9, false);
  buildCrowdInstances(standRoot,E,outer,f);
  applyStadiumStyle();
}
function refreshSpectatorTeams(tA, tB) {
  specCols[0] = tA.c1; specCols[1] = tB.c1;
  spectators.forEach(s => { s.geoD = specBodyGeo(jerseyOf(s), false, s.fi); s.geoU = specBodyGeo(jerseyOf(s), true, s.fi); s.body.geometry = s.geoD; });
  if (crowdBodies && crowdHeads) {
    const col = new THREE.Color();
    crowdInstData.forEach((d,i) => { const c = d.side===0 ? tA.c1 : d.side===1 ? tB.c1 : d.color; col.setHex(c); crowdBodies.setColorAt(i,col); });
    if (crowdBodies.instanceColor) crowdBodies.instanceColor.needsUpdate = true;
  }
  goalMats[0].color.setHex(tA.c1); goalMats[1].color.setHex(tB.c1);
}

// ================== Коровы-игроки (у каждой команды своя «фишка») ==================
const matCow = new THREE.MeshLambertMaterial({ vertexColors: true });
try { new THREE.TextureLoader().load('kit-weave.png', tx => { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.encoding = THREE.sRGBEncoding; tx.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); matCow.map = tx; matCow.needsUpdate = true; }, undefined, () => {}); } catch (_) {}
const matGlass = new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.28 });
const cowCache = {};
// v24: rounded-edge box used by cow models and spectators. Faces stay stylized, but corners/normals are softened.
var _roundBoxCacheV24 = _roundBoxCacheV24 || Object.create(null);   // var: функция RBX вызывается раньше этой строки (зрители), const давал ошибку запуска
function RBX(w,h,d,r) {
  if (!_roundBoxCacheV24) _roundBoxCacheV24 = Object.create(null);
  r = Math.min(Number.isFinite(r) ? r : Math.min(w,h,d)*0.16, w*0.22, h*0.22, d*0.22);
  const key = [w,h,d,r].map(v=>Number(v).toFixed(4)).join('|');
  if (_roundBoxCacheV24[key]) return _roundBoxCacheV24[key];
  const g = new THREE.BoxGeometry(w,h,d,4,4,4), p = g.attributes.position;
  const half=[w/2,h/2,d/2], pos=p.array, normals=new Float32Array(pos.length);
  for(let i=0;i<pos.length;i+=3){
    const orig=[pos[i],pos[i+1],pos[i+2]], inner=orig.map((v,a)=>clamp(v,-half[a]+r,half[a]-r));
    let dx=orig[0]-inner[0],dy=orig[1]-inner[1],dz=orig[2]-inner[2],len=Math.hypot(dx,dy,dz);
    if(len>1e-6){pos[i]=inner[0]+dx*r/len;pos[i+1]=inner[1]+dy*r/len;pos[i+2]=inner[2]+dz*r/len;normals[i]=dx/len;normals[i+1]=dy/len;normals[i+2]=dz/len;}
    else {const ax=Math.abs(orig[0])/half[0],ay=Math.abs(orig[1])/half[1],az=Math.abs(orig[2])/half[2];if(ax>=ay&&ax>=az){normals[i]=Math.sign(orig[0]);}else if(ay>=az){normals[i+1]=Math.sign(orig[1]);}else{normals[i+2]=Math.sign(orig[2]);}}
  }
  p.needsUpdate=true;g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.computeBoundingSphere();
  return (_roundBoxCacheV24[key]=g);
}
function cowGeos(team, kit, hat, gk) {
  const key = team.id + '|' + kit + '|' + hat + '|' + (gk ? 1 : 0); if (cowCache[key]) return cowCache[key];
  const fur = team.fur !== undefined ? team.fur : CW, dark = team.dark !== undefined ? team.dark : CB, f = team.feat;
  const body = [
    mp(RBX(1.9, .95, 1.0, .09), fur, [0, 1.05, 0]), mp(RBX(.72, 1.0, 1.04, .08), kit, [.05, 1.05, 0]), mp(RBX(.74, .1, 1.07), team.c2, [.05, 1.25, 0]), mp(RBX(.72, .03, .9), kit, [.05, 1.55, 0]),
    mp(RBX(.46, .5, .56), fur, [.98, 1.3, 0]), mp(RBX(.5, .42, 1.04, .07), dark, [-.68, 1.2, 0]), mp(RBX(.36, .32, 1.04, .06), dark, [.72, .95, 0]), mp(RBX(.4, .03, .55), dark, [-.55, 1.54, .1]),
    mp(RBX(.42, .62, .48), fur, [.88, 1.22, 0]), mp(RBX(.55, .3, .5, .07), CP, [-.55, .56, 0]), mp(RBX(.22, .7, 1.04), team.c2, [.9, 1.1, 0]),
    mp(RBX(.25, .18, .48), CP, [1.20, 1.17, 0]), mp(RBX(.035, .055, .07), dark, [1.34, 1.17, -.13]), mp(RBX(.035, .055, .07), dark, [1.34, 1.17, .13]),
    mp(RBX(.31, .035, .34), dark, [-.66, .58, .18]), mp(RBX(.31, .035, .34), dark, [-.66, .58, -.18])
  ].concat(gk ? [] : kitPattern(team));
  if (f === 'bell') body.push(mp(SP(.13, 8, 6), 0xf2c200, [1.0, .72, 0]));
  if (f === 'phone') {   // Жук-Телефон: корова с телефоном на спине
    body.push(mp(RBX(.74, .05, .46), 0x0b0f1a, [.05, 1.6, 0]), mp(RBX(.66, .06, .38), team.c2, [.05, 1.62, 0]),
      mp(RBX(.14, .07, .14), 0xff4d6d, [-.12, 1.64, .1]), mp(RBX(.14, .07, .14), 0xb8ff3d, [.1, 1.64, .1]),
      mp(RBX(.14, .07, .14), 0xffd23f, [-.12, 1.64, -.1]), mp(RBX(.14, .07, .14), 0xffffff, [.1, 1.64, -.1]));
  }
  if (f === 'ladybug') { // Божьи Коровки: чёрные точки на красной майке
    [[-.05, .3], [.2, -.2], [-.2, -.25], [.3, .25]].forEach(d => body.push(mp(RBX(.15, .04, .15), 0x111111, [d[0], 1.57, d[1]])));
    [[-.1, .53], [.2, -.53], [-.2, -.53], [.15, .53]].forEach(d => body.push(mp(RBX(.15, .15, .04), 0x111111, [d[0], 1.1, d[1]])));
  }
  if (f === 'scarab') {  // Золотые Скарабеи: знак скарабея на спине
    body.push(mp(RBX(.3, .05, .3), team.c2, [.05, 1.57, 0], [0, .785, 0]), mp(RBX(.1, .05, .5), team.c2, [.05, 1.57, 0]), mp(RBX(.5, .05, .1), team.c2, [.05, 1.57, 0]));
  }
  const head = [mp(RBX(.03, .025, .4), 0x7a4a55, [.54, -.2, 0]), mp(RBX(.62, .58, .58, .08), fur, [0, 0, 0]), mp(RBX(.3, .3, .6, .06), dark, [-.05, .1, 0]), mp(RBX(.52, .32, .46, .07), CP, [.4, -.1, 0])];
  const big = f === 'horns';
  [-1, 1].forEach(s => {
    head.push(mp(RBX(.03, .06, .06), dark, [.54, -.05, s * .12]), mp(RBX(.14, .12, .05, .02), 0xffffff, [.24, .12, s * .295]), mp(RBX(.07, .08, .04, .015), 0x14151a, [.27, .12, s * .318]), mp(RBX(.025, .025, .03, .008), 0xffffff, [.285, .14, s * .336]),
      mp(RBX(.1, .1, .34), s > 0 ? dark : fur, [-.08, .14, s * .43], [s * .3, 0, 0]), mp(RBX(.06, .1, .05), 0xffd23f, [-.08, .02, s * .6]));
    if (f !== 'straw' && f !== 'helmet') head.push(mp(CY(.1, .11, .06, 7), dark, [-.02, .26, s * (big ? .27 : .2)]), mp(CN(big ? .11 : .07, big ? .66 : .34, 7), big ? 0xf5e9c8 : CC, [-.02, big ? .55 : .42, s * (big ? .27 : .2)], [-s * (big ? .75 : .5), 0, 0]));
  });
  if (f === 'shades') head.push(mp(RBX(.06, .16, .62), 0x111111, [.3, .12, 0]), mp(RBX(.05, .14, .24), 0x4aa8ff, [.31, .12, .16]), mp(RBX(.05, .14, .24), 0x4aa8ff, [.31, .12, -.16]));
  if (f === 'ring') head.push(mp(TR(.09, .02, 6, 12), 0xf2c200, [.55, -.2, 0], [0, 1.57, 0]));
  if (f === 'rhino') head.push(mp(CN(.12, .5, 7), 0xefe3c8, [.5, .3, 0], [0, 0, -.9]));
  if (f === 'crown') { head.push(mp(RBX(.5, .09, .5), 0xf2c200, [0, .35, 0])); [-.18, 0, .18].forEach(x => head.push(mp(CN(.07, .24, 4), 0xf2c200, [x, .5, 0]))); }
  if (f === 'straw') head.push(mp(CY(.4, .4, .04, 12), 0xe6c870, [0, .34, 0]), mp(CY(.2, .24, .22, 10), 0xe6c870, [0, .46, 0]), mp(CY(.25, .25, .05, 10), team.c1, [0, .38, 0]));
  if (f === 'grass') [[0, .4, 0], [.12, .38, .08], [-.1, .38, -.08], [.05, .37, -.14]].forEach(g => head.push(mp(CN(.05, .32, 4), 0x4cc23a, g, [g[2], 0, -g[0]])));
  if (f === 'bow') head.push(mp(CN(.12, .22, 4), 0xff4d8d, [-.05, .36, .3], [0, 0, 1.57]), mp(CN(.12, .22, 4), 0xff4d8d, [-.05, .36, .1], [0, 0, -1.57]), mp(SP(.07, 6, 5), 0xff2d6d, [-.05, .36, .2]));
  if (f === 'phone') head.push(mp(RBX(.12, .1, .06), 0x111111, [-.08, .14, .46]), mp(RBX(.04, .04, .22), 0x111111, [.0, .05, .5], [0, .5, 0]));
  if (f === 'ladybug') [-1, 1].forEach(s => head.push(mp(RBX(.04, .4, .04), 0x111111, [.05, .45, s * .12], [-s * .35, 0, .2]), mp(SP(.06, 6, 5), 0x111111, [.12, .64, s * .2])));
  if (hat === 1) head.push(mp(RBX(.66, .14, .62), team.c1, [0, .36, 0]), mp(RBX(.3, .04, .5), team.c1, [.42, .3, 0]));
  if (hat === 2) { head.push(mp(CN(.3, .3, 5), 0xf2c200, [0, .5, 0])); [0, 1, 2, 3, 4].forEach(i => head.push(mp(SP(.05, 5, 4), 0xff4d6d, [Math.cos(i * 1.256) * .27, .38, Math.sin(i * 1.256) * .27]))); }
  if (hat === 3) head.push(mp(CY(.2, .2, .38, 10), 0x111111, [0, .55, 0]), mp(CY(.34, .34, .04, 12), 0x111111, [0, .37, 0]), mp(CY(.205, .205, .06, 10), 0xff4d6d, [0, .42, 0]));
  if (hat === 4) head.push(mp(CN(.2, .55, 8), 0xff7ac8, [0, .62, 0]), mp(SP(.06, 6, 5), 0xffd23f, [0, .92, 0]));
  const hoof = gk ? kit : (f === 'bow' ? 0xff7ac8 : dark === 0x14151a ? 0x111111 : CB);
  const kc = new THREE.Color(kit), shorts = (kc.r * 0.3 + kc.g * 0.59 + kc.b * 0.11) > 0.55 ? 0x20252f : 0xf4f6fa;
  const leg = mergeParts([mp(RBX(.27, .3, .27), fur, [0, -.15, 0]), mp(RBX(.29, .18, .29), shorts, [0, -.09, 0]), mp(RBX(.2, .28, .2), fur, [0, -.44, 0]),
    mp(RBX(.225, .2, .225), kit, [0, -.46, 0]), mp(RBX(.23, .04, .23), team.c2, [0, -.37, 0]), mp(RBX(.28, .1, .27, .03), hoof, [.01, -.6, 0])]);
  const tail = mergeParts([mp(CY(.04, .04, .8, 6), fur, [0, 0, 0]), mp(RBX(.17, .22, .17, .04), dark, [-.12, -.42, 0])]);
  return (cowCache[key] = { body: mergeParts(body), head: mergeParts(head), leg, tail });
}
function colorDist(a, b) { const A = new THREE.Color(a), B = new THREE.Color(b); return Math.hypot(A.r - B.r, A.g - B.g, A.b - B.b) * 255; }
// Если цвета формы похожи, второй команде выдаётся запасной комплект (гостевая форма) — команды всегда различимы.
function kitFor(team, other) {
  if (colorDist(team.c1, other.c1) >= 110) return team;
  let best = null, bd = 110;
  [team.c2, 0xffffff, 0x1a1a1f, 0xffd23f, 0x2f6bff].forEach(c => { const d = colorDist(c, other.c1); if (d > bd) { bd = d; best = c; } });
  return best === null ? team : Object.assign({}, team, { id: team.id + '~k', c1: best, c2: team.c1 });
}
function makeShadow(sx, sz) {
  const s = new THREE.Mesh(shadowGeo, shadowMat); s.userData.fieldDynamic = true; s.rotation.x = -Math.PI / 2; s.position.y = 0.03; s.scale.set(sx, sz, 1); scene.add(s); return s;
}
const shadowGeo = new THREE.CircleGeometry(1, 32), shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }); // fake oval shadows disabled; use real shadow maps
function kitPattern(team) {   // рисунок на майке поверх основного цвета (чуть шире корпуса, чтобы не мерцало)
  const c = team.c2, o = [.05, 1.05, 0], p = team.pat | 0;
  if (p === 1) return [mp(RBX(.75, .1, 1.08), c, [.05, .82, 0]), mp(RBX(.75, .1, 1.08), c, [.05, 1.05, 0])];
  if (p === 2) return [-.36, -.12, .12, .36].map(z => mp(RBX(.75, .99, .1), c, [.05, 1.05, z]));
  if (p === 3) return [mp(RBX(.75, .99, .5), c, [.05, 1.05, .27])];
  if (p === 4) return [mp(RBX(.75, .16, 1.0), c, o, [.55, 0, 0])];
  return [];
}
function makeCow(team, role, hatIdx) {
  const gk = role === 'gk', kit = gk ? team.gk : team.c1, G = cowGeos(team, kit, hatIdx || 0, gk);
  const g = new THREE.Group(), fl = new THREE.Group(), body = new THREE.Group();
  fl.position.y = 1; body.position.y = -1; g.add(fl); fl.add(body);
  body.add(new THREE.Mesh(G.body, matCow));
  const head = new THREE.Group(); head.position.set(1.12, 1.42, 0); head.add(new THREE.Mesh(G.head, matCow)); body.add(head);
  if (team.feat === 'helmet') {
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), matGlass); head.add(gl);
    const col = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 6, 12), new THREE.MeshLambertMaterial({ color: 0xcfd6e2 })); col.rotation.y = Math.PI / 2; col.position.set(-0.2, -0.3, 0); head.add(col);
  }
  const legs = [];
  [[0.65, 0.33], [0.65, -0.33], [-0.65, 0.33], [-0.65, -0.33]].forEach(([lx, lz]) => {
    const pv = new THREE.Group(); pv.position.set(lx, 0.62, lz); pv.add(new THREE.Mesh(G.leg, matCow)); body.add(pv); legs.push(pv);
  });
  // Goalkeepers get visible blocky arms and gloves, without changing the original cow style.
  const arms = [];
  [-1, 1].forEach(side => {
    const arm = new THREE.Group(); arm.visible = gk; arm.position.set(0.15, 1.28, side * 0.48);
    const sleeve = new THREE.Mesh(RBX(0.32, 0.48, 0.24), new THREE.MeshLambertMaterial({ color: kit }));
    sleeve.position.set(0.04, -0.08, side * 0.06); sleeve.rotation.x = side * -0.22; arm.add(sleeve);
    const glove = new THREE.Mesh(RBX(0.28, 0.22, 0.3), new THREE.MeshLambertMaterial({ color: 0xf4f6fa }));
    glove.position.set(0.15, -0.28, side * 0.12); arm.add(glove); body.add(arm); arms.push(arm);
  });
  const tail = new THREE.Mesh(G.tail, matCow); tail.position.set(-1.05, 1.15, 0); tail.rotation.z = 0.35; body.add(tail);
  g.scale.setScalar((CR / 22) * 0.68);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(g);
  return { g, fl, body, head, legs, arms, tail, shadow: makeShadow(0.68, 0.48), phase: Math.random() * 6, kickAnim: 0 };
}
function attachCowNumber(c) {
  if (!c || !c.body || c.numberMesh) return;
  const cnv = document.createElement('canvas'); cnv.width = 256; cnv.height = 128;
  const g = cnv.getContext('2d'); g.clearRect(0, 0, 256, 128); g.textAlign = 'center'; g.textBaseline = 'middle';
  const name = String(c.pname || 'КОРОВА').split(' ').slice(-1)[0].slice(0, 12).toUpperCase();
  g.font = '800 25px Arial'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.78)'; g.fillStyle = '#fff'; g.strokeText(name, 128, 28); g.fillText(name, 128, 28);
  g.font = '900 66px Arial'; g.lineWidth = 7; g.strokeText(String(c.num || 10), 128, 83); g.fillText(String(c.num || 10), 128, 83);
  const tex = new THREE.CanvasTexture(cnv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(-0.02, 1.584, 0); mesh.renderOrder = 4; c.body.add(mesh); c.numberMesh = mesh; c.numberTexture = tex;
  if (c.isCaptain && !c.captainBand) { const band = new THREE.Mesh(RBX(0.34, 0.095, 0.27), new THREE.MeshLambertMaterial({color:0xffd23f})); band.position.set(0.37, 1.22, -0.53); band.rotation.z=-0.12; c.body.add(band); c.captainBand=band; }
}
function disposeCow(c) { scene.remove(c.g); scene.remove(c.shadow); if (c.numberTexture) c.numberTexture.dispose(); if (c.numberMesh) { c.numberMesh.geometry.dispose(); c.numberMesh.material.dispose(); } if(c.captainBand){c.captainBand.geometry.dispose();c.captainBand.material.dispose();} }

// маркеры управляемой коровы (по одному на игрока)
function makeMarker(color) {
  const r = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.35, 32), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  r.rotation.x = -Math.PI / 2; r.position.y = 0.04; r.visible = false; scene.add(r);
  const a = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 4), new THREE.MeshLambertMaterial({ color })); a.userData.fieldDynamic = true;
  a.rotation.x = Math.PI; a.visible = false; scene.add(a);
  return { r, a };
}
const markers = [makeMarker(0xb8ff3d), makeMarker(0xffffff)];
// Судья удалён: церемония проходит без отдельного персонажа.
const referee = { visible: false, position: { set() {} }, rotation: { y: 0 } };
const refLegs = [], refArms = [];

// ================== Мяч ==================
const BRW = BR * S, BVIS = 0.92, ballMesh = new THREE.Group();
const ballBaseMat = new THREE.MeshLambertMaterial({ color: 0xffffff }), ballPatchMat = new THREE.MeshBasicMaterial({ color: 0x1b1b1b, side: THREE.DoubleSide });
try { new THREE.TextureLoader().load('ball-pebble.png', tx => { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.encoding = THREE.sRGBEncoding; tx.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); ballBaseMat.map = tx; ballBaseMat.needsUpdate = true; }, undefined, () => {}); } catch (_) {}
ballMesh.userData.fieldDynamic = true; ballMesh.add(new THREE.Mesh(new THREE.SphereGeometry(BRW, 24, 18), ballBaseMat));
{
  const phi = (1 + Math.sqrt(5)) / 2, dirs = [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]];
  dirs.forEach(d => {
    const v = new THREE.Vector3(d[0], d[1], d[2]).normalize();
    const patch = new THREE.Mesh(new THREE.CircleGeometry(BRW * 0.38, 5), ballPatchMat);
    patch.position.copy(v).multiplyScalar(BRW * 1.005); patch.lookAt(v.clone().multiplyScalar(5)); ballMesh.add(patch);
  });
}
const ballGlow = new THREE.Mesh(new THREE.SphereGeometry(BRW * 1.7, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff8a1a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
ballGlow.visible = false; ballMesh.add(ballGlow); ballMesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(ballMesh);
ballMesh.scale.setScalar(BVIS);
function setBallStyle(i) { const b = BALLS[i] || BALLS[0]; ballBaseMat.color.setHex(b.base); ballPatchMat.color.setHex(b.patch); }
const ballShadow = makeShadow(0.55, 0.55);

// ================== Эффекты: сетка, след мяча, удар, трава, качество ==================
function netHit(team, by, bh, sp) {
  const n = nets.find(q => q.sd === (team === 0 ? 1 : -1)); if (!n) return;
  if (sp > 1.4) SFX.net(sPan(ball.x), sp);
  n.cz = (by - H / 2) * S / fieldVisualScale; n.cy = clamp(BRW + bh, 0.25, 2.2); n.vel = Math.min(0.3, n.vel + 0.03 + sp * 0.012); n.amp = n.amp || 0.001;
}
function updateNets(dt) {
  nets.forEach(n => {
    if (n.amp === 0 && n.vel === 0) return;
    n.vel += (-0.12 * n.amp - 0.05 * n.vel) * dt; n.amp += n.vel * dt;
    if (Math.abs(n.amp) < 0.002 && Math.abs(n.vel) < 0.002) n.amp = n.vel = 0;
    const p = n.geo.attributes.position.array, b = n.base, span = Math.abs(n.back - n.front);
    for (let i = 0; i < b.length; i += 3) {
      const depth = Math.min(1, Math.abs(b[i] - n.front) / span), dz = b[i + 2] - n.cz, dy = b[i + 1] - n.cy;
      p[i] = b[i] + n.sd * n.amp * (0.25 + 0.75 * Math.exp(-(dz * dz + dy * dy) / 1.2)) * depth;
    }
    n.geo.attributes.position.needsUpdate = true; n.mat.opacity = 0.22 + Math.min(0.3, Math.abs(n.amp) * 0.5);
  });
}
function makePool(n, blend, size) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), base = new Float32Array(n * 3), vel = new Float32Array(n * 3), life = new Float32Array(n), life0 = new Float32Array(n), geo = new THREE.BufferGeometry();
  for (let i = 0; i < n; i++) pos[i * 3 + 1] = -100;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: softTex, vertexColors: true, transparent: true, depthWrite: false, blending: blend }));
  pts.frustumCulled = false; scene.add(pts); let head = 0, active = 0;
  return {
    spawn(x, y, z, vx, vy, vz, hexC, l) {
      const i = head; head = (head + 1) % n; tmpc.setHex(hexC);
      pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); base.set([tmpc.r, tmpc.g, tmpc.b], i * 3); col.set([tmpc.r, tmpc.g, tmpc.b], i * 3); life[i] = life0[i] = l; active = 1;
    },
    update(dt, grav, fade) {
      if (!active) return; active = 0;
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) continue; life[i] -= dt;
        if (life[i] <= 0) { pos[i * 3 + 1] = -100; continue; }
        vel[i * 3 + 1] -= grav * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < 0.04) { pos[i * 3 + 1] = 0.04; vel[i * 3 + 1] *= -0.25; vel[i * 3] *= 0.6; vel[i * 3 + 2] *= 0.6; }
        const f = fade ? life[i] / life0[i] : 1; col[i * 3] = base[i * 3] * f; col[i * 3 + 1] = base[i * 3 + 1] * f; col[i * 3 + 2] = base[i * 3 + 2] * f; active = 1;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
    clear() { life.fill(0); for (let i = 0; i < n; i++) pos[i * 3 + 1] = -100; geo.attributes.position.needsUpdate = true; active = 0; }
  };
}
const sparkPool = makePool(70, THREE.AdditiveBlending, 0.2), grassPool = makePool(110, THREE.NormalBlending, 0.16);
const rings = []; for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); rings.push({ m, t: 0, k: 0 }); }
let ringI = 0;
const GRASS_COLS = [0x2f8f3c, 0x3fae4a, 0x7acb5a, 0x1f6b2b, 0x5a3d22];
function scatterGrass(c, n, sp) {
  const x = wx(c.x), z = wz(c.y), moving = Math.hypot(c.vx, c.vy) > 0.2, a0 = Math.atan2(-c.vy, -c.vx);
  for (let i = 0; i < n; i++) {
    const a = moving ? a0 + (Math.random() - 0.5) * 2.4 : Math.random() * 6.283, s = sp * (0.4 + Math.random());
    grassPool.spawn(x, 0.12, z, Math.cos(a) * s, 0.04 + Math.random() * 0.05, Math.sin(a) * s, GRASS_COLS[(Math.random() * 5) | 0], 22 + Math.random() * 14);
  }
}
function grassFx(c, spd, dt) {
  const lv = effParts(); if (!lv) return; const m = lv >= 2 ? 1 : 0.5;
  if (c.diveT > 0) { if (!c.diveFx) { c.diveFx = true; scatterGrass(c, Math.round(8 * m), 0.07); } } else c.diveFx = false;
  c.hT = (c.hT || 0) + dt; if (c.hT < 6) return; c.hT = 0;
  if (spd > 1.1) { const a = Math.atan2(c.vy, c.vx); if (c.hOK) { const da = Math.atan2(Math.sin(a - c.hAng), Math.cos(a - c.hAng)); if (Math.abs(da) > 0.9) scatterGrass(c, Math.round(6 * m), 0.06); } c.hAng = a; c.hOK = true; } else c.hOK = false;
}
function kickFx(c, power) {
  if (power > 14) addShake(0.12);
  const lv = effParts(); if (!lv) return; const k = Math.min(1, power / 16); if (k < 0.3) return; const m = lv >= 2 ? 1 : 0.5;
  const x = wx(ball.x), z = wz(ball.y), r = rings[ringI++ % 3]; r.t = 1; r.k = k; r.m.userData.fieldDynamic = true; r.m.position.set(x, 0.05, z); r.m.material.color.setHex(ball.fire > 0 ? 0xff9a2a : 0xffffff); r.m.visible = true;
  const a = Math.atan2(ball.vy, ball.vx);
  for (let i = 0, n = Math.round((4 + 10 * k) * m); i < n; i++) { const b = a + (Math.random() - 0.5) * 2.6, s = (0.04 + Math.random() * 0.1) * (0.6 + k); sparkPool.spawn(x, BRW, z, Math.cos(b) * s, 0.03 + Math.random() * 0.05, Math.sin(b) * s, 0xffe6a8, 14 + Math.random() * 10); }
  scatterGrass(c, Math.round((2 + 5 * k) * m), 0.05 + 0.04 * k);
}
const trailN = 18, trailPos = new Float32Array(trailN * 3), trailCol = new Float32Array(trailN * 3), trailHist = [], trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
const trailPts = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 0.3, map: softTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
trailPts.frustumCulled = false; trailPts.visible = false; scene.add(trailPts);
let pBX = 0, pBZ = 0, trailK = 0;
function updateTrail(dt) {
  if (!settings.ballTrail || settings.powerSave || state !== 'play' && state !== 'goal' && state !== 'replay') { trailHist.length = 0; trailPts.visible = false; return; }
  const lv = effParts(), maxN = lv >= 2 ? trailN : 9, p = ballMesh.position, d = Math.hypot(p.x - pBX, p.z - pBZ); pBX = p.x; pBZ = p.z;
  const sp = d / S / Math.max(dt, 0.25); if (d > 3) trailHist.length = 0;
  if (lv > 0 && d <= 3 && (sp > 9 || ball.fire > 0)) { trailK = Math.min(1, Math.max(0.3, (sp - 8) / 8)); trailHist.push(p.x, p.y, p.z); if (trailHist.length > maxN * 3) trailHist.splice(0, 3); }
  else { trailK *= 0.9; if (trailHist.length) trailHist.splice(0, 3); }
  const cnt = trailHist.length / 3; trailPts.visible = cnt > 1; if (!trailPts.visible) return;
  const fire = ball.fire > 0;
  for (let i = 0; i < cnt; i++) {
    const f = (i + 1) / cnt, v = f * f * 0.55 * trailK * (fire ? 1.3 : 1); trailPos[i * 3] = trailHist[i * 3]; trailPos[i * 3 + 1] = trailHist[i * 3 + 1]; trailPos[i * 3 + 2] = trailHist[i * 3 + 2];
    trailCol[i * 3] = (fire ? 1 : 0.85) * v; trailCol[i * 3 + 1] = (fire ? 0.55 : 0.92) * v; trailCol[i * 3 + 2] = (fire ? 0.15 : 1) * v;
  }
  trailGeo.setDrawRange(0, cnt); trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.color.needsUpdate = true;
}
let lightPulse = 0, shake = 0, vigOn = true;
function addShake(v) { const f = effParts(); if (f && settings.cameraShake) shake = Math.min(1, shake + v * (f >= 2 ? 1 : 0.5)); }
function goalFlash() { const fl = $('flashFx'); if (!fl || !effParts() || !settings.glow) return; fl.style.transition = 'none'; fl.style.opacity = 0.5; requestAnimationFrame(() => { fl.style.transition = 'opacity .9s'; fl.style.opacity = 0; }); }
function updateFx(dt) {
  lightPulse *= Math.pow(0.94, dt); renderer.toneMappingExposure = 0.9 * (1 + lightPulse * 0.3);
  sparkPool.update(dt, 0.002, true); grassPool.update(dt, 0.004, false);
  rings.forEach(r => { if (r.t <= 0) return; r.t -= dt / 18; if (r.t <= 0) { r.m.visible = false; return; } r.m.scale.setScalar(0.4 + (1 - r.t) * (1.2 + 1.2 * r.k)); r.m.material.opacity = r.t * 0.5 * r.k; });
}
function clearFx() {
  trailHist.length = 0; trailPts.visible = false; sparkPool.clear(); grassPool.clear(); rings.forEach(r => { r.t = 0; r.m.visible = false; });
  nets.forEach(n => { n.amp = n.vel = 0; n.geo.attributes.position.array.set(n.base); n.geo.attributes.position.needsUpdate = true; n.mat.opacity = 0.22; });
}
// Качество: карта теней, тип фильтра, тени прожекторов, ореолы и пятна травы зависят от выбранного уровня графики.
function applyGfxQuality() {
  const lv = gfxLevel(), low = lv === 'low', q = settings.shadowQ || 'auto';
  const effectiveShadow = q === 'auto' ? (low ? 'low' : lv === 'med' ? 'medium' : 'high') : q;
  const sz = effectiveShadow === 'low' ? 512 : effectiveShadow === 'medium' ? 1024 : 2048; let changed = false;
  renderer.shadowMap.enabled = effectiveShadow !== 'off'; dirL.castShadow = renderer.shadowMap.enabled;
  if (dirL.shadow.mapSize.x !== sz) { dirL.shadow.mapSize.set(sz, sz); if (dirL.shadow.map) { dirL.shadow.map.dispose(); dirL.shadow.map = null; } }
  const type = effectiveShadow === 'low' ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap; if (renderer.shadowMap.type !== type) { renderer.shadowMap.type = type; changed = true; }
  stadiumSpots.forEach((l, i) => { const want = renderer.shadowMap.enabled && i === 0 && !IS_TOUCH && effectiveShadow === 'high'; if (l.castShadow !== want) { l.castShadow = want; if (!want && l.shadow.map) { l.shadow.map.dispose(); l.shadow.map = null; } changed = true; } });
  if (changed) scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  patchPlane.visible = !low && !!settings.grassDetail; renderer.shadowMap.needsUpdate = true; applyEnv(curEnv.tod, curEnv.weather); applyVisualFilters();
}

// ================== Бонусы на поле ==================
const PICK_TYPES = ['hay', 'bell', 'milk'];
function makePickupMesh(type) {
  const g = new THREE.Group();
  if (type === 'hay') {
    g.add(box(0.9, 0.6, 0.6, M(0xe6c24a))); const s1 = box(0.92, 0.07, 0.62, M(0xb9902a)); s1.position.y = 0.12; g.add(s1); const s2 = s1.clone(); s2.position.y = -0.12; g.add(s2);
  } else if (type === 'bell') {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 12), M(0xf2c200)); g.add(c); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0xa07800)); b.position.y = -0.4; g.add(b);
  } else {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10), M(0xf4f8ff)); g.add(b);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.25, 10), M(0xf4f8ff)); n.position.y = 0.45; g.add(n);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), M(0x3a86ff)); cap.position.y = 0.62; g.add(cap);
    const lab = box(0.46, 0.2, 0.46, M(0x3a86ff)); lab.position.y = -0.05; g.add(lab);
  }
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 24), new THREE.MeshBasicMaterial({ color: 0xb8ff3d, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.55; g.add(glow);
  g.visible = false; scene.add(g); return g;
}
const pickupMeshes = { hay: makePickupMesh('hay'), bell: makePickupMesh('bell'), milk: makePickupMesh('milk') };

// ================== Частицы: конфетти, салют, дождь, снег ==================
const tmpc = new THREE.Color();
const CONF = 160, confGeo = new THREE.BufferGeometry();
const confPos = new Float32Array(CONF * 3), confCol = new Float32Array(CONF * 3), confVel = new Float32Array(CONF * 3);
confGeo.setAttribute('position', new THREE.BufferAttribute(confPos, 3)); confGeo.setAttribute('color', new THREE.BufferAttribute(confCol, 3));
const confetti = new THREE.Points(confGeo, new THREE.PointsMaterial({ size: 0.35, vertexColors: true }));
confetti.frustumCulled = false; confetti.visible = false; scene.add(confetti);
function burstConfetti(hexA) {
  const n = [0, 80, 160][effParts()]; if (!n) return;
  const pal = [hexA, 0xffffff, 0xb8ff3d, hexA, 0xffd23f];
  for (let i = 0; i < CONF; i++) {
    tmpc.setHex(pal[i % 5]); confCol[i * 3] = tmpc.r; confCol[i * 3 + 1] = tmpc.g; confCol[i * 3 + 2] = tmpc.b;
    confPos[i * 3] = (Math.random() - 0.5) * 38; confPos[i * 3 + 1] = 8 + Math.random() * 7; confPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    confVel[i * 3] = (Math.random() - 0.5) * 0.04; confVel[i * 3 + 1] = -0.04 - Math.random() * 0.07; confVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  confGeo.setDrawRange(0, n); confGeo.attributes.color.needsUpdate = true; confetti.visible = true;
}
const FWN = 420, fwGeo = new THREE.BufferGeometry();
const fwPos = new Float32Array(FWN * 3), fwCol = new Float32Array(FWN * 3), fwVel = new Float32Array(FWN * 3), fwLife = new Float32Array(FWN);
let fwActiveCountV45 = 0;
for (let i = 0; i < FWN; i++) fwPos[i * 3 + 1] = -100;
fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3)); fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
const fireworks = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
fireworks.frustumCulled = false; scene.add(fireworks);
function spawnFirework(x, y, z, hexC) {
  const per = [0, 36, 70][effParts()]; let n = 0; if (!per) return;
  for (let i = 0; i < FWN && n < per; i++) {
    if (fwLife[i] > 0) continue;
    const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), sp = 0.08 + Math.random() * 0.1;
    fwPos[i * 3] = x; fwPos[i * 3 + 1] = y; fwPos[i * 3 + 2] = z;
    fwVel[i * 3] = Math.sin(b) * Math.cos(a) * sp; fwVel[i * 3 + 1] = Math.cos(b) * sp; fwVel[i * 3 + 2] = Math.sin(b) * Math.sin(a) * sp;
    tmpc.setHex(hexC); fwCol[i * 3] = tmpc.r; fwCol[i * 3 + 1] = tmpc.g; fwCol[i * 3 + 2] = tmpc.b; fwLife[i] = 55 + Math.random() * 25; fwActiveCountV45++; n++;
  }
  fwGeo.attributes.color.needsUpdate = true;
}
function clearParticles() { clearFx(); confetti.visible = false; fwActiveCountV45 = 0; for (let i = 0; i < FWN; i++) { fwLife[i] = 0; fwPos[i * 3 + 1] = -100; } }

const RAIN_N = 700, SNOW_N = 600;
const rainGeo = new THREE.BufferGeometry(), rainPos = new Float32Array(RAIN_N * 6);
for (let i = 0; i < RAIN_N; i++) { const x = (Math.random() - 0.5) * 90, y = Math.random() * 24, z = (Math.random() - 0.5) * 56; rainPos.set([x, y, z, x - 0.05, y - 0.7, z], i * 6); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.45 }));
rainLines.frustumCulled = false; rainLines.visible = false; scene.add(rainLines);
const snowGeo = new THREE.BufferGeometry(), snowPos = new Float32Array(SNOW_N * 3);
for (let i = 0; i < SNOW_N; i++) snowPos.set([(Math.random() - 0.5) * 90, Math.random() * 24, (Math.random() - 0.5) * 56], i * 3);
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, map: softTex, transparent: true, opacity: 0.88, alphaTest: 0.025, depthWrite: false, size: 0.24, sizeAttenuation: true }));
snowPts.frustumCulled = false; snowPts.visible = false; scene.add(snowPts);

function updateParticles(dt) {
  if (confetti.visible) {
    for (let i = 0; i < CONF; i++) {
      confPos[i * 3] += confVel[i * 3] * dt * 6; confPos[i * 3 + 1] += confVel[i * 3 + 1] * dt * 6; confPos[i * 3 + 2] += confVel[i * 3 + 2] * dt * 6;
      if (confPos[i * 3 + 1] < 0.1) confPos[i * 3 + 1] = 0.1;
    }
    confGeo.attributes.position.needsUpdate = true;
  }
  if (fwActiveCountV45 > 0) {
    for (let i = 0; i < FWN; i++) {
      if (fwLife[i] <= 0) continue;
      fwLife[i] -= dt; fwVel[i * 3 + 1] -= 0.0026 * dt;
      fwPos[i * 3] += fwVel[i * 3] * dt * 4; fwPos[i * 3 + 1] += fwVel[i * 3 + 1] * dt * 4; fwPos[i * 3 + 2] += fwVel[i * 3 + 2] * dt * 4;
      if (fwLife[i] <= 0) { fwPos[i * 3 + 1] = -100; fwActiveCountV45 = Math.max(0, fwActiveCountV45 - 1); }
    }
    fwGeo.attributes.position.needsUpdate = true;
  }
  if (rainLines.visible) {
    const rainCountV45 = Math.min(RAIN_N, Math.ceil((rainGeo.drawRange.count || RAIN_N * 2) / 2));
    const d = 0.9 * dt;
    for (let i = 0; i < rainCountV45; i++) {
      rainPos[i * 6 + 1] -= d; rainPos[i * 6 + 4] -= d;
      if (rainPos[i * 6 + 1] < 0) { const y = 22 + Math.random() * 3; rainPos[i * 6 + 1] = y; rainPos[i * 6 + 4] = y - 0.7; }
    }
    rainGeo.attributes.position.needsUpdate = true;
  }
  if (snowPts.visible) {
    const snowCountV45 = Math.min(SNOW_N, snowGeo.drawRange.count || SNOW_N);
    for (let i = 0; i < snowCountV45; i++) {
      snowPos[i * 3 + 1] -= 0.06 * dt; snowPos[i * 3] += Math.sin(clock * 0.03 + i) * 0.01 * dt;
      if (snowPos[i * 3 + 1] < 0) snowPos[i * 3 + 1] = 22 + Math.random() * 3;
    }
    snowGeo.attributes.position.needsUpdate = true;
  }
}

function resizeGL() {
  if (!resizeGL.q) { resizeGL.q = 1; applyGfxQuality(); }
  applyRes(); camera.aspect = window.innerWidth / window.innerHeight; camera.fov = settings.cameraFov || 50; camera.updateProjectionMatrix();
  camF = Math.max(1, 1.85 / camera.aspect);
}

// ================== Состояние матча ==================
let state = 'menu';
let introFull = false, introT = 0, introEv = {}, outroT = 0, outroWinner = -1, outroGreet = false, outroCheer = false;
const sideKit = [0xffffff, 0xffffff];
let score = [0, 0], timeLeft = 90, readyT = 0, flashT = 0, goalT = 0, goalFx = 0, lastScorer = 0, celeb = null;
let clock = 0, ballStuck = 0, lastTouch = null, matchFrames = 0, pickupT = 300, lastCount = 0, lastMinute = false;
let matchCfg = { tA: TEAMS[0], tB: TEAMS[1], size: 5, versus: false, ko: false };
const sideTeam = [TEAMS[0], TEAMS[1]];
const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, h: 0, holder: null, carrier: null, fire: 0, onTarget: 0, shotSide: -1, curve: 0, crossT: 0, crossTeam: -1 };
const cows = [], players = [], pickups = [];
const tinfo = [{ chaser: null, support: null, human: null }, { chaser: null, support: null, human: null }];
let stats = newStats();
function newStats() { return { shots: [0, 0], on: [0, 0], saves: [0, 0], pass: [0, 0], cross: [0, 0], poss: [0, 0], pick: [0, 0] }; }
let penCamFn = null;

const FORM = {
  2: [['gk', 0.03, 0], ['fw', 0.64, 0]],
  3: [['gk', 0.03, 0], ['df', 0.34, -0.45], ['fw', 0.64, 0.45]],
  5: [['gk', 0.03, 0], ['df', 0.28, -0.55], ['df', 0.28, 0.55], ['fw', 0.62, -0.5], ['fw', 0.62, 0.5]],
  11: [['gk', 0.025, 0], ['df', 0.16, -0.58], ['df', 0.16, -0.2], ['df', 0.16, 0.2], ['df', 0.16, 0.58], ['mf', 0.37, -0.56], ['mf', 0.39, -0.18], ['mf', 0.39, 0.22], ['mf', 0.37, 0.56], ['fw', 0.64, -0.32], ['fw', 0.66, 0.32]]
};
const sPan = x => clamp((x - W / 2) / (W / 2) * 0.8, -0.8, 0.8);
const dBall = c => Math.hypot(ball.x - c.x, ball.y - c.y);
const canPassFrom = c => !!c && (ball.carrier === c || ball.holder === c || (!ball.holder && dBall(c) <= CR + BR + 40));
function setState(s) { const wasMenu = state === 'menu'; state = s; applyUIState(); if ((s === 'menu') !== wasMenu) { applyRes(); if (wasMenu) fpsAvg = settings.fpsCap || 60; } }

// ================== Подготовка матча ==================
function buildMatch(cfg) {
  matchCfg = cfg; sideTeam[0] = cfg.tA; sideTeam[1] = cfg.tB;
  cows.forEach(disposeCow); cows.length = 0; players.length = 0;
  const teamA = kitVariant(sideTeam[0], cfg.kitA | 0), kitB = kitFor(sideTeam[1], teamA); sideKit[0] = teamA.c1; sideKit[1] = kitB.c1;
  for (let t = 0; t < 2; t++) {
    formFor(cfg, t).forEach(f => {
      const team = sideTeam[t], rig = makeCow(t === 1 ? kitB : teamA, f[0], (t === 0 || cfg.versus) ? settings.hat : 0);
      cows.push(Object.assign(rig, { team: t, tdef: team, role: f[0], home: [f[1], f[2]], ctrl: null, x: 0, y: 0, vx: 0, vy: 0, ang: 0,
        cd: 0, wait: 0, freeze: 0, speedBoost: 0, milk: 0, milkT: 0, hold: 0, diveT: 0, diveDir: 0 }));
    });
  }
assignNames();
if (cfg.utManaged && typeof applyUTLineupToMatch === 'function') applyUTLineupToMatch(cows, cfg);
const captainSet = new Set();
cows.forEach(c => { if (c.role !== 'gk' && !captainSet.has(c.team)) { c.isCaptain = true; captainSet.add(c.team); } });
cows.forEach(attachCowNumber);
const mk = (id, team) => ({ id, team, cow: null, stamina: 1, charge: 0, kPrev: false, pPrev: false, passBuffer: 0, crossPrev: false, crossBuffer: 0, swPrev: false, swCd: 0, pending: null, input: null });
  players.push(mk(1, 0)); if (cfg.versus) players.push(mk(2, 1));
  refreshSpectatorTeams(cfg.tA, cfg.tB); setBallStyle(settings.ballStyle);
  $('sb').style.setProperty('--c0', hex(teamA.c1)); $('sb').style.setProperty('--c1', hex(kitB.c1));
  $('nA').textContent = cfg.tA.nation ? `${cfg.tA.flag} ${cfg.tA.code}` : (/^FT\d+$/i.test(String(cfg.tA.code||'')) ? String(cfg.tA.name||'КЛУБ').replace(/[^A-ZА-ЯЁ]/gi,'').slice(0,4).toUpperCase() : cfg.tA.code);
  $('nB').textContent = cfg.tB.nation ? `${cfg.tB.flag} ${cfg.tB.code}` : (/^FT\d+$/i.test(String(cfg.tB.code||'')) ? String(cfg.tB.name||'КЛУБ').replace(/[^A-ZА-ЯЁ]/gi,'').slice(0,4).toUpperCase() : cfg.tB.code);
  resetPositions();
}
const FORMS11 = { '4-3-3': [['df', 4, .16], ['mf', 3, .38], ['fw', 3, .64]], '4-4-2': [['df', 4, .16], ['mf', 4, .38], ['fw', 2, .65]], '3-5-2': [['df', 3, .16], ['mf', 5, .38], ['fw', 2, .65]],
  '4-2-3-1': [['df', 4, .16], ['mf', 2, .30], ['mf', 3, .46], ['fw', 1, .66]], '5-3-2': [['df', 5, .15], ['mf', 3, .38], ['fw', 2, .65]], '4-5-1': [['df', 4, .16], ['mf', 5, .40], ['fw', 1, .66]] };
const FORMS5 = { '2-2': [['df', 2, .28], ['fw', 2, .62]], '3-1': [['df', 3, .26], ['fw', 1, .62]], '1-3': [['df', 1, .26], ['fw', 3, .62]], '1-2-1': [['df', 1, .22], ['mf', 2, .42], ['fw', 1, .64]] };
const ySp = n => n === 1 ? [0] : n === 2 ? [-.34, .34] : n === 3 ? [-.5, 0, .5] : n === 4 ? [-.6, -.2, .2, .6] : [-.66, -.33, 0, .33, .66];
const makeForm = (lines, gkx) => [['gk', gkx, 0]].concat(...lines.map(l => ySp(l[1]).map(y => [l[0], l[2], y])));
function formFor(cfg, t) {
  const key = t === 0 ? cfg.form : cfg.formB;
  if (cfg.size === 11 && FORMS11[key]) return makeForm(FORMS11[key], .025);
  if (cfg.size === 5 && FORMS5[key]) return makeForm(FORMS5[key], .03);
  return FORM[cfg.size];
}
const pickAIForm = cfg => { const k = Object.keys(cfg.size === 11 ? FORMS11 : cfg.size === 5 ? FORMS5 : {}); return k.length ? k[(Math.random() * k.length) | 0] : ''; };
const pickAIStyle = () => ['att', 'bal', 'bal', 'def'][(Math.random() * 4) | 0];
// Вымышленные игроки: имена изменены, это не реальные люди. Для остальных команд имена генерируются.
const FICT = {
  ESP: { gk: ['Tavo Soleran'], df: ['Ruben Valmora', 'Nilo Serrano', 'Mateo Claros', 'Pablo Riveira', 'Ivo Calderen'], mf: ['Dario Velasco', 'Gael Montoya', 'Bruno Laderas', 'Sergio Mareno', 'Alvaro Cesped'], fw: ['Yasamal', 'Nico Willow', 'Moratto'] },
  ARG: { gk: ['Emilio Martinas'], df: ['Tadeo Bellaro', 'Ramiro Olvera', 'Teo Montal', 'Facundo Zarela', 'Lisandro Pareda'], mf: ['Diel Miral', 'Matien Solvan', 'Enzo Fernal', 'Paredo', 'Almadas'], fw: ['Lautaro Velin', 'Jualen Alvarus', 'Tomas Rojal'] },
  FRA: { gk: ['Marcel Duvane'], df: ['Lucien Morel', 'Bastien Salven', 'Remy Duclat', 'Hugo Varenne', 'Theo Marceau'], mf: ['Adrien Talmont', 'Romain Bellier', 'Noel Carpent', 'Gabin Lenoir', 'Camille Rousset'], fw: ['Milo Dambre', 'Sacha Perrin', 'Jules Navarre'] },
  ENG: { gk: ['Ollie Bramble'], df: ['Alf Wexford', 'Marek Brook', 'Joren Harlow', 'Finley Shawcross', 'Reece Whitby'], mf: ['Declan Weller', 'Benny Ashford', 'Felix Grafton', 'Morgan Tew', 'Sonny Vale'], fw: ['Harlan Westby', 'Rory Fenn', 'Toby Sterling'] },
  BRA: { gk: ['Alo Narejo'], df: ['Marcos Nobre', 'Milton Reis', 'Dano Serrat', 'Aleks Sondara', 'Breno Limas'], mf: ['Caio Meireles', 'Paulo Nunesa', 'Bruno Gama', 'Andre Luz', 'Luca Viana'], fw: ['Vino Pradal', 'Roder Matos', 'Navo Roha'] }
};
const NM_FIRST = ['Alvo', 'Brix', 'Cato', 'Dario', 'Evan', 'Fabri', 'Gael', 'Hugo', 'Ivo', 'Joro', 'Kian', 'Luka', 'Milo', 'Nero', 'Orso', 'Pavo', 'Remo', 'Sasha', 'Tavi', 'Ugo', 'Vito', 'Zeno'];
const NM_SUR = ['Marenko', 'Valdez', 'Korovin', 'Bellini', 'Okafor', 'Lindqvist', 'Duarte', 'Kowal', 'Mirza', 'Tanaka', 'Brandt', 'Rossel', 'Novak', 'Haddad', 'Silvano', 'Petrak', 'Quintero', 'Varga', 'Ferrante', 'Osei'];
const hash32 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const NPOOL = {
 es:[['Alejandro','Carlos','Diego','Javier','Miguel','Sergio','Pablo','Álvaro','Raúl','Iván','Adrián','Marcos','Rubén','Hugo','Mario','Óscar','Andrés','Fernando','Luis','Jorge','Daniel','Nicolás','Gonzalo','Ángel'],['García','Martínez','López','Sánchez','Pérez','Gómez','Fernández','Díaz','Moreno','Muñoz','Álvarez','Romero','Navarro','Torres','Domínguez','Ramos','Gil','Serrano','Blanco','Molina','Castro','Ortega','Rubio','Marín','Vega']],
 en:[['Jack','Harry','Oliver','George','Charlie','Tom','Jamie','Callum','Reece','Declan','Mason','Luke','Ben','Sam','Connor','Ryan','Jordan','Kyle','Liam','Aaron','Dean','Josh','Danny','Marcus'],['Smith','Jones','Taylor','Walker','Wright','Clarke','Hughes','Bennett','Fletcher','Hayes','Palmer','Cooper','Ward','Morgan','Bell','Murray','Grant','Foster','Reid','Barnes','Webb','Holland','Pearce','Dixon','Shaw']],
 de:[['Lukas','Jonas','Felix','Leon','Maximilian','Tim','Niklas','Jan','Florian','Moritz','Kai','Julian','Philipp','Tobias','David','Simon','Fabian','Marvin','Lars','Sebastian','Nico','Timo','Robin','Paul'],['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Hoffmann','Schulz','Koch','Richter','Klein','Wolf','Neumann','Schwarz','Zimmermann','Braun','Krüger','Hartmann','Lange','Werner','Krause','Lehmann','Köhler']],
 fr:[['Lucas','Hugo','Théo','Louis','Nathan','Maxime','Antoine','Julien','Romain','Kylian','Adrien','Baptiste','Clément','Axel','Enzo','Mathis','Quentin','Rémi','Samuel','Thomas','Yanis','Alexis','Corentin','Damien'],['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Morel','Girard','Andre','Mercier','Dupont']],
 it:[['Marco','Luca','Andrea','Matteo','Alessandro','Federico','Francesco','Davide','Simone','Lorenzo','Giovanni','Riccardo','Nicolò','Stefano','Gianluca','Fabio','Antonio','Roberto','Daniele','Emanuele','Giorgio','Paolo','Claudio','Mattia'],['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Costa','Giordano','Mancini','Rizzo','Lombardi','Moretti','Barbieri','Fontana','Santoro','Mariani','Rinaldi']],
 pt:[['João','Pedro','Lucas','Gabriel','Rafael','Bruno','Thiago','Diogo','Rodrigo','Matheus','Felipe','Gustavo','André','Caio','Vitor','Leonardo','Renato','Tiago','Henrique','Fábio','Marcelo','Danilo','Igor','Rúben'],['Silva','Santos','Oliveira','Souza','Costa','Pereira','Rodrigues','Almeida','Nascimento','Lima','Araújo','Ribeiro','Carvalho','Gomes','Martins','Barbosa','Moreira','Cardoso','Teixeira','Correia','Moura','Ferreira','Mendes','Nunes','Rocha']],
 nl:[['Daan','Sven','Jesse','Thijs','Bram','Luuk','Joost','Stijn','Ruben','Tim','Lars','Niels','Rick','Wouter','Jeroen','Koen','Mees','Teun','Gijs','Max','Floris','Pim','Dirk','Cas'],['de Jong','van Dijk','Bakker','Janssen','Visser','Smit','Meijer','de Boer','Mulder','de Groot','Bos','Vos','Peters','Hendriks','van Leeuwen','Dekker','Brouwer','de Wit','Dijkstra','Smits','de Graaf','van der Meer','Kok','Jacobs','Verhoeven']],
 sl:[['Marko','Luka','Ivan','Nikola','Stefan','Milan','Filip','Petar','Dario','Jakub','Tomasz','Piotr','Andrij','Oleksandr','Vladimir','Dusan','Matej','Jan','Martin','Marek','Bogdan','Damir','Aleksandar','Zoran'],['Kovač','Horvat','Novak','Jovanović','Petrović','Nowak','Kowalski','Wiśniewski','Shevchenko','Melnyk','Kovalenko','Svoboda','Dvořák','Černý','Marković','Popović','Babić','Pavlović','Tkachenko','Lewandowski','Zieliński','Bondar','Horák','Kolar','Ilić']],
 nd:[['Erik','Lars','Anders','Magnus','Henrik','Jonas','Mikael','Oskar','Sven','Nils','Mads','Emil','Rasmus','Kasper','Viktor','Gunnar','Olav','Jesper','Axel','Mattias','Joakim','Simon','Elias','Tobias'],['Johansson','Andersson','Lindberg','Nilsson','Larsen','Hansen','Pedersen','Olsen','Berg','Eriksen','Sørensen','Jensen','Karlsson','Svensson','Halvorsen','Nielsen','Dahl','Lund','Strand','Holm','Gustafsson','Bakke','Mikkelsen','Aalto','Virtanen']],
 tr:[['Mehmet','Ahmet','Mustafa','Emre','Burak','Cem','Hakan','Kerem','Arda','Yusuf','Ali','Can','Deniz','Eren','Murat','Okan','Selim','Tolga','Volkan','Kaan','Orhan','Baran','Ozan','Serkan'],['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Yıldırım','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat','Erdoğan','Güneş','Aksoy','Taş']],
 ar:[['Mohamed','Ahmed','Youssef','Omar','Karim','Hakim','Said','Walid','Ayman','Nabil','Rachid','Hamza','Amine','Bilal','Tarek','Samir','Yassine','Zakaria','Sofiane','Adel','Khalid','Faisal','Ali','Hassan'],['Benali','Haddad','Mansour','Said','Nasser','Hakimi','Ziyech','Amrabat','Salah','El Sayed','Mahrez','Bennacer','Al-Harbi','Al-Dosari','Karimi','Rezaei','Hosseini','Saidi','Boulahrouz','Abdallah','Tahiri','Khalil','Ibrahim','Farouk','Zaki']],
 af:[['Kwame','Kofi','Chidi','Emeka','Samuel','Thabo','Sipho','Kwesi','Ibrahim','Moussa','Samuel','Victor','Joseph','Daniel','Peter','Musa','Tendai','Lungelo','Kevin','Emmanuel','Isaac','Paul','Abdul','Femi'],['Mensah','Owusu','Boateng','Okafor','Adeyemi','Eze','Nwankwo','Okoye','Dlamini','Nkosi','Khumalo','Mokoena','Otieng','Kamau','Mwangi','Abdi','Ndlovu','Osei','Appiah','Mbeki','Diallo','Traoré','Keita','Sow','Camara']],
 jp:[['Takumi','Haruto','Ren','Sota','Yuki','Daiki','Kenta','Ryo','Shota','Hiroshi','Taro','Kaito','Naoki','Yuto','Riku','Koji','Masato','Shun','Tatsuya','Kazuki','Hayato','Satoshi','Tomoya','Junya'],['Tanaka','Suzuki','Sato','Takahashi','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Yoshida','Yamada','Sasaki','Matsumoto','Inoue','Kimura','Hayashi','Shimizu','Mori','Ikeda','Hashimoto','Abe','Ishikawa','Ogawa','Maeda']],
 kr:[['Min-jae','Hyun-woo','Joon-ho','Seung-ho','Ji-hoon','Dong-hyun','Sung-min','Tae-yang','Woo-jin','Jin-su','Kang-in','Hee-chan','Young-jun','Ki-hyun','Do-yoon','Han-sol','Sang-ho','Yong-min','Jae-sung','Chan-woo','Gi-taek','Ha-neul','In-beom','Seung-woo'],['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh','Seo','Shin','Kwon','Hwang','Ahn','Song','Hong','Yoo','Moon','Bae','Baek','Nam','Son']],
 cn:[['Wei','Lei','Jun','Hao','Ming','Chen','Yang','Peng','Bo','Tao','Long','Feng','Jian','Qiang','Kai','Hui','Xin','Yu','Gang','Zhi','Liang','Ping','Dong','Rui'],['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou','Xu','Sun','Ma','Zhu','Hu','Guo','He','Lin','Gao','Luo','Zheng','Liang','Xie','Tang','Han']],
 gr:[['Giorgos','Nikos','Dimitris','Kostas','Panagiotis','Yannis','Christos','Thanasis','Vasilis','Stelios','Alexandros','Manolis','Petros','Sokratis','Lazaros','Anastasios','Fotis','Miltos','Orestis','Pavlos','Stratos','Tasos','Zisis','Leonidas'],['Papadopoulos','Karagounis','Nikolaidis','Georgiou','Dimitriou','Vasiliou','Antoniou','Ioannou','Pappas','Alexiou','Makris','Samaras','Fortounis','Tzavellas','Mitroglou','Katsouranis','Siopis','Karelis','Zografos','Kolovos','Galanopoulos','Bakasetas','Hatzidis','Papastathopoulos','Torosidis']],
 hu:[['Gábor','Balázs','Péter','Zoltán','Attila','László','Tamás','Dániel','Ádám','Márk','Bence','Dominik','Roland','Norbert','Krisztián','Máté','Gergő','Richárd','Szabolcs','Levente','Milán','Dávid','András','Csaba'],['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár','Németh','Farkas','Balogh','Papp','Takács','Juhász','Lakatos','Mészáros','Oláh','Simon','Rácz','Fekete','Szalai','Szilágyi','Sallai','Orbán','Szoboszlai']],
 ro:[['Andrei','Alexandru','Mihai','Florin','Cristian','Marius','Gabriel','Răzvan','Ionuț','Adrian','Vlad','Daniel','Bogdan','Nicolae','Dorin','Ciprian','Valentin','Costin','Radu','Lucian','Sorin','Tudor','Darius','Claudiu'],['Popescu','Ionescu','Popa','Stan','Dumitru','Gheorghe','Constantin','Marin','Stoica','Radu','Matei','Dinu','Georgescu','Munteanu','Moldovan','Stanciu','Man','Dragomir','Ilie','Rusu','Nistor','Tănase','Cojocaru','Hagi','Drăgușin']],
 ru:[['Ivan','Alexei','Dmitri','Sergei','Andrei','Nikita','Maxim','Artem','Pavel','Denis','Igor','Roman','Kirill','Vladimir','Yuri','Anton','Egor','Oleg','Viktor','Mikhail','Timur','Stanislav','Ruslan','Konstantin'],['Ivanov','Petrov','Smirnov','Kuznetsov','Popov','Volkov','Sokolov','Lebedev','Morozov','Orlov','Fedorov','Nikitin','Zaitsev','Pavlov','Semenov','Golubev','Vinogradov','Belov','Medvedev','Kovalev','Titov','Gusev','Sorokin','Kuzmin','Frolov']],
 mix:[['Alex','Daniel','Marco','Luis','Adam','David','Leo','Max','Nico','Sam','Victor','Tom','Ben','Eric','Dylan','Noah','Elias','Ethan','Oscar','Mateo','Felix','Hugo','Jonas','Rafael'],['Moreno','Fischer','Rossi','Novak','Costa','Silva','Berg','Laurent','Santos','Kovac','Meyer','Duarte','Ortiz','Bauer','Marino','Lopez','Weber','Pires','Torres','Hansen','Ricci','Vega','Nunez','Keller','Lang']]
};
const NATPOOL = {ESP:'es',ARG:'es',URU:'es',MEX:'es',COL:'es',CHI:'es',PER:'es',CRC:'es',ECU:'es',PAR:'es',VEN:'es',BOL:'es',PAN:'es',
 POR:'pt',BRA:'pt',ENG:'en',USA:'en',SCO:'en',WAL:'en',IRL:'en',AUS:'en',NZL:'en',CAN:'en',JAM:'en',GER:'de',AUT:'de',SUI:'de',
 FRA:'fr',BEL:'fr',SEN:'fr',CIV:'fr',CMR:'fr',MLI:'fr',COD:'fr',ITA:'it',ALB:'it',NED:'nl',
 UKR:'sl',POL:'sl',CZE:'sl',SRB:'sl',CRO:'sl',SVK:'sl',SVN:'sl',BUL:'sl',BIH:'sl',MNE:'sl',MKD:'sl',KAZ:'ru',GEO:'ru',ARM:'ru',
 SWE:'nd',NOR:'nd',DEN:'nd',ISL:'nd',FIN:'nd',TUR:'tr',AZE:'tr',MAR:'ar',EGY:'ar',ALG:'ar',TUN:'ar',KSA:'ar',QAT:'ar',IRQ:'ar',JOR:'ar',IRN:'ar',
 NGA:'af',GHA:'af',RSA:'af',KEN:'af',JPN:'jp',KOR:'kr',CHN:'cn',THA:'cn',VIE:'cn',GRE:'gr',HUN:'hu',ROU:'ro'};
function poolOf(tm) { if (tm.nation) return NATPOOL[tm.code] || 'mix'; if (tm.league) return ({ premier:'en', laliga:'es', bundesliga:'de', seriea:'it', ligue1:'fr' })[tm.league] || 'mix'; return tm.pool || 'ru'; }
const REAL_XI = {"ESP": "Unai Simón|Dani Carvajal|Robin Le Normand|Aymeric Laporte|Marc Cucurella|Rodri|Pedri|Fabián Ruiz|Lamine Yamal|Álvaro Morata|Nico Williams", "ARG": "Emiliano Martínez|Nahuel Molina|Cristian Romero|Nicolás Otamendi|Nicolás Tagliafico|Rodrigo De Paul|Enzo Fernández|Alexis Mac Allister|Lionel Messi|Lautaro Martínez|Julián Álvarez", "BRA": "Alisson Becker|Danilo|Marquinhos|Gabriel Magalhães|Wendell|Bruno Guimarães|Lucas Paquetá|Casemiro|Vinícius Júnior|Rodrygo|Raphinha", "FRA": "Mike Maignan|Jules Koundé|Dayot Upamecano|William Saliba|Theo Hernández|Aurélien Tchouaméni|N'Golo Kanté|Antoine Griezmann|Kylian Mbappé|Ousmane Dembélé|Marcus Thuram", "ENG": "Jordan Pickford|Kyle Walker|John Stones|Marc Guéhi|Trent Alexander-Arnold|Declan Rice|Jude Bellingham|Phil Foden|Bukayo Saka|Harry Kane|Cole Palmer", "GER": "Manuel Neuer|Joshua Kimmich|Antonio Rüdiger|Jonathan Tah|Maximilian Mittelstädt|İlkay Gündoğan|Robert Andrich|Florian Wirtz|Jamal Musiala|Kai Havertz|Leroy Sané", "POR": "Diogo Costa|João Cancelo|Rúben Dias|Gonçalo Inácio|Nuno Mendes|Bruno Fernandes|Vitinha|Bernardo Silva|Cristiano Ronaldo|Rafael Leão|Gonçalo Ramos", "ITA": "Gianluigi Donnarumma|Giovanni Di Lorenzo|Alessandro Bastoni|Riccardo Calafiori|Federico Dimarco|Nicolò Barella|Jorginho|Sandro Tonali|Federico Chiesa|Mateo Retegui|Gianluca Scamacca", "NED": "Bart Verbruggen|Denzel Dumfries|Virgil van Dijk|Nathan Aké|Micky van de Ven|Frenkie de Jong|Tijjani Reijnders|Xavi Simons|Cody Gakpo|Memphis Depay|Donyell Malen", "BEL": "Thibaut Courtois|Timothy Castagne|Wout Faes|Zeno Debast|Arthur Theate|Kevin De Bruyne|Amadou Onana|Youri Tielemans|Jérémy Doku|Romelu Lukaku|Leandro Trossard", "CRO": "Dominik Livaković|Josip Stanišić|Joško Gvardiol|Josip Šutalo|Borna Sosa|Luka Modrić|Mateo Kovačić|Marcelo Brozović|Andrej Kramarić|Ivan Perišić|Ante Budimir", "URU": "Sergio Rochet|Nahitan Nández|José María Giménez|Ronald Araújo|Mathías Olivera|Federico Valverde|Manuel Ugarte|Rodrigo Bentancur|Darwin Núñez|Facundo Pellistri|Maximiliano Araújo", "COL": "Camilo Vargas|Daniel Muñoz|Davinson Sánchez|Jhon Lucumí|Johan Mojica|Jefferson Lerma|Richard Ríos|James Rodríguez|Luis Díaz|Jhon Córdoba|Luis Sinisterra", "MEX": "Guillermo Ochoa|Jorge Sánchez|César Montes|Johan Vásquez|Jesús Gallardo|Edson Álvarez|Luis Chávez|Orbelín Pineda|Hirving Lozano|Santiago Giménez|Raúl Jiménez", "USA": "Matt Turner|Sergiño Dest|Chris Richards|Tim Ream|Antonee Robinson|Tyler Adams|Weston McKennie|Giovanni Reyna|Christian Pulisic|Ricardo Pepi|Timothy Weah", "JPN": "Zion Suzuki|Takehiro Tomiyasu|Ko Itakura|Hiroki Itō|Yukinari Sugawara|Wataru Endō|Hidemasa Morita|Takefusa Kubo|Kaoru Mitoma|Ayase Ueda|Daichi Kamada", "KOR": "Jo Hyeon-woo|Seol Young-woo|Kim Min-jae|Kim Young-gwon|Lee Ki-je|Hwang In-beom|Lee Jae-sung|Lee Kang-in|Son Heung-min|Hwang Hee-chan|Cho Gue-sung", "MAR": "Yassine Bounou|Achraf Hakimi|Nayef Aguerd|Romain Saïss|Noussair Mazraoui|Sofyan Amrabat|Azzedine Ounahi|Selim Amallah|Hakim Ziyech|Youssef En-Nesyri|Brahim Díaz", "SEN": "Édouard Mendy|Krépin Diatta|Kalidou Koulibaly|Abdou Diallo|Ismail Jakobs|Idrissa Gueye|Nampalys Mendy|Pape Matar Sarr|Sadio Mané|Nicolas Jackson|Ismaïla Sarr", "NGA": "Stanley Nwabali|Ola Aina|William Troost-Ekong|Calvin Bassey|Zaidu Sanusi|Wilfred Ndidi|Alex Iwobi|Frank Onyeka|Victor Osimhen|Ademola Lookman|Samuel Chukwueze", "EGY": "Mohamed El Shenawy|Mohamed Hany|Ahmed Hegazi|Mohamed Abdelmonem|Ramy Rabia|Mohamed Elneny|Hamdi Fathi|Trézéguet|Mohamed Salah|Omar Marmoush|Mostafa Mohamed", "TUR": "Uğurcan Çakır|Zeki Çelik|Merih Demiral|Abdülkerim Bardakcı|Ferdi Kadıoğlu|Hakan Çalhanoğlu|Orkun Kökçü|Arda Güler|Kenan Yıldız|Barış Alper Yılmaz|Kerem Aktürkoğlu", "POL": "Wojciech Szczęsny|Jakub Kiwior|Jan Bednarek|Przemysław Wiśniewski|Matty Cash|Piotr Zieliński|Sebastian Szymański|Jakub Moder|Robert Lewandowski|Arkadiusz Milik|Krzysztof Piątek", "UKR": "Anatolii Trubin|Oleksandr Zinchenko|Illia Zabarnyi|Mykola Matviienko|Vitaliy Mykolenko|Taras Stepanenko|Mykola Shaparenko|Georgiy Sudakov|Mykhailo Mudryk|Artem Dovbyk|Viktor Tsyhankov", "SUI": "Yann Sommer|Silvan Widmer|Manuel Akanji|Fabian Schär|Ricardo Rodríguez|Granit Xhaka|Remo Freuler|Denis Zakaria|Breel Embolo|Xherdan Shaqiri|Ruben Vargas", "DEN": "Kasper Schmeichel|Joachim Andersen|Andreas Christensen|Victor Nelsson|Joakim Mæhle|Pierre-Emile Højbjerg|Christian Eriksen|Thomas Delaney|Rasmus Højlund|Jonas Wind|Mikkel Damsgaard", "SWE": "Robin Olsen|Emil Holm|Victor Lindelöf|Isak Hien|Ludwig Augustinsson|Dejan Kulusevski|Jesper Karlström|Albin Ekdal|Alexander Isak|Viktor Gyökeres|Anthony Elanga", "NOR": "Ørjan Nyland|Julian Ryerson|Kristoffer Ajer|Leo Østigård|Fredrik Bjørkan|Martin Ødegaard|Sander Berge|Patrick Berg|Erling Haaland|Alexander Sørloth|Oscar Bobb", "AUT": "Patrick Pentz|Stefan Posch|David Alaba|Kevin Danso|Phillipp Mwene|Marcel Sabitzer|Konrad Laimer|Nicolas Seiwald|Christoph Baumgartner|Marko Arnautović|Michael Gregoritsch", "SRB": "Predrag Rajković|Strahinja Pavlović|Nikola Milenković|Miloš Veljković|Filip Mladenović|Sergej Milinković-Savić|Nemanja Gudelj|Dušan Tadić|Aleksandar Mitrović|Dušan Vlahović|Filip Kostić", "SCO": "Angus Gunn|Anthony Ralston|Grant Hanley|Scott McKenna|Andy Robertson|John McGinn|Callum McGregor|Billy Gilmour|Scott McTominay|Che Adams|Lyndon Dykes", "CAN": "Maxime Crépeau|Alistair Johnston|Kamal Miller|Moïse Bombito|Alphonso Davies|Stephen Eustáquio|Jonathan Osorio|Ismaël Koné|Jonathan David|Cyle Larin|Tajon Buchanan", "AUS": "Mathew Ryan|Nathaniel Atkinson|Harry Souttar|Kye Rowles|Aziz Behich|Jackson Irvine|Ajdin Hrustic|Riley McGree|Mitchell Duke|Craig Goodwin|Martin Boyle", "ECU": "Hernán Galíndez|Ángelo Preciado|Piero Hincapié|Willian Pacho|Pervis Estupiñán|Moisés Caicedo|Alan Franco|Gonzalo Plata|Enner Valencia|Kendry Páez|Kevin Rodríguez", "CHI": "Brayan Cortés|Mauricio Isla|Guillermo Maripán|Gary Medel|Gabriel Suazo|Erick Pulgar|Charles Aránguiz|Marcelino Núñez|Alexis Sánchez|Ben Brereton|Darío Osorio", "GHA": "Lawrence Ati-Zigi|Tariq Lamptey|Alexander Djiku|Mohammed Salisu|Gideon Mensah|Thomas Partey|Mohammed Kudus|Salis Abdul Samed|Jordan Ayew|Iñaki Williams|Antoine Semenyo", "CMR": "André Onana|Nouhou Tolo|Jean-Charles Castelletto|Christopher Wooh|Collins Fai|André-Frank Zambo Anguissa|Martin Hongla|Samuel Gouet|Vincent Aboubakar|Eric Maxim Choupo-Moting|Bryan Mbeumo", "ALG": "Anthony Mandrea|Youcef Atal|Aïssa Mandi|Ramy Bensebaini|Rayan Aït-Nouri|Ismaël Bennacer|Nabil Bentaleb|Houssem Aouar|Riyad Mahrez|Baghdad Bounedjah|Mohamed Amoura", "CIV": "Yahia Fofana|Serge Aurier|Odilon Kossounou|Evan Ndicka|Ghislain Konan|Franck Kessié|Seko Fofana|Ibrahim Sangaré|Sébastien Haller|Simon Adingra|Nicolas Pépé", "KSA": "Mohammed Al-Owais|Saud Abdulhamid|Ali Al-Bulaihi|Hassan Tambakti|Yasser Al-Shahrani|Salman Al-Faraj|Mohamed Kanno|Salem Al-Dawsari|Firas Al-Buraikan|Saleh Al-Shehri|Abdulrahman Ghareeb", "IRN": "Alireza Beiranvand|Sadegh Moharrami|Hossein Kanaanizadegan|Shojae Khalilzadeh|Ehsan Hajsafi|Saeid Ezatolahi|Ali Gholizadeh|Saman Ghoddos|Mehdi Taremi|Sardar Azmoun|Alireza Jahanbakhsh", "GRE": "Odysseas Vlachodimos|Giorgos Tzavellas|Konstantinos Mavropanos|Panagiotis Retsos|Dimitris Giannoulis|Andreas Bouchalakis|Petros Mantalos|Anastasios Bakasetas|Fotis Ioannidis|Vangelis Pavlidis|Dimitris Pelkas", "CZE": "Matěj Kovář|Vladimír Coufal|Ladislav Krejčí|Robin Hranáč|David Jurásek|Tomáš Souček|Lukáš Provod|Antonín Barák|Patrik Schick|Adam Hložek|Tomáš Chorý", "HUN": "Péter Gulácsi|Ádám Lang|Willi Orbán|Attila Szalai|Loïc Nego|Dominik Szoboszlai|Ádám Nagy|András Schäfer|Roland Sallai|Barnabás Varga|Kevin Csoboth", "ROU": "Florin Niță|Andrei Rațiu|Radu Drăgușin|Ionuț Nedelcearu|Nicușor Bancu|Răzvan Marin|Nicolae Stanciu|Ianis Hagi|Denis Drăguș|George Pușcaș|Dennis Man", "WAL": "Danny Ward|Neco Williams|Joe Rodon|Ben Davies|Connor Roberts|Ethan Ampadu|Aaron Ramsey|Harry Wilson|Brennan Johnson|Daniel James|Kieffer Moore", "IRL": "Gavin Bazunu|Seamus Coleman|Nathan Collins|Dara O'Shea|Matt Doherty|Josh Cullen|Jayson Molumby|Will Smallbone|Evan Ferguson|Troy Parrott|Adam Idah", "pl_ars": "David Raya|Ben White|William Saliba|Gabriel Magalhães|Riccardo Calafiori|Martin Ødegaard|Declan Rice|Mikel Merino|Bukayo Saka|Viktor Gyökeres|Gabriel Martinelli", "pl_liv": "Alisson Becker|Conor Bradley|Virgil van Dijk|Ibrahima Konaté|Andrew Robertson|Alexis Mac Allister|Ryan Gravenberch|Dominik Szoboszlai|Mohamed Salah|Cody Gakpo|Florian Wirtz", "pl_mci": "Gianluigi Donnarumma|Rúben Dias|Joško Gvardiol|John Stones|Nathan Aké|Rodri|Bernardo Silva|Phil Foden|Erling Haaland|Jérémy Doku|Savinho", "pl_mun": "Altay Bayındır|Diogo Dalot|Lisandro Martínez|Matthijs de Ligt|Luke Shaw|Casemiro|Bruno Fernandes|Kobbie Mainoo|Bryan Mbeumo|Matheus Cunha|Benjamin Šeško", "fx_0": "Robert Sánchez|Reece James|Levi Colwill|Wesley Fofana|Marc Cucurella|Moisés Caicedo|Enzo Fernández|Cole Palmer|Pedro Neto|João Pedro|Nicolas Jackson", "fx_5": "Guglielmo Vicario|Pedro Porro|Cristian Romero|Micky van de Ven|Destiny Udogie|Rodrigo Bentancur|James Maddison|Pape Matar Sarr|Mohammed Kudus|Dominic Solanke|Brennan Johnson", "fx_10": "Nick Pope|Kieran Trippier|Sven Botman|Fabian Schär|Dan Burn|Bruno Guimarães|Sandro Tonali|Joelinton|Anthony Gordon|Nick Woltemade|Harvey Barnes", "fx_15": "Emiliano Martínez|Matty Cash|Ezri Konsa|Pau Torres|Lucas Digne|Youri Tielemans|Boubacar Kamara|John McGinn|Morgan Rogers|Ollie Watkins|Leon Bailey", "ll_rma": "Thibaut Courtois|Trent Alexander-Arnold|Antonio Rüdiger|Éder Militão|Ferland Mendy|Aurélien Tchouaméni|Federico Valverde|Jude Bellingham|Vinícius Júnior|Kylian Mbappé|Rodrygo", "ll_bar": "Wojciech Szczęsny|Jules Koundé|Pau Cubarsí|Ronald Araújo|Alejandro Balde|Pedri|Frenkie de Jong|Gavi|Lamine Yamal|Robert Lewandowski|Raphinha", "ll_atm": "Jan Oblak|Nahuel Molina|José María Giménez|Robin Le Normand|Marcos Llorente|Koke|Rodrigo De Paul|Pablo Barrios|Antoine Griezmann|Julián Álvarez|Alexander Sørloth", "ll_sev": "Ørjan Nyland|Juanlu Sánchez|Loïc Badé|Kike Salas|Adrià Pedrosa|Nemanja Gudelj|Lucien Agoumé|Djibril Sow|Isaac Romero|Alexis Sánchez|Dodi Lukébakio", "fx_6": "Álex Remiro|Aritz Elustondo|Igor Zubeldia|Jon Aramburu|Aihen Muñoz|Brais Méndez|Luka Sučić|Takefusa Kubo|Mikel Oyarzabal|Sheraldo Becker|Ander Barrenetxea", "fx_11": "Luiz Júnior|Logan Costa|Rafa Marín|Alfonso Pedraza|Juan Foyth|Dani Parejo|Santi Comesaña|Alberto Moleiro|Ayoze Pérez|Georges Mikautadze|Nicolas Pépé", "fx_16": "Álvaro Valles|Héctor Bellerín|Marc Bartra|Natan|Junior Firpo|Isco|Giovani Lo Celso|Pablo Fornals|Antony|Abde Ezzalzouli|Cucho Hernández", "fx_21": "Unai Simón|Óscar de Marcos|Dani Vivian|Aymeric Laporte|Yuri Berchiche|Mikel Vesga|Beñat Prados|Iñaki Williams|Nico Williams|Gorka Guruzeta|Oihan Sancet", "bl_bay": "Manuel Neuer|Josip Stanišić|Dayot Upamecano|Jonathan Tah|Alphonso Davies|Joshua Kimmich|Leon Goretzka|Michael Olise|Harry Kane|Luis Díaz|Serge Gnabry", "bl_bvb": "Gregor Kobel|Julian Ryerson|Waldemar Anton|Nico Schlotterbeck|Daniel Svensson|Emre Can|Felix Nmecha|Julian Brandt|Karim Adeyemi|Serhou Guirassy|Maximilian Beier", "bl_lev": "Mark Flekken|Jeanuël Belocian|Jarell Quansah|Piero Hincapié|Alejandro Grimaldo|Granit Xhaka|Exequiel Palacios|Aleix García|Patrik Schick|Nathan Tella|Malik Tillman", "fx_2": "Kevin Trapp|Rasmus Kristensen|Robin Koch|Arthur Theate|Nathaniel Brown|Ellyes Skhiri|Hugo Larsson|Mario Götze|Jonathan Burkardt|Ansgar Knauff|Can Uzun", "fx_17": "Alexander Nübel|Josha Vagnoman|Jeff Chabot|Finn Jeltsch|Maximilian Mittelstädt|Angelo Stiller|Atakan Karazor|Chris Führich|Ermedin Demirović|Deniz Undav|Jamie Leweling", "sa_int": "Yann Sommer|Denzel Dumfries|Alessandro Bastoni|Francesco Acerbi|Federico Dimarco|Nicolò Barella|Hakan Çalhanoğlu|Henrikh Mkhitaryan|Lautaro Martínez|Marcus Thuram|Piotr Zieliński", "sa_mil": "Mike Maignan|Davide Calabria|Fikayo Tomori|Matteo Gabbia|Pervis Estupiñán|Luka Modrić|Adrien Rabiot|Youssouf Fofana|Christian Pulisic|Rafael Leão|Santiago Giménez", "sa_juv": "Michele Di Gregorio|Pierre Kalulu|Gleison Bremer|Federico Gatti|Andrea Cambiaso|Manuel Locatelli|Khéphren Thuram|Teun Koopmeiners|Kenan Yıldız|Dušan Vlahović|Jonathan David", "sa_nap": "Alex Meret|Giovanni Di Lorenzo|Alessandro Buongiorno|Amir Rrahmani|Mathías Olivera|Stanislav Lobotka|Scott McTominay|Kevin De Bruyne|Romelu Lukaku|Rasmus Højlund|David Neres", "fx_3": "Mile Svilar|Zeki Çelik|Gianluca Mancini|Evan Ndicka|Angeliño|Bryan Cristante|Lorenzo Pellegrini|Paulo Dybala|Artem Dovbyk|Matías Soulé|Stephan El Shaarawy", "fx_8": "Ivan Provedel|Nuno Tavares|Alessio Romagnoli|Mario Gila|Adam Marušić|Matías Vecino|Nicolò Rovella|Mattia Zaccagni|Boulaye Dia|Pedro|Gustav Isaksen", "fx_13": "Marco Carnesecchi|Berat Djimsiti|Isak Hien|Sead Kolašinac|Raoul Bellanova|Marten de Roon|Éderson|Charles De Ketelaere|Ademola Lookman|Gianluca Scamacca|Mario Pašalić", "l1_psg": "Lucas Chevalier|Achraf Hakimi|Marquinhos|Willian Pacho|Nuno Mendes|Vitinha|João Neves|Fabián Ruiz|Ousmane Dembélé|Bradley Barcola|Désiré Doué", "l1_om": "Gerónimo Rulli|Jonathan Clauss|Leonardo Balerdi|CJ Egan-Riley|Quentin Merlin|Pierre-Emile Højbjerg|Geoffrey Kondogbia|Matteo Guendouzi|Mason Greenwood|Amine Gouiri|Pierre-Emerick Aubameyang", "l1_mon": "Philipp Köhn|Vanderson|Thilo Kehrer|Mohammed Salisu|Caio Henrique|Denis Zakaria|Lamine Camara|Maghnes Akliouche|Folarin Balogun|Takumi Minamino|Eliesse Ben Seghir", "l1_lil": "Berke Özer|Thomas Meunier|Aïssa Mandi|Nathan Ngoy|Ismaily|Benjamin André|Ayyoub Bouaddi|Hákon Haraldsson|Olivier Giroud|Matías Fernández-Pardo|Félix Correia", "fx_4": "Lucas Perri|Ainsley Maitland-Niles|Moussa Niakhaté|Clinton Mata|Nicolás Tagliafico|Corentin Tolisso|Tanner Tessmann|Rayan Cherki|Alexandre Lacazette|Ernest Nuamah|Malick Fofana", "fiction_tier_8": "Remko Pasveer|Devyne Rensch|Josip Šutalo|Jorrel Hato|Owen Wijndal|Jordan Henderson|Kenneth Taylor|Davy Klaassen|Brian Brobbey|Mika Godts|Steven Berghuis", "fiction_tier_9": "Anatolii Trubin|Alexander Bah|Nicolás Otamendi|António Silva|Samuel Dahl|Florentino Luís|Orkun Kökçü|Fredrik Aursnes|Ángel Di María|Vangelis Pavlidis|Kerem Aktürkoğlu", "fiction_tier_10": "Diogo Costa|Alberto Costa|Jakub Kiwior|Nehuén Pérez|Martim Fernandes|Alan Varela|Victor Froholdt|Gabri Veiga|Samu Aghehowa|William Gomes|Pepê", "fiction_tier_11": "Rui Silva|Geovany Quenda|Gonçalo Inácio|Ousmane Diomande|Maxi Araújo|Morten Hjulmand|Pedro Gonçalves|Daniel Bragança|Conrad Harder|Francisco Trincão|Geny Catamo", "fiction_tier_12": "Matej Kovář|Jordan Teze|Ryan Flamingo|Armel Bella-Kotchap|Mauro Júnior|Jerdy Schouten|Ismael Saibari|Malik Tillman|Luuk de Jong|Johan Bakayoko|Couhaib Driouech", "fiction_tier_13": "Kasper Schmeichel|Alistair Johnston|Cameron Carter-Vickers|Liam Scales|Greg Taylor|Callum McGregor|Reo Hatate|Arne Engels|Kyogo Furuhashi|Daizen Maeda|Nicolas Kühn", "fiction_tier_15": "Ederson|Nélson Semedo|Milan Škriniar|Çağlar Söyüncü|Jayden Oosterwolde|İsmail Yüksek|Fred|Sofyan Amrabat|İrfan Can Kahveci|Dušan Tadić|Youssef En-Nesyri", "fiction_tier_16": "Uğurcan Çakır|Wilfried Singo|Davinson Sánchez|Abdülkerim Bardakcı|Ismail Jakobs|Lucas Torreira|Gabriel Sara|Mario Lemina|Victor Osimhen|Leroy Sané|Barış Alper Yılmaz", "fiction_tier_17": "Leandro Brey|Luis Advíncula|Nicolás Figal|Lautaro Blanco|Marcos Rojo|Ander Herrera|Rodrigo Battaglia|Milton Giménez|Miguel Merentiel|Edinson Cavani|Exequiel Zeballos", "fiction_tier_18": "Franco Armani|Gonzalo Montiel|Lucas Martínez Quarta|Germán Pezzella|Marcos Acuña|Enzo Pérez|Nicolás Fonseca|Franco Mastantuono|Facundo Colidio|Maximiliano Salas|Sebastián Driussi", "fiction_tier_19": "Agustín Rossi|Guillermo Varela|Léo Pereira|Léo Ortiz|Alex Sandro|Erick Pulgar|Jorginho|Giorgian de Arrascaeta|Bruno Henrique|Pedro|Luiz Araújo"};
function nameFor(team, role, k) {
  const RX = REAL_XI[team.id] || REAL_XI[team.code];
  if (RX) { const a = RX.split('|'), g = role === 'gk' ? [0] : role === 'df' ? [1, 2, 3, 4] : role === 'mf' ? [5, 6, 7] : [8, 9, 10]; return a[g[(k | 0) % g.length]] || a[0]; }
  const P = NPOOL[poolOf(team)] || NPOOL.mix, h = hash32(team.code + '|' + team.name0), idx = ['gk', 'df', 'mf', 'fw'].indexOf(role) * 6 + (k | 0);
  return P[0][(h + idx * 7) % P[0].length] + ' ' + P[1][((h >>> 9) + idx * 11 + (idx >> 2)) % P[1].length];
}
function assignNames() {
  const cnt = [{}, {}], nums = { gk: [1], df: [2, 3, 4, 5, 15], mf: [6, 8, 10, 14, 16], fw: [9, 11, 7] };
  cows.forEach(c => {
    const k = cnt[c.team][c.role] = cnt[c.team][c.role] === undefined ? 0 : cnt[c.team][c.role] + 1;
    c.pname = nameFor(c.tdef, c.role, k);
    const fallback = (nums[c.role] || [])[k] || 20 + k;
    c.num = window.CowballRostersV47 && typeof window.CowballRostersV47.numberFor === 'function'
      ? window.CowballRostersV47.numberFor(c.pname, fallback, c.tdef && c.tdef.id, c.tdef && c.tdef.code) : fallback;
  });
}
let pNameLast = '';
function updatePName() {
  const vOn = effParts() > 0; if (vOn !== vigOn) { vigOn = vOn; $('vig').style.display = vOn ? '' : 'none'; }
  const el = $('pName'), p = players[0], c = p && p.cow, txt = (c && c.pname && (state === 'play' || state === 'goal')) ? '#' + c.num + ' ' + c.pname : '';
  if (txt !== pNameLast) { pNameLast = txt; el.textContent = txt; el.classList.toggle('hide', !txt); }
}
// ===== Экран тактики перед матчем =====
function startMatch(cfg) { if (cfg && cfg.noTactics) startMatchNow(cfg); else showTactics(cfg || {}); }
const STY = { att: ['⚔️', 'Атака', 'Линии выше, больше игроков впереди'], bal: ['⚖️', 'Баланс', 'Равновесие обороны и атаки'], def: ['🛡️', 'Оборона', 'Глубокая оборона, опасные контратаки'] };
const KO_TABS = ['Превью матча', 'Команда', 'Настройки игры', 'Управление', 'Статистика'], KIT_NAMES = ['Домашняя', 'Гостевая', 'Запасная'];
const STAD_COL = { classic: 0x2c3a66, arena: 0x34476e, dome: 0x4a5170, coastal: 0x1d6a82, neon: 0x3b2a78, royal: 0x4a2d62, desert: 0x8a5a3c, winter: 0x5a7690 };
function kitVariant(team, k) {   // 0 домашняя, 1 гостевая (цвета наоборот и другой рисунок), 2 запасная (светлая/тёмная)
  if (!k) return team;
  const lum = ((team.c1 >> 16) & 255) * 0.3 + ((team.c1 >> 8) & 255) * 0.59 + (team.c1 & 255) * 0.11;
  return Object.assign({}, team, { id: team.id + '~v' + k, c1: k === 1 ? team.c2 : (lum > 140 ? 0x1a1f2b : 0xffffff), c2: k === 1 ? team.c1 : team.c1, pat: k === 1 ? ((team.pat | 0) + 2) % 5 : 0 });
}
const koTime = v => Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
const koItem = k => { if (k === 'time') return { label: 'Длительность матча', opts: [90, 120, 180, 300, 480, 600].map(v => [v, koTime(v)]) }; for (const t of SET_TABS) { const it = t.items.find(x => x.k === k && x.opts); if (it) return it; } return null; };
const koLabel = k => { const it = koItem(k), o = it && it.opts.find(x => x[0] === settings[k]); return o ? o[1] : (k === 'time' ? koTime(settings.time) : String(settings[k])); };
const koRat = t => ({ att: Math.min(99, 52 + t.pow * 8 + t.spd * 2), mid: Math.min(99, 52 + t.spd * 6 + t.pow * 3 + t.def * 3), def: Math.min(99, 52 + t.def * 8 + t.spd * 2) });
const koStars = t => { const o = Math.max(1, Math.min(5, Math.round((t.spd + t.pow + t.def) / 3))); return '★'.repeat(o) + '☆'.repeat(5 - o); };
function showTactics(cfg) {
  const old = document.getElementById('tacOv'); if (old) old.remove();
  const c = Object.assign({}, matchCfg, cfg); let tab = 0, an = true;
  const forms = () => c.size === 11 ? FORMS11 : c.size === 5 ? FORMS5 : null;
  const initForm = () => { const f = forms(); const requested = c.utManaged && f && f[c.form] ? c.form : settings.formation; c.form = f && f[requested] ? requested : (f ? Object.keys(f)[0] : ''); };
  initForm(); c.style = settings.style || 'bal'; c.kitA = c.kitA | 0;
  const ov = document.createElement('div'); ov.id = 'tacOv'; document.body.appendChild(ov);
  const kitHtml = (t, cls) => `<div class="kit ${cls || ''} k${t.pat | 0}" style="--tc:${hex(t.c1)};--tc2:${hex(t.c2)}"><i></i></div>`;
  const panel = (t, role, kv) => { const r = koRat(t), kt = kitVariant(t, kv); return `<div class="kot"><small class="kor">${role}</small>${kitHtml(kt, 'big')}<h3>${t.nation ? t.flag + ' ' : ''}${t.name}</h3><div class="stars">${koStars(t)}</div><div class="rat"><div><small>ATT</small><b>${r.att}</b></div><div><small>MID</small><b>${r.mid}</b></div><div><small>DEF</small><b>${r.def}</b></div></div></div>`; };
  const pitch = k => { const pts = makeForm(forms()[k], c.size === 11 ? .025 : .03); return `<svg viewBox="0 0 100 64"><rect width="100" height="64" fill="#2e8f3f"/><rect x="2" y="2" width="96" height="60" fill="none" stroke="#fff" stroke-opacity=".5"/><line x1="50" y1="2" x2="50" y2="62" stroke="#fff" stroke-opacity=".4"/>${pts.map((p, i) => `<circle cx="${(5 + p[1] * 126).toFixed(1)}" cy="${(32 + p[2] * 29).toFixed(1)}" r="3.4" fill="${i ? hex(c.tA.c1) : '#ffd43b'}" stroke="#000" stroke-opacity=".5" stroke-width=".8"/>`).join('')}</svg>`; };
  const rows = keys => keys.map(k => { const it = koItem(k); if (!it) return ''; return `<div class="korow"><span>${it.label}</span><div class="sgg">${it.opts.map((o, i) => `<button class="${o[0] === settings[k] ? 'on' : ''}" data-opt="${k}" data-i="${i}">${o[1]}</button>`).join('')}</div></div>`; }).join('');
  const h2h = () => { const k = [c.tA.id, c.tB.id].sort().join('|'), r = (settings.h2h && settings.h2h[k]) || {}; return [r[c.tA.id] | 0, r.d | 0, r[c.tB.id] | 0]; };
  const bar = (lab, a, b) => `<div class="cmp"><span>${a}</span><div><small>${lab}</small><i><u style="width:${a * 20}%;background:${hex(c.tA.c1)}"></u></i><i><u style="width:${b * 20}%;background:${hex(c.tB.c1)}"></u></i></div><span>${b}</span></div>`;
  const body = () => {
    if (tab === 0) { const w = h2h(); return `<div class="kopv">${panel(c.tA, 'ИГРОК 1', c.kitA)}<div class="kom"><button class="mi pri" data-go="1">▶ Начать матч</button>${c.comp ? '' : '<button class="mi" data-teams="1">Выбрать команды</button>'}<button class="mi" data-kit="1">Форма: ${KIT_NAMES[c.kitA]}</button>${c.comp ? '' : '<button class="mi" data-swap="1">Поменять команды</button>'}</div>${panel(c.tB, c.versus ? 'ИГРОК 2' : 'ИИ · ' + DIFF[settings.diff].n, 0)}</div><div class="koh2h"><div class="h"><small>Победы</small><b>${w[0]}</b></div><div class="h"><small>Ничьи</small><b>${w[1]}</b></div><div class="h"><small>Победы</small><b>${w[2]}</b></div></div>`; }
    if (tab === 1) { const f = forms(); return `<div class="tl">Форма</div><div class="sty">${KIT_NAMES.map((n, i) => `<button class="${i === c.kitA ? 'on' : ''}" data-kv="${i}">${kitHtml(kitVariant(c.tA, i), 'mini')}<b>${n}</b></button>`).join('')}</div>${f ? `<div class="tl">Схема игры</div><div class="fgrid">${Object.keys(f).map(k => `<button class="fb ${k === c.form ? 'on' : ''}" data-f="${k}">${pitch(k)}<span>${k}</span></button>`).join('')}</div>` : ''}<div class="tl">Стиль игры</div><div class="sty">${Object.keys(STY).map(k => `<button class="${k === c.style ? 'on' : ''}" data-s="${k}"><i>${STY[k][0]}</i><b>${STY[k][1]}</b><small>${STY[k][2]}</small></button>`).join('')}</div>`; }
    if (tab === 2) { const st = koItem('stadium'); return `${st ? `<div class="tl">Стадион</div><div class="stg">${st.opts.map((o, i) => `<button class="${o[0] === settings.stadium ? 'on' : ''}" style="--sc:${hex(STAD_COL[o[0]] || 0x2c3a66)}" data-opt="stadium" data-i="${i}">${o[1]}</button>`).join('')}</div>` : ''}<div class="tl">Матч</div>${rows(['time', 'diff', 'size', 'tod', 'weather'])}`; }
    if (tab === 3) return `<div class="tl">Управление</div>${rows(['hand', 'btn', 'opac', 'vib', 'touchUI', 'cam']) || '<div class="korow">Настройки управления доступны в главном меню.</div>'}`;
    const A = c.tA, B = c.tB, fe = t => (t.feat || '—');
    return `<div class="tl">Сравнение команд</div><div class="cmpt"><b style="color:${hex(A.c1)}">${A.name}</b><b style="color:${hex(B.c1)}">${B.name}</b></div>${bar('Скорость', A.spd, B.spd)}${bar('Сила удара', A.pow, B.pow)}${bar('Защита', A.def, B.def)}<div class="tl">Особенность</div><div class="korow"><span>${fe(A)}</span><span>${fe(B)}</span></div>`;
  };
  const typeLab = c.comp ? 'Турнир' : c.versus ? 'Против друга' : 'Быстрый матч';
  const render = () => {
    ov.innerHTML = `<div class="ko"><div class="kotop"><b class="kologo">COWBALL</b><span class="kotitle">Кик-офф</span><nav class="kotabs">${KO_TABS.map((n, i) => `<button class="${i === tab ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('')}</nav><button class="koclose" data-back="1">✕</button></div>
      <div class="kobody ${an ? 'an' : ''}">${body()}</div>
      <div class="kobar"><button data-cyc="stadium">Стадион: <b>${koLabel('stadium')}</b></button><button data-cyc="time">Длительность: <b>${koLabel('time')}</b></button><button data-cyc="diff">Сложность: <b>${koLabel('diff')}</b></button><span>Тип игры: <b>${typeLab}</b></span><button data-cyc="tod">Время: <b>${koLabel('tod')}</b></button><button data-cyc="weather">Погода: <b>${koLabel('weather')}</b></button></div></div>`;
    if (an) ov.querySelectorAll('.rat b').forEach(el => { const v = +el.textContent, t0 = performance.now(); const st = now => { const k = Math.min(1, (now - t0) / 700); el.textContent = Math.round(v * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); });   // рейтинги «набегают»
    an = false;
  };
  const setOpt = (k, i) => { const it = koItem(k); if (!it) return; settings[k] = it.opts[i][0]; save(); onSettingChanged(k); if (k === 'size') { c.size = Number(settings.size); initForm(); } };
  ov.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.tab !== undefined) { tab = +d.tab; an = true; }
    else if (d.f) c.form = d.f; else if (d.s) c.style = d.s; else if (d.kv !== undefined) c.kitA = +d.kv; else if (d.kit) c.kitA = (c.kitA + 1) % 3;
    else if (d.opt) setOpt(d.opt, +d.i);
    else if (d.cyc) { const it = koItem(d.cyc); if (it) setOpt(d.cyc, (it.opts.findIndex(o => o[0] === settings[d.cyc]) + 1) % it.opts.length); }
    else if (d.swap) { const t = c.tA; c.tA = c.tB; c.tB = t; settings.myTeam = c.tA.id; save(); }
    else if (d.teams) { ov.remove(); openTeams(c.versus ? 'versus' : 'quick'); return; }
    else if (d.back) { ov.remove(); if (c.comp) enterHub(); else goHome(); return; }
    else if (d.go) { settings.formation = c.form; settings.style = c.style; save(); ov.remove(); startMatchNow(c); return; }
    render();
  };
  render();
}
function kickoffPos(c) {
  const inside = c.team === 0 ? 1 : -1, ownX = c.team === 0 ? FX : FX + FW;
  c.x = ownX + inside * (26 + c.home[0] * 300) * fieldVisualScale; c.y = H / 2 + c.home[1] * (matchCfg.size === 11 ? 174 : 140) * fieldVisualScale;
}
function resetPositions() {
  cows.forEach(c => { kickoffPos(c); c.vx = c.vy = 0; c.cd = 0; c.wait = 0; c.freeze = 0; c.speedBoost = 0; c.milk = 0; c.milkT = 0; c.hold = 0; c.diveT = 0; c.getUp = 0; c.diveCd = 0; c.trkX = undefined; c.gkStill = 0; c.kickAnim = 0; c.ang = c.team === 0 ? 0 : Math.PI; });
  ball.x = W / 2; ball.y = H / 2; ball.h = ball.vh = 0; ball.vx = ball.vy = 0; ball.holder = null; ball.carrier = null; ball.fire = 0; ball.onTarget = 0; ball.curve = 0; ball.crossT = 0; ball.crossTeam = -1; ballStuck = 0; lastTouch = null;
  pickups.length = 0; PICK_TYPES.forEach(k => { pickupMeshes[k].visible = false; }); pickupT = 300;
  players.forEach(p => { p.stamina = 1; p.charge = 0; p.pending = null; if (p.cow) p.cow.ctrl = null; p.cow = null; });
  assignHumans();
}
function assignHumans() {
  players.forEach(p => {
    const list = cows.filter(c => c.team === p.team && c.role !== 'gk').sort((a, b) => dBall(a) - dBall(b));
    setActive(p, list[0]);
  });
}
function setActive(p, cow) { if (!cow || cow === p.cow) return; if (p.cow) p.cow.ctrl = null; p.cow = cow; cow.ctrl = p; p.charge = 0; }
function menuPositions() {
  const idx = [0, 0];
  cows.forEach(c => {
    const i = idx[c.team]++, sgn = c.team === 0 ? -1 : 1;
    c.x = W / 2 + sgn * (55 + i * 48); c.y = H / 2 + (i % 3 - 1) * 58; c.vx = c.vy = 0; c.ang = c.team === 0 ? -0.3 : Math.PI + 0.3;
  });
  ball.x = W / 2; ball.y = H / 2 + 6; ball.h = ball.vh = 0; ball.vx = ball.vy = 0; ball.holder = null; ball.carrier = null; ball.curve = 0; ball.crossT = 0; ball.crossTeam = -1;
}

// ================== Ввод: касания, клавиатура, геймпад ==================
const touch = { kick: false, pass: false, cross: false, sprint: false, sw: false, kickL: false, passL: false, crossL: false, swL: false };
const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
const keys = {}, latch = {};
const touchUIOn = () => settings.inputModeV33 === 'touch' || (settings.inputModeV33 !== 'pc' && settings.inputModeV33 !== 'gamepad' && (settings.touchUI === 'on' || (settings.touchUI === 'auto' && IS_TOUCH)));
const inGameState = () => state === 'play' || state === 'ready' || state === 'goal' || state === 'replay' || state === 'pens';
const kd = c => { const v = keys[c] || latch[c]; latch[c] = false; return !!v; };
const tl = n => { const v = touch[n] || touch[n + 'L']; touch[n + 'L'] = false; return !!v; };
const jbase = $('jbase'), jknob = $('jknob');
const TOUCH_CONTROL_IDS_V46 = ['bKick','bPass','bSprint','bSwitch','bCross'];
let controlsEditorV46 = null, controlsDragV46 = null;
function sanitizeTouchControlLayoutV46() {
  const raw = settings.controlsLayoutV46;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { settings.controlsLayoutV46 = null; return; }
  const clean = {};
  TOUCH_CONTROL_IDS_V46.forEach(id => {
    const p = raw[id];
    if (!p || !Number.isFinite(Number(p.x)) || !Number.isFinite(Number(p.y))) return;
    clean[id] = { x:clamp(Number(p.x),5,95), y:clamp(Number(p.y),12,88) };
  });
  settings.controlsLayoutV46 = Object.keys(clean).length ? clean : null;
}
sanitizeTouchControlLayoutV46();
function touchControlPointV46(id) {
  const p = settings.controlsLayoutV46 && settings.controlsLayoutV46[id];
  if (p) return p;
  const scale=settings.btn/100, margin=18;
  const centers={
    bKick:[innerWidth-margin-58*scale,innerHeight-14-58*scale],
    bPass:[innerWidth-margin-172*scale,innerHeight-14-48*scale],
    bSprint:[innerWidth-margin-52*scale,innerHeight-14-170*scale],
    bSwitch:[innerWidth-margin-144*scale,innerHeight-14-150*scale],
    bCross:[innerWidth-margin-241*scale,innerHeight-14-148*scale]
  };
  const [cx,cy]=centers[id]||[innerWidth-margin-58*scale,innerHeight-14-58*scale];
  return {x:clamp((settings.hand==='left'?innerWidth-cx:cx)/Math.max(1,innerWidth)*100,5,95),y:clamp(cy/Math.max(1,innerHeight)*100,12,88)};
}
function applyTouchControlPositionsV46() {
  const group=$('tbtns');
  if(group)group.classList.toggle('custom-layout',!!(settings.controlsLayoutV46&&Object.keys(settings.controlsLayoutV46).length)||document.documentElement.classList.contains('controls-editor-open'));
  TOUCH_CONTROL_IDS_V46.forEach(id => {
    const el = $(id); if (!el) return;
    const p = touchControlPointV46(id);
    el.style.setProperty('--cx', Number(p.x).toFixed(2));
    el.style.setProperty('--cy', Number(p.y).toFixed(2));
  });
}
function openTouchControlEditorV46() {
  if (controlsEditorV46) return;
  if (!settings.controlsLayoutV46) settings.controlsLayoutV46 = {};
  const root = document.createElement('div');
  root.id = 'controlsEditorV46';
  root.innerHTML = '<div class="controlsEditorBarV46"><div><b>Настройка экранных кнопок</b><small>Перетащи кнопки в удобные места. Размер меняется в настройках управления.</small></div><button class="mi" data-a="controlsLayoutResetV46">Сбросить</button><button class="mi pri" data-a="controlsLayoutCloseV46">Готово</button></div>';
  document.body.appendChild(root);
  controlsEditorV46 = { root, handlers:[] };
  document.documentElement.classList.add('controls-editor-open');
  const group = $('tbtns');
  group.classList.remove('hide');
  group.classList.add('layout-edit');
  TOUCH_CONTROL_IDS_V46.forEach(id => { const el=$(id); if(el) el.style.display=''; });
  applyTouchControlPositionsV46();
  const onDown = (el, e) => {
    if (!controlsEditorV46 || e.button > 0) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const r=el.getBoundingClientRect();
    controlsDragV46={id:el.id,pointerId:e.pointerId,dx:e.clientX-(r.left+r.width/2),dy:e.clientY-(r.top+r.height/2)};
    try{el.setPointerCapture(e.pointerId);}catch(_){}
  };
  const onMove = e => {
    if(!controlsDragV46||e.pointerId!==controlsDragV46.pointerId)return;
    e.preventDefault();
    const id=controlsDragV46.id;
    settings.controlsLayoutV46[id]={
      x:clamp((e.clientX-controlsDragV46.dx)/Math.max(1,innerWidth)*100,5,95),
      y:clamp((e.clientY-controlsDragV46.dy)/Math.max(1,innerHeight)*100,12,88)
    };
    applyTouchControlPositionsV46();
  };
  const onUp = e => {
    if(!controlsDragV46||e.pointerId!==controlsDragV46.pointerId)return;
    controlsDragV46=null; save();
  };
  TOUCH_CONTROL_IDS_V46.forEach(id=>{
    const el=$(id); if(!el)return;
    const fn=e=>onDown(el,e);
    el.addEventListener('pointerdown',fn,true);
    controlsEditorV46.handlers.push(()=>el.removeEventListener('pointerdown',fn,true));
  });
  window.addEventListener('pointermove',onMove,true); window.addEventListener('pointerup',onUp,true); window.addEventListener('pointercancel',onUp,true);
  controlsEditorV46.handlers.push(()=>window.removeEventListener('pointermove',onMove,true),()=>window.removeEventListener('pointerup',onUp,true),()=>window.removeEventListener('pointercancel',onUp,true));
}
function closeTouchControlEditorV46() {
  if (!controlsEditorV46) return;
  controlsEditorV46.handlers.forEach(fn=>fn()); controlsEditorV46.root.remove();
  controlsEditorV46=null; controlsDragV46=null;
  document.documentElement.classList.remove('controls-editor-open');
  $('tbtns').classList.remove('layout-edit'); $('tbtns').classList.add('hide'); applyTouchControlPositionsV46();
  if(typeof v21SetControlVisibility==='function')v21SetControlVisibility();
}
function resetInputs() {
  joy.id = null; joy.dx = joy.dy = 0; jbase.style.display = 'none';
  touch.kick = touch.pass = touch.cross = touch.sprint = touch.sw = touch.kickL = touch.passL = touch.crossL = touch.swL = false;
  players.forEach(p => { p.passBuffer = 0; p.pPrev = false; p.crossBuffer = 0; p.crossPrev = false; });
  ['bKick', 'bPass', 'bSprint', 'bSwitch', 'bCross'].forEach(id => $(id).classList.remove('on', 'ready'));
}
function applyControlsLayout() {
  $('tbtns').classList.toggle('left', settings.hand === 'left');
  document.documentElement.style.setProperty('--bs', settings.btn / 100);
  document.documentElement.style.setProperty('--op', settings.opac / 100);
  applyTouchControlPositionsV46();
}
function bindBtn(id, name) {
  const el = $(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) {} Audio_.init(); touch[name] = true; if (name !== 'sprint') touch[name + 'L'] = true; el.classList.add('on'); });
  const up = e => { touch[name] = false; el.classList.remove('on'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
function bindInput() {
  bindBtn('bKick', 'kick'); bindBtn('bPass', 'pass'); bindBtn('bSprint', 'sprint'); bindBtn('bSwitch', 'sw'); bindBtn('bCross', 'cross');
  window.addEventListener('pointerdown', e => {
    if (!inGameState() || !touchUIOn()) return;
    if (e.target.closest && e.target.closest('[data-a],.tbtn')) return;
    e.preventDefault(); Audio_.init();
    const mine = settings.hand === 'right' ? e.clientX < window.innerWidth * 0.55 : e.clientX > window.innerWidth * 0.45;
    if (joy.id === null && mine) {
      joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
      jbase.style.display = 'block'; jbase.style.left = joy.ox + 'px'; jbase.style.top = joy.oy + 'px'; jknob.style.transform = 'translate(0,0)';
    }
  }, { passive: false });
  window.addEventListener('pointermove', e => {
    if (e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), R = 56;
    if (m > R) { joy.ox += dx / m * (m - R); joy.oy += dy / m * (m - R); dx = dx / m * R; dy = dy / m * R; jbase.style.left = joy.ox + 'px'; jbase.style.top = joy.oy + 'px'; }
    joy.dx = clamp(dx / R * (settings.sensitivity / 100), -1, 1); joy.dy = clamp(dy / R * (settings.sensitivity / 100), -1, 1); jknob.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const rel = e => { if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; jbase.style.display = 'none'; } };
  window.addEventListener('pointerup', rel); window.addEventListener('pointercancel', rel);
  window.addEventListener('keydown', e => {
    keys[e.code] = true; latch[e.code] = true; Audio_.init();
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat && ((state === 'ready' && introFull) || state === 'outro')) ACT.skipintro();
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { if (state === 'paused') resumeGame(); else pauseGame(); }
    if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());
}
const padGet = i => { try { const g = navigator.getGamepads ? navigator.getGamepads() : null; return g && g[i] ? g[i] : null; } catch (e) { return null; } };
function gather(p) {
  const o = { x: 0, y: 0, kick: false, pass: false, cross: false, sprint: false, sw: false }, single = !matchCfg.versus;
  if (p.id === 1) {
    o.x += joy.dx; o.y += joy.dy; o.kick = tl('kick'); o.pass = tl('pass'); o.cross = tl('cross'); o.sprint = touch.sprint; o.sw = tl('sw');
    const useArrowsV33 = single && settings.keyboardLayoutV33 === 'arrows';
    if ((useArrowsV33 ? kd('ArrowLeft') : kd('KeyA')) || (!useArrowsV33 && single && kd('ArrowLeft'))) o.x -= 1; if ((useArrowsV33 ? kd('ArrowRight') : kd('KeyD')) || (!useArrowsV33 && single && kd('ArrowRight'))) o.x += 1;
    if ((useArrowsV33 ? kd('ArrowUp') : kd('KeyW')) || (!useArrowsV33 && single && kd('ArrowUp'))) o.y -= 1; if ((useArrowsV33 ? kd('ArrowDown') : kd('KeyS')) || (!useArrowsV33 && single && kd('ArrowDown'))) o.y += 1;
    if (kd('Space') || (useArrowsV33 && kd('Enter'))) o.kick = true; if (kd('KeyE') || kd('KeyF')) o.pass = true; if (kd('KeyR')) o.cross = true; if (keys.ShiftLeft || (single && keys.ShiftRight)) o.sprint = true; if (kd('KeyQ')) o.sw = true;
  } else {
    if (kd('ArrowLeft')) o.x -= 1; if (kd('ArrowRight')) o.x += 1; if (kd('ArrowUp')) o.y -= 1; if (kd('ArrowDown')) o.y += 1;
    if (kd('Enter')) o.kick = true; if (kd('Period')) o.pass = true; if (kd('KeyM')) o.cross = true; if (keys.ShiftRight) o.sprint = true; if (kd('Comma')) o.sw = true;
  }
  const gp = padGet(p.id === 1 ? 0 : (padGet(1) ? 1 : -1));
  if (gp) {
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.abs(ax) > 0.18) o.x += ax; if (Math.abs(ay) > 0.18) o.y += ay;
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const bindsV33 = settings.padBindsV33 || DEF.padBindsV33;
    if (b(Number(bindsV33.kick))) o.kick = true; if (b(Number(bindsV33.pass))) o.pass = true; if (b(Number(bindsV33.cross))) o.cross = true; if (b(Number(bindsV33.sprint))) o.sprint = true; if (b(Number(bindsV33.sw))) o.sw = true;
  }
  const m = Math.hypot(o.x, o.y); if (m <= (settings.deadZone || 0) / 100) { o.x = o.y = 0; } else if (m > 1) { o.x /= m; o.y /= m; }
  return o;
}
let padStartPrev = false;
function pollPadPause() {
  const gp = padGet(0) || padGet(1), bind = settings.padBindsV33 ? Number(settings.padBindsV33.pause) : 9, v = !!(gp && gp.buttons[bind] && gp.buttons[bind].pressed);
  if (v && !padStartPrev && (['play','ready','goal','replay','pens','outro'].includes(state) || state === 'paused')) { if (state === 'paused') resumeGame(); else pauseGame(); }
  padStartPrev = v;
}

// ================== Управление человеком ==================
function handleSwitch(p, inp, dt) {
  p.swCd -= dt;
  const list = cows.filter(c => c.team === p.team && c.role !== 'gk').sort((a, b) => dBall(a) - dBall(b));
  // Manual switch always works. Auto-switch is deliberately conservative: only when
  // the ball actually arrives near a teammate, never merely because someone is closer.
  if (inp.sw && !p.swPrev && p.swCd <= 0) {
    const t = list.find(c => c !== p.cow); if (t) setActive(p, t); p.swCd = 12;
  } else if (settings.autoSwitch && p.swCd <= 0 && p.charge < 0.05 && !ball.holder && list[0] && list[0] !== p.cow) {
    const candidate = list[0], d = dBall(candidate), currentD = p.cow ? dBall(p.cow) : Infinity;
    const ballNearCandidate = d < CR + BR + 15;
    const ballTravellingToCandidate = Math.hypot(ball.vx, ball.vy) > 2 && d < 48 && currentD > d + 18;
    if ((ballNearCandidate || ballTravellingToCandidate) && currentD > d + 22) { setActive(p, candidate); p.swCd = 10; }
  }
  p.swPrev = inp.sw;
}
function kickDir(c, ix, iy) {
  const goalX = c.team === 0 ? FX + FW : FX;
  const [gx, gy] = norm(goalX - ball.x, H / 2 - ball.y);
  const m = Math.hypot(ix, iy);
  // Without a directional input, shoot toward the opponent's goal, not toward the ball's current offset.
  if (m <= 0.35) return [gx, gy];
  let [bx, by] = norm(ball.x - c.x, ball.y - c.y);
  let [dx, dy] = norm(ix / m * 0.82 + bx * 0.18, iy / m * 0.82 + by * 0.18);
  if (settings.assist && dx * gx + dy * gy > -0.15) {
    [dx, dy] = norm(dx * 0.62 + gx * 0.38, dy * 0.62 + gy * 0.38);
  }
  return [dx, dy];
}
function humanControl(p, c, dt) {
  const inp = gather(p); p.input = inp; handleSwitch(p, inp, dt);
  if (p.cow !== c) return { ix: 0, iy: 0, speed: 0 };
  // Короткое буферное окно не теряет быстрый тап, если мяч ещё катится к игроку.
  if (inp.pass && !p.pPrev) p.passBuffer = 20;
  else p.passBuffer = Math.max(0, (p.passBuffer || 0) - dt);
  if (inp.cross && !p.crossPrev && settings.crossEnabled) p.crossBuffer = 20;
  else p.crossBuffer = Math.max(0, (p.crossBuffer || 0) - dt);
  const mag = Math.hypot(inp.x, inp.y), spr = inp.sprint && p.stamina > 0.04 && mag > 0.2;
  // Мягкий контроль мяча: при беге рядом с мячом он следует перед коровой.
  // Ведение разрешено только когда мяч находится впереди по направлению движения.
  // Если мяч позади коровы, не телепортируем его к ногам — даём ему свободно катиться.
  const ballDX = ball.x - c.x, ballDY = ball.y - c.y;
  const ballAhead = mag > 0.16 && (ballDX * (inp.x / mag) + ballDY * (inp.y / mag)) > 1.5;
  // Захват мяча не зависит от того, смотрит ли корова точно на него.
  // Это позволяет резко менять направление и разворачиваться на 360° без потери ведения.
  const closeToBall = dBall(c) < CR + BR + 23;
  if (!inp.kick && c.cd <= 0 && mag > 0.16 && !ball.holder && !((ball.h || 0) > 0.9) && closeToBall) {
    if (ball.carrier !== c && lastTouch && lastTouch.team === c.team && lastTouch !== c) SFX.receive(sPan(ball.x));
    ball.carrier = c; ball.vx = c.vx; ball.vy = c.vy; lastTouch = c;
  } else if (ball.carrier === c && (inp.kick || mag <= 0.16 || dBall(c) > CR + BR + 48)) {
    ball.carrier = null;
  }
  if (spr) p.stamina = Math.max(0, p.stamina - dt / 60 / 2.2); else p.stamina = Math.min(1, p.stamina + dt / 60 / (mag < 0.2 ? 2.8 : 4.5));
  let speed = 2.3 * (0.92 + 0.045 * c.tdef.spd) * (spr ? 1.35 : 1) * (c.speedBoost > 0 ? 1.35 : 1);
  if (inp.kick) p.charge = Math.min(1, p.charge + dt / 50);
  if (p.kPrev && !inp.kick && p.lobHold) { p.lobHold = false; p.charge = 0; }
  else if (p.kPrev && !inp.kick) {
    const near = dBall(c) < CR + BR + 18 && !ball.holder;
    if (near) {
      const [dx, dy] = kickDir(c, inp.x, inp.y);
      const power = lerp(6.8, 17.0, Math.max(0.06, p.charge)) * (0.92 + 0.04 * c.tdef.pow);
      const lift = window.CowballPhysicsV47 && typeof window.CowballPhysicsV47.shotLift === 'function'
        ? window.CowballPhysicsV47.shotLift(p.charge) : 0;
      kickBall(c, dx, dy, power, 'shot', lift);
    }
    else { c.cd = 8; c.kickAnim = 0.6; c.kickKind = 'touch'; c.kickLeg = legSide(c); }
    p.charge = 0;
  }
  if (p.crossBuffer > 0 && settings.crossEnabled && canPassFrom(c)) {
    doPass(c, inp.x, inp.y, false, true);
    p.crossBuffer = 0; p.passBuffer = 0;
  } else if (p.passBuffer > 0 && canPassFrom(c)) {
    // Пас доступен и стоя на месте; если мяч чуть не дошёл, тап ждёт до 20 кадров.
    const lob = inp.kick && p.charge > 0.04; doPass(c, inp.x, inp.y, lob); if (lob) { p.lobHold = true; p.charge = 0; }
    p.passBuffer = 0;
  }
  p.kPrev = inp.kick; p.pPrev = inp.pass; p.crossPrev = inp.cross;
  return { ix: inp.x, iy: inp.y, speed };
}

// ================== Удары, передачи, статистика ==================
function classifyShot(team) {
  const sp = Math.hypot(ball.vx, ball.vy); if (sp < 7.5) return 0;
  const goalX = team === 0 ? FX + FW : FX, dirx = goalX > ball.x ? 1 : -1, vg = ball.vx * dirx;
  if (vg < sp * 0.35) return 0;
  const dist = Math.abs(goalX - ball.x); if (dist > 360) return 0;
  const t = dist / vg; if (t > 60) return 0;
  const off = Math.abs(ball.y + ball.vy * t * 0.8 - H / 2);
  return off < GH / 2 + 4 ? 2 : off < GH / 2 + 90 ? 1 : 0;
}
let sayT = 0, sayTO = 0;
function say(key, force) {
  if (!settings.comment || (!force && clock < sayT)) return; const arr = LINES[key]; if (!arr) return;
  const el = $('commentary'); el.textContent = pick(arr); el.classList.add('on'); sayT = clock + 150;
  clearTimeout(sayTO); sayTO = setTimeout(() => el.classList.remove('on'), 2700);
}
function legSide(c) { return (wx(ball.x) - wx(c.x)) * Math.sin(c.ang) + (wz(ball.y) - wz(c.y)) * Math.cos(c.ang) > 0 ? 0 : 1; }
function kickBall(c, dx, dy, power, kind, lift) {
  if (c && c.utCard) {
    const stat = kind === 'pass' ? c.utCard.pas : c.utCard.sho;
    power *= 0.82 + clamp((stat || 65) / 100, 0, 1) * 0.36;
  }
  ball.curve = 0; ball.crossT = 0; ball.crossTeam = -1;
  ball.carrier = null;
  if (ball.holder) { ball.holder.hold = 0; ball.holder = null; }
  if (c.milk > 0) { power *= 1.5; c.milk = 0; c.milkT = 0; ball.fire = 160; }
  { const bx = ball.x - c.x, by = ball.y - c.y, q = (dx * bx + dy * by) / (Math.hypot(bx, by) || 1); if (q < 0 && kind !== 'pass') power *= 0.85 + 0.15 * (1 + q); }   // бить «назад» слабее
  ball.vx = dx * power + c.vx * 0.4; ball.vy = dy * power + c.vy * 0.4;
  ball.vh = lift || 0; if (lift) ball.h = Math.max(ball.h || 0, 0.03);
  const sp = Math.hypot(ball.vx, ball.vy); if (sp > 19) { ball.vx *= 19 / sp; ball.vy *= 19 / sp; }
  c.cd = 16; c.kickAnim = 1; c.kickKind = kind === 'pass' ? 'pass' : (power >= 13 ? 'shot' : 'kick'); c.kickLeg = legSide(c); lastTouch = c; ball.onTarget = 0;
  if (kind === 'pass') SFX.pass(Math.min(1, power / 16), sPan(ball.x));
  else if (kind === 'shot' || power >= 13) SFX.shot(Math.min(1, power / 17), sPan(ball.x));
  else SFX.kick(Math.min(1, power / 16), sPan(ball.x));
  kickFx(c, power);
  if (kind === 'pass') {   // кому адресован пас (по направлению)
    let bm = null, bs = 0.88;
    cows.forEach(m => { if (m === c || m.team !== c.team || m.role === 'gk') return; const mx = m.x - c.x, my = m.y - c.y, d = Math.hypot(mx, my); if (d < 40 || d > 650) return; const q = (mx * dx + my * dy) / d; if (q > bs) { bs = q; bm = m; } });
    ball.recv = bm; ball.recvT = bm ? 90 : 0;
  }
  if (c.ctrl || Math.random() < 0.18) SFX.creature(c.tdef.kind, false, sPan(c.x));
  if (kind === 'shot') {
    const r = classifyShot(c.team);
    if (r > 0) { stats.shots[c.team]++; if (r === 2) { stats.on[c.team]++; ball.onTarget = 130; ball.shotSide = c.team; } }
  }
}
const passPowerCache = new Map();
function passPower(dist) {   // начальная скорость, чтобы мяч с нашим трением докатился до цели со скоростью ~3
  const key = Math.round(dist / 8) * 8;
  if (passPowerCache.has(key)) return passPowerCache.get(key);
  for (let v = 6.5; v <= 14; v += 0.25) { let s = v, t = 0; while (s > 3.2) { t += s; s = s * (1 - 0.004 - 0.0006 * s) - 0.01; } if (t >= key) { passPowerCache.set(key, v); return v; } }
  passPowerCache.set(key, 14); return 14;
}
function launchCross(c, dx, dy, dist, ax, ay) {
  const high = settings.crossHigh && (!settings.crossLow || dist >= 190);
  const lift = high ? clamp(0.14 + dist * 0.00018, 0.14, 0.22)
    : settings.crossLow ? clamp(0.06 + dist * 0.00012, 0.075, 0.12)
    : clamp(0.10 + dist * 0.00016, 0.10, 0.16);
  const airtime = 2 * lift / 0.0105;
  const power = settings.crossPower ? clamp(dist * 0.92 / airtime, 5, 18) : clamp(10 + dist * 0.012, 8, 15);
  kickBall(c, dx, dy, power, 'pass', lift);
  ball.crossT = clamp(airtime, 8, 44); ball.crossTeam = c.team;
  if (settings.crossCurve) ball.curve = clamp(-(ay || 0) * 0.045 + (ax || 0) * (c.team === 0 ? 0.014 : -0.014), -0.055, 0.055);
  SFX.cross(sPan(ball.x));
}
function doPass(c, ax, ay, lobReq, isCross) {
  if (!c) return null;
  const distance = dBall(c);
  const ownsBall = canPassFrom(c);
  if (!ownsBall || (ball.holder && ball.holder !== c)) return null;

  // If the ball is being dribbled, release it from just in front of the player.
  let ix = ax, iy = ay, mag = Math.hypot(ix, iy);
  if (mag < 0.2) { ix = Math.cos(c.ang); iy = -Math.sin(c.ang); mag = Math.hypot(ix, iy) || 1; }
  ix /= mag; iy /= mag;
  if (ball.carrier === c || distance <= CR + BR + 18) {
    ball.x = c.x + ix * (CR + BR + 3);
    ball.y = c.y + iy * (CR + BR + 3);
  }
  const inside = c.team === 0 ? 1 : -1;
  const goalX = c.team === 0 ? FX + FW : FX;
  const aim = [ix, iy];
  let best = null, bestScore = -Infinity;
  const opponents = cows.filter(o => o.team !== c.team && o.role !== 'gk');
  cows.forEach(m => {
    if (m === c || m.team !== c.team || m.role === 'gk') return;
    const dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy);
    if (d < 36 || d > 430) return;
    if (isCross && settings.crossAutoTarget && dx * inside < 18) return;
    const dot = (dx * aim[0] + dy * aim[1]) / Math.max(1, d);
    const forward = dx * inside / Math.max(1, d);
    // Prefer a teammate in the direction pressed, with a bonus for open space.
    const pressure = opponents.reduce((v, o) => Math.min(v, Math.hypot(o.x - m.x, o.y - m.y)), 999);
    const openness = clamp(pressure / 90, 0, 1);
    const laneClosed = isCross && settings.crossAvoidBlocks && laneBlocked(c, ball.x, ball.y, m.x, m.y, CR + 10);
    const inBox = Math.abs(goalX - m.x) < 230 && Math.abs(m.y - H / 2) < GH / 2 + 115;
    const score = isCross
      ? (settings.crossAutoTarget ? (inBox ? 1.25 : 0) + Math.max(0, forward) * 0.55 + dot * 0.25 + openness * 0.65 - d / 1000
        : dot * 2.4 + forward * 0.55 + openness * 0.45 - d / 800) - (laneClosed ? 0.75 : 0)
      : dot * 2.8 + forward * 0.5 + openness * 0.55 - d / 700;
    if (score > bestScore) { bestScore = score; best = m; }
  });
  if (!best) {
    if (isCross) {
      const targetX = goalX - inside * 95;
      const targetY = clamp(H / 2 + (Math.abs(ay || 0) > 0.2 ? ay * 110 : (ball.y - H / 2) * 0.35), FY + CR, FY + FH - CR);
      const [dx, dy] = norm(targetX - ball.x, targetY - ball.y), dist = Math.hypot(targetX - ball.x, targetY - ball.y);
      launchCross(c, dx, dy, dist, ax, ay); stats.pass[c.team]++; stats.cross[c.team]++; return null;
    }
    kickBall(c, aim[0], aim[1], lobReq ? 10 : 7.2, 'pass', lobReq ? 0.17 : 0); stats.pass[c.team]++; return null;
  }
  // Lead the receiver slightly so a moving pass meets them in stride.
  const d0 = Math.hypot(best.x - ball.x, best.y - ball.y), tf = d0 / Math.max(3, passPower(d0) * 0.75);   // упреждение по времени полёта
  const lead = isCross ? (settings.crossLead ? 1.05 : 0) : 0.7;
  const tx = clamp(best.x + best.vx * tf * lead, FX + CR, FX + FW - CR), ty = clamp(best.y + best.vy * tf * lead, FY + CR, FY + FH - CR);
  const [dx, dy] = norm(tx - ball.x, ty - ball.y), dist = Math.hypot(tx - ball.x, ty - ball.y);
  const blocked = cows.some(o => { if (o.team === c.team || o.role === 'gk') return false; const sx = tx - ball.x, sy = ty - ball.y, t = clamp(((o.x - ball.x) * sx + (o.y - ball.y) * sy) / (dist * dist || 1), 0, 1); return t > 0.15 && t < 0.85 && Math.hypot(ball.x + sx * t - o.x, ball.y + sy * t - o.y) < CR + 10; });
  if (isCross) { launchCross(c, dx, dy, dist, ax, ay); stats.cross[c.team]++; }
  else if (lobReq || (!c.ctrl && dist > 240 && blocked)) { const vh = clamp(0.09 + dist * 0.00022, 0.12, 0.2); kickBall(c, dx, dy, clamp(dist * 0.92 / (2 * vh / 0.0105), 5, 15), 'pass', vh); }   // навес
  else kickBall(c, dx, dy, passPower(dist), 'pass');
  stats.pass[c.team]++;
  if (isCross && Math.random() < 0.45) say('cross');
  if (Math.random() < 0.16) say('pass');
  return best;
}

// ================== ИИ полевых игроков ==================
function computeTeamInfo() {
  for (let t = 0; t < 2; t++) {
    const list = cows.filter(c => c.team === t && c.role !== 'gk').sort((a, b) => dBall(a) - dBall(b));
    const human = list.find(c => c.ctrl) || null, ai = list.filter(c => !c.ctrl);
    const prev = tinfo[t].chaser;
    const interceptScore = new Map();
    let chaser = null, bestIntercept = Infinity;
    ai.forEach(a => {
      const rawDist = dBall(a);
      const runSpeed = Math.max(1.1, 2.05 * (0.92 + 0.035 * (a.tdef && a.tdef.spd || 3)) * (0.94 + 0.12 * aiTeamQuality(a)));
      const eta = clamp(rawDist / runSpeed, 0, 12);
      const loose = !ball.carrier && !ball.holder;
      const predictFrames = loose && Math.hypot(ball.vx, ball.vy) > 1.8 ? eta * 0.62 : 0;
      const px = clamp(ball.x + ball.vx * predictFrames, FX + CR, FX + FW - CR);
      const py = clamp(ball.y + ball.vy * predictFrames, FY + CR, FY + FH - CR);
      const reach = Math.hypot(px - a.x, py - a.y) / runSpeed;
      const rolePenalty = (tinfo[t].poss === t && a.role === 'df') ? 0.35 : 0;
      const scoreIntercept = reach + rawDist * 0.0008 + rolePenalty;
      interceptScore.set(a, scoreIntercept);
      if (scoreIntercept < bestIntercept) { bestIntercept = scoreIntercept; chaser = a; }
    });
    // Hysteresis prevents the pressing player from switching every frame for tiny distance changes.
    if (prev && ai.includes(prev) && chaser && prev !== chaser &&
        (interceptScore.get(prev) || Infinity) <= bestIntercept + 0.8) chaser = prev;
    if (t === 0 && ball.recvT > 0) ball.recvT--;
    if (ball.recvT > 0 && ball.recv && ball.recv.team === t && ai.includes(ball.recv) && lastTouch !== ball.recv) chaser = ball.recv;   // получатель идёт на мяч
    if (!ball.carrier && !ball.holder && lastTouch && lastTouch.team !== t && ai.length) {   // перехват чужого паса: игрок ближе всех к траектории мяча
      const spd = Math.hypot(ball.vx, ball.vy);
      if (spd > 4 && (ball.h || 0) < 1) {
        const px = clamp(ball.x + ball.vx * 16, FX, FX + FW), py = clamp(ball.y + ball.vy * 16, FY, FY + FH); let bi = null, bd = 230;
        ai.forEach(a => { const d = Math.hypot(a.x - px, a.y - py); if (d < bd) { bd = d; bi = a; } });
        if (bi && aiSkill(bi) >= 1) chaser = bi;
      }
    }   // гистерезис
    let support = ai.find(a => a !== chaser) || null;
    if (human && chaser && dBall(human) + 30 < dBall(chaser)) { support = chaser; chaser = null; }
    if (ball.holder) chaser = null;
    const poss = lastTouch ? lastTouch.team : -1, old = tinfo[t];
    let lostT = Math.max(0, (old.lostT || 0) - 1), gainT = Math.max(0, (old.gainT || 0) - 1);
    if (poss !== old.poss) {
      if (old.poss === t && poss !== -1) lostT = 100;                                   // потеряли мяч: прессинг и возврат
      if (poss === t && old.poss !== t) { gainT = 70; ai.forEach(a => { a.decT = 0; }); }   // отобрали: быстрая контратака
    }
    tinfo[t] = { chaser, support, human, poss, lostT, gainT };
  }
}
const aiSkill = c => (c.team === 1 && !matchCfg.versus) ? settings.diff : 1;   // 0 лёгкая, 1 обычная, 2 сложная
// Сложность задаёт тренерский уровень ИИ, а рейтинг состава — качество его решений.
const aiTeamQuality = c => clamp((teamPower(c.tdef) - 1) / 4, 0, 1);
const aiBrain = c => clamp(aiSkill(c) + (aiTeamQuality(c) - 0.5) * 0.6, 0, 2);
const minOppDist = (c, x, y) => { let m = 999; cows.forEach(o => { if (o.team !== c.team && o.role !== 'gk') m = Math.min(m, Math.hypot(o.x - x, o.y - y)); }); return m; };
function laneBlocked(c, x0, y0, x1, y1, r) {
  const sx = x1 - x0, sy = y1 - y0, L2 = sx * sx + sy * sy || 1;
  return cows.some(o => { if (o.team === c.team || o.role === 'gk') return false; const t = clamp(((o.x - x0) * sx + (o.y - y0) * sy) / L2, 0, 1); return t > 0.1 && t < 0.95 && Math.hypot(x0 + sx * t - o.x, y0 + sy * t - o.y) < r; });
}
const closingIntensity = () => { const window = Math.max(1, Math.min(20, settings.time * 0.2)); return clamp((window - timeLeft) / window, 0, 1); };
function tackleSteal(c, hold) {   // мяч выбит у владельца и летит вперёд, к воротам соперника
  ball.carrier = null; ball.holder = null; hold.cd = 22; hold.stum = 1; c.kickAnim = 0.6; c.kickKind = 'touch'; c.kickLeg = legSide(c); lastTouch = c;
  const [dx, dy] = norm(ball.x - c.x, ball.y - c.y), [gx, gy] = norm((c.team === 0 ? FX + FW : FX) - ball.x, H / 2 - ball.y);
  ball.vx = dx * 3.2 + gx * 3 + c.vx * 0.5; ball.vy = dy * 3.2 + gy * 3 + c.vy * 0.5;
  SFX.kick(0.3, sPan(ball.x)); addShake(0.15); if (effParts()) scatterGrass(c, 3, 0.05);
}
function aiOrTackle(c, D) {
  if ((ball.h || 0) >= 1.25 || c.cd > 0) return;
  const hold = ball.carrier;
  if (hold && hold.team !== c.team) { if (dBall(c) < CR + BR + 14) { c.cd = 26; const defBonus=c.utCard?clamp(((c.utCard.def||65)-65)/100, -.12, .18):0; const holdShield=hold.utCard?clamp(((hold.utCard.phy||65)-65)/160, -.1, .12):0; if (Math.random() < clamp(0.13 + 0.035 * aiBrain(c) + defBonus - holdShield - (hold.ctrl ? 0.04 : 0),.05,.38)) tackleSteal(c, hold); } return; }
  if (dBall(c) < CR + BR + 4) aiAct(c, D);
}
function wallSafeDir(b, inside, goalX) {   // направление на ворота с отклонением от бортов: мяч не загоняют в стену
  let ax = goalX - b.x, ay = H / 2 - b.y; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
  const m = 70; let ix = 0, iy = 0;
  if (b.y < FY + m) iy += 1 - (b.y - FY) / m; if (b.y > FY + FH - m) iy -= 1 - (FY + FH - b.y) / m;
  const endX = inside > 0 ? FX + FW : FX, dEnd = Math.abs(endX - b.x);
  if (dEnd < m && Math.abs(b.y - H / 2) > GH / 2 - 10) ix -= inside * (1 - dEnd / m);
  const vx = ax + ix * 0.9, vy = ay + iy * 0.9, vl = Math.hypot(vx, vy) || 1; return [vx / vl, vy / vl];
}
function dribbleDir(c, inside, goalX) {   // ведение: выбирает коридор с прогрессом, пространством и меньшим риском перехвата
  if (window.CowballAIV47 && typeof window.CowballAIV47.chooseDribbleHeading === 'function') {
    const chosen = window.CowballAIV47.chooseDribbleHeading({
      x: c.x, y: c.y, goalX, goalY: H / 2,
      left: FX + CR, right: FX + FW - CR, top: FY + CR, bottom: FY + FH - CR,
      opponents: cows.filter(o => o.team !== c.team && !o.dismissed)
    });
    if (chosen && Number.isFinite(chosen.x) && Number.isFinite(chosen.y)) return [chosen.x, chosen.y];
  }
  let ax = goalX - c.x, ay = H / 2 - c.y; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
  let rx = 0, ry = 0;
  cows.forEach(o => {
    if (o.team === c.team) return; const ddx = c.x - o.x, ddy = c.y - o.y, d = Math.hypot(ddx, ddy); if (d > 120 || d < 0.1) return;
    const ahead = (o.x - c.x) * inside > -20 ? 1.4 : 0.5, w = (1 - d / 120) * ahead * (o.role === 'gk' ? 0.7 : 1.4);
    rx += ddx / d * w; ry += ddy / d * w + (ddy >= 0 ? 1 : -1) * w * 0.8;   // обегаем с той стороны, где уже находимся
  });
  const mx = 62; if (c.y < FY + mx) ry += (1 - (c.y - FY) / mx) * 1.2; if (c.y > FY + FH - mx) ry -= (1 - (FY + FH - c.y) / mx) * 1.2;
  const endX = inside > 0 ? FX + FW : FX, dEnd = Math.abs(endX - c.x);
  if (dEnd < 90 && Math.abs(c.y - H / 2) > GH / 2 - 10) rx -= inside * (1 - dEnd / 90) * 1.2;
  const vx = ax + rx * 1.1, vy = ay + ry * 1.1, l = Math.hypot(vx, vy) || 1; return [vx / l, vy / l];
}
function aiAct(c, D) {
  const sk = aiBrain(c);
  if ((c.decT = (c.decT || 0) - 1) > 0) return; c.decT = 3 + (2 - sk) * 3 + (Math.random() * 3 | 0);   // решения не каждый кадр: игрок успевает вести мяч
  const inside = c.team === 0 ? 1 : -1, goalX = c.team === 0 ? FX + FW : FX, dGoal = Math.abs(goalX - ball.x);
  const behind = inside > 0 ? c.x < ball.x + 6 : c.x > ball.x - 6, power = D.pow * (0.85 + 0.07 * c.tdef.pow);
  const quality = aiTeamQuality(c), pressure = clamp(1 - minOppDist(c, c.x, c.y) / 85, 0, 1), noise = () => (Math.random() - 0.5) * (0.5 - 0.15 * sk);   // чем сложнее и сильнее состав, тем меньше случайных ошибок
  const closing = closingIntensity(), deficit = score[1 - c.team] - score[c.team];
  const urgency = closing * (deficit > 0 ? 0.28 : deficit === 0 ? 0.1 : -0.06), protect = closing * (deficit < 0 ? 0.16 : 0);
  const keeper = cows.find(o => o.team !== c.team && o.role === 'gk');
  const shotOptions = [H / 2 - GH * 0.34, H / 2 + GH * 0.34].map(y => ({
    y,
    blocked:laneBlocked(c, ball.x, ball.y, goalX, y, 22),
    keeperGap:keeper ? Math.abs(y - keeper.y) : GH * 0.5
  }));
  const bestShot = shotOptions.map(o => ({...o, score:clamp(o.keeperGap / (GH * 0.5),0,1) * 0.34 - (o.blocked ? 0.52 : 0)}))
    .sort((a,b)=>b.score-a.score)[0];
  const shotBlocked = bestShot.blocked;
  const sShoot = behind && dGoal < 470 ? (1 - dGoal / 470) * 1.05 + (shotBlocked ? -0.16 : 0.32) + bestShot.score - clamp(Math.abs(c.y - H / 2) / (H / 2), 0, 1) * 0.15 + 0.05 * sk + (D.shoot - 0.13) * 2.4 + urgency + noise() : -9;
  let sPass = -9, target = null;
  cows.forEach(m => {
    if (m === c || m.team !== c.team || m.role === 'gk') return;
    const dx = m.x - c.x, dy = m.y - c.y, d = Math.hypot(dx, dy); if (d < 60 || d > 450) return;
    const receiveEta = d / Math.max(4, power * 0.75);
    const receiveX = clamp(m.x + m.vx * receiveEta * 0.65, FX + CR, FX + FW - CR);
    const receiveY = clamp(m.y + m.vy * receiveEta * 0.65, FY + CR, FY + FH - CR);
    const blocked = laneBlocked(c, c.x, c.y, receiveX, receiveY, 26); if (blocked && d < 240) return;
    const targetSpace = clamp(minOppDist(c, receiveX, receiveY) / 100, 0, 1);
    const forward = clamp((receiveX - c.x) * inside / 200, -0.5, 1);
    const s = 0.62 * targetSpace + 0.48 * forward - d / 900 + (Math.abs(goalX - receiveX) + 60 < dGoal ? 0.18 : 0) + 0.20 * pressure + urgency * forward + protect * targetSpace - (blocked ? 0.62 : 0) + noise();
    if (s > sPass) { sPass = s; target = m; }
  });
  const aheadBlocked = minOppDist(c, c.x + inside * 70, c.y) < 45;
  const endX = inside > 0 ? FX + FW : FX, dEnd = Math.abs(endX - c.x), edgePenalty = (dEnd < 85 && Math.abs(c.y - H / 2) > GH / 2 - 8 ? 1.1 : 0) + (c.y < FY + 48 || c.y > FY + FH - 48 ? 0.45 : 0);   // у борта/торца вне створа вести нельзя
  let crossM = null, crossS = 0;   // навес с фланга на партнёра в штрафной
  if (Math.abs(c.y - H / 2) > 105 && dGoal > 70 && dGoal < 300) cows.forEach(m => {
    if (m === c || m.team !== c.team || m.role === 'gk' || Math.abs(goalX - m.x) > 210 || Math.abs(m.y - H / 2) > 120) return;
    const sp = clamp(minOppDist(c, m.x, m.y) / 80, 0, 1); if (sp > crossS) { crossS = sp; crossM = m; }
  });
  const sCross = crossM ? 0.7 + 0.5 * crossS + urgency * 0.3 + (edgePenalty ? 0.35 : 0) : -9;
  const forwardSpace = minOppDist(c, c.x + inside * 95, c.y) / 120;
  const goalProgress = clamp((FW - dGoal) / FW, 0, 1);
  // Если впереди свободно, корова старается продвинуться с мячом, а не отдавать пас автоматически.
  const sCarry = 0.64 + 0.30 * (1 - pressure) + 0.18 * clamp(forwardSpace, 0, 1) + 0.12 * goalProgress + urgency * 0.35 - (aheadBlocked ? 0.55 : 0) - edgePenalty + noise();
  if (sShoot >= sPass && sShoot >= sCarry && sShoot > 0.3) {
    const aimError = D.aim * (1.0 - 0.3 * quality);
    const ay = clamp(bestShot.y + (Math.random() - 0.5) * aimError, H / 2 - GH / 2 + 12, H / 2 + GH / 2 - 12), [dx, dy] = norm(goalX - ball.x, ay - ball.y);
    kickBall(c, dx, dy, power * 1.15, 'shot');
  } else if (crossM && sCross > sCarry && sCross > sShoot - 0.15) {
    const ux = crossM.x - c.x, uy = crossM.y - c.y, d = Math.hypot(ux, uy) || 1; launchCross(c, ux / d, uy / d, d, 0, 0);
  } else if (target && ((pressure > 0.66 && sPass > sCarry - 0.08) || sPass > sCarry + 0.11 || (c.carryT > 110 && sPass > -0.3))) {
    const [ux, uy] = norm(target.x - c.x, target.y - c.y); doPass(c, ux, uy);
    if (sk < 2) { const an = (Math.random() - 0.5) * (2 - sk) * 0.10, cs = Math.cos(an), sn = Math.sin(an), vx = ball.vx; ball.vx = vx * cs - ball.vy * sn; ball.vy = vx * sn + ball.vy * cs; }   // неточность паса на низких уровнях
  } else if (!aheadBlocked && (behind || forwardSpace > 0.22)) {
    if (ball.carrier !== c && lastTouch && lastTouch.team === c.team && lastTouch !== c) SFX.receive(sPan(ball.x));
    ball.holder = null; ball.carrier = c; ball.h = 0; ball.vh = 0; ball.vx = c.vx; ball.vy = c.vy; lastTouch = c;
    c.aiCarrySide = 0; c.decT = Math.max(c.decT || 0, 5);
  } else if (pressure > 0.6) {
    if (!doPass(c, inside, 0)) { const [dx, dy] = norm(goalX - ball.x, H / 2 - ball.y); kickBall(c, dx, dy, power, 'kick'); }
  }
}
function freeSpot(c, tx, ty, attacking, runner) {   // выбирает из нескольких точек самую свободную (и открытую для паса при атаке)
  const mates = cows.filter(o => o !== c && o.team === c.team && o.role !== 'gk'), opps = cows.filter(o => o.team !== c.team && o.role !== 'gk'), inside = c.team === 0 ? 1 : -1;
  let best = [tx, ty], bs = -1e9;
  [[0, 0], [0, -50], [0, 50], [-35, 0], [35, 0], [40, -45], [40, 45]].concat(runner ? [[70, 0], [90, -60], [90, 60], [0, -90], [0, 90]] : []).forEach(([da, dy]) => {
    const x = clamp(tx + da * inside, FX + CR + 16, FX + FW - CR - 16), y = clamp(ty + dy, FY + CR + 16, FY + FH - CR - 16);
    let s = -Math.hypot(x - tx, y - ty) * 0.015 + Math.min(120, mates.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.y - y)), 999)) * 0.012;
    if (attacking) {
      s += Math.min(110, opps.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.y - y)), 999)) * 0.02 * (runner ? 1.5 : 1) + (runner ? da * 0.006 : 0);
      const sx = x - ball.x, sy = y - ball.y, L2 = sx * sx + sy * sy || 1;
      if (opps.some(o => { const t = clamp(((o.x - ball.x) * sx + (o.y - ball.y) * sy) / L2, 0, 1); return t > 0.1 && t < 0.95 && Math.hypot(ball.x + sx * t - o.x, ball.y + sy * t - o.y) < 26; })) s -= 1.2;   // линия паса закрыта
    }
    if (s > bs) { bs = s; best = [x, y]; }
  });
  return best;
}
function shapeTarget(c, ti, inside, ownX) {   // позиция по роли и фазе игры; пересчёт раз в ~10 кадров
  if ((c.aiT = (c.aiT || 0) - 1) > 0 && c.tgt) return c.tgt;
  const sk = aiBrain(c); c.aiT = 14 - 3 * sk;
  const u = c.home[0], v = c.home[1], span = (matchCfg.size === 11 ? 180 : 140) * fieldVisualScale, mine = ti.poss === c.team, def = ti.poss !== -1 && !mine;
  const aBall = (ball.x - ownX) * inside, aBase = 30 + u * 320 + clamp(aBall - FW / 2, -210, 210) * 0.09 * (0.35 + u);
  let a = aBase, y = H / 2 + v * span * (def ? 0.82 : 1) + (ball.y - H / 2) * 0.12;   // в обороне линия сжимается
  if (c.role === 'df') a = mine ? aBase + 70 : (def ? Math.min(aBase, aBall - 55) : aBase);          // защитник: вперёд при атаке, за мяч при обороне
  else if (c.role === 'mf') a = mine ? aBase + 60 : (def ? Math.min(aBase, aBall - 30) : aBase);
  else if (mine) a = Math.max(aBase, Math.min(aBall + 70 + (ti.gainT > 0 ? 50 : 0), FW - 60));                                // нападающий: выходит вперёд мяча под передачу
  { const st = c.team === 0 ? matchCfg.style : matchCfg.styleB, so = st === 'att' ? 40 : st === 'def' ? -40 : 0; a += so * (c.role === 'fw' ? 0.5 : 1); }   // стиль игры сдвигает линии
  a = clamp(a, 30, FW - 40);
  if (mine) {   // атака: нападающие занимают позиции в штрафной (ближняя/дальняя штанга), крайние игроки растягивают оборону
    if (c.role === 'fw' && aBall > FW * 0.5) { a = FW - 85 - ((c.lk || 0) % 3) * 28; y = H / 2 + ((c.lk || 0) % 2 ? 1 : -1) * (35 + ((c.lk || 0) % 3) * 28); }
    else if (Math.abs(v) >= 0.5) { y = H / 2 + Math.sign(v) * (H / 2 - 75); a = Math.max(a, aBall - 20); }
  }
  if (def && c.role !== 'fw') {   // опека ближайшего соперника, оставаясь между ним и своими воротами
    let opp = null, od = 100 + 30 * sk; cows.forEach(o => { if (o.team === c.team || o.role === 'gk') return; const d = Math.hypot(o.x - (ownX + inside * a), o.y - y); if (d < od) { od = d; opp = o; } });
    if (opp) { y = lerp(y, opp.y, 0.55 + 0.08 * sk); a = Math.max(30, Math.min(a, (opp.x - ownX) * inside - 25)); }
  }
  return (c.tgt = freeSpot(c, ownX + inside * a, y, mine && c.role !== 'df', mine && c.role === 'fw'));
}
function fieldAI(c) {
  const D = DIFF[settings.diff], T = c.tdef, inside = c.team === 0 ? 1 : -1, goalX = c.team === 0 ? FX + FW : FX, ownX = c.team === 0 ? FX : FX + FW;
  const quality = aiTeamQuality(c);
  const speed = (c.team === 1 && !matchCfg.versus ? D.spd : 2.05) * (0.92 + 0.035 * T.spd) * (0.94 + 0.12 * quality) * (c.speedBoost > 0 ? 1.22 : 1);
  const ti = tinfo[c.team], dB = dBall(c), retreat = c.wait > 0 || ballStuck > 22;
  if (ball.carrier !== c) c.carryT = 0; else c.carryT = (c.carryT || 0) + 1;
  let tx, ty;
  if (!retreat && ball.carrier === c && !c.ctrl) {
    const dd = dribbleDir(c, inside, goalX); tx = c.x + dd[0] * 90; ty = c.y + dd[1] * 90;
    if (dB < CR + BR + 38 && c.cd <= 0) aiAct(c, D);
  } else if (!retreat && ti.chaser === c) {
    const [gx, gy] = wallSafeDir(ball, inside, goalX);
    const lead = clamp(dB / Math.max(4, speed + Math.hypot(ball.vx, ball.vy)), 0, 5);
    const pk = 0.85 + 0.32 * settings.diff;
    tx = ball.x + clamp(ball.vx * lead * pk, -95, 95) - gx * 24;
    ty = ball.y + clamp(ball.vy * lead * pk, -95, 95) - gy * 24;
    if (dB < 42) { tx = ball.x; ty = ball.y; }
    aiOrTackle(c, D);
  } else if (!retreat && ti.support === c) {
    if (settings.crossRun && ball.crossT > 0 && ball.crossTeam === c.team && c.role !== 'df') {
      const runX = clamp(ball.x + inside * (c.role === 'fw' ? 76 : 48), FX + CR + 20, FX + FW - CR - 20);
      const runY = clamp(ball.y + (c.home[1] || 0) * 34, FY + CR + 20, FY + FH - CR - 20);
      const p = freeSpot(c, runX, runY, true, c.role === 'fw'); tx = p[0]; ty = p[1];
    } else if (ti.poss === c.team) { const p = freeSpot(c, ball.x + inside * 115, clamp(ball.y + (ball.y > H / 2 ? -70 : 70), FY + 40, FY + FH - 40), true); tx = p[0]; ty = p[1]; }   // открывается под пас
    else if (ti.lostT > 0 || (aiBrain(c) >= 2 && (ball.x - ownX) * inside < 260)) { tx = ball.x - inside * 28; ty = ball.y; aiOrTackle(c, D); }   // контрпрессинг
    else { tx = ball.x - inside * 90; ty = lerp(ball.y, H / 2, 0.4); }                                                                                                    // страхует преследователя
  } else {
    const p = shapeTarget(c, ti, inside, ownX); tx = p[0]; ty = p[1];
  }
  if (!retreat && ball.carrier && ball.carrier.team !== c.team && ti.chaser !== c) aiOrTackle(c, D);   // любой защитник рядом может отобрать мяч
  const def = ti.poss !== -1 && ti.poss !== c.team;
  c.recov = def && c.role !== 'fw' && ti.chaser !== c && ((c.x - ownX) * inside > (ball.x - ownX) * inside + 20 || ti.lostT > 0);   // бежит назад быстрее
  c.rush = ti.gainT > 0 && c.role === 'fw';
  const runoffX = Math.max(CR * 3, 70 * fieldVisualScale), runoffY = Math.max(CR * 3, 55 * fieldVisualScale);
  tx = clamp(tx, FX - runoffX, FX + FW + runoffX); ty = clamp(ty, FY - runoffY, FY + FH + runoffY);
  const [dx, dy] = norm(tx - c.x, ty - c.y), k = Math.min(1, Math.hypot(tx - c.x, ty - c.y) / 20);
  return { ix: dx * k, iy: dy * k, speed: speed * (c.recov ? 1.12 : c.rush ? 1.08 : 1) };
}

// ================== Вратари ==================
function keeperSkill(c) {
  const base = c.team === 1 && !matchCfg.versus ? DIFF[settings.diff].gk : 0.52;
  const teamSkill = base * (0.62 + 0.045 * c.tdef.def);
  const utSkill = c.utCard && c.role === 'gk' ? 0.30 + 0.70 * clamp((c.utCard.gk || c.utCard.rating || 65) / 100, 0.25, 0.99) : 1;
  return clamp(teamSkill * utSkill, 0.22, 0.62);
}
function keeperAI(c) {
  const inside = c.team === 0 ? 1 : -1, ownX = c.team === 0 ? FX : FX + FW, gy = H / 2;
  const skill = keeperSkill(c);
  if (ball.holder === c) return { ix: 0, iy: 0, speed: 0 };
  const sp = Math.hypot(ball.vx, ball.vy), ballDist = Math.abs(ball.x - ownX);
  // 42: следит за мячом с небольшим запаздыванием (чем слабее вратарь, тем больше)
  if (c.trkX === undefined) { c.trkX = ball.x; c.trkY = ball.y; }
  const lag = clamp(0.30 - 0.22 * skill, 0.12, 0.28); c.trkX += (ball.x - c.trkX) * lag; c.trkY += (ball.y - c.trkY) * lag;
  // 41: стоит на дуге между центром ворот и мячом; чем дальше мяч, тем ближе к линии
  const vx = (c.trkX - ownX) * inside, vy = c.trkY - gy, d = Math.hypot(vx, vy) || 1;
  let r = clamp(18 + d * 0.11, 22, 64);
  let od = 999; cows.forEach(o => { if (o.team !== c.team && o.role !== 'gk') od = Math.min(od, Math.hypot(o.x - ball.x, o.y - ball.y)); });
  const kd = Math.hypot(c.x - ball.x, c.y - ball.y);
  if (od < 45 && ballDist > 60 && ballDist < 230 && sp < 6.5) r += clamp((230 - ballDist) * 0.22, 0, 38) * (0.4 + skill);   // 48: выход навстречу одному на один, сужает угол
  let tx = ownX + inside * Math.max(14, r * vx / d), ty = clamp(gy + r * vy / d, gy - GH / 2 + 12, gy + GH / 2 - 12);
  // предсказание удара по воротам
  if (ball.vx * -inside > 1.0 && c.diveT <= 0) {
    const t = (ownX - ball.x) / ball.vx;
    if (t > 0 && t < 70) {
      const predY = ball.y + ball.vy * t * 0.9, onTarget = Math.abs(predY - gy) < GH / 2 + 4, py = clamp(predY, gy - GH / 2 + 10, gy + GH / 2 - 10);
      if (onTarget) {
        ty = lerp(ty, py, 0.35 + 0.6 * skill); tx = ownX + inside * 20;
        // 43-45: бросок только при опасном ударе в створ, если успевает, с учётом скорости и реакции
        const need = Math.abs(py - c.y), react = (1 - skill) * 12, reach = 3.4 * Math.max(0, t - react) + 22;
        if (sp > 6.5 && t > 3 && t < 26 && need > 24 && (c.diveCd || 0) <= 0 && (need < reach * 1.25 || Math.random() < 0.2)) {
          c.diveT = 26; c.diveDir = Math.sign(py - c.y) || 1; c.diveY = py; c.diveCd = 70; c.vy += c.diveDir * 3;
        }
      }
    }
  }
  if (c.diveT > 0 && c.diveY !== undefined) { tx = ownX + inside * 20; ty = c.diveY; }
  else {
    const inBox = ballDist < 100 && Math.abs(ball.y - gy) < 105;
    if (inBox && sp < 5 && !ball.holder) { tx = ball.x; ty = ball.y; }
    else if (!ball.holder && sp < 8 && ballDist < 190 && Math.abs(ball.y - gy) < 135 && kd < od - 10 && (ball.h || 0) < 1.2) { tx = ball.x; ty = ball.y; }   // 48: выбегает на свободный мяч
  }
  // 49: не застревает и не уходит за пределы зоны
  tx = clamp(tx, Math.min(ownX + inside * 10, ownX + inside * 160), Math.max(ownX + inside * 10, ownX + inside * 160)); ty = clamp(ty, gy - GH / 2 - 40, gy + GH / 2 + 40);
  const dist = Math.hypot(tx - c.x, ty - c.y);
  if (Math.hypot(c.vx, c.vy) < 0.08 && dist > 14 && c.diveT <= 0) c.gkStill = (c.gkStill || 0) + 1; else c.gkStill = 0;
  if (c.gkStill > 45) { const [ux, uy] = norm(tx - c.x, ty - c.y); c.vx += ux * 2; c.vy += uy * 2; c.gkStill = 0; }
  const [dx, dy] = norm(tx - c.x, ty - c.y), k = c.diveT > 0 ? (dist > 6 ? 1 : dist / 6) : Math.min(1, dist / 14);
  const base = c.diveT > 0 ? 3.6 + 1.2 * skill : (1.85 + 0.055 * c.tdef.def) * (dist > 60 ? 1.15 : 1);
  return { ix: dx * k, iy: dy * k, speed: base * (c.getUp > 0 ? 0.45 : 1) };
}
function keeperTouch(c) {
  const sp = Math.hypot(ball.vx, ball.vy), inside = c.team === 0 ? 1 : -1;
  if (ball.onTarget > 0 && ball.shotSide !== c.team) { stats.saves[c.team]++; SFX.save(sPan(ball.x)); say('save'); ball.onTarget = 0; SFX.cheer(0.3, 1.5); }
  const skill = keeperSkill(c), high = (ball.h || 0) > 0.9;
  const catchP = clamp(1.05 - sp / 17, 0.06, 0.9) * (0.50 + 0.55 * skill) * (high ? 0.50 : 1) * (c.diveT > 0 ? 0.92 : 1);   // шанс зависит от силы удара и уровня вратаря
  if ((ball.h || 0) < 1.4 && Math.random() < catchP) { ball.holder = c; c.hold = 55; c.cd = 10; SFX.glove(sPan(ball.x)); }
  else {   // отбивание в сторону от ворот; в броске — шире, на угловой
    const side = Math.sign(ball.y - H / 2) || (Math.random() < 0.5 ? -1 : 1), [dx, dy] = norm(inside * 0.55, side * (c.diveT > 0 ? 1.1 : 0.85));
    const out = clamp(sp * 0.62, 5, 12); ball.vx = dx * out; ball.vy = dy * out; c.cd = 20; c.kickAnim = 1; c.kickKind = 'kick'; c.kickLeg = 0; lastTouch = c;
  }
}
function releaseKeeper(h) {
  ball.holder = null; h.cd = 0; const inside = h.team === 0 ? 1 : -1;
  if (!doPass(h, inside, (Math.random() - 0.5) * 0.8)) { /* doPass уже ударил вперёд */ }
  h.cd = 20;
}

// ================== Физика ==================
function collide() {
  if (!ball.holder && (ball.h || 0) < 1.1) cows.forEach(c => {
    if (ball.holder) return;
    const dx = ball.x - c.x, dy = ball.y - c.y, d = Math.hypot(dx, dy), m = CR + BR + (c.role === 'gk' && c.diveT > 0 ? 9 : 0);   // в броске вратарь «дотягивается» дальше
    if (d < m && d > 0.001) {
      if (ball.carrier && ball.carrier.team !== c.team) ball.carrier = null;
      const nx = dx / d, ny = dy / d; ball.x += nx * (m - d); ball.y += ny * (m - d);
      if (c.role === 'gk' && c.cd <= 0) { keeperTouch(c); return; }
      const rel = (ball.vx - c.vx) * nx + (ball.vy - c.vy) * ny;
      if (rel < 0) {
        if (!c.ctrl && c.role !== 'gk' && c.cd <= 0 && Math.hypot(ball.vx - c.vx, ball.vy - c.vy) < 11) {   // ИИ гасит скорость и ведёт мяч, а не отбивает
          ball.vx += (c.vx - ball.vx) * 0.6 + nx * 0.25; ball.vy += (c.vy - ball.vy) * 0.6 + ny * 0.25;
        } else {
          // Полевые игроки мягко принимают мяч вместо сильного «пружинящего» отскока.
          const restitution = c.role === 'gk' ? 0.5 : 0.06;
          const impulse = -(1 + restitution) * rel;
          ball.vx += impulse * nx; ball.vy += impulse * ny;
        }
      }
      lastTouch = c; if (ball.onTarget > 0 && c.team === ball.shotSide) ball.onTarget = Math.min(ball.onTarget, 20);
    }
  });
  for (let i = 0; i < cows.length; i++) for (let j = i + 1; j < cows.length; j++) {
    const a = cows[i], b = cows[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = CR * 2;
    if (d < m && d > 0.001) { if (Math.hypot(a.vx - b.vx, a.vy - b.vy) > 1.6 && !(a.stum > 0.2) && !(b.stum > 0.2)) { a.stum = b.stum = 1; if (Math.random() < 0.45) { SFX.tackle(sPan((a.x + b.x) / 2)); SFX.bodyHit(sPan((a.x + b.x) / 2)); } if (effParts()) { scatterGrass(a, 2, 0.04); scatterGrass(b, 2, 0.04); } } const p = (m - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; }
  }
}
function popBall() {
  const sx = ball.x < W / 2 ? 1 : -1, sy = ball.y < H / 2 ? 1 : -1, [dx, dy] = norm(sx + (Math.random() - 0.5) * 0.4, sy * 0.8 + (Math.random() - 0.5) * 0.4);
  ball.vx = dx * 7.5; ball.vy = dy * 7.5; ballStuck = 0;
  cows.forEach(c => { if (Math.hypot(c.x - ball.x, c.y - ball.y) < 120) { const [ax, ay] = norm(c.x - ball.x, c.y - ball.y); c.vx += ax * 3; c.vy += ay * 3; if (!c.ctrl) c.wait = 80; } });
  SFX.kick(0.4, 0); say('corner');
}
function wallPost(sp) {
  if (sp > 5 && Math.abs(Math.abs(ball.y - H / 2) - GH / 2) < BR + 4) { SFX.post(sPan(ball.x)); say('post'); SFX.ooh(); }
}
function cowballCheckOutV24(prevX=ball.x,prevY=ball.y) {
  if (state !== 'play' || ruleModalState) return false;
  const L=FX-BR, R=FX+FW+BR, T=FY-BR, B=FY+FH+BR;
  const outL=ball.x<L, outR=ball.x>R, outT=ball.y<T, outB=ball.y>B;
  const outX=outL||outR, outY=outT||outB;
  if(!outX&&!outY) return false;
  // Return the segment's first crossing time. If collision correction left the ball already outside,
  // use t=0 so the restart is still triggered instead of allowing it to drift farther away.
  const crossAt=(a,b,line,below)=>{
    if(!(below?b<line:b>line)) return Infinity;
    if(below ? a<line : a>line) return 0;
    const d=b-a; if(Math.abs(d)<1e-9) return Infinity;
    return clamp((line-a)/d,0,1);
  };
  const tx=outL?crossAt(prevX,ball.x,L,true):outR?crossAt(prevX,ball.x,R,false):Infinity;
  const ty=outT?crossAt(prevY,ball.y,T,true):outB?crossAt(prevY,ball.y,B,false):Infinity;
  const xFirst=outX&&(!outY||tx<=ty);
  const atX=Number.isFinite(ty)&&ty>0&&ty<1 ? prevX+(ball.x-prevX)*ty : ball.x;
  const atY=Number.isFinite(tx)&&tx>0&&tx<1 ? prevY+(ball.y-prevY)*tx : ball.y;
  const award=lastTouch&&Number.isFinite(lastTouch.team)?1-lastTouch.team:(players[0]&&players[0].team===0?1:0);
  if(!xFirst){
    const spotY=outT?FY+CR:FY+FH-CR, spotX=clamp(atX,FX+CR,FX+FW-CR);
    if(ruleStats&&ruleStats.throwIns)ruleStats.throwIns[award]++;
    if(settings.rulesEnabled&&typeof cbShowRestart==='function') cbShowRestart('throwin',award,spotX,spotY,'Мяч полностью пересёк боковую линию.');
    else setRestartStateV17('throwin',award,spotX,spotY,'Мяч полностью пересёк боковую линию.',lastTouch);
    return true;
  }
  const left=outL, crossY=atY;
  const inGoalY=Math.abs(crossY-H/2)<GH/2-BR*.15;
  const phys = window.CowballPhysicsV47;
  const ballHeight = Number(ball.h) || 0;
  const goalHeightClear = phys && typeof phys.isGoalHeightClear === 'function'
    ? phys.isGoalHeightClear(ballHeight, BRW, BVIS)
    : ballHeight < 1.73;
  if (inGoalY && !goalHeightClear && phys && typeof phys.touchesCrossbar === 'function' &&
      phys.touchesCrossbar(ballHeight, BRW, BVIS)) {
    // The crossbar is a solid 3D obstacle: bounce back into play instead of awarding a goal.
    ball.x = left ? FX + BR : FX + FW - BR;
    ball.y = clamp(crossY, H / 2 - GH / 2 + BR, H / 2 + GH / 2 - BR);
    ball.vx = left ? Math.abs(ball.vx) * 0.48 : -Math.abs(ball.vx) * 0.48;
    ball.vy *= 0.72;
    ball.vh = ball.vh > 0 ? -ball.vh * 0.42 : Math.abs(ball.vh) * 0.22;
    ball.curve *= 0.5;
    SFX.post(sPan(ball.x)); say('post'); addShake(0.12);
    return true;
  }
  if(inGoalY && goalHeightClear){goal(left?1:0);return true;}
  const defending=left?0:1,lastTeam=lastTouch?lastTouch.team:-1,isCorner=lastTeam===defending,team=isCorner?1-defending:defending;
  const spotX=isCorner?(left?FX+CR:FX+FW-CR):(left?FX+64:FX+FW-64);
  const spotY=isCorner?(crossY<H/2?FY+CR:FY+FH-CR):H/2;
  if(isCorner&&ruleStats&&ruleStats.corners)ruleStats.corners[team]++;
  else if(!isCorner&&ruleStats&&ruleStats.goalKicks)ruleStats.goalKicks[team]++;
  const why=isCorner?'Последним мяча коснулся защитник.':'Последним мяча коснулся нападающий.';
  if(settings.rulesEnabled&&typeof cbShowRestart==='function') cbShowRestart(isCorner?'corner':'goalkick',team,spotX,spotY,why);
  else setRestartStateV17(isCorner?'corner':'goalkick',team,spotX,spotY,why,lastTouch);
  return true;
}
function updateBall(dt) {
  const outPrevX = ball.x, outPrevY = ball.y;
  if (ball.crossT > 0) { ball.crossT = Math.max(0, ball.crossT - dt); if (ball.crossT === 0) ball.crossTeam = -1; }
  if (ball.carrier && !ball.holder) {
    const c = ball.carrier, inp = c.ctrl && c.ctrl.input;
    if (!c.ctrl) {
      if (c.freeze > 0) ball.carrier = null;
      else {
        const goalX = c.team === 0 ? FX + FW : FX, [gx, gy] = norm(goalX - c.x, H / 2 - c.y), [mx, my] = norm(c.vx, c.vy);
        const [dx, dy] = norm(gx * 0.28 + mx * 0.72, gy * 0.28 + my * 0.72);
        const tx = c.x + dx * (CR + BR + 5), ty = c.y + dy * (CR + BR + 5), follow = 1 - Math.pow(0.62, dt);
        ball.x = lerp(ball.x, tx, follow); ball.y = lerp(ball.y, ty, follow);
        ball.vx = c.vx; ball.vy = c.vy; ball.h = 0; ball.vh = 0; ballStuck = 0;
        if (ball.fire > 0) ball.fire -= dt; if (ball.onTarget > 0) ball.onTarget -= dt;
        if (cowballCheckOutV24(outPrevX, outPrevY)) return;
        return;
      }
    } else {
      const m = inp ? Math.hypot(inp.x, inp.y) : 0;
      // При развороте мяч плавно обходит корову и остаётся под контролем.
      if (!inp || m <= 0.16 || inp.kick || (ball.h || 0) > 0.9 || dBall(c) > CR + BR + 54) {
        ball.carrier = null;
      } else {
      const tx = c.x + inp.x / m * (CR + BR + 4);
      const ty = c.y + inp.y / m * (CR + BR + 4);
      const follow = 1 - Math.pow(0.62, dt);
      ball.x = lerp(ball.x, tx, follow); ball.y = lerp(ball.y, ty, follow);
      ball.vx = c.vx; ball.vy = c.vy; ballStuck = 0;
      if (ball.fire > 0) ball.fire -= dt; if (ball.onTarget > 0) ball.onTarget -= dt;
      if (cowballCheckOutV24(outPrevX, outPrevY)) return;
      return;
      }
    }
  }
  if (ball.holder) {
    const h = ball.holder, inside = h.team === 0 ? 1 : -1; ball.x = h.x + inside * (CR + 2); ball.y = h.y; ball.vx = ball.vy = 0;
    h.hold -= dt; if (cowballCheckOutV24(outPrevX, outPrevY)) return; if (h.hold <= 0) releaseKeeper(h); return;
  }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  const sp0 = Math.hypot(ball.vx, ball.vy);
  if (sp0 > 0) { const air = (ball.h || 0) > 0.02, ns = air ? sp0 * Math.pow(0.997, dt) : Math.max(0, sp0 * Math.pow(1 - 0.004 - 0.0006 * sp0, dt) - 0.01 * dt); ball.vx *= ns / sp0; ball.vy *= ns / sp0; }
  if (Math.abs(ball.curve) > 0.0001 && sp0 > 0.35) {
    const cvx = ball.vx, cvy = ball.vy, speed = Math.hypot(cvx, cvy);
    ball.vx = cvx - cvy / speed * ball.curve * dt; ball.vy = cvy + cvx / speed * ball.curve * dt;
    ball.curve *= Math.pow(0.985, dt);
  } else if (Math.abs(ball.curve) > 0.0001) ball.curve *= Math.pow(0.88, dt);
  if ((ball.h || 0) > 0 || ball.vh) {   // полёт и отскок: гравитация, потеря энергии при ударе о землю
    ball.vh = (ball.vh || 0) - 0.0105 * dt; ball.h = (ball.h || 0) + ball.vh * dt;
    if (ball.h <= 0) {
      ball.h = 0;
      if (ball.vh < -0.06) { const hit = -ball.vh; ball.vh = hit * 0.58; ball.vx *= 0.93; ball.vy *= 0.93;
        if (hit > 0.1) { SFX.bounce(sPan(ball.x), hit); if (effParts()) for (let i = 0; i < 3; i++) grassPool.spawn(wx(ball.x), 0.1, wz(ball.y), (Math.random() - 0.5) * 0.06, 0.04 + Math.random() * 0.03, (Math.random() - 0.5) * 0.06, GRASS_COLS[(Math.random() * 4) | 0], 20); }
      } else ball.vh = 0;
    }
  }
  const sp = Math.hypot(ball.vx, ball.vy); if (sp > 19) { ball.vx *= 19 / sp; ball.vy *= 19 / sp; }
  if (ball.fire > 0) ball.fire -= dt; if (ball.onTarget > 0) ball.onTarget -= dt;
  const nx = Math.min(ball.x - FX, FX + FW - ball.x), ny = Math.min(ball.y - FY, FY + FH - ball.y);
  const cornerPin = nx < 62 && ny < 62 && sp < 3.2, wallPin = Math.min(nx, ny) < 26 && sp < 1.4;
  if (cornerPin || wallPin) ballStuck += dt * (cornerPin ? 1 : 0.7); else ballStuck = Math.max(0, ballStuck - dt * 3);
  if (ballStuck > 55) popBall();
  if ((ball.h || 0) < 2.4 + BRW) {
    for (let s = 0; s < 4; s++) {   // штанги — круглые препятствия; мяч над стойкой проходит свободно
      const px = s & 1 ? FX + FW : FX, py = H / 2 + (s & 2 ? GH / 2 : -GH / 2), ddx = ball.x - px, ddy = ball.y - py, dd = Math.hypot(ddx, ddy), mr = BR + 3;
      if (dd < mr && dd > 0.001) { const nx = ddx / dd, ny = ddy / dd, vn = ball.vx * nx + ball.vy * ny; ball.x = px + nx * mr; ball.y = py + ny * mr; if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; wallPost(Math.hypot(ball.vx, ball.vy)); } }
    }
  }
  if (cowballCheckOutV24(outPrevX, outPrevY)) return;
}
function ballInNet(dt) {
  ball.vh = 0; ball.h = Math.max(0, (ball.h || 0) - 0.04 * dt);
  ball.x += ball.vx * dt; ball.y += ball.vy * dt; const f = Math.pow(0.93, dt); ball.vx *= f; ball.vy *= f;
  const lo = FX - 32 + BR, hi = FX + FW + 32 - BR;
  if (ball.x < lo) { if (-ball.vx > 1.2) netHit(1, ball.y, ball.h || 0, -ball.vx * 0.6); ball.x = lo; ball.vx = Math.abs(ball.vx) * 0.3; } if (ball.x > hi) { if (ball.vx > 1.2) netHit(0, ball.y, ball.h || 0, ball.vx * 0.6); ball.x = hi; ball.vx = -Math.abs(ball.vx) * 0.3; }
  const zl = H / 2 - GH / 2 + BR, zh = H / 2 + GH / 2 - BR;
  if (ball.y < zl) { ball.y = zl; ball.vy = Math.abs(ball.vy) * 0.3; } if (ball.y > zh) { ball.y = zh; ball.vy = -Math.abs(ball.vy) * 0.3; }
}

function updateCow(c, dt) {
  let ctl;
  if (c.freeze > 0) { c.freeze -= dt; ctl = { ix: 0, iy: 0, speed: 0 }; if (c.ctrl) c.ctrl.charge = 0; }
  else if (c.ctrl) ctl = humanControl(c.ctrl, c, dt);
  else if (c.role === 'gk') ctl = keeperAI(c);
  else ctl = fieldAI(c);
  // UT attributes affect every assigned cow, including AI-controlled teammates.
  if (c.utCard && ctl && Number.isFinite(ctl.speed)) ctl.speed *= clamp(0.84 + (c.utCard.pac || 65) / 100 * 0.22 + (c.utCard.chemBonus || 0), 0.9, 1.08);
  if (c.speedBoost > 0) c.speedBoost -= dt; if (c.milkT > 0) { c.milkT -= dt; if (c.milkT <= 0) c.milk = 0; }
  if (c.wait > 0) c.wait -= dt; if (c.cd > 0) c.cd -= dt; if (c.diveT > 0) { c.diveT -= dt; if (c.diveT <= 0) c.getUp = 32; } if (c.getUp > 0) c.getUp -= dt; if (c.diveCd > 0) c.diveCd -= dt;
  if (c.hold > 0 && ball.holder !== c) c.hold = 0;
  const hold = ball.holder === c;
  // Shared, dt-stable movement model: acceleration, braking and tighter low-speed turns.
  const cowMoveScale = 0.80;
  const targetVx = hold ? 0 : ctl.ix * ctl.speed * cowMoveScale;
  const targetVy = hold ? 0 : ctl.iy * ctl.speed * cowMoveScale;
  if (window.CowballPhysicsV47 && typeof window.CowballPhysicsV47.moveVelocity === 'function') {
    const nextV = window.CowballPhysicsV47.moveVelocity(c.vx, c.vy, targetVx, targetVy, dt);
    c.vx = nextV.vx; c.vy = nextV.vy;
  } else {
    const k = Math.min(1, 0.30 * dt);
    c.vx += (targetVx - c.vx) * k; c.vy += (targetVy - c.vy) * k;
  }
  // Permit players to cross the painted boundary; stop them only beyond the runoff area.
  const runoffX = Math.max(CR * 3, 70 * fieldVisualScale), runoffY = Math.max(CR * 3, 55 * fieldVisualScale);
  c.x = clamp(c.x + c.vx * dt, FX - runoffX, FX + FW + runoffX); c.y = clamp(c.y + c.vy * dt, FY - runoffY, FY + FH + runoffY);
  if (state === 'play' && c.ctrl) {
    c.stepSfxT = (c.stepSfxT || 0) - dt;
    const footSpeed = Math.hypot(c.vx, c.vy);
    if (footSpeed > 1.25 && c.stepSfxT <= 0) { SFX.footstep(sPan(c.x), footSpeed > 2.5 ? 1 : 0.55); c.stepSfxT = footSpeed > 2.5 ? 15 : 20; }
  } else c.stepSfxT = 0;
}

// ================== Бонусы на поле ==================
function spawnPickup() {
  const free = PICK_TYPES.filter(k => !pickups.some(p => p.type === k)); if (!free.length) return;
  const type = pick(free); pickups.push({ type, x: rnd(260, 540), y: rnd(90, 360), t: 0 });
  pickupMeshes[type].visible = true; SFX.pick(); say('power');
}
function collectPickup(c, p) {
  pickups.splice(pickups.indexOf(p), 1); pickupMeshes[p.type].visible = false; stats.pick[c.team]++; SFX.pick();
  if (p.type === 'hay') { c.speedBoost = 480; say('hay', true); }
  else if (p.type === 'milk') { c.milk = 1; c.milkT = 900; say('milk', true); }
  else { cows.forEach(o => { if (o.team !== c.team && o.role !== 'gk') o.freeze = 150; }); SFX.bell(); say('bell', true); }
}
function updatePickups(dt) {
  if (!settings.power) return;
  pickupT -= dt; if (pickupT <= 0) { if (pickups.length < 2) spawnPickup(); pickupT = rnd(520, 840); }
  pickups.forEach(p => {
    p.t += dt; const m = pickupMeshes[p.type]; m.position.set(wx(p.x), 0.9 + Math.sin(p.t * 0.08) * 0.12, wz(p.y)); m.rotation.y = p.t * 0.04;
    for (const c of cows) { if (c.role !== 'gk' && Math.hypot(c.x - p.x, c.y - p.y) < 34) { collectPickup(c, p); break; } }
  });
}
let chipTxt = '';
function renderChips() {
  const p = players[0]; let t = '';
  $('bPass').classList.toggle('ready', !!(p && canPassFrom(p.cow)));
  $('bCross').classList.toggle('ready', !!(settings.crossHint && settings.crossEnabled && p && canPassFrom(p.cow)));
  if (p && p.cow) { const c = p.cow; if (c.speedBoost > 0) t += `<span class="chip">⚡ ${Math.ceil(c.speedBoost / 60)}с</span>`; if (c.milk > 0) t += '<span class="chip">🥛 сверхудар</span>'; }
  if (cows.some(o => o.team === 0 && o.freeze > 0)) t += '<span class="chip">❄ заморожены</span>';
  if (cows.some(o => o.team === 1 && o.freeze > 0)) t += '<span class="chip">🔔 соперники стоят</span>';
  if (t !== chipTxt) { chipTxt = t; $('chips').innerHTML = t; }
}

// ================== Повтор гола ==================
let rec = [], recTick = 0, replayFrames = null, replayIdx = 0;
function recordFrame() {
  if ((recTick++ & 1) !== 0) return;
  const f = new Float32Array(cows.length * 5 + 4); let i = 0;
  cows.forEach(c => { f[i++] = c.x; f[i++] = c.y; f[i++] = c.vx; f[i++] = c.vy; f[i++] = c.ang; });
  f[i++] = ball.x; f[i++] = ball.y; f[i++] = ball.vx; f[i++] = ball.vy;
  rec.push(f); if (rec.length > 110) rec.shift();
}
function startReplay() {
  ball.h = ball.vh = 0;
  replayFrames = rec.slice(); replayIdx = 0; bannerEl().innerHTML = ''; clearParticles();
  $('replayTag').classList.remove('hide'); setState('replay'); SFX.whistle(0.2);
}
function applyReplay(dt) {
  replayIdx += dt * 0.5 * 0.55;
  if (replayIdx >= replayFrames.length - 1) return endReplay();
  const i = Math.floor(replayIdx), t = replayIdx - i, a = replayFrames[i], b = replayFrames[i + 1]; let k = 0;
  cows.forEach(c => { c.x = lerp(a[k], b[k], t); c.y = lerp(a[k + 1], b[k + 1], t); c.vx = a[k + 2]; c.vy = a[k + 3]; c.ang = a[k + 4]; k += 5; });
  ball.x = lerp(a[k], b[k], t); ball.y = lerp(a[k + 1], b[k + 1], t); ball.vx = a[k + 2]; ball.vy = a[k + 3];
}
function endReplay() { $('replayTag').classList.add('hide'); afterGoal(); }
const bannerEl = () => $('banner');

// ================== Ход матча ==================
function setCenter(t) { const el = $('center'); if (setCenter.last !== t) { setCenter.last = t; el.innerHTML = t ? `<span>${t}</span>` : ''; } }
function updateHUD() {
  const s = [$('s0'), $('s1'), $('tm')], t = Math.max(0, Math.ceil(timeLeft)), ts = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  if (updateHUD.a !== score[0]) { s[0].textContent = score[0]; updateHUD.a = score[0]; }
  if (updateHUD.b !== score[1]) { s[1].textContent = score[1]; updateHUD.b = score[1]; }
  if (updateHUD.t !== ts) { s[2].textContent = ts; updateHUD.t = ts; }
  const boardKey = `${score[0]}:${score[1]}:${ts}:${sideTeam[0].id}:${sideTeam[1].id}`;
  if (updateHUD.board !== boardKey) { drawStadiumScoreboard(); updateHUD.board = boardKey; }
}
function startMatchNow(cfg) {
  Object.assign(matchCfg, cfg || {}); matchCfg.formB = pickAIForm(matchCfg); matchCfg.styleB = pickAIStyle(); buildMatch(matchCfg);
  score = [0, 0]; timeLeft = settings.time; matchFrames = 0; stats = newStats(); lastMinute = false; rec = []; recTick = 0;
  clearParticles(); bannerEl().innerHTML = ''; chipTxt = ''; $('chips').innerHTML = '';
  applyEnv(settings.tod, settings.weather); introEv = {}; beginReady(true);
}
const INTRO = { P1: 270, P2: 640, P3: 730, TOT: 880 };   // выход из тоннеля, стартовые составы, капитаны и рукопожатие, отсчёт 3-2-1
function lineupHTML() {
  const side = (ti) => {
    const tm = sideTeam[ti], list = cows.filter(c => c.team === ti), ord = { gk: 0, df: 1, mf: 2, fw: 3 };
    list.sort((a, b) => ord[a.role] - ord[b.role] || a.num - b.num);
    const n = r => list.filter(c => c.role === r).length, form = [n('df'), n('mf'), n('fw')].filter(x => x > 0).join('-');
    const rl = { gk: 'ВРТ', df: 'ЗАЩ', mf: 'ПЗ', fw: 'НАП' };
    return `<div class="lu" style="--tc:${hex(sideKit[ti])}"><div class="luH"><span>${tm.nation ? tm.flag : '🐄'}</span><b>${tm.name}</b><em>${form || ''}</em></div>${list.map((c, i) => `<div class="luR" style="--d:${i * 70}ms"><i>${c.num}</i><span>${c.pname}</span><small>${rl[c.role] || ''}</small></div>`).join('')}<div class="luF">Стартовый состав</div></div>`;
  };
  return `<div class="lineup">${side(0)}<div class="luVs">VS</div>${side(1)}</div>`;
}
const ezs = p => { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
const plate = (t, col, sub) => `<div class="gb s" style="--tc:${hex(col)}"><div><div class="gt">${t.nation ? t.flag + ' ' : '🐄 '}${t.name}</div><div class="gs">${sub}</div></div></div>`;
function assignLk() { const n = [0, 0]; cows.forEach(c => { c.lk = n[c.team]++; }); }
function ensureTunnelEntrance(){
  if(scene.getObjectByName('CowballTunnelEntrance')) return;
  const g=new THREE.Group(); g.name='CowballTunnelEntrance';
  const dark=new THREE.MeshStandardMaterial({color:0x101b2a,roughness:.92}), trim=new THREE.MeshStandardMaterial({color:0x9baec4,metalness:.25,roughness:.6});
  const z=hz+3.2, x=0;
  const back=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.1,.35),dark); back.position.set(x,1.55,z); g.add(back);
  const left=new THREE.Mesh(new THREE.BoxGeometry(.35,3.5,.55),trim); left.position.set(-2.7,1.75,z+.12); g.add(left);
  const right=left.clone(); right.position.x=2.7; g.add(right);
  const top=new THREE.Mesh(new THREE.BoxGeometry(5.7,.35,.6),trim); top.position.set(0,3.45,z+.12); g.add(top);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(5.2,7),new THREE.MeshLambertMaterial({color:0x263444})); floor.rotation.x=-Math.PI/2; floor.position.set(0,.012,z+2.5); g.add(floor);
  // v28: боковые стены, потолок, световая полоса и разметка пола (общие материалы, 7 мешей, без работы в кадре)
  const wallM=new THREE.MeshLambertMaterial({color:0x182436}), lightM=new THREE.MeshBasicMaterial({color:0xcfe8ff}), lineM=new THREE.MeshBasicMaterial({color:0xb8ff3d});
  [-2.55,2.55].forEach(sx=>{const w=new THREE.Mesh(new THREE.BoxGeometry(.2,3.2,7),wallM); w.position.set(sx,1.6,z+3.5); g.add(w);});
  const roof=new THREE.Mesh(new THREE.BoxGeometry(5.3,.2,7),wallM); roof.position.set(0,3.3,z+3.5); g.add(roof);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.4,.06,6.4),lightM); strip.position.set(0,3.17,z+3.5); g.add(strip);
  [-1.2,1.2].forEach(lx=>{const ln=new THREE.Mesh(new THREE.BoxGeometry(.08,.015,6.6),lineM); ln.position.set(lx,.02,z+3.4); g.add(ln);});
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); scene.add(g);
}
function beginReady(full) {
  if(full) ensureTunnelEntrance();
  introFull = !!full; introT = 0; introEv = {}; lastCount = 0; readyT = full ? INTRO.TOT : 150; assignLk();
  cows.forEach(c => {
    c.faceAng = undefined;
    if (full) {   // обе команды выходят из тоннеля у ближней трибуны и строятся шеренгами лицом к камере
      c.introTargetX = c.x; c.introTargetY = c.y;
      c.lx = W / 2 + (c.team ? 1 : -1) * (30 + c.lk * 27); c.ly = H / 2 + 58;
      c.introStartX = W / 2 + (c.team ? 14 : -14); c.introStartY = FY + FH + 180 * fieldVisualScale; c.x = c.introStartX; c.y = c.introStartY; c.g.visible = true;
    } else c.g.visible = true;
  });
  setState('ready'); resetInputs();
  if (full) Audio_.music.play('match'); else Audio_.music.stop();
}
function startKickoff() {
  introFull = false;
  cows.forEach(c => { c.faceAng = undefined; c.g.visible = true; delete c.introTargetX; });
  // Matchday soundtrack ends before the first whistle; only stadium ambience and gameplay SFX remain.
  Audio_.music.stop(); Audio_.crowd(0.6);
  ball.x = W / 2; ball.y = H / 2; ball.h = ball.vh = 0; ball.vx = ball.vy = 0; ball.carrier = null; ball.holder = null;
  bannerEl().innerHTML = ''; setCenter(''); setState('play'); flashT = 55; SFX.kickoff(); say('kickoff');
}
function stepIntro(dt) {
  introT += dt; const T = introT, I = INTRO, nT = Math.max(1, cows.filter(o => o.team === 0).length), dur = I.P1 - 8 * (nT - 1) - 10, ev = introEv, tA = sideTeam[0], tB = sideTeam[1];
  cows.forEach(c => {
    const ox = c.x, oy = c.y, dly = c.lk * 8; let tx, ty;
    if (T < I.P2) { const p = ezs((T - dly) / dur); tx = lerp(c.introStartX, c.lx, p); ty = lerp(c.introStartY, c.ly, p); }
    else if (T < I.P3) { const p = ezs((T - I.P2) / (I.P3 - I.P2)); tx = lerp(c.lx, c.introTargetX, p); ty = lerp(c.ly, c.introTargetY, p); }
    else { tx = c.introTargetX; ty = c.introTargetY; }
    c.x = tx; c.y = ty; c.g.visible = true;
    if (T >= I.P3) c.vx = c.vy = 0; else { c.vx = (c.x - ox) / Math.max(dt, 0.001); c.vy = (c.y - oy) / Math.max(dt, 0.001); }
    c.faceAng = (T >= dly + dur && T < I.P2) ? -Math.PI / 2 : (T >= I.P3 ? (c.team ? Math.PI : 0) : undefined);
  });
  if (!ev.a) { ev.a = 1; Audio_.crowd(0.55); SFX.cheer(0.5, 3); SFX.anthem(); bannerEl().innerHTML = `<div class="gb s" style="--tc:${hex(sideKit[0])}"><div><div class="gt">КОМАНДЫ ВЫХОДЯТ ИЗ ТОННЕЛЯ</div><div class="gs">Предматчевое представление · Cowball Stadium</div></div></div>`; }
  if (T >= I.P1 && !ev.b) { ev.b = 1; SFX.cheer(0.7, 4); Audio_.swell(0.6, 4); bannerEl().innerHTML = lineupHTML(); }
  if (T >= I.P2 - 70 && !ev.c) { ev.c = 1; SFX.coinToss(); bannerEl().innerHTML = `<div class="gb s" style="--tc:${hex(sideKit[0])}"><div><div class="gt">КАПИТАНЫ У СУДЬИ</div><div class="gs">Выбор стороны поля и права первого удара</div></div></div>`; }
  if (T >= I.P2 && !ev.d) { ev.d = 1; SFX.handshake(); SFX.whistle(0.25); Audio_.swell(0.42, 2.5); bannerEl().innerHTML = `<div class="gb s" style="--tc:${hex(sideKit[1])}"><div><div class="gt">ПРИВЕТСТВИЕ ПЕРЕД МАТЧЕМ</div><div class="gs">${tA.nation ? tA.flag + ' ' : ''}${tA.name} · ${tB.nation ? tB.flag + ' ' : ''}${tB.name} · fair play</div></div></div>`; }
  if (T >= I.P3) { if (!ev.e) { ev.e = 1; bannerEl().innerHTML = ''; } const n = Math.max(1, Math.ceil((I.TOT - T) / 50)); if (n !== lastCount) { lastCount = n; SFX.beep(false); } setCenter(String(n)); if (T >= I.TOT) startKickoff(); } else setCenter('');
}
// --- завершение матча: три свистка, рукопожатия, празднование победителя ---
function beginOutro() {
  setCenter(''); assignLk(); SFX.whistle(0.9); setTimeout(() => SFX.whistle(0.9), 450); setTimeout(() => SFX.whistle(1.2), 900);
  Audio_.crowd(0.5); ball.carrier = null; ball.holder = null; outroT = 0; outroGreet = false; outroCheer = false;
  outroWinner = score[0] === score[1] ? -1 : (score[0] > score[1] ? 0 : 1);
  cows.forEach(c => { c.ox = c.x; c.oy = c.y; c.faceAng = undefined; c.ctrl = null; });
  resetInputs(); setState('outro');
  const tA = sideTeam[0], tB = sideTeam[1];
  const finalName = t => `${t.nation ? t.flag + ' ' : ''}${t.name}`;
  const finalTitle = outroWinner < 0 ? 'НИЧЬЯ' : 'ПОБЕДА!';
  const finalSub = outroWinner < 0 ? 'ФИНАЛЬНЫЙ СВИСТОК' : `${finalName(sideTeam[outroWinner])} · ФИНАЛЬНЫЙ СВИСТОК`;
  bannerEl().innerHTML = `<div class="gb" style="--tc:${hex(outroWinner >= 0 ? sideKit[outroWinner] : 0xffffff)}"><div><div class="gt">${finalTitle}</div><div class="gs">${finalName(tA)} ${score[0]} : ${score[1]} ${finalName(tB)}<br>${finalSub}</div></div></div>`;
}
function stepOutro(dt) {
  outroT += dt; const T = outroT, A = 70, B = 230, C = 340, END = outroWinner >= 0 ? 520 : 400;
  const teamCounts = [cows.filter(o => o.team === 0).length, cows.filter(o => o.team === 1).length];
  cows.forEach(c => {
    const ox = c.x, oy = c.y, n = teamCounts[c.team], sx = W / 2 + (c.team ? 16 : -16) * fieldVisualScale, sy = H / 2 + (c.lk - (n - 1) / 2) * 28 * fieldVisualScale, p = ezs((T - A) / (B - A));
    c.x = lerp(c.ox, sx, p); c.y = lerp(c.oy, sy, p); c.vx = (c.x - ox) / Math.max(dt, 0.001); c.vy = (c.y - oy) / Math.max(dt, 0.001);
    c.faceAng = T >= B ? ((T >= C && outroWinner >= 0) ? -Math.PI / 2 : (c.team ? Math.PI : 0)) : undefined;   // две шеренги лицом друг к другу, затем к трибунам
  });
  outroGreet = T >= B && T < C;
  if (T >= B && !introEv.o1) { introEv.o1 = 1; bannerEl().innerHTML = ''; SFX.cheer(0.5, 2.5); }
  if (T >= C && outroWinner >= 0) {
    if (!outroCheer) { outroCheer = true; lastScorer = outroWinner; celeb = cows.find(c => c.team === outroWinner && c.role !== 'gk'); goalT = 0; goalFx = 0; burstConfetti(sideTeam[outroWinner].c1); SFX.cheer(0.9, 4); SFX.horn(); }
    goalT += dt; if (goalT > goalFx * 28) { goalFx++; spawnFirework((Math.random() - 0.5) * 30, 7 + Math.random() * 6, -4 - Math.random() * 6, [sideTeam[outroWinner].c1, 0xffffff, 0xb8ff3d][goalFx % 3]); }
  }
  if (T >= END) finishMatchNow();
}
function pauseGame() { if (state === 'play' || state === 'ready') { pauseGame.from = state; setState('paused'); resetInputs(); } }
function resumeGame() { if (state === 'paused') setState(pauseGame.from || 'play'); }
function goal(team) {
  if (!(ball.onTarget > 0 && ball.shotSide === team)) { stats.shots[team]++; stats.on[team]++; }
  netHit(team, ball.y, ball.h || 0, Math.hypot(ball.vx, ball.vy)); score[team]++; lastScorer = team; goalT = 0; goalFx = 0; resetInputs(); replayFrames = null;
  celeb = (lastTouch && lastTouch.team === team) ? lastTouch : cows.filter(c => c.team === team).sort((a, b) => dBall(a) - dBall(b))[0];
  setState('goal'); lightPulse = 1; addShake(0.7); goalFlash(); SFX.whistle(0.5); SFX.horn(); SFX.goal(sPan(ball.x)); SFX.cheer(0.6, 3.2); Audio_.music.stop();
  setTimeout(() => SFX.creature(sideTeam[team].kind, true, 0), 300);
  if (settings.vib && navigator.vibrate) navigator.vibrate(220);
  burstConfetti(sideTeam[team].c1); say('goal', true);
  const col = hex(sideTeam[team].c1);
  bannerEl().innerHTML = `<div class="gb" style="--tc:${col}"><div><div class="gt">ГОЛ!</div><div class="gs">${celeb && celeb.pname ? celeb.pname + ' · ' : ''}${sideTeam[team].name} · ${score[0]} : ${score[1]}</div></div></div>`;
}
function afterGoal() {
  bannerEl().innerHTML = ''; clearParticles();
  if (timeLeft <= 0) endMatch(); else { resetPositions(); beginReady(false); }
}
function endMatch() { beginOutro(); }
function finishMatchNow() {
  setCenter(''); bannerEl().innerHTML = ''; introEv = {}; cows.forEach(c => { c.faceAng = undefined; }); Audio_.crowd(0.2); settings.played++; if (!matchCfg.versus) settings.goals += score[0];
  try { const a = matchCfg.tA.id, b = matchCfg.tB.id, k = [a, b].sort().join('|'), h = settings.h2h || (settings.h2h = {}), r = h[k] || (h[k] = {}); if (score[0] > score[1]) r[a] = (r[a] | 0) + 1; else if (score[1] > score[0]) r[b] = (r[b] | 0) + 1; else r.d = (r.d | 0) + 1; } catch (e) {}
  save();
  setState('end'); onMatchEnd({ score: score.slice(), stats, cfg: matchCfg });
}
function stepGame(dt) {
  clock += dt;
  if (state === 'ready') {
    readyT -= dt;
    if (introFull) stepIntro(dt);
    else {   // быстрый перезапуск после гола: позиции уже расставлены, только отсчёт
      const n = Math.max(1, Math.ceil(readyT / 50)); if (n !== lastCount) { lastCount = n; SFX.beep(false); } setCenter(String(n));
      cows.forEach(c => { c.vx = c.vy = 0; });
      if (readyT <= 0) startKickoff();
    }
  } else if (state === 'play') {
    matchFrames += dt; timeLeft -= dt / 60;
    if (flashT > 0) { flashT -= dt; setCenter('ВПЕРЁД!'); } else setCenter('');
    if (!lastMinute && closingIntensity() > 0) { lastMinute = true; say('last', true); }
    computeTeamInfo(); cows.forEach(c => updateCow(c, dt));
    for (let i = 0, n = Math.max(1, Math.ceil(dt / 1.01)); i < n && state === 'play'; i++) { updateBall(dt / n); if (state === 'play') collide(); }
    if (state === 'play') {
      updatePickups(dt); if (lastTouch) stats.poss[lastTouch.team] += dt; recordFrame(); renderChips();
      if (timeLeft <= 0) { timeLeft = 0; endMatch(); }
    }
    if ((matchFrames & 15) === 0) { const near = 1 - Math.min(Math.abs(ball.x - FX), Math.abs(ball.x - FX - FW)) / 260; Audio_.crowd(0.3 + 0.5 * Math.max(0, near)); }
  } else if (state === 'goal') {
    setCenter(''); goalT += dt; ballInNet(dt); cows.forEach(c => { c.vx *= 0.9; c.vy *= 0.9; });
    if (goalT > goalFx * 28) { goalFx++; spawnFirework((Math.random() - 0.5) * 30, 7 + Math.random() * 6, -4 - Math.random() * 6, [sideTeam[lastScorer].c1, 0xffffff, 0xb8ff3d][goalFx % 3]); }
    if (goalT >= 190) { if (settings.replay && rec.length > 20) startReplay(); else afterGoal(); }
  } else if (state === 'replay') { applyReplay(dt); }
  else if (state === 'outro') { stepOutro(dt); }
}

// ================== Анимация, зрители, камера ==================
const camPos = new THREE.Vector3(0, 17, 16), camLook = new THREE.Vector3(0, 0, 0.5), tP = new THREE.Vector3(), tL = new THREE.Vector3();
const qTmp = new THREE.Quaternion(), axTmp = new THREE.Vector3();
const CAMS = [[17, 15], [11.5, 10], [27, 6]];
function cowAnimExtra(c, spd, dt) {   // надстройка над базовой анимацией: стили бега, торможение, ведение, стойка, празднование
  const run = clamp((spd - 1.2) / 1.4, 0, 1), spr = clamp((spd - 2.5) / 0.8, 0, 1), ph = c.phase, fx = effParts();
  if (c.xs === undefined) c.xs = spd;
  const acc = (spd - c.xs) / Math.max(dt, 0.25); c.xs = spd;
  if (acc < -0.07 && spd > 0.9) c.skid = 1; else if (c.skid > 0) c.skid = Math.max(0, c.skid - 0.07 * dt);
  const sk = c.skid || 0, drib = ball.carrier === c && state === 'play';
  const jockey = state === 'play' && ball.carrier && ball.carrier.team !== c.team && c.role !== 'gk' && spd < 1.6 && dBall(c) < 95;
  c.legs.forEach((lg, i) => {
    lg.rotation.z *= 1 + 0.35 * run;                                                                  // шаг шире на бегу
    lg.position.y += Math.max(0, Math.cos(ph + (i === 0 || i === 3 ? 0 : Math.PI))) * 0.05 * run;   // выше подъём ног
    if (sk > 0 && i < 2) lg.rotation.z += 0.5 * sk;                                                   // торможение юзом
    if (jockey) lg.rotation.z += Math.sin(clock * 0.5 + i * Math.PI) * 0.18;                         // защитная стойка: мелкие шаги
  });
  const bn = Math.abs(Math.sin(ph * 2));
  c.lift += bn * 0.05 * run + bn * 0.04 * spr - (jockey ? 0.07 : 0);
  c.hd += Math.sin(ph * 2) * 0.08 * run - 0.1 * spr - (drib ? 0.05 : 0);
  c.body.rotation.z += -0.08 * spr + 0.18 * sk - (jockey ? 0.06 : 0);
  c.body.rotation.x += (drib ? Math.sin(ph) * 0.07 : 0) + (spd < 0.12 ? Math.sin(clock * 0.03 + (c.lk || 0)) * 0.015 : 0);   // ведение: покачивание корпуса; в покое — «дыхание»
  c.body.rotation.y = 0; c.hopY = 0;
  if (state === 'goal' && c === celeb) {   // разные празднования автора гола
    const v = (score[0] + score[1]) % 4;
    if (v === 1) c.body.rotation.y = goalT * 0.3; else if (v === 2) c.hopY = Math.abs(Math.sin(goalT * 0.35)) * 0.45; else if (v === 3) c.body.rotation.z += -0.9 * Math.min(1, goalT / 20);
  }
  if (spr > 0.3 && fx && (c.dT = (c.dT || 0) + dt) > 5) { c.dT = 0; grassPool.spawn(wx(c.x), 0.1, wz(c.y), -c.vx * 0.012, 0.025, -c.vy * 0.012, 0xcdb98a, 16); }   // пыль со спринта
  if (sk > 0.8 && fx) scatterGrass(c, 2, 0.04);
}
function cowAnim(c, spd, dt) {
  if (c.rA === undefined) { c.rA = 0; c.lean = 0; c.turn = 0; c.pang = c.ang; c.pspd = spd; c.hd = 0; c.lift = 0; c.kE = 0; c.stum = c.stum || 0; }
  const gait = Math.min(1, spd / 2.0), d = Math.max(dt, 0.25), sm = b => 1 - Math.pow(b, dt);
  c.phase += spd * (0.09 + 0.03 * gait) * dt;                                    // бег: частота растёт с скоростью
  c.rA += ((spd > 0.12 ? gait * 0.82 : 0) - c.rA) * sm(0.8);                     // плавный разгон/остановка ног
  const acc = (spd - c.pspd) / d; c.pspd = spd;
  let da = c.ang - c.pang; da = Math.atan2(Math.sin(da), Math.cos(da)); c.pang = c.ang;
  c.turn += (clamp(da / d * 3, -0.3, 0.3) - c.turn) * sm(0.75);                  // крен в повороте
  c.lean += (clamp(-(gait * 0.08 + acc * 0.8), -0.2, 0.2) - c.lean) * sm(0.8);   // наклон вперёд при разгоне, назад при торможении
  const k = c.kickAnim > 0 ? c.kickAnim : 0; if (k > 0) c.kickAnim = Math.max(0, k - 0.09 * dt);
  c.kE += (k - c.kE) * sm(0.35); const e = c.kE, kl = c.kickLeg || 0, kind = c.kickKind || 'kick';
  const sw = kind === 'pass' ? 0.36 : kind === 'touch' ? 0.4 : kind === 'shot' ? 1.5 : 1.1;
  const kLean = kind === 'shot' ? -0.22 * e : kind === 'kick' ? -0.1 * e : kind === 'pass' ? -0.03 * e : 0;
  const drib = ball.carrier === c && state === 'play';
  c.legs.forEach((lg, i) => {
    const a = c.phase + (i === 0 || i === 3 ? 0 : Math.PI); let r = Math.sin(a) * c.rA;
    if (i === kl) r += e * sw; else if (kind === 'shot') r -= e * (i < 2 ? 0.4 : 0.3);
    if (drib && i < 2) r += Math.max(0, Math.sin(c.phase * 2 + i * Math.PI)) * 0.3;  // ведение: короткие касания
    lg.rotation.z = r; lg.position.y = 0.62 + Math.max(0, Math.cos(a)) * 0.045 * c.rA + (i === kl ? e * 0.06 : 0);
  });
  if (c.stum > 0) c.stum = Math.max(0, c.stum - 0.04 * dt);                      // столкновение: спотыкание
  const st = c.stum, stL = Math.sin(st * Math.PI) * 0.35, stR = Math.sin(st * 14) * 0.12 * st;
  c.body.rotation.z = c.lean + kLean + stL; c.body.rotation.x = -c.turn + stR;
  c.hd = -(kind === 'shot' ? 0.2 : 0.12) * e - (drib ? 0.08 : 0) - stL * 0.4; c.lift = kind === 'shot' ? e * 0.07 : 0;
}
function syncScene(dt) {
  dt = Math.min(dt, 3);
  referee.visible = false;
  const cheer = state === 'goal' || (state === 'outro' && outroCheer);
  cows.forEach((c, idx) => {
    const spd = Math.hypot(c.vx, c.vy);
    let target = null;
    if (c.role === 'gk') target = c.team === 0 ? 0 : Math.PI; else if (spd > 0.4) target = -Math.atan2(c.vy, c.vx);
    if (c.faceAng !== undefined) target = c.faceAng;
    const prevAngV28 = c.ang;
    if (target !== null) { let da = target - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); c.ang += clamp(da * Math.min(1, 0.2 * dt), -0.3 * dt, 0.3 * dt); }
    // v28: наклон корпуса в повороте — связан с реальной угловой скоростью и скоростью бега
    { const turnV = Math.atan2(Math.sin(c.ang - prevAngV28), Math.cos(c.ang - prevAngV28)) / Math.max(dt, 0.25), want = clamp(-turnV * 1.6, -0.22, 0.22) * Math.min(1, spd / 1.5);
      c.lean = (c.lean || 0) + (want - (c.lean || 0)) * Math.min(1, 0.25 * dt); }
    cowAnim(c, spd, dt); cowAnimExtra(c, spd, dt);
    let jump = 0, flip = 0, headDown = 0, roll = 0;
    if (cheer) {
      if (state === 'outro') {
        if (c.team === lastScorer) jump = Math.abs(Math.sin(clock * 0.21 + idx)) * (c === celeb ? 0.62 : 0.08);
        else headDown = -0.42;
      } else if (c.team === lastScorer) {
        jump = Math.abs(Math.sin(clock * 0.26 + idx)) * (c === celeb ? 1.3 : 0.8);
        if (c === celeb && goalT < 48) { const p = goalT / 48; flip = -p * Math.PI * 2; jump = Math.sin(p * Math.PI) * 2.2; }
      } else headDown = -0.7;
    }
    if (state === 'outro' && outroGreet) jump = Math.abs(Math.sin(clock * 0.22 + idx * 0.7)) * 0.2;   // рукопожатие: лёгкие подпрыгивания
    if (ball.holder === c) headDown = -0.35;
    if (c.diveT > 0 || c.getUp > 0) {
      let kk;
      if (c.diveT > 0) { const pr = 1 - c.diveT / 26; kk = Math.min(1, pr * 2.4); kk = kk * kk * (3 - 2 * kk); jump = Math.sin(Math.min(1, pr * 1.3) * Math.PI) * 0.55; }   // бросок: быстро ложится в сторону и подпрыгивает
      else kk = Math.min(1, c.getUp / 20);                                                                                                                     // лежит, затем плавно встаёт
      roll = c.diveDir * (Math.cos(c.ang) >= 0 ? 1 : -1) * 1.3 * kk;
    }
    const bob = Math.abs(Math.sin(c.phase * 2)) * 0.085 * Math.min(1, spd / 1.8) + (spd < 0.3 ? Math.sin(clock * 0.06 + idx) * 0.012 : 0);
    c.body.position.y = -1 + bob + c.lift; c.fl.rotation.z = flip; c.fl.rotation.x = roll + ((c.diveT > 0 || c.getUp > 0) ? 0 : (c.lean || 0));
    c.head.rotation.z = headDown || (Math.sin(c.phase) * 0.05 + c.hd); c.tail.rotation.x = Math.sin(clock * 0.2 + idx) * 0.3;
    if (c.arms) c.arms.forEach((a, ai) => { const pose = c.diveT > 0 ? 1 : (ball.holder === c ? 0.7 : 0); a.rotation.x = pose ? (ai === 0 ? -0.8 : 0.8) * pose : Math.sin(clock * 0.045 + ai * Math.PI) * 0.08; a.rotation.z = pose ? (ai === 0 ? -0.45 : 0.45) : 0; });
    if (state === 'play') grassFx(c, spd, dt);
    const tx = wx(c.x), tz = wz(c.y);
    if (c.rx === undefined || Math.hypot(tx - c.rx, tz - c.rz) > 1.5) { c.rx = tx; c.rz = tz; } else { const ks = 1 - Math.pow(0.48, dt); c.rx += (tx - c.rx) * ks; c.rz += (tz - c.rz) * ks; }
    const diveGroundClearance = Math.abs(Math.sin(roll)) * 0.24; const cowVertical = Math.max(0.085, 0.065 + Math.max(0, jump + (c.hopY || 0)) + ((c.diveT > 0 || c.getUp > 0) ? 0.045 : 0) + diveGroundClearance);
    c.g.position.set(c.rx, cowVertical, c.rz); c.g.rotation.y = c.ang;
    c.shadow.position.set(wx(c.x), 0.03, wz(c.y)); c.shadow.scale.set(1.3 - jump * 0.25, 0.9 - jump * 0.18, 1);
  });
  const showM = state !== 'menu' && state !== 'pens';
  markers.forEach((m, i) => {
    const p = players[i], on = showM && p && p.cow; m.r.visible = m.a.visible = !!on; if (!on) return;
    const c = p.cow; m.r.position.set(wx(c.x), 0.04, wz(c.y)); m.a.position.set(wx(c.x), 2.7 + Math.sin(clock * 0.12) * 0.15, wz(c.y)); m.a.rotation.y = clock * 0.05;
  });
  ballMesh.position.set(wx(ball.x), BRW * BVIS + (ball.h || 0), wz(ball.y)); ballShadow.position.set(wx(ball.x), 0.03, wz(ball.y));
  ballGlow.visible = !!settings.glow && ball.fire > 0; if (ball.fire > 0) ballGlow.rotation.y = clock;
  updateTrail(dt);
  const bsp = Math.hypot(ball.vx, ball.vy) * S * dt;
  if (bsp > 0.0005) { axTmp.set(ball.vy, 0, -ball.vx).normalize(); qTmp.setFromAxisAngle(axTmp, bsp / (BRW * BVIS)); ballMesh.quaternion.premultiply(qTmp); }
  const bX = wx(ball.x), bZ = wz(ball.y);
  specTick ^= 1;   // зрители обновляются через одного: вдвое меньше работы за кадр
  spectators.forEach((s, si) => {
    if ((si & 1) !== specTick) return;
    let a = Math.atan2(bX - s.px, bZ - s.pz) - s.rot; a = Math.atan2(Math.sin(a), Math.cos(a));
    s.head.rotation.y += (clamp(a, -0.9, 0.9) - s.head.rotation.y) * 0.2 * dt;
    let y = s.base + Math.sin(clock * 0.05 + s.ph) * 0.02, up = 0, nod = 0;
    if (cheer) { if (s.fan === lastScorer) { y += Math.abs(Math.sin(clock * 0.3 + s.ph)) * 0.5; up = 1; } else nod = 0.35; }
    s.g.position.y = y; s.head.rotation.x = nod; const gm = up ? s.geoU : s.geoD; if (s.body.geometry !== gm) s.body.geometry = gm;
  });
  // камера
  if (state === 'menu') { const th = Math.sin(clock * 0.006) * 0.55; tP.set(Math.sin(th) * 11.5, 4.2, Math.cos(th) * 11.5); tL.set(-3.6, 1.1, 0); }
  else if (state === 'ready' && introFull && introT < 0) { ceremonyCam(); }
  else if (state === 'ready' && introFull) {   // телевизионные планы: общий с высоты, выход из тоннеля, лица игроков, расход по позициям
    const T = introT, I = INTRO, l3 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)]; let p, l;
    if (T < I.P1) { p = l3([0, 22, 38], [-6, 7, 22.5], ezs(T / I.P1)); l = [0, 0.8, 4]; }
    else if (T < I.P2) { p = l3([-6, 7, 22.5], [5, 6.2, 20], (T - I.P1) / (I.P2 - I.P1)); l = [0, 1.2, 2.8]; }
    else if (T < I.P3) { const k = ezs((T - I.P2) / (I.P3 - I.P2)); p = l3([5, 6.2, 20], [0, 13, 17], k); l = [0, 0.8 * (1 - k), 2.8 * (1 - k)]; }
    else { p = [0, 12, 18]; l = [0, 0, 0.3]; }
    tP.set(p[0] * fieldVisualScale, p[1] * (1 + 0.22 * (fieldVisualScale - 1)), p[2] * fieldVisualScale); tL.set(l[0] * fieldVisualScale, l[1], l[2] * fieldVisualScale);
  }
  else if (state === 'outro') { tP.set(Math.sin(outroT * 0.005) * 6 * fieldVisualScale, (4.2 + Math.min(1, outroT / 300) * 1.5) * (1 + 0.22 * (fieldVisualScale - 1)), 11.5 * fieldVisualScale); tL.set(0, 1.1, 0); }
  else if (state === 'pens' && penCamFn) penCamFn(tP, tL);
  else if (state === 'goal' && celeb) { tP.set(wx(celeb.x) + Math.sin(clock * 0.01) * 3, 4.8, wz(celeb.y) + 9); tL.set(wx(celeb.x), 1.3, wz(celeb.y)); }
  else if (state === 'replay') { tP.set(clamp(bX * 0.6, -12, 12), 5.5, 13.5); tL.set(bX, 0.8, 0); }
  else {
    const cm = CAMS[settings.cam] || CAMS[0], follow = settings.cam === 1 ? 0.8 : 0.5, lim = (settings.cam === 1 ? 14 : 9) * fieldVisualScale, tx = clamp(bX * follow, -lim, lim);
    tP.set(tx, cm[0] * camF * (settings.cameraHeight / 100) * (1 + 0.24 * (fieldVisualScale - 1)), cm[1] * camF * (settings.cameraDistance / 100) * fieldVisualScale + 1); tL.set(tx * 0.9, 0, 0.5 + (settings.cam === 1 ? bZ * 0.3 : 0));
  }
  const smooth = clamp(100 / settings.cameraSmooth, 0.5, 1.8);
  const kk = 1 - Math.pow(1 - clamp((state === 'play' || state === 'ready' ? 0.09 : 0.05) * smooth, 0.02, 0.2), dt);
  if (tP.z > hz + 2.6 && tP.z < hz + 9 && tP.y < 5.6) tP.y = 5.6;   // низкая камера не заходит в ближнюю трибуну
  camPos.lerp(tP, kk * 0.58); camLook.lerp(tL, kk * 0.58);
  if (camPos.z > hz + 2.6 && camPos.z < hz + 9 && camPos.y < 5.2) camPos.y = 5.2;
  camera.position.copy(camPos);
  if (shake > 0.01) { camera.position.x += (Math.random() - 0.5) * shake * 0.35; camera.position.y += (Math.random() - 0.5) * shake * 0.25; shake *= Math.pow(0.9, dt); }   // тряска при ударах и голах
  camera.lookAt(camLook);
  updateParticles(dt); updateFx(dt); updateNets(dt); updateInstancedCrowd(dt); updatePName();
  // экранные кнопки: кольца заряда и сил
  if (touchUIOn() && (state === 'play' || state === 'ready')) {
    const p = players[0]; if (p) {
      const kc = Math.round(p.charge * 100), sc = Math.round(p.stamina * 100);
      if (syncScene.kc !== kc) { $('bKick').style.setProperty('--p', kc); syncScene.kc = kc; }
      if (syncScene.sc !== sc) { $('bSprint').style.setProperty('--p', sc); syncScene.sc = sc; }
    }
  }
}

// ================== Турниры ==================
const COMPS = {
  league: { name: 'Молочная лига',   icon: '🥛', theme: 'th-league', desc: '8 команд, каждый с каждым' },
  cup:    { name: 'Кубок Рога',      icon: '🏆', theme: 'th-cup',    desc: 'Плей-офф: 1/4, 1/2 финала, финал' },
  ucl:    { name: 'Лига Чемпионов',  icon: '⭐', theme: 'th-ucl',    desc: 'Общий этап и плей-офф' },
  world:  { name: 'Чемпионат мира',  icon: '🌍', theme: 'th-world',  desc: 'Только национальные сборные' },
  league_premier: { name: 'Премьер-лига', icon: '⚡', theme: 'th-ucl', desc: '4 топ-клуба Англии' },
  league_laliga: { name: 'Ла Лига', icon: '☀️', theme: 'th-cup', desc: '4 топ-клуба Испании' },
  league_bundesliga: { name: 'Бундеслига', icon: '🛡️', theme: 'th-league', desc: '4 топ-клуба Германии' },
  league_seriea: { name: 'Серия A', icon: '🌑', theme: 'th-world', desc: '4 топ-клуба Италии' },
  league_ligue1: { name: 'Лига 1', icon: '🚀', theme: 'th-cup', desc: '4 топ-клуба Франции' }
};
function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L && k < 12); return k - 1; }
function simScore(a, b) {
  const A = teamPower(teamById(a)), B = teamPower(teamById(b));
  return { ga: Math.min(6, poisson(1.25 * Math.pow(A / B, 0.9))), gb: Math.min(6, poisson(1.25 * Math.pow(B / A, 0.9))) };
}
function simPens(a, b) {
  const pa0 = 0.72 + 0.03 * (teamById(a).pow - 3), pb0 = 0.72 + 0.03 * (teamById(b).pow - 3);
  let pa = 0, pb = 0; for (let i = 0; i < 5; i++) { if (Math.random() < pa0) pa++; if (Math.random() < pb0) pb++; }
  let n = 0; while (pa === pb && n++ < 30) { if (Math.random() < pa0) pa++; if (Math.random() < pb0) pb++; }
  if (pa === pb) pa++;
  return { pa, pb };
}
function rrRounds(ids) {   // «круговая система»: каждый с каждым
  const n = ids.length, arr = ids.slice(), rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const m = []; for (let i = 0; i < n / 2; i++) m.push([arr[i], arr[n - 1 - i]]);
    rounds.push(m); arr.splice(1, 0, arr.pop());
  }
  return rounds;
}
const mkMatch = (a, b, grp) => ({ a, b, ga: 0, gb: 0, pa: 0, pb: 0, done: false, grp: grp || '' });
function matchWinner(m) { if (m.ga !== m.gb) return m.ga > m.gb ? m.a : m.b; return m.pa > m.pb ? m.a : m.b; }

function newComp(type, my) {
  const pool = type === 'world' ? TEAMS.filter(t => t.nation) : type.startsWith('league_') ? TEAMS.filter(t => t.league === type.slice(7)) : TEAMS.filter(t => !t.nation && !t.league);
  const eligible = pool.some(t => t.id === my) ? pool : (pool.length ? pool : TEAMS);
  const ids = type.startsWith('league_') ? shuffle(eligible.map(t => t.id)) : shuffle([my].concat(shuffle(eligible.filter(t => t.id !== my)).slice(0, 7).map(t => t.id)));
  if (!ids.includes(my)) { ids[0] = my; }
  const c = { type, my, ids, rounds: [], cur: 0, done: false, champion: null, out: false };
  if (type === 'league' || type.startsWith('league_')) {
    rrRounds(ids).forEach((r, i) => c.rounds.push({ name: 'Тур ' + (i + 1), ko: false, matches: r.map(p => mkMatch(p[0], p[1], 'L')) }));
  } else if (type === 'ucl') {
    rrRounds(ids).slice(0, 4).forEach((r, i) => c.rounds.push({ name: 'Общий этап, тур ' + (i + 1), ko: false, matches: r.map(p => mkMatch(p[0], p[1], 'L')) }));
  } else if (type === 'world') {
    const A = rrRounds(ids.slice(0, 4)), B = rrRounds(ids.slice(4, 8));
    for (let i = 0; i < 3; i++) c.rounds.push({ name: 'Группы, тур ' + (i + 1), ko: false, matches: A[i].map(p => mkMatch(p[0], p[1], 'A')).concat(B[i].map(p => mkMatch(p[0], p[1], 'B'))) });
  } else {
    c.rounds.push({ name: '1/4 финала', ko: true, matches: [0, 2, 4, 6].map(i => mkMatch(ids[i], ids[i + 1], '')) });
  }
  return c;
}
function compGroups(c) { return c.type === 'world' ? ['A', 'B'] : (c.type === 'cup' ? [] : ['L']); }
function compStandings(c, grp) {
  const t = {};
  c.rounds.forEach(r => r.matches.forEach(m => {
    if (m.grp !== grp) return;
    [m.a, m.b].forEach(id => { if (!t[id]) t[id] = { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    if (!m.done) return;
    const A = t[m.a], B = t[m.b]; A.p++; B.p++; A.gf += m.ga; A.ga += m.gb; B.gf += m.gb; B.ga += m.ga;
    if (m.ga > m.gb) { A.w++; B.l++; A.pts += 3; } else if (m.ga < m.gb) { B.w++; A.l++; B.pts += 3; } else { A.d++; B.d++; A.pts++; B.pts++; }
  }));
  return Object.keys(t).map(k => t[k]).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || (x.id < y.id ? -1 : 1));
}
const compNextMatch = c => { if (c.done || c.out) return null; const r = c.rounds[c.cur]; return r ? (r.matches.find(m => !m.done && (m.a === c.my || m.b === c.my)) || null) : null; };
const compNeedsPens = (c, m) => !!(m && c.rounds[c.cur].ko && m.ga === m.gb);

// Сыграть текущий тур. ures — результат матча игрока: { gm, go, pm, po } (мои голы, чужие, мои/чужие пенальти)
function compPlay(c, ures) {
  const r = c.rounds[c.cur];
  r.matches.forEach(m => {
    if (m.done) return;
    const mine = m.a === c.my || m.b === c.my;
    if (mine && ures) {
      const a = m.a === c.my; m.ga = a ? ures.gm : ures.go; m.gb = a ? ures.go : ures.gm; m.pa = a ? (ures.pm || 0) : (ures.po || 0); m.pb = a ? (ures.po || 0) : (ures.pm || 0);
    } else {
      const s = simScore(m.a, m.b); m.ga = s.ga; m.gb = s.gb;
      if (r.ko && m.ga === m.gb) { const p = simPens(m.a, m.b); m.pa = p.pa; m.pb = p.pb; }
    }
    m.done = true;
  });
  if (r.ko && !r.matches.some(m => matchWinner(m) === c.my && (m.a === c.my || m.b === c.my))) c.out = true;
  compAfterRound(c);
}
function compAfterRound(c) {
  const r = c.rounds[c.cur];
  if (c.cur < c.rounds.length - 1) { c.cur++; return; }
  if (r.name === 'Финал') { c.done = true; c.champion = matchWinner(r.matches[0]); return; }
  if (c.type === 'league' || c.type.startsWith('league_')) { c.done = true; c.champion = compStandings(c, 'L')[0].id; return; }
  let nxt;
  if (r.ko) {
    const w = r.matches.map(matchWinner);
    nxt = w.length === 4 ? { name: '1/2 финала', ko: true, matches: [mkMatch(w[0], w[1]), mkMatch(w[2], w[3])] } : { name: 'Финал', ko: true, matches: [mkMatch(w[0], w[1])] };
  } else if (c.type === 'ucl') {
    const t = compStandings(c, 'L'); nxt = { name: '1/2 финала', ko: true, matches: [mkMatch(t[0].id, t[3].id), mkMatch(t[1].id, t[2].id)] };
  } else {
    const A = compStandings(c, 'A'), B = compStandings(c, 'B'); nxt = { name: '1/2 финала', ko: true, matches: [mkMatch(A[0].id, B[1].id), mkMatch(B[0].id, A[1].id)] };
  }
  if (!nxt.matches.some(m => m.a === c.my || m.b === c.my)) c.out = true;   // команда игрока не прошла дальше
  c.rounds.push(nxt); c.cur++;
}
function compSimRest(c) { let n = 0; while (!c.done && n++ < 40) compPlay(c, null); }

// ================== Серия пенальти ==================
let PSPOT = 696, PGX = FX + FW;
const pens = { on: false, phase: '', t: 0, turn: 0, kicks: [[], []], u: 0, v: 0.35, power: 0, powDir: 1, kPrev: false, res: null, dive: 0,
  cfg: null, shooter: null, keeper: null, diveWait: 0, aiShot: null, dur: 60, end: null, msg: '' };
function penCam(a, b) { a.set(wx(PSPOT) - 8.2, 3.3, Math.sin(clock * 0.01) * 0.3); b.set(wx(PGX), 1.2, 0); }
const penSum = a => a.reduce((s, x) => s + x, 0);
function penDots(side) { const k = pens.kicks[side], n = Math.max(5, k.length); let s = ''; for (let i = 0; i < n; i++) s += i < k.length ? (k[i] ? '●' : '✕') : '○'; return s; }
function updatePenHUD() {
  $('pA').textContent = /^FT\d+$/i.test(String(sideTeam[0].code||'')) ? String(sideTeam[0].name||'КЛУБ').replace(/[^A-ZА-ЯЁ]/gi,'').slice(0,4).toUpperCase() : sideTeam[0].code; $('pB').textContent = /^FT\d+$/i.test(String(sideTeam[1].code||'')) ? String(sideTeam[1].name||'КЛУБ').replace(/[^A-ZА-ЯЁ]/gi,'').slice(0,4).toUpperCase() : sideTeam[1].code;
  $('pdA').textContent = penDots(0) + ' ' + penSum(pens.kicks[0]); $('pdB').textContent = penSum(pens.kicks[1]) + ' ' + penDots(1);
}
function penUI(reticle, powbar, dive, msg) {
  $('reticle').classList.toggle('hide', !reticle); $('powbar').classList.toggle('hide', !powbar); $('dive').classList.toggle('hide', !dive);
  $('penmsg').textContent = msg || '';
}
function startPens(cfg) {
  buildMatch({ tA: cfg.tA, tB: cfg.tB, size: 3, versus: false, ko: false });
  pens.on = true; pens.cfg = cfg; pens.kicks = [[], []]; pens.turn = 0; pens.end = null; pens.phase = 'intro'; pens.t = 0; penCamFn = penCam;
  cows.forEach(c => { c.g.visible = false; c.shadow.visible = false; });
  applyEnv(settings.tod, settings.weather); setState('pens'); Audio_.music.play('tour'); Audio_.crowd(0.5); resetInputs();
  ball.holder = null; ball.carrier = null; ball.fire = 0; ball.h = 0; updatePenHUD(); penUI(false, false, false, 'Серия пенальти');
}
function penBeginKick() {
  const s = pens.turn;
  cows.forEach(c => { c.g.visible = false; c.shadow.visible = false; });
  pens.shooter = cows.find(c => c.team === s && c.role === 'fw'); pens.keeper = cows.find(c => c.team === 1 - s && c.role === 'gk');
  [pens.shooter, pens.keeper].forEach(c => { c.g.visible = true; c.shadow.visible = true; c.vx = c.vy = 0; c.diveT = 0; c.kickAnim = 0; });
  pens.shooter.x = PSPOT - 48; pens.shooter.y = H / 2; pens.shooter.ang = 0;
  pens.keeper.x = PGX - 14; pens.keeper.y = H / 2; pens.keeper.ang = Math.PI;
  ball.x = PSPOT; ball.y = H / 2; ball.vx = ball.vy = 0; ball.h = 0;
  pens.u = 0; pens.v = 0.35; pens.power = 0; pens.powDir = 1; pens.kPrev = false; pens.t = 0; pens.dive = 0; pens.res = null;
  if (s === 0) { pens.phase = 'aim'; penUI(true, true, false, 'Целься стиком, держи «МУ» — отпусти в зелёной зоне'); }
  else {
    const D = DIFF[settings.diff], corner = Math.random() < 0.45 + 0.15 * settings.diff, err = Math.random() < 0.14 - 0.03 * settings.diff;
    let tu = corner ? (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 0.95) : rnd(-0.45, 0.45), tv = rnd(0.12, 0.82);
    if (err) { if (Math.random() < 0.5) tu = (tu < 0 ? -1 : 1) * rnd(1.1, 1.3); else tv = rnd(1.1, 1.3); }
    pens.aiShot = { tu, tv, power: rnd(0.5, 0.92) }; pens.diveWait = 200; pens.phase = 'wait';
    penUI(false, false, true, 'Выбери, куда прыгнет вратарь');
  }
}
function penDive(v) { if (state === 'pens' && pens.phase === 'wait') { pens.dive = v; penShoot(pens.aiShot.tu, pens.aiShot.tv, pens.aiShot.power, v); } }
function penResolve(u, v, power, diveSide) {
  const over = Math.max(0, power - 0.85), nu = (Math.random() - 0.5) * (0.12 + over * 2.2), nv = (Math.random() - 0.5) * (0.1 + over * 1.6);
  const tu = u + nu, tv = v + nv + (over > 0.12 ? over * 0.9 : 0); let out;
  if (Math.abs(tu) > 1.03 || tv > 1.05) out = (tv > 1.05 && Math.abs(tu) <= 1.03) ? 'over' : 'wide';
  else if (Math.abs(Math.abs(tu) - 1) < 0.06 || Math.abs(tv - 1) < 0.05) out = 'post';
  else out = ((diveSide === 0 ? (Math.abs(tu) < 0.32 && tv < 0.95) : (Math.abs(tu - diveSide * 0.62) < 0.4 && tv < 0.78)) || (power < 0.35 && Math.abs(tu) < 0.85)) ? 'save' : 'goal';
  return { tu, tv, out };
}
function penShoot(u, v, power, diveSide) {
  const s = pens.turn;
  if (s === 0) {   // вратарь ИИ: угадывает сторону с шансом, зависящим от сложности и защиты
    const D = DIFF[settings.diff], p = clamp(0.28 + 0.15 * settings.diff + 0.03 * (sideTeam[1].def - 3), 0.15, 0.8), right = Math.abs(u) < 0.3 ? 0 : (u < 0 ? -1 : 1);
    diveSide = Math.random() < p ? right : pick([-1, 0, 1]);
  }
  pens.res = penResolve(u, v, power, diveSide); pens.dive = diveSide; pens.phase = 'fly'; pens.t = 0; pens.dur = Math.round(76 - 34 * power);
  pens.shooter.kickAnim = 1; pens.shooter.kickKind = 'shot'; pens.shooter.kickLeg = 0; SFX.kick(0.4 + 0.6 * power, 0); SFX.creature(pens.shooter.tdef.kind, false, 0);
  pens.keeper.diveDir = diveSide || 1; penUI(false, false, false, '');
}
function penWinner() {
  const a = pens.kicks[0], b = pens.kicks[1], sa = penSum(a), sb = penSum(b);
  if (a.length + b.length > 24) return Math.random() < 0.5 ? 0 : 1;
  if (a.length <= 5 && b.length <= 5) {
    const ra = 5 - a.length, rb = 5 - b.length;
    if (sa > sb + rb) return 0; if (sb > sa + ra) return 1;
    if (a.length === 5 && b.length === 5) return sa > sb ? 0 : sa < sb ? 1 : -1;
    return -1;
  }
  return a.length === b.length ? (sa > sb ? 0 : sa < sb ? 1 : -1) : -1;
}
const PMSG = { goal: 'ГОЛ!', save: 'СЕЙВ!', post: 'ШТАНГА!', wide: 'МИМО!', over: 'ВЫШЕ ВОРОТ!' };
function penImpact() {
  const r = pens.res, goalIn = r.out === 'goal';
  pens.kicks[pens.turn].push(goalIn ? 1 : 0); updatePenHUD();
  if (goalIn) { SFX.horn(); SFX.goal(0); SFX.cheer(0.6, 2.5); } else if (r.out === 'save') { SFX.save(0); SFX.cheer(0.3, 1.5); stats.saves[1 - pens.turn]++; } else if (r.out === 'post') { SFX.post(0); SFX.ooh(); } else SFX.ooh();
  penUI(false, false, false, PMSG[r.out]); say(goalIn ? 'goal' : r.out === 'save' ? 'save' : r.out === 'post' ? 'post' : 'miss', true);
}
function stepPens(dt) {
  clock += dt; pens.t += dt; const ph = pens.phase;
  if (ph === 'intro') { if (pens.t > 100) penBeginKick(); }
  else if (ph === 'aim') {
    const inp = gather({ id: 1 }); pens.u = clamp(pens.u + inp.x * 0.024 * dt, -1.25, 1.25); pens.v = clamp(pens.v - inp.y * 0.02 * dt, 0, 1.25);
    if (inp.kick) { pens.power += pens.powDir * dt / 36; if (pens.power >= 1) { pens.power = 1; pens.powDir = -1; } if (pens.power <= 0) { pens.power = 0; pens.powDir = 1; } }
    $('powfill').style.width = Math.round(pens.power * 100) + '%';
    const v3 = new THREE.Vector3(hx, clamp(pens.v, 0, 1.3) * gHt, pens.u * gw / 2); camera.updateMatrixWorld(); v3.project(camera);
    const rt = $('reticle'); rt.style.left = ((v3.x * 0.5 + 0.5) * window.innerWidth) + 'px'; rt.style.top = ((-v3.y * 0.5 + 0.5) * window.innerHeight) + 'px';
    if (pens.kPrev && !inp.kick) penShoot(pens.u, pens.v, Math.max(0.15, pens.power), 0);
    pens.kPrev = inp.kick;
  } else if (ph === 'wait') {
    pens.diveWait -= dt; if (pens.diveWait <= 0) penDive(0);
  } else if (ph === 'fly') {
    const r = pens.res, tt = Math.min(1, pens.t / pens.dur), gk = pens.keeper, sh = pens.shooter;
    sh.x = lerp(PSPOT - 48, PSPOT - 20, Math.min(1, pens.t / 12)); sh.vx = pens.t < 12 ? 3 : 0;
    ball.x = lerp(PSPOT, PGX, tt); ball.y = H / 2 + r.tu * (GH / 2) * tt; ball.h = r.tv * gHt * tt + 0.5 * Math.sin(Math.PI * tt); ball.vx = ball.vy = 0;
    const tgtY = H / 2 + (r.out === 'save' ? r.tu * (GH / 2) * 0.9 : pens.dive * (GH / 2) * 0.6);
    gk.y = lerp(H / 2, tgtY, Math.min(1, tt * 1.15)); gk.vy = (tgtY - H / 2) * 0.02 * (tt < 1 ? 1 : 0); gk.diveT = pens.dive !== 0 || r.out === 'save' ? 26 * Math.max(0, 1 - tt) : 0;
    if (tt >= 1) { pens.phase = 'after'; pens.t = 0; pens.endX = ball.x; pens.endY = ball.y; pens.endH = ball.h; penImpact(); }
  } else if (ph === 'after') {
    const r = pens.res, t = Math.min(1, pens.t / 40), gk = pens.keeper; pens.shooter.vx = 0; gk.vy = 0;
    if (r.out === 'goal') { ball.x = lerp(PGX, PGX + 22, t); ball.h = lerp(pens.endH, 0.1, t); }
    else if (r.out === 'save') { ball.x = PGX - 8; ball.y = gk.y; ball.h = lerp(pens.endH, 0.4, t); }
    else if (r.out === 'post') { ball.x = lerp(PGX, PGX - 36, t); ball.y = pens.endY + Math.sign(r.tu || 1) * 24 * t; ball.h = lerp(pens.endH, 0, t); }
    else { ball.x = lerp(PGX, PGX + 40, t); ball.y = pens.endY + (r.out === 'wide' ? Math.sign(r.tu || 1) * 40 * t : 0); ball.h = r.out === 'over' ? lerp(pens.endH, 5, t) : lerp(pens.endH, 0, t); }
    if (pens.t > 90) {
      const w = penWinner();
      if (w >= 0) { pens.phase = 'done'; pens.t = 0; pens.end = { win: w === 0, scoreA: penSum(pens.kicks[0]), scoreB: penSum(pens.kicks[1]), kicks: pens.kicks.map(k => k.slice()) }; penUI(false, false, false, w === 0 ? 'Победа в серии!' : 'Поражение в серии'); SFX.whistle(0.8); }
      else { pens.turn ^= 1; penBeginKick(); }
    }
  } else if (ph === 'done') {
    if (pens.t > 110) endPens();
  }
  ball.vx = ball.vy = 0;
}
function endPens() {
  pens.on = false; penCamFn = null; ball.h = 0; penUI(false, false, false, '');
  cows.forEach(c => { c.g.visible = true; c.shadow.visible = true; });
  const res = pens.end || { win: false, scoreA: 0, scoreB: 0, kicks: [[], []] }; pens.phase = '';
  if (pens.cfg && pens.cfg.onDone) pens.cfg.onDone(res);
}

// ================== Экраны и интерфейс ==================
const SCREENS = ['home', 'tours', 'teams', 'hub', 'settings', 'author', 'ward', 'ut', 'help', 'tut', 'pause', 'end', 'net'];
let screen = 'home', setReturn = 'home', teamFlow = null, comp = null, hubTab = 0, pendingCfg = null, endCtx = null, teamCategory = 'fictional';
let screenAnimTimer = 0;
function setScreen(name) {
  const previous = screen; screen = name;
  if (screenAnimTimer) clearTimeout(screenAnimTimer);
  SCREENS.forEach(s => {
    const el = $('sc-' + s);
    if (s === name) {
      el.classList.remove('hide', 'menu-exit', 'menu-enter');
      void el.offsetWidth;
      el.classList.add('menu-enter');
    } else if (s === previous && previous && !el.classList.contains('hide')) {
      el.classList.remove('menu-enter', 'menu-exit');
      el.classList.add('menu-exit');
    } else {
      el.classList.add('hide'); el.classList.remove('menu-enter', 'menu-exit');
    }
  });
  screenAnimTimer = setTimeout(() => {
    SCREENS.forEach(s => { if (s !== screen) { const el = $('sc-' + s); el.classList.add('hide'); el.classList.remove('menu-enter', 'menu-exit'); } });
    const active = screen && $('sc-' + screen); if (active) active.classList.remove('menu-enter');
    screenAnimTimer = 0;
  }, 430);
}
function show(name) { setScreen(name); applyUIState(); syncMusic(); }
function setTheme(cls) { document.documentElement.className = cls || ''; }
function syncMusic() {
  if (state === 'menu') Audio_.music.play(screen === 'hub' || screen === 'tours' || screen === 'teams' ? 'tour' : 'menu');
  else if (state === 'ready' && introFull) Audio_.music.play('match');
  else Audio_.music.stop();
}
function applyUIState() {
  if (state === 'paused' && screen !== 'settings') setScreen('pause');
  else if (state !== 'paused' && screen === 'pause') setScreen(null);
  if ((state === 'play' || state === 'ready' || state === 'goal' || state === 'replay' || state === 'pens' || state === 'outro') && screen && screen !== 'tut') setScreen(null);
  const inGame = ['ready', 'play', 'goal', 'replay', 'paused', 'end', 'outro'].indexOf(state) >= 0;
  $('hud').classList.toggle('hide', !inGame);
  $('penhud').classList.toggle('hide', state !== 'pens'); $('penui').classList.toggle('hide', state !== 'pens');
  $('tbtns').classList.toggle('hide', !(touchUIOn() && ['play', 'ready', 'goal', 'pens'].indexOf(state) >= 0 && !(state === 'ready' && introFull)));
  $('bCross').disabled = !settings.crossEnabled;
  $('skipTag').classList.toggle('hide', !((state === 'ready' && introFull) || state === 'outro'));
  $('replayTag').classList.toggle('hide', state !== 'replay');
  $('fps').classList.toggle('hide', !settings.showFps);
  if (state !== 'play') $('hint').style.display = 'none';
  $('rot').style.display = (window.innerHeight > window.innerWidth * 1.1 && state !== 'menu') ? 'block' : 'none';
}
function enterMenuScene() {
  clearParticles(); $('banner').innerHTML = ''; setCenter(''); $('commentary').classList.remove('on'); $('replayTag').classList.add('hide');
  const opp = pick(TEAMS.filter(t => t.id !== settings.myTeam));
  buildMatch({ tA: teamById(settings.myTeam), tB: opp, size: 3, versus: false, ko: false, comp: false });
  menuPositions(); resetInputs(); penCamFn = null; pens.on = false; ball.h = 0; ball.fire = 0;
  applyEnv(settings.tod, settings.weather); setState('menu'); Audio_.crowd(0);
}

// ---------- Ultimate Team: полностью локальный режим без сетевого рынка ----------
const UT_BADGES=['🐮','🥛','🌾','⚡','🏆','🐂','🌙','🔥'];
const UT_RARITY={bronze:{label:'Бронза',color:'#c58c58',min:52,max:64},silver:{label:'Серебро',color:'#c9d1dc',min:65,max:74},gold:{label:'Золото',color:'#ffd35a',min:75,max:84},special:{label:'Особая',color:'#d59cff',min:85,max:93}};
const UT_TEMPLATES=[
 ['Нико Травин','ВРТ',78,'Азербайджан','Ясные Холмы'],['Тимур Лисов','ВРТ',65,'Грузия','Клеверный Союз'],
 ['Марек Копытов','ЗЩ',74,'Польша','Ясные Холмы'],['Роман Буров','ЗЩ',70,'Чехия','Северный Рог'],['Ильяс Молотов','ЗЩ',67,'Азербайджан','Клеверный Союз'],['Бруно Лужин','ЗЩ',62,'Бразилия','Зелёный Пастух'],['Лев Орлов','ЗЩ',77,'Украина','Северный Рог'],['Сэм Уитли','ЗЩ',59,'Англия','Зелёный Пастух'],
 ['Дарио Велин','ПЗ',81,'Испания','Ясные Холмы'],['Кай Норд','ПЗ',76,'Норвегия','Северный Рог'],['Эмир Сафин','ПЗ',73,'Азербайджан','Клеверный Союз'],['Тоби Фенн','ПЗ',69,'Англия','Зелёный Пастух'],['Саша Мирен','ПЗ',64,'Сербия','Клеверный Союз'],['Милан Кораль','ПЗ',60,'Хорватия','Северный Рог'],
 ['Лука Мелвин','НАП',83,'Италия','Ясные Холмы'],['Реми Солер','НАП',79,'Франция','Клеверный Союз'],['Ясень Рокко','НАП',75,'Азербайджан','Зелёный Пастух'],['Мило Кастен','НАП',71,'Швеция','Северный Рог'],['Рори Вейл','НАП',66,'Англия','Ясные Холмы'],['Тео Марек','НАП',61,'Польша','Зелёный Пастух'],['Вито Луар','НАП',58,'Португалия','Клеверный Союз'],['Арно Дюваль','НАП',87,'Франция','Ясные Холмы'],
 ['Фабиан Ривер','ЦП',82,'Германия','Северный Рог'],['Оскар Бельт','ЦП',77,'Дания','Ясные Холмы'],['Маркос Неро','ЦП',72,'Аргентина','Клеверный Союз'],['Ренат Клим','ЦП',68,'Азербайджан','Зелёный Пастух'],['Кир Ору','ЦП',63,'Япония','Северный Рог'],['Джино Пастель','ЦП',58,'Италия','Клеверный Союз']
].map((v,i)=>({tid:i,name:v[0],pos:v[1],rating:v[2],nation:v[3],club:v[4],pac:clamp(v[2]+rnd(-8,8),35,98)|0,sho:clamp(v[2]+rnd(-10,9),30,98)|0,pas:clamp(v[2]+rnd(-7,8),35,98)|0,dri:clamp(v[2]+rnd(-8,9),30,98)|0,def:clamp(v[2]+rnd(-10,8),25,98)|0,phy:clamp(v[2]+rnd(-7,8),35,98)|0,gk: v[1]==='ВРТ'?clamp(v[2]+rnd(-5,8),35,99)|0:0,rarity:v[2]>=85?'special':v[2]>=75?'gold':v[2]>=65?'silver':'bronze'}));
let utTab='club', ut=null, utIdCounter=0;
const utEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function utNewId(){return 'utp_'+Date.now().toString(36)+'_'+(++utIdCounter).toString(36);}
function utCardFromTemplate(tid, rarity) {
  const t=UT_TEMPLATES[tid]||UT_TEMPLATES[0], r=UT_RARITY[rarity||t.rarity]||UT_RARITY.bronze;
  const rating=clamp(t.rating,r.min,r.max), adj=(v)=>clamp(Math.round(v+(rating-t.rating)*.65+rnd(-2,2)),25,99);
  return {uid:utNewId(),tid:t.tid,name:t.name,pos:t.pos,rating,nation:t.nation,club:t.club,rarity:rarity||t.rarity,pac:adj(t.pac),sho:adj(t.sho),pas:adj(t.pas),dri:adj(t.dri),def:adj(t.def),phy:adj(t.phy),gk:t.pos==='ВРТ'?adj(t.gk||t.rating):0};
}
function createUT(){
  const roles=['ВРТ','ЗЩ','ЗЩ','ЗЩ','ЗЩ','ПЗ','ПЗ','ПЗ','ПЗ','ПЗ','ПЗ','НАП','НАП','НАП','НАП','НАП','НАП','ЦП','ЦП','ЦП'];
  const collection=[]; roles.forEach((role,i)=>{const list=UT_TEMPLATES.filter(t=>t.pos===role);collection.push(utCardFromTemplate((list[i%list.length]||UT_TEMPLATES[i%UT_TEMPLATES.length]).tid));});
  return {name:'Молочный клуб',badge:'🐮',color:'#3a86ff',coins:1800,xp:0,level:1,division:10,formation:'4-3-3',collection,lineup:[],bench:[],stats:{played:0,wins:0,draws:0,losses:0,goals:0,conceded:0,packs:0,bought:0,sold:0,cupWins:0,divPlayed:0,divWins:0,divLosses:0,cupRun:0,best:0,purchases:[],sales:[]},market:[],marketAt:0,dailyKey:'',dailyBase:0,dailyClaims:[],weeklyKey:'',weeklyBase:0,weeklyClaims:[],seasonClaims:[]};
}
function normalizeUT(x){
  if(!x||typeof x!=='object'||!Array.isArray(x.collection)||!x.collection.length) return createUT();
  x.name=String(x.name||'Молочный клуб').slice(0,28);x.badge=UT_BADGES.includes(x.badge)?x.badge:'🐮';x.color=/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:'#3a86ff';
  x.coins=Math.max(0,Number(x.coins)||0);x.xp=Math.max(0,Number(x.xp)||0);x.level=Math.max(1,Number(x.level)||1);x.division=clamp(Number(x.division)||10,1,10);
  if(!['4-3-3','4-4-2','3-5-2','4-2-3-1','5-3-2','4-5-1'].includes(x.formation))x.formation='4-3-3';
  x.stats=Object.assign({played:0,wins:0,draws:0,losses:0,goals:0,conceded:0,packs:0,bought:0,sold:0,cupWins:0,divPlayed:0,divWins:0,divLosses:0,cupRun:0,best:0,purchases:[],sales:[]},x.stats||{});
  if(!Array.isArray(x.lineup))x.lineup=[]; if(!Array.isArray(x.bench))x.bench=[];if(!Array.isArray(x.market))x.market=[];
  ['dailyClaims','weeklyClaims','seasonClaims'].forEach(k=>{if(!Array.isArray(x[k]))x[k]=[];});
  const today=new Date().toISOString().slice(0,10);
  const weekKey=()=>{const d=new Date();return d.getUTCFullYear()+'-W'+Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+new Date(Date.UTC(d.getUTCFullYear(),0,1)).getUTCDay()+1)/7)};
  if(!x.dailyKey){x.dailyKey=today;x.dailyBase=x.stats.played||0;} if(!Number.isFinite(Number(x.dailyBase)))x.dailyBase=x.stats.played||0;
  const wk=weekKey(); if(!x.weeklyKey){x.weeklyKey=wk;x.weeklyBase=x.stats.wins||0;} if(!Number.isFinite(Number(x.weeklyBase)))x.weeklyBase=x.stats.wins||0;
  return x;
}
try { ut=normalizeUT(settings.utData); settings.utData=ut; } catch(e) { ut=createUT(); settings.utData=ut; }
function saveUT(){settings.utData=ut;save();}
function utTemplate(card){return UT_TEMPLATES.find(t=>t.tid===card.tid)||UT_TEMPLATES[0];}
function utFormationRoles(f){const map={'4-3-3':[4,3,3],'4-4-2':[4,4,2],'3-5-2':[3,5,2],'4-2-3-1':[4,5,1],'5-3-2':[5,3,2],'4-5-1':[4,5,1]},a=map[f]||map['4-3-3'];return ['ВРТ',...Array(a[0]).fill('ЗЩ'),...Array(a[1]).fill('ПЗ'),...Array(a[2]).fill('НАП')];}
function utById(id){return ut.collection.find(c=>c.uid===id)||null;}
function utAutoLineup(){const roles=utFormationRoles(ut.formation),used=new Set(),chosen=[];roles.forEach(role=>{const c=ut.collection.filter(p=>p.pos===role&&!used.has(p.uid)).sort((a,b)=>b.rating-a.rating)[0]||ut.collection.filter(p=>!used.has(p.uid)).sort((a,b)=>b.rating-a.rating)[0];if(c){chosen.push(c.uid);used.add(c.uid);}});ut.lineup=chosen;ut.bench=ut.collection.filter(c=>!used.has(c.uid)).map(c=>c.uid);}
if(!Array.isArray(ut.lineup)||ut.lineup.length!==11||ut.lineup.some(id=>!utById(id)))utAutoLineup();
function utAssignSlot(i){const roles=utFormationRoles(ut.formation),role=roles[i];if(!role)return;const current=utById(ut.lineup[i]),taken=new Set(ut.lineup.filter((_,j)=>j!==i));const allowed=role==='ПЗ'?['ПЗ','ЦП']:[role];const candidates=ut.collection.filter(c=>allowed.includes(c.pos)&&!taken.has(c.uid)).sort((a,b)=>b.rating-a.rating);if(candidates.length){const cur=candidates.findIndex(c=>c.uid===current?.uid);ut.lineup[i]=candidates[(cur+1)%candidates.length].uid;}}
function utChemistry(){const cards=ut.lineup.map(utById).filter(Boolean);if(!cards.length)return 0;let links=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)if(cards[i].club===cards[j].club||cards[i].nation===cards[j].nation)links++;return Math.round(links/Math.max(1,cards.length*(cards.length-1)/2)*100);}
function utSquadRating(){const cards=ut.lineup.map(utById).filter(Boolean);return cards.length?Math.round(cards.reduce((a,c)=>a+c.rating,0)/cards.length):0;}
function utAchievements(){return [
 {id:'first_match',icon:'🏁',name:'Первый свисток',desc:'Сыграть первый матч',ok:ut.stats.played>=1},
 {id:'five_wins',icon:'🏅',name:'Победная серия',desc:'Выиграть 5 матчей',ok:ut.stats.wins>=5},
 {id:'ten_goals',icon:'⚽',name:'Голеадор',desc:'Забить 10 голов',ok:ut.stats.goals>=10},
 {id:'collector',icon:'🗂️',name:'Коллекционер',desc:'Собрать 25 карточек',ok:ut.collection.length>=25},
 {id:'gold_card',icon:'🌟',name:'Золотой блеск',desc:'Получить золотую карточку',ok:ut.collection.some(c=>c.rarity==='gold'||c.rarity==='special')},
 {id:'cup_champ',icon:'🏆',name:'Кубковый чемпион',desc:'Выиграть Ultimate Cup',ok:ut.stats.cupWins>=1},
 {id:'squad_85',icon:'💎',name:'Звёздный состав',desc:'Рейтинг состава 85+',ok:utSquadRating()>=85}
];}
function utPrice(c){return Math.round((c.rating*c.rating*0.55+180)*(c.rarity==='special'?1.65:c.rarity==='gold'?1.3:c.rarity==='silver'?1:0.72)/10)*10;}
function utRarityByRoll(roll,pack){const chances={bronze:[['bronze',.9],['silver',.1]],silver:[['bronze',.2],['silver',.7],['gold',.1]],gold:[['silver',.25],['gold',.65],['special',.1]],premium:[['gold',.7],['special',.3]]}[pack]||[['bronze',1]];let r=roll;for(const [rarity,p] of chances){r-=p;if(r<=0)return rarity;}return chances[chances.length-1][0];}
const UT_PACKS={bronze:{label:'Бронзовый',cost:250,chance:'90% бронза · 10% серебро'},silver:{label:'Серебряный',cost:650,chance:'20% бронза · 70% серебро · 10% золото'},gold:{label:'Золотой',cost:1400,chance:'25% серебро · 65% золото · 10% особая'},premium:{label:'Премиум',cost:2400,chance:'70% золото · 30% особая'}};
function utOpenPack(pack){const p=UT_PACKS[pack];if(!p)return;if(ut.coins<p.cost){alert('Недостаточно монет для этого пака.');return;}ut.coins-=p.cost;const rarity=utRarityByRoll(Math.random(),pack),pool=UT_TEMPLATES.filter(t=>t.rating>=UT_RARITY[rarity].min-8 && t.rating<=UT_RARITY[rarity].max+5),t=pool[(Math.random()*pool.length)|0]||UT_TEMPLATES[0],card=utCardFromTemplate(t.tid,rarity);ut.collection.push(card);ut.stats.packs++;ut.xp+=20;utRefreshLevel();saveUT();showUTReveal(card);}
function utRefreshMarket(force){const now=Date.now();if(!force&&ut.market.length&&now-ut.marketAt<180000)return;ut.marketAt=now;ut.market=[];const available=UT_TEMPLATES.slice();for(let i=0;i<6;i++){const t=available.splice((Math.random()*available.length)|0,1)[0];if(!t)break;const rarity=t.rarity,card=utCardFromTemplate(t.tid,rarity);ut.market.push({id:'offer_'+now+'_'+i,tid:t.tid,rarity,card,price:Math.max(100,Math.round(utPrice(card)*(0.85+Math.random()*.3)/10)*10),expires:now+180000});}saveUT();}
function utBuyMarket(id){const offer=ut.market.find(o=>o.id===id);if(!offer)return;if(ut.coins<offer.price){alert('Не хватает монет.');return;}const t=UT_TEMPLATES[offer.tid],card=offer.card?Object.assign({},offer.card,{uid:utNewId()}):utCardFromTemplate(t.tid,offer.rarity);ut.coins-=offer.price;ut.collection.push(card);ut.stats.bought++;ut.stats.purchases.unshift({name:card.name,price:offer.price,date:new Date().toLocaleDateString('ru-RU')});ut.stats.purchases=ut.stats.purchases.slice(0,20);ut.market=ut.market.filter(o=>o.id!==id);ut.xp+=10;utRefreshLevel();saveUT();}
function utSellCard(id,quick){const card=utById(id);if(!card)return;if(ut.lineup.includes(id)){alert('Сначала убери игрока из стартового состава.');return;}const raw=utPrice(card)*(quick?.55:1);const net=Math.max(25,Math.round(raw*.95));if(!confirm(`${quick?'Быстро продать':'Продать на локальном рынке'} ${card.name} за ${net} монет? Учтён налог 5%.`))return;ut.collection=ut.collection.filter(c=>c.uid!==id);ut.coins+=net;ut.stats.sold++;ut.stats.sales.unshift({name:card.name,price:net,date:new Date().toLocaleDateString('ru-RU'),tax:Math.round(raw*.05)});ut.stats.sales=ut.stats.sales.slice(0,20);ut.bench=ut.bench.filter(x=>x!==id);utAutoLineup();utRefreshLevel();saveUT();}
function utRefreshLevel(){ut.level=Math.max(1,Math.floor(ut.xp/500)+1);ut.stats.best=Math.max(ut.stats.best||0,utSquadRating());}
function utDateKeys(){const now=new Date(),d=now.toISOString().slice(0,10),jan=new Date(Date.UTC(now.getUTCFullYear(),0,1)),week=now.getUTCFullYear()+'-W'+Math.ceil((((now-jan)/86400000)+jan.getUTCDay()+1)/7);if(ut.dailyKey!==d){ut.dailyKey=d;ut.dailyBase=ut.stats.played;ut.dailyClaims=[];saveUT();}if(ut.weeklyKey!==week){ut.weeklyKey=week;ut.weeklyBase=ut.stats.wins;ut.weeklyClaims=[];saveUT();}return {d,week};}
function utObjectives(){utDateKeys();return [
 {id:'daily_play',group:'Ежедневные',label:'Сыграй 1 матч Ultimate Team',progress:Math.min(1,ut.stats.played-(ut.dailyBase||0)),goal:1,reward:100,currency:'монет',key:'dailyClaims'},
 {id:'weekly_win',group:'Еженедельные',label:'Победи в 3 матчах клуба',progress:Math.min(3,ut.stats.wins-(ut.weeklyBase||0)),goal:3,reward:350,currency:'монет',key:'weeklyClaims'},
 {id:'season_pack',group:'Сезонные',label:'Открой 5 паков',progress:Math.min(5,ut.stats.packs),goal:5,reward:1,currency:'золотой пак',key:'seasonClaims'}
];}
function utClaimObjective(id){const o=utObjectives().find(x=>x.id===id);if(!o||o.progress<o.goal||ut[o.key].includes(id)){alert('Задание ещё не выполнено или награда уже получена.');return;}ut[o.key].push(id);if(o.currency==='золотой пак'){const t=UT_TEMPLATES.filter(t=>t.rarity==='gold')[(Math.random()*UT_TEMPLATES.filter(t=>t.rarity==='gold').length)|0];ut.collection.push(utCardFromTemplate(t.tid,'gold'));}else ut.coins+=o.reward;ut.xp+=60;utRefreshLevel();saveUT();}
function applyUTLineupToMatch(cowsNow,cfg){const roles={gk:[],df:[],mf:[],fw:[]};const map={'ВРТ':'gk','ЗЩ':'df','ПЗ':'mf','ЦП':'mf','НАП':'fw'};ut.lineup.map(utById).filter(Boolean).forEach(card=>{const r=map[card.pos]||'mf';roles[r].push(card);});const used={gk:0,df:0,mf:0,fw:0};cowsNow.filter(c=>c.team===0).forEach(c=>{const r=c.role,a=roles[r]||[],card=a[used[r]++]||a[a.length-1];if(!card)return;c.utCard=card;c.pname=card.name;c.num=card.num||((used[r]+(r==='gk'?0:r==='df'?1:r==='mf'?5:8)));if(r==='gk')c.utCard.gk=card.gk||card.rating;});
  // Small chemistry bonus, bounded so player quality matters without speed cheats.
  const bonus=utChemistry()/100*.035;cowsNow.filter(c=>c.team===0&&c.utCard).forEach(c=>{c.utCard.chemBonus=bonus;});
}
function utStartMatch(mode){const base=teamById(settings.myTeam)||TEAMS[0],opps=TEAMS.filter(t=>t.id!==base.id),opp=opps[(Math.random()*opps.length)|0];const utClub=Object.assign({},base,{id:'ut_local_'+Date.now(),name:ut.name,code:'КЛБ',c1:parseInt(ut.color.slice(1),16),c2:base.c2,tag:'Локальный клуб Ultimate Team'});const formation=ut.formation||'4-3-3';startMatch({tA:utClub,tB:opp,size:11,form:formation,formB:'4-4-2',versus:false,ko:false,comp:false,utManaged:true,utMode:mode,style:'bal',noTactics:false});}
function utMatchFinished(sc,stats,cfg){if(!cfg||!cfg.utManaged)return;const win=sc[0]>sc[1],draw=sc[0]===sc[1],reward=win?180:draw?100:60;ut.stats.played++;if(win)ut.stats.wins++;else if(draw)ut.stats.draws++;else ut.stats.losses++;ut.stats.goals+=sc[0];ut.stats.conceded+=sc[1];ut.coins+=reward;ut.xp+=60+sc[0]*12+(win?45:0);utRefreshLevel();const mode=cfg.utMode||'friendly';if(mode==='division'){ut.stats.divPlayed++;if(win)ut.stats.divWins++;else if(!draw)ut.stats.divLosses++;if(ut.stats.divPlayed>=3){if(ut.stats.divWins>=2)ut.division=Math.max(1,ut.division-1);else if(ut.stats.divLosses>=2)ut.division=Math.min(10,ut.division+1);ut.stats.divPlayed=ut.stats.divWins=ut.stats.divLosses=0;}}if(mode==='cup'){if(win){ut.stats.cupRun++;if(ut.stats.cupRun>=3){ut.stats.cupWins++;ut.coins+=500;ut.stats.cupRun=0;alert('Ultimate Cup выигран! Бонус 500 монет.');}}else if(!draw)ut.stats.cupRun=0;}saveUT();}
function utCardHtml(c, actions=true){const r=UT_RARITY[c.rarity]||UT_RARITY.bronze;return `<div class="utCard" style="--rarity:${r.color}"><span class="pos">${utEsc(c.pos)}</span><div class="rating">${c.rating}</div><b>${utEsc(c.name)}</b><small>${utEsc(r.label)} · ${utEsc(c.nation)} · ${utEsc(c.club)}</small><div class="statsline"><span>СКР ${c.pac}</span><span>УД ${c.sho}</span><span>ПАС ${c.pas}</span><span>ДРБ ${c.dri}</span><span>ЗАЩ ${c.def}</span><span>ФИЗ ${c.phy}</span></div>${actions?`<div class="utActions"><button class="mi" data-a="utSell" data-id="${utEsc(c.uid)}">Продать</button><button class="mi" data-a="utQuickSell" data-id="${utEsc(c.uid)}">Быстро</button></div>`:''}</div>`;}
function showUTReveal(card){const box=$('utReveal'),panel=$('utRevealPanel'),title=$('utRevealTitle'),sub=$('utRevealSub'),body=$('utRevealCard'),r=UT_RARITY[card.rarity]||UT_RARITY.bronze;if(!box||!panel||!body)return;panel.style.setProperty('--rarity',r.color);title.textContent='Пак открыт!';sub.textContent=`${r.label} · рейтинг ${card.rating} · ${card.pos}`;body.innerHTML=utCardHtml(card,false);box.classList.remove('hide');const btn=box.querySelector('[data-a="utCloseReveal"]');if(btn)btn.focus({preventScroll:true});}
function renderUT(){
  utDateKeys();utRefreshMarket(false);
  const tabs=[['club','Мой клуб'],['squad','Состав'],['players','Игроки'],['packs','Паки'],['market','Рынок'],['quests','Задания'],['modes','Режимы'],['stats','Статистика']];
  $('utSub').textContent=`${ut.badge} ${ut.name} · Дивизион ${ut.division}`;$('utTabs').innerHTML=tabs.map(([id,n])=>`<button class="${utTab===id?'on':''}" data-a="utTab" data-v="${id}">${n}</button>`).join('');
  const common=`<div class="utSummary"><div class="utStat"><small>Монеты</small><b>🪙 ${ut.coins}</b></div><div class="utStat"><small>Уровень клуба</small><b>${ut.level}</b><div class="utProgress"><i style="width:${(ut.xp%500)/5}%"></i></div><small>${ut.xp%500}/500 XP</small></div><div class="utStat"><small>Состав</small><b>${utSquadRating()}</b><small>Химия ${utChemistry()}%</small></div></div>`;
  let h=common;
  if(utTab==='club'){
    const awards=utAchievements();h+=`<div class="utPanel"><h3>Достижения · ${awards.filter(a=>a.ok).length}/${awards.length}</h3><div class="utGrid">${awards.map(a=>`<div class="utCard" style="--rarity:${a.ok?'#b8ff3d':'#647086'};opacity:${a.ok?1:.62}"><div class="rating">${a.icon}</div><b>${a.name}</b><small>${a.desc}</small><div class="utNotice">${a.ok?'✓ Открыто':'🔒 Не открыто'}</div></div>`).join('')}</div></div>`;
    h+=`<div class="utPanel"><h3>Клуб</h3><div style="display:flex;gap:10px;align-items:center"><button class="mi pri" data-a="utEmblem" style="width:66px;min-height:60px;font-size:27px">${ut.badge}</button><div style="flex:1"><input class="utInput" id="utNameInput" maxlength="28" value="${utEsc(ut.name)}" aria-label="Название клуба"><div class="utNotice">Нажми на эмблему, чтобы выбрать другой вымышленный значок.</div></div><button class="mi" data-a="utRename">Сохранить</button></div></div>
    <div class="utPanel"><h3>Развитие клуба</h3><p class="help">Каждый завершённый матч приносит монеты и опыт. Карточки улучшают скорость, удар и передачи состава в режиме Ultimate Team.</p><div class="utActions"><button class="mi pri" data-a="utPlay" data-v="friendly">Товарищеский матч</button><button class="mi" data-a="utPlay" data-v="division">Матч дивизиона ${ut.division}</button><button class="mi" data-a="utPlay" data-v="cup">Ultimate Cup · этап ${ut.stats.cupRun+1}/3</button></div></div>
    <div class="utPanel"><h3>Прогресс</h3><div class="utSummary"><div class="utStat"><small>Матчи</small><b>${ut.stats.played}</b></div><div class="utStat"><small>Победы</small><b>${ut.stats.wins}</b></div><div class="utStat"><small>Голы</small><b>${ut.stats.goals}</b></div></div><button class="mi" data-a="utReset">Сбросить прогресс клуба…</button></div>`;
  } else if(utTab==='squad'){
    const formations=['4-3-3','4-4-2','3-5-2','4-2-3-1','5-3-2','4-5-1'];
    h+=`<div class="utPanel"><h3>Схема</h3><div class="utActions">${formations.map(f=>`<button class="mi ${ut.formation===f?'pri':''}" data-a="utFormation" data-v="${f}">${f}</button>`).join('')}<button class="mi" data-a="utAuto">Авто-состав</button></div><div class="utPitch">${utFormationRoles(ut.formation).map((role,i)=>{const c=utById(ut.lineup[i]);return `<button class="utSlot" data-a="utAssign" data-i="${i}" title="Нажми, чтобы заменить игрока на следующего доступного этой позиции"><b>${c?c.rating:'—'}</b>${utEsc(role)}<br>${utEsc(c?c.name:'Нет игрока')}</button>`;}).join('')}</div><div class="utNotice">Нажимай на позицию, чтобы переключать игрока соответствующей роли. На матч перейдёт выбранная схема и стартовые карточки.</div></div>
    <div class="utPanel"><h3>Запас</h3><div class="utGrid">${ut.bench.map(utById).filter(Boolean).slice(0,12).map(c=>utCardHtml(c,false)).join('')||'<p>Нажми «Авто-состав», чтобы распределить игроков по позициям.</p>'}</div></div>`;
  } else if(utTab==='players'){
    h+=`<div class="utPanel"><h3>Коллекция · ${ut.collection.length} карточек</h3><div class="utActions"><button class="mi" data-a="utSort" data-v="rating">Сортировать по рейтингу</button><button class="mi" data-a="utSort" data-v="rarity">По редкости</button></div><div class="utActions"><input class="utInput" id="utSearch" placeholder="Поиск игрока…" aria-label="Поиск игрока"><select class="utInput" id="utPositionFilter" aria-label="Фильтр позиции"><option value="">Все позиции</option>${['ВРТ','ЗЩ','ПЗ','ЦП','НАП'].map(p=>`<option value="${p}">${p}</option>`).join('')}</select><select class="utInput" id="utRarityFilter" aria-label="Фильтр редкости"><option value="">Любая редкость</option>${Object.keys(UT_RARITY).map(r=>`<option value="${r}">${UT_RARITY[r].label}</option>`).join('')}</select></div><div class="utGrid" id="utPlayersGrid">${ut.collection.slice().sort((a,b)=>ut.sort==='rarity'?Object.keys(UT_RARITY).indexOf(b.rarity)-Object.keys(UT_RARITY).indexOf(a.rarity):b.rating-a.rating).map(c=>`<div data-position="${utEsc(c.pos)}" data-rarity="${utEsc(c.rarity)}" data-search="${utEsc(c.name.toLowerCase()+' '+c.club.toLowerCase()+' '+c.nation.toLowerCase())}">${utCardHtml(c,!ut.lineup.includes(c.uid))}</div>`).join('')}</div></div>`;
  } else if(utTab==='packs'){
    h+=`<div class="utNotice">Вероятности опубликованы до открытия. Выбор редкости случаен внутри указанных шансов; карточка обязательно добавляется в коллекцию.</div><div class="utGrid">${Object.entries(UT_PACKS).map(([id,p])=>`<div class="utPanel"><div class="rating" style="font-size:30px">${id==='bronze'?'🥉':id==='silver'?'🥈':id==='gold'?'🥇':'✨'}</div><h3>${p.label}</h3><b>🪙 ${p.cost}</b><p class="help">${p.chance}</p><button class="mi pri" data-a="utPack" data-v="${id}">Открыть пак</button></div>`).join('')}</div>`;
  } else if(utTab==='market'){
    h+=`<div class="utPanel"><h3>Локальный трансферный рынок</h3><p class="help">Офферы обновляются примерно каждые 3 минуты. Рынок работает только на этом устройстве: общего онлайн-рынка нет.</p><div class="utActions"><button class="mi" data-a="utRefreshMarket">Обновить предложения</button><span class="utNotice">Налог при продаже: 5%</span></div><div class="utGrid">${ut.market.map(o=>{const c=o.card||utCardFromTemplate(o.tid,o.rarity);return `<div class="utCard" style="--rarity:${UT_RARITY[o.rarity].color}"><span class="pos">${c.pos}</span><div class="rating">${c.rating}</div><b>${utEsc(c.name)}</b><small>${UT_RARITY[o.rarity].label} · ${utEsc(c.nation)} · ${utEsc(c.club)}</small><div class="statsline"><span>СКР ${c.pac}</span><span>УД ${c.sho}</span><span>ПАС ${c.pas}</span></div><p><b>🪙 ${o.price}</b></p><button class="mi pri" data-a="utBuy" data-id="${utEsc(o.id)}">Купить</button></div>`;}).join('')}</div></div>`;
  } else if(utTab==='quests'){
    h+=`<div class="utPanel"><h3>Задания и награды</h3><p class="help">Задания обновляются ежедневно и еженедельно. Прогресс сохраняется локально.</p>${utObjectives().map(o=>{const done=o.progress>=o.goal,claimed=ut[o.key].includes(o.id);return `<div class="utPanel"><b>${o.group}: ${o.label}</b><div class="utProgress"><i style="width:${Math.min(100,o.progress/o.goal*100)}%"></i></div><small>${o.progress}/${o.goal} · Награда: ${o.reward} ${o.currency}</small><div><button class="mi ${done&&!claimed?'pri':''}" data-a="utClaim" data-id="${o.id}" ${!done||claimed?'disabled':''}>${claimed?'Получено':done?'Забрать награду':'Выполни задание'}</button></div></div>`;}).join('')}</div>`;
  } else if(utTab==='modes'){
    h+=`<div class="utPanel"><h3>Игровые режимы</h3><div class="utActions"><button class="mi pri" data-a="utPlay" data-v="friendly">Товарищеский матч</button><button class="mi" data-a="utPlay" data-v="division">Дивизионы</button><button class="mi" data-a="utPlay" data-v="cup">Ultimate Cup</button></div><p class="help">Дивизион обновляется через каждые три матча: две победы дают повышение, два поражения — понижение. В кубке нужно выиграть три матча подряд. Матчи запускаются существующим движком Cowball с выбранным стартовым составом.</p><div class="utSummary"><div class="utStat"><small>Дивизион</small><b>${ut.division}</b></div><div class="utStat"><small>Серия кубка</small><b>${ut.stats.cupRun}/3</b></div><div class="utStat"><small>Трофеи кубка</small><b>${ut.stats.cupWins}</b></div></div></div>`;
  } else {
    const history=(ut.stats.purchases||[]).map(x=>`<div class="korow"><span>Покупка · ${utEsc(x.name)}</span><b>−${x.price} 🪙</b></div>`).concat((ut.stats.sales||[]).map(x=>`<div class="korow"><span>Продажа · ${utEsc(x.name)}</span><b>+${x.price} 🪙</b></div>`)).slice(0,20);
    h+=`<div class="utPanel"><h3>Статистика клуба</h3><div class="utSummary"><div class="utStat"><small>Матчи</small><b>${ut.stats.played}</b></div><div class="utStat"><small>Победы</small><b>${ut.stats.wins}</b></div><div class="utStat"><small>Ничьи</small><b>${ut.stats.draws}</b></div><div class="utStat"><small>Поражения</small><b>${ut.stats.losses}</b></div><div class="utStat"><small>Забито</small><b>${ut.stats.goals}</b></div><div class="utStat"><small>Пропущено</small><b>${ut.stats.conceded}</b></div><div class="utStat"><small>Паков открыто</small><b>${ut.stats.packs}</b></div><div class="utStat"><small>Рекорд рейтинга</small><b>${ut.stats.best||utSquadRating()}</b></div></div><h3>Последние сделки</h3>${history.join('')||'<p class="help">Пока нет покупок и продаж.</p>'}</div>`;
  }
  $('utBody').innerHTML=h;
}
// ---------- Главное меню ----------
function renderHome() {
  const saved = settings.comp && !settings.comp.done; let h = '';
  if (saved) h += `<button class="mi pri wide" data-a="continue">Продолжить турнир<small>${COMPS[settings.comp.type].name} · ${settings.comp.rounds[settings.comp.cur].name}</small></button>`;
  h += `<button class="mi ${saved ? '' : 'pri'} wide" data-a="quick">Быстрый матч<small>Выбери команды и играй</small></button>`;
  h += '<button class="mi" data-a="tours">Турниры<small>Лига, Кубок, ЛЧ, ЧМ</small></button>';
  h += '<button class="mi" data-a="career">Карьера клуба<small>Сезоны, таблица и титулы</small></button>';
  h += '<button class="mi" data-a="trophies">Зал трофеев<small>Кубки и национальные награды</small></button>';
  h += '<button class="mi" data-a="pens">Пенальти<small>Серия ударов</small></button>';
  h += '<button class="mi" data-a="versus">Вдвоём<small>ПК или геймпад</small></button>';
  h += '<button class="mi" data-a="wardrobe">Гардероб<small>Шапки и мяч</small></button>';
  h += '<button class="mi pri wide" data-a="ut">Ultimate Team<small>Состав, трансфер-маркет, карьера игрока</small></button>';
  h += '<button class="mi" data-a="settings">Настройки</button><button class="mi" data-a="help">Как играть</button>';
  h += '<button class="mi wide" data-a="author">Об авторе</button>';
  $('tiles').innerHTML = h;
  $('wins').textContent = `Побед: ${settings.wins} · Матчей: ${settings.played} · Голов: ${settings.goals} · Кубков: ${Math.max(settings.trophies.length, settings.trophyCabinet.length)}`;
}
function goHome() { setTheme(''); if (state !== 'menu') enterMenuScene(); renderHome(); show('home'); }
// Public bridge used by the separate v44 navigation helper; game state remains private.
window.CowballV44 = window.CowballV44 || {};
window.CowballV44.goHome = goHome;
window.CowballV44.openScreen = show;
window.CowballV44.getScreen = () => screen;
window.CowballV44.getState = () => state;

// ---------- Турниры и выбор команд ----------
function renderTours() {
  $('tourCards').innerHTML = Object.keys(COMPS).map(k => `<button class="cc" data-a="tour" data-v="${k}"><span class="ic">${COMPS[k].icon}</span><b>${COMPS[k].name}</b><small>${COMPS[k].desc}</small></button>`).join('');
}
const pips = n => '<span class="pips">' + [1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('') + '</span>';
function teamsForFlow(f) {
  if (!f.comp) return TEAMS;
  if (f.comp === 'world') return TEAMS.filter(t => t.nation);
  if (f.comp && f.comp.startsWith('league_')) return TEAMS.filter(t => t.league === f.comp.slice(7));
  return TEAMS.filter(t => !t.nation && !t.league);
}
function teamsEligibleForFlow(f) {
  return teamsForFlow(f).filter(t => f.comp || teamCategory === 'all' || (teamCategory === 'nation' ? !!t.nation : teamCategory === 'club' ? !!t.league : !t.nation && !t.league));
}
function balancedOpponent(f, candidates) {
  const pool = (candidates || teamsEligibleForFlow(f)).filter(t => t.id !== f.my);
  if (!pool.length) return null;
  const mine = teamById(f.my), gaps = pool.map(t => ({ team: t, gap: Math.abs(teamPower(t) - teamPower(mine)) }));
  const bestGap = Math.min(...gaps.map(v => v.gap));
  const near = gaps.filter(v => v.gap <= bestGap + 0.16).map(v => v.team);
  return pick(near);
}
function openTeams(mode, compType) {
  const f = { mode, comp: compType || null, step: 0, cur: settings.myTeam, my: null };
  if (!f.comp) { teamCategory = 'club'; f.leaguePick = null; } // v47: default to league-first club selection; other categories remain available in tabs.
  const pool = teamsForFlow(f); if (f.comp && !pool.some(t => t.id === f.cur)) f.cur = pool[0] ? pool[0].id : settings.myTeam;
  teamFlow = f; renderTeams(); show('teams');
}
function renderTeams() {
  const f = teamFlow, two = f.mode === 'quick' || f.mode === 'versus' || f.mode === 'pens';
  const oldCats = $('teamGrid').previousElementSibling;
  if (oldCats && oldCats.classList.contains('team-cats')) oldCats.remove();
  if (!f.comp) { const cats = [{id:'fictional',label:'Выдуманные команды'},{id:'nation',label:'Сборные'},{id:'club',label:'Лиги'},{id:'all',label:'Все'}]; $('teamGrid').insertAdjacentHTML('beforebegin', `<div class="tabs team-cats">${cats.map(c => `<button data-a="teamcat" data-v="${c.id}" class="${teamCategory===c.id?'on':''}">${c.label}</button>`).join('')}</div>`); }
  $('teamsTitle').textContent = f.step === 0 ? (f.mode === 'versus' ? 'Игрок 1: выбери команду' : 'Выбери свою команду') : (f.mode === 'versus' ? 'Игрок 2: выбери команду' : 'Выбери соперника');
  let h = '';
  if (f.step === 1 && f.mode !== 'versus') h += `<button class="tc ${f.cur === 'rand' ? 'sel' : ''}" data-a="pickteam" data-v="rand" style="--tc:#8f9ab0"><span class="kit emo">🎲</span><span class="tnm"><b>Случайная</b><small>Сюрприз</small></span></button>`;
  const visibleTeams = teamsEligibleForFlow(f);
  if (f.step === 1 && f.mode !== 'versus') {
    h += `<button class="tc ${f.cur === 'balanced' ? 'sel' : ''}" data-a="pickteam" data-v="balanced" style="--tc:#b8ff3d"><span class="kit emo">⚖️</span><span class="tnm"><b>Равный матч</b><small>Соперник с близким рейтингом</small></span></button>`;
  }
  visibleTeams.forEach(t => {
    const dis = f.step === 1 && t.id === f.my, ov = Math.round(teamPower(t));
    h += `<button class="tc ${f.cur === t.id ? 'sel' : ''} ${dis ? 'dis' : ''}" data-a="pickteam" data-v="${t.id}" style="--tc:${hex(t.c1)};--tc2:${hex(t.c2)}"><span class="kit k${t.pat | 0}"><i></i></span><span class="tnm"><b>${t.name}</b><small>${t.nation ? t.flag + ' ' : ''}${t.code} · ${'★'.repeat(ov)}${'☆'.repeat(5 - ov)}</small></span><span class="rt"><i style="width:${Math.min(100, ov * 20)}%"></i></span></button>`;
  });
  $('teamGrid').innerHTML = h;
  let t = f.cur && f.cur !== 'rand' && f.cur !== 'balanced' ? teamById(f.cur) : null;
  if (f.step === 1 && f.cur === 'balanced') {
    const candidates = visibleTeams.filter(team => team.id !== f.my);
    const remembered = candidates.find(team => team.id === f.balancedOpp);
    t = remembered || balancedOpponent(f, candidates);
    f.balancedOpp = t ? t.id : null;
  }
  const preview = $('matchupPreview');
  const showPreview = f.step === 1 && two;
  preview.classList.toggle('hide', !showPreview);
  if (showPreview) {
    if (t && f.my) {
      const mine = teamById(f.my), minePower = teamPower(mine), otherPower = teamPower(t);
      const delta = otherPower - minePower, balance = Math.abs(delta) < 0.4
        ? 'Силы близки — хороший равный матч'
        : delta > 0 ? `Соперник сильнее на ${delta.toFixed(1)} балла` : `Твоя команда сильнее на ${Math.abs(delta).toFixed(1)} балла`;
      const side = (team, label, power) => `<div class="mp-side" style="--mpc:${hex(team.c1)}"><span class="mp-label">${label}</span><b class="mp-name">${team.nation ? team.flag + ' ' : ''}${team.name}</b><div class="mp-track"><i style="width:${clamp(power / 5 * 100, 0, 100)}%"></i></div><span class="mp-rating">${power.toFixed(1)} / 5 · ${teamTierLabel(team)}</span></div>`;
      const opponentLabel = f.cur === 'balanced' ? 'Подобранный соперник' : f.mode === 'versus' ? 'Игрок 2' : 'Соперник';
      preview.innerHTML = `<div class="mp-grid">${side(mine, f.mode === 'versus' ? 'Игрок 1' : 'Твоя команда', minePower)}<span class="mp-vs">VS</span>${side(t, opponentLabel, otherPower)}</div><div class="mp-verdict">${balance}</div>`;
    } else {
      preview.innerHTML = `<div class="mp-empty">${f.cur === 'rand' ? '🎲 Случайный соперник — сравнение появится после выбора команды' : f.cur === 'balanced' ? 'В этой категории пока нет подходящего соперника' : 'Выбери команду, чтобы сравнить составы'}</div>`;
    }
  }
  $('teamInfo').classList.remove('team-info-change');
  $('teamInfo').innerHTML = t ? `<b>${t.nation ? t.flag + ' ' : ''}${t.name}</b> — <span class="stat">${teamTierLabel(t)} команда</span> · ${t.tag}<br><span class="stat">Скорость ${pips(t.spd)}</span><span class="stat">Сила ${pips(t.pow)}</span><span class="stat">Защита ${pips(t.def)}</span>`
    : (f.cur === 'rand' ? '<b>Случайная команда</b><br>Кто достанется — тот и соперник' : f.cur === 'balanced' ? '<b>Равный матч</b><br>Подберём соперника с близкой силой состава' : 'Выбери команду');
  void $('teamInfo').offsetWidth; $('teamInfo').classList.add('team-info-change');
  const last = !(two && f.step === 0) && f.mode !== 'ward';
  $('teamGo').textContent = last ? (f.mode === 'comp' ? 'В турнир' : f.mode === 'myteam' ? 'Готово' : 'В бой!') : 'Дальше';
  $('teamGo').classList.toggle('dis', !f.cur || (f.cur === 'balanced' && !t));
}
function teamGo() {
  const f = teamFlow; if (!f.cur) return;
  if (f.step === 0) {
    f.my = f.cur; settings.myTeam = f.cur; save();
    if (f.mode === 'comp') { comp = newComp(f.comp, f.cur); settings.comp = comp; hubTab = 0; save(); enterHub(); return; }
    if (f.mode === 'myteam') { enterMenuScene(); show('ward'); renderWard(); return; }
    f.step = 1; f.cur = f.mode === 'versus' ? null : 'rand'; f.balancedOpp = null; f.leaguePick = null; renderTeams(); return;
  }
  const eligible = teamsEligibleForFlow(f); const oppPool = eligible.filter(t => t.id !== f.my); const opp = f.cur === 'rand' ? pick(oppPool.length ? oppPool : teamsForFlow(f).filter(t => t.id !== f.my)) : f.cur === 'balanced' ? (oppPool.find(t => t.id === f.balancedOpp) || balancedOpponent(f, oppPool)) : teamById(f.cur), mine = teamById(f.my);
  if (!opp) return;
  if (f.mode === 'pens') startPensFlow(mine, opp);
  else launchMatch({ tA: mine, tB: opp, size: settings.size, versus: f.mode === 'versus', ko: false, comp: false });
}
function launchMatch(cfg) {
  pendingCfg = cfg;
  if (!settings.tutDone) { show('tut'); return; }
  setScreen(null); startMatch(cfg);
}
function startPensFlow(a, b) {
  setScreen(null); setTheme('');
  startPens({ tA: a, tB: b, onDone: r => {
    enterMenuScene(); if (r.win) { settings.wins++; save(); }
    $('endBody').innerHTML = `<div class="et">Серия пенальти</div><div class="es"><span class="b">${a.code}</span>${r.scoreA}<span>:</span>${r.scoreB}<span class="r">${b.code}</span></div><div class="er">${r.win ? 'Победа в серии!' : 'Поражение в серии'}</div>`;
    $('endBtns').innerHTML = '<button class="mi pri" data-a="pensagain">Ещё раз</button><button class="mi" data-a="tomenu">В меню</button>';
    endCtx = { pensTeams: [a, b] }; show('end');
  } });
}

// ---------- Турнирный хаб ----------
const tmLabel = id => { const t = teamById(id); return `<span style="color:${hex(t.c1)}">●</span> ${t.name}`; };
function tableHTML(grp, q) {
  const st = compStandings(comp, grp);
  let h = '<table class="tb"><tr><th>#</th><th>Команда</th><th>И</th><th>В</th><th>Н</th><th>П</th><th>Р</th><th>О</th></tr>';
  st.forEach((r, i) => { h += `<tr class="${r.id === comp.my ? 'me' : ''} ${i < q ? 'q' : ''}"><td>${i + 1}</td><td>${tmLabel(r.id)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td>${r.pts}</td></tr>`; });
  return h + '</table>';
}
function matchRow(m) {
  const me = m.a === comp.my || m.b === comp.my;
  const sc = m.done ? `${m.ga} : ${m.gb}${(m.ga === m.gb && (m.pa || m.pb)) ? ` (${m.pa}:${m.pb} пен.)` : ''}` : 'vs';
  return `<div class="mrow ${me ? 'me' : ''}"><span class="a">${tmLabel(m.a)}</span><span class="sc">${sc}</span><span>${tmLabel(m.b)}</span></div>`;
}
function hubTabs() {
  const t = comp.type; return (t === 'league' || t.startsWith('league_')) ? ['Таблица', 'Матчи'] : t === 'cup' ? ['Сетка', 'Матчи'] : t === 'ucl' ? ['Таблица', 'Плей-офф', 'Матчи'] : ['Группы', 'Плей-офф', 'Матчи'];
}
function renderHub() {
  const C = COMPS[comp.type], r = comp.rounds[comp.cur], tabs = hubTabs();
  $('hubTitle').textContent = C.icon + ' ' + C.name + (comp.done ? ' · завершён' : comp.out ? ' · ты выбыл' : ' · ' + r.name);
  $('hubTabs').innerHTML = tabs.map((n, i) => `<button class="${i === hubTab ? 'on' : ''}" data-a="hubtab" data-v="${i}">${n}</button>`).join('');
  const name = tabs[hubTab]; let h = '';
  if (comp.done) {
    const ch = teamById(comp.champion);
    h += `<div class="trophy"><div class="big">🏆</div><div class="er">${comp.champion === comp.my ? 'Ты чемпион!' : 'Чемпион: ' + ch.name}</div></div>`;
  }
  if (name === 'Таблица') h += tableHTML('L', comp.type === 'ucl' ? 4 : 1);
  else if (name === 'Группы') h += '<div class="gname">Группа A</div>' + tableHTML('A', 2) + '<div class="gname">Группа B</div>' + tableHTML('B', 2);
  else if (name === 'Плей-офф' || name === 'Сетка') {
    const ko = comp.rounds.filter(x => x.ko); h += ko.length ? ko.map(x => `<div class="gname">${x.name}</div>` + x.matches.map(matchRow).join('')).join('') : '<p class="help">Плей-офф начнётся после общего этапа.</p>';
  } else h += comp.rounds.map(x => `<div class="gname">${x.name}</div>` + x.matches.map(matchRow).join('')).join('');
  $('hubBody').innerHTML = h;
  const nm = compNextMatch(comp); let b = '';
  if (comp.done) b = '<button class="mi pri" data-a="hubexit">В меню</button>';
  else if (comp.out || !nm) b = '<button class="mi pri" data-a="simrest">Досчитать турнир</button><button class="mi" data-a="hubexit">В меню</button>';
  else b = `<button class="mi pri" data-a="playcomp">Играть: ${teamById(nm.a).code} — ${teamById(nm.b).code}</button><button class="mi" data-a="simround">Симулировать</button><button class="mi" data-a="hubexit">В меню</button>`;
  $('hubBtns').innerHTML = b;
}
const renderHubV33Base = renderHub;
renderHub = function(){ renderHubV33Base.apply(this, arguments); const host = $('hubBtns'); if(host && !host.querySelector('[data-a="hubbackV33"]')) host.insertAdjacentHTML('afterbegin','<button class="mi" data-a="hubbackV33">← Назад к турнирам</button>'); };
function enterHub() { enterMenuScene(); setTheme(COMPS[comp.type].theme); renderHub(); show('hub'); }
function playComp() {
  const m = compNextMatch(comp); if (!m) return; const mine = teamById(comp.my), opp = teamById(m.a === comp.my ? m.b : m.a);
  launchMatch({ tA: mine, tB: opp, size: settings.size, versus: false, ko: comp.rounds[comp.cur].ko, comp: true });
}
function finishComp(ures) {
  compPlay(comp, ures); settings.comp = comp;
  if (comp.done && comp.champion === comp.my) settings.trophies.push(comp.type);
  save(); hubTab = 0; enterHub();
}

// ---------- Конец матча ----------
function statRow(l, a, b) { return `<tr><td>${a}</td><td>${l}</td><td>${b}</td></tr>`; }
function onMatchEnd(res) {
  endCtx = res; const cfg = res.cfg, sc = res.score, st = res.stats, tie = sc[0] === sc[1], needPens = !!(cfg.comp && cfg.ko && tie);
  if (cfg.utManaged) { utMatchFinished(sc, st, cfg); }
  if (!cfg.versus && sc[0] > sc[1]) { settings.wins++; save(); }
  const tA = cfg.tA, tB = cfg.tB, p0 = st.poss[0] + st.poss[1] || 1, pa = Math.round(st.poss[0] / p0 * 100);
  const r = cfg.versus ? (tie ? 'Ничья' : (sc[0] > sc[1] ? 'Победил игрок 1' : 'Победил игрок 2')) : (tie ? (needPens ? 'Ничья — пенальти!' : 'Ничья') : sc[0] > sc[1] ? 'Победа!' : 'Поражение');
  $('endBody').innerHTML = `<div class="et">Финальный свисток${cfg.comp ? ' · ' + comp.rounds[comp.cur].name : ''}</div>
    <div class="es"><span class="b">${tA.code}</span>${sc[0]}<span>:</span>${sc[1]}<span class="r">${tB.code}</span></div><div class="er">${r}</div>
     <table class="stats">${statRow('Удары', st.shots[0], st.shots[1])}${statRow('В створ', st.on[0], st.on[1])}${statRow('Сейвы', st.saves[0], st.saves[1])}${statRow('Передачи', st.pass[0], st.pass[1])}${statRow('Навесы', st.cross[0], st.cross[1])}${statRow('Владение', pa + '%', (100 - pa) + '%')}${statRow('Бонусы', st.pick[0], st.pick[1])}</table>`;
  $('endBtns').innerHTML = cfg.comp ? `<button class="mi pri" data-a="endnext">${needPens ? 'Серия пенальти' : 'Дальше'}</button>`
    : cfg.utManaged ? '<button class="mi pri" data-a="utReplay">Реванш клуба</button><button class="mi" data-a="utReturn">В Ultimate Team</button>'
    : '<button class="mi pri" data-a="restart">Реванш</button><button class="mi" data-a="tomenu">В меню</button>';
  say(cfg.versus ? 'draw' : tie ? 'draw' : sc[0] > sc[1] ? 'win' : 'lose', true); setScreen('end'); applyUIState();
}

// ---------- Настройки ----------
const onoff = [[true, 'Вкл'], [false, 'Выкл']];
const SET_TABS = [
  { id: 'game', name: 'Игровой процесс', items: [
    { k: 'time', label: 'Длительность матча', type: 'slider', min: 60, max: 600, step: 30, fmt: v => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` },
    { k: 'diff', label: 'Сложность', opts: [[0, 'Лёгкая'], [1, 'Обычная'], [2, 'Сложная']] },
    { k: 'size', label: 'Состав', opts: [[3, '3×3'], [5, '5×5'], [11, '11×11']] },
    { k: 'power', label: 'Бонусы на поле', opts: onoff }, { k: 'autoSwitch', label: 'Авто-смена игрока', opts: onoff },
    { k: 'assist', label: 'Помощь в прицеле', opts: onoff }, { k: 'comment', label: 'Комментатор', opts: onoff }, { k: 'replay', label: 'Повтор гола', opts: onoff },
    { k: 'stadium', label: 'Стадион', opts: [['classic', 'Классика'], ['arena', 'Большая арена'], ['dome', 'Крытый'], ['coastal', 'Морской'], ['neon', 'Неон'], ['royal', 'Королевский'], ['desert', 'Пустынный'], ['winter', 'Зимний']] },
    { k: 'tod', label: 'Время суток', opts: [['auto', 'Авто'], ['day', 'День'], ['dusk', 'Вечер'], ['night', 'Ночь']] },
    { k: 'weather', label: 'Погода', opts: [['auto', 'Авто'], ['clear', 'Ясно'], ['rain', 'Дождь'], ['snow', 'Снег'], ['fog', 'Туман']] }] },
  { id: 'gfx', name: 'Графика', items: [
    { k: 'gfx', label: 'Пресет графики', opts: [['min', 'Минимум'], ['low', 'Низкое'], ['med', 'Среднее'], ['high', 'Высокое'], ['ultra', 'Ультра'], ['auto', 'Авто'], ['custom', 'Свои']] },
    { k: 'res', label: 'Масштаб разрешения', type: 'slider', min: 50, max: 100, fmt: v => v + '%' },
    { k: 'shadowQ', label: 'Тени', opts: [['off','Выкл'],['low','Низкие'],['medium','Средние'],['high','Высокие'],['auto','Авто']] },
    { k: 'shadowRate', label: 'Частота обновления теней', opts: [[0,'Авто'],[1,'Каждый кадр'],[2,'Каждые 2 кадра'],[4,'Каждые 4 кадра']] },
    { k: 'stadiumDetail', label: 'Детализация стадиона', opts: [['auto','Авто'],['low','Низкая'],['medium','Средняя'],['high','Высокая']] },
    { k: 'crowd', label: 'Плотность толпы', opts: [[-1, 'Авто'], [0, 'Нет'], [1, 'Мало'], [2, 'Средне'], [3, 'Много']] },
    { k: 'crowdAnimate', label: 'Анимация толпы', opts: onoff },
    { k: 'grassDetail', label: 'Детализация травы', opts: onoff }, { k: 'reflections', label: 'Блеск мокрого поля', opts: onoff },
    { k: 'parts', label: 'Количество частиц', opts: [[-1, 'Авто'], [0, 'Выкл'], [1, 'Мало'], [2, 'Много']] },
    { k: 'brightness', label: 'Яркость', type: 'slider', min: 50, max: 150, fmt: v => v + '%' },
    { k: 'contrast', label: 'Контраст', type: 'slider', min: 50, max: 150, fmt: v => v + '%' },
    { k: 'saturation', label: 'Насыщенность', type: 'slider', min: 0, max: 150, fmt: v => v + '%' },
    { k: 'vignette', label: 'Виньетка', opts: onoff }, { k: 'glow', label: 'Вспышка гола', opts: onoff },
    { k: 'ballTrail', label: 'След мяча', opts: onoff }, { k: 'showFps', label: 'FPS и время кадра', opts: onoff }] },
  { id: 'shaders', name: 'Шейдеры', items: [
    { k: 'shaderFXV36', label: 'Постобработка включена', opts: onoff },
    { k: 'shaderPreset', label: 'Визуальный стиль', opts: [['cinematic','Кино'],['sport','Спорт'],['neon','Неон'],['natural','Натуральный'],['custom','Ручной']] },
    { k: 'shaderQuality', label: 'Качество шейдеров', opts: [['balanced','Лёгкие'],['high','Высокие'],['ultra','Ультра'],['auto','Авто']] },
    { k: 'shaderBloom', label: 'Сила свечения (Bloom)', type: 'slider', min: 0, max: 150, fmt: v => v + '%' },
    { k: 'shaderChromatic', label: 'Цветные края объектива', type: 'slider', min: 0, max: 100, fmt: v => v + '%' },
    { k: 'shaderGrain', label: 'Киношное зерно', type: 'slider', min: 0, max: 50, fmt: v => v + '%' },
    { k: 'shaderSharpen', label: 'Резкость изображения', type: 'slider', min: 0, max: 100, fmt: v => v + '%' },
    { k: 'shaderVignette', label: 'Затемнение по краям', type: 'slider', min: 0, max: 70, fmt: v => v + '%' },
    { k: 'shaderExposure', label: 'Экспозиция', type: 'slider', min: 50, max: 150, fmt: v => v + '%' },
    { k: 'shaderSaturation', label: 'Насыщенность цветов', type: 'slider', min: 0, max: 150, fmt: v => v + '%' }
  ] },
  { id: 'performance', name: 'Производительность', items: [
    { k: 'fpsCap', label: 'Лимит кадров', opts: [[30,'30 FPS'],[45,'45 FPS'],[60,'60 FPS'],[90,'90 FPS'],[120,'120 FPS'],[0,'Без лимита']] },
    { k: 'dynamicRes', label: 'Динамическое разрешение', opts: onoff }, { k: 'powerSave', label: 'Экономия батареи', opts: onoff },
    { k: 'viewDist', label: 'Дальность видимости', type: 'slider', min: 70, max: 160, fmt: v => v + '%' },
    { k: 'weatherIntensity', label: 'Интенсивность погоды', type: 'slider', min: 0, max: 150, fmt: v => v + '%' }] },
  { id: 'camera', name: 'Камера', items: [
    { k: 'cam', label: 'Ракурс', opts: [[0, 'ТВ'], [1, 'Близко'], [2, 'Сверху']] },
    { k: 'cameraFov', label: 'Угол обзора', type: 'slider', min: 40, max: 75, fmt: v => v + '°' },
    { k: 'cameraHeight', label: 'Высота камеры', type: 'slider', min: 70, max: 150, fmt: v => v + '%' },
    { k: 'cameraDistance', label: 'Дистанция камеры', type: 'slider', min: 70, max: 150, fmt: v => v + '%' },
    { k: 'cameraSmooth', label: 'Плавность камеры', type: 'slider', min: 50, max: 150, fmt: v => v + '%' },
    { k: 'cameraShake', label: 'Тряска камеры', opts: onoff },
    { k: 'uiAnim', label: 'Анимации интерфейса', opts: [['full','Полные'],['reduced','Уменьшенные'],['off','Выключены']] }] },
  { id: 'snd', name: 'Звук', items: [
    { k: 'vMaster', label: 'Общая громкость', type: 'slider', min: 0, max: 100, fmt: v => v + '%' }, { k: 'vMusic', label: 'Музыка', type: 'slider', min: 0, max: 100, fmt: v => v + '%' },
    { k: 'vSfx', label: 'Эффекты', type: 'slider', min: 0, max: 100, fmt: v => v + '%' }, { k: 'vCrowd', label: 'Трибуны', type: 'slider', min: 0, max: 100, fmt: v => v + '%' }] },
  { id: 'music', name: 'Музыка', items: [
    { k: 'musicEnabled', label: 'Музыка включена', opts: onoff },
    { k: 'musicMenu', label: 'Трек главного меню', opts: MUSIC_OPTIONS.menu },
    { k: 'musicTour', label: 'Трек турнира', opts: MUSIC_OPTIONS.tour },
    { k: 'musicMatch', label: 'Тема выхода команд', opts: MUSIC_OPTIONS.match }
  ] },
  { id: 'ctl', name: 'Управление', items: [
    { k: 'inputModeV33', label: 'Устройство управления', opts: [['auto','Авто'],['pc','ПК / клавиатура'],['touch','Телефон / планшет'],['gamepad','Геймпад']] },
    { k: 'keyboardLayoutV33', label: 'Схема клавиатуры', opts: [['wasd','WASD + пробел'],['arrows','Стрелки + Enter']] },
    { k: 'hand', label: 'Стик', opts: [['right', 'Справа'], ['left', 'Слева']] },
    { k: 'sensitivity', label: 'Чувствительность стика', type: 'slider', min: 50, max: 150, fmt: v => v + '%' }, { k: 'deadZone', label: 'Мёртвая зона', type: 'slider', min: 0, max: 40, fmt: v => v + '%' },
    { k: 'btn', label: 'Размер кнопок', type: 'slider', min: 70, max: 140, fmt: v => v + '%' }, { k: 'opac', label: 'Прозрачность', type: 'slider', min: 30, max: 100, fmt: v => v + '%' },
    { k: 'vib', label: 'Вибрация', opts: onoff }, { k: 'touchUI', label: 'Экранные кнопки', opts: [['auto', 'Авто'], ['on', 'Вкл'], ['off', 'Выкл']] }] },
  { id: 'cross', name: 'Навесы', items: [
    { k: 'crossEnabled', label: 'Навесы включены', opts: onoff },
    { k: 'crossAutoTarget', label: 'Автовыбор партнёра', opts: onoff },
    { k: 'crossLead', label: 'Пас на ход', opts: onoff },
    { k: 'crossHigh', label: 'Высокая дуга', opts: onoff },
    { k: 'crossLow', label: 'Низкий прострел', opts: onoff },
    { k: 'crossCurve', label: 'Подкрутка мяча', opts: onoff },
    { k: 'crossAvoidBlocks', label: 'Учитывать защитников', opts: onoff },
    { k: 'crossRun', label: 'Забегание в штрафную', opts: onoff },
    { k: 'crossPower', label: 'Сила по расстоянию', opts: onoff },
    { k: 'crossHint', label: 'Подсветка кнопки навеса', opts: onoff }
  ] }
];
let setTab = 0;
function renderSettings() {
  $('setTabs').innerHTML = SET_TABS.map((t, i) => `<button class="${i === setTab ? 'on' : ''}" data-a="settab" data-v="${i}">${t.name}</button>`).join('');
  const tab = SET_TABS[setTab];
  let h = tab.items.map(it => it.type === 'slider'
    ? `<div class="opt"><span>${it.label}</span><div class="sl" data-k="${it.k}" data-min="${it.min}" data-max="${it.max}"><i></i><b></b><em></em></div></div>`
    : `<div class="opt"><span>${it.label}</span><div class="sg">${it.opts.map((o, i) => `<button data-a="setopt" data-k="${it.k}" data-i="${i}" class="${String(settings[it.k]) === String(o[0]) ? 'on' : ''}">${o[1]}</button>`).join('')}</div></div>`).join('');
  if (tab.id === 'music') h += '<div class="kbhelp">Оригинальные процедурные темы играют в меню, турнирах и во время выхода команд на поле. После стартового свистка музыка автоматически выключается: остаются звук трибун, свисток, шаги, пасы, удары, сетка ворот и реакции игроков. Название трека кратко появляется только в меню при переключении.</div>';
  if (tab.id === 'game') h += '<div class="kbhelp"><b>Сложность</b> меняет реакцию и решения ИИ, точность ударов, темп соперника и игру вратаря. <b>Сила команды</b> отдельно зависит от скорости, силы и защиты в карточке команды: слабый состав остаётся слабее сильного даже на сложной сложности.</div>';
  if (tab.id === 'cross') h += '<div class="kbhelp">На поле нажми «НАВЕС» или R. Если включены высокая дуга и низкий прострел, высота выбирается по дистанции: близкая подача идёт ниже, дальняя — выше. Держи направление стика для выбора зоны подачи.</div>';
  if (tab.id === 'gfx') h += '<div class="kbhelp">«Ультра» — максимальная детализация по умолчанию; на телефонах разрешение экрана ограничивается автоматически для экономии памяти. «Авто» выбирает более лёгкий профиль по типу устройства. При просадках динамическое разрешение снижает нагрузку, не меняя геометрию поля.</div>';
  if (tab.id === 'shaders') h += '<div class="kbhelp"><b>Отдельный GPU-слой постобработки.</b> Bloom добавляет мягкое свечение ярким прожекторам и бликам; резкость возвращает детали; цветные края, зерно и виньетка создают эффект объектива. «Ультра» использует широкий многоточечный bloom, «Высокие» — более лёгкий, «Авто» выбирает уровень с учётом нагрузки. Для чистой картинки отключи зерно и цветные края.</div>';
  if (tab.id === 'performance') h += '<div class="kbhelp" id="perfDiag">HUD показывает усреднённый FPS и оценку времени кадра в миллисекундах. Динамическое разрешение снижается при устойчивой просадке производительности.</div>';
  h += '<div class="setResetRow"><button class="mi" data-a="resetsettab">Сбросить вкладку</button><button class="mi" data-a="resetsettings">Сбросить настройки</button></div>';
  if (tab.id === 'ctl') h += '<div class="kbhelp">Выбери профиль устройства: «Авто» определяет сенсорное устройство, «ПК» скрывает экранные кнопки, «Телефон / планшет» включает сенсорные кнопки, «Геймпад» скрывает их и оставляет управление контроллером (клавиатура остаётся запасным вариантом). Здесь можно менять общий размер кнопок и сторону стика; отдельные кнопки можно перетащить в редакторе раскладки. На ПК можно выбрать WASD или стрелки. Для контроллера нажми «Настроить кнопки геймпада».<br><b>ПК по умолчанию:</b> WASD — движение, Пробел — удар, E — пас, R — навес, Shift — рывок, Q — смена игрока, Esc — пауза.</div><div class="kbhelp" id="padStatusV33" aria-live="polite"></div><div class="setResetRow"><button class="mi pri" data-a="controlsLayoutV46">Расположение кнопок</button><button class="mi" data-a="gamepadConfigV33">Настроить кнопки геймпада</button></div>';
  $('setBody').scrollTop = 0; $('setBody').innerHTML = h; bindSliders($('setBody'), tab);
}
function bindSliders(root, tab) {
  root.querySelectorAll('.sl').forEach(el => {
    const k = el.dataset.k, mn = +el.dataset.min, mx = +el.dataset.max, it = tab.items.find(x => x.k === k), down = { on: false };
    const paint = () => { const p = (settings[k] - mn) / (mx - mn); el.querySelector('i').style.width = (p * 100) + '%'; el.querySelector('b').style.left = (p * 100) + '%'; el.querySelector('em').textContent = it.fmt(settings[k]); };
    const setFrom = e => {
      const r = el.getBoundingClientRect(); settings[k] = Math.round(mn + clamp((e.clientX - r.left) / r.width, 0, 1) * (mx - mn));
      if (k === 'time') settings[k] = clamp(Math.round(settings[k] / (it.step || 1)) * (it.step || 1), mn, mx);
      if (/^shader(Bloom|Chromatic|Grain|Sharpen|Vignette|Exposure|Saturation)$/.test(k)) {
        settings.shaderPreset = 'custom';
        root.querySelectorAll('[data-k="shaderPreset"]').forEach(btn => btn.classList.toggle('on', btn.dataset.i === String((SET_TABS.find(t=>t.id==='shaders').items.find(x=>x.k==='shaderPreset').opts.findIndex(o=>o[0]==='custom')))));
      }
      paint(); onSettingChanged(k); save();
    };
    el.addEventListener('pointerdown', e => { down.on = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} Audio_.init(); setFrom(e); });
    el.addEventListener('pointermove', e => { if (down.on) setFrom(e); });
    const up = () => { down.on = false; if (/^v/.test(k)) SFX.kick(0.5, 0); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    paint();
  });
}
function applyVisualFilters() {
  if (renderer && renderer.domElement) renderer.domElement.style.filter = `brightness(${settings.brightness / 100}) contrast(${settings.contrast / 100}) saturate(${settings.saturation / 100})`;
  const v = $('vig'); if (v) v.style.display = settings.vignette ? '' : 'none';
  document.documentElement.dataset.anim = settings.uiAnim || 'full';
  ballGlow.visible = !!settings.glow && ball.fire > 0;
  trailPts.visible = !!settings.ballTrail && trailHist.length > 1;
}
function onSettingChanged(k) {
  if (k === 'gfx' || k === 'res' || k === 'powerSave') { applyRes(); }
  if (k === 'stadium') applyStadiumStyle();
  if (['gfx','shadowQ','grassDetail','powerSave'].includes(k)) applyGfxQuality();
  if (['gfx','crowd','stadium','stadiumDetail','powerSave','crowdAnimate'].includes(k)) { buildStands(); refreshSpectatorTeams(sideTeam[0], sideTeam[1]); }
  if (['gfx','parts','weatherIntensity','reflections','viewDist'].includes(k)) applyEnv(curEnv.tod, curEnv.weather);
  if (k === 'tod' || k === 'weather') applyEnv(settings.tod, settings.weather);
  if (['brightness','contrast','saturation','vignette','glow','ballTrail','uiAnim'].includes(k)) applyVisualFilters();
  if (k === 'shaderFXV36' || k === 'shaderPreset' || k === 'shaderQuality' || /^shader(Bloom|Chromatic|Grain|Sharpen|Vignette|Exposure|Saturation)$/.test(k)) {
    if (renderer && renderer.__cowballPostFXV36) { renderer.__cowballPostFXV36.material.uniforms.uBloomStrength.value = Math.max(0, Number(settings.shaderBloom) || 0) * 0.004; }
  }
  if (k === 'cameraFov') { camera.fov = settings.cameraFov; camera.updateProjectionMatrix(); }
  if (k === 'cameraHeight' || k === 'cameraDistance' || k === 'cameraSmooth') { /* применяются плавно в цикле камеры */ }
  if (k === 'cameraShake' && !settings.cameraShake) shake = 0;
  if (k === 'vMaster' || k === 'vMusic' || k === 'vSfx' || k === 'vCrowd') Audio_.applyVolumes();
  if (k === 'musicEnabled' || k === 'musicMenu' || k === 'musicTour' || k === 'musicMatch') {
    Audio_.applyVolumes();
    const mode = state === 'menu' ? (screen === 'hub' || screen === 'tours' || screen === 'teams' ? 'tour' : 'menu') : (state === 'ready' && introFull ? 'match' : null);
    if (mode) Audio_.music.play(mode); else Audio_.music.stop();
  }
  if (k === 'crossEnabled') $('bCross').disabled = !settings.crossEnabled;
  if (k === 'hand' || k === 'btn' || k === 'opac' || k === 'controlsLayoutV46') applyControlsLayout();
  if (k === 'touchUI' || k === 'showFps') applyUIState();
  if (k === 'crowdAnimate' || k === 'powerSave') applyVisualFilters();
}

// ---------- Гардероб, автор ----------
function renderWard() {
  const row = (label, key, arr) => `<div class="opt"><span>${label}</span><div class="sg">${arr.map((n, i) => `<button data-a="wardopt" data-k="${key}" data-i="${i}" class="${settings[key] === i ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
  $('wardBody').innerHTML = `<div class="opt"><span>Команда</span><div class="sg"><button class="on">${teamById(settings.myTeam).name}</button><button data-a="wardteam">Сменить</button></div></div>` +
    row('Шапка', 'hat', HATS) + row('Мяч', 'ballStyle', BALLS.map(b => b.n));
}
function renderAuthor() {
  $('verTxt').textContent = APP_VERSION; $('authName').textContent = AUTHOR.name; $('authHandle').textContent = AUTHOR.handle;
  $('authLinks').innerHTML = AUTHOR.links.length ? AUTHOR.links.map(l => `<p class="help"><b>${l.label}:</b> ${l.url}</p>`).join('') : '<p class="help" style="color:var(--mut)">Ссылки на соцсети скоро появятся.</p>';
}

// ---------- Роутер действий ----------
const ACT = {
  home() { goHome(); },
  controlsLayoutV46() { openTouchControlEditorV46(); },
  controlsLayoutCloseV46() { if(settings.controlsLayoutV46&&!Object.keys(settings.controlsLayoutV46).length)settings.controlsLayoutV46=null; save(); closeTouchControlEditorV46(); },
  controlsLayoutResetV46() { settings.controlsLayoutV46 = null; save(); applyTouchControlPositionsV46(); },
  quick() { openTeams('quick'); }, versus() { openTeams('versus'); }, pens() { openTeams('pens'); },
  tours() { renderTours(); show('tours'); }, tour(d) { openTeams('comp', d.v); },
  continue() { comp = settings.comp; hubTab = 0; if (comp) enterHub(); },
  wardrobe() { renderWard(); show('ward'); }, wardteam() { openTeams('myteam'); },
  wardopt(d) { settings[d.k] = +d.i; save(); setBallStyle(settings.ballStyle); enterMenuScene(); renderWard(); },
  settings() { setReturn = 'home'; setTab = 0; renderSettings(); show('settings'); },
  settab(d) { setTab = +d.v; renderSettings(); },
  resetsettab() { const t=SET_TABS[setTab]; if(!t||!confirm('Сбросить настройки вкладки «'+t.name+'»?')) return; const keys=[...new Set(t.items.map(it=>it.k))]; keys.forEach(k=>{ if(Object.prototype.hasOwnProperty.call(DEF,k)) settings[k]=DEF[k]; }); if(t.id==='ctl')settings.controlsLayoutV46=null; save(); keys.forEach(onSettingChanged); applyControlsLayout(); applyVisualFilters(); renderSettings(); },
  resetsettings() { if(!confirm('Сбросить все настройки игры? Прогресс, турниры и клуб Ultimate Team останутся.')) return; const keep=['myTeam','wins','played','goals','tutDone','trophies','comp','utData']; Object.keys(DEF).forEach(k=>{ if(!keep.includes(k)) settings[k]=DEF[k]; }); save(); applyControlsLayout(); applyRes(); applyGfxQuality(); buildStands(); applyVisualFilters(); applyEnv(settings.tod,settings.weather); renderSettings(); },
  ut() { utTab='club'; renderUT(); show('ut'); },
  utTab(d) { utTab=d.v; renderUT(); },
  utSort(d) { ut.sort=d.v; renderUT(); },
  utRename() { const v=$('utNameInput'); if(v){ ut.name=v.value.trim().slice(0,28)||'Молочный клуб'; settings.utData=ut; save(); renderUT(); } },
  utEmblem() { ut.badge=(UT_BADGES[(UT_BADGES.indexOf(ut.badge)+1)%UT_BADGES.length]||UT_BADGES[0]); settings.utData=ut; save(); renderUT(); },
  utFormation(d) { ut.formation=d.v; utAutoLineup(); saveUT(); renderUT(); },
  utAuto() { utAutoLineup(); saveUT(); renderUT(); },
  utAssign(d) { utAssignSlot(+d.i); saveUT(); renderUT(); },
  utPack(d) { utOpenPack(d.v); renderUT(); },
  utCloseReveal() { const el=$('utReveal'); if(el) el.classList.add('hide'); },
  utBuy(d) { utBuyMarket(d.id); renderUT(); },
  utSell(d) { utSellCard(d.id,false); renderUT(); },
  utQuickSell(d) { utSellCard(d.id,true); renderUT(); },
  utClaim(d) { utClaimObjective(d.id); renderUT(); },
  utRefreshMarket() { utRefreshMarket(true); saveUT(); renderUT(); },
  utPlay(d) { utStartMatch(d.v); },
  utReturn() { setScreen(null); utTab='club'; renderUT(); show('ut'); },
  utReplay() { const mode=endCtx&&endCtx.cfg?endCtx.cfg.utMode:'friendly'; setScreen(null); utStartMatch(mode); },
  utReset() { if(!confirm('Удалить весь прогресс Ultimate Team — клуб, карточки, монеты и статистику? Это действие необратимо.')) return; settings.utData=createUT(); ut=settings.utData; save(); renderUT(); },
  setopt(d) { const tab = SET_TABS[setTab], it = tab.items.find(x => x.k === d.k); settings[d.k] = it.opts[+d.i][0];
    if (d.k === 'shaderPreset') {
      const presets = {
        cinematic: { shaderBloom:70, shaderChromatic:30, shaderGrain:10, shaderSharpen:30, shaderVignette:25, shaderExposure:100, shaderSaturation:105 },
        sport:     { shaderBloom:55, shaderChromatic:5,  shaderGrain:0,  shaderSharpen:62, shaderVignette:8,  shaderExposure:103, shaderSaturation:112 },
        neon:      { shaderBloom:125,shaderChromatic:45, shaderGrain:5,  shaderSharpen:25, shaderVignette:32, shaderExposure:105, shaderSaturation:135 },
        natural:   { shaderBloom:25, shaderChromatic:0,  shaderGrain:0,  shaderSharpen:22, shaderVignette:0,  shaderExposure:100, shaderSaturation:100 }
      };
      if (presets[settings.shaderPreset]) Object.assign(settings, presets[settings.shaderPreset]);
    }
    save(); onSettingChanged(d.k); renderSettings(); },
  setback() { save(); if (setReturn === 'pause') { setScreen('pause'); applyUIState(); } else show('home'); },
  help() { show('help'); }, author() { renderAuthor(); show('author'); },
  pickteam(d) { teamFlow.cur = d.v; renderTeams(); }, teamcat(d) { teamCategory = d.v; teamFlow.balancedOpp = null; const visible = teamsEligibleForFlow(teamFlow); const special = ['rand','balanced'].includes(teamFlow.cur); if ((!special && !visible.some(t => t.id === teamFlow.cur)) || (teamFlow.cur === 'balanced' && !visible.some(t => t.id !== teamFlow.my))) teamFlow.cur = visible[0] ? visible[0].id : null; renderTeams(); }, teamgo() { teamGo(); },
  teamback() { if (teamFlow.step > 0) { teamFlow.step--; teamFlow.cur = teamFlow.my; renderTeams(); } else if (teamFlow.mode === 'comp') { renderTours(); show('tours'); } else if (teamFlow.mode === 'myteam') { renderWard(); show('ward'); } else goHome(); },
  hubtab(d) { hubTab = +d.v; renderHub(); }, playcomp() { playComp(); },
  simround() { compPlay(comp, null); settings.comp = comp; if (comp.done && comp.champion === comp.my) settings.trophies.push(comp.type); save(); hubTab = 0; renderHub(); },
  simrest() { compSimRest(comp); settings.comp = comp; save(); renderHub(); },
  hubexit() { if (comp && (comp.done)) { settings.comp = null; save(); } goHome(); },
  pause() { pauseGame(); }, resume() { resumeGame(); },
  pausesettings() { setReturn = 'pause'; setTab = 0; renderSettings(); setScreen('settings'); applyUIState(); },
  restart() { const base = (state === 'end' && endCtx && endCtx.cfg) ? endCtx.cfg : matchCfg; setScreen(null); startMatch(Object.assign({}, base)); },
  tomenu() { goHome(); },
  endnext() {
    const c = endCtx, sc = c.score, cfg = c.cfg; setScreen(null);
    if (cfg.comp && cfg.ko && sc[0] === sc[1]) startPens({ tA: cfg.tA, tB: cfg.tB, onDone: r => finishComp({ gm: sc[0], go: sc[1], pm: r.scoreA, po: r.scoreB }) });
    else finishComp({ gm: sc[0], go: sc[1], pm: 0, po: 0 });
  },
  pensagain() { startPensFlow(endCtx.pensTeams[0], endCtx.pensTeams[1]); },
  tutok() { settings.tutDone = true; save(); setScreen(null); startMatch(pendingCfg); },
  skipreplay() { if (state === 'replay') endReplay(); },
  skipintro() { if (state === 'ready' && introFull) { introT = Math.max(introT, INTRO.P3); bannerEl().innerHTML = ''; cows.forEach(c => { c.g.visible = true; }); } else if (state === 'outro') finishMatchNow(); },
  dive(d) { penDive(+d.v); }
};

// ================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ v11 ==================
// Этот слой расширяет существующие функции Cowball вместо замены игрового движка.
const featureStyle = document.createElement('style');
featureStyle.textContent = `
#cbFeatureModal{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));background:rgba(1,4,10,.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
#cbFeatureModal.hide{display:none!important}#cbFeatureModal .cbFeaturePanel{width:min(760px,100%);max-height:94%;overflow:auto;touch-action:pan-y;border:1px solid var(--line);border-top:4px solid var(--acc);border-radius:22px;padding:16px;background:linear-gradient(180deg,rgba(19,31,49,.98),rgba(5,10,18,.98));box-shadow:0 24px 80px #0009;color:var(--txt)}
#cbFeatureModal h2{margin:0 0 8px;font-size:clamp(24px,5vw,34px)}#cbFeatureModal .cbFeatureClose{float:right;min-width:44px;min-height:44px;border-radius:50%;background:rgba(255,255,255,.1);font-size:22px}
#cbFeatureModal .cbFeatureGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:10px 0}
#cbFeatureModal .cbFeatureCard{border:1px solid var(--line);border-radius:14px;padding:10px;background:rgba(255,255,255,.055);min-width:0}
#cbFeatureModal button{min-height:44px}#cbFeatureModal .mi{width:100%;justify-content:center;margin:3px 0;white-space:normal;padding:8px 12px}
#cbFeatureModal label{display:block;margin:12px 0 6px;font-weight:700}#cbFeatureModal input[type=range]{width:100%;min-height:34px;accent-color:var(--acc)}#cbFeatureModal input[type=color],#cbFeatureModal select,#cbFeatureModal input[type=text]{width:100%;min-height:44px;border-radius:10px;border:1px solid var(--line);padding:7px;background:#101a29;color:#fff}
#cbFeatureModal .cbFeatureStat{font-size:13px;color:var(--mut);line-height:1.45}#cbFeatureModal .cbBadge{font-size:28px;display:inline-grid;place-items:center;width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.08)}
html[data-access=large] .mi,html[data-access=large] .tabs button,html[data-access=large] .tc,html[data-access=large] .tbtn{min-height:52px;font-size:1.08em}html[data-access=large] #tbtns{transform:scale(1.12);transform-origin:bottom right}
html[data-access=contrast]{--panel:rgba(0,0,0,.98);--line:rgba(255,255,255,.55);--mut:#e1e9f6;--surface:rgba(255,255,255,.15)}html[data-access=contrast] .mi,html[data-access=contrast] .tc,html[data-access=contrast] .cc{border:2px solid #fff!important}
html[data-access=colorblind] #sb .nm.b{border-bottom:4px solid #56b4e9}html[data-access=colorblind] #sb .nm.r{border-bottom:4px dashed #e69f00}html[data-access=colorblind] .tc{outline:1px dashed rgba(255,255,255,.32)}
html[data-access=reduced] *,html[data-access=reduced] *:before,html[data-access=reduced] *:after{animation-duration:.01ms!important;transition-duration:.01ms!important}
@media(max-width:540px){#cbFeatureModal .cbFeaturePanel{padding:12px;border-radius:16px}#cbFeatureModal .cbFeatureGrid{grid-template-columns:1fr 1fr}}
`;
document.head.appendChild(featureStyle);
let featureModalState = null;
let photoModeState = { active: false, angle: 35, distance: 17, height: 8 };
let replayCamState = { angle: 0, distance: 15, height: 7 };
let kitEditorIndex = settings.activeFormTemplate || 0;
let subSelectOut = null, matchSubsUsed = 0, genericBench = [];
const ruleStats = { offsides: [0,0], foulsFor: [0,0], foulsAgainst: [0,0], yellows: [0,0], reds: [0,0], corners: [0,0], throwIns: [0,0], goalKicks: [0,0], penalties: [0,0], substitutions: [0,0] };
let ruleFouls = new WeakMap();
let offsidePhase = null, ruleModalState = null, nextFoulClock = 0, ruleIgnoreOffsideUntil = 0;
function cbEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cbLocalDate(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function cbOpenModal(kind,title,body,closeAllowed=true){
  featureModalState={kind}; let host=$('cbFeatureModal'); if(!host){host=document.createElement('div');host.id='cbFeatureModal';document.body.appendChild(host);}
  host.classList.remove('hide'); host.innerHTML=`<div class="cbFeaturePanel" role="dialog" aria-modal="true"><button class="cbFeatureClose" data-a="featureClose" aria-label="Закрыть" ${closeAllowed?'':'style="display:none"'}>×</button><h2>${title}</h2><div id="cbFeatureContent">${body}</div></div>`;
  const first=host.querySelector('button:not([disabled])'); if(first) first.focus({preventScroll:true});
}
function cbCloseModal(){const k=featureModalState&&featureModalState.kind;featureModalState=null;const host=$('cbFeatureModal');if(host){host.classList.add('hide');host.innerHTML='';}if(k==='photo')photoModeState.active=false;}
function resetRuleStats(){Object.keys(ruleStats).forEach(k=>{if(Array.isArray(ruleStats[k]))ruleStats[k].fill(0);});ruleFouls=new WeakMap();offsidePhase=null;ruleModalState=null;nextFoulClock=0;ruleIgnoreOffsideUntil=0;matchSubsUsed=0;subSelectOut=null;genericBench=[];}
function cbRuleLabel(type){return ({offside:'Офсайд',foul:'Фол · штрафной',penalty:'Пенальти',corner:'Угловой',throwin:'Вбрасывание',goalkick:'Удар от ворот'})[type]||'Стандарт';}
function cbShowRestart(type,team,x,y,reason,offender=null){
  if(state!=='play'||ruleModalState)return;
  const spotX=clamp(Number.isFinite(x)?x:ball.x,FX+CR,FX+FW-CR),spotY=type==='throwin'?clamp(Number.isFinite(y)?y:ball.y,FY+1,FY+FH-1):clamp(Number.isFinite(y)?y:ball.y,FY+CR,FY+FH-CR);
  // Freeze the scene at the whistle; players must not drift while the restart is being chosen.
  ruleModalState={type,team,x:spotX,y:spotY,reason,offender};offsidePhase=null;
  ball.carrier=null;ball.holder=null;ball.vx=ball.vy=ball.vh=0;ball.h=0;ball.curve=0;ball.crossT=0;
  ball.x=spotX;ball.y=spotY;cows.forEach(c=>{c.vx=0;c.vy=0;c.wait=Math.max(c.wait||0,8);});resetInputs();setState('rule');
  // No blocking rule menus during a match: restart automatically after a short whistle pause.
  // The awarded team always takes possession from the recorded restart spot.
  setState('rule');
  SFX.whistle(0.35);Audio_.crowd(0.18);say(type==='offside'?'foul':'tackle',true);
  const token=ruleModalState;
  const autoChoice=type==='penalty'?'shot':type==='corner'?'cross':type==='foul'?'pass':type==='throwin'?'pass':type==='goalkick'?'lob':'pass';
  setTimeout(()=>{
    if(ruleModalState===token&&state==='rule') cbTakeRestart(autoChoice);
  },420);

}
function cbSecondLastLine(team){const opp=cows.filter(c=>c.team!==team&&!c.dismissed);if(opp.length<2)return team===0?FX+FW:FX;const a=opp.slice().sort((u,v)=>team===0?v.x-u.x:u.x-v.x);return a[1].x;}
function cbCaptureOffside(kicker){
  offsidePhase=null;if(!settings.rulesEnabled||clock<ruleIgnoreOffsideUntil||!kicker||state!=='play')return;
  const team=kicker.team,dir=team===0?1:-1,line=cbSecondLastLine(team),ballX=ball.x;
  const candidates=cows.filter(c=>c.team===team&&c!==kicker&&c.role!=='gk'&&!c.dismissed&&dir*c.x>dir*(W/2)&&dir*c.x>dir*ballX+0.05&&dir*c.x>dir*line+0.05);
  if(candidates.length)offsidePhase={team,candidates:new Set(candidates),clock,ballX,line};
}
function cbCheckOffside(){
  if(!offsidePhase||ruleModalState||state!=='play')return;
  if(clock-offsidePhase.clock>600){offsidePhase=null;return;}
  const phase=offsidePhase;
  const offender=cows.find(c=>phase.candidates.has(c)&&!c.dismissed&&(ball.carrier===c||ball.holder===c||lastTouch===c)&&dBall(c)<CR+BR+38&&(ball.h||0)<1.2);
  if(offender){ruleStats.offsides[offender.team]++;const awarded=1-offender.team;cbShowRestart('offside',awarded,offender.x,offender.y,'Нападающий коснулся мяча, находясь за вторым последним соперником в момент передачи.',offender);}
}
function cbOutOfBounds(dt){
  if(!settings.rulesEnabled||state!=='play'||ruleModalState||ball.carrier||ball.holder||(ball.h||0)>12)return false;
  const px=ball.x,py=ball.y,nx=px+ball.vx*dt,ny=py+ball.vy*dt;
  const L=FX-BR,R=FX+FW+BR,T=FY-BR,B=FY+FH+BR;
  const outL=nx<L,outR=nx>R,outT=ny<T,outB=ny>B;
  if(!(outL||outR||outT||outB))return false;
  const tFor=(a,b,line)=>Math.abs(b-a)<1e-9?Infinity:(line-a)/(b-a);
  const tx=outL?tFor(px,nx,L):outR?tFor(px,nx,R):Infinity;
  const ty=outT?tFor(py,ny,T):outB?tFor(py,ny,B):Infinity;
  const crossedX=tx>=0&&tx<=1,crossedY=ty>=0&&ty<=1;
  const xFirst=(outL||outR)&&(!outT&&!outB||crossedX&&(!crossedY||tx<=ty));
  const last=lastTouch&&Number.isFinite(lastTouch.team)?lastTouch.team:1;
  if(!xFirst){
    const team=1-last;ruleStats.throwIns[team]++;
    const atX=crossedY?px+(nx-px)*ty:nx,spotX=clamp(atX,FX+CR,FX+FW-CR),spotY=outT?FY+1:FY+FH-1;
    cbShowRestart('throwin',team,spotX,spotY,'Мяч полностью пересёк боковую линию.');return true;
  }
  const crossY=crossedX?py+(ny-py)*tx:ny,inGoalY=Math.abs(crossY-H/2)<GH/2-BR*.15;
  // Let updateBall advance the ball through an open goal mouth; it will score at the crossing instead of an out restart.
  if(inGoalY&&(ball.h||0)<12)return false;
  const left=outL,attacking=left?1:0,defending=1-attacking;
  const isCorner=last===defending,team=isCorner?attacking:defending;
  const spotX=isCorner?(left?FX+CR:FX+FW-CR):(left?FX+64:FX+FW-64);
  const spotY=isCorner?(crossY<H/2?FY+CR:FY+FH-CR):H/2;
  if(isCorner)ruleStats.corners[team]++;else ruleStats.goalKicks[team]++;
  cbShowRestart(isCorner?'corner':'goalkick',team,spotX,spotY,isCorner?'Последним мяча коснулся защитник перед выходом за лицевую линию.':'Последним мяча коснулся нападающий перед выходом за лицевую линию.');return true;
}
function cbSendOff(c){if(!c||c.dismissed)return;c.dismissed=true;c.g.visible=false;const ix=cows.indexOf(c);if(ix>=0)cows.splice(ix,1);disposeCow(c);players.forEach(p=>{if(p.cow===c){p.cow=null;const next=cows.find(o=>o.team===p.team&&o.role!=='gk');if(next)setActive(p,next);}});}
function cbFoul(offender,victim,impact){
  if(!settings.rulesEnabled||state!=='play'||ruleModalState||!offender||!victim||offender.team===victim.team)return false;
  const team=victim.team;ruleStats.foulsFor[team]++;ruleStats.foulsAgainst[offender.team]++;
  const count=(ruleFouls.get(offender)||0)+1;ruleFouls.set(offender,count);
  let card=null;
  if(count>=2||impact>6.4&&Math.random()<.09){
    const yellow=(offender.cbYellows||0)+1;offender.cbYellows=yellow;ruleStats.yellows[offender.team]++;offender.cbCard='yellow';card='yellow';
    if(yellow>=2||impact>8.2&&Math.random()<.08){card='red';offender.cbCard='red';ruleStats.reds[offender.team]++;}
  }
  const nearGoal=Math.abs((team===0?FX+FW:FX)-victim.x)<155&&Math.abs(victim.y-H/2)<GH/2+75;
  const type=nearGoal?'penalty':'foul';if(type==='penalty')ruleStats.penalties[team]++;
  const restartX=type==='penalty'?(team===0?FX+FW-105:FX+105):victim.x;
  const restartY=type==='penalty'?H/2:victim.y;
  cbShowRestart(type,team,restartX,restartY,card==='red'?'Опасный фол. Игрок удалён.':card==='yellow'?'Фол остановлен: показана жёлтая карточка.':'Фол при столкновении. Назначен стандарт.',offender);
  if(card==='red')cbSendOff(offender);
  return true;
}
function cbTakeRestart(choice){
  const r=ruleModalState;if(!r)return;const team=r.team,dir=team===0?1:-1;cbCloseModal();ruleModalState=null;setState('play');
  cows.forEach(c=>{c.freeze=0;c.wait=Math.max(c.wait||0,4);});
  let human=players.find(p=>p.team===team),taker=null;
  if(human){taker=human.cow;if(!taker||taker.dismissed)taker=cows.filter(c=>c.team===team&&c.role!=='gk').sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];if(taker)setActive(human,taker);}
  else taker=cows.filter(c=>c.team===team&&c.role!=='gk').sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];
  if(!taker){resetPositions();return;}
  taker.x=clamp(r.x-dir*(CR+BR+8),FX+CR,FX+FW-CR);taker.y=clamp(r.y,FY+CR,FY+FH-CR);taker.vx=taker.vy=0;taker.ang=team===0?0:Math.PI;
  ball.x=r.x;ball.y=r.y;ball.h=ball.vh=0;ball.vx=ball.vy=0;ball.carrier=taker;ball.holder=null;lastTouch=taker;ruleIgnoreOffsideUntil=clock+25;
  const goalX=team===0?FX+FW:FX;
  if(!human){const [dx,dy]=norm(goalX-ball.x,H/2-ball.y);kickBall(taker,dx,dy,choice==='shot'||r.type==='penalty'?14:8.2,choice==='shot'||r.type==='penalty'?'shot':'pass',choice==='lob'||choice==='cross'?.20:0);}
  else if(choice==='shot'||r.type==='penalty'){let ay=H/2-ball.y;const [dx,dy]=norm(goalX-ball.x,ay);kickBall(taker,dx,dy,r.type==='penalty'?17:14,'shot',r.type==='penalty'?.015:0);}
  else {
    let target=null,bs=-Infinity;cows.forEach(m=>{if(m.team!==team||m===taker||m.role==='gk'||m.dismissed)return;const dx=m.x-taker.x,dy=m.y-taker.y,d=Math.hypot(dx,dy)||1,forward=dx*dir/d,space=Math.min(...cows.filter(o=>o.team!==team&&!o.dismissed).map(o=>Math.hypot(o.x-m.x,o.y-m.y)),200);const sc=forward*.55+Math.min(space/140,1)*.35-d/900;if(sc>bs){bs=sc;target=m;}});
    const [dx,dy]=target?norm(target.x-taker.x,target.y-taker.y):norm(goalX-ball.x,H/2-ball.y);
    const lift=choice==='lob'||choice==='cross'?.18:0;kickBall(taker,dx,dy,choice==='cross'?11:choice==='lob'?10:8.2,'pass',lift);if(target){ball.recv=target;ball.recvT=95;}if(choice==='cross')stats.cross[team]++;else stats.pass[team]++;
  }
  say(r.type==='offside'?'foul':'pass',true);applyUIState();
}
function cbRuleSummaryRows(){const a=ruleStats;return `<tr><td>Офсайды</td><td>${a.offsides[0]}</td><td>${a.offsides[1]}</td></tr><tr><td>Фолы получены</td><td>${a.foulsFor[0]}</td><td>${a.foulsFor[1]}</td></tr><tr><td>Жёлтые / красные</td><td>${a.yellows[0]} / ${a.reds[0]}</td><td>${a.yellows[1]} / ${a.reds[1]}</td></tr><tr><td>Угловые</td><td>${a.corners[0]}</td><td>${a.corners[1]}</td></tr><tr><td>Вбрасывания</td><td>${a.throwIns[0]}</td><td>${a.throwIns[1]}</td></tr><tr><td>Замены</td><td>${a.substitutions[0]}</td><td>${a.substitutions[1]}</td></tr>`;}
function cbRenderKitEditor(){const t=settings.kitTemplates[kitEditorIndex]||settings.kitTemplates[0];cbOpenModal('kit','Редактор формы',`<p class="help">Шаблоны сохраняются на устройстве. Активный шаблон применяется к форме твоей команды в новых матчах.</p><div class="cbFeatureGrid">${settings.kitTemplates.map((x,i)=>`<button class="mi ${i===kitEditorIndex?'pri':''}" data-a="kitChoose" data-i="${i}">${cbEsc(x.name)}</button>`).join('')}</div><div class="cbFeatureCard"><label for="kitTemplateName">Название комплекта</label><input id="kitTemplateName" type="text" maxlength="24" value="${cbEsc(t.name)}"><label for="kitColor1">Основной цвет</label><input id="kitColor1" type="color" value="${t.c1}"><label for="kitColor2">Дополнительный цвет</label><input id="kitColor2" type="color" value="${t.c2}"><label for="kitPattern">Рисунок майки</label><select id="kitPattern"><option value="0" ${t.pat===0?'selected':''}>Однотонная</option><option value="1" ${t.pat===1?'selected':''}>Два кольца</option><option value="2" ${t.pat===2?'selected':''}>Полосы</option><option value="3" ${t.pat===3?'selected':''}>Перевязь</option><option value="4" ${t.pat===4?'selected':''}>Диагональ</option></select><div class="utActions" style="margin-top:10px"><button class="mi pri" data-a="kitSave">Сохранить шаблон</button><button class="mi" data-a="kitUse">${settings.useCustomForm?'Отключить применение':'Применить в матчах'}</button></div><p class="cbFeatureStat">${settings.useCustomForm?'Сейчас пользовательский комплект применяется к твоей команде.':'Сейчас используются цвета выбранной команды.'}</p></div>`);
}
function cbRenderSubs(){
  const field=cows.filter(c=>c.team===0&&c.role!=='gk'&&!c.dismissed);
  let body=`<p class="help">Замены доступны в паузе. Усталость накапливается во время бега и рывка и влияет на скорость; после замены игрок получает полную энергию. Замены использованы: ${matchSubsUsed}/5.</p>`;
  if(matchSubsUsed>=5)body+='<div class="cbFeatureCard">Лимит замен исчерпан.</div>';
  else if(!subSelectOut)body+=`<p><b>1. Выбери игрока, которого заменить:</b></p><div class="cbFeatureGrid">${field.map(c=>`<button class="mi" data-a="subPickOut" data-id="${c.num}"><b>#${c.num} ${cbEsc(c.pname||'Игрок')}</b><small> · энергия ${Math.round((c.matchStamina??1)*100)}%</small></button>`).join('')}</div>`;
  else {
    body+=`<p><b>Выходящий:</b> #${subSelectOut.num} ${cbEsc(subSelectOut.pname)} · выбери замену.</p>`;
    if(matchCfg&&matchCfg.utManaged){const roleMap={gk:'ВРТ',df:'ЗЩ',mf:'ПЗ',fw:'НАП'},pos=roleMap[subSelectOut.role]||'ПЗ';const bench=ut.bench.map(utById).filter(c=>c&&([pos,'ЦП'].includes(c.pos)||pos===c.pos));body+=`<div class="cbFeatureGrid">${bench.map(c=>`<button class="mi" data-a="subPickIn" data-id="${cbEsc(c.uid)}"><b>${c.rating} · ${cbEsc(c.name)}</b><small>${c.pos} · СКР ${c.pac} · УД ${c.sho} · ПАС ${c.pas}</small></button>`).join('')||'<div class="cbFeatureCard">Нет запасного игрока подходящей позиции.</div>'}</div>`;}
    else body+=`<div class="cbFeatureGrid">${genericBench.map((c,i)=>`<button class="mi" data-a="subPickIn" data-id="${i}"><b>${cbEsc(c.name)} · ${c.rating}</b><small>${c.pos} · скорость ${c.pac} · удар ${c.sho}</small></button>`).join('')}</div>`;
    body+='<button class="mi" data-a="subCancelPick">Назад к составу</button>';
  }
  body+='<p class="cbFeatureStat">Форма игрока остаётся формой команды. Фамилия, номер, рейтинг и игровые характеристики замены обновляются.</p>';
  cbOpenModal('subs','Замены и усталость',body);
}
function cbPrepareGenericBench(out){
 const roleMap={gk:'ВРТ',df:'ЗЩ',mf:'ПЗ',fw:'НАП'},pos=roleMap[out.role]||'ПЗ';
 const style=out.role==='df'?'df':out.role==='fw'?'fw':'mf';
 const jersey=[12,13,17,18,21];
 genericBench=Array.from({length:5},(_,i)=>{
  const h=hash32((matchCfg.tA.code||'cow')+'|bench|'+out.num+'|'+i+'|'+matchSubsUsed);
  const stat=(shift,base,span)=>base+((h>>>shift)%span);
  let pac,sho,pas,dri,def,phy;
  if(style==='df'){
   pac=stat(2,48,39); sho=stat(5,34,38); pas=stat(8,48,39); dri=stat(11,40,40); def=stat(13,61,35); phy=stat(17,56,38);
  } else if(style==='fw'){
   pac=stat(2,58,39); sho=stat(5,59,36); pas=stat(8,39,40); dri=stat(11,55,40); def=stat(13,27,39); phy=stat(17,45,40);
  } else {
   pac=stat(2,51,40); sho=stat(5,44,40); pas=stat(8,57,37); dri=stat(11,54,40); def=stat(13,42,40); phy=stat(17,45,39);
  }
  const weighted=style==='df' ? pac*.12+sho*.07+pas*.15+dri*.09+def*.38+phy*.19
   : style==='fw' ? pac*.22+sho*.34+pas*.10+dri*.20+def*.04+phy*.10
   : pac*.15+sho*.11+pas*.28+dri*.20+def*.13+phy*.13;
  const rating=clamp(Math.round(weighted),58,86);
  return {uid:'gen'+i,name:NM_FIRST[h%NM_FIRST.length]+' '+NM_SUR[(h>>>5)%NM_SUR.length],pos,num:jersey[i],rating,pac,sho,pas,dri,def,phy,chemBonus:0,playStyle:style};
 });
}
function cbRefreshCowNumber(c){if(c.numberMesh){c.body.remove(c.numberMesh);c.numberMesh.geometry.dispose();c.numberMesh.material.dispose();c.numberMesh=null;}if(c.numberTexture){c.numberTexture.dispose();c.numberTexture=null;}if(c.captainBand){c.body.remove(c.captainBand);c.captainBand.geometry.dispose();c.captainBand.material.dispose();c.captainBand=null;}c.isCaptain=false;attachCowNumber(c);}
function cbPerformSub(id){if(!subSelectOut||matchSubsUsed>=5)return;const out=subSelectOut;let incoming=null;
 if(matchCfg&&matchCfg.utManaged){incoming=utById(id);if(!incoming||!ut.bench.includes(id)){alert('Карточка больше недоступна в запасе.');return;}const old=out.utCard;if(old){const ix=ut.lineup.indexOf(old.uid);if(ix>=0)ut.lineup[ix]=incoming.uid;if(!ut.bench.includes(old.uid))ut.bench.push(old.uid);}ut.bench=ut.bench.filter(x=>x!==incoming.uid);}
 else incoming=genericBench[Number(id)];
 if(!incoming)return;out.utCard=incoming;out.pname=incoming.name;out.num=incoming.num||(20+matchSubsUsed);out.matchStamina=1;out.vx=out.vy=0;out.wait=0;out.freeze=0;cbRefreshCowNumber(out);matchSubsUsed++;ruleStats.substitutions[0]++;if(matchCfg&&matchCfg.utManaged){saveUT();}subSelectOut=null;cbCloseModal();if(state==='paused')setScreen('pause');
}
function cbOpenPhoto(kind){
 if(kind==='photo'&&state!=='paused'&&state!=='replay'){alert('Сначала поставь матч на паузу, затем открой фоторежим.');return;}
 if(kind==='photo')photoModeState.active=true;
 const v=kind==='photo'?photoModeState:replayCamState;
 const body=`<p class="help">${kind==='photo'?'Положение камеры фиксируется, пока открыт фоторежим.':'Настрой камеру повтора. Повтор остановлен, пока открыта панель.'} Можно изменить ракурс, дистанцию и высоту, затем сохранить скриншот.</p><label>Поворот камеры · <span id="cbAngleVal">${v.angle}°</span></label><input type="range" min="-180" max="180" value="${v.angle}" data-photo="angle"><label>Дистанция · <span id="cbDistVal">${v.distance}</span></label><input type="range" min="8" max="30" value="${v.distance}" data-photo="distance"><label>Высота · <span id="cbHeightVal">${v.height}</span></label><input type="range" min="3" max="24" value="${v.height}" data-photo="height"><div class="cbFeatureGrid"><button class="mi pri" data-a="featureScreenshot">Сохранить PNG</button><button class="mi" data-a="featureClose">${kind==='photo'?'Готово':'Продолжить повтор'}</button></div><p class="cbFeatureStat">Скриншот берётся непосредственно из WebGL-канваса без интерфейса HTML.</p>`;
 cbOpenModal(kind,kind==='photo'?'Фоторежим':'Камера повтора',body);
}
function cbSaveScreenshot(){try{renderer.render(scene,camera);const href=renderer.domElement.toDataURL('image/png');const a=document.createElement('a');a.href=href;a.download='cowball-'+Date.now()+'.png';document.body.appendChild(a);a.click();a.remove();}catch(e){alert('Не удалось сохранить кадр. Повтори попытку после загрузки 3D-сцены.');}}
function cbApplyAccess(){const a=settings.accessProfile||'standard';document.documentElement.dataset.access=a;if(a==='reduced'&&settings.uiAnim==='full')document.documentElement.dataset.anim='reduced';}
function cbAddRecords(res){try{const row={date:new Date().toLocaleString('ru-RU'),a:res.cfg.tA.name,b:res.cfg.tB.name,score:res.score.slice(),mode:res.cfg.utManaged?('Ultimate Team · '+(res.cfg.utMode||'friendly')):res.cfg.comp?'Турнир':res.cfg.versus?'Вдвоём':'Матч',goals:res.score[0]+res.score[1]};settings.localRecords.unshift(row);settings.localRecords=settings.localRecords.slice(0,100);save();}catch(e){}}
function cbRenderRecords(){const rows=settings.localRecords||[];return `<div class="utPanel"><h3>Рекорды на этом устройстве</h3><p class="help">Здесь хранится история завершённых матчей только на этом устройстве.</p><div class="utSummary"><div class="utStat"><small>Матчи</small><b>${rows.length}</b></div><div class="utStat"><small>Голов</small><b>${rows.reduce((n,r)=>n+(r.goals||0),0)}</b></div><div class="utStat"><small>Лучший результат</small><b>${Math.max(0,...rows.map(r=>r.score?r.score[0]:0))}</b></div></div>${rows.map(r=>`<div class="korow"><div><b>${cbEsc(r.a)} ${r.score[0]} : ${r.score[1]} ${cbEsc(r.b)}</b><small style="display:block;color:var(--mut)">${cbEsc(r.date)} · ${cbEsc(r.mode)}</small></div></div>`).join('')||'<p class="help">Матчи пока не записаны.</p>'}<button class="mi" data-a="clearRecords">Очистить историю рекордов…</button></div>`;}
function cbAchievementRewardsHtml(){const all=utAchievements().concat([
 {id:'plays10',name:'Постоянный игрок',desc:'Сыграть 10 матчей',ok:ut.stats.played>=10,icon:'📆'},
 {id:'three_packs',name:'Охотник за паками',desc:'Открыть 3 пака',ok:ut.stats.packs>=3,icon:'🎁'},
 {id:'wins3',name:'Первый успех',desc:'Выиграть 3 матча',ok:ut.stats.wins>=3,icon:'🥇'},
 {id:'goals25',name:'Гол в каждом матче',desc:'Забить 25 голов',ok:ut.stats.goals>=25,icon:'⚽'},
 {id:'division5',name:'В середине таблицы',desc:'Достичь дивизиона 5 или выше',ok:ut.division<=5,icon:'📈'}
]);if(!Array.isArray(ut.achievementClaims))ut.achievementClaims=[];return `<div class="utPanel"><h3>Награды достижений</h3><p class="help">Каждая открытая награда выдаётся один раз. Награда зависит от сложности цели.</p><div class="utGrid">${all.map((a,i)=>{const claimed=ut.achievementClaims.includes(a.id),reward=100+(i%4)*75;return `<div class="utCard" style="--rarity:${a.ok?'#b8ff3d':'#647086'};opacity:${a.ok?1:.7}"><div class="rating">${a.icon}</div><b>${cbEsc(a.name)}</b><small>${cbEsc(a.desc)}</small><p>🪙 ${reward}</p><button class="mi ${a.ok&&!claimed?'pri':''}" data-a="utAchievementClaim" data-id="${cbEsc(a.id)}" data-reward="${reward}" ${!a.ok||claimed?'disabled':''}>${claimed?'Получено':a.ok?'Забрать':'Не открыто'}</button></div>`;}).join('')}</div></div>`;}
function cbSeasonKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function cbSeasonQuestHtml(){const key=cbSeasonKey();if(ut.seasonKey!==key){ut.seasonKey=key;ut.seasonWinsBase=ut.stats.wins;ut.seasonPackBase=ut.stats.packs;ut.seasonClaims=[];saveUT();}const wins=Math.max(0,ut.stats.wins-(ut.seasonWinsBase||0)),packs=Math.max(0,ut.stats.packs-(ut.seasonPackBase||0)),claims=Array.isArray(ut.seasonClaims)?ut.seasonClaims:[];const qs=[{id:'season_wins_10',title:'Сезонная серия',desc:'Выиграть 10 матчей в этом месяце',p:wins,g:10,reward:500},{id:'season_packs_8',title:'Сезон коллекционера',desc:'Открыть 8 паков в этом месяце',p:packs,g:8,reward:350}];return `<div class="utPanel"><h3>Сезонные цели · ${key}</h3>${qs.map(q=>{const ok=q.p>=q.g,claimed=claims.includes(q.id);return `<div class="utPanel"><b>${q.title}</b><p class="help">${q.desc}</p><div class="utProgress"><i style="width:${Math.min(100,q.p/q.g*100)}%"></i></div><small>${q.p}/${q.g} · 🪙 ${q.reward}</small><button class="mi ${ok&&!claimed?'pri':''}" data-a="utSeasonClaim" data-id="${q.id}" ${!ok||claimed?'disabled':''}>${claimed?'Получено':ok?'Забрать награду':'Продолжить сезон'}</button></div>`;}).join('')}</div>`;}

// A) Случайные масти построены через уже существующую геометрию и кэш, без создания объектов в каждом кадре.
const cbCoats=[{fur:0xffffff,dark:0x25282d},{fur:0xd8c3a0,dark:0x6b4d32},{fur:0x777b82,dark:0x25252a},{fur:0xeee4ce,dark:0x9c6f4c},{fur:0x2b2d36,dark:0x101116}];
const _cbMakeCow=makeCow;makeCow=function(team,role,hat){if(!settings.coatVariety)return _cbMakeCow(team,role,hat);const idx=(Math.random()*cbCoats.length)|0,coat=cbCoats[idx],variant=Object.assign({},team,{id:String(team.id)+'-coat'+idx,fur:team.fur==null?coat.fur: (idx===0?team.fur:coat.fur),dark:team.dark==null?coat.dark:(idx===0?team.dark:coat.dark)});return _cbMakeCow(variant,role,hat);};
// B) Custom kit templates affect the actual match scene, but only after the player explicitly activates one.
const _cbBuildMatch=buildMatch;buildMatch=function(cfg){let use=cfg;if(settings.useCustomForm&&!cfg?.utManaged){const t=settings.kitTemplates[settings.activeFormTemplate]||settings.kitTemplates[0];use=Object.assign({},cfg,{tA:Object.assign({},cfg.tA,{c1:parseInt(t.c1.slice(1),16),c2:parseInt(t.c2.slice(1),16),pat:t.pat})});}return _cbBuildMatch(use);};
// C) Football rules are evaluated at the instant of the touch, not from the final receiver position.
const _cbKickBall=kickBall;kickBall=function(c,dx,dy,power,kind,lift){if(c&&['pass','shot','kick'].includes(kind)&&state==='play'&&!ruleModalState)cbCaptureOffside(c);else if(c&&offsidePhase&&c.team!==offsidePhase.team)offsidePhase=null;return _cbKickBall(c,dx,dy,power,kind,lift);};
const _cbUpdateBall=updateBall;updateBall=function(dt){_cbUpdateBall(dt);cbCheckOffside();};
const _cbCollide=collide;collide=function(){const preBallX=ball.x,preBallY=ball.y;if(state==='play'&&!ruleModalState&&settings.rulesEnabled&&clock>=nextFoulClock){let candidate=null,best=0;const carrier=ball.carrier; if(carrier&&!carrier.dismissed){for(const c of cows){if(c.team===carrier.team||c.role==='gk'||c.dismissed)continue;const d=Math.hypot(c.x-carrier.x,c.y-carrier.y),rel=Math.hypot(c.vx-carrier.vx,c.vy-carrier.vy);if(d<CR*2+4&&rel>3.1&&rel>best){best=rel;candidate={offender:c,victim:carrier,impact:rel};}}}if(candidate&&Math.random()<0.018){nextFoulClock=clock+110;cbFoul(candidate.offender,candidate.victim,candidate.impact);if(ruleModalState)return;}}
 const prior=lastTouch;_cbCollide();if(state==='play')cowballCheckOutV24(preBallX,preBallY);if(offsidePhase&&lastTouch&&lastTouch.team!==offsidePhase.team)offsidePhase=null;cbCheckOffside();};
const _cbUpdateCow=updateCow;updateCow=function(c,dt){if(c.dismissed)return;const was=Math.hypot(c.vx,c.vy);_cbUpdateCow(c,dt);const moving=Math.hypot(c.vx,c.vy),inp=c.ctrl&&c.ctrl.input;if(c.matchStamina==null)c.matchStamina=1;if(moving>1.5){c.matchStamina=Math.max(.18,c.matchStamina-dt*((inp&&inp.sprint)?0.000085:0.000025));}else c.matchStamina=Math.min(1,c.matchStamina+dt*.000045);};
function cbWrapSpeed(fn){return function(c,...args){const r=fn(c,...args);if(r&&Number.isFinite(r.speed)&&c&&c.matchStamina!=null)r.speed*=.80+.20*c.matchStamina;return r;};}
humanControl=cbWrapSpeed(humanControl);fieldAI=cbWrapSpeed(fieldAI);keeperAI=cbWrapSpeed(keeperAI);
const _cbTackleSteal=tackleSteal;tackleSteal=function(c,hold){if(c)c.slideT=24;if(hold)hold.stum=1;const r=_cbTackleSteal(c,hold);return r;};
const _cbCowAnimExtra=cowAnimExtra;cowAnimExtra=function(c,spd,dt){_cbCowAnimExtra(c,spd,dt);if(c.slideT>0){c.slideT=Math.max(0,c.slideT-dt);const k=Math.sin(c.slideT/24*Math.PI);c.body.rotation.z+=.28*k;c.body.rotation.x+=.10*k;c.legs.forEach((l,i)=>{if(i<2)l.rotation.z+=.2*k*(i===0?1:-1);});}if(c.stum>0)c.body.rotation.z+=Math.sin(clock*.9+(c.lk||0))*Math.min(.2,c.stum*.2);};
const _cbStartMatchNow=startMatchNow;startMatchNow=function(cfg){resetRuleStats();const r=_cbStartMatchNow(cfg);cows.forEach(c=>{c.matchStamina=1;c.dismissed=false;});return r;};
const _cbOnMatchEnd=onMatchEnd;onMatchEnd=function(res){_cbOnMatchEnd(res);try{$('endBody').insertAdjacentHTML('beforeend',`<h3>Игровые правила</h3><table class="stats">${cbRuleSummaryRows()}</table>`);}catch(e){}};
const _cbFinishMatchNow=finishMatchNow;finishMatchNow=function(){try{cbAddRecords({cfg:matchCfg,score:score});}catch(e){}return _cbFinishMatchNow();};
const _cbStepGame=stepGame;stepGame=function(dt){if(featureModalState&&featureModalState.kind==='replayCamera')return _cbStepGame(0);return _cbStepGame(dt);};
const _cbSyncScene=syncScene;syncScene=function(dt){_cbSyncScene(dt);let opt=null;if(photoModeState.active)opt=photoModeState;else if(featureModalState&&featureModalState.kind==='replayCamera'&&state==='replay')opt=replayCamState;if(opt){const a=opt.angle*Math.PI/180,dist=+opt.distance,h=+opt.height,x=wx(ball.x),z=wz(ball.y);camera.position.set(x+Math.sin(a)*dist,h,z+Math.cos(a)*dist);camera.lookAt(x,.4,z);}};
// D) Main features: rules, substitutions, shirt editor, photography, achievements, daily/season rewards and records.
SET_TABS.push({id:'accessibility',name:'Доступность',items:[{k:'accessProfile',label:'Профиль доступности',opts:[['standard','Обычный'],['large','Крупные кнопки'],['contrast','Высокий контраст'],['colorblind','Различимые команды'],['reduced','Меньше движения']]},{k:'coatVariety',label:'Разные масти коров',opts:onoff}]});
const _cbOnSettingChanged=onSettingChanged;onSettingChanged=function(k){_cbOnSettingChanged(k);if(k==='accessProfile')cbApplyAccess();if(k==='coatVariety'){if(state==='menu')enterMenuScene();}if(k==='useCustomForm')save();};
const _cbRenderWard=renderWard;renderWard=function(){_cbRenderWard();$('wardBody').insertAdjacentHTML('beforeend','<div class="utPanel"><h3>Редактор формы</h3><p class="help">Сохраняй до восьми комплектов с отдельными цветами и рисунком майки.</p><button class="mi pri" data-a="kitEditor">Открыть редактор формы</button></div>');};
const _cbRenderUT=renderUT;renderUT=function(){_cbRenderUT();const tabs=$('utTabs');if(tabs&&!tabs.querySelector('[data-v="records"]'))tabs.insertAdjacentHTML('beforeend',`<button class="${utTab==='records'?'on':''}" data-a="utTab" data-v="records">Рекорды</button>`);if(utTab==='records')$('utBody').innerHTML=cbRenderRecords();if(utTab==='club'){$('utBody').insertAdjacentHTML('beforeend',cbAchievementRewardsHtml());const colors=['#3a86ff','#ff7a1a','#b8ff3d','#b266ff','#29d3b0','#f15b75','#f2d36b','#edf2f7'];$('utBody').insertAdjacentHTML('beforeend',`<div class="utPanel"><h3>Редактор эмблемы и цветов клуба</h3><p class="help">Нажимай на значок клуба, чтобы менять шаблон эмблемы. Цвет клуба применяется к форме и карточке клуба.</p><div class="cbFeatureGrid">${colors.map(c=>`<button class="mi" data-a="utColor" data-v="${c}" style="border-left:5px solid ${c}">Цвет <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${c};vertical-align:middle"></span> ${c}</button>`).join('')}</div><button class="mi" data-a="utEmblem">Следующий шаблон эмблемы</button></div>`);$('utBody').insertAdjacentHTML('beforeend',`<div class="utPanel"><h3>Ежедневная награда</h3><p class="help">Награда выдаётся один раз за календарный день. Серия увеличивает бонус; каждый седьмой день добавляет серебряную карточку.</p><div class="utActions"><span class="utNotice">Серия: ${ut.dailyRewardStreak||0} дн.</span><button class="mi pri" data-a="utDailyReward" ${ut.dailyRewardDate===cbLocalDate()?'disabled':''}>${ut.dailyRewardDate===cbLocalDate()?'Сегодня получено':'Забрать дневную награду'}</button></div></div>`);}if(utTab==='quests')$('utBody').insertAdjacentHTML('beforeend',cbSeasonQuestHtml());};
// UT schema: keep feature-specific progress inside the existing saved club data.
ut.dailyRewardDate=String(ut.dailyRewardDate||'');ut.dailyRewardStreak=Math.max(0,+ut.dailyRewardStreak||0);ut.achievementClaims=Array.isArray(ut.achievementClaims)?ut.achievementClaims:[];ut.seasonClaims=Array.isArray(ut.seasonClaims)?ut.seasonClaims:[];ut.seasonKey=String(ut.seasonKey||'');ut.seasonWinsBase=Math.max(0,+ut.seasonWinsBase||0);ut.seasonPackBase=Math.max(0,+ut.seasonPackBase||0);
const _cbNormalizeUT=normalizeUT; // existing normalized data is retained; these fields are defensively initialized above and saved after changes.
function cbClaimDaily(){const today=cbLocalDate();if(ut.dailyRewardDate===today){alert('Сегодня дневная награда уже получена.');return;}const y=new Date();y.setDate(y.getDate()-1);const yesterday=cbLocalDate(y);ut.dailyRewardStreak=ut.dailyRewardDate===yesterday?Math.min(365,(ut.dailyRewardStreak||0)+1):1;ut.dailyRewardDate=today;const reward=80+Math.min(120,(ut.dailyRewardStreak%7)*20);ut.coins+=reward;let extra='';if(ut.dailyRewardStreak%7===0){const arr=UT_TEMPLATES.filter(t=>t.rarity==='silver');if(arr.length){const t=arr[(Math.random()*arr.length)|0];ut.collection.push(utCardFromTemplate(t.tid,'silver'));ut.stats.packs++;extra=' Также получена серебряная карточка!';}}ut.xp+=20;utRefreshLevel();saveUT();alert(`Дневная награда: ${reward} монет. Серия: ${ut.dailyRewardStreak} дн.!${extra}`);renderUT();}
function cbClaimAchievement(id,reward){const all=utAchievements().concat([{id:'plays10',ok:ut.stats.played>=10},{id:'three_packs',ok:ut.stats.packs>=3},{id:'wins3',ok:ut.stats.wins>=3},{id:'goals25',ok:ut.stats.goals>=25},{id:'division5',ok:ut.division<=5}]);if(!all.some(a=>a.id===id&&a.ok)||ut.achievementClaims.includes(id)){alert('Достижение пока недоступно или награда уже забрана.');return;}ut.achievementClaims.push(id);ut.coins+=clamp(+reward||100,50,400);ut.xp+=35;utRefreshLevel();saveUT();renderUT();}
function cbClaimSeason(id){const key=cbSeasonKey();if(ut.seasonKey!==key){ut.seasonKey=key;ut.seasonWinsBase=ut.stats.wins;ut.seasonPackBase=ut.stats.packs;ut.seasonClaims=[];}const wins=ut.stats.wins-ut.seasonWinsBase,packs=ut.stats.packs-ut.seasonPackBase;const q=id==='season_wins_10'?{ready:wins>=10,reward:500}:id==='season_packs_8'?{ready:packs>=8,reward:350}:null;if(!q||!q.ready||ut.seasonClaims.includes(id)){alert('Сезонная цель ещё не выполнена или награда уже получена.');return;}ut.seasonClaims.push(id);ut.coins+=q.reward;ut.xp+=100;utRefreshLevel();saveUT();renderUT();}
// Add actions without replacing the original action router.
Object.assign(ACT,{
 featureClose(){if(featureModalState&&featureModalState.kind==='rules')return;cbCloseModal();if(state==='paused')setScreen('pause');},
 ruleRestart(d){cbTakeRestart(d.v||'pass');},
 photoMode(){cbOpenPhoto('photo');}, replayCamera(){cbOpenPhoto('replayCamera');}, featureScreenshot(){cbSaveScreenshot();},
 substitutions(){if(state!=='paused'){alert('Открой замены во время паузы матча.');return;}subSelectOut=null;cbRenderSubs();},
 subPickOut(d){const c=cows.find(x=>x.team===0&&String(x.num)===String(d.id)&&x.role!=='gk');if(!c)return;subSelectOut=c;if(!(matchCfg&&matchCfg.utManaged))cbPrepareGenericBench(c);cbRenderSubs();},
 subPickIn(d){cbPerformSub(d.id);},subCancelPick(){subSelectOut=null;genericBench=[];cbRenderSubs();},
 kitEditor(){kitEditorIndex=clamp(settings.activeFormTemplate||0,0,settings.kitTemplates.length-1);cbRenderKitEditor();},
 kitChoose(d){kitEditorIndex=clamp(+d.i||0,0,settings.kitTemplates.length-1);settings.activeFormTemplate=kitEditorIndex;save();cbRenderKitEditor();},
 kitSave(){const t=settings.kitTemplates[kitEditorIndex];if(!t)return;t.name=($('kitTemplateName').value||'Комплект').trim().slice(0,24)||'Комплект';t.c1=$('kitColor1').value;t.c2=$('kitColor2').value;t.pat=clamp(+$('kitPattern').value||0,0,4);settings.activeFormTemplate=kitEditorIndex;settings.useCustomForm=true;save();cbRenderKitEditor();},
 kitUse(){settings.activeFormTemplate=kitEditorIndex;settings.useCustomForm=!settings.useCustomForm;save();if(state==='menu')enterMenuScene();cbRenderKitEditor();},
 utColor(d){if(/^#[0-9a-f]{6}$/i.test(d.v||'')){ut.color=d.v;saveUT();renderUT();}},
 utDailyReward(){cbClaimDaily();},utAchievementClaim(d){cbClaimAchievement(d.id,+d.reward);},utSeasonClaim(d){cbClaimSeason(d.id);},
 clearRecords(){if(!confirm('Очистить историю матчей на этом устройстве?'))return;settings.localRecords=[];save();renderUT();}
});
// Add accessibility tab buttons and immediate application.
cbApplyAccess();
// Keep settings resets from destroying a custom shirt or a local record archive.
const _cbResetSettings=ACT.resetsettings;ACT.resetsettings=function(){if(!confirm('Сбросить все настройки игры? Прогресс, турниры, клуб, формы и локальные рекорды останутся.'))return;const keep=['myTeam','wins','played','goals','tutDone','trophies','trophyCabinet','career','comp','utData','kitTemplates','activeFormTemplate','useCustomForm','localRecords'];Object.keys(DEF).forEach(k=>{if(!keep.includes(k))settings[k]=DEF[k];});save();applyControlsLayout();applyRes();applyGfxQuality();buildStands();applyVisualFilters();applyEnv(settings.tod,settings.weather);cbApplyAccess();renderSettings();};
// Make forms editor available through the wardrobe without changing the original screen navigation.
$('replayTag').insertAdjacentHTML('beforeend','');
// Camera sliders update continuously, but never allocate 3D objects in the render loop.
document.addEventListener('input',e=>{const type=e.target&&e.target.dataset&&e.target.dataset.photo;if(!type||!featureModalState)return;const target=featureModalState.kind==='photo'?photoModeState:replayCamState;target[type]=+e.target.value;const id=type==='angle'?'cbAngleVal':type==='distance'?'cbDistVal':'cbHeightVal',span=$(id);if(span)span.textContent=type==='angle'?target[type]+'°':String(target[type]);});


// ===== Ultimate Team Exchange v13: backward-compatible local economy + localization =====
const UTX_LANGS={ru:'Русский',en:'English',fr:'Français',es:'Español',tr:'Türkçe',az:'Azərbaycanca'};
const UTX_LOCALES={ru:'ru-RU',en:'en-GB',fr:'fr-FR',es:'es-ES',tr:'tr-TR',az:'az-AZ'};
const UTX_ROWS=[
['Настройки','Settings','Paramètres','Ajustes','Ayarlar','Parametrlər'],['Готово','Done','Terminé','Listo','Bitti','Hazır'],['Игровой процесс','Gameplay','Jeu','Jugabilidad','Oynanış','Oyun prosesi'],['Графика','Graphics','Graphismes','Gráficos','Grafikler','Qrafika'],['Производительность','Performance','Performances','Rendimiento','Performans','Performans'],['Камера','Camera','Caméra','Cámara','Kamera','Kamera'],['Звук','Audio','Son','Sonido','Ses','Səs'],['Управление','Controls','Commandes','Controles','Kontroller','İdarəetmə'],['Навесы','Crosses','Centres','Centros','Ortalar','Asmalar'],['Язык','Language','Langue','Idioma','Dil','Dil'],['Мой клуб','My Club','Mon club','Mi club','Kulübüm','Klubum'],['Состав','Squad','Équipe','Plantilla','Kadro','Heyət'],['Игроки','Players','Joueurs','Jugadores','Oyuncular','Oyunçular'],['Паки','Packs','Packs','Sobres','Paketler','Paketlər'],['Рынок','Market','Marché','Mercado','Pazar','Bazar'],['Задания','Objectives','Objectifs','Objetivos','Görevler','Tapşırıqlar'],['Режимы','Modes','Modes','Modos','Modlar','Rejimlər'],['Статистика','Statistics','Statistiques','Estadísticas','İstatistikler','Statistika'],['Монеты','Coins','Pièces','Monedas','Madeni para','Sikkələr'],['Уровень клуба','Club level','Niveau du club','Nivel del club','Kulüp seviyesi','Klub səviyyəsi'],['Химия','Chemistry','Collectif','Química','Kimya','Kimya'],['Сохранить','Save','Enregistrer','Guardar','Kaydet','Yadda saxla'],['Поиск игрока…','Search players…','Rechercher…','Buscar jugadores…','Oyuncu ara…','Oyunçu axtar…'],['Все позиции','All positions','Tous les postes','Todas las posiciones','Tüm pozisyonlar','Bütün mövqelər'],['Любая редкость','Any rarity','Toutes raretés','Cualquier rareza','Tüm nadirlikler','İstənilən nadirlik'],['Сортировать по рейтингу','Sort by rating','Trier par note','Ordenar por valoración','Puana göre sırala','Reytinqə görə sırala'],['По редкости','By rarity','Par rareté','Por rareza','Nadirliğe göre','Nadirliyə görə'],['Бронза','Bronze','Bronze','Bronce','Bronz','Bürünc'],['Серебро','Silver','Argent','Plata','Gümüş','Gümüş'],['Золото','Gold','Or','Oro','Altın','Qızıl'],['Особая','Special','Spéciale','Especial','Özel','Xüsusi'],['Открыть пак','Open pack','Ouvrir le pack','Abrir sobre','Paket aç','Paketi aç'],['Открыть пак','Open pack','Ouvrir le pack','Abrir sobre','Paket aç','Paketi aç'],['Купить','Buy','Acheter','Comprar','Satın al','Al'],['Продать','Sell','Vendre','Vender','Sat','Sat'],['Быстро','Quick sell','Vente rapide','Venta rápida','Hızlı sat','Tez sat'],['Купить сейчас','Buy now','Acheter maintenant','Comprar ahora','Hemen al','İndi al'],['Ставка','Bid','Enchérir','Pujar','Teklif ver','Təklif et'],['Мои предложения','My bids & listings','Mes offres','Mis ofertas','Tekliflerim','Təkliflərim'],['Истекающие','Expiring soon','Bientôt expirés','Por finalizar','Süresi dolanlar','Bitmək üzrə'],['История сделок','Trade history','Historique','Historial','İşlem geçmişi','Əməliyyat tarixçəsi'],['Купить','Buy','Acheter','Comprar','Satın al','Al'],['Продать игроков','List players','Vendre des joueurs','Vender jugadores','Oyuncu sat','Oyunçu sat'],['Выставить на рынок','List on market','Mettre en vente','Poner en venta','Pazara koy','Bazara çıxar'],['Снять с продажи','Cancel listing','Retirer l’annonce','Retirar anuncio','İlandan kaldır','Satışdan çıxar'],['Стартовая цена','Starting price','Prix de départ','Precio inicial','Başlangıç fiyatı','Başlanğıc qiymət'],['Купить сейчас','Buy now','Acheter maintenant','Comprar ahora','Hemen al','İndi al'],['Длительность','Duration','Durée','Duración','Süre','Müddət'],['1 час','1 hour','1 heure','1 hora','1 saat','1 saat'],['6 часов','6 hours','6 heures','6 horas','6 saat','6 saat'],['24 часа','24 hours','24 heures','24 horas','24 saat','24 saat'],['Фильтры','Filters','Filtres','Filtros','Filtreler','Filtrlər'],['Позиция','Position','Poste','Posición','Pozisyon','Mövqe'],['Рейтинг от','Rating min','Note min.','Valoración mín.','Min puan','Min reytinq'],['Цена до','Max price','Prix max.','Precio máx.','Maks. fiyat','Maks. qiymət'],['Редкость','Rarity','Rareté','Rareza','Nadirlik','Nadirlik'],['Страна','Country','Pays','País','Ülke','Ölkə'],['Клуб','Club','Club','Club','Kulüp','Klub'],['Сортировка','Sort','Tri','Ordenar','Sırala','Sırala'],['По цене','By price','Par prix','Por precio','Fiyata göre','Qiymətə görə'],['Сначала новые','Newest','Plus récents','Más nuevos','En yeni','Ən yenilər'],['Мои лоты','My listings','Mes ventes','Mis anuncios','İlanlarım','Elanlarım'],['Ничего не найдено','No results','Aucun résultat','Sin resultados','Sonuç yok','Nəticə yoxdur'],['Пусто','Empty','Vide','Vacío','Boş','Boşdur'],['Название клуба','Club name','Nom du club','Nombre del club','Kulüp adı','Klubun adı'],['Основная форма','Home kit','Tenue domicile','Uniforme local','İç saha forması','Ev forması'],['Гостевая форма','Away kit','Tenue extérieure','Uniforme visitante','Deplasman forması','Səfər forması'],['Рисунок майки','Shirt pattern','Motif du maillot','Diseño de camiseta','Forma deseni','Forma naxışı'],['Однотонная','Solid','Uni','Lisa','Düz','Sadə'],['Кольца','Hoops','Cercles','Aros','Halkalı','Halqalar'],['Полосы','Stripes','Rayures','Rayas','Çizgili','Zolaqlar'],['Половинки','Half and half','Moitié-moitié','Mitades','İki renkli','İki rəngli'],['Перевязь','Sash','Bande diagonale','Banda diagonal','Çapraz bant','Çarpaz zolaq'],['Щит','Shield','Écu','Escudo','Kalkan','Qalxan'],['Круг','Circle','Cercle','Círculo','Daire','Dairə'],['Звезда','Star','Étoile','Estrella','Yıldız','Ulduz'],['Шестиугольник','Hexagon','Hexagone','Hexágono','Altıgen','Altıbucaqlı'],['Эмблема клуба','Club crest','Écusson du club','Escudo del club','Kulüp arması','Klub emblemi'],['Авто-состав','Auto squad','Équipe auto','Plantilla automática','Otomatik kadro','Avtomatik heyət'],['Сбросить прогресс клуба…','Reset club progress…','Réinitialiser le club…','Restablecer club…','Kulüp ilerlemesini sıfırla…','Klub irəliləyişini sıfırla…'],['Локальный трансферный рынок','Local transfer market','Marché local','Mercado local','Yerel transfer pazarı','Yerli transfer bazarı'],['Налог при продаже: 5%','5% sale tax','Taxe de vente : 5 %','Impuesto de venta: 5 %','Satış vergisi: %5','Satış vergisi: 5%'],['Награды достижений','Achievement rewards','Récompenses','Recompensas','Başarım ödülleri','Nailiyyət mükafatları'],['Ежедневная награда','Daily reward','Récompense quotidienne','Recompensa diaria','Günlük ödül','Gündəlik mükafat'],['Забрать дневную награду','Claim daily reward','Réclamer la récompense','Cobrar recompensa diaria','Günlük ödülü al','Gündəlik mükafatı götür'],['Сегодня получено','Claimed today','Déjà reçu','Recibida hoy','Bugün alındı','Bu gün alınıb'],['Схема','Formation','Formation','Formación','Diziliş','Düzülüş'],['Запас','Bench','Remplaçants','Suplentes','Yedekler','Ehtiyatlar'],['Покупка','Purchase','Achat','Compra','Alış','Alış'],['Продажа','Sale','Vente','Venta','Satış','Satış'],['Трансферы','Transfers','Transferts','Traspasos','Transferler','Transferlər'],['Текущая ставка','Current bid','Offre actuelle','Puja actual','Güncel teklif','Cari təklif'],['Истекает','Expires','Expire','Finaliza','Bitiş','Bitir'],['Продавец','Seller','Vendeur','Vendedor','Satıcı','Satıcı'],['Налог 5%','5% tax','Taxe 5 %','Impuesto 5 %','%5 vergi','5% vergi'],['Из коллекции','From collection','De la collection','De la colección','Koleksiyondan','Kolleksiyadan'],['Вернуть игрока в клуб','Return player to club','Rendre au club','Devolver al club','Oyuncuyu kulübe döndür','Oyunçunu kluba qaytar'],['Не хватает монет','Not enough coins','Pièces insuffisantes','No tienes monedas','Yetersiz bakiye','Kifayət qədər sikkə yoxdur'],['Активна','Active','Active','Activa','Aktif','Aktiv'],['Все клубы','All clubs','Tous les clubs','Todos los clubes','Tüm kulüpler','Bütün klublar'],['Все страны','All countries','Tous les pays','Todos los países','Tüm ülkeler','Bütün ölkələr'],['Выиграна','Won','Gagnée','Ganada','Kazanıldı','Qazanıldı'],['Выставляй игроков на 1, 6 или 24 часа. При продаже удерживается налог 5%. Игрок из стартового состава требует подтверждения и будет заменён.','List players for 1, 6 or 24 hours. A 5% tax applies to sales. Listing a starter requires confirmation and replaces them.','Mettez les joueurs en vente pendant 1, 6 ou 24 heures. Taxe de 5 %. Un titulaire nécessite une confirmation et sera remplacé.','Publica jugadores durante 1, 6 o 24 horas. Se aplica un impuesto del 5 %. Un titular requiere confirmación y será reemplazado.','Oyuncuları 1, 6 veya 24 saatliğine listele. Satışta %5 vergi alınır. İlk 11 oyuncusu için onay gerekir ve oyuncu değiştirilir.','Oyunçuları 1, 6 və ya 24 saatlıq satışa çıxar. Satışdan 5% vergi tutulur. Start heyətindəki oyunçu üçün təsdiq lazımdır və əvəz olunacaq.'],['Завершена','Finished','Terminée','Finalizada','Tamamlandı','Tamamlandı'],['Игрок в стартовом составе: потребуется подтверждение','Player is in the starting lineup; confirmation required','Le joueur est titulaire ; confirmation requise','El jugador está en el once; se requiere confirmación','Oyuncu ilk 11’de; onay gerekir','Oyunçu start heyətindədir; təsdiq tələb olunur'],['Игрок стоит в стартовом составе. Убрать его из состава и выставить на продажу?','This player is in the starting lineup. Remove them from the squad and list them?','Ce joueur est titulaire. Le retirer de l’équipe et le mettre en vente ?','Este jugador está en el once. ¿Quitarlo de la plantilla y ponerlo a la venta?','Bu oyuncu ilk 11’de. Kadrodan çıkarıp satışa koyulsun mu?','Bu oyunçu start heyətindədir. Heyətdən çıxarılsın və satışa qoyulsun?'],['Изменения формы применяются к следующим матчам Ultimate Team.','Kit changes apply to your next Ultimate Team matches.','Les changements de tenue s’appliquent aux prochains matchs Ultimate Team.','Los cambios de equipación se aplican a los próximos partidos de Ultimate Team.','Forma değişiklikleri sonraki Ultimate Team maçlarına uygulanır.','Forma dəyişiklikləri növbəti Ultimate Team matçlarına tətbiq olunur.'],['История пока пуста','No history yet','Aucun historique','Todavía no hay historial','Henüz geçmiş yok','Tarixçə hələ boşdur'],['Мои ставки','My bids','Mes enchères','Mis pujas','Tekliflerim','Təkliflərim'],['Найдено','Found','Trouvés','Encontrados','Bulundu','Tapıldı'],['Нет доступных игроков','No players available','Aucun joueur disponible','No hay jugadores disponibles','Kullanılabilir oyuncu yok','Əlçatan oyunçu yoxdur'],['Нет лотов, которые истекают в ближайшие 15 минут','No lots expiring in the next 15 minutes','Aucune annonce n’expire dans les 15 prochaines minutes','No hay lotes que venzan en 15 minutos','Önümüzdeki 15 dakikada bitecek ilan yok','Növbəti 15 dəqiqədə bitən lot yoxdur'],['Обновить предложения','Refresh listings','Actualiser les annonces','Actualizar ofertas','İlanları yenile','Təklifləri yenilə'],['Отмена','Cancel','Annuler','Cancelar','İptal','Ləğv et'],['Пак открыт!','Pack opened!','Pack ouvert !','¡Sobre abierto!','Paket açıldı!','Paket açıldı!'],['Повтор превращён в монеты','Duplicate converted to coins','Doublon converti en pièces','Duplicado convertido en monedas','Tekrar kartı paraya dönüştürüldü','Təkrar kart sikkələrə çevrildi'],['Повысить ставку','Raise bid','Augmenter l’offre','Subir puja','Teklifi yükselt','Təklifi artır'],['Пока нет ставок','No bids yet','Aucune enchère','Aún no hay pujas','Henüz teklif yok','Hələ təklif yoxdur'],['Сбросить фильтры','Clear filters','Effacer les filtres','Borrar filtros','Filtreleri temizle','Filtrləri sıfırla'],['Следующий значок','Next emblem','Emblème suivant','Siguiente emblema','Sonraki amblem','Növbəti emblem'],['Сначала высокий рейтинг','Highest rating first','Meilleure note d’abord','Mayor valoración primero','Önce yüksek puan','Əvvəl yüksək reytinq'],['Снять карточку с продажи и вернуть её в коллекцию?','Cancel this listing and return the card to your collection?','Retirer cette annonce et rendre la carte à la collection ?','¿Retirar el anuncio y devolver la carta a la colección?','İlan iptal edilip kart koleksiyona dönsün mü?','Elan ləğv edilsin və kart kolleksiyaya qaytarılsın?'],['Срок лота истёк.','The listing has expired.','L’annonce a expiré.','El lote ha caducado.','İlanın süresi doldu.','Lotun vaxtı bitib.'],['Цена покупки должна быть не ниже стартовой.','Buy-now price must be at least the starting price.','Le prix d’achat immédiat doit être supérieur au prix de départ.','El precio de compra inmediata no puede ser inferior al inicial.','Hemen al fiyatı başlangıç fiyatından düşük olamaz.','İndi al qiyməti başlanğıc qiymətindən aşağı ola bilməz.'],['Это ваш собственный лот.','This is your own listing.','C’est votre propre annonce.','Este es tu propio lote.','Bu sizin kendi ilanınız.','Bu sizin öz lotunuzdur.'],['Повтор','Duplicate','Doublon','Duplicado','Tekrar','Təkrar'],['Рынок','Market','Marché','Mercado','Pazar','Bazar'],['Все страны','All countries','Tous les pays','Todos los países','Tüm ülkeler','Bütün ölkələr'],['Показать все','Show all','Tout afficher','Mostrar todo','Tümünü göster','Hamısını göstər'],['Сезонные цели','Season objectives','Objectifs de saison','Objetivos de temporada','Sezon hedefleri','Mövsüm hədəfləri'],['Текущая ставка','Current bid','Enchère actuelle','Puja actual','Mevcut teklif','Cari təklif'],['Общий клуб','Club','Club','Club','Kulüp','Klub'],['Нет игроков','No players','Aucun joueur','No hay jugadores','Oyuncu yok','Oyunçu yoxdur'],['Дивизион','Division','Division','División','Lig','Divizion'],['Развитие клуба','Club development','Développement du club','Desarrollo del club','Kulüp gelişimi','Klubun inkişafı'],['Прогресс','Progress','Progression','Progreso','İlerleme','İrəliləyiş'],['Матчи','Matches','Matchs','Partidos','Maçlar','Matçlar'],['Победы','Wins','Victoires','Victorias','Galibiyet','Qələbələr'],['Ничьи','Draws','Nuls','Empates','Beraberlik','Heç-heçə'],['Поражения','Losses','Défaites','Derrotas','Mağlubiyet','Məğlubiyyətlər'],['Голы','Goals','Buts','Goles','Goller','Qollar'],['Забито','Scored','Marqués','A favor','Atılan','Vurulan'],['Пропущено','Conceded','Encaissés','En contra','Yenilen','Buraxılan'],['Паков открыто','Packs opened','Packs ouverts','Sobres abiertos','Açılan paket','Açılmış paket'],['Рекорд рейтинга','Best rating','Meilleure note','Mejor valoración','En yüksek puan','Ən yaxşı reytinq'],['Развитие клуба','Club development','Développement du club','Desarrollo del club','Kulüp gelişimi','Klubun inkişafı'],['Каждый завершённый матч приносит монеты и опыт. Карточки улучшают скорость, удар и передачи состава в режиме Ultimate Team.','Every completed match grants coins and XP. Player cards improve squad speed, shooting and passing in Ultimate Team.','Chaque match terminé rapporte des pièces et de l’EXP. Les cartes améliorent la vitesse, les tirs et les passes.','Cada partido terminado otorga monedas y XP. Las cartas mejoran velocidad, disparo y pase.','Her tamamlanan maç jeton ve XP kazandırır. Kartlar hız, şut ve pası geliştirir.','Hər tamamlanan matç sikkə və XP qazandırır. Kartlar sürəti, zərbəni və ötürməni artırır.'],['Товарищеский матч','Friendly match','Match amical','Partido amistoso','Dostluk maçı','Yoldaşlıq matçı'],['Матч дивизиона','Division match','Match de division','Partido de división','Lig maçı','Divizion matçı'],['Дивизионы','Divisions','Divisions','Divisiones','Ligler','Divizionlar'],['Игровые режимы','Game modes','Modes de jeu','Modos de juego','Oyun modları','Oyun rejimləri'],['Серия кубка','Cup run','Parcours de coupe','Racha de copa','Kupa serisi','Kubok seriyası'],['Трофеи кубка','Cup trophies','Trophées de coupe','Trofeos de copa','Kupa kupaları','Kubok mükafatları'],['Достижения','Achievements','Succès','Logros','Başarımlar','Nailiyyətlər'],['Открыто','Unlocked','Débloqué','Desbloqueado','Açıldı','Açılıb'],['Не открыто','Locked','Verrouillé','Bloqueado','Kilitli','Kilidlənib'],['Коллекция','Collection','Collection','Colección','Koleksiyon','Kolleksiya'],['карточек','cards','cartes','cartas','kart','kart'],['Нажми «Авто-состав», чтобы распределить игроков по позициям.','Press “Auto squad” to assign players to positions.','Appuyez sur « Équipe auto » pour attribuer les postes.','Pulsa «Plantilla automática» para asignar posiciones.','Pozisyonları dağıtmak için “Otomatik kadro”ya bas.','Mövqeləri bölüşdürmək üçün “Avtomatik heyət”ə bas.'],['Вероятности опубликованы до открытия. Выбор редкости случаен внутри указанных шансов; карточка обязательно добавляется в коллекцию.','Odds are shown before opening. Rarity is random within the listed chances; duplicate cards convert to coins.','Les probabilités sont affichées avant ouverture. La rareté est aléatoire selon ces chances ; les doublons sont convertis en pièces.','Las probabilidades se muestran antes de abrir. La rareza es aleatoria; los duplicados se convierten en monedas.','Olasılıklar açmadan önce gösterilir. Nadirlik belirtilen oranlara göre rastgele; tekrarlar jetona dönüşür.','Ehtimallar açılışdan əvvəl göstərilir. Nadirlik elan olunan şanslara görə təsadüfidir; təkrarlar sikkəyə çevrilir.'],['Задания и награды','Objectives and rewards','Objectifs et récompenses','Objetivos y recompensas','Görevler ve ödüller','Tapşırıqlar və mükafatlar'],['Задания обновляются ежедневно и еженедельно. Прогресс сохраняется локально.','Objectives refresh daily and weekly. Progress is saved locally.','Les objectifs sont actualisés chaque jour et chaque semaine. La progression est locale.','Los objetivos se actualizan a diario y semanalmente. El progreso se guarda localmente.','Görevler günlük ve haftalık yenilenir. İlerleme yerel olarak kaydedilir.','Tapşırıqlar gündəlik və həftəlik yenilənir. İrəliləyiş cihazda saxlanır.'],['Получено','Claimed','Récupéré','Recibido','Alındı','Götürülüb'],['Забрать награду','Claim reward','Réclamer','Reclamar recompensa','Ödülü al','Mükafatı götür'],['Выполни задание','Complete objective','Terminer l’objectif','Completa el objetivo','Görevi tamamla','Tapşırığı tamamla'],['Все страны','All countries','Tous les pays','Todos los países','Tüm ülkeler','Bütün ölkələr'],['Сначала высокий рейтинг','Highest rating first','Meilleure note d’abord','Mayor valoración primero','Önce yüksek puan','Əvvəl yüksək reytinq'],['Новый','New','Nouveau','Nuevo','Yeni','Yeni'],['Пусто','Empty','Vide','Vacío','Boş','Boşdur'],['История открытий паков','Pack opening history','Historique des packs','Historial de sobres','Paket açma geçmişi','Paket açılış tarixçəsi'],['Повтор · конвертировано в монеты','Duplicate · converted to coins','Doublon · converti en pièces','Duplicado · convertido en monedas','Tekrar · paraya dönüştürüldü','Təkrar · sikkəyə çevrildi'],['Уникальная карточка добавлена','Unique card added','Carte unique ajoutée','Carta única añadida','Benzersiz kart eklendi','Unikal kart əlavə edildi'],['Рейтинг состава','Squad rating','Note de l’équipe','Valoración de plantilla','Kadro puanı','Heyət reytinqi'],['Связи по лиге','League links','Liens de ligue','Vínculos de liga','Lig bağlantıları','Liqa əlaqələri']
];
UTX_ROWS.push(['Вкл','On','Activé','Activado','Açık','Açıq'],['Выкл','Off','Désactivé','Desactivado','Kapalı','Söndürülüb']);
UTX_ROWS.push(['Четыре тени','Four shadows','Quatre ombres','Cuatro sombras','Dört gölge','Dörd kölgə'],['Авто по пресету','Preset auto','Automatique selon le préréglage','Automático por preajuste','Ön ayara göre otomatik','Presetə görə avtomatik'],['Частота обновления теней','Shadow update rate','Fréquence de mise à jour des ombres','Frecuencia de actualización de sombras','Gölge güncelleme sıklığı','Kölgələrin yenilənmə tezliyi'],['Каждый кадр','Every frame','Chaque image','Cada fotograma','Her kare','Hər kadr'],['Каждые 2 кадра','Every 2 frames','Toutes les 2 images','Cada 2 fotogramas','Her 2 karede bir','Hər 2 kadrdan bir'],['Каждые 4 кадра','Every 4 frames','Toutes les 4 images','Cada 4 fotogramas','Her 4 karede bir','Hər 4 kadrdan bir'],['Активны четыре теневые карты прожекторов; тени отбрасывают только коровы-игроки.','Four spotlight shadow maps are active; only cow players cast shadows.','Quatre cartes d’ombre des projecteurs sont actives ; seules les vaches-joueuses projettent des ombres.','Hay cuatro mapas de sombras activos; solo las vacas jugadoras proyectan sombras.','Dört projektör gölge haritası etkin; yalnızca oyuncu inekler gölge oluşturur.','Dörd proyektor kölgə xəritəsi aktivdir; yalnız oyunçu inəklər kölgə salır.'],['Активна одна теневая карта; тени отбрасывают только коровы-игроки.','One shadow map is active; only cow players cast shadows.','Une carte d’ombre est active ; seules les vaches-joueuses projettent des ombres.','Hay un mapa de sombras activo; solo las vacas jugadoras proyectan sombras.','Bir gölge haritası etkin; yalnızca oyuncu inekler gölge oluşturur.','Bir kölgə xəritəsi aktivdir; yalnız oyunçu inəklər kölgə salır.'],['Тени выключены общим параметром «Тени».','Shadows are disabled in the main Shadows setting.','Les ombres sont désactivées dans le réglage général.','Las sombras están desactivadas en el ajuste general.','Ana Gölge ayarında gölgeler kapalı.','Əsas Kölgələr parametrində kölgələr söndürülüb.'],['Производительность низкая: автоматически оставлена одна тень. Переключите «Четыре тени» вручную, чтобы повторить попытку.','Performance is low: automatically reduced to one shadow. Manually toggle Four shadows to retry.','Performances faibles : une seule ombre est conservée automatiquement. Activez à nouveau Quatre ombres pour réessayer.','Rendimiento bajo: se ha reducido automáticamente a una sombra. Activa Cuatro sombras manualmente para volver a intentarlo.','Performans düşük: otomatik olarak tek gölgeye düşürüldü. Yeniden denemek için Dört gölgeyi elle açın.','Performans aşağıdır: avtomatik olaraq bir kölgə saxlanıldı. Yenidən yoxlamaq üçün Dörd kölgəni əl ilə aktiv edin.'],['Авто: низкий/минимальный пресет — одна тень; высокий/ультра — четыре. Включение вручную может снизить FPS.','Auto: low/minimum uses one shadow; high/ultra uses four. Manual activation may reduce FPS.','Auto : faible/minimum utilise une ombre ; élevé/ultra en utilise quatre. L’activation manuelle peut réduire les FPS.','Auto: bajo/mínimo usa una sombra; alto/ultra usa cuatro. La activación manual puede reducir los FPS.','Otomatik: düşük/minimum bir, yüksek/ultra dört gölge kullanır. Elle etkinleştirme FPS düşürebilir.','Avto: aşağı/minimum bir, yüksək/ultra dörd kölgə istifadə edir. Əl ilə aktivləşdirmə FPS-i azalda bilər.']);
UTX_ROWS.push(
 ['СИНИЕ','BLUES','BLEUS','AZULES','MAVİLER','MAVİLƏR'],
 ['КРАСНЫЕ','REDS','ROUGES','ROJOS','KIRMIZILAR','QIRMIZILAR'],
 ['ВПЕРЁД!','GO!','ALLEZ !','¡VAMOS!','HADİ!','İRƏLİ!'],
 ['КОМАНДЫ ВЫХОДЯТ ИЗ ТОННЕЛЯ','TEAMS WALK OUT OF THE TUNNEL','LES ÉQUIPES SORTENT DU TUNNEL','LOS EQUIPOS SALEN DEL TÚNEL','TAKIMLAR TÜNELDEN ÇIKIYOR','KOMANDALAR TUNELDƏN ÇIXIR'],
 ['Предматчевое представление · Cowball Stadium','Pre-match presentation · Cowball Stadium','Présentation d’avant-match · Cowball Stadium','Presentación previa · Cowball Stadium','Maç öncesi tanıtım · Cowball Stadium','Matçöncəsi təqdimat · Cowball Stadium'],
 ['СТАРТОВЫЙ СОСТАВ','STARTING LINE-UP','COMPOSITION DE DÉPART','ALINEACIÓN INICIAL','İLK 11','İLK HEYƏT'],
 ['КАПИТАНЫ У СУДЬИ','CAPTAINS WITH THE REFEREE','LES CAPITAINES AVEC L’ARBITRE','LOS CAPITANES CON EL ÁRBITRO','KAPTANLAR HAKEMİN YANINDA','KAPİTANLAR HAKİMİN YANINDA'],
 ['Выбор стороны поля и права первого удара','Choosing sides and kick-off','Choix du côté et du coup d’envoi','Elección de campo y saque inicial','Saha tarafı ve başlama vuruşu seçimi','Meydan tərəfi və ilk zərbə seçimi'],
 ['ПРИВЕТСТВИЕ ПЕРЕД МАТЧЕМ','PRE-MATCH GREETING','SALUTATIONS AVANT LE MATCH','SALUDO ANTES DEL PARTIDO','MAÇ ÖNCESİ SELAMLAŞMA','MATÇÖNCƏSİ SALAMLAMA'],
 ['ИТОГИ МАТЧА','MATCH SUMMARY','RÉSUMÉ DU MATCH','RESUMEN DEL PARTIDO','MAÇ ÖZETİ','MATÇIN YEKUNU'],
 ['НИЧЬЯ','DRAW','MATCH NUL','EMPATE','BERABERE','HEÇ-HEÇƏ'],
 ['ПОБЕДА!','VICTORY!','VICTOIRE !','¡VICTORIA!','ZAFER!','QƏLƏBƏ!'],
 ['ФИНАЛЬНЫЙ СВИСТОК','FINAL WHISTLE','COUP DE SIFFLET FINAL','SILBATO FINAL','SON DÜDÜK','SON FIT'],
 ['Мяч полностью пересёк боковую линию.','The whole ball crossed the touchline.','Le ballon a entièrement franchi la ligne de touche.','El balón cruzó por completo la línea de banda.','Topun tamamı taç çizgisini geçti.','Top tamamilə yan xətti keçdi.'],
 ['Последним мяча коснулся защитник.','The defender touched the ball last.','Le défenseur a touché le ballon en dernier.','El defensor tocó el balón por última vez.','Topa son olarak savunmacı dokundu.','Topa sonuncu müdafiəçi toxundu.'],
 ['Последним мяча коснулся нападающий.','The attacker touched the ball last.','L’attaquant a touché le ballon en dernier.','El atacante tocó el balón por última vez.','Topa son olarak hücumcu dokundu.','Topa sonuncu hücumçu toxundu.']
);
const UTX_DICT=Object.fromEntries(UTX_ROWS.map(r=>[r[0],r.slice(1)]));

function utxLang(){return ['ru','en','fr','es','tr','az'].indexOf(settings.lang||'ru')+0;}
function utxT(s){const a=UTX_DICT[s];return a?(settings.lang==='ru'?s:a[utxLang()-1]||s):s;}
function utxLocale(){return UTX_LOCALES[settings.lang]||'ru-RU';}
function utxDate(ts){try{return new Intl.DateTimeFormat(utxLocale(),{dateStyle:'short',timeStyle:'short'}).format(new Date(ts));}catch(e){return new Date(ts).toLocaleString();}}
const UTX_STATIC=new MutationObserver(entries=>{const roots=new Set();for(const e of entries){const el=e.target.nodeType===1?e.target:e.target.parentElement,root=el?.closest?.('.scr');if(root)roots.add(root);}roots.forEach(root=>utxTranslateDOM(root));});let UTX_BUSY=false;
const UTX_FROM=Object.fromEntries(UTX_ROWS.flatMap(r=>r.slice(1).map(v=>[v,r[0]])));
const UTX_PARTIAL_KEYS=new Set(['СИНИЕ','КРАСНЫЕ','Дивизион','Матчи','Победы','Ничьи','Поражения','Голы','Забито','Пропущено','Паков открыто','Рекорд рейтинга','Состав','Химия','Монеты','Уровень клуба','Достижения','Открыто','Не открыто','Коллекция','карточек','Серия кубка','Трофеи кубка','Ставка','Истекает','Стартовая цена','Купить сейчас','Редкость','Позиция','Рейтинг от','Цена до','Матчей','Паки','Задания','Прогресс']);const UTX_PARTIAL_ROWS=UTX_ROWS.filter(r=>UTX_PARTIAL_KEYS.has(r[0])).sort((a,b)=>b[0].length-a[0].length);
function utxTranslateText(raw){const trim=raw.trim();if(!trim)return raw;const src=UTX_FROM[trim]||trim;if(UTX_DICT[src]){const target=settings.lang==='ru'?src:UTX_DICT[src][utxLang()-1]||src;return raw.replace(trim,target);}let text=trim;const translated=UTX_PARTIAL_ROWS.flatMap(r=>r.slice(1).map(v=>({v,src:r[0]}))).filter(x=>x.v&&x.v!==x.src).sort((a,b)=>b.v.length-a.v.length);for(const x of translated)if(text.includes(x.v))text=text.split(x.v).join(x.src);if(settings.lang!=='ru'){for(const r of UTX_PARTIAL_ROWS){const v=r[0],target=r[utxLang()];if(text.includes(v)&&target)text=text.split(v).join(target);}}return raw.replace(trim,text);}
function utxTranslateDOM(root=document){if(UTX_BUSY||!root)return;UTX_BUSY=true;try{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const translated=utxTranslateText(n.nodeValue);if(translated!==n.nodeValue)n.nodeValue=translated;}if(root.querySelectorAll)root.querySelectorAll('input[placeholder],input[aria-label],button[aria-label],select[aria-label], [title]').forEach(el=>['placeholder','aria-label','title'].forEach(a=>{const v=el.getAttribute(a);if(v){const translated=utxTranslateText(v);if(translated!==v)el.setAttribute(a,translated);}}));}finally{UTX_BUSY=false;}}
function utxTranslateAll(){document.querySelectorAll('.scr').forEach(el=>utxTranslateDOM(el));['tacOv','cbFeatureModal','utReveal','penui','penhud','banner','commentary','center','hud','tbtns','skipTag','replayTag','pName'].forEach(id=>{const el=document.getElementById(id);if(el)utxTranslateDOM(el);});}
function utxApplyLanguage(){try{document.documentElement.lang=settings.lang||'ru';if(window.applyTeamNames)window.applyTeamNames();utxTranslateAll();}catch(e){}if(screen==='ut')renderUT();if(screen==='settings')renderSettings();if(screen==='home')renderHome();}
function utxLeagueForClub(club){return ({'Ясные Холмы':'Лига Зелёных Долин','Клеверный Союз':'Кубок Клеверных Полей','Северный Рог':'Северная Лига Пастбищ','Зелёный Пастух':'Федерация Лесных Стадионов'})[club]||'Лига Зелёных Долин';}
function utxInitSchema(){
  if(!Array.isArray(ut.userListings))ut.userListings=[];if(!Array.isArray(ut.myBids))ut.myBids=[];if(!Array.isArray(ut.marketHistory))ut.marketHistory=[];if(!Array.isArray(ut.packHistory))ut.packHistory=[];if(!ut.marketHistory.length){(ut.stats?.purchases||[]).forEach((x,i)=>ut.marketHistory.push({id:'legacy_buy_'+i,type:'purchase',name:x.name||'Player',amount:+x.price||0,ts:+x.ts||Date.parse(x.date)||Date.now()}));(ut.stats?.sales||[]).forEach((x,i)=>ut.marketHistory.push({id:'legacy_sell_'+i,type:'sale',name:x.name||'Player',amount:+x.price||0,ts:+x.ts||Date.parse(x.date)||Date.now(),tax:+x.tax||0}));ut.marketHistory.sort((a,b)=>b.ts-a.ts);ut.marketHistory=ut.marketHistory.slice(0,100);}
  ut.marketFilters=Object.assign({q:'',pos:'',minRating:0,maxPrice:50000,rarity:'',nation:'',club:'',sort:'price'},ut.marketFilters||{});
  ut.marketView=['buy','sell','expiring','offers','history'].includes(ut.marketView)?ut.marketView:'buy';
  if(!['shield','circle','star','hex'].includes(ut.emblemShape))ut.emblemShape='shield';
  ut.homeColor=/^#[0-9a-f]{6}$/i.test(ut.homeColor||'')?ut.homeColor:(ut.color||'#3a86ff');
  ut.awayColor=/^#[0-9a-f]{6}$/i.test(ut.awayColor||'')?'#'+ut.awayColor.slice(1):'#f1f4f8';
  ut.kitPattern=clamp(Number.isFinite(+ut.kitPattern)?+ut.kitPattern:2,0,4);
  ut.awayPattern=clamp(Number.isFinite(+ut.awayPattern)?+ut.awayPattern:0,0,4);
  ut.listingDraft=String(ut.listingDraft||'');
  ut.collection.forEach(c=>{if(!c.league)c.league=utxLeagueForClub(c.club);if(!c.coat)c.coat=['#f0eee5','#d8dce2','#c5b39a','#eee1d0','#9ca8b4'][Math.abs(c.tid||0)%5];if(!c.kitColor)c.kitColor=ut.homeColor;if(!c.kitColor2)c.kitColor2=ut.awayColor;if(!Number.isFinite(c.pattern))c.pattern=Math.abs(c.tid||0)%5;if(!Number.isFinite(c.num))c.num=1+Math.abs(c.tid||0)%99;});
  ut.userListings=ut.userListings.filter(l=>l&&l.card&&Number.isFinite(+l.expiresAt));
  ut.myBids=ut.myBids.filter(b=>b&&b.listingId);
  ut.marketHistory=ut.marketHistory.filter(h=>h&&h.ts).slice(0,100);
}
utxInitSchema();
const UTX_PATTERNS=[utxT('Однотонная'),utxT('Кольца'),utxT('Полосы'),utxT('Половинки'),utxT('Перевязь')];
const UTX_BASE_PRICE=utPrice;utPrice=function(c){const base=UTX_BASE_PRICE(c),posFactor=({'ВРТ':1.06,'НАП':1.08,'ЦП':1.04,'ПЗ':1.02,'ЗЩ':1})[c?.pos]||1;return Math.max(50,Math.round(base*posFactor/10)*10);};
function utxRecord(type,card,amount,extra={}){ut.marketHistory.unshift({id:utNewId(),type,name:card?.name||utxT('Трансферы'),rating:card?.rating||0,amount:Math.round(amount||0),ts:Date.now(),uid:card?.uid||'',...extra});ut.marketHistory=ut.marketHistory.slice(0,100);}
function utxBidFor(id){return ut.myBids.find(b=>b.listingId===id&&b.status==='active');}
function utxListingCard(card){const r=UT_RARITY[card.rarity]||UT_RARITY.bronze,pat=['','rings','stripes','halves','sash'][clamp(+card.pattern||0,0,4)],a=card.kitColor||ut.homeColor||'#3a86ff',b=card.kitColor2||ut.awayColor||'#f1f4f8';return `<div class="utxPlayerCard" style="--rarity:${r.color}"><div class="utCard"><span class="pos">${utEsc(card.pos)}</span><div class="rating">${card.rating}</div><div style="display:flex;gap:9px;align-items:center"><span class="utEmblem circle" style="--ut-club-color:${utEsc(card.coat||'#d8dce2')};background:${utEsc(card.coat||'#d8dce2')};color:#151922;font-size:12px">◉</span><span class="utxKitPreview ${pat}" style="--kit-a:${utEsc(a)};--kit-b:${utEsc(b)}"></span><div><b>${utEsc(card.name)}</b><small>${utEsc(r.label)} · ${utEsc(card.nation)} · ${utEsc(card.club)}</small></div></div><div class="statsline"><span>СКР ${card.pac}</span><span>УД ${card.sho}</span><span>ПАС ${card.pas}</span><span>ДРБ ${card.dri}</span><span>ЗАЩ ${card.def}</span><span>ФИЗ ${card.phy}</span></div></div></div>`;}
function utxFinishBid(b,won,card){if(b.status!=='active')return;if(won&&card){const c=Object.assign({},card,{uid:utNewId()});ut.collection.push(c);ut.stats.bought=(ut.stats.bought||0)+1;ut.stats.purchases.unshift({name:c.name,price:b.amount,date:utxDate(Date.now()),ts:Date.now()});utxRecord('purchase',c,b.amount,{source:'auction'});b.status='won';b.resolvedAt=Date.now();ut.xp+=10;utRefreshLevel();}else{ut.coins+=Math.max(0,+b.amount||0);b.status='lost';b.resolvedAt=Date.now();utxRecord('refund',card,b.amount,{source:'auction'});} }
function utxProcessExpiry(){const now=Date.now();let dirty=false;
  for(const l of ut.userListings.slice()){if(+l.expiresAt>now)continue;const idx=ut.userListings.findIndex(x=>x.id===l.id);if(idx<0)continue;const c=l.card,base=Math.max(l.startPrice||utPrice(c),l.currentBid||0);if(Math.random()<0.48){const gross=Math.max(l.startPrice||0,Math.round(base*(l.currentBid?1:0.78)));const net=Math.round(gross*.95);ut.coins+=net;ut.stats.sold=(ut.stats.sold||0)+1;ut.stats.sales.unshift({name:c.name,price:net,date:utxDate(now),ts:now,tax:gross-net});ut.stats.sales=ut.stats.sales.slice(0,20);utxRecord('sale',c,net,{tax:gross-net,source:'local-npc'});}else{const ret=Object.assign({},c,{uid:c.uid||utNewId()});if(!utById(ret.uid))ut.collection.push(ret);utxRecord('unsold',c,0,{source:'returned'});}ut.userListings.splice(idx,1);dirty=true;}
  for(const o of ut.market.slice()){if(+o.expires>now)continue;const idx=ut.market.findIndex(x=>x.id===o.id);if(idx<0)continue;const b=utxBidFor(o.id);if(b){utxFinishBid(b,o.highBidder==='me',o.card);}ut.market.splice(idx,1);dirty=true;}
  if(dirty){ut.marketAt=0;saveUT();}return dirty;
}
utRefreshMarket=function(force){utxProcessExpiry();const now=Date.now();if(!force&&ut.market.length&&now-(ut.marketAt||0)<180000)return;if(force){ut.market.slice().forEach(o=>{const b=utxBidFor(o.id);if(b){ut.coins+=Math.max(0,+b.amount||0);b.status='cancelled';b.resolvedAt=now;}});}ut.marketAt=now;ut.market=[];const available=UT_TEMPLATES.slice();for(let i=0;i<10;i++){const t=available.splice((Math.random()*available.length)|0,1)[0];if(!t)break;const rarity=t.rarity,card=utCardFromTemplate(t.tid,rarity);card.coat=['#f0eee5','#d8dce2','#c5b39a','#eee1d0','#9ca8b4'][Math.abs(t.tid)%5];card.kitColor=ut.homeColor;card.pattern=Math.abs(t.tid)%5;const base=utPrice(card),price=Math.max(100,Math.round(base*(.82+Math.random()*.32)/10)*10),startPrice=Math.max(50,Math.round(price*(.62+Math.random()*.14)/10)*10);ut.market.push({id:'lot_'+now+'_'+i,tid:t.tid,rarity,card,price,startPrice,currentBid:0,bidCount:0,highBidder:'',seller:'market',expires:now+180000,expiresAt:now+180000});}saveUT();};
function utxCombined(){const now=Date.now();return [...ut.market.filter(o=>o.expires>now).map(o=>Object.assign({kind:'npc'},o)),...ut.userListings.filter(l=>l.expiresAt>now).map(l=>Object.assign({kind:'user',id:l.id,tid:l.card.tid,card:l.card,rarity:l.card.rarity,price:l.buyNow,startPrice:l.startPrice,currentBid:l.currentBid||0,bidCount:l.bidCount||0,highBidder:l.highBidder||'',seller:'me',expires:l.expiresAt,expiresAt:l.expiresAt}))];}
function utxBuyNow(id){const o=ut.market.find(x=>x.id===id);if(!o){const l=ut.userListings.find(x=>x.id===id);if(l){alert(utxT('Это ваш собственный лот.'));return;}return;}if(o.expires<=Date.now()){alert(utxT('Срок лота истёк.'));utxProcessExpiry();renderUT();return;}const b=utxBidFor(id),held=b?b.amount:0,price=+o.price||utPrice(o.card);if(ut.coins+held<price){alert(utxT('Не хватает монет'));return;}ut.coins+=held-price;const card=Object.assign({},o.card,{uid:utNewId()});ut.collection.push(card);ut.stats.bought=(ut.stats.bought||0)+1;ut.stats.purchases.unshift({name:card.name,price,date:utxDate(Date.now()),ts:Date.now()});utxRecord('purchase',card,price,{source:'buy-now'});if(b){b.status='won';b.resolvedAt=Date.now();}ut.market=ut.market.filter(x=>x.id!==id);ut.xp+=10;utRefreshLevel();saveUT();renderUT();}
function utxPlaceBid(id){const o=ut.market.find(x=>x.id===id);if(!o)return;if(o.expires<=Date.now()){utxProcessExpiry();renderUT();return;}const prev=utxBidFor(id),inc=Math.max(10,Math.round((o.currentBid||o.startPrice||50)*.05/10)*10),amount=o.currentBid?o.currentBid+inc:o.startPrice;if(amount<=0||ut.coins+(prev?prev.amount:0)<amount){alert(utxT('Не хватает монет'));return;}const delta=amount-(prev?prev.amount:0);ut.coins-=delta;if(prev){prev.amount=amount;prev.placedAt=Date.now();}else ut.myBids.push({listingId:id,amount,status:'active',placedAt:Date.now()});o.currentBid=amount;o.highBidder='me';o.bidCount=(o.bidCount||0)+1;saveUT();renderUT();}
function utxListCard(uid){let card=utById(uid);if(!card)return;const start=+document.getElementById('utxStart')?.value||utPrice(card)*.65,buy=+document.getElementById('utxBuyNow')?.value||Math.round(utPrice(card)*1.35),hours=+(document.getElementById('utxDuration')?.value||6);if(start<10||buy<start){alert(utxT('Цена покупки должна быть не ниже стартовой.'));return;}const inLine=ut.lineup.includes(uid);if(inLine&&!confirm(utxT('Игрок стоит в стартовом составе. Убрать его из состава и выставить на продажу?')))return;if(inLine){ut.lineup=ut.lineup.filter(x=>x!==uid);ut.bench=ut.bench.filter(x=>x!==uid);}card=Object.assign({},card);ut.collection=ut.collection.filter(c=>c.uid!==uid);ut.bench=ut.bench.filter(x=>x!==uid);ut.userListings.unshift({id:'userlot_'+Date.now().toString(36),card,startPrice:Math.round(start),buyNow:Math.round(buy),currentBid:0,bidCount:0,highBidder:'',seller:'me',createdAt:Date.now(),expiresAt:Date.now()+hours*3600000,durationHours:hours});ut.marketHistory.unshift({id:utNewId(),type:'listed',name:card.name,rating:card.rating,amount:Math.round(start),ts:Date.now()});ut.listingDraft='';if(ut.lineup.length!==11)utAutoLineup();saveUT();renderUT();}
function utxCancelListing(id){const i=ut.userListings.findIndex(l=>l.id===id);if(i<0)return;const l=ut.userListings[i];if(!confirm(utxT('Снять карточку с продажи и вернуть её в коллекцию?')))return;if(l.card&&!utById(l.card.uid))ut.collection.push(l.card);utxRecord('cancel',l.card,0);ut.userListings.splice(i,1);saveUT();renderUT();}
function utxQuickSell(uid){utSellCard(uid,true);saveUT();renderUT();}
function utxTimeLeft(ts){const ms=Math.max(0,ts-Date.now()),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return h?`${h}ч ${String(m).padStart(2,'0')}м`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function utxMarketHtml(){const view=ut.marketView||'buy',tabs=[['buy',utxT('Купить')],['sell',utxT('Продать игроков')],['expiring',utxT('Истекающие')],['offers',utxT('Мои предложения')],['history',utxT('История сделок')]];let h=`<div class="utPanel"><h3>${utxT('Трансферы')}</h3><p class="help">${utxT('Локальный трансферный рынок')} · ${utxT('Налог при продаже: 5%')}</p><div class="utxSubtabs">${tabs.map(([id,label])=>`<button class="${id===view?'on':''}" data-a="utxMarketView" data-v="${id}">${label}</button>`).join('')}</div>`;
 if(view==='buy'){
   const f=ut.marketFilters,offers=utxCombined().filter(o=>o.seller!=='me');let list=offers.filter(o=>{const c=o.card||{};return (!f.q||(c.name+' '+c.club+' '+c.nation).toLocaleLowerCase().includes(f.q.toLocaleLowerCase()))&&(!f.pos||c.pos===f.pos)&&c.rating>=(+f.minRating||0)&&(+o.price||0)<=(+f.maxPrice||50000)&&(!f.rarity||c.rarity===f.rarity)&&(!f.nation||c.nation===f.nation)&&(!f.club||c.club===f.club);});list.sort((a,b)=>f.sort==='rating'?b.card.rating-a.card.rating:f.sort==='time'?a.expires-b.expires:f.sort==='rarity'?Object.keys(UT_RARITY).indexOf(b.rarity)-Object.keys(UT_RARITY).indexOf(a.rarity):(a.price||0)-(b.price||0));
   h+=`<div class="utxFilters"><label>${utxT('Поиск игрока…')}<input class="utxFilter" data-f="q" value="${utEsc(f.q)}" placeholder="${utxT('Поиск игрока…')}"></label><label>${utxT('Позиция')}<select class="utxFilter" data-f="pos"><option value="">${utxT('Все позиции')}</option>${['ВРТ','ЗЩ','ПЗ','ЦП','НАП'].map(v=>`<option ${f.pos===v?'selected':''}>${v}</option>`).join('')}</select></label><label>${utxT('Рейтинг от')}<select class="utxFilter" data-f="minRating">${[0,50,60,70,75,80,85,90].map(v=>`<option value="${v}" ${+f.minRating===v?'selected':''}>${v||'—'}</option>`).join('')}</select></label><label>${utxT('Цена до')}<input type="number" class="utxFilter" data-f="maxPrice" min="0" max="999999" value="${+f.maxPrice||50000}"></label><label>${utxT('Редкость')}<select class="utxFilter" data-f="rarity"><option value="">${utxT('Любая редкость')}</option>${Object.keys(UT_RARITY).map(r=>`<option value="${r}" ${f.rarity===r?'selected':''}>${utxT(UT_RARITY[r].label)}</option>`).join('')}</select></label><label>${utxT('Страна')}<select class="utxFilter" data-f="nation"><option value="">${utxT('Все страны')}</option>${[...new Set(UT_TEMPLATES.map(t=>t.nation))].sort().map(n=>`<option ${f.nation===n?'selected':''}>${utEsc(n)}</option>`).join('')}</select></label><label>${utxT('Клуб')}<select class="utxFilter" data-f="club"><option value="">${utxT('Все клубы')}</option>${[...new Set(UT_TEMPLATES.map(t=>t.club))].sort().map(n=>`<option ${f.club===n?'selected':''}>${utEsc(n)}</option>`).join('')}</select></label><label>${utxT('Сортировка')}<select class="utxFilter" data-f="sort">${[['price',utxT('По цене')],['rating',utxT('Сначала высокий рейтинг')],['time',utxT('Истекающие')],['rarity',utxT('По редкости')]].map(([v,n])=>`<option value="${v}" ${f.sort===v?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="utxMeta"><span>${utxT('Найдено')}: ${list.length}</span><button class="mi" data-a="utxClearFilters">${utxT('Сбросить фильтры')}</button><button class="mi" data-a="utRefreshMarket">${utxT('Обновить предложения')}</button></div><div class="utGrid">${list.map(o=>{const c=o.card,b=utxBidFor(o.id),own=b&&b.status==='active',bidMin=o.currentBid?o.currentBid+Math.max(10,Math.round(o.currentBid*.05/10)*10):o.startPrice;return `<div class="utxListing" style="--rarity:${(UT_RARITY[c.rarity]||UT_RARITY.bronze).color}">${utxListingCard(c)}<div class="utxMeta"><span>${utxT('Продавец')}: ${utxT('Рынок')}</span><span class="utxStatus">${utxT('Истекает')}: <b data-utx-expiry="${o.expires}">${utxTimeLeft(o.expires)}</b></span></div><div class="utxMeta"><span>${utxT('Стартовая цена')}: ${o.startPrice}</span><span>${utxT('Текущая ставка')}: <b>${o.currentBid||'—'}</b></span></div><div class="utxMeta"><span>${utxT('Купить сейчас')}</span><b class="utxPrice">🪙 ${o.price}</b></div><div class="utActions"><button class="mi" data-a="utxBid" data-id="${utEsc(o.id)}">${own?utxT('Повысить ставку'):utxT('Ставка')+' · '+(bidMin||o.startPrice)}</button><button class="mi pri" data-a="utxBuyNow" data-id="${utEsc(o.id)}">${utxT('Купить сейчас')}</button></div></div>`;}).join('')||`<div class="utxEmpty">${utxT('Ничего не найдено')}</div>`}</div>`;
 }else if(view==='sell'){
   const draft=ut.listingDraft&&utById(ut.listingDraft)?utById(ut.listingDraft):null;h+=`<p class="help">${utxT('Выставляй игроков на 1, 6 или 24 часа. При продаже удерживается налог 5%. Игрок из стартового состава требует подтверждения и будет заменён.')}</p>`;
   if(draft){const base=utPrice(draft);h+=`<div class="utPanel"><h3>${utxT('Выставить на рынок')}: ${utEsc(draft.name)}</h3><div class="utxForm"><label class="utxField">${utxT('Стартовая цена')}<input id="utxStart" type="number" min="10" value="${Math.max(10,Math.round(base*.65/10)*10)}"></label><label class="utxField">${utxT('Купить сейчас')}<input id="utxBuyNow" type="number" min="10" value="${Math.round(base*1.35/10)*10}"></label><label class="utxField">${utxT('Длительность')}<select id="utxDuration"><option value="1">${utxT('1 час')}</option><option value="6" selected>${utxT('6 часов')}</option><option value="24">${utxT('24 часа')}</option></select></label></div><div class="utActions"><button class="mi pri" data-a="utxListPublish" data-id="${utEsc(draft.uid)}">${utxT('Выставить на рынок')}</button><button class="mi" data-a="utxListCancelDraft">${utxT('Отмена')}</button></div></div>`;}
   h+=`<h3>${utxT('Мои лоты')}</h3><div class="utGrid">${ut.userListings.map(l=>`<div class="utxListing" style="--rarity:${UT_RARITY[l.card.rarity].color}">${utxListingCard(l.card)}<div class="utxMeta"><span>${utxT('Стартовая цена')}: ${l.startPrice}</span><span>${utxT('Купить сейчас')}: ${l.buyNow}</span></div><div class="utxMeta"><span>${utxT('Текущая ставка')}: ${l.currentBid||'—'}</span><span>${utxT('Истекает')}: <b data-utx-expiry="${l.expiresAt}">${utxTimeLeft(l.expiresAt)}</b></span></div><button class="mi" data-a="utxCancelListing" data-id="${utEsc(l.id)}">${utxT('Снять с продажи')}</button></div>`).join('')||`<div class="utxEmpty">${utxT('Пусто')}</div>`}</div><h3>${utxT('Продать игроков')}</h3><div class="utGrid">${ut.collection.filter(c=>!ut.userListings.some(l=>l.card.uid===c.uid)).map(c=>`<div class="utxListing" style="--rarity:${UT_RARITY[c.rarity].color}">${utxListingCard(c)}<div class="utActions"><button class="mi pri" data-a="utxListDraft" data-id="${utEsc(c.uid)}">${utxT('Выставить на рынок')}</button><button class="mi" data-a="utxQuickSell" data-id="${utEsc(c.uid)}">${utxT('Быстро')}</button></div>${ut.lineup.includes(c.uid)?`<small>${utxT('Игрок в стартовом составе: потребуется подтверждение')}</small>`:''}</div>`).join('')||`<div class="utxEmpty">${utxT('Нет доступных игроков')}</div>`}</div>`;
 }else if(view==='expiring'){
   const list=utxCombined().filter(o=>o.seller!=='me'&&o.expires-Date.now()<15*60*1000).sort((a,b)=>a.expires-b.expires);h+=`<div class="utGrid">${list.map(o=>`<div class="utxListing" style="--rarity:${UT_RARITY[o.rarity].color}">${utxListingCard(o.card)}<div class="utxMeta"><span>${utxT('Истекает')}</span><b data-utx-expiry="${o.expires}">${utxTimeLeft(o.expires)}</b></div><p class="utxPrice">🪙 ${o.price}</p><div class="utActions"><button class="mi" data-a="utxBid" data-id="${utEsc(o.id)}">${utxT('Ставка')}</button><button class="mi pri" data-a="utxBuyNow" data-id="${utEsc(o.id)}">${utxT('Купить сейчас')}</button></div></div>`).join('')||`<div class="utxEmpty">${utxT('Нет лотов, которые истекают в ближайшие 15 минут')}</div>`}</div>`;
 }else if(view==='offers'){
   const bids=ut.myBids.slice().sort((a,b)=>(b.placedAt||0)-(a.placedAt||0));h+=`<h3>${utxT('Мои ставки')}</h3><div class="utGrid">${bids.map(b=>{const o=ut.market.find(x=>x.id===b.listingId);const c=o?.card||ut.marketHistory.find(h=>h.id===b.historyId);return `<div class="utxListing"><b>${utEsc(o?.card?.name||c?.name||utxT('Трансферы'))}</b><div class="utxMeta"><span>${utxT('Ставка')}: ${b.amount}</span><span class="utxStatus">${b.status==='active'?utxT('Активна'):b.status==='won'?utxT('Выиграна'):utxT('Завершена')}</span></div>${o?`<small data-utx-expiry="${o.expires}">${utxTimeLeft(o.expires)}</small><div class="utActions"><button class="mi pri" data-a="utxBuyNow" data-id="${utEsc(o.id)}">${utxT('Купить сейчас')}</button></div>`:''}</div>`;}).join('')||`<div class="utxEmpty">${utxT('Пока нет ставок')}</div>`}</div><h3>${utxT('Мои лоты')}</h3><div class="utGrid">${ut.userListings.map(l=>`<div class="utxListing"><b>${utEsc(l.card.name)}</b><p>${utxT('Купить сейчас')}: ${l.buyNow}</p><small data-utx-expiry="${l.expiresAt}">${utxTimeLeft(l.expiresAt)}</small><button class="mi" data-a="utxCancelListing" data-id="${utEsc(l.id)}">${utxT('Снять с продажи')}</button></div>`).join('')||`<div class="utxEmpty">${utxT('Пусто')}</div>`}</div>`;
 }else{
   h+=`<div class="utGrid">${ut.marketHistory.map(x=>`<div class="utxListing"><div class="utxMeta"><b>${utxT(({purchase:'Покупка',sale:'Продажа',listed:'Выставлен',cancel:'Снят с продажи',unsold:'Не продан',refund:'Возврат ставки'}[x.type]||'Трансферы'))}</b><small>${utxDate(x.ts)}</small></div><b>${utEsc(x.name)}</b><div class="utxPrice">${x.amount?`🪙 ${x.amount}`:'—'}</div>${x.tax?`<small>${utxT('Налог 5%')}: ${x.tax}</small>`:''}</div>`).join('')||`<div class="utxEmpty">${utxT('История пока пуста')}</div>`}</div>`;
 }
 return h+'</div>';
}
function utxClubEditor(){const shapes=[['shield','⬡'],['circle','●'],['star','★'],['hex','⬢']],colors=['#3a86ff','#ff7a1a','#b8ff3d','#b266ff','#29d3b0','#f15b75','#f2d36b','#edf2f7'];return `<div class="utPanel"><h3>${utxT('Название клуба')}</h3><div class="utActions"><span class="utEmblem ${ut.emblemShape}" style="--ut-club-color:${ut.color}">${ut.badge}</span><input class="utInput" id="utNameInput" maxlength="20" value="${utEsc(ut.name)}" aria-label="${utxT('Название клуба')}"><button class="mi pri" data-a="utRename">${utxT('Сохранить')}</button></div><div class="utxFilters"><label>${utxT('Основная форма')}<input type="color" id="utHomeColor" value="${ut.homeColor}"></label><label>${utxT('Гостевая форма')}<input type="color" id="utAwayColor" value="${ut.awayColor}"></label><label>${utxT('Рисунок майки')}<select id="utKitPattern">${[['0','Однотонная'],['1','Кольца'],['2','Полосы'],['3','Половинки'],['4','Перевязь']].map(([v,n])=>`<option value="${v}" ${ut.kitPattern===+v?'selected':''}>${utxT(n)}</option>`).join('')}</select></label><label>${utxT('Эмблема клуба')}<select id="utEmblemShape">${shapes.map(([v,n])=>`<option value="${v}" ${ut.emblemShape===v?'selected':''}>${utxT(({shield:'Щит',circle:'Круг',star:'Звезда',hex:'Шестиугольник'})[v])}</option>`).join('')}</select></label></div><div class="utActions">${colors.map(c=>`<button class="mi" data-a="utxClubColor" data-v="${c}" style="border-left:5px solid ${c};min-width:72px">${c}</button>`).join('')}<button class="mi" data-a="utxBadge">${utxT('Следующий значок')}</button><button class="mi pri" data-a="utxSaveClub">${utxT('Сохранить')}</button></div><div class="utNotice">${utxT('Изменения формы применяются к следующим матчам Ultimate Team.')}</div></div>`;}
// Preserve the mature screens while replacing only the market subpage and extending club/custom fields.
const UTX_PREV_RENDER=renderUT;
renderUT=function(){utxInitSchema();UTX_PREV_RENDER();if(utTab==='market')$('utBody').innerHTML=utxMarketHtml();if(utTab==='packs')$('utBody').insertAdjacentHTML('beforeend',`<div class="utPanel"><h3>${utxT('История открытий паков')}</h3><div class="utGrid">${ut.packHistory.map(p=>`<div class="utxListing" style="--rarity:${UT_RARITY[p.card?.rarity||'bronze'].color}"><b>${utEsc(p.card?.name||'—')}</b><div class="utxMeta"><span>${utxT(UT_PACKS[p.pack]?.label||p.pack)}</span><span>${utxDate(p.ts)}</span></div><small>${p.card?.rating||'—'} · ${utxT(UT_RARITY[p.card?.rarity||'bronze'].label)} · ${p.card?.pos||''}</small><p>${p.duplicate?utxT('Повтор · конвертировано в монеты')+' +'+p.coins+' 🪙':utxT('Уникальная карточка добавлена')}</p></div>`).join('')||`<div class="utxEmpty">${utxT('Пусто')}</div>`}</div></div>`);if(utTab==='club'){$('utBody').insertAdjacentHTML('afterbegin',utxClubEditor());[...$('utBody').querySelectorAll('.utPanel')].forEach(p=>{const title=p.querySelector('h3')?.textContent.trim();if(title==='Клуб'||title==='Редактор эмблемы и цветов клуба')p.remove();});}utxTranslateDOM($('utBody'));};
// Locale control stays in the main settings page (not inside Ultimate Team).
const UTX_PREV_SETTINGS=renderSettings;
renderSettings=function(){UTX_PREV_SETTINGS();const el=$('langSetting');if(el)el.innerHTML=`<div class="utxLangRow"><label for="gameLanguage">${utxT('Язык')}</label><select id="gameLanguage">${Object.entries(UTX_LANGS).map(([k,v])=>`<option value="${k}" ${settings.lang===k?'selected':''}>${v}</option>`).join('')}</select><div class="lflags">${Object.entries(UTX_LANGS).map(([k,v])=>`<button type="button" class="lf ${settings.lang===k?'on':''}" onclick="var s=document.getElementById('gameLanguage');document.querySelectorAll('.lf').forEach(function(x){x.classList.toggle('on',x===this)},this);s.value='${k}';s.dispatchEvent(new Event('change',{bubbles:true}))">${({ru:'🇷🇺',en:'🇬🇧',fr:'🇫🇷',es:'🇪🇸',tr:'🇹🇷',az:'🇦🇿'})[k]} <span>${v}</span></button>`).join('')}</div></div>`;utxTranslateDOM($('sc-settings'));};
function utxSaveClub(){const name=$('utNameInput')?.value.trim();if(name!==undefined)ut.name=(name||'Молочный клуб').slice(0,20);const h=$('utHomeColor')?.value,a=$('utAwayColor')?.value,p=$('utKitPattern')?.value,e=$('utEmblemShape')?.value;if(/^#[0-9a-f]{6}$/i.test(h||''))ut.homeColor=ut.color=h;if(/^#[0-9a-f]{6}$/i.test(a||''))ut.awayColor=a;if(p!==undefined)ut.kitPattern=clamp(+p||0,0,4);if(['shield','circle','star','hex'].includes(e))ut.emblemShape=e;saveUT();renderUT();}
function utxTranslateWholeDOM(){utxTranslateDOM(document);}
// Observe only UI screens, never the live HUD or 3D loop, so localization stays lightweight.
['sc-home','sc-tours','sc-teams','sc-hub','sc-settings','sc-ward','sc-ut','sc-end'].forEach(id=>{const el=document.getElementById(id);if(el)UTX_STATIC.observe(el,{childList:true,subtree:true});});
// These compact overlays are updated during live play; observe insertions only so language stays live
// without scanning the entire interface every animation frame.
const UTX_DYNAMIC_OBS_V26=new MutationObserver(records=>{
 if(UTX_BUSY)return;const roots=new Set();
 records.forEach(r=>{const el=r.target.nodeType===1?r.target:r.target.parentElement;const root=el&&el.closest?el.closest('#hud,#banner,#commentary,#center,#penui,#penhud,#replayTag,#skipTag,#pName,#tbtns'):null;if(root)roots.add(root);});
 roots.forEach(root=>utxTranslateDOM(root));
});
['hud','banner','commentary','center','penui','penhud','replayTag','skipTag','pName','tbtns'].forEach(id=>{const el=document.getElementById(id);if(el)UTX_DYNAMIC_OBS_V26.observe(el,{childList:true,subtree:true});});
utxTranslateAll();
Object.assign(ACT,{
 utxMarketView(d){if(['buy','sell','expiring','offers','history'].includes(d.v)){ut.marketView=d.v;ut.listingDraft='';saveUT();renderUT();}},
 utxBid(d){utxPlaceBid(d.id);},utxBuyNow(d){utxBuyNow(d.id);},
 utxListDraft(d){ut.listingDraft=d.id;ut.marketView='sell';saveUT();renderUT();},
 utxListPublish(d){utxListCard(d.id);},utxListCancelDraft(){ut.listingDraft='';saveUT();renderUT();},
 utxCancelListing(d){utxCancelListing(d.id);},utxQuickSell(d){utxQuickSell(d.id);},
 utxClearFilters(){ut.marketFilters={q:'',pos:'',minRating:0,maxPrice:50000,rarity:'',nation:'',club:'',sort:'price'};saveUT();renderUT();},
 utxClubColor(d){if(/^#[0-9a-f]{6}$/i.test(d.v||'')){ut.color=ut.homeColor=d.v;ut.collection.forEach(c=>{if(!c.kitColor)c.kitColor=d.v;});saveUT();renderUT();}},utxBadge(){ut.badge=UT_BADGES[(UT_BADGES.indexOf(ut.badge)+1)%UT_BADGES.length];saveUT();renderUT();},utxSaveClub(){utxSaveClub();},
 utRename(){const v=$('utNameInput');if(v){ut.name=(v.value.trim()||'Молочный клуб').slice(0,20);saveUT();renderUT();}},
 utEmblem(){ut.badge=UT_BADGES[(UT_BADGES.indexOf(ut.badge)+1)%UT_BADGES.length];saveUT();renderUT();}
});
// Club data remains backward compatible and the selected home kit enters the existing match builder.
utChemistry=function(){const cards=ut.lineup.map(utById).filter(Boolean);if(cards.length<2)return 0;let links=0,total=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){total++;if(cards[i].club===cards[j].club||cards[i].nation===cards[j].nation||(cards[i].league||utxLeagueForClub(cards[i].club))===(cards[j].league||utxLeagueForClub(cards[j].club)))links++;}return Math.round(links/Math.max(1,total)*100);};
const UTX_OLD_BUILD_MATCH=buildMatch;buildMatch=function(cfg){UTX_OLD_BUILD_MATCH(cfg);if(cfg&&cfg.utManaged){const a=$('nA');if(a)a.textContent=(ut.badge||'🐮')+' '+String(ut.name||'CLUB').slice(0,12);}};
const UTX_OLD_KIT_PATTERN=kitPattern;kitPattern=function(team){if((team?.pat|0)===5){return [mp(BX(.75,.99,.53),team.c2,[.05,1.05,-.26])];}return UTX_OLD_KIT_PATTERN(team);};
const UTX_OLD_START=utStartMatch;
utStartMatch=function(mode){utxInitSchema();const base=teamById(settings.myTeam)||TEAMS[0],opps=TEAMS.filter(t=>t.id!==base.id),opp=opps[(Math.random()*opps.length)|0],utClub=Object.assign({},base,{id:'ut_local_'+Date.now(),name:ut.name.slice(0,20),code:'КЛБ',c1:parseInt(ut.homeColor.slice(1),16),c2:parseInt(ut.awayColor.slice(1),16),pat:ut.kitPattern===3?5:ut.kitPattern===4?3:ut.kitPattern,tag:'Локальный клуб Ultimate Team'});startMatch({tA:utClub,tB:opp,size:11,form:ut.formation||'4-3-3',formB:'4-4-2',versus:false,ko:false,comp:false,utManaged:true,utMode:mode,style:'bal',noTactics:false});};
// Local sale tax and listing history keep legacy stats compatible.
const UTX_OLD_QUICK=ACT.utQuickSell;
// New generated cards carry cosmetic identity, while legacy cards get defaults in utxInitSchema.
const UTX_OLD_CARD_HTML=utCardHtml;utCardHtml=function(c,actions=true){const r=UT_RARITY[c.rarity]||UT_RARITY.bronze,pat=['','rings','stripes','halves','sash'][clamp(+c.pattern||0,0,4)],a=c.kitColor||ut.homeColor||'#3a86ff',b=c.kitColor2||ut.awayColor||'#f1f4f8';return `<div class=\"utCard utxPlayerCard\" style=\"--rarity:${r.color}\"><span class=\"pos\">${utEsc(c.pos)}</span><div class=\"rating\">${c.rating}</div><div style=\"display:flex;gap:8px;align-items:center\"><span class=\"utEmblem circle\" style=\"--ut-club-color:${utEsc(c.coat||'#d8dce2')};background:${utEsc(c.coat||'#d8dce2')};color:#151922;font-size:12px\">◉</span><span class=\"utxKitPreview ${pat}\" style=\"--kit-a:${utEsc(a)};--kit-b:${utEsc(b)}\"></span><div><b>${utEsc(c.name)}</b><small>#${c.num||1} · ${utEsc(r.label)} · ${utEsc(c.nation)} · ${utEsc(c.club)}</small></div></div><div class=\"statsline\"><span>СКР ${c.pac}</span><span>УД ${c.sho}</span><span>ПАС ${c.pas}</span><span>ДРБ ${c.dri}</span><span>ЗАЩ ${c.def}</span><span>ФИЗ ${c.phy}</span></div>${actions?`<div class=\"utActions\"><button class=\"mi\" data-a=\"utxListDraft\" data-id=\"${utEsc(c.uid)}\">${utxT('Выставить на рынок')}</button><button class=\"mi\" data-a=\"utxQuickSell\" data-id=\"${utEsc(c.uid)}\">${utxT('Быстро')}</button></div>`:''}</div>`;};
const UTX_OLD_CARD=utCardFromTemplate;
utCardFromTemplate=function(tid,rarity){const c=UTX_OLD_CARD(tid,rarity);c.coat=['#f0eee5','#d8dce2','#c5b39a','#eee1d0','#9ca8b4'][Math.abs(c.tid||0)%5];c.league=utxLeagueForClub(c.club);c.kitColor=ut?.homeColor||'#3a86ff';c.kitColor2=ut?.awayColor||'#f1f4f8';c.pattern=Math.abs(c.tid||0)%5;c.num=1+Math.abs(c.tid||0)%99;return c;};
// Prevent duplicate cards: convert repeat pulls to coins, but keep the reveal animation and open history.
const UTX_OLD_OPEN_PACK=utOpenPack;
utOpenPack=function(pack){const p=UT_PACKS[pack];if(!p)return;if(ut.coins<p.cost){alert(utxT('Не хватает монет'));return;}ut.coins-=p.cost;const rarity=utRarityByRoll(Math.random(),pack),pool=UT_TEMPLATES.filter(t=>t.rating>=UT_RARITY[rarity].min-8&&t.rating<=UT_RARITY[rarity].max+5),t=pool[(Math.random()*pool.length)|0]||UT_TEMPLATES[0],card=utCardFromTemplate(t.tid,rarity);const dupe=ut.collection.find(c=>c.tid===card.tid&&c.rarity===card.rarity);ut.stats.packs++;ut.xp+=20;let reveal=card;if(dupe){const coins=Math.max(25,Math.round(utPrice(card)*.42));ut.coins+=coins;reveal=Object.assign({},card,{duplicateConverted:true,duplicateCoins:coins});utxRecord('duplicate',card,coins,{source:'pack'});ut.packHistory.unshift({ts:Date.now(),pack,card:{tid:card.tid,name:card.name,rating:card.rating,rarity:card.rarity,pos:card.pos},duplicate:true,coins});}else{ut.collection.push(card);utxRecord('pack',card,p.cost,{source:pack});ut.packHistory.unshift({ts:Date.now(),pack,card:{tid:card.tid,name:card.name,rating:card.rating,rarity:card.rarity,pos:card.pos},duplicate:false,coins:0});}ut.packHistory=ut.packHistory.slice(0,50);utRefreshLevel();saveUT();showUTReveal(reveal);};
const UTX_OLD_REVEAL=showUTReveal;
showUTReveal=function(card){UTX_OLD_REVEAL(card);const t=$('utRevealTitle'),s=$('utRevealSub');if(card?.duplicateConverted){if(t)t.textContent=utxT('Повтор превращён в монеты');if(s)s.textContent=`+${card.duplicateCoins} 🪙`;}else if(t)t.textContent=utxT('Пак открыт!');utxTranslateDOM($('utReveal'));};
// The locale changes immediately throughout existing DOM, including menu/settings/UT text nodes.
document.addEventListener('change',e=>{if(e.target&&e.target.id==='gameLanguage'){const v=e.target.value;if(UTX_LANGS[v]){settings.lang=v;save();utxApplyLanguage();}}else if(e.target&&e.target.classList?.contains('utxFilter')){ut.marketFilters[e.target.dataset.f]=e.target.dataset.f==='minRating'||e.target.dataset.f==='maxPrice'?Math.max(0,+e.target.value||0):e.target.value;saveUT();renderUT();}else if(e.target&&['utHomeColor','utAwayColor','utKitPattern','utEmblemShape'].includes(e.target.id)){/* draft controls commit together through Save */}});
document.addEventListener('input',e=>{if(e.target&&e.target.classList?.contains('utxFilter')){const k=e.target.dataset.f;if(k!=='q')return;ut.marketFilters.q=e.target.value;const cursor=e.target.selectionStart;saveUT();renderUT();const next=document.querySelector('.utxFilter[data-f="q"]');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(cursor,cursor);}catch(_){}}}});
// Countdowns update only text nodes; market data is processed at a low cadence while its screen is open.
let utxSecond=0;setInterval(()=>{if(screen!=='ut')return;document.querySelectorAll('[data-utx-expiry]').forEach(el=>{el.textContent=utxTimeLeft(+el.dataset.utxExpiry||0);});if(utTab==='market'&&++utxSecond%15===0){const changed=utxProcessExpiry();if(changed)renderUT();}},1000);
// Keep the resolution slider at its supported range; startup selects the maximum 100% value.
settings.res=clamp(Number(settings.res)||100,50,100);save();

// ================== Главный цикл ==================
let last = performance.now(), lastRender = 0, fpsAvg = 60, fpsT = 0, lowT = 0, highT = 0, prevNow = performance.now();
function adaptQuality(now, dt) {
  const inst = 1000 / Math.max(1, now - prevNow); prevNow = now; fpsAvg += (inst - fpsAvg) * 0.05; fpsT += dt;
  if (settings.showFps && fpsT >= 10) { $('fps').textContent = `${Math.round(fpsAvg)} FPS · ${(1000 / Math.max(1, fpsAvg)).toFixed(1)} мс`; fpsT = 0; }
  if (!settings.dynamicRes) { lowT = highT = 0; return; }
  const target = state === 'menu' ? 30 : (Number(settings.fpsCap) > 0 ? Number(settings.fpsCap) : 60);
  if (fpsAvg < target * 0.74) { lowT += dt; highT = 0; } else if (fpsAvg > target - 4) { highT += dt; lowT = 0; } else { lowT = Math.max(0, lowT - dt * 0.4); highT = Math.max(0, highT - dt * 0.4); }
  // Scale changes are intentionally small and hysteretic to avoid visible pumping.
  if (lowT > 120 && renderScale > 0.6) { renderScale = Math.max(0.6, Math.round((renderScale - 0.1) * 100) / 100); lowT = 0; applyRes(); }
  if (highT > 420 && renderScale < 1) { renderScale = Math.min(1, Math.round((renderScale + 0.05) * 100) / 100); highT = 0; applyRes(); }
}
function loop(now) {
  requestAnimationFrame(loop);
  // Do not run simulation, particle updates, or WebGL draws while the tab is hidden.
  if (document.hidden) { last = now; lastRender = now; prevNow = now; return; }
  const cap = (state === 'menu' && !(settings.fpsCap && settings.fpsCap < 30)) ? 30 : settings.fpsCap; if (cap && now - lastRender < 1000 / cap - 2) return;
  lastRender = now; const rawDt = (now - last) / 16.667;
  const dt = Math.min(1.75, Math.max(0.25, rawDt)); last = now;
  pollPadPause();
  if (state === 'pens') stepPens(dt);
  else if (state === 'rule' && restartStateV17) stepRestart(dt);
  else if (state === 'ready' || state === 'play' || state === 'goal' || state === 'replay' || state === 'outro') stepGame(dt);
  else clock += dt;
  updateHUD(); syncScene(dt);
  {
    const fpsNow = Number.isFinite(fpsAvg) ? fpsAvg : 60;
    const autoEv = fpsNow < 32 ? 5 : fpsNow < 43 ? 4 : (gfxLevel() === 'high' || gfxLevel() === 'ultra') ? 2 : gfxLevel() === 'med' ? 3 : 4;
    const ev = Number(settings.shadowRate) > 0 ? Number(settings.shadowRate) : autoEv;
    shadowTick = (shadowTick + 1) % ev; if (shadowTick === 0) renderer.shadowMap.needsUpdate = true;
  }
  renderer.render(scene, camera); adaptQuality(now, dt);
}

// ================== Запуск ==================
document.addEventListener('input', e => {
  if (!['utSearch'].includes(e.target.id)) return;
  const q=e.target.value.trim().toLocaleLowerCase('ru-RU'), pos=document.getElementById('utPositionFilter')?.value||'', rarity=document.getElementById('utRarityFilter')?.value||'';
  document.querySelectorAll('#utPlayersGrid > [data-search]').forEach(el=>{el.hidden=!!((q&&!el.dataset.search.includes(q))||(pos&&el.dataset.position!==pos)||(rarity&&el.dataset.rarity!==rarity));});
});
document.addEventListener('change', e => {
  if (!['utPositionFilter','utRarityFilter'].includes(e.target.id)) return;
  const q=document.getElementById('utSearch')?.value.trim().toLocaleLowerCase('ru-RU')||'', pos=document.getElementById('utPositionFilter')?.value||'', rarity=document.getElementById('utRarityFilter')?.value||'';
  document.querySelectorAll('#utPlayersGrid > [data-search]').forEach(el=>{el.hidden=!!((q&&!el.dataset.search.includes(q))||(pos&&el.dataset.position!==pos)||(rarity&&el.dataset.rarity!==rarity));});
});
document.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('[data-a]') : null; if (!b) return;
  if (screen) { const active=$('sc-'+screen); if(active) active.classList.add('cb-interacted'); }
  Audio_.init(); SFX.ui(); const f = ACT[b.dataset.a]; if (f) f(b.dataset, b); syncMusic();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches && settings.uiAnim === 'full') { settings.uiAnim = 'reduced'; }

// v28: экран загрузки с реальным прогрессом — шаги init() идут по очереди, между ними браузер перерисовывает экран
const INIT_LBL_V28 = {
  ru: ['Подготовка движка', 'Строим стадион', 'Выводим команды на поле', 'Готовим меню'],
  en: ['Preparing engine', 'Building the stadium', 'Bringing teams out', 'Preparing the menu'],
  fr: ['Préparation du moteur', 'Construction du stade', 'Entrée des équipes', 'Préparation du menu'],
  es: ['Preparando el motor', 'Construyendo el estadio', 'Saliendo al campo', 'Preparando el menú'],
  tr: ['Motor hazırlanıyor', 'Stadyum kuruluyor', 'Takımlar sahaya çıkıyor', 'Menü hazırlanıyor'],
  az: ['Mühərrik hazırlanır', 'Stadion qurulur', 'Komandalar meydana çıxır', 'Menyu hazırlanır']
};
function initStepV28(pct, idx) {
  const sp = document.getElementById('splash');
  if (sp) {
    const L = INIT_LBL_V28[settings.lang] || INIT_LBL_V28.ru;
    sp.innerHTML = '<div class="spw"><div class="spt">COW<em>BALL</em></div><div class="spbar"><i style="width:' + pct + '%"></i></div><small>' + L[idx] + ' · ' + pct + '%</small></div>';
  }
  return new Promise(res => { let done = false; const f = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(() => setTimeout(f, 0)); setTimeout(f, 80); });
}
async function init() {
 try {
  await initStepV28(5, 0); resizeGL(); window.addEventListener('resize', () => { resizeGL(); applyUIState(); });
  applyControlsLayout(); bindInput(); setBallStyle(settings.ballStyle);
  applyVisualFilters(); camera.fov = settings.cameraFov; camera.updateProjectionMatrix();
  await initStepV28(30, 1); buildStands(); cbInstallFieldStageV19(); applyEnv(settings.tod, settings.weather);
  if (settings.comp && settings.comp.done) { settings.comp = null; }
  await initStepV28(70, 2); enterMenuScene();
  await initStepV28(92, 3); renderHome(); show('home');
  const sp = $('splash'); if (sp && sp.parentNode) sp.parentNode.removeChild(sp);
  requestAnimationFrame(loop);
  if (window.__TEST) window.__cowball = { settings, ACT, get state() { return state; }, cows, pens, openTeams, teamGo, get comp() { return comp; }, setComp(c) { comp = c; }, renderHub, finishComp, enterHub, renderHome, show, get screen() { return screen; }, get ut() { return ut; }, renderUT, utOpenPack, utAutoLineup };
 } catch (e) { setTimeout(() => { throw e; }, 0); }
}

// ================== Cowball Matchday — реалистичный звук и церемонии ==================
// Новые настройки используют тот же объект настроек и существующее сохранение localStorage.
['vBall','vWhistle','vSteps','vGoal'].forEach(k => {
  const v = Number(settings[k]); settings[k] = Number.isFinite(v) ? clamp(v, 0, 100) : (DEF[k] || 0);
});
['stadiumSound','anthemEnabled','cartoonSounds','realisticCamera'].forEach(k => {
  if (typeof settings[k] !== 'boolean') settings[k] = !!DEF[k];
});
const _sndTab = SET_TABS.find(t => t.id === 'snd');
if (_sndTab) {
  _sndTab.items.unshift(
    { k:'stadiumSound', label:'Звуки стадиона', opts:onoff },
    { k:'anthemEnabled', label:'Гимны перед матчем', opts:onoff },
    { k:'cartoonSounds', label:'Мультяшные звуки', opts:onoff },
    { k:'vBall', label:'Удары и отскоки', type:'slider', min:0, max:100, fmt:v=>v+'%' },
    { k:'vWhistle', label:'Свисток судьи', type:'slider', min:0, max:100, fmt:v=>v+'%' },
    { k:'vSteps', label:'Шаги и дыхание', type:'slider', min:0, max:100, fmt:v=>v+'%' },
    { k:'vGoal', label:'Гол и реакции', type:'slider', min:0, max:100, fmt:v=>v+'%' }
  );
}
const _camTabReal = SET_TABS.find(t => t.id === 'camera');
if (_camTabReal && !_camTabReal.items.some(x => x.k === 'realisticCamera')) _camTabReal.items.unshift({ k:'realisticCamera', label:'Реалистичная камера церемоний', opts:onoff });
const _renderSettingsReal = renderSettings;
renderSettings = function() {
  _renderSettingsReal();
  if (SET_TABS[setTab] && (SET_TABS[setTab].id === 'snd' || SET_TABS[setTab].id === 'camera')) {
    const el = $('setBody'); if (el) { const note=document.createElement('div'); note.className='kbhelp'; note.textContent = SET_TABS[setTab].id === 'snd' ? 'Оригинальная музыка и звуковые файлы загружаются из assets/audio. Громкость музыки, мяча, свистка и трибун регулируется отдельно. Диктор использует встроенный голос браузера, если он доступен.' : 'Телевизионная камера плавно меняет общий, боковой и крупный план во время церемоний. На слабом устройстве переходы остаются лёгкими.'; el.appendChild(note); }
  }
};

// Свой небольшой WebAudio-слой даёт более сухие и реалистичные переходные звуки.
const RealSnd = (() => {
  let ctx = null, master = null, crowdOsc = null, crowdGain = null;
  const r = (a,b)=>a+Math.random()*(b-a);
  const normVol = (key, fallback=70) => clamp((Number(settings[key] ?? fallback) / 100) * (Number(settings.vSfx ?? 85) / 100) * (Number(settings.vMaster ?? 80) / 100), 0, 1);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(()=>{}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      const n = Math.floor(ctx.sampleRate * 1.6), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); let z=0;
      for(let i=0;i<n;i++){z=(z+0.018*(Math.random()*2-1))/1.018;d[i]=z*4.2;}
      const src=ctx.createBufferSource(); src.buffer=b; src.loop=true;
      const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=430; bp.Q.value=.45;
      crowdGain=ctx.createGain(); crowdGain.gain.value=0; src.connect(bp);bp.connect(crowdGain);crowdGain.connect(master);src.start();
    } catch(e) { ctx=null; }
  }
  function route(node, pan=0, key='vBall', amp=1, wet=false) {
    if (!ctx || !master) return;
    const g=ctx.createGain(); const cp = (typeof camera!=='undefined' && camera.position) ? camera.position : null; const sx=(clamp(pan,-.8,.8)/.8)*20; const dist=cp ? Math.hypot(sx-cp.x, 1.0-cp.y, -cp.z) : 10; const attenuation=1/(1+Math.max(0,dist)*.025); g.gain.value=normVol(key)*amp*attenuation;
    let n=node; if (ctx.createStereoPanner) { const p=ctx.createStereoPanner(); p.pan.value=clamp(pan-(cp?cp.x*.018:0),-1,1); n.connect(p); p.connect(g); } else n.connect(g);
    g.connect(master);
    if (wet) { const d=ctx.createDelay(); d.delayTime.value=.055; const dg=ctx.createGain(); dg.gain.value=.09; g.connect(d);d.connect(dg);dg.connect(master); }
    return g;
  }
  function noise(dur, amp, cutoff, type='bandpass', pan=0, key='vBall', q=.8, freq=0) {
    if (!ctx) return; const t=ctx.currentTime, n=Math.max(16,Math.floor(ctx.sampleRate*dur)), b=ctx.createBuffer(1,n,ctx.sampleRate), a=b.getChannelData(0);
    for(let i=0;i<n;i++) a[i]=(Math.random()*2-1)*(1-i/n)*(0.65+0.35*Math.random());
    const src=ctx.createBufferSource();src.buffer=b;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=cutoff;f.Q.value=q;
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0002,amp),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(f);f.connect(g); route(g,pan,key,1,true);src.start(t);src.stop(t+dur+.01);
  }
  function tone(f0,f1,dur,amp,pan=0,key='vBall',wave='sine',detune=0) {
    if (!ctx) return; const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(f0,t);o.detune.value=detune;
    if(f0!==f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);route(g,pan,key,1,true);o.start(t);o.stop(t+dur+.02);
  }
  function hit(power,pan,hard=false) {
    if(!ctx)return; const p=clamp(Number(power)||.4,.15,1), v=(hard?.2:.12)+p*(hard?.29:.17);
    noise(hard?.075:.048,v,hard?1250:820,'bandpass',pan,'vBall',.75);
    tone(hard?105:88,hard?42:46,hard?.12:.075,.08+p*.16,pan,'vBall','sine');
    noise(.018,.05+p*.045,2600,'highpass',pan,'vBall',.7);
  }
  function whistle(len=.45, pan=0) {
    if(!ctx)return; const dur=clamp(len,.18,1.5), t=ctx.currentTime;
    // Воздушный свисток с лёгкой модуляцией, не электронный бип.
    noise(dur,.10,2850,'bandpass',pan,'vWhistle',2.6);
    const o=ctx.createOscillator(), l=ctx.createOscillator(), lg=ctx.createGain(), g=ctx.createGain();
    o.type='sine';o.frequency.value=2650;l.frequency.value=7.2;lg.gain.value=42;l.connect(lg);lg.connect(o.frequency);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(normVol('vWhistle')*.11,t+.025);g.gain.setValueAtTime(normVol('vWhistle')*.11,t+dur*.76);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);route(g,pan,'vWhistle',.8,true);o.start(t);l.start(t);o.stop(t+dur+.02);l.stop(t+dur+.02);
  }
  function goalCry(pan=0) {
    if(!ctx)return;
    // Короткий многослойный крик/рев: низкий тон, среднечастотная толпа и мягкий верх без клиппинга.
    noise(.95,.15,850,'bandpass',pan,'vGoal',.72); noise(1.12,.105,1380,'bandpass',pan,'vGoal',.55); noise(.9,.085,480,'lowpass',pan,'vGoal',.82);
    tone(215,145,.92,.075,pan,'vGoal','sawtooth'); tone(560,370,.66,.032,pan,'vGoal','triangle',-6);
  }
  function net(pan=0,speed=4) { const v=clamp((speed||4)/18,.2,1); noise(.22,.05+v*.07,850,'bandpass',pan,'vBall',1.1); noise(.12,.04,1300,'lowpass',pan,'vBall',.8); }
  function crowd(level=0) {
    if (!ctx || !crowdGain) return; const t=ctx.currentTime;
    const target = settings.stadiumSound ? (level<=0?0:(.012+.105*clamp(level,0,1)) * (Number(settings.vCrowd||0)/100) * (Number(settings.vMaster||0)/100)) : 0;
    crowdGain.gain.cancelScheduledValues(t); crowdGain.gain.setTargetAtTime(target,t,.7);
  }
  function anthem() {
    if(!ctx || !settings.anthemEnabled)return;
    // Короткая последовательная фанфарная фраза с мягким медным тембром.
    const melody=[196,247,294,247,220,262,330,294,196,247,294,392];
    melody.forEach((f,i)=>{
      const t=ctx.currentTime+i*.24,o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=1250;g.gain.setValueAtTime(.0001,t);
      g.gain.linearRampToValueAtTime(normVol('vGoal')*.075,t+.025);g.gain.setValueAtTime(normVol('vGoal')*.075,t+.14);g.gain.exponentialRampToValueAtTime(.0001,t+.23);
      o.connect(lp);lp.connect(g);route(g,0,'vGoal',.8,true);o.start(t);o.stop(t+.25);
    });
  }
  function hand(pan=0) { noise(.055,.035,620,'lowpass',pan,'vSteps',.8); }
  function step(pan=0,run=.5) { const k=clamp(run,.2,1); noise(.043,.03+k*.045,340+k*130,'lowpass',pan,'vSteps',.65); tone(82+k*18,48,.05,.025+k*.025,pan,'vSteps','sine'); }
  function breath(pan=0,run=.7) { const k=clamp(run,.2,1); noise(.22,.018+k*.022,650,'bandpass',pan,'vSteps',.5); }
  function crowdCheer(level=.45,dur=2.5) { crowd(Math.max(level,.45)); setTimeout(()=>{if(state!=='outro'&&state!=='goal'&&state!=='pens')crowd(.35);},Math.min(6000,dur*1000)); }
  return {init, hit, whistle, goalCry, net, crowd, anthem, hand, step, breath, crowdCheer,
    click(pan=0){noise(.018,.018,900,'lowpass',pan,'vSteps',.7);},
    post(pan=0){tone(390,325,.28,.085,pan,'vBall','sine');noise(.07,.09,1100,'bandpass',pan,'vBall',1.1);},
    bounce(pan=0,impact=.3){tone(105,58,.085,.055+clamp(impact,.1,.6)*.13,pan,'vBall','sine');noise(.025,.04,460,'lowpass',pan,'vBall',.7);},
    stop(){if(crowdGain&&ctx){crowdGain.gain.setTargetAtTime(0,ctx.currentTime,.4);}}
  };
})();
const _audioInitReal = Audio_.init;
Audio_.init = function(){ try{_audioInitReal();}catch(e){} RealSnd.init(); };
const _crowdAudioReal = Audio_.crowd;
Audio_.crowd = function(level){ try{_crowdAudioReal(settings.stadiumSound ? level : 0);}catch(e){} RealSnd.crowd(settings.stadiumSound ? level : 0); };
const _swellAudioReal = Audio_.swell;
Audio_.swell = function(level,dur){ if(settings.stadiumSound){ try{_swellAudioReal(level,dur);}catch(e){} RealSnd.crowdCheer(level,dur); } else { try{_crowdAudioReal(0);}catch(e){} RealSnd.crowd(0); } };
// Переназначаем только звуковые события: физика и триггеры матча не меняются.
SFX.kick = (p,pan)=>RealSnd.hit(p,pan,true);
SFX.pass = (p,pan)=>RealSnd.hit(p,pan,false);
SFX.shot = (p,pan)=>RealSnd.hit(p,pan,true);
SFX.receive = pan=>{RealSnd.hit(.18,pan,false);};
SFX.footstep = (pan,run)=>RealSnd.step(pan,run);
SFX.breath = (pan,run)=>RealSnd.breath(pan,run);
SFX.glove = pan=>RealSnd.hit(.35,pan,false);
SFX.net = (pan,speed)=>RealSnd.net(pan,speed);
SFX.bodyHit = pan=>RealSnd.hit(.35,pan,false);
SFX.coinToss = ()=>RealSnd.click(0);
SFX.handshake = ()=>RealSnd.hand(0);
SFX.moo = (len,pitch,v,pan)=>{if(settings.cartoonSounds)RealSnd.breath(pan||0,.4);};
SFX.bzz = (len,v,pan)=>{if(settings.cartoonSounds)RealSnd.breath(pan||0,.3);};
SFX.creature = (kind,big,pan)=>{if(settings.cartoonSounds)RealSnd.breath(pan||0,big?.8:.4);};
SFX.whistle = len=>RealSnd.whistle(len||.45,0);
SFX.horn = ()=>{};
SFX.post = pan=>RealSnd.post(pan||0);
SFX.save = pan=>RealSnd.hit(.28,pan||0,false);
SFX.cross = pan=>RealSnd.hit(.3,pan||0,false);
SFX.bounce = (pan,impact)=>RealSnd.bounce(pan||0,impact||.3);
SFX.tackle = pan=>RealSnd.hit(.32,pan||0,false);
SFX.goal = pan=>RealSnd.goalCry(pan||0);
SFX.pick = ()=>RealSnd.click(0);
SFX.bell = ()=>{};
SFX.ui = ()=>RealSnd.click(0);
SFX.back = ()=>RealSnd.click(0);
SFX.beep = final=>{ if(final)RealSnd.whistle(.23,0); else RealSnd.click(0); };
SFX.anthem = ()=>RealSnd.anthem();
SFX.kickoff = ()=>RealSnd.whistle(.42,0);
SFX.cheer = (a,d)=>{if(settings.stadiumSound)Audio_.swell(a||.4,d||2.5);};
SFX.ooh = ()=>{if(settings.stadiumSound)Audio_.swell(.3,1.2);};
RealSnd.headTouch = function(pan=0){ RealSnd.hit(.22,pan,false); };
const _collideHeadAudioReal = collide;
collide = function(){
  let airborne=false, before=0, nearest=null;
  if(!ball.holder && (ball.h||0)>.45 && (ball.h||0)<1.2){
    before=Math.hypot(ball.vx,ball.vy);
    nearest=cows.find(c=>Math.hypot(ball.x-c.x,ball.y-c.y)<CR+BR+1)||null;
    airborne=!!nearest && before>1.4;
  }
  _collideHeadAudioReal();
  if(airborne && nearest && Math.abs(Math.hypot(ball.vx,ball.vy)-before)>.8) RealSnd.headTouch(sPan(ball.x));
};

// Небольшое добавление вращения обычному пасу; полёт, трение и перехваты остаются исходными.
const _kickBallReal = kickBall;
kickBall = function(c,dx,dy,power,kind,lift){
  _kickBallReal(c,dx,dy,power,kind,lift);
  if(kind==='pass' && !lift && Math.hypot(ball.vx,ball.vy)>1){
    const side = ((c && (c.lk||0))%2 ? 1 : -1);
    ball.curve = clamp((ball.curve||0) + side * .0032 * Math.min(1,Math.hypot(ball.vx,ball.vy)/10),-.009,.009);
  }
};

// Шаги и дыхание звучат редко и только у управляемых коров, которые действительно ускоряются.
const _cowAnimExtraReal = cowAnimExtra;
cowAnimExtra = function(c,spd,dt){
  _cowAnimExtraReal(c,spd,dt);
  if(!c || state!=='play' || !c.ctrl || spd<2.35) { if(c){c.realStepT=0;c.realBreathT=0;} return; }
  c.realStepT=(c.realStepT||0)+dt; c.realBreathT=(c.realBreathT||0)+dt;
  if(c.realStepT>13){c.realStepT=0;RealSnd.step(sPan(c.x),clamp(spd/3.5,.3,1));}
  if(c.realBreathT>75){c.realBreathT=0;RealSnd.breath(sPan(c.x),clamp(spd/3.5,.3,1));}
};

// Небольшой кубок появляется только у капитана победителей и скрывается после церемонии.
function ensureOutroCupV16(c){
  if(!c||c.cupV16||!c.g)return;
  const group=new THREE.Group(),gold=new THREE.MeshLambertMaterial({color:0xf5c84b}),dark=new THREE.MeshLambertMaterial({color:0xc58d21});
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.11,.19,.22,8),gold);bowl.position.y=.20;group.add(bowl);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.16,8),dark);stem.position.y=.015;group.add(stem);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.07,8),gold);base.position.y=-.10;group.add(base);
  [-1,1].forEach(sign=>{const h=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,5,10),gold);h.position.set(sign*.17,.22,0);h.rotation.z=sign*.55;group.add(h);});
  group.position.set(0,2.35,0);group.visible=false;c.g.add(group);c.cupV16=group;
}
// Церемония окончания: заминка, медленный сбор, рукопожатия, реакции, статистика и уход.
beginOutro = function(){
  setCenter(''); assignLk();
  SFX.whistle(.52);
  setTimeout(()=>{if(state==='outro')SFX.whistle(.55);},650);
  setTimeout(()=>{if(state==='outro')SFX.whistle(1.05);},1320);
  Audio_.crowd(.5); ball.carrier=null; ball.holder=null; outroT=0; outroGreet=false; outroCheer=false;
  outroWinner=score[0]===score[1]?-1:(score[0]>score[1]?0:1);
  cows.forEach(c=>{c.ox=c.x;c.oy=c.y;c.outroStartX=c.x;c.outroStartY=c.y;c.faceAng=undefined;ensureOutroCupV16(c);if(c.cupV16)c.cupV16.visible=false;});
  resetInputs();setState('outro');
  const label=t=>`${t.nation?t.flag+' ':''}${t.name}`;
  const title=outroWinner<0?'НИЧЬЯ':'ФИНАЛЬНЫЙ СВИСТОК';
  const sub=outroWinner<0?'Обе команды набрали одинаково':`${label(sideTeam[outroWinner])} · ${score[outroWinner]>0?'ПОБЕДА':'МАТЧ ЗАВЕРШЁН'}`;
  bannerEl().innerHTML=`<div class="gb" style="--tc:${hex(outroWinner>=0?sideKit[outroWinner]:0xffffff)}"><div><div class="gt">${title}</div><div class="gs">${label(sideTeam[0])} ${score[0]} : ${score[1]} ${label(sideTeam[1])}<br>${sub}</div></div></div>`;
  introEv.outroStats=false;introEv.outroTunnel=false;introEv.outroGreeting=false;introEv.outroCelebration=false;
  RealSnd.crowd(.48);
};
stepOutro = function(dt){
  outroT += dt; const T=outroT, nByTeam=[cows.filter(c=>c.team===0).length,cows.filter(c=>c.team===1).length];
  outroGreet=T>=245&&T<360; outroCheer=T>=360&&outroWinner>=0&&T<575;
  if(T>18 && T<105) cows.forEach(c=>{ c.vx*=Math.pow(.90,dt); c.vy*=Math.pow(.90,dt); });
  cows.forEach(c=>{
    if(c.cupV16){c.cupV16.visible=!!(T>=360&&T<575&&outroWinner>=0&&c===celeb);if(c.cupV16.visible)c.cupV16.rotation.z=Math.sin(clock*.11)*.08;}
    const ox=c.x,oy=c.y,n=nByTeam[c.team],idx=c.lk||0;
    let tx,ty;const teamSide=c.team?1:-1,row=idx-(n-1)/2;
    if(T<260){
      const stage=ezs((T-28)/225), sx=c.outroStartX??c.ox??c.x, sy=c.outroStartY??c.oy??c.y;
      tx=lerp(sx,W/2+teamSide*48,stage);ty=lerp(sy,H/2+row*34,stage);
    } else if(T<360){tx=W/2+teamSide*48;ty=H/2+row*34;}
    else if(T<575){
      if(outroWinner===-1){tx=W/2+teamSide*52;ty=H/2+row*36;}
      else if(c.team===outroWinner){
        const winnerSide=c.team===0?-1:1, isCaptain=c===celeb;
        tx=W/2+winnerSide*(isCaptain?30:66+Math.abs(row)*5)+Math.sin(T*.025+idx)*2;
        ty=H/2+row*36+(isCaptain?0:Math.cos(T*.025+idx)*2);
      } else {tx=W/2+teamSide*124;ty=H/2+row*38;}
    } else {
      const f=ezs((T-575)/80),fromX=outroWinner>=0&&c.team===outroWinner?(c.team===0?-66:66):teamSide*124;
      tx=lerp(W/2+fromX,W/2+teamSide*96,f);
      ty=lerp(H/2+row*38,FY+FH+42+idx*4,f);
    }
    const smooth=1-Math.pow(.90,Math.max(.1,dt));c.x=lerp(c.x,tx,smooth);c.y=lerp(c.y,ty,smooth);c.vx=(c.x-ox)/Math.max(.001,dt);c.vy=(c.y-oy)/Math.max(.001,dt);
    c.faceAng=T<245 ? -Math.atan2(c.vy,c.vx) : (T<360 ? (c.team?Math.PI:0) : (outroWinner===c.team&&outroWinner>=0 ? -Math.PI/2 : Math.PI/2));
  });
  if(T>=245 && !introEv.outroGreeting){introEv.outroGreeting=true;bannerEl().innerHTML='';SFX.handshake();}
  if(T>=360 && outroWinner>=0 && !introEv.outroCelebration){introEv.outroCelebration=true;lastScorer=outroWinner;celeb=cows.find(c=>c.team===outroWinner&&c.role!=='gk')||cows.find(c=>c.team===outroWinner);goalT=0;goalFx=0;SFX.cheer(.8,4);}
  if(T>=400 && !introEv.outroStats){
    introEv.outroStats=true; const poss=stats.poss[0]+stats.poss[1]||1,p0=Math.round(stats.poss[0]/poss*100),p1=100-p0;
    const label=t=>`${t.nation?t.flag+' ':''}${t.name}`;
    bannerEl().innerHTML=`<div class="gb s"><div><div class="gt">ИТОГИ МАТЧА</div><div class="gs">${label(sideTeam[0])} ${score[0]} : ${score[1]} ${label(sideTeam[1])}<br>Удары ${stats.shots[0]} : ${stats.shots[1]} · В створ ${stats.on[0]} : ${stats.on[1]}<br>Пасы ${stats.pass[0]} : ${stats.pass[1]} · Владение ${p0}% : ${p1}%</div></div></div>`;
  }
  if(T>=575 && !introEv.outroTunnel){introEv.outroTunnel=true;bannerEl().innerHTML='<div class="gb s"><div><div class="gt">КОМАНДЫ УХОДЯТ В ТОННЕЛЬ</div><div class="gs">Финальный свисток · Cowball Stadium</div></div></div>';RealSnd.crowd(.18);}
  if(T>=665) finishMatchNow();
};

// Плавные телевизионные ракурсы; камера остаётся над полем/за его границей, не проходит через зрителей.
let _realCamPos=new THREE.Vector3(), _realCamLook=new THREE.Vector3(), _realCamReady=false;
const _syncSceneReal=syncScene;
syncScene=function(dt){
  _syncSceneReal(dt);
  if(!settings.realisticCamera || !((state==='ready'&&introFull)||state==='outro'))return;
  let p,l;
  if(state==='ready'&&introFull){
    const T=introT;
    if(T<180){p=[0,23,33];l=[0,0,0];}
    else if(T<330){p=[-15,15,23];l=[-2,1,0];}
    else if(T<465){p=[14,14,22];l=[2,1,0];}
    else if(T<575){p=[0,12.5,19.5];l=[0,1,0];}
    else {p=[0,18,29];l=[0,0,0];}
    const a=T<180?T/180:T<330?(T-180)/150:T<465?(T-330)/135:T<575?(T-465)/110:(T-575)/105;
    const k=ezs(a); if(T<180){p=[lerp(0,-3,k),lerp(25,23,k),lerp(36,33,k)];}
  } else {
    const T=outroT;
    if(T<100){p=[0,24,34];l=[0,0,0];}
    else if(T<245){p=[-9,15,23];l=[-2,1,0];}
    else if(T<360){p=[10,14,21];l=[2,1,0];}
    else if(T<485){const c=celeb||cows.find(x=>x.team===outroWinner);p=[c?wx(c.x)+6:8,14.5,c?wz(c.y)+22:25];l=[c?wx(c.x):0,1.3,c?wz(c.y):0];}
    else if(T<575){p=[0,19,-29];l=[0,1,0];}
    else {p=[0,24,35];l=[0,0,0];}
  }
  if(p&&l){const targetP=new THREE.Vector3(p[0],p[1],p[2]),targetL=new THREE.Vector3(l[0],l[1],l[2]);
    if(!_realCamReady){_realCamPos.copy(camera.position);_realCamLook.copy(camLook);_realCamReady=true;}
    const alpha=1-Math.pow(.88,Math.max(.1,dt));_realCamPos.lerp(targetP,alpha);_realCamLook.lerp(targetL,alpha);camera.position.copy(_realCamPos);camera.lookAt(_realCamLook);
  }
};
// Плавные жесты коров в церемонии без изменения модели или управления.
const _cowAnimCeremonyReal=cowAnimExtra;
cowAnimExtra=function(c,spd,dt){
  _cowAnimCeremonyReal(c,spd,dt);
  if(!c)return;
  if(state==='outro'){
    if(outroGreet){const wave=Math.sin(clock*.18+(c.lk||0));c.body.rotation.z+=wave*.045;c.body.rotation.x+=Math.abs(wave)*.025;if(c.arms)c.arms.forEach((a,i)=>a.rotation.x+=Math.sin(clock*.16+i*Math.PI)*.22);}
    else if(outroT>=360&&outroT<575&&outroWinner>=0){
      if(c.team===outroWinner&&c===celeb){c.body.rotation.z-=.08+Math.max(0,Math.sin(clock*.2+(c.lk||0)))*.10;c.body.rotation.y+=Math.sin(clock*.04+(c.lk||0))*.08;c.hopY=Math.max(c.hopY||0,Math.max(0,Math.sin(clock*.19))* .42);if(c.arms)c.arms.forEach((a,i)=>a.rotation.z+=(i?1:-1)*.24);}
      else if(c.team===outroWinner){c.body.rotation.z-=.035;if(c.arms)c.arms.forEach((a,i)=>a.rotation.x+=Math.max(0,Math.sin(clock*.12+(c.lk||0)+i*Math.PI))*.11);}
      else {c.body.rotation.z+=.045;c.body.rotation.x+=.02;}
    }
  }
};
const _settingChangedReal=onSettingChanged;
onSettingChanged=function(k){_settingChangedReal(k);if(['vMaster','vSfx','vBall','vWhistle','vSteps','vGoal','vCrowd','stadiumSound','anthemEnabled','cartoonSounds','realisticCamera'].includes(k)){if(k==='stadiumSound'&&!settings.stadiumSound){try{_crowdAudioReal(0);}catch(e){}RealSnd.crowd(0);} if(k==='stadiumSound'&&settings.stadiumSound)Audio_.crowd(.35);}};


// ================== v17: responsive fixes, weather, audio unlock, names, and human-controlled restarts ==================
// Keep exactly one full-screen menu mounted/visible. Previous screens no longer remain underneath for the exit animation.
setScreen = function(name){
  if (screenAnimTimer) { clearTimeout(screenAnimTimer); screenAnimTimer=0; }
  const next = name && SCREENS.includes(name) ? name : null;
  const alreadyVisible = next ? !!$('sc-'+next) && !$('sc-'+next).classList.contains('hide') : !screen;
  if (next === screen && alreadyVisible) return;
  screen = next;
  SCREENS.forEach(s=>{const el=$('sc-'+s);if(!el)return;if(s===screen){el.classList.remove('hide','menu-exit','menu-enter');void el.offsetWidth;el.classList.add('menu-enter');}else{el.classList.add('hide');el.classList.remove('menu-enter','menu-exit');}});
  if(screen){const active=$('sc-'+screen);if(active)active.classList.remove('cb-interacted');}
  if(screen) screenAnimTimer=setTimeout(()=>{const el=$('sc-'+screen);if(el)el.classList.remove('menu-enter');screenAnimTimer=0;},360);
};
// FPS lives under Performance, and its off-by-default behaviour is retained.
(()=>{const gx=SET_TABS.find(t=>t.id==='gfx'),pf=SET_TABS.find(t=>t.id==='performance');if(gx&&pf){const i=gx.items.findIndex(x=>x.k==='showFps');if(i>=0){const [it]=gx.items.splice(i,1);if(!pf.items.some(x=>x.k==='showFps'))pf.items.unshift(it);}}})();
// Defensive localStorage sanitation for all newly introduced settings.
['vBall','vWhistle','vSteps','vGoal'].forEach(k=>{const n=Number(settings[k]);settings[k]=Number.isFinite(n)?clamp(n,0,100):DEF[k];});
['stadiumSound','anthemEnabled','cartoonSounds','realisticCamera','showFps'].forEach(k=>{if(typeof settings[k]!=='boolean')settings[k]=DEF[k];});
try{save();}catch(e){}
// Do not allow stale names from old tournament/UT saves to render as "undefined".
const _assignNamesV17=assignNames;
function safeNameV17(c,i){let candidate='';try{const t=c.tdef||sideTeam[c.team]||TEAMS[0];candidate=nameFor(t,c.role||'fw',Number.isFinite(c.lk)?c.lk:(i||0));}catch(e){}if(!candidate||/undefined|null/i.test(String(candidate))){const n=Math.abs(Number(c.num)||i||0);candidate=String(NM_FIRST[n%NM_FIRST.length]).charAt(0)+'. '+NM_SUR[(n*7+3)%NM_SUR.length];}return candidate;}
assignNames=function(){_assignNamesV17();cows.forEach((c,i)=>{if(!c.pname||/undefined|null/i.test(String(c.pname)))c.pname=safeNameV17(c,i);if(!Number.isFinite(Number(c.num))||Number(c.num)<1)c.num=20+i;});};
function fixCowNameV17(c,i){if(!c)return;if(!c.pname||/undefined|null/i.test(String(c.pname)))c.pname=safeNameV17(c,i);if(!Number.isFinite(Number(c.num))||Number(c.num)<1)c.num=20+(i||0);}
const _syncSceneNamesV17=syncScene;
syncScene=function(dt){cows.forEach(fixCowNameV17);_syncSceneNamesV17(dt);};
// Ambient weather follows the camera and is camera-relative, limited in amount, and wind-driven.
let _weatherCamX=null,_weatherCamZ=null,_fogPhaseV17=0,_lastEnvV17='';
const _applyEnvV17=applyEnv;
applyEnv=function(tod,weather){const out=_applyEnvV17(tod,weather);_weatherCamX=camera.position.x;_weatherCamZ=camera.position.z;_fogPhaseV17=0;_lastEnvV17=weather||settings.weather;return out;};
const _updateParticlesV17=updateParticles;
updateParticles=function(dt){
  _updateParticlesV17(dt);
  const cx=camera.position.x,cz=camera.position.z;
  if(_weatherCamX===null){_weatherCamX=cx;_weatherCamZ=cz;}
  const dx=clamp(cx-_weatherCamX,-8,8),dz=clamp(cz-_weatherCamZ,-8,8);_weatherCamX=cx;_weatherCamZ=cz;
  const intensity=clamp((Number(settings.weatherIntensity)||0)/100,0,1.5);
  const active=effParts()>0&&intensity>0;
  if(settings.powerSave){rainGeo.setDrawRange(0,Math.floor(RAIN_N*2*.28*intensity));snowGeo.setDrawRange(0,Math.floor(SNOW_N*.28*intensity));}
  if(rainLines.visible&&active){
    rainLines.material.opacity=clamp(.18+.22*intensity,.08,.46);
    for(let i=0;i<RAIN_N;i++){
      const q=i*6;rainPos[q]+=dx;rainPos[q+3]+=dx;rainPos[q+2]+=dz;rainPos[q+5]+=dz;
      const wind=0.22+0.17*Math.sin(clock*.025+i*.13);rainPos[q]-=wind*dt;rainPos[q+3]-=wind*dt;rainPos[q+2]+=.035*dt;rainPos[q+5]+=.035*dt;
      if(rainPos[q+1]<.05||Math.abs(rainPos[q]-cx)>55||Math.abs(rainPos[q+2]-cz)>36){const x=cx+(Math.random()-.5)*78,y=20+Math.random()*7,z=cz+(Math.random()-.5)*48;rainPos.set([x,y,z,x-.18,y-.8,z],q);}
    }
    rainGeo.attributes.position.needsUpdate=true;
  }
  if(snowPts.visible&&active){
    snowPts.material.opacity=clamp(.38+.35*intensity,.25,.92);snowPts.material.size=settings.powerSave ? 0.13 : 0.22;
    for(let i=0;i<SNOW_N;i++){
      const q=i*3; snowPos[q]+=dx+(.11*Math.sin(clock*.025+i*.73)+.12)*dt;snowPos[q+2]+=dz+.04*Math.cos(clock*.016+i*.31)*dt;snowPos[q+1]-=(.12+.09*Math.sin(i*.17)**2)*dt;
      if(snowPos[q+1]<.02||Math.abs(snowPos[q]-cx)>52||Math.abs(snowPos[q+2]-cz)>34){snowPos[q]=cx+(Math.random()-.5)*78;snowPos[q+1]=21+Math.random()*7;snowPos[q+2]=cz+(Math.random()-.5)*48;}
    }
    snowGeo.attributes.position.needsUpdate=true;
  }
  if(scene.fog&&curEnv.weather==='fog'&&!settings.powerSave){_fogPhaseV17+=dt;const baseNear=12,baseFar=68,mod=.045*Math.sin(_fogPhaseV17*.006);scene.fog.near=baseNear*(1+mod);scene.fog.far=baseFar*(1+mod)+Math.sin(_fogPhaseV17*.003)*2;}
};

const _buildCrowdScarvesV17=buildCrowdInstances;
buildCrowdInstances=function(root,E,outer,fill){
  _buildCrowdScarvesV17(root,E,outer,fill);
  if(!crowdInstData.length||settings.powerSave||gfxLevel()==='low'||(settings.stadiumDetail||'auto')==='low')return;
  const selected=crowdInstData.filter((d,i)=>i%3===0);if(!selected.length)return;
  const geo=new THREE.BoxGeometry(.29,.075,.235),mat=new THREE.MeshLambertMaterial({color:0xffffff}),mesh=new THREE.InstancedMesh(geo,mat,selected.length),obj=new THREE.Object3D(),col=new THREE.Color(),palette=[0xe63b3b,0x2b69ff,0xf4ce35,0x20b36b,0xf28b30,0xeceff4,0x9c50df];
  selected.forEach((d,i)=>{obj.position.set(d.x,d.y+.43,d.z);obj.rotation.set(0,(Math.random()-.5)*.22,0);obj.scale.set(d.scale,d.scale,d.scale);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);col.setHex(palette[(Math.random()*palette.length)|0]);mesh.setColorAt(i,col);});
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;root.add(mesh);root.userData.own.push(geo,mat);
};

// Music/audio starts only after the first trusted user gesture, so browser autoplay policy cannot leave it permanently silent.
let _audioGestureReadyV17=false;
const _wakeAudioV17=()=>{if(_audioGestureReadyV17)return;_audioGestureReadyV17=true;try{Audio_.init();if(Audio_.ctx&&Audio_.ctx.state==='suspended')Audio_.ctx.resume();syncMusic();}catch(e){}};
document.addEventListener('pointerdown',_wakeAudioV17,{once:true,passive:true});
document.addEventListener('touchstart',_wakeAudioV17,{once:true,passive:true});
document.addEventListener('keydown',_wakeAudioV17,{once:true});
const _audioCrowdV17=Audio_.crowd.bind(Audio_);
Audio_.crowd=function(level){return _audioCrowdV17(settings.stadiumSound?level:0);};
const _audioSwellV17=Audio_.swell.bind(Audio_);
Audio_.swell=function(level,duration){if(settings.stadiumSound)return _audioSwellV17(level,duration);};
const _realCrowdV17=RealSnd.crowd.bind(RealSnd);
RealSnd.crowd=function(level){return _realCrowdV17(settings.stadiumSound?level:0);};
const _anthemV17=SFX.anthem;
SFX.anthem=function(){if(settings.anthemEnabled&&_anthemV17)_anthemV17();};
const _musicPlayV17=Audio_.music.play.bind(Audio_.music);
Audio_.music.play=function(which){if(which==='match'&&!settings.anthemEnabled){Audio_.music.stop();return;}return _musicPlayV17(which);};

// ================= Cowball v44: original external music + sound assets =================
const CowballAssetAudioV44 = (() => {
  const musicFiles = {
    pasture:'pasture.mp3', moo:'moo-groove.mp3', sunset:'sunset.mp3', pulse:'rush.mp3',
    spotlight:'sunset.mp3', afterglow:'sunset.mp3', cup:'cup-march.mp3', road:'cup-march.mp3',
    grand:'grand-finale.mp3', velocity:'rush.mp3', rise:'sunset.mp3', victory:'grand-finale.mp3',
    anthem:'grand-finale.mp3', rush:'rush.mp3', night:'cup-march.mp3'
  };
  const sfxFiles = {
    'ball-impact':'ball-impact.mp3','ball-pass':'ball-pass.mp3','net-hit':'net-hit.mp3',
    'referee-whistle':'referee-whistle.mp3','crowd-cheer':'crowd-cheer.mp3','ui-click':'ui-click.mp3',
    'cow-moo':'cow-moo.mp3','goal-fanfare':'goal-fanfare.mp3'
  };
  const musicBase = '', sfxBase = '';
  let currentMusic = null, currentMusicPath = '', currentMode = 'menu', currentMusicId = '';
  let crowdLoop = null, clipPools = Object.create(null), clipIndex = Object.create(null);
  let retiringMusic = null;
  const url = (base, name) => new URL(base + name, document.baseURI).href;
  const nvol = (key, fallback=70) => { const v=Number(settings[key]); return clamp((Number.isFinite(v)?v:fallback)/100,0,1); };
  // Approximate per-track loudness trims measured from the supplied masters. This avoids
  // abrupt perceived jumps between themes without re-encoding or damaging source MP3s.
  const musicTrim = {
    pasture:1.11, moo:0.83, sunset:0.95, spotlight:0.95, afterglow:0.95, rise:0.95,
    pulse:0.60, rush:0.60, velocity:0.60,
    cup:0.62, road:0.62, night:0.62,
    grand:0.64, victory:0.64, anthem:0.64
  };
  // Preload the small effects set quietly so the first kick/whistle is not delayed by a fetch.
  try { Object.entries(sfxFiles).forEach(([name,file]) => { clipPools[name]=Array.from({length:3},()=>{const a=new Audio(url(sfxBase,file));a.preload='auto';return a;});clipIndex[name]=0; }); } catch (_) {}
  const master = () => nvol('vMaster',80);
  function musicVolume(trackId) { return clamp(master()*nvol('vMusic',55)*0.92*(musicTrim[trackId]||1),0,1); }
  function applyTrackVolume(a) {
    if (!a) return;
    const trackId = a._cowballTrackId || currentMusicId;
    const fade = Number.isFinite(a._cowballFadeLevel) ? a._cowballFadeLevel : 1;
    try { a.volume = clamp(musicVolume(trackId)*fade,0,1); } catch (_) {}
  }
  function updateVolumes() {
    if (currentMusic) applyTrackVolume(currentMusic);
    if (retiringMusic) applyTrackVolume(retiringMusic);
    if (crowdLoop) crowdLoop.volume = settings.stadiumSound ? clamp(master()*nvol('vCrowd',60)*crowdLoop.dataset.level*0.78,0,1) : 0;
  }
  function disposeTrack(a) {
    if (!a) return;
    if (a._cowballFadeTimer) { clearInterval(a._cowballFadeTimer); a._cowballFadeTimer=0; }
    try { a.pause(); a.currentTime=0; } catch (_) {}
  }
  function fadeTrack(a, target, duration, done) {
    if (!a) { if(done)done(); return; }
    if (a._cowballFadeTimer) { clearInterval(a._cowballFadeTimer); a._cowballFadeTimer=0; }
    const startLevel = Number.isFinite(a._cowballFadeLevel) ? a._cowballFadeLevel : 1;
    const startTime = performance.now(), span = Math.max(0,Number(duration)||0);
    if (span<=0) {
      a._cowballFadeLevel=target; applyTrackVolume(a);
      if (done) done(); return;
    }
    a._cowballFadeTimer=setInterval(()=>{
      const progress=clamp((performance.now()-startTime)/span,0,1);
      const eased=progress*progress*(3-2*progress);
      a._cowballFadeLevel=startLevel+(target-startLevel)*eased;
      applyTrackVolume(a);
      if(progress>=1){clearInterval(a._cowballFadeTimer);a._cowballFadeTimer=0;a._cowballFadeLevel=target;applyTrackVolume(a);if(done)done();}
    },20);
  }
  function stopTrack(fadeMs=0) {
    // Keep no more than one old theme alive during a crossfade, even on rapid menu clicks.
    if (retiringMusic) { disposeTrack(retiringMusic); retiringMusic=null; }
    const previous=currentMusic;
    currentMusic=null; currentMusicPath=''; currentMusicId='';
    if (!previous) return;
    if (fadeMs>0) {
      retiringMusic=previous;
      fadeTrack(previous,0,fadeMs,()=>{disposeTrack(previous);if(retiringMusic===previous)retiringMusic=null;});
    } else disposeTrack(previous);
  }
  function playTrack(mode, trackId, onFailure) {
    const file=musicFiles[trackId]; if(!file) return false;
    const path=url(musicBase,file);
    if(currentMusicPath===path && currentMusic) {
      updateVolumes();
      if(currentMusic.paused) {
        const a=currentMusic; a._cowballFadeLevel=0;
        const p=a.play();
        if(p&&typeof p.then==='function') p.then(()=>{if(currentMusic===a)fadeTrack(a,1,420);}).catch(()=>{if(currentMusic!==a)return;stopTrack();if(onFailure)onFailure();});
        else fadeTrack(a,1,420);
      }
      return true;
    }
    stopTrack(560); currentMode=mode; currentMusicId=trackId; currentMusicPath=path;
    try {
      const a=new Audio(path); a.preload='auto'; a.loop=true; a.volume=0; a.playsInline=true;
      a._cowballTrackId=trackId; a._cowballFadeLevel=0;
      currentMusic=a;
      const fail=()=>{ if(currentMusic!==a)return; stopTrack(); if(onFailure)onFailure(); };
      a.addEventListener('error',fail,{once:true});
      const p=a.play();
      if(p&&typeof p.then==='function') p.then(()=>{if(currentMusic===a)fadeTrack(a,1,720);}).catch(fail);
      else fadeTrack(a,1,720);
      return true;
    } catch (_) { stopTrack(); return false; }
  }
  function playSfx(name, strength=1, setting='vSfx', fallback=null) {
    const file=sfxFiles[name]; if(!file) { if(fallback)fallback(); return false; }
    const volume=clamp(master()*nvol(setting, setting==='vBall'?80:85)*Number(strength||0),0,1);
    if(volume<=0.002) return true;
    try {
      let pool=clipPools[name]; if(!pool) {
        pool=clipPools[name]=Array.from({length:3},()=>{const a=new Audio(url(sfxBase,file));a.preload='auto';return a;}); clipIndex[name]=0;
      }
      const i=clipIndex[name]++%pool.length, a=pool[i];
      a.volume=volume; try{a.currentTime=0;}catch(_){}
      let failed=false; const fail=()=>{if(failed)return;failed=true;if(fallback)fallback();};
      a.addEventListener('error',fail,{once:true});
      const p=a.play(); if(p&&p.catch)p.catch(fail);
      return true;
    } catch (_) { if(fallback)fallback(); return false; }
  }
  function crowd(level=0) {
    if(!settings.stadiumSound) level=0;
    level=clamp(Number(level)||0,0,1);
    if(!crowdLoop) { try { crowdLoop=new Audio(url(sfxBase,'stadium-ambience.mp3')); crowdLoop.loop=true; crowdLoop.preload='auto'; crowdLoop.volume=0; crowdLoop.dataset.level='0'; } catch(_) { return; } }
    crowdLoop.dataset.level=String(level); updateVolumes();
    if(level<0.015) { try{crowdLoop.pause();}catch(_){} return; }
    if(crowdLoop.paused) { const p=crowdLoop.play(); if(p&&p.catch)p.catch(()=>{}); }
  }
  function cheer(level=0.5) { if(settings.stadiumSound) playSfx('crowd-cheer',clamp(Number(level)||0.5,.2,1),'vCrowd'); }
  return {playTrack,stopTrack,playSfx,crowd,cheer,updateVolumes,active:()=>!!currentMusic&&!currentMusic.paused,isTrack:id=>!!currentMusic&&!currentMusic.paused&&currentMusicId===id};
})();
const _musicPlayAssetBaseV44=Audio_.music.play.bind(Audio_.music);
const _musicStopAssetBaseV44=Audio_.music.stop.bind(Audio_.music);
const _audioVolumeAssetBaseV44=Audio_.applyVolumes.bind(Audio_);
let _musicModeV44='',_musicTrackV44='',_musicSynthActiveV44=false;
Audio_.music.play=function(which){
  if(!settings.musicEnabled||(which==='match'&&!settings.anthemEnabled)){Audio_.music.stop();return;}
  const slot=which==='match'?'musicMatch':which==='tour'?'musicTour':'musicMenu';
  const fallback=which==='match'?'anthem':which==='tour'?'cup':'sunset';
  const trackId=MUSIC_LIBRARY[settings[slot]]?settings[slot]:fallback;
  if(_musicModeV44===which&&_musicTrackV44===trackId&&(_musicSynthActiveV44||CowballAssetAudioV44.isTrack(trackId))){
    CowballAssetAudioV44.updateVolumes(); return;
  }
  _musicStopAssetBaseV44();
  _musicModeV44=which;_musicTrackV44=trackId;_musicSynthActiveV44=false;
  // Keep the existing song position when the menu re-syncs after ordinary button clicks.
  const fallbackToSynth=()=>{if(_musicModeV44!==which||_musicTrackV44!==trackId)return;_musicSynthActiveV44=true;try{_musicPlayAssetBaseV44(which);}catch(_){}};
  const ok=CowballAssetAudioV44.playTrack(which,trackId,fallbackToSynth);
  if(!ok){fallbackToSynth();return;}
};
Audio_.music.stop=function(){
  _musicModeV44='';_musicTrackV44='';_musicSynthActiveV44=false;
  CowballAssetAudioV44.stopTrack(180);return _musicStopAssetBaseV44();
};
Audio_.applyVolumes=function(){_audioVolumeAssetBaseV44();CowballAssetAudioV44.updateVolumes();};
const _crowdAmbientBaseV44=Audio_.crowd.bind(Audio_);
Audio_.crowd=function(level){const r=_crowdAmbientBaseV44(settings.stadiumSound?level:0);CowballAssetAudioV44.crowd(settings.stadiumSound?level:0);return r;};
const _crowdSwellBaseV44=Audio_.swell.bind(Audio_);
Audio_.swell=function(level,duration){const r=settings.stadiumSound?_crowdSwellBaseV44(level,duration):undefined;if(settings.stadiumSound)CowballAssetAudioV44.cheer(level);return r;};
const _sfxFallbackV44={kick:SFX.kick,pass:SFX.pass,shot:SFX.shot,receive:SFX.receive,net:SFX.net,goal:SFX.goal,whistle:SFX.whistle,ui:SFX.ui,back:SFX.back,moo:SFX.moo,anthem:SFX.anthem};
SFX.kick=(p,pan)=>CowballAssetAudioV44.playSfx('ball-impact',clamp(.55+(Number(p)||.4)*.35,0,1),'vBall',()=>_sfxFallbackV44.kick&&_sfxFallbackV44.kick(p,pan));
SFX.shot=(p,pan)=>CowballAssetAudioV44.playSfx('ball-impact',clamp(.7+(Number(p)||.6)*.3,0,1),'vBall',()=>_sfxFallbackV44.shot&&_sfxFallbackV44.shot(p,pan));
SFX.pass=(p,pan)=>CowballAssetAudioV44.playSfx('ball-pass',clamp(.5+(Number(p)||.4)*.4,0,1),'vBall',()=>_sfxFallbackV44.pass&&_sfxFallbackV44.pass(p,pan));
SFX.receive=pan=>CowballAssetAudioV44.playSfx('ball-pass',.45,'vBall',()=>_sfxFallbackV44.receive&&_sfxFallbackV44.receive(pan));
SFX.net=(pan,speed)=>CowballAssetAudioV44.playSfx('net-hit',clamp(.55+(Number(speed)||4)/28,.4,1),'vGoal',()=>_sfxFallbackV44.net&&_sfxFallbackV44.net(pan,speed));
SFX.goal=pan=>CowballAssetAudioV44.playSfx('goal-fanfare',.85,'vGoal',()=>_sfxFallbackV44.goal&&_sfxFallbackV44.goal(pan));
SFX.whistle=len=>CowballAssetAudioV44.playSfx('referee-whistle',clamp((Number(len)||.45)/.6,.3,1),'vWhistle',()=>_sfxFallbackV44.whistle&&_sfxFallbackV44.whistle(len));
SFX.ui=()=>CowballAssetAudioV44.playSfx('ui-click',.75,'vSfx',()=>_sfxFallbackV44.ui&&_sfxFallbackV44.ui());
SFX.back=()=>CowballAssetAudioV44.playSfx('ui-click',.45,'vSfx',()=>_sfxFallbackV44.back&&_sfxFallbackV44.back());
SFX.moo=(...args)=>CowballAssetAudioV44.playSfx('cow-moo',.7,'vSfx',()=>_sfxFallbackV44.moo&&_sfxFallbackV44.moo(...args));
SFX.anthem=()=>{if(settings.anthemEnabled)CowballAssetAudioV44.playSfx('goal-fanfare',.42,'vGoal',()=>_sfxFallbackV44.anthem&&_sfxFallbackV44.anthem());};
// Keep external assets quiet on tab switches and restore full music level on return.
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(CowballAssetAudioV44.active())Audio_.music.stop();CowballAssetAudioV44.crowd(0);}else{if(settings.stadiumSound&&state!=='menu')CowballAssetAudioV44.crowd(.25);if(state==='menu')syncMusic();}});

// Avoid the commentary strip blocking play and enforce a real-time cooldown even on forced lines.
const _sayV17=say;let _sayWallV17=0;
say=function(key,force){const now=performance.now();if(now-_sayWallV17<3600)return;_sayV17(key,force);const el=$('commentary');if(el&&el.classList.contains('on'))_sayWallV17=now;};

let _cartoonAudioCtxV17=null;
function cartoonBeepV17(final){
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return; if(!_cartoonAudioCtxV17)_cartoonAudioCtxV17=new AC();const ctx=_cartoonAudioCtxV17;if(ctx.state==='suspended')ctx.resume();const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(final?880:440,t);if(final)o.frequency.exponentialRampToValueAtTime(660,t+.28);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(clamp(settings.vSfx/100,0,1)*.07,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+(final?.32:.12));o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+(final?.34:.14));}catch(e){}
}
SFX.beep=function(final){if(settings.cartoonSounds){cartoonBeepV17(!!final);return;}if(final)RealSnd.whistle(.23,0);else RealSnd.click(0);};

// Human restart workflow. No timeout auto-kicks the ball: the designated taker walks into position and the human chooses the action.
let restartStateV17=null;
function setRestartStateV17(type,team,x,y,reason,offender){
  const spotX=clamp(Number.isFinite(x)?x:ball.x,FX+CR,FX+FW-CR),spotY=type==='throwin'?clamp(Number.isFinite(y)?y:ball.y,FY+1,FY+FH-1):clamp(Number.isFinite(y)?y:ball.y,FY+CR,FY+FH-CR);
  ruleModalState={type,team,x:spotX,y:spotY,reason,offender};offsidePhase=null;
  ball.carrier=null;ball.holder=null;ball.vx=ball.vy=ball.vh=0;ball.h=0;ball.curve=0;ball.crossT=0;ball.x=spotX;ball.y=spotY;
  cows.forEach(c=>{c.vx=0;c.vy=0;c.wait=0;c.freeze=0;c.restartHomeV17={x:c.x,y:c.y};});resetInputs();
  const human=players.find(p=>p.team===team),list=cows.filter(c=>c.team===team&&!c.dismissed);
  let taker=human&&human.cow&&!human.cow.dismissed?human.cow:null;
  if(!taker){const prefersGK=type==='goalkick';taker=list.filter(c=>prefersGK?c.role==='gk':c.role!=='gk').sort((a,b)=>Math.hypot(a.x-spotX,a.y-spotY)-Math.hypot(b.x-spotX,b.y-spotY))[0]||list[0];}
  if(human&&taker)setActive(human,taker);
  restartStateV17={type,team,x:spotX,y:spotY,reason,human,taker,action:null,prevKick:false,charge:0,wait:0,skipWalk:false};
  SFX.whistle((type==='goalkick'||type==='corner')?0.34:0.25);Audio_.crowd(.18);say(type==='offside'?'foul':'tackle',true);setState('rule');applyUIState();
}
const _cbShowRestartDefaultV17=cbShowRestart;
cbShowRestart=function(type,team,x,y,reason,offender=null){if(state!=='play'||ruleModalState)return;if(type==='throwin'||type==='corner'||type==='goalkick'){setRestartStateV17(type,team,x,y,reason,offender);return;}_cbShowRestartDefaultV17(type,team,x,y,reason,offender);};
function stepRestart(dt){
  const r=restartStateV17;if(!r||!ruleModalState){state='play';return;}
  clock+=dt;const team=r.team,dir=team===0?1:-1;
  cows.forEach(c=>{if(c!==r.taker){c.vx=0;c.vy=0;if(c.restartHomeV17){c.x=lerp(c.x,c.restartHomeV17.x,Math.min(1,.045*dt));c.y=lerp(c.y,c.restartHomeV17.y,Math.min(1,.045*dt));}}});
  const p=r.human;let inp={x:0,y:0,kick:false,pass:false,cross:false,sprint:false,sw:false};
  if(p){inp=gather(p);handleSwitch(p,inp,dt);if(p.cow&&!p.cow.dismissed)r.taker=p.cow;}
  let c=r.taker;if(!c||c.dismissed){c=cows.filter(q=>q.team===team&&!q.dismissed&&(r.type==='goalkick'?q.role==='gk':q.role!=='gk')).sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y))[0];r.taker=c;if(p&&c)setActive(p,c);}
  if(!c){return;}
  const tx=clamp(r.x-dir*(CR+BR+7),FX+CR,FX+FW-CR),ty=clamp(r.y,FY+CR,FY+FH-CR);if(r.skipWalk){c.x=tx;c.y=ty;c.vx=c.vy=0;c.ang=team===0?0:Math.PI;c.kickAnim=0;r.skipWalk=false;}const dist=Math.hypot(tx-c.x,ty-c.y);
  if(p){
    if(inp.kick&&!r.prevKick){r.charge=0;}
    if(inp.kick)r.charge=Math.min(1.5,r.charge+dt/50);
    if(r.prevKick&&!inp.kick)r.action={kind:'shot',power:lerp(6.8,17,Math.max(.06,clamp(r.charge,0,1)))};
    if(inp.pass&&!r.prevPass)r.action={kind:'pass'};
    if(inp.cross&&!r.prevCross)r.action={kind:'cross'};
    r.prevKick=inp.kick;r.prevPass=inp.pass;r.prevCross=inp.cross;
  }else r.wait+=dt;
  let mx=inp.x||0,my=inp.y||0,m=Math.hypot(mx,my);
  if(p&&m>.12){mx/=Math.max(1,m);my/=Math.max(1,m);}
  else {mx=tx-c.x;my=ty-c.y;m=Math.hypot(mx,my)||1;mx/=m;my/=m;}
  if(p&&Math.hypot(inp.x,inp.y)>.12){const speed=1.8;c.x=clamp(c.x+inp.x*speed*dt,FX+CR,FX+FW-CR);c.y=clamp(c.y+inp.y*speed*dt,FY+CR,FY+FH-CR);c.vx=inp.x*speed;c.vy=inp.y*speed;c.ang=Math.atan2(-inp.y,inp.x);c.kickAnim=0;}
  else if(dist>CR+BR+8){const speed=p?1.85:2.15,step=Math.min(dist,speed*dt);c.x=clamp(c.x+mx*step,FX+CR,FX+FW-CR);c.y=clamp(c.y+my*step,FY+CR,FY+FH-CR);c.vx=mx*speed;c.vy=my*speed;c.ang=Math.atan2(-my,mx);c.kickAnim=0;}
  else{c.x=lerp(c.x,tx,.24);c.y=lerp(c.y,ty,.24);c.vx=c.vy=0;c.ang=Math.atan2(-(r.y-c.y),r.x-c.x);}
  const near=Math.hypot(c.x-tx,c.y-ty)<CR+BR+12;
  if(!p&&near&&r.wait>16){r.action={kind:r.type==='corner'?'cross':'pass'};}
  if(!r.action||!near)return;
  let ax=inp.x||0,ay=inp.y||0;if(Math.hypot(ax,ay)<.15){ax=dir;ay=r.type==='corner'?(r.y<H/2?1:-1):clamp((H/2-r.y)/160,-.65,.65);}
  const mag=Math.hypot(ax,ay)||1;ax/=mag;ay/=mag;
  ball.x=c.x+ax*(CR+BR+3);ball.y=c.y+ay*(CR+BR+3);ball.h=ball.vh=0;ball.holder=null;ball.carrier=c;lastTouch=c;ruleIgnoreOffsideUntil=clock+28;
  const action=r.action.kind;
  if(action==='pass'||action==='cross'){
    const ok=doPass(c,ax,ay,false,action==='cross');
    if(!ok){const [dx,dy]=norm(ax,ay);kickBall(c,dx,dy,action==='cross'?10.5:7.6,'pass',0);}
  }else{const [dx,dy]=kickDir(c,ax,ay);kickBall(c,dx,dy,r.action.power||9.5,'shot',0);}
  r.action=null;ruleModalState=null;restartStateV17=null;cows.forEach(q=>{q.wait=Math.max(q.wait||0,4);delete q.restartHomeV17;});setState('play');say('pass');
}
const _applyUIStateV17=applyUIState;
applyUIState=function(){_applyUIStateV17();if(state==='rule'&&restartStateV17){if(screen)setScreen(null);$('hud').classList.remove('hide');$('tbtns').classList.toggle('hide',!touchUIOn());$('skipTag').classList.add('hide');$('replayTag').classList.add('hide');$('fps').classList.toggle('hide',!settings.showFps);}};
// Tap anywhere during a restart to skip the slow walk-in; the ball still waits for the player's pass/shot input.
document.addEventListener('pointerdown',function(e){if(state==='rule'&&restartStateV17){restartStateV17.skipWalk=true;}},{passive:true});

// Existing main loop is kept, with one branch added for the live restart phase.


// ================== v19: просторное поле, карьера и музей трофеев ==================
let fieldStageRootV19 = null;
function fieldScaleForRosterV19(size){ return Number(size)===3 ? 1.0 : Number(size)===5 ? 1.55 : Number(size)===11 ? 1.95 : 1.0; }
function applyFieldScaleV19(size){ fieldVisualScale=fieldScaleForRosterV19(size); W=800*fieldVisualScale;H=450*fieldVisualScale;FX=20*fieldVisualScale;FY=10*fieldVisualScale;FW=760*fieldVisualScale;FH=430*fieldVisualScale;GH=150*fieldVisualScale;PSPOT=696*fieldVisualScale;PGX=FX+FW;if(fieldStageRootV19)fieldStageRootV19.scale.setScalar(fieldVisualScale); }
function cbInstallFieldStageV19(){
  if(fieldStageRootV19)return;
  fieldStageRootV19=new THREE.Group(); fieldStageRootV19.name='CowballAdaptivePitchStage'; scene.add(fieldStageRootV19);
  const skip=new Set([skyDome,stars,ballMesh,ballShadow,rainLines,snowPts,confetti,fireworks,trailPts,grassPool.points,sparkPool.points]);
  markers.forEach(m=>{skip.add(m.r);skip.add(m.a);}); rings.forEach(r=>skip.add(r.m));
  cows.forEach(c=>{skip.add(c.g);skip.add(c.shadow);});
  Array.from(scene.children).forEach(o=>{
    if(o===fieldStageRootV19||skip.has(o)||o.userData?.fieldDynamic||o.isPoints||o.isSprite) return;
    fieldStageRootV19.add(o);
  });
  fieldStageRootV19.scale.set(1,1,1);
}
const _buildMatchFieldV19=buildMatch;
buildMatch=function(cfg){applyFieldScaleV19(cfg&&cfg.size);return _buildMatchFieldV19(cfg);};
const _buildStandsFieldV19=buildStands;
buildStands=function(){
  if(standRoot&&fieldStageRootV19&&standRoot.parent===fieldStageRootV19)fieldStageRootV19.remove(standRoot);
  else if(standRoot&&fieldStageRootV19&&standRoot.parent===scene)scene.remove(standRoot);
  const r=_buildStandsFieldV19();
  if(fieldStageRootV19&&standRoot&&standRoot.parent!==fieldStageRootV19)fieldStageRootV19.add(standRoot);
  if(fieldStageRootV19)fieldStageRootV19.scale.setScalar(fieldVisualScale);
  return r;
};
// Country-specific trophies are earned, stored with the profile, and never require a server.
const COUNTRY_CUPS_V19={
  AZE:['Кубок Полумесяца','🌙',0x00a3dd],BRA:['Золотой кубок Карнавала','🌟',0xffdf00],ENG:['Королевский кубок','👑',0xd71920],
  GER:['Стальной кубок','🛡️',0x111111],ESP:['Солнечный кубок','☀️',0xffd43b],FRA:['Триколорный кубок','🔵',0x173f8a],
  ITA:['Кубок лазурного берега','🌊',0x0877b9],ARG:['Серебряный кубок Пампасов','☁️',0x75c9ed],POR:['Кубок Атлантики','🌿',0xc51e32],
  NED:['Оранжевый кубок','🟠',0xf36c21],JPN:['Кубок восходящего солнца','🌅',0x173d8a],CRO:['Кубок шахматной доски','♟️',0xd71920],
  URU:['Кубок небесного берега','🩵',0x70c7ed],MAR:['Кубок Атласа','⭐',0xc1272d],KOR:['Кубок тигриного духа','🐯',0xcd2e3a],USA:['Кубок звёзд','⭐',0x17468a]
};
function trophyDescriptorV19(type,team){
  const cc=team&&team.nation?COUNTRY_CUPS_V19[team.code]:null;
  if(cc)return {name:cc[0],icon:cc[1],color:cc[2],country:team.name,flag:team.flag||'🏳️'};
  const meta=COMPS[type]||{name:'Турнир Cowball',icon:'🏆'};
  return {name:type==='world'?'Кубок чемпионов мира':meta.name,icon:meta.icon||'🏆',color:team&&team.c1||0xffd24a,country:team&&team.nation?team.name:'Cowball',flag:team&&team.flag||'🏆'};
}
function awardCupV19(c){
  if(!c||!c.done||!c.champion||c.champion!==c.my||c.trophyAwarded)return false;
  c.trophyAwarded=true; const winner=teamById(c.champion),d=trophyDescriptorV19(c.type,winner);
  const item={id:'cup_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),type:c.type,name:d.name,icon:d.icon,color:d.color,country:d.country,flag:d.flag,team:winner?winner.name:'Клуб',date:new Date().toLocaleDateString('ru-RU'),season:settings.career&&c.type==='league'?settings.career.season:null};
  settings.trophyCabinet.unshift(item); settings.trophyCabinet=settings.trophyCabinet.slice(0,100);
  if(!Array.isArray(settings.trophies))settings.trophies=[]; if(!settings.trophies.includes(c.type))settings.trophies.push(c.type);
  save(); return true;
}
function recordCareerSeasonV19(c){
  const ca=settings.career;if(!ca||!c||c.type!=='league'||ca.clubId!==c.my||!c.done||ca.recordedSeason===ca.season)return;
  const row=(compStandings(c,'L')||[]).find(x=>x.id===c.my)||{pts:0};
  ca.points=(ca.points||0)+row.pts;ca.history=Array.isArray(ca.history)?ca.history:[];
  ca.history.unshift({season:ca.season,club:teamById(c.my)?.name||c.my,place:(compStandings(c,'L').findIndex(x=>x.id===c.my)+1)||1,points:row.pts,champion:c.champion===c.my});
  ca.history=ca.history.slice(0,20);if(c.champion===c.my)ca.titles=(ca.titles||0)+1;ca.recordedSeason=ca.season;save();
}
const _finishCompV19=finishComp;
finishComp=function(ures){_finishCompV19(ures);if(comp&&comp.done){recordCareerSeasonV19(comp);if(awardCupV19(comp)){if(screen==='hub')renderHub();}}};
const _oldRenderHomeV19=renderHome;
renderHome=function(){_oldRenderHomeV19();const el=$('wins');if(el)el.textContent=`Побед: ${settings.wins} · Матчей: ${settings.played} · Голов: ${settings.goals} · Трофеев: ${settings.trophyCabinet.length}`;};
const _stepOutroFieldV19=stepOutro;
stepOutro=function(dt){_stepOutroFieldV19(dt);const finalCup=state==='outro'&&outroT>=340&&outroWinner===0&&matchCfg&&matchCfg.comp&&matchCfg.ko&&comp&&comp.rounds[comp.cur]&&comp.rounds[comp.cur].name==='Финал';trophyPropV19.visible=!!finalCup;if(finalCup){trophyPropV19.position.set(0,.06,0);trophyPropV19.rotation.y=Math.sin(clock*.025)*.14;const win=sideTeam[0];cupBaseV19.material.color.setHex(win.c1||0xffd24a);cupBadgeV19.material.color.setHex(win.c2||0xffffff);}};
// Golden 3D trophy used during a cup final celebration.
const trophyPropV19=new THREE.Group();trophyPropV19.name='CowballCupPresentation';trophyPropV19.userData.fieldDynamic=true;
const trophyGoldV19=new THREE.MeshStandardMaterial({color:0xffd34d,metalness:.78,roughness:.24}),trophyDarkV19=new THREE.MeshStandardMaterial({color:0x8a6219,metalness:.65,roughness:.32});
const cupBaseV19=new THREE.Mesh(new THREE.CylinderGeometry(.42,.52,.17,10),trophyDarkV19);cupBaseV19.position.y=.12;trophyPropV19.add(cupBaseV19);
const cupStemV19=new THREE.Mesh(new THREE.CylinderGeometry(.14,.22,.48,10),trophyGoldV19);cupStemV19.position.y=.42;trophyPropV19.add(cupStemV19);
const cupBowlV19=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0,.56),new THREE.Vector2(.22,.56),new THREE.Vector2(.34,.68),new THREE.Vector2(.43,.98),new THREE.Vector2(.4,1.12),new THREE.Vector2(.28,1.06),new THREE.Vector2(.24,.82),new THREE.Vector2(.13,.72),new THREE.Vector2(0,.72)],20),trophyGoldV19);trophyPropV19.add(cupBowlV19);
[-1,1].forEach(side=>{const h=new THREE.Mesh(new THREE.TorusGeometry(.26,.055,8,18),trophyGoldV19);h.position.set(side*.39,.86,0);h.rotation.y=side*.16;trophyPropV19.add(h);});
const cupBadgeV19=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.035,8),trophyDarkV19);cupBadgeV19.position.set(0,.82,.405);cupBadgeV19.rotation.x=Math.PI/2;trophyPropV19.add(cupBadgeV19);
trophyPropV19.visible=false;scene.add(trophyPropV19);trophyPropV19.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
function trophyCabinetBodyV19(){
  const won=settings.trophyCabinet||[];const cards=won.map(t=>`<div class="cbFeatureCard" style="border-color:${hex(Number(t.color)||0xffd24a)}"><div style="font-size:35px">${t.icon||'🏆'} 🏆</div><b>${cbEsc(t.name||'Кубок Cowball')}</b><div class="cbFeatureStat">${cbEsc(t.team||'Чемпион')} · ${cbEsc(t.date||'')}<br>${cbEsc(t.country||'')}</div></div>`).join('');
  const nations=TEAMS.filter(t=>t.nation).map(t=>{const d=trophyDescriptorV19('world',t),got=won.some(w=>w.type==='world'&&w.team===t.name&&/Кубок|кубок/.test(w.name||''));return `<div class="cbFeatureCard" style="opacity:${got?1:.57};border-color:${hex(d.color)}"><div style="font-size:28px">${d.icon} ${t.flag||'🏳️'}</div><b>${cbEsc(d.name)}</b><div class="cbFeatureStat">${got?'✅ Получен':'🔒 Выиграй чемпионат мира за '+cbEsc(t.name)}</div></div>`;}).join('');
  return `<div class="cbFeatureStat">Трофеи сохраняются в этом браузере и не пропадают при закрытии игры.</div><h3>Твои награды (${won.length})</h3><div class="cbFeatureGrid">${cards||'<div class="cbFeatureCard">Пока нет трофеев. Выиграй кубок или турнир, чтобы открыть первую награду.</div>'}</div><h3>Национальные трофеи</h3><div class="cbFeatureGrid">${nations}</div><button class="mi" data-a="featureClose">Закрыть</button>`;
}
ACT.trophies=function(){cbOpenModal('trophies','Зал трофеев',trophyCabinetBodyV19());};
ACT.career=function(){
  if(settings.comp&&!settings.comp.done){comp=settings.comp;enterHub();return;}
  const pool=TEAMS.filter(t=>!t.nation&&!t.league);const ca=settings.career||{};const start=pool.some(t=>t.id===ca.clubId)?ca.clubId:(pool.some(t=>t.id===settings.myTeam)?settings.myTeam:(pool[0]&&pool[0].id));
  const opts=pool.map(t=>`<option value="${cbEsc(t.id)}" ${t.id===start?'selected':''}>${cbEsc(t.name)}</option>`).join('');
  cbOpenModal('career',utxT('Карьера клуба'),`<div class="cbFeatureStat">Выбери вымышленный клуб и пройди полноценный сезон из матчей лиги. Результаты и титулы сохраняются локально.</div><label for="careerClubV19">Клуб</label><select id="careerClubV19">${opts}</select>${ca.clubId?`<div class="cbFeatureCard">Сезон ${ca.season||0} · титулы: ${ca.titles||0} · очки за карьеру: ${ca.points||0}</div>`:''}<button class="mi pri" data-a="careerStart">${ca.season?'Начать следующий сезон':'Начать карьеру'}</button><button class="mi" data-a="careerHistory">История сезонов</button><button class="mi" data-a="featureClose">Закрыть</button>`);
};
ACT.careerStart=function(){const sel=$('careerClubV19'),id=sel&&sel.value,pool=TEAMS.filter(t=>!t.nation&&!t.league);if(!pool.some(t=>t.id===id))return;const prev=settings.career||{};settings.career={clubId:id,season:(prev.season||0)+1,titles:prev.titles||0,points:prev.points||0,history:prev.history||[],recordedSeason:prev.recordedSeason||0};settings.myTeam=id;comp=newComp('league',id);settings.comp=comp;save();cbCloseModal();hubTab=0;enterHub();};
ACT.careerHistory=function(){const ca=settings.career||{},hist=(ca.history||[]).map(h=>`<div class="cbFeatureCard"><b>Сезон ${h.season} · ${cbEsc(h.club)}</b><div class="cbFeatureStat">${h.champion?'🏆 Чемпион':('Место: '+h.place)} · ${h.points} очк.</div></div>`).join('');cbOpenModal('careerHistory','История карьеры',hist||'<p>Сезоны ещё не завершены.</p><button class="mi" data-a="featureClose">Закрыть</button>');};
const _simRoundV19=ACT.simround;ACT.simround=function(){_simRoundV19();if(comp&&comp.done){recordCareerSeasonV19(comp);if(awardCupV19(comp))renderHub();}};
const _simRestV19=ACT.simrest;ACT.simrest=function(){_simRestV19();if(comp&&comp.done){recordCareerSeasonV19(comp);if(awardCupV19(comp))renderHub();}};
// Arms are shown only during celebrations and handshakes, while retaining the blocky cow silhouettes.
const _syncSceneArmsV19=syncScene;
syncScene=function(dt){_syncSceneArmsV19(dt);cows.forEach(c=>{if(!c.arms)return;const showArms=(state==='goal'&&c.team===lastScorer)||(state==='outro'&&(outroGreet||(outroWinner>=0&&c.team===outroWinner)));c.arms.forEach(a=>{a.visible=c.role==='gk'||showArms;});});};

// v20: broaden localization coverage for dynamically created career/trophy/match UI.
const UTX_EXTRA_ROWS=[
['Карьера клуба','Club Career','Carrière du club','Carrera del club','Kulüp Kariyeri','Klub karyerası'],
['Зал трофеев','Trophy Room','Salle des trophées','Sala de trofeos','Kupa Odası','Kubok zalı'],
['Трофеи сохраняются в этом браузере и не пропадают при закрытии игры.','Trophies are saved in this browser and remain after closing the game.','Les trophées sont enregistrés dans ce navigateur.','Los trofeos se guardan en este navegador.','Kupalar bu tarayıcıda kaydedilir.','Kuboklar bu brauzerdə saxlanılır.'],
['Твои награды','Your trophies','Vos trophées','Tus trofeos','Kupaların','Kubokların'],
['Национальные трофеи','National trophies','Trophées nationaux','Trofeos nacionales','Ulusal kupalar','Milli kuboklar'],
['Пока нет трофеев. Выиграй кубок или турнир, чтобы открыть первую награду.','No trophies yet. Win a cup or tournament to earn your first award.','Aucun trophée pour le moment. Gagnez une coupe ou un tournoi.','Aún no hay trofeos. Gana una copa o torneo.','Henüz kupa yok. İlk ödül için kupa veya turnuva kazan.','Hələ kubok yoxdur. İlk mükafat üçün kubok və ya turnir qazan.'],
['Выиграй чемпионат мира за','Win the world championship for','Gagnez le championnat du monde avec','Gana el campeonato mundial con','Dünya şampiyonasını şu takımla kazan:','Dünya çempionatını bu komanda ilə qazan:'],
['Выбери вымышленный клуб и пройди полноценный сезон из матчей лиги. Результаты и титулы сохраняются локально.','Choose a fictional club and complete a full league season. Results and titles are saved locally.','Choisissez un club fictif et terminez une saison complète. Les résultats sont enregistrés localement.','Elige un club ficticio y completa una temporada. Los resultados se guardan localmente.','Kurgusal bir kulüp seç ve tam lig sezonunu tamamla. Sonuçlar kaydedilir.','Uydurma klub seç və tam liqa mövsümünü tamamla. Nəticələr yadda saxlanılır.'],
['Начать следующий сезон','Start next season','Commencer la saison suivante','Empezar la siguiente temporada','Sonraki sezonu başlat','Növbəti mövsümə başla'],
['Начать карьеру','Start career','Commencer la carrière','Empezar carrera','Kariyere başla','Karyeraya başla'],
['История сезонов','Season history','Historique des saisons','Historial de temporadas','Sezon geçmişi','Mövsüm tarixçəsi'],
['Сезоны ещё не завершены.','No seasons completed yet.','Aucune saison terminée.','Aún no hay temporadas terminadas.','Henüz sezon tamamlanmadı.','Hələ mövsüm tamamlanmayıb.'],
['Кубок Полумесяца','Crescent Cup','Coupe du Croissant','Copa de la Media Luna','Hilal Kupası','Aypara Kuboku'],
['Кубок Атлантики','Atlantic Cup','Coupe de l’Atlantique','Copa del Atlántico','Atlantik Kupası','Atlantik Kuboku'],
['Королевский кубок','Royal Cup','Coupe royale','Copa Real','Kraliyet Kupası','Kral Kuboku'],
['Полное время','Full Time','Fin du match','Final del partido','Maç sonu','Matçın sonu'],
['Аут','Throw-in','Touche','Saque de banda','Taç atışı','Aut'],
['Угловой','Corner','Corner','Córner','Korner','Künc zərbəsi'],
['Удар от ворот','Goal kick','Coup de pied de but','Saque de puerta','Kale vuruşu','Qapıdan zərbə'],
['Снег','Snow','Neige','Nieve','Kar','Qar'],['Дождь','Rain','Pluie','Lluvia','Yağmur','Yağış'],['Туман','Fog','Brouillard','Niebla','Sis','Duman'],
['Звуки стадиона','Stadium sounds','Ambiance du stade','Sonidos del estadio','Stadyum sesleri','Stadion səsləri'],
['Гимны','Anthems','Hymnes','Himnos','Marşlar','Himnlər'],['Мультяшные звуки','Cartoon sounds','Sons cartoon','Sonidos caricaturescos','Çizgi film sesleri','Cizgi film səsləri'],['Реалистичная камера','Realistic camera','Caméra réaliste','Cámara realista','Gerçekçi kamera','Realistik kamera']
];
for(const row of UTX_EXTRA_ROWS){if(!UTX_DICT[row[0]]){UTX_ROWS.push(row);UTX_DICT[row[0]]=row.slice(1);row.slice(1).forEach(v=>{if(v)UTX_FROM[v]=row[0];});}}
UTX_EXTRA_ROWS.forEach(row=>{if(!UTX_PARTIAL_ROWS.some(r=>r[0]===row[0]))UTX_PARTIAL_ROWS.push(row);});
// Translate newly generated modals and rerender them using the active locale.
const _cbOpenModalV20=cbOpenModal;
cbOpenModal=function(id,title,body){const out=_cbOpenModalV20(id,utxT(title),body);const el=$('cbFeatureModal');if(el)utxTranslateDOM(el);return out;};
// Avoid applying a second scale to field geometry: dimensions are already scaled in field coordinates.
if(fieldStageRootV19)fieldStageRootV19.scale.setScalar(fieldVisualScale);


// ===== Cowball v21: fullscreen, avatar, photo mode, achievements, radar, tutorial, split touch =====
const v21perf=SET_TABS.find(t=>t.id==='performance');
if(v21perf){v21perf.items.unshift({k:'minimapV21',label:'Мини-карта и радар',opts:onoff});}
const v21ctl=SET_TABS.find(t=>t.id==='ctl');
if(v21ctl){v21ctl.items.unshift({k:'oneButtonV21',label:'Управление одной кнопкой',opts:onoff},{k:'localTouchV21',label:'Раздельное сенсорное управление вдвоём',opts:onoff});}
const v21access=SET_TABS.find(t=>t.id==='accessibility');
if(v21access&&!v21access.items.some(x=>x.k==='commentaryVoiceV21'))v21access.items.push({k:'commentaryVoiceV21',label:'Голосовой комментатор',opts:onoff});
const v21style=document.createElement('style');v21style.textContent=`
#v21FullWrap{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:1200;display:flex;flex-direction:column;align-items:flex-end;gap:5px;pointer-events:none}
#v21Full{pointer-events:auto;min-width:44px;min-height:44px;padding:7px 11px;border:1px solid #ffffff36;border-radius:12px;background:#07101dd9;color:#fff;font:800 16px var(--f);box-shadow:0 6px 20px #0006;backdrop-filter:blur(8px)}
#v21HomeHint{display:none;max-width:210px;background:#07101de8;border:1px solid #ffffff2c;padding:6px 9px;border-radius:9px;font-size:11px;line-height:1.25;pointer-events:none;text-align:right}
#v21Radar{position:fixed;z-index:5;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));width:clamp(116px,18vw,180px);height:auto;aspect-ratio:16/9;top:calc(max(10px,env(safe-area-inset-top)) + 102px);bottom:auto;border:1px solid #ffffff70;border-radius:9px;background:#07130ed9;opacity:.84;pointer-events:none;display:none}
#v21Controls{position:fixed;inset:0;z-index:65;pointer-events:none;display:none}
#v21Controls .v21side{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));width:48%;display:flex;gap:5px;pointer-events:none}
#v21Controls .v21side.left{left:max(8px,env(safe-area-inset-left));justify-content:flex-start}
#v21Controls .v21side.right{right:max(8px,env(safe-area-inset-right));justify-content:flex-end}
#v21Controls .v21action{pointer-events:auto;touch-action:none;min-width:clamp(40px,8vw,60px);min-height:clamp(42px,8vw,60px);border-radius:50%;border:1px solid #ffffff80;background:#091526d9;color:white;font:900 clamp(10px,2vw,14px) var(--f);box-shadow:0 3px 10px #0007}
#v21Joy{position:fixed;z-index:64;width:110px;height:110px;margin:-55px 0 0 -55px;border:2px solid #ffffff70;border-radius:50%;background:#ffffff16;display:none;pointer-events:none}
#v21Joy:after{content:'';position:absolute;width:40px;height:40px;left:33px;top:33px;border-radius:50%;background:#ffffff70}
html[data-access=large] #v21Full{font-size:19px;min-height:52px}
@media(orientation:landscape) and (max-height:500px){#v21Controls .v21side{bottom:5px}#v21Controls .v21action{min-width:38px;min-height:38px}}
`;
document.head.appendChild(v21style);
const v21wrap=document.createElement('div');v21wrap.id='v21FullWrap';v21wrap.innerHTML='<button id="v21Full" aria-label="На весь экран">⛶</button><div id="v21HomeHint" aria-hidden="true"></div>';
document.body.appendChild(v21wrap);
const v21radar=document.createElement('canvas');v21radar.id='v21Radar';v21radar.width=320;v21radar.height=180;document.body.appendChild(v21radar);
const v21controls=document.createElement('div');v21controls.id='v21Controls';v21controls.innerHTML='<div class="v21side left"><button class="v21action" data-v21action="left-switch">СМЕНА</button><button class="v21action" data-v21action="left-pass">ПАС</button><button class="v21action" data-v21action="left-kick">УДАР</button><button class="v21action" data-v21action="left-sprint">РЫВОК</button></div><div class="v21side right"><button class="v21action" data-v21action="right-sprint">РЫВОК</button><button class="v21action" data-v21action="right-kick">УДАР</button><button class="v21action" data-v21action="right-pass">ПАС</button><button class="v21action" data-v21action="right-switch">СМЕНА</button></div>';
document.body.appendChild(v21controls);
const v21joy=document.createElement('div');v21joy.id='v21Joy';document.body.appendChild(v21joy);
let v21Fullscreen=false,v21JoyState={left:{id:null,x:0,y:0,ox:0,oy:0},right:{id:null,x:0,y:0,ox:0,oy:0}},v21TouchActions={left:{},right:{}},v21PhotoDrag=null,v21TutPage=0,v21RadarLast=0,v21AvatarCow=null;
const v21FsApi=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled||document.mozFullScreenEnabled||document.msFullscreenEnabled||document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.msRequestFullscreen);
function v21Resize(){try{resizeGL();if(typeof applyRes==='function')applyRes();}catch(e){} }
function v21FsState(){v21Fullscreen=!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement);$('v21Full').textContent=v21Fullscreen?'⤢':'⛶';$('v21Full').title=v21Fullscreen?'Выйти из полного экрана':'На весь экран';setTimeout(v21Resize,100);}
function v21FullscreenToggle(){
 const root=document.documentElement;let result;
 try{
   if(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement){result=(document.exitFullscreen&&document.exitFullscreen())||(document.webkitExitFullscreen&&document.webkitExitFullscreen())||(document.mozCancelFullScreen&&document.mozCancelFullScreen())||(document.msExitFullscreen&&document.msExitFullscreen());}
   else{const req=root.requestFullscreen||root.webkitRequestFullscreen||root.webkitRequestFullScreen||root.mozRequestFullScreen||root.msRequestFullscreen;if(!req){$('v21HomeHint').style.display='none';return;}result=req.call(root);if(window.screen&&window.screen.orientation&&window.screen.orientation.lock){try{window.screen.orientation.lock('landscape').catch(()=>{});}catch(e){}}}
   if(result&&result.catch)result.catch(()=>{$('v21HomeHint').style.display='none';});setTimeout(v21FsState,120);
 }catch(e){$('v21HomeHint').style.display='none';}
}
$('v21Full').addEventListener('click',v21FullscreenToggle);
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(ev=>document.addEventListener(ev,v21FsState));
window.addEventListener('resize',()=>{v21Resize();v21FsState();});
if(!v21FsApi()){$('v21Full').style.display='none';$('v21HomeHint').style.display='none';}
function v21SetControlVisibility(){const restartActive=state==='rule'&&!!restartStateV17&&!!ruleModalState;const gameplayState=['ready','play','goal','pens'].includes(state);const active=!!(settings.localTouchV21&&matchCfg&&matchCfg.versus&&(gameplayState||restartActive)&&!(state==='ready'&&introFull)&&touchUIOn());v21controls.style.display=active?'block':'none';const legacyControlsAllowed=touchUIOn()&&(gameplayState||restartActive)&&!(state==='ready'&&introFull);$('tbtns').classList.toggle('hide',active||!legacyControlsAllowed);const simplified=!!(settings.oneButtonV21&&matchCfg&& !matchCfg.versus&&touchUIOn()&&['ready','play','goal'].includes(state));['bPass','bSprint','bSwitch','bCross'].forEach(id=>{const el=$(id);if(el)el.style.display=simplified?'none':'';});if(simplified&&$('jbase'))$('jbase').style.display='none';v21radar.style.display=(settings.minimapV21&&!settings.powerSave&&['ready','play','goal','replay','outro'].includes(state))?'block':'none';const fsVisible=state==='menu'?screen==='home':['ready','play','goal','replay','paused','end','outro','pens'].includes(state)||restartActive;v21wrap.style.display=fsVisible?'flex':'none';v21wrap.style.top=state==='menu'?'max(10px,env(safe-area-inset-top))':'calc(max(10px,env(safe-area-inset-top)) + 48px)';}
function v21DrawRadar(now){if(now-v21RadarLast<75)return;v21RadarLast=now;if(v21radar.style.display==='none'||!v21radar.getContext)return;const c=v21radar.getContext('2d');if(!c)return;const w=v21radar.width,h=v21radar.height;c.clearRect(0,0,w,h);c.fillStyle='#133c27';c.fillRect(0,0,w,h);c.strokeStyle='#ffffff99';c.lineWidth=2;c.strokeRect(7,7,w-14,h-14);c.beginPath();c.moveTo(w/2,7);c.lineTo(w/2,h-7);c.stroke();c.beginPath();c.arc(w/2,h/2,h*.17,0,Math.PI*2);c.stroke();const px=x=>7+clamp((x-FX)/Math.max(1,FW),0,1)*(w-14),py=y=>7+clamp((y-FY)/Math.max(1,FH),0,1)*(h-14);const cb=(x,y,col,r)=>{c.fillStyle=col;c.beginPath();c.arc(px(x),py(y),r,0,Math.PI*2);c.fill();};
 if(cows&&cows.length){const passMate=cows.filter(z=>z.team===0&&z!== (players&&players[0]&&players[0].cow) &&z.g&&z.g.visible).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y))[0];cows.forEach(q=>{if(!q.g||!q.g.visible)return;let col=q.team===0?'#39b7ff':'#ff9b37';if(settings.accessProfile==='colorblind')col=q.team===0?'#56b4e9':'#e69f00';cb(q.x,q.y,col,3.7);if(q===passMate){c.strokeStyle='#f6ff69';c.lineWidth=2;c.beginPath();c.arc(px(q.x),py(q.y),7,0,Math.PI*2);c.stroke();}});}
 cb(ball.x,ball.y,'#ffffff',4.5);}
function v21SafeProfile(){const d=DEF.playerProfileV21||{};let a=settings.playerProfileV21;if(!a||typeof a!=='object')a=settings.playerProfileV21=Object.assign({},d);return a;}
function v21ApplyAvatar(){const a=v21SafeProfile();let c=(players&&players[0]&&players[0].cow)||null;if(!c||!c.g)return;if(v21AvatarCow!==c){if(v21AvatarCow){(v21AvatarCow.g||v21AvatarCow).traverse(o=>{if(o.isMesh&&o.userData.v21CoatMaterial){if(o.material&&o.material.dispose)o.material.dispose();o.material=matCow;o.userData.v21CoatMaterial=false;}});if(v21AvatarCow.v21Decor){v21AvatarCow.v21Decor.forEach(o=>{o.parent&&o.parent.remove(o);if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}}v21AvatarCow=c;c.v21Decor=[];c.g.traverse(o=>{if(o.isMesh&&o.material===matCow){o.material=matCow.clone();o.userData.v21CoatMaterial=true;}});const scarf=new THREE.Mesh(new THREE.BoxGeometry(.5,.13,.72),new THREE.MeshLambertMaterial({color:a.scarf}));scarf.position.set(.45,1.1,0);scarf.name='v21Scarf';c.body.add(scarf);c.v21Scarf=scarf;c.v21Decor.push(scarf);const horns=[];[-1,1].forEach(s=>{const h=new THREE.Mesh(new THREE.ConeGeometry(.105,.38,6),new THREE.MeshLambertMaterial({color:0xeee8dc}));h.position.set(.1,1.79,s*.30);h.rotation.z=s*.18;c.head.add(h);h.name='v21Horn';horns.push(h);c.v21Decor.push(h);});c.v21Horns=horns;}
 c.v21Decor&&c.v21Decor.forEach(o=>{if(o.name==='v21Horn')o.visible=!!a.horns;});if(c.v21Scarf){c.v21Scarf.visible=!!a.scarfOn;c.v21Scarf.material.color.set(a.scarf);}
 c.g.traverse(o=>{if(o.isMesh&&o.userData.v21CoatMaterial&&o.material&&o.material.color)o.material.color.set(a.coat);});
 const surname=String(a.surname||'PLAYER').toUpperCase().replace(/[^A-ZА-ЯЁ0-9 -]/g,'').slice(0,12);const num=clamp(+a.number||10,1,99);if(false){c.pname=surname;c.num=num;if(c.numberMesh){c.body.remove(c.numberMesh);if(c.numberTexture)c.numberTexture.dispose();c.numberMesh.geometry.dispose();c.numberMesh.material.dispose();c.numberMesh=null;c.numberTexture=null;}try{attachCowNumber(c);}catch(e){}c._v21Label=surname+'|'+num;}
}
function v21ProfileEditor(){const a=v21SafeProfile();cbOpenModal('playerProfileV21','Редактор внешности',`<div class="cbFeatureGrid"><div class="cbFeatureCard"><label>Цвет меха</label><input id="v21Coat" type="color" value="${a.coat}"></div><div class="cbFeatureCard"><label>Цвет шарфа</label><input id="v21Scarf" type="color" value="${a.scarf}"></div></div><label>Номер игрока</label><input id="v21Number" type="number" min="1" max="99" value="${a.number}"><label>Фамилия</label><input id="v21Surname" type="text" maxlength="12" value="${cbEsc(a.surname)}"><label>Любимое празднование</label><select id="v21Celebration">${['Прыжок','Вращение','Танец','Поклон','Указать на трибуны','Скольжение на коленях','Поднять руки','Командный жест'].map((n,i)=>`<option value="${i}" ${+a.celebration===i?'selected':''}>${n}</option>`).join('')}</select><label><input id="v21ScarfOn" type="checkbox" ${a.scarfOn?'checked':''}> Шарф</label><label><input id="v21Horns" type="checkbox" ${a.horns?'checked':''}> Дополнительные рога</label><button class="mi pri" data-a="v21ProfileSave">Сохранить внешний вид</button><p class="cbFeatureStat">Внешность применяется к управляемой корове и сохраняется на этом устройстве.</p>`);}
const v21Achievements=[{id:'match1',name:'Первый матч',desc:'Заверши первый матч',icon:'⚽',ok:()=>settings.played>=1},{id:'win1',name:'Первая победа',desc:'Выиграй матч',icon:'🥇',ok:()=>settings.wins>=1},{id:'goals10',name:'Бомбардир',desc:'Забей 10 голов',icon:'🎯',ok:()=>settings.goals>=10},{id:'wins5',name:'Серия побед',desc:'Добейся 5 побед',icon:'🔥',ok:()=>settings.wins>=5},{id:'cup1',name:'Обладатель кубка',desc:'Выиграй турнирный трофей',icon:'🏆',ok:()=>Array.isArray(settings.trophyCabinet)&&settings.trophyCabinet.length>0}];
function v21UnlockAchievements(){const arr=settings.achievementsV21||(settings.achievementsV21=[]);let changed=false;v21Achievements.forEach(a=>{if(a.ok()&&!arr.includes(a.id)){arr.push(a.id);changed=true;}});if(changed)save();}
function v21AchievementsModal(){v21UnlockAchievements();const unlock=settings.achievementsV21||[];cbOpenModal('achievementsV21','Достижения',`<p class="cbFeatureStat">Значки открываются автоматически и сохраняются вместе с прогрессом.</p><div class="cbFeatureGrid">${v21Achievements.map(a=>`<div class="cbFeatureCard" style="opacity:${unlock.includes(a.id)?1:.45}"><div style="font-size:32px">${a.icon}</div><b>${a.name}</b><div class="cbFeatureStat">${a.desc}</div><small>${unlock.includes(a.id)?'✅ Открыто':'🔒 Не открыто'}</small></div>`).join('')}</div><h3>Трофеи (${(settings.trophyCabinet||[]).length})</h3><button class="mi pri" data-a="trophies">Открыть полку трофеев</button><button class="mi" data-a="featureClose">Закрыть</button>`);}
function v21RecordsModal(){const rows=settings.localRecords||[];cbOpenModal('recordsV21','Локальные рекорды',`<div class="cbFeatureGrid"><div class="cbFeatureCard"><b>Матчи</b><div style="font-size:24px">${rows.length}</div></div><div class="cbFeatureCard"><b>Голы</b><div style="font-size:24px">${rows.reduce((n,r)=>n+(+r.goals||0),0)}</div></div><div class="cbFeatureCard"><b>Лучший счёт</b><div style="font-size:24px">${Math.max(0,...rows.map(r=>r.score?+r.score[0]||0:0))}</div></div></div>${rows.slice(0,25).map(r=>`<div class="cbFeatureCard"><b>${cbEsc(r.a||'Команда')} ${r.score&&r.score[0]||0} : ${r.score&&r.score[1]||0} ${cbEsc(r.b||'Соперник')}</b><div class="cbFeatureStat">${cbEsc(r.date||'')} · ${cbEsc(r.mode||'Матч')}</div></div>`).join('')||'<p class="cbFeatureStat">Сыграй матч, чтобы начать историю.</p>'}<button class="mi" data-a="featureClose">Закрыть</button>`);}
function v21OpenTutorial(){v21TutPage=0;v21TutorialRender();}function v21TutorialRender(){const pages=[['Движение','Веди стиком на своей стороне экрана или используй WASD. Стрелки работают для второго игрока.'],['Удар и пас','«УДАР» завершает атаку, «ПАС» отдаёт мяч партнёру. Удерживай рывок только когда нужно ускориться.'],['Защита','Кнопка «СМЕНА» переключает управляемую корову. Двигайся к сопернику и перекрывай направление передачи.'],['Сохраняй прогресс','Карьера, рекорды, внешний вид и трофеи сохраняются локально в браузере.']];const p=pages[v21TutPage];cbOpenModal('tutorialV21','Обучение · '+(v21TutPage+1)+'/'+pages.length,`<p>${p[0]}</p><p class="cbFeatureStat">${p[1]}</p><div class="cbFeatureGrid"><button class="mi" data-a="v21TutPrev" ${v21TutPage===0?'disabled':''}>Назад</button><button class="mi pri" data-a="v21TutNext">${v21TutPage===pages.length-1?'Завершить':'Далее'}</button></div>`);}
let v21LastSpoken=0;
const v21OldSay=say;say=function(key,force){const r=v21OldSay(key,force);try{if(!settings.commentaryVoiceV21||!settings.comment||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return r;const now=Date.now();if(!force&&now-v21LastSpoken<5500)return r;const phrase=String($('commentary')&&$('commentary').textContent||'').trim();if(!phrase)return r;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(phrase);u.lang=({ru:'ru-RU',en:'en-GB',fr:'fr-FR',es:'es-ES',tr:'tr-TR',az:'az-AZ'})[settings.lang]||'ru-RU';u.rate=.96;u.pitch=.9;u.volume=clamp((settings.vMaster||80)/100,0,1);window.speechSynthesis.speak(u);v21LastSpoken=now;}catch(e){}return r;};
const v21OldSettingChanged=onSettingChanged;onSettingChanged=function(k){v21OldSettingChanged(k);if(k==='commentaryVoiceV21'&& !settings.commentaryVoiceV21 && 'speechSynthesis' in window){try{window.speechSynthesis.cancel();}catch(e){}}if(k==='accessProfile')cbApplyAccess();};
const _v21RenderHome=renderHome;renderHome=function(){_v21RenderHome();const el=$('tiles');if(el&&!el.querySelector('[data-a="v21Profile"]'))el.insertAdjacentHTML('beforeend',`<button class="mi" data-a="v21Profile">Внешность игрока</button><button class="mi" data-a="v21Achievements">Достижения и трофеи</button><button class="mi" data-a="v21Records">Локальные рекорды</button><button class="mi" data-a="v21Photo">Фоторежим</button><button class="mi" data-a="v21Tutorial">Обучение</button><button class="mi" data-a="v21LocalVersus">Вдвоём на одном экране</button>`);};
Object.assign(ACT,{
 v21Profile(){v21ProfileEditor();},v21ProfileSave(){const n=$('v21Number'),s=$('v21Surname'),co=$('v21Coat'),sc=$('v21Scarf'),ce=$('v21Celebration');settings.playerProfileV21={coat:co&&co.value||'#d8dce2',scarf:sc&&sc.value||'#b8ff3d',scarfOn:!!$('v21ScarfOn')?.checked,horns:!!$('v21Horns')?.checked,number:clamp(+(n&&n.value)||10,1,99),surname:String(s&&s.value||'PLAYER').trim().slice(0,12)||'PLAYER',celebration:clamp(+(ce&&ce.value)||0,0,7)};save();v21ApplyAvatar();cbCloseModal();},
 v21Achievements(){v21AchievementsModal();},v21Records(){v21RecordsModal();},v21Photo(){cbOpenPhoto('photo');},v21Tutorial(){v21OpenTutorial();},v21TutPrev(){v21TutPage=Math.max(0,v21TutPage-1);v21TutorialRender();},v21TutNext(){if(v21TutPage>=3){settings.tutDone=true;save();cbCloseModal();return;}v21TutPage++;v21TutorialRender();},
 v21LocalVersus(){settings.localTouchV21=true;save();openTeams('versus');},v21DisableLocal(){settings.localTouchV21=false;save();v21SetControlVisibility();}
});
// Keep the selected celebration for the player's team and apply the saved look to the controlled cow.
const v21OldGoal=goal;goal=function(team){v21OldGoal(team);const a=v21SafeProfile();if(team===0&&celeb)celeb.celebrationV15=clamp(+a.celebration||0,0,7);};
const v21OldSyncScene=syncScene;syncScene=function(dt){v21OldSyncScene(dt);try{v21ApplyAvatar();v21DrawRadar(performance.now());v21SetControlVisibility();}catch(e){}};
const v21OldStepGame=stepGame;stepGame=function(dt){if(photoModeState&&photoModeState.active)return;return v21OldStepGame(dt);};
// Single-button mode: assist the controlled player towards the ball, while preserving original shot physics and AI.
const v21OldGather=gather;gather=function(p){const o=v21OldGather(p);if(settings.oneButtonV21&&p&&p.id===1&&state==='play'&&!(matchCfg&&matchCfg.versus)){const c=p.cow||cows.find(q=>q.team===0&&q.role!=='gk');if(c){let tx=ball.x,ty=ball.y;if(ball.carrier&&ball.carrier.team===0){tx=FX+FW-8;ty=H/2;}const dx=tx-c.x,dy=ty-c.y,m=Math.hypot(dx,dy)||1;o.x=dx/m;o.y=dy/m;}o.pass=false;o.cross=false;o.sw=false;}if(settings.localTouchV21&&matchCfg&&matchCfg.versus&&(['play','ready','goal','pens'].includes(state)||(state==='rule'&&!!restartStateV17&&!!ruleModalState))){const side=p.id===1?'left':'right',v=v21JoyState[side],a=v21TouchActions[side];if(v.id!==null){o.x=v.x;o.y=v.y;}if(a.kick)o.kick=true;if(a.pass)o.pass=true;if(a.sprint)o.sprint=true;if(a.switch)o.sw=true;}return o;};
// Photo mode slider camera is already available; dragging the dark overlay also orbits the free camera.
document.addEventListener('pointerdown',e=>{if(!photoModeState.active||e.target.closest('input,button,select')||!e.target.closest('#cbFeatureModal'))return;v21PhotoDrag={id:e.pointerId,x:e.clientX,y:e.clientY};});
document.addEventListener('pointermove',e=>{if(!v21PhotoDrag||e.pointerId!==v21PhotoDrag.id)return;const dx=e.clientX-v21PhotoDrag.x,dy=e.clientY-v21PhotoDrag.y;photoModeState.angle=(photoModeState.angle+dx*.45+360)%360;photoModeState.height=clamp(photoModeState.height-dy*.035,2,22);v21PhotoDrag.x=e.clientX;v21PhotoDrag.y=e.clientY;const el=$('cbAngleVal');if(el)el.textContent=Math.round(photoModeState.angle)+'°';const h=$('cbHeightVal');if(h)h.textContent=photoModeState.height.toFixed(1);});
document.addEventListener('pointerup',e=>{if(v21PhotoDrag&&e.pointerId===v21PhotoDrag.id)v21PhotoDrag=null;});
// Two local touch sticks/actions. Capturing only the background touch avoids stealing presses from the controls.
document.addEventListener('pointerdown',e=>{if(!(settings.localTouchV21&&matchCfg&&matchCfg.versus&&touchUIOn()&&['play','ready','goal'].includes(state)))return;if(e.target.closest('.v21action,[data-a],input,button'))return;const side=e.clientX<innerWidth/2?'left':'right',v=v21JoyState[side];if(v.id!==null)return;v.id=e.pointerId;v.ox=e.clientX;v.oy=e.clientY;v.x=v.y=0;v21joy.style.display='block';v21joy.style.left=e.clientX+'px';v21joy.style.top=e.clientY+'px';e.preventDefault();e.stopPropagation();},true);
document.addEventListener('pointermove',e=>{for(const side of ['left','right']){const v=v21JoyState[side];if(v.id!==e.pointerId)continue;let dx=e.clientX-v.ox,dy=e.clientY-v.oy,m=Math.hypot(dx,dy),R=52;if(m>R){dx=dx/m*R;dy=dy/m*R;}v.x=clamp(dx/R,-1,1);v.y=clamp(dy/R,-1,1);v21joy.style.left=v.ox+'px';v21joy.style.top=v.oy+'px';e.preventDefault();e.stopPropagation();}},true);
function v21ReleasePointer(e){for(const side of ['left','right']){const v=v21JoyState[side];if(v.id===e.pointerId){v.id=null;v.x=v.y=0;v21joy.style.display='none';}}}document.addEventListener('pointerup',v21ReleasePointer,true);document.addEventListener('pointercancel',v21ReleasePointer,true);
v21controls.querySelectorAll('.v21action').forEach(b=>{const [side,key]=b.dataset.v21action.split('-');const down=e=>{e.preventDefault();v21TouchActions[side][key==='switch'?'switch':key]=true;try{b.setPointerCapture(e.pointerId)}catch(_){};};const up=()=>{v21TouchActions[side][key==='switch'?'switch':key]=false;};b.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up));});
const v21OldApplyUI=applyUIState;applyUIState=function(){v21OldApplyUI();v21SetControlVisibility();};
const v21OldFinish=finishMatchNow;finishMatchNow=function(){const r=v21OldFinish();v21UnlockAchievements();return r;};
// Make the selected avatar visible as soon as a match is built and in menu previews where possible.
const v21OldStartMatch=startMatch;startMatch=function(cfg){const r=v21OldStartMatch(cfg);v21AvatarCow=null;return r;};
// iPhone Safari does not expose document-level fullscreen; inform users rather than leaving a dead control.
if(!v21FsApi()){$('v21HomeHint').style.display='none';$('v21HomeHint').textContent='На iPhone/iPad Safari полного экрана для страницы нет. Добавьте игру на экран «Домой».';}

// v32: keep touch controls available and functional during throw-ins, corners and goal kicks.
const _v21SetControlVisibilityV32=v21SetControlVisibility;
v21SetControlVisibility=function(){_v21SetControlVisibilityV32();if(state==='rule'&&restartStateV17&&ruleModalState&&touchUIOn()){const legacy=$('tbtns');if(legacy)legacy.classList.remove('hide');if(settings.localTouchV21&&matchCfg&&matchCfg.versus){v21controls.style.display='block';if(legacy)legacy.classList.add('hide');}}};

// ================== v24: focused cow/stadium/ball-boundary fixes ==================
// The tunnel is created in scene space after the stadium objects are scaled. Keep it aligned to the selected pitch size.
const _ensureTunnelV24 = ensureTunnelEntrance;
ensureTunnelEntrance = function(){
  _ensureTunnelV24();
  const t = scene.getObjectByName('CowballTunnelEntrance');
  if (t) { t.scale.setScalar(fieldVisualScale); t.traverse(o=>{ if(o.isMesh){o.castShadow=false;o.receiveShadow=false;} }); }
};

// Number + surname are rendered as a small team-kit decal once per player, not rebuilt every frame.
function ensureCowKitLabelV24(c){
  if(!c||!c.g)return;
  const num=String(c.num||20),name=String(c.pname||'PLAYER').replace(/[^A-Za-z\u00C0-\u024FА-Яа-яЁё0-9 .'-]/g,'').slice(0,12).toUpperCase();
  if(c.g.userData.cowballKitLabelV24 && c.g.userData.cowballKitLabelV24.key===num+'|'+name){
    if(c.g.userData.cowballCaptainV24)c.g.userData.cowballCaptainV24.visible=(c.lk===0);
    return;
  }
  const old=c.g.userData.cowballKitLabelV24;
  if(old){c.g.remove(old.mesh);old.mesh.material.map.dispose();old.mesh.material.dispose();old.mesh.geometry.dispose();}
  const cv=document.createElement('canvas');cv.width=256;cv.height=192;const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,256,192);ctx.fillStyle='rgba(8,12,22,.70)';if(typeof ctx.roundRect==='function'){ctx.beginPath();ctx.roundRect(18,8,220,176,22);ctx.fill();}else{ctx.fillRect(18,8,220,176);}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font='900 100px Arial';ctx.fillText(num,128,74,200);
  ctx.font='800 27px Arial';ctx.fillStyle='#f4f7ff';ctx.fillText(name,128,148,212);
  const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.needsUpdate=true;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.58,.44),mat);mesh.position.set(-.335,1.15,0);mesh.rotation.y=-Math.PI/2;mesh.renderOrder=3;c.g.add(mesh);
  c.g.userData.cowballKitLabelV24={mesh,key:num+'|'+name};
  if(!c.g.userData.cowballCaptainV24){const band=new THREE.Mesh(RBX(.18,.09,.12,.025),new THREE.MeshLambertMaterial({color:0xffd447}));band.position.set(.28,1.36,.51);band.rotation.x=.14;c.g.add(band);c.g.userData.cowballCaptainV24=band;}
  c.g.userData.cowballCaptainV24.visible=(c.lk===0);
}

// Shadows are restricted to the player models. In one-shadow mode the directional light owns the map;
// in four-shadow mode the four stadium spotlights own it. Quality 'off' still disables all maps.
let fourShadowFallbackV24=false, fourShadowLowSinceV24=0, fourShadowStatusV24='';
function fourShadowsRequestedV24(){return false;}   // четыре тени убраны: сильно роняли FPS
function applyShadowPolicyV24(){
  const qualityOn=settings.shadowQ!=='off';
  const wantFour=fourShadowsRequestedV24()&&!fourShadowFallbackV24&&qualityOn;
  const wantAny=qualityOn&&(wantFour||settings.shadowQ!=='off');
  const shadowPreset=settings.shadowQ==='auto'?(gfxLevel()==='low'?'low':gfxLevel()==='med'?'medium':'high'):settings.shadowQ;
  const shadowSize=shadowPreset==='low'?512:shadowPreset==='medium'?768:1024;
  renderer.shadowMap.enabled=!!wantAny;
  renderer.shadowMap.type=shadowPreset==='low'?THREE.BasicShadowMap:THREE.PCFSoftShadowMap;
  const setShadowSize=(light,q)=>{if(!light||!light.shadow)return;if(light.shadow.mapSize.x!==q||light.shadow.mapSize.y!==q){if(light.shadow.map){light.shadow.map.dispose();light.shadow.map=null;}light.shadow.mapSize.set(q,q);}};
  dirL.castShadow=!!(wantAny&&!wantFour);
  setShadowSize(dirL,IS_TOUCH?Math.min(512,shadowSize):shadowSize);
  stadiumSpots.forEach((light,i)=>{
    light.castShadow=!!(wantFour&&i<4);
    if(light.castShadow){const q=IS_TOUCH?512:Math.min(1024,shadowSize);setShadowSize(light,q);light.shadow.bias=-0.00025;light.shadow.normalBias=0.025;light.shadow.radius=IS_TOUCH?2:3;light.shadow.camera.near=.5;light.shadow.camera.far=85;}
    else if(light.shadow&&light.shadow.map){light.shadow.map.dispose();light.shadow.map=null;}
  });
  scene.traverse(o=>{if(o.isMesh){const playerCaster=!!o.userData.cowballPlayerCaster;o.castShadow=!!(wantAny&&playerCaster);if(playerCaster)o.receiveShadow=false;}});
  fourShadowStatusV24= !qualityOn ? 'Тени выключены общим параметром «Тени».' : fourShadowFallbackV24 ? 'Производительность низкая: автоматически оставлена одна тень. Переключите «Четыре тени» вручную, чтобы повторить попытку.' : wantFour ? 'Активны четыре теневые карты прожекторов; тени отбрасывают только коровы-игроки.' : 'Активна одна теневая карта; тени отбрасывают только коровы-игроки.';
  return wantFour;
}
const _makeCowShadowV24=makeCow;
makeCow=function(team,role,hatIdx){
  const rig=_makeCowShadowV24(team,role,hatIdx), g=rig&&rig.g?rig.g:rig;   // makeCow возвращает объект {g, body, legs...}, а не Group
  if(g&&g.traverse){g.traverse(o=>{if(o.isMesh){o.userData.cowballPlayerCaster=true;o.castShadow=true;o.receiveShadow=false;}});g.userData.cowballPlayerCaster=true;}
  return rig;
};
const _buildStandsShadowV24=buildStands;
buildStands=function(){const r=_buildStandsShadowV24();if(standRoot)standRoot.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});return r;};
const _onSettingV24=onSettingChanged;
onSettingChanged=function(k){_onSettingV24(k);if(k==='fourShadows'||k==='gfx'||k==='shadowQ'){fourShadowFallbackV24=false;fourShadowLowSinceV24=0;applyShadowPolicyV24();}};
const _renderSettingsV24=renderSettings;
renderSettings=function(){
  _renderSettingsV24();
  const tab=SET_TABS[setTab];if(false&&tab&&tab.id==='gfx'){
    const note=document.createElement('div');note.className='kbhelp';note.id='fourShadowInfoV24';note.textContent=utxT(fourShadowStatusV24||'Авто: низкий/минимальный пресет — одна тень; высокий/ультра — четыре. Включение вручную может снизить FPS.');
    $('setBody').appendChild(note);
  }
};

// Only cows cast. New static stadium parts and the existing goals/scoreboard/tunnel do not cast shadows.
scene.traverse(o=>{if(o.isMesh){o.castShadow=false;if(o.userData.cowballPlayerCaster)o.castShadow=true;}});
applyShadowPolicyV24();

// Keep the custom shadow policy as the final authority after preset/resize reconfiguration.
const _applyGfxQualityV24=applyGfxQuality;
applyGfxQuality=function(){const r=_applyGfxQualityV24();if(typeof applyShadowPolicyV24==='function')applyShadowPolicyV24();return r;};

// Create the kit decals and maintain captain armbands outside the render-time geometry build path.
const _syncSceneKitV24=syncScene;
syncScene=function(dt){
  _syncSceneKitV24(dt);
  if(state==='play'||state==='ready'||state==='goal'||state==='outro') cows.forEach(c=>ensureCowKitLabelV24(c));
};

// Automatic safeguard: if four-shadow mode sustains a low frame rate for 2.5 seconds, fall back to one shadow.
const _loopShadowGuardV24=loop;
loop=function(now){
  _loopShadowGuardV24(now);
  const t=Number(now)||performance.now(), active=fourShadowsRequestedV24()&&!fourShadowFallbackV24&&settings.shadowQ!=='off';
  if(active && Number.isFinite(fpsAvg) && fpsAvg<28){if(!fourShadowLowSinceV24)fourShadowLowSinceV24=t;if(t-fourShadowLowSinceV24>2500){fourShadowFallbackV24=true;applyShadowPolicyV24();if(screen==='settings')renderSettings();}}else if(!active||fpsAvg>34)fourShadowLowSinceV24=0;
};

// ================== v26: Group 1 corrective pass ==================
// Out-of-bounds is checked by the physics helper and again after collision correction; the old predictive
// cbOutOfBounds() helper is retained for compatibility but is no longer called in parallel.
// Keep crowd/stand meshes explicitly non-shadow-casting after a stadium rebuild.
const _buildStandsGroup1V26=buildStands;
buildStands=function(){const result=_buildStandsGroup1V26();if(standRoot)standRoot.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});return result;};
// Re-apply the one-vs-four-shadow policy after each match builds new player meshes. This keeps all newly
// spawned cows (including keepers) as the only objects allowed to cast shadows.
const _buildMatchGroup1V26=buildMatch;
buildMatch=function(cfg){const result=_buildMatchGroup1V26(cfg);applyShadowPolicyV24();return result;};
// Keep the active language on the document root after every language change, and update newly generated
// scoreboard overlays through the observers established above.
const _applyLanguageGroup1V26=utxApplyLanguage;
utxApplyLanguage=function(){const r=_applyLanguageGroup1V26();document.documentElement.lang=settings.lang||'ru';utxTranslateAll();return r;};

// v28: новая карточка игрока Ultimate Team (замена разметки; данные, кнопки и действия те же)
utCardHtml=function(c,actions=true){
  const r=UT_RARITY[c.rarity]||UT_RARITY.bronze,
        a=utEsc(c.kitColor||ut.homeColor||'#3a86ff'),
        coat=utEsc(c.coat||'#d8dce2'),
        stats=[['PAC',c.pac],['SHO',c.sho],['PAS',c.pas],['DRI',c.dri],['DEF',c.def],['PHY',c.phy]];
  return `<div class="utCard utxPlayerCard fut ${utEsc(c.rarity||'bronze')}" style="--rarity:${r.color}">`+
    `<div class="futTop"><div class="futRate"><strong>${c.rating}</strong><span>${utEsc(c.pos)}</span><i style="background:${a}"></i></div>`+
    `<div class="futCow"><div class="futHead" style="background:${coat}"><u></u></div><div class="futKit" style="background:${a}"></div></div></div>`+
    `<div class="futBody"><span class="futName">${utEsc(c.name)}</span>`+
    `<div class="futStats">${stats.map(([n,v])=>`<span><strong>${v}</strong>${n}</span>`).join('')}</div>`+
    `<span class="futMeta">${utEsc(r.label)} · ${utEsc(c.nation)} · ${utEsc(c.club)}</span>`+
    (actions?`<div class="utActions"><button class="mi" data-a="utxListDraft" data-id="${utEsc(c.uid)}">${utxT('Выставить на рынок')}</button><button class="mi" data-a="utxQuickSell" data-id="${utEsc(c.uid)}">${utxT('Продать')}</button></div>`:'')+
    `</div></div>`;
};

// v28: новые детализированные стадионы — у каждого стиля своя архитектура и окружение.
// Всё строится один раз (InstancedMesh, общие материалы, без работы в кадре), не добавляет света и теней.
var _sdV28 = null;
function stadiumDetailV28() {
  try {
    if (_sdV28) { if (_sdV28.parent) _sdV28.parent.remove(_sdV28); (_sdV28.userData.own || []).forEach(o => o && o.dispose && o.dispose()); _sdV28 = null; }
    if (!standRoot) return;
    const mode = settings.stadium || 'classic', lite = !!settings.powerSave || gfxLevel() === 'low';
    const g = new THREE.Group(), own = []; g.userData.own = own;
    const E = hx + gDepth + 3.6, outer = E + 4.4, Xo = E + 8 * 1.25 + 4, Zn = hz + 3 + 10 * 1.25 + 4, Zs = hz + 3 + 8 * 1.25 + 4;
    let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const lam = c => { const m = new THREE.MeshLambertMaterial({ color: c }); own.push(m); return m; };
    const bas = c => { const m = new THREE.MeshBasicMaterial({ color: c }); own.push(m); return m; };
    const dummy = new THREE.Object3D();
    const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 8), CON = new THREE.ConeGeometry(1, 1, 8), PYR = new THREE.ConeGeometry(1, 1, 4), SPH = new THREE.SphereGeometry(1, 8, 6);
    own.push(BOX, CYL, CON, PYR, SPH);
    // t = [x, y, z, rotY, sx, sy, sz]; y — центр объекта
    const inst = (geo, mat, list) => {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((t, i) => { const sx = t[4] === undefined ? 1 : t[4], sy = t[5] === undefined ? sx : t[5], sz = t[6] === undefined ? sx : t[6];
        dummy.position.set(t[0], t[1], t[2]); dummy.rotation.set(0, t[3] || 0, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; g.add(im);
    };
    const strip = (c, x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0)), lam(c)); own.push(m.geometry); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.02, (z0 + z1) / 2); g.add(m); };
    const ground = c => { strip(c, -170, 170, -170, -Zn); strip(c, -170, 170, Zs, 170); strip(c, -170, -Xo, -Zn, Zs); strip(c, Xo, 170, -Zn, Zs); };
    const dark = lam(0x2a303c), steel = lam(0x8a94a6), glow = bas(0xfff6d8);

    // --- прожекторные мачты в четырёх углах (у всех стилей) ---
    const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(c => [c[0] * (E + 10), c[1] * (hz + 8)]);
    inst(CYL, dark, corners.map(c => [c[0], 13, c[1], 0, 0.55, 26, 0.55]));
    inst(BOX, dark, corners.map(c => [c[0], 26.6, c[1], Math.atan2(-c[0], -c[1]), 8, 3.6, 0.8]));
    inst(BOX, glow, corners.map(c => { const l = Math.hypot(c[0], c[1]), o = 0.55; return [c[0] - c[0] / l * o, 26.6, c[1] - c[1] / l * o, Math.atan2(-c[0], -c[1]), 7.2, 3, 0.2]; }));

    const xs = (a, b, st) => { const r = []; for (let x = a; x <= b + 0.01; x += st) r.push(x); return r; };
    if (mode === 'classic') {
      // арочный фасад за главной и дальней трибунами + флагштоки
      const px = xs(-outer, outer, 6), brick = lam(0x7a4a3a), cream = lam(0xd8cfb8);
      inst(BOX, brick, px.map(x => [x, 7, -Zn + 2, 0, 1.4, 14, 1.4]).concat(px.map(x => [x, 7, Zs - 2, 0, 1.4, 14, 1.4])));
      inst(BOX, cream, [[0, 14.4, -Zn + 2, 0, outer * 2 + 2, 1.2, 1.8], [0, 14.4, Zs - 2, 0, outer * 2 + 2, 1.2, 1.8]]);
      if (!lite) { const fl = []; for (let z = -hz; z <= hz; z += 12) { fl.push([-(Xo + 2), 5, z, 0, .12, 10, .12]); fl.push([(Xo + 2), 5, z, 0, .12, 10, .12]); }
        inst(BOX, steel, fl); inst(BOX, lam(0xd0384a), fl.map(f => [f[0] + .5, 9.2, f[2], 0, 1, .7, .05])); }
    } else if (mode === 'arena') {
      // огромные видеоэкраны на торцах и светодиодное кольцо
      const frame = lam(0x161b26), scr = bas(0x4fa3ff), led = bas(0xc6d6ff);
      [-1, 1].forEach(s => { const a = s > 0 ? -Math.PI / 2 : Math.PI / 2; inst(BOX, frame, [[s * (Xo + 6), 13, 0, a, 22, 9, .8]]); inst(BOX, scr, [[s * (Xo + 5.5), 13, 0, a, 20.5, 7.6, .2]]); inst(BOX, steel, [[s * (Xo + 6), 5, 0, 0, .8, 10, .8]]); });
      inst(BOX, led, [[0, 9.5, -Zn + 1, 0, outer * 2, .3, .3], [0, 9.5, Zs - 1, 0, outer * 2, .3, .3]]);
    } else if (mode === 'dome') {
      // кольцевая ферма над чашей: балки и колонны
      const beam = lam(0xaab4cc), ry = 22;
      inst(BOX, beam, [[0, ry, -Zn + 3, 0, Xo * 2, 1, 1.2], [0, ry, Zs - 3, 0, Xo * 2, 1, 1.2], [-Xo + 1, ry, (Zs - Zn) / 2, 0, 1.2, 1, Zn + Zs], [Xo - 1, ry, (Zs - Zn) / 2, 0, 1.2, 1, Zn + Zs]]);
      const cols = []; xs(-Xo + 1, Xo - 1, (Xo - 1) / 3).forEach(x => { cols.push([x, ry / 2, -Zn + 3, 0, .7, ry, .7], [x, ry / 2, Zs - 3, 0, .7, ry, .7]); });
      xs(-Zn + 3, Zs - 3, (Zn + Zs - 6) / 3).forEach(z => { cols.push([-Xo + 1, ry / 2, z, 0, .7, ry, .7], [Xo - 1, ry / 2, z, 0, .7, ry, .7]); });
      inst(BOX, steel, cols);
      if (!lite) inst(BOX, glow, [[0, ry - .7, -Zn + 3, 0, Xo * 2 - 6, .25, .4], [0, ry - .7, Zs - 3, 0, Xo * 2 - 6, .25, .4]]);
    } else if (mode === 'coastal') {
      // море за торцами, песчаный пляж, пальмы, маяк
      strip(0xe6d29a, -170, -Xo, -Zn, Zs); strip(0xe6d29a, Xo, 170, -Zn, Zs);
      strip(0x1b8fb0, -170, -Xo - 22, -Zn, Zs); strip(0x1b8fb0, Xo + 22, 170, -Zn, Zs);
      const trunks = [], tops = [], n = lite ? 8 : 22;
      for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, z = -Zn + 6 + rnd() * (Zn + Zs - 12), x = side * (Xo + 4 + rnd() * 14), h = 5 + rnd() * 3;
        trunks.push([x, h / 2, z, 0, .28, h, .28]); tops.push([x, h + .8, z, rnd() * 6, 2.6, 1.1, 2.6]); }
      inst(CYL, lam(0x8a6a44), trunks); inst(CON, lam(0x2f9e4a), tops);
      inst(CYL, lam(0xf4f4f4), [[-(Xo + 28), 8, -hz - 6, 0, 2.2, 16, 2.2]]); inst(CYL, lam(0xd0384a), [[-(Xo + 28), 12, -hz - 6, 0, 2.3, 4, 2.3]]); inst(CON, lam(0x2a303c), [[-(Xo + 28), 17.5, -hz - 6, 0, 2.6, 3, 2.6]]); inst(SPH, glow, [[-(Xo + 28), 16.2, -hz - 6, 0, 1, 1, 1]]);
    } else if (mode === 'neon') {
      // неоновые линии и вертикальные световые стелы
      const mg = bas(0xff2fd6), cy = bas(0x2ff3ff), lime = bas(0xc7ff3d);
      inst(BOX, mg, [[0, 11, -Zn + 1, 0, outer * 2, .35, .35], [0, 11, Zs - 1, 0, outer * 2, .35, .35]]);
      inst(BOX, cy, [[-Xo + 1, 11, (Zs - Zn) / 2, 0, .35, .35, Zn + Zs], [Xo - 1, 11, (Zs - Zn) / 2, 0, .35, .35, Zn + Zs]]);
      const st = []; for (let i = -3; i <= 3; i++) { st.push([i * (outer / 3.2), 9, -Zn - 2, 0, .5, 18, .5]); st.push([i * (outer / 3.2), 9, Zs + 2, 0, .5, 18, .5]); }
      inst(BOX, lime, st);
      if (!lite) { strip(0x1a1030, -170, 170, -170, -Zn); strip(0x1a1030, -170, 170, Zs, 170); }
    } else if (mode === 'royal') {
      // золотые башни с куполами, знамёна и парадная арка
      const gold = lam(0xe0b341), stone = lam(0xcfc5d8), red = lam(0x9b1d3a);
      inst(CYL, stone, corners.map(c => [c[0] * 1.25, 6, c[1] * 1.1, 0, 2.4, 12, 2.4])); inst(CON, gold, corners.map(c => [c[0] * 1.25, 14, c[1] * 1.1, 0, 3.1, 5, 3.1])); inst(SPH, gold, corners.map(c => [c[0] * 1.25, 17.2, c[1] * 1.1, 0, .6, .6, .6]));
      const bn = []; xs(-outer + 8, outer - 8, 14).forEach(x => { bn.push([x, 8, -Zn + 1.2, 0, 3, 8, .15], [x, 8, Zs - 1.2, 0, 3, 8, .15]); });
      inst(BOX, red, bn); inst(BOX, gold, bn.map(b => [b[0], b[1] + 4.3, b[2], 0, 3.4, .35, .3]));
      inst(BOX, stone, [[-6, 8, Zs + 1, 0, 2.2, 16, 2.2], [6, 8, Zs + 1, 0, 2.2, 16, 2.2], [0, 15.5, Zs + 1, 0, 14, 2.5, 2.4]]);
    } else if (mode === 'desert') {
      // песок, колонны из песчаника, пирамиды и барханы
      ground(0xd9b77a);
      const sand = lam(0xc99a5c), sandD = lam(0xb98a4e), p = [];
      xs(-outer, outer, 9).forEach(x => { p.push([x, 6, -Zn + 2, 0, 2, 12, 2], [x, 6, Zs - 2, 0, 2, 12, 2]); });
      inst(BOX, sand, p); inst(BOX, sandD, [[0, 12.6, -Zn + 2, 0, outer * 2 + 3, 1.4, 2.6], [0, 12.6, Zs - 2, 0, outer * 2 + 3, 1.4, 2.6]]);
      inst(PYR, lam(0xd8b06a), [[-(Xo + 40), 17, -hz - 20, Math.PI / 4, 24, 34, 24], [-(Xo + 70), 12, hz + 20, Math.PI / 4, 16, 24, 16], [Xo + 55, 14, -hz - 10, Math.PI / 4, 20, 28, 20]]);
      const dn = [], cc = [], n = lite ? 6 : 16;
      for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; dn.push([side * (Xo + 8 + rnd() * 50), 0, (rnd() - .5) * 150, rnd() * 3, 12 + rnd() * 14, 2.5 + rnd() * 2, 8 + rnd() * 6]); if (i < 8) cc.push([side * (Xo + 4 + rnd() * 10), 1.3, (rnd() - .5) * 90, 0, .3, 2.6, .3]); }
      inst(SPH, sand, dn); inst(CYL, lam(0x3f8f45), cc);
    } else if (mode === 'winter') {
      // снег, ели и сугробы
      ground(0xeef6ff);
      const pine = [], pine2 = [], trunk = [], n = lite ? 12 : 40;
      for (let i = 0; i < n; i++) { const ring = rnd(), sx = rnd() < .5 ? -1 : 1, onSide = rnd() < .5; let x, z;
        if (onSide) { x = sx * (Xo + 3 + rnd() * 26); z = (rnd() * (Zn + Zs)) - Zn; } else { x = (rnd() - .5) * 2 * (outer + 20); z = (rnd() < .5 ? -(Zn + 3 + rnd() * 22) : (Zs + 3 + rnd() * 22)); }
        const h = 6 + rnd() * 5 + ring; trunk.push([x, 1, z, 0, .35, 2, .35]); pine.push([x, 2.5 + h * .3, z, 0, 2.3 + ring, h * .6, 2.3 + ring]); pine2.push([x, 2.5 + h * .62, z, 0, 1.6 + ring * .6, h * .5, 1.6 + ring * .6]); }
      inst(CYL, lam(0x5b3b22), trunk); inst(CON, lam(0x1f6b45), pine); inst(CON, lam(0xe8f4ff), pine2);
      const dr = []; for (let i = 0; i < (lite ? 8 : 22); i++) dr.push([(rnd() - .5) * 2 * Xo, 0, rnd() < .5 ? -(Zn + 1 + rnd() * 6) : (Zs + 1 + rnd() * 6), rnd() * 3, 6 + rnd() * 6, 1.6 + rnd(), 3 + rnd() * 3]);
      inst(SPH, lam(0xffffff), dr);
    }
    standRoot.add(g); _sdV28 = g;
  } catch (e) { try { console.warn('stadiumDetailV28', e); } catch (_) {} }
}
const _applyStadiumStyleV28 = applyStadiumStyle;
applyStadiumStyle = function () { const r = _applyStadiumStyleV28.apply(this, arguments); stadiumDetailV28(); return r; };

// v28: Тренировочная арена — мини-игры на удары, пасы и дриблинг поверх настоящей игровой логики:
// обычный матч 5x5 без вступительной церемонии, ограниченное время, часть коров «замораживается» штатным механизмом c.freeze.
SCREENS.push('training', 'trainres');
var trainV28 = null;
const TRAIN_KEY_V28 = 'cowball_train_v28';
const TRAIN_DRILLS_V28 = { shots: { time: 60 }, passes: { time: 90 }, dribble: { time: 90 } };
const TRAIN_TXT_V28 = {
  title: { ru: 'Тренировочная арена', en: 'Training Arena', fr: "Salle d'entraînement", es: 'Arena de entrenamiento', tr: 'Antrenman Arenası', az: 'Məşq arenası' },
  tile: { ru: 'Тренировка', en: 'Training', fr: 'Entraînement', es: 'Entrenamiento', tr: 'Antrenman', az: 'Məşq' },
  tileSub: { ru: 'Удары, пасы и дриблинг', en: 'Shooting, passing, dribbling', fr: 'Tirs, passes, dribbles', es: 'Tiros, pases y regates', tr: 'Şut, pas ve dripling', az: 'Zərbə, ötürmə, driblinq' },
  shots: { ru: 'Удары', en: 'Shooting', fr: 'Tirs', es: 'Tiros', tr: 'Şut', az: 'Zərbələr' },
  passes: { ru: 'Пасы', en: 'Passing', fr: 'Passes', es: 'Pases', tr: 'Paslar', az: 'Ötürmələr' },
  dribble: { ru: 'Дриблинг', en: 'Dribbling', fr: 'Dribbles', es: 'Regates', tr: 'Dripling', az: 'Driblinq' },
  shotsD: { ru: '60 секунд. Соперники и партнёры стоят, играет только вратарь. Забей как можно больше голов.', en: '60 seconds. Opponents and teammates stand still, only the goalkeeper plays. Score as many goals as you can.', fr: '60 secondes. Adversaires et coéquipiers immobiles, seul le gardien joue. Marque un maximum de buts.', es: '60 segundos. Rivales y compañeros inmóviles, solo juega el portero. Marca todos los goles que puedas.', tr: '60 saniye. Rakipler ve takım arkadaşları durur, sadece kaleci oynar. Olabildiğince çok gol at.', az: '60 saniyə. Rəqiblər və komanda yoldaşları durur, yalnız qapıçı oynayır. Mümkün qədər çox qol vur.' },
  passesD: { ru: '90 секунд. Соперники стоят, партнёры играют. Разыгрывай мяч с партнёрами и забивай.', en: '90 seconds. Opponents stand still, teammates play. Combine passes with teammates and score.', fr: '90 secondes. Adversaires immobiles, coéquipiers actifs. Enchaîne les passes et marque.', es: '90 segundos. Rivales inmóviles, compañeros activos. Combina pases y marca.', tr: '90 saniye. Rakipler durur, takım arkadaşları oynar. Pas yap ve gol at.', az: '90 saniyə. Rəqiblər durur, komanda yoldaşları oynayır. Ötürmələr edib qol vur.' },
  dribbleD: { ru: '90 секунд. Партнёры стоят, соперники защищаются. Обводи защитников и забивай сам.', en: '90 seconds. Teammates stand still, opponents defend. Dribble past defenders and score yourself.', fr: '90 secondes. Coéquipiers immobiles, adversaires défendent. Dribble et marque.', es: '90 segundos. Compañeros inmóviles, rivales defienden. Regatea y marca tú mismo.', tr: '90 saniye. Takım arkadaşları durur, rakipler savunur. Savunmacıları geç ve gol at.', az: '90 saniyə. Komanda yoldaşları durur, rəqiblər müdafiə edir. Müdafiəçiləri keç və qol vur.' },
  best: { ru: 'Рекорд', en: 'Best', fr: 'Record', es: 'Récord', tr: 'Rekor', az: 'Rekord' },
  goals: { ru: 'Голов', en: 'Goals', fr: 'Buts', es: 'Goles', tr: 'Gol', az: 'Qol' },
  start: { ru: 'Начать', en: 'Start', fr: 'Commencer', es: 'Empezar', tr: 'Başla', az: 'Başla' },
  back: { ru: 'Назад', en: 'Back', fr: 'Retour', es: 'Atrás', tr: 'Geri', az: 'Geri' },
  done: { ru: 'Время вышло!', en: "Time's up!", fr: 'Temps écoulé !', es: '¡Se acabó el tiempo!', tr: 'Süre doldu!', az: 'Vaxt bitdi!' },
  record: { ru: 'Новый рекорд!', en: 'New record!', fr: 'Nouveau record !', es: '¡Nuevo récord!', tr: 'Yeni rekor!', az: 'Yeni rekord!' },
  again: { ru: 'Ещё раз', en: 'Again', fr: 'Rejouer', es: 'Otra vez', tr: 'Tekrar', az: 'Yenidən' },
  menu: { ru: 'В меню', en: 'Menu', fr: 'Menu', es: 'Menú', tr: 'Menü', az: 'Menyu' }
};
const trT = k => { const o = TRAIN_TXT_V28[k]; return o ? (o[settings.lang] || o.ru) : k; };
function trainBestV28() { try { return JSON.parse(localStorage.getItem(TRAIN_KEY_V28)) || {}; } catch (e) { return {}; } }
function trainSaveBestV28(kind, goals) {
  const b = trainBestV28(), rec = goals > (b[kind] | 0);
  if (rec) { b[kind] = goals; try { localStorage.setItem(TRAIN_KEY_V28, JSON.stringify(b)); } catch (e) {} }
  return rec;
}
function renderTrainV28() {
  const b = trainBestV28();
  $('sc-training').innerHTML = '<div class="wcol"><div class="hubbody"><h1 class="ttl">' + trT('title') + '</h1>' +
    ['shots', 'passes', 'dribble'].map(k => '<button class="cc" data-a="trainstart" data-v="' + k + '"><b>' + trT(k) + '</b><small>' + trT(k + 'D') + '</small><small>' + trT('best') + ': ' + (b[k] | 0) + ' ' + trT('goals').toLowerCase() + '</small></button>').join('') +
    '</div><div class="tfoot"><button class="mi" data-a="home">' + trT('back') + '</button></div></div>';
}
function trainStartV28(kind) {
  const D = TRAIN_DRILLS_V28[kind]; if (!D) return;
  const me = teamById(settings.myTeam) || TEAMS[0], opps = TEAMS.filter(t => t.id !== me.id), opp = opps[(Math.random() * opps.length) | 0];
  trainV28 = { kind, on: true };
  setScreen(null);
  Object.assign(matchCfg, { tA: me, tB: opp, size: 5, form: '', formB: '', versus: false, ko: false, comp: false, style: 'bal', noTactics: true, training: true });
  matchCfg.formB = pickAIForm(matchCfg); matchCfg.styleB = pickAIStyle(); buildMatch(matchCfg);
  score = [0, 0]; timeLeft = D.time; matchFrames = 0; stats = newStats(); lastMinute = false; rec = []; recTick = 0;
  clearParticles(); bannerEl().innerHTML = ''; chipTxt = ''; $('chips').innerHTML = '';
  applyEnv(settings.tod, settings.weather); introEv = {}; beginReady(false);
}
function trainTickV28() {
  const T = trainV28;
  if (!T || !T.on || !matchCfg || !matchCfg.training) return;
  if (state !== 'play' && state !== 'ready' && state !== 'goal') return;
  const me = players[0] && players[0].cow;
  cows.forEach(c => {
    if (c === me || c.role === 'gk') return;
    const still = T.kind === 'shots' || (T.kind === 'passes' && c.team === 1) || (T.kind === 'dribble' && c.team === 0);
    if (still && !(c.freeze > 30)) c.freeze = 60;
  });
}
function trainFinishV28() {
  const T = trainV28; if (!T) return;
  T.on = false; const kind = T.kind, goals = score[0] | 0, isRec = trainSaveBestV28(kind, goals), b = trainBestV28();
  try { SFX.whistle(0.9); } catch (e) {}
  matchCfg.training = false;
  goHome();
  $('sc-trainres').innerHTML = '<div class="wcol"><div class="hubbody"><h1 class="ttl">' + trT('done') + '</h1>' +
    '<div class="utPanel"><h3>' + trT(kind) + '</h3><div class="utSummary"><div class="utStat"><small>' + trT('goals') + '</small><b>' + goals + '</b></div><div class="utStat"><small>' + trT('best') + '</small><b>' + (b[kind] | 0) + '</b></div></div>' +
    (isRec && goals > 0 ? '<div class="utNotice">' + trT('record') + '</div>' : '') + '</div></div>' +
    '<div class="tfoot"><button class="mi pri" data-a="trainstart" data-v="' + kind + '">' + trT('again') + '</button><button class="mi" data-a="training">' + trT('title') + '</button><button class="mi" data-a="home">' + trT('menu') + '</button></div></div>';
  show('trainres');
}
ACT.training = function () { renderTrainV28(); show('training'); };
ACT.trainstart = function (d) { trainStartV28(d.v); };
const _updateHUDV28 = updateHUD;
updateHUD = function () { trainTickV28(); return _updateHUDV28.apply(this, arguments); };
const _endMatchV28 = endMatch;
endMatch = function () { if (trainV28 && trainV28.on && matchCfg && matchCfg.training) { trainFinishV28(); return; } return _endMatchV28.apply(this, arguments); };
const _renderHomeV28 = renderHome;
renderHome = function () {
  _renderHomeV28.apply(this, arguments);
  const t = document.getElementById('tiles'), ut = t && t.querySelector('[data-a="ut"]');
  if (ut && !t.querySelector('[data-a="training"]')) ut.insertAdjacentHTML('beforebegin', '<button class="mi" data-a="training">' + trT('tile') + '<small>' + trT('tileSub') + '</small></button>');
};

// ===== Cowball v29 polish: Ultimate Team presentation, card-opening sequence, replay controls,
// saved tactics, seasonal limited cards and expanded local career features. =====

// Fresh installs start on Ultra as requested; existing saved graphics choices are preserved above.
// The existing frame-time adaptive-resolution controller remains active for mobile devices.

const UTX_V29_TRANSLATIONS = {
  'Открыть пак': ['Open pack','Ouvrir le pack','Abrir sobre','Paketi aç','Paketi aç'],
  'Сезонный пак': ['Season pack','Pack saisonnier','Sobre de temporada','Sezon paketi','Mövsüm paketi'],
  'Сезонная серия': ['Seasonal edition','Édition saisonnière','Edición de temporada','Sezon sürümü','Mövsüm buraxılışı'],
  'Вероятности': ['Odds','Probabilités','Probabilidades','Olasılıklar','Ehtimallar'],
  'Новый пак готов': ['Your pack is ready','Votre pack est prêt','Tu sobre está listo','Paketin hazır','Paketin hazırdır'],
  'Нажми, чтобы раскрыть': ['Tap to reveal','Touchez pour révéler','Toca para revelar','Açmak için dokun','Açmaq üçün toxun'],
  'Вскрываем пак…': ['Opening pack…','Ouverture du pack…','Abriendo sobre…','Paket açılıyor…','Paket açılır…'],
  'Карточка получена!': ['Player revealed!','Joueur révélé !','¡Jugador revelado!','Oyuncu açıldı!','Oyunçu açıldı!'],
  'Сезонная карточка получена!': ['Season card revealed!','Carte de saison révélée !','¡Carta de temporada revelada!','Sezon kartı açıldı!','Mövsüm kartı açıldı!'],
  'Редкость скоро будет раскрыта': ['Rarity reveal incoming','La rareté sera bientôt révélée','Pronto se revelará la rareza','Nadirlik birazdan açıklanacak','Nadirlik az sonra açıqlanacaq'],
  'Забрать карточку': ['Collect player','Récupérer la carte','Añadir carta','Kartı al','Kartı götür'],
  'Открыть ещё пак': ['Open another pack','Ouvrir un autre pack','Abrir otro sobre','Başka paket aç','Başqa paket aç'],
  'Добавлена в коллекцию': ['Added to your collection','Ajouté à la collection','Añadida a la colección','Koleksiyona eklendi','Kolleksiyaya əlavə edildi'],
  'Ограниченная серия': ['Limited edition','Édition limitée','Edición limitada','Sınırlı seri','Məhdud buraxılış'],
  'Редкий сезонный дизайн': ['Rare seasonal design','Design saisonnier rare','Diseño de temporada poco común','Nadir sezon tasarımı','Nadir mövsüm dizaynı'],
  'Твой состав': ['Your squad','Votre équipe','Tu plantilla','Kadron','Heyətin'],
  'Рейтинг состава': ['Squad rating','Note de l’équipe','Valoración de plantilla','Kadro puanı','Heyət reytinqi'],
  'Карточки': ['Cards','Cartes','Cartas','Kartlar','Kartlar'],
  'Клубная химия': ['Club chemistry','Collectif du club','Química del club','Kulüp kimyası','Klub kimyası'],
  'Сезонный рынок': ['Season market','Marché de saison','Mercado de temporada','Sezon pazarı','Mövsüm bazarı'],
  'Старт карьеры': ['Start career','Démarrer la carrière','Iniciar carrera','Kariyere başla','Karyeraya başla'],
  'Продолжить сезон': ['Continue season','Continuer la saison','Continuar temporada','Sezonu sürdür','Mövsümü davam et'],
  'Начать следующий сезон': ['Start next season','Démarrer la saison suivante','Iniciar la próxima temporada','Sonraki sezonu başlat','Növbəti mövsümə başla'],
  'Трансферный рынок карьеры': ['Career transfer market','Marché des transferts carrière','Mercado de fichajes','Kariyer transfer pazarı','Karyera transfer bazarı'],
  'Академия': ['Academy','Académie','Academia','Akademi','Akademiya'],
  'Цели совета': ['Board objectives','Objectifs du conseil','Objetivos de la directiva','Yönetim hedefleri','Rəhbərliyin məqsədləri'],
  'Купить игрока': ['Sign player','Recruter le joueur','Fichar jugador','Oyuncuyu transfer et','Oyunçunu al'],
  'Создать молодого игрока': ['Generate youth prospect','Créer un jeune joueur','Generar juvenil','Genç oyuncu oluştur','Gənc oyunçu yarat'],
  'Подписать в основу': ['Promote to first team','Intégrer à l’équipe première','Subir al primer equipo','A takıma yükselt','Əsas heyətə götür'],
  'Тренировать +1': ['Train +1','Entraîner +1','Entrenar +1','+1 geliştir','+1 məşq etdir'],
  'Забрать награду совета': ['Claim board reward','Récupérer la récompense','Cobrar recompensa','Yönetim ödülünü al','Rəhbərlik mükafatını götür'],
  'Сохранённые тактики': ['Saved tactics','Tactiques enregistrées','Tácticas guardadas','Kayıtlı taktikler','Yadda saxlanmış taktikalar'],
  'Сохранить тактику': ['Save tactic','Enregistrer la tactique','Guardar táctica','Taktiği kaydet','Taktikanı saxla'],
  'Загрузить тактику': ['Load tactic','Charger la tactique','Cargar táctica','Taktiği yükle','Taktikanı yüklə'],
  'Удалить тактику': ['Delete tactic','Supprimer la tactique','Eliminar táctica','Taktiği sil','Taktikanı sil'],
  'Пауза повтора': ['Pause replay','Pause du ralenti','Pausar repetición','Tekrarı duraklat','Təkrarı dayandır'],
  'Продолжить повтор': ['Resume replay','Reprendre le ralenti','Continuar repetición','Tekrara devam et','Təkrara davam et'],
  'Скорость повтора': ['Replay speed','Vitesse du ralenti','Velocidad de repetición','Tekrar hızı','Təkrar sürəti'],
  'Трансфер': ['Transfer','Transfert','Fichaje','Transfer','Transfer'],
  'Молодой игрок': ['Youth player','Jeune joueur','Jugador juvenil','Genç oyuncu','Gənc oyunçu'],
  'Сезонная цель выполнена!': ['Season objective complete!','Objectif de saison atteint !','¡Objetivo de temporada completado!','Sezon hedefi tamamlandı!','Mövsüm hədəfi tamamlandı!'],
  'Не хватает бюджета': ['Not enough budget','Budget insuffisant','Presupuesto insuficiente','Yeterli bütçe yok','Büdcə kifayət etmir'],
  'Этот игрок уже подписан': ['This player is already signed','Ce joueur a déjà signé','Este jugador ya está fichado','Bu oyuncu zaten transfer edildi','Bu oyunçu artıq transfer olunub'],
  'Нужна активная карьера': ['Start a career first','Commencez une carrière','Primero inicia una carrera','Önce kariyere başla','Əvvəl karyera başlat'],
  'Новый игрок академии': ['New academy player','Nouveau joueur de l’académie','Nuevo jugador de academia','Yeni akademi oyuncusu','Akademiyanın yeni oyunçusu'],
  'Отмена': ['Cancel','Annuler','Cancelar','İptal','Ləğv et'],
  'Повтор превращён в монеты': ['Duplicate converted to coins','Doublon converti en pièces','Duplicado convertido en monedas','Tekrar jetona dönüştürüldü','Təkrar sikkəyə çevrildi'],
  '60% золото · 40% особая · редкий сезонный дизайн': ['60% gold · 40% special · rare seasonal design','60 % or · 40 % spéciale · design saisonnier rare','60 % oro · 40 % especial · diseño de temporada raro','%60 altın · %40 özel · nadir sezon tasarımı','60% qızıl · 40% xüsusi · nadir mövsüm dizaynı'],
  'Клуб карьеры': ['Career club','Club de carrière','Club de carrera','Kariyer kulübü','Karyera klubu'],
  'Обзор': ['Overview','Aperçu','Resumen','Genel bakış','İcmal'],
  'Карьера клуба': ['Club career','Carrière du club','Carrera del club','Kulüp kariyeri','Klub karyerası'],
  'Сезоны, результаты, бюджет, трансферы и академия сохраняются локально в этом браузере.': ['Seasons, results, budget, transfers and academy are saved in this browser.','Les saisons, résultats, le budget, les transferts et l’académie sont sauvegardés dans ce navigateur.','Las temporadas, resultados, presupuesto, fichajes y academia se guardan en este navegador.','Sezonlar, sonuçlar, bütçe, transferler ve akademi bu tarayıcıda kaydedilir.','Mövsümlər, nəticələr, büdcə, transferlər və akademiya bu brauzerdə saxlanılır.'],
  'Сезоны, трансферы, академия и цели совета': ['Seasons, transfers, academy and board objectives','Saisons, transferts, académie et objectifs du conseil','Temporadas, fichajes, academia y objetivos de la directiva','Sezonlar, transferler, akademi ve yönetim hedefleri','Mövsümlər, transferlər, akademiya və rəhbərliyin hədəfləri'],
  'Сезон': ['Season','Saison','Temporada','Sezon','Mövsüm'],
  'Бюджет': ['Budget','Budget','Presupuesto','Bütçe','Büdcə'],
  'Локальные деньги клуба': ['Local club funds','Fonds locaux du club','Fondos locales del club','Kulübün yerel bütçesi','Klubun yerli büdcəsi'],
  'Победы в сезоне': ['Season wins','Victoires de la saison','Victorias de la temporada','Sezon galibiyetleri','Mövsüm qələbələri'],
  'подписанных игроков': ['signed players','joueurs recrutés','jugadores fichados','transfer edilen oyuncu','transfer edilmiş oyunçu'],
  'Трансферы дают бонусы скорости, удара и защиты в матчах карьеры. Молодые игроки из академии могут развиваться тренировками.': ['Transfers boost pace, shooting and defense in career matches. Academy prospects can improve through training.','Les transferts améliorent la vitesse, le tir et la défense en carrière. Les jeunes de l’académie progressent à l’entraînement.','Los fichajes mejoran velocidad, tiro y defensa en la carrera. Los juveniles pueden progresar entrenando.','Transferler kariyer maçlarında hız, şut ve savunmayı artırır. Akademi oyuncuları antrenmanla gelişebilir.','Transferlər karyera matçlarında sürət, zərbə və müdafiəni artırır. Akademiya oyunçuları məşqlə inkişaf edə bilər.'],
  'Подписывай игроков за бюджет клуба. Подписанные игроки повышают общие характеристики команды в последующих матчах карьеры.': ['Sign players with the club budget. New signings improve team attributes in later career matches.','Recrutez des joueurs avec le budget du club. Les recrues améliorent l’équipe lors des prochains matchs de carrière.','Ficha jugadores con el presupuesto del club. Los fichajes mejoran al equipo en los siguientes partidos de carrera.','Kulüp bütçesiyle oyuncu al. Yeni transferler sonraki kariyer maçlarında takım özelliklerini artırır.','Klub büdcəsi ilə oyunçu al. Yeni transferlər növbəti karyera matçlarında komanda göstəricilərini artırır.'],
  'История трансферов': ['Transfer history','Historique des transferts','Historial de fichajes','Transfer geçmişi','Transfer tarixçəsi'],
  'Пока нет трансферов.': ['No transfers yet.','Aucun transfert pour le moment.','Todavía no hay fichajes.','Henüz transfer yok.','Hələ transfer yoxdur.'],
  'Создавай молодых игроков, тренируй их и подписывай в основную команду. Академия ограничена пятью игроками.': ['Create youth players, train them and promote them to the first team. The academy holds up to five players.','Créez des jeunes, entraînez-les et faites-les passer en équipe première. L’académie accueille cinq joueurs maximum.','Crea juveniles, entrénalos y súbelos al primer equipo. La academia admite hasta cinco jugadores.','Genç oyuncular oluştur, antrenman yaptır ve A takıma al. Akademi en fazla beş oyuncu tutar.','Gənc oyunçular yarat, məşq etdir və əsas komandaya götür. Akademiyada ən çox beş oyunçu ola bilər.'],
  'Академия пока пустая.': ['The academy is empty for now.','L’académie est vide pour le moment.','La academia está vacía por ahora.','Akademi şimdilik boş.','Akademiya hələlik boşdur.'],
  'Потенциал': ['Potential','Potentiel','Potencial','Potansiyel','Potensial'],
  'тренировка': ['training','entraînement','entrenamiento','antrenman','məşq'],
  'Совет ждёт от клуба не менее 6 побед и 18 забитых голов за сезон. Награда за обе цели — 1 500 монет.': ['The board expects at least 6 wins and 18 goals this season. Completing both objectives rewards 1,500 coins.','Le conseil attend au moins 6 victoires et 18 buts cette saison. Les deux objectifs rapportent 1 500 pièces.','La directiva espera al menos 6 victorias y 18 goles esta temporada. Completar ambos objetivos otorga 1.500 monedas.','Yönetim bu sezon en az 6 galibiyet ve 18 gol bekliyor. İki hedef de tamamlanırsa 1.500 jeton verilir.','Rəhbərlik bu mövsüm ən azı 6 qələbə və 18 qol gözləyir. Hər iki hədəfə görə 1 500 sikkə verilir.'],  'Совет ждёт от клуба не менее 6 побед и 18 забитых голов за сезон. Награда за обе цели — 1 500 монет в бюджет.': ['The board expects at least 6 wins and 18 goals this season. Completing both objectives adds 1,500 coins to the budget.','Le conseil attend au moins 6 victoires et 18 buts cette saison. Les deux objectifs ajoutent 1 500 pièces au budget.','La directiva espera al menos 6 victorias y 18 goles esta temporada. Completar ambos objetivos añade 1.500 monedas al presupuesto.','Yönetim bu sezon en az 6 galibiyet ve 18 gol bekliyor. İki hedef tamamlanınca bütçeye 1.500 jeton eklenir.','Rəhbərlik bu mövsüm ən azı 6 qələbə və 18 qol gözləyir. Hər iki hədəfə görə büdcəyə 1 500 sikkə əlavə olunur.'],
  'Забитые голы': ['Goals scored','Buts marqués','Goles marcados','Atılan goller','Vurulan qollar'],
  'цель': ['target','objectif','objetivo','hedef','hədəf'],
  'Награда уже получена': ['Reward already claimed','Récompense déjà récupérée','Recompensa ya cobrada','Ödül zaten alındı','Mükafat artıq götürülüb'],
  'Уже в клубе': ['Already at the club','Déjà au club','Ya está en el club','Zaten kulüpte','Artıq klubdadır'],
  'Название тактики': ['Tactic name','Nom de la tactique','Nombre de la táctica','Taktik adı','Taktikanın adı'],
  'На этой схеме нет сохранённой расстановки.': ['There is no saved formation for this setup.','Aucune disposition enregistrée pour ce schéma.','No hay una formación guardada para este esquema.','Bu diziliş için kaydedilmiş yerleşim yok.','Bu sxem üçün yadda saxlanmış düzülüş yoxdur.'],
  'Выбери 5×5 или 11×11 и открой вкладку «Команда».': ['Choose 5×5 or 11×11 and open the Team tab.','Choisissez 5×5 ou 11×11 puis ouvrez l’onglet Équipe.','Elige 5×5 u 11×11 y abre la pestaña Equipo.','5×5 veya 11×11 seçip Takım sekmesini aç.','5×5 və ya 11×11 seçib Komanda bölməsini aç.'],
  'Можно сохранить максимум 8 тактик. Удали одну и попробуй снова.': ['You can save up to 8 tactics. Delete one and try again.','Vous pouvez enregistrer 8 tactiques maximum. Supprimez-en une puis réessayez.','Puedes guardar un máximo de 8 tácticas. Elimina una e inténtalo de nuevo.','En fazla 8 taktik kaydedebilirsin. Birini silip tekrar dene.','Ən çox 8 taktika saxlamaq olar. Birini sil və yenidən cəhd et.'],
  'Тактика сохранена для': ['This tactic is saved for','Cette tactique est enregistrée pour','Esta táctica se guardó para','Bu taktik şu diziliş için kaydedildi:','Bu taktika bunun üçün saxlanılıb:'],
  'В настройках матча выбери такой размер состава.': ['Choose the same squad size in match settings.','Choisissez la même taille d’équipe dans les paramètres du match.','Elige el mismo tamaño de equipo en los ajustes del partido.','Maç ayarlarında aynı kadro boyutunu seç.','Matç parametrlərində eyni heyət ölçüsünü seç.'],
  'Выбери вымышленный клуб. Сезоны, результаты, бюджет, трансферы и академия сохраняются локально в этом браузере.': ['Choose a fictional club. Seasons, results, budget, transfers and academy are saved in this browser.','Choisissez un club fictif. Les saisons, résultats, budget, transferts et académie sont sauvegardés dans ce navigateur.','Elige un club ficticio. Las temporadas, resultados, presupuesto, fichajes y academia se guardan en este navegador.','Kurgusal bir kulüp seç. Sezonlar, sonuçlar, bütçe, transferler ve akademi bu tarayıcıda kaydedilir.','Uydurma klub seç. Mövsümlər, nəticələr, büdcə, transferlər və akademiya bu brauzerdə saxlanılır.'],
  'Рейтинг': ['Rating','Note','Valoración','Puan','Reytinq'],
  'История сезонов': ['Season history','Historique des saisons','Historial de temporadas','Sezon geçmişi','Mövsüm tarixçəsi'],
  'Академия уже заполнена: максимум пять игроков.': ['The academy is full: maximum five players.','L’académie est pleine : cinq joueurs maximum.','La academia está llena: máximo cinco jugadores.','Akademi dolu: en fazla beş oyuncu.','Akademiya doludur: maksimum beş oyunçu.']
};
Object.keys(UTX_V29_TRANSLATIONS).forEach(k => {
  UTX_DICT[k] = UTX_V29_TRANSLATIONS[k];
  // Keep reverse translations in sync so changing language repeatedly never leaves stale text.
  (UTX_V29_TRANSLATIONS[k] || []).forEach(v => { if (v && v !== k) UTX_FROM[v] = k; });
});

const utxV29Style = document.createElement('style');
utxV29Style.id = 'cowballV29PolishStyle';
utxV29Style.textContent = `
/* Ultimate Team: clearer hierarchy, premium cards and mobile-friendly touch targets. */
#sc-ut{background:radial-gradient(ellipse at 82% -8%,rgba(74,123,255,.22),transparent 46%),radial-gradient(ellipse at 0% 55%,rgba(30,180,117,.12),transparent 40%),#070b12!important}
#sc-ut .utHeader{padding:8px 2px 10px;border-bottom:1px solid rgba(255,255,255,.11);margin-bottom:8px;align-items:center}
#sc-ut .utHeader .ttl{letter-spacing:.8px;text-shadow:0 2px 18px rgba(90,169,255,.22)}
#sc-ut .utHeader .sub{margin:5px 0 0;font-size:13px}
#utQuickStripV29{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:2px 0 10px;flex:0 0 auto}
.utxQuickStatV29{min-width:0;border:1px solid rgba(255,255,255,.11);border-radius:13px;padding:8px 10px;background:linear-gradient(140deg,rgba(255,255,255,.09),rgba(255,255,255,.025));}
.utxQuickStatV29 small{display:block;color:var(--mut);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.45px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.utxQuickStatV29 b{display:block;margin-top:3px;font-size:clamp(15px,3.3vw,21px);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#utTabs{position:sticky;top:0;z-index:4;margin:0 -3px 8px;padding:5px 3px 8px;background:linear-gradient(180deg,rgba(7,11,18,.98),rgba(7,11,18,.9));backdrop-filter:blur(10px)}
#utTabs button{border-radius:12px 12px 5px 5px!important;border-bottom:3px solid transparent!important;background:rgba(255,255,255,.055);font-size:clamp(13px,2.8vw,16px);padding:8px 14px}
#utTabs button.on{border-bottom-color:var(--acc)!important;background:linear-gradient(180deg,rgba(184,255,61,.16),rgba(184,255,61,.035));color:var(--acc);box-shadow:none!important}
#utBody{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.22) transparent;padding:0 2px 14px}
#utBody>.utPanel{background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.022));border-radius:18px;border-color:rgba(255,255,255,.115);padding:14px;margin:8px 0 11px}
#utBody>.utPanel>h3{display:flex;align-items:center;gap:8px;letter-spacing:.15px}
.utxClubHeroV29{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;overflow:hidden;margin:2px 0 10px;padding:16px;border:1px solid rgba(255,255,255,.15);border-radius:20px;background:radial-gradient(ellipse at 95% 5%,rgba(255,255,255,.15),transparent 44%),linear-gradient(120deg,rgba(58,134,255,.23),rgba(18,28,45,.8) 58%,rgba(184,255,61,.08));}
.utxClubHeroV29:after{content:'UT';position:absolute;right:54px;bottom:-30px;font-size:100px;line-height:1;font-weight:900;opacity:.045;pointer-events:none}
.utxClubHeroV29 .utEmblem{width:62px;height:62px;font-size:30px;position:relative;z-index:1}
.utxClubHeroV29 h2{margin:0;font-size:clamp(19px,4.4vw,28px);overflow-wrap:anywhere}
.utxClubHeroV29 p{margin:4px 0 0;color:var(--mut);font-size:12px;font-weight:700}
.utxClubHeroV29 .heroRating{text-align:center;position:relative;z-index:1}
.utxClubHeroV29 .heroRating b{display:block;font-size:30px;line-height:1;color:var(--acc)}
.utxClubHeroV29 .heroRating small{display:block;font-size:10px;color:var(--mut);font-weight:800}
.utxPacksHeroV29{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin:0 0 10px;padding:15px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:radial-gradient(ellipse at 88% 40%,rgba(186,117,255,.24),transparent 42%),linear-gradient(120deg,rgba(30,40,65,.94),rgba(9,14,25,.96));}
.utxPacksHeroV29 h2{margin:0 0 5px;font-size:clamp(20px,4.5vw,28px)}.utxPacksHeroV29 p{margin:0;color:var(--mut);font-size:12px;line-height:1.45}
.utxPackHeroIconV29{width:82px;height:92px;display:grid;place-items:center;position:relative;border:1px solid rgba(255,255,255,.33);border-radius:16px;background:linear-gradient(145deg,#a8bcff 0%,#423a8d 35%,#11172a 75%);box-shadow:inset 0 0 0 3px rgba(255,255,255,.06),0 9px 24px #0006;transform:rotate(4deg)}
.utxPackHeroIconV29:before{content:'✦';position:absolute;top:5px;right:8px;font-size:17px;color:#fff}.utxPackHeroIconV29 span{font-size:40px;text-shadow:0 4px 13px #0008}
.utxPackCardV29{position:relative;overflow:hidden;border-radius:17px!important;border:1px solid rgba(255,255,255,.13)!important;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.12),transparent 48%),linear-gradient(160deg,rgba(255,255,255,.065),rgba(255,255,255,.018))!important;padding:13px!important;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.utxPackCardV29:before{content:'';position:absolute;left:-45%;top:-35%;width:55%;height:100%;transform:rotate(28deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);pointer-events:none}
.utxPackCardV29 .rating{font-size:38px!important;filter:drop-shadow(0 5px 10px rgba(0,0,0,.3));margin:2px 0 6px}.utxPackCardV29 h3{font-size:18px!important}.utxPackCardV29 .mi.pri{width:100%;justify-content:center;min-height:46px}
.utxPackCardV29[data-pack="bronze"]{--pack-glow:#c58c58}.utxPackCardV29[data-pack="silver"]{--pack-glow:#c9d1dc}.utxPackCardV29[data-pack="gold"]{--pack-glow:#ffd35a}.utxPackCardV29[data-pack="premium"]{--pack-glow:#d59cff}.utxPackCardV29[data-pack="event"]{--pack-glow:#5df0c0}
.utxPackCardV29 .utxPackAccentV29{height:4px;border-radius:9px;margin:-2px 0 12px;background:linear-gradient(90deg,var(--pack-glow,var(--acc)),transparent);box-shadow:0 0 18px color-mix(in srgb,var(--pack-glow,var(--acc)) 45%,transparent)}
.utxPlayerCard.utxCardV29{position:relative;isolation:isolate;display:flex;flex-direction:column;gap:0;min-height:0;overflow:hidden;padding:11px;border:1px solid color-mix(in srgb,var(--rarity) 62%,rgba(255,255,255,.25));border-radius:17px!important;background:radial-gradient(ellipse at 80% 14%,color-mix(in srgb,var(--rarity) 27%,transparent),transparent 45%),linear-gradient(150deg,color-mix(in srgb,var(--rarity) 18%,#1a263b),#0a101b 74%)!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.035),0 9px 20px rgba(0,0,0,.2);transition:transform .16s ease,box-shadow .16s ease}
.utxPlayerCard.utxCardV29:before{content:'';position:absolute;z-index:-1;inset:0;background:repeating-linear-gradient(135deg,transparent 0 15px,rgba(255,255,255,.022) 15px 17px);pointer-events:none}
.utxCardTopV29{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;position:relative;z-index:1}
.utxCardTopV29 .utxRatingV29{display:flex;align-items:baseline;gap:3px}.utxRatingV29 b{font-size:clamp(27px,6vw,37px);font-weight:900;line-height:.95;color:var(--rarity);text-shadow:0 0 18px color-mix(in srgb,var(--rarity) 25%,transparent)}.utxRatingV29 small{font-size:8px;letter-spacing:.6px;color:var(--mut);font-weight:900}
.utxCardTopV29 .pos{float:none;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);font-size:11px}
.utxLimitedTagV29{display:inline-block;max-width:100%;margin-top:5px;padding:3px 6px;border-radius:5px;background:linear-gradient(90deg,#b7ffdf,#55caa3);color:#03251c;font-size:8px;font-weight:1000;letter-spacing:.45px}
.utxCardArtV29{height:98px;display:grid;grid-template-columns:minmax(0,1fr) 54px;align-items:center;gap:2px;position:relative;overflow:hidden;margin:5px -2px 2px;padding:0 3px}
.utxCardArtV29:before{content:'';position:absolute;width:114px;height:114px;right:-12px;top:-6px;border-radius:50%;border:1px solid color-mix(in srgb,var(--rarity) 38%,transparent);box-shadow:0 0 0 9px color-mix(in srgb,var(--rarity) 6%,transparent),0 0 0 20px color-mix(in srgb,var(--rarity) 4%,transparent)}
.utxCowPortraitV29{position:relative;z-index:1;display:grid;place-items:center;width:78px;height:86px;max-width:100%;font-size:54px;filter:drop-shadow(0 7px 6px rgba(0,0,0,.35));background:linear-gradient(155deg,rgba(255,255,255,.13),rgba(255,255,255,0));border-radius:14px 14px 24px 24px}
.utxCardStatMarksV29{position:relative;z-index:1;display:flex;flex-direction:column;gap:4px;text-align:right;font-size:10px;font-weight:800}.utxCardStatMarksV29 span{display:flex;justify-content:flex-end;gap:4px;align-items:center}.utxCardStatMarksV29 b{font-size:12px;color:#fff}.utxCardNameV29{position:relative;z-index:1;border-top:1px solid color-mix(in srgb,var(--rarity) 42%,transparent);padding-top:6px;margin-top:3px;font-size:clamp(14px,3.4vw,17px);font-weight:900;text-transform:uppercase;line-height:1.05;overflow-wrap:anywhere}
.utxCardMetaV29{position:relative;z-index:1;color:#c4cddd;font-size:10px;line-height:1.35;margin-top:4px;overflow-wrap:anywhere}.utxCardMetaV29 .utxMetaDot{color:var(--rarity);padding:0 3px}
.utxPlayerCard .statsline{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin-top:7px;font-size:10px}.utxPlayerCard .statsline span{background:rgba(0,0,0,.23);border:1px solid rgba(255,255,255,.055);border-radius:6px;padding:4px 3px;text-align:center;white-space:nowrap}
.utxCardActionsV29{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 0}.utxCardActionsV29 .mi{min-width:0;flex:1 1 80px;justify-content:center;font-size:12px;padding:7px 6px;min-height:38px}
.utxCardV29[data-rarity="special"]{background:radial-gradient(ellipse at 82% 15%,rgba(212,157,255,.23),transparent 42%),linear-gradient(150deg,#36234d,#0b1020 76%)!important}
.utxPlayerCard:hover{transform:translateY(-2px);box-shadow:0 13px 25px rgba(0,0,0,.28)}
.utxPacksFootV29{display:flex;gap:7px;align-items:center;flex-wrap:wrap;color:var(--mut);font-size:11px;margin-top:7px}
#utReveal{background:radial-gradient(ellipse at 50% 35%,rgba(67,91,153,.32),rgba(2,5,12,.93) 63%)!important}
#utReveal .utRevealPanel.utxRevealPanelV29{position:relative;width:min(94vw,460px);max-height:94dvh;overflow-y:auto;padding:18px;border:1px solid rgba(255,255,255,.2);border-top:3px solid var(--rarity);border-radius:24px;background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--rarity) 17%,transparent),transparent 45%),linear-gradient(150deg,rgba(22,32,52,.99),rgba(4,8,15,.99));box-shadow:0 25px 90px #000b,inset 0 1px 0 rgba(255,255,255,.08)}
.utxRevealTitleBadgeV29{display:inline-flex;align-items:center;gap:7px;padding:4px 10px;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.05);font-size:10px;letter-spacing:1px;font-weight:1000;color:var(--rarity);text-transform:uppercase}
.utxPackSceneV29{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:270px;margin:10px 0 12px;overflow:hidden;border-radius:18px;background:radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--rarity) 16%,transparent),transparent 60%)}
.utxPackRaysV29{position:absolute;inset:-35%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.13) 0deg 2deg,transparent 2deg 18deg);opacity:.24;animation:utxRaysV29 16s linear infinite;mask-image:radial-gradient(circle,#000 5%,transparent 69%)}
.utxPackRingV29{position:absolute;width:205px;height:205px;border:1px solid color-mix(in srgb,var(--rarity) 70%,transparent);border-radius:50%;box-shadow:0 0 0 13px color-mix(in srgb,var(--rarity) 7%,transparent),0 0 0 30px color-mix(in srgb,var(--rarity) 4%,transparent),0 0 35px color-mix(in srgb,var(--rarity) 17%,transparent);animation:utxRingV29 3.1s ease-in-out infinite}
.utxPackVisualV29{position:relative;z-index:1;width:142px;height:190px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:13px 9px 12px;border:1px solid rgba(255,255,255,.52);border-radius:15px 15px 19px 19px;background:linear-gradient(145deg,#fff4c1 0%,#d6ae52 12%,#7453ba 42%,#202844 73%,#0b1021 100%);box-shadow:inset 0 0 0 4px rgba(0,0,0,.15),inset 0 0 0 6px rgba(255,255,255,.10),0 14px 36px #0009;transform:rotate(-3deg);transition:transform .2s;}
.utxPackVisualV29:before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 15%,rgba(255,255,255,.45) 32%,transparent 45%);background-size:250% 100%;animation:utxFoilV29 3.2s ease-in-out infinite;pointer-events:none}
.utxPackBrandV29{position:relative;color:#fff;font-weight:1000;letter-spacing:1.7px;font-size:14px;text-shadow:0 2px 7px #000a}.utxPackMarkV29{position:relative;display:grid;place-items:center;width:78px;height:78px;border:2px solid rgba(255,255,255,.8);border-radius:50%;font-size:43px;background:radial-gradient(circle,rgba(255,255,255,.35),rgba(0,0,0,.12));box-shadow:0 0 24px rgba(255,255,255,.17)}
.utxPackLabelV29{position:relative;text-align:center;font-size:10px;font-weight:1000;letter-spacing:1.4px;line-height:1.2;color:#fff;text-shadow:0 2px 7px #000}.utxPackOpenBtnV29{width:100%;min-height:48px!important;justify-content:center!important;margin-top:5px}.utxPackSceneV29.opening .utxPackVisualV29{animation:utxPackShakeV29 .65s ease-in-out 2,utxPackBurstV29 .55s 1.05s ease-in forwards}.utxPackSceneV29.opening .utxPackRingV29{animation:utxRingBurstV29 .9s ease-out forwards}.utxPackSceneV29.opening .utxPackRaysV29{opacity:.9;animation-duration:1s}
.utxRevealResultV29{position:relative}.utxRevealResultV29.hide{display:none!important}.utxRevealResultV29 .utxPlayerCard{margin:12px auto;max-width:300px;animation:utxPlayerRiseV29 .68s cubic-bezier(.13,.82,.21,1) both;transform-origin:50% 80%}.utxRewardNoteV29{padding:9px 11px;border:1px solid color-mix(in srgb,var(--rarity) 35%,transparent);border-radius:12px;background:color-mix(in srgb,var(--rarity) 8%,transparent);font-size:12px;font-weight:800;margin:8px 0 12px}
.utxRevealActionsV29{display:flex;gap:8px;flex-wrap:wrap}.utxRevealActionsV29 .mi{flex:1;min-width:135px;min-height:46px;justify-content:center}
@keyframes utxRaysV29{to{transform:rotate(360deg)}}@keyframes utxRingV29{50%{transform:scale(1.035);opacity:.76}}
@keyframes utxFoilV29{0%,100%{background-position:100% 0}50%{background-position:-20% 0}}
@keyframes utxPackShakeV29{0%,100%{transform:rotate(-3deg) translateY(0)}20%{transform:rotate(5deg) translateX(5px)}40%{transform:rotate(-7deg) translateX(-5px)}60%{transform:rotate(6deg) translateY(-7px)}80%{transform:rotate(-5deg)}}
@keyframes utxPackBurstV29{to{opacity:0;transform:translateY(-45px) scale(1.18) rotate(13deg);filter:brightness(2.2)}}
@keyframes utxRingBurstV29{to{transform:scale(1.65);opacity:0}}
@keyframes utxPlayerRiseV29{from{opacity:0;transform:translateY(28px) rotateY(82deg) scale(.84)}65%{opacity:1;transform:translateY(-4px) rotateY(-7deg) scale(1.025)}to{opacity:1;transform:none}}
#cbTacticPresetsV29{position:fixed;z-index:75;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(94vw,660px);padding:9px;border:1px solid rgba(255,255,255,.2);border-radius:16px;background:rgba(6,12,22,.96);box-shadow:0 12px 38px #0009;backdrop-filter:blur(12px);display:none;color:#fff}
#cbTacticPresetsV29.show{display:block}#cbTacticPresetsV29 .cbtpRow{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#cbTacticPresetsV29 input,#cbTacticPresetsV29 select{min-width:0;flex:1 1 110px;min-height:40px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:#101a29;color:#fff;padding:7px 9px;font:inherit;font-size:13px}#cbTacticPresetsV29 button{min-height:40px!important;padding:7px 10px;border-radius:10px;background:rgba(255,255,255,.1);font-size:12px;font-weight:800}#cbTacticPresetsV29 button.pri{background:var(--acc);color:var(--accT)}#cbTacticPresetsV29 .cbtpTitle{font-size:11px;color:var(--mut);font-weight:900;letter-spacing:.6px;margin-bottom:6px;text-transform:uppercase}
#replayTag button{min-height:36px;white-space:nowrap}#replayTag .replayControlV29{font-size:13px;padding:5px 9px;background:rgba(5,10,18,.22);border:1px solid rgba(5,10,18,.22)}
#cbCareerV29 .cbCareerGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:9px 0}#cbCareerV29 .cbCareerTile{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.05);padding:11px}#cbCareerV29 .cbCareerTile b{display:block;font-size:19px;margin:3px 0}#cbCareerV29 .cbCareerTile small{color:var(--mut);font-size:11px}
@media(max-width:620px){#utQuickStripV29{gap:5px}.utxQuickStatV29{padding:7px 6px}.utxQuickStatV29 small{font-size:8px}.utxPacksHeroV29{grid-template-columns:minmax(0,1fr) 68px;padding:12px}.utxPackHeroIconV29{width:63px;height:76px}.utxPackHeroIconV29 span{font-size:31px}.utxPlayerCard.utxCardV29{padding:8px}.utxCardArtV29{height:82px;grid-template-columns:minmax(0,1fr) 44px}.utxCowPortraitV29{height:74px;font-size:45px}.utxCardStatMarksV29{font-size:9px}.utxCardNameV29{font-size:13px}.utxPlayerCard .statsline{font-size:9px}.utxPlayerCard .statsline span{padding:4px 2px}#utReveal .utRevealPanel.utxRevealPanelV29{padding:13px}.utxPackSceneV29{min-height:235px}.utxPackVisualV29{width:122px;height:164px}.utxPackMarkV29{width:66px;height:66px;font-size:36px}#replayTag{gap:5px;padding-left:8px;font-size:16px}}
@media(prefers-reduced-motion:reduce){.utxPackRaysV29,.utxPackRingV29,.utxPackVisualV29:before{animation:none!important}.utxPlayerCard:hover{transform:none}.utxPackSceneV29.opening .utxPackVisualV29{animation:none!important}.utxRevealResultV29 .utxPlayerCard{animation:none!important}}
html[data-anim="off"] .utxPackRaysV29,html[data-anim="off"] .utxPackRingV29,html[data-anim="off"] .utxPackVisualV29:before,html[data-anim="off"] .utxRevealResultV29 .utxPlayerCard{animation:none!important}
`;
document.head.appendChild(utxV29Style);

// Validate saved colour tokens before using them in CSS.
function utxV29Hex(value, fallback) { return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback; }

// More legible Cowball player cards: rating, role, a stylized mascot portrait, attributes and actions.
const utCardHtmlV29Base = utCardHtml;
utCardHtml = function(card, actions = true) {
  if (!card || typeof card !== 'object') return utCardHtmlV29Base(card, actions);
  const r = UT_RARITY[card.rarity] || UT_RARITY.bronze;
  const a = utxV29Hex(card.kitColor || ut.homeColor || ut.color, '#3a86ff');
  const b = utxV29Hex(card.kitColor2 || ut.awayColor, '#f1f4f8');
  const coat = utxV29Hex(card.coat, '#d8dce2');
  const stats = [['СКР',card.pac],['УД',card.sho],['ПАС',card.pas],['ДРБ',card.dri],['ЗАЩ',card.def],['ФИЗ',card.phy]];
  const safeName = utEsc(card.name || 'Игрок');
  const limited = card.seasonLimited ? `<span class="utxLimitedTagV29">✦ ${utxT('Ограниченная серия')}</span>` : '';
  const actionHtml = actions ? `<div class="utxCardActionsV29"><button class="mi" data-a="utxListDraft" data-id="${utEsc(card.uid)}">${utxT('Выставить на рынок')}</button><button class="mi" data-a="utxQuickSell" data-id="${utEsc(card.uid)}">${utxT('Быстро')}</button></div>` : '';
  return `<div class="utCard utxPlayerCard utxCardV29" data-rarity="${utEsc(card.rarity || 'bronze')}" style="--rarity:${r.color};--coat:${coat};--kit-a:${a};--kit-b:${b}">
    <div class="utxCardTopV29"><div class="utxRatingV29"><b>${Math.round(Number(card.rating)||0)}</b><small>OVR</small></div><span class="pos">${utEsc(card.pos || '—')}</span></div>
    ${limited}
    <div class="utxCardArtV29"><div class="utxCowPortraitV29" style="background:radial-gradient(circle at 50% 30%,${coat} 0 28%,transparent 29%),linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.01))" aria-hidden="true">🐮</div><div class="utxCardStatMarksV29"><span><b>${Math.round(Number(card.pac)||0)}</b> PAC</span><span><b>${Math.round(Number(card.sho)||0)}</b> SHO</span><span><b>${Math.round(Number(card.pas)||0)}</b> PAS</span><span><b>${Math.round(Number(card.dri)||0)}</b> DRI</span></div></div>
    <div class="utxCardNameV29">${safeName}</div><div class="utxCardMetaV29">${utEsc(r.label)} <span class="utxMetaDot">•</span> ${utEsc(card.nation || '—')}<br>${utEsc(card.club || 'Cowball Club')}</div>
    <div class="utxCardMetaV29"><span class="utxKitPreview ${['','rings','stripes','halves','sash'][Math.abs(+card.pattern||0)%5]}" style="--kit-a:${a};--kit-b:${b};height:16px;width:20px;margin-right:4px"></span> #${Math.max(1,Math.min(99,Number(card.num)||1))} · ${card.seasonLimited ? utxT('Сезонная серия') : utxEsc(card.eventTitle || '')}</div>
    <div class="statsline">${stats.map(([k,v])=>`<span>${k} <b>${Math.round(Number(v)||0)}</b></span>`).join('')}</div>${actionHtml}</div>`;
};

// A rotating local seasonal pack guarantees a special-design card while publishing exact odds.
UT_PACKS.event = { label: 'Сезонный пак', cost: 1400, chance: '60% золото · 40% особая · редкий сезонный дизайн' };
UTX_DICT['Сезонный пак'] = UTX_V29_TRANSLATIONS['Сезонный пак'];
UTX_DICT['Сезонный пак'] = ['Season pack','Pack saisonnier','Sobre de temporada','Sezon paketi','Mövsüm paketi'];
UTX_DICT['Редкий сезонный дизайн'] = UTX_V29_TRANSLATIONS['Редкий сезонный дизайн'];
const utRarityByRollV29Base = utRarityByRoll;
utRarityByRoll = function(roll, pack) {
  if (pack === 'event') return roll < 0.60 ? 'gold' : 'special';
  return utRarityByRollV29Base(roll, pack);
};
let utxLastOpenedPackV29 = 'gold';
let utxPendingRevealV29 = null;
let utxRevealStartedV29 = false;
let utxRevealTimerV29 = 0;

utOpenPack = function(pack) {
  const p = UT_PACKS[pack];
  if (!p) return;
  if (ut.coins < p.cost) { alert(utxT('Не хватает монет')); return; }
  ut.coins -= p.cost;
  const rarity = utRarityByRoll(Math.random(), pack);
  let pool = UT_TEMPLATES.filter(t => t.rating >= UT_RARITY[rarity].min - 8 && t.rating <= UT_RARITY[rarity].max + 5);
  if (pack === 'event') pool = pool.filter(t => t.rating >= UT_RARITY[rarity].min - 8);
  const t = pool[(Math.random() * pool.length) | 0] || UT_TEMPLATES[0];
  const card = utCardFromTemplate(t.tid, rarity);
  if (pack === 'event') {
    card.seasonLimited = true;
    card.eventId = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
    card.eventTitle = 'СЕЗОН';
  }
  const duplicate = ut.collection.find(c => c.tid === card.tid && c.rarity === card.rarity && (!card.seasonLimited || (c.seasonLimited && c.eventId === card.eventId)));
  ut.stats.packs = (Number(ut.stats.packs) || 0) + 1;
  ut.xp = (Number(ut.xp) || 0) + 20;
  let reveal = card;
  if (duplicate) {
    const coins = Math.max(25, Math.round(utPrice(card) * 0.42));
    ut.coins += coins;
    reveal = Object.assign({}, card, { duplicateConverted: true, duplicateCoins: coins });
    utxRecord('duplicate', card, coins, { source: 'pack' });
    ut.packHistory.unshift({ ts: Date.now(), pack, card: { tid: card.tid, name: card.name, rating: card.rating, rarity: card.rarity, pos: card.pos, limited: !!card.seasonLimited }, duplicate: true, coins });
  } else {
    ut.collection.push(card);
    utxRecord('pack', card, p.cost, { source: pack });
    ut.packHistory.unshift({ ts: Date.now(), pack, card: { tid: card.tid, name: card.name, rating: card.rating, rarity: card.rarity, pos: card.pos, limited: !!card.seasonLimited }, duplicate: false, coins: 0 });
  }
  ut.packHistory = (Array.isArray(ut.packHistory) ? ut.packHistory : []).slice(0, 49);
  utRefreshLevel();
  utxLastOpenedPackV29 = pack;
  saveUT();
  showUTReveal(reveal);
};

function utxPackToneV29(finalTone = false) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || (settings.vMaster | 0) <= 0 || (settings.vSfx | 0) <= 0) return;
    if (!window.__cowballUTToneV29) window.__cowballUTToneV29 = new AC();
    const ctx = window.__cowballUTToneV29;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, Math.min(.065, (Number(settings.vMaster)||80) / 100 * (Number(settings.vSfx)||85) / 100 * (finalTone ? .06 : .025))), now + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, now + (finalTone ? .65 : .42));
    gain.connect(ctx.destination);
    const notes = finalTone ? [523.25,659.25,783.99] : [220,330];
    notes.forEach((freq,i)=>{const osc=ctx.createOscillator();osc.type=finalTone?'triangle':'sine';osc.frequency.setValueAtTime(freq,now+i*.105);const g=ctx.createGain();g.gain.setValueAtTime(.0001,now+i*.105);g.gain.exponentialRampToValueAtTime(.55,now+i*.105+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.105+(finalTone ? .3 : .2));osc.connect(g);g.connect(gain);osc.start(now+i*.105);osc.stop(now+i*.105+(finalTone ? .34 : .24));});
    setTimeout(()=>{try{gain.disconnect();}catch(e){}},900);
  } catch (e) {}
}

showUTReveal = function(card) {
  utxPendingRevealV29 = card;
  utxRevealStartedV29 = false;
  if (utxRevealTimerV29) clearTimeout(utxRevealTimerV29);
  const box = $('utReveal'), panel = $('utRevealPanel');
  if (!box || !panel || !card) return;
  const rarity = UT_RARITY[card.rarity] || UT_RARITY.bronze;
  panel.style.setProperty('--rarity', rarity.color);
  const pack = UT_PACKS[utxLastOpenedPackV29] || UT_PACKS.gold;
  const packName = utxT(pack.label || 'Пак');
  const duplicateNote = card.duplicateConverted ? `${utxT('Повтор превращён в монеты')} · +${Number(card.duplicateCoins)||0} 🪙` : card.seasonLimited ? utxT('Редкий сезонный дизайн') : utxT('Добавлена в коллекцию');
  panel.classList.add('utxRevealPanelV29');
  panel.innerHTML = `<div class="utxRevealTitleBadgeV29">✦ COWBALL ULTIMATE</div>
    <h2 id="utRevealTitle" style="margin:9px 0 4px">${utxT('Новый пак готов')}</h2>
    <p class="help" id="utRevealSub" style="margin:0">${utxEsc(packName)} · ${utxT('Нажми, чтобы раскрыть')}</p>
    <div class="utxPackSceneV29" id="utxPackSceneV29" style="--rarity:${rarity.color}"><div class="utxPackRaysV29"></div><div class="utxPackRingV29"></div>
      <div class="utxPackVisualV29"><div class="utxPackBrandV29">COWBALL</div><div class="utxPackMarkV29">${utxLastOpenedPackV29==='event'?'✦':utxLastOpenedPackV29==='premium'?'🐮':utxLastOpenedPackV29==='gold'?'★':utxLastOpenedPackV29==='silver'?'✧':'♧'}</div><div class="utxPackLabelV29">ULTIMATE<br>${utxEsc(packName).toUpperCase()}</div></div>
      <div class="utxPacksFootV29" style="justify-content:center;margin-top:13px">${utxT('Вероятности')}: ${utxEsc(pack.chance)}</div>
    </div>
    <div class="utxRevealResultV29 hide" id="utxRevealResultV29"><div id="utRevealCard"></div><div class="utxRewardNoteV29" id="utxRewardNoteV29">${utxEsc(duplicateNote)}</div></div>
    <div class="utxRevealActionsV29"><button class="mi pri utxPackOpenBtnV29" id="utxRevealStartBtnV29" data-a="utxRevealStart">${utxT('Нажми, чтобы раскрыть')}</button><button class="mi" data-a="utCloseReveal">${utxT('Отмена')}</button></div>`;
  box.classList.remove('hide');
  utxTranslateDOM(box);
  const btn = $('utxRevealStartBtnV29'); if (btn) btn.focus({ preventScroll: true });
};

function utxStartRevealV29() {
  if (!utxPendingRevealV29 || utxRevealStartedV29) return;
  utxRevealStartedV29 = true;
  const box = $('utReveal'), scene = $('utxPackSceneV29'), title = $('utRevealTitle'), sub = $('utRevealSub'), btn = $('utxRevealStartBtnV29');
  if (!box || !scene || !title || !btn) return;
  scene.classList.add('opening');
  title.textContent = utxT('Вскрываем пак…');
  if (sub) sub.textContent = utxT('Редкость скоро будет раскрыта');
  btn.disabled = true; btn.textContent = utxT('Вскрываем пак…');
  utxPackToneV29(false);
  const reduced = document.documentElement.dataset.anim === 'off' || document.documentElement.dataset.anim === 'reduced' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  utxRevealTimerV29 = setTimeout(() => {
    if (!box || box.classList.contains('hide') || !utxPendingRevealV29) return;
    const card = utxPendingRevealV29, rarity = UT_RARITY[card.rarity] || UT_RARITY.bronze;
    const result = $('utxRevealResultV29'), mount = $('utRevealCard'), note = $('utxRewardNoteV29');
    if (!result || !mount) return;
    scene.classList.add('hide'); result.classList.remove('hide'); result.style.setProperty('--rarity', rarity.color);
    title.textContent = card.duplicateConverted ? utxT('Повтор превращён в монеты') : card.seasonLimited ? utxT('Сезонная карточка получена!') : utxT('Карточка получена!');
    if (sub) sub.textContent = `${utxT(rarity.label)} · ${utxT('Рейтинг состава')}: ${card.rating} · ${card.pos}`;
    mount.innerHTML = utCardHtml(card, false);
    if (note) note.textContent = card.duplicateConverted ? `${utxT('Повтор превращён в монеты')} · +${Number(card.duplicateCoins)||0} 🪙` : card.seasonLimited ? `${utxT('Ограниченная серия')} · ${utxT('Добавлена в коллекцию')}` : utxT('Добавлена в коллекцию');
    const actions = box.querySelector('.utxRevealActionsV29');
    if (actions) actions.innerHTML = `<button class="mi pri" data-a="utCloseReveal">${utxT('Забрать карточку')}</button><button class="mi" data-a="utxRevealMore">${utxT('Открыть ещё пак')}</button>`;
    panelFocusV29();
    utxPackToneV29(true);
    utxTranslateDOM(box);
  }, reduced ? 30 : 1450);
}
function panelFocusV29(){const b=$('utReveal')?.querySelector('[data-a="utCloseReveal"]');if(b)b.focus({preventScroll:true});}

// The existing base renderer is retained; these additions only enrich the visible UT layouts.
const renderUTV29Base = renderUT;
renderUT = function() {
  renderUTV29Base.apply(this, arguments);
  try {
    const sc = $('sc-ut'), header = sc && sc.querySelector('.utHeader'), body = $('utBody');
    if (!sc || !header || !body) return;
    let strip = $('utQuickStripV29');
    if (!strip) { strip = document.createElement('div'); strip.id = 'utQuickStripV29'; header.insertAdjacentElement('afterend', strip); }
    const cardsN = Array.isArray(ut.collection) ? ut.collection.length : 0;
    const levelXp = Math.max(0, Number(ut.xp)||0) % 500;
    strip.innerHTML = `<div class="utxQuickStatV29"><small>${utxT('Монеты')}</small><b>🪙 ${Math.floor(ut.coins||0).toLocaleString(utxLocale())}</b></div><div class="utxQuickStatV29"><small>${utxT('Рейтинг состава')}</small><b>${utSquadRating()}</b></div><div class="utxQuickStatV29"><small>${utxT('Карточки')}</small><b>${cardsN}</b></div><div class="utxQuickStatV29"><small>${utxT('Уровень клуба')}</small><b>${ut.level||1}<small style="display:inline;margin-left:4px">${levelXp}/500 XP</small></b></div>`;
    if (utTab === 'club' && !body.querySelector('.utxClubHeroV29')) {
      body.insertAdjacentHTML('afterbegin', `<div class="utxClubHeroV29"><span class="utEmblem ${ut.badgeShape||'shield'}" style="--ut-club-color:${utxV29Hex(ut.homeColor||ut.color,'#3a86ff')};background:${utxV29Hex(ut.homeColor||ut.color,'#3a86ff')}">${utEsc(ut.badge||'🐮')}</span><div><h2>${utEsc(ut.name||'Молочный клуб')}</h2><p>${utxT('Дивизион')} ${ut.division||10} · ${cardsN} ${utxT('Карточки').toLowerCase()} · ${utxT('Клубная химия')} ${utChemistry()}%</p></div><div class="heroRating"><b>${utSquadRating()}</b><small>OVR</small></div></div>`);
    }
    if (utTab === 'packs') {
      const notice = body.querySelector(':scope > .utNotice');
      if (notice && !body.querySelector('.utxPacksHeroV29')) notice.insertAdjacentHTML('beforebegin', `<div class="utxPacksHeroV29"><div><h2>${utxT('Паки')} · ${utxT('Сезонный пак')}</h2><p>${utxT('Открывай пак, смотри анимацию выхода карточки и забирай игрока в коллекцию.')}<br>${utxT('Вероятности')} показаны перед покупкой. Дубликаты конвертируются в монеты.</p></div><div class="utxPackHeroIconV29"><span>🐮</span></div></div>`);
      body.querySelectorAll(':scope > .utGrid > .utPanel').forEach(panel=>{const btn=panel.querySelector('[data-a="utPack"]');if(!btn)return;panel.classList.add('utxPackCardV29');panel.dataset.pack=btn.dataset.v||'';if(!panel.querySelector('.utxPackAccentV29')){const h=panel.querySelector('h3');if(h)h.insertAdjacentHTML('beforebegin','<div class="utxPackAccentV29"></div>');}});
    }
    if (utTab === 'squad') {
      const pitch = body.querySelector('.utPitch');
      if (pitch && !body.querySelector('.utxChemistryPanelV29')) pitch.insertAdjacentHTML('beforebegin', `<div class="utPanel utxChemistryPanelV29"><h3>${utxT('Клубная химия')} · ${utChemistry()}%</h3><div class="utProgress"><i style="width:${utChemistry()}%"></i></div><p class="help">Игроки из одной страны, лиги или клуба получают лучшие связи в общей схеме. Меняй карточки и проверяй химию до выхода на матч.</p></div>`);
    }
    utxTranslateDOM(body);
  } catch (e) { console.warn('UT layout polish:', e); }
};

// Replay controls: pause/continue and speed presets operate on the existing recorded replay frames.
let replayPausedV29 = false;
let replaySpeedV29 = 1;
function updateReplayControlsV29() {
  const p = $('replayPauseV29'), s = $('replaySpeedV29');
  if (p) { p.textContent = replayPausedV29 ? '▶' : 'Ⅱ'; p.title = utxT(replayPausedV29 ? 'Продолжить повтор' : 'Пауза повтора'); p.setAttribute('aria-label', p.title); }
  if (s) { s.textContent = `${replaySpeedV29}×`; s.title = utxT('Скорость повтора'); s.setAttribute('aria-label', s.title); }
}
if ($('replayTag') && !$('replayPauseV29')) $('replayTag').insertAdjacentHTML('afterbegin', '<button class="replayControlV29" id="replayPauseV29" data-a="replayPauseV29" aria-label="Пауза повтора">Ⅱ</button><button class="replayControlV29" id="replaySpeedV29" data-a="replaySpeedV29" aria-label="Скорость повтора">1×</button>');
const startReplayV29Base = startReplay;
startReplay = function() { replayPausedV29 = false; replaySpeedV29 = 1; updateReplayControlsV29(); return startReplayV29Base.apply(this, arguments); };
const endReplayV29Base = endReplay;
endReplay = function() { replayPausedV29 = false; replaySpeedV29 = 1; updateReplayControlsV29(); return endReplayV29Base.apply(this, arguments); };
const stepGameV29Base = stepGame;
stepGame = function(dt) { if (state === 'replay') { if (replayPausedV29) return; return stepGameV29Base.call(this, dt * replaySpeedV29); } return stepGameV29Base.call(this, dt); };

// Save up to eight formation/style presets directly from the existing Kick-off tactics screen.
settings.tacticalPresetsV29 = Array.isArray(settings.tacticalPresetsV29) ? settings.tacticalPresetsV29.filter(p=>p&&typeof p==='object') : [];
let tacticPresetWidgetV29 = null;
function renderTacticPresetWidgetV29() {
  const ov = $('tacOv');
  if (!ov) { if (tacticPresetWidgetV29) tacticPresetWidgetV29.remove(); tacticPresetWidgetV29 = null; return; }
  if (!tacticPresetWidgetV29) { tacticPresetWidgetV29 = document.createElement('div'); tacticPresetWidgetV29.id='cbTacticPresetsV29'; document.body.appendChild(tacticPresetWidgetV29); }
  const tabs = Array.from(ov.querySelectorAll('.kotabs button'));
  const onTab = tabs.findIndex(b=>b.classList.contains('on'));
  if (onTab !== 1) { tacticPresetWidgetV29.classList.remove('show'); return; }
  const presets = settings.tacticalPresetsV29;
  tacticPresetWidgetV29.classList.add('show');
  tacticPresetWidgetV29.innerHTML = `<div class="cbtpTitle">${utxT('Сохранённые тактики')} · ${presets.length}/8</div><div class="cbtpRow"><input id="cbtpNameV29" maxlength="22" placeholder="${utxT('Название тактики')}" aria-label="Название тактики"><button class="pri" data-cbtac="save">${utxT('Сохранить тактику')}</button></div><div class="cbtpRow" style="margin-top:6px"><select id="cbtpPickV29" aria-label="${utxT('Сохранённые тактики')}">${presets.map((p,i)=>`<option value="${i}">${utEsc(p.name)} · ${utEsc(p.form||'—')} · ${utEsc(p.style||'bal')}</option>`).join('')||`<option value="">${utxT('Пусто')}</option>`}</select><button data-cbtac="load">${utxT('Загрузить тактику')}</button><button data-cbtac="delete">${utxT('Удалить тактику')}</button></div>`;
  utxTranslateDOM(tacticPresetWidgetV29);
}
const tacticPresetObserverV29 = new MutationObserver(records=>{
  // Ignore mutations caused by rebuilding the widget itself; otherwise observing
  // document.body would cause a self-triggering MutationObserver loop.
  if (records.length && records.every(r=>tacticPresetWidgetV29 && (r.target===tacticPresetWidgetV29 || tacticPresetWidgetV29.contains(r.target)))) return;
  renderTacticPresetWidgetV29();
});
tacticPresetObserverV29.observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',function(e){
  const btn=e.target.closest('[data-cbtac]');if(!btn)return;
  const op=btn.dataset.cbtac, sel=$('cbtpPickV29'), idx=sel?Number(sel.value):-1;
  if(op==='save') {
    const form=$('tacOv')?.querySelector('.fb.on')?.dataset.f||'';
    const style=$('tacOv')?.querySelector('.sty button.on[data-s]')?.dataset.s||'bal';
    const size=Number(settings.size)||5;
    if(!form){alert(utxT('На этой схеме нет сохранённой расстановки.')+' '+utxT('Выбери 5×5 или 11×11 и открой вкладку «Команда».'));return;}
    const name=String(($('cbtpNameV29')&&$('cbtpNameV29').value)||`Тактика ${settings.tacticalPresetsV29.length+1}`).trim().slice(0,22)||`Тактика ${settings.tacticalPresetsV29.length+1}`;
    const entry={name,form,style,size,kitA:0,updated:Date.now()};
    const old=settings.tacticalPresetsV29.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
    if(old>=0)settings.tacticalPresetsV29[old]=entry;else if(settings.tacticalPresetsV29.length<8)settings.tacticalPresetsV29.push(entry);else{alert(utxT('Можно сохранить максимум 8 тактик. Удали одну и попробуй снова.'));return;}
    save();renderTacticPresetWidgetV29();
  } else if(op==='load') {
    const p=settings.tacticalPresetsV29[idx];if(!p)return;
    if(Number(p.size)!==Number(settings.size)){alert(utxT('Тактика сохранена для')+' '+p.size+'×'+p.size+'. '+utxT('В настройках матча выбери такой размер состава.'));return;}
    settings.formation=p.form;settings.style=p.style||'bal';save();
    const f=$('tacOv')?.querySelector(`.fb[data-f="${CSS.escape(p.form)}"]`);if(f)f.click();
    setTimeout(()=>{const s=$('tacOv')?.querySelector(`.sty button[data-s="${CSS.escape(p.style||'bal')}"]`);if(s)s.click();renderTacticPresetWidgetV29();},20);
  } else if(op==='delete') {
    if(idx<0||!settings.tacticalPresetsV29[idx])return;
    settings.tacticalPresetsV29.splice(idx,1);save();renderTacticPresetWidgetV29();
  }
  e.preventDefault();e.stopPropagation();
},true);

// Career mode now has a local transfer market, a youth academy, and claimable board objectives.
const CAREER_MARKET_V29 = [
  {id:'cm-gale',name:'Рико Ветролап',pos:'НАП',rating:78,fee:1850,spd:4,pow:4,def:1},
  {id:'cm-moss',name:'Эмиль Мохов',pos:'ЦП',rating:74,fee:1450,spd:3,pow:3,def:3},
  {id:'cm-ridge',name:'Тео Хребтов',pos:'ЗЩ',rating:76,fee:1600,spd:3,pow:3,def:4},
  {id:'cm-north',name:'Кай Северин',pos:'ВРТ',rating:75,fee:1500,spd:2,pow:2,def:4},
  {id:'cm-rain',name:'Милан Дождев',pos:'ПЗ',rating:72,fee:1250,spd:4,pow:3,def:2},
  {id:'cm-clover',name:'Лука Клевер',pos:'НАП',rating:81,fee:2300,spd:4,pow:4,def:1},
  {id:'cm-stone',name:'Борис Камнёв',pos:'ЗЩ',rating:79,fee:2050,spd:2,pow:4,def:5},
  {id:'cm-river',name:'Арно Речников',pos:'ЦП',rating:77,fee:1800,spd:4,pow:3,def:3}
];
const CAREER_YOUTH_NAMES_V29=['Нико Полянский','Адам Луговой','Саша Клеверин','Ильяс Берёзов','Реми Травкин','Марк Рогов','Тим Листьев','Дан Северко'];
function careerEnsureV29() {
  const ca=settings.career;if(!ca||!ca.clubId)return null;
  if(!Number.isFinite(Number(ca.budget)))ca.budget=5500;
  if(!Array.isArray(ca.roster))ca.roster=[];
  if(!Array.isArray(ca.academy))ca.academy=[];
  if(!Array.isArray(ca.transfers))ca.transfers=[];
  if(!Number.isFinite(Number(ca.seasonMatches)))ca.seasonMatches=0;
  if(!Number.isFinite(Number(ca.seasonWins)))ca.seasonWins=0;
  if(!Number.isFinite(Number(ca.seasonDraws)))ca.seasonDraws=0;
  if(!Number.isFinite(Number(ca.seasonGoals)))ca.seasonGoals=0;
  if(!Number.isFinite(Number(ca.seasonConceded)))ca.seasonConceded=0;
  if(!Number.isFinite(Number(ca.seasonPoints)))ca.seasonPoints=0;
  return ca;
}
function careerV29Render(tab='overview') {
  const pool=TEAMS.filter(t=>!t.nation&&!t.league), old=settings.career||{}, ca=careerEnsureV29();
  const chosen=pool.some(t=>t.id===old.clubId)?old.clubId:(pool.some(t=>t.id===settings.myTeam)?settings.myTeam:(pool[0]&&pool[0].id));
  const select=`<label for="careerClubV29">${utxT('Клуб карьеры')}</label><select id="careerClubV29">${pool.map(t=>`<option value="${utEsc(t.id)}" ${t.id===chosen?'selected':''}>${utEsc(t.name)}</option>`).join('')}</select>`;
  const nav=`<div class="cbCareerGrid"><button class="mi ${tab==='overview'?'pri':''}" data-a="careerViewV29" data-v="overview">${utxT('Обзор')}</button><button class="mi ${tab==='market'?'pri':''}" data-a="careerViewV29" data-v="market">${utxT('Трансферы')}</button><button class="mi ${tab==='academy'?'pri':''}" data-a="careerViewV29" data-v="academy">${utxT('Академия')}</button><button class="mi ${tab==='board'?'pri':''}" data-a="careerViewV29" data-v="board">${utxT('Цели совета')}</button></div>`;
  let body='';
  if(!ca) {
    body=`<div class="cbFeatureStat">${utxT('Выбери вымышленный клуб. Сезоны, результаты, бюджет, трансферы и академия сохраняются локально в этом браузере.')}</div>${select}<button class="mi pri" data-a="careerStartV29">${utxT('Старт карьеры')}</button><button class="mi" data-a="careerHistory">${utxT('История сезонов')}</button>`;
  } else if(tab==='overview') {
    const active=settings.comp&&!settings.comp.done;
    body=`<div class="cbCareerGrid"><div class="cbCareerTile"><small>${utxT('Сезон')}</small><b>${ca.season||1}</b><small>${utEsc((teamById(ca.clubId)||{}).name||ca.clubId)}</small></div><div class="cbCareerTile"><small>${utxT('Бюджет')}</small><b>🪙 ${Math.floor(ca.budget).toLocaleString(utxLocale())}</b><small>${utxT('Локальные деньги клуба')}</small></div><div class="cbCareerTile"><small>${utxT('Победы в сезоне')}</small><b>${ca.seasonWins||0}</b><small>${ca.seasonMatches||0} ${utxT('Матчей').toLowerCase()}</small></div><div class="cbCareerTile"><small>${utxT('Состав')}</small><b>${ca.roster.length}</b><small>${utxT('подписанных игроков')}</small></div></div>
      <div class="cbFeatureStat">${utxT('Трансферы дают бонусы скорости, удара и защиты в матчах карьеры. Молодые игроки из академии могут развиваться тренировками.')}</div>
      ${active?`<button class="mi pri" data-a="careerContinueV29">${utxT('Продолжить сезон')}</button>`:`<button class="mi pri" data-a="careerStartV29">${utxT(ca.season?'Начать следующий сезон':'Старт карьеры')}</button>`}
      <button class="mi" data-a="careerHistory">${utxT('История сезонов')}</button>`;
  } else if(tab==='market') {
    body=`<div class="cbFeatureStat">${utxT('Подписывай игроков за бюджет клуба. Подписанные игроки повышают общие характеристики команды в последующих матчах карьеры.')}</div><div class="cbCareerGrid">${CAREER_MARKET_V29.map(p=>{const signed=ca.roster.some(x=>x.id===p.id);return `<div class="cbCareerTile"><small>${utEsc(p.pos)} · ${utxT('Рейтинг').toLowerCase()}</small><b>${p.rating}</b><strong>${utEsc(p.name)}</strong><p class="cbFeatureStat">⚡ ${p.spd} · ⚽ ${p.pow} · 🛡 ${p.def}</p><p>🪙 ${p.fee}</p><button class="mi ${signed?'':'pri'}" data-a="careerBuyPlayerV29" data-id="${p.id}" ${signed||ca.budget<p.fee?'disabled':''}>${signed?utxT('Уже в клубе'):utxT('Купить игрока')}</button></div>`;}).join('')}</div><h3>${utxT('История трансферов')}</h3>${ca.transfers.slice(0,12).map(t=>`<div class="cbFeatureCard"><b>${utEsc(t.name)}</b><div class="cbFeatureStat">${utxT(t.kind)} · ${utEsc(t.date)} · ${t.fee?'-'+t.fee:'академия'}</div></div>`).join('')||`<p class="cbFeatureStat">${utxT('Пока нет трансферов.')}</p>`}`;
  } else if(tab==='academy') {
    body=`<div class="cbFeatureStat">${utxT('Создавай молодых игроков, тренируй их и подписывай в основную команду. Академия ограничена пятью игроками.')}</div><button class="mi pri" data-a="careerYouthCreateV29" ${ca.academy.length>=5?'disabled':''}>${utxT('Создать молодого игрока')}</button><div class="cbCareerGrid">${ca.academy.map(p=>`<div class="cbCareerTile"><small>${utxT('Молодой игрок')} · ${utEsc(p.pos)}</small><b>${p.rating}</b><strong>${utEsc(p.name)}</strong><p class="cbFeatureStat">${utxT('Потенциал')} ${p.potential} · ${utxT('тренировка')}: 🪙 220</p><button class="mi" data-a="careerYouthTrainV29" data-id="${p.id}" ${ca.budget<220||p.rating>=p.potential?'disabled':''}>${utxT('Тренировать +1')}</button><button class="mi pri" data-a="careerYouthSignV29" data-id="${p.id}" ${ca.budget<Math.round(p.rating*8)?'disabled':''}>${utxT('Подписать в основу')} · 🪙 ${Math.round(p.rating*8)}</button></div>`).join('')||`<div class="cbCareerTile">${utxT('Академия пока пустая.')}</div>`}</div>`;
  } else {
    const wins=Number(ca.seasonWins)||0, goals=Number(ca.seasonGoals)||0, ready=wins>=6&&goals>=18, claimed=ca.boardClaimedSeason===(ca.season||1);
    body=`<div class="cbFeatureStat">${utxT('Совет ждёт от клуба не менее 6 побед и 18 забитых голов за сезон. Награда за обе цели — 1 500 монет в бюджет.')}</div><div class="cbCareerTile"><small>${utxT('Победы')} · ${utxT('цель')} 6</small><b>${wins}/6</b><div class="utProgress"><i style="width:${Math.min(100,wins/6*100)}%"></i></div></div><div class="cbCareerTile"><small>${utxT('Забитые голы')} · ${utxT('цель')} 18</small><b>${goals}/18</b><div class="utProgress"><i style="width:${Math.min(100,goals/18*100)}%"></i></div></div><button class="mi ${ready&&!claimed?'pri':''}" data-a="careerClaimBoardV29" ${!ready||claimed?'disabled':''}>${claimed?utxT('Награда уже получена'):utxT('Забрать награду совета')} · 🪙 1500</button>`;
  }
  cbOpenModal('career',utxT('Карьера клуба'),`<div id="cbCareerV29">${ca?`<div class="cbFeatureStat">${utxT('Сезоны, трансферы, академия и цели совета')}</div>${nav}`:''}${body}<button class="mi" data-a="featureClose">${utxT('Отмена')}</button></div>`);
  utxTranslateDOM($('cbFeatureModal'));
}
ACT.career = function(){ careerV29Render('overview'); };
ACT.careerViewV29 = function(d){ careerV29Render(['overview','market','academy','board'].includes(d.v)?d.v:'overview'); };
ACT.careerStartV29 = function(){
  const pool=TEAMS.filter(t=>!t.nation&&!t.league), sel=$('careerClubV29'), id=sel&&sel.value;
  if(!pool.some(t=>t.id===id))return;
  const prev=settings.career&&settings.career.clubId===id?careerEnsureV29():null;
  const old=settings.career||{};
  const ca=prev||{clubId:id,season:0,titles:old.titles||0,points:old.points||0,history:Array.isArray(old.history)?old.history:[],recordedSeason:old.recordedSeason||0,budget:5500,roster:[],academy:[],transfers:[],seasonMatches:0,seasonWins:0,seasonDraws:0,seasonGoals:0,seasonConceded:0,seasonPoints:0};
  if(settings.comp&&!settings.comp.done&&settings.comp.my===id){comp=settings.comp;cbCloseModal();enterHub();return;}
  ca.clubId=id;ca.season=(Number(ca.season)||0)+1;ca.seasonMatches=0;ca.seasonWins=0;ca.seasonDraws=0;ca.seasonGoals=0;ca.seasonConceded=0;ca.seasonPoints=0;ca.boardClaimedSeason=0;
  settings.career=ca;settings.myTeam=id;comp=newComp('league',id);settings.comp=comp;save();cbCloseModal();hubTab=0;enterHub();
};
ACT.careerContinueV29 = function(){if(!settings.comp||settings.comp.done){careerV29Render('overview');return;}comp=settings.comp;cbCloseModal();enterHub();};
ACT.careerBuyPlayerV29 = function(d){
  const ca=careerEnsureV29(),p=CAREER_MARKET_V29.find(x=>x.id===d.id);if(!ca||!p){alert(utxT('Нужна активная карьера'));return;}
  if(ca.roster.some(x=>x.id===p.id)){alert(utxT('Этот игрок уже подписан'));careerV29Render('market');return;}
  if(ca.budget<p.fee){alert(utxT('Не хватает бюджета'));careerV29Render('market');return;}
  ca.budget-=p.fee;ca.roster.push(Object.assign({},p,{kind:'transfer',signedSeason:ca.season}));ca.transfers.unshift({id:p.id,name:p.name,kind:'Трансфер',fee:p.fee,date:new Date().toLocaleDateString(utxLocale())});save();careerV29Render('market');
};
ACT.careerYouthCreateV29 = function(){
  const ca=careerEnsureV29();if(!ca){alert(utxT('Нужна активная карьера'));return;}if(ca.academy.length>=5){alert(utxT('Академия уже заполнена: максимум пять игроков.'));return;}
  const positions=['ВРТ','ЗЩ','ПЗ','ЦП','НАП'],name=CAREER_YOUTH_NAMES_V29[(Math.random()*CAREER_YOUTH_NAMES_V29.length)|0],id='youth_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,5);
  ca.academy.push({id,name,pos:positions[(Math.random()*positions.length)|0],rating:54+((Math.random()*9)|0),potential:72+((Math.random()*9)|0),created:Date.now()});save();careerV29Render('academy');
};
ACT.careerYouthTrainV29 = function(d){const ca=careerEnsureV29(),p=ca&&ca.academy.find(x=>x.id===d.id);if(!p)return;if(ca.budget<220||p.rating>=p.potential)return;ca.budget-=220;p.rating=Math.min(p.potential,p.rating+1);save();careerV29Render('academy');};
ACT.careerYouthSignV29 = function(d){const ca=careerEnsureV29(),i=ca&&ca.academy.findIndex(x=>x.id===d.id);if(!ca||i<0)return;const p=ca.academy[i],fee=Math.round(p.rating*8);if(ca.budget<fee){alert(utxT('Не хватает бюджета'));return;}ca.budget-=fee;ca.roster.push({id:p.id,name:p.name,pos:p.pos,rating:p.rating,fee,kind:'academy',spd:Math.min(5,Math.round(p.rating/17)),pow:Math.min(5,Math.round(p.rating/18)),def:Math.min(5,Math.round(p.rating/17)),signedSeason:ca.season});ca.transfers.unshift({id:p.id,name:p.name,kind:'Академия',fee,date:new Date().toLocaleDateString(utxLocale())});ca.academy.splice(i,1);save();careerV29Render('academy');};
ACT.careerClaimBoardV29 = function(){const ca=careerEnsureV29();if(!ca)return;const ready=(ca.seasonWins||0)>=6&&(ca.seasonGoals||0)>=18;if(!ready||ca.boardClaimedSeason===ca.season){careerV29Render('board');return;}ca.boardClaimedSeason=ca.season;ca.budget=(Number(ca.budget)||0)+1500;ca.points=(Number(ca.points)||0)+1500;save();careerV29Render('board');};

// Count only actual career league games toward board objectives.
const onMatchEndV29CareerBase = onMatchEnd;
onMatchEnd = function(res) {
  try {
    const ca=careerEnsureV29(),cfg=res&&res.cfg,sc=res&&res.score;
    if(ca&&cfg&&cfg.comp&&cfg.tA&&cfg.tA.id===ca.clubId&&Array.isArray(sc)&&sc.length>=2){
      ca.seasonMatches=(Number(ca.seasonMatches)||0)+1;ca.seasonGoals=(Number(ca.seasonGoals)||0)+Math.max(0,Number(sc[0])||0);ca.seasonConceded=(Number(ca.seasonConceded)||0)+Math.max(0,Number(sc[1])||0);
      if(sc[0]>sc[1]){ca.seasonWins=(Number(ca.seasonWins)||0)+1;ca.seasonPoints=(Number(ca.seasonPoints)||0)+3;}else if(sc[0]===sc[1]){ca.seasonDraws=(Number(ca.seasonDraws)||0)+1;ca.seasonPoints=(Number(ca.seasonPoints)||0)+1;}
      save();
    }
  } catch(e) {}
  return onMatchEndV29CareerBase.apply(this,arguments);
};
const startMatchV29CareerBase = startMatch;
startMatch = function(cfg) {
  try {
    const ca=careerEnsureV29();
    if(ca&&cfg&&cfg.comp&&cfg.tA&&cfg.tA.id===ca.clubId&&ca.roster&&ca.roster.length){
      const avg=ca.roster.reduce((s,p)=>s+(Number(p.rating)||60),0)/ca.roster.length;
      const boost=clamp(Math.round((avg-65)/11),0,2);
      cfg=Object.assign({},cfg,{tA:Object.assign({},cfg.tA,{spd:clamp((Number(cfg.tA.spd)||3)+boost,1,5),pow:clamp((Number(cfg.tA.pow)||3)+boost,1,5),def:clamp((Number(cfg.tA.def)||3)+Math.max(0,boost-1),1,5)})});
    }
  } catch(e) {}
  return startMatchV29CareerBase.call(this,cfg);
};

// UT actions for the staged reveal and replay controls.
Object.assign(ACT, {
  utxRevealStart(){utxStartRevealV29();},
  utxRevealMore(){const box=$('utReveal');if(utxRevealTimerV29)clearTimeout(utxRevealTimerV29);if(box)box.classList.add('hide');utxPendingRevealV29=null;utxRevealStartedV29=false;utTab='packs';renderUT();show('ut');},
  utCloseReveal(){if(utxRevealTimerV29)clearTimeout(utxRevealTimerV29);utxRevealTimerV29=0;const box=$('utReveal');if(box)box.classList.add('hide');utxPendingRevealV29=null;utxRevealStartedV29=false;},
  replayPauseV29(){replayPausedV29=!replayPausedV29;updateReplayControlsV29();},
  replaySpeedV29(){replaySpeedV29=replaySpeedV29===1?0.5:replaySpeedV29===0.5?2:1;updateReplayControlsV29();}
});

// Cleanly restore the overlay and update accessibility labels after language changes.
const utxApplyLanguageV29Base = utxApplyLanguage;
utxApplyLanguage = function(){
  utxApplyLanguageV29Base.apply(this,arguments);
  const revealBox = $('utReveal');
  if (utxPendingRevealV29 && revealBox && !revealBox.classList.contains('hide')) {
    // Rebuild only before the user starts opening; preserve an in-progress reveal and its timer.
    if (!utxRevealStartedV29) showUTReveal(utxPendingRevealV29);
    else utxTranslateDOM(revealBox);
  }
  renderTacticPresetWidgetV29(); updateReplayControlsV29();
};

// ================== v30: save portability, migration safety and interaction polish ==================
const UTX_V30_TRANSLATIONS = {
  'Сохранение и резервная копия': ['Save & backup','Sauvegarde et copie','Guardar y copia','Kayıt ve yedek','Yaddaş və ehtiyat nüsxə'],
  'Экспорт сохранения': ['Export save','Exporter la sauvegarde','Exportar guardado','Kaydı dışa aktar','Yaddaşı ixrac et'],
  'Импорт сохранения': ['Import save','Importer la sauvegarde','Importar guardado','Kaydı içe aktar','Yaddaşı idxal et'],
  'Сохранение включает настройки, турниры, карьеру и клуб Ultimate Team. Храни файл в безопасном месте.': ['The backup includes settings, tournaments, career and Ultimate Team. Keep the file somewhere safe.','La sauvegarde inclut les paramètres, tournois, carrière et Ultimate Team. Conservez le fichier en lieu sûr.','La copia incluye ajustes, torneos, carrera y Ultimate Team. Guarda el archivo en un lugar seguro.','Yedek; ayarları, turnuvaları, kariyeri ve Ultimate Team’i içerir. Dosyayı güvenli bir yerde sakla.','Ehtiyat nüsxəyə parametrlər, turnirlər, karyera və Ultimate Team daxildir. Faylı təhlükəsiz yerdə saxla.'],
  'Сохранение экспортировано.': ['Save exported.','Sauvegarde exportée.','Guardado exportado.','Kayıt dışa aktarıldı.','Yaddaş ixrac edildi.'],
  'Файл сохранения не подходит для Cowball.': ['This backup file is not valid for Cowball.','Ce fichier de sauvegarde n’est pas valide pour Cowball.','Este archivo no es válido para Cowball.','Bu yedek dosyası Cowball için geçerli değil.','Bu ehtiyat faylı Cowball üçün uyğun deyil.'],
  'Импорт заменит текущий прогресс Cowball. Продолжить?': ['Importing will replace current Cowball progress. Continue?','L’importation remplacera la progression actuelle de Cowball. Continuer ?','Importar reemplazará el progreso actual de Cowball. ¿Continuar?','İçe aktarma mevcut Cowball ilerlemesinin üzerine yazacak. Devam edilsin mi?','İdxal cari Cowball irəliləyişini əvəz edəcək. Davam edilsin?'],
  'Файл слишком большой или не читается.': ['The file is too large or cannot be read.','Le fichier est trop volumineux ou illisible.','El archivo es demasiado grande o no se puede leer.','Dosya çok büyük veya okunamıyor.','Fayl çox böyükdür və ya oxunmur.'],
  'Не удалось импортировать сохранение. Проверь файл и попробуй снова.': ['Could not import this save. Check the file and try again.','Impossible d’importer cette sauvegarde. Vérifiez le fichier et réessayez.','No se pudo importar. Revisa el archivo e inténtalo de nuevo.','Kayıt içe aktarılamadı. Dosyayı kontrol edip tekrar dene.','Yaddaşı idxal etmək olmadı. Faylı yoxlayıb yenidən cəhd et.']
};
Object.keys(UTX_V30_TRANSLATIONS).forEach(k => {
  UTX_DICT[k] = UTX_V30_TRANSLATIONS[k];
  UTX_V30_TRANSLATIONS[k].forEach(v => { if (v && v !== k) UTX_FROM[v] = k; });
});

// ================== v31: recoverable local saves ==================
const UTX_V31_TRANSLATIONS = {
  'Восстановить резервную копию': ['Restore backup','Restaurer la sauvegarde','Restaurar copia','Yedeği geri yükle','Ehtiyat nüsxəni bərpa et'],
  'Резервная копия восстановлена. Игра перезапустится.': ['Backup restored. The game will reload.','Sauvegarde restaurée. Le jeu va redémarrer.','Copia restaurada. El juego se reiniciará.','Yedek geri yüklendi. Oyun yeniden yüklenecek.','Ehtiyat nüsxə bərpa edildi. Oyun yenidən açılacaq.'],
  'Резервной копии пока нет. Сначала сыграй или сохрани изменения.': ['No backup yet. Play or save changes first.','Aucune sauvegarde disponible. Jouez ou enregistrez des changements.','Todavía no hay copia. Juega o guarda los cambios primero.','Henüz yedek yok. Önce oyna veya değişiklikleri kaydet.','Hələ ehtiyat nüsxə yoxdur. Əvvəl oyna və ya dəyişiklikləri saxla.'],
  'Будет восстановлена предыдущая версия сохранения. Текущий прогресс сначала сохранится в отдельную копию. Продолжить?': ['The previous save will be restored. Current progress will first be saved separately. Continue?','La sauvegarde précédente sera restaurée. La progression actuelle sera d’abord copiée séparément. Continuer ?','Se restaurará la copia anterior. El progreso actual se guardará primero por separado. ¿Continuar?','Önceki kayıt geri yüklenecek. Mevcut ilerleme önce ayrı bir kopyaya kaydedilecek. Devam edilsin mi?','Əvvəlki yaddaş bərpa ediləcək. Cari irəliləyiş öncə ayrıca saxlanacaq. Davam edilsin?'],
  'Резервная копия восстановлена после ошибки сохранения.': ['A backup was recovered after a save error.','Une sauvegarde a été récupérée après une erreur.','Se recuperó una copia tras un error de guardado.','Kayıt hatasından sonra yedek kurtarıldı.','Yaddaş xətasından sonra ehtiyat nüsxə bərpa olundu.']
};
Object.keys(UTX_V31_TRANSLATIONS).forEach(k => {
  UTX_DICT[k] = UTX_V31_TRANSLATIONS[k];
  UTX_V31_TRANSLATIONS[k].forEach(v => { if (v && v !== k) UTX_FROM[v] = k; });
});

// Upgrade saves defensively without discarding legitimate existing club data.
const normalizeUTV30Base = normalizeUT;
normalizeUT = function (source) {
  const data = normalizeUTV30Base(source);
  data.stats = Object.assign({played:0,wins:0,draws:0,losses:0,goals:0,conceded:0,packs:0,bought:0,sold:0,cupWins:0,divPlayed:0,divWins:0,divLosses:0,cupRun:0,best:0,purchases:[],sales:[]}, data.stats && typeof data.stats === 'object' ? data.stats : {});
  ['purchases','sales'].forEach(k => { if (!Array.isArray(data.stats[k])) data.stats[k] = []; });
  if (!Array.isArray(data.collection)) data.collection = [];
  const seen = new Set();
  data.collection = data.collection.filter(Boolean).map((card, i) => {
    if (typeof card !== 'object') card = utCardFromTemplate(0, 'bronze');
    const found = UT_TEMPLATES.find(t => t.name === card.name);
    const tid = Number.isFinite(Number(card.tid)) ? clamp(Math.trunc(Number(card.tid)), 0, UT_TEMPLATES.length - 1) : (found ? found.tid : 0);
    card.tid = tid;
    const template = UT_TEMPLATES[tid] || UT_TEMPLATES[0];
    if (!card.uid || seen.has(String(card.uid))) card.uid = utNewId();
    card.uid = String(card.uid); seen.add(card.uid);
    card.rating = clamp(Math.round(Number(card.rating) || template.rating || 60), 1, 99);
    if (!UT_RARITY[card.rarity]) card.rarity = card.rating >= 85 ? 'special' : card.rating >= 75 ? 'gold' : card.rating >= 65 ? 'silver' : 'bronze';
    if (!['ВРТ','ЗЩ','ПЗ','ЦП','НАП'].includes(card.pos)) card.pos = template.pos;
    card.name = String(card.name || template.name).slice(0, 40);
    card.nation = String(card.nation || template.nation).slice(0, 32);
    card.club = String(card.club || template.club).slice(0, 40);
    for (const k of ['pac','sho','pas','dri','def','phy']) card[k] = clamp(Math.round(Number(card[k]) || card.rating), 1, 99);
    card.gk = clamp(Math.round(Number(card.gk) || (card.pos === 'ВРТ' ? card.rating : 0)), 0, 99);
    return card;
  });
  if (!Array.isArray(data.lineup)) data.lineup = [];
  if (!Array.isArray(data.bench)) data.bench = [];
  if (!Array.isArray(data.market)) data.market = [];
  if (!Array.isArray(data.packHistory)) data.packHistory = [];
  if (!Array.isArray(data.marketHistory)) data.marketHistory = [];
  if (!Array.isArray(data.userListings)) data.userListings = [];
  if (!Array.isArray(data.myBids)) data.myBids = [];
  return data;
};
ut = normalizeUT(ut);
settings.utData = ut;
utxInitSchema();
function utxRepairLineupV30() {
  const valid = Array.isArray(ut.lineup) && ut.lineup.length === 11 && new Set(ut.lineup).size === 11 && ut.lineup.every(id => !!utById(id));
  if (!valid) utAutoLineup();
  const starters = new Set(ut.lineup);
  ut.bench = [...new Set((Array.isArray(ut.bench) ? ut.bench : []).filter(id => utById(id) && !starters.has(id)))];
  const assigned = new Set([...starters, ...ut.bench]);
  ut.collection.forEach(c => { if (!assigned.has(c.uid)) { ut.bench.push(c.uid); assigned.add(c.uid); } });
}
utxRepairLineupV30();

// Guard pack opening against partial/old saves, and make every successful transaction durable.
const utOpenPackV30Base = utOpenPack;
utOpenPack = function (pack) {
  try {
    ut = normalizeUT(ut);
    settings.utData = ut;
    utxInitSchema();
    if (!Array.isArray(ut.packHistory)) ut.packHistory = [];
    if (!Array.isArray(ut.marketHistory)) ut.marketHistory = [];
    if (!UT_PACKS[pack]) return;
    if ((Number(ut.coins) || 0) < UT_PACKS[pack].cost) { alert(utxT('Не хватает монет')); return; }
    return utOpenPackV30Base(pack);
  } catch (err) {
    console.error('Cowball pack transaction failed:', err);
    saveUT();
    alert(utxT('Не удалось открыть пак. Прогресс сохранён; попробуй ещё раз.'));
  }
};
UTX_DICT['Не удалось открыть пак. Прогресс сохранён; попробуй ещё раз.'] = ['Could not open the pack. Progress was saved; try again.','Impossible d’ouvrir le pack. Progression sauvegardée ; réessayez.','No se pudo abrir el sobre. El progreso se guardó; inténtalo otra vez.','Paket açılamadı. İlerleme kaydedildi; yeniden dene.','Paketi açmaq olmadı. İrəliləyiş saxlanıldı; yenidən cəhd et.'];
UTX_DICT['Не удалось открыть пак. Прогресс сохранён; попробуй ещё раз.'].forEach(v => { UTX_FROM[v] = 'Не удалось открыть пак. Прогресс сохранён; попробуй ещё раз.'; });

const utxSaveToolsStyleV30 = document.createElement('style');
utxSaveToolsStyleV30.textContent = `
.utxSaveToolsV30{margin-top:12px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:linear-gradient(135deg,rgba(90,169,255,.10),rgba(255,255,255,.025))}
.utxSaveToolsV30 h3{margin:0 0 5px;font-size:15px;letter-spacing:.5px;text-transform:uppercase}
.utxSaveToolsV30 p{margin:0 0 10px;color:var(--mut);font-size:13px;line-height:1.4}
.utxSaveToolsV30 .utxSaveBtnsV30{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.utxSaveToolsV30 button{min-height:44px;padding:8px 10px;text-align:center;justify-content:center;font-size:14px}
@media(max-width:700px){.utxSaveToolsV30{padding:11px}.utxSaveToolsV30 .utxSaveBtnsV30{grid-template-columns:1fr}}
`;
document.head.appendChild(utxSaveToolsStyleV30);

function utxExportSaveV30() {
  try {
    const snapshot = { app:'Cowball', format:'cowball-save-v1', version:String(typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v31'), exportedAt:new Date().toISOString(), settings:JSON.parse(JSON.stringify(settings)) };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    a.href=url; a.download=`Cowball-save-${stamp}.json`; a.style.display='none'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
    alert(utxT('Сохранение экспортировано.'));
  } catch (e) { console.error('Cowball save export failed:',e); alert(utxT('Файл слишком большой или не читается.')); }
}
function utxReadFileV30(file) {
  if (file && typeof file.text === 'function') return file.text();
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(r.error||new Error('read failed'));r.readAsText(file);});
}
async function utxImportSaveFileV30(file) {
  if (!file || file.size > 10*1024*1024) { alert(utxT('Файл слишком большой или не читается.')); return; }
  try {
    const parsed = JSON.parse(await utxReadFileV30(file));
    if (!parsed || parsed.app !== 'Cowball' || parsed.format !== 'cowball-save-v1' || !parsed.settings || typeof parsed.settings !== 'object' || Array.isArray(parsed.settings)) {
      alert(utxT('Файл сохранения не подходит для Cowball.')); return;
    }
    if (!confirm(utxT('Импорт заменит текущий прогресс Cowball. Продолжить?'))) return;
    const imported = Object.assign({}, DEF, parsed.settings);
    // Refuse malformed data before touching the current save.
    if (!['ru','en','fr','es','tr','az'].includes(imported.lang)) imported.lang='ru';
    if (imported.utData != null && (typeof imported.utData !== 'object' || Array.isArray(imported.utData))) throw new Error('bad UT data');
    const currentRaw = localStorage.getItem('cowball');
    if (currentRaw) {
      try {
        const currentParsed = JSON.parse(currentRaw);
        if (currentParsed && typeof currentParsed === 'object' && !Array.isArray(currentParsed)) localStorage.setItem('cowball_preimport_v31', currentRaw);
      } catch (_) { /* Keep an already available backup if the current primary save is damaged. */ }
    }
    localStorage.setItem('cowball', JSON.stringify(imported));
    location.reload();
  } catch (e) {
    console.error('Cowball save import failed:',e);
    alert(utxT('Не удалось импортировать сохранение. Проверь файл и попробуй снова.'));
  }
}
function utxRestoreBackupV31() {
  let raw = null, sourceKey = '';
  for (const key of ['cowball_preimport_v31', 'cowball_backup_v31']) {
    try {
      const candidate = localStorage.getItem(key);
      if (!candidate) continue;
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) { raw = candidate; sourceKey = key; break; }
    } catch (_) {}
  }
  if (!raw) { alert(utxT('Резервной копии пока нет. Сначала сыграй или сохрани изменения.')); return; }
  if (!confirm(utxT('Будет восстановлена предыдущая версия сохранения. Текущий прогресс сначала сохранится в отдельную копию. Продолжить?'))) return;
  try {
    const current = localStorage.getItem('cowball');
    if (current) {
      try {
        const parsedCurrent = JSON.parse(current);
        if (parsedCurrent && typeof parsedCurrent === 'object' && !Array.isArray(parsedCurrent)) localStorage.setItem('cowball_pre_restore_v31', current);
      } catch (_) {}
    }
    // Validate again immediately before the destructive write.
    const recovered = JSON.parse(raw);
    if (!recovered || typeof recovered !== 'object' || Array.isArray(recovered)) throw new Error('invalid backup');
    localStorage.setItem('cowball', JSON.stringify(Object.assign({}, DEF, recovered)));
    alert(utxT('Резервная копия восстановлена. Игра перезапустится.'));
    location.reload();
  } catch (e) {
    console.error('Cowball backup restore failed:', e);
    alert(utxT('Не удалось импортировать сохранение. Проверь файл и попробуй снова.'));
  }
}
function utxShowRecoveryNoticeV31() {
  if (!window.__cowballRecoveredV31 || document.getElementById('cowballRecoveredNoticeV31')) return;
  const n = document.createElement('div');
  n.id = 'cowballRecoveredNoticeV31';
  n.textContent = utxT('Резервная копия восстановлена после ошибки сохранения.');
  n.style.cssText = 'position:fixed;z-index:1000;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);max-width:90vw;padding:12px 16px;border:1px solid rgba(184,255,61,.65);border-radius:14px;background:rgba(7,11,18,.96);color:#f3f6fb;font:700 14px/1.35 Manrope,Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.4);text-align:center;';
  document.body.appendChild(n);
  setTimeout(() => { if (n.isConnected) n.remove(); }, 6500);
}

function utxEnsureSaveToolsV30() {
  const body = $('utBody');
  if (!body || utTab !== 'club' || body.querySelector('.utxSaveToolsV30')) return;
  body.insertAdjacentHTML('beforeend', `<section class="utxSaveToolsV30"><h3>${utxT('Сохранение и резервная копия')}</h3><p>${utxT('Сохранение включает настройки, турниры, карьеру и клуб Ultimate Team. Храни файл в безопасном месте.')}</p><div class="utxSaveBtnsV30"><button class="mi pri" data-a="saveExportV30">${utxT('Экспорт сохранения')}</button><button class="mi" data-a="saveImportV30">${utxT('Импорт сохранения')}</button><button class="mi" data-a="saveRestoreBackupV31">${utxT('Восстановить резервную копию')}</button></div></section>`);
}
const renderUTV30Base = renderUT;
renderUT = function () {
  renderUTV30Base.apply(this, arguments);
  try { utxEnsureSaveToolsV30(); utxTranslateDOM($('utBody')); } catch(e) { console.warn('UT save tools render:',e); }
};
if (!$('utSaveImportFileV30')) {
  const input = document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.id='utSaveImportFileV30'; input.className='hide'; input.setAttribute('aria-label',utxT('Импорт сохранения'));
  input.addEventListener('change', async function(){const file=input.files&&input.files[0];input.value='';await utxImportSaveFileV30(file);});
  document.body.appendChild(input);
}
Object.assign(ACT, {
  saveExportV30(){utxExportSaveV30();},
  saveImportV30(){const input=$('utSaveImportFileV30');if(input)input.click();},
  saveRestoreBackupV31(){utxRestoreBackupV31();}
});

// ================== v33: PC/gamepad/iOS and GitHub release hardening ==================
// Button indices follow the standard Gamepad API mapping; users may override every action.
const PAD_BUTTONS_V33 = [
  ['0','A / Cross (0)'],['1','B / Circle (1)'],['2','X / Square (2)'],['3','Y / Triangle (3)'],
  ['4','LB / L1 (4)'],['5','RB / R1 (5)'],['6','LT / L2 (6)'],['7','RT / R2 (7)'],
  ['8','Back / Select (8)'],['9','Start / Menu (9)'],['10','LS click (10)'],['11','RS click (11)'],
  ['12','D-pad Up (12)'],['13','D-pad Down (13)'],['14','D-pad Left (14)'],['15','D-pad Right (15)']
];
const PAD_LABELS_V33 = {kick:'Удар',pass:'Пас',cross:'Навес',sprint:'Рывок',sw:'Смена игрока',pause:'Пауза'};
function gamepadStatusV33(){
  let pads=[]; try{pads=Array.from(navigator.getGamepads?navigator.getGamepads():[]).filter(Boolean);}catch(e){}
  const connected=pads.filter(p=>p.connected);
  return connected.length ? 'Геймпад подключён: '+connected.map(p=>p.id||'Контроллер').join(', ') : 'Геймпад не обнаружен. Подключи контроллер, нажми любую кнопку и открой эту вкладку ещё раз.';
}
function updatePadStatusV33(){const el=$('padStatusV33');if(el){el.textContent=gamepadStatusV33();el.style.borderLeft='3px solid '+(gamepadStatusV33().startsWith('Геймпад подключён')?'#b8ff3d':'#8a9bb5');el.style.paddingLeft='10px';}}
function renderPadBindingsV33(){
  const map=settings.padBindsV33||DEF.padBindsV33;
  const rows=Object.keys(PAD_LABELS_V33).map(k=>`<label class="opt" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="flex:1 1 130px">${PAD_LABELS_V33[k]}</span><select id="padBindV33_${k}" style="min-width:190px;max-width:100%;padding:10px;border-radius:10px;background:#111b2c;color:#fff;border:1px solid rgba(255,255,255,.18)">${PAD_BUTTONS_V33.map(([v,n])=>`<option value="${v}" ${Number(map[k])===Number(v)?'selected':''}>${n}</option>`).join('')}</select></label>`).join('');
  cbOpenModal('padBindingsV33','Настройка кнопок геймпада',`<p class="help">Назначь отдельную кнопку для каждого действия. Если контроллер использует стандартную раскладку, начни с A/Cross — удар, X/Square — пас, B/Circle — навес, RT/R2 — рывок, Y/Triangle — смена игрока, Start — пауза.</p><div class="cbFeatureStat" id="padModalStatusV33">${gamepadStatusV33()}</div>${rows}<div class="utActions" style="margin-top:12px"><button class="mi pri" data-a="gamepadBindingsSaveV33">Сохранить управление</button><button class="mi" data-a="gamepadBindingsResetV33">Стандартная схема</button><button class="mi" data-a="featureClose">Закрыть</button></div>`);
}
function savePadBindingsV33(){
  const next={}; for(const k of Object.keys(PAD_LABELS_V33)){const el=$('padBindV33_'+k);const v=el?Number(el.value):Number(DEF.padBindsV33[k]);if(!Number.isInteger(v)||v<0||v>15){alert(utxT('Некорректная кнопка геймпада.'));return;}next[k]=v;}
  settings.padBindsV33=next;save();cbCloseModal();renderSettings();updatePadStatusV33();
}
Object.assign(ACT,{
  gamepadConfigV33(){renderPadBindingsV33();},
  gamepadBindingsSaveV33(){savePadBindingsV33();},
  gamepadBindingsResetV33(){settings.padBindsV33=Object.assign({},DEF.padBindsV33);save();renderPadBindingsV33();},
  hubbackV33(){if(comp){settings.comp=comp;save();}comp=null;renderTours();show('tours');}
});
const resetSettingsV33Base=ACT.resetsettings;
ACT.resetsettings=function(){const r=resetSettingsV33Base.apply(this,arguments);applyUIState();applyRes();applyGfxQuality();return r;};
// Device profiles never block the browser's other input paths. Gamepad and keyboard can coexist.
const onSettingChangedV33Base=onSettingChanged;
onSettingChanged=function(k){onSettingChangedV33Base(k);if(k==='inputModeV33'){applyControlsLayout();applyUIState();}if(k==='keyboardLayoutV33'){save();}};
const renderSettingsV33Base=renderSettings;
renderSettings=function(){renderSettingsV33Base.apply(this,arguments);if(SET_TABS[setTab]&&SET_TABS[setTab].id==='ctl')updatePadStatusV33();};
window.addEventListener('gamepadconnected',updatePadStatusV33);
window.addEventListener('gamepaddisconnected',updatePadStatusV33);
// Localization for labels introduced by this release.
const V33_TRANSLATIONS=[
['Устройство управления',['Input device','Périphérique de commande','Dispositivo de control','Kontrol cihazı','İdarəetmə qurğusu']],
['ПК / клавиатура',['PC / keyboard','PC / clavier','PC / teclado','PC / klavye','PC / klaviatura']],
['Телефон / планшет',['Phone / tablet','Téléphone / tablette','Teléfono / tableta','Telefon / tablet','Telefon / planşet']],
['Схема клавиатуры',['Keyboard layout','Disposition du clavier','Distribución del teclado','Klavye düzeni','Klaviatura düzümü']],
['Настроить кнопки геймпада',['Configure controller buttons','Configurer les boutons de la manette','Configurar botones del mando','Kontrolcü tuşlarını ayarla','Kontroller düymələrini qur']],
['Настройка кнопок геймпада',['Controller button mapping','Configuration des boutons de la manette','Asignación de botones del mando','Kontrolcü tuş ataması','Kontroller düymələrinin təyini']],
['Сохранить управление',['Save controls','Enregistrer les commandes','Guardar controles','Kontrolleri kaydet','İdarəetməni saxla']],
['Стандартная схема',['Default layout','Disposition standard','Esquema estándar','Varsayılan düzen','Standart sxem']],
['Назад к турнирам',['Back to competitions','Retour aux compétitions','Volver a competiciones','Turnuvalara dön','Turnirlərə qayıt']],
['Некорректная кнопка геймпада.',['Invalid controller button.','Bouton de manette invalide.','Botón de mando no válido.','Geçersiz kontrolcü tuşu.','Kontroller düyməsi düzgün deyil.']]
];
for(const [ru,vals] of V33_TRANSLATIONS){UTX_DICT[ru]=vals;vals.forEach(v=>{if(v)UTX_FROM[v]=ru;});}
// iOS 12 Safari has no Pointer Events; preserve touch buttons and the virtual stick with Touch Events.
if(!('PointerEvent' in window)){
  const legacyTouchButtonsV33=[['bKick','kick'],['bPass','pass'],['bSprint','sprint'],['bSwitch','sw'],['bCross','cross']];
  legacyTouchButtonsV33.forEach(([id,name])=>{
    const el=$(id); if(!el)return; let heldId=null;
    el.addEventListener('touchstart',e=>{if(heldId!==null)return;const t=e.changedTouches&&e.changedTouches[0];if(!t)return;heldId=t.identifier;e.preventDefault();Audio_.init();touch[name]=true;if(name!=='sprint')touch[name+'L']=true;el.classList.add('on');},{passive:false});
    const release=e=>{if(heldId===null)return;for(const t of Array.from(e.changedTouches||[])){if(t.identifier===heldId){heldId=null;touch[name]=false;touch[name+'L']=false;el.classList.remove('on');break;}}};
    window.addEventListener('touchend',release,{passive:true});window.addEventListener('touchcancel',release,{passive:true});
  });
  document.addEventListener('touchstart',e=>{
    if(!inGameState()||!touchUIOn()||joy.id!==null)return;
    const target=e.target;if(target&&target.closest&&target.closest('[data-a],.tbtn'))return;
    const t=e.changedTouches&&e.changedTouches[0];if(!t)return;
    const mine=settings.hand==='right'?t.clientX<window.innerWidth*.55:t.clientX>window.innerWidth*.45;
    if(!mine)return;e.preventDefault();Audio_.init();joy.id=t.identifier;joy.ox=t.clientX;joy.oy=t.clientY;joy.dx=joy.dy=0;
    jbase.style.display='block';jbase.style.left=joy.ox+'px';jbase.style.top=joy.oy+'px';jknob.style.transform='translate(0,0)';
  },{passive:false});
  document.addEventListener('touchmove',e=>{
    if(joy.id===null)return;let t=null;for(const q of Array.from(e.changedTouches||[])){if(q.identifier===joy.id){t=q;break;}}if(!t){for(const q of Array.from(e.touches||[])){if(q.identifier===joy.id){t=q;break;}}}if(!t)return;e.preventDefault();
    let dx=t.clientX-joy.ox,dy=t.clientY-joy.oy;const m=Math.hypot(dx,dy),R=56;if(m>R){joy.ox+=dx/m*(m-R);joy.oy+=dy/m*(m-R);dx=dx/m*R;dy=dy/m*R;jbase.style.left=joy.ox+'px';jbase.style.top=joy.oy+'px';}
    joy.dx=clamp(dx/R*(settings.sensitivity/100),-1,1);joy.dy=clamp(dy/R*(settings.sensitivity/100),-1,1);jknob.style.transform=`translate(${dx}px,${dy}px)`;
  },{passive:false});
  const legacyStickReleaseV33=e=>{if(joy.id===null)return;for(const t of Array.from(e.changedTouches||[])){if(t.identifier===joy.id){joy.id=null;joy.dx=joy.dy=0;jbase.style.display='none';break;}}};
  window.addEventListener('touchend',legacyStickReleaseV33,{passive:true});window.addEventListener('touchcancel',legacyStickReleaseV33,{passive:true});
}
// iOS Safari viewport changes and GPU canvas compositing stability.
const iosCompatStyleV33=document.createElement('style');
iosCompatStyleV33.textContent=`
html,body{overscroll-behavior:none;-webkit-text-size-adjust:100%;}
body{min-height:100%;min-height:100dvh;}
canvas#gl{transform:translate3d(0,0,0);-webkit-transform:translate3d(0,0,0);backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform;}
#sc-hub .hubbtns{display:flex;flex-wrap:wrap;gap:8px;}
#sc-hub .hubbtns .mi{min-height:44px;}
@supports not (height:100dvh){body{min-height:-webkit-fill-available;}canvas#gl{height:-webkit-fill-available;}}
@media(max-width:700px){#setBody select{max-width:100%;}#setBody .opt{row-gap:8px;}#sc-hub .hubbtns .mi{flex:1 1 42%;}}
`;
document.head.appendChild(iosCompatStyleV33);
if(window.visualViewport){window.visualViewport.addEventListener('resize',()=>{requestAnimationFrame(()=>{try{resizeGL();applyUIState();}catch(e){}});},{passive:true});}
// Make field paint layers deterministic: the grass texture stays above turf and lines stay above both.
try{
  if(typeof patchPlane!=='undefined'&&patchPlane){patchPlane.position.y=.012;patchPlane.renderOrder=1;patchPlane.material.polygonOffset=true;patchPlane.material.polygonOffsetFactor=-1;patchPlane.material.polygonOffsetUnits=-1;patchPlane.material.needsUpdate=true;}
  if(typeof wetSheen!=='undefined'&&wetSheen){wetSheen.position.y=.016;wetSheen.renderOrder=2;}
  if(renderer&&renderer.domElement){renderer.domElement.style.transform='translate3d(0,0,0)';renderer.domElement.style.webkitTransform='translate3d(0,0,0)';renderer.domElement.style.backfaceVisibility='hidden';}
}catch(e){console.warn('Cowball renderer compatibility:',e);}
// Reacquire and rebuild GPU resources after transient iOS/Safari context loss instead of silently leaving a black canvas.
const v33Canvas=renderer&&renderer.domElement;
if(v33Canvas){
  v33Canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();const n=$('v33ContextNotice')||document.createElement('div');n.id='v33ContextNotice';n.textContent='Графический контекст потерян. Браузер пытается восстановить поле…';n.style.cssText='position:fixed;z-index:2000;left:50%;top:max(12px,env(safe-area-inset-top));transform:translateX(-50%);padding:10px 14px;border-radius:12px;background:#111b2c;color:#fff;font:600 13px/1.4 sans-serif;max-width:90vw;text-align:center';if(!n.parentNode)document.body.appendChild(n);});
  v33Canvas.addEventListener('webglcontextrestored',()=>{try{renderer.resetState();_appliedPixelRatioV33=0;_appliedWidthV33=_appliedHeightV33=0;applyRes();applyGfxQuality();applyShadowPolicyV24();const n=$('v33ContextNotice');if(n)n.remove();}catch(e){console.error('Cowball context restore failed:',e);}});
}
// Maximum graphics are selected at launch; adaptive render scaling is opt-in and disabled by default.
// Ultra keeps the full device pixel ratio (up to 3x); automatic shadows retain their existing performance policy.
// ================== v35: ЦЕРЕМОНИЯ ОТКРЫТИЯ ==================
const SHOW = 330;   // кадров вступительного шоу до выхода команд
function ceremonyCam() {
  const k = clamp((introT + SHOW) / SHOW, 0, 1), e = ezs(k), a = -1.25 + 1.25 * e, r = 40 - 12 * e, h = 27 - 13 * e, f = fieldVisualScale;
  tP.set(Math.sin(a) * r * f, h * (1 + 0.22 * (f - 1)), Math.cos(a) * r * f); tL.set(0, 0.6 + 0.8 * e, 0);
}
const cerCard = (a, b, c) => `<div class="cer"><div class="cerLogo"></div><div class="cerT">${a}</div><div class="cerS">${b}</div>${c ? `<div class="cerM">${c}</div>` : ''}</div>`;
const _beginReady35 = beginReady;
beginReady = function (full) {
  _beginReady35(full);
  if (full) { introT = -SHOW; introEv = {}; cows.forEach(c => { c.g.visible = false; }); }
};
function openingShow(dt) {
  const T = introT + SHOW, ev = introEv, tA = sideTeam[0], tB = sideTeam[1];
  const fw = (col) => spawnFirework((Math.random() - 0.5) * 34, 7 + Math.random() * 6, -3 - Math.random() * 8, col);
  if (!ev.s0) { ev.s0 = 1; Audio_.swell(0.55, 4); SFX.cheer(0.5, 3); lightPulse = 1; bannerEl().innerHTML = cerCard('COWBALL', 'Cowball Stadium · прямая трансляция', 'Добро пожаловать на матч!'); }
  if (T > 40 && !ev.s1) { ev.s1 = 1; for (let i = 0; i < 3; i++) fw([0xff4fa3, 0xffffff, 0x6d4bff][i]); lightPulse = 1; }
  if (T > 95 && !ev.s2) { ev.s2 = 1; bannerEl().innerHTML = cerCard(`${tA.nation ? tA.flag + ' ' : '🐄 '}${tA.name}`, 'против', `${tB.nation ? tB.flag + ' ' : '🐄 '}${tB.name}`); SFX.cheer(0.6, 3); burstConfetti(sideKit[0]); }
  if (T > 150 && !ev.s3) { ev.s3 = 1; for (let i = 0; i < 3; i++) fw([sideKit[0], sideKit[1], 0xffffff][i]); lightPulse = 1; }
  if (T > 205 && !ev.s4) { ev.s4 = 1; bannerEl().innerHTML = cerCard('ТРИБУНЫ ГОТОВЫ', 'Свет, музыка, болельщики', 'Команды выходят на поле'); burstConfetti(sideKit[1]); Audio_.crowd(0.7); }
  if (T > 255 && !ev.s5) { ev.s5 = 1; for (let i = 0; i < 4; i++) fw([sideKit[0], sideKit[1], 0xb8ff3d, 0xffffff][i]); lightPulse = 1; addShake(0.25); }
  if ((T | 0) % 70 < dt && T > 10) lightPulse = Math.max(lightPulse, 0.7);
}
const _stepIntro35 = stepIntro;
stepIntro = function (dt) {
  if (introT < 0) {
    openingShow(dt); introT += dt;
    if (introT >= 0) { introT = 0; bannerEl().innerHTML = ''; cows.forEach(c => { c.g.visible = true; }); }
    return;
  }
  _stepIntro35(dt);
  const T = introT, ev = introEv, fw = (col) => spawnFirework((Math.random() - 0.5) * 34, 7 + Math.random() * 6, -3 - Math.random() * 8, col);
  if (T >= INTRO.P1 && !ev.x1) { ev.x1 = 1; burstConfetti(sideKit[0]); fw(sideKit[0]); fw(sideKit[1]); }
  if (T >= INTRO.P3 && !ev.x2) { ev.x2 = 1; burstConfetti(sideKit[1]); lightPulse = 1; fw(0xffffff); fw(sideKit[0]); fw(sideKit[1]); }
  if (T >= INTRO.TOT - 26 && !ev.x3) { ev.x3 = 1; for (let i = 0; i < 5; i++) fw([sideKit[0], sideKit[1], 0xb8ff3d, 0xffffff, 0xff4fa3][i]); lightPulse = 1; addShake(0.3); }
};

// бегущая LED-лента бортов
const _syncScene35 = syncScene;
syncScene = function (dt) { adTexA.offset.x = (adTexA.offset.x + dt * 0.00022) % 1; adTexB.offset.x = (adTexB.offset.x + 1 - dt * 0.00022) % 1; _syncScene35(dt); };

// ================== v35: ИГРА ПО СЕТИ (WebRTC без сервера: обмен кодами) ==================
const NET = { role: null, pc: null, rel: null, fast: null, open: false, inp: { x: 0, y: 0, kick: false, pass: false, cross: false, sprint: false, sw: false }, pend: { kick: false, pass: false, cross: false, sw: false }, snap: null, guestRun: false, lastBn: null, code: '', ui: 'menu', msg: '' };
const NETICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const netEnc = async s => { try { if (window.CompressionStream) { const cs = new CompressionStream('deflate'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(s)); w.close(); const u = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let b = ''; u.forEach(x => { b += String.fromCharCode(x); }); return 'z' + btoa(b); } } catch (e) {} return 'r' + btoa(unescape(encodeURIComponent(s))); };
const netDec = async c => { c = String(c).replace(/\s+/g, ''); if (c[0] === 'z') { const u = Uint8Array.from(atob(c.slice(1)), ch => ch.charCodeAt(0)), ds = new DecompressionStream('deflate'), w = ds.writable.getWriter(); w.write(u); w.close(); return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer()); } return decodeURIComponent(escape(atob(c.slice(1)))); };
const netIce = pc => new Promise(res => {
  if (!pc || pc.iceGatheringState === 'complete') return res(true);
  let finished = false;
  const finish = () => { if (finished) return; finished = true; clearTimeout(timer); try { pc.removeEventListener('icegatheringstatechange', check); } catch (_) {} res(pc.iceGatheringState === 'complete'); };
  const check = () => { if (pc.iceGatheringState === 'complete') finish(); };
  const timer = setTimeout(finish, 15000);
  pc.addEventListener('icegatheringstatechange', check);
});
let netDropTimerV41 = null;
function netWatchPCV41(pc) {
  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    if (st === 'connected' || st === 'completed') { if (netDropTimerV41) clearTimeout(netDropTimerV41); netDropTimerV41 = null; return; }
    if (st === 'failed' || st === 'closed') { netLost(); return; }
    if (st === 'disconnected') {
      if (netDropTimerV41) clearTimeout(netDropTimerV41);
      netDropTimerV41 = setTimeout(() => { if (NET.pc === pc && pc.connectionState !== 'connected' && pc.connectionState !== 'completed') netLost(); }, 10000);
    }
  };
}
function netSend(o, rel) { const ch = rel ? NET.rel : NET.fast; if (ch && ch.readyState === 'open') { try { ch.send(JSON.stringify(o)); } catch (e) {} } }
function netReset() { const pc = NET.pc; NET.open = false; if (netDropTimerV41) clearTimeout(netDropTimerV41); netDropTimerV41 = null; NET.pc = NET.rel = NET.fast = null; NET.role = null; NET.guestRun = false; NET.snap = null; NET.code = ''; NET.lastBn = null; try { if (pc) pc.close(); } catch (e) {} }
function netBind(dc) {
  if (dc.label === 'rel') NET.rel = dc; else NET.fast = dc;
  dc.onopen = () => { if (NET.rel && NET.fast && NET.rel.readyState === 'open' && NET.fast.readyState === 'open' && !NET.open) { NET.open = true; NET.ui = 'ready'; NET.msg = ''; renderNet(); } };
  dc.onmessage = e => { try { netRecv(JSON.parse(e.data)); } catch (err) {} };
  dc.onclose = () => { setTimeout(() => { if (NET.open && dc.readyState === 'closed') netLost(); }, 10000); };
}
function netLost() {
  if (!NET.open && NET.ui === 'menu') return;
  const was = NET.open; NET.open = false; NET.guestRun = false; NET.ui = 'menu'; NET.msg = was ? 'Соединение потеряно' : '';
  if (was) { if (state !== 'menu') { try { ACT.tomenu && ACT.tomenu(); } catch (e) {} } netReset(); try { renderNet(); show('net'); } catch (e) {} }
}
async function netHost() {
  if (typeof RTCPeerConnection === 'undefined') throw new Error('В этом браузере нет WebRTC. Открой игру в актуальном Chrome, Edge, Firefox или Safari через HTTPS.');
  netReset(); NET.role = 'host'; const pc = new RTCPeerConnection(NETICE); NET.pc = pc;
  netBind(pc.createDataChannel('rel', { ordered: true })); netBind(pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 }));
  netWatchPCV41(pc);
  await pc.setLocalDescription(await pc.createOffer()); await netIce(pc); NET.code = await netEnc(JSON.stringify(pc.localDescription));
}
async function netJoin(code) {
  code = String(code || '').trim(); if (!code || code.length > 180000) throw new Error('Код пустой или слишком большой');
  if (typeof RTCPeerConnection === 'undefined') throw new Error('В этом браузере нет WebRTC. Открой игру через HTTPS в актуальном браузере.');
  netReset(); NET.role = 'guest'; const pc = new RTCPeerConnection(NETICE); NET.pc = pc;
  pc.ondatachannel = e => netBind(e.channel);
  netWatchPCV41(pc);
  await pc.setRemoteDescription(JSON.parse(await netDec(code))); await pc.setLocalDescription(await pc.createAnswer()); await netIce(pc); NET.code = await netEnc(JSON.stringify(pc.localDescription));
}
function netRecv(m) {
  if (m.t === 'inp' && NET.role === 'host') { NET.inp = m.o; ['kick', 'pass', 'cross', 'sw'].forEach(k => { if (m.o[k]) NET.pend[k] = true; }); }
  else if (m.t === 'snap' && NET.role === 'guest') NET.snap = m;
  else if (m.t === 'start' && NET.role === 'guest') guestStart(m);
  else if (m.t === 'goal' && NET.role === 'guest') guestGoal(m);
  else if (m.t === 'end' && NET.role === 'guest') { if (NET.snap) { score = m.sc.slice(); } timeLeft = 0; NET.guestRun = true; beginOutro(); }
}
// --- хост: второй игрок = вход по сети ---
const _gather35 = gather;
gather = function (p) {
  if (NET.open && NET.role === 'host' && matchCfg.net && p.id === 2) { const o = Object.assign({}, NET.inp); ['kick', 'pass', 'cross', 'sw'].forEach(k => { if (NET.pend[k]) { o[k] = true; NET.pend[k] = false; } }); return o; }
  return _gather35(p);
};
const _smn35 = startMatchNow;
startMatchNow = function (cfg) {
  if (cfg && !(NET.open && NET.role === 'host' && cfg.versus)) cfg.net = false;
  if (NET.open && NET.role === 'host' && cfg && cfg.versus) {
    cfg.net = true; settings.localTouchV21 = false;
    cfg.netRanked = !!settings.netRankedV41; cfg.netMatchId = NET.matchId || ('cowball-' + Date.now().toString(36));
    netSend({ t: 'start', a: cfg.tA.id, b: cfg.tB.id, size: cfg.size, time: settings.time, stadium: settings.stadium, tod: settings.tod, weather: settings.weather, ranked: !!cfg.netRanked, mid: cfg.netMatchId }, true);
  }
  _smn35(cfg);
};
const _goal35 = goal;
goal = function (team) { _goal35(team); if (NET.open && NET.role === 'host') netSend({ t: 'goal', team, sc: score.slice() }, true); };
const _end35 = endMatch;
endMatch = function () { if (NET.open && NET.role === 'host' && matchCfg.net) netSend({ t: 'end', sc: score.slice() }, true); _end35(); };
const _setState35 = setState;
setState = function (s) { if (s === 'menu' || s === 'end') NET.guestRun = false; _setState35(s); };
const _pause35 = pauseGame;
pauseGame = function () { if (NET.guestRun) return; _pause35(); };
// --- хост: снимок состояния 25 раз в секунду ---
const nq = v => Math.round(v * 100) / 100;
setInterval(() => {
  if (!(NET.open && NET.role === 'host' && matchCfg.net) || state === 'menu') return;
  const bn = bannerEl().innerHTML, s = {
    t: 'snap', s: state, sc: score, tl: nq(timeLeft), it: Math.round(introT), if: introFull ? 1 : 0, ct: setCenter.last || '',
    c: cows.map(c => [nq(c.x), nq(c.y), nq(c.vx), nq(c.vy)]), b: [nq(ball.x), nq(ball.y), nq(ball.h || 0), nq(ball.vx), nq(ball.vy)],
    ho: cows.indexOf(ball.holder), ca: cows.indexOf(ball.carrier), a: players.map(p => cows.indexOf(p.cow))
  };
  if (bn !== NET.lastBn) { NET.lastBn = bn; s.bn = bn; }
  netSend(s, false);
}, 40);
// --- гость: отправка управления ---
setInterval(() => {
  if (!(NET.open && NET.role === 'guest' && NET.guestRun)) return;
  const o = _gather35(players[0]);
  netSend({ t: 'inp', o: { x: nq(o.x), y: nq(o.y), kick: !!o.kick, pass: !!o.pass, cross: !!o.cross, sprint: !!o.sprint, sw: !!o.sw } }, false);
}, 33);
function guestStart(m) {
  try { settings.time = m.time; if (m.stadium) settings.stadium = m.stadium; if (m.tod) settings.tod = m.tod; if (m.weather) settings.weather = m.weather; } catch (e) {}
  settings.localTouchV21 = false; NET.snap = null; NET.guestRun = true; NET.lastBn = null;
  _smn35({ tA: teamById(m.a), tB: teamById(m.b), size: m.size || 5, versus: true, ko: false, noTactics: true, net: true });
  clearParticles(); setScreen(null); applyUIState();
}
function guestGoal(m) {
  const team = m.team; score = m.sc.slice(); lastScorer = team; goalT = 0; goalFx = 0; replayFrames = null;
  celeb = cows.filter(c => c.team === team).sort((a, b) => dBall(a) - dBall(b))[0];
  setState('goal'); lightPulse = 1; addShake(0.7); goalFlash(); SFX.whistle(0.5); SFX.horn(); SFX.goal(sPan(ball.x)); SFX.cheer(0.6, 3.2); Audio_.music.stop(); burstConfetti(sideTeam[team].c1);
}
function guestStep(dt) {
  clock += dt; const s = NET.snap; if (!s) return;
  const k = Math.min(1, 0.45 * dt);
  score = s.sc.slice(); timeLeft = s.tl;
  s.c.forEach((d, i) => { const c = cows[i]; if (!c) return; if (Math.hypot(d[0] - c.x, d[1] - c.y) > 70) { c.x = d[0]; c.y = d[1]; } else { c.x += (d[0] - c.x) * k; c.y += (d[1] - c.y) * k; } c.vx = d[2]; c.vy = d[3]; });
  ball.x += (s.b[0] - ball.x) * k; ball.y += (s.b[1] - ball.y) * k; ball.h = s.b[2]; ball.vx = s.b[3]; ball.vy = s.b[4];
  ball.holder = cows[s.ho] || null; ball.carrier = cows[s.ca] || null;
  s.a.forEach((ci, pi) => { if (ci >= 0 && players[pi] && cows[ci]) setActive(players[pi], cows[ci]); });
  if (s.bn !== undefined) { bannerEl().innerHTML = s.bn; s.bn = undefined; }
  setCenter(s.ct || '');
  if (state === 'goal') {
    goalT += dt; ballInNet(dt); if (goalT > goalFx * 28) { goalFx++; spawnFirework((Math.random() - 0.5) * 30, 7 + Math.random() * 6, -4 - Math.random() * 6, [sideTeam[lastScorer].c1, 0xffffff, 0xb8ff3d][goalFx % 3]); }
    if (s.s === 'play' || s.s === 'ready') { clearParticles(); setState(s.s === 'ready' ? 'ready' : 'play'); }
  } else if (s.s === 'ready') { if (state !== 'ready') setState('ready'); introFull = !!s.if; introT = s.it; }
  else if (s.s === 'play' || s.s === 'replay' || s.s === 'paused') { if (state !== 'play') { introFull = false; setState('play'); } }
}
const _stepGame35 = stepGame;
stepGame = function (dt) { if (NET.guestRun && NET.role === 'guest' && state !== 'outro') { guestStep(dt); return; } _stepGame35(dt); };

// --- экран «Игра по сети» ---
const netEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function renderNet() {
  const b = $('netBody'); if (!b) return; const u = NET.ui; let h = '';
  const note = NET.msg ? `<p class="help netMsg">${netEsc(NET.msg)}</p>` : '';
  if (u === 'menu') h = `<p class="help">Играйте вдвоём по интернету или Wi-Fi без сервера: один создаёт комнату и присылает другу код, друг присылает ответный код.</p>${note}<div class="hubbtns"><button class="mi pri" data-a="netHost">Создать комнату</button><button class="mi" data-a="netJoinUi">Войти по коду</button></div>`;
  else if (u === 'host') h = `<p class="help"><b>1.</b> Отправьте этот код другу. <b>2.</b> Вставьте его ответный код ниже.</p><textarea id="netCode" class="utInput netTa" readonly>${netEsc(NET.code || 'Создаём код…')}</textarea><div class="hubbtns"><button class="mi" data-a="netCopy">Скопировать код</button></div><textarea id="netAnswer" class="utInput netTa" placeholder="Ответный код друга…"></textarea><div class="hubbtns"><button class="mi pri" data-a="netAccept">Подключить</button></div>${note}`;
  else if (u === 'join') h = `<p class="help">Вставьте код от хоста и нажмите «Создать ответ». Ответ отправьте хосту.</p><textarea id="netAnswer" class="utInput netTa" placeholder="Код хоста…"></textarea><div class="hubbtns"><button class="mi pri" data-a="netAnswerGo">Создать ответ</button></div>${NET.code ? `<textarea id="netCode" class="utInput netTa" readonly>${netEsc(NET.code)}</textarea><div class="hubbtns"><button class="mi" data-a="netCopy">Скопировать ответ</button></div><p class="help">Ждём подключения хоста…</p>` : ''}${note}`;
  else if (u === 'ready') h = `<p class="help netOk">✔ Подключено! ${NET.role === 'host' ? 'Выберите команды — матч начнётся у обоих. Вы управляете левой командой, друг — правой.' : 'Ждём, пока хост выберет команды и начнёт матч. Вы играете правой командой (WASD / экран).'}</p>${NET.role === 'host' ? '<div class="hubbtns"><button class="mi pri" data-a="netPlay">Выбрать команды и играть</button></div>' : ''}`;
  h += '<div class="tfoot"><button class="mi" data-a="netBack">Назад</button></div>';
  b.innerHTML = h;
}
Object.assign(ACT, {
  net() { NET.msg = NET.open ? '' : NET.msg; NET.ui = NET.open ? 'ready' : 'menu'; renderNet(); show('net'); },
  async netHost() { NET.ui = 'host'; NET.code = ''; NET.msg = ''; renderNet(); try { await netHost(); } catch (e) { NET.msg = 'Не удалось создать комнату: ' + (e.message || e); NET.ui = 'menu'; } renderNet(); },
  netJoinUi() { netReset(); NET.ui = 'join'; NET.msg = ''; renderNet(); },
  async netAnswerGo() { const v = ($('netAnswer') || {}).value || ''; if (!v.trim()) return; NET.msg = ''; try { await netJoin(v); } catch (e) { NET.msg = 'Неверный код'; } renderNet(); },
  async netAccept() { const v = ($('netAnswer') || {}).value || ''; if (!v.trim()) return; try { await NET.pc.setRemoteDescription(JSON.parse(await netDec(v))); NET.msg = 'Подключаемся…'; } catch (e) { NET.msg = 'Неверный код друга'; } renderNet(); },
  netCopy() { const el = $('netCode'); if (!el) return; try { navigator.clipboard.writeText(el.value); NET.msg = 'Скопировано'; } catch (e) { el.select(); document.execCommand('copy'); NET.msg = 'Скопировано'; } const m = document.querySelector('.netMsg'); if (m) m.textContent = NET.msg; else renderNet(); },
  netPlay() { settings.localTouchV21 = false; openTeams('versus'); },
  netBack() { if (NET.ui !== 'ready') netReset(); NET.ui = 'menu'; goHome(); }
});
const _renderHome35 = renderHome;
renderHome = function () { _renderHome35(); const el = $('tiles'); if (el && !el.querySelector('[data-a="net"]')) el.insertAdjacentHTML('beforeend', '<button class="mi" data-a="net">Игра по сети<small>вдвоём онлайн</small></button>'); };

/* ===================== NET 2.0: лобби, чат, готовность, пинг, реакции, серия ===================== */
const NX={peer:'',chat:[],myRdy:false,peerRdy:false,ping:0,cfg:null,series:{h:0,g:0,d:0,hist:[]},hello:false};
const NX_EMO=['👏','😂','🔥','😮','👍','😡'],NX_QUICK=['Го!','GG','Ещё раз?','Минутку','Классный гол!'];
const nxNick=()=>(String(settings.netNick||'').trim()||'Игрок').slice(0,14);
const nxOpt=k=>{for(const t of SET_TABS){const it=(t.items||[]).find(x=>x.k===k);if(it&&it.opts)return it.opts;}return [];};
const NX_TIMES=[60,90,120,180,240,300,420,600],nxFmt=v=>Math.floor(v/60)+':'+String(v%60).padStart(2,'0');
function nxReset(){NX.peer='';NX.chat=[];NX.myRdy=false;NX.peerRdy=false;NX.ping=0;NX.cfg=null;NX.series={h:0,g:0,d:0,hist:[]};NX.hello=false;}
const _nxReset0=netReset;netReset=function(){_nxReset0();nxReset();};
let nxToastT=0;
function nxToast(t){let el=document.getElementById('nxToast');if(!el){el=document.createElement('div');el.id='nxToast';el.className='nxToast';document.body.appendChild(el);}el.textContent=t;el.classList.add('on');clearTimeout(nxToastT);nxToastT=setTimeout(()=>el.classList.remove('on'),2400);}
function nxRefresh(){if(screen==='net')renderNet();}
function nxMsg(n,m,me){NX.chat.push({n,m,me});NX.chat=NX.chat.slice(-40);const c=document.getElementById('nxChat');if(c){c.innerHTML=nxChatHtml();c.scrollTop=c.scrollHeight;}else if(!me)nxToast('💬 '+n+': '+m);}
const nxChatHtml=()=>NX.chat.map(x=>x.sys?`<div class="nxSys">${netEsc(x.m)}</div>`:`<div class="nxBub ${x.me?'me':''}"><small>${netEsc(x.n)}</small>${netEsc(x.m)}</div>`).join('')||'<div class="nxSys">Напиши первое сообщение</div>';
function nxEmo(e,mine){if(!NX_EMO.includes(e))return;if(mine)netSend({t:'emo',e},true);const el=document.createElement('div');el.className='nxFloat';el.textContent=e;el.style.left=(15+Math.random()*70)+'%';document.body.appendChild(el);setTimeout(()=>el.remove(),2300);}
function nxRecord(sc,side=0){const S=NX.series;const a=Number(sc[side]||0),b=Number(sc[side===0?1:0]||0);if(a>b)S.h++;else if(a<b)S.g++;else S.d++;S.hist.unshift([a,b]);S.hist=S.hist.slice(0,8);}
function nxSendCfg(){if(NET.role!=='host'||!NET.open)return;const lab=(k,v)=>((nxOpt(k).find(o=>o[0]===v))||[0,v])[1];netSend({t:'cfg',c:{time:nxFmt(settings.time||90),stadium:lab('stadium',settings.stadium),weather:lab('weather',settings.weather),tod:lab('tod',settings.tod)}},true);}
const _nxRecv0=netRecv;
netRecv=function(m){switch(m.t){
 case 'hi':NX.peer=String(m.n||'Друг').slice(0,14);NX.chat.push({sys:1,m:NX.peer+' в лобби'});if(NET.role==='host')nxSendCfg();nxRefresh();return;
 case 'chat':nxMsg(NX.peer||'Друг',String(m.m||'').slice(0,140),false);return;
 case 'rdy':NX.peerRdy=!!m.v;nxRefresh();return;
 case 'emo':nxEmo(String(m.e||''),false);return;
 case 'ping':netSend({t:'pong',ts:m.ts},true);return;
 case 'pong':NX.ping=Math.round(performance.now()-m.ts);nxPingUi();return;
 case 'cfg':NX.cfg=m.c;nxRefresh();return;
 case 'end':if(NET.role==='guest'){nxRecord(m.sc,1);NX.myRdy=false;}break;
 case 'start':NX.myRdy=false;break;}
 _nxRecv0(m);};
const _nxEnd0=endMatch;endMatch=function(){if(NET.open&&NET.role==='host'&&matchCfg&&matchCfg.net&&!matchCfg._nxRec){matchCfg._nxRec=1;nxRecord(score.slice());NX.peerRdy=false;}_nxEnd0();};
const nxQ=()=>NX.ping<=0?'':NX.ping<80?'good':NX.ping<160?'mid':'bad';
function nxPingUi(){['nxPing','nxHudPing'].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent='📶 '+(NX.ping||'…')+' мс';e.className='nxPing '+nxQ();}});}
function nxHud(){let h=document.getElementById('nxHud');if(!h){h=document.createElement('div');h.id='nxHud';h.className='nxHud hide';h.innerHTML='<span id="nxHudPing" class="nxPing">📶</span>'+NX_EMO.map(e=>`<button data-a="netEmo" data-v="${e}">${e}</button>`).join('');document.body.appendChild(h);}
 const on=NET.open&&typeof matchCfg!=='undefined'&&matchCfg&&matchCfg.net&&state!=='menu'&&screen!=='net';h.classList.toggle('hide',!on);}
setInterval(()=>{if(NET.open&&!NX.hello){NX.hello=true;netSend({t:'hi',n:nxNick()},true);if(NET.role==='host')nxSendCfg();nxRefresh();}
 if(NET.open)netSend({t:'ping',ts:performance.now()},true);nxHud();},2000);
/* ---- экран ---- */
function renderNet(){const b=$('netBody');if(!b)return;const u=NET.ui,ans=$('netAnswer'),av=ans?ans.value:'',ci=$('nxChatIn'),cv=ci?ci.value:'',cf=ci&&document.activeElement===ci;
 const msg=NET.msg?`<div class="nxMsg">${netEsc(NET.msg)}</div>`:'';let h='';
 const step=(n,t,on,done)=>`<div class="nxStep ${done?'done':on?'on':''}"><i>${done?'✓':n}</i><span>${t}</span></div>`;
 if(u==='menu')h=`<div class="nxHero"><div class="nxGlobe">🌐</div><div><h2>Игра вдвоём онлайн</h2><p>Без сервера: обменяйтесь кодами — и в бой.</p></div></div>${msg}
 <label class="nxF">Твой ник<input id="nxNick" class="nxIn" maxlength="14" value="${netEsc(settings.netNick||'')}" placeholder="Игрок"></label>
 <div class="nxTiles"><button class="nxT pri" data-a="netHost"><i>🏠</i><b>Создать комнату</b><small>Ты хост — получишь код</small></button><button class="nxT" data-a="netJoinUi"><i>🔑</i><b>Войти по коду</b><small>Вставь код друга</small></button></div>
 <div class="nxFeat">${['💬 Чат','✅ Готовность','⏱ Настройки матча','📶 Пинг','😂 Реакции','🏆 Счёт серии'].map(x=>`<span>${x}</span>`).join('')}</div>`;
 else if(u==='host'){const has=!!NET.code;h=`<div class="nxSteps">${step(1,'Код создан',!has,has)}${step(2,'Отправь другу',has,false)}${step(3,'Вставь ответ',false,false)}</div>${msg}
 <label class="nxF">Твой код<textarea id="netCode" class="nxIn nxTa" readonly>${netEsc(NET.code||'Создаём код…')}</textarea></label>
 <div class="nxRow"><button class="nxB" data-a="netCopy">📋 Копировать</button><button class="nxB" data-a="netShare">📤 Поделиться</button></div>
 <label class="nxF">Ответный код друга<textarea id="netAnswer" class="nxIn nxTa" placeholder="Вставь код сюда…"></textarea></label>
 <div class="nxRow"><button class="nxB" data-a="netPaste">📥 Вставить</button><button class="nxB pri" data-a="netAccept">Подключиться</button></div>`;}
 else if(u==='join'){const has=!!NET.code;h=`<div class="nxSteps">${step(1,'Вставь код хоста',!has,has)}${step(2,'Создай ответ',false,has)}${step(3,'Отправь хосту',has,false)}</div>${msg}
 <label class="nxF">Код хоста<textarea id="netAnswer" class="nxIn nxTa" placeholder="Вставь код хоста…"></textarea></label>
 <div class="nxRow"><button class="nxB" data-a="netPaste">📥 Вставить</button><button class="nxB pri" data-a="netAnswerGo">Создать ответ</button></div>
 ${has?`<label class="nxF">Твой ответ — отправь хосту<textarea id="netCode" class="nxIn nxTa" readonly>${netEsc(NET.code)}</textarea></label><div class="nxRow"><button class="nxB" data-a="netCopy">📋 Копировать</button><button class="nxB" data-a="netShare">📤 Поделиться</button></div><div class="nxWait"><i></i>Ждём подключения хоста…</div>`:''}`;}
 else{const host=NET.role==='host',S=NX.series,peer=NX.peer||'Друг';
  const pl=(nm,role,rdy,ic)=>`<div class="nxPl ${rdy?'rdy':''}"><div class="nxAv">${ic}</div><b>${netEsc(nm)}</b><small>${role}</small><em>${rdy?'✅ Готов':'⏳ Не готов'}</em></div>`;
  const sel=(k,lb,opts,val)=>`<label class="nxF">${lb}<select class="nxIn" data-nc="${k}">${opts.map(o=>`<option value="${o[0]}" ${String(o[0])===String(val)?'selected':''}>${o[1]}</option>`).join('')}</select></label>`;
  const cfg=NX.cfg;
  h=`<div class="nxOk">✔ Подключено <span id="nxPing" class="nxPing ${nxQ()}">📶 ${NX.ping||'…'} мс</span></div>${msg}
  <div class="nxPls">${pl(host?nxNick():peer,'Хост · левая команда',true,'🏠')}<div class="nxVs">VS</div>${pl(host?peer:nxNick(),'Гость · правая команда',host?NX.peerRdy:NX.myRdy,'🎮')}</div>
  <div class="nxSeries"><small>Счёт серии</small><div><b>${S.h}</b><span>:</span><b>${S.g}</b></div><div class="nxHist">${S.hist.map(x=>`<em>${x[0]}:${x[1]}</em>`).join('')||'<em>матчей ещё не было</em>'}</div></div>
  <div class="nxPanel"><h3>Настройки матча</h3>${host?`<div class="nxGrid">${sel('time','Длительность',NX_TIMES.map(v=>[v,nxFmt(v)]),settings.time)}${sel('stadium','Стадион',nxOpt('stadium'),settings.stadium)}${sel('weather','Погода',nxOpt('weather'),settings.weather)}${sel('tod','Время суток',nxOpt('tod'),settings.tod)}</div>`:(cfg?`<div class="nxChips"><span>⏱ ${netEsc(cfg.time)}</span><span>🏟 ${netEsc(cfg.stadium)}</span><span>☁ ${netEsc(cfg.weather)}</span><span>🌓 ${netEsc(cfg.tod)}</span></div><p class="help sm">Настройки выбирает хост.</p>`:'<p class="help sm">Ждём настройки от хоста…</p>')}</div>
  <div class="nxPanel"><h3>Чат</h3><div id="nxChat" class="nxChat">${nxChatHtml()}</div><div class="nxRow"><input id="nxChatIn" class="nxIn" maxlength="140" placeholder="Сообщение…" autocomplete="off"><button class="nxB" data-a="netChatSend">➤</button></div><div class="nxQuick">${NX_QUICK.map(q=>`<button data-a="netQuick" data-v="${netEsc(q)}">${netEsc(q)}</button>`).join('')}</div><div class="nxQuick emo">${NX_EMO.map(e=>`<button data-a="netEmo" data-v="${e}">${e}</button>`).join('')}</div></div>
  <div class="nxRow">${host?`<button class="nxB pri ${NX.peerRdy?'':'wait'}" data-a="netPlay">${NX.peerRdy?'▶ Выбрать команды и играть':'⏳ Ждём готовности друга'}</button>`:`<button class="nxB pri" data-a="netReady">${NX.myRdy?'Отменить готовность':'✅ Я готов'}</button>`}<button class="nxB danger" data-a="netLeave">Отключиться</button></div>`;}
 h+='<div class="tfoot"><button class="mi" data-a="netBack">Назад</button></div>';
 b.innerHTML=h;const a2=$('netAnswer');if(a2&&av)a2.value=av;const c2=$('nxChatIn');if(c2){c2.value=cv;if(cf)c2.focus();}const ch=document.getElementById('nxChat');if(ch)ch.scrollTop=ch.scrollHeight;}
const _nxPlay0=ACT.netPlay;
Object.assign(ACT,{
 netPaste(){const t=$('netAnswer');if(!t)return;if(navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(v=>{t.value=v;nxToast('Вставлено');}).catch(()=>nxToast('Нет доступа к буферу — вставь вручную'));else nxToast('Вставь код вручную');},
 netShare(){const el=$('netCode');if(!el||!NET.code)return;if(navigator.share)navigator.share({title:'Cowball',text:el.value}).catch(()=>{});else ACT.netCopy();},
 netReady(){NX.myRdy=!NX.myRdy;netSend({t:'rdy',v:NX.myRdy},true);nxRefresh();},
 netPlay(){if(!NX.peerRdy){nxToast('Друг ещё не готов');return;}_nxPlay0();},
 netChatSend(){const i=$('nxChatIn');if(!i||!i.value.trim())return;const m=i.value.trim().slice(0,140);i.value='';netSend({t:'chat',m},true);nxMsg(nxNick(),m,true);i.focus();},
 netQuick(d){const m=String(d.v||'').slice(0,140);if(!m||!NET.open)return;netSend({t:'chat',m},true);nxMsg(nxNick(),m,true);},
 netEmo(d){if(NET.open)nxEmo(d.v,true);},
 netLeave(){netReset();NET.ui='menu';NET.msg='';renderNet();}
});
document.addEventListener('input',e=>{const t=e.target;if(t&&t.id==='nxNick')settings.netNick=t.value.slice(0,14),save();});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='nxChatIn'){e.preventDefault();ACT.netChatSend();}});
document.addEventListener('change',e=>{const t=e.target,k=t&&t.dataset&&t.dataset.nc;if(!k||NET.role!=='host')return;settings[k]=k==='time'?+t.value:t.value;save();nxSendCfg();});

// ================== v38: Adjustable Shader Studio ==================
// Dedicated, settings-driven post-processing pass. All sampling stays on the GPU;
// no extra external dependencies or per-frame object allocations are introduced.
function installCowballPostFXV36() {
  if (!renderer || !scene || !camera || !THREE.WebGLRenderTarget || renderer.__cowballPostFXV36) return;
  const rawRender = renderer.render.bind(renderer);
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    depthBuffer: true,
    stencilBuffer: false,
    generateMipmaps: false
  });
  target.texture.generateMipmaps = false;
  target.texture.encoding = THREE.LinearEncoding;
  target.texture.name = 'Cowball_PostFX_Source_v38';
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  postCamera.position.z = 1;
  const postMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: target.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBloomStrength: { value: 0.28 },
      uTime: { value: 0 },
      uChromatic: { value: 0.00115 },
      uVignette: { value: 0.20 },
      uGrain: { value: 0.012 },
      uSharpen: { value: 0.12 },
      uExposure: { value: 1.0 },
      uSaturation: { value: 1.05 },
      uToneMode: { value: 1.0 },
      uQuality: { value: 2.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 uResolution;
      uniform float uBloomStrength;
      uniform float uTime;
      uniform float uChromatic;
      uniform float uVignette;
      uniform float uGrain;
      uniform float uSharpen;
      uniform float uExposure;
      uniform float uSaturation;
      uniform float uToneMode;
      uniform float uQuality;
      varying vec2 vUv;
      float linearToSRGBChannel(float c) {
        c = max(c, 0.0);
        return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 0.416666667) - 0.055;
      }
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      vec3 brightPass(vec3 c) { return max(c - vec3(0.68), vec3(0.0)); }
      void main() {
        vec2 px = 1.0 / max(uResolution, vec2(1.0));
        vec2 radial = vUv - vec2(0.5);
        float edge = clamp(dot(radial, radial) * 4.0, 0.0, 1.0);
        float ca = uChromatic * edge;
        vec2 uvR = clamp(vUv + radial * ca, vec2(0.0), vec2(1.0));
        vec2 uvB = clamp(vUv - radial * ca, vec2(0.0), vec2(1.0));
        vec3 base;
        base.r = texture2D(tDiffuse, uvR).r;
        base.g = texture2D(tDiffuse, vUv).g;
        base.b = texture2D(tDiffuse, uvB).b;

        // Four nearby samples are shared by adaptive sharpening and the base bloom.
        vec3 north = texture2D(tDiffuse, clamp(vUv + vec2(0.0, px.y), vec2(0.0), vec2(1.0))).rgb;
        vec3 south = texture2D(tDiffuse, clamp(vUv - vec2(0.0, px.y), vec2(0.0), vec2(1.0))).rgb;
        vec3 east  = texture2D(tDiffuse, clamp(vUv + vec2(px.x, 0.0), vec2(0.0), vec2(1.0))).rgb;
        vec3 west  = texture2D(tDiffuse, clamp(vUv - vec2(px.x, 0.0), vec2(0.0), vec2(1.0))).rgb;
        vec3 localAverage = (north + south + east + west) * 0.25;
        float edgeEnergy = clamp(length(base - localAverage) * 2.0, 0.0, 1.0);
        float safeSharpen = uSharpen * (1.0 - edgeEnergy * 0.35);
        base += (base - localAverage) * safeSharpen;

        // Bloom taps scale with selected quality. Balanced uses shared taps;
        // High adds diagonal highlights; Ultra adds a second, wider glow radius.
        vec3 bloom = (brightPass(north) + brightPass(south) + brightPass(east) + brightPass(west)) * 0.25;
        if (uQuality >= 1.0) {
          vec2 d = px * 1.45;
          vec3 d1 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2( d.x, d.y), vec2(0.0), vec2(1.0))).rgb);
          vec3 d2 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2(-d.x, d.y), vec2(0.0), vec2(1.0))).rgb);
          vec3 d3 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2( d.x,-d.y), vec2(0.0), vec2(1.0))).rgb);
          vec3 d4 = brightPass(texture2D(tDiffuse, clamp(vUv - vec2(d.x,d.y), vec2(0.0), vec2(1.0))).rgb);
          bloom = mix(bloom, (bloom + d1 + d2 + d3 + d4) * 0.2, 0.72);
        }
        if (uQuality >= 2.0) {
          vec2 w = px * 2.8;
          vec3 w1 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2( w.x, 0.0), vec2(0.0), vec2(1.0))).rgb);
          vec3 w2 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2(-w.x, 0.0), vec2(0.0), vec2(1.0))).rgb);
          vec3 w3 = brightPass(texture2D(tDiffuse, clamp(vUv + vec2(0.0, w.y), vec2(0.0), vec2(1.0))).rgb);
          vec3 w4 = brightPass(texture2D(tDiffuse, clamp(vUv - vec2(0.0, w.y), vec2(0.0), vec2(1.0))).rgb);
          bloom = mix(bloom, (bloom + w1 + w2 + w3 + w4) * 0.2, 0.66);
        }
        vec3 color = base + bloom * uBloomStrength;
        color *= uExposure;
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        float sat = uSaturation;
        float contrast = 1.0;
        if (uToneMode > 0.5 && uToneMode < 1.5) { sat *= 1.02; contrast = 1.025; color *= vec3(1.012, 1.0, 0.992); }
        else if (uToneMode >= 1.5 && uToneMode < 2.5) { sat *= 1.04; contrast = 1.045; color *= vec3(0.995, 1.012, 0.995); }
        else if (uToneMode >= 2.5 && uToneMode < 3.5) { sat *= 1.12; contrast = 1.055; color *= vec3(1.025, 0.99, 1.035); }
        color = mix(vec3(luminance), color, sat);
        color = (color - vec3(0.5)) * contrast + vec3(0.5);
        float vignette = 1.0 - smoothstep(0.22, 0.92, length(radial) * 1.32);
        color *= mix(1.0 - uVignette, 1.0, vignette);
        float grain = (hash21(gl_FragCoord.xy + vec2(mod(uTime, 4096.0))) - 0.5) * uGrain;
        color = clamp(color + vec3(grain), vec3(0.0), vec3(1.0));
        gl_FragColor = vec4(linearToSRGBChannel(color.r), linearToSRGBChannel(color.g), linearToSRGBChannel(color.b), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    toneMapped: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
  quad.frustumCulled = false;
  quad.renderOrder = 999;
  postScene.add(quad);
  const drawSize = new THREE.Vector2(1, 1);
  let lastW = 0, lastH = 0;
  function resizeCowballPostFXV36() {
    renderer.getDrawingBufferSize(drawSize);
    const w = Math.max(1, Math.floor(drawSize.x));
    const h = Math.max(1, Math.floor(drawSize.y));
    if (w !== lastW || h !== lastH) {
      target.setSize(w, h);
      postMaterial.uniforms.uResolution.value.set(w, h);
      lastW = w; lastH = h;
    }
  }
  function updateCowballShaderUniforms() {
    const u = postMaterial.uniforms;
    u.uBloomStrength.value = Math.max(0, Number(settings.shaderBloom) || 0) * 0.004;
    u.uChromatic.value = Math.max(0, Number(settings.shaderChromatic) || 0) / 26000;
    u.uGrain.value = Math.max(0, Number(settings.shaderGrain) || 0) * 0.0012;
    u.uSharpen.value = Math.max(0, Number(settings.shaderSharpen) || 0) * 0.004;
    u.uVignette.value = Math.max(0, Number(settings.shaderVignette) || 0) * 0.008;
    u.uExposure.value = Math.max(0.5, Number(settings.shaderExposure) || 100) / 100;
    u.uSaturation.value = Math.max(0, Number(settings.shaderSaturation) || 0) / 100;
    const modes = { natural:0, cinematic:1, sport:2, neon:3, custom:0 };
    u.uToneMode.value = modes[settings.shaderPreset] ?? 1;
    let quality = settings.shaderQuality;
    if (quality === 'auto') {
      const pixelCount = Math.max(1, drawSize.x) * Math.max(1, drawSize.y);
      quality = settings.powerSave || pixelCount > 2200000 ? 'high' : 'ultra';
    }
    u.uQuality.value = quality === 'balanced' ? 0 : quality === 'high' ? 1 : 2;
    u.uTime.value = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
  }
  renderer.render = function (renderScene, renderCamera) {
    if (!settings.shaderFXV36 || renderScene !== scene || renderCamera !== camera) {
      return rawRender(renderScene, renderCamera);
    }
    try {
      resizeCowballPostFXV36();
      updateCowballShaderUniforms();
      renderer.setRenderTarget(target);
      rawRender(scene, camera);
      renderer.setRenderTarget(null);
      rawRender(postScene, postCamera);
    } catch (err) {
      try { renderer.setRenderTarget(null); } catch (_) {}
      console.warn('Cowball post-processing disabled after render error:', err);
      settings.shaderFXV36 = false;
      try { rawRender(scene, camera); } catch (_) {}
    }
  };
  renderer.__cowballPostFXV36 = { target, material: postMaterial, scene: postScene, camera: postCamera, resize: resizeCowballPostFXV36, update: updateCowballShaderUniforms };
  window.addEventListener('resize', resizeCowballPostFXV36, { passive: true });
  try { resizeCowballPostFXV36(); } catch (_) {}
}
installCowballPostFXV36();
UTX_DICT['Постобработка и шейдеры'] = ['Post-processing and shaders', 'Post-traitement et shaders', 'Posprocesado y shaders', 'Son işleme ve gölgelendiriciler', 'Post-emal və şaderlər'];
UTX_DICT['Шейдеры'] = ['Shaders', 'Shaders', 'Shaders', 'Gölgelendiriciler', 'Şaderlər'];
const COWBALL_SHADER_TRANSLATIONS = {
  'Постобработка включена':['Post-processing enabled','Post-traitement activé','Posprocesado activado','Son işleme etkin','Post-emal aktivdir'],
  'Визуальный стиль':['Visual style','Style visuel','Estilo visual','Görsel stil','Vizual üslub'],
  'Кино':['Cinema','Cinéma','Cine','Sinema','Kino'],
  'Спорт':['Sport','Sport','Deporte','Spor','İdman'],
  'Неон':['Neon','Néon','Neón','Neon','Neon'],
  'Натуральный':['Natural','Naturel','Natural','Doğal','Təbii'],
  'Ручной':['Manual','Manuel','Manual','El ile','Əl ilə'],
  'Качество шейдеров':['Shader quality','Qualité des shaders','Calidad de shaders','Shader kalitesi','Şader keyfiyyəti'],
  'Лёгкие':['Lightweight','Léger','Ligeros','Hafif','Yüngül'],
  'Высокие':['High','Élevé','Alto','Yüksek','Yüksək'],
  'Ультра':['Ultra','Ultra','Ultra','Ultra','Ultra'],
  'Авто':['Auto','Auto','Automático','Otomatik','Avto'],
  'Сила свечения (Bloom)':['Bloom strength','Intensité du bloom','Fuerza de brillo','Bloom gücü','Bloom gücü'],
  'Цветные края объектива':['Chromatic edge effect','Franges chromatiques','Bordes cromáticos','Kromatik kenarlar','Xromatik kənarlar'],
  'Киношное зерно':['Film grain','Grain cinéma','Grano cinematográfico','Film greni','Film dənəsi'],
  'Резкость изображения':['Image sharpness','Netteté de l’image','Nitidez de imagen','Görüntü keskinliği','Şəklin kəskinliyi'],
  'Затемнение по краям':['Edge vignette','Vignettage des bords','Viñeta de bordes','Kenar karartma','Kənar qaralması'],
  'Экспозиция':['Exposure','Exposition','Exposición','Pozlama','Ekspozisiya'],
  'Насыщенность цветов':['Color saturation','Saturation des couleurs','Saturación de color','Renk doygunluğu','Rəng dolğunluğu']
};
for (const [ru, vals] of Object.entries(COWBALL_SHADER_TRANSLATIONS)) {
  UTX_DICT[ru] = vals;
  UTX_FROM[ru] = ru;
  vals.forEach(v => { if (v) UTX_FROM[v] = ru; });
}

/* ===================== ULTIMATE TEAM 2.0 ===================== */
const UXV=2;
const UX_PP={GK:['ВРТ','ВРТ'],LB:['ЛЗ','ЗЩ'],CB:['ЦЗ','ЗЩ'],RB:['ПрЗ','ЗЩ'],CDM:['ОП','ПЗ'],CM:['ЦП','ПЗ'],CAM:['АП','ПЗ'],LM:['ЛП','ПЗ'],RM:['ПП','ПЗ'],LW:['ЛН','НАП'],RW:['ПН','НАП'],ST:['ЦН','НАП']};
const UX_NEAR={GK:[],CB:[],LB:['LM'],RB:['RM'],CDM:['CM'],CM:['CDM','CAM'],CAM:['CM','ST'],LM:['LW'],RM:['RW'],LW:['LM','ST'],RW:['RM','ST'],ST:['CAM','LW','RW']};
const UX_FORM={
 '4-3-3':[['GK',50,90],['LB',13,68],['CB',38,74],['CB',62,74],['RB',87,68],['CM',26,50],['CDM',50,56],['CM',74,50],['LW',16,22],['ST',50,15],['RW',84,22]],
 '4-4-2':[['GK',50,90],['LB',13,68],['CB',38,74],['CB',62,74],['RB',87,68],['LM',12,46],['CM',37,53],['CM',63,53],['RM',88,46],['ST',36,19],['ST',64,19]],
 '3-5-2':[['GK',50,90],['CB',25,72],['CB',50,76],['CB',75,72],['LM',10,46],['CM',30,54],['CDM',50,60],['CM',70,54],['RM',90,46],['ST',36,19],['ST',64,19]],
 '4-2-3-1':[['GK',50,90],['LB',13,68],['CB',38,74],['CB',62,74],['RB',87,68],['CDM',36,58],['CDM',64,58],['LM',16,36],['CAM',50,38],['RM',84,36],['ST',50,15]],
 '5-3-2':[['GK',50,90],['LB',9,64],['CB',30,73],['CB',50,77],['CB',70,73],['RB',91,64],['CM',27,50],['CM',50,54],['CM',73,50],['ST',36,19],['ST',64,19]],
 '4-5-1':[['GK',50,90],['LB',13,68],['CB',38,74],['CB',62,74],['RB',87,68],['LM',11,44],['CM',31,52],['CDM',50,58],['CM',69,52],['RM',89,44],['ST',50,16]]
};
const UX_CLUBS=[['Ясные Холмы','☀️'],['Клеверный Союз','🍀'],['Северный Рог','🐂'],['Зелёный Пастух','🌿'],['Золотая Нива','🌾'],['Молочный Берег','🥛'],['Красный Луг','🌹'],['Речные Быки','🌊']];
const UX_NAT=[['Испания','🇪🇸'],['Франция','🇫🇷'],['Германия','🇩🇪'],['Италия','🇮🇹'],['Бразилия','🇧🇷'],['Аргентина','🇦🇷'],['Англия','🇬🇧'],['Португалия','🇵🇹'],['Нидерланды','🇳🇱'],['Польша','🇵🇱'],['Украина','🇺🇦'],['Азербайджан','🇦🇿'],['Япония','🇯🇵'],['Норвегия','🇳🇴'],['Хорватия','🇭🇷'],['Сербия','🇷🇸'],['Грузия','🇬🇪'],['Россия','🇷🇺']];
const UX_FLAG=Object.fromEntries(UX_NAT);
const UX_FN=['Нико','Тимур','Марек','Роман','Ильяс','Бруно','Лев','Сэм','Дарио','Кай','Эмир','Тоби','Саша','Милан','Лука','Реми','Ясень','Мило','Рори','Тео','Вито','Арно','Фабиан','Оскар','Маркос','Ренат','Кир','Джино','Алан','Борис','Влад','Гас','Дэн','Ян','Эрик','Фёдор','Хьюго','Иван','Леон','Пабло'];
const UX_LN=['Травин','Лисов','Копытов','Буров','Молотов','Лужин','Орлов','Уитли','Велин','Норд','Сафин','Фенн','Мирен','Кораль','Мелвин','Солер','Рокко','Кастен','Вейл','Марек','Луар','Дюваль','Ривер','Бельт','Неро','Клим','Ору','Пастель','Рогов','Быков','Телков','Коровин','Рогалев','Пастухов','Мычко','Бодров','Хлебов','Сенников','Лугов','Молочков'];
const UX_RAR={bronze:'Бронза',silver:'Серебро',gold:'Золото',special:'Герой'};
const UX_RORD=['bronze','silver','gold','special'];
const UX_W={ST:[.2,.32,.1,.2,.03,.15],W:[.25,.15,.2,.25,.05,.1],CAM:[.12,.2,.28,.28,.04,.08],CM:[.1,.12,.28,.2,.15,.15],CDM:[.1,.05,.22,.12,.3,.21],FB:[.2,.04,.15,.15,.28,.18],CB:[.1,.03,.07,.05,.45,.3],GK:[.17,.17,.1,.25,.1,.21]};
const UX_AK=['pac','sho','pas','dri','def','phy'];
const UX_AL=['СКР','УД','ПАС','ДРБ','ЗАЩ','ФИЗ'], UX_GL=['ПРЫ','РУК','ВЫБ','РЕА','СКР','ПОЗ'];
const uxWOf=pp=>UX_W[pp==='ST'?'ST':['LW','RW','LM','RM'].includes(pp)?'W':['LB','RB'].includes(pp)?'FB':pp];
const uxCoarse=pp=>UX_PP[pp][1];
const uxR=(a,b)=>a+Math.random()*(b-a), uxI=(a,b)=>Math.floor(uxR(a,b+1)), uxPick=a=>a[Math.floor(Math.random()*a.length)];
const uxE=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uxN=n=>Math.round(n).toLocaleString('ru-RU');
const uxR10=n=>Math.max(10,Math.round(n/10)*10);
const uxRar=r=>r>=85?'special':r>=75?'gold':r>=65?'silver':'bronze';
function uxSeed(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function uxAttrs(pp,R,rng){const w=uxWOf(pp),a=w.map(x=>R+(x-1/6)*60+(rng()-.5)*6),diff=R-a.reduce((s,v,i)=>s+v*w[i],0);return a.map(v=>clamp(Math.round(v+diff),25,99));}
const UX_POOL=(()=>{const rng=uxSeed(20271),W=[['GK',8],['LB',7],['CB',14],['RB',7],['CDM',9],['CM',13],['CAM',8],['LM',5],['RM',5],['LW',6],['RW',6],['ST',12]],tot=W.reduce((s,x)=>s+x[1],0),out=[],names=new Set();
 for(let i=0;out.length<420&&i<2000;i++){let r=rng()*tot,pp='ST';for(const [k,v] of W){if((r-=v)<0){pp=k;break;}}
  const name=UX_FN[Math.floor(rng()*UX_FN.length)]+' '+UX_LN[Math.floor(rng()*UX_LN.length)];if(names.has(name))continue;names.add(name);
  const rating=clamp(Math.round(48+44*Math.pow(rng(),2.4)),48,93),at=uxAttrs(pp,rating,rng);
  out.push({id:out.length,name,pp,rating,nation:UX_NAT[Math.floor(rng()*UX_NAT.length)][0],club:UX_CLUBS[Math.floor(rng()*UX_CLUBS.length)][0],at,coat:Math.floor(rng()*360),face:['🐮','🐄','🐂'][Math.floor(rng()*3)],num:1+Math.floor(rng()*98)});}
 return out;})();
const UX_BYR={bronze:[],silver:[],gold:[],special:[]};UX_POOL.forEach(p=>UX_BYR[uxRar(p.rating)].push(p));
let uxIdc=0;const uxUid=()=>'u2_'+Date.now().toString(36)+'_'+(++uxIdc).toString(36)+Math.floor(Math.random()*1e4).toString(36);
function uxCard(p){const c={uid:uxUid(),tid:p.id,pid:p.id,name:p.name,pp:p.pp,pos:uxCoarse(p.pp),rating:p.rating,nation:p.nation,club:p.club,rarity:uxRar(p.rating),coat:p.coat,face:p.face,num:p.num,gk:p.pp==='GK'?p.rating:0};UX_AK.forEach((k,i)=>c[k]=p.at[i]);return c;}
function uxBase(c){let v=120*Math.pow(10,(c.rating-50)/17);v*=({GK:.85,CB:.92,LB:.9,RB:.9,CDM:.98,CM:1,CAM:1.1,LM:1,RM:1,LW:1.1,RW:1.1,ST:1.15})[c.pp]||1;if(c.rarity==='special')v*=1.5;return uxR10(v);}
const uxValue=c=>uxR10(uxBase(c)*((ut&&ut.tm&&ut.tm.trend)||1));
const uxQuick=c=>Math.max(25,Math.round(uxBase(c)*.35/5)*5);
/* ---------- состояние ---------- */
const UX_PACKS={bronze:{n:'Бронзовый пак',cost:600,k:3,w:{bronze:78,silver:20,gold:2},ic:'🥉',d:'3 игрока · в основном бронза'},silver:{n:'Серебряный пак',cost:1800,k:4,w:{bronze:25,silver:60,gold:14,special:1},ic:'🥈',d:'4 игрока · шанс на золото'},gold:{n:'Золотой пак',cost:5000,k:5,w:{silver:35,gold:56,special:9},ic:'🥇',d:'5 игроков · минимум 1 золото',min:'gold'},premium:{n:'Премиум пак',cost:12000,k:5,w:{gold:80,special:20},ic:'💎',d:'5 игроков · золото и герои',min:'gold'}};
function uxCreate(old){
 const U={v:UXV,name:(old&&old.name)||'Молочный клуб',badge:(old&&old.badge)||'🐮',color:(old&&/^#[0-9a-f]{6}$/i.test(old.color||''))?old.color:'#3a86ff',coins:10000,xp:0,level:1,division:10,formation:'4-3-3',collection:[],lineup:[],bench:[],market:[],
  stats:{played:0,wins:0,draws:0,losses:0,goals:0,conceded:0,packs:0,bought:0,sold:0,cupWins:0,divPlayed:0,divWins:0,divLosses:0,cupRun:0,best:0,purchases:[],sales:[],earned:0},
  tm:{list:[],mine:[],trend:1,trendAt:Date.now(),last:Date.now(),log:[],seq:0},obj:{day:'',c:{},claimed:{}},daily:{date:'',streak:0},pc:null,legends:[],claims:{}};
 const used=new Set(),pick=(pp,max)=>{const l=UX_POOL.filter(p=>p.pp===pp&&p.rating>=50&&p.rating<=max&&!used.has(p.id));const p=l.length?uxPick(l):uxPick(UX_POOL.filter(x=>x.pp===pp&&!used.has(x.id)));used.add(p.id);return uxCard(p);};
 UX_FORM[U.formation].forEach(s=>{const c=pick(s[0],66);U.collection.push(c);U.lineup.push(c.uid);});
 ['GK','CB','LB','CM','CAM','LW','ST'].forEach(pp=>{const c=pick(pp,64);U.collection.push(c);U.bench.push(c.uid);});
 return U;}
function uxLoad(){let d=settings.utData;if(d&&d.v===UXV&&Array.isArray(d.collection)&&d.collection.length>=11){d.tm=Object.assign({list:[],mine:[],trend:1,trendAt:Date.now(),last:Date.now(),log:[],seq:0},d.tm||{});d.obj=Object.assign({day:'',c:{},claimed:{}},d.obj||{});d.daily=Object.assign({date:'',streak:0},d.daily||{});d.claims=d.claims||{};d.legends=d.legends||[];d.market=d.market||[];if(!UX_FORM[d.formation])d.formation='4-3-3';return d;}return uxCreate(d);}
const uxSl=()=>UX_FORM[ut.formation]||UX_FORM['4-3-3'];
const uxFit=(c,slot)=>c.pp===slot?2:(UX_NEAR[slot]||[]).includes(c.pp)?1:0;
function uxRoles(f){return (UX_FORM[f]||UX_FORM['4-3-3']).map(s=>UX_PP[s[0]][1]);}
function uxFill(prefer){const sl=uxSl(),used=new Set(),res=[],pref=new Set(prefer||[]);
 const order=sl.map((s,i)=>i).sort((a,b)=>(sl[a][0]==='GK'?-1:0)-(sl[b][0]==='GK'?-1:0));
 order.forEach(i=>{const s=sl[i][0];let best=null,bs=-1e9;ut.collection.forEach(c=>{if(used.has(c.uid))return;if(s==='GK'&&c.pp!=='GK')return;if(s!=='GK'&&c.pp==='GK')return;const sc=c.rating+(uxFit(c,s)===2?0:uxFit(c,s)===1?-6:-30)+(pref.has(c.uid)?3:0);if(sc>bs){bs=sc;best=c;}});if(!best)best=ut.collection.find(c=>!used.has(c.uid));used.add(best.uid);res[i]=best.uid;});
 ut.lineup=res;uxRebench();}
function uxRebench(){const st=new Set(ut.lineup),old=(ut.bench||[]).filter(id=>utById(id)&&!st.has(id)),have=new Set(old);ut.bench=old.concat(ut.collection.filter(c=>!st.has(c.uid)&&!have.has(c.uid)).sort((a,b)=>b.rating-a.rating).map(c=>c.uid));}
const uxAutoL=()=>uxFill(ut.lineup);
function uxChem(){const sl=uxSl(),cs=ut.lineup.map(utById),cn={},nn={};cs.forEach(c=>{if(!c)return;cn[c.club]=(cn[c.club]||0)+1;nn[c.nation]=(nn[c.nation]||0)+1;});
 const per=cs.map((c,i)=>{if(!c)return 0;const f=uxFit(c,sl[i][0]);if(!f)return 0;const k=cn[c.club],n=nn[c.nation],p=(k>=7?3:k>=4?2:k>=2?1:0)+(n>=8?3:n>=5?2:n>=2?1:0);return f===2?Math.min(3,p):Math.min(1,p);});
 return {per,total:per.reduce((a,b)=>a+b,0),max:33};}
const uxChemPct=()=>Math.round(uxChem().total/33*100);
/* ---------- UI-хелперы ---------- */
let uxCoinShown=null,uxAnim=true,uxModalOn=false,uxSel=null,uxTmF={q:'',pp:'',rar:'',max:'',sort:'price',page:1},uxTmTab='search',uxClubF={q:'',pp:'',rar:'',sort:'rating'},uxCsel=null,uxToastT=0,uxPackQ=null;
function uxToast(t){const el=$('uxToast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(uxToastT);uxToastT=setTimeout(()=>el.classList.remove('on'),2600);}
function uxCardHtml(c,o){o=o||{};const L=c.pp==='GK'?UX_GL:UX_AL,big=o.big,w=o.w||64;
 return `<div class="fc r-${c.rarity}${big?' big':''}${o.sel?' sel':''}${c.career?' cr':''}" style="--w:${w}px;--hue:${c.coat||0}deg"${o.a?` data-a="${o.a}" ${o.attrs||''}`:''}>
 <div class="fc-l"><b class="fc-r">${c.rating}</b><i class="fc-p">${UX_PP[c.pp][0]}</i><span class="fc-f">${UX_FLAG[c.nation]||'🏳️'}</span><span class="fc-b">${(UX_CLUBS.find(x=>x[0]===c.club)||['','🐮'])[1]}</span></div>
 <div class="fc-face"><span>${c.face||'🐮'}</span></div><div class="fc-n">${uxE(c.name.split(' ').pop())}</div>
 ${big?`<div class="fc-s">${UX_AK.map((k,i)=>`<span><b>${c[k]}</b>${L[i]}</span>`).join('')}</div>`:''}${c.career?'<div class="fc-tag">★</div>':''}</div>`;}
function uxTop(){const ch=uxChem();return `<div class="uxTop"><div class="uxClub"><span class="uxBadge" style="background:${uxE(ut.color)}">${ut.badge}</span><div><b>${uxE(ut.name)}</b><small>Дивизион ${ut.division} · Ур. ${ut.level}</small></div></div>
 <div class="uxPills"><span class="pill coin">🪙 <b id="uxCoinN">${uxN(ut.coins)}</b></span><span class="pill">⭐ ${utSquadRating()}</span><span class="pill">🔗 ${ch.total}/33</span></div><button class="uxb" data-a="home">✕ Меню</button></div>`;}
const UX_TABS=[['home','Главная'],['squad','Состав'],['trade','Трансферы'],['store','Магазин'],['club','Клуб'],['career','Карьера'],['obj','Цели']];
function uxRender(){const root=$('uxRoot');if(!root)return;uxMarketTick(true);
 const body={home:uxHome,squad:uxSquad,trade:uxMarket,store:uxStore,club:uxClubTab,career:uxCareer,obj:uxObj}[utTab]||uxHome;
 const old=$('uxBody'),sc=old?old.scrollTop:0,om=$('uxModal'),mh=(uxModalOn&&om)?om.innerHTML:'';
 root.innerHTML=uxTop()+`<div class="uxTabs">${UX_TABS.map(t=>`<button class="${utTab===t[0]?'on':''}" data-a="uxTab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div><div class="uxBody" id="uxBody">${body()}</div><div id="uxModal" class="uxModal ${uxModalOn?'on':''}"></div><div id="uxToast" class="uxToast"></div>`;
 const nb=$('uxBody');if(nb){nb.scrollTop=sc;if(uxAnim){nb.classList.add('ani');uxAnim=false;}nb.querySelectorAll('.uxTile,.uxPanel,.uxPack,.uxObj,.uxCw,.uxLot,.uxSlot,.uxHero').forEach((el,i)=>el.style.setProperty('--i',Math.min(i,16)));}
 if(mh){const m2=$('uxModal');if(m2){m2.classList.add('on');m2.innerHTML=mh;}}
 const cn=$('uxCoinN');if(cn){const from=uxCoinShown==null?ut.coins:uxCoinShown,to=ut.coins;uxCoinShown=to;if(from!==to){cn.parentNode.classList.add(to>from?'up':'dn');const t0=performance.now(),st=t=>{const k=Math.min(1,(t-t0)/700);cn.textContent=uxN(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1&&cn.isConnected)requestAnimationFrame(st);};requestAnimationFrame(st);}}}
function uxModal(html){uxModalOn=true;const m=$('uxModal');if(!m)return;m.classList.add('on');m.innerHTML=`<div class="uxMBox">${html}</div>`;}
function uxClose(){uxModalOn=false;const m=$('uxModal');if(m){m.classList.remove('on');m.innerHTML='';}}
/* ---------- Главная ---------- */
function uxHome(){const s=ut.stats;
 return `<div class="uxGrid">
 <div class="uxHero"><h2>Матчи</h2><p class="help">Играй составом на движке Cowball. Победа — до 450 🪙, плюс опыт клуба.</p>
 <div class="uxRow"><button class="uxb pri" data-a="utPlay" data-v="friendly">Товарищеский</button><button class="uxb" data-a="utPlay" data-v="division">Дивизион ${ut.division}</button><button class="uxb" data-a="utPlay" data-v="cup">Кубок ${s.cupRun+1}/3</button></div></div>
 <div class="uxTile" data-a="uxTab" data-v="squad"><i>⚽</i><b>Состав</b><small>${ut.formation} · химия ${uxChem().total}/33</small></div>
 <div class="uxTile" data-a="uxTab" data-v="trade"><i>🔄</i><b>Трансфер-маркет</b><small>Покупай, торгуй, зарабатывай</small></div>
 <div class="uxTile" data-a="uxTab" data-v="store"><i>🎁</i><b>Магазин паков</b><small>От 600 🪙</small></div>
 <div class="uxTile" data-a="uxTab" data-v="career"><i>🧑‍🎓</i><b>Карьера игрока</b><small>${ut.pc?uxE(ut.pc.name)+' · '+ut.pc.ovr:'Создай своего игрока'}</small></div>
 <div class="uxTile" data-a="uxTab" data-v="obj"><i>🎯</i><b>Цели и награды</b><small>${uxObjReady()?'Есть награды!':'Ежедневные задания'}</small></div>
 <div class="uxPanel"><h3>Статистика клуба</h3><div class="uxStats"><span><b>${s.played}</b>матчей</span><span><b>${s.wins}</b>побед</span><span><b>${s.goals}</b>голов</span><span><b>${s.bought}/${s.sold}</b>куплено/продано</span><span><b>${s.cupWins}</b>кубков</span><span><b>${s.best||utSquadRating()}</b>рекорд</span></div></div></div>`;}
/* ---------- Состав ---------- */
function uxSquad(){const sl=uxSl(),ch=uxChem();
 const slots=sl.map((s,i)=>{const c=utById(ut.lineup[i]),f=c?uxFit(c,s[0]):0;return `<div class="uxSlot${uxSel===i?' sel':''}" style="left:${s[1]}%;top:${s[2]}%" data-a="uxSlot" data-i="${i}">${c?uxCardHtml(c,{w:0}):'<div class="fc empty">+</div>'}<div class="uxChem f${f}">${[0,1,2].map(k=>`<i class="${k<ch.per[i]?'on':''}"></i>`).join('')}</div><em>${UX_PP[s[0]][0]}</em></div>`;}).join('');
 const bench=ut.bench.map(utById).filter(Boolean);
 return `<div class="uxSquad"><div class="uxPitchWrap"><div class="uxPitch"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".5"><rect x="2" y="2" width="96" height="96"/><line x1="2" y1="50" x2="98" y2="50"/><circle cx="50" cy="50" r="10"/><rect x="26" y="2" width="48" height="16"/><rect x="26" y="82" width="48" height="16"/><rect x="38" y="2" width="24" height="7"/><rect x="38" y="91" width="24" height="7"/></g></svg>${slots}<div class="uxFormTag">${ut.formation}</div></div></div>
 <div class="uxSide"><div class="uxPanel"><h3>Схема</h3><div class="uxRow wrap">${Object.keys(UX_FORM).map(f=>`<button class="uxb sm ${ut.formation===f?'pri':''}" data-a="uxForm" data-v="${f}">${f}</button>`).join('')}</div><div class="uxRow"><button class="uxb sm" data-a="uxAuto">Авто-состав</button></div></div>
 <div class="uxPanel"><div class="uxStats"><span><b>${utSquadRating()}</b>рейтинг</span><span><b>${ch.total}/33</b>химия</span><span><b>+${(ch.total/33*3.5).toFixed(1)}%</b>бонус</span></div><p class="help sm">Нажми на позицию, чтобы заменить игрока. Позиция «на месте» и общий клуб или страна дают химию.</p></div>
 <div class="uxPanel"><h3>Скамейка</h3><div class="uxBenchRow">${bench.slice(0,7).map(c=>`<div class="uxBc" data-a="uxCard" data-id="${c.uid}">${uxCardHtml(c,{w:50})}</div>`).join('')||'<small>Пусто</small>'}</div></div></div></div>`;}
function uxPick_(i){uxSel=i;const sl=uxSl()[i][0],cur=ut.lineup[i];
 const list=ut.collection.filter(c=>c.uid!==cur&&(sl==='GK')===(c.pp==='GK')).sort((a,b)=>uxFit(b,sl)-uxFit(a,sl)||b.rating-a.rating).slice(0,60);
 uxModal(`<h3>Позиция ${UX_PP[sl][0]}</h3><div class="uxPick">${list.map(c=>{const f=uxFit(c,sl);return `<div class="uxPr" data-a="uxSet" data-i="${i}" data-id="${c.uid}">${uxCardHtml(c,{w:48})}<div><b>${uxE(c.name)}</b><small>${c.club} · ${c.nation}</small><span class="tag f${f}">${f===2?'на месте':f===1?'близко':'не на месте'}</span></div><strong>${c.rating}</strong></div>`;}).join('')||'<p class="help">Нет подходящих игроков.</p>'}</div><button class="uxb" data-a="uxClose">Отмена</button>`);}
/* ---------- Магазин ---------- */
function uxStore(){return `<div class="uxGrid">${Object.keys(UX_PACKS).map(k=>{const p=UX_PACKS[k];return `<div class="uxPack p-${k}"><i>${p.ic}</i><b>${p.n}</b><small>${p.d}</small><button class="uxb ${ut.coins>=p.cost?'pri':''}" data-a="uxPack" data-v="${k}">🪙 ${uxN(p.cost)}</button></div>`;}).join('')}
 <div class="uxPanel wide"><h3>Быстрая продажа</h3><p class="help sm">Ненужные игроки продаются в клуб за 35% базовой цены. Выгоднее выставлять их на трансфер-маркет.</p><button class="uxb sm" data-a="uxSellExtras">Продать бронзу вне состава</button></div></div>`;}
function uxRoll(w){const t=Object.values(w).reduce((a,b)=>a+b,0);let r=Math.random()*t;for(const k in w){if((r-=w[k])<0)return k;}return 'bronze';}
function uxOpenPack(k){const p=UX_PACKS[k];if(!p||ut.coins<p.cost){uxToast('Не хватает монет');return;}ut.coins-=p.cost;const cards=[];
 for(let i=0;i<p.k;i++){let r=uxRoll(p.w);if(p.min&&i===p.k-1&&!cards.some(c=>UX_RORD.indexOf(c.rarity)>=UX_RORD.indexOf(p.min)))r=r==='special'?'special':p.min;const pl=uxPick(UX_BYR[r]);cards.push(uxCard(pl));}
 cards.sort((a,b)=>a.rating-b.rating);cards.forEach(c=>{ut.collection.push(c);ut.bench.push(c.uid);});ut.stats.packs++;uxObjAdd('packs',1);ut.xp+=25;utRefreshLevel();saveUT();uxReveal(cards,0);renderUT();}
function uxReveal(cards,i){uxPackQ={cards,i,fl:false};const c=cards[i];
 uxModal(`<div class="uxRev r-${c.rarity}"><h3>${i+1} / ${cards.length}</h3><div class="uxFlip" id="uxFlip"><div class="bk">🐮</div><div class="ft">${uxCardHtml(c,{big:1,w:170})}</div></div><p class="help" id="uxRevInfo">Нажми, чтобы открыть</p><button class="uxb pri" id="uxRevBtn" data-a="uxRevNext">Открыть</button></div>`);}
/* ---------- Клуб ---------- */
function uxClubTab(){const f=uxClubF;let l=ut.collection.filter(c=>(!f.q||c.name.toLowerCase().includes(f.q.toLowerCase()))&&(!f.pp||c.pp===f.pp)&&(!f.rar||c.rarity===f.rar));
 l.sort((a,b)=>f.sort==='price'?uxValue(b)-uxValue(a):f.sort==='pos'?a.pp.localeCompare(b.pp):b.rating-a.rating);
 return `<div class="uxPanel"><div class="uxFilters">${uxFilt('c')}</div></div><div class="uxCards" id="uxClubList">${uxClubList(l)}</div>
 <div class="uxPanel"><h3>Оформление клуба</h3><div class="uxRow wrap"><input class="uxIn" id="uxName" maxlength="20" value="${uxE(ut.name)}"><button class="uxb sm" data-a="uxRename">Сохранить</button><button class="uxb sm" data-a="uxBadge">${ut.badge} Эмблема</button>${['#3a86ff','#ff7a1a','#b8ff3d','#b266ff','#29d3b0','#f15b75','#f2d36b','#edf2f7'].map(c=>`<button class="uxDot" style="background:${c}" data-a="uxColor" data-v="${c}"></button>`).join('')}</div><button class="uxb sm danger" data-a="utReset">Сбросить Ultimate Team…</button></div>`;}
function uxClubList(l){const st=new Set(ut.lineup);return l.map(c=>`<div class="uxCw">${uxCardHtml(c,{w:78,a:'uxCard',attrs:`data-id="${c.uid}"`})}<small>${st.has(c.uid)?'в составе':'🪙 '+uxN(uxValue(c))}</small></div>`).join('')||'<p class="help">Ничего не найдено.</p>';}
function uxFilt(k){const f=k==='c'?uxClubF:uxTmF;return `<input class="uxIn" data-f="${k}.q" placeholder="Имя" value="${uxE(f.q)}"><select class="uxIn" data-f="${k}.pp"><option value="">Позиция</option>${Object.keys(UX_PP).map(p=>`<option value="${p}" ${f.pp===p?'selected':''}>${UX_PP[p][0]}</option>`).join('')}</select><select class="uxIn" data-f="${k}.rar"><option value="">Редкость</option>${UX_RORD.map(r=>`<option value="${r}" ${f.rar===r?'selected':''}>${UX_RAR[r]}</option>`).join('')}</select>${k==='t'?`<input class="uxIn" type="number" data-f="t.max" placeholder="Макс. цена" value="${uxE(f.max)}"><select class="uxIn" data-f="t.sort">${[['price','Цена ↑'],['rating','Рейтинг ↓'],['time','Время ↑']].map(o=>`<option value="${o[0]}" ${f.sort===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`:`<select class="uxIn" data-f="c.sort">${[['rating','Рейтинг'],['price','Цена'],['pos','Позиция']].map(o=>`<option value="${o[0]}" ${f.sort===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`}`;}
function uxCardModal(id){const c=utById(id);if(!c)return;uxCsel=id;const st=ut.lineup.includes(id);const L=c.pp==='GK'?UX_GL:UX_AL;
 uxModal(`<div class="uxDet">${uxCardHtml(c,{big:1,w:150})}<div><h3>${uxE(c.name)}</h3><p class="help sm">${UX_RAR[c.rarity]} · ${UX_PP[c.pp][0]} · ${c.nation} · ${c.club}</p>${UX_AK.map((k,i)=>`<div class="uxBar"><span>${L[i]}</span><i><u style="width:${c[k]}%"></u></i><b>${c[k]}</b></div>`).join('')}<p class="help">Цена на рынке ≈ <b>🪙 ${uxN(uxValue(c))}</b></p>
 ${c.career?'<p class="help sm">Карточка твоего игрока из карьеры. Продать нельзя.</p>':`<div class="uxRow wrap"><button class="uxb pri sm ${st?'dis':''}" data-a="uxSellDlg" data-id="${id}">Выставить на рынок</button><button class="uxb sm ${st?'dis':''}" data-a="uxQuick" data-id="${id}">Быстро · 🪙 ${uxN(uxQuick(c))}</button></div>`}${st?'<p class="help sm">Игрок в основе — сначала замени его.</p>':''}<button class="uxb sm" data-a="uxClose">Закрыть</button></div></div>`);}
/* ---------- Трансфер-маркет ---------- */
const UX_MINP=50;
const uxInc=p=>Math.max(10,Math.round(p*.05/10)*10);
const uxNext=l=>l.bid>0?l.bid+uxInc(l.bid):l.start;
function uxTmGen(n){const T=ut.tm,now=Date.now();for(let i=0;i<n;i++){const c=uxCard(uxPick(UX_POOL)),v=uxValue(c);const mult=Math.random()<.12?uxR(.7,.9):uxR(.98,1.35);T.list.push({id:'l'+(++T.seq),card:c,seller:'npc',start:uxR10(v*uxR(.55,.85)),buy:uxR10(v*mult),bid:0,bidder:null,ends:now+uxI(2,45)*60000,value:v});}}
function uxLog(t){ut.tm.log.unshift({t:Date.now(),m:t});ut.tm.log=ut.tm.log.slice(0,40);}
function uxMarketTick(silent){const T=ut.tm,now=Date.now(),el=Math.min(now-T.last,6*3600000);let ch=false;T.last=now;
 if(now-T.trendAt>3600000){T.trend=clamp(T.trend*uxR(.96,1.05),.8,1.25);T.trendAt=now;}
 const ticks=el/2000;
 T.list=T.list.filter(l=>{const rem=l.ends-now;
  if(l.bidder==='me'&&rem>0&&rem<=90000){const p=l.bid<l.value*.97?.05:.002,pr=1-Math.pow(1-p,Math.min(ticks,45));if(Math.random()<pr){ut.coins+=l.bid;l.bid=l.bid+uxInc(l.bid);l.bidder='npc';uxLog(`Тебя перебили: ${l.card.name}`);ch=true;}}
  else if(l.bidder!=='me'&&rem>0&&rem<120000&&(l.bid||l.start)<l.value*.95){if(Math.random()<1-Math.pow(1-.015,Math.min(ticks,60))){l.bid=l.bid>0?l.bid+uxInc(l.bid):l.start;l.bidder='npc';}}
  if(rem>0)return true;
  if(l.bidder==='me'){ut.collection.push(l.card);ut.bench.push(l.card.uid);ut.stats.bought++;uxObjAdd('bought',1);ut.stats.purchases.unshift({name:l.card.name,price:l.bid,date:new Date().toLocaleDateString('ru-RU')});ut.stats.purchases=ut.stats.purchases.slice(0,20);uxLog(`Выигран аукцион: ${l.card.name} за ${l.bid}`);ch=true;}
  return false;});
 const keep=[];T.mine.forEach(l=>{if(l.status!=='active'){keep.push(l);return;}const v=uxValue(l.card),ratio=l.buy/v,p=ratio<=.9?.08:ratio<=1?.03:ratio<=1.15?.008:ratio<=1.3?.002:0,win=Math.max(0,Math.min(now,l.ends)-(l.t0||T.last-el));
  if(l.t0<now&&p>0&&Math.random()<1-Math.pow(1-p,Math.min(win/2000,3000))){uxSold(l,l.buy);ch=true;}
  else if(now>=l.ends){if(l.start<=v*1.1&&Math.random()<.6){uxSold(l,l.start);}else{l.status='expired';ut.collection.push(l.card);ut.bench.push(l.card.uid);uxLog(`Не продан: ${l.card.name}`);}ch=true;}
  l.t0=now;keep.push(l);});
 T.mine=keep.slice(-30);
 const act=T.list.length;if(act<26)uxTmGen(30-act);
 if(ch)saveUT();return ch;}
function uxSold(l,price){const net=Math.floor(price*.95);l.status='sold';l.price=net;ut.coins+=net;ut.stats.sold++;ut.stats.sales.unshift({name:l.card.name,price:net,date:new Date().toLocaleDateString('ru-RU'),tax:price-net});ut.stats.sales=ut.stats.sales.slice(0,20);uxObjAdd('sold',1);uxLog(`Продан: ${l.card.name} за ${net} (налог 5%)`);}
function uxTmFiltered(){const f=uxTmF,now=Date.now();let l=ut.tm.list.filter(x=>x.ends>now&&(!f.q||x.card.name.toLowerCase().includes(f.q.toLowerCase()))&&(!f.pp||x.card.pp===f.pp)&&(!f.rar||x.card.rarity===f.rar)&&(!f.max||(x.bid>0?x.bid:x.start)<=+f.max));
 l.sort((a,b)=>f.sort==='rating'?b.card.rating-a.card.rating:f.sort==='time'?a.ends-b.ends:(a.buy-b.buy));return l;}
const uxLeft=ts=>{const s=Math.max(0,Math.floor((ts-Date.now())/1000));return s>=3600?`${Math.floor(s/3600)}ч ${String(Math.floor(s%3600/60)).padStart(2,'0')}м`:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
function uxTmRow(l){const mine=l.bidder==='me',nb=uxNext(l),c=l.card;
 return `<div class="uxLot${mine?' mine':''}">${uxCardHtml(c,{w:58,a:'uxLotInfo',attrs:`data-id="${l.id}"`})}<div class="uxLotI"><b>${uxE(c.name)}</b><small>${UX_PP[c.pp][0]} · ${uxE(c.club)} · ≈🪙${uxN(l.value)}</small><small>Ставка: <b>${l.bid?uxN(l.bid):'—'}</b>${mine?' ★ твоя':''} · ⏱ <span data-uxend="${l.ends}">${uxLeft(l.ends)}</span></small></div><div class="uxLotB"><button class="uxb sm" data-a="uxBid" data-id="${l.id}" ${mine?'disabled':''}>Ставка ${uxN(nb)}</button><button class="uxb sm pri" data-a="uxBuy" data-id="${l.id}">Купить ${uxN(l.buy)}</button></div></div>`;}
function uxTmListHtml(){const all=uxTmFiltered(),per=12,pg=clamp(uxTmF.page,1,Math.max(1,Math.ceil(all.length/per)));uxTmF.page=pg;
 return all.slice((pg-1)*per,pg*per).map(uxTmRow).join('')+(all.length?`<div class="uxRow"><button class="uxb sm" data-a="uxPage" data-v="-1">‹</button><span class="pill">${pg} / ${Math.ceil(all.length/per)}</span><button class="uxb sm" data-a="uxPage" data-v="1">›</button></div>`:'<p class="help">Ничего не найдено. Измени фильтры.</p>');}
function uxMarket(){const T=ut.tm,tabs=[['search','Поиск'],['mine','Мои продажи'],['bids','Мои ставки'],['log','Журнал']],tr=Math.round((T.trend-1)*100);
 let h=`<div class="uxRow wrap">${tabs.map(t=>`<button class="uxb sm ${uxTmTab===t[0]?'pri':''}" data-a="uxTmTab" data-v="${t[0]}">${t[1]}</button>`).join('')}<span class="pill">Рынок ${tr>=0?'↑ +':'↓ '}${tr}%</span></div>`;
 if(uxTmTab==='search')h+=`<div class="uxPanel"><div class="uxFilters">${uxFilt('t')}</div></div><div id="uxTmList">${uxTmListHtml()}</div>`;
 else if(uxTmTab==='mine'){const rows=T.mine.slice().reverse().map(l=>`<div class="uxLot">${uxCardHtml(l.card,{w:50})}<div class="uxLotI"><b>${uxE(l.card.name)}</b><small>Старт ${uxN(l.start)} · Купить ${uxN(l.buy)}</small><small>${l.status==='active'?'⏱ <span data-uxend="'+l.ends+'">'+uxLeft(l.ends)+'</span>':l.status==='sold'?'✅ Продан: 🪙 '+uxN(l.price):'⌛ Не продан (карта в клубе)'}</small></div><div class="uxLotB">${l.status==='active'?`<button class="uxb sm" data-a="uxCancel" data-id="${l.id}">Снять</button>`:`<button class="uxb sm" data-a="uxClearL" data-id="${l.id}">Убрать</button>`}</div></div>`).join('');h+=rows||'<p class="help">Ты ничего не продаёшь. Открой карточку в «Клубе» и нажми «Выставить на рынок».</p>';}
 else if(uxTmTab==='bids'){const l=T.list.filter(x=>x.bidder==='me');h+=l.map(uxTmRow).join('')||'<p class="help">Активных ставок нет.</p>';}
 else h+=`<div class="uxPanel">${T.log.map(x=>`<div class="uxLg"><small>${new Date(x.t).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small> ${uxE(x.m)}</div>`).join('')||'<p class="help">Пока пусто.</p>'}</div>`;
 return h;}
function uxBid(id){const l=ut.tm.list.find(x=>x.id===id);if(!l||l.ends<=Date.now()){uxToast('Лот закрыт');return;}if(l.bidder==='me')return;const p=uxNext(l);if(ut.coins<p){uxToast('Не хватает монет');return;}if(p>=l.buy){uxBuy(id);return;}ut.coins-=p;l.bid=p;l.bidder='me';saveUT();uxToast(`Ставка ${uxN(p)} принята`);renderUT();}
function uxBuy(id){const l=ut.tm.list.find(x=>x.id===id);if(!l||l.ends<=Date.now()){uxToast('Лот закрыт');return;}let cost=l.buy;if(l.bidder==='me')cost-=l.bid;if(ut.coins<cost){uxToast('Не хватает монет');return;}ut.coins-=cost;ut.collection.push(l.card);ut.bench.push(l.card.uid);ut.stats.bought++;uxObjAdd('bought',1);ut.stats.purchases.unshift({name:l.card.name,price:l.buy,date:new Date().toLocaleDateString('ru-RU')});ut.stats.purchases=ut.stats.purchases.slice(0,20);ut.tm.list=ut.tm.list.filter(x=>x!==l);uxLog(`Куплен: ${l.card.name} за ${l.buy}`);ut.xp+=10;utRefreshLevel();saveUT();uxToast(`Куплен ${l.card.name}`);renderUT();}
function uxSellDlg(id){const c=utById(id);if(!c||ut.lineup.includes(id)||c.career)return;const v=uxValue(c);
 uxModal(`<h3>Выставить: ${uxE(c.name)}</h3><p class="help sm">Рыночная цена ≈ 🪙 ${uxN(v)}. Налог при продаже 5%.</p><label class="uxF">Стартовая цена<input class="uxIn" id="uxS" type="number" value="${uxR10(v*.8)}"></label><label class="uxF">Купить сейчас<input class="uxIn" id="uxB" type="number" value="${uxR10(v*1.1)}"></label><label class="uxF">Время<select class="uxIn" id="uxD"><option value="15">15 мин</option><option value="60" selected>1 час</option><option value="180">3 часа</option></select></label><div class="uxRow"><button class="uxb pri" data-a="uxList" data-id="${id}">Выставить</button><button class="uxb" data-a="uxClose">Отмена</button></div>`);}
function uxList(id){const c=utById(id);if(!c||ut.lineup.includes(id))return;const s=Math.round(+$('uxS').value),b=Math.round(+$('uxB').value),d=+$('uxD').value;if(!(s>=UX_MINP)||!(b>=s)){uxToast('Проверь цены: купить ≥ старта ≥ 50');return;}if(ut.tm.mine.filter(x=>x.status==='active').length>=15){uxToast('Максимум 15 лотов');return;}
 ut.collection=ut.collection.filter(x=>x!==c);ut.bench=ut.bench.filter(x=>x!==id);ut.tm.mine.push({id:'m'+(++ut.tm.seq),card:c,start:s,buy:b,ends:Date.now()+d*60000,t0:Date.now(),status:'active'});saveUT();uxClose();uxToast('Выставлен на рынок');uxTmTab='mine';utTab='market';renderUT();}
function uxQuickSell(id){const c=utById(id);if(!c||ut.lineup.includes(id)||c.career||ut.collection.length<=18)return uxToast(ut.collection.length<=18?'Нужно хранить минимум 18 карточек':'Нельзя продать');const v=uxQuick(c);if(!confirm(`Быстро продать ${c.name} за ${v} монет?`))return;ut.collection=ut.collection.filter(x=>x!==c);ut.bench=ut.bench.filter(x=>x!==id);ut.coins+=v;ut.stats.sold++;saveUT();uxClose();renderUT();}
/* ---------- Цели ---------- */
function uxDayKey(){return new Date().toISOString().slice(0,10);}
function uxObjInit(){if(ut.obj.day!==uxDayKey()){ut.obj={day:uxDayKey(),c:{},claimed:{}};}}
function uxObjAdd(k,n){uxObjInit();ut.obj.c[k]=(ut.obj.c[k]||0)+n;}
const UX_OBJ=[['play','Сыграй 1 матч','played',1,200],['win','Выиграй 2 матча','wins',2,400],['goal','Забей 5 голов','goals',5,350],['pack','Открой пак','packs',1,300],['buy','Купи игрока на рынке','bought',1,250],['sell','Продай игрока на рынке','sold',1,250]];
function uxObjReady(){uxObjInit();return UX_OBJ.some(o=>(ut.obj.c[o[2]]||0)>=o[3]&&!ut.obj.claimed[o[0]])||ut.daily.date!==uxDayKey();}
function uxObj(){uxObjInit();const today=uxDayKey(),got=ut.daily.date===today;
 return `<div class="uxPanel"><h3>Ежедневная награда</h3><p class="help sm">Серия: ${ut.daily.streak||0} дн. Каждый 7-й день — серебряный пак.</p><button class="uxb ${got?'dis':'pri'}" data-a="uxDaily">${got?'Получено сегодня':'Забрать'}</button></div>
 <div class="uxPanel"><h3>Задания дня</h3>${UX_OBJ.map(o=>{const p=Math.min(o[3],ut.obj.c[o[2]]||0),done=p>=o[3],cl=ut.obj.claimed[o[0]];return `<div class="uxObj"><div><b>${o[1]}</b><div class="uxProg"><u style="width:${p/o[3]*100}%"></u></div><small>${p}/${o[3]} · 🪙 ${o[4]}</small></div><button class="uxb sm ${done&&!cl?'pri':'dis'}" data-a="uxClaim" data-id="${o[0]}">${cl?'✓':'Забрать'}</button></div>`;}).join('')}</div>`;}
function uxDaily(){const t=uxDayKey();if(ut.daily.date===t)return;const y=new Date(Date.now()-864e5).toISOString().slice(0,10);ut.daily.streak=ut.daily.date===y?(ut.daily.streak||0)+1:1;ut.daily.date=t;const r=250+Math.min(ut.daily.streak,7)*50;ut.coins+=r;uxToast(`+${r} 🪙`);if(ut.daily.streak%7===0){const c=uxCard(uxPick(UX_BYR.silver));ut.collection.push(c);ut.bench.push(c.uid);}saveUT();renderUT();}
function uxClaim(id){uxObjInit();const o=UX_OBJ.find(x=>x[0]===id);if(!o||(ut.obj.c[o[2]]||0)<o[3]||ut.obj.claimed[id])return;ut.obj.claimed[id]=1;ut.coins+=o[4];ut.xp+=40;utRefreshLevel();saveUT();renderUT();}
/* ---------- Матчи ---------- */
function uxStartMatch(mode){const base=teamById(settings.myTeam)||TEAMS[0],opps=TEAMS.filter(t=>t.id!==base.id&&!t.nation),opp=uxPick(opps.length?opps:TEAMS.filter(t=>t.id!==base.id));
 const club=Object.assign({},base,{id:'ut_local_'+Date.now(),name:ut.name.slice(0,20),code:'КЛБ',c1:parseInt(ut.color.slice(1),16),tag:'Ultimate Team'});
 startMatch({tA:club,tB:opp,size:11,form:ut.formation,formB:uxPick(['4-4-2','4-3-3','3-5-2']),versus:false,ko:false,comp:false,utManaged:true,utMode:mode,style:'bal',noTactics:false});}
function uxApplyLineup(cowsNow){const roles={gk:[],df:[],mf:[],fw:[]},map={'ВРТ':'gk','ЗЩ':'df','ПЗ':'mf','НАП':'fw'};
 uxSl().forEach((s,i)=>{const c=utById(ut.lineup[i]);if(c)roles[map[UX_PP[s[0]][1]]].push(c);});
 const used={gk:0,df:0,mf:0,fw:0};cowsNow.filter(c=>c.team===0).forEach(c=>{const r=c.role,a=roles[r]||[],card=a[used[r]++]||a[a.length-1];if(!card)return;c.utCard=card;c.pname=card.name;c.num=card.num||used[r];});
 const bonus=utChemistry()/100*.035;cowsNow.filter(c=>c.team===0&&c.utCard).forEach(c=>{c.utCard.chemBonus=bonus;});}
function uxMatchFinished(sc,st,cfg){if(!cfg||!cfg.utManaged)return;const win=sc[0]>sc[1],draw=sc[0]===sc[1],S=ut.stats,mode=cfg.utMode||'friendly';
 let reward=(win?450:draw?250:150)+sc[0]*30+(mode==='cup'?120:mode==='division'?60:0);S.played++;if(win)S.wins++;else if(draw)S.draws++;else S.losses++;S.goals+=sc[0];S.conceded+=sc[1];ut.coins+=reward;S.earned=(S.earned||0)+reward;ut.xp+=60+sc[0]*12+(win?45:0);
 uxObjInit();uxObjAdd('played',1);if(win)uxObjAdd('wins',1);uxObjAdd('goals',sc[0]);utRefreshLevel();
 if(mode==='division'){S.divPlayed++;if(win)S.divWins++;else if(!draw)S.divLosses++;if(S.divPlayed>=3){if(S.divWins>=2){ut.division=Math.max(1,ut.division-1);ut.coins+=400;}else if(S.divLosses>=2)ut.division=Math.min(10,ut.division+1);S.divPlayed=S.divWins=S.divLosses=0;}}
 if(mode==='cup'){if(win){S.cupRun++;if(S.cupRun>=3){S.cupWins++;ut.coins+=2000;S.cupRun=0;}}else if(!draw)S.cupRun=0;}
 saveUT();}
/* ---------- Карьера игрока ---------- */
const UX_TIERS=[['Молодёжка',58,60],['Лига Лугов',64,140],['Высшая лига',70,300],['Элита',76,650],['Топ-клуб',82,1400]];
const UX_CL=[[0,'Звёздочки'],[0,'Телята Юг'],[1,'Бычки Запад'],[1,'Рыжие Рога'],[2,'Золотые Луга'],[2,'Северный Ветер'],[3,'Клеверная Армия'],[3,'Молочные Гиганты'],[4,'Ясные Холмы'],[4,'Королевские Быки']];
const UX_ROLES=['Запасной','Ротация','Основа','Ключевой','Звезда'];
const uxOvr=a=>0,uxPcOvr=(pp,at)=>Math.round(uxWOf(pp).reduce((s,w,i)=>s+w*at[i],0));
function uxPcCard(){const p=ut.pc;if(!p)return;let c=ut.collection.find(x=>x.career);const base={name:p.name,pp:p.pp,pos:uxCoarse(p.pp),rating:p.ovr,nation:p.nation,club:p.club.n,rarity:uxRar(p.ovr),coat:p.coat||40,face:'🐮',career:true,num:p.num||10,gk:p.pp==='GK'?p.ovr:0};
 if(!c){c=Object.assign({uid:uxUid(),tid:-1},base);ut.collection.push(c);ut.bench.push(c.uid);}Object.assign(c,base);UX_AK.forEach((k,i)=>c[k]=p.at[i]);}
function uxPcCreate(){const name=($('pcName')||{}).value||'',pp=($('pcPos')||{}).value,nat=($('pcNat')||{}).value;if(!name.trim()||!UX_PP[pp]){uxToast('Введи имя игрока');return;}
 const at=uxAttrs(pp,uxI(54,60),Math.random);ut.pc={name:name.trim().slice(0,20),pp,nation:nat,age:17,pot:uxI(80,93),at,prog:[0,0,0,0,0,0],ovr:0,club:{n:UX_CL[0][1],t:0},role:0,wage:60,contract:2,season:1,md:0,energy:100,form:50,inj:0,slots:2,xp:0,coat:uxI(0,359),num:uxI(7,30),
  ss:{a:0,g:0,as:0,r:[],m:0},tot:{a:0,g:0,as:0,m:0,w:0},hist:[],log:[],awards:0,peak:0,offers:null,done:false,recent:[]};
 ut.pc.ovr=uxPcOvr(pp,at);ut.pc.peak=ut.pc.ovr;uxPcCard();saveUT();renderUT();}
const uxPcBase=()=>UX_TIERS[ut.pc.club.t][1];
function uxPcRoleFor(ovr,t){const d=ovr-UX_TIERS[t][1];return d>=8?4:d>=4?3:d>=0?2:d>=-4?1:0;}
function uxCareer(){const p=ut.pc;
 if(!p)return `<div class="uxPanel"><h3>Карьера игрока</h3><p class="help">Создай игрока и пройди путь от молодёжки до топ-клуба: тренируйся, играй матчи, получай контракты. Зарплата и бонусы идут в твой кошелёк 🪙, а карточка игрока появляется в Ultimate Team.</p>
 <label class="uxF">Имя<input class="uxIn" id="pcName" maxlength="20" placeholder="Например, Рогер Быков"></label><label class="uxF">Позиция<select class="uxIn" id="pcPos">${Object.keys(UX_PP).map(k=>`<option value="${k}" ${k==='ST'?'selected':''}>${UX_PP[k][0]} (${k})</option>`).join('')}</select></label><label class="uxF">Страна<select class="uxIn" id="pcNat">${UX_NAT.map(n=>`<option>${n[0]}</option>`).join('')}</select></label><button class="uxb pri" data-a="pcCreate">Начать карьеру</button>${ut.legends.length?`<h3>Легенды</h3>${ut.legends.map(l=>`<div class="uxLg">🏆 ${uxE(l.name)} · пик ${l.peak} · ${l.g} голов · ${l.a} матчей</div>`).join('')}`:''}</div>`;
 const L=p.pp==='GK'?UX_GL:UX_AL,c=ut.collection.find(x=>x.career),tier=UX_TIERS[p.club.t],ss=p.ss,avg=ss.r.length?(ss.r.reduce((a,b)=>a+b,0)/ss.r.length).toFixed(1):'—';
 return `<div class="uxCareer"><div class="uxPanel pcL">${c?uxCardHtml(c,{big:1,w:140}):''}<div class="uxBar"><span>Энергия</span><i><u style="width:${p.energy}%"></u></i><b>${p.energy}</b></div><div class="uxBar"><span>Форма</span><i><u class="g" style="width:${p.form}%"></u></i><b>${Math.round(p.form)}</b></div>${p.inj?`<p class="help sm">🤕 Травма: ещё ${p.inj} матч.</p>`:''}</div>
 <div class="uxPanel pcR"><h3>${uxE(p.name)} · ${p.age} лет</h3><p class="help sm">${p.club.n} (${tier[0]}) · ${UX_ROLES[p.role]} · зарплата 🪙${p.wage}/матч · контракт ${p.contract} сез.<br>Сезон ${p.season} · матчдень ${p.md}/14 · потенциал ${'★'.repeat(Math.round((p.pot-70)/5)+1)}</p>
 <div class="uxStats"><span><b>${ss.a}</b>матчи</span><span><b>${ss.g}</b>голы</span><span><b>${ss.as}</b>пасы</span><span><b>${avg}</b>рейтинг</span></div>
 <div class="uxRow wrap"><button class="uxb pri" data-a="pcPlay">⚽ Сыграть матчдень</button><button class="uxb sm" data-a="pcRest" ${p.slots<1?'disabled':''}>😴 Отдых (${p.slots})</button></div>
 <h3>Тренировка (слотов: ${p.slots})</h3>${UX_AK.map((k,i)=>`<div class="uxTr"><span>${L[i]}</span><div class="uxProg"><u style="width:${Math.min(100,p.prog[i]/pcNeed(p.at[i])*100)}%"></u></div><b>${p.at[i]}</b><button class="uxb sm" data-a="pcTrain" data-i="${i}" ${p.slots<1||p.energy<20?'disabled':''}>+</button><button class="uxb sm" data-a="pcTrain" data-i="${i}" data-pro="1" ${p.slots<1||p.energy<20||ut.coins<250?'disabled':''} title="Личный тренер">🪙250</button></div>`).join('')}
 <p class="help sm">«+» — обычная тренировка (−20 энергии). «🪙250» — личный тренер, прогресс ×1.5.</p><div class="uxRow wrap"><button class="uxb sm" data-a="pcLog">Журнал матчей</button><button class="uxb sm" data-a="pcHist">История</button><button class="uxb sm danger" data-a="pcRetire">Завершить карьеру</button></div></div></div>`;}
const pcNeed=a=>Math.round(30+(a-50)*1.2);
function pcTrain(i,pro){const p=ut.pc;if(!p||p.slots<1||p.energy<20)return;if(pro){if(ut.coins<250)return uxToast('Не хватает монет');ut.coins-=250;}
 const af=p.age<=21?1.25:p.age<=25?1:p.age<=29?.75:p.age<=33?.45:.25,gap=Math.max(.3,Math.min(1.3,(p.pot-p.ovr+6)/10));p.prog[i]+=uxR(8,14)*af*gap*(pro?1.5:1);p.energy=Math.max(0,p.energy-20);p.slots--;
 let up=0;while(p.prog[i]>=pcNeed(p.at[i])&&p.at[i]<99){p.prog[i]-=pcNeed(p.at[i]);p.at[i]++;up++;}if(up){p.ovr=uxPcOvr(p.pp,p.at);p.peak=Math.max(p.peak,p.ovr);uxToast(`${(p.pp==='GK'?UX_GL:UX_AL)[i]} +${up}`);}uxPcCard();saveUT();renderUT();}
function pcRest(){const p=ut.pc;if(!p||p.slots<1)return;p.slots--;p.energy=Math.min(100,p.energy+45);saveUT();renderUT();}
const UX_GS={ST:.38,LW:.22,RW:.22,CAM:.2,LM:.15,RM:.15,CM:.1,CDM:.05,LB:.04,RB:.04,CB:.03,GK:0},UX_AS={CAM:.3,LW:.25,RW:.25,LM:.22,RM:.22,CM:.18,ST:.15,LB:.12,RB:.12,CDM:.08,CB:.03,GK:.01};
function uxPois(l){let L=Math.exp(-Math.max(.05,l)),k=0,p=1;do{k++;p*=Math.random();}while(p>L&&k<9);return k-1;}
function pcPlay(){const p=ut.pc;if(!p)return;if(p.offers||p.md>=14){pcSeasonEnd();return;}
 const t=p.club.t,own=UX_TIERS[t][1]+uxR(-3,3),ot=clamp(t+uxI(-1,1),0,4),opp=UX_TIERS[ot][1]+uxR(-3,3),home=Math.random()<.5,oppN=UX_CL.filter(x=>x[0]===ot&&x[1]!==p.club.n);const on=(oppN.length?uxPick(oppN):uxPick(UX_CL))[1];
 let min=0;if(!p.inj){const rm=[[0,.35,10,30],[1,.8,45,85],[2,1,80,90],[3,1,90,90],[4,1,90,90]][p.role];if(Math.random()<rm[1])min=Math.round(uxR(rm[2],rm[3]));if(p.energy<30)min=Math.round(min*.7);}
 const skill=uxPcOvr(p.pp,p.at),diff=own+(skill-UX_TIERS[t][1])*.15-opp,gf=uxPois(1.35+diff/20+(home?.15:0)),ga=uxPois(1.15-diff/22);
 let g=0,as=0;for(let i=0;i<gf;i++){const pr=(UX_GS[p.pp]||0)*(min/90)*(1+(skill-65)/80);if(Math.random()<pr)g++;else if(Math.random()<(UX_AS[p.pp]||0)*(min/90)*(1+(skill-65)/90))as++;}
 const win=gf>ga,loss=gf<ga,cs=ga===0&&['GK','CB','LB','RB','CDM'].includes(p.pp)&&min>=60;
 let r=6.1+(skill-UX_TIERS[t][1])/16+(p.form-50)/60+(p.energy<40?-.4:0)+uxR(-.8,.8)+(win?.35:loss?-.25:0)+g*.9+as*.5+(cs?.6:0);r=min<=0?0:min<30?6+(r-6)*.4:r;r=Math.round(clamp(r,4.5,10)*10)/10;
 let wage=p.wage,bonus=g*80+(win?50:0)+(r>=8.5?150:0)+(cs?60:0);if(min===0&&p.inj)bonus=0;ut.coins+=wage+bonus;p.tot.w+=wage+bonus;
 p.md++;if(min>0){p.ss.a++;p.tot.a++;p.ss.g+=g;p.tot.g+=g;p.ss.as+=as;p.tot.as+=as;p.ss.r.push(r);p.recent.push(r);p.recent=p.recent.slice(-4);p.form=clamp(p.form+(r-6.5)*8,10,95);if(r>=8.5){p.ss.m++;p.tot.m++;}p.energy=Math.max(0,p.energy-Math.round(min/90*28));}else{p.energy=Math.min(100,p.energy+20);p.form+=(50-p.form)*.1;}
 if(p.inj>0)p.inj--;else if(min>0&&Math.random()<(p.energy<40?.06:.015)){p.inj=uxI(1,3);}
 p.slots=2;let msg='';const avg3=p.recent.length>=3?p.recent.slice(-3).reduce((a,b)=>a+b,0)/3:6.5;
 if(p.recent.length>=3&&avg3>=7.4&&p.role<uxPcRoleFor(skill,t)+1&&p.role<4){p.role++;p.recent=[];msg=`Тренер повысил твою роль: ${UX_ROLES[p.role]}!`;}else if(p.recent.length>=4&&avg3<=5.8&&p.role>0){p.role--;p.recent=[];msg=`Роль понижена: ${UX_ROLES[p.role]}.`;}
 const rep={on,home,gf,ga,min,g,as,r,wage,bonus,msg,inj:p.inj};p.log.unshift(rep);p.log=p.log.slice(0,12);ut.xp+=15+g*10;utRefreshLevel();uxPcCard();
 const done=p.md>=14;saveUT();
 uxModal(`<h3>${home?p.club.n+' vs '+on:on+' vs '+p.club.n}</h3><div class="uxScore">${gf} : ${ga}</div><p class="help">${min?`Минут: ${min} · Оценка: <b>${r}</b> · Голы ${g} · Пасы ${as}`:(p.inj?'Ты пропускаешь матч из-за травмы.':'Ты остался на скамейке.')}</p><p class="help sm">Зарплата +${wage}${bonus?`, бонусы +${bonus}`:''} 🪙 ${msg?'<br>'+msg:''}${rep.inj?'<br>🤕 Травма: '+rep.inj+' матч.':''}</p><button class="uxb pri" data-a="${done?'pcSeasonEnd':'uxClose'}">${done?'Итоги сезона':'Продолжить'}</button>`);
 renderUTkeepModal();}
function renderUTkeepModal(){const m=$('uxModal'),h=m&&m.innerHTML,on=uxModalOn;renderUT();if(on&&h){const m2=$('uxModal');m2.classList.add('on');m2.innerHTML=h;}}
function pcSeasonEnd(again){const p=ut.pc;if(!p)return;uxClose();
 if(!p.offers){const ss=p.ss,avg=ss.r.length?ss.r.reduce((a,b)=>a+b,0)/ss.r.length:0;let aw=[];if(ss.g>=12&&['ST','LW','RW','CAM'].includes(p.pp))aw.push('Бутса сезона');if(avg>=7.6&&ss.a>=10)aw.push('Игрок сезона');if(ss.a>=12&&ss.m>=3)aw.push('MVP матчей');p.awards+=aw.length;ut.coins+=aw.length*500;
  p.hist.push({s:p.season,age:p.age,club:p.club.n,a:ss.a,g:ss.g,as:ss.as,avg:avg?avg.toFixed(1):'—',ovr:p.ovr,aw:aw.join(', ')});
  p.age++;const gr=p.age<=23?uxI(2,5):p.age<=28?uxI(0,2):p.age<=32?-uxI(0,2):-uxI(1,3);const w=uxWOf(p.pp);for(let n=0;n<Math.abs(gr)*2;n++){let i=uxI(0,5);if(gr<0&&p.age>29&&Math.random()<.6)i=Math.random()<.5?0:5;p.at[i]=clamp(p.at[i]+Math.sign(gr),25,99);}
  p.ovr=uxPcOvr(p.pp,p.at);if(p.age<=27)while(p.ovr>p.pot+2){p.at[uxI(0,5)]--;p.ovr=uxPcOvr(p.pp,p.at);}p.peak=Math.max(p.peak,p.ovr);p.contract--;p.season++;p.md=0;p.ss={a:0,g:0,as:0,r:[],m:0};p.energy=100;p.form=50;p.inj=0;p.slots=2;p.recent=[];
  const offers=[],mk=(t,len)=>{const club=uxPick(UX_CL.filter(x=>x[0]===t)),role=uxPcRoleFor(p.ovr,t),wage=Math.round(UX_TIERS[t][2]*(.7+role*.25)/10)*10;return {club:{n:club[1],t},role,wage,len,bonus:wage*6};};
  if(p.contract>0)offers.push({stay:true,club:p.club,role:p.role,wage:p.wage,len:p.contract,bonus:0});else offers.push(Object.assign(mk(p.club.t,uxI(1,3)),{renew:true,club:p.club}));
  const tm=clamp(Math.round((p.ovr-58)/6),0,4);[tm-1,tm,tm+1].forEach(t=>{if(t>=0&&t<=4&&t!==p.club.t&&offers.length<4)offers.push(mk(t,uxI(1,4)));});p.offers=offers;uxPcCard();
  if(p.age>=36){p.offers=null;pcRetire(true);return;}saveUT();}
 const fine=p.wage*6;
 uxModal(`<h3>Конец сезона ${p.season-1}</h3><p class="help sm">${p.hist[p.hist.length-1].aw?'🏆 '+p.hist[p.hist.length-1].aw+' (+500 🪙 за награду)':'Наград нет'}<br>Возраст ${p.age} · ОБЩ ${p.ovr}. Выбери клуб на следующий сезон:</p>${p.offers.map((o,i)=>{const leave=!o.stay&&!o.renew&&p.contract>0,cost=leave?fine:0;return `<div class="uxOffer"><div><b>${uxE(o.club.n)}</b><small>${UX_TIERS[o.club.t][0]} · ${UX_ROLES[o.role]} · 🪙${o.wage}/матч · ${o.len} сез.${o.bonus?' · бонус 🪙'+o.bonus:''}${cost?' · штраф 🪙'+cost:''}${o.stay?' · остаться':''}</small></div><button class="uxb sm ${ut.coins<cost?'dis':'pri'}" data-a="pcOffer" data-i="${i}">Выбрать</button></div>`;}).join('')}`);}
function pcOffer(i){const p=ut.pc,o=p&&p.offers&&p.offers[i];if(!o)return;const leave=!o.stay&&!o.renew&&p.contract>0,fine=leave?p.wage*6:0;if(ut.coins<fine)return uxToast('Не хватает монет на штраф');ut.coins+=o.bonus-fine;p.club=o.club;p.role=o.role;p.wage=o.wage;p.contract=o.len;p.offers=null;uxPcCard();saveUT();uxClose();renderUT();uxToast('Контракт подписан');}
function pcRetire(auto){const p=ut.pc;if(!p)return;if(!auto&&!confirm('Завершить карьеру? Игрок станет легендой, а карточка-легенда попадёт в твой клуб.'))return;
 const pts=p.tot.g*3+p.tot.as*2+Math.round(p.tot.a*.2)+p.awards*50+p.peak;const reward=Math.min(20000,pts*10);ut.coins+=reward;ut.legends.push({name:p.name,peak:p.peak,g:p.tot.g,a:p.tot.a,pts});
 ut.collection=ut.collection.filter(c=>!c.career);ut.bench=ut.bench.filter(id=>utById(id));ut.lineup=ut.lineup.map(id=>utById(id)?id:null);
 const lp=Math.max(p.peak,82),c=uxCard({id:-2,name:p.name,pp:p.pp,rating:lp,nation:p.nation,club:'Легенды',at:p.at.map(a=>clamp(a+Math.max(0,lp-p.ovr),25,99)),coat:p.coat,face:'🐮',num:p.num});c.rarity='special';c.legend=true;ut.collection.push(c);ut.bench.push(c.uid);
 ut.pc=null;if(ut.lineup.some(x=>!x))uxFill([]);saveUT();uxClose();uxModal(`<h3>Карьера завершена</h3><p class="help">${uxE(p.name)} · пик ${p.peak}<br>Голов: ${p.tot.g}, передач: ${p.tot.as}, матчей: ${p.tot.a}, наград: ${p.awards}<br>Награда: <b>🪙 ${uxN(reward)}</b> и карточка-Легенда в клубе.</p><button class="uxb pri" data-a="uxClose">Отлично</button>`);renderUTkeepModal();}
/* ---------- события ---------- */
Object.assign(ACT,{
 ut(){utTab='home';uxModalOn=false;uxAnim=true;renderUT();show('ut');},
 uxTab(d){utTab=d.v;uxAnim=true;uxClose();renderUT();},
 uxClose(){uxClose();},
 uxSlot(d){uxPick_(+d.i);},
 uxSet(d){const i=+d.i,id=d.id,j=ut.lineup.indexOf(id);if(j>=0){ut.lineup[j]=ut.lineup[i];ut.lineup[i]=id;}else{const old=ut.lineup[i];ut.lineup[i]=id;ut.bench=ut.bench.filter(x=>x!==id);ut.bench.unshift(old);}uxRebench();saveUT();uxClose();renderUT();},
 uxForm(d){if(!UX_FORM[d.v])return;ut.formation=d.v;uxFill(ut.lineup);saveUT();renderUT();},
 uxAuto(){uxFill([]);saveUT();renderUT();},
 uxCard(d){uxCardModal(d.id);},
 uxPack(d){uxOpenPack(d.v);},
 uxRevNext(){const q=uxPackQ;if(!q)return;if(!q.fl){q.fl=true;const f=$('uxFlip');if(f)f.classList.add('fl');const c=q.cards[q.i],inf=$('uxRevInfo');if(inf)inf.innerHTML=`<b>${uxE(c.name)}</b> · ${UX_RAR[c.rarity]} · ≈ 🪙 ${uxN(uxValue(c))}`;const bt=$('uxRevBtn');if(bt)bt.textContent=q.i+1<q.cards.length?'Дальше':'В клуб';return;}if(q.i+1<q.cards.length)uxReveal(q.cards,q.i+1);else{uxClose();utTab='club';uxAnim=true;renderUT();}},
 uxSellExtras(){const st=new Set(ut.lineup),bn=new Set(ut.bench.slice(0,7)),l=ut.collection.filter(c=>c.rarity==='bronze'&&!st.has(c.uid)&&!bn.has(c.uid)&&!c.career);if(!l.length)return uxToast('Нет лишней бронзы');const sum=l.reduce((a,c)=>a+uxQuick(c),0);if(!confirm(`Продать ${l.length} карточек за ${sum} монет?`))return;const rm=new Set(l.map(c=>c.uid));ut.collection=ut.collection.filter(c=>!rm.has(c.uid));ut.bench=ut.bench.filter(x=>!rm.has(x));ut.coins+=sum;ut.stats.sold+=l.length;saveUT();renderUT();},
 uxRename(){const v=$('uxName');if(v){ut.name=(v.value.trim()||'Молочный клуб').slice(0,20);saveUT();renderUT();}},
 uxBadge(){const B=['🐮','🥛','🌾','⚡','🏆','🐂','🌙','🔥'];ut.badge=B[(B.indexOf(ut.badge)+1)%B.length];saveUT();renderUT();},
 uxColor(d){if(/^#[0-9a-f]{6}$/i.test(d.v||'')){ut.color=d.v;saveUT();renderUT();}},
 uxSellDlg(d){uxSellDlg(d.id);},uxList(d){uxList(d.id);},uxQuick(d){uxQuickSell(d.id);},
 uxTmTab(d){uxTmTab=d.v;renderUT();},uxPage(d){uxTmF.page+=+d.v;const e=$('uxTmList');if(e)e.innerHTML=uxTmListHtml();},
 uxBid(d){uxBid(d.id);},uxBuy(d){uxBuy(d.id);},
 uxLotInfo(d){const l=ut.tm.list.find(x=>x.id===d.id);if(!l)return;uxModal(`<div class="uxDet">${uxCardHtml(l.card,{big:1,w:150})}<div><h3>${uxE(l.card.name)}</h3><p class="help sm">${UX_RAR[l.card.rarity]} · ${l.card.nation} · ${l.card.club}<br>Рыночная цена ≈ <b>🪙 ${uxN(l.value)}</b></p><button class="uxb sm" data-a="uxClose">Закрыть</button></div></div>`);},
 uxCancel(d){const l=ut.tm.mine.find(x=>x.id===d.id);if(!l||l.status!=='active')return;l.status='expired';ut.collection.push(l.card);ut.bench.push(l.card.uid);saveUT();renderUT();},
 uxClearL(d){ut.tm.mine=ut.tm.mine.filter(x=>x.id!==d.id);saveUT();renderUT();},
 uxDaily(){uxDaily();},uxClaim(d){uxClaim(d.id);},
 utPlay(d){if(ut.lineup.length!==11||ut.lineup.some(id=>!utById(id)))uxFill([]);utStartMatch(d.v);},
 utReturn(){setScreen(null);utTab='home';renderUT();show('ut');},
 utReplay(){const m=endCtx&&endCtx.cfg?endCtx.cfg.utMode:'friendly';setScreen(null);utStartMatch(m);},
 utReset(){if(!confirm('Удалить весь прогресс Ultimate Team — клуб, карточки, монеты, карьеру? Это необратимо.'))return;ut=uxCreate(ut);settings.utData=ut;save();renderUT();},
 utCloseReveal(){uxClose();},
 pcCreate(){uxPcCreate();},pcTrain(d){pcTrain(+d.i,!!d.pro);},pcRest(){pcRest();},pcPlay(){pcPlay();},pcSeasonEnd(){pcSeasonEnd();},pcOffer(d){pcOffer(+d.i);},pcRetire(){pcRetire();},
 pcLog(){const p=ut.pc;uxModal(`<h3>Последние матчи</h3>${p.log.map(l=>`<div class="uxLg">${l.gf}:${l.ga} vs ${uxE(l.on)} · ${l.min?l.min+"' · оценка "+l.r+(l.g?' · ⚽'+l.g:'')+(l.as?' · 🅰'+l.as:''):'не играл'}</div>`).join('')||'<p class="help">Матчей ещё не было.</p>'}<button class="uxb" data-a="uxClose">Закрыть</button>`);},
 pcHist(){const p=ut.pc;uxModal(`<h3>История</h3>${p.hist.map(h=>`<div class="uxLg">Сезон ${h.s} · ${uxE(h.club)} · ${h.a} м · ${h.g} г · ${h.as} п · ${h.avg} · ОБЩ ${h.ovr}${h.aw?' · 🏆 '+uxE(h.aw):''}</div>`).join('')||'<p class="help">История появится после первого сезона.</p>'}<button class="uxb" data-a="uxClose">Закрыть</button>`);}
});
document.addEventListener('input',e=>{const f=e.target&&e.target.dataset&&e.target.dataset.f;if(!f||screen!=='ut')return;const [k,n]=f.split('.');if(k==='t'){uxTmF[n]=e.target.value;uxTmF.page=1;const l=$('uxTmList');if(l)l.innerHTML=uxTmListHtml();}else{uxClubF[n]=e.target.value;let l=ut.collection.filter(c=>(!uxClubF.q||c.name.toLowerCase().includes(uxClubF.q.toLowerCase()))&&(!uxClubF.pp||c.pp===uxClubF.pp)&&(!uxClubF.rar||c.rarity===uxClubF.rar));l.sort((a,b)=>uxClubF.sort==='price'?uxValue(b)-uxValue(a):uxClubF.sort==='pos'?a.pp.localeCompare(b.pp):b.rating-a.rating);const el=$('uxClubList');if(el)el.innerHTML=uxClubList(l);}});
document.addEventListener('change',e=>{if(e.target&&e.target.dataset&&e.target.dataset.f&&screen==='ut')e.target.dispatchEvent(new Event('input',{bubbles:true}));});
setInterval(()=>{if(screen!=='ut'||document.hidden)return;document.querySelectorAll('[data-uxend]').forEach(el=>{el.textContent=uxLeft(+el.dataset.uxend);});
 if(utTab==='trade'&&!uxModalOn&&uxMarketTick(false)){const sc=$('uxBody');if(sc&&!(document.activeElement&&document.activeElement.tagName==='INPUT'))renderUT();}},2000);
utTab='home';ut=uxLoad();settings.utData=ut;renderUT=uxRender;utStartMatch=uxStartMatch;applyUTLineupToMatch=uxApplyLineup;utMatchFinished=uxMatchFinished;utChemistry=uxChemPct;utFormationRoles=uxRoles;utAutoLineup=uxAutoL;
if(!ut.lineup||ut.lineup.length!==11||ut.lineup.some(id=>!utById(id)))uxFill([]);else uxRebench();
if(ut.pc)uxPcCard();
settings.utData=ut;


/* ===================== v40: match stability & progression hardening =====================
   Patches the existing engine in place; no screens or match systems are replaced. */

// Collision correction can move players/ball across a boundary after the movement-step check.
// Recheck the ball segment after collisions and keep every player inside the runoff zone.
const _collideV40 = collide;
collide = function () {
  const beforeX = ball.x, beforeY = ball.y;
  _collideV40.apply(this, arguments);
  if (![ball.x, ball.y, ball.vx, ball.vy, ball.h, ball.vh].every(Number.isFinite)) {
    ball.x = W / 2; ball.y = H / 2; ball.vx = 0; ball.vy = 0; ball.h = 0; ball.vh = 0;
    ball.carrier = null; ball.holder = null; ball.curve = 0; ballStuck = 0;
  } else {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 19) { ball.vx *= 19 / speed; ball.vy *= 19 / speed; }
    ball.h = clamp(ball.h, 0, 12);
    if (ball.carrier && !cows.includes(ball.carrier)) ball.carrier = null;
    if (ball.holder && !cows.includes(ball.holder)) ball.holder = null;
  }
  const rx = Math.max(CR * 3, 70 * fieldVisualScale), ry = Math.max(CR * 3, 55 * fieldVisualScale);
  for (const c of cows) {
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || !Number.isFinite(c.vx) || !Number.isFinite(c.vy)) {
      c.x = clamp(W / 2, FX, FX + FW); c.y = clamp(H / 2, FY, FY + FH); c.vx = c.vy = 0;
    }
    c.x = clamp(c.x, FX - rx, FX + FW + rx);
    c.y = clamp(c.y, FY - ry, FY + FH + ry);
  }
  if (state === 'play' && !ruleModalState) cowballCheckOutV24(beforeX, beforeY);
};

// Keep post-processing in Ultra when possible; if FPS stays low, reduce only the shader sample tier
// for the current render call. The player's selected shader preset/quality is never overwritten.
if (renderer && renderer.__cowballPostFXV36) {
  const _renderV40 = renderer.render.bind(renderer);
  renderer.render = function (renderScene, renderCamera) {
    const originalQuality = settings.shaderQuality;
    if (renderScene === scene && renderCamera === camera && settings.shaderFXV36 &&
        originalQuality === 'auto' && Number.isFinite(fpsAvg) && fpsAvg < 29) {
      settings.shaderQuality = fpsAvg < 23 ? 'balanced' : 'high';
    }
    try { return _renderV40.apply(this, arguments); }
    finally { settings.shaderQuality = originalQuality; }
  };
}

// Repair stale or partially written tournament data before the home screen reads it.
function repairCompetitionSaveV40() {
  const c = settings.comp;
  if (!c) return;
  const ids = new Set((TEAMS || []).map(t => String(t.id)));
  if (!c || typeof c !== 'object' || !COMPS[c.type] || !ids.has(String(c.my)) ||
      !Array.isArray(c.rounds) || c.rounds.length < 1) {
    settings.comp = null; save(); return;
  }
  c.ids = Array.isArray(c.ids) ? c.ids.map(String).filter(id => ids.has(id)) : [];
  if (!c.ids.includes(String(c.my))) c.ids.unshift(String(c.my));
  c.rounds = c.rounds.filter(r => r && typeof r === 'object' && Array.isArray(r.matches));
  c.rounds.forEach(r => {
    r.name = String(r.name || 'Турнир'); r.ko = !!r.ko;
    r.matches = r.matches.filter(m => m && ids.has(String(m.a)) && ids.has(String(m.b)) && String(m.a) !== String(m.b));
    r.matches.forEach(m => {
      m.a = String(m.a); m.b = String(m.b);
      m.ga = clamp(Math.floor(Number(m.ga) || 0), 0, 99); m.gb = clamp(Math.floor(Number(m.gb) || 0), 0, 99);
      m.pa = clamp(Math.floor(Number(m.pa) || 0), 0, 99); m.pb = clamp(Math.floor(Number(m.pb) || 0), 0, 99);
      m.done = !!m.done; m.grp = typeof m.grp === 'string' ? m.grp : '';
    });
  });
  if (!c.rounds.length || !c.rounds.some(r => r.matches.length)) { settings.comp = null; save(); return; }
  c.cur = clamp(Math.floor(Number(c.cur) || 0), 0, c.rounds.length - 1);
  c.done = !!c.done; c.out = !!c.out;
  if (c.champion != null && !ids.has(String(c.champion))) c.champion = null;
  if (!Array.isArray(settings.trophies)) settings.trophies = [];
  if (!Array.isArray(settings.trophyCabinet)) settings.trophyCabinet = [];
  settings.trophies = Array.from(new Set(settings.trophies.filter(x => typeof x === 'string')));
}
repairCompetitionSaveV40();

// A pending debounced save is flushed when the tab/app is hidden or closed, reducing lost progress.
function flushCowballSaveV40() {
  try {
    clearTimeout(saveT);
    const payload = JSON.stringify(settings);
    if (!payload || payload.length > 3 * 1024 * 1024) return;
    const previous = localStorage.getItem('cowball');
    if (previous && previous !== payload && previous.length <= 3 * 1024 * 1024) {
      try { JSON.parse(previous); localStorage.setItem('cowball_backup_v31', previous); } catch (_) {}
    }
    localStorage.setItem('cowball', payload);
  } catch (_) { /* Private browsing/quota restrictions must not stop the match. */ }
}
window.addEventListener('pagehide', flushCowballSaveV40);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushCowballSaveV40(); });

// Ensure tournament trophy IDs stay unique even when the same completed screen is reopened.
const _finishCompV40 = finishComp;
finishComp = function () {
  const result = _finishCompV40.apply(this, arguments);
  if (!Array.isArray(settings.trophies)) settings.trophies = [];
  settings.trophies = Array.from(new Set(settings.trophies.filter(x => typeof x === 'string')));
  if (comp) settings.comp = comp;
  save();
  return result;
};
/* ===================== v41: Online Club, Ranked, Friends, Cup & Hardening ===================== */
// Client-only profiles are intentionally local; global matchmaking/rankings require a trusted backend.
const NET3V41 = { view: 'lobby', peerProfile: null, processed: [], pendingLost: false };
function netNickV41() { return (String(settings.netNick || '').trim() || 'Игрок').slice(0, 14); }
function netRandIdV41() { try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {} return 'cb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12); }
function netProfileV41() {
  let p = settings.netProfileV41;
  if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
  const num = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
  p.id = typeof p.id === 'string' && p.id.length < 90 ? p.id : netRandIdV41();
  p.rating = clamp(Math.round(num(p.rating, 1000)), 0, 4000);
  ['games','wins','losses','draws','goalsFor','goalsAgainst','xp','rankedGames','rankedWins','rankedLosses','seasonGames','seasonWins','seasonGoals'].forEach(k => p[k] = Math.max(0, Math.floor(num(p[k], 0))));
  p.history = Array.isArray(p.history) ? p.history.filter(x => x && typeof x === 'object').slice(0, 30) : [];
  p.processed = Array.isArray(p.processed) ? p.processed.filter(x => typeof x === 'string').slice(-40) : [];
  p.cosmetics = Array.isArray(p.cosmetics) ? p.cosmetics.filter(x => typeof x === 'string').slice(0, 30) : [];
  p.seasonStart = num(p.seasonStart, Date.now());
  p.seasonNo = Math.max(1, Math.floor(num(p.seasonNo, 1)));
  p.seasonXp = Math.max(0, Math.floor(num(p.seasonXp, 0)));
  p.seasonClaimed = Array.isArray(p.seasonClaimed) ? p.seasonClaimed.filter(x => [100,250,500].includes(Number(x))) : [];
  p.seasonTaskClaimed = Array.isArray(p.seasonTaskClaimed) ? p.seasonTaskClaimed.filter(x => ['games','wins','goals'].includes(String(x))) : [];
  const days = 28 * 24 * 60 * 60 * 1000, computed = Math.floor(Math.max(0, Date.now() - p.seasonStart) / days) + 1;
  if (computed > p.seasonNo) { p.seasonNo = computed; p.seasonXp = 0; p.seasonGames = 0; p.seasonWins = 0; p.seasonGoals = 0; p.seasonClaimed = []; p.seasonTaskClaimed = []; }
  settings.netProfileV41 = p;
  return p;
}
function netRankNameV41(r) { return r < 1100 ? 'Бронза' : r < 1300 ? 'Серебро' : r < 1500 ? 'Золото' : r < 1700 ? 'Платина' : r < 1900 ? 'Алмаз' : 'Чемпион'; }
function netProfilePublicV41() { const p = netProfileV41(); return { id:p.id, name:netNickV41(), rating:p.rating, games:p.games, wins:p.wins, losses:p.losses, draws:p.draws, xp:p.xp, level:Math.floor(p.xp/250)+1 }; }
function netFriendsV41() { if (!Array.isArray(settings.netFriendsV41)) settings.netFriendsV41 = []; return settings.netFriendsV41; }
function netUpsertFriendV41(raw) {
  if (!raw || typeof raw !== 'object') return;
  const name = String(raw.name || raw.n || 'Игрок').replace(/[\u0000-\u001f]/g, '').trim().slice(0,14) || 'Игрок';
  const id = typeof raw.id === 'string' ? raw.id.slice(0,90) : '';
  if (id && id === netProfileV41().id) return;
  const list = netFriendsV41();
  let f = list.find(x => (id && x.id === id) || (!id && String(x.name).toLowerCase() === name.toLowerCase()));
  if (!f) { f = { id, name, rating:1000, games:0, wins:0, losses:0, draws:0, lastSeen:Date.now() }; list.push(f); }
  f.id = id || f.id || ''; f.name = name;
  ['rating','games','wins','losses','draws'].forEach(k => { if (Number.isFinite(Number(raw[k]))) f[k] = Math.max(0, Math.floor(Number(raw[k]))); });
  f.lastSeen = Date.now();
  settings.netFriendsV41 = list.filter(x => x && typeof x.name === 'string').sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0)).slice(0,100);
}
function netSafeBannerV41(html) {
  const source = String(html || '').slice(0, 30000);
  const root = document.createElement('div');
  try { root.innerHTML = source; } catch (_) { return ''; }
  const allowed = new Set(['DIV','SPAN','B','SMALL','I','EM','STRONG','BR']);
  const walk = node => Array.from(node.childNodes).forEach(ch => {
    if (ch.nodeType !== 1) return;
    if (!allowed.has(ch.tagName)) { ch.replaceWith(document.createTextNode(ch.textContent || '')); return; }
    Array.from(ch.attributes).forEach(a => {
      if (a.name === 'class') ch.setAttribute('class', String(a.value).replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,100));
      else if (a.name === 'style' && /^\s*--tc\s*:\s*#[0-9a-f]{3,8}\s*;?\s*$/i.test(a.value)) ch.setAttribute('style', '--tc:' + (a.value.match(/#[0-9a-f]{3,8}/i)||['#ffffff'])[0]);
      else ch.removeAttribute(a.name);
    });
    walk(ch);
  });
  walk(root); return root.innerHTML.slice(0, 30000);
}
function netCupSaveV41() { if (settings.netCupV41) save(); }
function netCupCreateV41(count) {
  count = count === 8 ? 8 : 4;
  const players = Array.from({length:count}, (_,i) => i===0 ? netNickV41() : 'Участник ' + (i+1));
  const rounds = []; let size = count, roundIndex = 0;
  while (size >= 2) {
    const matches = Array.from({length:size/2}, (_,i) => ({a:null,b:null,scoreA:null,scoreB:null,winner:null}));
    if (roundIndex === 0) matches.forEach((m,i) => {m.a=players[i*2];m.b=players[i*2+1];});
    rounds.push(matches); size /= 2; roundIndex++;
  }
  settings.netCupV41 = { id:netRandIdV41(), name:'Cowball Online Cup', size:count, created:Date.now(), players, rounds, history:[] };
  netCupSaveV41(); NET3V41.view='cup'; renderNet();
}
function netCupResetDownstreamV41(cup, round, idx) {
  for (let r=round+1;r<cup.rounds.length;r++) {
    const prev=cup.rounds[r-1], cur=cup.rounds[r];
    cur.forEach((m,i)=>{
      const a=prev[i*2]&&prev[i*2].winner||null, b=prev[i*2+1]&&prev[i*2+1].winner||null;
      if (m.a!==a || m.b!==b) { m.a=a; m.b=b; m.scoreA=null; m.scoreB=null; m.winner=null; }
    });
  }
}
function netCupScoreV41(round, idx, sa, sb, source='manual') {
  const cup=settings.netCupV41; if(!cup||!cup.rounds[round]||!cup.rounds[round][idx]) return false;
  const m=cup.rounds[round][idx]; if(!m.a||!m.b) return false;
  sa=Number(sa);sb=Number(sb);if(!Number.isInteger(sa)||!Number.isInteger(sb)||sa<0||sb<0||sa>99||sb>99)return false;
  m.scoreA=sa;m.scoreB=sb;m.winner=sa===sb?null:(sa>sb?m.a:m.b);m.source=source;m.updated=Date.now();
  if(!Array.isArray(cup.history))cup.history=[];
  cup.history.unshift({round,idx,a:m.a,b:m.b,score:[sa,sb],winner:m.winner,source,ts:Date.now()});cup.history=cup.history.slice(0,40);
  netCupResetDownstreamV41(cup,round,idx);settings.netCupV41=cup;netCupSaveV41();
  if(sa===sb) nxToast('Ничья в кубке: сыграй переигровку или введи пенальти вручную.');
  return true;
}
function netCupAutoRecordV41(sc, localSide) {
  const cup=settings.netCupV41;if(!cup||!Array.isArray(cup.rounds))return false;
  const me=netNickV41(), peer=String(NX.peer||NET3V41.peerProfile?.name||'').trim();if(!peer)return false;
  const own=Number(sc[localSide]||0), other=Number(sc[localSide===0?1:0]||0);
  for(let r=0;r<cup.rounds.length;r++) for(let i=0;i<cup.rounds[r].length;i++){
    const m=cup.rounds[r][i]; if(!m||!m.a||!m.b||m.winner!==null)continue;
    if(m.a===me&&m.b===peer) return netCupScoreV41(r,i,own,other,'online');
    if(m.a===peer&&m.b===me) return netCupScoreV41(r,i,other,own,'online');
  }
  return false;
}
function netCupHTMLV41() {
  const cup=settings.netCupV41;
  if(!cup) return `<div class="nxHero"><div class="nxGlobe">🏆</div><div><h2>Онлайн-кубок</h2><p>Сетка плей-офф на 4 или 8 участников. Матчи можно записывать автоматически после P2P-матча или вручную.</p></div></div><div class="nxTiles"><button class="nxT pri" data-a="netCupCreate" data-v="4"><i>🏆</i><b>Кубок на 4</b><small>Полуфиналы и финал</small></button><button class="nxT" data-a="netCupCreate" data-v="8"><i>🥇</i><b>Кубок на 8</b><small>Четвертьфиналы, полуфиналы и финал</small></button></div><p class="help sm">Сетка хранится на этом устройстве. Без центрального сервера она не синхронизируется автоматически между всеми участниками.</p>`;
  let h=`<div class="nxHero"><div class="nxGlobe">🏆</div><div><h2>${netEsc(cup.name||'Cowball Online Cup')}</h2><p>${cup.size} участника · создан ${new Date(cup.created||Date.now()).toLocaleDateString()}</p></div></div><div class="nxPanel"><h3>Имена участников</h3><div class="nxGrid">${cup.players.map((p,i)=>`<label class="nxF">Участник ${i+1}<input class="nxIn" maxlength="14" data-cup-player="${i}" value="${netEsc(p)}"></label>`).join('')}</div><div class="nxRow"><button class="nxB pri" data-a="netCupSavePlayers">Сохранить имена и сбросить сетку</button><button class="nxB danger" data-a="netCupReset">Удалить кубок</button></div></div>`;
  cup.rounds.forEach((round,ri)=>{const label=ri===cup.rounds.length-1?'Финал':(ri===cup.rounds.length-2?'Полуфиналы':(cup.size===8&&ri===0?'Четвертьфиналы':'Полуфиналы'));h+=`<div class="nxPanel"><h3>${label}</h3><div class="nxGrid">`;round.forEach((m,mi)=>{const ready=!!(m.a&&m.b);h+=`<div class="nxPanel"><b>${netEsc(m.a||'Ожидает соперника')}</b><div class="nxVs" style="font-size:14px">VS</div><b>${netEsc(m.b||'Ожидает победителя')}</b>${m.winner?`<p class="nxOk">Победитель: ${netEsc(m.winner)}</p>`:''}${m.scoreA!==null&&m.scoreB!==null?`<p class="help sm">Последний счёт: ${m.scoreA} : ${m.scoreB}</p>`:''}<div class="nxRow"><input class="nxIn" type="number" min="0" max="99" inputmode="numeric" aria-label="Голы команды A" data-cup-sa="${ri}-${mi}" value="${m.scoreA===null?'':m.scoreA}" style="width:64px" ${ready?'':'disabled'}><span>:</span><input class="nxIn" type="number" min="0" max="99" inputmode="numeric" aria-label="Голы команды B" data-cup-sb="${ri}-${mi}" value="${m.scoreB===null?'':m.scoreB}" style="width:64px" ${ready?'':'disabled'}><button class="nxB" data-a="netCupScore" data-r="${ri}" data-i="${mi}" ${ready?'':'disabled'}>Записать</button></div></div>`;});h+='</div></div>';});
  h+=`<p class="help sm">Если имена участников совпадают с никами в лобби, результат матча между тобой и соперником запишется автоматически. При ничьей нужно ввести итог серии пенальти вручную.</p>`;
  return h;
}
function netProfileHTMLV41() {
  const p=netProfileV41(),tasks=[{id:'games',n:'Сыграй 3 онлайн-матча',v:p.seasonGames,goal:3,xp:100},{id:'wins',n:'Выиграй 2 матча',v:p.seasonWins,goal:2,xp:100},{id:'goals',n:'Забей 10 голов',v:p.seasonGoals,goal:10,xp:150}];
  const rewards=[{v:100,n:'Значок «Новичок сезона»',icon:'🌟'},{v:250,n:'Значок «Сильный соперник»',icon:'⚡'},{v:500,n:'Значок «Легенда Cowball»',icon:'👑'}];
  return `<div class="nxHero"><div class="nxGlobe">🐮</div><div><h2>Профиль ${netEsc(netNickV41())}</h2><p>${netRankNameV41(p.rating)} · уровень ${Math.floor(p.xp/250)+1} · сезон ${p.seasonNo}</p></div></div><div class="nxPanel"><h3>Никнейм</h3><input id="nxNick" class="nxIn" maxlength="14" value="${netEsc(netNickV41())}" placeholder="Твой ник"><p class="help sm">Ник виден соперникам в P2P-лобби. Настоящее имя вводить не нужно.</p></div><div class="nxGrid"><div class="nxPanel"><small>Рейтинг</small><h2>${p.rating}</h2><p class="help sm">${netRankNameV41(p.rating)}${p.rankedGames?' · рейтинговых матчей: '+p.rankedGames:''}</p></div><div class="nxPanel"><small>Матчи</small><h2>${p.games}</h2><p class="help sm">${p.wins} побед · ${p.draws} ничьих · ${p.losses} поражений</p></div><div class="nxPanel"><small>Голы</small><h2>${p.goalsFor}</h2><p class="help sm">Пропущено: ${p.goalsAgainst}</p></div><div class="nxPanel"><small>Опыт</small><h2>${p.xp} XP</h2><p class="help sm">Уровень ${Math.floor(p.xp/250)+1}</p></div></div><div class="nxPanel"><h3>Задания сезона</h3>${tasks.map(t=>{const claimed=p.seasonTaskClaimed.includes(t.id),done=t.v>=t.goal;return `<div class="nxPanel"><b>${t.n}</b><p class="help sm">${Math.min(t.v,t.goal)} / ${t.goal} · награда ${t.xp} XP</p><div class="uxProg"><u style="width:${Math.min(100,t.v/t.goal*100)}%"></u></div><button class="nxB ${claimed?'wait':'pri'}" data-a="netClaimTask" data-v="${t.id}" ${!done||claimed?'disabled':''}>${claimed?'Получено':done?'Забрать XP':'Продолжай играть'}</button></div>`;}).join('')}</div><div class="nxPanel"><h3>Награды сезона</h3>${rewards.map(r=>`<div class="nxRow"><span>${r.icon} ${r.n} · ${r.v} XP</span><button class="nxB ${p.seasonClaimed.includes(r.v)?'wait':'pri'}" data-a="netClaimReward" data-v="${r.v}" ${p.seasonXp<r.v||p.seasonClaimed.includes(r.v)?'disabled':''}>${p.seasonClaimed.includes(r.v)?'Получено':p.seasonXp<r.v?'Нужно '+r.v+' XP':'Забрать'}</button></div>`).join('')}<p class="help sm">Сезон длится 28 дней. Опыт и награды хранятся локально; это не серверный пропуск.</p></div><div class="nxPanel"><h3>Последние матчи</h3>${p.history.map(m=>`<div class="nxRow"><span>${netEsc(m.result||'Матч')} · ${m.own}:${m.opp}</span><small>${netEsc(m.peer||'Соперник')} · ${new Date(m.ts).toLocaleDateString()}</small></div>`).join('')||'<p class="help">Сыграй первый онлайн-матч, чтобы появилась история.</p>'}</div>`;
}
function netLeaderboardHTMLV41() {
  const self=netProfileV41(), rows=[{id:self.id,name:netNickV41(),rating:self.rating,games:self.games,wins:self.wins,isMe:true},...netFriendsV41().map(f=>({id:f.id,name:f.name,rating:Number(f.rating)||1000,games:Number(f.games)||0,wins:Number(f.wins)||0}))];
  if(NET3V41.peerProfile) rows.push({id:NET3V41.peerProfile.id,name:NET3V41.peerProfile.name,rating:Number(NET3V41.peerProfile.rating)||1000,games:Number(NET3V41.peerProfile.games)||0,wins:Number(NET3V41.peerProfile.wins)||0});
  const uniq=new Map();rows.forEach(x=>{const k=x.id||x.name.toLowerCase();if(!uniq.has(k)||x.isMe)uniq.set(k,x);});
  const sorted=Array.from(uniq.values()).sort((a,b)=>b.rating-a.rating);
  return `<div class="nxHero"><div class="nxGlobe">📊</div><div><h2>Таблица лидеров</h2><p>Твой профиль и соперники, с которыми играл на этом устройстве.</p></div></div><div class="nxPanel"><p class="help sm">Это локальная таблица, дополненная профилями знакомых соперников. Публичный мировой рейтинг невозможно честно вести без общего сервера.</p>${sorted.map((r,i)=>`<div class="nxRow" style="border-bottom:1px solid var(--line);padding:8px 0"><b style="width:28px">${i+1}</b><span style="flex:1">${r.isMe?'⭐ ':''}${netEsc(r.name)}<small style="display:block;color:var(--mut)">${r.games} матчей · ${r.wins} побед</small></span><b>${r.rating}</b><span class="nxPing">${netRankNameV41(r.rating)}</span></div>`).join('')}</div>`;
}
function netFriendsHTMLV41() {
  const list=netFriendsV41().slice().sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));
  return `<div class="nxHero"><div class="nxGlobe">👥</div><div><h2>Друзья и соперники</h2><p>После подключения ник и рейтинг сохраняются в список на этом устройстве.</p></div></div><div class="nxTiles"><button class="nxT pri" data-a="netView" data-v="lobby"><i>🔗</i><b>Создать приглашение</b><small>Создай комнату и отправь другу P2P-код</small></button></div><div class="nxPanel"><h3>Недавно встречались</h3>${list.map(f=>`<div class="nxRow" style="border-bottom:1px solid var(--line);padding:8px 0"><span class="nxAv">🐮</span><span style="flex:1"><b>${netEsc(f.name)}</b><small style="display:block;color:var(--mut)">${f.games||0} матчей · ${netRankNameV41(Number(f.rating)||1000)} · ${new Date(f.lastSeen||Date.now()).toLocaleDateString()}</small></span><b>${Number(f.rating)||1000}</b></div>`).join('')||'<p class="help">Список пока пуст. Создай комнату или подключись к другу — соперник появится здесь.</p>'}</div><p class="help sm">Без сервера нельзя показать надёжный статус «в сети» или отправлять уведомления офлайн-друзьям. Для приглашения создаётся новая комната и новый код.</p>`;
}
function netExtraNavHTMLV41() {
  const tabs=[['lobby','🎮 Лобби'],['profile','👤 Профиль'],['leaderboard','🏆 Рейтинг'],['friends','👥 Друзья'],['cup','🥇 Кубок']];
  return `<div class="nxQuick" style="margin:0 0 12px">${tabs.map(([v,l])=>`<button data-a="netView" data-v="${v}" class="${NET3V41.view===v?'pri':''}">${l}</button>`).join('')}</div>`;
}
function netLobbyControlsHTMLV41() {
  if(!(NET.open&&NET.role==='host'&&NET.ui==='ready'))return '';
  const fmt=Number(settings.netFormatV41)||5,ranked=!!settings.netRankedV41;
  return `<div class="nxPanel"><h3>Формат и рейтинг матча</h3><label class="nxF">Формат команд<select class="nxIn" id="netFormatV41"><option value="2" ${fmt===2?'selected':''}>1 × 1 + вратари</option><option value="3" ${fmt===3?'selected':''}>2 × 2 + вратари</option><option value="5" ${fmt===5?'selected':''}>5 × 5 (футзальный состав)</option><option value="11" ${fmt===11?'selected':''}>11 × 11</option></select></label><button class="nxB ${ranked?'pri':''}" data-a="netRankedToggle">${ranked?'🏆 Рейтинговый матч: ВКЛ':'⚔ Рейтинговый матч: ВЫКЛ'}</button><p class="help sm">Оба игрока подключаются напрямую. Рейтинг обновляется на устройствах участников; без сервера это не защищено от подмены данных.</p></div>`;
}
const _renderNetV41Base = renderNet;
renderNet = function() {
  _renderNetV41Base();
  const b=$('netBody'); if(!b)return;
  const nav=netExtraNavHTMLV41();
  if(NET3V41.view==='profile') { b.innerHTML=nav+netProfileHTMLV41()+'<div class="nxRow"><button class="nxB" data-a="netView" data-v="lobby">← В лобби</button></div>'; return; }
  if(NET3V41.view==='leaderboard') { b.innerHTML=nav+netLeaderboardHTMLV41()+'<div class="nxRow"><button class="nxB" data-a="netView" data-v="lobby">← В лобби</button></div>'; return; }
  if(NET3V41.view==='friends') { b.innerHTML=nav+netFriendsHTMLV41()+'<div class="nxRow"><button class="nxB" data-a="netView" data-v="lobby">← В лобби</button></div>'; return; }
  if(NET3V41.view==='cup') { b.innerHTML=nav+netCupHTMLV41()+'<div class="nxRow"><button class="nxB" data-a="netView" data-v="lobby">← В лобби</button></div>'; return; }
  b.insertAdjacentHTML('afterbegin',nav);
  if(NET.ui==='ready') b.insertAdjacentHTML('afterbegin',netLobbyControlsHTMLV41());
  if(NET.ui==='menu') b.insertAdjacentHTML('beforeend','<div class="nxPanel"><h3>Игровой профиль</h3><p class="help sm">Рейтинг, друзья, сезоны и локальный кубок доступны без аккаунта. Сетевое подключение создаётся через прямой WebRTC-код.</p><div class="nxQuick"><button data-a="netView" data-v="profile">👤 Профиль</button><button data-a="netView" data-v="leaderboard">🏆 Таблица</button><button data-a="netView" data-v="friends">👥 Друзья</button><button data-a="netView" data-v="cup">🥇 Кубок</button></div></div>');
  b.insertAdjacentHTML('beforeend','<p class="help sm">Важно: GitHub Pages раздаёт HTML, но не служит мультиплеерным сервером. Прямое WebRTC-соединение работает без сервера сигнализации за счёт обмена кодами, однако некоторые сети требуют TURN-сервер.</p>');
};
function netApplyProfileResultV41(sc, localSide, matchId) {
  if(!NET.open||!matchCfg||!matchCfg.net||!Array.isArray(sc)||sc.length<2)return false;
  const p=netProfileV41(), mid=String(matchId||NET.matchId||matchCfg.netMatchId||('match-'+Date.now()));
  if(p.processed.includes(mid))return false;
  const own=Number(sc[localSide]||0),opp=Number(sc[localSide===0?1:0]||0),peer=String(NX.peer||NET3V41.peerProfile?.name||'Соперник').slice(0,14);
  const result=own>opp?'Победа':own<opp?'Поражение':'Ничья';
  p.games++;p.goalsFor+=own;p.goalsAgainst+=opp;p.seasonGames++;p.seasonGoals+=own;
  if(own>opp){p.wins++;p.seasonWins++;}else if(own<opp)p.losses++;else p.draws++;
  const xp=30+(own>opp?25:own===opp?10:0)+Math.min(20,own*2);p.xp+=xp;p.seasonXp+=xp;
  const ranked=!!matchCfg.netRanked;
  if(ranked){const otherRating=clamp(Number(NET3V41.peerProfile&&NET3V41.peerProfile.rating)||1000,0,4000);const expected=1/(1+Math.pow(10,(otherRating-p.rating)/400));const actual=own>opp?1:own<opp?0:.5;p.rating=clamp(Math.round(p.rating+32*(actual-expected)),0,4000);p.rankedGames++;if(own>opp)p.rankedWins++;else if(own<opp)p.rankedLosses++;}
  p.history.unshift({mid,result,own,opp,peer,ranked,ts:Date.now(),rating:p.rating});p.history=p.history.slice(0,30);p.processed.push(mid);p.processed=p.processed.slice(-40);
  settings.netProfileV41=p;netUpsertFriendV41(NET3V41.peerProfile||{name:peer});
  netCupAutoRecordV41(sc,localSide);save();
  return true;
}
const _endMatchV41Base=endMatch;
endMatch=function(){
  const hostResult=!!(NET.open&&NET.role==='host'&&matchCfg&&matchCfg.net);
  if(hostResult)netApplyProfileResultV41(score.slice(),0,NET.matchId||matchCfg.netMatchId);
  const result=_endMatchV41Base.apply(this,arguments);
  if(hostResult)netSend({t:'pf',p:netProfilePublicV41()},true);
  return result;
};
const _netRecvV41Base=netRecv;
netRecv=function(m){
  if(!m||typeof m!=='object'||typeof m.t!=='string')return;
  if(m.t==='inp'&&NET.role==='host'){
    const o=m.o&&typeof m.o==='object'?m.o:{};
    m.o={x:clamp(Number(o.x)||0,-1,1),y:clamp(Number(o.y)||0,-1,1),kick:!!o.kick,pass:!!o.pass,cross:!!o.cross,sprint:!!o.sprint,sw:!!o.sw};
  }
  if(m.t==='snap'){
    if(!Array.isArray(m.c)||m.c.length>22||!Array.isArray(m.b)||m.b.length<5||!Array.isArray(m.sc)||m.sc.length<2||!m.c.every(c=>Array.isArray(c)&&c.length>=4&&c.slice(0,4).every(v=>Number.isFinite(Number(v))))||!m.b.slice(0,5).every(v=>Number.isFinite(Number(v))))return;
    if(m.bn!==undefined)m.bn=netSafeBannerV41(m.bn);
    m.sc=m.sc.slice(0,2).map(v=>clamp(Math.floor(Number(v)||0),0,999));
  }
  if(m.t==='pf'){
    const raw=m.p;if(!raw||typeof raw!=='object')return;
    const pf={id:typeof raw.id==='string'?raw.id.slice(0,90):'',name:String(raw.name||'Игрок').replace(/[\u0000-\u001f]/g,'').slice(0,14),rating:clamp(Math.floor(Number(raw.rating)||1000),0,4000),games:Math.max(0,Math.floor(Number(raw.games)||0)),wins:Math.max(0,Math.floor(Number(raw.wins)||0)),losses:Math.max(0,Math.floor(Number(raw.losses)||0)),draws:Math.max(0,Math.floor(Number(raw.draws)||0)),xp:Math.max(0,Math.floor(Number(raw.xp)||0)),level:Math.max(1,Math.floor(Number(raw.level)||1))};
    NET3V41.peerProfile=pf;NX.peer=pf.name;netUpsertFriendV41(pf);save();if(NET.open)nxRefresh();return;
  }
  let res;
  if(m.t==='end'&&NET.role==='guest'){
    const sc=Array.isArray(m.sc)?m.sc.slice(0,2).map(v=>clamp(Math.floor(Number(v)||0),0,999)):null;
    if(sc)netApplyProfileResultV41(sc,1,NET.matchId||matchCfg.netMatchId);
    res=_netRecvV41Base(m);
    if(sc)netSend({t:'pf',p:netProfilePublicV41()},true);
    return res;
  }
  res=_netRecvV41Base(m);
  if(m.t==='hi')netSend({t:'pf',p:netProfilePublicV41()},true);
  if(m.t==='resetReady'&&NET.role==='guest'){NX.myRdy=false;nxRefresh();}
  return res;
};
// A profile is sent after the standard greeting; validate snapshots and all client inputs before use.
const _startMatchV41Base=startMatch;
startMatch=function(cfg){
  if(NET.open&&NET.role==='host'&&cfg&&cfg.versus){
    const fm=[2,3,5,11].includes(Number(settings.netFormatV41))?Number(settings.netFormatV41):5;
    cfg=Object.assign({},cfg,{size:fm});
  }
  return _startMatchV41Base(cfg);
};
const _startMatchNowV41Base=startMatchNow;
startMatchNow=function(cfg){
  let next=cfg||{};
  if(NET.open&&NET.role==='host'&&next.versus){
    const fm=[2,3,5,11].includes(Number(settings.netFormatV41))?Number(settings.netFormatV41):Number(next.size)||5;
    NET.matchId='cowball-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    next=Object.assign({},next,{size:fm,net:true,netRanked:!!settings.netRankedV41,netMatchId:NET.matchId});
    settings.netFormatV41=fm;save();
  }
  return _startMatchNowV41Base(next);
};
// Share selected format/ranked state with the guest through the existing ordered data channel.
const _nxSendCfgV41Base=nxSendCfg;
nxSendCfg=function(){
  _nxSendCfgV41Base();
  if(NET.role==='host'&&NET.open)netSend({t:'cfg',c:{format:Number(settings.netFormatV41)||5,ranked:!!settings.netRankedV41,time:Math.floor((settings.time||90)/60)+':'+String((settings.time||90)%60).padStart(2,'0'),stadium:String(settings.stadium||''),weather:String(settings.weather||''),tod:String(settings.tod||'')}},true);
};
// Correct the serverless guest start metadata while preserving the original match engine.
const _guestStartV41Base=guestStart;
guestStart=function(m){
  NET.matchId=String(m.mid||'');NET.ranked=!!m.ranked;
  settings.netFormatV41=[2,3,5,11].includes(Number(m.size))?Number(m.size):5;
  settings.netRankedV41=!!m.ranked;
  _guestStartV41Base(Object.assign({},m,{size:settings.netFormatV41}));
  if(matchCfg){matchCfg.net=true;matchCfg.netRanked=!!m.ranked;matchCfg.netMatchId=NET.matchId;}
};
// Let the host's format/ranked controls update without modifying ordinary local-match settings.
Object.assign(ACT,{
 netView(d){NET3V41.view=['lobby','profile','leaderboard','friends','cup'].includes(String(d.v))?String(d.v):'lobby';renderNet();},
 netRankedToggle(){settings.netRankedV41=!settings.netRankedV41;NX.peerRdy=false;netSend({t:'resetReady'},true);save();nxSendCfg();renderNet();},
 netCupCreate(d){netCupCreateV41(Number(d.v));},
 netCupReset(){if(confirm('Удалить текущий кубок и его результаты?')){delete settings.netCupV41;save();renderNet();}},
 netCupSavePlayers(){const cup=settings.netCupV41;if(!cup)return;const inputs=Array.from(document.querySelectorAll('[data-cup-player]'));const names=inputs.map((el,i)=>(String(el.value||'').trim().slice(0,14)||'Участник '+(i+1)));if(new Set(names.map(n=>n.toLowerCase())).size!==names.length){nxToast('Имена участников должны отличаться');return;}cup.players=names;cup.rounds[0].forEach((m,i)=>{m.a=names[i*2];m.b=names[i*2+1];m.scoreA=null;m.scoreB=null;m.winner=null;});for(let r=1;r<cup.rounds.length;r++)cup.rounds[r].forEach(m=>{m.a=null;m.b=null;m.scoreA=null;m.scoreB=null;m.winner=null;});cup.history=[];settings.netCupV41=cup;netCupSaveV41();nxToast('Сетка обновлена');renderNet();},
 netCupScore(d){const key=String(d.r)+'-'+String(d.i),a=document.querySelector('[data-cup-sa="'+key+'"]'),b=document.querySelector('[data-cup-sb="'+key+'"]');if(!a||!b||a.value===''||b.value===''){nxToast('Введи оба счёта');return;}if(!netCupScoreV41(Number(d.r),Number(d.i),a.value,b.value,'manual')){nxToast('Не удалось записать счёт');return;}renderNet();},
 netClaimReward(d){const v=Number(d.v),p=netProfileV41();if(![100,250,500].includes(v)||p.seasonXp<v||p.seasonClaimed.includes(v))return;p.seasonClaimed.push(v);const names={100:'Значок «Новичок сезона»',250:'Значок «Сильный соперник»',500:'Значок «Легенда Cowball»'};p.cosmetics.push(names[v]);p.cosmetics=p.cosmetics.slice(-30);settings.netProfileV41=p;save();renderNet();nxToast('Награда получена!');},
 netClaimTask(d){const id=String(d.v),cfg={games:{key:'seasonGames',goal:3,xp:100},wins:{key:'seasonWins',goal:2,xp:100},goals:{key:'seasonGoals',goal:10,xp:150}}[id],p=netProfileV41();if(!cfg||p.seasonTaskClaimed.includes(id)||Number(p[cfg.key]||0)<cfg.goal)return;p.seasonTaskClaimed.push(id);p.xp+=cfg.xp;p.seasonXp+=cfg.xp;settings.netProfileV41=p;save();renderNet();nxToast('Задание выполнено: +'+cfg.xp+' XP');},
 netPlay(){if(!NX.peerRdy){nxToast('Друг ещё не готов');return;}settings.localTouchV21=false;openTeams('versus');}
});
document.addEventListener('change',e=>{
 const t=e.target;if(t&&t.id==='netFormatV41'){const v=Number(t.value);if([2,3,5,11].includes(v)){settings.netFormatV41=v;save();nxSendCfg();nxRefresh();}}
});
// Protect against accidentally pasting extremely large P2P codes into the join/answer action.
const _netAcceptV41Base=ACT.netAccept, _netAnswerGoV41Base=ACT.netAnswerGo;
ACT.netAccept=async function(){const v=($('netAnswer')||{}).value||'';if(v.length>180000){NET.msg='Код слишком большой или повреждён';renderNet();return;}return _netAcceptV41Base.apply(this,arguments);};
ACT.netAnswerGo=async function(){const v=($('netAnswer')||{}).value||'';if(v.length>180000){NET.msg='Код слишком большой или повреждён';renderNet();return;}return _netAnswerGoV41Base.apply(this,arguments);};
// Clear transient connection-drop timers during page shutdown; WebRTC may be unavailable in some browsers/contexts.
window.addEventListener('pagehide',()=>{if(netDropTimerV41)clearTimeout(netDropTimerV41);});
/* =================== end v41 online enhancement =================== */

/* =================== end v40 stability patch =================== */

/* ================= Cowball v42: online challenges, touch-control skin and career depth ================= */

// Extra online progression is stored locally and is deliberately kept separate from the existing WebRTC protocol.
function netDailyProfileV42() {
  const p = netProfileV41();
  const d = new Date(), key = [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  if (p.dailyDate !== key) {
    p.dailyDate = key; p.dailyGames = 0; p.dailyWins = 0; p.dailyGoals = 0; p.dailyClaimed = [];
  }
  ['dailyGames','dailyWins','dailyGoals'].forEach(k => p[k] = Math.max(0, Math.floor(Number(p[k]) || 0)));
  if (!Array.isArray(p.dailyClaimed)) p.dailyClaimed = [];
  if (!Array.isArray(p.achievementClaimed)) p.achievementClaimed = [];
  settings.netProfileV41 = p;
  return p;
}
function netDailyTasksV42(p) {
  return [
    { id:'play', title:'Сыграй онлайн-матч', value:p.dailyGames, goal:1, xp:50, icon:'🎮' },
    { id:'win', title:'Выиграй онлайн-матч', value:p.dailyWins, goal:1, xp:60, icon:'🏆' },
    { id:'goals', title:'Забей 3 гола онлайн', value:p.dailyGoals, goal:3, xp:60, icon:'⚽' }
  ];
}
function netAchievementListV42(p) {
  return [
    {id:'debut', title:'Первый выход в сеть', desc:'Сыграй первый онлайн-матч', icon:'🌐', goal:p.games>=1, xp:40, prize:'Онлайн-дебют'},
    {id:'fivewins', title:'Пять побед', desc:'Выиграй 5 онлайн-матчей', icon:'🔥', goal:p.wins>=5, xp:80, prize:'Победная серия'},
    {id:'goals25', title:'Голевая машина', desc:'Забей 25 голов в онлайне', icon:'⚽', goal:p.goalsFor>=25, xp:80, prize:'Голевая машина'},
    {id:'ranked5', title:'Рейтинговый игрок', desc:'Сыграй 5 рейтинговых матчей', icon:'📈', goal:p.rankedGames>=5, xp:100, prize:'Рейтинговый игрок'},
    {id:'games10', title:'Постоянный участник', desc:'Сыграй 10 онлайн-матчей', icon:'🎖️', goal:p.games>=10, xp:120, prize:'Ветеран Cowball'}
  ];
}
function netDailyHTMLV42() {
  const p = netDailyProfileV42(), tasks = netDailyTasksV42(p);
  const now = new Date(), next = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1), left = Math.max(0,next-now);
  const hours = Math.floor(left/3600000), mins = Math.floor((left%3600000)/60000);
  return `<div class="nxHero"><div class="nxGlobe">📆</div><div><h2>Ежедневные задания</h2><p>Небольшие цели для каждого игрового дня. Обновление через ${hours} ч ${mins} мин.</p></div></div>
  <div class="nxPanel"><h3>Твой прогресс сегодня</h3><div class="nxGrid"><div class="nxPanel"><small>Матчи</small><h2>${p.dailyGames}</h2></div><div class="nxPanel"><small>Победы</small><h2>${p.dailyWins}</h2></div><div class="nxPanel"><small>Голы</small><h2>${p.dailyGoals}</h2></div></div></div>
  ${tasks.map(t=>{const done=t.value>=t.goal,claimed=p.dailyClaimed.includes(t.id);return `<div class="c42Panel"><div class="c42TaskHead"><span>${t.icon} ${netEsc(t.title)}</span><b>+${t.xp} XP</b></div><div class="uxProg"><u style="width:${Math.min(100,t.value/t.goal*100)}%"></u></div><p class="help sm">${Math.min(t.goal,t.value)} / ${t.goal}</p><button class="nxB ${done&&!claimed?'pri':''}" data-a="netDailyClaimV42" data-v="${t.id}" ${!done||claimed?'disabled':''}>${claimed?'Получено':done?'Забрать награду':'Продолжай играть'}</button></div>`;}).join('')}
  <p class="help sm">Задания, опыт и награды хранятся в этом браузере. Они не синхронизируются между устройствами без общего сервера.</p>`;
}
function netAchievementsHTMLV42() {
  const p = netDailyProfileV42(), list = netAchievementListV42(p), claimed = new Set(p.achievementClaimed);
  const total = list.filter(x=>x.goal).length;
  return `<div class="nxHero"><div class="nxGlobe">🏅</div><div><h2>Онлайн-достижения</h2><p>Открывай значки за матчи, победы, голы и рейтинговые игры.</p></div></div>
  <div class="nxPanel"><div class="c42TaskHead"><b>Прогресс достижений</b><span class="nxPing">${total} / ${list.length}</span></div><div class="uxProg"><u style="width:${total/list.length*100}%"></u></div></div>
  <div class="c42AchGrid">${list.map(a=>{const got=claimed.has(a.id);return `<div class="c42Ach ${a.goal?'unlocked':''}"><div class="c42AchIcon">${a.icon}</div><b>${netEsc(a.title)}</b><p>${netEsc(a.desc)}</p><small>${got?'Награда получена':a.goal?'Достижение открыто':'Пока закрыто'}</small><button class="nxB ${a.goal&&!got?'pri':''}" data-a="netClaimAchievementV42" data-v="${a.id}" ${!a.goal||got?'disabled':''}>${got?'Получено':a.goal?'Забрать +'+a.xp+' XP':'Продолжай'}</button></div>`;}).join('')}</div>
  <p class="help sm">Достижения начисляются на основе локальной статистики. Они не являются серверно подтверждёнными и не защищены от изменения сохранения.</p>`;
}
function netChallengeHTMLV42() {
  const p=netDailyProfileV42(),peer=NET3V41.peerProfile;
  const card=`COWBALL ONLINE · ${netNickV41()}\nРанг: ${netRankNameV41(p.rating)} (${p.rating})\nМатчи: ${p.games} · Победы: ${p.wins}\nГолы: ${p.goalsFor} · Уровень: ${Math.floor(p.xp/250)+1}\nСезон: ${p.seasonNo} · XP: ${p.xp}`;
  return `<div class="nxHero"><div class="nxGlobe">🤝</div><div><h2>Вызов сопернику</h2><p>Поделись карточкой игрока, проверь соединение или пригласи друга в прямую комнату.</p></div></div>
  <div class="nxPanel"><h3>Карточка игрока</h3><div class="c42ShareCard"><div class="c42ShareLogo">🐮</div><div><b>${netEsc(netNickV41())}</b><small>${netEsc(netRankNameV41(p.rating))} · Рейтинг ${p.rating}</small><small>${p.wins} побед · ${p.goalsFor} голов · Уровень ${Math.floor(p.xp/250)+1}</small></div></div><div class="nxRow"><button class="nxB pri" data-a="netShareCardV42">📤 Поделиться карточкой</button><button class="nxB" data-a="netView" data-v="lobby">🔗 К лобби</button></div></div>
  <div class="nxPanel"><h3>Соперник</h3>${peer?`<div class="c42ShareCard"><div class="c42ShareLogo">🎮</div><div><b>${netEsc(peer.name)}</b><small>${netEsc(netRankNameV41(peer.rating))} · Рейтинг ${peer.rating}</small><small>${peer.wins} побед · ${peer.games} матчей</small></div></div>`:'<p class="help">Соперник появится здесь после подключения к комнате.</p>'}<p class="help sm">Подключение остаётся P2P: создай комнату в лобби и обменивайся кодами с другом. Автоматического поиска соперников пока нет.</p></div>
  <div class="nxPanel"><h3>Диагностика соединения</h3><div class="nxGrid"><div class="nxPanel"><small>Состояние</small><h3>${NET.open?'Подключено':'Не подключено'}</h3></div><div class="nxPanel"><small>Роль</small><h3>${NET.open?netEsc(NET.role==='host'?'Хост':'Гость'):'—'}</h3></div><div class="nxPanel"><small>Пинг</small><h3>${NET.open&&Number.isFinite(Number(NX.ping))?Math.round(Number(NX.ping))+' мс':'—'}</h3></div><div class="nxPanel"><small>WebRTC</small><h3>${typeof RTCPeerConnection!=='undefined'?'Доступен':'Недоступен'}</h3></div></div><button class="nxB" data-a="netCopyDiagnosticsV42">📋 Скопировать данные диагностики</button></div>`;
}
const _netExtraNavHTMLV42Base = netExtraNavHTMLV41;
netExtraNavHTMLV41 = function() {
  const tabs=[['lobby','🎮 Лобби'],['profile','👤 Профиль'],['leaderboard','🏆 Рейтинг'],['friends','👥 Друзья'],['cup','🥇 Кубок'],['daily','📆 Задания'],['achievements','🏅 Достижения'],['challenge','🤝 Вызов']];
  return `<div class="nxQuick c42NetNav" style="margin:0 0 12px">${tabs.map(([v,l])=>`<button data-a="netView" data-v="${v}" class="${NET3V41.view===v?'pri':''}">${l}</button>`).join('')}</div>`;
};
const _renderNetV42Base = renderNet;
renderNet = function() {
  if (['daily','achievements','challenge'].includes(NET3V41.view)) {
    const b=$('netBody'); if(!b)return;
    const pages={daily:netDailyHTMLV42,achievements:netAchievementsHTMLV42,challenge:netChallengeHTMLV42};
    b.innerHTML=netExtraNavHTMLV41()+pages[NET3V41.view]()+`<div class="nxRow"><button class="nxB" data-a="netView" data-v="lobby">← В лобби</button></div>`;
    return;
  }
  return _renderNetV42Base.apply(this,arguments);
};
const _netViewV42Base=ACT.netView;
ACT.netView=function(d){
  const v=String(d&&d.v||'');
  if(['lobby','profile','leaderboard','friends','cup','daily','achievements','challenge'].includes(v)){NET3V41.view=v;renderNet();return;}
  return _netViewV42Base.apply(this,arguments);
};
const _netApplyProfileResultV42Base=netApplyProfileResultV41;
netApplyProfileResultV41=function(sc,localSide,matchId){
  const ok=_netApplyProfileResultV42Base.apply(this,arguments);
  if(ok&&Array.isArray(sc)&&sc.length>=2){
    const p=netDailyProfileV42(),own=Number(sc[localSide]||0),opp=Number(sc[localSide===0?1:0]||0);
    p.dailyGames++;p.dailyGoals+=Math.max(0,Math.floor(own));if(own>opp)p.dailyWins++;
    settings.netProfileV41=p;save();
  }
  return ok;
};
function netCopyTextV42(value,doneMessage){
  const textValue=String(value||'');
  const fallback=()=>{try{const t=document.createElement('textarea');t.value=textValue;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();nxToast(ok?(doneMessage||'Скопировано'):'Не удалось скопировать — выдели текст вручную');}catch(_){nxToast('Не удалось скопировать — выдели текст вручную');}};
  try { if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(textValue).then(()=>nxToast(doneMessage||'Скопировано')).catch(fallback);return;} } catch(_) {}
  fallback();
}
Object.assign(ACT,{
  netDailyClaimV42(d){const id=String(d&&d.v||''),p=netDailyProfileV42(),task=netDailyTasksV42(p).find(x=>x.id===id);if(!task||task.value<task.goal||p.dailyClaimed.includes(id))return;p.dailyClaimed.push(id);p.xp+=task.xp;p.seasonXp+=task.xp;settings.netProfileV41=p;save();renderNet();nxToast('Задание выполнено: +'+task.xp+' XP');},
  netClaimAchievementV42(d){const id=String(d&&d.v||''),p=netDailyProfileV42(),a=netAchievementListV42(p).find(x=>x.id===id);if(!a||!a.goal||p.achievementClaimed.includes(id))return;p.achievementClaimed.push(id);p.xp+=a.xp;p.seasonXp+=a.xp;if(!p.cosmetics.includes(a.prize))p.cosmetics.push(a.prize);p.cosmetics=p.cosmetics.slice(-40);settings.netProfileV41=p;save();renderNet();nxToast('Достижение получено: +'+a.xp+' XP');},
  netShareCardV42(){const p=netProfileV41(),txt=`COWBALL ONLINE · ${netNickV41()}\nРанг: ${netRankNameV41(p.rating)} (${p.rating})\nМатчи: ${p.games} · Победы: ${p.wins}\nГолы: ${p.goalsFor} · Уровень: ${Math.floor(p.xp/250)+1}\nСезон: ${p.seasonNo} · XP: ${p.xp}`;try{if(navigator.share){navigator.share({title:'Cowball Online',text:txt}).catch(()=>netCopyTextV42(txt,'Карточка скопирована'));return;}}catch(_){}netCopyTextV42(txt,'Карточка игрока скопирована');},
  netCopyDiagnosticsV42(){const report=['Cowball Online diagnostics','Build: v42','Browser: '+String(navigator.userAgent||'unknown').slice(0,180),'WebRTC: '+(typeof RTCPeerConnection!=='undefined'?'supported':'unavailable'),'Connected: '+!!NET.open,'Role: '+String(NET.role||'none'),'ICE/connection: '+String(NET.pc&&NET.pc.connectionState||'none'),'Data channel: '+String(NET.rel&&NET.rel.readyState||'none'),'Ping ms: '+String(Number.isFinite(Number(NX.ping))?Math.round(Number(NX.ping)):'n/a')].join('\n');netCopyTextV42(report,'Диагностика скопирована');},
  netBackToLobbyV42(){if(!NET.open){NET.ui='menu';NET3V41.view='lobby';setState('menu');show('net');renderNet();return;}NET.ui='ready';NET3V41.view='lobby';if(NET.role==='host'){NX.peerRdy=false;netSend({t:'resetReady'},true);}else{NX.myRdy=false;netSend({t:'rdy',v:false},true);}setState('menu');show('net');renderNet();nxToast('Вернулись в сетевое лобби');}
});
// Offer an online rematch path on the final-score panel without replacing the existing replay/menu buttons.
const _endMatchV42Base=endMatch;
endMatch=function(){
  const wasOnline=!!(NET.open&&matchCfg&&matchCfg.net);
  const out=_endMatchV42Base.apply(this,arguments);
  if(wasOnline){const eb=$('endBtns');if(eb&&!eb.querySelector('[data-a="netBackToLobbyV42"]'))eb.insertAdjacentHTML('beforeend','<button class="mi" data-a="netBackToLobbyV42">🌐 Вернуться в онлайн-лобби</button>');}
  return out;
};

// Career v42: weekly player development, selectable tactics, sponsor contracts and facility upgrades.
const CAREER_TABS_V42=[['overview','Обзор'],['market','Трансферы'],['academy','Академия'],['board','Цели совета'],['training','Тренировки'],['tactics','Тактика'],['finance','Финансы']];
const CAREER_SPONSORS_V42=[
  {id:'arena',name:'Партнёр арены',matches:5,pay:140,bonus:700,desc:'5 матчей · 140 монет за матч + 700 в конце'},
  {id:'academy',name:'Поддержка академии',matches:4,pay:100,bonus:900,desc:'4 матча · 100 монет за матч + 900 в конце'},
  {id:'main',name:'Главный партнёр',matches:8,pay:160,bonus:1200,desc:'8 матчей · 160 монет за матч + 1200 в конце'}
];
const _careerEnsureV42Base=careerEnsureV29;
careerEnsureV29=function(){
  const ca=_careerEnsureV42Base.apply(this,arguments);if(!ca)return null;
  const week=Math.floor((Number(ca.seasonMatches)||0)/3),season=Math.max(1,Math.floor(Number(ca.season)||1));
  if(!Number.isFinite(Number(ca.trainingSeason))||Number(ca.trainingSeason)!==season){ca.trainingSeason=season;ca.trainingWeek=week;ca.trainingSessions=0;}
  else if(!Number.isFinite(Number(ca.trainingWeek))||Number(ca.trainingWeek)!==week){ca.trainingWeek=week;ca.trainingSessions=0;}
  ca.trainingSessions=Math.max(0,Math.floor(Number(ca.trainingSessions)||0));
  ca.tactic=['balanced','press','counter','possession','defensive'].includes(ca.tactic)?ca.tactic:'balanced';
  if(!Array.isArray(ca.trainingLog))ca.trainingLog=[];
  if(!ca.facilitiesV42||typeof ca.facilitiesV42!=='object')ca.facilitiesV42={training:false,scouting:false};
  ca.facilitiesV42.training=!!ca.facilitiesV42.training;ca.facilitiesV42.scouting=!!ca.facilitiesV42.scouting;
  if(!ca.sponsor||typeof ca.sponsor!=='object')ca.sponsor=null;
  if(!Array.isArray(ca.sponsorHistoryV42))ca.sponsorHistoryV42=[];
  if(!ca.financeProcessedV42||!Array.isArray(ca.financeProcessedV42))ca.financeProcessedV42=[];
  if(!ca.financeHistoryV42||!Array.isArray(ca.financeHistoryV42))ca.financeHistoryV42=[];
  if(!ca.financeTotalsV42||typeof ca.financeTotalsV42!=='object')ca.financeTotalsV42={earned:0,spent:0,sponsor:0};
  ['earned','spent','sponsor'].forEach(k=>ca.financeTotalsV42[k]=Math.max(0,Number(ca.financeTotalsV42[k])||0));
  return ca;
};
function careerNavV42(active){return `<div class="cbCareerGrid c42CareerNav">${CAREER_TABS_V42.map(([id,label])=>`<button class="mi ${active===id?'pri':''}" data-a="careerViewV29" data-v="${id}">${utxT(label)}</button>`).join('')}</div>`;}
function careerInjectNavV42(){
  const root=$('cbCareerV29');if(!root)return;
  const nav=Array.from(root.querySelectorAll('.cbCareerGrid')).find(el=>el.querySelector('[data-a="careerViewV29"]'));if(!nav)return;
  const present=new Set(Array.from(nav.querySelectorAll('[data-a="careerViewV29"]')).map(el=>String(el.dataset.v)));
  CAREER_TABS_V42.filter(([id])=>['training','tactics','finance'].includes(id)&&!present.has(id)).forEach(([id,label])=>nav.insertAdjacentHTML('beforeend',`<button class="mi" data-a="careerViewV29" data-v="${id}">${utxT(label)}</button>`));
}
function careerV42RenderExtra(tab){
  const ca=careerEnsureV29();if(!ca){_careerV29RenderV42Base('overview');return;}
  const money=n=>'🪙 '+Math.max(0,Math.floor(Number(n)||0)).toLocaleString(utxLocale());
  let body='';
  if(tab==='training'){
    const maxSessions=ca.facilitiesV42.training?4:3,cost=ca.facilitiesV42.training?220:280, used=Math.min(maxSessions,ca.trainingSessions);
    const roster=(ca.roster||[]).map(p=>({p,kind:'roster'})).concat((ca.academy||[]).map(p=>({p,kind:'academy'})));
    body=`<div class="c42Hero"><div><small>РАЗВИТИЕ СОСТАВА</small><h2>Тренировочный центр</h2><p>Тренировки повышают общий рейтинг и выбранную характеристику. Лимит обновляется каждые 3 матча лиги.</p></div><div class="c42HeroIcon">🏋️</div></div>
    <div class="c42StatGrid"><div class="c42Stat"><small>Бюджет</small><b>${money(ca.budget)}</b></div><div class="c42Stat"><small>Сессии</small><b>${used}/${maxSessions}</b></div><div class="c42Stat"><small>Цена</small><b>${money(cost)}</b></div></div>
    <div class="c42Panel"><div class="c42TaskHead"><b>Недельная нагрузка</b><span>${used}/${maxSessions}</span></div><div class="uxProg"><u style="width:${used/maxSessions*100}%"></u></div><p class="help sm">Сыграй ещё матчи лиги, чтобы открыть следующие сессии.</p></div>
    ${roster.map(({p,kind})=>{const cap=kind==='academy'?(Number(p.potential)||90):99,blocked=used>=maxSessions||ca.budget<cost||Number(p.rating||0)>=cap;return `<div class="c42Training"><div class="c42Player"><div class="c42PlayerRating">${Number(p.rating)||60}</div><div><b>${utEsc(p.name||'Игрок')}</b><small>${utEsc(p.pos||'ПЗ')} · ${kind==='academy'?'Академия':'Основной состав'} · потенциал ${cap}</small></div></div><div class="c42Stats"><span>⚡ Скорость <b>${Number(p.spd)||1}/5</b></span><span>⚽ Удар <b>${Number(p.pow)||1}/5</b></span><span>🛡 Защита <b>${Number(p.def)||1}/5</b></span></div><div class="c42TrainBtns">${[['spd','⚡ Скорость'],['pow','⚽ Удар'],['def','🛡 Защита']].map(([focus,label])=>`<button class="mi ${!blocked?'':'c42Disabled'}" data-a="careerTrainV42" data-id="${utEsc(p.id)}" data-kind="${kind}" data-focus="${focus}" ${blocked||Number(p[focus]||1)>=5?'disabled':''}>${label} +1</button>`).join('')}</div></div>`;}).join('')||`<div class="c42Panel"><p>Пока нет игроков для тренировки. Подпиши игроков на рынке или создай молодого игрока в академии.</p><button class="mi pri" data-a="careerViewV29" data-v="market">Открыть трансферы</button><button class="mi" data-a="careerViewV29" data-v="academy">Открыть академию</button></div>`}
    <div class="c42Panel"><b>История тренировок</b>${ca.trainingLog.slice(0,8).map(x=>`<div class="c42Log"><span>${utEsc(x.name)} · ${utEsc(x.focus)}</span><small>${utEsc(x.date)} · -${x.cost}</small></div>`).join('')||'<p class="help sm">Тренировок пока нет.</p>'}</div>`;
  } else if(tab==='tactics'){
    const options=[
      {id:'balanced',name:'Сбалансированная',icon:'⚖️',desc:'Без изменений характеристик. Надёжный универсальный выбор.'},
      {id:'press',name:'Высокий прессинг',icon:'🔥',desc:'Больше скорости и давления, но защита становится уязвимее.'},
      {id:'counter',name:'Контратаки',icon:'⚡',desc:'Ускоряет быстрые атаки и удары, но снижает защиту.'},
      {id:'possession',name:'Контроль мяча',icon:'🎯',desc:'Упор на сохранение позиции и защитную устойчивость.'},
      {id:'defensive',name:'Глубокая оборона',icon:'🛡️',desc:'Улучшает защиту, но уменьшает скорость перехода в атаку.'}
    ];
    body=`<div class="c42Hero"><div><small>ПЛАН НА МАТЧ</small><h2>Тактическая философия</h2><p>Выбор применяется к матчам текущей карьеры. Можно менять перед каждой игрой.</p></div><div class="c42HeroIcon">🧠</div></div><div class="c42TacticGrid">${options.map(o=>`<button class="c42Tactic ${ca.tactic===o.id?'selected':''}" data-a="careerTacticV42" data-v="${o.id}"><span>${o.icon}</span><b>${o.name}</b><small>${o.desc}</small><em>${ca.tactic===o.id?'✓ Выбрано':'Выбрать тактику'}</em></button>`).join('')}</div><div class="c42Panel"><h3>Как влияет тактика</h3><p class="help">Настройка слегка меняет характеристики команды на время матча. Эффекты ограничены, чтобы не выходить за игровые пределы и не ломать остальные режимы.</p></div>`;
  } else {
    const sponsor=ca.sponsor,active=sponsor&&Number(sponsor.matchesLeft)>0;
    const ft=ca.financeTotalsV42;
    body=`<div class="c42Hero"><div><small>УПРАВЛЕНИЕ КЛУБОМ</small><h2>Финансы и партнёры</h2><p>Зарабатывай за матчи лиги, контролируй расходы и подписывай спонсорские договоры.</p></div><div class="c42HeroIcon">💼</div></div>
    <div class="c42StatGrid"><div class="c42Stat"><small>Бюджет</small><b>${money(ca.budget)}</b></div><div class="c42Stat"><small>Заработано</small><b>${money(ft.earned)}</b></div><div class="c42Stat"><small>Расходы</small><b>${money(ft.spent)}</b></div><div class="c42Stat"><small>Спонсорские выплаты</small><b>${money(ft.sponsor)}</b></div></div>
    <div class="c42Panel"><h3>Активный контракт</h3>${active?`<div class="c42Sponsor"><b>🤝 ${utEsc(sponsor.name)}</b><p>Осталось матчей: ${sponsor.matchesLeft}</p><p>${money(sponsor.perMatch)} за матч + ${money(sponsor.bonus)} после выполнения</p></div>`: `<p class="help">Активного контракта нет. Выбери одного партнёра ниже.</p>`}</div>
    <div class="c42Panel"><h3>Спонсорские предложения</h3><div class="c42SponsorGrid">${CAREER_SPONSORS_V42.map(o=>`<div class="c42Sponsor"><b>${utEsc(o.name)}</b><p>${utEsc(o.desc)}</p><button class="mi ${!active?'pri':''}" data-a="careerSponsorV42" data-id="${o.id}" ${active?'disabled':''}>${active?'Сначала заверши контракт':'Подписать договор'}</button></div>`).join('')}</div></div>
    <div class="c42Panel"><h3>Инфраструктура</h3><div class="c42SponsorGrid"><div class="c42Sponsor"><b>🏋️ Тренировочный центр</b><p>Снижает стоимость тренировок до 220 монет и открывает 4 сессии за тренировочный цикл.</p><p>${ca.facilitiesV42.training?'✓ Построен':money(1800)}</p><button class="mi ${!ca.facilitiesV42.training?'pri':''}" data-a="careerFacilityV42" data-v="training" ${ca.facilitiesV42.training||ca.budget<1800?'disabled':''}>${ca.facilitiesV42.training?'Улучшение куплено':'Построить'}</button></div><div class="c42Sponsor"><b>🔎 Сеть скаутинга</b><p>Молодые игроки из академии получают стартовый бонус к рейтингу и потенциалу.</p><p>${ca.facilitiesV42.scouting?'✓ Активна':money(2400)}</p><button class="mi ${!ca.facilitiesV42.scouting?'pri':''}" data-a="careerFacilityV42" data-v="scouting" ${ca.facilitiesV42.scouting||ca.budget<2400?'disabled':''}>${ca.facilitiesV42.scouting?'Улучшение куплено':'Открыть сеть'}</button></div></div></div>
    <div class="c42Panel"><h3>Последние операции</h3>${ca.financeHistoryV42.slice(0,10).map(x=>`<div class="c42Log"><span>${utEsc(x.title)}</span><small>${x.delta>=0?'+':'−'}${money(Math.abs(x.delta))} · ${utEsc(x.date)}</small></div>`).join('')||'<p class="help sm">Операций пока нет. Финансовая история появится после матчей карьеры.</p>'}</div>`;
  }
  cbOpenModal('career',utxT('Карьера клуба'),`<div id="cbCareerV29"><div class="cbFeatureStat">Сезон ${ca.season||1} · ${utEsc((teamById(ca.clubId)||{}).name||ca.clubId)} · ${money(ca.budget)}</div>${careerNavV42(tab)}${body}<button class="mi" data-a="featureClose">Закрыть</button></div>`);
  if(typeof utxTranslateDOM==='function')utxTranslateDOM($('cbFeatureModal'));
}
const _careerV29RenderV42Base=careerV29Render;
careerV29Render=function(tab='overview'){
  if(['training','tactics','finance'].includes(tab))return careerV42RenderExtra(tab);
  const out=_careerV29RenderV42Base.apply(this,arguments);careerInjectNavV42();return out;
};
ACT.careerViewV29=function(d){const tab=String(d&&d.v||'overview');careerV29Render(CAREER_TABS_V42.some(x=>x[0]===tab)?tab:'overview');};
ACT.careerTrainV42=function(d){
  const ca=careerEnsureV29();if(!ca)return;
  const kind=String(d&&d.kind||''),id=String(d&&d.id||''),focus=String(d&&d.focus||'');
  if(!['roster','academy'].includes(kind)||!['spd','pow','def'].includes(focus)||!id)return;
  const maxSessions=ca.facilitiesV42.training?4:3,cost=ca.facilitiesV42.training?220:280;
  if(ca.trainingSessions>=maxSessions||ca.budget<cost){careerV29Render('training');return;}
  const list=kind==='academy'?ca.academy:ca.roster,p=list.find(x=>String(x.id)===id);if(!p)return;
  const cap=kind==='academy'?(Number(p.potential)||90):99;if((Number(p.rating)||0)>=cap){careerV29Render('training');return;}
  ca.budget-=cost;p.rating=Math.min(cap,(Number(p.rating)||60)+1);p[focus]=Math.min(5,Math.max(1,Number(p[focus])||1)+1);ca.trainingSessions++;
  const labels={spd:'Скорость',pow:'Удар',def:'Защита'};ca.trainingLog.unshift({name:String(p.name||'Игрок'),focus:labels[focus],cost,date:new Date().toLocaleDateString(utxLocale()),season:ca.season});ca.trainingLog=ca.trainingLog.slice(0,30);
  ca.financeTotalsV42.spent+=cost;ca.financeHistoryV42.unshift({title:'Тренировка: '+String(p.name||'Игрок'),delta:-cost,date:new Date().toLocaleDateString(utxLocale())});ca.financeHistoryV42=ca.financeHistoryV42.slice(0,50);
  settings.career=ca;save();careerV29Render('training');
};
ACT.careerTacticV42=function(d){const ca=careerEnsureV29(),v=String(d&&d.v||'');if(!ca||!['balanced','press','counter','possession','defensive'].includes(v))return;ca.tactic=v;save();careerV29Render('tactics');};
ACT.careerSponsorV42=function(d){const ca=careerEnsureV29(),o=CAREER_SPONSORS_V42.find(x=>x.id===String(d&&d.id||''));if(!ca||!o)return;if(ca.sponsor&&Number(ca.sponsor.matchesLeft)>0){nxToast('Сначала заверши активный договор');careerV29Render('finance');return;}ca.sponsor={id:o.id,name:o.name,matchesLeft:o.matches,pay:o.pay,perMatch:o.pay,bonus:o.bonus,completed:false,started:Date.now()};ca.sponsorHistoryV42.unshift({id:o.id,name:o.name,season:ca.season,started:Date.now()});save();careerV29Render('finance');};
ACT.careerFacilityV42=function(d){const ca=careerEnsureV29(),id=String(d&&d.v||'');if(!ca)return;const offers={training:{cost:1800,key:'training'},scouting:{cost:2400,key:'scouting'}};const o=offers[id];if(!o||ca.facilitiesV42[o.key]||ca.budget<o.cost)return;ca.budget-=o.cost;ca.facilitiesV42[o.key]=true;ca.financeTotalsV42.spent+=o.cost;ca.financeHistoryV42.unshift({title:id==='training'?'Построен тренировочный центр':'Открыта сеть скаутинга',delta:-o.cost,date:new Date().toLocaleDateString(utxLocale())});ca.financeHistoryV42=ca.financeHistoryV42.slice(0,50);save();careerV29Render('finance');};
// The scouting upgrade improves newly generated academy players, while preserving the existing academy action.
const _careerYouthCreateV42Base=ACT.careerYouthCreateV29;
ACT.careerYouthCreateV29=function(){const before=careerEnsureV29();const oldCount=before&&before.academy.length;_careerYouthCreateV42Base.apply(this,arguments);const ca=careerEnsureV29();if(ca&&ca.facilitiesV42.scouting&&ca.academy.length>(oldCount||0)){const p=ca.academy[ca.academy.length-1];p.rating=Math.min(p.potential,Number(p.rating||55)+2);p.potential=Math.min(95,Number(p.potential||75)+3);save();careerV29Render('academy');}};
// Career league matches earn gate receipts and can progress one sponsor agreement once per match.
const _onMatchEndV42Base=onMatchEnd;
onMatchEnd=function(res){
  try{
    const cfg=res&&res.cfg,sc=res&&res.score,ca=careerEnsureV29();
    if(ca&&cfg&&cfg.comp&&cfg.tA&&cfg.tA.id===ca.clubId&&Array.isArray(sc)&&sc.length>=2){
      const key=[ca.season,Number(ca.seasonMatches)||0,Math.max(0,Number(sc[0])||0),Math.max(0,Number(sc[1])||0),String(cfg.tA.id)].join('|');
      if(!ca.financeProcessedV42.includes(key)){
        ca.financeProcessedV42.push(key);ca.financeProcessedV42=ca.financeProcessedV42.slice(-80);
        const own=Math.max(0,Number(sc[0])||0),opp=Math.max(0,Number(sc[1])||0);
        const gate=260+(own>opp?200:own===opp?80:0)+(opp===0?80:0),wages=Math.min(Math.max(0,Number(ca.budget)||0),Math.max(0,(ca.roster||[]).length)*20);
        let sponsorPay=0;
        if(ca.sponsor&&Number(ca.sponsor.matchesLeft)>0){sponsorPay=Math.max(0,Number(ca.sponsor.perMatch)||0);ca.sponsor.matchesLeft=Math.max(0,Number(ca.sponsor.matchesLeft)-1);if(ca.sponsor.matchesLeft===0&&!ca.sponsor.completed){sponsorPay+=Math.max(0,Number(ca.sponsor.bonus)||0);ca.sponsor.completed=true;ca.sponsor.completedAt=Date.now();}}
        const delta=gate+sponsorPay-wages;ca.budget=Math.max(0,(Number(ca.budget)||0)+delta);ca.financeTotalsV42.earned+=gate;ca.financeTotalsV42.spent+=wages;ca.financeTotalsV42.sponsor+=sponsorPay;
        ca.financeHistoryV42.unshift({title:'Матч лиги: '+own+' : '+opp,delta,date:new Date().toLocaleDateString(utxLocale())});ca.financeHistoryV42=ca.financeHistoryV42.slice(0,50);save();
      }
    }
  }catch(e){}
  return _onMatchEndV42Base.apply(this,arguments);
};
// Apply the selected career tactic as a small match-only modifier; never mutate the shared team definition.
const _startMatchV42Base=startMatch;
startMatch=function(cfg){
  let next=cfg;
  try{
    const ca=careerEnsureV29();
    if(ca&&cfg&&cfg.comp&&cfg.tA&&cfg.tA.id===ca.clubId){
      const delta={balanced:[0,0,0],press:[1,0,-1],counter:[1,1,-1],possession:[0,-1,1],defensive:[-1,0,1]}[ca.tactic]||[0,0,0];
      next=Object.assign({},cfg,{tA:Object.assign({},cfg.tA,{spd:clamp((Number(cfg.tA.spd)||3)+delta[0],1,5),pow:clamp((Number(cfg.tA.pow)||3)+delta[1],1,5),def:clamp((Number(cfg.tA.def)||3)+delta[2],1,5)})});
    }
  }catch(e){}
  return _startMatchV42Base.call(this,next);
};
/* ================= end Cowball v42 enhancement ================= */

// ================= Cowball v45: performance lab, diagnostics, VAR overlay =================
// APIs are deliberately read-only where possible so the external UI does not bypass game systems.
window.CowballV45 = {
  version: '45.0',
  getMetrics() {
    const r = renderer && renderer.info && renderer.info.render ? renderer.info.render : {};
    const m = renderer && renderer.info && renderer.info.memory ? renderer.info.memory : {};
    return {
      fps: Math.round(Number(fpsAvg) || 0), frameMs: +(1000 / Math.max(1, Number(fpsAvg) || 1)).toFixed(1),
      calls: Number(r.calls) || 0, triangles: Number(r.triangles) || 0, points: Number(r.points) || 0,
      geometries: Number(m.geometries) || 0, textures: Number(m.textures) || 0,
      cows: cows.length, spectators: spectators.length, sceneObjects: scene.children.length,
      quality: settings.gfx, renderScale: Math.round(renderScale * 100), pixelRatio: +(renderer.getPixelRatio ? renderer.getPixelRatio() : 1).toFixed(2),
      state, screen
    };
  },
  getSettings() { return { gfx:settings.gfx, res:settings.res, dynamicRes:!!settings.dynamicRes, powerSave:!!settings.powerSave, shadowQ:settings.shadowQ, grassDetail:!!settings.grassDetail, reflections:!!settings.reflections, shaderFXV36:!!settings.shaderFXV36, weather:settings.weather, tod:settings.tod, stadium:settings.stadium, fpsCap:settings.fpsCap, showFps:!!settings.showFps }; },
  setGraphicsPreset(preset) {
    const p = String(preset || 'ultra');
    if (!['ultra','high','med','low'].includes(p)) return false;
    settings.gfx = p; settings.powerSave = p === 'low'; settings.res = 100;
    settings.dynamicRes = true;
    if (p === 'ultra') { settings.shadowQ = 'high'; settings.grassDetail = true; settings.reflections = true; settings.shaderFXV36 = true; }
    else if (p === 'high') { settings.shadowQ = 'medium'; settings.grassDetail = true; settings.reflections = true; settings.shaderFXV36 = true; }
    else if (p === 'med') { settings.shadowQ = 'low'; settings.grassDetail = true; settings.reflections = false; settings.shaderFXV36 = true; }
    else { settings.shadowQ = 'low'; settings.grassDetail = false; settings.reflections = false; settings.shaderFXV36 = false; }
    renderScale = 1; applyGfxQuality(); applyRes(); save();
    try { renderSettings(); } catch (_) {}
    return true;
  },
  setAdaptive(enabled) { settings.dynamicRes = !!enabled; if (!enabled) { renderScale = 1; applyRes(); lowT = highT = 0; } save(); return settings.dynamicRes; },
  setWeather(value) { if (!['auto','clear','rain','snow','fog'].includes(value)) return false; settings.weather=value; applyEnv(settings.tod,value); save(); return true; },
  setTimeOfDay(value) { if (!['auto','day','dusk','night'].includes(value)) return false; settings.tod=value; applyEnv(value,settings.weather); save(); return true; },
  setEffects(key, value) { const allowed={grassDetail:'grassDetail',reflections:'reflections',shaderFXV36:'shaderFXV36',showFps:'showFps',crowdAnimate:'crowdAnimate',rulesEnabled:'rulesEnabled',cameraShake:'cameraShake',ballTrail:'ballTrail'}; if(!allowed[key])return false;settings[key]=!!value;if(key==='grassDetail')patchPlane.visible=!!value&&gfxLevel()!=='low';if(key==='reflections')applyEnv(curEnv.tod,curEnv.weather);if(key==='showFps'){const el=$('fps');if(el)el.classList.toggle('hide',!value);}if(key==='shaderFXV36'&&typeof applyVisualFilters==='function')applyVisualFilters();save();return true; },
  getLocalProfile() { const p=settings.netProfileV41&&typeof settings.netProfileV41==='object'?settings.netProfileV41:{}; return { id:String(p.id||''), nickname:String(settings.netNick||settings.playerProfileV21.surname||'Игрок').slice(0,24), wins:Number(p.wins)||Number(settings.wins)||0, played:Number(p.games)||Number(settings.played)||0, goals:Number(p.goalsFor)||Number(settings.goals)||0, losses:Number(p.losses)||0, draws:Number(p.draws)||0, trophies:Array.isArray(settings.trophies)?settings.trophies.slice(0,100):[], rating:Number.isFinite(Number(p.rating))?Number(p.rating):1000, xp:Number(p.xp)||0, language:settings.lang||'ru' }; },
  applyCloudProfile(raw) { if(!raw||typeof raw!=='object')return false; const q=raw.profile&&typeof raw.profile==='object'?raw.profile:raw; const p=Object.assign({},settings.netProfileV41||{}); const num=(v,d=0)=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):d; p.id=String(q.id||p.id||'').slice(0,90);p.rating=clamp(num(q.rating,p.rating||1000),0,4000);['games','wins','losses','draws','xp'].forEach(k=>p[k]=num(q[k],num(p[k],0)));p.goalsFor=num(q.goals,num(q.goalsFor,num(p.goalsFor,0)));if(q.name||q.nickname)settings.netNick=String(q.name||q.nickname).replace(/[\u0000-\u001f]/g,'').slice(0,14);settings.netProfileV41=p;settings.wins=Math.max(Number(settings.wins)||0,p.wins);settings.played=Math.max(Number(settings.played)||0,p.games);settings.goals=Math.max(Number(settings.goals)||0,p.goalsFor);save();return true; },
  getLocalFriends() { return Array.isArray(settings.netFriendsV41)?settings.netFriendsV41.filter(f=>f&&typeof f==='object').slice(0,200).map(f=>({id:String(f.id||''),name:String(f.name||'Игрок').slice(0,24)})):[]; },
  mergeCloudFriends(raw) { if(!Array.isArray(raw))return false; const list=Array.isArray(settings.netFriendsV41)?settings.netFriendsV41.slice():[]; raw.slice(0,200).forEach(f=>{if(!f||typeof f!=='object'||!String(f.id||''))return;const id=String(f.id).slice(0,90),name=String(f.name||'Игрок').replace(/[\u0000-\u001f]/g,'').slice(0,24);let old=list.find(x=>x&&String(x.id)===id);if(!old){old={id,name,rating:1000,games:0,wins:0,losses:0,draws:0,lastSeen:Date.now()};list.push(old);}old.name=name;old.lastSeen=Date.now();});settings.netFriendsV41=list.slice(-200);save();return true; },
  exportSave() { const data={app:'Cowball',version:'45.0',exportedAt:new Date().toISOString(),settings}; const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='cowball-save-v45.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);return true; },
  reviewVAR(type) { if(!['offside','foul','goal'].includes(type))return false; return showVARReviewV45(type); }
};
function showVARReviewV45(type) {
  let el=document.getElementById('cbV45Var');
  if(!el){el=document.createElement('div');el.id='cbV45Var';el.className='cbV45Var';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}
  const text=type==='offside'?'Проверка офсайда':type==='goal'?'Проверка гола':'Проверка нарушения';
  el.innerHTML='<span class="cbV45VarTag">VAR · COWBALL</span><b>'+text+'</b><small>Видеоповтор эпизода · учебная игровая симуляция</small><div class="cbV45VarLine"><i></i></div>';
  el.classList.add('on');clearTimeout(showVARReviewV45.timer);showVARReviewV45.timer=setTimeout(()=>el.classList.remove('on'),1450);return true;
}
const _setRestartStateV45Base = setRestartStateV17;
setRestartStateV17 = function(type,team,x,y,reason,offender) {
  if(type==='offside'||type==='foul') showVARReviewV45(type);
  return _setRestartStateV45Base.apply(this,arguments);
};
// ================= end Cowball v45 upgrade hooks =================

updatePadStatusV33();

init().then(() => {
  applyShadowPolicyV24();
  if (window.__cowballRecoveredV31) setTimeout(utxShowRecoveryNoticeV31, 450);
});
}
window.addEventListener('error', function (e) {
  var sp = document.getElementById('splash');
  if (!sp || !sp.parentNode) return;
  sp.style.display = 'flex';
  sp.innerHTML = 'Ошибка запуска Cowball.<br><small style="font-size:14px;font-weight:600;max-width:90vw;text-align:center;line-height:1.5">' + String(e.message || 'Неизвестная ошибка').replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}) + '<br>Закройте игру и откройте HTML ещё раз.</small>';
});
window.__loadThree(function (ok) {
  var sp = document.getElementById('splash');
  if (!ok) {
    if (sp) sp.innerHTML = 'Не удалось загрузить 3D-движок Three.js.<br><small style="font-size:15px;font-weight:600;max-width:90vw;text-align:center;line-height:1.5">Нужен интернет для первого запуска или файл lib/three.min.js рядом с HTML. Проверьте соединение и откройте файл снова.</small>';
    return;
  }
  try { boot(); }
  catch (err) {
    console.error('Cowball boot error:', err);
    if (sp) { sp.style.display = 'flex'; sp.innerHTML = 'Ошибка запуска Cowball.<br><small style="font-size:14px;font-weight:600;max-width:90vw;text-align:center;line-height:1.5">' + String(err && err.message || err).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}) + '</small>'; }
  }
});
