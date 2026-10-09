function setMsg(text, className) {
    const msg = document.getElementById('msg');
    msg.textContent = text;
    msg.className = className;
}

function enterGameThenRun(callback) {
    // 首页淡出
    document.getElementById('homeScreen').classList.add('fade-out');

    // 遮罩淡入
    setTimeout(() => {
        document.getElementById('transitionOverlay').classList.add('show');
    }, 300);

    setTimeout(() => {
        document.getElementById('transitionOverlay').classList.remove('show');
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('panel').style.display = 'block';
        document.getElementById('panel').classList.add('visible');
        document.getElementById('map').classList.add('visible');

        // 重新加载按钮显示
        const rb = document.getElementById('reloadBtn');
        rb.style.visibility = 'visible';
        rb.style.opacity = '1';

        // 执行回调
        if (typeof callback === 'function') callback();
    }, 800);

    // 清理
    setTimeout(() => {
        document.getElementById('homeScreen').classList.remove('fade-out');
    }, 1400);
}

function showHomeScreenWithFade() {
    const home = document.getElementById('homeScreen');

    // 先复位状态，准备从透明开始
    home.classList.remove('fade-out');
    home.style.transition = 'none';
    home.style.display = 'flex';
    home.style.opacity = '0';
    home.style.transform = 'scale(1.05)';

    // 强制回流，让初始状态生效
    void home.offsetWidth;

    // 播放渐显
    home.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    home.style.opacity = '1';
    home.style.transform = 'scale(1)';

    // 动画结束后清理内联，恢复由 class 控制
    setTimeout(() => {
        home.style.transition = '';
        home.style.opacity = '';
        home.style.transform = '';
    }, 550);
}

function backToHomeScreen() {
    playSound('click');

    if (typeof quizCleanup === 'function') quizCleanup();

    // 退出每日挑战状态
    dailyMode = false;
    dailyCompleted = false;
    dailyCityMode = false;

    // 退出计时模式
    if (timerMode) {
        timerMode = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        document.getElementById('btnTimer').classList.remove('active');
        document.getElementById('timerDisplay').style.display = 'none';
        document.getElementById('timerDisplay').textContent = '';
    }

    // 隐藏游戏内所有面板
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';
    document.getElementById('panel').classList.remove('visible');
    document.getElementById('map').classList.remove('visible');
    document.getElementById('dailyModePopup').style.display = 'none';

    const rb = document.getElementById('reloadBtn');
    if (rb) {
        rb.style.visibility = 'hidden';
        rb.style.opacity = '0';
    }

    // 渐显回首页
    showHomeScreenWithFade();
}

function showDailyModePopup() {
    const popup = document.getElementById('dailyModePopup');

    // 清除可能残留的内联样式，统一由 CSS 类控制
    popup.style.display = 'block';
    popup.style.opacity = '';
    popup.style.transform = '';
    popup.style.transition = '';

    // 确保从隐藏态开始
    popup.classList.remove('daily-popup-visible');

    // 强制回流，确立起点
    void popup.offsetWidth;

    // 切到显示态，触发过渡
    popup.classList.add('daily-popup-visible');
}

function hideDailyModePopup(callback) {
    const popup = document.getElementById('dailyModePopup');

    // 若当前不可见，直接回调
    if (getComputedStyle(popup).display === 'none') {
        if (typeof callback === 'function') callback();
        return;
    }

    // 切回隐藏态，触发 CSS 过渡
    popup.classList.remove('daily-popup-visible');

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;

        popup.style.display = 'none';

        if (typeof callback === 'function') callback();
    };

    // 监听透明度过渡结束
    popup.addEventListener('transitionend', function handler(e) {
        if (e.target !== popup || e.propertyName !== 'opacity') return;
        popup.removeEventListener('transitionend', handler);
        finish();
    });

    // 兜底
    setTimeout(finish, 450);
}

function bindUI() {

document.getElementById('homeBtnAvatar').addEventListener('click', openAvatarPopup);
document.getElementById('homeAvatarDisplay').addEventListener('click', openAvatarPopup);

document.getElementById('avatarCloseBtn').addEventListener('click', closeAvatarPopup);

// 搜索头像
document.getElementById('avatarSearchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') searchAvatarDistrict();
});
document.getElementById('avatarSetBtn').addEventListener('click', function () {
    if (!pendingAvatarImage) {
        document.getElementById('avatarSearchMsg').textContent = '请先搜索并选择区域';
        return;
    }
    currentAvatarImage = pendingAvatarImage;
    try {
        localStorage.setItem('avatarImage', currentAvatarImage);
    } catch (e) {
        document.getElementById('avatarSearchMsg').textContent = '❌ 存储空间不足，请先清除旧头像';
        return;
    }
    applyAvatar();
    closeAvatarPopup();
    playSound('click');
});
document.getElementById('avatarClearBtn').addEventListener('click', function () {
    currentAvatarImage = '';
    localStorage.removeItem('avatarImage');
    applyAvatar();
    document.getElementById('avatarPreview').innerHTML = '<span style="color:#999;font-size:13px;">暂无</span>';
    document.getElementById('avatarSearchMsg').textContent = '已清除';
    playSound('click');
});

document.getElementById('homeBtnPlay').addEventListener('click', () => {
    playSound('click');
    enterGameThenRun(null);
});

document.getElementById('homeBtnQuiz').addEventListener('click', () => {
    playSound('click');
    enterGameThenRun(() => openQuizPanel());
});

document.getElementById('quizQueryBtn').addEventListener('click', quizDoQuery);
document.getElementById('quizQueryInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') quizDoQuery();
});
document.getElementById('quizRandomBtn').addEventListener('click', quizRandomPick);

// 随机范围的省份下拉初始化
(function initQuizRandomProvinces() {
    var sel = document.getElementById('quizRandomProvince');
    if (!sel) return;
    ['北京市','天津市','河北省','山西省','内蒙古','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西','海南省','重庆市','四川省','贵州省','云南省','西藏','陕西省','甘肃省','青海省','宁夏','新疆','香港','澳门'].forEach(function(p) {
        var opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        sel.appendChild(opt);
    });
})();

// 大区变化时重置省份
document.getElementById('quizRandomRegion').addEventListener('change', function() {
    document.getElementById('quizRandomProvince').value = 'all';
});

// 省份变化时重置大区
document.getElementById('quizRandomProvince').addEventListener('change', function() {
    if (this.value !== 'all') {
        document.getElementById('quizRandomRegion').value = 'all';
    }
});
document.getElementById('quizSaveBtn').addEventListener('click', quizSaveImage);
document.getElementById('quizPreviewBtn').addEventListener('click', quizPreviewImage);
document.getElementById('quizClearBtn').addEventListener('click', quizClearAll);
document.getElementById('quizBackHomeBtn').addEventListener('click', quizExit);
document.getElementById('quizToggleBtn').addEventListener('click', quizTogglePanel);
document.getElementById('quizFontSize').addEventListener('input', function() {
    var v = parseInt(this.value);
    if (!isFinite(v) || v < 0) return;
    document.getElementById('quizFontSizeVal').textContent = v;
});

document.getElementById('quizShowNames').addEventListener('change', function() {
    var show = this.checked;
    quizRegions.forEach(function(r) {
        if (!r.nameLabel) return;
        // 名称为 0 号的，无论总开关如何都保持隐藏
        if (r.nameSize === 0) {
            r.nameLabel.hide();
            return;
        }
        if (show) r.nameLabel.show();
        else r.nameLabel.hide();
    });

    // 手机端：重绘 Canvas
    if (window.innerWidth <= 768 && typeof quizRenderMobileCanvas === 'function') {
        quizRenderMobileCanvas();
    }
});

document.getElementById('quizNameFontSize').addEventListener('input', function() {
    // 只作为后续新增区域的默认名称字号，不影响已添加区域
});

document.getElementById('quizNameColor').addEventListener('input', function() {
    // 只作为后续新增区域的默认名称颜色，不影响已添加区域
});

document.getElementById('quizFillOpacity').addEventListener('input', function() {
    var v = parseInt(this.value);
    if (!isFinite(v) || v < 0) return;
    document.getElementById('quizFillOpacityVal').textContent = v;
    // 只作为后续新增区域的默认透明度，不影响已添加区域
});

document.getElementById('homeBtnDaily').addEventListener('click', () => {
    playSound('click');

    const home = document.getElementById('homeScreen');

    // 先清除可能残留的内联样式和状态，强制复位
    home.style.opacity = '';
    home.style.transform = '';
    home.classList.remove('fade-out');

    // 强制回流，确保动画可以重新触发
    void home.offsetWidth;

    // 首页淡出
    home.classList.add('fade-out');

    // 等首页淡出动画（0.5s）完全结束后，再显示弹窗
    setTimeout(() => {
        home.style.display = 'none';
        home.classList.remove('fade-out');

        // 复位内联，避免残留影响下次
        home.style.opacity = '';
        home.style.transform = '';

        // 首页已完全消失，此时再显示弹窗并播放淡入
        showDailyModePopup();
    }, 550);
});

document.getElementById('dailyModeDistrict').addEventListener('click', () => {
    playSound('click');
    hideDailyModePopup(() => {
        enterGameThenRun(() => startDailyChallenge(false));
    });
});

document.getElementById('dailyModeCity').addEventListener('click', () => {
    playSound('click');
    hideDailyModePopup(() => {
        enterGameThenRun(() => startDailyChallenge(true));
    });
});

document.getElementById('dailyModeCancel').addEventListener('click', () => {
    playSound('click');
    // 先让弹窗完全淡出（约 300ms），再渐显首页
    hideDailyModePopup(() => {
        showHomeScreenWithFade();
    });
});

document.getElementById('homeBtnMiniGames').addEventListener('click', () => {
    playSound('click');

    const home = document.getElementById('homeScreen');
    home.style.opacity = '';
    home.style.transform = '';
    home.classList.remove('fade-out');
    void home.offsetWidth;
    home.classList.add('fade-out');

    setTimeout(() => {
        home.style.display = 'none';
        home.classList.remove('fade-out');
        home.style.opacity = '';
        home.style.transform = '';

        document.getElementById('map').classList.add('visible');
        document.getElementById('panel').style.display = 'block';
        document.getElementById('panel').classList.add('visible');
        const rb = document.getElementById('reloadBtn');
        rb.style.visibility = 'visible';
        rb.style.opacity = '1';

        openMiniGames();
    }, 550);
});

document.getElementById('homeBtnBattle').addEventListener('click', () => {
    playSound('click');

    const home = document.getElementById('homeScreen');
    home.style.opacity = '';
    home.style.transform = '';
    home.classList.remove('fade-out');
    void home.offsetWidth;
    home.classList.add('fade-out');

    setTimeout(() => {
        home.style.display = 'none';
        home.classList.remove('fade-out');
        home.style.opacity = '';
        home.style.transform = '';

        document.getElementById('map').classList.add('visible');
        document.getElementById('panel').style.display = 'block';
        document.getElementById('panel').classList.add('visible');
        const rb = document.getElementById('reloadBtn');
        rb.style.visibility = 'visible';
        rb.style.opacity = '1';

        openBattlePanel();
    }, 550);
});

    document.getElementById('reloadBtn').addEventListener('click', reloadCurrentMap);
    document.getElementById('backHomeBtn').addEventListener('click', backToHomeScreen);
    document.getElementById('battleCollapseBtn').addEventListener('click', toggleBattleCollapse);
    document.getElementById('battleCopyRoomBtn').addEventListener('click', copyBattleRoomId);
    document.getElementById('btnBattleExit').addEventListener('click', closeBattlePanel);
    document.getElementById('btnBattleCreate').addEventListener('click', createBattleRoom);
    document.getElementById('btnBattleJoin').addEventListener('click', joinBattleRoom);
    document.getElementById('battleStartBtn').addEventListener('click', startMultiBattlePeer);
        document.getElementById('btnBattleHistory').addEventListener('click', showBattleHistory);
        document.getElementById('battleModeSelect').addEventListener('change', function() {
        if (this.value === 'score') {
            document.getElementById('battleTargetScoreDiv').style.display = 'none';
            document.getElementById('battleDurationDiv').style.display = 'block';
            document.getElementById('battleMaxPlayersDiv').style.display = 'block';
        } else {
            document.getElementById('battleTargetScoreDiv').style.display = 'block';
            document.getElementById('battleDurationDiv').style.display = 'none';
            document.getElementById('battleMaxPlayersDiv').style.display = 'none';
        }
    });
    document.getElementById('btnBattleLeave').addEventListener('click', leaveBattleRoom);
    document.getElementById('battleSubmitBtn').addEventListener('click', submitBattleAnswer);
        document.getElementById('battleGiveUpBtn').addEventListener('click', giveUpBattle);
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
    document.getElementById('dailyReviewBtn').addEventListener('click', showDailyReview);
document.getElementById('dailySubmitBtn').addEventListener('click', checkAnswer);
document.getElementById('dailyExitBtn').addEventListener('click', exitDailyChallenge);
document.getElementById('dailyShareBtn').addEventListener('click', shareDailyResult);
document.getElementById('dailyImageBtn').addEventListener('click', generateDailyImage);
document.getElementById('dailyInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkAnswer();
});
    document.getElementById('btnTimer').addEventListener('click', toggleTimer);
    document.getElementById('btnMiniGamesExit').addEventListener('click', closeMiniGames);
    document.getElementById('btnFindDifferent').addEventListener('click', startFindDifferent);
    document.getElementById('btnFindDifferentMixed').addEventListener('click', startFindDifferentMixed);
    document.getElementById('btnCoastInland').addEventListener('click', startCoastInland);
    document.getElementById('btnGovSeat').addEventListener('click', openGovSeatPanel);

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
    document.querySelectorAll('#panel button, #dailyPanel button, #quizPanel button, #battlePanel button, #miniGamesPanel button').forEach(btn => {
        if (btn.hasAttribute('onclick')) return;
        btn.addEventListener('click', () => playSound('click'));
    });
}

// ==================== 出题模式 ====================
var quizRegions = [];

var QUIZ_DEFAULT_COLORS = [
    '#FF0000', '#0066FF', '#00AA00', '#FF6600', '#9900CC',
    '#0099CC', '#CC0066', '#666600', '#FF69B4', '#00CED1'
];

function openQuizPanel() {
    // 隐藏其他面板
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';
    document.getElementById('miniGamesPanel').style.display = 'none';
    document.getElementById('battlePanel').style.display = 'none';

    var qp = document.getElementById('quizPanel');
    qp.style.display = 'block';
    qp.classList.remove('pop-in');
    void qp.offsetWidth;
    qp.classList.add('pop-in');

    // 隐藏重新加载地图按钮
    var rb = document.getElementById('reloadBtn');
    if (rb) {
        rb.style.visibility = 'hidden';
        rb.style.opacity = '0';
    }

    // 清除当前地图
    if (typeof clearMap === 'function') clearMap();
    if (typeof currentPolygons !== 'undefined') {
        currentPolygons.forEach(function(p) { p.setMap(null); });
        currentPolygons = [];
    }
}


function quizTogglePanel() {
    var content = document.getElementById('quizPanelContent');
    var btn = document.getElementById('quizToggleBtn');
    if (!content || !btn) return;

    var isHidden = getComputedStyle(content).display === 'none';

    if (isHidden) {
        content.style.display = 'block';
        btn.textContent = '收起';
    } else {
        content.style.display = 'none';
        btn.textContent = '展开';
    }
}

function quizExit() {
    quizCleanup();

    // 渐显回首页
    if (typeof showHomeScreenWithFade === 'function') {
        showHomeScreenWithFade();
    }

    // 隐藏地图和游戏面板
    document.getElementById('panel').style.display = 'none';
    document.getElementById('panel').classList.remove('visible');
    document.getElementById('map').classList.remove('visible');
}

// 清除出题模式的所有痕迹（地图图形、面板、输入、全局设置）
function quizCleanup() {
    if (typeof quizRegions !== 'undefined' && quizRegions.length > 0) {
        quizRegions.forEach(function(r) {
            r.polygon.forEach(function(p) { p.setMap(null); });
            if (r.numLabel) r.numLabel.setMap(null);
            if (r.nameLabel) r.nameLabel.setMap(null);
        });
    }
    quizRegions = [];

    var list = document.getElementById('quizRegionList');
    if (list) list.innerHTML = '';

    var mobileCanvas = document.getElementById('quizCanvas');
    if (mobileCanvas) mobileCanvas.remove();

    var panel = document.getElementById('quizPanel');
    if (panel) panel.style.display = 'none';

    // 清空输入框
    var qi = document.getElementById('quizQueryInput');
    if (qi) qi.value = '';
    var qt = document.getElementById('quizTextContent');
    if (qt) qt.value = '';

    // 重置全局设置
    var f = document.getElementById('quizFontSize');
    if (f) f.value = '24';
    var fv = document.getElementById('quizFontSizeVal');
    if (fv) fv.textContent = '24';

    var df = document.getElementById('quizDefaultFill');
    if (df) df.value = '#FF0000';
    var db = document.getElementById('quizDefaultBorder');
    if (db) db.value = '#000000';
    var dn = document.getElementById('quizDefaultNumColor');
    if (dn) dn.value = '#FF0000';

    var fo = document.getElementById('quizFillOpacity');
    if (fo) fo.value = '35';
    var fov = document.getElementById('quizFillOpacityVal');
    if (fov) fov.textContent = '35';

    var sn = document.getElementById('quizShowNames');
    if (sn) sn.checked = false;

    var nf = document.getElementById('quizNameFontSize');
    if (nf) nf.value = '14';
    var nc = document.getElementById('quizNameColor');
    if (nc) nc.value = '#333333';

    var tf = document.getElementById('quizTextFontSize');
    if (tf) tf.value = '24';
    var tc = document.getElementById('quizTextColor');
    if (tc) tc.value = '#000000';

    // 重置随机范围
    var rr = document.getElementById('quizRandomRegion');
    if (rr) rr.value = 'all';
    var rp = document.getElementById('quizRandomProvince');
    if (rp) rp.value = 'all';

    // 清掉出题模式的拦截，避免影响其他模式
    window._quizIntercept = null;

    // 恢复出题面板内容为展开
    var qpc = document.getElementById('quizPanelContent');
    if (qpc) qpc.style.display = 'block';
    var qtb = document.getElementById('quizToggleBtn');
    if (qtb) qtb.textContent = '收起';
}

// 大区 → 省份列表
var QUIZ_REGION_PROVINCES = {
    'north': ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'],
    'northeast': ['辽宁省', '吉林省', '黑龙江省'],
    'east': ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省'],
    'central': ['河南省', '湖北省', '湖南省'],
    'south': ['广东省', '广西壮族自治区', '海南省'],
    'southwest': ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'],
    'northwest': ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区']
};

var QUIZ_PROVINCE_FULL = {
    '内蒙古': '内蒙古自治区',
    '广西': '广西壮族自治区',
    '西藏': '西藏自治区',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区',
    '香港': '香港特别行政区',
    '澳门': '澳门特别行政区'
};

function quizRandomPick() {
    var region = document.getElementById('quizRandomRegion').value;
    var province = document.getElementById('quizRandomProvince').value;

    // 1. 确定省份列表（和主游戏一样的逻辑）
    var provinceList = [];

    if (province !== 'all') {
        var full = QUIZ_PROVINCE_FULL[province] || province;
        provinceList = [full];
    } else if (region !== 'all') {
        provinceList = QUIZ_REGION_PROVINCES[region] || [];
    } else {
        provinceList = [
            '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
            '辽宁省', '吉林省', '黑龙江省',
            '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
            '河南省', '湖北省', '湖南省',
            '广东省', '广西壮族自治区', '海南省',
            '重庆市', '四川省', '贵州省', '云南省', '西藏自治区',
            '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'
        ];
    }

    if (provinceList.length === 0) {
        alert('该范围没有省份');
        return;
    }

    // 2. 收集所有市的 code
    var allCityCodes = [];
    provinceList.forEach(function(p) {
        var codes = getCitiesByProvince(p);
        if (codes && codes.length > 0) {
            allCityCodes = allCityCodes.concat(codes);
        }
    });

    if (allCityCodes.length === 0) {
        alert('该范围没有城市数据');
        return;
    }

    // 3. 随机打乱市 code，依次尝试，直到拿到一个未添加过的区县
    var shuffledCodes = allCityCodes.slice().sort(function() { return Math.random() - 0.5; });
    var tried = 0;
    var maxTry = Math.min(shuffledCodes.length, 20);

    function tryNext() {
        if (tried >= maxTry) {
            alert('该范围内没找到可抽取的新区县');
            return;
        }
        var cityCode = shuffledCodes[tried++];

        dsCity.search(cityCode, function(status, result) {
            if (status !== 'complete' || !result.districtList || result.districtList.length === 0) {
                tryNext();
                return;
            }

            var subs = (result.districtList[0].districtList || []).filter(function(d) {
                return d.level === 'district' && d.name;
            });

            if (subs.length === 0) {
                tryNext();
                return;
            }

            // 排除已添加的区县名
            var available = subs.filter(function(d) {
                return !quizRegions.some(function(r) {
                    // 题目名可能是 区县 或 区县（市）
                    var base = r.name.replace(/（.+?）$/, '');
                    return base === d.name;
                });
            });

            if (available.length === 0) {
                tryNext();
                return;
            }

            var pick = available[Math.floor(Math.random() * available.length)];
            var pickName = pick.name;

            // 如果 ADJACENCY 里有带括号的同名键，优先用带括号版本
            var parenKey = Object.keys(ADJACENCY).find(function(k) {
                return k.includes('（' + pick.name + '）');
            });
            if (parenKey) {
                pickName = parenKey;
            } else if (Object.keys(ADJACENCY).indexOf(pick.name) !== -1) {
                pickName = pick.name;
            }

            // 填入输入框并触发查询
            document.getElementById('quizQueryInput').value = pickName;
            quizDoQuery();
        });
    }

    tryNext();
}

function quizDoQuery() {
    var raw = document.getElementById('quizQueryInput').value.trim();
    if (!raw) return;

    document.getElementById('quizQueryInput').value = '';

    if (quizRegions.some(function(r) { return r.name === raw; })) {
        alert('已添加该区域');
        return;
    }

    // 拦截 showDistrict：让它把结果交给 quizAddRegion
    window._quizIntercept = function(district) {
        if (!district || !district.boundaries || district.boundaries.length === 0) {
            alert('该区域无边界数据');
            return;
        }
        quizAddRegion(raw, district);
    };

    // 直接复用看图猜区县的地图加载逻辑，强制走区县级搜索
    loadDistrict(raw, true);
}

