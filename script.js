// 数据存储
const DATA_VERSION = 3;
let progressData = {};
let currentMonth = new Date();
let progressChart = null;
window.progressChart = null;
let currentRangeDays = 7;

const TASKS = [
    { key: 'morning', label: '早晨重排', minutes: 20 },
    { key: 'noon', label: '中午校正', minutes: 8 },
    { key: 'evening', label: '晚间重排', minutes: 15 },
    { key: 'bedtime', label: '睡前记录', minutes: 2 }
];

const SCORE_WEIGHTS = [0.3, 0.3, 0.3, 0.3, 4.0, 4.0, 4.0, 4.0, 0.3, 0.3];
const SCORE_BREAKS = buildScoreBreaks();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    bindRangeTabs();
    renderTodayTasks();
    renderChart(currentRangeDays);
    updateCurrentDate();
});

function buildScoreBreaks() {
    const total = SCORE_WEIGHTS.reduce((sum, v) => sum + v, 0);
    const breaks = [0];
    let acc = 0;
    for (const weight of SCORE_WEIGHTS) {
        acc += weight;
        breaks.push(acc / total);
    }
    return breaks;
}

function bindRangeTabs() {
    const tabs = document.querySelectorAll('.range-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(btn => btn.classList.remove('active'));
            tab.classList.add('active');
            currentRangeDays = Number(tab.dataset.range || '7');
            localStorage.setItem('healthUiRangeDays', String(currentRangeDays));
            renderChart(currentRangeDays);
        });
    });

    const savedRange = Number(localStorage.getItem('healthUiRangeDays') || '7');
    if ([7, 30, 90].includes(savedRange)) {
        currentRangeDays = savedRange;
        tabs.forEach(btn => btn.classList.toggle('active', Number(btn.dataset.range) === savedRange));
    }
}

