const STORAGE_KEY = "work-planner-tasks";

const scopeLabels = {
  daily: "일일",
  weekly: "주간",
  monthly: "월간",
};

const priorityLabels = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const sampleTasks = [
  {
    id: crypto.randomUUID(),
    title: "오전 스탠드업 회의 준비",
    scope: "daily",
    date: new Date().toISOString().slice(0, 10),
    priority: "high",
    note: "어제 완료한 일과 오늘 막힌 일을 3줄로 정리",
    done: false,
  },
  {
    id: crypto.randomUUID(),
    title: "이번 주 릴리즈 체크리스트 점검",
    scope: "weekly",
    date: getOffsetDate(4),
    priority: "medium",
    note: "QA, 배포 담당자, 고객 공지 상태 확인",
    done: false,
  },
  {
    id: crypto.randomUUID(),
    title: "월간 성과 리포트 초안 작성",
    scope: "monthly",
    date: getOffsetDate(18),
    priority: "low",
    note: "핵심 지표와 다음 달 액션 아이템 포함",
    done: true,
  },
];

let tasks = loadTasks();
let activeFilter = "all";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const scopeInput = document.querySelector("#task-scope");
const dateInput = document.querySelector("#task-date");
const priorityInput = document.querySelector("#task-priority");
const noteInput = document.querySelector("#task-note");
const todayLabel = document.querySelector("#today-label");
const todayCount = document.querySelector("#today-count");
const statusText = document.querySelector("#status-text");
const filterButtons = document.querySelectorAll(".filter");

dateInput.value = new Date().toISOString().slice(0, 10);
todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "full",
}).format(new Date());

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const task = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim(),
    scope: scopeInput.value,
    date: dateInput.value,
    priority: priorityInput.value,
    note: noteInput.value.trim(),
    done: false,
  };

  if (!task.title) return;

  tasks = [task, ...tasks];
  saveTasks();
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  priorityInput.value = "medium";
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;

  if (action === "toggle") {
    tasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
  }

  if (action === "delete") {
    tasks = tasks.filter((task) => task.id !== id);
  }

  saveTasks();
  render();
});

render();

function render() {
  const visibleTasks = getVisibleTasks();
  const totalOpen = tasks.filter((task) => !task.done).length;
  const todayOpen = tasks.filter((task) => task.scope === "daily" && !task.done).length;

  todayCount.textContent = `${todayOpen}개 업무`;
  statusText.textContent = `총 ${tasks.length}개 업무 중 ${totalOpen}개가 진행중입니다.`;

  ["daily", "weekly", "monthly"].forEach((scope) => {
    const list = document.querySelector(`#${scope}-list`);
    const scopedTasks = visibleTasks
      .filter((task) => task.scope === scope)
      .sort((first, second) => first.date.localeCompare(second.date));

    list.innerHTML = scopedTasks.length
      ? scopedTasks.map(createTaskTemplate).join("")
      : `<li class="empty-state">${scopeLabels[scope]} 업무가 없습니다.<br />새 업무를 추가해보세요.</li>`;
  });
}

function getVisibleTasks() {
  if (activeFilter === "open") return tasks.filter((task) => !task.done);
  if (activeFilter === "done") return tasks.filter((task) => task.done);
  return tasks;
}

function createTaskTemplate(task) {
  const note = task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : "";
  const toggleLabel = task.done ? "다시 진행" : "완료";

  return `
    <li class="task-item ${task.done ? "done" : ""}">
      <div class="task-title-row">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="badge ${task.priority}">${priorityLabels[task.priority]}</span>
      </div>
      <div class="task-meta">${scopeLabels[task.scope]} · ${formatDate(task.date)}</div>
      ${note}
      <div class="task-actions">
        <button type="button" data-action="toggle" data-id="${task.id}">${toggleLabel}</button>
        <button class="delete" type="button" data-action="delete" data-id="${task.id}">삭제</button>
      </div>
    </li>`;
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  return savedTasks ? JSON.parse(savedTasks) : sampleTasks;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getOffsetDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
