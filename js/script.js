const STORAGE_KEY = "axioma_eventos_state_v1";

const DEFAULT_STATE = {
  adminRole: "super_admin",
  selectedEventId: "ev-principios-2027",
  appliedCoupon: null,
  events: [
    {
      id: "ev-principios-2027",
      title: "Escola de Princípios — Formando Bons Líderes",
      date: "2027-05-08T08:30:00",
      timeLabel: "08h30 às 18h00",
      venue: "Igreja Local — Auditório Principal (Rua Exemplo, 100)",
      organizers: "Presidência, Liderança Pastoral e Equipe de Capacitação",
      description:
        "Encontro de capacitação bíblica e prática para líderes, obreiros e membros comprometidos com a edificação saudável da igreja.",
      totalCapacity: 200,
      published: true,
      requireCpf: false,
      cpfJustification: "",
      requireBirthDate: true,
      customQuestions: [
        { id: "q1", label: "Em qual ministério você atua ou deseja atuar?", required: false },
        { id: "q2", label: "Possui alguma necessidade de acessibilidade?", required: false }
      ],
      schedule: [
        { time: "08:00", title: "Credenciamento e recepção", desc: "Confirmação de inscrição e entrega de credencial." },
        { time: "09:00", title: "Abertura e 1ª sessão plenária", desc: "Fundamentos de caráter e serviço cristão." },
        { time: "12:00", title: "Intervalo", desc: "Pausa para alimentação e comunhão." },
        { time: "14:00", title: "2ª sessão plenária e workshops", desc: "Gestão de equipes, discipulado e alinhamento." },
        { time: "17:30", title: "Encerramento", desc: "Orientações finais e envio." }
      ],
      batches: [
        { id: "b-1", category: "Individual — 1º Lote", priceCents: 6000, capacity: 120, sold: 35 },
        { id: "b-2", category: "Caravana / Grupo (por pessoa)", priceCents: 5000, capacity: 60, sold: 15 },
        { id: "b-3", category: "Jovens / Estudantes", priceCents: 0, capacity: 20, sold: 5 }
      ]
    }
  ],
  coupons: [
    { code: "PRINCIPIOS15", type: "percent", value: 15, active: true },
    { code: "LIDER10", type: "fixed", value: 1000, active: true }
  ],
  // Status de pedido: "PENDING" ("Aguardando pagamento") | "APPROVED" ("Pagamento aprovado") | "CANCELLED"
  // Ingresso válido para entrada SOMENTE quando orderStatus === "APPROVED" e ticketStatus === "VALID".
  orders: [
    {
      orderNumber: "AXM-1001",
      eventId: "ev-principios-2027",
      batchId: "b-1",
      categoryLabel: "Individual — 1º Lote",
      paymentMethod: "pix",
      orderStatus: "APPROVED",
      amountPaidCents: 6000,
      feeCents: 180, // Exemplo ilustrativo para demonstração de conciliação
      createdAt: "2026-11-10T10:00:00Z",
      tickets: [
        {
          ticketCode: "TKT-1001-A",
          qrToken: "tok_9f8a7b6c5d4e3f2a1b",
          ticketStatus: "VALID",
          checkedInAt: null,
          checkedInBy: null,
          participant: {
            fullName: "Lucas Almeida",
            email: "lucas@exemplo.com",
            phone: "(21) 99999-1111",
            birthDate: "1996-04-12",
            church: "Igreja Local Sede",
            cityState: "Rio de Janeiro - RJ",
            answers: { q1: "Louvor", q2: "Nenhuma" }
          }
        }
      ]
    },
    {
      orderNumber: "AXM-1002",
      eventId: "ev-principios-2027",
      batchId: "b-1",
      categoryLabel: "Individual — 1º Lote",
      paymentMethod: "pix",
      orderStatus: "PENDING",
      amountPaidCents: 6000,
      feeCents: 0,
      createdAt: "2026-11-18T15:30:00Z",
      tickets: [
        {
          ticketCode: "TKT-1002-A",
          qrToken: "tok_1a2b3c4d5e6f7g8h9i",
          ticketStatus: "PENDING_PAYMENT",
          checkedInAt: null,
          checkedInBy: null,
          participant: {
            fullName: "Mariana Souza",
            email: "mariana@exemplo.com",
            phone: "(21) 98888-2222",
            birthDate: "1999-08-21",
            church: "Congregação Norte",
            cityState: "Queimados - RJ",
            answers: { q1: "Infantil", q2: "Nenhuma" }
          }
        }
      ]
    }
  ]
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatBRL(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function showToast(msg) {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
  if (id === "reg-modal") {
    populateBatchSelect();
    renderParticipantForms();
    updateOrderSummary();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function switchView(view) {
  const pub = document.getElementById("view-public");
  const adm = document.getElementById("view-admin");
  const label = document.getElementById("admin-nav-label");
  if (view === "admin") {
    pub.classList.add("hidden");
    adm.classList.remove("hidden");
    label.textContent = "Ver Site Público";
    renderAdmin();
  } else {
    adm.classList.add("hidden");
    pub.classList.remove("hidden");
    label.textContent = "Painel Admin";
    renderPublic();
  }
}

function toggleAdminView() {
  const isAdminVisible = !document.getElementById("view-admin").classList.contains("hidden");
  switchView(isAdminVisible ? "public" : "admin");
}

function getSelectedEvent() {
  return state.events.find((e) => e.id === state.selectedEventId) || state.events[0];
}

function getTotalSoldForEvent(ev) {
  return ev.batches.reduce((acc, b) => acc + Number(b.sold || 0), 0);
}

/* ========================================================================= */
/* RENDERIZAÇÃO PÚBLICA                                                      */
/* ========================================================================= */
function renderPublic() {
  const ev = getSelectedEvent();
  const sold = getTotalSoldForEvent(ev);
  const remaining = Math.max(0, ev.totalCapacity - sold);
  const pct = ev.totalCapacity > 0 ? Math.min(100, Math.round((sold / ev.totalCapacity) * 100)) : 0;

  document.getElementById("featured-event-title").textContent = ev.title;
  document.getElementById("featured-event-meta").textContent =
    `${new Date(ev.date).toLocaleDateString("pt-BR", { dateStyle: "long" })} • ${ev.timeLabel}`;
  document.getElementById("featured-event-venue").textContent = ev.venue;
  document.getElementById("featured-spots-text").textContent = `${remaining} de ${ev.totalCapacity} vagas restantes`;
  document.getElementById("featured-spots-bar").style.width = `${pct}%`;

  // Cards de eventos
  const eventsGrid = document.getElementById("events-grid");
  const publishedEvents = state.events.filter((item) => item.published);
  eventsGrid.innerHTML = publishedEvents
    .map(
      (item) => `
      <article class="card ${item.id === ev.id ? "card-active" : ""}">
        <span class="eyebrow">${new Date(item.date).toLocaleDateString("pt-BR")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="muted mt-12">${escapeHtml(item.venue)}</p>
        <p class="muted mt-12">Organização: ${escapeHtml(item.organizers)}</p>
        <div class="hero-cta-row">
          <button type="button" class="btn btn-outline-cream btn-sm" onclick="selectEvent('${item.id}')">Ver detalhes</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="selectEvent('${item.id}'); openRegistrationModal()">Quero me inscrever</button>
        </div>
      </article>
    `
    )
    .join("");

  // Detalhes do evento
  document.getElementById("event-detail-card").innerHTML = `
    <span class="eyebrow">PÁGINA DO EVENTO</span>
    <h3>${escapeHtml(ev.title)}</h3>
    <p class="mt-12">${escapeHtml(ev.description)}</p>
    <div class="form-grid-2 mt-16">
      <div><strong>Data e horário:</strong><p class="muted">${new Date(ev.date).toLocaleDateString("pt-BR", { dateStyle: "full" })} • ${escapeHtml(ev.timeLabel)}</p></div>
      <div><strong>Local e endereço:</strong><p class="muted">${escapeHtml(ev.venue)}</p></div>
      <div><strong>Organizadores:</strong><p class="muted">${escapeHtml(ev.organizers)}</p></div>
      <div><strong>Vagas divulgadas:</strong><p class="muted">${remaining} disponíveis de ${ev.totalCapacity} vagas</p></div>
    </div>
    <div class="hero-cta-row">
      <button type="button" class="btn btn-primary" onclick="openRegistrationModal()">Quero me inscrever</button>
    </div>
  `;

  // Programação
  document.getElementById("schedule-list").innerHTML = ev.schedule
    .map(
      (s) => `
      <div class="schedule-item">
        <span class="schedule-time">${escapeHtml(s.time)}</span>
        <div>
          <strong>${escapeHtml(s.title)}</strong>
          <p class="muted">${escapeHtml(s.desc)}</p>
        </div>
      </div>
    `
    )
    .join("");

  // Lotes
  document.getElementById("batches-grid").innerHTML = ev.batches
    .map((b) => {
      const avail = Math.max(0, b.capacity - b.sold);
      return `
        <article class="card">
          <span class="eyebrow">${avail > 0 ? `${avail} vagas no lote` : "Lote esgotado"}</span>
          <h3>${escapeHtml(b.category)}</h3>
          <div class="price-tag">${b.priceCents === 0 ? "Gratuito" : formatBRL(b.priceCents)}</div>
          <button type="button" class="btn btn-primary" ${avail <= 0 ? "disabled" : ""} onclick="openRegistrationModal('${b.id}')">
            ${avail > 0 ? "Quero me inscrever" : "Esgotado"}
          </button>
        </article>
      `;
    })
    .join("");
}

function selectEvent(eventId) {
  state.selectedEventId = eventId;
  state.appliedCoupon = null;
  saveState();
  renderPublic();
}

function startCountdown() {
  function tick() {
    const ev = getSelectedEvent();
    const target = new Date(ev.date).getTime();
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    document.getElementById("cd-days").textContent = String(d).padStart(2, "0");
    document.getElementById("cd-hours").textContent = String(h).padStart(2, "0");
    document.getElementById("cd-mins").textContent = String(m).padStart(2, "0");
    document.getElementById("cd-secs").textContent = String(s).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ========================================================================= */
/* INSCRIÇÃO MULTI-PARTICIPANTE + CUPOM + PAGAMENTO                          */
/* ========================================================================= */
function openRegistrationModal(preselectBatchId = null) {
  openModal("reg-modal");
  if (preselectBatchId) {
    document.getElementById("reg-batch-select").value = preselectBatchId;
  }
  renderParticipantForms();
  updateOrderSummary();
}

function populateBatchSelect() {
  const ev = getSelectedEvent();
  const sel = document.getElementById("reg-batch-select");
  sel.innerHTML = ev.batches
    .map((b) => {
      const avail = Math.max(0, b.capacity - b.sold);
      const priceText = b.priceCents === 0 ? "Gratuito" : formatBRL(b.priceCents);
      return `<option value="${b.id}" ${avail <= 0 ? "disabled" : ""}>${escapeHtml(b.category)} — ${priceText} (${avail} vagas)</option>`;
    })
    .join("");
}

function renderParticipantForms() {
  const ev = getSelectedEvent();
  const qty = Math.max(1, Math.min(10, Number(document.getElementById("reg-qty").value || 1)));
  document.getElementById("reg-qty").value = qty;
  const container = document.getElementById("participants-dynamic-container");

  let html = "";
  for (let i = 0; i < qty; i++) {
    const customFieldsHtml = ev.customQuestions
      .map(
        (q) => `
        <label>
          <span>${escapeHtml(q.label)}${q.required ? " *" : ""}</span>
          <input type="text" data-q-id="${q.id}" ${q.required ? "required" : ""} placeholder="Sua resposta" />
        </label>
      `
      )
      .join("");

    html += `
      <div class="participant-card" data-p-index="${i}">
        <strong>Participante ${i + 1}</strong>
        <div class="form-grid-2 mt-12">
          <label><span>Nome completo *</span><input type="text" class="p-name" required /></label>
          <label><span>E-mail *</span><input type="email" class="p-email" required /></label>
          <label><span>Telefone / WhatsApp *</span><input type="tel" class="p-phone" required placeholder="(00) 00000-0000" /></label>
          <label><span>Igreja ou congregação *</span><input type="text" class="p-church" required /></label>
          <label><span>Cidade e estado *</span><input type="text" class="p-city" required placeholder="Cidade - UF" /></label>
          ${
            ev.requireBirthDate
              ? `<label><span>Data de nascimento *</span><input type="date" class="p-birth" required /></label>`
              : ""
          }
          ${
            ev.requireCpf
              ? `<label><span>CPF *</span><input type="text" class="p-cpf" required placeholder="000.000.000-00" /></label>`
              : ""
          }
        </div>
        ${ev.requireCpf && ev.cpfJustification ? `<p class="muted mt-12">Motivo da solicitação de CPF: ${escapeHtml(ev.cpfJustification)}</p>` : ""}
        ${customFieldsHtml ? `<div class="form-grid-2 mt-12">${customFieldsHtml}</div>` : ""}
      </div>
    `;
  }
  container.innerHTML = html;
}

function applyCoupon() {
  const code = document.getElementById("reg-coupon-input").value.trim().toUpperCase();
  const found = state.coupons.find((c) => c.active && c.code.toUpperCase() === code);
  if (!found) {
    state.appliedCoupon = null;
    showToast("Cupom inválido ou inativo.");
  } else {
    state.appliedCoupon = found;
    showToast(`Cupom ${found.code} aplicado.`);
  }
  updateOrderSummary();
}

function calculateOrderTotals() {
  const ev = getSelectedEvent();
  const batchId = document.getElementById("reg-batch-select").value;
  const batch = ev.batches.find((b) => b.id === batchId) || ev.batches[0];
  const qty = Math.max(1, Number(document.getElementById("reg-qty").value || 1));

  const subtotalCents = batch.priceCents * qty;
  let discountCents = 0;

  if (state.appliedCoupon && subtotalCents > 0) {
    if (state.appliedCoupon.type === "percent") {
      discountCents = Math.round((subtotalCents * state.appliedCoupon.value) / 100);
    } else {
      discountCents = Math.min(subtotalCents, state.appliedCoupon.value);
    }
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);
  return { batch, qty, subtotalCents, discountCents, totalCents };
}

function updateOrderSummary() {
  const { subtotalCents, discountCents, totalCents } = calculateOrderTotals();
  const methodSelect = document.getElementById("reg-payment-method");

  if (totalCents === 0) {
    methodSelect.value = "free";
  } else if (methodSelect.value === "free") {
    methodSelect.value = "pix";
  }

  document.getElementById("order-summary-box").innerHTML = `
    <div>Subtotal: <strong>${formatBRL(subtotalCents)}</strong></div>
    <div>Desconto: <strong>-${formatBRL(discountCents)}</strong></div>
    <div class="mt-12">Total a pagar: <strong>${totalCents === 0 ? "Gratuito" : formatBRL(totalCents)}</strong></div>
  `;
}

function handleRegistrationSubmit(event) {
  event.preventDefault();
  const ev = getSelectedEvent();
  const { batch, qty, totalCents } = calculateOrderTotals();
  const remainingEvent = ev.totalCapacity - getTotalSoldForEvent(ev);
  const remainingBatch = batch.capacity - batch.sold;

  if (qty > remainingEvent || qty > remainingBatch) {
    showToast("Quantidade acima das vagas disponíveis para este lote/evento.");
    return;
  }

  const container = document.getElementById("participants-dynamic-container");

const cards = [...container.querySelectorAll(".participant-card")];

if (cards.length !== qty) {
  showToast("Erro ao identificar os participantes. Atualize o formulário e tente novamente.");
  return;
};
  const participantsData = cards.map((card) => {
    const answers = {};
    card.querySelectorAll("[data-q-id]").forEach((inp) => {
      answers[inp.getAttribute("data-q-id")] = inp.value.trim();
    });
    return {
      fullName: card.querySelector(".p-name").value.trim(),
      email: card.querySelector(".p-email").value.trim().toLowerCase(),
      phone: card.querySelector(".p-phone").value.trim(),
      church: card.querySelector(".p-church").value.trim(),
      cityState: card.querySelector(".p-city").value.trim(),
      birthDate: card.querySelector(".p-birth")?.value || null,
      cpf: card.querySelector(".p-cpf")?.value || null,
      answers
    };
  });

  // Impede duplicação simples no mesmo evento com mesmo e-mail e status ativo
  const alreadyRegistered = participantsData.some((p) =>
    state.orders.some(
      (o) =>
        o.eventId === ev.id &&
        o.orderStatus !== "CANCELLED" &&
        o.tickets.some((t) => t.participant.email === p.email)
    )
  );
  if (alreadyRegistered) {
    showToast("Já existe inscrição ativa com um dos e-mails informados para este evento.");
    return;
  }

  // Reserva vagas e cria pedido:
  // Se totalCents > 0 -> inicia como "PENDING" ("Aguardando pagamento") e NÃO emite ingresso válido ainda.
  // Se totalCents === 0 (gratuito) -> aprova diretamente.
  const isFree = totalCents === 0;
  const orderNumber = `AXM-${Math.floor(1000 + Math.random() * 9000)}`;
  const method = isFree ? "free" : document.getElementById("reg-payment-method").value;

  batch.sold += qty;

  const tickets = participantsData.map((p, idx) => ({
    ticketCode: `${orderNumber}-${String.fromCharCode(65 + idx)}`,
    qrToken: `tok_${cryptoRandomId()}`,
    ticketStatus: isFree ? "VALID" : "PENDING_PAYMENT",
    checkedInAt: null,
    checkedInBy: null,
    participant: p
  }));

  const newOrder = {
    orderNumber,
    eventId: ev.id,
    batchId: batch.id,
    categoryLabel: batch.category,
    paymentMethod: method,
    orderStatus: isFree ? "APPROVED" : "PENDING",
    amountPaidCents: totalCents,
    feeCents: 0,
    createdAt: new Date().toISOString(),
    tickets
  };

  state.orders.unshift(newOrder);
  state.appliedCoupon = null;
  saveState();
  closeModal("reg-modal");
  renderPublic();

  showToast(
    isFree
      ? `Inscrição ${orderNumber} confirmada! Ingresso emitido.`
      : `Pedido ${orderNumber} criado como "Aguardando pagamento".`
  );
  openTicketModal(orderNumber);
}

function cryptoRandomId() {
  if (window.crypto && crypto.getRandomValues) {
    const arr = new Uint8Array(10);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2, 14);
}

/* ========================================================================= */
/* COMPROVANTE / INGRESSO DIGITAL COM QR CODE                                */
/* ========================================================================= */
function openTicketModal(orderNumber) {
  const order = state.orders.find((o) => o.orderNumber === orderNumber);
  if (!order) return;
  const ev = state.events.find((e) => e.id === order.eventId) || getSelectedEvent();

  const isApproved = order.orderStatus === "APPROVED";
  const statusLabel =
    order.orderStatus === "APPROVED"
      ? "Pagamento aprovado"
      : order.orderStatus === "CANCELLED"
        ? "Cancelado / Reembolsado"
        : "Aguardando pagamento";

  const ticketsHtml = order.tickets
    .map(
      (t, index) => `
      <div class="participant-card mt-12">
        <strong>Ingresso ${index + 1}: ${escapeHtml(t.ticketCode)}</strong>
        <p class="muted">Participante: ${escapeHtml(t.participant.fullName)} • ${escapeHtml(order.categoryLabel)}</p>
        <p class="muted">Evento: ${escapeHtml(ev.title)} (${new Date(ev.date).toLocaleDateString("pt-BR")})</p>
        ${
          isApproved && t.ticketStatus !== "CANCELLED"
            ? `
            <div class="qr-box" id="qr-container-${escapeHtml(t.ticketCode)}"></div>
            <p class="muted">Token do ingresso: <code>${escapeHtml(t.qrToken)}</code></p>
          `
            : `
            <p class="muted mt-12"><strong>Ingresso não liberado para entrada:</strong> pagamento pendente ou inscrição cancelada.</p>
          `
        }
      </div>
    `
    )
    .join("");

  document.getElementById("ticket-modal-body").innerHTML = `
    <p><strong>Pedido:</strong> ${escapeHtml(order.orderNumber)} • <strong>Status:</strong> <span class="badge ${isApproved ? "badge-ok" : "badge-pending"}">${statusLabel}</span></p>
    <p class="muted mt-12">Valor: ${order.amountPaidCents === 0 ? "Gratuito" : formatBRL(order.amountPaidCents)} • Método: ${escapeHtml(order.paymentMethod.toUpperCase())}</p>
    ${
      !isApproved && order.orderStatus === "PENDING"
        ? `
        <div class="summary-box mt-12">
          <p><strong>Pix Copia e Cola (simulação de checkout):</strong> <code>00020126580014BR.GOV.BCB.PIX0136${order.orderNumber}5204000053039865802BR</code></p>
          <p class="muted mt-12">Em produção, a aprovação ocorre exclusivamente via webhook autenticado do Mercado Pago no servidor.</p>
          <button type="button" class="btn btn-primary btn-sm mt-12" onclick="simulateWebhookApproval('${order.orderNumber}')">
            Simular confirmação de pagamento (Webhook)
          </button>
        </div>
      `
        : ""
    }
    ${ticketsHtml}
  `;

  openModal("ticket-modal");

  if (isApproved && typeof QRCode !== "undefined") {
    order.tickets.forEach((t) => {
      if (t.ticketStatus !== "CANCELLED") {
        const target = document.getElementById(`qr-container-${t.ticketCode}`);
        if (target) {
          target.innerHTML = "";
          new QRCode(target, {
            text: t.qrToken,
            width: 128,
            height: 128,
            colorDark: "#011D4B",
            colorLight: "#F8F4EA"
          });
        }
      }
    });
  }
}

// Em produção, esta transição deve ocorrer no backend após validar assinatura e status real no Mercado Pago.
function simulateWebhookApproval(orderNumber) {
  const order = state.orders.find((o) => o.orderNumber === orderNumber);
  if (!order || order.orderStatus === "APPROVED") return;
  order.orderStatus = "APPROVED";
  order.tickets.forEach((t) => {
    if (t.ticketStatus === "PENDING_PAYMENT") {
      t.ticketStatus = "VALID";
    }
  });
  saveState();
  showToast(`Pagamento do pedido ${orderNumber} confirmado. Ingressos liberados!`);
  openTicketModal(orderNumber);
}

function handleLookupSubmit(event) {
  event.preventDefault();
  const q = document.getElementById("lookup-input").value.trim().toLowerCase();
  const matches = state.orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.tickets.some(
        (t) => t.ticketCode.toLowerCase().includes(q) || t.participant.email.toLowerCase().includes(q)
      )
  );

  const box = document.getElementById("lookup-results");
  if (!matches.length) {
    box.innerHTML = `<p class="muted">Nenhuma inscrição encontrada para "${escapeHtml(q)}".</p>`;
    return;
  }

  box.innerHTML = matches
    .map(
      (o) => `
      <div class="participant-card mt-12">
        <strong>Pedido ${escapeHtml(o.orderNumber)}</strong> — ${escapeHtml(o.categoryLabel)}
        <div class="mt-12">
          <button type="button" class="btn btn-primary btn-sm" onclick="closeModal('lookup-modal'); openTicketModal('${o.orderNumber}')">
            Abrir comprovante / QR Code
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

/* ========================================================================= */
/* PAINEL ADMINISTRATIVO + CHECK-IN                                          */
/* ========================================================================= */
function changeAdminRole(role) {
  state.adminRole = role;
  saveState();
  renderAdmin();
  showToast(`Perfil alterado para: ${role}`);
}

function switchAdminTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tab);
  });
  ["dashboard", "participants", "events", "checkin"].forEach((name) => {
    document.getElementById(`admin-panel-${name}`).classList.toggle("hidden", name !== tab);
  });
  if (tab === "participants") renderAdminParticipants();
  if (tab === "events") renderCouponsList();
  if (tab === "checkin") renderCheckInHistory();
}

function renderAdmin() {
  const canViewFinance = state.adminRole !== "reception";
  const allTickets = state.orders.flatMap((o) =>
    o.tickets.map((t) => ({ ...t, order: o }))
  );

  const totalTickets = allTickets.length;
  const approvedTickets = allTickets.filter((x) => x.order.orderStatus === "APPROVED").length;
  const pendingTickets = allTickets.filter((x) => x.order.orderStatus === "PENDING").length;
  const cancelledTickets = allTickets.filter(
    (x) => x.order.orderStatus === "CANCELLED" || x.ticketStatus === "CANCELLED"
  ).length;

  const grossConfirmedCents = state.orders
    .filter((o) => o.orderStatus === "APPROVED")
    .reduce((sum, o) => sum + Number(o.amountPaidCents || 0), 0);

  const feesCents = state.orders
    .filter((o) => o.orderStatus === "APPROVED")
    .reduce((sum, o) => sum + Number(o.feeCents || 0), 0);

  const netEstimatedCents = Math.max(0, grossConfirmedCents - feesCents);

  document.getElementById("kpi-grid").innerHTML = `
    <div class="kpi-card"><span>Total de inscritos</span><strong>${totalTickets}</strong></div>
    <div class="kpi-card"><span>Inscrições aprovadas</span><strong>${approvedTickets}</strong></div>
    <div class="kpi-card"><span>Pagamentos pendentes</span><strong>${pendingTickets}</strong></div>
    <div class="kpi-card"><span>Cancelados</span><strong>${cancelledTickets}</strong></div>
  `;

  if (!canViewFinance) {
    document.getElementById("financial-box").innerHTML = `
      <h3>Gestão Financeira</h3>
      <p class="muted mt-12">Perfil <strong>Recepção</strong> não possui acesso a dados financeiros.</p>
    `;
  } else {
    document.getElementById("financial-box").innerHTML = `
      <h3>Resumo Financeiro</h3>
      <p class="muted mt-12">Pagamentos pendentes não entram na receita confirmada. Em produção, confira valores líquidos/repassados diretamente no provedor (Mercado Pago).</p>
      <div class="form-grid-2 mt-16">
        <div class="kpi-card"><span>Receita bruta confirmada</span><strong>${formatBRL(grossConfirmedCents)}</strong></div>
        <div class="kpi-card"><span>Taxas registradas</span><strong>${formatBRL(feesCents)}</strong></div>
        <div class="kpi-card"><span>Receita líquida estimada</span><strong>${formatBRL(netEstimatedCents)}</strong></div>
        <div class="kpi-card"><span>Pedidos pendentes</span><strong>${state.orders.filter((o) => o.orderStatus === "PENDING").length}</strong></div>
      </div>
    `;
  }

  renderAdminParticipants();
}

function renderAdminParticipants() {
  const search = (document.getElementById("participant-search")?.value || "").trim().toLowerCase();
  const statusFilter = document.getElementById("participant-status-filter")?.value || "ALL";
  const canManage = state.adminRole === "super_admin" || state.adminRole === "organizer";

  const rows = state.orders.flatMap((o) =>
    o.tickets.map((t) => ({ order: o, ticket: t }))
  );

  const filtered = rows.filter(({ order, ticket }) => {
    const matchesStatus = statusFilter === "ALL" || order.orderStatus === statusFilter;
    const hay = `${ticket.ticketCode} ${order.orderNumber} ${ticket.participant.fullName} ${ticket.participant.email}`.toLowerCase();
    const matchesSearch = !search || hay.includes(search);
    return matchesStatus && matchesSearch;
  });

  const tbody = document.getElementById("admin-participants-tbody");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Nenhum participante encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(({ order, ticket }) => {
      const statusBadge =
        order.orderStatus === "APPROVED"
          ? `<span class="badge badge-ok">Aprovado</span>`
          : order.orderStatus === "CANCELLED"
            ? `<span class="badge badge-cancel">Cancelado</span>`
            : `<span class="badge badge-pending">Pendente</span>`;

      const checkinText = ticket.checkedInAt
        ? `Presente (${new Date(ticket.checkedInAt).toLocaleTimeString("pt-BR")})`
        : "Não realizado";

      return `
        <tr>
          <td><code>${escapeHtml(ticket.ticketCode)}</code></td>
          <td><strong>${escapeHtml(ticket.participant.fullName)}</strong><br><span class="muted">${escapeHtml(ticket.participant.email)}</span></td>
          <td>${escapeHtml(ticket.participant.church)}<br><span class="muted">${escapeHtml(ticket.participant.cityState)}</span></td>
          <td>${escapeHtml(order.categoryLabel)}</td>
          <td>${statusBadge}</td>
          <td>${escapeHtml(checkinText)}</td>
          <td>
            ${
              canManage && order.orderStatus !== "CANCELLED"
                ? `<button type="button" class="btn btn-outline-cream btn-sm" onclick="cancelTicket('${order.orderNumber}', '${ticket.ticketCode}')">Cancelar</button>`
                : `<span class="muted">—</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function cancelTicket(orderNumber, ticketCode) {
  if (state.adminRole !== "super_admin" && state.adminRole !== "organizer") {
    showToast("Sem permissão para cancelar inscrições.");
    return;
  }
  const order = state.orders.find((o) => o.orderNumber === orderNumber);
  if (!order) return;
  const ticket = order.tickets.find((t) => t.ticketCode === ticketCode);
  if (!ticket || ticket.ticketStatus === "CANCELLED") return;

  ticket.ticketStatus = "CANCELLED";
  if (order.tickets.every((t) => t.ticketStatus === "CANCELLED")) {
    order.orderStatus = "CANCELLED";
  }

  const ev = state.events.find((e) => e.id === order.eventId);
  const batch = ev?.batches.find((b) => b.id === order.batchId);
  if (batch && batch.sold > 0) batch.sold -= 1;

  saveState();
  renderAdmin();
  showToast(`Ingresso ${ticketCode} cancelado e vaga liberada.`);
}

function exportParticipantsCSV() {
  const headers = ["Pedido", "Ingresso", "Nome", "Email", "Telefone", "Igreja", "Cidade/UF", "Categoria", "Status", "CheckIn"];
  const lines = [headers.join(";")];

  state.orders.forEach((o) => {
    o.tickets.forEach((t) => {
      const vals = [
        o.orderNumber,
        t.ticketCode,
        t.participant.fullName,
        t.participant.email,
        t.participant.phone,
        t.participant.church,
        t.participant.cityState,
        o.categoryLabel,
        o.orderStatus,
        t.checkedInAt || "Nao"
      ].map((v) => `"${String(v || "").replaceAll('"', '""')}"`);
      lines.push(vals.join(";"));
    });
  });

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participantes-axioma.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exportado.");
}

function handleSaveEvent(e) {
  e.preventDefault();
  if (state.adminRole === "reception") {
    showToast("Recepção não pode criar ou editar eventos.");
    return;
  }
  const title = document.getElementById("admin-ev-title").value.trim();
  const date = document.getElementById("admin-ev-date").value;
  const venue = document.getElementById("admin-ev-venue").value.trim();
  const organizers = document.getElementById("admin-ev-organizers").value.trim() || "Equipe Organizadora";
  const capacity = Math.max(1, Number(document.getElementById("admin-ev-capacity").value || 100));
  const desc = document.getElementById("admin-ev-desc").value.trim() || "Evento da igreja.";
  const published = document.getElementById("admin-ev-published").checked;

  const newEv = {
    id: `ev-${Date.now()}`,
    title,
    date,
    timeLabel: "Horário conforme programação",
    venue,
    organizers,
    description: desc,
    totalCapacity: capacity,
    published,
    requireCpf: false,
    cpfJustification: "",
    requireBirthDate: false,
    customQuestions: [],
    schedule: [{ time: "09:00", title: "Abertura", desc: "Início das atividades." }],
    batches: [
      { id: `b-${Date.now()}`, category: "Inscrição Geral", priceCents: 0, capacity, sold: 0 }
    ]
  };

  state.events.push(newEv);
  state.selectedEventId = newEv.id;
  saveState();
  e.target.reset();
  renderPublic();
  showToast("Evento salvo com sucesso.");
}

function handleCreateCoupon(e) {
  e.preventDefault();
  if (state.adminRole === "reception") {
    showToast("Recepção não pode gerenciar cupons.");
    return;
  }
  const code = document.getElementById("admin-cp-code").value.trim().toUpperCase();
  const type = document.getElementById("admin-cp-type").value;
  const rawVal = Number(document.getElementById("admin-cp-value").value || 0);
  const value = type === "fixed" ? Math.round(rawVal * 100) : rawVal;

  state.coupons.push({ code, type, value, active: true });
  saveState();
  e.target.reset();
  renderCouponsList();
  showToast(`Cupom ${code} criado.`);
}

function renderCouponsList() {
  document.getElementById("admin-coupons-list").innerHTML = state.coupons
    .map(
      (c) =>
        `<div class="mt-12"><strong>${escapeHtml(c.code)}</strong> — ${
          c.type === "percent" ? `${c.value}%` : formatBRL(c.value)
        }</div>`
    )
    .join("");
}

function handleCheckIn(e) {
  e.preventDefault();
  const query = document.getElementById("checkin-query").value.trim().toLowerCase();
  const feedback = document.getElementById("checkin-feedback");
  feedback.classList.remove("hidden");

  let found = null;
  for (const order of state.orders) {
    for (const ticket of order.tickets) {
      if (
        ticket.qrToken.toLowerCase() === query ||
        ticket.ticketCode.toLowerCase() === query ||
        ticket.participant.fullName.toLowerCase().includes(query)
      ) {
        found = { order, ticket };
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    feedback.innerHTML = `<strong>Bloqueado:</strong> Ingresso não localizado.`;
    return;
  }

  const { order, ticket } = found;

  if (order.orderStatus === "CANCELLED" || ticket.ticketStatus === "CANCELLED") {
    feedback.innerHTML = `<strong>Entrada bloqueada:</strong> Ingresso ${escapeHtml(ticket.ticketCode)} cancelado.`;
    return;
  }

  if (order.orderStatus !== "APPROVED") {
    feedback.innerHTML = `<strong>Entrada bloqueada:</strong> Pagamento pendente (${escapeHtml(ticket.participant.fullName)}).`;
    return;
  }

  if (ticket.checkedInAt) {
    feedback.innerHTML = `<strong>Atenção:</strong> Check-in já realizado anteriormente para <strong>${escapeHtml(ticket.participant.fullName)}</strong> às ${new Date(ticket.checkedInAt).toLocaleTimeString("pt-BR")}.`;
    return;
  }

  ticket.checkedInAt = new Date().toISOString();
  ticket.checkedInBy = state.adminRole;
  ticket.ticketStatus = "USED";
  saveState();

  feedback.innerHTML = `<strong>Check-in liberado:</strong> <strong>${escapeHtml(ticket.participant.fullName)}</strong> (${escapeHtml(ticket.ticketCode)}) — ${escapeHtml(order.categoryLabel)}.`;
  document.getElementById("checkin-query").value = "";
  renderCheckInHistory();
  renderAdmin();
}

function renderCheckInHistory() {
  const checked = [];
  state.orders.forEach((o) => {
    o.tickets.forEach((t) => {
      if (t.checkedInAt) checked.push({ order: o, ticket: t });
    });
  });
  checked.sort((a, b) => new Date(b.ticket.checkedInAt) - new Date(a.ticket.checkedInAt));

  document.getElementById("checkin-history").innerHTML = `
    <h4>Entradas registradas (${checked.length})</h4>
    ${
      checked.length
        ? checked
            .map(
              (x) =>
                `<p class="muted mt-12">• <strong>${escapeHtml(x.ticket.participant.fullName)}</strong> (${escapeHtml(x.ticket.ticketCode)}) — ${new Date(x.ticket.checkedInAt).toLocaleTimeString("pt-BR")} por ${escapeHtml(x.ticket.checkedInBy || "admin")}</p>`
            )
            .join("")
        : `<p class="muted mt-12">Nenhuma entrada registrada ainda.</p>`
    }
  `;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Inicialização
renderPublic();
startCountdown();