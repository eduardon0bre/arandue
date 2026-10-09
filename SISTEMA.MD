# Especificação Funcional do Projeto: Quadro de Diárias e Bicos

## 1. Visão Geral e Proposta do Sistema

O Quadro de Diárias e Bicos é uma plataforma web voltada à conexão imediata entre empregadores locais (comércios, organizadores de eventos e pequenas empresas) e trabalhadores autônomos adultos em busca de renda pontual. O sistema atende ao Objetivo de Desenvolvimento Sustentável 8 (Trabalho Decente e Crescimento Econômico), garantindo transparência prévia de remuneração, jornada delimitada e eliminação de intermediários abusivos.

A solução opera como um mural ativo com triagem integrada, onde oportunidades operacionais de curta duração (como garçom para eventos, auxiliar de carga e descarga, montador ou pintor) são anunciadas com valor fixo e preenchidas de forma ágil.

---

## 2. Entidades Centrais do Sistema

O sistema estrutura suas informações em torno de quatro núcleos de dados:

* **Usuários:** Armazena os dados cadastrais tanto de contratantes quanto de diaristas, distinguindo perfis de acesso, informações básicas de contato e localização por bairro.
* **Demandas (Vagas de Diária):** Registros centrais que descrevem a necessidade de serviço temporário, com escopo detalhado, valores, horários e endereço operacional.
* **Candidaturas:** Registros de interesse gerados quando um trabalhador solicita uma vaga, funcionando como a ponte de negociação e seleção entre as duas partes.
* **Avaliações e Histórico:** Registros gerados após o término da prestação de serviço, documentando notas e comentários sobre a experiência para alimentar a reputação de ambos os lados.

---

## 3. Detalhamento das Operações do CRUD

### Criação (Create)

A plataforma permite a inclusão de registros estruturados nas seguintes frentes:

* **Publicação de Demanda pelo Empregador:**
* *Dados inseridos:* Título da função operacional, descrição detalhada das atividades a serem desempenhadas, categoria do serviço, data e horário de início e término, valor líquido fechado da diária, forma de pagamento acordada, bairro público e endereço exato restrito.
* *Requisitos:* Definição explícita de vestimenta obrigatória ou ferramentas necessárias, além de confirmação de que a oportunidade se destina exclusivamente a maiores de 18 anos.


* **Inscrição do Trabalhador (Candidatura):**
* *Dados inseridos:* Registro do interesse do trabalhador na oportunidade específica, acompanhado de uma breve mensagem opcional de apresentação e confirmação de disponibilidade no horário exigido.


* **Registro de Avaliação Mútua:**
* *Dados inseridos:* Nota numérica (de 1 a 5) e comentário descritivo emitidos pelo contratante em relação à pontualidade e postura do diarista, e vice-versa (em relação ao ambiente e cumprimento do pagamento combinado).



### Leitura e Consulta (Read)

O sistema disponibiliza interfaces de visualização com diferentes níveis de acesso e filtros de busca:

* **Mural Público de Oportunidades:**
* Listagem em formato de cartões visíveis para qualquer usuário cadastrado como diarista.
* Exibição resumida: título, valor da diária em destaque, data de realização, horário, categoria e bairro.
* Mecanismo de filtragem por data (hoje, amanhã, próximos dias), faixa de valor e categoria profissional.


* **Página de Detalhes da Vaga:**
* Apresentação completa das instruções de trabalho, ferramentas exigidas e dados públicos do contratante (nome e reputação média).
* Ocultação do endereço exato e do telefone até que haja aprovação formal da candidatura.


* **Painel Administrativo do Empregador:**
* Tabela com todas as demandas publicadas pelo contratante, organizadas por abas de status (abertas, preenchidas, concluídas e canceladas).
* Listagem detalhada dos candidatos inscritos em cada vaga aberta, exibindo histórico de bicos realizados e média de pontualidade.


* **Painel de Atividades do Diarista:**
* Visão cronológica das diárias para as quais o usuário se candidatou, separadas entre aguardando resposta, aprovadas e concluídas.