function quizAddRegion(name, district) {
    var index = quizRegions.length;
    var defaultFillEl = document.getElementById('quizDefaultFill');
    var defaultBorderEl = document.getElementById('quizDefaultBorder');
    var defaultNumColorEl = document.getElementById('quizDefaultNumColor');
    var color = defaultFillEl ? defaultFillEl.value : QUIZ_DEFAULT_COLORS[index % QUIZ_DEFAULT_COLORS.length];
    var borderColor = defaultBorderEl ? defaultBorderEl.value : '#000000';
    var numColorInit = defaultNumColorEl ? defaultNumColorEl.value : color;

    var fillOpacityInit = parseInt(document.getElementById('quizFillOpacity').value);
    if (!isFinite(fillOpacityInit) || fillOpacityInit < 0) fillOpacityInit = 35;
    var fillOpacityVal = fillOpacityInit / 100;

    var isMobile = window.innerWidth <= 768;
    var polys = [];

    if (!isMobile) {
        polys = district.boundaries.map(function(b) {
            return new AMap.Polygon({
                map: map,
                path: b,
                strokeColor: borderColor,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: fillOpacityVal
            });
        });
    }

    var center = district.center;
    var initialSize = parseInt(document.getElementById('quizFontSize').value);
    if (!isFinite(initialSize) || initialSize < 0) initialSize = 24;
    var label = null;
    if (center && !isMobile) {
        label = new AMap.Text({
            text: String(index + 1),
            position: center,
            anchor: 'center',
            draggable: true,
            style: {
                'background': 'transparent',
                'border': 'none',
                'font-size': (initialSize > 0 ? initialSize : 24) + 'px',
                'font-weight': 'bold',
                'color': numColorInit,
                'text-shadow': '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                'cursor': 'move'
            },
            map: map,
            zIndex: 200
        });

        if (initialSize === 0) {
            label.hide();
        }
    }

    // 区县名称标签（在地图上显示）
    var nameLabel = null;
    var nameSize = 14;
    var nameColor = '#333333';

    if (center) {
        var nameSizeEl = document.getElementById('quizNameFontSize');
        var nameColorEl = document.getElementById('quizNameColor');
        nameSize = nameSizeEl ? parseInt(nameSizeEl.value) : 14;
        if (!isFinite(nameSize) || nameSize < 0) nameSize = 14;
        nameColor = nameColorEl ? nameColorEl.value : '#333333';

        if (!isMobile) {
            nameLabel = new AMap.Text({
                text: name,
                position: center,
                anchor: 'center',
                draggable: true,
                style: {
                    'background': 'transparent',
                    'border': 'none',
                    'font-size': nameSize + 'px',
                    'font-weight': 'bold',
                    'color': nameColor,
                    'text-shadow': '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff',
                    'cursor': 'default'
                },
                map: map,
                zIndex: 210
            });

            var showNamesInit = document.getElementById('quizShowNames');
            if (!showNamesInit || !showNamesInit.checked) {
                nameLabel.hide();
            }
        }
    }

    var region = {
        name: name,
        color: color,
        borderColor: borderColor,
        fillOpacity: fillOpacityVal,
        adcode: district.adcode,
        boundaries: district.boundaries,
        center: center,
        polygon: polys,
        numText: String(index + 1),
        numColor: numColorInit,
        numSize: initialSize,
        numLabel: label,
        nameLabel: nameLabel,
        nameSize: nameSize,
        nameColor: nameColor,
        numPos: null
    };

    quizRegions.push(region);

    if (isMobile) {
        quizRenderMobileCanvas();
    } else {
        map.setFitView(polys, null, [40, 40, 40, 40]);
    }

    quizRenderList();
}

// 手机端：用 Canvas 绘制所有区域、数字、名称
function quizRenderMobileCanvas() {
    var oldCanvas = document.getElementById('quizCanvas');
    if (oldCanvas) oldCanvas.remove();

    if (quizRegions.length === 0) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'quizCanvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;background:#dfe9f5;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block';
    mapDiv.style.background = '#dfe9f5';
    mapDiv.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    quizRegions.forEach(function(r) {
        r.boundaries.forEach(function(b) {
            b.forEach(function(p) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                minX = Math.min(minX, lng);
                maxX = Math.max(maxX, lng);
                minY = Math.min(minY, lat);
                maxY = Math.max(maxY, lat);
            });
        });
    });

    if (!isFinite(minX) || !isFinite(minY)) return;

    var centerLat = (minY + maxY) / 2;
    var cosLat = Math.cos(centerLat * Math.PI / 180);
    if (cosLat < 0.01) cosLat = 0.01;
    var cosLatSafe = cosLat;

    var rangeX = (maxX - minX) * cosLat;
    var rangeY = maxY - minY;
    var padding = 40;

    var scaleX = (canvas.width - padding * 2) / rangeX;
    var scaleY = (canvas.height - padding * 2) / rangeY;
    var scale = Math.min(scaleX, scaleY);

    var offsetX = (canvas.width - rangeX * scale) / 2;
    var offsetY = (canvas.height - rangeY * scale) / 2;

    function toCanvas(lng, lat) {
        return [
            offsetX + (lng - minX) * cosLat * scale,
            canvas.height - offsetY - (lat - minY) * scale
        ];
    }

    quizRegions.forEach(function(r) {
        r.boundaries.forEach(function(b) {
            ctx.beginPath();
            b.forEach(function(p, i) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                var pt = toCanvas(lng, lat);
                if (i === 0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            });
            ctx.closePath();
            ctx.strokeStyle = r.borderColor || '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            var op = (r.fillOpacity !== undefined) ? r.fillOpacity : 0.35;
            ctx.fillStyle = quizHexToRgba(r.color, op);
            ctx.fill();
        });
    });

    quizRegions.forEach(function(r) {
        if (!r.center) return;
        if (r.numSize === 0) return;
        if (!r.numText) return;

        var pos = r.numPos || r.center;
        var pt = toCanvas(pos.lng, pos.lat);

        ctx.font = 'bold ' + r.numSize + 'px "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = Math.max(2, r.numSize * 0.15);
        ctx.strokeStyle = '#ffffff';
        ctx.lineJoin = 'round';
        ctx.strokeText(r.numText, pt[0], pt[1]);

        ctx.fillStyle = r.numColor;
        ctx.fillText(r.numText, pt[0], pt[1]);
    });

    var showNames = document.getElementById('quizShowNames');
    if (showNames && showNames.checked) {
        quizRegions.forEach(function(r) {
            if (!r.center) return;
            if (r.nameSize === 0) return;

            var pos = r.namePos || r.center;
            var pt = toCanvas(pos.lng, pos.lat);

            ctx.font = 'bold ' + r.nameSize + 'px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.lineWidth = Math.max(2, r.nameSize * 0.15);
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.strokeText(r.name, pt[0], pt[1]);

            ctx.fillStyle = r.nameColor || '#333333';
            ctx.fillText(r.name, pt[0], pt[1]);
        });
    }

    // 记录坐标转换函数供触摸事件用
    canvas._toCanvas = toCanvas;
    canvas._fromCanvas = function(x, y) {
        var lng = minX + (x - offsetX) / (cosLatSafe * scale);
        var lat = minY + ((canvas.height - offsetY) - y) / scale;
        return { lng: lng, lat: lat };
    };
    canvas._bounds = {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY,
        cosLatSafe: cosLatSafe,
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY
    };

    // 绑定触摸拖动
    quizBindMobileDrag(canvas);
}

// 手机端拖动数字标签和名称标签
function quizBindMobileDrag(canvas) {
    var dragging = null;
    var dragType = null;
    var dragStartLngLat = null;
    var dragStartPoint = null;
    var dragStartPixel = null;

    function findNearestLabel(x, y) {
        var best = null;
        var bestDist = 50;
        var showNames = document.getElementById('quizShowNames');
        var namesVisible = showNames && showNames.checked;

        quizRegions.forEach(function(r) {
            if (!r.center) return;
            if (!canvas._toCanvas) return;

            // 检查数字标签
            if (r.numSize !== 0 && r.numText) {
                var numPos = r.numPos || r.center;
                var npt = canvas._toCanvas(numPos.lng, numPos.lat);
                var ndx = npt[0] - x;
                var ndy = npt[1] - y;
                var nd = Math.sqrt(ndx * ndx + ndy * ndy);
                if (nd < bestDist) {
                    bestDist = nd;
                    best = r;
                    dragType = 'num';
                }
            }

            // 检查名称标签
            if (namesVisible && r.nameSize !== 0) {
                var namePos = r.namePos || r.center;
                var mpt = canvas._toCanvas(namePos.lng, namePos.lat);
                var mdx = mpt[0] - x;
                var mdy = mpt[1] - y;
                var md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < bestDist) {
                    bestDist = md;
                    best = r;
                    dragType = 'name';
                }
            }
        });
        return best;
    }

    canvas.style.pointerEvents = 'auto';

    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.touches[0].clientX - rect.left;
        var y = e.touches[0].clientY - rect.top;

        dragType = null;
        var r = findNearestLabel(x, y);
        if (r && dragType) {
            dragging = r;

            // 记录按下时的标签经纬度（作为拖动基准）
            var currentPos = dragType === 'name'
                ? (r.namePos || r.center)
                : (r.numPos || r.center);
            dragStartLngLat = { lng: currentPos.lng, lat: currentPos.lat };

            // 记录按下时的触摸点（canvas 像素坐标）
            dragStartPoint = { x: x, y: y };

            // 记录按下时的标签像素位置，用于增量换算
            dragStartPixel = canvas._toCanvas(currentPos.lng, currentPos.lat);
        }
    });

    canvas.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        e.preventDefault();
        var rect = canvas.getBoundingClientRect();
        var x = e.touches[0].clientX - rect.left;
        var y = e.touches[0].clientY - rect.top;

        // 用增量换算：当前触摸点的像素 - 按下时触摸点的像素
        // 再加到按下时标签的像素位置上，得到目标像素
        var targetPx = dragStartPixel[0] + (x - dragStartPoint.x);
        var targetPy = dragStartPixel[1] + (y - dragStartPoint.y);

        var pos = canvas._fromCanvas(targetPx, targetPy);

        if (dragType === 'name') {
            dragging.namePos = { lng: pos.lng, lat: pos.lat };
        } else {
            dragging.numPos = { lng: pos.lng, lat: pos.lat };
        }
        quizRenderMobileCanvas();
    });

    canvas.addEventListener('touchend', function() {
        dragging = null;
        dragType = null;
        dragStartLngLat = null;
        dragStartPoint = null;
        dragStartPixel = null;
    });
}

