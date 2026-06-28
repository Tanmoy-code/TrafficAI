import os
import sys
import argparse
import json
import base64
import cv2
import numpy as np
from PIL import Image
import warnings

warnings.filterwarnings("ignore")

VEHICLE_CLASSES = {1: "bicycle", 2: "car", 3: "motorcycle", 5: "bus", 6: "train", 7: "truck"}

def compute_edge_sharpness(img_bgr: np.ndarray) -> dict:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Signal 1: Laplacian variance
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Signal 2: Canny edge density
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.0)
    edges = cv2.Canny(blurred, 30, 100)
    edge_density = edges.sum() / (255.0 * edges.size)
    
    # Signal 3: Sobel gradient mean
    sx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sx**2 + sy**2).mean()
    
    # Weighted score
    score = (0.5 * np.clip(lap_var / 300.0, 0, 1) +
             0.3 * np.clip(edge_density / 0.10, 0, 1) +
             0.2 * np.clip(mag / 40.0, 0, 1))
             
    return {
        "score": round(float(score), 4),
        "lap_var": round(float(lap_var), 2),
        "edge_density": round(float(edge_density), 5),
        "sobel_mean": round(float(mag), 2),
        "edges_img": edges,
        "gray": gray
    }

def classify_motion(image_bgr: np.ndarray, threshold: float = 0.90) -> dict:
    img = image_bgr.copy()
    h, w = img.shape[:2]
    if max(h, w) > 640:
        scale = 640.0 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
    metrics = compute_edge_sharpness(img)
    score = metrics["score"]
    raw_conf = abs(score - threshold) / max(threshold, 1.0 - threshold)
    confidence = round(float(np.clip(0.5 + raw_conf, 0.5, 0.99)), 3)
    label = "standing" if score >= threshold else "moving"
    
    return {
        "prediction": label,
        "confidence": confidence,
        "score": score,
        "threshold": threshold,
        "lap_var": metrics["lap_var"],
        "edge_density": metrics["edge_density"],
        "sobel_mean": metrics["sobel_mean"],
        "edges_img": metrics["edges_img"],
        "gray_img": metrics["gray"]
    }

def img_to_base64(img_bgr: np.ndarray, fmt: str = ".jpg") -> str:
    _, buffer = cv2.imencode(fmt, img_bgr)
    return base64.b64encode(buffer).decode("utf-8")

def run_pipeline(input_path, yolo_conf=0.30, motion_threshold=0.90, padding_percent=0.15, min_crop_px=120):
    if not os.path.exists(input_path):
        return {"error": f"Input file not found: {input_path}"}
        
    try:
        from ultralytics import YOLO
    except ImportError:
        return {"error": "ultralytics package not installed. Please run: pip install ultralytics"}

    img_bgr = cv2.imread(input_path)
    if img_bgr is None:
        return {"error": "Failed to read image file."}
        
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_h, img_w = img_bgr.shape[:2]
    
    model = YOLO("yolov8m.pt")
    results = model(input_path, conf=yolo_conf, iou=0.45, verbose=False)
    raw_boxes = results[0].boxes
    
    raw_dets = []
    for box in raw_boxes:
        cls_id = int(box.cls[0])
        if cls_id in VEHICLE_CLASSES:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            raw_dets.append({
                "label": VEHICLE_CLASSES[cls_id],
                "bbox": [x1, y1, x2, y2],
                "conf": round(float(box.conf[0]), 3)
            })
            
    pipeline_results = []
    moving_count = 0
    standing_count = 0
    
    annotated = img_rgb.copy()
    c_moving = (231, 76, 60)
    c_standing = (46, 204, 113)
    
    for i, det in enumerate(raw_dets):
        x1, y1, x2, y2 = det["bbox"]
        bw, bh = x2 - x1, y2 - y1
        
        pw = int(bw * padding_percent)
        ph = int(bh * padding_percent)
        nx1 = max(0, x1 - pw)
        ny1 = max(0, y1 - ph)
        nx2 = min(img_w, x2 + pw)
        ny2 = min(img_h, y2 + ph)
        
        crop_rgb = img_rgb[ny1:ny2, nx1:nx2].copy()
        crop_bgr = img_bgr[ny1:ny2, nx1:nx2].copy()
        
        ch, cw = crop_rgb.shape[:2]
        if min(ch, cw) < min_crop_px and min(ch, cw) > 0:
            scale = float(min_crop_px) / min(ch, cw)
            new_w = max(int(cw * scale), min_crop_px)
            new_h = max(int(ch * scale), min_crop_px)
            crop_rgb = cv2.resize(crop_rgb, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            crop_bgr = cv2.resize(crop_bgr, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            
        motion = classify_motion(crop_bgr, threshold=motion_threshold)
        if motion["prediction"] == "moving":
            moving_count += 1
            color = c_moving
        else:
            standing_count += 1
            color = c_standing
            
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)
        tag = f"#{i+1} {det['label']} | {motion['prediction'].upper()}"
        (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(annotated, tag, (x1 + 3, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        
        edges_colormap = cv2.applyColorMap(motion["edges_img"], cv2.COLORMAP_HOT)
        edges_colormap_rgb = cv2.cvtColor(edges_colormap, cv2.COLOR_BGR2RGB)
        
        pipeline_results.append({
            "id": i + 1,
            "vehicle": det["label"],
            "det_conf": det["conf"],
            "bbox": det["bbox"],
            "motion": motion["prediction"],
            "mot_conf": motion["confidence"],
            "score": motion["score"],
            "lap_var": motion["lap_var"],
            "edge_density": motion["edge_density"],
            "sobel_mean": motion["sobel_mean"],
            "crop_base64": img_to_base64(cv2.cvtColor(crop_rgb, cv2.COLOR_RGB2BGR)),
            "gray_base64": img_to_base64(motion["gray_img"]),
            "edges_base64": img_to_base64(cv2.cvtColor(edges_colormap_rgb, cv2.COLOR_RGB2BGR))
        })
        
    annotated_bgr = cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR)
    
    return {
        "success": True,
        "total_vehicles": len(pipeline_results),
        "moving_count": moving_count,
        "standing_count": standing_count,
        "annotated_image": img_to_base64(annotated_bgr),
        "vehicles": pipeline_results
    }

if __name__ == "__main__":
    real_stdout = sys.stdout
    sys.stdout = sys.stderr
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--input", required=True, help="Path to input traffic image")
        parser.add_argument("--yolo_conf", type=float, default=0.30)
        parser.add_argument("--motion_threshold", type=float, default=0.90)
        parser.add_argument("--padding_percent", type=float, default=0.15)
        parser.add_argument("--min_crop_px", type=int, default=120)
        
        args = parser.parse_args()
        
        res = run_pipeline(
            input_path=args.input,
            yolo_conf=args.yolo_conf,
            motion_threshold=args.motion_threshold,
            padding_percent=args.padding_percent,
            min_crop_px=args.min_crop_px
        )
    finally:
        sys.stdout = real_stdout
        
    print(json.dumps(res))
