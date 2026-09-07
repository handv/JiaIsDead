export const LINE_INK = "#8f2d2a";
export const LINE_WIFE = LINE_INK;
export const LINE_CE = LINE_INK;
export const LINE_KIN = LINE_INK;

export function lineColor() {
  return LINE_INK;
}

export function parentsOf(slot, slots) {
  const byId = new Map(slots.map((item) => [item.id, item]));
  if (slot.coupleOf) return null;
  if (slot.parentSlot && byId.has(slot.parentSlot)) {
    const parents = [slot.parentSlot];
    if (Object.hasOwn(slot, "motherSlot")) {
      if (slot.motherSlot && byId.has(slot.motherSlot)) {
        parents.push(slot.motherSlot);
      }
    } else {
      const partner = slots.find((item) => item.coupleOf === slot.parentSlot);
      if (partner) parents.push(partner.id);
    }
    return { from: parents, to: slot.id, kind: "child" };
  }
  if (slot.kinOf && byId.has(slot.kinOf)) {
    const parent = byId.get(slot.kinOf);
    const kind = parent.generation === slot.generation ? "side" : "child";
    return { from: [slot.kinOf], to: slot.id, kind };
  }
  return null;
}

export function treeEdges(slots) {
  return slots.map((slot) => parentsOf(slot, slots)).filter(Boolean);
}

export function groupEdges(edges) {
  const groups = new Map();
  for (const edge of edges) {
    const parents = [...edge.from];
    const key = `${parents.slice().sort().join("+")}:${edge.kind}`;
    if (!groups.has(key)) {
      groups.set(key, { from: parents, kind: edge.kind, to: [] });
    }
    groups.get(key).to.push(edge.to);
  }
  return [...groups.values()];
}

export function parentKey(ids) {
  return [...ids].sort().join("+");
}

export function clusterMid(boxes) {
  const left = Math.min(...boxes.map((box) => box.x));
  const right = Math.max(...boxes.map((box) => box.x + box.w));
  return (left + right) / 2;
}

function boxOf(root, id) {
  const node = root.querySelector(`[data-tree-id="${id}"]`);
  if (!node) return null;
  const origin = root.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    w: rect.width,
    h: rect.height,
  };
}

function midOf(root, ids) {
  const boxes = ids.map((id) => boxOf(root, id)).filter(Boolean);
  if (!boxes.length) return null;
  return clusterMid(boxes);
}

function setTranslateX(node, tx) {
  if (!node) return;
  node.style.transform = Math.abs(tx) < 0.5 ? "" : `translateX(${Math.round(tx)}px)`;
}

function resetAlignments(root) {
  root.querySelectorAll(".couple, .tkids, [data-tree-id]").forEach((node) => {
    node.style.transform = "";
  });
}

function coupleIds(couple) {
  return [...couple.querySelectorAll("[data-tree-id]")].map((node) => node.getAttribute("data-tree-id"));
}

function coupleMatches(couple, ids) {
  const have = coupleIds(couple);
  return ids.every((id) => have.includes(id)) && have.every((id) => ids.includes(id));
}

function kidsRowForParents(root, parentIds) {
  const first = root.querySelector(`[data-tree-id="${parentIds[0]}"]`);
  const couple = first?.closest(".couple");
  if (!couple || !coupleMatches(couple, parentIds)) return null;
  return couple.parentElement?.querySelector(":scope > .tkids") ?? null;
}

function directKidsRow(root, parentId, childIds) {
  const parent = root.querySelector(`[data-tree-id="${parentId}"]`);
  const kids = parent?.closest(".tstem")?.querySelector(":scope > .tkids");
  if (!parent || !kids) return null;
  const allDirect = childIds.every((id) => {
    const node = kids.querySelector(`[data-tree-id="${id}"]`);
    const wrapper = node?.closest(".tkid");
    return wrapper?.parentElement === kids;
  });
  return allDirect ? kids : null;
}

