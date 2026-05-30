import cv2
import numpy as np


def draw_detections(frame, predictions, color=(0, 255, 0)):
	"""Draw bounding boxes and labels on a frame.
	predictions: list of {x,y,width,height,class,confidence} in pixel coords.
	"""
	h, w = frame.shape[:2]
	for p in predictions:
		# Roboflow returns center x,y and width,height in pixels
		cx, cy = p.get('x', 0), p.get('y', 0)
		bw, bh = p.get('width', 0), p.get('height', 0)
		x1 = int(max(cx - bw/2, 0))
		y1 = int(max(cy - bh/2, 0))
		x2 = int(min(cx + bw/2, w-1))
		y2 = int(min(cy + bh/2, h-1))
		cls = p.get('class', 'obj')
		conf = p.get('confidence', 0)
		cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
		label = f"{cls} {conf:.2f}"
		(tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
		cv2.rectangle(frame, (x1, max(y1-20, 0)), (x1 + tw + 6, max(y1-20, 0) + th + 6), (0,0,0), -1)
		cv2.putText(frame, label, (x1+3, max(y1-5, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
	return frame
