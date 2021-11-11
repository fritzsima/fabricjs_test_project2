import { fabric } from "fabric";
import { Command } from "./Command";
import {
    CANVAS_OPTIONS,
    RECT_OPTIONS,
    SHAPE_CONFIG
} from './Constants'

const controlTypes = [
    "tl",
    "tr",
    "bl",
    "br",
    "pn",
    "pr"
];

fabric.Object.prototype.transparentCorners = false
fabric.Object.prototype.borderColor = "lightGreen"
fabric.Object.prototype.cornerColor = "lightGreen"
fabric.Object.prototype.cornerStyle = "circle"

export default class CanvasManager {
    constructor(id) {
        this.canvas = this.createCanvas(id, CANVAS_OPTIONS);
        this.addRect(this.canvas, RECT_OPTIONS);
        this.command = new Command(this.canvas);
    }

    undo = () => {
        this.command.undo((e) => {
            this.canvas._objects[0].controls = this.createControls();
            this.canvas.renderAll();
        });
    }

    redo = () => {
        this.command.redo((e) => {
            this.canvas._objects[0].controls = this.createControls();
            this.canvas.renderAll();
        });
    }

    createCanvas = (id, options) => {
        return new fabric.Canvas(id, options);
    }

    addRect = (canvas, options) => {
        const trianglePath = this.getRoundSVGPath(SHAPE_CONFIG.numVerts, SHAPE_CONFIG.cornerR);
        const triangle = new fabric.Path(trianglePath, {
            ...options,
            hasControls: true,
            strokeUniform: true,
            numVerts: SHAPE_CONFIG.numVerts,
            cornerR: SHAPE_CONFIG.cornerR,
        })
        triangle.controls = this.createControls();
        canvas.add(triangle);
        return triangle
    }

    createControls = () => (
        controlTypes.reduce((acc, type, index) => {
            acc[type] = new fabric.Control({
                actionName: type,
                positionHandler: this.polygonPositionHandler(type),
                actionHandler: this.polygonActionHandler(type),
            })
            return acc;
        }, {})
    )

    polygonPositionHandler = (type) => (dim, finalMatrix, fabricObject) => {
        let size = SHAPE_CONFIG.size;
        let point = new fabric.Point(0, 0);
        switch (type) {
            case "tl":
                point = new fabric.Point(-size / 2, -size / 2);
                break;
            case "tr":
                point = new fabric.Point(size / 2, -size / 2);
                break;
            case "bl":
                point = new fabric.Point(-size / 2, size / 2);
                break;
            case "br":
                point = new fabric.Point(size / 2, size / 2);
                break;
            case "pn":
                point = new fabric.Point(0, -size / 2 + fabricObject.cornerR);
                break;
            case "pr":
                const angle = -Math.PI / 2 + Math.PI * 2 / fabricObject.numVerts;
                point = new fabric.Point(
                    size / 2 * Math.cos(angle),
                    size / 2 * Math.sin(angle)
                );
                break;
        }
        return fabric.util.transformPoint(
            point,
            fabric.util.multiplyTransformMatrices(
                fabricObject.canvas.viewportTransform,
                fabricObject.calcTransformMatrix()
            )
        )
    }

