// 游戏配置
const config = {
    slow: { speed: 150, name: '慢速' },
    medium: { speed: 100, name: '中速' },
    fast: { speed: 50, name: '快速' }
};

// 游戏状态
let gameState = {
    snake: [],
    food: null,
    obstacles: [],
    direction: 'right',
    score: 0,
    gameLoop: null,
    isPaused: false,
    currentSpeed: config.medium.speed,
    currentDifficulty: 'medium',
    username: '',
    backgroundColor: ''
};

// 获取Canvas上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;

// 生成随机颜色（柔和的颜色）
function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
}

// 初始化游戏
function initGame() {
    // 显示用户名输入模态框
    document.getElementById('usernameModal').style.display = 'flex';
    
    // 设置随机背景色
    gameState.backgroundColor = getRandomPastelColor();
    
    // 初始化蛇的位置
    gameState.snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    
    // 生成障碍物
    gameState.obstacles = generateObstacles();
    
    // 生成食物
    generateFood();
    
    // 绑定按键事件
    document.addEventListener('keydown', handleKeyPress);
    
    // 绑定难度选择按钮
    document.getElementById('slowBtn').addEventListener('click', () => setDifficulty('slow'));
    document.getElementById('mediumBtn').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('fastBtn').addEventListener('click', () => setDifficulty('fast'));
    
    // 绑定开始游戏按钮
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    // 绑定暂停按钮
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    // 初始时禁用开始游戏按钮
    document.getElementById('startGameBtn').disabled = true;
}

// 生成障碍物
function generateObstacles() {
    const obstacles = [];
    const numObstacles = Math.floor(Math.random() * 3) + 7; // 随机生成7-9个障碍物
    
    for (let i = 0; i < numObstacles; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)),
                y: Math.floor(Math.random() * (canvas.height / gridSize)),
                width: Math.floor(Math.random() * 2) + 2, // 随机宽度2-3格
                height: Math.floor(Math.random() * 2) + 1 // 随机高度1-2格
            };
        } while (isObstacleCollision(obstacle));
        obstacles.push(obstacle);
    }
    
    return obstacles;
}

// 检查障碍物是否与其他物体碰撞
function isObstacleCollision(obstacle) {
    // 检查障碍物的每个格子
    for (let x = obstacle.x; x < obstacle.x + obstacle.width; x++) {
        for (let y = obstacle.y; y < obstacle.y + obstacle.height; y++) {
            if (x >= canvas.width / gridSize || y >= canvas.height / gridSize) {
                return true;
            }
            if (gameState.snake.some(segment => segment.x === x && segment.y === y)) {
                return true;
            }
            if (gameState.obstacles.some(obs => {
                for (let ox = obs.x; ox < obs.x + obs.width; ox++) {
                    for (let oy = obs.y; oy < obs.y + obs.height; oy++) {
                        if (ox === x && oy === y) return true;
                    }
                }
                return false;
            })) {
                return true;
            }
            if (gameState.food && gameState.food.x === x && gameState.food.y === y) {
                return true;
            }
        }
    }
    return false;
}

// 生成食物
function generateFood() {
    let food;
    do {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)),
            y: Math.floor(Math.random() * (canvas.height / gridSize))
        };
    } while (isPositionOccupied(food));
    gameState.food = food;
}

// 检查位置是否被占用
function isPositionOccupied(pos) {
    // 检查是否与蛇身重叠
    if (gameState.snake.some(segment => segment.x === pos.x && segment.y === pos.y)) {
        return true;
    }
    
    // 检查是否与障碍物重叠
    if (gameState.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y)) {
        return true;
    }
    
    // 检查是否与食物重叠
    if (gameState.food && gameState.food.x === pos.x && gameState.food.y === pos.y) {
        return true;
    }
    
    return false;
}

// 处理键盘事件
function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    
    // 处理方向键
    if (key === 'arrowup' && gameState.direction !== 'down') {
        gameState.direction = 'up';
    } else if (key === 'arrowdown' && gameState.direction !== 'up') {
        gameState.direction = 'down';
    } else if (key === 'arrowleft' && gameState.direction !== 'right') {
        gameState.direction = 'left';
    } else if (key === 'arrowright' && gameState.direction !== 'left') {
        gameState.direction = 'right';
    }
    
    // 处理暂停键（Space）
    if (event.key === ' ') {
        event.preventDefault();
        togglePause();
    }
}

