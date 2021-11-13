import { fabric } from "fabric";

fabric.Object.prototype.transparentCorners = false
fabric.Object.prototype.borderColor = "lightGreen"
fabric.Object.prototype.cornerColor = "lightGreen"
fabric.Object.prototype.cornerStyle = "circle"
fabric.util.object.extend(fabric.Object.prototype, {
    stateProperties: (
        'top left width height scaleX scaleY flipX flipY ' +
        'theta angle opacity cornersize fill overlayFill ' +
        'stroke strokeWidth strokeDashArray fillRule ' +
        'borderScaleFactor transformMatrix selectable'
    ).split(' '),

    hasStateChanged: function () {
        return this.stateProperties.some(function (prop) {
            return this[prop] !== this.originalState[prop];
        }, this);
    },

    saveState: function () {
        this.stateProperties.forEach(function (prop) {
            this.originalState[prop] = this.get(prop);
        }, this);
        return this;
    },

    setupState: function () {
        this.originalState = {};
        this.saveState();
    }
});
