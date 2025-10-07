function Calc(){
    this.setA = function(str){
        this.a = Number(str);
    }
    this.setB = function(str){
        this.b = Number(str);
    }

    this.add = function(){
        return this.a + this.b;
    }
}

module.exports.Calc = Calc;
