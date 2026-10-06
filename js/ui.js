const SUPABASE_URL = 'https://idcjqdqtdvkqvschnybt.supabase.co';  // ✅ 去掉 Client
const SUPABASE_KEY = 'sb_publishable_03tAFzmENygu60kEhN4FQg_7fkl8Nxa';
const supabaseClient = typeof supabase !== 'undefined' && supabase.createClient ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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
    document.getElementById('battleStartBtn').addEventListener('click', startMultiBattle);
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

function closeMiniGames() {
    playSound('click');
    findDifferentMode = false;

    // 移除“找不同”浮动面板
    const floatPanel = document.getElementById('findDifferentFloatPanel');
    if (floatPanel) floatPanel.remove();
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
            parentCity = DISTRICT_INFO[item.name].city || '';
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
                        // 有上级，按 adcode 前 4 位匹配地级
                        var parentCode = getCityCode(parentCity);
                        if (parentCode) {
                            d = candidates.find(function (x) {
                                return x.adcode && x.adcode.substring(0, 4) === parentCode;
                            });
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
        parentCity = DISTRICT_INFO[name].city || '';
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
                        d = candidates.find(function (x) {
                            return x.adcode && x.adcode.substring(0, 4) === parentCode;
                        });
                    }
                }
                if (!d) d = candidates.find(function (x) { return x.name === baseName; });
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

// ==================== 好友对决 ====================
let battleRoomId = null;
let battlePlayerName = '';
let battlePlayerNumber = null;
let battleSubscription = null;
let battleMode = 'race';
let battleTimer = null;
let battleOwnQuestion = null;
let battleAnswered = false;
let battleQuestionLoaded = false;
let battleLastQuestion = null;
let battleCurrentDisplayed = null;
let battleLastTotalScore = 0;
let battleGiveUpPending = false;
let battleGameStarted = false;
let battleResultShown = false;
let battleHadPlayer2 = false;
let battleRoundSeed = 0;
let battleUsedQuestions = {};
let battleScoreStartTime = 0;
let battleCurrentSeqAnswered = false;
let battleRange = 'district';
let battleFixedPool = [];
let battleMaxPlayers = 4;   // 最多 4 人
let battleQuestionIndex = 0;
let battleHistory = [];
let battleSubmitLock = false;
let battleLastSubmitTime = 0;
let battleCurrentQuestionId = null;
let battleLastUpdateKey = '';
let battleLastPlayers = '';
let battleLastSlots = '';
// 地图缓存
const battleDistrictCache = {};

