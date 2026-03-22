/**
 * Enhanced Music Visualizer - p5.js based visualization engine
 * Creates real-time visual effects based on audio frequency data
 * Interactive and user-friendly visualization experience
 */
class MusicVisualizer {
    constructor() {
        this.audioData = {
            bass: 0,
            mid: 0,
            treble: 0,
            energy: 0
        };
        
        // Visual elements
        this.particles = [];
        this.sparkles = [];
        this.energyWaves = [];
        this.ripples = [];
        this.lightBeams = [];
        this.constellationLines = [];
        this.floatingOrbs = [];
        
        // Bass circle properties
        this.bassCircle = {
            x: 0,
            y: 0,
            size: 50,
            targetSize: 50,
            color: { r: 100, g: 100, b: 255 },
            rotation: 0,
            pulsePhase: 0,
            glowIntensity: 0,
            morphPhase: 0,
            resonance: 0
        };
        
        // Background properties
        this.backgroundColor = { r: 10, g: 10, b: 10 };
        this.targetBackgroundColor = { r: 10, g: 10, b: 10 };
        this.backgroundGlow = 0;
        this.backgroundGradient = 0;
        
        // Animation properties
        this.time = 0;
        this.beatReaction = 0;
        this.globalPulse = 0;
        
        // Interactive properties
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseOver = false;
        this.interactionStrength = 0;
        this.mouseTrail = [];
        
        // Visual modes
        this.visualMode = 'default'; // default, particles, waves, geometric, cosmic
        this.modeTransition = 0;
        
        // Performance optimization
        this.particleCount = 120;
        this.maxSparkles = 50;
        this.maxLightBeams = 8;
        
        this.initParticles();
        this.initInteractions();
    }
    
    /**
     * Initialize particle system
     */
    initParticles() {
        this.particles = [];
        
        // Create enhanced particles for mid frequencies
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (TWO_PI / this.particleCount) * i;
            const radius = random(100, 350);
            
            this.particles.push({
                angle: angle,
                radius: radius,
                targetRadius: radius,
                size: random(2, 15),
                speed: random(0.01, 0.05),
                color: { r: 255, g: 100, b: 200 },
                alpha: 255,
                orbitSpeed: random(0.005, 0.04),
                wobble: random(0, TWO_PI),
                trail: [],
                maxTrailLength: 8,
                energy: 0,
                pulsePhase: random(0, TWO_PI),
                resonance: 0,
                glowIntensity: 0,
                connections: []
            });
        }
        
        // Initialize floating orbs
        this.initFloatingOrbs();
        