function quizRenderList() {
    var list = document.getElementById('quizRegionList');
    list.innerHTML = '';

    quizRegions.forEach(function(r, i) {
        // 外层容器
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom:6px;background:#f5f5f5;border-radius:6px;padding:6px;';

        // 第一行：区县名
        var nameRow = document.createElement('div');
        nameRow.style.cssText = 'display:flex;align-items:center;justify-content:flex-start;gap:6px;font-size:12px;font-weight:bold;color:#333;margin-bottom:6px;';

        var nameText = document.createElement('div');
        nameText.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameText.textContent = r.name;
        nameText.title = r.name;
        nameRow.appendChild(nameText);

        var btnRemove = document.createElement('button');
        btnRemove.textContent = '✕';
        btnRemove.title = '删除';
        btnRemove.style.cssText = 'flex-shrink:0;padding:2px 8px;border:none;border-radius:4px;background:#ef4444;color:white;cursor:pointer;font-size:11px;';
        btnRemove.addEventListener('click', function() {
            quizRemoveRegion(i);
        });
        nameRow.appendChild(btnRemove);

        wrapper.appendChild(nameRow);

        // 第二行：控件
        var item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;flex-wrap:wrap;';

        // ===== 区域颜色组：填充 + 边框 + 透明度 =====
        var groupColor = document.createElement('div');
        groupColor.style.cssText = 'display:flex;align-items:center;gap:4px;padding-right:8px;';

        var swatchFill = document.createElement('input');
        swatchFill.type = 'color';
        swatchFill.value = r.color;
        swatchFill.title = '填充色';
        swatchFill.style.cssText = 'width:20px;height:20px;border-radius:4px;border:1px solid #ccc;cursor:pointer;';
        swatchFill.addEventListener('input', function() {
            r.color = this.value;
            r.polygon.forEach(function(p) { p.setOptions({ fillColor: r.color }); });
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupColor.appendChild(swatchFill);

        var swatchBorder = document.createElement('input');
        swatchBorder.type = 'color';
        swatchBorder.value = r.borderColor;
        swatchBorder.title = '边框色';
        swatchBorder.style.cssText = 'width:20px;height:20px;border-radius:4px;border:1px solid #ccc;cursor:pointer;';
        swatchBorder.addEventListener('input', function() {
            r.borderColor = this.value;
            r.polygon.forEach(function(p) { p.setOptions({ strokeColor: r.borderColor }); });
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupColor.appendChild(swatchBorder);

        var opacityInput = document.createElement('input');
        opacityInput.type = 'number';
        opacityInput.min = '0';
        opacityInput.max = '100';
        opacityInput.value = (r.fillOpacity !== undefined) ? Math.round(r.fillOpacity * 100) : 35;
        opacityInput.title = '填充透明度（0-100）';
        opacityInput.style.cssText = 'width:30px;padding:2px 0;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;';
        opacityInput.addEventListener('input', function() {
            var v = parseInt(this.value);
            if (!isFinite(v) || v < 0) return;
            if (v > 100) v = 100;
            r.fillOpacity = v / 100;
            r.polygon.forEach(function(p) { p.setOptions({ fillOpacity: r.fillOpacity }); });
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupColor.appendChild(opacityInput);

        item.appendChild(groupColor);

        // 分隔线 1：颜色组 | 名称组
        var divider1 = document.createElement('div');
        divider1.style.cssText = 'flex:0 0 2px;height:20px;background:#999;border-radius:1px;';
        item.appendChild(divider1);

        // ===== 名称组：名称颜色 + 名称字号 =====
        var groupName = document.createElement('div');
        groupName.style.cssText = 'display:flex;align-items:center;gap:4px;padding-right:8px;';

        var nameColor = document.createElement('input');
        nameColor.type = 'color';
        nameColor.value = r.nameColor || '#333333';
        nameColor.title = '名称颜色';
        nameColor.style.cssText = 'width:20px;height:20px;border-radius:4px;border:1px solid #ccc;cursor:pointer;';
        nameColor.addEventListener('input', function() {
            r.nameColor = this.value;
            if (r.nameLabel) r.nameLabel.setStyle({ 'color': r.nameColor });
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupName.appendChild(nameColor);

        var nameSize = document.createElement('input');
        nameSize.type = 'number';
        nameSize.min = '0';
        nameSize.value = (r.nameSize !== undefined) ? r.nameSize : 14;
        nameSize.title = '名称字号（0 隐藏名称）';
        nameSize.style.cssText = 'width:30px;padding:2px 0;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;';
        nameSize.addEventListener('input', function() {
            var v = parseInt(this.value);
            if (!isFinite(v) || v < 0) return;
            r.nameSize = v;
            if (r.nameLabel) {
                if (v === 0) r.nameLabel.hide();
                else {
                    r.nameLabel.setStyle({ 'font-size': v + 'px' });
                    var showNamesEl = document.getElementById('quizShowNames');
                    if (showNamesEl && showNamesEl.checked) r.nameLabel.show();
                }
            }
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupName.appendChild(nameSize);

        item.appendChild(groupName);

        // 分隔线 2：名称组 | 数字组
        var divider2 = document.createElement('div');
        divider2.style.cssText = 'flex:0 0 2px;height:20px;background:#999;border-radius:1px;';
        item.appendChild(divider2);

        // ===== 数字组：内容 + 颜色 + 字号 =====
        var groupNum = document.createElement('div');
        groupNum.style.cssText = 'display:flex;align-items:center;gap:4px;';

        var numInput = document.createElement('input');
        numInput.type = 'text';
        numInput.value = r.numText;
        numInput.title = '数字内容';
        numInput.style.cssText = 'width:30px;padding:2px 0;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;';
        numInput.addEventListener('input', function() {
            r.numText = this.value;
            if (r.numLabel) r.numLabel.setText(this.value);
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupNum.appendChild(numInput);

        var numColor = document.createElement('input');
        numColor.type = 'color';
        numColor.value = r.numColor;
        numColor.title = '数字颜色';
        numColor.style.cssText = 'width:20px;height:20px;border-radius:4px;border:1px solid #ccc;cursor:pointer;';
        numColor.addEventListener('input', function() {
            r.numColor = this.value;
            if (r.numLabel) r.numLabel.setStyle({ 'color': r.numColor });
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupNum.appendChild(numColor);

        var numSize = document.createElement('input');
        numSize.type = 'number';
        numSize.min = '0';
        numSize.value = r.numSize;
        numSize.title = '数字字号（0 隐藏数字）';
        numSize.style.cssText = 'width:30px;padding:2px 0;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:center;';
        numSize.addEventListener('input', function() {
            var v = parseInt(this.value);
            if (!isFinite(v) || v < 0) return;
            r.numSize = v;
            if (r.numLabel) {
                if (v === 0) r.numLabel.hide();
                else { r.numLabel.show(); r.numLabel.setStyle({ 'font-size': v + 'px' }); }
            }
            if (window.innerWidth <= 768) quizRenderMobileCanvas();
        });
        groupNum.appendChild(numSize);

        item.appendChild(groupNum);

        wrapper.appendChild(item);
        list.appendChild(wrapper);
    });
}

function quizRemoveRegion(index) {
    var r = quizRegions[index];
    if (!r) return;
    r.polygon.forEach(function(p) { p.setMap(null); });
    if (r.numLabel) r.numLabel.setMap(null);
    if (r.nameLabel) r.nameLabel.setMap(null);
    quizRegions.splice(index, 1);

    if (window.innerWidth <= 768) {
        quizRenderMobileCanvas();
    }

    quizRenderList();
}

function quizClearAll() {
    if (!confirm('确定清空所有区域？')) return;
    quizRegions.forEach(function(r) {
        r.polygon.forEach(function(p) { p.setMap(null); });
        if (r.numLabel) r.numLabel.setMap(null);
        if (r.nameLabel) r.nameLabel.setMap(null);
    });
    quizRegions = [];

    if (window.innerWidth <= 768) {
        var mc = document.getElementById('quizCanvas');
        if (mc) mc.remove();
    }

    quizRenderList();
}

function quizRenderCanvas() {
    if (quizRegions.length === 0) {
        return null;
    }

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    quizRegions.forEach(function(r) {
        r.boundaries.forEach(function(b) {
            b.forEach(function(p) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                minX = Math.min(minX, lng);
                maxX = Math.max(maxX, lng);
                minY = Math.min(minY, lat);
                maxY = Math.max(maxY, lat);
            });
        });
        if (r.numLabel) {
            var pos = r.numLabel.getPosition();
            if (pos) {
                minX = Math.min(minX, pos.lng);
                maxX = Math.max(maxX, pos.lng);
                minY = Math.min(minY, pos.lat);
                maxY = Math.max(maxY, pos.lat);
            }
        }
    });

    if (!isFinite(minX) || !isFinite(minY)) {
        alert('无可保存内容');
        return;
    }

    // 修正经纬度比例：按中心纬度的 cos 值归一化经度，避免纵向拉伸
    var centerLat = (minY + maxY) / 2;
    var cosLat = Math.cos(centerLat * Math.PI / 180);
    if (cosLat < 0.01) cosLat = 0.01;

    // 归一化后：经度方向按 cosLat 压缩
    var rangeX = (maxX - minX) * cosLat;
    var rangeY = maxY - minY;
    var maxSide = 1600;
    var padding = 60;

    var scale = (rangeX >= rangeY)
        ? (maxSide - padding * 2) / rangeX
        : (maxSide - padding * 2) / rangeY;

    var canvasW = Math.ceil(rangeX * scale + padding * 2);
    var canvasH = Math.ceil(rangeY * scale + padding * 2);

    function toCanvas(lng, lat) {
        return [
            padding + (lng - minX) * cosLat * scale,
            padding + (maxY - lat) * scale
        ];
    }

    var canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    quizRegions.forEach(function(r) {
        r.boundaries.forEach(function(b) {
            ctx.beginPath();
            b.forEach(function(p, i) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                var pt = toCanvas(lng, lat);
                if (i === 0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            });
            ctx.closePath();
            ctx.strokeStyle = r.borderColor || '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            var op = (r.fillOpacity !== undefined) ? r.fillOpacity : 0.35;
            ctx.fillStyle = quizHexToRgba(r.color, op);
            ctx.fill();
        });
    });

    quizRegions.forEach(function(r) {
        if (!r.numText) return;
        if (r.numSize === 0) return;

        var pos = null;
        if (r.numPos) {
            pos = r.numPos;
        } else if (r.numLabel) {
            pos = r.numLabel.getPosition();
        } else if (r.center) {
            pos = r.center;
        }
        if (!pos) return;

        var pt = toCanvas(pos.lng, pos.lat);

        var canvasFontSize = r.numSize || 24;

        ctx.font = 'bold ' + canvasFontSize + 'px "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = Math.max(2, canvasFontSize * 0.15);
        ctx.strokeStyle = '#ffffff';
        ctx.lineJoin = 'round';
        ctx.strokeText(r.numText, pt[0], pt[1]);

        ctx.fillStyle = r.numColor;
        ctx.fillText(r.numText, pt[0], pt[1]);
    });

    // 区县名称
    var showNames = document.getElementById('quizShowNames').checked;
    if (showNames) {
        var nameBaseSizeEl = document.getElementById('quizNameFontSize');
        var nameBaseSize = nameBaseSizeEl ? parseInt(nameBaseSizeEl.value) : 14;
        if (!isFinite(nameBaseSize) || nameBaseSize < 0) nameBaseSize = 14;

        quizRegions.forEach(function(r) {
            var pos = null;
            if (r.namePos) {
                pos = r.namePos;
            } else if (r.nameLabel) {
                pos = r.nameLabel.getPosition();
            } else if (r.center) {
                pos = r.center;
            }
            if (!pos) return;
            var pt = toCanvas(pos.lng, pos.lat);
            var perSize = (r.nameSize !== undefined) ? r.nameSize : nameBaseSize;
            if (perSize === 0) return;
            var canvasNameSize = perSize;
            if (canvasNameSize < 1) canvasNameSize = 1;

            ctx.font = 'bold ' + canvasNameSize + 'px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.lineWidth = Math.max(1.5, canvasNameSize * 0.15);
            ctx.strokeStyle = '#ffffff';
            ctx.lineJoin = 'round';
            ctx.strokeText(r.name, pt[0], pt[1]);

            // 优先用区域自己的名称颜色
            ctx.fillStyle = r.nameColor || '#333333';
            ctx.fillText(r.name, pt[0], pt[1]);
        });
    }

    // 文字标注（左上角）
    var textContent = (document.getElementById('quizTextContent').value || '').trim();
    if (textContent) {
        var textFontSize = parseInt(document.getElementById('quizTextFontSize').value);
        if (!isFinite(textFontSize) || textFontSize < 0) textFontSize = 24;
        var textColor = document.getElementById('quizTextColor').value;

        var canvasTextSize = textFontSize;
        if (canvasTextSize >= 1) {
            var lines = textContent.split('\n');
            var lineHeight = canvasTextSize * 1.3;

            ctx.font = 'bold ' + canvasTextSize + 'px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = textColor;

            var textX = 10;
            var textY = 10;

            lines.forEach(function(line, i) {
                ctx.fillText(line, textX, textY + i * lineHeight);
            });
        }
    }

    return canvas;
}

function quizSaveImage() {
    var canvas = quizRenderCanvas();
    if (!canvas) {
        alert('请先添加区域');
        return;
    }

    var link = document.createElement('a');
    var ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = '出题_' + ts + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function quizPreviewImage() {
    var canvas = quizRenderCanvas();
    if (!canvas) {
        alert('请先添加区域');
        return;
    }

    // 遮罩
    var overlay = document.createElement('div');
    overlay.id = 'quizPreviewOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100000;display:flex;align-items:center;justify-content:center;';

    // 预览容器
    var box = document.createElement('div');
    box.style.cssText = 'background:white;padding:16px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);max-width:90vw;max-height:90vh;overflow:auto;position:relative;';

    // 关闭按钮
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;width:32px;height:32px;border:none;border-radius:50%;background:#ef4444;color:white;cursor:pointer;font-size:16px;';
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    box.appendChild(closeBtn);

    // 图片
    var img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.cssText = 'max-width:85vw;max-height:80vh;display:block;border:1px solid #eee;';
    box.appendChild(img);

    // 尺寸提示
    var info = document.createElement('div');
    info.style.cssText = 'text-align:center;font-size:12px;color:#666;margin-top:8px;';
    info.textContent = '尺寸：' + canvas.width + ' × ' + canvas.height + ' px';
    box.appendChild(info);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // 点遮罩关闭
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

function quizHexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(function(c) { return c + c; }).join('');
    }
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
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
    // 清除出题模式痕迹
    if (typeof quizCleanup === 'function') quizCleanup();

    lastLoadRequest = null;

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

function toggleDailyPanel() {
    const content = document.getElementById('dailyContent');
    const btn = document.getElementById('toggleDailyBtn');

    if (!content || !btn) return;

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

// ==================== 头像系统（区域版图） ====================
var currentAvatarImage = localStorage.getItem('avatarImage') || '';   // dataURL
var pendingAvatarImage = '';   // 预览中的

function avatarImgHtml(dataUrl) {
    if (!dataUrl) return '👤';
    return '<img src="' + dataUrl + '" style="width:28px;height:28px;border-radius:50%;vertical-align:middle;margin-right:3px;object-fit:cover;border:1px solid #ddd;">';
}

function applyAvatar() {
    var el = document.getElementById('homeAvatarDisplay');
    if (!el) return;
    if (currentAvatarImage) {
        el.innerHTML = '<img src="' + currentAvatarImage + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
    } else {
        el.innerHTML = '<span style="color:#999;font-size:13px;">点头像</span>';
    }
}

function openAvatarPopup() {
    pendingAvatarImage = '';
    document.getElementById('avatarSearchInput').value = '';
    document.getElementById('avatarSearchMsg').textContent = '';
    // 预览当前头像
    var preview = document.getElementById('avatarPreview');
    if (currentAvatarImage) {
        preview.innerHTML = '<img src="' + currentAvatarImage + '" style="width:100%;height:100%;object-fit:cover;">';
    } else {
        preview.innerHTML = '<span style="color:#999;font-size:13px;">暂无</span>';
    }

    var popup = document.getElementById('avatarPopup');
    popup.style.display = 'block';
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    // 强制回流
    void popup.offsetWidth;
    popup.style.opacity = '1';
}

function closeAvatarPopup() {
    var popup = document.getElementById('avatarPopup');
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(function () {
        popup.style.display = 'none';
        popup.style.opacity = '';
        popup.style.transition = '';
    }, 250);
}

// 压缩版：转成 64×64 的 JPEG，减小 localStorage 占用
function makeAvatarFromDistrict(district) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, 512, 512);

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    district.boundaries.forEach(function (b) {
        b.forEach(function (p) {
            var lng = p.lng !== undefined ? p.lng : p[0];
            var lat = p.lat !== undefined ? p.lat : p[1];
            minX = Math.min(minX, lng); maxX = Math.max(maxX, lng);
            minY = Math.min(minY, lat); maxY = Math.max(maxY, lat);
        });
    });

    var pad = 40;
    var centerLat = (minY + maxY) / 2;
    var cosLat = Math.cos(centerLat * Math.PI / 180);
    if (cosLat < 0.01) cosLat = 0.01;
    var rangeX = (maxX - minX) * cosLat;
    var rangeY = maxY - minY;
    var scale = Math.min((512 - pad * 2) / rangeX, (512 - pad * 2) / rangeY);
    var ox = (512 - rangeX * scale) / 2;
    var oy = (512 - rangeY * scale) / 2;

    function toXY(lng, lat) {
        return [ox + (lng - minX) * cosLat * scale, 512 - oy - (lat - minY) * scale];
    }

    district.boundaries.forEach(function (b) {
        ctx.beginPath();
        b.forEach(function (p, i) {
            var lng = p.lng !== undefined ? p.lng : p[0];
            var lat = p.lat !== undefined ? p.lat : p[1];
            var pt = toXY(lng, lat);
            i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]);
        });
        ctx.closePath();
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,68,68,0.15)';
        ctx.fill();
    });

    // 输出 256×256 PNG，兼顾清晰度和存储
    var small = document.createElement('canvas');
    small.width = 256;
    small.height = 256;
    var sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(canvas, 0, 0, 256, 256);
    return small.toDataURL('image/jpeg', 0.92);
}

let findDifferentMode = false;
let findDifferentAnswer = null;
let findDifferentLevel = 'district';

// ==================== 找政府驻地 ====================
let govSeatMode = false;
let govSeatCity = null;          // 当前题目：地级行政区名，如"唐山市"
let govSeatSeats = null;         // GOV_SEATS[govSeatCity]
let govSeatStage = 1;            // 1=选市政府, 2=选省政府
let govSeatAnswer = null;        // 当前阶段的正确答案（规范名）
let govSeatCombo = 0;
let govSeatScore = 0;
let govSeatLocked = false;       // 判定后锁定，防连点
let govSeatPolygons = [];        // 电脑端：每块 {name, polygons}
let govSeatBoundaries = [];      // 手机端：每块 {name, boundaries}
let govSeatCanvas = null;        // 手机端 canvas
let govSeatLoadSeq = 0;
let govSeatCityCache = {};     // 市名 → { adcode, subs: [...] }
let govSeatDistrictCache = {}; // adcode → boundaries

var avatarSearchLock = false;

function searchAvatarDistrict() {
    var raw = document.getElementById('avatarSearchInput').value.trim();
    if (!raw) return;
    if (avatarSearchLock) return;

    avatarSearchLock = true;
    document.getElementById('avatarSearchMsg').textContent = '搜索中...';

    // 复用看图猜区县的 loadDistrict 逻辑，通过拦截器拿结果
    window._avatarIntercept = function (district) {
        avatarSearchLock = false;
        if (!district || !district.boundaries || district.boundaries.length === 0) {
            document.getElementById('avatarSearchMsg').textContent = '❌ 该区域无边界';
            return;
        }
        pendingAvatarImage = makeAvatarFromDistrict(district);
        document.getElementById('avatarPreview').innerHTML = '<img src="' + pendingAvatarImage + '" style="width:100%;height:100%;object-fit:cover;">';
        document.getElementById('avatarSearchMsg').textContent = '✅ ' + district.name + '，点「设为头像」';
    };

    loadDistrict(raw, true);

    // 兜底：loadDistrict 内部 showDistrict 会调用拦截器；
    // 若 3 秒后仍未回调（加载失败/无边界），解锁并提示
    setTimeout(function () {
        if (avatarSearchLock) {
            window._avatarIntercept = null;
            avatarSearchLock = false;
            document.getElementById('avatarSearchMsg').textContent = '❌ 没找到';
        }
    }, 3000);
}

// 判断行政区是否沿海
function isCoastal(name) {
    if (COASTAL_PROVINCES.indexOf(name) !== -1) return true;
    if (COASTAL_CITIES.indexOf(name) !== -1) return true;
    if (COASTAL_COUNTIES.has(name)) return true;
    return false;
}

// 找不同：连击、分数、最高分
var findDiffCombo = 0;
var findDiffScore = 0;

function getFindDiffBestKey(type) {
    return 'findDiffBest_' + type;   // type: 'city' 或 'mixed'
}
function getFindDiffBest(type) {
    return Number(localStorage.getItem(getFindDiffBestKey(type)) || '0');
}
function saveFindDiffBest(type, score) {
    var best = getFindDiffBest(type);
    if (score > best) localStorage.setItem(getFindDiffBestKey(type), String(score));
}

// 行政区名 → 省名
function getNameProvince(name) {
    // 省级
    var provNames = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区'];
    if (provNames.indexOf(name) !== -1) return name;
    // 地级
    var code = getCityCode(name);
    if (code) {
        var map = {
            '11':'北京市','12':'天津市','13':'河北省','14':'山西省','15':'内蒙古自治区',
            '21':'辽宁省','22':'吉林省','23':'黑龙江省','31':'上海市',
            '32':'江苏省','33':'浙江省','34':'安徽省','35':'福建省','36':'江西省','37':'山东省',
            '41':'河南省','42':'湖北省','43':'湖南省','44':'广东省','45':'广西壮族自治区','46':'海南省',
            '50':'重庆市','51':'四川省','52':'贵州省','53':'云南省','54':'西藏自治区',
            '61':'陕西省','62':'甘肃省','63':'青海省','64':'宁夏回族自治区','65':'新疆维吾尔自治区',
            '81':'香港特别行政区','82':'澳门特别行政区'
        };
        return map[code.substring(0, 2)] || '';
    }
    // 区县
    if (typeof DISTRICT_INFO !== 'undefined' && DISTRICT_INFO[name]) {
        return DISTRICT_INFO[name].province || '';
    }
    return '';
}

// 顶部连击条
function updateFindDiffHUD(type, panel) {
    var hud = panel.querySelector('#findDiffHUD');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'findDiffHUD';
        hud.style.cssText = 'display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #eee;';
        panel.insertBefore(hud, panel.firstChild);
    }
    hud.innerHTML = '<span>🔥 连击: <b style="color:#ef4444;">' + findDiffCombo + '</b></span>'
        + '<span>⭐ 得分: <b style="color:#4a6cf7;">' + findDiffScore + '</b></span>'
        + '<span>🏆 最高: <b style="color:#f59e0b;">' + getFindDiffBest(type) + '</b></span>';
}

function openMiniGames() {
    playSound('click');
    if (typeof quizCleanup === 'function') quizCleanup();
    dailyMode = false;

    // 清掉找政府驻地残留
    govSeatMode = false;
    govSeatLoadSeq++;
    (function () {
        var gp = document.getElementById('govSeatFloatPanel');
        if (gp) gp.remove();
        var gc = document.getElementById('govSeatCanvas');
        if (gc) gc.remove();
        var gh = document.getElementById('govSeatHUD');
        if (gh) gh.remove();
    })();
    if (timerMode) {
        toggleTimer();
    }
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';

    // 隐藏重新加载地图按钮
    var rb = document.getElementById('reloadBtn');
    if (rb) {
        rb.style.visibility = 'hidden';
        rb.style.opacity = '0';
    }

    const miniPanel = document.getElementById('miniGamesPanel');
    miniPanel.style.display = 'block';
    // 添加弹入动画
    miniPanel.classList.remove('pop-in');
    void miniPanel.offsetWidth; // 强制回流
    miniPanel.classList.add('pop-in');
}

// ==================== 找政府驻地：入口 ====================

function openGovSeatPanel() {
    playSound('click');
    if (typeof quizCleanup === 'function') quizCleanup();
    dailyMode = false;
    findDifferentMode = false;
    if (timerMode) {
        timerMode = false;
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        document.getElementById('btnTimer').classList.remove('active');
        document.getElementById('timerDisplay').style.display = 'none';
    }
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';

    var rb = document.getElementById('reloadBtn');
    if (rb) { rb.style.visibility = 'hidden'; rb.style.opacity = '0'; }

    var miniPanel = document.getElementById('miniGamesPanel');
    if (miniPanel) {
        miniPanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        miniPanel.style.opacity = '0';
        miniPanel.style.transform = 'translate(-50%, -50%) scale(0.85)';
        setTimeout(function () {
            miniPanel.style.display = 'none';
            miniPanel.style.opacity = '';
            miniPanel.style.transform = '';
            miniPanel.style.transition = '';
        }, 300);
    }

    // 等小游戏面板淡出后再开局
    setTimeout(function () {
        startGovSeat();
    }, 320);
}

function startGovSeat() {
    govSeatMode = true;
    govSeatCombo = 0;
    govSeatScore = 0;
    govSeatLocked = false;

    // 隐藏主面板、禁用主游戏输入
    document.getElementById('panel').style.display = 'none';
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('newBtn').disabled = true;
    document.getElementById('hint').style.pointerEvents = 'none';

    generateGovSeatQuestion();
}

// ==================== 找政府驻地：出题 ====================

function generateGovSeatQuestion() {
    if (!govSeatMode) return;
    govSeatLocked = true;   // 抽题/加载期间锁死，加载完在 finishIfDone 里解锁
    govSeatStage = 1;

    // 从 GOV_SEATS 随机抽一个（排除和上一题重复）
    var keys = Object.keys(GOV_SEATS);
    var pick = null;
    for (var i = 0; i < 30; i++) {
        pick = keys[Math.floor(Math.random() * keys.length)];
        if (pick !== govSeatCity) break;
    }
    govSeatCity = pick;
    govSeatSeats = GOV_SEATS[pick];

    // 加载该市 + 下辖区县边界
    loadGovSeatMap(govSeatCity, function (err, districts) {
        if (!govSeatMode) return;
        if (err || !districts || districts.length === 0) {
            // 加载失败，换一题
            setTimeout(generateGovSeatQuestion, 300);
            return;
        }
        // 已经在 appendGovSeatDistrict 里边加载边画了，这里不用再渲染
    });
}

// 把高德返回的纯区县名转成 data.js 规范名
// 重名区（ADJACENCY 里有 "xx（市名）"）用带括号名；否则用原名
function normalizeGovSeatName(name, cityName) {
    if (typeof ADJACENCY === 'undefined') return name;

    // 1. 如果这个市本身就带"市"字结尾，拼括号要处理
    //    例：cityName="福州市" → "鼓楼区（福州市）"
    var withParen = name + '（' + cityName + '）';
    if (ADJACENCY[withParen]) return withParen;

    // 2. 有些市名在 GOV_SEATS 里是简称（如"大兴安岭地区"），试原名
    if (ADJACENCY[name]) return name;

    // 3. 都找不到，用原名
    return name;
}

// 加载某市下辖所有区县的边界（照抄经典模式 loadNeighborDistricts 的结构）
function loadGovSeatMap(cityName, callback) {
    var mySeq = ++govSeatLoadSeq;

    function done(err, list) {
        if (mySeq !== govSeatLoadSeq) return;
        govSeatLocked = false;   // 无论哪条路，最终都解锁
        callback(err, list);
    }

    if (!ds || !dsCity) {
        setTimeout(function () {
            if (mySeq !== govSeatLoadSeq) return;
            loadGovSeatMap(cityName, callback);
        }, 400);
        return;
    }

    // 直辖市特殊处理：高德下钻拿不到区，改用 DISTRICT_INFO 列表逐个搜
    var directCities = ['北京市', '天津市', '上海市', '重庆市'];
    if (directCities.indexOf(cityName) !== -1) {
        loadGovSeatDirectCity(cityName, done);
        return;
    }

    // 缓存命中：直接用
    if (govSeatCityCache[cityName]) {
        var cached = govSeatCityCache[cityName];
        renderGovSeatFromCache(cached);
        done(null, cached.districts);
        return;
    }

    // 1. 搜该市拿 adcode
    ds.search(cityName, function (status, result) {
        if (mySeq !== govSeatLoadSeq) return;
        if (status !== 'complete' || !result.districtList || result.districtList.length === 0) {
            done('city search failed', null);
            return;
        }
        var cityAdcode = result.districtList[0].adcode;

        // 2. 按 adcode 搜，拿子级列表
        ds.search(cityAdcode, function (s2, r2) {
            if (mySeq !== govSeatLoadSeq) return;
            if (s2 !== 'complete' || !r2.districtList || r2.districtList.length === 0) {
                done('city adcode search failed', null);
                return;
            }
            var cityFull = r2.districtList[0];
            var subs = (cityFull.districtList || []).filter(function (d) {
                return d.level === 'district' && d.adcode;
            });

            // 无下辖：用自己的边界
            if (subs.length === 0) {
                if (cityFull.boundaries && cityFull.boundaries.length > 0) {
                    done(null, [{ name: cityName, adcode: cityAdcode, boundaries: cityFull.boundaries }]);
                } else {
                    done('no boundaries', null);
                }
                return;
            }

            // 3. 逐个加载，每加载一个就画一块（边加载边画）
            var out = [];
            var finishedCount = 0;
            var total = subs.length;

            // 加载期间锁定点击
            govSeatLocked = true;

            // 准备渲染容器
            prepareGovSeatRender();

            function finishIfDone() {
                finishedCount++;
                if (finishedCount >= total) {
                    govSeatLocked = false;
                    finalizeGovSeatRender();
                    govSeatCityCache[cityName] = { subs: subs, districts: out.slice() };
                    done(null, out);
                }
            }

            function loadOne(d, retry) {
                var thisDone = false;

                var timeout = setTimeout(function () {
                    if (thisDone) return;
                    thisDone = true;
                    if (retry > 0) {
                        loadOne(d, retry - 1);
                    } else {
                        finishIfDone();
                    }
                }, 1000);

                // 区县边界缓存命中
                if (govSeatDistrictCache[d.adcode]) {
                    clearTimeout(timeout);
                    var cachedB = govSeatDistrictCache[d.adcode];
                    if (cachedB && cachedB.boundaries && cachedB.boundaries.length > 0) {
                        var itemC = { name: normalizeGovSeatName(d.name, govSeatCity), adcode: d.adcode, boundaries: cachedB.boundaries };
                        out.push(itemC);
                        appendGovSeatDistrict(itemC);
                    }
                    thisDone = true;
                    finishIfDone();
                    return;
                }

                ds.search(d.adcode, function (s3, r3) {
                    if (thisDone) return;
                    thisDone = true;
                    clearTimeout(timeout);
                    if (mySeq !== govSeatLoadSeq) return;

                    if (s3 === 'complete' && r3.districtList && r3.districtList.length > 0) {
                        var nd0 = r3.districtList.find(function (x) { return x.level === 'district'; }) || r3.districtList[0];
                        if (nd0 && nd0.boundaries && nd0.boundaries.length > 0) {
                            govSeatDistrictCache[d.adcode] = { boundaries: nd0.boundaries };
                        }
                        var nd = r3.districtList.find(function (x) { return x.level === 'district'; }) || r3.districtList[0];
                        if (nd && nd.boundaries && nd.boundaries.length > 0) {
                            // 把高德纯名转成 data.js 规范名（重名区加括号）
                            var normName = normalizeGovSeatName(d.name, govSeatCity);
                            var item = { name: normName, adcode: d.adcode, boundaries: nd.boundaries };
                            out.push(item);
                            appendGovSeatDistrict(item);
                        }
                    }
                    finishIfDone();
                });
            }

            subs.forEach(function (d) {
                loadOne(d, 5);
            });
        });
    });
}

// 直辖市：本地 adcode 列表，逐个搜边界（并发 + 重试 5 次，同经典）
function loadGovSeatDirectCity(cityName, done) {
    var mySeq = govSeatLoadSeq;
    function checkSeq() { return mySeq === govSeatLoadSeq; }

    var list = DIRECT_CITY_ADCODES[cityName];
    if (!list || list.length === 0) {
        done('no list', null);
        return;
    }

    govSeatLocked = true;
    prepareGovSeatRender();

    var out = [];
    var finishedCount = 0;
    var total = list.length;

    function finishOne() {
        finishedCount++;
        if (finishedCount >= total) {
            finalizeGovSeatRender();
            done(null, out);
        }
    }

    function loadOne(item, retry) {
        var normName = item[0];
        var adcode = item[1];
        var thisDone = false;

        var timeout = setTimeout(function () {
            if (thisDone) return;
            thisDone = true;
            if (retry > 0) {
                setTimeout(function () { loadOne(item, retry - 1); }, 400);
            } else {
                finishOne();
            }
        }, 1000);

        ds.search(adcode, function (s, r) {
            if (thisDone) return;
            thisDone = true;
            clearTimeout(timeout);
            if (!checkSeq()) return;

            if (s === 'complete' && r.districtList && r.districtList.length > 0) {
                var d = r.districtList.find(function (x) { return x.level === 'district'; }) || r.districtList[0];
                if (d && d.boundaries && d.boundaries.length > 0) {
                    var it = { name: normName, adcode: adcode, boundaries: d.boundaries };
                    out.push(it);
                    appendGovSeatDistrict(it);
                    finishOne();
                    return;
                }
            }
            if (retry > 0) loadOne(item, retry - 1);
            else finishOne();
        });
    }

    list.forEach(function (item) { loadOne(item, 15); });
}

// 从缓存直接渲染一个市（不进网络）
function renderGovSeatFromCache(cached) {
    prepareGovSeatRender();
    var all = [];
    (cached.subs || []).forEach(function (s) { all.push(s); });
    (cached.districts || []).forEach(function (d) {
        appendGovSeatDistrict(d);
    });
    finalizeGovSeatRender();
    govSeatLocked = false;   // 缓存路径：画完就解锁
}

// 开始渲染前的准备：清掉上一题
function prepareGovSeatRender() {
    _govSeatLastDistricts = [];
    govSeatPolygons.forEach(function (item) {
        item.polygons.forEach(function (p) { try { p.setMap(null); } catch (e) {} });
        if (item.label) { try { item.label.setMap(null); } catch (e) {} }
    });
    govSeatPolygons = [];

    if (window.innerWidth <= 768) {
        govSeatBoundaries = [];
        var gc = document.getElementById('govSeatCanvas');
        if (gc) gc.remove();
    } else {
        if (typeof clearMap === 'function') clearMap();
    }

    // 切到该题的答案 + 显示 HUD
    var target = (govSeatStage === 1) ? govSeatSeats.citySeat : govSeatSeats.provinceSeat;
    govSeatAnswer = target;
    document.getElementById('map').classList.add('visible');
    updateGovSeatHUD();
    setGovSeatHint('⏳ 地图加载中...');

    // 清「下一题」按钮
    var nb = document.getElementById('govSeatNextBtn');
    if (nb) nb.remove();
}

// 增量画一块（电脑端）
function appendGovSeatDistrict(item) {
    if (window.innerWidth <= 768) {
        govSeatBoundaries.push({ name: item.name, boundaries: item.boundaries });
        drawGovSeatCanvas();
        return;
    }
    if (typeof map === 'undefined' || !map) return;

    var polys = item.boundaries.map(function (b) {
        return new AMap.Polygon({
            map: map,
            path: b,
            strokeColor: '#4a6cf7',
            strokeWeight: 2,
            fillColor: '#4a6cf7',
            fillOpacity: 0.15
        });
    });
    polys.forEach(function (p) {
        p.on('click', function () { checkGovSeatAnswer(item.name); });
    });

    govSeatPolygons.push({ name: item.name, polygons: polys, label: null });

    // 视野自适应：把已画的都框进来
    var allPolys = [];
    govSeatPolygons.forEach(function (g) { allPolys = allPolys.concat(g.polygons); });
    if (allPolys.length > 0) {
        map.setFitView(allPolys, null, [60, 60, 60, 60]);
    }
}

// 全部加载完
function finalizeGovSeatRender() {
    if (window.innerWidth <= 768) {
        drawGovSeatCanvas();
    } else {
        var allPolys = [];
        govSeatPolygons.forEach(function (g) { allPolys = allPolys.concat(g.polygons); });
        if (allPolys.length > 0) {
            map.setFitView(allPolys, null, [60, 60, 60, 60]);
        }
    }
    // 加载完成，恢复正常提示
    _govSeatHintText = '';
    setGovSeatHint((govSeatStage === 1) ? '请选出市政府驻地' : '请选出省政府驻地');
}

// ==================== 找政府驻地：渲染 ====================

function renderGovSeat(districts) {
    // districts: [{name, adcode, boundaries}]
    _govSeatLastDistricts = districts;
    var target = (govSeatStage === 1) ? govSeatSeats.citySeat : govSeatSeats.provinceSeat;
    govSeatAnswer = target;
    // 注意：不要在这里清 govSeatPolygons，交给 renderGovSeatPC 清
    // （否则上一题的 polygon 引用会丢，导致清不掉）

    // 清掉上一题的「下一题」按钮
    var nb = document.getElementById('govSeatNextBtn');
    if (nb) nb.remove();

    // 地图可见
    document.getElementById('map').classList.add('visible');

    if (window.innerWidth <= 768) {
        renderGovSeatMobile(districts);
    } else {
        renderGovSeatPC(districts);
    }

    // 更新顶部 HUD 提示
    updateGovSeatHUD();
}

// 电脑端：用 AMap.Polygon
function renderGovSeatPC(districts) {
    if (typeof clearMap === 'function') clearMap();

    // 清掉上一题的政府驻地多边形
    govSeatPolygons.forEach(function (item) {
        item.polygons.forEach(function (p) {
            try { p.setMap(null); } catch (e) {}
        });
    });
    govSeatPolygons = [];

    var allPolygons = [];
    districts.forEach(function (d) {
        var polys = d.boundaries.map(function (b) {
            return new AMap.Polygon({
                map: map,
                path: b,
                strokeColor: '#4a6cf7',
                strokeWeight: 2,
                fillColor: '#4a6cf7',
                fillOpacity: 0.15
            });
        });
        govSeatPolygons.push({ name: d.name, polygons: polys });

        polys.forEach(function (p) {
            p.on('click', function () {
                checkGovSeatAnswer(d.name, p);
            });
        });
        allPolygons = allPolygons.concat(polys);
    });

    if (allPolygons.length > 0) {
        map.setFitView(allPolygons, null, [40, 40, 40, 40]);
    }
}

// 手机端：用 canvas 绘制 + 点击命中
function renderGovSeatMobile(districts) {
    govSeatBoundaries = districts.map(function (d) {
        return { name: d.name, boundaries: d.boundaries };
    });
    drawGovSeatCanvas();
}

function drawGovSeatCanvas(highlightName, highlightType) {
    var old = document.getElementById('govSeatCanvas');
    if (old) old.remove();
    if (govSeatBoundaries.length === 0) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'govSeatCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9998;background:#dfe9f5;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    govSeatCanvas = canvas;

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 计算全局范围
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    govSeatBoundaries.forEach(function (d) {
        d.boundaries.forEach(function (b) {
            b.forEach(function (p) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                minX = Math.min(minX, lng); maxX = Math.max(maxX, lng);
                minY = Math.min(minY, lat); maxY = Math.max(maxY, lat);
            });
        });
    });
    if (!isFinite(minX)) return;

    // 留出顶部 HUD 空间
    var padTop = 130, padOther = 30;
    var centerLat = (minY + maxY) / 2;
    var cosLat = Math.cos(centerLat * Math.PI / 180);
    if (cosLat < 0.01) cosLat = 0.01;
    var rangeX = (maxX - minX) * cosLat;
    var rangeY = maxY - minY;
    var availW = canvas.width - padOther * 2;
    var availH = canvas.height - padTop - padOther;
    var scale = Math.min(availW / rangeX, availH / rangeY);
    var ox = (canvas.width - rangeX * scale) / 2;
    var oy = padTop + (availH - rangeY * scale) / 2;

    function toXY(lng, lat) {
        return [ox + (lng - minX) * cosLat * scale, canvas.height - oy - (lat - minY) * scale];
    }

    // 绘制
    govSeatBoundaries.forEach(function (d) {
        var isHi = (d.name === highlightName);
        var stroke = '#4a6cf7', fill = 'rgba(74,108,247,0.15)', lw = 2;
        if (isHi && highlightType === 'correct') { stroke = '#10b981'; fill = 'rgba(16,185,129,0.4)'; lw = 3; }
        else if (isHi && highlightType === 'wrong') { stroke = '#ef4444'; fill = 'rgba(239,68,68,0.4)'; lw = 3; }

        d.boundaries.forEach(function (b) {
            ctx.beginPath();
            b.forEach(function (p, i) {
                var lng = p.lng !== undefined ? p.lng : p[0];
                var lat = p.lat !== undefined ? p.lat : p[1];
                var pt = toXY(lng, lat);
                if (i === 0) ctx.moveTo(pt[0], pt[1]);
                else ctx.lineTo(pt[0], pt[1]);
            });
            ctx.closePath();
            ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
            ctx.fillStyle = fill; ctx.fill();
        });
    });

    // 记录坐标转换供命中用
    canvas._toXY = toXY;
    canvas._minX = minX; canvas._minY = minY;
    canvas._cosLat = cosLat; canvas._scale = scale;
    canvas._ox = ox; canvas._oy = oy;

    // 点击命中
    canvas.onclick = function (e) {
        if (!govSeatMode || govSeatLocked) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var hit = hitGovSeat(x, y);
        if (hit) checkGovSeatAnswer(hit);
    };
}

// 判断点 (x,y) 落在哪个区县内
function hitGovSeat(x, y) {
    for (var i = 0; i < govSeatBoundaries.length; i++) {
        var d = govSeatBoundaries[i];
        for (var j = 0; j < d.boundaries.length; j++) {
            var b = d.boundaries[j];
            var inside = false;
            for (var k = 0, l = b.length - 1; k < b.length; l = k++) {
                var lng1 = b[k].lng !== undefined ? b[k].lng : b[k][0];
                var lat1 = b[k].lat !== undefined ? b[k].lat : b[k][1];
                var lng2 = b[l].lng !== undefined ? b[l].lng : b[l][0];
                var lat2 = b[l].lat !== undefined ? b[l].lat : b[l][1];
                var p1 = govSeatCanvas._toXY(lng1, lat1);
                var p2 = govSeatCanvas._toXY(lng2, lat2);
                var xi = p1[0], yi = p1[1], xj = p2[0], yj = p2[1];
                var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            if (inside) return d.name;
        }
    }
    return null;
}

function updateGovSeatHUD() {
    var hud = document.getElementById('govSeatHUD');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'govSeatHUD';
        hud.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(255,255,255,0.95);padding:10px 18px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.2);text-align:center;font-size:14px;min-width:260px;';
        document.body.appendChild(hud);
    }

    var stageText = _govSeatHintText || ((govSeatStage === 1) ? '请选出市政府驻地' : '请选出省政府驻地');
    hud.innerHTML =
        '<div style="font-weight:bold;color:#4a6cf7;margin-bottom:4px;">🏛️ ' + govSeatCity + '</div>' +
        '<div id="govSeatHint" style="color:#333;margin-bottom:6px;">' + stageText + '</div>' +
        '<div style="font-size:12px;color:#666;">🔥 连击: <b style="color:#ef4444;">' + govSeatCombo + '</b>' +
        ' &nbsp; ⭐ 得分: <b style="color:#4a6cf7;">' + govSeatScore + '</b>' +
        ' &nbsp; 🏆 最高: <b style="color:#f59e0b;">' + getGovSeatBest() + '</b></div>' +
        '<button id="govSeatExitBtn" style="margin-top:8px;padding:6px 14px;border:none;border-radius:6px;background:#ccc;cursor:pointer;font-size:12px;">退出小游戏</button>';

    var exitBtn = document.getElementById('govSeatExitBtn');
    if (exitBtn) {
        exitBtn.onclick = function () {
            playSound('click');
            var hud2 = document.getElementById('govSeatHUD');
            if (hud2) hud2.remove();
            govSeatMode = false;
            govSeatLoadSeq++;
            var gc = document.getElementById('govSeatCanvas');
            if (gc) gc.remove();
            govSeatPolygons.forEach(function (item) {
                item.polygons.forEach(function (p) {
                    try { p.setMap(null); } catch (e) {}
                });
            });
            govSeatPolygons = [];
            govSeatBoundaries = [];
            if (typeof clearMap === 'function') clearMap();
            closeMiniGames();
        };
    }
}

var _govSeatHintText = '';

function setGovSeatHint(text) {
    _govSeatHintText = text;
    var el = document.getElementById('govSeatHint');
    if (el) el.textContent = text;
}

function getGovSeatBest() {
    return Number(localStorage.getItem('govSeatBest') || '0');
}

// ==================== 找政府驻地：判定 ====================

function checkGovSeatAnswer(name) {
    if (!govSeatMode || govSeatLocked) return;
    govSeatLocked = true;

    var correct = (name === govSeatAnswer);

    if (correct) {
        playSound('correct');
        govSeatCombo++;
        govSeatScore += govSeatCombo;
        if (govSeatScore > getGovSeatBest()) {
            localStorage.setItem('govSeatBest', String(govSeatScore));
        }
        highlightGovSeat(name, 'correct');

        // 延迟切换：市政府→省政府，或结束本题→下一题
        setTimeout(function () {
            if (!govSeatMode) return;
            advanceGovSeat();
        }, 600);
    } else {
        playSound('wrong');
        govSeatCombo = 0;
        highlightGovSeat(name, 'wrong');
        highlightGovSeat(govSeatAnswer, 'correct');

        // 显示“下一题”按钮
        setTimeout(function () {
            if (!govSeatMode) return;
            showGovSeatNextBtn();
        }, 500);
    }
}

// 高亮某块区域（电脑端改 polygon 样式；手机端重绘）
function highlightGovSeat(name, type) {
    if (window.innerWidth <= 768) {
        // 手机端：重绘时按状态上色
        if (typeof drawGovSeatCanvas === 'function') {
            drawGovSeatCanvas(name, type);
        }
        return;
    }

    govSeatPolygons.forEach(function (item) {
        if (item.name === name) {
            item.polygons.forEach(function (p) {
                if (type === 'correct') {
                    p.setOptions({ strokeColor: '#10b981', fillColor: '#10b981', fillOpacity: 0.4, strokeWeight: 3 });
                } else {
                    p.setOptions({ strokeColor: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4, strokeWeight: 3 });
                }
            });
        }
    });
}

// 答对后推进：市政府→省政府，或本题结束→下一题
function advanceGovSeat() {
    govSeatLocked = true;   // 切换期间锁死
    if (!govSeatSeats) { generateGovSeatQuestion(); return; }

    // 有省政府驻地，且当前是第 1 题（市政府）
    if (govSeatSeats.provinceSeat && govSeatStage === 1) {
        govSeatStage = 2;
        govSeatLocked = false;
        govSeatAnswer = govSeatSeats.provinceSeat;
        _govSeatHintText = '';   // 清掉缓存的提示文字
        // 清掉上一阶段的高亮
        govSeatPolygons.forEach(function (item) {
            item.polygons.forEach(function (p) {
                p.setOptions({ strokeColor: '#4a6cf7', fillColor: '#4a6cf7', fillOpacity: 0.15, strokeWeight: 2 });
            });
        });
        updateGovSeatHUD();
        return;
    }

    // 否则：本题结束，出下一题
    generateGovSeatQuestion();
}

// 缓存当前题目的 districts，供切到省政府时重画
var _govSeatLastDistricts = null;
function govSeatStageDistricts() {
    return _govSeatLastDistricts || [];
}

// 显示“下一题”按钮（答错时）
function showGovSeatNextBtn() {
    var hud = document.getElementById('govSeatHUD');
    if (!hud) return;
    var btn = document.getElementById('govSeatNextBtn');
    if (btn) return;

    btn = document.createElement('button');
    btn.id = 'govSeatNextBtn';
    btn.textContent = '下一题 →';
    btn.style.cssText = 'display:block;width:100%;margin-top:8px;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;';
    btn.onclick = function () {
        playSound('click');
        btn.remove();
        // 答错的是市政府题，仍继续省政府题（按你确认的 A）
        advanceGovSeat();
    };
    hud.appendChild(btn);
}

function closeMiniGames() {
    playSound('click');
    findDifferentMode = false;

    // 无条件清理政府驻地残留
    govSeatMode = false;
    govSeatLoadSeq++;
    (function () {
        var gp = document.getElementById('govSeatFloatPanel');
        if (gp) gp.remove();
        var gc = document.getElementById('govSeatCanvas');
        if (gc) gc.remove();
        var gh = document.getElementById('govSeatHUD');
        if (gh) gh.remove();
        govSeatPolygons = [];
        govSeatBoundaries = [];
    })();

    // 移除“找不同”浮动面板
    const floatPanel = document.getElementById('findDifferentFloatPanel');
    if (floatPanel) floatPanel.remove();

    // 退出找政府驻地
    if (govSeatMode) {
        govSeatMode = false;
        govSeatLocked = false;
        govSeatLoadSeq++;
        const gp = document.getElementById('govSeatFloatPanel');
        if (gp) gp.remove();
        const gc = document.getElementById('govSeatCanvas');
        if (gc) gc.remove();
        const gh = document.getElementById('govSeatHUD');
        if (gh) gh.remove();
        govSeatPolygons = [];
        govSeatBoundaries = [];
        if (typeof clearMap === 'function') clearMap();
    }
    const mixedFloat = document.getElementById('mixedFloatPanel');
    if (mixedFloat) mixedFloat.remove();
    const mixedLoading = document.getElementById('mixedLoadingPanel');
    if (mixedLoading) mixedLoading.remove();
    const coastFloat = document.getElementById('coastFloatPanel');
    if (coastFloat) coastFloat.remove();

    const optionsDiv = document.getElementById('findDifferentOptions');
    if (optionsDiv) optionsDiv.remove();

    const miniPanel = document.getElementById('miniGamesPanel');

    // 缩小淡出
    miniPanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    miniPanel.style.opacity = '0';
    miniPanel.style.transform = 'translate(-50%, -50%) scale(0.85)';

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;

        miniPanel.style.display = 'none';
        miniPanel.style.opacity = '';
        miniPanel.style.transform = '';
        miniPanel.style.transition = '';

        // 收起游戏面板与地图，渐显回首页
        document.getElementById('panel').style.display = 'none';
        document.getElementById('panel').classList.remove('visible');
        document.getElementById('map').classList.remove('visible');

        const rb = document.getElementById('reloadBtn');
        if (rb) {
            rb.style.visibility = 'hidden';
            rb.style.opacity = '0';
        }

        showHomeScreenWithFade();
    };

    miniPanel.addEventListener('transitionend', function handler(e) {
        if (e.target !== miniPanel || e.propertyName !== 'opacity') return;
        miniPanel.removeEventListener('transitionend', handler);
        finish();
    });
    setTimeout(finish, 400);
}

function startFindDifferent() {
    playSound('click');
    findDifferentMode = true;
    findDiffCombo = 0;
    findDiffScore = 0;
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
    updateFindDiffHUD('city', floatPanel);

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
        
        cell._name = data.name;
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

    // 修正经纬度比例，避免纵向拉伸
    const centerLat = (minY + maxY) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);
    const cosLatSafe = cosLat < 0.01 ? 0.01 : cosLat;

    const rangeX = (maxX - minX) * cosLatSafe;
    const rangeY = maxY - minY;

    const scaleX = (canvas.width - pad * 2) / rangeX;
    const scaleY = (canvas.height - pad * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);
    
    const ox = (canvas.width - rangeX * scale) / 2;
    const oy = (canvas.height - rangeY * scale) / 2;
    
    function toXY(lng, lat) {
        return [
            ox + (lng - minX) * cosLatSafe * scale,
            canvas.height - oy - (lat - minY) * scale
        ];
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
    const allCells = floatPanel.querySelectorAll('.find-different-cell');
    allCells.forEach(cell => { cell.style.pointerEvents = 'none'; });

    if (!clickedCell) clickedCell = null;

    var isCorrect = (selected === findDifferentAnswer);
    var cellsArr = Array.prototype.slice.call(allCells);

    if (isCorrect) {
        playSound('correct');
        findDiffCombo++;
        findDiffScore += findDiffCombo;
        if (clickedCell) {
            clickedCell.style.borderColor = '#10b981';
            clickedCell.style.boxShadow = '0 0 20px rgba(16,185,129,0.6)';
            clickedCell.style.transform = 'scale(1.05)';
            clickedCell.style.transition = 'all 0.3s';
        }
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#10b981;font-size:24px;margin-bottom:6px;">✅ 正确！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">连击 x' + findDiffCombo + '，得分 +' + findDiffCombo + '</div>'
                + '<div style="font-size:13px;line-height:1.8;text-align:left;">';
            cellsArr.forEach(function (c, i) {
                var nm = c.querySelector('.mixed-name');
                var name = nm ? nm.textContent : (c._name || '?');
                var prov = getNameProvince(name);
                var flag = (name === findDifferentAnswer) ? ' ✅' : '';
                html += '<div>' + name + ' — ' + prov + flag + '</div>';
            });
            html += '</div></div>'
                + '<button id="findDiffNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>';
            floatPanel.innerHTML = html;
            saveFindDiffBest('city', findDiffScore);
            document.getElementById('findDiffNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateFindDifferentQuestion();
            };
        }, 300);
    } else {
        playSound('wrong');
        findDiffCombo = 0;
        if (clickedCell) {
            clickedCell.style.borderColor = '#ef4444';
            clickedCell.style.animation = 'shake 0.35s';
            clickedCell.style.boxShadow = '0 0 20px rgba(239,68,68,0.6)';
        }
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#ef4444;font-size:24px;margin-bottom:6px;">❌ 错误！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">正确答案是：' + findDifferentAnswer + '</div>'
                + '<div style="font-size:13px;line-height:1.8;text-align:left;">';
            cellsArr.forEach(function (c, i) {
                var nm = c.querySelector('.mixed-name');
                var name = nm ? nm.textContent : (c._name || '?');
                var prov = getNameProvince(name);
                var flag = (name === findDifferentAnswer) ? ' ✅' : '';
                html += '<div>' + name + ' — ' + prov + flag + '</div>';
            });
            html += '</div></div>'
                + '<button id="findDiffNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>';
            floatPanel.innerHTML = html;
            document.getElementById('findDiffNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateFindDifferentQuestion();
            };
        }, 300);
    }
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

// ==================== 混合版找不同 ====================

// 行政区 → 省 code（前 2 位）
function getProvinceCodeOf(name) {
    // 省级
    if (provinceAliasMap[name]) {
        // 省名 → code
        var provMap = {
            '北京市':'11','天津市':'12','河北省':'13','山西省':'14','内蒙古自治区':'15',
            '辽宁省':'21','吉林省':'22','黑龙江省':'23','上海市':'31',
            '江苏省':'32','浙江省':'33','安徽省':'34','福建省':'35','江西省':'36','山东省':'37',
            '河南省':'41','湖北省':'42','湖南省':'43','广东省':'44','广西壮族自治区':'45','海南省':'46',
            '重庆市':'50','四川省':'51','贵州省':'52','云南省':'53','西藏自治区':'54',
            '陕西省':'61','甘肃省':'62','青海省':'63','宁夏回族自治区':'64','新疆维吾尔自治区':'65',
            '香港特别行政区':'81','澳门特别行政区':'82'
        };
        if (provMap[name]) return provMap[name];
    }
    // 地级市
    var cityCode = getCityCode(name);
    if (cityCode) return cityCode.substring(0, 2);
    // 区县
    if (typeof DISTRICT_INFO !== 'undefined' && DISTRICT_INFO[name]) {
        var prov = DISTRICT_INFO[name].province;
        var pm = {
            '北京市':'11','天津市':'12','河北省':'13','山西省':'14','内蒙古自治区':'15',
            '辽宁省':'21','吉林省':'22','黑龙江省':'23','上海市':'31',
            '江苏省':'32','浙江省':'33','安徽省':'34','福建省':'35','江西省':'36','山东省':'37',
            '河南省':'41','湖北省':'42','湖南省':'43','广东省':'44','广西壮族自治区':'45','海南省':'46',
            '重庆市':'50','四川省':'51','贵州省':'52','云南省':'53','西藏自治区':'54',
            '陕西省':'61','甘肃省':'62','青海省':'63','宁夏回族自治区':'64','新疆维吾尔自治区':'65',
            '香港特别行政区':'81','澳门特别行政区':'82'
        };
        return pm[prov] || '';
    }
    return '';
}

// 省 code → 省名
var PROV_CODE_NAME = {
    '11':'北京市','12':'天津市','13':'河北省','14':'山西省','15':'内蒙古自治区',
    '21':'辽宁省','22':'吉林省','23':'黑龙江省','31':'上海市',
    '32':'江苏省','33':'浙江省','34':'安徽省','35':'福建省','36':'江西省','37':'山东省',
    '41':'河南省','42':'湖北省','43':'湖南省','44':'广东省','45':'广西壮族自治区','46':'海南省',
    '50':'重庆市','51':'四川省','52':'贵州省','53':'云南省','54':'西藏自治区',
    '61':'陕西省','62':'甘肃省','63':'青海省','64':'宁夏回族自治区','65':'新疆维吾尔自治区',
    '81':'香港特别行政区','82':'澳门特别行政区'
};

var mixedAnswerName = null;
var mixedAnswerProvince = null;

function startFindDifferentMixed() {
    playSound('click');
    findDifferentMode = true;
    findDiffCombo = 0;
    findDiffScore = 0;
    document.getElementById('miniGamesPanel').style.display = 'none';
    document.getElementById('panel').style.display = 'none';
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('newBtn').disabled = true;
    document.getElementById('hint').style.pointerEvents = 'none';
    generateMixedQuestion();
}

function generateMixedQuestion() {
    // 选 2 个省
    var provList = [
        '北京市','天津市','河北省','山西省','内蒙古自治区',
        '辽宁省','吉林省','黑龙江省','上海市',
        '江苏省','浙江省','安徽省','福建省','江西省','山东省',
        '河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省',
        '重庆市','四川省','贵州省','云南省','西藏自治区',
        '陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区'
    ];
    var shuffled = provList.slice().sort(function () { return Math.random() - 0.5; });
    var provA = shuffled[0], provB = shuffled[1];

    var codeA = getProvinceCodeOf(provA);
    var codeB = getProvinceCodeOf(provB);

    function poolOf(provName, provCode) {
        var pool = [provName];
        getCityPool().forEach(function (c) {
            var code = getCityCode(c);
            if (code && code.substring(0, 2) === provCode) pool.push(c);
        });
        Object.keys(DISTRICT_INFO).forEach(function (d) {
            if (DISTRICT_INFO[d].province !== provName) return;
            pool.push(d);
        });
        return pool;
    }

    var poolA = poolOf(provA, codeA);
    var poolB = poolOf(provB, codeB);

    // 从 A 抽 3 个不重复
    var shuffledA = poolA.slice().sort(function () { return Math.random() - 0.5; });
    var threeFromA = shuffledA.slice(0, 3);
    if (threeFromA.length < 3) { generateMixedQuestion(); return; }

    // 从 B 抽 1 个
    var shuffledB = poolB.slice().sort(function () { return Math.random() - 0.5; });
    var oneFromB = shuffledB[0];
    if (!oneFromB) { generateMixedQuestion(); return; }

    // 4 个混合
    var items = threeFromA.map(function (n) { return { name: n, isDiff: false }; });
    items.push({ name: oneFromB, isDiff: true });
    items.sort(function () { return Math.random() - 0.5; });

    mixedAnswerName = oneFromB;
    mixedAnswerProvince = provB;

    loadMixedMaps(items);
}

function loadMixedMaps(items) {
    var mapsData = [];
    var loaded = 0;
    var finished = false;

    // 显示加载中
    var loadingPanel = document.createElement('div');
    loadingPanel.id = 'mixedLoadingPanel';
    loadingPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px 30px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999;font-size:14px;';
    loadingPanel.textContent = '🔍 加载中...';
    document.body.appendChild(loadingPanel);

    var totalTimeout = setTimeout(function () {
        if (!finished) {
            finished = true;
            loadingPanel.remove();
            generateMixedQuestion();
        }
    }, 8000);

    items.forEach(function (item) {
        var baseName = item.name.replace(/（.+?）$/, '');
        var searchObj;
        // 判断用哪个搜索：省 / 地级 / 区县
        if (provinceAliasMap[item.name] || item.name.indexOf('省') > 0 || item.name.indexOf('市') > 0 && getCityCode(item.name)) {
            // 可能是省或地级
        }
        // 简单处理：省级用 dsProvince，地级用 dsCity，其余用 ds
        var isProv = [
            '北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省',
            '上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省',
            '湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省',
            '西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区',
            '香港特别行政区','澳门特别行政区'
        ].indexOf(item.name) !== -1;
        var isCity = getCityPool().indexOf(item.name) !== -1;

        if (isProv) searchObj = dsProvince;
        else if (isCity) searchObj = dsCity;
        else searchObj = ds;

        // 取上级地级名（区县重名时用于精确匹配）
        var parentCity = '';
        if (typeof DISTRICT_INFO !== 'undefined' && DISTRICT_INFO[item.name]) {
            parentCity = DISTRICT_INFO[item.name].city || DISTRICT_INFO[item.name].province || '';
        }

        function doSearch(retry) {
            if (finished) return;
            searchObj.search(baseName, function (status, result) {
                if (finished) return;
                if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                    var candidates = result.districtList.filter(function (x) {
                        return x.boundaries && x.boundaries.length > 0;
                    });

        var d = null;
        if (parentCity && candidates.length > 1) {
            var parentCode = getCityCode(parentCity);
            if (parentCode) {
                // 地级市：adcode 前 4 位匹配
                d = candidates.find(function (x) {
                    return x.adcode && x.adcode.substring(0, 4) === parentCode;
                });
            } else {
                // 直辖市：adcode 前 2 位匹配
                var provMap = { '北京市':'11','天津市':'12','上海市':'31','重庆市':'50' };
                var provCode = provMap[parentCity];
                if (provCode) {
                    d = candidates.find(function (x) {
                        return x.adcode && x.adcode.substring(0, 2) === provCode;
                    });
                }
            }
        }
        if (!d) {
            d = candidates.find(function (x) { return x.name === baseName; });
        }
        if (!d) d = candidates[0] || result.districtList[0];

                    if (d && d.boundaries && d.boundaries.length > 0) {
                        mapsData.push({ name: item.name, district: d, isTarget: item.isDiff });
                        loaded++;
                        if (loaded >= items.length && !finished) {
                            finished = true;
                            clearTimeout(totalTimeout);
                            loadingPanel.remove();
                            if (mapsData.length === 4) displayMixedMaps(mapsData);
                            else generateMixedQuestion();
                        }
                    } else if (retry > 0) {
                        setTimeout(function () { doSearch(retry - 1); }, 400);
                    } else {
                        loaded++;
                        if (loaded >= items.length && !finished) {
                            finished = true;
                            clearTimeout(totalTimeout);
                            loadingPanel.remove();
                            generateMixedQuestion();
                        }
                    }
                } else if (retry > 0) {
                    setTimeout(function () { doSearch(retry - 1); }, 400);
                } else {
                    loaded++;
                    if (loaded >= items.length && !finished) {
                        finished = true;
                        clearTimeout(totalTimeout);
                        loadingPanel.remove();
                        generateMixedQuestion();
                    }
                }
            });
        }
        doSearch(3);
    });
}

function displayMixedMaps(mapsData) {
    var floatPanel = document.createElement('div');
    floatPanel.id = 'mixedFloatPanel';
    floatPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;width:95%;max-width:800px;max-height:90vh;overflow-y:auto;';

    var title = document.createElement('div');
    title.textContent = '🔍 找出不同省份的行政区';
    title.style.cssText = 'text-align:center;font-weight:bold;margin-bottom:15px;font-size:14px;';
    floatPanel.appendChild(title);
    updateFindDiffHUD('mixed', floatPanel);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    mapsData.forEach(function (data) {
        var cell = document.createElement('div');
        cell.className = 'mixed-cell';
        cell.style.cssText = 'cursor:pointer;border:3px solid #ccc;border-radius:12px;overflow:hidden;transition:all 0.3s ease;';
        cell.onmouseenter = function () {
            cell.style.borderColor = '#4a6cf7';
            cell.style.boxShadow = '0 4px 15px rgba(74,108,247,0.3)';
            cell.style.transform = 'scale(1.03)';
        };
        cell.onmouseleave = function () {
            cell.style.borderColor = '#ccc';
            cell.style.boxShadow = 'none';
            cell.style.transform = 'scale(1)';
        };

        var canvas = document.createElement('canvas');
        canvas.width = 350;
        canvas.height = 260;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        cell.appendChild(canvas);

        cell.onclick = function () {
            checkMixedAnswer(data.name, floatPanel, cell);
        };

        cell._name = data.name;
        cell._province = getNameProvince(data.name);
        grid.appendChild(cell);
        drawDistrictOnSmallCanvas(data.district, canvas);
    });

    floatPanel.appendChild(grid);

    var exitBtn = document.createElement('button');
    exitBtn.textContent = '退出小游戏';
    exitBtn.style.cssText = 'display:block;width:100%;margin:15px 0 0;padding:10px;border:none;border-radius:8px;background:#ccc;cursor:pointer;font-size:13px;';
    exitBtn.onclick = function () {
        floatPanel.remove();
        closeMiniGames();
    };
    floatPanel.appendChild(exitBtn);

    var old = document.getElementById('mixedFloatPanel');
    if (old) old.remove();
    document.body.appendChild(floatPanel);
}

function checkMixedAnswer(selected, floatPanel, clickedCell) {
    var allCells = floatPanel.querySelectorAll('.mixed-cell');
    allCells.forEach(function (cell) { cell.style.pointerEvents = 'none'; });
    var cellsArr = Array.prototype.slice.call(allCells);

    var isCorrect = (selected === mixedAnswerName);

    if (isCorrect) {
        playSound('correct');
        findDiffCombo++;
        findDiffScore += findDiffCombo;
        clickedCell.style.borderColor = '#10b981';
        clickedCell.style.boxShadow = '0 0 20px rgba(16,185,129,0.6)';
        clickedCell.style.transform = 'scale(1.05)';
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#10b981;font-size:24px;margin-bottom:6px;">✅ 正确！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">连击 x' + findDiffCombo + '，得分 +' + findDiffCombo + '</div>'
                + '<div style="font-size:13px;line-height:1.8;text-align:left;">';
            cellsArr.forEach(function (c) {
                var name = c._name || '?';
                var prov = c._province || getNameProvince(name);
                var flag = (name === mixedAnswerName) ? ' ✅' : '';
                html += '<div>' + name + ' — ' + prov + flag + '</div>';
            });
            html += '</div></div>'
                + '<button id="mixedNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>';
            floatPanel.innerHTML = html;
            saveFindDiffBest('mixed', findDiffScore);
            document.getElementById('mixedNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateMixedQuestion();
            };
        }, 300);
    } else {
        playSound('wrong');
        findDiffCombo = 0;
        clickedCell.style.borderColor = '#ef4444';
        clickedCell.style.animation = 'shake 0.35s';
        clickedCell.style.boxShadow = '0 0 20px rgba(239,68,68,0.6)';
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#ef4444;font-size:24px;margin-bottom:6px;">❌ 错误！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">正确答案是：' + mixedAnswerName + '（' + mixedAnswerProvince + '）</div>'
                + '<div style="font-size:13px;line-height:1.8;text-align:left;">';
            cellsArr.forEach(function (c) {
                var name = c._name || '?';
                var prov = c._province || getNameProvince(name);
                var flag = (name === mixedAnswerName) ? ' ✅' : '';
                html += '<div>' + name + ' — ' + prov + flag + '</div>';
            });
            html += '</div></div>'
                + '<button id="mixedNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>';
            floatPanel.innerHTML = html;
            document.getElementById('mixedNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateMixedQuestion();
            };
        }, 300);
    }
}