// 加载对决战地图
function loadBattleDistrict(name) {
    if (!name) return;

    // 特例：高德返回"海西蒙古族藏族自治州直辖"，统一用"大柴旦行政委员会"
    if (name === '海西蒙古族藏族自治州直辖') {
        name = '大柴旦行政委员会';
    }

    lastLoadRequest = { type: 'battle', name: name };
    
    const bm = name.match(/（(.+?)）$/);
    const baseName = bm ? name.replace(/（.+?）$/, '') : name;
    const parentName = bm ? bm[1] : null;
    
    const cacheKey = name;
    
    if (battleDistrictCache[cacheKey]) {
        displayBattleDistrict(battleDistrictCache[cacheKey], name);
        return;
    }

    // 优先：短名 adcode 白名单
    const whitelistAdcodes = (typeof SHORT_NAME_ADCODE !== 'undefined') ? SHORT_NAME_ADCODE[name] : null;
    if (whitelistAdcodes && whitelistAdcodes.length > 0) {
        ds.search(whitelistAdcodes[0], (status, result) => {
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                const d = result.districtList.find(x => x.level === 'district') || result.districtList[0];
                if (d && d.boundaries && d.boundaries.length > 0) {
                    battleDistrictCache[cacheKey] = d;
                    displayBattleDistrict(d, name);
                    return;
                }
            }
            fallback();
        });
        return;
    }

    // 次优：adcode 索引（目前 getAdcodeByName 返回 null，会跳过）
    const battleAdcode = (typeof getAdcodeByName === 'function') ? getAdcodeByName(name) : null;
    if (battleAdcode) {
        ds.search(battleAdcode, (status, result) => {
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                const d = result.districtList.find(x => x.level === 'district') || result.districtList[0];
                if (d && d.boundaries && d.boundaries.length > 0) {
                    battleDistrictCache[cacheKey] = d;
                    displayBattleDistrict(d, name);
                    return;
                }
            }
            fallback();
        });
        return;
    }
    
    // 有 parentName：先确定城市 code，再从城市下辖区县找
    if (parentName) {
        const cityCode = getCityCode(parentName);
        if (cityCode) {
            dsCity.search(cityCode + '00', (s2, r2) => {
                if (s2 === 'complete' && r2.districtList.length > 0) {
                    const subs = r2.districtList[0].districtList || [];
                    const found = subs.find(s => s.name === baseName && s.level === 'district');
                    
                    if (found) {
                        ds.search(found.adcode, (s3, r3) => {
                            if (s3 === 'complete' && r3.districtList.length > 0) {
                                const d = r3.districtList[0];
                                if (d && d.boundaries && d.boundaries.length > 0) {
                                    battleDistrictCache[cacheKey] = d;
                                    displayBattleDistrict(d, name);
                                }
                            }
                        });
                        return;
                    }
                }
                // 找不到，走兜底
                fallback();
            });
            return;
        }
    }
    
    fallback();
    
    function fallback() {
        let retry = 5;
        function attempt() {
            ds.search(baseName, (status, result) => {
                if (status === 'complete' && result.districtList && result.districtList.length > 0) {
                    let d;

                    if (battleRange === 'city') {
                        // 地级模式：优先名称完全相等（不限 level）
                        d = result.districtList.find(x => x.name === baseName);
                        if (!d) d = result.districtList.find(x => x.boundaries && x.boundaries.length > 0) || result.districtList[0];
                    } else {
                        // 县级模式：优先名称完全相等（不限 level，兼容高德把直辖县级标成 city 的情况）
                        d = result.districtList.find(x => x.name === baseName);

                        // 次优：有 parentName 时按城市匹配
                        if (!d && parentName) {
                            d = result.districtList.find(x => {
                                if (x.level !== 'district') return false;
                                const city = getCityName(x.adcode);
                                return city.includes(parentName) || parentName.includes(city);
                            });
                        }

                        // 兜底：第一个有边界的
                        if (!d) {
                            d = result.districtList.find(x => x.boundaries && x.boundaries.length > 0);
                        }
                    }

                    if (d && d.boundaries && d.boundaries.length > 0) {
                        battleDistrictCache[cacheKey] = d;
                        displayBattleDistrict(d, name);
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

function displayBattleDistrict(d, originalName) {
    var displayName = originalName || (d && d.name) || '';
    // 同一题不重复绘制（仅当已画过且题目相同才拦）
    if (displayName && displayName === battleCurrentDisplayed && currentPolygons && currentPolygons.length > 0) {
        return;
    }
    // 无论之前状态如何，先把标记设为当前题，保证 handleBattleUpdate 后续判断正确
    battleCurrentDisplayed = displayName;
    battleLastQuestion = displayName;
    battleCurrentDisplayed = displayName;
    battleLastQuestion = displayName;
    
    if (typeof clearMap === 'function') {
        clearMap();
    }

    // 保险：清掉出题模式的拦截，避免对战地图被误拦截
    if (typeof window._quizIntercept === 'function') {
        window._quizIntercept = null;
    }
    
    if (window.innerWidth <= 768) {
        drawDistrictOnCanvas(d);
    } else {
        showDistrict(d);
    }
}

// 打开面板
function openBattlePanel() {
    playSound('click');
    if (typeof quizCleanup === 'function') quizCleanup();
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

// 关闭面板
function closeBattlePanel() {
    playSound('click');
    const bp = document.getElementById('battlePanel');

    // 淡出
    bp.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    bp.style.opacity = '0';
    bp.style.transform = 'translate(-50%, -50%) scale(0.85)';

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;

        bp.style.display = 'none';
        bp.classList.remove('pop-in');
        bp.style.opacity = '';
        bp.style.transform = '';
        bp.style.transition = '';

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

    bp.addEventListener('transitionend', function handler(e) {
        if (e.target !== bp || e.propertyName !== 'opacity') return;
        bp.removeEventListener('transitionend', handler);
        finish();
    });
    setTimeout(finish, 400);
}

// 生成房间号
function generateRoomId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 进入房间界面
function enterBattleRoom(infoText) {
    document.getElementById('battlePanel').style.display = 'none';
    // 默认隐藏开始按钮，只有房主创建竞分房间时才显示
    document.getElementById('battleStartBtn').style.display = 'none';
    
    // 竞分模式：开局前禁用输入和「换一个」，等房主点开始
    if (battleMode === 'score') {
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
    } else {
        document.getElementById('battleGiveUpBtn').disabled = true;
    }
    document.getElementById('battleQuestion').textContent = '';
    document.getElementById('battleInput').value = '';
    document.getElementById('battleScore').textContent = '';
    
    const brp = document.getElementById('battleRoomPanel');
    brp.style.display = 'block';
    brp.classList.remove('pop-in');
    void brp.offsetWidth;
    brp.classList.add('pop-in');
    
    // 左上角定位
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
    // 显示模式信息
    const modeText = battleMode === 'race' ? '🏁 竞速' : '📊 竞分';
    const targetText = battleMode === 'race' 
        ? `目标 ${document.getElementById('battleTargetScore').value} 分` 
        : `限时 ${document.getElementById('battleDuration').value} 秒`;
    const rangeText = battleRange === 'city' ? '地级市' : '县级';
    infoText = `${infoText}<br><span style="font-size:12px;color:#666;">${modeText} · ${targetText} · ${rangeText}</span>`;
    document.getElementById('battleRoomInfo').innerHTML = infoText;
    // 竞分模式开局前保持禁用；竞速/竞分开始后由各自逻辑启用
    if (battleMode !== 'score') {
        document.getElementById('battleInput').disabled = false;
    }
    document.getElementById('battleInput').value = '';
}

// 创建房间
async function createBattleRoom() {
    if (!supabaseClient) { alert('网络未连接，请刷新'); return; }
    
    // 清理旧房间
    if (battleRoomId) {
        await supabaseClient.from('battle_rooms').delete().eq('id', battleRoomId);
    }
    
    const name = document.getElementById('battlePlayerName').value.trim();
    if (!name) { alert('请输入昵称'); return; }
    
    battlePlayerName = name;
    battlePlayerNumber = 1;
    battleRoomId = generateRoomId();
    battleMode = document.getElementById('battleModeSelect').value;
    battleRange = document.getElementById('battleRangeSelect').value;
    // 竞分模式读人数上限
    if (battleMode === 'score') {
        battleMaxPlayers = parseInt(document.getElementById('battleMaxPlayers').value) || 4;
    } else {
        battleMaxPlayers = 2;
    }
    battleQuestionLoaded = false;
    battleAnswered = false;
    battleSubmitLock = false;
    battleLastQuestion = null;
    battleCurrentDisplayed = null;
    battleLastTotalScore = 0;
    battleGameStarted = false;
    battleResultShown = false;
    battleQuestionIndex = 0;
    battleHistory = [];
    battleCurrentDisplayed = null;
    battleOwnQuestion = null;
    battleAnswered = false;
    battleSubmitLock = false;
    battleUsedQuestions = {};
    battleFixedPool = [];
    window._battleReadySoundPlayed = false;
    battleLastPlayers = '';

    // 竞分模式：题库由房主在开局时生成并写服务器
    battleFixedPool = [];
    const targetScore = parseInt(document.getElementById('battleTargetScore').value) || 5;
    const duration = parseInt(document.getElementById('battleDuration').value) || 60;
    
    const { error } = await supabaseClient
        .from('battle_rooms')
        .insert({
            id: battleRoomId,
            mode: battleMode,
            target_score: targetScore,
            duration: duration,
            range_type: battleRange,
            status: 'waiting',
            player1: name,
            player1_avatar: currentAvatarImage,
            player1_score: 0,
            player2_score: 0,
            player3_score: 0,
            player4_score: 0,
            max_players: battleMaxPlayers
        });
    
    if (error) { alert('创建房间失败: ' + error.message); return; }
    
    enterBattleRoom(`房间号: ${battleRoomId} | 等待对手加入...`);
    document.getElementById('battleScore').textContent = `${name}: 0 分 | 等待对手加入...`;

    // 竞分模式：显示「开始游戏」按钮，房主手动开局
    if (battleMode === 'score') {
        document.getElementById('battleStartBtn').style.display = 'block';
    } else {
        document.getElementById('battleStartBtn').style.display = 'none';
    }

    subscribeBattleRoom();
    
    // 页面关闭/刷新时删除房间
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function handleBeforeUnload() {
    if (!battleRoomId || !SUPABASE_URL || !SUPABASE_KEY) return;

    var headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    if (battlePlayerNumber === 1) {
        // 房主：删除房间
        fetch(SUPABASE_URL + '/rest/v1/battle_rooms?id=eq.' + encodeURIComponent(battleRoomId), {
            method: 'DELETE',
            headers: headers,
            keepalive: true
        }).catch(function () {});
    } else if (battlePlayerNumber >= 2) {
        // 非房主：清空自己的槽位
        var mySlot = 'player' + battlePlayerNumber;
        var obj = {};
        obj[mySlot] = null;
        obj[mySlot + '_score'] = 0;
        obj[mySlot + '_giveup'] = false;
        fetch(SUPABASE_URL + '/rest/v1/battle_rooms?id=eq.' + encodeURIComponent(battleRoomId), {
            method: 'PATCH',
            headers: headers,
            keepalive: true,
            body: JSON.stringify(obj)
        }).catch(function () {});
    }
}

// 加入房间
async function joinBattleRoom() {
    if (!supabaseClient) { alert('网络未连接，请刷新'); return; }
    
    const name = document.getElementById('battlePlayerName').value.trim();
    const roomId = document.getElementById('battleRoomInput').value.trim().toUpperCase();
    
    if (!name) { alert('请输入昵称'); return; }
    if (!roomId) { alert('请输入房间号'); return; }
    
    battlePlayerName = name;
    battleRoomId = roomId;
    battleQuestionLoaded = false;
    battleAnswered = false;
battleSubmitLock = false;
    battleLastQuestion = null;
    battleCurrentDisplayed = null;
    battleLastTotalScore = 0;
    battleGameStarted = false;
    battleResultShown = false;
    battleQuestionIndex = 0;
    battleHistory = [];
    battleCurrentDisplayed = null;
    battleOwnQuestion = null;
    battleAnswered = false;
    battleSubmitLock = false;
    battleFixedPool = [];
    window._scoreStarted = false;
    battleLastPlayers = '';
    // 先查房间是否存在
    const { data: roomCheck } = await supabaseClient
        .from('battle_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
    
    if (!roomCheck) {
        alert('房间不存在');
        return;
    }
    
    // 已开局，不能加入
    if (roomCheck.status === 'playing' || roomCheck.status === 'finished') {
        alert('游戏已开始，无法加入');
        return;
    }

    // 按人数上限找空位
    var maxP = roomCheck.max_players || 4;
    var allSlots = ['player2', 'player3', 'player4'];
    var slots = allSlots.slice(0, maxP - 1);
    var mySlot = null;
    for (var i = 0; i < slots.length; i++) {
        if (!roomCheck[slots[i]]) { mySlot = slots[i]; break; }
    }
    if (!mySlot) {
        alert('房间已满');
        return;
    }

    battlePlayerNumber = parseInt(mySlot.replace('player', ''), 10);
    battleRoundSeed = Math.floor(Math.random() * 1000000);

     var updateObj = {};
    updateObj[mySlot] = name;
    updateObj[mySlot + '_avatar'] = currentAvatarImage;
    updateObj[mySlot + '_score'] = 0;
    updateObj[mySlot + '_giveup'] = false;

    // 竞速：两人齐了直接开局
    if (roomCheck.mode === 'race') {
        updateObj.status = 'playing';
    }

    const { data, error } = await supabaseClient
        .from('battle_rooms')
        .update(updateObj)
        .eq('id', roomId)
        .select();
    
    if (error || !data || data.length === 0) { alert('加入房间失败，检查房间号'); return; }
    
    battleMode = data[0].mode;
    battleRange = data[0].range_type || 'district';
    enterBattleRoom(`房间号: ${battleRoomId} | 对战进行中！`);
    document.getElementById('battleScore').textContent = `${data[0].player1}: ${data[0].player1_score} 分 | ${name}: 0 分`;
    subscribeBattleRoom();
    
    setTimeout(() => {
        if (battleMode === 'race') {
            startRaceQuestion();
        }
        // 竞分模式：不自动开始，等房主点「开始游戏」
    }, 500);
}

async function startMultiBattle() {
    if (!supabaseClient || !battleRoomId) return;
    if (battlePlayerNumber !== 1) return;
    if (battleMode !== 'score') return;

    // 至少要有 1 个非房主玩家
    const { data: room } = await supabaseClient
        .from('battle_rooms')
        .select('player2, player3, player4')
        .eq('id', battleRoomId)
        .single();

    var hasOther = room && (room.player2 || room.player3 || room.player4);
    if (!hasOther) {
        alert('还没有其他玩家加入');
        return;
    }

    playSound('click');
    document.getElementById('battleStartBtn').style.display = 'none';
    window._scoreStarted = true;

    // 重置开局状态，确保双方从第 1 题开始
    battleQuestionIndex = 0;
    battleOwnQuestion = null;
    battleCurrentQuestionId = null;
    battleAnswered = false;
    battleSubmitLock = false;
    battleCurrentSeqAnswered = false;
    battleFixedPool = [];

    await supabaseClient
        .from('battle_rooms')
        .update({ status: 'playing', question_pool: [] })
        .eq('id', battleRoomId);

    document.getElementById('battleGiveUpBtn').disabled = false;

    if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
    startScoreBattle();
}

// 订阅房间变化
let battlePollingTimer = null;

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
                document.getElementById('battleQuestion').textContent = '房间已解散';
                document.getElementById('battleInput').value = '';
                document.getElementById('battleInput').disabled = true;
                document.getElementById('battleSubmitBtn').disabled = true;
                document.getElementById('battleGiveUpBtn').disabled = true;
                // 离开房间按钮保留可用
                if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
                // 清理本地状态
                battleGameStarted = false;
                battleOwnQuestion = null;
                battleQuestionIndex = 0;
                battleFixedPool = [];
                window._scoreStarted = false;
                if (typeof clearMap === 'function') clearMap();
            }
        )
        .subscribe();
    
    // 轮询兜底：每2秒主动查询一次
    if (battlePollingTimer) clearInterval(battlePollingTimer);
    battlePollingTimer = setInterval(async () => {
        if (!battleRoomId) return;
        
        const { data, error } = await supabaseClient
            .from('battle_rooms')
            .select('*')
            .eq('id', battleRoomId)
            .single();
        
      if (data && data.id === battleRoomId) {
          handleBattleUpdate(data);
          // 心跳：刷新 updated_at，防止被定时清理误删
          if (battlePlayerNumber === 1) {
              supabaseClient
                  .from('battle_rooms')
                  .update({ updated_at: new Date().toISOString() })
                  .eq('id', battleRoomId)
                  .then(function () {})
                  .catch(function () {});
          }
        } else if (error || !data) {
            document.getElementById('battleRoomInfo').textContent = '⚠️ 房主已解散房间';
            document.getElementById('battleQuestion').textContent = '房间已解散';
            document.getElementById('battleInput').value = '';
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;
            document.getElementById('battleGiveUpBtn').disabled = true;
            if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
            battleGameStarted = false;
            battleOwnQuestion = null;
            battleQuestionIndex = 0;
            battleFixedPool = [];
            window._scoreStarted = false;
            if (typeof clearMap === 'function') clearMap();
        }
    }, 4000);
}

// 处理房间更新
function handleBattleUpdate(roomData) {
    if (!roomData) return;

    // 去重：如果关键字段都没变，跳过本次处理
    // 注意：不能把本地 battleLastQuestion 参与 key 计算，
    // 否则本地状态被清空后，服务器数据没变会导致永远被去重跳过。
    var updateKey = [
        roomData.player2,
        roomData.player3,
        roomData.player4,
        roomData.status,
        roomData.current_question,
        roomData.question_seq,
        roomData.player1_score,
        roomData.player2_score,
        roomData.player3_score,
        roomData.player4_score,
        roomData.player1_giveup,
        roomData.player2_giveup,
        (roomData.correct_log || []).length
    ].join('|');
    if (updateKey === battleLastUpdateKey) return;
    battleLastUpdateKey = updateKey;

    if (roomData.correct_log && Array.isArray(roomData.correct_log)) {
        battleHistory = roomData.correct_log.slice();
    }
    if (roomData.used_questions && typeof roomData.used_questions === 'object') {
        battleUsedQuestions = roomData.used_questions;
    }
    if (roomData.question_pool && Array.isArray(roomData.question_pool) && roomData.question_pool.length > 0) {
        battleFixedPool = roomData.question_pool;
    }
    // 显示所有玩家分数
    var scoreParts = [];
    ['player1','player2','player3','player4'].forEach(function (slot, i) {
        var n = roomData[slot];
        if (n) {
            var s = roomData[slot + '_score'] || 0;
            scoreParts.push({ name: n, score: s });
        }
    });
    document.getElementById('battleScore').innerHTML = scoreParts.length > 0
        ? scoreParts.map(function (p) {
            return p.name + ': ' + p.score + ' 分';
        }).join(' | ')
        : '等待对手加入...';
    var p1 = roomData.player1 || '玩家1';

    // 检测玩家变化：上一帧的玩家集合和这一帧不同 → 有玩家退出
    var currentPlayers = [roomData.player2, roomData.player3, roomData.player4].join(',');
    var currentSlots = [
        roomData.player2 ? '2' : '',
        roomData.player3 ? '3' : '',
        roomData.player4 ? '4' : ''
    ].join(',');
    var hasOther = !!(roomData.player2 || roomData.player3 || roomData.player4);
    var someoneLeft = (battleLastPlayers && battleLastPlayers !== currentPlayers && battleLastPlayers.length > currentPlayers.length);
    if (someoneLeft) {
        // 找出谁退了（对比上一帧的槽位）
        var prevSlots = battleLastSlots.split(',');
        var currSlots = currentSlots.split(',');
        var quitSlot = null;
        for (var i = 0; i < prevSlots.length; i++) {
            if (prevSlots[i] && currSlots.indexOf(prevSlots[i]) === -1) {
                quitSlot = prevSlots[i];
                break;
            }
        }
        if (quitSlot && battlePlayerNumber === 1 && supabaseClient && battleRoomId) {
            var clearObj = {};
            clearObj['player' + quitSlot] = null;
            clearObj['player' + quitSlot + '_score'] = 0;
            clearObj['player' + quitSlot + '_giveup'] = false;
            supabaseClient
                .from('battle_rooms')
                .update(clearObj)
                .eq('id', battleRoomId)
                .then(function () {}).catch(function () {});
        }
        document.getElementById('battleQuestion').textContent = '⚠️ 玩家已退出，等待新对手加入...';
        document.getElementById('battleInput').value = '';
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleRoomInfo').innerHTML = `房间号: ${battleRoomId} | 等待对手加入...`;

        if (battlePlayerNumber === 1 && supabaseClient && battleRoomId) {
            supabaseClient
                .from('battle_rooms')
                .update({
                    // 只重置游戏状态，不动 player 槽位（退出方已清自己）
                    player1_score: 0, player2_score: 0, player3_score: 0, player4_score: 0,
                    player1_giveup: false, player2_giveup: false, player3_giveup: false, player4_giveup: false,
                    current_question: null, question_seq: 0, correct_log: [], winner: null,
                    status: 'waiting'
                })
                .eq('id', battleRoomId)
                .then(function () {}).catch(function () {});
        }

        battleRoundSeed = Math.floor(Math.random() * 1000000);
        battleGameStarted = false;
        battleLastQuestion = null;
        battleCurrentDisplayed = null;
        battleQuestionLoaded = false;
        battleAnswered = false;
        battleSubmitLock = false;
        battleOwnQuestion = null;
        battleQuestionIndex = 0;
        battleLastTotalScore = 0;
        battleHistory = [];
        battleCurrentQuestionId = null;
        battleFixedPool = [];
         window._battleReadySoundPlayed = false;
         window._scoreStarted = false;
        if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
        if (typeof clearMap === 'function') clearMap();

        // 竞分模式：显示「开始游戏」按钮，房主可重新开局
        if (roomData.mode === 'score' && battlePlayerNumber === 1) {
            document.getElementById('battleStartBtn').style.display = 'block';
            document.getElementById('battleStartBtn').disabled = false;
        }
    }

    battleHadPlayer2 = hasOther;
    battleLastPlayers = currentPlayers;
    battleLastSlots = currentSlots;
    
    const modeText = roomData.mode === 'race' ? '🏁 竞速' : '📊 竞分';
    const targetText = roomData.mode === 'race' 
        ? `目标 ${roomData.target_score} 分` 
        : `限时 ${roomData.duration} 秒`;
    const rangeText = (roomData.range_type === 'city' || battleRange === 'city') ? '地级市' : '县级';
    const modeInfo = `<span style="font-size:12px;color:#666;">${modeText} · ${targetText} · ${rangeText}</span>`;
    
    // 根据模式修改按钮文字
    if (roomData.mode === 'score') {
        document.getElementById('battleGiveUpBtn').textContent = '🔄 换一个';
    } else {
        document.getElementById('battleGiveUpBtn').textContent = '🏳️ 放弃';
    }

    if (roomData.status === 'waiting') {
        // 收到 waiting 就重置本地对局状态（无论之前是什么状态）
        battleGameStarted = false;
        battleLastQuestion = null;
        battleCurrentDisplayed = null;
        battleQuestionLoaded = false;
        battleAnswered = false;
        battleSubmitLock = false;
        battleOwnQuestion = null;
        battleQuestionIndex = 0;
        battleLastTotalScore = 0;
        battleHistory = [];
        battleCurrentQuestionId = null;
        battleFixedPool = [];
        window._battleReadySoundPlayed = false;
        window._scoreStarted = false;
        if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
        if (typeof clearMap === 'function') clearMap();
        document.getElementById('battleInput').value = '';
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleQuestion').textContent = '⚠️ 玩家已退出，等待新对手加入...';

        if (roomData.mode === 'score') {
            var joined = ['player1','player2','player3','player4'].filter(function (s) { return roomData[s]; }).length;
            var maxP = roomData.max_players || 4;
            document.getElementById('battleRoomInfo').innerHTML = `房间号: ${battleRoomId} | 等待玩家（${joined}/${maxP}）...<br>${modeInfo}`;
        } else {
            document.getElementById('battleRoomInfo').innerHTML = `房间号: ${battleRoomId} | 等待对手加入...<br>${modeInfo}`;
        }
    } else if (roomData.status === 'playing') {
        // 人齐提示音（只播一次）
        if (!window._battleReadySoundPlayed && roomData.player2) {
            window._battleReadySoundPlayed = true;
            playSound('ready');
        }

        // 房主：新对手加入（从无到有）时换局号，保证新一局题目不同
        if (battlePlayerNumber === 1 && roomData.player2 && !battleHadPlayer2) {
            battleRoundSeed = Math.floor(Math.random() * 1000000);
        }
        // 竞分模式倒计时中，不覆盖房间信息
        if (!(roomData.mode === 'score' && battleTimer)) {
            document.getElementById('battleRoomInfo').innerHTML = `房间号: ${battleRoomId} | 对战进行中！<br>${modeInfo}`;
        }
        // 竞分模式启用按钮
        if (roomData.mode === 'score') {
            document.getElementById('battleGiveUpBtn').disabled = false;
        }
        // 竞分模式：非房主收到 playing 时启动自己的倒计时（只启动一次）
        if (roomData.mode === 'score' && battlePlayerNumber !== 1 && !battleTimer && !window._scoreStarted) {
            window._scoreStarted = true;
            battleQuestionIndex = 0;
            battleOwnQuestion = null;
            battleCurrentSeqAnswered = false;
            battleFixedPool = [];
            startScoreBattle();
        }
        // 竞速模式：房主启动第一题（人齐 & 还没出题）
        if (roomData.mode === 'race' && battlePlayerNumber === 1 && roomData.player2 && !battleGameStarted && battleLastQuestion === null) {
            startRaceQuestion();
        }

        // 检查双方放弃状态（仅竞速）
        if (roomData.mode === 'race' && roomData.current_question) {
            const myGiveup = battlePlayerNumber === 1 ? roomData.player1_giveup : roomData.player2_giveup;
            const otherGiveup = battlePlayerNumber === 1 ? roomData.player2_giveup : roomData.player1_giveup;
            
            // 双方都放弃：优先处理
            if (roomData.player1_giveup && roomData.player2_giveup) {
                document.getElementById('battleQuestion').textContent = '🏳️ 双方都放弃，换新题...';
                document.getElementById('battleInput').disabled = true;
                document.getElementById('battleGiveUpBtn').disabled = true;
                return;
            }
            
            // 对方已放弃
            if (otherGiveup && !myGiveup) {
                document.getElementById('battleQuestion').textContent = '🏳️ 对方已放弃，等待你决定...';
                return;
            }
            
            // 自己已放弃
            if (myGiveup && !otherGiveup) {
                document.getElementById('battleQuestion').textContent = '🏳️ 你已放弃，等待对方...';
                document.getElementById('battleInput').disabled = true;
                document.getElementById('battleGiveUpBtn').disabled = true;
                return;
            }
        }
        
        // ==================== 竞速模式：题目同步 ====================
        if (roomData.mode === 'race') {
            const totalScore = (roomData.player1_score || 0) + (roomData.player2_score || 0);
            if (totalScore > battleLastTotalScore) {
                battleLastTotalScore = totalScore;
            }
            // 未开局 或 题目被清空 → 房主出下一题
            if (!roomData.current_question && !roomData.player1_giveup && !roomData.player2_giveup) {
                if (battlePlayerNumber === 1) {
                    document.getElementById('battleInput').disabled = true;
                    document.getElementById('battleSubmitBtn').disabled = true;
                    document.getElementById('battleQuestion').textContent = '⏳ 出题中...';
                    if (!window._makingQuestion) {
                        window._makingQuestion = true;
                        startRaceQuestion().finally(function () {
                            window._makingQuestion = false;
                        });
                    }
                } else {
                    document.getElementById('battleInput').disabled = true;
                    document.getElementById('battleSubmitBtn').disabled = true;
                    document.getElementById('battleQuestion').textContent = '⏳ 等待对手出题...';
                }
                return;
            }

            // 题目变化 → 加载
            if (roomData.current_question && roomData.current_question !== battleCurrentDisplayed) {
                battleGameStarted = true;
                battleQuestionLoaded = true;
                battleAnswered = false;
                battleSubmitLock = false;
                battleQuestionIndex = roomData.question_seq || battleQuestionIndex;
                document.getElementById('battleInput').value = '';
                document.getElementById('battleInput').disabled = false;
                document.getElementById('battleSubmitBtn').disabled = false;
                document.getElementById('battleQuestion').textContent = battleRange === 'city' ? '请猜地级市' : '请猜区县';
                document.getElementById('battleGiveUpBtn').disabled = false;
                loadBattleDistrict(roomData.current_question);
            }
        }

    } else if (roomData.status === 'finished') {
        let winner = '平局';
        var maxScore = -1, winnerNames = [];
        ['player1','player2','player3','player4'].forEach(function (slot) {
            var n = roomData[slot];
            if (!n) return;
            var s = roomData[slot + '_score'] || 0;
            if (s > maxScore) { maxScore = s; winnerNames = [n]; }
            else if (s === maxScore) { winnerNames.push(n); }
        });
        if (winnerNames.length > 1) winner = '平局';
        else if (winnerNames.length === 1) winner = winnerNames[0] + ' 获胜';
        else winner = '平局';
        document.getElementById('battleRoomInfo').textContent = `🏆 ${winner}`;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        if (battleTimer) clearInterval(battleTimer);
        
        showBattleResult(roomData, winner);
    }
}

// ==================== 模式1：竞速对决 ====================
async function startRaceQuestion() {
    if (!supabaseClient || !battleRoomId) return;
    if (battlePlayerNumber !== 1) return;

    // 先查服务器当前状态，避免重复出题
    const { data: roomNow } = await supabaseClient
        .from('battle_rooms')
        .select('current_question')
        .eq('id', battleRoomId)
        .single();

    if (roomNow && roomNow.current_question) return;

    battleQuestionIndex = (battleQuestionIndex || 0) + 1;
    const firstQ = getRandomBattleQuestion();

    // 本地清状态：让 handleBattleUpdate 一定走进“题目变化”分支
    battleLastQuestion = null;
    battleCurrentDisplayed = null;

    try {
        await Promise.race([
            supabaseClient
                .from('battle_rooms')
                .update({
                    current_question: firstQ,
                    question_seq: battleQuestionIndex,
                    player1_giveup: false,
                    player2_giveup: false
                })
                .eq('id', battleRoomId),
            new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('出题超时')); }, 3000);
            })
        ]);
    } catch (e) {
        console.error('出题失败', e);
        battleLastQuestion = null;   // 允许下次重试
        return;
    }

    // 本地立即标记
    battleLastQuestion = firstQ;
}

async function recordBattleSkip(seq, questionName, reason) {
    var record = {
        question: questionName,
        player: null,
        playerNumber: battlePlayerNumber,
        time: new Date().toLocaleTimeString(),
        seq: seq,
        elapsed: null,
        skipped: true,
        skipReason: reason || '跳过'
    };
    try {
        await Promise.race([
            supabaseClient.rpc('append_correct_log', {
                room_id: battleRoomId,
                record: record
            }),
            new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('rpc timeout')); }, 1500);
            })
        ]);
    } catch (e) {
        console.error('写跳过记录失败', e);
    }
    battleHistory.push(record);
}

