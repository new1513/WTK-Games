
//if (gameState.currentTurnPlayerId !== lastTurnPlayerId || gameState.currentPhase !== lastPhase) {(function() {
  // --- UTILS ---
  function getEquipTooltip(cardName) {
    if (cardName === 'ZHUGE_CROSSBOW') return 'หน้าไม้ขงเบ้ง (ระยะ 1)\nสามารถใช้การ์ด โจมตี (SLASH) ได้ไม่จำกัดจำนวนครั้งในเทิร์น';
    if (cardName === 'BLUE_STEEL_SWORD') return 'ง้าวชิงกัง (ระยะ 2)\nโจมตีทะลุเกราะ (ไม่สนใจเกราะของเป้าหมาย)';
    if (cardName === 'RED_HARE') return 'ม้าเซ็กเธาว์ (ม้าบุก -1)\nลดระยะห่างระหว่างคุณกับเป้าหมายลง 1 (เป้าหมายอยู่ใกล้ขึ้น)';
    if (cardName === 'LIGHTNING_HOOF') return 'ม้าเต็กเลา (ม้าหมอบ +1)\nเพิ่มระยะห่างระหว่างคุณกับศัตรู 1 (ศัตรูโจมตีคุณยากขึ้น)';
    if (cardName === 'RATTAN_ARMOR') return 'เกราะหวาย\nป้องกันการโจมตีปกติทั้งหมด แต่จะได้รับความเสียหายจากไฟแรงขึ้น +1';
    if (cardName === 'SILVER_LION_HELMET') return 'หมวกสิงโตเงิน\nลดความเสียหายทั้งหมดที่มากกว่า 1 ให้เหลือเพียง 1 เสมอ';
    if (cardName === 'LIGHTNING') return 'อัสนีบาต (สายฟ้า)\nเมื่อเริ่มเทิร์น สุ่มจั่ว 1 ใบ หากได้โพดำ 2-9 จะโดน 3 ดาเมจ ไม่งั้นส่งต่อให้คนถัดไป';
    if (cardName === 'INDULGENCE') return 'สุขสำราญ (เว้นเทิร์น)\nเมื่อเริ่มเทิร์น สุ่มจั่ว 1 ใบ หากไม่ใช่หัวใจ จะถูกข้ามเฟสเล่นการ์ดทันที';
    if (cardName === 'STARVATION') return 'เสบียงขาด (ห้ามจั่ว)\nเมื่อเริ่มเทิร์น สุ่มจั่ว 1 ใบ หากไม่ใช่ดอกจิก จะถูกข้ามเฟสจั่วการ์ดทันที';
    if (cardName === 'NIO_SHIELD') return 'โล่หนี่หวัง\nป้องกันความเสียหายจากไพ่ Attack สัญลักษณ์สีดำ (♠/♣)';
    if (cardName === 'EIGHT_TRIGRAMS_FORMATION') return 'ประยุทธ์แปดทิศ\n(ยังไม่เปิดใช้งานสกิลพิเศษ)';
    return cardName;
  }
  function calculateDistance(state, fromId, toId) {
    const order = state.turnOrder.filter(pid => state.players[pid] && state.players[pid].isAlive);
    const idxFrom = order.indexOf(fromId);
    const idxTo = order.indexOf(toId);
    
    if (idxFrom === -1 || idxTo === -1) return 999;
    
    const directDiff = Math.abs(idxFrom - idxTo);
    const circularDiff = order.length - directDiff;
    let baseDistance = Math.min(directDiff, circularDiff);
    
    const attacker = state.players[fromId];
    const defender = state.players[toId];
    
    if (attacker.equipment && attacker.equipment.offensiveHorse) baseDistance -= 1;
    if (defender.equipment && defender.equipment.defensiveHorse) baseDistance += 1;
    
    return Math.max(1, baseDistance);
  }

  function drawTargetLine(fromId, toId, isValid) {
    const fromEl = fromId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${fromId}`);
    const toEl = toId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${toId}`);
    
    if (!fromEl || !toEl) return;
    
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    
    const x1 = fromRect.left + fromRect.width / 2;
    const y1 = fromRect.top + fromRect.height / 2;
    const x2 = toRect.left + toRect.width / 2;
    const y2 = toRect.top + toRect.height / 2;
    
    const length = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
    const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
    
    const line = document.createElement('div');
    line.style.position = 'fixed';
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.width = '0px';
    line.style.height = '6px';
    line.style.backgroundColor = isValid ? '#00ff00' : '#ff0000';
    line.style.transformOrigin = '0 50%';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.zIndex = '9999';
    line.style.pointerEvents = 'none';
    line.style.boxShadow = `0 0 15px ${isValid ? '#00ff00' : '#ff0000'}`;
    line.style.transition = 'width 0.3s ease-out, opacity 0.5s ease-in-out';
    line.style.borderRadius = '3px';
    
    document.body.appendChild(line);
    
    // Trigger animation
    setTimeout(() => {
      line.style.width = `${length}px`;
    }, 10);
    
    setTimeout(() => {
      line.style.opacity = '0';
      setTimeout(() => line.remove(), 500);
    }, 800);
  }

  function triggerDrawAnimation(playerId, count) {
    const avatarEl = playerId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${playerId}`);
    if (!avatarEl) return;
    const targetRect = avatarEl.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const flyingCard = document.createElement('div');
        flyingCard.className = 'card';
        flyingCard.style.position = 'fixed';
        flyingCard.style.left = `${centerX}px`;
        flyingCard.style.top = `${centerY}px`;
        flyingCard.style.width = '60px';
        flyingCard.style.height = '90px';
        flyingCard.style.backgroundColor = '#555';
        flyingCard.style.border = '2px solid #fff';
        flyingCard.style.borderRadius = '6px';
        flyingCard.style.zIndex = '10000';
        flyingCard.style.pointerEvents = 'none';
        flyingCard.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        flyingCard.style.transform = 'translate(-50%, -50%) scale(0.1)';
        document.body.appendChild(flyingCard);
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            flyingCard.style.left = `${targetRect.left + targetRect.width/2}px`;
            flyingCard.style.top = `${targetRect.top + targetRect.height/2}px`;
            flyingCard.style.transform = 'translate(-50%, -50%) scale(0.8)';
            flyingCard.style.opacity = '0';
          });
        });
        
        setTimeout(() => {
          flyingCard.remove();
        }, 500);
      }, i * 150);
    }
  }

  // --- STATE ---
  let socket = null;
  let myPlayerId = null;
  
  let myRoomId = null;
  let gameState = null;
  let selectedCardId = null;
  let awaitingTarget = false;
  let countdownInterval = null;
  let wtkHeroes = [];
  let selectedDiscardIds = [];
  let recentlyDamaged = new Set();
  let currentLobbyAction = null;

  // --- DOM ELEMENTS ---
  const $ = (id) => document.getElementById(id);

  // Screens
  const lobbyScreen = $('lobby-screen');
  const gameScreen = $('game-screen');
  const draftScreen = $('draft-screen');
  const draftCardsGrid = $('draft-cards-grid');
  const draftRoleBanner = $('draft-role-banner');
  
  // Lobby Setup
  const lobbyPlayersList = $('lobby-players-list');
  const lobbyPlayersCount = $('lobby-players-count');
  const displayLobbyRoomCode = $('display-lobby-room-code');
  const lobbyRoomModeText = $('lobby-room-mode-text');
  const btnLobbyStartGame = $('btn-lobby-start-game');
  const btnLobbyLeave = $('btn-lobby-leave');
  const btnLobbyWaitingText = $('lobby-waiting-text');

  // Board
  const phaseText = $('phase-text');
  const displayRoomId = $('display-room-id');
  const opponentsZone = $('opponents-zone');
  const playerStatusBar = $('player-status-bar');
  const handCards = $('hand-cards');
  const handCount = $('hand-count');

  // Discards
  const discardInstruction = $('discard-instruction');
  const discardNeededCount = $('discard-needed-count');
  const btnDiscardConfirm = $('btn-discard-confirm');

  // Actions
  const btnPlayCard = $('btn-play-card');
  const btnPreviewCard = $('btn-preview-card');
  const btnSunQuanSkill = $('btn-sun-quan-skill');
  const btnLiuBeiSkill = $('btn-liu-bei-skill');
  const btnDiaoChanSkill = $('btn-diao-chan-skill');
  const btnZhouYuSkill = $('btn-zhou-yu-skill');
  const btnEndTurn = $('btn-end-turn');
  const targetHint = $('target-hint');
  const targetHintText = $('target-hint-text');
  const eventLog = $('event-log');

  // Preview Modal
  const cardPreviewModal = $('card-preview-modal');
  const previewCardName = $('preview-card-name');
  const previewCardImg = $('preview-card-img');
  const btnClosePreview = $('btn-close-preview');

  // Reaction
  const pendingOverlay = $('pending-overlay');
  const pendingAttackerName = $('pending-attacker-name');
  const countdownBarFill = $('countdown-bar-fill');
  const countdownSeconds = $('countdown-seconds');
  const btnDodge = $('btn-dodge');
  const btnTakeDamage = $('btn-take-damage');
  const toastContainer = $('toast-container');

  // Luo River Overlay
  const luoRiverOverlay = $('luo-river-overlay');
  const btnLuoTrigger = $('btn-luo-trigger');
  const btnLuoSkip = $('btn-luo-skip');

  // Dying Overlay
  const dyingOverlay = $('dying-overlay');
  const dyingPlayerName = $('dying-player-name');
  const dyingAskerName = $('dying-asker-name');
  const dyingHelpActions = $('dying-help-actions');
  const btnDyingUsePeach = $('btn-dying-use-peach');
  const btnDyingPass = $('btn-dying-pass');
  const dyingWaitMessage = $('dying-wait-message');


  // Hero Modal
  const heroInfoModal = $('hero-info-modal');
  const modalHeroName = $('modal-hero-name');
  const modalHeroSub = $('modal-hero-sub');
  const modalHeroAvatar = $('modal-hero-avatar');
  const modalHeroSkill = $('modal-hero-skill');
  const modalHeroDesc = $('modal-hero-desc');
  const btnCloseHeroModal = $('btn-close-hero-modal');

  // Game Over
  const gameOverOverlay = $('game-over-overlay');
  const gameOverWinnerRole = $('game-over-winner-role');
  const gameOverWinnerText = $('game-over-winner-text');
  const btnReturnLobby = $('btn-return-lobby');

  // --- CARD DISPLAY CONFIG ---
  const CARD_DICT = {
    'SLASH': { name: 'โจมตี (Slash)', desc: 'โจมตีเป้าหมาย 1 คนในระยะ (หากเป้าหมายไม่มี DODGE จะเสีย 1 HP)', icon: '⚔️', theme: 'card-slash', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014284266ed161a63759.jpg' },
    'DODGE': { name: 'หลบ (Dodge)', desc: 'ยกเลิกผลของการโจมตี (SLASH)', icon: '🛡️', theme: 'card-dodge', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014233766ed14e9bebdb.jpg' },
    'PEACH': { name: 'สวนท้อ (Peach)', desc: 'ฟื้นฟู 1 HP หรือช่วยชีวิตตัวเอง/ผู้อื่น', icon: '🍑', theme: 'card-peach', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014270466ed15b8dfbbe.jpg' },
    'WINE': { name: 'สุรา (Wine)', desc: 'เพิ่มดาเมจ SLASH เป็น 2 ดาเมจ หรือใช้ฟื้นฟู 1 HP เมื่อเลือดหมด', icon: '🍶', theme: 'card-wine', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014452766ed1a07699f7.jpg' },
    'STEAL': { name: 'ขโมย (Steal)', desc: 'ขโมยการ์ด 1 ใบจากผู้เล่นในระยะ 1 (บนมือหรือในช่องสวมใส่)', icon: '🖐️', theme: 'card-steal', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014363066ed17eed2877.jpg' },
    'SABOTAGE': { name: 'ทำลาย (Sabotage)', desc: 'เลือกทิ้งการ์ด 1 ใบของเป้าหมาย (บนมือหรือในช่องสวมใส่)', icon: '🔥', theme: 'card-steal', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014290866ed1634c9083.jpg' },
    'EX_NIHILO': { name: 'ไร้กลางมี (Ex Nihilo)', desc: 'จั่วการ์ด 2 ใบจากกอง', icon: '✨', theme: 'card-peach', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014343666ed177cc16a3.jpg' },
    'DUEL': { name: 'ประลอง (Duel)', desc: 'ผลัดกันออก SLASH ผู้ที่ไม่มี SLASH จะโดน 1 ดาเมจ', icon: '🤺', theme: 'card-slash', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014345866ed1792871c0.jpg' },
    'BARBARIAN_INVASION': { name: 'วันฟ้าทลายศัตรู', desc: 'ทุกคนต้องออก SLASH 1 ใบ ไม่เช่นนั้นเสีย 1 HP', icon: '🐘', theme: 'card-slash', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014305266ed169cc2b59.jpg' },
    'ARROW_BARRAGE': { name: 'ฝนธนู (Archery)', desc: 'ทุกคนต้องออก DODGE 1 ใบ ไม่เช่นนั้นเสีย 1 HP', icon: '🏹', theme: 'card-slash', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014340966ed1761909c6.jpg' },
    'PEACH_GARDEN': { name: 'สวนท้อสาบาน', desc: 'ฟื้นฟู 1 HP ให้ทุกคนที่บาดเจ็บ', icon: '🌸', theme: 'card-peach', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014165366ed1355169ef.jpg' },
    'LIGHTNING': { name: 'สายฟ้า (Lightning)', desc: 'ตัดสินชะตา: โพดำ 2-9 รับ 3 ดาเมจ', icon: '⚡', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014180066ed13985ce62.jpg' },
    'INDULGENCE': { name: 'สุขไม่คิดกลับ', desc: 'ข้ามเฟส Play ถ้าเปิดไม่ได้ โพแดง', icon: '🍷', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014302766ed1683b32cf.jpg' },
    'STARVATION': { name: 'เสบียงขาด', desc: 'ข้ามเฟส Draw ถ้าเปิดไม่ได้ ดอกจิก', icon: '🍚', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014441566ed19bfae6cc.jpg' },
    'ZHUGE_CROSSBOW': { name: 'หน้าไม้จูกัด', desc: 'อาวุธระยะ 1: SLASH ได้ไม่จำกัด', icon: '🏹', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014293266ed164c8ef28.jpg' },
    'BLUE_STEEL_SWORD': { name: 'ง้าวมังกร', desc: 'อาวุธระยะ 2: เพิกเฉยเกราะ', icon: '🗡️', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014371866ed181e49171.jpg' },
    'LIGHTNING_HOOF': { name: 'ม้าบุก (-1)', desc: 'ลดระยะการโจมตีลง 1', icon: '🏇', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014365066ed1802e8169.jpg' },
    'RED_HARE': { name: 'ม้าหมอบ (+1)', desc: 'เพิ่มระยะป้องกันขึ้น 1', icon: '🐴', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014334766ed174b2c963.jpg' },
    'NIO_SHIELD': { name: 'โล่หนี่หวัง', desc: 'ป้องกัน Attack สัญลักษณ์สีดำ', icon: '🛡️', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2013365666ed09f899277.jpg' },
    'EIGHT_TRIGRAMS_FORMATION': { name: 'ประยุทธ์แปดทิศ', desc: 'ชุดเกราะพิเศษ', icon: '☯️', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014300366ed166b24f71.jpg' },
    'SILVER_LION_HELMET': { name: 'หมวกสิงโตเงิน', desc: 'ลดดาเมจเหลือ 1 เสมอ', icon: '🦁', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014405366ed18f572589.jpg' },
    'RATTAN_ARMOR': { name: 'เกราะหวาย', desc: 'กัน Attack ปกติ แต่รับดาเมจไฟ +1', icon: '🥋', theme: 'card-weapon', pic: 'https://sjsea-2cstatic.oss-cn-hongkong.aliyuncs.com/uploads/banner/2014435266ed19a85192a.jpg' },
  };

  const CHAR_ICONS = {
    'CAO_CAO': '👑',
    'ZHEN_JI': '🔮',
    'ZHANG_FEI': '🐗',
    'ZHAO_YUN': '🐉',
    'SIMA_YI': '🦊',
    'LIU_BEI': '🏯',
  };

  const ROLE_LABELS = {
    'LORD': '👑 เจ้าเมือง (Lord)',
    'LOYALIST': '🛡️ ผู้ภักดี (Loyalist)',
    'REBEL': '⚔️ กบฏ (Rebel)',
    'RENEGADE': '🎭 คนทรยศ (Renegade)',
    'UNKNOWN': '👤 ผู้ไม่เปิดเผยตัวตน'
  };

  const ROLE_CSS = {
    'LORD': 'role-lord',
    'LOYALIST': 'role-loyalist',
    'REBEL': 'role-rebel',
    'RENEGADE': 'role-renegade',
    'UNKNOWN': ''
  };

  const HERO_SKILLS = {
    'CAO_CAO': '🛡️ **Shield & Mirror**: เมื่อคุณได้รับดาเมจจาก SLASH หรือ KIT การ์ดใบนั้นจะเข้าสู่มือคุณฟรี!',
    'ZHEN_JI': '🔮 **Empress Dowager**: คุณสามารถทิ้งการ์ดสีดำ (Spade ♠ / Club ♣) เพื่อหลบหลีก (DODGE) การโจมตีได้',
    'ZHANG_FEI': '🐗 **Battle Cry**: คุณสามารถใช้งาน SLASH ได้ไม่จำกัดจำนวนครั้งในหนึ่งเทิร์น',
    'ZHAO_YUN': '🐉 **Dragon Courage**: คุณสามารถใช้งานการ์ด SLASH แทน DODGE และการ์ด DODGE แทน SLASH ได้',
    'GUAN_YU': '🔴 **God of War**: คุณสามารถนำการ์ดสีแดง (Heart ♥ / Diamond ♦) บนมือใบใดก็ได้มาร่ายเป็น SLASH ได้',
    'SUN_QUAN': '👑 **Resignation**: ในเทิร์นของคุณ คุณสามารถทิ้งการ์ดกี่ใบก็ได้เพื่อจั่วการ์ดใหม่ตามจำนวนที่ทิ้งไป',
    'LADY_ZHEN': '🔮 **Empress Dowager**: คุณสามารถทิ้งการ์ดสีดำ (Spade ♠ / Club ♣) เพื่อหลบหลีก (DODGE) การโจมตีได้',
    'CAI_WENJI': '🎹 **Autograph**: เมื่อคุณตาย คุณสามารถลบสกิลของผู้ฆ่าคุณออกได้'
  };

  const CARD_IMAGES = {
    'SLASH': '/pdf_images/slash.png',
    'DODGE': '/pdf_images/dodge.png',
    'PEACH': '/pdf_images/peach.png',
    'WINE': '/pdf_images/wine.png',
    'STEAL': '/pdf_images/steal.png',
    'ZHUGE_CROSSBOW': '/pdf_images/zhuge_crossbow.png',
    'RED_HARE': '/pdf_images/red_hare.png',
    'LIGHTNING_HOOF': '/pdf_images/lightning_hoof.png'
  };

  function getHeroPic(characterId) {
    if (characterId === 'ZHEN_JI' || characterId === 'LADY_ZHEN') return '/pdf_images/zhen_ji.png';
    if (characterId === 'ZHANG_FEI') return '/pdf_images/zhang_fei.png';
    
    const hero = wtkHeroes.find(h => {
      const nameUpper = (h.title || h.name).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      return nameUpper === characterId;
    });
    return hero ? hero.pic : null;
  }

  // --- UTILS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function showSystemAlert(message, duration = 3000, type = 'default') {
    let container = document.getElementById('system-alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'system-alert-container';
      document.body.appendChild(container);
    }
    const banner = document.createElement('div');
    banner.className = 'system-alert-banner';
    if (type === 'error' || type === 'damage' || type === 'attack') banner.classList.add('alert-danger');
    banner.innerHTML = message;
    container.appendChild(banner);
    setTimeout(() => {
      if (banner.parentElement) banner.remove();
    }, duration);
  }

  /*function triggerDrawAnimation(playerId, count) {
    const avatarEl = playerId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${playerId}`);
    if (!avatarEl) return;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const card = document.createElement('div');
        card.className = 'draw-animation-card';
        document.body.appendChild(card);
        
        const rect = avatarEl.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        const endX = rect.left + rect.width / 2;
        const endY = rect.top + rect.height / 2;
        
        card.style.left = `${startX}px`;
        card.style.top = `${startY}px`;
        
        requestAnimationFrame(() => {
          card.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.2)`;
          card.style.opacity = '0';
        });
        
        setTimeout(() => {
          if (card.parentElement) card.remove();
        }, 600);
      }, i * 200);
    }
  }*/

  // --- AUDIO & EFFECTS ---

  function showCardPlayAnimation(playerId, cardName) {
    const cData = typeof CARD_DICT !== 'undefined' ? CARD_DICT[cardName] : (globalThis.CARD_DICT && globalThis.CARD_DICT[cardName] ? globalThis.CARD_DICT[cardName] : null);
    if (!cData || !cData.pic) return;
    const avatarEl = playerId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${playerId}`);
    if (!avatarEl) return;

    const overlay = document.createElement('div');
    overlay.className = 'card-play-overlay';
    const cardImg = document.createElement('img');
    cardImg.src = cData.pic;
    cardImg.className = 'card-play-img';
    overlay.appendChild(cardImg);
    document.body.appendChild(overlay);

    const rect = avatarEl.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    overlay.style.left = `${startX}px`;
    overlay.style.top = `${startY}px`;
    overlay.style.transform = 'translate(-50%, -50%) scale(0.1)';
    overlay.style.opacity = '0';

    requestAnimationFrame(() => {
      overlay.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      overlay.style.left = '50%';
      overlay.style.top = '50%';
      overlay.style.transform = 'translate(-50%, -50%) scale(1.5)';
      overlay.style.opacity = '1';
    });

    setTimeout(() => {
      overlay.style.transition = 'all 0.4s ease-in';
      overlay.style.opacity = '0';
      overlay.style.transform = 'translate(-50%, -50%) scale(1.8)';
      setTimeout(() => {
        if (overlay.parentElement) overlay.remove();
      }, 400);
    }, 1200);
  }

  function addLog(message, type = 'system') {
    let duration = 3500;
    if (type === 'damage' || type === 'attack') duration = 4500;
    showSystemAlert(message, duration, type);
  }

  function getHpClass(hp, maxHp) {
    const ratio = hp / maxHp;
    if (ratio > 0.6) return 'hp-full';
    if (ratio > 0.3) return 'hp-mid';
    return 'hp-low';
  }

  function isMyTurn() {
    return gameState && gameState.currentTurnPlayerId === myPlayerId && gameState.players[myPlayerId] && gameState.players[myPlayerId].isAlive;
  }

  function isDiscardPhase() {
    return isMyTurn() && gameState.currentPhase === 'DISCARD';
  }

  function hasCharacter(charId, name) {
    if (!charId) return false;
    return charId.toUpperCase().includes(name.toUpperCase());
  }

  // --- SOCKET CONTROLLER ---
  const params = new URLSearchParams(window.location.search);
  
  // Extract room ID from path /app/:roomId
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);
  let roomIdParam = null;
  if (pathSegments.length >= 2 && (pathSegments[0] === 'app' || pathSegments[0] === 'room')) {
    roomIdParam = pathSegments[pathSegments.length - 1];
  } else {
    roomIdParam = params.get('id');
  }

  let playerNameParam = sessionStorage.getItem('playerName') || params.get('name');
  if (!playerNameParam) {
    playerNameParam = prompt("กรุณาระบุชื่อผู้เล่น (Nickname):") || "Player_" + Math.floor(100 + Math.random() * 900);
    sessionStorage.setItem('playerName', playerNameParam);
  }

  const modeParam = sessionStorage.getItem('gameMode') || params.get('mode') || 'ONLINE';
  const actionParam = sessionStorage.getItem('roomAction') || params.get('action') || 'join';
  const botCountParam = sessionStorage.getItem('botCount') || params.get('players') || '3';

  if (!roomIdParam) {
    alert("กรุณาระบุรหัสห้อง!");
    window.location.href = '/lobby';
  }

  socket = io();
  socket.on('connect', () => {
    myRoomId = roomIdParam;
    displayLobbyRoomCode.textContent = myRoomId;
    lobbyRoomModeText.textContent = `โหมดเกม: ${modeParam === 'BOT' ? 'เล่นกับบอท' : 'เล่นออนไลน์'}`;

    if (actionParam === 'create') {
      socket.emit('create_room', { roomId: myRoomId, playerName: playerNameParam, mode: modeParam });
    } else {
      socket.emit('join_room', { roomId: myRoomId, playerName: playerNameParam });
    }
  });

  socket.on('room_created', ({ roomId, playerId }) => {
    myRoomId = roomId;
    myPlayerId = playerId;
    displayLobbyRoomCode.textContent = myRoomId;
    btnLobbyStartGame.classList.remove('hidden');
    btnLobbyWaitingText.classList.add('hidden');
    const ctrl = document.getElementById('host-bot-controls');
    if (ctrl) ctrl.classList.remove('hidden');
  });

  socket.on('room_joined', ({ roomId, playerId }) => {
    myRoomId = roomId;
    myPlayerId = playerId;
    displayLobbyRoomCode.textContent = myRoomId;
    btnLobbyStartGame.classList.add('hidden');
    btnLobbyWaitingText.classList.remove('hidden');
    const ctrl = document.getElementById('host-bot-controls');
    if (ctrl) ctrl.classList.add('hidden');
  });

  socket.on('room_state_update', onRoomStateUpdate);

    socket.on('card_played', ({ playerId, cardName, targetId }) => {
      try {
        showCardPlayAnimation(playerId, cardName);

        if (gameState && gameState.players) {
          const pName = gameState.players[playerId] ? gameState.players[playerId].name : playerId;
          
          const localDict = typeof CARD_DICT !== 'undefined' ? CARD_DICT : {};
          const globalDict = globalThis.CARD_DICT || {};
          const cData = localDict[cardName] || globalDict[cardName];
          let cNameLocal = cData ? cData.name : cardName;
          if (cNameLocal.includes(' (')) {
            cNameLocal = cNameLocal.split(' (')[0];
          }

          let msg = `🃏 ${pName} ใช้ ${cNameLocal} (${cardName})`;
          if (targetId && targetId !== playerId) {
            const tName = gameState.players[targetId] ? gameState.players[targetId].name : targetId;
            msg += ` ใส่ ${tName}`;
          }
          addLog(msg, 'system');
        }
      } catch (e) {
        console.error('card_played handler error', e);
      }
    });

    socket.on('damage_log', (data) => {
      const { targetId, attackerId, damage, cardName, hp, maxHp } = data;
      if (!gameState || !gameState.players) return;
      recentlyDamaged.add(targetId);
      setTimeout(() => recentlyDamaged.delete(targetId), 800);
      const targetName = gameState.players[targetId] ? gameState.players[targetId].name : targetId;
      let msg = `💥 ${targetName} เสียพลังชีวิต ${damage} หน่วย`;
      
      if (attackerId && gameState.players[attackerId]) {
        msg += ` จาก ${gameState.players[attackerId].name}`;
      }
      if (cardName) {
        msg += ` (${cardName})`;
      }
      
      msg += ` (พลังชีวิต: ${hp}/${maxHp})`;
      addLog(msg, 'damage');
    });

    
    
  
  

  socket.on('game_error', (err) => {
    showToast(err.message, 'error');
    
    // Only redirect if the error is critical (e.g. invalid room, full, etc.)
    const criticalMessages = ["ไม่พบห้อง", "เกมก้าวสู่การเล่นไปแล้ว", "ไม่พบผู้เล่น"];
    const isCritical = criticalMessages.some(msg => err.message.includes(msg)) || err.critical;
    
    if (isCritical) {
      setTimeout(() => {
        window.location.href = '/lobby';
      }, 1500);
    }
  });

  socket.on('disconnect', () => {
    addLog('ขาดการเชื่อมต่อจากเซิร์ฟเวอร์', 'error');
    showToast('ขาดการเชื่อมต่อ!', 'error');
  });

  if (btnLobbyLeave) {
    btnLobbyLeave.addEventListener('click', () => {
      window.location.href = '/lobby';
    });
  }

  btnLobbyStartGame.addEventListener('click', () => {
    socket.emit('start_game', { roomId: myRoomId, botCount: parseInt(botCountParam) });
  });

  const btnLobbyAddBot = $('btn-lobby-add-bot');
  if (btnLobbyAddBot) {
    btnLobbyAddBot.addEventListener('click', () => {
      socket.emit('add_bot', { roomId: myRoomId });
    });
  }

  const btnLobbyRemoveBot = $('btn-lobby-remove-bot');
  if (btnLobbyRemoveBot) {
    btnLobbyRemoveBot.addEventListener('click', () => {
      socket.emit('remove_bot', { roomId: myRoomId });
    });
  }

  btnReturnLobby.addEventListener('click', () => {
    window.location.href = '/lobby';
  });

  const btnGameLeave = $('btn-game-leave');
  if (btnGameLeave) {
    btnGameLeave.addEventListener('click', () => {
      if (confirm('คุณต้องการออกจากห้องเกมนี้ใช่หรือไม่?')) {
        window.location.href = '/lobby';
      }
    });
  }

  // --- STATE HANDLER ---
  function onRoomStateUpdate(state) {
    const prevState = gameState;
    gameState = state;

    if (gameState.status === 'LOBBY') {
      lobbyScreen.classList.remove('hidden');
      draftScreen.classList.add('hidden');
      gameScreen.classList.add('hidden');
      gameOverOverlay.classList.add('hidden');
      renderLobbyPlayers();
    } else if (gameState.status === 'DRAFTING') {
      lobbyScreen.classList.add('hidden');
      draftScreen.classList.remove('hidden');
      gameScreen.classList.add('hidden');
      gameOverOverlay.classList.add('hidden');
      renderDraftChoices();
    } else if (gameState.status === 'PLAYING') {
      lobbyScreen.classList.add('hidden');
      draftScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      gameOverOverlay.classList.add('hidden');

      const topBar = document.querySelector('.top-bar');
      if (topBar) topBar.classList.remove('hidden');
      const handZone = document.querySelector('.hand-zone');
      if (handZone) handZone.classList.remove('hidden');

      renderPhase();
      renderOpponents();
      renderPlayerStatus();
      renderHand();
      updateActionButtons();
      renderPendingAction();

      detectEvents(prevState, gameState);
    } else if (gameState.status === 'ENDED') {
      lobbyScreen.classList.add('hidden');
      draftScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden'); // Keep board visible
      pendingOverlay.classList.add('hidden');
      dyingOverlay.classList.add('hidden');
      
      const topBar = document.querySelector('.top-bar');
      if (topBar) topBar.classList.add('hidden');
      const handZone = document.querySelector('.hand-zone');
      if (handZone) handZone.classList.add('hidden');
      const targetHint = document.getElementById('target-hint');
      if (targetHint) targetHint.classList.add('hidden');
      
      gameOverOverlay.classList.remove('hidden');
      gameOverWinnerRole.textContent = gameState.winnerRole === 'LORD' ? 'ฝ่ายเจ้าเมืองชนะ (Lord Victory)' : 
                                      gameState.winnerRole === 'REBEL' ? 'ฝ่ายกบฏชนะ (Rebel Victory)' : 
                                      'ฝ่ายคนทรยศชนะ (Renegade Victory)';
      gameOverWinnerText.textContent = gameState.winnerText || '';
    }
  }

  function renderLobbyPlayers() {
    lobbyPlayersList.innerHTML = '';
    const players = Object.values(gameState.players);
    lobbyPlayersCount.textContent = players.length;

    players.forEach(p => {
      const li = document.createElement('li');
      const isHost = p.id === 'p1';
      li.innerHTML = `
        <span>👤 ${p.name} ${p.isBot ? '<small>(Bot)</small>' : ''}</span>
        ${isHost ? '<span class="player-host-tag">Host</span>' : ''}
      `;
      lobbyPlayersList.appendChild(li);
    });
  }

  const DRAFT_HERO_SKILLS = {
    'CAO CAO': 'Emperor\'s Domain: เมื่อได้รับความเสียหาย จะได้การ์ดที่ทำดาเมจใบนั้นขึ้นมือ',
    'LIU BEI': 'Benevolence: ในเทิร์นตัวเอง สามารถมอบไพ่กี่ใบก็ได้ให้คนอื่นเพื่อฟื้นฟู HP',
    'SUN QUAN': 'Resignation: ทิ้งไพ่กี่ใบก็ได้เพื่อจั่วใหม่จำนวนเท่ากัน (เทิร์นละครั้ง)',
    'LV BU': 'Unmatched: เมื่อใช้ SLASH/DUEL เป้าหมายต้องใช้ DODGE/SLASH 2 ใบ',
    'ZHAO YUN': 'Dragon Courage: ใช้ DODGE แทน SLASH และ SLASH แทน DODGE ได้',
    'GUAN YU': 'Martial Saint: นำการ์ดสีแดงใดๆ มาใช้แทน SLASH ได้เสมอ',
    'ZHANG FEI': 'Roar: ใช้ SLASH ได้ไม่จำกัดครั้งในเทิร์นตัวเอง',
    'ZHUGE LIANG': 'Empty City: หากไม่มีไพ่บนมือ จะไม่ตกเป็นเป้าหมายของ SLASH/DUEL',
    'DIAO CHAN': 'Seduction: ทิ้งไพ่ 1 ใบ เพื่อบังคับผู้ชาย 2 คนให้ DUEL กันเอง',
    'SIMA YI': 'Feedback: เมื่อได้รับดาเมจ สุ่มขโมยไพ่ 1 ใบจากผู้โจมตี',
    'ZHOU YU': 'Handsome: ช่วงจั่วไพ่จะจั่วได้ 3 ใบแทนที่จะเป็น 2 ใบ',
    'ZHEN JI': 'Luo River: เมื่อเริ่มเทิร์น จั่วไพ่ตัดสินสีดำ จะได้ไพ่ขึ้นมือและจั่วต่อได้เรื่อยๆ',
    'LADY ZHEN (ZHEN JI)': 'Luo River: เมื่อเริ่มเทิร์น จั่วไพ่ตัดสินสีดำ จะได้ไพ่ขึ้นมือและจั่วต่อได้เรื่อยๆ',
    'LADY ZHEN': 'Luo River: เมื่อเริ่มเทิร์น จั่วไพ่ตัดสินสีดำ จะได้ไพ่ขึ้นมือและจั่วต่อได้เรื่อยๆ'
  };

  function renderDraftChoices() {
    const me = gameState.players[myPlayerId];
    if (!me) return;

    if (draftRoleBanner) {
      const roleLabel = ROLE_LABELS[me.role] || '👤 กำลังสุ่มบทบาท...';
      const roleCss = ROLE_CSS[me.role] || '';
      draftRoleBanner.textContent = `บทบาทของคุณ: ${roleLabel}`;
      draftRoleBanner.className = `role-badge ${roleCss}`;
    }

    if (me.character) {
      draftCardsGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 40px; text-align: center;">
          <h2 style="color: var(--accent-cyan); margin-bottom: 12px;">รอดราฟท์สำเร็จ</h2>
          <p style="color: var(--text-secondary);">รอขุนพลทุกคนลงชื่อเลือกสังกัดเข้าสู่ปฐพี...</p>
        </div>
      `;
      return;
    }

    draftCardsGrid.innerHTML = '';
    const choices = me.characterChoices || [];

    choices.forEach(c => {
      const card = document.createElement('div');
      card.className = 'draft-card';
      const charSkill = DRAFT_HERO_SKILLS[(c.name || '').toUpperCase()] || 'ยังไม่มีสกิลระบุ';
      
      card.innerHTML = `
        <div class="draft-avatar" style="background-image: url('${c.pic || 'https://static.wtkgames.com/icons/card_mask.png'}');"></div>
        <div class="draft-name" style="margin-bottom: 4px;">${c.name}</div>
        <div class="draft-sub" style="font-size: 11px; margin-bottom: 8px;">${c.sub}</div>
        <div class="draft-skill" style="font-size: 12px; color: var(--accent-gold); margin-bottom: 12px; line-height: 1.4; min-height: 34px;">
          ${charSkill}
        </div>
        <div class="draft-kingdom kingdom-${c.kingdom}">
          ${c.kingdom === 1 ? 'WEI 🔴' : c.kingdom === 2 ? 'SHU 🟢' : c.kingdom === 3 ? 'WU 🔵' : 'QUN ⚪'}
        </div>
      `;
      card.addEventListener('click', () => {
        socket.emit('choose_character', { roomId: myRoomId, characterId: c.id });
      });
      draftCardsGrid.appendChild(card);
    });
  }

  function renderPhase() {
    phaseText.textContent = gameState.currentPhase;
  }

  function calculateClientDistance(fromId, toId) {
    if (!gameState || !gameState.turnOrder) return 999;
    const order = gameState.turnOrder.filter(pid => {
      const p = gameState.players[pid];
      return p && p.isAlive;
    });
    const idxFrom = order.indexOf(fromId);
    const idxTo = order.indexOf(toId);
    if (idxFrom === -1 || idxTo === -1) return 999;

    const directDiff = Math.abs(idxFrom - idxTo);
    const circularDiff = order.length - directDiff;
    let baseDistance = Math.min(directDiff, circularDiff);

    const attacker = gameState.players[fromId];
    const defender = gameState.players[toId];

    if (attacker && attacker.equipment && attacker.equipment.offensiveHorse) baseDistance -= 1;
    if (defender && defender.equipment && defender.equipment.defensiveHorse) baseDistance += 1;

    return Math.max(1, baseDistance);
  }

  function renderOpponents() {
    opponentsZone.innerHTML = '';
    
    if (!gameState.turnOrder) return;
    const myIndex = gameState.turnOrder.indexOf(myPlayerId);
    if (myIndex === -1) return;

    // Order players starting from the one after myPlayerId, including dead players
    const orderedOpponents = [];
    for (let i = 1; i < gameState.turnOrder.length; i++) {
      const pId = gameState.turnOrder[(myIndex + i) % gameState.turnOrder.length];
      const p = gameState.players[pId];
      if (p) {
        orderedOpponents.push(pId);
      }
    }

    const me = gameState.players[myPlayerId];
    let selectedCard = null;
    const actualCardId = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
    if (actualCardId && me && me.hand) {
      selectedCard = me.hand.find(c => c.id === actualCardId);
    }

    orderedOpponents.forEach((pId, i) => {
      const p = gameState.players[pId];
      if (!p) return;

      const isCurrentTurn = gameState.currentTurnPlayerId === pId;
      const isDead = p.isAlive === false;
      const dist = calculateClientDistance(myPlayerId, pId);
      
      let inRange = true;
      let rangeText = '';

      if (awaitingTarget && !isDead && selectedCard) {
        const isGuanYuSlash = hasCharacter(me.character, 'GUAN_YU') && (selectedCard.suit === 'HEART' || selectedCard.suit === 'DIAMOND');
        const isZhaoYunSlash = hasCharacter(me.character, 'ZHAO_YUN') && selectedCard.name === 'DODGE';
        const isEffectiveSlash = selectedCard.name === 'SLASH' || isGuanYuSlash || isZhaoYunSlash;

        if (isEffectiveSlash) {
          const wRange = (me.equipment && me.equipment.weapon) ? me.equipment.weapon.range : 1;
          inRange = dist <= wRange;
          rangeText = inRange ? `<span style="color: #4CAF50;">[อยู่ในระยะตี (${dist}/${wRange})]</span>` : `<span style="color: #F44336;">[ระยะไม่ถึง (${dist}/${wRange})]</span>`;
        } else if (selectedCard.name === 'STEAL') {
          inRange = dist <= 1;
          rangeText = inRange ? `<span style="color: #4CAF50;">[อยู่ในระยะขโมย (${dist}/1)]</span>` : `<span style="color: #F44336;">[ไกลไป (${dist}/1)]</span>`;
        } else if (selectedCard.name === 'SABOTAGE' || selectedCard.name === 'DUEL' || currentLobbyAction) {
          rangeText = `<span style="color: #2196F3;">[เลือกได้]</span>`;
        }
      }

      const isTargetCandidate = awaitingTarget && !isDead && inRange;

      const card = document.createElement('div');
      card.className = 'opponent-card glass-panel';
      if (isCurrentTurn) card.classList.add('is-current-turn');
      if (isDead) card.classList.add('is-dead');
      if (isTargetCandidate) card.classList.add('is-target-candidate');
      if (awaitingTarget && !isDead && !inRange) card.style.opacity = '0.5';
      card.dataset.playerId = pId;

      const hpPercent = Math.max(0, (p.hp / p.maxHp) * 100);
      const hpClass = getHpClass(p.hp, p.maxHp);
      let roleLabel = ROLE_LABELS[p.role] || '???';
      const roleCss = ROLE_CSS[p.role] || '';

      // Highlight dead role
      if (isDead) {
        roleLabel = `💀 ${roleLabel} (เสียชีวิต)`;
      }

      const heroPic = getHeroPic(p.character);
      const avatarStyle = heroPic ? `style="background-image: url('${heroPic}'); background-size: cover; background-position: center; font-size: 0;"` : '';
      const avatarContent = heroPic ? '' : (CHAR_ICONS[p.character] || '🎭');

      let equipTags = '';
      if (p.equipment) {
        if (p.equipment.weapon) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(p.equipment.weapon.name)}"><span class="tag-icon">🗡️</span>${p.equipment.weapon.name}</span>`;
        if (p.equipment.defensiveHorse) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(p.equipment.defensiveHorse.name)}"><span class="tag-icon">🐴</span>ม้าหมอบ (+1)</span>`;
        if (p.equipment.offensiveHorse) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(p.equipment.offensiveHorse.name)}"><span class="tag-icon">🏇</span>ม้าบุก (-1)</span>`;
        if (p.equipment.armor) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(p.equipment.armor.name)}"><span class="tag-icon">🛡️</span>${p.equipment.armor.name}</span>`;
      }
      if (p.delayedKitZone && p.delayedKitZone.length > 0) {
        p.delayedKitZone.forEach(c => {
          let icon = '⏳';
          if (c.name === 'LIGHTNING') icon = '⚡';
          if (c.name === 'INDULGENCE') icon = '🍷';
          if (c.name === 'STARVATION') icon = '🍚';
          equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(c.name)}" style="background: rgba(244,67,54,0.2);"><span class="tag-icon">${icon}</span>${c.name}</span>`;
        });
      }

      card.innerHTML = `
        <div class="opponent-header" style="cursor:pointer;" onclick="window.showHeroInfo('${p.character}')">
          <div id="opp-avatar-${pId}" class="opponent-avatar" ${avatarStyle}>${avatarContent}</div>
          <div class="opponent-info">
            <div class="opponent-name">${p.name} ℹ️</div>
            <div class="opponent-role ${roleCss}" style="${isDead ? 'font-size: 1.2em; font-weight: bold;' : ''}">${roleLabel}${p.character ? ` · ${p.character}` : ''}</div>
          </div>
        </div>
        <div class="hp-bar-container">
          <div class="hp-label">
            <span>HP</span>
            <span class="mono">${p.hp} / ${p.maxHp}</span>
          </div>
          <div class="hp-bar-track">
            <div class="hp-bar-fill ${hpClass}" style="width: ${hpPercent}%"></div>
          </div>
        </div>
        <div class="opponent-meta">
          <span class="meta-tag"><span class="tag-icon">🃏</span>${p.handCount} ใบ</span>
          <span class="meta-tag" style="background: rgba(255,255,255,0.1);"><span class="tag-icon">📏</span>ระยะ: ${isDead ? '-' : dist}</span>
          ${rangeText}
          ${equipTags}
        </div>
      `;

      if (isTargetCandidate) {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.opponent-header')) return;
          onSelectTarget(pId);
        });
      }

      // Tabletop Positioning (Horseshoe layout)
      const numOpp = orderedOpponents.length;
      if (numOpp > 0) {
        let angle;
        if (numOpp === 1) {
          angle = Math.PI / 2; // Top center (90 deg)
        } else {
          // Span from -15 deg to 195 deg (Bottom right arc over top to Bottom left)
          const startAngle = -15 * (Math.PI / 180);
          const endAngle = 195 * (Math.PI / 180);
          const angleRange = endAngle - startAngle;
          const step = angleRange / (numOpp - 1);
          angle = startAngle + (i * step);
        }
        
        const rx = 44; // % of table width 
        const ry = 36; // reduced from 42 to bring them down
        
        const left = 50 + Math.cos(angle) * rx;
        const top = 52 - Math.sin(angle) * ry; // adjusted center from 48 to 52
        
        card.style.left = `${left}%`;
        card.style.top = `${top}%`;
      }

      opponentsZone.appendChild(card);
    });
  }

  const HERO_SKILLS_TH = {
    'ZHEN_JI': '🔮 เทพธิดาแม่น้ำลั่ว (Luo River): ทอยทำนาย หากได้สีดำจะได้รับเข้ามือฟรี จนกว่าจะได้สีแดง\n🛡️ ไร้ลักษณ์ (Goddess): ใช้การ์ดสีดำแทน DODGE ได้',
    'LADY_ZHEN': '🔮 เทพธิดาแม่น้ำลั่ว (Luo River): ทอยทำนาย หากได้สีดำจะได้รับเข้ามือฟรี จนกว่าจะได้สีแดง\n🛡️ ไร้ลักษณ์ (Goddess): ใช้การ์ดสีดำแทน DODGE ได้',
    'SUN_QUAN': '👑 ผลัดการ์ด (Resignation): ทิ้งการ์ด N ใบเพื่อจั่วใหม่ N ใบ (เทิร์นละครั้ง)',
    'GUAN_YU': '🗡️ เทพสงคราม (God of War): ใช้การ์ดสีแดงเป็น SLASH ได้',
    'ZHAO_YUN': '🐉 จิตวิญญาณมังกร (Dragon Courage): SLASH และ DODGE แปลงสลับกันได้',
    'ZHANG_FEI': '🦁 คำรามศึก (Bellow): ใช้ SLASH ได้ไม่จำกัดครั้งในเทิร์น',
    'ZHUGE_LIANG': '🏯 เมืองว่างเปล่า (Empty City): [Passive] ไม่มีการ์ดบนมือ = ไม่ถูก SLASH/DUEL ได้\n💡 ใช้การ์ดให้หมดเพื่อเข้าสถานะป้องกันสมบูรณ์!',
    'CAO_CAO': '👑 มหาอุปราช (Emperor\'s Domain): [Passive] ได้รับดาเมจ = หยิบการ์ดที่โดนตีขึ้นมือ\n💡 ยิ่งถูกตีมาก ยิ่งได้การ์ดคืนมาก!',
    'SIMA_YI': '🦅 ป้อนกลับ (Feedback): [Passive] ได้รับดาเมจ = ขโมยการ์ดจากมือผู้โจมตี 1 ใบ\n💡 ใครตีสุมาอี้ ต้องพร้อมเสียการ์ด!',
    'LV_BU': '🗡️ ไร้เทียมทาน (Unrivaled): [Passive] SLASH ของลิโป้ต้องใช้ DODGE 2 ใบหลบ\n💡 ดาเมจหนักสุด หลบยากสุดในเกม!',
    'LIU_BEI': '💝 ปันสุข (Benevolence): [Active] มอบการ์ดให้เพื่อนร่วมทีม ให้ >= 2 ใบ = ฟื้น 1 HP\n💡 กดปุ่ม สกิล: ปันสุข เลือกการ์ด แล้วเลือกเป้าหมาย',
    'DIAO_CHAN': '🌸 บ่วงเสน่หา (Seduction): [Active] ทิ้ง 1 การ์ด บังคับศัตรูทิ้ง SLASH ไม่ทิ้ง = เสีย 1 HP\n💡 กดปุ่ม สกิล: บ่วงเสน่หา เลือกการ์ด แล้วเลือกเป้าหมาย',
    'ZHOU_YU': '🎨 รูปงาม: [Passive] จั่ว 3 ใบ (ปกติ 2)\n🔥 บ่มเพลิง (Sow Discord): [Active] ทิ้ง 1 การ์ด บังคับศัตรูทิ้งสีเดียวกัน ไม่ทิ้ง = เสีย 1 HP\n💡 กดปุ่ม สกิล: บ่มเพลิง เลือกการ์ด แล้วเลือกเป้าหมาย'
  };

  function renderPlayerStatus() {
    const me = gameState.players[myPlayerId];
    if (!me) return;

    const hpPercent = Math.max(0, (me.hp / me.maxHp) * 100);
    const hpClass = getHpClass(me.hp, me.maxHp);
    const roleLabel = ROLE_LABELS[me.role] || '???';

    const heroPic = getHeroPic(me.character);
    const avatarStyle = heroPic ? `style="background-image: url('${heroPic}'); background-size: cover; background-position: center; font-size: 0;"` : '';
    const avatarContent = heroPic ? '' : (CHAR_ICONS[me.character] || '🎭');

    let equipTags = '';
    if (me.equipment) {
      if (me.equipment.weapon) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(me.equipment.weapon.name)}"><span class="tag-icon">🗡️</span>${me.equipment.weapon.name}</span>`;
      if (me.equipment.defensiveHorse) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(me.equipment.defensiveHorse.name)}"><span class="tag-icon">🐴</span>ม้าหมอบ</span>`;
      if (me.equipment.offensiveHorse) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(me.equipment.offensiveHorse.name)}"><span class="tag-icon">🏇</span>ม้าบุก</span>`;
      if (me.equipment.armor) equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(me.equipment.armor.name)}"><span class="tag-icon">🛡️</span>${me.equipment.armor.name}</span>`;
    }
    if (me.delayedKitZone && me.delayedKitZone.length > 0) {
      me.delayedKitZone.forEach(c => {
        let icon = '⏳';
        if (c.name === 'LIGHTNING') icon = '⚡';
        if (c.name === 'INDULGENCE') icon = '🍷';
        if (c.name === 'STARVATION') icon = '🍚';
        equipTags += `<span class="meta-tag tooltip-container" data-tooltip="${getEquipTooltip(c.name)}" style="background: rgba(244,67,54,0.2);"><span class="tag-icon">${icon}</span>${c.name}</span>`;
      });
    }

    let hpDots = '';
    for(let j=0; j<me.maxHp; j++) {
      hpDots += `<div class="hp-point ${j >= me.hp ? 'empty' : ''}"></div>`;
    }

    playerStatusBar.innerHTML = `
      <div class="role-badge">${roleLabel}</div>
      <div class="self-avatar" ${avatarStyle} onclick="window.showHeroInfo('${me.character}')" style="cursor:pointer; ${avatarStyle ? avatarStyle.replace('style="', '') : ''}"></div>
      <div class="self-details">
        <div style="cursor:pointer;" onclick="window.showHeroInfo('${me.character}')">
          <div class="self-name">${me.name} ℹ️</div>
          <div class="self-hero">${me.character || 'ไม่มีขุนพล'}</div>
        </div>
        <div class="hp-container self-hp">
          ${hpDots}
        </div>
        <div class="player-equip-tags" style="margin-top: 4px; font-size: 11px;">
          ${equipTags} 
          ${me.wineActive ? '<span class="meta-tag" style="border-color: var(--accent-gold); color: var(--accent-gold);"><span class="tag-icon">🍶</span>ไวน์ทำงาน</span>' : ''}
        </div>
      </div>
    `;

    // Render side-panel skill box
    const heroName = me.character ? (me.character.replace(/_/g, ' ')) : 'ไม่มีขุนพล';
    const cleanHeroName = me.character ? me.character.replace(/__+/g, '_').replace(/_$/, '') : '';
    
    let skillDesc = 'ไม่มีข้อมูลความสามารถพิเศษสำหรับตัวละครนี้';
    for (const key of Object.keys(HERO_SKILLS_TH)) {
      if (cleanHeroName.includes(key)) {
        skillDesc = HERO_SKILLS_TH[key];
        break;
      }
    }
    
    const skillBoxName = document.getElementById('skill-box-hero-name');
    const skillBoxSub = document.getElementById('skill-box-hero-sub');
    const skillBoxDesc = document.getElementById('skill-box-desc');
    
    if (skillBoxName) skillBoxName.textContent = heroName;
    if (skillBoxSub) skillBoxSub.textContent = `ขุนพลฝ่าย: ${roleLabel}`;
    if (skillBoxDesc) skillBoxDesc.innerHTML = skillDesc.replace(/\n/g, '<br>');
  }

  function renderHand() {
    handCards.innerHTML = '';
    const me = gameState.players[myPlayerId];
    if (!me || !me.hand) return;

    handCount.textContent = `${me.hand.length} ใบ`;

    me.hand.forEach(c => {
      const cardDiv = document.createElement('div');
      
      const dictInfo = CARD_DICT[c.name] || { name: c.name, desc: '', icon: '🃏', theme: 'card-default' };
      cardDiv.className = 'card-v2';
      
      const isLobbyOrPlay = !isDiscardPhase() && isMyTurn() && gameState.currentPhase === 'PLAY' && (
        (hasCharacter(me.character, 'SUN_QUAN') && !me.skillResignationUsed) ||
        (hasCharacter(me.character, 'LIU_BEI')) ||
        (hasCharacter(me.character, 'DIAO_CHAN') && !me.skillDiaoChanUsed) ||
        (hasCharacter(me.character, 'ZHOU_YU') && !me.skillZhouYuUsed)
      );
      if (isDiscardPhase() || isLobbyOrPlay) {
        if (selectedDiscardIds.includes(c.id)) {
          cardDiv.classList.add('selected');
        }
      } else {
        if (selectedCardId === c.id) {
          cardDiv.classList.add('selected');
        }
      }

      const displayName = dictInfo.name;
      const picHtml = dictInfo.pic ? `<div class="card-image-bg" style="background-image: url('${dictInfo.pic}');"></div>` : '';
      const suitClass = (c.suit === 'HEART' || c.suit === 'DIAMOND') ? 'suit-heart' : 'suit-spade';
      const suitSymbol = c.suit === 'HEART' ? '♥' : c.suit === 'DIAMOND' ? '♦' : c.suit === 'SPADE' ? '♠' : '♣';
      
      cardDiv.innerHTML = `
        ${picHtml}
        <div class="card-top ${suitClass}">
          <span>${c.rank}</span>
          <span class="card-suit">${suitSymbol}</span>
        </div>
        <div class="card-name-v2" style="color: ${(c.suit === 'HEART' || c.suit === 'DIAMOND') ? 'var(--hp-full)' : '#fff'};">${displayName}</div>
        <div class="card-tooltip">
          <strong>${displayName}</strong><br/>
          <span style="color:#ddd; font-size:11px;">${dictInfo.desc}</span>
        </div>
      `;

      cardDiv.addEventListener('click', () => {
        if (isDiscardPhase() || isLobbyOrPlay) {
          onToggleDiscardSelection(c.id);
        } else {
          onSelectCard(c);
        }
      });

      handCards.appendChild(cardDiv);
    });

    // Fan cards animation
    const cards = handCards.querySelectorAll('.card-v2');
    const count = cards.length;
    const maxAngle = 20;
    const spread = window.innerWidth < 920 ? 40 : 60;
    
    cards.forEach((cDiv, index) => {
      const centerOffset = index - (count - 1) / 2;
      const angle = (centerOffset / (count / 2 || 1)) * maxAngle;
      const xOffset = centerOffset * spread;
      const yOffset = Math.abs(centerOffset) * 5;
      
      cDiv.style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${angle}deg)`;
      cDiv.style.zIndex = index;
    });

    if (isDiscardPhase()) {
      discardInstruction.classList.remove('hidden');
      const needed = me.hand.length - me.hp;
      const count = needed - selectedDiscardIds.length;
      discardNeededCount.textContent = count > 0 ? count : 0;
    } else {
      discardInstruction.classList.add('hidden');
    }
  }

  function updateActionButtons() {
    const isTurn = isMyTurn();
    const phase = gameState.currentPhase;

    if (isDiscardPhase()) {
      btnPlayCard.classList.add('hidden');
      btnEndTurn.classList.add('hidden');
      btnDiscardConfirm.classList.remove('hidden');
      btnSunQuanSkill.classList.add('hidden');
      btnLiuBeiSkill.classList.add('hidden');
      btnDiaoChanSkill.classList.add('hidden');
      btnZhouYuSkill.classList.add('hidden');

      const me = gameState.players[myPlayerId];
      const needed = me.hand.length - me.hp;
      btnDiscardConfirm.disabled = selectedDiscardIds.length !== needed;
    } else {
      btnPlayCard.classList.remove('hidden');
      btnEndTurn.classList.remove('hidden');
      btnDiscardConfirm.classList.add('hidden');

      const me = gameState.players[myPlayerId];
      let isInvalidPeach = false;
      const cardIdToCheck = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
      if (cardIdToCheck && me && me.hand) {
        const card = me.hand.find(c => c.id === cardIdToCheck);
        if (card && card.name === 'PEACH' && me.hp >= me.maxHp) {
          isInvalidPeach = true;
        }
      }
      btnPlayCard.disabled = !isTurn || phase !== 'PLAY' || !cardIdToCheck || isInvalidPeach;
      btnEndTurn.disabled = !isTurn || phase !== 'PLAY';

      if (me && hasCharacter(me.character, 'SUN_QUAN') && isTurn && phase === 'PLAY' && !me.skillResignationUsed) {
        btnSunQuanSkill.classList.remove('hidden');
        btnSunQuanSkill.disabled = selectedDiscardIds.length === 0;
      } else {
        btnSunQuanSkill.classList.add('hidden');
      }

      if (me && hasCharacter(me.character, 'LIU_BEI') && isTurn && phase === 'PLAY') {
        btnLiuBeiSkill.classList.remove('hidden');
        btnLiuBeiSkill.disabled = selectedDiscardIds.length === 0;
      } else {
        btnLiuBeiSkill.classList.add('hidden');
      }

      if (me && hasCharacter(me.character, 'DIAO_CHAN') && isTurn && phase === 'PLAY' && !me.skillDiaoChanUsed) {
        btnDiaoChanSkill.classList.remove('hidden');
        btnDiaoChanSkill.disabled = selectedDiscardIds.length !== 1;
      } else {
        btnDiaoChanSkill.classList.add('hidden');
      }

      if (me && hasCharacter(me.character, 'ZHOU_YU') && isTurn && phase === 'PLAY' && !me.skillZhouYuUsed) {
        btnZhouYuSkill.classList.remove('hidden');
        btnZhouYuSkill.disabled = selectedDiscardIds.length !== 1;
      } else {
        btnZhouYuSkill.classList.add('hidden');
      }
    }

    const me = gameState.players[myPlayerId];
    if (btnPreviewCard) btnPreviewCard.classList.add('hidden');
    const actualCardId = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
    if (actualCardId && me && me.hand) {
      const card = me.hand.find(c => c.id === actualCardId);
      if (card && CARD_IMAGES[card.name]) {
        if (btnPreviewCard) btnPreviewCard.classList.remove('hidden');
      }
    } else {
      if (btnPreviewCard) btnPreviewCard.classList.add('hidden');
    }

    if (awaitingTarget) {
      targetHint.classList.remove('hidden');
    } else {
      targetHint.classList.add('hidden');
    }
  }

  // --- ACTIONS & CARD CLICKS ---

  function onSelectCard(card) {
    if (!isMyTurn() || gameState.pendingAction) return;

    const me = gameState.players[myPlayerId];
    const isLobbyOrPlay = !isDiscardPhase() && isMyTurn() && gameState.currentPhase === 'PLAY' && (
      (hasCharacter(me.character, 'SUN_QUAN') && !me.skillResignationUsed) ||
      (hasCharacter(me.character, 'LIU_BEI')) ||
      (hasCharacter(me.character, 'DIAO_CHAN') && !me.skillDiaoChanUsed) ||
      (hasCharacter(me.character, 'ZHOU_YU') && !me.skillZhouYuUsed)
    );

    if (isLobbyOrPlay) {
      const idx = selectedDiscardIds.indexOf(card.id);
      if (idx !== -1) {
        selectedDiscardIds.splice(idx, 1);
      } else {
        selectedDiscardIds.push(card.id);
      }
      selectedCardId = null;
    } else {
      if (selectedCardId === card.id) {
        selectedCardId = null;
        awaitingTarget = false;
      } else {
        selectedCardId = card.id;
        awaitingTarget = false;
      }
    }

    renderHand();
    renderOpponents();
    updateActionButtons();
  }

  function onToggleDiscardSelection(cardId) {
    const idx = selectedDiscardIds.indexOf(cardId);
    if (idx !== -1) {
      selectedDiscardIds.splice(idx, 1);
    } else {
      selectedDiscardIds.push(cardId);
    }
    renderHand();
    updateActionButtons();
  }

  btnDiscardConfirm.addEventListener('click', () => {
    if (!myRoomId || selectedDiscardIds.length === 0) return;
    socket.emit('discard_cards', { roomId: myRoomId, cardIds: selectedDiscardIds });
    selectedDiscardIds = [];
  });

  function clearSelection() {
    selectedCardId = null;
    selectedDiscardIds = [];
    awaitingTarget = false;
    currentLobbyAction = null;
    targetHint.classList.add('hidden');
    renderHand();
    renderOpponents();
    updateActionButtons();
  }

  function onSelectTarget(targetPlayerId) {
    if (currentLobbyAction === 'LIU_BEI_SKILL') {
      if (selectedDiscardIds.length === 0) return;
      socket.emit('use_liu_bei_skill', {
        roomId: myRoomId,
        targetPlayerId: targetPlayerId,
        cardIds: selectedDiscardIds
      });
      clearSelection();
      selectedDiscardIds = [];
      return;
    }
    
    if (currentLobbyAction === 'DIAO_CHAN_SKILL') {
      if (selectedDiscardIds.length !== 1) return;
      socket.emit('use_diao_chan_skill', {
        roomId: myRoomId,
        targetPlayerId: targetPlayerId,
        cardId: selectedDiscardIds[0]
      });
      clearSelection();
      selectedDiscardIds = [];
      return;
    }

    if (currentLobbyAction === 'ZHOU_YU_SKILL') {
      if (selectedDiscardIds.length !== 1) return;
      socket.emit('use_zhou_yu_skill', {
        roomId: myRoomId,
        targetPlayerId: targetPlayerId,
        cardId: selectedDiscardIds[0]
      });
      clearSelection();
      selectedDiscardIds = [];
      return;
    }

    const cardIdToPlay = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
    if (!cardIdToPlay || !awaitingTarget) return;

    const me = gameState.players[myPlayerId];
    const card = me.hand.find(c => c.id === cardIdToPlay);
    
    let playAs = null;
    if (hasCharacter(me.character, 'GUAN_YU') && (card.suit === 'HEART' || card.suit === 'DIAMOND')) {
      playAs = 'SLASH';
    } else if (hasCharacter(me.character, 'ZHAO_YUN') && card.name === 'DODGE') {
      playAs = 'SLASH';
    }

    const effectiveName = playAs || card.name;
    const distance = calculateDistance(gameState, myPlayerId, targetPlayerId);
    let maxRange = 999;
    
    if (effectiveName === 'SLASH') {
      maxRange = me.equipment && me.equipment.weapon ? me.equipment.weapon.range : 1;
    } else if (effectiveName === 'STEAL') {
      maxRange = 1; 
    } else if (effectiveName === 'SABOTAGE' || effectiveName === 'DUEL') {
      maxRange = 999;
    }
    
    // Draw SVG/CSS line animation
    const isValidTarget = distance <= maxRange;
    drawTargetLine(myPlayerId, targetPlayerId, isValidTarget);

    if (!isValidTarget) {
      showToast('Target out of range!', true);
      return;
    }

    if (card.name === 'STEAL' || card.name === 'SABOTAGE') {
      const targetPlayer = gameState.players[targetPlayerId];
      const hasWeapon = targetPlayer.equipment && targetPlayer.equipment.weapon;
      const hasDefHorse = targetPlayer.equipment && targetPlayer.equipment.defensiveHorse;
      const hasOffHorse = targetPlayer.equipment && targetPlayer.equipment.offensiveHorse;
      const hasArmor = targetPlayer.equipment && targetPlayer.equipment.armor;
      
      if (hasWeapon || hasDefHorse || hasOffHorse || hasArmor) {
        const stealChoiceOverlay = document.getElementById('steal-choice-overlay');
        const stealChoiceTargetName = document.getElementById('steal-choice-target-name');
        const stealChoiceOptions = document.getElementById('steal-choice-options');
        
        stealChoiceTargetName.textContent = targetPlayer.name;
        stealChoiceOptions.innerHTML = '';
        
        // Hand option (random)
        const btnHand = document.createElement('button');
        btnHand.className = 'btn-dodge';
        btnHand.style.width = '100%';
        btnHand.textContent = '🃏 การ์ดบนมือ (สุ่ม)';
        btnHand.addEventListener('click', () => {
          socket.emit('use_card', {
            roomId: myRoomId,
            cardId: cardIdToPlay,
            targetPlayerId: targetPlayerId,
            targetZone: 'HAND'
          });
          stealChoiceOverlay.classList.add('hidden');
          clearSelection();
        });
        stealChoiceOptions.appendChild(btnHand);
        
        // Weapon option
        if (hasWeapon) {
          const btnWeapon = document.createElement('button');
          btnWeapon.className = 'btn-play';
          btnWeapon.style.width = '100%';
          btnWeapon.style.background = 'var(--accent-gold)';
          btnWeapon.style.color = '#000';
          btnWeapon.textContent = `🗡️ อาวุธ [${targetPlayer.equipment.weapon.name}]`;
          btnWeapon.addEventListener('click', () => {
            socket.emit('use_card', {
              roomId: myRoomId,
              cardId: cardIdToPlay,
              targetPlayerId: targetPlayerId,
              targetZone: 'WEAPON'
            });
            stealChoiceOverlay.classList.add('hidden');
            clearSelection();
          });
          stealChoiceOptions.appendChild(btnWeapon);
        }
        
        // defensive horse option
        if (hasDefHorse) {
          const btnDefHorse = document.createElement('button');
          btnDefHorse.className = 'btn-back';
          btnDefHorse.style.width = '100%';
          btnDefHorse.textContent = `🛡️ ม้าป้องกัน (ม้าหมอบ)`;
          btnDefHorse.addEventListener('click', () => {
            socket.emit('use_card', {
              roomId: myRoomId,
              cardId: cardIdToPlay,
              targetPlayerId: targetPlayerId,
              targetZone: 'DEF_HORSE'
            });
            stealChoiceOverlay.classList.add('hidden');
            clearSelection();
          });
          stealChoiceOptions.appendChild(btnDefHorse);
        }
        
        // offensive horse option
        if (hasOffHorse) {
          const btnOffHorse = document.createElement('button');
          btnOffHorse.className = 'btn-back';
          btnOffHorse.style.width = '100%';
          btnOffHorse.style.background = 'var(--accent-gold)';
          btnOffHorse.style.color = '#000';
          btnOffHorse.textContent = `🐎 ม้าบุก (ม้าศึก)`;
          btnOffHorse.addEventListener('click', () => {
            socket.emit('use_card', {
              roomId: myRoomId,
              cardId: cardIdToPlay,
              targetPlayerId: targetPlayerId,
              targetZone: 'OFF_HORSE'
            });
            stealChoiceOverlay.classList.add('hidden');
            clearSelection();
          });
          stealChoiceOptions.appendChild(btnOffHorse);
        }
        // armor option
        if (hasArmor) {
          const btnArmor = document.createElement('button');
          btnArmor.className = 'btn-back';
          btnArmor.style.width = '100%';
          btnArmor.textContent = `🛡️ เกราะ [${targetPlayer.equipment.armor.name}]`;
          btnArmor.addEventListener('click', () => {
            socket.emit('use_card', {
              roomId: myRoomId,
              cardId: cardIdToPlay,
              targetPlayerId: targetPlayerId,
              targetZone: 'ARMOR'
            });
            stealChoiceOverlay.classList.add('hidden');
            clearSelection();
          });
          stealChoiceOptions.appendChild(btnArmor);
        }
        // Cancel option
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn-take-damage';
        btnCancel.style.width = '100%';
        btnCancel.textContent = '❌ ยกเลิก';
        btnCancel.addEventListener('click', () => {
          stealChoiceOverlay.classList.add('hidden');
          clearSelection();
        });
        stealChoiceOptions.appendChild(btnCancel);
        
        stealChoiceOverlay.classList.remove('hidden');
        return;
      }
    }

    socket.emit('use_card', {
      roomId: myRoomId,
      cardId: cardIdToPlay,
      targetPlayerId: targetPlayerId,
      playAs: playAs,
      targetZone: 'HAND'
    });

    addLog(`ใช้การ์ด ${card?.name || '???'} โจมตี ${gameState.players[targetPlayerId]?.name || targetPlayerId}`, 'attack');

    clearSelection();
  }

  btnPlayCard.addEventListener('click', () => {
    const cardIdToPlay = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
    if (!cardIdToPlay || !isMyTurn()) return;

    const me = gameState.players[myPlayerId];
    const card = me.hand.find(c => c.id === cardIdToPlay);
    if (!card) return;

    const isGuanYuSlash = hasCharacter(me.character, 'GUAN_YU') && (card.suit === 'HEART' || card.suit === 'DIAMOND');
    const isZhaoYunSlash = hasCharacter(me.character, 'ZHAO_YUN') && card.name === 'DODGE';
    const isEffectiveSlash = card.name === 'SLASH' || isGuanYuSlash || isZhaoYunSlash;

    if (isEffectiveSlash || card.name === 'STEAL' || card.name === 'SABOTAGE' || card.name === 'DUEL' || card.name === 'INDULGENCE' || card.name === 'STARVATION') {
      awaitingTarget = true;
      let text = '🎯 เลือกเป้าหมาย';
      if (isEffectiveSlash) text = '🎯 เลือกเป้าหมายที่ต้องการโจมตีจากผู้เล่นด้านบน';
      else if (card.name === 'STEAL') text = '🎯 เลือกเป้าหมายที่ต้องการขโมยการ์ดจากผู้เล่นด้านบน (ระยะ 1)';
      else if (card.name === 'SABOTAGE') text = '🎯 เลือกเป้าหมายที่ต้องการทำลายการ์ด';
      else if (card.name === 'DUEL') text = '🎯 เลือกเป้าหมายที่ต้องการ DUEL (ประลองกำลัง)';
      
      targetHintText.textContent = text;
      renderOpponents();
      updateActionButtons();
      return;
    }

    socket.emit('use_card', {
      roomId: myRoomId,
      cardId: cardIdToPlay,
      targetPlayerId: myPlayerId
    });
    
    clearSelection();
    awaitingTarget = false;
    renderHand();
    updateActionButtons();
  });

  btnEndTurn.addEventListener('click', () => {
    socket.emit('end_turn', { roomId: myRoomId });
  });

  if (btnPreviewCard) {
    btnPreviewCard.addEventListener('click', () => {
      const me = gameState.players[myPlayerId];
      const actualCardId = selectedCardId || (selectedDiscardIds.length === 1 ? selectedDiscardIds[0] : null);
      if (!actualCardId || !me || !me.hand) return;
      const card = me.hand.find(c => c.id === actualCardId);
      if (!card || !CARD_IMAGES[card.name]) return;


    previewCardName.textContent = card.name;
    previewCardImg.src = CARD_IMAGES[card.name];
    cardPreviewModal.classList.remove('hidden');
    });
  }

  btnClosePreview.addEventListener('click', () => {
    cardPreviewModal.classList.add('hidden');
  });

  // Luo River events
  btnLuoTrigger.addEventListener('click', () => {
    socket.emit('trigger_luo_river', { roomId: myRoomId });
  });

  btnLuoSkip.addEventListener('click', () => {
    socket.emit('skip_luo_river', { roomId: myRoomId });
  });

  // Dying events
  btnDyingUsePeach.addEventListener('click', () => {
    socket.emit('use_peach_dying', { roomId: myRoomId, usePeach: true });
  });

  btnDyingPass.addEventListener('click', () => {
    socket.emit('use_peach_dying', { roomId: myRoomId, usePeach: false });
  });

  // Sun Quan skill event
  btnSunQuanSkill.addEventListener('click', () => {
    if (selectedDiscardIds.length === 0) return;
    socket.emit('use_sun_quan_skill', { roomId: myRoomId, cardIds: selectedDiscardIds });
    selectedDiscardIds = [];
  });

  // Liu Bei skill event
  btnLiuBeiSkill.addEventListener('click', () => {
    if (selectedDiscardIds.length === 0) return;
    awaitingTarget = true;
    targetHint.classList.remove('hidden');
    targetHintText.textContent = '💝 เลือกผู้เล่นที่ต้องการมอบการ์ดให้';
    currentLobbyAction = 'LIU_BEI_SKILL';
    renderOpponents();
    updateActionButtons();
  });

  // Diao Chan skill event
  btnDiaoChanSkill.addEventListener('click', () => {
    if (selectedDiscardIds.length !== 1) return;
    awaitingTarget = true;
    targetHint.classList.remove('hidden');
    targetHintText.textContent = '🌸 เลือกคู่ต่อสู้ที่ต้องการใช้บ่วงเสน่หา';
    currentLobbyAction = 'DIAO_CHAN_SKILL';
    renderOpponents();
    updateActionButtons();
  });

  // Zhou Yu skill event
  btnZhouYuSkill.addEventListener('click', () => {
    if (selectedDiscardIds.length !== 1) return;
    awaitingTarget = true;
    targetHint.classList.remove('hidden');
    targetHintText.textContent = '🔥 เลือกคู่ต่อสู้ที่ต้องการให้บ่มเพลิง';
    currentLobbyAction = 'ZHOU_YU_SKILL';
    renderOpponents();
    updateActionButtons();
  });

  // --- REACTION / DODGE OVERLAYS ---

  function renderPendingAction() {
    const pending = gameState.pendingAction;
    
    // 1. Dodge / Reaction overlay
    const isNegatePending = pending && pending.type === 'WAITING_FOR_NEGATE';
    const isReactionPending = pending && (
      isNegatePending ||
      ((pending.type === 'WAITING_FOR_DODGE' || pending.type === 'DIAO_CHAN_SEDUCTION' || pending.type === 'ZHOU_YU_DISCORD') && pending.targetPlayerId === myPlayerId) ||
      (pending.type === 'WAITING_FOR_SLASH_DUEL' && pending.currentPlayerToSlash === myPlayerId) ||
      (pending.type === 'WAITING_FOR_AOE' && pending.targets && pending.targets[pending.currentTargetIndex] === myPlayerId)
    );
    
    if (isReactionPending) {
      pendingOverlay.classList.remove('hidden');
      btnDodge.classList.remove('hidden');
      btnTakeDamage.classList.remove('hidden');
      
      const attacker = gameState.players[pending.sourcePlayerId];
      if (isNegatePending) {
        if (pending.sourcePlayerId === myPlayerId) {
          pendingAttackerName.textContent = `รอผู้เล่นอื่นใช้ NEGATE ตอบสนองการ์ดของคุณ...`;
          btnDodge.classList.add('hidden');
          btnTakeDamage.classList.add('hidden');
        } else {
          pendingAttackerName.textContent = `มีคนใช้การ์ด คุณต้องการใช้ NEGATE เพื่อยกเลิกหรือไม่?`;
          btnDodge.textContent = '🃏 ใช้การ์ด NEGATE';
          btnTakeDamage.textContent = '⏭️ ผ่าน (Pass)';
        }
      } else if (pending.type === 'DIAO_CHAN_SEDUCTION') {
        pendingAttackerName.textContent = `บ่วงเสน่หา (🌸 สกิลของ ${attacker ? attacker.name : 'เตียวเสี้ยน'})`;
        btnDodge.textContent = '🗡️ ทิ้งการ์ด SLASH เพื่อสยบเสน่หา';
        btnTakeDamage.textContent = '💔 ยอมรับความเสียหาย (1 HP)';
      } else if (pending.type === 'ZHOU_YU_DISCORD') {
        const colorName = pending.requiredColor === 'RED' ? 'แดง (❤️/♦️)' : 'ดำ (♠️/♣️)';
        pendingAttackerName.textContent = `บ่มเพลิง (🔥 สกิลของ ${attacker ? attacker.name : 'จิวยี่'})`;
        btnDodge.textContent = `🃏 ทิ้งการ์ดสี ${colorName} 1 ใบ`;
        btnTakeDamage.textContent = '💔 ยอมรับความเสียหาย (1 HP)';
      } else if (pending.type === 'WAITING_FOR_SLASH_DUEL') {
        const opponentId = myPlayerId === pending.sourcePlayerId ? pending.targetPlayerId : pending.sourcePlayerId;
        const opponent = gameState.players[opponentId];
        pendingAttackerName.textContent = `กำลังดวล (DUEL) กับ ${opponent ? opponent.name : 'ศัตรู'}`;
        btnDodge.textContent = 'สู้กลับด้วย SLASH 1 ใบ';
        btnTakeDamage.textContent = 'ยอมแพ้และรับความเสียหาย (1 HP)';
      } else if (pending.type === 'WAITING_FOR_AOE') {
        const aoeName = pending.aoeType === 'BARBARIAN_INVASION' ? 'คนเถื่อนบุกรุก' : 'ธนูหมื่นดอก';
        pendingAttackerName.textContent = `รับมือการโจมตีหมู่: ${aoeName} (จาก ${attacker ? attacker.name : 'ศัตรู'})`;
        if (pending.aoeType === 'BARBARIAN_INVASION') {
          btnDodge.textContent = 'ป้องกันด้วย SLASH 1 ใบ';
        } else {
          btnDodge.textContent = 'หลบด้วย DODGE 1 ใบ';
        }
        btnTakeDamage.textContent = 'ยอมรับความเสียหาย (1 HP)';
      } else {
        pendingAttackerName.textContent = attacker ? attacker.name : pending.sourcePlayerId;
        const dodgeText = (pending.dodgeNeeded && pending.dodgeNeeded > 1) ? `ทิ้งการ์ด DODGE (${pending.dodgeNeeded} ใบ)` : 'ทิ้งการ์ด DODGE เพื่อหลบ';
        btnDodge.textContent = `🛡️ ${dodgeText}`;
        btnTakeDamage.textContent = '💔 ยอมรับความเสียหาย';
      }
      
      const secondsLeft = Math.max(0, Math.ceil((pending.timeoutAt - Date.now()) / 1000));
      countdownSeconds.textContent = secondsLeft;
      countdownBarFill.style.width = '100%';
      
      if (countdownInterval) clearInterval(countdownInterval);

      const start = Date.now();
      const duration = pending.timeoutAt - start;

      countdownInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        const ratio = Math.max(0, 1 - (elapsed / duration));
        countdownBarFill.style.width = `${ratio * 100}%`;
        
        const sec = Math.max(0, Math.ceil((pending.timeoutAt - Date.now()) / 1000));
        countdownSeconds.textContent = sec;

        if (ratio <= 0) {
          clearInterval(countdownInterval);
          pendingOverlay.classList.add('hidden');
        }
      }, 100);

    } else {
      pendingOverlay.classList.add('hidden');
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }

    // 2. Luo River Overlay
    if (pending && pending.type === 'LUO_RIVER' && pending.targetPlayerId === myPlayerId) {
      luoRiverOverlay.classList.remove('hidden');
    } else {
      luoRiverOverlay.classList.add('hidden');
    }

    // 3. Dying Overlay
    if (pending && pending.type === 'DYING') {
      dyingOverlay.classList.remove('hidden');
      
      const dyingPlayer = gameState.players[pending.targetPlayerId];
      const askerId = gameState.turnOrder[pending.currentAskerIdx];
      const asker = gameState.players[askerId];
      
      dyingPlayerName.textContent = dyingPlayer ? dyingPlayer.name : pending.targetPlayerId;
      dyingAskerName.textContent = asker ? asker.name : askerId;
      
      if (myPlayerId === askerId) {
        dyingHelpActions.classList.remove('hidden');
        dyingWaitMessage.classList.add('hidden');
        
        const me = gameState.players[myPlayerId];
        const hasPeach = me && me.hand && me.hand.some(c => c.name === 'PEACH');
        btnDyingUsePeach.disabled = !hasPeach;
      } else {
        dyingHelpActions.classList.add('hidden');
        dyingWaitMessage.classList.remove('hidden');
        dyingWaitMessage.textContent = `กำลังรอให้ ${asker ? asker.name : askerId} ตัดสินใจช่วยเหลือ...`;
      }
    } else {
      dyingOverlay.classList.add('hidden');
    }
  }

  btnDodge.addEventListener('click', () => {
    const me = gameState.players[myPlayerId];
    if (!me || !me.hand) return;

    const pending = gameState.pendingAction;
    if (!pending) return;

    if (pending.type === 'WAITING_FOR_NEGATE') {
      const negateCard = me.hand.find(c => c.name === 'NEGATE');
      if (!negateCard) {
        showToast('คุณไม่มีการ์ด NEGATE!', 'error');
        return;
      }
      socket.emit('play_negate', { roomId: myRoomId, cardId: negateCard.id });
      pendingOverlay.classList.add('hidden');
      return;
    }

    if (pending.type === 'DIAO_CHAN_SEDUCTION') {
      let slashCard = me.hand.find(c => c.name === 'SLASH');
      if (!slashCard && hasCharacter(me.character, 'ZHAO_YUN')) {
        slashCard = me.hand.find(c => c.name === 'DODGE');
      }
      
      if (!slashCard) {
        showToast('คุณไม่มีการ์ด SLASH หรือการ์ดที่สามารถใช้แทน SLASH ได้!', 'error');
        return;
      }
      
      socket.emit('resolve_pending', {
        roomId: myRoomId,
        action: 'DODGE',
        cardId: slashCard.id,
        playAs: hasCharacter(me.character, 'ZHAO_YUN') && slashCard.name === 'DODGE' ? 'SLASH' : null
      });
      pendingOverlay.classList.add('hidden');
      return;
    }

    if (pending.type === 'ZHOU_YU_DISCORD') {
      const matchingCard = me.hand.find(c => {
        const color = (c.suit === 'HEART' || c.suit === 'DIAMOND') ? 'RED' : 'BLACK';
        return color === pending.requiredColor;
      });
      
      if (!matchingCard) {
        showToast(`คุณไม่มีการ์ดสี ${pending.requiredColor === 'RED' ? 'แดง' : 'ดำ'} บนมือเพื่อสยบบ่มเพลิง!`, 'error');
        return;
      }
      
      socket.emit('resolve_pending', {
        roomId: myRoomId,
        action: 'DODGE',
        cardId: matchingCard.id
      });
      pendingOverlay.classList.add('hidden');
      return;
    }

    let dodgeCard = me.hand.find(c => c.name === 'DODGE');
    let playAs = null;

    if (!dodgeCard && (hasCharacter(me.character, 'ZHEN_JI') || hasCharacter(me.character, 'LADY_ZHEN'))) {
      dodgeCard = me.hand.find(c => c.suit === 'SPADE' || c.suit === 'CLUB');
    } else if (!dodgeCard && hasCharacter(me.character, 'ZHAO_YUN')) {
      dodgeCard = me.hand.find(c => c.name === 'SLASH');
      if (dodgeCard) playAs = 'DODGE';
    }

    if (!dodgeCard) {
      showToast('คุณไม่มีการ์ดที่จะใช้เพื่อหลบหลีกได้!', 'error');
      return;
    }

    socket.emit('resolve_pending', {
      roomId: myRoomId,
      action: 'DODGE',
      cardId: dodgeCard.id,
      playAs: playAs
    });
    
    pendingOverlay.classList.add('hidden');
  });

  btnTakeDamage.addEventListener('click', () => {
    const pending = gameState.pendingAction;
    if (pending && pending.type === 'WAITING_FOR_NEGATE') {
      socket.emit('pass_negate', { roomId: myRoomId });
      pendingOverlay.classList.add('hidden');
      return;
    }
    
    socket.emit('resolve_pending', {
      roomId: myRoomId,
      action: 'TAKE_DAMAGE'
    });
    pendingOverlay.classList.add('hidden');
  });

  // --- INFO MODAL CONTROLLER ---
  window.showHeroInfo = function(characterId) {
    const hero = wtkHeroes.find(h => {
      const nameUpper = (h.title || h.name).toUpperCase().replace(/[^A-Z0-9]/g, '_');
      return nameUpper === characterId;
    });

    if (!hero) return;

    modalHeroName.textContent = hero.title || hero.name;
    modalHeroSub.textContent = hero.sub || 'General of the Three Kingdoms';
    modalHeroAvatar.style.backgroundImage = `url('${hero.pic || 'https://static.wtkgames.com/icons/card_mask.png'}')`;
    
    const skillText = HERO_SKILLS[characterId] || '🎭 **General Skill**: ความสามารถติดตัวตามกองทัพขุนพลขอบเขตสามก๊ก';
    modalHeroSkill.innerHTML = skillText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Description text
    const descContent = hero.desc ? 
      `${hero.desc.content1 || ''}\n\n${hero.desc.content2 || ''}\n\n${hero.desc.content3 || ''}` : 
      'ไม่มีข้อมูลประวัติย่อของขุนพลคนนี้บนฐานข้อมูลเว็บบอร์ด';
    
    modalHeroDesc.textContent = descContent;
    heroInfoModal.classList.remove('hidden');
  };

  btnCloseHeroModal.addEventListener('click', () => {
    heroInfoModal.classList.add('hidden');
  });

  // --- SYSTEM LOGS DETECTOR ---
  function detectEvents(prev, next) {
    if (!prev || !next) return;

    Object.keys(next.players).forEach(pId => {
      const prevP = prev.players[pId];
      const nextP = next.players[pId];

      if (prevP && nextP) {
        if (nextP.hp < prevP.hp) {
          // Handled by explicit damage_log event from server
        } else if (nextP.hp > prevP.hp) {
          addLog(`💖 ${nextP.name} ฟื้นฟูพลังชีวิต 1 หน่วย (พลังชีวิต: ${nextP.hp}/${nextP.maxHp})`, 'heal');
        }

        if (prevP.isAlive && !nextP.isAlive) {
          addLog(`☠️ ${nextP.name} เสียชีวิตลงแล้วในการต่อสู้!`, 'error');
          showToast(`${nextP.name} ตกรอบการรบ!`, 'error');
        }

        if (!prevP.equipment?.weapon && nextP.equipment?.weapon) {
          //addLog(`🗡️ ${nextP.name} สวมใส่อาวุธ ${nextP.equipment.weapon.name}`, 'system');
          showSystemAlert(`🗡️ ${nextP.name} สวมใส่อาวุธ: ${nextP.equipment.weapon.name}`, 3000);
        }
        if (!prevP.equipment?.armor && nextP.equipment?.armor) {
          //addLog(`🛡️ ${nextP.name} สวมใส่เกราะ ${nextP.equipment.armor.name}`, 'system');
          showSystemAlert(`🛡️ ${nextP.name} สวมใส่เกราะ: ${nextP.equipment.armor.name}`, 3000);
        }
        if (!prevP.equipment?.defensiveHorse && nextP.equipment?.defensiveHorse) {
          //addLog(`🐴 ${nextP.name} สวมใส่ม้าหมอบ ${nextP.equipment.defensiveHorse.name}`, 'system');
          showSystemAlert(`🐴 ${nextP.name} สวมใส่ม้าหมอบ: ${nextP.equipment.defensiveHorse.name}`, 3000);
        }
        if (!prevP.equipment?.offensiveHorse && nextP.equipment?.offensiveHorse) {
          //addLog(`🏇 ${nextP.name} สวมใส่ม้าบุก ${nextP.equipment.offensiveHorse.name}`, 'system');
          showSystemAlert(`🏇 ${nextP.name} สวมใส่ม้าบุก: ${nextP.equipment.offensiveHorse.name}`, 3000);
        }
        
        // Draw card animation
        const prevHandCount = prevP.handCount !== undefined ? prevP.handCount : (prevP.hand ? prevP.hand.length : 0);
        const nextHandCount = nextP.handCount !== undefined ? nextP.handCount : (nextP.hand ? nextP.hand.length : 0);
        if (nextHandCount > prevHandCount) {
          triggerDrawAnimation(pId, nextHandCount - prevHandCount);
        }
        
        // Evasion animation logic
        if (prev.pendingAction && 
            (prev.pendingAction.type === 'WAITING_FOR_DODGE' || (prev.pendingAction.type === 'WAITING_FOR_AOE' && prev.pendingAction.aoeType === 'ARROW_BARRAGE')) &&
            ((prev.pendingAction.type === 'WAITING_FOR_DODGE' && prev.pendingAction.targetPlayerId === pId) || 
             (prev.pendingAction.type === 'WAITING_FOR_AOE' && prev.pendingAction.targets && prev.pendingAction.targets[prev.pendingAction.currentTargetIndex] === pId)) &&
            (!next.pendingAction || next.pendingAction.targetPlayerId !== pId || next.pendingAction.type !== prev.pendingAction.type || (next.pendingAction.type === 'WAITING_FOR_AOE' && next.pendingAction.currentTargetIndex !== prev.pendingAction.currentTargetIndex)) &&
            nextP.hp >= prevP.hp && !recentlyDamaged.has(pId)) {
          const avatarEl = pId === myPlayerId ? document.getElementById('my-avatar-area') : document.getElementById(`opp-avatar-${pId}`);
          if (avatarEl) {
            const popup = document.createElement('div');
            popup.className = 'evade-popup';
            popup.textContent = 'หลบสำเร็จ!';
            avatarEl.style.position = 'relative';
            avatarEl.appendChild(popup);
            setTimeout(() => popup.remove(), 1200);
          }
        }
      }
    });

    if (prev.currentTurnPlayerId !== next.currentTurnPlayerId) {
      const nextP = next.players[next.currentTurnPlayerId];
      addLog(`== เริ่มเทิร์นใหม่ของ ${nextP?.name || next.currentTurnPlayerId} (เฟส: ${next.currentPhase}) ==`, 'system');
    }

    if (next.pendingAction && (!prev.pendingAction || prev.pendingAction.type !== next.pendingAction.type || prev.pendingAction.targetPlayerId !== next.pendingAction.targetPlayerId || prev.pendingAction.actionId !== next.pendingAction.actionId)) {
      if (next.pendingAction.type === 'WAITING_FOR_AOE') {
        const aoeName = next.pendingAction.aoeType === 'BARBARIAN_INVASION' ? 'คนเถื่อนบุกรุก!' : 'ธนูหมื่นดอก!';
        showSystemAlert(`🚨 สัญญาณเตือน: ${aoeName}`, 4000);
      } else if (next.pendingAction.type === 'WAITING_FOR_SLASH_DUEL') {
        showSystemAlert('⚔️ การดวลเริ่มต้นขึ้น!', 3000);
      }
    }
  }

  // --- LOAD WTK DATABASE ---
  let wtkCards = [];
  globalThis.CARD_NAME_MAPPING = globalThis.CARD_NAME_MAPPING || {};
  globalThis.CARD_IMAGES = globalThis.CARD_IMAGES || {};
  globalThis.CARD_DICT = globalThis.CARD_DICT || {};
  fetch('/heroes.json')
    .then(res => res.json())
    .then(heroes => {
      wtkHeroes = heroes;
    })
    .catch(err => {
      console.error("Error loading heroes database:", err);
    });

  fetch('/cards_db.json')
    .then(res => res.json())
    .then(cards => {
      wtkCards = cards;
      cards.forEach(c => {
        let englishName = (c.card_name || '').toUpperCase().replace(/\s+/g, '_');
        if (englishName === 'ATTACK') englishName = 'SLASH';
        if (englishName === 'OVERINDULGENCE') englishName = 'INDULGENCE';
        if (englishName === 'SOMETHING_OUT_OF_NOTHING') englishName = 'EX_NIHILO';
        if (englishName === 'IRON_CHAINS') englishName = 'IRON_CHAIN';
        if (englishName === 'RAINING_ARROWS') englishName = 'ARROW_BARRAGE';
        if (englishName === 'OATH_OF_THE_PEACH_GARDEN') englishName = 'PEACH_GARDEN';

        globalThis.CARD_NAME_MAPPING[englishName] = c.card_name;
        globalThis.CARD_IMAGES[englishName] = c.pic_url || c.pic || '';
        globalThis.CARD_DICT[englishName] = {
          name: c.card_name,
          desc: c.description || c.desc || '',
          icon: c.main_type === 'Basic Card' ? '🃏' : (c.main_type === 'Stratagem Card' ? '📜' : '🔧'),
          theme: c.main_type === 'Basic Card' ? 'card-default' : (c.main_type === 'Stratagem Card' ? 'card-orange' : 'card-blue'),
          pic: c.pic_url || c.pic || null
        };
      });
    })
    .catch(err => {
      console.error('Error loading cards database:', err);
    });