        // Initialize constellation connections
        this.initConstellations();
    }
    
    /**
     * Initialize floating orbs
     */
    initFloatingOrbs() {
        this.floatingOrbs = [];
        for (let i = 0; i < 15; i++) {
            this.floatingOrbs.push({
                x: random(width),
                y: random(height),
                vx: random(-0.5, 0.5),
                vy: random(-0.5, 0.5),
                size: random(3, 12),
                color: { r: random(100, 255), g: random(100, 255), b: random(200, 255) },
                alpha: random(50, 150),
                pulsePhase: random(0, TWO_PI),
                glowIntensity: 0
            });
        }
    }
    
    /**
     * Initialize constellation connections
     */
    initConstellations() {
        this.constellationLines = [];
        // These will be dynamically created based on particle proximity
    }
    
    /**
     * Initialize mouse interactions
     */
    initInteractions() {
        // These will be called from p5.js mouse functions
        this.mouseInfluence = {
            radius: 150,
            strength: 0.3
        };
    }
    
    /**
     * Update mouse position (called from p5.js)
     */
    updateMousePosition(mx, my) {
        this.mouseX = mx;
        this.mouseY = my;
        this.isMouseOver = mx >= 0 && mx <= width && my >= 0 && my <= height;
        
        // Update mouse trail
        if (this.isMouseOver) {
            this.mouseTrail.push({ x: mx, y: my, time: this.time });
            if (this.mouseTrail.length > 20) {
                this.mouseTrail.shift();
            }
            this.interactionStrength = min(this.interactionStrength + 0.1, 1);
        } else {
            this.interactionStrength = max(this.interactionStrength - 0.05, 0);
        }
    }
    
    /**
     * Handle mouse click (called from p5.js)
     */
    handleMouseClick() {
        if (this.isMouseOver) {
            this.createClickEffect(this.mouseX, this.mouseY);
            this.cycleVisualMode();
            this.createLightBeams(this.mouseX, this.mouseY);
        }
    }
    
    /**
     * Cycle through visual modes
     */
    cycleVisualMode() {
        const modes = ['default', 'particles', 'waves', 'geometric', 'cosmic'];
        const currentIndex = modes.indexOf(this.visualMode);
        this.visualMode = modes[(currentIndex + 1) % modes.length];
        this.modeTransition = 1;
        
        console.log('Visual mode:', this.visualMode);
    }
    
    /**
     * Create click effect at position
     */
    createClickEffect(x, y) {
        // Create ripple effect
        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 300,
            alpha: 255,
            color: { r: 255, g: 255, b: 255 },
            speed: 8
        });
        
        // Create burst of sparkles
        for (let i = 0; i < 15; i++) {
            const angle = (TWO_PI / 15) * i;
            const speed = random(3, 8);
            
            this.sparkles.push({
                x: x,
                y: y,
                vx: cos(angle) * speed,
                vy: sin(angle) * speed,
                size: random(3, 12),
                life: 255,
                maxLife: 255,
                color: {
                    r: 255,
                    g: random(200, 255),
                    b: random(100, 255)
                },
                rotation: random(TWO_PI),
                rotationSpeed: random(-0.3, 0.3)
            });
        }
        
        // Create shockwave effect
        this.createShockwave(x, y);
    }
    
    /**
     * Create light beams from position
     */
    createLightBeams(x, y) {
        const beamCount = 6;
        for (let i = 0; i < beamCount; i++) {
            const angle = (TWO_PI / beamCount) * i + random(-0.2, 0.2);
            
            this.lightBeams.push({
                startX: x,
                startY: y,
                endX: x + cos(angle) * random(200, 400),
                endY: y + sin(angle) * random(200, 400),
                alpha: 255,
                width: random(2, 6),
                color: { r: 255, g: 255, b: 255 },
                life: 60
            });
        }
    }
    
    /**
     * Create shockwave effect
     */
    createShockwave(x, y) {
        // This will create a radial distortion effect
        this.shockwave = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 500,
            strength: 1,
            life: 30
        };
    }
    
    /**
     * Update audio data from controller
     */
    updateAudioData(data) {
        this.audioData = data;
        this.updateVisuals();
    }
    
    /**
     * Update all visual elements based on audio data
     */
    updateVisuals() {
        const { bass, mid, treble, energy } = this.audioData;
        
        // Update bass circle
        this.updateBassCircle(bass);
        
        // Update particles based on mid frequencies
        this.updateParticles(mid);
        
        // Create sparkle effects for treble
        this.updateSparkles(treble);
        
        // Update energy waves
        this.updateEnergyWaves(energy);
        
        // Update background color
        this.updateBackgroundColor(energy);
        
        // Update background glow
        this.backgroundGlow = map(energy, 0, 255, 0, 1);
        
        // Update glow intensity
        this.bassCircle.glowIntensity = map(bass, 0, 255, 0, 1);
        
        // Update global pulse
        this.globalPulse = map(energy, 0, 255, 0, 1);
        
        // Update floating orbs
        this.updateFloatingOrbs(energy);
        
        // Update constellation lines
        this.updateConstellations(mid);
        
        // Update light beams
        this.updateLightBeams();
    }
    
    /**
     * Update bass circle visualization
     */
    updateBassCircle(bass) {
        // Dynamic sizing based on bass
        this.bassCircle.targetSize = map(bass, 0, 255, 50, 500);
        
        // Enhanced color intensity based on bass
        const intensity = map(bass, 0, 255, 0, 1);
        this.bassCircle.color.r = lerp(100, 255, intensity);
        this.bassCircle.color.g = lerp(100, 200, intensity);
        this.bassCircle.color.b = lerp(255, 100, intensity);
        
        // Rotation speed based on bass
        this.bassCircle.rotation += map(bass, 0, 255, 0.003, 0.04);
        
        // Enhanced pulse effect
        this.bassCircle.pulsePhase += map(bass, 0, 255, 0.08, 0.4);
        
        // Morph phase for shape transformation
        this.bassCircle.morphPhase += map(bass, 0, 255, 0.02, 0.1);
        
        // Resonance for vibration effect
        this.bassCircle.resonance = map(bass, 0, 255, 0, 20);
        
        // Add wobble for more dynamic movement
        const wobbleAmount = map(bass, 0, 255, 0, 30);
        this.bassCircle.x = width / 2 + sin(this.bassCircle.pulsePhase) * wobbleAmount;
        this.bassCircle.y = height / 2 + cos(this.bassCircle.pulsePhase * 0.7) * wobbleAmount;
    }
    
    /**
     * Update particle system with enhanced effects
     */
    updateParticles(mid) {
        const midIntensity = map(mid, 0, 255, 0, 1);
        
        this.particles.forEach((particle, index) => {
            // Enhanced orbital motion
            particle.angle += particle.orbitSpeed * (1 + midIntensity * 3);
            
            // Dynamic radius with mouse interaction
            let radiusVariation = sin(this.time * 0.02 + particle.wobble) * 80;
            particle.targetRadius = map(mid, 0, 255, 80, 450) + radiusVariation;
            
            // Mouse influence
            if (this.interactionStrength > 0) {
                const mouseDist = dist(
                    this.bassCircle.x + cos(particle.angle) * particle.radius,
                    this.bassCircle.y + sin(particle.angle) * particle.radius,
                    this.mouseX,
                    this.mouseY
                );
                
                if (mouseDist < this.mouseInfluence.radius) {
                    const influence = (1 - mouseDist / this.mouseInfluence.radius) * this.mouseInfluence.strength * this.interactionStrength;
                    particle.targetRadius += influence * 150;
                    particle.energy = min(particle.energy + 0.15, 1);
                    particle.glowIntensity = min(particle.glowIntensity + 0.2, 1);
                } else {
                    particle.energy = max(particle.energy - 0.08, 0);
                    particle.glowIntensity = max(particle.glowIntensity - 0.1, 0);
                }
            }
            
            // Smooth radius transition
            particle.radius = lerp(particle.radius, particle.targetRadius, 0.2);
            
            // Update alpha based on mid intensity and energy
            particle.alpha = map(mid, 0, 255, 120, 255) * (1 + particle.energy * 0.5);
            
            // Enhanced particle size variation
            particle.size = map(mid, 0, 255, 3, 20) * (1 + particle.energy * 0.4);
            
            // Dynamic color variation
            const colorShift = sin(particle.angle + this.time * 0.01) * 100;
            particle.color.r = 255;
            particle.color.g = lerp(100, 240, midIntensity) + colorShift;
            particle.color.b = lerp(200, 100, midIntensity) - colorShift * 0.5;
            
            // Update particle pulse
            particle.pulsePhase += 0.15;
            
            // Update resonance
            particle.resonance = map(mid, 0, 255, 0, 10);
            
            // Update trail
            const x = this.bassCircle.x + cos(particle.angle) * particle.radius;
            const y = this.bassCircle.y + sin(particle.angle) * particle.radius;
            
            particle.trail.push({ x, y, alpha: particle.alpha });
            if (particle.trail.length > particle.maxTrailLength) {
                particle.trail.shift();
            }
        });
    }
    
    /**
     * Update sparkle effects for treble
     */
    updateSparkles(treble) {
        // Create new sparkles for high treble values
        if (treble > 140 && this.sparkles.length < this.maxSparkles) {
            const sparkleCount = floor(map(treble, 140, 255, 1, 12));
            
            for (let i = 0; i < sparkleCount; i++) {
                // Create sparkles around the bass circle
                const angle = random(TWO_PI);
                const distance = this.bassCircle.size / 2 + random(30, 150);
                
                this.sparkles.push({
                    x: this.bassCircle.x + cos(angle) * distance,
                    y: this.bassCircle.y + sin(angle) * distance,
                    vx: random(-6, 6),
                    vy: random(-6, 6),
                    size: random(2, 15),
                    life: 255,
                    maxLife: 255,
                    color: {
                        r: 255,
                        g: 255,
                        b: random(150, 255)
                    },
                    rotation: random(TWO_PI),
                    rotationSpeed: random(-0.4, 0.4),
                    gravity: 0.15,
                    trail: []
                });
            }
        }
        
        // Update existing sparkles with enhanced physics
        this.sparkles = this.sparkles.filter(sparkle => {
            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            sparkle.life -= 2;
            sparkle.vx *= 0.96;
            sparkle.vy *= 0.96;
            sparkle.rotation += sparkle.rotationSpeed;
            
            // Add gravity effect
            sparkle.vy += sparkle.gravity;
            
            // Update trail
            sparkle.trail.push({ x: sparkle.x, y: sparkle.y, alpha: sparkle.life });
            if (sparkle.trail.length > 5) {
                sparkle.trail.shift();
            }
            
            return sparkle.life > 0;
        });
    }
    
    /**
     * Update floating orbs
     */
    updateFloatingOrbs(energy) {
        const energyIntensity = map(energy, 0, 255, 0, 1);
        
        this.floatingOrbs.forEach(orb => {
            // Movement
            orb.x += orb.vx;
            orb.y += orb.vy;
            
            // Wrap around edges
            if (orb.x < 0) orb.x = width;
            if (orb.x > width) orb.x = 0;
            if (orb.y < 0) orb.y = height;
            if (orb.y > height) orb.y = 0;
            
            // Energy influence
            orb.vx += random(-0.1, 0.1) * energyIntensity;
            orb.vy += random(-0.1, 0.1) * energyIntensity;
            
            // Damping
            orb.vx *= 0.99;
            orb.vy *= 0.99;
            
            // Pulse
            orb.pulsePhase += 0.05;
            
            // Glow intensity
            orb.glowIntensity = energyIntensity;
            
            // Alpha based on energy
            orb.alpha = map(energy, 0, 255, 50, 200);
        });
    }
    
    /**
     * Update constellation lines
     */
    updateConstellations(mid) {
        this.constellationLines = [];
        const connectionDistance = map(mid, 0, 255, 100, 200);
        
        // Create connections between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const x1 = this.bassCircle.x + cos(p1.angle) * p1.radius;
                const y1 = this.bassCircle.y + sin(p1.angle) * p1.radius;
                const x2 = this.bassCircle.x + cos(p2.angle) * p2.radius;
                const y2 = this.bassCircle.y + sin(p2.angle) * p2.radius;
                
                const distance = dist(x1, y1, x2, y2);
                
                if (distance < connectionDistance) {
                    const alpha = map(distance, 0, connectionDistance, 100, 10);
                    this.constellationLines.push({
                        x1, y1, x2, y2, alpha
                    });
                }
            }
        }
    }
    
    /**
     * Update light beams
     */
    updateLightBeams() {
        this.lightBeams = this.lightBeams.filter(beam => {
            beam.life--;
            beam.alpha = map(beam.life, 0, 60, 0, 255);
            return beam.life > 0;
        });
    }
    
    /**
     * Update energy waves with enhanced patterns
     */
    updateEnergyWaves(energy) {
        // Create new waves for high energy
        if (energy > 80 && this.energyWaves.length < 12) {
            if (random() > 0.6) {
                this.energyWaves.push({
                    radius: 0,
                    maxRadius: map(energy, 80, 255, 200, 800),
                    alpha: 255,
                    speed: map(energy, 80, 255, 3, 12),
                    color: this.getEnergyColor(energy),
                    lineWidth: map(energy, 80, 255, 1, 6),
                    waveType: random(['circle', 'spiral', 'pulse', 'helix']),
                    rotation: random(TWO_PI),
                    complexity: floor(map(energy, 80, 255, 3, 8))
                });
            }
        }
        
        // Update existing waves
        this.energyWaves = this.energyWaves.filter(wave => {
            wave.radius += wave.speed;
            wave.rotation += 0.02;
            
            if (wave.waveType === 'spiral') {
                wave.alpha = map(wave.radius, 0, wave.maxRadius, 255, 0);
            } else if (wave.waveType === 'helix') {
                wave.alpha = map(wave.radius, 0, wave.maxRadius, 255, 0);
            } else {
                wave.alpha = map(wave.radius, 0, wave.maxRadius, 255, 0);
            }
            
            return wave.alpha > 0;
        });
    }
    
    /**
     * Update background color based on energy
     */
    updateBackgroundColor(energy) {
        let targetR, targetG, targetB;
        
        if (energy < 85) {
            // Low energy -> deep blue
            const normalized = map(energy, 0, 85, 0, 1);
            targetR = map(normalized, 0, 1, 10, 40);
            targetG = map(normalized, 0, 1, 10, 40);
            targetB = map(normalized, 0, 1, 30, 140);
        } else if (energy < 170) {
            // Medium energy -> purple
            const normalized = map(energy, 85, 170, 0, 1);
            targetR = map(normalized, 0, 1, 40, 180);
            targetG = map(normalized, 0, 1, 40, 100);
            targetB = map(normalized, 0, 1, 140, 180);
        } else {
            // High energy -> neon red/orange
            const normalized = map(energy, 170, 255, 0, 1);
            targetR = map(normalized, 0, 1, 180, 255);
            targetG = map(normalized, 0, 1, 100, 140);
            targetB = map(normalized, 0, 1, 180, 100);
        }
        
        // Smooth color transitions
        this.targetBackgroundColor = { r: targetR, g: targetG, b: targetB };
    }
    
    /**
     * Get color based on energy level
     */
    getEnergyColor(energy) {
        if (energy < 85) {
            return { r: 80, g: 120, b: 255 };
        } else if (energy < 170) {
            return { r: 220, g: 120, b: 255 };
        } else {
            return { r: 255, g: 120, b: 120 };
        }
    }
    
    /**
     * Main update method (called every frame)
     */
    update() {
        this.time++;
        
        // Smooth transitions
        this.bassCircle.size = lerp(this.bassCircle.size, this.bassCircle.targetSize, 0.25);
        
        // Background color smoothing
        this.backgroundColor.r = lerp(this.backgroundColor.r, this.targetBackgroundColor.r, 0.1);
        this.backgroundColor.g = lerp(this.backgroundColor.g, this.targetBackgroundColor.g, 0.1);
        this.backgroundColor.b = lerp(this.backgroundColor.b, this.targetBackgroundColor.b, 0.1);
        
        // Beat reaction decay
        this.beatReaction *= 0.85;
        
        // Mode transition decay
        this.modeTransition *= 0.9;
        
        // Update ripples
        this.ripples = this.ripples.filter(ripple => {
            ripple.radius += ripple.speed;
            ripple.alpha = map(ripple.radius, 0, ripple.maxRadius, 255, 0);
            return ripple.alpha > 0;
        });
        
        // Update shockwave
        if (this.shockwave) {
            this.shockwave.radius += 15;
            this.shockwave.life--;
            this.shockwave.strength = this.shockwave.life / 30;
            if (this.shockwave.life <= 0) {
                this.shockwave = null;
            }
        }
        
        // Clean up old mouse trail points
        this.mouseTrail = this.mouseTrail.filter(point => this.time - point.time < 30);
    }
    
    /**
     * Main draw method (called every frame)
     */
    draw() {
        // Dynamic background with enhanced glow
        this.drawBackground();
        
        // Draw based on visual mode
        switch(this.visualMode) {
            case 'particles':
                this.drawParticlesMode();
                break;
            case 'waves':
                this.drawWavesMode();
                break;
            case 'geometric':
                this.drawGeometricMode();
                break;
            case 'cosmic':
                this.drawCosmicMode();
                break;
            default:
                this.drawDefaultMode();
        }
        
        // Draw interactive effects
        this.drawInteractiveEffects();
        
        // Draw beat reaction effect
        if (this.beatReaction > 0.1) {
            this.drawBeatReaction();
        }
        
        // Draw mode transition effect
        if (this.modeTransition > 0.1) {
            this.drawModeTransition();
        }
        
        // Draw shockwave distortion
        if (this.shockwave) {
            this.drawShockwave();
        }
    }
    
    /**
     * Draw default visualization mode
     */
    drawDefaultMode() {
        // Draw energy waves
        this.drawEnergyWaves();
        
        // Draw bass circle
        this.drawBassCircle();
        
        // Draw particles
        this.drawParticles();
        
        // Draw sparkles
        this.drawSparkles();
        
        // Draw additional effects
        this.drawAdditionalEffects();
    }
    
    /**
     * Draw particles-focused mode
     */
    drawParticlesMode() {
        // Enhanced particle effects
        this.drawParticlesEnhanced();
        
        // Minimal bass circle
        push();
        noFill();
        strokeWeight(2);
        stroke(this.bassCircle.color.r, this.bassCircle.color.g, this.bassCircle.color.b, 100);
        ellipse(this.bassCircle.x, this.bassCircle.y, this.bassCircle.size * 0.5);
        pop();
        
        // Draw sparkles
        this.drawSparkles();
    }
    
    /**
     * Draw waves-focused mode
     */
    drawWavesMode() {
        // Enhanced wave effects
        this.drawEnergyWavesEnhanced();
        
        // Pulsing center
        push();
        noStroke();
        fill(this.bassCircle.color.r, this.bassCircle.color.g, this.bassCircle.color.b, 150);
        const pulseSize = this.bassCircle.size * 0.3 * (1 + sin(this.time * 0.1) * 0.3);
        ellipse(this.bassCircle.x, this.bassCircle.y, pulseSize);
        pop();
    }
    
    /**
     * Draw cosmic-focused mode
     */
    drawCosmicMode() {
        // Draw floating orbs
        this.drawFloatingOrbs();
        
        // Draw constellation lines
        this.drawConstellationLines();
        
        // Draw enhanced particles
        this.drawParticlesEnhanced();
        
        // Draw light beams
        this.drawLightBeams();
        
        // Minimal bass circle
        push();
        noFill();
        strokeWeight(3);
        stroke(this.bassCircle.color.r, this.bassCircle.color.g, this.bassCircle.color.b, 150);
        ellipse(this.bassCircle.x, this.bassCircle.y, this.bassCircle.size * 0.7);
        pop();
        
        // Draw sparkles
        this.drawSparkles();
    }
    
    /**
     * Draw floating orbs
     */
    drawFloatingOrbs() {
        this.floatingOrbs.forEach(orb => {
            push();
            
            // Glow effect
            if (orb.glowIntensity > 0.3) {
                drawingContext.shadowBlur = 30 * orb.glowIntensity;
                drawingContext.shadowColor = `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, 0.8)`;
            }
            
            noStroke();
            fill(orb.color.r, orb.color.g, orb.color.b, orb.alpha);
            
            const size = orb.size * (1 + sin(orb.pulsePhase) * 0.3);
            ellipse(orb.x, orb.y, size);
            
            // Inner core
            fill(255, 255, 255, orb.alpha * 0.8);
            ellipse(orb.x, orb.y, size * 0.3);
            
            pop();
        });
    }
    
    /**
     * Draw constellation lines
     */
    drawConstellationLines() {
        this.constellationLines.forEach(line => {
            push();
            noFill();
            strokeWeight(1);
            stroke(255, 255, 255, line.alpha);
            line(line.x1, line.y1, line.x2, line.y2);
            pop();
        });
    }
    
    /**
     * Draw light beams
     */
    drawLightBeams() {
        this.lightBeams.forEach(beam => {
            push();
            noFill();
            strokeWeight(beam.width);
            stroke(beam.color.r, beam.color.g, beam.color.b, beam.alpha);
            
            // Add glow
            drawingContext.shadowBlur = 20;
            drawingContext.shadowColor = `rgba(${beam.color.r}, ${beam.color.g}, ${beam.color.b}, 0.8)`;
            
            line(beam.startX, beam.startY, beam.endX, beam.endY);
            pop();
        });
    }
    
    /**
     * Draw shockwave distortion effect
     */
    drawShockwave() {
        if (!this.shockwave) return;
        
        push();
        noFill();
        strokeWeight(3);
        stroke(255, 255, 255, this.shockwave.strength * 255);
        
        // Draw multiple shockwave rings
        for (let i = 0; i < 3; i++) {
            const offset = i * 20;
            const alpha = this.shockwave.strength * (1 - i * 0.3);
            stroke(255, 255, 255, alpha * 255);
            ellipse(this.shockwave.x, this.shockwave.y, (this.shockwave.radius - offset) * 2);
        }
        pop();
    }
    
    /**
     * Draw background with enhanced glow
     */
    drawBackground() {
        // Base background color
        background(
            this.backgroundColor.r,
            this.backgroundColor.g,
            this.backgroundColor.b
        );
        
        // Add enhanced gradient overlay
        if (this.backgroundGlow > 0) {
            push();
            
            // Create radial gradient from center
            const gradient = drawingContext.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, max(width, height) / 2
            );
            
            const color = this.bassCircle.color;
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${this.backgroundGlow * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${this.backgroundGlow * 0.2})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            drawingContext.fillStyle = gradient;
            drawingContext.fillRect(0, 0, width, height);
            
            // Add global pulse overlay
            fill(255, 255, 255, this.globalPulse * 20);
            rect(0, 0, width, height);
            
            pop();
        }
        
        // Draw mouse trail
        if (this.mouseTrail.length > 1) {
            push();
            noFill();
            for (let i = 0; i < this.mouseTrail.length - 1; i++) {
                const point = this.mouseTrail[i];
                const nextPoint = this.mouseTrail[i + 1];
                const alpha = (i / this.mouseTrail.length) * 100;
                
                stroke(255, 255, 255, alpha);
                strokeWeight(2);
                line(point.x, point.y, nextPoint.x, nextPoint.y);
            }
            pop();
        }
    }
    
    /**
     * Draw enhanced energy waves
     */
    drawEnergyWavesEnhanced() {
        this.energyWaves.forEach(wave => {
            push();
            
            if (wave.waveType === 'spiral') {
                // Draw spiral wave
                noFill();
                strokeWeight(wave.lineWidth);
                stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha);
                
                push();
                translate(this.bassCircle.x, this.bassCircle.y);
                rotate(wave.rotation);
                
                beginShape();
                for (let angle = 0; angle < TWO_PI * wave.complexity; angle += 0.05) {
                    const r = wave.radius * (angle / (TWO_PI * wave.complexity));
                    const x = cos(angle + this.time * 0.02) * r;
                    const y = sin(angle + this.time * 0.02) * r;
                    vertex(x, y);
                }
                endShape();
                pop();
                
            } else if (wave.waveType === 'helix') {
                // Draw helix wave
                noFill();
                strokeWeight(wave.lineWidth);
                stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha);
                
                push();
                translate(this.bassCircle.x, this.bassCircle.y);
                rotate(wave.rotation);
                
                beginShape();
                noFill();
                for (let t = 0; t < TWO_PI * 3; t += 0.1) {
                    const x = (wave.radius * 0.3) * cos(t) * (1 + 0.5 * sin(t * 3));
                    const y = (wave.radius * 0.3) * sin(t) * (1 + 0.5 * sin(t * 3));
                    const z = t * 20;
                    
                    vertex(x + z * 0.1, y);
                }
                endShape();
                pop();
                
            } else {
                // Draw circular wave
                noFill();
                strokeWeight(wave.lineWidth);
                stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha);
                
                if (wave.waveType === 'pulse') {
                    // Pulsing wave
                    for (let i = 0; i < 4; i++) {
                        const offset = i * 25;
                        const alpha = wave.alpha * (1 - i * 0.25);
                        stroke(wave.color.r, wave.color.g, wave.color.b, alpha);
                        ellipse(this.bassCircle.x, this.bassCircle.y, wave.radius * 2 - offset);
                    }
                } else {
                    ellipse(this.bassCircle.x, this.bassCircle.y, wave.radius * 2);
                }
            }
            pop();
        });
    }
    
    /**
     * Draw enhanced particles
     */
    drawParticlesEnhanced() {
        this.particles.forEach(particle => {
            // Draw particle trail
            if (particle.trail.length > 1) {
                push();
                noFill();
                strokeWeight(particle.size * 0.5);
                
                for (let i = 0; i < particle.trail.length - 1; i++) {
                    const trail = particle.trail[i];
                    const nextTrail = particle.trail[i + 1];
                    const alpha = (i / particle.trail.length) * particle.alpha * 0.3;
                    
                    stroke(particle.color.r, particle.color.g, particle.color.b, alpha);
                    line(trail.x, trail.y, nextTrail.x, nextTrail.y);
                }
                pop();
            }
            
            // Draw main particle
            const x = this.bassCircle.x + cos(particle.angle) * particle.radius;
            const y = this.bassCircle.y + sin(particle.angle) * particle.radius;
            
            push();
            noStroke();
            
            // Glow effect
            if (particle.energy > 0.5) {
                drawingContext.shadowBlur = 20;
                drawingContext.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`;
            }
            
            fill(particle.color.r, particle.color.g, particle.color.b, particle.alpha);
            ellipse(x, y, particle.size * (1 + sin(particle.pulsePhase) * 0.2));
            pop();
        });
    }
    
    /**
     * Draw geometric patterns
     */
    drawGeometricPatterns() {
        const complexity = map(this.audioData.energy, 0, 255, 3, 12);
        
        push();
        translate(this.bassCircle.x, this.bassCircle.y);
        rotate(this.bassCircle.rotation * 0.5);
        
        for (let i = 0; i < complexity; i++) {
            const angle = (TWO_PI / complexity) * i;
            const distance = this.bassCircle.size * 0.6;
            
            push();
            rotate(angle);
            translate(distance, 0);
            rotate(this.time * 0.02 + i);
            
            const size = map(this.audioData.mid, 0, 255, 10, 30);
            const color = this.getEnergyColor(this.audioData.energy);
            
            fill(color.r, color.g, color.b, 150);
            noStroke();
            rectMode(CENTER);
            rect(0, 0, size, size);
            pop();
        }
        pop();
    }
    
    /**
     * Draw interactive effects
     */
    drawInteractiveEffects() {
        // Draw ripples
        this.ripples.forEach(ripple => {
            push();
            noFill();
            strokeWeight(3);
            stroke(ripple.color.r, ripple.color.g, ripple.color.b, ripple.alpha);
            ellipse(ripple.x, ripple.y, ripple.radius * 2);
            pop();
        });
        
        // Draw mouse influence area
        if (this.interactionStrength > 0) {
            push();
            noFill();
            strokeWeight(2);
            stroke(255, 255, 255, this.interactionStrength * 50);
            ellipse(this.mouseX, this.mouseY, this.mouseInfluence.radius * 2);
            pop();
        }
    }
    
    /**
     * Draw energy waves (original method)
     */
    drawEnergyWaves() {
        this.energyWaves.forEach(wave => {
            push();
            noFill();
            strokeWeight(wave.lineWidth || 2);
            stroke(wave.color.r, wave.color.g, wave.color.b, wave.alpha);
            ellipse(this.bassCircle.x, this.bassCircle.y, wave.radius * 2);
            pop();
        });
    }
    
    /**
     * Draw main bass circle with morphing effects
     */
    drawBassCircle() {
        push();
        
        // Enhanced glow effect
        const glowSize = 100 + this.bassCircle.glowIntensity * 150;
        drawingContext.shadowBlur = glowSize;
        drawingContext.shadowColor = `rgba(${this.bassCircle.color.r}, ${this.bassCircle.color.g}, ${this.bassCircle.color.b}, ${0.7 + this.bassCircle.glowIntensity * 0.3})`;
        
        // Multiple glow rings with resonance
        for (let i = 4; i > 0; i--) {
            noFill();
            strokeWeight(3);
            const resonanceOffset = sin(this.bassCircle.pulsePhase + i) * this.bassCircle.resonance;
            stroke(this.bassCircle.color.r, this.bassCircle.color.g, this.bassCircle.color.b, 100 / i);
            ellipse(this.bassCircle.x, this.bassCircle.y, this.bassCircle.size * (1 + i * 0.25) + resonanceOffset);
        }
        
        // Main circle with morphing effect
        noStroke();
        const bassAlpha = map(this.audioData.bass, 0, 255, 120, 255);
        
        // Create morphing shape
        push();
        translate(this.bassCircle.x, this.bassCircle.y);
        
        // Morph between circle and complex shape
        beginShape();
        for (let angle = 0; angle < TWO_PI; angle += 0.1) {
            const morphAmount = sin(this.bassCircle.morphPhase + angle * 3) * 0.2;
            const radius = this.bassCircle.size / 2 * (1 + morphAmount);
            const x = cos(angle) * radius;
            const y = sin(angle) * radius;
            vertex(x, y);
        }
        endShape(CLOSE);
        
        // Fill with gradient effect
        for (let i = 15; i > 0; i--) {
            const size = this.bassCircle.size * (i / 15);
            const alpha = bassAlpha * (i / 15) * 0.7;
            fill(this.bassCircle.color.r, this.bassCircle.color.g, this.bassCircle.color.b, alpha);
            ellipse(0, 0, size);
        }
        pop();
        
        // Inner core with enhanced pulse
        const coreSize = this.bassCircle.size * 0.4 * (1 + sin(this.bassCircle.pulsePhase) * 0.3);
        fill(255, 255, 255, bassAlpha * 0.9);
        ellipse(this.bassCircle.x, this.bassCircle.y, coreSize);
        
        // Rotating elements with more complexity
        push();
        translate(this.bassCircle.x, this.bassCircle.y);
        rotate(this.bassCircle.rotation);
        
        for (let i = 0; i < 12; i++) {
            const angle = (TWO_PI / 12) * i;
            const distance = this.bassCircle.size * 0.5;
            const x = cos(angle) * distance;
            const y = sin(angle) * distance;
            
            const elementSize = 12 + sin(this.time * 0.1 + i) * 6;
            fill(255, 255, 255, bassAlpha * 0.7);
            ellipse(x, y, elementSize);
            
            // Add orbital elements
            push();
            translate(x, y);
            rotate(this.time * 0.05 + i);
            fill(255, 255, 255, bassAlpha * 0.4);
            ellipse(elementSize, 0, 6);
            pop();
        }
        pop();
        
        pop();
    }
    
    /**
     * Draw particle system
     */
    drawParticles() {
        this.particles.forEach(particle => {
            const x = this.bassCircle.x + cos(particle.angle) * particle.radius;
            const y = this.bassCircle.y + sin(particle.angle) * particle.radius;
            
            push();
            noStroke();
            
            // Add glow for energetic particles
            if (this.audioData.mid > 150) {
                drawingContext.shadowBlur = 15;
                drawingContext.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.6)`;
            }
            
            fill(particle.color.r, particle.color.g, particle.color.b, particle.alpha);
            ellipse(x, y, particle.size);
            pop();
        });
    }
    
    /**
     * Draw sparkle effects
     */
    drawSparkles() {
        this.sparkles.forEach(sparkle => {
            push();
            noStroke();
            
            const alpha = map(sparkle.life, 0, sparkle.maxLife, 0, 255);
            fill(sparkle.color.r, sparkle.color.g, sparkle.color.b, alpha);
            
            // Enhanced star shape
            push();
            translate(sparkle.x, sparkle.y);
            rotate(sparkle.rotation);
            
            const size = sparkle.size * (sparkle.life / sparkle.maxLife);
            
            for (let i = 0; i < 4; i++) {
                rotate(PI / 2);
                ellipse(0, -size / 2, size, size * 2);
            }
            
            // Center glow
            fill(255, 255, 255, alpha * 0.8);
            ellipse(0, 0, size * 0.5);
            pop();
            
            pop();
        });
    }
    
    /**
     * Draw additional visual effects
     */
    drawAdditionalEffects() {
        // Draw frequency bars at the bottom
        if (this.audioData.energy > 50) {
            this.drawFrequencyBars();
        }
    }
    
    /**
     * Draw frequency visualization bars
     */
    drawFrequencyBars() {
        const barCount = 32;
        const barWidth = width / barCount;
        const maxHeight = 120;
        
        push();
        noStroke();
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = map(this.audioData.energy, 0, 255, 10, maxHeight);
            const alpha = map(this.audioData.energy, 0, 255, 50, 200);
            
            const color = this.getEnergyColor(this.audioData.energy);
            fill(color.r, color.g, color.b, alpha);
            
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Add rounded top
            rect(x, y, barWidth - 2, barHeight, 5);
        }
        pop();
    }
    
    /**
     * Draw beat reaction effect
     */
    drawBeatReaction() {
        push();
        noFill();
        strokeWeight(4);
        stroke(255, 255, 255, this.beatReaction * 255);
        
        const size = this.bassCircle.size + this.beatReaction * 150;
        ellipse(this.bassCircle.x, this.bassCircle.y, size);
        pop();
    }
    
    /**
     * Draw mode transition effect
     */
    drawModeTransition() {
        push();
        fill(255, 255, 255, this.modeTransition * 100);
        rect(0, 0, width, height);
        
        fill(255, 255, 255, this.modeTransition * 255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text(this.visualMode.toUpperCase(), width / 2, height / 2);
        pop();
    }
    
    /**
     * Trigger beat reaction
     */
    triggerBeat() {
        this.beatReaction = 1;
        
        // Create beat ripples
        this.ripples.push({
            x: this.bassCircle.x,
            y: this.bassCircle.y,
            radius: 0,
            maxRadius: this.bassCircle.size * 2,
            alpha: 255,
            color: { r: 255, g: 255, b: 255 },
            speed: 8
        });
    }
}

