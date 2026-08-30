// ============================================================
//  game.js —— 游戏核心逻辑
// ============================================================

let map;
let ds;
let dsProvince;
let dsCity;

let targetDistrict = null;
let currentPolygons = [];
let classicNeighborPolygons = [];

let score = 0;
let gameMode = 'normal';
let selectedRegion = 'all';
let selectedProvince = 'all';

let recentDistricts = [];
let loadId = 0;
let classicLoadId = 0;

let hintUsed = false;
let hintLevel = 0;
let hintDeduct = 0;

let timerMode = false;
let districtCache = {};
let timerSeconds = 60;
let timerInterval = null;
let bestTime30 = null;

let dailyMode = false;
let gameSpeed = 'normal';
let dailyQuestions = [];
let dailyIndex = 0;
let dailyScore = 0;
let dailyCompleted = false;
let mobileNeighborData = [];
const districtPool = Object.keys(ADJACENCY);

const provinceOfficialNames = [
    '北京市','天津市','河北省','山西省','内蒙古自治区',
    '辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省',
    '安徽省','福建省','江西省','山东省','河南省','湖北省',
    '湖南省','广东省','广西壮族自治区','海南省','重庆市',
    '四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省',
    '青海省','宁夏回族自治区','新疆维吾尔自治区',
    '香港特别行政区','澳门特别行政区'
];

const provinceAliasMap = {
    '北京市': ['北京'],
    '天津市': ['天津'],
    '河北省': ['河北'],
    '山西省': ['山西'],
    '内蒙古自治区': ['内蒙古'],
    '辽宁省': ['辽宁'],
    '吉林省': ['吉林'],
    '黑龙江省': ['黑龙江'],
    '上海市': ['上海'],
    '江苏省': ['江苏'],
    '浙江省': ['浙江'],
    '安徽省': ['安徽'],
    '福建省': ['福建'],
    '江西省': ['江西'],
    '山东省': ['山东'],
    '河南省': ['河南'],
    '湖北省': ['湖北'],
    '湖南省': ['湖南'],
    '广东省': ['广东'],
    '广西壮族自治区': ['广西'],
    '海南省': ['海南'],
    '重庆市': ['重庆'],
    '四川省': ['四川'],
    '贵州省': ['贵州'],
    '云南省': ['云南'],
    '西藏自治区': ['西藏'],
    '陕西省': ['陕西'],
    '甘肃省': ['甘肃'],
    '青海省': ['青海'],
    '宁夏回族自治区': ['宁夏'],
    '新疆维吾尔自治区': ['新疆'],
    '香港特别行政区': ['香港'],
    '澳门特别行政区': ['澳门']
};

const ethnicGroups = [
    '汉族','壮族','回族','满族','维吾尔族','苗族','彝族','土家族',
    '藏族','蒙古族','侗族','布依族','瑶族','白族','朝鲜族','哈尼族',
    '黎族','哈萨克族','傣族','畲族','傈僳族','东乡族','仡佬族','拉祜族',
    '佤族','水族','纳西族','羌族','土族','仫佬族','锡伯族','柯尔克孜族',
    '景颇族','达斡尔族','撒拉族','布朗族','毛南族','塔吉克族','普米族',
    '阿昌族','怒族','鄂温克族','京族','基诺族','德昂族','保安族','俄罗斯族',
    '裕固族','乌孜别克族','门巴族','鄂伦春族','独龙族','赫哲族','高山族','珞巴族','塔塔尔族',
    '汉','壮','回','满','维吾尔','苗','彝','土家',
    '藏','蒙古','侗','布依','瑶','白','朝鲜','哈尼',
    '黎','哈萨克','傣','畲','傈僳','东乡','仡佬','拉祜',
    '佤','水','纳西','羌','土','仫佬','锡伯','柯尔克孜',
    '景颇','达斡尔','撒拉','布朗','毛南','塔吉克','普米',
    '阿昌','怒','鄂温克','京','基诺','德昂','保安','俄罗斯',
    '裕固','乌孜别克','门巴','鄂伦春','独龙','赫哲','高山','珞巴','塔塔尔',
    '族'
];

function getAutonomousCore(name) {
    if (!name.endsWith('自治州') && !name.endsWith('自治县')) return null;

    const base = name
        .replace(/自治州$/, '')
        .replace(/自治县$/, '');

    let core = base;

    let changed = true;
    while (changed) {
        changed = false;
        for (const ethnic of ethnicGroups) {
            if (core.endsWith(ethnic)) {
                core = core.slice(0, core.length - ethnic.length);
                changed = true;
                break;
            }
        }
    }

    return core || null;
}

function extractAutonomousAliases() {
    const aliasRules = {};

    const allNames = new Set([...Object.keys(ADJACENCY), ...getCityPool()]);

for (const name of allNames) {
        if (!name.endsWith('自治州') && !name.endsWith('自治县')) continue;

        let core = name
            .replace(/自治州$/, '')
            .replace(/自治县$/, '');

core = core
    .replace(/(?:藏|土家|苗|侗|布依|哈尼|彝|壮|傣|景颇|傈僳|蒙古|柯尔克孜|哈萨克|回|白|纳西|拉祜|佤|布朗|普米|怒|独龙|朝鲜|羌|瑶|黎|满|达斡尔|鄂温克|鄂伦春|锡伯|塔吉克|俄罗斯|京|毛南|仫佬|仡佬|土|撒拉|保安|裕固|东乡|门巴|珞巴|基诺|德昂|阿昌|赫哲)族?$/, '');

        if (core && core !== name) {
            aliasRules[name] = new Set();
            aliasRules[name].add(core);

            if (name.endsWith('自治州')) {
                aliasRules[name].add(core + '州');
            } else {
                aliasRules[name].add(core + '县');
            }
        }
    }

    return aliasRules;
}

function buildAliasMap() {
    const map = {};

    for (const name of Object.keys(ADJACENCY)) {
        const aliases = new Set();
        aliases.add(name);

        const short = name
            .replace(/省$/, '')
            .replace(/市$/, '')
            .replace(/区$/, '')
            .replace(/旗$/, '')
            .replace(/盟$/, '')
            .replace(/林区$/, '');

        if (short !== name) {
            aliases.add(short);
        }

        if (provinceAliasMap[name]) {
            provinceAliasMap[name].forEach(alias => aliases.add(alias));
        }

        if (name.includes('（')) {
            const base = name.replace(/（.+?）$/, '');
            const parent = name.match(/（(.+?)）/)[1];
            aliases.add(`${parent}${base}`);
        }

        map[name] = [...aliases];
    }

    provinceOfficialNames.forEach(p => {
        map[p] = [p, ...(provinceAliasMap[p] || [])];
    });

    getCityPool().forEach(city => {
        if (city.endsWith('自治州')) {
            const core = city.replace(/自治州$/, '');
            map[city] = [city, core, core + '州'];
        } else {
            const cityAliases = new Set();
            cityAliases.add(city);

            const shortCity = city.replace(/市$/, '');
            if (shortCity !== city) {
                cityAliases.add(shortCity);
            }

            map[city] = [...cityAliases];
        }
    });

    return map;
}

const aliasMap = buildAliasMap();

(function forceFixAliases() {
    aliasMap['六枝特区'] = ['六枝特区', '六枝'];
aliasMap['大柴旦行政委员会'] = ['大柴旦行政委员会', '大柴旦'];
    
    // 👇 在这里添加
    const newAreaMap = {
        '浦东新区': '浦东',
        '沈北新区': '沈北',
        '滨海新区': '滨海',
        '两江新区': '两江'
    };
    for (const [full, short] of Object.entries(newAreaMap)) {
        if (aliasMap[full]) {
            aliasMap[full] = [full, short];
        }
    }
    // 👆 添加到这里
    
        // 地区
    [
        '大兴安岭地区',
        '阿里地区',
        '和田地区',
        '阿克苏地区',
        '喀什地区',
        '塔城地区',
        '阿勒泰地区'
    ].forEach(name => {
        aliasMap[name] = [name, name.replace(/地区$/, '')];
    });
        // 普通县
    Object.keys(ADJACENCY).forEach(name => {
        if (name.endsWith('县') && !name.endsWith('自治县')) {
            const core = name.replace(/县$/, '');
            if (!aliasMap[name].includes(core)) {
                aliasMap[name].push(core);
            }
        }
    });
    // 盟
    ['锡林郭勒盟','兴安盟','阿拉善盟'].forEach(name => {
        aliasMap[name] = [name, name.replace(/盟$/, '')];
    });

    // 自治旗
    const flagMap = {
        '鄂温克族自治旗': '鄂温克',
        '鄂伦春自治旗': '鄂伦春',
        '莫力达瓦达斡尔族自治旗': '莫力达瓦'
    };
    for (const [full, core] of Object.entries(flagMap)) {
        aliasMap[full] = [full, core, core + '旗'];
    }

    // 自治县
    const countyMap = {
        '东乡族自治县': '东乡'
    };
    for (const [full, core] of Object.entries(countyMap)) {
        aliasMap[full] = [full, core, core + '县'];
    }
})();

