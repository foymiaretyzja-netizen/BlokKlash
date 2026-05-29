// sys/control.js

const Controls = {
    // Track which keys are currently being held down
    activeKeys: {},

    // Current selected layouts for both players
    currentLayoutP1: 'wasd', // Options: 'wasd', 'esdf'
    currentLayoutP2: 'pl;',  // Options: 'pl;', 'ijkl'

    // The master dictionary mapping actions to specific keys based on the layout
    mappings: {
        p1: {
            'wasd': { 
                up: 'w', left: 'a', down: 's', right: 'd', 
                attack: 'd',  // Note: Overlaps with 'right' movement
                block: 'e', 
                heavy: 'q' 
            },
            'esdf': { 
                up: 'e', left: 's', down: 'd', right: 'f', 
                attack: 'g', 
                block: 'r', 
                heavy: 'w' 
            }
        },
        p2: {
            'pl;': { 
                up: 'p', left: 'l', down: ';', right: "'", 
                attack: 'h', 
                block: 'u', 
                heavy: 'o' // Set to 'o' to match the hammer slam and u,o,o combo
            },
            'ijkl': { 
                // Shifting the right-side layout one step to the left
                up: 'i', left: 'j', down: 'k', right: 'l', 
                attack: 'y', 
                block: 't', 
                heavy: 'u' 
            }
        }
    },

    // Initialize the event listeners
    init() {
        window.addEventListener('keydown', (e) => {
            // Convert to lowercase to ignore CapsLock issues
            this.activeKeys[e.key.toLowerCase()] = true; 
        });

        window.addEventListener('keyup', (e) => {
            this.activeKeys[e.key.toLowerCase()] = false;
        });

        console.log("Controls initialized!");
    },

    // Change the layout (this will be called from titlescreen.js)
    setLayout(player, layoutName) {
        if (player === 'p1') {
            this.currentLayoutP1 = layoutName;
        } else if (player === 'p2') {
            this.currentLayoutP2 = layoutName;
        }
        console.log(`${player} layout changed to ${layoutName}`);
    },

    // Check if a specific action is currently being pressed
    // Example usage in player.js: if (Controls.isPressed('p1', 'attack')) { ... }
    isPressed(player, action) {
        let layoutName = player === 'p1' ? this.currentLayoutP1 : this.currentLayoutP2;
        let keyForAction = this.mappings[player][layoutName][action];
        
        // Return true if that specific key is in the activeKeys object and is true
        return !!this.activeKeys[keyForAction];
    },

    // Fetch the actual key name for an action (useful for UI or Combo checking)
    getKeyForAction(player, action) {
        let layoutName = player === 'p1' ? this.currentLayoutP1 : this.currentLayoutP2;
        return this.mappings[player][layoutName][action];
    }
};

// Start listening for key presses right away
Controls.init();