export function alignTreeLayout(root, groups) {
  resetAlignments(root);
  const pairs = groups.filter((group) => group.kind === "child" && group.from.length >= 2);

  for (const group of pairs) {
    if (group.to.length !== 1) continue;
    const parentMid = midOf(root, group.from);
    const childMid = midOf(root, group.to);
    if (parentMid == null || childMid == null) continue;
    const kids = kidsRowForParents(root, group.from);
    if (kids) setTranslateX(kids, parentMid - childMid);
  }

  const coupleGroups = new Map();
  for (const group of pairs) {
    const couple = root.querySelector(`[data-tree-id="${group.from[0]}"]`)?.closest(".couple");
    if (!couple) continue;
    if (!coupleGroups.has(couple)) coupleGroups.set(couple, []);
    coupleGroups.get(couple).push(group);
  }

  for (const [couple, list] of coupleGroups) {
    if (list.length < 2) continue;
    const later = list
      .map((group) => ({
        group,
        parentMid: midOf(root, group.from),
        childMid: midOf(root, group.to),
      }))
      .filter((item) => item.parentMid != null && item.childMid != null)
      .sort((a, b) => b.childMid - a.childMid)[0];
    if (later) setTranslateX(couple, later.childMid - later.parentMid);
  }

  const exclusive = [...coupleGroups.entries()].filter(([, list]) => list.length === 1);
  exclusive.sort((a, b) => b[0].getBoundingClientRect().top - a[0].getBoundingClientRect().top);
  for (const [couple, list] of exclusive) {
    const group = list[0];
    const parentMid = midOf(root, group.from);
    const childMid = midOf(root, group.to);
    if (parentMid == null || childMid == null) continue;
    setTranslateX(couple, childMid - parentMid);
  }

  const singles = groups.filter((group) => group.kind === "child" && group.from.length === 1);
  singles.sort((a, b) => {
    const ay = boxOf(root, a.from[0])?.y ?? 0;
    const by = boxOf(root, b.from[0])?.y ?? 0;
    return by - ay;
  });
  for (const group of singles) {
    const parent = root.querySelector(`[data-tree-id="${group.from[0]}"]`);
    if (!parent) continue;
    const parentMid = midOf(root, group.from);
    const childMid = midOf(root, group.to);
    if (parentMid == null || childMid == null) continue;
    if (parent.closest(".couple")) {
      const kids = directKidsRow(root, group.from[0], group.to);
      if (kids) setTranslateX(kids, parentMid - childMid);
      continue;
    }
    setTranslateX(parent, childMid - parentMid);
  }
}

function midX(box) {
  return box.x + box.w / 2;
}

function midY(box) {
  return box.y + box.h / 2;
}

function bottom(box) {
  return box.y + box.h;
}

function right(box) {
  return box.x + box.w;
}

function gapX(a, b) {
  if (a.x < b.x) return b.x - right(a);
  return a.x - right(b);
}

function sameRow(a, b, tolerance) {
  return Math.abs(a.y - b.y) <= tolerance;
}