function fixAutonomousAliases() {
    getCityPool().forEach(city => {
        if (city.endsWith('自治州')) {
            const core = getAutonomousCore(city);
            if (core) {
                aliasMap[city] = [city, core, core + '州'];
            }
        }
    });

    Object.keys(ADJACENCY).forEach(name => {
        if (name.endsWith('自治县')) {
            let core = name.replace(/自治县$/, '');

            for (let i = 0; i < 4; i++) {
                let removed = false;

                for (const ethnic of ethnicGroups) {
                    if (core.endsWith(ethnic)) {
                        core = core.slice(0, core.length - ethnic.length);
                        removed = true;
                        break;
                    }
                }

                if (!removed) break;
            }

            if (core && core !== name) {
                aliasMap[name] = [name, core, core + '县'];
            }
        }

        if (name.endsWith('自治旗')) {
            let base = name.replace(/自治旗$/, '');
            let core = base;

            for (const ethnic of ethnicGroups) {
                if (core.endsWith(ethnic)) {
                    core = core.slice(0, core.length - ethnic.length);
                    break;
                }
            }

            if (core && core !== name) {
                aliasMap[name] = [name, core, core + '旗'];
            }
        }

        if (name.endsWith('盟')) {
            const core = name.replace(/盟$/, '');
            aliasMap[name] = [name, core];
        } else if (name.endsWith('地区')) {
            const core = name.replace(/地区$/, '');
            aliasMap[name] = [name, core];
        } else if (name.endsWith('林区')) {
            const core = name.replace(/林区$/, '');
            aliasMap[name] = [name, core];
        } else if (name.endsWith('旗') && !name.endsWith('自治旗')) {
            const core = name.replace(/旗$/, '');
            aliasMap[name] = [name, core];
        }
    });
}

fixAutonomousAliases();

function matchDistrict(input) {
    const exact = [];
    const partial = [];

    for (const [official, aliases] of Object.entries(aliasMap)) {
        if (aliases.includes(input)) {
            exact.push(official);
        } else if (aliases.some(a => a.includes(input) || input.includes(a))) {
            partial.push(official);
        }
    }

    if (exact.length === 1) {
        return { status: 'exact', name: exact[0] };
    }

    if (exact.length > 1) {
        return { status: 'ambiguous', names: exact };
    }

    if (partial.length === 1) {
        return { status: 'partial', name: partial[0] };
    }

    if (partial.length > 1) {
        return { status: 'ambiguous', names: partial };
    }

    return { status: 'none' };
}

function matchForMode(input) {
    let pool;

    if (dailyMode) {
        pool = Object.keys(ADJACENCY);
    } else if (gameMode === 'easy') {
        pool = provinceOfficialNames;
    } else if (gameMode === 'normal') {
        pool = getCityPool();
    } else {
        pool = Object.keys(ADJACENCY);
    }

    const exact = [];

    for (const official of pool) {
        const aliases = aliasMap[official] || [official];

        if (aliases.includes(input)) {
            exact.push(official);
        }
    }

    if (exact.length === 1) return { status: 'exact', name: exact[0] };
    if (exact.length > 1) return { status: 'ambiguous', names: exact };
    return { status: 'none' };
}

function initMap() {
    // 检查高德地图 API 是否加载成功
    if (typeof AMap === 'undefined') {
        setMsg('❌ 地图加载失败，请刷新页面重试', 'wrong');
        return;
    }

    try {
        // 设置地图容器高度
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            // 确保容器有正确的尺寸
            mapContainer.style.width = '100%';
            mapContainer.style.height = '100vh';
            
            // 移动端特殊处理
            if (window.innerWidth <= 768) {
                mapContainer.style.height = window.innerHeight + 'px';
                mapContainer.style.position = 'fixed';
                mapContainer.style.top = '0';
                mapContainer.style.left = '0';
            }
        }

        // 手机端：创建地图但不显示，只用于计算
        if (window.innerWidth <= 768) {
            // 手机端：不创建高德地图，用空对象代替
            map = {
                setStatus: function(){},
                setFitView: function(){},
                resize: function(){},
                setMapStyle: function(){},
                setFeatures: function(){},
                getZoom: function(){ return 10; },
                setZoom: function(){}
            };
            
            // 隐藏地图容器
            const mapDiv = document.getElementById('map');
            mapDiv.style.display = 'none';
            
            // 创建搜索对象
            ds = new AMap.DistrictSearch({ level: 'district', extensions: 'all' });
            dsProvince = new AMap.DistrictSearch({ level: 'province', extensions: 'all', subdistrict: 3 });
            dsCity = new AMap.DistrictSearch({ level: 'city', extensions: 'all' });
            
            setMode('normal');
            return;
        }

        // 电脑端：正常创建地图
        map = new AMap.Map('map', {
            zoom: 10,
            center: [116.4, 39.9],
            mapStyle: 'amap://styles/whitesmoke',
            features: [],
            showLabel: false,
            resizeEnable: true,
            viewMode: '2D'
        });

        map.on('complete', () => {
            
            // 延迟创建搜索对象，确保地图完全就绪
            setTimeout(() => {
                try {
                    // 创建搜索对象
                    ds = new AMap.DistrictSearch({
                        level: 'district',
                        extensions: 'all'
                    });

                    dsProvince = new AMap.DistrictSearch({
                        level: 'province',
                        extensions: 'all',
                        subdistrict: 3
                    });

                    dsCity = new AMap.DistrictSearch({
                        level: 'city',
                        extensions: 'all'
                    });

                    
                    // 搜索对象创建完成后设置模式
                    setMode('normal');
                } catch (e) {
                    setMsg('❌ 地图搜索功能初始化失败，请刷新重试', 'wrong');
                }
            }, 500);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (map) {
                setTimeout(() => {
                    map.resize();
                }, 100);
            }
        });
        
    } catch (error) {
        console.error('地图初始化失败:', error);
        setMsg('❌ 地图初始化失败，请刷新页面重试', 'wrong');
    }
}

function hideMapBackground() {
    // 不再使用，保留空函数避免报错
}

function getRandomDistrict() {
    let pool;

    if (gameMode === 'easy') {
        pool = [
            '北京市','天津市','河北省','山西省','内蒙古','辽宁省','吉林省','黑龙江省',
            '上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省',
            '河南省','湖北省','湖南省','广东省','广西','海南省',
            '重庆市','四川省','贵州省','云南省','西藏',
            '陕西省','甘肃省','青海省','宁夏','新疆',
            '香港','澳门'
        ];
    } else if (gameMode === 'normal') {
        pool = getCityPool();
    } else {
        pool = districtPool;
    }

    if (gameMode !== 'classic') {
        pool = filterByRegion(pool);
    }

    if (pool.length === 0) {
        return gameMode === 'easy' ? '北京市' : '东城区';
    }

    const filtered = pool.filter(d => !recentDistricts.includes(d));
    const pick = (filtered.length > 0 ? filtered : pool)[
        Math.floor(Math.random() * (filtered.length > 0 ? filtered : pool).length)
    ];

    recentDistricts.push(pick);
    if (recentDistricts.length > 20) recentDistricts.shift();

    return pick;
}

function getDailyQuestions() {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
        seed = (seed * 31 + dateStr.charCodeAt(i)) % 1000000007;
    }

    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    const pool = [...districtPool];
    const questions = [];

    while (questions.length < 10 && pool.length > 0) {
        const idx = Math.floor(seededRandom() * pool.length);
        questions.push(pool.splice(idx, 1)[0]);
    }

    return questions;
}

function startDailyChallenge() {
    if (gameMode === 'classic' && document.getElementById('newBtn').disabled) {
        setMsg('⏳ 经典模式加载中，请稍候', '');
        return;
    }

    if (timerMode) {
        timerMode = false;
        timerSeconds = 60;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        document.getElementById('btnTimer').classList.remove('active');
        document.getElementById('timerDisplay').style.display = 'none';
        document.getElementById('timerDisplay').textContent = '';
        document.getElementById('timerDisplay').style.color = '#666';

        document.getElementById('input').disabled = false;
        document.getElementById('submitBtn').disabled = false;
    }

    classicNeighborPolygons.forEach(p => p.setMap(null));
    classicNeighborPolygons = [];
    classicLoadId++;
    if (map) {
        map.setStatus({ dragEnable: true, zoomEnable: true, scrollWheel: true });
    }

    dailyMode = true;
    dailyQuestions = getDailyQuestions();
    dailyIndex = 0;
    dailyScore = 0;
    dailyCompleted = false;

    document.getElementById('panelContent').style.display = 'none';
    document.getElementById('dailyPanel').style.display = 'block';
    document.getElementById('dailyScore').textContent = '得分: 0';
    document.getElementById('dailyShareBtn').style.display = 'none';
    document.getElementById('dailyImageBtn').style.display = 'none';
    updateDailyBestDisplay();
    document.getElementById('dailyProgress').textContent = '第 1 / 10 题';
    document.getElementById('dailyMsg').textContent = '';
    document.getElementById('dailyInput').value = '';
    document.getElementById('dailyInput').focus();

    loadDailyQuestion();
}

function loadDailyQuestion() {
    if (dailyIndex >= dailyQuestions.length) {
        finishDailyChallenge();
        return;
    }

    const name = dailyQuestions[dailyIndex];
    document.getElementById('dailyProgress').textContent = `第 ${dailyIndex + 1} / 10 题`;
    document.getElementById('dailyMsg').textContent = '';
    document.getElementById('dailyInput').value = '';
    document.getElementById('dailyInput').focus();
    loadDistrict(name);
}

function finishDailyChallenge() {
    playSound('complete');
    document.getElementById('dailyPanel').classList.add('pop-in');
    dailyCompleted = true;
    dailyMode = false;

    const key = 'dailyBest_' + new Date().toISOString().slice(0, 10);
    const best = Number(localStorage.getItem(key) || '0');

    if (dailyScore > best) {
        localStorage.setItem(key, String(dailyScore));
        updateDailyBestDisplay();
        document.getElementById('dailyMsg').textContent = `🎉 完成！得分: ${dailyScore}，新纪录！`;
    } else {
        document.getElementById('dailyMsg').textContent = `✅ 完成！得分: ${dailyScore}，今日最高: ${best}`;
    }

    document.getElementById('dailyInput').disabled = true;
    document.getElementById('dailySubmitBtn').disabled = true;
    document.getElementById('dailyShareBtn').style.display = 'inline-block';
    document.getElementById('dailyImageBtn').style.display = 'inline-block';
}