async function submitBattleAnswer() {
    if (!supabaseClient || !battleRoomId || battleAnswered || battleSubmitLock) return;

    const now = Date.now();
    if (now - battleLastSubmitTime < 300) return;

    const input = document.getElementById('battleInput').value.trim();
    if (!input) return;

    battleSubmitLock = true;
    battleLastSubmitTime = now;
    battleAnswered = true;
    document.getElementById('battleSubmitBtn').disabled = true;
    document.getElementById('battleInput').disabled = true;
    
    // 竞分模式用本地题，不查服务器
    let data;
    if (battleMode === 'score') {
        data = { mode: 'score', current_question: battleOwnQuestion };
    } else {
        const res = await supabaseClient
            .from('battle_rooms')
            .select('current_question, mode')
            .eq('id', battleRoomId)
            .single();
        data = res.data;
    }

    if (!data) {
        battleAnswered = false;
battleSubmitLock = false;
        document.getElementById('battleSubmitBtn').disabled = false;
        document.getElementById('battleInput').disabled = false;
        return;
    }
    
    let correct = false;
    let correctName = '';
    let targetName = '';
    
    if (data.mode === 'race') {
        if (!data.current_question) {
            battleAnswered = false;
battleSubmitLock = false;
            document.getElementById('battleSubmitBtn').disabled = false;
            document.getElementById('battleInput').disabled = false;
            return;
        }
        targetName = data.current_question;
    } else {
        if (!battleOwnQuestion) {
            battleAnswered = false;
battleSubmitLock = false;
            document.getElementById('battleSubmitBtn').disabled = false;
            document.getElementById('battleInput').disabled = false;
            return;
        }
        targetName = battleOwnQuestion;
    }

    // 特例：高德返回"海西蒙古族藏族自治州直辖"，视同"大柴旦行政委员会"
    if (targetName === '海西蒙古族藏族自治州直辖') {
        targetName = '大柴旦行政委员会';
    }
    
    // 用 matchForMode 统一匹配（和单机一致）
    const match = matchForMode(input, battleRange === 'city' ? 'normal' : 'hard');
    
    if (match.status === 'exact' || match.status === 'partial') {
        const matchHasParen = match.name.includes('（');
        const targetHasParen = targetName.includes('（');

        if (matchHasParen || targetHasParen) {
            correct = match.name === targetName;
        } else {
            const matchBase = match.name.replace(/（.+?）$/, '');
            const targetBase = targetName.replace(/（.+?）$/, '');
            correct = match.name === targetName || matchBase === targetBase;
        }
        if (correct) correctName = targetName;
    } else if (match.status === 'none') {
        const baseInput = input.replace(/（.+?）$/, '');
        const possible = Object.keys(ADJACENCY).filter(name => {
            const aliases = aliasMap[name] || [name];
            return aliases.includes(baseInput) ||
                   aliases.includes(baseInput + '区') ||
                   aliases.includes(baseInput + '县') ||
                   aliases.includes(baseInput + '市');
        });
        
        if (possible.length > 1) {
            document.getElementById('battleQuestion').textContent = '⚠️ 请输入更完整名称';
            battleAnswered = false;
            battleSubmitLock = false;
            document.getElementById('battleSubmitBtn').disabled = false;
            document.getElementById('battleInput').disabled = false;
            return;
        }
    }
    
    document.getElementById('battleInput').value = '';
    
    if (correct) {
        playSound('correct');
        document.getElementById('battleQuestion').textContent = `✅ 答对了！是 ${correctName}`;
        
        // 答对后立即锁定自己（后续靠服务器同步锁定对方）
        battleAnswered = true;
        battleSubmitLock = true;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleSubmitBtn').disabled = true;

        // 标记本题已答对，防止 generateOwnQuestion 再补记「跳过」
        battleCurrentSeqAnswered = true;

        // 写入服务器 correct_log（双方共享）
        // 竞分模式：记录题号 + 从开局到答对的用时（秒）
        var elapsedSec = 0;
        if (data.mode === 'score' && battleScoreStartTime) {
            elapsedSec = Math.round((Date.now() - battleScoreStartTime) / 1000);
        }
        const record = {
            question: targetName,
            player: battlePlayerName,
            playerNumber: battlePlayerNumber,
            time: new Date().toLocaleTimeString(),
            seq: data.mode === 'score' ? battleQuestionIndex : 0,
            elapsed: elapsedSec
        };
        // 本地先记一份（复盘兜底）
        battleHistory.push(record);

        // 服务器写入放后台，不阻塞换题
        supabaseClient.rpc('append_correct_log', {
            room_id: battleRoomId,
            record: record
        }).then(function () {}).catch(function (e) {
            console.error('写 correct_log 失败', e);
        });

        // 加分数也放后台
        addBattleScore();
        
        if (data.mode === 'score') {
            setTimeout(() => {
                if (!battleTimer) {
                    battleSubmitLock = false;   // 时间到也要解锁，否则“换一个”永远卡死
                    return;
                }
                battleAnswered = false;
                battleSubmitLock = false;
                generateOwnQuestion();
            }, 300);
        } else {
            // 竞速模式：谁答对谁清空题目，房主出下一题
            battleLastQuestion = null;
            battleGameStarted = false;
            await supabaseClient
                .from('battle_rooms')
                .update({
                    current_question: null,
                    player1_giveup: false,
                    player2_giveup: false
                })
                .eq('id', battleRoomId)
                .eq('current_question', targetName);
        }
    } else {
        playSound('wrong');
        document.getElementById('battleQuestion').textContent = '❌ 再试试！';
        
        // 答错解锁
        battleAnswered = false;
battleSubmitLock = false;
        document.getElementById('battleSubmitBtn').disabled = false;
        document.getElementById('battleInput').disabled = false;
        document.getElementById('battleInput').focus();
    }
}