function adjacentOnRow(a, b, adjacentGap, sameRowTol) {
  return sameRow(a, b, sameRowTol) && gapX(a, b) <= adjacentGap;
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function polyline(points) {
  return points
    .map((point, index) => {
      const x = round(point[0]);
      const y = round(point[1]);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");
}

function parentBoxes(group, boxes) {
  const ids = Array.isArray(group.from) ? group.from : [group.from];
  return ids.map((id) => ({ id, box: boxes[id] })).filter((item) => item.box);
}

export function linePaths(groups, boxes, options = {}) {
  const adjacentGap = options.adjacentGap ?? 8;
  const sameRowTol = options.sameRow ?? 24;
  const skipGap = options.skipGap ?? 80;
  const slots = options.slots ?? [];
  const shareCount = new Map();
  for (const group of groups) {
    if (group.kind !== "child") continue;
    const ids = Array.isArray(group.from) ? group.from : [group.from];
    if (ids.length < 2) continue;
    for (const id of ids) {
      shareCount.set(id, (shareCount.get(id) ?? 0) + 1);
    }
  }
  const paths = [];

  function stroke(group) {
    return lineColor(group, slots);
  }

  function parentDropX(box, parentId, group) {
    const base = midX(box);
    if ((shareCount.get(parentId) ?? 0) < 2) return base;
    const byId = new Map(slots.map((item) => [item.id, item]));
    const hasCe = (Array.isArray(group.from) ? group.from : [group.from]).some(
      (id) => byId.get(id)?.role === "侧室",
    );
    return base + (hasCe ? 7 : -7);
  }

  for (const group of groups) {
    const parents = parentBoxes(group, boxes);
    if (!parents.length) continue;
    const children = group.to.map((id) => boxes[id]).filter(Boolean);
    if (!children.length) continue;
    const parentKey = parents.map((item) => item.id).join("+");

    if (group.kind === "side") {
      const parent = parents[0].box;
      group.to.forEach((id) => {
        const child = boxes[id];
        if (!child || adjacentOnRow(parent, child, adjacentGap, sameRowTol)) return;
        const y = midY(parent);
        const fromX = child.x >= right(parent) ? right(parent) : parent.x;
        const toX = child.x >= right(parent) ? child.x : right(child);
        paths.push({
          key: `${parentKey}-${id}-side`,
          color: stroke(group),
          d: polyline([
            [fromX, y],
            [toX, y],
          ]),
        });
      });
      continue;
    }

    const lowestParent = Math.max(...parents.map((item) => bottom(item.box)));
    const highestChild = Math.min(...children.map((child) => child.y));
    const drop = highestChild - lowestParent;

    if (drop > skipGap && parents.length === 1 && children.length === 1) {
      const parent = parents[0].box;
      const child = children[0];
      const cx = midX(child);
      const py = midY(parent);
      if (cx > right(parent)) {
        paths.push({
          key: `${parentKey}-${group.to[0]}-skip`,
          color: stroke(group),
          d: polyline([
            [right(parent), py],
            [cx, py],
            [cx, child.y],
          ]),
        });
      } else if (cx < parent.x) {
        paths.push({
          key: `${parentKey}-${group.to[0]}-skip`,
          color: stroke(group),
          d: polyline([
            [parent.x, py],
            [cx, py],
            [cx, child.y],
          ]),
        });
      } else {
        paths.push({
          key: `${parentKey}-${group.to[0]}-skip`,
          color: stroke(group),
          d: polyline([
            [midX(parent), bottom(parent)],
            [cx, child.y],
          ]),
        });
      }
      continue;
    }

    const gap = highestChild - lowestParent;
    const parentXs = parents.map((item) => midX(item.box));
    const childXs = children.map((child) => midX(child));

    if (parents.length >= 2) {
      const byId = new Map(slots.map((item) => [item.id, item]));
      const hasCe = parents.some((item) => byId.get(item.id)?.role === "侧室");
      const mergeY = lowestParent + gap * (hasCe ? 0.55 : 0.32);
      const railY = lowestParent + gap * (hasCe ? 0.82 : 0.52);
      const dropXs = parents.map((item) => parentDropX(item.box, item.id, group));
      const mergeX = dropXs.reduce((sum, x) => sum + x, 0) / dropXs.length;
      const parts = parents.map((item, index) =>
        polyline([
          [dropXs[index], bottom(item.box)],
          [dropXs[index], mergeY],
          [mergeX, mergeY],
        ]),
      );
      parts.push(
        polyline([
          [mergeX, mergeY],
          [mergeX, railY],
        ]),
      );
      const railLeft = Math.min(mergeX, ...childXs);
      const railRight = Math.max(mergeX, ...childXs);
      if (railRight - railLeft > 0.5) {
        parts.push(
          polyline([
            [railLeft, railY],
            [railRight, railY],
          ]),
        );
      }
      children.forEach((child) => {
        parts.push(
          polyline([
            [midX(child), railY],
            [midX(child), child.y],
          ]),
        );
      });
      paths.push({
        key: `${parentKey}-children`,
        color: stroke(group),
        d: parts.join(" "),
      });
      continue;
    }

    const railY = (lowestParent + highestChild) / 2;
    const parentX = parentXs[0];
    const railLeft = Math.min(parentX, ...childXs);
    const railRight = Math.max(parentX, ...childXs);
    const parts = [
      polyline([
        [parentX, lowestParent],
        [parentX, railY],
      ]),
    ];
    if (railRight - railLeft > 0.5) {
      parts.push(
        polyline([
          [railLeft, railY],
          [railRight, railY],
        ]),
      );
    }
    children.forEach((child) => {
      parts.push(
        polyline([
          [midX(child), railY],
          [midX(child), child.y],
        ]),
      );
    });
    paths.push({
      key: `${parentKey}-children`,
      color: stroke(group),
      d: parts.join(" "),
    });
  }

  return paths;
}
