var jsgame = {
    canvas : function(ctx,WIDTH,HEIGHT){
        this.container = ctx
		this.screen = new jsgame.screen(this)
        this.layers = [new jsgame.layer(this)]
        this.WIDTH = WIDTH
        this.HEIGHT = HEIGHT
    },
    screen : function(canvas){
        this.canvas = canvas
        this.matrix = new numjs.matrix(1,0,0,1,0,0)
        this.position = new numjs.vector(0,0)
    },
    sprite : function(canvas,pos,parent){
        this.canvas = canvas
        jsgame.sprites.add(this)

        this.logics = []
        this.appears = []

        this.parent = parent || canvas.screen
        this.childs = []

        // NOTE !!! : X,Y ARE NO LONGER AVILIABLE, USE POSITION VECTORS INSTEAD.
        // POSITION ARE SYNC WITH MATRIX
        this.position 
        this.matrix

        this._init(pos)
    },
    group : function(sprites){
        if (sprites instanceof Array){
            this.spriteList = sprites
        } else {
            this.spriteList = []
        }
    },
    graphics : {
        // BASIC GRAPHS ONLY STORE SPACE INFORMATION.
        rect : function(x,y,w,h,abs){
            if (abs){ this.x = x, this.y = y, this.w = w, this.h = h}
            else {this.x = x - w/2,this.y = y - h/2, this.w = w,this.h = h}
        },
        isCollise : function(apos,bpos,a,b){
            if (a instanceof jsgame.graphics.rect && 
                b instanceof jsgame.graphics.rect){
                let alist = [
                    apos.multi(new numjs.vector(a.x,a.y)),
                    apos.multi(new numjs.vector(a.x + a.w,a.y)),
                    apos.multi(new numjs.vector(a.x,a.y + a.h)),
                    apos.multi(new numjs.vector(a.x + a.w,a.y + a.h))
                ]
                let blist = [
                    bpos.multi(new numjs.vector(b.x,b.y)),
                    bpos.multi(new numjs.vector(b.x + b.w,b.y)),
                    bpos.multi(new numjs.vector(b.x,b.y + b.h)),
                    bpos.multi(new numjs.vector(b.x + b.w,b.y + b.h))
                ]
                let axis = [alist[0].sub(alist[1]).vert(),alist[0].sub(alist[2]).vert()]
                return jsgame.graphics.SAT(axis,alist,blist)
            }
        },
        SAT : function(axis,pointsA,pointsB){
            for (let i in axis){
                let Arange = [],Brange = []
                for (let j in pointsA){
                    Arange.push(axis[i].dot(pointsA[j]))
                }
                for (let k in pointsB){
                    Brange.push(axis[i].dot(pointsB[k]))
                }
                if (!(Math.min(...Arange) <= Math.max(...Brange) && Math.max(...Arange) >= Math.min(...Brange))){
                    return false
                }
            }
            return true
        }
    },
    layer : function(canvas){
        this.canvas = canvas
		this.cover = new numjs.vectorN([1,1,1,1])
		this.graphs = []
		this.colors = []
    },
    color : function(setting,type){
        this.relSetting = util.vectorize(setting)
		this.setting = util.vectorize(setting) 
		this.type = type || "rgba"
		this.string = this.color()
		this.layer 
    },
    createCanvas : function(container){
        let ctx = container.getContext("2d")
        let width = container.clientWidth
        let height = container.clientHeight
        let canvas = new jsgame.canvas(ctx,width,height)
        this.config.canvasList.push([canvas,container])
        return canvas
    },
    config : {
        default : {
            canvas : null,
            layer : null,
			color : [0,0,0,1],
			clearColor : [1,1,1,1]
        },
        colorDict : {
            "black" : [0,0,0,1],
            "red" : [1,0,0,1],
            "blue" : [0,0,1,1],
            "green" : [0,1,0,1],
            "yellow" : [1,1,0,1],
            "grey" : [0.5,0.5,0.5,1],
            "HPgreen" : [14,209,69,1],
            "orange" : [255/255,127/255,39/255,1],
        },
        canvasList : [],
        groupList : {}
    }
}


