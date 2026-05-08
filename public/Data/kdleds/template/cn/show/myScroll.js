if(typeof(myScroll)!='function'){
	var myScroll = function(LC,L1,L2,BL,BR,Sp,SL,PW,F,T){

		var List_Cont=LC;
		var List_1=L1;
		var List_2=L2;
		var RightBotton=BR;
		var LeftBotton=BL;

		var Speed = Sp; //速度(毫秒)
		var Space = SL; //每次移动(px)
		var PageWidth = PW; //翻页宽度
		var fill = F; //整体移位
		var Time=T?T:5000;	//自动滚动停顿时间
		var MoveLock = false;
		var MoveTimeObj;
		var MoveWay="right";
		var Comp = 0;

		var AutoPlayObj=1;
			GetObj(List_2).innerHTML=GetObj(List_1).innerHTML;
			GetObj(List_Cont).scrollLeft=fill>=0?fill:GetObj(List_1).scrollWidth-Math.abs(fill);
			GetObj(List_Cont).onmouseover=function(){
			clearInterval(AutoPlayObj)
		}

		GetObj(List_Cont).onmouseout=function(){
			AutoPlay()
		}
		GetObj(LeftBotton).onmousedown=function(){ISL_GoUp()}
		GetObj(LeftBotton).onmouseup=function(){ISL_StopUp()}
		GetObj(LeftBotton).onmouseout=function(){ISL_StopUp()}
		GetObj(RightBotton).onmousedown=function(){ISL_GoDown()}
		GetObj(RightBotton).onmouseup=function(){ISL_StopDown()}
		GetObj(RightBotton).onmouseout=function(){ISL_StopDown()}


		AutoPlay();
		function GetObj(objName){
			if(document.getElementById){
			return eval('document.getElementById("'+objName+'")')
			}
			else{
			return eval('document.all.'+objName)
			}
		}

		function AutoPlay(){
			clearInterval(AutoPlayObj);
			AutoPlayObj=setInterval(function(){ISL_GoDown();ISL_StopDown() },Time);
		}

		function ISL_GoUp(){
			if(MoveLock)return;
			clearInterval(AutoPlayObj);
			MoveLock=true;
			MoveWay="left";
			MoveTimeObj=setInterval(function(){ISL_ScrUp_1()},Speed);
		}

		function ISL_StopUp(){
			if(MoveWay == "right"){
			return
			}

			clearInterval(MoveTimeObj);
			if((GetObj(List_Cont).scrollLeft-fill)%PageWidth!=0){
				Comp=fill-(GetObj(List_Cont).scrollLeft%PageWidth);
				CompScr_1()
			}
			else{
				MoveLock=false
			}

			AutoPlay()
		}

		function ISL_ScrUp_1(){
			if(GetObj(List_Cont).scrollLeft<=0){
				GetObj(List_Cont).scrollLeft=GetObj(List_Cont).scrollLeft+GetObj(List_1).offsetWidth
			}

			GetObj(List_Cont).scrollLeft-=Space
		}

		function ISL_GoDown(){
			clearInterval(MoveTimeObj);
			if(MoveLock)return;
			clearInterval(AutoPlayObj);
			MoveLock=true;
			MoveWay="right";
			ISL_ScrDown_1();
			MoveTimeObj=setInterval(function(){ISL_ScrDown_1()},Speed)
		}

		function ISL_StopDown(){
			if(MoveWay == "left"){
			return
			}

			clearInterval(MoveTimeObj);
			if(GetObj(List_Cont).scrollLeft%PageWidth-(fill>=0?fill:fill+1)!=0){
			Comp=PageWidth-GetObj(List_Cont).scrollLeft%PageWidth+fill;
			CompScr_1()
			}
			else{
			MoveLock=false
			}

			AutoPlay()
		}


		function ISL_ScrDown_1(){
			if(GetObj(List_Cont).scrollLeft>=GetObj(List_1).scrollWidth){
				GetObj(List_Cont).scrollLeft=GetObj(List_Cont).scrollLeft-GetObj(List_1).scrollWidth
			}

			GetObj(List_Cont).scrollLeft+=Space
		}

		function CompScr_1(){
			if(Comp==0){
				MoveLock=false;
				return
			}

			var num,TempSpeed=Speed,TempSpace=Space;
			if(Math.abs(Comp)<PageWidth/2){
				TempSpace=Math.round(Math.abs(Comp/Space));
				if(TempSpace<1){
					TempSpace=1
				}

			}

			if(Comp<0){
				if(Comp<-TempSpace){
					Comp+=TempSpace;
					num=TempSpace
				}
				else{
					num=-Comp;
					Comp=0
				}

				GetObj(List_Cont).scrollLeft-=num;
				setTimeout(function(){CompScr_1()},TempSpeed)
			}
			else{
				if(Comp>TempSpace){
					Comp-=TempSpace;
					num=TempSpace
				}
				else{
					num=Comp;
					Comp=0
				}

				GetObj(List_Cont).scrollLeft+=num;
				setTimeout(function(){CompScr_1()},TempSpeed)
			}

		}

	}
}