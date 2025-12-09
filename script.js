document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const resetMonthBtn = document.getElementById('reset-month');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const fileInput = document.getElementById('file-input');
// 初始化Supabase（仅用于认证）
const supabaseUrl = 'https://rsoilzacxgfkzgxayixg.supabase.co';
const supabaseKey = 'sb_publishable_nJLus_MRgYacajJV_dPriQ_MGOgqNrE';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // 状态变量
    let currentDate = new Date(); // 当前视图的日期（用于确定年和月）
    let overtimeData = {}; // 存储所有加班数据 { "2025-12": { "1": "half", "15": "full", ... } }

    // 初始化：从本地存储加载数据并渲染日历
    loadData();
    renderCalendar();

    // 事件监听
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    resetMonthBtn.addEventListener('click', resetCurrentMonth);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importData);

   let currentUser = null;

// 简化版登录函数
async function simpleLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    currentUser = data.user;
    // 生成用户专属的数据键名
    const userDataKey = `overtime_data_${currentUser.id}`;
    
    // 尝试从本地加载该用户的数据
    const savedData = localStorage.getItem(userDataKey);
    if (savedData) {
      overtimeData = JSON.parse(savedData);
    } else {
      overtimeData = {};
    }
    
    // 隐藏登录界面，显示主界面
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    renderCalendar();
    return true;
  } catch (error) {
    document.getElementById('auth-error').textContent = '登录失败: ' + error.message;
    document.getElementById('auth-error').style.display = 'block';
    return false;
  }
}

// 简化版注册函数
async function simpleRegister(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    alert('注册成功！请使用刚才的邮箱密码登录');
    return true;
  } catch (error) {
    document.getElementById('auth-error').textContent = '注册失败: ' + error.message;
    document.getElementById('auth-error').style.display = 'block';
    return false;
  }
}

// 修改数据保存函数 - 保存到用户专属的LocalStorage
function saveDayStatus(day, status) {
  if (!currentUser) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const key = `${year}-${month}`;
  
  if (!overtimeData[key]) {
    overtimeData[key] = {};
  }
  
  if (status === 'normal') {
    delete overtimeData[key][day];
  } else {
    overtimeData[key][day] = status;
  }
  
  // 保存到用户专属的LocalStorage
  const userDataKey = `overtime_data_${currentUser.id}`;
  localStorage.setItem(userDataKey, JSON.stringify(overtimeData));
  
  // 可选：同步到Supabase Storage（用于多设备同步）
  syncToCloud();
}

// 可选：同步到云端存储（使用Supabase Storage）
async function syncToCloud() {
  if (!currentUser) return;
  
  try {
    const userDataKey = `overtime_data_${currentUser.id}`;
    const data = localStorage.getItem(userDataKey);
    
    // 将数据上传到Supabase Storage
    const { error } = await supabase.storage
      .from('overtime-records')
      .upload(`${currentUser.id}/data.json`, data, {
        upsert: true // 如果已存在则更新
      });
    
    if (error) console.log('云端同步失败（不影响本地使用）:', error);
  } catch (error) {
    // 静默失败，不影响本地使用
    console.log('同步失败，继续使用本地数据');
  }
}

