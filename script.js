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
 
// 初始化Supabase客户端
const supabaseUrl = 'https://rsoilzacxgfkzgxayixg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzb2lsemFjeGdma3pneGF5aXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAxOTksImV4cCI6MjA4MDc1NjE5OX0.Wb7jsbp3N-kYAHM72xDSkuTIUiNxNtjiep5NiuP_DMo';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// 认证状态管理
let currentUser = null;

// 检查现有会话
async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    updateUIForLoggedInUser();
    loadUserData();
  } else {
    updateUIForGuest();
  }
}

// 用户注册函数
async function registerUser(email, password) {
  // 前端表单验证[1](@ref)[4](@ref)
  if (!email || !password) {
    alert('请填写所有必填字段');
    return false;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  
  if (error) {
    alert('注册失败: ' + error.message);
    return false;
  }
  
  alert('注册成功！请检查邮箱确认邮件。');
  return true;
}

// 用户登录函数
async function loginUser(email, password) {
  // 前端表单验证[1](@ref)[4](@ref)
  if (!email || !password) {
    alert('请填写所有必填字段');
    return false;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) {
    alert('登录失败: ' + error.message);
    return false;
  }
  
  currentUser = data.user;
  updateUIForLoggedInUser();
  loadUserData();
  return true;
}

// 退出登录
async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    currentUser = null;
    updateUIForGuest();
    clearCalendarData();
  }
}

// 更新UI显示登录状态
function updateUIForLoggedInUser() {
  document.getElementById('user-email').textContent = currentUser.email;
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('guest-info').style.display = 'none';
  // 隐藏登录/注册模态框
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('register-modal').style.display = 'none';
}

function updateUIForGuest() {
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('guest-info').style.display = 'block';
  // 清空日历数据
  clearCalendarData();
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
  // 检查认证状态
  checkAuth();
  
  // 登录按钮点击事件
  document.getElementById('login-btn').addEventListener('click', function() {
    document.getElementById('login-modal').style.display = 'block';
  });
  
  // 注册按钮点击事件
  document.getElementById('register-btn').addEventListener('click', function() {
    document.getElementById('register-modal').style.display = 'block';
  });
  
  // 退出登录按钮点击事件
  document.getElementById('logout-btn').addEventListener('click', logoutUser);
  
  // 登录表单提交
  document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await loginUser(email, password);
  });
  
  // 注册表单提交
  document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // 密码确认验证[4](@ref)
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    // 密码强度验证[1](@ref)
    if (password.length < 6) {
      alert('密码长度至少为6位');
      return;
    }
    
    await registerUser(email, password);
  });
  
  // 关闭模态框
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });
  
  // 点击模态框外部关闭
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});
  
// 加载用户数据
async function loadUserData() {
  if (!currentUser) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  // 构建查询日期范围
  const startDate = `$${year}-$${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('overtime_records')
    .select('record_date, status')
    .eq('user_id', currentUser.id)
    .gte('record_date', startDate)
    .lte('record_date', endDate);
  
  if (error) {
    console.error('加载数据失败:', error);
    return;
  }
  
  // 转换数据格式
  overtimeData = {};
  data.forEach(record => {
    const day = parseInt(record.record_date.split('-')[2](@ref);
    overtimeData[day] = record.status;
  });
  
  renderCalendar();
}

// 保存单天状态
async function saveDayStatus(day, status) {
  if (!currentUser) {
    alert('请先登录');
    return;
  }
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const recordDate = `$${year}-$${month.toString().padStart(2, '0')}-$${day.toString().padStart(2, '0')}`;
  
  const { error } = await supabase
    .from('overtime_records')
    .upsert({
      user_id: currentUser.id,
      record_date: recordDate,
      status: status,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,record_date'
    });
  
  if (error) {
    console.error('保存失败:', error);
    alert('保存失败，请检查网络连接');
  }
}

// 重置月份数据
async function resetCurrentMonth() {
  if (!currentUser) return;
  
  if (!confirm(`确定要清空 $${currentDate.getFullYear()}年$${currentDate.getMonth()+1}月 的所有加班记录吗？`)) {
    return;
  }
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const startDate = `$${year}-$${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('overtime_records')
    .delete()
    .eq('user_id', currentUser.id)
    .gte('record_date', startDate)
    .lte('record_date', endDate);
  
  if (error) {
    console.error('重置失败:', error);
    alert('重置失败');
  } else {
    overtimeData = {};
    renderCalendar();
  }
}
 
    // 状态变量
    let currentDate = new Date(); // 当前视图的日期（用于确定年和月）
    let overtimeData = {}; // 存储所有加班数据 { "2025-12": { "1": "half", "15": "full", ... } }

    // 初始化：从本地存储加载数据并渲染日历
    //loadData();
    //renderCalendar();
     
// 如果有初始化函数
async function initializeCalendar() {
  try {
    await loadUserData();  // 这也是异步函数
    renderCalendar();
  } catch (error) {
    console.error('初始化失败:', error);
    // 可以显示一个友好的错误消息
  }
}
 

    // 事件监听
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
     
// 修改重置按钮事件监听器
resetMonthBtn.addEventListener('click', async () => {  // 添加async
  // 关键修改：使用await调用异步的resetCurrentMonth函数
  await resetCurrentMonth();  // 添加await关键字
});
 
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importData);

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
             
// 修改日期点击事件处理函数
 
day.addEventListener('click', async () => {
  if (day.classList.contains('other-month')) return;
  
  const currentStatus = day.dataset.status;
  let nextStatus;
  switch(currentStatus) {
    case 'normal': nextStatus = 'half'; break;
    case 'half': nextStatus = 'full'; break;
    default: nextStatus = 'normal'; break;
  }
  
  updateDayStatus(day, nextStatus);
  
  try {
    // 尝试保存到云端
    await saveDayStatus(i, nextStatus);
    updateStats();
  } catch (error) {
    // 如果保存失败，恢复原来的状态并提示用户
    console.error('保存失败:', error);
    updateDayStatus(day, currentStatus); // 恢复原状态
    alert('保存失败，请检查网络连接后重试');
  }
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
 
// 订阅加班记录变化
function subscribeToChanges() {
  if (!currentUser) return;
  
  const subscription = supabase
    .channel('overtime-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'overtime_records',
        filter: `user_id=eq.$${currentUser.id}`
      }, 
      (payload) => {
        console.log('数据变化:', payload);
        // 重新加载数据
        loadUserData();
      }
    )
    .subscribe();
  
  return subscription;
}

// 在登录成功后调用
// const subscription = subscribeToChanges();

// 在退出登录时取消订阅
// subscription.unsubscribe();
 
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
