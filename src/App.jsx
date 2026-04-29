import { useState, useEffect, useRef, useLayoutEffect } from "react";

// ─── CONFIGURAÇÃO DO ENVIO POR E-MAIL ────────────────────────────────────────
// 1) Crie uma conta gratuita em https://formspree.io
// 2) Crie um novo formulário ("New form") apontando para amdg.engtech@gmail.com
// 3) Copie a URL do endpoint (algo como https://formspree.io/f/xxxxxxxx)
// 4) Cole a URL abaixo, entre as aspas:
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xgodwoqo";
// E-mail de destino (apenas para mostrar ao cliente na tela de envio)
const ARQUITETO_EMAIL = "amdg.engtech@gmail.com";

// ─── Constantes & Mapas ──────────────────────────────────────────────────────

const STORAGE_KEY = "arch_questionnaire_v1";

const BLOCKS = [
  { id: 1, title: "Identificação", icon: "👤", short: "Você" },
  { id: 2, title: "O Terreno", icon: "📍", short: "Terreno" },
  { id: 3, title: "Expectativas Gerais", icon: "🏡", short: "Visão" },
  { id: 4, title: "Ambientes", icon: "🏠", short: "Cômodos" },
  { id: 5, title: "Acessibilidade", icon: "♿", short: "Acesso" },
  { id: 6, title: "Conforto & Rotina", icon: "☀️", short: "Conforto" },
  { id: 7, title: "Sustentabilidade", icon: "🌿", short: "Eco" },
  { id: 8, title: "Orçamento & Prazo", icon: "💰", short: "Verba" },
  { id: 9, title: "Observações Finais", icon: "📝", short: "Extras" },
];

// Mapas value → label para uso no Summary
const OPT_LABELS = {
  mudancaFamiliar: { sim: "Sim", nao: "Não", naosai: "Não sei ainda" },
  possuiTerreno: { sim: "Sim", nao: "Não, ainda buscando", naosai: "Não sei ainda" },
  topografia: { plano: "Plano", sobe: "Sobe em relação à rua", desce: "Desce em relação à rua", naosai: "Não sei" },
  estiloVisual: {
    moderno: "Moderno / Contemporâneo",
    classico: "Clássico / Tradicional",
    rustico: "Rústico / Colonial",
    minimalista: "Minimalista",
    outro: "Outro",
  },
  temReferencias: { sim: "Sim — enviarei junto", nao: "Não tenho referências definidas" },
  pavimentos: { terreo: "Térrea", dois: "Dois andares", livre: "Sem preferência" },
  etapasConstrucao: { tudoumavez: "Tudo de uma vez", etapas: "Em etapas", naodecidiu: "Ainda não decidi" },
  salaStar: { sim: "Quero", nao: "Não quero", talvez: "Posso abrir mão" },
  salaJantar: {
    separada: "Separada da sala de estar",
    integrada: "Integrada com a sala de estar",
    sempreferencia: "Sem preferência",
    nao: "Não quero",
  },
  varanda: { sim: "Quero", nao: "Não quero", talvez: "Talvez" },
  tipoCozinha: { fechada: "Fechada", aberta: "Aberta / integrada", gourmet: "Gourmet", sempreferencia: "Sem preferência" },
  despensa: { sim: "Sim", nao: "Não", tanto_faz: "Tanto faz" },
  areaServico: { separada: "Separada e fechada", integrada: "Integrada à cozinha", externa: "Área externa coberta" },
  empregada: { sim: "Sim", nao: "Não", talvez: "Talvez" },
  lavabo: { sim: "Sim", nao: "Não" },
  homeOffice: { sim: "Sim", nao: "Não" },
  tipoEscritorio: { separado: "Cômodo separado", cantinho: "Cantinho integrado", integrado: "Integrado à sala/quarto" },
  recebeClientes: { sim: "Sim, com frequência", as_vezes: "Às vezes", nao: "Não" },
  tipoGaragem: { fechada: "Coberta e fechada", coberta_aberta: "Coberta, aberta nas laterais", sempreferencia: "Sem preferência" },
  areasExternas: {
    jardim: "Jardim / área verde",
    piscina: "Piscina",
    churrasqueira: "Churrasqueira",
    gourmet: "Área gourmet externa",
    playground: "Playground",
    quadra: "Quadra esportiva",
    horta: "Horta",
    pets: "Espaço para animais",
  },
  dificuldadeLocomocao: { sim: "Sim", nao: "Não", futuro: "Não agora, mas preparar p/ o futuro" },
  idosos: { sim: "Sim", nao: "Não" },
  iluminacao: {
    muito_iluminada: "Muito iluminada, cheia de janelas",
    equilibrada: "Iluminação equilibrada",
    fechada: "Ambientes mais fechados",
    sem_preferencia: "Sem preferência",
  },
  ventilacao: {
    natural: "Natural (janelas, aberturas)",
    arcondicionado: "Ar condicionado em todos",
    ambos: "Natural + ar condicionado onde necessário",
  },
  sustentabilidade: {
    solar_energia: "Painel solar (energia)",
    solar_agua: "Aquecimento solar de água",
    chuva: "Reaproveitamento de água da chuva",
    jardim_nativo: "Jardim nativo / horta",
    sem_interesse: "Sem interesse específico",
  },
  orcamentoDefined: { sim: "Sim", nao: "Sem valor definido", nao_informar: "Prefiro não informar" },
  financiamento: {
    proprio: "Recursos próprios",
    financiamento: "Financiamento bancário",
    misto: "Misto",
    naosai: "Ainda não sei",
  },
};

// Campos obrigatórios por bloco (para validação)
const REQUIRED_FIELDS = {
  1: ["nomeResponsavel", "contato", "qtdMoradores"],
  2: ["possuiTerreno"],
  3: ["descricaoCasa"],
  4: ["qtdQuartos"],
  5: ["dificuldadeLocomocao"],
  6: [],
  7: [],
  8: ["orcamentoDefined"],
  9: [],
};

const initialData = {
  nomeResponsavel: "", contato: "", qtdMoradores: "", perfilMoradores: "",
  mudancaFamiliar: "", mudancaFamiliarDesc: "",

  possuiTerreno: "", enderecoTerreno: "", topografia: "",
  caracteristicasTerreno: "", solTerreno: "", vizinhanca: "",

  descricaoCasa: "", estiloVisual: [], estiloVisualOutro: "",
  temReferencias: "", pavimentos: "", etapasConstrucao: "",

  salaStar: "", salaStarObs: "", salaJantar: "",
  pessoasMesaNormal: "", pessoasMesaFesta: "",
  varanda: "", varandaUso: "", espacoFestas: "",

  tipoCozinha: "", quemCozinha: "", eletrodomesticosEspeciais: "",
  despensa: "", areaServico: "", empregada: "",

  qtdQuartos: "",
  quartos: [],
  suitePrincipalObs: "", quartoInfantilObs: "",

  qtdBanheiros: "", lavabo: "", banheiroPrincipalObs: "",

  homeOffice: "", tipoEscritorio: "", recebeClientes: "",

  qtdCarros: "", outrosVeiculos: "", tipoGaragem: "",

  areasExternas: [], animaisEstimacao: "",

  dificuldadeLocomocao: "", dificuldadeLocomocaoDesc: "",
  deficienciaVisualAuditiva: "", idosos: "",

  rotina: "", hobbies: "", iluminacao: "", ventilacao: "", preocupacaoRuido: "",

  sustentabilidade: [], materiaisPreferidos: "", materiaisNaoQuer: "",

  orcamentoDefined: "", orcamentoValor: "", financiamento: "", prazo: "", restricoes: "",

  naoQuer: "", experienciaAnterior: "", outrasInfos: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeQuarto() {
  return { paraQuem: "", tamanho: "", banheiro: "", closet: "" };
}

function ensureQuartos(quartos, n) {
  const arr = [...(quartos || [])];
  while (arr.length < n) arr.push(makeQuarto());
  return arr.slice(0, Math.max(n, arr.length));
}

function parseQtdQuartos(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

// Persistência (window.storage com fallback silencioso)
async function saveData(data) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(data));
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    // falha silenciosa - não interromper UX
  }
}

async function loadData() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const result = await window.storage.get(STORAGE_KEY);
      if (result?.value) return JSON.parse(result.value);
    } else if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    // chave inexistente é normal
  }
  return null;
}

async function clearData() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.delete(STORAGE_KEY);
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}
}

// ─── UI Primitives ───────────────────────────────────────────────────────────

let _idCounter = 0;
const useFieldId = () => {
  const ref = useRef(null);
  if (!ref.current) ref.current = `f${++_idCounter}`;
  return ref.current;
};

