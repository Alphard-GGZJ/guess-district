const SUPABASE_URL = 'https://idcjqdqtdvkqvschnybt.supabase.co';  // ✅ 去掉 Client
const SUPABASE_KEY = 'sb_publishable_03tAFzmENygu60kEhN4FQg_7fkl8Nxa';
const supabaseClient = typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function setMsg(text, className) {
    const msg = document.getElementById('msg');
    msg.textContent = text;
    msg.className = className;
}

function bindUI() {
        document.getElementById('btnBattle').addEventListener('click', openBattlePanel);
    document.getElementById('btnBattleExit').addEventListener('click', closeBattlePanel);
    document.getElementById('btnBattleCreate').addEventListener('click', createBattleRoom);
    document.getElementById('btnBattleJoin').addEventListener('click', joinBattleRoom);
    document.getElementById('btnBattleLeave').addEventListener('click', leaveBattleRoom);
    document.getElementById('battleSubmitBtn').addEventListener('click', submitBattleAnswer);
    document.getElementById('battleInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitBattleAnswer();
    });
        document.getElementById('dailySkipBtn').addEventListener('click', skipDailyQuestion);
    document.getElementById('showAnswer').addEventListener('click', showAnswer);
    document.getElementById('submitBtn').addEventListener('click', checkAnswer);
    document.getElementById('newBtn').addEventListener('click', newRound);
    document.getElementById('hint').addEventListener('click', showHint);
    document.getElementById('input').addEventListener('keydown', e => {
        if (e.key === 'Enter') checkAnswer();
    });

    document.getElementById('inputHelp').addEventListener('click', () => {
    document.getElementById('helpPopup').style.display = 'block';
});

    // 简单模式按钮
    document.getElementById('btnEasy').addEventListener('click', () => setMode('easy'));
    document.getElementById('btnNormal').addEventListener('click', () => setMode('normal'));
    document.getElementById('btnHard').addEventListener('click', () => setMode('hard'));
    document.getElementById('btnClassic').addEventListener('click', () => setMode('classic'));
    document.getElementById('btnDaily').addEventListener('click', () => startDailyChallenge());
document.getElementById('dailySubmitBtn').addEventListener('click', checkAnswer);
document.getElementById('dailyExitBtn').addEventListener('click', exitDailyChallenge);
document.getElementById('dailyShareBtn').addEventListener('click', shareDailyResult);
document.getElementById('dailyImageBtn').addEventListener('click', generateDailyImage);
document.getElementById('dailyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkAnswer();
});
    document.getElementById('btnDaily').addEventListener('click', () => startDailyChallenge());
    document.getElementById('btnTimer').addEventListener('click', toggleTimer);
    document.getElementById('btnMiniGames').addEventListener('click', openMiniGames);
    document.getElementById('btnMiniGamesExit').addEventListener('click', closeMiniGames);
    document.getElementById('btnFindDifferent').addEventListener('click', startFindDifferent);
    document.getElementById('btnCoastInland').addEventListener('click', () => {
        setMsg('🌊 沿海或内陆即将上线', '');
    });

    // 省份下拉框初始化
    const sel = document.getElementById('provinceSelect');
    ['北京市','天津市','河北省','山西省','内蒙古','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西','海南省','重庆市','四川省','贵州省','云南省','西藏','陕西省','甘肃省','青海省','宁夏','新疆','香港','澳门'].forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
    });

document.getElementById('regionSelect').addEventListener('change', function () {
    if (gameMode === 'classic') {
        setMsg('经典模式不支持区域筛选', '');
        this.value = 'all';
        selectedRegion = 'all';
        showFilterHint('regionHint', '⚠️ 经典模式不支持区域筛选', 'warning');
        return;
    }

    selectedRegion = this.value;
    selectedProvince = 'all';
    document.getElementById('provinceSelect').value = 'all';
    score = 0;
    document.getElementById('score').textContent = '得分: 0';
    
    // 显示当前筛选的大区说明
    const regionNames = {
        'all': '🌏 全国：包含所有区县',
        'north': '🏔️ 华北：北京、天津、河北、山西、内蒙古',
        'northeast': '❄️ 东北：辽宁、吉林、黑龙江',
        'east': '🌊 华东：上海、江苏、浙江、安徽、福建、江西、山东',
        'central': '🏮 华中：河南、湖北、湖南',
        'south': '🌴 华南：广东、广西、海南',
        'southwest': '⛰️ 西南：重庆、四川、贵州、云南、西藏',
        'northwest': '🏜️ 西北：陕西、甘肃、青海、宁夏、新疆'
    };
    
    if (selectedRegion === 'all') {
        showFilterHint('regionHint', '💡 已选择全国范围', 'info');
    } else {
        showFilterHint('regionHint', regionNames[selectedRegion], 'info');
    }
    
    newRound();
});

document.getElementById('provinceSelect').addEventListener('change', function () {
    if (gameMode === 'classic') {
        setMsg('经典模式不支持区域筛选', '');
        this.value = 'all';
        selectedProvince = 'all';
        showFilterHint('provinceHint', '⚠️ 经典模式不支持省份筛选', 'warning');
        return;
    }

    if (gameMode === 'easy') {
        setMsg('简单模式不支持省份筛选', '');
        this.value = 'all';
        selectedProvince = 'all';
        showFilterHint('provinceHint', '⚠️ 简单模式不支持省份筛选', 'warning');
        return;
    }

    const directCities = ['北京市','天津市','上海市','重庆市'];
    if (gameMode === 'normal' && directCities.includes(this.value)) {
        setMsg('中等模式不支持直辖市筛选', '');
        this.value = 'all';
        selectedProvince = 'all';
        showFilterHint('provinceHint', '⚠️ 中等模式不支持直辖市筛选', 'warning');
        return;
    }

    selectedProvince = this.value;
    selectedRegion = 'all';
    document.getElementById('regionSelect').value = 'all';
    document.getElementById('regionHint').classList.remove('show');
    score = 0;
    document.getElementById('score').textContent = '得分: 0';
    
    // 显示当前省份说明
    if (selectedProvince === 'all') {
        showFilterHint('provinceHint', '💡 已选择全部省份', 'info');
    } else {
        const cityCount = getCitiesByProvince(selectedProvince).length;
        showFilterHint('provinceHint', `📍 已选择${selectedProvince}，包含 ${cityCount} 个城市`, 'info');
    }
    
    newRound();
});
    updateToggleBtnText();
    document.querySelectorAll('#panel button, #dailyPanel button').forEach(btn => {
        btn.addEventListener('click', () => playSound('click'));
    });
}