// ==================== 沿海或内陆 ====================

var coastAnswerIsCoastal = null;   // 本题正确答案

function startCoastInland() {
    playSound('click');
    findDifferentMode = true;
    findDiffCombo = 0;
    findDiffScore = 0;
    document.getElementById('miniGamesPanel').style.display = 'none';
    document.getElementById('panel').style.display = 'none';
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('newBtn').disabled = true;
    document.getElementById('hint').style.pointerEvents = 'none';
    generateCoastQuestion();
}

function generateCoastQuestion() {
    // 出题池：省级 + 地级 + 区县（和混合版一致）
    var provList = [
        '北京市','天津市','河北省','山西省','内蒙古自治区',
        '辽宁省','吉林省','黑龙江省','上海市',
        '江苏省','浙江省','安徽省','福建省','江西省','山东省',
        '河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省',
        '重庆市','四川省','贵州省','云南省','西藏自治区',
        '陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区',
        '香港特别行政区','澳门特别行政区'
    ];
    var pool = provList.slice();
    getCityPool().forEach(function (c) { pool.push(c); });
    Object.keys(DISTRICT_INFO).forEach(function (d) { pool.push(d); });

    // 拆成沿海池和内陆池
    var coastalPool = [];
    var inlandPool = [];
    pool.forEach(function (n) {
        if (isCoastal(n)) coastalPool.push(n);
        else inlandPool.push(n);
    });

    // 各 50% 概率
    var pick;
    if (Math.random() < 0.5 && coastalPool.length > 0) {
        pick = coastalPool[Math.floor(Math.random() * coastalPool.length)];
    } else if (inlandPool.length > 0) {
        pick = inlandPool[Math.floor(Math.random() * inlandPool.length)];
    } else {
        pick = coastalPool[Math.floor(Math.random() * coastalPool.length)];
    }

    coastAnswerIsCoastal = isCoastal(pick);

    // 显示
    var floatPanel = document.createElement('div');
    floatPanel.id = 'coastFloatPanel';
    floatPanel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:9999;width:90%;max-width:420px;';

    var title = document.createElement('div');
    title.textContent = '🌊 沿海或内陆';
    title.style.cssText = 'text-align:center;font-weight:bold;margin-bottom:12px;font-size:14px;';
    floatPanel.appendChild(title);

    updateFindDiffHUD('coast', floatPanel);

    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    canvas.style.cssText = 'display:block;width:100%;max-width:400px;height:auto;margin:12px auto;background:#dfe9f5;border-radius:8px;';
    floatPanel.appendChild(canvas);

    // 加载版图
    loadCoastMap(pick, canvas, floatPanel);

    var btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;margin-top:10px;';

    var btnCoast = document.createElement('button');
    btnCoast.textContent = '🌊 沿海';
    btnCoast.style.cssText = 'flex:1;padding:16px;border:none;border-radius:10px;background:#0099cc;color:white;cursor:pointer;font-size:16px;';
    btnCoast.onclick = function () { checkCoastAnswer(true, floatPanel, pick); };
    btnRow.appendChild(btnCoast);

    var btnInland = document.createElement('button');
    btnInland.textContent = '🏔️ 内陆';
    btnInland.style.cssText = 'flex:1;padding:16px;border:none;border-radius:10px;background:#b45309;color:white;cursor:pointer;font-size:16px;';
    btnInland.onclick = function () { checkCoastAnswer(false, floatPanel, pick); };
    btnRow.appendChild(btnInland);

    floatPanel.appendChild(btnRow);

    var exitBtn = document.createElement('button');
    exitBtn.textContent = '退出小游戏';
    exitBtn.style.cssText = 'display:block;width:100%;margin:15px 0 0;padding:10px;border:none;border-radius:8px;background:#ccc;cursor:pointer;font-size:13px;';
    exitBtn.onclick = function () {
        floatPanel.remove();
        closeMiniGames();
    };
    floatPanel.appendChild(exitBtn);

    var old = document.getElementById('coastFloatPanel');
    if (old) old.remove();
    document.body.appendChild(floatPanel);
}

