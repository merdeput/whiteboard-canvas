import { Path } from "fabric";

const PATH_PROPS = [
  'left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth',
  'strokeDashArray', 'strokeLineCap', 'strokeLineJoin', 'strokeMiterLimit',
  'scaleX', 'scaleY', 'angle', 'flipX', 'flipY', 'opacity', 'shadow',
  'visible', 'fillRule', 'globalCompositeOperation', 'skewX', 'skewY',
  'originX', 'originY',
];

function ensureObjectId(path) {
  if (path.objectId) {
    return path.objectId;
  }

  const objectId =
    globalThis.crypto?.randomUUID?.() ||
    `object_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  if (typeof path.set === "function") {
    path.set("objectId", objectId);
  } else {
    path.objectId = objectId;
  }

  return objectId;
}

export function serializePath(path) {
  const data = {
    type: 'path',
    objectId: ensureObjectId(path),
    pathData: (path.path || []).map((cmd) => cmd.slice()),
  };

  for (const prop of PATH_PROPS) {
    if (path[prop] !== undefined) {
      data[prop] = prop === 'shadow' && path.shadow?.toObject
        ? path.shadow.toObject()
        : path[prop];
    }
  }

  return data;
}

export function deserializePath(data) {
  const { pathData, type, ...options } = data;
  return new Path(pathData, {
    ... options,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
  });
}
