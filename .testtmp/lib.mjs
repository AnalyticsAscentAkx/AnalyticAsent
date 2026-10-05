var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/lib/cm/catalogue.ts
function decodeCatalogue(blob) {
  var _a;
  const { cols, dict, n } = blob;
  const base = Date.parse((_a = blob.date_base) != null ? _a : "2021-01-01");
  const cat = (name, i) => dict[name][cols[name][i]];
  const num2 = (name, i) => cols[name][i];
  const parts = new Array(n);
  for (let i = 0; i < n; i++) {
    parts[i] = {
      publicId: cols.public_id[i],
      partFamily: cat("part_family", i),
      shapeClass: cat("shape_class", i),
      grade: cat("grade", i),
      alloyFamily: cat("alloy_family", i),
      process: cat("process", i),
      envL: num2("env_l_mm", i),
      envW: num2("env_w_mm", i),
      envH: num2("env_h_mm", i),
      stockMassKg: num2("stock_mass_kg", i),
      partMassKg: num2("part_mass_kg", i),
      nFeatures: num2("n_features", i),
      nSetups: num2("n_setups", i),
      tightestTolMm: num2("tightest_tol_mm", i),
      surfaceRaUm: num2("surface_Ra_um", i),
      heatTreat: cat("heat_treat", i),
      surfaceTreat: cat("surface_treat", i),
      annualQty: num2("annual_qty", i),
      batchQty: num2("batch_qty", i),
      quoteDate: new Date(base + num2("quote_date", i) * 864e5).toISOString().slice(0, 10),
      unitPriceEur: num2("unit_price_eur", i),
      won: num2("won", i) === 1
    };
  }
  return parts;
}
function gradeKey(s) {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
}
var AlloyTable = class {
  constructor(grades) {
    this.byGrade = /* @__PURE__ */ new Map();
    this.lookup = /* @__PURE__ */ new Map();
    this.keysByLength = [];
    this.grades = grades;
    for (const g of grades) {
      this.byGrade.set(g.grade, g);
      const k = gradeKey(g.grade);
      if (!this.lookup.has(k))
        this.lookup.set(k, g.grade);
      for (const a of g.aliases) {
        const ak = gradeKey(a);
        if (!this.lookup.has(ak))
          this.lookup.set(ak, g.grade);
      }
    }
    this.keysByLength = [...this.lookup.keys()].sort((a, b) => b.length - a.length);
  }
  get(grade) {
    return this.byGrade.get(grade);
  }
  resolve(written) {
    const key = gradeKey(written);
    if (!key)
      return null;
    const exact = this.lookup.get(key);
    if (exact)
      return exact;
    for (const k of this.keysByLength) {
      if (k.length >= 4 && key.includes(k))
        return this.lookup.get(k);
    }
    return null;
  }
  substitutesFor(grade) {
    const g = this.byGrade.get(grade);
    if (!g)
      return [];
    return this.grades.filter(
      (c) => c.grade !== g.grade && c.family === g.family && c.uts >= g.uts && (c.eurKg < g.eurKg || c.co2Kg < g.co2Kg)
    ).map((c) => ({
      grade: c.grade,
      uts: c.uts,
      eurKg: c.eurKg,
      co2Kg: c.co2Kg,
      savesEurPerKg: +(g.eurKg - c.eurKg).toFixed(2),
      savesCo2PerKg: +(g.co2Kg - c.co2Kg).toFixed(2)
    })).sort((a, b) => b.savesEurPerKg - a.savesEurPerKg).slice(0, 3);
  }
};
var INCH_HINT = /("|''|\bin\b|\binch(es)?\b|\bipt\b)/i;
var MM_HINT = /\b(mm|millimet(re|er)s?)\b/i;
var DIA_HINT = /[ØøΦφ⌀]|\bdia\b|\bdiam(eter)?\b|^d\s*[\d.]/i;
function parseDimensions(text) {
  if (!text)
    return null;
  const s = String(text).trim();
  if (!s)
    return null;
  const numbers = s.match(/\d+(?:[.,]\d+)?/g);
  if (!numbers || numbers.length === 0)
    return null;
  let dims = numbers.map((n) => parseFloat(n.replace(",", "."))).filter((n) => n > 0);
  if (dims.length === 0)
    return null;
  dims = dims.slice(0, 3);
  const inches = INCH_HINT.test(s) && !MM_HINT.test(s);
  if (inches)
    dims = dims.map((d) => d * 25.4);
  const rotational = DIA_HINT.test(s) || dims.length === 2;
  if (rotational && dims.length === 2) {
    const [a, b] = dims;
    const dia = Math.min(a, b);
    const len = Math.max(a, b);
    dims = [len, dia, dia];
  }
  while (dims.length < 3)
    dims.push(dims[dims.length - 1]);
  return { dims, converted: inches, rotational };
}
function stockVolumeCm3(shape, l, w, h) {
  if (shape === "rotational")
    return Math.PI / 4 * __pow(w / 10, 2) * (l / 10);
  return l / 10 * (w / 10) * (h / 10);
}
var ROTATIONAL_FAMILIES = /* @__PURE__ */ new Set([
  "shaft",
  "bushing",
  "pin",
  "gear blank",
  "fitting"
]);
function shapeFor(partFamily) {
  return ROTATIONAL_FAMILIES.has(partFamily.toLowerCase()) ? "rotational" : "prismatic";
}

// src/lib/cm/parse.ts
function splitRows(s, delim) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else
          quoted = false;
      } else
        field += ch;
    } else if (ch === '"')
      quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r")
      field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
