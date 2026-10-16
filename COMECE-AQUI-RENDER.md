# Atualizar no Render — Central V27 com Marketing

Este pacote é uma cópia completa do código da V27 recuperada, acrescida da aba Marketing. Não contém banco de dados, usuários de teste, senhas, chaves, node_modules ou build local.

## Atualizar o serviço existente

1. Extraia o ZIP. Use os arquivos dentro de Central_V27_Marketing_Render para atualizar o projeto/repositório que já alimenta o seu serviço Render. O ZIP é a entrega do código; não é um backup dos seus dados.
2. Faça backup do banco e dos documentos antes da atualização. Se houve alterações no site depois de Central_V27_Render(1).zip, integre as mudanças descritas em MARKETING-LEIA-ME.md à sua versão mais recente, em vez de substituí-la por esta base.
3. Preserve o serviço, o disco persistente e as variáveis existentes. Mantenha GEMINI_API_KEY e o GEMINI_MODEL que já funciona no seu site. Não habilite DEMO_MODE. Não troque ER_AUTH_DB nem o disco usado em produção.
4. Os comandos deste projeto são: Build: npm ci --include=dev && npm run build; Start: npm start. O render.yaml mantém a configuração de hospedagem da base recebida. Se o projeto usar Root Directory, aponte para a pasta que contém package.json.
5. Faça o deploy pelo fluxo habitual do seu serviço. O servidor cria as tabelas de Marketing automaticamente no mesmo banco, sem apagar tabelas de licitações.
6. Entre com seu login atual e abra Marketing. Não precisa cadastrar outro usuário nem configurar outra chave de IA.

Não é necessário criar um novo serviço para atualizar o existente. Se usar o Blueprint para um serviço novo, ele não conterá os usuários/dados do serviço anterior. O plano de disco do render.yaml é o mesmo da base e pode ter cobrança pelo Render.

## Roteiro de teste

- Escreva um assunto livre, por exemplo: uma campanha para uma cafeteria.
- Escolha Carrossel, objetivo Vender e estilo Storytelling.
- Selecione duas ou três técnicas e clique em Criar carrossel.
- Confira o resultado, edite um bloco e salve. Abra o histórico.
- Copie o texto e baixe a imagem de um bloco.
- Abra Meus conteúdos, favorite o item e altere o status.
- Saia e entre novamente: o conteúdo deve continuar salvo.
- Teste os demais formatos e configure a Identidade.
- Com outro usuário, confira que a biblioteca é separada.
- Confira também busca, documentos e análise de licitações que já usa.

A geração real será validada no seu ambiente com a chave já ativa. Se houver erro, envie a mensagem apresentada na tela, sem enviar chaves ou senhas.

## O que foi verificado antes da entrega

Build de produção concluído. Os 40 testes automatizados passaram ao considerar a execução inicial e a repetição dos dois testes afetados pelo ambiente restrito. Login local, navegação Marketing e presença de todos os controles da imagem foram conferidos no navegador. Testes de geração usam resposta simulada: não atestam disponibilidade de modelo/cota no seu Render. Não foi feito deploy por aqui.

## Escopo desta entrega

Criação livre com Gemini, cinco formatos, nove objetivos, oito estilos e treze técnicas da imagem, identidade de escrita, edição, biblioteca privada, favoritos, status, versões e exportação de texto/PNG tipográfico.

Não inclui áudio, radar de notícias, pesquisa web automática, academia, métricas de redes sociais ou postagem automática. A opção de notícias usa as informações fornecidas no briefing. Consulte MARKETING-LEIA-ME.md para os detalhes.