function Label({ children, sub, htmlFor, required }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 15,
          color: "#2c1f0e",
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        {children}
        {required && <span style={{ color: "#c33", marginLeft: 4 }} aria-label="obrigatório">*</span>}
      </label>
      {sub && (
        <div style={{ fontSize: 12, color: "#6b5040", marginTop: 2, fontStyle: "italic" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline, rows = 3, id, invalid }) {
  const style = {
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${invalid ? "#c33" : "#d4bfaa"}`,
    borderRadius: 10,
    fontFamily: "'Lora', serif",
    fontSize: 14,
    color: "#2c1f0e",
    background: "#fefcf9",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
  };

  return multiline ? (
    <textarea
      id={id}
      rows={rows}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      aria-invalid={invalid || undefined}
      onFocus={(e) => (e.target.style.borderColor = "#b5622a")}
      onBlur={(e) => (e.target.style.borderColor = invalid ? "#c33" : "#d4bfaa")}
    />
  ) : (
    <input
      id={id}
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      aria-invalid={invalid || undefined}
      onFocus={(e) => (e.target.style.borderColor = "#b5622a")}
      onBlur={(e) => (e.target.style.borderColor = invalid ? "#c33" : "#d4bfaa")}
    />
  );
}

function RadioGroup({ name, options, value, onChange, invalid }) {
  return (
    <div role="radiogroup" aria-invalid={invalid || undefined} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        const inputId = `${name}-${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className="opt-card"
            data-selected={selected}
            data-invalid={invalid && !value ? true : undefined}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span aria-hidden="true" className="radio-dot" data-selected={selected}>
              {selected && <span className="radio-dot-inner" />}
            </span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckGroup({ name, options, value = [], onChange }) {
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const inputId = `${name}-${opt.value}`;
        return (
          <label key={opt.value} htmlFor={inputId} className="opt-card" data-selected={selected}>
            <input
              type="checkbox"
              id={inputId}
              name={name}
              checked={selected}
              onChange={() => toggle(opt.value)}
              className="sr-only"
            />
            <span aria-hidden="true" className="check-box" data-selected={selected}>
              {selected && "✓"}
            </span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function Field({ children, style = {} }) {
  return <div style={{ marginBottom: 22, ...style }}>{children}</div>;
}

function SectionTitle({ children, id }) {
  return (
    <div id={id} style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: 13,
      fontWeight: 700,
      color: "#9a4f1f",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      marginTop: 24,
      marginBottom: 14,
      paddingBottom: 6,
      borderBottom: "1px solid #e8d8c8",
      scrollMarginTop: 140,
    }}>
      {children}
    </div>
  );
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function Block1({ data, update, errors }) {
  const id1 = useFieldId(), id2 = useFieldId(), id3 = useFieldId(), id4 = useFieldId();
  return (
    <>
      <Field>
        <Label htmlFor={id1} required>Nome completo do(s) responsável(is)</Label>
        <TextInput id={id1} value={data.nomeResponsavel} onChange={(v) => update("nomeResponsavel", v)}
          placeholder="Ex.: Maria e João Silva" invalid={errors.nomeResponsavel} />
      </Field>
      <Field>
        <Label htmlFor={id2} required>Telefone e e-mail para contato</Label>
        <TextInput id={id2} value={data.contato} onChange={(v) => update("contato", v)}
          placeholder="Ex.: (11) 99999-9999 | email@email.com" invalid={errors.contato} />
      </Field>
      <Field>
        <Label htmlFor={id3} required>Quantas pessoas vão morar na casa?</Label>
        <TextInput id={id3} value={data.qtdMoradores} onChange={(v) => update("qtdMoradores", v)}
          placeholder="Ex.: 4 pessoas" invalid={errors.qtdMoradores} />
      </Field>
      <Field>
        <Label htmlFor={id4}>Perfil de cada morador</Label>
        <TextInput id={id4} multiline value={data.perfilMoradores}
          onChange={(v) => update("perfilMoradores", v)}
          placeholder="Ex.: casal com 2 filhos (8 e 12 anos), avó com mobilidade reduzida..." />
      </Field>
      <Field>
        <Label>Previsão de mudança na família nos próximos anos?</Label>
        <RadioGroup name="mudancaFamiliar" value={data.mudancaFamiliar}
          onChange={(v) => update("mudancaFamiliar", v)}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não" },
            { value: "naosai", label: "Não sei ainda" },
          ]}
        />
        {data.mudancaFamiliar === "sim" && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={data.mudancaFamiliarDesc}
              onChange={(v) => update("mudancaFamiliarDesc", v)}
              placeholder="Descreva a mudança esperada..." />
          </div>
        )}
      </Field>
    </>
  );
}

function Block2({ data, update, errors }) {
  const ids = [useFieldId(), useFieldId(), useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label required>Você já possui o terreno?</Label>
        <RadioGroup name="possuiTerreno" value={data.possuiTerreno}
          onChange={(v) => update("possuiTerreno", v)} invalid={errors.possuiTerreno}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não, ainda estou buscando" },
            { value: "naosai", label: "Não sei ainda" },
          ]}
        />
      </Field>
      {data.possuiTerreno === "sim" && (
        <Field>
          <Label htmlFor={ids[0]}>Endereço e tamanho aproximado do terreno</Label>
          <TextInput id={ids[0]} multiline value={data.enderecoTerreno}
            onChange={(v) => update("enderecoTerreno", v)}
            placeholder="Ex.: Rua das Flores, 123 – Bairro X | 12m x 30m (360m²)" />
        </Field>
      )}
      <Field>
        <Label>O terreno é plano ou inclinado?</Label>
        <RadioGroup name="topografia" value={data.topografia}
          onChange={(v) => update("topografia", v)}
          options={[
            { value: "plano", label: "Plano" },
            { value: "sobe", label: "Sobe em relação à rua" },
            { value: "desce", label: "Desce em relação à rua" },
            { value: "naosai", label: "Não sei" },
          ]}
        />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Há algo no terreno que você quer preservar?</Label>
        <TextInput id={ids[1]} multiline value={data.caracteristicasTerreno}
          onChange={(v) => update("caracteristicasTerreno", v)}
          placeholder="Ex.: árvore centenária, construção existente, vista para lago..." rows={2} />
      </Field>
      <Field>
        <Label htmlFor={ids[2]} sub="Útil para definir orientação solar dos cômodos">
          Para onde o terreno recebe sol pela manhã?
        </Label>
        <TextInput id={ids[2]} value={data.solTerreno}
          onChange={(v) => update("solTerreno", v)}
          placeholder="Ex.: fundo do terreno, lado esquerdo..." />
      </Field>
      <Field>
        <Label htmlFor={ids[3]}>O que há ao redor do terreno?</Label>
        <TextInput id={ids[3]} multiline value={data.vizinhanca}
          onChange={(v) => update("vizinhanca", v)}
          placeholder="Ex.: casas residenciais dos dois lados, comércio à frente, área verde nos fundos..." rows={2} />
      </Field>
    </>
  );
}

function Block3({ data, update, errors }) {
  const ids = [useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label htmlFor={ids[0]} required>Como você descreveria a casa dos seus sonhos?</Label>
        <TextInput id={ids[0]} multiline value={data.descricaoCasa}
          onChange={(v) => update("descricaoCasa", v)}
          placeholder="Use suas próprias palavras, sem preocupação técnica..." rows={3}
          invalid={errors.descricaoCasa} />
      </Field>
      <Field>
        <Label sub="Pode marcar mais de um">Estilo visual preferido</Label>
        <CheckGroup name="estiloVisual" value={data.estiloVisual}
          onChange={(v) => update("estiloVisual", v)}
          options={[
            { value: "moderno", label: "Moderno / Contemporâneo" },
            { value: "classico", label: "Clássico / Tradicional" },
            { value: "rustico", label: "Rústico / Colonial" },
            { value: "minimalista", label: "Minimalista (simples, limpo)" },
            { value: "outro", label: "Outro" },
          ]}
        />
        {data.estiloVisual.includes("outro") && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={data.estiloVisualOutro}
              onChange={(v) => update("estiloVisualOutro", v)}
              placeholder="Descreva o estilo que você imagina..." />
          </div>
        )}
      </Field>
      <Field>
        <Label sub="Fotos, Pinterest, revistas, projetos que admirou">Você tem referências visuais?</Label>
        <RadioGroup name="temReferencias" value={data.temReferencias}
          onChange={(v) => update("temReferencias", v)}
          options={[
            { value: "sim", label: "Sim — enviarei junto ao questionário" },
            { value: "nao", label: "Não tenho referências definidas" },
          ]}
        />
      </Field>
      <Field>
        <Label>Número de andares</Label>
        <RadioGroup name="pavimentos" value={data.pavimentos}
          onChange={(v) => update("pavimentos", v)}
          options={[
            { value: "terreo", label: "Térrea (apenas um andar)" },
            { value: "dois", label: "Dois andares" },
            { value: "livre", label: "Sem preferência — deixo ao arquiteto" },
          ]}
        />
      </Field>
      <Field>
        <Label>Pretende construir tudo de uma vez ou em etapas?</Label>
        <RadioGroup name="etapasConstrucao" value={data.etapasConstrucao}
          onChange={(v) => update("etapasConstrucao", v)}
          options={[
            { value: "tudoumavez", label: "Tudo de uma vez" },
            { value: "etapas", label: "Em etapas (começa menor e amplia depois)" },
            { value: "naodecidiu", label: "Ainda não decidi" },
          ]}
        />
      </Field>
    </>
  );
}

// Sub-componentes do Block4 -------------------------------------------------

function Block4Social({ data, update }) {
  const ids = [useFieldId(), useFieldId(), useFieldId(), useFieldId()];
  return (
    <>
      <SectionTitle id="sec-social">Área Social</SectionTitle>
      <Field>
        <Label>Sala de estar</Label>
        <RadioGroup name="salaStar" value={data.salaStar}
          onChange={(v) => update("salaStar", v)}
          options={[
            { value: "sim", label: "Quero" },
            { value: "nao", label: "Não quero" },
            { value: "talvez", label: "Posso abrir mão dependendo do projeto" },
          ]}
        />
        {data.salaStar === "sim" && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={data.salaStarObs} onChange={(v) => update("salaStarObs", v)}
              placeholder="Tamanho desejado ou observações..." />
          </div>
        )}
      </Field>
      <Field>
        <Label>Sala de jantar</Label>
        <RadioGroup name="salaJantar" value={data.salaJantar}
          onChange={(v) => update("salaJantar", v)}
          options={[
            { value: "separada", label: "Quero separada da sala de estar" },
            { value: "integrada", label: "Quero integrada com a sala de estar" },
            { value: "sempreferencia", label: "Sem preferência" },
            { value: "nao", label: "Não quero" },
          ]}
        />
        {data.salaJantar && data.salaJantar !== "nao" && (
          <div style={{ marginTop: 10 }} className="resp-grid-2">
            <TextInput id={ids[0]} value={data.pessoasMesaNormal}
              onChange={(v) => update("pessoasMesaNormal", v)}
              placeholder="Pessoas normalmente..." />
            <TextInput id={ids[1]} value={data.pessoasMesaFesta}
              onChange={(v) => update("pessoasMesaFesta", v)}
              placeholder="Em festas / reuniões..." />
          </div>
        )}
      </Field>
      <Field>
        <Label>Varanda / área coberta externa</Label>
        <RadioGroup name="varanda" value={data.varanda}
          onChange={(v) => update("varanda", v)}
          options={[
            { value: "sim", label: "Quero" },
            { value: "nao", label: "Não quero" },
            { value: "talvez", label: "Talvez" },
          ]}
        />
        {data.varanda === "sim" && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={data.varandaUso} onChange={(v) => update("varandaUso", v)}
              placeholder="Uso pretendido: churrasqueira, estar, refeições..." />
          </div>
        )}
      </Field>
    </>
  );
}

