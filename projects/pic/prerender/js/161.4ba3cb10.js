"use strict";(self["webpackChunknueditor"]=self["webpackChunknueditor"]||[]).push([[161],{20149:function(){},43161:function(e,t,a){a.r(t),a.d(t,{default:function(){return F}});var l=a(29651),n=a(819),r=a(41463);const s=e=>((0,l.dD)("data-v-d7350c82"),e=e(),(0,l.Cn)(),e),i={class:"native-event-tester"},o={class:"native-event-tester__send-event"},c=s((()=>(0,l._)("div",{class:"native-event-tester__title"},"SEND EVENT",-1))),v={class:"native-event-tester__row horizontal"},u=s((()=>(0,l._)("div",{class:"native-event-tester__label"},"Event Name:",-1))),d={class:"native-event-tester__row vertical"},_=s((()=>(0,l._)("div",{class:"native-event-tester__label"},"Message Body:",-1))),m=["onKeydown"],b={class:"native-event-tester__row horizontal flex-between"},p={class:"native-event-tester__option"},g=s((()=>(0,l._)("div",{class:"native-event-tester__label-inverted"},"alert on timeout (5s)",-1))),k={class:"native-event-tester__row vertical"},w=s((()=>(0,l._)("div",{class:"native-event-tester__label"},"Callbacks From Native:",-1))),h={class:"native-event-tester__callbacks scrollbar-gray-thin"},C=["onClick"],S={class:"native-event-tester__label"},f={class:"native-event-tester__row horizontal flex-between"},y={class:"native-event-tester__option"},V=s((()=>(0,l._)("div",{class:"native-event-tester__label-inverted"},"clear on submit",-1))),E={key:0,class:"native-event-tester__row vertical native-event-tester__record-args"};function R(e,t,a,s,R,T){const x=(0,l.up)("svg-icon"),H=(0,l.up)("nubtn");return(0,l.wg)(),(0,l.iD)("div",i,[(0,l._)("div",{class:"native-event-tester__leave",style:(0,n.j5)(s.leaveStyles),onClick:s.goHome},[(0,l.Wm)(x,{iconName:"chevron-left",iconWidth:"24px",iconColor:"white"})],4),(0,l._)("div",o,[c,(0,l._)("div",v,[u,(0,l.wy)((0,l._)("input",{class:"native-event-tester__event-name","onUpdate:modelValue":t[0]||(t[0]=e=>s.eventName=e)},null,512),[[r.nr,s.eventName]])]),(0,l._)("div",d,[_,(0,l.wy)((0,l._)("textarea",{class:"native-event-tester__params",ref:"paramsEle",rows:"5","onUpdate:modelValue":t[1]||(t[1]=e=>s.eventParamsStr=e),onKeydown:(0,r.D2)((0,r.iM)(s.insertAtCursor,["prevent"]),["tab"])},null,40,m),[[r.nr,s.eventParamsStr]])]),(0,l._)("div",b,[(0,l._)("div",p,[(0,l.Wm)(s["Checkbox"],{modelValue:s.doAlertOnTimeout,"onUpdate:modelValue":t[2]||(t[2]=e=>s.doAlertOnTimeout=e)},null,8,["modelValue"]),g]),(0,l.Wm)(H,{class:"native-event-tester__submit",theme:"ghost",size:"sm",disabled:!s.eventParamsValid||""===s.eventName,onClick:s.submitEvent},{default:(0,l.w5)((()=>[(0,l.Uk)("SEND")])),_:1},8,["disabled"])]),(0,l._)("div",k,[w,(0,l._)("div",h,[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(s.callbackRecords,(e=>((0,l.wg)(),(0,l.iD)("div",{class:(0,n.C_)(["native-event-tester__callback",{selected:s.checkRecordSelected(e)}]),key:e.id,onClick:t=>s.selectRecord(e)},[(0,l._)("div",S,(0,n.zw)(e.name),1)],10,C)))),128))])]),(0,l._)("div",f,[(0,l._)("div",y,[(0,l.Wm)(s["Checkbox"],{modelValue:s.doClearOnSubmet,"onUpdate:modelValue":t[3]||(t[3]=e=>s.doClearOnSubmet=e)},null,8,["modelValue"]),V]),(0,l.Wm)(H,{class:"native-event-tester__clear",theme:"ghost",size:"sm",onClick:s.clearCallbacks},{default:(0,l.w5)((()=>[(0,l.Uk)("CLEAR")])),_:1})]),s.selectedRecord?((0,l.wg)(),(0,l.iD)("div",E,[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(s.selectedRecord.args,(e=>((0,l.wg)(),(0,l.iD)("pre",{class:"native-event-tester__record-arg",key:e.toString()},(0,n.zw)(s.processedArg(e)),1)))),128))])):(0,l.kq)("",!0)])])}var T=a(15924),x=a(20149),H=a(47147),N=(e=>(e[e["Vivipic"]=0]="Vivipic",e[e["Vivisticker"]=1]="Vivisticker",e[e["Charmix"]=2]="Charmix",e))(N||{});const O=0;var A=H.Z,D=a(78871),P=a(50559),U=a(1890),z=a(38058),I=(e=>(e[e["IOS"]=0]="IOS",e[e["Android"]=1]="Android",e))(I||{}),W=(0,l.aZ)({__name:"NativeEventTester",setup(e,{expose:t}){t();const a=(0,U.iH)(0);let n="";switch(O){case N.Vivipic:n="main";break;case N.Vivisticker:n="vvstk";break}A.registerCallbacks(n);const r=(0,z.oR)(),s=(0,l.Fl)((()=>r.getters["webView/getCallbackRecords"])),i=(0,l.Fl)((()=>{var e;const t=A.getUserInfoFromStore();return{top:`${null!=(e=t.statusBarHeight)?e:0}px`}})),o=()=>{window.location.pathname=""},c=(0,U.iH)(null),v=(0,U.iH)(""),u=(0,U.iH)("{}"),d=(0,U.iH)(!0);let _=(0,U.qj)({});(0,l.m0)((()=>{try{_=JSON.parse(u.value),d.value=!0}catch(e){d.value=!1}}));const m=()=>{const e="\t";if(c.value)if(c.value.selectionStart||0===c.value.selectionStart){const t=c.value.selectionStart,a=c.value.selectionEnd;u.value=u.value.substring(0,t)+e+u.value.substring(a,u.value.length),(0,l.Y3)((()=>{c.value&&(c.value.selectionStart=t+e.length,c.value.selectionEnd=t+e.length)}))}else u.value+=e},b=(0,U.iH)(!0),p=(0,U.iH)(!0);let g=-1;const k=()=>{window.clearTimeout(g),g=-1};(0,l.YP)((()=>s),(e=>{0!==e.value.length&&k()}),{deep:!0});const w=()=>{p.value&&h(),k(),b.value&&(g=window.setTimeout((()=>{(0,P.h4)({group:"error",text:"no reply in 5 seconds"})}),5e3));try{switch(a.value){case 0:A.sendToIOS(v.value,_,!0);break;case 1:break}}catch(e){k(),(0,P.h4)({group:"error",text:e.toString()})}},h=()=>{r.commit("webView/UPDATE_clearCallbackRecords"),C.value=null},C=(0,U.iH)(null),S=e=>{C.value=e},f=e=>{var t;return(null==(t=C.value)?void 0:t.id)===e.id},y=e=>JSON.stringify(D.Z.unproxify(e),void 0,2),V={mobileOSType:I,mobileOS:a,get callbackGroup(){return n},set callbackGroup(e){n=e},store:r,callbackRecords:s,leaveStyles:i,goHome:o,paramsEle:c,eventName:v,eventParamsStr:u,eventParamsValid:d,get eventParams(){return _},set eventParams(e){_=e},insertAtCursor:m,doAlertOnTimeout:b,doClearOnSubmet:p,get eventTimeout(){return g},set eventTimeout(e){g=e},resetEventTimeout:k,submitEvent:w,clearCallbacks:h,selectedRecord:C,selectRecord:S,checkRecordSelected:f,processedArg:y,Checkbox:T.Z,get ICallbackRecord(){return x.ICallbackRecord},get autoWVUtils(){return A},get app(){return O},get appType(){return N},get generalUtils(){return D.Z},get notify(){return P.h4},computed:l.Fl,nextTick:l.Y3,reactive:U.qj,ref:U.iH,watch:l.YP,watchEffect:l.m0,get useStore(){return z.oR}};return Object.defineProperty(V,"__isScriptSetup",{enumerable:!1,value:!0}),V}}),Y=a(53372);const Z=(0,Y.Z)(W,[["render",R],["__scopeId","data-v-d7350c82"],["__file","NativeEventTester.vue"]]);var F=Z}}]);
//# sourceMappingURL=161.4ba3cb10.js.map