// 显示筛选提示的辅助函数
function showFilterHint(elementId, text, type = 'info') {
    const hint = document.getElementById(elementId);
    if (!hint) return;
    
    hint.textContent = text;
    hint.className = 'filter-hint show ' + type;
    
    // 5秒后自动隐藏
    clearTimeout(window[elementId + 'Timeout']);
    window[elementId + 'Timeout'] = setTimeout(() => {
        hint.classList.remove('show');
    }, 5000);
}

function initSpeedSetting() {
    const savedSpeed = localStorage.getItem('gameSpeed');
    if (savedSpeed && ['instant', 'fast', 'normal', 'slow'].includes(savedSpeed)) {
        gameSpeed = savedSpeed;
        const speedSelect = document.getElementById('speedSelect');
        if (speedSelect) {
            speedSelect.value = savedSpeed;
        }
    }
}

function setMode(mode) {
    // 计时模式开启时禁止切换难度
    if (timerMode) {
        setMsg('⏱ 计时中，不能切换模式', '');
        return;
    }

    gameMode = mode;
        dailyMode = false;
    if (mode === 'classic') {
        selectedRegion = 'all';
        selectedProvince = 'all';
        document.getElementById('regionSelect').value = 'all';
        document.getElementById('provinceSelect').value = 'all';
    }

    // 更新筛选提示
if (mode === 'classic') {
    showFilterHint('regionHint', '⚠️ 经典模式不支持区域筛选', 'warning');
    showFilterHint('provinceHint', '⚠️ 经典模式不支持省份筛选', 'warning');
} else {
    showFilterHint('regionHint', '💡 选择大区后只出现该区域的题目', 'info');
    showFilterHint('provinceHint', '💡 选择省份后只出现该省的题目', 'info');
}

    if (mode === 'easy') {
        selectedProvince = 'all';
        document.getElementById('provinceSelect').value = 'all';
    }

    if (mode === 'normal') {
        const directCities = ['北京市','天津市','上海市','重庆市'];
        if (directCities.includes(selectedProvince)) {
            selectedProvince = 'all';
            document.getElementById('provinceSelect').value = 'all';
        }
    }
    score = 0;
    recentDistricts = [];
    document.getElementById('score').textContent = '得分: 0';
    updateBestScoreDisplay();

    document.getElementById('btnEasy').classList.toggle('active', mode === 'easy');
    document.getElementById('btnNormal').classList.toggle('active', mode === 'normal');
    document.getElementById('btnHard').classList.toggle('active', mode === 'hard');
    document.getElementById('btnClassic').classList.toggle('active', mode === 'classic');

    // 更新输入框提示
    const input = document.getElementById('input');
    if (input) {
        if (mode === 'easy') {
            input.placeholder = '输入省份名...';
        } else if (mode === 'normal') {
            input.placeholder = '输入地级市名...';
        } else {
            input.placeholder = '输入区县名...';
        }
    }

    newRound();
}

function togglePanel() {
    const content = document.getElementById('panelContent');
    const btn = document.getElementById('togglePanelBtn');

    const isHidden = getComputedStyle(content).display === 'none';

    if (isHidden) {
        content.style.display = 'block';
        btn.textContent = '收起';
    } else {
        content.style.display = 'none';
        btn.textContent = '展开';
    }
}

function updateToggleBtnText() {
    const content = document.getElementById('panelContent');
    const btn = document.getElementById('togglePanelBtn');

    if (getComputedStyle(content).display === 'none') {
        btn.textContent = '展开';
    } else {
        btn.textContent = '收起';
    }
}

function getBestScore() {
    const key = 'bestScore_' + gameMode;
    return Number(localStorage.getItem(key) || '0');
}

function updateBestScoreDisplay() {
    const best = getBestScore();
    document.getElementById('bestScore').textContent = '🏆 最高分: ' + best.toFixed(1);
}

function showAnswer() {
    if (!targetDistrict) return;
    
    if (dailyMode) {
        document.getElementById('dailyMsg').textContent = `💡 答案是：${targetDistrict.name}`;
        return;
    }
    
    setMsg(`💡 答案是：${targetDistrict.name}（本题不得分）`, 'wrong');
    
    // 本题不得分，自动换下一题
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    
    setTimeout(() => {
        newRound();
    }, getDelay() + 3000);
}

let findDifferentMode = false;
let findDifferentAnswer = null;
let findDifferentLevel = 'district';

function openMiniGames() {
    playSound('click');
    dailyMode = false;
    if (timerMode) {
        toggleTimer();
    }
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';
    
    const miniPanel = document.getElementById('miniGamesPanel');
    miniPanel.style.display = 'block';
    // 添加弹入动画
    miniPanel.classList.remove('pop-in');
    void miniPanel.offsetWidth; // 强制回流
    miniPanel.classList.add('pop-in');
}

function closeMiniGames() {
    playSound('click');
    findDifferentMode = false;
    
    const miniPanel = document.getElementById('miniGamesPanel');
    // 缩小退出动画
    miniPanel.style.transform = 'scale(0.85)';
    miniPanel.style.opacity = '0';
    miniPanel.style.transition = 'all 0.2s ease';
    
    setTimeout(() => {
        miniPanel.style.display = 'none';
        miniPanel.style.transform = '';
        miniPanel.style.opacity = '';
        miniPanel.style.transition = '';
        
        document.getElementById('panel').style.display = 'block';
        document.getElementById('panelContent').style.display = 'block';
        document.getElementById('panel').classList.remove('pop-in');
        void document.getElementById('panel').offsetWidth;
        document.getElementById('panel').classList.add('pop-in');
    }, 200);
    
    const optionsDiv = document.getElementById('findDifferentOptions');
    if (optionsDiv) optionsDiv.remove();
    
    if (map) {
        newRound();
    }
}

