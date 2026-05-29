// sys/attack.js

const AttackSystem = {
    // Array to hold all currently active hitboxes on the screen
    activeAttacks: [],

    init() {
        console.log("Attack System initialized!");
    },

    update() {
        const deltaTime = 1 / 60; // Assuming 60 FPS

        // Tick down the duration of all active attacks
        for (let i = this.activeAttacks.length - 1; i >= 0; i--) {
            let attack = this.activeAttacks[i];
            attack.duration -= deltaTime;

            // If the attack is a dash attack (like P1's combo), it needs to follow the player
            if (attack.followsPlayer) {
                let ownerObj = attack.owner === 'p1' ? Player1 : Player2;
                attack.x = ownerObj.facing === 'right' 
                    ? ownerObj.x + ownerObj.width 
                    : ownerObj.x - attack.width;
                attack.y = ownerObj.y + attack.yOffset;
            }

            // Remove the hitbox if its time is up
            if (attack.duration <= 0) {
                this.activeAttacks.splice(i, 1);
            }
        }
    },

    // Standard attacks triggered by normal and heavy buttons
    triggerAttack(playerId, type, isAirborne = false) {
        let ownerObj = playerId === 'p1' ? Player1 : Player2;
        let isRight = ownerObj.facing === 'right';
        
        let attack = {
            owner: playerId,
            hasHit: false, // Prevents a single attack from hitting multiple times per swing
            followsPlayer: false, // Used for static vs dynamic hitboxes
            duration: 0.15 // Standard active frames
        };

        switch (type) {
            case 'jab': // P1 Normal
                attack.width = 35;
                attack.height = 15;
                attack.x = isRight ? ownerObj.x + ownerObj.width : ownerObj.x - attack.width;
                attack.y = ownerObj.y + 20;
                attack.damage = 10;
                break;

            case 'heavy': // P1 Heavy Slice
                attack.width = 50;
                attack.height = 40;
                attack.x = isRight ? ownerObj.x + ownerObj.width : ownerObj.x - attack.width;
                attack.y = ownerObj.y + 10;
                attack.damage = 20;
                attack.duration = 0.2; // Slightly longer active frames
                break;

            case 'swing': // P2 Normal
                attack.width = 40;
                attack.height = 20;
                attack.x = isRight ? ownerObj.x + ownerObj.width : ownerObj.x - attack.width;
                attack.y = ownerObj.y + 15;
                attack.damage = 10;
                break;

            case 'slam': // P2 Heavy Slam
                attack.width = 45;
                attack.height = 50;
                attack.x = isRight ? ownerObj.x + ownerObj.width : ownerObj.x - attack.width;
                attack.y = ownerObj.y;
                // Applies the airborne bonus you requested! (+10 damage)
                attack.damage = isAirborne ? 30 : 20; 
                attack.duration = 0.25;
                break;
        }

        this.activeAttacks.push(attack);
    },

    // Special moves triggered by combo.js
    triggerCombo(playerId, type) {
        let ownerObj = playerId === 'p1' ? Player1 : Player2;
        let isRight = ownerObj.facing === 'right';

        if (type === 'triple_slash') {
            // P1's Combo: Fatal dash stab
            let attack = {
                owner: playerId,
                hasHit: false,
                followsPlayer: true, // Attached to the player as they dash
                width: 60,
                height: 30,
                yOffset: 10, // Used to calculate Y dynamically while dashing
                damage: 45,
                duration: 0.8 // Lasts the full duration of the dash
            };
            this.activeAttacks.push(attack);
        } 
        else if (type === 'dual_slam') {
            // P2's Combo: Dual hammers covering both sides
            // Left Hammer Hitbox
            this.activeAttacks.push({
                owner: playerId,
                hasHit: false,
                followsPlayer: false,
                width: 50,
                height: 60,
                x: ownerObj.x - 50,
                y: ownerObj.y - 10,
                damage: 30,
                duration: 0.6,
                stunDuration: 3.0 // Special property read by damage.js
            });

            // Right Hammer Hitbox
            this.activeAttacks.push({
                owner: playerId,
                hasHit: false,
                followsPlayer: false,
                width: 50,
                height: 60,
                x: ownerObj.x + ownerObj.width,
                y: ownerObj.y - 10,
                damage: 30,
                duration: 0.6,
                stunDuration: 3.0 // Special property read by damage.js
            });
        }
    },

    // A helpful debug visualizer so you can see the actual hitboxes when testing
    drawDebug(ctx) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red
        for (let attack of this.activeAttacks) {
            ctx.fillRect(attack.x, attack.y, attack.width, attack.height);
        }
    }
};
