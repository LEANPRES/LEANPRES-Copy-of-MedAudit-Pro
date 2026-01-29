
import { GoogleGenAI, Type } from "@google/genai";
import { AuditRequest, AIDecisionSupport, AIRule } from "../types";

export class AuditAIService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeRequest(request: AuditRequest, activeRules: AIRule[]): Promise<AIDecisionSupport> {
    const ai = this.getAI();
    
    const documentSummary = request.documents
      .filter(d => d.files && d.files.length > 0)
      .map(d => `${d.name} (${d.files.length} arquivo(s): ${d.files.map(f => f.name).join(', ')})`)
      .join('; ');

    const rulesText = activeRules
      .filter(r => r.is_active)
      .map(r => `- [PRIORIDADE ${r.priority}]: ${r.title}. ${r.description}`)
      .join('\n');

    const systemInstruction = `Atue como um Auditor Médico sênior brasileiro especializado em regulação e auditoria prospectiva. 
    Sua tarefa é analisar a pertinência técnica desta solicitação com base nas evidências clínicas, documentais e REGRAS DE GOVERNANÇA DA GESTORA. 
    O retorno deve ser estritamente técnico e fundamentado em evidências.`;

    const prompt = `
      Analise a seguinte solicitação de auditoria médica:

      DADOS DO PROTOCOLO:
      - Beneficiário: ${request.beneficiary.name}
      - CID-10: ${request.cid10}
      - Resumo Clínico: "${request.clinicalSummary}"
      - Itens Solicitados: ${request.items.map(i => `${i.procedure.code} - ${i.procedure.description} (Qtd: ${i.quantityRequested})`).join(', ')}
      - Evidências Documentais: [${documentSummary || "ALERTA: NENHUM DOCUMENTO ANEXADO"}]

      [REGRAS INTELIGENTES DO MASTER ADMIN - OBRIGATÓRIO SEGUIR]:
      ${rulesText || "Nenhuma regra customizada ativa. Siga as diretrizes padrão da ANS (DUT)."}

      DIRETRIZES DE ANÁLISE:
      1. ANALISE OS DOCUMENTOS: Verifique se os arquivos (Laudo, Biópsia, TCLE) sugerem evidências para o CID informado.
      2. CONSIDERE AS REGRAS ACIMA: As Regras Inteligentes do Master Admin têm soberania sobre o julgamento geral da IA.
      3. INSUFICIÊNCIA DOC: Se faltar documento essencial e a regra exigir, recomende REJECT ou PARTIAL.
      4. APOIO À DECISÃO: Explique como as regras e anexos corroboram ou não a indicação.

      Forneça a resposta exclusivamente em JSON estruturado conforme o esquema solicitado.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 32768 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendation: { type: Type.STRING, enum: ['APPROVE', 'REJECT', 'PARTIAL'] },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              regulatoryReferences: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
            },
            required: ["recommendation", "confidence", "reasoning", "regulatoryReferences"]
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("Resposta vazia da IA");
      return JSON.parse(text);
    } catch (error) {
      console.error("Erro na análise da IA:", error);
      return {
        recommendation: 'PARTIAL',
        confidence: 0,
        reasoning: "Não foi possível processar a análise técnica via IA seguindo as regras inteligentes. Realize a conferência manual.",
        regulatoryReferences: ["Protocolo de Contingência - Falha na Injeção de Regras IA"]
      };
    }
  }
}

export const auditAIService = new AuditAIService();