function exitDailyChallenge() {
    dailyMode = false;
    dailyCompleted = false;

    document.getElementById('dailyPanel').style.display = 'none';
    document.getElementById('panelContent').style.display = 'block';

    document.getElementById('dailyInput').disabled = false;
    document.getElementById('dailySubmitBtn').disabled = false;

    if (map) {
        newRound();
    }
}

function shareDailyResult() {
    const key = 'dailyBest_' + new Date().toISOString().slice(0, 10);
    const best = Number(localStorage.getItem(key) || '0');
    const text = `📅 看图猜区县 每日挑战\n今日得分：${dailyScore}\n今日最佳：${best}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            playSound('share');
            document.getElementById('dailyMsg').textContent = '✅ 成绩已复制，去分享吧！';
        }).catch(() => {
            alert(text);
        });
    } else {
        alert(text);
    }
}

function generateDailyImage() {
    const dateStr = new Date().toISOString().slice(0, 10);
    const best = getDailyBest();

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Microsoft YaHei", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('看图猜区县 · 每日挑战', canvas.width / 2, 80);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText(dateStr, canvas.width / 2, 130);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 64px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText(String(dailyScore), canvas.width / 2, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText('今日得分', canvas.width / 2, 290);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 26px "Microsoft YaHei", Arial, sans-serif';
    ctx.fillText('今日最佳：' + best, canvas.width / 2, 350);

    const link = document.createElement('a');
    link.download = `每日挑战_${dateStr}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function getCityPool() {
    return [
        '石家庄市','唐山市','秦皇岛市','邯郸市','邢台市','保定市','张家口市','承德市','沧州市','廊坊市','衡水市',
        '太原市','大同市','阳泉市','长治市','晋城市','朔州市','晋中市','运城市','忻州市','临汾市','吕梁市',
        '呼和浩特市','包头市','乌海市','赤峰市','通辽市','鄂尔多斯市','呼伦贝尔市','巴彦淖尔市','乌兰察布市','兴安盟','锡林郭勒盟','阿拉善盟',
        '沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市','阜新市','辽阳市','盘锦市','铁岭市','朝阳市','葫芦岛市',
        '长春市','吉林市','四平市','辽源市','通化市','白山市','松原市','白城市','延边朝鲜族自治州',
        '哈尔滨市','齐齐哈尔市','鸡西市','鹤岗市','双鸭山市','大庆市','伊春市','佳木斯市','七台河市','牡丹江市','黑河市','绥化市','大兴安岭地区',
        '南京市','无锡市','徐州市','常州市','苏州市','南通市','连云港市','淮安市','盐城市','扬州市','镇江市','泰州市','宿迁市',
        '杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','衢州市','舟山市','台州市','丽水市',
        '合肥市','芜湖市','蚌埠市','淮南市','马鞍山市','淮北市','铜陵市','安庆市','黄山市','滁州市','阜阳市','宿州市','六安市','亳州市','池州市','宣城市',
        '福州市','厦门市','莆田市','三明市','泉州市','漳州市','南平市','龙岩市','宁德市',
        '南昌市','景德镇市','萍乡市','九江市','新余市','鹰潭市','赣州市','吉安市','宜春市','抚州市','上饶市',
        '济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','威海市','日照市','临沂市','德州市','聊城市','滨州市','菏泽市',
        '郑州市','开封市','洛阳市','平顶山市','安阳市','鹤壁市','新乡市','焦作市','濮阳市','许昌市','漯河市','三门峡市','南阳市','商丘市','信阳市','周口市','驻马店市','济源市',
        '武汉市','黄石市','十堰市','宜昌市','襄阳市','鄂州市','荆门市','孝感市','荆州市','黄冈市','咸宁市','随州市','恩施土家族苗族自治州','仙桃市','潜江市','天门市','神农架林区',
        '长沙市','株洲市','湘潭市','衡阳市','邵阳市','岳阳市','常德市','张家界市','益阳市','郴州市','永州市','怀化市','娄底市','湘西土家族苗族自治州',
        '广州市','韶关市','深圳市','珠海市','汕头市','佛山市','江门市','湛江市','茂名市','肇庆市','惠州市','梅州市','汕尾市','河源市','阳江市','清远市','东莞市','中山市','潮州市','揭阳市','云浮市',
        '南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市',
        '海口市','三亚市','儋州市',
        '成都市','自贡市','攀枝花市','泸州市','德阳市','绵阳市','广元市','遂宁市','内江市','乐山市','南充市','眉山市','宜宾市','广安市','达州市','雅安市','巴中市','资阳市','阿坝藏族羌族自治州','甘孜藏族自治州','凉山彝族自治州',
        '贵阳市','六盘水市','遵义市','安顺市','毕节市','铜仁市','黔西南布依族苗族自治州','黔东南苗族侗族自治州','黔南布依族苗族自治州',
        '昆明市','曲靖市','玉溪市','保山市','昭通市','丽江市','普洱市','临沧市','楚雄彝族自治州','红河哈尼族彝族自治州','文山壮族苗族自治州','西双版纳傣族自治州','大理白族自治州','德宏傣族景颇族自治州','怒江傈僳族自治州','迪庆藏族自治州',
        '拉萨市','日喀则市','昌都市','林芝市','山南市','那曲市','阿里地区',
        '西安市','铜川市','宝鸡市','咸阳市','渭南市','延安市','汉中市','榆林市','安康市','商洛市',
        '兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市','平凉市','酒泉市','庆阳市','定西市','陇南市','临夏回族自治州','甘南藏族自治州',
        '西宁市','海东市','海北藏族自治州','黄南藏族自治州','海南藏族自治州','果洛藏族自治州','玉树藏族自治州','海西蒙古族藏族自治州',
        '银川市','石嘴山市','吴忠市','固原市','中卫市',
        '乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市','昌吉回族自治州','博尔塔拉蒙古自治州','巴音郭楞蒙古自治州','阿克苏地区','克孜勒苏柯尔克孜自治州','喀什地区','和田地区','伊犁哈萨克自治州','塔城地区','阿勒泰地区'
    ];
}

function filterByRegion(pool) {
    if (selectedRegion === 'all' && selectedProvince === 'all') return pool;

    const provinceMap = {
        '北京市':'11','天津市':'12','河北省':'13','山西省':'14','内蒙古':'15',
        '辽宁省':'21','吉林省':'22','黑龙江省':'23','上海市':'31',
        '江苏省':'32','浙江省':'33','安徽省':'34','福建省':'35','江西省':'36','山东省':'37',
        '河南省':'41','湖北省':'42','湖南省':'43','广东省':'44','广西':'45','海南省':'46',
        '重庆市':'50','四川省':'51','贵州省':'52','云南省':'53','西藏':'54',
        '陕西省':'61','甘肃省':'62','青海省':'63','宁夏':'64','新疆':'65',
        '香港':'81','澳门':'82'
    };

    const regionMap = {
        north: ['11','12','13','14','15'],
        northeast: ['21','22','23'],
        east: ['31','32','33','34','35','36','37'],
        central: ['41','42','43'],
        south: ['44','45','46'],
        southwest: ['50','51','52','53','54'],
        northwest: ['61','62','63','64','65']
    };

    if (selectedProvince !== 'all') {
        const code = provinceMap[selectedProvince];
        if (!code) return pool;
        if (gameMode === 'easy') {
            return pool.filter(p => p === selectedProvince);
        }
        return pool.filter(c => getCityCode(c).startsWith(code));
    }

    if (selectedRegion !== 'all') {
        const codes = regionMap[selectedRegion] || [];
        if (gameMode === 'easy') {
            return pool.filter(p => codes.includes(provinceMap[p]?.substring(0, 2)));
        }
        return pool.filter(c => codes.includes(getCityCode(c).substring(0, 2)));
    }

    return pool;
}

function getProvinceCodeByDistrict(districtName) {
    if (districtName.includes('（')) {
        const city = districtName.match(/（(.+?)）/)?.[1] || '';
        const cityCode = getCityCode(city);
        if (cityCode) return cityCode.substring(0, 2);
    }
    return null;
}

function getCityCode(cityName) {
    const map = {
        '石家庄市':'1301','唐山市':'1302','秦皇岛市':'1303','邯郸市':'1304','邢台市':'1305','保定市':'1306','张家口市':'1307','承德市':'1308','沧州市':'1309','廊坊市':'1310','衡水市':'1311',
        '太原市':'1401','大同市':'1402','阳泉市':'1403','长治市':'1404','晋城市':'1405','朔州市':'1406','晋中市':'1407','运城市':'1408','忻州市':'1409','临汾市':'1410','吕梁市':'1411',
        '呼和浩特市':'1501','包头市':'1502','乌海市':'1503','赤峰市':'1504','通辽市':'1505','鄂尔多斯市':'1506','呼伦贝尔市':'1507','巴彦淖尔市':'1508','乌兰察布市':'1509','兴安盟':'1522','锡林郭勒盟':'1525','阿拉善盟':'1529',
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
    return map[cityName] || '';
}

function clearMap() {
    // 手机端只清除 Canvas
    if (window.innerWidth <= 768) {
        const oldCanvas = document.getElementById('districtCanvas');
        if (oldCanvas) oldCanvas.remove();
        currentPolygons = [];
        classicNeighborPolygons = [];
        return;
    }
    
    if (!map) return;
    
    currentPolygons.forEach(p => p.setMap(null));
    currentPolygons = [];

    classicNeighborPolygons.forEach(p => p.setMap(null));
    classicNeighborPolygons = [];
}

function showDistrict(district) {
    if (!map) {
        console.warn('地图未初始化');
        return;
    }
    
    if (!district || !district.boundaries || district.boundaries.length === 0) {
        setMsg('加载失败，换一个', 'wrong');
        return;
    }

    document.getElementById('hint').style.pointerEvents = 'none';
    document.getElementById('newBtn').disabled = true;

    targetDistrict = district;
    if (district.adcode) {
        districtCache[district.adcode] = district;
    }

    hintUsed = false;
    hintLevel = 0;
    hintDeduct = 0;

    setMsg('', '');
    document.getElementById('input').value = '';
    document.getElementById('input').focus();

    // 手机端：用自己的 Canvas 画轮廓
    if (window.innerWidth <= 768) {
        drawDistrictOnCanvas(district);
        // 手机端直接返回，跳过所有高德地图操作
        document.getElementById('hint').style.pointerEvents = '';
        document.getElementById('newBtn').disabled = false;
        return;
    }
    
    // 电脑端：正常用高德地图画
    currentPolygons = district.boundaries.map(b => new AMap.Polygon({
        map,
        path: b,
        strokeColor: gameMode === 'classic' ? '#FF0000' : '#FF4444',
        strokeWeight: gameMode === 'classic' ? 3 : 2,
        fillColor: gameMode === 'classic' ? '#FF0000' : '#FF4444',
        fillOpacity: gameMode === 'classic' ? 0.25 : 0.15
    }));

    map.setFitView(currentPolygons, null, [10, 10, 10, 10]);

    if (gameMode === 'classic' && !dailyMode) {
        map.setStatus({ dragEnable: false, zoomEnable: false, scrollWheel: false });

        setTimeout(() => {
            loadNeighborDistricts(district.adcode);
        }, 200);
    } else {
        document.getElementById('hint').style.pointerEvents = '';
        document.getElementById('newBtn').disabled = false;
    }
}

function drawDistrictOnCanvas(district) {
    
    const canvas = document.createElement('canvas');
    canvas.id = 'districtCanvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;background:#dfe9f5;';
        canvas.style.setProperty('z-index', '99999', 'important');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 移除旧 canvas
    const oldCanvas = document.getElementById('districtCanvas');
    if (oldCanvas) oldCanvas.remove();
    
    // 添加到 map 容器（但 map 已隐藏，canvas 不受影响）
    const mapDiv = document.getElementById('map');
    mapDiv.style.display = 'block';
    mapDiv.style.background = '#dfe9f5';
    mapDiv.appendChild(canvas);
    
    
    const ctx = canvas.getContext('2d');
        // 先涂白背景
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
    
    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / (maxX - minX);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2;
    
    function toCanvas(lng, lat) {
        return [
            offsetX + (lng - minX) * scale,
            canvas.height - offsetY - (lat - minY) * scale
        ];
    }
    
    district.boundaries.forEach(boundary => {
        ctx.beginPath();
        
        boundary.forEach((point, index) => {
            const lng = point.lng || point[0];
            const lat = point.lat || point[1];
            const [x, y] = toCanvas(lng, lat);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.closePath();
        ctx.strokeStyle = gameMode === 'classic' ? '#FF0000' : '#FF4444';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = gameMode === 'classic' ? 'rgba(255,0,0,0.25)' : 'rgba(255,68,68,0.15)';
        ctx.fill();
    });
    
}

function drawNeighborsOnCanvas(neighborData, targetDistrict) {
    const canvas = document.getElementById('districtCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 收集所有边界点
    let allPoints = [];
    
    targetDistrict.boundaries.forEach(b => allPoints.push(...b));
    neighborData.forEach(nd => {
        nd.boundaries.forEach(b => allPoints.push(...b));
    });
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    allPoints.forEach(point => {
        const lng = point.lng || point[0];
        const lat = point.lat || point[1];
        minX = Math.min(minX, lng);
        maxX = Math.max(maxX, lng);
        minY = Math.min(minY, lat);
        maxY = Math.max(maxY, lat);
    });
    
    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / (maxX - minX);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2;
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2;
    
    function toCanvas(lng, lat) {
        return [
            offsetX + (lng - minX) * scale,
            canvas.height - offsetY - (lat - minY) * scale
        ];
    }
    
    // 清空 Canvas
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 画目标区县
    targetDistrict.boundaries.forEach(boundary => {
        ctx.beginPath();
        boundary.forEach((point, i) => {
            const lng = point.lng || point[0];
            const lat = point.lat || point[1];
            const [x, y] = toCanvas(lng, lat);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,0,0,0.25)';
        ctx.fill();
    });
    
    // 画邻居
    neighborData.forEach(nd => {
        nd.boundaries.forEach(boundary => {
            ctx.beginPath();
            boundary.forEach((point, i) => {
                const lng = point.lng || point[0];
                const lat = point.lat || point[1];
                const [x, y] = toCanvas(lng, lat);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.strokeStyle = '#4488FF';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(68,136,255,0.1)';
            ctx.fill();
        });
    });
    
}

function loadDistrict(name) {
    // 检查搜索对象是否已创建
    if (!ds || !dsCity || !dsProvince) {
        console.warn('搜索对象未初始化，等待...');
        setMsg('⏳ 地图加载中，请稍候...', '');
        setTimeout(() => loadDistrict(name), 500);
        return;
    }
    
    clearMap();
    const tl = ++loadId;

    if (gameMode === 'easy') {
        dsProvince.search(name, (status, result) => {
            if (tl !== loadId) return;
            if (status === 'complete' && result.districtList.length > 0) {
                showDistrict(result.districtList[0]);
            } else {
                setMsg('加载失败，换一个', 'wrong');
            }
        });
        return;
    }

    if (gameMode === 'normal') {
        dsCity.search(name, (status, result) => {
            if (tl !== loadId) return;
            if (status === 'complete' && result.districtList.length > 0) {
                const d = result.districtList.find(x => x.level === 'city') || result.districtList[0];
                if (d && (d.level === 'city' || d.level === 'district')) {
                    showDistrict(d);
                } else {
                    setMsg('加载失败，换一个', 'wrong');
                }
            } else {
                setMsg('加载失败，换一个', 'wrong');
            }
        });
        return;
    }

    // 困难 / 经典 / 每日挑战
    const bm = name.match(/（(.+?)）$/);
    const baseName = bm ? name.replace(/（.+?）$/, '') : name;
    const parentName = bm ? bm[1] : null;

    ds.search(baseName, (status, result) => {
        if (tl !== loadId) return;

        if (status !== 'complete' || result.districtList.length === 0) {
            setMsg('加载失败，换一个', 'wrong');
            return;
        }

        let d;

        if (parentName) {
            d = result.districtList.find(x => {
                if (x.level !== 'district') return false;
                const city = getCityName(x.adcode);
                return city.includes(parentName) || parentName.includes(city);
            });
        }

        if (!d) {
            d = result.districtList.find(x => x.name === baseName && x.level === 'district');
        }

        if (!d) {
            d = result.districtList.find(x => x.level === 'district');
        }

        if (!d) {
            newRound();
            return;
        }

        showDistrict(d);

        if (gameMode === 'classic' && !dailyMode) {
            setTimeout(() => {
                loadNeighborDistricts(d.adcode);
            }, 200);
        }
    });
}

function getCitiesByProvince(province) {
    const map = {
        '北京市': ['110100'],
        '天津市': ['120100'],
        '河北省': ['130100','130200','130300','130400','130500','130600','130700','130800','130900','131000','131100'],
        '山西省': ['140100','140200','140300','140400','140500','140600','140700','140800','140900','141000','141100'],
        '内蒙古自治区': ['150100','150200','150300','150400','150500','150600','150700','150800','150900','152200','152500','152900'],
        '辽宁省': ['210100','210200','210300','210400','210500','210600','210700','210800','210900','211000','211100','211200','211300','211400'],
        '吉林省': ['220100','220200','220300','220400','220500','220600','220700','220800','222400'],
        '黑龙江省': ['230100','230200','230300','230400','230500','230600','230700','230800','230900','231000','231100','231200','232700'],
        '上海市': ['310100'],
        '江苏省': ['320100','320200','320300','320400','320500','320600','320700','320800','320900','321000','321100','321200','321300'],
        '浙江省': ['330100','330200','330300','330400','330500','330600','330700','330800','330900','331000','331100'],
        '安徽省': ['340100','340200','340300','340400','340500','340600','340700','340800','341000','341100','341200','341300','341500','341600','341700','341800'],
        '福建省': ['350100','350200','350300','350400','350500','350600','350700','350800','350900'],
        '江西省': ['360100','360200','360300','360400','360500','360600','360700','360800','360900','361000','361100'],
        '山东省': ['370100','370200','370300','370400','370500','370600','370700','370800','370900','371000','371100','371300','371400','371500','371600','371700'],
        '河南省': ['410100','410200','410300','410400','410500','410600','410700','410800','410900','411000','411100','411200','411300','411400','411500','411600','411700','419000'],
        '湖北省': ['420100','420200','420300','420500','420600','420700','420800','420900','421000','421100','421200','421300','422800','429000','429100','429200','429300'],
        '湖南省': ['430100','430200','430300','430400','430500','430600','430700','430800','430900','431000','431100','431200','431300','433100'],
        '广东省': ['440100','440200','440300','440400','440500','440600','440700','440800','440900','441200','441300','441400','441500','441600','441700','441800','441900','442000','445100','445200','445300'],
        '广西壮族自治区': ['450100','450200','450300','450400','450500','450600','450700','450800','450900','451000','451100','451200','451300','451400'],
        '海南省': ['460100','460200','460400'],
        '重庆市': ['500100'],
        '四川省': ['510100','510300','510400','510500','510600','510700','510800','510900','511000','511100','511300','511400','511500','511600','511700','511800','511900','512000','513200','513300','513400'],
        '贵州省': ['520100','520200','520300','520400','520500','520600','522300','522600','522700'],
        '云南省': ['530100','530300','530400','530500','530600','530700','530800','530900','532300','532500','532600','532800','532900','533100','533300','533400'],
        '西藏自治区': ['540100','540200','540300','540400','540500','540600','542500'],
        '陕西省': ['610100','610200','610300','610400','610500','610600','610700','610800','610900','611000'],
        '甘肃省': ['620100','620200','620300','620400','620500','620600','620700','620800','620900','621000','621100','621200','622900','623000'],
        '青海省': ['630100','630200','632200','632300','632500','632600','632700','632800'],
        '宁夏回族自治区': ['640100','640200','640300','640400','640500'],
        '新疆维吾尔自治区': ['650100','650200','650400','650500','652300','652700','652800','652900','653000','653100','653200','654000','654200','654300'],
        '香港特别行政区': ['810000'],
        '澳门特别行政区': ['820000']
    };
    return map[province] || [];
}

function newRound() {
    // 检查地图是否已初始化
    if (!map) {
        console.warn('地图未初始化，跳过新回合');
        return;
    }
    
    // 检查搜索对象是否已创建
    if (!ds || !dsCity || !dsProvince) {
        console.warn('搜索对象未初始化，等待...');
        setTimeout(() => newRound(), 500);
        return;
    }
    
    classicNeighborPolygons.forEach(p => p.setMap(null));
    classicNeighborPolygons = [];

    clearMap();
    targetDistrict = null;
    hintUsed = false;
    hintLevel = 0;
    hintDeduct = 0;

    map.setStatus({ dragEnable: true, zoomEnable: true, scrollWheel: true });

    document.getElementById('input').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('input').value = '';
    setMsg('', '');
        const isFiltered = (gameMode === 'hard') &&
                       (selectedRegion !== 'all' || selectedProvince !== 'all');
    if (isFiltered) {
        let st = selectedProvince !== 'all' ? selectedProvince : null;

        if (!st) {
            const regionProvinces = {
                'north': ['河北省','山西省','内蒙古自治区','北京市','天津市'],
                'northeast': ['辽宁省','吉林省','黑龙江省'],
                'east': ['上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省'],
                'central': ['河南省','湖北省','湖南省'],
                'south': ['广东省','广西壮族自治区','海南省'],
                'southwest': ['重庆市','四川省','贵州省','云南省','西藏自治区'],
                'northwest': ['陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区']
            };
            const provinces = regionProvinces[selectedRegion] || ['北京市'];
            st = provinces[Math.floor(Math.random() * provinces.length)];
        }

        const provinceFullMap = {
    '内蒙古': '内蒙古自治区',
    '广西': '广西壮族自治区',
    '西藏': '西藏自治区',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区',
    '香港': '香港特别行政区',
    '澳门': '澳门特别行政区'
};

st = provinceFullMap[st] || st;

        const cityCodes = getCitiesByProvince(st);

        if (cityCodes.length === 0) {
            setMsg('该地区无区县数据，换一个', '');
            setTimeout(() => newRound(), 1000);
            return;
        }

        const cityCode = cityCodes[Math.floor(Math.random() * cityCodes.length)];

        dsCity.search(cityCode, (s2, r2) => {
            if (s2 === 'complete' && r2.districtList.length > 0) {
                const districts = (r2.districtList[0].districtList || []).filter(d => d.level === 'district' && d.adcode);

                if (districts.length === 0) {
                    newRound();
                    return;
                }

                const fp = districts.filter(d => !recentDistricts.includes(d.name));
                const pick = (fp.length > 0 ? fp : districts)[
                    Math.floor(Math.random() * (fp.length > 0 ? fp : districts).length)
                ];

                ds.search(pick.adcode, (s3, r3) => {
                    if (s3 === 'complete' && r3.districtList.length > 0 && r3.districtList[0].level === 'district') {
                        recentDistricts.push(pick.name);
                        if (recentDistricts.length > 20) recentDistricts.shift();
                        showDistrict(r3.districtList[0]);
                    } else {
                        newRound();
                    }
                });
            } else {
                newRound();
            }
        });

        return;
    }

    const next = getRandomDistrict();
    loadDistrict(next);
}

function getCityName(adcode) {
    if (!adcode) return '未知';

    const cityMap = {
        '1101':'北京市','1201':'天津市',
        '1301':'石家庄市','1302':'唐山市','1303':'秦皇岛市','1304':'邯郸市','1305':'邢台市','1306':'保定市','1307':'张家口市','1308':'承德市','1309':'沧州市','1310':'廊坊市','1311':'衡水市',
        '1401':'太原市','1402':'大同市','1403':'阳泉市','1404':'长治市','1405':'晋城市','1406':'朔州市','1407':'晋中市','1408':'运城市','1409':'忻州市','1410':'临汾市','1411':'吕梁市',
        '1501':'呼和浩特市','1502':'包头市','1503':'乌海市','1504':'赤峰市','1505':'通辽市','1506':'鄂尔多斯市','1507':'呼伦贝尔市','1508':'巴彦淖尔市','1509':'乌兰察布市','1522':'兴安盟','1525':'锡林郭勒盟','1529':'阿拉善盟',
        '2101':'沈阳市','2102':'大连市','2103':'鞍山市','2104':'抚顺市','2105':'本溪市','2106':'丹东市','2107':'锦州市','2108':'营口市','2109':'阜新市','2110':'辽阳市','2111':'盘锦市','2112':'铁岭市','2113':'朝阳市','2114':'葫芦岛市',
        '2201':'长春市','2202':'吉林市','2203':'四平市','2204':'辽源市','2205':'通化市','2206':'白山市','2207':'松原市','2208':'白城市','2224':'延边朝鲜族自治州',
        '2301':'哈尔滨市','2302':'齐齐哈尔市','2303':'鸡西市','2304':'鹤岗市','2305':'双鸭山市','2306':'大庆市','2307':'伊春市','2308':'佳木斯市','2309':'七台河市','2310':'牡丹江市','2311':'黑河市','2312':'绥化市','2327':'大兴安岭地区',
        '3101':'上海市',
        '3201':'南京市','3202':'无锡市','3203':'徐州市','3204':'常州市','3205':'苏州市','3206':'南通市','3207':'连云港市','3208':'淮安市','3209':'盐城市','3210':'扬州市','3211':'镇江市','3212':'泰州市','3213':'宿迁市',
        '3301':'杭州市','3302':'宁波市','3303':'温州市','3304':'嘉兴市','3305':'湖州市','3306':'绍兴市','3307':'金华市','3308':'衢州市','3309':'舟山市','3310':'台州市','3311':'丽水市',
        '3401':'合肥市','3402':'芜湖市','3403':'蚌埠市','3404':'淮南市','3405':'马鞍山市','3406':'淮北市','3407':'铜陵市','3408':'安庆市','3410':'黄山市','3411':'滁州市','3412':'阜阳市','3413':'宿州市','3415':'六安市','3416':'亳州市','3417':'池州市','3418':'宣城市',
        '3501':'福州市','3502':'厦门市','3503':'莆田市','3504':'三明市','3505':'泉州市','3506':'漳州市','3507':'南平市','3508':'龙岩市','3509':'宁德市',
        '3601':'南昌市','3602':'景德镇市','3603':'萍乡市','3604':'九江市','3605':'新余市','3606':'鹰潭市','3607':'赣州市','3608':'吉安市','3609':'宜春市','3610':'抚州市','3611':'上饶市',
        '3701':'济南市','3702':'青岛市','3703':'淄博市','3704':'枣庄市','3705':'东营市','3706':'烟台市','3707':'潍坊市','3708':'济宁市','3709':'泰安市','3710':'威海市','3711':'日照市','3713':'临沂市','3714':'德州市','3715':'聊城市','3716':'滨州市','3717':'菏泽市',
        '4101':'郑州市','4102':'开封市','4103':'洛阳市','4104':'平顶山市','4105':'安阳市','4106':'鹤壁市','4107':'新乡市','4108':'焦作市','4109':'濮阳市','4110':'许昌市','4111':'漯河市','4112':'三门峡市','4113':'南阳市','4114':'商丘市','4115':'信阳市','4116':'周口市','4117':'驻马店市','4190':'济源市',
        '4201':'武汉市','4202':'黄石市','4203':'十堰市','4205':'宜昌市','4206':'襄阳市','4207':'鄂州市','4208':'荆门市','4209':'孝感市','4210':'荆州市','4211':'黄冈市','4212':'咸宁市','4213':'随州市','4228':'恩施土家族苗族自治州','4290':'仙桃市','4291':'潜江市','4292':'天门市','4293':'神农架林区',
        '4301':'长沙市','4302':'株洲市','4303':'湘潭市','4304':'衡阳市','4305':'邵阳市','4306':'岳阳市','4307':'常德市','4308':'张家界市','4309':'益阳市','4310':'郴州市','4311':'永州市','4312':'怀化市','4313':'娄底市','4331':'湘西土家族苗族自治州',
        '4401':'广州市','4402':'韶关市','4403':'深圳市','4404':'珠海市','4405':'汕头市','4406':'佛山市','4407':'江门市','4408':'湛江市','4409':'茂名市','4412':'肇庆市','4413':'惠州市','4414':'梅州市','4415':'汕尾市','4416':'河源市','4417':'阳江市','4418':'清远市','4419':'东莞市','4420':'中山市','4451':'潮州市','4452':'揭阳市','4453':'云浮市',
        '4501':'南宁市','4502':'柳州市','4503':'桂林市','4504':'梧州市','4505':'北海市','4506':'防城港市','4507':'钦州市','4508':'贵港市','4509':'玉林市','4510':'百色市','4511':'贺州市','4512':'河池市','4513':'来宾市','4514':'崇左市',
        '4601':'海口市','4602':'三亚市','4604':'儋州市',
        '5001':'重庆市',
        '5101':'成都市','5103':'自贡市','5104':'攀枝花市','5105':'泸州市','5106':'德阳市','5107':'绵阳市','5108':'广元市','5109':'遂宁市','5110':'内江市','5111':'乐山市','5113':'南充市','5114':'眉山市','5115':'宜宾市','5116':'广安市','5117':'达州市','5118':'雅安市','5119':'巴中市','5120':'资阳市','5132':'阿坝藏族羌族自治州','5133':'甘孜藏族自治州','5134':'凉山彝族自治州',
        '5201':'贵阳市','5202':'六盘水市','5203':'遵义市','5204':'安顺市','5205':'毕节市','5206':'铜仁市','5223':'黔西南布依族苗族自治州','5226':'黔东南苗族侗族自治州','5227':'黔南布依族苗族自治州',
        '5301':'昆明市','5303':'曲靖市','5304':'玉溪市','5305':'保山市','5306':'昭通市','5307':'丽江市','5308':'普洱市','5309':'临沧市','5323':'楚雄彝族自治州','5325':'红河哈尼族彝族自治州','5326':'文山壮族苗族自治州','5328':'西双版纳傣族自治州','5329':'大理白族自治州','5331':'德宏傣族景颇族自治州','5333':'怒江傈僳族自治州','5334':'迪庆藏族自治州',
        '5401':'拉萨市','5402':'日喀则市','5403':'昌都市','5404':'林芝市','5405':'山南市','5406':'那曲市','5425':'阿里地区',
        '6101':'西安市','6102':'铜川市','6103':'宝鸡市','6104':'咸阳市','6105':'渭南市','6106':'延安市','6107':'汉中市','6108':'榆林市','6109':'安康市','6110':'商洛市',
        '6201':'兰州市','6202':'嘉峪关市','6203':'金昌市','6204':'白银市','6205':'天水市','6206':'武威市','6207':'张掖市','6208':'平凉市','6209':'酒泉市','6210':'庆阳市','6211':'定西市','6212':'陇南市','6229':'临夏回族自治州','6230':'甘南藏族自治州',
        '6301':'西宁市','6302':'海东市','6322':'海北藏族自治州','6323':'黄南藏族自治州','6325':'海南藏族自治州','6326':'果洛藏族自治州','6327':'玉树藏族自治州','6328':'海西蒙古族藏族自治州',
        '6401':'银川市','6402':'石嘴山市','6403':'吴忠市','6404':'固原市','6405':'中卫市',
        '6501':'乌鲁木齐市','6502':'克拉玛依市','6504':'吐鲁番市','6505':'哈密市','6523':'昌吉回族自治州','6527':'博尔塔拉蒙古自治州','6528':'巴音郭楞蒙古自治州','6529':'阿克苏地区','6530':'克孜勒苏柯尔克孜自治州','6531':'喀什地区','6532':'和田地区','6540':'伊犁哈萨克自治州','6542':'塔城地区','6543':'阿勒泰地区',
        '8100':'香港特别行政区','8200':'澳门特别行政区'
    };

    if (cityMap[adcode.substring(0, 4)]) {
        return cityMap[adcode.substring(0, 4)];
    }

    const provinceMap = {
        '11':'北京市','12':'天津市','13':'河北省','14':'山西省','15':'内蒙古自治区',
        '21':'辽宁省','22':'吉林省','23':'黑龙江省','31':'上海市',
        '32':'江苏省','33':'浙江省','34':'安徽省','35':'福建省','36':'江西省','37':'山东省',
        '41':'河南省','42':'湖北省','43':'湖南省','44':'广东省','45':'广西壮族自治区','46':'海南省',
        '50':'重庆市','51':'四川省','52':'贵州省','53':'云南省','54':'西藏自治区',
        '61':'陕西省','62':'甘肃省','63':'青海省','64':'宁夏回族自治区','65':'新疆维吾尔自治区',
        '81':'香港特别行政区','82':'澳门特别行政区'
    };

    return provinceMap[adcode.substring(0, 2)] || '未知';
}

function showHint() {
    if (!targetDistrict || !map) return;

    playSound('hint');

    const adcode = targetDistrict.adcode || '';
    const provinceCode = adcode.substring(0, 2);
    const cityName = getCityName(adcode);

    const provinceMap = {
        '11':'北京市','12':'天津市','13':'河北省','14':'山西省','15':'内蒙古',
        '21':'辽宁省','22':'吉林省','23':'黑龙江省','31':'上海市',
        '32':'江苏省','33':'浙江省','34':'安徽省','35':'福建省','36':'江西省','37':'山东省',
        '41':'河南省','42':'湖北省','43':'湖南省','44':'广东省','45':'广西','46':'海南省',
        '50':'重庆市','51':'四川省','52':'贵州省','53':'云南省','54':'西藏',
        '61':'陕西省','62':'甘肃省','63':'青海省','64':'宁夏','65':'新疆',
        '81':'香港','82':'澳门'
    };

    const regionMap = {
        '11':'华北','12':'华北','13':'华北','14':'华北','15':'华北',
        '21':'东北','22':'东北','23':'东北',
        '31':'华东','32':'华东','33':'华东','34':'华东','35':'华东','36':'华东','37':'华东',
        '41':'华中','42':'华中','43':'华中',
        '44':'华南','45':'华南','46':'华南',
        '50':'西南','51':'西南','52':'西南','53':'西南','54':'西南',
        '61':'西北','62':'西北','63':'西北','64':'西北','65':'西北',
        '81':'港澳','82':'港澳'
    };

    const regionName = regionMap[provinceCode] || '';
    const provinceName = provinceMap[provinceCode] || '';

    // ==================== 经典模式 ====================
    if (gameMode === 'classic') {
        if (hintLevel >= 3) return;

        hintLevel++;
        hintUsed = true;

        if (window.innerWidth <= 768) {
            if (targetDistrict) {
                drawDistrictAndNeighbors(targetDistrict, mobileNeighborData || []);
            }
            setMsg(`💡 视野已放大（累计-${hintLevel * 0.5}分）`, '');
            return;
        }

        if (hintLevel === 1) {
            hintDeduct = 0.5;
            map.setStatus({ zoomEnable: true });
            map.setZoom(map.getZoom() - 0.3);
            map.setStatus({ zoomEnable: false });
            setMsg(`💡 视野已放大（累计-0.5分）`, '');
        } else if (hintLevel === 2) {
            hintDeduct = 1.0;
            map.setStatus({ zoomEnable: true });
            map.setZoom(map.getZoom() - 0.3);
            map.setStatus({ zoomEnable: false });
            setMsg(`💡 视野再次放大（累计-1.0分）`, '');
        } else {
            hintDeduct = 1.5;
            map.setStatus({ zoomEnable: true });
            map.setZoom(map.getZoom() - 0.5);
            map.setStatus({ zoomEnable: false });
            setMsg(`💡 已放大到最大视野（累计-1.5分）`, '');
        }
        return;
    }

    // ==================== 简单模式 ====================
    if (gameMode === 'easy') {
        // 有筛选时无提示
        if (selectedRegion !== 'all' || selectedProvince !== 'all') {
            setMsg('💡 简单模式筛选后不支持提示', '');
            return;
        }
        
        // 无筛选时保持原样
        if (hintLevel >= 1) return;
        hintLevel++;
        hintUsed = true;
        hintDeduct = 0.6;
        setMsg(`💡 ${regionName}（累计-0.6分）`, '');
        return;
    }

    // ==================== 中等模式 ====================
    if (gameMode === 'normal') {
        // 大区筛选：给省份提示
        if (selectedRegion !== 'all' && selectedProvince === 'all') {
            if (hintLevel >= 1) return;
            hintLevel++;
            hintUsed = true;
            hintDeduct = 0.6;
            setMsg(`💡 ${provinceName}（-0.6分）`, '');
            return;
        }
        
        // 省份筛选：无提示
        if (selectedProvince !== 'all') {
            setMsg('💡 中等模式+省份筛选不支持提示', '');
            return;
        }
        
        // 无筛选：原样
        if (hintLevel >= 2) return;
        hintLevel++;
        hintUsed = true;
        hintDeduct += 0.3;

        if (hintLevel === 1) {
            setMsg(`💡 ${regionName}（累计-0.3分）`, '');
        } else {
            setMsg(`💡 ${regionName} · ${provinceName}（累计-0.6分）`, '');
        }
        return;
    }

    // ==================== 困难模式 ====================
    if (gameMode === 'hard') {
        // 大区筛选：省→地级
        if (selectedRegion !== 'all' && selectedProvince === 'all') {
            if (hintLevel >= 2) return;
            hintLevel++;
            hintUsed = true;
            
            if (hintLevel === 1) {
                hintDeduct = 0.3;
                setMsg(`💡 ${provinceName}（-0.3分）`, '');
            } else {
                hintDeduct = 0.6;
                setMsg(`💡 ${provinceName} · ${cityName}（-0.6分）`, '');
            }
            return;
        }
        
        // 省份筛选：地级
        if (selectedProvince !== 'all') {
            if (hintLevel >= 1) return;
            hintLevel++;
            hintUsed = true;
            hintDeduct = 0.6;
            setMsg(`💡 ${cityName}（-0.6分）`, '');
            return;
        }
        
        // 无筛选：原样3档
        if (hintLevel >= 3) return;
        hintLevel++;
        hintUsed = true;
        hintDeduct += 0.2;

        if (hintLevel === 1) {
            setMsg(`💡 ${regionName}（累计-0.2分）`, '');
        } else if (hintLevel === 2) {
            setMsg(`💡 ${regionName} · ${provinceName}（累计-0.4分）`, '');
        } else {
            setMsg(`💡 ${regionName} · ${provinceName} · ${cityName}（累计-0.6分）`, '');
        }
        return;
    }
}

function setGameSpeed() {
    const speedSelect = document.getElementById('speedSelect');
    const speedHint = document.getElementById('speedHint');
    
    if (!speedSelect) return;
    
    gameSpeed = speedSelect.value;
    
    // 显示当前速度说明
    const speedInfo = {
        'instant': {
            text: '⚡ 即时模式：答对后立即切换，不等待',
            className: 'speed-instant'
        },
        'fast': {
            text: '⚡ 快速模式：答对后短暂停留，适合高手挑战',
            className: 'speed-fast'
        },
        'normal': {
            text: '🚶 正常模式：适中节奏，推荐新手使用',
            className: 'speed-normal'
        },
        'slow': {
            text: '🐢 慢速模式：有充足时间观察地图',
            className: 'speed-slow'
        }
    };
    
    if (speedHint && speedInfo[gameSpeed]) {
        speedHint.textContent = speedInfo[gameSpeed].text;
        speedHint.className = 'speed-hint show ' + speedInfo[gameSpeed].className;
        
        // 3秒后自动隐藏提示
        clearTimeout(window.speedHintTimeout);
        window.speedHintTimeout = setTimeout(() => {
            speedHint.classList.remove('show');
        }, 3000);
    }
    
    // 保存用户偏好
    localStorage.setItem('gameSpeed', gameSpeed);
    
    // 播放音效
    playSound('click');
}

function getDelay() {
    if (gameSpeed === 'instant') return 0;
    if (gameSpeed === 'fast') return 600;
    if (gameSpeed === 'slow') return 2500;
    return 1500;
}

function checkAnswer() {
    if (!targetDistrict) return;

if (dailyMode) {
    const input = document.getElementById('dailyInput').value.trim();
    if (!input) return;

    const match = matchForMode(input);
    let correct = false;

    if (match.status === 'exact' || match.status === 'partial') {
        const matchBase = match.name.replace(/（.+?）$/, '');
        const targetBase = targetDistrict.name.replace(/（.+?）$/, '');

        correct = match.name === targetDistrict.name || matchBase === targetBase;
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
            document.getElementById('dailyMsg').textContent = '⚠️ 请输入更完整名称';
            return;
        }
    }

        if (correct) {
            playSound('correct');

            dailyScore += 1;
            const dailyScoreEl = document.getElementById('dailyScore');
            dailyScoreEl.textContent = '得分: ' + dailyScore;
            dailyScoreEl.classList.add('score-bounce');
            setTimeout(() => dailyScoreEl.classList.remove('score-bounce'), 300);

            document.getElementById('dailyMsg').textContent = '✅ 正确！';
            dailyIndex++;
setTimeout(loadDailyQuestion, getDelay());
        } else {
            playSound('wrong');

            document.getElementById('dailyMsg').textContent = '❌ 不对，再猜！';
            document.getElementById('dailyInput').value = '';
            document.getElementById('dailyInput').focus();
        }
        return;
    }

const input = document.getElementById('input').value.trim();
if (!input) return;

const match = matchForMode(input);
let correct = false;

if (match.status === 'exact' || match.status === 'partial') {
    const matchBase = match.name.replace(/（.+?）$/, '');
    const targetBase = targetDistrict.name.replace(/（.+?）$/, '');

    correct = match.name === targetDistrict.name || matchBase === targetBase;
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
        setMsg('⚠️ 请输入更完整名称', 'wrong');
        return;
    }
}

    if (correct) {
        playSound('correct');

        const earned = gameMode === 'classic' ? (3 - hintLevel * 0.5) : (1 - hintDeduct);
        const panel = document.getElementById('panel');
        panel.classList.add('green-flash');
        setTimeout(() => panel.classList.remove('green-flash'), 600);
        score += earned;

setMsg(`✅ 正确！是 ${targetDistrict.name}` + (hintUsed ? `（使用提示，得${earned.toFixed(1)}分）` : `（+${earned.toFixed(1)}分）`), 'correct');

        const scoreEl = document.getElementById('score');
        scoreEl.textContent = '得分: ' + score.toFixed(1);
        scoreEl.classList.add('score-bounce');
        setTimeout(() => scoreEl.classList.remove('score-bounce'), 300);

        document.getElementById('input').disabled = true;
        document.getElementById('submitBtn').disabled = true;

setTimeout(() => {
    if (!timerMode || timerSeconds > 0) newRound();
}, getDelay());
    } else {
        playSound('wrong');

        setMsg('❌ 不对，再猜！', 'wrong');

        const panel = document.getElementById('panel');
        panel.classList.add('shake');
        setTimeout(() => panel.classList.remove('shake'), 350);

        document.getElementById('input').value = '';
        document.getElementById('input').focus();
    }
}

function toggleTimer() {
    timerMode = !timerMode;

    const btnTimer = document.getElementById('btnTimer');
    const timerDisplay = document.getElementById('timerDisplay');

    if (timerMode) {
        score = 0;
        timerSeconds = 60;
        bestTime30 = null;

        document.getElementById('score').textContent = '得分: 0';

        btnTimer.classList.add('active');
        timerDisplay.style.display = 'block';
        timerDisplay.textContent = '⏱ 剩余: 60秒';
        timerDisplay.style.color = '#666';

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds--;
            timerDisplay.textContent = `⏱ 剩余: ${timerSeconds}秒 | 得分: ${score.toFixed(1)}`;

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                playSound('timeup');
                timerInterval = null;

                timerDisplay.textContent = `⏰ 时间到！得分: ${score.toFixed(1)}，点击“计时”关闭`;
                timerDisplay.style.color = '#ef4444';

                document.getElementById('input').disabled = true;
                document.getElementById('submitBtn').disabled = true;

                saveBestScore(score);
            }
        }, 1000);
    } else {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        btnTimer.classList.remove('active');
        timerDisplay.style.display = 'none';
        timerDisplay.textContent = '';
        timerDisplay.style.color = '#666';

        if (!timerMode || timerSeconds > 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
        }
    }

    if (map) {
        newRound();
    }
}

function saveBestScore(finalScore) {
    const key = 'bestScore_' + gameMode;
    const best = Number(localStorage.getItem(key) || '0');

    if (finalScore > best) {
        localStorage.setItem(key, String(finalScore));
    }

    updateBestScoreDisplay();
}

function getDailyBest() {
    const key = 'dailyBest_' + new Date().toISOString().slice(0, 10);
    return Number(localStorage.getItem(key) || '0');
}

function updateDailyBestDisplay() {
    const best = getDailyBest();
    document.getElementById('dailyBestDisplay').textContent = '📅 今日挑战最佳 ' + best;
}

function loadNeighborDistricts(targetAdcode) {
    // 手机端：直接用 ADJACENCY 数据
    if (window.innerWidth <= 768) {
        loadNeighborsFromData();
        return;
    }
    
    // 电脑端：原始逻辑不变
    classicNeighborPolygons.forEach(p => p.setMap(null));
    classicNeighborPolygons = [];

    const tl = ++classicLoadId;
    const cityCode4 = targetAdcode.substring(0, 4);

    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;

    dsCity.search(cityCode4 + '00', (status, result) => {
        if (tl !== classicLoadId) return;

        if (status !== 'complete' || result.districtList.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('input').focus();
            return;
        }

        const cityData = result.districtList[0];
        let districts = [];

        if (cityData.districtList) {
            districts = cityData.districtList.filter(d => d.level === 'district' && d.adcode !== targetAdcode);
        }

        if (districts.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('input').focus();
            return;
        }

        let cacheHitCount = 0;
        let finishedCount = 0;
        const drawnAdcodes = new Set();
        const total = districts.length;

        function finishIfDone() {
            finishedCount++;
            if (finishedCount >= total) {
                document.getElementById('msg').textContent = '';
                document.getElementById('input').disabled = false;
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('hint').style.pointerEvents = '';
                document.getElementById('newBtn').disabled = false;
                document.getElementById('input').focus();
            }
        }

        function loadOne(d, retry) {
            let done = false;

            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    if (retry > 0) {
                        loadOne(d, retry - 1);
                    } else {
                        finishIfDone();
                    }
                }
            }, 1000);

            if (districtCache[d.adcode]) {
                if (!drawnAdcodes.has(d.adcode)) {
                    drawnAdcodes.add(d.adcode);

                    const cached = districtCache[d.adcode];
                    if (cached.boundaries && cached.boundaries.length > 0) {
                        const p = cached.boundaries.map(b => new AMap.Polygon({
                            map,
                            path: b,
                            strokeColor: '#4488FF',
                            strokeWeight: 2,
                            fillColor: '#4488FF',
                            fillOpacity: 0.1
                        }));
                        classicNeighborPolygons.push(...p);
                    }
                }

                cacheHitCount++;
                document.getElementById('msg').textContent = `✅ 缓存命中 ${cacheHitCount} 次`;
                finishIfDone();
                return;
            }

            ds.search(d.adcode, (s2, r2) => {
                if (done) return;
                done = true;
                clearTimeout(timeout);

                if (tl !== classicLoadId) return;

                if (s2 === 'complete' && r2.districtList.length > 0) {
                    const nd = r2.districtList.find(x => x.level === 'district') || r2.districtList[0];

                    if (nd && nd.boundaries && nd.boundaries.length > 0) {
                        districtCache[nd.adcode] = nd;

                        if (!drawnAdcodes.has(nd.adcode)) {
                            drawnAdcodes.add(nd.adcode);

                            const polygons = nd.boundaries.map(b => new AMap.Polygon({
                                map,
                                path: b,
                                strokeColor: '#0066FF',
                                strokeWeight: 3,
                                fillColor: '#3399FF',
                                fillOpacity: 0.2
                            }));
                            classicNeighborPolygons.push(...polygons);
                        }
                    }
                }

                finishIfDone();
            });
        }

        districts.forEach(d => {
            loadOne(d, 5);
        });
    });
}

