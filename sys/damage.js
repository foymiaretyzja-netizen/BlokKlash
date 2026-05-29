// sys/damage.js

const DamageSystem = {
    init() {
        console.log("Damage System initialized!");
    },

    update() {
        // This needs to run every frame to check if any active attacks are landing
        if (typeof AttackSystem !== 'undefined' && AttackSystem.activeAttacks.length > 0) {
            this.checkCollisions();
        }
    },

    checkCollisions() {
        // Loop through all active hitboxes
        for (let i = 0; i < AttackSystem.activeAttacks.length; i++) {
            let attack = AttackSystem.activeAttacks[i];
            
            // Skip if this specific attack frame has already registered a hit
            if (attack.hasHit) continue;

            // Identify the attacker and the victim
            let attacker = attack.owner === 'p1' ? Player1 : Player2;
            let target = attack.owner === 'p1' ? Player2 : Player1;

            // Check if the attack hitbox overlaps with the target player's cube
            if (this.rectsOverlap(attack, target)) {
                this.processHit(attack, attacker, target);
            }
        }
    },

    // Standard AABB Collision Detection math
    rectsOverlap(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    processHit(attack, attacker, target) {
        // Mark attack as spent so it doesn't multi-hit on subsequent frames
        attack.hasHit = true; 

        // 1. Evaluate Shield/Block Status
        let isBlocked = false;
        if (target.isShielding) {
            // Check direction: A player must face the incoming attack to block it
            const attackIsOnRight = attack.x > target.x;
            
            if ((attackIsOnRight && target.facing === 'right') || 
                (!attackIsOnRight && target.facing === 'left')) {
                isBlocked = true;
            }
        }

        // 2. Handle successful block scenario
        if (isBlocked) {
            console.log(`${attack.owner === 'p1' ? 'P2' : 'P1'} successfully BLOCKED the attack!`);
            
            // Trigger block visual flash via effect.js if available
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.triggerFlash(target.x, target.y, '#d2b48c');
            }
            return; // Exit early, skipping damage processing entirely
        }

        // 3. Handle successful hit scenario (No block or hit from behind)
        console.log(`${attack.owner === 'p1' ? 'P1' : 'P2'} scored a hit for ${attack.damage} damage!`);
        
        // Check if the victim was in the middle of executing a combo
        let isComboCancel = (target.state === 'combo');

        // Apply damage and handle internal shield drops/penalties
        target.takeDamage(attack.damage, isComboCancel);

        // 4. Handle Special Attack Side-Effects (Immobilization/Stun)
        if (attack.stunDuration && attack.stunDuration > 0) {
            // Check if target has a custom immobilization script, otherwise force it manually
            if (typeof target.immobilize === 'function') {
                target.immobilize(attack.stunDuration);
            } else {
                target.state = 'stunned';
                // Convert seconds to state timer
                target.stateTimer = attack.stunDuration; 
                target.vx = 0;
            }
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.triggerScreenShake(15, attack.stunDuration);
            }
        }

        // 5. Trigger hit effects/particles
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.spawnParticles(target.x + target.width / 2, target.y + target.height / 2, attacker.color);
            EffectSystem.triggerScreenShake(5, 0.2);
        }
    }
};
