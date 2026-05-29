// sys/player2.js

const Player2 = {
    // Position and Physics (Starts on the right side facing left)
    x: 600,
    y: 100,
    width: 50,
    height: 50,
    vx: 0,
    vy: 0,
    baseSpeed: 5,
    jumpForce: 12,
    gravity: 0.6,
    facing: 'left',

    // Attributes
    health: 100,
    maxHealth: 100,
    color: '#007aff', // Vibrant Blue

    // Combat States
    state: 'idle', // 'idle', 'attacking', 'heavy_buildup', 'combo', 'stunned'
    stateTimer: 0,
    stunTimer: 0,   // Specifically for handling the 3s immobilization from P1 or attacks
    
    // Shield Mechanics (Identical rules to P1)
    isShielding: false,
    shieldHoldTimer: 0,
    shieldCooldown: 0,
    shieldMaxHoldTime: 3.5, // Forced down if held past 3.5s
    
    // Cooldowns
    attackCooldown: 0,
    comboCooldown: 0,

    init() {
        this.health = this.maxHealth;
        this.state = 'idle';
        this.stunTimer = 0;
        console.log("Player 2 (Blue) Initialized!");
    },

    update() {
        const deltaTime = 1 / 60;
        
        // Tick down timers
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.comboCooldown > 0) this.comboCooldown -= deltaTime;
        if (this.shieldCooldown > 0) this.shieldCooldown -= deltaTime;
        if (this.stateTimer > 0) this.stateTimer -= deltaTime;
        
        // Handle immobilization/stun timer separately
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            this.state = 'stunned';
            if (this.stunTimer <= 0) {
                this.state = 'idle';
            }
        }

        // Reset tracking states if frame timer finishes
        if (this.state !== 'idle' && this.state !== 'stunned' && this.stateTimer <= 0) {
            this.state = 'idle';
        }

        // Handle mechanics
        this.handleShield(deltaTime);
        this.handleMovement();
        this.handleAttacks();
    },

    handleMovement() {
        // If stunned/immobilized or executing a combo, player cannot move
        if (this.state === 'stunned' || this.state === 'combo') {
            this.applyPhysics();
            return;
        }

        let currentSpeed = this.baseSpeed;
        if (this.isShielding) {
            currentSpeed = this.baseSpeed * 0.4; // 60% movement speed penalty
        }

        // Left/Right movement via control.js
        if (Controls.isPressed('p2', 'left')) {
            this.vx = -currentSpeed;
            this.facing = 'left';
        } else if (Controls.isPressed('p2', 'right')) {
            this.vx = currentSpeed;
            this.facing = 'right';
        } else {
            this.vx = 0;
        }

        // Jump mechanics
        const floorY = typeof MapSewers !== 'undefined' ? MapSewers.floorY : 450;
        const isGrounded = (this.y + this.height >= floorY);

        if (Controls.isPressed('p2', 'up') && isGrounded && !this.isShielding) {
            this.vy = -this.jumpForce;
        }

        this.applyPhysics();
    },

    applyPhysics() {
        const floorY = typeof MapSewers !== 'undefined' ? MapSewers.floorY : 450;

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height >= floorY) {
            this.y = floorY - this.height;
            this.vy = 0;
        }

        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 800) this.x = 800 - this.width;
    },

    handleShield(deltaTime) {
        if (Controls.isPressed('p2', 'block') && this.shieldCooldown <= 0 && this.state === 'idle') {
            this.isShielding = true;
            this.shieldHoldTimer += deltaTime;

            if (this.shieldHoldTimer >= this.shieldMaxHoldTime) {
                this.isShielding = false;
                this.shieldHoldTimer = 0;
                this.shieldCooldown = 1.5; // 1.5s penalty for abuse
                console.log("P2 Shield Broken due to abuse!");
            }
        } else {
            if (this.isShielding) {
                this.isShielding = false;
                this.shieldHoldTimer = 0;
                this.shieldCooldown = 0;
            }
        }
    },

    handleAttacks() {
        if (this.state !== 'idle' || this.isShielding) return;

        // Normal Hammer Swing
        if (Controls.isPressed('p2', 'attack') && this.attackCooldown <= 0) {
            this.state = 'attacking';
            this.stateTimer = 0.2; 
            this.attackCooldown = 0.4; 
            
            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerAttack('p2', 'swing');
            }
        }
        
        // Heavy Mallet Slam (+10 Damage tracking if airborne)
        else if (Controls.isPressed('p2', 'heavy')) {
            this.state = 'heavy_buildup';
            this.stateTimer = 0.5; // Slightly slower buildup than sword
            
            const floorY = typeof MapSewers !== 'undefined' ? MapSewers.floorY : 450;
            const isAirborne = (this.y + this.height < floorY - 5);

            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerAttack('p2', 'slam', isAirborne);
            }
        }
    },

    takeDamage(amount, isComboCancel = false) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;

        if (this.isShielding) {
            this.isShielding = false;
            this.shieldHoldTimer = 0;
            this.shieldCooldown = 0.5; // 0.5s shield drop penalty on hit
        }

        if (isComboCancel) {
            this.state = 'idle';
            this.comboCooldown = 3.0; // 3s delay penalty if hit during combo execution
            console.log("P2 Combo Canceled! 3s penalty applied.");
        }
    },

    // Executed when Player 1 hits Player 2 with the heavy mallet slam combo
    immobilize(duration) {
        this.stunTimer = duration;
        this.state = 'stunned';
        this.vx = 0; // Freeze velocity instantly
        console.log(`Player 2 immobilized for ${duration} seconds!`);
    },

    draw(ctx) {
        // Draw Main Player Cube
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Mallet/Hammer weapon graphics
        ctx.fillStyle = "#8a7355"; // Wooden handle color

        if (this.state === 'combo') {
            // Dual Hammer Visual: Draw hammers on both sides!
            // Left Hammer
            ctx.fillRect(this.x - 20, this.y + 20, 20, 6); 
            ctx.fillStyle = "#555";
            ctx.fillRect(this.x - 32, this.y + 8, 12, 30);
            
            // Right Hammer
            ctx.fillStyle = "#8a7355";
            ctx.fillRect(this.x + this.width, this.y + 20, 20, 6);
            ctx.fillStyle = "#555";
            ctx.fillRect(this.x + this.width + 20, this.y + 8, 12, 30);
        } else {
            // Standard Single Mallet rendering based on orientation
            if (this.facing === 'right') {
                ctx.fillRect(this.x + this.width, this.y + 20, 20, 6); //