// 手机端：加载目标区县所属地级市的所有区县
function loadNeighborsFromData() {
    if (!targetDistrict) return;
    
    const targetAdcode = targetDistrict.adcode || '';
    const cityCode4 = targetAdcode.substring(0, 4);
    
    // 加载期间禁用输入
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('hint').style.pointerEvents = 'none';
    document.getElementById('newBtn').disabled = true;
    
    dsCity.search(cityCode4 + '00', (status, result) => {
        if (status !== 'complete' || result.districtList.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('hint').style.pointerEvents = '';
            document.getElementById('newBtn').disabled = false;
            document.getElementById('input').focus();
            return;
        }
        
        const cityData = result.districtList[0];
        let districts = [];
        
        if (cityData.districtList) {
            districts = cityData.districtList.filter(d => d.level === 'district' && d.adcode !== targetAdcode);
        }
        
        if (districts.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('hint').style.pointerEvents = '';
            document.getElementById('newBtn').disabled = false;
            document.getElementById('input').focus();
            return;
        }
        
        const neighborData = [];
        let finishedCount = 0;
        const total = districts.length;
        
        function finishIfDone() {
            finishedCount++;
            if (finishedCount >= total) {
                document.getElementById('msg').textContent = '';
                document.getElementById('input').disabled = false;
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('hint').style.pointerEvents = '';
                document.getElementById('newBtn').disabled = false;
                document.getElementById('input').focus();
            }
        }
        
        function loadOne(d, retry) {
            let done = false;
            
            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    if (retry > 0) {
                        loadOne(d, retry - 1);
                    } else {
                        finishIfDone();
                    }
                }
            }, 1000);
            
            ds.search(d.adcode, (s2, r2) => {
                if (done) return;
                done = true;
                clearTimeout(timeout);
                
                if (s2 === 'complete' && r2.districtList.length > 0) {
                    const nd = r2.districtList.find(x => x.level === 'district') || r2.districtList[0];
                    
                    if (nd && nd.boundaries && nd.boundaries.length > 0) {
                        neighborData.push(nd);
                        mobileNeighborData = neighborData;
                        drawDistrictAndNeighbors(targetDistrict, neighborData);
                    }
                }
                
                finishIfDone();
            });
        }
        
        districts.forEach(d => {
            loadOne(d, 5);
        });
    });
}