function startFindDifferent() {
    playSound('click');
    findDifferentMode = true;
    // 保持主面板隐藏，小游戏面板也隐藏
    document.getElementById('miniGamesPanel').style.display = 'none';
    document.getElementById('panel').style.display = 'none';
    
    // 禁用主游戏输入
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('newBtn').disabled = true;
    document.getElementById('hint').style.pointerEvents = 'none';
    
    const levels = ['province', 'city', 'district'];
    findDifferentLevel = levels[Math.floor(Math.random() * levels.length)];
    
    generateFindDifferentQuestion();
}

function generateFindDifferentQuestion() {
    const allCities = getCityPool();
    const allCityMap = getCityCodeMap();
    
    const cityToProvince = {};
    allCities.forEach(city => {
        const code = allCityMap[city];
        if (code) {
            cityToProvince[city] = code.substring(0, 2);
        }
    });
    
    const availableCodes = [...new Set(Object.values(cityToProvince))];
    
    if (availableCodes.length < 2) {
        setMsg('❌ 数据不足', 'wrong');
        return;
    }
    
    // 随机选一个省
    const targetCode = availableCodes[Math.floor(Math.random() * availableCodes.length)];
    
    // 该省的城市
    const sameProvinceCities = allCities.filter(c => cityToProvince[c] === targetCode);
    
    // 其他省的城市
    const otherCities = allCities.filter(c => cityToProvince[c] !== targetCode);
    
    if (sameProvinceCities.length < 3 || otherCities.length < 1) {
        generateFindDifferentQuestion();
        return;
    }
    
    // 同省3个城市
    const shuffledSame = [...sameProvinceCities].sort(() => Math.random() - 0.5);
    const sameItems = shuffledSame.slice(0, 3);
    
    // 不同省1个城市
    const shuffledOther = [...otherCities].sort(() => Math.random() - 0.5);
    const differentItem = shuffledOther[0];
    
    const allItems = [
        ...sameItems.map(name => ({ name, level: 'city', isTarget: false })),
        { name: differentItem, level: 'city', isTarget: true }
    ];
    
    allItems.sort(() => Math.random() - 0.5);
    findDifferentAnswer = differentItem;
    findDifferentLevel = 'city';
    loadFindDifferentMaps(allItems);
}

function getProvinceCodeFromName(provinceName) {
    const map = {
        '北京市':'11','天津市':'12','河北省':'13','山西省':'14','内蒙古自治区':'15',
        '辽宁省':'21','吉林省':'22','黑龙江省':'23','上海市':'31',
        '江苏省':'32','浙江省':'33','安徽省':'34','福建省':'35','江西省':'36','山东省':'37',
        '河南省':'41','湖北省':'42','湖南省':'43','广东省':'44','广西壮族自治区':'45','海南省':'46',
        '重庆市':'50','四川省':'51','贵州省':'52','云南省':'53','西藏自治区':'54',
        '陕西省':'61','甘肃省':'62','青海省':'63','宁夏回族自治区':'64','新疆维吾尔自治区':'65',
        '香港特别行政区':'81','澳门特别行政区':'82'
    };
    return map[provinceName] || '';
}

// 搜索缓存
const searchCache = {};

function loadFindDifferentMaps(items) {
    const mapsData = [];
    let loaded = 0;
    let finished = false;
    
    const totalTimeout = setTimeout(() => {
        if (!finished) {
            finished = true;
            if (mapsData.length === 4) {
                displayFindDifferentMaps(mapsData);
            } else {
                generateFindDifferentQuestion();
            }
        }
    }, 6000);
    
    items.forEach((item, index) => {
        const baseName = item.name.replace(/（.+?）$/, '');
        
        let searchObj;
        if (item.level === 'province') {
            searchObj = dsProvince;
        } else if (item.level === 'city') {
            searchObj = dsCity;
        } else {
            searchObj = ds;
        }
        
        const cacheKey = item.level + '_' + baseName;
        
        function processResult(status, result) {
            if (finished) return;
            
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                let d = null;
                if (item.level === 'province') {
                    d = result.districtList.find(x => x.level === 'province' && x.name === baseName);
                } else if (item.level === 'city') {
                    d = result.districtList.find(x => x.level === 'city' && x.name === baseName);
                } else {
                    d = result.districtList.find(x => x.level === 'district' && x.name === baseName);
                }
                
                if (!d) {
                    d = result.districtList[0];
                }
                
                mapsData.push({ name: item.name, district: d, isTarget: item.isTarget });
                loaded++;
                
                if (loaded >= items.length && !finished) {
                    finished = true;
                    clearTimeout(totalTimeout);
                    if (mapsData.length === 4) {
                        displayFindDifferentMaps(mapsData);
                    } else {
                        generateFindDifferentQuestion();
                    }
                }
            } else {
                // 搜索失败，算作已加载
                loaded++;
                if (loaded >= items.length && !finished) {
                    finished = true;
                    clearTimeout(totalTimeout);
                    if (mapsData.length === 4) {
                        displayFindDifferentMaps(mapsData);
                    } else {
                        generateFindDifferentQuestion();
                    }
                }
            }
        }
        
        // 检查缓存
        if (searchCache[cacheKey]) {
            processResult('complete', searchCache[cacheKey]);
        } else {
            function doSearch(retryCount) {
                if (finished) return;
                
                searchObj.search(baseName, (status, result) => {
                    if (finished) return;
                    
                    if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                        // 存入缓存
                        searchCache[cacheKey] = result;
                        processResult(status, result);
                    } else if (retryCount > 0) {
                        setTimeout(() => doSearch(retryCount - 1), 300);
                    } else {
                        processResult(status, result);
                    }
                });
            }
            
            doSearch(2);
        }
    });
}

