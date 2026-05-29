// sys/maps/sewers.js

const MapSewers = {
    name: "Underground Sewers",
    
    // The Y-coordinate where the players will stand (the floor level)
    floorY: 450, 
    
    // Timer to animate the bubbling acid
    acidTimer: 0,

    init() {
        console.log(`Map loaded: ${this.name}`);
    },

    // This function will be called every frame by your main game loop
    draw(ctx, canvasWidth, canvasHeight) {
        // 1. Draw the murky underground background
        ctx.fillStyle = "#1a2124"; // Dark blue-grey
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Draw some background details (e.g., giant drainage pipes)
        ctx.fillStyle = "#2a363b";
        ctx.fillRect(150, -50, 80, canvasHeight); // Left pipe
        ctx.fillRect(550, 100, 60, canvasHeight); // Right pipe

        // 3. Draw the fighting platform (Stone walkway)
        ctx.fillStyle = "#3e4a52"; 
        ctx.fillRect(0, this.floorY, canvasWidth, canvasHeight - this.floorY);

        // Add a highlight to the edge of the floor for depth
        ctx.fillStyle = "#546570";
        ctx.fillRect(0, this.floorY, canvasWidth, 10);

        // 4. Draw the animated bubbling acid hazard
        this.drawAcid(ctx, canvasWidth, canvasHeight);
    },

    drawAcid(ctx, canvasWidth, canvasHeight) {
        // Advance the timer to animate the bubbles
        this.acidTimer += 0.05;
        
        const acidHeight = 40;
        const acidY = canvasHeight - acidHeight;

        // Draw the main acid pool at the very bottom
        ctx.fillStyle = "rgba(57, 255, 20, 0.8)"; // Neon toxic green
        ctx.fillRect(0, acidY, canvasWidth, acidHeight);
        
        // Draw floating/popping bubbles
        for (let i = 0; i < 6; i++) {
            // Space the bubbles out horizontally
            let bubbleX = 80 + (i * 130);
            
            // Use sine waves to make them bob up and down based on the timer
            let bobbingOffset = Math.abs(Math.sin(this.acidTimer + i)) * 20;
            let bubbleY = acidY - bobbingOffset;
            
            ctx.beginPath();
            // Vary the bubble sizes slightly
            ctx.arc(bubbleX, bubbleY, 8 + (i % 3) * 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(57, 255, 20, 0.9)";
            ctx.fill();
            
            // Add a little bright reflection to the bubble
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(bubbleX - 3, bubbleY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