// 手机端：加载邻居并用 Canvas 绘制
function loadNeighborsForMobile(targetAdcode) {
    const cityCode4 = targetAdcode.substring(0, 4);
    
    document.getElementById('input').disabled = true;
    document.getElementById('submitBtn').disabled = true;

    dsCity.search(cityCode4 + '00', (status, result) => {
        if (status !== 'complete' || result.districtList.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            return;
        }

        const cityData = result.districtList[0];
        let districts = [];

        if (cityData.districtList) {
            districts = cityData.districtList.filter(d => d.level === 'district' && d.adcode !== targetAdcode);
        }

        if (districts.length === 0) {
            document.getElementById('input').disabled = false;
            document.getElementById('submitBtn').disabled = false;
            return;
        }

        const neighborData = [];
        let finished = 0;
        const total = districts.length;

        function allDone() {
            finished++;
            if (finished >= total) {
                document.getElementById('input').disabled = false;
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('hint').style.pointerEvents = '';
                document.getElementById('newBtn').disabled = false;
                
                // 画出目标+邻居
                if (targetDistrict) {
                    drawDistrictAndNeighbors(targetDistrict, neighborData);
                }
            }
        }

        districts.forEach(d => {
            let done = false;
            
            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    allDone();
                }
            }, 5000);
            
            ds.search(d.adcode, (s2, r2) => {
                if (done) return;
                done = true;
                clearTimeout(timeout);
                
                if (s2 === 'complete' && r2.districtList.length > 0) {
                    const nd = r2.districtList.find(x => x.level === 'district') || r2.districtList[0];
                    if (nd && nd.boundaries && nd.boundaries.length > 0) {
                        neighborData.push(nd);
                    }
                }
                allDone();
            });
        });
    });
}

