export function startMinigame(type, done){
  if(type === "trash") return startTrash(done);
  if(type === "live")  return startLive(done);
  if(type === "judge") return startJudge(done);
}

// Trash Sorting Showdown 

function startTrash(done){
  const QUESTIONS_PER_RUN = 5; 
  const questions = generateTrashSet(QUESTIONS_PER_RUN);
  let current = 0;
  let correctCount = 0;

  const old = document.querySelector(".mini-overlay");
  if(old) old.remove();

  const overlay = document.createElement("div");
  overlay.className = "mini-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,.45)",
    zIndex: "99999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  });

  overlay.innerHTML = `
    <div class="mini-panel">
      <h2 style="margin:0;">Trash Sorting Showdown</h2>
      <div id="trash-progress" style="font-size:12px;opacity:.75;margin-top:6px;"></div>

      <div id="trash-question" style="margin-top:14px;font-size:18px;font-weight:800;"></div>
      <div id="trash-hint" style="margin-top:6px;font-size:12px;opacity:.7;">Tap a category to submit (auto-advances).</div>

      <div id="trash-choices" style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;"></div>

      <div id="trash-toast" style="margin-top:12px;font-size:13px;opacity:.9;"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector(".mini-panel");
  Object.assign(panel.style, {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    width: "min(520px, 100%)",
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    userSelect: "none",
  });

  const progressEl = overlay.querySelector("#trash-progress");
  const qEl = overlay.querySelector("#trash-question");
  const choicesEl = overlay.querySelector("#trash-choices");
  const toastEl = overlay.querySelector("#trash-toast");

  let locked = false;

  function labelOf(type){
    if(type==="general") return "General Waste";
    if(type==="recycle") return "Recycling";
    if(type==="food") return "Food Waste";
    return String(type);
  }

  function setButtonsEnabled(enabled){
    choicesEl.querySelectorAll("button").forEach(b=>{
      b.disabled = !enabled;
      b.style.opacity = enabled ? "1" : ".65";
      b.style.cursor = enabled ? "pointer" : "default";
    });
  }

  function renderQuestion(){
    const q = questions[current];
    locked = false;

    progressEl.textContent = `Question ${current + 1} / ${questions.length}`;
    qEl.textContent = `"${q.name}" belongs to which category?`;
    toastEl.textContent = "";

    choicesEl.innerHTML = "";
    const options = [
      { label: "General",   value: "general" },
      { label: "Recycling", value: "recycle" },
      { label: "Food Waste", value: "food" },
    ];

    options.forEach(opt=>{
      const btn = document.createElement("button");
      btn.textContent = opt.label;

      Object.assign(btn.style, {
        padding: "10px 12px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        cursor: "pointer",
        background: "#f5f5f5",
        fontWeight: "700",
      });

      btn.addEventListener("click", ()=>{
        if(locked) return;
        locked = true;

        choicesEl.querySelectorAll("button").forEach(b=> b.style.background="#f5f5f5");
        btn.style.background = "#ddd";

        const isCorrect = (opt.value === q.type);
        if(isCorrect) correctCount++;

        toastEl.textContent = isCorrect ? "✅ Correct" : `❌ Wrong (Correct: ${labelOf(q.type)})`;

        setButtonsEnabled(false);

        setTimeout(()=>{
          current++;
          if(current >= questions.length){
            finish();
          }else{
            renderQuestion();
          }
        }, 450);
      });

      choicesEl.appendChild(btn);
    });
  }

  function finish(){
    const result = calculateTrashResult(correctCount, questions.length);

    progressEl.textContent = `Completed! ${correctCount} / ${questions.length} correct`;
    qEl.textContent = `You got ${correctCount} correct`;
    toastEl.textContent = `Result: Reputation ${result.repDelta >= 0 ? "+" : ""}${result.repDelta} ｜ Funds ${result.moneyDelta >= 0 ? "+" : ""}${result.moneyDelta}`;

    setTimeout(()=>{
      overlay.remove();
      done(result);
    }, 650);
  }

  renderQuestion();
}
function calculateTrashResult(correct, total){
  const ratio = total ? correct / total : 0;

  if(ratio === 1) return { repDelta: 30, moneyDelta: 5 };
  if(ratio >= 0.8) return { repDelta: 24, moneyDelta: 0 };
  if(ratio >= 0.6) return { repDelta: 15, moneyDelta: 0 };
  if(ratio >= 0.4) return { repDelta: 6,  moneyDelta: -5 };
  return { repDelta: 0,  moneyDelta: -10 };
}
function generateTrashSet(n=5){
  const pool = [
    // Recycling
    { name:"PET Bottle", type:"recycle" },
    { name:"Aluminum Can", type:"recycle" },
    { name:"Glass Bottle", type:"recycle" },
    { name:"Newspaper", type:"recycle" },
    { name:"Cardboard Box", type:"recycle" },
    { name:"Milk Carton (rinsed)", type:"recycle" },
    { name:"Clean Plastic Container", type:"recycle" },
    { name:"Metal Lid", type:"recycle" },
    { name:"Battery", type:"recycle" },
    { name:"Old Phone", type:"recycle" },
    { name:"Power Bank", type:"recycle" },

    // Food waste
    { name:"Rice Leftovers", type:"food" },
    { name:"Vegetable Peels", type:"food" },
    { name:"Fruit Scraps", type:"food" },
    { name:"Chicken Bones", type:"food" },
    { name:"Fish Bones", type:"food" },
    { name:"Eggshells", type:"food" },
    { name:"Tea Leaves", type:"food" },
    { name:"Coffee Grounds", type:"food" },

    // General waste
    { name:"Used Tissue", type:"general" },
    { name:"Greasy Paper Box", type:"general" },
    { name:"Disposable Chopsticks", type:"general" },
    { name:"Plastic Bag", type:"general" },
    { name:"Dirty Plastic Film", type:"general" },
    { name:"Wet Wipes", type:"general" },
    { name:"Used Mask", type:"general" },
    { name:"Broken Ceramic", type:"general" },
    { name:"Cigarette Butt", type:"general" },
  ];

  shuffle(pool);
  return pool.slice(0, Math.min(n, pool.length));
}


// City Live Q&A 

function startLive(done){
  const pool = [
    {
      q:"Citizens complain about potholes. How do you respond?",
      options:[
        {text:"Investigate immediately and publish a repair timeline.", score:2, toast:"✅ Clear and effective"},
        {text:"Ask for patience—we’ll try our best.", score:1, toast:"⚖️ Vague, low detail"},
        {text:"That’s not my responsibility.", score:0, toast:"❌ Public backlash"},
      ]
    },
    {
      q:"A reporter questions budget transparency.",
      options:[
        {text:"Publish itemized spending and explain the process.", score:2, toast:"✅ Transparency bonus"},
        {text:"We’ll review it internally.", score:1, toast:"⚖️ Too unclear"},
        {text:"No comment.", score:0, toast:"❌ Looks suspicious"},
      ]
    },
    {
      q:"Waste sorting participation is low.",
      options:[
        {text:"Add incentives and public education campaigns.", score:2, toast:"✅ Targets the root cause"},
        {text:"Let’s observe for a while.", score:1, toast:"⚖️ Too passive"},
        {text:"Just increase penalties.", score:0, toast:"❌ Likely backlash"},
      ]
    },
    {
      q:"A subway delay goes viral. What’s your first move?",
      options:[
        {text:"Acknowledge, share cause + ETA, and provide alternatives.", score:2, toast:"✅ Calms the situation"},
        {text:"Promise it won’t happen again.", score:1, toast:"⚖️ Sounds hollow"},
        {text:"Ignore it; it’ll pass.", score:0, toast:"❌ Anger escalates"},
      ]
    },
    {
      q:"A major water outage hits several districts.",
      options:[
        {text:"Deploy emergency water points and publish repair updates.", score:2, toast:"✅ Practical and reassuring"},
        {text:"Apologize and ask residents to wait.", score:1, toast:"⚖️ Not actionable"},
        {text:"Downplay the severity.", score:0, toast:"❌ Trust collapses"},
      ]
    },
    {
      q:"A procurement scandal trends online.",
      options:[
        {text:"Open an independent audit and publish findings.", score:2, toast:"✅ Credibility restored"},
        {text:"Say it’s under investigation—no details.", score:1, toast:"⚖️ Not enough"},
        {text:"Attack the critics.", score:0, toast:"❌ Crisis worsens"},
      ]
    },
    {
      q:"A heatwave strains the power grid. What do you announce?",
      options:[
        {text:"Conservation guidance + support for vulnerable groups.", score:2, toast:"✅ Responsible leadership"},
        {text:"Ask people to stay calm.", score:1, toast:"⚖️ Too generic"},
        {text:"Blame someone publicly.", score:0, toast:"❌ Political drama"},
      ]
    },
    {
      q:"A citizen confronts you live with harsh accusations.",
      options:[
        {text:"Listen, restate concerns, and offer a concrete next step.", score:2, toast:"✅ De-escalation win"},
        {text:"Defend yourself aggressively.", score:1, toast:"⚖️ Risky"},
        {text:"Cut the stream.", score:0, toast:"❌ Looks guilty"},
      ]
    },
  ];

  shuffle(pool);
  const questions = pool.slice(0, 3); 

  runChoiceMiniGame({
    title: "City Live Q&A",
    hint: "Tap an answer (auto-advances).",
    questions,
    settle: (totalScore, n)=>{
      if(totalScore >= 2*n) return { repDelta: 32, moneyDelta: 5 };
      if(totalScore >= 1*n) return { repDelta: 18, moneyDelta: 0 };
      return { repDelta: 5,  moneyDelta: -8 };
    },
    done
  });
}


// Civic Judgment

function startJudge(done){
  const pool = [
    {
      q:"A factory pollutes the river but provides many jobs.",
      options:[
        {text:"Order an immediate shutdown.", score:1, toast:"⚖️ Just, but high impact"},
        {text:"Set a public deadline + fines + transparency.", score:2, toast:"✅ Balanced and accountable"},
        {text:"Do nothing.", score:0, toast:"❌ Trust collapses"},
      ]
    },
    {
      q:"Housing costs trigger large protests.",
      options:[
        {text:"Expand public housing and rent subsidies.", score:2, toast:"✅ Hits the core issue"},
        {text:"Let the market decide.", score:1, toast:"⚖️ Seen as cold"},
        {text:"Suppress the protest.", score:0, toast:"❌ Escalates conflict"},
      ]
    },
    {
      q:"Media exposes serious negligence by an official.",
      options:[
        {text:"Open an investigation and suspend duties temporarily.", score:2, toast:"✅ Fast damage control"},
        {text:"Handle it internally.", score:1, toast:"⚖️ Raises suspicion"},
        {text:"Deny everything.", score:0, toast:"❌ Explodes publicly"},
      ]
    },
    {
      q:"An illegal building is unsafe, but families live there.",
      options:[
        {text:"Immediate demolition.", score:1, toast:"⚖️ Safety first, but harsh"},
        {text:"Relocation support + phased enforcement.", score:2, toast:"✅ Humane and lawful"},
        {text:"Ignore it.", score:0, toast:"❌ Disaster waiting"},
      ]
    },
    {
      q:"Use-of-force footage circulates online.",
      options:[
        {text:"Launch an independent review and publish outcomes.", score:2, toast:"✅ Procedural justice"},
        {text:"Say ‘we’ll look into it.’", score:1, toast:"⚖️ Too vague"},
        {text:"Label critics as troublemakers.", score:0, toast:"❌ Polarizes society"},
      ]
    },
    {
      q:"A contractor repeatedly misses deadlines on a public project.",
      options:[
        {text:"Terminate the contract immediately.", score:1, toast:"⚖️ Strong, but risky"},
        {text:"Enforce penalties + add oversight + reset milestones.", score:2, toast:"✅ Controlled and fair"},
        {text:"Let it slide to avoid conflict.", score:0, toast:"❌ Cost overruns grow"},
      ]
    },
    {
      q:"A surveillance proposal promises lower crime.",
      options:[
        {text:"Approve without restrictions.", score:0, toast:"❌ Privacy backlash"},
        {text:"Pilot with safeguards + transparency + audits.", score:2, toast:"✅ Balanced approach"},
        {text:"Reject outright.", score:1, toast:"⚖️ Safe, but may miss benefits"},
      ]
    },
    {
      q:"A major rally needs crowd control and free speech protections.",
      options:[
        {text:"Ban gatherings preemptively.", score:0, toast:"❌ Authoritarian signal"},
        {text:"Designate zones + clear rules + trained officers.", score:2, toast:"✅ Rights + order"},
        {text:"Do nothing; hope it’s fine.", score:1, toast:"⚖️ Risk of chaos"},
      ]
    },
  ];

  shuffle(pool);
  const questions = pool.slice(0, 3); 

  runChoiceMiniGame({
    title: "Civic Judgment",
    hint: "Tap a ruling (auto-advances).",
    questions,
    settle: (totalScore, n)=>{
      if(totalScore >= 2*n) return { repDelta: 30, moneyDelta: 3 };
      if(totalScore >= 1*n) return { repDelta: 16, moneyDelta: 0 };
      return { repDelta: 5,  moneyDelta: -8 };
    },
    done
  });
}

// Shared 

function runChoiceMiniGame({ title, hint, questions, settle, done }){
  let current = 0;
  let totalScore = 0;
  let locked = false;


  const old = document.querySelector(".mini-overlay");
  if(old) old.remove();

  const overlay = document.createElement("div");
  overlay.className = "mini-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,.45)",
    zIndex: "99999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  });

  overlay.innerHTML = `
    <div class="mini-panel">
      <h2 style="margin:0;">${title}</h2>
      <div id="mini-progress" style="font-size:12px;opacity:.75;margin-top:6px;"></div>
      <div id="mini-hint" style="margin-top:6px;font-size:12px;opacity:.7;">${hint ?? ""}</div>

      <div id="mini-q" style="margin-top:14px;font-size:18px;font-weight:800;"></div>
      <div id="mini-choices" style="margin-top:14px;display:flex;flex-direction:column;gap:10px;"></div>
      <div id="mini-toast" style="margin-top:12px;font-size:13px;opacity:.9;"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector(".mini-panel");
  Object.assign(panel.style, {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    width: "min(520px, 100%)",
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    userSelect: "none",
  });

  const progressEl = overlay.querySelector("#mini-progress");
  const qEl = overlay.querySelector("#mini-q");
  const choicesEl = overlay.querySelector("#mini-choices");
  const toastEl = overlay.querySelector("#mini-toast");

  function setButtonsEnabled(enabled){
    choicesEl.querySelectorAll("button").forEach(b=>{
      b.disabled = !enabled;
      b.style.opacity = enabled ? "1" : ".65";
      b.style.cursor = enabled ? "pointer" : "default";
    });
  }

  function render(){
    const q = questions[current];
    locked = false;

    progressEl.textContent = `Question ${current + 1} / ${questions.length}`;
    qEl.textContent = q.q;
    toastEl.textContent = "";

    choicesEl.innerHTML = "";
    q.options.forEach(opt=>{
      const btn = document.createElement("button");
      btn.textContent = opt.text;

      Object.assign(btn.style, {
        padding: "10px 12px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        cursor: "pointer",
        background: "#f5f5f5",
        fontWeight: "700",
        textAlign: "left",
      });

      btn.addEventListener("click", ()=>{
        if(locked) return;
        locked = true;


        choicesEl.querySelectorAll("button").forEach(b=> b.style.background="#f5f5f5");
        btn.style.background = "#ddd";

        totalScore += (opt.score ?? 0);
        toastEl.textContent = opt.toast ?? (opt.score===2 ? "✅ Great" : opt.score===1 ? "⚖️ Neutral" : "❌ Bad");

        setButtonsEnabled(false);

        setTimeout(()=>{
          current++;
          if(current >= questions.length){
            finish();
          }else{
            render();
          }
        }, 450);
      });

      choicesEl.appendChild(btn);
    });
  }

  function finish(){
    const result = settle(totalScore, questions.length);

    progressEl.textContent = `Completed!`;
    qEl.textContent = `Total Score: ${totalScore} / ${questions.length*2}`;
    toastEl.textContent = `Result: Reputation ${result.repDelta >= 0 ? "+" : ""}${result.repDelta} ｜ Funds ${result.moneyDelta >= 0 ? "+" : ""}${result.moneyDelta}`;

    setTimeout(()=>{
      overlay.remove();
      done(result);
    }, 650);
  }


  render();
}


function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}