function Block4Cozinha({ data, update }) {
  const id1 = useFieldId(), id2 = useFieldId();
  return (
    <>
      <SectionTitle id="sec-cozinha">Cozinha & Área de Serviço</SectionTitle>
      <Field>
        <Label>Como prefere a cozinha?</Label>
        <RadioGroup name="tipoCozinha" value={data.tipoCozinha}
          onChange={(v) => update("tipoCozinha", v)}
          options={[
            { value: "fechada", label: "Fechada (separada das demais áreas)" },
            { value: "aberta", label: "Aberta / integrada com a sala" },
            { value: "gourmet", label: "Gourmet (ampla, para receber)" },
            { value: "sempreferencia", label: "Sem preferência" },
          ]}
        />
      </Field>
      <Field>
        <Label htmlFor={id1}>Quem cozinha e com que frequência?</Label>
        <TextInput id={id1} value={data.quemCozinha} onChange={(v) => update("quemCozinha", v)}
          placeholder="Ex.: minha esposa, todos os dias..." />
      </Field>
      <Field>
        <Label htmlFor={id2}>Eletrodomésticos grandes que precisam de espaço especial?</Label>
        <TextInput id={id2} value={data.eletrodomesticosEspeciais}
          onChange={(v) => update("eletrodomesticosEspeciais", v)}
          placeholder="Ex.: forno combinado, adega, geladeira extra..." />
      </Field>
      <Field>
        <Label>Deseja despensa ou armários de armazenamento na cozinha?</Label>
        <RadioGroup name="despensa" value={data.despensa} onChange={(v) => update("despensa", v)}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não" },
            { value: "tanto_faz", label: "Tanto faz" },
          ]}
        />
      </Field>
      <Field>
        <Label>Área de serviço (lavanderia, tanque, máquina)</Label>
        <RadioGroup name="areaServico" value={data.areaServico} onChange={(v) => update("areaServico", v)}
          options={[
            { value: "separada", label: "Separada e fechada" },
            { value: "integrada", label: "Integrada à cozinha" },
            { value: "externa", label: "Área externa coberta" },
          ]}
        />
      </Field>
      <Field>
        <Label>Haverá empregada morando na casa?</Label>
        <RadioGroup name="empregada" value={data.empregada} onChange={(v) => update("empregada", v)}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não" },
            { value: "talvez", label: "Talvez" },
          ]}
        />
      </Field>
    </>
  );
}

function Block4Quartos({ data, update, errors }) {
  const numQuartos = parseQtdQuartos(data.qtdQuartos);

  useEffect(() => {
    if (numQuartos > 0 && data.quartos.length !== numQuartos) {
      update("quartos", ensureQuartos(data.quartos, numQuartos));
    }
  }, [numQuartos]); // eslint-disable-line

  const updateQuarto = (idx, field, val) => {
    const q = ensureQuartos(data.quartos, numQuartos);
    q[idx] = { ...q[idx], [field]: val };
    update("quartos", q);
  };

  const id1 = useFieldId();

  return (
    <>
      <SectionTitle id="sec-quartos">Quartos</SectionTitle>
      <Field>
        <Label required>Quantos quartos você deseja?</Label>
        <RadioGroup name="qtdQuartos" value={data.qtdQuartos}
          onChange={(v) => update("qtdQuartos", v)} invalid={errors.qtdQuartos}
          options={[
            { value: "2", label: "2 quartos" },
            { value: "3", label: "3 quartos" },
            { value: "4", label: "4 quartos" },
            { value: "5", label: "5 quartos" },
            { value: "6", label: "6 ou mais quartos" },
          ]}
        />
      </Field>
      {numQuartos > 0 && (
        <Field>
          <Label>Detalhes de cada quarto</Label>
          {Array.from({ length: numQuartos }).map((_, i) => (
            <div key={i} style={{
              background: "#fdf6ef", border: "1.5px solid #e8d8c8",
              borderRadius: 10, padding: 14, marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontSize: 13,
                color: "#9a4f1f", marginBottom: 10, fontWeight: 700,
              }}>
                Quarto {i + 1}
              </div>
              <div className="resp-grid-quartos" style={{ marginBottom: 10 }}>
                <TextInput value={data.quartos[i]?.paraQuem || ""}
                  onChange={(v) => updateQuarto(i, "paraQuem", v)}
                  placeholder="Para quem?" />
                <TextInput value={data.quartos[i]?.tamanho || ""}
                  onChange={(v) => updateQuarto(i, "tamanho", v)}
                  placeholder="Tamanho (grande, médio...)" />
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'Lora', serif", cursor: "pointer" }}>
                  <input type="checkbox"
                    checked={data.quartos[i]?.banheiro === "sim"}
                    onChange={(e) => updateQuarto(i, "banheiro", e.target.checked ? "sim" : "")}
                  />
                  Banheiro próprio
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'Lora', serif", cursor: "pointer" }}>
                  <input type="checkbox"
                    checked={data.quartos[i]?.closet === "sim"}
                    onChange={(e) => updateQuarto(i, "closet", e.target.checked ? "sim" : "")}
                  />
                  Closet
                </label>
              </div>
            </div>
          ))}
        </Field>
      )}
      <Field>
        <Label htmlFor={id1}>Desejos especiais para a suíte do casal</Label>
        <TextInput id={id1} multiline value={data.suitePrincipalObs}
          onChange={(v) => update("suitePrincipalObs", v)}
          placeholder="Ex.: banheira, varanda privativa, closet grande, home office integrado..." rows={2} />
      </Field>
    </>
  );
}

function Block4Banheiros({ data, update }) {
  const ids = [useFieldId(), useFieldId()];
  return (
    <>
      <SectionTitle id="sec-banheiros">Banheiros & Lavabos</SectionTitle>
      <Field>
        <Label htmlFor={ids[0]}>Quantos banheiros no total? (incluindo os das suítes)</Label>
        <TextInput id={ids[0]} value={data.qtdBanheiros}
          onChange={(v) => update("qtdBanheiros", v)} placeholder="Ex.: 3 banheiros" />
      </Field>
      <Field>
        <Label sub="Banheiro sem chuveiro, na área social">Deseja lavabo para visitas?</Label>
        <RadioGroup name="lavabo" value={data.lavabo} onChange={(v) => update("lavabo", v)}
          options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Preferências para o banheiro principal</Label>
        <TextInput id={ids[1]} value={data.banheiroPrincipalObs}
          onChange={(v) => update("banheiroPrincipalObs", v)}
          placeholder="Ex.: banheira, chuveiro chuva, dois lavatórios..." />
      </Field>
    </>
  );
}

function Block4Office({ data, update }) {
  return (
    <>
      <SectionTitle id="sec-office">Escritório / Home Office</SectionTitle>
      <Field>
        <Label>Alguém trabalha ou estuda em casa?</Label>
        <RadioGroup name="homeOffice" value={data.homeOffice}
          onChange={(v) => update("homeOffice", v)}
          options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} />
      </Field>
      {data.homeOffice === "sim" && (
        <>
          <Field>
            <Label>Como deve ser esse espaço?</Label>
            <RadioGroup name="tipoEscritorio" value={data.tipoEscritorio}
              onChange={(v) => update("tipoEscritorio", v)}
              options={[
                { value: "separado", label: "Um cômodo separado e fechado" },
                { value: "cantinho", label: "Um cantinho dentro de outro cômodo" },
                { value: "integrado", label: "Integrado à sala ou quarto" },
              ]} />
          </Field>
          <Field>
            <Label>Receberá clientes ou parceiros em casa?</Label>
            <RadioGroup name="recebeClientes" value={data.recebeClientes}
              onChange={(v) => update("recebeClientes", v)}
              options={[
                { value: "sim", label: "Sim, com frequência" },
                { value: "as_vezes", label: "Às vezes" },
                { value: "nao", label: "Não" },
              ]} />
          </Field>
        </>
      )}
    </>
  );
}

