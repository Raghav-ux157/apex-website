/**
 * ============================================================================
 * APEX HAUTE HORLOGERIE — INTERACTIVE WATCH ENGINE & WEB EXPERIENCE
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. HOROLOGICAL STATE & CONFIGURATION
     -------------------------------------------------------------------------- */
  const STATE = {
    // Current live time
    hours: 10,
    minutes: 10,
    seconds: 36,
    subsecond: 0,

    // Configurator state
    material: 'gold', // 'gold' | 'titanium' | 'carbon'
    strap: 'alligator', // 'alligator' | 'calfskin' | 'mesh' | 'rubber'
    angle: 'dial', // 'dial' | 'caseback' | 'profile'

    // Sound state
    soundEnabled: false,
    audioCtx: null,
    tickTimer: null,
    tickAlt: false,

    // Pricing matrix
    basePrices: {
      gold: 78000,
      titanium: 62000,
      carbon: 66000
    },
    strapPrices: {
      alligator: 6500,
      calfskin: 3200,
      mesh: 4800,
      rubber: 2400
    },

    // Collections Data
    collections: [
      {
        id: 'chrono-tourbillon',
        title: 'Apex Chrono-Tourbillon',
        category: 'complication',
        caliber: 'Calibre APX-01T',
        price: '$128,000',
        badge: 'Limited Edition 25 pcs',
        desc: 'Single-pusher column-wheel chronograph paired with a flying 60-second tourbillon, hand-beveled in 18K Honey Gold.',
        specs: {
          diameter: '41.5 mm',
          thickness: '11.2 mm',
          power: '72 Hours',
          frequency: '28,800 vph (4 Hz)',
          water: '50 Meters',
          jewels: '39 Rubies'
        }
      },
      {
        id: 'nautilus-skeleton',
        title: 'Apex Architecture Skeleton',
        category: 'skeleton',
        caliber: 'Calibre APX-02S',
        price: '$84,500',
        badge: 'Openworked Haute Horlogerie',
        desc: 'Three-dimensional sculptural openworking exposing the entire geartrain, anthracite NAC-coated bridges, and double barrel.',
        specs: {
          diameter: '40.0 mm',
          thickness: '9.4 mm',
          power: '80 Hours',
          frequency: '21,600 vph (3 Hz)',
          water: '100 Meters',
          jewels: '33 Rubies'
        }
      },
      {
        id: 'meridian-perpetual',
        title: 'Apex Meridian Perpetual',
        category: 'complication',
        caliber: 'Calibre APX-03QP',
        price: '$145,000',
        badge: 'Grand Complication',
        desc: 'Secular perpetual calendar with aventurine sky disc, realistic hand-engraved gold moonphase, and leap year indicator.',
        specs: {
          diameter: '42.0 mm',
          thickness: '10.8 mm',
          power: '65 Hours',
          frequency: '28,800 vph (4 Hz)',
          water: '30 Meters',
          jewels: '44 Rubies'
        }
      },
      {
        id: 'deepsea-chronometer',
        title: 'Apex DeepSea Forged Carbon',
        category: 'chronometer',
        caliber: 'Calibre APX-04D',
        price: '$46,000',
        badge: 'COSC Certified Chronometer',
        desc: 'Monolithic forged carbon case with Grade 5 titanium inner capsule, automatic helium escape valve, and ceramic bezel.',
        specs: {
          diameter: '43.0 mm',
          thickness: '12.8 mm',
          power: '70 Hours',
          frequency: '28,800 vph (4 Hz)',
          water: '300 Meters',
          jewels: '31 Rubies'
        }
      }
    ]
  };

  /* --------------------------------------------------------------------------
     2. MECHANICAL ESCAPEMENT AUDIO SYNTHESIS (Web Audio API)
     -------------------------------------------------------------------------- */
  function initAudio() {
    if (!STATE.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        STATE.audioCtx = new AudioContext();
      }
    }
    if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') {
      STATE.audioCtx.resume();
    }
  }

  function playEscapementTick() {
    if (!STATE.soundEnabled || !STATE.audioCtx) return;

    try {
      const now = STATE.audioCtx.currentTime;
      // High-beat alternating frequency: pallet jewel impact simulation
      const baseFreq = STATE.tickAlt ? 2400 : 3100;
      STATE.tickAlt = !STATE.tickAlt;

      // 1. Noise impulse for the crisp metallic click
      const bufferSize = STATE.audioCtx.sampleRate * 0.008; // 8ms burst
      const buffer = STATE.audioCtx.createBuffer(1, bufferSize, STATE.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = STATE.audioCtx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter centered at horological strike timbre
      const filter = STATE.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq, now);
      filter.Q.setValueAtTime(12, now);

      // Amplitude envelope
      const gain = STATE.audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(STATE.audioCtx.destination);

      noise.start(now);
      noise.stop(now + 0.02);

      // 2. Subtle jewel resonance ring
      const osc = STATE.audioCtx.createOscillator();
      const oscGain = STATE.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 1.5, now);
      oscGain.gain.setValueAtTime(0.03, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(oscGain);
      oscGain.connect(STATE.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      console.warn('Audio tick playback error:', e);
    }
  }

  function toggleSound(btn) {
    initAudio();
    STATE.soundEnabled = !STATE.soundEnabled;

    if (STATE.soundEnabled) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.querySelector('.sound-label').textContent = 'Escapement: Active';
      // 4 Hz = 8 ticks/second -> 125ms intervals
      if (!STATE.tickTimer) {
        STATE.tickTimer = setInterval(playEscapementTick, 125);
      }
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
      btn.querySelector('.sound-label').textContent = 'Escapement: Silent';
      if (STATE.tickTimer) {
        clearInterval(STATE.tickTimer);
        STATE.tickTimer = null;
      }
    }
  }

  /* --------------------------------------------------------------------------
     3. HIGH-PRECISION WATCH CANVAS RENDERER
     -------------------------------------------------------------------------- */
  function getMaterialColors(material) {
    switch (material) {
      case 'titanium':
        return {
          caseGrad1: '#cbd5e1',
          caseGrad2: '#94a3b8',
          caseGrad3: '#475569',
          bezelRim: '#e2e8f0',
          accent: '#cbd5e1',
          highlight: '#ffffff'
        };
      case 'carbon':
        return {
          caseGrad1: '#27272a',
          caseGrad2: '#18181b',
          caseGrad3: '#09090b',
          bezelRim: '#3f3f46',
          accent: '#c5a059',
          highlight: '#71717a'
        };
      case 'gold':
      default:
        return {
          caseGrad1: '#f6e8cc',
          caseGrad2: '#c5a059',
          caseGrad3: '#856325',
          bezelRim: '#dfcaa0',
          accent: '#c5a059',
          highlight: '#fff7e6'
        };
    }
  }

  function getStrapColor(strap) {
    switch (strap) {
      case 'calfskin': return '#4a2c16';
      case 'mesh': return '#788292';
      case 'rubber': return '#121316';
      case 'alligator':
      default:
        return '#0d0e12';
    }
  }

  /**
   * Draw the Dial Face
   */
  function drawWatchDial(ctx, width, height, time, material, strap) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.44;
    const colors = getMaterialColors(material);

    ctx.clearRect(0, 0, width, height);

    // --- 1. Strap preview top & bottom ---
    const strapW = radius * 0.76;
    const strapH = radius * 0.4;
    ctx.save();
    ctx.fillStyle = getStrapColor(strap);
    // Top strap
    ctx.fillRect(cx - strapW / 2, cy - radius * 1.12, strapW, strapH);
    // Bottom strap
    ctx.fillRect(cx - strapW / 2, cy + radius * 0.72, strapW, strapH);
    // Strap stitches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - strapW / 2 + 4, cy - radius * 1.12, strapW - 8, strapH);
    ctx.strokeRect(cx - strapW / 2 + 4, cy + radius * 0.72, strapW - 8, strapH);
    ctx.restore();

    // --- 2. Outer Case & Bezel ---
    const caseGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    caseGrad.addColorStop(0, colors.caseGrad1);
    caseGrad.addColorStop(0.3, colors.caseGrad2);
    caseGrad.addColorStop(0.7, colors.caseGrad3);
    caseGrad.addColorStop(1, colors.caseGrad1);

    // Case drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = caseGrad;
    ctx.fill();
    ctx.restore();

    // Screw-down Crown at 3 o'clock
    ctx.save();
    const crownW = radius * 0.12;
    const crownH = radius * 0.22;
    ctx.fillStyle = colors.caseGrad2;
    ctx.fillRect(cx + radius * 1.02, cy - crownH / 2, crownW, crownH);
    // Crown cabochon sapphire
    ctx.beginPath();
    ctx.arc(cx + radius * 1.02 + crownW, cy, crownH * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();
    ctx.restore();

    // Bezel inner rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2);
    ctx.strokeStyle = colors.bezelRim;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- 3. Main Dial Bed ---
    const dialRadius = radius * 0.94;
    const dialGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, dialRadius);
    dialGrad.addColorStop(0, '#13151a');
    dialGrad.addColorStop(0.65, '#0b0c0f');
    dialGrad.addColorStop(1, '#050507');

    ctx.beginPath();
    ctx.arc(cx, cy, dialRadius, 0, Math.PI * 2);
    ctx.fillStyle = dialGrad;
    ctx.fill();

    // Guilloché concentric texture
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 0.8;
    for (let r = 25; r < dialRadius; r += 7) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // --- 4. Subdial at 6: Flying Tourbillon / Small Seconds ---
    const subCx = cx;
    const subCy = cy + dialRadius * 0.42;
    const subRadius = dialRadius * 0.32;

    // Subdial background opening
    ctx.save();
    ctx.beginPath();
    ctx.arc(subCx, subCy, subRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#060709';
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rotating Tourbillon cage
    const tourbillonAngle = (time.seconds + time.subsecond) * (Math.PI / 30); // 60s rotation
    ctx.save();
    ctx.translate(subCx, subCy);
    ctx.rotate(tourbillonAngle);

    // Bridge
    ctx.beginPath();
    ctx.moveTo(-subRadius * 0.8, 0);
    ctx.lineTo(subRadius * 0.8, 0);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Oscillating Balance Wheel (4 Hz harmonic oscillation)
    const balanceOsc = Math.sin((time.seconds + time.subsecond) * Math.PI * 8) * 0.45;
    ctx.rotate(balanceOsc);
    ctx.beginPath();
    ctx.arc(0, 0, subRadius * 0.62, 0, Math.PI * 2);
    ctx.strokeStyle = '#dfcaa0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Central ruby jewel
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e11d48';
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // Subdial small seconds ticks
    ctx.save();
    ctx.translate(subCx, subCy);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (subRadius - 5), Math.sin(a) * (subRadius - 5));
      ctx.lineTo(Math.cos(a) * (subRadius - 2), Math.sin(a) * (subRadius - 2));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // --- 5. Date Window at 3 o'clock ---
    const dateX = cx + dialRadius * 0.58;
    const dateY = cy;
    ctx.save();
    ctx.fillStyle = '#090a0d';
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(dateX - 16, dateY - 11, 32, 22);
    ctx.fillRect(dateX - 16, dateY - 11, 32, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(new Date().getDate().toString(), dateX, dateY);
    ctx.restore();

    // --- 6. Brand Inscription ---
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '500 14px Playfair Display, serif';
    ctx.letterSpacing = '5px';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('APEX', cx, cy - dialRadius * 0.42);

    ctx.font = '500 7px JetBrains Mono, monospace';
    ctx.fillStyle = colors.accent;
    ctx.fillText('HAUTE HORLOGERIE', cx, cy - dialRadius * 0.33);
    ctx.fillText('GENÈVE', cx, cy - dialRadius * 0.25);
    ctx.restore();

    // --- 7. Hour & Minute Indices ---
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI) / 30;
      const isHour = i % 5 === 0;
      const outerR = dialRadius - 6;
      const innerR = isHour ? dialRadius - 22 : dialRadius - 12;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);

      if (isHour) {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }
    ctx.restore();

    // --- 8. Precision Hands ---
    const secVal = time.seconds + time.subsecond;
    const minVal = time.minutes + secVal / 60;
    const hourVal = (time.hours % 12) + minVal / 60;

    const hourAngle = hourVal * (Math.PI / 6) - Math.PI / 2;
    const minAngle = minVal * (Math.PI / 30) - Math.PI / 2;
    const secAngle = secVal * (Math.PI / 30) - Math.PI / 2;

    // Hour Hand (Faceted Sword Hand)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hourAngle);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, -dialRadius * 0.55);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // Minute Hand (Extended Sword Hand)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(minAngle);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(0, -dialRadius * 0.78);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fillStyle = colors.highlight;
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Sweeping Seconds Hand (High-beat Needle + Counterweight)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(secAngle);
    ctx.beginPath();
    ctx.moveTo(0, dialRadius * 0.22);
    ctx.lineTo(0, -dialRadius * 0.85);
    ctx.strokeStyle = '#dfcaa0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Counterweight circle
    ctx.beginPath();
    ctx.arc(0, dialRadius * 0.12, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();

    // Central Canon Pinion Cap
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();

    // --- 9. Sapphire Crystal Anti-Reflective Sheen ---
    const sheenGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheenGrad.addColorStop(0.35, 'rgba(147, 197, 253, 0.05)');
    sheenGrad.addColorStop(0.5, 'transparent');
    sheenGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.04)');

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.94, 0, Math.PI * 2);
    ctx.fillStyle = sheenGrad;
    ctx.fill();
  }

  /**
   * Draw the Exhibition Caseback (Mechanical Calibre APX-01)
   */
  function drawWatchCaseback(ctx, width, height, time, material) {
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.44;
    const colors = getMaterialColors(material);

    ctx.clearRect(0, 0, width, height);

    // Caseback Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = colors.caseGrad2;
    ctx.fill();

    // Inscribed Exhibition Bezel
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.94, 0, Math.PI * 2);
    ctx.strokeStyle = colors.bezelRim;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('• APEX MANUFACTURE • SWISS • 39 JEWELS • 50M • CAL. APX-01 • PIÈCE UNIQUE •', cx, cy - radius * 0.98);
    ctx.restore();

    // Inner Sapphire view into movement
    const movRadius = radius * 0.9;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, movRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#12141a';
    ctx.fill();
    ctx.clip();

    // Côtes de Genève (Geneva Stripes on Bridges)
    const stripeW = 16;
    for (let x = cx - movRadius; x < cx + movRadius; x += stripeW) {
      const stripeGrad = ctx.createLinearGradient(x, 0, x + stripeW, 0);
      stripeGrad.addColorStop(0, '#222530');
      stripeGrad.addColorStop(0.5, '#2e3342');
      stripeGrad.addColorStop(1, '#1b1d26');
      ctx.fillStyle = stripeGrad;
      ctx.fillRect(x, cy - movRadius, stripeW, movRadius * 2);
    }

    // Circular perlage plate details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 30; i++) {
      const px = cx + (Math.sin(i * 1.8) * movRadius * 0.7);
      const py = cy + (Math.cos(i * 1.4) * movRadius * 0.7);
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exposed Gear Train Wheels (Bronze & Steel)
    function drawGear(gx, gy, gr, teeth, color) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cutout spokes
      for (let s = 0; s < 5; s++) {
        const sa = (s * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(gx + Math.cos(sa) * gr * 0.5, gy + Math.sin(sa) * gr * 0.5, gr * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#12141a';
        ctx.fill();
      }
      ctx.restore();
    }

    drawGear(cx - movRadius * 0.35, cy - movRadius * 0.2, 42, 24, '#b48a3c');
    drawGear(cx + movRadius * 0.4, cy + movRadius * 0.15, 34, 18, '#8c7038');

    // Synthetic Ruby Jewels (with gold chatons and blued screws)
    const jewelPositions = [
      [cx - 40, cy + 30],
      [cx + 50, cy - 40],
      [cx - 60, cy - 50],
      [cx + 30, cy + 60],
      [cx, cy - 65]
    ];

    jewelPositions.forEach(([jx, jy]) => {
      // Gold chaton
      ctx.beginPath();
      ctx.arc(jx, jy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#c5a059';
      ctx.fill();
      // Ruby jewel
      ctx.beginPath();
      ctx.arc(jx, jy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e11d48';
      ctx.fill();
      // Jewel reflection
      ctx.beginPath();
      ctx.arc(jx - 1.5, jy - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // Blued Screws (heat-blued high horology screws)
    const screwPositions = [
      [cx - 70, cy + 20],
      [cx + 70, cy - 20],
      [cx - 20, cy - 70],
      [cx + 20, cy + 70]
    ];

    screwPositions.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb'; // Blued steel
      ctx.fill();
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Screw slot
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy);
      ctx.lineTo(sx + 3, sy);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Skeletonized 22K Gold Rotor (Oscillating Weight)
    const rotorAngle = (time.seconds + time.subsecond) * 0.4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotorAngle);

    // Half-circle weighted sector
    ctx.beginPath();
    ctx.arc(0, 0, movRadius * 0.95, 0, Math.PI);
    ctx.arc(0, 0, movRadius * 0.35, Math.PI, 0, true);
    ctx.closePath();

    const rotorGrad = ctx.createLinearGradient(-movRadius, 0, movRadius, 0);
    rotorGrad.addColorStop(0, '#f6e8cc');
    rotorGrad.addColorStop(0.5, '#c5a059');
    rotorGrad.addColorStop(1, '#856325');
    ctx.fillStyle = rotorGrad;
    ctx.fill();
    ctx.strokeStyle = '#fff2d8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotor Openworked Architectural Cutouts
    ctx.fillStyle = '#12141a';
    ctx.beginPath();
    ctx.arc(0, movRadius * 0.6, 20, 0, Math.PI * 2);
    ctx.fill();

    // Inscription on Rotor
    ctx.save();
    ctx.fillStyle = '#3a270a';
    ctx.font = '700 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('APEX MANUFACTURE • 22K SOLID GOLD', 0, movRadius * 0.82);
    ctx.restore();

    // Central rotor bearing
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // end clip
  }

  /**
   * Draw the Ultra-Thin Profile & Ergonomic Crown View
   */
  function drawWatchProfile(ctx, width, height, material) {
    const cx = width / 2;
    const cy = height / 2;
    const colors = getMaterialColors(material);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Watch Case Side Silhouette (9.8mm ultra-thin geometry)
    const profileW = width * 0.75;
    const profileH = 48; // Represents thin profile

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 15;

    // Curved Domed Sapphire on top
    ctx.beginPath();
    ctx.ellipse(cx, cy - profileH / 2 + 2, profileW * 0.42, 12, 0, Math.PI, 0);
    ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Middle Case
    const sideGrad = ctx.createLinearGradient(0, cy - profileH / 2, 0, cy + profileH / 2);
    sideGrad.addColorStop(0, colors.caseGrad1);
    sideGrad.addColorStop(0.35, colors.caseGrad2);
    sideGrad.addColorStop(0.7, colors.caseGrad3);
    sideGrad.addColorStop(1, colors.caseGrad1);

    // Sculpted ergonomic lug curvature
    ctx.beginPath();
    ctx.moveTo(cx - profileW / 2, cy + 18);
    ctx.quadraticCurveTo(cx - profileW * 0.35, cy - profileH / 2, cx - profileW * 0.2, cy - profileH / 2);
    ctx.lineTo(cx + profileW * 0.2, cy - profileH / 2);
    ctx.quadraticCurveTo(cx + profileW * 0.35, cy - profileH / 2, cx + profileW / 2, cy + 18);
    ctx.lineTo(cx + profileW * 0.42, cy + profileH / 2);
    ctx.quadraticCurveTo(cx, cy + profileH / 2 + 4, cx - profileW * 0.42, cy + profileH / 2);
    ctx.closePath();

    ctx.fillStyle = sideGrad;
    ctx.fill();
    ctx.strokeStyle = colors.bezelRim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Satin brushed flank lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.8;
    for (let y = cy - 8; y <= cy + 8; y += 4) {
      ctx.beginPath();
      ctx.moveTo(cx - profileW * 0.35, y);
      ctx.lineTo(cx + profileW * 0.35, y);
      ctx.stroke();
    }

    // Fluted Crown on the right flank
    const crownX = cx + profileW * 0.38;
    ctx.beginPath();
    ctx.roundRect(crownX, cy - 14, 18, 28, 3);
    ctx.fillStyle = colors.caseGrad1;
    ctx.fill();
    ctx.strokeStyle = colors.caseGrad3;
    ctx.stroke();

    // Crown Flutes
    for (let c = cy - 10; c <= cy + 10; c += 4) {
      ctx.beginPath();
      ctx.moveTo(crownX, c);
      ctx.lineTo(crownX + 18, c);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Cabochon sapphire jewel on crown tip
    ctx.beginPath();
    ctx.ellipse(crownX + 18, cy, 4, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.fill();

    // Technical annotation
    ctx.fillStyle = colors.accent;
    ctx.font = '500 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('9.8 MM ULTRA-SLIM ARCHITECTURE', cx, cy + 50);
    ctx.fillText('INTEGRATED ERGONOMIC LUGS', cx, cy + 68);
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     4. RENDER LOOP MANAGER
     -------------------------------------------------------------------------- */
  function startRenderLoops() {
    const heroCanvas = document.getElementById('heroWatchCanvas');
    const configCanvas = document.getElementById('configWatchCanvas');

    let heroCtx = null;
    let configCtx = null;

    if (heroCanvas) {
      heroCtx = heroCanvas.getContext('2d');
      // Set high-DPI scaling
      const dpr = window.devicePixelRatio || 1;
      heroCanvas.width = 520 * dpr;
      heroCanvas.height = 520 * dpr;
      heroCtx.scale(dpr, dpr);
    }

    if (configCanvas) {
      configCtx = configCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      configCanvas.width = 440 * dpr;
      configCanvas.height = 440 * dpr;
      configCtx.scale(dpr, dpr);
    }

    function render(timestamp) {
      const now = new Date();
      STATE.hours = now.getHours();
      STATE.minutes = now.getMinutes();
      STATE.seconds = now.getSeconds();
      STATE.subsecond = now.getMilliseconds() / 1000;

      // Render Hero Canvas (always live interactive dial)
      if (heroCtx) {
        drawWatchDial(heroCtx, 520, 520, STATE, 'gold', 'alligator');
      }

      // Render Configurator Canvas (depends on selected angle and material)
      if (configCtx) {
        if (STATE.angle === 'dial') {
          drawWatchDial(configCtx, 440, 440, STATE, STATE.material, STATE.strap);
        } else if (STATE.angle === 'caseback') {
          drawWatchCaseback(configCtx, 440, 440, STATE, STATE.material);
        } else if (STATE.angle === 'profile') {
          drawWatchProfile(configCtx, 440, 440, STATE.material);
        }
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  /* --------------------------------------------------------------------------
     5. INTERACTIVE CONTROLS & UI EVENT HANDLERS
     -------------------------------------------------------------------------- */
  function updateConfiguratorPrice() {
    const base = STATE.basePrices[STATE.material] || 78000;
    const strap = STATE.strapPrices[STATE.strap] || 6500;
    const total = base + strap;

    const priceEl = document.getElementById('configPriceDisplay');
    if (priceEl) {
      priceEl.textContent = '$' + total.toLocaleString();
    }

    const matNameEl = document.getElementById('selectedMaterialLabel');
    if (matNameEl) {
      const names = {
        gold: '18K Honey Gold (Manufacture Alloy)',
        titanium: 'Aerospace Grade 5 Titanium',
        carbon: 'Monolithic Forged Carbon & DLC'
      };
      matNameEl.textContent = names[STATE.material] || STATE.material;
    }

    const strapNameEl = document.getElementById('selectedStrapLabel');
    if (strapNameEl) {
      const names = {
        alligator: 'Hand-Stitched Mississippiensis Alligator',
        calfskin: 'Bespoke Patina Saddle Calfskin',
        mesh: 'Milanese Mesh Grade 5 Titanium',
        rubber: 'Vulcanized FKM Technical Rubber'
      };
      strapNameEl.textContent = names[STATE.strap] || STATE.strap;
    }
  }

  function setupConfigurator() {
    // Material swatches
    const matButtons = document.querySelectorAll('.mat-swatch-btn');
    matButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        matButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.material = btn.dataset.material;
        updateConfiguratorPrice();
      });
    });

    // Strap swatches
    const strapButtons = document.querySelectorAll('.strap-swatch-btn');
    strapButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        strapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.strap = btn.dataset.strap;
        updateConfiguratorPrice();
      });
    });

    // Angle buttons
    const angleButtons = document.querySelectorAll('.angle-btn');
    angleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        angleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.angle = btn.dataset.angle;
      });
    });

    updateConfiguratorPrice();
  }

  function setupCraftsmanshipTabs() {
    const tabBtns = document.querySelectorAll('.craft-tab-btn');
    const tabContents = document.querySelectorAll('.craft-tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = 'tab-' + btn.dataset.tab;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  function setupCollectionsFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.collection-card');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        cards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  function setupConciergeModal() {
    const modal = document.getElementById('conciergeModal');
    const openBtns = document.querySelectorAll('.open-concierge-btn');
    const closeBtn = document.getElementById('closeConciergeBtn');
    const form = document.getElementById('conciergeForm');
    const confirmationCard = document.getElementById('conciergeConfirmation');

    if (!modal) return;

    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.showModal();
        if (confirmationCard) confirmationCard.classList.remove('active');
        if (form) {
          form.style.display = 'block';
          form.reset();
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.close();
      });
    }

    // Click outside backdrop to close
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) {
        modal.close();
      }
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = document.getElementById('conciergeName').value;
        const salon = document.getElementById('conciergeSalon').value;

        // Generate luxury confirmation code
        const refCode = 'APX-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('confirmClientName').textContent = clientName;
        document.getElementById('confirmSalon').textContent = salon;
        document.getElementById('confirmRefCode').textContent = refCode;

        form.style.display = 'none';
        confirmationCard.classList.add('active');
      });
    }
  }

  function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  function setupMobileMenu() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        const expanded = navLinks.classList.contains('mobile-open');
        toggle.setAttribute('aria-expanded', expanded.toString());
      });

      // Close menu when link is clicked
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('mobile-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function setupParallaxTilt() {
    const wrapper = document.querySelector('.watch-canvas-wrapper');
    const canvas = document.getElementById('heroWatchCanvas');
    if (!wrapper || !canvas) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rotX = ((y - cy) / cy) * -9; // Max 9 deg tilt
      const rotY = ((x - cx) / cx) * 9;

      canvas.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    });

    wrapper.addEventListener('mouseleave', () => {
      canvas.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  }

  /* --------------------------------------------------------------------------
     6. INITIALIZATION ENTRY POINT
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    startRenderLoops();
    setupConfigurator();
    setupCraftsmanshipTabs();
    setupCollectionsFilter();
    setupConciergeModal();
    setupHeaderScroll();
    setupMobileMenu();
    setupParallaxTilt();

    // Escapement sound button listener
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => toggleSound(soundBtn));
    }
  });

})();
