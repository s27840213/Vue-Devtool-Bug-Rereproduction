"use strict";(self["webpackChunknueditor"]=self["webpackChunknueditor"]||[]).push([[968],{69968:function(e,t,n){n.r(t),n.d(t,{default:function(){return P}});var o=n(29651),r=n(819);const i={key:1,class:"preview__host"};function s(e,t,n,s,c,a){const u=(0,o.up)("page-content");return(0,o.wg)(),(0,o.iD)("div",{class:"preview",style:(0,r.j5)(e.containStyles)},[e.config?((0,o.wg)(),(0,o.j4)(u,{key:0,config:e.config,pageIndex:0,contentScaleRatio:e.contentScaleRatio,forceRender:!0},null,8,["config","contentScaleRatio"])):(0,o.kq)("",!0),e.host?((0,o.wg)(),(0,o.iD)("span",i,(0,r.zw)(e.host),1)):(0,o.kq)("",!0)],4)}var c=n(69243),a=n(32905),u=n(38058),l=Object.defineProperty,h=Object.defineProperties,p=Object.getOwnPropertyDescriptors,g=Object.getOwnPropertySymbols,d=Object.prototype.hasOwnProperty,v=Object.prototype.propertyIsEnumerable,f=(e,t,n)=>t in e?l(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,w=(e,t)=>{for(var n in t||(t={}))d.call(t,n)&&f(e,n,t[n]);if(g)for(var n of g(t))v.call(t,n)&&f(e,n,t[n]);return e},S=(e,t)=>h(e,p(t)),b=(0,o.aZ)({emits:[],name:"Preview",components:{PageContent:c.Z},data(){return{}},computed:S(w(w({},(0,u.rn)({contentScaleRatio:"defaultContentScaleRatio"})),(0,u.Se)({pages:"getPages"})),{host(){const e=window.location.host,t=e.match(/(.+).vivipic.com/),n=new URLSearchParams(window.location.search);return["test.vivipic.com","vivipic.com"].includes(e)||n.has("hideHostLabel")?"":"localhost:8080"===e?"local":t?t[1]:e},config(){if(0===this.pages.length)return;const e=this.pages[0];return e.isEnableBleed?w(w({},e),a.Z.getPageSizeWithBleeds(e)):e},containStyles(){return{transform:`scale(${1/this.contentScaleRatio})`}}}),methods:w({},(0,u.OI)({setInScreenshotPreview:"SET_inScreenshotPreview",setIsGettingDesign:"SET_isGettingDesign"})),mounted(){const e=this.$router.currentRoute.value.query.type,t=this.$router.currentRoute.value.query.design_id,n=this.$router.currentRoute.value.query.team_id;e&&t&&n||this.setIsGettingDesign(!1),this.setInScreenshotPreview(!0)},beforeUnmount(){this.setInScreenshotPreview(!1)}}),m=n(53372);const y=(0,m.Z)(b,[["render",s],["__scopeId","data-v-be060502"],["__file","Preview.vue"]]);var P=y}}]);
//# sourceMappingURL=968.413c53a5.js.map