// 加分
async function addBattleScore() {
    if (!supabaseClient || !battleRoomId) return;

    const scoreField = 'player' + battlePlayerNumber + '_score';
    const { error } = await supabaseClient.rpc('increment_score', {
        room_id: battleRoomId,
        score_field: scoreField
    });

    if (error) {
        console.error('加分失败:', error);
        return;
    }

    // 竞分模式不需要目标分判断，直接返回
    if (battleMode !== 'race') return;

    // 前端兜底：竞速模式检查是否达到目标分
    const { data: room } = await supabaseClient
        .from('battle_rooms')
        .select('mode, target_score, player1_score, player2_score, status')
        .eq('id', battleRoomId)
        .single();

    if (!room) return;
    if (room.status === 'finished') return;

    if (room.mode === 'race') {
        const myScore = battlePlayerNumber === 1 ? room.player1_score : room.player2_score;
        if (myScore >= room.target_score) {
            let winner = 'tie';
            if (room.player1_score > room.player2_score) winner = 'player1';
            else if (room.player2_score > room.player1_score) winner = 'player2';

            await supabaseClient
                .from('battle_rooms')
                .update({ status: 'finished', winner: winner })
                .eq('id', battleRoomId)
                .eq('status', 'playing');
        }
    }
}

// ==================== 模式2：竞分对决 ====================
async function startScoreBattle() {
    if (!supabaseClient || !battleRoomId) return;
    if (battleTimer) return;

    const { data } = await supabaseClient
        .from('battle_rooms')
        .select('duration')
        .eq('id', battleRoomId)
        .single();

    if (battleTimer) return;

    const duration = data?.duration || 60;
    battleScoreStartTime = Date.now();
    var endTime = battleScoreStartTime + duration * 1000;
    document.getElementById('battleRoomInfo').textContent = `⏱ 剩余时间: ${duration}秒`;

    // 开局立即恢复「换一个」按钮（竞分模式）
    document.getElementById('battleGiveUpBtn').disabled = false;

    battleTimer = setInterval(async () => {
        var timeLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        const rangeText = battleRange === 'city' ? '地级市' : '县级';
        document.getElementById('battleRoomInfo').innerHTML = `⏱ 剩余时间: ${timeLeft}秒<br><span style="font-size:12px;color:#666;">📊 竞分 · 限时 ${duration} 秒 · ${rangeText}</span>`;

        if (timeLeft <= 0) {
            clearInterval(battleTimer);
            battleTimer = null;
            document.getElementById('battleInput').disabled = true;
            document.getElementById('battleGiveUpBtn').disabled = true;
            document.getElementById('battleSubmitBtn').disabled = true;

            // 时间到：当前未答的题记为「时间到」
            if (battleOwnQuestion && !battleCurrentSeqAnswered && battleQuestionIndex > 0) {
                await recordBattleSkip(battleQuestionIndex, battleOwnQuestion, '时间到');
                battleCurrentSeqAnswered = true;
            }

            if (battlePlayerNumber === 1) {
                const { data: room } = await supabaseClient
                    .from('battle_rooms')
                    .select('player1, player2, player3, player4, player1_score, player2_score, player3_score, player4_score')
                    .eq('id', battleRoomId)
                    .single();

                var winner = 'tie';
                if (room) {
                    var maxS = -1, winnerSlots = [];
                    ['player1','player2','player3','player4'].forEach(function (slot) {
                        if (!room[slot]) return;
                        var s = room[slot + '_score'] || 0;
                        if (s > maxS) { maxS = s; winnerSlots = [slot]; }
                        else if (s === maxS) { winnerSlots.push(slot); }
                    });
                    winner = winnerSlots.length > 1 ? 'tie' : (winnerSlots[0] || 'tie');
                }

                await supabaseClient
                    .from('battle_rooms')
                    .update({ status: 'finished', winner: winner })
                    .eq('id', battleRoomId);
            }
        }
    }, 1000);

    if (battleQuestionIndex === 0 || !battleOwnQuestion) {
        // 竞分模式：双方都从第 1 题开始，题号本地维护
        battleQuestionIndex = 1;

        // 房主负责生成题库并写服务器，保证双方题库一致
        if (battlePlayerNumber === 1) {
            const { data: roomNow } = await supabaseClient
                .from('battle_rooms')
                .select('question_pool')
                .eq('id', battleRoomId)
                .single();
            if (!roomNow || !roomNow.question_pool || roomNow.question_pool.length === 0) {
                var pool = (battleRange === 'city') ? getCityPool() : districtPool;
                var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
                battleFixedPool = shuffled.slice(0, Math.min(200, shuffled.length));
                await supabaseClient
                    .from('battle_rooms')
                    .update({ question_pool: battleFixedPool })
                    .eq('id', battleRoomId);
            } else {
                battleFixedPool = roomNow.question_pool;
            }
        } else {
            // 玩家2：从服务器读题库，等房主写好
            let retry = 0;
            while ((!battleFixedPool || battleFixedPool.length === 0) && retry < 10) {
                const { data: room2 } = await supabaseClient
                    .from('battle_rooms')
                    .select('question_pool')
                    .eq('id', battleRoomId)
                    .single();
                if (room2 && room2.question_pool && room2.question_pool.length > 0) {
                    battleFixedPool = room2.question_pool;
                    break;
                }
                await new Promise(function (r) { setTimeout(r, 300); });
                retry++;
            }
        }

        const firstQ = getRandomBattleQuestion();
        battleOwnQuestion = firstQ;
        battleCurrentQuestionId = firstQ;
        battleAnswered = false;
        battleSubmitLock = false;
        battleCurrentSeqAnswered = false;

        loadBattleDistrict(firstQ);
        document.getElementById('battleInput').value = '';
        document.getElementById('battleQuestion').textContent =
            battleRange === 'city' ? '请猜地级' : '请猜区县';
        document.getElementById('battleInput').disabled = false;
        document.getElementById('battleSubmitBtn').disabled = false;
    }
}

