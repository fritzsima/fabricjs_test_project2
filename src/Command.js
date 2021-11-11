export class Command {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentState = canvas.toJSON(['numVerts', 'cornerR']);
        this.locked = false;
        this.stack0 = canvas.toJSON(['numVerts', 'cornerR']);
        this.redoStack = [this.stack0];
        this.stateStack = [this.stack0];
        this.initHandlers(this.canvas);
    }

    initHandlers = (canvas) => {
        this.canvas.on("object:modified", (e) => {
            this.saveState();
        });

        this.canvas.on('path:created', (e) => {
            this.saveState();
        });

        this.canvas.on('object:added', (e) => {
            this.saveState();
        });

        this.canvas.on('selection:updated', () => {
            this.saveState();
        });

        this.canvas.on('selection:created', () => {
            this.saveState();
        });

        this.canvas.on('selection:cleared', () => {
            this.saveState();
        });
    }

    saveState = () => {
        if (!this.locked) {
            if (this.stateStack.length === this.maxCount) {
                this.stateStack.shift();
            }

            this.stateStack.push(this.currentState);
            this.currentState = this.canvas.toJSON(['numVerts', 'cornerR']);
            this.redoStack = [];
        }
        return {
            undoable: this.stateStack.length > 1, 
            redoable: this.redoStack.length > 1
        };
    }

    undo = (callback) => {
        if (this.stateStack.length > 1)
            this.applyState(this.redoStack, this.stateStack.pop(), callback);
    }

    redo = (callback) => {
        if (this.redoStack.length > 0) 
            this.applyState(this.stateStack, this.redoStack.pop(), callback);
    }

    applyState = (stack, newState, callBack) => {
        stack.push(this.currentState);
        this.currentState = newState;
        this.locked = true;

        this.canvas.loadFromJSON(this.currentState, () => {
            if (callBack !== undefined)
                callBack({
                    undoable: this.stateStack.length > 1, 
                    redoable: this.redoStack.length > 1
                });
            this.locked = false;
        });       
    }
}