function loadData() {
    const defaultData = {
        '2026-04-04': {
            completed: ['morning', 'noon', 'evening', 'bedtime'],
            skipped: [],
            metrics: {
                body_feel: 4.3,
                completion: 8,
                habit_guard: 6
            },
            notes: '第一天执行较完整，身体有改善，但成果还谈不上稳稳守住。',
            title: '',
            observation: ''
        },
        '2026-04-05': {
            completed: ['morning', 'noon', 'evening', 'bedtime'],
            skipped: [],
            metrics: {
                body_feel: 4.05,
                completion: 7,
                habit_guard: 5.5
            },
            notes: '整体体感和前一天接近，完成度略低，脚受力问题开始更清楚，但白天习惯控制还不强。',
            title: '',
            observation: ''
        },
        '2026-04-06': {
            completed: ['bedtime'],
            skipped: ['morning', 'noon', 'evening'],
            metrics: {
                body_feel: 5.05,
                completion: 5,
                habit_guard: 4.5
            },
            notes: '旧崴脚、前脚掌偏载、抬脚困难的代偿链更明确，虽然体感略好，但成果很容易在白天流失。',
            title: '',
            observation: ''
        },
        '2026-04-07': {
            completed: ['bedtime'],
            skipped: ['morning', 'noon', 'evening'],
            metrics: {
                body_feel: 5.55,
                completion: 8,
                habit_guard: 5.5
            },
            notes: '完成度不错，整体体感继续抬高，但右脚后跟/前脚掌和小腿代偿仍说明成果守住得一般。',
            title: '',
            observation: ''
        },
        '2026-04-08': {
            metrics: {
                body_feel: 5.7,
                completion: 7.5,
                habit_guard: 5.75
            },
            notes: '趋势补录：介于 04-07 与 04-09 之间，体感继续小幅上行，完成度维持较高，成果守住度略有改善。',
            title: '',
            observation: ''
        },
        '2026-04-09': {
            completed: ['bedtime'],
            skipped: ['morning', 'noon', 'evening'],
            metrics: {
                body_feel: 5.9,
                completion: 7,
                habit_guard: 6
            },
            notes: '整体体感已到 6 分以上，但当天主要是睡前评分，不算完整训练日，成果守住度给中上。',
            title: '',
            observation: ''
        },
        '2026-04-10': {
            metrics: {
                body_feel: 5.8,
                completion: 7,
                habit_guard: 6.5
            },
            notes: '无',
            title: '',
            observation: ''
        },
        '2026-04-11': {
            metrics: {
                body_feel: 5.8,
                completion: 7,
                habit_guard: 6
            },
            notes: '今天走路时间有点长，的时候给越走越回去，发力又不对了，全身也紧张，这感觉很不好',
            title: '',
            observation: ''
        },
        '2026-04-12': {
            metrics: {
                body_feel: 4.8,
                completion: 7,
                habit_guard: 5.5
            },
            notes: '无',
            title: '',
            observation: ''
        },
        '2026-04-13': {
            metrics: {
                body_feel: 6.3,
                completion: 8,
                habit_guard: 7
            },
            notes: '整体体感 6.5，完成度给自己八分，成果守住都可以给气氛。',
            title: '',
            observation: ''
        },
        '2026-04-14': {
            metrics: {
                body_feel: 5.8,
                completion: 7.5,
                habit_guard: 6.6
            },
            notes: '似乎我这两天的颈椎疼痛来自于脖子的位置歪了，回正之后，肩膀会放松下来。可能在跟熊旺子出门的那天有些身体姿势不正导致了这些后果。日后要特别注意。可能那天穿鞋穿的也不好，改变了脚步的感觉。',
            title: '',
            observation: ''
        },
        '2026-04-15': {
            metrics: {
                body_feel: 6.3,
                completion: 6.5,
                habit_guard: 7
            },
            notes: '今天更多的是进行放松，少工作，少坐着，保持心情愉快，同时尽量在生活中找到一些能够对自己颈椎发力有帮助的场景。',
            title: '',
            observation: 'AI治颈椎Day12｜放松也是一种努力'
        },
        '2026-04-16': {
            metrics: {
                body_feel: 6.1,
                completion: 6.5,
                habit_guard: 6.3
            },
            notes: '昨天回到家发现膝盖有点痛，可能跟最近调整走路姿势有关系。可能过于急于求成，和过于自信动作的正确性。',
            title: '从刚到柔',
            observation: 'AI治颈椎Day13｜从刚到柔'
        },
        '2026-04-17': {
            metrics: {
                body_feel: 5.8,
                completion: 6,
                habit_guard: 6.5
            },
            notes: '不舒服的一天，睡觉很难受。',
            title: '慢就是快',
            observation: 'AI治颈椎Day14｜慢就是快'
        },
        '2026-04-18': {
            metrics: {
                body_feel: 5.8,
                completion: 6.8,
                habit_guard: 6.5
            },
            notes: '适当的变化是生活的节奏，能够让身体的肌肉和运作产生意想不到的效果，当然这个效果持续性如何，还得继续验证',
            title: '变换节奏',
            observation: 'AI治颈椎Day15｜变换节奏'
        },
        '2026-04-19': {
            metrics: {
                body_feel: 6.8,
                completion: 6,
                habit_guard: 6.6
            },
            notes: '今天尝试了几个修正骨盆的动作，感觉有点变化。目前正在尝试更多动作的时期，让身体接受更多的刺激。',
            title: '研究下骨盆',
            observation: 'AI治颈椎Day16｜研究下骨盆'
        },
        '2026-04-20': {
            metrics: {
                body_feel: 6.8,
                completion: 6.5,
                habit_guard: 7
            },
            notes: '今天尝试了几个新的锻炼，比如拉单杠，打坐拉跨和蹬自行车。',
            title: '新的锻炼',
            observation: 'AI治颈椎Day17｜新的锻炼'
        },
        '2026-04-21': {
            metrics: {
                body_feel: 6.4,
                completion: 6,
                habit_guard: 6
            },
            notes: '今天因为要去线下办公，整体稍微会懈怠一些，但是可能因为各种原因吧，体感跟昨天差的不大，希望是锻炼起到了效果',
            title: '继续打坐',
            observation: 'AI治颈椎Day18｜继续打坐'
        },
        '2026-04-22': {
            metrics: {
                body_feel: 6.8,
                completion: 6.5,
                habit_guard: 6.5
            },
            notes: '做点日常的动作，拉单杠、抬头走路，看看能否大道至简',
            title: '大道至简',
            observation: 'AI治颈椎Day19｜大道至简'
        },
        '2026-04-24': {
            metrics: {
                body_feel: 6.5,
                completion: 6,
                habit_guard: 6
            },
            notes: '昨天忘记更新了，有点小懈怠。前天拉单杠之后的手臂和背部还在酸痛',
            title: '肌肉酸痛',
            observation: 'AI治疗颈椎20&21｜肌肉酸痛'
        },
        '2026-04-26': {
            metrics: {
                body_feel: 6.5,
                completion: 7,
                habit_guard: 6
            },
            notes: '这两天走路膝盖和脚踝总是有点痛，不知道跟我的姿势改变又没关系，继续观察，优先进行安全训练，拉单杠。',
            title: '膝踝疼痛观察期',
            observation: 'AI治颈椎Day22｜膝踝疼痛观察期'
        },
        '2026-04-27': {
            metrics: {
                body_feel: 6.8,
                completion: 7,
                habit_guard: 7
            },
            notes: '单杠+慢跑抬头+压腿看电视继续进行中，看能否大道至简。',
            title: '大道至简实验',
            observation: 'AI治颈椎Day23｜大道至简实验'
        },
        '2026-04-28': {
            metrics: {
                body_feel: 6.8,
                completion: 7,
                habit_guard: 7
            },
            notes: '练单杠手已经出了茧。单杠感觉还真不错，每次做的时候，做完是舒服的。慢跑抬头的体感也轻微变差，压腿也是，看来又得换新运动了，不能让它适应。\\nAI建议：\\n单杠继续保留（有效且体感好）。慢跑抬头和压腿需要换新刺激：\\n1. 替换慢跑抬头 → 后退走（倒着走，强迫重心后移+抬头）\\n2. 替换压腿 → 弓步拉伸+髋外旋（动态拉伸，避免静态适应）',
            title: '适应性突破',
            observation: 'AI治颈椎Day24｜适应性突破'
        },
        '2026-04-29': {
            metrics: {
                body_feel: 6.8,
                completion: 7,
                habit_guard: 6
            },
            notes: '继续维持之前的运动量，之所以给自己六分是因为经常低头玩手机，以及一些习惯还是不好\\nAI建议：\\n低头玩手机是成果流失的主要原因。建议：\\n1. 手机支架/抬高手机到视线水平（物理阻断低头）\\n2. 每30分钟做一次\"后退走10步+抬头看天\"（打断低头惯性）\\n3. 睡前最后一次单杠改到玩手机之后（抵消当天累积的低头伤害）',
            title: '习惯管理',
            observation: 'AI治颈椎Day25｜习惯管理'
        },
        '2026-04-30': {
            metrics: {
                body_feel: 6.7,
                completion: 6.5,
                habit_guard: 6
            },
            notes: '今天去办公室，穿的鞋子不舒服，坐着的时间比在家长。感觉得了足底筋膜炎，这肯定跟擅自更改走路姿势有关，需要特别注意。因为去单位的原因，昨天没有做引体的力量训练，只是吊了单杠。\\nAI建议：\\n1. 鞋子问题：办公室备一双舒适的鞋，避免不合脚的鞋加重足底负担\\n2. 足底筋膜炎警告：立即停止擅自改走路姿势的实验，回到之前验证过的安全模式（右脚后跟承重 + 避免前脚掌偷偷抢支撑）\\n3. 久坐对策：办公室每小时起身做 2 分钟站立修复动作，避免坐姿把训练成果消耗回去\\n4. 引体训练：吊单杠是好的，但如果条件允许，尽量补上引体向上的力量部分，保持肩颈稳定性',
            title: '足底警告',
            observation: 'AI治颈椎Day26｜足底警告'
        },
        '2026-05-01': {
            metrics: {
                body_feel: 6.7,
                completion: 6.5,
                habit_guard: 6
            },
            notes: '今天去到办公室，穿的鞋子不舒服，另外，坐着的时间会比在家长。同时我感觉我得了足底筋膜炎，这肯定是跟我擅自更改走路姿势有关，需要特别注意。因为去单位的原因，所以昨天没有做引体的力量训练，只是吊了单杠，所以给了这个分数\\nAI建议：\\n1. 立即停止自行调整步态，回归自然走路模式\\n2. 办公室环境对策：备一双舒适的鞋 + 每小时起身活动3-5分钟\\n3. 足底筋膜炎早期处理：睡前用网球滚足底，拉伸小腿\\n4. 力量训练补回来：吊单杠是好的，但尽量补上引体向上部分',
            title: '足底警告',
            observation: 'AI治颈椎Day27｜足底警告'
        },
        '2026-05-02': {
            metrics: {
                body_feel: 6.8,
                completion: 7.5,
                habit_guard: 6
            },
            notes: '今天给自己的完成度多打了一点分主要是拉伸这块做得还可以，并且能看到一点效果。昨天走路姿势主打恢复自然状态，可能对足底筋膜炎有一定的帮助。\\nAI建议：\\n1. 拉伸有效：继续保持当前拉伸强度和频率，既然能看到效果就说明方向对了\\n2. 走路姿势恢复自然：这是正确的策略，足底筋膜炎通常是过度干预导致的，自然状态反而是最安全的\\n3. 足底恢复观察：接下来几天重点观察足底疼痛是否减轻，如果持续改善就说明"恢复自然"是对的路径\\n4. 成果守住度6分：说明白天还是有消耗，继续注意办公室久坐和鞋子问题',
            title: '拉伸见效',
            observation: 'AI治颈椎Day28｜拉伸见效'
        },
        '2026-05-03': {
            metrics: {
                body_feel: 6.9,
                completion: 6.8,
                habit_guard: 6.7
            },
            notes: '足底筋膜炎的症状有所缓解，感觉自己还是不够努力和注意，每天在自我救赎和自我毁灭中徘徊。\\nAI建议：\\n1. 足底缓解是好信号：说明"恢复自然走路"的策略有效，继续保持\\n2. 把"够努力"具体化：明天开始记录一个最小康复动作（比如：起床后拉伸5分钟），完成就算达标，避免模糊的自我否定\\n3. 识别"自我毁灭"时刻：今晚或明天，记录一次具体的破坏性行为（什么时候、做了什么让成果消耗），才能针对性调整',
            title: '在缓解与徘徊之间',
            observation: 'AI治颈椎Day29｜在缓解与徘徊之间'
        },
        '2026-05-04': {
            metrics: {
                body_feel: 6.2,
                completion: 6.5,
                habit_guard: 6.2
            },
            notes: '昨天睡觉脖子很痛，已经有段时间没出现这个症状了。跟昨天只做了一次引体向上以及睡前没放松有关系，看来这些东西真的要坚持。\\nAI建议：\\n1. 引体向上频次不够 - 单次训练无法维持肌肉激活，建议恢复到每天至少2-3组的频率\\n2. 睡前放松是刚需 - 颈部肌肉紧张累积一天，睡前不放松直接导致夜间疼痛，这个环节不能省\\n3. 症状反弹是警告信号 - 说明当前康复状态还不稳定，一旦松懈就会回到原点，需要把这些动作变成日常习惯而不是任务',
            title: '松懈的代价',
            observation: 'AI治颈椎Day30｜松懈的代价'
        },
        '2026-05-05': {
            metrics: {
                body_feel: 6.5,
                completion: 6.5,
                habit_guard: 6.5
            },
            notes: '今天虽然还是进行了一些损伤身体的操作，但至少保证了拉了一次引体向上以及睡前进行了拉伸，效果立竿见影。\\nAI建议：\\n1. 损伤行为需要具体识别 - "损伤身体的操作"比较模糊，建议记录具体是什么动作或姿势，这样才能针对性改进\\n2. 引体向上+拉伸组合有效 - 既然体感立竿见影，说明这个组合抓住了关键，建议固化为每日必做项\\n3. 分数持平但体感好转 - 6.5分虽然不高，但"立竿见影"说明方向对了，继续保持这个节奏，分数会跟上来',
            title: '引体+拉伸见效',
            observation: 'AI治颈椎Day31｜引体+拉伸见效'
        },
        '2026-05-06': {
            metrics: {
                body_feel: 6.4,
                completion: 6.5,
                habit_guard: 6.4
            },
            notes: '昨天睡觉睡得很不好，不过早上强制让自己去身心放松休息，多睡了一会儿，我觉得感受会好一些，在恢复身体的时候，我觉得精神也要适量去放松这样的话身体的肌肉啊，然后各种关节可能才能真正意义上的放松下来。\\nAI建议：\\n1. 睡眠质量差时的补偿策略有效 - 早上多睡、强制放松是正确的应对，避免了硬推康复导致更大反弹\\n2. 精神放松是身体放松的前提 - 这是一个重要发现，肌肉和关节的真正放松需要精神层面配合，今后可以在康复前加入5分钟深呼吸或冥想\\n3. 今日建议降低强度 - 睡眠不足时，重点放在拉伸和放松类动作，避免高强度训练让身体更紧张',
            title: '精神放松带动身体恢复',
            observation: 'AI治颈椎Day32｜精神放松带动身体恢复'
        },
        '2026-05-07': {
            metrics: {
                body_feel: 6.3,
                completion: 6.9,
                habit_guard: 6.6
            },
            notes: '昨天又出现了这种早上脖子不舒服到睡不着觉的感觉真的有点难受，治疗颈椎真的有点进3退2的感觉。继续加油\\nAI建议：\\n1. 早醒疼痛需要排查睡眠环境 - 枕头高度、床垫软硬、睡姿习惯，这几次早上不舒服可能有共同触发因素\\n2. 进3退2是康复常态 - 不是线性进步，而是螺旋上升，关键是找到\"退2\"的规律，避免重复触发\\n3. 完成度6.9是近期高点 - 说明执行力在提升，体感波动不代表努力白费，坚持下去身体会跟上节奏',
            title: '进3退2的螺旋',
            observation: 'AI治颈椎Day33｜进3退2的螺旋'
        },
        '2026-05-08': {
            metrics: {
                body_feel: 6.6,
                completion: 6.8,
                habit_guard: 6.8
            },
            notes: '今天给我的整体打分高了一点，主要是我在去单位的时候利用中午的间隙去拉伸了一下，我觉得还是有点效果，同时我在睡前一直在进行拉伸，虽然目前我的脖子感觉出现了那种颈椎病的症状，这种症状是不时会出现的，出现的时候就会怎么弄都不舒服，但是呢，我通过坐在地上进行头部放松，以及就是侧着头歪着头看电视，让我的颈椎在睡前达到了放松的一个状态，然后还发现了一个很搞笑的事情，就是每一次颈椎出现问题，我都能发现一些新的有效的缓解的方法，每次还都不一样，感觉这个颈椎真的是太多变了，你需要在每次出现问题的时候，不能用同一种方法\\nAI建议：\\n1. 中午间隙拉伸有效 - 办公室环境下利用碎片时间做拉伸是可持续的策略，建议固化为每天中午必做项\\n2. 多姿势组合放松 - 坐地头部放松+侧头看电视的组合说明颈椎需要多角度刺激才能真正放松，单一姿势容易适应失效\\n3. "每次都有新方法"是重要发现 - 颈椎问题的多变性要求你保持灵活应对而非固守单一方案，建议记录每次有效的新方法形成"工具箱"\\n4. 症状出现时的应对策略 - 当不适出现时，优先尝试最近验证有效的2-3种方法，而不是重复用过去失效的老方法',
            title: '每次都有新方法',
            observation: 'AI治颈椎Day34｜每次都有新方法'
        },
        '2026-05-09': {
            metrics: {
                body_feel: 6,
                completion: 7,
                habit_guard: 6.5
            },
            notes: '昨天又是睡觉没睡好的一天，我有一个怀疑就是说我可能有时候把这个颈椎过度了，然后呢，比如睡觉啊，或者说看电视看电脑的时候不良的姿势再回去，那这个过程中可能会产生摩擦，然后会导致局部发炎，那样的话可能会导致就是会更不好，就是我的一个理论，所以就是可能也要注意不要过度地去恢复这个生理曲度吧，毕竟这个东西不是一天两天能恢复的，还是应该有一些耐心，除非就是能够尽量长时间地去保持一个位置那样，我觉得是好的，我就在考虑怎么样去长时间地保持生理曲度恢复正常，而不是一不注意就缩回去，导致磨损更严重，同时之后我的打分逻辑也会发生些变化，我会尽量打一些整数的分，如果没有整数的分呢，我就打6.5 7.5这样，这样可以把我的数据变化显示得更明确一点\\nAI建议：\\n1. 过度康复+姿势回弹=反复摩擦发炎 - 这是关键发现，短时间强制矫正后肌肉疲劳，放松时姿势崩塌更严重\\n2. 降低单次强度，提高频率 - 不要一次性\"掰正\"颈椎，改成每小时轻微调整，让肌肉记住正确位置\\n3. 睡眠姿势固定 - 枕头高度必须精确（颈椎自然曲度），考虑颈托或定型枕，侧睡时肩膀和头部对齐\\n4. 肌肉耐力训练优先于矫正 - 颈部深层肌肉需要主动训练才能\"记住\"正确姿势，单纯被动矫正会反弹',
            title: '避免过度康复与姿势保持',
            observation: 'AI治颈椎Day35｜避免过度康复与姿势保持'
        },
        '2026-05-10': {
            metrics: {
                body_feel: 6.5,
                completion: 6.5,
                habit_guard: 7
            },
            notes: '昨天我的病稍微有一点好转，去了一个教堂活动里面的人帮我祈祷了一下，虽然我目前还不是说特别相信这个的功效，但是呢，事实上是好了一点，但我把这个原因归结为他，其实很多程度上也是也该好了，不过这里头有一个点，我想说就是信念的力量，很多人在做康复的时候，因为病情比较重，所以可能已经放弃了，或者觉得只能少数了，但是我想说如果我们相信他能好坚持下去，我觉得大概率还是有很多康复的可能性的，所以一起加油吧\\nAI建议：\\n1. 信念本身就是治疗的一部分 - 神经可塑性和自主神经调节需要\"相信会好转\"作为基础，这不是玄学而是生理机制\\n2. 保持理性归因+积极信念的平衡 - 你现在的状态很健康：既不盲信也不否定，这种心态最利于康复\\n3. 避免因短期波动动摇 - 康复不是线性的，一两天的起伏不代表方向错误，坚持当前节奏\\n4. 信念需要行动支撑 - 单纯相信不够，持续执行训练+观察反馈才能把信念转化为真实改善',
            title: '信念的力量',
            observation: 'AI治颈椎Day36｜信念的力量'
        },
        '2026-05-11': {
            metrics: {
                body_feel: 6.5,
                completion: 7,
                habit_guard: 6
            },
            notes: '继续坚定信念，我一定能治好我的颈椎。但现在遇到的问题是全天恢复的时间远远小于消耗的时间。我目前的思路是在睡觉的时候在腰部或后背下面垫一个枕头，头不枕枕头，这样让睡觉的大部分时间对颈椎不要有太多压力。另外，除了刚性的拉伸和引体向上，应该加一些比较随意的举动，不要让它太有规律，在动态之中去治疗可能效果会更好。我认为很多问题都来自于每次总是做相同的动作，比如拿手机、看电脑、看电视。核心还是让颈椎不要长时间维持在一个动作下，这样对恢复更有利。\\nAI建议：\\n1. 睡眠姿势实验值得试，但要观察是否影响睡眠质量本身（睡不好反而影响恢复）\\n2. 动态随机化思路对，核心是打破重复性损伤模式 — 但要确保\\"随意动作\\"不是乱动，而是有意识的多角度活动\\n3. 你说的\\"恢复时间 < 消耗时间\\"是关键瓶颈，需要从两端同时推进：减少消耗（工作/娱乐时的姿势管理）+ 增加恢复（睡眠、拉伸、动态活动）\\n4. 建议白天工作时设置提醒（每30分钟），做10秒随机颈部/肩部活动（不是固定动作，而是随意转动、耸肩、后仰等）',
            title: '动态对抗静态损伤',
            observation: 'AI治颈椎Day37｜动态对抗静态损伤'
        },
        '2026-05-12': {
            metrics: {
                body_feel: 7.5,
                completion: 7,
                habit_guard: 7
            },
            notes: '我一定可以治好我的颈椎，强化信念。今天给自己得分比较高的原因是昨天确实感受还不错，因为我发现脊椎中间的这个位置，如果挺出去的话，会让整个身体的力线保持垂直，这是我昨天意外的一个发现。我联想到晚上睡觉的时候如果在那个位置垫上一个枕头，身体也会舒服一点，所以我认为我的脖子的这个原因可能不仅仅是局限于脖子，而是因为脊椎弯了，脖子再怎么整它都会往前去，包括膝盖会受更多的力，这都是一体一脉的。所以说我下一步就是去观察一下是不是这个原因，然后把腰椎或者说腰椎和胸椎中间连接的这个部分去训练一下，或者说去注意一下，昨天确实感觉整体来说是舒服了一些。\\nAI建议：\\n1. 胸腰段挺出让力线垂直的发现非常关键 — 这验证了颈椎问题是代偿结果而非根源\\n2. 建议验证方法：站立时主动挺出胸腰交界（肋骨下缘），观察颈椎是否自然回收\\n3. 针对性训练三个方向：胸椎伸展（猫牛式、泡沫轴滚动）、腰椎稳定（死虫、鸟狗）、核心抗伸展（平板支撑变式）\\n4. 日常监控：坐姿/站姿时用手摸胸腰交界，确认是否保持挺出状态',
            title: '力线重建：胸腰段是关键',
            observation: 'AI治颈椎Day38｜力线重建：胸腰段是关键'
        },
        '2026-05-13': {
            metrics: {
                body_feel: 6.5,
                completion: 6,
                habit_guard: 6.5
            },
            notes: '首先还是坚定信念，我一定可以治好颈椎，其次，昨天关于胸椎和腰椎中间的这个位置的感觉好像又找不到了，然后晚上睡觉之前感觉颈椎又开始不舒服，所以可能还是没有抓到这个东西的，关键我的体会是它没有一个固定的姿势，你做了就好了，可能是一系列东西的叠加，这个只能慢慢自己去体悟了，所以说今天的打分比昨天要低了\\nAI建议：\\n1. 昨天的胸腰段挺出感觉消失说明这个姿态还没有形成稳定的神经-肌肉记忆\\n2. \"没有固定姿势\"的体会很准确 — 康复不是找到一个静态姿势，而是建立动态平衡能力\\n3. 建议增加本体感觉训练：闭眼单腿站立、慢速深蹲，强化身体对正确力线的感知\\n4. 睡前颈椎不适可能是白天代偿累积，建议睡前增加胸椎松解（泡沫轴或网球滚动3-5分钟）',
            title: '体悟叠加效应',
            observation: 'AI治颈椎Day39｜体悟叠加效应'
        },
        '2026-05-14': {
            metrics: {
                body_feel: 7,
                completion: 6,
                habit_guard: 6.5
            },
            notes: '我一定可以成功治好颈椎病，坚定信念！\\n\\n今天是去单位上班的一天，英国一天能从下雨到晴天3、4次，出去锻炼得抓空。另外我最近在找这个平衡，不要过度锻炼，注意不要损耗，晚上垫一块毛巾在自己的痛点附近，目前感觉尚可，这个度很难把握，但是又很必须。另外呢，引体向上动作有变化，从固定拉为主，到各种姿势都覆盖为主，一定不能让身体适应一种模式，得让它处于无规则状态，这样能够避免身体自动化紧张。\\nAI建议：\\n1. 引体向上多姿势覆盖是正确策略 — 打破固定模式避免适应性紧张，这与Day37的动态对抗思路一致\\n2. "不要过度锻炼"的平衡感很关键 — 过度会导致炎症和反弹（Day35的教训），适度刺激+充分恢复才是可持续路径\\n3. 痛点垫毛巾的睡眠调整值得继续观察 — 记录接下来3天的晨起体感，验证这个方法是否稳定有效\\n4. 办公室环境应对：英国天气多变时，室内可做颈部无规则小动作（每小时2-3分钟），不依赖户外条件',
            title: '平衡与变化',
            observation: 'AI治颈椎Day40｜平衡与变化'
        },
        '2026-05-15': {
            metrics: {
                body_feel: 7,
                completion: 6.5,
                habit_guard: 6.5
            },
            notes: '昨晚睡眠一般。脖子附近垫了东西后，这三天体验下来整体更舒服一点。今天运动时更侧重全方位肢体舒展，而非局部肩部力量训练，整体体感舒服。同时感谢一些朋友的联系，有的问我用什么软件，有的给出专业建议，都很有意思。\\\\nAI建议：\\\\n1. 从力量训练转向全方位舒展是正确调整 — 局部强化容易加剧代偿，全身协调性训练更符合Day38-39的\"动态平衡\"思路\\\\n2. 脖子附近垫物三天有效验证了Day40的睡眠调整方向 — 建议继续观察并记录具体垫的位置和高度，找到最优参数\\\\n3. 外部反馈（朋友询问软件、给建议）是正向信号 — 说明你的康复进展已经可视化，这种社会支持本身也是康复动力\\\\n4. 睡眠质量\"一般\"需要关注 — 如果垫物影响了深度睡眠，可能得不偿失，建议对比有无垫物时的晨起精神状态',
            title: '全方位舒展见效',
            observation: 'AI治颈椎Day41｜全方位舒展见效'
        },
        '2026-05-16': {
            metrics: {
                body_feel: 8,
                completion: 7,
                habit_guard: 6
            },
            notes: '为了让日后的数据对比更加明显，以后只用整数打分，取消小数点。昨天休息感觉比较一般，整体来说可能还是有一些精神上的过度焦虑，这会影响到恢复状态以及做运动时的专注度，都会影响到实际效果。包括心态浮躁，本身就会让肉体紧张，尤其是已经紧张的部位。在具体动作层面，我觉得目前会偏向于全方位的运动，再加上把胸腔和腹腔的夹角打开，让身体挺直，因为在长期坐姿的前提下养成了很不好的弓背习惯，这对我的整体体态，尤其是颈椎伤害非常大。\\\\nAI建议：\\\\n1. 精神焦虑→肉体紧张的观察很准确 — 建议在运动前加入3-5分钟呼吸调节或冥想，降低交感神经兴奋度\\\\n2. 胸腔腹腔夹角打开+挺直身体是关键突破 — 这直接改善了颈椎的力线，建议每小时设置提醒检查坐姿\\\\n3. 弓背习惯的自我觉察是进步 — 可以在工作区放镜子或用手机定时拍照，建立视觉反馈机制\\\\n4. 整数打分决策合理 — 更清晰的数据对比有助于识别真实趋势，避免小数点造成的过度敏感',
            title: '心态与体态的双重调整',
            observation: 'AI治颈椎Day42｜焦虑影响恢复+纠正弓背'
        },
        '2026-05-17': {
            metrics: {
                body_feel: 6,
                completion: 5,
                habit_guard: 5
            },
            notes: '昨天出去了一天在路上，没有很好地保持体态，但我有在尽力。这是我最近的一个发现：因为平时工作时间比较长，而且椅子不是专用办公椅，导致我会有弯腰的动作。如果长期弯腰，腹部和胸部之间的腹肌就会处于没有拉伸、比较紧张的状态。腰背弯曲，脖子一定会受到连带影响。\n\n发现这个点之后，我就会在日常走路、行动中特别注意恢复腰背的生理曲线。这事儿听起来简单，但如果不特别注意，很容易变成耸肩抬胸的代偿动作，而不是真正把腰椎胸椎摆正。我采取的方法是通过引体向上、吊单杠找到拉伸的感觉，然后在日常生活里尽量复刻这个感觉。\n\nAI建议：\n1. 久坐弓背→腹肌短缩→腰背弯曲→颈椎代偿，这条因果链抓得很准，是典型的上交叉综合征前兆\n2. 单杠找感觉是对的，但关键是肩胛下沉（想象把肩膀\"塞进后裤袋\"），这个感觉才是日常要复刻的，不是抬胸\n3. 坐姿干预优先级最高：换椅子/加腰靠，比事后拉伸效率高10倍\n4. 建议每小时站起来做一次\"墙面天使\"（背贴墙，手臂上下滑动），3次呼吸就够，强化胸椎伸展模式',
            title: '久坐弓背→颈椎连锁',
            observation: 'AI治颈椎Day43｜久坐弓背→颈椎连锁，单杠校准+坐姿干预'
        },
        '2026-05-18': {
            metrics: {
                body_feel: 6,
                completion: 6,
                habit_guard: 5
            },
            notes: '这几天开始工作上或者说生活上的事情会占用更多的精力，再加上其实已经锻炼了很久了，在这方面难免会有懈怠，所以来说整体感觉并没有特别的恢复得特别好，然后英国昨天又下雨，导致单杠抓不住，所以继续加油吧，不过好消息是感觉足底筋膜炎的症状又有所缓解\n\nAI建议：\n1. 工作生活占用精力+训练疲劳期是正常的，关键是保持最小有效剂量（每天5分钟核心动作）而不是完全停\n2. 雨天单杠不可用时，室内替代方案：靠墙肩胛下沉练习、doorway stretch开胸，效果不输单杠\n3. 足底筋膜炎缓解是好信号，说明整体力线在改善，足弓压力在减轻，继续保持当前节奏\n4. 懈怠感是身体在要求调整训练强度的信号，不是失败——适当降低频率但保持连续性，比硬撑后放弃更有效',
            title: '松懈期的最小维持',
            observation: 'AI治颈椎Day44｜工作占精力+雨天影响，足底筋膜炎好转'
        },
        '2026-05-19': {
            metrics: {
                body_feel: 7,
                completion: 7,
                habit_guard: 6
            },
            notes: '昨天或者说这几天状态比较好，我觉得主要归结于两个原因：一个是睡觉的时候会垫一块布在脖子附近，肌肉放松会有很大的帮助；还有一部分是因为没有那种之前比较暴力的锻炼肌肉，反而是专注于做出各种各样的动作，让它从各种角度去活动开，这也起到了一些帮助。\n\n不过值得注意的是，本质的问题我觉得还是没有特别极大的缓解，因为假设我把这个骨头位置掰正之后，它很快就会回去，这个就很奇怪，除非我一直仰着头，它才能不断地归正。我觉得这个的原因是因为我可能胸椎的位置还是弯的，或者说这种前十字韧带交叉的症状。所以我也在注意去抬头挺胸，同时呼吸层面也会不断地去关注我的右侧身体右侧后方的这个呼吸的感觉，因为这一块感觉弱一点，我觉得可能跟右肩膀不太容易打开很有关系。\n\nAI建议：\n1. 睡眠颈部支撑+温和多角度活动的组合很对，这是从"强制归位"转向"环境诱导"的正确方向\n2. 骨头掰正后快速回弹说明周围软组织（肌肉/筋膜/韧带）张力模式未改变，需要持续的姿态重塑而非单次矫正\n3. 右后侧呼吸弱+右肩打不开是典型的单侧胸廓活动受限，建议侧卧右侧在上做呼吸练习，强化右侧肋间肌激活\n4. 胸椎僵硬是颈椎代偿的根源，优先级：胸椎活动度>颈椎矫正，可以尝试泡沫轴胸椎段滚动（每天2-3分钟）',
            title: '温和活动+睡眠支撑见效',
            observation: 'AI治颈椎Day45｜睡眠支撑+多角度活动，但骨位易回弹'
        }
    };

    const storedVersion = Number(localStorage.getItem('healthDataVersion') || '0');
    const legacyData = localStorage.getItem('healthProgress');

    if (legacyData && storedVersion !== DATA_VERSION) {
        localStorage.removeItem('healthProgress');
        localStorage.setItem('healthDataVersion', String(DATA_VERSION));
    }

    progressData = defaultData;
}

