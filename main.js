import { startMinigame } from "./minigames.js";

const SFX = (() => {
  let ctx = null;
  let master = null;
  let unlocked = false;

  function ensure(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35; 
      master.connect(ctx.destination);
    }
    return ctx;
  }

  async function unlock(){
    ensure();
    if(ctx.state === "suspended") await ctx.resume();
    unlocked = true;


    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.00001, t + 0.02);
    o.frequency.setValueAtTime(220, t);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.03);
  }

  function playTone({freq=440, type="sine", dur=0.08, vol=0.12, detune=0, glideTo=null}){
    if(!unlocked) return;
    ensure();
    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = type;
    o.detune.value = detune;

    o.frequency.setValueAtTime(freq, t);
    if(glideTo!=null){
      o.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur);
    }

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);

    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function playNoise({dur=0.08, vol=0.08, hp=1200}){
    if(!unlocked) return;
    ensure();
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(master);

    src.start(t);
    src.stop(t + dur + 0.02);
  }

  const api = {
    unlock,

    tap(){ playTone({freq: 520, type:"sine", dur:0.04, vol:0.08}); },
    swipe(){ playTone({freq: 220, type:"triangle", dur:0.06, vol:0.08, glideTo: 330}); },

    discard(){
      playTone({freq: 180, type:"sawtooth", dur:0.07, vol:0.06, glideTo: 120});
      playNoise({dur:0.05, vol:0.03});
    },

    policy(){
      playTone({freq: 440, type:"square", dur:0.06, vol:0.09, glideTo: 660});
      playTone({freq: 880, type:"sine", dur:0.05, vol:0.06});
    },

    attack(){
      playNoise({dur:0.08, vol:0.06, hp:900});
      playTone({freq: 140, type:"square", dur:0.06, vol:0.08});
    },

    clearEvent(){
      playTone({freq: 660, type:"triangle", dur:0.06, vol:0.09});
      playTone({freq: 990, type:"sine", dur:0.06, vol:0.08});
    },

    levelUp(){
      playTone({freq: 523, type:"triangle", dur:0.08, vol:0.10, glideTo: 784});
      playTone({freq: 784, type:"triangle", dur:0.10, vol:0.10, glideTo: 1046});
      playTone({freq: 1046, type:"sine", dur:0.12, vol:0.09});
    },

    start(){ playTone({freq: 392, type:"sine", dur:0.08, vol:0.10, glideTo: 523}); },

    gameOver(){
      playTone({freq: 220, type:"sawtooth", dur:0.18, vol:0.10, glideTo: 110});
      playNoise({dur:0.12, vol:0.06});
    },

    miniGood(){
      playTone({freq: 659, type:"triangle", dur:0.06, vol:0.09});
      playTone({freq: 988, type:"sine", dur:0.08, vol:0.08});
    },

    miniBad(){
      playTone({freq: 196, type:"square", dur:0.10, vol:0.09, glideTo: 147});
    },
  };

  Object.defineProperty(api, "volume", {
    get(){ return master ? master.gain.value : 0.35; },
    set(v){ ensure(); master.gain.value = Math.max(0, Math.min(1, v)); }
  });

  return api;
})();
const state = {
  turns: 50,
  money: 100,
  moneyMax: 100,
  atk: 10,
  rep: 0,
  lv: 1,
  exp: 0,
    nextExp: 30,   
  toast: "",    
policyCostMult: 0.6,   
eventExpMult: 1.6,     


  busy: false,


deckTemplate: [


  // 🔴 Events (15)


  { kind:"event", title:"Aging Bridge Alert", desc:"Structural deterioration increases commuting risks.", hp:40, atk:7, exp:25, rep:10 },
  { kind:"event", title:"Pipeline Burst Water Outage", desc:"Water supply disruption sparks public dissatisfaction.", hp:35, atk:6, exp:22, rep:9 },
  { kind:"event", title:"Metro Delay Crisis", desc:"System malfunction paralyzes transportation.", hp:30, atk:6, exp:20, rep:8 },
  { kind:"event", title:"Community Fire Chain Incident", desc:"Electrical faults in old buildings raise safety concerns.", hp:45, atk:8, exp:28, rep:12 },
  { kind:"event", title:"Severe Flooding", desc:"Drainage failure causes widespread urban flooding.", hp:50, atk:9, exp:30, rep:14 },

  { kind:"event", title:"Air Pollution Red Alert", desc:"Deteriorating air quality forces school closures.", hp:45, atk:6, exp:22, rep:9 },
  { kind:"event", title:"Illegal Structure Collapse", desc:"Regulatory failure leads to public safety crisis.", hp:45, atk:8, exp:28, rep:13 },
  { kind:"event", title:"Illegal Waste Dumping", desc:"Environmental damage triggers public outrage.", hp:30, atk:5, exp:20, rep:8 },
  { kind:"event", title:"Bid Rigging Scandal", desc:"Transparency in public procurement questioned.", hp:40, atk:7, exp:26, rep:11 },
  { kind:"event", title:"Escalating Police-Civilian Conflict", desc:"Law enforcement disputes intensify social tension.", hp:50, atk:9, exp:30, rep:15 },

  { kind:"event", title:"Misinformation Spread", desc:"Rumors cause widespread panic.", hp:35, atk:5, exp:18, rep:7 },
  { kind:"event", title:"Cybersecurity Data Breach", desc:"Municipal data compromised by hackers.", hp:35, atk:8, exp:28, rep:12 },
  { kind:"event", title:"Social Welfare Allocation Controversy", desc:"Disputes over support for vulnerable groups spark protests.", hp:45, atk:6, exp:23, rep:9 },
  { kind:"event", title:"Public Works Delay", desc:"Budget overruns and slow progress frustrate citizens.", hp:40, atk:7, exp:25, rep:10 },
  { kind:"event", title:"Rising Nighttime Crime", desc:"Declining sense of safety in communities.", hp:60, atk:6, exp:20, rep:8 },


  // 🔵 Policies (16)


  { kind:"policy", title:"Critical Bridge Reinforcement Plan", desc:"Prioritize repairs for high-risk bridges.", costMoney:25, gainRep:10, gainExp:15 },
  { kind:"policy", title:"Smart Leak Detection System", desc:"Reduce risk of pipeline bursts.", costMoney:20, gainRep:8, gainExp:12 },
  { kind:"policy", title:"Increase Public Transit Frequency", desc:"Improve commuting efficiency.", costMoney:18, gainRep:7, gainExp:10 },
  { kind:"policy", title:"Old Building Electrical Upgrade Subsidy", desc:"Enhance residential safety standards.", costMoney:22, gainRep:9, gainExp:14 },
  { kind:"policy", title:"Rainwater Retention Initiative", desc:"Mitigate urban flooding risks.", costMoney:28, gainRep:12, gainExp:18 },

  { kind:"policy", title:"Low Emission Zone", desc:"Improve air quality.", costMoney:20, gainRep:8, gainExp:12 },
  { kind:"policy", title:"Waste Tracking System", desc:"Combat illegal dumping activities.", costMoney:15, gainRep:6, gainExp:9 },
  { kind:"policy", title:"Public Procurement Dashboard", desc:"Increase transparency in bidding processes.", costMoney:18, gainRep:9, gainExp:13 },
  { kind:"policy", title:"Conflict of Interest Disclosure Policy", desc:"Suppress corruption and misconduct.", costMoney:16, gainRep:8, gainExp:12 },
  { kind:"policy", title:"Community Dialogue Platform", desc:"Reduce social conflicts through engagement.", costMoney:12, costTurns:2, gainRep:10, gainExp:15 },

  { kind:"policy", title:"Enhanced Police Training Program", desc:"Improve law enforcement professionalism.", costMoney:18, gainRep:7, gainExp:11 },
  { kind:"policy", title:"Fact-Checking Partnership", desc:"Counter misinformation effectively.", costMoney:10, gainRep:6, gainExp:8 },
  { kind:"policy", title:"Cybersecurity Upgrade Project", desc:"Strengthen digital defense systems.", costMoney:24, gainRep:10, gainExp:16 },
  { kind:"policy", title:"Project Management Office", desc:"Reduce construction delays and cost overruns.", costMoney:20, gainRep:8, gainExp:12 },


  { kind:"policy", title:"Central Government Grant", desc:"Receive financial support from central authorities.", gainMoneyFraction:0.25, gainRep:5, gainExp:5 },
  { kind:"policy", title:"International Sustainable City Fund", desc:"Obtain international sustainability funding.", gainMoneyFraction:0.25, gainRep:6, gainExp:6 },

  // 🎮 Mini Games (9)


  { kind:"minigame", mini:"trash", title:"Waste Sorting Showdown", desc:"Test citizens' waste sorting accuracy." },
  { kind:"minigame", mini:"trash", title:"Waste Sorting Showdown", desc:"Test citizens' waste sorting accuracy." },
  { kind:"minigame", mini:"trash", title:"Waste Sorting Showdown", desc:"Test citizens' waste sorting accuracy." },

  { kind:"minigame", mini:"live", title:"City Live Q&A", desc:"Answer citizens' concerns." },
  { kind:"minigame", mini:"live", title:"City Live Q&A", desc:"Answer citizens' concerns." },
  { kind:"minigame", mini:"live", title:"City Live Q&A", desc:"Answer citizens' concerns." },

  { kind:"minigame", mini:"judge", title:"Civic Judgment", desc:"Pursue procedural justice." },
  { kind:"minigame", mini:"judge", title:"Civic Judgment", desc:"Pursue procedural justice." },
  { kind:"minigame", mini:"judge", title:"Civic Judgment", desc:"Pursue procedural justice." },

],


  piles: {
    infra: [],
    env: [],
    gov: [],
    safety: []
  },


  slots: [null, null, null, null],
};

