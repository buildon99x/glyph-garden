import { candidateSlots, type CandidateSlot } from "../game/input/actions";
import type { GardenState, RuneId } from "../game/simulation/state";
import { labelForGlyph } from "../game/simulation/systems/gardenSystem";

const glyphHints = {
  seed: "물 옆에서 성장",
  water: "씨앗을 꽃으로 성장",
  bloom: "줄 보너스 획득",
  stone: "이웃 타일 증폭",
  moth: "꽃 근처에서 강함",
  prism: "대각선 색 복사"
};

export interface HudApi {
  mount(callbacks: {
    onCandidate: (slot: CandidateSlot) => void;
    onRune: (rune: RuneId) => void;
    onContinue: () => void;
    onRestart: () => void;
    onStandard: () => void;
    onDaily: () => void;
  }): void;
  render(state: GardenState): void;
}

export function createHud(root: HTMLElement): HudApi {
  let callbacks: Parameters<HudApi["mount"]>[0] | null = null;

  root.innerHTML = `
    <div class="hud">
      <div class="topbar">
        <div class="brand">
          <h1 class="title">글리프 가든</h1>
          <p class="subtitle" data-message></p>
        </div>
        <div class="metric"><span>점수</span><strong data-score></strong></div>
        <div class="metric"><span>정원</span><strong data-garden></strong></div>
        <div class="metric"><span>턴</span><strong data-turn></strong></div>
        <div class="metric"><span>연쇄</span><strong data-chain></strong></div>
      </div>

      <aside class="sidepanel">
        <section>
          <h2>마지막 수</h2>
          <div class="last-move" data-last-move></div>
        </section>
        <section>
          <h2>세계 규칙</h2>
          <div class="rule-list" data-rules></div>
        </section>
        <section>
          <div class="section-title"><h2>목표</h2><span data-required-goals></span></div>
          <div class="goal-list" data-goals></div>
        </section>
        <section>
          <h2>룬</h2>
          <div class="rune-list" data-runes></div>
        </section>
        <section>
          <h2>언락</h2>
          <div class="unlock-list" data-unlocks></div>
        </section>
      </aside>

      <div class="center">
        <div class="panel hidden" data-panel>
          <h2 data-panel-title></h2>
          <p data-panel-copy></p>
          <div class="actions" data-rewards></div>
          <button data-continue class="secondary hidden">계속하기</button>
          <button data-restart class="secondary hidden">런 다시 시작</button>
        </div>
      </div>

      <div class="bottombar">
        <div class="candidates" data-candidates></div>
        <div class="run-actions">
          <button class="restart-small" data-restart-small>다시 시작</button>
          <button class="restart-small" data-standard>새 런</button>
          <button class="restart-small" data-daily>데일리</button>
        </div>
      </div>
    </div>
  `;

  return {
    mount(nextCallbacks) {
      callbacks = nextCallbacks;
      root.querySelector<HTMLButtonElement>("[data-continue]")?.addEventListener("click", () => callbacks?.onContinue());
      root.querySelector<HTMLButtonElement>("[data-restart]")?.addEventListener("click", () => callbacks?.onRestart());
      root.querySelector<HTMLButtonElement>("[data-restart-small]")?.addEventListener("click", () => callbacks?.onRestart());
      root.querySelector<HTMLButtonElement>("[data-standard]")?.addEventListener("click", () => callbacks?.onStandard());
      root.querySelector<HTMLButtonElement>("[data-daily]")?.addEventListener("click", () => callbacks?.onDaily());
    },
    render(state) {
      setText(root, "[data-message]", state.message);
      setText(root, "[data-score]", `${state.totalScore}`);
      setText(root, "[data-garden]", `${state.garden}/${state.maxGardens}`);
      setText(root, "[data-turn]", state.phase === "playing" ? `${Math.min(state.turn, state.maxTurns)}/${state.maxTurns}` : "-");
      setText(root, "[data-chain]", `${state.bestChain}`);
      setText(root, "[data-required-goals]", `${requiredGoals(state)}개 필요`);
      renderLastMove(root, state);
      renderCandidates(root, state, callbacks);
      renderRules(root, state);
      renderGoals(root, state);
      renderRunes(root, state);
      renderUnlocks(root, state);
      renderPanel(root, state, callbacks);
    }
  };
}

function renderLastMove(root: HTMLElement, state: GardenState): void {
  const container = root.querySelector<HTMLElement>("[data-last-move]");
  if (!container) return;
  if (!state.lastPlacement) {
    container.innerHTML = `<p class="empty">문양을 배치하면 점수가 표시됩니다.</p>`;
    return;
  }
  const changed = state.lastPlacement.changed.length > 1 ? state.lastPlacement.changed.map(labelForGlyph).join(", ") : "추가 반응 없음";
  container.innerHTML = `
    <article class="last-card">
      <strong>${labelForGlyph(state.lastPlacement.kind)} +${state.lastPlacement.score}</strong>
      <span>연쇄 ${state.lastPlacement.chain} · ${changed}</span>
    </article>
  `;
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
      <span class="candidate-copy">
        <b>${candidate ? labelForGlyph(candidate.kind) : "비어 있음"}</b>
        <small>${candidate ? glyphHints[candidate.kind] : ""}</small>
      </span>
    `;
    button.addEventListener("click", () => callbacks?.onCandidate(slot));
    container.appendChild(button);
  }
}

function requiredGoals(state: GardenState): number {
  return state.runes.some((rune) => rune.id === "goalSwap") && state.garden <= 2 ? 1 : 2;
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
    container.innerHTML = `<p class="empty">아직 룬 없음</p>`;
    return;
  }
  container.innerHTML = state.runes.map((rune) => `<article class="rune"><strong>${rune.name}</strong><span>${rune.text}</span></article>`).join("");
}

function renderUnlocks(root: HTMLElement, state: GardenState): void {
  const container = root.querySelector<HTMLElement>("[data-unlocks]");
  if (!container) return;
  if (state.unlocks.length === 0) {
    container.innerHTML = `<p class="empty">런을 완료하면 새 선택지가 열립니다.</p>`;
    return;
  }
  container.innerHTML = state.unlocks.map((unlock) => `<article class="rune"><strong>${unlock.name}</strong><span>${unlock.text}</span></article>`).join("");
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
    setText(root, "[data-panel-title]", "룬 선택");
    setText(root, "[data-panel-copy]", "다음 정원으로 가져갈 규칙 변형 유물을 하나 고르세요.");
    rewards.innerHTML = "";
    for (const rune of state.rewardChoices) {
      const button = document.createElement("button");
      button.className = "reward";
      button.innerHTML = `<strong>${rune.name}</strong><span>${rune.text}</span>`;
      button.addEventListener("click", () => callbacks?.onRune(rune.id));
      rewards.appendChild(button);
    }
  } else if (terminal) {
    setText(root, "[data-panel-title]", state.phase === "won" ? "런 완료" : "정원 실패");
    const unlockText = state.newUnlock ? ` 새 언락: ${state.newUnlock.name} - ${state.newUnlock.text}` : "";
    setText(root, "[data-panel-copy]", `${state.message}${unlockText}`);
    rewards.innerHTML = "";
  }
}

function setText(root: HTMLElement, selector: string, text: string): void {
  const element = root.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}
