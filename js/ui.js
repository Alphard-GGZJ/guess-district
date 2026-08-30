function setMsg(text, className) {
    const msg = document.getElementById('msg');
    msg.textContent = text;
    msg.className = className;
}

function bindUI() {
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