function sniffDelimiter(sample) {
  const candidates = [",", ";", "	", "|"];
  let best = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const rows = splitRows(sample, d).filter((r) => r.some((c) => c !== ""));
    if (rows.length === 0)
      continue;
    const width = rows[0].length;
    if (width < 2)
      continue;
    const consistent = rows.filter((r) => r.length === width).length / rows.length;
    const score = consistent * 1e3 + Math.min(width, 50);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}
function parseDelimited(text) {
  const s = text.replace(/^\uFEFF/, "");
  let cut = s.lastIndexOf("\n", 2e4);
  if (cut < 0)
    cut = s.length;
  const delim = sniffDelimiter(s.slice(0, cut) || s);
  const rows = splitRows(s, delim);
  if (rows.length < 2)
    return [];
  const headers = rows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
  return rows.slice(1).filter((r) => r.some((c) => c.trim() !== "")).map((r) => {
    const o = {};
    headers.forEach((h, i) => {
      var _a;
      return o[h] = ((_a = r[i]) != null ? _a : "").trim();
    });
    return o;
  });
}
var COLUMN_SYNONYMS = [
  ["publicId", /^(part\s*(id|no|num(ber)?|#)?|p\/?n|item(\s*(id|no|num(ber)?|code))?|drawing|dwg|ref(erence)?|id)$/i],
  ["description", /desc|nomenclature|part\s*name|title/i],
  ["grade", /mat(erial|l|nr)?|maktx|grade|alloy|spec(ification)?|stock\s*type|werkstoff/i],
  ["dimensions", /dimension|envelope|^size|overall|bounding|blank\s*size|stock\s*size/i],
  ["diameter", /\b(dia(meter)?|o\.?d\.?|outer\s*dia)\b/i],
  ["envL", /\b(length|lgth|len|long|l\b|env.*l|l(ae|ä)nge?|laeng|lengte)\b/i],
  ["envW", /\b(width|wdth|wide|wid|w\b|across|breite?|breit|breedte)\b/i],
  ["envH", /\b(height|hgt|thick(ness)?|thk|depth|dep|h\b|h(oe|ö)he|hoogte|dicke|dikte)\b/i],
  ["partMassKg", /\b(part\s*)?(mass|weight|wt)\b|kg\b/i],
  ["stockMassKg", /\b(stock|billet|blank|raw)\s*(mass|weight|wt)\b/i],
  ["tightestTolMm", /tol(erance)?|true\s*position|gd&?t/i],
  ["surfaceRaUm", /\bra\b|roughness|surface\s*finish/i],
  ["nFeatures", /features?|holes|ops\b|operations/i],
  ["nSetups", /set[\s-]?ups?|fixturings?/i],
  ["process", /process|machine|route|work\s*cent(re|er)/i],
  ["surfaceTreat", /coat(ing)?|plat(ing|e)|anodi[sz]|treatment|finish\b/i],
  ["heatTreat", /heat\s*treat|\bht\b|temper|condition/i],
  ["batchQty", /batch|lot|order\s*qty|release/i],
  ["annualQty", /annual|eau|yearly|volume|^qty|quantity/i],
  ["partFamily", /family|category|part\s*type|commodity/i],
  ["unitPriceEur", /price|cost|value|rate|eur|€|\bamount\b/i],
  ["quoteDate", /date|quoted\s*on|when/i]
];
function forMatching(header) {
  return header.replace(/[_.\-]+/g, " ").replace(/\s+/g, " ").trim();
}
function mapColumns(headers) {
  const map = {};
  const taken = /* @__PURE__ */ new Set();
  for (const [field, pattern] of COLUMN_SYNONYMS) {
    for (const h of headers) {
      if (taken.has(h))
        continue;
      if (pattern.test(forMatching(h))) {
        map[field] = h;
        taken.add(h);
        break;
      }
    }
  }
  return map;
}
var num = (v) => {
  if (v === void 0 || v === null)
    return null;
  const m = String(v).replace(/[^\d.,\-]/g, "").replace(",", ".");
  const n = parseFloat(m);
  return Number.isFinite(n) ? n : null;
};
var DEFAULTS = {
  nFeatures: 12,
  nSetups: 2,
  tightestTolMm: 0.05,
  surfaceRaUm: 3.2,
  surfaceTreat: "none",
  heatTreat: "none",
  batchQty: 100,
  annualQty: 1e3,
  fillFactor: 0.45,
  partFamily: "bracket"
};
function enrichRow(raw, map, alloys, index, mode = "enriched") {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
  const flags = [];
  const mapped = {};
  const get = (f) => map[f] ? raw[map[f]] : void 0;
  for (const [f, col] of Object.entries(map))
    if (col)
      mapped[f] = col;
  const written = ((_a = get("grade")) != null ? _a : "").trim();
  const description = ((_b = get("description")) != null ? _b : "").trim();
  let grade = written;
  let alloyFamily = "";
  if (mode === "enriched") {
    const resolved = (_c = alloys.resolve(written)) != null ? _c : description ? alloys.resolve(description) : null;
    if (resolved) {
      if (resolved !== written)
        flags.push({ kind: "grade-normalised", written, resolved });
      grade = resolved;
      alloyFamily = alloys.get(resolved).family;
    } else {
      flags.push({ kind: "grade-unresolved", written: written || description || "(blank)" });
    }
  }
  let dims = null;
  const l = num(get("envL"));
  const w = num(get("envW"));
  const h = num(get("envH"));
  const dia = num(get("diameter"));
  if (l !== null && (w !== null || dia !== null)) {
    dims = [l, dia != null ? dia : w, (_d = dia != null ? dia : h) != null ? _d : w];
  } else if (mode === "enriched") {
    const cell = ((_e = get("dimensions")) != null ? _e : "") || description;
    const parsed = parseDimensions(cell);
    if (parsed) {
      dims = parsed.dims;
      flags.push({ kind: "dimensions-parsed", written: cell });
      if (parsed.converted)
        flags.push({ kind: "units-converted", from: "in", written: cell });
    }
  }
  if (!dims)
    flags.push({ kind: "missing", field: "dimensions" });
  const familyRaw = ((_f = get("partFamily")) != null ? _f : "").trim().toLowerCase();
  const partFamily = familyRaw || guessFamily(description) || DEFAULTS.partFamily;
  const shapeClass = shapeFor(partFamily);
  let partMassKg = num(get("partMassKg"));
  let stockMassKg = num(get("stockMassKg"));
  const alloy = alloyFamily ? alloys.get(grade) : void 0;
  if (dims && alloy && mode === "enriched") {
    const vol = stockVolumeCm3(shapeClass, dims[0], dims[1], dims[2]);
    if (stockMassKg === null)
      stockMassKg = vol * alloy.density / 1e3;
    if (partMassKg === null) {
      partMassKg = stockMassKg * DEFAULTS.fillFactor;
      flags.push({ kind: "mass-derived" });
    }
  }
  const annualQty = (_g = num(get("annualQty"))) != null ? _g : DEFAULTS.annualQty;
  const batchQty = (_h = num(get("batchQty"))) != null ? _h : Math.max(1, Math.round(annualQty * 0.25));
  const part = {
    publicId: ((_i = get("publicId")) != null ? _i : `row-${index + 1}`).trim() || `row-${index + 1}`,
    partFamily,
    shapeClass,
    grade,
    alloyFamily,
    process: ((_j = get("process")) != null ? _j : "").trim() || defaultProcess(shapeClass),
    envL: dims == null ? void 0 : dims[0],
    envW: dims == null ? void 0 : dims[1],
    envH: dims == null ? void 0 : dims[2],
    stockMassKg: stockMassKg != null ? stockMassKg : void 0,
    partMassKg: partMassKg != null ? partMassKg : void 0,
    nFeatures: (_k = num(get("nFeatures"))) != null ? _k : DEFAULTS.nFeatures,
    nSetups: (_l = num(get("nSetups"))) != null ? _l : DEFAULTS.nSetups,
    tightestTolMm: (_m = num(get("tightestTolMm"))) != null ? _m : DEFAULTS.tightestTolMm,
    surfaceRaUm: (_n = num(get("surfaceRaUm"))) != null ? _n : DEFAULTS.surfaceRaUm,
    heatTreat: ((_o = get("heatTreat")) != null ? _o : "").trim() || DEFAULTS.heatTreat,
    surfaceTreat: ((_p = get("surfaceTreat")) != null ? _p : "").trim() || DEFAULTS.surfaceTreat,
    annualQty,
    batchQty,
    quoteDate: ((_q = get("quoteDate")) != null ? _q : "").trim() || new Date().toISOString().slice(0, 10),
    unitPriceEur: (_r = num(get("unitPriceEur"))) != null ? _r : 0,
    won: false
  };
  for (const f of ["nFeatures", "nSetups", "tightestTolMm", "surfaceRaUm"]) {
    if (!map[f])
      flags.push({ kind: "missing", field: f });
  }
  const usable = Boolean(dims) && (mode === "raw" || Boolean(alloyFamily));
  return { part, mapped, flags, usable };
}
var FAMILY_WORDS = [
  ["shaft", /shaft|spindle|axle|rod\b/i],
  ["bushing", /bush(ing)?|sleeve|liner/i],
  ["pin", /\bpin\b|dowel|stud/i],
  ["gear blank", /gear|pinion|sprocket/i],
  ["fitting", /fitting|union|nipple|coupling|adapt[oe]r/i],
  ["flange", /flange|collar/i],
  ["bracket", /bracket|mount|support|clip|lug/i],
  ["housing", /housing|casing|enclosure|body|cover/i],
  ["plate", /plate|panel|shim|disc|disk/i],
  ["manifold", /manifold|valve\s*block|block\b/i]
];
function guessFamily(text) {
  for (const [family, re] of FAMILY_WORDS)
    if (re.test(text))
      return family;
  return null;
}
function defaultProcess(shape) {
  return shape === "rotational" ? "turning" : "3-axis mill";
}
function enrichAll(rows, alloys, mode = "enriched") {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const map = mapColumns(headers);
  const enriched = rows.map((r, i) => enrichRow(r, map, alloys, i, mode));
  return {
    map,
    headers,
    rows: enriched,
    usable: enriched.filter((r) => r.usable).length,
    unusable: enriched.filter((r) => !r.usable).length
  };
}
function readSpreadsheet(file) {
  return __async(this, null, function* () {
    if (/\.(csv|tsv|txt)$/i.test(file.name))
      return parseDelimited(yield file.text());
    if (/\.xls$/i.test(file.name)) {
      throw new Error(
        "This is the old .xls format. Open it in Excel and use Save As \u2192 .xlsx, or export it as CSV."
      );
    }
    const { default: readXlsxFile } = yield import("read-excel-file/browser");
    const matrix = toMatrix(yield readXlsxFile(file));
    if (matrix.length < 2)
      return [];
    const headers = matrix[0].map((h, i) => String(h != null ? h : "").trim() || `Column ${i + 1}`);
    return matrix.slice(1).map((r) => {
      const o = {};
      headers.forEach((h, i) => o[h] = cellToString(r[i]));
      return o;
    });
  });
}
function toMatrix(result) {
  var _a, _b;
  if (!Array.isArray(result))
    return [];
  const sheets = result.filter(
    (s) => Boolean(s) && typeof s === "object" && Array.isArray(s.data)
  );
  if (sheets.length > 0) {
    const used = sheets.map((s) => s.data).filter((d) => d.length >= 2);
    return (_b = (_a = used[0]) != null ? _a : sheets[0].data) != null ? _b : [];
  }
  return result;
}
function cellToString(v) {
  if (v === null || v === void 0)
    return "";
  if (v instanceof Date) {
    const iso = new Date(v.getTime() - v.getTimezoneOffset() * 6e4).toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.slice(0, 19).replace("T", " ");
  }
  if (typeof v === "boolean")
    return v ? "TRUE" : "FALSE";
  return String(v).trim();
}

// src/lib/profile.ts
var ROW_KEY_SEP = String.fromCharCode(1);
var MISSING = /* @__PURE__ */ new Set([
  "",
  "na",
  "n/a",
  "nan",
  "null",
  "none",
  "nil",
  "-",
  "--",
  "#n/a",
  "#value!",
  "#ref!",
  "tbc",
  "tbd",
  "unknown",
  "?",
  "x"
]);
var isMissing = (v) => MISSING.has(v.trim().toLowerCase());
var CURRENCY_RE = /[€$£¥]/g;
var PERCENT_RE = /%$/;
var UNIT_RE = /\b(kg|g|t|mm|cm|m|km|in|inch|ft|lb|lbs|pcs|eur|usd|gbp)\b/i;
var INCH_MARK = /["”]/;
var DATE_SLASH = /^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/;
var DATE_ISO = /^\d{4}-\d{2}-\d{2}/;
var BOOL = /* @__PURE__ */ new Set(["true", "false", "yes", "no", "y", "n", "1", "0"]);
function parseNumberish(v) {
  let s = v.replace(CURRENCY_RE, "").replace(PERCENT_RE, "").replace(UNIT_RE, "").trim();
  s = s.replace(/\s/g, "");
  if (!s || !/\d/.test(s))
    return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function classify(values) {
  const present = values.filter((v) => !isMissing(v));
  if (present.length === 0)
    return "empty";
  const n = present.length;
  const numeric = present.filter((v) => parseNumberish(v) !== null).length;
  const dated = present.filter((v) => DATE_ISO.test(v) || DATE_SLASH.test(v)).length;
  const bools = present.filter((v) => BOOL.has(v.trim().toLowerCase())).length;
  if (dated / n > 0.8)
    return "date";
  if (bools / n > 0.9)
    return "boolean";
  if (numeric / n > 0.85) {
    const allInt = present.every((v) => {
      const x = parseNumberish(v);
      return x !== null && Number.isInteger(x);
    });
    return allInt ? "integer" : "number";
  }
  const distinct = new Set(present.map((v) => v.trim().toLowerCase())).size;
  if (distinct <= Math.max(12, n * 0.05))
    return "category";
  return "text";
}
function nearDuplicates(values) {
  const groups = /* @__PURE__ */ new Map();
  for (const v of values) {
    if (isMissing(v))
      continue;
    const key = v.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key)
      continue;
    if (!groups.has(key))
      groups.set(key, /* @__PURE__ */ new Set());
    groups.get(key).add(v.trim());
  }
  return [...groups.values()].filter((s) => s.size > 1);
}
function profile(rows) {
  var _a;
  const issues = [];
  const names = rows.length > 0 ? Object.keys(rows[0]) : [];
  const columns = [];
  const seen = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = names.map((n) => {
      var _a2;
      return ((_a2 = r[n]) != null ? _a2 : "").trim().toLowerCase();
    }).join(ROW_KEY_SEP);
    seen.set(key, ((_a = seen.get(key)) != null ? _a : 0) + 1);
  }
  const duplicateRows = [...seen.values()].filter((c) => c > 1).reduce((a, c) => a + c - 1, 0);
  if (duplicateRows > 0) {
    issues.push({
      kind: "duplicate-rows",
      severity: "high",
      title: `${duplicateRows.toLocaleString("en-GB")} duplicate row${duplicateRows === 1 ? "" : "s"}`,
      detail: "Identical once case and surrounding spaces are ignored. Anything totalled from this file currently counts them more than once.",
      count: duplicateRows,
      examples: []
    });
  }
  const blankHeaders = names.filter((n) => !n.trim()).length;
  if (blankHeaders > 0) {
    issues.push({
      kind: "blank-header",
      severity: "medium",
      title: `${blankHeaders} column${blankHeaders === 1 ? "" : "s"} with no header`,
      detail: "Unnamed columns usually mean the real header row is further down the sheet, under a title or a logo.",
      count: blankHeaders,
      examples: []
    });
  }
  const dupeHeaders = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupeHeaders.length > 0) {
    issues.push({
      kind: "duplicate-header",
      severity: "medium",
      title: "Repeated column names",
      detail: "Two columns share a name, so one of them cannot be reached by name at all.",
      count: dupeHeaders.length,
      examples: [...new Set(dupeHeaders)].slice(0, 4)
    });
  }
  for (const name of names) {
    const values = rows.map((r) => {
      var _a2;
      return (_a2 = r[name]) != null ? _a2 : "";
    });
    const present = values.filter((v) => !isMissing(v));
    const type = classify(values);
    const col = {
      name,
      type,
      filled: present.length,
      missing: values.length - present.length,
      distinct: new Set(present.map((v) => v.trim())).size,
      examples: [...new Set(present.map((v) => v.trim()))].slice(0, 3)
    };
    if (type === "number" || type === "integer") {
      const nums = present.map(parseNumberish).filter((x) => x !== null);
      if (nums.length > 0) {
        col.numbers = nums;
        col.min = Math.min(...nums);
        col.max = Math.max(...nums);
      }
    }
    columns.push(col);
    const share = col.missing / Math.max(values.length, 1);
    if (col.missing > 0 && share > 0.05) {
      issues.push({
        kind: "missing",
        severity: share > 0.4 ? "high" : "low",
        title: `${name} is ${Math.round(share * 100)}% empty`,
        detail: 'Blanks and placeholders such as N/A, TBC and "-" counted together. Decide whether these mean zero or unknown before anything averages them.',
        column: name,
        count: col.missing,
        examples: []
      });
    }
    if (type === "text" || type === "category") {
      const numeric = present.filter((v) => parseNumberish(v) !== null).length;
      const ratio = present.length > 0 ? numeric / present.length : 0;
      if (ratio > 0.6 && ratio < 0.99) {
        issues.push({
          kind: "mixed-number-text",
          severity: "high",
          title: `${name} mixes numbers and text`,
          detail: `${numeric} of ${present.length} values read as numbers and the rest do not. A spreadsheet sorts this column alphabetically, so 100 comes before 20.`,
          column: name,
          count: present.length - numeric,
          examples: present.filter((v) => parseNumberish(v) === null).slice(0, 3)
        });
      }
    }
    const withUnits = present.filter((v) => UNIT_RE.test(v) || INCH_MARK.test(v));
    if (withUnits.length > 0 && withUnits.length <= present.length) {
      const units = new Set(
        withUnits.map(
          (v) => {
            var _a2, _b;
            return INCH_MARK.test(v) ? "in" : ((_b = (_a2 = v.match(UNIT_RE)) == null ? void 0 : _a2[0]) != null ? _b : "").toLowerCase();
          }
        )
      );
      if (units.size > 1 || withUnits.length !== present.length) {
        issues.push({
          kind: "mixed-units",
          severity: "high",
          title: `${name} carries units inside the values`,
          detail: units.size > 1 ? `More than one unit appears in the same column (${[...units].join(", ")}), so the bare numbers are not comparable.` : "Some values carry a unit and some do not, so the bare numbers mean different things.",
          column: name,
          count: withUnits.length,
          examples: withUnits.slice(0, 3)
        });
      }
    }
    const euro = present.filter((v) => /^\s*-?\d{1,3}(\.\d{3})*,\d+\s*$/.test(v)).length;
    const anglo = present.filter((v) => /^\s*-?\d{1,3}(,\d{3})*\.\d+\s*$/.test(v)).length;
    if (euro > 0 && anglo > 0) {
      issues.push({
        kind: "decimal-separator",
        severity: "high",
        title: `${name} mixes decimal separators`,
        detail: `${euro} values use a comma and ${anglo} use a full stop. Read carelessly, 1,234 becomes either 1.234 or 1234 \u2014 a factor of a thousand.`,
        column: name,
        count: euro + anglo,
        examples: present.filter((v) => /,\d+$/.test(v)).slice(0, 2)
      });
    }
    if (type === "date" || present.some((v) => DATE_SLASH.test(v))) {
      const iso = present.filter((v) => DATE_ISO.test(v)).length;
      const slash = present.filter((v) => DATE_SLASH.test(v)).length;
      if (iso > 0 && slash > 0) {
        issues.push({
          kind: "mixed-dates",
          severity: "medium",
          title: `${name} mixes date formats`,
          detail: `${iso} ISO dates and ${slash} written in day/month order. Where the day is 12 or lower the two are indistinguishable, so some are silently wrong.`,
          column: name,
          count: iso + slash,
          examples: present.filter((v) => DATE_SLASH.test(v)).slice(0, 3)
        });
      }
    }
    const near = nearDuplicates(present);
    if (near.length > 0 && (type === "category" || type === "text")) {
      issues.push({
        kind: "inconsistent-values",
        severity: "medium",
        title: `${name} spells the same value more than one way`,
        detail: "These differ only by case, spacing or punctuation. Any group-by or join treats them as separate things, which is how totals quietly go missing.",
        column: name,
        count: near.length,
        examples: near.slice(0, 2).map((s) => [...s].join("   vs   "))
      });
    }
    const padded = present.filter((v) => v !== v.trim()).length;
    if (padded > 0) {
      issues.push({
        kind: "whitespace",
        severity: "low",
        title: `${name} has ${padded} value${padded === 1 ? "" : "s"} with stray spaces`,
        detail: "Invisible on screen, and enough to break an exact match or a lookup.",
        column: name,
        count: padded,
        examples: []
      });
    }
  }
  const order = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity] || b.count - a.count);
  return { rows: rows.length, columns, issues, duplicateRows };
}
function clean(rows, prof) {
  var _a;
  const names = prof.columns.map((c) => c.name);
  const numericCols = new Set(
    prof.columns.filter((c) => c.type === "number" || c.type === "integer").map((c) => c.name)
  );
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const r of rows) {
    const cleaned = {};
    for (const n of names) {
      let v = ((_a = r[n]) != null ? _a : "").trim();
      if (isMissing(v)) {
        v = "";
      } else if (numericCols.has(n)) {
        const x = parseNumberish(v);
        if (x !== null)
          v = String(x);
      }
      cleaned[n] = v;
    }
    const key = names.map((n) => cleaned[n].toLowerCase()).join(ROW_KEY_SEP);
    if (seen.has(key))
      continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}
