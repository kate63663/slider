/**
 * Copyright (c) 2010-2015 lper<lper@foxmail.com>
 * http://lper.com.cn/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
;(function($) {
	"use strict";
	$.extend($.fn, {
		slider:function(opts){
			var _default={
				'fx': 'ease-out', //css3动画效果（linear,ease,ease-out,ease-in,ease-in-out），不支持css3浏览器只有ease-out效果
				'auto': 0, //是否自动开始，负数表示非自动开始，0,1,2,3....表示自动开始以及从第几个开始
				'speed':600, //动画效果持续时间 ms
				'timeout':5000,//幻灯间隔时间 ms
				'sliderLiTagName':'li', //每个幻灯所在的标签的,
				'direction':'left', //left or right or up or down
				'mouseWheel':false,
				'isSliderIcon':true,//是否启用 为false时，iconBox,itemLi,itemLiCurrent的值可以不设置.
				'iconBox':'.dot',
				'itemLi':'div', //icon子元素.
				'itemLiCurrent':'active',//icon子元素选中的样式
				'before':function(){},
				'after':function(){},
			};
			opts= $.extend({},_default,opts);

			var isTouch = ("createTouch" in document) || ('ontouchstart' in window) || 0, //是否支持touch
				doc=document.documentElement || document.getElementsByTagName('html')[0], 
				isTransition = ("WebkitTransition" in doc.style) || ("transition" in doc.style) || 0,
				startEvent = isTouch ? "touchstart" : "mousedown",
				moveEvent = isTouch ? "touchmove" : "mousemove",
				endEvent = isTouch ? "touchend" : "mouseup", 
				self=this,
				ele,
				instance=[],
				cont=self;

				if(self.find('ul').length>0){
					ele=self;
					cont=ele.parent();
				}else{
					ele=$(cont.find('ul')[0]);
				}

				if(!ele) return ;

				for(var i=0;i<instance.length;i++){	
					if(instance[i]==cont[0]) throw new Error('An instance is running');
				}
				instance.push(cont[0]);
			
				

				//找到轮播的子项（ 默认li）
				var sliderChildren=ele.find(opts.sliderLiTagName), 
				//子项的数量
					sliderChildrenNums=sliderChildren.length,
				//单个轮播超时时间	
					timeout=Math.max(opts.timeout,opts.speed),
				//是否支持Touchs.	
					touching=!!isTouch,
				//是否css3transition.	
					css3transition=!!isTransition,
				//当前活动轮播的子项目	
				index=opts.auto<0 || opts.auto>=sliderChildrenNums ? 0:opts.auto,
				sliderIconItems=opts.isSliderTag?cont.find(opts.iconBox+' '+opts.itemLi):'',
				direction=opts.direction,
				vertical=false,
				resizeTimer;

				if(direction=='up' || direction=='down'){
					vertical=true;
				}

				function init(){
					cont.css({
								'overflow':'hidden',
								'visibility':'hidden',
								'listStyle':'none',
								'position':'relative'
					});
					
					if(opts.isSliderTag){
							if(liderIconItems.length>0){
								$(liderIconItems[0]).addClass(opts.itemLiCurrent);
							}
					}



					resize(); 

					begin();
					
					$(window).on('resize',function(){
						clearTimeout(resizeTimer);
						/*resizeTimer=setTimeout(function(){
							resize.apply(this,arguments)
						},100);*/
						resizeTimer=setTimeout(function(){resize()},100);

					});

					ele.on(startEvent,function(e){
						start(e);
					});
					$(document).on(moveEvent,function(e){
						move(e);
					}).on(endEvent,function(e){
						end(e);
					});

					ele.on('webkitTransitionEnd',function(e){
						transitionend(e);
					}).on('mousewheel DOMMouseScroll',function(){
						mouseScroll(e);
					})
	
				}
				
				function resize(){
					var cw=cont.width(),width,height,css,
					ch=cont.height(),
					cpl=parseInt(cont.css('padding-left')),
					cpr=parseInt(cont.css('padding-right')),
					cpt=parseInt(cont.css('padding-top')),
					cpb=parseInt(cont.css('padding-bottom'));
					opts.width=width=parseInt(cw-cpl-cpr);
					opts.height=height=parseInt(ch-cpt-cpb);
	
					css={'position':'relative','-webkit-transition-duration':'0ms'}
					if(vertical){
						css.height=height*length+'px';
						css.top=-height*index+'px';
						cont.css({'height':height+'px'});
					
					}else{
						css.width=width*length+'px';
						css.left=-width*index+'px';
					}
					ele.css(css);
					sliderChildren.css({
						'width':width+'px',
						'display':vertical?'table-row':'table-cell',
						'padding':0,
						'margin':0,
						'float':'left',
						'verticalAlign':'top'
					});
					cont.css({'visibility':'visible'});
				}

				function slide(){
					var dire=vertical?'top':'left',
					 size=vertical?'height':'width',
					 sindePx=0,
					index=index<0?sliderChildrenNums-1:index>=sliderChildrenNums?0:index,
					speed=typeof speed == 'undefined' ? opts.speed : parseInt(speed),
					timer=null,
					style=ele[0].style,
					t=0, //动画开始时间
					b=parseInt(style[dire]) || 0, //初始量
					c=-index*opts[size]-b, //变化量
					d=Math.abs(c)<opts[size]?Math.ceil(Math.abs(c)/opts[size]*speed/10):speed/10,//动画持续时间
					animate=function(t,b,c,d){ //缓动效果计算公式
						return -c * ((t=t/d-1)*t*t*t - 1) + b;
					},
					run=function(){
						if(t<d && !isTransition){
							t++;
							anipx=Math.ceil(animate(t,b,c,d));
							style[dire]=anipx+'px';
							timer=setTimeout(run, 10);
						}else{
							sindePx=-opts[size]*index;
							style[dire]=sindePx+'px';
							opts.index=index;
							if(!isTransition)transitionend();
							pause();
							begin();
						}
					
					}
					style.WebkitTransition = dire+' '+(d*10)+'ms '+opts.fx;
					opts.before.call(self, index, sliderChildren[opts.index]); 
					run();
				};


				function point(e){
					var x = 0,y = 0,
					body = document.body;
					if(!e) e=window.event;
					if (window.pageYoffset) {
						x = window.pageXOffset;
						y = window.pageYOffset;
					}else{
						x = (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
						y = (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
					}
					if(isTouch && e.touches.length){
						var et = e.touches[0];
						x += et.clientX;
						y += et.clientY;
					}else{
						x += e.clientX;
						y += e.clientY;
					}
					return {'x' : x, 'y' : y};
				}

				function start(e){
					if(!touching){
						preventDefault(e);
					}
					ele.on('click',function(){ return ;});
					opts.startPos=point(e);
					var style=ele[0].style;
					style.webkitTransitionDuration = style.transitionDuration = '0ms';
					opts.scrolling=1;//滚动屏幕
					opts.startTime=new Date();
				}
				function preventDefault(e){
					if(window.event){
						window.event.returnValue=false;
					}else{
						e.preventDefault();	
					} 	
				}

				function begin(){

					if(opts.timer || opts.auto<0){
						return ;
					}
					opts.timer=setTimeout(function(){
						direction=='left'||direction=='up' ? next() : prev();
					},opts.timeout);
					opts.status=1;

				}

				function transitionend(e){
					opts.after.call(self, opts.index, sliderChildren[opts.index]);
				}

				function mouseScroll(e){
					if(opts.mouseWheel){
						preventDefault(e);
					e=e||window.event;
				// 这里flag指鼠标滚轮的方向，1表示向上，-1向下
				var wheelDelta=e.wheelDelta || e.detail && e.detail*-1 || 0,
					flag=wheelDelta/Math.abs(wheelDelta); 
				wheelDelta>0?next():prev();
			}	
				}

				function pause(){

					clearInterval(opts.timer);
					opts.timer=null; 

				}

				function stop(){

					opts.pause();
					opts.index=0;
					slide(0);

				}

				function prev(){

					offset=typeof offset == 'undefined'?offset=1:offset%sliderChildren;
					var index=offset>opts.index?sliderChildrenNums+opts.index-offset:opts.index-offset;
					slide(index);

				}

				function next(){

					if(typeof offset == 'undefined') offset=1;
					slide((opts.index+offset)%sliderChildrenNums);

				}

				function move(e){
					if(!opts.scrolling || e.touches && e.touches.length>1 || e.scale && e.scale !== 1) return;
					
					var dire=vertical?'top':'left',
					size=vertical?'height':'width', 
					xy=vertical?'y':'x', 
					yx=vertical?'x':'y';
					opts.endPos=point(e);
					
					var offx=opts.endPos[xy]-opts.startPos[xy],
						offy=opts.endPos[yx]-opts.startPos[yx];
		
					if(opts.scrolling===2 || Math.abs(offx)>=Math.abs(offy)){
						
						preventDefault(e);
						//暂停轮播
						pause(); 
					
						offx=offx/((!opts.index&&offx>0 || opts.index==sliderChildrenNums-1&&offx<0) ? (Math.abs(offx)/opts[size]+1) : 1);
					
						ele[0].style[dire]=-opts.index*opts[size]+offx+'px';
						//标记拖动（有效触摸）2
						if(offx!=0)	opts.scrolling=2;
					}else {
						//设置为摒弃标记 0
						opts.scrolling=0;
					}
		
				}


				function end(e){

					try{
						
						var xy=vertical?'y':'x', 
							size=vertical?'height':'width', 
							offx=opts.endPos[xy]-opts.startPos[xy];
						if(opts.scrolling===2){
							ele.on('click',function(){return;});
						}
					}catch(err){
						offx=0;
					}
						
					if((new Date()-opts.startTime<250 && Math.abs(offx)>opts[size]*0.1 || 
						Math.abs(offx)>opts[size]/2) && ((offx<0 && opts.index+1<sliderChildrenNums) || 
						(offx>0 && opts.index>0))
					){
					
						offx>0?prev():next();

					}else{
						
						slide(opts.index);
					}

					if(opts.isSliderIcon){
						//nextIcon(opts.index);
					}
					
					opts.scrolling=0;
					opts.startPos=[];
					opts.endPos=[];
					opts.startTime=0;

					if(opts.auto>=0){
						begin();
					}				

			}

			init();
			
		}

	});

})(Zepto);