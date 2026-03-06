# Resumo Executivo - Sistema de Pedidos Off-Grid

**Data**: 06/03/2026
**Versão**: 1.0
**Status**: Planejamento Completo

---

## 🎯 Problema

Restaurantes que operam em locais sem internet confiável ou desejam autonomia total precisam de um sistema de pedidos que funcione **100% offline**, acessível por múltiplos dispositivos (totems, tablets, PCs) em rede local.

---

## 💡 Solução Proposta

Sistema web de pedidos rodando em **servidor local** (PC Windows da gerência), acessado via navegador por dispositivos na rede LAN/Wi-Fi. Sem dependência de internet ou servidores externos.

### Interfaces

| Interface | Usuário | Função |
|-----------|---------|--------|
| **Kiosk** | Cliente | Autoatendimento em totem touch |
| **Staff** | Funcionário | Registro rápido de pedidos no balcão |
| **Admin** | Gerente | Gestão completa do sistema |

---

## 🏗️ Arquitetura Simplificada

```
Totems/Tablets/PCs (Browser)
         ↓ HTTP
   PC Central (Windows)
   • Node.js API
   • SQLite Database
```

**Vantagens:**
- ✅ Zero dependência externa
- ✅ Baixo custo (sem mensalidades de SaaS)
- ✅ Total controle dos dados
- ✅ Performance máxima (rede local)

---

## 🛠️ Tecnologias (Moderna, Produtiva, Confiável)

- **Backend**: Node.js + TypeScript + Fastify
- **Database**: SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Autenticação**: JWT
- **Hospedagem**: Self-hosted (PC Windows)

---

## 📊 Funcionalidades MVP

### Kiosk (Cliente)
- Navegação por categorias
- Visualização de itens com fotos e preços
- Personalização (adicionais, observações)
- Carrinho com cálculo em tempo real
- Confirmação e número do pedido

### Staff (Funcionário)
- Login autenticado
- Criação rápida de pedidos (balcão)
- Monitoramento de pedidos em tempo real
- Atualização de status (Preparando → Pronto → Entregue)

### Admin (Gerente)
- Dashboard com métricas (vendas, pedidos, ticket médio)
- CRUD de cardápio (itens, categorias, preços)
- Gestão de combos
- Marcar itens como disponível/indisponível
- Relatórios básicos

---

## 💰 Estimativa de Custo e Tempo

### Desenvolvimento
- **Duração**: 6-8 semanas (1,5 a 2 meses)
- **Equipe**: 1-2 desenvolvedores full-stack
- **Custo**: [Definir conforme taxa/hora]

### Infraestrutura
- **PC Central**: R$ 3.000 - R$ 5.000 (Windows 10/11, i5, 8GB RAM, SSD)
- **Tablet Staff**: R$ 1.000 - R$ 1.500 por unidade
- **Totem Touch**: R$ 2.000 - R$ 4.000 por unidade (monitor + mini PC)
- **Roteador Wi-Fi**: R$ 300 - R$ 800 (profissional)
- **Total Hardware**: ~R$ 10.000 - R$ 20.000 (depende da quantidade)

### Operacional
- **Custos Recorrentes**: Zero (sem mensalidades de SaaS)
- **Manutenção**: Apenas eventuais ajustes/features novas

---

## 📈 Benefícios Esperados

### Operacionais
- ⏱️ **Redução de filas** em 30%+
- 📉 **Redução de erros** em pedidos (50%+)
- 🚀 **Atendimento mais rápido** (3x mais pedidos/hora)
- 👥 **Menos carga sobre funcionários**

### Negócio
- 💵 **Aumento de ticket médio** (cliente adiciona mais itens sozinho)
- 📊 **Dados estruturados** para relatórios e tomada de decisão
- 🎯 **Promoções dinâmicas** (combos, ofertas especiais)
- 🔒 **Controle total** dos dados (LGPD)

---

## 🚀 Roadmap

### Fase MVP (6-8 semanas)
- ✅ Todas as 3 interfaces funcionais
- ✅ Cardápio completo (itens + combos simples)
- ✅ Cálculo automático de preços
- ✅ Autenticação e controle de acesso

### Pós-MVP (Futuro)
- 🔄 Tempo real via WebSocket (sem refresh manual)
- 💳 Integração de pagamentos (PIX, cartão)
- 🖨️ Impressão automática de comandas (cozinha)
- 📊 Relatórios avançados (gráficos, exportação)
- 🏪 Multi-loja (se houver expansão)

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Wi-Fi instável | Alto | Roteador profissional, retry logic |
| PC central travado | Alto | Processo como serviço, no-break (UPS) |
| Resistência da equipe | Médio | Treinamento, UX intuitiva |
| Cardápio muito grande | Baixo | Paginação, busca, cache |

---

## 📋 Critérios de Sucesso

### Técnicos
- ✅ Uptime > 99% durante operação
- ✅ Tempo de resposta < 200ms (rede local)
- ✅ Suportar 10+ dispositivos simultâneos

### Negócio
- ✅ Cliente faz pedido sozinho em < 3 minutos
- ✅ Funcionário registra pedido em < 1 minuto
- ✅ Satisfação da equipe (pesquisa interna)
- ✅ ROI positivo em 6 meses

---

## 🎓 Diferencial Competitivo

### vs SaaS Cloud (iFood, Aiqfome, etc.)
- ✅ Sem dependência de internet
- ✅ Sem taxa mensal recorrente
- ✅ Total controle dos dados
- ✅ Customização ilimitada

### vs PDV Tradicional
- ✅ Autoatendimento (reduz fila)
- ✅ Interface moderna e touch
- ✅ Dados estruturados para análise
- ✅ Expansível para delivery futuro

---

## 📞 Próximos Passos

1. **Validar** este planejamento com stakeholders
2. **Aprovar** orçamento e timeline
3. **Contratar** equipe de desenvolvimento
4. **Iniciar** Fase 1 (Setup e estrutura)
5. **Acompanhar** progresso semanalmente
6. **Deploy** em ambiente de teste (soft launch)
7. **Produção** após validação final

---

## 📄 Documentação Completa

Este resumo faz parte de uma documentação técnica detalhada:

- [README.md](../README.md) - Visão geral do projeto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura técnica
- [DATA_MODEL.md](./DATA_MODEL.md) - Modelo de dados
- [PRICING_RULES.md](./PRICING_RULES.md) - Regras de precificação
- [SCREENS_WIREFLOW.md](./SCREENS_WIREFLOW.md) - Wireframes
- [PAYMENT_STRATEGY.md](./PAYMENT_STRATEGY.md) - Estratégia de pagamento
- [MVP_ROADMAP.md](./MVP_ROADMAP.md) - Roadmap detalhado

---

## ✅ Recomendação

Este projeto é **tecnicamente viável**, **comercialmente interessante** e **perfeitamente adequado** para restaurantes que desejam autonomia e controle total do sistema de pedidos.

**Recomenda-se aprovação para início imediato.**

---

**Preparado por**: [Arquiteto de Software]
**Data**: 06/03/2026
**Contato**: [email@exemplo.com]
