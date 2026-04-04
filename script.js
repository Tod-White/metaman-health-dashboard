// 数据存储
let progressData = {};
let currentMonth = new Date();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderCalendar();
    renderTodayTasks();
    renderChart();
    renderHistory();
    
    // 事件监听
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('saveBtn').addEventListener('click', saveToday);
});

// 加载数据
function loadData() {
    const stored = localStorage.getItem('healthProgress');
    if (stored) {
        progressData = JSON.parse(stored);
    } else {
        // 初始化示例数据
        progressData = {
            '2026-04-04': {
                completed: ['morning', 'midmorning', 'noon'],
                skipped: ['afternoon', 'evening', 'bedtime'],
                metrics: {
                    ankle_mobility: 6,
                    ankle_stability: 25,
                    weight_balance: 5,
                    hip_stability: 4,
                    lower_back_tension: 7,
                    shoulder_pain: 6
                },
                notes: '右脚踝明显松了一点，但重心右移还是不习惯。左腰紧张有所缓解。'
            }
        };
    }
}

// 保存数据
function saveData() {
    localStorage.setItem('healthProgress', JSON.stringify(progressData));
}

// 渲染日历
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    monthTitle.textContent = `${year}年${month + 1}月`;
    
    // 清空
    grid.innerHTML = '';
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.fontWeight = 'bold';
        header.style.padding = '10px';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 填充空白
    for (let i = 0; i < firstDay.getDay(); i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    // 填充日期
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = progressData[dateStr];
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        // 判断是否是今天
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // 判断完成状态
        if (dayData) {
            const completionRate = dayData.completed.length / 6;
            if (completionRate === 1) {
                dayEl.classList.add('completed');
            } else if (completionRate > 0) {
                dayEl.classList.add('partial');
            }
            
            dayEl.innerHTML = `
                <span class="date">${day}</span>
                <span class="completion">${dayData.completed.length}/6</span>
            `;
        } else {
            dayEl.innerHTML = `<span class="date">${day}</span>`;
        }
        
        dayEl.addEventListener('click', () => showDayDetail(dateStr));
        grid.appendChild(dayEl);
    }
}

// 渲染今日任务
function renderTodayTasks() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    document.getElementById('todayDate').textContent = `(${dateStr})`;
    
    const dayData = progressData[dateStr];
    if (dayData) {
        // 更新完成率
        const rate = Math.round((dayData.completed.length / 6) * 100);
        document.getElementById('completionRate').textContent = `${rate}%`;
        
        // 计算总时长
        const durations = [15, 10, 15, 10, 20, 15];
        let completed = 0;
        dayData.completed.forEach(task => {
            const index = ['morning', 'midmorning', 'noon', 'afternoon', 'evening', 'bedtime'].indexOf(task);
            if (index >= 0) completed += durations[index];
        });
        document.getElementById('totalDuration').textContent = `${completed}/85分钟`;
        
        // 加载笔记和指标
        if (dayData.notes) {
            document.getElementById('todayNotes').value = dayData.notes;
        }
        if (dayData.metrics) {
            Object.keys(dayData.metrics).forEach(key => {
                const input = document.getElementById(key);
                if (input) input.value = dayData.metrics[key];
            });
        }
    }
}

// 渲染趋势图
function renderChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // 获取最近4周的数据
    const dates = Object.keys(progressData).sort().slice(-28);
    const labels = dates.map(d => d.substring(5)); // MM-DD
    
    const datasets = [
        {
            label: '右脚踝活动度',
            data: dates.map(d => progressData[d]?.metrics?.ankle_mobility || null),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
        },
        {
            label: '右脚单腿站(秒)',
            data: dates.map(d => progressData[d]?.metrics?.ankle_stability || null),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
        },
        {
            label: '右脚承重感',
            data: dates.map(d => progressData[d]?.metrics?.weight_balance || null),
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4
        },
        {
            label: '右髋游离感(反)',
            data: dates.map(d => progressData[d]?.metrics?.hip_stability ? 10 - progressData[d].metrics.hip_stability : null),
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            tension: 0.4
        },
        {
            label: '左腰紧张(反)',
            data: dates.map(d => progressData[d]?.metrics?.lower_back_tension ? 10 - progressData[d].metrics.lower_back_tension : null),
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4
        },
        {
            label: '右肩疼痛(反)',
            data: dates.map(d => progressData[d]?.metrics?.shoulder_pain ? 10 - progressData[d].metrics.shoulder_pain : null),
            borderColor: '#E91E63',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
            tension: 0.4
        }
    ];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: '评分 (1-10)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 60,
                    title: {
                        display: true,
                        text: '秒数'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                                if (context.datasetIndex === 1) {
                                    label += '秒';
                                } else {
                                    label += '分';
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// 渲染历史记录
function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    
    const dates = Object.keys(progressData).sort().reverse().slice(0, 10);
    
    if (dates.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999;">暂无历史记录</p>';
        return;
    }
    
    dates.forEach(date => {
        const data = progressData[date];
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const rate = data.completed.length / 6;
        const badgeClass = rate === 1 ? 'full' : 'partial';
        const badgeText = rate === 1 ? '全部完成' : `${data.completed.length}/6`;
        
        item.innerHTML = `
            <div class="date">
                ${date}
                <span class="completion-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="notes">${data.notes || '无笔记'}</div>
        `;
        
        item.addEventListener('click', () => showDayDetail(date));
        list.appendChild(item);
    });
}

// 保存今日记录
function saveToday() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 获取当前数据或创建新的
    if (!progressData[dateStr]) {
        progressData[dateStr] = {
            completed: [],
            skipped: [],
            metrics: {},
            notes: ''
        };
    }
    
    // 保存笔记
    progressData[dateStr].notes = document.getElementById('todayNotes').value;
    
    // 保存指标
    progressData[dateStr].metrics = {
        ankle_mobility: parseInt(document.getElementById('ankle_mobility').value),
        ankle_stability: parseInt(document.getElementById('ankle_stability').value),
        weight_balance: parseInt(document.getElementById('weight_balance').value),
        hip_stability: parseInt(document.getElementById('hip_stability').value),
        lower_back_tension: parseInt(document.getElementById('lower_back_tension').value),
        shoulder_pain: parseInt(document.getElementById('shoulder_pain').value)
    };
    
    saveData();
    
    // 重新渲染
    renderCalendar();
    renderChart();
    renderHistory();
    
    alert('✅ 保存成功！');
}

// 显示某天详情
function showDayDetail(dateStr) {
    const data = progressData[dateStr];
    if (!data) {
        alert('该日期暂无记录');
        return;
    }
    
    const rate = Math.round((data.completed.length / 6) * 100);
    const metrics = data.metrics || {};
    
    const detail = `
📅 ${dateStr}

✅ 完成率：${rate}% (${data.completed.length}/6)

📊 指标：
• 右脚踝活动度：${metrics.ankle_mobility || '-'}/10
• 右脚单腿站：${metrics.ankle_stability || '-'}秒
• 右脚承重感：${metrics.weight_balance || '-'}/10
• 右髋游离感：${metrics.hip_stability || '-'}/10
• 左腰紧张：${metrics.lower_back_tension || '-'}/10
• 右肩疼痛：${metrics.shoulder_pain || '-'}/10

📝 笔记：
${data.notes || '无'}
    `;
    
    alert(detail);
}
