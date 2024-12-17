# WhatsApp Bot

Este projeto é um bot para WhatsApp utilizando a biblioteca Baileys. Ele permite conectar ao WhatsApp, listar grupos e enviar mensagens para grupos e contatos específicos.

## Funcionalidades

- Conectar ao WhatsApp
- Listar grupos
- Enviar mensagens para grupos
- Enviar mensagens para contatos

## Pré-requisitos

- Node.js v14 ou superior
- NPM ou Yarn

## Instalação

1. Clone o repositório:

    ```bash
    git clone git@github.com:dhiegopereira/baileys.git
    cd baileys
    ```

2. Instale as dependências:

    ```bash
    npm install
    ```

    ou

    ```bash
    yarn install
    ```

## Uso

1. Inicie o servidor:

    ```bash
    npm run dev
    ```

2. Conecte ao WhatsApp escaneando o QR code que aparecerá no terminal.

3. Use as seguintes rotas para interagir com o bot:

    - **Listar grupos:**

        ```bash
        GET /groups
        ```

        Retorna uma lista de grupos com seus IDs e nomes.

    - **Enviar mensagem para um grupo:**

        ```bash
        POST /send-group
        ```

        Corpo da requisição (JSON):

        ```json
        {
            "groupId": "ID_DO_GRUPO",
            "message": "Sua mensagem aqui"
        }
        ```

    - **Enviar mensagem para um contato:**

        ```bash
        POST /send-message
        ```

        Corpo da requisição (JSON):

        ```json
        {
            "to": "NUMERO_DO_CONTATO",
            "message": "Sua mensagem aqui"
        }
        ```

## Estrutura do Projeto

- [index.js](http://_vscodecontentref_/0): Arquivo principal do projeto que contém a lógica de conexão ao WhatsApp e as rotas da API.
- `package.json`: Arquivo de configuração do NPM/Yarn com as dependências do projeto.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Faça o push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
