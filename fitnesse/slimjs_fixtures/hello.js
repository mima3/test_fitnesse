function Hi(){
    this.setEcho = function(str){
        this.echo = str;
    }

    this.sayHi = function(){
        return "Hi! " + this.echo;
    }
}

module.exports.Hi = Hi;
