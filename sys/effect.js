// sys/effect.js

const EffectSystem = {
    particles: [],
    flashes: [],
    
    // Screen shake state
    shakeTimer: 0,
    shakeIntensity: 0,
    offsetX: 0,
    offsetY: 0,

    init() {
        console.log("Effect System initialized!");
    },

    update() {
        const deltaTime = 1 / 60;

        // 1. Update Screen Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
            // Generate random screen offsets based on the current intensity
            this.offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            this.offsetY = (Math.random() - 0.5) * this.shakeIntensity;

            // Smoothly fade out the shake intensity over time
            if (this.shakeTimer <= 0) {
                this.offsetX = 0;
                this.offsetY = 0;
                this.shakeIntensity = 0;
            }
        }

        // 2. Update Particles (move them and fade them out)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Add a little gravity to impact particles
            p.alpha -= p.fadeSpeed;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 3. Update Block/Impact Flashes
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            let f = this.flashes[i];
            f.radius += f.growthSpeed;
            f.alpha -= f.fadeSpeed;

            if (f.alpha <= 0) {
                this.flashes.splice(i, 1);
            }
        }
    },

    // Triggered by damage.js when a player takes damage
    spawnParticles(x, y, color) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            // Explode particles outward in random directions
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                alpha: 1,
                fadeSpeed: 0.02 + Math.random() * 0.03,
                size: 3 + Math.random() * 4
            });
        }
    },

    // Triggered by damage.js when an attack is successfully blocked
    triggerFlash(x, y, color) {
        this.flashes.push({
            x: x + 25, // Centered on the shield edge approximation
            y: y + 25,
            radius: 5,
            growthSpeed: 3,
            alpha: 1,
            fadeSpeed: 0.07,
            color: color
        });
    },

    // Sets up screen shake parameters
    triggerScreenShake(intensity, duration) {
        // Only override if the new shake is more intense than the current one
        if (intensity >= this.shakeIntensity) {
            this.shakeIntensity = intensity;
            this.shakeTimer = duration;
        }
    },

    // --- RENDER METHODS ---

    // Shifts the canvas layout based on active screen shake values
    // Call this at the VERY START of your main loop's draw function
    applyShake(ctx) {
        if (this.shakeTimer > 0) {
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
        }
    },

    // Restores the canvas layout to normal
    // Call this at the VERY END of your main loop's draw function
    clearShake(ctx) {
        if (this.shakeTimer > 0) {
            ctx.restore();
        }
    },

    // Draws all active floating particles and expanding block rings
    draw(ctx) {
        // Draw expanding block flashes
        ctx.save();
        for (let f of this.flashes) {
            ctx.strokeStyle = f.color;
            ctx.globalAlpha = f.alpha;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        // Draw impact burst particles
        ctx.save();
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }
};