function renderTodayTasks() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayData = progressData[dateStr];
    if (!dayData) return;
}

function getFilteredDates(rangeDays) {
    const allDates = Object.keys(progressData).sort();
    if (allDates.length === 0) return [];

    const latest = new Date(allDates[allDates.length - 1]);
    const start = new Date(latest);
    start.setDate(start.getDate() - (rangeDays - 1));

    return allDates.filter(date => new Date(date) >= start);
}

function mapScore(value) {
    if (value === null || value === undefined) return null;
    const clamped = Math.max(0, Math.min(10, value));
    const lower = Math.floor(clamped);
    if (lower >= 10) return 1;
    const fraction = clamped - lower;
    const start = SCORE_BREAKS[lower];
    const end = SCORE_BREAKS[lower + 1];
    return start + (end - start) * fraction;
}

function unmapScore(value) {
    const clamped = Math.max(0, Math.min(1, value));
    for (let i = 0; i < SCORE_BREAKS.length - 1; i++) {
        const start = SCORE_BREAKS[i];
        const end = SCORE_BREAKS[i + 1];
        if (clamped <= end || i === SCORE_BREAKS.length - 2) {
            const ratio = end === start ? 0 : (clamped - start) / (end - start);
            return i + ratio;
        }
    }
    return 10;
}