function Block4Garagem({ data, update }) {
  const id1 = useFieldId();
  return (
    <>
      <SectionTitle id="sec-garagem">Garagem</SectionTitle>
      <Field>
        <Label>Quantos carros precisam ser guardados?</Label>
        <RadioGroup name="qtdCarros" value={data.qtdCarros}
          onChange={(v) => update("qtdCarros", v)}
          options={[
            { value: "1", label: "1 carro" },
            { value: "2", label: "2 carros" },
            { value: "3", label: "3 carros" },
            { value: "nao", label: "Não preciso de garagem" },
          ]}
        />
      </Field>
      <Field>
        <Label htmlFor={id1}>Tem moto, bicicleta, trailer ou outro veículo?</Label>
        <TextInput id={id1} value={data.outrosVeiculos}
          onChange={(v) => update("outrosVeiculos", v)}
          placeholder="Ex.: 2 bicicletas, 1 moto..." />
      </Field>
      <Field>
        <Label>Tipo de garagem desejada</Label>
        <RadioGroup name="tipoGaragem" value={data.tipoGaragem}
          onChange={(v) => update("tipoGaragem", v)}
          options={[
            { value: "fechada", label: "Coberta e fechada" },
            { value: "coberta_aberta", label: "Coberta, aberta nas laterais" },
            { value: "sempreferencia", label: "Sem preferência" },
          ]}
        />
      </Field>
    </>
  );
}

function Block4Externo({ data, update }) {
  const id1 = useFieldId();
  return (
    <>
      <SectionTitle id="sec-externo">Áreas Externas & Lazer</SectionTitle>
      <Field>
        <Label sub="Marque todos que se aplicam">Quais áreas externas você deseja?</Label>
        <CheckGroup name="areasExternas" value={data.areasExternas}
          onChange={(v) => update("areasExternas", v)}
          options={[
            { value: "jardim", label: "🌳 Jardim / área verde" },
            { value: "piscina", label: "🏊 Piscina" },
            { value: "churrasqueira", label: "🔥 Churrasqueira" },
            { value: "gourmet", label: "🍽️ Área gourmet externa" },
            { value: "playground", label: "🛝 Playground para crianças" },
            { value: "quadra", label: "🏀 Quadra esportiva" },
            { value: "horta", label: "🥬 Horta" },
            { value: "pets", label: "🐾 Espaço para animais de estimação" },
          ]}
        />
      </Field>
      <Field>
        <Label htmlFor={id1}>Tem animais de estimação?</Label>
        <TextInput id={id1} value={data.animaisEstimacao}
          onChange={(v) => update("animaisEstimacao", v)}
          placeholder="Ex.: 2 cachorros (porte grande), 1 gato..." />
      </Field>
    </>
  );
}

function Block4({ data, update, errors }) {
  const subSections = [
    { id: "sec-social", label: "🛋️ Social" },
    { id: "sec-cozinha", label: "🍳 Cozinha" },
    { id: "sec-quartos", label: "🛏️ Quartos" },
    { id: "sec-banheiros", label: "🚿 Banheiros" },
    { id: "sec-office", label: "💻 Office" },
    { id: "sec-garagem", label: "🚗 Garagem" },
    { id: "sec-externo", label: "🌳 Externo" },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="subnav no-print">
        {subSections.map((s) => (
          <button key={s.id} onClick={() => scrollTo(s.id)} className="subnav-pill">
            {s.label}
          </button>
        ))}
      </div>
      <Block4Social data={data} update={update} />
      <Block4Cozinha data={data} update={update} />
      <Block4Quartos data={data} update={update} errors={errors} />
      <Block4Banheiros data={data} update={update} />
      <Block4Office data={data} update={update} />
      <Block4Garagem data={data} update={update} />
      <Block4Externo data={data} update={update} />
    </>
  );
}

function Block5({ data, update, errors }) {
  return (
    <>
      <Field>
        <Label required>Algum morador tem dificuldade de locomoção, usa cadeira de rodas, bengala ou andador?</Label>
        <RadioGroup name="dificuldadeLocomocao" value={data.dificuldadeLocomocao}
          onChange={(v) => update("dificuldadeLocomocao", v)} invalid={errors.dificuldadeLocomocao}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não" },
            { value: "futuro", label: "Não agora, mas quero a casa preparada para o futuro" },
          ]} />
        {data.dificuldadeLocomocao === "sim" && (
          <div style={{ marginTop: 10 }}>
            <TextInput multiline value={data.dificuldadeLocomocaoDesc}
              onChange={(v) => update("dificuldadeLocomocaoDesc", v)}
              placeholder="Quem é e qual a necessidade específica?" rows={2} />
          </div>
        )}
      </Field>
      <Field>
        <Label>Algum morador tem deficiência visual ou auditiva?</Label>
        <TextInput multiline value={data.deficienciaVisualAuditiva}
          onChange={(v) => update("deficienciaVisualAuditiva", v)}
          placeholder="Descreva se houver..." rows={2} />
      </Field>
      <Field>
        <Label sub="Para considerar rampas, barras de apoio e pisos antiderrapantes">
          Há idosos morando ou frequentando regularmente a casa?
        </Label>
        <RadioGroup name="idosos" value={data.idosos} onChange={(v) => update("idosos", v)}
          options={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} />
      </Field>
    </>
  );
}

function Block6({ data, update }) {
  const ids = [useFieldId(), useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label htmlFor={ids[0]}>Como é a rotina da família em casa?</Label>
        <TextInput id={ids[0]} multiline value={data.rotina}
          onChange={(v) => update("rotina", v)}
          placeholder="Ex.: ficamos muito em casa, recebemos visitas todo final de semana, trabalhamos de home office, filhos têm aulas de música..."
          rows={3} />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Algum hobby que precise de espaço especial?</Label>
        <TextInput id={ids[1]} value={data.hobbies} onChange={(v) => update("hobbies", v)}
          placeholder="Ex.: academia, ateliê de pintura, sala de jogos, biblioteca, adega, sala de música..." />
      </Field>
      <Field>
        <Label>Quanto à iluminação natural, você prefere:</Label>
        <RadioGroup name="iluminacao" value={data.iluminacao}
          onChange={(v) => update("iluminacao", v)}
          options={[
            { value: "muito_iluminada", label: "Casa muito iluminada, cheia de janelas" },
            { value: "equilibrada", label: "Iluminação equilibrada" },
            { value: "fechada", label: "Ambientes mais fechados e reservados" },
            { value: "sem_preferencia", label: "Sem preferência" },
          ]} />
      </Field>
      <Field>
        <Label>Quanto à ventilação:</Label>
        <RadioGroup name="ventilacao" value={data.ventilacao}
          onChange={(v) => update("ventilacao", v)}
          options={[
            { value: "natural", label: "Prefiro casa ventilada naturalmente (janelas, aberturas)" },
            { value: "arcondicionado", label: "Pretendo usar ar condicionado em todos os ambientes" },
            { value: "ambos", label: "Quero os dois — natural e ar condicionado onde necessário" },
          ]} />
      </Field>
      <Field>
        <Label htmlFor={ids[2]}>Há alguma preocupação com ruído?</Label>
        <TextInput id={ids[2]} value={data.preocupacaoRuido}
          onChange={(v) => update("preocupacaoRuido", v)}
          placeholder="Ex.: rua movimentada, filho que toca instrumento, dormem cedo..." />
      </Field>
    </>
  );
}

function Block7({ data, update }) {
  const ids = [useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label sub="Marque as que interessam">Tem interesse em soluções sustentáveis?</Label>
        <CheckGroup name="sustentabilidade" value={data.sustentabilidade}
          onChange={(v) => update("sustentabilidade", v)}
          options={[
            { value: "solar_energia", label: "☀️ Painel solar para geração de energia elétrica" },
            { value: "solar_agua", label: "🚿 Aquecimento solar da água" },
            { value: "chuva", label: "🌧️ Reaproveitamento de água da chuva" },
            { value: "jardim_nativo", label: "🌿 Jardim com plantas nativas ou horta" },
            { value: "sem_interesse", label: "Não tenho interesse específico nisso" },
          ]} />
      </Field>
      <Field>
        <Label htmlFor={ids[0]}>Tem preferência por algum material de construção ou acabamento?</Label>
        <TextInput id={ids[0]} multiline value={data.materiaisPreferidos}
          onChange={(v) => update("materiaisPreferidos", v)}
          placeholder="Ex.: madeira, tijolo aparente, concreto, porcelanato, pedra natural..." rows={2} />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Há materiais que você definitivamente NÃO quer na casa?</Label>
        <TextInput id={ids[1]} value={data.materiaisNaoQuer}
          onChange={(v) => update("materiaisNaoQuer", v)}
          placeholder="Ex.: azulejo antigo, piso frio demais, alumínio..." />
      </Field>
    </>
  );
}

