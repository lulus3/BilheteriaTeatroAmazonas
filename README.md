# Bilheteria Teatro Amazonas

Protótipo acadêmico de uma dApp para cadastro de eventos e venda de ingressos com assentos fixos. O contrato registra eventos, controla a disponibilidade das cadeiras e recebe pagamentos em SepoliaETH. A blockchain mantém o registro público das compras e impede a venda duplicada de um mesmo assento. O projeto é demonstrativo, usa eventos fictícios e não representa uma integração oficial com o Teatro Amazonas.

## Funcionalidades

- Cadastro e gerenciamento de eventos pela carteira administradora do contrato.
- Escolha de data e horário no formulário de cadastro.
- Mapa com 120 assentos fixos e consulta on-chain de disponibilidade.
- Compra de um ou mais ingressos em uma única transação; a compra é concluída para todos os assentos selecionados ou para nenhum.
- Consulta de eventos e ingressos da carteira conectada.
- Registro da receita pendente por organizador e saque para a carteira organizadora.
- Conexão com MetaMask, verificação da Sepolia e acompanhamento de transações pelo Etherscan.

## Problema e uso de blockchain

O protótipo trata do controle de disponibilidade e venda de assentos para eventos. O contrato registra as compras publicamente, mantém a associação entre evento, assento e ingresso e rejeita uma segunda compra do mesmo assento. Isso permite demonstrar regras de negócio verificáveis e um histórico compartilhado sem depender de uma única base de dados editável pela interface.

## Tecnologias

- Solidity 0.8.24 ou compatível com `^0.8.24`
- Remix IDE para compilar, testar e implantar o contrato
- Ethereum Sepolia, Chain ID `11155111` (`0xaa36a7`)
- HTML, CSS e JavaScript puros
- Web3.js 4.x via CDN e MetaMask
- Vercel para hospedagem estática do frontend

## Estrutura

```text
BilheteriaTeatroAmazonas/
├── contracts/
│   └── BilheteriaTeatroAmazonas.sol
├── docs/
│   └── arquitetura.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── contrato.js
│   └── mapa-assentos.js
├── .gitignore
└── README.md
```

## Recursos Solidity

| Grupo exigido | Onde aparece | Uso no projeto e situação |
|---|---|---|
| Tipos de dados | `Evento`, `DadosNovoEvento`, `Ingresso`, constantes e estado do contrato | `string` guarda dados do evento; `uint256` e `uint16` guardam IDs, preços e assentos; `int256` representa ajuste de preço; `bool` controla o saque; `address` e `address payable` representam carteiras; `bytes32` reserva uma referência de conteúdo. `constant` e `immutable` guardam valores fixos. |
| Funções | `criarEvento`, `alterarStatusEvento`, `comprarIngressos`, `sacarReceita`, consultas e funções auxiliares | Regras de cadastro, compra, saque e consulta. Há funções `external`, `private`, `view` e `payable`, além do construtor. **Pendente:** declarar usos explícitos de `public` e `internal` para atender literalmente ao requisito de visibilidades. |
| Estruturas de controle | Validações em `criarEvento`, `comprarIngressos`, `listarMeusIngressos` e `_calcularPreco` | Condicionais validam dados e estado; laços percorrem compras e páginas de ingressos; a paginação limita a consulta a 50 IDs. **Pendente:** incluir `require` e um ramo `else`, pedidos pelo guia. |
| Arrays e mappings | `_eventoIds`, `_ingressosPorComprador`, `_eventos`, `_ingressoPorAssento`, `_ingressos` e `receitaPendente` | Armazenam a lista de eventos, ingressos por carteira, dados dos registros e disponibilidade por evento e assento. |
| Structs e enums | `Evento`, `DadosNovoEvento`, `Ingresso`, `StatusEvento` | Agrupam os dados do evento e do ingresso e representam os estados possíveis do evento. |
| Modificadores | `apenasAdministrador`, `eventoExiste`, `semReentrancia` | Restringem o cadastro e a alteração de eventos, validam IDs e protegem o saque contra reentrância. |
| Eventos e erros | `EventoCriado`, `StatusDoEventoAlterado`, `IngressoComprado`, `ReceitaSacada` e erros personalizados | Eventos registram operações; erros personalizados identificam falhas de negócio como assento ocupado, preço incorreto e acesso restrito. |

