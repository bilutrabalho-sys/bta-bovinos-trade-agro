import { useState } from 'react'
import { sounds } from '@/utils/sound'
import { BTALogo, Ic, Btn } from '@/components'

export function TermsScreen({ onAccept }: { onAccept: () => void }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const canProceed = acceptedTerms && acceptedPrivacy

  const termsText = `TERMOS DE USO — BTA (Bovinos Trade Agro)

Última atualização: agosto de 2026

1. ACEITAÇÃO DOS TERMOS
Ao utilizar a plataforma BTA, você concorda integralmente com estes Termos de Uso. Caso não concorde, não utilize o serviço.

2. DESCRIÇÃO DO SERVIÇO
A BTA é uma plataforma digital de intermediação de negócios pecuários que conecta compradores e vendedores de gado, oferecendo ferramentas de análise de mercado, simulação financeira, educação e logística.

3. ELEGIBILIDADE
O uso da plataforma é restrito a pessoas físicas ou jurídicas com capacidade legal para realizar transações comerciais. O usuário deve ter ao menos 18 anos e possuir documentação regular junto aos órgãos fiscalizadores da pecuária (IMA, ADAF, ADUFA, ADAPAR, conforme o estado).

4. CADASTRO E SEGURANÇA
O usuário é responsável pela veracidade das informações cadastradas. Informações falsas implicam suspensão imediata da conta. O compartilhamento de credenciais de acesso é proibido.

5. TRANSAÇÕES E RESPONSABILIDADE
A BTA atua como intermediária tecnológica. As negociações são realizadas diretamente entre as partes. A BTA não se responsabiliza por divergências de peso, saúde animal, documentação sanitária ou inadimplência, exceto nos serviços expressamente garantidos (BTA Verified, BTA Log).

6. DADOS E PRIVACIDADE
O tratamento de dados segue a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Os dados são utilizados exclusivamente para prestação dos serviços e melhoria da experiência.

7. PROPRIEDADE INTELECTUAL
Todo o conteúdo da plataforma — marcas, textos, algoritmos, dados de mercado e BTA Score — é propriedade da BTA e protegido por lei.

8. LIMITAÇÃO DE RESPONSABILIDADE
A BTA não garante a disponibilidade ininterrupta do serviço e não se responsabiliza por perdas decorrentes de oscilações de mercado, decisões de negócio tomadas com base nos dados da plataforma, ou falhas de conectividade.

9. RESCISÃO
A BTA reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem aviso prévio.

10. FORO
Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer conflitos decorrentes desta relação, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bta-bg">
      {/* Header */}
      <div className="header-dark px-5 pt-12 pb-6">
        <div className="flex items-end gap-3 mb-5">
          <BTALogo dark size="md" />
          <p className="text-white/30 text-[9px] font-display font-semibold tracking-[0.16em] uppercase mb-1">Bovinos Trade Agro</p>
        </div>
        <h1 className="font-display font-black text-white text-2xl" style={{ letterSpacing: '-0.025em' }}>Termos de Uso</h1>
        <p className="text-white/40 text-xs mt-1">Leia com atenção antes de continuar.</p>
      </div>

      {/* Terms content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4 mb-4">
          <pre className="text-bta-muted text-xs leading-relaxed whitespace-pre-wrap font-sans">{termsText}</pre>
        </div>

        {/* Privacy Policy summary */}
        <div className="bg-bta-surface rounded-2xl border border-bta-border p-4 mb-6">
          <p className="font-display font-bold text-bta-text text-sm mb-2">Política de Privacidade</p>
          <p className="text-bta-muted text-xs leading-relaxed">
            Coletamos dados de cadastro, comportamento na plataforma e informações de negociação para prestar e melhorar nossos serviços, conforme a LGPD. Não vendemos seus dados a terceiros. Você pode solicitar a exclusão dos seus dados a qualquer momento pelo e-mail privacidade@bta.agr.br.
          </p>
        </div>
      </div>

      {/* Checkboxes + CTA */}
      <div className="px-5 pb-10 pt-4 bg-bta-surface border-t border-bta-border space-y-4">
        <button
          onClick={() => { sounds.select(); setAcceptedTerms(t => !t) }}
          className="flex items-start gap-3 text-left w-full"
        >
          <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${acceptedTerms ? 'bg-bta-primary border-bta-primary' : 'bg-bta-bg border-bta-border'}`}>
            {acceptedTerms && <Ic.Check />}
          </div>
          <p className="text-bta-text text-xs leading-relaxed">
            Li e aceito os <span className="text-bta-primary font-semibold">Termos de Uso</span> da plataforma BTA.
          </p>
        </button>

        <button
          onClick={() => { sounds.select(); setAcceptedPrivacy(p => !p) }}
          className="flex items-start gap-3 text-left w-full"
        >
          <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${acceptedPrivacy ? 'bg-bta-primary border-bta-primary' : 'bg-bta-bg border-bta-border'}`}>
            {acceptedPrivacy && <Ic.Check />}
          </div>
          <p className="text-bta-text text-xs leading-relaxed">
            Li e aceito a <span className="text-bta-primary font-semibold">Política de Privacidade</span>, incluindo o tratamento dos meus dados conforme a LGPD.
          </p>
        </button>

        <Btn
          sound="cta"
          onClick={onAccept}
          disabled={!canProceed}
          className={`w-full font-display font-bold text-base py-4 rounded-xl transition-all ${canProceed ? 'bg-bta-primary text-white' : 'bg-bta-border text-bta-muted cursor-not-allowed'}`}
        >
          Aceitar e continuar
        </Btn>

        <p className="text-bta-muted text-[10px] text-center leading-relaxed">
          Ao continuar você confirma que tem 18 anos ou mais e possui autorização para realizar negócios pecuários.
        </p>
      </div>
    </div>
  )
}