function toCsv(rows) {
  if (rows.length === 0)
    return "";
  const names = Object.keys(rows[0]);
  const esc = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [
    names.join(","),
    ...rows.map((r) => names.map((n) => {
      var _a;
      return esc((_a = r[n]) != null ? _a : "");
    }).join(","))
  ].join("\n");
}
var MESSY_SAMPLE = [
  "Part No,Material,Size,Qty,Unit Price,Order Date",
  'A-1001,AL 6061-T6,"120 x 60 x 20 mm",250,"\u20AC12,50",2026-01-14',
  'A-1002,al 6061 t6,"4.72"" x 2.36""",250,13.75,14/01/2026',
  'A-1003,AL6061T6 ,"120x60x20",N/A,"\u20AC12,50",2026-01-15',
  'A-1004,Ti-6Al-4V,"\xD840 x 120",1000,48.20,2026-02-01',
  'A-1005,TI6AL4V,"\xD840 x 120",1 000,"48,20",02/02/2026',
  'A-1004,Ti-6Al-4V,"\xD840 x 120",1000,48.20,2026-02-01',
  'A-1006,Stainless 316L,"200 x 80 x 15 mm",TBC,,2026-02-11',
  'A-1007,316L,"200 x 80 x 15",500,"1.234,00",11/02/2026',
  'A-1008,  316L  ,"7.87"" x 3.15""",500,1234.00,2026-02-12'
].join("\n");

