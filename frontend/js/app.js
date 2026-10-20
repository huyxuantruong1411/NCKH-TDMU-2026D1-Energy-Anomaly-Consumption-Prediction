const API_BASE = "http://localhost:8000/api";
let currentBuilding = null;
let allBuildings = [];
let limit = 24; 
let notifiedAlerts = new Set();
let cRealtime, cXai, cTemp, cWind, cProfile;

const dictFeature = {
    'airTemperature': { 
        name: 'Nhiệt độ môi trường (airTemperature)', 
        advice: 'Nhiệt độ môi trường tác động trực tiếp lên chu trình nhiệt của hệ thống làm mát trung tâm. Khuyến nghị kiểm tra dải nhiệt độ cài đặt của Chiller/AHU.' 
    },
    'dewTemperature': { 
        name: 'Độ ẩm không khí / Điểm sương (dewTemperature)', 
        advice: 'Độ ẩm cao làm giảm hiệu suất trao đổi nhiệt ẩm. Cần kiểm tra hệ thống tách ẩm và đường xả nước ngưng.' 
    },
    'windSpeed': { 
        name: 'Vận tốc gió (windSpeed)', 
        advice: 'Vận tốc gió gia tăng truyền nhiệt đối lưu qua lớp vỏ công trình. Cần rà soát độ kín của hệ thống cửa và van thông gió.' 
    },
    'seaLvlPressure': { 
        name: 'Áp suất khí quyển (seaLvlPressure)', 
        advice: 'Biến động áp suất khí quyển là dấu hiệu thời tiết cực đoan. Cần kích hoạt phương án phụ tải dự phòng.' 
    },
    'enthalpy': { 
        name: 'Entanpi không khí (enthalpy)', 
        advice: 'Nhiệt hàm không khí cao gây quá tải đồng thời tải nhiệt hiện và tải nhiệt ẩn. Yêu cầu kiểm tra hiệu suất Chiller.' 
    },
    'load_lag_1': { 
        name: 'Phụ tải trễ 1 giờ (load_lag_1)', 
        advice: 'Biến động mang tính chuỗi kế thừa từ giờ trước. Kiểm tra tình trạng đóng cắt hoặc sự cố của các thiết bị công suất lớn.' 
    },
    'load_lag_2': { 
        name: 'Phụ tải trễ 2 giờ (load_lag_2)', 
        advice: 'Biến động phụ tải duy trì liên tục qua nhiều chu kỳ. Cần rà soát lịch trình vận hành thiết bị.' 
    },
    'load_lag_24': { 
        name: 'Phụ tải cùng giờ ngày hôm trước (load_lag_24)', 
        advice: 'Quy luật phụ tải theo ngày bị phá vỡ. Kiểm tra các phụ tải vận hành ngoài giờ.' 
    },
    'load_diff_1': { 
        name: 'Gia tốc biến thiên phụ tải 1h (load_diff_1)', 
        advice: 'Hệ thống chịu sốc phụ tải do đóng ngắt thiết bị lớn đột ngột. Cần rà soát biến tần và tủ phân phối.' 
    },
    'roll_mean_24h': { 
        name: 'Trung bình trượt 24h (roll_mean_24h)', 
        advice: 'Mặt bằng tiêu thụ năng lượng lệch khỏi đường cơ sở ngày. Cần lập báo cáo rà soát hiệu quả năng lượng.' 
    }
};

function translate(key) { 
    return dictFeature[key] || { 
        name: key, 
        advice: 'Kiểm tra tình trạng vận hành thực tế của các thiết bị liên quan đến thông số kỹ thuật này.' 
    }; 
}

