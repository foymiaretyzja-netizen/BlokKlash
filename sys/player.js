// sys/player.js

const Player1 = {
    // Position and Physics
    x: 150,
    y: 100,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    baseSpeed: 5,
    jumpForce: 12,
    gravity: 0.6,
    facing: 'right', // Useful for determining attack direction

    // Attributes
    health: 100,
    maxHealth: 100,
    color: '#ff3b30', // Vibrant Red

    // Combat States
    state: 'idle', // 'idle', 'attacking', 'heavy_buildup', 'combo', 'stunned'
    stateTimer: 0,
    
    // Shield Mechanics
    isShielding: false,
    shieldHoldTimer: 0,      // Tracks how long shield is held continuously
    shieldCooldown: 0,       // Global cooldown before shield can be raised again
    shieldMaxHoldTime: 3.5,  // Hidden 3.5s limit before forced down (abuse limit)
    
    // Cooldowns
    attackCooldown: 0,
    comboCooldown: 0,

    init() {
        this.health = this.maxHealth;
        this.state = 'idle';
        console.log("Player 1 (Red) Initialized!");
    },

    update() {
        // 1. Tick Down All Timers (assuming 60 FPS, so 1 frame = 1/60s ≈ 0.0167s)
        const deltaTime = 1 / 60;
        
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.comboCooldown > 0) this.comboCooldown -= deltaTime;
        if (this.shieldCooldown > 0) this.shieldCooldown -= deltaTime;
        if (this.stateTimer > 0) this.stateTimer -= deltaTime;

        // Reset state if timer finishes
        if (this.state !== 'idle' && this.stateTimer <= 0) {
            this.state = 'idle';
        }

        // 2. Handle Shield Logic
        this.handleShield(deltaTime);

        // 3. Handle Movement & Physics
        this.handleMovement();

        // 4. Handle Attacks
        this.handleAttacks();
    },

    handleMovement() {
        // Stunned or attacking players cannot move manually
        if (this.state === 'stunned' || this.state === 'combo') {
            this.applyPhysics();
            return;
        }

        // Determine current movement speed (Slower if shielding)
        let currentSpeed = this.baseSpeed;
        if (this.isShielding) {
            currentSpeed = this.baseSpeed * 0.4; // 60% movement speed penalty
        }

        // Left/Right movement via control.js
        if (Controls.isPressed('p1', 'left')) {
            this.vx = -currentSpeed;
            this.facing = 'left';
        } else if (Controls.isPressed('p1', 'right')) {
            this.vx = currentSpeed;
            this.facing = 'right';
        } else {
            this.vx = 0;
        }

        // Jump mechanics (Only jump if touching the floor)
        const floorY = typeof MapSewers !== 'undefined' ? MapSewers.floorY : 450;
        const isGrounded = (this.y + this.height >= floorY);

        if (Controls.isPressed('p1', 'up') && isGrounded && !this.isShielding) {
            this.vy = -this.jumpForce;
        }

        this.applyPhysics();
    },

    applyPhysics() {
        const floorY = typeof MapSewers !== 'undefined' ? MapSewers.floorY : 450;

        // Apply gravity
        this.vy += this.gravity;
        
        // Update positions
        this.x += this.vx;
        this.y += this.vy;

        // Floor collision
        if (this.y + this.height >= floorY) {
            this.y = floorY - this.height;
            this.vy = 0;
        }

        // Keep player inside canvas boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 800) this.x = 800 - this.width;
    },

    handleShield(deltaTime) {
        // Check if shield button is pressed and player is allowed to shield
        if (Controls.isPressed('p1', 'block') && this.shieldCooldown <= 0 && this.state === 'idle') {
            this.isShielding = true;
            this.shieldHoldTimer += deltaTime;

            // Check if player is abusing the shield (holding past hidden timer limit)
            if (this.shieldHoldTimer >= this.shieldMaxHoldTime) {
                this.isShielding = false;
                this.shieldHoldTimer = 0;
                this.shieldCooldown = 1.5; // Hidden 1.5s penalty for abuse
                console.log("P1 Shield Broken due to abuse!");
            }
        } else {
            // Shield released normally
            if (this.isShielding) {
                this.isShielding = false;
                this.shieldHoldTimer = 0;
                this.shieldCooldown = 0; // No delay if not abused or hit
            }
        }
    },

    handleAttacks() {
        if (this.state !== 'idle' || this.isShielding) return;

        // Normal Jab Attack
        if (Controls.isPressed('p1', 'attack') && this.attackCooldown <= 0) {
            this.state = 'attacking';
            this.stateTimer = 0.15; // Animation duration
            this.attackCooldown = 0.3; // 0.3s quick cooldown
            
            // Trigger hitbox logic in attack.js
            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerAttack('p1', 'jab');
            }
        }
        
        // Heavy Slice Attack
        else if (Controls.isPressed('p1', 'heavy')) {
            this.state = 'heavy_buildup';
            this.stateTimer = 0.4; // Small buildup duration before strike
            
            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerAttack('p1', 'heavy');
            }
        }
    },

    // This external function will be executed by damage.js when P1 gets hit
    takeDamage(amount, isComboCancel = false) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;

        // Shield drops automatically on hit
        if (this.isShielding) {
            this.isShielding = false;
            this.shieldHoldTimer = 0;
            this.shieldCooldown = 0.5; // 0.5s recovery delay on hit
        }

        // If interrupted during a combo, trigger a special 3s delay penalty
        if (isComboCancel) {
            this.state = 'idle';
            this.comboCooldown = 3.0;
            console.log("P1 Combo Canceled! 3s penalty applied.");
        }
    },

    draw(ctx) {
        // Draw Main Player Cube
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Sword Indicator depending on facing direction
        ctx.fillStyle = "#e0e0e0";
        if (this.facing === 'right') {
            ctx.fillRect(this.x + this.width, this.y + 20, 25, 8); // Sword blade
            ctx.fillStyle = "#8e8e93";
            ctx.fillRect(this.x + this.width, this.y + 17, 4, 14); // Crossguard
        } else {
            ctx.fillRect(this.x - 25, this.y + 20, 25, 8);
            ctx.fillStyle = "#8e8e93";
            ctx.fillRect(this.x - 4, this.y + 17, 4, 14);
        }

        // Draw Shield visual if active
        if (this.isShielding) {
            ctx.fillStyle = "#a0522d"; // Light wood brown
            if (this.facing === 'right') {
                ctx.fillRect(this.x + this.width - 10, this.y + 10, 12, 30);
            } else {
                ctx.fillRect(this.x - 2, this.y + 10, 12, 30);
            }
        }
    }
};
