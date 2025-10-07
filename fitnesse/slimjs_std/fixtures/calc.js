export class Calc {
    constructor() {
        this._a = 0
        this._b = 0
    }
    setA(value) {
        this._a = value;
    }
    setB(value) {
        this._b = value;
    }

    add(){
        return this._a + this._b;
    }
}