function loadCoastMap(name, canvas, floatPanel) {
    var baseName = name.replace(/（.+?）$/, '');
    var parentCity = '';
    if (typeof DISTRICT_INFO !== 'undefined' && DISTRICT_INFO[name]) {
        parentCity = DISTRICT_INFO[name].city || DISTRICT_INFO[name].province || '';
    }

    // 判断搜索类型
    var isProv = COASTAL_PROVINCES.indexOf(name) !== -1
        || ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区'].indexOf(name) !== -1;
    var isCity = getCityPool().indexOf(name) !== -1;
    var searchObj = isProv ? dsProvince : (isCity ? dsCity : ds);

    function doSearch(retry) {
        searchObj.search(baseName, function (status, result) {
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                var candidates = result.districtList.filter(function (x) {
                    return x.boundaries && x.boundaries.length > 0;
                });

    var d = null;
    if (parentCity && candidates.length > 1) {
        var parentCode = getCityCode(parentCity);
        if (parentCode) {
            // 地级市：adcode 前 4 位匹配
            d = candidates.find(function (x) {
                return x.adcode && x.adcode.substring(0, 4) === parentCode;
            });
        } else {
            // 直辖市：adcode 前 2 位匹配
            var provMap = { '北京市':'11','天津市':'12','上海市':'31','重庆市':'50' };
            var provCode = provMap[parentCity];
            if (provCode) {
                d = candidates.find(function (x) {
                    return x.adcode && x.adcode.substring(0, 2) === provCode;
                });
            }
        }
    }
    // 兜底：严格同名匹配
    if (!d) {
        d = candidates.find(function (x) { return x.name === baseName; });
    }
    if (!d) d = candidates[0] || result.districtList[0];

                if (d && d.boundaries && d.boundaries.length > 0) {
                    drawDistrictOnSmallCanvas(d, canvas);
                } else if (retry > 0) {
                    setTimeout(function () { doSearch(retry - 1); }, 400);
                } else {
                    // 搜不到，画个提示
                    var ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#999';
                    ctx.font = '16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('地图加载失败', canvas.width / 2, canvas.height / 2);
                }
            } else if (retry > 0) {
                setTimeout(function () { doSearch(retry - 1); }, 400);
            } else {
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = '#999';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('地图加载失败', canvas.width / 2, canvas.height / 2);
            }
        });
    }
    doSearch(3);
}

function checkCoastAnswer(userSaidCoastal, floatPanel, name) {
    // 禁用按钮
    floatPanel.querySelectorAll('button').forEach(function (b) {
        if (b.textContent !== '退出小游戏') b.style.pointerEvents = 'none';
    });

    var correct = (userSaidCoastal === coastAnswerIsCoastal);

    if (correct) {
        playSound('correct');
        findDiffCombo++;
        findDiffScore += findDiffCombo;
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#10b981;font-size:24px;margin-bottom:6px;">✅ 正确！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">连击 x' + findDiffCombo + '，得分 +' + findDiffCombo + '</div>'
                + '<div style="font-size:15px;line-height:1.8;">' + name + ' — ' + (coastAnswerIsCoastal ? '沿海' : '内陆') + '</div>'
                + '<button id="coastNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>'
                + '</div>';
            floatPanel.innerHTML = html;
            saveFindDiffBest('coast', findDiffScore);
            document.getElementById('coastNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateCoastQuestion();
            };
        }, 300);
    } else {
        playSound('wrong');
        findDiffCombo = 0;
        setTimeout(function () {
            var html = '<div style="text-align:center;padding:10px;">'
                + '<div style="color:#ef4444;font-size:24px;margin-bottom:6px;">❌ 错误！</div>'
                + '<div style="font-size:14px;color:#666;margin-bottom:12px;">正确答案是：' + (coastAnswerIsCoastal ? '沿海' : '内陆') + '</div>'
                + '<div style="font-size:15px;line-height:1.8;">' + name + ' — ' + (coastAnswerIsCoastal ? '沿海' : '内陆') + '</div>'
                + '<button id="coastNextBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">下一题 →</button>'
                + '</div>';
            floatPanel.innerHTML = html;
            document.getElementById('coastNextBtn').onclick = function () {
                playSound('click');
                floatPanel.remove();
                generateCoastQuestion();
            };
        }, 300);
    }
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

let lastSkipTime = 0;

function skipDailyQuestion() {
    if (!dailyMode || dailyCompleted) return;
    
    if (skipDailyLock) return;
    skipDailyLock = true;
    
    playSound('click');
    
    // 用当前题目（跳过前）
    const questionName = dailyQuestions[dailyIndex];
    
    if (questionName && !dailyWrongAnswers.includes(questionName) && !dailyCorrectAnswers.includes(questionName)) {
        dailyWrongAnswers.push(questionName);
    }
    
    document.getElementById('dailySkipBtn').disabled = true;
    document.getElementById('dailyMsg').textContent = '⏭ 已跳过，本题不得分';
    
    dailyIndex++;
    
    setTimeout(() => {
        skipDailyLock = false;
        document.getElementById('dailySkipBtn').disabled = false;
        loadDailyQuestion();
    }, 1500);
}

function showDailyReview() {
    if (!dailyMode && dailyCorrectAnswers.length === 0 && dailyWrongAnswers.length === 0) return;
    
    playSound('click');
        const overlay = document.createElement('div');
    overlay.id = 'dailyReviewOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);
    const panel = document.createElement('div');
    panel.id = 'dailyReviewPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:25px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:80vw;max-height:70vh;overflow-y:auto;min-width:280px;opacity:0;transition:opacity 0.3s ease;';
    
    let html = '<h3 style="text-align:center;margin-bottom:15px;">📝 今日答题回顾</h3>';
    
    if (dailyCorrectAnswers.length > 0) {
        html += '<div style="margin-bottom:15px;">';
        html += '<div style="color:#10b981;font-weight:bold;margin-bottom:8px;">✅ 答对 (' + dailyCorrectAnswers.length + ')</div>';
        html += '<ul style="padding-left:20px;margin:0;">';
        dailyCorrectAnswers.forEach(name => {
            html += '<li style="padding:3px 0;font-size:14px;color:#10b981;">' + name + '</li>';
        });
        html += '</ul></div>';
    }
    
    if (dailyWrongAnswers.length > 0) {
        html += '<div style="margin-bottom:15px;">';
        html += '<div style="color:#ef4444;font-weight:bold;margin-bottom:8px;">⏭ 跳过 (' + dailyWrongAnswers.length + ')</div>';
        html += '<ul style="padding-left:20px;margin:0;">';
        dailyWrongAnswers.forEach(name => {
            html += '<li style="padding:3px 0;font-size:14px;color:#ef4444;">' + name + '</li>';
        });
        html += '</ul></div>';
    }
    
    html += '<button id="dailyReviewCloseBtn" style="display:block;width:100%;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">关闭</button>';
    
    panel.innerHTML = html;
    document.body.appendChild(panel);

    requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        panel.style.opacity = '1';
    });
    
    document.getElementById('dailyReviewCloseBtn').onclick = () => {
        playSound('click');
        panel.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            panel.remove();
            overlay.remove();
        }, 300);
    };
}

// ==================== 好友对决（PeerJS 版） ====================

let battleRoomId = null;
let battlePlayerName = '';
let battlePlayerNumber = null;
let battleMode = 'race';
let battleRange = 'district';
let battlePeer = null;
let battleConn = null;
let battleConns = {};
let battleTimer = null;
let battleScoreStartTime = 0;
let battleDisplayedSeq = -1;
let battleSubmitLock = false;
let battleLastSubmitTime = 0;
let battleHistory = [];
let battleResultShown = false;
let battleHostLock = false;
let battleLoadSeq = 0;
let battleRoomState = null;
let battleJoinTimeout = null;
let battleJoinHandled = false;
const battleDistrictCache = {};

const BATTLE_PREFIX = 'kantucai-xian-';

// ==================== 地图加载 ====================

function loadBattleDistrict(name) {
    if (!name) return;
    if (name === '海西蒙古族藏族自治州直辖') name = '大柴旦行政委员会';

    var mySeq = ++battleLoadSeq;
    lastLoadRequest = { type: 'battle', name: name };

    const bm = name.match(/（(.+?)）$/);
    const baseName = bm ? name.replace(/（.+?）$/, '') : name;
    const parentName = bm ? bm[1] : null;
    const cacheKey = name;

    if (battleDistrictCache[cacheKey]) {
        displayBattleDistrict(battleDistrictCache[cacheKey], name, mySeq);
        return;
    }

    const whitelistAdcodes = (typeof SHORT_NAME_ADCODE !== 'undefined') ? SHORT_NAME_ADCODE[name] : null;
    if (whitelistAdcodes && whitelistAdcodes.length > 0) {
        ds.search(whitelistAdcodes[0], function (status, result) {
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                const d = result.districtList.find(x => x.level === 'district') || result.districtList[0];
                if (d && d.boundaries && d.boundaries.length > 0) {
                    battleDistrictCache[cacheKey] = d;
                    displayBattleDistrict(d, name, mySeq);
                    return;
                }
            }
            fallback();
        });
        return;
    }

    if (parentName) {
        const cityCode = getCityCode(parentName);
        if (cityCode) {
            dsCity.search(cityCode + '00', function (s2, r2) {
                if (s2 === 'complete' && r2.districtList.length > 0) {
                    const subs = r2.districtList[0].districtList || [];
                    const found = subs.find(s => s.name === baseName && s.level === 'district');
                    if (found) {
                        ds.search(found.adcode, function (s3, r3) {
                            if (s3 === 'complete' && r3.districtList.length > 0) {
                                const d = r3.districtList[0];
                                if (d && d.boundaries && d.boundaries.length > 0) {
                                    battleDistrictCache[cacheKey] = d;
                                    displayBattleDistrict(d, name, mySeq);
                                }
                            }
                        });
                        return;
                    }
                }
                fallback();
            });
            return;
        }
    }

    fallback();

    function fallback() {
        var retry = 3;
        function attempt() {
            ds.search(baseName, function (status, result) {
                if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                    var d = result.districtList.find(x => x.name === baseName);
                    if (!d && parentName) {
                        d = result.districtList.find(function (x) {
                            var city = getCityName(x.adcode);
                            return city.includes(parentName) || parentName.includes(city);
                        });
                    }
                    if (!d) d = result.districtList.find(x => x.boundaries && x.boundaries.length > 0);
                    if (d && d.boundaries && d.boundaries.length > 0) {
                        battleDistrictCache[cacheKey] = d;
                        displayBattleDistrict(d, name, mySeq);
                    } else if (retry > 0) {
                        retry--;
                        setTimeout(attempt, 400);
                    }
                } else if (retry > 0) {
                    retry--;
                    setTimeout(attempt, 400);
                }
            });
        }
        attempt();
    }
}

