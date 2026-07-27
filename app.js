
const CATEGORIES=["Başlangıçlar","Soğuk Mezeler","Yoğurtlu Mezeler","Sıcak Mezeler","Soğuk Deniz Mahsulleri","Sıcak Deniz Mahsulleri"];
const cfg=window.GIZ_CONFIG||{};
const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes("BURAYA_")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes("BURAYA_");
const supabase= configured ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY) : null;
let products=[]; let customerMode=false; let activeMenuCategory=CATEGORIES[0];
const $=s=>document.querySelector(s);

function fillSelects(){
  CATEGORIES.forEach(c=>{
    $("#categoryFilter").insertAdjacentHTML("beforeend",`<option>${c}</option>`);
    $("#category").insertAdjacentHTML("beforeend",`<option>${c}</option>`);
  });
  $("#categoryTabs").innerHTML=CATEGORIES.map(c=>`<button data-cat="${c}">${c}</button>`).join("");
}

async function loadProducts(){
  if(!configured){$("#setupWarning").hidden=false;return;}
  const {data,error}=await supabase.from("products").select("*").order("category").order("menu_order");
  if(error){alert("Veriler alınamadı: "+error.message);return;}
  products=data||[];
  renderAdmin(); renderCustomer();
}

function renderAdmin(){
  const q=$("#search").value.toLocaleLowerCase("tr");
  const cf=$("#categoryFilter").value;
  const list=products.filter(p=>(!cf||p.category===cf)&&p.name.toLocaleLowerCase("tr").includes(q))
    .sort((a,b)=>CATEGORIES.indexOf(a.category)-CATEGORIES.indexOf(b.category)||a.menu_order-b.menu_order);
  $("#stats").innerHTML=CATEGORIES.map(c=>`<div class="pill">${c}: ${products.filter(p=>p.category===c).length}</div>`).join("")+`<div class="pill">Toplam: ${products.length}</div>`;
  $("#adminList").innerHTML=list.map(p=>`<button class="card ${p.status==='inactive'?'inactive':''}" data-id="${p.id}">
    <h3>${p.menu_order}. ${p.name}</h3><div class="meta">${p.category} · ${p.status==='active'?'Aktif':'Pasif'}</div></button>`).join("");
  document.querySelectorAll(".card").forEach(x=>x.onclick=()=>openEditor(+x.dataset.id));
}
function renderCustomer(){
  document.querySelectorAll("#categoryTabs button").forEach(b=>b.classList.toggle("active",b.dataset.cat===activeMenuCategory));
  const list=products.filter(p=>p.category===activeMenuCategory&&p.status==="active").sort((a,b)=>a.menu_order-b.menu_order);
  $("#menuList").innerHTML=list.map(p=>`<article class="menu-item">
    <h3>${p.menu_order}. ${p.name}</h3>
    ${p.description?`<div>${p.description}</div>`:""}
    ${p.allergens?`<div class="allergens">Alerjen: ${p.allergens}</div>`:""}
  </article>`).join("");
}
function openEditor(id){
  const p=products.find(x=>x.id===id);
  $("#editorTitle").textContent=p?"Ürünü Düzenle":"Yeni Ürün";
  $("#productId").value=p?.id||"";
  $("#name").value=p?.name||"";
  $("#category").value=p?.category||CATEGORIES[0];
  $("#menuOrder").value=p?.menu_order||1;
  $("#description").value=p?.description||"";
  $("#recipe").value=p?.recipe||"";
  $("#allergens").value=p?.allergens||"";
  $("#photoUrl").value=p?.photo_url||"";
  $("#status").value=p?.status||"active";
  $("#deleteBtn").style.visibility=p?"visible":"hidden";
  $("#editor").showModal();
}
$("#editorForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const id=+$("#productId").value;
  const payload={
    name:$("#name").value.trim(),category:$("#category").value,menu_order:+$("#menuOrder").value,
    description:$("#description").value.trim(),recipe:$("#recipe").value.trim(),
    allergens:$("#allergens").value.trim(),photo_url:$("#photoUrl").value.trim(),status:$("#status").value
  };
  const res=id?await supabase.from("products").update(payload).eq("id",id):await supabase.from("products").insert(payload);
  if(res.error){alert(res.error.message);return;}
  $("#editor").close(); await loadProducts();
});
$("#deleteBtn").onclick=async()=>{
  const id=+$("#productId").value;
  if(confirm("Bu ürün silinsin mi?")){
    const {error}=await supabase.from("products").delete().eq("id",id);
    if(error){alert(error.message);return;}
    $("#editor").close(); await loadProducts();
  }
};
$("#cancelBtn").onclick=()=>$("#editor").close();
$("#addBtn").onclick=()=>openEditor();
$("#search").oninput=renderAdmin;$("#categoryFilter").onchange=renderAdmin;
$("#modeBtn").onclick=()=>{customerMode=!customerMode;$("#adminView").hidden=customerMode;$("#customerView").hidden=!customerMode;$("#modeBtn").textContent=customerMode?"Yönetim Paneli":"Müşteri Menüsü";if(customerMode)renderCustomer();};
document.addEventListener("click",e=>{if(e.target.matches("#categoryTabs button")){activeMenuCategory=e.target.dataset.cat;renderCustomer();}});
if(window.QRCode)QRCode.toCanvas($("#qrCanvas"),location.href,{width:180},()=>{});
fillSelects();loadProducts();