function displayFindDifferentMaps(mapsData) {
    // 创建浮动面板
    const floatPanel = document.createElement('div');
    floatPanel.id = 'findDifferentFloatPanel';
    floatPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;width:95%;max-width:800px;max-height:90vh;overflow-y:auto;';

    const title = document.createElement('div');
    title.textContent = '🔍 找出不同省份的行政区（3个同省，1个不同省）';
    title.style.cssText = 'text-align:center;font-weight:bold;margin-bottom:15px;font-size:14px;animation:popIn 0.3s ease-out;';
    floatPanel.appendChild(title);
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    
    mapsData.forEach(data => {
        const cell = document.createElement('div');
        cell.className = 'find-different-cell';
        cell.style.cssText = 'cursor:pointer;border:3px solid #ccc;border-radius:12px;overflow:hidden;transition:all 0.3s ease;';
        cell.onmouseenter = () => {
            cell.style.borderColor = '#4a6cf7';
            cell.style.boxShadow = '0 4px 15px rgba(74,108,247,0.3)';
            cell.style.transform = 'scale(1.03)';
        };
        cell.onmouseleave = () => {
            cell.style.borderColor = '#ccc';
            cell.style.boxShadow = 'none';
            cell.style.transform = 'scale(1)';
        };
        
        const canvas = document.createElement('canvas');
        canvas.width = 350;
        canvas.height = 260;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        cell.appendChild(canvas);

        
        cell.onclick = (e) => {
            checkFindDifferentMapAnswer(data.name, floatPanel, cell);
        };
        
        grid.appendChild(cell);
        
        // 画轮廓
        drawDistrictOnSmallCanvas(data.district, canvas);
    });
    
    floatPanel.appendChild(grid);
    
    const exitBtn = document.createElement('button');
    exitBtn.textContent = '退出小游戏';
    exitBtn.style.cssText = 'display:block;width:100%;margin:15px 0 0;padding:10px;border:none;border-radius:8px;background:#ccc;cursor:pointer;font-size:13px;';
    exitBtn.onclick = () => {
        floatPanel.remove();
        closeMiniGames();
    };
    floatPanel.appendChild(exitBtn);
    
    const oldPanel = document.getElementById('findDifferentFloatPanel');
    if (oldPanel) oldPanel.remove();
    
    document.body.appendChild(floatPanel);
}

function drawDistrictOnSmallCanvas(district, canvas) {
    if (!district || !district.boundaries || district.boundaries.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    district.boundaries.forEach(boundary => {
        boundary.forEach(point => {
            const lng = point.lng || point[0];
            const lat = point.lat || point[1];
            minX = Math.min(minX, lng);
            maxX = Math.max(maxX, lng);
            minY = Math.min(minY, lat);
            maxY = Math.max(maxY, lat);
        });
    });
    
    const pad = 10;
    const scaleX = (canvas.width - pad * 2) / (maxX - minX);
    const scaleY = (canvas.height - pad * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);
    
    const ox = (canvas.width - (maxX - minX) * scale) / 2;
    const oy = (canvas.height - (maxY - minY) * scale) / 2;
    
    function toXY(lng, lat) {
        return [ox + (lng - minX) * scale, canvas.height - oy - (lat - minY) * scale];
    }
    
    district.boundaries.forEach(boundary => {
        ctx.beginPath();
        boundary.forEach((point, i) => {
            const lng = point.lng || point[0];
            const lat = point.lat || point[1];
            const [x, y] = toXY(lng, lat);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,68,68,0.15)';
        ctx.fill();
    });
}

function checkFindDifferentMapAnswer(selected, floatPanel, clickedCell) {
    // 禁用所有格子点击，防止连点
    const allCells = floatPanel.querySelectorAll('.find-different-cell');
    allCells.forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    
    // 如果没有传入 clickedCell，不处理
    if (!clickedCell) {
        clickedCell = null;
    }
    
    if (selected === findDifferentAnswer) {
        playSound('correct');
        
        // 正确：绿色闪烁
        if (clickedCell) {
            clickedCell.style.borderColor = '#10b981';
            clickedCell.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
            clickedCell.style.transform = 'scale(1.05)';
            clickedCell.style.transition = 'all 0.3s';
        }
        
        setTimeout(() => {
            floatPanel.innerHTML = `<div style="text-align:center;padding:20px;"><div style="color:#10b981;font-size:24px;margin-bottom:10px;animation:popIn 0.3s;">✅ 正确！</div><div style="font-size:14px;">不同行政区是：${findDifferentAnswer}</div></div>`;
        }, 300);
        
    } else {
        playSound('wrong');
        
        // 错误：红色抖动
        if (clickedCell) {
            clickedCell.style.borderColor = '#ef4444';
            clickedCell.style.animation = 'shake 0.35s';
            clickedCell.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
            
            // 同时高亮正确答案
            const cells = floatPanel.querySelectorAll('div[style*="cursor:pointer"]');
            // 简单处理：直接显示正确答案
        }
        
        setTimeout(() => {
            floatPanel.innerHTML = `<div style="text-align:center;padding:20px;"><div style="color:#ef4444;font-size:24px;margin-bottom:10px;animation:shake 0.35s;">❌ 错误！</div><div style="font-size:14px;">正确答案是：${findDifferentAnswer}</div></div>`;
        }, 300);
    }
    
    setTimeout(() => {
        floatPanel.remove();
        generateFindDifferentQuestion();
    }, 2000);
}

function displayFindDifferentOptions(items) {
    // 创建一个浮动面板显示选项
    const floatPanel = document.createElement('div');
    floatPanel.id = 'findDifferentFloatPanel';
    floatPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;min-width:280px;';
    
    const title = document.createElement('div');
    title.textContent = '🔍 找出不同省份的行政区';
    title.style.cssText = 'text-align:center;font-weight:bold;margin-bottom:15px;font-size:14px;animation:popIn 0.3s ease-out;';
    floatPanel.appendChild(title);
    
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item;
        btn.style.cssText = 'display:block;width:100%;margin:6px 0;padding:12px;border:1px solid #ccc;border-radius:8px;background:white;cursor:pointer;font-size:14px;';
        btn.onclick = () => checkFindDifferentAnswer(item);
        floatPanel.appendChild(btn);
    });
    
    // 添加退出按钮
    const exitBtn = document.createElement('button');
    exitBtn.textContent = '退出小游戏';
    exitBtn.style.cssText = 'display:block;width:100%;margin:10px 0 0;padding:10px;border:none;border-radius:8px;background:#ccc;cursor:pointer;font-size:13px;';
    exitBtn.onclick = () => {
        floatPanel.remove();
        closeMiniGames();
    };
    floatPanel.appendChild(exitBtn);
    
    // 移除旧面板
    const oldPanel = document.getElementById('findDifferentFloatPanel');
    if (oldPanel) oldPanel.remove();
    
    document.body.appendChild(floatPanel);
}