function displayBattleDistrict(d, originalName, seq) {
    if (seq !== undefined && seq !== battleLoadSeq) return;
    if (typeof clearMap === 'function') clearMap();
    if (typeof window._quizIntercept === 'function') window._quizIntercept = null;
    if (typeof window._avatarIntercept === 'function') window._avatarIntercept = null;
    if (window.innerWidth <= 768) {
        drawDistrictOnCanvas(d);
    } else {
        showDistrict(d);
    }
}

// ==================== 题库 ====================

function getBattlePool() {
    return battleRange === 'city' ? getCityPool() : districtPool;
}

function pickBattleQuestion(used) {
    var pool = getBattlePool().filter(function (n) { return !used[n]; });
    if (pool.length === 0) pool = getBattlePool();
    var pick = pool[Math.floor(Math.random() * pool.length)];
    used[pick] = true;
    return pick;
}

// ==================== 面板开关 ====================

function openBattlePanel() {
    playSound('click');
    if (typeof quizCleanup === 'function') quizCleanup();
    dailyMode = false;
    findDifferentMode = false;
    if (timerMode) {
        timerMode = false;
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        document.getElementById('btnTimer').classList.remove('active');
        document.getElementById('timerDisplay').style.display = 'none';
    }
    document.getElementById('panel').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'none';
    document.getElementById('miniGamesPanel').style.display = 'none';
    var bp = document.getElementById('battlePanel');
    bp.style.display = 'block';
    bp.classList.remove('pop-in');
    void bp.offsetWidth;
    bp.classList.add('pop-in');
}

function closeBattlePanel() {
    playSound('click');
    cleanupBattle();
    var bp = document.getElementById('battlePanel');
    bp.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    bp.style.opacity = '0';
    bp.style.transform = 'translate(-50%, -50%) scale(0.85)';
    var done = false;
    var finish = function () {
        if (done) return;
        done = true;
        bp.style.display = 'none';
        bp.classList.remove('pop-in');
        bp.style.opacity = '';
        bp.style.transform = '';
        bp.style.transition = '';
        document.getElementById('panel').style.display = 'none';
        document.getElementById('panel').classList.remove('visible');
        document.getElementById('map').classList.remove('visible');
        var rb = document.getElementById('reloadBtn');
        if (rb) { rb.style.visibility = 'hidden'; rb.style.opacity = '0'; }
        showHomeScreenWithFade();
    };
    bp.addEventListener('transitionend', function handler(e) {
        if (e.target !== bp || e.propertyName !== 'opacity') return;
        bp.removeEventListener('transitionend', handler);
        finish();
    });
    setTimeout(finish, 400);
}

function cleanupBattle() {
    if (battleJoinTimeout) { clearTimeout(battleJoinTimeout); battleJoinTimeout = null; }
    battleJoinHandled = false;

    Object.keys(battleConns).forEach(function (k) {
        try { battleConns[k].close(); } catch (e) {}
    });
    battleConns = {};

    if (battleConn) { try { battleConn.close(); } catch (e) {} battleConn = null; }
    if (battlePeer) { try { battlePeer.destroy(); } catch (e) {} battlePeer = null; }
    if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }

    battleRoomId = null;
    battlePlayerNumber = null;
    battleDisplayedSeq = -1;
    battleSubmitLock = false;
    battleResultShown = false;
    battleHostLock = false;
    battleRoomState = null;
    battleHistory = [];
    window._battleReadySoundPlayed = false;
    window._scoreStarted = false;
}

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function enterBattleRoom(infoText) {
    document.getElementById('battlePanel').style.display = 'none';
    document.getElementById('battleStartBtn').style.display = 'none';
    document.getElementById('battleQuestion').textContent = '';
    document.getElementById('battleInput').value = '';
    document.getElementById('battleInput').disabled = true;
    document.getElementById('battleSubmitBtn').disabled = true;
    document.getElementById('battleGiveUpBtn').disabled = true;
    document.getElementById('battleScore').textContent = '';

    var brp = document.getElementById('battleRoomPanel');
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

    var modeText = battleMode === 'race' ? '🏁 竞速' : '📊 竞分';
    var targetText = battleMode === 'race'
        ? '目标 ' + document.getElementById('battleTargetScore').value + ' 分'
        : '限时 ' + document.getElementById('battleDuration').value + ' 秒';
    var rangeText = battleRange === 'city' ? '地级市' : '县级';
    document.getElementById('battleRoomInfo').innerHTML =
        infoText + '<br><span style="font-size:12px;color:#666;">' + modeText + ' · ' + targetText + ' · ' + rangeText + '</span>';
}

// ==================== 房主创建房间 ====================

function createBattleRoom() {
    if (typeof Peer === 'undefined') {
        alert('PeerJS 未加载，请刷新页面');
        return;
    }
    cleanupBattle();

    var name = document.getElementById('battlePlayerName').value.trim();
    if (!name) { alert('请输入昵称'); return; }

    battlePlayerName = name;
    battlePlayerNumber = 1;
    battleMode = document.getElementById('battleModeSelect').value;
    battleRange = document.getElementById('battleRangeSelect').value;
    battleRoomId = generateRoomId();

    var targetScore = parseInt(document.getElementById('battleTargetScore').value) || 5;
    var duration = parseInt(document.getElementById('battleDuration').value) || 60;
    var maxPlayers = battleMode === 'score'
        ? (parseInt(document.getElementById('battleMaxPlayers').value) || 4)
        : 2;

    battleRoomState = {
        id: battleRoomId,
        mode: battleMode,
        target_score: targetScore,
        duration: duration,
        range_type: battleRange,
        status: 'waiting',
        max_players: maxPlayers,
        player1: name,
        player2: null,
        player3: null,
        player4: null,
        player1_score: 0,
        player2_score: 0,
        player3_score: 0,
        player4_score: 0,
        player1_giveup: false,
        player2_giveup: false,
        player1_index: 0,
        player2_index: 0,
        player3_index: 0,
        player4_index: 0,
        current_question: null,
        question_seq: 0,
        used_questions: {},
        correct_log: [],
        winner: null,
        question_pool: [],
        replay: {}
    };

    enterBattleRoom('房间号: ' + battleRoomId + ' | 等待对手加入...');

    var peerId = BATTLE_PREFIX + battleRoomId;
    battlePeer = new Peer(peerId, {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    battlePeer.on('open', function () {
        document.getElementById('battleRoomInfo').innerHTML =
            '房间号: ' + battleRoomId + ' | 等待对手加入...<br>' +
            '<span style="font-size:12px;color:#666;">让对手输入房间号加入</span>';
    });

    battlePeer.on('connection', function (conn) {
        // 竞分开始后不允许新玩家进入
        if (battleRoomState && battleRoomState.mode === 'score' && battleRoomState.status !== 'waiting') {
            try { conn.send({ type: 'full' }); conn.close(); } catch (e) {}
            return;
        }
        // 判断还有没有空位
        var maxP = battleRoomState.max_players || 4;
        var freeSlot = null;
        if (!battleRoomState.player2) freeSlot = 2;
        else if (maxP >= 3 && !battleRoomState.player3) freeSlot = 3;
        else if (maxP >= 4 && !battleRoomState.player4) freeSlot = 4;

        if (!freeSlot) {
            conn.on('open', function () {
                try { conn.send({ type: 'full' }); } catch (e) {}
                setTimeout(function () { try { conn.close(); } catch (e) {} }, 200);
            });
            return;
        }

        // 临时占位，等 join 消息带上昵称
        battleConns['pending_' + conn.peer] = conn;

        conn.on('open', function () {
            // 房主等对方发 join
        });

        conn.on('data', function (data) {
            handlePeerMessageFrom(conn, data);
        });

        conn.on('close', function () {
            // 找到对应槽位并清空
            Object.keys(battleConns).forEach(function (k) {
                if (battleConns[k] === conn) delete battleConns[k];
            });
            // 找出这个 conn 是哪个玩家（用 _slot 标记）
            var slot = conn._slot;
            if (slot && battleRoomState) {
                battleRoomState['player' + slot] = null;
                battleRoomState['player' + slot + '_score'] = 0;
                battleRoomState['player' + slot + '_index'] = 0;
                if (battleRoomState.mode === 'race') {
                    // 竞速一人退就重置
                    resetRoomToWaiting();
                } else {
                    // 竞分有人退出：中止游戏，彻底重置，换题库
                    resetScoreRoomToWaiting();
                }
            }
        });
    });

    battlePeer.on('error', function (err) {
        console.error('PeerJS 错误:', err);
        if (err.type === 'unavailable-id') {
            alert('房间号冲突，请重试');
        }
    });

    if (battleMode === 'score') {
        document.getElementById('battleStartBtn').style.display = 'block';
    }
}

// ==================== 玩家加入房间 ====================

function joinBattleRoom() {
    if (typeof Peer === 'undefined') {
        alert('PeerJS 未加载，请刷新页面');
        return;
    }
    cleanupBattle();

    var name = document.getElementById('battlePlayerName').value.trim();
    var roomId = document.getElementById('battleRoomInput').value.trim().toUpperCase();
    if (!name) { alert('请输入昵称'); return; }
    if (!roomId) { alert('请输入房间号'); return; }
    if (roomId.length !== 6) { alert('房间号应为 6 位'); return; }

    battlePlayerName = name;
    battlePlayerNumber = null;
    battleRoomId = roomId;
    battleMode = document.getElementById('battleModeSelect').value;
    battleRange = document.getElementById('battleRangeSelect').value;
    battleJoinHandled = false;

    enterBattleRoom('房间号: ' + battleRoomId + ' | 连接中...');

    battlePeer = new Peer(null, {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    });

    battlePeer.on('open', function () {
        var targetId = BATTLE_PREFIX + battleRoomId;
        battleConn = battlePeer.connect(targetId, { reliable: true });

        var connected = false;

        battleJoinTimeout = setTimeout(function () {
            battleJoinTimeout = null;
            if (connected) return;
            if (battleJoinHandled) return;
            battleJoinHandled = true;
            alert('连接超时，房间不存在或房主未在线');
            cleanupBattle();
            document.getElementById('battleRoomPanel').style.display = 'none';
            document.getElementById('battlePanel').style.display = 'block';
        }, 15000);

        battleConn.on('open', function () {
            connected = true;
            if (battleJoinTimeout) { clearTimeout(battleJoinTimeout); battleJoinTimeout = null; }
            setupConn();
            document.getElementById('battleRoomInfo').innerHTML =
                '房间号: ' + battleRoomId + ' | 已连接，等待房主开始...';
            battleConn.send({ type: 'join', name: battlePlayerName, avatar: currentAvatarImage });
        });

        battleConn.on('error', function (err) {
            console.error('DataConnection 错误:', err);
        });

        battleConn.on('close', function () {
            if (!connected) return;
            document.getElementById('battleRoomInfo').textContent = '⚠️ 与房主断开连接';
        });
    });

    battlePeer.on('error', function (err) {
        console.error('PeerJS 错误:', err);
        if (err.type === 'peer-unavailable') {
            if (battleJoinHandled) return;
            battleJoinHandled = true;
            alert('房间不存在，请检查房间号');
            cleanupBattle();
            document.getElementById('battleRoomPanel').style.display = 'none';
            document.getElementById('battlePanel').style.display = 'block';
        }
    });
}

function setupConn() {
    battleConn.on('open', function () {
        // 等 join 消息触发 broadcast
    });

    battleConn.on('data', function (data) {
        handlePeerMessage(data);
    });

    battleConn.on('close', function () {
        if (battlePlayerNumber !== 1) {
            document.getElementById('battleRoomInfo').textContent = '⚠️ 与房主断开连接';
        }
    });

    battleConn.on('error', function (err) {
        console.error('DataConnection 错误:', err);
    });
}

// ==================== 消息处理 ====================

function handlePeerMessageFrom(conn, msg) {
    if (!msg || !msg.type) return;

    // 房主收到「玩家加入」
    if (msg.type === 'join') {
        if (battleRoomState.mode === 'score' && battleRoomState.status !== 'waiting') {
            try { conn.send({ type: 'full' }); conn.close(); } catch (e) {}
            return;
        }
        var maxP = battleRoomState.max_players || 4;
        var freeSlot = null;
        if (!battleRoomState.player2) freeSlot = 2;
        else if (maxP >= 3 && !battleRoomState.player3) freeSlot = 3;
        else if (maxP >= 4 && !battleRoomState.player4) freeSlot = 4;

        if (!freeSlot) {
            try { conn.send({ type: 'full' }); } catch (e) {}
            setTimeout(function () { try { conn.close(); } catch (e) {} }, 200);
            return;
        }

        conn._slot = freeSlot;
        battleConns['player' + freeSlot] = conn;
        delete battleConns['pending_' + conn.peer];

        battleRoomState['player' + freeSlot] = msg.name;
        battleRoomState['player' + freeSlot + '_avatar'] = msg.avatar;
        battleRoomState['player' + freeSlot + '_score'] = 0;
        battleRoomState['player' + freeSlot + '_index'] = 0;

        window._battleReadySoundPlayed = false;

        // 竞速：两人齐自动开局
        if (battleRoomState.mode === 'race' && battleRoomState.player2) {
            battleRoomState.status = 'playing';
            hostPublishQuestion();
        }
        // 竞分：保持 waiting，等房主点开始

        broadcastRoomState();
        return;
    }

    // 玩家报分数（竞分）
    if (msg.type === 'score_correct') {
        var slot = conn._slot;
        if (!slot) return;
        var field = 'player' + slot;
        battleRoomState[field + '_score'] = msg.score;
        battleRoomState[field + '_index'] = msg.newIndex;
        if (msg.replayItem) {
            if (!battleRoomState.replay) battleRoomState.replay = {};
            if (!battleRoomState.replay[field]) battleRoomState.replay[field] = [];
            battleRoomState.replay[field][msg.newIndex - 1] = msg.replayItem;
        }
        battleRoomState.correct_log.push({
            question: msg.question,
            player: battleRoomState[field],
            playerNumber: slot,
            time: new Date().toLocaleTimeString(),
            seq: msg.newIndex
        });
        broadcastRoomState();
        return;
    }

    if (msg.type === 'score_skip') {
        var slot2 = conn._slot;
        if (!slot2) return;
        battleRoomState['player' + slot2 + '_index'] = msg.newIndex;
        if (msg.replayItem) {
            if (!battleRoomState.replay) battleRoomState.replay = {};
            if (!battleRoomState.replay['player' + slot2]) battleRoomState.replay['player' + slot2] = [];
            battleRoomState.replay['player' + slot2][msg.newIndex - 1] = msg.replayItem;
        }
        broadcastRoomState();
        return;
    }

        // 玩家抢答成功（竞速）
    if (msg.type === 'correct') {
        var s3 = conn._slot;
        if (!s3) return;
        if (battleRoomState.status !== 'playing') return;
        if (battleRoomState.mode !== 'race') return;
        if (battleRoomState.current_question !== msg.question) return;

        battleRoomState['player' + s3 + '_score'] =
            (battleRoomState['player' + s3 + '_score'] || 0) + 1;
        battleRoomState.correct_log.push({
            question: msg.question,
            player: battleRoomState['player' + s3],
            playerNumber: s3,
            time: new Date().toLocaleTimeString(),
            seq: battleRoomState.question_seq
        });

        // 锁定所有人，通知有人答对了
        battleSubmitLock = true;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        Object.keys(battleConns).forEach(function (k) {
            var c = battleConns[k];
            if (c && c.open) {
                if (c._slot === s3) {
                    try { c.send({ type: 'tip', text: '✅ 答对了！是 ' + msg.question }); } catch (e) {}
                } else {
                    try { c.send({ type: 'tip', text: '📢 对方已答对，等待出题...' }); } catch (e) {}
                }
                try { c.send({ type: 'lock' }); } catch (e) {}
            }
        });
        document.getElementById('battleQuestion').textContent =
            '📢 对方已答对，等待出题...';

        broadcastRoomState();

        setTimeout(function () {
            // 检查是否达到目标分
            var maxScore = 0;
            for (var i = 1; i <= 4; i++) {
                if (battleRoomState['player' + i]) {
                    var sc = battleRoomState['player' + i + '_score'] || 0;
                    if (sc > maxScore) maxScore = sc;
                }
            }
            if (maxScore >= battleRoomState.target_score) {
                // 找出赢家
                var winnerSlot = null;
                var maxS = -1, tie = false;
                for (var j = 1; j <= 4; j++) {
                    if (!battleRoomState['player' + j]) continue;
                    var sj = battleRoomState['player' + j + '_score'] || 0;
                    if (sj > maxS) { maxS = sj; winnerSlot = j; tie = false; }
                    else if (sj === maxS) tie = true;
                }
                battleRoomState.status = 'finished';
                battleRoomState.winner = tie ? 'tie' : ('player' + winnerSlot);
                battleRoomState.current_question = null;
                broadcastRoomState();
                return;
            }

            battleRoomState.current_question = null;
            battleRoomState.player1_giveup = false;
            battleRoomState.player2_giveup = false;
            hostPublishQuestion();
            broadcastRoomState();
        }, 500);
        return;
    }

    // 玩家放弃（竞速）
    if (msg.type === 'giveup') {
        var s = conn._slot;
        if (!s) return;
        if (battleRoomState.status !== 'playing') return;
        if (msg.seq !== undefined && msg.seq !== battleRoomState.question_seq) return;
        if (!battleRoomState.current_question) return;

        battleRoomState['player' + s + '_giveup'] = true;

        // 竞速模式：两人都放弃才换题
        var allGiveup = true;
        for (var i = 2; i <= (battleRoomState.max_players || 2); i++) {
            if (battleRoomState['player' + i] && !battleRoomState['player' + i + '_giveup']) {
                allGiveup = false;
                break;
            }
        }
        if (!battleRoomState.player1_giveup) allGiveup = false;

        if (allGiveup) {
            document.getElementById('battleQuestion').textContent = '🏳️ 双方都放弃，换新题...';
            Object.keys(battleConns).forEach(function (k) {
                var c = battleConns[k];
                if (c && c.open) {
                    try { c.send({ type: 'tip', text: '🏳️ 双方都放弃，换新题...' }); } catch (e) {}
                }
            });
            battleRoomState.current_question = null;
            battleRoomState.player1_giveup = false;
            battleRoomState.player2_giveup = false;
            hostPublishQuestion();
        } else {
            document.getElementById('battleQuestion').textContent = '🏳️ 对方已放弃，等待你决定...';
            Object.keys(battleConns).forEach(function (k) {
                var c = battleConns[k];
                if (c && c.open) {
                    try { c.send({ type: 'tip', text: '🏳️ 你已放弃，等待对方...' }); } catch (e) {}
                }
            });
        }
        broadcastRoomState();
        return;
    }

    if (msg.type === 'leave') {
        var s2 = conn._slot;
        if (s2) {
            battleRoomState['player' + s2] = null;
            battleRoomState['player' + s2 + '_score'] = 0;
            battleRoomState['player' + s2 + '_index'] = 0;
            delete battleConns['player' + s2];
            if (battleRoomState.mode === 'race') {
                resetRoomToWaiting();
            } else {
                // 竞分有人退出：中止游戏，彻底重置，换题库
                resetScoreRoomToWaiting();
            }
        }
        return;
    }
}

function handlePeerMessage(msg) {
    if (!msg || !msg.type) return;

    // 玩家收到
    if (battlePlayerNumber !== 1) {
        if (msg.type === 'full') {
            alert('房间已满');
            cleanupBattle();
            document.getElementById('battleRoomPanel').style.display = 'none';
            document.getElementById('battlePanel').style.display = 'block';
            return;
        }
        if (msg.type === 'tip') {
            document.getElementById('battleQuestion').textContent = msg.text;
            return;
        }
        if (msg.type === 'lock') {
            battleSubmitLock = true;
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;
            return;
        }
        if (msg.type === 'state') {
            // 首次收到 state 时确定自己的编号
            if (battlePlayerNumber === null) {
                if (msg.state.player2 === battlePlayerName) battlePlayerNumber = 2;
                else if (msg.state.player3 === battlePlayerName) battlePlayerNumber = 3;
                else if (msg.state.player4 === battlePlayerName) battlePlayerNumber = 4;
            }
            // 同步房主的模式与出题范围，避免用本地默认值判题/显示
            battleMode = msg.state.mode;
            battleRange = msg.state.range_type || 'district';

            // 竞分模式：仅在游戏进行中保护自己槽位的进度/分数，避免被旧广播覆盖；
            // 回到 waiting / finished 时以房主广播为准，允许被重置
            if (msg.state.mode === 'score' && battlePlayerNumber && msg.state.status === 'playing') {
                var myKey = 'player' + battlePlayerNumber;
                if (battleRoomState && battleRoomState[myKey + '_index'] !== undefined) {
                    msg.state[myKey + '_index'] = battleRoomState[myKey + '_index'];
                }
                if (battleRoomState && battleRoomState[myKey + '_score'] !== undefined) {
                    msg.state[myKey + '_score'] = battleRoomState[myKey + '_score'];
                }
                if (battleRoomState && battleRoomState.replay && battleRoomState.replay[myKey]) {
                    if (!msg.state.replay) msg.state.replay = {};
                    msg.state.replay[myKey] = battleRoomState.replay[myKey];
                }
            }

            battleRoomState = msg.state;
            applyRoomState(msg.state);
            return;
        }
        if (msg.type === 'leave') {
            document.getElementById('battleRoomInfo').textContent = '⚠️ 房主已解散房间';
            document.getElementById('battleQuestion').textContent = '房间已解散';
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;
            document.getElementById('battleGiveUpBtn').disabled = true;
            if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
            cleanupBattle();
            return;
        }
    }
}

// ==================== 广播房间状态（房主） ====================

function broadcastRoomState() {
    // 房主自己先应用
    applyRoomState(battleRoomState);

    // 发给所有已连接的玩家
    Object.keys(battleConns).forEach(function (k) {
        var conn = battleConns[k];
        if (conn && conn.open) {
            try { conn.send({ type: 'state', state: battleRoomState }); } catch (e) {}
        }
    });
}

// ==================== 应用房间状态 ====================

function applyRoomState(room) {
    if (!room) return;

    // 分数显示
    var scoreParts = [];
    for (var i = 1; i <= 4; i++) {
        var n = room['player' + i];
        if (n) scoreParts.push(n + ': ' + (room['player' + i + '_score'] || 0) + ' 分');
    }
    document.getElementById('battleScore').innerHTML = scoreParts.length > 0
        ? scoreParts.join(' | ')
        : '等待对手加入...';

    var modeText = room.mode === 'race' ? '🏁 竞速' : '📊 竞分';
    var targetText = room.mode === 'race'
        ? '目标 ' + room.target_score + ' 分'
        : '限时 ' + room.duration + ' 秒';
    var rangeText = room.range_type === 'city' ? '地级市' : '县级';
    var modeInfo = '<span style="font-size:12px;color:#666;">' + modeText + ' · ' + targetText + ' · ' + rangeText + '</span>';

    if (room.mode === 'score') {
        document.getElementById('battleGiveUpBtn').textContent = '🔄 换一个';
    } else {
        document.getElementById('battleGiveUpBtn').textContent = '🏳️ 放弃';
    }

    // ===== waiting =====
    if (room.status === 'waiting') {
        if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
        window._scoreStarted = false;
        battleSubmitLock = false;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleQuestion').textContent =
            (room.mode === 'score' && room.player2) ? '等待房主开始...' : '等待对手加入...';
        document.getElementById('battleStartBtn').style.display =
            (room.mode === 'score' && battlePlayerNumber === 1) ? 'block' : 'none';

        if (room.mode === 'score') {
            var joined = 0;
            for (var j = 1; j <= 4; j++) if (room['player' + j]) joined++;
            var maxP = room.max_players || 4;
            document.getElementById('battleRoomInfo').innerHTML =
                '房间号: ' + battleRoomId + ' | 等待玩家（' + joined + '/' + maxP + '）...<br>' + modeInfo;
        } else {
            document.getElementById('battleRoomInfo').innerHTML =
                '房间号: ' + battleRoomId + ' | 等待对手加入...<br>' + modeInfo;
        }
        battleDisplayedSeq = -1;
        if (typeof clearMap === 'function') clearMap();
        return;
    }

    // ===== playing =====
    if (room.status === 'playing') {
        if (!window._battleReadySoundPlayed && room.player2) {
            window._battleReadySoundPlayed = true;
            playSound('ready');
        }
        document.getElementById('battleStartBtn').style.display = 'none';

        if (!(room.mode === 'score' && battleTimer)) {
            document.getElementById('battleRoomInfo').innerHTML =
                '房间号: ' + battleRoomId + ' | 对战进行中！<br>' + modeInfo;
        }

        // ----- 竞速：共享题目 -----
        if (room.mode === 'race') {
            var seq = room.question_seq || 0;

            if (!room.current_question) {
                document.getElementById('battleInput').disabled = true;
                document.getElementById('battleSubmitBtn').disabled = true;
                if (room._tip) {
                    document.getElementById('battleQuestion').textContent = room._tip;
                } else if (room.player1_giveup && room.player2_giveup) {
                    document.getElementById('battleQuestion').textContent = '🏳️ 双方都放弃，换新题...';
                } else if (room.player1_giveup || room.player2_giveup) {
                    var iAmP1 = (battlePlayerNumber === 1);
                    var iAmGiveup = iAmP1 ? room.player1_giveup : room.player2_giveup;
                    document.getElementById('battleQuestion').textContent = iAmGiveup
                        ? '🏳️ 你已放弃，等待对方...'
                        : '🏳️ 对方已放弃，等待你决定...';
                } else {
                    document.getElementById('battleQuestion').textContent =
                        battlePlayerNumber === 1 ? '⏳ 出题中...' : '⏳ 等待出题...';
                }
                return;
            }

            if (seq !== battleDisplayedSeq) {
                battleDisplayedSeq = seq;
                document.getElementById('battleInput').value = '';
                document.getElementById('battleInput').disabled = false;
                document.getElementById('battleSubmitBtn').disabled = false;
                document.getElementById('battleQuestion').textContent =
                    room.range_type === 'city' ? '请猜地级市' : '请猜区县';
                document.getElementById('battleGiveUpBtn').disabled = false;
                battleSubmitLock = false;
                loadBattleDistrict(room.current_question);
            }
            return;
        }

        // ----- 竞分：各自独立 -----
        if (room.mode === 'score') {
            // 玩家：收到 playing 时启动自己的倒计时（只启动一次）
            if (battlePlayerNumber !== 1 && !battleTimer && !window._scoreStarted) {
                window._scoreStarted = true;
                startScoreBattle();
            }
            // 房主已经点「开始游戏」启动过，不重复
        }
        return;
    }

    // ===== finished =====
    if (room.status === 'finished') {
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }

        var winner = '平局';
        var maxScore = -1, winnerNames = [];
        for (var k = 1; k <= 4; k++) {
            var n2 = room['player' + k];
            if (!n2) continue;
            var s = room['player' + k + '_score'] || 0;
            if (s > maxScore) { maxScore = s; winnerNames = [n2]; }
            else if (s === maxScore) winnerNames.push(n2);
        }
        if (winnerNames.length > 1) winner = '平局';
        else if (winnerNames.length === 1) winner = winnerNames[0] + ' 获胜';
        document.getElementById('battleRoomInfo').textContent = '🏆 ' + winner;
        showBattleResult(room, winner);
    }
}

// ==================== 房主出题（竞速） ====================

function hostPublishQuestion() {
    if (battlePlayerNumber !== 1) return;
    if (!battleRoomState) return;
    if (battleHostLock) return;
    battleHostLock = true;

    try {
        var used = battleRoomState.used_questions || {};
        var q = pickBattleQuestion(used);
        battleRoomState.used_questions = used;
        battleRoomState.question_seq = (battleRoomState.question_seq || 0) + 1;
        battleRoomState.current_question = q;
        battleRoomState.player1_giveup = false;
        battleRoomState.player2_giveup = false;
        broadcastRoomState();
    } finally {
        battleHostLock = false;
    }
}

// ==================== 提交答案 ====================

function submitBattleAnswer() {
    if (!battleConn && battlePlayerNumber !== 1) {
        alert('未连接到房间');
        return;
    }
    if (battleSubmitLock) return;
    var now = Date.now();
    if (now - battleLastSubmitTime < 300) return;
    battleLastSubmitTime = now;

    var input = document.getElementById('battleInput').value.trim();
    if (!input) return;

    battleSubmitLock = true;
    document.getElementById('battleSubmitBtn').disabled = true;
    document.getElementById('battleInput').disabled = true;

    var targetName = null;
    if (battleMode === 'score') {
        // 竞分：从本地题库+自己的进度取
        if (battleRoomState && battleRoomState.question_pool && battleRoomState.question_pool.length > 0) {
            var myIndex = (battlePlayerNumber === 1)
                ? (battleRoomState.player1_index || 0)
                : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0);
            targetName = battleRoomState.question_pool[myIndex % battleRoomState.question_pool.length];
        }
    } else {
        targetName = battleRoomState ? battleRoomState.current_question : null;
    }

    if (!targetName) {
        battleSubmitLock = false;
        document.getElementById('battleSubmitBtn').disabled = false;
        document.getElementById('battleInput').disabled = false;
        return;
    }
    if (targetName === '海西蒙古族藏族自治州直辖') targetName = '大柴旦行政委员会';

    var match = matchForMode(input, (battleRoomState && battleRoomState.range_type === 'city') ? 'normal' : 'hard');
    var correct = false, correctName = '';

    if (match.status === 'exact' || match.status === 'partial') {
        var matchHasParen = match.name.includes('（');
        var targetHasParen = targetName.includes('（');
        if (matchHasParen || targetHasParen) {
            correct = match.name === targetName;
        } else {
            var matchBase = match.name.replace(/（.+?）$/, '');
            var targetBase = targetName.replace(/（.+?）$/, '');
            correct = match.name === targetName || matchBase === targetBase;
        }
        if (correct) correctName = targetName;
    } else if (match.status === 'none') {
        var baseInput = input.replace(/（.+?）$/, '');
        var possible = Object.keys(ADJACENCY).filter(function (name) {
            var aliases = aliasMap[name] || [name];
            return aliases.includes(baseInput) ||
                   aliases.includes(baseInput + '区') ||
                   aliases.includes(baseInput + '县') ||
                   aliases.includes(baseInput + '市');
        });
        if (possible.length > 1) {
            document.getElementById('battleQuestion').textContent = '⚠️ 请输入更完整名称';
            battleSubmitLock = false;
            document.getElementById('battleSubmitBtn').disabled = false;
            document.getElementById('battleInput').disabled = false;
            return;
        }
    }

    document.getElementById('battleInput').value = '';

    if (correct) {
        playSound('correct');
        document.getElementById('battleQuestion').textContent = '✅ 答对了！是 ' + correctName;

        // ==================== 竞分：各自独立 ====================
        if (battleMode === 'score') {
            if (battlePlayerNumber === 1) {
                battleRoomState.player1_score = (battleRoomState.player1_score || 0) + 1;
                battleRoomState.player1_index = (battleRoomState.player1_index || 0) + 1;
                battleRoomState.correct_log.push({
                    question: targetName,
                    player: battleRoomState.player1,
                    playerNumber: 1,
                    time: new Date().toLocaleTimeString(),
                    seq: battleRoomState.player1_index
                });
                broadcastRoomState();
            } else {
                battleRoomState['player' + battlePlayerNumber + '_score'] =
                    (battleRoomState['player' + battlePlayerNumber + '_score'] || 0) + 1;
                battleRoomState['player' + battlePlayerNumber + '_index'] =
                    (battleRoomState['player' + battlePlayerNumber + '_index'] || 0) + 1;
                battleRoomState.correct_log.push({
                    question: targetName,
                    player: battleRoomState['player' + battlePlayerNumber],
                    playerNumber: battlePlayerNumber,
                    time: new Date().toLocaleTimeString(),
                    seq: battleRoomState['player' + battlePlayerNumber + '_index']
                });
            }

            var answeredIdx = (battlePlayerNumber === 1)
                ? (battleRoomState.player1_index - 1)
                : (battleRoomState['player' + battlePlayerNumber + '_index'] - 1);
            scoreMarkCorrect(answeredIdx);

            if (battlePlayerNumber !== 1) {
                battleConn.send({
                    type: 'score_correct',
                    question: targetName,
                    playerNumber: battlePlayerNumber,
                    score: battleRoomState['player' + battlePlayerNumber + '_score'],
                    newIndex: battleRoomState['player' + battlePlayerNumber + '_index'],
                    replayItem: (battleRoomState.replay && battleRoomState.replay['player' + battlePlayerNumber]) ? battleRoomState.replay['player' + battlePlayerNumber][answeredIdx] : null
                });
            }
            setTimeout(function () {
                if (!battleTimer) return;
                battleSubmitLock = false;
                scoreLoadOwnQuestion();
            }, 500);
            return;
        }

        // ==================== 竞速：抢答 ====================
        if (battlePlayerNumber === 1) {
            battleRoomState.player1_score = (battleRoomState.player1_score || 0) + 1;
            battleRoomState.correct_log.push({
                question: targetName,
                player: battleRoomState.player1,
                playerNumber: 1,
                time: new Date().toLocaleTimeString(),
                seq: battleRoomState.question_seq
            });
            battleSubmitLock = true;
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;

            Object.keys(battleConns).forEach(function (k) {
                var conn = battleConns[k];
                if (conn && conn.open) {
                    try { conn.send({ type: 'tip', text: '📢 对方已答对，等待出题...' }); } catch (e) {}
                    try { conn.send({ type: 'lock' }); } catch (e) {}
                }
            });

            broadcastRoomState();

            setTimeout(function () {
                if (battleRoomState.player1_score >= battleRoomState.target_score) {
                    battleRoomState.status = 'finished';
                    battleRoomState.winner = 'player1';
                    battleRoomState.current_question = null;
                    broadcastRoomState();
                    return;
                }
                battleRoomState.current_question = null;
                battleRoomState.player1_giveup = false;
                battleRoomState.player2_giveup = false;
                hostPublishQuestion();
                broadcastRoomState();
            }, 500);
        } else {
            // 玩家抢答成功
            battleConn.send({
                type: 'correct',
                question: targetName,
                playerNumber: battlePlayerNumber
            });
        }
    } else {
        playSound('wrong');
        document.getElementById('battleQuestion').textContent = '❌ 再试试！';
        battleSubmitLock = false;
        document.getElementById('battleSubmitBtn').disabled = false;
        document.getElementById('battleInput').disabled = false;
        document.getElementById('battleInput').focus();
    }
}

