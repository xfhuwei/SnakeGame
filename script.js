document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    
    // 游戏配置
    const gridSize = 20; // 网格大小
    const tileCount = canvas.width / gridSize; // 网格数量
    
    // 游戏状态
    let gameRunning = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let aiMode = false; // AI模式标志
    
    // 蛇的初始位置和速度
    let snake = [
        {x: 10, y: 10}
    ];
    let velocityX = 0;
    let velocityY = 0;
    let nextVelocityX = 0;
    let nextVelocityY = 0;
    
    // 食物位置
    let food = {
        x: 5,
        y: 5
    };
    
    // 游戏循环
    let gameInterval;
    let gameSpeed = 100; // 游戏速度（毫秒），默认值
    
    // 音效
    let eatSound;
    let gameOverSound;
    
    // 初始化游戏
    function initGame() {
        // 更新分数显示
        document.getElementById('score').textContent = score;
        document.getElementById('high-score').textContent = highScore;
        
        // 初始化速度控制滑块
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        // 设置初始速度值显示
        updateSpeedText(speedSlider.value);
        
        // 添加滑块事件监听
        speedSlider.addEventListener('input', function() {
            updateSpeed(this.value);
        });
        
        // 尝试加载音效
        try {
            eatSound = new Audio('eat.mp3');
            gameOverSound = new Audio('gameover.mp3');
        } catch (e) {
            console.log('音效加载失败，游戏将继续但没有音效');
        }
        
        // 添加键盘事件监听
        document.addEventListener('keydown', handleKeyPress);
        
        // 添加按钮事件监听
        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('pause-btn').addEventListener('click', pauseGame);
        document.getElementById('restart-btn').addEventListener('click', restartGame);
        document.getElementById('ai-btn').addEventListener('click', toggleAIMode);
        
        // 移动端控制按钮
        document.getElementById('up-btn').addEventListener('click', () => changeDirection(0, -1));
        document.getElementById('down-btn').addEventListener('click', () => changeDirection(0, 1));
        document.getElementById('left-btn').addEventListener('click', () => changeDirection(-1, 0));
        document.getElementById('right-btn').addEventListener('click', () => changeDirection(1, 0));
        
        // 绘制初始游戏界面
        drawGame();
    }
    
    // 开始游戏
    function startGame() {
        if (!gameRunning && !gameOver) {
            gameRunning = true;
            gameInterval = setInterval(updateGame, gameSpeed);
        }
    }
    
    // 更新游戏速度
    function updateSpeed(value) {
        // 更新速度值
        gameSpeed = parseInt(value);
        
        // 更新速度文本显示
        updateSpeedText(value);
        
        // 如果游戏正在运行，重新启动游戏循环以应用新速度
        if (gameRunning) {
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, gameSpeed);
        }
    }
    
    // 更新速度文本显示
    function updateSpeedText(value) {
        const speedValue = document.getElementById('speed-value');
        const speed = parseInt(value);
        
        if (speed < 70) {
            speedValue.textContent = '快速';
        } else if (speed < 90) {
            speedValue.textContent = '较快';
        } else if (speed < 110) {
            speedValue.textContent = '正常';
        } else if (speed < 150) {
            speedValue.textContent = '较慢';
        } else {
            speedValue.textContent = '慢速';
        }
    }
    
    // 暂停游戏
    function pauseGame() {
        if (gameRunning) {
            gameRunning = false;
            clearInterval(gameInterval);
        }
    }
    
    // 重新开始游戏
    function restartGame() {
        // 重置游戏状态
        clearInterval(gameInterval);
        gameRunning = false;
        gameOver = false;
        score = 0;
        document.getElementById('score').textContent = score;
        
        // 如果在AI模式下，重置AI按钮状态
        if (aiMode) {
            aiMode = false;
            document.getElementById('ai-btn').textContent = 'AI模式';
        }
        
        // 重置蛇的位置和速度
        snake = [{x: 10, y: 10}];
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        
        // 重新生成食物
        generateFood();
        
        // 绘制游戏
        drawGame();
    }
    
    // 处理键盘按键
    function handleKeyPress(e) {
        // 方向键控制
        switch(e.key) {
            case 'ArrowUp':
                changeDirection(0, -1);
                break;
            case 'ArrowDown':
                changeDirection(0, 1);
                break;
            case 'ArrowLeft':
                changeDirection(-1, 0);
                break;
            case 'ArrowRight':
                changeDirection(1, 0);
                break;
            // WASD控制
            case 'w':
                changeDirection(0, -1);
                break;
            case 's':
                changeDirection(0, 1);
                break;
            case 'a':
                changeDirection(-1, 0);
                break;
            case 'd':
                changeDirection(1, 0);
                break;
            // 空格键开始/暂停
            case ' ':
                if (gameOver) {
                    restartGame();
                } else if (gameRunning) {
                    pauseGame();
                } else {
                    startGame();
                }
                break;
        }
    }
    
    // 改变蛇的方向
    function changeDirection(x, y) {
        // 防止反方向移动（例如向右移动时不能直接向左移动）
        if ((x !== 0 && x === -velocityX) || (y !== 0 && y === -velocityY)) {
            return;
        }
        
        nextVelocityX = x;
        nextVelocityY = y;
        
        // 如果游戏尚未开始，则设置初始方向并开始游戏
        if (!gameRunning && !gameOver && (x !== 0 || y !== 0)) {
            velocityX = x;
            velocityY = y;
            startGame();
        }
    }
    
    // 更新游戏状态
    function updateGame() {
        if (gameOver) {
            clearInterval(gameInterval);
            return;
        }
        
        // 如果是AI模式，计算下一步移动
        if (aiMode && gameRunning) {
            calculateAIMove();
        }
        
        // 更新蛇的方向
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;
        
        // 如果蛇没有移动方向，则不更新
        if (velocityX === 0 && velocityY === 0) return;
        
        // 移动蛇
        const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            handleGameOver();
            return;
        }
        
        // 检查是否撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                handleGameOver();
                return;
            }
        }
        
        // 在蛇头前添加新的头部
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score++;
            document.getElementById('score').textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                document.getElementById('high-score').textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新的食物
            generateFood();
            
            // 播放吃食物音效
            if (eatSound) {
                eatSound.currentTime = 0;
                eatSound.play().catch(e => console.log('播放音效失败:', e));
            }
        } else {
            // 如果没有吃到食物，则移除尾部
            snake.pop();
        }
        
        // 绘制游戏
        drawGame();
    }
    
    // 生成食物
    function generateFood() {
        let newFood;
        let foodOnSnake;
        
        // 确保食物不会生成在蛇身上
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            // 检查食物是否在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newFood.x && snake[i].y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        food = newFood;
    }
    
    // 处理游戏结束
    function handleGameOver() {
        gameOver = true;
        gameRunning = false;
        clearInterval(gameInterval);
        
        // 播放游戏结束音效
        if (gameOverSound) {
            gameOverSound.play().catch(e => console.log('播放音效失败:', e));
        }
        
        // 绘制游戏结束画面
        drawGame();
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线（可选）
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        
        // 绘制食物
        ctx.fillStyle = '#e74c3c'; // 红色食物
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            // 蛇头为深绿色，身体为绿色
            if (i === 0) {
                ctx.fillStyle = '#27ae60';
            } else {
                ctx.fillStyle = '#2ecc71';
            }
            
            // 绘制圆角矩形作为蛇的身体
            roundRect(
                ctx,
                snake[i].x * gridSize + 1,
                snake[i].y * gridSize + 1,
                gridSize - 2,
                gridSize - 2,
                5
            );
            
            // 为蛇头添加眼睛
            if (i === 0) {
                ctx.fillStyle = '#fff';
                
                // 根据移动方向确定眼睛位置
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeSize = 3;
                const eyeOffset = 4;
                
                if (velocityX === 1) { // 向右
                    eyeX1 = snake[i].x * gridSize + gridSize - eyeOffset;
                    eyeY1 = snake[i].y * gridSize + eyeOffset;
                    eyeX2 = snake[i].x * gridSize + gridSize - eyeOffset;
                    eyeY2 = snake[i].y * gridSize + gridSize - eyeOffset;
                } else if (velocityX === -1) { // 向左
                    eyeX1 = snake[i].x * gridSize + eyeOffset;
                    eyeY1 = snake[i].y * gridSize + eyeOffset;
                    eyeX2 = snake[i].x * gridSize + eyeOffset;
                    eyeY2 = snake[i].y * gridSize + gridSize - eyeOffset;
                } else if (velocityY === -1) { // 向上
                    eyeX1 = snake[i].x * gridSize + eyeOffset;
                    eyeY1 = snake[i].y * gridSize + eyeOffset;
                    eyeX2 = snake[i].x * gridSize + gridSize - eyeOffset;
                    eyeY2 = snake[i].y * gridSize + eyeOffset;
                } else { // 向下或静止
                    eyeX1 = snake[i].x * gridSize + eyeOffset;
                    eyeY1 = snake[i].y * gridSize + gridSize - eyeOffset;
                    eyeX2 = snake[i].x * gridSize + gridSize - eyeOffset;
                    eyeY2 = snake[i].y * gridSize + gridSize - eyeOffset;
                }
                
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 添加黑色瞳孔
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize / 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(eyeX2, eyeY2, eyeSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 如果游戏结束，显示游戏结束信息
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
            
            ctx.font = '20px Arial';
            ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
            
            ctx.font = '16px Arial';
            ctx.fillText('按空格键或点击重新开始按钮重新开始', canvas.width / 2, canvas.height / 2 + 40);
        }
    }
    
    // 绘制圆角矩形的辅助函数
    function roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }
    
    // 切换AI模式
    function toggleAIMode() {
        aiMode = !aiMode;
        document.getElementById('ai-btn').textContent = aiMode ? 'AI模式: 开' : 'AI模式';
        
        if (aiMode) {
            // 如果游戏尚未开始，则自动开始游戏
            if (!gameRunning && !gameOver) {
                // 设置初始方向并开始游戏
                calculateAIMove();
                startGame();
            }
        }
    }
    
    // AI计算下一步移动
    function calculateAIMove() {
        // 获取蛇头位置
        const head = snake[0];
        
        // 计算蛇头到食物的方向
        const dirX = food.x - head.x;
        const dirY = food.y - head.y;
        
        // 可能的移动方向
        const possibleMoves = [];
        
        // 优先考虑水平移动接近食物
        if (dirX > 0 && canMove(1, 0)) {
            possibleMoves.push({x: 1, y: 0, priority: Math.abs(dirX) > Math.abs(dirY) ? 2 : 1});
        } else if (dirX < 0 && canMove(-1, 0)) {
            possibleMoves.push({x: -1, y: 0, priority: Math.abs(dirX) > Math.abs(dirY) ? 2 : 1});
        }
        
        // 考虑垂直移动接近食物
        if (dirY > 0 && canMove(0, 1)) {
            possibleMoves.push({x: 0, y: 1, priority: Math.abs(dirY) > Math.abs(dirX) ? 2 : 1});
        } else if (dirY < 0 && canMove(0, -1)) {
            possibleMoves.push({x: 0, y: -1, priority: Math.abs(dirY) > Math.abs(dirX) ? 2 : 1});
        }
        
        // 如果没有找到安全的移动方向，尝试任何安全的方向
        if (possibleMoves.length === 0) {
            if (canMove(0, -1)) possibleMoves.push({x: 0, y: -1, priority: 0});
            if (canMove(1, 0)) possibleMoves.push({x: 1, y: 0, priority: 0});
            if (canMove(0, 1)) possibleMoves.push({x: 0, y: 1, priority: 0});
            if (canMove(-1, 0)) possibleMoves.push({x: -1, y: 0, priority: 0});
        }
        
        // 按优先级排序并选择最佳移动
        if (possibleMoves.length > 0) {
            possibleMoves.sort((a, b) => b.priority - a.priority);
            changeDirection(possibleMoves[0].x, possibleMoves[0].y);
        }
    }
    
    // 检查移动是否安全
    function canMove(dx, dy) {
        // 检查是否是反方向移动
        if ((dx !== 0 && dx === -velocityX) || (dy !== 0 && dy === -velocityY)) {
            return false;
        }
        
        // 获取蛇头位置
        const head = snake[0];
        
        // 计算新位置
        const newX = head.x + dx;
        const newY = head.y + dy;
        
        // 检查是否撞墙
        if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
            return false;
        }
        
        // 检查是否撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === newX && snake[i].y === newY) {
                return false;
            }
        }
        
        return true;
    }
    
    // 初始化游戏
    initGame();
});