function drawDistrictAndNeighbors(target, neighbors) {
    const canvas = document.getElementById('districtCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 根据提示级别决定视野范围
    let expandRatio = 0;
    if (gameMode === 'classic') {
        if (hintLevel === 1) {
            expandRatio = 0.1;   // 视野扩大60%，约等于缩小0.3级
        } else if (hintLevel === 2) {
            expandRatio = 0.2;   // 累计扩大160%，约等于再缩小0.3级
        } else if (hintLevel >= 3) {
            expandRatio = 0.4;   // 累计扩大250%，约等于再缩小0.5级
        }
    }
    
    // 只用目标区县的边界计算视野
    let allPoints = [];
    target.boundaries.forEach(b => allPoints.push(...b));
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
        const lng = p.lng !== undefined ? p.lng : p[0];
        const lat = p.lat !== undefined ? p.lat : p[1];
        minX = Math.min(minX, lng);
        maxX = Math.max(maxX, lng);
        minY = Math.min(minY, lat);
        maxY = Math.max(maxY, lat);
    });
    
    // 根据提示级别扩大视野
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    minX -= rangeX * expandRatio;
    maxX += rangeX * expandRatio;
    minY -= rangeY * expandRatio;
    maxY += rangeY * expandRatio;
    
    const pad = 30;
    const sx = (canvas.width - pad * 2) / (maxX - minX);
    const sy = (canvas.height - pad * 2) / (maxY - minY);
    const scale = Math.min(sx, sy);
    const ox = (canvas.width - (maxX - minX) * scale) / 2;
    const oy = (canvas.height - (maxY - minY) * scale) / 2;
    
    function toXY(lng, lat) {
        return [ox + (lng - minX) * scale, canvas.height - oy - (lat - minY) * scale];
    }
    
    function drawPolygon(boundaries, stroke, fill, width) {
        boundaries.forEach(b => {
            ctx.beginPath();
            b.forEach((p, i) => {
                const lng = p.lng !== undefined ? p.lng : p[0];
                const lat = p.lat !== undefined ? p.lat : p[1];
                const [x, y] = toXY(lng, lat);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.stroke();
        });
    }
    
    // 清空
    ctx.fillStyle = '#dfe9f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 画邻居
    neighbors.forEach(nd => {
        drawPolygon(nd.boundaries, '#4488FF', 'rgba(68,136,255,0.15)', 2);
    });
    
    // 画目标
    drawPolygon(target.boundaries, '#FF0000', 'rgba(255,0,0,0.25)', 3);
}

function drawNeighborsOnCanvas() {
    const canvas = document.getElementById('districtCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    classicNeighborPolygons.forEach(polygon => {
        // 高德 Polygon 对象获取路径
        const path = polygon.getPath();
        if (!path || path.length === 0) return;
        
        ctx.beginPath();
        path.forEach((point, index) => {
            const [x, y] = toCanvasCoords(point.lng, point.lat);
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.strokeStyle = '#4488FF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(68,136,255,0.1)';
        ctx.fill();
    });
}

function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;

        function tone(freq, start, duration, wave, volume) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = wave;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, now + start);
            gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration + 0.05);
        }

        if (type === 'correct') {
            tone(660, 0, 0.15, 'sine', 0.2);
            tone(880, 0.08, 0.2, 'sine', 0.18);
        } else if (type === 'wrong') {
            tone(200, 0, 0.3, 'triangle', 3.5);
        } else if (type === 'complete') {
            tone(523, 0, 0.15, 'sine', 0.18);
            tone(659, 0.12, 0.15, 'sine', 0.18);
            tone(784, 0.24, 0.25, 'sine', 0.18);
        } else if (type === 'click') {
            tone(500, 0, 0.06, 'sine', 0.18);
        } else if (type === 'hint') {
            tone(900, 0, 0.08, 'sine', 0.25);
        } else if (type === 'timeup') {
            tone(400, 0, 0.2, 'square', 0.25);
            tone(300, 0.2, 0.3, 'square', 0.25);
        } else if (type === 'share') {
            tone(700, 0, 0.1, 'sine', 0.15);
            tone(1000, 0.1, 0.15, 'sine', 0.15);
        }
    } catch (e) {
        // 忽略音频错误
    }
}