    polygonActionHandler = (type) => (eventData, transform, x, y) => {
        const size = SHAPE_CONFIG.size;
        const fabricObject = transform.target;
        let width, height;
        switch (type) {
            case "tl":
                width = size * fabricObject.scaleX - x + fabricObject.left;
                height = size * fabricObject.scaleY - y + fabricObject.top;
                fabricObject.set({
                    scaleX: width / size,
                    scaleY: height / size,
                    left: width > 0 ? x : x + width,
                    top: height > 0 ? y : y + height
                });
                break;
            case "tr":
                width = x - fabricObject.left;
                height = size * fabricObject.scaleY - y + fabricObject.top;
                fabricObject.set({
                    scaleX: width / size,
                    scaleY: height / size,
                    left: width > 0 ? x - width : x,
                    top: height > 0 ? y : y + height
                });
                break;
            case "bl":
                width = size * fabricObject.scaleX - x + fabricObject.left;
                height = y - fabricObject.top;
                fabricObject.set({
                    scaleX: width / size,
                    scaleY: height / size,
                    left: width > 0 ? x : x + width,
                    top: height > 0 ? y - height : y
                });
                break;
            case "br":
                width = x - fabricObject.left;
                height = y - fabricObject.top;
                fabricObject.set({
                    scaleX: width / size,
                    scaleY: height / size,
                    left: width > 0 ? x - width : x,
                    top: height > 0 ? y - height : y
                });
                break;
            case "pn":
                let cornerR = (y - fabricObject.top) / fabricObject.scaleY;
                cornerR = cornerR < 0 ? 0 : cornerR;
                if (cornerR < size / 2) {
                    const numVerts = fabricObject.numVerts;
                    const pathObject = new fabric.Path(this.getRoundSVGPath(numVerts, cornerR));
                    fabricObject.set({
                        path: pathObject.path,
                        cornerR: cornerR
                    });
                    fabricObject.setCoords();
                }
                break;
            case "pr":
                let numVerts = 4;
                const tx = fabricObject.left + (size / 2) * fabricObject.scaleX;
                const ty = fabricObject.top + (size / 2) * fabricObject.scaleY;
                if (Math.abs(tx - x) < 1) {
                    numVerts = SHAPE_CONFIG.maxNumVerts;
                } else {
                    const angle = Math.PI / 2 + Math.atan((y - ty) / (x - tx));
                    let mAngle = Math.PI;
                    for (let i = 3; i < SHAPE_CONFIG.maxNumVerts; i++) {
                        const dAngle = Math.abs((Math.PI * 2) / i - angle);
                        if (mAngle > dAngle) {
                            mAngle = dAngle;
                            numVerts = i;
                        }
                    }
                }
                if (fabricObject.numVerts !== numVerts) {
                    const cornerR = fabricObject.cornerR;
                    const pathObject = new fabric.Path(this.getRoundSVGPath(numVerts, cornerR));
                    fabricObject.set({
                        path: pathObject.path,
                        numVerts: numVerts
                    });
                    fabricObject.setCoords();
                }
        }
        return true;
    }

    getRoundSVGPath = (numVerts, cornerR) => {
        let verts = [];
        const step = Math.PI * 2 / numVerts;
        for (let i = 0; i < numVerts; i++) {
            const r = SHAPE_CONFIG.size / 2;
            const x = r * Math.cos(step * i - Math.PI / 2);
            const y = r * Math.sin(step * i - Math.PI / 2);
            verts.push({ x, y });
        }

        verts = verts.slice();

        const segments = [];
        for (let i = 0; i < numVerts; i++) {
            const t1 = verts[i];
            const t2 = verts[(i + 1) % numVerts];
            const t3 = verts[(i + 2) % numVerts];

            const d12 = Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2));
            const r12 = (d12 - cornerR) / d12;
            const cp12 = [
                ((1 - r12) * t1.x + r12 * t2.x).toFixed(1),
                ((1 - r12) * t1.y + r12 * t2.y).toFixed(1)
            ]

            const d23 = Math.sqrt(Math.pow(t2.x - t3.x, 2) + Math.pow(t2.y - t3.y, 2));
            const r23 = cornerR / d23;
            const cp23 = [
                ((1 - r23) * t2.x + r23 * t3.x).toFixed(1),
                ((1 - r23) * t2.y + r23 * t3.y).toFixed(1)
            ];

            if (i === numVerts - 1) {
                segments.unshift("M" + cp23.join(","));
            }

            segments.push("L" + cp12.join(","));
            segments.push("Q" + t2.x + "," + t2.y + "," + cp23.join(","));
        }
        segments.push("Z");

        return segments.join(" ")
    }
}