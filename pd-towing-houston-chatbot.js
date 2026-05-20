/* ============================================================
   DEE — PD Towing of Houston Dispatch Assistant
   Conversation-tree chatbot, glassmorphic FAB widget.
   Modeled on the ido-ai-chatbot-module pattern.
   ============================================================ */
(function () {
  'use strict';

  // ====== Knowledge base (loaded from PD intake) ======
  const PD = {
    phone: '832-496-6891',
    phoneLink: 'tel:8324966891',
    email: 'info@pdtowingofhouston.com',
    address: '15201 Mason Rd, Ste 1000 #163, Cypress, TX 77433',
    hours: '24 hours a day, 7 days a week, 365 days a year',
    serviceArea: ['Houston', 'Cypress', 'Katy', 'Tomball', 'The Woodlands', 'Sugarland', 'Conroe', 'Plantersville', 'Willis', 'Magnolia'],
    storageFacilities: ['KTL Auto Storage', 'Minetta Auto Storage', 'Off The Hook Auto Storage', 'Conklin Auto Storage', 'Farrell Auto Storage'],
    yearsInBusiness: 15,
    tagline: 'The Private Property Specialists'
  };

  // ====== Conversation tree ======
  const TREE = {
    root: {
      bot: "Hey — I'm Dee, dispatch at PD Towing of Houston. What's going on tonight?",
      options: [
        { label: "I think I got towed.", goto: 'towed' },
        { label: "How do I get my vehicle back?", goto: 'retrieve' },
        { label: "What are your rates?", goto: 'rates' },
        { label: "I want to sign up my property.", goto: 'signup' },
        { label: "What areas do you serve?", goto: 'areas' }
      ]
    },

    towed: {
      bot: "Got it. First — was your vehicle parked on a private property (apartment, strip mall, HOA) with PD Towing signage? If yes, there's a strong chance we have it.",
      options: [
        { label: "Yes, there were PD signs.", goto: 'towed_yes' },
        { label: "I'm not sure where it was parked.", goto: 'towed_unsure' },
        { label: "I just need to find my car.", goto: 'find_car' }
      ]
    },
    towed_yes: {
      bot: "Then we likely have it. Give the office a ring at " + PD.phone + " — we'll tell you exactly which of our 5 partner storage lots it went to. We answer 24/7. You'll need photo ID and proof of registration to retrieve.",
      options: [
        { label: "Call now.", action: 'call' },
        { label: "What do I need to bring?", goto: 'retrieve' },
        { label: "Start over.", goto: 'root' }
      ]
    },
    towed_unsure: {
      bot: "No problem. Two options: (1) Call us at " + PD.phone + " — give us the make, model, and the property address where you parked, we'll check our log. (2) If we don't have it, call the Houston Police Department towline at 713-308-8580 or Harris County Sheriff's at 713-755-6042.",
      options: [
        { label: "Call PD now.", action: 'call' },
        { label: "I'll try the police line.", goto: 'find_car' },
        { label: "Start over.", goto: 'root' }
      ]
    },
    find_car: {
      bot: "If PD didn't tow it, try one of these: Houston Police Dept towline 713-308-8580, Harris County Sheriff's towline 713-755-6042. Most private-property tows in our area come through us or one of those two lines.",
      options: [
        { label: "Got it — call PD anyway.", action: 'call' },
        { label: "Start over.", goto: 'root' }
      ]
    },

    retrieve: {
      bot: "Three things to retrieve a vehicle from one of our partner lots:\n\n1. **Photo ID** (driver's license)\n2. **Proof of vehicle ownership** (title, registration, or insurance)\n3. **Payment** — most lots accept major cards plus cash\n\nYou'll get a printed receipt at retrieval. Want me to send you to the call line?",
      options: [
        { label: "Yes, connect me.", action: 'call' },
        { label: "Which lot do I go to?", goto: 'storage' },
        { label: "Start over.", goto: 'root' }
      ]
    },
    storage: {
      bot: "We work with 5 state-licensed storage facilities — KTL, Minetta, Off The Hook, Conklin, Farrell — all within about 20 minutes of the community your vehicle was towed from. Call us at " + PD.phone + " and we'll tell you which specific lot has your vehicle.",
      options: [
        { label: "Call now.", action: 'call' },
        { label: "Start over.", goto: 'root' }
      ]
    },

    rates: {
      bot: "Towing rates are governed by the Texas Department of Licensing & Regulation and vary by vehicle type and circumstance. We can't quote a flat number in chat — it'd be misleading. Our office can confirm rates instantly when you call.",
      options: [
        { label: "Got it, call the office.", action: 'call' },
        { label: "What about for property managers?", goto: 'signup' },
        { label: "Start over.", goto: 'root' }
      ]
    },

    signup: {
      bot: "Welcome — this is what we love doing. We'll come walk your property, photograph the trouble spots, and send back a plain-language audit within 48 hours. No commitment, no pressure. What kind of property?",
      options: [
        { label: "Apartment community", goto: 'signup_form' },
        { label: "Strip mall / commercial", goto: 'signup_form' },
        { label: "HOA / townhomes", goto: 'signup_form' },
        { label: "Something else", goto: 'signup_form' }
      ]
    },
    signup_form: {
      bot: "Drop your contact info and we'll be in touch within one business day to schedule the walkthrough.",
      form: ['name', 'property', 'phone', 'email'],
      onSubmit: 'capture_lead'
    },

    areas: {
      bot: "We patrol and tow across 9 cities out of our Cypress base: **Houston, Cypress, Katy, Tomball, The Woodlands, Sugarland, Conroe, Plantersville, Willis & Magnolia.** If your property is in or between any of these, we cover you.",
      options: [
        { label: "Sign up my property.", goto: 'signup' },
        { label: "Call to confirm coverage.", action: 'call' },
        { label: "Start over.", goto: 'root' }
      ]
    }
  };

  // ====== Capture lead ======
  function captureLead(data) {
    data.submittedAt = new Date().toISOString();
    data.source = 'dee-chat';
    const leads = JSON.parse(localStorage.getItem('pdt_leads') || '[]');
    leads.push(data);
    localStorage.setItem('pdt_leads', JSON.stringify(leads));
  }

  // ====== Render markdown-light (bold) ======
  function renderText(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  }

  // ====== Build the widget ======
  function build() {
    const root = document.getElementById('dee-chat-root');
    if (!root) return;

    root.innerHTML = `
      <style>
        #dee-fab { position: relative; }
        .dee-fab-btn {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
          border: 2px solid rgba(125,211,252,0.3);
          color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 16px 40px -10px rgba(37,99,235,0.6), 0 0 0 6px rgba(37,99,235,0.08);
          transition: all 0.3s;
          position: relative;
        }
        .dee-fab-btn:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 24px 50px -10px rgba(37,99,235,0.8); }
        .dee-fab-btn svg { width: 26px; height: 26px; }
        .dee-pulse {
          position: absolute; inset: -6px; border-radius: 50%;
          border: 2px solid #7dd3fc; opacity: 0;
          animation: deepulse 2.4s infinite;
          pointer-events: none;
        }
        @keyframes deepulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .dee-badge {
          position: absolute; top: -4px; right: -4px;
          background: #ef4444; color: white;
          font-size: 11px; font-weight: 700;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #050a14;
        }
        .dee-panel {
          position: absolute; bottom: 80px; right: 0;
          width: 380px; max-width: calc(100vw - 32px);
          height: 540px; max-height: calc(100vh - 120px);
          background: rgba(10,25,41,0.96);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(125,211,252,0.22);
          border-radius: 20px;
          display: none; flex-direction: column;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6), 0 0 60px -20px rgba(37,99,235,0.4);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
          color: #f4f6f8;
        }
        .dee-panel.open { display: flex; animation: deeIn 0.3s ease; }
        @keyframes deeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dee-head {
          padding: 18px 20px; display: flex; align-items: center; gap: 12px;
          background: linear-gradient(135deg, rgba(37,99,235,0.18) 0%, transparent 100%);
          border-bottom: 1px solid rgba(125,211,252,0.12);
        }
        .dee-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1e3a8a);
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 17px;
          border: 2px solid rgba(125,211,252,0.35);
          font-family: 'Fraunces', serif;
        }
        .dee-head-text strong { display: block; font-size: 15px; font-weight: 600; }
        .dee-head-text span { font-size: 11.5px; color: #7dd3fc; display: flex; align-items: center; gap: 6px; margin-top: 3px; }
        .dee-head-text span::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .dee-close {
          margin-left: auto; padding: 6px;
          background: none; border: none; color: #94a3b8;
          cursor: pointer; transition: color 0.2s;
        }
        .dee-close:hover { color: white; }
        .dee-body {
          flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: rgba(125,211,252,0.3) transparent;
        }
        .dee-body::-webkit-scrollbar { width: 6px; }
        .dee-body::-webkit-scrollbar-thumb { background: rgba(125,211,252,0.25); border-radius: 999px; }
        .dee-msg {
          padding: 12px 16px; border-radius: 16px;
          max-width: 88%; font-size: 14.5px; line-height: 1.5;
          animation: deeMsgIn 0.35s ease;
        }
        @keyframes deeMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .dee-msg.bot {
          background: rgba(125,211,252,0.08);
          border: 1px solid rgba(125,211,252,0.12);
          align-self: flex-start;
          border-top-left-radius: 4px;
        }
        .dee-msg.bot strong { color: #7dd3fc; font-weight: 600; }
        .dee-msg.user {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          align-self: flex-end;
          border-top-right-radius: 4px;
          font-weight: 500;
        }
        .dee-options { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .dee-option {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(125,211,252,0.18);
          color: #f4f6f8;
          padding: 11px 14px; border-radius: 12px;
          text-align: left; cursor: pointer;
          font-size: 14px; font-family: inherit;
          transition: all 0.2s;
        }
        .dee-option:hover { background: rgba(37,99,235,0.18); border-color: #7dd3fc; transform: translateX(2px); }
        .dee-form { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; padding: 12px; background: rgba(5,10,20,0.4); border-radius: 12px; border: 1px solid rgba(125,211,252,0.12); }
        .dee-form input {
          background: rgba(5,10,20,0.6);
          border: 1px solid rgba(125,211,252,0.18);
          color: white; font: inherit; font-size: 13.5px;
          padding: 10px 12px; border-radius: 8px;
        }
        .dee-form input:focus { outline: none; border-color: #7dd3fc; }
        .dee-form button {
          background: #2563eb; color: white; border: none;
          padding: 11px; border-radius: 8px;
          font: inherit; font-weight: 600; font-size: 14px;
          cursor: pointer; margin-top: 4px;
        }
        .dee-form button:hover { background: #4a90e2; }
        .dee-typing {
          display: inline-flex; gap: 4px; padding: 12px 16px;
          background: rgba(125,211,252,0.08);
          border-radius: 16px; border-top-left-radius: 4px;
          align-self: flex-start;
          border: 1px solid rgba(125,211,252,0.12);
        }
        .dee-typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #7dd3fc; opacity: 0.4;
          animation: deeBounce 1.2s infinite;
        }
        .dee-typing span:nth-child(2) { animation-delay: 0.15s; }
        .dee-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes deeBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }
        .dee-foot {
          padding: 10px 16px; font-size: 11px; color: #64748b; text-align: center;
          border-top: 1px solid rgba(125,211,252,0.08);
        }
        @media (max-width: 540px) {
          .dee-panel { width: calc(100vw - 24px); height: calc(100vh - 96px); right: -12px; bottom: 76px; }
        }
      </style>

      <div id="dee-fab">
        <button class="dee-fab-btn" aria-label="Chat with Dee" id="deeFabBtn">
          <span class="dee-pulse"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <span class="dee-badge">1</span>
        </button>
        <div class="dee-panel" id="deePanel">
          <div class="dee-head">
            <div class="dee-avatar">D</div>
            <div class="dee-head-text">
              <strong>Dee · PD Dispatch</strong>
              <span>Online · 24/7/365</span>
            </div>
            <button class="dee-close" id="deeCloseBtn" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="dee-body" id="deeBody"></div>
          <div class="dee-foot">⚡ AI-assisted dispatch · Real PD team takes over when needed</div>
        </div>
      </div>
    `;

    const fabBtn = root.querySelector('#deeFabBtn');
    const closeBtn = root.querySelector('#deeCloseBtn');
    const panel = root.querySelector('#deePanel');
    const badge = root.querySelector('.dee-badge');
    const body = root.querySelector('#deeBody');

    let started = false;
    function openPanel() {
      panel.classList.add('open');
      badge.style.display = 'none';
      if (!started) { started = true; setTimeout(() => goto('root'), 300); }
    }
    function closePanel() { panel.classList.remove('open'); }
    fabBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    // Expose for external triggers
    window.deeChat = { open: openPanel, close: closePanel };

    function addBotMessage(text, opts) {
      const typing = document.createElement('div');
      typing.className = 'dee-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        typing.remove();
        const msg = document.createElement('div');
        msg.className = 'dee-msg bot';
        msg.innerHTML = renderText(text);
        body.appendChild(msg);
        if (opts) body.appendChild(opts);
        body.scrollTop = body.scrollHeight;
      }, 700 + Math.min(text.length * 8, 1200));
    }

    function addUserMessage(text) {
      const msg = document.createElement('div');
      msg.className = 'dee-msg user';
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function buildOptions(options) {
      const wrap = document.createElement('div');
      wrap.className = 'dee-options';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'dee-option';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
          wrap.remove();
          addUserMessage(opt.label);
          if (opt.action === 'call') {
            setTimeout(() => addBotMessage("Tapping to call now → " + PD.phone + ". The line answers 24/7.", buildOptions([{label: 'Start over', goto: 'root'}])), 400);
            window.location.href = PD.phoneLink;
            return;
          }
          if (opt.goto) setTimeout(() => goto(opt.goto), 350);
        });
        wrap.appendChild(btn);
      });
      return wrap;
    }

    function buildForm(fields, onSubmitKey) {
      const wrap = document.createElement('form');
      wrap.className = 'dee-form';
      const labels = { name: 'Your name', property: 'Property name', phone: 'Phone', email: 'Email' };
      const types = { phone: 'tel', email: 'email' };
      fields.forEach(f => {
        const input = document.createElement('input');
        input.type = types[f] || 'text';
        input.name = f;
        input.placeholder = labels[f] || f;
        input.required = true;
        wrap.appendChild(input);
      });
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.textContent = 'Send to PD →';
      wrap.appendChild(btn);
      wrap.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(wrap).entries());
        if (onSubmitKey === 'capture_lead') captureLead(data);
        wrap.remove();
        addUserMessage("[Sent contact info]");
        setTimeout(() => {
          addBotMessage("Got it, " + data.name + ". A team member will reach out within one business day to schedule your walkthrough. Thanks for reaching out — talk soon.", buildOptions([{label: 'Anything else?', goto: 'root'}]));
        }, 400);
      });
      return wrap;
    }

    function goto(key) {
      const node = TREE[key];
      if (!node) return;
      let widget = null;
      if (node.options) widget = buildOptions(node.options);
      else if (node.form) widget = buildForm(node.form, node.onSubmit);
      addBotMessage(node.bot, widget);
    }
  }

  // ====== Boot ======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
