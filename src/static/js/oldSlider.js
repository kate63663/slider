(function(window, undefined){ 
	var isTouches = ("createTouch" in document) || ('ontouchstart' in window) || 0,sliderList=[],
	doc=document.documentElement || document.getElementsByTagName('html')[0], 
	isTransition = ("WebkitTransition" in doc.style) 
						|| ("transition" in doc.style) 
						|| 0,
	isStartEvent = isTouches ? "touchstart" : "mousedown",
	isMoveEvent = isTouches ? "touchmove" : "mousemove",
	isEndEvent = isTouches ? "touchend" : "mouseup", 		
	slider=function(opt){  
		var opt = $.extend({},this._default,opt);
		this.opt=opt;
		
		this.container=$("#"+opt.id);
		try{	
			if(this.container[0].nodeName.toLowerCase()=='ul'){
				this.element=this.container;
				this.container=this.element[0].parentNode;
			}else{
				this.element=$(this.container.find('ul')[0]);
			}
			if(typeof this.element==='undefined')	throw new Error('Can\'t find "ul"');
			for(var i=0;i<this.instance.length;i++){	
				
				if(this.instance[i]==this.container[0]) throw new Error('An instance is running');
			}
			this.instance.push(this.container[0]);
			this.setup();
			
		}catch(e){
			this.status=-1;
			this.errorInfo=e.message;
		}
	}
	slider.prototype={
		//默认配置
		_default: {
			'id': 'slider', //幻灯容器的id
			'fx': 'ease-out', //css3动画效果（linear,ease,ease-out,ease-in,ease-in-out），不支持css3浏览器只有ease-out效果
			'auto': 0, //是否自动开始，负数表示非自动开始，0,1,2,3....表示自动开始以及从第几个开始
			'speed':600, //动画效果持续时间 ms
			'timeout':5000,//幻灯间隔时间 ms
			'className':'', //每个幻灯所在的li标签的classname,
			'direction':'left', //left right up down
			'mouseWheel':false,
			'isSliderTag':1,//是否启用 为0时，bulletItem,bulletItemCurrent的值可以不设置.
			'ItemTagName':'.v4_dot',
			'tagItemli':'span', //icon子元素.
			'tagItemCurrent':'active',//icon子元素选中的样式
			'isClient':true,
			'before':function(){},
			'after':function(){},
		},
		instance:[],
		//获取鼠标坐标
		getMousePoint:function(ev) {
			var x = y = 0,
			doc = document.documentElement,
			body = document.body;
			if(!ev) ev=window.event;
			if (window.pageYoffset) {
				x = window.pageXOffset;
				y = window.pageYOffset;
			}else{
				x = (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
				y = (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
			}
			if(isTouches && ev.touches.length){
				var evt = ev.touches[0];
				x += evt.clientX;
				y += evt.clientY;
			}else{
				x += ev.clientX;
				y += ev.clientY;
			}
			return {'x' : x, 'y' : y};
		},
	
		preventDefault:function(e){
			if(window.event)window.event.returnValue=false;
			else e.preventDefault();
		},
		//修正函数作用环境
		bind:function(func, obj){
			return function(){
				return func.apply(obj, arguments);
			}
		},
		//初始化
		setup: function(){
			_this=this;
			this.status=0;//状态码，0表示停止状态，1表示运行状态，2表示暂停状态，-1表示出错
			this.slides=this.opt.className?this.element.find(this.opt.className):this.element.find('li');
			this.length=this.slides.length; this.opt.timeout=Math.max(this.opt.timeout,this.opt.speed);
			this.touching=!!isTouches; this.css3transition=!!isTransition; 
			this.index=this.opt.auto<0 || this.opt.auto>=this.length ? 0:this.opt.auto;
			if(this.opt.isSliderTag==1){
				this.sldierTagItems=this.opt.ItemTagName?this.container.find(this.opt.ItemTagName+' div'):this.element.find("div[attr=sliderTag] div");
				$(this.sldierTagItems[0]).addClass(this.opt.tagItemCurrent);
			}
			
			switch(this.opt.direction){
				case 'up': this.direction='up'; this.vertical=true; break;
				case 'down': this.direction='down'; this.vertical=true; break;
				case 'right': this.direction='right'; this.vertical=false; break;
				default:this.direction='left'; this.vertical=false; break;
			}

			this.resize(); this.begin();
					$(window).bind('resize',this.bind(function(){
					clearTimeout(this.resizeTimer);
					this.resizeTimer=setTimeout(this.bind(this.resize,this),100);
			},this));
			this.element.bind(isStartEvent,this.bind(this._start,this));
			$(document).bind(isMoveEvent,this.bind(this._move,this));
			$(document).bind(isEndEvent,this.bind(this._end,this));
			this.element.bind('webkitTransitionEnd',this.bind(this._transitionend,this));
			this.element.bind('mousewheel',this.bind(this.mouseScroll,this))
							.bind('DOMMouseScroll',this.bind(this.mouseScroll,this));
		},
		resize:function(){
			var $ct=this.container;
			$ct.css({'overflow':'hidden','visibility':'hidden','listStyle':'none','position':'relative'})
			var cw=$ct.width(),
				ch=$ct.height(),
				cpl=parseInt($ct.css('padding-left')),
				cpr=parseInt($ct.css('padding-right')),
				cpt=parseInt($ct.css('padding-top')),
				cpb=parseInt($ct.css('padding-bottom'));
			this.width=cw-cpl-cpr;
			this.height=ch-cpt-cpb;
	
			css={'position':'relative','-webkit-transition-duration':'0ms'}
			if(this.vertical){
				css['height']=this.height*this.length+'px';
				css['top']=-this.height*this.index+'px';
				$ct.css({'height':this.height+'px'});
			
			}else{
				css['width']=this.width*this.length+'px';
				css['left']=-this.width*this.index+'px';
			}
			this.element.css(css);
			this.slides.css({'width':this.width+'px','display':this.vertical?'table-row':'table-cell','padding':0,'margin':0,'float':'left','verticalAlign':'top'})
			$ct.css({'visibility':'visible'});
		},
		slide:function(index, speed){
			
			var direction=this.vertical?'top':'left', size=this.vertical?'height':'width';
			index=index<0?this.length-1:index>=this.length?0:index;
			speed=typeof speed == 'undefined' ? this.opt.speed : parseInt(speed);
			var el=this.element, timer=null,
				style=el[0].style,
				_this=this,
				t=0, //动画开始时间
				b=parseInt(style[direction]) || 0, //初始量
				c=-index*this[size]-b, //变化量
				d=Math.abs(c)<this[size]?Math.ceil(Math.abs(c)/this[size]*speed/10):speed/10,//动画持续时间
				ani=function(t,b,c,d){ //缓动效果计算公式
					return -c * ((t=t/d-1)*t*t*t - 1) + b;
				},
				run=function(){
					if(t<d && !isTransition){
						t++;
						anipx=Math.ceil(ani(t,b,c,d));
						style[direction]=anipx+'px';
						timer=setTimeout(run, 10);
					}else{
						sindepx=-_this[size]*index;
						style[direction]=sindepx+'px';
						_this.index=index;
						if(!isTransition)_this._transitionend();
						_this.pause();_this.begin();
					}
					if(typeof Lazy !='undefined')Lazy.Load();
				}
			
			style.WebkitTransition = direction+' '+(d*10)+'ms '+this.opt.fx;
			this.opt.before.call(this, index, this.slides[this.index]); run();
		},
		begin:function(){
			if(this.timer || this.opt.auto<0){
				return true;
			}
			this.timer=setTimeout(function(){
					this.direction=='left'||this.direction=='up' ? this.next() : this.prev();
				},this.opt.timeout);
			this.status=1;
		},
		pause:function(){
			clearInterval(this.timer);
			this.timer=null; 
			this.status=2;
		},
		stop:function(){
			this.pause();
			this.index=0;
			this.slide(0);
			this.status=0;
		},
		prev:function(offset){
			offset=typeof offset == 'undefined'?offset=1:offset%this.length;
			var index=offset>this.index?this.length+this.index-offset:this.index-offset;
			this.slide(index);
		},
		currentSliderTag:function(index){
			_this=this;
			console.log(this.sldierTagItems);
			this.sldierTagItems.each(function(i){
				 $(this).removeClass(_this.opt.tagItemCurrent)
			});
			$(this.sldierTagItems[index]).addClass(_this.opt.tagItemCurrent);
		},
		next:function(offset){
			if(typeof offset == 'undefined') offset=1;
			this.slide((this.index+offset)%this.length);
		},
		_start:function(e){
			if(!this.touching)this.preventDefault(e);
			this.element.bind('click',function(){return false;});
			this.startPos=this.getMousePoint(e);
			var style=this.element[0].style;
			style.webkitTransitionDuration = style.transitionDuration = '0ms';
			this.scrolling=1;//滚动屏幕
			this.startTime=new Date();
			if(this.opt.isClient && zyUrl && zyUrl.vid>=6800){
				zy.enableScreen(false);
			}
		},
		_move:function(e){
			if(!this.scrolling || e.touches && e.touches.length>1 || e.scale && e.scale !== 1) return;
			var direction=this.vertical?'top':'left', size=this.vertical?'height':'width', xy=this.vertical?'y':'x', yx=this.vertical?'x':'y';
			this.endPos=this.getMousePoint(e);
			var offx=this.endPos[xy]-this.startPos[xy];
		
			if(this.scrolling===2 || Math.abs(offx)>=Math.abs(this.endPos[yx]-this.startPos[yx])){
				this.preventDefault(e);
				this.pause(); //暂停幻灯
				
				offx=offx/((!this.index&&offx>0 || this.index==this.length-1&&offx<0) ? (Math.abs(offx)/this[size]+1) : 1);
				
				this.element[0].style[direction]=-this.index*this[size]+offx+'px';
				
				if(offx!=0)this.scrolling=2;//标记拖动（有效触摸）2
			}else this.scrolling=0;//设置为摒弃标记0
			if(this.opt.isClient && zyUrl && zyUrl.vid>=6800){
				if(offx > 0 && this.index == 0){ //调用客户端的滚动函数
						this.slide(this.index);
					zy.enableScreen(true);
				}else{ //禁用客户端的滚动函数
					zy.enableScreen(false);
				}
			}
			
		},
		_end:function(e){
			if(typeof this.scrolling != 'undefined'){
				
				try{
					
					var xy=this.vertical?'y':'x', size=this.vertical?'height':'width', offx=this.endPos[xy]-this.startPos[xy];
					
					if(this.scrolling===2)this.element.bind('click',function(){return false;})
				}catch(err){
					offx=0;
				}
					
				if((new Date()-this.startTime<250 && Math.abs(offx)>this[size]*0.1 || Math.abs(offx)>this[size]/2) && ((offx<0 && this.index+1<this.length) || (offx>0 && this.index>0))){
				
					offx>0?this.prev():this.next();
				}else{
					
					this.slide(this.index);
				}
				if(this.opt.isSliderTag==1)this.currentSliderTag(this.index);
				delete this.scrolling;//删掉标记
				delete this.startPos;
				delete this.endPos;
				delete this.startTime;
				if(this.opt.auto>=0)this.begin();				
			}
		},
		mouseScroll:function(e){
			if(this.opt.mouseWheel){
				this.preventDefault(e);
				e=e||window.event;
				// 这里flag指鼠标滚轮的方向，1表示向上，-1向下
				var wheelDelta=e.wheelDelta || e.detail && e.detail*-1 || 0,
					flag=wheelDelta/Math.abs(wheelDelta); 
				wheelDelta>0?this.next():this.prev();
			}
		},
		_transitionend:function(e){
		
			this.opt.after.call(this, this.index, this.slides[this.index]);
		}
	}
	window.slider=slider;
})(window);