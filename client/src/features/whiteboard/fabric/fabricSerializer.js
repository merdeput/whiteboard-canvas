import { Path } from "fabric";

const PATH_PROPS = [
  'left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth',
  'strokeDashArray', 'strokeLineCap', 'strokeLineJoin', 'strokeMiterLimit',
  'scaleX', 'scaleY', 'angle', 'flipX', 'flipY', 'opacity', 'shadow',
  'visible', 'fillRule', 'globalCompositeOperation', 'skewX', 'skewY',
  'originX', 'originY',
];

export function serializePath(path) {
  const data = {
    type: 'path',
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
