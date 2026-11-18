import { useState } from 'react';
import {
  Braces,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  Copy,
  Check,
  Download,
  Webhook,
  Play,
  Loader2,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  Layers,
  Cpu
} from 'lucide-react';
import {
  DOMAIN_PRESETS,
  runStructuredExtraction,
  type DomainPresetId,
  type ExtractionBatchResult,
  type StructuredRecord
} from './services/extractionEngine';

type ActiveTab = 'cards' | 'json' | 'table';

export function App() {
  const [selectedDomain, setSelectedDomain] = useState<DomainPresetId>('cx-delivery');
  const [inputText, setInputText] = useState<string>(DOMAIN_PRESETS[0].sampleInput);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<ExtractionBatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('cards');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showSchema, setShowSchema] = useState<boolean>(false);

  const currentPreset =
    DOMAIN_PRESETS.find(preset => preset.id === selectedDomain) || DOMAIN_PRESETS[0];

  const handleDomainChange = (id: DomainPresetId) => {
    setSelectedDomain(id);
    const found = DOMAIN_PRESETS.find(p => p.id === id);
    if (found) {
      setInputText(found.sampleInput);
      setResult(null);
    }
  };

  const handleExtract = async () => {
    if (!inputText.trim() || isProcessing) return;
    setIsProcessing(true);
    const extracted = await runStructuredExtraction(inputText, selectedDomain, webhookUrl);
    setResult(extracted);
    setIsProcessing(false);
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.batch_id.toLowerCase()}-structured.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    const headers = [
      'ID',
      'Dominio',
      'Categoria',
      'Urgencia',
      'Sentimento',
      'Confianca_%',
      'Fila_Destino',
      'Entidades_Extraidas',
      'Acao_Recomendada'
    ];
    const rows = result.records.map(r => [
      r.record_id,
      r.domain,
      r.category,
      r.urgency,
      r.sentiment,
      r.confidence_score,
      `"${r.routing_queue}"`,
      `"${r.entities.map(e => `${e.type}:${e.value}`).join(' | ')}"`,
      `"${r.recommended_action}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.batch_id.toLowerCase()}-triagem.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUrgencyBadge = (urgency: StructuredRecord['urgency']) => {
    switch (urgency) {
      case 'CRÍTICA':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'ALTA':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'MÉDIA':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-400/30 text-indigo-300">
              <Braces className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
                  Structura<span className="text-indigo-400">AI</span>
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Unstructured → JSON Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Extração Estruturada de Dados, Classificação Semântica & Roteamento Operacional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              AI Builder: <strong className="text-slate-200">Rafael Trajano</strong>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Domain Selector Pills */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1322] border border-slate-800/90 p-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {DOMAIN_PRESETS.map(preset => {
              const active = preset.id === selectedDomain;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleDomainChange(preset.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      active ? 'bg-indigo-500/50 text-indigo-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowSchema(!showSchema)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {showSchema ? 'Ocultar Contrato Schema' : `Schema: ${currentPreset.schemaName}`}
          </button>
        </section>

        {/* Collapsible JSON Schema Contract */}
        {showSchema && (
          <section className="bg-[#0b1120] border border-indigo-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Contrato de Saída Estruturada ({currentPreset.schemaName})
              </span>
              <span className="text-[11px] text-slate-400">Strict Type Enforcement</span>
            </div>
            <pre className="text-xs font-mono text-emerald-300/90 bg-[#060911] p-3 rounded-xl border border-slate-800 overflow-x-auto">
              {JSON.stringify(currentPreset.schemaDefinition, null, 2)}
            </pre>
          </section>
        )}

        {/* Main Two-Column Studio */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Raw Unstructured Input (5 cols) */}
          <div className="lg:col-span-5 bg-[#0c1322] border border-slate-800/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Texto Bruto / Não Estruturado
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedDomain === 'batch-triage' ? 'Separe itens com ---' : 'Entrada livre'}
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={9}
              placeholder="Cole aqui relatos de clientes, ocorrências operacionais, e-mails ou chamados bagunçados..."
              className="w-full bg-[#060911] border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500/70"
            />

            {/* Optional Webhook Integration */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                Webhook de Destino — n8n / Make (Opcional)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://hook.us1.make.com/..."
                className="w-full bg-[#060911] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <button
              onClick={handleExtract}
              disabled={isProcessing || !inputText.trim()}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraindo & Validando Schema...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Extrair Dados Estruturados
                </>
              )}
            </button>
          </div>

          {/* Right Column: Structured Output Studio (7 cols) */}
          <div className="lg:col-span-7 bg-[#0c1322] border border-slate-800/90 rounded-2xl p-5 min-h-[470px] flex flex-col justify-between">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400">
                  <Braces className="w-8 h-8" />
                </div>
                <h2 className="text-base font-semibold text-slate-200">
                  Pronto para Estruturar Dados
                </h2>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Selecione um cenário operacional acima ou cole qualquer relato livre à esquerda. O motor extrairá entidades, classificará urgência e gerará JSON + CSV prontos para integração.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Top Metrics & Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {result.total_records} {result.total_records === 1 ? 'Registro' : 'Registros'}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                      {result.latency_ms}ms
                    </span>
                    {result.critical_count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {result.critical_count} Crítico(s)
                      </span>
                    )}
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-[#060911] p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveTab('cards')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        activeTab === 'cards'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Triagem
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        activeTab === 'json'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Braces className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        activeTab === 'table'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Tabela
                    </button>
                  </div>
                </div>

                {/* TAB 1: Visual Triage Cards */}
                {activeTab === 'cards' && (
                  <div className="space-y-4 max-h-[430px] overflow-y-auto pr-1">
                    {result.records.map(rec => (
                      <div
                        key={rec.record_id}
                        className="bg-[#060911] border border-slate-800/90 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-indigo-400">
                              {rec.record_id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                              {rec.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-400 font-mono">
                              IA {rec.confidence_score}%
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getUrgencyBadge(
                                rec.urgency
                              )}`}
                            >
                              {rec.urgency}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{rec.summary}</p>

                        {/* Extracted Entity Pills */}
                        {rec.entities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {rec.entities.map((ent, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-200 border border-indigo-500/25 font-mono"
                              >
                                <Tag className="w-3 h-3 text-indigo-400" />
                                <span className="text-indigo-400">{ent.type}:</span> {ent.value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-400">
                            Fila: <strong className="text-slate-200">{rec.routing_queue}</strong>
                          </span>
                          <span className="text-emerald-300 inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {rec.recommended_action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: Strict JSON Output */}
                {activeTab === 'json' && (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <button
                        onClick={handleCopyJson}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      >
                        {copiedJson ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            JSON Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                            Copiar Payload JSON
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-[#060911] border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300/90 max-h-[390px] overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}

                {/* TAB 3: Structured Table View */}
                {activeTab === 'table' && (
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
                          <th className="p-3 font-semibold">ID</th>
                          <th className="p-3 font-semibold">Categoria</th>
                          <th className="p-3 font-semibold">Urgência</th>
                          <th className="p-3 font-semibold">Entidades</th>
                          <th className="p-3 font-semibold">Fila Destino</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-[#060911]">
                        {result.records.map(rec => (
                          <tr key={rec.record_id} className="hover:bg-slate-900/40">
                            <td className="p-3 font-mono text-indigo-400 whitespace-nowrap">
                              {rec.record_id}
                            </td>
                            <td className="p-3 text-slate-200 font-medium">{rec.category}</td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyBadge(
                                  rec.urgency
                                )}`}
                              >
                                {rec.urgency}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-300">
                              {rec.entities.length
                                ? rec.entities.map(e => e.value).join(', ')
                                : '—'}
                            </td>
                            <td className="p-3 text-slate-300">{rec.routing_queue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Export Action Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Pipeline: <span className="text-slate-300">{result.model_pipeline}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Baixar JSON
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;