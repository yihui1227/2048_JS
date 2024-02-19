document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const size = 4;
    let board = [];
    let currentScore = 0;
    const currentScoreElem = document.getElementById('current-score');


    let highScore = localStorage.getItem('2048-highScore') || 0;
    const highScoreElem = document.getElementById('high-score');
    highScoreElem.textContent = highScore; // 顯示最高分

    const gameOverElem = document.getElementById('game-over');
    const gameWinElem = document.getElementById('game-win');

    let isPaused = false; // 偵測鍵盤是否暫停
    let isWinned = false;

    function updateScore(value) {
        currentScore += value;
        currentScoreElem.textContent = currentScore;
        const scoreIncreaseElem = document.getElementById('score-increase');
        // 分數增加的動畫
        scoreIncreaseElem.textContent = '+' + value;
        scoreIncreaseElem.style.opacity = 1;
        scoreIncreaseElem.classList.add('increasing');

        if (currentScore > highScore) { // 更新成績
            highScore = currentScore;
            highScoreElem.textContent = highScore;
            localStorage.setItem('2048-highScore', highScore);
        }


        setTimeout(() => { //計時500毫秒後移除動畫
            scoreIncreaseElem.classList.remove('increasing');
            scoreIncreaseElem.style.opacity = 0;
        }, 500);
    }

    function restartGame() {
        currentScore = 0;
        currentScoreElem.textContent = '0';
        gameOverElem.style.display = 'none';
        gameWinElem.style.display = 'none';
        const allCells = document.querySelectorAll('.grid-cell');
        allCells.forEach(cell => {
            cell.classList.remove('large-value');
        });
        initializeGame();
    }

    function newGame() { //直接開始新的遊戲
        isPaused = false;
        if (parseInt(currentScoreElem.textContent) === 0 || gameOverElem.style.display === 'flex') {
            //當目前成績=0或是已經顯示遊戲結束 => restart
            restartGame();
        } else {
            //顯示警告
            if (confirm('確定要重新開始嗎?資料將會遺失！') == true) {
                restartGame();
            }
        }
    }

    function initializeGame() {
        isWinned = false;
        isPaused = false;
        // 每個 size 長度的一維陣列中皆填入 0 並 * size => size * size 的二維陣列
        board = [...Array(size)].map(each => Array(size).fill(0));

        /* 隨機生成方塊 ( 2 或 4 ) * 2 */
        placeRandom();
        placeRandom();

        renderBoard();
    }

    function renderBoard() { // 整理遊戲版
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`); // 定位
                cell.classList.remove('large-value');
                const prevValue = cell.dataset.value; //先前的文字內容
                const currentValue = board[i][j];
                cell.textContent = currentValue;
                cell.dataset.value = currentValue;
                if (currentValue !== 0) {  // 有方塊
                    /* 如果這是塊新合併的方塊且元素中沒包含 "new-tile" 則進行標註為合併過的 */
                    if (currentValue !== parseInt(prevValue) && !cell.classList.contains('new-tile')) {
                        cell.classList.add('merged-tile');
                    }

                } else { // 沒有方塊
                    cell.textContent = '';
                    delete cell.dataset.value;
                    cell.classList.remove('merged-tile', 'new-tile');
                }
            }
        }

        setTimeout(() => { // 計時300毫秒移除標籤
            const cells = document.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.classList.remove('merge-tile', 'new-tile');
            });
        }, 300)

    }

    function placeRandom() { //生成新方塊
        const available = []; //空位置
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    available.push({ x: i, y: j });
                }
            }
        }
        //還有空位
        if (available.length > 0) {
            const randomCell = available[Math.floor(Math.random() * available.length)]; // 選一個位置
            board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4; // 如果隨機數小於 0.9 則生成 2 else 生成 4
            const cell = document.querySelector(`[data-row="${randomCell.x}"][data-col="${randomCell.y}"]`);
            cell.classList.add('new-tile'); //標記為新的
        }
    }

    function move(direction) {
        let hasChanged = false;
        if (direction === 'ArrowUp' || direction === 'ArrowDown') {
            for (let j = 0; j < size; j++) {
                const column = [...Array(size)].map((_, i) => board[i][j]); // column為第j列
                const newColumn = transform(column, direction === 'ArrowUp');
                for (let i = 0; i < size; i++) {
                    if (board[i][j] !== newColumn[i]) {
                        hasChanged = true;
                        board[i][j] = newColumn[i];
                    }
                }
            }
        } else if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
            for (let i = 0; i < size; i++) {
                const row = board[i]; //直接取行
                const newRow = transform(row, direction === 'ArrowLeft');
                if (row.join(',') !== newRow.join(',')) {
                    hasChanged = true;
                    board[i] = newRow;
                }
            }
        }
        if (hasChanged) {
            placeRandom();
            renderBoard();
            checkGameOver();
            if (!isWinned) {
                checkGameWin();
            }
        }
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (board[i][j] >= 2048) {
                    cell.classList.add('large-value');
                } else {
                    cell.classList.remove('large-value');
                }
            }
        }
    }

    function transform(line, moveTowardsStart) {
        let GainedScore = 0;  //合計分數
        let newLine = line.filter(cell => cell !== 0);
        if (!moveTowardsStart) {
            newLine.reverse();
        }
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                GainedScore += newLine[i];
                newLine.splice(i + 1, 1);
            }
        }

        if (GainedScore !== 0) {
            updateScore(GainedScore);
        }

        while (newLine.length < size) {
            newLine.push(0);
        }
        if (!moveTowardsStart) {
            newLine.reverse();
        }

        return newLine;
    }

    function checkGameOver() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 0) {
                    return;
                }
                if (j < size - 1 && board[i][j] === board[i][j + 1]) {
                    return;
                }
                if (i < size - 1 && board[i][j] === board[i + 1][j]) {
                    return;
                }
            }
        }
        /*顯示遊戲結束*/
        if (!isWinned) {
            isPaused = true;
            gameOverElem.style.display = 'flex';
            gameOverElem.style.opacity = 1;
        } else {
            checkGameWin();
        }

    }

    function checkGameWin() {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (board[i][j] === 2048) {
                    isWinned = true;
                    isPaused = true;
                    gameWinElem.style.display = 'flex';
                    gameWinElem.style.opacity = 1
                }
            }
        }
        return;
    }

    function keepgoingGame() {
        isPaused = false;
        gameWinElem.style.display = 'none';
        gameWinElem.style.opacity = 0;
    }

    document.addEventListener('keydown', event => {
        if (!isPaused) { //是否暫停
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                move(event.key);
            }
        }

    });

    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('newgame-btn').addEventListener('click', newGame);
    document.getElementById('tryagain-btn').addEventListener('click', newGame);
    document.getElementById('keepgoing-btn').addEventListener('click', keepgoingGame);

    initializeGame();

});

function scrollToChapter(chapterId) {
    const wheretoPlay = document.getElementById(chapterId);
    if (wheretoPlay) {
        wheretoPlay.scrollIntoView({ behavior: 'smooth' });
    }
}
