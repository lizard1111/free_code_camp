const rows = window.REGION_DATA;
const byId = new Map(rows.map((row) => [row.region_id, row]));
const children = new Map();
for (const row of rows) {
  const parent = Number.isFinite(row.parent_structure_id) ? row.parent_structure_id : null;
  if (!children.has(parent)) children.set(parent, []);
  children.get(parent).push(row.region_id);
}

const collapsed = new Set();
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const volumeFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const searchInput = document.querySelector("#searchInput");
const depthSelect = document.querySelector("#depthSelect");
const populatedOnly = document.querySelector("#populatedOnly");
const tableBody = document.querySelector("#tableBody");
const visibleCount = document.querySelector("#visibleCount");
const emptyState = document.querySelector("#emptyState");

const maxDepth = Math.max(...rows.map((row) => row.depth));
depthSelect.innerHTML = `<option value="${maxDepth}">All depths</option>` +
  Array.from({ length: maxDepth + 1 }, (_, depth) => `<option value="${depth}">${depth}</option>`).join("");

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

function textColorFor(background) {
  const [r, g, b] = hexToRgb(background);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 138 ? "#ffffff" : "#101719";
}

function isHiddenByCollapse(row) {
  let parentId = row.parent_structure_id;
  while (Number.isFinite(parentId)) {
    if (collapsed.has(parentId)) return true;
    parentId = byId.get(parentId)?.parent_structure_id;
  }
  return false;
}

function filteredRows() {
  const query = searchInput.value.trim().toLowerCase();
  const depth = Number(depthSelect.value);
  return rows.filter((row) => {
    if (row.depth > depth || (populatedOnly.checked && row.direct_cell_count === 0)) return false;
    if (!query && isHiddenByCollapse(row)) return false;
    if (!query) return true;
    return `${row.region_name} ${row.acronym} ${row.region_id}`.toLowerCase().includes(query);
  });
}

function render() {
  const visible = filteredRows();
  tableBody.innerHTML = visible.map((row) => {
    const hasChildren = (children.get(row.region_id) || []).length > 0;
    return `<tr>
      <td class="region-cell" style="--depth:${row.depth};background:${row.atlas_color_hex};color:${textColorFor(row.atlas_color_hex)}">
        <div class="region-wrap">
          <button class="tree-toggle" data-id="${row.region_id}" ${hasChildren ? "" : "disabled"} title="${collapsed.has(row.region_id) ? "Expand" : "Collapse"} region">${hasChildren ? (collapsed.has(row.region_id) ? "+" : "−") : ""}</button>
          <span class="region-name" title="${row.region_name} · atlas color ${row.atlas_color_hex}">${row.region_name}</span>
        </div>
      </td>
      <td>${row.acronym}</td>
      <td>${row.region_id}</td>
      <td>${numberFormat.format(row.direct_cell_count)}</td>
      <td>${volumeFormat.format(row.direct_region_volume_mm3)}</td>
      <td>${numberFormat.format(row.direct_cell_density_per_mm3 || 0)}</td>
      <td>${numberFormat.format(row.hierarchy_inclusive_cell_count)}</td>
      <td>${numberFormat.format(row.hierarchy_inclusive_density_per_mm3 || 0)}</td>
    </tr>`;
  }).join("");
  visibleCount.textContent = `${numberFormat.format(visible.length)} of ${numberFormat.format(rows.length)} annotation-present regions shown`;
  emptyState.hidden = visible.length !== 0;
}

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".tree-toggle");
  if (!button || button.disabled) return;
  const id = Number(button.dataset.id);
  collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id);
  render();
});

for (const control of [searchInput, depthSelect, populatedOnly]) {
  control.addEventListener("input", render);
}
document.querySelector("#expandButton").addEventListener("click", () => { collapsed.clear(); render(); });
document.querySelector("#collapseButton").addEventListener("click", () => {
  for (const [id, childIds] of children) if (id !== null && childIds.length) collapsed.add(id);
  render();
});
document.querySelector("#downloadButton").addEventListener("click", () => {
  const visible = filteredRows();
  const columns = ["region_id", "acronym", "region_name", "depth", "parent_structure_id", "direct_cell_count", "direct_region_volume_mm3", "direct_cell_density_per_mm3", "hierarchy_inclusive_cell_count", "hierarchy_inclusive_volume_mm3", "hierarchy_inclusive_density_per_mm3", "atlas_color_hex"];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.join(","), ...visible.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "42_sal_filtered_cell_regions.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#regionCount").textContent = numberFormat.format(rows.length);
render();
