// build grid: 7 days x 6 slots
const grid = document.getElementById('grid');
for(let r=0;r<6;r++){
  for(let c=0;c<7;c++){
    const cell = document.createElement('div');
    cell.className='cell';
    cell.dataset.day=c;cell.dataset.slot=r;
    cell.setAttribute('role','gridcell');
    // click to show detail / remove
    cell.addEventListener('click',()=>{
      const key = `${weekSelect.value}-${c}-${r}`;
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if(data){
        if(confirm('Xóa môn "'+data.name+'" khỏi ô này?')){ localStorage.removeItem(key); renderWeek(); }
      } else {
        // quick add if empty
        const name = prompt('Nhập tên môn để thêm (bỏ trống để hủy):');
        if(name && name.trim()){
          const obj = {name:name.trim(),day:c,slot:r,info:`Thêm thủ công`};
          localStorage.setItem(key,JSON.stringify(obj));
          renderWeek();
        }
      }
    });
    grid.appendChild(cell);
  }
}

const weekSelect = document.getElementById('weekSelect');
const addCourseBtn = document.getElementById('addCourseBtn');
const courseName = document.getElementById('courseName');
const courseDay = document.getElementById('courseDay');
const courseSlot = document.getElementById('courseSlot');
const featuredList = document.getElementById('featuredList');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');

// sample featured courses
const samples = [
  {name:'Lập trình Web',code:'CS101',credit:3},
  {name:'Cơ sở dữ liệu',code:'CS205',credit:3},
  {name:'Mạng máy tính',code:'CS307',credit:2},
  {name:'Kiến trúc máy tính',code:'CS402',credit:2}
];

function renderFeatured(){
  featuredList.innerHTML='';
  samples.forEach((s,idx)=>{
    const div=document.createElement('div');div.className='course';
    const btnId = `feat_add_${idx}`;
    div.innerHTML=`<strong>${s.name}</strong><div>Mã: ${s.code}</div><div>Tín chỉ: ${s.credit}</div><div style="margin-top:8px"><button class="btn" id="${btnId}">Thêm</button></div>`;
    featuredList.appendChild(div);
    document.getElementById(btnId).addEventListener('click',()=>{
      courseName.value=s.name; courseDay.value=0; courseSlot.value=0; addCourseBtn.click();
    });
  });
}

function renderWeek(){
  // clear grid
  document.querySelectorAll('.cell').forEach(c=>c.innerHTML='');
  // fill from localStorage for selected week
  for(let c=0;c<7;c++){
    for(let r=0;r<6;r++){
      const key = `${weekSelect.value}-${c}-${r}`;
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if(data){
        const idx = [...document.querySelectorAll('.cell')].findIndex(el=>el.dataset.day==c && el.dataset.slot==r);
        const el = document.querySelectorAll('.cell')[idx];
        if(el){
          const card = document.createElement('div');
          card.style.padding='6px';card.style.borderRadius='6px';card.style.border='2px solid #062f36';card.style.background='#e6fbff';
          card.innerHTML=`<div style="font-weight:700">${data.name}</div><div style="font-size:12px">${data.info||''}</div>`;
          el.appendChild(card);
        }
      }
    }
  }
}

addCourseBtn.addEventListener('click',()=>{
  const name = courseName.value.trim();
  const day = parseInt(courseDay.value,10);
  const slot = parseInt(courseSlot.value,10);
  if(!name){ alert('Nhập tên môn'); return; }
  const key = `${weekSelect.value}-${day}-${slot}`;
  const obj = {name,day,slot,info:`Đã thêm vào ${weekSelect.value}`};
  localStorage.setItem(key,JSON.stringify(obj));
  courseName.value='';renderWeek();
});

clearBtn.addEventListener('click',()=>{
  if(!confirm('Xóa toàn bộ lịch của tuần hiện tại?')) return;
  // remove keys for this week
  const prefix = weekSelect.value + '-';
  Object.keys(localStorage).forEach(k=>{ if(k.startsWith(prefix)) localStorage.removeItem(k); });
  renderWeek();
});

exportBtn.addEventListener('click',()=>{
  const prefix = weekSelect.value + '-';
  const out = [];
  Object.keys(localStorage).forEach(k=>{ if(k.startsWith(prefix)) out.push(JSON.parse(localStorage.getItem(k))); });
  const txt = JSON.stringify(out,null,2);
  // download as file
  const blob = new Blob([txt],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');a.href=url;a.download=`${weekSelect.value}-schedule.json`;a.click();
  URL.revokeObjectURL(url);
});

weekSelect.addEventListener('change',renderWeek);

// initial render
renderFeatured();renderWeek();