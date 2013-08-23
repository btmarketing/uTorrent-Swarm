////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

//come global variables
var sw = {
    canvas:undefined, //canvas for bezier's and opacity fading
    canvas2:undefined,
    context:undefined,//canvas for particles
    context2:undefined,
    g:[], //array holding data for beziers
    totalGroups:5, //how many swarms?
    c:[], //array for holding all particles
    totalParticles:100, //how many particles?
    pStart:[]
}

////////////////////////////////////

function swarmInit(){

    //two canvas clones are appended, one for beziers, the other for dots
    makeTwoCanvases();

    makeSwarmComponents();

    masterDraw();
}

////////////////////////////////////

function makeTwoCanvases(){
    sw.canvas = document.createElement('canvas');
    sw.canvas.className = 'swarmCanvas';
    sw.canvas.style.position = 'absolute';
    sw.canvas.style.left = '0px';
    sw.canvas.style.zindex = 200; //I don't remember why I did this...

    // keeping the canvas dimensions at 800x200 seems a good mix of
    // keeping it fairly high-res while not killling the cpu
    sw.canvas.width = 800;
    sw.canvas.height = sw.canvas.width*.25; // each canvas has aspect ratio 4:1
    sw.canvas.style.top = '28%'; // 28 percent seemed to work well......
    document.body.appendChild(sw.canvas);
    sw.canvas2 = sw.canvas.cloneNode(false); //clones of each other
    document.body.appendChild(sw.canvas2);
    sw.context = sw.canvas.getContext('2d');
    sw.context2 = sw.canvas2.getContext('2d');
}

////////////////////////////////////

function makeSwarmComponents(){

    for(var h=0;h<sw.totalGroups;h++){
        var init = {
            sineCount:rFloat(-Math.PI*2)
        };
        sw.g[h] = new Bez(init,sw.canvas);
    }

    for(var n=0;n<3;n++){
        sw.pStart[n] = ((sw.canvas2.width/6)*n)+(sw.canvas2.width*(7/12))+rInt(-10,10);
    }

    for(var p=0;p<sw.totalParticles;p++){
        var place = 2-Math.floor(Math.pow(Math.random(),2.5)*3);
        sw.c[p] = new SwarmParticle(sw.canvas2,1,sw.pStart[place],150,rFloat(2,5));
    }
}

////////////////////////////////////

function masterDraw(){
    var i,
        p;

    clearScreen();

    //update and draw the beziers
    for(i=0;i<sw.totalGroups;i++){
        if(sw.g[i].restart){ // if it's gone off the screen, initialize it to the left of the screen
            var init = {}; //optional params to pass it
            sw.g[i] = new Bez(init,sw.canvas);
        }
        sw.g[i].update(sw.canvas);
        sw.g[i].draw(sw.context,sw.canvas,i);
    }

    //update and draw the particles
    for(p=0;p<sw.totalParticles;p++){
        if(sw.c[p].fillCount/(Math.PI*2)>=sw.c[p].life && sw.c[p].fill<0){
            var place = 2-Math.floor(Math.pow(Math.random(),2.5)*3);
            sw.c[p] = new SwarmParticle(sw.canvas2,1,sw.pStart[place],100,rFloat(2,3));
        }
        else if(sw.c[p].fill<0 && sw.c[p].size>12){
            var place = 2-Math.floor(Math.pow(Math.random(),2.5)*3);
            sw.c[p] = new SwarmParticle(sw.canvas2,1,sw.pStart[place],100,rFloat(2,3));
        }
        sw.c[p].update(sw.canvas2);
        sw.c[p].draw(sw.context2);
    }
    requestAnimFrame(masterDraw);
}

////////////////////////////////////

