import { Circle, Line, Path, Rect, Textbox } from "fabric";

const SERIALIZED_PROPS = [
  "left",
  "top",
  "width",
  "height",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeDashArray",
  "strokeLineCap",
  "strokeLineJoin",
  "strokeMiterLimit",
  "scaleX",
  "scaleY",
  "angle",
  "flipX",
  "flipY",
  "opacity",
  "shadow",
  "visible",
  "fillRule",
  "globalCompositeOperation",
  "skewX",
  "skewY",
  "originX",
  "originY",
  "radius",
  "x1",
  "y1",
  "x2",
  "y2",
  "text",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "underline",
  "linethrough",
  "overline",
  "charSpacing",
  "lineHeight",
  "backgroundColor",
  "textBackgroundColor",
  "direction",
  "paintFirst",
];

export function createObjectId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `object_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

export function ensureObjectId(object) {
  if (object.objectId) {
    return object.objectId;
  }

  const objectId = createObjectId();

  if (typeof object.set === "function") {
    object.set("objectId", objectId);
  } else {
    object.objectId = objectId;
  }

  return objectId;
}

function getSerializedProps(object) {
  const props = {};

  for (const prop of SERIALIZED_PROPS) {
    if (object[prop] !== undefined) {
      props[prop] =
        prop === "shadow" && object.shadow?.toObject
          ? object.shadow.toObject()
          : object[prop];
    }
  }

  return props;
}

export function serializeObject(object) {
  const data = {
    type: object.type,
    objectId: ensureObjectId(object),
    props: getSerializedProps(object),
  };

  if (object.type === "path") {
    data.pathData = (object.path || []).map((cmd) => cmd.slice());
  }

  return data;
}

function getInteractiveDefaults() {
  return {
    selectable: false,
    evented: false,
    hasControls: true,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: false,
    lockScalingY: false,
  };
}

function buildObject(type, props, pathData) {
  switch (type) {
    case "path":
      return new Path(pathData || [], props);
    case "rect":
      return new Rect(props);
    case "circle":
      return new Circle(props);
    case "line":
      return new Line([props.x1, props.y1, props.x2, props.y2], props);
    case "textbox":
      return new Textbox(props.text || "", props);
    default:
      return null;
  }
}

export function deserializeObject(data) {
  const type = data?.type;
  const props = data?.props || {};
  const legacyProps = { ...data };
  delete legacyProps.type;
  delete legacyProps.pathData;
  delete legacyProps.props;

  const object = buildObject(
    type,
    {
      ...(data?.props ? props : legacyProps),
      ...getInteractiveDefaults(),
    },
    data?.pathData
  );

  if (!object) {
    return null;
  }

  ensureObjectId(object);
  return object;
}

export const serializePath = serializeObject;
export const deserializePath = deserializeObject;