function getCityCodeMap() {
    return {
        '石家庄市':'1301','唐山市':'1302','秦皇岛市':'1303','邯郸市':'1304','邢台市':'1305','保定市':'1306','张家口市':'1307','承德市':'1308','沧州市':'1309','廊坊市':'1310','衡水市':'1311',
        '太原市':'1401','大同市':'1402','阳泉市':'1403','长治市':'1404','晋城市':'1405','朔州市':'1406','晋中市':'1407','运城市':'1408','忻州市':'1409','临汾市':'1410','吕梁市':'1411',
        '沈阳市':'2101','大连市':'2102','鞍山市':'2103','抚顺市':'2104','本溪市':'2105','丹东市':'2106','锦州市':'2107','营口市':'2108','阜新市':'2109','辽阳市':'2110','盘锦市':'2111','铁岭市':'2112','朝阳市':'2113','葫芦岛市':'2114',
        '长春市':'2201','吉林市':'2202','四平市':'2203','辽源市':'2204','通化市':'2205','白山市':'2206','松原市':'2207','白城市':'2208','延边朝鲜族自治州':'2224',
        '哈尔滨市':'2301','齐齐哈尔市':'2302','鸡西市':'2303','鹤岗市':'2304','双鸭山市':'2305','大庆市':'2306','伊春市':'2307','佳木斯市':'2308','七台河市':'2309','牡丹江市':'2310','黑河市':'2311','绥化市':'2312','大兴安岭地区':'2327',
        '南京市':'3201','无锡市':'3202','徐州市':'3203','常州市':'3204','苏州市':'3205','南通市':'3206','连云港市':'3207','淮安市':'3208','盐城市':'3209','扬州市':'3210','镇江市':'3211','泰州市':'3212','宿迁市':'3213',
        '杭州市':'3301','宁波市':'3302','温州市':'3303','嘉兴市':'3304','湖州市':'3305','绍兴市':'3306','金华市':'3307','衢州市':'3308','舟山市':'3309','台州市':'3310','丽水市':'3311',
        '合肥市':'3401','芜湖市':'3402','蚌埠市':'3403','淮南市':'3404','马鞍山市':'3405','淮北市':'3406','铜陵市':'3407','安庆市':'3408','黄山市':'3410','滁州市':'3411','阜阳市':'3412','宿州市':'3413','六安市':'3415','亳州市':'3416','池州市':'3417','宣城市':'3418',
        '福州市':'3501','厦门市':'3502','莆田市':'3503','三明市':'3504','泉州市':'3505','漳州市':'3506','南平市':'3507','龙岩市':'3508','宁德市':'3509',
        '南昌市':'3601','景德镇市':'3602','萍乡市':'3603','九江市':'3604','新余市':'3605','鹰潭市':'3606','赣州市':'3607','吉安市':'3608','宜春市':'3609','抚州市':'3610','上饶市':'3611',
        '济南市':'3701','青岛市':'3702','淄博市':'3703','枣庄市':'3704','东营市':'3705','烟台市':'3706','潍坊市':'3707','济宁市':'3708','泰安市':'3709','威海市':'3710','日照市':'3711','临沂市':'3713','德州市':'3714','聊城市':'3715','滨州市':'3716','菏泽市':'3717',
        '郑州市':'4101','开封市':'4102','洛阳市':'4103','平顶山市':'4104','安阳市':'4105','鹤壁市':'4106','新乡市':'4107','焦作市':'4108','濮阳市':'4109','许昌市':'4110','漯河市':'4111','三门峡市':'4112','南阳市':'4113','商丘市':'4114','信阳市':'4115','周口市':'4116','驻马店市':'4117','济源市':'4190',
        '武汉市':'4201','黄石市':'4202','十堰市':'4203','宜昌市':'4205','襄阳市':'4206','鄂州市':'4207','荆门市':'4208','孝感市':'4209','荆州市':'4210','黄冈市':'4211','咸宁市':'4212','随州市':'4213','恩施土家族苗族自治州':'4228','仙桃市':'4290','潜江市':'4291','天门市':'4292','神农架林区':'4293',
        '长沙市':'4301','株洲市':'4302','湘潭市':'4303','衡阳市':'4304','邵阳市':'4305','岳阳市':'4306','常德市':'4307','张家界市':'4308','益阳市':'4309','郴州市':'4310','永州市':'4311','怀化市':'4312','娄底市':'4313','湘西土家族苗族自治州':'4331',
        '广州市':'4401','韶关市':'4402','深圳市':'4403','珠海市':'4404','汕头市':'4405','佛山市':'4406','江门市':'4407','湛江市':'4408','茂名市':'4409','肇庆市':'4412','惠州市':'4413','梅州市':'4414','汕尾市':'4415','河源市':'4416','阳江市':'4417','清远市':'4418','东莞市':'4419','中山市':'4420','潮州市':'4451','揭阳市':'4452','云浮市':'4453',
        '南宁市':'4501','柳州市':'4502','桂林市':'4503','梧州市':'4504','北海市':'4505','防城港市':'4506','钦州市':'4507','贵港市':'4508','玉林市':'4509','百色市':'4510','贺州市':'4511','河池市':'4512','来宾市':'4513','崇左市':'4514',
        '海口市':'4601','三亚市':'4602','儋州市':'4604',
        '成都市':'5101','自贡市':'5103','攀枝花市':'5104','泸州市':'5105','德阳市':'5106','绵阳市':'5107','广元市':'5108','遂宁市':'5109','内江市':'5110','乐山市':'5111','南充市':'5113','眉山市':'5114','宜宾市':'5115','广安市':'5116','达州市':'5117','雅安市':'5118','巴中市':'5119','资阳市':'5120','阿坝藏族羌族自治州':'5132','甘孜藏族自治州':'5133','凉山彝族自治州':'5134',
        '贵阳市':'5201','六盘水市':'5202','遵义市':'5203','安顺市':'5204','毕节市':'5205','铜仁市':'5206','黔西南布依族苗族自治州':'5223','黔东南苗族侗族自治州':'5226','黔南布依族苗族自治州':'5227',
        '昆明市':'5301','曲靖市':'5303','玉溪市':'5304','保山市':'5305','昭通市':'5306','丽江市':'5307','普洱市':'5308','临沧市':'5309','楚雄彝族自治州':'5323','红河哈尼族彝族自治州':'5325','文山壮族苗族自治州':'5326','西双版纳傣族自治州':'5328','大理白族自治州':'5329','德宏傣族景颇族自治州':'5331','怒江傈僳族自治州':'5333','迪庆藏族自治州':'5334',
        '拉萨市':'5401','日喀则市':'5402','昌都市':'5403','林芝市':'5404','山南市':'5405','那曲市':'5406','阿里地区':'5425',
        '西安市':'6101','铜川市':'6102','宝鸡市':'6103','咸阳市':'6104','渭南市':'6105','延安市':'6106','汉中市':'6107','榆林市':'6108','安康市':'6109','商洛市':'6110',
        '兰州市':'6201','嘉峪关市':'6202','金昌市':'6203','白银市':'6204','天水市':'6205','武威市':'6206','张掖市':'6207','平凉市':'6208','酒泉市':'6209','庆阳市':'6210','定西市':'6211','陇南市':'6212','临夏回族自治州':'6229','甘南藏族自治州':'6230',
        '西宁市':'6301','海东市':'6302','海北藏族自治州':'6322','黄南藏族自治州':'6323','海南藏族自治州':'6325','果洛藏族自治州':'6326','玉树藏族自治州':'6327','海西蒙古族藏族自治州':'6328',
        '银川市':'6401','石嘴山市':'6402','吴忠市':'6403','固原市':'6404','中卫市':'6405',
        '乌鲁木齐市':'6501','克拉玛依市':'6502','吐鲁番市':'6504','哈密市':'6505','昌吉回族自治州':'6523','博尔塔拉蒙古自治州':'6527','巴音郭楞蒙古自治州':'6528','阿克苏地区':'6529','克孜勒苏柯尔克孜自治州':'6530','喀什地区':'6531','和田地区':'6532','伊犁哈萨克自治州':'6540','塔城地区':'6542','阿勒泰地区':'6543'
    };
}

