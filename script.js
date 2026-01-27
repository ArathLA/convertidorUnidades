// documento al modelo de objeto
const form = document.getElementById("converterForm");
const category = document.getElementById("category");
const valueInput = document.getElementById("valueInput");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");

const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");

const resultText = document.getElementById("resultText");
const message = document.getElementById("message");

const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// ====== unidades disponibles por categoría ======
const UNITS = {
  length: [
    { value: "m", label: "Metros (m)" },
    { value: "km", label: "Kilómetros (km)" },
    { value: "cm", label: "Centímetros (cm)" },
    { value: "mm", label: "Milímetros (mm)" },
    { value: "in", label: "Pulgadas (in)" },
    { value: "ft", label: "Pies (ft)" }
  ],
  temperature: [
    { value: "c", label: "Celsius (°C)" },
    { value: "f", label: "Fahrenheit (°F)" },
    { value: "k", label: "Kelvin (K)" }
  ],
  weight: [
    { value: "kg", label: "Kilogramos (kg)" },
    { value: "g", label: "Gramos (g)" },
    { value: "lb", label: "Libras (lb)" },
    { value: "oz", label: "Onzas (oz)" }
  ]
};

const STORAGE_KEY = "conversion_history_v1";

// auxiliares
function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "red" : "inherit";
}

function setResult(text) {
  resultText.textContent = text;
}

function formatNumber(n) {
  // Redondeo
  if (!Number.isFinite(n)) return "—";
  return Number(n.toFixed(6)).toString();
}

function populateUnitSelects(cat) {
  // llenador de unidades
  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  UNITS[cat].forEach((u) => {
    const opt1 = document.createElement("option");
    opt1.value = u.value;
    opt1.textContent = u.label;
    fromUnit.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = u.value;
    opt2.textContent = u.label;
    toUnit.appendChild(opt2);
  });

  // defaults razonables
  fromUnit.selectedIndex = 0;
  toUnit.selectedIndex = UNITS[cat].length > 1 ? 1 : 0;
}

function toBaseLength(value, unit) {
  // con base de metros
  switch (unit) {
    case "m": return value;
    case "km": return value * 1000;
    case "cm": return value / 100;
    case "mm": return value / 1000;
    case "in": return value * 0.0254;
    case "ft": return value * 0.3048;
    default: return NaN;
  }
}

function fromBaseLength(meters, unit) {
  switch (unit) {
    case "m": return meters;
    case "km": return meters / 1000;
    case "cm": return meters * 100;
    case "mm": return meters * 1000;
    case "in": return meters / 0.0254;
    case "ft": return meters / 0.3048;
    default: return NaN;
  }
}

function convertTemperature(value, from, to) {
  // convertir primero a celsius como base
  let celsius;
  switch (from) {
    case "c": celsius = value; break;
    case "f": celsius = (value - 32) * (5 / 9); break;
    case "k": celsius = value - 273.15; break;
    default: return NaN;
  }

  // De celcusis a correspondiente
  switch (to) {
    case "c": return celsius;
    case "f": return (celsius * (9 / 5)) + 32;
    case "k": return celsius + 273.15;
    default: return NaN;
  }
}

function toBaseWeight(value, unit) {
  // base a kilogramos
  switch (unit) {
    case "kg": return value;
    case "g": return value / 1000;
    case "lb": return value * 0.45359237;
    case "oz": return value * 0.028349523125;
    default: return NaN;
  }
}

function fromBaseWeight(kg, unit) {
  switch (unit) {
    case "kg": return kg;
    case "g": return kg * 1000;
    case "lb": return kg / 0.45359237;
    case "oz": return kg / 0.028349523125;
    default: return NaN;
  }
}

function convertValue(cat, value, from, to) {
  // control: si misma unidad
  if (from === to) return value;

  switch (cat) {
    case "length": {
      const base = toBaseLength(value, from);
      return fromBaseLength(base, to);
    }
    case "temperature":
      return convertTemperature(value, from, to);

    case "weight": {
      const base = toBaseWeight(value, from);
      return fromBaseWeight(base, to);
    }
    default:
      return NaN;
  }
}

// fucnion para guardar el historial
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function addToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  // un timer para no crear un bulke infinito
  const trimmed = history.slice(0, 15);
  saveHistory(trimmed);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    emptyHistory.style.display = "block";
    return;
  }

  emptyHistory.style.display = "none";

  history.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = `${h.time} — ${h.text}`;
    historyList.appendChild(li);
  });
}

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// categorias de eventos
category.addEventListener("change", () => {
  populateUnitSelects(category.value);
  setResult("—");
  setMessage("Unidades actualizadas.");
});

swapBtn.addEventListener("click", () => {
  const a = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = a;
  setMessage("Unidades intercambiadas.");
});

clearBtn.addEventListener("click", () => {
  form.reset();
  populateUnitSelects(category.value);
  setResult("—");
  setMessage("Formulario limpio.");
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  setMessage("Historial borrado.");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const cat = category.value;
  const raw = valueInput.value;

  // Validaciones de control)
  if (raw === "" || raw === null) {
    setMessage("Escribe un valor numérico.", true);
    setResult("—");
    return;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    setMessage("El valor ingresado no es válido.", true);
    setResult("—");
    return;
  }

  // Ejemplo de regla como Kelvin no puede ser negativo
  if (cat === "temperature" && fromUnit.value === "k" && value < 0) {
    setMessage("Kelvin no puede ser negativo.", true);
    setResult("—");
    return;
  }

  const from = fromUnit.value;
  const to = toUnit.value;

  const result = convertValue(cat, value, from, to);

  if (!Number.isFinite(result)) {
    setMessage("No se pudo convertir. Revisa las unidades.", true);
    setResult("—");
    return;
  }

  const pretty = `${formatNumber(value)} ${from.toUpperCase()} → ${formatNumber(result)} ${to.toUpperCase()}`;
  setResult(pretty);

  addToHistory({
    time: nowTime(),
    text: pretty,
    category: cat,
    from,
    to,
    value,
    result
  });
});

// el init
populateUnitSelects(category.value);
renderHistory();
setMessage("Listo. Elige unidades y convierte.");