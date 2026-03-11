/**
 * INTDWN - Background Canvas Animation
 * Neural network style animation
 */

class NeuralBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.animationId = null;
        this.mouse = { x: null, y: null };
        
        this.init();
    }

    init() {
        this.resize();
        this.createNodes();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createNodes() {
        const nodeCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        this.nodes = [];

        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createNodes();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    update() {
        for (const node of this.nodes) {
            // Move nodes
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off edges
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

            // Keep within bounds
            node.x = Math.max(0, Math.min(this.canvas.width, node.x));
            node.y = Math.max(0, Math.min(this.canvas.height, node.y));

            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - node.x;
                const dy = this.mouse.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    const force = (100 - dist) / 100;
                    node.vx -= (dx / dist) * force * 0.02;
                    node.vy -= (dy / dist) * force * 0.02;
                }
            }

            // Limit velocity
            const maxVel = 1;
            node.vx = Math.max(-maxVel, Math.min(maxVel, node.vx));
            node.vy = Math.max(-maxVel, Math.min(maxVel, node.vy));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        const maxDist = 120;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.5;
                    
                    // Create gradient for connection
                    const gradient = this.ctx.createLinearGradient(
                        this.nodes[i].x, this.nodes[i].y,
                        this.nodes[j].x, this.nodes[j].y
                    );
                    gradient.addColorStop(0, `rgba(0, 212, 255, ${opacity})`);
                    gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity})`);

                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes
        for (const node of this.nodes) {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, node.radius * 3
            );
            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Core
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

let neuralBackground = null;

export function initNeuralBackground(canvasId = 'neural-canvas') {
    if (neuralBackground) {
        neuralBackground.destroy();
    }
    neuralBackground = new NeuralBackground(canvasId);
    return neuralBackground;
}

export function destroyNeuralBackground() {
    if (neuralBackground) {
        neuralBackground.destroy();
        neuralBackground = null;
    }
}

export default NeuralBackground;
