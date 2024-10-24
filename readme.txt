
Primeira Parte do código

FAÇA O download dos ARQUIVOS EXCEL ANTES DE FAZER O SORTEIO, POIS APÓS O SORTEIO AS INSCRICOES SÃO APAGADAS.

Instalar as depedencias: npm install express sqlite3 nodemailer exceljs cors basic-auth fs path multer pdf-parse dotenv express-session bcrypt

Pagina ADMIN
Entra:(/login)  todos os links para download no excel e links para pagina estão aqui.

let transporte --> informações do e-mail 
*senha do e-mail e usuário estão no arquivo .env
Manipula operações de banco de dados (como inserir, atualizar, deletar e selecionar registros) com um banco de dados SQLite.
Usando GET
podem ser incontrados no server.js

Inserir (/insert/:table)

Atualizar (/update/:table/:id)

Deletar um item específico (/delete/:table/:id)

Deletar uma tabela (/drop/:table)

Selecionar Dados por ID (/select/:table/:id)

Todos os ganhadores (/inscricoes/ganharam)

Rota para executar o sorteio (/sorteio/:patrimonio) *logo abaixo no código estão as funções para o sorteio.

Selecionar Todos os Dados de uma Tabela (/select/:table) 
*caso a tabela selecionada for itens, apenas retorna os itens disponíveis.
Caso deseje selecionar os itens disponíveis e indisponíveis use (/itens).
Rota para checar matrícula (/check-matricula)

Usando POST

Rotas especificas de /cadastroPC.html 
(/cadastro-item)
(/upload/excel)
(/upload) Upload imagem

Rotas do sorteio
(/send-email) Envio do e-mail