// 可选：从云端恢复数据
async function restoreFromCloud() {
  if (!currentUser) return;
  
  try {
    const { data, error } = await supabase.storage
      .from('overtime-records')
      .download(`${currentUser.id}/data.json`);
    
    if (!error && data) {
      const text = await data.text();
      const cloudData = JSON.parse(text);
      
      // 合并本地和云端数据（简单策略：以云端为主）
      overtimeData = { ...overtimeData, ...cloudData };
      
      const userDataKey = `overtime_data_${currentUser.id}`;
      localStorage.setItem(userDataKey, JSON.stringify(overtimeData));
      
      renderCalendar();
    }
  } catch (error) {
    // 静默失败，继续使用本地数据
  }
}
   document.addEventListener('DOMContentLoaded', function() {
  // 检查是否已有登录会话
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      const userDataKey = `overtime_data_${currentUser.id}`;
      const savedData = localStorage.getItem(userDataKey);
      
      if (savedData) {
        overtimeData = JSON.parse(savedData);
      }
      
      // 尝试从云端恢复数据
      restoreFromCloud();
      
      document.getElementById('auth-overlay').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      renderCalendar();
    } else {
      document.getElementById('auth-overlay').style.display = 'block';
      document.getElementById('main-content').style.display = 'none';
    }
  });
  
  // 登录按钮事件
  document.getElementById('auth-login-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    await simpleLogin(email, password);
  });
  
  // 注册按钮事件
  document.getElementById('auth-register-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    await simpleRegister(email, password);
  });
});

   
    // --- 核心函数 ---

    // 1. 渲染日历
    function renderCalendar() {
        calendarEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-11

        // 更新标题
        currentMonthEl.textContent = `${year}年${month + 1}月`;

        // 添加上一周的星期标签
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const div = document.createElement('div');
            div.className = 'weekday';
            div.textContent = day;
            calendarEl.appendChild(div);
        });

        // 计算本月第一天是星期几（0-6，0是周日）
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // 计算本月有多少天
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 添加上个月末尾的几天（灰色显示）
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfMonth; i++) {
            const day = document.createElement('div');
            day.className = 'day other-month';
            day.textContent = prevMonthLastDay - firstDayOfMonth + i + 1;
            calendarEl.appendChild(day);
        }

        // 添加本月的所有天
        const monthKey = `${year}-${month + 1}`;
        const currentMonthData = overtimeData[monthKey] || {};

        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'day';
            day.dataset.date = i; // 存储日期数字

            const dateNumSpan = document.createElement('span');
            dateNumSpan.className = 'date-num';
            dateNumSpan.textContent = i;
            day.appendChild(dateNumSpan);

            const statusSpan = document.createElement('span');
            statusSpan.className = 'status-text';
            day.appendChild(statusSpan);

            // 设置初始状态
            const status = currentMonthData[i] || 'normal';
            updateDayStatus(day, status);

            // 点击事件：循环切换状态
            day.addEventListener('click', () => {
                if (day.classList.contains('other-month')) return;
                const currentStatus = day.dataset.status;
                let nextStatus;
                switch(currentStatus) {
                    case 'normal': nextStatus = 'half'; break;
                    case 'half': nextStatus = 'full'; break;
                    default: nextStatus = 'normal'; break;
                }
                updateDayStatus(day, nextStatus);
                saveDayStatus(i, nextStatus);
                updateStats();
            });

            calendarEl.appendChild(day);
        }

        // 添加下个月开头的几天（灰色显示）
        const totalCells = 42; // 6行 * 7列，保证日历网格固定
        const cellsSoFar = firstDayOfMonth + daysInMonth;
        for (let i = 1; i <= (totalCells - cellsSoFar); i++) {
            const day = document.createElement('div');
            day.className = 'day other-month';
            day.textContent = i;
            calendarEl.appendChild(day);
        }

        updateStats(); // 渲染完成后更新统计
    }

    // 2. 更新单个日期的视觉状态
    function updateDayStatus(dayElement, status) {
        // 移除所有状态类
        dayElement.classList.remove('normal', 'half', 'full');
        // 添加新状态类
        dayElement.classList.add(status);
        // 更新data-status属性
        dayElement.dataset.status = status;
        // 更新状态文本
        const statusMap = { 'normal': '未加班', 'half': '半天', 'full': '全天' };
        dayElement.querySelector('.status-text').textContent = statusMap[status];
    }

    // 3. 将某天的状态保存到 overtimeData 对象和 localStorage
    function saveDayStatus(day, status) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!overtimeData[key]) {
            overtimeData[key] = {};
        }

        if (status === 'normal') {
            // 如果是“未加班”，则从数据中删除这一项，以节省空间
            delete overtimeData[key][day];
            // 如果这个月的数据空了，也删除这个月的键
            if (Object.keys(overtimeData[key]).length === 0) {
                delete overtimeData[key];
            }
        } else {
            overtimeData[key][day] = status;
        }

        // 保存到 localStorage
        localStorage.setItem('overtimeRecord', JSON.stringify(overtimeData));
    }

    // 4. 从 localStorage 加载数据
    function loadData() {
        const saved = localStorage.getItem('overtimeRecord');
        if (saved) {
            try {
                overtimeData = JSON.parse(saved);
            } catch (e) {
                console.error('解析保存的数据时出错:', e);
                overtimeData = {};
            }
        }
    }

    // 5. 更新统计面板
    function updateStats() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const key = `${year}-${month}`;
        const monthData = overtimeData[key] || {};

        let fullDays = 0;
        let halfDays = 0;

        for (const day in monthData) {
            if (monthData[day] === 'full') fullDays++;
            if (monthData[day] === 'half') halfDays++;
        }

        const totalDays = fullDays + (halfDays / 2); // 将半天折算为0.5个全天

        document.getElementById('count-full').textContent = fullDays;
        document.getElementById('count-half').textContent = halfDays;
        document.getElementById('count-total').textContent = totalDays.toFixed(1);
    }

    // 6. 切换月份
    function changeMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar();
    }

    // 7. 重置当前月份的所有记录
    function resetCurrentMonth() {
        if (confirm(`确定要清空 ${currentDate.getFullYear()}年${currentDate.getMonth()+1}月 的所有加班记录吗？`)) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const key = `${year}-${month}`;
            delete overtimeData[key];
            localStorage.setItem('overtimeRecord', JSON.stringify(overtimeData));
            renderCalendar(); // 重新渲染
        }
    }

    // 8. 导出本月数据为JSON文件
    function exportData() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const key = `${year}-${month}`;
        const dataToExport = {
            month: key,
            data: overtimeData[key] || {},
            generatedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `加班记录_${key}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        alert(`数据已导出为文件: ${exportFileDefaultName}`);
    }

    // 9. 从JSON文件导入数据
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported.month && imported.data) {
                    overtimeData[imported.month] = imported.data;
                    localStorage.setItem('overtimeRecord', JSON.stringify(overtimeData));
                    // 如果导入的正是当前查看的月份，则刷新日历
                    const currentKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
                    if (imported.month === currentKey) {
                        renderCalendar();
                    }
                    alert(`成功导入 ${imported.month} 的数据！`);
                } else {
                    alert('文件格式不正确，无法导入。');
                }
            } catch (error) {
                alert('读取文件失败，请确保选择的是有效的JSON文件。');
                console.error(error);
            }
            // 清空文件输入，以便再次选择同一个文件
            fileInput.value = '';
        };
        reader.readAsText(file);
    }
});
