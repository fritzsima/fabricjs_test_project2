import { fabric } from "fabric";

export class Command {
    constructor(canvas) {
        this.canvas = canvas;
        this.list = [];
        this.state = [];
        this.index1 = 0;
        this.index2 = 0;
        this.action = false;
        this.refresh = true;
        this.extras = ["numVerts", "cornerR"]

        this.handleEvents();
    }

    handleEvents = () => {
        this.canvas.on("object:added", (e) => {
            var object = e.target;

            if (this.action === true) {
                this.state = [this.state[this.index2]];
                this.list = [this.list[this.index2]];

                this.action = false;
                this.index1 = 1;
            }
            object.saveState();

            this.extras.forEach((extra) => {
                object.originalState[extra] = object[extra];
            });
            this.state[this.index1] = JSON.stringify(object.originalState);
            this.list[this.index1] = object;
            this.index1++;
            this.index2 = this.index1 - 1;

            this.refresh = true;
        });

        this.canvas.on("object:modified", (e) => {
            var object = e.target;

            if (this.action === true) {
                this.state = [this.state[this.index2]];
                this.list = [this.list[this.index2]];

                this.action = false;
                this.index1 = 1;
            }

            object.saveState();

            this.extras.forEach((extra) => {
                object.originalState[extra] = object[extra];
            });
            this.state[this.index1] = JSON.stringify(object.originalState);
            this.list[this.index1] = object;
            this.index1++;
            this.index2 = this.index1 - 1;

            this.refresh = true;
        });
    }

    undo = () => {
        if (this.index1 <= 0) {
            this.index1 = 0;
            return;
        }

        if (this.refresh === true) {
            if (this.index1 <= 1) {
                return;
            }
            this.index1--;
            this.refresh = false;
        }

        this.index2 = this.index1 - 1;
        this.current = this.list[this.index2];

        this.current.setOptions(JSON.parse(this.state[this.index2]));

        this.index1--;
        this.current.setCoords();
        this.canvas.renderAll();
        this.action = true;
    }

    redo = () => {
        this.action = true;
        if (this.index1 >= this.state.length - 1) {
            return;
        }

        this.index2 = this.index1 + 1;
        this.current = this.list[this.index2];
        this.current.setOptions(JSON.parse(this.state[this.index2]));

        this.index1++;
        this.current.setCoords();
        this.canvas.renderAll();
    }
}
