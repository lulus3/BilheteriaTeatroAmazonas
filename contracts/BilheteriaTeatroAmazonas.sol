// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BilheteriaTeatroAmazonas {
    uint256 public constant CHAIN_ID_SEPOLIA = 11155111;
    uint16 public constant TOTAL_ASSENTOS = 120;
    uint256 public constant LIMITE_INGRESSOS_POR_CONSULTA = 50;
    address public immutable administrador;

    enum StatusEvento {
        Agendado,
        Cancelado,
        Encerrado
    }

    struct Evento {
        string nome;
        string dataHora;
        string local;
        uint256 precoWei;
        int256 ajustePrecoWei;
        bytes32 referenciaPrograma;
        uint16 totalAssentos;
        uint256 ingressosVendidos;
        address payable organizador;
        StatusEvento status;
    }

    struct DadosNovoEvento {
        string nome;
        string dataHora;
        string local;
        uint256 precoWei;
        int256 ajustePrecoWei;
        bytes32 referenciaPrograma;
        address payable organizador;
    }

    struct Ingresso {
        uint256 eventoId;
        uint16 assentoId;
        address comprador;
        uint256 valorPago;
    }

    uint256 public proximoEventoId = 1;
    uint256 public proximoIngressoId = 1;

    uint256[] private _eventoIds;
    mapping(uint256 eventoId => Evento evento) private _eventos;
    mapping(uint256 eventoId => mapping(uint16 assentoId => uint256 ingressoId)) private _ingressoPorAssento;
    mapping(uint256 ingressoId => Ingresso ingresso) private _ingressos;
    mapping(address comprador => uint256[] ingressoIds) private _ingressosPorComprador;
    mapping(address organizador => uint256 valorPendente) public receitaPendente;

    bool private _saqueEmAndamento;

    error AcessoRestrito(address chamador);
    error EventoInvalido(uint256 eventoId);
    error EventoNaoAgendado(uint256 eventoId);
    error DimensoesInvalidas();
    error AssentoInvalido(uint16 assentoId);
    error AssentoOcupado(uint256 eventoId, uint16 assentoId);
    error ValorIncorreto(uint256 esperado, uint256 recebido);
    error SemReceitaPendente();
    error FalhaNoSaque();
    error Reentrancia();
    error AjustePrecoInvalido();
    error IngressoInvalido(uint256 ingressoId);

    event EventoCriado(uint256 indexed eventoId, string nome, address indexed organizador);
    event StatusDoEventoAlterado(uint256 indexed eventoId, StatusEvento novoStatus);
    event IngressoComprado(
        uint256 indexed eventoId,
        uint256 indexed ingressoId,
        address indexed comprador,
        uint16 assentoId,
        uint256 valorPago
    );
    event ReceitaSacada(address indexed organizador, uint256 valor);

    constructor() {
        administrador = msg.sender;
    }

    modifier apenasAdministrador() {
        if (msg.sender != administrador) revert AcessoRestrito(msg.sender);
        _;
    }

    modifier eventoExiste(uint256 eventoId) {
        if (eventoId == 0 || eventoId >= proximoEventoId) revert EventoInvalido(eventoId);
        _;
    }

    modifier semReentrancia() {
        if (_saqueEmAndamento) revert Reentrancia();
        _saqueEmAndamento = true;
        _;
        _saqueEmAndamento = false;
    }

    function criarEvento(DadosNovoEvento calldata dados)
        external
        apenasAdministrador
        returns (uint256 eventoId)
    {
        if (
            bytes(dados.nome).length == 0 || bytes(dados.dataHora).length == 0 || bytes(dados.local).length == 0
                || dados.precoWei == 0 || dados.organizador == address(0)
        ) revert DimensoesInvalidas();

        eventoId = proximoEventoId++;
        Evento storage evento = _eventos[eventoId];
        evento.nome = dados.nome;
        evento.dataHora = dados.dataHora;
        evento.local = dados.local;
        evento.precoWei = dados.precoWei;
        evento.ajustePrecoWei = dados.ajustePrecoWei;
        evento.referenciaPrograma = dados.referenciaPrograma;
        evento.totalAssentos = TOTAL_ASSENTOS;
        evento.organizador = dados.organizador;
        evento.status = StatusEvento.Agendado;
        _calcularPreco(evento);
        _eventoIds.push(eventoId);

        emit EventoCriado(eventoId, dados.nome, dados.organizador);
    }

    function alterarStatusEvento(uint256 eventoId, StatusEvento novoStatus)
        external
        apenasAdministrador
        eventoExiste(eventoId)
    {
        _eventos[eventoId].status = novoStatus;
        emit StatusDoEventoAlterado(eventoId, novoStatus);
    }

    function comprarIngresso(uint256 eventoId, uint16 assentoId)
        external
        payable
        eventoExiste(eventoId)
        returns (uint256 ingressoId)
    {
        Evento storage evento = _eventos[eventoId];
        if (evento.status != StatusEvento.Agendado) revert EventoNaoAgendado(eventoId);
        if (assentoId == 0 || assentoId > TOTAL_ASSENTOS) revert AssentoInvalido(assentoId);

        if (_ingressoPorAssento[eventoId][assentoId] != 0) {
            revert AssentoOcupado(eventoId, assentoId);
        }
        uint256 precoFinal = _calcularPreco(evento);
        if (msg.value != precoFinal) revert ValorIncorreto(precoFinal, msg.value);

        ingressoId = proximoIngressoId++;
        _ingressoPorAssento[eventoId][assentoId] = ingressoId;
        _ingressos[ingressoId] = Ingresso({
            eventoId: eventoId,
            assentoId: assentoId,
            comprador: msg.sender,
            valorPago: msg.value
        });
        _ingressosPorComprador[msg.sender].push(ingressoId);
        evento.ingressosVendidos++;
        receitaPendente[evento.organizador] += msg.value;

        emit IngressoComprado(eventoId, ingressoId, msg.sender, assentoId, msg.value);
    }

    function sacarReceita() external semReentrancia {
        uint256 valor = receitaPendente[msg.sender];
        if (valor == 0) revert SemReceitaPendente();

        receitaPendente[msg.sender] = 0;
        (bool sucesso,) = payable(msg.sender).call{value: valor}("");
        if (!sucesso) revert FalhaNoSaque();

        emit ReceitaSacada(msg.sender, valor);
    }

    function consultarEvento(uint256 eventoId) external
        view
        eventoExiste(eventoId)
        returns (Evento memory)
    {
        return _eventos[eventoId];
    }

    function listarEventos() external view returns (uint256[] memory) {
        return _eventoIds;
    }

    function precoIngresso(uint256 eventoId) external view eventoExiste(eventoId) returns (uint256) {
        return _calcularPreco(_eventos[eventoId]);
    }

    function consultarIngresso(uint256 ingressoId) external view returns (Ingresso memory) {
        if (ingressoId == 0 || ingressoId >= proximoIngressoId) revert IngressoInvalido(ingressoId);
        return _ingressos[ingressoId];
    }

    function meusIngressos() external view returns (uint256[] memory) {
        return _ingressosPorComprador[msg.sender];
    }

    function listarMeusIngressos(uint256 inicio, uint256 quantidade)
        external
        view
        returns (uint256[] memory pagina)
    {
        uint256[] storage ids = _ingressosPorComprador[msg.sender];
        if (inicio >= ids.length || quantidade == 0) return new uint256[](0);
        if (quantidade > LIMITE_INGRESSOS_POR_CONSULTA) {
            quantidade = LIMITE_INGRESSOS_POR_CONSULTA;
        }

        uint256 fim = inicio + quantidade;
        if (fim > ids.length) fim = ids.length;

        pagina = new uint256[](fim - inicio);
        for (uint256 i = inicio; i < fim; i++) {
            pagina[i - inicio] = ids[i];
        }
    }

    /// @notice Informa se uma cadeira fixa está livre.
    function assentoDisponivel(uint256 eventoId, uint16 assentoId)
        external
        view
        eventoExiste(eventoId)
        returns (bool)
    {
        if (assentoId == 0 || assentoId > TOTAL_ASSENTOS) revert AssentoInvalido(assentoId);
        return _ingressoPorAssento[eventoId][assentoId] == 0;
    }

    function _calcularPreco(Evento storage evento) private view returns (uint256) {
        if (evento.ajustePrecoWei < 0) {
            // Esta forma também trata com segurança o menor int256 negativo.
            uint256 desconto = uint256(-(evento.ajustePrecoWei + 1)) + 1;
            if (desconto >= evento.precoWei) revert AjustePrecoInvalido();
            return evento.precoWei - desconto;
        }

        uint256 adicional = uint256(evento.ajustePrecoWei);
        if (adicional > type(uint256).max - evento.precoWei) revert AjustePrecoInvalido();
        return evento.precoWei + adicional;
    }
}