let skipDailyLock = false;

function skipDailyQuestion() {
    if (!dailyMode || dailyCompleted) return;
    
    // 防连点
    if (skipDailyLock) return;
    skipDailyLock = true;
    
    playSound('click');
    
    document.getElementById('dailySkipBtn').disabled = true;
    document.getElementById('dailyMsg').textContent = '⏭ 已跳过，本题不得分';
    
    dailyIndex++;
    
    setTimeout(() => {
        skipDailyLock = false;
        document.getElementById('dailySkipBtn').disabled = false;
        loadDailyQuestion();
    }, 500);
}

function loadBattleDistrict(name) {
    const oldMode = gameMode;
    gameMode = 'hard';
    loadDistrict(name);
    gameMode = oldMode;
}

// ==================== 好友对决 ====================
let battleRoomId = null;
let battlePlayerName = '';
let battlePlayerNumber = null;
let battleSubscription = null;
let battleMode = 'race';
let battleTimer = null;
let battleOwnQuestion = null;
let battleQuestionLoaded = false;
let battleAnswered = false;
let battleLastQuestion = null;

function openBattlePanel() {
    playSound('click');
    dailyMode = false;
    findDifferentMode = false;
    
    if (timerMode) {
        timerMode = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        document.getElementById('btnTimer').classList.remove('active');
        document.getElementById('timerDisplay').style.display = 'none';
    }
    
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';
    document.getElementById('miniGamesPanel').style.display = 'none';
    
    const bp = document.getElementById('battlePanel');
    bp.style.display = 'block';
    bp.classList.remove('pop-in');
    void bp.offsetWidth;
    bp.classList.add('pop-in');
}

