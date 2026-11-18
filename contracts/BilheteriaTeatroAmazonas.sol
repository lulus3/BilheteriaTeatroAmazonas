// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Bilheteria acadêmica com assentos marcados
/// @notice Protótipo demonstrativo para a rede de testes Sepolia.
/// @dev Não representa integração oficial com o Teatro Amazonas.
contract BilheteriaTeatroAmazonas {
    // [Recurso: TiposDeDados] Inclui uint256, int256, bool, address, string, bytes32, constant e immutable.
    uint256 public constant CHAIN_ID_SEPOLIA = 11155111;
    uint16 public constant TOTAL_ASSENTOS = 120;
    uint256 public constant LIMITE_INGRESSOS_POR_CONSULTA = 50;
    address public immutable administrador;

    enum StatusEvento {
        Agendado,
        Cancelado,
        Encerrado
    }

    // [Recurso: StructsEEnums] Modelo do evento e estados possíveis.
    struct Evento {
        string nome;
        string dataHora;
        string local;
        uint256 precoWei;
        // Variação em wei: aceita valores positivos (adicional) ou negativos (desconto).
        int256 ajustePrecoWei;
        // Hash opcional do programa/descrição extensa armazenada fora da blockchain.
        bytes32 referenciaPrograma;
        uint16 totalAssentos;
        uint256 ingressosVendidos;
        address payable organizador;
        StatusEvento status;
    }

    /// @dev Agrupa os parâmetros de criação para reduzir pressão na pilha do compilador.
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

    // [Recurso: ArraysEMappings] Lista dinâmica e mappings aninhados.
    uint256[] private _eventoIds;
    mapping(uint256 eventoId => Evento evento) private _eventos;
    mapping(uint256 eventoId => mapping(uint16 assentoId => uint256 ingressoId)) private _ingressoPorAssento;
    mapping(uint256 ingressoId => Ingresso ingresso) private _ingressos;
    mapping(address comprador => uint256[] ingressoIds) private _ingressosPorComprador;
    mapping(address organizador => uint256 valorPendente) public receitaPendente;

    // [Recurso: Modificadores] Acesso administrativo, estado do evento e proteção de reentrância.
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

    // [Recurso: EventosEErros] Eventos indexados para histórico e atualização da interface.
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

    /// @notice Define como administrador quem implantou o contrato.
    constructor() {
        administrador = msg.sender;
    }

    /// @dev [Recurso: Modificadores] Restringe uma chamada à carteira administradora.
    modifier apenasAdministrador() {
        if (msg.sender != administrador) revert AcessoRestrito(msg.sender);
        _;
    }

    /// @dev [Recurso: Modificadores] Confere a existência do evento antes da operação.
    modifier eventoExiste(uint256 eventoId) {
        if (eventoId == 0 || eventoId >= proximoEventoId) revert EventoInvalido(eventoId);
        _;
    }

    /// @dev Evita chamadas recursivas durante o saque de receita.
    modifier semReentrancia() {
        if (_saqueEmAndamento) revert Reentrancia();
        _saqueEmAndamento = true;
        _;
        _saqueEmAndamento = false;
    }

    /// @notice Cadastra um evento com o inventário fixo de cadeiras da planta.
    /// @param dados Campos do evento agrupados em uma struct.
    // [Recurso: Funcoes] Recebe uma struct calldata para manter o decoder mais leve.
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
        // A criação também valida o preço final, incluindo desconto ou adicional.
        _calcularPreco(evento);
        _eventoIds.push(eventoId);

        emit EventoCriado(eventoId, dados.nome, dados.organizador);
    }

    /// @notice Cancela ou encerra um evento; somente o administrador pode alterar o estado.
    // [Recurso: Funcoes] Altera o estado administrativo do evento.
    function alterarStatusEvento(uint256 eventoId, StatusEvento novoStatus)
        external
        apenasAdministrador
        eventoExiste(eventoId)
    {
        _eventos[eventoId].status = novoStatus;
        emit StatusDoEventoAlterado(eventoId, novoStatus);
    }

    /// @notice Compra uma cadeira fixa livre com o valor exato em SepoliaETH.
    /// @param eventoId Identificador retornado por criarEvento.
    /// @param assentoId ID fixo da cadeira, de 1 a TOTAL_ASSENTOS.
    // [Recurso: Funcoes] Função payable que registra o ingresso e recebe ETH de teste.
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

    /// @notice Permite ao organizador retirar a receita acumulada das vendas.
    // [Recurso: Funcoes] Retirada segura da receita acumulada pelo organizador.
    function sacarReceita() external semReentrancia {
        uint256 valor = receitaPendente[msg.sender];
        if (valor == 0) revert SemReceitaPendente();

        // Efeito antes da interação externa: padrão checks-effects-interactions.
        receitaPendente[msg.sender] = 0;
        (bool sucesso,) = payable(msg.sender).call{value: valor}("");
        if (!sucesso) revert FalhaNoSaque();

        emit ReceitaSacada(msg.sender, valor);
    }

    /// @notice Retorna o evento para consultas pelo frontend.
    // [Recurso: Funcoes] Consulta view do evento.
    function consultarEvento(uint256 eventoId)
        external
        view
        eventoExiste(eventoId)
        returns (Evento memory)
    {
        return _eventos[eventoId];
    }

    /// @notice Retorna os IDs cadastrados, em ordem de criação.
    function listarEventos() external view returns (uint256[] memory) {
        return _eventoIds;
    }

    /// @notice Calcula o preço unitário aplicado à compra do evento.
    function precoIngresso(uint256 eventoId) external view eventoExiste(eventoId) returns (uint256) {
        return _calcularPreco(_eventos[eventoId]);
    }

    /// @notice Retorna o ingresso identificado pelo ID.
    function consultarIngresso(uint256 ingressoId) external view returns (Ingresso memory) {
        if (ingressoId == 0 || ingressoId >= proximoIngressoId) revert IngressoInvalido(ingressoId);
        return _ingressos[ingressoId];
    }

    /// @notice Retorna os ingressos comprados pela carteira conectada.
    function meusIngressos() external view returns (uint256[] memory) {
        return _ingressosPorComprador[msg.sender];
    }

    /// @notice Retorna uma página limitada dos IDs de ingresso da carteira conectada.
    /// @dev [Recurso: EstruturasDeControle] O laço tem limite máximo de 50 itens por chamada.
    // [Recurso: EstruturasDeControle] Loop de leitura com limite máximo configurado.
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

    /// @dev Aplica um desconto ou adicional assinado sem permitir preço zero ou overflow.
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