const nonlinearBackgroundPlugin = {
    id: 'nonlinearBackgroundPlugin',
    beforeDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales?.y) return;

        const yScale = scales.y;
        const score5Y = yScale.getPixelForValue(mapScore(5));

        ctx.save();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
        ctx.fillRect(chartArea.left, score5Y, chartArea.right - chartArea.left, chartArea.bottom - score5Y);

        ctx.strokeStyle = 'rgba(68, 83, 166, 0.16)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(chartArea.left, score5Y);
        ctx.lineTo(chartArea.right, score5Y);
        ctx.stroke();
        ctx.restore();
    }
};

function renderChart(rangeDays = 7) {
    const canvas = document.getElementById('progressChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dates = getFilteredDates(rangeDays);
    const labels = dates.map(d => d.substring(5));
    
    // Update daily title and observation
    updateDailyInfo(dates);

    const datasets = [
        {
            label: '整体体感',
            data: dates.map(d => mapScore(progressData[d]?.metrics?.body_feel ?? null)),
            rawData: dates.map(d => progressData[d]?.metrics?.body_feel ?? null),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            spanGaps: false,
            tension: 0.35,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 3.2,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#10b981',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
        },
        {
            label: '完成度',
            data: dates.map(d => mapScore(progressData[d]?.metrics?.completion ?? null)),
            rawData: dates.map(d => progressData[d]?.metrics?.completion ?? null),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            spanGaps: false,
            tension: 0.35,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 3.2,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#ef4444',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
        },
        {
            label: '日常注意度',
            data: dates.map(d => mapScore(progressData[d]?.metrics?.habit_guard ?? null)),
            rawData: dates.map(d => progressData[d]?.metrics?.habit_guard ?? null),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            spanGaps: false,
            tension: 0.35,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 3.2,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
        }
    ];

    if (progressChart) progressChart.destroy();
    progressChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        plugins: [nonlinearBackgroundPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false, axis: 'x' },
            hover: { mode: 'index', intersect: false, axis: 'x' },
            layout: { padding: { top: 6, right: 8, bottom: 0, left: 0 } },
            scales: {
                x: {
                    grid: { color: 'rgba(102,112,133,0.06)' },
                    ticks: { color: '#667085', maxRotation: 0, autoSkip: true }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 1,
                    afterBuildTicks(scale) {
                        scale.ticks = Array.from({ length: 11 }, (_, i) => ({ value: mapScore(i) }));
                    },
                    ticks: {
                        color: '#667085',
                        callback(value) {
                            return String(Math.round(unmapScore(value)));
                        }
                    },
                    title: { display: true, text: '评分', color: '#667085', font: { size: 11 } },
                    grid: {
                        color(context) {
                            const v = context.tick?.value;
                            if (v === undefined) return 'rgba(102,112,133,0.06)';
                            const raw = Math.round(unmapScore(v));
                            if (raw === 5) return 'rgba(68, 83, 166, 0.16)';
                            return 'rgba(102,112,133,0.06)';
                        },
                        lineWidth(context) {
                            const v = context.tick?.value;
                            if (v === undefined) return 1;
                            const raw = Math.round(unmapScore(v));
                            return raw === 5 ? 1.1 : 1;
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    axis: 'x',
                    filter: () => true,
                    itemSort: (a, b) => a.datasetIndex - b.datasetIndex,
                    callbacks: {
                        label(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            const rawValue = context.dataset.rawData?.[context.dataIndex];
                            if (rawValue !== null && rawValue !== undefined) {
                                label += rawValue + '分';
                            }
                            return label;
                        },
                        afterBody(tooltipItems) {
                            if (tooltipItems.length === 0) return [];
                            const dateIndex = tooltipItems[0].dataIndex;
                            const dates = getFilteredDates(currentRangeDays);
                            const dateStr = dates[dateIndex];
                            const dayData = progressData[dateStr];
                            if (dayData?.notes && dayData.notes !== '无') {
                                const lines = dayData.notes.split('\n');
                                return ['\n备注: ', ...lines];
                            }
                            return [];
                        }
                    }
                }
            }
        }
    });
    window.progressChart = progressChart;
}

