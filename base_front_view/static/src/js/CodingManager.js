import{a as e,b as a}from"./RecordView.js";import{_ as t}from"./PageHeader.js";import{d as l,f as n,c as o,a as s,w as r,u,g as m,F as p,k as _,l as i,o as c,m as d,e as f,n as v,K as k}from"./index.js";import{_ as g}from"./MinPack.vue_vue_type_script_setup_true_lang.js";import{_ as j}from"./BoardPack.vue_vue_type_script_setup_true_lang.js";import{_ as b}from"./OuterPack.vue_vue_type_script_setup_true_lang.js";import"./el-overlay.js";const y=l({__name:"CodingManager",setup(l){const y=_(),P=[{name:"min_pack",title:"最小包装",component:g},{title:"外箱包装",name:"outer_pack",component:b},{name:"board_pack",component:j,title:"卡板包装"}],V=y.currentRoute.value.path.split("/");n(0);let w=n(V[V.length-1]);const C=e=>{y.replace({name:e.paneName})};return(l,n)=>{const _=t,g=a,j=e,b=i("router-view");return c(),o(p,null,[s(_,{title:"赋码标签信息"}),s(j,{modelValue:u(w),"onUpdate:modelValue":n[0]||(n[0]=e=>m(w)?w.value=e:w=e),onTabClick:C},{default:r((()=>[(c(),o(p,null,d(P,((e,a)=>s(g,{label:e.title,name:e.name,key:a},null,8,["label","name"]))),64))])),_:1},8,["modelValue"]),s(b,null,{default:r((({Component:e})=>[(c(),f(k,null,[(c(),f(v(e)))],1024))])),_:1})],64)}}});export{y as default};