async function generateOwnQuestion() {
    if (!battleRoomId) return;
    if (battleMode !== 'score') return;

    // 上一题如果没答对，补记一条「跳过」（不 await，后台写）
    if (battleOwnQuestion && !battleCurrentSeqAnswered && battleQuestionIndex > 0) {
        recordBattleSkip(battleQuestionIndex, battleOwnQuestion, '跳过');
    }
    battleCurrentSeqAnswered = false;

    // 竞分模式：题号本地自增，双方各答各的
    battleQuestionIndex = battleQuestionIndex + 1;

    battleOwnQuestion = getRandomBattleQuestion();
    battleCurrentQuestionId = battleOwnQuestion;

    battleAnswered = false;
    battleSubmitLock = false;
    document.getElementById('battleInput').value = '';
    document.getElementById('battleQuestion').textContent =
        battleRange === 'city' ? '请猜地级' : '请猜区县';
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleSubmitBtn').disabled = false;
    loadBattleDistrict(battleOwnQuestion);
}

// 离开房间
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
        if (battlePollingTimer) {
        clearInterval(battlePollingTimer);
        battlePollingTimer = null;
    }
    // 房主离开，删除房间
    if (battlePlayerNumber === 1 && battleRoomId && supabaseClient) {
        await supabaseClient
            .from('battle_rooms')
            .delete()
            .eq('id', battleRoomId);
    }

    // 非房主离开，清空自己的槽位
    if (battlePlayerNumber >= 2 && battleRoomId && supabaseClient) {
        var mySlot = 'player' + battlePlayerNumber;
        var obj = {};
        obj[mySlot] = null;
        obj[mySlot + '_score'] = 0;
        obj[mySlot + '_giveup'] = false;
        await supabaseClient
            .from('battle_rooms')
            .update(obj)
            .eq('id', battleRoomId);
    }

    battleRoomId = null;
    battlePlayerNumber = null;
    battleOwnQuestion = null;
    battleQuestionLoaded = false;
    battleAnswered = false;