function closeBattlePanel() {
    playSound('click');
    const bp = document.getElementById('battlePanel');
    bp.style.transform = 'scale(0.85)';
    bp.style.opacity = '0';
    bp.style.transition = 'all 0.2s ease';
    
    setTimeout(() => {
        bp.style.display = 'none';
        bp.style.transform = '';
        bp.style.opacity = '';
        bp.style.transition = '';
        
        document.getElementById('panel').style.display = 'block';
        document.getElementById('panelContent').style.display = 'block';
        document.getElementById('panel').classList.remove('pop-in');
        void document.getElementById('panel').offsetWidth;
        document.getElementById('panel').classList.add('pop-in');
    }, 200);
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function enterBattleRoom(infoText) {
    document.getElementById('battlePanel').style.display = 'none';
    
    const brp = document.getElementById('battleRoomPanel');
    brp.style.display = 'block';
    brp.classList.remove('pop-in');
    void brp.offsetWidth;
    brp.classList.add('pop-in');
    
    brp.style.setProperty('position', 'fixed', 'important');
    brp.style.setProperty('top', '10px', 'important');
    brp.style.setProperty('left', '10px', 'important');
    brp.style.setProperty('transform', 'none', 'important');
    brp.style.setProperty('max-width', '280px', 'important');
    brp.style.setProperty('max-height', '70vh', 'important');
    brp.style.setProperty('overflow-y', 'auto', 'important');
    brp.style.setProperty('z-index', '1000', 'important');
    brp.style.setProperty('background', 'white', 'important');
    brp.style.setProperty('padding', '12px', 'important');
    brp.style.setProperty('border-radius', '10px', 'important');
    brp.style.setProperty('box-shadow', '0 4px 15px rgba(0,0,0,0.2)', 'important');
        
    document.getElementById('battleRoomInfo').textContent = infoText;
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleInput').value = '';
}

async function createBattleRoom() {
    if (!supabaseClient) { alert('Supabase 未加载，请刷新'); return; }
    
    const name = document.getElementById('battlePlayerName').value.trim();
    if (!name) { alert('请输入昵称'); return; }
    
    battlePlayerName = name;
    battlePlayerNumber = 1;
    battleRoomId = generateRoomId();
    battleMode = document.getElementById('battleModeSelect').value;
    battleQuestionLoaded = false;
    battleAnswered = false;
    
    const targetScore = parseInt(document.getElementById('battleTargetScore').value) || 5;
    const duration = parseInt(document.getElementById('battleDuration').value) || 60;
    
    const { error } = await supabaseClient
        .from('battle_rooms')
        .insert({
            id: battleRoomId,
            mode: battleMode,
            target_score: targetScore,
            duration: duration,
            status: 'waiting',
            player1: name,
            player1_score: 0,
            player2_score: 0
        });
    
    if (error) { alert('创建房间失败: ' + error.message); return; }
    
    enterBattleRoom(`房间号: ${battleRoomId} | 等待对手加入...`);
    document.getElementById('battleScore').textContent = `${name}: 0 分 | 等待对手...`;
    subscribeBattleRoom();
}

async function joinBattleRoom() {
    if (!supabaseClient) { alert('Supabase 未加载，请刷新'); return; }
    
    const name = document.getElementById('battlePlayerName').value.trim();
    const roomId = document.getElementById('battleRoomInput').value.trim().toUpperCase();
    
    if (!name) { alert('请输入昵称'); return; }
    if (!roomId) { alert('请输入房间号'); return; }
    
    battlePlayerName = name;
    battlePlayerNumber = 2;
    battleRoomId = roomId;
    battleQuestionLoaded = false;
    battleAnswered = false;
    
    const { data, error } = await supabaseClient
        .from('battle_rooms')
        .update({ player2: name, status: 'playing' })
        .eq('id', roomId)
        .select();
    
    if (error || !data || data.length === 0) { alert('加入房间失败，检查房间号'); return; }
    
    battleMode = data[0].mode;
    enterBattleRoom(`房间号: ${battleRoomId} | 对战进行中！`);
    document.getElementById('battleScore').textContent = `${data[0].player1}: ${data[0].player1_score} 分 | ${name}: 0 分`;
    subscribeBattleRoom();
    
    if (battleMode === 'race') {
        await startRaceQuestion();
    } else {
        startScoreBattle();
    }
}

async function subscribeBattleRoom() {
    if (!supabaseClient) return;
    if (battleSubscription) supabaseClient.removeChannel(battleSubscription);
    
    battleSubscription = supabaseClient
        .channel('room_' + battleRoomId)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: 'id=eq.' + battleRoomId },
            (payload) => handleBattleUpdate(payload.new)
        )
        .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'battle_rooms', filter: 'id=eq.' + battleRoomId },
            () => {
                document.getElementById('battleRoomInfo').textContent = '⚠️ 房主已解散房间';
                document.getElementById('battleInput').disabled = true;
            }
        )
        .subscribe();
}

function handleBattleUpdate(roomData) {
    if (!roomData) return;
    
    document.getElementById('battleScore').textContent = 
        `${roomData.player1 || '玩家1'}: ${roomData.player1_score} 分 | ${roomData.player2 || '玩家2'}: ${roomData.player2_score} 分`;
    
    if (roomData.status === 'waiting') {
        document.getElementById('battleRoomInfo').textContent = `房间号: ${battleRoomId} | 等待对手加入...`;
    } else if (roomData.status === 'playing') {
        document.getElementById('battleRoomInfo').textContent = `房间号: ${battleRoomId} | 对战进行中！`;
        document.getElementById('battleInput').disabled = false;
        
        if (roomData.mode === 'race') {
            if (roomData.current_question) {
                // 题目变化就加载（不是null就加载）
                if (!battleQuestionLoaded || battleLastQuestion !== roomData.current_question) {
                    battleQuestionLoaded = true;
                    battleLastQuestion = roomData.current_question;
                    battleAnswered = false;
                    document.getElementById('battleQuestion').textContent = '请猜区县（轮廓已显示在地图上）';
                    document.getElementById('battleQuestion').style.display = 'block';
                    loadBattleDistrict(roomData.current_question);
                }
            } else if (battlePlayerNumber === 1) {
                startRaceQuestion();
            }
        }
    } else if (roomData.status === 'finished') {
        const winner = roomData.player1_score > roomData.player2_score ? roomData.player1 : 
                      roomData.player1_score < roomData.player2_score ? roomData.player2 : '平局';
        document.getElementById('battleRoomInfo').textContent = `🏆 ${winner} 获胜！`;
        document.getElementById('battleInput').disabled = true;
        if (battleTimer) clearInterval(battleTimer);
    }
}

// 加载对决战地图
function loadBattleDistrict(name) {
    const oldMode = gameMode;
    gameMode = 'hard';
    loadDistrict(name);
    gameMode = oldMode;
}

// ==================== 模式1：竞速对决 ====================
async function startRaceQuestion() {
    if (!supabaseClient || !battleRoomId) return;
    
    const { data } = await supabaseClient
        .from('battle_rooms')
        .select('current_question')
        .eq('id', battleRoomId)
        .single();
    
    if (data && data.current_question) {
        battleQuestionLoaded = true;
        battleAnswered = false;
        document.getElementById('battleQuestion').textContent = '请猜区县（轮廓已显示在地图上）';
        document.getElementById('battleQuestion').style.display = 'block';
        loadBattleDistrict(data.current_question);
        return;
    }
    
    if (battlePlayerNumber === 1) {
        const districts = Object.keys(ADJACENCY);
        const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
        
        await supabaseClient
            .from('battle_rooms')
            .update({ current_question: randomDistrict })
            .eq('id', battleRoomId);
        
        battleQuestionLoaded = true;
        battleAnswered = false;
        document.getElementById('battleQuestion').textContent = '请猜区县（轮廓已显示在地图上）';
        document.getElementById('battleQuestion').style.display = 'block';
        loadBattleDistrict(randomDistrict);
    }
}

