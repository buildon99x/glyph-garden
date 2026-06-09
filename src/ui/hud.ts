import { candidateSlots, type CandidateSlot } from "../game/input/actions";
import type { GardenState, RuneId } from "../game/simulation/state";
import { labelForGlyph } from "../game/simulation/systems/gardenSystem";

export interface HudApi {
  mount(callbacks: {
    onCandidate: (slot: CandidateSlot) => void;
    onRune: (rune: RuneId) => void;
    onContinue: () => void;
    onRestart: () => void;
  }): void;
  render(state: GardenState): void;
}

export function createHud(root: HTMLElement): HudApi {
  let callbacks: Parameters<HudApi["mount"]>[0] | null = null;

  root.innerHTML = `
    <div class="hud">
      <div class="topbar">
        <div class="brand">
          <h1 class="title">Glyph Garden</h1>
          <p class="subtitle" data-message></p>
        </div>
        <div class="metric"><span>Score</span><strong data-score></strong></div>
        <div class="metric"><span>Garden</span><strong data-garden></strong></div>
        <div class="metric"><span>Turn</span><strong data-turn></strong></div>
        <div class="metric"><span>Chain</span><strong data-chain></strong></div>
      </div>

      <aside class="sidepanel">
        <section>
          <h2>World Rules</h2>
          <div class="rule-list" data-rules></div>
        </section>
        <section>
          <h2>Goals</h2>
          <div class="goal-list" data-goals></div>
        </section>
        <section>
          <h2>Runes</h2>
          <div class="rune-list" data-runes></div>
        </section>
      </aside>

      <div class="center">
        <div class="panel hidden" data-panel>
          <h2 data-panel-title></h2>
          <p data-panel-copy></p>
          <div class="actions" data-rewards></div>
          <button data-continue class="secondary hidden">Continue</button>
          <button data-restart class="secondary hidden">Restart Run</button>
        </div>
      </div>

      <div class="bottombar">
        <div class="candidates" data-candidates></div>
        <button class="restart-small" data-restart-small>Restart</button>
      </div>
    </div>
  `;

  return {
    mount(nextCallbacks) {
      callbacks = nextCallbacks;
      root.querySelector<HTMLButtonElement>("[data-continue]")?.addEventListener("click", () => callbacks?.onContinue());
      root.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () => callbacks?.onRestart());
      root.querySelector<HTMLButtonElement>("[data-restart-small]")?.addEventListener("click", () => callbacks?.onRestart());
    },
    render(state) {
      setText(root, "[data-message]", state.message);
      setText(root, "[data-score]", `${state.totalScore}`);
      setText(root, "[data-garden]", `${state.garden}/${state.maxGardens}`);
      setText(root, "[data-turn]", state.phase === "playing" ? `${Math.min(state.turn, state.maxTurns)}/${state.maxTurns}` : "-");
      setText(root, "[data-chain]", `${state.bestChain}`);
      renderCandidates(root, state, callbacks);
      renderRules(root, state);
      renderGoals(root, state);
      renderRunes(root, state);
      renderPanel(root, state, callbacks);
    }
  };
}

function renderCandidates(root: HTMLElement, state: GardenState, callbacks: Parameters<HudApi["mount"]>[0] | null): void {
  const container = root.querySelector<HTMLElement>("[data-candidates]");
  if (!container) return;
  container.innerHTML = "";
  for (const slot of candidateSlots) {
    const candidate = state.candidates[slot];
    const button = document.createElement("button");
    button.className = `candidate ${slot === state.selectedSlot ? "active" : ""}`;
    button.disabled = state.phase !== "playing";
    button.dataset.slot = `${slot}`;
    button.innerHTML = `
      <strong>${slot + 1}</strong>
      <span class="glyph-dot ${candidate?.color ?? "green"}"></span>
      <span>${candidate ? labelForGlyph(candidate.kind) : "Empty"}</span>
    `;
    button.addEventListener("click", () => callbacks?.onCandidate(slot));
    container.appendChild(button);
  }
}

function renderRules(root: HTMLElement, state: GardenState): void {
  const container = root.querySelector<HTMLElement>("[data-rules]");
  if (!container) return;
  container.innerHTML = state.rules
    .map((rule) => `<article class="rule"><strong>${rule.name}</strong><span>${rule.text}</span></article>`)
    .join("");
}

function renderGoals(root: HTMLElement, state: GardenState): void {
  const container = root.querySelector<HTMLElement>("[data-goals]");
  if (!container) return;
  container.innerHTML = state.goals
    .map((goal) => {
      const ratio = Math.min(100, Math.round((goal.progress / goal.target) * 100));
      return `
        <article class="goal ${goal.achieved ? "done" : ""}">
          <div><strong>${goal.label}</strong><span>${goal.progress}/${goal.target}</span></div>
          <i><b style="width:${ratio}%"></b></i>
        </article>
      `;
    })
    .join("");
}

function renderRunes(root: HTMLElement, state: GardenState): void {
  const container = root.querySelector<HTMLElement>("[data-runes]");
  if (!container) return;
  if (state.runes.length === 0) {
    container.innerHTML = `<p class="empty">No runes yet</p>`;
    return;
  }
  container.innerHTML = state.runes.map((rune) => `<article class="rune"><strong>${rune.name}</strong><span>${rune.text}</span></article>`).join("");
}

function renderPanel(root: HTMLElement, state: GardenState, callbacks: Parameters<HudApi["mount"]>[0] | null): void {
  const panel = root.querySelector<HTMLElement>("[data-panel]")!;
  const rewards = root.querySelector<HTMLElement>("[data-rewards]")!;
  const restart = root.querySelector<HTMLButtonElement>("[data-restart]")!;
  const continueButton = root.querySelector<HTMLButtonElement>("[data-continue]")!;
  const terminal = state.phase === "won" || state.phase === "lost";

  panel.classList.toggle("hidden", state.phase !== "reward" && !terminal);
  restart.classList.toggle("hidden", !terminal);
  continueButton.classList.toggle("hidden", state.phase !== "reward");
  rewards.classList.toggle("hidden", state.phase !== "reward");

  if (state.phase === "reward") {
    setText(root, "[data-panel-title]", "Choose a Rune");
    setText(root, "[data-panel-copy]", "Carry one rule-bending relic into the next garden.");
    rewards.innerHTML = "";
    for (const rune of state.rewardChoices) {
      const button = document.createElement("button");
      button.className = "reward";
      button.innerHTML = `<strong>${rune.name}</strong><span>${rune.text}</span>`;
      button.addEventListener("click", () => callbacks?.onRune(rune.id));
      rewards.appendChild(button);
    }
  } else if (terminal) {
    setText(root, "[data-panel-title]", state.phase === "won" ? "Run Complete" : "Garden Faded");
    setText(root, "[data-panel-copy]", state.message);
    rewards.innerHTML = "";
  }
}

function setText(root: HTMLElement, selector: string, text: string): void {
  const element = root.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}