battleSubmitLock = false;
    battleLastQuestion = null;
    battleCurrentDisplayed = null;
    battleResultShown = false;

    const brp = document.getElementById('battleRoomPanel');
    brp.classList.remove('pop-in');
    brp.style.display = 'none';
    
    document.getElementById('battlePanel').style.display = 'block';
    document.getElementById('battleInput').disabled = false;
    document.getElementById('battleInput').value = '';
    
    if (map) newRound();
}

// 收起展开
function toggleBattleCollapse() {
    const brp = document.getElementById('battleRoomPanel');
    const btn = document.getElementById('battleCollapseBtn');
    
    if (brp.classList.contains('collapsed')) {
        brp.querySelectorAll('#battleRoomInfo, #battleCopyRoomBtn, #battleScore, #battleQuestion, #battleInput, #battleSubmitBtn, #battleGiveUpBtn, #btnBattleLeave').forEach(el => {
            el.style.display = (el.id === 'battleCopyRoomBtn') ? 'block' : '';
        });
        brp.classList.remove('collapsed');
        btn.textContent = '收起';
    } else {
        brp.querySelectorAll('#battleRoomInfo, #battleCopyRoomBtn, #battleScore, #battleQuestion, #battleInput, #battleSubmitBtn, #battleGiveUpBtn, #btnBattleLeave').forEach(el => {
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

async function giveUpBattle() {
    if (!supabaseClient || !battleRoomId) return;
    
    // 竞分模式：换一个题目
    if (battleMode === 'score') {
        // 开局前不允许换题
        if (!battleOwnQuestion) {
            return;
        }
        // 时间已到，不允许换题
        if (!battleTimer) {
            return;
        }
        // 防连点
        if (battleSubmitLock) {
            return;
        }

        playSound('click');
        battleSubmitLock = true;
        document.getElementById('battleGiveUpBtn').disabled = true;
        document.getElementById('battleInput').disabled = true;
        document.getElementById('battleQuestion').textContent = '🔄 换题中...';

        setTimeout(() => {
            // 时间到就别换题了，直接解锁（按钮由 handleBattleUpdate 统一管理）
            if (!battleTimer) {
                battleSubmitLock = false;
                return;
            }

            // 上一题没答对，补记跳过
            if (battleOwnQuestion && !battleCurrentSeqAnswered && battleQuestionIndex > 0) {
                recordBattleSkip(battleQuestionIndex, battleOwnQuestion, '跳过');
            }
            battleCurrentSeqAnswered = false;
            battleQuestionIndex = battleQuestionIndex + 1;

            battleOwnQuestion = getRandomBattleQuestion();
            battleCurrentQuestionId = battleOwnQuestion;

            battleAnswered = false;
            battleSubmitLock = false;
            document.getElementById('battleInput').value = '';
            document.getElementById('battleQuestion').textContent =
                battleRange === 'city' ? '请猜地级' : '请猜区县';
            document.getElementById('battleInput').disabled = false;
            document.getElementById('battleSubmitBtn').disabled = false;
            document.getElementById('battleGiveUpBtn').disabled = false;
            document.getElementById('battleInput').focus();

            // 手动换题
            loadBattleDistrict(battleOwnQuestion);
        }, 300);
        return;
    }

    
    // 竞速模式：放弃
    playSound('click');
    document.getElementById('battleGiveUpBtn').disabled = true;
    document.getElementById('battleInput').disabled = true;
    
    const field = battlePlayerNumber === 1 ? 'player1_giveup' : 'player2_giveup';
    const otherField = battlePlayerNumber === 1 ? 'player2_giveup' : 'player1_giveup';
    
    // 先查询对方是否已经放弃
    const { data: current } = await supabaseClient
        .from('battle_rooms')
        .select('player1_giveup, player2_giveup, question_seq, current_question')
        .eq('id', battleRoomId)
        .single();

    // 当前没有题目（刚答对还没出新题），放弃无意义，直接忽略
    if (!current || !current.current_question) {
        return;
    }
    
    if (current && current[otherField]) {
        // 双方都放弃 → 清空题目，房主出下一题
        document.getElementById('battleQuestion').textContent = '🏳️ 双方都放弃，换新题...';
        
        await supabaseClient
            .from('battle_rooms')
            .update({
                [field]: true,
                current_question: null,
                player1_giveup: false,
                player2_giveup: false
            })
            .eq('id', battleRoomId)
            .eq('current_question', current.current_question);

        // 房主立即主动出题，不等轮询
        if (battlePlayerNumber === 1) {
            window._makingQuestion = false;
            startRaceQuestion().finally(function () {
                window._makingQuestion = false;
            });
        }
    } else {
        // 只有自己放弃 → 标记，等对方答对
        document.getElementById('battleQuestion').textContent = '🏳️ 你已放弃，等待对方...';
        await supabaseClient
            .from('battle_rooms')
            .update({ [field]: true })
            .eq('id', battleRoomId);
    }
}

// battleResultShown 已在好友对决变量声明区声明
function showBattleResult(roomData, winner) {
    if (battleResultShown) return;

    // 对手全退出了，不弹结果（避免弹 5:0 这种错窗）
    var hasOther = !!(roomData.player2 || roomData.player3 || roomData.player4);
    if (!hasOther) {
        battleResultShown = true;
        return;
    }

    battleResultShown = true;
    playSound('complete');

    // 多人（≥3 人）显示排行榜
    var playerCount = ['player1','player2','player3','player4'].filter(function (s) { return roomData[s]; }).length;
    if (playerCount >= 3) {
        showMultiBattleResult(roomData);
        return;
    }
    
        const overlay = document.createElement('div');
    overlay.id = 'battleResultOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);
    const panel = document.createElement('div');
    panel.id = 'battleResultPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;text-align:center;min-width:300px;opacity:0;transition:opacity 0.3s ease;';
    
const iAmP1 = battlePlayerNumber === 1;
const isDraw = roomData.winner === 'tie' ||
               (!roomData.winner && roomData.player1_score === roomData.player2_score);
const isWinner = !isDraw && (
    (roomData.winner === 'player1' && iAmP1) ||
    (roomData.winner === 'player2' && !iAmP1)
);
    
    let title, color, emoji;
    if (isDraw) {
        title = '平局';
        color = '#f59e0b';
        emoji = '🤝';
    } else if (isWinner) {
        title = '你赢了！';
        color = '#10b981';
        emoji = '🏆';
    } else {
        title = '你输了';
        color = '#ef4444';
        emoji = '😢';
    }
    saveBattleRecord(roomData);
    panel.innerHTML = `
        <div style="font-size:64px;margin-bottom:10px;">${emoji}</div>
        <div style="font-size:28px;font-weight:bold;color:${color};margin-bottom:20px;">${title}</div>
        <div style="font-size:16px;color:#666;margin-bottom:8px;">${roomData.player1 || ''}</div>
       <div style="font-size:32px;font-weight:bold;color:#4a6cf7;margin-bottom:15px;">${roomData.player1_score} : ${roomData.player2_score}</div>
        <div style="font-size:16px;color:#666;margin-bottom:25px;">${roomData.player2 || ''}</div> 
        <button id="battleResultCloseBtn" style="padding:12px 40px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;font-size:14px;transition:all 0.2s ease;">返回</button>
    `;
    
    document.body.appendChild(panel);
    
    setTimeout(() => { panel.style.opacity = '1'; }, 10);
    
    document.getElementById('battleResultCloseBtn').onclick = () => {
        playSound('click');
        panel.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            panel.remove();
            overlay.remove();
            document.getElementById('battleRoomPanel').style.display = 'block';
        }, 300);
    };
}

function showMultiBattleResult(roomData) {
    var players = [];
    ['player1','player2','player3','player4'].forEach(function (slot, i) {
        if (roomData[slot]) {
            players.push({ name: roomData[slot], score: roomData[slot + '_score'] || 0, slot: slot });
        }
    });
    players.sort(function (a, b) { return b.score - a.score; });

    var overlay = document.createElement('div');
    overlay.id = 'battleResultOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'battleResultPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:25px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;min-width:300px;opacity:0;transition:opacity 0.3s ease;';

    var html = '<div style="text-align:center;font-size:24px;font-weight:bold;margin-bottom:15px;color:#4a6cf7;">🏆 排行榜</div>';
    players.forEach(function (p, i) {
        var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : ''));
        var isMe = (p.slot === 'player' + battlePlayerNumber);
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;'
            + (isMe ? 'font-weight:bold;color:#4a6cf7;' : '') + '">'
            + '<span>' + medal + ' ' + p.name + (isMe ? '（你）' : '') + '</span>'
            + '<span>' + p.score + ' 分</span>'
            + '</div>';
    });
    html += '<button id="battleResultCloseBtn" style="display:block;width:100%;margin-top:15px;padding:12px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;">返回</button>';

    panel.innerHTML = html;
    document.body.appendChild(panel);
    setTimeout(function () { panel.style.opacity = '1'; }, 10);

    saveBattleRecord(roomData);

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

function saveBattleRecord(roomData) {
    const records = JSON.parse(localStorage.getItem('battleRecords') || '[]');

    const exists = records.find(r => r.roomId === battleRoomId);
    if (exists) {
        battleHistory = [];
        return;
    }

    var players = [];
    ['player1','player2','player3','player4'].forEach(function (slot) {
        if (roomData[slot]) {
            players.push({
                name: roomData[slot],
                score: roomData[slot + '_score'] || 0
            });
        }
    });

    const record = {
        time: new Date().toLocaleString(),
        roomId: battleRoomId,
        mode: roomData.mode,
        targetScore: roomData.target_score,
        duration: roomData.duration,
        rangeType: roomData.range_type || 'district',
        player1: roomData.player1,
        player2: roomData.player2,
        player3: roomData.player3,
        player4: roomData.player4,
        player1Score: roomData.player1_score,
        player2Score: roomData.player2_score,
        player3Score: roomData.player3_score,
        player4Score: roomData.player4_score,
        players: players,
        winner: roomData.winner || null,
        history: battleHistory.slice()
    };

    records.unshift(record);
    if (records.length > 20) records.pop();

    localStorage.setItem('battleRecords', JSON.stringify(records));
    battleHistory = [];
}

function showBattleHistory() {
    
    const records = JSON.parse(localStorage.getItem('battleRecords') || '[]');
    
    const overlay = document.createElement('div');
    overlay.id = 'battleHistoryOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;';
    document.body.appendChild(overlay);
    
    const panel = document.createElement('div');
    panel.id = 'battleHistoryPanel';
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:25px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:80vw;max-height:70vh;overflow-y:auto;min-width:300px;opacity:0;transition:opacity 0.3s ease;';
    
    let html = '<h3 style="text-align:center;margin-bottom:15px;">📜 战斗记录</h3>';
    
    if (records.length === 0) {
        html += '<div style="text-align:center;color:#999;padding:20px;">暂无记录</div>';
    } else {
        records.forEach(r => {
            let resultText, resultColor;
            if (r.players && r.players.length >= 3) {
                var sorted = r.players.slice().sort(function (a, b) { return b.score - a.score; });
                if (sorted[0].score === sorted[1].score) {
                    resultText = '平局';
                    resultColor = '#f59e0b';
                } else {
                    resultText = sorted[0].name + ' 胜';
                    resultColor = '#10b981';
                }
            } else if (r.player1Score > r.player2Score) {
                resultText = `${r.player1} 胜`;
                resultColor = '#10b981';
            } else if (r.player1Score < r.player2Score) {
                resultText = `${r.player2} 胜`;
                resultColor = '#10b981';
            } else {
                resultText = '平局';
                resultColor = '#f59e0b';
            }
            
            const rangeText = r.rangeType === 'city' ? '地级市' : '县级';
            const modeText = r.mode === 'race' 
                ? `🏁 竞速 · 目标 ${r.targetScore} 分 · ${rangeText}` 
                : `📊 竞分 · 限时 ${r.duration} 秒 · ${rangeText}`;
            
            html += `<div class="battle-record-row" data-room-id="${r.roomId}" style="padding:10px;border-bottom:1px solid #eee;position:relative;">
                <input type="checkbox" class="battle-record-check" data-room-id="${r.roomId}" style="display:none;position:absolute;left:10px;top:14px;transform:scale(1.3);cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:13px;">
                        ${(r.players && r.players.length >= 3)
                            ? r.players.map(function(p){ return '<span style="color:#4a6cf7;">' + p.name + '</span> <b>' + p.score + '</b>'; }).join(' · ')
                                                        : '<span style="color:#4a6cf7;">' + r.player1 + '</span> <b>' + r.player1Score + '</b> : <b>' + r.player2Score + '</b> <span style="color:#ef4444;">' + r.player2 + '</span>'}
                    </div>
                    <div style="font-size:12px;color:${resultColor};font-weight:bold;">${resultText}</div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-top:4px;">
                    <span>${modeText}</span>
                    <span>${r.time}</span>
                </div>
                ${r.history && r.history.length > 0 ? `<button onclick="showBattleReplay('${r.roomId}')" style="margin-top:6px;padding:4px 8px;font-size:11px;background:#4a6cf7;color:white;border:none;border-radius:4px;cursor:pointer;">📋 复盘</button>` : ''}
            </div>`;
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
    
    // 选择模式开关
    var selecting = false;
    document.getElementById('battleHistorySelectBtn').onclick = () => {
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

    // 删除选中
    document.getElementById('battleHistoryDeleteBtn').onclick = () => {
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

    // 清空全部
    document.getElementById('battleHistoryClearBtn').onclick = () => {
        if (!confirm('确定清空全部战斗记录？此操作不可恢复。')) return;
        localStorage.setItem('battleRecords', '[]');
        panel.remove();
        overlay.remove();
        showBattleHistory();
    };

    document.getElementById('battleHistoryCloseBtn').onclick = () => {
        panel.style.opacity = '0';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            panel.remove();
            overlay.remove();
        }, 300);
    };

    // 面板内所有按钮统一播 click（只绑一次）
    panel.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () { playSound('click'); });
    });
}

function getRandomBattleQuestion() {
    // 竞分模式：从固定题库按题号取，保证双方同题号同题
    if (battleFixedPool && battleFixedPool.length > 0) {
        var idx = (battleQuestionIndex - 1) % battleFixedPool.length;
        if (idx < 0) idx = 0;
        return battleFixedPool[idx];
    }

    // 兜底：竞速模式用原来的逻辑
    const fullPool = battleRange === 'city' ? getCityPool() : districtPool;
    let pool = fullPool.filter(function (name) {
        return !battleUsedQuestions[name];
    });
    if (pool.length === 0) {
        battleUsedQuestions = {};
        pool = fullPool;
    }
    const seed = mulberry32(hashString(battleRoomId + '_r_' + battleRoundSeed + '_q_' + battleQuestionIndex));
    const pick = pool[Math.floor(seed() * pool.length)];
    battleUsedQuestions[pick] = true;
    if (supabaseClient && battleRoomId) {
        supabaseClient
            .from('battle_rooms')
            .update({ used_questions: battleUsedQuestions })
            .eq('id', battleRoomId)
            .then(function () {})
            .catch(function () {});
    }
    return pick;
}

function hashString(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(a) {
    return function() {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function showBattleReplay(roomId) {
    const records = JSON.parse(localStorage.getItem('battleRecords') || '[]');
    const record = records.find(r => r.roomId === roomId);
    if (!record || !record.history || record.history.length === 0) {
        alert('暂无复盘数据');
        return;
    }
    playSound('click');

    const overlay = document.createElement('div');
    overlay.id = 'replayOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:99998;opacity:0;transition:opacity 0.15s ease;';
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;background:white;padding:20px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:99999 !important;max-width:95vw;max-height:80vh;overflow-y:auto;min-width:600px;';

    const modeText = record.mode === 'race'
        ? `🏁 竞速 · 目标 ${record.targetScore} 分`
        : `📊 竞分 · 限时 ${record.duration} 秒`;
    const rangeText = record.rangeType === 'city' ? '地级市' : '县级';

    // 人数
    var pnSetTop = {};
    record.history.forEach(function (h) { if (h.playerNumber) pnSetTop[h.playerNumber] = true; });
    var pnCountTop = Object.keys(pnSetTop).length;

    var topLine;
    if (pnCountTop >= 3) {
        var nameArr = [];
        [1,2,3,4].forEach(function (n) {
            if (!pnSetTop[n]) return;
            var nm = record['player' + n] || ('玩家' + n);
            var sc = record['player' + n + 'Score'] || 0;
            nameArr.push(nm + ' <b>' + sc + '</b>');
        });
        topLine = nameArr.join(' · ');
    } else {
        topLine = `${record.player1 || ''} <b>${record.player1Score}</b> : <b>${record.player2Score}</b> ${record.player2 || ''}`;
    }

    let html = `
        <h3 style="text-align:center;margin-bottom:10px;">📋 对局复盘</h3>
        <div style="text-align:center;font-size:14px;margin-bottom:6px;">
            ${topLine}
        </div>
        <div style="text-align:center;font-size:11px;color:#999;margin-bottom:12px;">
            ${modeText} · ${rangeText} · ${record.time}
        </div>`;

    if (record.mode === 'score') {
        // 判断这局人数
        var playerSlots = [];
        ['player1','player2','player3','player4'].forEach(function (slot) {
            // 从 history 里找这个 slot 的玩家名
            // record 里没存 player3/4 名，需要从 history 的 playerNumber 推
        });

        // 用 history 里出现过的 playerNumber 判断人数
        var pnSet = {};
        record.history.forEach(function (h) {
            if (h.playerNumber) pnSet[h.playerNumber] = true;
        });
        var pnCount = Object.keys(pnSet).length;

        if (pnCount >= 3) {
            // 多人格式：左题目，右侧 N 列
            var bySeq = {};
            record.history.forEach(function (h) {
                var seq = h.seq || 0;
                if (!bySeq[seq]) bySeq[seq] = { seq: seq, question: h.question, cells: {} };
                var cell = '';
                if (!h.skipped && h.elapsed !== undefined && h.elapsed !== null) cell = h.elapsed + 's';
                else if (h.skipped) cell = (h.skipReason || '跳过');
                bySeq[seq].cells[h.playerNumber] = cell || '—';
            });

            var seqList = Object.keys(bySeq).map(function (k) { return bySeq[k]; });
            seqList.sort(function (x, y) { return x.seq - y.seq; });

            // 玩家列：player1..4
            var cols = [1,2,3,4].filter(function (n) { return pnSet[n]; });

            // 玩家名映射
            var nameMap = {
                1: record.player1 || '玩家1',
                2: record.player2 || '玩家2',
                3: record.player3 || '玩家3',
                4: record.player4 || '玩家4'
            };

            var endedByTimeout = record.history.some(function (h) { return h.skipReason === '时间到'; });
            var fallback = endedByTimeout ? '时间到' : '跳过';

            html += '<div style="font-size:13px;line-height:1.9;color:#333;">';
            // 表头
            html += '<div style="display:flex;gap:6px;font-weight:bold;color:#4a6cf7;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:4px;">'
                + '<span style="flex:0 0 50%;">题目</span>';
            cols.forEach(function (n) {
                html += '<span style="flex:1;text-align:center;">' + nameMap[n] + '</span>';
            });
            html += '</div>';

            seqList.forEach(function (item) {
                html += '<div style="display:flex;gap:6px;align-items:center;">'
                    + '<span style="flex:0 0 50%;text-align:left;word-break:break-all;">' + item.seq + '.' + item.question + '</span>';
                cols.forEach(function (n) {
                    var cell = item.cells[n] !== undefined ? item.cells[n] : fallback;
                    html += '<span style="flex:1;text-align:center;">' + cell + '</span>';
                });
                html += '</div>';
            });
            html += '</div>';
        } else {
        // 竞分模式：三栏，A左对齐 / 题目居中 / B右对齐
        var endedByTimeout = record.history.some(function (h) {
            return h.skipReason === '时间到';
        });

        var bySeq = {};
        record.history.forEach(function (h) {
            var seq = h.seq || 0;
            if (!bySeq[seq]) {
                bySeq[seq] = { seq: seq, question: h.question, a: null, b: null };
            }
            var label = null;
            if (!h.skipped && h.elapsed !== undefined && h.elapsed !== null) {
                label = h.elapsed + 's';
            } else if (h.skipped) {
                label = (h.skipReason || '跳过');
            }
            if (label) {
                // 答对记录优先，避免被跳过记录覆盖
                var isCorrect = (!h.skipped && h.elapsed !== undefined && h.elapsed !== null);
                if (h.playerNumber === 1) {
                    if (bySeq[seq].a === null || isCorrect) bySeq[seq].a = label;
                } else if (h.playerNumber === 2) {
                    if (bySeq[seq].b === null || isCorrect) bySeq[seq].b = label;
                }
            }
        });

        var seqList = Object.keys(bySeq).map(function (k) { return bySeq[k]; });
        seqList.sort(function (x, y) { return x.seq - y.seq; });

        html += `<div style="font-size:14px;line-height:2;color:#333;">`;
        // 顶部表头：左玩家名 / 空 / 右玩家名
        html += `<div style="display:flex;align-items:center;gap:8px;font-weight:bold;color:#4a6cf7;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:4px;">`
            + `<span style="flex:0 0 60px;text-align:left;">${record.player1 || 'A'}</span>`
            + `<span style="flex:1;text-align:center;color:#999;font-weight:normal;">题目</span>`
            + `<span style="flex:0 0 60px;text-align:right;">${record.player2 || 'B'}</span>`
            + `</div>`;
        seqList.forEach(function (item) {
            var fallback = endedByTimeout ? '时间到' : '跳过';
            var left = item.a !== null ? item.a : fallback;
            var right = item.b !== null ? item.b : fallback;
            html += `<div style="display:flex;align-items:center;gap:8px;">`
                + `<span style="flex:0 0 60px;text-align:left;white-space:nowrap;">${left}</span>`
                + `<span style="flex:1;text-align:center;word-break:break-all;">${item.seq}.${item.question}</span>`
                + `<span style="flex:0 0 60px;text-align:right;white-space:nowrap;">${right}</span>`
                + `</div>`;
        });
        html += `</div>`;
        }   // ← 闭合多人 if 的 else
    } else {
        // 竞速模式：保持原表格
        html += `<table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f5f5f5;">
                <th style="padding:6px;text-align:left;">#</th>
                <th style="padding:6px;text-align:left;">题目</th>
                <th style="padding:6px;text-align:right;">答对者</th>
            </tr></thead><tbody>`;

        record.history.forEach((h, i) => {
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px;color:#999;">${i + 1}</td>
                <td style="padding:6px;">${h.question}</td>
                <td style="padding:6px;text-align:right;color:#10b981;">${h.player || h.winner || '—'}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    html += `<button id="replayCloseBtn" style="display:block;width:100%;margin-top:15px;padding:10px;border:none;border-radius:8px;background:#4a6cf7;color:white;cursor:pointer;">关闭</button>`;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    document.getElementById('replayCloseBtn').onclick = () => {
        playSound('click');
        panel.remove();
        overlay.remove();
    };
}

