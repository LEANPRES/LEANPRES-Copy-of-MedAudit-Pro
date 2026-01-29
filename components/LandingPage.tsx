
import React from 'react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Altura da navbar fixa
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-brand-primary selection:text-white">
      {/* Navbar com Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 bg-brand-dark rounded-2xl flex items-center justify-center font-black text-brand-secondary shadow-xl group-hover:rotate-6 transition-transform">M</div>
            <span className="text-xl font-black text-brand-dark tracking-tighter uppercase">MedAudit <span className="text-brand-primary">Pro</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <a 
              href="javascript:void(0)" 
              onClick={(e) => scrollToSection(e, 'solucao')}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
            >
              A Solução
            </a>
            <a 
              href="javascript:void(0)" 
              onClick={(e) => scrollToSection(e, 'ia')}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
            >
              Motor Cognitivo
            </a>
            <a 
              href="javascript:void(0)" 
              onClick={(e) => scrollToSection(e, 'governança')}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
            >
              Governança
            </a>
            <button 
              onClick={onLoginClick}
              className="bg-brand-dark text-white px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-brand-primary hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Acessar Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: O Coração da Tecnologia */}
      <section className="relative pt-44 pb-32 px-6 bg-brand-dark overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 animate-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-secondary"></span>
              </span>
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Padrão TISS 3.05.01 Ativo</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter">
              AUDITORIA <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-primary">COGNITIVA.</span>
            </h1>
            
            <p className="text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              O MedAudit Pro une o poder do Gemini 3.0 Pro à regulação médica brasileira para liberar guias em segundos, garantindo 100% de rastreabilidade e economia real.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button onClick={onLoginClick} className="bg-brand-primary text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_50px_rgba(0,153,93,0.3)] hover:bg-brand-secondary hover:text-brand-dark hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group">
                Explorar Dashboard
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
              <button className="bg-white/5 border border-white/10 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                Assista ao Pitch
              </button>
            </div>
          </div>
          
          {/* Mockup flutuante da IA */}
          <div className="hidden lg:block relative animate-in zoom-in-95 duration-1000 delay-300">
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 p-10 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
               <div className="space-y-8">
                 <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="bg-brand-secondary text-brand-dark px-4 py-1 rounded-full text-[8px] font-black uppercase">Análise em Tempo Real</div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="h-4 bg-white/10 rounded-full w-full"></div>
                    <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                    <div className="h-4 bg-white/10 rounded-full w-4/6"></div>
                 </div>

                 <div className="bg-brand-primary/20 border border-brand-primary/30 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black">AI</div>
                      <div>
                        <div className="text-[10px] font-black text-brand-secondary uppercase">Parecer Gemini 3.0</div>
                        <div className="text-white font-black text-xs uppercase">Confiança: 98.4%</div>
                      </div>
                    </div>
                    <p className="text-brand-secondary text-[11px] font-bold italic leading-relaxed">
                      "Divergência identificada: Os materiais solicitados (OPME) não possuem correlação técnica com o CID-10 informado no laudo médico anexo."
                    </p>
                 </div>
               </div>
            </div>
            {/* KPI Floats */}
            <div className="absolute -top-12 -right-6 bg-brand-accent p-8 rounded-[2.5rem] shadow-2xl rotate-6 animate-bounce duration-[4000ms]">
               <div className="text-[9px] font-black text-white/60 uppercase mb-1">SLA ANS</div>
               <div className="text-3xl font-black text-white">2.4 min</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Dores e Benefícios */}
      <section id="solucao" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-brand-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">A Nova Era da Auditoria</h2>
            <h3 className="text-4xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter">O Fim dos Processos Manuais e Inseguros.</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                title: "Gargalos de SLA", 
                desc: "Elimine a fila de triagem. Nossa IA separa o 'joio do trigo', permitindo que o auditor foque apenas no que é divergente.",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "bg-rose-50 text-brand-accent"
              },
              { 
                title: "Incerteza Técnica", 
                desc: "Padronize decisões com base em evidências. O motor cognitivo aplica diretrizes de utilização (DUT) em cada item.",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                color: "bg-blue-50 text-brand-dark"
              },
              { 
                title: "Vazamento de Receita", 
                desc: "Detecte procedimentos desnecessários ou inflados antes da autorização. Economia preventiva real para a operadora.",
                icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                color: "bg-emerald-50 text-brand-primary"
              }
            ].map((card, i) => (
              <div key={i} className="group p-12 rounded-[4rem] border-2 border-slate-50 hover:border-brand-primary/20 hover:bg-slate-50 transition-all duration-500">
                <div className={`w-20 h-20 ${card.color} rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.icon} /></svg>
                </div>
                <h4 className="text-2xl font-black text-brand-dark mb-6 uppercase tracking-tight">{card.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep AI Section */}
      <section id="ia" className="py-40 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/10 blur-[150px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center relative z-10">
          <div className="space-y-10">
            <h2 className="text-brand-secondary font-black text-[10px] uppercase tracking-[0.3em]">Inteligência Gemini 3.0 Pro</h2>
            <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">A IA que entende de <span className="text-brand-secondary">Medicina.</span></h3>
            <p className="text-lg text-slate-400 leading-relaxed font-medium">
              Diferente de IAs genéricas, o MedAudit foi treinado no ecossistema de saúde brasileiro. Ele compreende a semântica de prontuários, laudos e tabelas TISS simultaneamente.
            </p>
            <div className="grid gap-6">
              {[
                "Análise Multimodal: Interpreta textos, exames de imagem e tabelas.",
                "Raciocínio Clínico: Cruza CID-10 com pertinência de materiais.",
                "Explicação Médica: Fornece a justificativa para cada recomendação."
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-5 p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-dark font-black text-xs">{i+1}</div>
                  <span className="font-bold text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dashboard Preview */}
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-4 shadow-2xl overflow-hidden">
               <div className="bg-brand-dark p-8 rounded-[2.5rem] space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase">Processando Fila Especializada</div>
                    <div className="text-brand-secondary font-black text-xs">ONLINE</div>
                  </div>
                  <div className="space-y-4">
                     {[80, 100, 60].map((w, i) => (
                       <div key={i} className="h-2 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-primary animate-pulse" style={{ width: `${w}%`, animationDelay: `${i*200}ms` }}></div>
                       </div>
                     ))}
                  </div>
                  <div className="p-6 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                     <div className="flex gap-4 items-center mb-4">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-black">AI</div>
                        <div className="text-xs font-black uppercase">Decisão Automática</div>
                     </div>
                     <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed">
                       "Baseado na DUT 12.1 da ANS, o procedimento 3.10.09.16-6 exige comprovação radiológica que não foi identificada no arquivo 'raio-x.pdf'."
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Section / Governança */}
      <section id="governança" className="py-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
          <div className="bg-brand-primary/5 p-16 rounded-[4rem] border-2 border-brand-primary/10">
            <div className="text-[10px] font-black text-brand-primary uppercase mb-4">Para o Auditor Médico</div>
            <h4 className="text-3xl font-black text-brand-dark mb-6 uppercase tracking-tight">Foco Total na Decisão Clínica</h4>
            <p className="text-slate-600 font-medium leading-relaxed mb-8">
              Livre-se da burocracia de procurar documentos. Receba o dossiê pronto, com a análise prévia da IA e um chat técnico para coligar com a operadora.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-black text-brand-dark uppercase tracking-tight">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Fila por Especialidade
              </div>
              <div className="flex items-center gap-3 text-xs font-black text-brand-dark uppercase tracking-tight">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Painel de Apoio à Decisão (IA)
              </div>
            </div>
          </div>
          
          <div className="bg-brand-dark p-16 rounded-[4rem] text-white">
            <div className="text-[10px] font-black text-brand-secondary uppercase mb-4">Para o Gestor de Auditoria</div>
            <h4 className="text-3xl font-black mb-6 uppercase tracking-tight">Visibilidade e Governança 360º</h4>
            <p className="text-white/60 font-medium leading-relaxed mb-8">
              Acompanhe KPIs de SLA, economia gerada por auditor e performance das operadoras em tempo real através de dashboards gerenciais robustos.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-tight">
                <svg className="w-5 h-5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Arquitetura Multi-tenant (Segregação)
              </div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-tight">
                <svg className="w-5 h-5 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Rastreabilidade Total (Timeline)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto bg-brand-primary rounded-[5rem] p-20 text-center relative overflow-hidden shadow-[0_50px_100px_rgba(0,153,93,0.3)]">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>
          
          <div className="relative z-10 space-y-10">
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Pronto para o <br /> futuro da auditoria?</h2>
            <p className="text-xl text-white/80 font-bold max-w-2xl mx-auto uppercase">
              Junte-se às operadoras que já reduziram custos em 30% no primeiro semestre.
            </p>
            <button 
              onClick={onLoginClick}
              className="bg-brand-dark text-white px-16 py-8 rounded-[3rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-brand-secondary hover:text-brand-dark transition-all scale-110"
            >
              Começar agora gratuitamente
            </button>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center font-black text-brand-secondary">M</div>
            <span className="text-2xl font-black uppercase tracking-tighter text-brand-dark">MedAudit <span className="text-brand-primary">Pro</span></span>
          </div>
          <div className="flex gap-12">
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Legal</h5>
              <ul className="space-y-4 text-[11px] font-bold text-slate-600 uppercase">
                <li><a href="javascript:void(0)" className="hover:text-brand-primary">Termos de Uso</a></li>
                <li><a href="javascript:void(0)" className="hover:text-brand-primary">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Suporte</h5>
              <ul className="space-y-4 text-[11px] font-bold text-slate-600 uppercase">
                <li><a href="javascript:void(0)" className="hover:text-brand-primary">Documentação</a></li>
                <li><a href="javascript:void(0)" className="hover:text-brand-primary">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">© 2024 MEDAUDIT PRO GOVERNANCE</p>
            <p className="text-[9px] font-bold text-brand-primary uppercase mt-1">SISTEMA DE ALTA DISPONIBILIDADE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