function updateDailyInfo(dates) {
    if (dates.length === 0) return;
    
    const latestDate = dates[dates.length - 1];
    const dayData = progressData[latestDate];
    
    const titleMainEl = document.querySelector('.title-main');
    const titleSubtitleEl = document.querySelector('.title-subtitle');
    const observationContentEl = document.querySelector('.observation-content');
    
    // 解析observation字段，格式：AI治颈椎Day12｜放松也是一种努力
    if (dayData?.observation) {
        const parts = dayData.observation.split('｜');
        if (parts.length === 2) {
            // 第一行：📈 + Day编号
            if (titleMainEl) {
                titleMainEl.textContent = '📈 ' + parts[0].trim();
            }
            // 第二行：主题副标题（加双引号）
            if (titleSubtitleEl) {
                titleSubtitleEl.textContent = '"' + parts[1].trim() + '"';
            }
        } else {
            // 如果格式不对，全部显示在第一行
            if (titleMainEl) {
                titleMainEl.textContent = '📈 ' + dayData.observation;
            }
            if (titleSubtitleEl) {
                titleSubtitleEl.textContent = '';
            }
        }
    } else {
        // 没有observation数据时显示默认
        if (titleMainEl) {
            titleMainEl.textContent = '📈 今日观察';
        }
        if (titleSubtitleEl) {
            titleSubtitleEl.textContent = '';
        }
    }
    
    if (observationContentEl) {
        if (dayData?.notes) {
            observationContentEl.innerHTML = dayData.notes.replace(/\\n/g, '<br>');
        } else {
            observationContentEl.textContent = '今日无';
        }
    }
}

function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        dateEl.textContent = `${month}月${day}日`;
    }
}