// ==================== 放弃 / 换一个 ====================

function giveUpBattle() {
    if (battleMode === 'score') {
        // 竞分：换一个（只推进自己的进度）
        if (!battleTimer) return;
        if (battleSubmitLock) return;
        playSound('click');
        battleSubmitLock = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleQuestion').textContent = '🔄 换题中...';
        setTimeout(function () {
            if (!battleTimer) { battleSubmitLock = false; return; }

            var skipIdx = (battlePlayerNumber === 1)
                ? (battleRoomState.player1_index || 0)
                : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0);
            scoreMarkSkip();
            if (battlePlayerNumber === 1) {
                battleRoomState.player1_index = (battleRoomState.player1_index || 0) + 1;
                broadcastRoomState();
            } else {
                battleRoomState['player' + battlePlayerNumber + '_index'] =
                    (battleRoomState['player' + battlePlayerNumber + '_index'] || 0) + 1;
                battleConn.send({
                    type: 'score_skip',
                    playerNumber: battlePlayerNumber,
                    newIndex: battleRoomState['player' + battlePlayerNumber + '_index'],
                    replayItem: (battleRoomState.replay && battleRoomState.replay['player' + battlePlayerNumber]) ? battleRoomState.replay['player' + battlePlayerNumber][skipIdx] : null
                });
            }

            battleSubmitLock = false;
            scoreLoadOwnQuestion();
        }, 300);
        return;
    }

    // 竞速：放弃
    if (!battleConn && battlePlayerNumber !== 1) return;
    playSound('click');
    document.getElementById('battleGiveUpBtn').disabled = true;
    document.getElementById('battleInput').disabled = true;

    if (battlePlayerNumber === 1) {
        if (!battleRoomState || !battleRoomState.current_question) {
            document.getElementById('battleGiveUpBtn').disabled = false;
            document.getElementById('battleInput').disabled = false;
            return;
        }
        battleRoomState.player1_giveup = true;

        var allGiveup = battleRoomState.player1_giveup;
        if (battleRoomState.player2 && !battleRoomState.player2_giveup) allGiveup = false;

        if (allGiveup) {
            document.getElementById('battleQuestion').textContent = '🏳️ 双方都放弃，换新题...';
            battleRoomState.current_question = null;
            battleRoomState.player1_giveup = false;
            battleRoomState.player2_giveup = false;
            Object.keys(battleConns).forEach(function (k) {
                var conn = battleConns[k];
                if (conn && conn.open) {
                    try { conn.send({ type: 'tip', text: '🏳️ 双方都放弃，换新题...' }); } catch (e) {}
                }
            });
            hostPublishQuestion();
        } else {
            document.getElementById('battleQuestion').textContent = '🏳️ 你已放弃，等待对方...';
            Object.keys(battleConns).forEach(function (k) {
                var conn = battleConns[k];
                if (conn && conn.open) {
                    try { conn.send({ type: 'tip', text: '🏳️ 对方已放弃，等待你决定...' }); } catch (e) {}
                }
            });
        }
        broadcastRoomState();
    } else {
        document.getElementById('battleQuestion').textContent = '🏳️ 你已放弃，等待对方...';
        battleConn.send({
            type: 'giveup',
            seq: battleRoomState ? battleRoomState.question_seq : 0
        });
    }
}

// ==================== 玩家中途退出（房主） ====================

function resetRoomToWaiting() {
    if (battlePlayerNumber !== 1) return;
    if (!battleRoomState) return;

    battleRoomState.player2 = null;
    battleRoomState.player3 = null;
    battleRoomState.player4 = null;
    battleRoomState.player1_score = 0;
    battleRoomState.player2_score = 0;
    battleRoomState.player3_score = 0;
    battleRoomState.player4_score = 0;
    battleRoomState.player1_giveup = false;
    battleRoomState.player2_giveup = false;
    battleRoomState.player1_index = 0;
    battleRoomState.player2_index = 0;
    battleRoomState.player3_index = 0;
    battleRoomState.player4_index = 0;
    battleRoomState.current_question = null;
    battleRoomState.question_seq = 0;
    battleRoomState.used_questions = {};
    battleRoomState.correct_log = [];
    battleRoomState.winner = null;
    battleRoomState.question_pool = [];
    battleRoomState.status = 'waiting';

    battleDisplayedSeq = -1;
    battleResultShown = false;
    window._battleReadySoundPlayed = false;
    window._scoreStarted = false;

    broadcastRoomState();

    if (battleMode === 'score') {
        document.getElementById('battleStartBtn').style.display = 'block';
    }
}

// ==================== 竞分：中途退出彻底重置 ====================

function resetScoreRoomToWaiting() {
    if (battlePlayerNumber !== 1) return;
    if (!battleRoomState) return;

    // 停倒计时
    if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
    window._scoreStarted = false;
    battleSubmitLock = false;
    battleResultShown = false;

    // 只重置分数/进度，不清玩家（退出的那个已在调用处清掉）
    for (var i = 1; i <= 4; i++) {
        if (!battleRoomState['player' + i]) continue;
        battleRoomState['player' + i + '_score'] = 0;
        battleRoomState['player' + i + '_index'] = 0;
    }

    // 换一套题库
    var pool = getBattlePool();
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    battleRoomState.question_pool = shuffled.slice(0, Math.min(200, shuffled.length));

    battleRoomState.current_question = null;
    battleRoomState.question_seq = 0;
    battleRoomState.used_questions = {};
    battleRoomState.correct_log = [];
    battleRoomState.replay = {};
    battleRoomState.winner = null;
    battleRoomState.status = 'waiting';

    battleDisplayedSeq = -1;
    window._battleReadySoundPlayed = false;

    // 禁用输入
    document.getElementById('battleInput').disabled = true;
    document.getElementById('battleSubmitBtn').disabled = true;
    document.getElementById('battleGiveUpBtn').disabled = true;
    document.getElementById('battleQuestion').textContent = '等待房主开始...';
    document.getElementById('battleStartBtn').style.display = 'block';

    broadcastRoomState();
    if (typeof clearMap === 'function') clearMap();
}

// ==================== 离开房间 ====================

function leaveBattleRoom() {
    playSound('click');
    try {
        if (battlePlayerNumber === 1) {
            Object.keys(battleConns).forEach(function (k) {
                var conn = battleConns[k];
                if (conn && conn.open) {
                    try { conn.send({ type: 'leave' }); } catch (e) {}
                }
            });
        } else if (battleConn && battleConn.open) {
            battleConn.send({ type: 'leave' });
        }
    } catch (e) {}

    cleanupBattle();
    var brp = document.getElementById('battleRoomPanel');
    brp.classList.remove('pop-in');
    brp.style.display = 'none';
    document.getElementById('battlePanel').style.display = 'block';
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleInput').value = '';
    if (map) newRound();
}

// ==================== 收起/展开 ====================

function toggleBattleCollapse() {
    var brp = document.getElementById('battleRoomPanel');
    var btn = document.getElementById('battleCollapseBtn');
    if (brp.classList.contains('collapsed')) {
        brp.querySelectorAll('#battleRoomInfo, #battleCopyRoomBtn, #battleScore, #battleQuestion, #battleInput, #battleSubmitBtn, #battleGiveUpBtn, #btnBattleLeave').forEach(function (el) {
            el.style.display = (el.id === 'battleCopyRoomBtn') ? 'block' : '';
        });
        brp.classList.remove('collapsed');
        btn.textContent = '收起';
    } else {
        brp.querySelectorAll('#battleRoomInfo, #battleCopyRoomBtn, #battleScore, #battleQuestion, #battleInput, #battleSubmitBtn, #battleGiveUpBtn, #btnBattleLeave').forEach(function (el) {
            el.style.display = 'none';
        });
        brp.classList.add('collapsed');
        btn.textContent = '展开';
    }
}

function copyBattleRoomId() {
    if (!battleRoomId) return;
    playSound('click');
    var btn = document.getElementById('battleCopyRoomBtn');
    function done() {
        btn.textContent = '✅ 已复制';
        setTimeout(function () { btn.textContent = '📋 复制房间号'; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(battleRoomId).then(done).catch(function () {
            fallbackCopy(battleRoomId);
            done();
        });
    } else {
        fallbackCopy(battleRoomId);
        done();
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
}

// ==================== 竞分：倒计时 + 各答各的 ====================

function startScoreBattle() {
    if (battleTimer) return;
    if (!battleRoomState) return;

    var duration = battleRoomState.duration || 60;
    battleScoreStartTime = Date.now();
    var endTime = battleScoreStartTime + duration * 1000;
    document.getElementById('battleRoomInfo').textContent = '⏱ 剩余时间: ' + duration + '秒';
    document.getElementById('battleGiveUpBtn').disabled = false;

    // 加载自己那题
    scoreLoadOwnQuestion();

    battleTimer = setInterval(function () {
        var timeLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        var rangeText = battleRange === 'city' ? '地级市' : '县级';
        document.getElementById('battleRoomInfo').innerHTML =
            '⏱ 剩余时间: ' + timeLeft + '秒<br><span style="font-size:12px;color:#666;">📊 竞分 · 限时 ' + duration + ' 秒 · ' + rangeText + '</span>';

        if (timeLeft <= 0) {
            clearInterval(battleTimer);
            battleTimer = null;
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleGiveUpBtn').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;

            if (battlePlayerNumber === 1 && battleRoomState) {
                scoreFinalizeReplay();
                var maxS = -1, winnerSlot = null, tie = false;
                for (var i = 1; i <= 4; i++) {
                    if (!battleRoomState['player' + i]) continue;
                    var s = battleRoomState['player' + i + '_score'] || 0;
                    if (s > maxS) { maxS = s; winnerSlot = i; tie = false; }
                    else if (s === maxS) tie = true;
                }
                battleRoomState.status = 'finished';
                battleRoomState.winner = tie ? 'tie' : ('player' + winnerSlot);
                broadcastRoomState();
            }
        }
    }, 1000);
}

function scoreLoadOwnQuestion() {
    if (!battleRoomState || !battleRoomState.question_pool || battleRoomState.question_pool.length === 0) return;

    var myIndex = (battlePlayerNumber === 1)
        ? (battleRoomState.player1_index || 0)
        : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0);

    var pool = battleRoomState.question_pool;
    var q = pool[myIndex % pool.length];

    document.getElementById('battleInput').value = '';
    document.getElementById('battleQuestion').textContent =
        (battleRoomState && battleRoomState.range_type === 'city') ? '请猜地级市' : '请猜区县';
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleSubmitBtn').disabled = false;
    document.getElementById('battleGiveUpBtn').disabled = false;
    battleSubmitLock = false;
    scoreMarkQuestionStart();
    loadBattleDistrict(q);
}

// ==================== 竞分：复盘记录 ====================

// 初始化某玩家当前题的开始时间（在加载自己的题时调用）
function scoreMarkQuestionStart() {
    if (!battleRoomState) return;
    if (!battleRoomState.replay) battleRoomState.replay = {};
    var key = 'player' + battlePlayerNumber;
    if (!battleRoomState.replay[key]) battleRoomState.replay[key] = [];
    var myIndex = (battlePlayerNumber === 1)
        ? (battleRoomState.player1_index || 0)
        : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0);
    // 记录该题开始时间
    if (!battleRoomState.replay[key][myIndex] || battleRoomState.replay[key][myIndex].status === 'pending') {
        battleRoomState.replay[key][myIndex] = {
            q: (battleRoomState.question_pool && battleRoomState.question_pool[myIndex % battleRoomState.question_pool.length]) || null,
            status: 'pending',
            start: Date.now()
        };
    }
}

// 答对时写入用时（answeredIndex：刚答对的题号，即加分前的 index）
function scoreMarkCorrect(answeredIndex) {
    if (!battleRoomState || !battleRoomState.replay) return;
    var startT = battleRoomState._startTime || battleScoreStartTime;
    var key = 'player' + battlePlayerNumber;
    var arr = battleRoomState.replay[key] || [];
    var myIndex = (answeredIndex !== undefined)
        ? answeredIndex
        : ((battlePlayerNumber === 1)
            ? (battleRoomState.player1_index || 0)
            : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0));
    var item = arr[myIndex];
    if (item) {
        var sec = ((Date.now() - startT) / 1000).toFixed(1);
        item.status = 'correct';
        item.sec = sec;
    }
}