// 切换暂停状态
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    // 更新暂停按钮文本
    document.getElementById('pauseBtn').textContent = gameState.isPaused ? '继续游戏' : '暂停游戏';
    if (!gameState.isPaused) {
        gameLoop();
    }
}

// 设置游戏难度
function setDifficulty(difficulty) {
    gameState.currentSpeed = config[difficulty].speed;
    gameState.currentDifficulty = difficulty;
    
    // 更新按钮状态
    document.getElementById('slowBtn').disabled = difficulty === 'slow';
    document.getElementById('mediumBtn').disabled = difficulty === 'medium';
    document.getElementById('fastBtn').disabled = difficulty === 'fast';
    
    // 切换难度时更新用户最高分和排行榜
    showUserHighScore();
    updateLeaderboard();
}

// 开始游戏
function confirmUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    if (username) {
        gameState.username = username;
        document.getElementById('usernameModal').style.display = 'none';
        // 启用开始游戏按钮
        document.getElementById('startGameBtn').disabled = false;
        // 显示用户在当前难度的最高分
        showUserHighScore();
    }
}

function startGame() {
    if (!gameState.username) return;
    gameLoop();
    // 禁用开始游戏按钮，直到游戏结束
    document.getElementById('startGameBtn').disabled = true;
}

// 游戏主循环
function gameLoop() {
    if (gameState.isPaused) return;
    
    // 移动蛇
    const head = { ...gameState.snake[0] };
    
    switch (gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查碰撞
    if (isCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新头部
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        gameState.score += 10;
        updateScore();
        generateFood();
    } else {
        gameState.snake.pop();
    }
    
    // 绘制游戏画面
    draw();
    
    // 继续游戏循环
    setTimeout(gameLoop, gameState.currentSpeed);
}

// 检查碰撞
function isCollision(head) {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= canvas.width / gridSize ||
        head.y < 0 || head.y >= canvas.height / gridSize) {
        return true;
    }
    
    // 检查自身碰撞
    if (gameState.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return true;
    }
    
    // 检查障碍物碰撞
    if (gameState.obstacles.some(obs => {
        for (let x = obs.x; x < obs.x + obs.width; x++) {
            for (let y = obs.y; y < obs.y + obs.height; y++) {
                if (x === head.x && y === head.y) return true;
            }
        }
        return false;
    })) {
        return true;
    }
    
    return false;
}