jsgame.canvas.prototype = {
    appendLayer : function(layer){
        this.layers.push(layer)
    },
    resize : function(w,h){
        this.WIDTH = w
        this.HEIGHT = h
    }
}
jsgame.screen.prototype = {
	bgcolor : function(color){
		let ctx = this.canvas.container
		ctx.fillStyle = color || jsgame.config.default.clearColor.string
		ctx.fillRect(0,0,this.canvas.WIDTH,this.canvas.HEIGHT)
    },
    translate : function(pos){
        pos = util.vectorize(pos)
        this.position = this.position.add(pos)
        this.matrix.e = this.position.x
        this.matrix.f = this.position.y
    },
    scaling : function(p,q,center){
        center = util.vectorize(center)
        let scaleMatrix = new numjs.matrix(p,0,0,q,center.x * (1 - p),center.y * (1 - q))
        this.matrix = scaleMatrix.multi(this.matrix)
        this.position = new numjs.vector(this.matrix.e,this.matrix.f)
    }
}
jsgame.layer.prototype = {
	add : function(a){
		if (a instanceof jsgame.color){
			this.colors.push(a)
			a.layer = this
		} else {
			this.graphs.push(a)
		}
	},
	change : function(cover){
		this.cover = cover 
		for (let i in this.colors){
			this.colors[i].update()
		}
	}
}
jsgame.color.prototype = {
    change : function(setting){
		if (setting){
			this.relSetting = util.vectorize(setting)
			this.update()
		}
    },
    color : function(){
        if (this.type == "rgba"){
            let s = this.setting.parameter
            return `rgba(${s[0]*255},${s[1]*255},${s[2]*255},${s[3]})`
        }
	},
	update : function(){
        this.setting = this.relSetting.vscale(this.layer.cover)
		this.string = this.color()
	}
}
jsgame.color.handle = function(color){
    if (color instanceof jsgame.color){
        return color
    }
    if (color instanceof Array){
        return new jsgame.color(color)
    }
    if (typeof color == "string"){
        let _color = jsgame.config.colorDict[color]
        if (_color){
            return jsgame.color.handle(_color)
        }
    }
    return jsgame.color.handle(jsgame.config.default.color)
}
jsgame.color.blend = function(colors,coe){
    let zero = numjs.vectorN.init(colors[0].relSetting.parameter.length)
    for (let i in colors){
        zero = zero.add(colors[i].relSetting.scale(coe[i]))
    }
    return new jsgame.color(zero)
}
jsgame.sprite.prototype = {
    // LIFE CYCLE FUNCTIONS 
    _init : function(pos_shift){

        // INITIATION FOR FINDING THE PARENTS 
        let parentList = []
        let current = this
        let position = new numjs.vector(0,0)

        // FIND ALL THE PARENTS
        while (true){
            if (!(current.parent instanceof jsgame.screen)){
                parentList.push(current.parent)
                current = current.parent
            } else {
                break
            }
        }
        // GET ABS_POSITION
        for (let i in parentList){
            position = position.add(parentList[i].position)
        }

        pos_shift = util.vectorize(pos_shift)
        
        
        // ARRAY OPERATION TO GET THE CORRESPONDING MATRIX
        this.position = position.add(pos_shift)
        let matrix = (parentList[0]) ? parentList[0].matrix.array().slice(0,4) : [1,0,0,1]
        matrix = [...matrix,this.position.x,this.position.y]
        this.matrix = new numjs.matrix(...matrix)
    },
    die : function(){
        for (let i in this.childs){
            util.remove(this.childs[i])
        }
        util.remove(this)
    },

    // GRAPHICS OPERATION FUNCTIONS

    draw : function(){
        for (var graph of this.appears){
            jsgame.graphics.draw(graph,this)
        }
        for (var child of this.childs){
            child.draw()
        }
    },
    isCollise : function(sprite){
        for (let i in this.logics){
            for (let j in sprite.logics){
                if (jsgame.graphics.isCollise(
                    this.matrix,sprite.matrix,
                    this.logics[i],sprite.logics[j],
                )){ return true }
            }
        }
        return false
    },

	// GRAPHICS ADD-ON FUNCTIONS
	// ALTHOUGH LAYER ARE UNLIMITED, TRY NOT TO USE NON-CANVAS-BIND LAYER
    appear : function(graph,color,layer,image){
		// IMAGE ONLY VALID WHEN RECT SHOWN
		image = util.imagize(image)
		graph = jsgame.graphics.handle(graph)
		color = jsgame.color.handle(color)
		layer = layer || this.canvas.layers[0]
		layer.add(color)
		layer.add(graph)
		if (graph instanceof jsgame.graphics.rect && image){
			this.appears.push([graph,color,image])
		} else {
			this.appears.push([graph,color])
		}

    },
    shape : function(graph){
		graph = jsgame.graphics.handle(graph)
        this.logics.push(graph)
    },
    has : function(graph,color,layer,image){
		image = util.imagize(image)
		graph = jsgame.graphics.handle(graph)
		color = jsgame.color.handle(color)
		layer = layer || this.canvas.layers[0]
		layer.add(color)
		layer.add(graph)
		if (graph instanceof jsgame.graphics.rect && image){
			this.appears.push([graph,color,image])
		} else {
			this.appears.push([graph,color])
		}
		this.logics.push(graph)
    },
	// CHILD OPERATION
	
    append : function(sprite){
        this.childs.push(sprite)
        sprite.parent = this
    },
    remove : function(sprite){
        if (sprite.parent == this){
            for (let i in this.childs){
                if (this.childs[i] == sprite){
                    this.childs.splice(i,1)
                }
            }
            sprite.parent = this.parent
        }
    },
    hasChild : function(){
        if (this.childs.length == 0){ return false }
        return true
    },

    // COEFFICENT FUNCTIONS

    distence : function(sprite){
        let dx = sprite.x - this.x
        let dy = sprite.y - this.y
        return ((dx**2 + dy**2)**0.5)
    },
    angle : function(){
        let i = new numjs.vector(this.matrix.a,this.matrix.b)
        let j = new numjs.vector(this.matrix.c,this.matrix.d)
        return [i.angle(),j.angle()]
    },
    scale : function(){
        let i = new numjs.vector(this.matrix.a,this.matrix.b)
        let j = new numjs.vector(this.matrix.c,this.matrix.d)
        return [i.norm(),j.norm()]
    },
    boundingBox : function(){
        let xmin = [],xmax = [],ymin = [],ymax = []
        for (let i in this.logics){
            let extreme = this.logics[i].extreme()
            xmin.push(extreme[0])
            xmax.push(extreme[1])
            ymin.push(extreme[2])
            ymax.push(extreme[3])
        }
        let x_min = Math.min(...xmin)
        let x_max = Math.max(...xmax)
        let y_min = Math.min(...ymin)
        let y_max = Math.max(...ymax)
        return [x_min,y_min,x_max - x_min, y_max - y_min]
    },

    // SPACE TRANSFORMATION FUNCTIONS

    translate : function(position,child){
        position = util.vectorize(position)
        this.position = this.position.add(position)
        // SYNC MATRIX 
        this.matrix.e = this.position.x
        this.matrix.f = this.position.y
        if (!child){
            for (let i in this.childs){
                this.childs[i].translate(position)
            }
        }
    },
    translateTo : function(position,center,child){
        child = !(!child && this.hasChild())
        position = util.vectorize(position)
        if (center){
            center = util.vectorize(center)
            let after = position.add(center)
            if (!child){ var translate = after.sub(this.position) }
            this.position = after
        } else {
            if (!child){ var translate = position.sub(this.position) }
            this.position = position
        }
        // SYNC MATRIX 
        this.matrix.e = this.position.x
        this.matrix.f = this.position.y
        if (!child){
            for (let i in this.childs){
                this.childs[i].translate(translate)
            }
        }
    },
    rotate : function(angle,center){
        //CONSTRUCT ROTATION MATRIX FIRST
        let rotate = numjs.matrix.rotateMatrix(angle)
        //WITH RESPECT TO ORIGIN ?
        if (center){
            center = util.vectorize(center)
            let pos = this.position.sub(center)
            let rotatePos = rotate.multi(pos)
            this.translateTo(rotatePos,center) 
        } else {
            let pos = this.position
            let rotatePos = rotate.multi(pos)
            this.translateTo(rotatePos)
        }
    },
    rotateTo : function(angle,center){
        // GET RELATIVE POSITION
        let pos
        if (center){
            center = util.vectorize(center)
            pos = this.position.sub(center)
        } else {
            pos = this.position
        }
        //GET RELATIVE ANGLE FIRST
        let pos_angle = pos.angle()
        // DETERMINE THE ANGLE DIFFERENCE  
        let dif_angle = angle - pos_angle
        // DO ROTATION, IT COULD USE this.rotate() DIRECTLY, BUT IT'S MORE EFFICENT
        // TO DO IT DIRECTLY
        let rotate = numjs.matrix.rotateMatrix(dif_angle)
        let rotatePos = rotate.multi(pos)
        if (center){
            this.translateTo(rotatePos,center)
        } else {
            this.translateTo(rotatePos)
        }
    },
    scaling : function(){
    },

    // SELF TRANSFORMATION FUNCTIONS

    rotateSelf : function(a,b){
        let rotate = b ? numjs.matrix.angleMatrix(a,b) : numjs.matrix.rotateMatrix(a)
        this.matrix = this.matrix.multi(rotate)
    },
    rotateSelfTo : function(a,b){
        let rotate
        if (b){
            let angle = this.angle()
            let dif_i = a - angle[0]
            let dif_j = b - angle[1]
            rotate = numjs.matrix.angleMatrix(dif_i,dif_j)
        } else {
            let angle = this.angle()
            let dif = a - angle[0]
            rotate = numjs.matrix.rotateMatrix(dif)
        }
        this.matrix = this.matrix.multi(rotate)
    },
    scalingSelf : function(p,q){
        q = q || p
        this.matrix.a *= p
        this.matrix.b *= p
        this.matrix.c *= q
        this.matrix.d *= q
    },
    scalingSelfTo : function(p,q){
        let scale = this.scale()
        let dif_p = p/scale[0]
        let dif_q = q/scale[1]
        this.scalingSelf(dif_p,dif_q)
    }
}
jsgame.group.prototype = {
    draw : function(){
        for (var i in this.spriteList){
            if (this.spriteList[i]){
                if (this.spriteList[i].status != false){
                    this.spriteList[i].draw()
                }
            }
        }
    },
    add : function(sprite){
        this.spriteList.push(sprite)
    },
    clear : function(){
        for (let i in this.spriteList){
            this.spriteList[i] = null
            delete this.spriteList[i]
        }
    },
    search : function(sprite){
        for (let i in this.spriteList){
            if (this.spriteList[i] == sprite){
                return i
            }
        }
    },
}
jsgame.graphics.draw = function(graph,sprite){
    let ctx = sprite.canvas.container
    let screen = sprite.canvas.screen
	ctx.save()
    ctx.beginPath()
    ctx.transform(...screen.matrix.array())
	ctx.transform(...sprite.matrix.array())
	graph[0].draw(ctx)
	ctx.closePath()
	ctx.fillStyle = graph[1].string
	ctx.fill()
	graph[0].drawImage(ctx,graph)
	ctx.restore()
}
jsgame.graphics.rect.prototype = {
	draw : function(ctx){
		ctx.rect(this.x,this.y,this.w,this.h)
	},
	drawImage : function(ctx,graph){
		if (graph[2]){
			ctx.imageSmoothingEnabled = false
			ctx.drawImage(graph[2],this.x,this.y,this.w,this.h)
		}
    },
    extreme : function(){
        return [this.x,this.x + this.w,this.y, this.y + this.h]
    }
}
jsgame.graphics.handle = function(graph){
	// graph[type : String; x,y,w,h : Number;]
    if (graph instanceof Array){
        if (graph[0] == "rect"){
            return new jsgame.graphics.rect(
                graph[1],graph[2],graph[3],graph[4],graph[5]
            )
        }
	}
	return graph
}
var numjs = {
    vector : function(x,y){
        this.x = x
        this.y = y
    },
    vectorN : function(parameter){
        this.parameter = parameter
    },
    matrix : function(a,b,c,d,e,f){
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.e = e
        this.f = f
    },
    error : 0.0001,
    eq : function(a,b){
        return Math.abs(a - b) < this.error
    }
}
numjs.vector.prototype = {
    add : function(a){
        let b = this
        return new numjs.vector(a.x + b.x,a.y + b.y)
    },
    sub : function(a){
        let b = this
        return new numjs.vector(b.x - a.x,b.y - a.y)
    },
    norm : function(){
        let a = this
        return (a.x**2 + a.y**2)**0.5
    },
    dot : function(a){
        let b = this
        return a.x*b.x + a.y*b.y
    },
    scale : function(c){
        return new numjs.vector(this.x*c,this.y*c)
    },
    vert : function(){
        return new numjs.vector(1,-this.x/this.y)
    },
    angle : function(){
        let dx = this.x,dy = this.y
        if (dx > 0 && dy > 0){ return Math.atan(dy/dx) }
        //第四象限 270-360
        if (dx > 0 && dy < 0){ return Math.atan(dy/dx) + Math.PI * 2 }
        //二三象限 90-270
        if (dx < 0){ return Math.atan(dy/dx) + Math.PI }
        //在竖直方向上 90 or 270
        if (dx == 0 && dy != 0){
            if (dy > 0){ return Math.PI * 0.5 }
            else { return Math.PI * 1.5 }
        }
        //在水平方向上 180 or 360
        if (dx != 0 && dy == 0){
            if (dx > 0){ return 0 }
            else { return Math.PI }
        }
        //两者重合（抛出0°）`
        if (dx == 0 && dy == 0){ return 0 }
    }
}
numjs.vector.polar = function(r,theta){
    return new numjs.vector(r*Math.cos(theta),r*Math.sin(theta))
}
numjs.vectorN.prototype = {
    add : function(a){
        let re = []
        for (let i in this.parameter){
            re.push(this.parameter[i] + a.parameter[i])
        }
        return new numjs.vectorN(re)
    },
    sub : function(a){
        let re = []
        for (let i in this.parameter){
            re.push(this.parameter[i] - a.parameter[i])
        }
        return new numjs.vectorN(re)
    },
    scale : function(c){
        let re = []
        for (let i in this.parameter){
            re.push(this.parameter[i] * c)
        }
        return new numjs.vectorN(re)
    },
    vscale : function(a){
        let re = []
        for (let i in this.parameter){
            re.push(this.parameter[i] * a.parameter[i])
        }
        return new numjs.vectorN(re)
    }
}
numjs.vectorN.init = function(number){
    let a = []
    for (let i = 0; i < number; i ++){
        a.push(0)
    }
    return new numjs.vectorN(a)
}
numjs.matrix.prototype = {
    multi : function(v){
        if (v instanceof numjs.vector){
            let a = this.a,b = this.b,c = this.c
            let d = this.d,e = this.e,f = this.f
            let x = v.x,y = v.y
            return new numjs.vector(a*x+c*y+e,b*x+d*y+f)
        }
        // THE ORDER : THIS*V
        if (v instanceof numjs.matrix){
            let a = this.a,b = this.b,c = this.c
            let d = this.d,e = this.e,f = this.f
            let a_ = v.a,b_ = v.b,c_ = v.c
            let d_ = v.d,e_ = v.e,f_ = v.f
            return new numjs.matrix(
                a_*a + b_*c,
                a_*b + b_*d,
                c_*a + d_*c,
                c_*b + d_*d,
                e_*a + f_*c + e,
                e_*b + f_*d + f
            )
        }
    },
    array : function(){
        return [this.a,this.b,this.c,this.d,this.e,this.f]
    }
}
numjs.matrix.rotateMatrix = function(k){
    let cos = Math.cos(k)
    let sin = Math.sin(k)
    return new numjs.matrix(cos,sin,-sin,cos,0,0)
}
numjs.matrix.angleMatrix = function(p,q){
    // p with respect to + direction of x-axis 
    // q with respect to + direction of y-axis
    let cosp = Math.cos(p)
    let sinp = Math.sin(p)
    let cosq = Math.cos(q)
    let sinq = Math.sin(q)
    return new numjs.matrix(cosp,sinp,-sinq,cosq,0,0)
}
var util = {
    vectorize : function(a){
        if (a instanceof numjs.vector){
            return a
        }
        if (a instanceof numjs.vectorN){
            return a
        }
        if (a instanceof jsgame.sprite){
            return a.position
        }
        if (a instanceof Array){
            if (a.length == 2){
                return new numjs.vector(...a)
            } else {
                return new numjs.vectorN(a)
            }
        }
        //ERROR
	},
	imagize : function(a){
		if (typeof a == "string"){
			let b = new Image()
			b.src = a
			return b
		}
		return a 
    },
    copy : function(object){
        let keys = Object.keys(object)
        let new_obj = {}
        for (let i in keys){
            if (object[keys[i]] instanceof Object){
                new_obj[keys[i]] = util.copy(object[keys[i]])
            } else {
                new_obj[keys[i]] = object[keys[i]]
            }
        }
        return new_obj
    },
    remove : function(object){
        let keys = Object.keys(object)
        for (let i in keys){
            delete object[keys[i]]
        }
        object.status = false
    }
}

