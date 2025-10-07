export class Hi {
    constructor(echo) {
        this.echo = echo;
    }
    setEcho(str){
        this.echo = str;
    }

    sayHi(){
        return "Hi! " + this.echo;
    }
}