function Block8({ data, update, errors }) {
  const ids = [useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label required>Você tem um orçamento estimado para a obra?</Label>
        <RadioGroup name="orcamentoDefined" value={data.orcamentoDefined}
          onChange={(v) => update("orcamentoDefined", v)} invalid={errors.orcamentoDefined}
          options={[
            { value: "sim", label: "Sim" },
            { value: "nao", label: "Não tenho um valor definido ainda" },
            { value: "nao_informar", label: "Prefiro não informar" },
          ]} />
        {data.orcamentoDefined === "sim" && (
          <div style={{ marginTop: 10 }}>
            <TextInput value={data.orcamentoValor}
              onChange={(v) => update("orcamentoValor", v)}
              placeholder="Valor aproximado em R$..." />
          </div>
        )}
      </Field>
      <Field>
        <Label>Como pretende financiar a obra?</Label>
        <RadioGroup name="financiamento" value={data.financiamento}
          onChange={(v) => update("financiamento", v)}
          options={[
            { value: "proprio", label: "Recursos próprios (à vista)" },
            { value: "financiamento", label: "Financiamento bancário (ex.: Caixa, FGTS)" },
            { value: "misto", label: "Parte próprio, parte financiado" },
            { value: "naosai", label: "Ainda não sei" },
          ]} />
      </Field>
      <Field>
        <Label htmlFor={ids[0]}>Tem prazo para iniciar a obra ou para se mudar?</Label>
        <TextInput id={ids[0]} value={data.prazo} onChange={(v) => update("prazo", v)}
          placeholder="Ex.: quero começar em 6 meses, preciso me mudar até dezembro de 2026..." />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Alguma restrição importante que o arquiteto deve saber desde já?</Label>
        <TextInput id={ids[1]} multiline value={data.restricoes}
          onChange={(v) => update("restricoes", v)}
          placeholder="Ex.: obra deve ter barulho mínimo por conta de bebê, acesso difícil para caminhões..." rows={2} />
      </Field>
    </>
  );
}

function Block9({ data, update }) {
  const ids = [useFieldId(), useFieldId(), useFieldId()];
  return (
    <>
      <Field>
        <Label htmlFor={ids[0]}>O que você definitivamente NÃO quer na sua casa?</Label>
        <TextInput id={ids[0]} multiline value={data.naoQuer}
          onChange={(v) => update("naoQuer", v)}
          placeholder="Ambientes, soluções, materiais, cores, estilos... seja à vontade!" rows={3} />
      </Field>
      <Field>
        <Label htmlFor={ids[1]}>Já morou em casa que teve algo que amou ou que não funcionou bem?</Label>
        <TextInput id={ids[1]} multiline value={data.experienciaAnterior}
          onChange={(v) => update("experienciaAnterior", v)}
          placeholder="Ex.: adoro open space mas odeio ouvir TV da cozinha enquanto trabalho. Quarto de hóspedes que nunca usei virou depósito..."
          rows={3} />
      </Field>
      <Field>
        <Label htmlFor={ids[2]}>Alguma outra informação importante que não foi contemplada acima?</Label>
        <TextInput id={ids[2]} multiline value={data.outrasInfos}
          onChange={(v) => update("outrasInfos", v)}
          placeholder="Qualquer detalhe que ache relevante compartilhar com o arquiteto..." rows={3} />
      </Field>
    </>
  );
}

// ─── Summary com value→label ─────────────────────────────────────────────────

function lookup(field, val) {
  if (val == null || val === "") return "";
  const map = OPT_LABELS[field];
  if (!map) return val;
  if (Array.isArray(val)) return val.map((v) => map[v] || v).join(", ");
  return map[val] || val;
}

function buildSummarySections(data) {
  return [
    { title: "1. Identificação", items: [
      ["Nome", data.nomeResponsavel],
      ["Contato", data.contato],
      ["Moradores", data.qtdMoradores],
      ["Perfil", data.perfilMoradores],
      ["Mudança familiar", data.mudancaFamiliar
        ? (data.mudancaFamiliar === "sim"
          ? `Sim${data.mudancaFamiliarDesc ? `: ${data.mudancaFamiliarDesc}` : ""}`
          : lookup("mudancaFamiliar", data.mudancaFamiliar))
        : ""],
    ]},
    { title: "2. Terreno", items: [
      ["Possui terreno", lookup("possuiTerreno", data.possuiTerreno)],
      ["Endereço/tamanho", data.enderecoTerreno],
      ["Topografia", lookup("topografia", data.topografia)],
      ["Características", data.caracteristicasTerreno],
      ["Orientação solar", data.solTerreno],
      ["Vizinhança", data.vizinhanca],
    ]},
    { title: "3. Expectativas", items: [
      ["Visão da casa", data.descricaoCasa],
      ["Estilo", lookup("estiloVisual", data.estiloVisual)
        + (data.estiloVisual?.includes("outro") && data.estiloVisualOutro
          ? ` (${data.estiloVisualOutro})` : "")],
      ["Referências", lookup("temReferencias", data.temReferencias)],
      ["Pavimentos", lookup("pavimentos", data.pavimentos)],
      ["Etapas", lookup("etapasConstrucao", data.etapasConstrucao)],
    ]},
    { title: "4. Ambientes", items: [
      ["Sala de estar", lookup("salaStar", data.salaStar)
        + (data.salaStarObs ? ` — ${data.salaStarObs}` : "")],
      ["Sala de jantar", lookup("salaJantar", data.salaJantar)
        + (data.pessoasMesaNormal || data.pessoasMesaFesta
          ? ` (normal: ${data.pessoasMesaNormal || "—"}; festa: ${data.pessoasMesaFesta || "—"})`
          : "")],
      ["Varanda", data.varanda
        ? `${lookup("varanda", data.varanda)}${data.varandaUso ? ` — ${data.varandaUso}` : ""}`
        : ""],
      ["Cozinha", lookup("tipoCozinha", data.tipoCozinha)],
      ["Quem cozinha", data.quemCozinha],
      ["Eletrodomésticos especiais", data.eletrodomesticosEspeciais],
      ["Despensa", lookup("despensa", data.despensa)],
      ["Área de serviço", lookup("areaServico", data.areaServico)],
      ["Empregada", lookup("empregada", data.empregada)],
      ["Quartos", data.qtdQuartos
        ? `${data.qtdQuartos === "6" ? "6 ou mais" : data.qtdQuartos} quartos`
        : ""],
      ...(data.quartos || []).map((q, i) => [
        `  Quarto ${i + 1}`,
        [q.paraQuem, q.tamanho, q.banheiro === "sim" ? "c/ banheiro" : null,
         q.closet === "sim" ? "c/ closet" : null].filter(Boolean).join(" • "),
      ]),
      ["Suíte principal", data.suitePrincipalObs],
      ["Banheiros", data.qtdBanheiros],
      ["Lavabo", lookup("lavabo", data.lavabo)],
      ["Banheiro principal", data.banheiroPrincipalObs],
      ["Home office", lookup("homeOffice", data.homeOffice)],
      ["Tipo de escritório", lookup("tipoEscritorio", data.tipoEscritorio)],
      ["Recebe clientes", lookup("recebeClientes", data.recebeClientes)],
      ["Garagem", data.qtdCarros === "nao"
        ? "Não preciso"
        : data.qtdCarros ? `${data.qtdCarros} vaga(s)` : ""],
      ["Outros veículos", data.outrosVeiculos],
      ["Tipo de garagem", lookup("tipoGaragem", data.tipoGaragem)],
      ["Áreas externas", lookup("areasExternas", data.areasExternas)],
      ["Animais", data.animaisEstimacao],
    ]},
    { title: "5. Acessibilidade", items: [
      ["Mobilidade reduzida", data.dificuldadeLocomocao
        ? (data.dificuldadeLocomocao === "sim"
          ? `Sim${data.dificuldadeLocomocaoDesc ? ` — ${data.dificuldadeLocomocaoDesc}` : ""}`
          : lookup("dificuldadeLocomocao", data.dificuldadeLocomocao))
        : ""],
      ["Def. visual/auditiva", data.deficienciaVisualAuditiva],
      ["Idosos", lookup("idosos", data.idosos)],
    ]},
    { title: "6. Conforto & Rotina", items: [
      ["Rotina", data.rotina],
      ["Hobbies", data.hobbies],
      ["Iluminação", lookup("iluminacao", data.iluminacao)],
      ["Ventilação", lookup("ventilacao", data.ventilacao)],
      ["Ruído", data.preocupacaoRuido],
    ]},
    { title: "7. Sustentabilidade", items: [
      ["Interesse", lookup("sustentabilidade", data.sustentabilidade)],
      ["Materiais preferidos", data.materiaisPreferidos],
      ["Materiais indesejados", data.materiaisNaoQuer],
    ]},
    { title: "8. Orçamento & Prazo", items: [
      ["Orçamento", data.orcamentoDefined === "sim"
        ? `R$ ${data.orcamentoValor || "—"}`
        : lookup("orcamentoDefined", data.orcamentoDefined)],
      ["Financiamento", lookup("financiamento", data.financiamento)],
      ["Prazo", data.prazo],
      ["Restrições", data.restricoes],
    ]},
    { title: "9. Observações Finais", items: [
      ["Não quer", data.naoQuer],
      ["Experiência anterior", data.experienciaAnterior],
      ["Outras infos", data.outrasInfos],
    ]},
  ];
}

