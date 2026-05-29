// sys/titlescreen.js

const TitleScreen = {
    // Game states: 'TITLE', 'MAP_SELECT', 'SETTINGS', 'PLAYING', 'GAME_OVER'
    currentScreen: 'TITLE',
    
    // Available maps for the Map Select screen
    maps: [
        { id: 'sewers', name: 'Underground Sewers', color: '#1a2124' },
        { id: 'rooftops', name: 'Neon Rooftops (Locked)', color: '#2c1a30' },
        { id: 'station', name: 'Cyber Station (Locked)', color: '#1a302b' }
    ],
    selectedMapIndex: 0,
    winner: null,

    // Button bounding boxes for mouse interaction tracking
    buttons: [],

    init(canvas) {
        console.log("Title Screen System initialized!");
        
        // Add a single mouse click listener to handle all UI interactions
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.handleCanvasClick(mouseX, mouseY);
        });
    },

    // Helper to easily register UI button regions
    addButton(id, x, y, w, h, text) {
        this.buttons.push({ id, x, y, w, h, text });
    },

    handleCanvasClick(mx, my) {
        // Find if the mouse click coordinates overlap with an active button
        const clickedButton = this.buttons.find(b => 
            mx >= b.x && mx <= b.x + b.w && 
            my >= b.y && my <= b.y + b.h
        );

        if (!clickedButton) return;

        console.log(`UI Clicked: ${clickedButton.id}`);

        // Navigation Menu State Routing Switch
        switch (clickedButton.id) {
            case 'start_game':
                this.currentScreen = 'MAP_SELECT';
                break;
            case 'open_settings':
                this.currentScreen = 'SETTINGS';
                break;
            case 'back_to_title':
                this.currentScreen = 'TITLE';
                break;
            case 'toggle_p1_controls':
                const nextP1 = Controls.currentLayoutP1 === 'wasd' ? 'esdf' : 'wasd';
                Controls.setLayout('p1', nextP1);
                break;
            case 'toggle_p2_controls':
                const nextP2 = Controls.currentLayoutP2 === 'pl;' ? 'ijkl' : 'pl;';
                Controls.setLayout('p2', nextP2);
                break;
            case 'select_map_0':
                this.selectedMapIndex = 0;
                this.startGameSession();
                break;
            case 'rematch':
                this.resetGameSession();
                this.currentScreen = 'PLAYING';
                break;
        }
    },

    startGameSession() {
        this.resetGameSession();
        this.currentScreen = 'PLAYING';
    },

    resetGameSession() {
        Player1.init();
        Player2.init();
        if (typeof AttackSystem !== 'undefined') AttackSystem.activeAttacks = [];
        if (typeof EffectSystem !== 'undefined') {
            this.particles = [];
            this.flashes = [];
        }
        this.winner = null;
    },

    triggerGameOver(winnerId) {
        this.winner = winnerId === 'p1' ? 'Player 1 (Red)' : 'Player 2 (Blue)';
        this.currentScreen = 'GAME_OVER';
    },

    // --- RENDER METHODS ---

    draw(ctx, canvasWidth, canvasHeight) {
        // Clear buttons array before rebuilding it based on the current screen layout
        this.buttons = [];

        switch (this.currentScreen) {
            case 'TITLE':
                this.drawTitleScreen(ctx, canvasWidth, canvasHeight);
                break;
            case 'MAP_SELECT':
                this.drawMapSelectScreen(ctx, canvasWidth, canvasHeight);
                break;
            case 'SETTINGS':
                this.drawSettingsScreen(ctx, canvasWidth, canvasHeight);
                break;
            case 'GAME_OVER':
                this.drawGameOverScreen(ctx, canvasWidth, canvasHeight);
                break;
        }
    },

    drawTitleScreen(ctx, w, h) {
        // Dark cinematic background fill
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // Game Title Accent Text
        ctx.fillStyle = '#ff3b30';
        ctx.font = 'bold 54px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BLOK', w / 2 - 80, 200);

        ctx.fillStyle = '#007aff';
        ctx.fillText('KLASH', w / 2 + 80, 200);

        // Draw Menu Buttons
        this.drawButtonHelper(ctx, 'start_game', w / 2 - 100, 300, 200, 45, 'BATTLE START');
        this.drawButtonHelper(ctx, 'open_settings', w / 2 - 100, 370, 200, 45, 'CONTROLS');
        
        // Footer Credits
        ctx.fillStyle = '#555';
        ctx.font = '14px sans-serif';
        ctx.fillText('Engine Prototype v1.0.0 • 2026', w / 2, h - 30);
    },

    drawMapSelectScreen(ctx, w, h) {
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CHOOSE ARENA STAGE', w / 2, 100);

        // Map Selection Layout Boxes
        this.maps.forEach((map, index) => {
            const btnY = 180 + (index * 80);
            const isLocked = map.name.includes('(Locked)');
            const label = isLocked ? map.name : `${map.name} (Launch)`;
            
            // Only assign functional callback ID to functional unlocked maps
            const actionId = isLocked ? 'locked_stage' : `select_map_${index}`;
            
            this.drawButtonHelper(ctx, actionId, w / 2 - 200, btnY, 400, 60, label, isLocked ? '#333' : '#222');
        });

        this.drawButtonHelper(ctx, 'back_to_title', w / 2 - 100, h - 100, 200, 40, 'BACK');
    },

    drawSettingsScreen(ctx, w, h) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('INPUT SETTINGS', w / 2, 100);

        // Display Active Configuration Values
        const p1ConfigText = `P1 Layout: ${Controls.currentLayoutP1.toUpperCase()}`;
        const p2ConfigText = `P2 Layout: ${Controls.currentLayoutP2.toUpperCase()}`;

        this.drawButtonHelper(ctx, 'toggle_p1_controls', w / 2 - 200, 200, 400, 50, p1ConfigText);
        this.drawButtonHelper(ctx, 'toggle_p2_controls', w / 2 - 200, 280, 400, 50, p2ConfigText);

        // Layout Keys Visual Map Overlay
        ctx.fillStyle = '#aaa';
        ctx.font = '14px sans-serif';
        ctx.fillText('WASD Layout: Move [W,A,S,D] | Normal [D] | Heavy [Q] | Block [E]', w / 2, 380);
        ctx.fillText('ESDF Layout: Move [E,S,D,F] | Normal [G] | Heavy [W] | Block [R]', w / 2, 410);
        ctx.fillText("PL;' Layout: Move [P,L,;,'] | Normal [H] | Heavy [O] | Block [U]", w / 2, 450);
        ctx.fillText('IJKL Layout: Move [I,J,K,L] | Normal [Y] | Heavy [U] | Block [T]', w / 2, 480);

        this.drawButtonHelper(ctx, 'back_to_title', w / 2 - 100, h - 80, 200, 40, 'SAVE & RETURN');
    },

    drawGameOverScreen(ctx, w, h) {
        // Semi-transparent overlay mask drawn right over the battleground scene
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY ACHIEVED', w / 2, 200);

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.fillText(`${this.winner} wins the duel!`, w / 2, 270);

        this.drawButtonHelper(ctx, 'rematch', w / 2 - 100, 360, 200, 45, 'REMATCH');
        this.drawButtonHelper(ctx, 'back_to_title', w / 2 - 100, 430, 200, 45, 'MAIN MENU');
    },

    // Standardized UI Button rendering assistant logic
    drawButtonHelper(ctx, id, x, y, w, h, text, customBg = '#222') {
        this.addButton(id, x, y, w, h, text);

        ctx.fillStyle = customBg;
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = id.includes('locked') ? '#666' : '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.textBaseline = 'normal'; // Reset baseline standard configuration
    },

    // Standardized UI Combat Overlay HUD method
    drawCombatHUD(ctx, w) {
        // Player 1 HUD (Left Alignment)
        ctx.fillStyle = '#222';
        ctx.fillRect(20, 20, 300, 25);
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(20, 20, 300 * (Player1.health / Player1.maxHealth), 25);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`P1 (Red) | CD: ${Math.max(0, Player1.comboCooldown).toFixed(1)}s`, 25, 40);

        // Player 2 HUD (Right Alignment)
        ctx.fillStyle = '#222';
        ctx.fillRect(w - 320, 20, 300, 25);
        ctx.fillStyle = '#007aff';
        ctx.fillRect(w - 320, 20, 300 * (Player2.health / Player2.maxHealth), 25);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(`CD: ${Math.max(0, Player2.comboCooldown).toFixed(1)}s | P2 (Blue)`, w - 25, 40);
    }
};