jsgame.sprites = new jsgame.group()
jsgame.config.groupList["global"] = jsgame.sprites
jsgame.config.default.color = new jsgame.color([0,0,0,1])
jsgame.config.default.clearColor = new jsgame.color([1,1,1,1])

//<-------------------------------->
let gameConfig = {
    resource : {
        "mine" : {
            color : [["red",1],["red",0]],
        },
        "gas" : {
            color : [["green",1],["green",0]]
        },
        getBox : function(self,i,n,name){
            let canvas = self.canvas
            let box = self.boundingBox()
            let top = box[1]
            let width = box[2]
            let height = box[3]
            // QUESTION IS OVER HERE
            let x_shift = (i*0.9/n - 0.45) * width
            let pos = [x_shift,top - height * 0.25]
            let color = this[name].color
            let rect = ["rect",0,0,1/n * 0.9 * width,0.1 * height,true]
            let percentage = self.resource[name][0]/self.resource[name][1]
            return [canvas,pos,self,color,rect,percentage]
        }
    },
    // THE GETBOX FUNCTION COULD BE MORE COMPRESSED
    shield : {
        color : [["blue",1],["blue",0]],
        box : ["rect",0,0,0.9,0.1],
        getBox : function(self){
            let canvas = self.canvas
            let box = self.boundingBox()
            let top = box[1]
            let width = box[2]
            let height = box[3]
            let pos = [0,top - height * 0.44]
            let color = this.color
            let percentage = self.shield[0]/self.shield[1]
            let rect = [...this.box]
            rect[3] *= width
            rect[4] *= height 
            return [canvas,pos,self,color,rect,percentage]
        }
    },
    health : {
        color : [["green",1],["red",0]],
        box : ["rect",0,0,0.9,0.1],
        getBox : function(self){
            let canvas = self.canvas
            let box = self.boundingBox()
            let top = box[1]
            let width = box[2]
            let height = box[3]
            let pos = [0,top - height * 0.32]
            let color = this.color
            let percentage = self.health[0]/self.health[1]
            let rect = [...this.box]
            rect[3] *= width
            rect[4] *= height 
            return [canvas,pos,self,color,rect,percentage]
        }
        
    },
    process : {
        color : [["grey",1],["grey",0]],
        box : ["rect",0,0,0.9,0.08],
        getBox : function(self){
            let canvas = self.canvas
            let box = self.boundingBox()
            let top = box[1]
            let width = box[2]
            let height = box[3]
            let pos = [0,top - height * 0.08]
            let color = this.color
            let percentage = 0
            let rect = [...this.box]
            rect[3] *= width
            rect[4] *= height
            return [canvas,pos,self,color,rect,percentage]
        }
    },
    _stream : function(from,to,type){
        let this_res = to.resource[type]
        let build_res = from.resource[type]
        let value = build_res[2] * this_res[2]
        value = Math.min(build_res[0],value)
        value = Math.min(this_res[1] - this_res[0],value)
        from._resourceInc(type,-value)
        to._resourceInc(type,value)
    },
}
let buildingList = {
    "home" : {
        resource : {
            "mine" : [100,300,1],
            "gas" : [100,300,1]
        },
        health : [1000,1000],
        shield : [1000,1000],
        production : 3,
        has : [
            [["rect",0,0,100,100],"red",false]
        ],
        init : function(canvas,pos){
            return new building(canvas,pos,"home")
        }
    }
}
class building extends jsgame.sprite{
    constructor(canvas,pos,type){
        super(canvas,pos)
        this.type = type
        this.list = []
        this.resource
        this.health
        this.shield
        this.production

        this.init()
        this.getBox()
    }
    init(){
        if (buildingList[this.type]){
            let building = buildingList[this.type]
            this.resource = util.copy(building.resource)
            this.health = [...building.health]
            this.shield = [...building.shield]
            this.production = building.production
            for (let i in building.has){
                this.has(...building.has[i])
            }
        }
    }
    getBox(){
        this.box = {}
        this.box["health"] = new box(...gameConfig.health.getBox(this))
        this.append(this.box["health"])
        this.box["shield"] = new box(...gameConfig.shield.getBox(this))
        this.append(this.box["shield"])
        this.box["process"] = new box(...gameConfig.process.getBox(this))
        this.append(this.box["process"])
        let k = 0
        let total = Object.keys(this.resource).length
        for (let i in this.resource){
            this.box[i] = new box(...gameConfig.resource.getBox(this,k,total,i))
            this.append(this.box[i])
            k ++ 
        }
    }
    produce(callback){
        let current = this.list[0]
        if (current){
            if (current[1] > 0){
                // NOT PRODUCE YET
                if (current[2] == current[1]){
                    // CHECK CAN PRODUCE OR NOT
                    let unit = unitList[current[0]]
                    for (let i in unit.cost.resource){
                        if (this.resource[i][0] < unit.cost.resource[i]){
                            return false
                        }
                    }
                    // COULD PRODUCE IF GOES SO FAR
                    // RESOURCE COST
                    for (let i in unit.cost.resource){
                        this._resourceInc(i,-unit.cost.resource[i])
                    }
                }
                current[1] -= this.production
                this._processChange(1 - current[1]/current[2])
            } else {
                let builder = unitList[current[0]].init(this.canvas,this.position)
                this.list.shift()
                this._processChange(0)
                callback(builder)
            }
            return true
        }
        return false
    }
    hasPlan(){
        return (!!this.list[0])
    }
    plan(type){
        if (unitList[type]){
            let unit = unitList[type]
            this.list.push([
                type,
                unit.cost.time,
                unit.cost.time
            ])
            return true
        }
        return false
    }
    _change(type,value){
        if (type == "health" || type == "shield"){
            let now = this[type]
            now[0] = Math.max(Math.min(value,now[1]),0)
            this.box[type].change(now[0]/now[1])
        }
        if (numjs.eq(this["health"][0],0)){
            this.die()
        }
    }
    _inc(type,inc){
        if (type == "health" || type == "shield"){
            let value = this[type][0] + inc
            this._change(type,value)
        }
    }
    _resourceChange(type,value){
        this.resource[type][0] = Math.max(Math.min(value,this.resource[type][1]),0)
        this.box[type].change(value/this.resource[type][1])
    }
    _resourceInc(type,inc){
        let value = this.resource[type][0] + inc
        this._resourceChange(type,value)
    }
    _processChange(value){
        value = Math.max(0,Math.min(value,1))
        this.box["process"].change(value)
    }
    _inc(type,inc){
        if (type == "health" || type == "shield"){
            let value = this[type][0] + inc
            this._change(type,value)
        }
    }
    _hurt(inc){
        if (this["shield"][0] > inc){
            this._inc("shield",-inc)
            return 
        }
        if (this["shield"][0] > 0){
            let real = inc - this["shield"][0]
            this._change("shield",0)
            this._inc("health",-real)
            return
        }
        this._inc("health",-inc)
    }
    