### Atualização (Update)

O sistema permite a alteração de dados respeitando o ciclo de vida de cada registro:

* **Edição da Demanda:**
* O empregador pode modificar dados informativos de uma vaga (descrição, orientações de vestimenta ou pequenos ajustes de horário) enquanto a oportunidade estiver com status de aberta.
* Alterações críticas no valor da diária ou na data exigem notificação aos candidatos já inscritos.


* **Transição de Status da Vaga:**
* A demanda muda de estado operacional conforme o avanço do processo: de "Aberta" para "Preenchida" (quando um profissional é selecionado), "Concluída" (após a realização do turno) ou "Cancelada".


* **Aprovação e Recusa de Candidatos:**
* O empregador altera o estado da candidatura de "Pendente" para "Aprovada" ou "Recusada".
* Ao aprovar um trabalhador, o sistema altera automaticamente a demanda para "Preenchida" e recusa de forma automática os demais concorrentes pendentes, encerrando a exibição da vaga no mural público.


* **Atualização Cadastral do Perfil:**
* Usuários podem alterar telefone de contato, bairro de atuação e chave de disponibilidade (ativar ou desativar o recebimento de convites diretos).



### Exclusão e Cancelamento (Delete)

As remoções na plataforma seguem regras de validação para evitar prejuízos operacionais:

* **Remoção de Demanda pelo Empregador:**
* O empregador pode excluir um anúncio publicado por engano, desde que nenhum trabalhador tenha sido aprovado ainda.
* Caso já exista um profissional aprovado para a vaga, o sistema não permite a exclusão direta: exige um fluxo de cancelamento justificado com aviso imediato ao trabalhador e registro da desistência no perfil do contratante.
* A interface aciona obrigatoriamente uma janela de confirmação antes de efetivar a remoção definitiva do registro.


* **Desistência de Candidatura pelo Diarista:**
* O trabalhador pode cancelar sua inscrição enquanto a solicitação estiver como pendente de análise, liberando o contratante para outros perfis sem penalidades.
* Cancelamentos após a aprovação formal bloqueiam temporariamente a candidatura do profissional em outras vagas pelo mesmo período.



---

## 4. Fluxo de Seleção e Canal de Contato

Para equilibrar privacidade e rapidez no recrutamento, os dados de comunicação seguem etapas rígidas:

1. **Etapa de Triagem:** Durante a fase aberta, o empregador avalia apenas as informações públicas e profissionais do diarista (nome, avaliações prévias e mensagem de candidatura). Números de telefone e contatos privados permanecem mascarados.
2. **Etapa de Aceite:** No momento exato em que o empregador clica em aprovar o candidato selecionado, o sistema libera uma área de contato direto.
3. **Comunicação Imediata:** A tela disponibiliza um atalho direto para o aplicativo de mensagens e chamada telefônica com o número do trabalhador, permitindo o alinhamento de pontos de encontro, horários finos e confirmações de presença. Simultaneamente, o trabalhador recebe em sua tela o endereço completo e o número de contato do contratante.

---

## 5. Regras de Negócio e Diretrizes de Confiabilidade

* **Trava de Conflito de Agenda:** O sistema rejeita tentativas de inscrição de um diarista em demandas cujos horários e datas colidam com um bico já aprovado anteriormente.
* **Garantia de Maioridade:** Todos os formulários de cadastro exigem declaração explícita de maioridade civil (18 anos completos), bloqueando perfis menores de idade para salvaguarda da legislação trabalhista.
* **Transparência Tarifária:** Fica proibida a publicação de demandas sem valor monetário preenchido ou com a indicação de remuneração a combinar. O valor é fixado na abertura para assegurar previsibilidade de renda ao trabalhador.
* **Avaliação Cega:** A nota e os comentários emitidos por uma das partes só se tornam visíveis publicamente após a outra parte também registrar sua avaliação ou após o transcurso do prazo limite de sete dias, impedindo notas depreciativas motivadas por retaliação.