// p5.js setup and draw functions with enhanced interactions
let visualizer;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('visualizerContainer');
    
    visualizer = new MusicVisualizer();
    colorMode(RGB);
    noStroke();
    
    console.log('Enhanced music visualizer initialized');
    
    // Start demo mode for testing
    startDemoMode();
}

function draw() {
    if (visualizer) {
        visualizer.update();
        visualizer.draw();
    }
}

function mouseMoved() {
    if (visualizer) {
        visualizer.updateMousePosition(mouseX, mouseY);
    }
}

function mousePressed() {
    if (visualizer) {
        visualizer.handleMouseClick();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Demo mode for testing without audio
let demoInterval;
let demoTime = 0;

function startDemoMode() {
    if (demoInterval) {
        clearInterval(demoInterval);
    }
    
    // Show demo indicator
    const demoIndicator = document.getElementById('demoIndicator');
    if (demoIndicator) {
        demoIndicator.classList.add('active');
    }
    
    demoInterval = setInterval(() => {
        if (visualizer && (!window.app || !window.app.audioController || !window.app.audioController.isPlaying)) {
            // Generate demo audio data
            demoTime += 0.05;
            
            const bass = map(sin(demoTime * 2), -1, 1, 50, 255) * (sin(demoTime * 0.5) * 0.5 + 0.5);
            const mid = map(sin(demoTime * 4), -1, 1, 50, 200) * (sin(demoTime * 0.3) * 0.3 + 0.7);
            const treble = map(sin(demoTime * 8), -1, 1, 100, 255) * (sin(demoTime * 0.7) * 0.7 + 0.3);
            const energy = (bass + mid + treble) / 3;
            
            visualizer.updateAudioData({
                bass: Math.max(0, Math.min(255, bass)),
                mid: Math.max(0, Math.min(255, mid)),
                treble: Math.max(0, Math.min(255, treble)),
                energy: Math.max(0, Math.min(255, energy))
            });
        }
    }, 50); // 20 FPS
    
    console.log('Demo mode started');
}

function stopDemoMode() {
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    
    // Hide demo indicator
    const demoIndicator = document.getElementById('demoIndicator');
    if (demoIndicator) {
        demoIndicator.classList.remove('active');
    }
    
    console.log('Demo mode stopped');
}

// Make demo functions global
window.startDemoMode = startDemoMode;
window.stopDemoMode = stopDemoMode;
