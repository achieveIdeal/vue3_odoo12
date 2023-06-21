import{C as e,D as o,E as t,G as l,g as s,H as a,I as n,J as u,N as d,d as r,a as c,s as i,L as f,i as p,p as m,o as v,c as y,h as g,q as b,u as C,t as h,w as k,e as w,n as x,v as M,x as E,M as I,f as B,O as A,z as R,P as F,B as S,Q as $,R as L,S as D,T as z,U as O}from"./index.js";import{k as _,t as T,u as P,l as Y,m as q,n as N,o as X,p as j,r as H,d as U,e as V,P as G,i as J,f as K,F as Q,g as W,_ as Z,C as ee,U as oe,q as te,s as le,x as se,y as ae,z as ne,A as ue,B as de,D as re,w as ce}from"./RecordView.js";const ie=e=>{if(!e)return{onClick:d,onMousedown:d,onMouseup:d};let o=!1,t=!1;return{onClick:l=>{o&&t&&e(l),o=t=!1},onMousedown:e=>{o=e.target===e.currentTarget},onMouseup:e=>{t=e.target===e.currentTarget}}},fe=r({name:"ElOverlay",props:U({mask:{type:Boolean,default:!0},customMaskEvent:{type:Boolean,default:!1},overlayClass:{type:V([String,Array,Object])},zIndex:{type:V([String,Number])}}),emits:{click:e=>e instanceof MouseEvent},setup(e,{slots:o,emit:t}){const l=P("overlay"),{onClick:s,onMousedown:a,onMouseup:n}=ie(e.customMaskEvent?void 0:e=>{t("click",e)});return()=>e.mask?c("div",{class:[l.b(),e.overlayClass],style:{zIndex:e.zIndex},onClick:s,onMousedown:a,onMouseup:n},[i(o,"default")],G.STYLE|G.CLASS|G.PROPS,["onClick","onMouseup","onMousedown"]):f("div",{class:e.overlayClass,style:{zIndex:e.zIndex,position:"fixed",top:"0px",right:"0px",bottom:"0px",left:"0px"}},[i(o,"default")])}}),pe=Symbol("dialogInjectionKey"),me=U({center:{type:Boolean,default:!1},alignCenter:{type:Boolean,default:!1},closeIcon:{type:J},customClass:{type:String,default:""},draggable:{type:Boolean,default:!1},fullscreen:{type:Boolean,default:!1},showClose:{type:Boolean,default:!0},title:{type:String,default:""}}),ve=["aria-label"],ye=["id"],ge=r({name:"ElDialogContent"});var be=Z(r({...ge,props:me,emits:{close:()=>!0},setup(s){const a=s,{t:n}=K(),{Close:u}=ee,{dialogRef:d,headerRef:r,bodyId:f,ns:I,style:B}=p(pe),{focusTrapRef:A}=p(Q),R=((...o)=>t=>{o.forEach((o=>{e(o)?o(t):o.value=t}))})(A,d),F=m((()=>a.draggable));return((e,s,a)=>{let n={offsetX:0,offsetY:0};const u=o=>{const t=o.clientX,l=o.clientY,{offsetX:s,offsetY:a}=n,u=e.value.getBoundingClientRect(),d=u.left,r=u.top,c=u.width,i=u.height,f=document.documentElement.clientWidth,p=document.documentElement.clientHeight,m=-d+s,v=-r+a,y=f-d-c+s,g=p-r-i+a,b=o=>{const u=Math.min(Math.max(s+o.clientX-t,m),y),d=Math.min(Math.max(a+o.clientY-l,v),g);n={offsetX:u,offsetY:d},e.value.style.transform=`translate(${_(u)}, ${_(d)})`},C=()=>{document.removeEventListener("mousemove",b),document.removeEventListener("mouseup",C)};document.addEventListener("mousemove",b),document.addEventListener("mouseup",C)},d=()=>{s.value&&e.value&&s.value.removeEventListener("mousedown",u)};o((()=>{t((()=>{a.value?s.value&&e.value&&s.value.addEventListener("mousedown",u):d()}))})),l((()=>{d()}))})(d,r,F),(e,o)=>(v(),y("div",{ref:C(R),class:b([C(I).b(),C(I).is("fullscreen",e.fullscreen),C(I).is("draggable",C(F)),C(I).is("align-center",e.alignCenter),{[C(I).m("center")]:e.center},e.customClass]),style:E(C(B)),tabindex:"-1"},[g("header",{ref_key:"headerRef",ref:r,class:b(C(I).e("header"))},[i(e.$slots,"header",{},(()=>[g("span",{role:"heading",class:b(C(I).e("title"))},h(e.title),3)])),e.showClose?(v(),y("button",{key:0,"aria-label":C(n)("el.dialog.close"),class:b(C(I).e("headerbtn")),type:"button",onClick:o[0]||(o[0]=o=>e.$emit("close"))},[c(C(W),{class:b(C(I).e("close"))},{default:k((()=>[(v(),w(x(e.closeIcon||C(u))))])),_:1},8,["class"])],10,ve)):M("v-if",!0)],2),g("div",{id:C(f),class:b(C(I).e("body"))},[i(e.$slots,"default")],10,ye),e.$slots.footer?(v(),y("footer",{key:0,class:b(C(I).e("footer"))},[i(e.$slots,"footer")],2)):M("v-if",!0)],6))}}),[["__file","/home/runner/work/element-plus/element-plus/packages/components/dialog/src/dialog-content.vue"]]);const Ce=U({...me,appendToBody:{type:Boolean,default:!1},beforeClose:{type:V(Function)},destroyOnClose:{type:Boolean,default:!1},closeOnClickModal:{type:Boolean,default:!0},closeOnPressEscape:{type:Boolean,default:!0},lockScroll:{type:Boolean,default:!0},modal:{type:Boolean,default:!0},openDelay:{type:Number,default:0},closeDelay:{type:Number,default:0},top:{type:String},modelValue:{type:Boolean,default:!1},modalClass:String,width:{type:[String,Number]},zIndex:{type:Number},trapFocus:{type:Boolean,default:!1}}),he={open:()=>!0,opened:()=>!0,close:()=>!0,closed:()=>!0,[oe]:e=>te(e),openAutoFocus:()=>!0,closeAutoFocus:()=>!0},ke=["aria-label","aria-labelledby","aria-describedby"],we=r({name:"ElDialog",inheritAttrs:!1}),xe=ce(Z(r({...we,props:Ce,emits:he,setup(e,{expose:t}){const l=e,d=R();de({scope:"el-dialog",from:"the title slot",replacement:"the header slot",version:"3.0.0",ref:"https://element-plus.org/en-US/component/dialog.html#slots"},m((()=>!!d.title))),de({scope:"el-dialog",from:"custom-class",replacement:"class",version:"2.3.0",ref:"https://element-plus.org/en-US/component/dialog.html#attributes",type:"Attribute"},m((()=>!!l.customClass)));const r=P("dialog"),f=B(),p=B(),y=B(),{visible:h,titleId:x,bodyId:U,style:V,overlayDialogStyle:G,rendered:J,zIndex:K,afterEnter:Q,afterLeave:W,beforeLeave:Z,handleClose:ee,onModalClick:te,onOpenAutoFocus:ce,onCloseAutoFocus:me,onCloseRequested:ve,onFocusoutPrevented:ye}=((e,t)=>{const l=I().emit,{nextZIndex:d}=le();let r="";const c=se(),i=se(),f=B(!1),p=B(!1),v=B(!1),y=B(e.zIndex||d());let g,b;const C=ae("namespace",ne),h=m((()=>{const o={},t=`--${C.value}-dialog`;return e.fullscreen||(e.top&&(o[`${t}-margin-top`]=e.top),e.width&&(o[`${t}-width`]=_(e.width))),o})),k=m((()=>e.alignCenter?{display:"flex"}:{}));function w(){null==b||b(),null==g||g(),e.openDelay&&e.openDelay>0?({stop:g}=ue((()=>E()),e.openDelay)):E()}function x(){null==g||g(),null==b||b(),e.closeDelay&&e.closeDelay>0?({stop:b}=ue((()=>R()),e.closeDelay)):R()}function M(){e.beforeClose?e.beforeClose((function(e){e||(p.value=!0,f.value=!1)})):x()}function E(){Y&&(f.value=!0)}function R(){f.value=!1}return e.lockScroll&&((e,o={})=>{s(e)||T("[useLockscreen]","You need to pass a ref param to this function");const t=o.ns||P("popup"),l=a((()=>t.bm("parent","hidden")));if(!Y||q(document.body,l.value))return;let d=0,r=!1,c="0";const i=()=>{setTimeout((()=>{H(null==document?void 0:document.body,l.value),r&&document&&(document.body.style.width=c)}),200)};n(e,(e=>{if(!e)return void i();r=!q(document.body,l.value),r&&(c=document.body.style.width),d=N(t.namespace.value);const o=document.documentElement.clientHeight<document.body.scrollHeight,s=X(document.body,"overflowY");d>0&&(o||"scroll"===s)&&r&&(document.body.style.width=`calc(100% - ${d}px)`),j(document.body,l.value)})),u((()=>i()))})(f),n((()=>e.modelValue),(o=>{o?(p.value=!1,w(),v.value=!0,y.value=e.zIndex?y.value++:d(),A((()=>{l("open"),t.value&&(t.value.scrollTop=0)}))):f.value&&x()})),n((()=>e.fullscreen),(e=>{t.value&&(e?(r=t.value.style.transform,t.value.style.transform=""):t.value.style.transform=r)})),o((()=>{e.modelValue&&(f.value=!0,v.value=!0,w())})),{afterEnter:function(){l("opened")},afterLeave:function(){l("closed"),l(oe,!1),e.destroyOnClose&&(v.value=!1)},beforeLeave:function(){l("close")},handleClose:M,onModalClick:function(){e.closeOnClickModal&&M()},close:x,doClose:R,onOpenAutoFocus:function(){l("openAutoFocus")},onCloseAutoFocus:function(){l("closeAutoFocus")},onCloseRequested:function(){e.closeOnPressEscape&&M()},onFocusoutPrevented:function(e){var o;"pointer"===(null==(o=e.detail)?void 0:o.focusReason)&&e.preventDefault()},titleId:c,bodyId:i,closed:p,style:h,overlayDialogStyle:k,rendered:v,visible:f,zIndex:y}})(l,f);F(pe,{dialogRef:f,headerRef:p,bodyId:U,ns:r,rendered:J,style:V});const ge=ie(te),Ce=m((()=>l.draggable&&!l.fullscreen));return t({visible:h,dialogContentRef:y}),(e,o)=>(v(),w(O,{to:"body",disabled:!e.appendToBody},[c(z,{name:"dialog-fade",onAfterEnter:C(Q),onAfterLeave:C(W),onBeforeLeave:C(Z),persisted:""},{default:k((()=>[S(c(C(fe),{"custom-mask-event":"",mask:e.modal,"overlay-class":e.modalClass,"z-index":C(K)},{default:k((()=>[g("div",{role:"dialog","aria-modal":"true","aria-label":e.title||void 0,"aria-labelledby":e.title?void 0:C(x),"aria-describedby":C(U),class:b(`${C(r).namespace.value}-overlay-dialog`),style:E(C(G)),onClick:o[0]||(o[0]=(...e)=>C(ge).onClick&&C(ge).onClick(...e)),onMousedown:o[1]||(o[1]=(...e)=>C(ge).onMousedown&&C(ge).onMousedown(...e)),onMouseup:o[2]||(o[2]=(...e)=>C(ge).onMouseup&&C(ge).onMouseup(...e))},[c(C(re),{loop:"",trapped:C(h),"focus-start-el":"container",onFocusAfterTrapped:C(ce),onFocusAfterReleased:C(me),onFocusoutPrevented:C(ye),onReleaseRequested:C(ve)},{default:k((()=>[C(J)?(v(),w(be,$({key:0,ref_key:"dialogContentRef",ref:y},e.$attrs,{"custom-class":e.customClass,center:e.center,"align-center":e.alignCenter,"close-icon":e.closeIcon,draggable:C(Ce),fullscreen:e.fullscreen,"show-close":e.showClose,title:e.title,onClose:C(ee)}),L({header:k((()=>[e.$slots.title?i(e.$slots,"title",{key:1}):i(e.$slots,"header",{key:0,close:C(ee),titleId:C(x),titleClass:C(r).e("title")})])),default:k((()=>[i(e.$slots,"default")])),_:2},[e.$slots.footer?{name:"footer",fn:k((()=>[i(e.$slots,"footer")]))}:void 0]),1040,["custom-class","center","align-center","close-icon","draggable","fullscreen","show-close","title","onClose"])):M("v-if",!0)])),_:3},8,["trapped","onFocusAfterTrapped","onFocusAfterReleased","onFocusoutPrevented","onReleaseRequested"])],46,ke)])),_:3},8,["mask","overlay-class","z-index"]),[[D,C(h)]])])),_:3},8,["onAfterEnter","onAfterLeave","onBeforeLeave"])],8,["disabled"]))}}),[["__file","/home/runner/work/element-plus/element-plus/packages/components/dialog/src/dialog.vue"]]));export{xe as E};