**Pendências para fechar os requisitos do guia:** marcar cada grupo no contrato com comentários `// [Recurso: ...]`, documentar as funções principais com NatSpec (`/// @notice` e `/// @param`), declarar funções `public` e `internal` com uso real, e incluir os exemplos exigidos de `require` e `else`. A tabela acima descreve o estado atual do código; ela não substitui essas marcações no contrato.

## Como executar

1. Abra `contracts/BilheteriaTeatroAmazonas.sol` no Remix e compile com Solidity 0.8.24 ou compatível.
2. Implante a versão final na Sepolia usando a MetaMask conectada à rede de teste.
3. Copie para `frontend/contrato.js` o endereço e a ABI correspondentes ao mesmo deploy.
4. Sirva a pasta `frontend/` por um servidor HTTP local ou publique-a na Vercel.
5. Conecte a MetaMask à Sepolia. A carteira administradora pode cadastrar eventos; visitantes podem consultar eventos, escolher assentos e comprar ingressos.

Use somente SepoliaETH de teste. A compra de vários ingressos envia o preço total em uma única transação. Se algum assento estiver ocupado ou a transação falhar, nenhum ingresso dessa compra é registrado.

## Roteiro de testes — executar e registrar os resultados

Os cenários abaixo são um roteiro para executar no Remix e pela interface. Os resultados ainda devem ser preenchidos após a execução.

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Cadastro válido | Administrador cadastra evento com dados válidos | Evento criado e exibido na interface |
| Acesso restrito | Outra carteira tenta cadastrar ou alterar evento | Transação rejeitada pelo contrato |
| Compra válida em lote | Comprador seleciona dois ou mais assentos livres e envia o total correto | Uma transação registra todos os ingressos |
| Assento ocupado | Tentar comprar assento já vendido | Transação rejeitada; nenhum novo ingresso da compra em lote é registrado |
| Lista inválida | Enviar lista vazia, assento inválido ou assento duplicado | Transação rejeitada |
| Valor incorreto | Enviar valor abaixo ou acima do total | Transação rejeitada |
| Saque de receita | Organizador conectado saca o saldo pendente | Receita transferida à carteira organizadora; saldo pendente zerado |

| Cenário | Resultado observado |
|---|---|
| Testes executados em | A preencher |
| Link para evidências ou transações | A preencher |

## Dados on-chain e segurança

O contrato armazena dados básicos dos eventos, preços, estado, IDs e disponibilidade dos assentos, dados dos ingressos, carteiras compradoras e receita pendente por organizador. Esses dados e transações são públicos na blockchain. Não use chaves privadas, frases de recuperação ou fundos reais; o frontend nunca deve solicitar nem armazenar a frase de recuperação da MetaMask.

## Limitações

- O mapa é esquemático e usa uma capacidade fixa de 120 assentos.
- Os eventos são demonstrativos; o protótipo não vende ingressos reais, valida entrada física ou integra com o sistema do Teatro Amazonas.
- Alterações no contrato exigem compilar e implantar uma nova versão para refletirem no endereço implantado.
- A rede alvo indicada no guia PDF é Sepolia; o arquivo de instruções do trabalho também menciona blockchain local. Confirmar com o docente qual ambiente deve ser usado na demonstração.

## Informações para a entrega

Preencher e conferir antes da entrega:

- Integrantes e papel de cada um.
- Endereço do contrato, transação de deploy, bloco e link do Etherscan; confirmar se o código está verificado.
- URL pública da dApp na Vercel.
- Resultados do roteiro de testes e links das evidências.
- Links do vídeo de demonstração (3 a 5 minutos) e dos slides em PDF.
- Declaração completa de uso de ferramentas de IA, se aplicável.

Assistência de IA usada neste projeto: apoio na revisão dos requisitos, ajustes no código do frontend e organização desta documentação. A equipe deve revisar e validar a versão final e complementar esta declaração com as demais ferramentas utilizadas.