// 绘制游戏画面
function draw() {
    // 清空画布并设置背景色
    ctx.fillStyle = gameState.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    gameState.snake.forEach((segment, index) => {
        if (index === 0) {
            // 绘制蛇头（带霓虹效果）
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            
            // 绘制眼睛
            ctx.fillStyle = 'white';
            const eyeSize = 4;
            const eyeOffset = 3;
            
            // 根据方向调整眼睛位置
            switch (gameState.direction) {
                case 'right':
                    ctx.fillRect((segment.x * gridSize) + gridSize - eyeOffset - eyeSize, (segment.y * gridSize) + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect((segment.x * gridSize) + gridSize - eyeOffset - eyeSize, (segment.y * gridSize) + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case 'left':
                    ctx.fillRect((segment.x * gridSize) + eyeOffset, (segment.y * gridSize) + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect((segment.x * gridSize) + eyeOffset, (segment.y * gridSize) + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
                case 'up':
                    ctx.fillRect((segment.x * gridSize) + eyeOffset, (segment.y * gridSize) + eyeOffset, eyeSize, eyeSize);
                    ctx.fillRect((segment.x * gridSize) + gridSize - eyeOffset - eyeSize, (segment.y * gridSize) + eyeOffset, eyeSize, eyeSize);
                    break;
                case 'down':
                    ctx.fillRect((segment.x * gridSize) + eyeOffset, (segment.y * gridSize) + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    ctx.fillRect((segment.x * gridSize) + gridSize - eyeOffset - eyeSize, (segment.y * gridSize) + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    break;
            }
        } else {
            // 绘制蛇身（带霓虹效果）
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#00ffaa';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        }
    });
    
    // 绘制食物（像素化能量球）
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#f0f';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(gameState.food.x * gridSize, gameState.food.y * gridSize, gridSize, gridSize);
    
    // 绘制能量球内部纹理
    ctx.fillStyle = '#ff88ff';
    ctx.fillRect(gameState.food.x * gridSize + 4, gameState.food.y * gridSize + 4, gridSize - 8, gridSize - 8);
    
    // 绘制障碍物（带霓虹效果的像素块）
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f00';
    ctx.fillStyle = '#ff0066';
    gameState.obstacles.forEach(obstacle => {
        ctx.fillRect(
            obstacle.x * gridSize,
            obstacle.y * gridSize,
            obstacle.width * gridSize,
            obstacle.height * gridSize
        );
    });
    
    // 绘制装饰性的花草
    drawDecorations();
}

// 绘制装饰性的花草
function drawDecorations() {
    const numDecorations = 12;
    ctx.save();
    
    for (let i = 0; i < numDecorations; i++) {
        const x = (i * canvas.width / numDecorations) + Math.random() * 20;
        const y = canvas.height - 10;
        
        // 绘制像素化的电路线
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 20 - Math.random() * 20);
        ctx.stroke();
        
        // 随机添加节点
        if (Math.random() > 0.5) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f0f';
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x - 3, y - 25, 6, 6);
        }
    }
    
    ctx.restore();
}

// 更新分数显示
function showUserHighScore() {
    const highScores = JSON.parse(localStorage.getItem(`snakeHighScores_${gameState.currentDifficulty}`) || '[]');
    const userHighScore = highScores.find(score => score.username === gameState.username);
    document.getElementById('highScore').textContent = userHighScore ? userHighScore.score : 0;
}

function updateScore() {
    document.getElementById('currentScore').textContent = gameState.score;
    
    // 更新最高分
    const highScores = JSON.parse(localStorage.getItem(`snakeHighScores_${gameState.currentDifficulty}`) || '[]');
    const userHighScore = highScores.find(score => score.username === gameState.username);
    const currentHighScore = userHighScore ? userHighScore.score : 0;
    document.getElementById('highScore').textContent = Math.max(currentHighScore, gameState.score);
    
    // 更新排行榜
    updateLeaderboard();
}

// 更新排行榜
function updateLeaderboard() {
    const highScores = JSON.parse(localStorage.getItem(`snakeHighScores_${gameState.currentDifficulty}`) || '[]');
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';
    
    // 按分数排序并只保留前5名
    highScores.sort((a, b) => b.score - a.score);
    highScores.slice(0, 5).forEach((score, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.textContent = `${index + 1}. ${score.username}: ${score.score}${index === 0 ? ' 👑' : ''}`;
        leaderboardElement.appendChild(scoreItem);
    });
}

// 游戏结束
function gameOver() {
    // 保存分数
    const highScores = JSON.parse(localStorage.getItem(`snakeHighScores_${gameState.currentDifficulty}`) || '[]');
    highScores.push({
        username: gameState.username,
        score: gameState.score
    });
    
    // 只保留每个用户的最高分
    const uniqueScores = [];
    const seen = new Set();
    highScores.sort((a, b) => b.score - a.score).forEach(score => {
        if (!seen.has(score.username)) {
            seen.add(score.username);
            uniqueScores.push(score);
        }
    });
    
    localStorage.setItem(`snakeHighScores_${gameState.currentDifficulty}`, JSON.stringify(uniqueScores));
    updateLeaderboard();
    
    // 重置游戏状态，但保留用户名
    const username = gameState.username;
    gameState.snake = [];
    gameState.score = 0;
    gameState.direction = 'right';
    gameState.isPaused = false;
    
    // 重新初始化游戏，但不显示用户名输入框
    gameState.username = username;
    gameState.backgroundColor = getRandomPastelColor();
    gameState.snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    gameState.obstacles = generateObstacles();
    generateFood();
    
    // 重置按钮状态
    document.getElementById('slowBtn').disabled = false;
    document.getElementById('mediumBtn').disabled = false;
    document.getElementById('fastBtn').disabled = false;
    document.getElementById('startGameBtn').disabled = false;
    
    // 绘制初始画面
    draw();
}

// 初始化游戏
initGame();