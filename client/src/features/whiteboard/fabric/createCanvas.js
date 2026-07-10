import { Canvas } from "fabric";

function createCanvas(element) {
  return new Canvas(element, {
    backgroundColor: "#faf7eb",
    preserveObjectStacking: true,
    selection: true,
    enableRetinaScaling: true,
  });
}

export default createCanvas;
