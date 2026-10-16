# Aba Marketing — Central V27

Esta cópia acrescenta **Marketing** ao menu existente. Ela usa `GEMINI_API_KEY` e `GEMINI_MODEL` já configurados no servidor, sem uma segunda chave ou conta de IA.

## Recursos entregues

- Tema livre, sem vínculo obrigatório com licitações.
- Carrossel, Roteiro de Reels, Tweet / post curto, Stories e Legenda.
- Os 9 objetivos, 8 estilos e 13 técnicas da referência, com os mesmos rótulos. Cada técnica selecionada envia uma orientação específica ao Gemini. “Aplicar técnicas de viralização” gera um novo rascunho usando o briefing e as técnicas selecionadas.
- Identidade editorial opcional: marca, público, voz, oferta, exemplos, limites e assinatura.
- Resultado editável por bloco, reordenação, legenda e chamada para ação.
- Biblioteca por usuário, favoritos e estados Rascunho / Pronto / Publicado.
- Versões persistentes e carregamento de versões anteriores para nova edição.
- Copiar e baixar texto; baixar PNG de cada bloco em template tipográfico azul-marinho/branco. A sugestão visual do Gemini é orientação textual, não uma fotografia gerada.
- Proteção por login e CSRF, isolamento de conteúdos por usuário, limites de entrada, controle de edição concorrente e limite de gerações simultâneas.

## Uso

Abra Marketing, informe o assunto, selecione formato, objetivo e estilo. Opcionalmente escolha várias técnicas. Clique em Criar ou Aplicar técnicas. O rascunho fica salvo no servidor após a geração. Revise e salve suas alterações antes de exportar. Cada nova geração usa a cota do Gemini.

As opções de notícias e provas não pesquisam a internet: inclua fontes e informações no briefing. O gerador recebe instruções para não inventar dados nem afirmar atualidade sem fonte.

## Atualização da V27

Base: `Central_V27_Render(1).zip` recuperado da conversa anterior. Se o site recebeu alterações posteriores, integrar os arquivos modificados à versão atual em vez de substituir o projeto inteiro.

Antes da atualização, faça backup do banco e dos documentos existentes. Preserve as variáveis do Render, disco persistente e caminho `ER_AUTH_DB`. Não substitua o banco de produção por arquivos de teste. As tabelas `marketing_profiles`, `marketing_contents` e `marketing_versions` são criadas automaticamente no banco existente, sem remover tabelas de licitação. As funções existentes de backup do banco abrangem essas tabelas.

Arquivos adicionados: `shared/marketing.mjs`, `server/marketing.mjs`, `src/Marketing.jsx`, `src/marketing.css`, `tests/marketing.test.mjs` e este documento. Alterados: `src/App.jsx` e `server/index.mjs`.

Todos os usuários ativos com login podem criar Marketing; cada usuário acessa somente os próprios conteúdos. Não há compartilhamento de biblioteca entre colegas nesta entrega.

## Limites claros

Esta entrega implementa o fluxo central pedido e todas as opções da imagem. Não é paridade total com todas as telas do PAV/PVC: gravação/transcrição de áudio, radar de notícias, academia, análise de desempenho, metas e pesquisa de público com IA continuam fora desta implementação. As sugestões iniciais de briefing são estáticas e não são apresentadas como pesquisa por IA.

Não há publicação automática nas redes sociais. “Publicado” é marcação manual. Não há geração de fotografia/ilustração por IA. As imagens são layouts tipográficos originais; textos excessivamente longos precisam ser resumidos para caber com legibilidade.

Não foram copiados logos, textos dos usuários, templates proprietários ou prompts internos do site de referência. Os rótulos solicitados pelo usuário foram preservados; as instruções e o código são próprios.

A validação automatizada usa um gerador de teste, sem consumir créditos. A geração real depende da chave, modelo, cota e conectividade do ambiente de implantação e deve ser conferida após a atualização.
