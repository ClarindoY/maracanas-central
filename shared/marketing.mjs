export const FORMATS=['Carrossel','Roteiro de Reels','Tweet / post curto','Stories','Legenda'];
export const OBJECTIVES=['Viralizar','Ganhar seguidores','Construir autoridade','Gerar leads','Vender','Educar','Criar conexão','Quebrar objeções','Fortalecer posicionamento'];
export const STYLES=['Educativo','Viral','Provocativo','Quebra de objeções','Autoridade','Storytelling','Comercial','Posicionamento de marca'];
export const TECHNIQUES=[
 ['Comece o vídeo indignado','Abra com uma indignação pertinente ao tema, sem inventar fatos nem atacar pessoas.'],
 ['Aproveite notícias em alta','Use apenas notícias fornecidas no briefing, mantendo fonte e data. Sem fonte, não afirme atualidade.'],
 ['Participe dos debates','Apresente uma tensão relevante do tema e convide a uma discussão respeitosa.'],
 ['Tenha posicionamento claro','Defenda uma ideia central compreensível, distinguindo opinião de fato.'],
 ['Prenda a atenção nos 3 primeiros segundos','Crie um gancho imediato que entregue valor ao longo do conteúdo.'],
 ['Coloque provas na tela','Sugira evidências reais fornecidas pelo usuário; se faltarem, indique o que precisa ser comprovado.'],
 ['Elimine introduções desnecessárias','Comece pelo assunto, sem cumprimentos ou preâmbulos.'],
 ['Repita formatos que funcionam','Aproveite a estrutura dos exemplos fornecidos sem copiar seus textos.'],
 ['Crie conteúdos compartilháveis','Inclua uma descoberta, checklist ou dica útil que faça sentido compartilhar.'],
 ['Use frases de impacto na tela','Proponha frases curtas, legíveis e coerentes com a mensagem.'],
 ['Use storytelling','Estruture contexto, conflito e resolução; não invente experiência pessoal como verdadeira.'],
 ['Dê motivos para seguir o perfil','Explique o valor de acompanhar o perfil, sem prometer resultados garantidos.'],
 ['Multiplique os temas que viralizaram','Derive novos ângulos dos exemplos fornecidos, sem afirmar desempenho não informado.'],
];
export const EMPTY_PROFILE={name:'',audience:'',voice:'',offer:'',examples:'',limits:'',signature:''};
export const DEFAULT_BRIEF={topic:'',format:FORMATS[0],objective:OBJECTIVES[0],style:STYLES[0],techniques:[]};
export function contentText(c){return [c.title,...c.blocks.map(b=>[b.heading,b.text,b.visual&&'Visual: '+b.visual].filter(Boolean).join('\n')),c.caption,c.cta,...(c.notes||[])].filter(Boolean).join('\n\n');}
