import { fabric } from "fabric";
import react from "react";
import { Command } from "./Command";
import {
    CANVAS_OPTIONS,
    RECT_OPTIONS,
    SHAPE_CONFIG
} from './Constants'
import './Extension'

const controlTypes = [
    "tl",
    "tr",
    "bl",
    "br",
    "pn",
    "pr"
];

export default class CanvasManager {
    constructor(id) {
        this.canvas = this.createCanvas(id, CANVAS_OPTIONS);
        this.command = new Command(this.canvas);
        this.addRect(this.canvas, RECT_OPTIONS);
    }

    undo = () => {
        this.command.undo();
    }

    redo = () => {
        this.command.redo();
    }

    createCanvas = (id, options) => {
        return new fabric.Canvas(id, options);
    }

    addRect = (canvas, options) => {
        const rectPath = this.getRoundSVGPath(SHAPE_CONFIG.numVerts, SHAPE_CONFIG.cornerR);
        const rect = new fabric.Path(rectPath, {
            hasControls: true,
            strokeUniform: true,
            numVerts: SHAPE_CONFIG.numVerts,
            cornerR: SHAPE_CONFIG.cornerR,
        });
        rect.set({
            ...options,
            width: SHAPE_CONFIG.size,
            height: SHAPE_CONFIG.size,
            pathOffset: {
                x: 0,
                y: 0
            },
        });
        rect.controls = this.createControls();
        rect.setupState();
        canvas.add(rect);
        return rect
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
                }
        }
        return true;
    }

    getRoundSVGPath = (numVerts, cornerR) => {
        let verts = [];
        let segments = [];
        const step = Math.PI * 2 / numVerts;
        for (let i = 0; i < numVerts; i++) {
            const r = SHAPE_CONFIG.size / 2;
            const al = step * i - Math.PI / 2;
            const x = r * Math.cos(al);
            const y = r * Math.sin(al);

            const al1 = al + (Math.PI - step) / 2;
            const al2 = al - (Math.PI - step) / 2;
            const rn = cornerR * Math.cos((Math.PI - step) / 2);
            const rc = cornerR * Math.sin((Math.PI - step) / 2);

            // const pc = [x - rn * cos(al), x - rn * sin(al)];
            const p1 = [x - rn * Math.cos(al1), y - rn * Math.sin(al1)];
            const p2 = [x - rn * Math.cos(al2), y - rn * Math.sin(al2)];

            if (i === numVerts - 1) {
                segments.unshift(`M${p2[0]},${p2[1]}`);
            }

            segments.push(`L${p1[0]},${p1[1]}`);
            segments.push(`A ${rc} ${rc} ${Math.PI / 2} 0 1 ${p2[0]} ${p2[1]}`);
        }
        segments.push("Z");

        return segments.join(" ")
    }
}