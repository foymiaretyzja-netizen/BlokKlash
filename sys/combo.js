// sys/combo.js

const ComboSystem = {
    // How much time a player has between button presses before the combo resets (0.5 seconds)
    comboWindow: 0.5, 

    // Store the sequence of recent actions and the time of the last press
    buffers: {
        p1: { actions: [], lastInputTime: 0 },
        p2: { actions: [], lastInputTime: 0 }
    },

    // Track the previous frame's button states so we only register the moment a key is pressed down
    prevStates: {
        p1: { block: false, heavy: false },
        p2: { block: false, heavy: false }
    },

    // The required sequence for both players is Block -> Heavy -> Heavy
    requiredSequence: ['block', 'heavy', 'heavy'],

    init() {
        console.log("Combo System initialized!");
    },

    update() {
        // We need a timer to check against the combo window (using performance.now() for precision)
        const currentTime = performance.now() / 1000; 

        this.processPlayerInputs('p1', Player1, currentTime);
        this.processPlayerInputs('p2', Player2, currentTime);
    },

    processPlayerInputs(playerId, playerObj, currentTime) {
        // 1. If player is stunned or already in a combo, clear their buffer and ignore inputs
        if (playerObj.state === 'stunned' || playerObj.state === 'combo') {
            this.buffers[playerId].actions = [];
            return;
        }

        // 2. Check if the buffer has expired due to waiting too long between presses
        if (currentTime - this.buffers[playerId].lastInputTime > this.comboWindow) {
            this.buffers[playerId].actions = [];
        }

        // 3. Check for new edge-triggered presses (button went from up to down)
        const actionsToCheck = ['block', 'heavy'];
        let newActionRegistered = false;

        actionsToCheck.forEach(action => {
            let isCurrentlyPressed = Controls.isPressed(playerId, action);
            let wasPressedLastFrame = this.prevStates[playerId][action];

            // If it is pressed now, but wasn't last frame, it's a fresh tap!
            if (isCurrentlyPressed && !wasPressedLastFrame) {
                this.buffers[playerId].actions.push(action);
                this.buffers[playerId].lastInputTime = currentTime;
                newActionRegistered = true;
            }

            // Update the previous state for the next frame
            this.prevStates[playerId][action] = isCurrentlyPressed;
        });

        // 4. If a new action was added, check if the buffer matches the required combo
        if (newActionRegistered) {
            this.checkComboMatch(playerId, playerObj);
        }
    },

    checkComboMatch(playerId, playerObj) {
        let currentBuffer = this.buffers[playerId].actions;

        // If the buffer doesn't have 3 actions yet, do nothing
        if (currentBuffer.length < 3) return;

        // Grab the last 3 actions in case they mashed extra keys
        let lastThree = currentBuffer.slice(-3);

        // Check if they match our required ['block', 'heavy', 'heavy']
        let isMatch = lastThree.every((val, index) => val === this.requiredSequence[index]);

        if (isMatch) {
            // Ensure the global 5s combo cooldown has finished
            if (playerObj.comboCooldown <= 0) {
                this.executeCombo(playerId, playerObj);
            } else {
                console.log(`${playerId} tried to combo, but is on cooldown!`);
            }
            
            // Clear the buffer after a successful match or failed cooldown attempt
            this.buffers[playerId].actions = []; 
        }
    },

    executeCombo(playerId, playerObj) {
        // Put player in combo state
        playerObj.state = 'combo';
        
        // Apply the 5-second global delay required for combos
        playerObj.comboCooldown = 5.0; 

        if (playerId === 'p1') {
            console.log("P1 Executing Triple Slash Dash!");
            playerObj.stateTimer = 0.8; // Duration of the dash/slashes
            
            // Push the player forward rapidly for the dash effect
            playerObj.vx = playerObj.facing === 'right' ? 15 : -15; 

            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerCombo('p1', 'triple_slash');
            }
        } 
        else if (playerId === 'p2') {
            console.log("P2 Executing Dual Hammer Slam!");
            playerObj.stateTimer = 0.6; // Duration of the heavy slam
            
            if (typeof AttackSystem !== 'undefined') {
                AttackSystem.triggerCombo('p2', 'dual_slam');
            }
        }
    }
};