// Texto formatado para WhatsApp (usa *negrito* e _itálico_ nativos do WA)
function buildWhatsAppText(data) {
  const sections = buildSummarySections(data);
  const lines = [];
  lines.push("*🏛️ QUESTIONÁRIO — PROJETO RESIDENCIAL*");
  lines.push("_Levantamento de Necessidades (ABNT NBR 16636-1)_");
  lines.push("");

  sections.forEach((sec) => {
    const filled = sec.items.filter(([, v]) => v && String(v).trim());
    if (filled.length === 0) return;
    lines.push(`*${sec.title}*`);
    filled.forEach(([k, v]) => {
      const key = k.startsWith("  ") ? `   ↳ _${k.trim()}_` : `_${k}:_`;
      const value = k.startsWith("  ") ? v : ` ${v}`;
      lines.push(k.startsWith("  ") ? `${key} ${v}` : `• ${key}${value}`);
    });
    lines.push("");
  });

  lines.push("---");
  lines.push(`_Enviado em ${new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })}_`);
  return lines.join("\n");
}

// Texto plano para o e-mail (legível, sem markdown do WA)
function buildPlainTextSummary(data) {
  const sections = buildSummarySections(data);
  const lines = [];
  lines.push("═══════════════════════════════════════════════");
  lines.push("  QUESTIONÁRIO — PROJETO RESIDENCIAL");
  lines.push("  Levantamento de Necessidades (ABNT NBR 16636-1)");
  lines.push("═══════════════════════════════════════════════");
  lines.push("");

  sections.forEach((sec) => {
    const filled = sec.items.filter(([, v]) => v && String(v).trim());
    if (filled.length === 0) return;
    lines.push(`▸ ${sec.title.toUpperCase()}`);
    lines.push("─".repeat(45));
    filled.forEach(([k, v]) => {
      if (k.startsWith("  ")) {
        lines.push(`     ↳ ${k.trim()}: ${v}`);
      } else {
        lines.push(`  • ${k}: ${v}`);
      }
    });
    lines.push("");
  });

  lines.push("═══════════════════════════════════════════════");
  lines.push(`Enviado em ${new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })}`);
  return lines.join("\n");
}

// ─── Envio para Formspree ────────────────────────────────────────────────────

async function sendToFormspree(data, mensagemCliente) {
  if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.includes("SEU_ID_AQUI")) {
    throw new Error(
      "Endpoint do Formspree não configurado. " +
      "Edite a constante FORMSPREE_ENDPOINT no topo do arquivo App.jsx."
    );
  }

  // Tenta extrair um e-mail do campo "contato" para usar como reply-to
  const emailMatch = (data.contato || "").match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const replyTo = emailMatch ? emailMatch[0] : undefined;

  const resumo = buildPlainTextSummary(data);

  const payload = {
    _subject: `[Questionário] ${data.nomeResponsavel || "Novo cliente"} — Projeto Residencial`,
    ...(replyTo && { _replyto: replyTo }),
    nome_cliente: data.nomeResponsavel || "Não informado",
    contato_cliente: data.contato || "Não informado",
    moradores: data.qtdMoradores || "Não informado",
    orcamento: data.orcamentoDefined === "sim"
      ? `R$ ${data.orcamentoValor || "(valor em branco)"}`
      : (OPT_LABELS.orcamentoDefined[data.orcamentoDefined] || "Não informado"),
    prazo: data.prazo || "Não informado",
    mensagem_do_cliente: mensagemCliente?.trim() || "(sem mensagem adicional)",
    questionario_completo: resumo,
    dados_estruturados_json: JSON.stringify(data, null, 2),
  };

  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.errors?.length) {
        errMsg = errData.errors.map((e) => e.message).join("; ");
      } else if (errData?.error) {
        errMsg = errData.error;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }

  return res.json();
}

// ─── Modal de envio por E-mail ───────────────────────────────────────────────