function initCharts() {
    cRealtime = new Chart(document.getElementById('realtimeChart'), { 
        type: 'line', 
        data: { 
            labels: [], 
            datasets: [ 
                { label: 'Phụ tải thực tế', borderColor: '#0f172a', borderWidth: 2, data: [], pointRadius: 0, z: 10 }, 
                { label: 'Phụ tải dự báo (AI)', borderColor: '#1d4ed8', borderDash: [5, 5], borderWidth: 2, data: [], pointRadius: 0 }, 
                { label: 'Điểm dị thường', backgroundColor: '#b91c1c', pointStyle: 'circle', pointRadius: 6, data: [], type: 'scatter' }, 
                { label: 'Ngưỡng dưới', data: [], borderColor: 'transparent', fill: false, pointRadius: 0 }, 
                { label: 'Dải an toàn (IQR Band)', data: [], borderColor: 'transparent', backgroundColor: 'rgba(21, 128, 61, 0.15)', fill: '-1', pointRadius: 0 } 
            ]
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            animation: false 
        }
    });

    cXai = new Chart(document.getElementById('xaiChart'), { 
        type: 'bar', 
        data: { 
            labels: [], 
            datasets: [{ label: 'Tỷ trọng đóng góp sai lệch (%)', backgroundColor: '#d97706', data: [] }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            indexAxis: 'y' 
        } 
    });

    cTemp = new Chart(document.getElementById('tempChart'), { 
        type: 'line', 
        data: { 
            labels: [], 
            datasets: [
                { label: 'Nhiệt độ môi trường (°C)', borderColor: '#b91c1c', data: [], pointRadius: 0 }, 
                { label: 'Nhiệt độ điểm sương (°C)', borderColor: '#0284c7', data: [], pointRadius: 0 }
            ] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            animation: false 
        } 
    });

    cWind = new Chart(document.getElementById('windChart'), { 
        type: 'line', 
        data: { 
            labels: [], 
            datasets: [
                { label: 'Vận tốc gió (m/s)', borderColor: '#7c3aed', data: [], pointRadius: 0, yAxisID: 'y1' }, 
                { label: 'Áp suất khí quyển (hPa)', borderColor: '#475569', data: [], borderDash: [2, 2], pointRadius: 0, yAxisID: 'y2' }
            ] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            animation: false, 
            scales: { 
                y1: { position: 'left' }, 
                y2: { position: 'right', grid: { drawOnChartArea: false } } 
            } 
        } 
    });

    cProfile = new Chart(document.getElementById('profileChart'), { 
        type: 'bar', 
        data: { 
            labels: [], 
            datasets: [{ label: 'Phụ tải trung bình (kWh)', backgroundColor: '#059669', data: [] }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false 
        } 
    });
}

function renderSidebar(filter = "") {
    const list = document.getElementById('building-list'); 
    list.innerHTML = '';
    allBuildings.filter(b => b.toLowerCase().includes(filter.toLowerCase())).forEach(b => {
        const item = document.createElement('div'); 
        item.className = `b-item ${b === currentBuilding ? 'active' : ''}`; 
        item.innerText = b;
        item.onclick = () => { 
            currentBuilding = b; 
            document.getElementById('building-title').innerText = b; 
            renderSidebar(document.getElementById('search-input').value); 
            fetchHistoricalData(); 
        };
        list.appendChild(item);
    });
}

async function fetchGlobalAlerts() {
    try {
        const alerts = await (await fetch(`${API_BASE}/alerts/global`)).json();
        const listDiv = document.getElementById('alerts-list'); 
        const badge = document.getElementById('alert-badge'); 
        let newCount = 0; 
        listDiv.innerHTML = '';
        alerts.forEach(a => {
            const id = `${a.timestamp}-${a.building}`;
            if (!notifiedAlerts.has(id)) { 
                notifiedAlerts.add(id); 
                newCount++; 
            }
            const el = document.createElement('div'); 
            el.className = 'alert-item';
            el.innerHTML = `
                <div class="alert-title">
                    <span style="color: var(--danger)">[BẤT THƯỜNG] ${a.building}</span> 
                    <span style="font-size:11px;color:#64748b">${a.timestamp.split(" ")[1]}</span>
                </div>
                <div class="alert-desc">Phụ tải dị thường: ${a.load.toFixed(1)} kWh</div>
            `;
            el.onclick = () => { 
                currentBuilding = a.building; 
                document.getElementById('building-title').innerText = a.building;
                document.getElementById('alerts-panel').classList.remove('show'); 
                renderSidebar(); 
            };
            listDiv.appendChild(el);
        });
        if (newCount > 0) { 
            badge.innerText = newCount; 
            badge.classList.remove('hidden'); 
        } else if (alerts.length === 0) {
            listDiv.innerHTML = `<div style="padding:20px;text-align:center;color:#64748b;font-size:12px;">Hệ thống vận hành an toàn.</div>`;
        }
    } catch(e) {}
}

async function fetchHistoricalData() {
    if (!currentBuilding) return;
    try {
        const data = await (await fetch(`${API_BASE}/analytics/hourly_profile?building_name=${currentBuilding}`)).json();
        cProfile.data.labels = data.map(d => d.hour); 
        cProfile.data.datasets[0].data = data.map(d => d.avg_load); 
        cProfile.update();
    } catch(e) {}
}

async function fetchRealtimeLoop() {
    if (allBuildings.length === 0) {
        try {
            allBuildings = await (await fetch(`${API_BASE}/buildings`)).json();
            if (allBuildings.length > 0) { 
                currentBuilding = allBuildings[0]; 
                document.getElementById('building-title').innerText = currentBuilding; 
                fetchHistoricalData(); 
            }
            renderSidebar();
        } catch(e) { return; }
    }
    if (!currentBuilding) return;

    try {
        const data = await (await fetch(`${API_BASE}/data?building_name=${currentBuilding}&limit=${limit}`)).json();
        if (data.length > 0) {
            const lb = [], ac = [], pr = [], an = [], up = [], lw = [];
            data.forEach(d => { 
                lb.push(d.timestamp.split(" ")[1]); 
                ac.push(d.actual_load); 
                pr.push(d.predicted_load); 
                an.push(d.is_anomaly ? d.actual_load : null); 
                up.push(d.predicted_load + d.threshold); 
                lw.push(d.predicted_load - d.threshold); 
            });
            cRealtime.data.labels = lb; 
            cRealtime.data.datasets[0].data = ac; 
            cRealtime.data.datasets[1].data = pr; 
            cRealtime.data.datasets[2].data = an; 
            cRealtime.data.datasets[3].data = lw; 
            cRealtime.data.datasets[4].data = up; 
            cRealtime.update();
            
            const last = data[data.length - 1];
            document.getElementById('time-display').innerText = `Thời điểm cập nhật: ${last.timestamp}`;
            document.getElementById('kpi-cur').innerText = last.actual_load.toFixed(1);
            
            const trend = (ac.length > 1 && ac[ac.length - 1] > ac[ac.length - 2]) ? "đang tăng" : "đang giảm";
            const diff = Math.abs(last.predicted_load + last.threshold - last.actual_load).toFixed(1);
            if (last.is_anomaly) {
                document.getElementById('insight-realtime').innerHTML = `<b>Cảnh báo trạng thái:</b> Phụ tải ${trend} vượt ngưỡng dự báo an toàn. Khuyến nghị kiểm tra XAI.`;
            } else {
                document.getElementById('insight-realtime').innerHTML = `<b>Trạng thái ổn định:</b> Phụ tải ${trend} hợp lý. Độ lệch cách ngưỡng phân vị là <b>${diff} kWh</b>.`;
            }
        }

        const s = await (await fetch(`${API_BASE}/stats/summary?building_name=${currentBuilding}`)).json();
        document.getElementById('kpi-sum').innerText = s.sum.toFixed(1); 
        document.getElementById('kpi-max').innerText = s.max.toFixed(1); 
        document.getElementById('kpi-min').innerText = s.min.toFixed(1);

        const x = await (await fetch(`${API_BASE}/explain?building_name=${currentBuilding}`)).json();
        const xText = document.getElementById('insight-xai');
        if (x.explanation) {
            const featuresRaw = Object.keys(x.explanation);
            const humanLabels = featuresRaw.map(k => translate(k).name);
            cXai.data.labels = humanLabels; 
            cXai.data.datasets[0].data = Object.values(x.explanation); 
            cXai.update(); 
            if (xText) {
                xText.innerHTML = `Sự cố gần nhất tại thời điểm <b>${x.timestamp}</b>. Xem phân tích chi tiết trong mục <b>Lịch sử</b>.`;
                xText.style.background = "#fef2f2"; 
                xText.style.color = "#991b1b";
            }
        } else {
            cXai.data.labels = []; 
            cXai.data.datasets[0].data = []; 
            cXai.update();
            if (xText) {
                xText.innerHTML = `Không có sự cố nào được ghi nhận. Hệ thống vận hành an toàn.`;
                xText.style.background = "#f8fafc"; 
                xText.style.color = "#64748b";
            }
        }

        const wData = await (await fetch(`${API_BASE}/weather/correlation?building_name=${currentBuilding}&limit=168`)).json();
        cTemp.data.labels = wData.map(w => w.time); 
        cTemp.data.datasets[0].data = wData.map(w => w.temp); 
        cTemp.data.datasets[1].data = wData.map(w => w.dew); 
        cTemp.update();

        cWind.data.labels = wData.map(w => w.time); 
        cWind.data.datasets[0].data = wData.map(w => w.wind); 
        cWind.data.datasets[1].data = wData.map(w => w.pressure); 
        cWind.update();
        
        if (wData.length > 0) {
            const currTemp = wData[wData.length - 1].temp;
            const insightTempEl = document.getElementById('insight-temp');
            if (insightTempEl) {
                if (currTemp > 25) {
                    insightTempEl.innerHTML = `Nhiệt độ hiện thời cao (<b>${currTemp}°C</b>), nguy cơ làm gia tăng phụ tải làm mát của công trình.`;
                } else {
                    insightTempEl.innerHTML = `Nhiệt độ mát mẻ (<b>${currTemp}°C</b>), điều kiện vi khí hậu thuận lợi cho tiết kiệm điện năng.`;
                }
            }
        }

    } catch(e) {}
}

async function openHistoryModal() {
    if (!currentBuilding) return;
    document.getElementById('modal-title').innerText = `Lịch sử sự cố phụ tải - ${currentBuilding}`;
    const modal = document.getElementById('history-modal');
    const body = document.getElementById('modal-body');
    modal.classList.add('show');
    body.innerHTML = '<div style="text-align:center; padding: 30px; color: #64748b;">Đang tải dữ liệu lịch sử...</div>';
    
    try {
        const history = await (await fetch(`${API_BASE}/alerts/history?building_name=${currentBuilding}`)).json();
        if (history.length === 0) { 
            body.innerHTML = '<div style="text-align:center; padding: 30px; color: #64748b;"><i>Không ghi nhận biến động bất thường nào trong quá khứ.</i></div>'; 
            return; 
        }
        
        let html = `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Phụ tải thực tế</th>
                        <th>Dự báo chuẩn (AI)</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
        `;
        history.forEach((h, idx) => {
            html += `
                <tr onclick="showSnapshot(${idx})">
                    <td>${h.timestamp}</td>
                    <td><b>${h.actual_load.toFixed(1)} kWh</b></td>
                    <td>${h.predicted_load.toFixed(1)} kWh</td>
                    <td style="color:#b91c1c; font-weight:bold;">Vượt ngưỡng</td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        body.innerHTML = html;
        window.currentHistoryData = history;
    } catch(e) { 
        body.innerHTML = '<div style="text-align:center; padding: 30px; color: #b91c1c;">Lỗi truy xuất cơ sở dữ liệu.</div>'; 
    }
}

window.showSnapshot = function(idx) {
    const data = window.currentHistoryData[idx];
    let actionHtml = '';
    
    if (data.explanation) {
        Object.keys(data.explanation).forEach(key => {
            const dict = translate(key);
            const val = data.explanation[key];
            actionHtml += `
                <div class="action-card">
                    <div class="action-title">Đặc trưng: ${dict.name} (Độ lệch: ${val}%)</div>
                    <div class="action-advice"><b>Biện pháp:</b> ${dict.advice}</div>
                </div>
            `;
        });
    }

    const html = `
        <button style="margin-bottom: 15px; padding: 6px 12px; cursor: pointer; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px;" onclick="openHistoryModal()">&larr; Quay lại danh sách</button>
        <div class="snapshot-grid">
            <div class="snap-params">
                <h3 style="margin-top:0; font-size: 14px;">Ảnh chụp trạng thái (Snapshot)</h3>
                <div class="param-item"><span>Thời điểm:</span> <b>${data.timestamp}</b></div>
                <div class="param-item"><span>Phụ tải thực tế:</span> <b style="color:var(--danger)">${data.actual_load.toFixed(1)} kWh</b></div>
                <div class="param-item"><span>Mức phụ tải kỳ vọng:</span> <b>${data.predicted_load.toFixed(1)} kWh</b></div>
                <hr style="border-top:1px solid #cbd5e1; margin: 14px 0;">
                <div class="param-item"><span>Nhiệt độ môi trường:</span> <b>${data.temp}°C</b></div>
                <div class="param-item"><span>Nhiệt độ điểm sương:</span> <b>${data.dew}°C</b></div>
                <div class="param-item"><span>Vận tốc gió:</span> <b>${data.wind} m/s</b></div>
            </div>
            <div class="snap-actions">
                <h3 style="margin-top:0; font-size: 14px;">Nguyên nhân trọng yếu và Biện pháp kỹ thuật</h3>
                ${actionHtml || '<i>Dữ liệu ngoại cảnh không ghi nhận biến động bất thường.</i>'}
            </div>
        </div>
    `;
    document.getElementById('modal-body').innerHTML = html;
}

window.onload = () => {
    initCharts();
    document.querySelectorAll('.btn-time').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-time').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active'); 
            limit = parseInt(e.target.getAttribute('data-val')); 
            fetchRealtimeLoop();
        });
    });
    document.getElementById('search-input').addEventListener('input', (e) => renderSidebar(e.target.value));
    const bell = document.getElementById('bell-btn'); 
    const panel = document.getElementById('alerts-panel');
    bell.addEventListener('click', (e) => { 
        panel.classList.toggle('show'); 
        document.getElementById('alert-badge').classList.add('hidden'); 
    });
    document.getElementById('btn-clear').addEventListener('click', (e) => { 
        e.stopPropagation(); 
        notifiedAlerts.clear(); 
        document.getElementById('alerts-list').innerHTML = ''; 
        document.getElementById('alert-badge').classList.add('hidden'); 
    });
    
    document.getElementById('btn-show-history').addEventListener('click', openHistoryModal);
    document.getElementById('btn-close-modal').addEventListener('click', () => document.getElementById('history-modal').classList.remove('show'));

    setInterval(fetchRealtimeLoop, 500);
    setInterval(fetchGlobalAlerts, 2000);
};