const indexToPileKey = ["infra", "env", "gov", "safety"];

function $(id){ return document.getElementById(id); }

function renderTopbar(){
  $("turns").textContent = state.turns;
  $("money").textContent = state.money;
  $("moneyMax").textContent = state.moneyMax;
  $("atk").textContent = state.atk;
  $("rep").textContent = state.rep;
  $("lv").textContent = state.lv;
  $("exp").textContent = state.exp;


  const countLeft = (pileKey, slotIndex) => {
    const inPile = state.piles[pileKey]?.length ?? 0;
    const inSlot = state.slots[slotIndex] ? 1 : 0;
    return inPile + inSlot;
  };
const ne = $("nextExp"); if(ne) ne.textContent = state.nextExp;
  const a = $("deck-infra");  if(a) a.textContent = countLeft("infra", 0);
  const b = $("deck-env");    if(b) b.textContent = countLeft("env", 1);
  const c = $("deck-gov");    if(c) c.textContent = countLeft("gov", 2);
  const d = $("deck-safety"); if(d) d.textContent = countLeft("safety", 3);
}

function clampMoney(){
   state.money = Math.min(state.money, state.moneyMax);
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

function cloneCard(card){
  return JSON.parse(JSON.stringify(card));
}


function buildAndDealPiles(){
  const bigDeck = [];
  for(let i=0;i<40;i++){
    const base = state.deckTemplate[i % state.deckTemplate.length];
    const c = cloneCard(base);
    c.uid = `C${i}-${Date.now()}`;

    if(c.kind==="event" && c.maxHp==null) c.maxHp = c.hp;
    bigDeck.push(c);
  }

  shuffle(bigDeck);

  state.piles.infra  = bigDeck.splice(0,10);
  state.piles.env    = bigDeck.splice(0,10);
  state.piles.gov    = bigDeck.splice(0,10);
  state.piles.safety = bigDeck.splice(0,10);
}

function drawFromPile(pileKey){
  const pile = state.piles[pileKey];
  return (pile && pile.length) ? pile.shift() : null;
}

function refillSlot(index){
  if(state.slots[index]==null){
    const pileKey = indexToPileKey[index];
    const c = drawFromPile(pileKey);

    if(c && c.kind==="event" && c.maxHp==null) c.maxHp=c.hp;
    state.slots[index]=c;
  }
}

function refillAllSlots(){
  for(let i=0;i<4;i++) refillSlot(i);
}

function renderAll(){
  renderTopbar();
  for(let i=0;i<4;i++){
    showInSlot(i, state.slots[i]);
  }
}

function resetGameState(){
  state.turns = 50;
  state.money = 100;
  state.moneyMax = 100;
  state.atk = 10;
  state.rep = 0;
  state.lv = 1;
  state.exp = 0;
  state.nextExp = 30;
  state.busy = false;


  state.piles.infra = [];
  state.piles.env = [];
  state.piles.gov = [];
  state.piles.safety = [];
  state.slots = [null, null, null, null];
}


function showStartScreen(){
  const screen = $("screen");
  if(!screen) return;

  state.busy = true;
  $("screen-title").textContent = "City Under Pressure";
  $("screen-desc").textContent =
    "Maintain the city within 50 actions. Resolve events, implement policies, complete mini-games, and build reputation and experience.";

  $("screen-stats").innerHTML = `
    <div>Objective: Increase ⭐ Reputation as much as possible before actions run out.</div>
    <div style="margin-top:6px;">Controls: Swipe right to use / Swipe left to discard (Events attack on both sides).</div>
  `;

  const primary = $("btn-primary");
  const secondary = $("btn-secondary");
  primary.textContent = "Start Game";
  secondary.style.display = "none";

  primary.onclick = () => {
    SFX.unlock();  
    SFX.start();   
    startGame();
  };

  screen.style.display = "flex";
  Object.assign(screen.style, {
    position:"fixed",
    inset:"0",
    background:"rgba(0,0,0,.55)",
    zIndex:"99998",
    alignItems:"center",
    justifyContent:"center",
    padding:"16px"
  });

  const panel = screen.querySelector(".screen-panel");
  Object.assign(panel.style, {
    width:"min(520px, 100%)",
    background:"#fff",
    borderRadius:"18px",
    padding:"18px 16px",
    boxShadow:"0 12px 40px rgba(0,0,0,.28)",
    textAlign:"center",
    userSelect:"none",
  });


  screen.querySelectorAll("button").forEach(btn=>{
    Object.assign(btn.style, {
      padding:"10px 14px",
      borderRadius:"12px",
      border:"1px solid #ddd",
      background:"#f5f5f5",
      fontWeight:"800",
      cursor:"pointer",
    });
  });
}

function hideScreen(){
  const screen = $("screen");
  if(screen) screen.style.display = "none";
}

function startGame(){
  resetGameState();


  buildAndDealPiles();
  refillAllSlots();
  renderAll();

  state.busy = false; 
  hideScreen();
}

function showEndScreen(reasonText){
  const screen = $("screen");
  if(!screen) return;

  state.busy = true; 
  SFX.gameOver();

  $("screen-title").textContent = "Game Over";
  $("screen-desc").textContent = reasonText;

  $("screen-stats").innerHTML = `
    <div>⭐ Final Reputation: <b>${state.rep}</b></div>
    <div style="margin-top:6px;">📈 Level: Lv <b>${state.lv}</b> (EXP ${state.exp}/${state.nextExp})</div>
    <div style="margin-top:6px;">💰 Funds: ${state.money}/${state.moneyMax} ｜ 🔁 Actions: ${state.turns}</div>
  `;

  const primary = $("btn-primary");
  const secondary = $("btn-secondary");
  primary.textContent = "Play Again";
  secondary.textContent = "Back to Title";
  secondary.style.display = "inline-block";

  primary.onclick = () => startGame();
  secondary.onclick = () => showStartScreen();

  screen.style.display = "flex";
}

function showInSlot(slotIndex, card){
  const el = $(`card-${slotIndex}`); 
  if(!el) return;

  const shell = el.closest(".card-shell");
  shell.classList.remove("event","policy","minigame");
  if(card){
    shell.classList.add(card.kind);
  }

  const cardBox = el.closest(".card"); 
  if(!cardBox) return;

  const leftLabel = $(`left-${slotIndex}`);
  const rightLabel = $(`right-${slotIndex}`);

 
  cardBox.classList.remove("event","policy","minigame");

  if(!card){
    el.innerHTML = "(No cards left)";
    if(leftLabel) leftLabel.textContent = "";
    if(rightLabel) rightLabel.textContent = "";
    return;
  }

 
  cardBox.classList.add(card.kind);

 
  if(leftLabel && rightLabel){
    if(card.kind==="event"){
      leftLabel.textContent = "Resolve";
      rightLabel.textContent = "Resolve";
    } else {
      rightLabel.textContent = "Discard";
      if(card.kind==="policy") leftLabel.textContent = "Implement";
      else if(card.kind==="minigame") leftLabel.textContent = "Start";
    }
  }


  if(card.kind==="policy"){
    const shownCost = Math.ceil((card.costMoney ?? 0) * (state.policyCostMult ?? 1));
    el.innerHTML = `
      <div style="font-weight:800;">🔵 Policy</div>
      <div style="font-weight:700;margin-top:4px;">${card.title}</div>
      <div style="font-size:13px;margin-top:6px;line-height:1.35;">
        ${(card.costMoney!=null)?`-Funds ${shownCost}<br>`:""}
        ${card.costTurns?`-Actions ${card.costTurns}<br>`:""}
        ${card.gainMoneyFraction?`+Funds ${Math.floor(state.moneyMax * card.gainMoneyFraction)}<br>`:""}
        ${card.gainRep?`+Reputation ${card.gainRep}<br>`:""}
        ${card.gainExp?`+EXP ${card.gainExp}`:""}
      </div>
    `;
    return;
  }


  if(card.kind==="minigame"){
    el.innerHTML = `
      <div style="font-weight:800;">🎮 Mini-Game</div>
      <div style="font-weight:700;margin-top:4px;">${card.title}</div>
      <div style="font-size:13px;margin-top:6px;line-height:1.35;color:#444;">
        ${card.desc ?? ""}<br>
        <span style="opacity:.8;">(Costs 1 action ｜ Results affect reputation/funds)</span>
      </div>
    `;
    return;
  }

  if(card.maxHp==null) card.maxHp = card.hp;
  const hpPct = Math.max(0, Math.min(1, card.hp / card.maxHp));
  const shownExp = Math.floor((card.exp ?? 0) * (state.eventExpMult ?? 1));

  el.innerHTML = `
    <div style="font-weight:800;">🔴 Event</div>
    <div style="font-weight:700;margin-top:4px;">${card.title}</div>
    <div style="margin-top:8px;height:10px;background:#eee;border-radius:999px;overflow:hidden;">
      <div style="height:100%;width:${hpPct*100}%;background:#111;"></div>
    </div>
    <div style="font-size:13px;margin-top:6px;line-height:1.35;">
      HP ${card.hp}/${card.maxHp}<br>
      Required Funds ${card.atk}<br>
      Rewards +EXP ${shownExp} / +Reputation ${card.rep}
    </div>
  `;
}

function consumeTurn(n=1){
  state.turns=Math.max(0,state.turns-n);
}
function calcNextExp(lv){

  return 30 + (lv - 1) * 15;
}

function tryLevelUp(){
  let leveled = false;

  while(state.exp >= state.nextExp){
    state.exp -= state.nextExp;
    state.lv += 1;
    state.nextExp = calcNextExp(state.lv);


    state.atk += 5;
    state.moneyMax += 20;
    state.money += 20;
    clampMoney();

    leveled = true;
  }

  if(leveled){
    SFX.levelUp();
    renderAll();
  }
}
function isAllCardsGone(){
  const pilesEmpty =
    state.piles.infra.length === 0 &&
    state.piles.env.length === 0 &&
    state.piles.gov.length === 0 &&
    state.piles.safety.length === 0;

  const slotsEmpty = state.slots.every(x => x == null);

  return pilesEmpty && slotsEmpty;
}
function gameOverCheck(){
  if(state.money<=0){
    state.money=0;
    renderTopbar();
    showEndScreen("Funds depleted. The city's operations have collapsed.");
    return true;
  }

  if(state.turns<=0){
    renderTopbar();
    showEndScreen("No actions remaining. Your term in office has ended.");
    return true;
  }

  if(isAllCardsGone()){
    renderTopbar();
    showEndScreen("All cards have been exhausted. Term results finalized.");
    return true;
  }

  return false;
}
function attackEvent(slotIndex){
  const idx = slotIndex;
  const card = state.slots[idx];
  if(!card) return;
  if(card.kind!=="event") return;

  if(state.turns<=0) return;
  consumeTurn(1);

  SFX.attack(); 

  card.hp -= state.atk;
  state.money -= card.atk;
  clampMoney();

  if(card.hp<=0){
    SFX.clearEvent();

    const baseExp = (card.exp ?? 0);
    state.exp += Math.floor(baseExp * (state.eventExpMult ?? 1));
    state.rep += (card.rep ?? 0);

    tryLevelUp();
    state.slots[idx] = null;
    refillSlot(idx);
  }

  renderAll();
  gameOverCheck();
}

function discardCard(slotIndex){
  const card = state.slots[slotIndex];
  if(!card) return;

  SFX.discard(); 

  state.slots[slotIndex] = null;
  refillSlot(slotIndex);

  renderAll();
  gameOverCheck();
}
function handlePolicy(slotIndex){
  const idx = slotIndex;
  const card = state.slots[idx];
  if(!card || card.kind!=="policy") return;

  const costTurns = card.costTurns ?? 1;


  const baseMoney = card.costMoney ?? 0;
  const costMoney = Math.ceil(baseMoney * (state.policyCostMult ?? 1));

  if(state.turns < costTurns) return;
  SFX.policy();
 
  state.turns -= costTurns;
  state.money -= costMoney;

  
  if(card.gainMoneyFraction){
    state.money += Math.floor(state.moneyMax * card.gainMoneyFraction);
  }

  clampMoney();


  state.rep += (card.gainRep ?? 0);
  state.exp += (card.gainExp ?? 0);
  tryLevelUp();


  state.slots[idx] = null;
  refillSlot(idx);

  renderAll();
  gameOverCheck();
}

function startMiniGameFromSlot(slotIndex){
  const idx = slotIndex;
  const card = state.slots[idx];
  if(!card || card.kind!=="minigame") return;

  if(state.turns<=0) return;
  if(state.busy) return;
  state.busy = true;

  startMinigame(card.mini, (result)=>{
  consumeTurn(1);
  state.rep += (result?.repDelta ?? 0);
  state.money += (result?.moneyDelta ?? 0);
  clampMoney();


  const score = (result?.repDelta ?? 0) + (result?.moneyDelta ?? 0);
  if(score >= 0) SFX.miniGood();
  else SFX.miniBad();

  state.slots[idx] = null;
  refillSlot(idx);

  state.busy = false;

  renderAll();
  gameOverCheck();
});
}


function enableHalfSwipe(){
  document.querySelectorAll(".card-shell").forEach(shell=>{
    const cardEl = shell.querySelector(".card");
    const slotIndex = Number(shell.dataset.slot);

    let startX=0, dx=0, dragging=false;
    const THRESHOLD=80;

    function reset(){
      dragging=false;
      cardEl.style.transition="transform .18s ease";
      cardEl.style.transform="translateX(0)";
      dx=0;
    }

shell.addEventListener("pointerdown", async e=>{

  SFX.unlock();
  if(state.busy) return;

  SFX.tap(); 

  dragging=true;
  startX=e.clientX;
  cardEl.style.transition="none";
  shell.setPointerCapture(e.pointerId);
});

    shell.addEventListener("pointermove", e=>{
      if(!dragging) return;
      dx = e.clientX - startX;
      const half = shell.clientWidth/2;
      dx = Math.max(-half, Math.min(half, dx));
      cardEl.style.transform = `translateX(${dx}px)`;
    });

shell.addEventListener("pointerup", ()=>{
  if(!dragging) return;
  cardEl.style.transition="transform .18s ease";

  const card = state.slots[slotIndex];

  if(Math.abs(dx) > THRESHOLD){
    SFX.swipe(); 
  }

  if(dx > THRESHOLD){
    if(card?.kind==="policy") handlePolicy(slotIndex);
    else if(card?.kind==="minigame") startMiniGameFromSlot(slotIndex);
    else if(card?.kind==="event") attackEvent(slotIndex);
  }
  else if(dx < -THRESHOLD){
    if(card?.kind==="event"){
      attackEvent(slotIndex);
    } else {
      discardCard(slotIndex);
    }
  }

  reset();
});

    shell.addEventListener("pointercancel", reset);
  });
}


enableHalfSwipe();   
showStartScreen();   