function EmailModal({ data, onClose }) {
  const [mensagem, setMensagem] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      await sendToFormspree(data, mensagem);
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message || "Falha ao enviar. Verifique sua conexão.");
    }
  };

  // Trava scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fecha ao apertar Esc (somente se não estiver enviando)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && status !== "sending") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, status]);

  return (
    <div className="modal-overlay no-print" onClick={status === "sending" ? undefined : onClose}
         role="dialog" aria-modal="true" aria-labelledby="email-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div id="email-title" style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20,
              fontWeight: 700, color: "#2c1f0e",
            }}>
              ✉️ Enviar para o arquiteto
            </div>
            <div style={{
              fontFamily: "'Lora', serif", fontSize: 12,
              color: "#6b5040", marginTop: 4,
            }}>
              O questionário será enviado por e-mail para <code style={{
                background: "#f5ede2", padding: "1px 6px", borderRadius: 4,
              }}>{ARQUITETO_EMAIL}</code>
            </div>
          </div>
          {status !== "sending" && (
            <button onClick={onClose} className="modal-close" aria-label="Fechar">×</button>
          )}
        </div>

        <div className="modal-body">
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontSize: 22,
                fontWeight: 700, color: "#2c1f0e", marginBottom: 8,
              }}>
                Enviado com sucesso!
              </div>
              <div style={{
                fontFamily: "'Lora', serif", fontSize: 14,
                color: "#6b5040", lineHeight: 1.6,
              }}>
                O arquiteto receberá seu questionário por e-mail e entrará em contato em breve.<br/>
                Obrigado pelas informações! 🏡
              </div>
            </div>
          ) : (
            <>
              <Field>
                <Label sub="Opcional — algo que você queira destacar para o arquiteto">
                  Mensagem adicional
                </Label>
                <TextInput
                  multiline
                  rows={3}
                  value={mensagem}
                  onChange={setMensagem}
                  placeholder="Ex.: Aguardo seu retorno para agendarmos uma visita ao terreno..."
                />
              </Field>

              <div style={{
                background: "#fdf6ef", border: "1px solid #e8d8c8",
                borderRadius: 10, padding: 14, marginBottom: 4,
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 13,
                  fontWeight: 700, color: "#9a4f1f", marginBottom: 8,
                }}>
                  📋 Resumo do que será enviado
                </div>
                <div style={{
                  fontFamily: "'Lora', serif", fontSize: 13,
                  color: "#3a2a1a", lineHeight: 1.6,
                }}>
                  <div><strong>Nome:</strong> {data.nomeResponsavel || "—"}</div>
                  <div><strong>Contato:</strong> {data.contato || "—"}</div>
                  <div><strong>Moradores:</strong> {data.qtdMoradores || "—"}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b5040", fontStyle: "italic" }}>
                    + todas as respostas do questionário (9 blocos)
                  </div>
                </div>
              </div>

              {status === "error" && (
                <div className="alert-error" style={{ marginTop: 14 }}>
                  ⚠️ <strong>Falha ao enviar:</strong> {errorMsg}
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    Tente novamente em alguns segundos. Se o problema persistir,
                    use o WhatsApp ou imprima/salve em PDF e envie manualmente.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {status === "success" ? (
            <button onClick={onClose} className="btn-primary">
              Fechar
            </button>
          ) : (
            <>
              <button onClick={onClose} className="btn-secondary"
                      disabled={status === "sending"}>
                Cancelar
              </button>
              <button onClick={handleSend} className="btn-email"
                      disabled={status === "sending"}>
                {status === "sending" ? (
                  <><span className="spinner" /> Enviando...</>
                ) : (
                  <>✉️ Enviar agora</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers WhatsApp ────────────────────────────────────────────────────────

function normalizePhone(input) {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function WhatsAppModal({ data, onClose }) {
  const [phone, setPhone] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const text = buildWhatsAppText(data);
  const charCount = text.length;
  const tooLong = charCount > 4000;
  const warnLong = charCount > 2000 && !tooLong;

  const sendWhatsApp = () => {
    const cleanPhone = normalizePhone(phone);
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    setCopyStatus(ok ? "✓ Texto copiado!" : "✗ Falha ao copiar");
    setTimeout(() => setCopyStatus(""), 2500);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay no-print" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="wa-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div id="wa-title" style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20,
              fontWeight: 700, color: "#2c1f0e",
            }}>
              💬 Enviar por WhatsApp
            </div>
            <div style={{
              fontFamily: "'Lora', serif", fontSize: 12,
              color: "#6b5040", marginTop: 4,
            }}>
              Pré-visualize e envie o questionário ao arquiteto
            </div>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Fechar">×</button>
        </div>

        <div className="modal-body">
          <Field>
            <Label sub="Opcional — deixe em branco para escolher o contato no WhatsApp">
              Número do arquiteto (com DDD)
            </Label>
            <TextInput
              value={phone}
              onChange={setPhone}
              placeholder="Ex.: (62) 99999-9999"
            />
            {phone && (
              <div style={{
                fontSize: 11, color: "#6b5040", marginTop: 6,
                fontFamily: "'Lora', serif",
              }}>
                Será enviado para: <code style={{ background: "#f5ede2", padding: "2px 6px", borderRadius: 4 }}>
                  +{normalizePhone(phone) || "—"}
                </code>
              </div>
            )}
          </Field>

          <Field>
            <Label sub={`${charCount.toLocaleString("pt-BR")} caracteres${
              warnLong ? " — pode ser truncado em alguns dispositivos" :
              tooLong ? " — muito longo, recomendamos copiar e colar" : ""
            }`}>
              Pré-visualização da mensagem
            </Label>
            <div className="wa-preview">
              <pre>{text}</pre>
            </div>
            {(warnLong || tooLong) && (
              <div className={tooLong ? "alert-error" : "alert-warn"}>
                {tooLong
                  ? "⚠️ Mensagem muito extensa. Use o botão \"Copiar texto\" e cole manualmente no WhatsApp."
                  : "ℹ️ Mensagem longa. Se não chegar completa, use \"Copiar texto\" e cole no chat."}
              </div>
            )}
          </Field>
        </div>

        <div className="modal-footer">
          {copyStatus && (
            <span style={{
              fontSize: 13, color: copyStatus.startsWith("✓") ? "#2d7a2d" : "#c33",
              fontFamily: "'Lora', serif",
            }}>
              {copyStatus}
            </span>
          )}
          <button onClick={handleCopy} className="btn-secondary">
            📋 Copiar texto
          </button>
          <button onClick={sendWhatsApp} className="btn-whatsapp" disabled={tooLong && !phone}>
            <span style={{ fontSize: 16 }}>💬</span> Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({ data, onEdit, onPrint, onExportJSON, onWhatsApp, onEmail }) {
  const sections = buildSummarySections(data);
  const SECTION_TO_BLOCK = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏡</div>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22,
          color: "#2c1f0e", fontWeight: 700,
        }}>
          Questionário Concluído!
        </div>
        <div style={{ fontFamily: "'Lora', serif", fontSize: 14, color: "#6b5040", marginTop: 6 }}>
          Revise as informações abaixo e envie para o arquiteto.
        </div>
      </div>

      {sections.map((sec, si) => {
        const filled = sec.items.filter(([, v]) => v && String(v).trim());
        if (filled.length === 0) return null;
        return (
          <div key={si} style={{
            marginBottom: 20, border: "1.5px solid #e8d8c8",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              background: "#f5ede2", padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontSize: 14,
                fontWeight: 700, color: "#2c1f0e",
              }}>
                {sec.title}
              </span>
              <button
                onClick={() => onEdit(SECTION_TO_BLOCK[si])}
                className="no-print btn-link"
              >
                Editar
              </button>
            </div>
            <div style={{ padding: "12px 16px", background: "#fefcf9" }}>
              {filled.map(([k, v], i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, marginBottom: 6,
                  fontSize: 13, fontFamily: "'Lora', serif", color: "#3a2a1a",
                }}>
                  <span style={{ color: "#6b5040", minWidth: 160, flexShrink: 0 }}>{k}:</span>
                  <span style={{ wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {/* Botão principal: Email — é o que o arquiteto realmente quer receber */}
        <button onClick={onEmail} className="btn-email btn-email-large">
          <span style={{ fontSize: 18 }}>✉️</span> Enviar para o arquiteto (e-mail)
        </button>
        <button onClick={onWhatsApp} className="btn-whatsapp">
          <span style={{ fontSize: 16 }}>💬</span> Enviar por WhatsApp (alternativa)
        </button>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onPrint} className="btn-secondary" style={{ flex: "1 1 200px" }}>
            🖨️ Imprimir / Salvar PDF
          </button>
          <button onClick={onExportJSON} className="btn-secondary" style={{ flex: "1 1 160px" }}>
            📥 Exportar JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Validação ───────────────────────────────────────────────────────────────

function validateBlock(block, data) {
  const required = REQUIRED_FIELDS[block] || [];
  const errs = {};
  for (const f of required) {
    const val = data[f];
    if (val == null || val === "" || (Array.isArray(val) && val.length === 0)) {
      errs[f] = true;
    }
  }
  return errs;
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [current, setCurrent] = useState(1);
  const [data, setData] = useState(initialData);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const topRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const saved = await loadData();
      if (saved && typeof saved === "object") {
        setData({ ...initialData, ...saved });
        setShowRestoredToast(true);
        setTimeout(() => setShowRestoredToast(false), 4000);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveData(data), 500);
    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [data, loaded]);

  const update = (key, val) => {
    setData((d) => ({ ...d, [key]: val }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const goTo = (n) => {
    setCurrent(n);
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const next = () => {
    const errs = validateBlock(current, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    setErrors({});
    if (current < 9) goTo(current + 1);
    else setDone(true);
  };

  const prev = () => {
    if (done) { setDone(false); return; }
    if (current > 1) goTo(current - 1);
  };

  const handleNew = async () => {
    const ok = window.confirm("Tem certeza? Todas as respostas serão apagadas.");
    if (!ok) return;
    await clearData();
    setData(initialData);
    setErrors({});
    setCurrent(1);
    setDone(false);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (data.nomeResponsavel || "questionario")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    a.download = `${name}-questionario.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = done ? 100 : Math.round(((current - 1) / 9) * 100);

  const renderBlock = () => {
    switch (current) {
      case 1: return <Block1 data={data} update={update} errors={errors} />;
      case 2: return <Block2 data={data} update={update} errors={errors} />;
      case 3: return <Block3 data={data} update={update} errors={errors} />;
      case 4: return <Block4 data={data} update={update} errors={errors} />;
      case 5: return <Block5 data={data} update={update} errors={errors} />;
      case 6: return <Block6 data={data} update={update} errors={errors} />;
      case 7: return <Block7 data={data} update={update} errors={errors} />;
      case 8: return <Block8 data={data} update={update} errors={errors} />;
      case 9: return <Block9 data={data} update={update} errors={errors} />;
      default: return null;
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0e6d6; }
        button { font-family: inherit; }

        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }

        .opt-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          border: 1.5px solid #d4bfaa; background: #fefcf9;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Lora', serif; font-size: 14px; color: #2c1f0e;
        }
        .opt-card[data-selected="true"] {
          border-color: #b5622a; background: #fff3ec;
        }
        .opt-card[data-invalid="true"] { border-color: #c33; }
        .opt-card:hover { border-color: #b5622a; }
        .opt-card:focus-within {
          outline: 2px solid #b5622a; outline-offset: 2px;
        }
        .radio-dot {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid #c0a890; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .radio-dot[data-selected="true"] { border-color: #b5622a; background: #b5622a; }
        .radio-dot-inner {
          width: 6px; height: 6px; border-radius: 50%; background: white; display: block;
        }
        .check-box {
          width: 18px; height: 18px; border-radius: 4px;
          border: 2px solid #c0a890; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 12px; transition: all 0.2s;
        }
        .check-box[data-selected="true"] { border-color: #b5622a; background: #b5622a; }

        input[type="checkbox"] { accent-color: #b5622a; width: 16px; height: 16px; cursor: pointer; }

        .btn-primary {
          padding: 14px 24px; background: #b5622a; color: white;
          border: none; border-radius: 12px;
          font-family: 'Playfair Display', serif; font-size: 15px;
          font-weight: 700; cursor: pointer; letter-spacing: 0.04em;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #9a4f1f; }
        .btn-secondary {
          padding: 14px 20px; background: white; color: #2c1f0e;
          border: 1.5px solid #b5622a; border-radius: 12px;
          font-family: 'Lora', serif; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-secondary:hover:not(:disabled) { background: #fff3ec; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-link {
          background: none; border: none; color: #9a4f1f;
          cursor: pointer; font-size: 13px;
          font-family: 'Lora', serif; text-decoration: underline;
        }
        .btn-link:hover { color: #6b3814; }

        /* Botão E-mail (ação principal) */
        .btn-email {
          padding: 12px 24px; background: #b5622a; color: white;
          border: none; border-radius: 12px;
          font-family: 'Playfair Display', serif; font-size: 15px;
          font-weight: 700; cursor: pointer; letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.1s;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 2px 8px rgba(181,98,42,0.25);
        }
        .btn-email:hover:not(:disabled) {
          background: #9a4f1f; transform: translateY(-1px);
        }
        .btn-email:disabled {
          background: #c0a890; cursor: not-allowed;
          box-shadow: none; opacity: 0.7;
        }
        .btn-email-large {
          width: 100%; padding: 16px 24px; font-size: 17px;
          box-shadow: 0 4px 14px rgba(181,98,42,0.35);
        }

        /* Botão WhatsApp */
        .btn-whatsapp {
          padding: 12px 24px; background: #25d366; color: white;
          border: none; border-radius: 12px;
          font-family: 'Playfair Display', serif; font-size: 15px;
          font-weight: 700; cursor: pointer; letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.1s;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 2px 8px rgba(37,211,102,0.25);
        }
        .btn-whatsapp:hover:not(:disabled) {
          background: #1ebd5a;
          transform: translateY(-1px);
        }
        .btn-whatsapp:disabled {
          background: #b8b8b8; cursor: not-allowed;
          box-shadow: none; opacity: 0.6;
        }

        /* Spinner para envio */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 4px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(44, 31, 14, 0.55);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-card {
          background: #fefcf9;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          max-height: calc(100vh - 32px);
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: modalIn 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2);
          overflow: hidden;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e8d8c8;
          background: #fdf6ef;
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px;
        }
        .modal-close {
          background: transparent; border: none;
          width: 32px; height: 32px; border-radius: 50%;
          font-size: 22px; line-height: 1;
          color: #6b5040; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .modal-close:hover { background: #e8d8c8; color: #2c1f0e; }
        .modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 14px 24px;
          border-top: 1px solid #e8d8c8;
          background: #fdf6ef;
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; flex-wrap: wrap;
        }

        .wa-preview {
          background: #ece5dd;
          border: 1px solid #d4bfaa;
          border-radius: 10px;
          padding: 14px 16px;
          max-height: 280px;
          overflow-y: auto;
          font-family: 'Lora', serif;
        }
        .wa-preview pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: #1f1f1f;
        }

        .alert-warn, .alert-error {
          margin-top: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-family: 'Lora', serif;
          font-size: 13px;
        }
        .alert-warn {
          background: #fff8e6; border: 1.5px solid #d4a72c; color: #6b4f00;
        }
        .alert-error {
          background: #fee; border: 1.5px solid #c33; color: #922;
        }

        .subnav {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 8px; padding-bottom: 12px;
          border-bottom: 1px dashed #e8d8c8;
        }
        .subnav-pill {
          padding: 5px 10px; border-radius: 16px;
          border: 1px solid #d4bfaa; background: white;
          color: #6b5040; font-size: 11px; cursor: pointer;
          font-family: 'Lora', serif; transition: all 0.15s;
        }
        .subnav-pill:hover { border-color: #b5622a; color: #b5622a; }

        .step-pill {
          padding: 6px 12px; border-radius: 20px;
          border: 1.5px solid #d4bfaa; background: transparent;
          color: #6b5040; font-family: 'Lora', serif; font-size: 12px;
          cursor: pointer; white-space: nowrap; transition: all 0.2s;
        }
        .step-pill:hover { border-color: #b5622a; color: #b5622a; }
        .step-pill[data-current="true"] {
          background: #b5622a; color: white; border-color: #b5622a; font-weight: 600;
        }
        .step-pill[data-complete="true"] {
          border-color: #7a8c3e;
          background: #f4f7e8;
          color: #4a5e1f;
        }
        .step-pill[data-current="true"][data-complete="true"] {
          background: #b5622a; color: white; border-color: #b5622a;
        }

        .resp-grid-2 {
          display: grid; gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }
        .resp-grid-quartos {
          display: grid; gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }

        [data-block-anchor] { scroll-margin-top: 140px; }

        .toast {
          position: fixed; top: 80px; left: 50%;
          transform: translateX(-50%);
          background: #2c1f0e; color: #f5c98a;
          padding: 10px 18px; border-radius: 24px;
          font-family: 'Lora', serif; font-size: 13px;
          z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          animation: toastIn 0.3s ease;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .error-msg {
          background: #fee;
          border: 1.5px solid #c33;
          color: #922;
          padding: 10px 14px;
          border-radius: 10px;
          font-family: 'Lora', serif;
          font-size: 13px;
          margin-bottom: 16px;
        }

        @media (max-width: 480px) {
          .footer-title { display: none; }
          .footer-btn { padding: 10px 16px !important; font-size: 14px !important; }
        }

        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .header-sticky { position: static !important; box-shadow: none !important; }
          .progress-bar { display: none !important; }
          .footer-fixed { display: none !important; }
          .content-wrap { padding-bottom: 20px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0e6d6 0%, #fdf6ef 60%, #ede0ce 100%)" }}>

        {showRestoredToast && (
          <div className="toast no-print">
            ✓ Suas respostas anteriores foram restauradas
          </div>
        )}

        <div className="header-sticky" style={{
          background: "#2c1f0e", padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          boxShadow: "0 2px 12px rgba(44,31,14,0.3)",
        }}>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif", color: "#f5c98a",
              fontSize: 18, fontWeight: 700, letterSpacing: "0.02em",
            }}>
              🏛️ Projeto Residencial
            </div>
            <div style={{
              fontFamily: "'Lora', serif", color: "#d4bfaa",
              fontSize: 11, marginTop: 2,
            }}>
              Levantamento de Necessidades — ABNT NBR 16636-1
            </div>
          </div>
          {!done && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Lora', serif", color: "#f5c98a", fontSize: 12 }}>
                Bloco {current} de 9
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4bfaa", fontSize: 11 }}>
                {progress}% concluído
              </div>
            </div>
          )}
        </div>

        {!done && (
          <div className="progress-bar" style={{ height: 4, background: "#d4bfaa" }}>
            <div style={{
              height: "100%", background: "#b5622a", width: `${progress}%`,
              transition: "width 0.4s ease", borderRadius: "0 4px 4px 0",
            }} />
          </div>
        )}

        {!done && (
          <div className="no-print" style={{
            background: "#fdf6ef", borderBottom: "1px solid #e8d8c8",
            overflowX: "auto", display: "flex",
            padding: "10px 16px", gap: 6, justifyContent: "center",
          }}>
            {BLOCKS.map((b) => {
              const blockErrors = validateBlock(b.id, data);
              const blockComplete = Object.keys(blockErrors).length === 0
                && (REQUIRED_FIELDS[b.id]?.length > 0);
              return (
                <button
                  key={b.id}
                  onClick={() => goTo(b.id)}
                  className="step-pill"
                  data-current={current === b.id}
                  data-complete={blockComplete && current !== b.id}
                  aria-current={current === b.id ? "step" : undefined}
                >
                  {b.icon} {b.short}
                  {blockComplete && current !== b.id && " ✓"}
                </button>
              );
            })}
          </div>
        )}

        <div ref={topRef} data-block-anchor className="content-wrap"
          style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 120px" }}>

          {!done && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 26,
                  fontWeight: 700, color: "#2c1f0e",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span>{BLOCKS[current - 1].icon}</span>
                  <span>{BLOCKS[current - 1].title}</span>
                </div>
                <div style={{
                  height: 3, width: 50, background: "#b5622a",
                  borderRadius: 2, marginTop: 8,
                }} />
              </div>

              {hasErrors && (
                <div className="error-msg" role="alert">
                  ⚠️ Por favor, preencha os campos obrigatórios destacados antes de continuar.
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); next(); }}
                style={{
                  background: "white", borderRadius: 16, padding: 24,
                  boxShadow: "0 4px 24px rgba(44,31,14,0.08)",
                  border: "1px solid #ede0ce",
                }}>
                {renderBlock()}
                <button type="submit" className="sr-only" tabIndex={-1}>Próximo</button>
              </form>
            </>
          )}

          {done && (
            <div style={{
              background: "white", borderRadius: 16, padding: 24,
              boxShadow: "0 4px 24px rgba(44,31,14,0.08)",
              border: "1px solid #ede0ce",
            }}>
              <Summary
                data={data}
                onEdit={(n) => { setDone(false); goTo(n); }}
                onPrint={() => window.print()}
                onExportJSON={handleExportJSON}
                onWhatsApp={() => setShowWhatsApp(true)}
                onEmail={() => setShowEmail(true)}
              />
            </div>
          )}
        </div>

        <div className="no-print footer-fixed" style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(253,246,239,0.97)", backdropFilter: "blur(8px)",
          borderTop: "1px solid #e8d8c8", padding: "12px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 12, zIndex: 100, boxShadow: "0 -4px 16px rgba(44,31,14,0.08)",
        }}>
          <button
            onClick={prev}
            disabled={current === 1 && !done}
            aria-disabled={current === 1 && !done}
            className="footer-btn"
            style={{
              padding: "12px 24px", borderRadius: 10,
              border: "1.5px solid #d4bfaa",
              background: "transparent",
              color: (current === 1 && !done) ? "#c0a890" : "#2c1f0e",
              fontFamily: "'Lora', serif", fontSize: 15,
              cursor: (current === 1 && !done) ? "not-allowed" : "pointer",
              opacity: (current === 1 && !done) ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            ← Anterior
          </button>

          {!done && (
            <span className="footer-title" style={{
              fontFamily: "'Lora', serif", fontSize: 13, color: "#6b5040",
              textAlign: "center", flex: 1,
            }}>
              {BLOCKS[current - 1].title}
            </span>
          )}

          {!done ? (
            <button
              onClick={next}
              className="footer-btn"
              style={{
                padding: "12px 28px", borderRadius: 10,
                background: "#b5622a", color: "white",
                border: "none",
                fontFamily: "'Playfair Display', serif", fontSize: 15,
                fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s", letterSpacing: "0.03em",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#9a4f1f"}
              onMouseOut={(e) => e.currentTarget.style.background = "#b5622a"}
            >
              {current === 9 ? "Finalizar ✓" : "Próximo →"}
            </button>
          ) : (
            <button
              onClick={handleNew}
              className="footer-btn"
              style={{
                padding: "12px 24px", borderRadius: 10,
                background: "#2c1f0e", color: "#f5c98a",
                border: "none",
                fontFamily: "'Playfair Display', serif", fontSize: 14,
                fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em",
              }}
            >
              Novo Questionário
            </button>
          )}
        </div>

        {showWhatsApp && (
          <WhatsAppModal data={data} onClose={() => setShowWhatsApp(false)} />
        )}

        {showEmail && (
          <EmailModal data={data} onClose={() => setShowEmail(false)} />
        )}
      </div>
    </>
  );
}