    static setHome(canvas,x,y){
        return buildingList["home"].init(canvas,[x,y])
    }
}
let unitList = {
    "worker" : {
        cost : {
            "time" : 300,
            "resource" : {
                "gas" : 0,
                "mine" : 50
            }
        },
        damage : 0.01,
        speed : 3,
        health : [100,100],
        shield : [100,100],
        resource : {
            "mine" : [1,4,1],
            "gas" : [0,1,1],
        },
        has : [
            [["rect",0,0,20,20],"yellow",false]
        ],
        init : function(canvas,pos){
            return new worker(canvas,pos)
        }
    },
    "melee" : {
        cost : {
            "time" : 500,
            "resource" : {
                "gas" : 0,
                "mine" : 100
            },
        },
        damage : 1,
        range : 0,
        speed : 3,
        health : [200,200],
        shield : [200,200],
        has : [
            [["rect",0,0,20,20],"orange",false]
        ],
        init : function(canvas,pos){
            return new melee(canvas,pos)
        }
    }
}
class unit extends jsgame.sprite{
    constructor(canvas,pos,type){
        super(canvas,pos)
        this.type = type
        this.damage
        this.speed
        this.health
        this.shield
        this.state = ["waiting"]
        this.init(type)
        this.getBox()
    }
    init(type){
        if (unitList[type]){
            let unit = unitList[type]
            this.damage = unit.damage
            this.speed = unit.speed
            this.health = [...unit.health]
            this.shield = [...unit.shield]
            for (let i in unit.has){
                this.has(...unit.has[i])
            }
        }
    }
    getBox(){
        this.box = {}
        this.box["health"] = new box(...gameConfig.health.getBox(this))
        this.append(this.box["health"])
        this.box["shield"] = new box(...gameConfig.shield.getBox(this))
        this.append(this.box["shield"])
    }
    toward(sprite){
        sprite = util.vectorize(sprite)
        let position = util.vectorize(this)
        let dif = sprite.sub(position)
        let dif_angle = dif.angle()
        this.rotateSelfTo(dif_angle)
    }
    move(speed){
        speed = Math.min(speed,this.speed)
        let inc = numjs.vector.polar(speed,this.angle()[0])
        this.translate(inc)
    }
    _change(type,value){
        if (type == "health" || type == "shield"){
            let now = this[type]
            now[0] = Math.max(Math.min(value,now[1]),0)
            this.box[type].change(now[0]/now[1])
        }
        if (numjs.eq(this["health"][0],0)){
            this.die()
        }
    }
    _inc(type,inc){
        if (type == "health" || type == "shield"){
            let value = this[type][0] + inc
            this._change(type,value)
        }
    }
    _hurt(inc){
        if (this["shield"][0] > inc){
            this._inc("shield",-inc)
            return 
        }
        if (this["shield"][0] > 0){
            let real = inc - this["shield"][0]
            this._change("shield",0)
            this._inc("health",-real)
            return
        }
        this._inc("health",-inc)
    }
}
class worker extends unit{
    constructor(canvas,pos){
        super(canvas,pos,"worker")
        //this.production = []
        this.route = []
        this.hasRoute = false
        this.resource
        this.workerInit()
    }
    workerInit(){
        this.resource = util.copy(unitList["worker"].resource)
        let k = 0
        let total = Object.keys(this.resource).length
        for (let i in this.resource){
            this.box[i] = new box(...gameConfig.resource.getBox(this,k,total,i))
            this.append(this.box[i])
            k ++
        }
    }
    _resourceChange(type,value){
        this.resource[type][0] = Math.max(Math.min(value,this.resource[type][1]),0)
        this.box[type].change(value/this.resource[type][1])
    }
    _resourceInc(type,inc){
        let value = this.resource[type][0] + inc
        this._resourceChange(type,value)
    }
    _get(building,type){
        gameConfig._stream(building,this,type)
    }
    _send(building,type){
        gameConfig._stream(this,building,type)
    }
    doRoute(){
        let current = this.route[this.route[2]]
        // 0 => get,1 => send
        if (this.isCollise(current)){
            if (this.route[2] == 0){
                // GET 
                for (let name in this.resource){
                    this._get(current,name)
                }
                // CHECK IF FULL 
                let has = this.resource[this.route[3]][0]
                let max = this.resource[this.route[3]][1]
                if (numjs.eq(has,max)){
                    this.route[2] = 1
                }
            } else {
                // SEND
                for (let name in this.resource){
                    this._send(current,name)
                }
                // CHECK IF EMPTY
                let has = this.resource[this.route[3]][0]
                if (numjs.eq(has,0)){
                    this.route[2] = 0
                }
            }
        } else {
            // GO TO
            this.toward(current)
            this.move(this.speed)
        }
    }
    createRoute(from,to,type){
        this.route = [from,to,0,type]
        this.hasRoute = true
    }
    removeRoute(){
        this.route = []
        this.hasRoute = false
    }
}
class melee extends unit{
    constructor(canvas,pos){
        super(canvas,pos,"melee")
        this.range
        this.meleeInit()
    }
    meleeInit(){
        if (unitList[this.type]){
            this.range = unitList[this.type].range
        }
    }
    attack(sprite){
        if (sprite){
            if (this.range == 0){
                if (this.isCollise(sprite)){
                    sprite._hurt(this.damage)
                } else {
                    this.toward(sprite)
                    this.move(this.speed)
                }
            }
        } else {
            return false
        }
    }
}
class modules{
    constructor(type,level){ 
        this.init(type,level)
    }

}
let resourceList = {
    "ore" : {
        resource : {
            "mine" : [10000,10000,1],
            "gas" : [0,1,1]
        },
        has : [
            [["rect",0,0,20,20],"grey",false]
        ]
    }
}
class resource extends jsgame.sprite{
    constructor(canvas,pos,type){
        super(canvas,pos)
        this.type = type
        this.resource
        this.init()
    }
    init(){
        if (resourceList[this.type]){
            let resource = resourceList[this.type]
            this.resource = util.copy(resource.resource)
            for (let i in resource.has){
                this.has(...resource.has[i])
            }
        }
    }
    _resourceChange(type,value){
        this.resource[type][0] = Math.max(Math.min(value,this.resource[type][1]),0)
        //this.box[type].change(value/this.resource[type][1])
    }
    _resourceInc(type,inc){
        let value = this.resource[type][0] + inc
        this._resourceChange(type,value)
    }
}
class box extends jsgame.sprite{
    constructor(canvas,pos,container,colors,box,percentage){
        super(canvas,pos,container)
        this.percentage = 1
        this._color = []
        this.colors = []
        this.box = jsgame.graphics.handle(box) 
        this.currentColor
        this.init(colors,percentage)
    }
    init(colors,percentage){
        percentage = percentage == 0 ? 0 : (percentage) ? percentage : 1
        for (let i in colors){
            colors[i][0] = jsgame.color.handle(colors[i][0])
            this._color.push(colors[i][0])
        }
        this.colors = colors
        this.currentColor = new jsgame.color(this.color())
        this.has(this.box,this.currentColor)
        if (percentage != 1){ this.change(percentage) }
    }
    change(point){
        point = Math.max(0.001,point)
        this.box.w = this.box.w/this.percentage * point
        this.percentage = point
        this.currentColor.change(this.color())
    }
    color(){
        let coe = []
        for (let i in this.colors){
            coe.push(1 - Math.abs(this.colors[i][1] - this.percentage))
        }
        return jsgame.color.blend(this._color,coe).relSetting
    }
}
let mapList = {
    "default" : {
        "resource" : {
            "ore" : [
                [10,10],
                [1990,1990],
            ]
        }
    }
}
function mapInit(ctx,name){
    let game_map = []
    let map = mapList[name]
    let resource = map["resource"]
    let ore = resource["ore"]  
    for (let i in ore){
        game_map.push(new resource(ctx,ore[i],"ore"))
    }
}