// 换一个时写入跳过
function scoreMarkSkip() {
    if (!battleRoomState || !battleRoomState.replay) return;
    var key = 'player' + battlePlayerNumber;
    var arr = battleRoomState.replay[key] || [];
    var myIndex = (battlePlayerNumber === 1)
        ? (battleRoomState.player1_index || 0)
        : (battleRoomState['player' + battlePlayerNumber + '_index'] || 0);
    var item = arr[myIndex];
    if (item) {
        item.status = 'skip';
    } else {
        arr[myIndex] = {
            q: (battleRoomState.question_pool && battleRoomState.question_pool[myIndex % battleRoomState.question_pool.length]) || null,
            status: 'skip'
        };
    }
}

// 结算前：把所有人未完成的题标为“时间到”，并补齐空位
function scoreFinalizeReplay() {
    if (!battleRoomState) return;
    if (!battleRoomState.replay) battleRoomState.replay = {};
    var pool = battleRoomState.question_pool || [];

    // 找到最多题数
    var maxSeen = 0;
    for (var i = 1; i <= 4; i++) {
        if (!battleRoomState['player' + i]) continue;
        var idx = battleRoomState['player' + i + '_index'] || 0;
        if (idx > maxSeen) maxSeen = idx;
    }

    for (var s = 1; s <= 4; s++) {
        if (!battleRoomState['player' + s]) continue;
        var key = 'player' + s;
        if (!battleRoomState.replay[key]) battleRoomState.replay[key] = [];
        var arr = battleRoomState.replay[key];
        for (var m = 0; m < maxSeen; m++) {
            if (!arr[m]) {
                arr[m] = { q: pool.length > 0 ? pool[m % pool.length] : null, status: 'timeout' };
            } else if (arr[m].status === 'pending') {
                arr[m].status = 'timeout';
            }
        }
    }
}

// ==================== 结算 ====================

function showBattleResult(room, winner) {
    if (battleResultShown) return;
    var hasOther = !!(room.player2);
    if (!hasOther) { battleResultShown = true; return; }
    battleResultShown = true;
    playSound('complete');

    var overlay = document.createElement('div');
    overlay.id = 'battleResultOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'battleResultPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;text-align:center;min-width:0;width:90vw;max-width:400px;opacity:0;transition:opacity 0.3s ease;';

    var playerCount = 0;
    for (var i = 1; i <= 4; i++) if (room['player' + i]) playerCount++;

    var html = '';
    if (playerCount >= 3) {
        // 多人排行榜
        var players = [];
        for (var i2 = 1; i2 <= 4; i2++) {
            if (room['player' + i2]) {
                players.push({
                    slot: i2,
                    name: room['player' + i2],
                    score: room['player' + i2 + '_score'] || 0
                });
            }
        }
        players.sort(function (a, b) { return b.score - a.score; });
        html += '<div style="font-size:24px;font-weight:bold;margin-bottom:15px;color:#4a6cf7;">🏆 排行榜</div>';
        players.forEach(function (p, i) {
            var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : ''));
            var isMe = (p.slot === battlePlayerNumber);
            html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;'
                + (isMe ? 'font-weight:bold;color:#4a6cf7;' : '') + '">'
                + '<span>' + medal + ' ' + p.name + (isMe ? '（你）' : '') + '</span>'
                + '<span>' + p.score + ' 分</span>'
                + '</div>';
        });
    } else {
        // 1v1
        var iAmP1 = battlePlayerNumber === 1;
        var isDraw = room.winner === 'tie' ||
                     (!room.winner && room.player1_score === room.player2_score);
        var isWinner = !isDraw && (
            (room.winner === 'player1' && iAmP1) ||
            (room.winner === 'player2' && !iAmP1)
        );
        var title, color, emoji;
        if (isDraw) { title = '平局'; color = '#f59e0b'; emoji = '🤝'; }
        else if (isWinner) { title = '你赢了！'; color = '#10b981'; emoji = '🏆'; }
        else { title = '你输了'; color = '#ef4444'; emoji = '😢'; }
        html += '<div style="font-size:64px;margin-bottom:10px;">' + emoji + '</div>'
            + '<div style="font-size:28px;font-weight:bold;color:' + color + ';margin-bottom:20px;">' + title + '</div>'
            + '<div style="font-size:16px;color:#666;margin-bottom:8px;">' + (room.player1 || '') + '</div>'
            + '<div style="font-size:32px;font-weight:bold;color:#4a6cf7;margin-bottom:15px;">' + (room.player1_score || 0) + ' : ' + (room.player2_score || 0) + '</div>'
            + '<div style="font-size:16px;color:#666;margin-bottom:25px;">' + (room.player2 || '') + '</div>';
    }

    html += '<button id="battleResultCloseBtn" style="padding:12px 40px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;">返回</button>';

    saveBattleRecord(room);
    panel.innerHTML = html;
    document.body.appendChild(panel);
    setTimeout(function () { panel.style.opacity = '1'; }, 10);

    document.getElementById('battleResultCloseBtn').onclick = function () {
        playSound('click');
        panel.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(function () {
            panel.remove();
            overlay.remove();
            document.getElementById('battleRoomPanel').style.display = 'block';
        }, 300);
    };
}

function saveBattleRecord(room) {
    if (!room) return;
    var records = JSON.parse(localStorage.getItem('battleRecords') || '[]');
    var exists = records.find(function (r) { return r.roomId === battleRoomId; });
    if (exists) { battleHistory = []; return; }

    var players = [];
    for (var i = 1; i <= 4; i++) {
        if (room['player' + i]) {
            players.push({ name: room['player' + i], score: room['player' + i + '_score'] || 0 });
        }
    }

    var record = {
        time: new Date().toLocaleString(),
        roomId: battleRoomId,
        mode: room.mode,
        targetScore: room.target_score,
        duration: room.duration,
        rangeType: room.range_type || 'district',
        player1: room.player1,
        player2: room.player2,
        player3: room.player3,
        player4: room.player4,
        player1Score: room.player1_score,
        player2Score: room.player2_score,
        player3Score: room.player3_score,
        player4Score: room.player4_score,
        players: players,
        winner: room.winner || null,
        history: (room.correct_log || []).slice(),
        replay: room.replay || {}
    };
    records.unshift(record);
    if (records.length > 20) records.pop();
    localStorage.setItem('battleRecords', JSON.stringify(records));
    battleHistory = [];
}

// ==================== 战斗记录 ====================

function showBattleHistory() {
    var records = JSON.parse(localStorage.getItem('battleRecords') || '[]');
    var overlay = document.createElement('div');
    overlay.id = 'battleHistoryOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'battleHistoryPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:25px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:92vw;max-height:80vh;overflow-y:auto;min-width:0;width:92vw;opacity:0;transition:opacity 0.3s ease;';

    var html = '<h3 style="text-align:center;margin-bottom:15px;">📜 战斗记录</h3>';
    if (records.length === 0) {
        html += '<div style="text-align:center;color:#999;padding:20px;">暂无记录</div>';
    } else {
        records.forEach(function (r) {
            var resultText, resultColor;
            if (r.players && r.players.length >= 3) {
                var sorted = r.players.slice().sort(function (a, b) { return b.score - a.score; });
                if (sorted[0].score === sorted[1].score) { resultText = '平局'; resultColor = '#f59e0b'; }
                else { resultText = sorted[0].name + ' 胜'; resultColor = '#10b981'; }
            } else if (r.player1Score > r.player2Score) { resultText = r.player1 + ' 胜'; resultColor = '#10b981'; }
            else if (r.player1Score < r.player2Score) { resultText = r.player2 + ' 胜'; resultColor = '#10b981'; }
            else { resultText = '平局'; resultColor = '#f59e0b'; }

            var rangeText = r.rangeType === 'city' ? '地级市' : '县级';
            var modeText = r.mode === 'race'
                ? '🏁 竞速 · 目标 ' + r.targetScore + ' 分 · ' + rangeText
                : '📊 竞分 · 限时 ' + r.duration + ' 秒 · ' + rangeText;

            var playersHtml;
            if (r.players && r.players.length >= 3) {
                playersHtml = r.players.map(function (p) { return '<span style="color:#4a6cf7;">' + p.name + '</span> <b>' + p.score + '</b>'; }).join(' · ');
            } else {
                playersHtml = '<span style="color:#4a6cf7;">' + r.player1 + '</span> <b>' + r.player1Score + '</b> : <b>' + r.player2Score + '</b> <span style="color:#ef4444;">' + r.player2 + '</span>';
            }

            html += '<div class="battle-record-row" data-room-id="' + r.roomId + '" style="padding:10px;border-bottom:1px solid #eee;position:relative;">' +
                '<input type="checkbox" class="battle-record-check" data-room-id="' + r.roomId + '" style="display:none;position:absolute;left:10px;top:14px;transform:scale(1.3);cursor:pointer;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<div style="font-size:13px;">' + playersHtml + '</div>' +
                    '<div style="font-size:12px;color:' + resultColor + ';font-weight:bold;">' + resultText + '</div>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-top:4px;">' +
                    '<span>' + modeText + '</span>' +
                    '<span>' + r.time + '</span>' +
                '</div>' +
                ((r.history && r.history.length > 0) || (r.replay && Object.keys(r.replay).length > 0) ? '<button onclick="showBattleReplay(\'' + r.roomId + '\')" style="margin-top:6px;padding:4px 8px;font-size:11px;background:#4a6cf7;color:white;border:none;border-radius:4px;cursor:pointer;">📋 复盘</button>' : '') +
                            '</div>';
        });
    }
    html += '<div style="display:flex;gap:6px;margin-top:15px;">'
        + '<button id="battleHistorySelectBtn" style="flex:1;padding:10px;border:none;border-radius:8px;background:#8b5cf6;color:white;cursor:pointer;font-size:13px;">☑️ 选择</button>'
        + '<button id="battleHistoryClearBtn" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ef4444;color:white;cursor:pointer;font-size:13px;">🗑️ 清空全部</button>'
        + '</div>'
        + '<button id="battleHistoryDeleteBtn" style="display:none;width:100%;margin-top:6px;padding:10px;border:none;border-radius:8px;background:#ef4444;color:white;cursor:pointer;font-size:13px;">🗑️ 删除选中</button>'
        + '<button id="battleHistoryCloseBtn" style="display:block;width:100%;margin-top:6px;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;">关闭</button>';

    panel.innerHTML = html;
    document.body.appendChild(panel);
    panel.style.opacity = '1';

    var selecting = false;
    document.getElementById('battleHistorySelectBtn').onclick = function () {
        var checks = panel.querySelectorAll('.battle-record-check');
        var btn = document.getElementById('battleHistorySelectBtn');
        var delBtn = document.getElementById('battleHistoryDeleteBtn');
        selecting = !selecting;
        if (selecting) {
            checks.forEach(function (c) { c.style.display = 'block'; });
            btn.textContent = '✖️ 取消选择';
            delBtn.style.display = 'block';
        } else {
            checks.forEach(function (c) { c.style.display = 'none'; c.checked = false; });
            btn.textContent = '☑️ 选择';
            delBtn.style.display = 'none';
        }
    };
    document.getElementById('battleHistoryDeleteBtn').onclick = function () {
        var checked = panel.querySelectorAll('.battle-record-check:checked');
        if (checked.length === 0) { alert('请先勾选要删除的记录'); return; }
        if (!confirm('确定删除选中的 ' + checked.length + ' 条记录？')) return;
        var idsToDelete = [];
        checked.forEach(function (c) { idsToDelete.push(c.getAttribute('data-room-id')); });
        var all = JSON.parse(localStorage.getItem('battleRecords') || '[]');
        var kept = all.filter(function (r) { return idsToDelete.indexOf(r.roomId) === -1; });
        localStorage.setItem('battleRecords', JSON.stringify(kept));
        panel.remove();
        overlay.remove();
        showBattleHistory();
    };
    document.getElementById('battleHistoryClearBtn').onclick = function () {
        if (!confirm('确定清空全部战斗记录？此操作不可恢复。')) return;
        localStorage.setItem('battleRecords', '[]');
        panel.remove();
        overlay.remove();
        showBattleHistory();
    };
    document.getElementById('battleHistoryCloseBtn').onclick = function () {
        panel.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(function () { panel.remove(); overlay.remove(); }, 300);
    };
    panel.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () { playSound('click'); });
    });
}

// ==================== 复盘 ====================

function showBattleReplay(roomId) {
    var records = JSON.parse(localStorage.getItem('battleRecords') || '[]');
    var record = records.find(function (r) { return r.roomId === roomId; });
    var hasHistory = record && (
        (record.history && record.history.length > 0) ||
        (record.replay && Object.keys(record.replay).length > 0)
    );
    if (!hasHistory) {
        alert('暂无复盘数据');
        return;
    }
    playSound('click');

    // 竞分且有 replay → 矩阵复盘；其余（含竞速）→ 列表复盘
    if (record.mode === 'score' && record.replay && Object.keys(record.replay).length > 0) {
        showScoreMatrixReplay(record);
        return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'replayOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;opacity:0;transition:opacity 0.15s ease;';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'replayPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:20px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:95vw;max-height:80vh;overflow-y:auto;min-width:0;width:95vw;';

    var modeText = record.mode === 'race'
        ? '🏁 竞速 · 目标 ' + record.targetScore + ' 分'
        : '📊 竞分 · 限时 ' + record.duration + ' 秒';
    var rangeText = record.rangeType === 'city' ? '地级市' : '县级';

    var topLine;
    if (record.players && record.players.length >= 3) {
        topLine = record.players.map(function (p) { return p.name + ' <b>' + p.score + '</b>'; }).join(' · ');
    } else {
        topLine = (record.player1 || '') + ' <b>' + record.player1Score + '</b> : <b>' + record.player2Score + '</b> ' + (record.player2 || '');
    }

    var html = '<h3 style="text-align:center;margin-bottom:10px;">📋 对局复盘</h3>' +
        '<div style="text-align:center;font-size:14px;margin-bottom:6px;">' + topLine + '</div>' +
        '<div style="text-align:center;font-size:11px;color:#999;margin-bottom:12px;">' + modeText + ' · ' + rangeText + ' · ' + record.time + '</div>';

    html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<thead><tr style="background:#f5f5f5;">' +
        '<th style="padding:6px;text-align:left;">#</th>' +
        '<th style="padding:6px;text-align:left;">题目</th>' +
        '<th style="padding:6px;text-align:right;">答对者</th>' +
        '</tr></thead><tbody>';
    (record.history || []).forEach(function (h, i) {
        html += '<tr style="border-bottom:1px solid #eee;">' +
            '<td style="padding:6px;color:#999;">' + (i + 1) + '</td>' +
            '<td style="padding:6px;">' + h.question + '</td>' +
            '<td style="padding:6px;text-align:right;color:#10b981;">' + (h.player || '—') + '</td>' +
            '</tr>';
    });
    html += '</tbody></table>';

    html += '<button id="replayCloseBtn" style="display:block;width:100%;margin-top:15px;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;">关闭</button>';

    panel.innerHTML = html;
    document.body.appendChild(panel);
    setTimeout(function () { panel.style.opacity = '1'; }, 10);

    document.getElementById('replayCloseBtn').onclick = function () {
        playSound('click');
        forceCloseAllReplay();
    };
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) forceCloseAllReplay();
    });
}

// ==================== 复盘：全局兜底清理 ====================

function forceCloseAllReplay() {
    document.querySelectorAll('#replayOverlay, #replayPanel').forEach(function (el) { el.remove(); });
}

// ==================== 竞分：矩阵复盘 ====================

function showScoreMatrixReplay(record) {
    var overlay = document.createElement('div');
    overlay.id = 'replayOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;opacity:0;transition:opacity 0.15s ease;';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'replayPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:20px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:95vw;max-height:80vh;overflow-y:auto;min-width:0;width:95vw;';

    var modeText = '📊 竞分 · 限时 ' + record.duration + ' 秒';
    var rangeText = record.rangeType === 'city' ? '地级市' : '县级';

    var topLine;
    if (record.players && record.players.length >= 3) {
        topLine = record.players.map(function (p) { return p.name + ' <b>' + p.score + '</b>'; }).join(' · ');
    } else {
        topLine = (record.player1 || '') + ' <b>' + record.player1Score + '</b> : <b>' + record.player2Score + '</b> ' + (record.player2 || '');
    }

    var html = '<h3 style="text-align:center;margin-bottom:10px;">📋 对局复盘</h3>' +
        '<div style="text-align:center;font-size:14px;margin-bottom:6px;">' + topLine + '</div>' +
        '<div style="text-align:center;font-size:11px;color:#999;margin-bottom:12px;">' + modeText + ' · ' + rangeText + ' · ' + record.time + '</div>';

    var replay = record.replay || {};

    var slots = [];
    for (var si = 1; si <= 4; si++) {
        if (record['player' + si]) slots.push(si);
    }

    var maxSeen = 0;
    slots.forEach(function (s) {
        var arr = replay['player' + s] || [];
        if (arr.length > maxSeen) maxSeen = arr.length;
    });

    function cellText(s, m) {
        var arr = replay['player' + s] || [];
        var it = arr[m];
        if (!it) return '时间到';
        if (it.status === 'correct') return it.sec + 's';
        if (it.status === 'skip') return '跳过';
        return '时间到';
    }

    function qName(m) {
        for (var s2 = 0; s2 < slots.length; s2++) {
            var arr2 = replay['player' + slots[s2]] || [];
            if (arr2[m] && arr2[m].q) return arr2[m].q;
        }
        return '第' + (m + 1) + '题';
    }

    if (slots.length === 2) {
        html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="background:#f5f5f5;">'
            + '<th style="padding:6px;text-align:center;">' + (record['player' + slots[0]] || '') + '</th>'
            + '<th style="padding:6px;text-align:center;">题目</th>'
            + '<th style="padding:6px;text-align:center;">' + (record['player' + slots[1]] || '') + '</th>'
            + '</tr></thead><tbody>';
        for (var m2 = 0; m2 < maxSeen; m2++) {
            html += '<tr style="border-bottom:1px solid #eee;">'
                + '<td style="padding:6px;text-align:center;">' + cellText(slots[0], m2) + '</td>'
                + '<td style="padding:6px;text-align:center;color:#4a6cf7;">' + qName(m2) + '</td>'
                + '<td style="padding:6px;text-align:center;">' + cellText(slots[1], m2) + '</td>'
                + '</tr>';
        }
        html += '</tbody></table>';
    } else {
        html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="background:#f5f5f5;">'
            + '<th style="padding:6px;text-align:left;">题目</th>';
        slots.forEach(function (s) {
            html += '<th style="padding:6px;text-align:center;">' + (record['player' + s] || '') + '</th>';
        });
        html += '</tr></thead><tbody>';
        for (var m3 = 0; m3 < maxSeen; m3++) {
            html += '<tr style="border-bottom:1px solid #eee;">'
                + '<td style="padding:6px;color:#4a6cf7;">' + qName(m3) + '</td>';
            slots.forEach(function (s) {
                html += '<td style="padding:6px;text-align:center;">' + cellText(s, m3) + '</td>';
            });
            html += '</tr>';
        }
        html += '</tbody></table>';
    }

    html += '<button id="replayCloseBtn" style="display:block;width:100%;margin-top:15px;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;">关闭</button>';

    panel.innerHTML = html;
    document.body.appendChild(panel);
    setTimeout(function () { panel.style.opacity = '1'; }, 10);

    document.getElementById('replayCloseBtn').onclick = function () {
        playSound('click');
        forceCloseAllReplay();
    };
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) forceCloseAllReplay();
    });
}

// ==================== 竞分：房主点开始 ====================

function startMultiBattlePeer() {
    if (battlePlayerNumber !== 1) return;
    if (battleMode !== 'score') return;
    if (!battleRoomState) return;

    // 至少要有 1 个玩家
    var hasPlayer = false;
    for (var i = 2; i <= 4; i++) {
        if (battleRoomState['player' + i]) { hasPlayer = true; break; }
    }
    if (!hasPlayer) {
        alert('还没有其他玩家加入');
        return;
    }

    playSound('click');
    document.getElementById('battleStartBtn').style.display = 'none';

    // 生成固定题库（双方共用，保证同题号同题）
    var pool = getBattlePool();
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    battleRoomState.question_pool = shuffled.slice(0, Math.min(200, shuffled.length));

    battleRoomState.status = 'playing';
    battleRoomState._startTime = Date.now();
    for (var j = 1; j <= 4; j++) {
        battleRoomState['player' + j + '_score'] = 0;
        battleRoomState['player' + j + '_index'] = 0;
    }
    battleRoomState.player1_giveup = false;
    battleRoomState.player2_giveup = false;
    battleRoomState.current_question = null;
    battleRoomState.question_seq = 0;
    battleRoomState.used_questions = {};
    battleRoomState.correct_log = [];
    battleRoomState.replay = {};
    battleRoomState.winner = null;

    battleDisplayedSeq = -1;
    battleResultShown = false;
    window._battleReadySoundPlayed = false;
    window._scoreStarted = false;

    broadcastRoomState();
    startScoreBattle();
}