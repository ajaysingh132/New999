const KEY = "sandarbha_posts_v1";

function posts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function renderPosts() {
  const list = posts();
  const count = document.querySelector("#count");
  const box = document.querySelector("#posts");

  if (count) count.textContent = list.length;
  if (!box) return;

  box.innerHTML = list.map(p =>
    `<div class="card">
      <b>${esc(p.title)}</b>
      <p class="mut">${esc(p.author)} · ${esc(p.status)}</p>
      <p>${esc((p.body || "").slice(0, 220))}${(p.body || "").length > 220 ? "…" : ""}</p>
    </div>`
  ).join("") || "<p class='mut'>अभी कोई स्थानीय पोस्ट नहीं।</p>";
}

function savePost(p) {
  const a = posts();
  const item = {
    ...p,
    id: Date.now(),
    status: "review",
    created: new Date().toISOString()
  };

  a.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(a));
  return item;
}

function esc(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m])
  );
}

function aiDraft() {
  const topic = document.querySelector("#topic")?.value.trim();

  if (!topic) {
    alert("पहले विषय लिखें।");
    return;
  }

  document.querySelector("#headline").value = topic;

  document.querySelector("#body").value =
`AI संपादक प्रारूप

मुख्य तथ्य: ${topic} से संबंधित उपलब्ध स्रोतों की पुष्टि आवश्यक है।

क्या पता है: प्राथमिक स्रोत, आधिकारिक दस्तावेज़ और प्रत्यक्ष बयान अलग-अलग दर्ज किए जाएँ।

दावा: संबंधित पक्षों के दावों को स्पष्ट रूप से स्रोत के साथ प्रस्तुत किया जाए।

प्रमाण: महत्वपूर्ण तथ्यों के साथ स्रोत लिंक, प्रकाशन तिथि और दस्तावेज़ संदर्भ जोड़े जाएँ।

विवादित बिंदु: जहाँ स्रोतों में मतभेद हों, सभी प्रासंगिक संस्करण स्पष्ट रूप से प्रस्तुत किए जाएँ।

संपादकीय नोट: प्रकाशन से पहले मुख्य संपादक द्वारा तथ्य-जांच और स्रोत सत्यापन अनिवार्य है।`;

  document.querySelector("#aiStatus").textContent =
    "AI ड्राफ्ट तैयार — मानव संपादन आवश्यक";
}

function publish() {
  const title = document.querySelector("#headline")?.value.trim();
  const body = document.querySelector("#body")?.value.trim();

  if (!title || !body) {
    alert("शीर्षक और समाचार आवश्यक हैं।");
    return;
  }

  const item = savePost({
    title,
    body,
    author: "मुख्य संपादक"
  });

  document.querySelector("#pubStatus").textContent =
    "ड्राफ्ट समीक्षा कतार में सुरक्षित है। ID: " + item.id;

  renderPosts();
}

document.addEventListener("DOMContentLoaded", renderPosts);

