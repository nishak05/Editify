import numpy as np

SEMANTIC_REJECT = {
    "background", "wall", "sky", "floor", "ground",
    "ceiling", "road", "pavement", "surface"
}

MIN_AREA_FRACTION = 0.001
MAX_AREA_FRACTION = 0.80
DUPLICATE_IOU_THRESHOLD = 0.70


def compute_iou(a, b):
    ax2 = a["x"] + a["w"]
    ay2 = a["y"] + a["h"]
    bx2 = b["x"] + b["w"]
    by2 = b["y"] + b["h"]

    ix1 = max(a["x"], b["x"])
    iy1 = max(a["y"], b["y"])
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)

    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0

    intersection = (ix2 - ix1) * (iy2 - iy1)
    union = a["w"] * a["h"] + b["w"] * b["h"] - intersection
    return intersection / union if union > 0 else 0.0


def is_fully_inside(inner, outer):
    return (
        inner["x"] >= outer["x"] and
        inner["y"] >= outer["y"] and
        inner["x"] + inner["w"] <= outer["x"] + outer["w"] and
        inner["y"] + inner["h"] <= outer["y"] + outer["h"]
    )


def semantic_filter(proposals):
    accepted, rejected = [], []
    for p in proposals:
        label = p.get("label", "").lower().strip()
        if label in SEMANTIC_REJECT:
            rejected.append((p, "semantic"))
        else:
            accepted.append(p)
    return accepted, rejected


def area_filter(proposals, img_w, img_h):
    image_area = img_w * img_h
    accepted, rejected = [], []
    for p in proposals:
        fraction = (p["w"] * p["h"]) / image_area
        if fraction < MIN_AREA_FRACTION:
            rejected.append((p, "too small"))
        elif fraction > MAX_AREA_FRACTION:
            rejected.append((p, "too large"))
        else:
            accepted.append(p)
    return accepted, rejected


def deduplicate(proposals):
    kept, rejected = [], []
    for candidate in proposals:
        duplicate = False
        for accepted in kept:
            if compute_iou(candidate, accepted) > DUPLICATE_IOU_THRESHOLD:
                duplicate = True
                break
        if duplicate:
            rejected.append((candidate, "duplicate"))
        else:
            kept.append(candidate)
    return kept, rejected


def container_filter(proposals):
    accepted, rejected = [], []
    for i, candidate in enumerate(proposals):
        others = [p for j, p in enumerate(proposals) if j != i]
        children_inside = sum(1 for o in others if is_fully_inside(o, candidate))
        if children_inside >= 2:
            rejected.append((candidate, "container"))
        else:
            accepted.append(candidate)
    return accepted, rejected


def reject_text_inside_objects(text_proposals, accepted_objects):
    kept = []
    rejected = []

    for text in text_proposals:
        text_area = text["w"] * text["h"]

        remove = False

        for obj in accepted_objects:
            overlap = intersection_area(text, obj)

            if overlap / text_area >= 0.90:
                remove = True
                break

        if remove:
            rejected.append((text, "inside object"))
        else:
            kept.append(text)

    return kept, rejected


def compute_groups(layers):
    groups = []
    group_counter = 0
    annotated = [dict(l, group_id=None, group_role=None) for l in layers]

    for i, root in enumerate(annotated):
        children = []
        for j, other in enumerate(annotated):
            if i == j:
                continue
            if is_fully_inside(other, root):
                children.append(j)

        if not children:
            continue

        free = [j for j in children if annotated[j]["group_id"] is None]
        if not free:
            continue

        group_id    = f"group_{group_counter}"
        group_label = root.get("label") or root.get("text") or f"Group {group_counter}"
        group_counter += 1

        annotated[i]["group_id"]   = group_id
        annotated[i]["group_role"] = "root"
        for j in free:
            annotated[j]["group_id"]   = group_id
            annotated[j]["group_role"] = "child"

        groups.append({
            "id":    group_id,
            "label": group_label,
            "type":  "group",
        })

    return annotated, groups


def print_proposal_report(accepted, all_rejected):
    print("\n[PROPOSAL] ── Proposal Report ──────────────────")
    for p in accepted:
        label = p.get("label") or p.get("text", "")[:20]
        print(f"[PROPOSAL]   {label:<25} Accepted")
    for p, reason in all_rejected:
        label = p.get("label") or p.get("text", "")[:20]
        print(f"[PROPOSAL]   {label:<25} Rejected ({reason})")
    print("[PROPOSAL] ─────────────────────────────────────\n")

def reject_text_like_objects(object_proposals, text_proposals):
    kept = []
    rejected = []

    for obj in object_proposals:
        obj_area = obj["w"] * obj["h"]
        remove = False

        for text in text_proposals:
            overlap = intersection_area(obj, text)

            if overlap == 0:
                continue

            text_area = text["w"] * text["h"]

            text_inside = overlap / text_area
            object_is_text = overlap / obj_area

            if text_inside > 0.90 and object_is_text > 0.70:
                remove = True
                break

        if remove:
            rejected.append((obj, "text object"))
        else:
            kept.append(obj)

    return kept, rejected

def run_proposal_engine(object_proposals, text_proposals, img_w, img_h):
    all_rejected = []

    after_semantic, rej = semantic_filter(object_proposals)
    after_text, rej = reject_text_like_objects(after_semantic, text_proposals)
    all_rejected.extend(rej)

    after_area, rej = area_filter(after_text, img_w, img_h)
    all_rejected.extend(rej)

    after_dedup, rej = deduplicate(after_area)
    all_rejected.extend(rej)

    after_container, rej = container_filter(after_dedup)
    all_rejected.extend(rej)

    print_proposal_report(after_container, all_rejected)

    return after_container

def intersection_area(a, b):
    x1 = max(a["x"], b["x"])
    y1 = max(a["y"], b["y"])
    x2 = min(a["x"] + a["w"], b["x"] + b["w"])
    y2 = min(a["y"] + a["h"], b["y"] + b["h"])

    if x2 <= x1 or y2 <= y1:
        return 0

    return (x2 - x1) * (y2 - y1)