// src/lib/unit-economics.ts
function evaluate(m) {
  const variableCostPerUnit = m.variableCosts.reduce((a, c) => a + (c.perUnit || 0), 0);
  const contributionPerUnit = m.pricePerUnit - variableCostPerUnit;
  const revenue = m.pricePerUnit * m.volumePerPeriod;
  const variableCosts = variableCostPerUnit * m.volumePerPeriod;
  const grossContribution = contributionPerUnit * m.volumePerPeriod;
  const profit = grossContribution - m.fixedCostsPerPeriod;
  const impossible = contributionPerUnit <= 0;
  const breakEvenVolume = impossible ? null : m.fixedCostsPerPeriod / contributionPerUnit;
  const breakEvenRevenue = breakEvenVolume === null ? null : breakEvenVolume * m.pricePerUnit;
  return {
    variableCostPerUnit,
    contributionPerUnit,
    contributionRatio: m.pricePerUnit > 0 ? contributionPerUnit / m.pricePerUnit : 0,
    revenue,
    variableCosts,
    grossContribution,
    profit,
    breakEvenVolume,
    breakEvenRevenue,
    marginOfSafety: breakEvenVolume === null || m.volumePerPeriod <= 0 ? null : (m.volumePerPeriod - breakEvenVolume) / m.volumePerPeriod,
    capacityUtilisation: m.capacityPerPeriod && m.capacityPerPeriod > 0 ? m.volumePerPeriod / m.capacityPerPeriod : null,
    impossible
  };
}
function inputs(m) {
  const list = [
    {
      name: "Price per unit",
      get: (x) => x.pricePerUnit,
      set: (x, v) => __spreadProps(__spreadValues({}, x), { pricePerUnit: v })
    },
    {
      name: "Volume",
      get: (x) => x.volumePerPeriod,
      set: (x, v) => __spreadProps(__spreadValues({}, x), { volumePerPeriod: v })
    },
    {
      name: "Fixed costs",
      get: (x) => x.fixedCostsPerPeriod,
      set: (x, v) => __spreadProps(__spreadValues({}, x), { fixedCostsPerPeriod: v })
    }
  ];
  m.variableCosts.forEach((c, i) => {
    list.push({
      name: c.name || `Variable cost ${i + 1}`,
      get: (x) => {
        var _a, _b;
        return (_b = (_a = x.variableCosts[i]) == null ? void 0 : _a.perUnit) != null ? _b : 0;
      },
      set: (x, v) => __spreadProps(__spreadValues({}, x), {
        variableCosts: x.variableCosts.map((y, j) => j === i ? __spreadProps(__spreadValues({}, y), { perUnit: v }) : y)
      })
    });
  });
  return list;
}
function sensitivity(m, pct = 0.2) {
  const base = evaluate(m).profit;
  const out = inputs(m).map(({ name, get, set }) => {
    const v = get(m);
    const low = evaluate(set(m, v * (1 - pct))).profit;
    const high = evaluate(set(m, v * (1 + pct))).profit;
    return {
      input: name,
      low,
      high,
      swing: Math.abs(high - low),
      breakEvenValue: solveForZero(m, get, set)
    };
  });
  out.sort((a, b) => b.swing - a.swing);
  return out;
}
function solveForZero(m, get, set) {
  const v0 = get(m);
  if (!Number.isFinite(v0))
    return null;
  const f = (v) => evaluate(set(m, v)).profit;
  let lo = 0;
  let hi = Math.max(v0 * 4, v0 + 1, 1);
  const flo = f(lo);
  const fhi = f(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi))
    return null;
  if (flo === 0)
    return lo;
  if (fhi === 0)
    return hi;
  if (flo > 0 === fhi > 0)
    return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (fm === 0)
      return mid;
    if (fm > 0 === flo > 0)
      lo = mid;
    else
      hi = mid;
  }
  return (lo + hi) / 2;
}
function forecast(history, horizon = 6, alpha = 0.5, beta = 0.3) {
  const clean2 = history.filter((v) => Number.isFinite(v));
  if (clean2.length < 3) {
    return { fitted: [], points: [], mae: 0, method: "not enough history", usable: false };
  }
  let level = clean2[0];
  let trend = clean2[1] - clean2[0];
  const fitted = [clean2[0]];
  const errors = [];
  for (let t = 1; t < clean2.length; t++) {
    const predicted = level + trend;
    fitted.push(predicted);
    errors.push(clean2[t] - predicted);
    const prevLevel = level;
    level = alpha * clean2[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const mae = errors.length ? errors.reduce((a, e) => a + Math.abs(e), 0) / errors.length : 0;
  const sd = errors.length ? Math.sqrt(errors.reduce((a, e) => a + e * e, 0) / errors.length) : 0;
  const points = Array.from({ length: horizon }, (_, i) => {
    const h = i + 1;
    const value = level + h * trend;
    const spread = 1.96 * sd * Math.sqrt(h);
    return {
      period: clean2.length + h,
      value,
      low: value - spread,
      high: value + spread
    };
  });
  return {
    fitted,
    points,
    mae,
    method: "Holt's linear trend, 95% interval from the model's own one-step errors",
    usable: true
  };
}
var PRESETS = [
  {
    id: "collection",
    label: "Waste collection round",
    note: "Modelled on a real engagement. The payload assumption is the one everything turned on \u2014 try moving it and watch the sensitivity order change.",
    model: {
      currency: "\u20AC",
      unitName: "tonne collected",
      unitPlural: "tonnes collected",
      periodName: "month",
      pricePerUnit: 210,
      variableCosts: [
        { id: "v1", name: "Disposal gate fee", perUnit: 46 },
        { id: "v2", name: "Fuel", perUnit: 38 },
        { id: "v3", name: "Driver hours", perUnit: 52 },
        { id: "v4", name: "Vehicle maintenance", perUnit: 14 }
      ],
      fixedCostsPerPeriod: 11500,
      volumePerPeriod: 240,
      capacityPerPeriod: 300
    },
    history: [181, 192, 188, 205, 211, 203, 219, 228, 222, 235, 241, 240]
  },
  {
    id: "machined-part",
    label: "Machined part, contract manufacturing",
    note: "A should-cost view of a single part: material, machine time, setup amortised over the batch, finishing. Useful for seeing how badly a small batch hurts.",
    model: {
      currency: "\u20AC",
      unitName: "part",
      unitPlural: "parts",
      periodName: "month",
      pricePerUnit: 48,
      variableCosts: [
        { id: "v1", name: "Raw material", perUnit: 12.4 },
        { id: "v2", name: "Machine time", perUnit: 16.8 },
        { id: "v3", name: "Setup, amortised", perUnit: 3.2 },
        { id: "v4", name: "Finishing and treatment", perUnit: 4.1 },
        { id: "v5", name: "Scrap allowance", perUnit: 1.9 }
      ],
      fixedCostsPerPeriod: 18e3,
      volumePerPeriod: 2400,
      capacityPerPeriod: 3200
    },
    history: [1780, 1920, 2010, 1890, 2140, 2260, 2180, 2310, 2290, 2375, 2410, 2400]
  },
  {
    id: "subscription",
    label: "Subscription product",
    note: "Where the fixed base is large and the variable cost is small, volume dominates everything \u2014 which the sensitivity ordering shows immediately.",
    model: {
      currency: "\u20AC",
      unitName: "subscriber",
      unitPlural: "subscribers",
      periodName: "month",
      pricePerUnit: 39,
      variableCosts: [
        { id: "v1", name: "Hosting and infrastructure", perUnit: 2.1 },
        { id: "v2", name: "Payment processing", perUnit: 1.3 },
        { id: "v3", name: "Support", perUnit: 4.6 }
      ],
      fixedCostsPerPeriod: 42e3,
      volumePerPeriod: 1600
    },
    history: [980, 1065, 1140, 1190, 1255, 1310, 1388, 1420, 1495, 1540, 1572, 1600]
  }
];
export {
  AlloyTable,
  DEFAULTS,
  MESSY_SAMPLE,
  PRESETS,
  ROTATIONAL_FAMILIES,
  clean,
  decodeCatalogue,
  enrichAll,
  enrichRow,
  evaluate,
  forecast,
  gradeKey,
  mapColumns,
  parseDelimited,
  parseDimensions,
  profile,
  readSpreadsheet,
  sensitivity,
  shapeFor,
  stockVolumeCm3,
  toCsv
};