async function submitBattleAnswer() {
    if (!supabaseClient || !battleRoomId || battleAnswered) return;
    
    const input = document.getElementById('battleInput').value.trim();
    if (!input) return;
    
    const { data } = await supabaseClient
        .from('battle_rooms')
        .select('current_question, mode')
        .eq('id', battleRoomId)
        .single();
    
    if (!data) return;
    
    let correct = false;
    let correctName = '';
    
    if (data.mode === 'race') {
        if (!data.current_question) return;
        const oldMode = gameMode;
        gameMode = 'hard';
        const match = matchForMode(input, 'hard');
        gameMode = oldMode;
        if (match.status === 'exact') {
            const targetBase = data.current_question.replace(/（.+?）$/, '');
            const matchBase = match.name.replace(/（.+?）$/, '');
            correct = match.name === data.current_question || matchBase === targetBase;
            correctName = data.current_question;
        }
    } else {
        if (!battleOwnQuestion) return;
        const oldMode = gameMode;
        gameMode = 'hard';
        const match = matchForMode(input, 'hard');
        gameMode = oldMode;
        if (match.status === 'exact') {
            const targetBase = battleOwnQuestion.replace(/（.+?）$/, '');
            const matchBase = match.name.replace(/（.+?）$/, '');
            correct = match.name === battleOwnQuestion || matchBase === targetBase;
            correctName = battleOwnQuestion;
        }
    }
    
    document.getElementById('battleInput').value = '';
    
    if (correct) {
        battleAnswered = true;
        battleLastQuestion = null;
    
        playSound('correct');
        document.getElementById('battleQuestion').textContent = `✅ 答对了！是 ${correctName}`;
        await addBattleScore();
        
        if (data.mode === 'race') {
            battleQuestionLoaded = false;
            setTimeout(async () => {
                await supabaseClient
                    .from('battle_rooms')
                    .update({ current_question: null })
                    .eq('id', battleRoomId);
                startRaceQuestion();
            }, 1500);
        } else {
            setTimeout(() => generateOwnQuestion(), 1000);
        }
    } else {
        playSound('wrong');
        document.getElementById('battleQuestion').textContent = '❌ 再试试！';
    }
}

async function addBattleScore() {
    if (!supabaseClient || !battleRoomId) return;
    
    const scoreField = battlePlayerNumber === 1 ? 'player1_score' : 'player2_score';
    
    const { data: roomData } = await supabaseClient
        .from('battle_rooms')
        .select('player1_score, player2_score, target_score, mode')
        .eq('id', battleRoomId)
        .single();
    
    if (!roomData) return;
    
    const newScore = (battlePlayerNumber === 1 ? roomData.player1_score : roomData.player2_score) + 1;
    
    await supabaseClient
        .from('battle_rooms')
        .update({ [scoreField]: newScore })
        .eq('id', battleRoomId);
    
    if (roomData.mode === 'race' && newScore >= roomData.target_score) {
        await supabaseClient
            .from('battle_rooms')
            .update({ status: 'finished' })
            .eq('id', battleRoomId);
    }
}

// ==================== 模式2：竞分对决 ====================
async function startScoreBattle() {
    if (!supabaseClient || !battleRoomId) return;
    
    const { data } = await supabaseClient
        .from('battle_rooms')
        .select('duration')
        .eq('id', battleRoomId)
        .single();
    
    const duration = data?.duration || 60;
    let timeLeft = duration;
    document.getElementById('battleRoomInfo').textContent = `⏱ 剩余时间: ${timeLeft}秒`;
    
    if (battleTimer) clearInterval(battleTimer);
    battleTimer = setInterval(async () => {
        timeLeft--;
        document.getElementById('battleRoomInfo').textContent = `⏱ 剩余时间: ${timeLeft}秒`;
        
        if (timeLeft <= 0) {
            clearInterval(battleTimer);
            battleTimer = null;
            document.getElementById('battleInput').disabled = true;
            if (battlePlayerNumber === 1) {
                await supabaseClient
                    .from('battle_rooms')
                    .update({ status: 'finished' })
                    .eq('id', battleRoomId);
            }
        }
    }, 1000);
    
    generateOwnQuestion();
}

function generateOwnQuestion() {
    if (!battleRoomId) return;
    const districts = Object.keys(ADJACENCY);
    battleOwnQuestion = districts[Math.floor(Math.random() * districts.length)];
    battleAnswered = false;
    document.getElementById('battleQuestion').textContent = '请猜区县（轮廓已显示在地图上）';
    document.getElementById('battleQuestion').style.display = 'block';
    loadBattleDistrict(battleOwnQuestion);
}

async function leaveBattleRoom() {
    playSound('click');
    
    if (battleSubscription) {
        supabaseClient.removeChannel(battleSubscription);
        battleSubscription = null;
    }
    
    if (battleTimer) {
        clearInterval(battleTimer);
        battleTimer = null;
    }
    
    if (battlePlayerNumber === 1 && battleRoomId && supabaseClient) {
        await supabaseClient
            .from('battle_rooms')
            .update({ status: 'finished' })
            .eq('id', battleRoomId);
        await supabaseClient
            .from('battle_rooms')
            .delete()
            .eq('id', battleRoomId);
    }
    
    battleRoomId = null;
    battlePlayerNumber = null;
    battleOwnQuestion = null;
    battleQuestionLoaded = false;
    battleAnswered = false;
    
    const brp = document.getElementById('battleRoomPanel');
    brp.style.transform = 'scale(0.85)';
    brp.style.opacity = '0';
    brp.style.transition = 'all 0.2s ease';
    setTimeout(() => {
        brp.style.display = 'none';
        brp.style.transform = '';
        brp.style.opacity = '';
        brp.style.transition = '';
        document.getElementById('battlePanel').style.display = 'block';
        document.getElementById('battlePanel').classList.remove('pop-in');
        void document.getElementById('battlePanel').offsetWidth;
        document.getElementById('battlePanel').classList.add('pop-in');
    }, 200);
    
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleInput').value = '';
    
    if (map) newRound();
}