function clearScreen(){

    var oldArray = sw.context.getImageData(0,0,sw.canvas.width,sw.canvas.height);
    var len = oldArray.data.length;
    for(var d=3;d<len;d+=4){
        //using getImageData and feedback on the Alpha pixels to create the fading effect
        oldArray.data[d] = Math.floor(oldArray.data[d]*.9999);
    }
    sw.context.putImageData(oldArray,0,0);

    //the particle canvas simply get erased every time
    sw.context2.clearRect(sw.canvas2.width/3,0,sw.canvas2.width,sw.canvas2.height);
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

// the class for our big bezier swarm tentacles
// it's really just a ton of beziers all stacked on top of each other

function Bez(init,cnv){

    this.cycles = init.cycles!==undefined ? init.cycles : rFloat(1,2.5);

    this.amount = init.amount!==undefined ? init.amount : 1;
    this.thickness = init.thickness!==undefined ? init.thickness : rInt(5,10);
    this.clones = init.clones!==undefined ? init.clones : Math.floor(Math.pow(Math.random(),2)*2)+1;

    this.height = init.height!==undefined ? init.height : rFloat(cnv.height*.25,cnv.height*.4);

    this.fill = init.fill!==undefined ? init.fill : 255;
    this.opacity = init.opacity!==undefined ? init.opacity : .02;

    this.distort = init.distort!==undefined ? init.distort : [1,1.3,1.4];

    this.sineStep = init.sineStep!==undefined ? init.sineStep : this.cycles*(1-rFloat(0.994,.996));
    this.sineOffset = init.sineOffset!==undefined ? init.sineOffset : rFloat(Math.PI*2);
    this.sineSpace = init.sineSpace!==undefined ? init.sineSpace : (Math.PI*2)/8;

    this.sineCount = init.sineCount!==undefined ? init.sineCount : (this.sineSpace*Math.PI*this.amount*-1)-(this.thickness*.1)-rFloat(Math.PI*.5,Math.PI*1.5);

    this.restart = false;
}

///////////////////////////////////

Bez.prototype.update = function(cnv){
    this.sineCount+=this.sineStep;
}

///////////////////////////////////

Bez.prototype.x2sin = function(add,cnv,j,off){
    var lookup = (this.sineCount+this.sineOffset+off)+(j*this.sineSpace);
    return Math.sin(lookup+add)*this.distort[j%3];
}

///////////////////////////////////

Bez.prototype.draw = function(ctx,cnv,index){

    var i,
        n,
        t,
        c,
        xPos = [],
        yPos = [],
        sineY,
        sineX,
        offset,
        adder;

    ctx.strokeStyle = 'rgba('+this.fill+','+this.fill+','+this.fill+','+this.opacity+')';

    for(c=0;c<this.clones;c++){

        ctx.translate(c*this.thickness*10,0);

        for(t=0;t<this.thickness;t++){

            ctx.lineWidth = Math.floor((this.thickness-t)*1.5);

            for(i=0;i<this.amount;i++){

                if(i!==this.amount-1) adder = t*-.2;
                else adder = t*.2;

                offset = i*this.sineSpace*3;

                for(n=0;n<4;n++){
                    sineX = this.sineCount+(n*this.sineSpace)+offset+adder;
                    xPos[n] = ((sineX/Math.PI)/this.cycles)*cnv.width-(t*5);
                    sineY = this.x2sin(adder,cnv,n,offset);
                    yPos[n] = scale(sineY,-1,1,(cnv.height/2)-this.height,(cnv.height/2)+this.height);
                }
                if(i===0 && t===this.thickness-1 && xPos[0]>cnv.width) this.restart=true;
                drawBezier(ctx,xPos,yPos);
            }
        }

        ctx.translate(-c*this.thickness*10,0);
    }
}

///////////////////////////////////

function drawBezier(ctx,x,y){
    ctx.beginPath();
    ctx.moveTo(Math.floor(x[0]),Math.floor(y[0]));
    ctx.bezierCurveTo(Math.floor(x[1]),Math.floor(y[1]),Math.floor(x[2]),Math.floor(y[2]),Math.floor(x[3]),Math.floor(y[3]));
    ctx.stroke();
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

// the class for our floating dot thing

function SwarmParticle(cnv,_fillAmount,_startX,_yAmount,_size){

    this.size = _size;
    this.y = rInt(30,_yAmount);

    this.startX = rInt(_startX-60,_startX+60);
    this.startY = rInt((cnv.height/2)-20,(cnv.height/2)+20);

    this.rotation = rFloat(Math.PI*2);

    this.maxFill = 0.7;

    this.ySpeed = rFloat(0.12,.18);
    this.sizeFeedback = rFloat(1.001,1.003);

    this.fillStep = rFloat(.015,.03);
    this.fillCount = rFloat(Math.PI*.5,Math.PI*1.5);

    this.fillTest = false;
    this.count = 0;

    this.life = rInt(2,3);
}

///////////////////////////////////

SwarmParticle.prototype.update = function(cnv){

    this.y+=this.ySpeed;

    this.ySpeed*=this.sizeFeedback;

    this.size*=this.sizeFeedback;

    this.fillCount+=this.fillStep;

    this.fill= Math.cos(this.fillCount);

    if(this.fill<-0.1 && this.fillTest===false){
        this.fillTest = true;
        this.count++;
    }
    else if(this.fill>.5){
        this.fillTest=false;
    }
}

///////////////////////////////////

SwarmParticle.prototype.draw = function(ctx){
    ctx.fillStyle = 'rgba(255,255,255,'+(this.fill*this.maxFill)+')';

    ctx.translate(this.startX, this.startY);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.arc(0, Math.pow(this.y,1.5)/100, this.size/2,Math.PI*2,false);
    ctx.fill();

    ctx.rotate(-this.rotation);
    ctx.translate(-this.startX, -this.startY);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

// a few functions to help out

function rInt(min,max){
    if(arguments.length===1){
        return Math.floor(Math.random()*min);
    }
    else if(arguments.length>1){
        var space = max-min;
        return Math.floor((Math.random()*space)+min);
    }
    else{
        return 0;
    }
}

///////////////////////////////////

function rFloat(min,max){
    if(arguments.length===1){
        return Math.random()*min;
    }
    else if(arguments.length>1){
        var space = max-min;
        return (Math.random()*space)+min;
    }
    else{
        return 0;
    }
}

///////////////////////////////////

function constrain(value,min,max){
    if(value<min){
        return min;
    }
    else if(value>max){
        return max;
    }
    else{
        return value;
    }
}

///////////////////////////////////

function scale(value,inMin,inMax,outMin,outMax){
    return (((value-inMin)/(inMax-inMin))*(outMax-outMin))+outMin;
}

////////////////////////////////////
////////////////////////////////////
////////////////////////////////////