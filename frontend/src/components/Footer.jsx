import React from 'react';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="footer-brand-title">
              <span>Quadro de Diárias e Bicos</span>
            </h4>
            <p className="footer-text">
              Plataforma que conecta contratantes e trabalhadores autônomos com transparência, valor fechado e contato direto.
            </p>
          </div>

          <div>
            <h5 className="footer-heading">Compromisso</h5>
            <ul className="footer-links">
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                <ShieldCheck size={14} color="#38bdf8" />
                <span>Oportunidades restritas (+18)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                <HeartHandshake size={14} color="#34d399" />
                <span>Remuneração clara e diária fechada</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                <ShieldCheck size={14} color="#f472b6" />
                <span>Contato direto sem taxas ocultas</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">Navegação Rápida</h5>
            <ul className="footer-links">
              <li><a href="/">Mural de Vagas</a></li>
              <li><a href="/demandas/nova">Anunciar Nova Diária</a></li>
              <li><a href="/painel">Painel de Gestão</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {CURRENT_YEAR} Quadro de Diárias e Bicos — Conectando oportunidades e serviços autônomos.</p>
        </div>
      </div>
    </footer>
  );
}
