const KEY="sandarbha_posts_v1";

function posts(){
  try{
    return JSON.parse(localStorage.getItem(KEY)||"[]")
  }catch(e){
    return[]
  }
}

function savePost(p){
  const a=posts();
  a.unshift({
    ...p,
    id:Date.now(),
    status:"draft",
    created:new Date().toISOString()
  });
  localStorage.setItem(KEY,JSON.stringify(a));
  return a[0]
}

function esc(s){
  return String(s||"").replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[m])
  )
}

function aiDraft(){
  const topic=document.querySelector("#topic")?.value.trim();

  if(!topic)
    return alert("पहले विषय लिखें।");

  document.querySelector("#headline").value=topic;

  document.querySelector("#body").value=
`AI संपादक प्रारूप

मुख्य तथ्य: ${topic} से संबंधित उपलब्ध स्रोतों की पुष्टि आवश्यक है।

क्या पता है: प्राथमिक स्रोत, आधिकारिक दस्तावेज़ और प्रत्यक्ष बयान अलग-अलग दर्ज किए जाएँ।

दावा: संबंधित पक्षों के दावों को स्पष्ट रूप से स्रोत के साथ प्रस्तुत किया जाए।

संपादकीय नोट: प्रकाशन से पहले मुख्य संपादक द्वारा तथ्य-जांच और स्रोत सत्यापन अनिवार्य है।`;

  document.querySelector("#aiStatus").textContent=
    "AI ड्राफ्ट तैयार — मानव संपादन आवश्यक";
}

function publish(){
  const title=document.querySelector("#headline")?.value.trim();
  const body=document.querySelector("#body")?.value.trim();

  if(!title||!body)
    return alert("शीर्षक और समाचार आवश्यक हैं।");

  const p=savePost({
    title,
    body,
    author:"मुख्य संपादक"
  });

  document.querySelector("#pubStatus").textContent=
    "ड्राफ्ट स्थानीय न्यूज़रूम कतार में सुरक्षित है। वास्तविक सार्वजनिक प्रकाशन के लिए सुरक्षित backend जोड़ना होगा। ID: "+p.id;
}

function loadPosts(){
  const box=document.querySelector("#posts");

  if(!box)return;

  box.innerHTML=posts().map(p=>
    "<div class='card'><b>"+
    esc(p.title)+
    "</b><p class='mut'>"+
    esc(p.author)+" · "+
    esc(p.status)+
    "</p><p>"+
    esc(p.body.slice(0,180))+
    "…</p></div>"
  ).join("")
  ||
  "<p class='mut'>अभी कोई स्थानीय पोस्ट नहीं।</p>";
}

document.addEventListener(
  "DOMContentLoaded",
  loadPosts
);
