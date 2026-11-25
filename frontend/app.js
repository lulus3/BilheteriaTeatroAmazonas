(() => {
  const SEPOLIA_CHAIN_ID = 11155111n;
  const ZERO_BYTES32 = `0x${"0".repeat(64)}`;
  const EVENT_STATUS = ["Agendado", "Cancelado", "Encerrado"];

  const connectButton = document.getElementById("connect-wallet");
  const networkStatus = document.getElementById("network-status");
  const walletDetails = document.getElementById("wallet-details");
  const notice = document.getElementById("notice");
  let noticeTimeout;
  const eventsList = document.getElementById("events-list");
  const myTickets = document.getElementById("my-tickets");
  const adminPanel = document.getElementById("admin-panel");
  const createEventForm = document.getElementById("create-event-form");
  const organizerRevenue = document.getElementById("organizer-revenue");

  const adminTab = document.getElementById("tab-admin");
  const tabButtons = [...document.querySelectorAll("[data-tab]")];
  const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];
  const landingHero = document.getElementById("landing-hero");
  const homeHeading = document.getElementById("workspace-home-heading");
  const shortcutNav = document.getElementById("shortcut-nav");
  const breadcrumbs = document.getElementById("breadcrumbs");
  const breadcrumbCurrent = document.getElementById("breadcrumb-current");
  const breadcrumbHome = document.getElementById("breadcrumb-home");
  const pageTitles = {
    eventos: "Próximos eventos",
    ingressos: "Meus ingressos",
    conta: "Minha conta",
    admin: "Administração",
  };
  const siteTitle = "Bilheteria Teatro Amazonas";

  function updatePageTitle(page) {
    document.title = pageTitles[page]
      ? `${pageTitles[page]} | ${siteTitle}`
      : siteTitle;
  }

  function showHome() {
    document.getElementById("landing-hero").hidden = false;
    document.getElementById("workspace-home-heading").hidden = false;
    document.getElementById("shortcut-nav").hidden = false;

    document.getElementById("breadcrumbs").hidden = true;

    document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("active");
    });

    history.pushState(null, "", "#inicio");
    document.title = "Bilheteria Teatro Amazonas";

    setTimeout(() => {
      document.getElementById("shortcut-nav").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function activateTab(name, updateHistory = true) {
    const button = tabButtons.find((item) => item.dataset.tab === name);
    const panel = tabPanels.find((item) => item.dataset.tabPanel === name);
    if (!button || !panel || button.classList.contains("hidden")) return;

    landingHero.hidden = true;
    homeHeading.hidden = true;
    shortcutNav.hidden = true;
    breadcrumbs.hidden = false;
    breadcrumbCurrent.textContent = pageTitles[name] || name;

    tabButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    tabPanels.forEach((item) => {
      const active = item === panel;
      item.classList.toggle("active", active);
      item.hidden = !active;
    });

    updatePageTitle(name);
    if (updateHistory && location.hash !== `#${name}`) {
      history.pushState({ page: name }, "", `#${name}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncPageFromUrl() {
    const page = location.hash.replace(/^#/, "");
    if (pageTitles[page]) activateTab(page, false);
    else showHome(false);
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-open-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.openTab));
  });
  breadcrumbHome.addEventListener("click", () => showHome());
  document.getElementById("brand-home").addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
  });
  window.addEventListener("popstate", syncPageFromUrl);
  window.addEventListener("hashchange", syncPageFromUrl);
  syncPageFromUrl();

  let web3;
  let account;
  let contract;
  let administrator;

  const shorten = (value) => `${value.slice(0, 6)}…${value.slice(-4)}`;
  const explorerTx = (hash) => `https://sepolia.etherscan.io/tx/${hash}`;
  const formatEth = (wei) => {
    const amount = Number(web3.utils.fromWei(String(wei), "ether"));
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 6 }).format(
      amount,
    );
  };

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function showNotice(message, kind = "info", txHash) {
    clearTimeout(noticeTimeout);
    noticeTimeout = undefined;
    notice.hidden = false;
    notice.replaceChildren(document.createTextNode(message));
    notice.dataset.kind = kind;
    if (txHash) {
      notice.append(" ");
      const link = node("a", "tx-link", "Ver transação no Etherscan");
      link.href = explorerTx(txHash);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      notice.append(link);
    }
    if (kind === "error" && /Sepolia/i.test(message) && window.ethereum) {
      notice.append(" ");
      const switchButton = node(
        "button",
        "inline-action",
        "Trocar para Sepolia",
      );
      switchButton.type = "button";
      switchButton.addEventListener("click", switchToSepolia);
      notice.append(switchButton);
    }

    const dismissAfter =
      kind === "success" ? 7000 : kind === "error" ? 10000 : 0;
    if (dismissAfter) {
      noticeTimeout = setTimeout(() => {
        notice.replaceChildren();
        notice.hidden = true;
        delete notice.dataset.kind;
        noticeTimeout = undefined;
      }, dismissAfter);
    }
  }

  function friendlyError(error) {
    const message =
      error?.cause?.message ||
      error?.innerError?.message ||
      error?.message ||
      "Erro desconhecido.";
    if (/user denied|user rejected|rejected the request|4001/i.test(message)) {
      return "Transação cancelada na MetaMask.";
    }
    if (/AssentoOcupado/i.test(message))
      return "Esse assento acabou de ser comprado. Atualize o mapa e escolha outro.";
    if (/ValorIncorreto/i.test(message))
      return "O valor enviado não corresponde ao preço do ingresso.";
    if (/AcessoRestrito/i.test(message))
      return "Esta ação está disponível somente para a carteira administradora.";
    if (/EventoNaoAgendado/i.test(message))
      return "As vendas deste evento não estão abertas.";
    if (/AssentoInvalido/i.test(message))
      return "Esse ID de assento não pertence à planta fixa.";
    if (/Insufficient funds|insufficient funds/i.test(message))
      return "Saldo SepoliaETH insuficiente para pagar o ingresso e a taxa de rede.";
    return message.replace(/^Error:\s*/i, "");
  }

  function field(raw, name, index) {
    return raw?.[name] ?? raw?.[index];
  }

  function normalizeEvent(id, raw, priceWei) {
    const statusNumber = Number(field(raw, "status", 9));
    return {
      id: String(id),
      name: String(field(raw, "nome", 0)),
      dateTime: String(field(raw, "dataHora", 1)),
      venue: String(field(raw, "local", 2)),
      basePriceWei: String(field(raw, "precoWei", 3)),
      priceWei: String(priceWei),
      totalSeats: Number(field(raw, "totalAssentos", 6)),
      sold: String(field(raw, "ingressosVendidos", 7)),
      organizer: String(field(raw, "organizador", 8)),
      status: statusNumber,
      statusLabel: EVENT_STATUS[statusNumber] || "Indefinido",
    };
  }

  function formatEventDateTime(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return value;

    const [, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year} às ${hour}:${minute}`;
  }

  async function verifyNetwork() {
    const chainId = BigInt(
      await window.ethereum.request({ method: "eth_chainId" }),
    );
    const onSepolia = chainId === SEPOLIA_CHAIN_ID;
    networkStatus.textContent = onSepolia
      ? "Sepolia conectada"
      : "Rede incorreta";
    networkStatus.dataset.kind = onSepolia ? "ok" : "error";
    return onSepolia;
  }

  async function switchToSepolia() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
      await initializeAccount();
    } catch (error) {
      showNotice(friendlyError(error), "error");
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      showNotice(
        "MetaMask não foi encontrada. Abra esta página em um navegador com a extensão instalada.",
        "error",
      );
      return;
    }
    if (typeof Web3 === "undefined") {
      showNotice(
        "Web3.js não carregou. Confira a conexão com a internet e recarregue a página.",
        "error",
      );
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initializeAccount();
    } catch (error) {
      showNotice(friendlyError(error), "error");
    }
  }

  async function initializeAccount() {
    web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    account = accounts[0];
    adminPanel.classList.add("hidden");
    adminPanel.hidden = true;
    adminTab.classList.add("hidden");
    if (!account) {
      contract = undefined;
      administrator = undefined;
      connectButton.textContent = "Conectar carteira";
      walletDetails.textContent = "Carteira não conectada";
      adminPanel.classList.add("hidden");
      adminPanel.hidden = true;
      adminTab.classList.add("hidden");
      showNotice("Conecte sua carteira para carregar os eventos da Sepolia.");
      return;
    }

    connectButton.textContent = shorten(account);
    const [balance, onSepolia] = await Promise.all([
      web3.eth.getBalance(account),
      verifyNetwork(),
    ]);
    walletDetails.textContent = `Carteira: ${account} · Saldo: ${formatEth(balance)} SepoliaETH`;

    if (!onSepolia) {
      contract = undefined;
      adminPanel.classList.add("hidden");
      adminPanel.hidden = true;
      adminTab.classList.add("hidden");
      eventsList.replaceChildren();
      showNotice(
        "Troque a MetaMask para a rede Sepolia para usar esta bilheteria.",
        "error",
      );
      return;
    }

    const config = window.BILHETERIA_CONTRACT;
    if (
      !config?.address ||
      !Array.isArray(config.abi) ||
      config.abi.length === 0
    ) {
      contract = undefined;
      showNotice(
        "Configure o endereço implantado e o ABI em frontend/contrato.js.",
        "error",
      );
      return;
    }
    if (!web3.utils.isAddress(config.address)) {
      contract = undefined;
      showNotice(
        "O endereço em contrato.js não é um endereço Ethereum válido.",
        "error",
      );
      return;
    }

    try {
      const code = await web3.eth.getCode(config.address);
      if (!code || /^0x0*$/i.test(code)) {
        contract = undefined;
        showNotice(
          "Não encontrei um contrato neste endereço da Sepolia. Copie o endereço em Deployed Contracts no Remix.",
          "error",
        );
        return;
      }

      contract = new web3.eth.Contract(config.abi, config.address);
      administrator = await contract.methods.administrador().call();
      await refreshApplication();
    } catch (error) {
      contract = undefined;
      showNotice(
        `Não consegui consultar o contrato. Confira se o ABI e o endereço são do mesmo deploy. ${friendlyError(error)}`,
        "error",
      );
    }
  }

  async function refreshApplication() {
    if (!contract || !account) return;
    const isAdmin = administrator?.toLowerCase() === account.toLowerCase();
    adminPanel.classList.toggle("hidden", !isAdmin);
    adminPanel.hidden = !isAdmin;
    adminTab.classList.toggle("hidden", !isAdmin);
    if (
      !isAdmin &&
      document.querySelector(".tab-button.active")?.dataset.tab === "admin"
    )
      showHome();
    const organizerInput = createEventForm.elements.organizador;
    if (!organizerInput.value) organizerInput.value = account;

    await Promise.all([loadEvents(), loadMyTickets(), loadOrganizerRevenue()]);
    showNotice(
      isAdmin
        ? "Conectada como administradora. Você pode cadastrar eventos e gerenciar a programação."
        : "Eventos e assentos carregados da Sepolia. Escolha um lugar para continuar.",
    );
  }

  async function loadEvents() {
    eventsList.replaceChildren();
    try {
      const ids = await contract.methods.listarEventos().call();
      if (!ids.length) {
        eventsList.append(
          node("div", "empty-card", "Ainda não há eventos cadastrados."),
        );
        return;
      }

      const events = await Promise.all(
        ids.map(async (id) => {
          const [raw, price] = await Promise.all([
            contract.methods.consultarEvento(id).call(),
            contract.methods.precoIngresso(id).call(),
          ]);
          return normalizeEvent(id, raw, price);
        }),
      );

      for (const event of events) eventsList.append(createEventCard(event));
    } catch (error) {
      eventsList.append(
        node(
          "div",
          "empty-card",
          `Falha ao carregar os eventos: ${friendlyError(error)}`,
        ),
      );
    }
  }

  function createEventCard(event) {
    const card = node("article", "event-card");
    const top = node("div", "event-card-top");
    top.append(node("span", "event-id", `EVENTO ${event.id.padStart(3, "0")}`));
    const statusClass = event.status === 0 ? "status-open" : "status-closed";
    top.append(node("span", `event-status ${statusClass}`, event.statusLabel));
    card.append(top);
    card.append(node("h3", "", event.name));
    const meta = node("div", "event-meta");
    meta.append(node("p", "", `◷  ${formatEventDateTime(event.dateTime)}`));
    meta.append(node("p", "", `⌖  ${event.venue}`));
    meta.append(
      node(
        "p",
        "",
        `${event.totalSeats} assentos fixos · ${event.sold} vendidos`,
      ),
    );
    card.append(meta);
    card.append(
      node(
        "p",
        "event-price",
        `${formatEth(event.priceWei)} SepoliaETH por ingresso`,
      ),
    );

    if (administrator?.toLowerCase() === account?.toLowerCase()) {
      const adminActions = node("div", "event-admin-actions");
      if (event.status === 0) {
        adminActions.append(statusButton(event.id, 1, "Cancelar evento"));
        adminActions.append(statusButton(event.id, 2, "Encerrar vendas"));
      }
      card.append(adminActions);
    }

    if (event.status !== 0) {
      card.append(
        node(
          "p",
          "event-unavailable",
          "As vendas deste evento estão fechadas.",
        ),
      );
      return card;
    }

    const seatsToggle = node(
      "button",
      "button button-outline seat-toggle",
      "Escolher assentos",
    );
    seatsToggle.type = "button";
    card.append(seatsToggle);

    // Modal de seleção
    const picker = node("div", "seat-modal-overlay hidden");
    picker.setAttribute("role", "presentation");

    const modal = node("div", "seat-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `Escolha de assentos: ${event.name}`);

    const modalHeader = node("div", "seat-modal-header");

    const modalTitle = node("div", "seat-modal-title");
    modalTitle.append(node("span", "eyebrow", "SELEÇÃO DE LUGARES"));
    modalTitle.append(node("h2", "", "Escolha seus assentos"));
    modalTitle.append(node("p", "", event.name));

    const closeButton = node("button", "seat-modal-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fechar seleção de assentos");

    modalHeader.append(modalTitle, closeButton);

    // Área do mapa
    const modalBody = node("div", "seat-modal-body");
    const seatMap = node("div", "seat-map-container");
    modalBody.append(seatMap);

    // Rodapé do modal
    const modalFooter = node("div", "seat-modal-footer");

    const selection = node(
      "p",
      "selection-summary",
      "Selecione um ou mais assentos.",
    );

    const buyButton = node(
      "button",
      "button button-gold buy-button",
      "Comprar ingressos",
    );
    buyButton.type = "button";
    buyButton.disabled = true;

    modalFooter.append(selection, buyButton);

    modal.append(modalHeader, modalBody, modalFooter);
    picker.append(modal);
    card.append(picker);

    const selectedSeats = new Map();

    const closeModal = () => {
      picker.classList.add("hidden");
      document.body.classList.remove("modal-open");
      seatsToggle.focus();
    };

    closeButton.addEventListener("click", closeModal);

    picker.addEventListener("click", (eventClick) => {
      if (eventClick.target === picker) {
        closeModal();
      }
    });

    const updateSelection = () => {
      const chosen = [...selectedSeats.values()];
      const total = BigInt(event.priceWei) * BigInt(chosen.length);

      selection.textContent = chosen.length
        ? `${chosen.length} assento(s): ${chosen.map((seat) => seat.code).join(", ")} · Total: ${formatEth(total.toString())} SepoliaETH.`
        : "Selecione um ou mais assentos.";

      buyButton.textContent = chosen.length
        ? `Comprar ${chosen.length} ingresso(s)`
        : "Comprar ingressos";

      buyButton.disabled = chosen.length === 0;
    };

    // Abrir modal e carregar mapa
    seatsToggle.addEventListener("click", async () => {
      picker.classList.remove("hidden");
      document.body.classList.add("modal-open");

      if (seatMap.dataset.loaded === "true") return;

      seatsToggle.disabled = true;
      seatsToggle.textContent = "Carregando lugares…";

      seatMap.replaceChildren(
        node(
          "p",
          "seat-loading",
          "Consultando disponibilidade dos assentos...",
        ),
      );

      try {
        await renderSeatMap(seatMap, event, (seat, button) => {
          if (selectedSeats.has(seat.id)) {
            selectedSeats.delete(seat.id);
            button.classList.remove("selected");
          } else {
            selectedSeats.set(seat.id, seat);
            button.classList.add("selected");
          }

          updateSelection();
        });

        seatMap.dataset.loaded = "true";
      } catch (error) {
        seatMap.replaceChildren();
        showNotice(
          `Não consegui consultar os assentos: ${friendlyError(error)}`,
          "error",
        );
        closeModal();
      } finally {
        seatsToggle.disabled = false;
        seatsToggle.textContent = "Escolher assentos";
      }
    });

    // Compra dos ingressos
    buyButton.addEventListener("click", async () => {
      const seatsToBuy = [...selectedSeats.values()];

      if (!seatsToBuy.length) return;

      buyButton.disabled = true;

      try {
        const seatIds = seatsToBuy.map((seat) => seat.id);
        const totalWei = (
          BigInt(event.priceWei) * BigInt(seatIds.length)
        ).toString();

        buyButton.textContent = `Confirmando ${seatIds.length} ingresso(s)…`;

        const transaction = contract.methods
          .comprarIngressos(event.id, seatIds)
          .send({ from: account, value: totalWei });

        await sendTransaction(
          transaction,
          `Compra de ${seatIds.length} ingresso(s) enviada`,
          { refresh: false },
        );

        closeModal();
        selectedSeats.clear();

        await refreshApplication();

        showNotice(
          `${seatIds.length} ingresso(s) comprado(s) com sucesso em uma única transação.`,
          "success",
        );
      } catch (error) {
        closeModal();
        await refreshApplication();

        showNotice(
          `Não foi possível concluir a compra dos ingressos: ${friendlyError(error)}`,
          "error",
        );
      }
    });
    return card;
  }

  async function renderSeatMap(container, event, onSelect) {
    container.replaceChildren();
    const fixedMap = window.BILHETERIA_SEAT_MAP;
    if (
      event.totalSeats !== fixedMap.totalSeats ||
      fixedMap.totalSeats !== 120
    ) {
      throw new Error(
        "A capacidade registrada no contrato não corresponde aos 120 assentos fixos da planta.",
      );
    }

    const mapShell = node("div", "venue-map-shell");
    mapShell.append(node("div", "stage-label", "PALCO"));
    const mapLayout = node("div", "venue-layout");
    const leftWing = node("div", "venue-wing venue-wing-left");
    const plateia = node("div", "venue-plateia");
    const rightWing = node("div", "venue-wing venue-wing-right");

    for (const group of fixedMap.groups) {
      const zone = node("section", `seat-zone zone-${group.zone}`);
      zone.append(node("h4", "", group.name));
      for (const row of group.rows) {
        const rowElement = node("div", `seat-row seat-row-${group.zone}`);
        rowElement.append(node("span", "row-label", row.label));
        const availability = await Promise.all(
          row.seats.map(async (seat) => ({
            seat,
            free: await contract.methods
              .assentoDisponivel(event.id, seat.id)
              .call(),
          })),
        );
        for (const { seat, free } of availability) {
          const button = node(
            "button",
            `seat ${free ? "available" : "occupied"}`,
            seat.code,
          );
          button.type = "button";
          button.disabled = !free;
          button.title = free
            ? `${group.name}: ${seat.code}`
            : `${group.name}: ${seat.code} ocupado`;
          if (free)
            button.addEventListener("click", () => onSelect(seat, button));
          rowElement.append(button);
        }
        zone.append(rowElement);
      }
      if (group.side === "left") leftWing.append(zone);
      else if (group.side === "right") rightWing.append(zone);
      else plateia.append(zone);
    }

    mapLayout.append(leftWing, plateia, rightWing);
    mapShell.append(mapLayout);
    const legend = node("div", "seat-legend");
    legend.append(
      node("span", "", "● Livre"),
      node("span", "", "● Ocupado"),
      node("span", "", "● Selecionado"),
    );
    mapShell.append(legend);
    container.append(mapShell);
  }

  function statusButton(eventId, status, label) {
    const button = node("button", "button button-small button-outline", label);
    button.type = "button";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const transaction = contract.methods
          .alterarStatusEvento(eventId, status)
          .send({ from: account });
        await sendTransaction(transaction, "Atualização do evento enviada");
      } catch (error) {
        showNotice(friendlyError(error), "error");
      } finally {
        button.disabled = false;
      }
    });
    return button;
  }

  async function loadMyTickets() {
    myTickets.replaceChildren();
    try {
      const ids = await contract.methods
        .meusIngressos()
        .call({ from: account });
      if (!ids.length) {
        myTickets.append(
          node(
            "p",
            "empty-ticket-message",
            "Esta carteira ainda não tem ingressos.",
          ),
        );
        return;
      }
      for (const id of ids) {
        const ticket = await contract.methods.consultarIngresso(id).call();
        const eventId = String(field(ticket, "eventoId", 0));
        const event = await contract.methods.consultarEvento(eventId).call();
        const ticketCard = node("article", "ticket-item");
        const details = node("div", "ticket-details");
        details.append(node("strong", "", String(field(event, "nome", 0))));
        const seatId = Number(field(ticket, "assentoId", 1));
        const ticketSeat = findSeatById(seatId);
        details.append(
          node(
            "span",
            "",
            `Ingresso #${id} · Assento ${ticketSeat?.code || `#${seatId}`}`,
          ),
        );
        details.append(
          node(
            "span",
            "",
            `${formatEth(String(field(ticket, "valorPago", 3)))} SepoliaETH`,
          ),
        );
        ticketCard.append(details);
        const link = node("a", "ticket-event-link", "Ver evento");
        link.href = `https://sepolia.etherscan.io/address/${window.BILHETERIA_CONTRACT.address}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        ticketCard.append(link);
        myTickets.append(ticketCard);
      }
    } catch (error) {
      myTickets.append(
        node(
          "p",
          "empty-ticket-message",
          `Não foi possível carregar os ingressos: ${friendlyError(error)}`,
        ),
      );
    }
  }

  async function loadOrganizerRevenue() {
    organizerRevenue.replaceChildren();
    organizerRevenue.classList.add("hidden");
    try {
      const pending = await contract.methods.receitaPendente(account).call();
      if (BigInt(pending) === 0n) return;
      organizerRevenue.classList.remove("hidden");
      organizerRevenue.append(
        node(
          "span",
          "",
          `Receita pendente para esta carteira: ${formatEth(pending)} SepoliaETH`,
        ),
      );
      const withdraw = node("button", "button button-gold", "Sacar receita");
      withdraw.type = "button";
      withdraw.addEventListener("click", async () => {
        withdraw.disabled = true;
        try {
          const transaction = contract.methods
            .sacarReceita()
            .send({ from: account });
          await sendTransaction(transaction, "Saque enviado");
        } catch (error) {
          showNotice(friendlyError(error), "error");
        } finally {
          withdraw.disabled = false;
        }
      });
      organizerRevenue.append(withdraw);
    } catch (error) {
      console.warn("Falha ao consultar receita pendente:", error);
    }
  }

  function findSeatById(id) {
    return window.BILHETERIA_SEAT_MAP.groups
      .flatMap((group) => group.rows.flatMap((layoutRow) => layoutRow.seats))
      .find((layoutSeat) => layoutSeat.id === id);
  }

  function ethToWei(value, allowNegative = false) {
    const input = String(value).trim();
    if (
      !/^-?\d+(?:\.\d{1,18})?$/.test(input) ||
      (!allowNegative && input.startsWith("-"))
    ) {
      throw new Error("Informe um valor em ETH com até 18 casas decimais.");
    }
    const negative = input.startsWith("-");
    const unsigned = negative ? input.slice(1) : input;
    const [whole, fraction = ""] = unsigned.split(".");
    const magnitude =
      BigInt(whole) * 10n ** 18n +
      BigInt((fraction + "0".repeat(18)).slice(0, 18));
    return (negative ? -magnitude : magnitude).toString();
  }

  createEventForm.elements.organizador.value = "";
  createEventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contract || administrator?.toLowerCase() !== account?.toLowerCase()) {
      showNotice(
        "Conecte a carteira administradora do contrato para cadastrar eventos.",
        "error",
      );
      return;
    }
    const form = new FormData(createEventForm);
    const submit = createEventForm.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const organizer = String(form.get("organizador")).trim();
      if (!web3.utils.isAddress(organizer))
        throw new Error("Informe um endereço válido para o organizador.");
      const basePrice = ethToWei(form.get("preco"));
      if (BigInt(basePrice) <= 0n)
        throw new Error("O preço base precisa ser maior que zero.");
      const adjustment = ethToWei(form.get("ajuste") || "0", true);
      const eventData = [
        String(form.get("nome")).trim(),
        String(form.get("dataHora")).trim(),
        String(form.get("local")).trim(),
        basePrice,
        adjustment,
        ZERO_BYTES32,
        organizer,
      ];
      const transaction = contract.methods
        .criarEvento(eventData)
        .send({ from: account });
      await sendTransaction(transaction, "Cadastro do evento enviado");
      createEventForm.reset();
      createEventForm.elements.local.value = "Teatro Amazonas";
      createEventForm.elements.ajuste.value = "0";
      createEventForm.elements.organizador.value = account;
    } catch (error) {
      showNotice(friendlyError(error), "error");
    } finally {
      submit.disabled = false;
    }
  });

  async function sendTransaction(transaction, label, { refresh = true } = {}) {
    let txHash;
    transaction.on("transactionHash", (hash) => {
      txHash = hash;
      showNotice(
        `${label}. Aguardando confirmação na Sepolia…`,
        "pending",
        hash,
      );
    });
    transaction.on("receipt", async (receipt) => {
      txHash = receipt.transactionHash || txHash;
      if (refresh) await refreshApplication();
      showNotice("Transação confirmada na Sepolia.", "success", txHash);
    });
    return transaction;
  }

  connectButton.addEventListener("click", connectWallet);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (!accounts.length) {
        account = undefined;
        contract = undefined;
        connectButton.textContent = "Conectar carteira";
        walletDetails.textContent = "Carteira não conectada";
        adminPanel.classList.add("hidden");
        adminPanel.hidden = true;
        adminTab.classList.add("hidden");
        eventsList.replaceChildren();
        myTickets.replaceChildren();
        showNotice("Conecte sua carteira para carregar os eventos da Sepolia.");
        return;
      }
      await initializeAccount();
    });
    window.ethereum.on("chainChanged", () => window.location.reload());
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => (accounts.length ? initializeAccount() : undefined))
      .catch(() => undefined);
  }

  if (!window.ethereum) {
    showNotice(
      "Abra esta página em um navegador com MetaMask para conectar a carteira.",
    );
  }
})();
